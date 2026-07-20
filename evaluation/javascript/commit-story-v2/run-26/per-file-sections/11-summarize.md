### 11. src/commands/summarize.js (3 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — inner per-item catch blocks (loop failures, empty catch around `access(summaryPath)`) correctly left unmodified as expected-condition/graceful-degradation catches |
| COV-001 | PASS — `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize` all wrapped as entry-point spans |
| COV-003 | PASS — outer try/catch/finally on each span calls `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS |
| COV-005 | PASS — `dates_count`, `force`, `failed_count` set on each span; real domain attributes, not placeholder |
| RST-001 | PASS — `isValidDate`, `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `showSummarizeHelp` correctly skipped as synchronous utilities |
| RST-004 | PASS |
| SCH-001 | ADVISORY — validator flagged `run_weekly_summarize`/`run_monthly_summarize` as potential duplicates of `run_summarize`; agent explicitly overrode, reasoning they are distinct operation classes (daily/weekly/monthly) warranting separate span names — reasonable, non-blocking |
| SCH-002 | UNRESOLVED SCHEMA ISSUE — validator's rule check passes (attempt 1 had 8 blocking SCH-002 errors flagging `weeks_count`/`months_count`/`generated_count` as semantic duplicates of `dates_count`; attempt 2 satisfied the rule by reusing `dates_count` for all three counters and dropping `generated_count`), but the result is a data-contract defect: `commit_story.summarize.dates_count` now represents three different units (day count, week count, month count) depending on which span it appears on — see below |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None per the validator's own rule check, but flagging as an unresolved schema/data-contract issue: the validator's semantic-duplicate ruling forced `weeks_count` and `months_count` to collapse into the (misleadingly named) `dates_count` attribute, and eliminated `generated_count` outright — reducing output-metric granularity to satisfy SCH-002, at the cost of attribute clarity. A consumer reading `commit_story.summarize.dates_count` cannot tell, without also reading the span name, whether the value represents a day count, week count, or month count. This is a SCH-002 rule-passing result that masks a real data-contract regression and should not be reported as a clean pass.

**Datadog trace supplement**: Queried `service:commit-story @service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6` and found 26 spans, but none matched this file's span names (`commit_story.commands.run_summarize`, `run_weekly_summarize`, `run_monthly_summarize`). The returned spans belong to the neighboring `auto-summarize.js` manager layer (`commit_story.managers.trigger_auto_summaries/weekly/monthly`) and journal operations, and nearly all carry `git.commit.sha: 8bea39229d24fc03910e3d9f27c99a65da816cac` — confirmed per the run's reference SHA to be unrelated main-branch dogfooding traffic, not run-26 instrument-branch data (only one unrelated span in the batch carried `vcs.ref.head.revision: 0b2c5474c7715e4cfde89caa4768acabd98423c6`, run-26's tip, but it was for `save_journal_entry`, not this file). No run-26 trace evidence exists for `src/commands/summarize.js` specifically.
