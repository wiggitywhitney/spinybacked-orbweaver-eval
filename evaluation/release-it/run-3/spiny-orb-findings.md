# spiny-orb Findings — release-it Run 3

Issues and observations surfaced by spiny-orb during run-3 that warrant filing as GitHub issues or PRD items.

---

## P1 — Blocking

*(fill in during run and failure deep-dives)*

---

## Pre-run findings (before run-3 executed)

### FINDING-PRE-1: Weaver registry check timeout produces misleading "validation failed" message

**Severity**: P2 (blocks first-run UX; workaround exists)

**Symptom**: On first run in a fresh environment, `spiny-orb instrument` exits immediately with:
```text
Prerequisites failed — cannot proceed:
Weaver schema validation failed at .../semconv: Weaver Registry Check
Checking registry `.../semconv`
ℹ Found registry manifest: .../registry_manifest.yaml
Completed in 32.1s
```

**Root cause**: `checkWeaverSchema` in `dist/config/prerequisites.js` calls `execFileSync('weaver', ['registry', 'check', '-r', fullPath], { timeout: 30000 })`. Weaver resolves the OTel semconv dependency (`registry_manifest.yaml` has `registry_path: https://github.com/open-telemetry/semantic-conventions/archive/refs/tags/v1.37.0.zip[model]`) by downloading the zip from GitHub CDN on **every run** to a new random temp directory — there is no persistent cache. Under normal CDN conditions the download takes 1–3s; under variable CDN conditions (network variance, GitHub CDN slowness) it has been observed at 12–32s. The 30s `execFileSync` timeout then fires, kills weaver via SIGTERM, and the error handler surfaces the partial stdout as a validation failure.

**Why it's confusing**:
1. The error says "schema validation failed" — sounds like a schema bug, not a timeout
2. Weaver's partial stdout in the error message shows "Completed in 32.1s" which looks like success
3. The timeout fires on every run (no caching), so retrying does not reliably help
4. No guidance: "try again" vs "fix your schema" are equally plausible to the user

**Workaround**: Retry — CDN response time is variable. Run `weaver registry check -r semconv` from the project directory first; if it completes in <25s the instrument run will succeed.

**Suggested fix**: Two separate issues:
1. **No persistent cache**: Weaver downloads the OTel semconv zip to a new temp dir every run. Adding a content-addressed persistent cache (keyed by the archive URL) would make subsequent runs instant.
2. **Misleading error message**: Catch `ETIMEDOUT` / `error.killed` separately from non-zero exit and emit: `"Weaver dependency download timed out (>30s). This is a network issue, not a schema error. Retry the command."` Also consider increasing the timeout to 120s to accommodate CDN variance.

---

## P2 — High Priority

### FINDING-RUN-1: `createPr` targets upstream repo in forks — PAT cannot authenticate to upstream

**Severity**: P1 (PR never created in any forked eval target repo)

**Root cause**: `createPr` in `git-workflow.js` calls `gh pr create` without `--repo`. In a forked repo with both `origin` (the fork) and `upstream` remotes, `gh` defaults to the upstream as the PR target. The fine-grained PAT is scoped to the fork (`wiggitywhitney/release-it`) and cannot create PRs on the upstream (`release-it/release-it`). Result:

```text
pull request create failed: GraphQL: Resource not accessible by personal access token (createPullRequest)
```

This is the same GraphQL error that blocked run-2 — which was misdiagnosed as a missing `pull_requests:write` scope. The PAT scope was correct all along; the target repo was wrong.

**Confirmed by**: Running `gh pr create --head spiny-orb/instrument-1777912706406 --title "test" --body "test"` from the fork directory (no `--repo`) reproduces the exact error. Adding `--repo wiggitywhitney/release-it` succeeds.

**Secondary symptom**: The "PR creation failed: ..." log message and the "Completed in..." `finally` output are missing from the run log despite the error being caught by the try-catch in `runGitWorkflow`. The error IS caught, but something prevents those `deps.stderr` calls from reaching the tee file. Root cause of the silent exit is a separate investigation item.

**Workaround**: Create the PR manually: `gh pr create --repo wiggitywhitney/release-it --head <branch> --base main`.

**Suggested fix**: In `createPr`, derive the target repo from the `origin` remote URL rather than letting `gh` default to upstream:
```javascript
const originUrl = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: projectDir }).toString().trim();
// parse "owner/repo" from https://github.com/owner/repo.git or git@github.com:owner/repo.git
args.push('--repo', parseGhRepo(originUrl));
```
This applies to every eval target that is a fork — which is all of them.

---

## P3 — Low Priority

*(fill in during run and failure deep-dives)*
