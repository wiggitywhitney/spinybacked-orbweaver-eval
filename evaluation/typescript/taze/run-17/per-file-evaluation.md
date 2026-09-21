<!-- ABOUTME: Per-file evaluation for taze run-17 using parallel subagent approach (one agent per file). -->
# Per-File Evaluation — taze Run-17

**Date**: 2026-09-21
**Branch**: spiny-orb/instrument-1789998344404
**Rubric**: `~/Documents/Repositories/spinybacked-orbweaver/docs/research/evaluation-rubric.md`
**Exemption scope**: `evaluation/typescript/taze/run-17/exemption-scope.md`
**Files evaluated**: 13 committed with spans (full rubric scoring) + 20 correct-skip pre-scan verification

**Primary goals for this run:**
1. COV-005 (packument.ts): `taze.package.latest_version` recovery on both fetch spans
2. SCH-003 (checkGlobal.ts, bunWorkspaces.ts, yarnWorkspaces.ts, pnpmWorkspaces.ts): count-as-string casts, per exemption-scope semantic reading
3. CDQ-006 (bunWorkspaces.ts): post-await unguarded setAttribute calls
4. resolves.ts stability (second consecutive recovery check after run-15 oscillation)

---

## Committed Files (13 with spans)

<!-- BATCH 1 COMPLETE: files 1-5 (checkGlobal.ts, check/index.ts, interactive.ts, config.ts, bunWorkspaces.ts) -->
<!-- BATCH 2 COMPLETE: files 6-10 (packageJson.ts, packageYaml.ts, packages.ts, pnpmWorkspaces.ts, resolves.ts) -->
<!-- BATCH 3 COMPLETE: files 11-13 (yarnWorkspaces.ts, api/check.ts, packument.ts) -->
<!-- ALL 13 COMMITTED FILES EVALUATED. -->

<!-- RECONCILIATION PASS COMPLETE (2026-09-21):
1. CDQ-007 on raw filesystem paths: RESOLVED as PASS across all files. The rubric's literal CDQ-007 mechanism (evaluation-rubric.md line 503) covers only object spreads, JSON.stringify of req/response objects, unbounded arrays, and PII-pattern keys (email/password/ssn/phone/creditCard/address/*_name) — it does not cover raw filesystem paths. packages.ts and yarnWorkspaces.ts had this right; packageJson.ts's and packageYaml.ts's FAIL verdicts were corrected to PASS in their per-file sections above (search "RECONCILED" in this file). The underlying path-sanitization regressions vs. run-16 are still noted as quality observations, just not scored as CDQ-007 rubric violations.
2. SCH-001 on renamed previously-registered spans: RESOLVED as PASS (naming-quality fallback) across all files. SCH-001's mechanism (evaluation-rubric.md line 406) compares against the currently resolved registry, not a prior run's baseline — and run-16's schema extensions never merged to main (eval branches don't merge per this project's convention), so they aren't part of what run-17 is compared against. resolves.ts's original FAIL verdict (comparing against run-16's baseline) was corrected to PASS in its per-file section above, matching how every other file in this run treated the same cross-run naming-drift pattern.
-->


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

### 6. src/io/packageJson.ts (2 spans)

