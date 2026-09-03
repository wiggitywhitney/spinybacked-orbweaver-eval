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

**Correction (superseded initial finding)**: the check below was first run against `git.commit.sha`, which returned only main's HEAD (`8bea3922...`) and was reported as "not yet observed." That was wrong — `git.commit.sha` is the *journaled* commit (domain data: which commit's diff commit-story summarized), not the running code's own branch identity, exactly as run-26's post-run verification note already documented. Re-running against `vcs.ref.head.revision` (the correct attribute per run-26) found direct instrument-branch evidence.

result: CONFIRMED — `vcs.ref.head.revision:38dd870` matches 2 spans (`commit_story.journal.save_entry`, `commit_story.ai.generate_journal_sections`) at 2026-09-03T12:23:16Z, `service.instance.id: 0cac1bed-f201-466a-b976-41f47c65d3bd`. Broader aggregate by `vcs.ref.head.revision` across all spans since 2026-09-02 confirms every incremental instrument commit from this run has matching spans (`38dd870`, `8317536`, `b219e77`, `e0ca3ee`, `c5839a3`, `9b22db6`, `a2fdaf4`, `ce19b5c`, `5178302`, `39abd79`, `2761d23`, `0521620`, `614455d`) — each is the local commit-story-v2 checkout self-journaling its own incremental `git commit` during and after the eval run, on the instrument branch. `git.commit.sha` on these same spans was still `8bea3922...` (main HEAD) — confirming it reflects the journaled diff's commit, not the branch running the code.
query: `service:commit-story @vcs.ref.head.revision:38dd870` (from 2026-09-02T00:00:00Z)
log_trace_correlation: checked (search_datadog_logs, service:commit-story, from 2026-09-02T00:00:00Z, 227 total logs, 88 sampled) — 75/88 (~85%) carry non-empty trace_id/span_id, consistent with run-26's baseline (~83%, 87-log sample). No regression. Uncorrelated entries are all "Journal entry saved" lines emitted outside an active span, same pattern as run-26.

**Process gap found**: this PRD's milestone text and Decision D-6 both instruct checking `git.commit.sha` to identify the instrument branch — the opposite of what run-26's own post-run verification note already established. Following the PRD's literal instruction produced a false "not yet observed" result here. D-6 needs correcting (or removing) and the milestone text needs to say `vcs.ref.head.revision`, not `git.commit.sha`. Flagged in `lessons-for-prd28.md`.
