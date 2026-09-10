// ABOUTME: Baseline comparison for run-27 — cross-run quality trend and key changes vs runs 2–26.
# Baseline Comparison — Run-27 vs Runs 2–26

---

## Cross-Run Quality Trend (Full History)

| Run | Date | Quality | Gates | Files | Spans | Cost | Push/PR | IS | Q×F |
|-----|------|---------|-------|-------|-------|------|---------|-----|-----|
| 2 | 2026-03-12 | 20/27 (74%) | 3/4 | 10 | — | — | NO | — | 7.4 |
| 3 | 2026-03-13 | 19/26 (73%) | 4/4 | 11 | — | — | NO | — | 8.0 |
| 4 | 2026-03-16 | 15/26 (58%) | 4/4 | 16 | — | $5.84 | NO | — | 9.2 |
| 5 | 2026-03-17 | 23/25 (92%) | 5/5 | 9 | 17 | $9.72 | NO | — | 8.3 |
| 6 | 2026-03-20 | 21/25 (84%) | 5/5 | 5 | 16 | $11.02 | NO | — | 4.2 |
| 7 | 2026-03-20 | 22/25 (88%) | 5/5 | 13 | 28 | $3.22 | NO | — | 11.4 |
| 8 | 2026-03-21 | 23/25 (92%) | 5/5 | 12 | 28 | $4.00 | NO | — | 11.0 |
| 9 | 2026-03-21 | **25/25 (100%)** | 5/5 | 12 | 26 | $3.97 | NO | — | 12.0 |
| 10 | 2026-03-23 | 23/25 (92%) | 5/5 | 12 | 28 | $4.36 | NO | — | 11.0 |
| 11 | 2026-03-30 | **25/25 (100%)** | 5/5 | 13 | 39 | $4.25 | YES (#60) | — | 13.0 |
| 12 | 2026-04-09 | 23/25 (92%) | 5/5 | 12+1p | 31 | $5.19 | YES (#61) | — | 11.0 |
| 13 | 2026-04-12 | **25/25 (100%)** | 5/5 | 7 | — | — | YES (#62) | — | 7.0 |
| 14 | 2026-04-15 | 22/25 (88%) | 5/5 | 12 | — | — | YES (#65) | — | 10.6 |
| 15 | 2026-05-03 | 24/25 (96%) | 5/5 | 14 | ~37 | $6.44 | YES (#66) | 70 | 13.4 |
| 16 | 2026-05-11 | 22/25 (88%) | 5/5 | 10+3p | ~24 | $12.29 | YES (#68) | 80 | 8.8 |
| 17 | 2026-05-12 | 22/25 (88%) | **4/5** | 10+1p | ~28 | $10.43 | YES (#69) | 90 | 8.8 |
| 18 | 2026-05-16 | 24/25 (96%) | 5/5 | 11 | 36 | $9.16 | YES (#70, manual) | 90 | 10.6 |
| 19 | 2026-05-25 | 21/25 (84%) | 5/5 | 10+3p | 30 | $8.83 | AUTO (#71) | 80 | 8.4 |
| 20 | 2026-06-01 | 24/25 (96%) | 5/5 | 12 | 42 | $9.08 | AUTO (#73) | 80 | 11.5 |
| 21 | 2026-06-04 | 23/25 (92%) | 5/5 | 12 | 42 | ~$8.10 | AUTO (#74) | 90 | 11.0 |
| 23 | 2026-06-10 | 24/25 (96%) | 5/5 | 13+1p | 45 | $7.84 | AUTO (#75) | 80 | 12.48 |
| 24 | 2026-06-18 | 23/25 (92%) | 5/5 | 14 | 48 | ~$3.70 | AUTO (#81) | 80 | 12.88 |
| 25 | 2026-06-19 | 24/25 (96%) | 5/5 | 13+1p | 47 | $7.38 | AUTO (#86) | 100 | 12.48 |
| 26 | 2026-07-17 | 23/25 (92%) | 5/5 | 14 | 41 | $11.15 | MANUAL (#91) | 100 | 12.88 |
| **27** | **2026-09-02** | **21/25 (84%)** | **5/5** | **13+1p** | **48** | **$9.40** | **AUTO (#94)** | **100** | **10.92** |

Run-22 was never executed (PRD #115 closed 2026-06-05 without a run). Run-23 follows directly from run-21; run-25 follows directly from run-24; run-26 follows directly from run-25; run-27 follows directly from run-26.

Run-27 spans: 48 total (41 spans from 13 committed files + 7 spans from the 2-function-short partial `summary-manager.js`) — ties run-24's all-time record of 48, but run-24's was 14 files fully committed with 0 partial, while run-27 reaches the same total across one fewer committed file plus a partial. Push/PR: first AUTO success after run-26's one manual recovery (which itself was an eval-side premature recovery during a paused approval prompt, not a spiny-orb defect — see run-26 D-7).

---

## Dimension Trend (Runs 23–27)

| Dimension | Run-23 | Run-24 | Run-25 | Run-26 | **Run-27** |
|-----------|--------|--------|--------|--------|-----------|
| NDS | 2/2 | 2/2 | 2/2 | 2/2 | **2/2** |
| COV | 5/5 | 5/5 | 4/5 | 5/5 | **4/5** |
| RST | 4/4 | 4/4 | 4/4 | 4/4 | **4/4** |
| API | 3/3 | 3/3 | 3/3 | 3/3 | **3/3** |
| SCH | 3/4 | 3/4 | 4/4 | 3/4 | **2/4** |
| CDQ | 7/7 | 6/7 | 7/7 | 6/7 | **6/7** |
| **Total** | **24/25** | **23/25** | **24/25** | **23/25** | **21/25** |

Run-27 breaks the runs-23–26 oscillation between 23/25 and 24/25 with a new series low of 21/25 (84%) — the worst score since run-6 (2026-03-20, 21/25) and the first time SCH has dropped below 3/4 since the rubric stabilized at 25 rules. NDS, RST, and API remain at 100% across every measured run since run-5.

---

## Key Changes in Run-27

### 1. Quality: 23/25 → 21/25 (-2 points, series low since run-6)

Run-26 scored 23/25 with two isolated new failures (SCH-003, CDQ-007). Run-27 drops further, driven by two independent new failures neither of run-27's primary goals (RUN26-1, RUN26-2) targeted:

- **COV-003 FAIL (recurring)**: `summary-manager.js` reverts to a 7/9-function partial commit — the same `isExpectedConditionCatch` validator gap `failure-deep-dives.md` traces to run-25, now confirmed via direct source comparison as the identical catch-shape split, just against a different function pair (`readDayEntries`, `readMonthWeeklySummaries` vs. run-25's `readWeekDailySummaries`, `readMonthWeeklySummaries`). Run-26's clean 9/9 pass was never a fix landing — it was one run where no function happened to use the flagged shape.
- **SCH-002 FAIL (new)**: `summarize.js` declares `commit_story.journal.dates_count` for a date count in `runSummarize`, then reuses the same freshly-declared key in `runWeeklySummarize` for a week count — a same-file, same-pass contradiction of its own declared meaning.

Both of run-27's primary goals were only partially met:
- **RUN26-1 (SCH-003, journal-manager.js)**: type mismatch fixed (raw int, no `String()` wrapper), but the value now writes into the pre-existing `quotes_count` key — registered for developer-quote count, not reflections. Scored as an unrubriced finding (no existing rule covers "correct type, wrong chosen key"), not a clean SCH-003 pass. The same underlying `String(x.length)`-vs-`int` pattern this fix sidestepped recurred independently in two other files this run (`git-collector.js`, `summary-detector.js`), keeping SCH-003 itself failed.
- **RUN26-2 (CDQ-007, journal-paths.js)**: still unresolved, and the identical self-identified-and-declined `basename()` pattern widened from 1 file (run-26) to 7 files (run-27), all sharing one root cause.

### 2. File Count: 13 Committed, 1 Partial (Regression from Run-26's Clean 14)

Run-26 tied run-24's record of 14 committed, 0 partial. Run-27 regresses to run-25's shape (13 committed + 1 partial), via `summary-manager.js`'s COV-003 recurrence rather than a new bug.

### 3. Span Count: 48 (Ties Run-24's All-Time Record)

Despite fewer committed files than run-26, run-27 produces more total spans (48 vs 41) — ties run-24's record, though via a different file mix (13 committed + the partial file's 7 spans vs. run-24's 14 fully committed files).

### 4. Q×F: 10.92 — Lowest Since Run-21 (11.0)

Q×F = 21/25 × 13 = 10.92, down from run-26's 12.88 and run-25's 12.48. Both the quality percentage (84% vs 92%/96%) and the committed-file count (13 vs 14) moved against this run relative to run-26.

### 5. IS Score: 100/100 (Third Consecutive Perfect Score)

Run-27 matches run-25's and run-26's all-time-high IS score exactly, now a three-run streak.

| IS Rule | Run-27 | Run-26 | Run-25 | Change |
|---------|--------|--------|--------|--------|
| SPA-001 (≤55 INTERNAL spans for commit-story-v2) | ✅ 47 spans | ✅ 20 spans | ✅ 31 spans | Stable — comfortably within per-target threshold across all three runs |
| SPA-002 (no orphan spans) | ✅ PASS | ✅ PASS | ✅ PASS | Stable |
| All other applicable rules | ✅ PASS | ✅ PASS | ✅ PASS | Stable |

This run required filtering the shared `eval-traces.json` before scoring for the first time (D-11) — the persistent collector's file had accumulated 4,759 unfiltered spans across targets since 2026-08-03, and scoring it raw gave a false 70/100 from another target's traces. Filtering to this run's own 47-span window restored the true 100/100. This is an eval-infrastructure fix, not a spiny-orb finding.

### 6. Cost: $9.40 (Down from Run-26's $11.15, -15.7%)

Reverses run-26's cost spike. Fewer 3-attempt files this run (2 vs. 3) and lower token usage overall (272.3K/356.1K vs. 340.3K/411.1K input/output), despite one new partial-file retry cycle (`summary-manager.js`).

### 7. Push/PR: AUTO Success, First Since Run-25

PR #94 auto-created with no manual recovery needed — breaking run-26's one-run manual-recovery interruption (which was itself an eval-side premature recovery during a paused approval prompt, not a spiny-orb defect). A second, different live-prompt pause pattern surfaced this run: an unattended `PROGRESS.md` `[a]ccept/[e]dit/[s]kip` confirmation sat overnight, inflating total duration to 21h 21m even though actual instrumentation work finished in under an hour — and, like D-7's `Proceed? [y/N]` prompt, the prompt text never reached the piped log.

---

## Score Projection Validation

PRD #153 defined success criteria (RUN26-1/RUN26-2 fix verification plus no regression from run-26):

| Criterion | Projected | Actual | Verdict |
|-----------|-----------|--------|---------|
| RUN26-1 (SCH-003) resolved — `journal-manager.js` emits true int | SCH returns to 4/4 | ⚠️ Type fixed, but mapped onto wrong registered key (`quotes_count`); SCH dropped to 2/4 (two other files recurred the same pattern) | **Not met** |
| RUN26-2 (CDQ-007) resolved — `journal-paths.js` fix or documented accepted advisory | CDQ returns to 7/7 only if an actual fix landed | ❌ Still unresolved; widened to 7 files. CDQ held at 6/7 nominally but the underlying footprint grew sharply | **Not met** |
| Quality ≥ 23/25 (no regression from run-26) | ≥23/25, 25/25 if both fixes land | ❌ 21/25 (84%) — two new, unrelated failures (COV-003, SCH-002) neither goal targeted | **Not met** |
| Push/PR succeeds automatically | YES | ✅ AUTO (#94), nineteenth-plus consecutive automated attempt overall | **Met** |
| IS ≥ 100/100 | ≥100/100 | ✅ 100/100 (third consecutive) | **Met** |

The two primary fix-verification goals were both only partially addressed, and the run as a whole regressed further than either goal's failure alone would explain — the dominant driver was two new, independent failures (COV-003's recurring validator gap, SCH-002's same-file key-meaning contradiction) that neither RUN26-1 nor RUN26-2 targeted.

---

## Records and Notable Milestones (Updated)

| Record | Value | Run |
|--------|-------|-----|
| Highest quality | 25/25 (100%) | Runs 9, 11, 13 |
| Highest Q×F | 13.4 | Run-15 |
| Most files committed (0 partial) | 14 | Run-15, Run-24, Run-26 |
| Most spans (committed + partial) | 48 | Run-24 (14 committed, 0 partial), **Run-27 (tied — 13 committed + 1 partial)** |
| Lowest cost | $3.22 | Run-7 |
| Highest cost | $12.29 | Run-16 |
| First push/PR | Run-11 | #60 |
| First IS score | Run-15 | 70/100 |
| Highest IS | 100/100 | Run-25, Run-26, **Run-27 (three-run streak)** |
| First fully automatic push+PR | Run-19 | #71 |
| Lowest quality since rubric stabilized (run-5+) | 21/25 (84%) | Run-6, Run-19, **Run-27 (tied)** |

---

## Failure Classification (Active Issues Into Run-28)

| Failure | First Seen | Runs Open | Root Cause | Fix Available |
|---------|-----------|-----------|------------|---------------|
| COV-003: summary-manager.js partial-commit recurrence (`isExpectedConditionCatch` gap) | Run-25 | 2 (run-25, run-27; absent run-26) | Validator flags a graceful-degradation ENOENT catch shape identical in structure to an accepted shape | Validator fix: `isExpectedConditionCatch` needs to distinguish the two catch shapes rather than flagging any ENOENT-pattern-plus-throw combination uniformly |
| SCH-002: summarize.js `dates_count`/weeks mismatch | **Run-27** | 1 | New extension key's declared meaning not cross-checked against its own later `setAttribute` calls in the same file/pass | Fix needed: verify every `setAttribute` against a newly-declared key is consistent with that key's declared semantics, not just check for duplicate/synonym key invention |
| SCH-003: `String(x.length)`-vs-`int`-key coercion | Run-26 (RUN26-1) | 2 (recurring, different files each time: journal-manager.js → git-collector.js, summary-detector.js) | Validator does not catch explicit `String(...)` wrapping of a numeric value against an `int`/`number`-typed registry attribute | Validator fix: extend SCH-003 to detect `String(...)` coercion patterns, not just literal AST type inference |
| CDQ-007: raw `repo_path`/`file_path`, self-identified fix declined | Run-26 (RUN26-2) | 2 (widened from 1 file to 7) | Self-acknowledged agent limitation — `basename()` available but not imported per-file; generic advisory boilerplate obscures the cases where a fix is actually cost-free | Fix needed: either each of the 7 affected modules imports `basename` and applies it, or all 7 migrate to a shared helper so future files reuse it |

**New, unrubriced watch item:**

| Item | First Seen | Status |
|------|-----------|--------|
| Correct type, wrong registered key (`journal-manager.js`'s `quotes_count` holding a reflection count) | **Run-27** | No existing rule targets a semantically-mismatched-but-correctly-typed key reuse. Same pattern shape as SCH-002's finding but across files/runs rather than within one file/pass |

**Historical / structural watch item (not an active issue):**

| Item | First Seen | Status |
|------|-----------|--------|
| IS SPA-001: INTERNAL span count | Run-15 | Structurally resolved via per-target threshold (PR #142, 55 for commit-story-v2); holds across run-25 (31 spans), run-26 (20 spans), and run-27 (47 spans). No action needed |

**Resolved from Run-26 into Run-27:**

None. RUN26-1's type mismatch is fixed but replaced by a new semantic-mismatch finding on the same attribute; RUN26-2 remains open and widened.
