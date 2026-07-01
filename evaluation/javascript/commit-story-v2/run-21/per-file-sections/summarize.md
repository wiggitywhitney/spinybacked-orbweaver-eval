### 9. commands/summarize.js (3 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — outer catch calls `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, and rethrows in all 3 spans |
| NDS-004 | PASS |
| NDS-005 | PASS — inner for-loop catches preserved in all 3 run* functions; push to result.failed without rethrowing, matching original behavior |
| COV-001 | PASS — runSummarize, runWeeklySummarize, runMonthlySummarize all have spans |
| COV-003 | PASS — single span per function, no nested spans |
| COV-004 | PASS — 3 exported async fns covered; sync helpers correctly excluded (isValidDate, parseSummarizeArgs, expandDateRange, isValidWeekString, isValidMonthString, showSummarizeHelp) |
| COV-005 | PASS — runSummarize: dates_count + force + entries_count; runWeeklySummarize: dates_count (weeks.length) + force + weekly_summaries_count; runMonthlySummarize: dates_count (months.length) + force + entries_count |
| COV-006 | N/A |
| RST-001 | PASS — isValidDate (unexported sync), parseSummarizeArgs (exported sync), expandDateRange (exported sync), isValidWeekString/isValidMonthString (exported sync), showSummarizeHelp (exported sync) are all correctly excluded |
| RST-004 | PASS |
| SCH-001 | PASS — all 3 span names registered: span.commit_story.summary.run_summarize, span.commit_story.summary.run_weekly_summarize, span.commit_story.summary.run_monthly_summarize |
| SCH-002 | PASS — all setAttribute calls use commit_story.summary.* namespace; confirmed by code inspection. Agent notes referencing commit_story.commands.* are documentation inconsistency, not a code defect. |
| SCH-003 | PASS — dates_count int (array.length), force boolean (direct boolean from parseSummarizeArgs), entries_count int (result.generated.length), weekly_summaries_count int (result.generated.length) |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — array.length values are always defined; runSummarize has a defensive `if (dates != null)` guard before dates.length; force is always boolean (initialized to false in parseSummarizeArgs); result.generated.length always defined |

**Failures**: None

**Notes**:
- Agent notes reference `commit_story.commands.*` namespace but the actual instrumented code correctly uses `commit_story.summary.*` throughout; the agent notes are inconsistent documentation, not a code defect.
- `entries_count` is reused in `runMonthlySummarize` to record `result.generated.length` (monthly summaries generated, not journal entries). The naming is semantically imprecise for the monthly context but not a schema violation — it's a pre-registered attribute being reused across functions.
- `runWeeklySummarize` uses `dates_count` for `weeks.length` and `runMonthlySummarize` uses it for `months.length` — the attribute name is generic enough to cover all three input-count uses without schema mismatches.
- `force` attribute is set from the raw destructured `force` value without `!!` coercion, but this is safe: `parseSummarizeArgs` always initializes it as `let force = false` (a boolean), so the value is always boolean when passed through to the run* functions.
