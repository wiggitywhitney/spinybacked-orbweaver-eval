# Lessons for Run 2

Observations collected during run-1 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

### Pre-run verification — 2026-04-24

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb.yaml | ✅ | Present at `~/Documents/Repositories/taze/spiny-orb.yaml` |
| semconv/ | ✅ | `attributes.yaml` + `registry_manifest.yaml` + `SCHEMA_DESIGN.md` present |
| .ts file inventory | ✅ | 33 files confirmed (see inventory below) |
| spiny-orb build | ✅ | Branch: `feature/prd-372-typescript-provider`, SHA: `b0a818b` |
| GITHUB_TOKEN_TAZE | ✅ | Dry-run push `HEAD:refs/heads/spiny-orb/auth-test` succeeded — `[new branch] HEAD -> spiny-orb/auth-test` |
| GIT_CONFIG_GLOBAL override | ✅ | `~/.config/spiny-orb-eval/gitconfig` exists — `tag.gpgsign = false`, `commit.gpgsign = false` |
| Node.js version | ✅ | v25.8.0 |
| spiny-orb version | ✅ | 1.0.0 |
| taze version | ✅ | 19.11.0 |

**Target**: wiggitywhitney/taze (fork of antfu-collective/taze)
**Source directory**: `src/` (33 TypeScript files)
**Package manager**: pnpm (required — `npm` does not support taze's catalog: protocol)

**Instrument command** (run from `~/Documents/Repositories/taze/`):
```bash
caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_TAZE node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-1/spiny-orb-output.log'
```

**Pre-schema test run (unmodified target, post-prerequisites):**
2026-04-24 — 16 test files, 73 tests, all passing. Duration ~6.5s. Build clean.
Command: `pnpm test` from `~/Documents/Repositories/taze/`

**Source file inventory (33 .ts files in `src/`):**
```text
src/addons/index.ts
src/addons/vscode.ts
src/api/check.ts
src/cli.ts
src/commands/check/checkGlobal.ts
src/commands/check/index.ts
src/commands/check/interactive.ts
src/commands/check/render.ts
src/config.ts
src/constants.ts
src/filters/diff-sorter.ts
src/index.ts
src/io/bunWorkspaces.ts
src/io/dependencies.ts
src/io/packageJson.ts
src/io/packages.ts
src/io/packageYaml.ts
src/io/pnpmWorkspaces.ts
src/io/resolves.ts
src/io/yarnWorkspaces.ts
src/log.ts
src/render.ts
src/types.ts
src/utils/config.ts
src/utils/context.ts
src/utils/dependenciesFilter.ts
src/utils/diff.ts
src/utils/package.ts
src/utils/packument.ts
src/utils/sha.ts
src/utils/sort.ts
src/utils/time.ts
src/utils/versions.ts
```

---

## Run-1 Observations

### Run-1 attempt — 2026-04-24 — BLOCKED before instrumentation

Blocker surfaced on first run attempt. `spiny-orb instrument src` exited after 3.9s with:

```text
File discovery failed: No JavaScript files found in .../taze/src.
```

Root cause: `coordinate()` doesn't pass a language provider to `discoverFiles()`, so it defaults to `JavaScriptProvider` regardless of the target language. The TypeScript provider is registered but never selected. Fix: add `language: typescript` to `spiny-orb.yaml`. Applied before second attempt.

### Run-1 result — 2026-04-24 — ABORTED at file 3/33

Second attempt (with `language: typescript` in `spiny-orb.yaml`) reached the agent but aborted after 3 consecutive NDS-001 failures:

- **src/addons/index.ts** — re-export only, no functions. Cycled 3 attempts before failing.
- **src/addons/vscode.ts** — one pure synchronous void method, nothing to instrument. `startActiveSpan()` return type incompatible with `void`.
- **src/api/check.ts** — real instrumentation attempted, schema reasoning surfaced, but TypeScript optional property access (`CheckOptions.mode`) caused compilation failure.

Consecutive-failure abort triggered after file 3. 30/33 files never reached. 0 files committed, no PR created.

---

## Carry-Forward Items for Run 2

- **NDS-001 / TypeScript type compatibility** must be fixed in spiny-orb before Run-2 is useful. Three distinct failure modes: (1) no-function files routed through agent, (2) `startActiveSpan()` incompatible with void sync methods, (3) cross-file optional property access rejected by tsc.
- **Consecutive-failure abort threshold** may need to be raised or made configurable for TypeScript runs, where early files often have nothing to instrument.
- **Re-run the full 33 files** once NDS-001 root causes are addressed — Run-1 produced no usable rubric baseline.
- **Schema reasoning in check.ts** was promising despite the failure — `taze.check.packages_total`, `taze.check.packages_outdated`, `taze.check.write_mode` were correctly identified. These attributes should appear again in Run-2.
