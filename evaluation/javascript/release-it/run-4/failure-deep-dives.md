# Failure Deep-Dives — release-it Run 4

**Run-4 result**: 7 committed, 6 failed, 0 partial, 10 correct skips.

---

## Run-Level Observations

### Push — CONFIRMED WORKING (RUN3-2 FIXED)

First successful auto-push to fork in the release-it eval chain:
- `GITHUB_TOKEN present=true`
- `urlChanged=true, path=token-swap` — spiny-orb PR #781 (createPr `--repo` fix) fired correctly; URL was rewritten to the fork before push
- Instrument branch `spiny-orb/instrument-1778091147901` pushed to `wiggitywhitney/release-it`

RUN3-2 is resolved. The fork targeting fix works.

### PR Creation — NEW FAILURE: spawn E2BIG

The instrument PR was not auto-created. `spawn E2BIG` means the argument list (PR body) exceeded the OS limit. The PR summary file on disk is **12MB** — the full Weaver live-check compliance report JSON is embedded in it. When spiny-orb passes the PR body as a command-line argument to `gh pr create`, the OS rejects the spawned process.

Root cause: PR #698 (live-check) appends the full compliance report to the PR body. At 2173 spans × multiple JSON objects each, this produces a body far too large for command-line argument passing.

PR #3 in `wiggitywhitney/release-it` was created manually by the eval team with a concise summary.

**Finding for handoff**: Two connected issues in spiny-orb:
1. Live-check compliance report should write to a file, not be embedded in the PR body or printed to stdout
2. PR body construction must not exceed OS argument length limits

### Live-Check — FIRST RUN WITH REAL VALIDATION

`Live-check: OK (2173 spans, 15389 advisory findings)`.

2173 spans from running the test suite — each test file invocation that exercises config.js produces the 3 config spans (config.init, config.load_options, config.load_local_config). The advisory findings are all `missing_attribute` violations for OTel SDK-injected resource attributes (host.name, host.arch, process.pid, etc.) that aren't in the release-it Weaver registry. This is advisory-level (improvement), not a violation.

The compliance report content will be evaluated during PR artifact evaluation.

---

## File Failures

### lib/plugin/GitBase.js — LINT (Prettier line-length)

**Failure**: LINT — Prettier wants to reflow lines that the agent preserved verbatim.

**Root cause**: The `startActiveSpan(async span => { try { ... } })` wrapper adds 2 indentation levels to the entire function body. Lines that were within Prettier's 120-char print width at the original indentation are pushed over the limit under the wrapper. Prettier wants to break them across multiple lines. NDS-003 requires the original lines be preserved exactly. The agent cannot satisfy both constraints simultaneously.

The specific line that triggered in all 3 attempts:
```js
return this.exec(`git rev-list ${ref} --count ${commitsPath ? `-- ${commitsPath}` : ''}`, { options }).then(Number);
```
This line is already long at base indentation. Inside 2 extra indent levels, Prettier demands it be split into a multi-line call chain.

**Pattern**: Same constraint conflict appeared in GitRelease.js (ternary on `typeof script === 'function' || typeof script === 'string' ? ...`) and prompt.js (`const answer = await (this.createPrompt ? ...)`).

**Impact**: 6 async class methods in GitBase that PR #781 just unblocked remain uncommitted.

**Cost**: $0.85 (3 attempts × full file).

---

### lib/plugin/GitRelease.js — LINT (Prettier line-length)

**Failure**: Identical root cause to GitBase.js — span wrapper indentation + long ternary.

The specific line:
```js
const releaseNotes =
      typeof script === 'function' || typeof script === 'string' ? await this.processReleaseNotes(script) : changelog;
```
Already split across 2 lines but the continuation line exceeds 120 chars inside the wrapper. Prettier wants a 3-line ternary format; NDS-003 requires preserving the original 2-line format.

**Impact**: 2 async class methods (beforeRelease, processReleaseNotes) remain uncommitted.

**Cost**: $0.33 (3 attempts × smaller file).

---

### lib/plugin/github/GitHub.js — NDS-003 ×8

**Failure**: 8 NDS-003 violations. Agent actively reformatted long lines rather than preserving them, then NDS-003 caught the modifications.

Same underlying cause as LINT failures, but manifested differently: the agent anticipated the Prettier issue and proactively split long lines itself. NDS-003 caught this as original line modifications:

