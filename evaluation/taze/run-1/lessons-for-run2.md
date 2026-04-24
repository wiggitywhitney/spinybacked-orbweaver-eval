# Lessons for Run 2

Observations collected during run-1 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

### Pre-run verification — (fill in at run time)

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb.yaml | | |
| semconv/ | | |
| .ts file inventory | | |
| spiny-orb build | | Branch: `feature/prd-372-typescript-provider`, SHA: (fill in) |
| GITHUB_TOKEN_TAZE | | Fine-grained PAT with contents:write + pull_requests:write for wiggitywhitney/taze |
| GIT_CONFIG_GLOBAL override | | `/Users/whitney.lee/.config/spiny-orb-eval/gitconfig` — disables tag.gpgsign |
| Node.js version | | (fill in at run time) |
| spiny-orb version | | (fill in at run time) |
| taze version | | |

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
*(fill in after confirming from fork — run `find src -name "*.ts" | grep -v "\.d\.ts" | sort`)*

---

## Run-1 Observations

*(fill in during and after the run)*

---

## Carry-Forward Items for Run 2

*(fill in during actionable fix output milestone)*
