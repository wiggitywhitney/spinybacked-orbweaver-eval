# Per-File Evaluation — taze Run-15

**Date**: 2026-06-15
**Branch**: spiny-orb/instrument-1781536294891
**PR**: https://github.com/wiggitywhitney/taze/pull/9
**Rubric**: 29 quality rules + 2 gates
**Files evaluated**: 33 (11 committed with spans + 1 failed + 1 oscillation/0-span + 20 correct pre-scan skips)
**spiny-orb SHA**: 69c76e1

**Primary goals for this run:**
1. CDQ-006: isRecording guard violations drop from run-13's 8 instances (5 files) to 0
2. SCH-003: Schema type fix (TAZE-RUN1-1) confirmed — no type mismatches recur
3. IS RES-001: service.instance.id addition brings IS score above run-13's 60/100

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | 11 committed files all pass tsc; yarnWorkspaces.ts FAILED and was reverted (not committed); resolves.ts committed 0 spans (no code change) |
| NDS-002 (Tests) | **PASS** | Checkpoint tests passed on all committed files; live-check OK; 0 rollbacks reported in log |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api` in peerDependencies at `>=1.0.0` |
| API-003 | **PASS** | No vendor-specific SDKs in dependencies |
| CDQ-011 | **PASS** | All 11 committed files use `trace.getTracer('taze')` consistently; matches `tracerName` in `spiny-orb.yaml` |

---

## Committed Files (11 with spans)

### 1. src/commands/check/checkGlobal.ts (4 spans)

**Spans**: `taze.check.global`, `taze.check.load_global_pnpm`, `taze.check.load_global_npm`, `taze.check.install_pkg`
**vs run-13**: 1 span (`taze.check.global` only) → 4 spans (3 new spans on unexported helpers)
**Attempts**: 2

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — ESM imports match project |
| NDS-004 | PASS — signatures unchanged |
| NDS-005 | PASS — `loadGlobalPnpmPackage` inner try/catch for exec failures preserved per NDS-007 |
| COV-001 | PASS — `checkGlobal` (exported async entry point) has span |
| COV-002 | N/A — no direct outbound HTTP in this file |
| COV-003 | PASS — `recordException` + `setStatus(ERROR)` on all 4 spans |
| COV-004 | PASS — `loadGlobalPnpmPackage`, `loadGlobalNpmPackage`, `installPkg` are async I/O (subprocess exec) → instrumented per COV-004 |
| COV-005 | PASS — `taze.check.mode`, `taze.check.write_mode`, `taze.check.packages_total`, `taze.check.packages_outdated`, `taze.config.sources_found`, `taze.check.packages_total` (npm load), `taze.write.changes_count` captured |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | **PASS** — `loadGlobalPnpmPackage`, `loadGlobalNpmPackage`, `installPkg` are unexported but all perform subprocess execution via `exec()` → exempt per RST-004 I/O exception. This is a change from run-13 where these were not instrumented. Run-15 is more thorough; both approaches are valid. |
| RST-005 | PASS |
| SCH-001 | PASS — all 4 span names in registry (`agent-extensions.yaml`) |
| SCH-002 | PASS — all attribute keys in registry. `taze.config.sources_found` reused in `loadGlobalPnpmPackage` (pnpm paths count) — semantic stretch from original "config source files" intent, but not a SCH-002 violation. |
| SCH-003 | PASS — `!!options.write` (boolean), `options.mode` (string), `pkgMetas.length` (int → `taze.config.sources_found` now int), `deps.length` (int). All types match schema. |
| SCH-004 | PASS |
| CDQ-001 | PASS — `span.end()` in `finally` on all 4 spans |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS — `startActiveSpan` callback throughout |
| CDQ-006 | **FAIL** — `span.setAttribute('taze.check.packages_total', pkgs.reduce((sum, p) => sum + p.deps.length, 0))` and `span.setAttribute('taze.check.packages_outdated', pkgs.reduce((sum, p) => sum + p.resolved.filter(j => j.update).length, 0))` in `checkGlobal` use inline `reduce()` and `reduce().filter()` chains inside `setAttribute` without a preceding `if (span.isRecording())` guard. **Note**: The agent claim that "CDQ-006 guards are exempted for COV-001 entry point spans" is incorrect — no such exemption exists in the rubric. Carry-forward from run-13; #728/#933 fix not applied here. |
| CDQ-007 | PASS |

**Failures**: CDQ-006 — 2 inline reduce/filter chains in `checkGlobal` span without isRecording guard (carry-forward from run-13)

---

### 2. src/commands/check/index.ts (1 span)

**Span**: `taze.check.run`
**vs run-13**: `taze.check.execute` (1 span, CDQ-006 FAIL) → `taze.check.run` (1 span, CDQ-006 PASS)
**Note**: span name changed from run-13 (`taze.check.execute` → `taze.check.run`). Run-13 span name not preserved in run-15 schema.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `check` (exported async entry point) has span |
| COV-002 | N/A |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS — `taze.check.mode`, `taze.check.recursive`, `taze.check.write_mode`, `taze.check.packages_total`, `taze.check.packages_outdated` captured |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — `taze.check.run` in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `!!options.recursive` (boolean), `!!options.write` (boolean), `resolvePkgs.reduce(...)` called only inside `isRecording()` guard |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | **PASS ✓ IMPROVEMENT** — `if (span.isRecording()) { span.setAttribute('taze.check.packages_total', resolvePkgs.reduce(...)); span.setAttribute('taze.check.packages_outdated', resolvePkgs.reduce(...filter...)); }` correctly guards the two O(n) reduce/filter computations. This file was CDQ-006 FAIL in run-13; the #728/#933 isRecording guard fix was correctly applied here. |
| CDQ-007 | PASS |

**Failures**: None. CDQ-006 IMPROVEMENT vs run-13.

---

### 3. src/commands/check/interactive.ts (1 span)

**Span**: `taze.check.interactive`
**vs run-13**: `taze.check.interactive` (1 span, CDQ-006 PASS with `pkgs.length`) → `taze.check.interactive` (1 span, CDQ-006 FAIL with `flatDeps().length`)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `promptInteractive` (exported async entry point) has span |
| COV-002 | N/A |
| COV-003 | PASS — catch block: `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS |
| COV-005 | PASS — `taze.check.packages_total` captured. Advisory: run-13 also captured `taze.check.packages_outdated` (`checked.size`); run-15 drops it. The absence is a minor coverage reduction but not a COV-005 failure. |
| COV-006 | N/A |
| RST-001 | PASS — `flatDeps`, `sortDeps`, `createListRenderer`, `createVersionSelectRender`, `registerInput` correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — `taze.check.interactive` in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `flatDeps().length` is an int; `taze.check.packages_total` is type int |
| SCH-004 | PASS |
| CDQ-001 | PASS (static) — `span.end()` in `finally`. Runtime advisory unchanged from run-13: `process.exit()` via keypress handlers bypasses `finally`. |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | **FAIL (NEW VIOLATION)** — `span.setAttribute('taze.check.packages_total', flatDeps().length)` calls `flatDeps()` without a preceding `if (span.isRecording())` guard. `flatDeps()` is defined as `return pkgs.flatMap(pkg => pkg.resolved.filter(dep => dep.update))` — it performs `flatMap` and `filter` array iteration. In run-13, this attribute was set with `pkgs.length` (O(1) Array.length, CDQ-006 PASS). The run-15 agent changed to `flatDeps().length`, introducing a CDQ-006 violation where none existed before. |
| CDQ-007 | PASS |

