# Actionable Fix Output — release-it Run 3

**Date**: 2026-05-04
**Handoff target**: spiny-orb team
**Run result**: 3 committed, 2 failed, 18 "correct skips" (10 true + 8 false negatives), Q×F 3.0, IS 90/100

---

## Summary for spiny-orb Team

Run-3 is the first non-zero Q×F on release-it. Agent quality on committed files is 25/25 — the instrumentation is clean. The Q×F ceiling is a volume problem: the pre-scan is falsely classifying 8 files with async class methods as having nothing to instrument. Two infrastructure bugs (one on the eval side, one in spiny-orb) also surfaced.

---

## P1 — Blocking Next Run

### [P1-A] Pre-scan false negative: async class methods not detected

**Impact**: 8 of 23 `lib/` files were marked "no instrumentable functions" despite containing exported async class methods. These include GitHub.js (13 async methods — the primary Octokit integration), npm/npm.js (8 async methods — the publish pipeline), GitBase.js (6 async methods — base git operations), GitRelease.js, Plugin.js, Version.js, prompt.js, and shell.js.

**Evidence**: PR advisory findings show 37 COV-004 advisories across these files. The run-2 agent successfully instrumented GitHub.js (though it failed LINT). Run-3 pre-scan skipped it entirely.

**Root cause**: The pre-scan likely checks for exported function declarations or arrow functions but does not traverse class bodies to find exported class methods. Plugin files in release-it use class-based architecture (`class GitHub extends Plugin { async release() {...} }`).

**Fix needed**: Pre-scan must identify `async` class methods in exported classes as instrumentable entry points. All 8 false-negative files should be attempted in run-4.

**Expected run-4 impact**: If fixed, Q×F increases from 3.0 to ~20–25 (8 additional files × ~2–3 spans/file at 25/25 quality).

---

### [P1-B] `gh pr create` targets upstream repo in forks — PAT rejected

**Impact**: PR creation fails on every forked eval target. This is the same GraphQL error that blocked run-2, previously misdiagnosed as a PAT scope issue. The PAT scope was correct; the target repo was wrong.

**Root cause**: `createPr` in `git-workflow.js` calls `gh pr create` without `--repo`. When a fork has both `origin` and `upstream` remotes, `gh` defaults to the upstream (`release-it/release-it`). The fine-grained PAT is scoped to the fork (`wiggitywhitney/release-it`) and is rejected by the upstream.

**Error**: `pull request create failed: GraphQL: Resource not accessible by personal access token (createPullRequest)`

**Reproduction**: From `~/Documents/Repositories/release-it`: `gh pr create --head spiny-orb/instrument-1777912706406 --title "test" --body "test"` → same error. Adding `--repo wiggitywhitney/release-it` → succeeds.

**Fix needed**: Derive the PR target from `git remote get-url origin` and pass it as `--repo` in the `gh pr create` call. This affects every eval target since every eval target is a fork.

**Secondary symptom**: The `createPr` failure does not log the error message — process exits silently after the PR summary commit, with neither "PR creation failed: ..." nor "Completed in..." appearing in the run log. Unhandled promise rejection likely escapes the try-catch and calls `process.exit()`. Top-level rejection handler needed.

---

## P2 — Quality / UX Improvements

### [P2-A] Weaver prerequisite check hangs under `vals exec` — HOME not forwarded

**Impact**: Every run using `vals exec` with the new weaver prerequisite check fails with "Weaver schema validation failed" after 30s. Blocked run-3 three times before workaround was found.

**Root cause**: `checkWeaverSchema` in `prerequisites.ts` calls `execFileSync('weaver', ['registry', 'check', '-r', fullPath], { timeout: 30000 })` without passing `HOME` in the env options. `vals exec` does not propagate HOME to subprocess environments. Weaver needs HOME to write to `~/.weaver/vdir_cache/` when downloading the OTel semconv dependency zip. Without HOME, the download hangs and the 30s timeout fires.

**Confirmed**: Direct terminal run: 0.83s. Via `vals exec` without `HOME="$HOME"`: 32s → timeout.

**Workaround** (eval-side): Add `HOME="$HOME"` to the `env` prefix before `vals exec` in the instrument command.

**Fix needed** (spiny-orb): Pass HOME explicitly in the `execFileSync` call:
```javascript
import { homedir } from 'node:os';
execFileSync('weaver', ['registry', 'check', '-r', fullPath], {
  cwd: projectRoot,
  timeout: 30000,
  stdio: 'pipe',
  env: { ...process.env, HOME: process.env.HOME || homedir() },
});
```
This applies to ALL `execFile`/`execFileSync`/`spawn` calls that invoke the `weaver` binary. See also `~/.claude/rules/weaver-gotchas.md` — this pattern is already documented there.

**Scope**: `caffeinate -s` also strips HOME, so this will affect any CI or scripted runner. Not limited to `vals exec`.

### [P2-B] Misleading failure message on Weaver timeout

**Impact**: "Weaver schema validation failed" with weaver's partial stdout in the error message looks like a schema bug, not a timeout. Users cannot distinguish "schema invalid" from "download timed out."

**Current message**:
```text
Prerequisites failed — cannot proceed:
Weaver schema validation failed at .../semconv: Weaver Registry Check
Checking registry `.../semconv`
ℹ Found registry manifest: .../registry_manifest.yaml
Completed in 32.1s
```

**Fix needed**: Catch `ETIMEDOUT`/`error.killed`/`error.signal === 'SIGTERM'` separately and emit: `"Weaver dependency download timed out (>30s). This is likely a network or environment issue, not a schema error. Try adding HOME=\\"$HOME\\" if running via a process launcher. Retry the command."` Keep schema validation errors as a separate error path.

---

## P3 — Watch Items for Run-4

### [P3-A] Git.js — API termination (2 attempts)

Git.js had a complete, correct instrumentation plan (4 spans: `check_repo`, `init`, `release`, `push`; 1 attribute: `release_it.git.is_repo`) but both Anthropic API calls were terminated mid-generation. Infrastructure failure, not a quality issue. Retry in run-4 — no agent guidance changes needed.

### [P3-B] GitLab.js — COV-002 on uninstrumented fetch (line 188)

GitLab.js was pre-scanned as a false negative (see P1-A), but even if the pre-scan is fixed, the COV-002 failure from run-2 (graceful catch blocks not recording exceptions) may resurface. The COV-003/NDS-007 conflict on GitLab.js is a separate issue from the pre-scan false negative. Watch in run-4.

### [P3-C] service.instance.id absent (RES-001) — IS score miss

Both release-it run-3 (90/100) and commit-story-v2 run-14 (80/100) fail RES-001. The shared bootstrap file (`examples/instrumentation.js`) sets `service.name` and `service.version` via `resourceFromAttributes` but does not set `service.instance.id`. Adding it would bring both targets to 100/100 on the applicable rules.

Suggested addition to bootstrap:
```javascript
import { randomUUID } from 'node:crypto';
// In resourceFromAttributes:
'service.instance.id': randomUUID(),
```

---

## Run-3 Metrics at a Glance

| Metric | Run-3 | Run-2 |
|--------|-------|-------|
| Quality | 25/25 (100%) | 24/25 (96%) |
| Gates | 5/5 | 4/5 |
| Files committed | 3 | 0 |
| Spans committed | 6 | 0 |
| Cost | $1.59 | $5.69 |
| Q×F | 3.0 | 0 |
| IS score | 90/100 | N/A |
| Pre-scan accuracy | 10/23 true correct | 3/23 correct |
| Push | YES | YES |
| PR | Manual (PR#2) | FAILED |
