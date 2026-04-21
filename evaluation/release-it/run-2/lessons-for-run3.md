# Lessons for Run 3

Observations collected during run-2 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

### Pre-run verification — 2026-04-21

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb.yaml | ✅ | `schemaPath: semconv`, `sdkInitFile: examples/instrumentation.js`, `dependencyStrategy: peerDependencies` |
| semconv/ | ✅ | `attributes.yaml` present (updated in issue #67: replaced custom git attrs with semconv refs) |
| .js file inventory | ✅ | 23 files in `lib/` (same as run-1 — fork is frozen) |
| GITHUB_TOKEN_RELEASE_IT | ✅ | Fine-grained PAT with `pull_requests:write`, resolves via vals |
| GIT_CONFIG_GLOBAL override | ✅ | `/Users/whitney.lee/.config/spiny-orb-eval/gitconfig` — disables `tag.gpgsign` and `commit.gpgsign` |
| .gitignore modification | ✅ (benign) | `+.vals.yaml` added — not a blocker |
| Node.js version | v25.8.0 | |
| spiny-orb version | 1.0.0 (SHA 942012e) | Branch `fix/issue-acceptance-gate-index-js-token-budget`: doubled TOKENS_PER_LINE, raised MAX_OUTPUT_TOKENS_PER_FILE |
| release-it version | 20.0.0 | |

**RUN1-1 (gpgsign) resolution**: Using `GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig` in the instrument command prefix. The override file inherits all normal git identity/credential settings but sets `tag.gpgsign=false` and `commit.gpgsign=false`. Global `~/.gitconfig` has no gpgsign entries, confirming no conflict.

**RUN1-2 (arrowParens LINT oscillation)**: **FIXED** in spiny-orb PR #532 (closes #516). The fix-loop now computes a context diff between agent output and Prettier-reformatted output and includes it in LINT failure feedback — showing exactly which lines need arrowParens changes. Before: "Run Prettier on the output." After: exact diff showing `(span) => ` → `span => `. `config.js` and `index.js` are now expected to commit cleanly this run.

**RUN1-3 (PAT pull_request:write) resolution**: New fine-grained PAT scoped to `wiggitywhitney/release-it` with `pull_requests:write`. Stored as `github-token-release-it` in GCP Secret Manager, injected as `GITHUB_TOKEN_RELEASE_IT` via vals. Instrument command uses `bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_RELEASE_IT node ...'`.

**Source file inventory (23 .js files in `lib/`):**
```text
lib/args.js                      lib/plugin/GitBase.js
lib/cli.js                       lib/plugin/GitRelease.js
lib/config.js                    lib/plugin/Plugin.js
lib/index.js                     lib/plugin/factory.js
lib/log.js                       lib/plugin/git/Git.js
lib/prompt.js                    lib/plugin/git/prompts.js
lib/shell.js                     lib/plugin/github/GitHub.js
lib/spinner.js                   lib/plugin/github/prompts.js
lib/util.js                      lib/plugin/github/util.js
lib/plugin/npm/npm.js            lib/plugin/gitlab/GitLab.js
lib/plugin/npm/prompts.js        lib/plugin/gitlab/prompts.js
lib/plugin/version/Version.js
```

**Instrument command for run-2** (run from `~/Documents/Repositories/release-it/`):
```bash
caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_RELEASE_IT node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument lib --verbose 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/release-it/run-2/spiny-orb-output.log'
```

Note: source directory is `lib/` (not `src/`).

---

## Run-2 Observations

*(fill in during and after the run)*

---

## Carry-Forward Items for Run 3

| # | Item | Priority | Type |
|---|------|---------|------|
| 1 | OTel module resolution at checkpoint — add @opentelemetry/api to devDependencies in release-it fork before run | P1 blocker | Eval config |
| 2 | PAT lacks pull_requests:write — update github-token-release-it secret in GCP Secret Manager | P1 blocker | Eval config |
| 3 | arrowParens + print-width LINT cascade (6 files) — spiny-orb Prettier post-pass would fix | P2 | spiny-orb |
| 4 | NDS-003 on GitHub.js — omit release_id attribute or add return-value-capture exemption to NDS-003 validator | P2 | spiny-orb |
| 5 | COV-003/NDS-007 conflict on GitLab.js — validator should exempt graceful-degradation catch blocks | P2 | spiny-orb |
| 6 | GitBase.js span naming uses release-it.* (hyphen) vs release_it.* (underscore) elsewhere | P3 | Agent |
| 7 | 18 span schema extensions not yet in registry — validate and register once stable | P3 | Schema |
