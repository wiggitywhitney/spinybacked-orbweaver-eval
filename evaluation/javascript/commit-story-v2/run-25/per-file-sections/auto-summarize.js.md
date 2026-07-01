### managers/auto-summarize.js (3 spans)

**Spans**: `commit_story.journal.trigger_auto_summaries`, `commit_story.journal.trigger_auto_weekly_summaries`, `commit_story.journal.trigger_auto_monthly_summaries`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | All `setAttribute` calls unconditional; output counts placed immediately before `return` on existing variables (no code restructuring) |
| API-001 | **PASS** | `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | All 3 outer catches call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrow |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | Inner loop catches (per-day/week/month errors) push to `result.failed`/`result.errors` arrays without rethrowing — graceful-degradation paths correctly left unmodified per NDS-007 |
| COV-001 | **PASS** | `triggerAutoSummaries`, `triggerAutoWeeklySummaries`, and `triggerAutoMonthlySummaries` are the exported async entry points — all 3 have spans |
| COV-003 | **PASS** | All 3 outer catches record and rethrow; inner loop catches are NDS-007 paths |
| COV-004 | **PASS** | All 3 exported async functions instrumented; `getErrorMessage` (sync unexported helper) correctly skipped per RST-001 and RST-004 |
| COV-005 | **PASS** | `trigger_auto_summaries`: `dates_count`, `weeks_count`, `months_count`, `generated_count`, `failed_count`; `trigger_auto_weekly_summaries`: `weeks_count`, `generated_count`, `failed_count`; `trigger_auto_monthly_summaries`: `months_count`, `generated_count`, `failed_count` — all ≥3 domain attributes per span |
| RST-001 | **PASS** | `getErrorMessage` (pure synchronous) correctly skipped |
| RST-004 | **PASS** | `getErrorMessage` is unexported; only exported async functions instrumented |
| SCH-001 | **PASS** | All 3 span names registered in `agent-extensions.yaml` as new extensions this run — agent chose non-colliding names (`trigger_auto_*` prefix) to avoid semantic overlap with `run_summarize`, `run_weekly_summarize`, `run_monthly_summarize` from other files |
| SCH-002 | **PASS** | All 5 attribute keys pre-registered in `semconv/attributes.yaml` (`commit_story.journal.dates_count`, `weeks_count`, `months_count`, `generated_count`, `failed_count`) — zero new attributes |
| SCH-003 | **PASS** | Counts set from `.length` on arrays (integer); `generated_count` and `failed_count` computed via array arithmetic (integer) |
| CDQ-001 | **PASS** | `finally { span.end() }` on all 3 spans |
| CDQ-002 | **PASS** | No unnecessary span nesting |
| CDQ-003 | **PASS** | No PII in attributes |
| CDQ-005 | **PASS** | No empty catch blocks; inner loop catches push to error arrays |
| CDQ-007 | **PASS** | All attributes sourced from `.length` or arithmetic on array lengths — no nullable field risk |

**Failures**: None

**Trace supplement**: The captured trace (`service.instance.id: bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3`, 2026-06-19) is from run-24 instrumentation, not run-25. Querying `service:commit-story @service.instance.id:bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3 resource_name:commit_story.journal.trigger_auto*`: the run-24 span name pattern was `trigger_auto_summaries` — confirmed present in Datadog from the organic run, with `dates_count: 1`, `generated_count: 1`, `failed_count: 0` and correct parent-child relationship to the `commit_story.cli.main` orchestrator span.

**Agent schema note**: The agent documented that `run_summarize`, `run_weekly_summarize`, and `run_monthly_summarize` span names were already in use by other files in this instrumentation run, so new names (`trigger_auto_*`) were chosen to avoid collision. All three are correctly registered in `agent-extensions.yaml`.
