### utils/journal-paths.js (1 span, 1 attempt)

**Spans**: `commit_story.journal.ensure_directory`

**New attribute declarations**: 0 (uses pre-registered `commit_story.journal.file_path`)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No `isRecording()` guards around `setAttribute`; `file_path` set unconditionally |
| API-001 | PASS | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | PASS | Catch calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | N/A | No graceful-degradation catch blocks in original source |
| COV-001 | PASS | `ensureDirectory` is the only exported async function; span `commit_story.journal.ensure_directory` wraps its entire body |
| COV-003 | PASS | Catch records exception and sets ERROR status before rethrowing |
| COV-004 | PASS | `ensureDirectory` is the only exported async function; all 11 other exports (`getYearMonth`, `getDateString`, `getJournalEntryPath`, `getReflectionPath`, `getContextPath`, `getReflectionsDirectory`, `parseDateFromFilename`, `getJournalRoot`, `getISOWeekString`, `getSummaryPath`, `getSummariesDirectory`) are pure synchronous functions — correctly skipped per RST-001 |
| COV-005 | PASS | `commit_story.journal.file_path` set from the `filePath` parameter at the first line of the span body, before any branching or awaiting |
| RST-001 | PASS | All 11 synchronous pure-function exports correctly skipped |
| RST-004 | PASS | Only the single exported async function is instrumented |
| SCH-001 | PASS | Span name `commit_story.journal.ensure_directory` follows `commit_story.<domain>.<operation>` convention; registered in `agent-extensions.yaml` |
| SCH-002 | PASS | `commit_story.journal.file_path` pre-registered in `semconv/attributes.yaml` under `registry.commit_story.journal`; no new attribute declarations |
| SCH-003 | PASS | `commit_story.journal.file_path` declared `type: string`; set from `filePath` string parameter — type match correct |
| CDQ-001 | PASS | `finally { span.end() }` pattern; no redundant `span.end()` in try block |
| CDQ-002 | PASS | No unnecessary nested spans |
| CDQ-003 | PASS | No PII; attribute is a journal directory path |
| CDQ-005 | PASS | No empty catch blocks |
| CDQ-007 | PASS | `filePath` is a required non-optional function parameter; always a string at the call sites (`ensureDirectory` is only called with concrete path strings from `getJournalEntryPath` and similar) |

**Failures**: None

**CDQ-007 note**: The confirmed Datadog runtime value `commit_story.journal.file_path: "journal/entries/2026-06/2026-06-18.md"` is a project-relative path — not an absolute filesystem path. This is the correct format: `ensureDirectory` receives a path computed by `getJournalEntryPath` which produces relative paths from the journal root. No path-shortening or transformation needed.

**Trace supplement**: Span `commit_story.journal.ensure_directory` confirmed in Datadog (2026-06-18T20:25:31Z). Runtime value `commit_story.journal.file_path: "journal/entries/2026-06/2026-06-18.md"` — project-relative path, confirming correct attribute value format. Span status Unset (no error). Parent span present in the journal-save pipeline.
