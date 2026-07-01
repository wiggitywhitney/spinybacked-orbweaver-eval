# Rubric Scores — taze Run-15

**Date**: 2026-06-15
**Branch**: spiny-orb/instrument-1781536294891
**PR**: https://github.com/wiggitywhitney/taze/pull/10
**Rubric version**: 31 rules (2 gates + 29 quality)
**IS score**: 80/100 (up from 60/100 in run-13) — RES-001 now passes
**spiny-orb SHA**: 69c76e1

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — `tsc --noEmit` exits 0 on all 11 committed files; yarnWorkspaces.ts FAILED (NDS-001 tsc error) and was reverted, correctly not committed; resolves.ts 0-span oscillation not committed |
| NDS-002 (Tests) | Per-run | **PASS** — checkpoint test suite passed on all 11 committed files; live-check OK; 0 rollbacks |

**Gates**: 2/2 PASS

---

## Dimension Scores

### Non-Destructiveness (NDS): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-003 (Non-instrumentation lines unchanged) | **PASS** | 11/11 |
| NDS-004 (API signatures preserved) | **PASS** | 11/11 |
| NDS-005 (Error handling preserved) | **PASS** | 11/11 — inner catch blocks in packages.ts (loadPackage JSON parse fallback) and packageYaml/packageJson (indentation fallback) preserved without modification |
| NDS-006 (Module system matches project) | **PASS** | 11/11 — ESM `import` statements match project `"type": "module"` |

### Coverage (COV): 6/6 (100%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | 11/11 applicable — all exported async entry points have spans |
| COV-002 (External HTTP calls enclosed) | **PASS** | packument.ts: `fetchPackage` and `fetchJsrPackageMeta` wrap outbound HTTP calls (npm/JSR registry via ofetch). **Note**: resolves.ts COV-002 coverage from run-13 is absent (0-span oscillation), but packument.ts covers the underlying HTTP operations. |
| COV-003 (Failable ops have error visibility) | **PASS** | 11/11 — `recordException` + `setStatus(ERROR)` on all spans across all 11 files |
| COV-004 (Async ops have spans) | **PASS** | 11/11 — all applicable unexported async I/O functions instrumented (exec in checkGlobal.ts, file I/O in packages.ts/bunWorkspaces.ts) |
| COV-005 (Domain attributes present) | **PASS** | 11/11 — meaningful domain attributes on all spans |
| COV-006 (Auto-instrumentation preferred) | **PASS** | packument.ts: ofetch→undici overlap advisory carried forward from run-13; manual spans add domain context (package name, registry, latest version) not available from auto-instrumentation |

### Restraint (RST): 5/5 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No unnecessary utility spans) | **PASS** | 11/11 — synchronous helpers, type-only files, thin sync wrappers all correctly not instrumented; 20 correct pre-scan skips |
| RST-002 | **PASS** | 11/11 |
| RST-003 (No duplicate wrapper spans) | **PASS** | 11/11 — `writeYaml` (thin wrapper) and `createBunWorkspaceEntry`/`createPnpmWorkspaceEntry` (sync) correctly not instrumented. Advisory: `readJSON` in packages.ts now instrumented where run-13 skipped it; defensible as exported async I/O. |
| RST-004 (No internal detail spans) | **PASS** | Unexported async helpers with I/O (exec, file) correctly instrumented per RST-004 exception: `loadGlobalPnpmPackage`, `loadGlobalNpmPackage`, `installPkg` (checkGlobal.ts), `writeBunJSON` (bunWorkspaces.ts), `CheckSingleProject` (api/check.ts via resolvePackage/writePackage). Non-I/O unexported functions correctly not instrumented. |
| RST-005 (No re-instrumentation) | **PASS** | No pre-existing OTel instrumentation in taze |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-001 (Only @opentelemetry/api imported) | **PASS** | 11/11 files — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| API-002 (Correct dependency declaration) | **PASS** | `@opentelemetry/api` in peerDependencies at `>=1.0.0` |
| API-003 (No vendor SDKs) | **PASS** | No `dd-trace`, `@newrelic/*`, `@splunk/otel` in dependencies |

