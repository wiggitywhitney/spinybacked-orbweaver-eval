# Baseline Comparison — Run-6 vs Runs 2-5

5-run trend analysis comparing evaluation run-6 against all prior runs.

---

## Dimension-Level Trend (5-Run)

| Dimension | Run-2 | Run-3 | Run-4 | Run-5 | Run-6 | Trend |
|-----------|-------|-------|-------|-------|-------|-------|
| **NDS** | 1/2 (50%) | 2/2 (100%) | 1/2 (50%) | 2/2 (100%) | **2/2 (100%)** | Stable at 100% (2 runs) |
| **COV** | 2/4 (50%) | 4/6 (67%) | 2/6 (33%) | 3/5 (60%) | **3/5 (60%)** | Flat — COV-001 + COV-005 persistent |
| **RST** | 2/2 (100%) | 3/3 (100%) | 3/4 (75%) | 4/4 (100%) | **3/4 (75%)** | Regressed — RST-004 new |
| **API** | 0/3 (0%) | 1/3 (33%) | 3/3 (100%) | 3/3 (100%) | **3/3 (100%)** | Stable at 100% (3 runs) |
| **SCH** | 2/4 (50%) | 2/4 (50%) | 2/4 (50%) | 4/4 (100%) | **3/4 (75%)** | Regressed — SCH-001 new systemic |
| **CDQ** | 5/6 (83%) | 5/6 (83%) | 4/7 (57%) | 7/7 (100%) | **7/7 (100%)** | Stable at 100% (2 runs) |
| **Overall** | 15/21 (74%) | 19/26 (73%) | 15/26 (58%) | 23/25 (92%) | **21/25 (84%)** | **Regressed** |
| **Gates** | 3/5 | 4/5 | 4/5 | 5/5 | **5/5** | Stable at 5/5 (2 runs) |
| **Files** | N/A | 17 | 16 | 9 | **5** | **Declining since run-3** |

### Dimension Analysis

**Stable at 100% (3 dimensions)**: NDS, API, CDQ have been at 100% for 2-3 consecutive runs. These are solved problems — the agent reliably preserves signatures, uses correct dependencies, and writes quality OTel code.

**Persistent failures (COV)**: COV-001 (index.js entry point) has failed 3 consecutive runs with different root causes each time. COV-005 (zero attributes) has failed 2 runs. Both are infrastructure/registry issues, not agent quality issues.

**New regressions (RST, SCH)**: Both new failures are caused by the single-span registry:
- RST-004: Agent couldn't give the exported function a correct span name, so instrumented internals instead
- SCH-001: Agent forced to misuse the one registered name on 4/5 files

---

## File Outcome Comparison

### Per-File Delivery History (Files with Instrumentation)

| File | Run-3 | Run-4 | Run-5 | Run-6 | Trajectory |
|------|-------|-------|-------|-------|-----------|
| claude-collector.js | ✅ | ✅ | ✅ | ✅ | **Stable** — committed 4 consecutive runs |
| git-collector.js | ✅ | ✅ | ✅ | ✅ | **Stable** — committed 4 runs (but RST-004 new) |
| context-integrator.js | ❌ | ✅ | ✅ | ✅ | **Stable** — committed 3 runs |
| summary-manager.js | — | Partial | Partial | **✅** | **RECOVERED** — first commit in run-6 |
| server.js | — | ✅ | ✅ | ✅ | **Stable** — committed 3 runs (COV-005 persistent) |
| context-capture-tool.js | — | ✅ | ✅ | ⬜ | **REGRESSED** — 0 spans (RST-004 vs COV-004) |
| reflection-tool.js | — | ✅ | ✅ | ⬜ | **REGRESSED** — 0 spans (RST-004 vs COV-004) |
| commit-analyzer.js | — | ✅ | ✅ | ⬜ | **Corrected** — sync-only, run-5 over-instrumented |
| journal-paths.js | — | ✅ | ✅ | ⬜ | **REGRESSED** — SCH-001 forced span removal |
| auto-summarize.js | — | ✅ | ✅(COV-005) | Partial | **REGRESSED** — SCH-001 + COV-003 |
| index.js | — | ❌ | ❌ | ⬜ | **Persistent failure** — 3 runs, different causes |
| summarize.js | — | ❌ | ❌ | Partial | **Improving** — from total fail to 7/8 functions |
| journal-graph.js | — | Partial | Partial | Partial | **Stable partial** — improving function count |
| summary-graph.js | — | Partial | Partial | Partial | **Stable partial** — improving function count |
| journal-manager.js | — | Partial | Partial | Partial | **Stable partial** — 9/10, SCH-001 sole blocker |
| summary-detector.js | — | Partial | Partial | Partial | **Stable partial** — complex multi-issue |

