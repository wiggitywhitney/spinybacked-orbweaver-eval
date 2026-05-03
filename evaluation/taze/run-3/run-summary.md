# Run Summary — taze Run-3

**Date**: 2026-04-28
**Started**: 2026-04-28T13:12:13.592Z
**Duration**: 9m 22.8s
**Branch**: none — run aborted before any files committed; no PR created
**Spiny-orb build**: main (0fce097f9ff027fb52ee786fc72e0a9d4899589e) — includes hasInstrumentableFunctions early-exit (PRD #582), CLI verbose improvements, instanceof Error prompt fix, TypeScript provider on main
**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze)
**PR**: none
**Debug dump**: `evaluation/taze/run-3/debug/`

---

## Results

| Metric | Value |
|--------|-------|
| Files discovered | 33 |
| Files processed | 3 of 33 — **run aborted early** |
| Committed | 0 |
| Partial | 0 |
| Failed | 3 |
| Correct skips | 0 |
| Total tokens (input) | 10.5K |
| Total tokens (output) | 27.9K |
| Cached tokens | 103.0K |
| Estimated cost | ~$0.45 |
| Live-check | DEGRADED (no spans emitted) |
| Push/PR | NO |

---

## Early Abort

Third consecutive abort at file 3 of 33. All 3 processed files failed NDS-001. Root cause is **different** from runs 1 and 2 and has been fully diagnosed this run.

---

## Root Cause Identified: Module Resolution Mismatch

Spiny-orb's `checkSyntax()` runs `tsc --noEmit` on each file individually with hardcoded flags:

```text
--module NodeNext --moduleResolution NodeNext
```

Taze uses `"moduleResolution": "Bundler"` in its `tsconfig.json`. Under NodeNext resolution, **all relative imports must have `.js` extensions** (e.g., `import { ... } from '../types.js'`). Taze's source files use extensionless imports (`import { ... } from '../types'`), which are valid under Bundler resolution but produce a tsc error under NodeNext.

**Key evidence**:
- `npx tsc --noEmit` from the taze project root passes with zero errors
- Per-file check with `--moduleResolution NodeNext` fails on every file, including files returned **completely unchanged** by the agent
- Files 1 and 2 (`src/addons/index.ts`, `src/addons/vscode.ts`): agent correctly returned original source unchanged; NDS-001 still fired
- This was confirmed by reading `src/languages/typescript/validation.ts` in the spiny-orb source and `tsconfig.json` in taze

**Impact**: 100% of taze files fail NDS-001 before any instrumentation quality can be assessed. This affects all TypeScript projects using `moduleResolution: Bundler` (common for bundler-based tools).

---

## Failed Files (3 of 3 processed)

| File | Agent output | NDS-001 cause |
|------|-------------|----------------|
| src/addons/index.ts | Unchanged (re-export only, nothing to instrument) | NodeNext rejects extensionless import `'./vscode'` |
| src/addons/vscode.ts | Unchanged (RST-001: pure sync void method) | NodeNext rejects extensionless imports `'../types'`, `'semver-es'` |
| src/api/check.ts | Instrumented with real spans and attributes | NodeNext rejects extensionless imports `'../types'`, `'../io/packages'`, etc. |

---

## Instrumentation Quality — src/api/check.ts

Despite the NDS-001 failure, file 3's debug dump shows quality instrumentation:

- **Entry point**: `CheckPackages` correctly wrapped in `tracer.startActiveSpan('taze.check', ...)`
- **RST-004**: `CheckSingleProject` (unexported) correctly skipped — its I/O propagates as child spans
- **CDQ-007**: `options.mode`, `options.recursive`, `options.write` all guarded with `!= null` before `setAttribute`
- **Schema reasoning**: `taze.check.packages_total` set after `loadPackages` completes; `taze.check.packages_outdated` computed via reduce after all resolution finishes
- **Schema extension**: `span.taze.check` reported as a new span name not in the registry

The agent is working correctly. NDS-001 is a validator environment issue, not an instrumentation quality issue.

---

## Changes vs Run-2

| Item | Run-2 | Run-3 |
|------|-------|-------|
| PRD #582 early-exit (hasInstrumentableFunctions) | ❌ | ✅ (merged) |
| instanceof Error prompt fix | ❌ | ✅ (merged) |
| CLI verbose improvements | ❌ | ✅ (merged) |
| testCommand: pnpm test | ❌ | ✅ (added) |
| NDS-001 failures | 3 | 3 (same count, **different root cause**) |
| Abort point | file 3/33 | file 3/33 |
| Root cause | Prompt fix insufficient; PRD #582 M2 needed | NodeNext vs Bundler moduleResolution mismatch |

The PRD #582 early-exit fix worked as intended — the agent now correctly identifies uninstrumentable files. But NDS-001 fires on the validator level before the agent's "skip" decision can prevent it, due to the module resolution mismatch.

---

## Next Steps

- File new P1 against spiny-orb: `checkSyntax()` must detect project tsconfig `moduleResolution` and use it for per-file tsc invocation
- Do not rerun until this fix is confirmed on the spiny-orb branch
- Run-4 can proceed once the fix is deployed
