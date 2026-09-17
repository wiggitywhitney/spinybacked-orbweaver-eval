### 10. utils/summary-detector.js (9 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original logic/structure preserved verbatim across all 9 functions; only `startActiveSpan` wrapping and `setAttribute` calls added. |
| API-001 | PASS — `tracer.startActiveSpan(name, async (span) => {...})` used consistently; correct `@opentelemetry/api` imports (`trace`, `SpanStatusCode`), one module-level `trace.getTracer('commit-story')`. |
| NDS-004 | PASS — return values/shapes unchanged (e.g. `findUnsummarizedDays` still returns the filtered array, `getSummarizedWeeks` still returns a `Set`). |
| NDS-006 | PASS — multi-line literals, early-return guards, and destructuring preserved as-is. |
| NDS-007 | PASS — the graceful-degradation inner `catch {}` blocks (readdir-not-found paths) correctly get no `recordException`/`setStatus`; only the outer per-span catch does. |
| COV-001 | PASS — all 5 exported functions (`getDaysWithEntries`, `findUnsummarizedDays`, `getDaysWithDailySummaries`, `findUnsummarizedWeeks`, `findUnsummarizedMonths`) have entry-point spans. |
| COV-003 | PASS — every one of the 9 outer catches calls `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` before `span.end()` in `finally`. |
| COV-004 | PASS — all 4 unexported async helpers (`getSummarizedDays`, `getSummarizedWeeks`, `getSummarizedMonths`, `getWeeksWithWeeklySummaries`) got their own spans (same improvement over run-26 noted in run-27). |
| COV-005 | PASS — upstream counts are set via `setAttribute` immediately after the await and before the early-return guard in `findUnsummarizedDays`, `findUnsummarizedWeeks`, and `findUnsummarizedMonths`, so the short-circuit path still carries context. |
| RST-001 | PASS — `getTodayString` and `getNowDate` are pure synchronous helpers with no I/O and are correctly left unwrapped. |
| RST-004 | PASS — every span has `finally { span.end(); }`. |
| SCH-001 | PASS — 9 new span names registered under `commit_story.journal.*`, dotted-notation compliant. Three registry-suggested names were already claimed by earlier files in this run; the agent invented non-colliding alternatives rather than reusing a taken name. |
| SCH-002 | PASS — the four new attributes (`unsummarized_days_count`, `unsummarized_weeks_count`, `summarized_months_count`, `unsummarized_months_count`) each capture a genuinely distinct "gap" or "existing-total" concept not covered by the pre-existing `entries_count`/`daily_summaries_count`/`weekly_summaries_count`/`months_generated_count` keys — justification is specific per-key, not generic. |
| SCH-003 | **FAIL** — confirmed by line-by-line check of every `setAttribute` call against the registry. All four newly-declared keys are registered `type: int` but are **all** emitted via `String(...)`: `commit_story.summary.unsummarized_days_count` (`String(result.length)`), `commit_story.summary.unsummarized_weeks_count` (`String(unsummarized.length)`), `commit_story.summary.summarized_months_count` (`String(months.size)`), `commit_story.summary.unsummarized_months_count` (`String(unsummarized.length)`). This is a **wider** recurrence of the RUN26-1/RUN27-3 int/`String()` mismatch than run-27's version of this same file, which only mis-typed one key (`weeks_count`) — here it's systematic across all four newly-invented keys, while every pre-existing key (`entries_count`, `daily_summaries_count`, `weekly_summaries_count`) is correctly set as a bare number. The pattern is consistent: the agent applied a `String()`-wrapping habit specifically (and only) to attributes it invented itself in this file. |
| CDQ-001 | PASS — `span.end()` always reached via `finally`. |
| CDQ-002 | PASS — status codes set only on genuine error paths, not on expected/graceful ones. |
| CDQ-003 | PASS — try/catch/finally structure correct on every span. |
| CDQ-005 | PASS — no excessive/high-cardinality attributes; only scalar counts. |
| CDQ-006 | PASS — no `isRecording()` guards are present anywhere in this file, and none are required: every `setAttribute` call sets a trivial, already-computed value (`dates.length`, `dates.size`, `weeks.size`, `entryDays.length`, or a literal `0`), never a method call, string transformation, or external-source read. All 5 spans are also COV-001 entry points, independently exempt. |
| CDQ-007 | PASS (log/report advisories are false positives — see note) |

**Failures**: SCH-003 only (see above; four `int`-declared keys, all `String()`-wrapped).

**CDQ-007 note (log/report discrepancy)**: The `.instrumentation.md` report and run log both list 8 CDQ-007 "PII attribute name or raw filesystem path" advisories, at lines matching plain count-attribute `setAttribute` calls. Direct source inspection confirms this file **sets no `commit_story.context.repo_path`, no `file_path`, and no PII/path attribute of any kind** — every attribute in the file is a numeric count. This is a meaningful contrast with run-27's version of this same file, which genuinely failed CDQ-007 on 9 raw `repo_path` occurrences — that attribute is simply absent from run-28's instrumentation of this file. The advisory text (generic "prefer basename()..." boilerplate) does not correspond to anything in the actual committed code — the automated advisory appears to be stale/mistargeted output, not a real finding.

**Notes**: The four unexported async helpers continue to get full COV-004 coverage (matches run-27's "notable improvement over run-26"). Multi-attribute reuse across the file is consistent and semantically accurate. The one substantive, code-confirmed defect is the SCH-003 `String()`-wrapping of all four new count attributes — this is the same underlying validator/generation-time gap (no check catches `setAttribute(key, String(...))` against a numeric-typed key) documented as recurring uncaught in `summarize.js` this same run, now shown to recur here too, more widely (4 keys, not 2).

**Historical note**: `run-summary.md` and `failure-deep-dives.md` originally stated "No SCH-003/String() issue found" for this file, based on a log-narrative-only check. Both have since been corrected to reflect the 4 confirmed SCH-003 violations found here via direct source inspection — see their own correction notes for detail; no further action needed against those documents from this section.

**Datadog MCP query**: Not run (optional per task instructions; no MCP query executed this pass).
