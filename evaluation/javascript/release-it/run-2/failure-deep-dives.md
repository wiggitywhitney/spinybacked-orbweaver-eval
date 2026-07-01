# Failure Deep-Dives — release-it Run-2

**Run-2 result**: 0 committed (net), 20 failed, 0 partial, 3 correct skips, 23/23 processed.

All file-level failures documented below. Checkpoint rollback chain analyzed separately.

---

## Run-Level Observations

### Checkpoint Test Failures — New Dominant Blocker

Four checkpoint failures occurred, rolling back every file that successfully committed spans:

| Checkpoint | File | Files rolled back | Root cause |
|-----------|------|-------------------|------------|
| 1 | lib/log.js (file 5/23) | args.js, cli.js, config.js, log.js | OTel module resolution |
| 2 | lib/plugin/git/Git.js (file 10/23) | Plugin.js, factory.js | OTel module resolution |
| 3 | lib/prompt.js (file 20/23) | gitlab/prompts.js, npm/prompts.js, Version.js | OTel module resolution |
| End-of-run | — | shell.js, spinner.js, util.js | OTel module resolution |

**Root cause**: Every file with actual instrumentation adds `import { trace } from '@opentelemetry/api'` and a tracer init. The release-it test suite cannot resolve `@opentelemetry/api` because `dependencyStrategy: peerDependencies` in `spiny-orb.yaml` lists the package as a peer but does not install it. When the checkpoint test runner executes `npm test`, Node's module resolver fails on the import and all tests fail.

This failure mode was invisible in run-1 because the run halted at checkpoint 1 before any instrumented file committed. Run-2 revealed it because the gpgsign blocker was resolved and all 23 files were processed.

**Not gpgsign**: Run-1's checkpoint 1 failure was gpgsign-related (git tag signing failed). Run-2's checkpoint 1 failure is different — the GIT_CONFIG_GLOBAL override was in effect and the release-it test suite does not create real git tags. The OTel import failure is the operative cause in run-2.

**Impact**: Five files committed spans and were evaluated correctly by the agent (config.js, factory.js, Version.js, shell.js, util.js). All were rolled back by checkpoint failures, not agent error. Agent instrumentation quality cannot be assessed from committed state — the per-file evaluation and rubric must use the instrumentation report files (`*.instrumentation.md`) on the spiny-orb branch.

### PR Creation Failure — RUN1-3 Persists

**Error**: `GraphQL: Resource not accessible by personal access token (createPullRequest)`

Despite adding `GITHUB_TOKEN_RELEASE_IT` to both `.vals.yaml` files and confirming `GITHUB_TOKEN present=true` at run start, PR creation failed with the same error as run-1. The push succeeded (`urlChanged=true, path=token-swap`), confirming the PAT has `contents:write`. The PAT in GCP Secret Manager at key `github-token-release-it` does not have `pull_requests:write`.

**The vals.yaml comment** ("Fine-grained PAT scoped to wiggitywhitney/release-it with pull_requests:write") is incorrect — either the PAT was created without that scope or the wrong secret was stored. This needs manual remediation in GCP Secret Manager before run-3.

---

## LINT Failures — arrowParens + Print-Width Pattern (6 files)

All six LINT failures share the same two-issue combination. Each file failed all 3 attempts.

### Root Cause

