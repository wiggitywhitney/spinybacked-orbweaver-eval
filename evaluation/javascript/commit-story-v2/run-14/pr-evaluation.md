# PR Artifact Evaluation — Run-14

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/65
**Branch**: spiny-orb/instrument-1776263984892
**State**: OPEN

---

## Push Auth — Fourth Consecutive Success

PR #65 is the fourth consecutive successfully created PR (runs 11–14). The fine-grained PAT continues to work. URL swap mechanism fires correctly (`urlChanged=true, path=token-swap`).

---

## PR Summary Quality

**Length**: ~230 lines

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (30 total / 12 committed / 18 skips) | YES | Matches run output |
| Per-file span counts | YES | All 12 committed files match |
| Per-file attempt counts | YES | Correct |
| Per-file cost | YES | Sum = $5.59 |
| Correct skip list (18 files) | YES | All 18 files listed |
| Schema attribute additions (13 attrs) | YES | All listed |
| New span IDs (32) | YES | All 32 listed |
| Recommended companion packages | YES | @traceloop/instrumentation-langchain, @traceloop/instrumentation-mcp |
| Token usage | YES | 195,275 input / 226,912 output / 416,944 cache read / 393,535 cache write |
| Live-check | YES | OK |
| Outlier review flags | YES | summary-graph.js (6 spans) and summary-detector.js (5 spans) correctly flagged |

### Schema Changes Section

The PR summary correctly includes both attribute additions (13 new attrs) and 32 new span IDs. Format is consistent with runs 11–13.

**13 new attributes** are notably a first-run buildout — these are schema extensions created for the first time across the full codebase.

**32 new span IDs** represent near-complete first-time instrumentation across all meaningful code paths. This is the first run where the full span topology is established.

### Advisory Findings Quality

6 advisory findings total (significantly fewer than run-13's 7). Assessment:

| Finding | Verdict | Notes |
|---------|---------|-------|
| SCH-004 on summarize.js `generated_count` (confidence 72%) | **Incorrect** | `commit_story.summarize.generated_count` counts AI-generated summaries; `commit_story.context.messages_count` counts chat messages. Different domains, different semantics. Not a duplicate. |
| COV-004 on index.js `handleSummarize` | **Contextually invalid** | index.js is a correct skip — all code paths call `process.exit()`, making spans uncloseably impossible (CDQ-001 block). The agent correctly documented this. Advisory finding is technically accurate but misses the CDQ-001 constraint. |
| CDQ-006 on journal-manager.js `entryPath.split('/').pop()` | **Incorrect** | `.split('/').pop()` on a file path string is a trivial O(n) operation where n is the path length (~20–80 chars). The CDQ-006 exemption covers operations "whose cost is negligible" — this qualifies. Same false positive pattern as run-12. |
| COV-004 on context-capture-tool.js `saveContext` | **Partially valid** | `saveContext` is unexported — RST-004 exemption applies. Advisory, not canonical. Documenting it as advisory is correct. |
| COV-004 on reflection-tool.js `saveReflection` | **Partially valid** | `saveReflection` is unexported — same as above. Advisory, not canonical. |
| CDQ-008 (run-level) | **Correct** | All 12 tracers use `'commit-story'` consistently. |

**Advisory contradiction rate**: 2 clearly incorrect out of 5 non-trivial findings = **40%**.

Comparison:
| Run | Advisory Contradiction Rate |
|-----|----------------------------|
| Run-11 | ~45% |
| Run-12 | 44% |
| Run-13 | 67% |
| **Run-14** | **40%** |

The SCH-004 false positives that dominated run-13 (4 findings: dates_count, force/max_tokens, week_label/week_count, month_label/month_count) are entirely absent from run-14. The SCH-004 namespace pre-filter fix (issue #440 + PR #480) significantly reduced the SCH-004 false positive rate. Only 1 SCH-004 finding appeared, and it is still incorrect (semantic equivalence misidentified), but the volume is dramatically lower.

No NDS-005 false positives appeared (run-12 had 1 false positive on index.js, run-13 had none visible in committed files).

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All 12 files, 32 spans, 13 attrs, schema changes listed |
| Accuracy | 4/5 | File-level data accurate; advisory findings mixed but fewer false positives than prior runs |
| Actionability | 3/5 | COV-004 advisories for context-capture-tool and reflection-tool are useful; SCH-004 and CDQ-006 findings add noise |
| Presentation | 4/5 | Clean markdown, good tables; outlier review flags useful |
| **Overall** | **4.0/5** | Slightly below run-12 (4.25/5) due to actionability — fewer total findings means less genuine signal |

---

## Cost

| Source | Amount |
|--------|--------|
| PR total (actual) | $5.59 |
| Pre-run estimate | ~$4.10 |
| Estimate vs actual delta | +$1.49 (cache write tokens not included in estimate) |
| PRD target | ≤$4.00 |
| Run-13 | ~$6.41 |
| Run-12 | $5.19 |
| Delta vs run-13 | **-$0.82** |
| Delta vs target | +$1.59 |

**$5.59** — $1.59 over the $4.00 target. The estimate of ~$4.10 omitted cache write tokens (393,535 tokens × ~$3.75/MTok ≈ $1.49 additional), which explains the gap. Better than run-13 (-$0.82) but not within target.

Cost breakdown (from PR summary):
| File | Cost | Attempts |
|------|------|----------|
| src/generators/journal-graph.js | $1.52 | 3 |
| src/managers/summary-manager.js | $1.13 | 3 |
| src/utils/journal-paths.js | $0.34 | 3 |
| src/managers/journal-manager.js | $0.43 | 2 |
| src/utils/summary-detector.js | $0.41 | 2 |
| src/commands/summarize.js | $0.21 | 1 |
| src/managers/auto-summarize.js | $0.17 | 1 |
| src/collectors/claude-collector.js | $0.14 | 1 |
| src/mcp/server.js | $0.13 | 1 |
| src/collectors/git-collector.js | $0.13 | 1 |
| src/integrators/context-integrator.js | $0.11 | 1 |
| src/generators/summary-graph.js | $0.31 | 1 |
| **Total** | **$5.59** | |

Primary cost driver: journal-graph.js (3 attempts, $1.52 = 27% of total). This is consistent with runs 12–13 — journal-graph.js is the largest file and has consistently required 3 attempts. summary-manager.js at 3 attempts ($1.13) is a new addition to the high-cost set; it was rolled back in run-13 so no prior baseline exists for this file.

The 12 single-attempt files sum to $1.31 total — the low-cost floor. The 5 multi-attempt files account for $3.83 (68% of total cost despite being 42% of files). Reducing attempts in journal-graph.js from 3 to 2 would save ~$0.50/run.

---

## Notable: First Complete Span Topology

Run-14 establishes the full span topology for commit-story-v2 for the first time. With 32 new span IDs and 13 new attributes, the schema extensions now document every instrumented entry point. This is the baseline against which future run-15+ diffs will measure.

The companion package note is accurate and actionable:
> Initialize @traceloop/instrumentation-langchain and @traceloop/instrumentation-mcp **inside application code**, not via --import. Loading via --import can install a competing ESM hook registry, causing spans to be silently dropped.
