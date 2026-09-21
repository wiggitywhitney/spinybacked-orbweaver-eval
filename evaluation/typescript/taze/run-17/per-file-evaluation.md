<!-- ABOUTME: Per-file evaluation for taze run-17 using parallel subagent approach (one agent per file). -->
# Per-File Evaluation — taze Run-17

**Date**: 2026-09-21
**Branch**: spiny-orb/instrument-1789998344404
**Rubric**: `~/Documents/Repositories/spinybacked-orbweaver/docs/research/evaluation-rubric.md`
**Exemption scope**: `evaluation/typescript/taze/run-17/exemption-scope.md`
**Files to evaluate**: 13 committed with spans + correct-skip verification pass

**Primary goals for this run:**
1. COV-005 (packument.ts): `taze.package.latest_version` recovery on both fetch spans
2. SCH-003 (checkGlobal.ts, bunWorkspaces.ts, yarnWorkspaces.ts, pnpmWorkspaces.ts): count-as-string casts, per exemption-scope semantic reading
3. CDQ-006 (bunWorkspaces.ts): post-await unguarded setAttribute calls
4. resolves.ts stability (second consecutive recovery check after run-15 oscillation)

---

## Committed Files (13 with spans)

<!-- BATCH 1 COMPLETE: files 1-5 (checkGlobal.ts, check/index.ts, interactive.ts, config.ts, bunWorkspaces.ts) -->
<!-- PENDING: files 6-13 -->

### 1. src/commands/check/checkGlobal.ts (4 spans)

