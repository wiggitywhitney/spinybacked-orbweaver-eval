# Run-21 Summary

**Date**: 2026-06-04
**Duration**: 1h 17m 14s
**Branch**: `spiny-orb/instrument-1780596389399`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/74 (auto-created ✅ — 13th consecutive)
**spiny-orb**: 1.0.0 (SHA 9f3f6b9, main)

---

## Results

| Metric | Value |
|--------|-------|
| Files committed | 12 |
| Files failed | 2 (mcp/server.js, index.js) |
| Files partial | 0 |
| Correct skips | 16 |
| Total spans | 42 |
| Tokens | 296.5K input / 302.0K output / 396.0K cached |
| Cost | ~$9 (estimated from tokens; no dollar line in log) |
| Live-check | OK — 598 runtime spans, 4495 advisory findings |

---

## File Outcomes

| File | Result | Spans | Attempts | Schema exts | Notes |
|------|--------|-------|----------|-------------|-------|
| src/collectors/claude-collector.js | ✅ committed | 1 | 1 | 1 | — |
| src/collectors/git-collector.js | ✅ committed | 6 | 2 | 7 | PRD #902: 5 new span names + `is_merge` attr; was 2 spans |
| src/generators/prompts/guidelines/accessibility.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/guidelines/anti-hallucination.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/guidelines/index.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/sections/daily-summary-prompt.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/sections/dialogue-prompt.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/sections/monthly-summary-prompt.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/sections/summary-prompt.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/sections/technical-decisions-prompt.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/journal-graph.js | ✅ committed | 4 | 2 | 4 | 5-run streak; was 8 spans; NDS-003 fix changed opt-chain approach |
| src/generators/prompts/sections/weekly-summary-prompt.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/summary-graph.js | ✅ committed | 6 | 2 | 10 | PRD #902: best result — 6 span names + 4 attrs; was 4 spans |
| src/integrators/filters/message-filter.js | ✅ skip | 0 | 1 | — | new refactored subdir |
| src/integrators/filters/sensitive-filter.js | ✅ skip | 0 | 1 | — | was 1 span in run-20; code refactored to sync-only |
| src/integrators/filters/token-filter.js | ✅ skip | 0 | 1 | — | new refactored subdir |
| src/integrators/context-integrator.js | ✅ committed | 1 | 1 | 1 | was 3 attempts; 1 span vs 2 |
| src/mcp/tools/context-capture-tool.js | ✅ committed | 1 | 1 | 1 | rescued after 2 consecutive failures |
| src/mcp/tools/reflection-tool.js | ✅ skip | 0 | 1 | — | was 2 spans run-20; all fns now sync |
| src/mcp/server.js | ❌ failed | — | 3 | 2 declared | NEW NDS-003 variant: lines 2,3,31,33,34 (JSDoc + McpServer constructor); trivia-loss (line 1) is now fixed |
| src/traceloop-init.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/utils/commit-analyzer.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/utils/config.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/utils/journal-paths.js | ✅ committed | 1 | 1 | 1 | previously skipped; `ensureDirectory` async mkdir now correctly found |
| src/managers/journal-manager.js | ✅ committed | 2 | 1 | 3 | was 3 attempts; new `reflections_count` attr |
| src/managers/summary-manager.js | ✅ committed | 9 | 1 | 9 | was 4 spans; full read/save/generate pipeline for daily+weekly+monthly |
| src/commands/summarize.js | ✅ committed | 3 | 3 | 5 | was 2 spans; 50K tokens; namespace inconsistency in notes (commands.* vs summary.*) |
| src/utils/summary-detector.js | ✅ committed | 5 | 2 | 7 | was 1 span; all 5 async fns instrumented |
| src/managers/auto-summarize.js | ✅ committed | 3 | 1 | 5 | was 2 spans; `generated_count` + `failed_count` |
| src/index.js | ❌ failed | — | 2 | 2 declared | NEW FAILURE: 152 NDS-003 violations; multi-line import collapse; was ✅ in runs 17-20 |

---

## Key Findings

### RUN20-1 (trivia-loss): Partially resolved
The PR #905 fix works for the shebang (line 1). mcp/server.js now fails on lines 2,3,31,33,34 — the JSDoc block and McpServer constructor multi-line format. Two independent NDS-003 issues confirmed on this file.

### New finding: Multi-line collapse NDS-003
Both mcp/server.js and index.js fail because the agent collapses multi-line `import {` statements and multi-line function call arguments onto single lines. index.js had 152 NDS-003 violations. This is a new failure class not addressed by existing fixes. index.js was clean in runs 17–20.

### RUN20-3 (index.js subcommand attr): Unverifiable
index.js failed, so `commit_story.cli.subcommand` was not committed. The agent declared it in schema extensions and the thinking blocks show correct intent, but multi-line collapse prevented the file from validating.

### PRD #902 auto-registration: Step change in coverage
~60 new schema extensions across 12 files. Largest beneficiaries: summary-manager (4→9 spans), summary-detector (1→5), git-collector (2→6). Schema self-reinforcement observed: `entries_count` registered by summary-graph.js reused cleanly by four subsequent files. Some semantic stretches noted (weekly_summaries_count used for monthly context).

### Attempt rate: Dramatic improvement
3-attempt rate: 1/12 (8%) vs run-20's 6/13 (46%). Files that took 3 attempts in run-20 (context-integrator, journal-manager) now took 1.

---

## vs Run-20 Dimension Projections

Quality score TBD — pending per-file evaluation. Key factors:
- COV-005: git-collector, summary-manager, summary-detector, auto-summarize all have domain attrs now
- COV-001: index.js entry point span missing (failed) — COV gate may be affected
- mcp/server.js still failing — no new COV score from that file
- Sensitive-filter.js and reflection-tool.js span drops warrant scrutiny
