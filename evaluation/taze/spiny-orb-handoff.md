# Spiny-orb Handoff — taze TypeScript Eval (Runs 1 & 2)

**Date**: 2026-04-24
**Eval target**: wiggitywhitney/taze (fork of antfu-collective/taze)
**Spiny-orb branch**: feature/prd-372-typescript-provider
**Runs attempted**: 2 (both aborted at 3/33 files)
**Files committed**: 0
**PRs created**: 0

---

## TL;DR

Two runs, same abort. The first 3 files alphabetically in taze's `src/` are uninstrumentable (re-export, void sync method, type-error-prone entry point). All 3 fail NDS-001, consecutive-failure threshold fires, run stops. 30/33 files never reached. Prompt guidance added between run-1 and run-2 didn't prevent the first-attempt tsc failure — the fix needs to be earlier in the pipeline.

**Blocker**: `hasInstrumentableFunctions` early-exit in PRD #582 M2. Without it, every taze run will abort before reaching any interesting files.

---

## Finding 1 — NDS-001 on uninstrumentable files (P1)

**Both runs. Blocks all further evaluation.**

Files with no instrumentable functions still go through the agent loop. On the first attempt the agent adds imports/spans; tsc catches a type error; oscillation starts. Even after the run-2 prompt fix (void-callback guidance, re-export guidance), the first attempt still fails — the agent correctly identifies "nothing to instrument" on retries, but NDS-001 already fired and the oscillation cycle is underway.

**Affected files**:

| File | Reason uninstrumentable | NDS-001 cause |
|------|------------------------|---------------|
| `src/addons/index.ts` | Re-export only — no function definitions | Agent adds imports; tsc fails |
| `src/addons/vscode.ts` | One void synchronous method — RST-001 | `startActiveSpan()` return type incompatible with `void` |
| `src/api/check.ts` | Has a real entry point, but `catch (error)` requires `error as Error` cast for `span.recordException()` | Strict-mode tsc rejects `as Error` cast in some contexts |

**Required fix**: PRD #582 M2 early-exit. When `preInstrumentationAnalysis()` returns `hasInstrumentableFunctions: false`, classify the file as `correct skip` without calling the LLM. This eliminates NDS-001 for files 1 and 2. File 3 (`check.ts`) has a real entry point and will still need the `error as Error` cast issue resolved separately — see Finding 3.

---

## Finding 2 — Consecutive-failure abort threshold too aggressive (P1)

**Both runs. Fires identically.**

3 consecutive failures → abort. In taze, the first 3 files alphabetically happen to all be uninstrumentable. The threshold fires before any substantive file is processed.

**Note**: If the early-exit fix (Finding 1) lands first, files 1 and 2 will be classified as correct skips (not failures) and won't count toward the abort threshold. File 3 (`check.ts`) failing alone would not trigger the threshold. So the threshold issue *may resolve automatically* once PRD #582 M2 lands — evaluate after that. If run-3 still aborts, file a standalone issue at that point.

---

## Finding 3 — `error as Error` cast fails strict tsc (P1, TypeScript-specific)

**File**: `src/api/check.ts`

In TypeScript strict mode (`useUnknownInCatchVariables: true`), catch clause variables are `unknown`. Calling `span.recordException(error as Error)` fails tsc because the `as` cast is rejected in some contexts. The agent identified this correctly in its notes but couldn't resolve it.

**Required pattern** (TypeScript-safe):
```typescript
span.recordException(error instanceof Error ? error : new Error(String(error)));
```

Or using the OTel `Exception` type directly:
```typescript
import type { Exception } from '@opentelemetry/api';
span.recordException(error as Exception);
```

This should be added to the TypeScript prompt as an explicit pattern for error recording in catch blocks. It may also affect other taze files with catch clauses.

---

## Finding 4 — Checkpoint test failures from live-registry dependency (P2)

**Run-2 only** (run-1 aborted before checkpoint ran).

3 tests failed at end-of-run on **uninstrumented code** — the failures are pre-existing and not caused by spiny-orb:

```text
FAIL test/cli.test.ts — "Timeout requesting typescript" (live npm registry timeout)
FAIL test/packageConfig.test.ts — typescript version check returns unexpected result
FAIL test/versions.test.ts:44 — getMaxSatisfying('major') returns undefined (live tags)
```

These tests hit the live npm/JSR registry. They passed in pre-run manual verification (`pnpm test`) but timed out under spiny-orb's checkpoint environment. This is a taze test design issue (flaky live-network tests), but spiny-orb's checkpoint reporting surfaced it clearly.

**Recommendation**: Consider whether the checkpoint should treat pre-existing test failures differently from instrumentation-induced failures. If the test suite was already failing before any files were modified, the checkpoint result should not be attributed to spiny-orb's output.

**Also**: `spiny-orb.yaml` currently uses the default `testCommand: npm test`. Add `testCommand: pnpm test` to match taze's canonical package manager.

---

## Finding 5 — `language:` field required in spiny-orb.yaml (resolved)

**Run-1 attempt 1 only. Already fixed.**

Without `language: typescript` in `spiny-orb.yaml`, `coordinate()` defaults to `JavaScriptProvider` for file discovery, which finds no `.ts` files. The run exited immediately with "No JavaScript files found in .../taze/src."

**Resolution**: Added `language: typescript` and `targetType: short-lived` to `spiny-orb.yaml` before run-1. The `language:` field requirement has been propagated to all Type C eval PRDs and the language extension plan.

---

## Recommended Next Steps (eval team's view)

1. **PRD #582 M2 early-exit** — this is the gate. Without it, run-3 will produce a third identical abort.
2. **TypeScript prompt: `error as Error` pattern** — add explicit safe catch-block pattern for `span.recordException()`. This is needed for `check.ts` and likely other taze files.
3. **`testCommand: pnpm test`** — add to `spiny-orb.yaml` before run-3.
4. **Abort threshold** — watch in run-3. If the early-exit fix means files 1 and 2 are correct skips, the threshold may not fire. File a standalone issue only if run-3 still aborts on consecutive failures.

---

## Schema signal (despite no committed output)

`src/api/check.ts` produced schema reasoning across both runs before failing:

- **Proposed span**: `span.taze.check` / `span.taze.check.packages`
- **Attributes correctly identified**: `taze.check.packages_total`, `taze.check.packages_outdated`, `taze.check.write_mode`, `taze.check.recursive`, `taze.check.mode`
- **Correctly skipped**: `CheckSingleProject` (unexported, RST-004)
- **Schema gap identified**: no span entity defined in registry — only attribute groups. Agent invented span name from namespace.

This is encouraging signal: the schema reasoning is working even on the file that fails compilation. The TypeScript type issues are in the *generated code*, not the *semantic understanding*.
