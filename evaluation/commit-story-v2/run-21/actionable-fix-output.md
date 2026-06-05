# Actionable Fix Output — Run-21

Self-contained handoff from evaluation run-21 to the spiny-orb team.

**Run-21 result**: 23/25 (92%) canonical quality, 12 committed, 0 partial, 2 failed, 42 spans, ~$8.10 cost. Gates 5/5. IS 90/100. Q×F 11.0.

**Run-20 → Run-21 delta**: Quality -4pp (96% → 92%), CDQ -14pp (7/7 → 6/7), IS +10pp (80/100 → 90/100), cost -$0.98 ($9.08 → $8.10), 3-attempt rate -38pp (46% → 8%). Push #74 (13th consecutive fully automatic).

**Target repo**: commit-story-v2 (same as runs 9–21)
**Branch**: `spiny-orb/instrument-1780596389399`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/74
**spiny-orb version**: 1.0.0 (SHA 9f3f6b9, main branch)

---

## §1. Run-21 Score Summary

| Dimension | Score | Run-20 | Delta |
|-----------|-------|--------|-------|
| NDS | 2/2 (100%) | 2/2 (100%) | — |
| COV | **4/5 (80%)** | 4/5 (80%) | — |
| RST | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 4/4 (100%) | 4/4 (100%) | — |
| CDQ | **6/7 (86%)** | 7/7 (100%) | **-14pp** |
| **Total** | **23/25 (92%)** | **24/25 (96%)** | **-4pp** |
| **Gates** | **5/5** | **5/5** | **—** |
| **Files** | **12+2f** | **12+1f** | — |
| **Cost** | **~$8.10** | **$9.08** | **-$0.98** |
| **IS** | **90/100** | **80/100** | **+10pp** |
| **Q×F** | **11.0** | **11.5** | **-0.5** |

---

## §2. Prior Findings Assessment

| # | Finding | Priority | Status in Run-21 |
|---|---------|----------|-----------------|
| RUN20-1 | mcp/server.js NDS-003 false positive — `stripOtelNodes` trivia-loss bug | P1 | **PARTIALLY RESOLVED** — PR #905 fixed the shebang/line-1 trivia-loss; a new independent NDS-003 variant emerged (blank-line-near-JSDoc, lines 2/3/31/33/34); see RUN21-1 |
| RUN20-2 | High 3-attempt rate — 46% of files at 3 attempts | P2 | **RESOLVED** — rate dropped from 46% (6/13) to 8% (1/12). Files that blocked in run-20 (context-integrator, journal-manager) took 1 attempt each |
| RUN20-3 | index.js COV-005 — `commit_story.cli.subcommand` dropped under NDS-003 pressure | P2 | **UNVERIFIABLE** — index.js failed to commit (NDS-003 import expansion; see RUN21-2). Agent intent confirmed via schema extensions + thinking. Entering 3rd consecutive run without verifiable result; now tracked as RUN21-5 |
| RUN20-4 | summary-manager.js read-path COV-005 — input-only labels | P3/Watch | **RESOLVED** — readWeekDailySummaries now sets week_label + output count; readMonthWeeklySummaries sets month_label + output count. Remaining COV-005 on summary-manager.js is a different gap (saveDailySummary skip-path; see RUN21-4) |
| RUN20-5 | mcp/server.js SCH-001 recurring — unregistered span name across runs 18–20 | P3/Watch | **UNVERIFIABLE** — mcp/server.js failed again. Attempt 3 used `commit_story.mcp.server_start` — registered in agent-extensions.yaml across all 3 attempts. Span name consistency may be improving, but file cannot commit while NDS-003 blocks it |
| RUN19-2 | git-collector.js COV-005 — getCommitData missing output attributes | P2 | **RESOLVED** — PRD #902 auto-registration produced git-collector.js with 6 spans including getCommitData, is_merge, parent_count, and full CommitData return value attributes. Three-run watch broken |
| IS SPA-002 | Orphan span — partial instrumentation creates context gap | P2 | **RESOLVED** — SPA-002 passes in run-21. No orphan span detected. Context propagation gap from runs 19–20 did not recur |
| IS SPA-001 | INTERNAL span count structural | Structural | **STRUCTURAL** — 11 INTERNAL spans vs limit of 10; same calibration mismatch as prior runs, not a regression target |

