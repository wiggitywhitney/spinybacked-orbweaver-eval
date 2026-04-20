# PR Artifact Evaluation — Release-it Run-1

**PR**: Not created — PAT lacks `createPullRequest` GraphQL permission on wiggitywhitney/release-it  
**Branch**: spiny-orb/instrument-1776550755270 (pushed to fork, no PR)  
**State**: Branch exists on origin; no open PR

---

## PR Creation Failure

The GITHUB_TOKEN resolved via vals authenticated for branch push (`urlChanged=true, path=token-swap`) but was rejected for PR creation via GraphQL:

```text
gh pr create failed: pull request create failed:
GraphQL: Resource not accessible by personal access token (createPullRequest)
```

The fine-grained PAT has `contents: write` (push) but lacks `pull_request: write` (createPullRequest). This is a PAT permission gap on the new fork target — prior runs on wiggitywhitney/commit-story-v2 used a token with the correct scope for that repository. A separate scope grant is needed for wiggitywhitney/release-it.

**Fix for run-2**: Add `pull_request: write` to the fine-grained PAT scoped to wiggitywhitney/release-it.

---

## PR Summary Quality

The PR summary file was written locally (`spiny-orb-pr-summary.md` in the release-it fork root) despite PR creation failing. The summary is accurate for what the run produced.

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (5 processed / 0 committed / 2 failed / 3 skips) | YES | Matches run output |
| Failed file list (config.js, index.js) | YES | Correct |
| Correct skip list (args.js, cli.js, log.js) | YES | Correct |
| Cost ($0.68 actual / $53.82 ceiling) | YES | Matches PR summary table |
| Token usage (21.1K in / 32.7K out / 69.1K cached) | YES | Correct |
| Warnings (5 warnings) | YES | All 5 present and accurate |
| Advisory findings | 1 (CDQ-008) | Run-level advisory: no `trace.getTracer()` calls found — accurate, expected given 0 committed files |

### Advisory Finding Assessment

**CDQ-008** — No `trace.getTracer()` calls found.

**Verdict**: Correct and expected. This advisory fires at run level when no files are committed with instrumentation. With 0 committed files, there are no tracer calls to evaluate. The advisory is informational rather than actionable for this run.

### Reviewer Utility

With only 5 files processed and 0 committed, the PR summary serves primarily as a cost and failure record. It correctly documents the run stoppage and identifies both failed files. The absence of span tables, schema change lists, and quality advisories reflects the run's outcome accurately — there is nothing to report on those dimensions.

---

## Instrumentation Branch Quality

The `spiny-orb/instrument-1776550755270` branch contains 4 commits:

1. Spiny-orb prerequisites (from setup milestone)
2. `instrument lib/args.js` — instrumentation report only (0 changes to source)
3. `instrument lib/cli.js` — instrumentation report only (0 changes to source)
4. `instrument lib/log.js` — instrumentation report only (0 changes to source)
5. PR summary added

config.js and index.js generated code was never committed — LINT failures triggered rollback to originals on all 3 attempts.

The branch is clean (no broken source files, no partial edits). The instrumentation reports for the 3 correct-skip files are present and accurate.

---

## Summary

PR artifact evaluation is minimal by necessity — no PR exists and no instrumentation was committed. The PR summary file is accurate. The PAT permission gap (pull_request: write) is the sole blocker on the PR creation side; fixing it requires a PAT update, not a spiny-orb change.
