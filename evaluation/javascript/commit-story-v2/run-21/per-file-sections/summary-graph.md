### 4. generators/summary-graph.js (6 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — early exits (`!entries || entries.length === 0`, etc.) are preserved inside the outer span, so early-return paths are still traced |
| NDS-004 | PASS |
| NDS-005 | PASS — all three original inner try/catch blocks (daily/weekly/monthly) are preserved verbatim; they return fallback values and do not rethrow, matching the original graceful-degradation pattern |
| COV-001 | PASS — all three exported async orchestrator functions (`generateDailySummary`, `generateWeeklySummary`, `generateMonthlySummary`) are wrapped in spans |
| COV-003 | PASS — every span has an outer catch with `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error` |
| COV-004 | PASS — node functions (`dailySummaryNode`, `weeklySummaryNode`, `monthlySummaryNode`) are also instrumented, covering all meaningful async entry points |
| COV-005 | PASS — each span carries at least 1 domain attribute: daily spans have `entry_date` + `entries_count`; weekly spans have `week_label` + `entries_count` (reused for daily-summaries count); monthly spans have `month_label` + `weekly_summaries_count` |
| COV-006 | PASS — `getModel(0.7).invoke(...)` calls in each node function execute inside an active `startActiveSpan` callback, making the manual span the parent of auto-instrumented LangChain spans; orchestrator spans nest above node spans which nest above LangChain spans |
| RST-001 | PASS — all six spans call `span.end()` in a `finally` block |
| RST-004 | PASS — pattern is `return tracer.startActiveSpan('name', async (span) => {...})`, not `await tracer.startActiveSpan`; the promise from the async callback is returned directly |
| SCH-001 | PASS — all 6 span names registered: `commit_story.journal.daily_summary_node`, `generate_daily_summary`, `weekly_summary_node`, `generate_weekly_summary`, `monthly_summary_node`, `generate_monthly_summary` |
| SCH-002 | PASS — all 4 new attributes registered in agent-extensions.yaml: `commit_story.summary.entries_count`, `week_label`, `weekly_summaries_count`, `month_label` |
| SCH-003 | PASS — `entries_count` set from `.length` (JS integer); `week_label` set from `weekLabel` string param (e.g. "2026-W09"); `weekly_summaries_count` set from `.length` (JS integer); `month_label` set from `monthLabel` string param (e.g. "2026-02") |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS with observation — array inputs (`entries`, `dailySummaries`, `weeklySummaries`) are null-guarded before `.length` is read; string inputs (`weekLabel`, `monthLabel`) have no guard, but they are positional args always provided by callers and the OTel SDK coerces undefined to string "undefined" without throwing; this is an acceptable tradeoff given these params are structurally required |

**Failures**: None

**Notable design decisions**:
- `entries_count` is intentionally reused across daily and weekly node/orchestrator spans: on daily spans it counts journal entries; on weekly spans it counts daily summaries. The agent removed `daily_summaries_count` and `monthly_summaries_count` as duplicates, keeping the schema lean. This reuse is semantically coherent because in both cases the attribute answers "how many inputs did this summary generation receive."
- The six-span structure correctly captures both the LangGraph node layer (where LLM calls happen) and the public API layer (orchestrator functions), giving visibility at both the graph-internal and caller-facing levels.
