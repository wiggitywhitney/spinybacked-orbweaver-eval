<!-- ABOUTME: Per-file evaluation for taze run-16 using parallel subagent approach (one agent per file). -->
# Per-File Evaluation — taze Run-16

**Date**: 2026-06-21
**Branch**: spiny-orb/instrument-1782059121456
**PR**: https://github.com/wiggitywhitney/taze/pull/11
**Rubric**: 29 quality rules + 2 gates
**Files evaluated**: 33 (13 committed with spans + 0 failed + 0 partial + 20 correct pre-scan skips)
**spiny-orb SHA**: 8a08f5b (includes #752 and #989)

**Primary goals for this run:**
1. resolves.ts: NDS-001 oscillation investigated — RECOVERED (6 spans, 0 new attributes, 2 attempts; #954 still open)
2. CDQ-006: isRecording guard violation count vs run-15 baseline of 5 violations in 4 files
3. SCH-003: taze.io.catalogs_found type mismatch — schema-level FIXED; code-level partial recurrence

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | 13 committed files all pass tsc; 0 failed files; yarnWorkspaces.ts and resolves.ts both recovered from run-15 failures |
| NDS-002 (Tests) | **PASS** | Checkpoint tests passed on all committed files; live-check OK; 0 rollbacks reported in log |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api` in peerDependencies at `>=1.0.0` |
| API-003 | **PASS** | No vendor-specific SDKs in dependencies |
| CDQ-011 | **PASS** | All 13 committed files use `trace.getTracer('taze')` consistently; matches `tracerName` in `spiny-orb.yaml` |

---

## Committed Files (13 with spans)

<!-- BATCH 1 COMPLETE: files 2, 3, 4 -->
<!-- BATCH 2 COMPLETE: files 1, 5, 6, 7, 8 -->
<!-- PENDING: files 9-13 -->

### 1. src/commands/check/checkGlobal.ts (4 spans)

**Spans**: `taze.check.global`, `taze.package.load_pnpm_global`, `taze.package.load_npm_global`, `taze.package.install`
**vs run-15**: Same 4 spans, same span names — no regression or improvement in span count. CDQ-006 improvement: run-15 had 2 inline reduce/filter chains in checkGlobal without isRecording guard; run-16 wraps both with `if (span.isRecording())`. New SCH-003 failure: `String(deps.length)` passed for `taze.package.deps_count` (schema declares `type: int`).
**Attempts**: 2
**Trace supplement**: No spans from this file appear in Datadog — `taze major` does not invoke the `check --global` subcommand. All 4 spans are gated behind `checkGlobal()`. Attribute counts cannot be verified from trace data for this file.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — only instrumentation additions; no business logic changed |
| API-001 | PASS — only `@opentelemetry/api` imported (`trace`, `SpanStatusCode`) |
| NDS-006 | PASS — ESM imports consistent with project module system |
| NDS-004 | PASS — `checkGlobal` signature (`options: CheckOptions`) unchanged |
| NDS-005 | PASS — inner catch in `loadGlobalPnpmPackage` (swallows exec failure, returns `[]`) is pre-existing graceful degradation (NDS-007); outer span catch re-throws; no existing error handling restructured |
| COV-001 | PASS — `checkGlobal` is the entry point for the `check --global` subcommand and receives a span |
| COV-002 | N/A — no outbound HTTP/network calls; `exec()` subprocess calls covered by COV-004 |
| COV-003 | PASS — all 4 spans have `recordException` + `setStatus(ERROR)` in their catch blocks |
| COV-004 | PASS — all three unexported async functions performing subprocess `exec()` calls are instrumented: `loadGlobalPnpmPackage`, `loadGlobalNpmPackage`, `installPkg` |
| COV-005 | PASS — `taze.check.global`: mode, write_mode, packages_total, packages_outdated; `taze.package.load_pnpm_global`: taze.config.sources_found; `taze.package.load_npm_global`: taze.fetch.registry, taze.package.deps_count; `taze.package.install`: taze.write.changes_count |
| COV-006 | N/A — no auto-instrumentation library covers pnpm/npm subprocess exec or global package management |
| RST-001 | PASS — no spans on synchronous utility functions |
| RST-002 | PASS — no spans on accessors |
| RST-003 | PASS — no spans on thin wrapper functions |
| RST-004 | PASS — `loadGlobalPnpmPackage`, `loadGlobalNpmPackage`, and `installPkg` are unexported but all perform subprocess `exec()` I/O; RST-004 exempts unexported functions that perform I/O |
| RST-005 | PASS — no pre-existing tracer calls in original source |
| SCH-001 | PASS — all 4 span names registered in agent-extensions.yaml |
| SCH-002 | PASS — all attribute keys registered: taze.check.mode, taze.check.write_mode, taze.check.packages_total, taze.check.packages_outdated, taze.config.sources_found, taze.fetch.registry, taze.package.deps_count, taze.write.changes_count |
| SCH-003 | **FAIL** — `span.setAttribute('taze.package.deps_count', String(deps.length))` passes a string value; schema declares `taze.package.deps_count` as `type: int`. The agent declared the attribute as int in the schema it wrote, then immediately passed the wrong type in the code — an internal contradiction. Fix: remove `String()` cast and pass `deps.length` directly |
| SCH-004 | PASS — `taze.package.deps_count` is new but registered; no redundancy with existing keys |
| CDQ-001 | PASS — all 4 spans use `startActiveSpan` callback pattern with `span.end()` in `finally` blocks |
| CDQ-002 | PASS — `trace.getTracer('taze')` matches project name |
| CDQ-003 | PASS — all catch blocks use `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })` |
| CDQ-005 | PASS — `startActiveSpan` callback pattern; context propagation handled automatically |
| CDQ-006 | PASS — both reduce/filter chains in `checkGlobal` now wrapped with `if (span.isRecording())`; IMPROVEMENT from run-15. `String(deps.length)` in `loadGlobalNpmPackage` is trivial type conversion (O(1), exempt per rubric). No remaining violations |
| CDQ-007 | PASS — no PII attribute keys, no object spreads, no `JSON.stringify` of request/response objects; all attribute values are primitives or bounded counts |

**Failures**: SCH-003 — `span.setAttribute('taze.package.deps_count', String(deps.length))` passes a string value for an attribute declared as `type: int` in the agent's own schema. Fix: remove `String()` cast.

---

### 2. src/commands/check/index.ts (1 span)

**Span**: `taze.check.run`
**vs run-15**: Identical — same span name, same 5 attributes, same `isRecording()` guard structure. CDQ-006 PASS maintained.
**Attempts**: 1
**Trace supplement**: The IS scoring run executed `taze major`, not `taze check`, so no `taze.check.run` spans appear in Datadog for this service.instance.id. The `taze.check.packages_total` attribute visible on `taze.resolve.dependencies` spans originates from `resolves.ts`, not this file.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — only instrumentation additions; business logic lines unchanged |
| API-001 | PASS — imports only `trace` and `SpanStatusCode` from `@opentelemetry/api` |
| NDS-006 | PASS — ESM import syntax matches project module system |
| NDS-004 | PASS — exported `check` function signature unchanged |
| NDS-005 | PASS — no pre-existing error handling restructured; new try/finally wraps span lifecycle with re-throw |
| COV-001 | PASS — exported async `check` entry point has span `taze.check.run` |
| COV-002 | N/A — no outbound HTTP/DB calls directly in this file |
| COV-003 | PASS — catch block: `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS — async function with multiple awaits is spanned |
| COV-005 | PASS — `taze.check.mode` (null-guarded), `taze.check.recursive` (`!!` coercion), `taze.check.write_mode` (`!!` coercion), `taze.check.packages_total` (post-resolve reduce), `taze.check.packages_outdated` (post-resolve reduce+filter) |
| COV-006 | N/A — no auto-instrumentation libraries cover this CLI command dispatch |
| RST-001 | PASS — no spans on utility functions |
| RST-002 | PASS — no spans on accessors |
| RST-003 | PASS — no spans on thin wrappers |
| RST-004 | PASS — `check` is exported; no unexported functions spanned without I/O justification |
| RST-005 | PASS — no pre-existing spans in source |
| SCH-001 | PASS — `taze.check.run` declared in `agent-extensions.yaml` |
| SCH-002 | PASS — all five attribute keys match registry names |
| SCH-003 | PASS — `taze.check.recursive` and `taze.check.write_mode` receive boolean (`!!` coercion); `taze.check.packages_total` and `taze.check.packages_outdated` receive integer (`.reduce()` result); `taze.check.mode` receives string |
| SCH-004 | PASS — no new attributes declared; all five keys were pre-registered |
| CDQ-001 | PASS — `span.end()` in `finally` block; `startActiveSpan` callback pattern used |
| CDQ-002 | PASS — `trace.getTracer('taze')` matches project name |
| CDQ-003 | PASS — `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` in catch |
| CDQ-005 | PASS — `startActiveSpan` callback pattern manages context automatically |
| CDQ-006 | PASS — both `taze.check.packages_total` and `taze.check.packages_outdated` are each wrapped in their own `if (span.isRecording())` guard before the `.reduce(...)` call; identical structure to run-15 |
| CDQ-007 | PASS — no PII attribute names; no raw filesystem paths |

