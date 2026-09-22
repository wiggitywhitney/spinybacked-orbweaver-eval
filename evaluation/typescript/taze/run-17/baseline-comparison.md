<!-- ABOUTME: Baseline comparison for taze run-17 vs run-16, with Q×F and IS trajectory. -->
# Baseline Comparison — taze Run-17 vs Run-16

**Primary comparison**: run-17 vs run-16 (most recent completed run).
**Run-13 and Run-15 included as TypeScript trajectory context.**

---

## Run vs Run Metrics

| Metric | Run-13 (TS baseline) | Run-15 | Run-16 | Run-17 | Run-17 Δ vs Run-16 |
|--------|----------------------|--------|--------|--------|---------------------|
| Date | 2026-05-03 | 2026-06-15 | 2026-06-21 | 2026-09-21 | — |
| spiny-orb SHA | d13f1a1 | 69c76e1 | 8a08f5b | **4e7c2f0** | — |
| Files processed | 33 | 33 | 33 | 33 | 0 |
| Files committed | 14 | 11 | 13 | **13** | 0 |
| Files failed | 0 | 1 (yarnWorkspaces.ts) | 0 | **0** | 0 |
| Correct pre-scan skips | 19 | 20 | 20 | **20** | 0 |
| Oscillations (false SUCCESS) | 0 | 1 (resolves.ts) | 0 | **0** | 0 |
| Total spans committed | 30 | 27 | 35 | **35** | 0 |
| New schema attributes | 3 | 1 | 4 | **5** | **+1** |
| Cost | $4.93 | $4.82 | $4.36 | **$4.03** | **−$0.33** |
| Duration | 54m 45s | — | 42m 57s | **41m 44.7s** | **−1m 12s** |

---

## Rubric Scores

| Dimension | Run-13 | Run-15 | Run-16 | Run-17 | Run-17 Δ |
|-----------|--------|--------|--------|--------|----------|
| NDS (4 rules) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 0 |
| COV (6 rules) | 6/6 (100%) | 6/6 (100%) | 5/6 (83%) | 5/6 (83%) | 0 |
| RST (5 rules) | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | 0 |
| API (3 rules) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 0 |
| SCH (4 rules) | 3/4 (75%) | 3/4 (75%) | 3/4 (75%) | 2/4 (50%) | **−1** |
| CDQ (7 rules) | 6/7 (86%) | 6/7 (86%) | 6/7 (86%) | 6/7 (86%) | 0 |
| **Overall quality** | **27/29 (93%)** | **27/29 (93%)** | **26/29 (90%)** | **25/29 (86%)** | **−1** |
| **Gates** | 2/2 | 2/2 | 2/2 | 2/2 | 0 |
| **Q×F** | 13.0 | 10.2 | 11.7 | **11.2** | **−0.5** |

Run-17's overall quality regression is entirely attributable to SCH (3/4 → 2/4). CDQ held flat at 6/7, but the composition changed underneath: CDQ-006 (the targeted carry-forward fix) genuinely resolved, while a new CDQ-007 regression (unsanitized absolute filesystem paths, 6 of 13 files) took its place — see "CDQ-007: New Regression" below.

---

## IS Score Trajectory

| Run | IS Score | Key changes |
|-----|----------|-------------|
| Run-13 | 60/100 | No IS baseline yet (pre-RES-001) |
| Run-15 | 80/100 | RES-001 (service.instance.id) achieved +20 |
| Run-16 | 88.9/100 | SPA-002 new failure (orphan span); all other rules stable |
| Run-17 | **77.8/100** | SPA-002 orphan span **confirmed consistent** across two runs (real spiny-orb fix candidate); new SPA-005 failure (24 spans <5ms, limit 20) |

**IS Score regression**: 88.9 → 77.8 (**−11.1**). Two failing rules now instead of one: SPA-002 recurred with the same async-boundary-context-loss shape in `resolves.ts` (different span IDs, same root cause), and SPA-005 is a new failure investigated against source (`resolves.ts:264` early-return for local/URL/no-update/filtered/ignore-mode deps) — not a defect, a structural mismatch between a flat short-span threshold and this run's natural span volume, the same shape as the existing SPA-001 CLI exemption.

---

## Q×F Trajectory

| Run | Quality | Files | Q×F |
|-----|---------|-------|-----|
| Run-13 | 27/29 (93%) | 14 | 13.0 |
| Run-15 | 27/29 (93%) | 11 | 10.2 |
| Run-16 | 26/29 (90%) | 13 | 11.7 |
| Run-17 | 25/29 (86%) | 13 | **11.2** |

**Q×F declined** from 11.7 to 11.2 (−0.5). File count held flat at 13 (no coverage-breadth change), so the entire movement is attributable to the quality-score regression (90% → 86%).

**Gap to run-13 peak (Q×F 13.0)**: 1.8 points, the widest gap since tracking began. The primary driver is now quality score (86% vs 93%) rather than file count — file count is at parity with run-13's near-peak (13 vs 14). Closing this gap requires resolving SCH-003 (broadened, see below) and the new CDQ-007 regression, not recovering additional files.

---

## SCH-003 Trend (count-cast-to-string pattern)

The run-16 carry-forward goal (TAZE-RUN3-3/4) targeted exactly this pattern in two files. It is not resolved — it broadened.