---

## §3. New Run-21 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN21-1 | mcp/server.js NDS-003 — new blank-line-near-JSDoc variant after PR #905 | P1 | Validator / NDS-003 |
| RUN21-2 | index.js NDS-003 + NDS-005 — context pollution / import expansion | P1 | Agent Quality / Validator |
| RUN21-3 | CDQ-001 regression — claude-collector.js double-end in startActiveSpan callback | P2 | Code Quality / CDQ-001 |
| RUN21-4 | COV-005 — summary-manager.js saveDailySummary zero attributes on skip path | P2 | Coverage |
| RUN21-5 | index.js COV-005 — subcommand attr unverifiable for 3rd consecutive run (watch) | Watch | Coverage |
| RUN21-6 | Agent notes vs committed code divergence — two instances (watch) | Watch | Observability |

---

### RUN21-1: mcp/server.js NDS-003 — New Blank-Line-Near-JSDoc Variant After PR #905 (P1)

**What happened**: mcp/server.js failed all 3 attempts for the second consecutive run. PR #905 fixed the run-20 failure class (shebang + line-1 trivia-loss; `shebang present: false`). In run-21, the shebang is preserved (line 1 correct), but new NDS-003 violations appear at lines 2, 3, 31, 33, and 34 — consistent across all 3 attempts. The agent's instrumented output was correct across all attempts; debug dump confirmed.

**Structural trigger**: The original mcp/server.js has: shebang (line 1) + blank line (line 2) + 18-line file-level JSDoc block (lines 3–20) before imports, followed by a multi-line `new McpServer(...)` constructor call at lines 32–36. When the agent adds `import { trace, SpanStatusCode } from '@opentelemetry/api'` and `const tracer = tracer.getTracer(...)` after the existing imports (insertion at approximately line 23), the McpServer constructor's preceding JSDoc block shifts forward. The NDS-003 forward-check fires on the blank line (line 2) and JSDoc-adjacent lines (3, 31, 33, 34) — positions that appear at wrong offsets in the stripped-vs-original diff.

**Difference from run-20 failure**: Run-20 violations were at lines 1, 3–20, 37, 39 (trivia-loss of shebang + full JSDoc block). Run-21 violations are at lines 2, 3, 31, 33, 34 (blank-line and JSDoc boundary alignment). PR #905 fixed the first class but did not address the second. Both stem from the same structural pattern: insertion of tracer declarations adjacent to a file-level JSDoc block.

**Impact**: mcp/server.js has contributed 0 committed spans for 2 consecutive runs. Q×F reaches only 11.0 (12 files × 23/25) vs a target of 12.5 (13 files × 24/25). The file has been clean in at least runs 18–19 and is now blocked for a third consecutive run.

**Required fix**: Continue debugging the NDS-003 check algorithm in `nds003-ast-stripper.ts` for files that have a blank line between the shebang and a file-level JSDoc block. The specific triggering structure is: `shebang` → `blank line` → `multi-line JSDoc block (18 lines)` → `imports` → `tracer declarations inserted here` → `McpServer constructor (multi-line, JSDoc-preceded)`. A regression fixture is available: `evaluation/commit-story-v2/run-21/debug-dumps/server.js` (all 3 attempts produce identical output, so any attempt is sufficient as a fixture).

---

### RUN21-2: index.js NDS-003 + NDS-005 — Context Pollution / Import Expansion (P1)

