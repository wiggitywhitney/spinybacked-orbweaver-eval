# PR Artifact Evaluation — Run-21

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/74
**Branch**: spiny-orb/instrument-1780596389399
**State**: OPEN

---

## Push Auth — 13th Consecutive Success

PR #74 auto-created successfully — the 13th consecutive automatic push/PR. No manual intervention required.

---

## PR Summary Quality

**Length**: ~240 lines

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (30 total / 12 committed / 16 no changes / 2 failed) | YES | Matches run output |
| Per-file span counts | YES | All 12 committed files match run-summary |
| Per-file attempt counts | YES | Correct for all 14 instrumented/attempted files |
| Per-file cost | YES | Sum of listed costs = $7.95; PR total $8.10 (~$0.15 orchestration overhead) |
| Correct skip list (16 files) | YES | All 16 correctly skipped files listed |
| Schema attribute changes (12 new attrs) | YES | All 12 listed |
| Span extensions (42 new span IDs) | YES | All 42 listed |
| Recommended companion packages | YES | @traceloop/instrumentation-langchain, @traceloop/instrumentation-mcp |
| Token usage | YES | Matches run output (296.5K in / 302.0K out / 396.0K cached) |
| Live-check | YES | OK — 598 runtime spans, 4495 advisory findings |
| Outlier callout (summary-manager, 9 spans) | YES | "review recommended" correctly flagged |

**New in run-21**: PR includes a **Span Category Breakdown** table with columns External Calls / Schema-Defined / Service Entry Points / Total Functions. Mostly accurate; git-collector anomaly: the table accounts for only 3/6 spans (1 External Call + 2 Service Entry Points = 3), leaving 3 internal async helpers (getCommitMetadata, getCommitDiff, getMergeInfo) uncategorized. This is not a canonicalized failure but a limitation of the classification — the 3 helpers correctly have spans per per-file evaluation. All other files in the table sum correctly.

### Schema Changes Section

PR correctly includes both attribute additions (12) and all 42 new span IDs. The span IDs span the full breadth of PRD #902 auto-registration output, including cross-file attribute reuse (e.g., `entries_count` and `weekly_summaries_count` registered once by summary-graph.js then reused cleanly by summary-manager and summary-detector).

### Advisory Findings Quality

The PR contains **58 advisory findings** across 13 files. This is notably higher than run-12's 19, reflecting the scale increase (12 committed files, 42 new span IDs, ~60 new schema extensions).

#### SCH-001 (17 instances, 7 files): Systematic False Positive

SCH-001 fires for span names that "don't match your Weaver registry." All 17 instances are false positives: per-file evaluation confirms SCH-001 PASS for every affected file (git-collector, journal-graph, summary-graph, context-capture-tool, summary-manager, auto-summarize). All flagged span names are listed in the PR's own "New Span IDs (42)" schema changes section — they ARE registered as extensions. The advisory checker does not recognize freshly registered extensions, making SCH-001 fire for any span registered in the current run.

#### CDQ-007 (34 instances, 9 files): Mostly Non-Actionable

CDQ-007 fires for "PII attribute name or raw filesystem path." All 34 instances use an identical generic message with no indication of which specific attribute triggered the finding. Per-file evaluation finds CDQ-007 PASS for 8 of 9 files. The one exception is summary-manager (12 CDQ-007 advisories, 9 spans): `commit_story.journal.file_path` is a raw filesystem path attribute present on most summary-manager spans — this is the real trigger, repeated once per span. The finding is partially valid (journal.file_path is a known limitation, flagged PARTIAL in per-file eval) but is not actionable without per-file detail given it's a design-level tradeoff, not a code error.

The high CDQ-007 volume (34 instances, 59% of all advisories) with no per-instance specificity is the primary driver of advisory noise in run-21.

#### COV-004 (5 instances, 2 files): False Positives

| Finding | Verdict | Notes |
|---------|---------|-------|
| COV-004 on reflection-tool.js (×1) | **Incorrect** | File correctly skipped — all functions are now sync (code refactored since run-20); per RST-001 exemption |
| COV-004 on summary-detector.js (×4) | **Incorrect** | All 5 exported async functions have spans; per-file eval COV-004 PASS; advisory fires for unexported helpers (getSummarizedDays, getSummarizedWeeks, getSummarizedMonths, getWeeksWithWeeklySummaries) which are not required by COV-004 when exported callers are covered |

#### CDQ-006 (2 instances, 2 files): Potentially Valid

CDQ-006 fires for expensive computations or external source strings in `setAttribute` without an `isRecording()` guard. Two instances:
- context-capture-tool.js: saveContext stores journal entry content (external string from user input) — potentially valid
- journal-manager.js: likely fires on a path or content attribute — not confirmed from per-file evaluation excerpts

Both are plausibly valid findings, but not canonicalized failures in per-file evaluation since CDQ-006 was not evaluated in those sections.

### Advisory Finding Summary

| Rule | Count | Verdict | Notes |
|------|-------|---------|-------|
| SCH-001 | 17 | **Incorrect** | All false positives — spans ARE registered as extensions |
| CDQ-007 | 22 | **Incorrect** | Per-file eval PASS; generic message non-actionable |
| CDQ-007 | 12 | **Partially valid** | summary-manager journal.file_path — real finding, repetitive |
| COV-004 | 5 | **Incorrect** | reflection-tool correctly skipped; summary-detector all async fns covered |
| CDQ-006 | 2 | **Potentially valid** | External source strings; not confirmed by per-file eval |
| **Total incorrect** | **44/58** | **76%** | Up from run-12's 44%; driven by SCH-001 systematic FP + CDQ-007 volume |

**Advisory contradiction rate**: ~76% (44 confirmed incorrect out of 58 total). The SCH-001 systematic false positive (17 instances across 6 new-span files) is a new structural problem in run-21 — it was not present in run-12 because run-12 had fewer newly registered spans in a single run. PRD #902's large auto-registration output makes this problem acute.

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All files, spans, attrs, schema changes, token usage listed |
| Accuracy | 4/5 | File-level data fully accurate; advisory findings ~76% false positive rate |
| Actionability | 2/5 | SCH-001 (17) and COV-004 (5) false positives; CDQ-007 non-specific; only CDQ-006 (2) is genuinely actionable |
| Presentation | 4/5 | Clean markdown, good tables; new span category breakdown is a useful addition (minor gap in git-collector) |
| **Overall** | **3.75/5** | Strong data tables drag a low advisory signal; drop from run-12's 4.25 |

The advisory system's SCH-001 false positive pattern is the most important structural finding: PRD #902's large batch of newly registered spans (42) causes every span registered within the current run to be flagged as non-compliant by the advisory checker. This will recur in any run with large auto-registration output unless the advisory checker is updated to recognize in-run schema extensions.

---

## Cost

| Source | Amount |
|--------|--------|
| PR total | $8.10 |
| Run-20 | $9.08 |
| Run-12 (12 committed) | $5.19 |
| Delta vs run-20 | **-$0.98** (improvement) |

**$8.10** — down $0.98 from run-20 despite similar committed file count (12 vs 12). Primary driver of improvement: 3-attempt rate dropped from 46% (6/13 files) to 8% (1/12 files). Only summarize.js required 3 attempts ($1.55). Run-21's cost is elevated vs run-12 ($5.19) due to the larger scope of committed files and PRD #902's extended schema registrations, but within the expected range for a 12-file run with two 2-attempt files (journal-graph at $0.80, summary-detector at $1.39).
