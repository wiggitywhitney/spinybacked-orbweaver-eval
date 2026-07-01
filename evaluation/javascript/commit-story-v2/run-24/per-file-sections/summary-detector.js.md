### utils/summary-detector.js (9 spans, 1 attempt)

> **RUN23-3 fix confirmed.** Run-23 failed SCH-002 (near-synonym `base_path` duplicating `file_path`). Run-24 eliminates `base_path` entirely and replaces it with three semantically precise count attributes. All 9 spans present — 5 on exported async functions, 4 on unexported async I/O helpers.

**Spans** (5 exported + 4 unexported async I/O helpers):
- Exported: `commit_story.summaries.detect_missing_daily`, `commit_story.summaries.detect_missing_weekly`, `commit_story.summaries.detect_missing_monthly`, `commit_story.summaries.check_summaries`, `commit_story.summaries.get_summary_status`
- Unexported: `commit_story.summaries.read_existing_daily`, `commit_story.summaries.read_existing_weekly`, `commit_story.summaries.read_existing_monthly`, `commit_story.summaries.count_journal_entries`

**New attribute declarations**: `commit_story.summaries.unsummarized_days_count` (int), `commit_story.summaries.unsummarized_weeks_count` (int), `commit_story.summaries.unsummarized_months_count` (int)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No `isRecording()` guards around `setAttribute`; all attributes set unconditionally |
| API-001 | PASS | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | PASS | All 9 outer span catch blocks call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | PASS | Inner ENOENT catches in the 4 unexported helper functions return empty arrays/0 on missing directories — graceful-degradation paths correctly left unmodified per NDS-007 |
| COV-001 | PASS | 5 exported async functions each have a span; `isSummaryFileExists` (synchronous) correctly skipped per RST-001 |
| COV-003 | PASS | All 9 outer catch blocks record exception and set ERROR status before rethrowing |
| COV-004 | PASS | All 5 exported async functions instrumented; `isSummaryFileExists` (exported sync) correctly skipped; 4 unexported async I/O helpers instrumented because they perform substantial async work not covered by any enclosing exported span |
| COV-005 | PASS | `check_summaries` and `get_summary_status` spans set all three `unsummarized_*_count` attributes; `detect_missing_*` spans set the relevant count for their period; helper spans set `commit_story.journal.file_path` from the directory path they're reading — all spans carry meaningful process data |
| RST-001 | PASS | `isSummaryFileExists` (exported, synchronous) correctly skipped |
| RST-004 | PASS | The 4 unexported async I/O helpers (`readExistingDailySummaries`, `readExistingWeeklySummaries`, `readExistingMonthlySummaries`, `countJournalEntries`) are instrumented directly because no exported orchestrator span covers their async I/O; consistent with COV-004 precedent in `git-collector.js` for unexported I/O functions |
| SCH-001 | PASS | All 9 span names registered in `semconv/agent-extensions.yaml`; `commit_story.summaries.*` namespace |
| SCH-002 | **PASS** *(RUN23-3 fixed)* | `unsummarized_days_count`, `unsummarized_weeks_count`, `unsummarized_months_count` — all three are semantically distinct from each other and from any existing attributes in `attributes.yaml`; no near-synonyms for `file_path`, `entries_count`, or other registered count attributes. `base_path` (the run-23 near-synonym of `file_path`) does not appear in the committed code. |
| SCH-003 | PASS | All three `unsummarized_*_count` attributes declared `type: int`; set from array lengths and computed counts (integers) — type match correct |
| CDQ-001 | PASS | All 9 spans use `finally { span.end() }` inside async `startActiveSpan` callbacks; no redundant `span.end()` in try blocks |
| CDQ-002 | PASS | No unnecessary nested spans |
| CDQ-003 | PASS | No PII; attributes are integer counts and journal directory paths |
| CDQ-005 | PASS | No empty catch blocks; ENOENT catches return empty arrays (NDS-007 graceful degradation) |
| CDQ-007 | PASS | Count attributes set from `.length` on arrays that are always initialized (ENOENT catch returns `[]` instead of `undefined`); no nullable-field risk |

**Failures**: None

**RUN23-3 fix verification**: The run-23 failure was `base_path` — a near-synonym for the already-registered `commit_story.journal.file_path`. In run-24, `base_path` does not appear anywhere in the committed code or schema. The three replacement attributes (`unsummarized_days_count`, `unsummarized_weeks_count`, `unsummarized_months_count`) are semantically precise and schema-compliant.

**RST-004 rationale for 4 unexported helpers**: Each helper performs a `readdir` operation on a journal subdirectory. Their callers (`detectMissingDailySummaries`, `detectMissingWeeklySummaries`, `detectMissingMonthlySummaries`, `countJournalEntries`) are themselves async functions with their own spans, but the 4 helpers are called multiple times from different paths in `checkSummaries` and `getSummaryStatus`. Instrumenting them directly captures the async I/O at the point it occurs rather than attributing all work to a single orchestrator span. This is consistent with the `git-collector.js` precedent.

**Trace supplement**: All 9 spans confirmed in Datadog (2026-06-18T20:25:31Z) — the captured run executed `--check-summaries`. Runtime values confirm correct integer types:
- `commit_story.summaries.unsummarized_days_count: 0`
- `commit_story.summaries.unsummarized_weeks_count: 0`
- `commit_story.summaries.unsummarized_months_count: 0`
(Clean journal state — all summaries up to date at capture time.) All 9 spans show status Unset with complete attribute sets. Datadog confirms the NDS-007 ENOENT path did not fire (all directories present and readable).
