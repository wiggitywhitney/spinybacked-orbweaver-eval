### 9. commands/auto-summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — all 3 span catch blocks call `recordException` + `setStatus(ERROR)` before rethrowing |
| NDS-004 | PASS |
| NDS-007 | PASS — per-item catch loops (for-of with inner try/catch to skip failed dates) left unmodified |
| COV-001 | PASS — `runAutoSummarize` is the exported async entry point with span `commit_story.auto_summarize.trigger_auto_summaries` |
| COV-003 | PASS |
| COV-004 | PASS — `runAutoSummarize`, `runAutoWeeklySummaries`, `runAutoMonthlySummaries` are the 3 exported async functions; all 3 instrumented |
| COV-005 | PASS — `trigger_auto_summaries` span: `commit_story.summarize.weekly_summaries_generated`, `commit_story.summarize.monthly_summaries_generated` (both set via `String(result.generated.length)`); `trigger_auto_weekly` and `trigger_auto_monthly` spans: respective `_generated` counts |
| RST-001 | PASS — no sync-only exported helpers |
| RST-004 | PASS |
| SCH-001 | PASS — all 3 span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS — all attribute keys registered; `commit_story.summarize.*_generated` keys reused from `summarize.js` namespace; no new extensions invented |
| SCH-003 | PASS — `weekly_summaries_generated` and `monthly_summaries_generated` set via `String(result.generated.length)` — consistent with `type: string` declaration in `agent-extensions.yaml` |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `result.generated?.length ?? 0` (optional chaining with nullish coalescing) used before `String()` conversion; no unsafe attribute calls |

**Failures**: None

**SCH-003 PASS contrast**: `auto-summarize.js` correctly uses `String(result.generated.length)` for `*_summaries_generated` attributes, matching the `type: string` declaration in `agent-extensions.yaml`. This contrasts with `summarize.js` which omits the `String()` wrapper. The schema declaration is consistent; only the implementation differs.

**Trace evidence**: Datadog trace `2e5e91fecc58831fb2b8d4a12e474ca1` (`service.instance.id: 050d24b0-abe6-4350-9bcd-b842bc2bc57b`) — 3 spans confirmed: `commit_story.auto_summarize.trigger_auto_summaries` (duration ~2ms, no summaries generated on dry-run), `trigger_auto_weekly` (0 dates found), `trigger_auto_monthly` (0 dates found).
