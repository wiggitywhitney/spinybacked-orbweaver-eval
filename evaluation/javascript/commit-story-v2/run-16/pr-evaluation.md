# PR Artifact Evaluation — Run-16

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/68
**Branch**: spiny-orb/instrument-1778526749797
**State**: OPEN
**Auto-created**: YES (sixth consecutive)

---

## Push Auth — Sixth Consecutive Success

PR #68 auto-created. The fine-grained PAT continues to work. URL swap mechanism fired correctly (`urlChanged=true, path=token-swap`).

---

## PR Summary Accuracy

**Length**: ~270 lines

| Element | Accurate | Notes |
|---------|----------|-------|
| Files processed (30 total) | YES | Matches run output |
| Committed (10) | YES | |
| No changes needed (14) | YES | |
| Failed (3) | YES | context-capture-tool.js, reflection-tool.js, index.js |
| Partial (3) | YES | journal-graph.js, commit-analyzer.js, summary-manager.js |
| Per-file span counts | YES | All 16 instrumented files match |
| Per-file attempt counts | YES | Correct |
| Per-file cost | YES | Sum = $12.29 (matches token usage table) |
| Correct skip list (14 files) | YES | All listed |
| Schema attribute changes (6 new) | YES | entries_count, month_label, months_count, week_label, weeks_count, mcp.transport |
| New span IDs (38) | YES | All 38 listed |
| Failure warnings | YES | All 3 failures documented with stop_reason and output_tokens |
| Token usage | YES | 387.2K input / 549.6K output / 794.2K cached |
| Live-check | YES | OK (543 spans, 3615 advisory findings) |
| Recommended companion packages | YES | @traceloop/instrumentation-langchain, @traceloop/instrumentation-mcp |
| SDK Bootstrap Checklist | YES (new) | Includes service.instance.id guidance — useful addition |

### Schema Changes Section

PR correctly lists 6 new attribute extensions and 38 new span IDs. Schema version held at 0.1.0 (no version bump for extensions — consistent with prior runs).

---

## Cost

| Source | Amount |
|--------|--------|
| PR total | $12.29 |
| Run-15 | $6.44 |
| Run-14 | $5.59 |
| Delta vs run-15 | **+$5.85** |
| PRD target | ≤$4.00 |

**$12.29** — nearly double run-15. Significant cost regression. Cost breakdown:

| Driver | Cost | Share |
|--------|------|-------|
| Cache write overhead | $2.64 | 21% |
| journal-graph.js (3 attempts, 112K output) | $2.30 | 19% |
| summary-manager.js (2 attempts, 105.7K output) | $2.28 | 19% |
| summary-graph.js (2 attempts, 72.5K output) | $1.69 | 14% |
| summarize.js (3 attempts) | $1.64 | 13% |
| journal-manager.js (3 attempts) | $1.22 | 10% |
| context-integrator.js (3 attempts) | $0.90 | 7% |
| context-capture-tool.js (failed, wasted) | $0.45 | 4% |
| All other | $0.17 | 1% |

The cache write cost ($2.64) is new — run-16 wrote 705.2K cache tokens vs run-15's likely lower cache write volume. Failed files (context-capture-tool.js $0.45, reflection-tool.js $0.37) account for $0.82 of pure waste from token-exhausted thinking calls.

---

## Advisory Findings Quality

**Total advisory findings in PR**: 36

| Category | Count | Valid | False Positive | Notes |
|----------|-------|-------|----------------|-------|
| CDQ-007 null guard | 22 | 0 | 22 | Variables initialized from array-returning functions (readdir, expandDateRange); cannot be null |
| CDQ-007 path (raw path) | 3 | 3 | 0 | Valid but **unactionable** — basename not imported; CDQ-007 import constraint applies |
| SCH-001 semantic duplicate | 11 | 0 | 11 | Superficial namespace similarity across functionally distinct operations |
| **Total** | **36** | **3** | **33** | |

**Advisory contradiction rate: 92%** (33 false positives out of 36 total)

### CDQ-007 Null Guard — All False Positives (22)

