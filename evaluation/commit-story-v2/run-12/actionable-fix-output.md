# Actionable Fix Output — Run-12

Self-contained handoff from evaluation run-12 to the spiny-orb team.

**Run-12 result**: 23/25 (92%) canonical quality, 12 committed + 1 partial, $5.19 cost in 53.8 minutes. Quality regressed from run-11's perfect 100%. PR #61 created — second consecutive successful push.

**Run-11 → Run-12 delta**: -8pp quality (100% → 92%), -1 file (13 → 12+1p), +$0.94 cost ($4.25 → $5.19), push SUCCESS (second consecutive).

**Target repo**: commit-story-v2 proper (same as runs 9-11)
**Branch**: `spiny-orb/instrument-1775717624848`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/61

---

## §1. Run-12 Score Summary

| Dimension | Score | Run-11 | Delta | Failures |
|-----------|-------|--------|-------|----------|
| NDS | 2/2 (100%) | 2/2 | — | — |
| COV | 4/5 (80%) | 5/5 | **-20pp** | COV-004: summary-manager.js |
| RST | 4/4 (100%) | 4/4 | — | — |
| API | 3/3 (100%) | 3/3 | — | — |
| SCH | 4/4 (100%) | 4/4 | — | — |
| CDQ | 6/7 (86%) | 7/7 | **-14pp** | CDQ-007: journal-manager.js |
| **Total** | **23/25 (92%)** | **25/25** | **-8pp** | **2 failures** |
| **Gates** | **5/5 (100%)** | **5/5** | — | — |
| **Files** | **12 + 1 partial** | **13** | **-1** | summary-detector.js API overload |
| **Cost** | **$5.19** | **$4.25** | **+$0.94** | — |
| **Push/PR** | **YES (PR #61)** | **YES (#60)** | Second consecutive | — |
| **Q x F** | **11.0** | **13.0** | **-2.0** | — |

---

## §2. Quality Rule Failures (2 canonical)

### COV-004: summary-manager.js — 6 Exported Async I/O Functions Without Spans

**File**: src/managers/summary-manager.js
**Failure**: 6 of 9 exported async functions have no spans. Only the 3 pipeline orchestrators were instrumented.

**Skipped functions**:
- `readDayEntries` — reads journal entries from disk
- `saveDailySummary` — writes daily summary to disk
- `readWeekDailySummaries` — reads weekly summaries from disk
- `saveWeeklySummary` — writes weekly summary to disk
- `readMonthWeeklySummaries` — reads monthly summaries from disk
- `saveMonthlySummary` — writes monthly summary to disk

**Agent reasoning**: "Only the 3 pipeline orchestrators were instrumented (3/14 = 21%) to stay near the ratio threshold. The 6 async helper functions are all called from within the pipeline spans and their I/O is covered through context propagation."

**Why this is a failure**: All 6 are exported (RST-004 exemption for unexported functions does not apply), all are async, and all perform filesystem I/O. COV-004 requires verifying each has a span. The "context propagation" argument is a valid observability philosophy but not a valid rubric exemption.

**Run-11 comparison**: Run-11 correctly instrumented all 9 with 9 spans. Run-12 is a regression.

**Fix needed**: None in instrumentation output (can't change past run). For future runs: the agent needs rubric guidance that "context propagation" does not exempt exported async I/O functions from COV-004. A validator could enforce this: flag exported async functions without spans when the file contains other instrumented functions.

### CDQ-007: journal-manager.js — Unconditional setAttribute from Nullable Fields

**File**: src/managers/journal-manager.js
**Failure**: `span.setAttribute('vcs.ref.head.revision', commit.hash)` and `span.setAttribute('commit_story.commit.author', commit.author)` set unconditionally. Agent acknowledged: "may produce undefined values if those fields are absent on the commit object."

**CDQ-007 mechanism**: Flags unconditional setAttribute where value is sourced from an optional parameter or nullable field without a defined-value guard. Setting attributes to undefined pollutes telemetry data.

**Root cause**: The NDS-003 truthy-check gap. The original code had `if (commit.hash)` and `if (commit.author)` guards. The NDS-003 validator flagged these truthy guards as non-instrumentation code additions. The agent removed the guards to comply with NDS-003, resulting in unconditional attribution.

**Fix needed**: Extend the NDS-003 validator to recognize truthy-check patterns as valid instrumentation guards (see §5 P1 fix).

---

## §3. Run-11 Findings Assessment

| # | Finding | Priority | Status in Run-12 |
|---|---------|----------|-----------------|
| RUN11-1 | Advisory contradiction rate 45% | Low | **UNCHANGED** — 44% in run-12 (7 incorrect out of 16 non-trivial advisories; SCH-004 hallucination, CDQ-006 exemption ignored) |
| RUN11-2 | journal-graph.js requires 2 attempts | Low | **REGRESSED** — 3 attempts |
| RUN11-3 | Redundant span.end() in 2 files | Low | **RESOLVED** — not observed |
| RUN11-4 | Cost exceeds $4.00 target | Low | **REGRESSED** — $5.19 |
| RUN11-5 | CDQ-007/NDS-003 conflict (attribute dropping) | Medium | **PARTIALLY ADDRESSED, NEW MANIFESTATION** — PR #352 fixed `!== undefined` guards; truthy checks still flagged, new CDQ-007 failure in journal-manager.js |

**Summary**: 1 resolved (RUN11-3), 1 unchanged (RUN11-1), 2 regressed (RUN11-2, RUN11-4), 1 escalated to new failure mode (RUN11-5 → CDQ-007 failure).

---

## §4. New Run-12 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN12-1 | COV-004: span omission in summary-manager.js | Medium | Coverage |
| RUN12-2 | CDQ-007: unconditional nullable setAttribute in journal-manager.js | Medium | Code quality |
| RUN12-3 | NDS-003 truthy-check gap — two distinct failure modes | Medium | Rule interaction |
| RUN12-4 | journal-graph.js 3 attempts (regression) | Low | Cost |
| RUN12-5 | Cost $5.19 exceeds $4.00 target | Low | Cost |
| RUN12-6 | summary-detector.js partial due to API overload | Low | Infrastructure |

### RUN12-4: journal-graph.js 3 Attempts — Regression (Low)

Regressed from 2 attempts (run-11) to 3 attempts (run-10 baseline). journal-graph.js cost $1.51 in run-12 (29% of total run cost) — each extra attempt adds ~$0.50. Root cause unknown; LLM variation. Run-11's 2-attempt result may have been the outlier. No quality failure.

### RUN12-5: Cost $5.19 Exceeds $4.00 Target (Low)

Total run cost $5.19 — $1.19 over target, highest since run-8. Drivers: journal-graph.js 3 attempts ($1.51), index.js 2 attempts ($0.67), output tokens up 49.4K vs run-11 (208.1K vs 158.7K). The $4.00 target has not been met since run-9 ($3.97).

### RUN12-6: summary-detector.js Partial Due to API Overload (Low)

getDaysWithEntries and findUnsummarizedDays were skipped when the Anthropic API returned `overloaded_error`. 3/5 functions committed. Infrastructure reliability gap (single provider, no model fallback). Not a quality finding — rubric evaluated only on 3 instrumented functions.

### Consolidated Root Cause

RUN12-1, RUN12-2, and RUN12-3 all trace to the same root cause: the NDS-003 truthy-check gap. The gap forces agents to choose between:
- Drop the attribute (lose telemetry, attribute absence visible in traces)
- Set unconditionally (risk undefined, CDQ-007 violation)
- Use ternary as a proxy (e.g., `entries ? entries.length : 0`, preserves attribute but may set misleading 0 vs undefined)
- Skip the function entirely (avoid the conflict, COV-004 risk)

Run-12 saw three NDS-003 truthy-gap manifestations:
- **index.js**: dropped `commit_story.context.messages_count` (truthy guard on `context.chat` removed attribute entirely — same as run-11)
- **journal-manager.js**: removed `if (commit.hash)` and `if (commit.author)` guards, now sets attributes unconditionally → CDQ-007 failure
- **summary-graph.js**: removed `if (entries)` guards around `.length` access — PASS outcome because agent justified removal via JSDoc array type guarantees; not a failure but same NDS-003 pressure

The span-omission pattern in summary-manager.js (COV-004) is a separate LLM variation issue but may be partially motivated by avoiding similar conflicts in helper functions.

---

## §5. Prioritized Fix Recommendations

### P1: Extend NDS-003 Truthy-Check Allowlist (Critical)

**Issue**: The NDS-003 validator recognizes `!== undefined` and `!= null` guards (PR #352) but not truthy-check patterns (`if (value)`, `if (obj.property)`).

**Impact**: Root cause of RUN12-2 (CDQ-007 failure) and continued attribute dropping in index.js. Two distinct failure modes in run-12, likely more in future runs as the agent encounters different optional-field patterns.

**Fix**: Extend the NDS-003 allowlist to recognize truthy-check guard patterns when the guarded code consists only of span instrumentation calls (setAttribute, recordException, setStatus, span.end). The structural pattern to match:

```javascript
// Pattern: truthy guard whose body is only instrumentation
if (value) {
  span.setAttribute(key, value);
}

// Or: nested property truthy guard
if (obj.property) {
  span.setAttribute(key, obj.property);
}
```

The key constraint: if the `if` body contains ONLY `span.*` calls, it is an instrumentation guard, not business logic. If it contains any non-span code, it remains flagged.

**Expected outcome**: journal-manager.js can restore `if (commit.hash)` and `if (commit.author)` guards. CDQ-007 passes. Attribute completeness improves across all runs with optional-field patterns.

### P2: Add COV-004 Guidance for Exported Async I/O Functions (Medium)

**Issue**: The agent applied "context propagation" logic to skip 6 exported async I/O functions in summary-manager.js. This rationale is not aligned with COV-004.

**Impact**: COV-004 failure in run-12. The same reasoning could cause similar omissions in future runs.

**Fix options**:
1. Add a validator check: if a file has any instrumented functions, also verify that all exported async functions performing I/O have spans. Flag any gaps as COV-004 violations.
2. Add rubric guidance note: "Context propagation is not a COV-004 exemption for exported async I/O functions. Each exported async function that performs I/O must have its own span, even if it is called from within an instrumented parent."

**Expected outcome**: Exported async I/O functions in summary-manager.js and similar files consistently receive spans in future runs.

### P3: Add Model Fallback for API Overload (Low)

**Issue**: summary-detector.js was partially committed because the Anthropic API returned `overloaded_error` on 2 of 5 function-level calls. Spiny-orb has no fallback provider.

**Impact**: Partial commits when the primary provider is overloaded. Infrastructure unreliability, not a quality issue.

**Fix**: Add a secondary model provider (e.g., Google Gemini or a different Anthropic model tier) as fallback when the primary provider returns `overloaded_error`. The function-level retry mechanism already exists — add provider rotation to it.

**Expected outcome**: Partial commits from API overload eliminated. summary-detector.js would fully commit in future runs.

---

## §6. Unresolved Items from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| NDS-003 truthy-check gap | RUN11-5 | 2 runs | PR #352 partial; truthy checks still flagged |
| COV-004 span omission (orchestrators-only) | **RUN12-1** | 1 run | LLM variation; guidance fix needed |
| CDQ-007 nullable setAttribute | **RUN12-2** | 1 run | Consequence of NDS-003 truthy gap |
| journal-graph.js 3 attempts | **RUN12-4** | 1 run | LLM variation; root cause unknown |
| Cost above $4.00 | RUN11-4 | 2 runs | $5.19 in run-12 |
| Advisory contradiction rate ~44% | RUN11-1 | 2 runs | SCH-004/CDQ-006 judge issues |
| RUN7-7 span count self-report | Run-7 | 6 runs | Structurally unchanged |
| CJS require() in ESM projects | Run-2 | 11 runs | Open spec gap, not triggered |

---

## §7. Score Projections for Run-13

**Note on "50% discount"**: Evaluation methodology applies a 50% discount to score projections to account for LLM variation — meaning the expected score in any run is 50% between the ideal (all fixes landed, best case) and the worst case (all failures recur). Projections below show both the raw expected score and the discounted range.

### Minimum (no fixes — P1/P2 not landed)

- **Quality**: 23/25 (92%) — same failures likely to recur (LLM variation + NDS-003 truthy gap still active)
- **Files**: 12-13 (summary-detector.js may fully commit if API load is normal)
- **Push/PR**: YES (fine-grained PAT stable)
- **After 50% discount**: 22-23/25, 11-13 files

### Target (P1 fix: NDS-003 truthy-check allowlist)

- **Quality**: 25/25 (100%) — CDQ-007 failure resolved, attribute completeness improves
- **Files**: 13 (summary-manager.js may improve with correct COV-004 guidance)
- **Cost**: Unclear — depends on journal-graph.js attempt count
- **After 50% discount**: 24-25/25, 12-13 files

### Target + P2 (NDS-003 truthy fix + COV-004 guidance)

- **Quality**: 25/25 (100%) — both run-12 failures addressed
- **Files**: 13
- **After 50% discount**: 25/25, 13 files, PR likely

### Stretch (all fixes + cost reduction)

- **Quality**: 25/25, full attribute coverage
- **Files**: 13
- **Cost**: ≤$4.00 if journal-graph.js returns to 2 attempts
- **After 50% discount**: 25/25, 13 files

---

## §8. Oscillation Pattern — Implications for Run-13

Run-12 demonstrates the "oscillation" pattern observed since run-9: perfect score → 2 new failures → fix failures → repeat. Each fix introduces new behavioral constraints that manifest as different failure modes.

The NDS-003 truthy-check gap is the current constraint. Until it is fully resolved, the agent will continue to oscillate between:
- Attribute dropping (avoids CDQ-007, but loses telemetry)
- Unconditional setting (avoids NDS-003, but CDQ-007 failure)
- Ternary workarounds (avoids both violations, but semantically misleading for undefined vs 0)

The P1 fix (truthy-check allowlist) would break this oscillation by giving the agent a compliant path: guard-and-set using a pattern the NDS-003 validator accepts.
