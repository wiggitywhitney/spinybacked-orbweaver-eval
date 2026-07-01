# Run Summary — taze Run-13

**Date**: 2026-05-03
**Started**: 2026-05-03T11:54:21.652Z
**Duration**: 54m 45.4s
**Branch**: spiny-orb/instrument-1777809261652
**Spiny-orb build**: main (d13f1a168f49350e0dab67380022442cb1d99c47) — SCH-001 advisory mode, NDS-003 regex literal fix
**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze)
**PR**: https://github.com/wiggitywhitney/taze/pull/8

---

## Results

| Metric | Value |
|--------|-------|
| Files discovered | 33 |
| Files processed | **33 of 33** |
| Committed | **14** |
| Correct skips | **19** |
| Failed | **0** |
| Rollbacks | **0** |
| Total tokens (input) | 62.0K |
| Total tokens (output) | 237.5K |
| Cached tokens | 139.8K |
| Live-check | **OK** |
| Push/PR | YES — PR #8 created |

**First perfect run: 33/33 files, 0 failures, 0 rollbacks.**

---

## Committed Files (14)

| File | Spans | New Attributes | Span Names |
|------|-------|----------------|------------|
| src/api/check.ts | 1 | 0 | `taze.check.run` |
| src/cli.ts | 2 | 0 | `taze.cli.run` |
| src/commands/check/checkGlobal.ts | 1 | 0 | `taze.check.global` |
| src/commands/check/index.ts | 1 | 0 | `taze.check.execute` |
| src/commands/check/interactive.ts | 1 | 0 | `taze.check.interactive` |
| src/config.ts | 1 | 1 | `taze.config.resolve`, `taze.config.sources_found` |
| src/io/bunWorkspaces.ts | 2 | 0 | `taze.bun.load_workspace`, `taze.bun.write_workspace` |
| src/io/packageJson.ts | 2 | 0 | `taze.package_json.load`, `taze.package_json.write` |
| src/io/packageYaml.ts | 4 | 0 | `taze.package_yaml.{read,write_file,load,write}` |
| src/io/packages.ts | 4 | 0 | `taze.io.{write_json,write_package,load_package,load_packages}` |
| src/io/pnpmWorkspaces.ts | 2 | 0 | `taze.pnpm_workspace.{load,write}` |
| src/io/resolves.ts | 6 | 2 | `taze.io.{load_cache,dump_cache}`, `taze.fetch.package_data`, `taze.check.resolve_{dependency,dependencies,package}`, `taze.cache.{hit,changed}` |
| src/io/yarnWorkspaces.ts | 2 | 0 | `taze.yarnrc.{load,write}` |
| src/utils/packument.ts | 2 | 0 | `taze.fetch.{npm_package,jsr_package}` |

**Total**: 31 spans, 3 new attributes across 14 files.

---

## Correct Skips (19)

All synchronous utility files, constant files, and type-only files. Pre-scan and RST-001/RST-004 rules working correctly throughout.

Zero false positives — every file that should have been instrumented was, and every file that shouldn't was correctly skipped.

---

## No Failures

This is the first run with zero NDS-001, NDS-003, or SCH-001 blocking failures. The two fixes that unlocked this:

1. **SCH-001 advisory mode**: Judge-detected semantic duplicates are now advisory, not blocking. The agent received suggestions and correctly decided to keep distinct, semantically precise span names. File 18 (`pnpmWorkspaces.ts`) explicitly noted an advisory suggestion and correctly kept `taze.pnpm_workspace.load` over the suggested `taze.io.load_package`.

2. **NDS-003 regex literal fix**: File 18 also noted it corrected a previous regex corruption (`/\./g` → `/\.  /g` with extra spaces). The fix held.

---

## No Rollback

The checkpoint test suite passed without triggering the rollback mechanism. This is consistent with the OTel SDK no-init analysis — when the tests pass, they pass; the live-registry flakiness is intermittent, not systematic.

---

## Agent Quality Highlights

- **resolves.ts** (6 spans, 83.5K tokens): Correct handling of all complex patterns — graceful catch preservation, return-value capture for `Promise.all`, 40% coverage ratio justified
- **packages.ts** (4 spans): Correctly skipped `readJSON` as a thin wrapper (RST-003), documented 80% coverage justification
- **SCH-001 advisory reasoning**: Agent explicitly engaged with advisory suggestions and made informed decisions about span naming throughout
- **Span namespace coherence**: All 14 files use consistent `taze.<domain>.<operation>` naming with no collisions

---

## Comparison to Prior Runs

| Metric | Run-11 | Run-12 | Run-13 |
|--------|--------|--------|--------|
| Files committed | 13 | 6 | **14** |
| Failures | 1 | 13 | **0** |
| Rollbacks | 3 files | 5 files | **0** |
| Duration | 1h 4m | 1h 37m | **54m** |
| PR | #6 | #7 | **#8** |

---

## Next Steps

This run establishes the TypeScript baseline. Proceed to the analysis phase:
- Failure deep-dives (trivial — 0 failures this run)
- Per-file evaluation (32-rule rubric on all 33 files)
- PR artifact evaluation
- Rubric scoring (first TypeScript baseline)
- Baseline comparison (against JS runs)
- IS scoring
- Actionable fix output
- Draft next run PRD (Type D)
