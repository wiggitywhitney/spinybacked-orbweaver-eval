# Run Summary — taze Run-9

**Date**: 2026-04-29
**Started**: 2026-04-29T18:23:59.096Z
**Duration**: 1h 10m 28.1s
**Branch**: spiny-orb/instrument-1777487039096
**Spiny-orb build**: main (d18616de24d60edc961bd7e820ff4f8f20a01d2f)
**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze)
**PR**: https://github.com/wiggitywhitney/taze/pull/4

---

## Results

| Metric | Value |
|--------|-------|
| Files discovered | 33 |
| Files processed | **33 of 33 — first complete run** |
| Committed | 11 |
| Correct skips | 19 |
| Partial | 0 |
| Failed | 3 |
| Total tokens (input) | 121.8K |
| Total tokens (output) | 239.5K |
| Cached tokens | 257.5K |
| Actual cost | ~$4.72 |
| Live-check | OK (partial — 3 files failed) |
| Push/PR | YES — PR #4 created |

---

## Milestone: First Complete Run

Run-9 processed all 33 files for the first time. 11 files committed with real instrumentation. The checkpoint test exclusion from run-8 held — no false-positive test failures stopped the run.

---

## Committed Files (11)

| File | Spans | New Attributes | Schema Extensions |
|------|-------|----------------|-------------------|
| src/api/check.ts | 1 | 0 | `span.taze.check` |
| src/cli.ts | 2 | 0 | `span.taze.cli.action` |
| src/commands/check/checkGlobal.ts | 1 | 0 | `span.taze.check.global` |
| src/commands/check/index.ts | 1 | 0 | `span.taze.check.command` |
| src/commands/check/interactive.ts | 1 | 0 | `span.taze.check.interactive` |
| src/config.ts | 1 | 1 | `span.taze.config.resolve`, `taze.config.sources_count` |
| src/io/bunWorkspaces.ts | 2 | 1 | `span.taze.bun_workspace.load/write`, `taze.bun_workspace.catalogs_count` |
| src/io/packages.ts | 3 | 0 | `span.taze.package.write/load`, `span.taze.packages.load` |
| src/io/pnpmWorkspaces.ts | 2 | 1 | `span.taze.pnpm_workspace.load/write`, `taze.pnpm_workspace.catalogs_count` |
| src/io/yarnWorkspaces.ts | 2 | 1 | `span.taze.yarn_workspace.load/write`, `taze.yarn_workspace.catalogs_count` |
| src/utils/packument.ts | 2 | 0 | `span.taze.fetch.npm`, `span.taze.fetch.jsr` |

**Total**: 18 spans across 11 files. 3 new schema attributes.

---

## Correct Skips (19)

All synchronous utilities, constant files, and type-only files. The pre-scan correctly identified these without calling the LLM (0.0K tokens for many). Consistent with expected behavior.

---

## Failed Files (3)

### src/io/packageJson.ts — NDS-001 (TypeScript literal type widening)

`startActiveSpan`'s async callback changes TypeScript's type inference for the return value. The original `return [{ type: 'package.json', ... }]` infers `type` as the string literal `'package.json'`. Inside a `startActiveSpan` callback, TypeScript widens it to `string`, breaking the discriminated union `PackageMeta` assignment (TS2322).

**Fix needed**: Agent prompt guidance to add `as const` to discriminant `type` fields, or cast the return array as `PackageMeta[]`. This is a prompt-side fix, not a validator fix.

### src/io/packageYaml.ts — NDS-001 (same root cause)

Identical pattern: `type: 'package.yaml'` widens to `string` inside `startActiveSpan` callback.

### src/io/resolves.ts — NDS-003 (`if (span.isRecording())` blocked)

The agent added `if (span.isRecording()) {` to guard an expensive `resolved.filter()` computation for a span attribute (CDQ-006 compliance). NDS-003 doesn't recognize `if (span.isRecording()) {` as an instrumentation pattern and flags it.

**Fix needed**: Add `if (span.isRecording()) {` to the NDS-003 allowlist.

---

## Agent Quality Observations

- `src/io/packages.ts`: 3 spans correctly covering `loadPackages`, `loadPackage`, and `writePackage` at 40% file coverage — justified because all three are async I/O entry points
- `src/utils/packument.ts`: correctly identified npm vs JSR fetch as separate span operations (`span.taze.fetch.npm`, `span.taze.fetch.jsr`)
- `src/io/bunWorkspaces.ts` / `pnpmWorkspaces.ts` / `yarnWorkspaces.ts`: consistent workspace instrumentation pattern with catalogs_count attribute across all three workspace types
- CDQ-007 compliance: raw filepath omitted from several spans, relative paths used instead
- NDS-007: bare `catch {}` blocks in unexported helpers preserved correctly

---

## Comparison to Prior Runs

| Metric | Run-8 | Run-9 |
|--------|-------|-------|
| Files processed | 10/33 | **33/33** |
| Committed | 6 | **11** |
| Correct skips | 4 | **19** |
| Failed | 0 | 3 |
| PR | #3 | **#4** |
| Checkpoint abort | YES (live-registry) | NO |

---

## Next Steps

Two new spiny-orb findings (see `spiny-orb-findings.md`):
1. Add `as const` guidance to TypeScript prompt for discriminant `type` fields
2. Add `if (span.isRecording()) {` to NDS-003 allowlist

After those fixes, run-10 should commit all 33 files (or very close to it).
