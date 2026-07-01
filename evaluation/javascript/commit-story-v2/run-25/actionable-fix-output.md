// ABOUTME: Run-25 actionable fix handoff for the spiny-orb team — rule failures, coverage delta observations, and process findings.
# Actionable Fix Output — Run-25

Self-contained handoff from evaluation run-25 to the spiny-orb team.

**Run-25 result**: 24/25 (96%) canonical quality, 13 committed, 1 partial (summary-manager.js), 0 failed, 47 spans (40 committed + 7 partial), $7.38 cost (claude-sonnet-4-6). Gates 5/5. IS **100/100** (all-time record). Q×F 12.48.

**Run-24 → Run-25 delta**: Quality +4pp (92% → 96%), COV -20pp (5/5 → 4/5 — new COV-004 failure), SCH +25pp (3/4 → 4/4 — SCH-003 de-facto resolved), CDQ +14pp (6/7 → 7/7 — CDQ-001 confirmed fixed), files -1 committed (14 → 13+1p), spans -1 (48 → 47), cost +$3.68 (~$3.70 → $7.38), IS +20pp (80/100 → 100/100), Q×F -0.40 (12.88 → 12.48).

**Target repo**: commit-story-v2 (same as runs 9–25)
**Branch**: `spiny-orb/instrument-1781909345452`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/86
**spiny-orb version**: main (pre-run build confirmed)

---

## §1. Run-25 Score Summary

| Dimension | Score | Run-24 | Delta | Failures |
|-----------|-------|--------|-------|----------|
| NDS | 2/2 (100%) | 2/2 (100%) | — | — |
| COV | **4/5 (80%)** | 5/5 (100%) | **-20pp** | COV-004: summary-manager.js (2 functions) |
| RST | 4/4 (100%) | 4/4 (100%) | — | — |
| API | 3/3 (100%) | 3/3 (100%) | — | — |
| SCH | **4/4 (100%)** | 3/4 (75%) | **+25pp** | — |
| CDQ | **7/7 (100%)** | 6/7 (86%) | **+14pp** | — |
| **Total** | **24/25 (96%)** | **23/25 (92%)** | **+4pp** | **1 failure** |
| **Gates** | **5/5** | **5/5** | — | — |
| **Files** | **13 + 1 partial** | **14 (clean sweep)** | **-1 committed, +1 partial** | summary-manager.js (2 of 9 functions blocked) |
| **Model** | **claude-sonnet-4-6** | claude-sonnet-4-6 | — | — |
| **Cost** | **$7.38** | **~$3.70** | **+$3.68** | — |
| **IS** | **100/100** | **80/100** | **+20pp** | — |
| **Q×F** | **12.48** | **12.88** | **-0.40** | — |

---

## §2. Prior Findings Assessment

