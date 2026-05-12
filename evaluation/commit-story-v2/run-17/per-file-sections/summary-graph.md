### generators/summary-graph.js (6 spans, 4 attributes, 2 attempts)

**Structure**: Three parallel LangGraph pipelines (daily / weekly / monthly), each with two instrumented entry points: a LangGraph node function (`dailySummaryNode`, `weeklySummaryNode`, `monthlySummaryNode`) and a public API function that invokes the compiled graph (`generateDailySummary`, `generateWeeklySummary`, `generateMonthlySummary`). Six exported async functions total, all instrumented. Twelve sync helpers and formatters correctly skipped.

**Context on attempt 2**: Attempt 1 produced 47 blocking failures — 42 NDS-003 and 5 SCH-002. The NDS-003 failures were the same root cause as journal-graph's 49 failures this run: the agent collapsed multi-line BANNED_WORD_REPLACEMENTS entries and parseMonthlySummarySections onto fewer lines. Unlike journal-graph, summary-graph recovered on attempt 2 by restoring the original multi-line formatting. Attempt 2 left 3 NDS-003 errors that were resolved by the function-level fallback (attempt 3 per the instrumentation report, counted as "2 attempts" in the run output).

| Rule | Result |
|------|--------|
| NDS-003 | PASS — BANNED_WORD_REPLACEMENTS multi-line format and parseMonthlySummarySections multi-line guard restored on attempt 2; committed file preserves original line structure |
| NDS-004 | PASS — no multi-line parameter signatures modified |
| NDS-005 | PASS — all try/catch blocks preserved; inner graceful-degradation catches in each *Node function intact |
| NDS-006 | PASS — no imports removed or reordered |
| NDS-007 | PASS — inner catches in dailySummaryNode, weeklySummaryNode, monthlySummaryNode are all all-encompassing graceful-degradation (catch all, return fallback, no rethrow); no recordException added to inner catches; outer span-level catches handle unexpected exceptions and correctly call span.recordException + setStatus(ERROR) + throw |
| COV-001 | PASS — all 6 exported async functions have spans: dailySummaryNode, generateDailySummary, weeklySummaryNode, generateWeeklySummary, monthlySummaryNode, generateMonthlySummary |
| COV-002 | N/A — no outbound HTTP or database calls |
| COV-004 | PASS — 6 exported async entry points instrumented; getModel and resetModel are exported but synchronous (RST-001 applies); formatEntriesForSummary, formatDailySummariesForWeekly, formatWeeklySummariesForMonthly, cleanDailySummaryOutput, cleanWeeklySummaryOutput, cleanMonthlySummaryOutput are exported sync helpers (RST-001 applies) |
| COV-005 | PASS — meaningful attributes captured on each span: section type, temperature, entry counts, date labels |
| COV-006 | PASS — all three *Node functions call getModel().invoke() which is auto-instrumented by LangChain; manual startActiveSpan wrappers are placed at the node function boundary above the auto-instrumented model invocation; no double-instrumentation of the model call itself |
| API-001 | PASS — trace.getTracer and SpanStatusCode imported from @opentelemetry/api; no SDK imports |
| API-004 | PASS — no SDK-internal imports in src/ |
| RST-001 | PASS — all sync functions (parseSummarySections, parseWeeklySummarySections, parseMonthlySummarySections, buildGraph, getGraph, buildWeeklyGraph, getWeeklyGraph, buildMonthlyGraph, getMonthlyGraph, all format/clean helpers) correctly receive 0 spans |
| RST-004 | PASS — no unexported async functions in this file; all unexported functions are synchronous |
| SCH-001 | PASS — 6 span names declared as schema extensions; agent note correctly distinguishes *_node spans (LangGraph node execution, wrapping the model.invoke() call) from generate_* spans (public API entry point invoking the full compiled graph pipeline) |
| SCH-002 | **FAIL** — two registered attribute keys are semantically misused: (1) `commit_story.context.messages_count` is defined as "Total number of messages collected from sessions" but is set to `entries.length` in `dailySummaryNode` — entries are journal entries, not session messages; (2) `commit_story.journal.quotes_count` is defined as "Number of developer quotes extracted for the entry" but is set to `entries.length` in `generateDailySummary` — again journal entries, not developer quotes. Both reuse registered keys whose defined semantics do not match the values being recorded. The 4 schema extension attributes (`daily_summaries_count`, `week_label`, `weekly_summaries_count`, `month_label`) are correctly declared as new extensions. |
| SCH-003 | PASS — entries.length and dailySummaries.length are int; week_label and month_label are strings; entry_date set as string via String(date) coercion |
| CDQ-001 | PASS — all spans closed via startActiveSpan callback pattern with finally { span.end() } |
| CDQ-005 | PASS — no hardcoded process/environment values; attribute values derived from function arguments |
| CDQ-011 | PASS — all spans use trace.getTracer('commit-story') via the module-level tracer constant |
| CDQ-007 | PASS — null guards present before .length calls on potentially-null arrays (dailySummaries != null, weeklySummaries != null, entries != null); generateDailySummary and generateWeeklySummary access .length unconditionally but both receive arrays by JSDoc contract (string[] and Array<{...}>) |

**Failures**: SCH-002 — `commit_story.context.messages_count` used for journal entries count in dailySummaryNode (schema definition: session messages count); `commit_story.journal.quotes_count` used for entries array length in generateDailySummary (schema definition: developer quotes extracted). Both keys have registered definitions that do not match the values recorded.

**Notes**:
- The NDS-003 multi-line collapse issue is the same root cause that caused journal-graph to fail this run with 49 violations. summary-graph recovered where journal-graph did not because the subsequent context window successfully diagnosed and fixed the formatting on attempt 2.
- COV-006 handling is correct: the *Node span wrappers sit at the LangGraph node boundary, wrapping the entire node function body including the inner try that calls model.invoke(). The auto-instrumented LangChain layer creates child spans beneath the node span.
- The SCH-002 reuse of context.messages_count and journal.quotes_count appears to be the agent avoiding new schema extensions by reaching for the closest-sounding registered key. The fix is two new schema extension attributes: `commit_story.journal.entries_count` (int, count of journal entries being summarized) for both daily uses, keeping the weekly/monthly counts as the correctly-declared extensions already in place.
