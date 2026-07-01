### 4. generators/summary-graph.js (6 spans, 2 attempts)

> **Correction**: The original per-file evaluation agent reported 4 spans (3 attempts). The PR body (authoritative, generated from committed source) records 6 spans (2 attempts). The structure is 3 pairs of outer function + LangGraph node: `generate_daily_summary`/`daily_summary_node`, `generate_weekly_summary`/`weekly_summary_node`, `generate_monthly_summary`/`monthly_summary_node`. There is no top-level `generateSummary` orchestrator span. Rule evaluations below are updated to reflect the correct 6-span structure.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — catch blocks in each `generate{Daily,Weekly,Monthly}Summary` call `recordException` + `setStatus(ERROR)` before rethrowing; node-level catches are NDS-007 graceful-degradation (no rethrow) |
| NDS-004 | PASS |
| NDS-007 | PASS — graceful-degradation catches in all three LangGraph node functions left unmodified |
| COV-001 | PASS — 3 exported async functions (`generateDailySummary`, `generateWeeklySummary`, `generateMonthlySummary`) each have spans |
| COV-003 | PASS — each outer function catch has `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS — all 6 async functions instrumented: 3 outer exported functions + 3 LangGraph node functions |
| COV-005 | PASS — outer spans record context-specific attributes: `entries_count` (daily), `week_label` (weekly), `month_label` + `daily_summaries_count` (monthly); node spans record `gen_ai.operation.name`, `gen_ai.model.id`, and conditional `gen_ai.usage.*` |
| COV-006 | PASS — manual spans wrap application logic above auto-instrumented LangChain model.invoke() calls; context propagation preserved |
| RST-001 | PASS — sync formatting/parsing helpers correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — all 6 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS — registered attributes: `commit_story.journal.entries_count`, `week_label`, `daily_summaries_count`, `month_label`; `gen_ai.*` from OTel semconv; no invented keys |
| SCH-003 | PASS — `entries_count`, `daily_summaries_count` are integers matching `type: int`; string attributes match schema; `gen_ai.usage.*` integers with null-guard |
| CDQ-001 | PASS — no redundant span.end(); async callbacks use `finally { span.end() }` per issue #915 pattern |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `entries_count`/`daily_summaries_count` guarded with `!= null` before use; `gen_ai.usage.*` guarded with null-check before `setAttribute` |

**Failures**: None. 2 attempts.

**SCH-002 self-correction confirmed**: Agent initially emitted `weekly_summaries_count` in `monthlySummaryNode` (a near-synonym of `daily_summaries_count` for the same semantic), then corrected to `daily_summaries_count` in the monthly context. This is the contrast case to summary-detector.js — the agent caught and self-corrected the semantic duplicate without the span being skipped. The `failure-deep-dives.md` documents both the summary-detector.js failure case and this summary-graph.js success case.

**Trace evidence**: No spans in Datadog for this run (commit invoked `commit` subcommand — journal summary pipeline not triggered). Instrumentation verified via static analysis of the committed source only.
