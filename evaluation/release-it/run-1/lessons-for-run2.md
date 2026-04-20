# Lessons for Run 2

Observations collected during run-1 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

### Pre-run verification — 2026-04-18

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb.yaml | ✅ | `schemaPath: semconv`, `sdkInitFile: examples/instrumentation.js`, `dependencyStrategy: peerDependencies` |
| semconv/ | ✅ | `attributes.yaml` + `registry_manifest.yaml` present |
| .js file inventory | ✅ | 23 files in `lib/` (see inventory below) |
| spiny-orb build | ✅ | Built clean from main (SHA a02004f, includes PR #506 KNOWN_FRAMEWORK_PACKAGES expansion) |
| GITHUB_TOKEN | ✅ | Resolves via vals |
| Node.js version | v25.8.0 | |
| spiny-orb version | 1.0.0 (SHA a02004f) | |
| release-it version | 20.0.0 | |

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

**Instrument command for run-1** (run from `~/Documents/Repositories/release-it/`):
```bash
caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument lib --verbose 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/release-it/run-1/spiny-orb-output.log
```

Note: source directory is `lib/` (not `src/`).

### Test suite baseline (post-prerequisites, pre-instrumentation)

Run with `GIT_CONFIG_GLOBAL=/tmp/release-it-test.gitconfig npm test` (minimal config: user email + name only, no `tag.gpgsign`).

**3 consecutive clean runs — 2026-04-18:**

| Run | Pass | Fail | Skipped | Total |
|-----|------|------|---------|-------|
| 1   | 262  | 0    | 2       | 264   |
| 2   | 262  | 0    | 2       | 264   |
| 3   | 262  | 0    | 2       | 264   |

**Consistently skipped (not failures):**
- `should not roll back with risky config`
- `should truncate long body`

The 2 skipped tests are stable and unrelated to instrumentation. The suite is clean for run-1.

## Run-Level Observations

<!-- Populate after evaluation run completes -->

## Evaluation Process Observations

<!-- Populate during structured evaluation -->
