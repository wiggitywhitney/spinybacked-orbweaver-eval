# Run Summary — Run-11

**Date**: 2026-03-30
**Started**: 2026-03-30T05:52:51.011Z
**Completed**: 2026-03-30T06:34:03.439Z
**Duration**: 2472.4s (41.2 minutes)
**Branch**: spiny-orb/instrument-1774849971011
**Target repo**: commit-story-v2 proper
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/60

---

## Results

| Metric | Value |
|--------|-------|
| Files processed | 30 |
| Committed | 13 |
| Failed | 0 |
| Partial | 0 |
| Correct skips | 17 |
| Skipped | 0 |
| Input tokens | 164.0K |
| Output tokens | 158.7K (113.4K cached) |
| Live-check | OK |
| Push | SUCCESS (first time in 9 runs) |
| PR created | YES — #60 |

---

## Committed Files (13)

| # | File | Spans | Attempts | Output Tokens |
|---|------|-------|----------|---------------|
| 1 | collectors/claude-collector.js | 1 | 1 | 5.0K |
| 2 | collectors/git-collector.js | 2 | 1 | 3.8K |
| 3 | commands/summarize.js | 3 | 1 | 8.5K |
| 4 | generators/journal-graph.js | 4 | 2 | 24.8K |
| 5 | generators/summary-graph.js | 6 | 2 | 29.8K |
| 6 | index.js | 1 | 2 | 22.9K |
| 7 | integrators/context-integrator.js | 1 | 1 | 4.2K |
| 8 | managers/auto-summarize.js | 3 | 1 | 4.7K |
| 9 | managers/journal-manager.js | 2 | 2 | 12.5K |
| 10 | managers/summary-manager.js | 9 | 1 | 17.6K |
| 11 | mcp/server.js | 1 | 2 | 3.7K |
| 12 | utils/journal-paths.js | 1 | 1 | 3.8K |
| 13 | utils/summary-detector.js | 5 | 2 | 13.1K |

**Total spans**: 39
**Files needing 2 attempts**: 6 (journal-graph, summary-graph, index, journal-manager, server, summary-detector)
**Files needing 3+ attempts**: 0

---

## Correct Skips (17)

All sync-only or constant-export files:

1. generators/prompts/guidelines/accessibility.js
2. generators/prompts/guidelines/anti-hallucination.js
3. generators/prompts/guidelines/index.js
4. generators/prompts/sections/daily-summary-prompt.js
5. generators/prompts/sections/dialogue-prompt.js
6. generators/prompts/sections/monthly-summary-prompt.js
7. generators/prompts/sections/summary-prompt.js
8. generators/prompts/sections/technical-decisions-prompt.js
9. generators/prompts/sections/weekly-summary-prompt.js
10. integrators/filters/message-filter.js
11. integrators/filters/sensitive-filter.js
12. integrators/filters/token-filter.js
13. mcp/tools/context-capture-tool.js
14. mcp/tools/reflection-tool.js
15. traceloop-init.js
16. utils/commit-analyzer.js
17. utils/config.js

---

## Run-10 → Run-11 Comparison

| Metric | Run-10 | Run-11 | Delta |
|--------|--------|--------|-------|
| Committed | 12 | 13 | +1 (summary-manager.js recovered) |
| Failed | 1 | 0 | -1 |
| Partial | 0 | 0 | — |
| Correct skips | 17 | 17 | — |
| Total spans | 28 | 39 | +11 |
| Push/PR | FAILED | SUCCESS | First PR in 9 runs |
| Duration | 45.9 min | 41.2 min | -4.7 min |
| Output tokens | 175.8K | 158.7K | -17.1K |

---

## Notable Observations

1. **Push auth resolved**: Fine-grained PAT worked. `urlChanged=true, path=token-swap` confirms URL swap mechanism fired. PR #60 created.
2. **Zero failures/partials**: First clean sweep across all 11 runs.
3. **summary-manager.js recovered**: 9 spans committed. Weaver CLI retry presumably prevented the transient failure from run-10.
4. **journal-graph.js down to 2 attempts**: Was 3 in run-10. Still not first-attempt, but improved.
5. **CDQ-007 awareness visible**: Agent actively dropping optional-chaining attributes (index.js dropped messages_count, journal-graph.js dropped gen_ai.usage.*) to avoid violations.
6. **summary-graph.js uses ternary workaround**: `entries ? entries.length : 0` instead of if-guards to avoid NDS-003. Creative but needs rubric check.
7. **39 total spans**: New high (was 28 in run-10). summary-manager.js alone contributes 9.