Legend: ✅ = committed with spans, ⬜ = 0 spans (correct skip or regression), ❌ = failed, Partial = not committed

### File Outcome Summary

| Category | Count | Files |
|----------|-------|-------|
| **Stable committed** | 5 | claude-collector, git-collector, context-integrator, server, + summary-manager (recovered) |
| **Recovered** | 1 | summary-manager (partial→committed) |
| **Regressed** | 4 | auto-summarize, context-capture-tool, reflection-tool, journal-paths |
| **Corrected** | 1 | commit-analyzer (over-instrumentation removed) |
| **Stable partial** | 4 | journal-graph, summary-graph, journal-manager, summary-detector |
| **Improving** | 1 | summarize.js (failed→partial 7/8) |
| **Persistent failure** | 1 | index.js (3 runs) |
| **Correct skips** | 12 | Prompt files, config, filters |

**Net change from run-5**: +1 recovered, -4 regressed, -1 corrected = **-4 committed files**

---

## Failure Classification

| Classification | Count | Details |
|---------------|-------|---------|
| **Resolved** | 0 | No run-5 failures resolved (COV-001 and COV-005 persist) |
| **Persistent** | 2 | COV-001 (3 runs), COV-005 (2 runs) |
| **New regression** | 2 | RST-004 (git-collector), SCH-001 (systemic) |
| **Unmasked** | 1 | SCH-001 was hidden behind COV-003; emerged when DEEP-1 fix allowed files to progress further |
| **Superficial resolution verified** | 3 | NDS-005, CDQ-003, RST-001 on summary-manager.js — all genuinely resolved |

---

## Coverage Recovery Assessment

**Key question for run-6**: Did DEEP-1/RUN-1/DEEP-4 fixes recover the expected files?

### Predicted vs Actual Recovery

| File | Expected | Actual | Root Cause of Miss |
|------|----------|--------|-------------------|
| index.js | Recover | ⬜ 0 spans | COV-003 boundary gap (swallow-and-continue) + SCH-001 |
| summarize.js | Recover | Partial (7/8) | COV-003 boundary gap (per-item catch) + SCH-001 |
| journal-graph.js | Recover | Partial (10/12) | SCH-001 + NDS-003 |
| summary-graph.js | Recover | Partial (13/15) | SCH-001 (oscillation detected) + COV-003 (try/finally) |
| sensitive-filter.js | Recover | ⬜ 0 spans | Correctly reclassified as sync-only (#212) |
| journal-manager.js | Recover | Partial (9/10) | SCH-001 (sole blocker) |
| summary-manager.js | Recover | **✅ Committed** | DEEP-1 + DEEP-4 worked! |
| summary-detector.js | Recover | Partial (5/11) | COV-003 + SCH-001 + NDS-003 |

**Recovery rate: 1/8 predicted files actually committed.** 5 improved to "more functions pass" but couldn't commit because SCH-001 blocked the final assembly.

### Why Recovery Failed

The fixes DID help — function-level pass rates improved across all 8 files. But two factors prevented full recovery:

1. **SCH-001 emerged as new dominant blocker** — every file needs span names not in the 1-span registry
2. **COV-003 boundary gaps** — DEEP-1 fixed ENOENT catches but 3 other patterns remain (per-item-collection, swallow-and-continue, try/finally)

This is the **dominant blocker peeling pattern**: each run fixes the previous top blocker, revealing the next. Run-5: COV-003 → Run-6: SCH-001 → Run-7: ?

---

## Superficial Resolution Assessment

| Rule | Run-5 Status | Run-6 Status | Files Checked | Verdict |
|------|-------------|-------------|---------------|---------|
| NDS-005 | Latent (8 violations, partial files) | PASS on summary-manager.js | 1 recovered file | **Genuinely resolved** |
| CDQ-003 | Latent (partial files) | PASS on summary-manager.js | 1 recovered file | **Genuinely resolved** |
| RST-001 | Correct skip, monitor | PASS on summary-manager.js | 1 recovered file | **Genuinely resolved** |

Only 1 file recovered from partial→committed, so the sample size is small. The 5 still-partial files can't be checked (their code isn't on the branch). Run-7 should re-verify these if more files commit.