| Original line | Agent split into |
|--------------|-----------------|
| `const mergedPullRequests = searchResults.flatMap(items => items.map(item => ({ type: 'pr', number: item.number })));` | 3-line flatMap chain |
| `this.log.log(\`● Commented on ${url}\`)` | Separate line (emoji caused encoding mismatch) |
| `this.log.log(\`✕ Failed to comment on ${url}\`)` | Same emoji encoding issue |

In attempt 2, the agent was told exactly what Prettier wanted (shown in the diff) and tried to apply those reformats, which NDS-003 then blocked.

**Stuck in contradictory constraints**: Can't preserve → LINT fails. Can't reformat → NDS-003 fails.

**Impact**: 13 async class methods across GitHub's public API surface remain uncommitted. This is the highest-value failed file.

**Cost**: $1.17 (2 attempts × large file, 700+ lines).

---

### lib/plugin/gitlab/GitLab.js — COV-003 + SCH-002 ×2

**Failure**: Two distinct issues in different attempts.

**Attempt 1**:
- COV-003: `catch` block at line 184 does not record error on span. The agent's inner `catch` re-throws but omits `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })`. COV-003 requires error recording in every catch inside a span that re-throws.

**Attempt 2** (fixed COV-003, introduced new failures):
- SCH-002 ×2: `release_it.gitlab.asset_name` was declared as a new schema extension, but the validator flagged it as both "a semantic duplicate" and "not found in the registry." These messages are contradictory — the validator appears to have matched it against `release_it.github.assets_count` as semantically similar (different domain entirely), then also checked the registry and found it absent. The agent in attempt 2 removed the attribute to fix SCH-002 but was left with no domain attribute on the `uploadAsset` span.

**Note on SCH-002 contradiction**: The validator's two error messages for the same attribute are logically inconsistent ("it's a duplicate of X" and "it doesn't exist in the registry" can't both be true). This may be a validator SCH-002 bug or ambiguous error message. Filed as an observation for the handoff.

**Cost**: $0.80 (2 attempts × medium file).

---

### lib/plugin/npm/npm.js — NDS-003 ×26

**Failure**: 26 NDS-003 violations — the most in any single file this run. Agent split multiple long lines.

Primary violations:
```js
// Original (single line, ~118 chars at base indentation):
const { name, version: latestVersion, private: isPrivate, publishConfig } = readJSON(path.resolve(MANIFEST_PATH));

// Agent split into multi-line destructuring — NDS-003 flagged as 5 separate modifications
```

Additionally:
```js
// Original: single-line chained calls
const match = Object.entries(distTags).find(([tag, version]) => tag !== DEFAULT_TAG && version === latestVersion);

// Agent split the callback across lines
```

At 26 violations, every instrumented method triggered NDS-003 because the file has consistently long lines throughout — the destrucuring at line 30 sets the pattern for the whole file.

**Cost**: $0.73 (2 attempts × medium file).

---

### lib/prompt.js — LINT (Prettier line-length)

**Failure**: Same root cause as GitBase.js and GitRelease.js.

The specific line:
```js
const answer = await (this.createPrompt ? this.createPrompt(prompt.type, options) : types[prompt.type](options));
```

Inside the span wrapper indentation, this line exceeds 120 chars. Prettier wants the ternary on separate lines. NDS-003 requires the original single-line form.

**Impact**: 1 async method (show) uncommitted.

**Cost**: $0.26 (3 attempts × small file).

---

## Cross-Cutting Pattern: Indentation-Width Conflict

4 of 6 failures (GitBase, GitRelease, GitHub, npm, prompt) share the same root cause: adding a `startActiveSpan` wrapper adds indentation, which pushes existing long lines over Prettier's 120-char print width. The validator then catches either:
- The agent preserving the original lines → LINT fails
- The agent proactively splitting lines → NDS-003 fails

This is a structural incompatibility between the LINT validator (which uses the post-instrumentation file) and the NDS-003 validator (which uses the original file as the baseline). There is no agent behavior that can satisfy both for these specific files.

The underlying fix lives in spiny-orb: either run Prettier on the agent output before NDS-003 validation (so NDS-003 compares against the Prettier-formatted original, not the raw original), or compute NDS-003's baseline against the Prettier-formatted original at the time of validation.

**Files affected by this pattern**: GitBase.js (6 methods lost), GitRelease.js (2 methods lost), GitHub.js (13 methods lost), prompt.js (1 method lost). npm.js shares the root cause but triggered NDS-003 rather than LINT.
