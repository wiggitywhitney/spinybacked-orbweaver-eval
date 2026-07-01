# Run-15 Summary — commit-story-v2

**Date**: 2026-05-03
**Branch**: `spiny-orb/instrument-1777850275841`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/66
**spiny-orb version**: 1.0.0 (SHA 1b6c3d9, `fix/724-attribute-namespace`)
**Model**: claude-sonnet-4-6 (with --thinking)
**Started**: 2026-05-03T23:17:55.841Z
**Elapsed**: ~81 minutes

---

## Result Summary

| Metric | Run-15 | Run-14 | Delta |
|--------|--------|--------|-------|
| Files committed | **14** | 12 | **+2** |
| Files failed | 0 | 0 | — |
| Files partial | 0 | 0 | — |
| Correct skips (0 spans) | 16 | 16 | — |
| Total files processed | 30 | 30 | — |
| Cost | **$6.44** | $5.59 | +$0.85 |
| Input tokens | 93,471 | — | — |
| Output tokens | 325,603 | — | — |
| Cache read tokens | 173,610 | — | — |
| Push/PR | **YES (#66)** | YES (#65) | 5th consecutive |

---

## Per-File Results

| File | Status | Spans | Attempts | Cost |
|------|--------|-------|----------|------|
| src/collectors/claude-collector.js | ✅ success | 1 | 1 | $0.53 |
| src/collectors/git-collector.js | ✅ success | 2 | 1 | $0.17 |
| src/commands/summarize.js | ✅ success | 3 | 1 | $0.51 |
| src/generators/journal-graph.js | ✅ success | 4 | **1** | $0.56 |
| src/generators/summary-graph.js | ✅ success | 6 | 2 | $0.69 |
| src/index.js | ✅ success | 1 | 1 | $0.23 |
| src/integrators/context-integrator.js | ✅ success | 1 | 1 | $0.39 |
| src/managers/auto-summarize.js | ✅ success | 3 | 1 | $0.17 |
| src/managers/journal-manager.js | ✅ success | 2 | 1 | $1.00 |
| src/managers/summary-manager.js | ✅ success | **9** | **1** | $1.19 |
| src/mcp/server.js | ✅ success | 1 | 1 | $0.13 |
| src/mcp/tools/context-capture-tool.js | ✅ success | 1 | 1 | $0.15 |
| src/utils/journal-paths.js | ✅ success | 1 | 1 | $0.31 |
| src/utils/summary-detector.js | ✅ success | 5 | 1 | $0.25 |
| src/mcp/tools/reflection-tool.js | ✅ 0 spans | 0 | 2 | ~$0.01 |
| 15 prompt/filter/util files | ✅ 0 spans | 0 | 1 each | $0 (pre-scan) |

**Total spans committed**: 40 (across 14 files)

---

## Key Observations

### journal-graph.js: 1 attempt (breakthrough)
Run-14 and runs 12-13 all required 3 attempts on journal-graph.js (~$1.52). Run-15 completed in 1 attempt at $0.56 — a $0.96 reduction. Root cause of prior 3-attempt pattern not yet identified, but this run broke the streak.

### summary-manager.js: 9 spans, 1 attempt (COV-004 resolved)
In runs 12-14, summary-manager.js committed with 3 spans due to ratio-backstop heuristic (COV-004 failure). Run-15: all 9 exported async I/O functions instrumented in 1 attempt. The strengthened COV-004 message (PRD #483 M2) — removing "Consider" language, directive wording — appears to have been effective.

### COV-003/CDQ-003: NDS-007 applied consistently across all three LangGraph nodes
All three nodes (summaryNode, technicalNode, dialogueNode) had their catch blocks treated as graceful-degradation catches under NDS-007 — NO error recording added to any of them. This is consistent with Decision D1 (PRD #483 M2 Decision 5): OTel Recording Errors spec says graceful-degradation catches SHOULD NOT record exceptions. Run-14 had technicalNode and dialogueNode with error recording, which was over-recording.

### 2 new files committed vs run-14
mcp/server.js and mcp/tools/context-capture-tool.js were committed for the first time. These cover the MCP server lifecycle and context-capture tool I/O.

### Cost increased despite better attempt counts
$6.44 vs $5.59 in run-14. The increase is attributable to 2 additional committed files and the large size of journal-manager.js (59.7K output tokens, $1.00) and summary-manager.js (71.8K output tokens, $1.19). The journal-graph.js improvement (-$0.96) partially offset the additional file costs.

### Pre-push hook interaction (environment note)
The `progress-md-pr.sh` pre-push hook from Whitney's local git configuration fired during the instrument branch push, prompting for a PROGRESS.md entry. Whitney pressed 'skip'. This is not a spiny-orb issue — it's environment-specific to the eval setup.

---

## Checkpoint Failures

None. 0 failed, 0 partial.

---

## Instrument Branch

`spiny-orb/instrument-1777850275841` — pushed to `wiggitywhitney/commit-story-v2`
PR #66: https://github.com/wiggitywhitney/commit-story-v2/pull/66
