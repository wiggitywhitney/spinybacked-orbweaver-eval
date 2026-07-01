### 8. src/managers/summary-manager.js (9 spans, 1 attempt)

Run-20 resolves the run-19 regression completely: all 9 exported async functions now have spans, including the three `generateAndSave*` orchestrators that were blocked by NDS-003 violations in run-19. The PRD #885 fix confirmed — the agent instrumented all 9 spans in a single attempt with no NDS-003 rejections. One COV-005 gap exists: `readWeekDailySummaries` and `readMonthWeeklySummaries` set only their respective label (input parameter) without capturing a count of summaries found, unlike `readDayEntries` which sets `entries_count` as a computed output attribute.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — all 9 spans accepted; complex multi-line return objects and nested try/catch blocks in the generateAndSave* functions preserved verbatim; no structural reformatting detected |
| NDS-004 | PASS — all function signatures preserved; no parameter or export changes |
| NDS-005 | PASS — all graceful-degradation catches preserved: ENOENT-swallowing catches in readFile/access/readdir loops left unmodified; outer span catch handles unexpected errors per COV-003 |
| NDS-006 | PASS — all inline comments and JSDoc preserved across all 9 instrumented functions |
| API-001 | PASS — `trace` and `SpanStatusCode` imported from `@opentelemetry/api` only |
| COV-001 | PASS — all 6 exported async orchestrators and helpers covered: `readDayEntries`, `saveDailySummary`, `generateAndSaveDailySummary`, `readWeekDailySummaries`, `saveWeeklySummary`, `generateAndSaveWeeklySummary`, `readMonthWeeklySummaries`, `saveMonthlySummary`, `generateAndSaveMonthlySummary` |
| COV-003 | PASS — all 9 spans use try/catch/finally with `recordException(error)`, `setStatus({code: SpanStatusCode.ERROR})`, and rethrow; inner graceful-degradation catches correctly left without recordException |
| COV-004 | PASS — all 9 exported async functions covered; 5 sync helpers (`formatDailySummary`, `formatWeeklySummary`, `formatMonthlySummary`, `getWeekBoundaries`, `getMonthBoundaries`) correctly skipped per RST-001 |
| COV-005 | FAIL — `readWeekDailySummaries` sets only `week_label` (input parameter), no output count attribute for summaries found; `readMonthWeeklySummaries` sets only `month_label` (input parameter), no output count attribute; both functions compute and return arrays of summaries but capture no quantity attribute. All other 7 spans capture output or state attributes: `readDayEntries` (entries_count), `saveDailySummary` (file_path + entry_date), `generateAndSaveDailySummary` (entry_date + entries_count + file_path), `saveWeeklySummary` (week_label + file_path), `generateAndSaveWeeklySummary` (week_label + file_path), `saveMonthlySummary` (month_label + file_path), `generateAndSaveMonthlySummary` (month_label + file_path) |
| RST-001 | PASS — `formatDailySummary`, `formatWeeklySummary`, `formatMonthlySummary`, `getWeekBoundaries`, `getMonthBoundaries` all correctly skipped as synchronous pure functions with no I/O |
| RST-004 | PASS — no unexported async functions in this file |
| SCH-001 | PASS — all 9 span names registered in `agent-extensions.yaml` under `span.commit_story.summary.*` |
| SCH-002 | PASS — all attributes registered: `commit_story.journal.file_path`, `commit_story.journal.entry_date`, `commit_story.journal.entries_count` (main schema); `commit_story.journal.week_label`, `commit_story.journal.month_label` (agent-extensions) |
| SCH-003 | PASS — `entries_count` set from `.length` (int); `week_label` and `month_label` are string arguments; `entry_date` is a string from `getDateString()`; `file_path` is a string path |
| CDQ-001 | PASS — `span.end()` in `finally` block on all 9 spans |
| CDQ-002 | PASS — all spans are INTERNAL application functions; no CLIENT/SERVER kind |
| CDQ-003 | PASS — no cross-span attribute modification |
| CDQ-005 | PASS — all `setAttribute` and `span.end()` calls are inside `startActiveSpan` callbacks |
| CDQ-007 | PASS — `file_path` set on generateAndSave* spans only after `if (!path)` early-return guard; `entries_count` set only after `if (entries.length === 0)` early-return guard; all label strings are required function arguments; no nullable field access in any setAttribute call |

**Failures**: COV-005 FAIL — `readWeekDailySummaries` and `readMonthWeeklySummaries` set only their input label parameters (`week_label`, `month_label`) without capturing a computed output attribute (e.g., count of summaries found). Both functions build and return arrays of summaries but no quantity is recorded on the span.
