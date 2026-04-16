# Run Summary — Run-14

**Date**: 2026-04-15
**Started**: 2026-04-15T14:39:44.891Z
**Completed**: 2026-04-15T15:34:01Z
**Duration**: 54m 16.1s
**Branch**: spiny-orb/instrument-1776263984892
**Spiny-orb build**: main (e2dc3f5 — SCH-004 namespace pre-filter, all P1 fixes, SCH-005 LLM judge)
**Target repo**: commit-story-v2 proper
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/65

---

## Results

| Metric | Value |
|--------|-------|
| Files processed | 30 |
| Committed | 12 |
| Partial | 0 |
| Failed | 0 |
| Correct skips | 18 |
| Total tokens (input) | 195.3K |
| Total tokens (output) | 226.9K |
| Cached tokens | 416.9K |
| Estimated cost (pre-run) | ~$4.10 |
| Actual cost | $5.59 |
| Live-check | OK |
| Push/PR | YES (PR #65) |

---

## Committed Files (12)

| File | Spans | Attributes | Attempts |
|------|-------|------------|----------|
| src/collectors/claude-collector.js | 1 | 0 | 1 |
| src/collectors/git-collector.js | 2 | 0 | 1 |
| src/commands/summarize.js | 3 | 4 | 1 |
| src/generators/journal-graph.js | 4 | 0 | 3 |
| src/generators/summary-graph.js | 6 | 0 | 1 |
| src/integrators/context-integrator.js | 1 | 0 | 1 |
| src/managers/auto-summarize.js | 3 | 0 | 1 |
| src/managers/journal-manager.js | 2 | 0 | 2 |
| src/managers/summary-manager.js | 3 | 2 | 3 |
| src/mcp/server.js | 1 | 2 | 1 |
| src/utils/journal-paths.js | 1 | 0 | 3 |
| src/utils/summary-detector.js | 5 | 5 | 2 |
| **Total** | **32** | **13** | |

## Partial (0)

None.

## Failed (0)

None.

## Correct Skips (18)

src/generators/prompts/guidelines/accessibility.js, src/generators/prompts/guidelines/anti-hallucination.js, src/generators/prompts/guidelines/index.js, src/generators/prompts/sections/daily-summary-prompt.js, src/generators/prompts/sections/dialogue-prompt.js, src/generators/prompts/sections/monthly-summary-prompt.js, src/generators/prompts/sections/summary-prompt.js, src/generators/prompts/sections/technical-decisions-prompt.js, src/generators/prompts/sections/weekly-summary-prompt.js, src/index.js (0 spans — CDQ-001 block: all code paths call process.exit()), src/integrators/filters/message-filter.js, src/integrators/filters/sensitive-filter.js, src/integrators/filters/token-filter.js, src/mcp/tools/context-capture-tool.js, src/mcp/tools/reflection-tool.js, src/traceloop-init.js, src/utils/commit-analyzer.js, src/utils/config.js

---

## Checkpoint Failures

None. Zero checkpoint failures across all 30 files.

---

## Notable Outcomes

- **summaryNode instrumented for the first time** — journal-graph.js committed with 4 spans (summaryNode, technicalNode, dialogueNode, generateJournalSections). summaryNode has failed NDS-003 in every prior attempt (runs 11–13).
- **summary-graph.js committed with 6 spans** — recovered from run-13 checkpoint rollback. The `!= null` type-safety fix eliminated the null-guard failure.
- **summary-manager.js committed with 3 spans** — recovered from run-13 checkpoint rollback (COV-004 verification confirmed).
- **journal-manager.js committed with 2 spans, 2 attempts** — recovered from run-13 checkpoint rollback. The Date/string type-safety fix resolved the timestamp issue.
- **Smart rollback verified** — no cascade rollbacks. Files that took multiple attempts resolved through retry without discarding neighboring files.
- **index.js correctly skipped** — agent identified CDQ-001 block (all code paths exit via process.exit(), span cannot be closed) and left the file unchanged.

---

## Comparison with Run-13

| Metric | Run-13 | Run-14 | Delta |
|--------|--------|--------|-------|
| Committed | 7 | 12 | **+5** |
| Partial | 1 | 0 | -1 |
| Failed | 11 | 0 | **-11** |
| Correct skips | 11 | 18 | +7 |
| Cost | ~$6.41 | $5.59 | **-$0.82** |
| Duration | 65.7 min | 54.3 min | -11.4 min |
| Push/PR | YES (#62) | YES (#65) | Fourth consecutive |
| Checkpoint failures | 2 | 0 | **-2** |
| Total spans | 16 | 32 | **+16** |

---

## Notes

- Run-14 is the first run on spiny-orb main with all P1 fixes merged (smart rollback #437/#447, type-safety #435/#436, summaryNode NDS-003 #438, SCH-004 #440, SCH-005 LLM judge #431).
- The 18 correct skips (vs 11 in run-13) reflect the agent correctly handling 7 additional constant/synchronous files that had previously been lost to rollback — they were processed and correctly identified as no-instrument targets.
- Correct skip count expanding from 11 to 18 is consistent with smart rollback: in run-13, 10 of the "failed" files were actually clean files that were discarded as rollback collateral. Those same files are now in the correct-skip bucket where they belong.
- Q×F = 22/25 × 12 = 10.6 — recovery from run-13's 7.0 low, near run-12's 11.0 baseline.
