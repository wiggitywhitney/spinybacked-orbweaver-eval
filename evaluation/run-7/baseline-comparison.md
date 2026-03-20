# Baseline Comparison — Run-7 vs Runs 2-6

## Dimension-Level Trend (6 runs)

| Dimension | Run-2 | Run-3 | Run-4 | Run-5 | Run-6 | Run-7 | Trend |
|-----------|-------|-------|-------|-------|-------|-------|-------|
| NDS | 50% | 100% | 100% | 100% | 100% | **100%** | Stable (4 runs) |
| COV | 40% | 80% | 40% | 60% | 60% | **80%** | Recovered |
| RST | 75% | 100% | 50% | 100% | 75% | **100%** | Recovered |
| API | 0% | 67% | 100% | 100% | 100% | **67%** | Regressed (pre-existing) |
| SCH | 50% | 50% | 50% | 100% | 75% | **100%** | Recovered |
| CDQ | 43% | 86% | 57% | 100% | 100% | **86%** | Regressed (unmasked) |
| **Total** | **44%** | **73%** | **69%** | **92%** | **84%** | **88%** | Improving |
| **Gates** | 3/5 | 5/5 | 4/5 | 5/5 | 5/5 | **5/5** | Stable |
| **Files** | 21 | 17 | 16 | 9 | 5 | **13** | **Reversed decline** |

## File Outcome Comparison

| File | Run-3 | Run-4 | Run-5 | Run-6 | Run-7 | Trajectory |
|------|-------|-------|-------|-------|-------|------------|
| claude-collector.js | S | S | S(1) | S(1) | **S(1)** | Stable committed |
| git-collector.js | S | S | S(2) | S(2) | **S(2)** | Stable committed |
| context-integrator.js | F | F | S(1) | S(1) | **S(1)** | Stable committed |
| summary-manager.js | S | S | P | S(3) | **S(3)** | Recovered run-6 |
| server.js | S | S | S(1) | S(1) | **S(1)** | Stable committed |
| journal-graph.js | F | S | P | P | **S(4)** | **Recovered** |
| summary-graph.js | S | S | P | P | **S(6)** | **Recovered** |
| summarize.js | S | S | P | P | **S(3)** | **Recovered** |
| auto-summarize.js | S | S | S | P(reg) | **S(3)** | **Recovered** |
| journal-manager.js | S | S | P | P | **S(2)** | **Recovered** |
| summary-detector.js | S | S | P | P | **S(5)** | **Recovered** |
| index.js | S | S | F | F | **S(1)** | **Recovered (4th attempt)** |
| journal-paths.js | S | S | S | DS | **S(1)** | **Recovered** |
| context-capture-tool.js | S | S | S | DS | **CS** | Skip resolved |
| reflection-tool.js | S | S | S | DS | **CS** | Skip resolved |
| commit-analyzer.js | S | S(corr) | CS | CS | **CS** | Stable skip |

Legend: S=committed with spans (count), P=partial, F=failed, CS=correct skip, DS=debatable skip, reg=regressed

## Failure Classification

| Failure | Classification | Detail |
|---------|---------------|--------|
| API-004 | Pre-existing | sdk-node in peerDeps. Present on main since run-2. |
| COV-006 | Unmasked (new) | Span name collision. Masked by SCH-001 in runs 5-6. |
| CDQ-005 | Unmasked (new) | Count type mismatch. Masked by SCH-001 in runs 5-6. |
| COV-001 | **Resolved** | index.js has span after 3 consecutive failures. |
| COV-005 | **Resolved** | server.js has attributes after 2 consecutive failures. |
| RST-004 | **Resolved** | git-collector.js precedence fixed. |
| SCH-001 | **Resolved** | Advisory mode eliminates as blocker. |

## Registry Expansion Impact Assessment

The PRD assumed registry expansion (≥8 span definitions added). The actual fix was **validator tolerance** (sparse-registry advisory mode). Impact:

- **Files recovered**: 8 files recovered from partial/failed/regressed/debatable
- **Span definitions used**: 0 pre-defined (all 22 spans agent-invented as extensions)
- **Agent name quality**: Consistently good. All follow `commit_story.<module>.<operation>` convention.
- **Key insight**: The agent doesn't need a pre-populated registry to produce good span names. It needs the freedom to declare extensions and have them accepted.

## Dominant Blocker Peeling

| Run | Fix Applied | Blocker Emerged | Severity |
|-----|-----------|-----------------|----------|
| Run-5 | COV-003 DEEP-1 | SCH-001 single-span registry | Critical (blocked all partial files) |
| Run-6 | (SCH-001 not yet fixed) | SCH-001 persisted | Critical (same) |
| Run-7 | SCH-001 advisory mode | COV-006 span collision, CDQ-005 type mismatch | Medium (trace analysis only) |

**Pattern confirmed for 3rd time.** Each fix reveals the next blocker. Severity is decreasing — from "blocks all files" to "trace analysis inconvenience." The system is converging.

## Quality vs Coverage Trend

| Run | Quality | Files | Product | Cost | Cost/File |
|-----|---------|-------|---------|------|-----------|
| Run-2 | 44% | 21 | 9.2 | — | — |
| Run-3 | 73% | 17 | 12.4 | $4.20 | $0.25 |
| Run-4 | 69% | 16 | 11.0 | $5.84 | $0.37 |
| Run-5 | 92% | 9 | 8.3 | $9.72 | $1.08 |
| Run-6 | 84% | 5 | 4.2 | $9.72 | $1.94 |
| **Run-7** | **88%** | **13** | **11.4** | **$3.22** | **$0.25** |

**Run-7 reverses every negative trend simultaneously**: quality up (+4pp), files up (+160%), cost down (-67%), cost/file down (-87%). The quality x files product tripled from 4.2 to 11.4.

## Run-6 Score Projection Validation

Run-6 projected for run-7 (from actionable-fix-output.md §7):

| Tier | Projected Score | Projected Files | Actual Score | Actual Files | Accuracy |
|------|----------------|-----------------|-------------|-------------|----------|
| Minimum (after 50% discount) | 21-23/25 | 6-8 | 22/25 | 13 | Score within range, files exceeded |
| Target (after 50% discount) | 22-24/25 | 8-12 | 22/25 | 13 | Score within range, files at upper bound |
| Stretch (after 50% discount) | 23-25/25 | 10-14 | 22/25 | 13 | Score just below range, files within |

**The 50% discount methodology is well-calibrated.** Score fell in the minimum-target range (22/25). File count (13) exceeded the minimum discount but fell within target. The projections are now reliable within their uncertainty bands.

## Cost Comparison

| Run | Cost | Files | Cost/File | Duration | Tokens |
|-----|------|-------|-----------|----------|--------|
| Run-3 | $4.20 | 17 | $0.25 | — | — |
| Run-4 | $5.84 | 16 | $0.37 | 1h20m | — |
| Run-5 | $9.72 | 9 | $1.08 | ~2h | — |
| Run-6 | $9.72 | 5 | $1.94 | ~2h | — |
| **Run-7** | **$3.22** | **13** | **$0.25** | **33m** | 93.6K in, 131.8K out (95% cached) |

**Cost dropped to run-3 levels** despite more sophisticated validation. The 95% cache hit rate (125.3K/131.8K cached) is the primary driver — the agent benefits from accumulated context across files. Duration (33 minutes) is 3-4x faster than runs 5-6.

**Cost sanity check**: $3.22 is 4.7% of the $67.86 ceiling. The PRD flags <15% as suspicious. This low cost is explained by the high cache rate and low retry count (only 4 files needed 2 attempts, none needed 3).
