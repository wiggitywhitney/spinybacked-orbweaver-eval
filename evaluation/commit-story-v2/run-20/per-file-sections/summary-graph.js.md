### 4. src/generators/summary-graph.js (6 spans, 2 attempts)

Run-20 reproduces the all-PASS run-19 result but took 2 attempts instead of 1. Attempt 1 had an SCH-002 misstep: the agent tried to store the weekly `weekLabel` value under `commit_story.journal.entry_date` (treating it as a semantic duplicate rather than a distinct concept). Attempt 2 correctly declared `commit_story.journal.week_label` in `agent-extensions.yaml` and used it for its intended semantic purpose. The committed code correctly instruments all six exported async functions across the three LangGraph pipelines (daily, weekly, monthly): one node span (`*_summary_node`) and one orchestrator span (`generate_*_summary`) per pipeline. The span naming convention changed from run-19's `commit_story.summary.*` prefix to `commit_story.ai.*`, consistent with journal-graph.js spans.

The three node functions preserve the original two-catch structure: the inner graceful-degradation catch (returns error state without rethrowing) is left untouched per NDS-007, while the outer catch handles unexpected errors with the full `recordException` + `setStatus(ERROR)` + rethrow pattern. The `model.invoke()` and `graph.invoke()` calls are wrapped inside `startActiveSpan` callbacks, satisfying COV-006 parent-context requirements for `@traceloop/instrumentation-langchain` auto-instrumentation.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — all business logic, early-exit paths, and graceful-degradation catches preserved intact; formatting differences are Prettier normalization (reformatted ternaries, trailing comma removal in `Annotation` calls) |
| NDS-004 | PASS — no function signatures altered |
| NDS-005 | PASS — inner graceful-degradation catches in all three node functions preserved untouched inside `startActiveSpan` callbacks; outer catch correctly adds span error handling |
| NDS-006 | PASS — all JSDoc blocks and inline comments preserved |
| API-001 | PASS — `@opentelemetry/api` only (`SpanStatusCode`, `trace`) |
| COV-001 | PASS — all 6 exported async entry-point functions (`generateDailySummary`, `generateWeeklySummary`, `generateMonthlySummary`, `dailySummaryNode`, `weeklySummaryNode`, `monthlySummaryNode`) have spans |
| COV-003 | PASS — all 6 spans have outer catch with `recordException` + `setStatus({code: SpanStatusCode.ERROR})` + rethrow |
| COV-004 | PASS — all 6 exported async functions instrumented; sync helpers (`formatEntriesForSummary`, `formatDailySummariesForWeekly`, `formatWeeklySummariesForMonthly`, `parseSummarySections`, `parseWeeklySummarySections`, `parseMonthlySummarySections`, `cleanDailySummaryOutput`, `cleanWeeklySummaryOutput`, `cleanMonthlySummaryOutput`, `buildGraph`, `buildWeeklyGraph`, `buildMonthlyGraph`, `getGraph`, `getWeeklyGraph`, `getMonthlyGraph`, `getModel`, `resetModel`) correctly skipped per RST-001 |
| COV-005 | PASS — `commit_story.journal.entry_date` + `commit_story.journal.entries_count` (daily spans); `commit_story.journal.week_label` + `commit_story.journal.entries_count` + `gen_ai.operation.name` + `gen_ai.request.temperature` (weekly node); `commit_story.journal.month_label` + `commit_story.journal.entries_count` (monthly spans); entries_count captures meaningful processing-volume state beyond raw parameter echo |
| COV-006 | PASS — `startActiveSpan` callbacks wrap both `getModel().invoke()` (LangChain model calls) and `graph.invoke()` (LangGraph pipeline calls), providing parent context for `@traceloop/instrumentation-langchain` auto-instrumentation |
| RST-001 | PASS — all sync formatting, parsing, cleaning, graph-builder, and graph-getter helpers skipped |
| RST-004 | PASS — one span per exported async function; no redundant detail spans on internal helpers |
| SCH-001 | PASS — all 6 span names (`commit_story.ai.daily_summary_node`, `commit_story.ai.generate_daily_summary`, `commit_story.ai.weekly_summary_node`, `commit_story.ai.generate_weekly_summary`, `commit_story.ai.monthly_summary_node`, `commit_story.ai.generate_monthly_summary`) declared in `agent-extensions.yaml` |
| SCH-002 | PASS — `commit_story.journal.entries_count`, `commit_story.journal.week_label`, `commit_story.journal.month_label` declared in `agent-extensions.yaml`; `commit_story.journal.entry_date`, `gen_ai.operation.name`, `gen_ai.request.temperature` registered in `semconv/attributes.yaml` on main |
| SCH-003 | PASS — `entries_count` from `.length` (int); `entry_date`, `week_label`, `month_label` from string parameters; `gen_ai.request.temperature` = 0.7 (float); `gen_ai.operation.name` = `'chat'` (string) |
| CDQ-001 | PASS — `span.end()` in `finally` block on all 6 spans |
| CDQ-002 | PASS — `startActiveSpan` with async callback pattern throughout; no explicit `SpanKind` set (defaults to INTERNAL) |
| CDQ-003 | PASS — no cross-span attribute mutation |
| CDQ-005 | PASS — all `span.setAttribute` and `span.end()` calls inside `startActiveSpan` callbacks |
| CDQ-007 | ADVISORY — node functions (`dailySummaryNode`, `weeklySummaryNode`, `monthlySummaryNode`) correctly guard `.length` access with `if (x != null)` checks; however, orchestrator functions (`generateDailySummary`, `generateWeeklySummary`, `generateMonthlySummary`) call `entries.length` / `dailySummaries.length` / `weeklySummaries.length` without null guards before `span.setAttribute`; these are required positional parameters so null is a caller bug, but static analysis would flag them |

**Failures**: None.

**Run-20 vs run-19**: 2 attempts vs 1. Attempt 1 incorrectly mapped `weekLabel` to `commit_story.journal.entry_date` (validator SCH-002 rejection). Attempt 2 correctly declared `commit_story.journal.week_label` in `agent-extensions.yaml`. Span naming convention changed from `commit_story.summary.*` (run-19) to `commit_story.ai.*` (run-20), matching the instrument branch's naming pattern established by journal-graph.js spans.
