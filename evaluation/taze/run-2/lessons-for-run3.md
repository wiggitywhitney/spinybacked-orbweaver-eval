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

## Carry-Forward Items for Run 3

*(fill in during actionable fix output milestone)*
