# PR Artifact Evaluation — Run-11

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/60
**Title**: "Add OpenTelemetry instrumentation (30 files)"
**State**: OPEN
**Additions**: 2,803 | **Deletions**: 1,161 | **Files**: 45

---

## PR Created — First Time in 9 Runs

This is a milestone: PR #60 is the first successfully created PR across all evaluation runs (runs 3-10 all failed push auth). The push auth fix (fine-grained PAT) worked.

## PR Summary Quality

**Length**: 244 lines (under 250 target)

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (30/13/17) | YES | Matches run output |
| Per-file span counts | YES | All 13 files match |
| Per-file attempt counts | YES | Correct |
| Per-file cost | YES | Sum = $4.25 |
| Correct skip list | YES | All 17 files listed |
| Schema changes (11 attrs) | YES | All listed |
| Span extensions (39) | YES | All 39 listed |
| Recommended companion packages | YES | 3 Traceloop packages |
| Token usage | YES | Matches run output |
| Live-check | YES | OK |

### Schema Changes Section

**Improvement over run-10**: The schema changes section now includes **both attributes AND span extensions**. Run-9's RUN9-3 finding ("PR schema changes omits span extensions") is now **FULLY FIXED**. All 39 span extensions are listed.

### Advisory Findings Quality

The PR summary includes 12 advisory findings. Assessment:

| Finding | Verdict | Notes |
|---------|---------|-------|
| SCH-004 on summarize.force | **Incorrect** | force is a boolean flag, not max_tokens |
| SCH-004 on summarize.failed_count | **Incorrect** | failed_count is domain-specific, not gen_ai |
| SCH-004 on summarize.months_count | **Incorrect** | months_count is a batch size, not time_window |
| SCH-004 on summary.month_label | **Partially correct** | Namespace inconsistency worth noting |
| NDS-005 on index.js | **Needs verification** | Claims try/catch removed at line 490 |
| CDQ-006 on journal-manager.js | **Incorrect** | toISOString() is exempt per rubric (trivial conversion) |
| CDQ-006 on summary-manager.js | **Incorrect** | getDateString is a simple string operation |
| COV-004 on context-capture-tool.js (2x) | **Valid advisory** | Async callbacks could benefit from spans |
| COV-004 on reflection-tool.js (2x) | **Valid advisory** | Async callbacks could benefit from spans |
| CDQ-008 (run-level) | **Correct** | Consistent naming confirmed |

**Advisory contradiction rate**: 5 incorrect out of 11 non-trivial advisories = **45%** (improved from run-9's 67%, but still above 30% target). The SCH-004 judge continues to hallucinate semantic equivalence between unrelated attributes. CDQ-006 judge doesn't respect the trivial-conversion exemption.

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All files, spans, attrs, schema changes listed |
| Accuracy | 4/5 | File-level data accurate, advisory findings mixed |
| Actionability | 4/5 | Review attention flags are useful; outlier detection works |
| Presentation | 4/5 | Clean markdown, good tables, agent notes are informative |
| **Overall** | **4.25/5** | Best PR quality across all runs |

---

## Run-10 Finding Assessment

| Finding | Status |
|---------|--------|
| RUN9-3: PR schema changes omits span extensions | **FIXED** — all 39 span extensions listed |
| RUN7-7: Span count self-report | **Present** — span counts in table match actual |

---

## Cost

| Source | Amount |
|--------|--------|
| PR summary | $4.25 |
| PRD target | ≤$4.00 |
| Run-10 | $4.36 |
| Run-9 | $3.97 |

**$4.25** — slightly over the $4.00 target but $0.11 cheaper than run-10. The journal-graph.js improvement (3→2 attempts) saved tokens but summary-graph.js and index.js each used 2 attempts.
