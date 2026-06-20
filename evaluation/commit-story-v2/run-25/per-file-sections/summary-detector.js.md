// ABOUTME: Per-file evaluation section for src/utils/summary-detector.js — run-25.

### 13. utils/summary-detector.js (9 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — All attributes are set from direct function parameters or `.length` on arrays guaranteed non-null by prior validation (`weekLabel` is a validated format string, `monthLabel` is a `YYYY-MM` string, `directoryPath` is a provided string). No unsafe coercions or optional-chain-without-guard patterns. |
| NDS-004 | PASS — No new exports added; no existing export signatures altered. |
| NDS-006 | PASS — OTel import is additive; no original imports modified or removed. |
| NDS-007 | PASS — Two-layer catch pattern preserved. Inner catch (each individual file read) performs graceful degradation and does not record a span error — it is intentional fallback behavior. Outer catch (wrapping the full span) records exception + ERROR status and re-throws. This accurately models the function's intent: a single file parse failure is not a fatal failure for the function. Control flow ordering unchanged. |
| COV-001 | PASS — All 9 async functions (5 exported + 4 unexported) receive spans: `checkDailySummaryExists`, `checkWeeklySummaryExists`, `checkMonthlySummaryExists`, `listDailySummaries`, `listWeeklySummaries`, `listMonthlySummaries`, `getLatestSummary`, `parseSummaryMetadata`, `getSummaryContent`. |
| COV-003 | PASS — All 9 outer catch blocks call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before re-throwing. |
| COV-004 | PASS — All 5 exported async functions are instrumented: `checkDailySummaryExists`, `checkWeeklySummaryExists`, `checkMonthlySummaryExists`, `listDailySummaries`, `listWeeklySummaries`, `listMonthlySummaries`. (The remaining 4 spans cover unexported helpers, which is coverage beyond the minimum requirement.) |
| COV-005 | PASS — All spans carry ≥1 domain attribute from the commit_story namespace. Summary existence spans carry `week_label` or `month_label`; list spans carry `entries_count`; `parseSummaryMetadata` and `getSummaryContent` carry `file_path`. |
| RST-001 | PASS — Synchronous helper functions (path manipulation, regex matching, date extraction) are correctly uninstrumented. All 9 spanned functions are genuinely async I/O operations (filesystem reads, directory listings). |
| RST-004 | PASS — 4 unexported async helpers (`getLatestSummary`, `parseSummaryMetadata`, `getSummaryContent`, and `listMonthlySummaries` — which is also exported) are instrumented. This is not a violation of RST-004 (which prohibits spanning unexported *sync* helpers). Unexported async helpers with meaningful I/O benefit from tracing; spiny-orb correctly chose to span them. |
| SCH-001 | PASS — All 9 span names follow the `commit_story.journal.*` namespace and are declared in `agent-extensions.yaml`. |
| SCH-002 | PASS — Attribute names are semantically unambiguous. `week_label` (ISO week identifier), `month_label` (YYYY-MM string), `entries_count` (count of summary entries found), `file_path` (path to a summary file) — each maps unambiguously to its domain concept. |
| SCH-003 | PASS — All attribute types match schema declarations: `week_label` → string ✓, `month_label` → string ✓, `entries_count` → int (set as `.length`) ✓, `file_path` → string ✓. |
| CDQ-001 | PASS — All 9 spans use `startActiveSpan` with a `finally { span.end(); }` block. No code path exits the span body without ending the span, including the two-layer catch paths. |
| CDQ-002 | PASS — No attribute is set on a potentially null or undefined value. All attributes are derived from validated function parameters or `.length` on arrays. |
| CDQ-003 | PASS — File paths recorded are journal summary paths (e.g., `journal/summaries/weekly/2026-W12.md`). No credentials, tokens, or PII appear in attributes. |
| CDQ-005 | PASS — 9 distinct async operations receive 9 distinct spans. No operation is double-counted; no span wraps another span at this nesting level. |
| CDQ-007 | PASS — No raw absolute filesystem paths with user home directory fragments. No optional chaining without guard on attribute values. |

**Failures**: None

**Coverage delta observation**: This file declares **0 new schema extension attributes** — all attributes used (`week_label`, `month_label`, `entries_count`, `file_path`) were already registered by earlier files in the same run. This is expected and correct. The attributes are present and correctly typed on all 9 spans; the zero-delta simply means summary-detector.js reuses the established schema vocabulary rather than extending it. This is NOT a COV-005 failure.

The two-layer catch pattern (inner graceful-degradation, outer span error recording) demonstrates sophisticated instrumentation. The agent correctly identified that an inner catch that logs and continues is intentional behavior — not a bug — and preserved it without wrapping it in an additional span-level error recording that would have falsely reported partial-read scenarios as fatal failures.
