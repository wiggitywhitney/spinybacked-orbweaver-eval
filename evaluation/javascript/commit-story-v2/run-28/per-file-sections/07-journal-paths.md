### 7. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — single span name `commit_story.journal.ensure_directory` uses consistent `commit_story.<domain>.<action>` dotted notation |
| API-001 | PASS — imports `trace, SpanStatusCode` from `@opentelemetry/api`; `tracer.startActiveSpan` used correctly with `span.end()` in `finally` |
| NDS-006 | PASS — no span-kind or context-propagation violations |
| NDS-004 | PASS — control flow unchanged; original `mkdir(dir, { recursive: true })` call preserved verbatim inside the span |
| NDS-007 | PASS — the single catch records the exception then rethrows (`throw error`); no swallowed-error branch altered |
| COV-001 | PASS — `ensureDirectory` (line 88), the sole exported async/I/O function in the file, is instrumented as the entry point |
| COV-003 | PASS — `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` both present in the catch block before rethrow |
| COV-004 | PASS — the 11 remaining exported functions (`getYearMonth`, `getDateString`, `getJournalEntryPath`, `getReflectionPath`, `getContextPath`, `getReflectionsDirectory`, `parseDateFromFilename`, `getJournalRoot`, `getISOWeekString`, `getSummaryPath`, `getSummariesDirectory`) are pure synchronous path builders with no I/O — correctly left unspanned |
| COV-005 | PASS — `commit_story.journal.file_path` is a meaningful domain attribute set on the entry-point span |
| RST-001 | PASS — instrumentation report and agent notes explicitly enumerate all 11 sync functions and justify skipping spans on each (no I/O, no async work) |
| RST-004 | PASS — no unexported async helper left unspanned; moot for this file |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` correctly declared as a schema extension (`span.commit_story.journal.ensure_directory`); no existing schema span covers directory-creation operations |
| SCH-002 | PASS — reuses the pre-existing registered key `commit_story.journal.file_path` rather than inventing a new one; `attributesCreated: 0` per the instrumentation report |
| SCH-003 | PASS — `commit_story.journal.file_path` is declared `type: string` in `semconv/attributes.yaml` (brief: "Output file path for the journal entry"); the code sets a string value (`filePath.split(/[\\/]/).filter(Boolean).pop() ?? ''`) — types match |
| CDQ-001 | PASS — exactly one `span.end()` call, in `finally`, no redundant calls |
| CDQ-002 | PASS — `SpanStatusCode.ERROR` set consistently on the exception path |
| CDQ-003 | PASS — error recorded via `recordException` then rethrown; not silently swallowed |
| CDQ-005 | PASS — attribute is set unconditionally, before the I/O call (`mkdir`) |
| CDQ-006 | PASS — the guard (`if (span.isRecording()) { span.setAttribute(...) }`) is present in the actual code; also independently exempt since `ensureDirectory` is a COV-001 entry-point span |
| CDQ-007 | **PASS — RESOLVED since run-27.** Line 92: `span.setAttribute('commit_story.journal.file_path', filePath.split(/[\\/]/).filter(Boolean).pop() ?? '')`. This sanitizes `filePath` down to its basename via inline split/filter/pop, the same import-free pattern landed in spiny-orb commit `5a0636c` ("add import-free path fallback for CDQ-007") and confirmed applied elsewhere in this run (`journal-manager.js`, `index.js`). This directly reverses run-27's FAIL for this exact file, which shipped the raw, unsanitized `filePath` value and self-acknowledged the gap ("basename isn't imported... I'll keep the raw value"). In run-28, the agent's thinking log and instrumentation-report notes both cite CDQ-007 explicitly and apply the inline sanitization instead of declining it. |

**Failures**: None.

**Regression note**: This file's CDQ-007 status flips from FAIL (run-27, spiny-orb issue #1035 — raw absolute/relative path shipped, fix self-identified but declined) to PASS (run-28 — inline basename-equivalent sanitization applied). This confirms the cross-file fix (`5a0636c`) generalizes to this file, not just the two files (`journal-manager.js`, `index.js`) originally cited.

**Datadog trace supplement**: Not queried (optional step) — the source-level evidence (line 92 of the committed file) is unambiguous.
