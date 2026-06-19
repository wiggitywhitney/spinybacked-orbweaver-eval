### commands/auto-summarize.js (3 spans, 1 attempt)

**Spans**: `commit_story.summaries.trigger_auto_summaries`, `commit_story.summaries.trigger_auto_weekly_summaries`, `commit_story.summaries.trigger_auto_monthly_summaries`

**New attribute declarations**: 0 (reuses `commit_story.summaries.unsummarized_*_count` declared in `summary-detector.js`)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No `isRecording()` guards around `setAttribute`; count attributes set unconditionally after detection step |
| API-001 | PASS | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | PASS | All 3 outer span catch blocks call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | N/A | No graceful-degradation catch blocks in original source |
| COV-001 | PASS | `triggerAutoSummaries`, `triggerAutoWeeklySummaries`, `triggerAutoMonthlySummaries` are the exported async entry points; each has a span |
| COV-003 | PASS | All 3 outer catch blocks record exception and set ERROR status before rethrowing |
| COV-004 | PASS | All 3 exported async functions instrumented; `runAutoSummarize` (synchronous Yargs setup function that returns the Yargs instance) correctly skipped per RST-001 |
| COV-005 | PASS | All 3 spans set `commit_story.summaries.summaries_count` — the count of summaries generated during that auto-summarize invocation; attribute set on all exit paths including early-return (zero-count) path |
| RST-001 | PASS | `runAutoSummarize` (synchronous) correctly skipped |
| RST-004 | PASS | Only the 3 exported async functions are instrumented |
| SCH-001 | PASS | All 3 span names registered in `semconv/agent-extensions.yaml`; `run_*` prefix avoided to prevent collision with `summarize.js` spans |
| SCH-002 | PASS | `commit_story.summaries.summaries_count` reused from `summary-graph.js` declaration where it was registered; no duplicate registration; `unsummarized_*_count` attributes also reused from `summary-detector.js` where registered |
| SCH-003 | PASS | `summaries_count` declared `type: int`, set from integer count of generated summaries — type match correct |
| CDQ-001 | PASS | All 3 spans use `finally { span.end() }` inside async `startActiveSpan` callbacks; no redundant `span.end()` in try blocks |
| CDQ-002 | PASS | No unnecessary nested spans |
| CDQ-003 | PASS | No PII; attributes are integer counts of operations performed |
| CDQ-005 | PASS | No empty catch blocks |
| CDQ-007 | PASS | `summaries_count` initialized to `0` and incremented by loop — always an integer, never undefined |

**Failures**: None

**Span naming note**: `trigger_auto_*` naming avoids collision with `run_*_summaries` span names used in `summarize.js`. The naming distinction is accurate: `summarize.js` explicitly runs specified summaries; `auto-summarize.js` detects and triggers the ones that are missing. Different verbs reflecting genuinely different semantics.

**COV-005 early-exit behavior**: All 3 `trigger_auto_*` spans set `summaries_count` before returning, including the early-return case where the detector finds 0 unsummarized periods. The attribute carries `0` in that case — explicitly informative (the auto-summarize ran and found nothing to do), not a missing value.

**Trace supplement**: All 3 spans confirmed in Datadog (2026-06-18T20:25:31Z):
- `commit_story.summaries.trigger_auto_summaries`: `summaries_count: 0`
- `commit_story.summaries.trigger_auto_weekly_summaries`: `summaries_count: 0`
- `commit_story.summaries.trigger_auto_monthly_summaries`: `summaries_count: 0`
(Clean journal state — no unsummarized periods at capture time.) All 3 spans show status Unset. COV-005 confirmed at runtime: `summaries_count: 0` is set on the early-return path (no summaries needed), confirming the attribute is set on all exit paths as required.
