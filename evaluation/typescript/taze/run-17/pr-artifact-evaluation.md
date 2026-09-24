<!-- ABOUTME: PR artifact evaluation for taze run-17 — diff completeness, schema accuracy, span registration. -->
# PR Artifact Evaluation — taze Run-17

**PR**: https://github.com/wiggitywhitney/taze/pull/13
**Title**: Add OpenTelemetry instrumentation (33 files)
**Branch**: spiny-orb/instrument-1789998344404
**spiny-orb SHA**: 4e7c2f0 (PRD-373 Python COV-004 checker work — unrelated to taze's carry-forward findings)

---

## Run Summary Accuracy

| PR Claim | Actual | Match |
|----------|--------|-------|
| Files processed: 33 | 33 | ✓ |
| Committed: 13 | 13 | ✓ |
| No changes needed: 20 | 20 confirmed correct pre-scan skips (per-file evaluation "Correct-Skip Verification") | ✓ |
| Failed: 0 | 0 | ✓ |

**Note on resolves.ts**: Run-16 recovered resolves.ts (6 spans) after run-15's oscillation. Run-17 committed it again with 6 spans on the first attempt (0 validation errors, down from run-16's 2 attempts) — the specific NDS-001 compilation instability is resolved. But per-file evaluation flags a new instability traded in: 4 of the 6 span names and 1 attribute (`taze.package.update_available`) drifted or dropped relative to run-16. Stability is partial, not full — see per-file evaluation's "Fix-verification confirmation" section.

---

## Per-File Table Accuracy

All 13 committed files listed. Span counts match per-file evaluation findings exactly.

| File | PR Spans | Per-File Evaluation | Match |
|------|----------|---------------------|-------|
| checkGlobal.ts | 4 | 4 | ✓ |
| check/index.ts | 1 | 1 | ✓ |
| interactive.ts | 1 | 1 | ✓ |
| config.ts | 1 | 1 | ✓ |
| bunWorkspaces.ts | 3 | 3 | ✓ |
| packageJson.ts | 2 | 2 | ✓ |
| packageYaml.ts | 4 | 4 | ✓ |
| packages.ts | 5 | 5 | ✓ |
| pnpmWorkspaces.ts | 2 | 2 | ✓ |
| resolves.ts | 6 | 6 | ✓ |
| yarnWorkspaces.ts | 2 | 2 | ✓ |
| api/check.ts | 2 | 2 | ✓ |
| packument.ts | 2 | 2 | ✓ |

Total: 35 spans, matching both the per-file evaluation total and the `agent-extensions.yaml` span-entry count (verified independently below).

---

## Schema Changes Section Accuracy

**New attributes added** (5): `taze.check.agent`, `taze.check.packages_loaded`, `taze.fetch.force`, `taze.io.catalogs_count`, `taze.io.file_path`. Cross-checked against the committed `semconv/agent-extensions.yaml` on the instrument branch — all 5 are present with declared types (`string`, `string`, `boolean`, `int`, `string`) matching what the PR summary claims. The PR summary accurately lists these as the only new attribute extensions; no omissions or extras found. This confirms only that the *declared* schema types match the PR's own listing — it says nothing about whether the *code* setting each attribute matches its declared type. Two of these five (`taze.check.packages_loaded`, `taze.io.catalogs_count`) fail that separate check; see the "Schema Accuracy" section below.

**New span IDs**: 35 span IDs listed in the PR body. Cross-referencing against `agent-extensions.yaml` (`grep -c '^  - id: span\.'` → 35) and against the 13 committed files' per-file span counts:

