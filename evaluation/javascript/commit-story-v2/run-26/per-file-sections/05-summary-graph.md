### 5. generators/summary-graph.js (6 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — try/catch/finally structure preserved in all three graph nodes; inner LLM-call try/catch still returns fallback text + accumulates `errors[]` |
| API-001 | PASS — `trace`/`SpanStatusCode` imported from `@opentelemetry/api`; `tracer.startActiveSpan` used throughout |
| NDS-006 | PASS |
| NDS-004 | PASS — business logic (parsing, formatting, banned-word cleanup) unchanged |
| NDS-007 | PASS — no control-flow removal; outer catch still calls `span.recordException` + `setStatus(ERROR)` before rethrow |
| COV-001 | PASS — all 6 entry points (3 LangGraph nodes + 3 `generate*` orchestrators) have spans |
| COV-003 | PASS — no duplicate/nested spans per function |
| COV-004 | PASS — all async functions instrumented; sync `format*`/`clean*` helpers correctly left span-free |
| COV-005 | PASS — every span carries ≥1 domain attribute (`entries_count`, `entry_date`, `section_type`, `week_label`, `month_label`, `gen_ai.request.temperature`); attribute set is consistent with the run-12 baseline for this file, no coverage delta observed |
| COV-006 | PASS — manual node spans (`commit_story.ai.generate_*_summary`) wrap application logic sitting above the auto-instrumented `ChatAnthropic.invoke()` call, same pattern as journal-graph.js |
| RST-001 | PASS — `formatEntriesForSummary`, `cleanDailySummaryOutput`, and equivalent weekly/monthly helpers are sync-only and correctly instrumented with 0 spans |
| RST-004 | PASS — all instrumented functions are exported; no unexported-helper span gaps |
| SCH-001 | PASS — all custom attributes namespaced under `commit_story.*` |
| SCH-002 | PASS — validation journey shows 3 blocking SCH-002 errors on attempts 1–2, resolved by the final committed attempt; final attribute keys (`commit_story.journal.entries_count`, `commit_story.journal.week_label`, `commit_story.journal.month_label`, `commit_story.ai.section_type`) match the registry |
| SCH-003 | PASS — `entries_count` is int, `week_label`/`month_label`/`entry_date` are strings, `gen_ai.request.temperature` is float |
| CDQ-001 | PASS — single `span.end()` per span via `finally`, no redundant calls |
| CDQ-002 | PASS — standard `recordException` + `setStatus({code: ERROR})` pattern in every outer catch |
| CDQ-003 | PASS — `trace.getTracer('commit-story')` used consistently |
| CDQ-005 | PASS — `logger.info` used for all logging; no stray `console.log` |
| CDQ-007 | PASS — advisory findings at lines 556/730/814 claiming a PII attribute name or raw filesystem path are false positives; the actual attributes at those lines are `commit_story.journal.entries_count` (numeric) and `commit_story.journal.week_label`/`month_label` (strings), none of which are PII or paths |

**Failures**: None. CDQ-007 advisory is a false positive (mislabeled numeric/string attributes as PII/path risks); SCH-002 required 2+ correction attempts before resolving, consistent with the file's "2 attempts" outcome.

**Datadog trace supplement**: Live trace data confirms three spans in this file (of 6 total) — `commit_story.journal.generate_daily_summary`, `commit_story.ai.generate_daily_summary`, and `commit_story.journal.save_daily_summary` all appear in a real trace (trace_id `3722a802e3cf1bc1c0bc5428509d2ce7`) with populated `entries_count`/`entry_date`/`section_type` attributes, corroborating COV-001 and COV-005 for the spans matched; the remaining 3 spans in this file were not observed in this trace.
