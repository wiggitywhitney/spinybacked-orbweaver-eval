### 27. commands/summarize.js (3 spans, 3 attempts)

**Structure**: Three exported async functions (`runSummarize`, `runWeeklySummarize`, `runMonthlySummarize`) plus six sync utilities (`isValidDate`, `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `showSummarizeHelp`). All three async entry points are instrumented. Agent notes discrepancy with span name namespace (`commit_story.summarize.*` vs committed `commit_story.summary.*`) and mention of `startSpan` vs committed `startActiveSpan` — evaluated against committed code only.

**Schema context**: `commit_story.summary.day_count`, `commit_story.summary.week_count`, and `commit_story.summary.month_count` were registered by summary-manager.js earlier in the run. `commit_story.summary.entry_count` was also registered by summary-manager.js. The span names `run_summarize`, `run_weekly_summarize`, `run_monthly_summarize` are new extensions from this file.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — validator passed on committed output; multi-line return objects in `parseSummarizeArgs` were expanded but represent structural reformatting, not content changes; all original logic preserved |
| NDS-004 | PASS — no function parameter signatures altered |
| NDS-005 | PASS — no original catch blocks removed; inner per-item for-loop catches and the silent `catch { // Doesn't exist, proceed }` block inside `runSummarize` are preserved untouched |
| NDS-006 | PASS — all original comments preserved including the `eslint-disable-line no-console` comment in `showSummarizeHelp` |
| API-001 | PASS — `import { SpanStatusCode, trace } from '@opentelemetry/api'` only; no SDK imports |
| COV-001 | PASS — `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize` (all exported async) each have a span |
| COV-003 | PASS — all three spans have outer catch with `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error` before `finally { span.end() }` |
| COV-004 | PASS — all three exported async functions instrumented; six sync utilities correctly skipped per RST-001 |
| COV-005 | PASS — `runSummarize` sets `commit_story.summary.day_count` (input size); `runWeeklySummarize` sets `commit_story.summary.week_count` (input size); `runMonthlySummarize` sets `commit_story.summary.month_count` (input size) and `commit_story.summary.entry_count` after the loop; each span carries at least one domain attribute |
| RST-001 | PASS — `isValidDate`, `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `showSummarizeHelp` are all synchronous with no I/O; correctly skipped |
| RST-004 | PASS — no unexported async functions exist; exemption not needed |
| SCH-001 | PASS — `commit_story.summary.run_summarize`, `commit_story.summary.run_weekly_summarize`, `commit_story.summary.run_monthly_summarize` registered as schema extensions; `run_*` prefix distinguishes CLI entry points from manager-level operations; no semantic duplicates with existing extensions |
| SCH-002 | PASS — `commit_story.summary.day_count`, `commit_story.summary.week_count`, `commit_story.summary.month_count` registered by summary-manager.js earlier this run; `commit_story.summary.entry_count` registered by summary-manager.js; all attribute keys used have schema backing |
| SCH-003 | PASS — all four attributes are integer counts: `dates.length`, `weeks.length`, `months.length`, `result.generated.length`; all registered as `type: int`; no type mismatches |
| CDQ-001 | PASS — all three spans use `startActiveSpan` callback with `finally { span.end() }` |
| CDQ-002 | SKIP — rule not in evaluated set |
| CDQ-003 | SKIP — rule not in evaluated set |
| CDQ-005 | PASS — all three functions use `tracer.startActiveSpan()`, not `startSpan`; the agent notes describing `startSpan` reflect an earlier attempt |
| CDQ-006 | SKIP — rule not in evaluated set |
| CDQ-007 | PASS — all `setAttribute` calls use `.length` on arrays initialized at function start and guaranteed non-null; no nullable property access |

**Failures**: None
