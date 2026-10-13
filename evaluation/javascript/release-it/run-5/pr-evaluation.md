# PR Artifact Evaluation — release-it Run 5

**PR**: https://github.com/wiggitywhitney/release-it/pull/4
**Branch**: spiny-orb/instrument-1790686416741
**State**: OPEN (created automatically by spiny-orb)
**Changed files**: 31 (+153,378 / −625)
**Generated summary file**: `~/Documents/Repositories/release-it/spiny-orb-pr-summary.md` (547 lines; also committed to the branch)

Verdicts on spiny-orb's advisories come from `per-file-evaluation.md` as reconciled in its "Cross-File Reconciliation" section, not from the batch agents' first pass.

---

## Push Auth and PR Creation — RUN4-2 Resolved

The push succeeded through the token-swap path (`pushBranch: urlChanged=true, path=token-swap`, log L2185). The final summary box prints `PR: https://github.com/wiggitywhitney/release-it/pull/4` (log L2496).

**RUN4-2 (PR body E2BIG) is resolved.** Run-4's `gh pr create` failed with `spawn E2BIG`, and PR #3 had to be created by hand with a shortened body. In run-5, spiny-orb committed the summary and the live-check report at 14:10:52 UTC (`docs: add PR summary to instrument branch`), and PR #4 was opened 7 seconds later at 14:10:59 UTC with no manual step. The posted body matches `spiny-orb-pr-summary.md` line for line. The only difference is CodeRabbit's auto-generated release-notes block, which CodeRabbit appended after the PR was created. spiny-orb now writes the body to a temp file and passes `--body-file` (`spiny-orb-findings.md`, RUN4-2 row). The raw compliance JSON is no longer inlined. The body links to `spiny-orb-live-check-report.json` instead.

---

## PR Summary Quality

**Length**: 547 lines (run-4: about 150 lines of content plus a 399K-line JSON blob that could not be posted)

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (23 processed / 9 committed / 10 no changes needed / 4 failed) | YES | Matches `run-summary.md` |
| Per-file span counts (33 total) | YES | config.js 3, prompt.js 1, util.js 1, Plugin.js 1, GitRelease.js 2, GitHub.js 13, GitLab.js 9, Version.js 1, factory.js 2. `agent-extensions.yaml` declares 33 span IDs. |
| Per-file attempt counts | YES | All 13 entries match the per-file section headers and the failed-file log blocks |
| Per-file cost (sum $6.54 ≈ $6.55) | YES | Committed files $3.63, failed files $2.91 |
| "No changes needed" list (10 files) | PARTIAL | All 10 are listed. Two of them, `lib/index.js` (`runTasks`) and `lib/cli.js`, were skipped because of pre-scan false negatives, so the label is wrong for those two (`per-file-evaluation.md`, "Correct Skips (10)") |
| Registry attributes added (13) | YES | Matches the 13 `release_it.*` attribute entries in `agent-extensions.yaml`. These are new schema keys only. |
| New span IDs (33) | YES | All 33 listed under their files |
| Schema Extensions column | YES | Each value equals spans plus new attribute keys (for example GitLab.js 9 + 4 = 13) |
| Span Category Breakdown, "Attrs Reused / New" | NO | "Reused" reads 0 in all nine rows. Several files set registered keys: GitHub.js sets 10 (33 `setAttribute` calls), GitLab.js sets 8 distinct keys against 4 new, GitRelease.js 3 against 1 new, Version.js 3, and Plugin.js 2. The section is labeled as self-reported, so it's flagged here as a reviewer-facing inaccuracy, not a validator miss |
| Span Category Breakdown, "External Calls" | NO | GitHub.js reads 0 even though its Octokit call sites are the reason COV-002 passes in that file. config.js reads 1, but it has no outbound call site (COV-002 N/A) |
| Review attention flags (GitHub.js 13, GitLab.js 9) | YES | Both are outliers against the average of 4 |
| Token usage | YES | $6.55, input 219,735, output 254,763, cache read 199,693, cache write 535,431 |
| Live-check | PARTIAL | The line reads "Live-Check: OK (1239 spans, 5555 advisory findings)". The Warnings section then says the report "may be incomplete" because 4 files failed. A reviewer who reads only the status line sees a clean result |

### Schema Changes Section

The section lists all 13 added attributes and all 33 span IDs, grouped per file. The registry version is unchanged (baseline 0.1.0, head 0.1.0), as in run-4. The attribute list counts new keys only, so the registered keys that the committed code reuses (`release_it.is_ci`, `release_it.git.tag_name`, `release_it.changelog.length`, and others) appear nowhere in the PR body. A reviewer has to read the diff to learn which registered attributes the spans carry.

### Advisory Findings Quality

The PR body lists 12 advisory sites across 4 files, all CDQ-007. Three companion `.instrumentation.md` files carry 6 more SCH-001 advisories that do not appear in the PR body.

