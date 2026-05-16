### 29. managers/auto-summarize.js (3 spans, 2 attempts)

**Structure**: Three exported async functions (`triggerAutoSummaries`, `triggerAutoWeeklySummaries`, `triggerAutoMonthlySummaries`) plus one unexported synchronous helper (`getErrorMessage`). All three async entry points are instrumented. Agent notes confirm original multi-line import statements and multi-line return object in `triggerAutoSummaries` were preserved, and `triggerAutoMonthlySummaries` multi-line signature was preserved.

**Schema context**: `commit_story.summary.day_count`, `commit_story.summary.week_count`, and `commit_story.summary.month_count` were all registered by summary-manager.js earlier in the run. Three span names are new extensions from this file. Agent added `!= null` guards on all three count attributes citing CDQ-007 advisory for externally-sourced return values from `findUnsummarized*` functions.

**NDS-003 on attempt 2**: Attempt 1 produced NDS-003 failures (multi-line import or return object collapse); attempt 2 corrected. Committed output is validator-clean.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — committed code passed validator on attempt 2; multi-line imports and multi-line return object in `triggerAutoSummaries` restored to original form |
| NDS-004 | PASS — `triggerAutoMonthlySummaries` parameter signature reflowed to multi-line (`basePath = '.',` on own line) matching original; semantically identical |
| NDS-005 | PASS — inner for-loop catches preserved untouched; they accumulate into result.failed and continue without rethrowing (graceful-degradation) |
| NDS-006 | PASS — all original comments preserved including the inline `—` comment on the daily-failure early-return guard |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` only; no SDK imports |
| COV-001 | PASS — `triggerAutoSummaries`, `triggerAutoWeeklySummaries`, `triggerAutoMonthlySummaries` (all exported async) each have a span |
| COV-003 | PASS — all three spans have outer catch with `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error` before `finally { span.end() }` |
| COV-004 | PASS — all three exported async functions instrumented; `getErrorMessage` is unexported and synchronous, correctly skipped per RST-001 and RST-004 |
| COV-005 | PASS — `triggerAutoSummaries` sets `commit_story.summary.day_count` (unsummarized day count); `triggerAutoWeeklySummaries` sets `commit_story.summary.week_count`; `triggerAutoMonthlySummaries` sets `commit_story.summary.month_count`; each span carries at least one domain attribute |
| RST-001 | PASS — `getErrorMessage` is synchronous with no I/O; correctly skipped |
| RST-004 | PASS — `getErrorMessage` is also unexported; both RST-001 and RST-004 confirm the skip |
| SCH-001 | PASS — `commit_story.summary.trigger_auto_summaries`, `trigger_auto_weekly_summaries`, `trigger_auto_monthly_summaries` registered as schema extensions; distinct operation class from `run_*` CLI entry points; SCH-001 advisory in agent notes about naming similarity is correctly dismissed |
| SCH-002 | PASS — `commit_story.summary.day_count`, `week_count`, `month_count` are all registered in `agent-extensions.yaml` (registered by summary-manager.js earlier this run); no undeclared keys used |
| SCH-003 | PASS — `unsummarizedDays.length`, `unsummarizedWeeks.length`, `unsummarizedMonths.length` are integer counts; all three attributes registered as `type: int`; no type mismatches |
| CDQ-001 | PASS — all three spans use `startActiveSpan` callback with `finally { span.end() }` |
| CDQ-002 | SKIP — rule not in evaluated set |
| CDQ-003 | SKIP — rule not in evaluated set |
| CDQ-005 | PASS — all three functions use `tracer.startActiveSpan()`, not `startSpan` |
| CDQ-006 | SKIP — rule not in evaluated set |
| CDQ-007 | PASS — `!= null` guards on all three `setAttribute` calls before `.length` access; guards are defensively correct given that `findUnsummarized*` functions are externally sourced; no unguarded nullable access |

**Failures**: None
