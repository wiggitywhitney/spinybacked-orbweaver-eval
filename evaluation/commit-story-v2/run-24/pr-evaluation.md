// ABOUTME: PR artifact evaluation for run-24 — accuracy, advisory findings, and cost analysis.
# PR Artifact Evaluation — Run-24

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/81
**Branch**: spiny-orb/instrument-1781811083418
**State**: OPEN

---

## Push Auth — 16th Consecutive Success

PR #81 auto-created successfully. The fine-grained PAT and URL-swap mechanism continue to work without intervention.

---

## PR Summary Quality

**Length**: ~350 lines (longer than run-23's ~330 — new SDK Bootstrap Checklist section added)

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (31 total / 14 committed / 17 no changes) | YES | Matches run output |
| Per-file span counts | YES | All 14 instrumented files match; see span check table below |
| Per-file attempt counts | YES | git-collector 3, summarize 2, reflection-tool 2 (skip), all others 1 |
| Per-file cost | YES | Sum of listed = $5.03; PR total = $5.16 (~$0.13 orchestration overhead) |
| Correct skip list (17 files) | YES | All 17 listed including new logger.js; reflection-tool correctly in skip list |
| Schema attribute changes (13 new attrs) | YES | All 13 listed |
| Span extensions (48 new span IDs) | YES | All 48 listed |
| Recommended companion packages | YES | @traceloop/instrumentation-langchain, @opentelemetry/instrumentation-pino, @traceloop/instrumentation-mcp (pino replaces @traceloop/instrumentation-anthropic from run-23 — correct, commit-story-v2 PR #80 added pino OTLP logging) |
| Token usage | YES | Matches run output (110,198 in / 218,392 out / 212,599 cached) |
| Live-check | YES | OK — 665 spans, 4317 advisory findings |
| Outlier callouts | YES | summary-manager.js (9 spans) and summary-detector.js (9 spans) — both flagged "review recommended" |

**Span count verification** (all match per-file evaluation):

| File | PR Spans | Per-file Eval |
|------|----------|----------------|
| claude-collector.js | 1 | 1 |
| git-collector.js | 6 | 6 |
| journal-graph.js | 4 | 4 |
| summary-graph.js | 6 | 6 |
| context-integrator.js | 1 | 1 |
| context-capture-tool.js | 1 | 1 |
| mcp/server.js | 1 | 1 |
| journal-paths.js | 1 | 1 |
| journal-manager.js | 2 | 2 |
| summary-manager.js | 9 | 9 |
| summarize.js | 3 | 3 |
| summary-detector.js | 9 | 9 |
| auto-summarize.js | 3 | 3 |
| index.js | 1 | 1 |
| **Total** | **48** | **48** |

No per-file span count discrepancies this run (vs two in run-23).

### Schema Changes Section

PR correctly includes 13 new attributes and 48 new span IDs. Run-24 has 2 fewer attributes than run-23 (13 vs 15) because:
- `commit_story.git.diff_size` (SCH-003 failure in run-23) is absent — replaced by `commit_story.git.diff_lines` and `commit_story.git.parent_count`
- The three `commit_story.commands.*_summaries_generated` attributes (SCH-003 failures in run-23) are gone — replaced by `commit_story.commands.dates_count` and `commit_story.commands.force`

The schema changes section accurately reflects what was committed. The SCH-003 fix is visible in the attribute list: the integer-typed attributes from run-23 are completely replaced rather than type-corrected, which is a more durable fix.

### New SDK Bootstrap Checklist Section

Run-24 introduces a new "SDK Bootstrap Checklist" section not present in prior runs. It provides a code snippet showing how to register `service.name`, `service.version`, and `service.instance.id` with `randomUUID()`. This is a useful addition for reviewers setting up the instrumentation — particularly relevant given RUN23-4 (`service.instance.id` needed for Datadog trace correlation). The content is correct.

### Advisory Findings Quality

| File | CDQ-006 | CDQ-007 | SCH-001 | COV-004 | Total |
|------|---------|---------|---------|---------|-------|
| claude-collector.js | — | 2 | — | — | 2 |
| git-collector.js | — | 3 | 4 | — | 7 |
| journal-graph.js | 1 | 3 | 1 | — | 5 |
| summary-graph.js | — | — | 6 | — | 6 |
| context-integrator.js | — | 5 | 1 | — | 6 |
| context-capture-tool.js | 1 | 1 | 1 | — | 3 |
| reflection-tool.js | — | — | — | 1 | 1 |
| journal-paths.js | — | 1 | — | — | 1 |
| journal-manager.js | — | 2 | — | — | 2 |
| summary-manager.js | — | 12 | 9 | — | 21 |
| summarize.js | — | — | 2 | — | 2 |
| summary-detector.js | — | 9 | 8 | — | 17 |
| auto-summarize.js | — | 3 | 3 | — | 6 |
| **Total** | **2** | **41** | **35** | **1** | **79** |

#### SCH-001 (35 instances, 9 files): Systematic False Positive (same as run-23, volume increased)

SCH-001 fires for span names that "don't match your Weaver registry." All 35 instances are false positives: the flagged span names are listed in the PR's own "New Span IDs (48)" schema changes section — they ARE registered as extensions in the current run. The advisory checker does not recognize freshly registered in-run extensions.

SCH-001 volume increased from run-23's 22 to 35. Primary drivers:
- summary-manager.js: 9 SCH-001 (9 new spans, all newly registered this run)
- summary-detector.js: 8 SCH-001 (9 new spans in run-24 vs 4 in run-23's partial; the full commit triggers more false positives)

Pattern unchanged since run-21. Unresolved pending spiny-orb issue #902.

#### CDQ-007 (41 instances, 12 files): Non-Actionable Without Per-Instance Detail

CDQ-007 fires with identical generic message ("one or more of: a PII attribute name or a raw filesystem path") across all 41 instances. Per-file evaluation finds CDQ-007 PASS for all 14 committed files — the specific attributes triggering these are known benign items (likely `commit_story.journal.file_path`, which appears across many files). Count held flat at 41 despite adding one committed file (14 vs 13 in run-23), suggesting the new files (summary-detector.js going from 4 spans to 9) drove proportional growth offset elsewhere.

**Incorrect** — same pattern as run-23.

#### CDQ-006 (2 instances, 2 files): Both False Positives

| Finding | Verdict | Notes |
|---------|---------|-------|
| CDQ-006 on journal-graph.js | **Incorrect** | journal-graph.js has 4 spans, 0 custom attributes per per-file evaluation — no `setAttribute()` calls with expensive computations; advisory cannot apply |
| CDQ-006 on context-capture-tool.js | **Incorrect** | context-capture-tool.js has 1 span, 0 custom attributes per per-file evaluation — same analysis; advisory cannot apply |

These are new CDQ-006 firings (0 in run-23). Both are false positives — the files have no custom `setAttribute()` calls in the committed instrumentation.

#### COV-004 (1 instance, 1 file): Incorrect

| Finding | Verdict | Notes |
|---------|---------|-------|
| COV-004 on reflection-tool.js (×1) | **Incorrect** | File is in the correct-skip list (RST-001); all functions are sync utility; RST-001 exemption applies |

Run-24 has no accurate COV-004 findings (vs 4 accurate in run-23 for summary-detector.js's partial). The absence of partials in run-24 eliminates the one advisory rule that was providing signal.

### Advisory Finding Summary

| Rule | Count | Verdict |
|------|-------|---------|
| SCH-001 | 35 | **Incorrect** — all false positives; spans ARE registered as extensions |
| CDQ-007 | 41 | **Incorrect** — per-file eval PASS for all files; generic message non-actionable |
| CDQ-006 | 2 | **Incorrect** — both files have 0 custom attributes; advisory cannot apply |
| COV-004 | 1 | **Incorrect** — file is a correct RST-001 skip |
| **Total incorrect/noise** | **79/79** | **100%** |

**Advisory noise rate: 100%** — first run with zero actionable advisory findings. The absence of partials in run-24 eliminates the COV-004 accuracy signal that run-23 had (4/68 accurate). The full clean sweep is the cause: no partials means no COV-004 signal, and more committed spans means more SCH-001 false positives. The advisory system becomes less useful as runs get better.

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All 31 files, 48 spans, 13 attrs, 48 span IDs, schema changes, outlier callouts, new SDK Bootstrap section |
| Accuracy | 5/5 | All file-level data matches per-file eval; no span count discrepancies (improvement over run-23); per-file costs internally consistent |
| Actionability | 0.5/5 | 0/79 advisory findings actionable; CDQ-007 non-specific; SCH-001 systematic FP; CDQ-006 inapplicable; COV-004 FP |
| Presentation | 5/5 | Clean markdown; span category breakdown table; dual outlier callouts; new SDK Bootstrap Checklist is a useful addition |
| **Overall** | **3.9/5** | Up from run-23's 3.5 — driven by improved accuracy (no span count discrepancies) and better presentation (SDK Bootstrap section), offset by worsening advisory noise (100% vs 93%) |

---

## Cost

| Source | Amount |
|--------|--------|
| PR total (actual) | **$5.16** |
| Run-summary estimate | ~$3.70 |
| Estimate gap | -$1.46 (estimate undershot by 28%) |
| Run-23 actual | $7.84 |
| Delta vs run-23 | **-$2.68 (-34%)** |
| Run-21 actual | $8.10 |

**$5.16** — down $2.68 (34%) from run-23. The clean sweep drove the reduction:
- Only 3 multi-attempt files vs run-23's 7 (git-collector.js @3, summarize.js @2, reflection-tool @2 to reach skip)
- High cache utilization: 212.6K cached of 322.8K total input tokens = 66% cache hit rate
- 0 failures = no expensive retry chains that produced no output

**Per-file cost highlights**:

| File | Cost | Spans | Attempts | Notes |
|------|------|-------|----------|-------|
| summary-manager.js | $0.62 | 9 | 1 | Most expensive 1-attempt file — 9-span scope |
| summarize.js | $0.63 | 3 | 2 | SCH-003 fix required 2 attempts |
| git-collector.js | $0.63 | 6 | 3 | RUN23-1 fix: highest attempt count this run |
| summary-graph.js | $0.59 | 6 | 1 | LangGraph + 4 new attrs |
| journal-graph.js | $0.57 | 4 | 1 | LangGraph complexity at 1 attempt (was 3 in run-23) |
| mcp/server.js | $0.05 | 1 | 1 | Cheapest file: simple MCP server entry point |

The run-summary estimate (~$3.70) undershot the PR actual ($5.16) by 28%. This is a smaller gap than run-23 ($5.60 estimate vs $7.84 actual = 29% undershoot) but the same systematic pattern. The estimate uses token-count pricing without accounting for cache write tokens (396,588 tokens = significant write cost). The PR cost figure is authoritative.