| File | Run-16 | Run-17 |
|------|--------|--------|
| checkGlobal.ts | FAIL (`String(deps.length)` vs schema `type: int`) | **FAIL** — disguised recurrence: attribute renamed (`taze.check.packages_loaded`), same `String(deps.length)` cast, but schema retyped to `string` so code and schema now literally agree |
| bunWorkspaces.ts | FAIL (`String(catalogs.length)`) | **RESOLVED** in this file |
| check/index.ts | PASS | **FAIL (new)** — `String(resolvePkgs.length)` for new attribute `taze.check.packages_loaded` |
| pnpmWorkspaces.ts | PASS | **FAIL (new)** — `String(catalogs.length)` vs run-16's clean raw-int equivalent |
| packageYaml.ts | PASS | **FAIL (new, disguised)** — `String(deps.length)` with schema retyped to `string` |
| yarnWorkspaces.ts | PASS | **FAIL (new, literal)** — `String(catalogs.length)` against `int`-typed `taze.io.catalogs_count`; also introduces a new SCH-004 near-synonym (`taze.io.file_path` duplicating `taze.write.file_path`) |
| **Files affected** | **2** | **5** |

The exemption-scope pre-commitment's semantic reading — a `.length`-derived value is inherently numeric regardless of what the schema declares — is what surfaces the disguised recurrences in `checkGlobal.ts` and `packageYaml.ts`. Under the rubric's literal mechanism alone, both would score PASS. This pattern is now spreading rather than converging: fixing it in one file (spiny-orb #1012) did not generalize the underlying judgment across the prompt to other files performing the same `.length`-to-attribute operation.

---

## CDQ-007: New Regression (unsanitized filesystem paths)

Not one of run-17's tracked carry-forward goals — the single largest new finding by file count.

| File | Run-16 | Run-17 |
|------|--------|--------|
| bunWorkspaces.ts | relative/sanitized | **FAIL** — unsanitized absolute path |
| packageJson.ts (write side) | relative/sanitized | **FAIL** — unsanitized absolute path (load side still passes, basename-sanitized) |
| packageYaml.ts | relative/sanitized | **FAIL** |
| packages.ts | relative/sanitized | **FAIL** — 3 of 4 call sites |
| pnpmWorkspaces.ts | relative/sanitized | **FAIL** |
| yarnWorkspaces.ts | relative/sanitized | **FAIL** |
| resolves.ts | basename-sanitized | PASS (unchanged) |
| **Files affected** | **0 (advisory-only in 1 file)** | **6 of 13** |

Confirmed by reading the instrument-branch source directly: `pathe`'s `resolve()` output and `pkg.filepath` are set with no structural guarantee the value is ever relative. This finding required a second reconciliation pass — the first pass scored all six PASS using CDQ-007's literal rubric mechanism (object spreads, `JSON.stringify`, unbounded arrays, PII-pattern keys), which doesn't cover raw filesystem paths at all. The PRD's own required "structural guarantee" test (a raw-path-shaped attribute FAILs unless the source structurally guarantees the value can never be absolute) is what catches it; CodeRabbit CLI review flagged the inconsistency between the two verdicts before the correction was made.

---

## CDQ-006 Trend (resolved)

| File | Run-13 | Run-15 | Run-16 | Run-17 |
|------|--------|--------|--------|--------|
| checkGlobal.ts | 2 violations | 2 violations | 0 (guarded) | 0 |
| interactive.ts | 0 | 1 (new) | 0 (fixed) | 0 |
| pnpmWorkspaces.ts | 0 | 1 | 0 (fixed) | 0 |
| bunWorkspaces.ts | 0 | 1 | 3 (regression) | **0 (resolved)** |
| **Total** | ~2 | 5 | 3 | **0** |

CDQ-006 is fully resolved as of run-17 (spiny-orb #1012) — the last 3 violations in `bunWorkspaces.ts`'s `loadBunWorkspace` are now either trivial-and-exempt or correctly guarded with `isRecording()`.

---

## Run-18 Primary Goals

Based on run-17 results, run-18 should focus on:

1. **SCH-003 count-cast pattern** — now spanning 5 files (up from 2 in run-16), including 2 disguised recurrences where the schema was retyped to `string` to match the cast instead of the cast being removed. This is the dimension driving the entire quality regression. Verify whether the pattern continues to spread or begins converging.
2. **CDQ-007 unsanitized filesystem paths** — new regression in 6 of 13 files, the largest new finding by file count. Not previously tracked; needs its own carry-forward line starting run-18.
3. **IS SPA-002 orphan span** — confirmed consistent across two consecutive runs (run-16, run-17), same async-boundary context-loss shape in `resolves.ts`. A real spiny-orb fix candidate, not run-specific noise.
4. **COV-005 regressions in resolves.ts and api/check.ts** — `taze.package.update_available` dropped from `resolveDependency`; `taze.package.file_path` dropped and a change-count key reverted in `CheckSingleProject`. Both are new, not carry-forward, but worth watching for a repeat pattern (attributes present in one run silently dropping in the next without an intervening fix).
5. **SCH-004 near-synonym** — `taze.io.file_path` vs `taze.write.file_path` in `yarnWorkspaces.ts`. New this run; run-16 passed SCH-004 cleanly at this exact call site.
6. **resolves.ts schema-naming instability** — span names and one attribute continue to churn run-over-run even as compilation stability (NDS-001) has now held for one full run after run-15's oscillation. Watch item, not yet a scored rubric failure.
