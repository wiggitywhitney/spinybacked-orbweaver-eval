### 11. src/managers/auto-summarize.js (3 spans, 1 attempt)

All three exported async functions — `triggerAutoSummaries`, `triggerAutoWeeklySummaries`, and `triggerAutoMonthlySummaries` — received spans in a single attempt, resolving the COV-001 PARTIAL from run-19 where `triggerAutoSummaries` was skipped after three attempts due to an NDS-003 failure on the spread-array return expression. The instrumentation is structurally sound across all three spans: each uses `startActiveSpan` with an outer try/catch/finally, inner per-item graceful-degradation catches left unmodified per NDS-007, and `generated_count` set on both return paths of `triggerAutoSummaries`. `getErrorMessage` (unexported, sync) was correctly skipped.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no non-instrumentation diffs; original logic, comments, and multi-line spread-array return structure preserved exactly inside the `startActiveSpan` callbacks |
| NDS-004 | PASS — all three function signatures (parameters, defaults, export status) unchanged |
| NDS-005 | PASS — inner per-item for-loop catches accumulate to `result.failed`/`result.errors` without rethrowing; all three are graceful-degradation catches preserved exactly per NDS-007 |
| NDS-006 | PASS — all JSDoc blocks and inline comments (including the "prevents locking in incomplete weekly/monthly via duplicate detection" and "Skip higher-cadence rollups" comments) preserved |
| API-001 | PASS — `@opentelemetry/api` only (`trace`, `SpanStatusCode`) |
| COV-001 | PASS — all three exported async entry points have spans: `trigger_daily`, `trigger_weekly`, `trigger_monthly` |
| COV-003 | PASS — all three spans have outer catch with `recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + rethrow, with `span.end()` in finally |
| COV-004 | PASS — all three exported async functions instrumented; `getErrorMessage` (unexported, sync, no I/O) correctly excluded per RST-001 and RST-004 |
| COV-005 | PASS — `triggerAutoSummaries`: `dates_count` (queue depth at entry), `generated_count` (combined daily+weekly+monthly outcome, set on both return paths); `triggerAutoWeeklySummaries`: `weeks_count` at entry, `generated_count` at exit; `triggerAutoMonthlySummaries`: `months_count` at entry, `generated_count` at exit |
| RST-001 | PASS — `getErrorMessage` (unexported, synchronous helper) correctly skipped |
| RST-004 | PASS — `getErrorMessage` execution path covered by all three parent spans |
| SCH-001 | PASS — all three span names (`commit_story.auto_summarize.trigger_daily`, `commit_story.auto_summarize.trigger_weekly`, `commit_story.auto_summarize.trigger_monthly`) registered in `agent-extensions.yaml` on the instrument branch |
| SCH-002 | PASS — all attributes registered in `agent-extensions.yaml`: `commit_story.summary.dates_count` (int), `commit_story.summary.weeks_count` (int), `commit_story.summary.months_count` (int), `commit_story.summary.generated_count` (int) |
| SCH-003 | PASS — all counts sourced from `.length` on locally initialized arrays (int); `generated_count` on the combined path sums three integer `.length` values; no type coercion ambiguity |
| CDQ-001 | PASS — `span.end()` in `finally` block on all three spans |
| CDQ-007 | PASS — all `setAttribute` calls use `.length` on arrays initialized in function scope; no nullable or optional field access |

**Failures**: None.