**Spans**: `taze.check.global`, `taze.check.load_global_pnpm`, `taze.check.load_global_npm`, `taze.check.install_pkg`
**vs run-16**: Same span count (4) and same functions instrumented, but span names changed style (run-16: `taze.package.load_pnpm_global`, `taze.package.load_npm_global`, `taze.package.install` → run-17: `taze.check.load_global_pnpm`, `taze.check.load_global_npm`, `taze.check.install_pkg`), still all registered so no SCH-001 impact. Attribute set changed: dropped `taze.fetch.registry` and `taze.package.deps_count`; added `taze.check.recursive` (line 47), `taze.check.packages_loaded` (line 216, new), and `taze.check.agent` (line 250, new). **The run-16 SCH-003 carry-forward finding did not get fixed — it morphed into exactly the pattern the exemption-scope doc pre-committed to catching.** Run-16 failed because `String(deps.length)` was cast for an attribute the agent's own schema declared `type: int` (`taze.package.deps_count`) — a literal mismatch. Run-17 renamed the attribute to `taze.check.packages_loaded`, still casts it with `String(deps.length)` (line 216), but this time the committed schema (`semconv/agent-extensions.yaml:22-24`) declares it `type: string` — code and schema now agree literally. Per the exemption-scope pre-commitment (`checkGlobal.ts` is explicitly named as one of the two ambiguous files), this is scored as an SCH-003 violation under the semantic reading: a `.length`-derived value is inherently an int regardless of what the schema says, and retyping the schema to string is not a fix. Note the instrumentation.md companion doc (line 26) claims `taze.check.packages_loaded` is `type: int`, which contradicts what was actually committed to `agent-extensions.yaml` (`type: string`) — the agent's stated intent and its committed schema disagree with each other, on top of disagreeing with the exemption-scope's semantic standard.
**Attempts**: 2 (attempt 1 failed NDS-001 syntax validation; attempt 2 fixed by adding `as const` to the `agent`/`type` discriminant fields in the return objects of `loadGlobalPnpmPackage` and `loadGlobalNpmPackage`, needed because TypeScript widens string literals to `string` inside the async `startActiveSpan` callback)
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility. (For reference, the run-16 baseline noted this subcommand — `check --global` — is not exercised by the `taze major` IS-scoring invocation, so these spans likely still don't appear in captured trace data.)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — instrumentation-only diff (imports, tracer const, try/finally span lifecycle, setAttribute calls). The `as const` additions to the pre-existing `agent`/`type` literal fields (lines 173-174, 219, 221) are a mechanical type-widening fix required by wrapping the return statements in the async span callback, not an independent business-logic change — no runtime behavior differs (erased at compile time), consistent with how this same fix was treated under run-16's NDS-003 PASS |
| API-001 | PASS — only `@opentelemetry/api` imported (`trace`, `SpanStatusCode`) |
| NDS-006 | PASS — ESM imports consistent with project module system |
| NDS-004 | PASS — exported `checkGlobal(options: CheckOptions)` signature unchanged |
| NDS-005 | PASS — inner catch in `loadGlobalPnpmPackage` (swallows pnpm-not-installed exec failure, returns `[]`) is pre-existing graceful degradation, left untouched; outer span catch blocks are new and re-throw; no existing error-handling structure restructured |
| COV-001 | PASS — `checkGlobal` is the entry point for the `check --global` subcommand and has a span |
| COV-002 | N/A — no outbound HTTP/DB calls; subprocess `exec()` calls are covered by COV-004 |
| COV-003 | PASS — all 4 spans have `recordException` + `setStatus(ERROR)` in their catch blocks |
| COV-004 | PASS — the three unexported async functions performing subprocess `exec()` I/O (`loadGlobalPnpmPackage`, `loadGlobalNpmPackage`, `installPkg`) are all instrumented |
| COV-005 | PASS — `taze.check.global`: mode, write_mode, recursive, packages_total, packages_outdated; `taze.check.load_global_pnpm`: taze.config.sources_found; `taze.check.load_global_npm`: taze.check.packages_loaded; `taze.check.install_pkg`: taze.write.changes_count, taze.check.agent |
| COV-006 | N/A — no auto-instrumentation library covers pnpm/npm subprocess exec or global package management |
| RST-001 | PASS — no spans on synchronous utility functions |
| RST-002 | PASS — no spans on accessors |
| RST-003 | PASS — no spans on thin wrapper functions; all four spanned functions do real work |
| RST-004 | PASS — `loadGlobalPnpmPackage`, `loadGlobalNpmPackage`, `installPkg` are unexported but each performs subprocess `exec()` I/O; RST-004 exempts unexported I/O functions |
| RST-005 | PASS — no pre-existing tracer calls in original source |
| SCH-001 | PASS — all 4 span names (`span.taze.check.global`, `span.taze.check.load_global_pnpm`, `span.taze.check.load_global_npm`, `span.taze.check.install_pkg`) registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS — all attribute keys registered: `taze.check.mode`, `taze.check.write_mode`, `taze.check.recursive` (attributes.yaml), `taze.check.packages_total`, `taze.check.packages_outdated` (attributes.yaml), `taze.config.sources_found`, `taze.check.packages_loaded`, `taze.check.agent` (agent-extensions.yaml), `taze.write.changes_count` (attributes.yaml) |
| SCH-003 | **FAIL** — `checkGlobal.ts:216`: `span.setAttribute('taze.check.packages_loaded', String(deps.length))`. Per the run-17 exemption-scope pre-commitment (SCH-003, count-cast-with-retyped-schema case), this is scored as a violation under the semantic reading even though the committed schema also declares `type: string` for this key — `deps.length` is inherently numeric, and matching the schema to the cast does not fix the underlying carry-forward defect from run-16 (`taze.package.deps_count`). All other typed attributes in this file match correctly: `sources_found`/`packages_total`/`packages_outdated`/`changes_count` are raw ints matching `type: int`; `mode` is a raw string matching its enum type; `write_mode`/`recursive` are raw booleans matching `type: boolean`; `check.agent` is a raw string matching `type: string` |
| SCH-004 | PASS — `taze.check.packages_loaded` and `taze.check.agent` are new but registered; no obvious token-similarity redundancy against existing keys (`packages_loaded` is scoped to a single package-manager load, distinct from the existing `packages_total`/`packages_outdated` which are scoped to the full check operation) |
| CDQ-001 | PASS — all 4 spans use `startActiveSpan` callback pattern with `span.end()` in `finally` blocks |
| CDQ-002 | PASS — `trace.getTracer('taze')` matches project name |
| CDQ-003 | PASS — all catch blocks use `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })`, no ad-hoc `setAttribute('error', ...)` |
| CDQ-005 | PASS — `startActiveSpan` callback pattern throughout; context propagation handled automatically |
| CDQ-006 | PASS — the two `reduce`/`filter` chains in `checkGlobal` (lines 73, 84) are wrapped with `if (span.isRecording())`; the remaining `setAttribute` value expressions (`pnpmOuts.length`, `String(deps.length)`, `changes.length`, `pkg.agent`) are trivial property access / trivial type conversion, exempt per rubric — no violations |
| CDQ-007 | PASS on inspection of the final committed code — no PII attribute keys, no object spreads, no `JSON.stringify` of request/response objects, all values are primitives or bounded counts; the guarded attributes (mode/write_mode/recursive) use `!= null` checks. Note: the instrumentation.md's self-reported "Advisory Findings" flag lines 185 and 249 for PII/filesystem-path concerns, but those lines in the final file are `taze.config.sources_found` (an int count) and `taze.write.changes_count` (an int count) — neither is PII or a path. These advisory findings appear to be false positives from the agent's own heuristic checker (possibly against an intermediate draft), not defects in the committed code |

**Failures**: SCH-003 — `taze.check.packages_loaded` is set via `String(deps.length)` at `checkGlobal.ts:216`. This is the same underlying carry-forward defect flagged in run-16 (there as `taze.package.deps_count`), now hidden by renaming the attribute and having the schema declare `type: string` to match the cast instead of fixing the cast. Per the run-17 exemption-scope pre-commitment, schema/code agreement does not excuse a count value being stored as a string. Fix: declare the attribute as `type: int` in the schema and pass `deps.length` directly without the `String()` cast.

---

### 2. src/commands/check/index.ts (1 span)

**Spans**: `taze.check.run`
**vs run-16**: Span name, tracer name, and error-handling structure are identical to run-16. Attribute count grew from 5 to 6: run-16 set `taze.check.mode`, `taze.check.recursive`, `taze.check.write_mode`, `taze.check.packages_total`, `taze.check.packages_outdated`. Run-17 adds a new attribute, `taze.check.packages_loaded`, set via `String(resolvePkgs.length)` at line 66 — this attribute did not exist on this span in run-16. The `packages_total`/`packages_outdated` `isRecording()` guard structure (lines 67-71) is unchanged from run-16. This new attribute is the only material change and it introduces a rule regression relative to run-16's clean SCH-003 pass (see below).
**Attempts**: 1 (per `index.instrumentation.md` and log lines 158-237, "initial-generation")
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility. (Run-16's entry for this file noted that IS scoring exercises `taze major`, not `taze check`, so `taze.check.run` spans would not be expected in that dataset — but I have not queried live trace data myself to confirm this holds for run-17.)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — only instrumentation additions (imports, tracer const, span wrap, `setAttribute`/`recordException`/`setStatus`/`end` calls); business logic lines unchanged |
| API-001 | PASS — imports only `trace`, `SpanStatusCode` from `@opentelemetry/api` (line 2) |
| NDS-006 | PASS — ESM import/export syntax matches project's `"type": "module"` |
| NDS-004 | PASS — exported `async function check(options: CheckOptions)` signature unchanged (line 21) |
| NDS-005 | PASS — no pre-existing try/catch/finally in the original; the new try/catch/finally (lines 23, 216, 220) wraps span lifecycle with re-throw, consistent with NDS-005b instrumentation pattern |
| COV-001 | PASS — exported async `check` (CLI entry point) is wrapped in `tracer.startActiveSpan('taze.check.run', ...)` (line 22) |
| COV-002 | N/A — no direct outbound HTTP/DB calls in this file (delegated to `CheckPackages`) |
| COV-003 | PASS — catch block (lines 216-219): `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })` |
| COV-004 | PASS — async function with multiple `await`s is spanned |
| COV-005 | PASS — six domain attributes set: `taze.check.mode`, `taze.check.recursive`, `taze.check.write_mode`, `taze.check.packages_loaded`, `taze.check.packages_total`, `taze.check.packages_outdated` |
| COV-006 | N/A — no auto-instrumentation library covers this CLI command dispatch |
| RST-001 | PASS — no spans on utility functions; the only span is on the exported entry point |
| RST-002 | PASS — no spans on accessors |
| RST-003 | PASS — no spans on thin wrappers |
| RST-004 | PASS — `check` is exported; no unexported functions spanned |
| RST-005 | PASS — no pre-existing tracer/span calls in original source |
| SCH-001 | PASS — `taze.check.run` declared as a schema extension (`agent-extensions.yaml`) per instrumentation report; no existing registry span name matched this operation |
| SCH-002 | PASS — all six attribute keys (`taze.check.mode`, `.recursive`, `.write_mode`, `.packages_loaded`, `.packages_total`, `.packages_outdated`) match registered registry names |
| SCH-003 | **FAIL** — `taze.check.packages_loaded` is set via `String(resolvePkgs.length)` (line 66), a count/length-derived value. Per the run-17 exemption-scope pre-commitment (SCH-003 section), this is a violation regardless of the schema declaring `type: string` for this attribute — the underlying JS value is semantically an int, and "code and schema agree because the schema was retyped" does not cure the mismatch. This is the same pattern flagged for `checkGlobal.ts` and `pnpmWorkspaces.ts` in the exemption-scope doc, occurring here on the identically-named attribute `taze.check.packages_loaded`. Other attributes on this span pass individually: `mode`/`recursive`/`write_mode` (string/boolean, correctly typed), `packages_total`/`packages_outdated` (raw numeric via `.reduce()`, no cast) |
| SCH-004 | PASS — no new ad-hoc attribute keys introduced; all six were pre-registered in the schema (per instrumentation report) |
| CDQ-001 | PASS — `span.end()` in `finally` block (line 221); `startActiveSpan` callback pattern |
| CDQ-002 | PASS — `trace.getTracer('taze')` (line 19) matches project name |
| CDQ-003 | PASS — `span.recordException(error instanceof Error ? error : new Error(String(error)))` + `span.setStatus({ code: SpanStatusCode.ERROR })` in catch (lines 217-218) |
| CDQ-005 | PASS — `startActiveSpan` callback pattern manages context automatically |
| CDQ-006 | PASS — `taze.check.packages_total` (line 68) and `taze.check.packages_outdated` (line 71) are each wrapped in their own `if (span.isRecording())` guard before the `.reduce()`/`.filter().length` computation. `taze.check.packages_loaded` (line 66) is unguarded, but `String(resolvePkgs.length)` is a trivial type conversion (`String()` of a property-access chain) exempt under the rubric's literal CDQ-006 exemption text — consistent with the exemption-scope doc's guidance that only function calls/method chains/serialization require the guard. Note: the instrumentation.md's stated rationale ("guards omitted... per documented exemption" implying a blanket entry-point exemption) is not itself accurate — no such blanket exemption exists in the rubric — but the actual code behavior (two of three computed attributes guarded, the third trivially exempt) independently satisfies CDQ-006 |
| CDQ-007 | PASS — no PII attribute names; no raw filesystem paths; `options.mode` is null-guarded (line 24) before use; `recursive`/`write_mode` use `Boolean()` coercion, which always yields a defined value (never sets `undefined`) |
| CDQ-011 | PASS — `trace.getTracer('taze')` matches the project's canonical tracer name |

**Failures**: SCH-003 (Important) — `taze.check.packages_loaded` set via `String(resolvePkgs.length)`, a count coerced to string to match a schema that was itself declared as `type: string`; flagged as a violation per this run's exemption-scope pre-commitment because the underlying value is semantically an int. This is a new attribute (not present in run-16's 5-attribute baseline for this span), so it represents a regression introduced in run-17, not a carry-forward from run-16.

---

### 3. src/commands/check/interactive.ts (1 span)

**Spans**: `taze.check.interactive`
**vs run-16**: Run-16 used a single attribute `taze.package.deps_count` (`pkgs.length`, set before the try block, before any await). Run-17 drops that attribute entirely and instead sets two different, already-registered attributes: `taze.check.packages_total` (line 22, `pkgs.flatMap(pkg => pkg.resolved).length`, guarded by `span.isRecording()` at line 21) and `taze.check.packages_outdated` (line 66, `checked.size`, guarded by a `checked != null` defensive check rather than `isRecording()`). Span count is unchanged (1). Rule outcomes largely track run-16 (NDS-003 pass on final committed code, CDQ-001 static pass with the same ctrl+c runtime-advisory limitation), but run-17 additionally hardens the `'escape'`/`'q'` exit path: `span.end()` is now called before `process.exit()` in that `onKey` case (lines 112-114) — run-16's baseline treated *all* `process.exit()` paths as bypassing `finally`; run-17 fixes one of the two paths. The ctrl+c path (line 239-240, inside a single-line `if`) remains unfixed because restructuring it into a block to insert `span.end()` would violate NDS-003 — this was learned the hard way in attempt 1 (see Attempts below).
**Attempts**: 2 (per run log and instrumentation.md). Attempt 1 failed NDS-003 three times: it converted `renderer.render()` handling incorrectly (per the log's stated diff, that line was inadvertently altered), and it restructured the single-line `if ((key.ctrl && key.name === 'c')) process.exit()` into a braced block so it could insert `span.end()` before the ctrl+c exit. Attempt 2 reverted both non-instrumentation changes — restoring the original single-line `if` form and the `registerInput(); renderer.render()` sequence — and dropped the `span.end()` insertion at the ctrl+c site entirely, accepting the CDQ-001 limitation there while keeping the successful `span.end()` insertion in the `'escape'`/`'q'` case (a case-body statement, which is additive and doesn't violate NDS-003).
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility. (For context, run-16's baseline noted that IS scoring exercises `taze` in non-interactive mode, so `promptInteractive` — and this span — would not be expected to appear in that trace capture; this expectation is unconfirmed for run-17.)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — final committed code (post attempt-2 fix) contains no structural changes outside instrumentation; the single-line ctrl+c `if` and `registerInput(); renderer.render()` sequence are restored verbatim |
| NDS-004 | PASS — `promptInteractive(pkgs, options)` signature unchanged |
| NDS-005 | PASS — no pre-existing try/catch/finally in the original function; the new try/catch/finally wrapping is instrumentation-added |
| NDS-006 | PASS — ESM `import`/`export` syntax matches project's `"type": "module"` |
| API-001 | PASS — only `@opentelemetry/api` imports (`trace`, `SpanStatusCode`), line 1 |
| API-004 | PASS — no `@opentelemetry/sdk-*`/`exporter-*`/`instrumentation-*` imports |
| COV-001 | PASS — `promptInteractive`, the sole exported async function, has `taze.check.interactive` span (line 19) |
| COV-002 | N/A — no outbound HTTP/DB/queue calls in this file |
| COV-003 | PASS — catch block (lines 249-252) calls `span.recordException(...)` and `span.setStatus({ code: SpanStatusCode.ERROR })` |
| COV-004 | PASS — `promptInteractive` is async, awaits `promise` (line 58); covered by the entry-point span |
| COV-005 | PASS — `taze.check.packages_total` and `taze.check.packages_outdated` are domain attributes present on the span, matching registry keys already claimed by `src/commands/check/index.ts`'s span in this run |
| COV-006 | N/A — no auto-instrumentation library covers this terminal-UI flow |
| RST-001 | PASS — no spans on utility functions; `flatDeps`/`sortDeps` (short, sync, no I/O) correctly left uninstrumented |
| RST-002 | PASS — no spans on accessors |
| RST-003 | PASS — no spans on thin wrappers |
| RST-004 | PASS — `flatDeps`, `sortDeps`, `createListRenderer`, `createVersionSelectRender`, `registerInput` are unexported, non-I/O inner functions; correctly left to the outer span's context propagation |
| RST-005 | PASS — no pre-existing tracer/span calls in the original file |
| SCH-001 | PASS (advisory) — `taze.check.interactive` has no exact registry match; declared as a `schemaExtension`, with rationale that it is a distinct operation class from `taze.check.run` (drives terminal UI + awaits user input vs. orchestrates the full pipeline). Consistent with run-16's handling of the same span name |
| SCH-002 | PASS — `taze.check.packages_total` and `taze.check.packages_outdated` are both pre-registered attribute keys, not invented |
| SCH-003 | PASS — both values are set as raw `number` (`.length` and `.size`), no `String()` cast introduced; no type mismatch with registry (contrast with the exemption-scope doc's flagged cast pattern in `checkGlobal.ts`/`pnpmWorkspaces.ts` — not present here) |
| SCH-004 | PASS — no new/redundant attribute keys added; reuses already-registered keys |
| CDQ-001 | PASS (static) — `span.end()` in the outer `finally` block (line 254) covers the normal-return and thrown-error paths, and now also the `'escape'`/`'q'` `process.exit()` path (line 113). Runtime advisory: the ctrl+c `process.exit()` (line 240) still bypasses `finally`/`span.end()` — a known, NDS-003-constrained limitation, same as run-16 but now narrower in scope (one of two exit paths fixed instead of zero) |
| CDQ-002 | PASS — `trace.getTracer('taze')` (line 16) matches the project's `package.json#name` |
| CDQ-003 | PASS — catch block uses `recordException` + `setStatus({ code: SpanStatusCode.ERROR })`, not ad-hoc attributes |
| CDQ-005 | PASS — `startActiveSpan()` callback pattern; context automatically managed |
| CDQ-006 | PASS — `taze.check.packages_total`'s value expression (`pkgs.flatMap(...).length`, a method chain) is guarded by `span.isRecording()` (lines 21-23); `taze.check.packages_outdated`'s value (`checked.size`, trivial property access) is exempt from the guard requirement under the rubric's literal exemption text |
| CDQ-007 | PASS — both attributes are bounded integer counts, no PII; `packages_outdated` additionally has a defensive `checked != null` guard (unnecessary since `checked` is always a freshly constructed `Set`, but not a violation) |
| CDQ-011 | PASS — `'taze'` tracer name matches canonical project name, same as run-16 |

**Failures**: None. Net change vs run-16 is a lateral attribute swap (from `taze.package.deps_count` to the already-registered `taze.check.packages_total`/`taze.check.packages_outdated` pair) plus a genuine CDQ-001 partial improvement (the `'escape'`/`'q'` exit path now closes the span before exiting, where run-16 left both exit paths unclosed). The ctrl+c exit path remains an accepted, NDS-003-constrained limitation in both runs. Attempt 1's two NDS-003 violations (altering `renderer.render()` handling and restructuring the ctrl+c `if` into a block) were both corrected in attempt 2 before commit.

---

### 4. src/config.ts (1 span)

**Spans**: `taze.config.resolve`
**vs run-16**: SAME — identical to the run-16 baseline in every respect: 1 span (`taze.config.resolve`), 1 attribute (`taze.config.sources_found`) set as a raw int via `config.sources.length` (no cast), same skip rationale for `normalizeConfig`, same tracer name (`taze`), same error-handling pattern. No regression or improvement; the file appears essentially unchanged between runs.
**Attempts**: 1 (per run log, "Processing file 7 of 33," and per `config.instrumentation.md`)
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility. (Note: the run-16 baseline entry for this file recorded the span and attribute as confirmed present in Datadog — worth re-checking whether run-17 trace data corroborates the same, since code is unchanged.)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — diff limited to import, tracer acquisition, `startActiveSpan`/`span.setAttribute`/`recordException`/`setStatus`/`end` calls, and a try/finally wrapping span lifecycle |
| NDS-004 | PASS — `resolveConfig` exported signature (`(options: CommonOptions) => Promise<CommonOptions>`) unchanged |
| NDS-005 | PASS — no pre-existing try/catch/finally in `resolveConfig`; the try/catch/finally is new instrumentation scaffolding, not a restructuring of existing error handling |
| NDS-006 | PASS — project is ESM (`"type": "module"` in package.json); added `import` statements (line 1) match |
| API-001 | PASS — only `@opentelemetry/api` imported (line 1: `trace, SpanStatusCode`) |
| COV-001 | PASS — `resolveConfig` (exported async function, line 28) instrumented as entry point |
| COV-002 | N/A — no outbound HTTP/DB calls; `loader.load()` (line 54) is an internal library call, not a network/DB client |
| COV-003 | PASS — catch block (lines 66-70) has `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS — `resolveConfig` is async with `await loader.load()` (line 54) |
| COV-005 | PASS — `taze.config.sources_found` set from `config.sources.length` (line 56), matching the registry-defined domain attribute |
| COV-006 | N/A — no auto-instrumentation library covers `unconfig` config-file loading |
| RST-001 | PASS — `normalizeConfig` (lines 13-26, synchronous, unexported, no I/O) correctly left uninstrumented |
| RST-002 | PASS — no accessor methods in file |
| RST-003 | PASS — `resolveConfig` is not a thin single-call wrapper |
| RST-004 | PASS — `normalizeConfig` is unexported with no I/O; exempt from coverage since `resolveConfig` covers the entry point |
| RST-005 | PASS — no pre-existing tracer calls in the file before this run |
| SCH-001 | PASS — `taze.config.resolve` is a new span name declared in `schemaExtensions` (`agent-extensions.yaml:72`), consistent with the fallback naming-quality mode since no existing registry operation matched |
| SCH-002 | PASS — `taze.config.sources_found` matches the registered attribute key (`agent-extensions.yaml:7`) |
| SCH-003 | PASS — `config.sources.length` is a raw int with no `String()` cast, and the registry declares `taze.config.sources_found` as `type: int` (`agent-extensions.yaml:8`) — this is the clean, non-ambiguous case per the exemption-scope doc (same pattern as `bunWorkspaces.ts`'s `sources_found`, explicitly called "not ambiguous — clean pass"), not the count-cast-to-string pattern the exemption-scope doc flags for `checkGlobal.ts`/`pnpmWorkspaces.ts` |
| SCH-004 | PASS — no unregistered attribute keys added |
| CDQ-001 | PASS — `span.end()` in `finally` block (line 72) |
| CDQ-002 | PASS — `trace.getTracer('taze')` (line 11) matches `package.json#name` (`taze`) |
| CDQ-003 | PASS — `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })` (lines 67-68) |
| CDQ-005 | PASS — `startActiveSpan` callback pattern (line 31), context automatically managed |
| CDQ-006 | PASS — `config.sources.length` (line 56) is a trivial property access, exempt per rubric's literal exemption text (no method chain/serialization); no `isRecording()` guard required |
| CDQ-007 | PASS — `sources.length` is a bounded integer count; no PII, no unbounded/object-spread value |
| CDQ-011 | PASS — `trace.getTracer('taze')` matches the canonical tracer name derived from `semconv/registry_manifest.yaml#name: taze` |

**Failures**: None. `src/config.ts` in run-17 is functionally and structurally identical to the run-16 baseline — same single span, same single attribute, same clean (non-ambiguous) SCH-003 pattern confirmed against the current registry (`agent-extensions.yaml:8`, `type: int`, no `String()` cast at line 56). All applicable rules pass; no exemption-scope override applies to this file.

---

### 5. src/io/bunWorkspaces.ts (3 spans)

**Spans**: `taze.io.load_bun_workspace`, `taze.io.write_bun_workspace`, `taze.io.write_bun_json`
**vs run-16**: Span count unchanged (3), but the schema namespace reverted from run-16's `taze.package.*`/`taze.write.*` split back to a `taze.io.*`-centric scheme for `loadBunWorkspace` (`taze.io.file_path`, `taze.config.sources_found` — the latter re-using a pre-existing registry attribute rather than run-16's dedicated `taze.catalog.count`). **CDQ-006 (TAZE-RUN3-2) is now resolved**: run-16 had 3 unguarded post-await `setAttribute` calls in `loadBunWorkspace` (`taze.write.file_path`, `taze.write.package_type`, `taze.catalog.count`). In the current code, the only unguarded post-await calls in `loadBunWorkspace` are `span.setAttribute('taze.io.file_path', filepath)` (line 21, trivial variable reference) and `span.setAttribute('taze.config.sources_found', catalogs.length)` (line 63, trivial property access) — both exempt under the exemption-scope doc's literal CDQ-006 test. The one true method-chain computation, `Object.keys(versions).length` in `writeBunWorkspace` (line 87), is correctly wrapped in `if (span.isRecording())`. **SCH-003 (TAZE-RUN3-4) is now resolved**: run-16's `taze.catalog.count` was set via `String(catalogs.length)` against an `int`-typed schema attribute (a real mismatch). The current code sets `taze.config.sources_found` as a raw int (`catalogs.length`, line 63) with no `String()` cast — per the exemption-scope doc, this is "not ambiguous — clean pass." One minor coverage regression vs run-16: `writeBunWorkspace` no longer sets a catalog/package-name attribute (run-16's `taze.package.name`) — only `taze.write.file_path`, `taze.write.package_type`, `taze.write.changes_count` are set now. Attempts dropped from 2 (run-16) to 1 (run-17, first-pass success).
**Attempts**: 1 (per `bunWorkspaces.instrumentation.md`: "Attempts: 1 (initial-generation)"; confirmed by the log's single "Attempt 1" block, lines 422-494)
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility. (Note: run-16's baseline for this file recorded that taze uses pnpm, not bun, so no bun-workspace spans were expected to appear in Datadog during IS scoring — that constraint likely still applies but was not re-verified here.)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — only instrumentation additions (imports, tracer, span wrapper, `setAttribute`/`recordException`/`setStatus`/`end`); `return writeFile(...)` without `await` preserved unchanged (line 138) |
| API-001 | PASS — only `@opentelemetry/api` imported (line 1) |
| NDS-006 | PASS — ESM import/export syntax matches project module system |
| NDS-004 | PASS — `loadBunWorkspace`, `writeBunWorkspace`, `writeBunJSON` signatures all unchanged |
| NDS-005 | PASS — pre-existing empty `catch {}` in `writeBunJSON` (lines 132-136, graceful indent-detection fallback) left untouched, no `recordException`/`setStatus` added to it |
| COV-001 | PASS — both exported entry points (`loadBunWorkspace` line 10, `writeBunWorkspace` line 75) have spans |
| COV-002 | N/A — no outbound HTTP/DB calls |
| COV-003 | PASS — all 3 spans have `recordException` + `setStatus({code: ERROR})` in their catch blocks (lines 65-67, 117-119, 139-141) |
| COV-004 | PASS — `writeBunJSON` (unexported async, `await readFile` + `writeFile`, lines 127-147) is spanned |
| COV-005 | PASS — `loadBunWorkspace`: `taze.io.file_path`, `taze.config.sources_found`; `writeBunWorkspace`: `taze.write.file_path`, `taze.write.package_type`, `taze.write.changes_count`; `writeBunJSON`: `taze.write.file_path`. (Narrower than run-16, which also carried a catalog/package-name attribute on `writeBunWorkspace`.) |
| COV-006 | N/A — no auto-instrumentation library covers bun workspace file I/O |
| RST-001 | PASS — `createBunWorkspaceEntry` (sync, unexported, pure helper, lines 25-40) correctly left unspanned |
| RST-002 | N/A — no accessor methods in file |
| RST-003 | PASS — no thin-wrapper duplicate spans |
| RST-004 | PASS — `writeBunJSON` is unexported but performs file I/O (`readFile`/`writeFile`); exempt under RST-004's I/O exception, span retained deliberately |
| RST-005 | PASS — no pre-existing instrumentation in the file |
| SCH-001 | PASS (advisory noted) — span names use consistent dotted `taze.io.*` notation; instrumentation report flags an advisory because these 3 spans are newly invented (no exact registry match), but they are declared as schema extensions per the report's Schema Extensions section, satisfying the naming-quality fallback mode |
| SCH-002 | PASS — `taze.io.file_path` declared as a new extension attribute; `taze.config.sources_found`, `taze.write.file_path`, `taze.write.package_type`, `taze.write.changes_count` are pre-existing registered keys |
| SCH-003 | PASS — `taze.config.sources_found` set as raw int (`catalogs.length`, line 63, no cast) — clean pass per exemption-scope doc; `taze.write.changes_count` set as raw int (`Object.keys(versions).length`, line 87) inside `isRecording()` guard, no cast |
| SCH-004 | PASS (borderline, flagged for awareness) — `taze.io.file_path` vs. `taze.write.file_path` share the `file_path` token and represent the same underlying concept split only by read/write namespace prefix. Token-Jaccard similarity is exactly 0.5, at but not above the rubric's `> 0.5` flag threshold. Not counted as a violation, but worth watching for schema bloat across the run |
| CDQ-001 | PASS — all 3 `startActiveSpan` calls have `span.end()` in a `finally` block (lines 69-71, 121-123, 143-145) |
| CDQ-002 | PASS — `trace.getTracer('taze')` (line 8) matches project name |
| CDQ-011 | PASS — canonical tracer name `'taze'` matches project identity; no variable/template-literal tracer names |
| CDQ-003 | PASS — all 3 catch blocks use `span.recordException(...)` + `span.setStatus({code: SpanStatusCode.ERROR})`, no ad-hoc error attributes |
| CDQ-005 | PASS — `startActiveSpan()` callback pattern throughout; context managed automatically |
| CDQ-006 | PASS — resolves TAZE-RUN3-2. Only unguarded post-await `setAttribute` calls are trivial property/variable access (`filepath` string, `catalogs.length`), exempt per the exemption-scope doc's literal test; the one method-chain computation (`Object.keys(versions).length`, line 87) is correctly guarded with `if (span.isRecording())` |
| CDQ-007 | PASS with advisory — 3 sites set an absolute filesystem path as a span attribute value (`taze.io.file_path` line 21, `taze.write.file_path` line 81, `taze.write.file_path` line 130) rather than a basename. Same known limitation run-16 flagged for `writeBunJSON` alone (there, also PASS-with-advisory) — now present at 3 sites instead of 1. Not a hard fail (no PII field names, no unbounded objects/arrays), but the scope of the pre-existing advisory has widened |

**Failures**: None. Both TAZE-RUN3-2 (CDQ-006) and TAZE-RUN3-4 (SCH-003) are resolved in the current code per the exemption-scope doc's literal tests. Two soft/advisory items carried forward or worth monitoring, neither scored as a table FAIL: (1) CDQ-007 — absolute-path advisory now spans 3 call sites instead of 1 (same known limitation, wider scope); (2) SCH-004 — `taze.io.file_path`/`taze.write.file_path` sit right at the token-similarity flag threshold and are candidates for consolidation if the schema grows further.

---


