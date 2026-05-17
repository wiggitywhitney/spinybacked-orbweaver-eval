### 24. utils/journal-paths.js (1 span, 1 attempt)

**Structure**: One exported async function (`ensureDirectory`) plus eleven pure synchronous utilities (`getYearMonth`, `getDateString`, `getJournalEntryPath`, `getReflectionPath`, `getContextPath`, `getReflectionsDirectory`, `parseDateFromFilename`, `getJournalRoot`, `getISOWeekString`, `getSummaryPath`, `getSummariesDirectory`). Clean 1-attempt success. Identical outcome to runs 16 and 17.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — only `ensureDirectory` modified; all sync utilities byte-for-byte unchanged; validator accepted on first attempt |
| NDS-004 | PASS — `ensureDirectory(filePath)` signature unchanged |
| NDS-005 | PASS — original had no try/catch; instrumented version adds outer catch for span error recording (recordException + setStatus ERROR + rethrow); additive only |
| NDS-006 | PASS — all original comments preserved |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` only; no SDK imports |
| COV-001 | PASS — `ensureDirectory` (exported async, performs filesystem I/O via `mkdir`) has span `commit_story.journal.ensure_directory` |
| COV-003 | PASS — outer catch has `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error` before `finally { span.end() }` |
| COV-004 | PASS — `ensureDirectory` is the only exported async function; all eleven remaining functions are pure synchronous utilities correctly skipped per RST-001 |
| COV-005 | PASS — `commit_story.journal.file_path` set from `filePath` parameter; covers the directory creation target |
| RST-001 | PASS — all eleven sync helpers skipped; none perform I/O or async operations |
| RST-004 | PASS — no unexported async functions exist in this file; exemption not needed |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` not in base registry; correctly declared as a schema extension; follows `commit_story.<category>.<operation>` naming convention |
| SCH-002 | PASS — `commit_story.journal.file_path` is a defined registry attribute (`type: string`); no undeclared attribute keys used |
| SCH-003 | PASS — `commit_story.journal.file_path` registered as `type: string`; `filePath` is the raw string parameter; type matches |
| CDQ-001 | PASS — span closed in `finally` block inside `startActiveSpan` callback; no early-exit path escapes the finally |
| CDQ-002 | SKIP — rule not in evaluated set |
| CDQ-003 | SKIP — rule not in evaluated set |
| CDQ-005 | PASS — `tracer.startActiveSpan` callback pattern used; not `startSpan` |
| CDQ-006 | SKIP — rule not in evaluated set |
| CDQ-007 | ADVISORY — raw `filePath` used for `commit_story.journal.file_path` (full filesystem path); `path.basename` is not imported in this file; adding a non-OTel import is not permitted per CDQ-007 guidance; same known limitation as runs 16 and 17; does not constitute a blocking failure |

**Failures**: None
