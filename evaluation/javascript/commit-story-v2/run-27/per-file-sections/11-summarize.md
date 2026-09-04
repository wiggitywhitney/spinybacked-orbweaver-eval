### 11. commands/summarize.js (3 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original parsing/loop/generation logic in `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize` unchanged; only span wrapping, try/catch/finally, and `setAttribute` calls added |
| API-001 | PASS — uses `@opentelemetry/api` (`trace`, `SpanStatusCode`) exclusively, no SDK imports |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — inner per-item catch blocks (per-date/week/month loop failures, the empty `access(summaryPath)` existence-check catch) correctly left unmodified as expected-condition/graceful-degradation catches; only the outer span-wrapper catch gets `recordException`/`setStatus(ERROR)` |
| COV-001 | PASS — `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize` all wrapped as entry-point spans (`commit_story.journal.run_summarize`, `run_weekly_summarize`, `run_monthly_summarize`) |
| COV-003 | PASS — each span has an outer try/catch/finally calling `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})`, span always ends in `finally` |
| COV-004 | PASS — the six sync helpers (`isValidDate`, `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `showSummarizeHelp`) correctly get no spans; only the three async entry points are spanned |
| COV-005 | PASS — `dates_count`/`weeks.length`/`months_count`, `force`, `errors_count`, `entry_count`, `repo_path` are all real domain values, not placeholders |
| RST-001 | PASS — same six synchronous utilities correctly skipped |
| RST-004 | PASS — no redundant/duplicate spans |
| SCH-001 | PASS — no advisory duplicate-span-name flag appears in the log for this file (unlike run-26, where the validator flagged `run_weekly_summarize`/`run_monthly_summarize` as possible duplicates of `run_summarize`) |
| SCH-002 | ADVISORY — unresolved data-contract issue carried over from run-26, partially fixed: `runMonthlySummarize` now uses its own attribute (`commit_story.summary.months_count`), but `runWeeklySummarize` still calls `span.setAttribute('commit_story.journal.dates_count', weeks.length)` (line ~437) — reusing the "dates" attribute to hold a **week** count. A consumer reading `commit_story.journal.dates_count` on the weekly span sees a mislabeled value. This is the same semantic-duplicate collapse run-26 flagged, now half-resolved. |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS — no PII/sensitive data attributes |
| CDQ-003 | PASS |
| CDQ-005 | PASS — `force` set as native boolean, not stringified |
| CDQ-007 | PASS — `basePath` set raw as `commit_story.context.repo_path` with no `path.basename` transform; consistent with the codebase convention (no `path` import in this file, so no transform utility is "already available") |

**Failures**: None per the validator's rule check, but flagging the same class of issue run-26 raised: `commit_story.journal.dates_count` on `runWeeklySummarize` holds a count of ISO week strings, not dates — a naming/semantics mismatch that SCH-002's rule-check does not catch.

**Attribute-count verification**: The log reports "3 spans, 3 attributes, 3 attempts" and the schema-extensions block lists exactly 3 *new* attribute keys (`commit_story.journal.dates_count`, `commit_story.journal.force`, `commit_story.summary.months_count`) alongside 3 new span-name extensions — confirming `attributesCreated` counts only newly-registered schema keys, not total `setAttribute` calls. Reading the source directly, the actual attribute-setting is much higher: 13 total `setAttribute` calls across the 3 spans, using 6 distinct attribute keys (`repo_path`, `dates_count`, `force`, `errors_count`, `entry_count`, `months_count`) — 3 of those 6 keys (`repo_path`, `errors_count`, `entry_count`) were already registered and reused, not new. So run-summary.md's "new-attribute count down sharply (9→3)" is accurate as a measure of *new schema registrations*, but is not a measure of instrumentation density — this file sets roughly the same volume of real attributes as before, just against a smaller set of newly-registered keys.

**Datadog trace supplement**: Queried `service:commit-story @service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd resource_name:*summarize*` (instrument-branch evidence — this instance id matches the confirmed instrument-branch instance per `trace-artifact.md`'s `vcs.ref.head.revision` correction) and got 6 matches, but all 6 belong to the neighboring `summary-detector.js` file's span names (`get_summarized_months`, `find_unsummarized_months`, `get_summarized_weeks`, `find_unsummarized_weeks`, `find_unsummarized_days`, `get_summarized_days`) — not this file. A follow-up query specifically for this file's own span names (`commit_story.journal.run_summarize`, `run_weekly_summarize`, `run_monthly_summarize`) returned 0 spans in the last 30 days. No trace evidence — instrument-branch or main-branch — exists for `src/commands/summarize.js` specifically.
