### 12. src/utils/summary-detector.js (5 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | ADVISORY |
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

**Failures**: None. Two advisory findings (documented in `src/utils/summary-detector.instrumentation.md`), neither blocking:
- COV-004 (×4): unexported helpers `getSummarizedDays`, `getSummarizedWeeks`, `getSummarizedMonths`, `getWeeksWithWeeklySummaries` are async but lack spans. These are internal single-purpose file-read helpers called only by the instrumented exported functions, arguably covered by RST-001's "no I/O beyond a single readdir, context propagation covers unexported internal helpers" exemption — but the agent's own advisory output leaves this unresolved rather than claiming the exemption explicitly.
- CDQ-007 (×8, all on `commit_story.journal.base_path`): raw filesystem path attribute rather than a basename — flagged by the agent itself as "lower severity — fix when basename utility already imported." In this file `basePath` defaults to `.` and is caller-supplied, so realistic risk is low, but it is technically a raw path per the rule's letter.

**Fix verification (0→3 attrs)**: The 3 new schema-extension attributes are `commit_story.journal.base_path`, `commit_story.journal.unsummarized_weeks_count`, and `commit_story.journal.unsummarized_months_count` (per both `spiny-orb-output.log` and the committed `.instrumentation.md`). Two other `setAttribute` calls in the final code (`entries_count`, reused twice; `summarize.dates_count`) reuse attribute names already present in the registry from other files, so they don't count as *new* schema extensions even though they appear in the code.

The validation journey shows this was a genuine, validator-driven improvement rather than a lucky guess: Attempt 1 failed with 12 blocking errors (NDS-003 Code Preserved ×6, SCH-002 Attribute Keys Match Registry ×6); Attempt 2 failed with 12 SCH-002 errors; Attempt 3 still had 7 SCH-002 errors; the agent then fell back to function-level instrumentation (5/5 functions) and landed on a smaller, registry-conformant attribute set. This is the same mechanism (iterative attribute-key correction + function-level fallback as a safety net) that let `summarize.js` climb from 6→9 attrs in the same run, rather than something specific to this file. Compared to run-25's total collapse to 0 attrs, this is a real fix: the agent no longer abandons attribute emission entirely when SCH-002 conflicts arise — it prunes/reuses to reach a passing state instead of giving up. It is not fully complete, though — the "reused" attributes (`entries_count`, `dates_count`) reflect the agent settling for coarser, less-specific attribute names to satisfy the registry, similar to the `summarize.js` pattern noted in the log ("pragmatic approach is to reuse ... even if it's not semantically perfect").

**Datadog trace supplement**: One span found for `commit_story.journal.find_unsummarized_weeks` (`service:commit-story`, `service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6`) with `commit_story.journal.base_path: "."` and `commit_story.journal.unsummarized_weeks_count: "0"`. However its `git.commit.sha` is `8bea39229d24fc03910e3d9f27c99a65da816cac` — the known unrelated main-branch dogfooding revision, not run-26's instrument branch tip (`0b2c5474c7715e4cfde89caa4768acabd98423c6`). This trace is not run-26 eval traffic; no run-26-specific trace data for this file was found in Datadog.
