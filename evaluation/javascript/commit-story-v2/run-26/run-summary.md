// ABOUTME: Run-26 summary — results, fix verification, file outcomes, and key findings.
# Run-26 Summary

**Date**: 2026-07-17
**Branch**: `spiny-orb/instrument-1784302707982` (confirmed via `git branch --show-current` on commit-story-v2 — the log did not print a literal "Branch:" line this run, unlike prior runs; see Key Findings)
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/91 (auto-create failed — push and PR created manually per the PR Auto-Creation Failure Recovery convention, using `spiny-orb-pr-summary.md` as the body)
**spiny-orb**: built from main (per PRD pre-run verification milestone)

---

## Results

| Metric | Value |
|--------|-------|
| Files committed | 14 |
| Files failed | 0 |
| Files partial | 0 |
| Correct skips | 18 |
| Files seen | 32 |
| Total spans | 41 |
| Total attributes | 19 |
| Model | claude-sonnet-4-6 |
| Tokens | 340.3K input / 411.1K output (671.4K cached) |
| Cost | $11.15 |

---

## Fix Verification

| Item | Expected | Result |
|------|----------|--------|
| RUN25-1: summary-manager.js COV-004 — `isExpectedConditionCatch` false positive on negated ENOENT rethrow | Fix confirmed if all 9 functions commit cleanly | **Confirmed** — summary-manager.js committed 9 spans, 0 partial (was 7 spans + partial in run-25). All 9 exported async functions committed cleanly. |
| Attribute selection guidance (§5 asks from run-25 handoff) | Watch for improvement | **Pending per-file eval** — total attributes rose 16→19 run-over-run; summarize.js at 9 attrs (was 6 in run-25); summary-detector.js recovered to 3 attrs (was 0 in run-25, 3 in run-24) — apparent improvement, needs code-level confirmation |
| context-capture-tool.js declining richness (3→2→1 over runs 23–25) | Watch (4th run) | **Pending per-file eval** — committed 1 span, 0 attrs (same as run-25's terminal value) |
| RUN21-6: Agent notes vs committed code divergence | Watch (5th run) | Pending per-file evaluation |
| PH-1: abstracted prompt guidance generalization | Watch (2nd run) | Pending per-file evaluation |
| journal-graph.js | Ninth consecutive success expected | **Confirmed** — committed, 4 spans, 2 attrs, ×3 attempts |

---

## File Outcomes

| File | Result | Spans | Attrs | Attempts |
|------|--------|-------|-------|----------|
| src/collectors/claude-collector.js | ✅ committed | 1 | 0 | 1 |
| src/collectors/git-collector.js | ✅ committed | 2 | 0 | 3 |
| src/generators/prompts/guidelines/accessibility.js | ✅ skip | 0 | 0 | 1 |
| src/generators/prompts/guidelines/anti-hallucination.js | ✅ skip | 0 | 0 | 1 |
| src/generators/prompts/guidelines/index.js | ✅ skip | 0 | 0 | 1 |
| src/generators/prompts/sections/daily-summary-prompt.js | ✅ skip | 0 | 0 | 1 |
| src/generators/prompts/sections/dialogue-prompt.js | ✅ skip | 0 | 0 | 1 |
| src/generators/prompts/sections/monthly-summary-prompt.js | ✅ skip | 0 | 0 | 1 |
| src/generators/prompts/sections/summary-prompt.js | ✅ skip | 0 | 0 | 1 |
| src/generators/prompts/sections/technical-decisions-prompt.js | ✅ skip | 0 | 0 | 1 |
| src/generators/prompts/sections/weekly-summary-prompt.js | ✅ skip | 0 | 0 | 1 |
| src/integrators/filters/message-filter.js | ✅ skip | 0 | 0 | 1 |
| src/integrators/filters/sensitive-filter.js | ✅ skip | 0 | 0 | 1 |
| src/integrators/filters/token-filter.js | ✅ skip | 0 | 0 | 1 |
| src/integrators/context-integrator.js | ✅ committed | 1 | 0 | 1 |
| src/logger.js | ✅ skip | 0 | 0 | 1 |
| src/generators/journal-graph.js | ✅ committed | 4 | 2 | 3 |
| src/generators/summary-graph.js | ✅ committed | 6 | 3 | 2 |
| src/mcp/tools/context-capture-tool.js | ✅ committed | 1 | 0 | 1 |
| src/mcp/tools/reflection-tool.js | ✅ skip | 0 | 0 | 2 |
| src/mcp/server.js | ✅ committed | 1 | 1 | 1 |
| src/traceloop-init.js | ✅ skip | 0 | 0 | 1 |
| src/utils/commit-analyzer.js | ✅ skip | 0 | 0 | 1 |
| src/utils/config.js | ✅ skip | 0 | 0 | 1 |
| src/utils/failure-placeholder.js | ✅ skip | 0 | 0 | 1 |
| src/utils/journal-paths.js | ✅ committed | 1 | 0 | 1 |
| src/managers/journal-manager.js | ✅ committed | 2 | 1 | 1 |
| src/managers/summary-manager.js | ✅ committed | 9 | 0 | 2 | RUN25-1 fix confirmed — all 9 functions committed, no partial |
| src/commands/summarize.js | ✅ committed | 3 | 9 | 2 | +3 attrs vs run-25 (6→9) |
| src/utils/summary-detector.js | ✅ committed | 5 | 3 | 3 | Recovered attrs vs run-25 (0→3) |
| src/managers/auto-summarize.js | ✅ committed | 3 | 0 | 1 |
| src/index.js | ✅ committed | 2 | 0 | 1 |

---

## Attempt Distribution

| Attempts | Files |
|----------|-------|
| ×1 | 26 |
| ×2 | 4 (summary-manager, summarize, summary-graph, reflection-tool [skip]) |
| ×3 | 2 (git-collector, journal-graph, summary-detector) |

---

## Key Findings

1. **RUN25-1 confirmed fixed** — summary-manager.js committed all 9 exported async functions with 0 partial (run-25 had 7 spans committed + 2 functions blocked as partial). The COV-004 validator now recognizes the negated ENOENT rethrow pattern as graceful degradation.

2. **Log did not print an explicit branch name line** — Unlike prior runs where `grep -m1 'Branch:' spiny-orb-output.log` (per Decision D-4) returned the instrument branch, run-26's log contains no such line; only `pushBranch: ...` diagnostic lines appear, with no branch name. The branch name was confirmed instead via `git branch --show-current` on the commit-story-v2 target repo. Worth flagging in lessons-for-prd27.md — D-4's extraction command may need a fallback or spiny-orb's log output may have changed.

3. **PR auto-creation failed** — The instrument branch was never pushed to origin during the run (`pushBranch: urlChanged=true, path=token-swap` — an unfamiliar diagnostic value not seen in prior runs' logs). AI pushed the branch and created PR #91 manually using `gh pr create --body-file spiny-orb-pr-summary.md`, per the PR Auto-Creation Failure Recovery convention. This breaks the "eighteenth consecutive AUTO push/PR" streak referenced in the PRD's success criteria — needs investigation before drafting PRD #27.

4. **Attribute selection guidance shows apparent improvement** — Total attributes rose from 16 (run-25) to 19 (run-26). summary-detector.js recovered from 0 attrs (run-25 collapse) to 3, and summarize.js continued climbing (2→6→9 across runs 24/25/26). Needs per-file code inspection to confirm these are meaningful domain attributes and not selection-guidance noise in the other direction.

5. **Cost up vs run-25** — $11.15 vs $7.38. Token usage up (340.3K/411.1K vs 213.5K/286.7K input/output). Likely driven by the higher-attempt files (git-collector, journal-graph, summary-detector all ×3) plus one additional file appearing in the run (32 files seen vs 31 in run-25 — `failure-placeholder.js` is new in the inventory).

---

## Post-Run Datadog Verification

Deferred — pending the "Post-run Datadog verification" PRD milestone (search_datadog_spans for git.commit.sha matching this run's instrument branch HEAD, plus pino log-trace correlation check).
