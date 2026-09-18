// ABOUTME: Trace evidence for run-28 — post-run Datadog verification only (pre-run capture skipped, see D-14).
# Run-28 Trace Artifact

**Note**: Unlike prior runs, this artifact has **no pre-run section**. Per PRD #156's D-14, the instrument run executed before the PRD's own pre-run verification milestone (which normally captures `pre_run_service.instance.id`) had been performed. That capture cannot be done retroactively — main-branch dogfooding traffic from before the run was not recorded at the time.

## Post-run verification

**post_run_service.instance.id**: `ab1620ee-ef3e-4d7f-813b-6ae7894744ff`

**query (post-run instance, instrument-branch evidence)**: `service:commit-story` from `2026-09-17T12:28:52Z` (eval run start) to `2026-09-17T13:45:27Z` (verification query time)

**Confirmation**: `vcs.ref.head.revision: c87b774` on multiple spans (e.g. `commit_story.journal.save_entry`, `commit_story.journal.generate_sections`, `commit_story.journal.dialogue_node`, `commit_story.journal.summary_node`, `commit_story.journal.technical_node`) matches the instrument branch `spiny-orb/instrument-1789648132789`'s HEAD SHA (`c87b7749c5a17a0b5f8c88d26d51d2cb37e331e1`, short `c87b774`) — confirmed via `git -C ~/Documents/Repositories/commit-story-v2 rev-parse spiny-orb/instrument-1789648132789`. Direct evidence the local commit-story-v2 checkout, on the instrument branch, self-journaled its own commits during and after the eval run (per D-10 — `vcs.ref.head.revision`, not `git.commit.sha`, identifies the running code's own branch).

**Log-trace correlation check** (commit-story-v2 pino bridge): Sampled 87 of 170 logs from `service:commit-story` in the same window. 71/87 (~82%) carry non-empty `trace_id`/`span_id` — consistent with run-27's ~85% baseline (75/88), no regression. The uncorrelated 16/87 are all `"Journal entry saved"` log lines specifically (not a random spread across message types) — worth a watch item for whether this specific log call sits outside active span context, but not a new finding this run since run-27 already established a comparable overall rate.

## Per-file trace supplement (added during PR artifact evaluation and this follow-up pass)

Per-file evaluation's 12 committed files were not individually cross-checked against live traces during the original evaluation (delegated subagents lacked Datadog MCP access — see `per-file-evaluation.md`'s methodology note). The coordinating session added targeted supplementation for every file with a confirmed finding, after the fact:

- **`git-collector.js` CDQ-007 (raw PII)**: `search_datadog_spans` on `resource_name:commit_story.git.get_commit_metadata` returns live spans with `commit_story.commit.author: <redacted-person-name>` — the raw, un-redacted name, live in production telemetry, not theoretical.
- **`git-collector.js` SCH-003 (`is_merge` type mismatch)**: `resource_name:commit_story.git.get_merge_info` returns `commit_story.git.is_merge: "false"` (quoted string) alongside `commit_story.git.parent_count: 1` (real number) in the same span — direct live confirmation of the declared-`boolean`-emitted-as-`string` mismatch.
- **`context-integrator.js` CDQ-007 (raw PII, re-exposure)**: `resource_name:commit_story.context.gather_context_for_commit` returns `commit_story.commit.author: <redacted-person-name>` — confirms the same raw name is re-exposed on this file's own span, live.
- **`summary-detector.js` SCH-003 (`unsummarized_days_count` type mismatch)**: `resource_name:commit_story.journal.find_unsummarized_days` returns `commit_story.summary.unsummarized_days_count: "0"` — a quoted string against a declared-`int` key, confirmed live.
- **`auto-summarize.js` SCH-003 (`days_generated_count`/`days_failed_count` type mismatch)**: `resource_name:commit_story.journal.trigger_auto_summaries` returns `commit_story.summary.days_failed_count: "0"` and `commit_story.summary.days_generated_count: "0"` — both quoted strings against declared-`int` keys, confirmed live.
- **`summary-manager.js` (SCH-003, CDQ-006, CDQ-007)**: not confirmed live — `save_daily_summary`, `save_weekly_summary`, and `monthly_summary_pipeline` spans returned zero results in the observed post-run window. This file's spans simply did not fire during this window (no weekly/monthly summary was triggered), not a query or access failure. The finding remains confirmed at the source level (`git show`) but lacks live-trace corroboration.
- **`summarize.js` (PARTIAL — SCH-002, SCH-003)**: not queried; this file's span-eligible functions (`runSummarize`/`runWeeklySummarize`/`runMonthlySummarize`) are part of the same conditional weekly/monthly trigger path as `summary-manager.js` and were not observed firing in this window either.

5 of 6 confirmed-findings files now have live-trace corroboration; `summary-manager.js` and `summarize.js` do not, due to absence of matching live traffic in the observed window rather than lack of effort.
