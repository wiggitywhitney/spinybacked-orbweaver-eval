# PR Artifact Evaluation — Run-23

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/75
**Branch**: spiny-orb/instrument-1781089793056
**State**: OPEN

> **Note**: run-summary.md originally recorded PR #74. PR #74 belongs to the June 4 run (branch `spiny-orb/instrument-1780596389399`, run-21). PR #75 is the correct run-23 artifact. The confusion arose because the run-summary was written before PR creation was confirmed, and the PR number was filled in incorrectly. See D-4 in the decision log.

---

## Push Auth — 14th Consecutive Success

PR #75 auto-created successfully. The fine-grained PAT and URL-swap mechanism continue to work without intervention.

---

## PR Summary Quality

**Length**: ~330 lines (longer than run-21's ~240 due to broader schema output)

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (30 total / 13 committed / 16 no changes / 1 partial) | YES | Matches run output |
| Per-file span counts | MOSTLY | summary-graph.js: PR says 6 (correct per source); per-file eval said 4 (error in per-file eval). summarize.js: PR says 3 (correct); per-file eval said 4 (error in per-file eval). PR is authoritative. |
| Per-file attempt counts | MOSTLY | summary-graph.js: PR says 2 (correct); per-file eval said 3. Summarize.js: PR says 2 (correct); per-file eval said correct. PR authoritative. |
| Per-file cost | YES | Sum of listed = $7.62; PR total = $7.84 (~$0.22 orchestration overhead) |
| Correct skip list (16 files) | YES | All 16 listed; reflection-tool.js correctly in skip list |
| Schema attribute changes (15 new attrs) | YES | All 15 listed |
| Span extensions (44 new span IDs) | YES | All 44 listed |
| Recommended companion packages | YES | @traceloop/instrumentation-langchain, @traceloop/instrumentation-anthropic, @traceloop/instrumentation-mcp |
| Token usage | YES | Matches run output (260.6K in / 314.5K out / 385.9K cached) |
| Live-check | YES | OK — 579 spans, 4562 advisory findings |
| Outlier callout (summary-manager, 9 spans) | YES | "outlier, review recommended" correctly flagged |
| Partial entry for summary-detector.js | YES | "partial (4/5 functions)" with correct schema extensions |

**Note on per-file eval discrepancies**: Two span count errors in the per-file evaluation (summary-graph.js 4→6, summarize.js 4→3) were caught by comparing against the PR. The PR body is generated directly from the agent's committed output and is authoritative on span counts and attempt counts.

### Schema Changes Section

PR correctly includes both attribute additions (15) and all 44 new span IDs. The 15 new attributes include the three canonical SCH-003 failures (`diff_size`, `monthly_summaries_generated`, and variants) — these are listed as schema extensions without any indication that they contain type mismatches, which is expected behavior (the PR reports what was registered, not whether the registered type matches runtime usage).

### Summary-graph.js Span Structure Clarification

The PR reveals that summary-graph.js has 6 spans structured as 3 pairs (outer function + LangGraph node) for each summary type: `generate_daily_summary`/`daily_summary_node`, `generate_weekly_summary`/`weekly_summary_node`, `generate_monthly_summary`/`monthly_summary_node`. There is no top-level `generateSummary` span. The per-file evaluation agent assumed a different structure (4 spans with an orchestrator). The 6-span structure is more comprehensive and passes all rules — COV-001 is satisfied because all three exported async functions (`generateDailySummary`, `generateWeeklySummary`, `generateMonthlySummary`) have spans.

### Summarize.js Span Structure Clarification

The PR shows summarize.js has 3 spans (`run_daily`, `run_weekly`, `run_monthly`), not 4. The per-file evaluation agent assumed a top-level `runSummarize` span existed; the committed source does not have one. The 3-span structure is correct — each of the three exported command paths has its own span.

### Advisory Findings Quality

The PR contains **advisory findings across 13 files**. Count by rule and file:

| File | CDQ-007 | SCH-001 | COV-004 | Total |
|------|---------|---------|---------|-------|
| claude-collector.js | 2 | — | — | 2 |
| git-collector.js | 6 | 2 | — | 8 |
| journal-graph.js | 3 | 1 | — | 4 |
| summary-graph.js | — | 6 | — | 6 |
| context-integrator.js | 4 | 1 | — | 5 |
| context-capture-tool.js | 2 | 1 | — | 3 |
| reflection-tool.js | — | — | 1 | 1 |
| journal-paths.js | 1 | — | — | 1 |
| journal-manager.js | 3 | — | — | 3 |
| summary-manager.js | 12 | 9 | — | 21 |
| summary-detector.js | 4 | — | 4 | 8 |
| auto-summarize.js | 3 | 2 | — | 5 |
| index.js | 1 | — | — | 1 |
| **Total** | **41** | **22** | **5** | **68** |

#### SCH-001 (22 instances, 8 files): Systematic False Positive (run-21 pattern persists)

SCH-001 fires for span names that "don't match your Weaver registry." All 22 instances are false positives: the flagged span names are listed in the PR's own "New Span IDs (44)" schema changes section — they ARE registered as extensions in the current run. The advisory checker does not recognize freshly registered in-run extensions, causing SCH-001 to fire for every span registered during the current run.

This is the same structural problem identified in run-21 (17 SCH-001 instances). It worsened in run-23 (22 instances) because run-23 registered more new spans (44 vs 42 in run-21). Unresolved pending PRD #902's advisory checker fix.

**Summary-manager.js SCH-001 volume (9 firings)**: 9 of the 22 SCH-001 firings are from summary-manager.js alone — one per span. This is notable because summary-manager.js is a 9-span file with all span names newly registered in this run. Each new span registration triggers a false positive. The per-file evaluation correctly found SCH-001 PASS for this file (static analysis confirmed all names are in agent-extensions.yaml).

#### CDQ-007 (41 instances, 11 files): Non-Actionable Without Per-Instance Detail

CDQ-007 fires for "PII attribute name or raw filesystem path." All 41 instances use an identical generic message with no indication of which specific attribute triggered the finding. Volume increased from run-21's 34 to 41 — proportional to the larger committed file count (13 vs 12) and higher span count (44 new spans vs 42).

Per-file evaluation finds CDQ-007 PASS for all 13 committed files in run-23. The generic message makes these advisories non-actionable without cross-referencing the per-file evaluation. The 12 CDQ-007 firings for summary-manager.js likely trace to `commit_story.journal.file_path` (a known path attribute that appears on most spans) — same pattern as run-21.

#### COV-004 (5 instances, 2 files): Accurate for summary-detector.js, Incorrect for reflection-tool.js

| Finding | Verdict | Notes |
|---------|---------|-------|
| COV-004 on reflection-tool.js (×1) | **Incorrect** | File is in the correct-skip list; all functions are sync; RST-001 exemption applies |
| COV-004 on summary-detector.js (×4) | **Accurate** | 4 async functions have no spans — this is the partial file (4/5 instrumented). The 4 COV-004 firings correspond to the 4 skipped span opportunities, NOT the 1 SCH-002-blocked function (findUnsummarizedWeeks) |

The COV-004 count for summary-detector.js (4 firings for a 4/5 partial) is notably informative — it accurately identifies how many functions are missing spans. The COV-004 mechanism is working correctly here even if the per-finding message doesn't explain WHY the spans are missing.

### Advisory Finding Summary

| Rule | Count | Verdict | Notes |
|------|-------|---------|-------|
| SCH-001 | 22 | **Incorrect** | All false positives — spans ARE registered as extensions |
| CDQ-007 | 41 | **Incorrect** | Per-file eval PASS for all files; generic message non-actionable; likely trace to known path/PII attributes |
| COV-004 | 1 | **Incorrect** | reflection-tool.js is a correct skip |
| COV-004 | 4 | **Accurate** | summary-detector.js partial — correctly identifies 4 missing spans |
| **Total incorrect/noise** | **63/68** | **93%** | Significant increase from run-21's 76% |

**Advisory noise rate**: 93% (63 incorrect or non-actionable out of 68). The rate increased from run-21's 76% for two reasons: (1) SCH-001 volume grew with the larger span count; (2) CDQ-007 count grew proportionally; (3) no CDQ-006 findings this run (CDQ-006 was the one "potentially valid" category in run-21). The only accurate signal is the 4 COV-004 advisories for summary-detector.js.

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All files, spans, attrs, schema changes, token usage listed |
| Accuracy | 4/5 | File-level data accurate; two span count discrepancies vs per-file eval (PR is correct); advisory findings 93% noise |
| Actionability | 1/5 | Only 4/68 advisory findings are accurate; CDQ-007 non-specific; SCH-001 systematic FP; no high-signal findings this run |
| Presentation | 4/5 | Clean markdown, span category breakdown table, partial callout correct |
| **Overall** | **3.5/5** | Drop from run-21's 3.75 — driven by higher advisory noise rate and absence of any CDQ-006 signal |

---

## Cost

| Source | Amount |
|--------|--------|
| PR total | $7.84 |
| Run-21 | $8.10 |
| Run-12 (12 committed) | $5.19 |
| Delta vs run-21 | **-$0.26** (modest improvement) |

**$7.84** — down $0.26 from run-21 despite one more committed file (13 vs 12). The P1 fixes landing eliminated retry chains on mcp/server.js and index.js (both 1-attempt in run-23 vs failures in run-21), and claude-collector.js needed only 1 attempt vs the CDQ-001 retry cycle. These savings were partially offset by summary-detector.js ($1.47 — most expensive single file this run, driven by SCH-002 rejection and a 2-attempt cycle that still ended partial).

The run-summary.md estimated ~$5.60 vs the PR's $7.84. The gap ($2.24) reflects that the run-summary estimate was derived from token counts using approximate pricing, while the PR reports the actual billed cost. The PR cost figure is authoritative.

**Primary cost drivers this run**:
- summary-detector.js: $1.47 (19% of total) — SCH-002 oscillation, 2 attempts, partial result
- journal-graph.js: $1.19 (15%) — 3 attempts, LangGraph instrumentation complexity
- summary-graph.js: $0.84 (11%) — 6-span file, 2 attempts
- journal-manager.js: $0.50 (6%) — 2 spans but includes LLM-facing attribute decisions
