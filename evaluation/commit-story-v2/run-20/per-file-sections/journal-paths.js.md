### 6. utils/journal-paths.js (1 span, 1 attempt)

Single span on `ensureDirectory` (sole exported async). Eleven pure sync utilities correctly skipped per RST-001. 1-attempt success, stable across runs 16–20 — this file is a benchmark for clean single-function instrumentation.

The agent correctly identified `ensureDirectory` as the only candidate. The remaining twelve exports (`getYearMonth`, `getDateString`, `getJournalEntryPath`, `getReflectionPath`, `getContextPath`, `getReflectionsDirectory`, `parseDateFromFilename`, `getJournalRoot`, `getISOWeekString`, `getSummaryPath`, `getSummariesDirectory`) are all synchronous path-building utilities with no I/O, exempted by RST-001. The span name `commit_story.journal.ensure_directory` is declared as a new schema extension in `agent-extensions.yaml` (SCH-001 pass). The `commit_story.journal.file_path` attribute is registered in `semconv/attributes.yaml` under `registry.commit_story.journal` with `type: string`, matching the string `filePath` parameter (SCH-002 and SCH-003 pass). The try/catch/finally pattern is correct: `recordException` + `ERROR` status on failure, `span.end()` in `finally`, error rethrow preserved. No original control flow was altered.

CDQ-007 advisory from runs 16–19 (raw full path rather than `path.basename`) carries forward unchanged — `filePath` is a full path string and `path.basename` is not imported. This is a known, documented limitation rather than a failure: the attribute value is non-null, has the correct type, and the schema definition does not constrain path format.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — new catch rethrows; original had no catch |
| NDS-006 | PASS |
| API-001 | PASS |
| COV-001 | PASS — `ensureDirectory` has span |
| COV-003 | PASS — recordException + ERROR + rethrow in catch; span.end() in finally |
| COV-004 | PASS — sole exported async; 11 sync utilities skipped |
| COV-005 | PASS — `commit_story.journal.file_path` captures the filePath argument |
| RST-001 | PASS — 11 sync path-building helpers correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` declared as extension |
| SCH-002 | PASS — `commit_story.journal.file_path` is registered in attributes.yaml |
| SCH-003 | PASS — `filePath` is string, matches `type: string` |
| CDQ-001 | PASS — span.end() in finally |
| CDQ-007 | ADVISORY — raw full path set unconditionally; `path.basename` not imported; known limitation from runs 16–19, same behavior |

**Failures**: None.
