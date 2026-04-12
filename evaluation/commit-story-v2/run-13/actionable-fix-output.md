# Actionable Fix Output — Run-13

Self-contained handoff from evaluation run-13 to the spiny-orb team.

**Run-13 result**: 25/25 (100%) canonical quality on committed files, 7 committed + 1 partial (unpreserved), 11 rollbacks from 2 checkpoint failures, ~$6.41 cost in 65.7 minutes. Quality restored from run-12's 92%. PR #62 created — third consecutive successful push.

**Run-12 → Run-13 delta**: +8pp quality (92% → 100%), -5 files (12+1p → 7), +$1.22 cost ($5.19 → ~$6.41), push SUCCESS (third consecutive).

**Target repo**: commit-story-v2 proper (same as runs 9-12)
**Branch**: `spiny-orb/instrument-1776014409398`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/62

---

## §1. Run-13 Score Summary

| Dimension | Score | Run-12 | Delta | Failures |
|-----------|-------|--------|-------|----------|
| NDS | 2/2 (100%) | 2/2 | — | — |
| COV | 5/5 (100%) | 4/5 | **+20pp** | — |
| RST | 4/4 (100%) | 4/4 | — | — |
| API | 3/3 (100%) | 3/3 | — | — |
| SCH | 4/4 (100%) | 4/4 | — | — |
| CDQ | 7/7 (100%) | 6/7 | **+14pp** | — |
| **Total** | **25/25 (100%)** | **23/25** | **+8pp** | **0 failures** |
| **Gates** | **5/5 (100%)** | **5/5** | — | — |
| **Files** | **7 + 1 partial** | **12+1p** | **-5** | 10 rollbacks from checkpoint failures |
| **Cost** | **~$6.41** | **$5.19** | **+$1.22** | — |
| **Push/PR** | **YES (PR #62)** | **YES (#61)** | Third consecutive | — |
| **Q × F** | **7.0** | **11.0** | **-4.0** | Lowest ever |

**Scoring note**: Quality score reflects the 7 committed files only. journal-graph.js partial was not preserved in git and is not scored. The 10 rolled-back files were caught by checkpoints and did not enter the committed set.

---

## §2. Quality Rule Failures

No canonical failures in the committed set. Both run-12 failures (COV-004, CDQ-007) are absent from run-13 committed files — caught by checkpoint rollback, not agent correction.

**journal-graph.js summaryNode (persistent, not counted in score)**:
NDS-003 Code Preserved failure in summaryNode for the 3rd consecutive run. The file was partially instrumented (11/12 functions, 3 spans) but the instrumented version was not committed to the instrument branch. summaryNode has never been instrumented in any run. See §5 RUN13-3.

---

## §3. Run-12 Findings Assessment

| # | Finding | Priority | Status in Run-13 |
|---|---------|----------|-----------------|
| RUN12-1 | COV-004: summary-manager.js 6 skipped exported async I/O functions | Medium | **CANNOT VERIFY** — summary-manager.js was rolled back at checkpoint 2; file not in committed set. The COV-004 guidance fix (PR #398) is in the codebase, but run-13 couldn't confirm it fixed the agent's behavior for this specific file. |
| RUN12-2 | CDQ-007: journal-manager.js unconditional nullable setAttribute | Medium | **PARTIAL** — NDS-003 truthy fix (PR #391) landed; truthy-check guards are now allowlisted. journal-manager.js was instrumented but introduced a new type-assumption error (Date.split) and was rolled back. The underlying guard mechanism improved; a new type-safety gap emerged. |
| RUN12-3 | NDS-003 truthy-check gap — two failure modes | Medium | **LANDED** — PR #391 added truthy guard pattern to allowlist. No NDS-003 truthy violations in 7 committed files. CDQ-007 failure in journal-manager.js was a different root cause (Date vs string), not a truthy guard issue. |
| RUN12-4 | journal-graph.js 3 attempts (regression) | Low | **UNCHANGED** — still 3 attempts in run-13 |
| RUN12-5 | Cost $5.19 exceeds $4.00 target | Low | **REGRESSED** — ~$6.41 in run-13, highest ever |
| RUN12-6 | summary-detector.js partial due to API overload | Low | **RESOLVED** — summary-detector.js committed cleanly in run-13: 5 spans, 2 attempts, 5/5 exported async functions instrumented |

---

## §4. New Run-13 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN13-1 | Checkpoint rollback discards innocent files — 10 files lost to cascade | P1 | Architecture |
| RUN13-2 | Type-safety gaps in setAttribute guards (null vs undefined; Date vs string) | P1 | Agent guidance |
| RUN13-3 | summaryNode NDS-003 Code Preserved — 3rd consecutive run | P1 | Validator/prompt |
| RUN13-4 | journal-graph.js partial not committed to instrument branch | Low | Infrastructure |
| RUN13-5 | Advisory contradiction rate 67% (up from run-12's 44%) | Low | Advisory quality |
| RUN13-6 | Cost ~$6.41, highest ever; $4.68 sunk on rolled-back work | Low | Cost |

### RUN13-4: journal-graph.js partial not committed to git (Low)

The PR summary reports journal-graph.js as "partial (11/12 functions, 3 spans)" but the instrument branch shows no diff for this file between main and the instrument branch. The partially instrumented version was not written to git despite being recorded as a partial commit in the run output. This is worth investigating as a potential spiny-orb bug — a partial result being reported without being persisted.

### RUN13-5: Advisory contradiction rate 67% (Low)

7 advisory findings in run-13. Of 6 non-moot findings, 4 were incorrect (67% contradiction rate, up from run-12's 44%). The SCH-004 judge continues to hallucinate semantic equivalence between unrelated attributes:

| False finding | Why incorrect |
|--------------|---------------|
| `commit_story.summarize.date_count` redundant with `time_window_start/end` | Integer count vs. ISO timestamp — completely different semantics |
| `commit_story.summarize.force` redundant with `gen_ai.request.max_tokens` | Boolean CLI flag vs. token limit |
| `commit_story.summarize.week_label` redundant with `week_count` | String identifier ("2026-W09") vs. integer count |
| `commit_story.summarize.month_label` redundant with `month_count` | String identifier ("2026-02") vs. integer count |

Valid finding: CDQ-006 advisory on journal-graph.js `Object.keys(result).filter(...)` in generateJournalSections — expensive computation without isRecording() guard. File was not committed but finding is accurate.

### RUN13-6: Cost ~$6.41 (Low)

$4.68 of the total was sunk cost (rolled-back files and unpreserved partial):

| File | Cost | Outcome |
|------|------|---------|
| summary-manager.js | $1.77 | Rolled back |
| journal-graph.js | $1.54 | Partial, not committed |
| journal-manager.js | $0.75 | Rolled back |
| index.js | $0.33 | Rolled back |
| summary-graph.js | $0.29 | Rolled back |

Cost of the 7 useful committed files: ~$1.73. The smart rollback fix (RUN13-1) would eliminate most of this sunk cost in future runs.

---

## §5. Prioritized Fix Recommendations

### P1 — RUN13-1: Smart Checkpoint Rollback

**Problem**

When a checkpoint test fails, spiny-orb rolls back all files processed since the last checkpoint (window of 5). Only one file in the window typically contains the failing code; the others are discarded as collateral.

In run-13, two checkpoint failures each rolled back 5 files when only one file per failure was the source:

- **Checkpoint 1 (file 15/30)**: `summary-graph.js` introduced `null.length` — stack trace pointed to `src/generators/summary-graph.js:401`. The other 4 files in the window (3 constants files + index.js) were clean.
- **Checkpoint 2 (file 25/30)**: `journal-manager.js` introduced `commit.timestamp.split()` on a Date object — stack trace pointed to `src/managers/journal-manager.js:188`. The other 4 files (summary-manager.js with 8 spans, mcp/server.js, 2 correct-skip files) were clean.

8 additional files would have committed in run-13 with targeted rollback.

**Proposed Behavior**

1. On checkpoint test failure, parse the test output for stack frames matching the instrumented source directory (`src/**/*.{js,ts}`)
2. Filter to only files instrumented in the current checkpoint window
3. Revert only those specific files (not the full window)
4. Re-run the test suite to confirm the remaining window files are clean
5. Continue processing

**Edge Cases**

- **Multiple failing files in one window**: revert all files found in the stack trace
- **Stack trace points to a test file**: walk one frame deeper to find the source file
- **Re-run still fails after targeted rollback**: fall back to full window rollback

**Where to Look**

The checkpoint logic lives in the instrumentation runner (wherever `Rolled back N file(s) at checkpoint` is emitted). The stack trace parsing would go in the same failure handler.

**Acceptance Criteria**

- A checkpoint failure in `file-A.js` does not roll back `file-B.js` when `file-B.js` does not appear in the failing test's stack trace
- Tests confirm that a clean file in the same window is retained after targeted rollback

---

### P1 — RUN13-2: Type-Safety Gaps in setAttribute Guards

**Problem — Failure A: `null !== undefined`**

**File**: `src/generators/summary-graph.js` (instrumented version, run-13)
**Error**: `TypeError: Cannot read properties of null (reading 'length')` at line 401

The agent guarded with `if (weeklySummaries !== undefined)`. Tests pass `null` for this parameter — `null !== undefined` is `true`, so the guard does not fire and `null.length` throws.

The NDS-003 allowlist already includes `!= null` (loose inequality, via the `=?` optional `=` in the PR #352 regex). The agent chose `!== undefined` over `!= null`. Guidance is needed so the agent prefers `!= null` when guarding function parameters that may be `null`.

**Problem — Failure B: Date vs string timestamp**

**File**: `src/managers/journal-manager.js` (instrumented version, run-13)
**Error**: `TypeError: commit.timestamp.split is not a function` at line 188

The agent called `commit.timestamp.split('T')[0]` to extract a date string. Tests pass `commit.timestamp` as a `Date` object. In the same run, `src/collectors/git-collector.js` handled this correctly: `metadata.timestamp.toISOString()`. The pattern `new Date(value).toISOString().split('T')[0]` works for both `Date` objects and ISO strings.

**Proposed Fix**

Add guidance to the agent instrumentation prompt covering two patterns:

1. **Null-safe parameter guards**: prefer `!= null` over `!== undefined` for function parameters that may be either `null` or `undefined`. `!= null` is already in the NDS-003 allowlist.
2. **Type-safe timestamp conversion**: when extracting a date string from a timestamp field, use `new Date(value).toISOString().split('T')[0]` rather than `value.split('T')[0]` to handle both `Date` objects and string inputs.

**Where to Look**

The agent instrumentation prompt — search for the CDQ-007 or attribute-setting guidance section.

**Acceptance Criteria**

- Instrumented `summary-graph.js` guards `weeklySummaries` with `!= null`, not `!== undefined`
- Instrumented `journal-manager.js` uses `new Date(commit.timestamp).toISOString().split('T')[0]` for date extraction
- Both files pass the checkpoint test suite

---

### P1 — RUN13-3: summaryNode NDS-003 Code Preserved — 3rd Consecutive Run

**Problem**

`summaryNode` in `src/generators/journal-graph.js` has failed NDS-003 (Code Preserved) in runs 11, 12, and 13 — every attempt in each run. The error is identical each time:

```text
NDS-003: original line 27 missing/modified: const systemContent = `${guidelines}
```

The agent modifies line 27 (a template literal: `const systemContent = \`${guidelines}...`) in every instrumentation attempt. After 3 attempts, spiny-orb marks `summaryNode` as skipped. `summaryNode` is an exported async function that makes an LLM call — it should receive a span (COV-004). It has never been instrumented in any run.

**Investigation**

The instrumentation report for the most recent failed run is at:

```text
src/generators/journal-graph.instrumentation.md
```

on branch `spiny-orb/instrument-1776014409398`. Read it to see exactly what change the agent made to line 27 in each of the 3 attempts. The three most likely causes:

1. **Injecting a variable into the template literal** (e.g., adding a tracing context string inline)
2. **Reformatting the multiline template** (adding/removing whitespace or a newline)
3. **Splitting the template literal** to wrap it in a conditional

**Proposed Fix**

Once the exact modification is identified:

- If the modification is instrumentation-only (only adds `span.*` calls or wraps the template in a no-op), add the specific pattern to the NDS-003 allowlist
- If the agent is restructuring the template literal unnecessarily, add a prompt constraint: "Do not modify template literal structure when adding instrumentation. Add span calls around the existing template expression, not inside it."

**Acceptance Criteria**

- `summaryNode` in `src/generators/journal-graph.js` is instrumented with a span in the next eval run
- NDS-003 does not flag the instrumented version
- The span passes COV-004 (exported async function with LLM call receives a span)

---

## §6. Unresolved Items from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| journal-graph.js summaryNode NDS-003 | RUN11-5 | **3 runs** | Unresolved — P1 fix in §5 |
| journal-graph.js 3 attempts | RUN12-4 | 2 runs | Unchanged |
| Cost above $4.00 target | RUN11-4 | 3 runs | Regressed to ~$6.41 |
| Advisory contradiction rate | RUN11-1 | 3 runs | Regressed to 67% |
| COV-004 guidance for exported async I/O functions | RUN12-1 | Unverifiable in run-13 | Fix landed (PR #398) but couldn't verify — summary-manager.js rolled back |
| RUN7-7 span count self-report | Run-7 | 7 runs | Structurally unchanged |
| CJS require() in ESM projects | Run-2 | 12 runs | Open spec gap, not triggered |

---

## §7. Score Projections for Run-14

**Note**: Projections apply a 50% discount — midpoint between ideal (all fixes landed, best case) and minimum (all failures recur). "After 50% discount" = the expected realistic range.

### Minimum (no fixes land)

- **Quality**: 25/25 (100%) — committed files likely remain clean; failures will be caught by checkpoint rollback again
- **Files**: 7-12 — checkpoint failures may recur with same type-safety pattern; without smart rollback, collateral losses continue
- **Cost**: ~$6-7 — sunk cost from rollbacks persists
- **After 50% discount**: 25/25, 7-10 files

### Target (P1 fixes: smart rollback + type-safety guidance)

- **Quality**: 25/25 (100%) maintained
- **Files**: 13 — with smart rollback, collateral losses eliminated; summary-manager.js (8 spans), index.js, mcp/server.js, journal-manager.js recover
- **Cost**: ~$3-4 — sunk cost eliminated; genuine work costs only
- **After 50% discount**: 25/25, 10-13 files, cost ~$4-5

### Target + summaryNode fix (all 3 P1 fixes)

- **Quality**: 25/25 (100%)
- **Files**: 13+ — journal-graph.js fully commits (was partial/skipped for 3 runs)
- **Spans**: ~30+ (vs 16 in run-13)
- **After 50% discount**: 25/25, 12-13 files, PR likely

### Summary

The smart rollback fix (RUN13-1) is the highest-leverage change for run-14. It doesn't improve agent quality directly, but it converts 10 sunk-cost rollbacks into committed work. Combined with the type-safety guidance (RUN13-2), run-14 could recover to run-11's file count (13) while maintaining 25/25 quality.