**Failures**: CDQ-006 — `flatDeps()` called inside `setAttribute` without isRecording guard (new violation vs run-13)

---

### 4. src/config.ts (1 span)

**Span**: `taze.config.resolve`
**vs run-13**: `taze.config.resolve` (1 span, SCH-003 FAIL: sources_found int vs string schema) → `taze.config.resolve` (1 span, SCH-003 PASS)
**Note**: The log reports "1 span, 0 attributes" — the "0" refers to 0 NEW attribute key extensions added to agent-extensions.yaml. The `taze.config.sources_found` attribute IS still set via `setAttribute` call in the code; it was already registered in the schema (from the TAZE-RUN1-1 fix). The concern in spiny-orb-findings.md that "config.ts lost an attribute" is incorrect — the attribute was retained; only the schema-extension count changed.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `resolveConfig` (exported async) instrumented |
| COV-002 | N/A |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS — `taze.config.sources_found` captured |
| COV-006 | N/A |
| RST-001 | PASS — `normalizeConfig` (synchronous) correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — `taze.config.resolve` in registry |
| SCH-002 | PASS |
| SCH-003 | **PASS ✓ IMPROVEMENT** — `span.setAttribute('taze.config.sources_found', config.sources.length)` sets int; schema now declares `taze.config.sources_found: type: int` (TAZE-RUN1-1 fix confirmed active). Type mismatch from run-13 resolved. |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — `config.sources.length` is O(1) Array.length property access |
| CDQ-007 | PASS |

