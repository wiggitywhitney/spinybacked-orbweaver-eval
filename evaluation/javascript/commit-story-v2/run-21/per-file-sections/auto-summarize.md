### 6. managers/auto-summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — `startActiveSpan` with try/finally on span.end() in all 3 functions |
| API-001 | PASS — `trace.getTracer('commit-story')`, SpanStatusCode imported from `@opentelemetry/api` |
| NDS-006 | PASS — outer catch in each function calls `recordException(error)`, `setStatus({ code: SpanStatusCode.ERROR })`, and rethrows |
| NDS-004 | PASS — span.end() in finally block in all 3 functions |
| NDS-005 | PASS — inner for-loop catches preserved unchanged; errors push to result.failed/result.errors without rethrowing (graceful degradation) |
| COV-001 | PASS — 3 exported async trigger functions all have spans |
| COV-003 | PASS — extra context attributes added: `dates_count` on triggerAutoSummaries, `unsummarized_weeks_count` on triggerAutoWeeklySummaries, `unsummarized_months_count` on triggerAutoMonthlySummaries; all registered in agent-extensions.yaml |
| COV-004 | PASS — triggerAutoSummaries, triggerAutoWeeklySummaries, triggerAutoMonthlySummaries all have spans |
| COV-005 | PASS — `generated_count` and `failed_count` set on all 3 spans; triggerAutoSummaries sets them at both the early-return path (daily failures) and the normal-return path (summing daily+weekly+monthly) |
| COV-006 | N/A — no LangChain model calls in this file |
| RST-001 | PASS — getErrorMessage is sync and unexported; correctly excluded from instrumentation |
| RST-004 | PASS — no unnecessary instrumentation of private/sync helpers |
| SCH-001 | PASS — all 3 span names registered in agent-extensions.yaml |
| SCH-002 | PASS — generated_count, failed_count, dates_count, unsummarized_weeks_count, unsummarized_months_count all registered in agent-extensions.yaml |
| SCH-003 | PASS — generated_count = result.generated.length (int), failed_count = result.failed.length (int); both are array.length values, always numeric |
| CDQ-001 | PASS — attribute names follow commit_story.summary.* namespace convention |
| CDQ-002 | PASS — attribute values are correct types (int for counts, matching schema registrations) |
| CDQ-003 | PASS — no PII in attributes; only counts and no user content |
| CDQ-005 | PASS — no string formatting or coercion; raw array.length values used directly |
| CDQ-007 | PASS — `result` is initialized with `generated: [], failed: []` before any loop in all 3 functions; setAttribute calls on result.generated.length and result.failed.length are always safe; in triggerAutoSummaries the early-return path sets attributes before returning, and the normal path sums all three results (all initialized arrays) |

**Failures**: None
