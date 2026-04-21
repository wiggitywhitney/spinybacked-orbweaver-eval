# Rubric Scores — release-it Run-2

**Date**: 2026-04-21
**Branch**: spiny-orb/instrument-1776786399007
**PR**: NOT CREATED (push succeeded; PR creation blocked by PAT scope)

**Evaluation scope**: 13 instrumented files (5 committed before rollback + 6 LINT failures evaluated from branch + 1 NDS-003 failure + 1 COV-003 failure). 10 correct skips are not scored. Evaluation is based on the agent's last-attempt file state on the spiny-orb branch — LINT delivery failures are assessed separately from instrumentation quality.

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 13 instrumented files pass `node --check`; LINT failures are formatting-only, not syntax errors |
| NDS-002 (Tests) | Per-run | **NOT EVALUABLE** — checkpoint tests fail due to OTel module resolution (infrastructure failure, not agent-introduced regression) |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS 12/13** — GitHub.js FAIL (original line 394 `return this.retry(...)` modified to capture return value) |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS 13/13** |
| NDS-006 (Module system) | Per-file | **PASS 13/13** — ESM imports consistent throughout |

**Gates**: 4/5 PASS + 1 NOT EVALUABLE. GitHub.js fails NDS-003.

---

## Dimension Scores

Scored on 12 files that passed all gates (GitHub.js excluded due to NDS-003 gate failure).

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 12/12 |
| NDS-005 (Error handling preserved) | **PASS** | 12/12 — new try/catch blocks are instrumentation wrappers; original catch blocks preserved |

### Coverage (COV): 3/4 (75%)

