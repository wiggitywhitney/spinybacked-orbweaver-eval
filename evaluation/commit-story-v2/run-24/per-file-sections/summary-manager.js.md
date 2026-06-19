### managers/summary-manager.js (9 spans, 1 attempt)

> **COV-004 fix from run-12 confirmed sustained through run-24.** Run-12 had 3 spans (only 3 of 9 exported async functions covered). Run-23 corrected to 9 spans. Run-24 maintains 9 spans — 4th consecutive run with full coverage.

**Spans**: `commit_story.journal.read_day_entries`, `commit_story.journal.save_daily_summary`, `commit_story.journal.generate_daily_summary`, `commit_story.journal.read_week_daily_summaries`, `commit_story.journal.save_weekly_summary`, `commit_story.journal.generate_weekly_summary`, `commit_story.journal.read_month_weekly_summaries`, `commit_story.journal.save_monthly_summary`, `commit_story.journal.generate_monthly_summary`

**New attribute declarations**: 0 (all attributes pre-registered in prior runs)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No `isRecording()` guards around `setAttribute`; all attributes set unconditionally |
| API-001 | PASS | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | PASS | All 9 outer span catch blocks call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | PASS | Inner file-not-found catches in `readDayEntries`, `readWeekDailySummaries`, `readMonthWeeklySummaries` return empty arrays on ENOENT — graceful-degradation paths correctly left unmodified per NDS-007 |
| COV-001 | PASS | All 9 exported async functions: `readDayEntries`, `saveDailySummary`, `generateAndSaveDailySummary`, `readWeekDailySummaries`, `saveWeeklySummary`, `generateAndSaveWeeklySummary`, `readMonthWeeklySummaries`, `saveMonthlySummary`, `generateAndSaveMonthlySummary` — each has a span |
| COV-003 | PASS | All 9 outer catch blocks record exception and set ERROR status before rethrowing |
| COV-004 | PASS | All 9 exported async functions instrumented; synchronous helpers (`parseDailySummaryFile`, `buildDailySummaryPath`, `formatSummaryPeriod`, etc.) correctly skipped per RST-001/RST-004 |
| COV-005 | PASS | `read_day_entries` span sets `commit_story.journal.entry_date`; `save_*_summary` spans set `commit_story.journal.file_path`; `generate_*_summary` spans set `commit_story.journal.summaries_count` and period label attributes; all spans carry at least one meaningful process attribute |
| RST-001 | PASS | All synchronous helpers correctly skipped |
| RST-004 | PASS | Unexported async helpers (if any) covered by their callers; all 9 instrumented functions are exported |
| SCH-001 | PASS | All 9 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS | All attributes used are pre-registered; no new attribute declarations in run-24 |
| SCH-003 | PASS | Integer counts set from `.length` calls (integers); string labels set from computed date strings or path strings; all types match registry declarations |
| CDQ-001 | PASS | All 9 spans use `finally { span.end() }` inside async `startActiveSpan` callbacks; no redundant `span.end()` in try blocks |
| CDQ-002 | PASS | No unnecessary nested spans |
| CDQ-003 | PASS | No PII captured; attributes are dates, file paths, integer counts |
| CDQ-005 | PASS | No empty catch blocks; inner ENOENT catches return empty arrays (NDS-007 graceful degradation) |
| CDQ-007 | PASS | Array length attributes guarded against null arrays; path attributes set from computed path functions that always return strings |

**Failures**: None

**COV-004 history note**: Run-12 missed 6 of 9 exported async functions (only `generateAndSaveDailySummary`, `generateAndSaveWeeklySummary`, `generateAndSaveMonthlySummary` had spans — the 3 `read*` and 3 `save*` functions were missed). Run-23 fixed this. Runs 23 and 24 both maintain full 9-span coverage. This is now a stable, sustained fix.

**Trace supplement**: No summary-manager spans appeared in Datadog for this service instance. The captured organic post-commit run exercises the journal-entry pipeline (`context-integrator.js` → `journal-graph.js` → `journal-manager.js`), not the summarize pipeline. Summary spans would appear on `commit-story summarize` runs. Evaluation is static-analysis-only for this file.
