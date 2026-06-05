### 10. utils/summary-detector.js (5 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — `tracer.startActiveSpan` used correctly throughout |
| API-001 | PASS — `@opentelemetry/api` imported; no SDK imports |
| NDS-006 | PASS — all 5 spans have try/catch with `recordException` + `setStatus(ERROR)` + rethrow |
| NDS-004 | PASS — all spans end in `finally` blocks |
| NDS-005 | PASS — inner `readdir` catches return `[]` or `new Set()` without disturbing span lifecycle |
| COV-001 | PASS — all 5 exported async entry-point functions have spans |
| COV-003 | PASS — sync helpers `getTodayString` and `getNowDate` correctly omitted |
| COV-004 | PASS — 5 async I/O functions covered: `getDaysWithEntries`, `findUnsummarizedDays`, `getDaysWithDailySummaries`, `findUnsummarizedWeeks`, `findUnsummarizedMonths` |
| COV-005 | PASS — every span has ≥1 domain attribute: `getDaysWithEntries` → `dates_count`; `findUnsummarizedDays` → `dates_count`; `getDaysWithDailySummaries` → `dates_count`; `findUnsummarizedWeeks` → `unsummarized_weeks_count`; `findUnsummarizedMonths` → `weekly_summaries_count` + `unsummarized_months_count` |
| COV-006 | N/A — no non-async I/O functions requiring span coverage |
| RST-001 | PASS — `getTodayString` and `getNowDate` are sync; no spans |
| RST-004 | PASS — unexported async helpers (`getSummarizedDays`, `getSummarizedWeeks`, `getSummarizedMonths`, `getWeeksWithWeeklySummaries`) correctly left without spans; COV-004 permits but does not require unexported async I/O spans when exported callers are already covered |
| SCH-001 | PASS — all 5 span names registered in agent-extensions.yaml: `span.commit_story.summary.get_days_with_entries`, `find_unsummarized_days`, `get_days_with_daily_summaries`, `find_unsummarized_weeks`, `find_unsummarized_months` |
| SCH-002 | PASS — all 4 attributes registered: `commit_story.summary.dates_count` (pre-registered), `commit_story.summary.weekly_summaries_count` (pre-registered), `commit_story.summary.unsummarized_weeks_count` (new in this commit), `commit_story.summary.unsummarized_months_count` (new in this commit) |
| SCH-003 | PASS — all count attributes are `int` type in registry |
| CDQ-001 | PASS — span names use dot-notation, snake_case |
| CDQ-002 | PASS — attribute keys use dot-notation, snake_case |
| CDQ-003 | PASS — no PII captured |
| CDQ-005 | PASS — `dates_count` and `weekly_summaries_count` are pre-registered; `unsummarized_weeks_count` and `unsummarized_months_count` declared as new in schema extensions |
| CDQ-007 | PASS with note — `findUnsummarizedDays` guards with `if (result != null)` and `findUnsummarizedWeeks` guards with `if (unsummarized != null)`; the remaining three spans set attributes on array `.length` values that are structurally guaranteed to be non-null integers, so missing guards are not a defect in practice; guard application is inconsistent but CDQ-007 is not violated |

**Failures**: None

**Notes**:

- `dates_count` is reused across three spans with slightly different semantics: entry count in `getDaysWithEntries`, filtered unsummarized count in `findUnsummarizedDays`, and daily summary count in `getDaysWithDailySummaries`. Within each span the value is contextually appropriate; the reuse is reasonable schema economy since all three measure a count of dates.
- `weekly_summaries_count` in `findUnsummarizedMonths` captures `weekLabels.length` (number of weeks with weekly summaries used as input). This is accurate despite the attribute name sounding like an output metric.
- The agent notes claimed "ALL setAttribute calls guarded with if (value != null)" but three spans omit the guard. The unguarded values are always concrete integers via `.length`, so this is a style inconsistency, not a correctness issue.
- The four unexported async helpers are not instrumented. This is correct: COV-004 permits but does not require unexported async I/O functions to have spans when they are pure internal sub-operations of already-instrumented exported functions.
