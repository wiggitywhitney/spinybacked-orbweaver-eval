# Rubric Scores — taze Run-13

**Date**: 2026-05-03
**Branch**: spiny-orb/instrument-1777809261652
**PR**: https://github.com/wiggitywhitney/taze/pull/8
**Rubric version**: 31 rules (2 gates + 29 quality)
**First TypeScript baseline**

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — `tsc --noEmit` exits 0 on all 14 instrumented files; 0 NDS-001 failures across the run |
| NDS-002 (Tests) | Per-run | **PASS** — checkpoint test suite passed on all 14 committed files; live-check OK; 0 rollbacks |

**Gates**: 2/2 PASS

---

## Dimension Scores

### Non-Destructiveness (NDS): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-003 (Non-instrumentation lines unchanged) | **PASS** | 14/14 |
| NDS-004 (API signatures preserved) | **PASS** | 14/14 |
| NDS-005 (Error handling preserved) | **PASS** | 14/14 — pre-existing try/catch in resolves.ts graceful-degradation path preserved without modification |
| NDS-006 (Module system matches project) | **PASS** | 14/14 — ESM `import` statements match project `"type": "module"` |

### Coverage (COV): 6/6 (100%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | 14/14 applicable |
| COV-002 (External HTTP calls enclosed) | **PASS** | 2/2 applicable — resolves.ts (getPackageData → fetchPackage/fetchJsrPackageMeta), packument.ts (fetchPackage, fetchJsrPackageMeta) |
| COV-003 (Failable ops have error visibility) | **PASS** | 14/14 applicable — `recordException` + `setStatus(ERROR)` on all spans |
| COV-004 (Async ops have spans) | **PASS** | 14/14 applicable — packages.ts and resolves.ts coverage ratios justified via RST-004/RST-001 |
| COV-005 (Domain attributes present) | **PASS** | 14/14 |
| COV-006 (Auto-instrumentation preferred) | **PASS** | 2/2 applicable — ofetch→undici overlap advisory; manual spans add domain context not available from auto-instrumentation |

### Restraint (RST): 5/5 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No unnecessary utility spans) | **PASS** | 14/14 — synchronous helpers, thin wrappers, type-only files all correctly skipped |
| RST-002 | **PASS** | 14/14 |
| RST-003 (No duplicate wrapper spans) | **PASS** | 14/14 — readJSON (thin wrapper) correctly not instrumented across multiple files |
| RST-004 (No internal detail spans) | **PASS** | 14/14 — unexported helpers correctly skipped; propagated context used |
| RST-005 (No re-instrumentation) | **PASS** | N/A — no pre-existing instrumentation in taze |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-001 (Only @opentelemetry/api imported) | **PASS** | 14/14 files |
| API-002 (Correct dependency declaration) | **PASS** | `@opentelemetry/api` in peerDependencies at `>=1.0.0` |
| API-003 (No vendor SDKs) | **PASS** | No `dd-trace`, `@newrelic/*`, `@splunk/otel` in dependencies |

### Schema Fidelity (SCH): 3/4 (75%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | All 30 span IDs in registry; agent correctly engaged with advisory suggestions and kept semantically distinct names |
| SCH-002 (Attribute keys match registry) | **PASS** | All attribute keys in registry (baseline or agent-extensions.yaml) |
| SCH-003 (Attribute types correct) | **FAIL** | config.ts: `taze.config.sources_found` set as int, schema declares string; resolves.ts: `taze.cache.hit` and `taze.cache.changed` set as boolean, schema declares string (×2 instances) — 3 total type mismatches across 2 files. Root cause: schema documentation used incorrect types; code uses semantically appropriate types. |
| SCH-004 (No redundant entries) | **PASS** | No true duplicates (all SCH-001 advisories are false positives from naming-convention similarity) — *Note: SCH-004 flagged for future deletion* |

### Code Quality (CDQ): 6/7 (86%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | Static analysis: `span.end()` in `finally` on all 14 files. Runtime advisory (non-canonical): `process.exit()` in cli.ts and interactive.ts bypasses `finally` on normal-exit paths — span never closed on successful completion. |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('taze')` in all 14 files; matches `tracerName` in spiny-orb.yaml |
| CDQ-003 (Error recording pattern) | **PASS** | `error instanceof Error ? error : new Error(String(error))` pattern throughout |
| CDQ-005 (Async context propagation) | **PASS** | `startActiveSpan` callback pattern used throughout |
| CDQ-006 (Expensive computation guards) | **FAIL** | 5 of 14 files use inline O(n) computations inside `setAttribute` without `span.isRecording()` guard: checkGlobal.ts (×2), index.ts (×2), bunWorkspaces.ts (×2), resolves.ts (×1), yarnWorkspaces.ts (×1). pnpmWorkspaces.ts correctly applies the guard — use as reference. |
| CDQ-007 (No unbounded/PII attributes) | **PASS** | 14/14 — typed TypeScript parameters are non-nullable; filepath attributes are registered schema entries |
| CDQ-011 (Consistent tracer name per-run) | **PASS** | All 14 committed files use `trace.getTracer('taze')` |

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

