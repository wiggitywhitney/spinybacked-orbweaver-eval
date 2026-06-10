# Run-23 Summary

**Date**: 2026-06-10
**Duration**: ~1h 20m (exact end time not in log; started 11:09:53Z)
**Branch**: `spiny-orb/instrument-1781089793056`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/74 (auto-created ✅)
**spiny-orb**: 1.0.0 (main, post-b579e5a — fixes ee856c3, 412da5b, aad9835, b579e5a present; see pre-run notes)

---

## Results

| Metric | Value |
|--------|-------|
| Files committed | 13 |
| Files failed | 0 |
| Files partial | 1 (summary-detector.js — 4/5 functions) |
| Correct skips | 16 |
| Total spans | 45 |
| Total schema extensions | ~59 (see file table) |
| Tokens | 260.6K input / 314.5K output / 385.9K cached |
| Cost | ~$5.60 (estimated) |
| Live-check | Report saved (spiny-orb-live-check-report.json) |

---

## Fix Verification

| Item | Expected | Result |
|------|----------|--------|
| RUN21-1: mcp/server.js NDS-003 blank-line-near-JSDoc (issue #917) | FIXED | ✅ CONFIRMED — committed clean, 1 attempt |
| RUN21-2: index.js import expansion NDS-003 (issue #916) | FIXED | ✅ CONFIRMED — committed clean, 1 attempt |
| RUN21-3: CDQ-001 double-end in claude-collector.js (issue #915) | FIXED | ✅ CONFIRMED — committed clean, no CDQ-001 |
| RUN21-4: COV-005 input-before-guard (issue #916 guidance) | Watch | Pending per-file evaluation |
| RUN21-5: index.js COV-005 subcommand attr | Unblocked | index.js committed; evaluation TBD |
| RUN21-6: Notes vs committed code divergence (issue #918) | FIXED | Pending per-file review of note timing |

---

## File Outcomes

| File | Result | Spans | Atts | Schema exts | Notes |
|------|--------|-------|------|-------------|-------|
| src/collectors/claude-collector.js | ✅ committed | 1 | 1 | 1 | CDQ-001 GONE (was ✅⚠️ in run-21) |
| src/collectors/git-collector.js | ✅ committed | 6 | 3 | 10 | 3 attempts |
| src/generators/prompts/guidelines/accessibility.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/guidelines/anti-hallucination.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/guidelines/index.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/sections/daily-summary-prompt.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/sections/dialogue-prompt.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/sections/monthly-summary-prompt.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/sections/summary-prompt.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/prompts/sections/technical-decisions-prompt.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/journal-graph.js | ✅ committed | 4 | 3 | 4 | 3 attempts; 6th consecutive success (runs 18–23) |
| src/generators/prompts/sections/weekly-summary-prompt.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/generators/summary-graph.js | ✅ committed | 6 | 4 | 10 | 2 attempts |
| src/integrators/filters/message-filter.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/integrators/filters/sensitive-filter.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/integrators/filters/token-filter.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/integrators/context-integrator.js | ✅ committed | 1 | 1 | 1 | |
| src/mcp/tools/context-capture-tool.js | ✅ committed | 3 | 1 | 2 | |
| src/mcp/tools/reflection-tool.js | ✅ skip | 0 | 2 | — | RST-001 correct (2 attempts) |
| src/mcp/server.js | ✅ committed | 1 | 1 | 2 | **RUN21-1 FIXED** — was ❌ in runs 20+21 |
| src/traceloop-init.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/utils/commit-analyzer.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/utils/config.js | ✅ skip | 0 | 1 | — | RST-001 correct |
| src/utils/journal-paths.js | ✅ committed | 1 | 1 | 1 | |
| src/managers/journal-manager.js | ✅ committed | 2 | 1 | 2 | |
| src/managers/summary-manager.js | ✅ committed | 9 | 1 | 10 | |
| src/commands/summarize.js | ✅ committed | 3 | 2 | 6 | 2 attempts |
| src/utils/summary-detector.js | ⚠️ partial | 4 | 2 | 6 | 2 attempts; findUnsummarizedWeeks skipped — SCH-002: base_path declared as duplicate of file_path; regression from run-21 (was 5 spans clean) |
| src/managers/auto-summarize.js | ✅ committed | 3 | 2 | 3 | 2 attempts |
| src/index.js | ✅ committed | 1 | 1 | 1 | **RUN21-2 FIXED** — was ❌ in run-21 |

---

## Key Findings

### Both P1 fixes confirmed

mcp/server.js: committed clean in 1 attempt after 3 consecutive failures (runs 20+21). The `removeOtelImports` trivia-doubling fix (issue #917) resolved the blank-line-near-JSDoc NDS-003 variant.

index.js: committed clean in 1 attempt (1 span, span.commit_story.index.main). Was ❌ in run-21 with 152 NDS-003 violations from import expansion. The "do not reformat single-line import blocks" guidance (issue #916) resolved it.

### CDQ-001 resolved

claude-collector.js committed clean with no double-end. The startActiveSpan guidance correction (issue #915, reverted claim) worked.

### New regression: summary-detector.js SCH-002

`findUnsummarizedWeeks` skipped because the agent declared `commit_story.journal.base_path` — a semantic duplicate of the existing `commit_story.journal.file_path`. The validator flagged it as SCH-002. File went from 5 spans (run-21) to 4 spans (run-23). This is a new failure class: agent invented a near-synonym attribute key instead of reusing an existing one. Did not appear in run-21 because that file's agent used different attributes.

### Attempt rate

Files requiring ≥ 2 attempts: git-collector (3), journal-graph (3), summary-graph (2), reflection-tool (2, skip), summarize (2), summary-detector (2), auto-summarize (2) = 7 of 22 non-trivially-skipped files. 3-attempt rate: 2/13 committed files (15% — slight increase from run-21's 8%).

### journal-graph.js streak

6th consecutive success (runs 18, 19, 20, 21, [22 never ran], 23).

### Cost reduction

~$5.60 vs run-21's ~$8.10. Cached input (385.9K) significantly offset non-cached input (260.6K). Run-23 used 575.1K total tokens vs run-21's 598.5K — modestly smaller run, fewer retry chains due to P1 fixes landing.

---

## vs Run-21

| Dimension | R23 (raw) | R21 |
|-----------|-----------|-----|
| Files committed | 13 (+1 vs R21) | 12 |
| Files failed | 0 (-2 vs R21) | 2 |
| Files partial | 1 (new) | 0 |
| Total spans | 45 | 42 |
| Cost | ~$5.60 | ~$8.10 |
| Q×F (TBD) | TBD (pending rubric) | 11.0 |

Quality score and Q×F pending per-file evaluation.
