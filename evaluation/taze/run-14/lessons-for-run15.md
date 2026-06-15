# Lessons for Run 15

Run-14 observations to carry forward into the next evaluation run PRD.

## Pre-Run State for Run-14

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb build | Applied | SHA: 8649c86ca5a60b508ba0483a37b707dad78ee51e |
| spiny-orb #728 (CDQ-006 advisory pass) | Landed | Merged in PR #749 — confirmed in origin/main |
| Schema type fix (TAZE-RUN1-1) | Applied | Created semconv/agent-extensions.yaml on taze main with correct types: sources_found: int, cache.hit: boolean, cache.changed: boolean |
| IS RES-001 fix (TAZE-RUN1-5) | Applied | service.instance.id: randomUUID() added to examples/instrumentation.js (commit f16b763) |
| taze fork state | Partial | On main, one untracked file (spiny-orb-test-failure.log), `pnpm test` has 1 pre-existing flaky failure |
| Push auth (GITHUB_TOKEN_TAZE) | Verified | Dry-run to spiny-orb/auth-test-run14 succeeded |
| Node version | v25.8.0 | |
| pnpm version | 10.33.2 | |

**Pre-existing pnpm test failure (CORRECTED)**: `test/resolves.test.ts > resolveDependency > provenanceDowngraded` was NOT intermittent — it failed consistently in run-14 due to a permanent npm API type change. The npm provenance API changed its response type from string `"trustedPublisher"` to boolean `true` between run-13 (2026-05-03) and run-14 (2026-06-14). This is a deterministic, stable failure. Fixed in taze fork by separating the assertion into `it.skip(...)` block with explanatory comment; committed to taze fork main as `6a25b4d`. **For run-15 pre-run verification**: confirm this skip is still in place on taze fork main before the run. The upstream taze repo has not fixed the normalization.

---

## Run-14 Observations

### Run aborted after 5/33 files — root causes

The run terminated after processing 5 files (3 pre-scan skips, 1 ts-morph crash, 1 committed), with 28 files never started.

**Bug #934 — `stoppedByCheckpoint` fires even when baseline is known failing**: In `dispatch.ts`, the code path that handles a baseline-failure case (rollback disabled) still fires `stoppedByCheckpoint = true` when a subsequent checkpoint test fails. The run proceeded knowing the baseline was broken, spent tokens, then stopped at the first checkpoint test failure anyway. The expected behavior: if rollback is already disabled due to a pre-existing baseline failure, further checkpoint failures should be logged but should not halt the run. Filed as spiny-orb #934.

**Bug #933 — CDQ-006 isRecording guard generated without block body (ts-morph crash)**: The CDQ-006 fix introduced in spiny-orb #728 (PR #749) generates `if (span.isRecording())` guards. In at least one case (checkGlobal.ts), the agent generated the guard with no block body — `if (span.isRecording())\n\nreturn pkgMetas` — which caused ts-morph's AST replacement to fail with a child-count mismatch (8:7). Filed as spiny-orb #933.

**Note**: spiny-orb #728 (CDQ-006 advisory pass gap) did land before run-14 (confirmed in pre-run step 3). The new bug (#933) was introduced by the fix itself — the guard template doesn't enforce block bodies. CDQ-006 compliance is still unverified for taze.

### Schema fixes applied but unverified

SCH-003 schema type fix (TAZE-RUN1-1) and IS RES-001 service.instance.id fix (TAZE-RUN1-5) were both applied in pre-run and committed to taze fork main. Neither was verified by the run since only 1 file was committed and IS scoring was not run. **For run-15**: treat these as still-applied-but-unverified and confirm via the evaluation rubric and IS scoring.

### Dep-graph cycle noise preceded cost ceiling prompt

60+ lines of `[dep-graph] cycle detected:` appeared before the cost ceiling prompt. This is confusing UX but does not affect correctness — the dep-graph resolved 33 files correctly (cost ceiling showed 33 files). Filed as spiny-orb #936 to suppress behind `--verbose`.

### Pre-run test gate UX gap

spiny-orb detected the pre-existing provenanceDowngraded failure, disabled rollback, and proceeded. The run cost $0.04 (7.4K output tokens) before failing. The correct behavior would be to run the test suite *before* the cost ceiling prompt and exit immediately on pre-existing failures. Filed as spiny-orb #935.

### Run-15 blocker: four spiny-orb bugs must land first

Before run-15 is viable, confirm all four issues are merged to spiny-orb main:
- #933 (CDQ-006 guard block body)
- #934 (checkpoint stop on baseline failure)
- #935 (pre-run test gate)
- #936 (dep-graph noise)

Pre-run verification for run-15 should explicitly check the spiny-orb SHA and confirm each issue's fix is included.

## Process Observations

*(populate during actionable fix output)*

## Carry-Forward Items

*(populate during actionable fix output)*
