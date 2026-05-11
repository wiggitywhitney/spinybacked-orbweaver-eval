# Run-16 Summary

**Date**: 2026-05-11
**Duration**: 2h 36m 46.7s
**spiny-orb version**: 1.0.0 (SHA dc5a2aa, main branch)
**Node**: v25.8.0
**Branch**: `spiny-orb/instrument-1778526749797`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/68 (auto-created, sixth consecutive)

---

## File Results

| Metric | Count |
|--------|-------|
| Total files | 30 |
| Committed | 10 |
| Failed | 3 |
| Partial | 3 |
| Correct skips | 14 |
| Skipped (0 spans, LLM not called) | 0 |

**Tokens**: 387.2K input, 549.6K output (794.2K cached)

---

## Committed Files (10)

| File | Spans | Attributes | Attempts |
|------|-------|------------|---------|
| src/collectors/claude-collector.js | 1 | 0 | 2 |
| src/collectors/git-collector.js | 1 | 0 | 2 |
| src/generators/summary-graph.js | 6 | 3 | 2 |
| src/integrators/context-integrator.js | 1 | 0 | 3 |
| src/mcp/server.js | 1 | 1 | 1 |
| src/utils/journal-paths.js | 1 | 0 | 1 |
| src/managers/journal-manager.js | 2 | 0 | 3 |
| src/commands/summarize.js | 3 | 1 | 3 |
| src/utils/summary-detector.js | 9 | 1 | 1 |
| src/managers/auto-summarize.js | 3 | 0 | 2 |

**Total committed spans**: ~28

---

## Partial Files (3)

| File | Spans | Skipped Functions | Reason |
|------|-------|-------------------|--------|
| src/generators/journal-graph.js | 3 | technicalNode | NDS-003 oscillation (error count 1→5 on fresh regen) |
| src/utils/commit-analyzer.js | 0 | — | NDS-005: try/catch stripped from reassembly output |
| src/managers/summary-manager.js | 7 | generateAndSaveWeeklySummary, generateAndSaveMonthlySummary | null parsed_output (max_tokens hit: 16384 output tokens) |

**Total partial spans**: ~10

---

## Failed Files (3)

| File | Reason |
|------|--------|
| src/mcp/tools/context-capture-tool.js | null parsed_output (max_tokens: 16384 output tokens) |
| src/mcp/tools/reflection-tool.js | null parsed_output (max_tokens: 16384 output tokens) |
| src/index.js | Anthropic API call failed: terminated |

---

## Correct Skips (14)

Files with no instrumentable functions (pure sync utilities, no async I/O):
- src/generators/prompts/guidelines/accessibility.js
- src/generators/prompts/guidelines/anti-hallucination.js
- src/generators/prompts/guidelines/index.js
- src/generators/prompts/sections/daily-summary-prompt.js
- src/generators/prompts/sections/dialogue-prompt.js
- src/generators/prompts/sections/monthly-summary-prompt.js
- src/generators/prompts/sections/summary-prompt.js
- src/generators/prompts/sections/technical-decisions-prompt.js
- src/generators/prompts/sections/weekly-summary-prompt.js
- src/integrators/filters/message-filter.js
- src/integrators/filters/sensitive-filter.js
- src/integrators/filters/token-filter.js
- src/traceloop-init.js
- src/utils/config.js

---

## Primary Goal: COV-003 on summary-detector.js

✅ **CONFIRMED FIXED**

`summary-detector.js` committed with 9 spans including `getDaysWithEntries` (`get_days_with_entries`) and `getDaysWithDailySummaries` (`get_days_with_daily_summaries`). Both have outer error-recording catch blocks consistent with `findUnsummarizedDays`, `findUnsummarizedWeeks`, and `findUnsummarizedMonths` in the same file. Inner ENOENT catches remain unchanged (NDS-007 applied).

---

## Secondary Goals

| Goal | Result |
|------|--------|
| journal-graph.js attempt count | 3 attempts — did NOT hold at 1 from run-15 |
| Cost monitoring | Token data available; dollar cost not surfaced by CLI |
| IS SPA-001 structural | Expected fail (INTERNAL span count will exceed limit) |
| Push/PR success | ✅ PR #68 auto-created (sixth consecutive) |

---

## Live-Check

**Status**: OK
**Spans received**: 543
**Advisory findings**: 3,615

Note: Live-check report JSON was printed to terminal output at end of run — UX issue, should not be surfaced to user (see lessons-for-prd17.md).

---

## Notable New Findings

1. **null parsed_output pattern** (RUN16-1, new): Files 18, 19, and 2 functions in file 26 all failed with "null parsed_output". Log shows at least some attempts hit `max_tokens` (16,384 output tokens). Likely root cause: very complex files generating oversized LLM responses that exceed the structured output token limit.

2. **journal-graph.js 3 attempts** (RUN15-1 secondary): The 1-attempt result from run-15 did not hold. Back to 3 attempts with technicalNode skipped (NDS-003 oscillation). Attempt count improvement not confirmed as stable.

3. **Live-check JSON blob** (RUN16-2, new): The live-check compliance report JSON is dumped to terminal stdout at end of run. Poor UX — thousands of lines of JSON printed to user's terminal.

4. **commit-analyzer.js NDS-005 partial** (RUN16-3, new): NDS-005 reassembly failure stripped a try/catch block even though the file needed 0 spans. Function-level fallback ran despite pre-scan saying "no instrumentable functions."