Every flagged `.length`/`.size` access on arrays and Sets in summary-graph.js, journal-manager.js, summary-manager.js, summarize.js, and summary-detector.js is on a variable initialized from a function that returns an array or Set, never null:
- `entries`, `dailySummaries`, `weeklySummaries` in summary-graph.js: returned by async readdir wrappers with graceful ENOENT catch → return `[]`
- `reflections` in journal-manager.js: built via `push()` operations, always an array
- `summaries` in summary-manager.js: returned by readdir wrappers
- `dates`, `weeks`, `months` in summarize.js: returned by `expandDateRange()` which returns arrays
- `dates`, `result`, `weeks`, `months`, `unsummarized` in summary-detector.js: initialized from readdir operations with ENOENT catch → return `[]` or `new Set()`

The CDQ-007 checker cannot see the return types of these functions and conservatively flags all non-guarded property accesses. All 22 are false positives.

### CDQ-007 Path — Valid but Unactionable (3)

`filePath` in journal-paths.js, `entryPath` in journal-manager.js, and `path`/`summaryPath` in summary-manager.js are raw filesystem paths. The CDQ-007 advisory correctly identifies these as high-cardinality. However, `basename` is not imported in any of these files, and CDQ-007's import constraint prohibits adding non-OTel imports to fix the advisory. Correctly noted as a known limitation in agent notes.

### SCH-001 Semantic Duplicate — All False Positives (11)

summary-detector.js (8 advisories): the file has 9 specialized query functions for daily/weekly/monthly gap detection — `get_days_with_entries`, `get_summarized_days`, `find_unsummarized_days`, `get_days_with_daily_summaries`, `get_summarized_weeks`, `find_unsummarized_weeks`, `get_summarized_months`, `get_weeks_with_weekly_summaries`, `find_unsummarized_months`. The SCH-001 judge matched operations with superficial name similarities (e.g., `get_summarized_days` vs `generate_daily_summary`) but these are operationally distinct: detection queries vs generation pipelines, daily vs weekly vs monthly cadences, "get all" vs "find gaps". All 8 advisories are false positives.

Notable: One SCH-001 advisory shows the known placeholder bug: "reuse 'the existing name'" — the message formatter failed to populate the specific conflicting span name, leaving a literal placeholder. This is the same SCH-001 message formatting bug observed in run-15 (RUN15-4).

auto-summarize.js (3 advisories): `trigger_auto_summaries` vs `run_summarize` — trigger layer orchestrates all cadences; run layer executes one cadence. Functionally distinct. False positives.

### Review Attention Flag

PR correctly flags `summary-detector.js` as an outlier with 9 spans vs 3-span average. All 9 spans are legitimate (9 async gap-detection functions for three cadences × three operations). The outlier flag is appropriate structural signal even though the spans are correct.

---

## New PR Features vs Run-15

**SDK Bootstrap Checklist** (new): PR now includes a checklist with the `service.instance.id: randomUUID()` pattern. This directly addresses the RES-001 gap identified in run-14/15. Well-placed in the PR body — gives deployers a concrete action.

**Failure warnings section** (improved): The three failures are clearly documented with `stop_reason`, `output_tokens`, and `raw_preview: <no text content>` — all the diagnostic information needed to understand the null parsed_output failure mode (D2).

**Live-check partial warning** (new): PR correctly notes the live-check compliance report may be incomplete due to 3 failed files. This is an honest caveat.

---

## Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All files, spans, attrs, schema changes, failures, token usage |
| Accuracy | 5/5 | All file-level data matches run output exactly |
| Actionability | 2/5 | 3 CDQ-007 path findings are valid but unactionable; 33 advisories are noise; SDK checklist is useful |
| Presentation | 5/5 | Clear structure, per-file table, Schema Changes section, SDK Bootstrap Checklist |
| **Overall** | **4.25/5** | Strong structure; advisory signal-to-noise still poor (92% false positive rate) |

---

## Advisory Contradiction Rate History

| Run | Rate | Notes |
|-----|------|-------|
| Run-11 | ~40% | Baseline |
| Run-12 | ~44% | SCH-004 judge + CDQ-006 false positives |
| Run-15 | ~94% | CDQ-007 null guards + SCH-001 semantic dedup |
| Run-16 | **92%** | Same pattern — CDQ-007 null guards + SCH-001 semantic dedup |

The advisory quality has not improved since run-14. CDQ-007's null guard check cannot see through function return types; SCH-001's semantic dedup judge fires on superficial namespace prefix similarities within the same file. Both are systemic issues requiring validator improvements, not agent prompt changes.
