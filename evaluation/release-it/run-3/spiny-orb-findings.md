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

### FINDING-RUN-1: PR creation crash is silent — process exits without logging and without `finally` running

**Severity**: P2 (PR not created; user has no indication of what went wrong)

**Symptom**: After a successful push, the spiny-orb process exits abruptly. The log ends at the `onRunComplete` "Run complete" line with no push/PR output and no "Completed in..." from the `finally` block in `instrument-handler.js`. No error message appears. The instrument branch exists on the remote but no PR is created.

**Root cause (inferred)**: `createPr` in `git-workflow.js` is wrapped in a try-catch (lines 128–134), but something in the `deps.createPr` call path is crashing the process in a way that bypasses both the try-catch and the `finally` block in `instrument-handler.js`. The most likely mechanism is an unhandled promise rejection or a synchronous throw from a dependency that escapes the async boundary.

**Evidence**: 
- Branch `spiny-orb/instrument-1777912706406` IS on remote (push succeeded)
- No PR existed on `wiggitywhitney/release-it` after the run
- Log ends with "Run complete" + token summary, no subsequent output
- `finally` block `deps.stderr(\`Completed in ${formatDuration(durationMs)}\`)` never fired

**Workaround**: Create the PR manually with `gh pr create --repo <fork> --head <branch> --base main`.

**Suggested fix**: Ensure `createPr` errors are caught at the process level, not just inside `runGitWorkflow`. Add a top-level unhandled rejection handler that logs to stderr before exiting. The `finally` block should print "Completed in..." unconditionally — if it's not printing, something is calling `process.exit()` or an uncaught synchronous throw is escaping the async boundary.

---

## P3 — Low Priority

*(fill in during run and failure deep-dives)*
