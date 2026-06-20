### managers/summary-manager.js (7 spans, ×2) ⚠️ PARTIAL

**Partial status**: 7 of 9 exported async functions were committed. Two functions were skipped by the validator:

- `readWeekDailySummaries` — skipped because COV-003 failed on an inner-loop catch using `if (err.code !== 'ENOENT') throw err`
- `readMonthWeeklySummaries` — skipped for the same reason (two inner-loop catches with the same pattern)

The 7 committed functions are correctly instrumented and evaluated fully below. The 2 skipped functions have no committed code and are not assessed for quality — their absence causes COV-004 to fail.

**Committed spans**: `commit_story.journal.read_day_entries`, `commit_story.journal.save_daily_summary`, `commit_story.journal.generate_and_save_daily_summary`, `commit_story.journal.save_weekly_summary`, `commit_story.journal.generate_and_save_weekly_summary`, `commit_story.journal.save_monthly_summary`, `commit_story.journal.monthly_summary_pipeline`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | All `setAttribute` calls unconditional; `entries != null` check before `setAttribute` is a null guard, not a truthy-check deviation |
| API-001 | **PASS** | Imports `SpanStatusCode` and `trace` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | All 7 outer catch blocks call `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, and rethrow |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | Inner ENOENT catches in `readDayEntries` (ENOENT → return `[]`) and duplicate-check `access` calls in save functions (ENOENT → proceed) correctly left unmodified per NDS-007; the 2 skipped functions had the contested conditional-rethrow pattern |
| COV-001 | **PASS** | All 7 committed exported async functions have entry-point spans |
| COV-003 | **PASS** | All 7 committed function catch blocks record and rethrow; the 2 skipped functions are not assessed |
| COV-004 | **FAIL** | 2 exported async functions (`readWeekDailySummaries`, `readMonthWeeklySummaries`) have no spans committed; both are async, exported, and perform filesystem I/O — RST-001 sync exemption and RST-004 unexported exemption do not apply |
| COV-005 | **PASS** | Each of the 7 spans carries at least one domain attribute: `entry_date`, `file_path`, `entries_count`, `week_label`, `daily_summaries_count`, `month_label`, or `weekly_summaries_count` |
| RST-001 | **PASS** | Sync helpers (`formatDailySummary`, `formatWeeklySummary`, `formatMonthlySummary`, `getWeekBoundaries`, `getMonthBoundaries`) correctly skipped |
| RST-004 | **PASS** | No unexported functions instrumented; all 7 instrumented functions are exported |
| SCH-001 | **PASS** | All 7 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | **PASS** | All attributes (`commit_story.journal.entries_count`, `week_label`, `daily_summaries_count`, `month_label`, `weekly_summaries_count`) registered in `agent-extensions.yaml`; no near-synonym conflicts |
| SCH-003 | **PASS** | Integer counts set as `.length` (integer); date strings via `.toISOString().split('T')[0]` (string); `week_label` and `month_label` passed through from string parameters |
| CDQ-001 | **PASS** | All 7 spans use `finally { span.end() }` inside `startActiveSpan` async callback |
| CDQ-002 | **PASS** | No unnecessary nested child spans |
| CDQ-003 | **PASS** | No PII attributes; `file_path` values are summary output paths, not source entry paths containing user content |
| CDQ-005 | **PASS** | No empty catch blocks among the 7 committed functions; access-check catches use `catch { }` (empty, intentional graceful-degradation for DD-003 duplicate detection) |
| CDQ-006 | **ADVISORY** | Validator flagged `file_path` setAttribute calls as lacking `isRecording()` guards around external-source strings. Per established rubric precedent, advisory CDQ-006 findings are not failures |
| CDQ-007 | **ADVISORY** | Validator flagged `commit_story.journal.file_path` as a raw filesystem path where a basename would be safer. Per established rubric precedent, CDQ-007 advisory path findings are not failures; the paths carry useful tracing context and are not PII |

**Failures**: COV-004 — `readWeekDailySummaries` and `readMonthWeeklySummaries` have no spans committed (see root cause below)

**Trace supplement**: The captured trace (`service.instance.id: bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3`, 2026-06-19) is from run-24 instrumentation (git SHA `bb08c9c`), not run-25 — Whitney had not yet invoked commit-story-v2 on the run-25 branch at capture time. `commit_story.journal.generate_and_save_daily_summary` confirmed in Datadog with `entry_date: 2026-06-18`, `entries_count: 33`, `file_path: journal/summaries/daily/2026-06-18.md`, `status: ok`. `commit_story.journal.save_daily_summary` confirmed as child span. Both attributes confirmed present at runtime with non-null values. The 2 skipped functions have no runtime evidence — expected, as they were not committed.

**Root cause** (from `failure-deep-dives.md`): The validator's `isExpectedConditionCatch` function in `cov003.ts` treats any catch body containing both an ENOENT pattern string and a `ThrowStatement` as requiring error recording. Both skipped functions use `if (err.code !== 'ENOENT') throw err` — semantically a graceful-degradation catch where ENOENT files are silently skipped and non-ENOENT errors rethrow to the outer span's error handler. The validator conservatively flags both patterns equally. In run-24, the agent worked around this by replacing the conditional rethrow with an empty `catch { }`, which passes COV-003 but silently swallows non-ENOENT errors — an NDS-007 deviation the run-24 validator did not catch. The run-25 agent preserved the semantically correct original behavior and was blocked. See `failure-deep-dives.md` for the full analysis and proposed spiny-orb fix.
