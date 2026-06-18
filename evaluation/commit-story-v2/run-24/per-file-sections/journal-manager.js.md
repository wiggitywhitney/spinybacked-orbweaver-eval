### managers/journal-manager.js (2 spans, 1 attempt)

**Spans**: `commit_story.journal.save_entry`, `commit_story.journal.discover_reflections`

**New attribute declarations**: 0 (all attributes pre-registered)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No `isRecording()` guards around `setAttribute`; all attributes set unconditionally |
| API-001 | PASS | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | PASS | Both outer span catch blocks call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | PASS | Three inner catch blocks are graceful-degradation paths: (1) empty `catch {}` in `saveJournalEntry` for file-not-found check (proceed when file doesn't exist yet); (2) empty `catch {}` in `discoverReflections` wrapping `readdir` (missing directory — return empty array); (3) empty `catch {}` in `discoverReflections` wrapping per-file `readFile` (unreadable file — skip entry). All three correctly left unmodified per NDS-007. |
| COV-001 | PASS | `saveJournalEntry` and `discoverReflections` are the exported async entry points; each has a span |
| COV-003 | PASS | Both outer catch blocks record exception and set ERROR status before rethrowing |
| COV-004 | PASS | Both exported async functions instrumented; `formatTimestamp` and `formatJournalEntry` (exported but synchronous), `extractFilesFromDiff`, `countDiffLines`, `formatReflectionsSection`, `parseReflectionEntry`, `parseTimeString`, `parseReflectionsFile`, `isInTimeWindow`, `getYearMonthRange` (unexported synchronous helpers) all correctly skipped per RST-001/RST-004 |
| COV-005 | PASS | `save_entry` span sets `commit_story.commit.timestamp`, `commit_story.journal.file_path`, and `commit_story.journal.quotes_count`; `discover_reflections` span sets `commit_story.context.time_window_start`, `commit_story.context.time_window_end` |
| RST-001 | PASS | `formatTimestamp`, `formatJournalEntry` (exported but sync) and all unexported sync helpers correctly skipped |
| RST-004 | PASS | Unexported helpers correctly excluded; their execution paths are covered by the two exported orchestrator spans |
| SCH-001 | PASS | Both span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS | All 5 attributes used (`commit_story.commit.timestamp`, `commit_story.journal.file_path`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.journal.quotes_count`) are pre-registered in `attributes.yaml`; no new attribute declarations |
| SCH-003 | PASS | `commit.timestamp` set from `.toISOString()` (string); `journal.file_path` set from path string; `context.time_window_start/end` set from `.toISOString()` (string); `journal.quotes_count` set from `.length` (integer) — all types match registry declarations |
| CDQ-001 | PASS | Both spans use `finally { span.end() }` inside async `startActiveSpan` callbacks; no redundant `span.end()` in try blocks |
| CDQ-002 | PASS | No unnecessary nested child spans |
| CDQ-003 | PASS | No PII captured; `file_path` is a project path, `commit.timestamp` is a date string |
| CDQ-005 | PASS | The three inner empty catch blocks are NDS-007-classified graceful-degradation paths, not CDQ-005 violations (they handle expected conditions, not error suppression) |
| CDQ-007 | PASS | `quotes_count` set from `sections.quotes.length` on a locally-assembled object (always an array); `file_path` set from `getJournalEntryPath()` return (always a string); `commit.timestamp` from `commitData.timestamp` (string field on resolved data); `time_window_*` from Date objects (always valid). Run-12's CDQ-007 failure vectors (`commit.hash` and `commit.author` nullable fields) are absent from run-24's instrumented code. |

**Failures**: None

**CDQ-007 clarification**: The agent notes flagged `commit_story.journal.file_path` as a "raw filesystem path" CDQ-007 concern. This conflates two different issues: CDQ-007 concerns nullable/undefined values set unconditionally, not path format. The run-12 CDQ-007 failure was specifically `commit.hash` and `commit.author` being set from nullable commit object fields. In run-24, those fields are not used. Datadog confirms runtime value `journal.file_path: "journal/entries/2026-06/2026-06-18.md"` — a project-relative path, not an absolute path, so the formatting concern doesn't arise.

**Trace supplement**: Both spans confirmed in Datadog (2026-06-18T20:25:31Z):
- `commit_story.journal.save_entry`: `file_path: "journal/entries/2026-06/2026-06-18.md"` (project-relative), `commit.timestamp: "2026-06-18T20:25:29.000Z"`, `quotes_count: 0` (docs-only commit, no functional code quotes)
- `commit_story.journal.discover_reflections`: `time_window_start` and `time_window_end` present; reflections count 0 (no reflection files in time window)

Both spans show status Unset — no errors on either path. NDS-007 inner catches confirming expected behavior (empty journal file not found on first write, no reflection directory present).