## Canonical Metrics — TypeScript Baseline (Run-13)

| Metric | Run-13 |
|--------|--------|
| Quality | **27/29 (93%)** |
| Gates | 2/2 (100%) |
| Files committed | 14 |
| Correct skips | 19 |
| Total spans | 30 |
| New schema attributes | 3 |
| Cost | $4.93 |
| Push/PR | YES (#8) |
| Quality × Files | **13.0** |
| Duration | 54m 45s |

**Quality × Files = 13.0** — first TypeScript baseline. No prior TS runs for comparison.

---

## Failure Analysis

### SCH-003: Type mismatches in agent-extended schema attributes

Three type mismatches in 2 files, all stemming from incorrect type declarations in the agent-extensions.yaml schema:

| File | Attribute | Code type | Schema type | Correct type |
|------|-----------|-----------|-------------|--------------|
| src/config.ts | `taze.config.sources_found` | int (`config.sources.length`) | string | int |
| src/io/resolves.ts | `taze.cache.hit` | boolean (`true`/`false`) | string | boolean |
| src/io/resolves.ts | `taze.cache.changed` | boolean (`let cacheChanged = false`) | string | boolean |

**Root cause**: The agent-extensions schema incorrectly declared count and flag attributes as `string` type. The code uses semantically appropriate types (int for counts, boolean for flags). The schema documentation is wrong; the code is right.

**Fix path**: Update `semconv/agent-extensions.yaml` in the taze fork:
- `taze.config.sources_found: type: int`
- `taze.cache.hit: type: boolean`
- `taze.cache.changed: type: boolean`

### CDQ-006: Missing `isRecording()` guard on expensive attribute computations

Five files pass inline O(n) computations directly to `setAttribute` without checking whether the span is being sampled first. This is wasteful when the tracer is configured to drop spans (e.g., head-based sampling at 10%).

| File | Attribute | Computation |
|------|-----------|-------------|
| checkGlobal.ts | `taze.check.packages_total` | `resolvePkgs.reduce((sum, pkg) => sum + pkg.deps.length, 0)` |
| checkGlobal.ts | `taze.check.packages_outdated` | `resolvePkgs.reduce((sum, pkg) => sum + pkg.resolved.filter(...).length, 0)` |
| index.ts | `taze.check.packages_total` | `resolvePkgs.reduce((acc, pkg) => acc + pkg.resolved.length, 0)` |
| index.ts | `taze.check.packages_outdated` | `resolvePkgs.reduce((acc, pkg) => acc + pkg.resolved.filter(...).length, 0)` |
| bunWorkspaces.ts | `taze.check.packages_total` | `catalogs.reduce((sum, c) => sum + c.deps.length, 0)` |
| bunWorkspaces.ts | `taze.write.changes_count` | `Object.keys(versions).length` |
| resolves.ts | `taze.check.packages_outdated` | `result.filter(d => d.update).length` |
| yarnWorkspaces.ts | `taze.write.changes_count` | `Object.keys(versions).length` |

**Reference**: pnpmWorkspaces.ts correctly guards `Object.keys(versions).length` — the only file to apply this pattern.

**Fix pattern**:
```typescript
if (span.isRecording()) {
  span.setAttribute('taze.check.packages_total', resolvePkgs.reduce(...))
}
```

---

## TypeScript-Specific Observations (Baseline)

1. **NDS and RST dimensions are full-pass** — the agent correctly handles TypeScript-specific patterns: `as const` to prevent literal widening in discriminated unions, `error instanceof Error ? error : new Error(String(error))` for strict-mode catch blocks, RST-001 for synchronous helpers (taze has many).

2. **SCH-003 failures are schema-documentation errors, not agent errors** — the agent inferred the semantically correct types from the code; the schema documentation was incorrect. Fix the schema, not the instrumentation.

3. **CDQ-006 affects 36% of committed files** — the `isRecording()` guard pattern is sporadically applied (only pnpmWorkspaces.ts gets it right). This will be a recurring finding in TypeScript runs unless addressed in the prompt.

4. **COV dimensions are full-pass** — taze's I/O diversity (HTTP, file, subprocess, cache) is well-covered. COV-002 HTTP coverage is complete across resolves.ts and packument.ts.

5. **Advisory finding quality is TypeScript-specific**: SCH-001 generates systematic false positives on namespace-prefixed codebases; CDQ-007 null guards are false positives for typed TypeScript parameters. Advisory contradiction rate (~78%) is significantly higher than JS runs (~44%) — reflects judge designs trained on JavaScript patterns.
