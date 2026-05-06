# Lessons for Run 5

Observations collected during run-4 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

### Pre-run verification — 2026-05-06

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb.yaml | ✅ | Present in release-it fork root |
| semconv/ | ✅ | `attributes.yaml` + `registry_manifest.yaml` present |
| .js file inventory | ✅ | 23 files in `lib/` (same as runs 1–3 — fork is frozen) |
| GITHUB_TOKEN_RELEASE_IT | ✅ | Token valid — lives in release-it fork's `.vals.yaml` (NOT the eval repo's); always use `-f ~/Documents/Repositories/release-it/.vals.yaml` for dry-run checks |
| GIT_CONFIG_GLOBAL override | ✅ | `/Users/whitney.lee/.config/spiny-orb-eval/gitconfig` — carry forward from run-3 |
| @opentelemetry/api | ✅ | v1.9.1 in devDependencies |
| Working tree | ⚠️ restored | OTel devDeps from prior IS scoring run were present in package.json/package-lock.json — restored with `git restore` before this run |
| Node.js version | v25.8.0 | |
| spiny-orb SHA | 8dc65bf | main — all recent fixes included |
| release-it version | 20.0.0 | |

**RUN3-1 (pre-scan class method false negatives) resolution** ✅ FIXED: PR #781 merged to spiny-orb main. `classifyFunctions()` now traverses class bodies — the 8 files previously skipped (GitHub.js, npm.js, GitBase.js, GitRelease.js, Plugin.js, Version.js, prompt.js, shell.js) should now be attempted.

**RUN3-2 (gh pr create upstream targeting) resolution** ✅ FIXED: PR #781 merged. `createPr()` now passes `--repo owner/repo` derived from origin remote URL. Auto PR creation should work for this fork.

**RUN3-3 (HOME forwarding) status**: Keep `HOME="$HOME"` in instrument command. spiny-orb #786 propagates HOME to Weaver in schema-diff/checkpoint subprocesses, but the explicit prefix is still a safe safeguard.

**698 live-check gate** ✅ ACTIVE: PR #795 merged to spiny-orb main (commit 28e7f17). Run-4 will produce a three-state live-check result (pass/advisory/fail) in the PR summary and verbose log.

**Additional fixes on main since run-3**:
- PR #749 (#728): CDQ-006 pattern expansion + COV-003 outer catch guidance
- PR #798 (#784/#785): NDS-003 optional chaining + function-level fallback preamble fix
- PR #803 (#722): Namespace enforcement inside fix loop (wrong-namespace extensions now trigger retry)

**Instrument command for run-4** (run from `~/Documents/Repositories/release-it/`):
```bash
caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL HOME="$HOME" GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_RELEASE_IT node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument lib --verbose --thinking 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/release-it/run-4/spiny-orb-output.log'
```

Note: `HOME="$HOME"` required for Weaver. `vals exec` reads from release-it fork's `.vals.yaml` (not eval repo). Source directory is `lib/` (not `src/`).

---

## Run-4 Observations

*(fill in during and after the run)*

---

## Carry-Forward Items for Run 5

| # | Item | Priority | Type |
|---|------|---------|------|
