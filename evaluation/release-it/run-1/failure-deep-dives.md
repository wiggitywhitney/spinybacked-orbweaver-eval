# Failure Deep-Dives — Release-it Run-1

**Run-1 result**: 0 committed, 2 failed, 0 partial, 3 correct skips. Run halted at file 5/23.

Three distinct failure modes: LINT oscillation on 2 files, checkpoint test halt that stopped processing at file 5, and PR creation failure. The checkpoint halt is the most consequential — 18 files were never reached.

---

## File Failures

### lib/config.js — LINT Oscillation

**Status**: ❌ FAILED — Oscillation detected during fresh regeneration: Duplicate errors across consecutive attempts: LINT (×1), 3 attempts  
**Cost**: $0.29  
**Proposed span**: `release_it.config.init`

#### What the agent intended

The agent correctly identified `Config.init()` as the only exported async entry point and proposed a single span covering it. Agent notes confirm sound reasoning:
- `release_it.is_ci` and `release_it.is_dry_run` attributes from existing schema
- Internal helpers (`loadOptions`, `loadLocalConfig`, synchronous utilities) correctly excluded per RST-004/RST-001/RST-002

The reasoning was not the problem. The generated instrumentation code was.

#### Why the LINT check failed (hypothesis)

The generated code was never committed, so the exact Prettier violation cannot be confirmed from the log. However, the release-it Prettier config provides a strong candidate:

```json
{
  "arrowParens": "avoid",
  "trailingComma": "none",
  "singleQuote": true,
  "printWidth": 120
}
```

`arrowParens: "avoid"` requires single-parameter arrow functions to omit parentheses. The `startActiveSpan` callback is the standard insertion point — the agent almost certainly generated:

```javascript
async init() {
  return tracer.startActiveSpan('release_it.config.init', async (span) => {
    // ...
  });
}
```

Prettier requires `async span => {` (no parentheses). This is the non-default style — training data for LLMs overwhelmingly uses `(span) =>`. The original config.js uses the no-parens style consistently (e.g., line 61: `plugin => plugin.getName()`), confirming this is an enforced project convention.

`trailingComma: "none"` is a secondary candidate: any generated multi-line object literal with a trailing comma would also fail.

#### Why the fix loop couldn't self-correct

The LINT error message passed to the agent on retry is:

> "LINT check failed: the original file was Prettier-compliant but the instrumented output is not. The agent introduced formatting violations. Run Prettier on the output to match the project's formatting configuration."

This message names no specific violation. Without knowing that `(span) =>` should be `span =>`, the agent regenerates the same pattern on every retry, producing identical output and identical lint failure — the oscillation pattern.

**Fix for run-2**: The agent notes confirm the intended instrumentation. The actual code generation failure is a Prettier config issue. Two approaches: (1) rely on spiny-orb surfacing the specific Prettier diff so the agent can fix it (tracked in spiny-orb-findings.md), or (2) add release-it's Prettier config to the agent context so it can apply the correct style.

---

### lib/index.js — LINT Oscillation

**Status**: ❌ FAILED — Oscillation detected during fresh regeneration: Duplicate errors across consecutive attempts: LINT (×1), 3 attempts  
**Cost**: $0.35  
**Proposed span**: `release_it.run_tasks`

#### What the agent intended

The agent correctly identified `runTasks` as the exported async orchestrator and proposed one span covering the full pipeline. Agent notes show additional sound analysis:
- The four `process.exit()` calls inside the try block will terminate before `span.end()` in the finally block — correctly flagged as a CDQ-001 concern, noted as requiring non-instrumentation code restructuring
- Null guards on `release_it.version.increment`, `release_it.version.next`, and `release_it.package_name` — correct, as `reduceUntil` can return undefined

#### Why the LINT check failed

Same root cause as config.js: `arrowParens: "avoid"`. The `startActiveSpan` wrapping of `runTasks` would generate:

```javascript
const runTasks = async (opts, di) => {
  return tracer.startActiveSpan('release_it.run_tasks', async (span) => {
    // ...
  });
};
```

Prettier requires `async span => {`. The original index.js confirms the no-parens convention: line 61 uses `plugin => plugin.getName()`, line 62 uses `plugin => plugin.getLatestVersion()`.

The index.js instrumentation was also more complex than config.js ($0.35 vs $0.29) — the process.exit guard notes, the multiple null-guarded attributes, and the large try-catch block all increase the surface area where the agent could introduce other Prettier violations. But `arrowParens` remains the primary suspect.

#### Why the fix loop couldn't self-correct

Identical failure mode to config.js — the LINT error message provides no specifics, the agent regenerates the same style, oscillation.

---

## Run-Level Failures

### Checkpoint Test Halt — Files 6–23 Never Processed

