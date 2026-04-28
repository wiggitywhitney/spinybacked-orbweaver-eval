# Spiny-orb Handoff — taze TypeScript Eval (Runs 1–3)

**Last updated**: 2026-04-28
**Eval target**: wiggitywhitney/taze (fork of antfu-collective/taze)
**Runs attempted**: 3 (all aborted at 3/33 files)
**Files committed**: 0
**PRs created**: 0

---

## TL;DR

Three runs, all aborted at file 3/33. Each run surfaced a different root cause. The fixes from the previous handoff (PRD #582 M2 early-exit, `instanceof Error` prompt fix) are confirmed working — but run-3 uncovered a new systemic blocker: `checkSyntax()` hardcodes `--moduleResolution NodeNext`, which fails on every file in any project using `moduleResolution: Bundler`. Taze uses Bundler. NDS-001 fires on the **original unmodified source**.

**Current blocker**: `checkSyntax()` must read the project's `tsconfig.json` moduleResolution instead of hardcoding NodeNext.

---

## Status of Previous Findings

| Finding | Status |
|---------|--------|
| F1 — NDS-001 on uninstrumentable files (PRD #582 M2 early-exit) | ✅ Fixed — `hasInstrumentableFunctions` early-exit merged to main |
| F2 — Consecutive-failure abort threshold | ✅ Moot — files 1 and 2 now correctly identified as "nothing to instrument"; they still fail NDS-001 but for the new reason below |
| F3 — `error as Error` cast fails strict tsc | ✅ Fixed — `instanceof Error` ternary form added to TypeScript prompt as HARD CONSTRAINT |
| F4 — Checkpoint test failures from live-registry dependency | ⚠️ Partially mitigated — `testCommand: pnpm test` added to `spiny-orb.yaml`; pre-existing flaky tests still fire but are unrelated to instrumentation |
| F5 — `language:` field required in spiny-orb.yaml | ✅ Resolved in run-1 |

---

## New Finding — NDS-001 on original unmodified source (P1)

**Run-3 (2026-04-28). Blocks all evaluation.**

`checkSyntax()` in `src/languages/typescript/validation.ts` runs tsc with hardcoded flags:

```text
tsc --noEmit --strict --skipLibCheck --allowImportingTsExtensions
    --module NodeNext --moduleResolution NodeNext --target ES2022 --jsx preserve
    <filePath>
```

Taze uses `"moduleResolution": "Bundler"` in `tsconfig.json`. Under NodeNext, **all relative imports require `.js` extensions** — e.g., `import { ... } from '../types'` is invalid; it must be `'../types.js'`. Taze uses extensionless imports throughout (valid under Bundler, standard for bundler-based tools).

**Evidence**:
- `npx tsc --noEmit` from the taze project root → exits 0, zero errors
- Per-file check with `--moduleResolution NodeNext` → fails on every file including `src/addons/index.ts`, which the agent returned **completely unchanged**
- `cat ~/Documents/Repositories/taze/tsconfig.json` → `"moduleResolution": "Bundler"`
- Debug dumps at `evaluation/taze/run-3/debug/` confirm the agent's output for files 1 and 2 is byte-for-byte identical to the original source

**Impact**: 100% of taze files fail NDS-001 before any instrumentation quality can be assessed. Affects all TypeScript projects using `moduleResolution: Bundler` — common for tools built with Vite, esbuild, tsx, or similar bundlers.

**Required fix**: `checkSyntax()` should use the project's actual tsconfig settings. Options in preference order:
1. Pass `--project <tsconfig-path>` instead of per-flag invocation (reads the actual config)
2. Walk up from `filePath` to find `tsconfig.json`, read its `moduleResolution`, substitute for the hardcoded `NodeNext`
3. Default to `Bundler` (most permissive for modern TS projects) with NodeNext as an explicit opt-in

---

## Instrumentation Quality Signal (run-3, src/api/check.ts)

Despite the NDS-001 failure, the agent produced quality instrumentation for `check.ts` (debug dump at `evaluation/taze/run-3/debug/src/api/check.ts`):

- **Entry point**: `CheckPackages` correctly wrapped in `tracer.startActiveSpan('taze.check', ...)`
- **RST-004**: `CheckSingleProject` (unexported) correctly skipped
- **CDQ-007**: `options.mode`, `options.recursive`, `options.write` all guarded with `!= null`
- **Schema reasoning**: `taze.check.packages_total` set after `loadPackages`; `taze.check.packages_outdated` via reduce post-resolution
- **Schema extension surfaced**: `span.taze.check` not in registry — correctly reported

The semantic understanding and code generation are working. The blocker is entirely in the validator environment.

---

## What's Needed for Run-4

1. **Fix `checkSyntax()` moduleResolution** — this is the gate. Without it, every taze file fails NDS-001 on the original source regardless of instrumentation quality.
2. **Rebuild spiny-orb** after the fix and record the new SHA in the pre-run verification table.