| # | Finding | Priority | Status in Run-25 |
|---|---------|----------|-----------------|
| RUN24-1 | CDQ-001 — index.js `process.exit()` bypasses `finally { span.end() }` (regression) | P2 | **RESOLVED** — `fixProcessExitSpanEnd()` AST restructure (spiny-orb commit 91e9413) confirmed working. `process.exit()` now runs in `.then()` after the span callback's `finally { span.end() }` has executed. Side effect: index.js expanded to 2 spans (added `commit_story.journal.handle_summarize` for the summarize subcommand path — legitimate coverage improvement). |
| RUN24-2 | SCH-003 — git-collector.js `diff_lines` declared `type: string`, set as integer | P2 | **DE-FACTO RESOLVED** — run-25 agent omitted `diff_lines` entirely ("diff content is an unbounded external string"). The `fixAttributeTypeCoercions()` auto-coercion backstop (also commit 91e9413) was not exercised. The fix has not been verified against a real type-mismatch case. |
| RUN23-4 | IS SPA-002 — `commit_story.index.main` drops before batch flush | Resolved | **DE-FACTO RESOLVED for commit-story-v2** — this target uses `SimpleSpanProcessor` (immediate per-span export; no batch buffer to lose) and overrides `process.exit` to route through `shutdownAndExit()` → `sdk.shutdown()`. SPA-002 is structurally impossible for this target. IS 100/100 in run-25 confirms no orphan spans. #926 is correctly closed (superseded by #930 — systemic spiny-orb fix for CLI apps). **Do not re-raise SPA-002 as a finding for commit-story-v2.** |
| RUN21-6 | Agent notes vs committed code divergence | Watch | **WATCH (fourth run)** — no new instances identified in run-25 per-file evaluation. #927 open. |
| PH-1 | Hardcoded commit-story-v2 values in agent prompt (SCH-003 rule body + SCH-002 disambiguation) | Watch | **RESOLVED** — confirmed fixed in spiny-orb PR #982 (pre-run verification). Both the `diff_size`/`diff_lines` inline reference in SCH-003 rule text and the commit-story-v2 domain vocabulary in SCH-002 disambiguation have been abstracted or moved to labeled `<examples>` blocks. First eval run post-fix — no signal yet on whether the change improved generalization. |

---

## §3. New Run-25 Rule Finding

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN25-1 | COV-004 — summary-manager.js validator false positive on conditional-rethrow ENOENT pattern | P2 | Coverage / Validator |

### RUN25-1: COV-004 — summary-manager.js Partial (Validator False Positive)

**File**: `src/managers/summary-manager.js`
**Outcome**: 7 of 9 exported async functions committed. 2 functions blocked by the validator (`readWeekDailySummaries`, `readMonthWeeklySummaries`).

**Pattern that triggered the failure**:

```javascript
// Inner loop catch — graceful degradation pattern:
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
  // ENOENT: file not found — skip silently
}
```

**Why this is a validator false positive**: `isExpectedConditionCatch` in `cov003.ts` returns false (= needs error recording) whenever a catch body contains both an ENOENT pattern string AND a `ThrowStatement`. The intent is to flag cases where a genuine error path follows an ENOENT guard (`if (err.code === 'ENOENT') return; throw err`). But the pattern above is the negated form: ENOENT is the graceful path (skip); non-ENOENT errors rethrow to the outer span's error handler, which already calls `recordException` and `setStatus(ERROR)`. The validator cannot distinguish the two forms and conservatively rejects both.

**The correct behavior**: The outer `try { ... } catch (error) { span.recordException(error); span.setStatus(ERROR); throw error; }` in both functions handles non-ENOENT errors from the inner loop. The inner catch is semantically identical to an empty catch — it adds no error-handling responsibility. COV-003 is satisfied at the outer span level.

**Run-24 comparison**: Run-24 committed summary-manager.js cleanly (9/9 spans, ×1 attempt). The run-24 agent avoided this by replacing conditional rethrows with empty catches (`catch { }`). This passes the validator but changes behavior: non-ENOENT errors from inside the loop are silently swallowed rather than propagated. That is technically an NDS-007 violation that the run-24 validator did not catch. Run-25's agent preserved the semantically correct conditional rethrow — and was blocked.

**Root cause in spiny-orb**: `isExpectedConditionCatch` in `cov003.ts` does not distinguish between:
- `if (err.code === 'ENOENT') return; throw err` → throw is a genuine error path → flag for COV-003 ✅
- `if (err.code !== 'ENOENT') throw err` → ENOENT is handled; throw propagates to outer span → graceful degradation, COV-003 already satisfied ✅ (but currently flagged ❌)

**Recommended fix — Option A (validator, preferred)**:

Extend `isExpectedConditionCatch` to recognize the negated pattern. The distinguishing characteristic is whether the throw is guarded by `!== 'ENOENT'` (negated: rethrow is the non-normal path → graceful degradation) versus the positive pattern (throw after ENOENT guard → throw is the genuine error path):

