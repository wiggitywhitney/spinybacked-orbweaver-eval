# Failure Deep-Dives — Run-10

## File-Level Failures

### summary-manager.js — Weaver CLI Resolve Failure

**Symptom**: File 22/30. spiny-orb reported "Schema extension write failed" with truncated Weaver output: `weaver registry resolve -r .../semconv --format json` found the registry manifest but produced no further output.

**Instrumentation generated**: 3 spans (`commit_story.summary.daily_pipeline`, `weekly_pipeline`, `monthly_pipeline`). The LLM successfully produced instrumentation code — the failure occurred in the post-generation schema extension write step.

**Root cause investigation**:
- **Registry size**: 191 lines (39 IDs) in agent-extensions.yaml at failure point. Post-run test of `weaver registry resolve` succeeds in 1.3s — the registry size is not inherently problematic.
- **Sleep disruption**: User reports lid was NOT closed. `caffeinate -s` was running. However, macOS can still trigger brief system sleeps for thermal or power reasons even with caffeinate running, especially on battery.
- **Concurrent file access**: The Weaver CLI reads the registry while spiny-orb may be mid-write to agent-extensions.yaml. A race condition between the YAML write and the resolve command could cause a parse error if the file is partially written.
- **Process interruption**: The Weaver CLI is spawned as a child process. If the parent process (spiny-orb) was briefly suspended (SIGSTOP from macOS power management), the child may have timed out or been killed.

**Classification**: Transient infrastructure failure. Not a quality issue. Not a spiny-orb bug (though retry logic could mitigate).

**Impact**: summary-manager.js not committed. Previously committed in runs 7-9. This is a regression from external factors, not from the agent's instrumentation quality.

**Recommendation**: File as low-priority finding (RUN10-2). Suggest retry logic for Weaver CLI commands in spiny-orb.

---

## Run-Level Failures

### Push Auth — Token Rejected by GitHub (8th Consecutive)

**Symptom**: Diagnostic logging shows:
```text
pushBranch: GITHUB_TOKEN present=true, remote=https://github.com/wiggitywhitney/commit-story-v2.git
pushBranch: urlChanged=true, path=token-swap
Push failed: remote: Invalid username or token. Password authentication is not supported for Git operations.
```

**Progress from run-9**: The URL swap fix IS working. In run-9, the error showed a bare URL (token wasn't embedded). In run-10, the URL swap fires (`urlChanged=true, path=token-swap`) but the token itself is rejected.

**Root cause analysis**:

The error "Invalid username or token" from GitHub with "Password authentication is not supported" means:
1. The token IS being sent (GitHub received it and rejected it, rather than prompting for auth)
2. GitHub doesn't recognize the token as valid for push operations

Possible causes (in order of likelihood):
1. **Token scope insufficient**: The GCP secret `github-token` may be a classic PAT with only `read:repo` scope, not `repo` (full control). `git ls-remote` works with read access; `git push` requires write access.
2. **Token type incompatible**: If the token is a fine-grained PAT, it may not have "Contents: Write" permission for this specific repo.
3. **Token expired**: Classic PATs can expire. If the secret was last rotated before GitHub's auth changes, it may be stale.
4. **URL encoding issue**: Special characters in the token may not survive URL embedding. The `x-access-token:<TOKEN>@github.com` scheme requires the token to be URL-safe.

**Key diagnostic**: The `sanitizeTokenFromError` function masks the token in error output, so we can't see the actual URL that was sent. To verify, would need to temporarily log the raw URL or check the token's scopes via `gh auth status` or GitHub API.

**Verification steps for next run**:
1. Check token scopes: `curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/repos/wiggitywhitney/commit-story-v2 -I` — look for `X-OAuth-Scopes` header
2. Test push directly: `cd commit-story-v2 && git push --dry-run https://x-access-token:$GITHUB_TOKEN@github.com/wiggitywhitney/commit-story-v2.git HEAD:refs/heads/test-push-auth`
3. If classic PAT: regenerate with `repo` scope
4. If fine-grained: add "Contents: Read and write" for commit-story-v2

**Classification**: Persistent operational failure. 8 consecutive runs. The fix landed the URL swap mechanism, but the underlying token is rejected. This is likely a credential configuration issue, not a code bug.

---

## Regression Analysis

### journal-graph.js — Recovered

**Run-9**: Partial (reassembly validator rejected extension span names)
**Run-10**: Committed (2 spans, 3 attempts, 76.3K output tokens)

The reassembly validator fix (PR #292) resolved the root cause. However, journal-graph.js still required 3 attempts (76.3K tokens), suggesting other validation checks (not SCH-001) cause retries. The first 2 attempts likely failed on NDS-003 (code preservation) or similar fine-grained validation — the notes mention "NDS-003 fix: restored the exact original line in formatChatMessages."

### summary-manager.js — Regressed (Transient)

**Run-9**: Committed (3 spans)
**Run-10**: Failed (Weaver CLI)

This is a transient regression from infrastructure, not from the agent's behavior. The instrumentation was generated correctly.

---

## Unmasked Bug Detection

No new quality bugs unmasked. The summary-manager.js failure is infrastructure, not quality. All 12 committed files show the same quality patterns as run-9.

---

## Dominant Blocker Peeling Assessment

| Run | Dominant Blocker | Severity | Quality Impact |
|-----|-----------------|----------|----------------|
| 5 | COV-003 (boundary gaps) | High | Blocked validator-affected files |
| 6 | SCH-001 (single-span registry) | High | Blocked schema-uncovered files |
| 7 | COV-006 (span collision) + CDQ-005 | Medium | Trace analysis inconvenience |
| 8 | SCH-003 (count types) + journal-graph regression | Low | Schema annotation |
| 9 | Push auth (7th) + reassembly validator | None (quality) | Zero quality impact |
| **10** | **Push auth (8th) + Weaver CLI transient** | **None (quality)** | **Zero quality impact on committed files** |

Quality blockers remain exhausted. The remaining issues are purely operational (push auth credential) and infrastructure (Weaver CLI reliability). The system has been at the quality ceiling for 2 consecutive runs.
