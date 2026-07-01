<!-- ABOUTME: PR artifact evaluation for taze run-16 — diff completeness, schema accuracy, span registration. -->
# PR Artifact Evaluation — taze Run-16

**PR**: https://github.com/wiggitywhitney/taze/pull/11
**Title**: Add OpenTelemetry instrumentation (33 files)
**Branch**: spiny-orb/instrument-1782059121456
**spiny-orb SHA**: 8a08f5b (includes #752 and #989)

---

## Run Summary Accuracy

| PR Claim | Actual | Match |
|----------|--------|-------|
| Files processed: 33 | 33 | ✓ |
| Committed: 13 | 13 | ✓ |
| No changes needed: 20 | 20 correct pre-scan skips | ✓ |
| Failed: 0 | 0 | ✓ |

**Note on resolves.ts**: Run-15 had resolves.ts listed under "no changes needed" (oscillation artifact). Run-16 correctly recovered resolves.ts with 6 spans — the file appears under "Committed" as expected.

---

## Per-File Table Accuracy

All 13 committed files listed. Span counts match per-file evaluation findings.

| File | PR Spans | Per-File Evaluation | Match |
|------|----------|---------------------|-------|
| checkGlobal.ts | 4 | 4 | ✓ |
| index.ts | 1 | 1 | ✓ |
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

---

## Schema Changes Section Accuracy

**New attributes added** (3): `taze.catalog.count`, `taze.package.deps_count`, `taze.package.file_path` — correctly identified. All three appear in `agent-extensions.yaml` with correct types (`int`, `int`, `string`). The PR summary accurately lists these as the only new attribute extensions.

**Note on `taze.write.changes_count`**: Not listed in the PR summary's "Added" section because it was already registered (first declared in a prior run). Correct — the PR only lists net-new declarations.

**New span IDs**: 35 span IDs listed. Cross-referencing against the 35 spans committed across 13 files:
- checkGlobal.ts: 4 spans (taze.check.global, taze.package.load_pnpm_global, taze.package.load_npm_global, taze.package.install) ✓
- index.ts: 1 span (taze.check.run) ✓
- interactive.ts: 1 span (taze.check.interactive) ✓
- config.ts: 1 span (taze.config.resolve) ✓
- bunWorkspaces.ts: 3 spans (taze.package.load_bun_workspace, taze.write.bun_workspace, taze.write.bun_json) ✓
- packageJson.ts: 2 spans (taze.package.load_package_json, taze.write.package_json) ✓
- packageYaml.ts: 4 spans (taze.package.read_yaml, taze.write.yaml, taze.package.load_package_yaml, taze.write.package_yaml) ✓
- packages.ts: 5 spans (taze.io.read_json, taze.io.write_json, taze.io.write_package, taze.io.load_package, taze.io.load_packages) ✓
- pnpmWorkspaces.ts: 2 spans (taze.package.load_pnpm_workspace, taze.write.pnpm_workspace) ✓
- resolves.ts: 6 spans (taze.io.load_cache, taze.io.dump_cache, taze.io.get_package_data, taze.resolve.dependency, taze.resolve.dependencies, taze.resolve.package) ✓
- yarnWorkspaces.ts: 2 spans (taze.package.load_yarn_workspace, taze.write.yarn_workspace) ✓
- api/check.ts: 2 spans (taze.check.packages, taze.check.single_project) ✓
- packument.ts: 2 spans (taze.fetch.package, taze.fetch.jsr_package) ✓

Total: 35 spans. All match. SCH-001 passes across all files.

---

## Schema Accuracy — `agent-extensions.yaml`

**Attribute declarations**: 6 total custom attributes declared across all runs (3 new in run-16, 3 inherited from prior runs). All 6 are declared with correct types at the schema level.

| Attribute | Declared Type | Code Usage | SCH-003 |
|-----------|--------------|------------|---------|
| taze.config.sources_found | int | `config.sources.length` (int) | PASS |
| taze.cache.hit | boolean | boolean conditions | PASS |
| taze.cache.changed | boolean | boolean conditions | PASS |
| taze.package.deps_count | int | Mixed — `deps.length` (int) in most files; `String(deps.length)` in checkGlobal.ts | **FAIL** (checkGlobal.ts) |
| taze.catalog.count | int | `catalogs.length` (int) in pnpmWorkspaces.ts, yarnWorkspaces.ts; `String(catalogs.length)` in bunWorkspaces.ts | **FAIL** (bunWorkspaces.ts) |
| taze.package.file_path | string | relative path strings | PASS |

**Pattern**: Two files pass String() casts through int-typed attributes despite the schema declaring them as integers. The schema declarations are correct; the code call sites are wrong. This is the same class of error (SCH-003) that appeared in run-15 and run-13.

---

## `traceloop-init.ts` Registration Block

**Not applicable** — taze does not use Traceloop. No centralized registration file exists or is expected. Each instrumented file acquires its own tracer via `const tracer = trace.getTracer('taze')` at module scope. This is the standard OTel API pattern for TypeScript CLIs without an instrumentation bootstrap file. The `spiny-orb.yaml` does not specify an `sdkInitFile`; there is no SDK init file in this codebase to register spans in.

---

## Companion `.instrumentation.md` Files

All 33 files (13 committed + 20 skipped) have a companion `.instrumentation.md` file on the instrument branch (feature introduced in spiny-orb #752). These files explain instrumentation decisions in structured form. Confirmed present via `git diff main spiny-orb/instrument-1782059121456 --name-only | grep instrumentation`.

---

## Diff Integrity

The PR diff contains:
- 13 `.ts` source file changes (instrumentation additions only; no business logic modified per NDS-003 evaluation)
- 33 companion `.instrumentation.md` files (new files, no pre-existing content to compare)
- `semconv/agent-extensions.yaml` (3 new attributes + 35 new span entries)
- `spiny-orb-pr-summary.md` (PR summary document)

No extraneous changes. No test file modifications. No package.json dependency changes (OTel API is a peerDependency already present in the baseline). Diff is clean.