- checkGlobal.ts: 4 spans (`taze.check.global`, `taze.check.load_global_pnpm`, `taze.check.load_global_npm`, `taze.check.install_pkg`) ✓
- check/index.ts: 1 span (`taze.check.run`) ✓
- interactive.ts: 1 span (`taze.check.interactive`) ✓
- config.ts: 1 span (`taze.config.resolve`) ✓
- bunWorkspaces.ts: 3 spans (`taze.io.load_bun_workspace`, `taze.io.write_bun_workspace`, `taze.io.write_bun_json`) ✓
- packageJson.ts: 2 spans (`taze.io.load_package_json`, `taze.io.write_package_json`) ✓
- packageYaml.ts: 4 spans (`taze.io.read_yaml`, `taze.io.write_yaml`, `taze.io.load_package_yaml`, `taze.io.write_package_yaml`) ✓
- packages.ts: 5 spans (`taze.io.read_json`, `taze.io.write_json`, `taze.io.write_package`, `taze.io.load_package`, `taze.io.load_packages`) ✓
- pnpmWorkspaces.ts: 2 spans (`taze.io.load_pnpm_workspace`, `taze.io.write_pnpm_workspace`) ✓
- resolves.ts: 6 spans (`taze.io.load_cache`, `taze.io.dump_cache`, `taze.fetch.get_package_data`, `taze.check.resolve_dependency`, `taze.check.resolve_dependencies`, `taze.check.resolve_package`) ✓
- yarnWorkspaces.ts: 2 spans (`taze.io.load_yarn_workspace`, `taze.io.write_yarn_workspace`) ✓
- api/check.ts: 2 spans (`taze.check.packages`, `taze.check.single_project`) ✓
- packument.ts: 2 spans (`taze.fetch.npm_package`, `taze.fetch.jsr_package_meta`) ✓

Total: 35 spans. All match. SCH-001 passes across all files at the registration level (whether the semantic name choice was correct is scored per-file in the rubric evaluation, not here).

**Naming-style note vs. run-16**: several span and attribute names shifted style between runs even where the underlying operation is identical (e.g., `taze.package.load_pnpm_global` → `taze.check.load_global_pnpm`; `taze.package.file_path` → `taze.io.file_path`). This is cross-run churn, not a defect in this PR — run-16's schema extensions never merged to main (eval branches don't merge per this project's convention), so run-17's agent has no prior-run registry to stay consistent with. Per-file evaluation's reconciliation pass already resolved the resulting SCH-001/SCH-004 disagreements as PASS.

---

## Schema Accuracy — `agent-extensions.yaml`

**Attribute declarations**: 8 total custom attributes declared in the registry (5 new in run-17, 3 inherited: `taze.config.sources_found`, `taze.cache.hit`, `taze.cache.changed`). All 8 are declared with a type at the schema level.

| Attribute | Declared Type | Code Usage | SCH-003 |
|-----------|--------------|------------|---------|
| taze.config.sources_found | int | raw `.length`/`.reduce()` int across files (checkGlobal.ts, packages.ts, others) | PASS |
| taze.cache.hit | boolean | boolean conditions | PASS |
| taze.cache.changed | boolean | boolean conditions | PASS |
| taze.check.packages_loaded | **string** | `String(deps.length)` in checkGlobal.ts:216; `String(resolvePkgs.length)` in check/index.ts:66; `String(catalogs.length)` in pnpmWorkspaces.ts:64; `String(deps.length)` in packageYaml.ts:109 | **FAIL** (per exemption-scope semantic reading — schema was retyped to `string` to match the cast rather than the cast being fixed; recurs across all four sites) |
| taze.check.agent | string | raw string (`pkg.agent`) | PASS |
| taze.io.file_path | string | raw path strings | PASS |
| taze.io.catalogs_count | int | `String(catalogs.length)` in yarnWorkspaces.ts:58 | **FAIL** (yarnWorkspaces.ts — literal type mismatch, schema says `int`, code passes a string) |
| taze.fetch.force | boolean | boolean value | PASS |

**Pattern**: The run-16 carry-forward finding (count values cast to string despite an `int`-typed schema) did not resolve cleanly. It recurred in two distinct forms this run: (1) a **disguised** recurrence in `checkGlobal.ts`, `check/index.ts`, `pnpmWorkspaces.ts`, and `packageYaml.ts`, where the agent renamed the attribute and declared its schema type as `string` to match the `String()` cast instead of removing the cast (in `pnpmWorkspaces.ts` this is the `taze.check.packages_loaded` attribute, set via `String(catalogs.length)`, not `taze.io.catalogs_count`); and (2) a **literal** recurrence in `yarnWorkspaces.ts`, where the schema correctly declares `taze.io.catalogs_count` as `int` but the code passes `String(catalogs.length)` — the same undisguised mismatch as run-16. Full detail and the exemption-scope pre-commitment reasoning: `evaluation/typescript/taze/run-17/exemption-scope.md` and per-file evaluation sections for each named file.

