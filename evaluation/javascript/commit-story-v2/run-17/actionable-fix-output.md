# Actionable Fix Output — Run-17

Self-contained handoff from evaluation run-17 to the spiny-orb team.

**Run-17 result**: 22/25 (88%) canonical quality, 10 committed, 4 failed, 1 partial, $10.43 cost. Gates 4/5 — NDS-003 gate failed for the first time in the series. IS 90/100 (+10pp). Q×F 8.8 (flat from run-16).

**Run-16 → Run-17 delta**: Quality flat (88%), NDS improved 50pp (NDS-005 fixed), SCH regressed 25pp (new SCH-002), gate regression (4/5 vs 5/5), cost -$1.86 ($12.29 → $10.43), push SUCCESS (seventh consecutive).

**Target repo**: commit-story-v2 (same as runs 9-17)
**Branch**: `spiny-orb/instrument-1778585670273`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/69
**spiny-orb version**: 1.0.0 (SHA c60f79d, main branch)

---

## §1. Run-17 Score Summary

| Dimension | Score | Run-16 | Delta | Failures |
|-----------|-------|--------|-------|----------|
| NDS | **2/2 (100%)** | 1/2 (50%) | **+50pp** | None — RUN16-3 fix confirmed |
| COV | **3/5 (60%)** | 3/5 (60%) | — | COV-001+COV-004: journal-graph, index.js (failed), git-collector (committed but missing getCommitData span), summary-manager (3 skipped functions) |
| RST | 4/4 (100%) | 4/4 (100%) | — | — |
| API | 3/3 (100%) | 3/3 (100%) | — | — |
| SCH | **3/4 (75%)** | 4/4 (100%) | **-25pp** | SCH-002: summary-graph.js (wrong attribute domain) |
| CDQ | 7/7 (100%) | 7/7 (100%) | — | — |
| **Total** | **22/25 (88%)** | **22/25 (88%)** | **—** | — |
| **Gates** | **4/5** | **5/5** | **-1** | NDS-003 gate failed (4 files) |
| **Files** | **10 + 1p** | **10 + 3p** | — | 4 full failures, 1 partial |
| **Cost** | **$10.43** | **$12.29** | **-$1.86** | — |
| **Push/PR** | **YES (#69)** | **YES (#68)** | — | Seventh consecutive |
| **IS** | **90/100** | **80/100** | **+10pp** | SPA-001 structural only |

---

## §2. Primary Goal Assessment: RUN16-1 Fix (Partial ✅/❌)

**The RUN16-1 fix (adaptive → enabled thinking with budget cap) worked for its stated purpose**: no files in run-17 failed with `null parsed_output` or `stop_reason: max_tokens`. context-capture-tool.js, reflection-tool.js, and summary-manager.js's generate functions all produced structured output.

**However, the underlying failures were not resolved.** The 3 files that were token-exhausted in run-16 now fail on NDS-003 reconciler gaps instead of token exhaustion. They still do not commit. The failure mode changed; the outcome did not.

**Root cause of the new failure**: The NDS-003 reconciler's line-offset calculation breaks when `startActiveSpan` wrapping adds lines inside a nested callback (specifically inside `server.tool()` calls and similar structures). The validator counts re-indented lines as both "removed from original" and "added as new," inflating the cumulative offset. By the time it reaches the catch block of the outer callback, the expected position for those lines is past the end of the original file, producing spurious "original line 124 missing" errors where lines 124-125 don't exist in the original. **The agent code is semantically correct; the validator cannot verify it.**

This reconciler gap is independent of the thinking budget fix. It would have appeared in run-16 if token exhaustion hadn't prevented structured output from being produced.

---

## §3. Run-16 Findings Assessment

| # | Finding | Priority | Status in Run-17 |
|---|---------|----------|-----------------|
| RUN16-1 | Null parsed_output (token budget exhaustion) | P1 | **PARTIAL** — no more budget exhaustion; NDS-003 reconciler gap revealed underneath |
| RUN16-2 | Live-check JSON to terminal stdout | P2 | **RESOLVED** — no JSON flood to terminal |
| RUN16-3 | NDS-005: function-level fallback strips try/catch on 0-span files | P1 | **RESOLVED** — commit-analyzer.js returned original unchanged ✅ |
| RUN16-4 | journal-graph.js technicalNode NDS-003 oscillation | P2 | **WORSENED** — escalated from partial (3 spans committed) to full failure (49 NDS-003 violations, 0 spans) |

---

## §4. New Run-17 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN17-1 | NDS-003 reconciler gap: `startActiveSpan` in nested callbacks | P1 | Validator / Reconciler |
| RUN17-2 | NDS-003 content corruption in journal-graph.js | P1 | Agent / Thinking Budget |
| RUN17-3 | git-collector COV-001: `getCommitData` missing span (previously undetected) | P2 | Coverage |
| RUN17-4 | summary-graph SCH-002: attribute domain mismatch (previously undetected) | P2 | Schema |
| RUN17-5 | Advisory pass rollback path unaudited | Low | Reliability |
| RUN17-6 | PR title "(N files)" count is wrong | Low | UX |

---

### RUN17-1: NDS-003 Reconciler Gap — `startActiveSpan` in Nested Callbacks (P1)

**What happened**: context-capture-tool.js, reflection-tool.js, and index.js all failed NDS-003 with oscillation at lines that don't exist in the original file. Summary-manager.js's 3 generate functions (generateAndSaveDailySummary, generateAndSaveWeeklySummary, generateAndSaveMonthlySummary) were skipped in the function-level fallback for the same reason.

In every case, the agent's instrumented code is semantically correct:
- `saveContext` and `saveReflection` wrapped with `tracer.startActiveSpan(...)` — span placement, error handling, attribute selection all correct
- `main()` in index.js wrapped with `startActiveSpan` — correct entry-point instrumentation
- `generateAndSave*` functions wrapped with `startActiveSpan` — span and attribute approach correct

**Root cause**: NDS-003's line-offset reconciler adds lines introduced by instrumentation to an expected-position counter. When `startActiveSpan` wrapping re-indents original function body lines (changing 2-space to 6-space indentation), the reconciler counts those re-indented lines as both "removed" (original line missing at old position) and "added" (new instrumentation line). This double-counts the offset, causing the reconciler to look for original lines at positions beyond the file end — producing phantom "original line N missing" errors for lines that don't exist in the original file.

**Pattern**: This gap occurs specifically when:
1. `startActiveSpan` wrapping adds a nesting level to an existing function body
2. The wrapped function is itself inside a callback (e.g., `server.tool()` handler, LangGraph node function)
3. The combined indentation shift plus added span-lifecycle lines crosses a threshold where the offset calculation diverges

**Files blocked in run-17**: context-capture-tool.js (saveContext, 0 spans), reflection-tool.js (saveReflection, 0 spans), index.js (main, 0 spans), summary-manager.js (3 generate functions skipped in partial)

**Acceptance criteria**:
- context-capture-tool.js commits `saveContext` with a span
- reflection-tool.js commits `saveReflection` with a span
- index.js commits `main()` with a span
- summary-manager.js commits all 3 generate functions with spans

---

### RUN17-2: NDS-003 Content Corruption — journal-graph.js (P1)

**What happened**: journal-graph.js failed with 49 NDS-003 violations in 2 attempts. Of these, ~48 are the same reconciler gap as RUN17-1 (re-indentation of LangGraph node function bodies). **1 is a genuine content modification**: the agent dropped the closing `}` from a JSON template literal in `formatChatMessages`.

**Original line (≈227)**:
```javascript
return `{"type":"${type}", "time":"${time}", "content":"${escapeForJson(msg.content)}"}`;
```

**Agent's output** (closing `}` missing from JSON object):
```javascript
return `{"type":"${type}", "time":"${time}", "content":"${escapeForJson(msg.content)}"`;
```

This is a single-character corruption that would cause `formatChatMessages` to produce malformed JSON strings at runtime — every formatted message would lack its closing brace.

**Hypothesis**: The 65% thinking budget cap (Math.floor(max_tokens * 0.65)) introduced by PR #852 may not leave sufficient reasoning budget for character-level verification on complex 629-line files. journal-graph.js processed correctly in run-12 with uncapped adaptive thinking. Run-17 is the first run after the cap was applied, and this is the first time this specific corruption appeared on this file.

Note: even if the content corruption is fixed, the reconciler gap (RUN17-1) must also be resolved for journal-graph.js to commit — the ~48 false-positive violations would still block it.

**Acceptance criteria**:
- journal-graph.js template literal in `formatChatMessages` preserves the closing `}` inside the template string
- NDS-003 passes for the committed output (requires both this fix AND the reconciler gap fix)

---

### RUN17-3: git-collector COV-001 — `getCommitData` Missing Span (P2)

**What happened**: git-collector.js commits only `getPreviousCommitTime` with a span. `getCommitData` — the exported async primary orchestrator, called throughout the application — has no span.

This failure has existed across multiple evaluation runs but was not detected until run-17's per-agent evaluation approach (one agent per file). The per-file evaluation methodology in prior runs likely used spot-checking rather than full rubric coverage for all files.

**What `getCommitData` does**: orchestrates all git data collection — calls `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` in parallel via `Promise.all`, and assembles the result. It is the primary external interface for the `collectors/` module.

**Missing signal**: without a span on `getCommitData`, callers cannot observe whether git collection succeeded or failed, how long it took, or what commit was processed. This is the most observability-critical function in the file.

**Acceptance criteria**:
- git-collector.js commits `getCommitData` with a span
- COV-001 passes for git-collector.js

---

### RUN17-4: summary-graph SCH-002 — Wrong Attribute Domain (P2)

**What happened**: summary-graph.js sets two attributes with values from the wrong domain:
- `commit_story.context.messages_count` — registered as "total number of messages collected from sessions" — but set to `entries.length` (journal entries, not chat messages)
- `commit_story.journal.quotes_count` — registered as "number of developer quotes extracted for the entry" — but set to `entries.length` (journal entries, not extracted quotes)

This failure likely existed in earlier runs (as far back as run-12) but was not detected by less thorough evaluation.

**Fix**: Invent new schema extension attributes for these values — e.g., `commit_story.journal.entries_count` to count raw journal entries being processed. Do not reuse registered attributes for semantically different data.

**Acceptance criteria**:
- summary-graph.js uses domain-correct attribute keys for all `setAttribute` calls
- `messages_count` and `quotes_count` are not used for journal entry counts
- SCH-002 passes for summary-graph.js

---

### RUN17-5: Advisory Pass Rollback Path Unaudited (Low)

**Question raised during evaluation**: The validation pipeline shows "Prior passing file committed" as the outcome when an advisory improvement pass introduces new blocking failures. Has this rollback path been tested? If it's broken, files could silently receive the broken advisory-pass version instead of the clean prior version.

**This does not explain run-17's failures** — all 4 failed files failed the initial blocking checks and never reached the advisory pass. But the rollback mechanism's correctness has not been verified, and a silent failure there would degrade committed file quality without appearing in the FAILED count.

**Ask**: add a test or audit confirming the advisory pass rollback fires correctly when the improvement re-run introduces blocking failures.

---

### RUN17-6: PR Title "(N files)" Count Bug (Low)

**What happened**: PR #69 title says "Add OpenTelemetry instrumentation (25 files)" — but 30 files were processed, and only 15 had non-trivial outcomes (10 committed + 4 failed + 1 partial). The count 25 is unexplained.

This is a low-priority UX issue — the PR body is accurate, only the title is wrong. Documented for completeness as it has appeared in multiple run-17 artifacts.

---

## §5. Prioritized Fix Recommendations

### P1 — RUN17-1: NDS-003 Reconciler Gap

**Problem**: The NDS-003 validator misclassifies re-indented lines from `startActiveSpan` wrapping as both "removed" and "added," inflating the cumulative line offset. This prevents 4 files from committing despite correct agent instrumentation.

**Fix**: The reconciler needs to recognize `startActiveSpan` callback wrapping as a known instrumentation pattern that changes indentation but preserves content. Lines whose content matches the original (modulo leading whitespace) inside a recognized span-wrapping construct should not count against the cumulative offset.

**Impact if fixed**: context-capture-tool.js, reflection-tool.js, index.js, and summary-manager.js's 3 generate functions should all commit — recovering approximately 4 committed files and ~6 spans.

---

### P1 — RUN17-2: Content Corruption on Complex Files

**Problem**: journal-graph.js (629 lines) committed with a dropped `}` from a template literal after PR #852 capped thinking at 65% of max_tokens. Hypothesis: insufficient thinking budget for character-level verification on large, complex files.

**Primary fix**: Evaluate whether 65% is the right cap for file-level calls, particularly for files with complex inline expressions (template literals with nested interpolations, regex arrays, multi-line ternaries). Consider a higher cap (e.g., 75%) or a file-complexity-based cap.

**Note**: This file also has ~48 reconciler-gap NDS-003 violations (RUN17-1) that independently block commitment. Both fixes are needed for journal-graph.js to commit in run-18.

---

### P2 — RUN17-3: git-collector COV-001

**Problem**: `getCommitData` (exported async, primary orchestrator) has no span across 8+ evaluation runs. Only `getPreviousCommitTime` is instrumented. The agent consistently misses the primary exported entry point.

**Fix**: The pre-scan AST directive should identify `getCommitData` as a COV-001 target. If the file-level attempt fails due to NDS-003, the function-level fallback should instrument `getCommitData` specifically.

---

### P2 — RUN17-4: summary-graph SCH-002

**Problem**: Two registered attribute keys reused for semantically incorrect values. Likely present since run-12.

**Fix**: Add `commit_story.journal.entries_count` (or similar domain-correct key) to the schema and direct the agent to use it for journal entry counts rather than reusing `messages_count` or `quotes_count`.

---

## §6. Run-16 Findings Resolution in Run-17

| Finding | Resolution | Mechanism |
|---------|------------|-----------|
| RUN16-1 (null parsed_output / token exhaustion) | **PARTIAL** | Thinking cap fix resolved budget exhaustion; NDS-003 reconciler gap blocked the same files |
| RUN16-2 (live-check JSON to stdout) | **RESOLVED** | Removed from instrument-handler.ts |
| RUN16-3 (NDS-005 try/catch stripping on 0-span files) | **RESOLVED** | Short-circuit path in instrument-with-retry.ts line 1150 |
| RUN16-4 (journal-graph.js technicalNode NDS-003 oscillation) | **WORSENED** | Escalated from partial (3 spans) to full failure (49 NDS-003); 4th consecutive run without technicalNode span; root cause now has two components (reconciler gap + content corruption) |

---

## §7. Unresolved Items Carrying Forward

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| NDS-003 reconciler gap (startActiveSpan in nested callbacks) | **RUN17-1** | **1 run** | P1 — new; blocks 4 files |
| NDS-003 content corruption (journal-graph.js template literal) | **RUN17-2** | **1 run** | P1 — new; 1 genuine character dropped |
| git-collector COV-001 (getCommitData missing) | **RUN17-3** | **1 run*** | P2 — first detected; likely present 8+ runs |
| summary-graph SCH-002 (wrong attribute domain) | **RUN17-4** | **1 run*** | P2 — first detected; likely present since run-12 |
| journal-graph.js NDS-003 (now full failure) | RUN16-4 | 4 runs | P1 component of RUN17-1+RUN17-2 |
| IS SPA-001: INTERNAL span count structural | RUN15-4 | 3 runs | Structural calibration mismatch — not fixable at agent level |
| Advisory contradiction rate ~39% | RUN11-1 | 7 runs | SCH-001 false positives on extension spans; CDQ-007 import constraint |
| Advisory pass rollback unaudited | **RUN17-5** | 1 run | Low priority |
| PR title count bug | **RUN17-6** | 1 run | Low priority |

*First detected in run-17; likely present in prior runs.

---

## §8. Score Projections for Run-18

### Conservative (RUN17-1 reconciler fix lands, RUN17-2 content corruption unchanged)

- **Quality**: 22/25 (88%) — SCH-002 and COV-001 gaps still open; but reconciler gap resolved means context-capture-tool, reflection-tool, index.js commit; NDS-003 gate recovers to 5/5
- **Files**: 13-14 — 3 failed files now commit; journal-graph still blocked by RUN17-2 content corruption
- **Cost**: ~$8-9 — less failed-file waste; journal-graph still burning tokens on failed attempts

### Target (RUN17-1 + RUN17-2 fixes land)

- **Quality**: 22/25 (88%) — SCH-002 and COV-001 still open; but all 4 failed files commit; gates 5/5
- **Files**: 14-15 — all 4 failed files commit; summary-manager's 3 generate functions commit
- **Cost**: ~$6-8 — all failed files now commit on fewer attempts

### Stretch (P1 + P2 fixes all land)

- **Quality**: 25/25 (100%) — COV-001 (git-collector), SCH-002 (summary-graph), COV-001/COV-004 (journal-graph + summary-manager) all resolved
- **Files**: 14-15
- **Cost**: ~$6-8
- **Q×F**: (25/25) × 14 = 14.0 — new record