**Failures**: None. SCH-003 IMPROVEMENT vs run-13.

---

### 5. src/io/bunWorkspaces.ts (3 spans)

**Spans**: `taze.io.load_bun_workspace`, `taze.io.write_bun_workspace`, `taze.io.write_bun_json`
**vs run-13**: `taze.bun.load_workspace`, `taze.bun.write_workspace` (2 spans, CDQ-006 FAIL) → 3 spans (new span: `taze.io.write_bun_json`; CDQ-006 FAIL persists; new SCH-003 FAIL)
**Note**: Span naming convention changed (`taze.bun.*` → `taze.io.*`); run-13 span names not preserved in run-15 schema.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — inner empty catch block in `writeBunJSON` (graceful indentation fallback) preserved without modification per NDS-007 |
| COV-001 | PASS — `loadBunWorkspaces` and `writeBunWorkspace` (exported async) instrumented |
| COV-002 | N/A |
| COV-003 | PASS — `recordException` + `setStatus(ERROR)` on all 3 spans |
| COV-004 | PASS — `writeBunJSON` (unexported async, file I/O) added as third span; RST-004 exempt per I/O exception |
| COV-005 | PASS — `taze.write.file_path`, `taze.write.package_type`, `taze.io.catalogs_found`, `taze.write.changes_count` captured |
| COV-006 | N/A |
| RST-001 | PASS — `createBunWorkspaceEntry` (synchronous) correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS — `writeBunJSON` (unexported, file I/O) instrumented per RST-004 exception |
| RST-005 | PASS |
| SCH-001 | PASS — all 3 span names in registry |
| SCH-002 | PASS |
| SCH-003 | **FAIL (NEW)** — `span.setAttribute('taze.io.catalogs_found', catalogs.length)` passes an `int` value (`Array.length` returns number); `taze.io.catalogs_found` in `agent-extensions.yaml` declares `type: string`. Type mismatch. The attribute was introduced by this run (auto-generated with string type even though the intent is a count). pnpmWorkspaces.ts correctly passes `String(catalogs.length)` to match the schema type. bunWorkspaces.ts does not apply the conversion. |
| SCH-004 | PASS |
| CDQ-001 | PASS — `span.end()` in `finally` on all 3 spans |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | **FAIL (carry-forward)** — `span.setAttribute('taze.write.changes_count', Object.keys(versions).length)` at line 87 passes `Object.keys(versions).length` (O(n) key enumeration) inline inside `setAttribute` without a preceding `if (span.isRecording())` guard. Same pattern as run-13; #728/#933 fix not applied here. Note: `catalogs.length` at line 62 is O(1) Array.length, not a CDQ-006 violation. |
| CDQ-007 | PASS |

