### 25. managers/journal-manager.js (2 spans, 2 attempts)

**Structure**: Two exported async functions (`saveJournalEntry`, `discoverReflections`) and one exported synchronous function (`formatJournalEntry`), plus ten unexported synchronous helpers. Agent notes confirm NDS-003 fixes on attempt 2: restored multi-line `countDiffLines` if-condition, `saveJournalEntry` parameter list, and `isSemanticDup` assignment to match exact original line structure.

**Key change vs run-17**: `discoverReflections` sets `commit_story.journal.quotes_count` for `reflections.length`. The schema defines this attribute as "Number of developer quotes extracted for the entry" — reflections discovered in a time window are indeed developer quotes/reflections, making the semantic fit reasonable. However, the brief is oriented toward journal entry generation, not reflection discovery. `commit_story.journal.reflections_count` (registered in run-17's `semconv/agent-extensions.yaml`) was used in run-17's journal-manager but is not present in this run's extensions file — this run reuses the base registry key instead. Evaluated below.

**CDQ-007 on `commit.hash`**: `saveJournalEntry` guards `vcs.ref.head.revision` with `if (commit.hash != null)` before setAttribute. This is the correct pattern. Run-17 had the same guard. CDQ-007 advisory on raw `entryPath` (full path, no basename) carries over from runs 16 and 17 — same CDQ-007 import constraint applies.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — committed code passed validator on attempt 2; multi-line structures restored to match original line structure; all original logic preserved |
| NDS-004 | PASS — multi-line `saveJournalEntry` parameter signature (sections, commit, reflections, basePath, options) preserved exactly across lines |
| NDS-005 | PASS — three original catch blocks preserved: `saveJournalEntry`'s ENOENT swallow, `discoverReflections`'s unreadable-file catch and missing-directory catch; all three are untouched |
| NDS-006 | PASS — all original comments preserved |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'`; no SDK or vendor-specific imports |
| COV-001 | PASS — `saveJournalEntry` and `discoverReflections` (both exported async, both filesystem I/O) have entry-point spans |
| COV-003 | PASS — both spans have outer catch with `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error` before `finally { span.end() }` |
| COV-004 | PASS — both exported async I/O functions have spans; `formatJournalEntry` is exported but purely synchronous, correctly skipped per RST-001; all ten unexported helpers are synchronous |
| COV-005 | PASS — `saveJournalEntry`: `commit_story.journal.file_path` (entryPath), `commit_story.commit.timestamp` (ISO string), `vcs.ref.head.revision` (guarded by null check). `discoverReflections`: `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.journal.quotes_count` (reflections.length). |
| RST-001 | PASS — all ten synchronous functions skipped |
| RST-004 | PASS — no unexported async functions exist; exemption not needed |
| SCH-001 | PASS — `commit_story.journal.save_entry` and `commit_story.journal.discover_reflections` registered as schema extensions; both follow `commit_story.<category>.<operation>` naming convention; no semantic duplicates |
| SCH-002 | **FAIL** — `commit_story.journal.quotes_count` is defined in the base registry as "Number of developer quotes extracted for the entry" (journal generation context); in `discoverReflections` it is set to the count of reflections discovered in a time window (a distinct operation — reading markdown files, not generating journal sections). The semantic mismatch is the same class of issue flagged in run-17's `summary-graph.js` SCH-002 failure: a registered key whose defined meaning does not align with the value being recorded. The correct key would be `commit_story.journal.reflections_count` (used in run-17's journal-manager) or a new extension, but neither appears in this run's extensions file. |
| SCH-003 | PASS — `commit_story.commit.timestamp` via `.toISOString()` (string); `time_window_start/end` via `.toISOString()` (string); `quotes_count` is `reflections.length` (int, matches `type: int`); `file_path` is a raw string |
| CDQ-001 | PASS — both spans use `startActiveSpan` callback with `finally { span.end() }` |
| CDQ-002 | SKIP — rule not in evaluated set |
| CDQ-003 | SKIP — rule not in evaluated set |
| CDQ-005 | PASS — `tracer.startActiveSpan` used for both spans |
| CDQ-006 | SKIP — rule not in evaluated set |
| CDQ-007 | ADVISORY — raw `entryPath` used for `commit_story.journal.file_path` (full filesystem path, no basename); `path.basename` not imported (only `join` from `node:path`); same known limitation as prior runs. `commit.hash != null` guard is correctly present before `vcs.ref.head.revision` setAttribute. `reflections` is initialized as `const reflections = []` and never reassigned — `.length` access is safe. |

**Failures**: SCH-002 — `commit_story.journal.quotes_count` semantically defined for journal entry generation (AI-extracted quotes); used here for reflection discovery count (a different operation class). Correct attribute would be `commit_story.journal.reflections_count` or a new extension.