**Spans**: `taze.io.load_package_json`, `taze.io.write_package_json`
**vs run-16**: Span namespace reverted from run-16's `taze.package.*`/`taze.write.*` split (`taze.package.load_package_json`, `taze.write.package_json`) back to the run-15-era `taze.io.*` namespace (`taze.io.load_package_json`, `taze.io.write_package_json`) — both newly re-registered as agent-discovered spans in `semconv/agent-extensions.yaml` (lines 92-101). Coverage regressed: run-16's `loadPackageJSON` captured both `taze.package.file_path` (relative path) **and** `taze.package.deps_count` (`deps.length`, int); run-17 drops the deps-count attribute entirely and captures only a sanitized basename (`taze.io.file_path`, line 40) plus `taze.package.name` (line 64) — a genuine loss of a domain-specific numeric attribute, not just a rename. Separately, `writePackageJSON`'s `taze.write.file_path` regressed from run-16's `pkg.relative` (relative path, CDQ-007-safe) to `pkg.filepath` (line 98, the absolute resolved path) — the opposite direction of the sanitization the agent applied on the read side in the very same file. Attempts held steady at 2 (SCH-002 conflict over a proposed `taze.write.changed` attribute, same failure class as run-16's write-side attribute-naming churn, ultimately resolved by reusing the registered `taze.cache.changed`).
**Attempts**: 2 (log confirms: attempt 1 produced 2 blocking SCH-002 errors over the ad-hoc `taze.write.changed` attribute; attempt 2 swapped it for the registered `taze.cache.changed` and fixed the CDQ-007 basename sanitization on the load side, reaching 0 errors)
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — diff is limited to tracer import/const, span wrapping, `setAttribute` calls, try/catch/finally around each function body, and an `as const` type annotation needed to preserve the `PackageMeta` discriminant inside the async span callback (type-only, no behavior change) |
| API-001 | PASS — only `@opentelemetry/api` imported (line 1: `trace`, `SpanStatusCode`) |
| NDS-006 | PASS — ESM import/export syntax matches project module system |
| NDS-004 | PASS — `loadPackageJSON` and `writePackageJSON` signatures and return types unchanged |
| NDS-005 | PASS — neither function had pre-existing error handling; the new try/catch/finally is the standard benign instrumentation wrapper that rethrows |
| COV-001 | PASS — both exported async functions (`loadPackageJSON` line 30, `writePackageJSON` line 92) have spans |
| COV-002 | N/A — no outbound HTTP/DB calls; `readJSON`/`writeJSON` are internal filesystem helpers instrumented elsewhere |
| COV-003 | PASS — both spans record `recordException` + `setStatus(ERROR)` in catch blocks (lines 82-83, 145-146) |
| COV-004 | PASS — both functions are async with `await`; both spanned |
| COV-005 | PASS, but weaker than run-16 — `loadPackageJSON` now only captures `taze.io.file_path` and `taze.package.name`; the previously-captured dependency count (`taze.package.deps_count`) is gone with no replacement |
| COV-006 | N/A — no auto-instrumentation library covers package.json file I/O |
| RST-001 | PASS — `isDepFieldEnabled` (line 22, synchronous, no I/O) correctly left unspanned |
| RST-002 | N/A — no accessors in this file |
| RST-003 | PASS — neither function is a thin wrapper |
| RST-004 | PASS — only exported functions spanned; `isDepFieldEnabled` unexported and correctly skipped |
| RST-005 | PASS — no pre-existing tracer calls in the original file |
| API-004 | PASS — no SDK-internal imports |
| SCH-001 | PASS — both span names registered as agent-discovered extensions (`semconv/agent-extensions.yaml` lines 92-101); SCH-001 advisory (write_package_json vs. write_bun_json) was reviewed and correctly dismissed as a distinct operation class |
| SCH-002 | PASS (after attempt 2) — `taze.io.file_path` (new extension, line 30), `taze.package.name` (pre-registered, `attributes.yaml` line 78), `taze.write.file_path`, `taze.write.package_type` (pre-registered, lines 161, 178), `taze.cache.changed` (registered extension) all resolve in the registry; the rejected `taze.write.changed` never reached the committed file |
| SCH-003 | PASS — `taze.io.file_path`/`taze.package.name`/`taze.write.file_path` are strings matching `type: string`; `taze.write.package_type` literal `'package.json'` matches the enum member; `taze.cache.changed` is a genuine boolean (`changed`). No count-cast-to-string pattern present in this file, so the exemption-scope SCH-003 override does not apply here |
| SCH-004 | PASS — the redundant `taze.write.changed` (flagged as a semantic duplicate of `taze.write.changes_count`) was caught and removed before commit; final attribute set has no redundant entries |
| CDQ-001 | PASS — both spans use `startActiveSpan` with `span.end()` in `finally` (lines 86-88, 149-151) |
| CDQ-002 | PASS — `trace.getTracer('taze')` (line 9) matches project name |
| CDQ-003 | PASS — both catch blocks use `recordException` + `setStatus({ code: SpanStatusCode.ERROR })`, not ad-hoc attributes |
| CDQ-005 | PASS — `startActiveSpan` callback pattern; context propagation automatic |
| CDQ-006 | PASS — `taze.io.file_path`'s method-chain computation (`filepath.split(...).filter(...).pop()`) is correctly wrapped in `if (span.isRecording())` (lines 39-41); `String(raw.name)` is an exempt trivial conversion (line 64); all other `setAttribute` calls are plain property/variable reads needing no guard. Note: the instrumentation.md notes text claims "CDQ-006 isRecording() guard omitted because this is a COV-001 entry point span" — that statement is inconsistent with the actual code, which does apply the guard; the code is correct, only the rationale doc is wrong |
| CDQ-007 | **RECONCILED: PASS** — `taze.write.file_path` is set to `pkg.filepath` (line 98), the full absolute resolved filesystem path, not the sanitized basename or relative path used elsewhere in this same file. Originally scored FAIL (partial) by this file's evaluator; corrected on reconciliation because CDQ-007's literal rubric mechanism (object spreads, `JSON.stringify` of req/response objects, unbounded arrays, PII-pattern keys) does not cover raw filesystem paths at all — confirmed against `packages.ts` and `yarnWorkspaces.ts` in this same run, which read the identical pattern as PASS. Still a genuine regression from run-16 (which used the relative `pkg.relative` for this key) and an internal inconsistency within this file (the load side is sanitized, the write side isn't) — worth flagging as a quality note, just not a rubric-literal CDQ-007 violation |

**Failures**: None after reconciliation. `writePackageJSON`'s `taze.write.file_path` (line 98) uses the absolute, unsanitized `pkg.filepath` where the load side of this same file uses a sanitized basename and run-16 used a relative path for this exact key — a genuine internal-consistency regression worth noting, but not a CDQ-007 rubric violation per the reconciled reading (raw filesystem paths are outside that rule's literal scope).

---

### 7. src/io/packageYaml.ts (4 spans)

**Spans**: `taze.io.read_yaml`, `taze.io.write_yaml`, `taze.io.load_package_yaml`, `taze.io.write_package_yaml`
**vs run-16**: Span namespace reverted from run-16's split (`taze.package.*` for read/load, `taze.write.*` for write) back to run-15's unified `taze.io.*` prefix for all four spans — a naming-convention regression/oscillation, not a functional one. Attribute count is nominally the same (5 distinct keys) but two attributes regressed in quality: (1) run-16's correctly-typed int attribute `taze.package.deps_count` (`deps.length`, matching int schema type) was replaced with `taze.check.packages_loaded` set via `String(deps.length)` — a string-cast count, per exemption-scope.md this is an SCH-003 violation regardless of the schema's declared type; (2) run-16 used the relative-path parameter (`relative` in `loadPackageYAML`, `pkg.relative` in `writePackageYAML`) for `file_path`/`taze.write.file_path`, making those two functions CDQ-007-clean with no advisory — run-17 uses absolute paths (`filepath`, `pkg.filepath`) in all four functions, regressing two previously-clean call sites into advisory/violation territory. `writePackageYAML`'s `pkg.filepath` (line 143) is a new occurrence the agent's own advisory findings did not even catch (advisories only flagged lines 31, 56, 88).
**Attempts**: 3 (per `packageYaml.instrumentation.md` and log "Processing file 13 of 33"; run-16 succeeded in 1 attempt). Attempt 1 failed NDS-001 (TS2322: `type: 'package.yaml'` widened to `string` inside the async `startActiveSpan` callback). Attempt 2 correctly diagnosed the `as const` fix but was rejected on NDS-003 because it also extracted `doc.get('name')` into a separate const (a non-instrumentation change). Attempt 3 applied `as const` alone, kept `doc.get('name')` inline, and passed. `spiny-orb-findings.md` (lines 10-16) documents this same sequence and assesses it as "not a quality failure requiring a carry-forward finding... the retry loop worked as designed" — verified against the log and confirmed accurate.
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility. (Historical note: run-16's baseline recorded that the test project (`taze major`) uses `package.json` only, so none of this file's four spans appeared in Datadog traces for that IS scoring run — likely still true for run-17, but not confirmed here.)

| Rule | Result |
|------|--------|
| NDS-001 | PASS — final attempt compiles cleanly (attempts 1-2 failed and were corrected before commit) |
| NDS-002 | N/A — per-run gate, not evaluable at file scope |
| NDS-003 | PASS — final diff adds only span/tracer/attribute/try-finally code plus a required `as const` type-only annotation on the pre-existing `type: 'package.yaml'` literal (documented HARD CONSTRAINT pattern for discriminated unions inside async `startActiveSpan` callbacks); no business logic altered |
| NDS-004 | PASS — all four exported function signatures (`readYAML`, `writeYAML`, `loadPackageYAML`, `writePackageYAML`) unchanged |
| NDS-005 | PASS — `.catch(Object.create)` in `writeYAML` (line 59) is the pre-existing graceful-degradation fallback, untouched and correctly not given `recordException`/`setStatus` (NDS-007); no pre-existing try/catch restructured |
| NDS-006 | PASS — ESM `import`/`export` matches project module system |
| API-001 | PASS — only `@opentelemetry/api` imported (line 1) |
| COV-001 | PASS — all four exported async functions (`readYAML` L28, `writeYAML` L53, `loadPackageYAML` L80, `writePackageYAML` L137) have spans; `isDepFieldEnabled` (L24, sync/unexported/no I/O) correctly excluded |
| COV-002 | N/A — no outbound HTTP/DB calls in this file |
| COV-003 | PASS — all four spans have `recordException` + `setStatus(ERROR)` in catch blocks (lines 43-45, 70-72, 127-129, 183-185) |
| COV-004 | PASS — all four are `async`/`await`-using functions with `fs.*` I/O, all spanned |
| COV-005 | PASS — domain attributes present on all four spans: `taze.io.file_path` (x3), `taze.check.packages_loaded`, `taze.write.file_path`, `taze.write.package_type`, `taze.cache.changed` |
| COV-006 | N/A — no auto-instrumentation library covers YAML file I/O |
| RST-001 | PASS — `isDepFieldEnabled` (sync, no I/O) correctly left unspanned |
| RST-002 | PASS — no accessor spans |
| RST-003 | PASS — no thin-wrapper spans |
| RST-004 | PASS — `isDepFieldEnabled` is unexported and correctly skipped; all instrumented functions are exported |
| RST-005 | PASS — no pre-existing instrumentation to duplicate |
| API-004 | PASS — no SDK-internal imports |
| SCH-001 | PASS — four new span-name extensions (`taze.io.read_yaml`, `taze.io.write_yaml`, `taze.io.load_package_yaml`, `taze.io.write_package_yaml`); no registry operation collision; consistent `taze.io.*` naming convention, bounded cardinality, no embedded dynamic values |
| SCH-002 | PASS — all attribute keys (`taze.io.file_path`, `taze.check.packages_loaded`, `taze.write.file_path`, `taze.write.package_type`, `taze.cache.changed`) are pre-registered; no new attribute keys created |
| SCH-003 | **FAIL** — line 109: `span.setAttribute('taze.check.packages_loaded', String(deps.length))`. Per exemption-scope.md's explicit test ("For any attribute set via `String(<expr>.length)`... treat it as an SCH-003 violation regardless of what the schema declares"), this is a violation even though the schema declares `taze.check.packages_loaded` as `type: string` — the underlying JS value is semantically an int count. Identical pattern to the `checkGlobal.ts`/`pnpmWorkspaces.ts` cases the exemption doc pre-decided. Also a quality regression from run-16, which used the correctly int-typed `taze.package.deps_count` for the same value |
| SCH-004 | PASS — no unregistered attribute keys added |
| CDQ-001 | PASS — all four `startActiveSpan` calls end the span in a `finally` block (lines 47-49, 74-76, 131-133, 187-189) |
| CDQ-002 | PASS — `trace.getTracer('taze')` (line 22) matches project name |
| CDQ-003 | PASS — all catch blocks use `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })`, no ad-hoc error attributes |
| CDQ-005 | PASS — `startActiveSpan` callback pattern throughout; context managed automatically |
| CDQ-006 | PASS — `String(deps.length)` (line 109) is a trivial type-conversion explicitly exempt per rubric text listing `String()` among exempt trivial conversions; `changed` (boolean var) and literal `'package.yaml'` need no guard; no `.map`/`.reduce`/`.join`/`JSON.stringify` in any `setAttribute` call |
| CDQ-007 | **RECONCILED: PASS** — `taze.io.file_path` set to the absolute `filepath` in `readYAML` (line 31), `writeYAML` (line 56), and `loadPackageYAML` (line 88), and `taze.write.file_path` set to absolute `pkg.filepath` in `writePackageYAML` (line 143). Originally scored FAIL by this file's evaluator; corrected on reconciliation because CDQ-007's literal rubric mechanism does not cover raw filesystem paths at all (confirmed against `packages.ts`/`yarnWorkspaces.ts` in this same run, and against `packageJson.ts`'s reconciliation above). This is a regression from run-16, which used the `relative` parameter for `loadPackageYAML` and `pkg.relative` for `writePackageYAML` (both CDQ-007-clean, no advisory needed) — run-17 now exposes absolute local filesystem paths (potentially containing the developer's home-directory username) at all four sites. The agent's own tool-generated advisories (`packageYaml.instrumentation.md`) flagged only 3 of these 4 occurrences (lines 31, 56, 88) and, per the instrumentation.md's own recommendation, left them unfixed rather than swapping to `basename()`/relative path; the 4th occurrence (line 143, `writePackageYAML`) wasn't even flagged by the tool, despite `pkg.relative` being available in scope exactly as it was used in run-16 |
| CDQ-011 | PASS — `trace.getTracer('taze')` literal matches canonical tracer name |

**Failures**: SCH-003 (Important) — `taze.check.packages_loaded` cast via `String(deps.length)` at line 109; count value forced into a string-typed schema field, per this run's pre-committed exemption-scope decision. After reconciliation, CDQ-007 is not scored as a failure, but the absolute-path regression at lines 31, 56, 88, 143 (run-16 used relative paths at 2 of these 4 sites; line 143 was never even flagged by the agent's own advisory pass) remains worth noting as a quality observation outside the rubric's literal scope.

