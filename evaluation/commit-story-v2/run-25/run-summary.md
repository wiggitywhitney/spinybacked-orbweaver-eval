// ABOUTME: Run-25 summary — results, fix verification, file outcomes, and key findings.
# Run-25 Summary

**Date**: 2026-06-19
**Duration**: 1h 13m 41.5s
**Branch**: `spiny-orb/instrument-1781909345452`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/86 (auto-created ✅)
**spiny-orb**: built from main (confirmed pre-run)

---

## Results

| Metric | Value |
|--------|-------|
| Files committed | 13 |
| Files failed | 0 |
| Files partial | 1 (summary-manager.js) |
| Correct skips | 17 |
| Total spans | 47 (40 committed + 7 partial) |
| Total attributes | 16 (schema extensions — see note below) |
| Model | claude-sonnet-4-6 |
| Tokens | 213.5K input / 286.7K output (480.5K cached) |
| Cost | $7.38 |
| Live-check | OK (657 spans, 4462 advisory findings — see spiny-orb-live-check-report.json) |

**Note on attribute count**: The result header counts *schema extension keys declared*, not total `setAttribute` calls. Files using only registered schema attributes report 0a even if they use many attributes (e.g., auto-summarize.js used 5 registered attributes but shows 0a). This is consistent with prior runs.

---

## Fix Verification

| Item | Expected | Result |
|------|----------|--------|
| RUN24-1: index.js CDQ-001 — `process.exit()` bypasses `span.end()` | FIXED | **Pending per-file eval** — index.js committed (2 spans, 1 attr, ×1), but agent notes make no mention of `process.exit()` or CDQ-001. Could indicate fix landed OR agent missed the pattern. |
| RUN24-2: git-collector.js SCH-003 — `diff_lines` declared `type: string`, set as integer | FIXED | **Pending per-file eval** — committed (6 spans, 3 attrs, ×2). Whether `String()` wrapping is present requires code inspection. |
| RUN23-4: IS SPA-002 — `commit_story.index.main` drops before batch flush | Watch (3rd) | Pending IS scoring run |
| RUN21-6: Agent notes vs committed code divergence | Watch (4th) | Pending per-file evaluation |
| PH-1: Hardcoded commit-story-v2 values in agent prompt | Watch (1st) | Pending per-file evaluation |

---

## File Outcomes

| File | Result | Spans | Attrs | Attempts | Notes |
|------|--------|-------|-------|----------|-------|
| src/collectors/claude-collector.js | ✅ committed | 1 | 0 | 1 | |
| src/collectors/git-collector.js | ✅ committed | 6 | 3 | 2 | **RUN24-2 pending** — 3 schema extension attrs, ×2; confirm `String()` wrap during per-file eval |
| src/generators/prompts/guidelines/accessibility.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/guidelines/anti-hallucination.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/guidelines/index.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/daily-summary-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/dialogue-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/monthly-summary-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/summary-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/technical-decisions-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/weekly-summary-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/integrators/filters/message-filter.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/integrators/filters/sensitive-filter.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/integrators/filters/token-filter.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/integrators/context-integrator.js | ✅ committed | 1 | 0 | 1 | |
| src/logger.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/journal-graph.js | ✅ committed | 4 | 0 | 2 | Consecutive success streak continues (7th or 8th — verify against run history); ×2 this run vs ×1 in run-24 |
| src/generators/summary-graph.js | ✅ committed | 6 | 5 | 1 | +1 attr vs run-24 (4→5) |
| src/mcp/tools/context-capture-tool.js | ✅ committed | 1 | 0 | 1 | |
| src/mcp/tools/reflection-tool.js | ✅ skip | 0 | 0 | 2 | RST-001 correct; 3rd consecutive run ×2 — investigate debug dump (see lessons-for-prd26.md) |
| src/mcp/server.js | ✅ committed | 1 | 1 | 1 | |
| src/traceloop-init.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/utils/commit-analyzer.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/utils/config.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/utils/journal-paths.js | ✅ committed | 1 | 0 | 1 | |
| src/managers/journal-manager.js | ✅ committed | 2 | 0 | 1 | |
| src/managers/summary-manager.js | ⚠️ partial | 7 | 0 | 2 | **NEW REGRESSION** — was ✅ 9 spans in both run-23 and run-24; COV-003 rejected on `readWeekDailySummaries` and `readMonthWeeklySummaries`; validator may have classed catches as graceful-degradation (NDS-007) |
| src/commands/summarize.js | ✅ committed | 3 | 6 | 2 | +4 attrs vs run-24 (2→6); high attribute variance — see lessons-for-prd26.md |
| src/utils/summary-detector.js | ✅ committed | 9 | 0 | 1 | -3 attrs vs run-24 (3→0); attribute collapse — see lessons-for-prd26.md |
| src/managers/auto-summarize.js | ✅ committed | 3 | 0 | 1 | Notes confirm 5 registered attrs used; 0a = no new schema extensions (expected) |
| src/index.js | ✅ committed | 2 | 1 | 1 | +1 span vs run-24 (1→2); agent notes no mention of `process.exit()` — **RUN24-1 pending per-file eval** |

---

## Attempt Distribution

| Attempts | Files | Names |
|----------|-------|-------|
| ×1 | 26 | All correct skips + claude-collector, context-integrator, summary-graph, context-capture-tool, server, journal-paths, journal-manager, summary-detector, auto-summarize, index |
| ×2 | 5 | git-collector, journal-graph, reflection-tool (skip), summary-manager (partial), summarize |
| ×3+ | 0 | — |

---

## Key Findings

1. **summary-manager.js PARTIAL** — New regression. Was ✅ 9 spans in both prior runs. COV-003 triggered a partial commit (7 spans committed, 2 functions skipped). Root cause unclear: either the catches in `readWeekDailySummaries`/`readMonthWeeklySummaries` are genuinely graceful-degradation patterns (NDS-007 correct to protect them) or the validator's NDS-007 classification is too broad here.

2. **index.js CDQ-001 status unclear** — The agent committed index.js cleanly with 2 spans and no validator errors, but the agent notes do not mention `process.exit()` at all. This could mean (a) the spiny-orb fix for CDQ-001 landed and handled it transparently, or (b) the agent didn't recognize the pattern. Verdict requires per-file code inspection.

3. **Attribute variance across files** — summary-detector.js dropped from 3a→0a on the same 9 spans; summarize.js jumped from 2a→6a. High variance on unchanged source code. Root cause: attribute selection guidance in agent prompt lacks a principled framework (see lessons-for-prd26.md for the three-part improvement proposal).

4. **Cost doubled** — $7.38 vs run-24's ~$3.70. Likely driven by higher multi-attempt rate (5 files ×2 vs run-24's ~3) and the summary-manager.js partial workflow. Journal-graph also went from ×1 to ×2.

5. **PR auto-created** — seventeenth consecutive auto-push/PR success ✅
