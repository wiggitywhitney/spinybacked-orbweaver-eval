### generators/summary-graph.js (6 spans, 1 attempt)

> Down from 2 attempts in run-23.

**Spans**: `commit_story.journal.daily_summary_node`, `commit_story.journal.generate_daily_summary`, `commit_story.journal.weekly_summary_node`, `commit_story.journal.generate_weekly_summary`, `commit_story.journal.monthly_summary_node`, `commit_story.journal.generate_monthly_summary`

**New attribute declarations**: `commit_story.journal.entries_count` (int), `commit_story.journal.week_label` (string), `commit_story.journal.month_label` (string), `commit_story.journal.summaries_count` (int)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No `isRecording()` guards around `setAttribute`; all attributes set unconditionally |
| API-001 | PASS | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | PASS | Outer span-level catch in each of the 6 span wrappers calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used across all 6 spans |
| NDS-007 | PASS | Inner graceful-degradation catches in `dailySummaryNode`, `weeklySummaryNode`, `monthlySummaryNode` return fallback state objects (e.g., `{ narrative: '[Daily summary generation failed]', errors: [...] }`) without rethrowing; correctly left unmodified per NDS-007 |
| COV-001 | PASS | `generateDailySummary`, `generateWeeklySummary`, `generateMonthlySummary` are the exported async entry points; each has a span |
| COV-003 | PASS | All 6 outer catch blocks call `recordException` + `setStatus(ERROR)` before rethrowing |
| COV-004 | PASS | All 6 exported async functions instrumented; sync helpers (`getModel`, `resetModel`, all `format*`/`parse*`/`clean*`/`build*`/`get*Graph` functions) correctly skipped under RST-001/RST-004 |
| COV-005 | PASS | Daily spans: `commit_story.journal.entry_date` and `commit_story.journal.entries_count`; weekly spans: `commit_story.journal.week_label` and `commit_story.journal.summaries_count`; monthly spans: `commit_story.journal.month_label` and `commit_story.journal.summaries_count` |
| COV-006 | PASS | Manual spans on application-level node functions and their orchestrators wrap `graph.invoke()` / `model.invoke()` calls that LangChain auto-instrumentation covers internally; context propagation preserved |
| RST-001 | PASS | All synchronous helpers correctly skipped |
| RST-004 | PASS | Unexported internal functions correctly excluded; all 6 instrumented functions are exported |
| SCH-001 | PASS | All 6 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS | All 4 new attribute keys registered in `semconv/agent-extensions.yaml`; `commit_story.journal.entry_date` already in `attributes.yaml` and correctly reused without duplication |
| SCH-003 | PASS | `entries_count` declared `type: int`, set from `state.entries.length` (integer); `summaries_count` declared `type: int`, set from `.length` of daily/weekly summaries arrays (integers); `week_label` declared `type: string`, set from `state.weekLabel ?? ''`; `month_label` declared `type: string`, set from `state.monthLabel ?? ''` — all 4 declarations match runtime value types |
| CDQ-001 | PASS | All 6 spans use `finally { span.end() }` inside async `startActiveSpan` callbacks per issue #915 pattern; no redundant `span.end()` in try blocks |
| CDQ-002 | PASS | No unnecessary nested spans |
| CDQ-003 | PASS | No PII; attributes are date labels, integer counts |
| CDQ-005 | PASS | No empty catch blocks; outer catches rethrow after recording; inner graceful-degradation catches return fallback values with error messages |
| CDQ-007 | PASS | `entries_count` and `summaries_count` guarded with `!= null` check before `.length` access; `entry_date`, `week_label`, `month_label` use null-coalescing (`?? ''`) before `setAttribute` |

**Failures**: None. 1 attempt (down from 2 in run-23).

**COV-005 input-attribute placement**: All input attributes set unconditionally at span open before early-return guards that check `entries.length === 0` or `dailySummaries.length === 0`. Early-exit path carries full span metadata — correct per COV-005.

**NDS-007 two-tier catch structure preserved**: Three separate graceful-degradation inner catches — one per node — each return a fallback state object without rethrowing. Outer span-level catch in the same function handles unexpected errors with `recordException` + rethrow. Structure preserved exactly as it appeared in the uninstrumented source.

**SCH-002 reuse**: The 4 new attributes registered in `agent-extensions.yaml` are net-new to run-24. `commit_story.journal.entry_date` already existed in `attributes.yaml` and was correctly reused without duplication.

**Trace supplement**: No summary-graph spans in the captured run — the organic post-commit hook fires the journal-entry pipeline, not the summarize pipeline. Summary spans only appear when `commit-story summarize` is explicitly invoked. Evaluation is static-analysis-only for this file.