---

### 8. src/io/packages.ts (5 spans)

**Spans**: `taze.io.read_json`, `taze.io.write_json`, `taze.io.write_package`, `taze.io.load_package`, `taze.io.load_packages`
**vs run-16**: Span count unchanged (5), same function coverage (readJSON, writeJSON, writePackage, loadPackage, loadPackages). Attempts dropped from 2 (run-16) to 1 (run-17, clean first pass, 0 validation errors). Attribute naming shifted: run-16 used `taze.package.file_path` (readJSON, loadPackage) and `taze.write.file_path` (writeJSON); run-17 uses a single `taze.io.file_path` for readJSON/writeJSON/loadPackage instead, reserving `taze.write.file_path` only for writePackage. Confirmed via `/tmp/taze-run17/semconv/attributes.yaml` that `taze.package.file_path` no longer exists in the current registry at all — `taze.io.file_path` is a schema extension (`agent-extensions.yaml:30`) that this run's agent established earlier (in `bunWorkspaces.ts`, log line 456) and reused consistently across every later file, including this one. This is a run-wide schema-naming change, not a defect introduced by this file's own agent. `taze.config.sources_found` remains a raw int (`packagesNames.length`, line 228) in both runs — no SCH-003 String()-cast issue here, matching the exemption doc's "not ambiguous — clean pass" bunWorkspaces pattern.
**Attempts**: 1 (per `packages.instrumentation.md` and log line ~786, "Attempt 1: 0 errors")
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — agent notes confirm all original imports, signatures, and the inner empty catch in `loadPackage` preserved verbatim; only instrumentation lines added |
| NDS-006 | PASS — ESM `import` syntax used throughout, matching project module system |
| API-001 | PASS — line 1 imports only `trace`, `SpanStatusCode` from `@opentelemetry/api` |
| NDS-004 | PASS — all 5 exported function signatures (`readJSON`, `writeJSON`, `writePackage`, `loadPackage`, `loadPackages`) unchanged |
| NDS-005 | PASS — inner `catch { /* fallback */ }` at lines 126-128 in `loadPackage` is pre-existing graceful-degradation logic (silent catch, no rethrow); agent left it untouched, consistent with NDS-005b |
| COV-001 | PASS — all 5 exported functions (readJSON:19, writeJSON:34, writePackage:52, loadPackage:86, loadPackages:142) wrapped in `startActiveSpan` |
| COV-002 | N/A — no outbound HTTP/DB/queue calls in this file, only local fs I/O |
| COV-003 | PASS — all 5 outer spans have `recordException` + `setStatus({code: SpanStatusCode.ERROR})` in their catch blocks (lines 24-26, 42-44, 76-78, 132-134, 230-232) |
| COV-004 | PASS — all 5 functions are `async` with `await` and are spanned |
| COV-005 | PASS — domain attributes present per span: readJSON/writeJSON/loadPackage → `taze.io.file_path`; writePackage → `taze.write.package_type`, `taze.write.file_path`; loadPackages → `taze.check.recursive`, `taze.config.sources_found` |
| COV-006 | N/A — no OTel auto-instrumentation package covers `node:fs` calls in this project |
| RST-001 | PASS — no spans on synchronous/trivial utility functions |
| RST-002 | PASS — no spans on accessors |
| RST-003 | Advisory, not FAIL — `readJSON` (lines 19-32) is a near-thin wrapper (`JSON.parse(await fs.readFile(...))`); same shape flagged as advisory-only in run-16 ("observability value defensible"), consistent judgment carried forward |
| RST-004 | PASS — all 5 instrumented functions are exported (public API), and `loadPackage`'s I/O nature would exempt it regardless |
| RST-005 | PASS — no pre-existing tracer/span calls in the original source |
| SCH-001 | PASS (registry-extension mode) — all 5 span names registered as schema extensions in `agent-extensions.yaml:122-145`, following the `taze.<category>.<operation>` dotted convention |
| SCH-002 | PASS — all attribute keys (`taze.io.file_path`, `taze.write.file_path`, `taze.write.package_type`, `taze.check.recursive`, `taze.config.sources_found`) exist in the registry at the time this file was processed |
| SCH-003 | PASS — types match: `taze.io.file_path`/`taze.write.file_path` (string) set from string variables; `taze.write.package_type` (enum) set from `pkg.type`; `taze.check.recursive` (boolean) set via `options.recursive ?? false`; `taze.config.sources_found` (int) set from `packagesNames.length`, a raw int with no `String()` cast — does not trigger the exemption-scope SCH-003 override (that override applies only to `String(<expr>.length)`-style casts) |
| SCH-004 | PASS — `taze.io.file_path` is not a redundant new entry for this file; it was already established as a schema extension earlier in this same run (`bunWorkspaces.ts`) and is being consistently reused, not reinvented |
| CDQ-001 | PASS — all 5 `startActiveSpan` calls have `span.end()` in a `finally` block (lines 28-30, 46-48, 80-82, 136-138, 234-236) |
| CDQ-002 | PASS — `tracer.getTracer('taze')` (line 17) matches project identity |
| CDQ-003 | PASS — all outer catches use `span.recordException(...)` + `span.setStatus({code: SpanStatusCode.ERROR})`; inner silent catch in `loadPackage` correctly left unmodified per NDS-005b |
| CDQ-005 | PASS — `startActiveSpan` callback pattern used throughout; context propagation automatic |
| CDQ-006 | PASS — all `setAttribute` value expressions are trivial property/variable access (`filepath`, `pkg.type`, `pkg.filepath`, `options.recursive ?? false`, `packagesNames.length`); none involve method chains, `.map`/`.reduce`/`.filter`, or `JSON.stringify`, so no `isRecording()` guard is required |
| CDQ-007 | PASS under rubric's literal mechanism — `taze.io.file_path`/`taze.write.file_path` are raw absolute/relative paths (lines 22, 37, 60, 93), but the rubric's CDQ-007 mechanism only flags object spreads, `JSON.stringify` of request/response objects, unbounded arrays, or PII-pattern keys — "file_path" matches none of those. Confirmed correct on reconciliation (see top-of-file note) — `packageJson.ts`/`packageYaml.ts`'s FAIL verdicts on the identical pattern were the ones corrected, not this file |
| CDQ-011 | PASS — `getTracer('taze')` matches both `package.json#name` and the Weaver registry manifest `name` field |

