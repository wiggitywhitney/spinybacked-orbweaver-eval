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
<!-- PENDING: files 1, 5-13 -->

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

<!-- FILES 1, 5-13 PENDING -->