**Failures**: None

---

### 3. src/commands/check/interactive.ts (1 span)

**Span**: `taze.check.interactive`
**vs run-15**: Run-15 had CDQ-006 FAIL (new violation: `flatDeps().length` called inside `setAttribute` without `isRecording()` guard). Run-16 fixes this: `taze.package.deps_count` is set to `pkgs.length` (O(1)) before the try block, before any await. Additionally introduces the new attribute `taze.package.deps_count` (first declared by this file in run-16), replacing run-15's use of `taze.check.packages_total` for this span.
**Attempts**: 3
**Retry analysis**: Attempts 1 and 2 failed NDS-003. Attempt 1 converted the single-line `if ((key.ctrl && key.name === 'c')) process.exit()` to block form to insert `span.end()` before the exit — a structural modification to non-instrumentation code. Attempt 2 tried to add a duplicate conditional guard (`if (key.ctrl && key.name === 'c') span.end(); if (key.ctrl && key.name === 'c') process.exit()`) — NDS-003 still fired because duplicating an existing conditional is a structural modification. Both failures were agent decision errors: the agent pursued CDQ-001 compliance via approaches NDS-003 prohibits. Attempt 3 accepted the constraint: `span.end()` only called in `finally` block, with `process.exit()` paths in nested callbacks documented as a CDQ-001 runtime advisory.
**Trace supplement**: No `taze.check.interactive` spans found for this service.instance.id. Expected: IS scoring uses `taze major` (non-interactive mode), so `promptInteractive` is never called.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — attempt 3 produces no structural modifications; only instrumentation additions |
| API-001 | PASS — only `@opentelemetry/api` import (`trace`, `SpanStatusCode`) |
| NDS-006 | PASS — ESM imports match project's `"type": "module"` |
| NDS-004 | PASS — `promptInteractive` signature unchanged |
| NDS-005 | PASS — no pre-existing try/catch/finally; new try/catch/finally is instrumentation-added |
| COV-001 | PASS — `promptInteractive` (exported async entry point) has `taze.check.interactive` span |
| COV-002 | N/A — no outbound HTTP calls in this file |
| COV-003 | PASS — catch block calls `span.recordException(...)` and `span.setStatus({ code: SpanStatusCode.ERROR })` |
| COV-004 | PASS — `promptInteractive` is async with `await promise`; covered by the entry-point span |
| COV-005 | PASS — `taze.package.deps_count` (`pkgs.length`) captured |
| COV-006 | N/A — no auto-instrumentation library covers this |
| RST-001 | PASS — `flatDeps`, `sortDeps`, `createListRenderer`, `createVersionSelectRender`, `registerInput` are unexported helpers, correctly not instrumented |
| RST-002 | PASS — no accessor spans |
| RST-003 | PASS — no thin wrapper spans |
| RST-004 | PASS — inner functions are unexported with no I/O; correctly excluded |
| RST-005 | PASS — no pre-existing instrumentation |
| SCH-001 | PASS — `taze.check.interactive` declared in `agent-extensions.yaml` |
| SCH-002 | PASS — `taze.package.deps_count` is a registered attribute key |
| SCH-003 | PASS — `span.setAttribute('taze.package.deps_count', pkgs.length)`; `pkgs.length` is `number` (int); schema declares `type: int`. No `String()` cast (correct) |
| SCH-004 | PASS — `taze.package.deps_count` is the closest registered key for package count in this context |
| CDQ-001 | PASS (static) — `span.end()` in `finally` block. Runtime advisory: `process.exit()` from nested callbacks (`onKey` case `'q'`/`'escape'`, `registerInput` ctrl+c path) bypasses `finally` during `await promise`, causing span leak. Documented known limitation; cannot be fixed without NDS-003 violations. |
| CDQ-002 | PASS — `trace.getTracer('taze')` matches project name |
| CDQ-003 | PASS — `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })` in catch |
| CDQ-005 | PASS — `startActiveSpan` callback pattern |
| CDQ-006 | PASS — `span.setAttribute('taze.package.deps_count', pkgs.length)` set before the try block, before any await; O(1) Array.length access. IMPROVEMENT from run-15 |
| CDQ-007 | PASS — `pkgs.length` is a simple integer count; no PII, no unbounded value |

