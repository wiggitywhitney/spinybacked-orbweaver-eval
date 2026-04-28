# spiny-orb Findings — taze Run 5

Issues and observations surfaced by spiny-orb during run-5.

**Schema design reference (read before scoring SCH rules)**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md` documents the 3 attributes deliberately omitted from the Weaver schema — `taze.check.concurrency`, `taze.package.diff_type`, `taze.fetch.cache_hit` — with code locations and rationale.

---

## P1 — Blocking

### [P1] `--target ES2022` excludes `Array.fromAsync` — all files importing packages.ts fail NDS-001

**Found in**: run-5 (files 3, 4, 6)

**Symptom**: NDS-001 on `src/api/check.ts`, `src/cli.ts`, `src/commands/check/index.ts` — all transitively import `src/io/packages.ts`. Error:

```text
src/io/packages.ts(137,33): error TS2550: Property 'fromAsync' does not exist on type 'ArrayConstructor'.
Do you need to change your target library? Try changing the 'lib' compiler option to 'esnext' or later.
```

**Root cause**: `checkSyntax()` passes `--target ES2022`, but `Array.fromAsync` is an ES2024 feature not included in the ES2022 lib. Taze uses `"target": "ESNext"` in its tsconfig, which includes it. The per-file check uses a lower target.

**Required fix**: Read `target` from the project's `tsconfig.json` (same pattern as `module`/`moduleResolution` — already implemented). Pass the detected value as `--target <value>` instead of hardcoded `ES2022`.

**Impact**: Affects all files that import `src/io/packages.ts` directly or transitively — a core module. Likely to affect the majority of the remaining 25 unprocessed files.

**Fix owner**: spiny-orb team — `checkSyntax()` in `src/languages/typescript/validation.ts`.

---

### [P1] `node:` protocol imports not resolved — `@types/node` absent in per-file mode

**Found in**: run-5 (files 7, 8)

**Symptom**: NDS-001 on `src/commands/check/interactive.ts` and `src/commands/check/render.ts`:

```text
error TS2591: Cannot find name 'node:process'. Do you need to install type definitions for node?
error TS2591: Cannot find name 'node:readline'.
error TS2591: Cannot find name 'node:fs'.
(etc. — node:os, node:async_hooks, node:util, node:process across multiple files)
```

**Root cause**: When tsc is invoked with a specific file path (bypassing tsconfig), it doesn't automatically load `@types/node`. Taze has `@types/node` installed and it's picked up when tsc runs via the project tsconfig, but not in the per-file invocation mode.

**Required fix**: One of:
1. Read `lib` from the project's `tsconfig.json` and pass it as `--lib <value>` (consistent with the module/moduleResolution/target pattern being established)
2. Add `--types node` to the per-file tsc args unconditionally (simpler, but less generalizable)
3. Read `types` from tsconfig and pass `--types <value>` (most correct, handles all `@types/*` the project declares)

Option 1 is most consistent with the emerging pattern. Option 3 is most correct for general use.

**Impact**: Affects any TypeScript project that uses `node:` prefixed imports (common in modern Node.js TypeScript projects). Systemic for taze — at least `interactive.ts`, `render.ts`, `resolves.ts`, `context.ts`, `packument.ts` are affected.

**Fix owner**: spiny-orb team — `checkSyntax()` in `src/languages/typescript/validation.ts`.

---

## P2 — High Priority

### [P2] NDS-003 flags intermediate variables computed for span attributes

**Found in**: run-5 (file 5 — `checkGlobal.ts`)

**Symptom**: NDS-003 violations on:

```text
const packagesTotal = resolvePkgs.reduce((acc, pkg) => acc + pkg.deps.length, 0)
const packagesOutdated = resolvePkgs.reduce((acc, pkg) => acc + pkg.resolved.filter(j => j.update).length, 0)
```

These lines were added to compute values for `span.setAttribute('taze.check.packages_total', packagesTotal)`. The validator flagged them as non-instrumentation additions.

**Why this is a validator calibration issue**: The TypeScript prompt explicitly states "Return-value capture is allowed" and gives the example:
```typescript
const result = computeResult();
span.setAttribute('result.count', result.length);
return result;
```

Intermediate variables whose sole purpose is to feed `setAttribute` are semantically equivalent to return-value capture. Blocking these forces the agent to use inline expressions like `span.setAttribute('count', arr.reduce(...))`, which is harder to read and equally "non-original-code."

**Suggested fix**: Extend NDS-003 allowlist to permit `const <name> = <expression>` lines that are immediately followed by a `span.setAttribute()` call using that variable, with no other uses of the variable.

**Fix owner**: spiny-orb team — NDS-003 validator.

---

## P2 — Observations (Not Blocking)

### [P2] End-of-run test suite failures — pre-existing live-registry flakiness

**Confirmed in**: runs 2, 5

Same pre-existing failures as run-2. `testCommand: pnpm test` is now set, but the live-registry tests (`cli.test.ts`, `resolves.test.ts`) still time out under spiny-orb's checkpoint environment. These failures are unrelated to instrumentation and should not affect run scoring.

### Advisory — CDQ-008 Tracer Naming

**Reported by spiny-orb**: "No `trace.getTracer()` calls found."

This is expected for run-5 since 0 files were committed with instrumentation. Will be meaningful once files pass NDS-001.

---

## P3 — Low Priority

*(fill in during failure deep-dives milestone)*
