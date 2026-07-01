# Baseline Comparison — Run-14 vs Runs 2-13

---

## Cross-Run Quality Trend

| Run | Quality | Gates | Files | Spans | Cost | Push/PR | IS | Q×F |
|-----|---------|-------|-------|-------|------|---------|-----|-----|
| 2 | 15/21 (71%) | 3/4 | 5 | 11 | — | NO | — | 3.6 |
| 3 | 19/26 (73%) | 4/4 | 7 | 15 | — | NO | — | 5.1 |
| 4 | 18/26 (69%) | 4/4 | 16 | 48 | $5.84 | NO | — | 11.1 |
| 5 | 23/25 (92%) | 5/5 | 9 | 17 | $9.72 | NO | — | 8.3 |
| 6 | 21/25 (84%) | 5/5 | 5 | 16 | $11.02 | NO | — | 4.2 |
| 7 | 22/25 (88%) | 5/5 | 13 | 28 | $3.22 | NO | — | 11.4 |
| 8 | 23/25 (92%) | 5/5 | 12 | 28 | $4.00 | NO | — | 11.0 |
| 9 | **25/25 (100%)** | 5/5 | 12 | 26 | $3.97 | NO | — | 12.0 |
| 10 | 23/25 (92%) | 5/5 | 12 | 28 | $4.36 | NO | — | 11.0 |
| 11 | **25/25 (100%)** | 5/5 | 13 | 39 | $4.25 | **YES** | — | **13.0** |
| 12 | 23/25 (92%) | 5/5 | 12+1p | 31 | $5.19 | YES | — | 11.0 |
| 13 | **25/25 (100%)** | 5/5 | 7+1p | 16 | ~$6.41 | YES | — | 7.0 |
| **14** | **22/25 (88%)** | **5/5** | **12** | **32** | **$5.59** | **YES** | **80/100** | **10.6** |

Run-14 notes: first IS score run. Partial and failed counts: 0 partial, 0 failed, 18 correct skips. Fourth consecutive push/PR success.

---

## Dimension Trends (Runs 9-14)

| Dimension | Run-9 | Run-10 | Run-11 | Run-12 | Run-13 | Run-14 |
|-----------|-------|--------|--------|--------|--------|--------|
| NDS | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| COV | 5/5 | 5/5 | 5/5 | 4/5 | 5/5 | **3/5** |
| RST | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 |
| API | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| SCH | 4/4 | 3/4 | 4/4 | 4/4 | 4/4 | 4/4 |
| CDQ | 7/7 | 6/7 | 7/7 | 6/7 | 7/7 | **6/7** |

NDS, RST, API, SCH all maintain 100% in run-14. COV drops to 3/5 — the lowest since the rubric stabilized at 25 rules (run-5 onward).

---

## Key Changes in Run-14

### 1. Quality: 22/25 — New Low Since Run-6

Run-14 scores 22/25 (88%), the lowest since run-6 (21/25). Two dimensions failed:

- **COV: 3/5** — COV-003 fail (summaryNode catch missing error recording) + COV-004 fail (summary-manager.js 6 exported async I/O without spans, persistent since run-12)
- **CDQ: 6/7** — CDQ-003 fail (summaryNode catch missing recordException + setStatus)

Both COV-003 and CDQ-003 failures originate from a single source: `summaryNode` in `journal-graph.js` being instrumented for the first time. The catch block was written without error recording — inconsistent with `technicalNode` and `dialogueNode` in the same file, which both handle it correctly. This is a first-instrumentation defect on a file that took 3 attempts across 3 prior runs to instrument at all.

COV-004 on summary-manager.js is a persistent failure since run-12 (3 consecutive runs). The agent consistently applies a ratio-backstop heuristic that overrides the COV-004 requirement for 6 exported async I/O functions.

### 2. File Count Recovery: 7 → 12 (run-13 → run-14)

