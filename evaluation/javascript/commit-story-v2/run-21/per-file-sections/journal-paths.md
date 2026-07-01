### 11. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — `const tracer = trace.getTracer('commit-story')` initialized at module level |
| API-001 | PASS — `tracer.startActiveSpan(...)` used |
| NDS-006 | PASS — catch block calls `recordException` + `setStatus ERROR` then `throw error` |
| NDS-004 | PASS — `span.end()` in finally block |
| NDS-005 | PASS — `span.setStatus({ code: SpanStatusCode.ERROR })` in catch |
| COV-001 | PASS — `ensureDirectory` is the only exported async fn and has a span |
| COV-003 | PASS — `await mkdir(...)` executes inside the span |
| COV-004 | PASS — `ensureDirectory` is the only exported async fn |
| COV-005 | PASS — `commit_story.journal.file_path` captures the `filePath` argument (the path being ensured) |
| COV-006 | N/A — no branching logic paths |
| RST-001 | PASS — all 11 sync helpers correctly skipped: `getYearMonth`, `getDateString`, `getJournalEntryPath`, `getReflectionPath`, `getContextPath`, `getReflectionsDirectory`, `parseDateFromFilename`, `getJournalRoot`, `getISOWeekString`, `getSummaryPath`, `getSummariesDirectory` |
| RST-004 | PASS — only `trace.getTracer()` at module level, which is correct |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` registered in agent-extensions.yaml |
| SCH-002 | PASS — `file_path` is in base semconv |
| SCH-003 | PASS — `file_path` is string; `filePath` is a string parameter |
| CDQ-001 | PASS — attribute value comes from the `filePath` parameter, not hardcoded |
| CDQ-002 | PASS — filesystem path is not PII |
| CDQ-003 | PASS — single attribute, appropriately scoped |
| CDQ-005 | PASS — `setAttribute` called before `await mkdir(...)` |
| CDQ-007 | MINOR — `filePath` has no null guard before `setAttribute`; if a caller passes null/undefined the SDK records the string `"null"` or `"undefined"`. Callers always pass a string in practice, so this is a known limitation rather than a defect. Agent noted this explicitly. |

**Failures**: None

**Notes**: This file was correctly skipped in all prior runs (classified as sync-only). Run-21 correctly identifies `ensureDirectory` as the sole exported async function and instruments it. The 11 sync path helpers (`getYearMonth`, `getDateString`, etc.) are all correctly left uninstrumented per RST-001. The CDQ-007 observation is consistent with agent notes — raw filesystem path used as-is, no `basename` import, and no null guard. Not a failure given runtime usage patterns.
