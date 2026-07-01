# Rubric Scores — Run-12

**Date**: 2026-04-09
**Branch**: spiny-orb/instrument-1775717624848
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/61

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 13 instrumented files pass `node --check` |
| NDS-002 (Tests) | Per-run | **PASS** — 564/564 tests pass |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — 13/13 files |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — 13/13 files |
| NDS-006 (Module system) | Per-file | **PASS** — 13/13 files |

**Gates**: 5/5 PASS

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 13/13 |
| NDS-005 (Error handling preserved) | **PASS** | 13/13 (NDS-005 advisory on index.js is false positive — inner try/catch preserved) |

### Coverage (COV): 4/5 (80%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | 13/13 applicable |
| COV-003 (Failable ops have error visibility) | **PASS** | 13/13 applicable |
| COV-004 (Async ops have spans) | **FAIL** | summary-manager.js — 6 exported async I/O functions without spans |
| COV-005 (Domain attributes present) | **PASS** | 13/13 |
| COV-006 (Auto-instrumentation preferred) | **PASS** | 2/2 applicable (journal-graph, summary-graph) |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 13/13 |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 13/13 |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | @opentelemetry/api in peerDependencies |
| API-003 (No vendor SDKs) | **PASS** | No vendor packages in dependencies |
| API-004 (No SDK imports) | **PASS** | Only @opentelemetry/api imported |

### Schema Fidelity (SCH): 4/4 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 31 unique spans, all follow commit_story.* convention |
| SCH-002 (Attribute keys match registry) | **PASS** | All keys from registry or agent-extensions |
| SCH-003 (Attribute types correct) | **PASS** | force=boolean, *_count=int, labels=string |
| SCH-004 (No redundant entries) | **PASS** | No true duplicates (4 SCH-004 advisories are false positives) |

### Code Quality (CDQ): 6/7 (86%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | All paths close spans |
| CDQ-002 (Tracer name) | **PASS** | 'commit-story' in all 13 files |
| CDQ-003 (Error recording) | **PASS** | recordException + SpanStatusCode.ERROR |
| CDQ-005 (Async context) | **PASS** | startActiveSpan with async callbacks |
| CDQ-006 (Expensive guards) | **PASS** | No expensive computations (CDQ-006 advisory false positive — .toISOString().split('T') is trivial, exempt) |
| CDQ-007 (No unbounded/PII) | **FAIL** | journal-manager.js — commit.hash and commit.author set unconditionally from potentially nullable fields; agent acknowledges "may produce undefined values" |
| CDQ-008 (Consistent naming) | **PASS** | 'commit-story' everywhere |

---

## Overall Score

| Dimension | Score | Run-11 | Delta |
|-----------|-------|--------|-------|
| NDS | 2/2 (100%) | 2/2 (100%) | — |
| COV | 4/5 (80%) | 5/5 (100%) | **-20pp** |
| RST | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 4/4 (100%) | 4/4 (100%) | — |
| CDQ | 6/7 (86%) | 7/7 (100%) | **-14pp** |
| **Total** | **23/25 (92%)** | **25/25 (100%)** | **-8pp** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | — |

---

## Canonical Metrics

| Metric | Run-12 | Run-11 | Run-10 | Run-9 |
|--------|--------|--------|--------|-------|
| Quality | 23/25 (92%) | 25/25 (100%) | 23/25 (92%) | 25/25 (100%) |
| Gates | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) |
| Files committed | 12 + 1 partial | 13 | 12 | 12 |
| Total spans | 31 (28 committed + 3 partial) | 39 | 28 | 26 |
| Cost | $5.19 | $4.25 | $4.36 | $3.97 |
| Push/PR | YES (#61) | YES (#60) | NO | NO |
| Quality x Files | **11.0** | 13.0 | 11.0 | 12.0 |
| Duration | 53.8 min | 41.2 min | 45.9 min | 43.7 min |

**Quality x Files = 11.0** — regression from run-11's 13.0, back to run-10's baseline.

---

## Failure Analysis

### COV-004: summary-manager.js

Run-11 instrumented all 9 exported async functions (9 spans). Run-12 instrumented only the 3 pipeline orchestrators (3 spans). The 6 omitted functions (readDayEntries, saveDailySummary, readWeekDailySummaries, saveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary) are all exported, async, and perform filesystem I/O.

The agent reasoned these were "covered through context propagation" — a valid observability design philosophy, but not compliant with COV-004's requirement that each async function has a span. Run-11's approach was correct.

**Root cause**: LLM variation in span allocation strategy. The agent's "stay near the ratio threshold" reasoning introduced an under-instrumentation heuristic not grounded in the rubric.

### CDQ-007: journal-manager.js

The NDS-003 truthy-check gap forced the agent to choose between: (a) drop the attribute, or (b) set it unconditionally. Run-12's agent chose (b) for commit.hash and commit.author, unlike run-11's agent which chose (a) for messages_count. Choice (b) produces potential `undefined` attribute values, which CDQ-007 explicitly prohibits.

**Root cause**: NDS-003 truthy-check gap (PR #352 fixed `!== undefined` but not `if (obj.property)` guards). The underlying spiny-orb issue is the same as RUN11-5, with a different manifestation.

---

## NDS-003 Truthy-Check Pattern Classification

| Pattern | NDS-003 Status | CDQ-007 Status | Agent Response |
|---------|---------------|----------------|----------------|
| `if (value !== undefined)` | PASS (PR #352 fix) | N/A | Can guard safely |
| `if (value != null)` | PASS (PR #352 fix) | N/A | Can guard safely |
| `if (value)` (truthy) | **FAIL** (still flagged) | N/A if dropped | Drop attribute |
| `if (value)` (truthy) | **FAIL** (still flagged) | **FAIL** if unconditional | Set unconditionally → CDQ-007 |

The truthy-check gap is the root cause of both the attribute dropping in index.js and the CDQ-007 failure in journal-manager.js.
