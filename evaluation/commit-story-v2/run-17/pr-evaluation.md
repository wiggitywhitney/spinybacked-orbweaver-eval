# PR Artifact Evaluation — Run-17

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/69
**Branch**: spiny-orb/instrument-1778585670273
**State**: OPEN (seventh consecutive successful push/PR creation)

---

## Push Auth — Seventh Consecutive Success

PR #69 auto-created. The fine-grained PAT continues to work. `urlChanged=true, path=token-swap` confirms the URL swap mechanism fired correctly.

---

## PR Summary Quality

**Length**: 31,743 characters (significantly longer than prior runs — the journal-graph.js NDS-003 failure message alone contributes ~2,000 characters of repeated validator text in the per-file table)

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (30 total / 10 committed / 15 no-changes / 4 failed / 1 partial) | YES | Matches run output |
| Per-file span counts | YES | All 11 instrumented files match |
| Per-file attempt counts | YES | Correct |
| Per-file cost | YES | Sum = $10.43 |
| Correct skip list | YES | 15 files listed |
| Schema extensions | YES | All new span names and attributes listed |
| Recommended companion packages | YES | `@traceloop/instrumentation-langchain` (summary-graph), `@traceloop/instrumentation-mcp` (mcp/server) |
| Token usage | YES | $10.43 actual vs $70.20 ceiling |
| Live-check | YES | OK (493 spans, 3660 advisories) |
| **PR title** | **NO** | Title says "25 files" — 30 were processed, 15 committed + failed + partial |

**PR title bug**: "Add OpenTelemetry instrumentation (25 files)" — the count 25 is unexplained. The per-file table lists 15 non-trivial files (10 committed + 4 failed + 1 partial). The discrepancy with 30 total processed is structural — spiny-orb's title generation appears to use a different count than the per-file table row count. Same category of title inaccuracy as prior runs where the "(N files)" count was wrong. Carry forward as a low-priority spiny-orb issue.

### Failure Descriptions in Table

The per-file table includes full NDS-003 failure messages inline. For journal-graph.js this is 49 rule IDs plus multi-line guidance text — readable but visually overwhelming. The failure description is technically accurate but would benefit from truncation in a future PR format iteration.

---

## Advisory Findings Quality

**Total advisory findings**: 41 across 9 files

| File | Rule | Count | Verdict |
|------|------|-------|---------|
| git-collector.js | COV-004 | 5 | **Mixed** — see analysis below |
| summary-graph.js | CDQ-007 | 3 | **False positive** — see analysis below |
| context-integrator.js | SCH-001 | 1 | **False positive** — extension span correctly declared |
| journal-paths.js | CDQ-007 | 1 | **Accurate but unactionable** — raw path, import constraint |
| journal-paths.js | SCH-001 | N | **False positive** — extension span |
| journal-manager.js | CDQ-007 | 2 | **Accurate but unactionable** — raw path, import constraint |
| summary-manager.js | CDQ-006 | 1 | **Valid advisory** |
| summary-manager.js | CDQ-007 | 4 | **Accurate but unactionable** — raw paths, import constraint |
| summarize.js | CDQ-007 | 2 | **Accurate but unactionable** — raw paths, import constraint |
| summary-detector.js | CDQ-007 | 5 | **Accurate but unactionable** — null-guard and raw path findings |
| auto-summarize.js | SCH-001 | 2 | **False positive** — extension spans correctly declared |

### COV-004 on git-collector.js (5 findings)

The 5 COV-004 advisories fire on async functions in git-collector.js that lack spans. Based on the per-file evaluation:

- **`getCommitData`** (exported async, primary orchestrator): **Valid canonical failure**. This function is the entry point called throughout the application. A span is required by COV-001 and COV-004. The advisory correctly identifies a genuine instrumentation gap.
- **`runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo`** (unexported async helpers): **Accurate but advisory-only**. These are RST-004 exempt as unexported internal helpers. However, since `getCommitData` itself has no span, these lack parent context — making the COV-004 advisories indirectly accurate.

The advisory description is generic and doesn't name which function is missing the span. A reviewer would need to open the file to determine which finding is canonical vs. advisory. CDQ-007 provides no actionability ranking.

### CDQ-007 on summary-graph.js (3 findings — false positives)

