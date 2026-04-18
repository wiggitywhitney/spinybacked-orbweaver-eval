# Failure Deep-Dives — Run-9

## 1. Push Authentication Failure (7th Consecutive)

### Symptom

```text
Push failed — skipping PR creation: Pushing to https://github.com/wiggitywhitney/commit-story-v2.git
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/wiggitywhitney/commit-story-v2.git/'
```

### Evidence

The error message shows the **bare HTTPS URL** (`https://github.com/wiggitywhitney/commit-story-v2.git`), not the token-embedded URL (`https://x-access-token:<token>@github.com/...`). Since `sanitizeTokenFromError()` replaces tokens with `***` (not removes the whole prefix), if the URL swap had fired, we'd see `https://x-access-token:***@github.com/...`. The bare URL means the swap **did not happen**.

### Code Path Analysis

`pushBranch()` in `git-wrapper.ts` (line 117-175):
1. `token = process.env.GITHUB_TOKEN` — if falsy, falls through to bare push (line 174)
2. `remoteUrl = git.remote(['get-url', remote])` — gets fetch URL
3. `authUrl = resolveAuthenticatedUrl(remoteUrl, token)` — embeds token
4. If `authUrl !== remoteUrl` → set pushurl, push, restore

The bare URL in the error means the code took the **fallback path** (line 174), which means one of:
- `process.env.GITHUB_TOKEN` was falsy (empty string, undefined)
- `remoteUrl` was falsy
- `authUrl === remoteUrl` (impossible for HTTPS GitHub URLs with a token)

### Root Cause Hypothesis

**Most likely**: `GITHUB_TOKEN` was not in the spiny-orb process environment despite `vals exec -i -f .vals.yaml`. Possible reasons:

1. **vals secret resolution failure**: If the GCP secret lookup for `ref+gcpsecrets://demoo-ooclock/github-token` silently returns empty, `GITHUB_TOKEN=""` would make `if (token)` false. The pre-run verification tested `git ls-remote` with the token **from the eval repo's vals context** — but the run used **commit-story-v2's** `.vals.yaml`. Both reference the same GCP secret, but the resolution context differs.

2. **Environment variable collision**: The `gh auth` credential helper is configured (`Git operations protocol: https`). When the fallback `git push origin branch` runs, git asks `gh auth` for credentials. If `GITHUB_TOKEN` env var interferes with `gh auth`'s credential store lookup, it may provide a stale or wrong token.

3. **simpleGit environment isolation**: The `simple-git` library spawns git subprocesses. If it doesn't inherit the full environment (or if `vals exec` uses a mechanism that doesn't propagate to grandchild processes), `GITHUB_TOKEN` may be missing from the `git push` subprocess.

### Verification Needed (for run-10)

Add `console.log('GITHUB_TOKEN present:', !!process.env.GITHUB_TOKEN)` before the `if (token)` check in `pushBranch()`. This disambiguates whether the token was missing vs the URL swap logic failed.

### Pre-Run Verification Gap

Pre-run verification tested `git ls-remote https://x-access-token:${GITHUB_TOKEN}@github.com/...` and it passed. But this tested the token value, not the spiny-orb code path. The actual `pushBranch()` function was never exercised end-to-end. A more accurate pre-run test would be:
```bash
# Test the actual spiny-orb push code path on a test branch
node -e "import('./pushBranch-test.js')" # calling pushBranch() directly
```

---

## 2. journal-graph.js Partial (Reassembly Validator Bug)

### Symptom

```text
journal-graph.js: partial (1 spans, 2 attempts, 91.4K output tokens)
Reassembly validation failed — using partial results. Failing rules: SCH-001 (Span Names Match Registry):
  SCH-001 check failed: "commit_story.journal.generate_sections" at line 601: not found in registry span definitions.
```

### Evidence

The diagnostic logging (PR #277) reveals the **exact failure**: the reassembly validator's SCH-001 check rejects the span name `commit_story.journal.generate_sections` because it's "not found in registry span definitions."

But the agent DID declare this span as an extension:
```text
Extensions: span.commit_story.journal.generate_sections
```

And the span IS in `agent-extensions.yaml`:
```yaml
- id: span.commit_story.journal.generate_sections
  type: span
  stability: development
  brief: "Agent-discovered span: commit_story.journal.generate_sections"
  span_kind: internal
```

### Root Cause

The reassembly validator checks span names against the **base registry** (`semconv/`) but not the **agent-extensions.yaml** (which accumulates extensions during the run). Since `commit_story.journal.generate_sections` is an invented span name (not in the base registry), the validator rejects it.

This is a **bug in the reassembly validator**, not non-deterministic LLM behavior. The validator should check the **resolved registry** (base + extensions) rather than just the base.

### Why It Appeared Non-Deterministic

In run-7, journal-graph.js committed successfully. This likely means either:
1. The span name matched a base registry entry in run-7 (different name chosen)
2. The reassembly validator was less strict in the run-7 version of spiny-orb
3. The SCH-001 check was added or tightened between run-7 and run-8

The "non-deterministic oscillation" across runs was actually a version-dependent validator behavior, not LLM randomness.

### Cost Impact

| Run | Attempts | Output Tokens | Committed? |
|-----|----------|---------------|-----------|
| Run-7 | 1 | ~30K (est) | Yes |
| Run-8 | 3 | 70.4K | No |
| Run-9 | 2 | 91.4K | No |

Run-9's cost guard (PR #271, max 50K output tokens per attempt) limited attempts to 2. But 91.4K tokens (50.7% of total run output) was still wasted for zero committed value.

### Fix

The spiny-orb team should make the reassembly validator's SCH-001 check resolve span names against the combined registry (base + agent-extensions.yaml), not just the base. This is a straightforward fix — the extensions are already written to disk before reassembly validation runs.

### Acceptance Criteria

1. journal-graph.js commits with extension span names (not in base registry)
2. SCH-001 reassembly check uses resolved registry (base + extensions)
3. Cost per run decreases by ~90K tokens (journal-graph.js succeeds on first attempt)

---

## 3. Unmasked Bug Detection

With SCH-003 fixed (count attribute types), the **dominant blocker peeling pattern** reveals:

| Run | Dominant Blocker | Severity |
|-----|-----------------|----------|
| 5 | COV-003 (boundary gaps) | High |
| 6 | SCH-001 (single-span registry) | High |
| 7 | COV-006 (span collision) + CDQ-005 (count types) | Medium |
| 8 | SCH-003 (count types) + journal-graph regression | Low |
| **9** | **Push auth (7th consecutive) + reassembly validator bug** | **Low (quality) / Critical (delivery)** |

**No new quality blocker emerged behind SCH-003.** The remaining issues are:
- Push auth: delivery failure (no PR), not quality failure
- Reassembly validator: file coverage issue (journal-graph.js), not quality failure on committed files
- All 12 committed files pass the same rules as run-8 (with SCH-003 now fixed)

The system has reached a **quality plateau at the top**. The remaining issues are infrastructure (push) and tooling (validator) — not agent intelligence or prompt quality.

---

## 4. No Regressions Detected

All 12 committed files from run-8 committed again in run-9. No file regressed. No new failure modes emerged in committed files.