The smart rollback fix (#437, #447) and type-safety fixes (#435, #436) eliminated the 10-file rollback cascade from run-13. No checkpoint failures occurred. The 12 committed files include all files that were rolled back in run-13:
- summary-graph.js (rolled back at checkpoint 1 in run-13 → committed cleanly in run-14)
- summary-manager.js (rolled back at checkpoint 2 in run-13 → committed in run-14 with 3 attempts)
- journal-manager.js (rolled back at checkpoint 2 → committed cleanly in run-14)
- index.js correctly skipped in run-14 (CDQ-001 block on process.exit paths)

### 3. summaryNode Instrumented for the First Time

After 3 consecutive runs of NDS-003 Code Preserved failures (runs 11-13), the `summaryNode` fix (#438) enabled successful instrumentation on attempt 3. journal-graph.js now has 4 spans. This is a significant milestone — summaryNode is the only LangGraph node that was consistently blocked for the entire prior evaluation history.

### 4. span Count: 16 → 32 (run-13 → run-14)

32 spans represents the first complete span topology for commit-story-v2. All meaningful async I/O and LLM-calling functions have at least one span (with the exception of the 6 COV-004 gap functions in summary-manager.js). Run-14 establishes the baseline span architecture for all future comparison runs.

### 5. Cost: $5.59 — Still Above $4.00 Target

$5.59 is -$0.82 vs run-13 but $1.59 above target. Cost composition:
- journal-graph.js: $1.52 (3 attempts, 27% of total) — same pattern as runs 12-13
- summary-manager.js: $1.13 (3 attempts) — first time committed; no prior baseline
- 10 single-attempt files: $1.30 combined

Without the 3-attempt files, the run would cost ~$2.94 (below target). Reducing journal-graph.js to 2 attempts would save ~$0.50/run.

### 6. First IS Score: 80/100 (Good)

Run-14 is the first run with IS scoring. 80/100 falls in the Good band (75–89). Two failures:
- **RES-001**: No `service.instance.id` in resource attributes (SDK config gap, not spiny-orb scope)
- **SPA-001**: One trace had 12 INTERNAL spans (limit 10); journal generation trace depth

Note: `COMMIT_STORY_TRACELOOP=true` disabled for IS scoring run due to `@traceloop/instrumentation-langchain` API incompatibility. LangChain auto-instrumentation was inactive during IS scoring; manual spans only.

---

## Score Projection Validation

**Run-13 actionable fix output projected for run-14:**

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| Conservative (fixes land, LLM varies) | 25/25, 7-10 files | 22/25, 12 files | **Partial** — files exceeded projection; quality regressed |
| Target (all P1 fixes) | 25/25, 13 files, ~$4-5 | 22/25, 12 files, $5.59 | **Partial** — files close, cost close, quality missed |
| Stretch (all fixes + cost reduction) | 25/25, 13+, ≤$4.00 | 22/25, 12, $5.59 | **Not met** |

The file count recovery exceeded the Conservative projection, which validates the P1 fixes working as intended. The quality miss (22 vs 25) is entirely attributable to summaryNode's first-time instrumentation introducing new failures — a success-path regression rather than a fix-path regression.

---

## Failure Classification Across Runs (Updated for Run-14)

| Failure | First Seen | Fixed In | Runs Active | Status in Run-14 |
|---------|-----------|----------|-------------|-----------------|
| Push auth | Run-3 | Run-11 | 8 runs | ✅ Resolved — 4 consecutive successes |
| SCH-003 (count types) | Run-7 | Run-9 | 2 runs | ✅ Resolved |
| CDQ-007 (optional chaining `?.`) | Run-10 | Run-11 | 1 run | ✅ Resolved |
| SCH-003 (boolean types) | Run-10 | Run-11 | 1 run | ✅ Resolved |
| NDS-003 truthy-check gap (attribute drop) | Run-11 | Run-13 via #435/#436 | 3 runs | ✅ Resolved — null guards active in run-14 |
| COV-004 (summary-manager.js 6 async I/O) | Run-12 | — | **3 runs** | ⚠️ Persistent |
| CDQ-007 (nullable journal-manager.js) | Run-12 | Run-14 | 2 runs | ✅ Resolved — null guards + Date/string fix |
| Checkpoint cascade rollback (10 files) | Run-13 | Run-14 via #437/#447 | 1 run | ✅ Resolved — 0 checkpoint failures |
| journal-manager.js Date/string TypeError | Run-13 | Run-14 via #436 | 1 run | ✅ Resolved |
| summaryNode NDS-003 Code Preserved | Run-11 | Run-14 via #438 | 3 runs | ✅ Resolved — instrumented for first time |
| **COV-003 summaryNode catch** | **Run-14** | — | **1 run** | 🔴 New |
| **CDQ-003 summaryNode catch** | **Run-14** | — | **1 run** | 🔴 New |
| journal-graph.js 3 attempts | Run-12 | — | **3 runs** | ⚠️ Persistent |
| Cost above $4.00 target | Run-11 | — | **4 runs** | ⚠️ Persistent |
| Advisory contradiction rate | Run-11 | Reduced in Run-14 | 4 runs | ⚠️ Improved (67% → 40%) — SCH-004 filter fix working |

---

## Oscillation Pattern (Updated)

| Run | Score | Pattern |
|-----|-------|---------|
| Run-9 | 25/25 | First perfect score |
| Run-10 | 23/25 | New failures (SCH-003 boolean, CDQ-007 optional chaining) |
| Run-11 | 25/25 | Both fixed |
| Run-12 | 23/25 | New failures (COV-004 span strategy, CDQ-007 nullable) |
| Run-13 | 25/25 | Both fixed (+ checkpoint cascade resolved) |
| **Run-14** | **22/25** | **New failures (COV-003 + CDQ-003 on summaryNode, COV-004 persistent)** |

The oscillation pattern continues but run-14 introduces a new dynamic: 3 failures instead of 2, and a new persistent COV-004 failure entering its 3rd run. The summaryNode failures are a first-instrumentation artifact — likely fixable by prompting for consistent catch-block error recording across all nodes in the same file. COV-004 on summary-manager.js is becoming a structural gap that may require a targeted spiny-orb fix.

---

## Remaining Issues Tracker

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| **COV-003: summaryNode catch missing error recording** | **RUN14** | **1 run** | P1 — summaryNode span shows success even when LLM call fails |
| **CDQ-003: summaryNode catch missing recordException/setStatus** | **RUN14** | **1 run** | P1 — inconsistent with technicalNode/dialogueNode in same file |
| COV-004: summary-manager.js 6 async I/O without spans | RUN12 | 3 runs | Agent ratio-backstop heuristic overrides COV-004 |
| journal-graph.js 3 attempts | RUN12 | 3 runs | Root cause unclear; large file, validator catches on attempts 1-2 |
| Cost above $4.00 target | RUN11 | 4 runs | $5.59 in run-14; driven by 3-attempt files |
| Advisory contradiction rate | RUN11 | 4 runs | Improved: 67% (run-13) → 40% (run-14); SCH-004 filter fix helping |
| RUN7-7 span count self-report | Run-7 | 8 runs | Structurally unchanged |
| CJS require() in ESM projects | Run-2 | 13 runs | Open spec gap, not triggered |
| IS RES-001: no service.instance.id | Run-14 | 1 run | SDK config gap; not spiny-orb scope |
| IS SPA-001: journal trace has 12 INTERNAL spans (limit 10) | Run-14 | 1 run | Span depth in journal generation trace |
