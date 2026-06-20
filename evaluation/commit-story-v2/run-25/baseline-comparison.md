// ABOUTME: Baseline comparison for run-25 — cross-run quality trend and key changes vs runs 2–24.
# Baseline Comparison — Run-25 vs Runs 2–24

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
| **25** | **2026-06-19** | **24/25 (96%)** | **5/5** | **13+1p** | **47** | **$7.38** | **AUTO (#86)** | **100** | **12.48** |

Run-22 was never executed (PRD #115 closed 2026-06-05 without a run). Run-23 follows directly from run-21; run-25 follows directly from run-24.

Run-25 spans: 47 total (40 from 13 fully committed files + 7 from summary-manager.js partial). Run-24's record of 48 committed spans stands. Push/PR: seventeenth consecutive auto-success.

---

## Dimension Trend (Runs 21–25)

| Dimension | Run-21 | Run-23 | Run-24 | **Run-25** |
|-----------|--------|--------|--------|-----------|
| NDS | 2/2 | 2/2 | 2/2 | **2/2** |
| COV | 4/5 | 5/5 | 5/5 | **4/5** |
| RST | 4/4 | 4/4 | 4/4 | **4/4** |
| API | 3/3 | 3/3 | 3/3 | **3/3** |
| SCH | 4/4 | 3/4 | 3/4 | **4/4** |
| CDQ | 6/7 | 7/7 | 6/7 | **7/7** |
| **Total** | **23/25** | **24/25** | **23/25** | **24/25** |

SCH recovers to 4/4 — first full SCH pass since run-21. CDQ recovers to 7/7 — RUN24-1 (`process.exit()` bypass) fixed. COV regresses to 4/5 — new COV-004 failure on summary-manager.js (validator false positive on conditional-rethrow ENOENT pattern). NDS, RST, API remain at 100% across all measured runs.

---

## Key Changes in Run-25

### 1. Quality: 23/25 → 24/25 (+1 point)

Run-24 scored 23/25 via two failures. Run-25 resolves both, but introduces a new COV-004 regression.

**+1 point: CDQ-001 RESOLVED (RUN24-1) — index.js `process.exit()` bypass**

`fixProcessExitSpanEnd()` AST restructure (spiny-orb commit 91e9413) moved `process.exit()` to a `.then().catch()` microtask chain *after* the `startActiveSpan` callback's `finally { span.end(); }` executes. First run with this fix confirmed at runtime. All 13 committed files use `finally { span.end() }` correctly.

**+1 point: SCH-003 DE-FACTO RESOLVED (RUN24-2) — git-collector.js `diff_lines` type mismatch**

The run-25 agent omitted `commit_story.git.diff_lines` entirely rather than reintroducing the integer-as-string mismatch. The `fixAttributeTypeCoercions()` auto-coercion backstop (same spiny-orb commit 91e9413) was not exercised in this run — the agent sidestepped the issue cleanly by omission rather than by wrapping. Issue #928 status unchanged: auto-coercion is in the codebase but untested against a live case.

**−1 point: COV-004 FAIL (new) — summary-manager.js validator false positive**

Two exported async functions (`readWeekDailySummaries`, `readMonthWeeklySummaries`) were blocked by the validator. Root cause: `cov003.ts` `isExpectedConditionCatch` treats any catch containing both an ENOENT pattern string and a `ThrowStatement` as requiring error recording. The pattern is semantically a graceful-degradation catch — ENOENT means the file doesn't exist (expected in loop-over-files scenarios), and non-ENOENT errors rethrow to the outer span. The outer catch correctly records and rethrows. The validator's conservative analysis treats the conditional rethrow as a COV-003 violation, which conflicts with NDS-007.

**Historical context**: Run-24 fully committed summary-manager.js (9 spans) by working around this pattern with an empty catch — which passes the validator but silently swallows non-ENOENT errors. The run-25 agent preserved the semantically correct original behavior and was blocked. Run-24's "fix" introduced a subtle NDS-007 violation that the run-24 validator did not catch.

### 2. File Count: 13 Committed + 1 Partial (Regression from Run-24's 14)

Run-24 achieved a new file-count record with 14 clean commits. Run-25 regresses to 13+1p — summary-manager.js partial (7/9 functions) is the sole driver. If the validator's ENOENT conditional-rethrow false positive had not fired, run-25 would have 14 files and 25/25 for a Q×F of 14.0.

### 3. Span Count: 47 (Run-24's 48-span record stands)

Run-25 produces 47 total spans (40 committed + 7 partial). Run-24 holds the all-time record at 48 committed spans. The 1-span gap comes from summary-manager.js losing 2 functions (2 spans) relative to run-24's 9 committed spans on that file.

### 4. Q×F: 12.48 — Regression from Run-24's 12.88

Q×F = 24/25 × 13 = 12.48. Ties run-23. Run-24's 12.88 (23/25 × 14) was higher despite lower quality because it had 14 fully committed files. Run-25's file-count regression from 14 to 13+1p is the sole driver of Q×F decline, despite the quality improvement from 23 to 24/25.

The PRD success criterion of Q×F ≥ 14.0 (conditional on both fixes landing) required 14 committed files and 25/25 quality. Both fixes did land, but the new COV-004 regression prevented 25/25, and the summary-manager.js partial prevented 14 files.

### 5. IS Score: 100/100 (All-Time High — +20pp from Run-24)

Run-25 achieves a perfect IS score for the first time in the series.

| IS Rule | Run-25 | Run-24 | Change |
|---------|--------|--------|--------|
| SPA-001 (≤55 INTERNAL spans for commit-story-v2) | ✅ 31 spans | ❌ 45 spans, limit 10 | **FIXED** — per-target threshold (55) applied (issue #139, PR #142) |
| SPA-002 (no orphan spans) | ✅ PASS | ❌ orphan span | **FIXED** — orphan absent in run-25 |
| All other applicable rules | ✅ PASS | ✅ PASS | Stable |

Two structural improvements combined: (1) PR #142 raised the commit-story-v2 SPA-001 threshold from 10 to 55, reflecting the structural INTERNAL span count from LangGraph instrumentation; (2) the run-25 instrumentation does not introduce the orphan span that recurred in runs 19, 20, 23, and 24. This IS scoring run also used a single clean trace (journal entry only, no summaries triggered), giving 31 INTERNAL spans — comfortably within the 55-span threshold.

### 6. Cost: $7.38 (Doubled vs Run-24's ~$3.70)

Cost doubled from run-24's series-low of ~$3.70. Drivers:
- 5 files required ×2 attempts (vs run-24's ~3 multi-attempt files)
- summary-manager.js partial workflow adds retry overhead
- journal-graph.js regressed from ×1 to ×2
- Run-24 benefited from unusually high cache hit rates that did not repeat

$7.38 is below the run-21/run-20/run-18 era ($8–9) but well above run-23/run-24.

### 7. Push/PR: Seventeenth Consecutive Auto-Success

PR #86 created automatically. The auto-push streak continues unbroken since run-19.

---

## Score Projection Validation

PRD #140 defined success criteria:

| Criterion | Projected | Actual | Verdict |
|-----------|-----------|--------|---------|
| CDQ-001 resolved (RUN24-1 fix confirmed) | index.js commits cleanly | ✅ Committed, 2 spans, CDQ-001 PASS | **Met** |
| SCH-003 de-facto resolved (RUN24-2) | `diff_lines` type-correct | ✅ Omitted by agent; auto-coercion not exercised | **Met (de-facto)** |
| Quality ≥ 24/25 | 24/25 (96%) | ✅ 24/25 | **Met** |
| Q×F ≥ 14.0 (if both fixes land and 14 files commit) | 14/25 × 14 files = 14.0 | 12.48 (13 files, 1 partial) | **Not met** — new COV-004 blocks summary-manager.js partial |
| Push/PR auto-success | YES | ✅ AUTO (#86), 17th consecutive | **Met** |

The Q×F ≥ 14.0 target required both fixes landing *and* no new regressions and 14 committed files. The fixes landed. The new COV-004 false positive on summary-manager.js prevented 14 files and 25/25 quality simultaneously, breaking both conditions.

---

## Records and Notable Milestones (Updated)

| Record | Value | Run |
|--------|-------|-----|
| Highest quality | 25/25 (100%) | Runs 9, 11, 13 |
| Highest Q×F | 13.4 | Run-15 |
| Most files committed | 14 | Run-15, Run-24 (tied) |
| Most spans (committed) | 48 | Run-24 |
| Lowest cost | $3.22 | Run-7 |
| Highest cost | $12.29 | Run-16 |
| First push/PR | Run-11 | #60 |
| First IS score | Run-15 | 70/100 |
| **Highest IS** | **100/100** | **Run-25 (new record)** |
| Longest consecutive push streak | 17 (runs 11–25, excl. 22) | Run-25 extends |
| First fully automatic push+PR | Run-19 | #71 |
| Consecutive auto-push | 6 (runs 19–21, 23–25) | Run-25 extends |

---

## Failure Classification (Active Issues Into Run-26)

| Failure | First Seen | Runs Open | Root Cause | Fix Available |
|---------|-----------|-----------|------------|---------------|
| COV-004: summary-manager.js `readWeekDailySummaries` + `readMonthWeeklySummaries` (validator false positive) | **Run-25** | 1 | `cov003.ts` `isExpectedConditionCatch` treats `if (err.code !== 'ENOENT') throw err` as requiring error recording; semantically a graceful-degradation catch; outer catch already handles COV-003 | Validator fix: recognize conditional-rethrow ENOENT pattern as acceptable graceful-degradation; see `failure-deep-dives.md` for proposed fix |
| IS SPA-001: INTERNAL span count structural | Run-15 | 11 | Structure resolved by per-target threshold (PR #142); full organic run (with summaries) produces 45–48 INTERNAL spans — within the 55-span threshold. Run-25 IS trace was minimal (31 spans). | Structural: no action needed; threshold is calibrated |
| SCH-003 auto-coercion untested | Run-23 | 2 | `fixAttributeTypeCoercions()` added in spiny-orb commit 91e9413 but never exercised against a live run | Agent avoidance (omitting `diff_lines`) means the fix remains unverified against a real type mismatch; issue #928 open |

**Resolved from Run-24 into Run-25:**

| Failure | File(s) | Status |
|---------|---------|--------|
| CDQ-001: index.js `process.exit()` bypasses `finally { span.end() }` (RUN24-1) | index.js | **RESOLVED** — `fixProcessExitSpanEnd()` AST restructure (spiny-orb commit 91e9413) confirmed effective |
| SCH-003: git-collector.js `diff_lines` declared `type: string`, set as integer (RUN24-2) | git-collector.js | **DE-FACTO RESOLVED** — attribute omitted by run-25 agent; `fixAttributeTypeCoercions()` backstop not exercised |
| IS SPA-001: INTERNAL span count vs calibration limit 10 | IS scoring | **RESOLVED** — PR #142 raised threshold to 55 for commit-story-v2; first IS 100/100 |
| IS SPA-002: orphan span | IS scoring | **RESOLVED** — no orphan spans in run-25 instrumentation |
