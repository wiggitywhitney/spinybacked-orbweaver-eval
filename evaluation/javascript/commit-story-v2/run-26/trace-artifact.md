service.instance.id: 7ea7292f-b177-4039-bc45-dc747f7a89dd
captured: 2026-07-17T13:37:49.428Z
target: commit-story-v2
instrument_branch: main (organic; target repo on main pre-run per Milestone 4 step 9)
target_commit_sha: 8bea39229d24fc03910e3d9f27c99a65da816cac
query: service:commit-story @service.instance.id:7ea7292f-b177-4039-bc45-dc747f7a89dd

---

## Post-run verification (PRD #144 milestone)

service.instance.id: 79885399-4f70-41f7-8e8b-f29e5ca1bcf6
captured: 2026-07-18 (search_datadog_spans, service:commit-story, from run start 2026-07-17T15:38:27Z)
target: commit-story-v2
instrument_branch: spiny-orb/instrument-1784302707982
verified_via: vcs.ref.head.revision on commit_story.journal.save_journal_entry and commit_story.context.gather_context_for_commit spans matches instrument branch HEAD SHA
target_commit_sha (vcs.ref.head.revision): 0b2c5474c7715e4cfde89caa4768acabd98423c6
note: git.commit.sha on these spans is the journaled commit (domain data), not the instrumented code's own HEAD — do not use it for this check. Use vcs.ref.head.revision instead.
log_trace_correlation: confirmed — of 87 logs sampled on service:commit-story from run start, ~72/87 (~83%) carry non-empty trace_id/span_id; consistent with run-25 baseline (~80%), no regression. The uncorrelated ~17% are all "Journal entry saved" log lines, which are emitted outside an active span.
