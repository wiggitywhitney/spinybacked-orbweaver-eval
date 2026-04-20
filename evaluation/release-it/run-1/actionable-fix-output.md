# Actionable Fix Output — Release-it Run-1

Self-contained handoff from evaluation run-1 on the release-it eval target.

**Run-1 result**: 5/23 files processed, 0 committed, 2 LINT failures, run halted by checkpoint test at file 5/23. No quality score achievable. $0.68 cost in 22m 24s.

**Target**: wiggitywhitney/release-it (fork of release-it v20.0.0)
**Branch**: `spiny-orb/instrument-1776550755270`
**PR**: NOT CREATED — PAT permission gap

---

## §1. Run Summary

| Metric | Run-1 |
|--------|-------|
| Files processed | 5/23 |
| Committed | 0 |
| Failed | 2 (LINT oscillation) |
| Correct skips | 3 |
| Not reached | 18 |
| Quality score | N/A (0 committed files) |
| Cost | $0.68 |
| Duration | 22m 24s |
| Push | Branch pushed |
| PR | NO |

**Run-1 is not scoreable.** The three blockers below must be resolved before a quality baseline can be established.

---

## §2. Three Blockers for Run-2

### Blocker 1 (Critical): Checkpoint Test Halt — gpgsign

**Impact**: 18 of 23 files never processed. All plugin code (Git.js, GitHub.js, GitLab.js, npm.js) is in this set. Run-1 produced no rubric-relevant results.

**Root cause**: spiny-orb runs `npm test` directly for checkpoint and baseline detection. release-it's test suite requires `GIT_CONFIG_GLOBAL=/tmp/release-it-test.gitconfig npm test` because Whitney's global git config has `tag.gpgsign=true`. spiny-orb has no mechanism to pass a custom test command.

**Fix options (in preference order)**:
1. Disable `tag.gpgsign` in `~/.gitconfig` for the duration of the run and restore afterward
2. Modify the instrument command to prefix `GIT_CONFIG_GLOBAL=/tmp/release-it-test.gitconfig` — but this only affects the outer shell, not the subprocess spiny-orb uses for `npm test`
3. Add `testCommand` support to spiny-orb.yaml (tracked in spiny-orb-findings.md P1)

**Recommended for run-2**: Option 1 (disable gpgsign temporarily). Lowest friction, no spiny-orb changes needed.

**Test config to create before run-2**:
```bash
printf '[user]\n  email = test@test.com\n  name = Test User\n' > /tmp/release-it-test.gitconfig
```
Then confirm `npm test` passes with: `GIT_CONFIG_GLOBAL=/tmp/release-it-test.gitconfig npm test`

---

### Blocker 2 (High): LINT Oscillation — arrowParens

**Impact**: Both instrumentable files that were attempted (config.js, index.js) failed LINT oscillation. Neither was committed. The agent's instrumentation reasoning was correct — this is a code generation style issue.

**Root cause**: release-it's Prettier config sets `arrowParens: "avoid"`. The agent generates `async (span) => { ... }` as the startActiveSpan callback; Prettier requires `async span => { ... }`. The LINT fix loop message provides no specific violation — the agent regenerates the same pattern 3 times.

**Fix options**:
1. Surface the Prettier diff in the fix loop message (tracked in spiny-orb-findings.md P2). Would let the agent self-correct.
2. Add release-it's Prettier config to the agent context prompt when running in this repo — agent would know to use `span =>` style.
3. For run-2, spiny-orb team reviews whether the JS instrumentation agent can be made aware of the target repo's Prettier config.

**Expected outcome**: If the LINT oscillation is resolved, config.js and index.js should commit cleanly — the agent reasoning on both files was sound.

---

### Blocker 3 (Medium): PAT Lacks `pull_request:write`

**Impact**: No PR created. PR summary exists as a local file but spiny-orb-pr-summary.md quality cannot be compared across runs without a GitHub PR link. Advisory findings are not visible in GitHub.

**Root cause**: Fine-grained PAT has `contents: write` (push works) but not `pull_request: write` (createPullRequest fails via GraphQL).

