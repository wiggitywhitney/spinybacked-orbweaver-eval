# Failure Deep-Dives — Run-6

Root cause analysis for each failed/partial file and each run-level failure in evaluation run-6.

**Branch**: `spiny-orb/instrument-1773996478550`
**Run timestamp**: 2026-03-20 08:47 – 19:19 UTC (wall clock ~10.5h; actual processing ~2h — laptop sleep)
**Result**: 5 src files committed, 6 partial (not committed), 12 correct skips, 6 reclassified to 0-span

---

## Run-Level Summary

| Metric | Run-5 | Run-6 | Delta |
|--------|-------|-------|-------|
| Files committed (with spans) | 7 | 5 | -2 |
| Files committed (COV-005 fail) | 2 | 0 | -2 |
| Correct skips (0 spans) | 12 | 18* | +6 |
| Partial (not committed) | 6 | 6 | 0 |
| Failed entirely | 2 | 0 | -2 |
| **Total committed with instrumentation** | **9** | **5** | **-4** |

*\*Run-6 "correct skips" includes 6 files that were committed in run-5 but reclassified to 0-span in run-6 (see Regressions section).*

---

## File-Level Failures

### 1. src/index.js — COV-001 entry point failure persists (3rd run)

**Status**: Success (0 spans, 3 attempts, $1.33)
**Branch state**: NOT committed (no diff)
**Run-5 status**: Failed (oscillation)
**Expected recovery**: Yes — oscillation detection (RUN-1 fix)

**What happened**: The agent instrumented main() but the validator rejected it. The blocking rules were COV-003, SCH-001, and SCH-002.