### Schema Fidelity (SCH): 3/4 (75%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | All 27 span IDs registered in agent-extensions.yaml (confirmed in PR Schema Changes section). SCH-001 advisory in PR is a live-check false positive — validator evaluated against pre-run schema snapshot. |
| SCH-002 (Attribute keys match registry) | **PASS** | All attribute keys in registry. `taze.write.file_path` reused for read paths (same pattern as run-13); `taze.config.sources_found` reused semantically in checkGlobal.ts (pnpm path count — minor semantic stretch, not SCH-002 violation). |
| SCH-003 (Attribute types correct) | **FAIL** | bunWorkspaces.ts: `span.setAttribute('taze.io.catalogs_found', catalogs.length)` passes int; schema declares `type: string`. 1 type mismatch in 1 file. Root cause: auto-generated attribute type in agent-extensions.yaml incorrectly set to string for a count value. Other SCH-003 fixes from run-13 confirmed (taze.config.sources_found: int ✓, taze.cache.changed: boolean ✓). |
| SCH-004 (No redundant entries) | **PASS** | No duplicates in agent-extensions.yaml |

### Code Quality (CDQ): 6/7 (86%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | Static analysis: `span.end()` in `finally` on all 11 committed files. Runtime advisory (non-canonical): `process.exit()` via keypress handlers in interactive.ts bypasses `finally` on interactive-exit paths (unchanged from run-13). |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('taze')` in all 11 files; matches `tracerName` in spiny-orb.yaml |
| CDQ-003 (Error recording pattern) | **PASS** | `error instanceof Error ? error : new Error(String(error))` pattern throughout |
| CDQ-005 (Async context propagation) | **PASS** | `startActiveSpan` callback pattern used throughout |
| CDQ-006 (Expensive computation guards) | **FAIL** | 4 files, 5 violation instances (net count: same dimension FAIL as run-13, different distribution): **checkGlobal.ts** (×2 carry-forward: inline `reduce` and `reduce.filter` for packages_total/packages_outdated), **interactive.ts** (×1 NEW regression: `flatDeps().length` — flatMap+filter without isRecording), **bunWorkspaces.ts** (×1 carry-forward: `Object.keys(versions).length`), **pnpmWorkspaces.ts** (×1 REGRESSION: `Object.keys(versions).length` — was correct in run-13, guard removed). index.ts CDQ-006 correctly fixed. |
| CDQ-007 (No unbounded/PII attributes) | **PASS** | 11/11 — typed TypeScript parameters are non-nullable; `taze.write.file_path` full path advisory not a canonical violation |
| CDQ-011 (Consistent tracer name per-run) | **PASS** | All 11 committed files use `trace.getTracer('taze')` |

---

## Overall Score

| Dimension | Rules | Score | % |
|-----------|-------|-------|---|
| NDS | 4 | 4/4 | 100% |
| COV | 6 | 6/6 | 100% |
| RST | 5 | 5/5 | 100% |
| API | 3 | 3/3 | 100% |
| SCH | 4 | 3/4 | 75% |
| CDQ | 7 | 6/7 | 86% |
| **Total** | **29** | **27/29** | **93%** |
| **Gates** | 2 | 2/2 | 100% |

---

## Canonical Metrics

