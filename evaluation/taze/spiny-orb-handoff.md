# Spiny-orb Handoff — taze TypeScript Eval (Runs 1–6)

**File location**: `/Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/spiny-orb-handoff.md`
**GitHub**: `https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/blob/feature/prd-50-typescript-eval-setup/evaluation/taze/spiny-orb-handoff.md`

**Last updated**: 2026-04-29
**Eval target**: wiggitywhitney/taze (fork of antfu-collective/taze)
**Runs attempted**: 6
**First completed run**: Run-5 (PR #1 created)
**Files committed**: 0 across all runs

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

Run-5 was the first completed run — a branch was pushed and PR #1 was created. The agent is working correctly. Two more `checkSyntax()` fixes are needed before run-6 can process the majority of taze's files.

**Current blockers**: Two fixes in `src/languages/typescript/validation.ts` `checkSyntax()`:

1. Read `target` from tsconfig.json — `Array.fromAsync` is not in ES2022 but IS in ESNext (taze's actual target)
2. Read `lib`/`types` from tsconfig.json — `node:*` protocol imports need `@types/node` which isn't loaded in per-file mode

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
| FC — NDS-003 flags intermediate variables for `setAttribute` (run-5) | 🔄 Open — see Finding E (now confirmed as a blocker, not just P2) |

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

## What's Needed for Run-7

Both fixes are in `src/languages/typescript/validation.ts`:

1. **Auto-detect `@types/node`** — in `checkSyntax()`, check for `node_modules/@types/node/` and add `node` to the `--types` list if present (Finding D)
2. **Allow null guards in NDS-003** — extend the allowlist to permit `if (x != null) { span.setAttribute(...) }` patterns (Finding E)

After merging: rebuild spiny-orb, update SHA in pre-run verification, create `evaluation/taze/run-7/` directory.
