# Rubric Scores — release-it Run 3

**Date**: 2026-05-04
**Branch**: spiny-orb/instrument-1777912706406
**PR**: https://github.com/wiggitywhitney/release-it/pull/2

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 3 committed files pass `node --check` |
| NDS-002 (Tests) | Per-run | **PASS** — 262/264 tests pass, 2 skipped (pre-existing gpgsign env issue) |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — 3/3 committed files |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — 3/3 committed files |
| NDS-006 (Module system / init file) | Per-file | **PASS** — `examples/instrumentation.js` not modified |

**Gates**: 5/5 PASS

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 3/3 — no function signatures changed |
| NDS-005 (Error handling preserved) | **PASS** | 3/3 — existing error handling intact; spans wrap without removing catches |

### Coverage (COV): 4/4 applicable (100%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | All async entry points in committed files instrumented |
| COV-003 (Failable ops have error visibility) | **PASS** | 3/3 — recordException + setStatus(ERROR) in all outer catches |
| COV-004 (Async ops have spans) | **PASS** (committed files) | All async functions in config.js, factory.js, util.js have spans. **Note**: pre-scan false negatives mean 8 additional files with async class methods were not attempted — see PR evaluation. |
| COV-005 (Domain attributes present) | **PASS** | config.js: is_ci, is_dry_run, version.increment; factory.js: plugin.namespace, plugin.external_count; util.js: util.collection_size |
| COV-006 (Auto-instrumentation preferred) | N/A | No auto-instrumented frameworks (LangChain, Octokit KFP) in committed files |

### Restraint (RST): 2/2 applicable (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 3/3 — synchronous helpers correctly skipped in all committed files |
| RST-003 (No duplicate wrapper spans) | N/A | No existing spans in committed files |
| RST-004 (No internal detail spans) | **PASS** | 3/3 — unexported internal helpers skipped (resolveFile, getPluginName, tryStatFile, etc.) |
| RST-005 (No re-instrumentation) | N/A | No pre-existing spans in source files |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api: >=1.0.0` in peerDependencies |
| API-003 (No vendor SDKs) | **PASS** | No vendor OTel packages in dependencies |
| API-004 (No SDK imports) | **PASS** | All committed files import only from `@opentelemetry/api` |

### Schema Fidelity (SCH): 4/4 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry or reported as extensions) | **PASS** | 6 new spans — all correctly declared as extensions; naming convention `release_it.<domain>.<operation>` consistent |
| SCH-002 (Attribute keys match registry) | **PASS** | Registered: `release_it.is_ci`, `release_it.is_dry_run`, `release_it.version.increment`, `release_it.plugin.namespace`. Extensions: `release_it.plugin.external_count`, `release_it.util.collection_size`. `release_it.config.file` correctly removed after validator rejection. |
| SCH-003 (Attribute types correct) | **PASS** | Boolean coercion for bool attrs; integer `.length` for int attrs; enum string passed directly with guaranteed non-null value |
| SCH-004 (No redundant entries) | **PASS** | 3 false-positive advisories (plugin.load ≈ config.load_local_config, plugin.get_plugins ≈ plugin.load, CDQ-007 on enabledExternalPlugins) are clearly incorrect — operations are semantically distinct |

### Code Quality (CDQ): 6/6 applicable (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed in all paths) | **PASS** | `span.end()` in `finally` block on all 6 spans |
| CDQ-002 (Tracer name consistency) | **PASS** | `trace.getTracer('release-it')` in all 3 committed files |
| CDQ-003 (Error recording) | **PASS** | `recordException(error)` + `SpanStatusCode.ERROR` in all outer catches |
| CDQ-005 (Async context propagation) | **PASS** | All spans use `startActiveSpan` with async callbacks |
| CDQ-006 (No expensive guards) | N/A / PASS | No expensive computations guarded before setAttribute |
| CDQ-007 (No unbounded/PII attributes) | **PASS** | collection_size: null-guarded; is_ci/is_dry_run: Boolean() coercion; version.increment: guaranteed non-null; plugin.namespace: non-null string parameter; external_count: initialized array length |
| CDQ-008 (Consistent tracer naming) | **PASS** | `'release-it'` in all committed files |

---

## Overall Score

| Dimension | Score | Run-2 (reference) |
|-----------|-------|-------------------|
| NDS | 2/2 (100%) | N/A (run-2: 0 committed) |
| COV | 4/4 (100%) | N/A |
| RST | 2/2 (100%) | N/A |
| API | 3/3 (100%) | N/A |
| SCH | 4/4 (100%) | N/A |
| CDQ | 6/6 (100%) | N/A |
| **Total** | **25/25 (100%)** | N/A |
| **Gates** | **5/5 (100%)** | 5/5 (0 files committed; checkpoint rollbacks) |

---

## Canonical Metrics

| Metric | Run-3 | Run-2 |
|--------|-------|-------|
| Quality | 25/25 (100%) | 24/25 (96%) on non-LINT files |
| Gates | 5/5 (100%) | 5/5 (100%) |
| Files committed | 3 | 0 (checkpoint rollbacks) |
| True correct skips | 10 | 3 |
| Pre-scan false negatives | 8 | 0 (files were attempted, not skipped) |
| Total spans committed | 6 | 0 |
| Cost | $1.59 | $5.69 |
| Push/PR | YES (manual PR#2) | YES push / NO PR (PAT scope) |
| Q×F | **3.0** | 0 |

**Q×F = 3.0** — first non-zero Q×F for release-it. Limited by pre-scan false negatives (8 files with async class methods not attempted) rather than quality failures. On the 3 committed files, quality is 25/25.

---

## Key Finding: Pre-Scan Coverage Gap

The quality score of 25/25 on committed files is genuine. The low Q×F (3.0) is entirely a volume problem — the pre-scan is failing to detect async class methods in plugin files, leaving 8 files uninstrumented. If those 8 files were correctly instrumented at the same quality level, Q×F would reach ~22–28 (accounting for ~2–3 spans per class method file × 8 files at 100% quality).

This is the highest priority improvement opportunity for run-4: pre-scan must correctly identify class-based async methods as instrumentable.
