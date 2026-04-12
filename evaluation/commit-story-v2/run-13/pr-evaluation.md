# PR Artifact Evaluation — Run-13

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/62
**Branch**: spiny-orb/instrument-1776014409398
**State**: OPEN

---

## Push Auth — Third Consecutive Success

PR #62 is the third consecutive successfully created PR (PR #60 run-11, PR #61 run-12). The fine-grained PAT continues to work. The URL swap mechanism fired correctly (`urlChanged=true, path=token-swap`).

---

## PR Summary Quality

**Title**: "Add OpenTelemetry instrumentation (18 files)"
**Note on title**: "18 files" = 7 committed + 11 correct skips. The title counts all files with a confirmed instrumentation outcome (success or correct skip). The 11 failed files are excluded. This is consistent with prior runs.

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (30 processed / 7 committed / 11 skipped / 11 failed / 1 partial) | YES | Matches run output |
| Per-file span counts | YES | All 7 committed + 1 partial match verbose output |
| Per-file attempt counts | YES | Correct for all files |
| Per-file cost | YES | Sum ≈ $6.41 |
| Correct skip list (11 files) | YES | All listed |
| Failure reasons | YES | Checkpoint rollback files correctly labeled "Rolled back: checkpoint test failure at file N/30" |
| Schema attribute changes | YES | All new span names and attribute keys listed |
| Recommended companion packages | YES | @traceloop/instrumentation-langchain listed for journal-graph.js |
| Token usage | YES | 273.2K input, 272.0K output, 800.4K cached |
| Live-check | PARTIAL — accurately reported | "Live-check partial: 11 file(s) failed instrumentation" |

### Advisory Findings Quality

The PR summary includes **7 advisory findings**. Three are on rolled-back files (summary-graph.js ×2, index.js ×1) — these are moot since those files were not committed.

**Advisories on committed or partial files (4):**

| Finding | File | Verdict | Notes |
|---------|------|---------|-------|
| SCH-004: `commit_story.summarize.date_count` redundant with time_window_start/end | summarize.js | **Incorrect** | date_count is an integer count of input dates; time_window_start/end are ISO timestamp boundaries — completely different semantics |
| SCH-004: `commit_story.summarize.force` redundant with `gen_ai.request.max_tokens` | summarize.js | **Incorrect** | force is a boolean CLI override flag; gen_ai.request.max_tokens is an LLM token limit — no semantic relationship |
| SCH-004: `commit_story.summarize.failed_count` → use `error_count` | summarize.js | **Partially valid** | Naming preference only; failed_count is acceptable but error_count aligns better with OTel conventions |
| CDQ-006: `Object.keys(result).filter(...)` without isRecording() guard | journal-graph.js | **Valid** | Object.keys + filter + join is a non-trivial computation; should be guarded with `if (span.isRecording())` — file wasn't committed but finding is accurate |

**Moot advisories (3 — files rolled back):**

| Finding | File | Notes |
|---------|------|-------|
| SCH-004: week_label redundant with week_count | summary-graph.js | Incorrect (string label ≠ integer count) + moot |
| SCH-004: month_label redundant with month_count | summary-graph.js | Incorrect (string label ≠ integer count) + moot |
| NDS-005: original try/catch missing | index.js | Moot — file rolled back |

**Advisory contradiction rate**: 4 incorrect out of 6 non-moot advisories = **67%** (up from run-12's 44%, well above 30% target).

The SCH-004 judge continues to produce false semantic equivalences. In this run it hallucinated that a boolean flag (`force`) is equivalent to a token limit, and that a count of input dates is equivalent to time window timestamps. This has been a persistent issue since run-11.

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 4/5 | All committed files present; accurate failure reasons; correct skip list complete |
| Accuracy | 3/5 | Per-file data accurate; advisory findings noisy (67% contradiction rate) |
| Actionability | 3/5 | CDQ-006 finding is useful; SCH-004 findings are noise for reviewers |
| Presentation | 4/5 | Clean markdown; rollback reason text is clear and specific |
| **Overall** | **3.5/5** | Down from run-12's 4.25/5 — primary driver is advisory contradiction rate increase |

---

## Cost

| Source | Amount |
|--------|--------|
| Run-13 total | ~$6.41 |
| PRD target | ≤$4.00 |
| Run-12 | $5.19 |
| Delta vs run-12 | +$1.22 |
| Delta vs target | +$2.41 |

**~$6.41** — $2.41 over the $4.00 target. Highest cost across all runs. $4.68 of total was spent on rolled-back files or unpreserved partials (sunk cost):

| Sunk cost file | Cost | Outcome |
|----------------|------|---------|
| summary-manager.js | $1.77 | Rolled back |
| journal-graph.js | $1.54 | Partial, not preserved in git |
| journal-manager.js | $0.75 | Rolled back |
| index.js | $0.33 | Rolled back |
| summary-graph.js | $0.29 | Rolled back |
| **Total sunk** | **$4.68** | — |

Cost of useful committed work: **~$1.73** (7 files × avg ~$0.21). The checkpoint mechanism preserved quality but at significant cost inefficiency.

**Token profile**: 273.2K input, 272.0K output, 800.4K cached. Output tokens nearly match input tokens — unusually balanced, driven by large files (summary-manager.js at 77.4K output). The 800.4K cached token count reflects extensive retry passes re-reading file content from cache.
