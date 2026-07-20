// ABOUTME: Run-26 summary — results, fix verification, file outcomes, and key findings.
# Run-26 Summary

**Date**: 2026-07-17
**Branch**: `spiny-orb/instrument-1784302707982` (confirmed via `git branch --show-current` on commit-story-v2 — the log did not print a literal "Branch:" line this run, unlike prior runs; see Key Findings)
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/91 (created manually during the run's ~27.5-hour approval pause, per the PR Auto-Creation Failure Recovery convention, using `spiny-orb-pr-summary.md` as the body — not a spiny-orb push/PR defect; see Key Findings)
**spiny-orb**: built from main (per PRD pre-run verification milestone)

---

## Results

| Metric | Value |
|--------|-------|
| Files committed | 14 |
| Files failed | 0 |
| Files partial | 0 |
| Correct skips | 18 |
| Files seen | 32 |
| Total spans | 41 |
| New schema attributes | 19 |
| Model | claude-sonnet-4-6 |
| Tokens | 340.3K input / 411.1K output (671.4K cached) |
| Cost | $11.15 |

---

## Fix Verification

| Item | Expected | Result |
|------|----------|--------|
| RUN25-1: summary-manager.js COV-004 — `isExpectedConditionCatch` false positive on negated ENOENT rethrow | Fix confirmed if all 9 functions commit cleanly | **Confirmed** — summary-manager.js committed 9 spans, 0 partial (was 7 spans + partial in run-25). All 9 exported async functions committed cleanly. |
| Attribute selection guidance (§5 asks from run-25 handoff) | Watch for improvement | **Pending per-file eval** — new schema attributes rose 16→19 run-over-run; summarize.js at 9 attrs (was 6 in run-25); summary-detector.js recovered to 3 attrs (was 0 in run-25, 3 in run-24) — apparent improvement, needs code-level confirmation |
| context-capture-tool.js declining richness (3→2→1→0 over runs 23–26) | Watch (4th run) | **Likely not a genuine decline** — per-file evaluation found the span actually sets 2 domain attributes (`commit_story.journal.file_path`, `commit_story.journal.entry_date`); the logged "0 attrs" reflects new-schema-extension count only, since both attributes reuse pre-existing registry keys. The run-25 "0 attrs" data point should be re-examined the same way before treating this as a confirmed 3→2→0 regression. |
| RUN21-6: Agent notes vs committed code divergence | Watch (5th run) | **No new instances identified** in run-26 per-file evaluation. #927 remains open — fifth consecutive run with no new signal. |
| PH-1: abstracted prompt guidance generalization | Watch (2nd run) | **Holding resolved** — second run since the PR #982 fix (first was run-25). No regression to hardcoded values observed. |
| journal-graph.js | Ninth consecutive success expected | **Confirmed** — committed, 4 spans, 2 attrs, ×3 attempts |

---

## File Outcomes

| File | Result | Spans | New schema attrs | Attempts | Notes |
|------|--------|-------|-------|----------|-------|
| src/collectors/claude-collector.js | ✅ committed | 1 | 0 | 1 | |
| src/collectors/git-collector.js | ✅ committed | 2 | 0 | 3 | |
| src/generators/prompts/guidelines/accessibility.js | ✅ skip | 0 | 0 | 1 | |
| src/generators/prompts/guidelines/anti-hallucination.js | ✅ skip | 0 | 0 | 1 | |
| src/generators/prompts/guidelines/index.js | ✅ skip | 0 | 0 | 1 | |
| src/generators/prompts/sections/daily-summary-prompt.js | ✅ skip | 0 | 0 | 1 | |
| src/generators/prompts/sections/dialogue-prompt.js | ✅ skip | 0 | 0 | 1 | |
| src/generators/prompts/sections/monthly-summary-prompt.js | ✅ skip | 0 | 0 | 1 | |
| src/generators/prompts/sections/summary-prompt.js | ✅ skip | 0 | 0 | 1 | |
| src/generators/prompts/sections/technical-decisions-prompt.js | ✅ skip | 0 | 0 | 1 | |
| src/generators/prompts/sections/weekly-summary-prompt.js | ✅ skip | 0 | 0 | 1 | |
| src/integrators/filters/message-filter.js | ✅ skip | 0 | 0 | 1 | |
| src/integrators/filters/sensitive-filter.js | ✅ skip | 0 | 0 | 1 | |
| src/integrators/filters/token-filter.js | ✅ skip | 0 | 0 | 1 | |
| src/integrators/context-integrator.js | ✅ committed | 1 | 0 | 1 | |
| src/logger.js | ✅ skip | 0 | 0 | 1 | |
| src/generators/journal-graph.js | ✅ committed | 4 | 2 | 3 | |
| src/generators/summary-graph.js | ✅ committed | 6 | 3 | 2 | |
| src/mcp/tools/context-capture-tool.js | ✅ committed | 1 | 0 | 1 | |
| src/mcp/tools/reflection-tool.js | ✅ skip | 0 | 0 | 2 | |
| src/mcp/server.js | ✅ committed | 1 | 1 | 1 | |
| src/traceloop-init.js | ✅ skip | 0 | 0 | 1 | |
| src/utils/commit-analyzer.js | ✅ skip | 0 | 0 | 1 | |
| src/utils/config.js | ✅ skip | 0 | 0 | 1 | |
| src/utils/failure-placeholder.js | ✅ skip | 0 | 0 | 1 | |
| src/utils/journal-paths.js | ✅ committed | 1 | 0 | 1 | |
| src/managers/journal-manager.js | ✅ committed | 2 | 1 | 1 | |
| src/managers/summary-manager.js | ✅ committed | 9 | 0 | 2 | RUN25-1 fix confirmed — all 9 functions committed, no partial |
| src/commands/summarize.js | ✅ committed | 3 | 9 | 2 | +3 attrs vs run-25 (6→9) |
| src/utils/summary-detector.js | ✅ committed | 5 | 3 | 3 | Recovered attrs vs run-25 (0→3) |
| src/managers/auto-summarize.js | ✅ committed | 3 | 0 | 1 | |
| src/index.js | ✅ committed | 2 | 0 | 1 | |

---

## Attempt Distribution

| Attempts | Files |
|----------|-------|
| ×1 | 25 |
| ×2 | 4 (summary-manager, summarize, summary-graph, reflection-tool [skip]) |
| ×3 | 3 (git-collector, journal-graph, summary-detector) |

---

## Key Findings

1. **RUN25-1 confirmed fixed for this run** — summary-manager.js committed all 9 exported async functions with 0 partial (run-25 had 7 spans committed + 2 functions blocked as partial). Run-26's output shows the COV-004 validator no longer flags the negated ENOENT rethrow pattern as a non-graceful-degradation catch — the validator source itself was not diffed to confirm this is a permanent fix rather than a run-specific outcome.

2. **Log did not print an explicit branch name line** — Unlike prior runs where `grep -m1 'Branch:' spiny-orb-output.log` (per Decision D-4) returned the instrument branch, run-26's log contains no such line; only `pushBranch: ...` diagnostic lines appear, with no branch name. The branch name was confirmed instead via `git branch --show-current` on the commit-story-v2 target repo. Worth flagging in lessons-for-prd27.md — D-4's extraction command may need a fallback or spiny-orb's log output may have changed.

3. **PR created manually, not a spiny-orb defect** — The automated run paused at a live `Proceed? [y/N]` prompt for ~27.5 hours awaiting confirmation. Premature manual recovery during that pause (pushing the branch and creating PR #91 via `gh pr create --body-file spiny-orb-pr-summary.md`) produced the apparent duplicate-PR failure; the resumed run correctly detected the duplicate. This ends a streak of 6 consecutive AUTO push/PR runs (19–21, 23–25; run-22 never executed) — but the cause is eval-side manual recovery timing, not a spiny-orb push/PR defect.

4. **Attribute selection guidance shows apparent improvement** — New schema attributes rose from 16 (run-25) to 19 (run-26). summary-detector.js recovered from 0 attrs (run-25 collapse) to 3, and summarize.js continued climbing (2→6→9 across runs 24/25/26). Needs per-file code inspection to confirm these are meaningful domain attributes and not selection-guidance noise in the other direction.

5. **Cost up vs run-25** — $11.15 vs $7.38. Token usage up (340.3K/411.1K vs 213.5K/286.7K input/output). Likely driven by the higher-attempt files (git-collector, journal-graph, summary-detector all ×3) plus one additional file appearing in the run (32 files seen vs 31 in run-25 — `failure-placeholder.js` is new in the inventory).

---

## Post-Run Datadog Verification

**Span verification — confirmed.** `search_datadog_spans` on `service:commit-story` from the run start timestamp (`2026-07-17T15:38:27Z`) onward returned spans matching the run-26 instrument branch. Verified via `vcs.ref.head.revision: 0b2c5474c7715e4cfde89caa4768acabd98423c6` on `commit_story.journal.save_journal_entry` and `commit_story.context.gather_context_for_commit` spans, which matches the instrument branch (`spiny-orb/instrument-1784302707982`) HEAD SHA. Note: `git.commit.sha` on these spans represents the *journaled* commit (domain data the app is summarizing), not the instrumented code's own git state — `vcs.ref.head.revision` is the correct attribute for this check. `service.instance.id: 79885399-4f70-41f7-8e8b-f29e5ca1bcf6` recorded in `trace-artifact.md`.

**Log-trace correlation — confirmed, no regression.** `search_datadog_logs` on `service:commit-story` from the run start timestamp returned 174 total logs; of an 87-log sample, ~72 (~83%) carry non-empty `trace_id`/`span_id`. This is consistent with the run-25 baseline (~80% correlated) — not a regression. The uncorrelated ~17% are consistently "Journal entry saved" log lines, which are emitted outside an active span (after span closure, in the manager layer) rather than during graph execution.