| Metric | Run-13 | Run-15 | Δ |
|--------|--------|--------|---|
| Quality | 27/29 (93%) | **27/29 (93%)** | 0 |
| Gates | 2/2 (100%) | 2/2 (100%) | 0 |
| Files committed | 14 | **11** | −3 |
| Correct skips | 19 | **20** | +1 |
| Total spans | 30 | **27** | −3 |
| IS score | 60/100 | **80/100** | **+20** |
| New schema attributes | 3 | **1** | −2 |
| Cost | $4.93 | **$4.82** | −$0.11 |
| Push/PR | YES (#8) | YES (#10) | — |
| Quality × Files | 13.0 | **10.2** | −2.8 |
| CDQ-006 violations | 8 instances, 5 files | **5 instances, 4 files** | −3 |
| SCH-003 violations | 3 instances, 2 files | **1 instance, 1 file** | −2 |

**Quality × Files = 10.2** — down from 13.0 due to 11 committed files vs 14 (resolves.ts oscillation + yarnWorkspaces.ts failure + cli.ts correct pre-scan removing 3 previously committed files). Quality score unchanged.

---

## Failure Analysis

### CDQ-006: isRecording guard — 5 violations, 4 files (net: improved from run-13's 8 violations)

Primary PRD goal **NOT achieved** — CDQ-006 still fails.

| File | Attribute | Computation | vs Run-13 |
|------|-----------|-------------|-----------|
| checkGlobal.ts | `taze.check.packages_total` | `pkgs.reduce((sum, p) => sum + p.deps.length, 0)` | carry-forward |
| checkGlobal.ts | `taze.check.packages_outdated` | `pkgs.reduce((sum, p) => sum + p.resolved.filter(j => j.update).length, 0)` | carry-forward |
| interactive.ts | `taze.check.packages_total` | `flatDeps().length` where `flatDeps = pkgs.flatMap(pkg => pkg.resolved.filter(dep => dep.update))` | **NEW regression** |
| bunWorkspaces.ts | `taze.write.changes_count` | `Object.keys(versions).length` | carry-forward |
| pnpmWorkspaces.ts | `taze.write.changes_count` | `Object.keys(versions).length` | **REGRESSION** (was exemplary PASS in run-13) |

**Pattern**: The #728/#933 isRecording guard fix was applied correctly in index.ts only. The fix was not systematically applied. pnpmWorkspaces.ts regression is particularly notable — the run-13 PR described this file as the reference implementation for CDQ-006 compliance.

**Fix pattern** (confirmed working in index.ts run-15):
```typescript
if (span.isRecording()) {
  span.setAttribute('taze.check.packages_total', resolvePkgs.reduce(...))
  span.setAttribute('taze.check.packages_outdated', resolvePkgs.reduce(...filter...))
}
```

### SCH-003: Type mismatch — 1 violation, 1 file (improved from run-13's 3 violations)

| File | Attribute | Code type | Schema type | Correct type |
|------|-----------|-----------|-------------|--------------|
| src/io/bunWorkspaces.ts | `taze.io.catalogs_found` | int (`catalogs.length`) | string | int |

**Root cause**: Agent auto-generated `taze.io.catalogs_found` with `type: string` in agent-extensions.yaml even though the value is `catalogs.length` (int). pnpmWorkspaces.ts avoids the failure by converting: `String(catalogs.length)` — defensive coercion to match the incorrect schema type. Both files define the same semantic attribute with inconsistent handling.

**Fix path**: Update `semconv/agent-extensions.yaml` in the taze fork:
- `taze.io.catalogs_found: type: int`
- Remove `String()` coercion from pnpmWorkspaces.ts (or leave it since both int values are acceptable OTel attribute types)

### Oscillation Coverage Loss — resolves.ts (6 functions, 0 spans)

Canonical rubric rules don't apply to files with 0 committed spans, but the coverage regression is noted:
- `loadCache`, `dumpCache`, `getPackageData`, `resolveDependency`, `resolveDependencies`, `resolvePackage` — 6 exported async I/O/HTTP functions — no longer instrumented
- COV-002 (HTTP) was partially provided by `getPackageData` in run-13; now solely in packument.ts
- `taze.cache.hit` (boolean) and `taze.cache.changed` (boolean) attributes — not set in run-15 (resolves.ts 0-span, packageJson/packageYaml set `taze.cache.changed` but `taze.cache.hit` is absent)

---

## Run-15 Specific Observations

1. **IS RES-001 goal achieved** — service.instance.id added to bootstrap; IS score 80/100 (was 60/100). This was the highest-value fix entering run-15 and it succeeded.

2. **CDQ-006 goal not achieved despite run-13 fix** — The #728/#933 fix applied correctly to index.ts, but two regressions (interactive.ts new violation, pnpmWorkspaces.ts guard removed) plus carry-forwards in checkGlobal.ts and bunWorkspaces.ts mean net count dropped from 8 to 5 instances but the dimension still fails. The fix isn't being applied consistently across the run.

3. **SCH-003 pattern repeats** — The run-13 type-mismatch pattern reappears with `taze.io.catalogs_found`. The agent generates count attributes with `type: string` and applies `String()` coercion in some files (pnpmWorkspaces.ts) but not others (bunWorkspaces.ts). The schema-generation heuristic that produces incorrect types for count attributes persists.

4. **Span naming conventions changed globally** — All 11 files use new `taze.io.*` / `taze.check.*` / `taze.fetch.*` conventions, replacing the per-domain prefixes from run-13 (`taze.bun.*`, `taze.package_json.*`, etc.). This is coherent but breaks backward compatibility. Schema is completely replaced (27 new span IDs; 0 run-13 span IDs preserved).

5. **resolves.ts oscillation** — 6 functions × 2 attempts = 12 tsc failures, all NDS-001. The underlying error is unknown (NDS-001 logged at the file level without per-function context). Coverage loss from this file is the primary driver of the Files Committed count decrease (14→11).
