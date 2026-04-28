# Run Summary — taze Run-2

**Date**: 2026-04-24
**Started**: 2026-04-24T16:01:35.980Z
**Completed**: 2026-04-24T16:10:13Z (approx)
**Duration**: 8m 37.9s
**Branch**: none — run aborted before any files committed; no PR created
**Spiny-orb build**: feature/prd-372-typescript-provider (14a2fb0) — includes void-callback and re-export prompt guidance
**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze)
**PR**: none

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
| Total tokens (input) | 10.3K |
| Total tokens (output) | 17.3K |
| Cached tokens | 93.2K |
| Estimated cost | ~$0.35 |
| Live-check | DEGRADED (no spans emitted) |
| Push/PR | NO |

---

## Early Abort

Identical to run-1: all 3 processed files failed NDS-001 consecutively. Abort threshold triggered at file 3 of 33.

**Key difference from run-1**: the spiny-orb build includes void-callback and re-export prompt guidance (commit 14a2fb0). The prompt fix did not prevent NDS-001 — the agent correctly reasoned "nothing to instrument" but still generated an initial attempt that failed tsc. Prompt guidance alone is insufficient; the fix requires a pre-agent early-exit (PRD #582 M2).

---

## Failed Files (3 of 3 processed)

| File | Root cause | Notes |
|------|-----------|-------|
| src/addons/index.ts | NDS-001 — re-export only | Prompt fix: agent correctly cited RST-001. Still failed NDS-001 on first attempt. |
| src/addons/vscode.ts | NDS-001 — void sync method | Prompt fix: agent correctly cited RST-001 and void incompatibility. Still failed NDS-001. |
| src/api/check.ts | NDS-001 — TypeScript type error | Agent identified entry point, set schema attributes, used `error as Error` cast. tsc still failed. |

---

## New Finding: Checkpoint Test Failures

The end-of-run test suite reported 3 failures on **uninstrumented code** (0 files committed):

```text
FAIL test/cli.test.ts — "typescript unknown error: Timeout requesting 'typescript'"
FAIL test/packageConfig.test.ts — getPkgInfo('typescript').update expected true, got false
FAIL test/versions.test.ts — getMaxSatisfying returns undefined for 'major' mode
```

All three failures are live-registry tests that hit the npm/JSR registry for real version data. They passed in pre-run manual verification (`pnpm test`, all 73 passing) but timed out or returned stale data under spiny-orb's checkpoint run. Root cause is flaky live-network dependency, not instrumentation.

Also: spiny-orb.yaml should specify `testCommand: pnpm test` — taze is a pnpm project and while npm can invoke the test scripts, the canonical command is pnpm.

---

## Confirmed Findings vs Run-1

| Finding | Run-1 | Run-2 | Status |
|---------|-------|-------|--------|
| NDS-001 on uninstrumentable files | ✓ | ✓ | **Confirmed — prompt fix insufficient; needs PRD #582 early-exit** |
| Consecutive-failure abort at 3/33 | ✓ | ✓ | **Confirmed — file issue with spiny-orb team** |
| Checkpoint test failures (live registry) | — | ✓ | **New in run-2** |

---

## Next Steps

Run-3 should not proceed until PRD #582's early-exit condition (`hasInstrumentableFunctions: false` → correct skip, no LLM call) is implemented. Two identical aborts confirm the prompt-guidance-only approach is insufficient.
