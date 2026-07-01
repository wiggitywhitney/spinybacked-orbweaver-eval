# Rubric Scores — Run-7

**Canonical score**: 22/25 (88%), 5/5 gates, **13 files committed**

## Dimension Scores

| Dimension | Score | Run-6 | Delta | Failures |
|-----------|-------|-------|-------|----------|
| NDS | 2/2 (100%) | 2/2 (100%) | — | — |
| COV | 4/5 (80%) | 3/5 (60%) | **+20pp** | COV-006 (span name collision) |
| RST | 4/4 (100%) | 3/4 (75%) | **+25pp** | — |
| API | 2/3 (67%) | 3/3 (100%) | **-33pp** | API-004 (pre-existing sdk-node in peerDeps) |
| SCH | 4/4 (100%) | 3/4 (75%) | **+25pp** | — |
| CDQ | 6/7 (86%) | 7/7 (100%) | **-14pp** | CDQ-005 (count type mismatch) |
| **Total** | **22/25 (88%)** | **21/25 (84%)** | **+4pp** | 3 failures |
| **Gates** | **5/5** | **5/5** | — | — |
| **Files** | **13** | **5** | **+160%** | — |

## Quality x Files Product

| Run | Quality | Files | Product |
|-----|---------|-------|---------|
| Run-3 | 73% | 17 | 12.4 |
| Run-4 | 69% | 16 | 11.0 |
| Run-5 | 92% | 9 | 8.3 |
| Run-6 | 84% | 5 | 4.2 |
| **Run-7** | **88%** | **13** | **11.4** |

**The declining trend has reversed.** Quality x files product jumped from 4.2 to 11.4 — approaching run-3 levels but with much higher quality per file.

## Failure Classification

| Rule | Classification | Detail |
|------|---------------|--------|
| API-004 | Pre-existing | `@opentelemetry/sdk-node` in peerDependencies on main. Not introduced by instrumentation. |
| COV-006 | Unmasked | Span name collision revealed by SCH-001 fix. Previously masked because partial files couldn't commit. |
| CDQ-005 | Unmasked | Count type mismatch revealed by SCH-001 fix. Previously masked because agent-declared extensions couldn't pass validation. |

**Both newly revealed failures (COV-006 and CDQ-005) are "unmasked" — revealed by fixing SCH-001.** This confirms the dominant blocker peeling pattern for the 3rd consecutive run: Run-5 COV-003 → Run-6 SCH-001 → Run-7 COV-006/CDQ-005. Each layer is less severe than the last.

## Solved Dimensions (4+ consecutive runs at 100%)

- **NDS**: 100% for runs 5-7 (3 consecutive)
- **RST**: 100% for runs 5, 7 (run-6 had RST-004 cascade from SCH-001)
- **Gates**: 5/5 for runs 5-7 (3 consecutive)

## Schema Coverage Split

With sparse-registry advisory mode, all 13 committed files are effectively "schema-uncovered" (0 pre-defined span definitions). The agent declared all span names as extensions. Despite this, SCH-001 through SCH-004 all pass because:
1. Agent-invented names follow namespace convention
2. Extensions are properly declared and registered
3. Weaver validates and commits the extensions

The schema coverage split methodology needs updating for run-8 — the concept of "schema-covered" vs "schema-uncovered" becomes less meaningful when the agent is expected to declare its own extensions.

## Instance Counts (per-file pass rates)

| Rule | Files Passing | Files Failing | Pass Rate |
|------|--------------|---------------|-----------|
| NDS-004 | 13/13 | 0 | 100% |
| NDS-005 | 13/13 | 0 | 100% |
| COV-001 | 2/2 entry points | 0 | 100% |
| COV-005 | 13/13 | 0 | 100% |
| COV-006 | 12/13 | 1 (summary-graph.js) | 92% |
| RST-001 | 13/13 | 0 | 100% |
| RST-004 | 13/13 | 0 | 100% |
| CDQ-005 | 11/13 | 2 (summary-detector, auto-summarize) | 85% |
| CDQ-008 | 13/13 | 0 | 100% |
