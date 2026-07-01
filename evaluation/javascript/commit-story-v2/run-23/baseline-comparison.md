# Baseline Comparison — Run-23 vs Runs 2–21

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
| **23** | **2026-06-10** | **24/25 (96%)** | **5/5** | **13+1p** | **45** | **$7.84** | **AUTO (#75)** | **80** | **12.48** |

Run-22 was never executed (PRD #115 closed 2026-06-05 without a run). Run-23 follows directly from run-21.

Run-23 spans: 45 committed (new all-time record; prior record 42, shared by runs 20 and 21). Partial files: 1 (summary-detector.js, 4/5 functions). Failed files: 0 (first clean fail-count in three runs). Push/PR: 15th consecutive auto-success (streak extends to runs 11–23 for any push; runs 19–21, 23 for auto).

---

## Dimension Trend (Runs 19–23)

| Dimension | Run-19 | Run-20 | Run-21 | **Run-23** |
|-----------|--------|--------|--------|-----------|
| NDS | 2/2 | 2/2 | 2/2 | **2/2** |
| COV | 2/5 | 4/5 | 4/5 | **5/5** |
| RST | 4/4 | 4/4 | 4/4 | **4/4** |
| API | 3/3 | 3/3 | 3/3 | **3/3** |
| SCH | 3/4 | 4/4 | 4/4 | **3/4** |
| CDQ | 7/7 | 7/7 | 6/7 | **7/7** |
| **Total** | **21/25** | **24/25** | **23/25** | **24/25** |

COV recovers to 5/5 for the first time since run-18. CDQ recovers to 7/7, resolving the run-21 regression. New SCH regression to 3/4 — first SCH failure since run-19. NDS, RST, API remain at 100% across all measured runs.

---

## Key Changes in Run-23

### 1. Quality Improvement: 23/25 → 24/25 (+1 point)

Run-21 regressed to 23/25 via two failures (CDQ-001 and COV-005). Run-23 recovers to 24/25 with both resolved, but introduces a new SCH-003 regression.

**+1 point: CDQ-001 RESOLVED — no double-end in any committed file**

Run-21's CDQ-001 failure (claude-collector.js double-end inside `startActiveSpan` callback) does not recur. Issue #915 prompt guidance clarifying `startActiveSpan` auto-close semantics was effective. context-capture-tool.js (newly committed in run-23) also uses `finally { span.end() }` correctly.

**+1 point: COV-005 RESOLVED — summary-manager.js `saveDailySummary` skip path**

The run-21 gap (`entry_date` set only after the early-return guard, producing zero attributes on the file-already-exists path) is resolved. `entry_date` is now set before the guard unconditionally. All 9 summary-manager.js spans have ≥1 domain attribute.

**−1 point: SCH-003 FAIL (new) — two files with integer-vs-string type mismatch**

- `git-collector.js`: `commit_story.git.diff_size` declared `type: string` in agent-extensions.yaml but set as `diff.length` (bare integer).
- `commands/summarize.js`: Three `*_summaries_generated` attributes declared `type: string` but set as bare integers (`result.generated.length`). The same attributes are correctly wrapped with `String()` in `auto-summarize.js`, but the newly instrumented `summarize.js` did not reuse that pattern.

Both failures share the same root cause: no runtime error occurs when an integer is passed to `setAttribute` for a `type: string` declaration, so the mismatch is silent until evaluation. This is a new failure class for run-23.

### 2. File Count: 13 Committed + 1 Partial (Record Tie for Committed)

13 committed files ties the run-23 goal and run-11's record. Both P1 fixes landed:

- **mcp/server.js** (RUN21-1): committed clean in 1 attempt after 3 consecutive failures (runs 20+21). Issue #917 `removeOtelImports` trivia-doubling fix resolved the blank-line-near-JSDoc NDS-003 variant.
- **index.js** (RUN21-2): committed clean in 1 attempt after failing in run-21. Issue #916 "do not reformat single-line import blocks" guidance resolved the import expansion context pollution.

**summary-detector.js partial**: 4/5 functions committed. `findUnsummarizedWeeks` was not committed because the agent declared `commit_story.journal.base_path` — a near-synonym of the registered `commit_story.journal.file_path`. The SCH-002 validator correctly rejected it on both attempts. No self-correction occurred. This is a regression from run-21 where the same function committed cleanly using `commit_story.summary.unsummarized_weeks_count`.

### 3. Span Count: 45 (New All-Time Record)

Run-23 sets a new record with 45 committed spans, breaking runs 20–21's record of 42. Drivers:

- context-capture-tool.js newly instrumented (2 spans — previously failed in run-21 via NDS-003)
- mcp/server.js newly committed (1 span — first successful commit since run-20)
- index.js newly committed (1 span — first since run-20)
- summary-manager.js maintains full 9-span suite (vs run-21's 9)
- git-collector.js maintains 6-span suite (vs run-21's 6)

The 3 new committed files contribute net +3 spans over run-21.

### 4. Q×F: 12.48 — Improvement from Run-21 (11.0)

Q×F = 24/25 × 13 = 12.48. Improvement of +1.48 from run-21. The PRD Q×F target of ≥12.5 was not met — short by 0.02. Root cause: summary-detector.js counts as a partial (1 missing function), not a full committed file. If summary-detector.js had committed all 5 functions, Q×F = 24/25 × 14 = 13.44. If SCH-003 had not regressed, Q×F = 25/25 × 13 = 13.0.

### 5. IS Score: 80/100 (Regression from Run-21's 90/100)

Run-21 recovered IS to 90/100 (SPA-002 resolved). Run-23 regresses to 80/100 with a new SPA-002 failure.

| IS Rule | Run-23 | Run-21 | Status |
|---------|--------|--------|--------|
| SPA-001 (≤10 INTERNAL spans) | ❌ 25 spans | ❌ 11 spans | Structural; calibration mismatch grows as span count increases |
| SPA-002 (no orphan spans) | ❌ span b5a83f5e | ✅ PASS | **REGRESSION** — new orphan parentSpanId |
| All other applicable rules | ✅ PASS | ✅ PASS | Stable |

SPA-001 worsened: run-23's 25 INTERNAL spans vs run-21's 11. The +3 new committed files each add spans, growing the gap with the 10-span calibration limit. SPA-002 regression (orphan span) is unexpected given run-21's clean pass — run-21's resolution may have been incidental to that run's span composition rather than a structural fix. The SPA-002 orphan span `b5a83f5e` has `parentid: 3a70d1c5` which does not appear in the trace as a valid span ID.

service.instance.id: `2140b04c-6055-4731-8b53-2d4225017478` (confirmed in Datadog APM at 2026-06-11T01:34:14Z).

### 6. Cost: $7.84 (Lowest in Runs 18–23 Era)

$7.84 is the lowest since run-18's $9.16. Cached input (385.9K) significantly offset non-cached input (260.6K). The P1 fix confirmations (fewer retry chains on mcp/server.js and index.js) are the primary drivers of cost reduction from run-21's $8.10.

### 7. Push/PR: 15th Consecutive Auto-Success

PR #75 created automatically. The consecutive auto-push streak extends to 4 runs (runs 19–21, 23 — run-22 was never executed).

---

## Score Projection Validation

PRD #126 defined three scenarios:

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| Both P1s land + CDQ/COV clean | 25/25 (100%), 14 files, Q×F 14.0 | 24/25 (96%), 13+1p, Q×F 12.48 | **Not met** — SCH-003 regression (new), summary-detector.js partial (SCH-002) |
| Only RUN21-1 lands (mcp/server.js), CDQ clean | 25/25 (100%), 13 files, Q×F 13.0 | 24/25 (96%), 13+1p, Q×F 12.48 | **Near miss** — both P1s landed; index.js committed; new SCH-003 failure offset the gain |
| Conservative (neither P1 lands) | 25/25 (96%), 12 files, Q×F 12.0 | 24/25 (96%), 13+1p, Q×F 12.48 | **Exceeded** — both P1s landed; SCH-003 regression absorbed by file count gain |

Both P1 fixes landed cleanly. The failure to reach 25/25 is entirely attributable to SCH-003: two independent type mismatch failures in newly instrumented files (`git-collector.js` and `commands/summarize.js`). Without SCH-003, run-23 achieves 25/25 × 13 = Q×F 13.0 — comfortably above the PRD target. SCH-003 is a new failure class that was not anticipated in the run-21 projections.

---

## Records and Notable Milestones (Updated)

| Record | Value | Run |
|--------|-------|-----|
| Highest quality | 25/25 (100%) | Runs 9, 11, 13 |
| Highest Q×F | 13.4 | Run-15 |
| Most files committed | **13** | Runs 11, 23 (tied) |
| **Most spans (committed)** | **45** | **Run-23 (new record)** |
| Lowest cost | $3.22 | Run-7 |
| Highest cost | $12.29 | Run-16 |
| First push/PR | Run-11 | #60 |
| First IS score | Run-15 | 70/100 |
| Highest IS | 90/100 | Runs 17, 18, 21 |
| Longest consecutive push streak | 13 (runs 11–23, excl. 22) | Run-23 extends |
| First fully automatic push+PR | Run-19 | #71 |
| **Consecutive auto-push** | **4 (runs 19–21, 23)** | **Run-23 extends** |
| 0 failed files | Run-23 | First zero-failure run since run-13 |

---

## Failure Classification (Active Issues Into Run-24)

| Failure | First Seen | Runs Open | Root Cause | Fix Available |
|---------|-----------|-----------|------------|---------------|
| SCH-003: git-collector.js `diff_size` integer-as-string | **Run-23** | 1 | `diff.length` set without `String()` conversion; declared `type: string` | `span.setAttribute('commit_story.git.diff_size', String(diff.length))` or change schema to `type: int` |
| SCH-003: commands/summarize.js `*_summaries_generated` | **Run-23** | 1 | `result.generated.length` set without `String()` conversion; identical attrs correctly wrapped in auto-summarize.js | Add `String()` conversion on 3 setAttribute calls; or align schema to `type: int` |
| summary-detector.js partial: `findUnsummarizedWeeks` | **Run-23** | 1 | Agent declared `commit_story.journal.base_path` (near-synonym of registered `file_path`); SCH-002 validator rejected; no self-correction in 2 attempts | Prompt guidance: prefer reusing registered output-count attributes over declaring new input-parameter attributes |
| IS SPA-001: INTERNAL span count (structural) | Run-15 | 8 | 25 INTERNAL spans vs 10-span calibration limit; calibration mismatch grows with each new committed file | Not a defect; IS calibration limit needs adjustment for LangGraph-scale apps |
| IS SPA-002: orphan parentSpanId (new instance) | **Run-23** | 1 | span b5a83f5e has parentid 3a70d1c5 which does not exist in the trace; different span from run-21 SPA-002 failure (which resolved cleanly in run-21) | Context propagation gap; root file unclear — investigate which new committed file introduces the broken parent chain |

**Resolved from run-21 into run-23:**

| Failure | File(s) | Status |
|---------|---------|--------|
| CDQ-001: claude-collector.js double-end in `startActiveSpan` | claude-collector.js | **RESOLVED** — issue #915 prompt guidance confirmed effective; no double-end in any run-23 file |
| COV-005: summary-manager.js `saveDailySummary` skip-path zero attrs | summary-manager.js | **RESOLVED** — `entry_date` now set before early-return guard |
| NDS-003: mcp/server.js blank-line-near-JSDoc (RUN21-1) | mcp/server.js | **RESOLVED** — issue #917 `removeOtelImports` trivia-doubling fix; committed clean in 1 attempt |
| NDS-003 + NDS-007: index.js import expansion (RUN21-2) | index.js | **RESOLVED** — issue #916 "do not reformat single-line import blocks" guidance; committed clean in 1 attempt |
