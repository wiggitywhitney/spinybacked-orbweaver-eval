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

**Pre-existing pnpm test failure**: `test/resolves.test.ts > resolveDependency > provenanceDowngraded` fails intermittently — this is a live-registry test that queries npm provenance scores. The failure is non-deterministic (not always reproducible). The `spiny-orb-test-failure.log` untracked file in the taze fork records similar prior live-registry failures. This is a known condition for taze eval runs; spiny-orb's post-instrumentation checkpoint will show the same failure in the baseline comparison.

---

## Run-14 Observations

*(populate during pre-run verification and evaluation)*

## Process Observations

*(populate during actionable fix output)*

## Carry-Forward Items

*(populate during actionable fix output)*
