# PR Artifact Evaluation — release-it Run-2

**Branch**: spiny-orb/instrument-1776786399007
**PR**: NOT CREATED — push succeeded but PR creation failed (`GraphQL: Resource not accessible by personal access token (createPullRequest)`)
**PR summary file**: `spiny-orb-pr-summary.md` on the spiny-orb branch

---

## Push Status

Push succeeded: the spiny-orb branch was created at `wiggitywhitney/release-it` with all 23 instrumented (or unchanged) files. The URL swap mechanism fired (`urlChanged=true, path=token-swap`) confirming the token was used for HTTPS auth.

PR creation failed with the same error as run-1's RUN1-3: the PAT in GCP Secret Manager at `github-token-release-it` does not have `pull_requests:write`. The push permission (`contents:write`) is present; PR creation permission is absent. This must be remediated before run-3.

---

## PR Summary Quality

The PR summary file (`spiny-orb-pr-summary.md`) was generated and is available on the spiny-orb branch. It is not attached to a live PR.

**Summary length**: ~600 lines (includes full Prettier diffs for all LINT failures embedded in per-file status fields)

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (23 total / 0 committed / 3 no-changes-needed / 20 failed) | YES | Matches final run output |
| Per-file status with failure reasons | YES | All LINT diffs included in file status |
| Per-file span counts | YES | 0 committed spans (all rolled back) |
| Per-file attempt counts | YES | Correct for all files |
| Per-file cost | YES | config.js $0.21, index.js $0.54, etc. |
| Correct skip list (3 files) | YES | git/prompts.js, github/prompts.js, github/util.js |
| Schema changes | YES — NO CHANGES | Registry v0.1.0 → v0.1.0; no net schema modifications (all instrumented files rolled back) |
| Token usage | YES | $5.69 actual cost; 225.9K input, 257.7K output, 269.9K cached |
| Live-check | YES | Reported as OK then PARTIAL — partial because 17 files failed |

### Advisory Findings Quality

The PR summary includes 2 advisory findings, both on `lib/plugin/factory.js`:

| Finding | Rule | Verdict | Notes |
|---------|------|---------|-------|
| `enabledPlugins.length` without null guard at line 93 | CDQ-007 | **Incorrect** — false positive | `Array.filter()` always returns an array; `enabledPlugins` cannot be null. CDQ-007 judge incorrectly treats post-filter arrays as nullable. |
| `enabledExternalPlugins.length` without null guard at line 94 | CDQ-007 | **Incorrect** — false positive | Same as above; `enabledExternalPlugins` is the result of `filter()` on the enabled plugins array. |

**Advisory contradiction rate**: 2 incorrect out of 2 advisory findings = **100%**.

This is not a signal of systemic advisory quality degradation — with only 2 advisories in the entire run (versus 19 in run-12), the sample is too small to draw a trend conclusion. Both false positives are the same CDQ-007 pattern (treating post-filter arrays as nullable), which is a known CDQ-007 validator limitation.

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 4/5 | All files accounted for; Prettier diffs embedded in failure messages (long but complete) |
| Accuracy | 4/5 | File-level data accurate; advisory findings are false positives |
| Actionability | 2/5 | 0 committed files means no spans to review in a PR; the value is as a record of what the agent attempted |
| Presentation | 3/5 | Prettier diffs embedded in table cells make the summary very long; hard to scan |
| **Overall** | **3.25/5** | Lower than run-12 (4.25/5) due to no committed files and embedded diffs |

---

## Cost

| Source | Amount |
|--------|--------|
| Actual cost | $5.69 |
| Run-1 | $0.68 |
| Delta vs run-1 | +$5.01 |
| Cost ceiling | $53.82 |
| Utilization | 10.6% of ceiling |

**$5.69** for 23 files processed with 0 net commits. Cost breakdown drivers:
- 6 LINT failures × 3 attempts each = heavy retry cost
- 1 NDS-003 failure × 2 attempts
- 1 COV-003 failure × 2 attempts
- 5 files committed spans before rollback (then rolled back — cost is sunk)
- High output token count (257.7K) from large Prettier diffs being included in fix-loop feedback

The run cost is reasonable for a 23-file run. The $53.82 ceiling was set conservatively at 100K tokens per file; actual cost was ~$0.25/file, well within ceiling.

---

## Schema Changes Assessment

No net schema changes. The registry version remains v0.1.0 → v0.1.0 because all instrumented files (which would have added `@opentelemetry/api` import and tracer init to the `semconv/` context) were rolled back before the run ended.

The spiny-orb branch does include the modified `package.json` (with `@opentelemetry/api` in peerDependencies) and `examples/instrumentation.js` (SDK init file). These are schema-adjacent artifacts that would be part of any eventual PR.

**Schema extensions (would have been introduced)**: 18 new span names and ~15 new attribute keys across the 8 instrumented files, all under the `release_it.*` namespace. These are documented in the per-file evaluation but are not yet in the Weaver registry.