**Fix**: Update the fine-grained PAT in vals to include `pull_request: write` scoped to `wiggitywhitney/release-it`.

---

## §3. Quality Signals from Run-1 (Pre-Commit)

Even with 0 committed files, the agent's reasoning provides early quality signals:

| Signal | Assessment | Rule |
|--------|-----------|------|
| Config.init() identified as sole async entry point | Sound | COV-001 |
| Internal async helpers excluded via orchestrator coverage | Sound | RST-004 |
| runTasks identified as sole exported async function | Sound | COV-001 |
| process.exit() CDQ-001 gap identified and documented | Sound (sophisticated) | CDQ-001 |
| Null guards on reduceUntil returns applied correctly | Sound | CDQ-007 |
| arrowParens formatting not applied in generated code | Deficiency | LINT |

Agent reasoning quality is high. Run-2 quality scores should be strong once blockers are resolved.

---

## §4. New Findings (Run-1)

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN1-1 | Checkpoint halts on gpgsign — custom test command needed | P1 | Infrastructure |
| RUN1-2 | LINT oscillation — arrowParens not applied in generated code | P1 | Code generation |
| RUN1-3 | PAT lacks pull_request:write on fork | P2 | Infrastructure |
| RUN1-4 | Prettier diff not surfaced in fix loop message | P2 | Debuggability (spiny-orb) |
| RUN1-5 | Test failure output not captured on checkpoint/end-of-run failure | P2 | Debuggability (spiny-orb) |
| RUN1-6 | Weaver shutdown failure gives no reason ("fetch failed") | P3 | Debuggability (spiny-orb) |
| RUN1-7 | Live-check partial message doesn't say what to do with the report | P3 | Debuggability (spiny-orb) |
| RUN1-8 | Audit debuggability of all check failure messages in console output | P3 | Debuggability (spiny-orb) |

All RUN1 findings are infrastructure or code-generation style issues. No rubric quality rule failures observed on committed files (there were none to commit).

---

## §5. Spiny-orb Findings

Two findings filed in `evaluation/release-it/run-1/spiny-orb-findings.md`:

**P1 — Support custom test command in spiny-orb.yaml**
Add a `testCommand` field to allow repos with special test invocation requirements. Workaround for run-2: disable gpgsign in global git config.

**P2 — Always surface lint error text in failure output**
The fix loop message "Run Prettier on the output" is insufficient when the error is a specific style rule. Spiny-orb should run `prettier --write` on a temp copy and show the diff of what changed, so the agent can apply the correct fix.

---

## §6. Score Projections for Run-2

### Conservative (blockers resolved, LLM varies)

- **Quality**: Likely 23-25/25 — agent reasoning was high quality; expect mostly passes
- **Files committed**: 12-18 (23 total minus sync-only skips; plugin files have rich async I/O)
- **Push/PR**: YES (if PAT updated)
- **Cost**: ~$3-5 (31 min estimated; 23 files; slightly faster than commit-story-v2 per the research doc)

### Target (all blockers resolved, LINT fix lands)

- **Quality**: 25/25 — config.js and index.js should commit cleanly
- **Files**: 15-18
- **Cost**: ~$3-4
- **Duration**: ~31 min

### Key unknowns for run-2

1. How many plugin prompts files (lib/plugin/*/prompts.js) are pure sync/constants → correct skips
2. Whether GitHub.js and GitLab.js trigger COV-006 (auto-instrumentation) for undici/octokit
3. Whether `process.exit()` pattern in index.js requires structural notes or prevents CDQ-001 pass

---

## §7. Run-2 Prerequisites Checklist

Before starting run-2:
- [ ] Disable `tag.gpgsign` in `~/.gitconfig` OR confirm `testCommand` support added to spiny-orb.yaml
- [ ] Update GITHUB_TOKEN PAT with `pull_request: write` for wiggitywhitney/release-it
- [ ] Confirm spiny-orb team has seen Prettier diff surface finding (P2 in spiny-orb-findings.md)
- [ ] Rebuild spiny-orb if any fixes have landed since SHA a02004f
- [ ] Reconfirm GITHUB_TOKEN resolves via vals before running
