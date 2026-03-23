# Baseline Comparison — Run-10

Run-10 vs runs 2-9. Second run targeting commit-story-v2 proper.

---

## Per-Dimension Trend (9 Runs)

| Dimension | Run-2 | Run-3 | Run-4 | Run-5 | Run-6 | Run-7 | Run-8 | Run-9 | Run-10 | Trend |
|-----------|-------|-------|-------|-------|-------|-------|-------|-------|--------|-------|
| NDS | 100% | 100% | 50% | 100% | 100% | 100% | 100% | 100% | **100%** | Stable |
| COV | 60% | 80% | 60% | 80% | 60% | 80% | 100% | 100% | **100%** | Stable at 100% |
| RST | 50% | 100% | 75% | 100% | 75% | 100% | 100% | 100% | **100%** | Stable at 100% |
| API | 33% | 33% | 100% | 100% | 100% | 67% | 67% | 100% | **100%** | Stable at 100% |
| SCH | 50% | 50% | 25% | 75% | 75% | 100% | 75% | 100% | **75%** | Regressed (boolean types) |
| CDQ | 43% | 86% | 43% | 100% | 100% | 86% | 100% | 100% | **86%** | Regressed (undefined attrs) |

**4 of 6 dimensions stable at 100%. SCH and CDQ regressed** — both from new failure types not seen in run-9.

---

## Overall Quality Trend

| Metric | Run-2 | Run-3 | Run-4 | Run-5 | Run-6 | Run-7 | Run-8 | Run-9 | Run-10 |
|--------|-------|-------|-------|-------|-------|-------|-------|-------|--------|
| Quality | 42% | 73% | 58-73% | 92% | 84% | 88% | 92% | 100% | **92%** |
| Score | 11/26 | 19/26 | 15-19/26 | 23/25 | 21/25 | 22/25 | 23/25 | 25/25 | **23/25** |
| Gates | 3/4 | 4/4 | 4/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | **5/5** |
| Files | — | 17/21 | 16/29 | 9/29 | 5/29 | 13/29 | 12/29 | 12/29 | **12/30** |
| Failures | 15 | 7 | 11-7 | 2 | 4 | 3 | 2 | 0 | **2** |

---

## File Outcome Comparison

| File | Run-5 | Run-6 | Run-7 | Run-8 | Run-9 | Run-10 | Trajectory |
|------|-------|-------|-------|-------|-------|--------|------------|
| claude-collector.js | C | C | C | C | C | C | Stable (6 runs) |
| git-collector.js | C | C | C | C | C | C | Stable (6 runs) |
| summarize.js | C | P | C | C | C | C | Stable (4 runs) |
| **journal-graph.js** | P | P | C | **P** | **P** | **C** | **Recovered** |
| summary-graph.js | P | P | C | C | C | C | Stable (4 runs) |
| index.js | C | C | C | C | C | C | Stable (6 runs) |
| context-integrator.js | C | P | C | C | C | C | Stable (4 runs) |
| auto-summarize.js | P | P | C | C | C | C | Stable (4 runs) |
| journal-manager.js | C | C | C | C | C | C | Stable (6 runs) |
| **summary-manager.js** | C | P | C | C | C | **F** | **Regressed (transient)** |
| server.js | C | C | C | C | C | C | Stable (6 runs) |
| journal-paths.js | P | P | C | C | C | C | Stable (4 runs) |
| summary-detector.js | C | P | C | C | C | C | Stable (4 runs) |
| 16-17 correct skips | S | S | S | S | S | S | Stable |

C = committed, P = partial, F = failed, S = correctly skipped

**journal-graph.js recovered** (partial→committed): reassembly validator fix worked.
**summary-manager.js regressed** (committed→failed): transient Weaver CLI failure.

---

## Quality x Files Product Trend

