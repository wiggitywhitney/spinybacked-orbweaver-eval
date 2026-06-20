### managers/journal-manager.js (2 spans)

**Spans**: `commit_story.journal.save_journal_entry`, `commit_story.journal.discover_reflections`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | All `setAttribute` calls unconditional; `vcs.ref.head.revision` and `commit_story.commit.files_changed` inside `if (commit.shortHash)` / `if (commit.filesChanged !== undefined)` guards — guards are on reading the field, not on calling setAttribute |
| API-001 | **PASS** | `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | Both outer catches call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrow |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | `saveJournalEntry` inner `catch {}` (empty, handles missing reflection file for duplicate check) and `discoverReflections` inner catches (`catch { continue }` in readdir and readFile loops) are graceful-degradation paths correctly left unmodified |
| COV-001 | **PASS** | `saveJournalEntry` and `discoverReflections` are the exported async entry points — both have spans |
| COV-003 | **PASS** | Both outer catches record and rethrow; inner catches are NDS-007 paths |
| COV-004 | **PASS** | Both exported async functions instrumented; `formatTimestamp`, `formatJournalEntry`, and all unexported sync helpers correctly skipped per RST-001 and RST-004 |
| COV-005 | **PASS** | `save_journal_entry`: `entry_date`, `file_path`, `commit.message`, `vcs.ref.head.revision`, `commit.files_changed` (conditional on field presence); `discover_reflections`: `time_window_start`, `time_window_end`, `entries_count` — both spans carry ≥3 domain attributes |
| RST-001 | **PASS** | `formatTimestamp`, `formatJournalEntry`, `extractFilesFromDiff`, `countDiffLines`, `formatReflectionsSection`, `parseReflectionEntry`, `parseTimeString`, `parseReflectionsFile`, `isInTimeWindow`, `getYearMonthRange` all correctly skipped |
| RST-004 | **PASS** | All unexported helpers skipped; only the 2 exported async functions instrumented |
| SCH-001 | **PASS** | Both span names registered in `agent-extensions.yaml` as new extensions this run |
| SCH-002 | **PASS** | All attributes pre-registered in `semconv/attributes.yaml` — `commit_story.journal.entries_count` used for reflection count (semantically appropriate); zero new attributes |
| SCH-003 | **PASS** | Date via `.toISOString().split('T')[0]` (string); path as raw string; message via `.split('\n')[0]` (string); `files_changed` from `commit.filesChanged` (integer); `entries_count` from `reflections.length` (integer) |
| CDQ-001 | **PASS** | `finally { span.end() }` on both spans |
| CDQ-002 | **PASS** | No unnecessary span nesting |
| CDQ-003 | **PASS** | `commit.message` is truncated to first line before setAttribute — reduces noise; `file_path` is a journal output path, not PII |
| CDQ-005 | **PASS** | No empty catch blocks in committed spans; inner catches are NDS-007 graceful-degradation paths |
| CDQ-007 | **PASS** | Run-12 CDQ-007 vectors (`commit.hash`, `commit.author`) absent in run-25; `vcs.ref.head.revision` guarded by `if (commit.shortHash)`, `files_changed` guarded by `if (commit.filesChanged !== undefined)` — no nullable-field risk; run-24 verdict sustained |

**Failures**: None

**Trace supplement**: Trace data is from run-24 instrumentation (`service.instance.id: bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3`, 2026-06-19), not run-25. Querying `service:commit-story @service.instance.id:bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3 resource_name:commit_story.journal.save_entry`: run-24 used span name `save_entry` — confirmed present in Datadog with `file_path`, `quotes_count: 0` (docs-only commit). Run-25 uses `save_journal_entry` (new extension); no runtime evidence for the new name yet.

**CDQ-007 history**: Run-12 flagged CDQ-007 FAIL for nullable commit fields (`commit.hash`, `commit.author`). Run-24 confirmed the fix — those fields no longer set on spans. Run-25 continues the fix: the attribute set changed again (no `quotes_count`, adds `commit.message`, `vcs.ref.head.revision`, `files_changed`) but all new attributes are guarded appropriately. CDQ-007 PASS sustained for third consecutive run.

**Coverage delta vs run-24**: Span name changed from `save_entry` (run-24) to `save_journal_entry` (run-25) — both registered as schema extensions in their respective runs. Attribute set on `save_journal_entry` differs from run-24's `save_entry`: run-24 had `commit.timestamp`, `file_path`, `quotes_count`; run-25 has `entry_date`, `file_path`, `commit.message`, `vcs.ref.head.revision`, `files_changed` — different coverage choices, no `quotes_count`. COV-005 passes in both runs. Net attribute count is higher in run-25 (5 vs 3).

**CDQ-007 advisory (agent-reported, non-failure)**: The agent noted that `file_path` is set to the raw filesystem path because `path.basename` is not imported (only `join`). Using raw path per CDQ-007 import constraint; this is an advisory observation, not a failure.
