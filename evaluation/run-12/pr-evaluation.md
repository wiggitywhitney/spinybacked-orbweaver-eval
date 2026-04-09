# PR Artifact Evaluation — Run-12

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/61
**Branch**: spiny-orb/instrument-1775717624848
**State**: OPEN

---

## Push Auth — Second Consecutive Success

PR #61 is the second consecutive successfully created PR (PR #60 was run-11's first). The fine-grained PAT continues to work. The URL swap mechanism fires correctly (`urlChanged=true, path=token-swap`).

---

## PR Summary Quality

**Length**: 240 lines

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (30/12/17/1 partial) | YES | Matches run output |
| Per-file span counts | YES | All 13 files (12 committed + 1 partial) match |
| Per-file attempt counts | YES | Correct |
| Per-file cost | YES | Sum = $5.19 |
| Correct skip list | YES | All 17 files listed |
| Schema attribute changes (9 attrs) | YES | All listed |
| Span extensions (31) | YES | All 31 listed |
| Recommended companion packages | YES | @traceloop/instrumentation-langchain, @traceloop/instrumentation-mcp |
| Token usage | YES | Matches run output |
| Live-check | YES | OK |

### Schema Changes Section

The PR summary correctly includes both attribute additions (9 new attributes) and span extensions (31). The RUN9-3 fix (schema changes section omitting span extensions) continues to hold from run-11.

### Advisory Findings Quality

The PR summary includes 19 advisory findings. Assessment:

| Finding | Verdict | Notes |
|---------|---------|-------|
| SCH-004 on summarize.dates_count | **Incorrect** | Advisory contradicts itself — states "no semantically equivalent registered attribute" then still flags as duplicate |
| SCH-004 on summary-graph.js week_label | **Incorrect** | week_label (string ISO week identifier) is semantically distinct from weeks_count (integer count) |
| SCH-004 on summary-graph.js month_label | **Incorrect** | month_label (string identifier) is semantically distinct from months_count (integer count) |
| SCH-004 on mcp/server.js server_name | **Incorrect** | commit_story.mcp.server_name is MCP server identity, not gen_ai.provider.name |
| NDS-005 on index.js | **Incorrect** | False positive — auto-summarize try/catch preserved at line 505; judge confused by startActiveSpan restructuring |
| CDQ-006 on journal-manager.js | **Incorrect** | `.toISOString().split('T')[0]` is exempt (trivial string operation, O(1)); no guard required |
| COV-004 on summary-manager.js (6x) | **Valid** | readDayEntries, saveDailySummary, readWeekDailySummaries, saveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary are exported async I/O functions without spans — genuine quality finding |
| COV-004 on context-capture-tool.js | **Partially valid** | saveContext is unexported; advisory, not canonical failure |
| COV-004 on reflection-tool.js | **Partially valid** | saveReflection is unexported; advisory, not canonical failure |
| COV-004 on summary-detector.js (4x) | **Partially valid** | getSummarized*/getWeeksWith* are unexported; advisory; 2 exported functions skipped due to API overload |
| CDQ-008 (run-level) | **Correct** | Consistent 'commit-story' naming confirmed |

**Advisory contradiction rate**: 7 incorrect out of 16 non-trivial advisories = **44%** (above 30% target, similar to run-11's 45%).

The SCH-004 judge continues to hallucinate semantic equivalence between unrelated attributes. CDQ-006 judge continues to flag trivial conversions despite the explicit exemption. The COV-004 judge correctly identified the summary-manager.js gap (6 advisory findings that are actually canonical failures).

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All files, spans, attrs, schema changes listed |
| Accuracy | 4/5 | File-level data accurate; advisory findings mixed |
| Actionability | 4/5 | COV-004 advisories for summary-manager.js are genuinely useful; other advisories are noise |
| Presentation | 4/5 | Clean markdown, good tables |
| **Overall** | **4.25/5** | Matches run-11 rating |

---

## Cost

| Source | Amount |
|--------|--------|
| PR total | $5.19 |
| PRD target | ≤$4.00 |
| Run-11 | $4.25 |
| Delta vs run-11 | +$0.94 |
| Delta vs target | +$1.19 |

**$5.19** — $1.19 over the $4.00 target. Highest cost across runs 8-12. Primary drivers:
- journal-graph.js 3 attempts ($1.51, 29% of total)
- index.js 2 attempts ($0.67 for a 1-span file)
- Output tokens 208.1K (run-11: 158.7K, +49.4K)

The 498.7K cached tokens partially offset the cost increase (retry passes re-read cached content).