**Failures**: None. CDQ-006 IMPROVEMENT vs run-15. CDQ-001 runtime advisory noted (span leaks on `process.exit()` paths) but is a known structural limitation.

---

### 4. src/config.ts (1 span)

**Span**: `taze.config.resolve`
**vs run-15**: SAME — 1 span in both run-15 and run-16; `taze.config.sources_found` attribute present in both; no regression or improvement
**Attempts**: 1
**Trace supplement**: `taze.config.resolve` span found in Datadog. `taze.config.sources_found: 1` confirms the attribute was captured at runtime with a non-zero integer value.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `resolveConfig` (exported async) instrumented |
| COV-002 | N/A — no outbound HTTP/DB calls; `loader.load()` is an internal library call |
| COV-003 | PASS — `recordException` + `setStatus(ERROR)` in catch block |
| COV-004 | PASS — `resolveConfig` is async with `await loader.load()` |
| COV-005 | PASS — `taze.config.sources_found` captured via `config.sources.length` |
| COV-006 | N/A — no auto-instrumentation library covers `unconfig` config file loading |
| RST-001 | PASS — `normalizeConfig` (synchronous, unexported pure transform) correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS — `normalizeConfig` is unexported with no I/O; correctly excluded |
| RST-005 | PASS |
| SCH-001 | PASS — `taze.config.resolve` registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `taze.config.sources_found` matches registered attribute key |
| SCH-003 | PASS — `config.sources.length` is an integer; schema declares `type: int` |
| SCH-004 | PASS — no unregistered attribute keys used |
| CDQ-001 | PASS — span closed in `finally` block via `span.end()` |
| CDQ-002 | PASS — `trace.getTracer('taze')` matches package name |
| CDQ-003 | PASS — `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })` |
| CDQ-005 | PASS — `startActiveSpan` callback pattern |
| CDQ-006 | PASS — `config.sources.length` is a simple Array property access (O(1)); the rubric's exemption for trivial property access chains covers this; no `isRecording()` guard required |
| CDQ-007 | PASS — `sources.length` is a bounded integer count; no PII, no unbounded value |