```typescript
// Proposed addition to isExpectedConditionCatch():
const NEGATED_ENOENT_RETHROW = /if\s*\(\s*err(?:or)?\.code\s*!==\s*['"]ENOENT['"]\s*\)\s*throw/;
if (NEGATED_ENOENT_RETHROW.test(bodyText)) {
  return true; // Negated ENOENT pattern — conditional rethrow is graceful degradation
}
```

**Recommended fix — Option B (prompt guidance, workaround)**:

Add agent guidance for inner-loop catches with conditional rethrows: instruct the agent to explicitly record errors for the non-ENOENT path in inner catches OR to use empty catches for inner-loop graceful degradation when the outer span already handles errors. Option B produces lower-quality instrumentation (empty catches silently swallow non-ENOENT errors) and is a workaround rather than a fix.

**Expected outcome if Option A is implemented**: `readWeekDailySummaries` and `readMonthWeeklySummaries` commit cleanly in run-26. summary-manager.js returns to 9/9 spans (×1 attempt, matching run-24). COV-004 passes. Q×F potential: 14.0 (25/25 × 14 files — all-time record target).

---

## §4. Coverage Delta Observations (Not Failures)

Three files show attribute selection that differs substantially from run-24. All pass COV-005 (≥1 domain attribute per span). These are narrative observations only — no rule verdicts affected.

### context-capture-tool.js — Three-Run Declining Richness

| Run | Attributes on `commit_story.context.capture` span |
|-----|---|
| Run-23 | `entry_date`, `file_path`, `source` (3 attrs) |
| Run-24 | `entry_date`, `file_path` (2 attrs) |
| Run-25 | `file_path` only (1 attr) |

**Pattern**: Each run drops one attribute from this span. COV-005 passes (≥1), but by run-27 the span would have zero attributes if the trend continues. The `entry_date` and `source` attributes carry diagnostic value (what date is being captured, from what source). This is a concrete symptom of insufficient minimum-attribute threshold guidance — the agent has no principled reason to retain attributes that "already work."

### journal-graph.js — Token Usage Attributes Dropped

Run-24 node spans carried `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens` (guarded with `!= null`). Run-25 drops both. Span names also changed (`summary_node` → `generate_summary`, etc.). The remaining attributes (`commit_story.ai.section_type`, `gen_ai.*` model/provider/temperature) are meaningful, so COV-005 passes. But token-cost observability is absent — these are registered schema attributes that were available and not used.

### summary-detector.js — 3 → 0 Schema Extension Attributes

Run-24: 9 spans with 3 custom schema extension attributes. Run-25: same 9 spans, 0 new schema extension attributes (all registered attributes from prior runs). The span names and structure are identical. The agent appears to have concluded "no new attributes needed" without asking whether the registered attributes from prior runs should still be applied. This is the clearest single-file example of the attribute guidance gap described in §5.

---

## §5. Process and Tool Observations

### [P2] Attribute Selection Guidance Gap

Run-25 shows high attribute variance across runs and files on identical source code: summary-detector.js went from 3 extension attrs (run-24) to 0 (run-25); summarize.js went from 2 to 6; context-capture-tool.js has declined by 1 attr per run for three consecutive runs. The agent lacks a principled framework for when to add, retain, or skip attributes.

Three concrete asks:

**1. Minimum-attribute threshold guidance**: Add guidance such as: "Any span that processes a meaningful domain object should carry at least one attribute describing its primary input or output. A span with zero attributes is only appropriate when the operation is purely structural (e.g., a no-arg setup call) or when every candidate attribute would violate CDQ-007. Before declaring 0 attributes, explicitly ask: what does an on-call engineer need to understand what this span processed?" This directly addresses the summary-detector.js regression.

