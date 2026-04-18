# Run Summary — Run-12

**Date**: 2026-04-09
**Started**: 2026-04-09T06:53:44.848Z
**Completed**: 2026-04-09T07:47:30.813Z
**Duration**: 3226.0s (53.8 minutes)
**Branch**: spiny-orb/instrument-1775717624848
**Spiny-orb build**: feature/prd-371-javascript-provider-extraction (302e6b2)
**Target repo**: commit-story-v2 proper
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/61

---

## Results

| Metric | Value |
|--------|-------|
| Files processed | 30 |
| Committed | 12 |
| Failed | 0 |
| Partial | 1 |
| Correct skips | 17 |
| Skipped | 0 |
| Input tokens | 227.2K |
| Output tokens | 208.1K (498.7K cached) |
| Live-check | OK |
| Push | SUCCESS |
| PR created | YES — #61 |

---

## Committed Files (12)

| # | File | Spans | Attempts | Output Tokens |
|---|------|-------|----------|---------------|
| 1 | collectors/claude-collector.js | 1 | 1 | 5.0K |
| 2 | collectors/git-collector.js | 2 | 1 | 4.1K |
| 3 | commands/summarize.js | 3 | 1 | 8.3K |
| 4 | generators/journal-graph.js | 4 | 3 | 64.9K |
| 5 | generators/summary-graph.js | 6 | 2 | 28.0K |
| 6 | index.js | 1 | 2 | 29.4K |
| 7 | integrators/context-integrator.js | 1 | 1 | 4.4K |
| 8 | managers/auto-summarize.js | 3 | 1 | 5.1K |
| 9 | managers/journal-manager.js | 2 | 2 | 13.1K |
| 10 | managers/summary-manager.js | 3 | 2 | 21.2K |
| 11 | mcp/server.js | 1 | 2 | 3.7K |
| 12 | utils/journal-paths.js | 1 | 1 | 3.2K |

**Total spans (committed)**: 28

---

## Partial Files (1)

| File | Spans | Functions Instrumented | Reason |
|------|-------|----------------------|--------|
| utils/summary-detector.js | 3 | 3/5 | Anthropic API overloaded_error on 2 functions |

**Total spans including partial**: 31

**Note**: The API overload is an infrastructure reliability issue (single provider, no fallback). It has no bearing on agent design or rubric quality scores. The partial commit contains valid instrumentation for the 3 functions that succeeded.

---

## Correct Skips (17)

All sync-only or constant-export files — same set as runs 9-11:

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

## Run-11 → Run-12 Comparison

| Metric | Run-11 | Run-12 | Delta |
|--------|--------|--------|-------|
| Committed | 13 | 12 | -1 |
| Failed | 0 | 0 | — |
| Partial | 0 | 1 | +1 (API overload) |
| Total spans | 39 | 31 | -8 |
| Push/PR | YES (#60) | YES (#61) | Second consecutive |
| Duration | 41.2 min | 53.8 min | +12.6 min |
| Output tokens | 158.7K | 208.1K | +49.4K |
| journal-graph.js attempts | 2 | 3 | Regression |
| summary-manager.js spans | 9 | 3 | Regression (needs investigation) |

---

## Notable Observations

1. **PR #61 created** — second consecutive successful push. Token-swap mechanism confirmed again.

2. **Zero failures** — all 30 files either succeeded, correctly skipped, or committed partial results. The PRD #371 architectural refactor (LanguageProvider/JavaScriptProvider/B1-B2-B3 split) did not introduce new failure modes.

3. **summary-detector.js partial** — Anthropic API returned `overloaded_error` on 2 of 5 functions (getDaysWithEntries, findUnsummarizedDays). 3/5 functions instrumented and committed. Infrastructure reliability issue, not a quality finding.

4. **NDS-003 truthy check issue identified** — Two manifestations in this run:
   - index.js: `if (context.chat)` guard flagged → agent dropped `commit_story.context.messages_count` attribute
   - journal-manager.js: `if (commit.hash)` and `if (commit.author)` guards flagged → agent removed guards, now sets attributes unconditionally (may produce `undefined` values)
   - The PR #352 fix covered `!== undefined`/`!= null` strict checks only. Truthy checks (`if (obj.property)`) are still flagged.

5. **journal-graph.js regressed to 3 attempts** — Was 2 in run-11, 3 in run-10. Still succeeds but costs more (~$0.30 per extra attempt) and lengthens the run.

6. **summary-manager.js span count dropped from 9 → 3** — Significant regression. Run-11 had 9 spans; run-12 has 3. Needs per-file investigation to understand whether this is a quality regression or a legitimate re-evaluation of what warranted spans.

7. **Cost likely exceeds $4.25 (run-11)** — Output tokens up 50K, duration up 12+ minutes. Actual cost TBD from PR summary.

8. **498.7K cached tokens** — Much higher cache hit rate than run-11 (113.4K). Likely due to retry passes re-reading the same file content. Partially offsets the higher output token count.
