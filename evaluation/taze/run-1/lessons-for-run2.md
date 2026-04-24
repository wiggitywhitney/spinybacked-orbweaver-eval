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

*(fill in during and after the run)*

---

## Carry-Forward Items for Run 2

*(fill in during actionable fix output milestone)*
