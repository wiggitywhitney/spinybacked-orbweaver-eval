### 5. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — catch calls `recordException` + `setStatus(ERROR)` before rethrowing |
| NDS-004 | PASS |
| NDS-007 | PASS — no graceful-degradation catches |
| COV-001 | PASS — `ensureJournalDirectory` is the only exported async function and has span `commit_story.journal.ensure_directory` |
| COV-003 | PASS |
| COV-004 | PASS — `ensureJournalDirectory` is the only async function; `getJournalEntryPath`, `getJournalSummaryPath`, `getWeekLabel`, `getMonthLabel` are all sync |
| COV-005 | PASS — `commit_story.journal.file_path` (the directory argument) set on the span |
| RST-001 | PASS — `getJournalEntryPath`, `getJournalSummaryPath`, `getWeekLabel`, `getMonthLabel` are sync exports correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `commit_story.journal.file_path` registered in `attributes.yaml` |
| SCH-003 | PASS — `file_path` is the directory path string argument; always a string |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `dirPath` is the function argument; always a string at the call site |

**Failures**: None

**Trace evidence**: Datadog span `commit_story.journal.ensure_directory` — `commit_story.journal.file_path: 'journal/entries/2026-06/2026-06-10.md'` (the directory argument passed in, which is the full journal entry path used for directory derivation), duration 173µs. Span appears as a child of `commit_story.index.main`.