**Failures**: None

---

### 5. src/io/bunWorkspaces.ts (3 spans)

**Spans**: `taze.package.load_bun_workspace`, `taze.write.bun_workspace`, `taze.write.bun_json`
**vs run-15**: Span count unchanged (3). Namespace restructured: `taze.io.*` → `taze.package.*`/`taze.write.*`. Attribute `taze.io.catalogs_found` (string, SCH-003 FAIL in run-15) replaced by `taze.catalog.count` (schema declares int, but code passes `String(catalogs.length)` — SCH-003 persists). CDQ-006 regressed: run-15 had 1 violation (writeBunWorkspace Object.keys without guard); run-16 has 3 new violations in loadBunWorkspace (all post-await setAttribute calls unguarded), net regression of +2. writeBunWorkspace CDQ-006 fixed correctly with `isRecording` guard.
**Attempts**: 2
**Trace supplement**: No bun workspace spans appear in Datadog — taze repository uses pnpm, not bun; no `bun.lockb` present, so `loadBunWorkspace` and `writeBunWorkspace` are never invoked during IS scoring.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — `return writeFile(...)` without await preserved per original source; no business logic modified |
| API-001 | PASS — only `@opentelemetry/api` imported |
| NDS-006 | PASS — ESM imports match project module system |
| NDS-004 | PASS — all three function signatures unchanged |
| NDS-005 | PASS — writeBunJSON inner `catch {}` is pre-existing graceful degradation (NDS-007); no recordException added |
| COV-001 | PASS — all exported async functions have entry spans |
| COV-002 | N/A — no outbound HTTP calls |
| COV-003 | PASS — all 3 spans have `recordException` + `setStatus(ERROR)` in catch blocks |
| COV-004 | PASS — all async functions with await I/O are spanned |
| COV-005 | PASS — loadBunWorkspace: taze.write.file_path, taze.write.package_type, taze.catalog.count; writeBunWorkspace: taze.package.name, taze.write.file_path, taze.write.package_type, taze.write.changes_count; writeBunJSON: taze.write.file_path |
| COV-006 | N/A — no auto-instrumentation library covers bun workspace I/O |
| RST-001 | PASS — no spans on synchronous utility functions |
| RST-002 | PASS — no spans on accessors |
| RST-003 | PASS — no thin wrapper spans |
| RST-004 | PASS — `writeBunJSON` is unexported but performs file I/O; RST-004 exempts unexported functions with I/O |
| RST-005 | PASS — no pre-existing instrumentation |
| SCH-001 | PASS — all 3 span names registered: taze.package.load_bun_workspace, taze.write.bun_workspace, taze.write.bun_json |
| SCH-002 | PASS — all attribute keys registered |
| SCH-003 | **FAIL** — `taze.catalog.count` registered as `type: int`; code passes `String(catalogs.length)` — string value on int attribute. Same class of error as run-15's `taze.io.catalogs_found`; the attribute was correctly renamed and re-typed in schema but the `String()` cast was not removed from the call site |
| SCH-004 | PASS — no near-synonym redundancy detected; taze.catalog.count is distinct from taze.config.sources_found |
| CDQ-001 | PASS — all 3 spans use `startActiveSpan` with `span.end()` in `finally` blocks; `return writeFile(...)` without await is preserved per NDS-003 |
| CDQ-002 | PASS — `trace.getTracer('taze')` matches project name |
| CDQ-003 | PASS — all catch blocks use `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })`; inner `catch {}` in writeBunJSON is pre-existing NDS-007 |
| CDQ-005 | PASS — `startActiveSpan` callback pattern throughout |
| CDQ-006 | **FAIL** — 3 unguarded `setAttribute` calls in `loadBunWorkspace`, all placed after `await readFile(...)`: `taze.write.file_path`, `taze.write.package_type`, and `taze.catalog.count`. None wrapped in `if (span.isRecording())`. writeBunWorkspace `taze.write.changes_count` is correctly guarded. Net regression vs run-15: +2 violations |
| CDQ-007 | PASS with advisory — `taze.write.file_path` in `writeBunJSON` uses absolute `filepath` (no relative path in scope for that function); noted as known limitation. Cardinality bounded by project file count |

