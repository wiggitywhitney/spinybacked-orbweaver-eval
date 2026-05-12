### 28. utils/summary-detector.js (9 spans, 1 attempt)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — inner catch blocks that return `[]`, `new Set()`, or `continue` (no rethrow) are left unmodified; no `recordException`/`setStatus(ERROR)` added to graceful-degradation catches. Matches NDS-007 spec-correct behavior for expected filesystem conditions. |
| API-001 | PASS |
| COV-001 | PASS — all five exported async functions (getDaysWithEntries, findUnsummarizedDays, getDaysWithDailySummaries, findUnsummarizedWeeks, findUnsummarizedMonths) receive entry-point spans |
| COV-003 | PASS — outer try/catch in all nine instrumented functions has `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| COV-004 | PASS — all nine async functions have spans; the four unexported async helpers (getSummarizedDays, getSummarizedWeeks, getSummarizedMonths, getWeeksWithWeeklySummaries) were deliberately instrumented per agent notes; both sync utilities (getTodayString, getNowDate) are correctly skipped |
| COV-005 | ADVISORY — spans record count attributes (dates_count, daily_summaries_count, weekly_summaries_count, months_count) but no registry-defined attributes from `commit_story.journal.*` apply at the operation level for these detector functions; counts are the appropriate domain signal |
| RST-001 | PASS — getTodayString and getNowDate are unexported, sync, no I/O; correctly skipped |
| RST-004 | PASS — the four unexported async helpers were instrumented despite RST-004 exemption, per COV-004 pre-scan directive that explicitly required spans on all async functions; this is a correct override per the agent's reasoning |
| SCH-001 | PASS — all nine span names registered as extensions in agent-extensions.yaml; all match the pattern `commit_story.journal.<function_name>` in snake_case dotted notation; no semantic duplicates with existing registry entries |
| SCH-002 | PASS — four attribute keys used (dates_count, daily_summaries_count, weekly_summaries_count, months_count) are all registered as extensions in agent-extensions.yaml prior to this run; no new attribute extensions needed; use of `weekly_summaries_count` in both getSummarizedWeeks and findUnsummarizedWeeks and getWeeksWithWeeklySummaries is a reuse of the registered key (semantically appropriate in each context — the attribute captures a summary file count regardless of caller) |
| SCH-003 | PASS — all four attribute values are integer counts (`.length` or `.size`); registered types are `int`; no type mismatches |
| CDQ-001 | PASS — all nine spans use `startActiveSpan` callback pattern; span lifecycle handled by the callback; `span.end()` in `finally` block in each outer try/catch/finally |
| CDQ-005 | PASS — all nine spans use `startActiveSpan`, not `startSpan` |
| CDQ-007 | PASS — all `setAttribute` calls use `.length` or `.size` on known array or Set values that cannot be null in context (they are the result of local variable construction within the same span scope); no nullable property access without guards |
| CDQ-009 | NOT APPLICABLE — no `!== undefined` guards around setAttribute; all attribute values are `.length`/`.size` on locally-constructed collections |
| CDQ-010 | NOT APPLICABLE — no string-method calls on property accesses in setAttribute arguments |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` at module level uses the canonical tracer name |

**Failures**: None

**Notes**:

The agent made a deliberate choice to instrument all four unexported async helpers (getSummarizedDays, getSummarizedWeeks, getSummarizedMonths, getWeeksWithWeeklySummaries) despite RST-004's general exemption. The pre-scan analysis explicitly directed spans on all async functions in this file, and the agent correctly cited this directive in its notes. This produces a rich 9-span trace tree for the detector module — the orchestrators (findUnsummarizedDays, findUnsummarizedWeeks, findUnsummarizedMonths) become the parents of their helper spans, giving callers visibility into how detector traversals decompose into inner reads.

The `weekly_summaries_count` attribute key is reused in three functions with different semantics: in `getSummarizedWeeks` it counts existing weekly summary files; in `findUnsummarizedWeeks` it counts the result set of weeks needing summaries; in `getWeeksWithWeeklySummaries` it counts the sorted array of week labels. The agent notes acknowledge this reuse explicitly as the "closest registered attribute for a week-level count." SCH-002 passes because all three uses share the same key from the registry and the Weaver validator accepted them. The semantic blurring (a single key measuring three different things) is worth noting as a minor design observation but does not constitute a rubric failure — attribute key reuse is not prohibited when the type matches.
