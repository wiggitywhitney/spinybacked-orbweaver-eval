// ABOUTME: Run-24 summary — results, fix verification, file outcomes, and key findings.
# Run-24 Summary

**Date**: 2026-06-18
**Duration**: 54m 44s
**Branch**: `spiny-orb/instrument-1781811083418`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/81 (auto-created ✅)
**spiny-orb**: built from main (confirmed pre-run — `feature/965-observability-triangle-metrics` had zero `src/` changes vs main)

---

## Results

| Metric | Value |
|--------|-------|
| Files committed | 14 |
| Files failed | 0 |
| Files partial | 0 |
| Correct skips | 17 |
| Total spans | 48 |
| Total attributes | 15 |
| Tokens | 110.2K input / 218.4K output (212.6K cached) |
| Cost | ~$3.70 (estimated from token counts) |
| Live-check | OK (665 spans, 4317 advisory findings — see spiny-orb-live-check-report.json) |

---

## Fix Verification

| Item | Expected | Result |
|------|----------|--------|
| RUN23-1: git-collector.js `diff_size` SCH-003 integer-as-string (issue #928) | FIXED | ✅ CONFIRMED — committed clean with correct types, 3 attempts |
| RUN23-2: commands/summarize.js `*_summaries_generated` SCH-003 (issue #928) | FIXED | ✅ CONFIRMED — committed clean with 2 attrs (down from 3), 2 attempts |
| RUN23-3: summary-detector.js SCH-002 near-synonym partial (issue #925) | FIXED | ✅ CONFIRMED — 9 spans, 3 attrs, 1 attempt (was PARTIAL 4 spans in run-23) |
| RUN23-4: IS SPA-002 `process.exit()` drops outermost span (issue #926) | Watch | ❌ RECURS — IS 80/100; SPA-002 still failing (orphan parentSpanId) |
| RUN21-6: Agent notes vs committed code divergence (issue #927) | Watch | Pending per-file evaluation |

---

## File Outcomes

| File | Result | Spans | Attrs | Attempts | Notes |
|------|--------|-------|-------|----------|-------|
| src/collectors/claude-collector.js | ✅ committed | 1 | 0 | 1 | |
| src/collectors/git-collector.js | ✅ committed | 6 | 3 | 3 | **RUN23-1 FIXED** — types correct |
| src/generators/prompts/guidelines/accessibility.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/guidelines/anti-hallucination.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/guidelines/index.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/daily-summary-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/dialogue-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/monthly-summary-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/summary-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/technical-decisions-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/journal-graph.js | ✅ committed | 4 | 0 | 1 | 7th consecutive success (runs 18–21, 23–24); first attempt (was 3 in run-23) |
| src/generators/prompts/sections/weekly-summary-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/summary-graph.js | ✅ committed | 6 | 4 | 1 | First attempt (was 2 in run-23) |
| src/integrators/filters/message-filter.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/integrators/filters/sensitive-filter.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/integrators/filters/token-filter.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/integrators/context-integrator.js | ✅ committed | 1 | 0 | 1 | |
| src/logger.js | ✅ skip | 0 | 0 | 1 | RST-001 correct (new file in run-24; 31 total vs run-23's 30) |
| src/mcp/tools/context-capture-tool.js | ✅ committed | 1 | 0 | 1 | |
| src/mcp/tools/reflection-tool.js | ✅ skip | 0 | 0 | 2 | RST-001 correct; 2 attempts to reach skip decision |
| src/mcp/server.js | ✅ committed | 1 | 1 | 1 | 2nd consecutive clean commit |
| src/traceloop-init.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/utils/commit-analyzer.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/utils/config.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/utils/journal-paths.js | ✅ committed | 1 | 0 | 1 | |
| src/managers/journal-manager.js | ✅ committed | 2 | 0 | 1 | |
| src/managers/summary-manager.js | ✅ committed | 9 | 0 | 1 | **RUN23-2 CONFIRMED** — 0 attrs (was 1 attr/string issue in run-23); type issue absent |
| src/commands/summarize.js | ✅ committed | 3 | 2 | 2 | **RUN23-2 FIXED** — `*_summaries_generated` types correct |
| src/utils/summary-detector.js | ✅ committed | 9 | 3 | 1 | **RUN23-3 FIXED** — all 5 functions committed; was PARTIAL (4 spans) in run-23 |
| src/managers/auto-summarize.js | ✅ committed | 3 | 0 | 1 | First attempt (was 2 in run-23) |
| src/index.js | ✅ committed | 1 | 2 | 1 | 2nd consecutive clean commit |

---

## Key Findings

### First ever clean sweep

0 failures, 0 partials — the first run with no committed-file losses across 24 runs. Previous best was run-23 (13+1p) and run-11 (13, 100% quality score). Run-24 sets new records: 14 committed files, 0 failures, 0 partials.

### All three RUN23 fixes confirmed

**RUN23-1/RUN23-2 (SCH-003, issue #928)**: Type mismatch guidance worked. git-collector committed with correct attribute types. summary-manager dropped to 0 attributes — the `monthly_summaries_generated` string-wrapping issue is gone. commands/summarize.js committed with types correct.

**RUN23-3 (SCH-002, issue #925)**: Biggest win. summary-detector.js went from PARTIAL (4/5 functions, `base_path` near-synonym rejected) to 9 spans across all 5 functions in a single attempt. The near-synonym guidance completely resolved the oscillation.

### Attempt rate improvement

Files requiring ≥ 2 attempts: git-collector (3), reflection-tool (2, skip), summarize (2) = 3 of 31 files. Down from 7 in run-23. journal-graph and summary-graph each dropped from 2–3 attempts to 1.

### journal-graph.js streak

7th consecutive success (runs 18, 19, 20, 21, [22 never ran], 23, 24).

### Cost reduction

~$3.70 vs run-23's ~$5.60. Fewer retry chains (only 3 multi-attempt files vs 7) and high cache utilization (212.6K cached of 322.8K total input) drove the reduction.

### logger.js (new file, RST-001 skip)

run-24 processed 31 files vs run-23's 30 — `src/logger.js` was added via commit-story-v2 PR #80 (pino + OTLP log bridge). The agent correctly identified it as a utility skip per RST-001.

---

## vs Run-23

| Dimension | R24 | R23 |
|-----------|-----|-----|
| Files committed | **14** | 13 |
| Files failed | **0** | 0 |
| Files partial | **0** | 1 |
| Total spans | **48** | 45 |
| Multi-attempt files | **3** | 7 |
| Cost | **~$3.70** | ~$5.60 |
| Q×F projection | **14.0** (if 25/25) | 12.48 |

Quality score: **23/25 (92%)**. IS score: **80/100** (SPA-001 structural + SPA-002 recurrence — RUN23-4 not fixed).
