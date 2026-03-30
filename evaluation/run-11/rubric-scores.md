# Rubric Scores — Run-11

**Date**: 2026-03-30
**Branch**: spiny-orb/instrument-1774849971011
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/60

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** |
| NDS-002 (Tests) | Per-run | **PASS** (564/564 tests) |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** (13/13 files) |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** (13/13 files) |
| NDS-006 (Module system) | Per-file | **PASS** (13/13 files) |

**Gates**: 5/5 PASS

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 13/13 |
| NDS-005 (Error handling preserved) | **PASS** | 13/13 |

### Coverage (COV): 5/5 (100%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | 13/13 applicable |
| COV-003 (Failable ops have error visibility) | **PASS** | 13/13 applicable |
| COV-004 (Async ops have spans) | **PASS** | 13/13 applicable |
| COV-005 (Domain attributes present) | **PASS** | 13/13 |
| COV-006 (Auto-instrumentation preferred) | **PASS** | 2/2 applicable (journal-graph, summary-graph) |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 13/13 |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A (no thin wrappers instrumented) |
| RST-004 (No internal detail spans) | **PASS** | 13/13 |
| RST-005 (No re-instrumentation) | **PASS** | N/A (no pre-existing instrumentation) |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | @opentelemetry/api in peerDependencies |
| API-003 (No vendor SDKs) | **PASS** | No vendor packages in dependencies |
| API-004 (No SDK imports) | **PASS** | Only @opentelemetry/api imported |

### Schema Fidelity (SCH): 4/4 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 39 unique spans, all follow commit_story.* convention |
| SCH-002 (Attribute keys match registry) | **PASS** | All keys from registry or agent-extensions |
| SCH-003 (Attribute types correct) | **PASS** | force=boolean, *_count=int, labels=string |
| SCH-004 (No redundant entries) | **PASS** | No true duplicates (advisory false positives) |

### Code Quality (CDQ): 7/7 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | All paths close spans (finally blocks + process.exit guards) |
| CDQ-002 (Tracer name) | **PASS** | 'commit-story' in all 13 files |
| CDQ-003 (Error recording) | **PASS** | recordException + SpanStatusCode.ERROR |
| CDQ-005 (Async context) | **PASS** | startActiveSpan with async callbacks |
| CDQ-006 (Expensive guards) | **PASS** | No expensive computations (trivial conversions exempt) |
| CDQ-007 (No unbounded/PII) | **PASS** | No `?.` in setAttribute; ternary or drop pattern |
| CDQ-008 (Consistent naming) | **PASS** | 'commit-story' everywhere |

---

## Overall Score

| Dimension | Score | Run-10 | Delta |
|-----------|-------|--------|-------|
| NDS | 2/2 (100%) | 2/2 (100%) | — |
| COV | 5/5 (100%) | 5/5 (100%) | — |
| RST | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 4/4 (100%) | 3/4 (75%) | **+25pp** |
| CDQ | 7/7 (100%) | 6/7 (86%) | **+14pp** |
| **Total** | **25/25 (100%)** | **23/25 (92%)** | **+8pp** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | — |

---

## Canonical Metrics

| Metric | Run-11 | Run-10 | Run-9 |
|--------|--------|--------|-------|
| Quality | 25/25 (100%) | 23/25 (92%) | 25/25 (100%) |
| Gates | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) |
| Files committed | 13 | 12 | 12 |
| Total spans | 39 | 28 | 26 |
| Cost | $4.25 | $4.36 | $3.97 |
| Push/PR | YES | NO | NO |
| Quality x Files | **13.0** | 11.0 | 12.0 |
| Duration | 41.2 min | 45.9 min | 43.7 min |

**Quality x Files = 13.0** — new all-time high (was 12.0 in run-9).

---

## SCH-003 Fix Verified

Run-10 failed SCH-003 because `commit_story.summarize.force` was declared as `type: string` but set to a boolean value. In run-11:
- agent-extensions.yaml declares `commit_story.summarize.force` as `type: boolean`
- Code sets it with actual boolean values
- `commit_story.commit.is_merge` (the other run-10 boolean) was not used this run

**SCH-003: FIXED**

## CDQ-007 Fix Verified

Run-10 failed CDQ-007 because summary-graph.js used `entries?.length` in setAttribute without guards. In run-11:
- summary-graph.js uses ternary `entries ? entries.length : 0` instead of optional chaining
- index.js dropped `messages_count` to avoid the pattern
- journal-graph.js dropped `gen_ai.usage.*` to avoid the pattern
- No `?.` appears in any setAttribute value argument

**CDQ-007: FIXED**
