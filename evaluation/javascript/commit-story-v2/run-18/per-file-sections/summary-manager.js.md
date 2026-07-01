### managers/summary-manager.js (9 spans, 2 attempts, $0.74) — SUCCESS

**RUN17-1 partial resolution**: All three `generateAndSave*` orchestrators now have spans (were silently dropped in run-17 by the MIN_STATEMENTS filter). Full COV-004 coverage achieved: 9/9 exported async functions instrumented. Trajectory: run-12 had 3 spans, run-17 had 6 spans, run-18 has 9 spans.

**Function coverage**:
- `readDayEntries` → `span.commit_story.summary.read_day_entries`
- `saveDailySummary` → `span.commit_story.summary.save_daily_summary`
- `generateAndSaveDailySummary` → `span.commit_story.summary.generate_and_save_daily`
- `readWeekDailySummaries` → `span.commit_story.summary.read_week_daily_summaries`
- `saveWeeklySummary` → `span.commit_story.summary.save_weekly_summary`
- `generateAndSaveWeeklySummary` → `span.commit_story.summary.generate_and_save_weekly`
- `readMonthWeeklySummaries` → `span.commit_story.summary.read_month_weekly_summaries`
- `saveMonthlySummary` → `span.commit_story.summary.save_monthly_summary`
- `generateAndSaveMonthlySummary` → `span.commit_story.summary.generate_and_save_monthly`

**5 new schema attributes**: `commit_story.summary.entry_count` (int), `commit_story.summary.week_label` (string), `commit_story.summary.day_count` (int), `commit_story.summary.month_label` (string), `commit_story.summary.week_count` (int). All types match semantic intent.

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | Multi-line signatures restored verbatim; all original code preserved |
| NDS-004 | PASS | Multi-line signatures preserved; no compression of any original multi-line construct |
| NDS-005 | PASS | All inner catch blocks preserved: ENOENT swallows in save* functions, per-day readFile catch, readdir catch in readMonth*, access() short-circuit catches in generateAndSave* |
| NDS-006 | PASS | `import { trace, SpanStatusCode } from '@opentelemetry/api'`; `const tracer = trace.getTracer('commit-story')` at module level |
| API-001 | PASS | `@opentelemetry/api` only; no SDK or vendor-specific imports |
| COV-001 | PASS | All three generateAndSave* orchestrators have spans (RUN17-1 resolved) |
| COV-003 | PASS | All 9 spans: startActiveSpan callback with try/catch/finally; outer catch calls recordException + setStatus(ERROR) + throw; span.end() in every finally |
| COV-004 | PASS | All 9 exported async functions have spans. Fully resolves run-12 (6 missing) and run-17 (3 missing) |
| COV-005 | PASS | Read functions record output count; save functions record file_path; orchestrators record date/week/month label plus count |
| RST-001 | PASS | All five synchronous helpers (formatDailySummary, formatWeeklySummary, formatMonthlySummary, getWeekBoundaries, getMonthBoundaries) receive 0 spans |
| RST-004 | PASS | No unexported async functions in this file |
| SCH-001 | PASS | 9 span names declared as schema extensions under `commit_story.summary.*`; no name collisions |
| SCH-002 | PASS | All 5 new attributes correctly typed; count attributes (int) from .length; label attributes (string) from arguments |
| SCH-003 | PASS | `entry_count`, `day_count`, `week_count` set from .length (int); `week_label`, `month_label` from string arguments |
| CDQ-001 | PASS | startActiveSpan + finally { span.end() } throughout; no unclosed span paths |
| CDQ-002 | PASS | No duplicate span.end() calls |
| CDQ-003 | PASS | No hardcoded environment values in attributes |
| CDQ-005 | PASS | tracer.startActiveSpan consistently used; trace.getTracer('commit-story') at module level |
| CDQ-006 | PASS | No unnecessary isRecording() guards |
| CDQ-007 | PASS | All count attributes from .length on initialized arrays (never nullable); label attributes are required string args; agent correctly declined null guards |

**Canonical failures**: None.