**2. Registered-vs-extension decision guidance**: Add guidance such as: "If no registered key exactly fits, that is not a reason to skip the attribute — it is a reason to declare a schema extension. A new attribute with a clear name and type is better than no attribute. Only skip the attribute if the data itself is inappropriate (PII, unbounded, CDQ-007 violation), not because the registry doesn't yet have a matching key."

**3. Industry practice research spike** (prerequisite for writing new guidance): Before writing the above guidance, conduct a research spike with this question: *"What does industry best practice say about which span attributes are worth collecting, and what concrete heuristics should an AI instrumentation agent use to decide when to add an attribute vs. skip it?"* Sources: OTel specification guidance on attribute selection; Datadog's span enrichment recommendations; practitioner heuristics from the OTel community (signal-to-noise decisions, the 'would an on-call engineer need this?' test, cardinality risk patterns). Output should be 3–5 concrete, citable heuristics that can be embedded directly into the agent prompt — not general philosophy, but actionable decision rules.

### [P2] Debug Dump Coverage Gap — Partial Files Not Captured

`--debug-dump-dir` only writes files for runs that end in failure (`buildFailedResult` path). Partial files (where some functions commit and others are blocked by the validator) produce no dump. For run-25's summary-manager.js partial, the agent's instrumentation attempt for the 2 skipped functions is unrecoverable without re-running spiny-orb — root cause reconstruction relied solely on validator error messages and source code analysis.

**Recommended fix (minimum)**: Also write `lastInstrumentedCode` for partial results (where some functions failed validation). The dump structure already includes `tscAttempts` via issue #949 (merged); `lastInstrumentedCode` is only set on the `buildFailedResult` path.

**Recommended fix (full)**: Write debug dumps for all statuses (committed, partial, 0-span-success, failed) — not only failures. This exposes the `tscAttempts` field for all outcomes and enables oscillation diagnosis (e.g., when a file alternates between committed and skipped across attempts within a single run).

### [Watch] Thinking Block Persistence — Attribute Variance Opacity

Run-25 attribute variance (summary-detector.js 3→0 attrs; summarize.js 2→6 attrs on identical source) cannot be diagnosed from agent notes or log output alone — the agent's reasoning at the attribute-selection decision point is not preserved. This directly limits the evaluation team's ability to distinguish "agent made a principled decision" from "agent made an arbitrary selection" and to provide targeted feedback.

This is the clearest argument yet for PRD #752 (thinking block persistence to companion files). The eval team requests that #752 be elevated to short-term priority.

---

## §6. Notable Positives

