### 6. managers/journal-manager.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS — `saveJournalEntry` and `discoverReflections` are the two exported async functions; both have spans |
| COV-003 | PASS |
| COV-004 | PASS — `formatTimestamp` and `formatJournalEntry` are exported but synchronous (skipped per RST-001); all unexported helpers are sync |
| COV-005 | PASS — `save_entry` span: `vcs.ref.head.revision`, `commit_story.commit.timestamp`, `commit_story.journal.file_path`; `discover_reflections` span: `commit_story.context.time_window_start/end`, `commit_story.journal.entries_count` |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — both span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `commit_story.journal.entries_count` is registered in `agent-extensions.yaml` (confirmed via `summary-manager.js` agent-extensions check; same key registered by summary-manager.js instrumentation pass). Note: semantically imprecise for a `discover_reflections` span (the value is a reflections count, not a journal entries count), but the key is registered and the usage does not constitute a near-synonym violation per SCH-002 definition. |
| SCH-003 | PASS — `vcs.ref.head.revision` is string (shortHash); `commit_story.commit.timestamp` is string via `.toISOString()`; `commit_story.journal.file_path` is string; `time_window_start/end` are strings via `.toISOString()`; `entries_count` is int |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | **PASS (regression fixed)** — Run-21 failure attributes are gone. `save_entry` span now uses `commit.shortHash` (always-present structural field) and `commit.timestamp.toISOString()` (always a Date). The run-21 offenders — `commit.hash` and `commit.author` (both nullable, truthy guards had been stripped) — do not appear in the instrumented source. |

**Failures**: None

**CDQ-007 fix confirmed**: Run-21 failed CDQ-007 (unconditional setAttribute from nullable `commit.hash` and `commit.author`). Run-23 replaces these with `commit.shortHash` (guaranteed present — used in duplicate detection logic) and `commit.timestamp.toISOString()` (always a Date object). CDQ-007 PASS; the run-21 NDS-003 tension also resolved since no truthy guard removal was needed.

**SCH-002 quality note**: `commit_story.journal.entries_count` is used for a reflections count in the `discover_reflections` span. The attribute is registered (by summary-manager.js instrumentation) and the usage is not a near-synonym violation, but it is semantically imprecise. A more precise key (`commit_story.journal.reflections_count`) would better describe the value. This is a quality observation, not a canonical failure.

**Trace evidence**: Datadog span `commit_story.journal.save_entry` — `vcs.ref.head.revision: 5bfc917`, `commit_story.commit.timestamp: 2026-06-10T12:31:08.000Z`, `commit_story.journal.file_path: journal/entries/2026-06/2026-06-10.md`. Span `commit_story.journal.discover_reflections` — `entries_count: 0`, time window attrs present.