**Failures**:
- SCH-003 — `String(catalogs.length)` passes string for `taze.catalog.count` (int schema). Fix: remove `String()` cast.
- CDQ-006 — 3 post-await `setAttribute` calls in `loadBunWorkspace` without `isRecording()` guard: `taze.write.file_path`, `taze.write.package_type`, `taze.catalog.count`. Regression vs run-15.
- CDQ-007 — `taze.write.file_path` in `writeBunJSON` uses absolute `filepath`; noted limitation.

---

### 6. src/io/packageJson.ts (2 spans)

**Spans**: `taze.package.load_package_json`, `taze.write.package_json`
**vs run-15**: Span names changed from `taze.io.load_package_json` / `taze.io.write_package_json` to `taze.package.load_package_json` / `taze.write.package_json`. New attribute `taze.package.file_path` added in `loadPackageJSON` (genuine coverage improvement). All other COV-005 attributes carried forward. Run-15 all PASS — run-16 maintains all PASS.
**Attempts**: 2
**Trace supplement**: `taze.package.load_package_json` confirmed in Datadog — 2 spans from IS scoring session (`service.instance.id: 67a9f910-a470-4d18-af74-442a7cc00834`). Attributes captured: `taze.package.file_path: "package.json"` (relative path, CDQ-007 compliant) and `taze.package.deps_count: 35` (integer). `taze.write.package_json` produced no spans — expected, since `taze major --dry-run` does not execute the write path.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — only instrumentation additions; no business logic changed |
| API-001 | PASS — only `@opentelemetry/api` imported |
| NDS-006 | PASS — ESM imports match project module system |
| NDS-004 | PASS — both exported function signatures unchanged |
| NDS-005 | PASS — no pre-existing error handling restructured |
| COV-001 | PASS — both exported async functions (`loadPackageJSON`, `writePackageJSON`) have spans |
| COV-002 | N/A — no outbound HTTP/database calls; readJSON/writeJSON are internal filesystem helpers |
| COV-003 | PASS — both spans have `recordException` + `setStatus(ERROR)` in catch blocks |
| COV-004 | PASS — both functions are async with await expressions; both spanned |
| COV-005 | PASS — `loadPackageJSON`: taze.package.file_path (relative path), taze.package.deps_count (dep count); `writePackageJSON`: taze.write.file_path, taze.write.package_type, taze.cache.changed |
| COV-006 | N/A — no auto-instrumentation covers package.json file I/O |
| RST-001 | PASS — `isDepFieldEnabled` (synchronous, unexported, no I/O) correctly not instrumented |
| RST-002 | PASS — no accessor spans |
| RST-003 | PASS — neither function is a thin wrapper |
| RST-004 | PASS — only exported functions spanned; `isDepFieldEnabled` is unexported and synchronous |
| RST-005 | PASS — no pre-existing instrumentation |
| SCH-001 | PASS — both span names registered: taze.package.load_package_json, taze.write.package_json |
| SCH-002 | PASS — all keys registered: taze.package.file_path (NEW), taze.package.deps_count, taze.write.file_path, taze.write.package_type, taze.cache.changed |
| SCH-003 | PASS — all types match schema: taze.package.file_path (string), taze.package.deps_count (`deps.length` int ✓), taze.write.file_path (string), taze.write.package_type (string literal), taze.cache.changed (boolean) |
| SCH-004 | PASS — taze.package.file_path is a new key with no close semantic neighbors; taze.write.file_path is write-scoped; read-scoped variant correctly introduced |
| CDQ-001 | PASS — both spans use `startActiveSpan` with `span.end()` in `finally` blocks |
| CDQ-002 | PASS — `trace.getTracer('taze')` matches project name |
| CDQ-003 | PASS — both catch blocks use `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })` |
| CDQ-005 | PASS — `startActiveSpan` callback pattern; context propagation automatic |
| CDQ-006 | PASS — `taze.package.file_path` set to `relative` (O(1) parameter); `taze.package.deps_count` set to `deps.length` (O(1), exempt); `taze.write.file_path` to `pkg.relative` (O(1)); `taze.cache.changed` is boolean. No guards required |
| CDQ-007 | PASS — `taze.package.file_path` uses `relative` parameter (CDQ-007 compliant); `taze.write.file_path` uses `pkg.relative` (CDQ-007 compliant); no PII fields, no unbounded values |

