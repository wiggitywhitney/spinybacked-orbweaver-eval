<!-- ABOUTME: Baseline comparison for taze run-16 vs run-15, with Q×F and IS trajectory. -->
# Baseline Comparison — taze Run-16 vs Run-15

**Primary comparison**: run-16 vs run-15 (most recent completed run).
**Run-13 included as TypeScript baseline for multi-run trajectory.**

---

## Run vs Run Metrics

| Metric | Run-13 (TS baseline) | Run-15 | Run-16 | Run-16 Δ vs Run-15 |
|--------|----------------------|--------|--------|---------------------|
| Date | 2026-05-03 | 2026-06-15 | 2026-06-21 | — |
| spiny-orb SHA | d13f1a1 | 69c76e1 | 8a08f5b | — |
| Files processed | 33 | 33 | 33 | 0 |
| Files committed | 14 | 11 | **13** | **+2** |
| Files failed | 0 | 1 (yarnWorkspaces.ts) | **0** | **−1** |
| Correct pre-scan skips | 19 | 20 | **20** | 0 |
| Oscillations (false SUCCESS) | 0 | 1 (resolves.ts) | **0** | **−1** |
| Total spans committed | 30 | 27 | **35** | **+8** |
| New schema attributes | 3 | 1 | **4** | **+3** |
| Cost | $4.93 | $4.82 | **$4.36** | **−$0.46** |
| Duration | 54m 45s | — | **42m 57s** | — |

---

## Rubric Scores

| Dimension | Run-13 | Run-15 | Run-16 | Run-16 Δ |
|-----------|--------|--------|--------|----------|
| NDS (4 rules) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 0 |
| COV (6 rules) | 6/6 (100%) | 6/6 (100%) | 5/6 (83%) | **−1** |
| RST (5 rules) | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | 0 |
| API (3 rules) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 0 |
| SCH (4 rules) | 3/4 (75%) | 3/4 (75%) | 3/4 (75%) | 0 |
| CDQ (7 rules) | 6/7 (86%) | 6/7 (86%) | 6/7 (86%) | 0 |
| **Overall quality** | **27/29 (93%)** | **27/29 (93%)** | **26/29 (90%)** | **−1** |
| **Gates** | 2/2 | 2/2 | 2/2 | 0 |
| **Q×F** | 13.0 | 10.2 | **11.7** | **+1.5** |

---

## IS Score Trajectory

| Run | IS Score | Key changes |
|-----|----------|-------------|
| Run-13 | 60/100 | No IS baseline yet (pre-RES-001) |
| Run-15 | 80/100 | RES-001 (service.instance.id) achieved +20 |
| Run-16 | **88.9/100** | SPA-002 new failure (orphan span); all other rules stable |

**IS Score improvement**: 80 → 88.9 (+8.9). Despite SPA-002 orphan span failure, overall IS improved due to higher span count and coverage (resolves.ts recovery contributes spans that confirm correct attribute capture).

**SPA-002 note**: One orphan span detected (`span 0fa594f2` with parent `3b6a551d` not found in trace). This is likely from `resolves.ts` recovery — the new spans create parent-child relationships at runtime where the parent span context may be lost in certain code paths. Worth flagging for #954 investigation.

---

## Coverage Recovery Analysis

| File | Run-13 | Run-15 | Run-16 | Notes |
|------|--------|--------|--------|-------|
| resolves.ts | 6 spans | 0 spans (oscillation) | **6 spans** | Full recovery; #954/#958 still open |
| yarnWorkspaces.ts | 2 spans | 0 spans (NDS-001 fail) | **2 spans** | Recovery; agent fixed regex syntax error |
| checkGlobal.ts | 4 spans | 4 spans | 4 spans | Stable; CDQ-006 improved (reduce/filter guarded) |
| interactive.ts | 1 span | 1 span | 1 span | Stable; CDQ-006 improved (flatDeps guard added) |
| config.ts | 0 spans | 0 spans | **1 span** | Recovery vs run-15 (confirmed by trace artifact) |
| pnpmWorkspaces.ts | 2 spans | 2 spans | 2 spans | Stable; CDQ-006 improved (Object.keys guard added) |
| bunWorkspaces.ts | 3 spans | 3 spans | 3 spans | Stable; CDQ-006 regressed (+2 violations) |
| packument.ts | 2 spans | 2 spans | 2 spans | Stable; COV-005 regressed (latest_version dropped) |

---

## Q×F Trajectory

| Run | Quality | Files | Q×F |
|-----|---------|-------|-----|
| Run-13 | 27/29 (93%) | 14 | 13.0 |
| Run-15 | 27/29 (93%) | 11 | 10.2 |
| Run-16 | 26/29 (90%) | 13 | **11.7** |

**Q×F improved** from 10.2 to 11.7 (+1.5) despite the quality score regression from 93% to 90%. The file count recovery (+2 files: resolves.ts + yarnWorkspaces.ts) more than offsets the COV-005 regression.

**Gap to run-13 peak (Q×F 13.0)**: 1.3 points. The primary driver of the gap is quality score (90% vs 93%) and file count (13 vs 14 in run-13). Run-13 had 14 committed files — run-16 has 13. One additional file would need to be recovered, and COV-005 and SCH-003 resolved, to approach or exceed run-13's Q×F.

---

## CDQ-006 Trend

| File | Run-13 | Run-15 | Run-16 |
|------|--------|--------|--------|
| checkGlobal.ts | 2 violations | 2 violations | 0 violations (guarded) |
| interactive.ts | 0 | 1 violation (new) | 0 (fixed) |
| pnpmWorkspaces.ts | 0 | 1 violation | 0 (fixed) |
| bunWorkspaces.ts | 0 | 1 violation | **3 violations (regression)** |
| **Total** | ~2 | 5 | **3** |

CDQ-006 total violations decreased from 5 to 3, but concentrated in bunWorkspaces.ts. The isRecording guard pattern is improving across most files but is regressing specifically in bunWorkspaces.ts loadBunWorkspace (where 3 consecutive post-await setAttribute calls lack guards).

---

## Run-17 Primary Goals

Based on run-16 results, run-17 should focus on:

1. **COV-005 packument.ts** — `taze.package.latest_version` attribute dropped; both response objects have the data available. Verify whether run-17 recovers this attribute.
2. **SCH-003 String() cast pattern** — `checkGlobal.ts` and `bunWorkspaces.ts` both use `String()` cast for int-typed attributes. Verify whether the agent applies `String()` casts consistently or inconsistently.
3. **CDQ-006 bunWorkspaces.ts** — 3 post-await setAttribute calls without isRecording guard. Verify whether loadBunWorkspace CDQ-006 is resolved.
4. **resolves.ts stability** — verify oscillation does not recur (stochastic behavior; may re-emerge without a #954 fix).
5. **IS SPA-002** — orphan span introduced in run-16; verify whether it persists or was a one-off.
