# Baseline Comparison — Run-17 vs Runs 2-16

---

## Cross-Run Quality Trend

| Run | Quality | Gates | Files | Spans | Cost | Push/PR | IS | Q×F |
|-----|---------|-------|-------|-------|------|---------|-----|-----|
| 2 | 20/27 (74%) | 3/4 | 10 | ~15 | — | NO | — | 7.4 |
| 3 | 19/26 (73%) | 4/4 | 11 | ~15 | — | NO | — | 8.0 |
| 4 | 15/26 (58%) | 4/4 | 16 | ~48 | $5.84 | NO | — | 9.2 |
| 5 | 23/25 (92%) | 5/5 | 9 | 17 | $9.72 | NO | — | 8.3 |
| 6 | 21/25 (84%) | 5/5 | 5 | 16 | $11.02 | NO | — | 4.2 |
| 7 | 22/25 (88%) | 5/5 | 13 | 28 | $3.22 | NO | — | 11.4 |
| 8 | 23/25 (92%) | 5/5 | 12 | 28 | $4.00 | NO | — | 11.0 |
| 9 | **25/25 (100%)** | 5/5 | 12 | 26 | $3.97 | NO | — | 12.0 |
| 10 | 23/25 (92%) | 5/5 | 12 | 28 | $4.36 | NO | — | 11.0 |
| 11 | **25/25 (100%)** | 5/5 | 13 | 39 | $4.25 | YES (#60) | — | **13.0** |
| 12 | 23/25 (92%) | 5/5 | 12+1p | 31 | $5.19 | YES (#61) | — | 11.0 |
| 13 | **25/25 (100%)** | 5/5 | 7 | ~14 | — | YES (#62) | — | 7.0 |
| 14 | 22/25 (88%) | 5/5 | 12 | ~28 | $5.59 | YES (#65) | — | 10.6 |
| 15 | 24/25 (96%) | 5/5 | 14 | 40 | $6.44 | YES (#66) | 70/100 | **13.4** |
| 16 | 22/25 (88%) | 5/5 | 10+3p | ~38 | $12.29 | YES (#68) | 80/100 | 8.8 |
| **17** | **22/25 (88%)** | **4/5** | **10+1p** | **~38** | **$10.43** | **YES (#69)** | **90/100** | **8.8** |

Q×F = (quality fraction) × committed files. Run-17: (22/25) × 10 = 8.8.
IS scoring began run-15. Runs 2-14 predate IS integration.

---

## Dimension Trends (Runs 13-17)

| Dimension | Run-13 | Run-14 | Run-15 | Run-16 | Run-17 |
|-----------|--------|--------|--------|--------|--------|
| NDS | 2/2 | 2/2 | 2/2 | **1/2** | **2/2** ↑ |
| COV | 5/5 | 3/5 | 4/5 | 3/5 | 3/5 |
| RST | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 |
| API | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| SCH | 4/4 | 4/4 | 4/4 | 4/4 | **3/4** ↓ |
| CDQ | 7/7 | 7/7 | 7/7 | 7/7 | 7/7 |
| **Total** | **25/25** | **22/25** | **24/25** | **22/25** | **22/25** |
| **Gates** | **5/5** | **5/5** | **5/5** | **5/5** | **4/5** ↓ |

**NDS recovered (+1)**: RUN16-3 fix confirmed — NDS-005 passes for first time since run-14.
**SCH regressed (-1)**: summary-graph SCH-002 failure (wrong attribute domain) — likely present since run-12 but first detected by per-agent evaluation.
**Gate regression**: NDS-003 gate failed for the first time in the series. 4 files couldn't commit due to line-preservation violations; 3 of 4 are spiny-orb reconciler gaps, 1 is a genuine content corruption (journal-graph).

---

## IS Score Trend (Runs 15-17)

| Run | IS Score | Delta | Failure |
|-----|----------|-------|---------|
| 15 | 70/100 | baseline | SPA-001 (>10 INTERNAL spans), SPA-002 (orphan span) |
| 16 | 80/100 | +10pp | SPA-001 only (SPA-002 resolved) |
| **17** | **90/100** | **+10pp** | SPA-001 only (structural calibration mismatch — 12 INTERNAL spans vs limit 10) |

**Three consecutive +10pp gains**. Run-15 baseline improvement came from OTel bootstrap setup. Run-16 improvement came from SPA-002 resolution. Run-17 improvement came from RES-001 (service.instance.id added to bootstrap). SPA-001 remains the only failing rule and is a known structural mismatch — commit-story-v2 produces >10 INTERNAL spans per trace by design. The score ceiling with the current instrumentation is 90/100.

---

## Key Changes in Run-17

### 1. Quality Unchanged (22/25, same as run-16)

The NDS improvement (NDS-005 fixed, +50pp in dimension) was offset by the SCH regression (summary-graph SCH-002, first detected). Net effect: same total. However, two previously undetected gaps were surfaced for the first time by the per-agent evaluation approach:

- **git-collector COV-001**: `getCommitData` (exported async, primary orchestrator) has no span. Only `getPreviousCommitTime` was instrumented across all runs. Existed since run-9 at minimum; not detected until run-17's per-agent evaluation.
- **summary-graph SCH-002**: `messages_count` and `quotes_count` attributes set to journal entry counts (wrong domain). Likely present since run-12; not detected until run-17.

Both findings are carried forward as new failure classifications and will be tracked in run-18.

### 2. Gate Regression (4/5, first NDS-003 gate failure)

Runs 5-16 all passed 5/5 gates. Run-17 breaks the streak with an NDS-003 gate failure driven by 4 files that couldn't commit:
- **journal-graph.js**: 49 NDS-003 violations — 1 genuine content corruption (dropped `}` from template literal) + ~48 reconciler-gap false positives from `startActiveSpan` re-indentation
- **context-capture-tool.js, reflection-tool.js**: NDS-003 oscillation — pure reconciler gap; agent code correct
- **index.js**: 2 NDS-003 violations — reconciler off-by-one after `startActiveSpan` added to `main()`

The reconciler gap is a spiny-orb issue, not agent quality. The 1 genuine content corruption in journal-graph.js is attributed to the 65% thinking budget cap reducing character-level verification capacity for complex files.

### 3. RUN16-1 Fix: Partial Resolution

The primary run-17 goal — verifying the adaptive→enabled thinking budget fix — produced a mixed outcome:
- **Token exhaustion resolved**: context-capture-tool.js, reflection-tool.js, and summary-manager.js's generate functions now produce structured output. No more null parsed_output.
- **NDS-003 revealed underneath**: The files that were token-exhausted in run-16 now fail on NDS-003 reconciler gaps instead. The fix unmasked the next layer of the problem.
- **Net result**: Files still don't commit. The failure mode changed; the outcome did not.

### 4. RUN16-3 Fix: Confirmed

commit-analyzer.js returned original unchanged. NDS-005 passes for the first time since run-14. Full credit to the fix.

### 5. Cost Improvement ($12.29 → $10.43, -$1.86)

Cost decreased but remains above the historical target (~$8-9). The improvement is real — no more budget-exhaustion runs burning max tokens on failed output. The remaining elevation comes from failed files (journal-graph + index.js) consuming tokens on attempts that produce nothing committable.

---

## Score Projection Validation

**Run-16 actionable fix output projected for run-17:**

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| Conservative (RUN16-1 + RUN16-3 fixes land, technicalNode oscillates) | 24/25 (96%), 13-14 files, ~$8-9 | 22/25 (88%), 10+1p files, $10.43 | **Not met** |
| Target (P1 + P2 fixes all land) | 25/25 (100%), 14-15 files, ~$6-7 | 22/25 (88%), 10+1p, $10.43 | **Not met** |
| Stretch (all fixes + cost improvement) | 25/25, 14-15 files, ≤$6 | 22/25, 10+1p, $10.43 | **Not met** |

The conservative projection assumed the NDS-003 reconciler gap didn't exist. It does. context-capture-tool.js, reflection-tool.js, and summary-manager.js's generate functions hit NDS-003 oscillation after their token exhaustion was resolved. The projection was blind to the next layer of failure hidden under the budget exhaustion.

---

## Failure Classification Across All Runs

| Failure | First Seen | Fixed In | Runs Active | Status |
|---------|-----------|----------|-------------|--------|
| Push auth | Run-3 | Run-11 | 8 runs | ✅ Fixed |
| SCH-003 (count types) | Run-7 | Run-9 | 2 runs | ✅ Fixed |
| CDQ-007 (optional chaining) | Run-10 | Run-11 | 1 run | ✅ Fixed |
| SCH-003 (boolean types) | Run-10 | Run-11 | 1 run | ✅ Fixed |
| NDS-003 truthy-check gap | Run-11 | Partial | 7 runs | 🔄 Partially resolved — `!=null` patterns fixed, other forms remain |
| journal-graph.js partial (technicalNode) | Run-14 | — | **4 runs** | ❌ Open — now escalated to full failure in run-17 |
| COV-004 summary-manager.js | Run-12 | Run-15 | 3 runs | ✅ Fixed (run-15; regressed in run-16 due to token exhaustion) |
| NDS-005 (0-span fallback try/catch strip) | Run-16 | **Run-17** | 2 runs | ✅ Fixed (RUN16-3) |
| Token budget exhaustion (null parsed_output) | Run-16 | Run-17 | 2 runs | 🔄 Partially resolved — structured output now produced; NDS-003 gap revealed |
| NDS-003 reconciler gap (startActiveSpan in server.tool) | **Run-17** | — | 1 run | ❌ New — spiny-orb issue |
| NDS-003 content corruption (journal-graph.js) | **Run-17** | — | 1 run | ❌ New — thinking budget cap hypothesis |
| git-collector COV-001 (getCommitData missing) | **Run-17*** | — | 1 run | ❌ First detected — likely present since run-9 |
| summary-graph SCH-002 (wrong attribute domain) | **Run-17*** | — | 1 run | ❌ First detected — likely present since run-12 |
| IS SPA-001 (>10 INTERNAL spans) | Run-15 | Never | 3 runs | ⚠️ Structural — not fixable at agent level |

*First detected in run-17 via per-agent evaluation; likely present in prior runs undetected.

---

## Q×F Trend

| Run | Score | Files | Q×F | Note |
|-----|-------|-------|-----|------|
| Run-11 | 25/25 | 13 | 13.0 | Record at time |
| Run-12 | 23/25 | 12 | 11.0 | |
| Run-13 | 25/25 | 7 | 7.0 | Checkpoint rollbacks cut file count |
| Run-14 | 22/25 | 12 | 10.6 | |
| **Run-15** | **24/25** | **14** | **13.4** | **All-time record** |
| Run-16 | 22/25 | 10 | 8.8 | Cost surge; token exhaustion |
| Run-17 | 22/25 | 10 | 8.8 | Flat; NDS offset by SCH |

Q×F has been flat at 8.8 for two consecutive runs. The path to record recovery requires both: (a) fixing the NDS-003 reconciler gap to recover the 4 failed files, and (b) maintaining the current quality level. If the 4 files commit and the current 22/25 quality holds: Q×F = (22/25) × 14 = 12.3. If quality recovers to 24/25: Q×F = (24/25) × 14 = 13.4 (matching run-15 record). If all fixes land at 25/25 with 14-15 files: Q×F ≥ 14.0 (new record).

---

## Cost Trend (Runs 9-17)

| Run | Cost | Files | $/File |
|-----|------|-------|--------|
| Run-9 | $3.97 | 12 | $0.33 |
| Run-10 | $4.36 | 12 | $0.36 |
| Run-11 | $4.25 | 13 | $0.33 |
| Run-12 | $5.19 | 12 | $0.43 |
| Run-14 | $5.59 | 12 | $0.47 |
| Run-15 | $6.44 | 14 | $0.46 |
| Run-16 | $12.29 | 10 | $1.23 |
| Run-17 | $10.43 | 10 | $1.04 |

Cost per committed file has more than doubled since runs 9-11. The absolute cost remains elevated because 4 failed files waste ~$2 on attempts that produce nothing. With the NDS-003 reconciler gap fixed in run-18, the expected cost reduction is ~$1.50 if those files commit on fewer attempts.
</content>