COV-002 and COV-006 not applicable (no outbound HTTP clients; no auto-instrumentation libraries applicable to release-it's exec-wrapper pattern).

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | 12/12 applicable |
| COV-003 (Failable ops have error visibility) | **FAIL** | GitLab.js — 4 catch blocks missing `span.recordException` + `span.setStatus` |
| COV-004 (Async ops have spans) | **PASS** | 12/12 — unexported async helpers correctly exempted via RST-004 |
| COV-005 (Domain attributes present) | **PASS** | 12/12 — domain-specific attributes on all instrumented spans |

### Restraint (RST): 5/5 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 12/12 — synchronous helpers consistently skipped |
| RST-002 (No accessor spans) | **PASS** | 12/12 — getters and trivial accessors skipped |
| RST-003 (No thin wrapper spans) | **PASS** | 12/12 — exec → execFormattedCommand, getBranchName, getRemote etc. correctly skipped |
| RST-004 (No internal detail spans) | **PASS** | 12/12 — unexported helpers consistently skipped |
| RST-005 (No re-instrumentation) | **PASS** | N/A — no pre-existing instrumentation in release-it |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api: ">=1.0.0"` in peerDependencies |
| API-003 (No vendor SDKs) | **PASS** | No vendor-specific packages added |
| API-004 (No SDK imports) | **PASS** | Only `@opentelemetry/api` imported across all 12 files |

### Schema Fidelity (SCH): 4/4 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names follow convention) | **PASS** (with advisory) | All span names bounded cardinality, no embedded dynamic values, follow `release_it.<module>.<operation>` pattern. Advisory: GitBase.js uses `release-it.git.*` (hyphen) while all other files use `release_it.*` (underscore) — naming inconsistency within the run. |
| SCH-002 (Attribute keys correct) | **PASS** | All registered keys used correctly; schema extension attributes are appropriate extensions |
| SCH-003 (Attribute types correct) | **PASS** | Boolean attributes set via `Boolean()`, integer counts from `.length`, strings from string fields |
| SCH-004 (No redundant entries) | **PASS** | CDQ-007 advisories in PR summary about factory.js `.length` are false positives — Array.filter() always returns an array |

### Code Quality (CDQ): 7/7 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | `span.end()` in finally block for all 12 files; Version.js's promptIncrementVersion skipped (process.exit would orphan span) |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('release-it')` — matches package name |
| CDQ-003 (Error recording) | **PASS** | Standard `recordException` + `SpanStatusCode.ERROR` pattern |
| CDQ-005 (Async context) | **PASS** | `startActiveSpan` callback pattern throughout; no `startSpan` manual pattern |
| CDQ-006 (Expensive guards) | **PASS** | No `.map`/`.reduce`/`JSON.stringify` in setAttribute calls |
| CDQ-007 (No unbounded/PII) | **PASS** | Nullable fields consistently guarded with `!= null`; Boolean() coercion for booleans; no PII fields |
| CDQ-008 (Consistent naming) | **PASS** | `'release-it'` in all 12 files |

---

## Overall Score

| Dimension | Applicable | Passing | Score |
|-----------|-----------|---------|-------|
| NDS | 2 | 2 | 100% |
| COV | 4 | 3 | 75% |
| RST | 5 | 5 | 100% |
| API | 3 | 3 | 100% |
| SCH | 4 | 4 | 100% |
| CDQ | 7 | 7 | 100% |
| **Total** | **25** | **24** | **96%** |
| **Gates** | 5 | 4 (+1 NOT EVAL) | **4/5** |

---

## Canonical Metrics

| Metric | Run-2 | Run-1 |
|--------|-------|-------|
| Quality | 24/25 (96%) | N/A (run halted before evaluation) |
| Gates | 4/5 (4 pass + 1 not eval) | N/A |
| Files instrumented | 13 | 5 (halted) |
| Files committed (net) | 0 (checkpoint rollback) | 0 |
| Total spans attempted | 29 | 0 |
| Cost | $5.69 | $0.68 |
| Push | YES (branch) | NO |
| PR | FAILED | N/A |
| Quality × Files | 0 (infra failure) | 0 |
| Adjusted Q×F (if committed) | ~12.5 | — |
| Duration | 63.4 min | ~5 min (halted) |

**Quality × Files = 0** due to infrastructure failures (checkpoint OTel module resolution + PR PAT scope). The agent's instrumentation quality (96%) was high — the 0 committed files is entirely an infrastructure result, not a quality result.

**Adjusted Q×F**: If the OTel module resolution issue were fixed and all 13 instrumented files had committed, Q×F would be 24/25 × 13 ≈ **12.5**, comparable to commit-story-v2 run-12's 11.0.

---

## Failure Analysis

### NDS-003: lib/plugin/github/GitHub.js

The agent modified `return this.retry(async bail => {)` at original line 394, converting it to `const result = await this.retry(...); return result` to capture the return value for `release_it.github.release_id`. The return-value capture pattern was described in the agent's fix-loop rules as permitted — but NDS-003 fires on the missing original line regardless.

**Fix**: Instrument createRelease() without `release_id` attribute (omit rather than transform). The span can still cover the operation; the specific ID attribute is optional.

### COV-003: lib/plugin/gitlab/GitLab.js

Four catch blocks missing `span.recordException` + `span.setStatus(ERROR)`. The second attempt fixed arrowParens but did not resolve the COV-003 violations. This file was close to passing (arrowParens fixed) but the catch-block coverage check blocked it.

**NDS-007 interaction**: Some of GitLab.js's catch blocks may be graceful-degradation paths (expected conditions, not errors). If any of the four flagged blocks represent expected conditions (retry on rate-limit, optional resource not found), NDS-007 says error recording should NOT be added. The correct resolution requires per-catch inspection — see per-file evaluation notes.

### COV-003 in GitLab vs. LINT failures

GitLab.js was the only file where arrowParens was fixed but a different validation blocked the commit. This suggests the COV-003 issue is the deeper blocker — the LINT fix loop was working, but COV-003 validation is evaluated before LINT in some runs. Worth checking the attempt sequence in the log.

---

## Comparison with commit-story-v2 Run-12

| Metric | release-it Run-2 | commit-story-v2 Run-12 |
|--------|-----------------|----------------------|
| Quality | 24/25 (96%) | 23/25 (92%) |
| Gate failures | 1 (NDS-003) | 0 |
| Files instrumented | 13 | 13 + 1 partial |
| Dominant failure type | Delivery (LINT/checkpoint) | Quality (COV-004, CDQ-007) |
| Cost | $5.69 | $5.19 |
| Q×F (actual) | 0 (infra) | 11.0 |

The agent's instrumentation reasoning quality in run-2 exceeds run-12 on a per-file basis. The 0 Q×F is an infrastructure artifact, not a quality finding.