**Failures**: SCH-003 (new: `taze.io.catalogs_found` set as int, schema declares string), CDQ-006 (carry-forward: `Object.keys().length` without isRecording guard)

---

### 6. src/io/packageJson.ts (2 spans)

**Spans**: `taze.io.load_package_json`, `taze.io.write_package_json`
**vs run-13**: `taze.package_json.load`, `taze.package_json.write` (2 spans, all PASS) → 2 spans, all PASS
**Note**: Span naming convention changed; run-13 span names not preserved.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `loadPackageJSON` and `writePackageJSON` (exported async) instrumented |
| COV-002 | N/A |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS — `taze.write.file_path`, `taze.check.packages_total`, `taze.write.package_type`, `taze.cache.changed` captured |
| COV-006 | N/A |
| RST-001 | PASS — `isDepFieldEnabled` (sync) correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS — `readJSON` (thin wrapper) correctly not instrumented in this file |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — both span names in registry |
| SCH-002 | PASS |
| SCH-003 | **PASS ✓ IMPROVEMENT** — `span.setAttribute('taze.cache.changed', changed)` sets boolean; schema now declares `taze.cache.changed: type: boolean` (TAZE-RUN1-1 fix confirmed active). `'package.json' as const` preserves literal discriminant type. |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — `deps.length` (O(1)) and `changed` (boolean variable) are simple accesses |
| CDQ-007 | PASS |

**Failures**: None. SCH-003 IMPROVEMENT (taze.cache.changed type fix confirmed).

---

### 7. src/io/packageYaml.ts (4 spans)

**Spans**: `taze.io.read_yaml`, `taze.io.write_yaml`, `taze.io.load_package_yaml`, `taze.io.write_package_yaml`
**vs run-13**: `taze.package_yaml.read`, `taze.package_yaml.write_file`, `taze.package_yaml.load`, `taze.package_yaml.write` (4 spans, all PASS) → 4 spans, all PASS
**Attempts**: 2
**Note**: Span naming convention changed; run-13 span names not preserved.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — all 4 exported async I/O functions instrumented |
| COV-002 | N/A |
| COV-003 | PASS — `recordException` + `setStatus(ERROR)` on all spans |
| COV-004 | PASS |
| COV-005 | PASS — `taze.write.file_path`, `taze.write.package_type`, `taze.package.name`, `taze.check.packages_total`, `taze.cache.changed` captured |
| COV-006 | N/A |
| RST-001 | PASS — `isDepFieldEnabled` (sync) correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — all 4 span names in registry |
| SCH-002 | PASS |
| SCH-003 | **PASS ✓ IMPROVEMENT** — `span.setAttribute('taze.cache.changed', changed)` sets boolean; schema now declares `taze.cache.changed: type: boolean`. `'package.yaml' as const` preserves discriminant literal type inside async callback. |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — `deps.length` (O(1)), `changed` (boolean variable), string literal attribute values — no O(n) computations inside setAttribute |
| CDQ-007 | PASS |

**Failures**: None. SCH-003 IMPROVEMENT (taze.cache.changed type fix confirmed).

---

### 8. src/io/packages.ts (5 spans)

