### 8. managers/summary-manager.js (9 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — all 9 outer catches do recordException + setStatus(ERROR) + rethrow |
| NDS-004 | PASS |
| NDS-005 | PASS — inner graceful-degradation catches preserved (file-not-found returns [], skip-on-exists returns null) |
| COV-001 | PASS — all 3 pipeline orchestrators (generateAndSaveDaily/Weekly/Monthly) have entry-point spans |
| COV-003 | PASS — all outer catches have recordException + setStatus(ERROR) |
| COV-004 | PASS — all 9 exported async fns have spans: readDayEntries, saveDailySummary, generateAndSaveDailySummary, readWeekDailySummaries, saveWeeklySummary, generateAndSaveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary, generateAndSaveMonthlySummary (was FAIL in run-20 — 6 of these had no spans) |
| COV-005 | FAIL — save_daily_summary has a path with zero attributes: when file exists and options.force is false, the function returns null before setAttribute is called; no attribute is set on the skip path. The other 8 spans all set at least one attribute unconditionally at span start (entry_date, week_label, or month_label). |
| COV-006 | N/A |
| RST-001 | PASS — formatDailySummary, formatWeeklySummary, formatMonthlySummary, getWeekBoundaries, getMonthBoundaries are all sync; correctly excluded from span instrumentation |
| RST-004 | PASS |
| SCH-001 | PASS — all 9 span names registered in agent-extensions.yaml |
| SCH-002 | PASS — all attributes registered: entries_count, week_label, month_label, weekly_summaries_count in agent-extensions.yaml; journal.file_path and journal.entry_date in base attributes.yaml |
| SCH-003 | PASS — entries_count/weekly_summaries_count are int (array.length), file_path/entry_date/week_label/month_label are string |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PARTIAL — journal.file_path is a raw filesystem path (known limitation documented by agent); all other setAttribute calls are null-safe: entries_count is array.length (guaranteed int), week_label/month_label are string params passed directly to the function, weekly_summaries_count is summaries.length (guaranteed int) |

**Failures**: COV-005 (save_daily_summary span has no attributes on the file-already-exists skip path)

**Notes**:
- COV-004 is a major step-change from run-20 (3 spans, COV-004 FAIL for 6 missing I/O functions) to run-21 (9 spans, full coverage). All previously missing spans for readDayEntries, saveDailySummary, readWeekDailySummaries, saveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary are now present.
- save_daily_summary COV-005 gap: the span does correctly record file_path on the write path, but the skip path (file exists, returns null) ends with no attributes. A fix would be to set at minimum commit_story.journal.entry_date at span start, mirroring the pattern used by save_weekly_summary and save_monthly_summary (which set week_label/month_label unconditionally at span start).
- entries_count reuse across contexts is semantically coherent: in read_day_entries it means raw journal entries; in read_week_daily_summaries and generate_and_save_weekly_summary it means daily summaries count. The attribute name is slightly ambiguous in the weekly context but not a schema violation.
- readMonthWeeklySummaries correctly uses the distinct weekly_summaries_count attribute (rather than reusing entries_count), which is a good semantic distinction.
