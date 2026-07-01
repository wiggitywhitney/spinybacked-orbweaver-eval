# Actionable Fix Output — Run-15

Self-contained handoff from evaluation run-15 to the spiny-orb team.

**Run-15 result**: 24/25 (96%) canonical quality, 14 committed, 0 failed, 0 partial, $6.44 cost. Quality improved from run-14's 88%. PR #66 created — fifth consecutive successful push.

**Run-14 → Run-15 delta**: +8pp quality (88% → 96%), +2 files (12 → 14), +$0.85 cost ($5.59 → $6.44), push SUCCESS (fifth consecutive).

**Target repo**: commit-story-v2 (same as runs 9-15)
**Branch**: `spiny-orb/instrument-1777850275841`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/66
**spiny-orb version**: 1.0.0 (SHA 1b6c3d9, `fix/724-attribute-namespace` branch)

---

## §1. Run-15 Score Summary

| Dimension | Score | Run-14 | Delta | Failures |
|-----------|-------|--------|-------|----------|
| NDS | 2/2 (100%) | 2/2 | — | — |
| COV | 4/5 (80%) | 3/5 | **+20pp** | COV-003: summary-detector.js (new) |
| RST | 4/4 (100%) | 4/4 | — | — |
| API | 3/3 (100%) | 3/3 | — | — |
| SCH | 4/4 (100%) | 4/4 | — | — |
| CDQ | 7/7 (100%) | 6/7 | **+14pp** | — |
| **Total** | **24/25 (96%)** | **22/25 (88%)** | **+8pp** | **1 failure** |
| **Gates** | **5/5 (100%)** | **5/5** | — | — |
| **Files** | **14** | **12** | **+2** | 0 failures, 0 partials |
| **Spans** | **40** | **32** | **+8** | — |
| **Cost** | **$6.44** | **$5.59** | **+$0.85** | — |
| **Push/PR** | **YES (PR #66)** | **YES (#65)** | Fifth consecutive | — |
| **Q×F** | **13.4** | **10.6** | **+2.8** | New all-time record |
| **IS Score** | **70/100** | **80/100** | **-10pp** | SPA-001 (37 spans), SPA-002 (orphan) |

---

## §2. Quality Rule Failure (1 canonical)

### COV-003: summary-detector.js — getDaysWithEntries and getDaysWithDailySummaries Missing Outer Catch

**File**: `src/utils/summary-detector.js`
**Functions affected**: `getDaysWithEntries`, `getDaysWithDailySummaries`

**COV-003 failure**: Both functions use `tracer.startActiveSpan` with a try/finally block but have NO outer catch clause. If an unexpected error occurs (e.g., filesystem permission error, anything other than ENOENT), it propagates through the span completely unrecorded. The span ends via `finally` with OK status even when the operation fails — telemetry shows success during a real failure.

**The inconsistency**: Three other functions in the same file — `findUnsummarizedDays`, `findUnsummarizedWeeks`, `findUnsummarizedMonths` — all have proper outer catch blocks:
```javascript
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
} finally {
  span.end();
}
```

`getDaysWithEntries` and `getDaysWithDailySummaries` do not:
```javascript
// No outer catch — only inner ENOENT handlers
} finally {
  span.end();
}
```

**Why this is NOT the NDS-007 graceful-degradation exemption**: The inner catches (ENOENT → return []) ARE correctly identified as graceful-degradation catches (NDS-007 applies). But the issue is the OUTER span wrapper has no catch at all — a missing error handler, not an expected-condition handler. The `isExpectedConditionCatch` exemption requires a catch that handles errors gracefully; there is no such catch at the outer span level for these two functions.

**Root cause**: The agent correctly applied NDS-007 to the inner ENOENT catches but over-extended the logic to conclude the outer span also needs no error recording. The three `findUnsummarized*` functions were instrumented with correct outer catches on the same run — the inconsistency within the file suggests the agent treated all inner catches as exempting the outer span.

**Fix needed**: Add guidance in the agent instrumentation prompt: when inner catches inside a span wrapper are graceful-degradation (no-throw), the outer span still needs an error-recording catch for unexpected exceptions that bypass the inner catches. The pattern should be:

```javascript
return tracer.startActiveSpan('span.name', async (span) => {
  try {
    // ... code with inner graceful catches ...
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error; // or return fallback
  } finally {
    span.end();
  }
});
```

**Acceptance criteria**:
- `getDaysWithEntries` has outer catch with `span.recordException(error)` + `span.setStatus(ERROR)`
- `getDaysWithDailySummaries` has outer catch with same pattern
- Consistent with `findUnsummarizedDays`, `findUnsummarizedWeeks`, `findUnsummarizedMonths` in the same file
- Inner ENOENT catches remain unchanged (still graceful-degradation, no error recording)

---

## §3. Run-14 Findings Assessment

| # | Finding | Priority | Status in Run-15 |
|---|---------|----------|-----------------|
| RUN14-1 | summaryNode catch block missing error recording | P1 | **REFRAMED, RESOLVED** — PRD #483 M2 Decision 5 established that graceful-degradation catches SHOULD NOT record errors per OTel Recording Errors spec. All three LangGraph nodes (summaryNode, technicalNode, dialogueNode) now apply NDS-007 consistently — no error recording in any catch block. This is correct behavior. Run-14's COV-003/CDQ-003 failures were rubric errors: the evaluation incorrectly applied the recording requirement to expected-condition catches. No spiny-orb code change was needed. |
| RUN14-2 | COV-004: summary-manager.js 6 async I/O functions — 3rd consecutive run | P1 | **RESOLVED** — All 9 exported async I/O functions committed with spans in 1 attempt. COV-004 passes for the first time since run-11. The strengthened advisory message (PRD #483 M2: directive wording, removed "Consider" language) appears to have been effective. |
| RUN14-3 | Cost still above $4.00 — 4th consecutive run over target | Low | **UNRESOLVED** — $6.44 in run-15, up from $5.59. Cost increased due to 2 additional committed files and large token counts for journal-manager.js ($1.00, 59.7K tokens) and summary-manager.js ($1.19, 71.8K tokens). journal-graph.js improved significantly (3 attempts → 1 attempt, -$0.96), partially offsetting the increase. |
| RUN14-4 | IS SPA-001: journal trace 12 INTERNAL spans | Low | **WORSENED** — 37 INTERNAL spans in run-15 (up from 12). With 14 committed files and 40 spans, the INTERNAL span count grows linearly. SPA-001 limit of 10 is increasingly unachievable for commit-story-v2 as instrumentation coverage improves. Structural IS limitation for CLI applications using only INTERNAL spans. |
| RUN14-5 | IS RES-001: no service.instance.id | Low | **UNRESOLVED** — Unchanged from run-14. SDK setup gap in `examples/instrumentation.js`, not in spiny-orb scope. |

---

## §4. New Run-15 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN15-1 | COV-003: summary-detector.js outer catch missing | P1 | Coverage / Code Quality |
| RUN15-2 | IS SPA-002: orphan span detected | Low | IS scoring |
| RUN15-3 | PROGRESS.md orchestrator prompt blocks push on 's' (skip) | Low | Orchestrator UX |
| RUN15-4 | Advisory contradiction rate ~94% | Low | Advisory quality |
| RUN15-5 | journal-manager.js $1.00 for 2 spans (high cost-per-span) | Low | Cost |

### RUN15-2: IS SPA-001 — 37 INTERNAL Spans (Structural Calibration Issue, Not a Defect)

**Context**: SPA-001 limits traces to 10 INTERNAL spans per service. commit-story-v2 produced 37 in run-15. The IS spec marks SPA-001's criteria as "TODO" — the specific threshold isn't finalized.

**Is 37 correct?** Probably yes. A single `node src/index.js HEAD` invocation does substantial work: context collection (2 spans), 3 LLM generation calls (4 spans from journal-graph), journal file writes (2 spans), auto-summarize triggering 3 cadences (3 spans), each cadence doing read → generate → write via summary-manager (up to 9 spans for the 3 cadences) and summary-graph LangGraph nodes (6 spans), plus summary-detector function calls. With 14 committed files, the trace legitimately reflects the pipeline's work.

**Two spans are borderline**: `ensure_directory` (fast, deterministic mkdir — low observability value, fires multiple times) and the `generate_daily_node` / `generate_daily` pairing in summary-graph.js (potentially nested spans for the same operation). These are the only instrumentation-design questions — the rest of the 37 spans represent real I/O, LLM calls, or orchestration steps.

**Root issue**: SPA-001's limit of 10 was calibrated for web API request handlers, not multi-step pipelines that generate journal entries and summaries in a single CLI invocation. This is a spec calibration mismatch, not bad instrumentation. As commit-story-v2 instrumentation coverage grows, SPA-001 will continue to fail — reducing it below 10 would require removing legitimately valuable spans.

**Recommendation**: Note in run-16 evaluation context that SPA-001 failures on commit-story-v2 reflect the spec calibration mismatch, not quality regressions. Consider whether the IS evaluation is still meaningful for pipeline-style CLI tools given this structural limitation.

### RUN15-2b: IS SPA-002 — Orphan Span (Low)

Span `47f9607c` had a `parentSpanId` (`749f9c3b`) with no matching parent span in the trace. This is a new failure not present in run-14. Likely from an auto-instrumentation interaction (LangChain or MCP instrumentation creating a child span whose parent was created in a different async context or dropped). Not in spiny-orb's direct instrumentation scope — the orphan is likely in the auto-instrumentation libraries. Worth monitoring in run-16.

### RUN15-3: spiny-orb Push Success Detection Misfired After git Hook Interaction (Low)

**What actually happened** (corrected post-handoff with spiny-orb team input):

The `progress-md-pr.sh` pre-push git hook fired during the instrument branch push (this hook is part of the eval repo's git configuration, not spiny-orb's code — spiny-orb's orchestrator does not interact with it). Whitney pressed 's' in the terminal to skip the PROGRESS.md check. The hook exited and **the first push succeeded** — the branch reached GitHub. However, spiny-orb's push success detection still reported "Push failed — skipping PR creation" despite the push having completed. spiny-orb then ran its internal CodeRabbit review and attempted a second push, which failed with "remote rejected: reference already exists" — confirming the first push had already landed the branch.

**What the bug is NOT**: This is not a case where pressing 's' caused the push to fail. The push succeeded. The proposed fix in the initial handoff ("when user presses 's', push should continue") was aimed at the wrong layer — the orchestrator doesn't control the hook, and the push did continue.

**What the bug IS**: spiny-orb's push success detection reported failure despite a successful push. The likely cause is that the hook's interactive output (the prompt text) mixed with git's stdout/stderr in a way that spiny-orb's push result parser interpreted as a failure signal. The branch was on the remote; spiny-orb didn't know it.

**Impact in run-15**: Branch was already on remote when manually pushed; second push failed as expected. PR created manually. Total elapsed time: ~2h 7m (vs. ~81min for instrumentation) — the CodeRabbit review after the misdetected failure added ~46min.

**Fix needed**: spiny-orb's push result detection should verify whether the branch exists on the remote as a secondary confirmation signal when the primary detection is ambiguous — particularly in environments where pre-push hooks produce interactive output that may interfere with stdout parsing.

### RUN15-4: Advisory Contradiction Rate ~94% (Low)

The PR advisory section contained approximately 47 findings, of which only ~3 were actionable:
- 30 CDQ-007 null-guard advisories: nearly all false positives — the null-guard check cannot distinguish guaranteed-non-null objects (returned by known internal functions) from truly optional fields
- 18 SCH-001 semantic-duplicate advisories: nearly all false positives — the semantic dedup algorithm matches span names across unrelated operation domains (e.g., `summarize.run_summarize` flagged as duplicate of `git.get_commit_data`)
- 2 SCH-001 advisories with "the existing name" placeholder text (message formatting bug — specific conflicting span name not populated)

The 3 valid findings: CDQ-007 for raw file path exposure in journal-manager.js, journal-paths.js, and context-capture-tool.js (all advisory, registered attribute, low risk).

**Root causes**: (1) CDQ-007 null-guard check lacks type-system integration to determine nullability; (2) SCH-001 semantic dedup matches across all registered span names without domain-scoping; (3) SCH-001 message formatter has a bug leaving "the existing name" as a literal placeholder when no match is found.

**Impact**: Extremely low signal-to-noise ratio makes advisories unhelpful to reviewers. The 3 valid findings (path exposure) are drowned in 44 noise findings.

### RUN15-5: journal-manager.js $1.00 for 2 Spans (Low)

`src/managers/journal-manager.js` cost $1.00 and produced 59.7K output tokens in 1 attempt for only 2 spans. This is the highest cost-per-span ratio in run-15 (~$0.50/span vs. ~$0.16/span average). The file is complex (15 functions, many synchronous helpers, 2 inner graceful-degradation catches) and the large output likely reflects extensive reasoning. Not actionable for spiny-orb, but worth noting as a cost driver.

---

## §5. Prioritized Fix Recommendations

### P1 — RUN15-1: Outer Catch for getDaysWithEntries and getDaysWithDailySummaries

**Problem**: Two spans in `summary-detector.js` have try/finally with no outer catch. Unexpected errors pass through unrecorded. The `findUnsummarized*` functions in the same file have correct outer catches, making this an inconsistency within a single file.

**Proposed Fix**: Add prompt guidance: when inner catches inside a `startActiveSpan` wrapper are graceful-degradation (return without throwing), an outer catch is still needed for unexpected exceptions that bypass the inner handlers. The distinction: inner graceful catches = NDS-007 applies (no error recording in the inner catch); outer span catch = still needed for unexpected propagation.

**Acceptance Criteria**:
- `getDaysWithEntries` and `getDaysWithDailySummaries` have outer catch with standard error recording
- Inner ENOENT catches unchanged
- No regression in `findUnsummarizedDays/Weeks/Months`
- COV-003 passes for all 5 spans in summary-detector.js

---

## §6. Run-14 Findings in Run-15 (Resolution Assessment)

| Finding | Resolution | Mechanism |
|---------|------------|-----------|
| RUN14-1 (COV-003/CDQ-003 journal-graph.js) | Resolved — rubric error confirmed | PRD #483 M2 Decision 5: OTel spec exempts graceful-degradation catches; all three LangGraph nodes now correctly apply NDS-007 |
| RUN14-2 (COV-004 summary-manager.js) | Resolved — strengthened message effective | 9 spans on all 9 exported async I/O functions, 1 attempt |
| RUN14-3 (cost above target) | Unresolved | $6.44 — higher than run-14 |
| RUN14-4 (IS SPA-001 span count) | Unresolved, worsened | 37 INTERNAL spans (was 12) |
| RUN14-5 (IS RES-001 no service.instance.id) | Unresolved | SDK setup gap |

---

## §7. Unresolved Items Carrying Forward

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| COV-003: summary-detector.js outer catch | **RUN15-1** | **1 run** | P1 — new in run-15 |
| Cost above $4.00 | RUN11-4 | **5 runs** | $6.44 in run-15 |
| IS SPA-001: INTERNAL span count above limit | RUN14-4 | **2 runs** | 37 spans in run-15; structural for CLI apps |
| IS SPA-002: orphan span | **RUN15-2** | **1 run** | Low — auto-instrumentation interaction |
| IS RES-001: no service.instance.id | RUN14-5 | **2 runs** | SDK setup gap |
| Advisory contradiction rate | RUN11-1 | 5 runs | ~94% in run-15 (elevated from ~40%) |
| journal-manager.js high token count | **RUN15-5** | **1 run** | Low — monitor |
| PROGRESS.md prompt blocks push on 's' | **RUN15-3** | **1 run** | Low — orchestrator UX fix needed |

---

## §8. Score Projections for Run-16

### Conservative (RUN15-1 fix lands, no other changes)

- **Quality**: 25/25 (100%) — COV-003 resolved; no other known open quality issues
- **Files**: 14 — same set expected; no new instrumentation candidates identified
- **Cost**: ~$6.00–6.50 — similar cost drivers; journal-manager.js cost driver persists
- **IS**: 70–75/100 — SPA-001 structural; SPA-002 might resolve (auto-instrumentation variation)

### Target (RUN15-1 fix + journal-manager.js cost reduction)

- **Quality**: 25/25 (100%)
- **Files**: 14–15
- **Cost**: ~$5.00–5.50 — if journal-manager.js reaches 2-attempt/lower-token regime

### Stretch (all fixes + cost breakthrough)

- **Quality**: 25/25, full coverage
- **Files**: 14–15
- **Cost**: ≤$5.00
