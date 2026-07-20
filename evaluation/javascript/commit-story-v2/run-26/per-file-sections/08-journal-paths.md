### 8. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — full try/catch/finally with `recordException`, `setStatus(ERROR)`, `span.end()` in finally |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS — `ensureDirectory` is the only exported async I/O function; gets a span as a service entry point |
| COV-003 | PASS |
| COV-004 | PASS — 11 pure synchronous path-builder functions correctly left unspanned |
| COV-005 | PASS — `commit_story.journal.file_path` is a meaningful domain attribute, corroborated live (see below) |
| RST-001 | PASS — sync functions (getYearMonth, getDateString, getJournalEntryPath, etc.) explicitly skipped per RST-001 |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` correctly declared as a schema extension |
| SCH-002 | ADVISORY — reused existing `commit_story.journal.file_path` attribute rather than inventing a near-synonym, but its schema brief ("Output file path for the journal entry") doesn't cleanly describe a directory-creation input path; agent itself flagged the fit as only "semantically close enough" |
| SCH-003 | PASS — string type, matches |
| CDQ-001 | PASS — no redundant span.end() |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS — attribute set unconditionally before the I/O call |
| CDQ-007 | FAIL — `filePath` set as a raw filesystem path (e.g. `journal/summaries/daily/2026-07-17.md`) with no `basename()` applied; agent self-documented this in the report as a known CDQ-007 limitation (missing `basename` import) rather than fixing it |

**Failures**: CDQ-007 — raw filesystem path stored in `commit_story.journal.file_path` without basename transformation, self-acknowledged by the agent as a known limitation rather than resolved (e.g., by importing `basename` from `node:path`, which was available but not used).

**Datadog trace supplement**: Confirmed via `search_datadog_spans` (service:commit-story, service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6) — a live `commit_story.journal.ensure_directory` span exists with exactly one custom attribute, `commit_story.journal.file_path: journal/summaries/daily/2026-07-17.md`, matching the source-level finding of 1 span / 1 attribute (note: run-summary.md's "0 attrs" figure appears to be a counting-methodology artifact, not accurate — the source and live trace both show 1 attribute). The trace's `vcs.ref.head.revision` on a sibling span is `0b2c5474c7715e4cfde89caa4768acabd98423c6`, matching the tip of `spiny-orb/instrument-1784302707982` exactly, confirming this trace was captured while running the run-26 instrumented branch (the resource-level `git.commit.sha` attribute showing the older merge commit `8bea392` appears to be a stale/separately-sourced resource attribute, not the actual running commit).
