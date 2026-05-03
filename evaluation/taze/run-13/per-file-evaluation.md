# Per-File Evaluation — taze Run-13

**Date**: 2026-05-03
**Branch**: spiny-orb/instrument-1777809261652
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 33 (14 committed + 19 correct skips)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `tsc --noEmit` exits 0 on all 14 instrumented files; 0 NDS-001 failures across the run |
| NDS-002 (Tests) | **PASS** | Checkpoint test suite passed on all 14 committed files; live-check OK; 0 rollbacks |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api` in peerDependencies at `>=1.0.0` |
| API-003 | **PASS** | No vendor-specific SDKs (`dd-trace`, `@newrelic/*`, `@splunk/otel`) in dependencies |
| CDQ-011 | **PASS** | All 14 committed files use `trace.getTracer('taze')` consistently; matches `tracerName` in `spiny-orb.yaml` |

---

## Committed Files (14)

### 1. src/api/check.ts (1 span)

**Span**: `taze.check.run`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — ESM imports match project (`"type": "module"` in package.json) |
| NDS-004 | PASS — `CheckPackages` signature unchanged; span added via callback pattern |
| NDS-005 | PASS — no pre-existing try/catch; new try/finally wraps span lifecycle only |
| COV-001 | PASS — `CheckPackages` (exported async entry point) has span |
| COV-002 | N/A — no direct outbound HTTP in this file; delegates to `resolves.ts` |
| COV-003 | PASS — catch block: `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS — `CheckPackages` (exported, async) instrumented; `CheckSingleProject` (unexported) correctly skipped via RST-004 |
| COV-005 | PASS — `taze.check.packages_total`, `taze.check.packages_outdated`, `taze.check.write_mode` captured |
| COV-006 | N/A — no operations covered by known auto-instrumentation libraries in this file |
| RST-001 | PASS |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS — `CheckSingleProject` correctly not instrumented; covered by propagated context |
| RST-005 | PASS |
| SCH-001 | PASS — `taze.check.run` in registry |
| SCH-002 | PASS — all attribute keys in registry |
| SCH-003 | PASS — `packages.length` → int matches `taze.check.packages_total: int`; `options.write` (boolean, guarded by null check) matches `taze.check.write_mode: boolean` |
| SCH-004 | PASS |
| CDQ-001 | PASS — `span.end()` in `finally` block |
| CDQ-002 | PASS — `trace.getTracer('taze')` |
| CDQ-003 | PASS — `error instanceof Error ? error : new Error(String(error))` pattern |
| CDQ-005 | PASS — `startActiveSpan` callback (automatic context management) |
| CDQ-006 | PASS — `packagesOutdated` computed as a pre-assigned variable; value argument to `setAttribute` is a plain variable, not an inline method chain |
| CDQ-007 | PASS — no optional or PII attributes |

**Failures**: None

---

### 2. src/cli.ts (1 span)

**Span**: `taze.cli.run`

Note: run-summary reports 2 spans for this file; source review finds 1 `startActiveSpan` call. The discrepancy may be a run-summary reporting artifact.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — CLI entry point action handler instrumented |
| COV-002 | N/A — no direct outbound HTTP |
| COV-003 | PASS — catch block: `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS — the exported async action callback is instrumented |
| COV-005 | PASS — `taze.check.mode`, `taze.check.recursive`, `taze.check.write_mode` captured |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — `taze.cli.run` in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `options.recursive` (boolean, null-guarded) matches schema type; `options.write` (boolean, null-guarded) matches schema type; `mode` is a CLI-validated string matching enum members |
| SCH-004 | PASS |
| CDQ-001 | PASS (static) / **advisory (runtime)** — `span.end()` is in the `finally` block (static analysis PASS); however, `process.exit(exitCode)` is called inside the try block on the normal success path, bypassing `finally` at runtime. The span is never closed on successful completion. This is the same pattern CodeRabbit flagged in run-5 debug dumps. Fix: call `span.end()` explicitly before `process.exit()`, or return `exitCode` and call `process.exit()` outside the span callback. |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — all `setAttribute` values are simple variable or property references |
| CDQ-007 | PASS |

**Failures**: None. CDQ-001 runtime advisory noted: `process.exit()` on the success path bypasses `finally`, so the span is never closed after a normal run.

---

### 3. src/commands/check/checkGlobal.ts (1 span)

**Span**: `taze.check.global`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — exported `checkGlobal` async entry point has span |
| COV-002 | N/A — delegates HTTP to `packument.ts` |
| COV-003 | PASS — catch: `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS — exported `checkGlobal` instrumented; `loadGlobalPnpmPackage`, `loadGlobalNpmPackage`, `installPkg` (unexported, subprocess I/O) correctly skipped via RST-004; covered by propagated context |
| COV-005 | PASS — `taze.check.mode`, `taze.check.write_mode`, `taze.check.packages_total`, `taze.check.packages_outdated` captured |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — `taze.check.global` in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `!!options.write` (boolean via double-negation) matches `taze.check.write_mode: boolean`; `options.mode` (enum string) matches `taze.check.mode` enum members |
| SCH-004 | PASS |
| CDQ-001 | PASS — `span.end()` in `finally` |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | **FAIL** — `span.setAttribute('taze.check.packages_total', resolvePkgs.reduce((sum, pkg) => sum + pkg.deps.length, 0))` and `span.setAttribute('taze.check.packages_outdated', resolvePkgs.reduce((sum, pkg) => sum + pkg.resolved.filter(j => j.update).length, 0))` use inline `reduce()` and `filter()` method chains inside `setAttribute` without a preceding `span.isRecording()` guard |
| CDQ-007 | PASS |

**Failures**: CDQ-006 — two inline `reduce().filter()` chains inside `setAttribute` without `isRecording()` guard

---

### 4. src/commands/check/index.ts (1 span)

**Span**: `taze.check.execute`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — exported async check command entry point instrumented |
| COV-002 | N/A |
| COV-003 | PASS |
| COV-004 | PASS — exported async orchestrator instrumented |
| COV-005 | PASS — `taze.check.mode`, `taze.check.recursive`, `taze.check.write_mode`, `taze.check.packages_total`, `taze.check.packages_outdated` captured |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — `taze.check.execute` in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `options.recursive ?? false` (boolean) and `options.write ?? false` (boolean) match schema types |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | **FAIL** — `span.setAttribute('taze.check.packages_total', resolvePkgs.reduce((acc, pkg) => acc + pkg.resolved.length, 0))` and `span.setAttribute('taze.check.packages_outdated', resolvePkgs.reduce((acc, pkg) => acc + pkg.resolved.filter(j => j.update).length, 0))` use inline `reduce()` and `filter()` chains without `isRecording()` guard |
| CDQ-007 | PASS |

**Failures**: CDQ-006 — two inline `reduce().filter()` chains inside `setAttribute` without `isRecording()` guard

---

### 5. src/commands/check/interactive.ts (1 span)

**Span**: `taze.check.interactive`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — no pre-existing try/catch; new try/finally wraps span lifecycle |
| COV-001 | PASS — exported `promptInteractive` async function instrumented |
| COV-002 | N/A |
| COV-003 | PASS — catch: `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS — `promptInteractive` (exported, async) instrumented; inner unexported helpers (flatDeps, sortDeps, createListRenderer, registerInput) are synchronous — RST-001 applies |
| COV-005 | PASS — `taze.check.packages_total`, `taze.check.packages_outdated` captured |
| COV-006 | N/A |
| RST-001 | PASS — synchronous inner helpers correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — `taze.check.interactive` in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `pkgs.length` (int) matches `taze.check.packages_total: int`; `checked.size` (int, Set.size) matches `taze.check.packages_outdated: int` |
| SCH-004 | PASS |
| CDQ-001 | PASS — `span.end()` in `finally` block (static analysis); advisory: `process.exit()` calls inside keypress handlers bypass `finally` at runtime, causing span leaks on user-initiated exit paths (`q`, `escape`, Ctrl+C). Agent correctly noted this limitation. |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — `pkgs.length` and `checked.size` are O(1) property accesses; no inline iteration or serialization |
| CDQ-007 | PASS |

**Failures**: None. CDQ-001 runtime advisory noted.

---

### 6. src/config.ts (1 span)

**Span**: `taze.config.resolve`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — exported `resolveConfig` async function instrumented |
| COV-002 | N/A — no direct outbound HTTP; uses `unconfig` loader internally |
| COV-003 | PASS |
| COV-004 | PASS — only exported async function is `resolveConfig`; `normalizeConfig` is synchronous (RST-001) |
| COV-005 | PASS — `taze.config.sources_found` captured |
| COV-006 | N/A |
| RST-001 | PASS — `normalizeConfig` (synchronous) correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — `taze.config.resolve` in registry |
| SCH-002 | PASS — `taze.config.sources_found` in registry (agent-extensions.yaml) |
| SCH-003 | **FAIL** — `span.setAttribute('taze.config.sources_found', config.sources.length)` sets an `int` value (`Array.length` returns number); registry declares `taze.config.sources_found: type: string`. Type mismatch. The schema documentation appears incorrect (the attribute semantically represents a count, not a string); regardless, code does not conform to declared type. |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — `config.sources.length` is O(1) property access |
| CDQ-007 | PASS |

**Failures**: SCH-003 — `taze.config.sources_found` set as int, schema declares string

---

### 7. src/io/bunWorkspaces.ts (2 spans)

**Spans**: `taze.bun.load_workspace`, `taze.bun.write_workspace`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — exported `loadBunWorkspaces` and `writeBunWorkspace` async functions instrumented |
| COV-002 | N/A — no outbound HTTP; file I/O only |
| COV-003 | PASS — catch: `recordException` + `setStatus(ERROR)` on both spans |
| COV-004 | PASS — 2 exported async I/O functions instrumented; `createBunWorkspaceEntry` (unexported, synchronous) correctly skipped; `writeBunJSON` (unexported, async) correctly skipped via RST-004 (I/O covered by parent span context) |
| COV-005 | PASS — `taze.write.file_path`, `taze.check.packages_total`, `taze.write.package_type`, `taze.write.changes_count` captured |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS — `createBunWorkspaceEntry` (synchronous, unexported) and `writeBunJSON` (async, unexported) correctly not instrumented |
| RST-005 | PASS |
| SCH-001 | PASS — `taze.bun.load_workspace`, `taze.bun.write_workspace` in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `'bun-workspace'` matches `taze.write.package_type` enum value `bun-workspace` |
| SCH-004 | PASS |
| CDQ-001 | PASS — `span.end()` in `finally` on both spans |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | **FAIL** — `span.setAttribute('taze.check.packages_total', catalogs.reduce((sum, c) => sum + c.deps.length, 0))` uses inline `reduce()` without `isRecording()` guard; `span.setAttribute('taze.write.changes_count', Object.keys(versions).length)` calls `Object.keys()` (O(n) key iteration) inline without guard |
| CDQ-007 | PASS |

**Failures**: CDQ-006 — inline `reduce()` and `Object.keys()` in `setAttribute` without `isRecording()` guard

---

### 8. src/io/packageJson.ts (2 spans)

**Spans**: `taze.package_json.load`, `taze.package_json.write`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `loadPackageJSON` and `writePackageJSON` (exported async) instrumented |
| COV-002 | N/A — file I/O only via `readJSON` |
| COV-003 | PASS |
| COV-004 | PASS — exported async functions instrumented; `readJSON` (thin wrapper) correctly skipped via RST-003; `isDepFieldEnabled` (synchronous, unexported) correctly skipped via RST-001/RST-004 |
| COV-005 | PASS — `taze.write.file_path`, `taze.check.packages_total`, `taze.write.package_type` captured |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-002 | PASS |
| RST-003 | PASS — `readJSON` correctly not instrumented (thin wrapper) |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — both span names in registry |
| SCH-002 | PASS — all attribute keys in registry; note: `taze.write.file_path` (a write-domain attribute) reused in load span — key is registered and semantically reasonable given no read-specific file path attribute exists |
| SCH-003 | PASS — `String(pkg.type)` on a string discriminant field is identity conversion; result `'package.json'` matches enum value |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — `deps.length` is O(1) property access; no inline method chains |
| CDQ-007 | PASS |

**Failures**: None

---

### 9. src/io/packageYaml.ts (4 spans)

**Spans**: `taze.package_yaml.read`, `taze.package_yaml.write_file`, `taze.package_yaml.load`, `taze.package_yaml.write`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — all 4 exported async I/O functions instrumented |
| COV-002 | N/A — file I/O only |
| COV-003 | PASS — catch blocks on all spans use `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS — 4 exported async functions instrumented; synchronous helpers correctly skipped |
| COV-005 | PASS — `taze.write.file_path`, `taze.check.packages_total`, `taze.write.package_type` captured |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — all 4 span names in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `'package.yaml' as const` correctly prevents TypeScript literal widening inside `startActiveSpan` callback; value matches enum |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — all `setAttribute` values are string literals or simple property accesses |
| CDQ-007 | PASS |

**Failures**: None. Notable: `'package.yaml' as const` type annotation is a correct TypeScript-specific instrumentation pattern to prevent discriminant widening inside async callbacks.

---

### 10. src/io/packages.ts (4 spans)

**Spans**: `taze.io.write_json`, `taze.io.write_package`, `taze.io.load_package`, `taze.io.load_packages`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — 4 of 5 exported async functions instrumented (80%); `readJSON` correctly skipped via RST-003 (thin wrapper) |
| COV-002 | N/A — file I/O only |
| COV-003 | PASS — all spans have `recordException` + `setStatus(ERROR)` in catch |
| COV-004 | PASS — all instrumented functions are exported and async; `readJSON` skipped per RST-003 (single-expression wrapper) |
| COV-005 | PASS — `taze.write.file_path`, `taze.write.package_type`, `taze.check.recursive`, `taze.check.packages_total` captured |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-002 | PASS |
| RST-003 | PASS — `readJSON` (single-expression thin wrapper over `JSON.parse` + `fs.readFile`) correctly not instrumented |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — all 4 span names in registry |
| SCH-002 | PASS — `taze.write.file_path` reused for load path (same note as packageJson.ts: no read-specific path attribute in schema) |
| SCH-003 | PASS — `pkg.type` is a string discriminant field; value is one of the registered `taze.write.package_type` enum members |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — `packages.length` is O(1); no inline method chains in `setAttribute` |
| CDQ-007 | PASS |

**Failures**: None

---

### 11. src/io/pnpmWorkspaces.ts (2 spans)

**Spans**: `taze.pnpm_workspace.load`, `taze.pnpm_workspace.write`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `loadPnpmWorkspace` and `writePnpmWorkspace` (exported async) instrumented |
| COV-002 | N/A |
| COV-003 | PASS |
| COV-004 | PASS — exported async I/O functions instrumented; `createPnpmWorkspaceEntry` (unexported, synchronous) correctly skipped; `writeYaml` (synchronous thin wrapper) correctly skipped via RST-003 |
| COV-005 | PASS — `taze.write.file_path`, `taze.check.packages_total`, `taze.write.package_type`, `taze.write.changes_count` captured |
| COV-006 | N/A |
| RST-001 | PASS — `createPnpmWorkspaceEntry` (sync, unexported) correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS — `writeYaml` (synchronous single-expression delegating wrapper) correctly not instrumented |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — both span names in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `'pnpm-workspace.yaml'` matches enum value; `catalogs.length` (int) matches `taze.check.packages_total: int` |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — agent correctly guards `Object.keys(versions).length` with `if (span.isRecording())` before `setAttribute`; only file in the run to apply this guard explicitly |
| CDQ-007 | PASS |

**Failures**: None. CDQ-006 exemplary: only file to correctly apply `span.isRecording()` guard for an O(n) computation.

---

### 12. src/io/resolves.ts (6 spans)

**Spans**: `taze.io.load_cache`, `taze.io.dump_cache`, `taze.fetch.package_data`, `taze.check.resolve_dependency`, `taze.check.resolve_dependencies`, `taze.check.resolve_package`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — agent added outer try/finally wrappers for span lifecycle; pre-existing graceful-degradation catch in `dumpCache` preserved without modification; pre-existing error-capture pattern in `getPackageData` (catch → `result.error`) preserved |
| COV-001 | PASS — 6 exported async functions instrumented |
| COV-002 | PASS — `getPackageData` (calls `fetchPackage`/`fetchJsrPackageMeta` for outbound HTTP) wrapped in `taze.fetch.package_data` span; outbound call enclosed |
| COV-003 | PASS — catch blocks with `recordException` + `setStatus(ERROR)` on all spans that propagate errors; graceful-degradation catch in `dumpCache` correctly not touched (NDS-005b pass) |
| COV-004 | PASS — 6 of 15 functions (40%) instrumented; remaining 9 are unexported helpers (RST-004) or synchronous utilities (RST-001); coverage ratio justified in agent notes |
| COV-005 | PASS — `taze.package.name`, `taze.package.current_version`, `taze.package.update_available`, `taze.package.latest_version`, `taze.fetch.registry`, `taze.fetch.error`, `taze.cache.hit`, `taze.cache.changed`, `taze.check.packages_total`, `taze.check.mode`, `taze.check.packages_outdated` captured |
| COV-006 | PASS (conditional advisory) — `ofetch` (used via `fetchPackage`/`fetchJsrPackageMeta`) is built on `undici`; `@opentelemetry/instrumentation-undici` would auto-instrument at the network layer if installed. Manual spans here add domain context (package name, registry type) that auto-instrumentation cannot provide. Advisory only; does not block given semantic value added. |
| RST-001 | PASS — `now()`, `ttl()`, `parseAliasedPackage()` (unexported sync helpers) correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — all 6 span names in registry |
| SCH-002 | PASS |
| SCH-003 | **FAIL** — `span.setAttribute('taze.cache.hit', true)` / `span.setAttribute('taze.cache.hit', false)` set boolean values; registry declares `taze.cache.hit: type: string`. `span.setAttribute('taze.cache.changed', cacheChanged)` sets a boolean (`let cacheChanged = false`); registry declares `taze.cache.changed: type: string`. Two instances of boolean-vs-string type mismatch. Schema documentation appears incorrect (both attributes semantically represent booleans); code types are semantically appropriate but do not conform to declared schema types. |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | **FAIL** — `span.setAttribute('taze.check.packages_outdated', result.filter(d => d.update).length)` calls inline `filter()` (array iteration) inside `setAttribute` without `isRecording()` guard |
| CDQ-007 | PASS — `dep.targetVersion` guarded by `if (dep.targetVersion != null)`; `result.error` guarded by `if (result.error != null)`; `raw.name` and `raw.currentVersion` are required non-nullable fields in `RawDep` type |

**Failures**: SCH-003 (2 instances — `taze.cache.hit` and `taze.cache.changed` boolean vs string schema), CDQ-006 (inline `filter()` in `setAttribute`)

---

### 13. src/io/yarnWorkspaces.ts (2 spans)

**Spans**: `taze.yarnrc.load`, `taze.yarnrc.write`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `loadYarnWorkspaces` and `writeYarnWorkspace` (exported async) instrumented |
| COV-002 | N/A |
| COV-003 | PASS |
| COV-004 | PASS — exported async I/O functions instrumented; `createYarnWorkspaceEntry` (unexported, sync) correctly skipped; `writeYaml` (exported sync thin wrapper) correctly skipped via RST-003 |
| COV-005 | PASS — `taze.write.file_path`, `taze.write.package_type`, `taze.write.changes_count` captured |
| COV-006 | N/A |
| RST-001 | PASS — `createYarnWorkspaceEntry` (sync, unexported) correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS — `writeYaml` (synchronous single-expression delegating wrapper) correctly not instrumented |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — both span names in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `'.yarnrc.yml'` matches `taze.write.package_type` enum value |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | **FAIL** — `span.setAttribute('taze.write.changes_count', Object.keys(versions).length)` calls `Object.keys()` (O(n) key iteration) inline inside `setAttribute` without `isRecording()` guard (contrast: pnpmWorkspaces.ts applies the guard correctly) |
| CDQ-007 | PASS |

**Failures**: CDQ-006 — inline `Object.keys()` in `setAttribute` without `isRecording()` guard

---

### 14. src/utils/packument.ts (2 spans)

**Spans**: `taze.fetch.npm_package`, `taze.fetch.jsr_package`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `fetchPackage` and `fetchJsrPackageMeta` (exported async) instrumented |
| COV-002 | PASS — both spans wrap outbound HTTP calls to npm/JSR registries via `ofetch` |
| COV-003 | PASS — catch: `recordException` + `setStatus(ERROR)` on both spans |
| COV-004 | PASS — 2 exported async functions instrumented; `toPackageData` (unexported, sync transform) and `fetchWithUserAgent` (unexported, thin wrapper) correctly skipped via RST-001/RST-003/RST-004 |
| COV-005 | PASS — `taze.package.name`, `taze.fetch.registry` captured on both spans |
| COV-006 | PASS (same conditional advisory as resolves.ts — `ofetch`→`undici` auto-instrumentation overlap; manual spans add domain context not available from auto-instrumentation) |
| RST-001 | PASS — `toPackageData` (synchronous data transform) correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS — `fetchWithUserAgent` (unexported single-expression wrapper over `ofetch`) correctly not instrumented |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — `taze.fetch.npm_package`, `taze.fetch.jsr_package` in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `'npm'` and `'jsr'` match `taze.fetch.registry` enum values; `spec`/`name` are string arguments → string type matches |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — all `setAttribute` values are string literals or simple variable references |
| CDQ-007 | PASS |

**Failures**: None

---

## Correct Skips (19)

All 19 files were correctly identified as uninstrumentable before or during the pre-scan phase. Zero false positives — no file that should have received instrumentation was skipped.

| File | Skip Reason | Rules |
|------|-------------|-------|
| src/addons/index.ts | Pure re-export; no locally defined functions, classes, or async logic | RST-001 |
| src/addons/vscode.ts | Only exported function (`addonVSCode.beforeWrite`) is synchronous; in-memory object transformation, no I/O | RST-001 |
| src/commands/check/render.ts | All exported functions synchronous (`renderChange`, `renderChanges`, `outputErr`, `renderPackages`) | RST-001 |
| src/constants.ts | Constant declarations and type imports only; no functions | RST-001 |
| src/filters/diff-sorter.ts | Only exported function (`diffSorter`) is synchronous | RST-001 |
| src/index.ts | Only exported function (`defineConfig`) is synchronous | RST-001 |
| src/io/dependencies.ts | All exported functions synchronous (`getByPath`, `setByPath`, `parseDependencies`, `parseDependency`, `dumpDependencies`) | RST-001 |
| src/log.ts | All exported functions synchronous (`shouldLog`, `createMultiProgressBar`, `wrapJoin`) | RST-001 |
| src/render.ts | All exported functions synchronous (`visualLength`, `visualPadStart`, etc.) | RST-001 |
| src/types.ts | Type definitions and single const only; no functions | RST-001 |
| src/utils/config.ts | Only exported function (`getPackageMode`) is synchronous | RST-001 |
| src/utils/context.ts | Module-level constant only; no locally defined functions | RST-001 |
| src/utils/dependenciesFilter.ts | All exported functions synchronous (`filterToRegex`, `parseFilter`, `createDependenciesFilter`) | RST-001 |
| src/utils/diff.ts | Constant declarations only (`DiffMap`, `DiffColorMap`); no functions | RST-001 |
| src/utils/package.ts | All exported functions synchronous (`parseYarnPackagePath`, `parsePnpmPackagePath`) | RST-001 |
| src/utils/sha.ts | Only exported function (`getHexHashFromIntegrity`) is synchronous | RST-001 |
| src/utils/sort.ts | All exported functions synchronous (`parseSortOption`, `sortDepChanges`) | RST-001 |
| src/utils/time.ts | All exported functions synchronous (`toDate`, `timeDifference`) | RST-001 |
| src/utils/versions.ts | All exported functions synchronous (`getVersionRangePrefix`, `changeVersionRange`, `getMaxSatisfying`, etc.) | RST-001 |

---

## Quality Failures Summary

| File | Rule | Dimension | Description |
|------|------|-----------|-------------|
| src/config.ts | SCH-003 | Schema Fidelity | `taze.config.sources_found` set as int (`config.sources.length`); schema declares type string |
| src/io/resolves.ts | SCH-003 | Schema Fidelity | `taze.cache.hit` set as boolean; `taze.cache.changed` set as boolean; schema declares both as type string |
| src/io/resolves.ts | CDQ-006 | Code Quality | Inline `filter()` in `setAttribute('taze.check.packages_outdated', result.filter(...).length)` without `isRecording()` guard |
| src/commands/check/checkGlobal.ts | CDQ-006 | Code Quality | Inline `reduce()` and `reduce().filter()` in two `setAttribute` calls without `isRecording()` guard |
| src/commands/check/index.ts | CDQ-006 | Code Quality | Inline `reduce()` and `reduce().filter()` in two `setAttribute` calls without `isRecording()` guard |
| src/io/bunWorkspaces.ts | CDQ-006 | Code Quality | Inline `reduce()` and `Object.keys()` in two `setAttribute` calls without `isRecording()` guard |
| src/io/yarnWorkspaces.ts | CDQ-006 | Code Quality | Inline `Object.keys()` in `setAttribute('taze.write.changes_count', ...)` without `isRecording()` guard |

**Total canonical failures**: 8 across 5 files (3 SCH-003, 5 CDQ-006)

**CDQ-001 runtime advisory (non-canonical)**: `src/cli.ts` — `process.exit(exitCode)` on the normal success path bypasses the `finally` block, so the span is never closed after a successful run. Static analysis PASS (span.end() is in finally); runtime behavior is incorrect. Same issue found in run-5 debug dumps by CodeRabbit CLI.

**Schema documentation note**: The 3 SCH-003 failures stem from type mismatches between code behavior and agent-extensions.yaml declarations. The code uses semantically appropriate types (int for counts, boolean for flags); the schema documentation was recorded with incorrect types. Future schema authoring should declare `taze.config.sources_found: int`, `taze.cache.hit: boolean`, `taze.cache.changed: boolean`.

**CDQ-006 pattern note**: 5 of 14 committed files (36%) have inline iteration or key-enumeration inside `setAttribute` without `isRecording()` guards. `src/io/pnpmWorkspaces.ts` correctly applies the guard — use it as the reference pattern. Fix: extract computation to a variable, or wrap with `if (span.isRecording()) { ... }`.