**What happened**: index.js failed to commit for the second consecutive run, the first failure on this file since run-16. In attempt 1, the agent expanded three wide single-line `import {` statements into multi-line blocks, adding approximately 14 new lines in the import section and triggering 152 NDS-003 violations. Attempt 2 could not reconstruct the exact original formatting and introduced an NDS-005 violation (try/catch restructuring). The file was clean in runs 17–20.

**The agent's instrumentation intent was correct across both attempts**: `commit_story.cli.main` span with `commit_story.cli.subcommand` attribute and `recordException` in catch. This is confirmed by schema extensions in `agent-extensions.yaml` and thinking block content. The failure is purely import statement formatting, not instrumentation design.

**Root cause hypothesis**: index.js is file 30 of 30 in the processing order. PRD #902's auto-registration produced approximately 60 new schema extensions across the 29 preceding files. The accumulated schema context in the agent's working state appears to prompt the agent to treat the existing wide single-line import style as something to normalize for readability. In runs 17–20, index.js was either processed with less accumulated context or the prior prompt variant explicitly reinforced formatting preservation in a way the current prompt does not.

**Connection to RUN21-5**: Because index.js cannot commit while this import expansion issue is present, the `commit_story.cli.subcommand` COV-005 finding (tracked since run-20) cannot be scored. Resolution of RUN21-2 is a prerequisite for verifying RUN21-5.

**Required fix**: Strengthen spiny-orb prompt guidance on import statement formatting preservation, specifically for large-context runs (≥25 files, high schema extension volume). The agent should be explicitly instructed not to reformat existing import statements — including wide single-line imports — even when a different style might be considered more readable. An alternative or complementary fix: investigate whether the NDS-003 validator can tolerate multi-line expansion of semantically-equivalent single-line imports (a "blank-semantics-equivalent reformat" exception), which would convert this from a file failure to a clean commit. The debug dump from `evaluation/commit-story-v2/run-21/debug-dumps/index.js` shows the expanded import structure for both attempts.

---

### RUN21-3: CDQ-001 Regression — claude-collector.js Double-End in `startActiveSpan` Callback (P2)

**What happened**: claude-collector.js committed successfully in run-20 with CDQ-001 passing. In run-21, the committed code has `span.end()` inside a `finally` block within a `startActiveSpan` callback. Because `startActiveSpan` auto-closes the span when its callback promise settles, the explicit `span.end()` inside the callback double-ends the span — calling end on an already-ended span. All 11 other committed files that use `startActiveSpan` correctly omit the redundant `span.end()` call. This is a new regression.

**Correct pattern (11 other files)**:
```javascript
return tracer.startActiveSpan('name', async (span) => {
  try {
    // ... instrumented work ...
  } catch (err) {
    span.recordException(err);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw err;
  }
  // no finally { span.end() }
});
```

**Incorrect pattern (claude-collector.js in run-21)**:
```javascript
return tracer.startActiveSpan('name', async (span) => {
  try {
    // ... instrumented work ...
  } finally {
    span.end(); // double-end: startActiveSpan already auto-closes on callback resolution
  }
});
```

**Root cause**: LLM variation. The `try/finally { span.end() }` idiom is correct for manual `tracer.startSpan()` calls (which require explicit lifecycle management) but incorrect inside `startActiveSpan` callbacks (where the runtime manages span lifecycle). These two patterns are easy to confuse because the `finally` block idiom is widely documented in OTel documentation for the manual-span case.

**Impact**: CDQ dimension drops from 7/7 to 6/7 (-14pp), total quality drops from 24/25 to 23/25 (-4pp). This is the sole cause of the run-21 regression.

**Required fix (two paths)**:
1. **Prompt guidance**: Add explicit clarification to the spiny-orb instrumentation prompt distinguishing `startSpan` (requires `span.end()` in finally) from `startActiveSpan` (auto-ends on callback resolution; do not add `span.end()` inside the callback). This prevents future recurrence.
2. **Target repo correction**: The double-end in the committed instrumentation is a one-line fix (`span.end()` removal from the `finally` block). If the spiny-orb team wants to correct the committed state, this can be done directly on the instrument branch or noted as a known defect in the PR.

