### generators/summary-graph.js (6 spans)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | All attributes set unconditionally; counts use `?.length ?? 0` (always int); string params guaranteed by callers |
| API-001 | **PASS** | `@opentelemetry/api` only |
| NDS-006 | **PASS** | All 6 outer catches record exception, set ERROR status, and rethrow |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | 3 inner graceful-degradation catches (one per node function) return fallback state objects without rethrowing — preserved exactly as-is per NDS-007 |
| COV-001 | **PASS** | 3 exported async entry points (`generateDailySummary`, `generateWeeklySummary`, `generateMonthlySummary`) and their 3 internal node functions all have spans |
| COV-003 | **PASS** | All 6 outer catches record exception and rethrow |
| COV-004 | **PASS** | All 6 async functions instrumented; synchronous helpers (`getModel`, `resetModel`, `formatEntriesForSummary`, `parseSummarySections`, `cleanDailySummaryOutput`, graph builders, etc.) correctly skipped per RST-001 |
| COV-005 | **PASS** | Daily spans: `entry_date` + `entries_count`; weekly spans: `week_label` + `daily_summaries_count`; monthly spans: `month_label` + `weekly_summaries_count` — each span carries ≥2 domain attributes |
| COV-006 | **PASS** | Manual spans wrap the entire node body including `getModel(0.7).invoke(...)` (auto-instrumented LangChain call); outer span is the parent of any LangChain child spans |
| RST-001 | **PASS** | Sync helpers (`formatEntriesForSummary`, `parseSummarySections`, `cleanDailySummaryOutput`, and weekly/monthly equivalents) correctly skipped |
| RST-004 | **PASS** | All 3 node functions (`dailySummaryNode`, `weeklySummaryNode`, `monthlySummaryNode`) are exported; unexported sync helpers skipped per RST-001 |
| SCH-001 | **PASS** | All 6 span names registered in `agent-extensions.yaml` — validator advisory findings are false positives per established rubric precedent |
| SCH-002 | **PASS** | 5 new attributes registered with distinct semantics: `entries_count` (rendered journal entries, not session messages), `week_label` (ISO week identifier string, not a date), `daily_summaries_count` (daily summaries being aggregated), `month_label` (month identifier string), `weekly_summaries_count` (weekly summaries being aggregated); no near-synonyms with base schema attributes |
| SCH-003 | **PASS** | Integer counts sourced from `.length` via `?.length ?? 0` (always int); string labels are string parameters; `entry_date` from `date` param (string); all types match schema declarations |
| CDQ-001 | **PASS** | `finally { span.end() }` on all 6 spans |
| CDQ-002 | **PASS** | No unnecessary nesting |
| CDQ-003 | **PASS** | No PII; date strings and count integers only |
| CDQ-005 | **PASS** | No empty catches; all 3 inner catches return structured fallback state objects |
| CDQ-006 | **PASS** | No CDQ-006 violations; SCH-001 validator advisories are false positives per rubric precedent (newly registered span names) |
| CDQ-007 | **PASS** | All counts guarded with `?.length ?? 0`; string label params are always strings at the call site; `entry_date` from the `date` string parameter |
| CDQ-008 | **PASS** | `trace.getTracer('commit-story')` consistent with all other files |

**Failures**: None

**Trace supplement**: The captured trace (`service.instance.id: bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3`, 2026-06-19) is from run-24 instrumentation (git SHA `bb08c9c` on run-24 instrument branch), not run-25 — Whitney had not yet invoked commit-story-v2 on the run-25 branch at capture time. The `commit_story.journal.generate_daily_summary` span from the run-24 organic run appears in Datadog with `entries_count: 33` and `entry_date: "2026-06-18"`, confirming the attribute shape and naming convention used in run-25 is stable. Run-25 spans for this file (`daily_summary_node`, `weekly_summary_node`, `monthly_summary_node`) have not been observed organically; the summary pipeline was not exercised in the captured run (only a journal-entry generation run was active).

**COV-006 assessment**: All three node functions (`dailySummaryNode`, `weeklySummaryNode`, `monthlySummaryNode`) have their manual span wrapping the entire node body, which contains the `getModel(0.7).invoke(...)` LangChain call. The outer `startActiveSpan` callback encloses the LangChain invocation, so manual spans are correctly positioned as parents of auto-instrumented LangChain child spans. COV-006 passes.

**Coverage delta observation vs run-24**: Run-25 expands attribute coverage on the node functions. Run-24 used `entries_count`, `week_label`, and `month_label`. Run-25 retains those and adds `daily_summaries_count` (on `weeklySummaryNode` and `generateWeeklySummary`) and `weekly_summaries_count` (on `monthlySummaryNode` and `generateMonthlySummary`), giving each span a pair of domain attributes. This is a coverage improvement over run-24's single-attribute approach on the node functions.
