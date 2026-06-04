# Failure Deep-Dives — Run-21

**Run-21 result**: 12 committed, 2 failed, 0 partial, 16 correct skips.

Two file-level failures, both NDS-003:

| File | Attempts | Violation count | Root cause |
|------|----------|-----------------|------------|
| src/mcp/server.js | 3 | 5 | New NDS-003 variant after PR #905 fix — JSDoc + McpServer constructor area |
| src/index.js | 2 | 152 + NDS-005 | Agent expanded single-line imports to multi-line format |

No partial files. No push/PR failure.

---

## File Failures

### src/mcp/server.js — NDS-003 (new variant, PR #905 partially fixed)

**Oscillation trigger**: `NDS-003 (×5) at NDS-003:2, NDS-003:3, NDS-003:31, NDS-003:33, NDS-003:34` — same 5 violations across all 3 attempts.

#### Context: RUN20-1 fix status

PR #905 (`removeOtelImports` trivia-loss fix) resolved the run-20 failure class: in run-20, the NDS-003 validator reported violations at lines 1, 3–20, 37, 39 — the shebang and the entire 18-line file-level JSDoc block were stripped along with the OTel import, causing the `normalizedStripped` file to be 21 lines shorter than `normalizedOriginal`. PR #905 fixes this by detecting and transferring leading file-level trivia to the next statement before removing a first-position OTel import.

In run-21, the shebang (line 1) is preserved correctly — the run-20 trivia-loss behavior is gone. The PR #905 fix landed and worked for its stated scope.

#### New failure: violations at lines 2, 3, 31, 33, 34

The original `src/mcp/server.js` structure:
```text
Line 1:  #!/usr/bin/env node
Line 2:  /**
Line 3:   * Commit Story MCP Server
Lines 4–21: (18-line file-level JSDoc block)
Line 22:  (blank)
Line 23: import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
Line 26: import { registerContextCaptureTool } from './tools/context-capture-tool.js';
Line 27: (blank)
Line 28: /**
Line 29:  * Create and configure the MCP server
Line 30:  * @returns {McpServer}
Line 31:  */
Line 32: function createServer() {
Line 33:   const server = new McpServer({
Line 34:     name: 'commit-story',
Line 35:     version: '2.0.0',
Line 36:   });
```

The agent's approach (all 3 attempts):
- Adds `import { trace, SpanStatusCode } from '@opentelemetry/api';` at line 23
- Adds `const tracer = trace.getTracer('commit-story');` + a blank line after the import block
- This shifts original line 28 (`/**` for createServer JSDoc) → new position 31

The debug dump for attempt 3 shows the agent correctly preserved the file-level JSDoc (lines 2–21), the McpServer constructor (multi-line format), and the shebang. However, the oscillation detection fired — the same 5 violations appeared across all 3 attempts.

**Likely mechanism**: The NDS-003 forward check reconstructs the original by removing instrumentation lines from the instrumented output. When the tracer declaration and its surrounding blank line are added, the reconstruction leaves an extra blank line between the import block and the `/**` comment at what was original line 28. This extra blank shifts subsequent original lines by one position, causing the `*/` (original line 31) to appear at line 34 in the stripped output, and lines 33–34 (McpServer constructor) to appear at 36–37. The NDS-003 violations at original lines 31, 33, 34 follow directly.

**Why violations at original lines 2 and 3?** These lines are before the addition point (line 23) and appear identical in both the debug dump and the original. The most likely explanation is that the NDS-003 check also performs a reverse scan when it detects line-count mismatches — flagging lines that are "anchors" for the misalignment, including lines at or near the file's JSDoc block. This behavior was not present for most files because those files have import-first structures (no pre-import JSDoc). The file-level JSDoc preceding imports is a structural pattern unique to `mcp/server.js` and `index.js` in this target repo.

**Not a content-modification failure**: The debug dump for attempt 3 shows correct output. The failure is in the NDS-003 check's handling of blank line insertion adjacent to the file's leading JSDoc structure — a validator algorithm issue, not an agent content error.

**Status**: Two independent NDS-003 issues on this file:
1. ~~Run-20 trivia-loss (line 1)~~ — **fixed by PR #905** ✅
2. New variant (lines 2, 3, 31, 33, 34) — **unresolved**, requires investigation of NDS-003 check algorithm when blank lines are added adjacent to a file's pre-import JSDoc block

**RUN20-5 watch (SCH-001)**: mcp/server.js failed again, so the SCH-001 finding from run-20 (inconsistent registered span name) is unverifiable this run. The agent's attempt 3 used `commit_story.mcp.server_start` — consistent with attempt 1's schema extension note.

---

### src/index.js — NDS-003 (new failure: single-line import expansion)

**Failure message**: `NDS-003: original line 25 missing/modified: import {` — 152 NDS-003 violations plus 1 NDS-005, 2 attempts.

#### Context: RUN20-3 dependency (COV-005 subcommand attribute)

