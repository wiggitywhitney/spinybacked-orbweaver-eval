// ABOUTME: Failure deep-dives for run-27 — one partial file (summary-manager.js regression), run-level observations.
# Failure Deep-Dives — Run-27

**Run-27 result**: 13 committed, 0 failed, 1 partial (summary-manager.js), 18 correct skips.

---

## Partial File: summary-manager.js

**Outcome**: 7 spans committed (of 9 possible), 2 functions skipped — `readDayEntries` and `readMonthWeeklySummaries`. 2 attempts recorded in the summary line; the instrumentation report (`src/managers/summary-manager.instrumentation.md` on the instrument branch) lists 3 rows in its Validation Journey (2 full-file attempts, then a third function-level-fallback pass) — the "2 attempts" figure appears to count only full-file attempts, excluding the fallback pass. Worth a terminology note for the handoff, not a scoring issue.

**This is a regression.** Run-26 confirmed all 9 exported async functions committing cleanly (RUN25-1 fix). Run-27 reverts to run-25's exact failure shape: 7 spans committed, 2 functions rejected on COV-003 (Error Recording) — but not the *same* 2 functions as run-25 (`readWeekDailySummaries`, `readMonthWeeklySummaries`). Run-27 rejects `readDayEntries` and `readMonthWeeklySummaries` instead. `readWeekDailySummaries` — rejected in run-25 — commits cleanly in run-27.

**Validator errors** (from `spiny-orb-output.log` lines 910, 920):
```text
readDayEntries: skipped — Validation failed: COV-003, NDS-003 — COV-003 check failed: catch block at line 27
does not record error on span. Add span.recordException(error) and span.setStatus({ code: SpanStatusCode.ERROR })
in catch blocks to ensure errors are visible in traces.

readMonthWeeklySummaries: skipped — Validation failed: COV-003 — COV-003 check failed: catch block at line 28
does not record error on span. Add span.recordException(error) and span.setStatus({ code: SpanStatusCode.ERROR })
in catch blocks to ensure errors are visible in traces.
```

No `Agent thinking` block was printed for this file's attempts (confirmed: no `Agent thinking` header appears between "Processing file 28 of 32" and the next file at line 970) — consistent with the D-1 pattern that only attempt 1 reasoning is normally captured, and here even attempt 1 wasn't. The debug dump (`debug-dumps/src/managers/summary-manager.js`) contains the final committed file state — the 2 rejected functions appear in it **uninstrumented** (reverted to original source, no span, no tracer call), not as a failed instrumentation attempt. The actual rejected attempt code is not recoverable, matching run-25's note that debug dumps don't preserve intermediate attempts for partial files.

### Root Cause: Confirms and Sharpens Run-25's `isExpectedConditionCatch` Finding

Run-25's failure deep-dive (see `evaluation/javascript/commit-story-v2/run-25/failure-deep-dives.md`) proposed that the validator's `isExpectedConditionCatch` check distinguishes two catch shapes:

1. `if (err.code === 'ENOENT') <return-or-skip>; throw err;` — treated as a genuine unhandled-error path after an ENOENT guard → **flagged** for COV-003
2. `if (err.code !== 'ENOENT') throw err;` — ENOENT is the graceful path, non-ENOENT rethrows to the parent → **accepted** as graceful degradation (NDS-007)

Run-27's committed source gives direct, unambiguous confirmation of this exact split, because the three functions land on different sides of it:

| Function | Catch shape present | Result |
|----------|---------------------|--------|
| `readDayEntries` | Shape 1 only: `if (err.code === 'ENOENT') return []; throw err;` (line 55-57 of the committed file) | **Rejected** (COV-003 + NDS-003) |
| `readWeekDailySummaries` | Shape 2 only: `if (err.code !== 'ENOENT') throw err;` (inner loop catch) | **Committed** cleanly (1 span) |
| `readMonthWeeklySummaries` | **Both**: shape 1 on the outer `readdir()` catch (line 537-538) and shape 2 on the inner per-file loop catch | **Rejected** (COV-003) |

