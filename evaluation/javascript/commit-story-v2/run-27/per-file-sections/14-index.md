### 14. index.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None. Two entry points got spans: `commit_story.cli.handle_summarize` wraps the exported `handleSummarize` CLI subcommand handler, and `commit_story.cli.main` wraps the exported `main` orchestration function — both declared as schema extensions under an invented `cli` category, since none of the existing categories (`ai`, `context`, `git`, `journal`, `mcp`) fit CLI dispatch. The six synchronous, unexported utility functions (`parseArgs`, `showHelp`, `isGitRepository`, `isValidCommitRef`, `validateEnvironment`, `getPreviousCommitTime`) were correctly skipped per RST-001/RST-004. The inner `try/catch` around `triggerAutoSummaries` in `main` was left untouched (no `recordException`/`setStatus`) per NDS-007, since it's a graceful-degradation catch that logs a warning and does not rethrow — control flow preserved. All 5 attributes set (`commit_story.journal.force`, `commit_story.journal.weeks_count`, `commit_story.summary.months_count`, `commit_story.journal.dates_count`, `vcs.ref.head.revision`) are pre-registered schema attributes (`attributesCreated: 0`), and `parsed.force ?? false` correctly guards the nullable case. `process.exit()` calls in the file's bottom-level runner happen inside `.then()/.catch()` after `main()` resolves, outside the span callback — no CDQ-001 concern.

**Note on "Matches run-26" claim**: Verified against source — this run's `main` span does **not** set a `commit_story.journal.file_path` attribute on `savedPath` at all (only `logger.info({ path: savedPath }, ...)` logs it, off-span). Run-26's version of this file did set that attribute and drew a CDQ-007 advisory for using a raw path instead of a basename. This run's instrumentation is narrower on that point — no such attribute, hence no CDQ-007 advisory — so the file is not an exact match to run-26; it is a clean full PASS across all rules where run-26 had one advisory.

**Datadog trace supplement**: Found one matching span via **instrument-branch evidence** (`service:commit-story @service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd`) — `resource_name:commit_story.cli.main` (trace `3b42cf07b106223acd3e9a8e2ac52ead`, 2026-09-03T12:23:13Z, status `ok`). `vcs.ref.head.revision` on the span is the literal string `"HEAD"`, matching the source's default before resolution. No matching span for `commit_story.cli.handle_summarize` was found in the same window — consistent with the dry-run invocation exercising the default `main` path only, not the `summarize` subcommand.
