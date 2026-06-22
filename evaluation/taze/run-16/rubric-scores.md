<!-- ABOUTME: Rubric scores for taze run-16 — dimension-by-dimension quality scoring vs run-15 baseline. -->
# Rubric Scores — taze Run-16

**Date**: 2026-06-21
**Branch**: spiny-orb/instrument-1782059121456
**PR**: https://github.com/wiggitywhitney/taze/pull/11
**Rubric version**: 31 rules (2 per-run gates + 29 quality rules)
**IS score**: 88.9/100 (up from 80/100 in run-15)
**spiny-orb SHA**: 8a08f5b (includes #752 companion files, #989 extended debug dumps)

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 13 committed files pass `tsc --noEmit`; 0 failed files; resolves.ts and yarnWorkspaces.ts both recovered after run-15 NDS-001 failures |
| NDS-002 (Tests) | Per-run | **PASS** — checkpoint test suite passed on all 13 committed files; live-check OK; 0 rollbacks |

**Gates: 2/2 PASS**

---

## Dimension Scores

### Non-Destructiveness (NDS): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-003 (Non-instrumentation lines unchanged) | **PASS** | 13/13 — yarnWorkspaces.ts regex fix (`/\./ g` → `/\./g`) treated as pre-existing source defect correction (syntax error causing NDS-001), not business logic modification; no behavioral change |
| NDS-004 (API signatures preserved) | **PASS** | 13/13 — all exported function signatures unchanged across all files |
| NDS-005 (Error handling preserved) | **PASS** | 13/13 — all pre-existing try/catch patterns preserved; inner `catch {}` in packages.ts loadPackage, packageYaml writeYAML `.catch(Object.create)`, and dumpCache inner catch preserved as NDS-007 graceful degradation without recordException |
| NDS-006 (Module system matches project) | **PASS** | 13/13 — all agent-added imports use ESM syntax, matching project `"type": "module"` |

### Coverage (COV): 5/6 (83%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | 13/13 — all exported async entry points have spans; unexported I/O functions instrumented under RST-004 I/O exception |
| COV-002 (External HTTP calls enclosed) | **PASS** | packument.ts covers npm/JSR registry HTTP via `fetchPackage` and `fetchJsrPackageMeta`; resolves.ts COV-002 coverage recovered (getPackageData spans HTTP calls via fetchPackage/fetchJsrPackageMeta) |
| COV-003 (Failable ops have error visibility) | **PASS** | 13/13 — `recordException` + `setStatus(ERROR)` on all spans; pre-existing graceful fallbacks preserved without recordException per NDS-007 |
| COV-004 (Async ops have spans) | **PASS** | 13/13 — all async functions with I/O are spanned; unexported async I/O functions covered under RST-004 exemption |
| COV-005 (Domain attributes present) | **FAIL** | packument.ts: `taze.package.latest_version` dropped from both `taze.fetch.package` and `taze.fetch.jsr_package` spans. This is a registered schema attribute captured in run-15 and directly available in both response objects (`meta.latest` for JSR; npm response data). Omitting the primary output of a package registry fetch — the resolved latest version — is an attribute selection regression vs. the baseline. Additionally: JSR span name changed from `taze.fetch.jsr_package_meta` to `taze.fetch.jsr_package` — both are valid schema extensions but creates naming inconsistency across runs |
| COV-006 (Auto-instrumentation preferred) | **PASS** | N/A for all applicable files — no auto-instrumentation library covers npm/JSR registry HTTP, pnpm/bun/yarn workspace I/O, or cache operations in this project |

### Restraint (RST): 5/5 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No unnecessary utility spans) | **PASS** | 13/13 — synchronous helpers, type-only files, thin sync wrappers correctly not instrumented; 20 correct pre-scan skips include: cli.ts, constants.ts, index.ts, types.ts, utils/context.ts, utils/dependenciesFilter.ts, utils/config.ts, utils/diff.ts, filters/diff-sorter.ts, render.ts, log.ts, utils/package.ts, utils/sha.ts, utils/time.ts, commands/check/render.ts, utils/sort.ts, utils/versions.ts, io/dependencies.ts, addons/vscode.ts, addons/index.ts |
| RST-002 (No accessor spans) | **PASS** | 13/13 — no accessor or getter spans in any file |
| RST-003 (No thin wrapper spans) | **PASS** | 13/13 — `writeYaml` (single-statement writeFile wrapper), `fetchWithUserAgent` (header-adding wrapper), and similar thin wrappers correctly excluded; packages.ts `readJSON` thin wrapper advisory noted but not a canonical fail (observability value defensible for this export) |
| RST-004 (Unexported functions — I/O exemption applied correctly) | **PASS** | 13/13 — unexported I/O functions correctly instrumented (checkGlobal.ts: loadGlobalPnpmPackage, loadGlobalNpmPackage, installPkg; packages.ts: readJSON, writeJSON, writePackage, loadPackage; api/check.ts: CheckSingleProject); unexported sync/transform functions correctly excluded |
| RST-005 (No pre-existing tracer instrumentation) | **PASS** | 13/13 — no pre-existing tracer calls in any file |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Scope |
|------|--------|-------|
| API-001 (Only `@opentelemetry/api` imports) | **PASS** | 13/13 — all files import only `trace` and `SpanStatusCode` from `@opentelemetry/api`; no SDK, instrumentation library, or vendor package imported |
| API-002 (`@opentelemetry/api` in peerDependencies) | **PASS** | Per-run — `@opentelemetry/api: ">=1.0.0"` present in `package.json` peerDependencies |
| API-003 (No vendor-specific SDK) | **PASS** | Per-run — no Datadog, Jaeger, Zipkin, or other vendor SDK in dependencies |

### Schema Fidelity (SCH): 3/4 (75%)

| Rule | Result | Files |
|------|--------|-------|
| SCH-001 (Span names in registry) | **PASS** | 13/13 — all 35 span names registered in `agent-extensions.yaml` as `span.*` entries |
| SCH-002 (Attribute keys registered) | **PASS** | 13/13 — all attribute keys used in code are registered in either `agent-extensions.yaml` (new extensions) or `semconv/attributes.yaml` (pre-existing taze schema) |
| SCH-003 (Attribute types match schema) | **FAIL** | 2 files: (1) checkGlobal.ts: `String(deps.length)` passed for `taze.package.deps_count` declared as `type: int`; (2) bunWorkspaces.ts: `String(catalogs.length)` passed for `taze.catalog.count` declared as `type: int`. Pattern: agent correctly declares int type in schema, then applies `String()` cast at call sites. pnpmWorkspaces.ts and yarnWorkspaces.ts correctly pass `catalogs.length` (int) without cast. Fix: remove `String()` wrapper at both call sites |
| SCH-004 (No near-synonym redundancy) | **PASS** | 13/13 — no attribute key near-duplicates; `taze.catalog.count` correctly distinct from `taze.config.sources_found`; `taze.package.file_path` correctly distinct from `taze.write.file_path` |

### Code Quality (CDQ): 6/7 (86%)

| Rule | Result | Files |
|------|--------|-------|
| CDQ-001 (Spans closed in all paths) | **PASS** | 13/13 — all spans use `startActiveSpan` callback pattern with `span.end()` in `finally` blocks. Advisory: interactive.ts has span leak if `process.exit()` is called from nested `onKey`/`registerInput` callbacks — cannot be fixed without NDS-003 violation; documented as known limitation |
| CDQ-002 (Tracer acquired correctly) | **PASS** | 13/13 — all files use `trace.getTracer('taze')` matching `tracerName` in `spiny-orb.yaml`; CDQ-011 per-run PASS |
| CDQ-003 (Error recording complete) | **PASS** | 13/13 — all catch blocks use `recordException` + `setStatus({ code: SpanStatusCode.ERROR })`; pre-existing graceful degradation catch blocks excluded per NDS-007 |
| CDQ-005 (Context propagation correct) | **PASS** | 13/13 — all spans use `startActiveSpan` callback pattern; automatic context propagation via OTel API |
| CDQ-006 (No expensive computation in setAttribute) | **FAIL** | bunWorkspaces.ts: 3 `setAttribute` calls in `loadBunWorkspace` placed after `await readFile(...)` without `if (span.isRecording())` guard: `taze.write.file_path`, `taze.write.package_type`, `taze.catalog.count`. All three are post-await and should be guarded. `writeBunWorkspace` correctly guards its `Object.keys(versions).length` call. Net: +2 CDQ-006 violations vs run-15 in bunWorkspaces specifically; overall CDQ-006 violation count comparable (run-15: 5 across 4 files; run-16: 3 in bunWorkspaces + 0 elsewhere). checkGlobal.ts `String(deps.length)` is O(1) and exempt from CDQ-006. pnpmWorkspaces.ts `catalogs.length` is O(1) and exempt |
| CDQ-007 (Data quality — no PII, bounded cardinality, null guards) | **PASS** | 13/13 with advisories — file path attributes in some files (bunWorkspaces.ts `writeBunJSON`, readYAML/writeYAML in packageYaml) use absolute paths due to scope constraints; cardinality bounded by project file count; not PII. Null guards added in resolves.ts for nullable package data access |

---

## Overall Score

| Dimension | Run-16 | Run-15 | Delta |
|-----------|--------|--------|-------|
| NDS | 4/4 (100%) | 4/4 (100%) | — |
| COV | 5/6 (83%) | 6/6 (100%) | **-1** |
| RST | 5/5 (100%) | 5/5 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 3/4 (75%) | 3/4 (75%) | — |
| CDQ | 6/7 (86%) | 6/7 (86%) | — |
| **Overall quality** | **26/29 (90%)** | **27/29 (93%)** | **-1** |
| **Gates** | **2/2 (100%)** | **2/2 (100%)** | — |
| **Files committed** | **13** | **11** | **+2** |
| **IS Score** | **88.9/100** | **80/100** | **+8.9** |
| **Q×F** | **11.7** | **10.2** | **+1.5** |

**Q×F calculation**: (26/29) × 13 = 0.897 × 13 = **11.7**

---

## Findings by Priority

### New findings requiring spiny-orb attention

| ID | Rule | File | Description |
|----|------|------|-------------|
| TAZE-RUN3-1 | COV-005 | packument.ts | `taze.package.latest_version` dropped from both fetch spans; registered attribute available in response data; attribute selection regression vs run-15 |
| TAZE-RUN3-2 | CDQ-006 | bunWorkspaces.ts | 3 post-await `setAttribute` calls in `loadBunWorkspace` without `isRecording()` guard: `taze.write.file_path`, `taze.write.package_type`, `taze.catalog.count` |
| TAZE-RUN3-3 | SCH-003 | checkGlobal.ts | `String(deps.length)` for `taze.package.deps_count` (int schema) — same `String()` cast pattern as run-15's taze.io.catalogs_found |
| TAZE-RUN3-4 | SCH-003 | bunWorkspaces.ts | `String(catalogs.length)` for `taze.catalog.count` (int schema) — schema correct, call site wrong |

### Resolved vs run-15

| Finding | Resolution |
|---------|-----------|
| TAZE-RUN2-4 resolves.ts oscillation | **RECOVERED** — 6 spans committed on attempt 2; oscillation did not recur; #954 root cause still open |
| TAZE-RUN2-5 yarnWorkspaces.ts NDS-001 regex | **RECOVERED** — 2 spans committed on attempt 2; regex fixed by agent |
| TAZE-RUN2-2 interactive.ts CDQ-006 violation | **FIXED** — isRecording guard correctly applied |
| pnpmWorkspaces.ts CDQ-006 violation | **FIXED** — Object.keys(versions).length guard added |
| TAZE-RUN2-3 SCH-003 catalogs_found string | **SCHEMA FIXED** — new attribute `taze.catalog.count` correctly declared as int; code-level recurrence in bunWorkspaces.ts (String cast) |

### Carry-forward (unresolved)

| ID | Finding | Priority |
|----|---------|----------|
| TAZE-RUN3-1 | COV-005: packument.ts drops taze.package.latest_version | Low |
| TAZE-RUN3-2 | CDQ-006: bunWorkspaces.ts 3 unguarded post-await setAttribute calls | Low |
| TAZE-RUN3-3 | SCH-003: String() cast for int attr in checkGlobal.ts | Low |
| TAZE-RUN3-4 | SCH-003: String() cast for int attr in bunWorkspaces.ts | Low |
| TAZE-RUN1-6 | IS SPA-001: INTERNAL span count — structural; CLI design discussion | Info |
