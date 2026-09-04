### 12. utils/summary-detector.js (9 spans)

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
| SCH-003 | **FAIL** (corrected — see below) |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | **FAIL** (corrected — see below) |

**Failures**: SCH-003 — `commit_story.journal.weeks_count` is declared `type: int` in `semconv/agent-extensions.yaml` (confirmed: `spiny-orb-output.log` line 1054, "I need `commit_story.journal.weeks_count` as a new int attribute"), but the code sets it via `String(...)` at all three call sites (`getWeeksWithWeeklySummaries`, `findUnsummarizedWeeks`, and a third site — confirmed by direct source inspection: `span.setAttribute('commit_story.journal.weeks_count', String(weeks.size))` etc.). The live trace below confirms the mismatch reaches Datadog as a quoted string (`weeks_count: "11"`). This section originally scored SCH-003 PASS despite the type-inconsistency evidence already present in the paragraphs below — a self-contradiction within this section, caught in CodeRabbit review of this document; corrected here.

CDQ-007 (×9 — one occurrence per span, all on `commit_story.context.repo_path`): every span sets this from the raw `basePath` parameter without a basename transformation. The `.instrumentation.md` report flags this itself, noting `path.basename` isn't imported in the file — the same self-identified-and-declined pattern already scored FAIL for `claude-collector.js` and `context-integrator.js` in this run, where the identical shared attribute is confirmed carrying a real absolute local path in live traces. This section originally scored CDQ-007 ADVISORY on the reasoning that `basePath` defaults to `.` and real-world risk is low — but `basePath` carries no structural guarantee against an absolute value (unlike `journal-manager.js`'s `file_path`, whose sole call site hardcodes `basePath = '.'`), so consistent scoring requires FAIL here too. Corrected, per CodeRabbit review of this document.

Notable improvement over run-26: all four unexported async helpers (`getSummarizedDays`, `getSummarizedWeeks`, `getSummarizedMonths`, `getWeeksWithWeeklySummaries`) got their own spans this run rather than being left as a COV-004 advisory gap — full coverage, no unresolved internal-helper question this time.

**Attribute-count verification**: The framing in `run-summary.md` ("attribute count down (3→1)") holds up, but only as a count of *new schema-extension attributes* — it is not the total attribute-setting activity in the file. Verified directly from source: all 9 spans call `setAttribute` exactly twice each (one `commit_story.context.repo_path` input, one output count), for 18 total `setAttribute` calls using 4 distinct attribute keys — `commit_story.context.repo_path`, `commit_story.journal.dates_count`, `commit_story.journal.weeks_count`, and `commit_story.summary.months_count`. Of those four, only `commit_story.journal.weeks_count` is a genuinely new schema extension (confirmed against both the log's "Schema extensions" block and the `.instrumentation.md` report, which explicitly states `attributesCreated = 1`); the other three keys were already registered and are reused. So "1" is correct for new schema extensions, matching the note's intent, but a reader could misread "attribute count" as total attributes emitted, which is 4 (or 18 call sites) — worth keeping that distinction explicit going forward.

This SCH-003 failure is self-consistent across all three call sites (always `String(...)`, never a bare number for `weeks_count`), unlike a one-off slip — the agent applied a systematic (but wrong) `String()`-wrapping rule to this one attribute while leaving `dates_count` and `months_count` as raw numbers throughout the same file. This is the same class of RUN26-1-style int/`String()` mismatch already confirmed fixed in `journal-manager.js` this run — its recurrence here (a different file, same run) shows the underlying validator/generation-time gap (no check catches `setAttribute(key, String(...))` against a numeric-typed key) is not resolved project-wide, only avoided in the specific case run-26 originally flagged.

**Datadog trace supplement**: Found matching spans for all 9 function names.
- **Instrument-branch evidence** (`service:commit-story`, `service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd`, trace `3b42cf07b106223acd3e9a8e2ac52ead`, timestamp 2026-09-03T12:23:31): `commit_story.journal.get_weeks_with_weekly_summaries` (`repo_path: "."`, `weeks_count: "11"`), `commit_story.journal.get_summarized_months` (`months_count: 5`), `commit_story.journal.find_unsummarized_months` (`months_count: 0`). Attribute keys, values, and types (string for `weeks_count`, integer for `months_count`) match the committed source exactly.
- **Main-branch evidence (corroborating, not direct)**: additional matching spans for all 9 span names found under other `service.instance.id` values (`e61ed017-ddc9-4bef-88d3-f47dd2d57883`, `8b597d10-8905-4b09-80f9-4de97b823654`) on 2026-09-03/04, showing the same attribute shapes (`dates_count` as int, `weeks_count` as string) consistently across runs — corroborating but not run-27 instrument-branch traffic.
