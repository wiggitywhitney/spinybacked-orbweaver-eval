# Baseline Comparison — taze Run-15 vs Run-13

**Run-15 is the first full re-run after the run-14 abort. Comparison is against run-13 (TypeScript baseline).**

---

## Run vs Run Metrics

| Metric | Run-13 (TypeScript baseline) | Run-15 | Δ |
|--------|------------------------------|--------|---|
| Date | 2026-05-03 | 2026-06-15 | — |
| spiny-orb SHA | d13f1a1 | 69c76e1 | — |
| Files processed | 33 | 33 | 0 |
| Files committed | 14 | **11** | −3 |
| Files failed | 0 | **1** (yarnWorkspaces.ts) | +1 |
| Correct pre-scan skips | 19 | **20** | +1 |
| Correct 0-span (oscillation) | 0 | **1** (resolves.ts — coverage regression) | +1 |
| Total spans committed | 30 | **27** | −3 |
| New schema attributes | 3 | **1** | −2 |
| Cost | $4.93 | **$4.82** | −$0.11 |
| Cost per committed file | $0.35 | **$0.44** | +$0.09 |
| Input tokens | 62.0K | **136.0K** | +74.0K |
| Output tokens | 237.5K | **185.5K** | −52.0K |
| Cache read tokens | — | **382.0K** | N/A |
| Duration | 54m 45s | — | — |
| Failures | 0 | **1** | +1 |
| Rollbacks | 0 | 0 | 0 |

---

## Rubric Scores

| Dimension | Run-13 | Run-15 | Δ |
|-----------|--------|--------|---|
| NDS (4 rules) | 4/4 (100%) | 4/4 (100%) | 0 |
| COV (6 rules) | 6/6 (100%) | 6/6 (100%) | 0 |
| RST (5 rules) | 5/5 (100%) | 5/5 (100%) | 0 |
| API (3 rules) | 3/3 (100%) | 3/3 (100%) | 0 |
| SCH (4 rules) | 3/4 (75%) | 3/4 (75%) | 0 |
| CDQ (7 rules) | 6/7 (86%) | 6/7 (86%) | 0 |
| **Total quality** | **27/29 (93%)** | **27/29 (93%)** | **0** |
| Gates | 2/2 (100%) | 2/2 (100%) | 0 |
| Q×F | 13.0 | **10.2** | −2.8 |
| IS score | 60/100 | **80/100** | **+20** |

---

## Primary Goal Assessment

| Goal | Target | Run-15 Result | Status |
|------|--------|---------------|--------|
| CDQ-006 violations to 0 | 0 instances | 5 instances across 4 files | **NOT ACHIEVED** |
| SCH-003 resolved | 0 instances | 1 new instance (bunWorkspaces.ts) | **PARTIALLY ACHIEVED** — run-13 violations fixed; new violation introduced |
| IS RES-001 passes | IS > 60/100 | 80/100 | **ACHIEVED** |

---

## Failure Distribution

| Rule | Run-13 | Run-15 | Change |
|------|--------|--------|--------|
| CDQ-006 violations | 8 instances, 5 files | 5 instances, 4 files | −3 instances |
| SCH-003 violations | 3 instances, 2 files | 1 instance, 1 file | −2 instances |

CDQ-006 reduced from 8 to 5 instances (38% reduction). The #728/#933 isRecording guard fix was applied to index.ts (−2 instances). Carry-forwards: checkGlobal.ts (×2), bunWorkspaces.ts (×1). New regressions: interactive.ts (×1 new), pnpmWorkspaces.ts (×1 regression — was the reference PASS in run-13).

SCH-003 reduced from 3 to 1 instance (67% reduction). Run-13's three mismatches all resolved (taze.config.sources_found: int ✓, taze.cache.hit and taze.cache.changed: boolean ✓ via schema fix + new users in packageJson/packageYaml). New violation introduced: `taze.io.catalogs_found` auto-generated as string despite storing a count.

---

## Coverage Change Analysis

### Files Added in Run-15 vs Run-13

| File | Run-13 | Run-15 | Change |
|------|--------|--------|--------|
| src/io/bunWorkspaces.ts | 2 spans | 3 spans | +1 span (writeBunJSON added) |
| src/api/check.ts | 1 span | 2 spans | +1 span (CheckSingleProject added) |
| src/io/packages.ts | 4 spans | 5 spans | +1 span (readJSON added, advisory) |
| src/commands/check/checkGlobal.ts | 1 span | 4 spans | +3 spans (exec helpers added) |
| src/io/packageJson.ts | 2 spans | 2 spans | Same count, new names |
| src/io/packageYaml.ts | 4 spans | 4 spans | Same count, new names |
| src/io/packument.ts | 2 spans | 2 spans | Same count, new names |
| src/commands/check/index.ts | 1 span | 1 span | Same count, new name |
| src/commands/check/interactive.ts | 1 span | 1 span | Same count, same name |
| src/config.ts | 1 span | 1 span | Same count, same name |
| src/io/pnpmWorkspaces.ts | 2 spans | 2 spans | Same count, new names |

