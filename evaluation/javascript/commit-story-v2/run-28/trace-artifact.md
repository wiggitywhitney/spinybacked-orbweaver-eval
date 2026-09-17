// ABOUTME: Trace evidence for run-28 — post-run Datadog verification only (pre-run capture skipped, see D-14).
# Run-28 Trace Artifact

**Note**: Unlike prior runs, this artifact has **no pre-run section**. Per PRD #156's D-14, the instrument run executed before the PRD's own pre-run verification milestone (which normally captures `pre_run_service.instance.id`) had been performed. That capture cannot be done retroactively — main-branch dogfooding traffic from before the run was not recorded at the time.

## Post-run verification

**post_run_service.instance.id**: `ab1620ee-ef3e-4d7f-813b-6ae7894744ff`

**query (post-run instance, instrument-branch evidence)**: `service:commit-story` from `2026-09-17T12:28:52Z` (eval run start) to `2026-09-17T13:45:27Z` (verification query time)

**Confirmation**: `vcs.ref.head.revision: c87b774` on multiple spans (e.g. `commit_story.journal.save_entry`, `commit_story.journal.generate_sections`, `commit_story.journal.dialogue_node`, `commit_story.journal.summary_node`, `commit_story.journal.technical_node`) matches the instrument branch `spiny-orb/instrument-1789648132789`'s HEAD SHA (`c87b7749c5a17a0b5f8c88d26d51d2cb37e331e1`, short `c87b774`) — confirmed via `git -C ~/Documents/Repositories/commit-story-v2 rev-parse spiny-orb/instrument-1789648132789`. Direct evidence the local commit-story-v2 checkout, on the instrument branch, self-journaled its own commits during and after the eval run (per D-10 — `vcs.ref.head.revision`, not `git.commit.sha`, identifies the running code's own branch).

**Log-trace correlation check** (commit-story-v2 pino bridge): Sampled 87 of 170 logs from `service:commit-story` in the same window. 71/87 (~82%) carry non-empty `trace_id`/`span_id` — consistent with run-27's ~85% baseline (75/88), no regression. The uncorrelated 16/87 are all `"Journal entry saved"` log lines specifically (not a random spread across message types) — worth a watch item for whether this specific log call sits outside active span context, but not a new finding this run since run-27 already established a comparable overall rate.