| Finding | Source | Verdict | Notes |
|---------|--------|---------|-------|
| CDQ-007 on prompt.js L37 | PR body | **Incorrect** | L37 is `release_it.prompt.type`, whose values are `confirm`/`input`/`list`. No PII name and no path |
| CDQ-007 on Plugin.js L71 | PR body | **Incorrect** | `release_it.prompt.name` holds a prompt identifier, not a person's name or a path |
| CDQ-007 on GitHub.js L344, L345, L346, L457, L458, L459, L513, L636 (8 sites) | PR body | **Incorrect** | None of these lines carries a PII attribute name or a filesystem path |
| CDQ-007 on Version.js L81, L84 | PR body | **Incorrect** | `release_it.version.current` and `release_it.version.increment` are bounded scalars guarded by `!= null` (Version.js CDQ-007 PASS) |
| SCH-001 in `GitRelease.instrumentation.md` | Companion only | **Incorrect** | Both span names are declared in `agent-extensions.yaml` |
| SCH-001 ×4 in `GitHub.instrumentation.md` | Companion only | **Incorrect** | Stale. All 13 names are declared on the instrument branch |
| SCH-001 in `GitLab.instrumentation.md` (`create_release` vs `release`) | Companion only | **Incorrect** | `release()` orchestrates upload and create around `this.step`, and `createRelease()` makes the API call. The agent reached the same conclusion in its thinking and kept the names |

**Advisory contradiction rate**: 18 of 18 advisory sites are incorrect, or **100%** (run-4: 56%). All 12 sites in the PR body are false positives.

**Missed by the validator**: per-file evaluation found two real CDQ-007 failures, and spiny-orb flagged neither one.
- GitHub.js L603 sets `release_it.git.tag_name` unconditionally from the nullable `latestTag`, which is `null` on a first release. The same line is GitHub.js's SCH-002 FAIL, because it holds the previous tag under a key defined as the new tag.
- prompt.js L22 sets `release_it.prompt.name` without a guard. The advisory for the same file points at L37 instead.

**Message quality**: the CDQ-007 text reads "Fired for one or more of: a PII attribute name ... or a raw filesystem path". It does not say which condition fired or which attribute key it is about. The four GitHub.js and Version.js entries in the PR body collapse their lines into a trailing list. Each of the 12 sites repeats the same paragraph of path-handling advice, none of which applies, because none of these sites is a path.

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All files, spans, new attributes, costs, warnings, and setup guidance are present |
| Accuracy | 3/5 | File-level data is accurate. The Span Category Breakdown is wrong in two columns, the live-check line reads OK over a partial report, and none of the advisories is correct |
| Actionability | 2/5 | Every advisory is a false positive, the advisory text does not say what fired, and both real CDQ-007 sites are missing. The SDK bootstrap and short-lived-process guidance are useful |
| Presentation | 3/5 | The body was posted, which run-4's was not. The failed-file rows put the whole validator message into the Status cell. GitBase.js's row is 7,871 characters, including a flattened Prettier diff that the Warnings section repeats. The body also carries 7 absolute local paths (see below) |
| **Overall** | **3.25/5** | Same total as run-4 for different reasons. The delivery failure is fixed, and the advisory and breakdown problems now set the score |

---

## PR Contents Beyond Source Changes

Of the 31 changed files, 9 are instrumented source, 19 are `.instrumentation.md` companions, 1 is the registry (`semconv/agent-extensions.yaml`, +223), and 2 are the spiny-orb deliverables added in the `docs: add PR summary to instrument branch` commit.

- **`spiny-orb-live-check-report.json` (+150,297 lines)** makes up 98% of the PR's added lines. Run-4's manually created PR #3 did not include it. A reviewer is not meant to read it line by line, so it inflates the PR's size without adding anything to review.
- **Local filesystem paths are published.** The repository is PUBLIC. The live-check report contains the absolute home-directory path, which includes the local username, on 1,046 lines. The PR body contains 7 more in the failed-file warnings and the Prettier config path. CDQ-007 exists to keep raw filesystem paths out of telemetry, and spiny-orb's own deliverables publish them. Handoff finding: spiny-orb should make these paths relative to the repo root before writing the report and the body.
- **10 companion files for skipped files** (14 lines each) record a pre-scan skip with no instrumentation. They add 10 near-empty files to the review.
- **`spiny-orb-pr-summary.md` is committed** as well as posted, so the body exists in two places on the branch. Run-4 had the same file in PR #3.

---

## Cost

| Source | Amount |
|--------|--------|
| PR total (from token usage) | $6.55 |
| Run-4 total | $6.97 |
| Delta vs run-4 | −$0.42 |
| PRD projection, conservative (RUN4-1 not fixed) | ~$5–7 |
| PRD projection, target (RUN4-1 fixed) | ~$8–12 |

**$6.55**, which is within the conservative projection. RUN4-1 is only partly resolved (3 of 5 blocked files now commit), so the run falls between the two scenarios. Run-5 committed two more files and 13 more spans than run-4 for $0.42 less. Cost per committed file fell from about $1.00 to about $0.73. The 4 failed files cost $2.91, which is 44% of the run (GitBase.js $0.68, Git.js $0.96, npm.js $0.65, shell.js $0.62), and they produced nothing that shipped.
