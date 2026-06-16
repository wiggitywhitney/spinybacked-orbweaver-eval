# Actionable Fix Output — taze Run-15

Self-contained handoff from taze evaluation run-15 to the spiny-orb team.

**Run-15 result**: 27/29 (93%) quality, 11 committed, 20 correct pre-scan skips, 1 failure (yarnWorkspaces.ts NDS-001 regex), 0 rollbacks, $4.82 cost. PR #10 created. IS score: 80/100.

**Run context**: Second full taze run (run-14 was aborted). Entering goals: CDQ-006 to 0 violations, SCH-003 resolved, IS RES-001 passes. IS RES-001 achieved (+20). CDQ-006 not achieved (5 violations remain). SCH-003 partially improved (3→1 violation) but new violation introduced.

**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze)
**Branch**: `spiny-orb/instrument-1781536294891`
**PR**: https://github.com/wiggitywhitney/taze/pull/10
**IS score**: 80/100

---

## §1. Run-15 Score Summary

| Dimension | Score | Failures |
|-----------|-------|----------|
| NDS | 4/4 (100%) | — |
| COV | 6/6 (100%) | — |
| RST | 5/5 (100%) | — |
| API | 3/3 (100%) | — |
| SCH | 3/4 (75%) | SCH-003: 1 type mismatch (bunWorkspaces.ts: catalogs_found int vs string schema) |
| CDQ | 6/7 (86%) | CDQ-006: 5 isRecording guard violations in 4 files |
| **Total** | **27/29 (93%)** | **2 canonical failures** |
| **Gates** | **2/2 (100%)** | — |
| **Files** | **11 committed / 20 correct skips / 1 failed** | 0 rollbacks |
| **Cost** | **$4.82** | $0.44 per committed file |
| **Push/PR** | **YES (PR #10)** | — |
| **Q×F** | **10.2** | (down from 13.0 due to resolves.ts coverage regression) |
| **IS** | **80/100** | +20 from run-13; RES-001 now passes |

---

## §2. Quality Rule Failures

### CDQ-006: Missing isRecording() Guard on Expensive Attribute Computations

**Files affected**: `checkGlobal.ts` (×2 carry-forward), `interactive.ts` (×1 NEW), `bunWorkspaces.ts` (×1 carry-forward), `pnpmWorkspaces.ts` (×1 REGRESSION)

**Failure**: 5 inline O(n) computations passed directly to `span.setAttribute()` without first checking `span.isRecording()`. When a tracer is configured with head-based sampling, these computations run even when the span will be dropped.

| File | Attribute | Computation | vs Run-13 |
|------|-----------|-------------|-----------|
| checkGlobal.ts | `taze.check.packages_total` | `pkgs.reduce((sum, p) => sum + p.deps.length, 0)` | carry-forward |
| checkGlobal.ts | `taze.check.packages_outdated` | `pkgs.reduce((sum, p) => sum + p.resolved.filter(j => j.update).length, 0)` | carry-forward |
| interactive.ts | `taze.check.packages_total` | `flatDeps().length` where `flatDeps = pkgs.flatMap(pkg => pkg.resolved.filter(dep => dep.update))` | **NEW regression** — run-13 used `pkgs.length` (O(1)); run-15 changed to `flatDeps()` which is O(n) |
| bunWorkspaces.ts | `taze.write.changes_count` | `Object.keys(versions).length` | carry-forward |
| pnpmWorkspaces.ts | `taze.write.changes_count` | `Object.keys(versions).length` | **REGRESSION** — pnpmWorkspaces.ts was the ONLY run-13 file to correctly apply the guard; it was the reference for CDQ-006 compliance. Guard removed in run-15. |

**What worked**: `index.ts` correctly applies the isRecording guard in run-15 (−2 violations from run-13). The fix pattern was applied here:
```typescript
if (span.isRecording()) {
  span.setAttribute('taze.check.packages_total', resolvePkgs.reduce(...))
  span.setAttribute('taze.check.packages_outdated', resolvePkgs.reduce(...filter...))
}
```

**Why the guard was lost in pnpmWorkspaces.ts**: The run-15 schema is rebuilt from scratch (all 27 span IDs are new). The agent has no memory of the run-13 schema or the isRecording guard that was in the run-13 pnpmWorkspaces.ts. The fix in run-13 was applied during that run's own iteration — it does not carry forward because the instrumentation is regenerated from scratch each run.

**Spiny-orb signal**: The CDQ-006 guard is being applied in some contexts but not others within the same run. index.ts and pnpmWorkspaces.ts both had `Object.keys().length` patterns; index.ts got the guard and pnpmWorkspaces.ts did not. This suggests the guard is being applied heuristically rather than systematically.

---

### SCH-003: Type Mismatch in Agent-Extended Schema

**Files affected**: `src/io/bunWorkspaces.ts`

**Failure**: `span.setAttribute('taze.io.catalogs_found', catalogs.length)` passes an int value (`Array.length`). `taze.io.catalogs_found` in `agent-extensions.yaml` declares `type: string`. Type mismatch.

| File | Attribute | Code type | Schema declaration | Correct declaration |
|------|-----------|-----------|-------------------|---------------------|
| src/io/bunWorkspaces.ts | `taze.io.catalogs_found` | int (`catalogs.length`) | string | int |

**Context**: `src/io/pnpmWorkspaces.ts` shares the same attribute and avoids the failure by applying `String(catalogs.length)` — converting the int to match the string schema. This is the opposite of a fix: it forces a coercion to match a wrong schema type rather than correcting the schema type.

**Run-13 SCH-003 fixes confirmed**: All three run-13 mismatches are resolved — `taze.config.sources_found` is now `int`, `taze.cache.changed` is now `boolean` (confirmed via packageJson.ts and packageYaml.ts in run-15). `taze.cache.hit` is not present in run-15 (resolves.ts oscillation), but the schema type was corrected.

**Root cause**: The agent auto-generates count attributes with `type: string` rather than inferring `int` from the `.length` accessor. This is the same pattern that caused the run-13 SCH-003 failures. The schema-generation heuristic for count attributes has not changed.

**Fix**: Update `semconv/agent-extensions.yaml` in the taze fork:
- `taze.io.catalogs_found`: change `type: string` → `type: int`
- Remove `String()` coercion from pnpmWorkspaces.ts (or leave it — int is the correct OTel type for a count)

---

## §3. Prior Run Findings Assessment (Run-13)

| Finding | Run-13 | Run-15 | Status |
|---------|--------|--------|--------|
| TAZE-RUN1-1 (SCH-003: 3 type mismatches) | 3 instances | **1 new instance** | Partially resolved — run-13 mismatches fixed; pattern recurs |
| TAZE-RUN1-2 (CDQ-006: 8 instances) | 8 instances | **5 instances** | Partially resolved — 3 fixed; 2 regressions |
| TAZE-RUN1-3 (Advisory contradiction ~78%) | ~78% | — | Not evaluated this run |
| TAZE-RUN1-4 (Pre-scan LLM tokens) | — | Improved — cli.ts now correct pre-scan | Fixed in run-15 pre-scan |
| TAZE-RUN1-5 (IS RES-001) | FAIL | **PASS** | **RESOLVED** |
| TAZE-RUN1-6 (IS SPA-001: 164 spans) | FAIL | FAIL (37 spans) | Threshold raised (10→30); still fails |
| TAZE-RUN1-7 (IS SPA-002: orphan span) | FAIL | — | Not observed in run-15 trace |
| TAZE-RUN1-8 (IS SPA-005: spans < 5ms) | FAIL | — | Not re-assessed |

---

## §4. New Run-15 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| TAZE-RUN2-1 | CDQ-006: pnpmWorkspaces.ts regression (guard removed from reference implementation) | Low | Code quality — prompt |
| TAZE-RUN2-2 | CDQ-006: interactive.ts new violation (flatDeps.flatMap.filter without guard) | Low | Code quality — prompt |
| TAZE-RUN2-3 | SCH-003: taze.io.catalogs_found auto-generated as string (same pattern as run-13) | Low | Schema generation |
| TAZE-RUN2-4 | resolves.ts oscillation: 6 functions × 2 NDS-001 attempts each (unknown error) | Medium | NDS-001 oscillation — unknown root cause |
| TAZE-RUN2-5 | yarnWorkspaces.ts regex syntax error: `/\./ g` (space in flag) across all 3 attempts | Low | NDS-001 generation error |
| TAZE-RUN2-6 | Span naming backward incompatibility: 0 run-13 span IDs preserved in run-15 | Info | Schema continuity |
| TAZE-RUN2-7 | resolves.ts classified as "correct skip" despite 12 failed oscillation attempts | Medium | Oscillation telemetry |

### TAZE-RUN2-4: resolves.ts Oscillation (Highest-Impact Finding)

resolves.ts had 6 async functions, each assessed twice (12 total attempts), all resulting in 0-span commits via NDS-001 tsc errors. The actual tsc error text is not captured in the log — the NDS-001 failure is logged at the file level without per-function error messages.

**Impact**: The 6 lost functions (loadCache, dumpCache, getPackageData, resolveDependency, resolveDependencies, resolvePackage) represent the largest single coverage loss in the taze eval history. Q×F decreased from 13.0 → 10.2 primarily because of this single file.

**Suspected root cause**: The generated code may have had TypeScript-specific inference issues (complex type narrowing, union types in async callbacks, or conditional return types) that triggered tsc errors the agent couldn't fix. The resolves.ts functions use complex patterns: `const { cache, maxAge, force } = options`, conditional `readFileSync` with `JSON.parse`, and typed discriminated union returns.

**Spiny-orb signal**: The oscillation pattern (same error across two attempts without improvement) suggests the agent is generating the same broken code twice rather than diagnosing and correcting the tsc error. This may indicate a gap in the oscillation-detection heuristic for TypeScript-specific type errors.

**Debug artifact available**: Only `yarnWorkspaces.ts` has a debug dump. resolves.ts debug dump was not captured (the file did not fail — it committed 0 spans successfully from the tool's perspective). This makes root cause diagnosis harder.

### TAZE-RUN2-5: yarnWorkspaces.ts Regex Syntax Error

All 3 instrumentation attempts for `src/io/yarnWorkspaces.ts` produced the same invalid regex literal: `/\./ g` (space between `/` delimiter and `g` flag). The correct form is `/\./g`.

The tsc error: `src/io/yarnWorkspaces.ts(91,74): error TS1005: ',' expected.`

The model correctly identified the fix (per debug dump analysis showing the agent's reasoning), but the code generation produced the wrong output on every attempt. This may indicate a systematic issue with regex token generation in the TypeScript context for this model version.

**File context**: The fix was being applied while simultaneously adding a CDQ-006 isRecording guard around `Object.keys(versions).length` on the same span. The multi-location edit may have contributed to the generation error.

### TAZE-RUN2-7: Oscillation Classified as "Correct Skip"

The spiny-orb tool classifies resolves.ts (0-span oscillation result) as "no changes needed: ✅ SUCCESS" in the run summary. The PR's "no changes needed: 21" count includes resolves.ts alongside 20 genuine pre-scan correct skips.

This is a **telemetry classification bug**: oscillation-induced 0-span commits are indistinguishable from genuine correct skips in the current output format. A human evaluator reviewing only the PR summary cannot identify coverage regressions.

**Signal**: A "correct skip" on a file with exported async I/O functions (like resolves.ts with `getPackageData`, `resolvePackage`) should surface a warning. The tool has the context to distinguish: files that reached the LLM assessment stage (resolves.ts had 12 attempts) vs files that were pre-scan skipped (constants.ts, types.ts, etc.).

---

## §5. IS Score Analysis

**IS Score: 80/100** (run-13: 60/100) | Applicable rules: ~8 | Passed: 5+ | Failed: SPA-001

| Change | Run-13 | Run-15 |
|--------|--------|--------|
| RES-001 (service.instance.id) | ❌ FAIL | ✅ **PASS** — `randomUUID()` added to bootstrap |
| SPA-001 (INTERNAL span count) | ❌ FAIL (164 spans; limit: 10) | ❌ FAIL (37 spans; raised limit: 30) | Structural — CLI architecture |
| All other passing rules | ✅ PASS | ✅ PASS | No regressions |

**IS score improvement breakdown**: The +20 increase is entirely from RES-001 passing. No other rules changed state. The SPA-001 threshold was raised from 10 to 30 for CLI pipelines between run-13 and run-15 IS scoring, but 37 INTERNAL spans still exceeds the raised threshold.

**SPA-001 — taze structural characteristic**

Run-15 produced 37 INTERNAL spans (run-13: 164 — the run-15 reduction is from resolves.ts oscillation, which removed per-dependency resolution spans). The 37-span trace covers the main check command without per-package resolution granularity:

- `taze.fetch.package`: per-package HTTP fetch calls (bulk of span count)
- `taze.fetch.jsr_package_meta`: JSR registry fetches
- I/O spans: load/write operations per workspace file

Reducing below 30 INTERNAL spans would require span batching (aggregate multiple package fetches under one parent span), which is an architectural change to the instrumentation strategy. This is a design discussion, not a simple fix.

---

## §6. Prioritized Fix Recommendations

### P1 — TAZE-RUN2-4: Diagnose resolves.ts Oscillation Root Cause

**Impact**: Recovering resolves.ts would restore 6 committed files, raising committed count to 17 and Q×F from 10.2 to ~15.8. Single highest-impact action available for run-16.

**Investigation path**: The NDS-001 tsc error messages for resolves.ts were not captured. Re-run spiny-orb on resolves.ts alone with `--debug-dump-dir` to capture the generated code, then run `tsc --noEmit` manually to see the actual error. Likely candidates:
- Complex generic type inference in async callbacks
- Conditional return types in discriminated unions
- TypeScript strict null checks on function return values

**Owner**: spiny-orb team (oscillation handling and per-attempt error capture).

### P2 — TAZE-RUN2-1 + TAZE-RUN2-2: CDQ-006 Guard — Systematic Application

**Impact**: Eliminating all 5 CDQ-006 violations raises CDQ from 86% → 100% and total quality from 27/29 → 28/29. Combined with SCH-003 fix, achieves 29/29 (100%).

**What works**: The guard pattern is correctly applied in index.ts. The fail pattern is predictable: any `Object.keys(obj).length`, `arr.reduce(...)`, `arr.filter(...)`, or method calls (like `flatDeps()` that internally use flatMap/filter) inside `setAttribute` without a preceding `if (span.isRecording())` guard.

**Prompt recommendation**: Add a TypeScript-specific CDQ-006 rule that fires a static check before final commit: if `setAttribute(key, expr)` and `expr` contains a function call (not just property access), and there is no `if (span.isRecording())` enclosing the setAttribute call, flag it. This would catch both the `Object.keys().length` and `flatDeps().length` patterns automatically.

**Owner**: spiny-orb team (TypeScript prompt and/or static validator).

### P3 — TAZE-RUN2-3: Fix Schema Type for Count Attributes

**Impact**: Eliminates SCH-003 violation in bunWorkspaces.ts. Raises SCH from 75% → 100% (assuming CDQ-006 still fails) or enables 29/29 with P2.

**Pattern**: The agent auto-generates count attributes (`.length` values) as `type: string`. The correct type is `int`. A heuristic fix: when an attribute value is assigned from `expr.length` or `Object.keys(expr).length`, infer `type: int` in the schema generation step.

**Owner**: spiny-orb team (schema generation heuristic for TypeScript count attributes).

### P4 — TAZE-RUN2-7: Distinguish Oscillation from Correct Skips in Run Summary

**Impact**: Visibility improvement — evaluators can identify coverage regressions directly from the PR summary without per-file analysis.

**Suggestion**: Add a fourth outcome category to the run summary: "assessed but no spans committed (oscillation)" distinct from "no changes needed (pre-scan skip)". A file that had LLM attempts but 0 spans is qualitatively different from a file that never reached the LLM.

**Owner**: spiny-orb team (run summary telemetry).

---

## §7. Unresolved Items Tracker

Items that require action before or in run-16:

| Item | Origin | Runs Open | Priority | Action |
|------|--------|-----------|----------|--------|
| CDQ-006: isRecording guards (5 instances) | **TAZE-RUN2-1,2** | 2 runs (run-13+15) | Low | Spiny-orb prompt fix |
| SCH-003: count attribute type string→int pattern | **TAZE-RUN2-3** | 2 runs (run-13+15) | Low | Schema gen heuristic |
| resolves.ts oscillation: unknown tsc error | **TAZE-RUN2-4** | 1 run | Medium | Root cause investigation |
| yarnWorkspaces.ts: regex space in flag | **TAZE-RUN2-5** | 2 runs (run-13+15) | Low | Generation error |
| Oscillation classified as correct skip | **TAZE-RUN2-7** | 1 run | Medium | Telemetry classification |
| IS SPA-001: 37 INTERNAL spans > 30 threshold | **TAZE-RUN1-6** | 2 runs | Info | Design discussion |

Items resolved this run:

| Item | Origin | Resolution |
|------|--------|------------|
| IS RES-001: service.instance.id absent | **TAZE-RUN1-5** | **RESOLVED** — randomUUID() added to bootstrap |
| SCH-003: taze.config.sources_found int/string | **TAZE-RUN1-1** | **RESOLVED** — schema now int |
| SCH-003: taze.cache.hit, taze.cache.changed boolean/string | **TAZE-RUN1-1** | **RESOLVED** — schema now boolean |
| CDQ-006: index.ts reduce/filter guards | **TAZE-RUN1-2** | **RESOLVED** — isRecording guard applied |

---

## §8. Score Projections for Run-16

### Conservative (no new fixes before run-16)

- **Quality**: 27/29 (93%) — CDQ-006 and SCH-003 likely to recur
- **Files**: 10–14 (resolves.ts oscillation likely recurs unless root cause diagnosed)
- **IS Score**: 80/100 (RES-001 now stable; SPA-001 structural)
- **Q×F**: ~9–12

### Target (P2 CDQ-006 prompt fix + P3 SCH-003 schema gen fix)

- **Quality**: 29/29 (100%) — both failures resolved
- **Files**: 14+ (if resolves.ts oscillation not yet fixed, else ~17)
- **IS Score**: 80/100
- **Q×F**: ~12.8–15.5

### Stretch (all fixes including resolves.ts oscillation)

- **Quality**: 29/29 (100%)
- **Files**: 17 (resolves.ts recovered)
- **IS Score**: 80/100
- **Q×F**: ~17.0

---

## §9. Run-15-Specific Observations

1. **IS RES-001 fix confirms the SDK bootstrap approach works** — The one-line `randomUUID()` addition raised the IS score from 60 to 80. RES-001 is now a stable passing rule for taze. No regressions introduced.

2. **CDQ-006 guard inconsistency is run-to-run, not schema-to-schema** — pnpmWorkspaces.ts had the correct guard in run-13 and lost it in run-15 even though the attribute name (`taze.write.changes_count`) and computation (`Object.keys(versions).length`) are identical. The guard is not preserved because the instrumentation is regenerated from scratch each run. The fix must be in the generation prompt, not in schema annotations.

3. **SCH-003 pattern persists despite schema correction** — The three run-13 mismatches were fixed, but the run-15 agent introduced a new one with the same structural pattern (`.length` value → `type: string` in schema). The schema-generation heuristic for count attributes is unchanged. This finding will likely recur in run-16 for any new count attributes unless the schema gen code is modified.

4. **resolves.ts coverage loss is the primary quality driver** — The Q×F decrease (13.0 → 10.2) is almost entirely from resolves.ts (6 functions × 0 spans). Without the oscillation, run-15 would have had ~17 committed files and Q×F ≈ 15.8 — a significant improvement over run-13. The oscillation is blocking what would otherwise be a strong run.

5. **cli.ts pre-scan correction is a genuine improvement** — Run-13's 2 cli.ts spans were incorrect (anonymous inline callbacks are not exported functions per COV-001). Run-15 correctly identifies cli.ts as needing 0 spans. This is not a coverage regression; it's a false positive eliminated.