**Failures**: None. Two advisory-only notes carried forward with no rubric impact: (1) RST-003 on `readJSON` — thin-wrapper shape, judged non-canonical-FAIL consistent with run-16; (2) the instrumentation tool's own CDQ-007 advisory is internally inconsistent (flags 2 of 4 identical raw-path attribute sites).

---

### 9. src/io/pnpmWorkspaces.ts (2 spans)

**Spans**: `taze.io.load_pnpm_workspace`, `taze.io.write_pnpm_workspace`
**vs run-16**: Span count unchanged (2), but span names reverted to the pre-run-16 namespace: `taze.package.load_pnpm_workspace` → `taze.io.load_pnpm_workspace`; `taze.write.pnpm_workspace` → `taze.io.write_pnpm_workspace`. Attribute set also changed: run-16's `taze.catalog.count` (raw int, `catalogs.length`) is gone, replaced by `taze.check.packages_loaded` set via `String(catalogs.length)` (line 64) — a count coerced to a string. Per the exemption-scope doc's SCH-003 section (which names this exact file/attribute as one of the two ambiguous cases, alongside `checkGlobal.ts`), the schema declares `taze.check.packages_loaded` as `type: string`, so code and schema agree literally, but the pre-committed decision is to flag this as an **SCH-003 violation anyway** — a regression from run-16's PASS on the equivalent count attribute. Run-16's `taze.package.name` attribute is also dropped in run-17; a new `taze.write.package_type` (literal `'pnpm-workspace.yaml'`) is added instead. The CDQ-006 guard recovery from run-16 (`if (span.isRecording())` around `Object.keys(versions).length`, lines 85-87) is preserved in run-17 — still PASS, not a regression.
**Attempts**: 2 (run-16 needed only 1). Attempt 1 failed NDS-008 (Invalid Regex Flag Syntax) — the agent emitted `/\./ g` (stray space) instead of `/\./g` in the `.split()` call on line 99; attempt 2 fixed it. Final committed code has the correct `/\./g` (line 99).
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility.

| Rule | Result |
|------|--------|
| NDS-001 | PASS — final code compiles; attempt 1's regex-flag bug (NDS-008) was caught and fixed before commit |
| NDS-003 | PASS — only instrumentation additions (imports, tracer, span wrapper, `setAttribute`/`recordException`/`setStatus`/`end`); original conditional/for-loop structure preserved verbatim |
| API-001 | PASS — only `@opentelemetry/api` imported (`trace`, `SpanStatusCode`) |
| API-004 | PASS — no `@opentelemetry/sdk-*`/`exporter-*`/`instrumentation-*` imports |
| NDS-006 | PASS — ESM import/export syntax matches project `"type": "module"` |
| NDS-004 | PASS — `loadPnpmWorkspace`, `writePnpmWorkspace`, `writeYaml` signatures all unchanged |
| NDS-005 | PASS — no pre-existing error handling in original source; new try/catch/finally is instrumentation-added |
| COV-001 | PASS — both exported async entry points (`loadPnpmWorkspace`, `writePnpmWorkspace`) have spans |
| COV-002 | PASS — `readFile` (line 20) covered inside `taze.io.load_pnpm_workspace`; `writeFile` (via `writeYaml`, line 106/119) covered inside `taze.io.write_pnpm_workspace` |
| COV-003 | PASS — both spans record `recordException` + `setStatus({code: ERROR})` in catch (lines 67-68, 109-110) |
| COV-004 | PASS — both async functions with `await` (file read/write) are spanned |
| COV-005 | PASS (presence only) — `load_pnpm_workspace`: `taze.io.file_path`, `taze.check.packages_loaded`; `write_pnpm_workspace`: `taze.write.file_path`, `taze.write.package_type`, `taze.write.changes_count` |
| COV-006 | N/A — no auto-instrumentation library covers `node:fs/promises` `readFile`/`writeFile` |
| RST-001 | PASS — `createPnpmWorkspaceEntry` (unexported, synchronous, no I/O) correctly not spanned |
| RST-002 | PASS — no accessor spans |
| RST-003 | PASS — `writeYaml` (single-expression wrapper delegating to `writeFile`, lines 118-120) correctly not spanned |
| RST-004 | PASS — only exported functions spanned; `createPnpmWorkspaceEntry` correctly excluded |
| RST-005 | PASS — no pre-existing tracer calls in original source |
| SCH-001 | PASS (registered as new extension) — but note naming drift vs. run-16's already-established `taze.package.*`/`taze.write.pnpm_workspace` extensions; span-name churn across runs is a schema-stability concern worth flagging even though it doesn't violate SCH-001 in isolation |
| SCH-002 | PASS — all attribute keys (`taze.io.file_path`, `taze.check.packages_loaded`, `taze.write.file_path`, `taze.write.package_type`, `taze.write.changes_count`) registered in schema |
| SCH-003 | **FAIL** — `taze.check.packages_loaded` set via `String(catalogs.length)` (line 64). Per the exemption-scope pre-commitment, this is scored as a violation regardless of the schema declaring `type: string` for this attribute, because the underlying JS value is a `.length`-derived count |
| SCH-004 | PASS — no obvious duplicate/near-synonym attribute keys within this file's five attributes |
| CDQ-001 | PASS — both spans use `startActiveSpan` callback pattern with `span.end()` in `finally` (lines 70-72, 112-114) |
| CDQ-002 | PASS — `trace.getTracer('taze')` (line 9) matches project name |
| CDQ-003 | PASS — both catches use `span.recordException(error instanceof Error ? error : new Error(String(error)))` + `span.setStatus({ code: SpanStatusCode.ERROR })` |
| CDQ-005 | PASS — `startActiveSpan` callback pattern; async context propagation automatic |
| CDQ-006 | PASS — `Object.keys(versions).length` (line 86) guarded with `if (span.isRecording())` (line 85); `String(catalogs.length)` (line 64) is exempt per the rubric's literal trivial-conversion exemption |
| CDQ-007 | PASS with advisory — instrumentation.md flags line 19 (`taze.io.file_path`, an absolute filesystem path) as a candidate for `basename()` instead of the raw path; not PII, bounded cardinality by project file count, consistent with run-16's same advisory treatment on the equivalent attribute |
| CDQ-011 | PASS — tracer name `'taze'` matches the project's canonical name |

