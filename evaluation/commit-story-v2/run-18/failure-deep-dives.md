# Failure Deep-Dives — Run-18

**Run-18 result**: 11 committed, 4 failed, 0 partial, 15 correct skips.

All four failures share the same root cause: the NDS-003 reconciler's line-offset calculation breaks when `startActiveSpan` wrapping adds re-indented lines inside a function body. The reconciler counts those re-indented lines as both "removed from original" and "added as instrumentation," inflating the cumulative offset. Later in the file, the reconciler looks for original closing delimiters at positions past where they actually appear — producing phantom "original line N missing" errors.

This is the RUN17-1 reconciler gap, unresolved.

---

## File 1: src/generators/summary-graph.js

**Failure**: NDS-003 — original line 485 missing/modified: `}),`
**Attempts**: 2 ($1.00)

### What the agent tried

The agent instrumented `dailySummaryNode`, `generateDailySummary`, `weeklySummaryNode`, `generateWeeklySummary`, `monthlySummaryNode`, and `generateMonthlySummary` — six exported async functions. Each uses `tracer.startActiveSpan(...)` wrapping. The function bodies are 30–90 lines of LangGraph state machine logic, and each span wrapper re-indents the full function body.

### Root cause

summary-graph.js uses LangGraph's pattern of passing large callbacks as arguments. The structure includes multi-line callback arguments like:

```javascript
const node = new SomeNode(
  config,
  async (state) => {
    // ... 30–60 lines ...
  }
);
```

When `startActiveSpan` wraps the inner async body, all 30–60 original lines get re-indented. The NDS-003 reconciler processes each re-indented line as:
- Original line at old position: **missing** (inflates "missing" count)
- New line with extra indentation: **added** (inflates offset counter)

After processing all six function bodies this way, the cumulative offset overflows far enough that the reconciler looks for line `}),` at position 485 in the instrumented output — but position 485 is past where that line actually appears.

### Why attempt 2 also failed

The validator's error message (visible on attempt 2) names line 485 as the first failure, but the actual root cause is spread across all six span-wrapped functions preceding it. The agent cannot fix this by changing anything at line 485 — the offset inflation accumulates across the entire file.

### Signal for PRD #845

