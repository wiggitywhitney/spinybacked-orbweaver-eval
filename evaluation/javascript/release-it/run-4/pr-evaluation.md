# PR Artifact Evaluation — release-it Run 4

**PR**: https://github.com/wiggitywhitney/release-it/pull/3
**Branch**: spiny-orb/instrument-1778091147901
**State**: OPEN (manually created — see Push Auth section)
**Generated summary file**: `~/Documents/Repositories/release-it/spiny-orb-pr-summary.md` (399K lines, not posted)

---

## Push Auth — RUN3-2 Fix Confirmed; New Failure Emerged

Push to `wiggitywhitney/release-it` **succeeded** — the URL swap mechanism fired correctly (`urlChanged=true`), confirming the RUN3-2 upstream-targeting fix from run-3 is resolved.

PR auto-creation **failed** with `spawn E2BIG`. The PR body passed to `gh pr create` exceeded the OS argument length limit. Root cause: the live-check compliance report (2173 spans × 15389 advisory findings) is embedded as a raw JSON blob in the PR body, producing a 399K-line file. PR #3 was manually created by Whitney with a shortened body that does not include advisory findings, schema changes detail, or the compliance report.

The generated summary was saved to `spiny-orb-pr-summary.md` in the release-it repo and is the basis for the accuracy assessment below.

---

## PR Summary Quality

**Length**: ~150 lines of content + 399K-line JSON compliance blob (total body: not postable)

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (23 processed / 7 committed / 6 failed / 10 no changes needed) | YES | Matches run-summary.md |
| Per-file span counts (20 total) | YES | config.js 3, Plugin.js 1, factory.js 2, Git.js 10, Version.js 1, shell.js 2, util.js 1 |
| Per-file attempt counts | YES | All 13 entries correct |
| Per-file cost (sum $6.96 ≈ $6.97) | YES | Consistent with token usage table |
| Correct skip list (10 files) | YES | All 10 files listed |
| Schema attributes added (8) | YES | All 8 listed: config.file, git.enabled, git.has_upstream, git.is_repo, git.push_repo, plugin.enabled_count, plugin.external_count, util.collection_size |
| New span IDs (20) | YES | All 20 listed |
| Review attention flag (Git.js outlier) | YES | "10 spans added (average: 3) — outlier, review recommended" |
| Token usage | YES | Cost $6.97, Input 218,841, Output 334,721, Cache read 219,084, Cache write 327,817 |
| Live-check | YES | OK (2173 spans, 15389 advisory findings) |

### Schema Changes Section

The PR summary correctly includes both attribute additions (8 new attributes) and span extensions (20). The spans section lists all 20 new IDs with their full `span.release_it.*` names. No schema diffs shown relative to the run-3 baseline (the diff is from registry version 0.1.0 to 0.1.0 — no version bump — so no diff output is produced).

### Advisory Findings Quality

The PR summary includes 9 advisory findings across 4 committed files.

| Finding | Verdict | Notes |
|---------|---------|-------|
| SCH-001 on Plugin.js (show_prompt ≈ load_options?) | **Incorrect** | show_prompt and load_options are semantically unrelated operations — different plugin class, different lifecycle stage |
| CDQ-007 on factory.js (enabledPlugins.length) | **Partially valid** | enabledPlugins comes from Array.filter() and is always an array; null guard is defensive but not required in practice |
| CDQ-007 on factory.js (enabledExternalPlugins.length) | **Partially valid** | Same as above |
| SCH-001 on Git.js (is_enabled ≈ is_git_repo?) | **Incorrect** | is_enabled checks config; is_git_repo checks filesystem — clearly distinct operations |
| SCH-001 on Git.js (release ≈ unspecified?) | **Incorrect** | Advisory references "the existing name" without naming it; too vague to act on; release is a distinct operation |
| CDQ-007 on Version.js (options.latestVersion) | **Partially valid** | getContext() could return undefined if context not set; guard is defensible |
| CDQ-007 on Version.js (options.increment) | **Partially valid** | Same as above |
| SCH-001 on shell.js (exec_formatted_command ≈ itself?) | **Incorrect** | First occurrence of this span name; no existing registry entry to duplicate |
| SCH-001 on shell.js (exec_with_arguments ≈ exec_formatted_command?) | **Incorrect** | These are two different exec functions with different signatures; not duplicates |

**Advisory contradiction rate**: 5 clearly incorrect out of 9 non-trivial advisories = **56%** (well above 30% target; SCH-001 judge continues to over-flag new span names as potential duplicates of each other).

The CDQ-007 findings (4) are borderline: the code is functionally safe but the guard would be defensive best practice. None warrant blocking action.

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All files, spans, attributes, schema changes fully listed |
| Accuracy | 4/5 | File-level data accurate; advisory findings largely noise |
| Actionability | 2/5 | CDQ-007 borderline findings require judgment; SCH-001 findings are false positives; no actionable blockers identified |
| Presentation | 2/5 | Body never posted (E2BIG); manually-created PR #3 lacks advisory findings and schema detail; 399K-line compliance JSON is not human-readable |
| **Overall** | **3.25/5** | Content quality is acceptable; delivery failure (E2BIG) severely limits reviewer utility |

---

## New Failure Mode: E2BIG (spawn argument overflow)

The compliance report embedding is the root cause. The 15389 advisory findings from the live-check produce a JSON blob that, when embedded inline in the PR body, makes the body too large for `execFile`/`spawn` to pass as a command-line argument. The `gh pr create --body` flag cannot accept multi-megabyte strings on this OS.

This is a spiny-orb infrastructure bug. Mitigations:
1. Write the PR body to a temp file and use `gh pr create --body-file` instead of `--body`
2. Exclude the raw compliance JSON from the PR body; reference a separate artifact or summarize findings count only

The `spiny-orb-pr-summary.md` file is left in the working tree of the release-it fork and is not committed.

---

## Cost

| Source | Amount |
|--------|--------|
| PR total (from token usage) | $6.97 |
| Run-3 total | $1.59 |
| Run-2 total | $0.96 |
| Delta vs run-3 | +$5.38 |
| PRD projection (target, RUN3-1 fixed) | ~$5–10 |

**$6.97** — within the PRD's target-scenario projection ($5–10) for a run where the pre-scan fix lands and class-method-heavy plugin files are attempted. The cost increase from run-3 is explained by: 7 committed files (vs 3), 6 failed files each consuming 2–3 attempts, and Git.js taking 2 attempts on a 10-span file ($1.06). Cost per committed file: ~$1.00.