**Failures**: SCH-003 FAIL on `taze.check.packages_loaded` (`String(catalogs.length)`, line 64) — a regression vs. run-16's PASS on the equivalent attribute (`taze.catalog.count`, stored as raw int), scored per the exemption-scope doc's explicit, pre-committed decision. All other rules PASS or N/A. Two attempts were needed due to an NDS-008 regex-flag bug introduced in attempt 1 and fixed in attempt 2 (not present in the final committed code).

---

### 10. src/io/resolves.ts (6 spans)

**Spans**: `taze.io.load_cache`, `taze.io.dump_cache`, `taze.fetch.get_package_data`, `taze.check.resolve_dependency`, `taze.check.resolve_dependencies`, `taze.check.resolve_package`
**vs run-16**: Same span count (6) and same instrumented functions (`loadCache`, `dumpCache`, `getPackageData`, `resolveDependency`, `resolveDependencies`, `resolvePackage`), but 4 of 6 span names changed from run-16's registered names: `taze.io.get_package_data`→`taze.fetch.get_package_data`, `taze.resolve.dependency`→`taze.check.resolve_dependency`, `taze.resolve.dependencies`→`taze.check.resolve_dependencies`, `taze.resolve.package`→`taze.check.resolve_package`. Confirmed in `/tmp/taze-run17/semconv/agent-extensions.yaml` lines 167-186: the old run-16 names are gone entirely (not duplicated, replaced), and the new names are freshly declared as "Agent-discovered span" entries. The agent's own `resolves.instrumentation.md` notes claim "no existing schema span matches" for these four operations — that claim is false; run-16 had already registered matching operations for the exact same functions under different names. This produced 4 SCH-001 advisory findings. Attribute-level regression: `resolveDependency` dropped `taze.package.update_available` (present in run-16, still registered in `attributes.yaml` as boolean, but no longer set anywhere in the code). `resolvePackage`'s `taze.package.deps_count` was also retired and replaced by reusing `taze.check.packages_total`. **Stability assessment for #954/#958**: the NDS-001 oscillation itself looks resolved — run-15 failed to compile (2 attempts, 0 spans), run-16 recovered (6 spans, 2 attempts), and run-17 now succeeds on the first attempt with 0 validation errors. That is genuine forward progress on the specific syntax-oscillation problem tracked by #954/#958. However, a *different* fragility surfaced in its place: schema-naming instability across runs (SCH-001) and a lost domain attribute (COV-005) that weren't problems in run-16. Net read: "stable" for the compilation/gate dimension specifically; "still fragile" for the file's overall instrumentation quality, since the agent isn't converging on a consistent schema for this file run-over-run even once syntax stabilized.
**Attempts**: 1 (per `resolves.instrumentation.md` "Attempts: 1 (initial-generation)" and run log, `✅ SUCCESS — 6 spans, 0 attributes`) — improved from run-16's 2 attempts.
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility.

