# Run Summary — taze Run-11

**Date**: 2026-04-30 / 2026-05-01
**Started**: 2026-04-30T23:43:26.720Z
**Duration**: 1h 4m 39.9s
**Branch**: spiny-orb/instrument-1777592606721
**Spiny-orb build**: main (0cd463214a3f4bb93fd03729e34ca3e15e1242c8) — includes `as const` normalization, schema append-only writes, isRecording guard
**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze)
**PR**: https://github.com/wiggitywhitney/taze/pull/6
**Note**: Started from taze main (clean, uninstrumented)

---

## Results

| Metric | Value |
|--------|-------|
| Files discovered | 33 |
| Files processed | 33 of 33 |
| Committed | 13 (3 rolled back by end-of-run test failure — net 10 in PR) |
| Correct skips | 16 |
| Partial | 0 |
| Failed | 4 (1 NDS-003 + 3 rolled back) |
| Total tokens (input) | 40.9K |
| Total tokens (output) | 234.6K |
| Cached tokens | 186.2K |
| Live-check | OK (partial) |
| Push/PR | YES — PR #6 created |

---

## Rolled-back Files (3)

The end-of-run test suite failed (`test/resolves.test.ts > resolveDependency` — npm timeout at line 136). Spiny-orb rolled back three committed files:
- `src/io/yarnWorkspaces.ts`
- `src/io/pnpmWorkspaces.ts`
- `src/utils/packument.ts`

**Root cause**: The failing test hits the live npm registry. `resolves.ts` was never committed (failed NDS-003), so the test exercised untouched code. The rollback was incorrect — it removed correctly-instrumented files due to a failure in code we didn't change.

**Key insight confirmed this session**: The OTel SDK never initializes during `pnpm test` (no `--import` flag, no SDK setup in vitest.config.ts). Span wrappers are no-ops during tests — our instrumentation cannot cause npm timeouts. The rollback logic doesn't account for this.

---

## Failed File (NDS-003)

**src/io/resolves.ts**: Six NDS-003 violations across three distinct patterns:
1. Braceless `if (!cacheChanged)` → agent added braces
2. `return Promise.all(...)` → agent rewrote as `const result = await Promise.all(...)` for `setAttribute`; reconciler doesn't strip `await` before comparing
3. `throw spanError` → renamed catch variable not in the `throw` pattern allowlist

All three are legitimate instrumentation-motivated transformations with zero runtime behavioral effect. Filed as spiny-orb issue #675. Fixed in PR #676.

---

## Agent Quality

32 of 33 files processed cleanly. The agent instrumented complex files correctly:
- `src/io/packages.ts`: 3 spans covering `loadPackages`, `loadPackage`, and `writePackage`
- `src/io/packument.ts`: 2 spans for npm vs JSR fetch operations
- `src/utils/packument.ts`: correct span lifecycle with no-op during test suite
- All workspace files (`bun`, `pnpm`, `yarn`): consistent pattern with workspace-specific span names

---

## Next Steps

- NDS-003 fix shipped (issue #675, PR #676)
- Test exclusions reverted — `pnpm test` restored, no `--exclude` flags
- Run-12 from taze main should commit all 33 files