---

## Quality vs Coverage Trend

| Run | Quality Score | Files Committed | Quality × Files | Direction |
|-----|-------------|----------------|-----------------|-----------|
| Run-2 | 74% | N/A | — | — |
| Run-3 | 73% | 17 | 12.4 | Baseline |
| Run-4 | 58% | 16 | 9.3 | Quality ↓ |
| Run-5 | 92% | 9 | 8.3 | Quality ↑, Coverage ↓ |
| **Run-6** | **84%** | **5** | **4.2** | **Both ↓** |

**The quality × files product has declined every run since run-3.** Run-5 consciously traded coverage for quality (validation pipeline). Run-6 was supposed to recover coverage — instead, stricter validation combined with the single-span registry pushed both metrics down.

**The coverage decline is accelerating**: 17 → 16 → 9 → 5. If this trend continues, run-7 could have ~3 files. The primary intervention needed is registry expansion (more span definitions).

---

## Run-5 Score Projection Validation

| Tier | Predicted Score | Predicted Files | Actual Score | Actual Files | Assessment |
|------|----------------|----------------|-------------|-------------|------------|
| Minimum | 96% | 10 | 84% | 5 | **-12pp, -5 files** |
| Target | 96-100% | 14-16 | 84% | 5 | **-12-16pp, -9-11 files** |
| Stretch | 100% | 15-17 | 84% | 5 | **-16pp, -10-12 files** |

**All three tiers catastrophically missed.** The projections assumed:
1. Fixed blockers would directly translate to file recovery ❌ (SCH-001 unmasked)
2. No new dominant blockers would emerge ❌ (SCH-001 emerged)
3. Validation strictness would remain constant ❌ (SCH-001 enforcement increased)

**Calibration lesson**: Run-5 projections noted "unmasked bug risk" but under-weighted it. Run-7 projections must:
- Explicitly account for the dominant-blocker peeling pattern
- Include a "new blocker emerges" tier
- Discount predicted recovery by at least 50% for unmasked bug risk

---

## Cost Comparison

| Run | Cost | Ceiling | % Ceiling | Files | Cost/File |
|-----|------|---------|-----------|-------|-----------|
| Run-2 | N/A | N/A | N/A | N/A | N/A |
| Run-3 | $4.20 | $68 | 6.2% | 17 | $0.25 |
| Run-4 | $5.84 | $68 | 8.6% | 16 | $0.37 |
| Run-5 | $9.72 | $68 | 14.3% | 9 | $1.08 |
| **Run-6** | **$9.72** | **$67.86** | **14.3%** | **5** | **$1.94** |

**Cost held flat at $9.72 but cost-per-file nearly doubled** (from $1.08 to $1.94). The agent spends similar total tokens but fewer files pass validation, making each committed file more expensive.

Cost is still well under ceiling (14.3%). The 15% investigation threshold was not triggered.

---

## Key Findings for Run-7

1. **Registry expansion is the highest-ROI fix.** SCH-001 blocks every partial file. Adding ~8 span definitions would immediately unblock journal-manager.js and significantly help 5 other files.

2. **COV-003 boundary expansion is second priority.** Three catch patterns not covered by DEEP-1: per-item-collection, swallow-and-continue, try/finally.

3. **PR summary must reflect post-validation state.** Run-6's summary was generated pre-validation and severely misled evaluation.

4. **Push authentication needs a fundamentally different approach.** 4 consecutive failures with HTTPS. Switch to SSH or implement `--push-command` override.

5. **Score projections must account for dominant-blocker peeling.** Every run's top fix reveals the next blocker. Discount recovery predictions by at least 50%.

6. **The coverage decline is structural, not incidental.** As validation becomes stricter, fewer files can pass. The registry must grow to match what the agent can generate.