---

## `traceloop-init.ts` Registration Block

**Not applicable** — taze does not use Traceloop, unchanged from run-16. No centralized registration file exists or is expected. Each instrumented file acquires its own tracer via `const tracer = trace.getTracer('taze')` at module scope. `spiny-orb.yaml` does not specify an `sdkInitFile`.

---

## Companion `.instrumentation.md` Files

All 33 files (13 committed + 20 skipped) have a companion `.instrumentation.md` file on the instrument branch. Confirmed via `gh api repos/wiggitywhitney/taze/pulls/13/files` — file list contains exactly 33 paths matching `*.instrumentation.md`, one per processed source file (13 committed `.ts` files' companions plus 20 skip-file companions).

---

## Diff Integrity

Verified against `git diff origin/main..spiny-orb/instrument-1789998344404` (49 files changed total):

- 13 `.ts` source file changes
- 33 companion `.instrumentation.md` files (new files)
- `semconv/agent-extensions.yaml` (5 new attributes + 35 new span entries)
- `spiny-orb-pr-summary.md`
- `spiny-orb-live-check-report.json`

**NDS-003 spot-check**: diffed each of the 13 committed `.ts` files against `origin/main`, filtering out lines touching tracer/span/OTel APIs. The remaining non-instrumentation diff lines are re-indentation from wrapping existing code in `startActiveSpan`/try-finally blocks (e.g. `packages.ts`'s `readJSON` body gaining a `try {` wrapper), plus the mechanical `as const` type-widening fix in `checkGlobal.ts` required by TypeScript's literal-type narrowing inside an async callback — both already documented in per-file evaluation as non-substantive. No business-logic changes found.

No extraneous changes. No test file modifications. No `package.json` dependency changes (OTel API remains a peerDependency already present in the baseline).

---

## PR Self-Reported Advisory Findings vs. Independent Evaluation

The PR's own "Advisory Findings" section (CDQ-007 raw-path / SCH-001 self-flags across 8 files) partially agrees with the independently-verified per-file evaluation, after per-file-evaluation.md's second reconciliation pass corrected an initial scoring error (see that file's "Second reconciliation pass" section):

- **CDQ-007** (flagged in checkGlobal.ts, bunWorkspaces.ts, packageYaml.ts, packages.ts, pnpmWorkspaces.ts, yarnWorkspaces.ts, api/check.ts, packument.ts): **5 of these 8 self-flags are genuine, confirmed FAILs** — `bunWorkspaces.ts`, `packageYaml.ts`, `packages.ts` (3 of 4 sites), `pnpmWorkspaces.ts`, and `yarnWorkspaces.ts` all set an unsanitized absolute filesystem path (`pathe`'s `resolve()` output or `pkg.filepath`) with no structural guarantee it can never be absolute, per the PRD's required structural-guarantee test (`prds/147-taze-evaluation-run-17.md` line 206) — confirmed by reading the instrument-branch source directly. The remaining 3 self-flags (`checkGlobal.ts`, `api/check.ts`, `packument.ts`) are genuine false positives — none of these files set a path-shaped attribute at all; `checkGlobal.ts`'s self-flag additionally cites line numbers (185, 249) that in the final committed file are int-count attributes, not paths, against an earlier draft. **The tool's advisory pass also missed a genuine failure it never flagged**: `packageJson.ts`'s write side (`pkg.filepath`, unsanitized) fails the same test but wasn't in the tool's self-flagged list at all.
- **SCH-001** (self-flagged only on packages.ts): per-file evaluation scores packages.ts SCH-001 as PASS (registry-extension mode) — all 5 span names are registered in `agent-extensions.yaml` following the dotted-notation convention. No unregistered or malformed span name found in this file.

Net: the tool's self-reported advisory findings on CDQ-007 were noisy but closer to correct than an earlier version of this evaluation gave them credit for — that earlier version dismissed all 8 self-flags as false positives using CDQ-007's literal rubric mechanism instead of the PRD's required test, an error corrected during the rubric-scoring milestone. Useful as a lead for review, but still not a substitute for independent evaluation — it missed `packageJson.ts` entirely.
