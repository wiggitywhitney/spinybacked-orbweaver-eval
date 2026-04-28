# Lessons for Run 3

Observations collected during run-2 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

### Context from run-1 (2026-04-24)

Run-1 aborted at file 3/33. All failures were NDS-001 (TypeScript compilation errors). Root causes fixed by spiny-orb team before run-2:
- Void-callback return type incompatibility with `startActiveSpan()` — prompt guidance added
- Re-export-only files routed through agent instead of skipped — prompt guidance added

**Consecutive-failure abort threshold** (3 consecutive → abort) was NOT addressed before run-2. If run-2 aborts again on consecutive failures, file a standalone issue with the spiny-orb team.

### Pre-run state for run-2

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb build | ✅ | Branch: `feature/prd-372-typescript-provider`, SHA: `14a2fb0` |
| spiny-orb.yaml | ✅ | `language: typescript`, `targetType: short-lived` |
| semconv/ | ✅ | attributes.yaml + registry_manifest.yaml + SCHEMA_DESIGN.md present |
| .ts file inventory | ✅ | 33 files (same as run-1) |
| GITHUB_TOKEN_TAZE | ✅ | Verified in run-1 |

---

## Run-2 Observations

### Run-2 result — 2026-04-24 — ABORTED at file 3/33 (identical to run-1)

Build: `14a2fb0` (includes void-callback and re-export prompt guidance).

- **src/addons/index.ts** — still NDS-001. Prompt guidance did not prevent first-attempt tsc failure.
- **src/addons/vscode.ts** — still NDS-001. Same pattern.
- **src/api/check.ts** — still NDS-001. Agent identified entry point and schema attributes, used `error as Error` cast, but tsc failed on the cast.
- **Checkpoint tests** — 3 failures on uninstrumented code: `cli.test.ts` timeout, `packageConfig.test.ts` live data, `versions.test.ts:44` live tags. All network-dependent flaky tests. Pre-run manual `pnpm test` passed all 73.

Consecutive-failure abort confirmed twice. Do not rerun until PRD #582 M2 (early-exit condition) is implemented.

---

## Pre-run state for run-3

### Pre-run verification — 2026-04-28

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb build | ✅ | Branch: `main`, SHA: `0fce097f9ff027fb52ee786fc72e0a9d4899589e` |
| `feature/prd-372-typescript-provider` | ✅ | Merged to main — TypeScript provider now on main, branch deleted |
| PRD #582 M2 early-exit | ✅ | `hasInstrumentableFunctions: false` → skip before LLM call, merged in `feat(pre-instrumentation): deterministic AST analysis pass before LLM call` |
| CLI verbose error messages | ✅ | PRD #582 M8 merged — full tsc error lines surfaced in `--verbose` output |
| `error as Error` prompt fix | ✅ | `instanceof Error` ternary form is now the standard in `src/languages/typescript/prompt.ts`; `error as Error` is a HARD CONSTRAINT violation |
| spiny-orb.yaml | ✅ | `language: typescript`, `targetType: short-lived`, `testCommand: pnpm test` (added 2026-04-28, pushed to fork) |
| semconv/ | ✅ | attributes.yaml + registry_manifest.yaml + SCHEMA_DESIGN.md present |
| .ts file inventory | ✅ | 33 files (same as runs 1 and 2) |
| GITHUB_TOKEN_TAZE | ✅ | Dry-run push `HEAD:refs/heads/spiny-orb/auth-test` succeeded — `[new branch] HEAD -> spiny-orb/auth-test` |

**Instrument command for run-3** (run from `~/Documents/Repositories/taze/`):
```bash
caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_TAZE node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-3/spiny-orb-output.log'
```

Note: `run-3/` directory will need to be created before running.

---

## Carry-Forward Items for Run 4

### New P1 (discovered run-3): NodeNext vs Bundler module resolution mismatch

`checkSyntax()` in spiny-orb hardcodes `--module NodeNext --moduleResolution NodeNext` for per-file tsc invocation. Taze uses `"moduleResolution": "Bundler"` in `tsconfig.json`. Under NodeNext, extensionless relative imports (e.g., `from '../types'`) are invalid — they require `.js` suffixes. Every taze file fails NDS-001 on the **original, unmodified source** as a result.

**Do not rerun until spiny-orb's `checkSyntax()` reads the project's tsconfig moduleResolution setting (or passes `--project tsconfig.json`).**

Details: `evaluation/taze/run-3/spiny-orb-findings.md`
