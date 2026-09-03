service.instance.id: 648eef31-41e1-4cf4-8c87-7202f987301b
captured: 2026-09-02T14:22:08.780Z
target: commit-story-v2
instrument_branch: main (organic; target repo on main pre-run per pre-run verification step 8)
target_commit_sha: 8bea39229d24fc03910e3d9f27c99a65da816cac
query: service:commit-story @service.instance.id:648eef31-41e1-4cf4-8c87-7202f987301b

## Post-run verification (PRD #153 milestone)

checked: 2026-09-03 (search_datadog_spans, service:commit-story, from 2026-09-02T00:00:00Z)
instrument_branch: spiny-orb/instrument-1788361335787
instrument_branch_head_sha: 38dd87025930e4d51aee104a4bb3b147acbd46a7
result: NOT YET OBSERVED — all spans since 2026-09-02 (654 total, sampled 20 most recent) carry `git.commit.sha: 8bea39229d24fc03910e3d9f27c99a65da816cac`, which matches main's current HEAD (confirmed in pre-run verification step 15), not the instrument branch's HEAD. Deferred per milestone step 2 — this is ordinary main-branch dogfooding traffic, not instrument-branch evidence.
log_trace_correlation: checked (search_datadog_logs, service:commit-story, from 2026-09-02T00:00:00Z, 227 total logs, 88 sampled) — 75/88 (~85%) carry non-empty trace_id/span_id, consistent with run-26's baseline (~83%, 87-log sample). No regression. Uncorrelated entries are all "Journal entry saved" lines emitted outside an active span, same pattern as run-26.