---

### RUN21-4: COV-005 — summary-manager.js `saveDailySummary` Zero Attributes on Skip Path (P2)

**What happened**: `saveDailySummary` in summary-manager.js has an early-return guard: when `options.force` is false and the target file already exists, the function returns `null`. The span is opened before the guard, but `entry_date` is only set after the guard passes — meaning the skip-path execution produces a span with zero attributes, failing COV-005.

The other 8 spans in summary-manager.js set at least one attribute unconditionally at span open. `saveDailySummary` is the only exception. This gap was not visible before run-21 because prior runs committed summary-manager.js with only a subset of functions (runs 18–19: `generateAndSave*` only; run-20: partial). The full 9-span commit in run-21 surfaced the skip-path behavior for the first time.

**Required fix**: `span.setAttribute('commit_story.journal.entry_date', entryDate)` should be set before the `if (!force && fileExists)` early-return check, not after. Prompt guidance could generalize this: when a function has an early-return guard, input parameter attributes (like `entry_date`) should be set unconditionally at span open, before any conditional branching.

**Impact**: COV-005 holds at FAIL (4/5) with a new failure site. The overall quality score is unaffected by this specific gap (COV was already at 4/5 in run-20), but resolving it alongside RUN21-3 would restore 25/25.

---

### RUN21-5 (Watch): index.js COV-005 — Subcommand Attribute Unverifiable for 3rd Consecutive Run

**Status**: index.js has failed to commit in runs 20 and 21 for different reasons — NDS-003 trivia pressure in run-20, NDS-003 import expansion + NDS-005 try/catch in run-21. The agent's intent to add `commit_story.cli.subcommand` is confirmed in both runs via schema extensions declared in `agent-extensions.yaml` and thinking block content. However, neither run produced a committed file, and the gap cannot be scored.

This finding is entering its third consecutive run without a verifiable result. Resolution depends on fixing RUN21-2 (import expansion / context pollution) so index.js can commit cleanly. Once index.js commits, the subcommand attribute should be present based on confirmed agent intent across runs 20–21. If it is absent despite a clean commit, a separate prompt guidance update would be needed.

**Track as open until index.js commits in a future run.**

---

### RUN21-6 (Watch): Agent Notes vs Committed Code Divergence — Two Instances

**What happened**: Two committed files in run-21 had `.instrumentation.md` notes (and corresponding verbose log output) that diverged from the actually committed code:

1. **summarize.js**: Notes documented `commit_story.commands.*` attribute namespace. Committed code uses `commit_story.summary.*` (the namespace registered in `agent-extensions.yaml`). Code is correct; notes are stale.
2. **journal-graph.js**: Notes from attempt 1 stated that `gen_ai.usage.*` attributes were dropped. Committed code (attempt 2) includes them with optional chaining. Code is correct; notes reflect an earlier draft.

In both cases the committed code is authoritative and correct — this is not a quality defect. The issue is observability: `.instrumentation.md` notes cannot be treated as ground truth for what was actually committed.

**Implication for evaluation workflow**: Evaluation must inspect code directly rather than relying on notes summaries. This is worth raising with the spiny-orb team: notes generation should occur after the final committed version is determined, or notes should be flagged as provisional / pre-commit drafts. Notes that diverge from committed code make human review of the PR more difficult.

---

## §4. Notable Positives

**PRD #902 auto-registration: step-change in coverage.** The auto-registration workflow produced approximately 60 new schema extensions in a single run. Coverage improvements by file: summary-manager.js (4 → 9 spans), summary-detector.js (1 → 5 spans), git-collector.js (2 → 6 spans). Schema self-reinforcement was observed in practice: `entries_count` registered by summary-graph.js early in the batch was cleanly reused by four subsequent files without any additional guidance. This is the clearest evidence to date that the schema extension mechanism works as designed when it fires.

