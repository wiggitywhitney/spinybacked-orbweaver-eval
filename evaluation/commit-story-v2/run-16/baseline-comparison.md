# Baseline Comparison — Run-16 vs Runs 2-15

---

## Cross-Run Quality Trend

| Run | Quality | Gates | Files | Spans | Cost | Push/PR | IS | Q×F |
|-----|---------|-------|-------|-------|------|---------|-----|-----|
| 2 | 20/27 (74%) | 3/4 | 10 | — | — | NO | — | 7.4 |
| 3 | 19/26 (73%) | 4/4 | 11 | — | — | NO | — | 8.0 |
| 4 | 15/26 (58%) | 4/4 | 16 | — | $5.84 | NO | — | 9.2 |
| 5 | 23/25 (92%) | 5/5 | 9 | 17 | $9.72 | NO | — | 8.3 |
| 6 | 21/25 (84%) | 5/5 | 5 | 16 | $11.02 | NO | — | 4.2 |
| 7 | 22/25 (88%) | 5/5 | 13 | 28 | $3.22 | NO | — | 11.4 |
| 8 | 23/25 (92%) | 5/5 | 12 | 28 | $4.00 | NO | — | 11.0 |
| 9 | 25/25 (100%) | 5/5 | 12 | 26 | $3.97 | NO | — | 12.0 |
| 10 | 23/25 (92%) | 5/5 | 12 | 28 | $4.36 | NO | — | 11.0 |
| 11 | 25/25 (100%) | 5/5 | 13 | 39 | $4.25 | YES (#60) | — | **13.0** |
| 12 | 23/25 (92%) | 5/5 | 12+1p | 31 | $5.19 | YES (#61) | — | 11.0 |
| 13 | 25/25 (100%) | 5/5 | 7 | 22 | ~$6.41 | YES (#62) | — | 7.0 |
| 14 | 22/25 (88%) | 5/5 | 12 | 32 | $5.59 | YES (#65) | 80 | 10.6 |
| 15 | 24/25 (96%) | 5/5 | 14 | 40 | $6.44 | YES (#66) | 70 | **13.4** |
| **16** | **22/25 (88%)** | **5/5** | **10+3p** | **~38** | **$12.29** | **YES (#68)** | **80** | **8.8** |

Run-16 Q×F (8.8) is a significant regression from run-15's all-time record of 13.4. Cost ($12.29) is the highest in the series, exceeding even the early runs.

---

## Dimension Trends (Runs 12-16)

| Dimension | Run-12 | Run-13 | Run-14 | Run-15 | Run-16 |
|-----------|--------|--------|--------|--------|--------|
| NDS | 2/2 | 2/2 | 2/2 | 2/2 | **1/2** |
| COV | 4/5 | 5/5 | 3/5 | 4/5 | **3/5** |
| RST | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 |
| API | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| SCH | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 |
| CDQ | 6/7 | 7/7 | 6/7 | 7/7 | 7/7 |

**First NDS failure in the series.** NDS has been 2/2 (100%) across all measured runs (2-15). Run-16 introduces the first NDS failure: a function-level fallback bug stripped a try/catch block from commit-analyzer.js (NDS-005). RST, API, SCH, CDQ remain stable.

---

## Key Changes in Run-16

### 1. Quality: 24/25 → 22/25 (-8pp)

One run-15 failure resolved; three new failures introduced:

| Run-15 Failure | Resolution | Mechanism |
|----------------|------------|-----------|
| COV-003 FAIL: summary-detector.js (getDaysWithEntries, getDaysWithDailySummaries — no outer catch) | **✅ RESOLVED** | Outer catch guidance fix (commit e2582c3, PR #749 in spiny-orb) added NDS-007 distinction: inner graceful-degradation catches don't exempt the outer span wrapper from needing an error-recording catch for unexpected exceptions |

New failures:

| Failure | Rule | Description |
|---------|------|-------------|
| NDS-005: commit-analyzer.js | NDS | Function-level fallback ran on a 0-span file and stripped a try/catch block during reassembly — structural defect in committed code |
| COV-001: journal-graph.js (technicalNode) | COV | NDS-003 oscillation (error count 1→5 on fresh regen) prevented span placement; third consecutive run without a span on this function |
| COV-001: summary-manager.js (2 functions) | COV | Token budget exhaustion (null parsed_output): generateAndSaveWeeklySummary and generateAndSaveMonthlySummary exhausted the per-function minimum budget on adaptive thinking |
| COV-004: journal-graph.js + summary-manager.js | COV | Same functions as COV-001 |

### 2. File Count Regression: 14 → 10 committed (-4 files)

Largest single-run file count drop in the series. Three full failures (context-capture-tool.js, reflection-tool.js, index.js) and three partials (journal-graph.js, commit-analyzer.js, summary-manager.js) vs run-15's 14 committed and 0 full failures. The null parsed_output failure mode accounts for 3 full-file failures and 2 within-file function skips.

### 3. Cost Surge: $6.44 → $12.29 (+$5.85)

All-time high by a large margin — 91% more than run-15. The surge has three components:

| Driver | Cost | Notes |
|--------|------|-------|
| Cache write overhead | $2.64 | New cost component — 705K cache write tokens |
| journal-graph.js (3 attempts) | $2.30 | Reverted from run-15's 1-attempt anomaly |
| summary-manager.js (2 attempts, 105.7K output) | $2.28 | Large file, high output token count |
| summary-graph.js (2 attempts) | $1.69 | |
| summarize.js (3 attempts) | $1.64 | |
| Wasted (failed files, all thinking) | $0.82 | context-capture-tool.js $0.45 + reflection-tool.js $0.37 |

The cache write cost is newly prominent — run-16 wrote 705K cache tokens vs run-15's likely lower volume. The 3-attempt reversion on journal-graph.js adds ~$1.70 vs the 1-attempt baseline.

### 4. Push/PR — Sixth Consecutive Success

PR #68 auto-created. Fine-grained PAT stable. Six consecutive pushes is a record for this eval chain. Push detection bug (RUN15-3) did not affect run-16 — the PROGRESS.md hook interaction caused the extended wall-clock time, but the push completed cleanly.

### 5. IS Score Improvement: 70 → 80 (+10pp)

| Rule | Run-15 | Run-16 | Change |
|------|--------|--------|--------|
| RES-001 (service.instance.id) | FAIL | FAIL | Unchanged |
| SPA-001 (≤10 INTERNAL spans) | FAIL (37 spans) | FAIL (12 spans) | **Improved** — 12 spans vs limit 10; fewer spans because 4 fewer committed files. Still fails the limit, but closer to the threshold. |
| SPA-002 (no orphan spans) | FAIL | **PASS** | **Resolved** — orphan span from run-15 was auto-instrumentation variation; did not recur |

### 6. journal-graph.js: 1-Attempt Result Did Not Hold

Run-15 completed journal-graph.js in 1 attempt at $0.56 (vs 3 attempts in runs 12-14). Run-16 reverted to 3 attempts at $2.30. Root cause of run-15's single-attempt result remains unknown; the baseline behavior is 3 attempts. technicalNode continues to be skipped (NDS-003 oscillation — third consecutive run).

---

## Score Projection Validation

Run-15 actionable fix output projected for run-16:

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| Conservative (RUN15-1 fix lands, no other changes) | 25/25, 14 files, ~$6.00–6.50 | 22/25, 10 files, $12.29 | **Not met** — quality lower, files fewer, cost nearly double |
| Target (RUN15-1 fix + journal-manager.js cost improvement) | 25/25, 14–15 files, ~$5.00–5.50 | 22/25, 10 files, $12.29 | **Not met** |
| Stretch (all fixes + cost breakthrough) | 25/25, 14–15 files, ≤$5.00 | 22/25, 10 files, $12.29 | **Not met** |

The projections missed on all three metrics. The primary goal (COV-003 fix) was achieved, but the null parsed_output failure mode introduced 3 full-file failures and 2 function-level skips that were not anticipated. The cache write cost component and journal-graph.js 3-attempt reversion drove cost far above projections.

---

## Failure Classification Across Runs 11-16

| Failure | First Seen | Fixed In | Runs Active | Status |
|---------|-----------|----------|-------------|--------|
| Push auth | Run-3 | Run-11 | 8 runs | **RESOLVED** — 6 consecutive successes |
| COV-003 summary-detector.js (outer catch missing) | Run-15 | **Run-16** | 1 run | **RESOLVED** — outer catch guidance fix worked |
| IS SPA-002 orphan span | Run-15 | **Run-16** | 1 run | **RESOLVED** — auto-instrumentation variation did not recur |
| journal-graph.js 3 attempts | Run-12 | Run-15 (temp) | 3 runs (+ regression) | **REGRESSED** — run-15's 1-attempt was anomalous; back to 3 attempts |
| COV-001/COV-004 journal-graph.js technicalNode (NDS-003 oscillation) | Run-16 | — | 1 run | **NEW** — NDS-003 oscillation on technicalNode; third consecutive skip |
| Null parsed_output (token budget exhaustion) | **Run-16** | — | 1 run | **NEW** — function-level fallback adaptive thinking exhausts budget on short files; 4 function calls affected (3 full-file failures) |
| NDS-005 function-level fallback bug | **Run-16** | — | 1 run | **NEW** — fallback modifies 0-span files, stripping try/catch; structural defect in committed code |
| IS SPA-001 INTERNAL span count | Run-14 | — | 3 runs | Open — structural calibration mismatch; 12 spans in run-16 (vs 37 in run-15) |
| IS RES-001 no service.instance.id | Run-14 | — | 3 runs | Open — SDK setup gap |
| Cost above target | Run-11 | — | 6 runs | Open — $12.29 in run-16 (all-time high, +91% vs run-15) |
| Advisory contradiction rate ~90%+ | Run-11 | — | 6 runs | Open — 92% in run-16; CDQ-007 null guards + SCH-001 semantic dedup |

---

## Oscillation Pattern

| Run | Score | Pattern |
|-----|-------|---------|
| Run-13 | 25/25 | Perfect; only 7 files (rollbacks) |
| Run-14 | 22/25 | COV-003 + CDQ-003 + COV-004 failures |
| Run-15 | 24/25 | COV-003/CDQ-003/COV-004 resolved; new COV-003 on summary-detector.js |
| **Run-16** | **22/25** | COV-003 resolved; new NDS-005 + COV-001 + COV-004 failures; new systemic failure mode (null parsed_output) |

The oscillation pattern continues, but run-16 introduces something new: a **systemic infrastructure failure mode** (null parsed_output from token budget exhaustion) rather than an agent reasoning failure. The NDS-005 failure is also a new type — a spiny-orb code bug rather than an agent decision. Both require spiny-orb-side fixes, not prompt changes.

The "dominant blocker peeling" pattern is now being amplified by two infrastructure issues that didn't exist in earlier runs. Until the token budget and function-level fallback bugs are fixed, quality will be structurally constrained regardless of agent prompt improvements.