**Warning**: `Checkpoint test run failed at file 5/23 (lib/log.js): tests failed`  
**Warning**: `Baseline test suite has pre-existing failures — checkpoint test rollback disabled`  
**Warning**: `End-of-run test suite failed: Command failed: sh -c npm test`

#### Root cause

spiny-orb's checkpoint test mechanism runs `npm test` directly. release-it's test suite has tag-creation tests that require `tag.gpgsign` to be disabled. Whitney's global git config includes `tag.gpgsign=true`.

The workaround documented during pre-run verification:
```bash
GIT_CONFIG_GLOBAL=/tmp/release-it-test.gitconfig npm test
```
where the temp config contains only `[user] email = test@test.com` and `name = Test User`.

spiny-orb has no mechanism to pass a custom test command or environment override through spiny-orb.yaml. When it ran `npm test`:
1. **Baseline detection**: Found failures (gpgsign). Marked baseline as "pre-existing failures" → rollback disabled.
2. **Checkpoint at file 5**: Ran `npm test` again → same failures → halted run.

The rollback being disabled was correctly triggered by the baseline detection. But the checkpoint still halted the run because the test failures appeared regardless.

**Impact**: Files 6–23 (18 files, all plugin code) were never processed. The plugin files are where the majority of instrumentable async I/O lives — `lib/plugin/git/Git.js`, `lib/plugin/github/GitHub.js`, `lib/plugin/gitlab/GitLab.js`, `lib/plugin/npm/npm.js`. Run-1 produced no rubric-relevant results.

**This is release-it-specific**: No prior run on any target has hit this issue. The `tag.gpgsign` interaction is unique to release-it's tag-creation test suite.

#### Fix for run-2

Three options, in preference order:

1. **Disable tag.gpgsign in global git config** for the duration of the run. Temporary removal, restore afterward. Zero spiny-orb changes needed.
2. **Add `testCommand` field to spiny-orb.yaml** if spiny-orb supports (or adds) a custom test command override. Would look like: `testCommand: "GIT_CONFIG_GLOBAL=/tmp/release-it-test.gitconfig npm test"`. Filed as a spiny-orb feature request if not supported.
3. **Create a `.gitconfig` override file** at the project root and point `GIT_CONFIG_GLOBAL` at it before running the instrument command, using the environment variable override in the command: `GIT_CONFIG_GLOBAL=/tmp/release-it-test.gitconfig caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS ...`.

Option 3 can be done without any spiny-orb changes by modifying the instrument command invocation. Document in lessons-for-run2.md.

---

### PR Creation Failure

**Warning**: `PR creation failed: gh pr create failed: pull request create failed: GraphQL: Resource not accessible by personal access token (createPullRequest)`

#### Root cause

The GITHUB_TOKEN resolved via vals (length 93, confirmed present) is a fine-grained PAT scoped to allow branch pushes but not PR creation via GraphQL. `createPullRequest` requires `pull_request: write` (or `repo` scope for classic PATs) on the target repository.

The branch `spiny-orb/instrument-1776550755270` was pushed successfully to `wiggitywhitney/release-it` — push used the token's `contents: write` permission, which was granted. Only PR creation failed.

**Impact**: No PR was created. The instrumentation branch exists on origin but has no associated PR. The run-level advisory CDQ-008 (no `trace.getTracer()` calls found) is expected — no files were committed with instrumentation.

**Fix for run-2**: Update the fine-grained PAT in vals to include `pull_request: write` permission scoped to `wiggitywhitney/release-it`. Alternatively, use a classic PAT with `repo` scope.

---

## Weaver Stop Failure

**Warning**: `Failed to stop Weaver gracefully via /stop endpoint: fetch failed`

Minor: Weaver's HTTP server was not running when spiny-orb attempted to stop it at run end. This is expected when the schema has no entries that triggered Weaver processing (0 files committed → Weaver never started or started but the endpoint was not reachable). No impact on run results.

---

## Summary

| Failure | Root Cause | Blocks Run-2? | Fix |
|---------|------------|---------------|-----|
| config.js LINT oscillation | `arrowParens: "avoid"` — agent generates `(span) =>`, Prettier requires `span =>` | No | Expose Prettier diff in error message (spiny-orb P2); agent should learn release-it style |
| index.js LINT oscillation | Same as config.js | No | Same fix |
| Checkpoint test halt | spiny-orb runs `npm test` without GIT_CONFIG_GLOBAL override; tag.gpgsign fails | **Yes** — 18 files not processed | Disable tag.gpgsign or modify instrument command |
| PR creation | PAT lacks pull_request:write | No | Update PAT permission |
| Weaver stop | Weaver not running at shutdown | No | No action needed |
