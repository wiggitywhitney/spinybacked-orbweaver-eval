### managers/auto-summarize.js (3 spans, 1 attribute, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original imports restructured to multi-line format in instrumented output; all original business logic lines preserved; validator passed on attempt 2 |
| NDS-004 | PASS — triggerAutoMonthlySummaries parameter signature reflowed to multi-line (`basePath = '.',` on own line); semantically identical to original |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — inner for-loop catches in all three functions push to result.failed and continue without rethrowing (graceful-degradation per Pattern B); no recordException in inner catches; outer span wrappers have error-recording catches for unexpected exceptions |
| COV-001 | PASS — triggerAutoSummaries, triggerAutoWeeklySummaries, triggerAutoMonthlySummaries (all exported async) have spans |
| COV-002 | N/A — no outbound HTTP/DB calls |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | ADVISORY — three new span names (trigger_auto_summaries/weekly/monthly) are semantically similar to registered run_summarize/weekly/monthly; intentionally retained per agent notes: auto-trigger orchestrators (cascade across all unsummarized periods) are a distinct operation class from command entry points (process explicit user request for one period) |
| SCH-002 | PASS — commit_story.journal.weeks_count is a new schema extension correctly declared in agent-extensions.yaml; all other attributes used (dates_count, daily_summaries_count, weekly_summaries_count, months_count, monthly_summaries_generated_count, monthly_summaries_failed_count) were already registered by earlier files in the run |
| SCH-003 | PASS — all count attributes are int; no type mismatches |
| CDQ-001 | PASS — all three spans closed in startActiveSpan try/finally |
| CDQ-005 | PASS |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` used |
| COV-004 | PASS — all 3 exported async functions have spans; getErrorMessage (unexported sync helper) correctly skipped per RST-001/RST-004 |
| COV-005 | PASS — dates_count (unsummarized days found), daily_summaries_count (generated), weeks_count (unsummarized weeks found), weekly_summaries_count (generated), months_count (unsummarized months found), monthly_summaries_generated_count, monthly_summaries_failed_count all set; meaningful operational metrics covering the trigger pipeline |
| RST-001 | PASS — getErrorMessage (sync, no I/O) correctly skipped |
| RST-004 | PASS |
| CDQ-007 | PASS — all three unsummarized* array .length accesses guarded with `if (x != null)` before setAttribute; result.generated.length and result.failed.length are from guaranteed arrays (initialized as [] at function start), no nullable access |

**Failures**: None

**SCH-002 note**: The agent report summary line "1 attribute" refers to `commit_story.journal.weeks_count` as the sole new attribute extension invented for this file. The schema already contained `commit_story.journal.dates_count` and `commit_story.journal.months_count` (registered by summary-detector.js earlier in the run), and `daily_summaries_count`, `weekly_summaries_count`, `monthly_summaries_generated_count`, `monthly_summaries_failed_count` (registered by summary-manager.js). The new `weeks_count` correctly fills the gap in the days/weeks/months symmetric naming pattern.