Summary-graph.js uses only LangGraph and gen_ai attributes (`gen_ai.request.temperature`, `gen_ai.request.max_tokens`, `gen_ai.usage.*`). It does not set filesystem paths or access nullable properties. These CDQ-007 findings appear to be false positives where the advisory judge is flagging `entries.length` or similar constructs as potentially nullable. Verdict: **false positive**, no actionable issue.

### CDQ-007 across other files (~14 findings — accurate but unactionable)

Files using `commit_story.journal.file_path` (journal-paths, journal-manager, summary-manager, summarize) correctly set a raw filesystem path. CDQ-007 is technically accurate — the attribute would benefit from `path.basename()`. However, every evaluated file had an import constraint blocking the fix: `basename` is not already imported and adding a non-OTel import violates the instrumentation constraint. The advisory fires accurately but the recommendation can't be followed without changing the rule or the import constraint.

This is the same CDQ-007 / import constraint tension documented in runs 15-16. It inflates advisory count without adding actionable signal.

### CDQ-006 on summary-manager.js (1 finding — valid)

The advisory correctly identifies an `isRecording()` guard opportunity on `span.setAttribute()` calls that use array computations (`result.length`, etc.) inside summary-manager.js. Valid advisory; low priority given that summary-manager's COV-004 issues are more pressing.

### SCH-001 false positives (~13 findings)

All SCH-001 advisories fire on span names that are correctly declared as `schemaExtension` entries. The advisory judge does not recognize extension declarations and treats them as registry mismatches. This is a persistent false-positive pattern across runs 11-17. The findings are noise — a reviewer following these advisories would waste time "fixing" spans that are already correctly handled.

---

## Advisory Contradiction Rate

| Category | Count | Verdict |
|----------|-------|---------|
| False positives (SCH-001, summary-graph CDQ-007) | ~16 | Incorrect |
| Unactionable but accurate (CDQ-007 import-constrained) | ~14 | Correct diagnosis, no fix possible |
| Valid (git-collector COV-004 canonical, CDQ-006) | ~11 | Correct and actionable |
| **Total** | **41** | |

**Contradiction rate**: ~39% (16 false positives / 41 total). Consistent with runs 15-16 range of 85-92% mentioned in run-16 handoff. Note: the definition of "contradiction rate" in prior handoffs counted advisories that contradict a reviewer's expectation (false positives + unactionable together), giving ~73%; here I count only false positives. Both metrics reflect the same underlying signal noise problem.

The dominant false-positive pattern continues to be SCH-001 on extension spans. This has been present since run-11 and remains unsuppressed.

---

## Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All files, spans, attrs, schema changes listed |
| Accuracy | 4/5 | File-level data accurate; PR title count wrong; summary-graph CDQ-007 false positives |
| Actionability | 3/5 | Only 1 advisory (git-collector COV-004) is actionable and canonical; 39% false positive rate; 34% accurate-but-unactionable |
| Presentation | 3/5 | journal-graph NDS-003 block is visually overwhelming; failure descriptions repeat 49 rule IDs inline |
| **Overall** | **3.75/5** | Down from run-16's ~4.0; advisory noise and failure message verbosity reduce reviewer utility |

---

## Cost

| Source | Amount |
|--------|--------|
| PR total | $10.43 |
| Run-16 | $12.29 |
| Delta vs run-16 | -$1.86 |
| % of ceiling ($70.20) | 14.8% |

**$10.43** — improvement over run-16 (-$1.86), driven by eliminating token-exhaustion failures. Still above the historical target of ~$8.00. Primary drivers:

| File | Cost | Driver |
|------|------|--------|
| summary-graph.js | $1.57 | Complex LangGraph file, 2 attempts |
| journal-manager.js | $1.04 | Function-level fallback, 3 attempts |
| journal-graph.js | $0.81 | 2 full attempts on 629-line file, both failed |
| index.js | $0.79 | 3 attempts on 534-line file, all failed |
| summarize.js | $0.76 | Function-level fallback, 3 attempts |
| context-integrator.js | $0.42 | Single-span file, 2 attempts |
| summary-manager.js | $0.48 | Function-level fallback, partial |

Total failures (journal-graph + context-capture + reflection-tool + index.js) wasted **$2.06** on attempts that produced nothing committed. With the NDS-003 reconciler gap fixed, this cost should reduce by ~$1.50 in run-18.
