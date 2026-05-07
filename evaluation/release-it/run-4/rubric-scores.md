# Rubric Scores — release-it Run 4

**Date**: 2026-05-06
**Branch**: spiny-orb/instrument-1778091147901
**PR**: https://github.com/wiggitywhitney/release-it/pull/3

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 7 committed files pass `node --check` |
| NDS-002 (Tests) | Per-run | **PASS** — 230 pass, 32 fail (pre-existing `git tag` infrastructure errors), 2 skipped; instrumentation introduced zero regressions |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — 7/7 committed files |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — 7/7 committed files |
| NDS-006 (Module system / init file) | Per-file | **PASS** — `examples/instrumentation.js` not modified |

**Gates**: 5/5 PASS

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 7/7 — no function signatures changed |
| NDS-005 (Error handling preserved) | **PASS** | 7/7 — existing catches wrapped without restructuring |

### Coverage (COV): 4/5 (80%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | All async entry points in committed files instrumented |
| COV-003 (Failable ops have error visibility) | **FAIL** | shell.js — `execWithArguments` catch uses `return Promise.reject(err)` without `span.recordException()` or `setStatus(ERROR)`; validator gap (detects `throw` but not `Promise.reject`) allowed it through |
| COV-004 (Async ops have spans) | **PASS** | All async exported functions in committed files instrumented |
| COV-005 (Domain attributes present) | **PASS** | 7/7 — all committed files include at least one domain attribute |
| COV-006 (Auto-instrumentation preferred) | N/A → PASS | No auto-instrumented frameworks (LangChain, Octokit KFP) in committed files |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 7/7 — synchronous helpers correctly skipped in all committed files |
| RST-003 (No duplicate wrapper spans) | N/A → PASS | No pre-existing spans in committed files to duplicate |
| RST-004 (No internal detail spans) | **PASS** | 7/7 — unexported internal helpers skipped throughout |
| RST-005 (No re-instrumentation) | N/A → PASS | No pre-existing OTel spans in source files |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api: >=1.0.0` in peerDependencies; `1.9.1` in devDependencies |
| API-003 (No vendor SDKs) | **PASS** | No vendor-specific OTel packages in any dependency section |
| API-004 (No SDK imports) | **PASS** | All committed files import only from `@opentelemetry/api` |

### Schema Fidelity (SCH): 4/4 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry or declared as extensions) | **PASS** | 20 new spans — all follow `release_it.<domain>.<operation>` convention; extensions declared correctly; 5 false-positive SCH-001 advisories in PR summary are clearly incorrect (distinct operations flagged as duplicates of each other) |
| SCH-002 (Attribute keys match registry) | **PASS** | 8 new attributes — all registered or declared as schema extensions |
| SCH-003 (Attribute types correct) | **PASS** | Boolean coercion for booleans; integer `.length` for counts; string coercion and semver strings where applicable |
| SCH-004 (No redundant entries) | N/A → PASS | No redundant registry entries; SCH-004 advisories are false positives on semantically distinct operations |

### Code Quality (CDQ): 7/7 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed in all paths) | **PASS** | `span.end()` in `finally` block on all 20 spans across 7 files |
| CDQ-002 (Tracer name consistency) | **PASS** | `trace.getTracer('release-it')` in all 7 committed files |
| CDQ-003 (No redundant span.end() calls) | **PASS** | No duplicate `span.end()` calls detected |
| CDQ-005 (Async context propagation) | **PASS** | All spans use `startActiveSpan` with async callbacks |
| CDQ-006 (No expensive guards) | N/A → PASS | No expensive computations inside attribute setters |
| CDQ-007 (No unbounded/PII attributes) | **PASS** | All attributes guarded: nullable fields use explicit null checks; `Boolean()` coercion for booleans; array lengths always numeric; `span.isRecording()` guard in shell.js |
| CDQ-008 (Consistent tracer naming) | **PASS** | `'release-it'` in all 7 committed files |

---

## Overall Score

| Dimension | Score | Run-3 | Delta |
|-----------|-------|-------|-------|
| NDS | 2/2 (100%) | 2/2 (100%) | — |
| COV | 4/5 (80%) | 5/5 (100%) | **-20pp** |
| RST | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 4/4 (100%) | 4/4 (100%) | — |
| CDQ | 7/7 (100%) | 7/7 (100%) | — |
| **Total** | **24/25 (96%)** | **25/25 (100%)** | **-4pp** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | — |

---

## Canonical Metrics

| Metric | Run-4 | Run-3 | Run-2 |
|--------|-------|-------|-------|
| Quality | 24/25 (96%) | 25/25 (100%) | 0 committed |
| Gates | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) |
| Files committed | 7 | 3 | 0 |
| Files failed | 6 | 2 | 7 (all LINT/NDS-003) |
| Correct skips | 10 | 10 | 3 |
| Total spans committed | 20 | 6 | 0 |
| Cost | ~$5–6 (~$6.97 per PR summary) | $1.59 | $5.69 |
| Push/PR | YES push / NO auto PR (E2BIG) | YES push / manual PR #2 | YES push / NO PR (PAT scope) |
| Q×F | **6.7** | 3.0 | 0 |
| Duration | 1h 25m 35s | ~50 min | ~80 min |

**Q×F = 6.7** (7 files × 24/25) — more than double run-3's 3.0. Volume increase is the driver: 7 files vs 3. Quality held at 96% despite 7 new file types and the RUN3-1 fix enabling class-method files for the first time.

---

## Failure Analysis

### COV-003: shell.js — Promise.reject without span error recording

`execWithArguments` in shell.js has `span.end()` in a `finally` block but its catch clause returns `Promise.reject(err)` rather than calling `span.recordException(err)` and `span.setStatus(ERROR)` before re-throwing. The span closes without error metadata when this path fires. The COV-003 validator allowed this through because it detects `throw` statements but not `return Promise.reject()` as a re-throw pattern.

**Root cause**: Validator gap on `Promise.reject` rethrow pattern. The agent treated `return Promise.reject(err)` as equivalent to `throw err` for control flow, which is functionally correct but violates COV-003's requirement that the span be marked as errored.

---

## New Failure Pattern: Indentation-Width Conflict (6 of 6 failed files)

All 6 failed files trace to a structural conflict: adding `startActiveSpan` wrapper adds 2 indentation levels, pushing already-long lines over Prettier's 120-char print width. The agent cannot satisfy both LINT (Prettier-compliant output) and NDS-003 (preserve original lines) simultaneously when the added indentation would require reformatting.

- **LINT failures** (GitBase.js, GitRelease.js, prompt.js): Agent preserved original line breaks, producing Prettier violations.
- **NDS-003 failures** (GitHub.js, npm.js): Agent proactively split long lines to avoid Prettier violations; NDS-003 flagged the splits as original-line modifications.
- **GitLab.js**: Separate failure (COV-003 + SCH-002), not the indentation-width conflict.

This pattern is documented as a spiny-orb infrastructure issue. No prompt change resolves it — the fix requires either a Prettier post-pass before NDS-003 comparison, or computing NDS-003's baseline against the Prettier-formatted original.