**3-attempt rate: dramatic improvement.** Only 1 of 12 committed files (8%) required 3 attempts, down from 6 of 13 (46%) in run-20. Files that repeatedly needed 3 attempts in run-20 — context-integrator.js, journal-manager.js — took 1 attempt each in run-21. The NDS-003 contamination relief from PR #905 (partial shebang fix) is the most plausible driver, even though mcp/server.js itself remains blocked.

**context-capture-tool.js committed after 2 consecutive failures** (runs 19–20). First clean commit on this file since run-18.

**journal-graph.js: 5-run consecutive success streak** (runs 17–21). Stable at 4 spans, 2 attempts. No regression risk identified.

**IS SPA-002 resolved**: No orphan span detected in run-21. This is the first clean SPA-002 pass since run-18. The context propagation gap observed in runs 19–20 (different orphan span ID each run, different LangChain call) did not recur. Whether this reflects a code-path difference in run-21 or genuine resolution is unclear — one additional clean run would provide higher confidence.

**IS score improved to 90/100** (+10pp from run-20's 80/100). SPA-002 resolution is the primary driver.

**13th consecutive fully automatic push and PR** with no manual intervention.

---

## §5. Carry-Forward Tracker (Open Items Entering Run-22)

| ID | Title | Priority | Status | Runs Open |
|----|-------|----------|--------|-----------|
| RUN21-1 | mcp/server.js NDS-003 blank-line-near-JSDoc variant | P1 | Open — new variant after PR #905 partial fix | 1 |
| RUN21-2 | index.js NDS-003 + NDS-005 import expansion (context pollution) | P1 | Open — new in run-21 | 1 |
| RUN21-3 | CDQ-001 claude-collector.js double-end in startActiveSpan | P2 | Open — regression from run-20 | 1 |
| RUN21-4 | COV-005 summary-manager.js saveDailySummary skip-path zero attrs | P2 | Open — new in run-21 | 1 |
| RUN21-5 | index.js COV-005 subcommand attr unverifiable (3rd run) | Watch | Blocked by RUN21-2 | 3 |
| RUN21-6 | Agent notes vs committed code divergence | Watch | Open — 2 instances in run-21 | 1 |
| RUN20-5 | mcp/server.js SCH-001 recurring span name | P3/Watch | Unverifiable while NDS-003 blocks file; name appears stable (server_start) | 3+ |

**Closed this run**: RUN20-2 (3-attempt rate), RUN20-4 (summary-manager.js read-path COV-005), RUN19-2 (git-collector.js getCommitData), IS SPA-002 (orphan span).

---

## Score Projection — Run-22

Assumes fixes for RUN21-1 (mcp/server.js NDS-003) and RUN21-2 (index.js import expansion) are the primary levers.

| Scenario | Assumption | Projected Score | Q×F |
|----------|------------|-----------------|-----|
| Conservative | Neither P1 fixed; CDQ-001 (claude-collector.js) recurs; no new failures | 23/25 (92%) — 12 files | 11.0 |
| Target | RUN21-1 fixed (mcp/server.js commits); RUN21-2 fixed (index.js commits with subcommand attr); CDQ-001 not repeated | 25/25 (100%) — 14 files | 14.0 |
| Partial | One of the two P1 fixes lands; CDQ-001 prompt guidance prevents recurrence | 24/25 (96%) — 13 files | 12.5 |

**Key driver**: Both P1 fixes together unlock 2 additional committed files (mcp/server.js and index.js), each contributing spans that are currently missing from the span count. If mcp/server.js commits, it also unblocks the RUN20-5 SCH-001 watch item — the agent's consistent use of `commit_story.mcp.server_start` across 3 run-21 attempts suggests that finding may self-resolve once the file can commit.

**CDQ-001 risk**: The double-end pattern in claude-collector.js is LLM variation — it can recur even after a correct commit, unless prompt guidance explicitly distinguishes `startSpan` from `startActiveSpan` lifecycle semantics.