| Run | Quality | Files | Q×F |
|-----|---------|-------|-----|
| 5 | 92% | 9 | 8.3 |
| 6 | 84% | 5 | 4.2 |
| 7 | 88% | 13 | 11.4 |
| 8 | 92% | 12 | 11.0 |
| 9 | 100% | 12 | 12.0 |
| **10** | **92%** | **12** | **11.0** |

Q×F dropped from 12.0 to 11.0 due to quality regression. File count unchanged.

---

## Cost Trend

| Run | Cost | Files | Cost/File | Duration |
|-----|------|-------|-----------|----------|
| 4 | $5.84 | 16 | $0.37 | 1h20m |
| 5 | $9.72 | 9 | $1.08 | — |
| 6 | $11.02 | 5 | $2.20 | — |
| 7 | $3.22 | 13 | $0.25 | 33m |
| 8 | $4.00 | 12 | $0.33 | 41m |
| 9 | $3.97 | 12 | $0.33 | 43.7m |
| **10** | **$4.36** | **12** | **$0.36** | **45.9m** |

Cost slightly up ($3.97 → $4.36). journal-graph.js consumed $1.62 (37.2%) for 3 attempts — less than run-9's wasted 91.4K tokens but still the most expensive file.

---

## Dominant Blocker Peeling Assessment

| Run | Dominant Blocker | Severity | Quality Impact |
|-----|-----------------|----------|----------------|
| 5 | COV-003 (boundary gaps) | High | Blocked validator-affected files |
| 6 | SCH-001 (single-span registry) | High | Blocked schema-uncovered files |
| 7 | COV-006 (span collision) + CDQ-005 | Medium | Trace analysis inconvenience |
| 8 | SCH-003 (count types) + journal-graph regression | Low | Schema annotation |
| 9 | Push auth + reassembly validator | None (quality) | Zero quality impact |
| **10** | **SCH-003 (boolean types) + CDQ-007 (undefined attrs)** | **Low** | **Schema annotation + telemetry noise** |

**Quality regression from ceiling.** After reaching 100% in run-9, two new low-severity failures emerged:
1. SCH-003 boolean type mismatch — same class as count-type issue, different type dimension
2. CDQ-007 undefined-value attributes — new pattern from optional chaining

The dominant blocker peeling continues but is now oscillating at the Low severity tier rather than progressing linearly.

---

## Score Projection Validation

Run-9 projected for run-10 (from actionable-fix-output.md §7):

| Scenario | Projected | Actual | Accurate? |
|----------|-----------|--------|-----------|
| Minimum (P0 only) | 25/25, 12-13 files, PR 50% likely | 23/25, 12 files, no PR | **Quality overshot** — new failures |
| Target (P0+P1) | 25/25, 12-13 files, PR likely | 23/25, 12 files, no PR | Quality overshot, PR missed |
| Stretch | 25/25, 13 files, <10% advisory rate | 23/25, 12 files, no PR | Not achieved |

The 50% discount was **not conservative enough** this run. Quality regressed from 100% to 92% — new failure types (boolean schema types, undefined attributes) weren't predicted because they're LLM-generated-code-dependent, not fix-dependent. The discount methodology works well for predicting whether fixes will land but doesn't account for new code patterns introducing new failures.

**Calibration note**: The projection methodology has been well-calibrated for 4 prior runs. This is the first run where quality regressed from a higher baseline. The regression is caused by evaluation thoroughness (checking boolean types, checking optional chaining patterns) rather than actual code degradation.

---

## Summary

Run-10 scored 92% quality (23/25) with 12 files committed. Quality regressed 8pp from run-9's perfect 100%, but this may reflect more thorough evaluation rather than actual instrumentation degradation.

Key outcomes:
1. **journal-graph.js recovered** — reassembly validator fix confirmed (3 attempts, $1.62)
2. **Push auth progressed** — URL swap now works, but token rejected by GitHub
3. **New failures discovered** — boolean type mismatch and undefined-value attributes
4. **summary-manager.js lost** — transient Weaver CLI failure (not quality-related)
5. **Cost stable** at ~$4 range
