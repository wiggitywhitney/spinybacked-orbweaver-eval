### 9. src/commands/summarize.js (3 spans, 2 attempts)

Three exported async entry points are instrumented: `runSummarize`, `runWeeklySummarize`, and `runMonthlySummarize`. Run-20 matches run-19's all-PASS outcome, with one attempt saved (3→2) and one meaningful improvement: CDQ-007 null guards (`if (dates != null)`, `if (weeks != null)`, `if (months != null)`) added before `.length` calls on each destructured array parameter. One notable quirk carried forward: `runMonthlySummarize` sets `commit_story.summary.weeks_count` instead of the registered `commit_story.summary.months_count` — the agent notes explain this as intentional schema minimization, and `weeks_count` is registered so no SCH-002 violation occurs, but the semantic mismatch is worth noting.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no structural changes to original logic; only span wrappers and attribute calls added |
| NDS-004 | PASS — function signatures unchanged; `import { trace, SpanStatusCode }` and `const tracer` added at module level only |
| NDS-005 | PASS — inner per-item catches in all three functions preserved verbatim; graceful-degradation catches push to `result.failed`/`result.errors` without rethrowing; silent `catch { // Doesn't exist, proceed }` inside `runSummarize`'s `access()` check preserved unchanged; outer `catch(error)` blocks rethrow |
| NDS-006 | PASS — all JSDoc blocks and inline comments preserved, including `// Shouldn't happen since we checked above, but handle gracefully` and `// Doesn't exist, proceed` |
| API-001 | PASS — `@opentelemetry/api` only; `trace` and `SpanStatusCode` used correctly |
| COV-001 | PASS — all 3 exported async functions (`runSummarize`, `runWeeklySummarize`, `runMonthlySummarize`) have entry-point spans |
| COV-003 | PASS — all 3 spans have outer `catch(error)` with `recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + rethrow |
| COV-004 | PASS — all 3 exported async functions instrumented; 5 exported sync functions (`isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `showSummarizeHelp`) and 1 unexported sync helper (`isValidDate`) correctly skipped |
| COV-005 | PASS — `dates_count`/`weeks_count`/`weeks_count` (used for months) capture batch input size; `generated_count` captures outcome count post-loop; `force` flag captured on all spans |
| RST-001 | PASS — `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `showSummarizeHelp` all synchronous with no I/O; correctly skipped |
| RST-004 | PASS — `isValidDate` is unexported sync; no unexported async functions in this file |
| SCH-001 | PASS — `commit_story.commands.run_summarize`, `commit_story.commands.run_weekly_summarize`, `commit_story.commands.run_monthly_summarize` all registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS — all attributes registered in `semconv/agent-extensions.yaml`: `commit_story.summary.dates_count` (int), `commit_story.summary.force` (boolean), `commit_story.summary.weeks_count` (int), `commit_story.summary.generated_count` (int) |
| SCH-003 | PASS — `dates_count`/`weeks_count` from `.length` on arrays (int); `force` from boolean param (boolean); `generated_count` from `.length` on result array (int) |
| CDQ-001 | PASS — `span.end()` in `finally` block on all 3 spans |
| CDQ-007 | PASS — `if (dates != null)`, `if (weeks != null)`, `if (months != null)` guards added before `.length` access on each destructured array; `force` has default value `false` and needs no guard |

**Failures**: None.
