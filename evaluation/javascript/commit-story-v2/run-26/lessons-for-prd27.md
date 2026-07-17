// ABOUTME: Process observations from run-26 to inform PRD #27 template and milestone drafting.
# Lessons for PRD #27 — commit-story-v2 Run-26

Process observations captured during run-26. Populated incrementally as the run progresses.

## Target-Specific Findings

*(Findings specific to commit-story-v2 that do not belong in the template)*

## Generalizable Process Improvements

*(Observations about the eval process itself that may warrant template updates)*

- **"0 attributes" in the run summary means 0 NEW schema attributes, not 0 attributes used.** Carried forward from taze run-16 via the Step 0.5 cross-run process review: a file that calls `setAttribute`/`setAttributes`/span-start `attributes` maps/wrapper helpers using only already-registered attributes reports "N spans, 0 attributes" — the count tracks new schema registrations, not total attribute usage. Already added to `docs/language-extension-plan.md` step 9 and cascaded to PRD #144 and PRD #147; note here only if run-26 surfaces a commit-story-v2-specific angle on this (e.g., a false "attribute absent" finding during Findings Discussion or per-file evaluation).

## Pre-Run Verification Summary (Step 13)

- **spiny-orb version**: 1.0.0, built from `main` @ `31b4dcb` (merge of PR #1033, feature/906-schema-registration-completeness-rule — landed mid-verification, confirmed fresh via `git status`/`git log` after re-checking, not from memory).
- **RUN25-1 (COV-004 ENOENT fix)**: Landed — `isExpectedConditionCatch` in `cov003.ts` recognizes the negated-ENOENT-rethrow pattern via commit `57f81dd` (Option A: validator fix, not prompt guidance).
- **Attribute selection guidance**: Landed via PR #1030 / commit `647399b`.
- **Debug dump coverage**: Confirmed for partial results at `instrument-with-retry.ts:1590-1593`.
- **RUN21-6 (#927)**: Still open — this is the fifth consecutive watch run with no further changes landed.
- **context-capture-tool.js**: No dedicated fix; only partially addressable pre-run via the attribute selection guidance above.
- **File inventory**: 32 `.js` files (31 expected from run-25) — explained by organic PRD #39 development churn, not a regression (see Pre-Run Observations below).
- **Target repo (commit-story-v2)**: On `main`, clean tree, not on run-25's instrument branch.
- **Push auth**: Dry-run push with `$GITHUB_TOKEN` succeeded.
- **Datadog health**: 29 spans over 7 days, continuous through today — pipeline healthy.
- **Instrument branch confirmation**: No recent spans show run-25's branch HEAD SHA (`6a8964d1ecd93e6ff6c80a913eff8369c1b0b838`); all show current main HEAD (`8bea3922...`) on the commit-story-v2 target repo (unrelated to spiny-orb's own HEAD above).
- **README check**: `run-log.md` has a run-25 row; root `README.md` is stale (pre-existing, noted but not blocking).

All 18 pre-run verification steps complete. Ready for Milestone 5.

## Pre-Run Observations

- **File inventory drift is expected for organic targets under active development.** Step 11 expected 31 `.js` files (run-25 baseline) and found 32. Root cause: PRD #39 (monthly/weekly summary generation) and related feature work merged to commit-story-v2's `main` in the ~1 month since run-25, adding files like `src/commands/summarize.js`, `src/managers/summary-manager.js`, `src/managers/auto-summarize.js`, `src/generators/summary-graph.js`, `src/utils/summary-detector.js`, `src/utils/failure-placeholder.js`, and new prompt files under `src/generators/prompts/sections/`. This is organic churn, not a defect — a template step comparing against a stale "expected count" from a prior run should treat small deltas as informational, not a blocking discrepancy, unless the delta is large or unexplained by a quick `git log --diff-filter=A` scan. Consider updating step 11's guidance in `docs/language-extension-plan.md` to say "compare against the prior run's actual count and explain any delta via recent merged PRDs" rather than asserting a fixed expected number.
- **`vcs.ref.head.revision` is not durably comparable across runs.** Per Decision D-6, this attribute is the CLI argument SHA (short form) passed at invocation time, not the instrument branch HEAD. Step 16 correctly used `git.commit.sha` on `commit_story.journal.save_journal_entry`/`generate_sections` spans instead — this is the durable comparison point and matched the target repo's actual `main` HEAD (`8bea39229d24fc03910e3d9f27c99a65da816cac`) across all 15+ recent spans queried.
- **Datadog span health check (step 15) is a fast, high-confidence pre-run gate.** A single `search_datadog_spans` call over a 7-day window returned 29 dense, continuously-arriving spans through the current day — clear signal the pipeline is live and no Agent restart or troubleshooting was needed. This step is cheap and worth keeping as-is in the template.