**Failures**: None

---

### 7. src/io/packageYaml.ts (4 spans)

**Spans**: `taze.package.read_yaml`, `taze.write.yaml`, `taze.package.load_package_yaml`, `taze.write.package_yaml`
**vs run-15**: Span namespaces changed — run-15 used `taze.io.*` for all four; run-16 splits into `taze.package.*` (read/load) and `taze.write.*` (write). Attribute set changed: run-15 used `taze.package.name` and `taze.check.packages_total`; run-16 uses `taze.package.file_path`, `taze.package.deps_count`, `taze.write.file_path`, `taze.write.package_type`, `taze.cache.changed`. All attributes already registered. No regressions from run-15.
**Attempts**: 1
**Trace supplement**: `taze major` uses package.json only — no package.yaml files in the test project. None of the four spans appear in Datadog traces for this IS scoring run. All evaluation is static analysis only.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — `return fs.writeFile(...)` without `await` preserved per original source; no business logic modified |
| API-001 | PASS — only `@opentelemetry/api` imported |
| NDS-006 | PASS — ESM imports match project module system |
| NDS-004 | PASS — all four exported function signatures unchanged |
| NDS-005 | PASS — `writeYAML` `.catch(Object.create)` is pre-existing graceful fallback (NDS-007); no recordException added; no pre-existing try/catch restructured |
| COV-001 | PASS — all four exported async functions have spans; `isDepFieldEnabled` (synchronous, unexported, no I/O) correctly excluded |
| COV-002 | N/A — no outbound HTTP/database calls |
| COV-003 | PASS — all four spans have `recordException` + `setStatus(ERROR)` in catch blocks; `.catch(Object.create)` on formatting helper receives no recordException per NDS-007 |
| COV-004 | PASS — all four async functions with `await` and `fs.*` I/O have spans |
| COV-005 | PASS — `readYAML`: taze.package.file_path; `writeYAML`: taze.write.file_path; `loadPackageYAML`: taze.package.file_path, taze.package.deps_count; `writePackageYAML`: taze.write.file_path, taze.write.package_type, taze.cache.changed |
| COV-006 | N/A — no auto-instrumentation covers YAML file I/O |
| RST-001 | PASS — `isDepFieldEnabled` (synchronous, unexported, no I/O) correctly not instrumented |
| RST-002 | PASS — no accessor spans |
| RST-003 | PASS — no thin wrapper spans |
| RST-004 | PASS — all four instrumented functions are exported; `isDepFieldEnabled` is unexported with no I/O |
| RST-005 | PASS — no pre-existing instrumentation |
| SCH-001 | PASS — all 4 span names registered: taze.package.read_yaml, taze.write.yaml, taze.package.load_package_yaml, taze.write.package_yaml |
| SCH-002 | PASS — all attribute keys registered: taze.package.file_path, taze.package.deps_count, taze.write.file_path, taze.write.package_type, taze.cache.changed |
| SCH-003 | PASS — all types match: taze.package.file_path (string), taze.package.deps_count (`deps.length` int ✓), taze.write.file_path (string), taze.write.package_type (string literal), taze.cache.changed (boolean) |
| SCH-004 | PASS — no unregistered attributes; no near-synonym redundancy |
| CDQ-001 | PASS — all four spans use `startActiveSpan` with `span.end()` in `finally` blocks; `return fs.writeFile(...)` without await in `writeYAML` is NDS-003 preserved; span closes synchronously in finally before the returned promise resolves |
| CDQ-002 | PASS — `trace.getTracer('taze')` matches project name |
| CDQ-003 | PASS — all catch blocks use `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })`; `.catch(Object.create)` is pre-existing NDS-007 graceful fallback |
| CDQ-005 | PASS — `startActiveSpan` callback pattern throughout |
| CDQ-006 | PASS — `taze.package.deps_count` set to `deps.length` (O(1), exempt); `taze.cache.changed` is a boolean variable; no `.map`, `.reduce`, `.join`, or `JSON.stringify` in setAttribute values |
| CDQ-007 | PASS with advisory — `readYAML` and `writeYAML` set `taze.package.file_path`/`taze.write.file_path` to absolute `filepath` (only value available in those functions' scope); `loadPackageYAML` correctly uses `relative` parameter. Cardinality bounded by project file count; no PII patterns |

**Failures**: None

---

### 8. src/io/packages.ts (5 spans)

**Spans**: `taze.io.read_json`, `taze.io.write_json`, `taze.io.write_package`, `taze.io.load_package`, `taze.io.load_packages`
**vs run-15**: Identical — same 5 spans, same span names in `taze.io.*` namespace, same attributes. No new schema attributes added. Run-15 all PASS (RST-003 advisory on readJSON); run-16 same.
**Attempts**: 2
**Trace supplement**: `taze.io.load_packages` confirmed in Datadog (trace `8da5f878d3b46c7deefd4b615b6484cc`, 2026-06-21T22:56:12Z). Attributes captured: `taze.check.recursive: "false"`, `taze.config.sources_found: 5`. Both attributes present with correct values — confirming instrumentation ran correctly.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — template literal `\n` fix in attempt 2; no business logic changed |
| API-001 | PASS — only `@opentelemetry/api` imported |
| NDS-006 | PASS — ESM imports match project `"type": "module"` |
| NDS-004 | PASS — all 5 exported function signatures unchanged |
| NDS-005 | PASS — inner `catch {}` in `loadPackage` (graceful fallback to normal loadPackageJSON) is pre-existing; agent preserved it without adding `recordException` |
| COV-001 | PASS — all 5 exported async functions have spans |
| COV-002 | N/A — no outbound HTTP/network calls |
| COV-003 | PASS — all 5 spans have `recordException` + `setStatus(ERROR)` in catch blocks |
| COV-004 | PASS — all async functions with `await` are spanned |
| COV-005 | PASS — `readJSON`: taze.package.file_path; `writeJSON`: taze.write.file_path; `writePackage`: taze.write.package_type, taze.write.file_path; `loadPackage`: taze.package.file_path; `loadPackages`: taze.check.recursive, taze.config.sources_found |
| COV-006 | N/A — no auto-instrumentation library covers `fs.*` I/O in this project |
| RST-001 | PASS — no spans on synchronous utility functions |
| RST-002 | PASS — no spans on accessors |
| RST-003 | Advisory — `readJSON` is a thin exported async wrapper (`JSON.parse(await fs.readFile(...))`) triggering RST-003. Same advisory as run-15; observability value (file path, error surfacing) defensible. Not a canonical FAIL |
| RST-004 | PASS — all 5 instrumented functions are exported |
| RST-005 | PASS — no pre-existing instrumentation |
| SCH-001 | PASS — all 5 span names registered: taze.io.read_json, taze.io.write_json, taze.io.write_package, taze.io.load_package, taze.io.load_packages |
| SCH-002 | PASS — all attribute keys registered |
| SCH-003 | PASS — all types match schema: taze.package.file_path (string), taze.write.file_path (string), taze.write.package_type (string), taze.check.recursive (boolean), taze.config.sources_found (integer; `packages.length` is int) |
| SCH-004 | PASS — no agent-added attributes outside registry; no near-duplicate keys |
| CDQ-001 | PASS — all 5 spans use `startActiveSpan` with `span.end()` in `finally` blocks |
| CDQ-002 | PASS — `trace.getTracer('taze')` matches project identity |
| CDQ-003 | PASS — all catch blocks use `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })`; inner `catch {}` in `loadPackage` is pre-existing NDS-007 pattern |
| CDQ-005 | PASS — `startActiveSpan` callback pattern; context propagation automatic |
| CDQ-006 | PASS — `taze.config.sources_found` set to `packages.length` (O(1), exempt); no `JSON.stringify`, `.map`, `.reduce`, or non-trivial computation in setAttribute calls |
| CDQ-007 | PASS with advisory — `readJSON`, `writeJSON`, `writePackage` set absolute `filepath` values (only values available in those functions' scope); `loadPackage` correctly uses `relative` parameter; `basename` from pathe not already imported, so raw filepath values are the correct constrained choice. Cardinality bounded by project file count |

**Failures**: None. RST-003 advisory on `readJSON` (thin wrapper — consistent with run-15; observability value defensible).

---

<!-- FILES 9-13 PENDING -->
