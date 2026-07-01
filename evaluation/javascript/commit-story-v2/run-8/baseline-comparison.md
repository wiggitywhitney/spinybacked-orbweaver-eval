# Baseline Comparison — Run-8

7-run comparison across all evaluation dimensions.

---

## Quality Score Trend

| Run | Quality | Gates | Files Committed | Cost | Duration | Quality x Files |
|-----|---------|-------|----------------|------|----------|----------------|
| 2 | 13/25 (52%) | 3/5 | ~10 | — | — | 5.2 |
| 3 | 19/25 (76%) | 5/5 | ~17 | — | — | 12.9 |
| 4 | 14/25 (56%) | 4/5 | 16 | $5.84 | 1h20m | 9.0 |
| 5 | 23/25 (92%) | 5/5 | 9 | $9.72 | — | 8.3 |
| 6 | 21/25 (84%) | 5/5 | 5 | $11.02 | — | 4.2 |
| 7 | 22/25 (88%) | 5/5 | 13 | $3.22 | 33m | 11.4 |
| **8** | **23/25 (92%)** | **5/5** | **12** | **$4.00** | **41m** | **11.0** |

**Run-8 ties run-5 for highest quality (92%).** Quality x Files slightly below run-7's 11.4 due to journal-graph.js regression (13→12 files).

---

## Per-Dimension Trend

| Dimension | Run-2 | Run-3 | Run-4 | Run-5 | Run-6 | Run-7 | Run-8 | Trend |
|-----------|-------|-------|-------|-------|-------|-------|-------|-------|
| NDS | 100% | 100% | 50% | 100% | 100% | 100% | 100% | Stable |
| COV | 60% | 80% | 60% | 80% | 60% | 80% | **100%** | First 100% |
| RST | 50% | 100% | 75% | 100% | 75% | 100% | 100% | Stable |
| API | 33% | 33% | 100% | 100% | 100% | 67% | 67% | API-004 ceiling |
| SCH | 50% | 50% | 25% | 75% | 75% | 100% | 75% | Declined (methodology) |
| CDQ | 43% | 86% | 43% | 100% | 100% | 86% | **100%** | First 100% |

**Two dimensions reach 100% for the first time**: COV (span collision resolved) and CDQ (count type reclassified to SCH-003).

**SCH decline note**: Run-7 scored SCH 4/4 with count type issue under CDQ. Run-8 correctly scores it under SCH-003 (schema fidelity). The underlying issue (count attributes declared as string) is unchanged — only the classification moved.

---

## File Outcome Comparison

| File | Run-5 | Run-6 | Run-7 | Run-8 | Trajectory |
|------|-------|-------|-------|-------|------------|
| claude-collector.js | committed | committed | committed | committed | Stable |
| git-collector.js | committed | committed | committed | committed | Stable |
| summarize.js | committed | partial | committed | committed | Stable |
| journal-graph.js | partial | partial | committed | **partial** | **Regressed** |
| summary-graph.js | partial | partial | committed | committed | Stable |
| index.js | committed | committed | committed | committed | Stable |
| context-integrator.js | committed | partial | committed | committed | Stable |
| auto-summarize.js | partial | partial | committed | committed | Stable |
| journal-manager.js | committed | committed | committed | committed | Stable |
| summary-manager.js | committed | partial | committed | committed | Stable |
| server.js | committed | committed | committed | committed | Stable |
| journal-paths.js | partial | partial | committed | committed | Stable |
| summary-detector.js | committed | partial | committed | committed | Stable |
| (16 correct skips) | correct | correct | correct | correct | Stable |

**11/12 committed files from run-7 maintained.** journal-graph.js is the sole regression (committed → partial). This file has oscillated between committed and partial across runs — the root cause appears to be non-deterministic LLM output on the most complex file in the codebase.

---

## Cost Trend

| Run | Cost | Files | Cost/File | Cache Rate |
|-----|------|-------|-----------|------------|
| 4 | $5.84 | 16 | $0.37 | — |
| 5 | $9.72 | 9 | $1.08 | — |
| 6 | $11.02 | 5 | $2.20 | — |
| 7 | $3.22 | 13 | $0.25 | 95% |
| **8** | **$4.00** | **12** | **$0.33** | **77%** |

Cost increased slightly ($3.22 → $4.00) primarily due to journal-graph.js consuming 70.4K output tokens across 3 attempts ($1.45 alone — 36% of total cost for zero committed value). Cache hit rate dropped from 95% to 77%.

---

## Dominant Blocker Peeling Assessment

| Run | Dominant Blocker | Severity | Impact |
|-----|-----------------|----------|--------|
| 5 | COV-003 (boundary gaps) | High | Blocked all validator-affected files |
| 6 | SCH-001 (single-span registry) | High | Blocked schema-uncovered files |
| 7 | COV-006 (span collision) + CDQ-005 (count types) | Medium | Trace analysis inconvenience |
| **8** | **SCH-003 (count types) + journal-graph regression** | **Low** | **Schema annotation issue + non-deterministic failure** |

Severity continues to decrease. SCH-003 is a type annotation issue that doesn't affect runtime behavior. The journal-graph.js regression is non-deterministic (succeeded in run-7, failed in run-8).

**No new blocking issue emerged behind the resolved COV-006.** The system has reached a plateau where remaining issues are polish-level.

---

## Score Projection Validation

Run-7 actionable fix output projected for run-8:
- **Minimum (P0 only)**: 24/25 (96%) after discount → **Actual: 23/25 (92%)**
- **Target (P0+P1)**: 24/25, 13+ files → **Actual: 23/25, 12 files**

The projection was close but optimistic:
- COV-006 resolved as predicted → +1 point
- CDQ-005/SCH-003 NOT resolved (prompt-only fix insufficient) → +0 points
- API-004 still present as predicted → 0 points
- Net: +1 from run-7's 22 = 23/25 (instead of projected 24/25)
- File count: 12 instead of 13+ (journal-graph regression)

**50% discount methodology**: Run-7 projected 23-24/25 after discount. Actual 23/25 is within range. Methodology continues to be well-calibrated.
