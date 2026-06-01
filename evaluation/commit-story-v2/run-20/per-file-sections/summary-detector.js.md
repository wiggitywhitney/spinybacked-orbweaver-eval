### 10. utils/summary-detector.js (9 spans, 1 attempt)

All 9 async functions instrumented — 5 exported (`getDaysWithEntries`, `findUnsummarizedDays`, `getDaysWithDailySummaries`, `findUnsummarizedWeeks`, `findUnsummarizedMonths`) and 4 unexported async helpers (`getSummarizedDays`, `getSummarizedWeeks`, `getSummarizedMonths`, `getWeeksWithWeeklySummaries`). Outcome is identical to run-19: 9 spans, 1-attempt success. The key improvement over run-19 is SCH-002 resolves from ADVISORY to PASS — all 4 attribute keys used in the instrumented code (`commit_story.journal.entries_count`, `commit_story.summary.dates_count`, `commit_story.summary.weeks_count`, `commit_story.summary.months_count`) are confirmed registered in `semconv/agent-extensions.yaml` on the instrument branch.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original business logic preserved throughout; only span scaffolding and tracer initialization added |
| NDS-004 | PASS — no function signatures altered; `import { trace, SpanStatusCode }` and `const tracer` are the only additions at module level |
| NDS-005 | PASS — all inner `readdir` try/catch graceful-degradation blocks (returning `[]` or `new Set()` on directory-not-found) preserved unmodified inside `startActiveSpan` callbacks; no `recordException` added to them |
| NDS-006 | PASS — all JSDoc blocks and inline comments preserved verbatim |
| API-001 | PASS — `@opentelemetry/api` only; `trace` and `SpanStatusCode` imported correctly |
| COV-001 | PASS — all 5 exported async functions have entry-point spans |
| COV-003 | PASS — every span has outer try/catch/finally with `recordException` + `SpanStatusCode.ERROR` + rethrow; inner graceful-degradation catches are NDS-005 preserved originals, not instrumentation catches |
| COV-004 | PASS — all 9 async functions instrumented; 4 unexported helpers qualify per RST-004 (each is the sole standalone I/O source for a distinct data class); `getTodayString` and `getNowDate` are sync, correctly excluded |
| COV-005 | PASS — result count attribute set on every span capturing output state: `commit_story.journal.entries_count` on `getDaysWithEntries`; `commit_story.summary.dates_count` on `getSummarizedDays`, `findUnsummarizedDays`, `getDaysWithDailySummaries`; `commit_story.summary.weeks_count` on `getSummarizedWeeks`, `getWeeksWithWeeklySummaries`, `findUnsummarizedWeeks`; `commit_story.summary.months_count` on `getSummarizedMonths`, `findUnsummarizedMonths` |
| RST-001 | PASS — `getTodayString` and `getNowDate` are synchronous pure helpers with no I/O; correctly excluded |
| RST-004 | PASS — 4 unexported helpers instrumented per permissive RST-004 reading; `getSummarizedDays` serves `findUnsummarizedDays`, `getSummarizedWeeks` serves `findUnsummarizedWeeks`, `getSummarizedMonths` and `getWeeksWithWeeklySummaries` both serve `findUnsummarizedMonths`; each helper's `readdir` call is the primary I/O for its data class |
| SCH-001 | PASS — all 9 span names registered in `agent-extensions.yaml`: `commit_story.summary.get_days_with_entries`, `commit_story.summary.get_summarized_days`, `commit_story.summary.find_unsummarized_days`, `commit_story.summary.get_summarized_weeks`, `commit_story.summary.get_days_with_daily_summaries`, `commit_story.summary.find_unsummarized_weeks`, `commit_story.summary.get_summarized_months`, `commit_story.summary.get_weeks_with_weekly_summaries`, `commit_story.summary.find_unsummarized_months` |
| SCH-002 | PASS — all 4 attribute keys confirmed in `agent-extensions.yaml`: `commit_story.journal.entries_count`, `commit_story.summary.dates_count`, `commit_story.summary.weeks_count`, `commit_story.summary.months_count`; resolves the run-19 ADVISORY |
| SCH-003 | PASS — all count attributes set from `.length` or `.size` on locally constructed arrays/Sets (int type correct) |
| CDQ-001 | PASS — `span.end()` in `finally` on all 9 spans |
| CDQ-002 | PASS — `startActiveSpan` default INTERNAL kind throughout |
| CDQ-007 | PASS — all attributes set from `.length`/`.size` on locally constructed arrays and Sets; no nullable field access; no optional chaining in `setAttribute` calls |

**Failures**: None.