**COV-003 failure**: The catch block at line 178 wrapping `triggerAutoSummaries()` intentionally swallows errors (the code calls triggerAutoSummaries in a try/catch and continues on error — this is deliberate "don't block the main flow" behavior). The DEEP-1 fix (#180) covers ENOENT-style catches but NOT "swallow-and-continue" patterns. The agent correctly identified this as expected-condition but the validator didn't recognize it.

**SCH-001 failure**: The agent used `commit_story.cli.main` and `commit_story.cli.summarize` as span names — reasonable for a CLI entry point — but these aren't in the registry. The registry only has `commit_story.context.collect_chat_messages`.

**Root cause**: Two interacting bugs:
1. **DEEP-1 boundary gap**: COV-003 expected-condition exemption is too narrow — covers ENOENT but not intentional error-swallowing catches
2. **SCH-001 registry gap**: Only 1 span in registry. The agent can't name CLI entry points correctly without schema extensions being accepted.

**Why oscillation didn't trigger**: The failure mode changed from run-5 (oscillation between adding/removing) to run-6 (consistent rejection on same rules). Oscillation detection looks for alternating states, not consistent failures. This is correct behavior — the file just consistently fails.

**Improvement over run-5**: Yes, different failure mode (no oscillation). RUN-1 fix is working. But COV-001 still fails.

---

### 2. src/commands/summarize.js — Partial (7/8 functions)

**Status**: Partial (3 spans, 3 attempts, $0.98)
**Branch state**: NOT committed
**Run-5 status**: Failed (COV-003 + SCH-002)
**Expected recovery**: Yes — expected-condition exemption (DEEP-1)

**What happened**: 7/8 functions processed successfully. `runMonthlySummarize` was skipped due to COV-003 + SCH-001 + SCH-002.

**COV-003 failure on runMonthlySummarize**: "catch block at line 55 does not record error on span." This is the per-item error collection pattern — the catch collects failures into `result.failed` and continues. The DEEP-1 fix covers ENOENT but not per-item-failure-collection patterns.

**SCH-001 failure**: Span name not registered. Same registry gap as all other files.

**Improvement over run-5**: Significant — went from "failed entirely" to "7/8 functions instrumented." The DEEP-1 fix helped with the simpler catches. The per-item collection catch pattern is a narrower DEEP-1 boundary case.

**Why not committed**: Reassembly validation failed. With 1/8 functions skipped, the partial result couldn't be committed as a complete file.

---

### 3. src/generators/journal-graph.js — Partial (10/12 functions)

**Status**: Partial (3 spans, 3 attempts, $1.48)
**Branch state**: NOT committed
**Run-5 status**: Partial
**Expected recovery**: Yes — function-level fallback scope fixed (DEEP-2)

**What happened**: 10/12 functions processed. Two skipped:
- `technicalNode`: SCH-001 — span name `commit_story.ai.technical_decisions` not in registry
- `generateJournalSections`: NDS-003 (original line 11 modified: `return {`) + SCH-001

**NDS-003 on generateJournalSections**: The agent modified an original `return {` statement during instrumentation — likely capturing the return value in a variable for setAttribute. This is the same NDS-003 pattern seen in runs 3-5.

**SCH-001**: Both functions need span names that don't exist in the 1-span registry.

**Improvement over run-5**: Mixed. More functions processed (10 vs unclear in run-5), but still partial. The DEEP-2 function-level fallback is working — individual function failures don't kill the whole file. But the file still can't commit because too many key functions are skipped.

---

### 4. src/generators/summary-graph.js — Partial (13/15 functions)

**Status**: Partial (7 spans, 3 attempts, $1.96)
**Branch state**: NOT committed
**Run-5 status**: Partial
**Expected recovery**: Yes — passes at 32K in acceptance tests

**What happened**: 13/15 functions processed. Two skipped:
- `dailySummaryNode`: Oscillation detected — "Duplicate errors across consecutive attempts: SCH-001 (×1)". Oscillation detection (RUN-1) correctly triggered and stopped the loop.
- `monthlySummaryNode`: COV-003 (try/finally without error recording) + SCH-001 + SCH-002

**Oscillation on dailySummaryNode**: Confirms RUN-1 is working — the agent tried the same invalid span name twice and the detector caught it. But the underlying issue is SCH-001 (no registered span).

**COV-003 on monthlySummaryNode**: "failable operation in try/finally without error recording on span." This is a try/finally (not try/catch) pattern that COV-003 flags as needing error recording. DEEP-1 covers catch-block exemptions, not try/finally patterns.

**Improvement over run-5**: More functions instrumented. Oscillation detection working. But still partial.

---

### 5. src/managers/auto-summarize.js — Partial (1/3 functions)

**Status**: Partial (2 spans, 3 attempts, $0.90)
**Branch state**: NOT committed
**Run-5 status**: Committed (COV-005 fail)
**Expected recovery**: N/A (was committed in run-5)

**What happened**: Only `triggerAutoWeeklySummaries` committed. Two functions skipped:
- `triggerAutoSummaries`: NDS-003 (original line 75 modified: `return {`) + COV-003 + SCH-001 + multiple SCH-002
- `triggerAutoMonthlySummaries`: COV-003 (catch at line 49) + SCH-001 + multiple SCH-002

**This is a REGRESSION from run-5.** auto-summarize was committed in run-5 (with COV-005 fail). In run-6, SCH-001 and stricter validation prevented the file from committing.

**NDS-003 on triggerAutoSummaries**: Agent modified `return {` on line 75 — same pattern as journal-graph. The agent captures return values for setAttribute but modifies original code in the process.

**COV-003**: Both inner catches are per-item-failure-collection patterns (same as summarize.js). DEEP-1 boundary gap.

**Root cause**: SCH-001 is the new blocker. In run-5, the agent used invented span names and committed them. In run-6, the validator enforces SCH-001 more strictly, rejecting unregistered span names. The file had working instrumentation but couldn't pass validation.

---

### 6. src/managers/journal-manager.js — Partial (9/10 functions)

**Status**: Partial (2 spans, 3 attempts, $0.73)
**Branch state**: NOT committed
**Run-5 status**: Partial
**Expected recovery**: Yes — COV-003 exemption + JSDoc fix

**What happened**: 9/10 functions processed. One skipped:
- `saveJournalEntry`: SCH-001 — "commit_story.journal.save_journal_entry not found in registry span definitions."

**SCH-001 only failure**: This file's failure is PURELY SCH-001. The agent got the instrumentation right, the expected-condition catches were handled correctly (DEEP-1 working), no NDS-003 violations — but the span name isn't registered. The only registered span (`commit_story.context.collect_chat_messages`) is semantically wrong for a journal save operation, and the agent correctly refused to misuse it.

**Improvement over run-5**: Significant. Only 1 function blocked (down from multiple). The DEEP-1 and DEEP-4 fixes worked. SCH-001 is the sole remaining blocker.

---

### 7. src/utils/summary-detector.js — Partial (5/11 functions)

**Status**: Partial (2 spans, 3 attempts, $1.80)
**Branch state**: NOT committed
**Run-5 status**: Partial
**Expected recovery**: Yes — COV-003 exemption + JSDoc fix

**What happened**: 5/11 functions processed. Six skipped:
- `getDaysWithEntries`: COV-003 + SCH-001 + SCH-002
- `getSummarizedDays`: COV-003 + SCH-001
- `getSummarizedWeeks`: COV-003 + SCH-001
- `getDaysWithDailySummaries`: NDS-003 + COV-003 + SCH-001 + SCH-002. Oscillation also detected ("Duplicate errors across consecutive attempts: SCH-001 (×1)")
- `findUnsummarizedWeeks`: NDS-003 (3 violations) + SCH-001 + SCH-002
- `findUnsummarizedMonths`: NDS-003 + SCH-001 + SCH-002

**Mixed root causes**: COV-003 (expected-condition directory-not-found catches), SCH-001 (unregistered span names), and NDS-003 (code modifications). All three persistent issues converge in this file.

**NDS-003 details**: `findUnsummarizedWeeks` had 3 NDS-003 violations — the agent modified `if (dailySummaryDates.length === 0) return [];` which is original business logic. `findUnsummarizedMonths` and `getDaysWithDailySummaries` had comment lines modified.

**Improvement over run-5**: Marginal. Still 6 functions blocked. Some different functions now pass (DEEP-1 helped for simpler catches) but the directory-not-found catches and NDS-003 issues persist.

---

## Run-Level Failures

### R1. Laptop sleep killed in-flight API calls

**Impact**: Dominant failure mode for this run. Affected timing of all files processed mid-sleep.

The run executed overnight as a Claude Code background task (started 08:47 UTC). The laptop slept sometime during processing, killing active HTTP connections. Spiny-orb reported "Anthropic API call failed: terminated" on affected files. One instance showed `overloaded_error` which may be genuine transient API overload or a stale connection artifact.

**Wall clock**: 08:47 UTC → 19:19 UTC = ~10.5 hours
**Actual processing**: ~2 hours (files processed quickly when the machine was awake)

**Files affected by sleep**: Difficult to determine precisely without timestamps per file. The output log doesn't include per-file timestamps. Based on the order (files 1-5 processed before sleep, files 25+ after wake), the middle batch (files 6-24) was most affected — but many of these are zero-span files that wouldn't have been impacted.

**Confounding factor**: This makes it hard to attribute partial file results purely to spiny-orb quality. Some "partial" results may have been caused by terminated API calls during function-level processing. However, the validation rule failures (SCH-001, COV-003, NDS-003) are genuine — these aren't caused by sleep.

**Process fix**: Use `caffeinate -s <command>` on macOS, or run in the user's terminal where they can monitor.

---

### R2. Push authentication failure (4th consecutive)

**Impact**: No PR created. Branch exists only locally.

**Error**: `fatal: Authentication failed for 'https://github.com/wiggitywhitney/commit-story-v2-eval.git/'`

Issue #183 was closed with GITHUB_TOKEN guidance and `gh` CLI support. But the actual push used HTTPS password auth, not `gh`. The fix doesn't work when:
- GITHUB_TOKEN isn't set in the environment, OR
- The remote URL uses HTTPS (password auth deprecated by GitHub)

The pre-run verification confirmed `git push --dry-run` works from the eval repo (user's credentials). But spiny-orb's subprocess doesn't inherit the user's credential helper.

**4 consecutive failures** (runs 3, 4, 5, 6): This needs a fundamentally different approach — either SSH remote URLs, a pre-configured credential helper, or the `--push-command` override that #183 added.

---

### R3. SCH-001 emerged as the new dominant blocking rule

**Impact**: EVERY partial/failed file has SCH-001 as a contributing factor.

The Weaver telemetry registry defines exactly ONE span: `commit_story.context.collect_chat_messages`. Any file needing a different span name fails SCH-001 unless:
1. The agent misuses the registered name (semantically wrong but passes validation) — this is what the 5 committed files did
2. The agent invents a correct name and it passes — but SCH-001 rejects all invented names

**Files blocked by SCH-001**:
| File | Correct span name would be | But validator requires |
|------|---------------------------|----------------------|
| index.js | `commit_story.cli.main` | `commit_story.context.collect_chat_messages` |
| journal-manager.js | `commit_story.journal.save_journal_entry` | `commit_story.context.collect_chat_messages` |
| summary-detector.js | `commit_story.summary.find_*` | `commit_story.context.collect_chat_messages` |
| journal-graph.js | `commit_story.ai.technical_decisions` | `commit_story.context.collect_chat_messages` |
| summary-graph.js | `commit_story.summary.daily_node` etc | `commit_story.context.collect_chat_messages` |
| auto-summarize.js | `commit_story.summary.trigger_*` | `commit_story.context.collect_chat_messages` |
| summarize.js | `commit_story.summarize.run_*` | `commit_story.context.collect_chat_messages` |

**Perverse incentive**: SCH-001 creates a choice between:
- **Semantic accuracy** (correct span name) → fails validation
- **Validation compliance** (misuse the only registered name) → passes but semantically wrong

The 5 committed files chose compliance. The partial files chose accuracy (or couldn't use the registered name at all). Neither outcome is ideal.

**This is a new dominant blocker.** In run-5, DEEP-1 (COV-003) was the dominant blocker. DEEP-1 was fixed, and SCH-001 emerged from behind it. The fix path is clear: add more span definitions to the Weaver registry.

---

### R4. Tally inflation — "23 succeeded" but only 5 files committed

**Reported tally**: 23 succeeded, 0 failed, 6 partial
**Actual branch state**: 5 src files committed with instrumentation changes

The discrepancy comes from:
- **12 zero-span correct skips** counted as "success" (true — they were correctly evaluated)
- **6 files where all async functions failed** but sync functions "passed" (function-level fallback classified the file as "success" with 0 spans)
- **5 files with actual instrumentation committed**

The "success" label is misleading for evaluation purposes. A file that processes 10 sync functions (0 spans each) and fails all 3 async functions (the ones needing spans) reports "success (0 spans)" — which sounds like a correct skip but is actually a failure masked by function-level fallback.

---

## Regressions from Run-5

Six files that were committed in run-5 are NOT committed in run-6:

### auto-summarize.js (committed → partial)
**Run-5**: Committed with COV-005 fail (2 spans, but zero attributes on schema-uncovered file)
**Run-6**: Partial (1/3 functions). triggerAutoSummaries blocked by NDS-003+COV-003+SCH-001. triggerAutoMonthlySummaries blocked by COV-003+SCH-001.
**Root cause**: SCH-001 validation is stricter in run-6. In run-5, invented span names were accepted (with a COV-005 finding). In run-6, SCH-001 rejects them.

### context-capture-tool.js (committed → 0 spans)
**Run-5**: Committed with 1 span (on saveContext async function)
**Run-6**: Success (0 spans, 0.0K output). Agent classified ALL exported functions as synchronous.
**Root cause**: The only exported function is `registerContextCaptureTool()` which IS synchronous. The async function `saveContext()` is an unexported internal called from within the tool handler. Run-5's agent gave it a span; run-6's agent applied RST-004 (unexported internal) and skipped it. The sync-only pre-screening (#212) may have contributed.
**Assessment**: Run-6 may be MORE correct — saveContext is truly unexported. But it IS async with file I/O, so COV-004 (advisory) flags it. This is a tension between RST-004 and COV-004.

### reflection-tool.js (committed → 0 spans)
**Run-5**: Committed with 1 span (on saveReflection async function)
**Run-6**: Success (0 spans, 0.0K output). Same pattern as context-capture-tool.
**Root cause**: Same RST-004 vs COV-004 tension.

### commit-analyzer.js (committed → 0 spans)
**Run-5**: Committed with spans
**Run-6**: Success (0 spans, 0.0K output). Agent notes: "All exported functions are synchronous."
**Root cause**: All functions in this file ARE synchronous. Run-5's instrumentation may have been over-instrumentation (RST-001 violation). Run-6 correctly identifies these as sync-only.
**Assessment**: Run-6 is likely correct. This is a quality improvement, not a regression.

### journal-paths.js (committed → 0 spans)
**Run-5**: Committed with spans (on ensureDirectory async function)
**Run-6**: Success (0 spans, 2 attempts). Agent notes: "SCH-001 fix: removed the manual span from ensureDirectory. The invented span name was not registered and no registered span could be used without misrepresenting the operation."
**Root cause**: SCH-001. The agent tried a span, it was rejected, and on retry the agent removed all instrumentation rather than misuse the registered name.
**Assessment**: Correct decision by the agent. Using `commit_story.context.collect_chat_messages` for a directory creation utility would be absurd. The fix is adding registry span definitions.

### SUMMARY: 5 regressions breakdown
| File | Regression cause | Assessment |
|------|-----------------|------------|
| auto-summarize.js | SCH-001 stricter validation | Genuine regression — needs registry spans |
| context-capture-tool.js | RST-004 vs COV-004 tension | Debatable — agent may be more correct |
| reflection-tool.js | RST-004 vs COV-004 tension | Debatable — agent may be more correct |
| commit-analyzer.js | Agent correctly identifies sync-only | NOT a regression — run-5 over-instrumented |
| journal-paths.js | SCH-001 rejected span, agent removed | Correct decision — needs registry spans |

---

## Failure Trajectory (Runs 2–6)

### Per-File Failure History

| File | Run-2 | Run-3 | Run-4 | Run-5 | Run-6 | Trend |
|------|-------|-------|-------|-------|-------|-------|
| index.js | — | — | Failed | Failed (oscillation) | 0 spans (main failed COV-003+SCH-001) | **Persistent** — 3 runs, different root cause each time |
| summarize.js | — | — | Failed | Failed (COV-003+SCH-002) | Partial (7/8) | **Improving** — from total fail to near-complete |
| journal-graph.js | — | — | Partial | Partial | Partial (10/12) | **Stable partial** — more functions each run |
| summary-graph.js | — | — | Partial | Partial | Partial (13/15) | **Stable partial** — more functions each run |
| auto-summarize.js | — | — | Committed | Committed (COV-005) | Partial (1/3) | **REGRESSED** — committed in runs 4-5, partial in 6 |
| journal-manager.js | — | — | Partial | Partial | Partial (9/10) | **Improving** — only 1 function blocked (SCH-001 only) |
| summary-manager.js | — | — | Partial | Partial | **Committed** | **RECOVERED** — first successful commit |
| summary-detector.js | — | — | Partial | Partial | Partial (5/11) | **Stable partial** — many functions still blocked |
| context-capture-tool.js | — | — | Committed | Committed | 0 spans | **REGRESSED** — reclassified by agent |
| reflection-tool.js | — | — | Committed | Committed | 0 spans | **REGRESSED** — reclassified by agent |
| commit-analyzer.js | — | — | Committed | Committed | 0 spans | **Corrected** — sync-only, run-5 over-instrumented |
| journal-paths.js | — | — | Committed | Committed | 0 spans | **REGRESSED** — SCH-001 forced span removal |

### Validation Rule Failure Frequency (Run-6)

| Rule | Files affected | Functions blocked | Persistent? |
|------|---------------|-------------------|-------------|
| SCH-001 | 7/7 partial files + index.js | 14+ functions | New as dominant (was secondary in run-5) |
| COV-003 | 5 files | 8+ functions | Persistent — DEEP-1 helped but boundary gaps remain |
| NDS-003 | 4 files | 6 functions | Persistent since run-3 |
| SCH-002 | 5 files | Often accompanies SCH-001 | Persistent |

### Root Cause Shift Across Runs

| Run | Dominant blocker | Secondary blocker | Files committed |
|-----|-----------------|-------------------|-----------------|
| Run-4 | Multiple (NDS, SCH, CDQ) | — | 16 |
| Run-5 | COV-003 (DEEP-1) | NDS-003 | 9 (quality up, coverage down) |
| Run-6 | **SCH-001** (1-span registry) | COV-003 boundary, NDS-003 | 5 |

**Pattern**: Each run fixes the previous dominant blocker, revealing the next one. Run-5 fixed NDS/SCH/CDQ issues → COV-003 emerged. Run-6 fixed COV-003 (partially) → SCH-001 emerged. The fix path is clear: expand the registry with more span definitions.

---

## Unmasked Bug Detection

The DEEP-1/RUN-1/DEEP-4 fixes were designed to recover 8 files. Of these:

### Files where fixes worked and revealed new issues:

1. **summary-manager.js** — RECOVERED. No unmasked bugs. DEEP-1 + DEEP-4 fixes allowed full commit. All 6 spans pass validation. The agent worked around SCH-001 by using the registered span name (semantically imperfect but valid).

2. **summarize.js** — DEEP-1 helped (7/8 functions pass). New issue unmasked: per-item-failure-collection catch pattern not covered by DEEP-1. This is a **DEEP-1 boundary gap**, not a new bug.

3. **journal-manager.js** — DEEP-1 + DEEP-4 helped (9/10 functions pass). Unmasked: **SCH-001 is the sole remaining blocker** for this file. If the registry had more span definitions, this file would commit.

4. **index.js** — RUN-1 fixed oscillation. Unmasked: **COV-003 swallow-and-continue pattern** not covered by DEEP-1. Also SCH-001. Two issues that were hidden behind the oscillation.

5. **summary-graph.js** — Functions improved. Unmasked: **oscillation on SCH-001** (dailySummaryNode), confirming the rule conflict causes the loop RUN-1 now detects.

### Files where fixes didn't help enough:

6. **journal-graph.js** — Still partial. NDS-003 persists. SCH-001 blocks key functions.

7. **summary-detector.js** — Still partial. All three issues (COV-003, SCH-001, NDS-003) converge.

8. **sensitive-filter.js** — Correctly classified as sync-only (0 spans). No unmasked bugs — this is the expected outcome per pre-screening (#212).

### Summary: Unmasked bugs

| Bug | Masked by | Files affected |
|-----|-----------|---------------|
| DEEP-1 boundary: per-item catch collection pattern | DEEP-1 (ENOENT pattern only) | summarize.js, auto-summarize.js |
| DEEP-1 boundary: swallow-and-continue catches | DEEP-1 (ENOENT pattern only) | index.js |
| DEEP-1 boundary: try/finally without catch | DEEP-1 (catch-block only) | summary-graph.js |
| SCH-001 single-span registry | COV-003 was blocking first | ALL partial files + journal-paths |

The run-5 prediction was correct: "If fixing SYS-3 reveals new failure modes in recovered files ('unmasked bug' risk), actual score may be lower than projected." SCH-001 was hidden behind COV-003 and is now the dominant blocker.

---

## New Findings Filed

These findings are documented in `evaluation/run-6/spiny-orb-findings.md`:

| Finding | Priority | Category |
|---------|----------|----------|
| RUN6-1 | Critical (process) | Laptop sleep kills API calls |
| RUN6-2 | Critical | Push auth 4th failure |
| RUN6-3 | High | SCH-001 semantic mismatch in server.js |
| RUN6-4 | High | Tally inflation (21 "succeeded" vs 5 committed) |
| RUN6-5 | Medium | NDS-003 persists across multiple files |
| RUN6-6 | Medium | Oscillation detected on summary-detector (confirms RUN-1 works) |
| RUN6-7 | Medium | Per-file reasoning reports not written to disk |
| RUN6-8 | Critical | index.js COV-001 entry point failure persists (3rd run) |

### Key new insight: SCH-001 as dominant blocker

**Not filed as a separate finding** because it's a combination of existing findings (RUN6-3, RUN6-8) and a registry expansion need. The fix is straightforward: add span definitions to the Weaver registry for the commit-story domain operations. This would unblock journal-manager.js (instantly — SCH-001 is its only blocker) and significantly help all other partial files.

---

## Committed File Quality Notes

The 5 files that DID commit all worked around SCH-001 by using the single registered span name:

| File | Span name used | Semantically correct? |
|------|---------------|----------------------|
| claude-collector.js | `commit_story.context.collect_chat_messages` | **Yes** — this file collects chat messages |
| git-collector.js | `commit_story.context.collect_chat_messages` | **No** — git operations are not chat message collection |
| context-integrator.js | `commit_story.context.collect_chat_messages` | **Partial** — integrates context but doesn't collect chat messages |
| summary-manager.js | `commit_story.context.collect_chat_messages` | **No** — summary operations are not chat message collection |
| server.js | `commit_story.context.collect_chat_messages` | **No** — MCP server startup is not chat message collection |

Only 1/5 committed files has a semantically correct span name. The other 4 pass validation by misusing the registered name. This is a systemic quality issue masked by validation pass rates.