index.js was clean in runs 17–20. Run-20 had index.js succeed with a COV-005 failure (the `commit_story.cli.subcommand` attribute was dropped under NDS-003 pressure from the run-20 trivia-loss bug). The expectation for run-21 was that with PR #905 fixed, the agent would commit cleanly without NDS-003 pressure — and recover the subcommand attribute.

Instead, index.js failed outright in run-21 — a new failure class.

#### Root cause: single-line imports expanded to multi-line

The original `src/index.js` (lines 20–29) has three wide single-line import statements:
```javascript
import { saveJournalEntry, discoverReflections } from './managers/journal-manager.js';
import { isJournalEntriesOnlyCommit, isMergeCommit, shouldSkipMergeCommit, isSafeGitRef } from './utils/commit-analyzer.js';
import { parseSummarizeArgs, runSummarize, runWeeklySummarize, runMonthlySummarize, showSummarizeHelp } from './commands/summarize.js';
```

The agent in attempt 1 wrote these as multi-line blocks:
```javascript
import {
  saveJournalEntry,
  discoverReflections
} from './managers/journal-manager.js';
import {
  isJournalEntriesOnlyCommit,
  isMergeCommit,
  shouldSkipMergeCommit,
  isSafeGitRef
} from './utils/commit-analyzer.js';
import {
  parseSummarizeArgs,
  runSummarize,
  runWeeklySummarize,
  runMonthlySummarize,
  showSummarizeHelp
} from './commands/summarize.js';
```

Each 1-line import became a 4–6 line block, adding ~14 new lines in the import section. These added lines shifted every subsequent original line, triggering 152 NDS-003 violations for all lines that now appeared at wrong positions.

The agent also added `const tracer = trace.getTracer("commit-story");` at module scope — this is instrumentation, not the source of the violations.

**Attempt 2** (from agent thinking): The agent recognized the multi-line import problem explicitly: "The NDS-003 failures are because I collapsed multi-line statements onto single lines. I need to preserve the exact original line layout." The agent attempted to use the NDS-003 error messages to reconstruct what the original looked like — treating the validator's output as a guide to the file structure. However, this backwards-inference approach failed: attempt 2 either produced the same expansion errors or introduced a different restructuring that triggered the same set of violations.

The NDS-005 violation in the last attempt indicates the agent also removed or restructured a try/catch block, compounding the NDS-003 failures.

**Why did this happen on run-21 but not runs 17–20?**

The most likely cause is context pollution from PRD #902 (auto-registration). PRD #902 produced ~60 new schema extensions across the run. By the time `src/index.js` is processed (file 30 of 30, processed last), the accumulated schema context contains hundreds of attributes and span names from all prior files. The agent appears to have reformatted import statements in a style consistent with code it was generating — treating the wide single-line imports as something to "fix" for readability. In prior runs, index.js was instrumented earlier in the batch (or with less accumulated schema context), and the agent preserved the original formatting.

The agent's attempt 1 thinking shows it correctly identified `main()` as the COV-001 entry point and planned `commit_story.cli.main` with `commit_story.cli.subcommand` — the correct approach. The failure is purely in import formatting, not in instrumentation design.

**RUN20-3 (COV-005 subcommand attribute)**: Unverifiable. The agent declared `span.commit_story.cli.main` and `commit_story.cli.subcommand` in schema extensions across both attempts, and the attempt 1 thinking confirms the subcommand attribute was planned correctly. The fix intent is confirmed; the file failed before it could commit.

---

## Run-Level Observations

### Attempt rate — dramatic improvement

3-attempt rate: 1/12 committed files (8%), down from run-20's 46% (6/13).

| File | Run-20 attempts | Run-21 attempts |
|------|-----------------|-----------------|
| context-integrator.js | 3 | 1 |
| journal-manager.js | 3 | 1 |
| summarize.js | — (new) | 3 |

The files that drove run-20's high retry rate recovered to 1 attempt. The NDS-003 contamination hypothesis from run-20 is partially confirmed: removing the trivia-loss pressure reduced retries for files that previously needed multiple passes to avoid related errors. `summarize.js` is the only new 3-attempt file — it committed successfully with 50K output tokens and a namespace inconsistency in agent notes (`commit_story.commands.*` in notes vs `commit_story.summary.*` in registered schema extensions), noted for per-file evaluation.

### PRD #902 schema self-reinforcement

The `entries_count` attribute registered by `summary-graph.js` early in the run was reused cleanly by four subsequent files. This is the first run with visible schema self-reinforcement: attributes registered in one file were recognized as semantically valid for different files' use cases. The weekly_summaries_count semantic stretch in `summary-detector.js` (used for monthly context) is the first observed case of a schema key being extended beyond its original semantic scope — a watch item for PRD #22.

### Sensitive-filter.js and reflection-tool.js span drops

Both files had spans in run-20 but are now correct skips (0 spans). The run summary notes both were refactored to sync-only between runs. These are not regressions — the target repo changed. This is consistent with the expected behavior that refactored-to-sync files should produce RST-001 correct skips.