**Spans**: `taze.io.read_json`, `taze.io.write_json`, `taze.io.write_package`, `taze.io.load_package`, `taze.io.load_packages`
**vs run-13**: 4 spans without `readJSON` (RST-003 PASS: `readJSON` correctly not instrumented) → 5 spans including new span on `readJSON`
**Note**: Span naming convention changed; run-13 span names not preserved.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — inner catch block in `loadPackage` (JSON parse fallback) preserved without modification per NDS-007 |
| COV-001 | PASS — all 5 exported async functions instrumented (including readJSON) |
| COV-002 | N/A |
| COV-003 | PASS — `recordException` + `setStatus(ERROR)` on all spans; inner catch in loadPackage not touched |
| COV-004 | PASS |
| COV-005 | PASS — `taze.write.file_path`, `taze.write.package_type`, `taze.check.recursive`, `taze.config.sources_found` captured |
| COV-006 | N/A |
| RST-001 | PASS — synchronous helpers correctly not instrumented |
| RST-002 | PASS |
| RST-003 | **Advisory** — `readJSON` is a single-expression async function (`JSON.parse(await fs.readFile(filepath, 'utf-8'))`) that run-13 correctly skipped as a thin wrapper (RST-003 PASS). Run-15 instruments it. The instrumentation adds `taze.write.file_path` and error recording — it has observability value (which file was read, errors surfaced). Not a canonical failure since `fs.readFile` has no own span, but inconsistent with run-13's more conservative interpretation. |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — all 5 span names in registry |
| SCH-002 | PASS — `taze.write.file_path` reused for read path (no read-specific key in registry; same pattern as run-13) |
| SCH-003 | PASS — `pkg.type` (string discriminant), `options.recursive ?? false` (boolean), `packages.length` (int for sources_found) all match schema types |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — `packages.length` (O(1)), simple property accesses. No inline iteration in setAttribute. |
| CDQ-007 | PASS |

