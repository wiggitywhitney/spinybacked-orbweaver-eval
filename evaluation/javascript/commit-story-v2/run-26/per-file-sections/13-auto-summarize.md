### 13. src/managers/auto-summarize.js (3 spans, 1 attempt)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | ADVISORY |

**Failures**: None

**Datadog trace supplement**: Found live spans for `commit_story.managers.trigger_auto_summaries`, `trigger_auto_weekly_summaries`, and `trigger_auto_monthly_summaries` under `service:commit-story @service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6`, carrying the expected attributes (`commit_story.journal.base_path`, `commit_story.summarize.dates_count`, `commit_story.summarize.failed_count`, `commit_story.journal.unsummarized_weeks_count`, `commit_story.journal.unsummarized_months_count`). However, `git.commit.sha` on these spans is `8bea39229d24fc03910e3d9f27c99a65da816cac`, which per the run's known-commit mapping is unrelated main-branch dogfooding traffic, not run-26's instrument branch tip (`0b2c5474c7715e4cfde89caa4768acabd98423c6`). No trace evidence specific to this run's instrumented code was found; the code review above is based solely on the static source and log/report analysis.
