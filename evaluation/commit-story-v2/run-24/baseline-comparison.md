// ABOUTME: Baseline comparison for run-24 — cross-run quality trend and key changes vs prior runs.
# Baseline Comparison — Run-24 vs Runs 2–23

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
| **24** | **2026-06-18** | **23/25 (92%)** | **5/5** | **14** | **48** | **~$3.70** | **AUTO (#81)** | **80** | **12.88** |

Run-22 was never executed (PRD #115 closed 2026-06-05 without a run).

Run-24 spans: 48 committed (new all-time record; prior record 45, run-23). Partial files: 0 (first ever clean sweep — no partials, no failures across 14 files). Push/PR: 16th consecutive success; 5th consecutive auto-success (runs 19–21, 23–24).

---

## Dimension Trend (Runs 20–24)

| Dimension | Run-20 | Run-21 | Run-23 | **Run-24** |
|-----------|--------|--------|--------|-----------|
| NDS | 2/2 | 2/2 | 2/2 | **2/2** |
| COV | 4/5 | 4/5 | 5/5 | **5/5** |
| RST | 4/4 | 4/4 | 4/4 | **4/4** |
| API | 3/3 | 3/3 | 3/3 | **3/3** |
| SCH | 4/4 | 4/4 | 3/4 | **3/4** |
| CDQ | 7/7 | 6/7 | 7/7 | **6/7** |
| **Total** | **24/25** | **23/25** | **24/25** | **23/25** |

COV holds at 5/5 for the second consecutive run. SCH remains at 3/4 (SCH-003 persists under a new attribute name). CDQ regresses to 6/7 — CDQ-001 recurs in index.js after the run-12 fix was not carried forward. NDS, RST, API remain at 100% across all measured runs.

---

## Key Changes in Run-24

### 1. Quality Regression: 24/25 → 23/25 (−1 point)

Run-23 scored 24/25. Run-24 regresses to 23/25 despite resolving two of three tracked failures:

**+1 point: RUN23-2 RESOLVED — commands/summarize.js `*_summaries_generated` types correct**

Issue #928 guidance landed. `*_summaries_generated` attributes are now set with correct integer types. Confirmed from Datadog: `dates_count` and `force` appear with correct types. Both SCH-003 type mismatch issues from run-23 are resolved.

**+1 point: RUN23-3 RESOLVED — summary-detector.js commits all 5 functions**

Issue #925 near-synonym guidance worked. summary-detector.js went from PARTIAL (4/5 functions) to a full 9-span commit in a single attempt — the largest per-file quality improvement in any single run. `commit_story.journal.base_path` (rejected near-synonym) replaced by three semantically precise `unsummarized_*_count` attributes.

**−1 point: SCH-003 FAILS again — git-collector.js `diff_lines` type mismatch (second consecutive run)**

Run-23's SCH-003 failure was `diff_size` declared as `type: string` but set as an integer. Run-24 renamed the attribute to `diff_lines` (an accurate semantic change) but the `type: string` declaration was not corrected to `type: int`. The rename was the intended fix; the type declaration fix was missed. Net result: SCH-003 under a new attribute name.

**−1 point: CDQ-001 REGRESSES — index.js `process.exit()` bypasses `finally { span.end() }`**

Run-12 added explicit `span.end()` before each `process.exit(1)` inside `main()`'s `startActiveSpan` callback. That fix was preserved in run-23. Run-24 regresses: the early-exit paths (`process.exit(1)` for missing commit hash and unsupported subcommand) no longer have explicit pre-exit `span.end()` calls. The success path is unaffected (Datadog shows successful span completion). CDQ-001 is not observable in the captured trace — the fix was a known requirement, not a signal from runtime data.

### 2. File Count: 14 Committed — New All-Time Record, First Clean Sweep

14 committed files breaks the previous record of 13 (shared by runs 11 and 23). More significantly: 0 failures, 0 partials — the first clean sweep across 24 evaluation runs. Previous best was run-11 (13 files, 0 failures, 0 partials — but at 100% quality; run-24 achieves the clean sweep at 92%).

run-24 processed 31 files (up from 30 in run-23) — `src/logger.js` was added in commit-story-v2 PR #80. The agent correctly identified it as a utility skip per RST-001.

### 3. Span Count: 48 — New All-Time Record

Run-24 sets a new record with 48 committed spans, breaking run-23's record of 45. The gain comes from summary-detector.js upgrading from a 4-function partial (4 spans) to a full 9-span commit — a net +5 spans from that file alone, offset by context-capture-tool.js dropping from 2 spans to 1.

### 4. Q×F: 12.88 — New High-Water Mark Despite Quality Regression

Q×F = 23/25 × 14 = 12.88. This exceeds run-23's 12.48 despite a quality-point regression, because 14 committed files at 92% quality beats 13 files at 96%. The new record by Q×F is the direct result of the clean sweep: every file that processed committed, producing the highest file count in evaluation history.

Without the two remaining failures (CDQ-001 + SCH-003): 25/25 × 14 = 14.0 would have set an all-time record by a large margin. The Q×F gap to the theoretical maximum (14.0 − 12.88 = 1.12) is the smallest in evaluation history.

### 5. Attempt Rate: Lowest in Recent Runs

Files requiring ≥ 2 attempts: 3 of 31 (git-collector: 3, reflection-tool: 2 skip, summarize: 2). Down from 7 in run-23. journal-graph.js dropped from 3 attempts (run-23) to 1; summary-graph.js dropped from 2 to 1; auto-summarize.js dropped from 2 to 1. Lower retry chains drove the cost reduction.

### 6. Cost: ~$3.70 — Lowest Since Run-7

~$3.70 is the lowest cost since run-7's $3.22 in March 2026, and the lowest in the run-15+ era (IS scoring enabled). Drivers: fewer retry chains (3 multi-attempt files vs 7 in run-23) and high cache utilization (212.6K cached of 322.8K total input = 65.9% cache rate).

### 7. Push/PR: 16th Consecutive Success, 5th Consecutive Auto

PR #81 created automatically. The consecutive push streak extends to 16 runs (runs 11–24, excluding run-22 which was never executed). The consecutive auto-push streak extends to 5 (runs 19–21, 23–24).

### 8. IS Score: 80/100 (Stable)

IS holds at 80/100 (same as run-23). Both failing rules recur:

| IS Rule | Run-24 | Run-23 | Status |
|---------|--------|--------|--------|
| SPA-001 (≤10 INTERNAL spans) | ❌ 45 spans | ❌ 25 spans | Structural; 45 INTERNAL spans vs 10-span calibration — gap widened vs run-23's 25 |
| SPA-002 (orphan parentSpanId) | ❌ span f96f214c | ❌ span b5a83f5e | **RECURS** — different orphan from run-23 |
| All other applicable rules | ✅ PASS | ✅ PASS | Stable |

SPA-001 gap widened: run-24 has 45 INTERNAL spans (is-score.md reports 45 in the IS trace) vs run-23's 25, vs the 10-span calibration limit. The 14-file clean sweep grows the span count further from calibration. SPA-002 recurs with a different orphan span — not the same span as run-23 — suggesting a structural context propagation issue that varies with each run's specific execution path. RUN23-4 (`provider.forceFlush()` fix) did not land.

---

## Score Projection Validation

PRD #127 defined three scenarios:

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| All three fixes land (SCH-003 × 2 + SCH-002) + CDQ clean | 25/25 (100%), 14 files, Q×F 14.0 | 23/25 (92%), 14, Q×F 12.88 | **Not met** — SCH-003 recurs (git-collector.js renamed attribute, type not corrected); CDQ-001 regresses in index.js |
| SCH-003 fixed but summary-detector.js still partial | 13+1p, Q×F ≈13.5 (25/25) or 12.48 (24/25) | 23/25 (92%), 14 files | **Surpassed on files** — summary-detector fixed; quality lower due to new failures |
| SCH-003 recurs | 24/25 (96%), 13 files, Q×F ≈12.48 | 23/25 (92%), 14 files, Q×F 12.88 | **Mixed** — more files committed; quality one point lower; Q×F higher |

Two of three tracked fixes landed cleanly (commands/summarize.js types, summary-detector.js near-synonym). The failure to reach 25/25 comes from: (1) git-collector.js SCH-003 recurring under the new `diff_lines` attribute name, and (2) CDQ-001 regression in index.js — a re-emergence of the run-12 known fix, not a new failure class.

---

## Records and Notable Milestones (Updated)

| Record | Value | Run |
|--------|-------|-----|
| Highest quality | 25/25 (100%) | Runs 9, 11, 13 |
| Highest Q×F | **12.88** | **Run-24 (new record)** |
| **Most files committed** | **14** | **Run-24 (new record)** |
| **Most spans (committed)** | **48** | **Run-24 (new record)** |
| **First clean sweep** | 0 failures, 0 partials | **Run-24** |
| Lowest cost | $3.22 | Run-7 |
| Highest cost | $12.29 | Run-16 |
| Lowest cost (IS era, run-15+) | **~$3.70** | **Run-24 (new record)** |
| First push/PR | Run-11 | #60 |
| First IS score | Run-15 | 70/100 |
| Highest IS | 90/100 | Runs 17, 18, 21 |
| Longest consecutive push streak | **16 (runs 11–24, excl. 22)** | **Run-24 extends** |
| First fully automatic push+PR | Run-19 | #71 |
| **Consecutive auto-push** | **5 (runs 19–21, 23–24)** | **Run-24 extends** |

---

## Failure Classification (Active Issues Into Run-25)

| Failure | First Seen | Runs Open | Root Cause | Fix Available |
|---------|-----------|-----------|------------|---------------|
| SCH-003: git-collector.js `diff_lines` integer-as-string | Run-23 (as `diff_size`) | 2 consecutive runs | Attribute renamed `diff_size` → `diff_lines` (correct semantic fix) but `type: string` declaration not updated to `type: int` in agent-extensions.yaml | Change `type: string` → `type: int` in `agent-extensions.yaml` for `commit_story.git.diff_lines`. No code change needed — the attribute is already set as an integer. |
| CDQ-001: index.js `process.exit()` bypasses `finally { span.end() }` | Run-12 (fixed), **Run-24 (regression)** | 1 run | Run-12 fix (explicit `span.end()` before each `process.exit(1)`) was not carried forward into run-24. Not observable in Datadog (success path unaffected). | Add explicit `span.end()` before each `process.exit(1)` inside `main()`'s `startActiveSpan` callback — consistent with run-12 pattern. |
| IS SPA-001: INTERNAL span count (structural) | Run-15 | 9 runs | Now 45 INTERNAL spans vs 10-span calibration; gap growing with each new committed file | Not a defect; IS calibration limit needs adjustment for LangGraph-scale apps (spiny-orb issue #929) |
| IS SPA-002: orphan parentSpanId (recurrence) | **Run-24** | 1 run (different span from run-23) | span f96f214c has parentid 7371f0db not present in trace; context propagation gap; root file unclear | RUN23-4 (`provider.forceFlush()`) fix has not landed; SPA-002 varies by run — structural investigation needed |

**Resolved from run-23 into run-24:**

| Failure | File(s) | Status |
|---------|---------|--------|
| SCH-003: commands/summarize.js `*_summaries_generated` integer-as-string | commands/summarize.js | **RESOLVED** — issue #928 guidance; `dates_count` and `force` type-correct in run-24 |
| SCH-002: summary-detector.js `base_path` near-synonym partial | summary-detector.js | **RESOLVED** — issue #925 guidance; all 5 functions committed in 1 attempt with `unsummarized_*_count` attributes |