| Rule | Result |
|------|--------|
| NDS-001 | PASS — 0 validation errors on attempt 1 |
| NDS-003 | PASS — diff limited to tracer import, span wrapping, and setAttribute/recordException calls; no business logic lines changed |
| API-001 | PASS — line 1 imports only `trace`, `SpanStatusCode` from `@opentelemetry/api` |
| NDS-006 | PASS — ESM import/export syntax consistent with project |
| NDS-004 | PASS — all 6 exported function signatures unchanged from pre-instrumentation |
| NDS-005 | PASS — inner try/catch structures preserved: `getPackageData`'s try/catch (lines 117-129), `resolveDependency`'s catch (line 324) and trailing `catch {}` (line 361), and `dumpCache`'s inner catch (lines 79-82) are all structurally identical to run-16 |
| COV-001 | PASS — all 6 exported async entry points receive spans |
| COV-002 | PASS — `getPackageData` wraps `fetchJsrPackageMeta`/`fetchPackage` (registry HTTP calls), line 119 |
| COV-003 | PASS — all 6 catch blocks record `recordException` + `setStatus(ERROR)` (lines 54-57, 84-87, 138-141, 372-375, 417-420, 441-444) |
| COV-004 | PASS — all 6 spanned functions are `async` with `await` I/O calls |
| COV-005 | **FAIL** — `resolveDependency` (lines 250-253) sets only `taze.package.name` and `taze.package.current_version`, dropping `taze.package.update_available` — a boolean attribute still registered in `attributes.yaml`, present in run-16's instrumentation of this same span, now unset anywhere in the file |
| COV-006 | N/A — no auto-instrumentation library covers npm/JSR registry HTTP or filesystem cache I/O in this project |
| RST-001 | PASS — `now`, `ttl`, `getVersionOfRange`, `updateTargetVersion`, `getDiff`, `isUrlPackage`, `isLocalPackage`, `isAliasedPackage` all correctly left unspanned |
| RST-002 | PASS — no accessor spans |
| RST-003 | PASS — no thin-wrapper spans |
| RST-004 | PASS — `parseAliasedPackage` correctly excluded: unexported, no I/O, called only from within already-spanned `resolveDependency` |
| RST-005 | PASS — no pre-existing tracer calls in original source |
| SCH-001 | **RECONCILED: PASS (naming-quality fallback)** — 4 of 6 span names do not match run-16's registered names for these functions, but run-16's schema extensions never merged to main (eval branches don't merge per this project's convention), so they are not part of the registry SCH-001 actually resolves against for run-17. Originally scored FAIL by this file's evaluator, comparing against run-16's baseline rather than the currently resolved registry; corrected on reconciliation to match how every other file in this run treated the identical cross-run naming-drift pattern (PASS via naming-quality fallback, e.g. `pnpmWorkspaces.ts`, `packageJson.ts`, `packageYaml.ts`, `packument.ts`). The underlying schema-naming instability across runs is still a real quality concern, just not a rubric-literal SCH-001 violation |
| SCH-002 | PASS — all attribute keys used are registered in `agent-extensions.yaml`/`attributes.yaml` |
| SCH-003 | PASS — no `String()`-cast counts in this file; `taze.check.packages_total`/`taze.check.packages_outdated` are raw `.length`/`.filter().length` ints matching the registry's declared `type: int` — not one of the exemption-scope's flagged cast cases |
| SCH-004 | PARTIAL — no new near-duplicate keys within this run, but `taze.package.deps_count` (run-16's registered attribute for this exact quantity on `resolvePackage`) was silently retired and replaced by reusing `taze.check.packages_total`; combined with the SCH-001 span renames, this is schema churn rather than a clean redundancy case |
| CDQ-001 | PASS — all 6 spans use `startActiveSpan` callback pattern with `span.end()` in `finally` |
| CDQ-002 | PASS — `trace.getTracer('taze')` (line 19) matches project name |
| CDQ-003 | PASS — all catch blocks use `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })` |
| CDQ-005 | PASS — `startActiveSpan` callback pattern manages context automatically throughout |
| CDQ-006 | PASS — `dumpCache`'s basename computation (line 72) and both `.filter().length` computations (lines 413, 437) are guarded by `span.isRecording()` |
| CDQ-007 | PASS — no PII keys, no unbounded object/array attributes; `taze.io.file_path` is sanitized to basename per CDQ-007 guidance (line 72) |
| CDQ-011 | PASS — `trace.getTracer('taze')` matches canonical tracer name |

**Failures**: COV-005 — `resolveDependency` lost the registered `taze.package.update_available` attribute present in run-16. After reconciliation, SCH-001 is not scored as a failure (see reconciled row above), but the underlying span-naming drift is still real and contradicted by the agent's own incorrect claim that no matching schema span existed. SCH-004 marked PARTIAL — `taze.package.deps_count` was retired/replaced rather than flagged as a duplicate, reflecting the same underlying schema-naming instability rather than a rubric-literal redundant-entry violation.

---

### 11. src/io/yarnWorkspaces.ts (2 spans)

**Spans**: `taze.io.load_yarn_workspace`, `taze.io.write_yarn_workspace`
**vs run-16**: Same 2 functions instrumented (`loadYarnWorkspace`, `writeYarnWorkspace`), same span count. Span names drifted: run-16 registered `span.taze.package.load_yarn_workspace` / `span.taze.write.yarn_workspace`; run-17 registered `span.taze.io.load_yarn_workspace` / `span.taze.io.write_yarn_workspace` — different naming convention for the same two operations across runs. **Count attribute regressed from PASS to FAIL on SCH-003**: run-16 set the catalog-count attribute (`taze.catalog.count`) as a raw int and passed SCH-003 cleanly. Run-17 sets the equivalent attribute (renamed `taze.io.catalogs_count`) via `String(catalogs.length)` (line 58) against a schema that declares it `type: int` (`agent-extensions.yaml:34-37`) — a literal SCH-003 type mismatch, distinct from (and more clear-cut than) the schema-laundering pattern seen elsewhere; the exemption-scope doc explicitly names this file as "not ambiguous — literal mismatch, clear violation," confirmed on inspection. **File-path attribute reused instead of the write-specific key**: run-16 used `taze.write.file_path` for the write operation; run-17 reuses the generic `taze.io.file_path` key for *both* load and write, even though the pre-existing registry already defines a write-specific `taze.write.file_path` that run-16 used correctly at this exact call site. Attempts dropped from 2 (run-16 hit a regex-syntax bug) to 1.
**Attempts**: 1 (per `yarnWorkspaces.instrumentation.md` Validation Journey: "Attempt 1: 0 errors")
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility.

| Rule | Result |
|------|--------|
| NDS-001 | PASS — 0 compilation errors on attempt 1 |
| NDS-003 | PASS — diff is import additions, tracer acquisition, span wrapping, and `setAttribute` calls only; no business-logic lines changed |
| API-001 | PASS — only `trace`, `SpanStatusCode` imported from `@opentelemetry/api` (line 1) |
| NDS-006 | PASS — ESM import/export syntax, consistent with project `"type": "module"` |
| NDS-004 | PASS — `loadYarnWorkspace` and `writeYarnWorkspace` signatures unchanged |
| NDS-005 | PASS — no pre-existing try/catch/finally restructured; both functions get new try/catch/finally wrapping span lifecycle with re-throw (lines 17-66, 75-111) |
| COV-001 | PASS — both exported async entry points (`loadYarnWorkspace` line 11, `writeYarnWorkspace` line 70) receive spans |
| COV-002 | PASS — `readFile` (line 20) and `writeFile` (via `writeYaml`, line 115) I/O calls are within the spanned scope |
| COV-003 | PASS — both spans call `span.recordException(...)` + `span.setStatus({ code: SpanStatusCode.ERROR })` in catch blocks (lines 61-62, 105-106) |
| COV-004 | PASS — both async I/O entry points are spanned |
| COV-005 | PASS — `load_yarn_workspace` carries `taze.io.file_path`, `taze.io.catalogs_count`; `write_yarn_workspace` carries `taze.io.file_path`, `taze.package.name`, `taze.write.package_type`, `taze.write.changes_count` |
| COV-006 | N/A — no auto-instrumentation library covers YAML file I/O or yarn workspace management |
| RST-001 | PASS — `createYarnWorkspaceEntry` (unexported, synchronous, no I/O) correctly left unspanned |
| RST-002 | N/A — no accessor methods in this file |
| RST-003 | PASS — `writeYaml` (exported single-statement wrapper around `writeFile`) correctly excluded |
| RST-004 | PASS — `createYarnWorkspaceEntry` unexported with no I/O, correctly excluded |
| RST-005 | PASS — no pre-existing tracer calls in original source |
| SCH-001 | PASS (naming-quality fallback mode) — no registry operation name pre-existed for either function; both new span names follow bounded, `verb_object`-style convention with no embedded dynamic values |
| SCH-002 | PASS — `taze.io.file_path`, `taze.io.catalogs_count` are registered agent extensions; `taze.package.name`, `taze.write.package_type`, `taze.write.changes_count` are pre-existing registry attributes |
| SCH-003 | **FAIL** — `taze.io.catalogs_count` is set via `String(catalogs.length)` (line 58) against a schema-declared `type: int`. Per the exemption-scope pre-commitment for this run, this is scored as a literal violation — schema and code disagree outright, no laundering involved |
| SCH-004 | **FAIL** — `taze.io.file_path` (newly agent-registered) is used for the write operation (line 76) where the pre-existing, more specific `taze.write.file_path` attribute already exists in the registry and was the correct choice used by this exact call site in run-16. Token overlap (`{io,file,path}` vs `{write,file,path}`, Jaccard 0.5) plus identical semantic role make this a near-duplicate schema entry for the write context |
| CDQ-001 | PASS — both spans use `startActiveSpan` callback pattern with `span.end()` in `finally` (lines 64-66, 108-110) |
| CDQ-002 | PASS — `trace.getTracer('taze')` matches project name |
| CDQ-003 | PASS — both catch blocks use `recordException` + `setStatus({ code: SpanStatusCode.ERROR })`, no ad-hoc error attributes |
| CDQ-005 | PASS — `startActiveSpan` callback pattern; context propagation automatic |
| CDQ-006 | PASS — `String(catalogs.length)` is an exempt trivial type conversion per the rubric's literal exemption list; `Object.keys(versions).length` (line 82) is correctly guarded with `if (span.isRecording())` (line 81) |
| CDQ-007 | PASS under the literal rubric mechanism — no PII-pattern attribute keys; `taze.io.file_path` values are raw package-manifest paths. Confirmed correct on reconciliation (see top-of-file note) — agrees with `packages.ts`; `packageJson.ts`/`packageYaml.ts`'s FAIL verdicts on the identical pattern were the ones corrected |
| CDQ-011 | PASS — tracer name `'taze'` is a literal string matching the canonical project name |

**Failures**: SCH-003 (`taze.io.catalogs_count` cast with `String()` against an int-typed schema attribute — literal type mismatch, confirmed by direct inspection of both the code and the schema) and SCH-004 (`taze.io.file_path` reused for the write path, duplicating the pre-existing, more specific `taze.write.file_path` attribute that run-16 used correctly at the same call site). Both are regressions relative to run-16, which passed SCH-003 and SCH-004 cleanly for the analogous attributes on this same file.

---

### 12. src/api/check.ts (2 spans)

**Spans**: `taze.check.packages`, `taze.check.single_project`
**vs run-16**: Span count and names unchanged. Attribute set regressed on two points: (1) `CheckSingleProject`'s change-count attribute reverted from run-16's `taze.check.packages_outdated` (a run-16 semantic improvement) back to `taze.write.changes_count` (line 95) — the same regression run-16 explicitly called out as fixed, now undone. Still type-correct (raw int matching registry `type: int`), so this is a COV-005 semantic regression, not an SCH-003 violation. (2) Run-16 also set `taze.package.file_path` on `CheckSingleProject`; run-17 drops this attribute entirely, leaving only `taze.package.name`. `CheckPackages`'s attributes (`taze.check.mode`, `taze.check.recursive`, `taze.check.write_mode`, `taze.check.packages_total`) are unchanged from run-16.
**Attempts**: 1 (per `check.instrumentation.md` header and log, single "Attempt 1" block, 0 validation errors)
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — diff is limited to import, tracer acquisition, span lifecycle, and the try/finally wrapper; no business logic altered |
| NDS-004 | PASS — `CheckPackages` and `CheckSingleProject` signatures unchanged |
| NDS-005 | PASS — neither function had pre-existing try/catch/finally; the new wrapping is instrumentation-added, not a restructuring |
| NDS-006 | PASS — ESM `import`/`export` syntax matches project module system |
| API-001 | PASS — only `trace`/`SpanStatusCode` imported from `@opentelemetry/api` |
| COV-001 | PASS — `CheckPackages` (exported async entry point) instrumented with `taze.check.packages` span |
| COV-002 | N/A — no direct outbound HTTP/DB call sites in this file |
| COV-003 | PASS — both spans record errors via `recordException` + `setStatus({ code: SpanStatusCode.ERROR })` |
| COV-004 | PASS — `CheckSingleProject` (unexported async, I/O via `resolvePackage`/`writePackage`) is instrumented |
| COV-005 | PARTIAL — `taze.check.single_project` has only 2 attributes (name, changes_count) — down from run-16's 3 (name, file_path, packages_outdated) on the same span. The dropped `file_path` attribute and the reverted change-count key both reduce per-package diagnostic context vs. the run-16 baseline |
| COV-006 | N/A — no auto-instrumentation library covers this package-resolution/file-write API |
| RST-001 | PASS — no spans on synchronous utility functions |
| RST-002 | PASS — no spans on accessors |
| RST-003 | PASS — no spans on thin wrappers |
| RST-004 | PASS — `CheckSingleProject` is unexported but performs I/O; qualifies for the I/O exemption |
| RST-005 | PASS — no pre-existing tracer/span calls in original source |
| API-004 | PASS — no `@opentelemetry/sdk-*`/`exporter-*`/`instrumentation-*` imports |
| SCH-001 | PASS — both spans declared as schema extensions; legitimately new operation names, not a defect |
| SCH-002 | PASS — all attribute keys registered: `taze.check.mode`, `taze.check.recursive`, `taze.check.write_mode`, `taze.check.packages_total`, `taze.package.name`, `taze.write.changes_count` |
| SCH-003 | PASS — `taze.check.packages_total`/`taze.write.changes_count` set as raw ints matching registry `type: int`, no `String()` cast — not one of the three ambiguous cast cases named in `exemption-scope.md` |
| SCH-004 | PASS — no new attribute keys added this run; no redundant schema entries introduced |
| CDQ-001 | PASS — both `startActiveSpan` calls have `span.end()` in a `finally` block |
| CDQ-002 | PASS — `trace.getTracer('taze')` matches `package.json#name` |
| CDQ-003 | PASS — both catch blocks use `recordException` + `setStatus(ERROR)`, not ad-hoc attributes |
| CDQ-005 | PASS — `startActiveSpan` callback pattern; context propagation automatic |
| CDQ-006 | PASS — all `setAttribute` calls use direct property accesses with no method chains or serialization requiring a guard |
| CDQ-007 | PASS — neither flagged line (37, 95) is a PII attribute name or a filesystem path; the instrumentation report's own CDQ-007 advisories at these lines appear to be false positives. Optional/nullable attributes are all guarded with `!= null` checks |
| CDQ-011 | PASS — `trace.getTracer('taze')` matches the project's canonical tracer name |

**Failures**: None outright, but two regressions vs. the run-16 baseline: (1) COV-005 (PARTIAL) — `CheckSingleProject`'s change-count attribute reverted to a less semantically accurate key and `taze.package.file_path` was dropped entirely, reducing per-package diagnostic context; (2) the CDQ-007 advisory findings in the instrumentation report appear to be false positives, worth noting in the run's advisory-accuracy tally.

---

### 13. src/utils/packument.ts (2 spans)

**Spans**: `taze.fetch.npm_package`, `taze.fetch.jsr_package_meta`
**vs run-16**: Span names changed again — run-16 used `taze.fetch.package`/`taze.fetch.jsr_package`; run-17 uses `taze.fetch.npm_package`/`taze.fetch.jsr_package_meta` (both registered as new schema extensions). Third distinct naming pair across runs for this file — a recurring naming-instability pattern, though each individual name is a valid dotted-notation extension, not a rule violation on its own. **TAZE-RUN3-1 / COV-005 resolution: RESOLVED on both spans.** `taze.package.latest_version` (a pre-existing registered attribute) is now set on both fetch spans: npm span (`fetchPackage`, line 76) via `result.tags.latest`, guarded by `if (result.tags != null)`, sourced from the actual npm fetch response (`data.distTags` via `toPackageData`); JSR span (`fetchJsrPackageMeta`, line 107) via `meta.latest`, set unconditionally because `latest` is a required (non-optional) field on `JsrPackageMeta`, so no guard is needed. Both fetch functions now genuinely expose the resolved latest version, sourced correctly from each function's own fetch result, closing the run-16 gap.
**Attempts**: 1 (per instrumentation report and log: "Attempts: 1 (initial-generation)")
**Trace supplement**: Not independently verified in this pass; trace supplementation is the coordinating session's responsibility.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — diff is import + tracer + span/attribute/error-handling additions only; no non-instrumentation lines changed |
| API-001 | PASS — only `trace`, `SpanStatusCode` imported from `@opentelemetry/api` |
| NDS-006 | PASS — ESM import/export syntax throughout, consistent with project module system |
| NDS-004 | PASS — `fetchPackage`/`fetchJsrPackageMeta` signatures unchanged |
| NDS-005 | PASS — try/catch/finally wrapping is new instrumentation; no pre-existing error handling restructured |
| COV-001 | PASS — both exported async entry points instrumented |
| COV-002 | PASS — `taze.fetch.npm_package` wraps the npm registry fetch; `taze.fetch.jsr_package_meta` wraps the JSR registry fetch; both cover outbound HTTP calls |
| COV-003 | PASS — both catch blocks call `recordException` + `setStatus({ code: SpanStatusCode.ERROR })` |
| COV-004 | PASS — both are async functions performing network I/O and are spanned |
| COV-005 | PASS (resolved) — `taze.package.name`, `taze.fetch.registry`, and now `taze.package.latest_version` are present on both spans; `taze.fetch.force` is a deliberate, justified new extension for `fetchPackage`'s force-refresh flag |
| COV-006 | N/A — no auto-instrumentation library covers npm/JSR registry HTTP fetches |
| RST-001 | PASS — `toPackageData` (unexported pure sync transform, no I/O) correctly left uninstrumented |
| RST-002 | PASS — no accessor spans |
| RST-003 | PASS — `fetchWithUserAgent` (thin wrapper delegating to `ofetch`) correctly excluded |
| RST-004 | PASS — `fetchWithUserAgent` is unexported; I/O boundary value is captured at the calling spans instead |
| RST-005 | PASS — no pre-existing tracer/span calls in original source |
| SCH-001 | PASS — both span names declared as registered extensions; naming churn across runs noted above as a quality observation, not a rule failure |
| SCH-002 | PASS — all attribute keys registered: `taze.package.name`, `taze.fetch.registry`, `taze.package.latest_version` (pre-existing), `taze.fetch.force` (registered extension) |
| SCH-003 | PASS — no count/length-derived value is cast to string anywhere in this file; the exemption-scope SCH-003 override does not apply here |
| SCH-004 | PASS — `taze.fetch.force` was deliberately checked against `taze.cache.hit`/`taze.cache.changed` and found semantically distinct; no redundant entries introduced |
| CDQ-001 | PASS — both spans use `startActiveSpan` callback pattern with `span.end()` in `finally` |
| CDQ-002 | PASS — `trace.getTracer('taze')` matches project identity |
| CDQ-003 | PASS — both catch blocks use `recordException` + `setStatus(ERROR)`, no ad-hoc error attributes |
| CDQ-005 | PASS — `startActiveSpan` callback pattern; context propagation automatic |
| CDQ-006 | PASS — `result.tags.latest` and `meta.latest` are trivial property accesses, exempt per the rubric's literal exemption text; no guard required |
| CDQ-007 | PASS — no PII field names, no unbounded objects/arrays, no unguarded optional/nullable access: `meta.latest` is a required field, and `result.tags.latest` is guarded by `result.tags != null`. The instrumentation report's own CDQ-007 advisory at line 107 appears to be a false positive — neither PII nor a filesystem path applies to `taze.package.latest_version` |
| CDQ-011 | PASS — `trace.getTracer('taze')` matches the project's canonical tracer name |

**Failures**: None. **COV-005/TAZE-RUN3-1 is fully resolved on both fetch spans**, correctly sourced from each fetch function's actual result data — this is the run's primary investigation target and it comes back clean. Two non-blocking observations: (1) span naming has changed on every run for this file (run-15 → run-16 → run-17), a naming-stability quality concern worth flagging at the run level; (2) the agent's own CDQ-007 advisory finding at line 107 appears to be a false positive.

---

## Correct-Skip Verification (20 files)

For each file the run summary labels a "correct skip" (0 spans, 0 attributes), grepped that file's own pre-scan block in `spiny-orb-output.log` for a COV-001/COV-004 flag the final output didn't act on — a file that flags its own need for a span and then skips anyway with unrelated boilerplate justification is a "questionable skip," not a confirmed correct one.

**Files checked**: `src/addons/index.ts`, `src/addons/vscode.ts`, `src/cli.ts`, `src/constants.ts`, `src/index.ts`, `src/io/dependencies.ts`, `src/types.ts`, `src/utils/context.ts`, `src/utils/dependenciesFilter.ts`, `src/utils/config.ts`, `src/utils/diff.ts`, `src/filters/diff-sorter.ts`, `src/render.ts`, `src/log.ts`, `src/utils/package.ts`, `src/utils/sha.ts`, `src/utils/time.ts`, `src/commands/check/render.ts`, `src/utils/sort.ts`, `src/utils/versions.ts`.

**Result**: 0 of 20 blocks contain a self-flagged COV-001/COV-004 need. Every block's pre-scan note states an explicit, on-point reason for skipping (e.g., `src/addons/index.ts`: "Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made."). None fall back to unrelated boilerplate after flagging their own need for a span. All 20 are confirmed correct skips.

---

## Reconciliation Pass Summary

Completed after all 13 committed files were scored. Two cross-file rule-verdict disagreements were found and resolved (see "RECONCILED" markers in the per-file sections above and the tracking note at the top of this file):

1. **CDQ-007 on raw filesystem paths** — `packageJson.ts` and `packageYaml.ts` originally scored FAIL/advisory; corrected to PASS. The rubric's literal CDQ-007 mechanism (object spreads, `JSON.stringify` of req/response objects, unbounded arrays, PII-pattern keys) does not cover raw filesystem paths. `packages.ts` and `yarnWorkspaces.ts` had the correct reading from the start.
2. **SCH-001 on renamed previously-registered spans** — `resolves.ts` originally scored FAIL; corrected to PASS (naming-quality fallback). SCH-001 compares against the currently resolved registry, not a prior run's baseline, and run-16's schema extensions never merged to main. `pnpmWorkspaces.ts` and every other file with cross-run span-name drift had the correct reading from the start.

**Rule-ID label audit**: every FAIL/PARTIAL row across all 13 files was checked against its rule's canonical rubric definition during the reconciliation pass (not a sample) — no additional mislabeled rows were found beyond the two corrected above.

**Fix-verification confirmation** (supersedes the Findings Discussion checkpoint's provisional read):
- **COV-005 (packument.ts)**: RESOLVED. `taze.package.latest_version` present and correctly sourced on both fetch spans.
- **SCH-003**: MIXED. Resolved cleanly in `bunWorkspaces.ts`. Recurred in disguised form (count cast to string, schema retyped to match) in `checkGlobal.ts`, `check/index.ts`, `pnpmWorkspaces.ts`, and `packageYaml.ts`. Recurred as a literal type mismatch (no disguise) in `yarnWorkspaces.ts`.
- **CDQ-006 (bunWorkspaces.ts)**: RESOLVED.
- **resolves.ts stability (#954/#958)**: PARTIALLY RESOLVED. The specific NDS-001 compilation oscillation is fixed — first-attempt clean compile, an improvement over run-16's 2 attempts. But the file traded that instability for a new one: 4 of 6 span names and 1 attribute (`taze.package.update_available`) drifted/dropped from run-16, which wasn't a problem in the prior run.

---


