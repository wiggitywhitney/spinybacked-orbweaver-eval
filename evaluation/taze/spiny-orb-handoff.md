# Spiny-orb Handoff — taze TypeScript Eval (Runs 1–13)

**File location**: `/Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/spiny-orb-handoff.md`
**GitHub**: `https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/blob/feature/prd-50-typescript-eval-setup/evaluation/taze/spiny-orb-handoff.md`

**Last updated**: 2026-05-03
**Eval target**: wiggitywhitney/taze (fork of antfu-collective/taze)
**Runs attempted**: 13
**Completed runs**: Run-5–12 (PRs #1–7), **Run-13 (PR #8 — first perfect run)**
**Files committed**: 14 (run-13, 0 failures, 0 rollbacks)

---

## Finding the Diagnostic Artifacts

All five diagnostic dimensions are available for every run in this eval repo (`wiggitywhitney/spinybacked-orbweaver-eval`, branch `feature/prd-50-typescript-eval-setup`):

| Dimension | What it contains | Where to find it |
|-----------|-----------------|------------------|
| 1 — Run history | CI acceptance gate results | `gh run list --workflow=acceptance-gate.yml` on `wiggitywhitney/taze` |
| 2 — Instrumented code | Exact code the agent produced for each file | `evaluation/taze/run-N/debug/` (mirrors `src/` structure) |
| 3 — Validator messages | Full tsc error text, NDS-005 block previews | `evaluation/taze/run-N/spiny-orb-output.log` (requires `--verbose`) |
| 4 — Agent notes | Agent's reasoning per file | `evaluation/taze/run-N/spiny-orb-output.log` (requires `--verbose`) |
| 5 — Agent thinking | `thinkingBlocksByAttempt` | Now available in CLI `--verbose` output (shipped run-5) |

Replace `run-N` with the run number. The `debug/` directory is present when `--debug-dump-dir` was passed to the instrument command (runs 3–5 and all future runs).

---

## TL;DR

**Run-13 was the first perfect run**: 33/33 files processed, 14 committed, 19 correct skips, 0 failures, 0 rollbacks. Live-check: OK. PR #8 created.

**No current blockers.** The TypeScript baseline is established. The eval team is proceeding to the analysis phase.

1. SCH-001 cascade — first committed span name (`taze.check.run`) poisoned all downstream files via judge "semantic duplicate" rulings, forcing span name collisions across unrelated operations; requires OTel research then advisory mode change
2. NDS-003 misses regex literal modifications — agent corrupted `/\./g` to `/\.\g/` in `yarnWorkspaces.ts`

---

## Status of All Previous Findings

| Finding | Status |
|---------|--------|
| F1 — NDS-001 on uninstrumentable files (PRD #582 M2 early-exit) | ✅ Fixed |
| F2 — Consecutive-failure abort threshold | ✅ Resolved (6 consecutive abort seen in run-5; files 1–2 correct skips reset counter) |
| F3 — `error as Error` cast fails strict tsc | ✅ Fixed |
| F4 — Checkpoint test failures / `testCommand: pnpm test` | ⚠️ Mitigated — pre-existing flaky tests still fire (live-registry) |
| F5 — `language:` field required in spiny-orb.yaml | ✅ Resolved |
| F6 — NodeNext vs Bundler moduleResolution (run-3) | ✅ Fixed |
| F7 — TS5112 `--ignoreConfig` missing (run-4) | ✅ Fixed |
| F8 — Silent NDS-001: stdout not captured (run-4) | ✅ Fixed |
| FA — `Array.fromAsync` not in ES2022 target (run-5) | ✅ Fixed — `target` now read from tsconfig |
| FB — `node:` protocol imports / `@types/node` (run-5) | ⚠️ Partially fixed — `lib`/`types` read from tsconfig, but taze has no `types` field so `@types/node` still not loaded. See Finding D. |
| FC — NDS-003 flags intermediate variables for `setAttribute` (run-5) | ✅ Fixed — agent workaround: inline `reduce()` directly in `setAttribute` call |
| FD — `console` not found / @types/node auto-detection (run-6) | ✅ Fixed |
| FE — NDS-003 null guard catch-22 (run-6) | ✅ Fixed — null guards now allowed |
| FF — NDS-003 catch/finally pattern (run-7) | ✅ Fixed — standalone `catch (error) {`, `finally {`, `throw error` added to allowlist |
| FG — `if (span.isRecording()) {` blocked by NDS-003 (run-9) | ✅ Fixed |
| FH — NDS-003 null guard catch-22 (run-9) | ✅ Fixed |
| FI — NDS-003 flags `as const` on discriminant fields (run-10) | ✅ Fixed |
| FJ — Agent rewrites semconv schema file, removing prior definitions (run-10) | ✅ Fixed |
| FK — SCH-001 blocking causes span name cascade deadlock (run-12) | ✅ Fixed — SCH-001 is now advisory (PR #711); run-13 confirmed 0 failures |
| FL — NDS-003 misses regex literal modifications (run-12) | ✅ Fixed — included in PR #711; run-13 confirmed 0 failures |

---

## New Finding A — `Array.fromAsync` not in ES2022 target (P1, run-5)

**Blocks most of taze's 33 files.**

`src/io/packages.ts` line 137 uses `Array.fromAsync()`, which is an ES2024 feature. `checkSyntax()` passes `--target ES2022`, but taze's tsconfig uses `"target": "ESNext"` which includes it. Every file that transitively imports `packages.ts` fails NDS-001 with:

```text
error TS2550: Property 'fromAsync' does not exist on type 'ArrayConstructor'.
Do you need to change your target library? Try changing the 'lib' compiler option to 'esnext' or later.
```

**Required fix**: Read `target` from `tsconfig.json` (same pattern already established for `module`/`moduleResolution`) and pass it as `--target <value>`. The `readTsConfigModuleOptions()` function already walks the tsconfig — extend it to also return `target`.

**Affected files in run-5**: `src/api/check.ts`, `src/cli.ts`, `src/commands/check/index.ts`. Likely affects the majority of the remaining 25 unprocessed files.

---

## New Finding B — `node:` protocol imports need `@types/node` (P1, run-5)

**Blocks all files with Node.js built-in imports.**

`checkSyntax()` per-file mode doesn't load `@types/node`, so `node:process`, `node:readline`, `node:fs`, `node:os`, `node:async_hooks`, `node:util` all produce:

```text
error TS2591: Cannot find name 'node:process'. Do you need to install type definitions for node?
```

These imports work fine under `npx tsc --noEmit` from the project root because the project tsconfig auto-discovers `@types/node` from `node_modules/@types/`.

**Required fix**: One of (in preference order):
1. Read `lib` and `types` from tsconfig.json and pass them as `--lib <value> --types <value>` — most correct, generalizes to all projects
2. Add `--types node` unconditionally — simpler but less portable

**Affected files in run-5**: `src/commands/check/interactive.ts`, `src/commands/check/render.ts`. Also expected to affect `src/io/resolves.ts`, `src/utils/context.ts`, `src/utils/packument.ts`, `src/render.ts`, and others.

---

## New Finding C — NDS-003 flags intermediate variables for span attributes (P2, run-5)

**Validator calibration issue — not a blocker but affects coverage.**

In `src/commands/check/checkGlobal.ts`, the agent added:

```typescript
const packagesTotal = resolvePkgs.reduce((acc, pkg) => acc + pkg.deps.length, 0)
span.setAttribute('taze.check.packages_total', packagesTotal)
```

NDS-003 flagged `packagesTotal` as a non-instrumentation line. The TypeScript prompt explicitly permits "return-value capture" (`const result = computeResult(); span.setAttribute(..., result)`). Aggregation variables computed solely to feed `setAttribute` are semantically identical.

**Suggested fix**: Extend the NDS-003 allowlist to permit `const <name> = <expression>` that is immediately consumed by a `span.setAttribute()` call with no other uses.

---

## Instrumentation Quality (run-5)

The agent is reasoning correctly despite the validator failures:

- Correctly applied RST-004 (skip unexported helpers), RST-001 (skip sync utilities), COV-001 (entry points need spans)
- Correctly resolved COV-001 vs RST-006 conflict in `cli.ts` (COV-001 wins — entry point gets span even with `process.exit()`)
- Null guards on all optional options fields
- Schema extension span names well-chosen (`taze.check`, `taze.check.global`, `taze.cli.action`, `taze.check.interactive`)
- Agent thinking now available in CLI mode

---

---

## New Finding D — `console` not found (TS2584) — `@types/node` needs auto-detection (P1, run-6)

**Blocks files 1 and 2 (and likely many others).**

After the `lib`/`types` fix from run-5, `checkSyntax()` now reads `lib` and `types` from tsconfig.json. But taze's tsconfig has no `types` field:

```json
{ "compilerOptions": { "lib": ["ESNext"], ...no "types" field } }
```

Without `--types`, `@types/node` is not included in the per-file check. Node.js globals like `console` are defined in `@types/node`, not in the standard ES libs. Result:

```text
src/addons/vscode.ts(31,7): error TS2584: Cannot find name 'console'.
Do you need to change your target library? Try changing the 'lib' compiler option to include 'dom'.
```

(tsc suggests 'dom' because that's the other common source of console, but the correct fix is `@types/node`.)

**Root cause**: The fix reads `types` from tsconfig, but many Node.js projects don't declare `types` explicitly — TypeScript auto-discovers `@types/*` packages from `node_modules/@types/` by default.

**Required fix**: In `checkSyntax()`, after reading tsconfig `types`, also check for `@types/node` in the project's `node_modules/@types/node/` directory. If it exists and `types` doesn't already include `"node"`, add it automatically. Pattern:

```typescript
const typesFlag = moduleOpts.types ?? [];
const nodeTypesPath = join(projectRoot, 'node_modules', '@types', 'node');
if (existsSync(nodeTypesPath) && !typesFlag.includes('node')) {
  typesFlag.push('node');
}
// then: ...typesFlag.length ? ['--types', typesFlag.join(',')] : []
```

**Affected in run-6**: `src/addons/index.ts`, `src/addons/vscode.ts` (and expected for any file in a project with `@types/node` installed but not declared in tsconfig).

---

## New Finding E — NDS-003 blocks null guards required for `setAttribute` (P1, run-6)

**Confirmed blocker — previously P2, now P1.**

In `src/api/check.ts`, `options.mode` is typed as `RangeMode | undefined`. Calling `span.setAttribute('taze.check.mode', options.mode)` fails tsc:

```text
error TS2345: Argument of type '"default" | ... | undefined' is not assignable to parameter of type 'AttributeValue'.
  Type 'undefined' is not assignable to type 'AttributeValue'.
```

The fix is to guard: `if (options.mode != null) { span.setAttribute(...) }`. But NDS-003 flags this `if` statement as a non-instrumentation line.

**The catch-22**: The agent is explicitly stuck — attempting the null guard triggers NDS-003; omitting it triggers NDS-001 (TypeScript type error). The agent's thinking in run-6 attempt 3 documents this conflict directly.

This is a validator calibration issue. Null guards of the form `if (x != null) { span.setAttribute(key, x) }` are instrumentation, not business logic. The TypeScript prompt explicitly permits "return-value capture" (`const result = fn(); span.setAttribute(key, result)`) — null guards before `setAttribute` are semantically equivalent.

**Required fix**: Extend the NDS-003 allowlist to permit `if (<variable> != null) { span.setAttribute(<key>, <variable>) }` patterns where the guarded variable is only used inside the `span.setAttribute` call.

**Affected**: Any file where the instrumented function's options/parameters have optional typed fields — which is common. `src/api/check.ts` is blocked by this.

---

---

## New Finding F — NDS-003 blocks span lifecycle catch/finally pattern (P1, run-7)

**Confirmed blocker. Affects all files requiring error recording.**

NDS-003 flags `catch (error) {`, `throw error`, and `finally {` as non-instrumentation lines when added to functions that didn't originally have them. These lines are required for the standard span lifecycle pattern:

```typescript
} catch (error) {             // ← NDS-003 flags this
  span.recordException(...);
  span.setStatus({ code: SpanStatusCode.ERROR });
  throw error;                // ← NDS-003 flags this
} finally {                   // ← NDS-003 flags this
  span.end();
}
```

The agent has no workaround for functions needing full error recording. It found a partial workaround in `cli.ts` (placing `setAttribute` inside an existing `if (mode)` block, using `?? false` for booleans) but this doesn't help for `check.ts` and `checkGlobal.ts`.

**Required fix (contextual, not blanket)**: Extend NDS-003 to allow:
- `catch (error) {` — **only when** the catch block contains `span.recordException`
- `throw error` — **only when** inside a catch block containing `span.recordException`
- `finally {` — **only when** the finally block contains `span.end()`

The contextual approach prevents an agent from using the allowlist to add behavior-changing catch blocks that don't contain span calls.

**Implementation**: `src/languages/javascript/rules/nds003.ts` (and TypeScript equivalent if separate).

**Affected in run-7**: `src/api/check.ts`, `src/cli.ts`, `src/commands/check/checkGlobal.ts`. Expected to affect most taze files with I/O.

---

---

## New Finding G — NDS-001: `startActiveSpan` causes literal type widening on discriminant fields (P1, run-9)

**Blocks `src/io/packageJson.ts` and `src/io/packageYaml.ts`.**

When a function returns an object literal with a string discriminant field in a discriminated union (e.g., `type: 'package.json'` matching `PackageMeta`), TypeScript infers the literal type in a direct return. Inside a `startActiveSpan` async callback, the type widens to `string`, breaking the discriminated union assignment:

```text
TS2322: Type 'string' is not assignable to type '"package.yaml"'.
```

**Required fix**: Add guidance to `src/languages/typescript/prompt.ts` — when wrapping a function that returns an object literal in a discriminated union, cast the return with `as const` on string literal fields, or cast the whole array: `return [...] as PackageMeta[]`. This is analogous to the `instanceof Error` guidance already in the prompt.

**Fix owner**: spiny-orb team (TypeScript prompt).

---

## New Finding H — NDS-003 blocks `if (span.isRecording()) {` guard (P1, run-9)

**Blocks `src/io/resolves.ts`.**

The CDQ-006 rule recommends wrapping expensive span attribute computations in `if (span.isRecording()) {`. NDS-003 blocks this as a non-instrumentation line.

**Required fix**: Add to `INSTRUMENTATION_PATTERNS` in `src/languages/javascript/rules/nds003.ts`:

```javascript
/^\s*if\s*\(\s*(?:span|otelSpan)\.isRecording\(\)\s*\)\s*\{?\s*$/,
```

**Fix owner**: spiny-orb team.

---

---

## New Finding I — NDS-003 flags `as const` on discriminant fields — catch-22 (P1, run-10)

**Blocks `src/io/packageJson.ts` and `src/io/packageYaml.ts`.**

The prompt now correctly tells agents to add `as const` to string literal discriminant fields. But NDS-003 sees `type: 'package.json' as const,` as a modification of the original `type: 'package.json',`. `as const` is a TypeScript annotation with zero runtime effect — the compiled JS output is identical.

**Required fix**: Extend `normalizeLine()` in `nds003.ts` to strip `as const` before comparison:

```typescript
.replace(/\s+as\s+const\s*([,;]?)$/, '$1')  // normalize "x as const," → "x,"
```

This is the same pattern as the existing catch-variable-binding normalization.

**Fix owner**: spiny-orb team — `normalizeLine()` in `src/languages/javascript/rules/nds003.ts`.

---

## New Finding J — Agent rewrites semconv schema file, removing prior definitions (P2, run-10)

End-of-run warnings showed 4 previously-committed schema attributes removed:

```text
Schema integrity violation: "taze.bun_workspace.catalogs_count" was removed
Schema integrity violation: "taze.pnpm_workspace.catalogs_count" was removed
Schema integrity violation: "taze.config.sources_count" was removed
Schema integrity violation: "taze.yarn_workspace.catalogs_count" was removed
```

The run-10 agent regenerated `attributes.yaml` from scratch instead of reading and appending to the existing file. The schema integrity check caught the removals.

**Required fix**: Ensure agents read existing schema definitions before writing new ones — merge/append, not replace.

**Fix owner**: spiny-orb team.

---

## What's Needed for Run-11

1. **NDS-003 `as const` normalization** — extend `normalizeLine()` (Finding I) ✅ Done (PR #676)
2. **Schema append-only writes** — prevent agents from removing existing schema definitions (Finding J) ✅ Done (PR #669)
3. **Start run-11 from taze `main`** — not from the previous instrument branch ✅ Done

---

## Issue (medium): SCH-001 should be advisory, not blocking — pending OTel research

**Found in**: run-12 (`src/cli.ts`, `src/commands/check/checkGlobal.ts`)

**Problem**: SCH-001 currently blocks a file if the LLM judge determines the proposed span name is semantically similar to an existing registry operation. In run-12, this created an unresolvable deadlock:

1. `check.ts` committed span `taze.check.run`
2. `cli.ts` proposed `taze.cli.run` — SCH-001 ruled it a "semantic duplicate" and said use `taze.check.run` instead
3. But `taze.check.run` is already in use by a different function
4. Both options fail — the agent has no valid move

The cascade poisoned every subsequent file. `taze.check.global`, `taze.io.load_cache`, `taze.io.load_package`, `taze.fetch.package` were all rejected as duplicates. Multiple files were then forced to commit `taze.check.run` for completely different operations, producing collision warnings:

```text
Warning: Span name "taze.check.run" collision: declared by both src/api/check.ts and src/commands/check/index.ts
Warning: Span name "taze.check.run" collision: declared by both src/api/check.ts and src/commands/check/interactive.ts
Warning: Span name "taze.check.run" collision: declared by both src/api/check.ts and src/config.ts
Warning: Span name "taze.check.run" collision: declared by both src/api/check.ts and src/io/bunWorkspaces.ts
```

The judge's rulings in this run were arguably wrong. `taze.cli.run` is a CLI dispatcher that sits *above* the check operation — it parses args, resolves config, and delegates to either `check` or `checkGlobal`. Similarly, `taze.check.global` checks global npm/pnpm packages via a distinct resolution pathway. These are hierarchically-distinct operations that would appear as parent/child spans in a real trace. Forcing them to share a name loses that trace hierarchy.

**Proposed change**: Make SCH-001 advisory rather than blocking. Surface the potential duplicate to the agent — "this may be a semantic duplicate of `taze.check.run` — consider reusing it if these operations are truly equivalent" — and let the agent decide with full function context. The agent has more information than the judge.

**Prerequisite research first**: Before making this change, verify OTel good practice on span naming for hierarchically-distinct operations. The key question: does OTel recommend that a CLI entry point and its child check operation share a span name (grouping by operation type, lower cardinality) or have distinct names (preserving trace hierarchy)? If OTel recommends shared names for related operations, the blocking behavior may be correct and the fix is different. If OTel recommends distinct names for distinct hierarchy levels, Advisory is clearly right. Research this before implementing.

---

## New Finding L — NDS-003 does not catch regex literal modifications (P2, run-12)

`yarnWorkspaces.ts` failed NDS-003 because the agent changed `/\./g` to `/\.\g/` — it swapped the backslash position in a regex literal, corrupting the pattern. The NDS-003 diff correctly detected the line was modified (`const paths = pkg.name.replace('yarn-workspace:', '').split(/\./g)` → `.split(/\.\g/)`), but the root issue is that regex literal modifications should also be explicitly blocked by the allowlist logic. The current approach catches the line-change but doesn't distinguish intentional regex normalization from accidental corruption.

**Required fix**: No code change needed — NDS-003 already catches this as a missing/modified original line. But it's worth adding a test case covering regex literal preservation so regressions are caught.

---

## Status After Run-13

Run-13 was a perfect run — 0 failures, 0 rollbacks. Both pre-run-13 fixes (SCH-001 advisory, NDS-003 regex) are confirmed working. The TypeScript baseline is established.

No current blockers for the eval team's analysis phase. Outstanding infrastructure improvements for future runs are tracked in `docs/spiny-orb-design-handoff.md`.