**Failures**: None canonical. RST-003 advisory noted for readJSON instrumentation (inconsistent with run-13's interpretation, but defensible as exported async I/O).

---

### 9. src/io/pnpmWorkspaces.ts (2 spans)

**Spans**: `taze.io.load_pnpm_workspace`, `taze.io.write_pnpm_workspace`
**vs run-13**: `taze.pnpm_workspace.load`, `taze.pnpm_workspace.write` (2 spans — CDQ-006 PASS, EXEMPLARY: only run-13 file to correctly apply isRecording guard) → 2 spans, CDQ-006 FAIL (REGRESSION: isRecording guard absent)
**Note**: Span naming convention changed; run-13 span names not preserved.

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
| COV-004 | PASS |
| COV-005 | PASS — `taze.write.file_path`, `taze.io.catalogs_found`, `taze.write.changes_count` captured |
| COV-006 | N/A |
| RST-001 | PASS — `createPnpmWorkspaceEntry` (sync) correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS — `writeYaml` (thin wrapper) correctly not instrumented |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — both span names in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `String(catalogs.length)` passed for `taze.io.catalogs_found` (schema declares string) ✓. Unlike bunWorkspaces.ts which passes the raw int. |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | **FAIL (REGRESSION)** — `span.setAttribute('taze.write.changes_count', Object.keys(versions).length)` at line 90 passes `Object.keys(versions).length` (O(n) key enumeration) inside `setAttribute` without a preceding `if (span.isRecording())` guard. **This is a regression from run-13**, where pnpmWorkspaces.ts was the ONLY file to correctly apply the isRecording guard and was used as the reference pattern for CDQ-006 compliance. The run-15 agent dropped the guard despite it being present in the run-13 baseline. Agent notes acknowledge the double-evaluation ("evaluated twice — once for the early-return guard, once for setAttribute") but do not apply isRecording, citing NDS-003. The isRecording guard wrapper does not modify non-instrumentation code; it would not violate NDS-003. |
| CDQ-007 | PASS |

**Failures**: CDQ-006 — `Object.keys().length` without isRecording guard (REGRESSION from run-13's correct implementation)

---

### 10. src/api/check.ts (2 spans)

**Spans**: `taze.check.packages`, `taze.check.single_project`
**vs run-13**: `taze.check.run` (1 span, all PASS) → 2 spans (added span on unexported `CheckSingleProject`)
**Attempts**: 2
**Note**: Span naming convention changed; run-13 span name `taze.check.run` not preserved (used by index.ts in run-15).

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `CheckPackages` (exported async entry point) has span |
| COV-002 | N/A — no direct HTTP in this file; delegates to resolves.ts/packument.ts |
| COV-003 | PASS — `recordException` + `setStatus(ERROR)` on both spans |
| COV-004 | PASS — `CheckSingleProject` (unexported, async, calls `resolvePackage` + `writePackage` which do I/O) → instrumented per COV-004 and RST-004 I/O exception |
| COV-005 | PASS — `taze.check.mode`, `taze.check.recursive`, `taze.check.write_mode`, `taze.check.packages_total`, `taze.package.name`, `taze.write.changes_count` captured |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS — `CheckSingleProject` is unexported but delegates I/O to `resolvePackage` and `writePackage`; exempt per RST-004 I/O exception. |
| RST-005 | PASS |
| SCH-001 | PASS — both span names in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `packages.length` (int), `options.recursive` coerced to boolean, `options.write` coerced to boolean — all match schema types |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — `packages.length` (O(1)), `resolved.filter(i => i.update)` pre-computed into `changes` variable before `setAttribute('taze.write.changes_count', changes.length)`. Filter is done outside setAttribute. ✓ |
| CDQ-007 | PASS |

**Failures**: None.

---

### 11. src/utils/packument.ts (2 spans)

**Spans**: `taze.fetch.package`, `taze.fetch.jsr_package_meta`
**vs run-13**: `taze.fetch.npm_package`, `taze.fetch.jsr_package` (2 spans, all PASS) → 2 spans, all PASS
**Note**: Span naming convention changed; run-13 span names not preserved.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `fetchPackage` and `fetchJsrPackageMeta` (exported async) instrumented |
| COV-002 | PASS — both spans wrap outbound HTTP calls (npm/JSR registry fetches via ofetch) |
| COV-003 | PASS — catch: `recordException` + `setStatus(ERROR)` on both spans |
| COV-004 | PASS |
| COV-005 | PASS — `taze.package.name`, `taze.fetch.registry`, `taze.package.latest_version` captured on both spans |
| COV-006 | PASS (same advisory as run-13 — ofetch→undici auto-instrumentation overlap; manual spans add domain context not available from auto-instrumentation) |
| RST-001 | PASS — `toPackageData` (sync transform), `fetchWithUserAgent` (unexported thin wrapper) correctly not instrumented |
| RST-002 | PASS |
| RST-003 | PASS — `fetchWithUserAgent` (unexported single-expression delegating wrapper) correctly not instrumented |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — both span names in registry |
| SCH-002 | PASS |
| SCH-003 | PASS — `'npm'` / `'jsr'` literals match `taze.fetch.registry` enum values |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS — all setAttribute values are string literals or simple property accesses |
| CDQ-007 | PASS — `meta.latest` guarded by `!= null` |

**Failures**: None.

---

## Special Case: src/io/resolves.ts (0 spans — oscillation)

**vs run-13**: 6 spans (SCH-003 FAIL x2, CDQ-006 FAIL) → 0 spans committed
**Tool classification**: "correct skip" (SUCCESS — 0 spans, 0 attributes, 2 attempts)
**Actual status**: Coverage regression — 6 async functions that were instrumented in run-13 are no longer instrumented

The tool reports SUCCESS because 3 functions (`getVersionOfRange`, `updateTargetVersion`, `getDiff`) were correctly assessed as needing 0 spans, and 6 functions (`loadCache`, `dumpCache`, `getPackageData`, `resolveDependency`, `resolveDependencies`, `resolvePackage`) oscillated on NDS-001 twice each and were skipped. Per the spiny-orb tool's accounting, this counts as a "correct skip."

**Rubric impact**: No instrumentation was produced, so rubric rules are N/A for this file. However:
- COV-001 candidate functions exist (6 exported async functions with I/O)
- COV-002 coverage was provided by this file in run-13 (`getPackageData` wrapping HTTP fetches to packument.ts) — now unverified at the run-13 level
- The 6 oscillating functions represent **unknown coverage** — the agent attempted and failed, not a genuine "needs 0 spans" assessment

**Process findings** (captured in spiny-orb-findings.md):
1. Tool misclassifies oscillation-induced 0-span commits as correct skips
2. Function-level oscillation errors are not logged with the specific tsc message (undiagnosable from artifacts alone)
3. `✅ SUCCESS — 0 spans` is misleading when 6 instrumentation attempts failed

---

## Failed File: src/io/yarnWorkspaces.ts

**vs run-13**: 2 spans (CDQ-006 FAIL) → FAILED after 3 attempts (NDS-001 regex syntax error)
**Error**: `src/io/yarnWorkspaces.ts(91,74): error TS1005: ',' expected.`

Root cause: All 3 attempts produced `/\./ g` (spurious space in regex flag) instead of `/\./g`. The model correctly described the fix in thinking but generated malformed output on every attempt. CDQ-006 guard work (adding isRecording around `Object.keys(versions).length`) was in progress simultaneously, likely contributing to the multi-edit generation error. See `spiny-orb-findings.md` for full deep-dive.

No rubric scoring (file was reverted and not committed).

---

## Pre-Scan Correct Skips (20 files)

All 20 files were correctly identified as uninstrumentable by the pre-scan (0 tokens consumed, no LLM call). All RST-001 per-instance rules PASS.

| File | Skip Reason |
|------|-------------|
| src/addons/index.ts | Pure re-export module |
| src/addons/vscode.ts | Only exported function synchronous |
| src/cli.ts | **Confirmed correct** — all async code is anonymous inline callbacks, no exported async functions. Run-13's 2 spans were incorrect (anonymous action handler is not an exported function per COV-001). Pre-scan improvement between SHA `d13f1a1` (run-13) and `69c76e1` (run-15). |
| src/constants.ts | Constant declarations only |
| src/index.ts | Only exported function synchronous |
| src/io/dependencies.ts | All exported functions synchronous |
| src/types.ts | Type definitions only |
| src/utils/context.ts | Module-level constant only |
| src/utils/dependenciesFilter.ts | All exported functions synchronous |
| src/utils/config.ts | Only exported function synchronous |
| src/utils/diff.ts | Constant declarations only |
| src/filters/diff-sorter.ts | Only exported function synchronous |
| src/render.ts | All exported functions synchronous |
| src/log.ts | All exported functions synchronous |
| src/utils/package.ts | All exported functions synchronous |
| src/utils/sha.ts | Only exported function synchronous |
| src/utils/time.ts | All exported functions synchronous |
| src/commands/check/render.ts | All exported functions synchronous — **new in run-15 file list** (not present in run-13). Both runs processed 33 files total; this file replaced `src/cli.ts` when cli.ts became a correct skip. |
| src/utils/sort.ts | All exported functions synchronous |
| src/utils/versions.ts | All exported functions synchronous |

---

## Span Naming Observation

Run-15 introduced a full rename of span naming conventions. Run-13 used namespace prefixes per file domain (`taze.bun.*`, `taze.package_json.*`, `taze.package_yaml.*`, `taze.pnpm_workspace.*`, `taze.fetch.npm_*`, `taze.fetch.jsr_*`). Run-15 consolidates all file I/O under `taze.io.*` and uses more descriptive run/check terminology.

This is a design improvement in naming coherence but introduces **backward incompatibility** — any consumer (dashboards, monitors, alerts) relying on run-13 span names would break. The run-15 schema does not include run-13 span IDs.

---

## CDQ-006 Verification Summary (Primary Goal)

**Goal**: Drop from run-13's 8 instances (5 files) to 0 after #728/#933 isRecording guard fix.
**Result**: 5 instances across 4 files — **primary goal NOT achieved**.

| File | Run-13 | Run-15 | Change |
|------|--------|--------|--------|
| checkGlobal.ts | FAIL (×2) | FAIL (×2) | No change |
| index.ts | FAIL (×2) | **PASS ✓** | FIXED |
| bunWorkspaces.ts | FAIL (×2) | FAIL (×1) | Partial — reduce computation removed, Object.keys() remains |
| resolves.ts | FAIL (×1) | N/A (0 spans) | Coverage regression |
| yarnWorkspaces.ts | FAIL (×1) | N/A (FAILED) | File failure |
| interactive.ts | PASS | FAIL (×1) | **NEW REGRESSION** |
| pnpmWorkspaces.ts | PASS (exemplary) | FAIL (×1) | **NEW REGRESSION** |

The #728/#933 isRecording guard fix was applied correctly in `index.ts` and inconsistently everywhere else.

---

## SCH-003 Verification Summary (Primary Goal)

**Goal**: Confirm schema type fix resolves run-13 mismatches (3 instances, 2 files).
**Result**: Run-13 mismatches all resolved ✓, but new mismatch introduced in run-15.

| Attribute | Run-13 | Run-15 | Change |
|-----------|--------|--------|--------|
| `taze.config.sources_found` (config.ts) | FAIL (string/int) | **PASS ✓** | FIXED — schema now int |
| `taze.cache.hit` (resolves.ts) | FAIL (string/bool) | N/A (0 spans) | Coverage regression |
| `taze.cache.changed` (resolves.ts) | FAIL (string/bool) | N/A (0 spans) | Coverage regression |
| `taze.cache.changed` (packageJson.ts) | N/A (not set) | **PASS ✓** | New usage, correct type (boolean) |
| `taze.cache.changed` (packageYaml.ts) | N/A (not set) | **PASS ✓** | New usage, correct type (boolean) |
| `taze.io.catalogs_found` (bunWorkspaces.ts) | N/A | **FAIL (NEW)** | New attribute; schema auto-generated as string; int passed |

Net: SCH-003 dimension still FAIL (1 new instance vs 3 resolved). The schema type fix for `taze.cache.changed` and `taze.cache.hit` is confirmed and extended to new files. The new `taze.io.catalogs_found` attribute repeats the same mistake the fix was meant to prevent.

---

## Quality Failures Summary

| File | Rule | Dimension | Description |
|------|------|-----------|-------------|
| src/commands/check/checkGlobal.ts | CDQ-006 | Code Quality | Inline `reduce()` and `reduce().filter()` in 2 `setAttribute` calls without isRecording guard (carry-forward from run-13) |
| src/commands/check/interactive.ts | CDQ-006 | Code Quality | `flatDeps()` (flatMap+filter) called inside `setAttribute` without isRecording guard (new violation) |
| src/io/bunWorkspaces.ts | CDQ-006 | Code Quality | `Object.keys().length` inside `setAttribute` without isRecording guard (carry-forward from run-13) |
| src/io/bunWorkspaces.ts | SCH-003 | Schema Fidelity | `taze.io.catalogs_found` set as int; schema declares type string (new violation) |
| src/io/pnpmWorkspaces.ts | CDQ-006 | Code Quality | `Object.keys().length` inside `setAttribute` without isRecording guard (REGRESSION — pnpmWorkspaces.ts was the exemplary CDQ-006 PASS in run-13) |

**CDQ-001 runtime advisory (non-canonical)**: interactive.ts — `process.exit()` via keypress handlers bypasses `finally`; span leaks on interactive-exit paths (unchanged from run-13).

**RST-003 advisory (non-canonical)**: packages.ts — `readJSON` instrumented as a COV-001 entry point; run-13 correctly skipped it as a thin wrapper. Not a canonical failure (exported async + I/O), but inconsistent with run-13 interpretation.

**Span naming advisory**: All 11 committed files use new span naming conventions incompatible with run-13. `taze.io.*` consolidation is an improvement in coherence, but run-13 consumers would break. `taze.check.*` names changed for index.ts and api/check.ts.