**IS 100/100 — all-time record**. Prior best was 90/100 (runs 17, 18, 21). The per-target SPA-001 threshold (55 for commit-story-v2, via PR #142) is the key enabler: structural INTERNAL span count (31–48) no longer fails IS. SPA-002 was also absent in run-25 — confirmed de-facto resolved: commit-story-v2 uses `SimpleSpanProcessor` (immediate per-span export, no batch buffer) and overrides `process.exit` through `shutdownAndExit()` → `sdk.shutdown()`. Batch-flush-before-exit is structurally impossible for this target regardless of CDQ-001 status.

**RUN24-1 CDQ-001 fix confirmed**. The `fixProcessExitSpanEnd()` AST restructure held across the full file set. This is the first run-25 primary goal achieved. The three-regression history (fixed → regressed → fixed) appears to be broken by the deterministic AST fix.

**PH-1 prompt hygiene resolved**. Both hardcoded commit-story-v2 values (`diff_size`/`diff_lines` in SCH-003 rule body; commit-story-v2 pipeline vocabulary in SCH-002 disambiguation) removed in spiny-orb PR #982. Run-26 will provide the first signal on whether the abstracted guidance generalizes correctly.

**journal-graph.js — 8th consecutive success** (runs 18, 19, 20, 21, [22 never ran], 23, 24, 25). COV-006 confirmed: LangChain `model.invoke()` calls correctly wrapped by manual parent spans that establish active context.

**0 failed files** for the second consecutive run (run-24 was also 0 failed). The first two 0-failure runs in the dataset.

---

## §7. Carry-Forward Tracker (Open Items Entering Run-26)

| ID | Title | Priority | Status | Runs Open | spiny-orb Issue |
|----|-------|----------|--------|-----------|-----------------|
| RUN25-1 | COV-004: summary-manager.js — `isExpectedConditionCatch` does not recognize negated ENOENT pattern (`!== 'ENOENT'`); 2 exported async functions blocked | P2 | Open — new in run-25; validator fix (Option A) or prompt guidance (Option B) needed | 1 | — |
| RUN23-4 | IS SPA-002: `commit_story.index.main` drops before batch flush | Closed | **DE-FACTO RESOLVED** — commit-story-v2 uses `SimpleSpanProcessor` (immediate per-span export) and overrides `process.exit` through `shutdownAndExit()`. Batch-flush-before-exit is structurally impossible. IS 100/100 confirms. **Do not carry forward to run-26.** Systemic spiny-orb fix tracked in #930. | Closed | #930 (open — systemic CLI fix) |
| RUN21-6 | Agent notes vs committed code divergence | Watch | No new instances in run-25. Pattern documented; #927 open. | 4 | #927 |
| IS SPA-001 | INTERNAL span count structural | Structural | 31 INTERNAL spans in run-25 IS run (well within 55-span threshold). Structural mismatch resolved by PR #142 calibration change. Research spike #929 still open. | Structural | #929 |
| context-capture-tool.js | Declining attribute richness (3→2→1 attrs over 3 runs) | Watch | Three-run declining trend on `commit_story.context.capture` span. COV-005 still passes. Will reach 0 by run-27 if not addressed. Root cause: insufficient minimum-attribute guidance. | 3 | — |

**Closed this run**: RUN24-1 (CDQ-001 index.js `process.exit()`), PH-1 (hardcoded commit-story-v2 prompt values). RUN24-2 (SCH-003 git-collector.js `diff_lines`) de-facto resolved — agent omitted attribute; backstop not exercised. RUN23-4 (IS SPA-002) de-facto resolved — SimpleSpanProcessor + process.exit override makes batch-flush-before-exit structurally impossible; IS 100/100 confirms; systemic fix in #930.

---

## §8. Score Projection — Run-26

| Scenario | Assumption | Projected Score | Q×F |
|----------|------------|-----------------|-----|
| Validator fix lands (Option A) | `isExpectedConditionCatch` recognizes negated ENOENT; summary-manager.js fully commits (14 files) | **25/25 (100%)** | **14.0** — all-time record |
| Prompt guidance only (Option B) | Agent uses empty catch workaround; summary-manager.js fully commits | **25/25 (100%)** | **14.0** |
| No fix — failure recurs | Same partial; 13 committed | **24/25 (96%)** | **12.48** (same as run-25) |

**Key insight**: Run-25 produced exactly one new failure, and it has a clear root cause with a targeted fix. If the COV-004 validator fix lands before run-26, the path to 25/25 and Q×F 14.0 is open. If the fix does not land, the failure recurs and Q×F stays at 12.48. The 14-file base is reachable (summary-manager.js has 9 exportable functions with spans pending only the validator fix), so the Q×F record is achievable.

**IS path**: IS 100/100 in run-25 establishes a new baseline. SPA-002 is de-facto resolved for commit-story-v2 (SimpleSpanProcessor + shutdownAndExit override — structurally impossible, not just absent in one run). Run-26 IS scoring does not need to watch for `commit_story.index.main` orphan spans; #930 tracks the systemic spiny-orb fix for other CLI targets.

**Cost note**: Run-25 cost $7.38 — roughly double run-24's $3.70. The increase reflects a higher multi-attempt rate (summary-manager.js ×2, reflection-tool.js ×2) and longer per-file reasoning. If the validator fix eliminates the summary-manager.js retry loop, cost should improve.
