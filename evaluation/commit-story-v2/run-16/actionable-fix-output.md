# Actionable Fix Output — Run-16

Self-contained handoff from evaluation run-16 to the spiny-orb team.

**Run-16 result**: 22/25 (88%) canonical quality, 10 committed, 3 failed, 3 partial, $12.29 cost. Primary goal achieved: COV-003 fixed for summary-detector.js. Q×F 8.8 (regression from run-15's 13.4). IS 80/100 (+10pp from run-15).

**Run-15 → Run-16 delta**: -8pp quality (96% → 88%), -4 committed files (14 → 10), +$5.85 cost ($6.44 → $12.29), push SUCCESS (sixth consecutive).

**Target repo**: commit-story-v2 (same as runs 9-16)
**Branch**: `spiny-orb/instrument-1778526749797`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/68
**spiny-orb version**: 1.0.0 (SHA dc5a2aa, main branch)

---

## §1. Run-16 Score Summary

| Dimension | Score | Run-15 | Delta | Failures |
|-----------|-------|--------|-------|----------|
| NDS | **1/2 (50%)** | 2/2 | **-50pp** | NDS-005: commit-analyzer.js |
| COV | **3/5 (60%)** | 4/5 | **-20pp** | COV-001+COV-004: journal-graph, summary-manager |
| RST | 4/4 (100%) | 4/4 | — | — |
| API | 3/3 (100%) | 3/3 | — | — |
| SCH | 4/4 (100%) | 4/4 | — | — |
| CDQ | 7/7 (100%) | 7/7 | — | — |
| **Total** | **22/25 (88%)** | **24/25 (96%)** | **-8pp** | **3 canonical failures** |
| **Gates** | **5/5 (100%)** | **5/5** | — | — |
| **Files** | **10 + 3p** | **14** | **-4** | 3 full failures, 3 partials |
| **Spans** | **~38** | **40** | **-2** | — |
| **Cost** | **$12.29** | **$6.44** | **+$5.85** | Cache write + 3-attempt files |
| **Push/PR** | **YES (#68)** | **YES (#66)** | Sixth consecutive | — |
| **IS** | **80/100** | **70/100** | **+10pp** | RES-001, SPA-001 still failing |
| **Q×F** | **8.8** | **13.4** | **-4.6** | Regression |

---

## §2. Primary Goal: COV-003 RESOLVED ✅

**The fix worked.** `getDaysWithEntries` and `getDaysWithDailySummaries` in `summary-detector.js` were committed with outer catch blocks containing `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })`, consistent with `findUnsummarizedDays`, `findUnsummarizedWeeks`, and `findUnsummarizedMonths` in the same file. All 5 spans in `summary-detector.js` pass COV-003.

The fix mechanism: spiny-orb commit `e2582c3` (PR #749, merged to main) added prompt guidance distinguishing inner graceful-degradation catches (NDS-007 applies — no error recording) from the outer span-level catch (still needed for unexpected exceptions that bypass the inner handlers). The agent applied this correctly in run-16.

---

## §3. Run-15 Findings Assessment

| # | Finding | Priority | Status in Run-16 |
|---|---------|----------|-----------------|
| RUN15-1 | COV-003: summary-detector.js outer catch missing | P1 | **RESOLVED** — fix landed (e2582c3); all 5 spans pass COV-003 |
| RUN15-2 | IS SPA-002: orphan span | Low | **RESOLVED** — SPA-002 passes in run-16; auto-instrumentation variation did not recur |
| RUN15-3 | Push detection bug (orchestrator misdetects success) | Low | **UNRESOLVED** — PROGRESS.md hook interaction caused push block during run-16; push succeeded but required manual interaction |
| RUN15-4 | Advisory contradiction rate ~94% | Low | **UNRESOLVED** — 92% in run-16; CDQ-007 null guards + SCH-001 semantic dedup remain systemic |
| RUN15-5 | journal-manager.js $1.00 for 2 spans | Low | **WORSENED** — journal-manager.js $1.22 in run-16 (3 attempts vs 1) |

---

## §4. New Run-16 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN16-1 | Null parsed_output: function-level fallback adaptive thinking exhausts token budget | P1 | Infrastructure / Token Budget |
| RUN16-2 | Live-check JSON blob printed to terminal stdout | P2 | UX |
| RUN16-3 | NDS-005: function-level fallback strips try/catch on 0-span files | P1 | Code Quality / Correctness |
| RUN16-4 | journal-graph.js technicalNode: NDS-003 oscillation (third consecutive run) | P2 | Coverage |
| RUN16-5 | journal-graph.js: 1-attempt result from run-15 did not hold (back to 3 attempts) | Low | Cost / Attempt Count |
| RUN16-6 | Cost surge to $12.29 (cache write overhead + 3-attempt files) | Low | Cost |

---

### RUN16-1: Null Parsed_Output — Token Budget Exhaustion (P1)

**What happened**: Four function-level fallback calls failed with `stop_reason: max_tokens, raw_preview: <no text content>`. The LLM exhausted its entire token budget on adaptive thinking and produced no structured JSON output.

**Affected files/functions**:
- `src/mcp/tools/context-capture-tool.js` — full file failure (FAILED): 20,200 output tokens, budget ~20,100
- `src/mcp/tools/reflection-tool.js` — full file failure (FAILED): 19,400 output tokens, budget ~19,300
- `src/managers/summary-manager.js` `generateAndSaveWeeklySummary` — skipped within partial: 16,384 output tokens (minimum budget)
- `src/managers/summary-manager.js` `generateAndSaveMonthlySummary` — skipped within partial: 16,384 output tokens (minimum budget)

**Root cause**: The per-function/per-file token budget minimum (`MIN_OUTPUT_BUDGET` = 16,384 tokens, in `src/fix-loop/token-budget.ts`) is insufficient for files with complex instrumentation patterns. The model spends the entire budget on thinking about the file structure and never produces structured output. The adaptive thinking budget and the structured output budget share the same limit — when thinking is verbose, nothing is left for output.

**Why this is new**: This failure mode was not present in runs 9-15. Possible contributing factors: PRD #509's richer human-facing descriptions increasing reasoning depth; PRD #700's dependency-aware ordering routing complex files earlier (higher context pressure); cumulative context pressure at ~2.5h into the run.

**Primary fix (spiny-orb team)**:
Increase `MIN_OUTPUT_BUDGET` in `src/fix-loop/token-budget.ts`. The current minimum (16,384) is the Anthropic API minimum for extended thinking mode, but it leaves no margin for complex files. Recommendation: raise to 32,768 or higher for the minimum, or make the minimum dynamic based on file complexity signals (number of functions, presence of complex patterns like MCP tool files).

**Secondary fix (longer-term)**:
Detect when adaptive thinking reaches ~80% of budget and force a transition to structured output generation. This would prevent the "all thinking, no output" failure mode regardless of budget size.

**Acceptance criteria**:
- context-capture-tool.js commits `saveContext` with a span
- reflection-tool.js commits `saveReflection` with a span
- summary-manager.js commits `generateAndSaveWeeklySummary` and `generateAndSaveMonthlySummary` with spans
- No `stop_reason: max_tokens` + `raw_preview: <no text content>` failures

---

### RUN16-2: Live-Check JSON Blob Printed to Terminal Stdout (P2)

**What happened**: At end of run, spiny-orb printed the full live-check compliance report JSON to terminal stdout. The report was thousands of lines of machine-readable JSON (543 spans × multiple advisory findings each = 3,615 advisories). This flooded the user's terminal.

**Root cause**: The live-check compliance report is being emitted to both disk (`spiny-orb-live-check-report.json`) and stdout. The disk file is correct behavior; the stdout emission is not.

**Fix**: Suppress stdout emission of the live-check JSON compliance report. Write to disk only. The end-of-run summary line (`Live-check: OK (543 spans, 3615 advisory findings — see compliance report)`) is appropriate; the full JSON body is not.

**Acceptance criteria**: Running spiny-orb instrument with `--verbose` does not print the live-check JSON report to stdout/terminal.

---

### RUN16-3: NDS-005 — Function-Level Fallback Strips try/catch on 0-Span Files (P1)

**What happened**: `src/utils/commit-analyzer.js` has two synchronous helper functions with no instrumentable functions (no async I/O). The pre-scan correctly determined "no LLM call needed." The function-level fallback then ran anyway, modified the file during its reassembly pass, and stripped a try/catch block. The committed file has a structural defect: one try/catch block is missing from the original source.

**Why this matters**: This is a correctness bug — committed application code has been structurally modified (a catch block removed). Runtime behavior changed: the error-handling path for the affected function no longer works as the original author intended.

**Root cause**: The function-level fallback re-assembles the file even when 0 spans are added. The reassembly pass modifies code it has no reason to touch. When no spans are added, the file output should be identical to the file input.

**Fix**: In the function-level fallback code path, when 0 spans are added to a file, skip the reassembly step entirely and return the original file unchanged. This is logically correct: adding nothing to a file should produce the original file.

**Acceptance criteria**:
- `src/utils/commit-analyzer.js` instrumentation result is bit-for-bit identical to the original (all try/catch blocks preserved)
- NDS-005 validator does not fire on 0-span files processed by function-level fallback

---

### RUN16-4: journal-graph.js technicalNode NDS-003 Oscillation (P2)

**Third consecutive run** without a span on `technicalNode`. NDS-003 oscillation: on attempt 3, fresh regeneration increased the error count from 1 to 5 (lines 29, 30, 54, 57, 31). The agent cannot produce a stable span wrapper around `technicalNode` that passes NDS-003 validation.

**Root cause**: `technicalNode` has a specific control flow structure that the agent's span wrapper restructures in a way that violates NDS-003. When the agent tries to fix the initial violation, it introduces additional violations. The Prettier-normalized NDS-003 comparison (PRD #820, now on main) was expected to reduce such oscillations — it may not be fully effective for this particular function's structure.

**Impact**: `generate_technical_decisions` span has been absent for 3 consecutive runs. Technical decisions LLM generation is unobservable in telemetry.

**Recommendation**: File a separate spiny-orb issue with the `technicalNode` function body as a minimal reproduction case for NDS-003 oscillation. This is distinct from the general NDS-003 improvement work — it needs a targeted regression fixture.

---

### RUN16-5: journal-graph.js 1-Attempt Result Did Not Hold (Low)

Run-15's 1-attempt success was anomalous — not a confirmed fix. Back to 3 attempts and $2.30 in run-16. Root cause unknown. The 3-attempt baseline is the expected behavior for this file.

---

### RUN16-6: Cost Surge to $12.29 (Low)

All-time high by a large margin (+91% vs run-15). Three contributors:
1. **Cache write overhead** ($2.64): 705K cache write tokens at $3.75/MTok. New cost component visible in run-16. May stabilize as the prompt cache matures.
2. **journal-graph.js 3 attempts** ($2.30): Reversion from run-15's 1-attempt anomaly.
3. **Failed files wasted tokens** ($0.82): context-capture-tool.js + reflection-tool.js exhausted their budgets on thinking with no usable output.

The cache write cost is structural — it will decrease as the prompt cache warms across runs. The failed-file waste will resolve when RUN16-1 is fixed.

---

## §5. Prioritized Fix Recommendations

### P1 — RUN16-1: Null Parsed_Output (Token Budget Exhaustion)

**Problem**: Function-level fallback minimum token budget (16,384) is insufficient for complex files. Model exhausts entire budget on thinking before producing structured output.

**Primary Fix**: Increase `MIN_OUTPUT_BUDGET` constant in `src/fix-loop/token-budget.ts`. Current value 16,384 leaves no margin for complex instrumentation scenarios.

**Secondary Fix**: Detect thinking-dominant responses and force structured output generation when thinking reaches ~80% of budget.

**Files affected in run-16**: context-capture-tool.js (full failure), reflection-tool.js (full failure), summary-manager.js generateAndSaveWeeklySummary + generateAndSaveMonthlySummary (within-partial skip).

---

### P1 — RUN16-3: Function-Level Fallback Modifies 0-Span Files (NDS-005)

**Problem**: Function-level fallback strips try/catch from files where no spans are added. Structural defect in committed code.

**Fix**: When function-level fallback produces 0 spans, return the original file unchanged. Skip reassembly pass entirely.

**File affected in run-16**: commit-analyzer.js (try/catch stripped).

---

### P2 — RUN16-2: Live-Check JSON Blob to Stdout

**Problem**: Full compliance report JSON (3,615 advisories) printed to terminal.

**Fix**: Suppress stdout emission; write to disk only. Keep the one-line summary (`Live-check: OK (...)`).

---

### P2 — RUN16-4: journal-graph.js technicalNode NDS-003 Oscillation

**Problem**: 3 consecutive runs without a span on technicalNode. Specific NDS-003 oscillation not resolved by Prettier normalization fix.

**Fix**: File minimal-reproduction issue with technicalNode function body as NDS-003 regression fixture.

---

## §6. Run-15 Findings in Run-16 (Resolution Assessment)

| Finding | Resolution | Mechanism |
|---------|------------|-----------|
| RUN15-1 (COV-003 summary-detector.js outer catch) | **RESOLVED** | Outer catch guidance fix (e2582c3) |
| RUN15-2 (IS SPA-002 orphan span) | **RESOLVED** | Auto-instrumentation variation did not recur |
| RUN15-3 (push detection bug) | **UNRESOLVED** | PROGRESS.md hook interaction; push succeeded but required manual intervention |
| RUN15-4 (advisory contradiction ~94%) | **UNRESOLVED** | 92% in run-16 |
| RUN15-5 (journal-manager.js high cost) | **UNRESOLVED/WORSENED** | $1.22 in run-16 (3 attempts vs 1) |

---

## §7. Unresolved Items Carrying Forward

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| Null parsed_output (token budget exhaustion) | **RUN16-1** | **1 run** | P1 — new in run-16 |
| NDS-005 function-level fallback bug | **RUN16-3** | **1 run** | P1 — new in run-16 |
| Live-check JSON blob to stdout | **RUN16-2** | **1 run** | P2 — new in run-16 |
| journal-graph.js technicalNode NDS-003 oscillation | **RUN16-4** | **3 runs** | P2 |
| IS SPA-001: INTERNAL span count structural | RUN14-4 | 3 runs | Structural calibration mismatch |
| IS RES-001: no service.instance.id | RUN14-5 | 3 runs | SDK setup gap |
| Advisory contradiction rate ~90%+ | RUN11-1 | 7 runs | CDQ-007 null guards + SCH-001 semantic dedup |
| Push detection bug (hook interaction) | RUN15-3 | 2 runs | Low — orchestrator misdetects push success when PROGRESS.md hook fires |
| Cost above target | RUN11-4 | 7 runs | $12.29 in run-16; all-time high |

---

## §8. Score Projections for Run-17

### Conservative (RUN16-1 + RUN16-3 fixes land, no other changes)

- **Quality**: 24/25 (96%) — COV-003 stays resolved; NDS-005 resolved; COV-001/COV-004 resolved for context-capture-tool.js, reflection-tool.js, summary-manager.js 2 functions; journal-graph.js technicalNode still oscillating
- **Files**: 13 — context-capture-tool.js, reflection-tool.js, index.js commit for first time; technicalNode still partial
- **Cost**: ~$8.00–9.00 — cache write overhead persists; fewer failed-file waste tokens; journal-graph.js 3 attempts remains

### Target (P1 + P2 fixes all land)

- **Quality**: 25/25 (100%) — all known failures resolved including technicalNode NDS-003 oscillation
- **Files**: 14–15
- **Cost**: ~$6.00–7.00 — reduced failed-file waste; cache write overhead may normalize

### Stretch (all fixes + journal-graph.js 1 attempt)

- **Quality**: 25/25
- **Files**: 14–15
- **Cost**: ≤$6.00
