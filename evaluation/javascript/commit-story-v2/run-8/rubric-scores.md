# Rubric Scores — Run-8

Canonical scoring from per-file evaluation.

---

## Score Summary

| Dimension | Run-8 | Run-7 | Delta | Failures |
|-----------|-------|-------|-------|----------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 2/2 (100%) | — | — |
| Coverage (COV) | 5/5 (100%) | 4/5 (80%) | **+20pp** | — |
| Restraint (RST) | 4/4 (100%) | 4/4 (100%) | — | — |
| API-Only Dependency (API) | 2/3 (67%) | 2/3 (67%) | — | API-004 (pre-existing) |
| Schema Fidelity (SCH) | 3/4 (75%) | 4/4 (100%) | **-25pp** | SCH-003 (count types) |
| Code Quality (CDQ) | 7/7 (100%) | 6/7 (86%) | **+14pp** | — |
| **Overall quality** | **23/25 (92%)** | **22/25 (88%)** | **+4pp** | 2 failures |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | — | — |
| **Files committed** | **12/29** | **13/29** | **-1** | journal-graph.js regression |

## Operational Metrics

| Metric | Run-8 | Run-7 | Delta |
|--------|-------|-------|-------|
| Cost | ~$3-4 (est.) | $3.22 | Similar |
| Duration | 41m | 33m | +8m |
| Cost/file | ~$0.25-0.33 | $0.25 | Similar |
| Quality x Files | 11.04 | 11.44 | -0.4 |
| Push/PR | Failed (6th) | Failed (5th) | Still broken |

---

## Per-Rule Results

### Gates (5/5 PASS)

| Rule | Scope | Result |
|------|-------|--------|
| NDS-001 (Compilation) | Per-run | PASS — all 12 files pass node --check |
| NDS-002 (Tests) | Per-run | PASS — 534 tests, 0 failures |
| NDS-003 (Non-instrumentation lines) | Per-file | PASS — all 12 files clean |
| API-001 (Only @opentelemetry/api) | Per-file | PASS — all imports from @opentelemetry/api only |
| NDS-006 (Module system) | Per-run | PASS — ESM throughout |

### Quality Rules (23/25)

| Rule | Result | Instance Count | Affected Files |
|------|--------|---------------|----------------|
| NDS-004 (Signatures preserved) | PASS | 12/12 (100%) | — |
| NDS-005 (Error handling preserved) | PASS | 12/12 (100%) | — |
| COV-001 (Entry points have spans) | PASS | All entry points covered | — |
| COV-003 (Failable ops have error visibility) | PASS | All spans have error recording | — |
| COV-005 (Domain attributes present) | PASS | 12/12 files have relevant attributes | — |
| COV-006 (Auto-instrumentation / span uniqueness) | **PASS** | 29/29 span names unique | — (resolved from run-7) |
| RST-001 (No spans on utility functions) | PASS | 0 utility function violations | — |
| RST-003 (No duplicate spans on thin wrappers) | PASS | 0 thin wrapper violations | — |
| RST-004 (No spans on internal details) | PASS | 0 unexported function violations | — |
| RST-005 (No re-instrumentation) | PASS | No pre-existing instrumentation | — |
| API-002 (Correct dependency declaration) | PASS | @opentelemetry/api in peerDependencies | — |
| API-003 (No vendor SDKs) | PASS | No vendor packages found | — |
| API-004 (No SDK-internal imports) | **FAIL** | sdk-node in peerDependencies | Pre-existing since run-2 |
| SCH-001 (Span names match registry/quality) | PASS | 29/29 names follow convention | — |
| SCH-002 (Attribute keys match registry) | PASS | All keys in registries | — |
| SCH-003 (Attribute values conform to types) | **FAIL** | 6/12 files affected (50%) | summarize, summary-graph, auto-summarize, journal-manager, summary-manager, summary-detector |
| SCH-004 (No redundant schema entries) | PASS | No obvious redundancy | — |
| CDQ-001 (Spans closed in all paths) | PASS | All spans use startActiveSpan + finally | — |
| CDQ-002 (Tracer acquired correctly) | PASS | All 12 files: trace.getTracer('commit-story') | — |
| CDQ-003 (Standard error recording) | PASS | recordException + setStatus(ERROR) everywhere | — |
| CDQ-005 (Async context maintained) | PASS | All files use startActiveSpan callback | — |
| CDQ-006 (Expensive computation guarded) | PASS | Only trivial conversions (exempt) | — |
| CDQ-007 (No unbounded/PII attributes) | PASS | No violations found | — |
| CDQ-008 (Consistent tracer naming) | PASS | All 12 files use 'commit-story' | — |

---

## Failure Classification

### API-004: @opentelemetry/sdk-node in peerDependencies

- **Classification**: Pre-existing (run-2 through run-8)
- **Owner**: Target project (commit-story-v2), not spiny-orb
- **Impact**: Library distributes SDK dependency to consumers
- **New in run-8**: Spiny-orb now detects this as an advisory (PR #258)

### SCH-003: Count Attributes Declared as String Type

- **Classification**: Persistent (run-7 through run-8, methodology correction)
- **Owner**: Spiny-orb (agent prompt guidance insufficient)
- **Impact**: 6 count attributes in schema use wrong type; code inconsistently wraps/doesn't wrap with String()
- **Root cause**: Agent's first file (summarize.js) declared counts as string; schema accumulator propagated to all subsequent files. SCH-003 prompt guidance overridden by schema conformance behavior
- **Instance count**: 6/12 committed files affected (50%), 1 underlying schema issue
- **Run-7 comparison**: Same issue, reclassified from CDQ to SCH for rubric accuracy

---

## Dimension Trend (Runs 2-8)

| Dimension | Run-2 | Run-3 | Run-4 | Run-5 | Run-6 | Run-7 | Run-8 |
|-----------|-------|-------|-------|-------|-------|-------|-------|
| NDS | 2/2 | 2/2 | 1/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| COV | 3/5 | 4/5 | 3/5 | 4/5 | 3/5 | 4/5 | **5/5** |
| RST | 2/4 | 4/4 | 3/4 | 4/4 | 3/4 | 4/4 | 4/4 |
| API | 1/3 | 1/3 | 3/3 | 3/3 | 3/3 | 2/3 | 2/3 |
| SCH | 2/4 | 2/4 | 1/4 | 3/4 | 3/4 | 4/4 | 3/4 |
| CDQ | 3/7 | 6/7 | 3/7 | 7/7 | 7/7 | 6/7 | **7/7** |
| **Total** | **13/25** | **19/25** | **14/25** | **23/25** | **21/25** | **22/25** | **23/25** |

**Run-8 ties run-5 for highest quality score (92%).** COV reaches 100% for the first time. CDQ returns to 100% (methodology correction reclassifies count type from CDQ to SCH).
