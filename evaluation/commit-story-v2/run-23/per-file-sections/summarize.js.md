### 8. commands/summarize.js (3 spans, 2 attempts)

> **Correction**: The original per-file evaluation agent reported 4 spans, assuming a top-level `runSummarize` orchestrator with three sub-command spans. The source has 3 spans across 3 separate exported entry points: `runSummarize` (daily, span `run_daily`), `runWeeklySummarize` (span `run_weekly`), `runMonthlySummarize` (span `run_monthly`). There is no orchestrator span. The PR body confirms 3 spans.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — all 3 span catch blocks call `recordException` + `setStatus(ERROR)` before rethrowing |
| NDS-004 | PASS |
| NDS-007 | PASS — no graceful-degradation catch patterns in this file |
| COV-001 | PASS — `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize` are the 3 exported async entry points; all 3 have spans |
| COV-003 | PASS |
| COV-004 | PASS — all 3 exported async functions instrumented; 4 sync helpers (`isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`) correctly skipped per RST-001 |
| COV-005 | PASS — `commit_story.summarize.dates_count` (input array length, set before loop) and `commit_story.summarize.force` (boolean flag) are input attributes; `*_summaries_generated` set as output attributes |
| RST-001 | PASS — sync helpers correctly not instrumented |
| RST-004 | PASS |
| SCH-001 | PASS — all 3 span names (`run_daily`, `run_weekly`, `run_monthly`) registered in `agent-extensions.yaml` |
| SCH-002 | PASS — all attribute keys registered in `agent-extensions.yaml`; no invented near-synonyms |
| SCH-003 | **FAIL** — `commit_story.summarize.daily_summaries_generated`, `weekly_summaries_generated`, `monthly_summaries_generated` are declared `type: string` in `agent-extensions.yaml` but set as bare integer `result.generated.length` (no `String()` conversion). `auto-summarize.js` correctly uses `String(result.generated.length)` for the same attributes. |
| CDQ-001 | PASS — no redundant span.end() calls |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `dates`/`weeks`/`months` arrays are passed-in parameters (not external sources); `result.generated.length` is safe (returned object with guaranteed `generated` array) |

**Failures**: SCH-003 — `*_summaries_generated` attributes declared `type: string` but set as bare integers. Three attributes affected: `daily_summaries_generated`, `weekly_summaries_generated`, `monthly_summaries_generated`. The same attributes in `auto-summarize.js` are correctly wrapped with `String()`. Fix is a one-line change per attribute in `summarize.js`.

**Structure note**: Despite the name, `runSummarize` handles the daily summary path (span `commit_story.summarize.run_daily`). The three functions are separate CLI entry points dispatched by the caller, not a hierarchy. `showSummarizeHelp()` is sync and correctly not instrumented.
