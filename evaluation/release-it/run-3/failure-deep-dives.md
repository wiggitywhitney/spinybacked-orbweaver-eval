# Failure Deep-Dives — release-it Run 3

**Run-3 result**: 3 committed, 2 failed, 0 partial, 18 correct skips.

---

## Run-Level Observations

### Weaver Prerequisite Check Fails Under `vals exec` — HOME Not Forwarded

The new `checkWeaverSchema` prerequisite in `feature/prd-687` calls `execFileSync('weaver', ['registry', 'check', '-r', registryPath], { timeout: 30000 })` without passing a `HOME` env option. Weaver needs `HOME` to write to `~/.weaver/vdir_cache/` when downloading the OTel semconv dependency zip. Under `vals exec`, `HOME` is not forwarded to the weaver subprocess — the download hangs and hits the 30s timeout, producing:

```text
Prerequisites failed — cannot proceed:
Weaver schema validation failed at .../semconv: Weaver Registry Check
Checking registry `.../semconv`
ℹ Found registry manifest: .../registry_manifest.yaml
Completed in 32.1s
```

Three runs failed before the workaround was found. Fix: add `HOME="$HOME"` to the `env` prefix in the instrument command (before `vals exec`). Permanent fix: spiny-orb should pass `{ env: { ...process.env, HOME: process.env.HOME || homedir() } }` in the `execFileSync` call.

All three eval target repos (commit-story-v2, taze, release-it) have the same OTel semconv dependency in their registry manifests. This will affect every future eval run that uses `feature/prd-687` or any branch that includes the weaver prerequisite check.

### PR Creation Targets Upstream Repo — Fine-Grained PAT Rejected

`createPr` in git-workflow.js calls `gh pr create` without `--repo`. The release-it fork has both an `origin` remote (`wiggitywhitney/release-it`) and an `upstream` remote (`release-it/release-it`). `gh` defaults to the upstream as the PR target. The fine-grained PAT is scoped to the fork only, so `gh pr create` fails:

```text
pull request create failed: GraphQL: Resource not accessible by personal access token (createPullRequest)
```

The branch was pushed successfully — only PR creation failed. This is the same GraphQL error observed in run-2, which was misdiagnosed as a PAT scope issue. The PAT scope was correct all along; the target repo was wrong.

This affects every eval target since every target is a fork. PR was created manually as https://github.com/wiggitywhitney/release-it/pull/2.

Fix: `createPr` should derive the PR target from `git remote get-url origin` and pass it as `--repo`.

### PR Creation Error Not Logged — Process Exits Silently

After the GraphQL error, the `deps.stderr("PR creation failed: ...")` call and the `finally` block's `"Completed in..."` message do not appear in the run log despite `2>&1 | tee` capturing all output. The process exits silently after the error. Root cause of the silent exit is not identified; it may be an unhandled promise rejection that escapes the try-catch async boundary and calls `process.exit()` before the `finally` block runs.

### Pre-Scan Accuracy: 18 Correct Skips (vs 3 in Run-2)

`feature/prd-687` dramatically improved pre-scan detection. 18 of 23 files were correctly identified as pure synchronous utilities requiring no instrumentation, up from 3 in run-2. This eliminated all 6 LINT failures from run-2: those files were being incorrectly attempted in run-2 and are now correctly skipped. LLM call count dropped accordingly — most of the cost was concentrated in the 5 files that actually needed evaluation.

Notable: `GitHub.js`, which failed NDS-003 in run-2, was pre-scanned as having no instrumentable functions in run-3. This warrants verification — see per-file evaluation.

---

## File-Level Failures

### lib/plugin/git/Git.js — `Anthropic API call failed: terminated`

**Status**: FAILED, 2 attempts  
**Failure type**: Infrastructure (API termination, not validation)

The agent completed its full thinking trace on attempt 1 (a long, detailed analysis of all 23 functions, span selection, ratio backstop calculation) and produced instrumented code. The Anthropic API call was terminated mid-generation before the response was returned. Attempt 2 produced the same termination.

**Agent's planned instrumentation** (from thinking trace):
- `isGitRepo` → `release_it.git.check_repo` (COV-004, pre-scan flagged)
- `init` → `release_it.git.init` (lifecycle entry point)
- `release` → `release_it.git.release` (lifecycle entry point)
- `push` → `release_it.git.push` (complex external git operations with error-handling paths)
- New attribute: `release_it.git.is_repo` (boolean result of isGitRepo)

The agent correctly reasoned through:
- RST-004 vs COV-004 tension on `isGitRepo` (unexported but pre-scan flagged it → instrument)
- Ratio backstop: 4/23 = 17.4%, under 20% threshold
- NDS-007 on the inner catch blocks in `push()` (graceful-degradation, no error recording)
- Correct use of `vcs.repository.url.full` from the registered schema

This is a high-quality instrumentation plan lost to infrastructure. Git.js has 23 functions and is the most complex file in the lib — it warrants a retry in run-4.

**Root cause**: Anthropic API termination (infrastructure). Not a spiny-orb or agent quality issue.  
**Run-4 action**: Retry. No schema or agent guidance changes needed.

---

### lib/plugin/gitlab/GitLab.js — COV-002 Oscillation

**Status**: FAILED, 3 attempts  
**Failure type**: Validator/pre-scan conflict (COV-002)

The pre-scan classified GitLab.js as having "no instrumentable functions — all are pure sync utilities or unexported helpers" and made no LLM call. However, the validator then flagged COV-002: fetch at line 188 has no enclosing span.

```text
COV-002: COV-002 check failed: fetch at line 188 has no enclosing span. Every outbound call
(HTTP requests, database queries, message publishing) should be enclosed in a span via
tracer.startActiveSpan() or tracer.startSpan() so that latency and errors are captured in traces.
```

This is a pre-scan false negative: the pre-scan determined the file had nothing to instrument, but the validator found an outbound HTTP call (`fetch` at line 188) with no span wrapper. The oscillation suggests the agent was not invoked at all (0 tokens, no agent notes in the log) — the pre-scan short-circuited straight to validation failure with no opportunity for the agent to add the required span.

**GitLab.js context**: GitLab.js is the GitLab plugin that handles release creation via the GitLab API. The `fetch` at line 188 is likely a GitLab API call — a clear COV-002 candidate. In run-2, GitLab.js failed COV-003/NDS-007 (graceful catch blocks). In run-3, the pre-scan prevented any instrumentation attempt, and the COV-002 validator then caught the bare fetch.

**Root cause**: Pre-scan over-classifies GitLab.js as a no-instrumentation file, skipping the agent. The COV-002 validator then runs on the original file and correctly flags the uninstrumented fetch. Three validation attempts with 0 tokens each — the agent was never called.

**Run-4 action**: Pre-scan fix needed. GitLab.js contains at least one outbound HTTP call and should not be classified as a pure-sync utility. May also require agent guidance on the COV-003 catch block issue from run-2 if it resurfaces.

---

## Summary

| File | Failure Mode | Retriable? | Run-4 Action |
|------|-------------|------------|--------------|
| Git.js | API termination (infrastructure) | Yes | Retry as-is |
| GitLab.js | Pre-scan false negative + COV-002 | Yes (needs pre-scan fix) | Needs spiny-orb pre-scan fix |
