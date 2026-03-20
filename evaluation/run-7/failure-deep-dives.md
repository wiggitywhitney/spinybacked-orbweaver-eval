# Failure Deep-Dives — Run-7

## File-Level Failures

**None.** Run-7 is the first run with zero file-level failures. All 29 files succeeded: 13 committed with spans, 16 correct skips. No partial files, no failed files.

## Run-Level Failures

### Push Authentication — 5th Consecutive Failure (RUN7-4)

**Error**: `Push failed — skipping PR creation: Pushing to https://github.com/wiggitywhitney/commit-story-v2-eval.git / remote: Invalid username or token.`

**Root cause**: Two bugs in `src/git/git-wrapper.ts`:
1. `validateCredentials()` validates read access (`git ls-remote`), not write. Public repos pass read validation without auth.
2. `pushBranch()` falls back silently to plain `git push` when GITHUB_TOKEN is absent.

**Why GITHUB_TOKEN may be absent**: The command injects it via `vals exec -i -f .vals.yaml`. vals resolves the token (95 chars). Possible causes: token not surviving the `env -u` → `vals exec` → `node` process chain, or the spiny-orb process spawning a subprocess without env inheritance.

**Impact**: No PR created. Branch `spiny-orb/instrument-1774017389972` exists locally with all commits. PR summary saved locally at `spiny-orb-pr-summary.md`.

**Trajectory**: Run-3 → Run-4 → Run-5 → Run-6 → Run-7. Same failure every run. Root cause identified in run-7 for the first time (read vs write validation asymmetry).

## Failure Trajectory Update

### Previously Persistent Failures — All Resolved

| File | Runs Failed | Run-7 Status | Resolution |
|------|-------------|-------------|------------|
| index.js | Run-4, 5, 6 (COV-001) | **Committed (1 span)** | COV-003 boundary fix + SCH-001 advisory mode |
| journal-manager.js | Run-5, 6 (partial, SCH-001) | **Committed (2 spans)** | SCH-001 advisory mode (sole blocker) |
| summary-detector.js | Run-5, 6 (partial, SCH-001) | **Committed (5 spans)** | SCH-001 advisory mode |
| auto-summarize.js | Run-6 regressed from run-5 | **Committed (3 spans)** | SCH-001 advisory + validation tolerance |
| journal-graph.js | Run-5, 6 (partial) | **Committed (4 spans)** | SCH-001 advisory mode |
| summary-graph.js | Run-5, 6 (partial) | **Committed (6 spans)** | SCH-001 advisory mode |
| summarize.js | Run-5, 6 (partial) | **Committed (3 spans)** | SCH-001 advisory + COV-003 boundary fix |
| journal-paths.js | Run-6 debatable skip | **Committed (1 span)** | SCH-001 advisory mode |

**Every previously failing file recovered in run-7.** The sparse-registry advisory mode was the key fix — it eliminated SCH-001 as a blocking validator error, allowing the agent to declare extensions and pass validation.

## Unmasked Bug Detection

With SCH-001 resolved, two new quality issues emerged:

### COV-006: Span Name Collision (RUN7-5)
**Previously masked by**: SCH-001 blocking all partial files. When files couldn't commit, span name uniqueness across files was untestable.
**Revealed in**: summary-graph.js `dailySummaryNode` reuses `commit_story.journal.generate_summary` from journal-graph.js. Both files now commit, exposing the collision.
**Severity**: Medium — affects trace analysis but not functionality.

### CDQ-005: Count Attributes as String Type (RUN7-6)
**Previously masked by**: SCH-001/validation blocking files with agent-declared extensions. When extensions couldn't pass validation, attribute type choices were invisible.
**Revealed in**: summary-detector.js and auto-summarize.js declare count attributes as `type: string` instead of `type: int`. The agent uses `String()` wrapping to match, losing numeric queryability.
**Severity**: Medium — affects trace backend queries but not instrumentation correctness.

**Dominant blocker peeling confirmed**: Run-5 fixed COV-003 → SCH-001 emerged. Run-7 fixed SCH-001 → COV-006 and CDQ-005 emerged. Each fix reveals the next layer. These new issues are significantly less severe than their predecessors — the pattern is converging toward polish rather than blockers.

## Regression Check

**Zero regressions.** All 5 run-6 committed files are still committed in run-7:
- claude-collector.js: committed → committed
- git-collector.js: committed → committed
- context-integrator.js: committed → committed
- summary-manager.js: committed → committed
- server.js: committed → committed

The 4 run-6 regressions all recovered:
- auto-summarize.js: regressed → committed
- context-capture-tool.js: debatable skip → correct skip (RST-004 precedence resolved)
- reflection-tool.js: debatable skip → correct skip
- journal-paths.js: debatable skip → committed
