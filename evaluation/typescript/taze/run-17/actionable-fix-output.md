<!-- ABOUTME: Actionable fix output for taze run-17 — structured handoff to spiny-orb team. -->
# Actionable Fix Output — taze Run-17

**Run date**: 2026-09-21
**spiny-orb SHA**: 4e7c2f0 (PRD-373 Python COV-004 checker work — unrelated to taze's carry-forward findings)
**PR**: https://github.com/wiggitywhitney/taze/pull/13
**IS Score**: 77.8/100
**Quality**: 25/29 (86%) | **Q×F**: 11.2

---

## What Happened

Run-17 instrumented 33 taze source files: 13 committed with spans, 20 correctly skipped as non-instrumentation targets. No files failed or were rolled back. Gates passed (syntax + tests clean).

**Two of three run-16 carry-forward goals resolved:**
- **CDQ-006** (isRecording guard) is now fully resolved — 0 violations, down from 3 in run-16. `bunWorkspaces.ts`'s `loadBunWorkspace` is correctly guarded (spiny-orb #1012).
- **COV-005 packument.ts** recovered — `taze.package.latest_version` is set on both fetch spans (npm: `result.tags.latest`; JSR: `meta.latest`), sourced from real fetch data.

**SCH-003 carry-forward goal not resolved — broadened instead.** The run-16 fix targeted the `String(count)` cast pattern in exactly 2 files (checkGlobal.ts, bunWorkspaces.ts). bunWorkspaces.ts is now clean, but the pattern spread to 5 files total, including two "disguised" recurrences where the schema was retyped to `string` to match the cast rather than the cast being removed.

**New regression not previously tracked: CDQ-007** (unsanitized absolute filesystem paths) now fails in 6 of 13 committed files — the largest new finding by file count this run.

**resolves.ts**: the NDS-001 compilation oscillation is genuinely fixed (first attempt, 0 validation errors — an improvement over run-16's 2 attempts). But it traded that instability for a new one: span names and attributes are not converging run-over-run even with syntax now stable.

**IS SPA-002 (orphan span) confirmed consistent** across two consecutive runs (run-16, run-17) — same async-boundary context-loss shape in `resolves.ts`, different span IDs. This is now a real spiny-orb fix candidate, not run-specific noise.

**Quality regression**: 26/29 (run-16) → 25/29 (run-17), entirely attributable to SCH (3/4 → 2/4). CDQ held flat at 6/7, but composition changed: CDQ-006 resolved while a new CDQ-007 violation took its place.

**IS score regression**: 88.9 → 77.8/100 (−11.1), driven by SPA-002 (confirmed recurring) plus a new SPA-005 failure (24 short spans vs. limit 20) — investigated and assessed as a threshold/rubric artifact, not a defect (see below).

**Q×F regression**: 11.7 → 11.2 (−0.5). File count held flat at 13; the entire movement is the quality-score drop.

---

## COV-005 (Domain attributes) — packument.ts Recovered

| Run | Status | Notes |
|-----|--------|-------|
| Run-15 | PASS | `taze.package.latest_version` present |
| Run-16 | FAIL (TAZE-RUN3-1) | Dropped from both fetch spans |
| Run-17 | **PASS** | Recovered — set on npm span (`result.tags.latest`, guarded) and JSR span (`meta.latest`, unconditional — required field on `JsrPackageMeta`) |

**Status**: Resolved. No further action needed on this finding.

---

## CDQ-006 (isRecording guard) — Fully Resolved

| File | Run-13 | Run-15 | Run-16 | Run-17 |
|------|--------|--------|--------|--------|
| checkGlobal.ts | 2 violations | 2 violations | 0 (guarded) | 0 |
| interactive.ts | 0 | 1 | 0 (fixed) | 0 |
| pnpmWorkspaces.ts | 0 | 1 | 0 (fixed) | 0 |
| bunWorkspaces.ts | 0 | 1 | 3 (regression) | **0 (resolved)** |
| **Total** | ~2 | 5 | 3 | **0** |

**Status**: Fully resolved (spiny-orb #1012). Only unguarded post-await calls remaining in `loadBunWorkspace` are trivial property access (exempt); the one method-chain computation (`Object.keys(versions).length`) is correctly guarded with `if (span.isRecording())`. No further action needed.

---

## SCH-003 (Attribute type mismatch / count-cast-to-string) — Not Resolved, Broadened

Run-16 targeted this pattern in 2 files (checkGlobal.ts, bunWorkspaces.ts). Run-17 result:

| File | Run-16 | Run-17 |
|------|--------|--------|
| checkGlobal.ts | FAIL (`String(deps.length)` vs schema `type: int`) | **FAIL** — disguised recurrence: attribute renamed (`taze.check.packages_loaded`), same `String(deps.length)` cast, but schema retyped to `string` so code and schema now literally agree |
| bunWorkspaces.ts | FAIL (`String(catalogs.length)`) | **RESOLVED** |
| check/index.ts | PASS | **FAIL (new)** — `String(resolvePkgs.length)` for new attribute `taze.check.packages_loaded` |
| pnpmWorkspaces.ts | PASS | **FAIL (new)** — `String(catalogs.length)` vs run-16's clean raw-int equivalent |
| packageYaml.ts | PASS | **FAIL (new, disguised)** — `String(deps.length)` with schema retyped to `string` |
| yarnWorkspaces.ts | PASS | **FAIL (new, literal)** — `String(catalogs.length)` against `int`-typed `taze.io.catalogs_count`; also a new SCH-004 near-synonym (`taze.io.file_path` duplicating `taze.write.file_path`) |
| **Files affected** | **2** | **5** |

**Pattern**: The agent intermittently wraps `.length`-derived int values in `String()` at call sites. In two files, instead of removing the cast, the schema itself was retyped to `string` to match — this makes the literal schema/code check pass while the underlying value is still a numeric count stored as a string. Fixing the pattern in one file (spiny-orb #1012) did not generalize the judgment to other files performing the same operation.

**Fix**: Remove `String()` wrappers at all five call sites (checkGlobal.ts, check/index.ts, pnpmWorkspaces.ts, packageYaml.ts, yarnWorkspaces.ts) and retype the two disguised attributes (`taze.check.packages_loaded` in checkGlobal.ts and packageYaml.ts) back to `int` in `agent-extensions.yaml`. This is a broader instance of the same underlying agent behavior as #1012 — the fix likely needs to generalize the prompt guidance for count-derived attributes across all files performing a `.length` computation, not just the two files #1012 targeted.

---

## CDQ-007 (Unsanitized filesystem paths) — New Regression

Not a tracked carry-forward goal for run-17 — the single largest new finding by file count.

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

Confirmed by reading the instrument-branch source directly: `pathe`'s `resolve()` output and `pkg.filepath` are set with no structural guarantee the value is ever relative.

**Fix**: In each of the 6 files, sanitize the path attribute before `setAttribute` — either take `path.basename()`/relative-to-project-root, or apply the same sanitization pattern already used correctly in `resolves.ts`.

---

## resolves.ts — Compilation Stable, New Schema Instability

| Run | Compilation (NDS-001) | Schema stability |
|-----|------------------------|-------------------|
| Run-13 | Stable, 6 spans | Baseline |
| Run-15 | Oscillation — 0 spans, 2 failed attempts | N/A (no output) |
| Run-16 | Recovered — 6 spans, same as run-13 | Stable, matched run-13 |
| Run-17 | **Stable — first attempt, 0 validation errors** | **Unstable — 4 of 6 span names and 1 attribute (`taze.package.update_available`) drifted or dropped vs. run-16** |

**Status**: The #954/#958 compilation oscillation is genuinely fixed — this is a real improvement, not stochastic recovery (first-attempt success two runs running). However, a different instability has emerged: the agent is not converging on a consistent span/attribute schema for this file run-over-run even with syntax now stable. This is a new watch item, not a reopening of #954/#958.

**Fix**: No compilation fix needed. Recommend investigating why `resolves.ts`'s span/attribute naming isn't converging — possibly related to the same underlying non-determinism that caused the earlier oscillation, now manifesting as schema drift instead of failure.

---

## IS SPA-002 (Orphan span) — Confirmed Consistent

| Run | Result |
|-----|--------|
| Run-16 | Orphan span `0fa594f2`, parent `3b6a551d` not found in trace |
| Run-17 | Orphan span `1b89a19e`, parent `5997dc1b` not found in trace — different IDs, same shape |

**Status**: Consistent across two consecutive runs. This is a real spiny-orb fix candidate — the fix belongs in spiny-orb's context propagation across an async boundary in `resolves.ts`, not in the eval target.

---

## IS SPA-005 (Short spans over limit) — New, Not a Defect

**Outcome**: Investigated against source; assessed as a rubric/threshold artifact, not a code or instrumentation defect.

24 spans have duration <5ms against a flat limit of 20 (run-16 was exactly 20/20, passing). Breakdown: 18 `taze.check.resolve_dependency` spans (of 51 total) plus 6 scattered across `io.load_cache`, `io.read_json`, `io.load_package`, `io.load_package_json`, `config.resolve`.

`src/io/resolves.ts:264` shows why: a synchronous early-return fires before the network fetch (`getPackageData`) is ever called, for deps that are local/URL-referenced, have no update flag, fail the filter, or are in "ignore" mode. Sub-millisecond duration is the correct measurement for that code path — the other 33 `resolve_dependency` spans that do reach the network fetch land at 67ms–888ms, as expected.

**Why it crossed the threshold this run**: run-17 has more total spans overall (140 across 13 span names vs. run-16's 10) — more instrumentation coverage plus whatever the current dependency set in the fork happens to contain. A flat cap of 20 doesn't scale with legitimate span-volume growth.

**Assessment**: Same shape as the existing SPA-001 CLI-app exemption already documented for this target — an absolute threshold bumping into a target whose natural span volume varies run-to-run. Flag as a rubric observation, not a regression to chase.

---

## IS Score — Run-17 Details

**Score: 77.8/100**

| Rule | Result | Notes |
|------|--------|-------|
| RES-005 (service.name, Critical) | PASS | Stable |
| RES-001 (service.instance.id) | PASS | Stable |
| RES-004 (semconv attribute level) | PASS | Stable |
| SPA-002 (Orphan spans) | **FAIL** | Confirmed consistent across 2 runs — see above |
| SPA-003 (span name interpolation) | PASS | 13 unique span names, no interpolated values |
| SPA-004 (root span kind) | PASS | Root spans not CLIENT kind |
| SPA-005 (short spans) | **FAIL** | New — investigated, not a defect (see above) |

Applicable: 7 | Passed: 5 | Failed: 2 | Not applicable: 8

---

## Findings Summary

### New findings (run-17)

| ID | Rule | File | Severity | Description |
|----|------|------|----------|--------------|
| — | SCH-003 | check/index.ts | Low | `String(resolvePkgs.length)` for new attribute `taze.check.packages_loaded` |
| — | SCH-003 | pnpmWorkspaces.ts | Low | `String(catalogs.length)`, new regression |
| — | SCH-003 | packageYaml.ts | Low | `String(deps.length)`, disguised (schema retyped to string) |
| — | SCH-003 | yarnWorkspaces.ts | Low | `String(catalogs.length)` against int-typed `taze.io.catalogs_count` |
| — | SCH-004 | yarnWorkspaces.ts | Low | `taze.io.file_path` duplicates existing `taze.write.file_path` |
| — | CDQ-007 | bunWorkspaces.ts, packageJson.ts (write), packageYaml.ts, packages.ts, pnpmWorkspaces.ts, yarnWorkspaces.ts | Medium | Unsanitized absolute filesystem paths, no structural guarantee of relativity, 6 of 13 committed files |
| — | resolves.ts schema drift | resolves.ts | Low | 4 of 6 span names + `taze.package.update_available` attribute drifted/dropped vs. run-16, despite stable compilation |
| — | IS SPA-005 | resolves.ts (mostly) | Info | 24 spans <5ms vs. limit 20 — threshold artifact, not a defect |

### Resolved vs run-16

| Finding | Resolution |
|---------|-----------|
| COV-005 packument.ts (TAZE-RUN3-1) | RESOLVED — `taze.package.latest_version` present on both fetch spans |
| CDQ-006 bunWorkspaces.ts (TAZE-RUN3-2) | RESOLVED — fully guarded |
| SCH-003 bunWorkspaces.ts (TAZE-RUN3-4) | RESOLVED in this file |
| resolves.ts compilation oscillation (#954/#958) | RESOLVED for compilation — first-attempt success, 2 runs running |

### Carry-forward (unresolved)

| ID | Rule | File | Priority |
|----|------|------|----------|
| — | SCH-003 | checkGlobal.ts, check/index.ts, pnpmWorkspaces.ts, packageYaml.ts, yarnWorkspaces.ts | Medium — broadened from 2 to 5 files |
| — | CDQ-007 | 6 of 13 files (see above) | Medium — new, largest finding by file count |
| — | SCH-004 | yarnWorkspaces.ts | Low |
| — | IS SPA-002 | resolves.ts (spiny-orb context propagation) | Medium — confirmed consistent across 2 runs, real fix candidate |
| — | resolves.ts schema drift | resolves.ts | Low — watch item |
| TAZE-RUN1-6 | IS SPA-001 | structural / CLI | Info |
| — | IS SPA-005 | resolves.ts (mostly) | Info — threshold artifact, not a defect |

---

## Run-18 Priority Goals

1. **SCH-003 count-cast pattern** — now spanning 5 files (up from 2 in run-16), including 2 disguised recurrences where the schema was retyped to match the cast. This is the dimension driving the entire quality regression; the #1012 fix did not generalize. Recommend a broader prompt-level fix for count-derived attributes rather than another per-file patch.
2. **CDQ-007 unsanitized filesystem paths** — new regression in 6 of 13 files, largest new finding by file count. Needs its own carry-forward line starting run-18.
3. **IS SPA-002 orphan span** — confirmed consistent across two consecutive runs, same async-boundary context-loss shape in `resolves.ts`. Real spiny-orb fix candidate for context propagation.
4. **resolves.ts schema stability** — compilation is now solid for two runs; watch whether span/attribute naming converges or continues drifting.
5. **SCH-004 near-synonym** — `taze.io.file_path` vs `taze.write.file_path` in yarnWorkspaces.ts, new this run.

Target: recover SCH-003 (5 files) and CDQ-007 (6 files) to reach back toward 27-29/29. IS score depends primarily on SPA-002 (spiny-orb-side fix); SPA-005 is a threshold artifact and shouldn't be chased in the target.
