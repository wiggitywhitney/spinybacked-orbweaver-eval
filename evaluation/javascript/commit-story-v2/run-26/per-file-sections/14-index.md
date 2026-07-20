### 14. index.js (2 spans, 1 attempt)

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
| CDQ-007 | ADVISORY |

**Failures**: None. One advisory: CDQ-007 fired on `span.setAttribute('commit_story.journal.file_path', savedPath)` (src/index.js:460 in the instrumented file) — `savedPath` is a raw filesystem path rather than a basename. The instrumentation report itself flags this as lower severity ("fix when the code will run in a context where the basename utility is already imported"), so it's advisory, not a hard failure. No PII-name variant of CDQ-007 applies here — the six synchronous utility functions (`parseArgs`, `showHelp`, `isGitRepository`, `isValidCommitRef`, `validateEnvironment`, `getPreviousCommitTime`) were correctly skipped per RST-001/RST-004, and both entry points (`handleSummarize`, `main`) got spans declared as schema extensions (`span.commit_story.commands.handle_summarize`, `span.commit_story.index.main`) with clear justification. The inner auto-summarize try/catch in `main` was correctly left unmodified per NDS-007 since it's a graceful-degradation catch with no rethrow.

**Datadog trace supplement**: Found exactly one `commit_story.index.main` trace for `service:commit-story @service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6` (trace `3722a802e3cf1bc1c0bc5428509d2ce7`, 2026-07-18T19:10:19Z). Its `git.commit.sha` is `8bea39229d24fc03910e3d9f27c99a65da816cac` — matching the SHA cited in the task as unrelated main-branch dogfooding traffic, **not** run-26's instrument branch tip (`0b2c5474c7715e4cfde89caa4768acabd98423c6`). This resolves the dual-SHA ambiguity: the live trace data is from ordinary dogfooding runs on `main`, not from this eval run's instrumented code. That said, the trace's shape corroborates the static analysis — `commit_story.context.messages_count: 2` and `commit_story.journal.file_path: journal/entries/2026-07/2026-07-18.md` are both present and populated exactly as the source describes, including the raw (non-basename) file path underlying the CDQ-007 advisory. `vcs.ref.head.revision` on this trace is the literal string `"HEAD"` (the unresolved CLI arg default), not a resolved commit SHA — expected given `commitRef` defaults to `'HEAD'` and is set on the span before any resolution occurs.