### Files Lost in Run-15 vs Run-13

| File | Run-13 Spans | Run-15 Result | Impact |
|------|-------------|---------------|--------|
| src/io/resolves.ts | 6 spans | 0 spans (oscillation) | Major coverage loss — loadCache, dumpCache, getPackageData, resolveDependency, resolveDependencies, resolvePackage not instrumented |
| src/io/yarnWorkspaces.ts | 2 spans (CDQ-006 FAIL) | FAILED (NDS-001 regex error) | No committed change; CDQ-006 candidate eliminated |
| src/cli.ts | 2 spans (incorrect — anonymous callbacks) | 0 spans (correct pre-scan) | **Improvement**: run-13 spans were incorrect (anonymous inline callbacks, not exported functions); run-15 correctly skips |

Net span change: 27 committed spans (run-15) vs 30 (run-13) = −3. The reduction is primarily from resolves.ts oscillation (−6 spans) offset by additions in checkGlobal.ts (+3), bunWorkspaces.ts (+1), api/check.ts (+1), packages.ts (+1). cli.ts correction accounts for the naming discrepancy (run-13's 2 spans were not correctly attributed).

---

## Span Naming Discontinuity

Run-15 introduces a global span naming convention change:

| Domain | Run-13 convention | Run-15 convention |
|--------|-------------------|-------------------|
| Bun I/O | `taze.bun.*` | `taze.io.*` |
| Package JSON | `taze.package_json.*` | `taze.io.*` |
| Package YAML | `taze.package_yaml.*` | `taze.io.*` |
| PNPM workspace | `taze.pnpm_workspace.*` | `taze.io.*` |
| NPM packument | `taze.fetch.npm_*` | `taze.fetch.*` (shortened) |
| Check commands | `taze.check.execute` / `taze.check.run` | `taze.check.run` / `taze.check.packages` |

Run-15 schema contains **0 run-13 span IDs**. All 27 run-15 span IDs are new. The naming consolidation under `taze.io.*` is a coherence improvement, but the backward incompatibility means any existing consumer (dashboards, monitors, alerts) relying on run-13 span names would break. This is expected for eval branch instrumentation (each run starts from scratch from main).

---

## IS Score Analysis

| Metric | Run-13 | Run-15 | Δ |
|--------|--------|--------|---|
| IS score | 60/100 | **80/100** | +20 |
| RES-001 (service.instance.id) | FAIL | **PASS** | Fixed |
| SPA-001 (INTERNAL span count) | FAIL (37 spans > 10 cap) | FAIL (37 spans > 30 threshold) | Still fails; threshold raised |
| Applicable rules | ~8/15 | ~8/15 | 0 |

The +20 IS improvement is entirely from RES-001 passing (service.instance.id added to bootstrap). SPA-001 continues to fail because taze produces 37 INTERNAL spans, which exceeds the revised 30-span threshold for CLI pipelines. This is a structural characteristic of taze's span count — not a defect.

---

## Q×F Trend

| Run | Quality | Files | Q×F |
|-----|---------|-------|-----|
| 13 (baseline) | 27/29 (93%) | 14 | 13.0 |
| 14 | N/A (aborted) | — | — |
| 15 | 27/29 (93%) | 11 | 10.2 |

Q×F decrease (13.0 → 10.2) is entirely from the committed file count drop (14 → 11), driven primarily by the resolves.ts oscillation regression. Quality score is unchanged. If resolves.ts had not oscillated (6 files instrumented at run-13's quality), Q×F would have been approximately 15.1 — a significant improvement given SCH-003 reduction and CDQ-006 partial fix.

---

## Key Observations for Run-16

1. **resolves.ts oscillation is the highest-impact blocker** — 6 functions lost = 3 committed file count reduction = −2.8 Q×F. Root cause unknown (NDS-001 error not captured with per-function context). Priority: diagnose the tsc error that triggers oscillation.

2. **CDQ-006 guard inconsistency** — The fix pattern is demonstrated in index.ts and was the reference in run-13's pnpmWorkspaces.ts, but it is not consistently applied. 5 instances remain across 4 files. The agent knows the pattern but doesn't apply it systematically.

3. **SCH-003 auto-generation pattern** — Count attributes are auto-generated with `type: string` rather than the correct `type: int`. This produced 3 violations in run-13 (fixed), and now 1 new violation in run-15. A schema-generation prompt fix that defaults count attributes to `int` would eliminate this recurring issue.

4. **pnpmWorkspaces.ts regression** — The isRecording guard was REMOVED from the exemplary correct case. This suggests the agent doesn't carry forward the guard pattern from the run-13 schema, since the schema is rebuilt from scratch each run.

5. **IS 80/100 is now the taze baseline** — service.instance.id is in the bootstrap. SPA-001 failure (37 INTERNAL spans > 30 threshold) remains structural and would require span reduction to fix.
