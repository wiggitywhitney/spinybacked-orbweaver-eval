# Baseline Comparison — Run-9

Run-9 vs runs 2-8. First run targeting commit-story-v2 proper (identical codebase to eval repo).

---

## Per-Dimension Trend (8 Runs)

| Dimension | Run-2 | Run-3 | Run-4 | Run-5 | Run-6 | Run-7 | Run-8 | Run-9 | Trend |
|-----------|-------|-------|-------|-------|-------|-------|-------|-------|-------|
| NDS | 100% | 100% | 50% | 100% | 100% | 100% | 100% | **100%** | Stable |
| COV | 60% | 80% | 60% | 80% | 60% | 80% | 100% | **100%** | Stable at 100% |
| RST | 50% | 100% | 75% | 100% | 75% | 100% | 100% | **100%** | Stable at 100% |
| API | 33% | 33% | 100% | 100% | 100% | 67% | 67% | **100%** | Fixed (target repo) |
| SCH | 50% | 50% | 25% | 75% | 75% | 100% | 75% | **100%** | Fixed (count types) |
| CDQ | 43% | 86% | 43% | 100% | 100% | 86% | 100% | **100%** | Stable at 100% |

**All 6 dimensions at 100% for the first time.** API-004 resolved by targeting commit-story-v2 proper (sdk-node in devDeps). SCH-003 resolved by dual-layer count type fix.

---

## Overall Quality Trend

| Metric | Run-2 | Run-3 | Run-4 | Run-5 | Run-6 | Run-7 | Run-8 | Run-9 |
|--------|-------|-------|-------|-------|-------|-------|-------|-------|
| Quality | 42% | 73% | 58-73% | 92% | 84% | 88% | 92% | **100%** |
| Score | 11/26 | 19/26 | 15-19/26 | 23/25 | 21/25 | 22/25 | 23/25 | **25/25** |
| Gates | 3/4 | 4/4 | 4/5 | 5/5 | 5/5 | 5/5 | 5/5 | **5/5** |
| Files | — | 17/21 | 16/29 | 9/29 | 5/29 | 13/29 | 12/29 | **12/29** |
| Failures | 15 | 7 | 11-7 | 2 | 4 | 3 | 2 | **0** |

---

## File Outcome Comparison

| File | Run-5 | Run-6 | Run-7 | Run-8 | Run-9 | Trajectory |
|------|-------|-------|-------|-------|-------|------------|
| claude-collector.js | C | C | C | C | C | Stable (5 runs) |
| git-collector.js | C | C | C | C | C | Stable (5 runs) |
| summarize.js | C | P | C | C | C | Stable (3 runs) |
| journal-graph.js | P | P | C | **P** | **P** | Oscillating |
| summary-graph.js | P | P | C | C | C | Stable (3 runs) |
| index.js | C | C | C | C | C | Stable (5 runs) |
| context-integrator.js | C | P | C | C | C | Stable (3 runs) |
| auto-summarize.js | P | P | C | C | C | Stable (3 runs) |
| journal-manager.js | C | C | C | C | C | Stable (5 runs) |
| summary-manager.js | C | P | C | C | C | Stable (3 runs) |
| server.js | C | C | C | C | C | Stable (5 runs) |
| journal-paths.js | P | P | C | C | C | Stable (3 runs) |
| summary-detector.js | C | P | C | C | C | Stable (3 runs) |
| 16 correct skips | S | S | S | S | S | Stable |

C = committed, P = partial, S = correctly skipped

**12/12 committed files from run-8 maintained.** journal-graph.js remains the sole oscillator (now with identified root cause: reassembly validator rejects extension span names).

---

## Quality x Files Product Trend

| Run | Quality | Files | Q×F |
|-----|---------|-------|-----|
| 5 | 92% | 9 | 8.3 |
| 6 | 84% | 5 | 4.2 |
| 7 | 88% | 13 | 11.4 |
| 8 | 92% | 12 | 11.0 |
| **9** | **100%** | **12** | **12.0** |

**New high for Q×F** (12.0) driven by quality reaching 100%. File count stable at 12. Path to higher Q×F is fixing journal-graph.js (→ 13.0) and push auth (→ PR delivery).

---

## Cost Trend

| Run | Cost | Files | Cost/File | Duration |
|-----|------|-------|-----------|----------|
| 4 | $5.84 | 16 | $0.37 | 1h20m |
| 5 | $9.72 | 9 | $1.08 | — |
| 6 | $11.02 | 5 | $2.20 | — |
| 7 | $3.22 | 13 | $0.25 | 33m |
| 8 | $4.00 | 12 | $0.33 | 41m |
| **9** | **$3.97** | **12** | **$0.33** | **43.7m** |

Cost stable at ~$4.00. journal-graph.js consumed $1.67 (42% of total) for zero committed value — consistent with run-8's 36%. The cost guard (PR #271) limited attempts from 3 to 2 but token consumption per attempt was higher (91.4K vs 70.4K).

---

## Dominant Blocker Peeling Assessment

| Run | Dominant Blocker | Severity | Quality Impact |
|-----|-----------------|----------|----------------|
| 5 | COV-003 (boundary gaps) | High | Blocked validator-affected files |
| 6 | SCH-001 (single-span registry) | High | Blocked schema-uncovered files |
| 7 | COV-006 (span collision) + CDQ-005 (count types) | Medium | Trace analysis inconvenience |
| 8 | SCH-003 (count types) + journal-graph regression | Low | Schema annotation + non-deterministic |
| **9** | **Push auth (7th) + reassembly validator bug** | **None (quality)** | **Zero quality impact on committed files** |

**Quality blockers are exhausted.** The remaining issues (push auth, reassembly validator) are infrastructure/tooling problems that affect delivery and file coverage but not the quality of committed instrumentation.

The dominant blocker peeling pattern has reached its theoretical endpoint: there are no more quality rules to fail. The system has peeled through High → Medium → Low → None over 5 consecutive runs.

---

## Score Projection Validation

Run-8 projected for run-9 (from actionable-fix-output.md §7):

| Scenario | Projected | Actual | Accurate? |
|----------|-----------|--------|-----------|
| Minimum (P0 only) | 23-24/25, 12+ files | 25/25, 12 files | **Exceeded** — API-004 also passed |
| Target (P0+P1) | 23-24/25, 12-13 files | 25/25, 12 files | Quality exceeded, files at low end |
| Stretch | 24-25/25, 13 files | 25/25, 12 files | Quality met, files -1 (journal-graph) |

The 50% discount methodology was **conservative** this run — actual quality exceeded all projections. The discount correctly predicted journal-graph.js would oscillate (-1 file), but didn't anticipate API-004 would pass (different target repo).

**Calibration note**: The 50% discount has been well-calibrated for 4 consecutive runs, always within range for quality scores. File count predictions are less reliable due to journal-graph.js non-determinism.

---

## Summary

Run-9 achieved the theoretical ceiling for instrumentation quality on this codebase. The remaining work is purely operational:

1. **Push auth**: Fix the token propagation to spiny-orb's pushBranch() — 7 consecutive failures
2. **Reassembly validator**: Make SCH-001 check resolve against base + extensions — fixes journal-graph.js
3. **Advisory contradictions**: 67% rate still too high — COV-004 on sync files, SCH-004 bad semantic matches

If all three are fixed, run-10 projection: 25/25, 13 files, with PR created.