**Issue 1 — arrowParens**: The agent writes `async (span) => {` but release-it's `.prettierrc.json` sets `arrowParens: "avoid"`, requiring `async span => {`. This was also the root cause of run-1's LINT failures on config.js and index.js. The Prettier diff surfacing fix (spiny-orb PR #532) now correctly shows the agent the exact lines to change — the agent reads the diff, acknowledges it, but fails to produce a compliant file within 3 attempts.

**Issue 2 — Print-width cascades**: When the agent writes a long line (a ternary, destructuring, or method chain), Prettier wraps it at the print-width boundary. Because the span wrapper adds one indentation level, lines that were near the print-width limit in the original source now exceed it. This produces a second set of diff changes that cascade across the remainder of the function body. The combined arrowParens + wrap diff is large enough that the agent cannot apply both consistently in a single pass.

**Interaction**: The two issues compound. Fixing arrowParens alone doesn't resolve the LINT check if a line-wrap is also needed. The cascading indentation shift in the diff makes it difficult to identify which lines to change without regenerating the entire file.

### Per-File Details

#### lib/index.js

Single span on `runTasks`. LINT failure causes:
- `async (span) =>` on span callback
- Long ternary on `const suffix = version && config.isIncrement ? \`${latestVersion}...${version}\` : \`currently at ${latestVersion}\`` exceeds print-width — Prettier wraps onto 3 lines
- The wrap shifts every subsequent line in the function body, producing a full-function diff

The `suffix` line was unchanged from the original source — the agent did not introduce it. The span wrapper's extra indentation pushed an existing long line over the limit.

#### lib/plugin/GitBase.js

Three spans (init, getCommitsSinceLatestTag, getChangelog). LINT failure causes:
- `async (span) =>` on all three span callbacks
- Long `.then(Number)` chain: `return this.exec(\`git rev-list ${ref}...\`, { options }).then(Number)` wraps to split `.then(Number)` onto its own line
- The wrap cascades through the remainder of the class

The `.then(Number)` line was in the original source. Same indentation-push mechanism as index.js.

#### lib/plugin/GitRelease.js

Single span on `beforeRelease`. LINT failure causes:
- `async (span) =>` on span callback
- Long ternary on `releaseNotes`: `typeof script === 'function' || typeof script === 'string' ? await this.processReleaseNotes(script) : changelog` exceeds print-width
- The ternary was in the original source, pushed over limit by indentation

Smallest of the LINT failures — only 1 span, but the ternary wrap is unavoidable under the current indentation strategy.

#### lib/plugin/git/Git.js

Four spans (init, beforeRelease, release, push). LINT failure causes:
- `async (span) =>` on all four span callbacks
- Long warn message in push(): `this.log.warn(\`An error was encountered when trying to rollback the tag on the remote: ${tagError.message}\`)` wraps to split argument onto new line
- The warn message was in the original source

Four spans means four arrowParens violations. The wrap issue occurs only in the push() span but the combined diff is very large (diff was truncated in output).

#### lib/plugin/npm/npm.js

Three spans (init, bump, publish). LINT failure causes:
- `async (span) =>` on all three span callbacks
- Destructuring in init(): `const { name, version: latestVersion, private: isPrivate, publishConfig } = readJSON(...)` wraps to multi-line destructuring
- Lambda in bump(): `const task = () => this.exec(\`npm version ${args.filter(Boolean).join(' ')}\`, { options: { env: getNpmEnv() } })` wraps to split the arrow body

Both long lines were in the original source. The destructuring wrap produces a particularly large diff because it shifts all subsequent lines in init(). Highest token usage of the LINT failures (41.3K output).

#### lib/prompt.js

Single span on `show`. LINT failure causes:
- `async (span) =>` on span callback
- Ternary on `const answer = await (this.createPrompt ? this.createPrompt(prompt.type, options) : types[prompt.type](options))` wraps across 3 lines

The ternary was in the original source.

---

## NDS-003 Failure — lib/plugin/github/GitHub.js

**Validation**: NDS-003 × 7 — original line 394 missing/modified: `return this.retry(async bail => {`

**2 attempts, both NDS-003.**

### Root Cause

`createRelease()` contains `return this.retry(async bail => { ... })`. The agent needed to capture the return value to set `release_it.github.release_id` from `result.id`. To do this, it converted the return statement: `return this.retry(...)` → `const result = await this.retry(...); return result`. This modification triggers NDS-003 because the original line is missing.

The agent acknowledged this pattern in its notes: "In createRelease(), `return this.retry(...)` was captured as `const result = await this.retry(...)` to enable setting `release_it.github.release_id` from `result.id`." The agent believed this return-value capture was permitted by the instrumentation rules — but NDS-003 fires on missing original lines regardless.

The NDS-003 violation count of 7 suggests the validator found 7 original lines missing or reordered, not just the one `return this.retry` line. The agent's restructuring of the promise chain may have caused additional line shifts.

### Impact

GitHub.js is a high-value instrumentation target — it contains the GitHub release creation, update, and comment flows. The 5 schema extensions in the agent notes (github.init, github.release, github.create_release, github.update_release, github.comment_on_resolved_items) indicate sound instrumentation design. The failure is a code-preservation issue, not a quality issue.

### Path to fix

The agent must find a way to read `result.id` without modifying `return this.retry(...)`. One approach: instrument `createRelease()` without the `release_id` attribute rather than transforming the return statement. Another: accept that `release_id` is unavailable from this code path and omit it.

---

## COV-003 Failure — lib/plugin/gitlab/GitLab.js

**Validation**: COV-003 × 4 — catch block at line 160 does not record error on span.

**2 attempts, both COV-003.**

### Root Cause

The GitLab plugin has catch blocks that handle errors gracefully — logging and continuing without rethrowing. COV-003 requires `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` in all catch blocks. The validator flagged catch blocks that did not add these two calls.

The agent's note for the final attempt mentions it "Fixed Prettier formatting violation: removed parentheses around single async arrow function parameters" — meaning the second attempt successfully fixed the arrowParens issue but still had COV-003 violations. This is the only file where arrowParens was fixed but a different validation rule blocked the commit.

### NDS-007 interaction

COV-003 requires error recording in all catch blocks. NDS-007 (Expected Catch Unmodified) says catch blocks that handle expected conditions gracefully (logging and continuing, not rethrowing) should NOT have `span.recordException` added. These two rules can conflict when a catch block both handles an expected error gracefully and exists within a span.

The agent's second attempt added `span.recordException` to the four flagged catch blocks. Whether NDS-007 applies to any of them requires per-catch inspection. If any of the four catch blocks represent expected graceful-degradation paths (not errors that should appear in traces), the correct resolution is to omit `span.recordException` for those blocks — but the COV-003 validator may still flag them.

This is a potential rule conflict that needs manual inspection in the per-file evaluation.

---

## Summary Table

| File | Failure type | Attempts | Key cause |
|------|-------------|----------|-----------|
| lib/index.js | LINT | 3 | arrowParens + suffix ternary wrap |
| lib/plugin/GitBase.js | LINT | 3 | arrowParens + .then(Number) wrap |
| lib/plugin/GitRelease.js | LINT | 3 | arrowParens + releaseNotes ternary wrap |
| lib/plugin/git/Git.js | LINT | 3 | arrowParens × 4 + warn message wrap |
| lib/plugin/github/GitHub.js | NDS-003 | 2 | return-value capture modifies original line |
| lib/plugin/gitlab/GitLab.js | COV-003 | 2 | Missing error recording in graceful catch blocks |
| lib/plugin/npm/npm.js | LINT | 3 | arrowParens × 3 + destructuring + lambda wrap |
| lib/prompt.js | LINT | 3 | arrowParens + createPrompt ternary wrap |
| lib/args.js | Checkpoint rollback | — | OTel module resolution in test suite |
| lib/cli.js | Checkpoint rollback | — | OTel module resolution in test suite |
| lib/config.js | Checkpoint rollback | — | OTel module resolution in test suite |
| lib/log.js | Checkpoint rollback | — | OTel module resolution in test suite |
| lib/plugin/Plugin.js | Checkpoint rollback | — | OTel module resolution in test suite |
| lib/plugin/factory.js | Checkpoint rollback | — | OTel module resolution in test suite |
| lib/plugin/gitlab/prompts.js | Checkpoint rollback | — | OTel module resolution in test suite |
| lib/plugin/npm/prompts.js | Checkpoint rollback | — | OTel module resolution in test suite |
| lib/plugin/version/Version.js | Checkpoint rollback | — | OTel module resolution in test suite |
| lib/shell.js | Checkpoint rollback | — | OTel module resolution in test suite |
| lib/spinner.js | Checkpoint rollback | — | OTel module resolution in test suite |
| lib/util.js | Checkpoint rollback | — | OTel module resolution in test suite |
