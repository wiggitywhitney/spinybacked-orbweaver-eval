# Spiny-Orb Findings — Run-8

Findings from evaluation run-8. Each finding includes evidence, priority, and acceptance criteria for the spiny-orb team.

**Run-8 baseline**: 22/25 (88%) canonical quality, 13 files committed (run-7 result).

**Notation**: RUN8-N for new findings. Cross-references to prior findings use RUN7-N format.

---

## Critical

### RUN8-3: Push auth validates read access, not write — token present but push fails (6th consecutive)

**What's wrong**: The fail-fast fix (PR #251) correctly detects missing GITHUB_TOKEN and fails before file processing. But in run-8, GITHUB_TOKEN was present (vals injected it), validation passed (token-embedded `git ls-remote` succeeded), yet push still failed: "Invalid username or token. Password authentication is not supported for Git operations."

**Root cause**: `validateCredentials()` uses `git ls-remote` with the token-embedded URL. This validates **read** access. For public repos, read-only tokens pass this check. Push requires **write** access, which `ls-remote` cannot verify.

**Evidence**: Run-8 log: `Push failed — skipping PR creation: Pushing to https://github.com/wiggitywhitney/commit-story-v2-eval.git` — `remote: Invalid username or token.`

**Fix**: Validate write access specifically:
1. `git push --dry-run` (actually tests push permission)
2. GitHub API check (`GET /repos/{owner}/{repo}` → `permissions.push`)
3. At minimum, warn if token scope cannot be determined

**Acceptance criteria**:
1. If GITHUB_TOKEN is present but lacks push permission, fail fast with specific error
2. Never spend tokens processing files only to discover push will fail
3. PR created successfully on a valid token (break the 6-run streak)

## High

## Medium

### RUN8-1: Agent notes use bare rule codes without human-readable labels

**What's wrong**: Agent reasoning notes reference rule codes like `(RST-001, RST-003)` without labels. The RUN7-2 fix added `formatRuleId()` to validation output and PR summary, but agent notes are LLM-generated free text that bypasses the formatter.

**Root cause**: `formatRuleId()` is applied in `pr-summary.ts` and CLI output, but agent notes are passed through verbatim from the LLM response.

**Why this is fixable deterministically**: The rule-code-to-label mapping is static. A simple regex post-processor (`/\b([A-Z]{2,4}-\d{3})\b/g`) could expand codes in agent notes before display, without any LLM involvement.

**Evidence**: Run-8 file 1 (claude-collector.js) note: "they are synchronous helpers or pure data transformations (RST-001, RST-003)" — should read "(RST-001 Restraint: Skip Non-Async, RST-003 Restraint: Skip Pure Functions)".

**Desired outcome**: All rule codes in all output surfaces include human-readable labels.

**Acceptance criteria**:
1. Agent notes displayed in CLI verbose output expand rule codes to include labels
2. Agent notes in PR summary expand rule codes
3. Expansion is deterministic (regex + lookup table), not LLM-dependent

### RUN8-2: Verbose output lacks visual separation between files

**What's wrong**: In `--verbose` mode, per-file results run together without blank lines or separators between them. The "Processing file N" header, status line, extensions, and notes for one file flow directly into the next file's header, making it difficult to visually scan the output or find where one file ends and the next begins.

**Evidence**: Run-8 verbose output — file 2 (git-collector.js) notes blend directly into "Processing file 3 of 29" with no visual break.

**Desired outcome**: A blank line or separator (e.g., `---`) between file blocks in verbose output.

**Acceptance criteria**:
1. At least one blank line between the last note of file N and the "Processing file N+1" header
2. Applies to all output modes (success, partial, failed, skipped)

## Low

---

## Run-7 Finding Status

| Run-7 Finding | Status in Run-8 | Notes |
|---------------|-----------------|-------|
| RUN7-4: Push auth failure | **Code verified fixed** (PR #251) | Fail-fast for HTTPS GitHub without GITHUB_TOKEN; validates before file processing |
| RUN7-2: Opaque rule codes | **Code verified fixed** (PR #249) | `formatRuleId()` with 28 human-readable rule labels |
| RUN7-3: No user-facing docs | **Code verified fixed** (PR #249) | 3 docs: interpreting-output, architecture, rules-reference |
| RUN7-1: Verbose output truncates | **Code verified fixed** (PR #249, #257) | Truncation removed; PR notes capped at 3/file |
| RUN7-5: Span name collision | **Code verified fixed** (PR #256) | Prompt injection + collision detection/warning in dispatch |
| RUN7-6: Count attributes as string | **Code verified fixed** (PR #256) | SCH-003 prompt guidance; no runtime validator |
| RUN7-7: Span count inflated in PR | **Partial** (PR #257) | Notes truncated but count still from agent self-report (issue #253 open) |
| RUN7-8: Schema Changes omits extensions | **Code verified fixed** (PR #257) | Schema Extensions column added to per-file table |
| RUN7-9: Agent Notes is compliance dump | **Code verified fixed** (PR #259) | 3-5 notes guidance + MAX_NOTES_PER_FILE=3 truncation |
| RUN7-10: CDQ-006 advisories repeat 28x | **Code verified fixed** (PR #257) | Grouped by ruleId+message with file count |