`readMonthWeeklySummaries` is the clearest evidence: it contains one catch of each shape, and only the shape-1 one is cited by the validator as the failure. This is the same mechanism run-25 identified, now demonstrated within a single function rather than across two.

The `NDS-003` co-failure on `readDayEntries` (not seen on `readMonthWeeklySummaries`, which only got COV-003) indicates the agent's rejected attempt for `readDayEntries` altered code beyond the catch block — likely restructuring the `if (err.code === 'ENOENT') return [];` early-return into something that also changed the function's original control flow shape, which NDS-003 (Code Preserved) then flagged. This can't be confirmed without the discarded attempt code.

**This is not a new bug — it's the same validator gap from run-25, un-fixed.** Run-26's single clean run was not a fix landing; it was one run where none of `summary-manager.js`'s exported functions happened to use catch shape 1. Run-25's Decision Log entry D-1 ("schema stays as-is... agents must comply with declared types") does not cover this — this is a validator-classification gap in `isExpectedConditionCatch`, not a schema/type issue. spiny-orb issue tracking should be checked for whether run-25's Option A (teach `isExpectedConditionCatch` to accept shape 1 as graceful degradation too) or Option B (prompt guidance) was ever filed; pre-run verification for this run did not surface a fix for it, and none was expected to (RUN26-1/RUN26-2/attribute-undercounting were the tracked fix targets, not this).

### What the Agent Could Have Done

Same two options run-25 identified apply unchanged:
1. Rewrite `if (err.code === 'ENOENT') return [];` as `if (err.code !== 'ENOENT') throw err; return [];` — reshapes into the accepted pattern without changing behavior.
2. Add explicit error recording on the shape-1 catch before the `throw`:
   ```javascript
   } catch (err) {
     if (err.code === 'ENOENT') return [];
     span.recordException(err);
     span.setStatus({ code: SpanStatusCode.ERROR });
     throw err;
   }
   ```

Neither was applied; both functions were left uninstrumented instead.

---

## Run-Level Observations

### ×3-Attempt Files — No Accompanying Quality Failure

Two files required 3 attempts: `journal-graph.js` and `summarize.js`. Both committed cleanly (4 spans/3 attributes and 3 spans/3 attributes respectively, 7/7 and 12/12 functions instrumented with no skips). No `Agent thinking` block is present in the log for either file's retry attempts — consistent with the run-26 precedent that only attempt 1 reasoning is captured and retries beyond it are silent except for the final attempt count. `journal-graph.js` continues its established attempt-count variance (2 in some runs, 3 in others; matches run-26's attempt count exactly) and is separately tracked as the tenth consecutive success in `run-summary.md`'s Fix Verification table. Neither file meets the "committed files with ≥3 attempts AND quality failure" threshold for a dedicated entry.

### PR Auto-Created — No Manual Recovery Needed

PR #94 was auto-created successfully, unlike run-26's manual recovery (RUN26-3). This breaks a streak of exactly one manual-recovery run and resumes the AUTO push/PR pattern established in runs 19–21, 23–25.

### Overnight Interactive-Prompt Pause (Not a Failure, But Log-Invisible)

The run's reported 21h 21m duration was dominated by an unattended `PROGRESS.md` accept/edit/skip prompt that sat waiting for terminal input overnight — actual instrumentation work across all 32 files completed in well under an hour. The prompt text never appeared in the piped `spiny-orb-output.log`; the log jumps directly from the push step to the final "Completed in..." line. This is not a file-level or run-level failure, but it is a new instance of the D-7 "apparent stall is actually a live prompt" pattern via a different prompt than D-7's `Proceed? [y/N]`. See `run-summary.md` Key Findings and `lessons-for-prd28.md` for the full note and cascade recommendation.

### Cost Down vs Run-26

$9.40 vs run-26's $11.15, despite summary-manager.js's new partial-file retry cycle. Token usage also down (272.3K/356.1K vs 340.3K/411.1K input/output). No cost driver investigation needed — this run's totals moved in the favorable direction.