summary-graph.js has 6 functions with span wrappers, each re-indenting a large body. This is the densest example of the reconciler gap in the codebase. The content-aware diff (PRD #845) must handle multi-function files with multiple span wrappers, not just single-function cases.

---

## File 2: src/mcp/tools/context-capture-tool.js

**Failure**: NDS-003 oscillation — original lines 124–125 missing: `},` and `);`
**Attempts**: 3 ($0.24)
**Pattern**: Same on all 3 attempts (oscillation flag)

### Original structure

```text
saveContext (lines 72–87):
  async function saveContext(text) {
    const now = new Date();
    const filePath = getContextPath(now);
    await mkdir(dirname(filePath), { recursive: true });
    const entry = formatContextEntry(text, now);
    await appendFile(filePath, entry, 'utf-8');
    return filePath;
  }

registerContextCaptureTool (lines 87–121):
  server.tool(
    'journal_capture_context',
    ...,
    async ({ text }) => {
      try {
        const savedPath = await saveContext(text);
        return { content: [...] };  ← },  at line 107
      } catch (error) {
        return { content: [...] };
      }
    }        ← line 119
  );         ← line 120
}            ← line 121
```

### What the agent did

The agent correctly identified `saveContext` as a COV-004 target (async I/O, no exported orchestrator). It wrapped `saveContext` with `startActiveSpan`, adding ~8 lines (try/catch/finally + span.end). In the debug dump, `saveContext` spans lines 72–95 (was 72–87), adding 8 lines.

The `registerContextCaptureTool` body is unchanged — no re-indentation there. BUT the re-indented lines inside `saveContext`'s span callback (original 2-space indent → 6-space in wrapped version) inflate the reconciler's offset by ~8 additional positions.

### Why lines 124–125 in the reconciler's view

The reconciler tracks: after `saveContext` ends at dump line 95, offset is +8 (8 extra lines). When it reaches `registerContextCaptureTool` (dump lines 101–135), it adds 8 to each original line number:

- Original line 107 (`          },`) → expected at dump line 107+8=115. But at dump line 115, the content is `        return {` (NOT `},`).

The cumulative double-counting from re-indented lines pushes the expected position further to 124. At dump line 124, the content is `        return {` (the error catch return start), not `          },`.

Lines 125 (`  );`) follows the same pattern — expected at dump line 125 but wrong content there.

### Why it oscillates

On every attempt, the agent adds the same `startActiveSpan` wrapper to `saveContext`. Every wrapper produces the same re-indented body. Every attempt produces the same reconciler failure at the same positions. The fix is not detectable by the agent from the error message alone — the message names lines 124–125 but the root cause is the re-indentation inside `saveContext` earlier in the file.

---

## File 3: src/mcp/tools/reflection-tool.js

**Failure**: NDS-003 oscillation — original lines 116–117 missing: `},` and `);`
**Attempts**: 3 ($0.23)
**Pattern**: Identical to context-capture-tool.js

### Structure

reflection-tool.js is the reflection-writing counterpart to context-capture-tool.js. It has:
- `saveReflection` (async, lines 64–74): writes a journal reflection entry
- `registerReflectionTool` (lines 81–113): registers the MCP handler

The agent correctly wrapped `saveReflection` with `startActiveSpan`. The same re-indentation pattern inflates the offset. The validator reports failure at lines 116–117 (`},` and `);`) — the closing delimiters of the `server.tool()` call inside `registerReflectionTool`.

**On attempt 3**, the agent correctly identified: "I'm realizing the original file likely has trailing blank lines beyond the stated 114 lines — the validator is checking that lines 116 and 117 are reproduced exactly." This is a misread — lines 116–117 are NOT blank; they are `},` and `);`. The agent's mental model of the file structure drifted because the reconciler error message referenced positions past the file content. The oscillation flag fired because all three attempts produced the same errors.

### Signal for PRD #845 (same as context-capture-tool.js)

Both MCP tool files fail for the same reason. The pattern is: `saveX` (async file I/O, 8–12 lines) wrapped with `startActiveSpan` → re-indentation inflates offset → closing delimiters of the `registerXTool`'s `server.tool()` call reported as missing.

The two files will always fail together until the reconciler handles re-indented span wrappers correctly.

---

## File 4: src/index.js

**Failure**: NDS-003 — original lines 217 and 375 missing/modified: `);` and `},`
**Attempts**: 2 ($0.61)

### What the agent tried

The agent's target was `main()` — the CLI entry point. COV-001 overrides RST-006, so `main()` gets a span despite `process.exit()` calls. The span wraps the function body with `tracer.startActiveSpan('commit_story.cli.main', async (span) => { ... })`.

### Root cause: collapsed multi-line imports on attempt 1

index.js has several multi-line import blocks:

```javascript
// Original (lines 26–35):
import {
  saveJournalEntry,
  discoverReflections,
} from './managers/journal-manager.js';
import {
  isJournalEntriesOnlyCommit,
  isMergeCommit,
  shouldSkipMergeCommit,
  isSafeGitRef,
} from './utils/commit-analyzer.js';
```

On attempt 1, the agent collapsed these into single-line imports, shifting every subsequent line number by ~8. The validator detected this immediately — line 217 in the original (`    console.error(...)`) appeared at the wrong position in the instrumented output.

### Why attempt 2 also failed

The agent's attempt 2 thinking correctly identified the collapsed imports and reconstructed the multi-line forms. But the output still fails at lines 217 and 375. The debug dump at line 217 shows `    return fallback;` (from `getPreviousCommitTime`) rather than the expected content from original line 217. This indicates that at least one import block was partially collapsed (or a different multi-line structure was still joined), causing the offset to drift before reaching line 217.

Line 375 failure (`},`) is a second offset error further into the file — likely another multi-line structure (method chain, object literal, or conditional expression) that was collapsed in attempt 2.

### Key difference from the MCP tool files

context-capture-tool.js and reflection-tool.js fail from re-indentation inside a span wrapper. index.js fails from line collapse during the import phase — a different manifestation of the NDS-003 sensitivity. The `main()` function itself (500+ lines) also re-indents when wrapped, but the collapse errors fire first, before the reconciler reaches the span wrapper body.

---

## Run-Level Observations

### Push Failure: Pre-push Hook Created a Commit

spiny-orb's auto-push to GitHub failed. Full chain:

1. Security check ran → **PASSED**
2. Tests ran (565/565) → **PASSED**
3. `progress-md-pr.sh` hook fired → auto-committed a PROGRESS.md update to the instrument branch and printed "Committed PROGRESS.md update. Push again to include it." → exited non-zero
4. git returned `error: failed to push some refs` → spiny-orb logged "Push failed — skipping PR creation" and gave up

The hook creates a new commit mid-push; spiny-orb doesn't retry. Any target repo with a "commit-then-exit-1" pattern in pre-push hooks will trigger this. The fix belongs in spiny-orb: catch the "Committed X update. Push again" pattern and retry. Manual token push picked up the PROGRESS.md commit and succeeded. PR #70 was created manually.

A journal entry was also created at `commit-story-v2/journal/entries/2026-05/2026-05-16.md` as a side effect of commit-story running from the hook environment — expected behavior, gitignored.

### Live-check: 3848 Advisory Findings

575 spans captured across 11 committed files, 3848 advisory findings from the live-check pass. This is high — the advisory rules include things like CDQ-007 (optional chaining guards), CDQ-006 (isRecording checks), and SCH-001 (schema extension flags). The advisory count will be analyzed during per-file evaluation. The blocking rules all passed (no advisory-pass blocking failures in the committed files).
