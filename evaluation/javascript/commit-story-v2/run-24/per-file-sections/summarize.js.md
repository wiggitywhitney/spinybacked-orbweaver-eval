### commands/summarize.js (3 spans, 1 attempt)

> **RUN23-2 fix confirmed.** Run-23 failed SCH-003 on `commit_story.summarize.dates_count` (declared `type: string`, set as integer `.length`) and on `commit_story.summarize.force` (declared `type: string`, set as boolean). Run-24 corrects both — new declarations use `type: int` and `type: boolean` respectively.

**Spans**: `commit_story.summarize.run_daily_summaries`, `commit_story.summarize.run_weekly_summaries`, `commit_story.summarize.run_monthly_summaries`

**New attribute declarations**: `commit_story.summarize.dates_count` (int), `commit_story.summarize.force` (boolean)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No `isRecording()` guards around `setAttribute`; all attributes set unconditionally within span callbacks |
| API-001 | PASS | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | PASS | All 3 outer span catch blocks call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | N/A | No graceful-degradation catch blocks in original source; the run functions propagate errors up to the CLI handler |
| COV-001 | PASS | `runDailySummaries`, `runWeeklySummaries`, `runMonthlySummaries` are the exported async entry points; each has a span |
| COV-003 | PASS | All 3 outer catch blocks record exception and set ERROR status before rethrowing |
| COV-004 | PASS | All 3 exported async functions instrumented; synchronous helpers and `runSummarize` (the default export synchronous setup function) correctly handled — `runSummarize` is the exported function that constructs and runs the Yargs CLI; it is synchronous in the sense that it returns the Yargs instance, with async work delegated to the handler callbacks above |
| COV-005 | PASS | `run_daily_summaries` span sets `commit_story.summarize.dates_count` and `commit_story.summarize.force`; same two attributes set on the weekly and monthly spans — spans carry input parameters describing the summarize operation |
| RST-001 | PASS | No purely synchronous utility functions were given spans |
| RST-004 | PASS | Only the 3 exported async command handlers are instrumented |
| SCH-001 | PASS | All 3 span names registered in `semconv/agent-extensions.yaml`; `commit_story.summarize.*` namespace consistent |
| SCH-002 | PASS | `commit_story.summarize.dates_count` and `commit_story.summarize.force` registered in `agent-extensions.yaml`; no near-synonyms (`commit_story.summarize.date_count` or `commit_story.summarize.forced` were not used) |
| SCH-003 | **PASS** *(RUN23-2 fixed)* | `dates_count` declared `type: int`, set as `x != null ? x.length : 0` (integer with null guard); `force` declared `type: boolean`, set from `options.force` (boolean CLI flag) — both match their schema declarations. Run-23 had both wrong (`type: string` for count, `type: string` for boolean flag). |
| CDQ-001 | PASS | All 3 spans use `finally { span.end() }` inside async `startActiveSpan` callbacks; no redundant `span.end()` in try blocks |
| CDQ-002 | PASS | No unnecessary nested spans |
| CDQ-003 | PASS | No PII; attributes are a count and a boolean flag |
| CDQ-005 | PASS | No empty catch blocks |
| CDQ-007 | PASS | `dates_count` guarded with `x != null ? x.length : 0` — handles null `dates` parameter correctly; `force` is a boolean CLI flag with a boolean default — always defined |

**Failures**: None

**RUN23-2 fix verification**: The failing assertion in run-23 was that `type: string` was declared for both `dates_count` (set as integer) and `force` (set as boolean). In run-24, the schema correctly declares `type: int` and `type: boolean`. The fix is confirmed at the schema level by reading `semconv/agent-extensions.yaml` — no runtime trace evidence available (the summarize pipeline was not exercised in the captured organic run).

**CDQ-007 null guard pattern**: `const count = dates != null ? dates.length : 0` — this pattern handles the case where `--dates` is omitted from the CLI (Yargs provides `undefined` for optional array arguments). The null guard produces `0` in that case rather than throwing, and `0` is a valid integer for `type: int`. Correct.

**Trace supplement**: No summarize.js spans appeared in Datadog for this service instance. The captured run was an organic post-commit journal generation, not a manual `commit-story summarize` invocation. Evaluation is static-analysis-only for this file.
