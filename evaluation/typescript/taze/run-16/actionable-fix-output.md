<!-- ABOUTME: Actionable fix output for taze run-16 — structured handoff to spiny-orb team. -->
# Actionable Fix Output — taze Run-16

**Run date**: 2026-06-21
**spiny-orb SHA**: 8a08f5b (includes #752 companion files, #989 extended debug dumps)
**PR**: https://github.com/wiggitywhitney/taze/pull/11
**IS Score**: 88.9/100
**Quality**: 26/29 (90%) | **Q×F**: 11.7

---

## What Happened

Run-16 instrumented 33 taze source files: 13 committed with spans, 20 correctly skipped as non-instrumentation targets. No files failed or were rolled back. Gates passed (syntax + tests clean).

**Two major recoveries vs run-15:**
- **resolves.ts** returned to full instrumentation (6 spans) after the run-15 oscillation that lost 6 functions across 2 attempts. The #954/#958 oscillation root cause is still unresolved in spiny-orb — this recovery may be stochastic.
- **yarnWorkspaces.ts** recovered (2 spans) after the run-15 NDS-001 regex syntax failure. The agent independently diagnosed and corrected a pre-existing source defect (`/\./ g` → `/\./g`).

**CDQ-006 improvement**: violations dropped from 5 (run-15, 4 files) to 3 (run-16, 1 file). checkGlobal.ts, interactive.ts, and pnpmWorkspaces.ts are now fully guarded.

**IS score improvement**: 80 → 88.9/100 (+8.9). Driven by higher span count and coverage depth from the recovered files.

**Quality regression**: 27/29 (run-15) → 26/29 (run-16), driven by a new COV-005 failure in packument.ts.

**Q×F improvement**: 10.2 → 11.7 (+1.5). The +2 file recovery more than offsets the -1 quality regression.

---

## resolves.ts — Oscillation Status

| Run | Result | Notes |
|-----|--------|-------|
| Run-13 | 6 spans committed | Baseline |
| Run-15 | 0 spans (oscillation — "no changes needed") | 6 functions, 2 attempts, both failed |
| Run-16 | 6 spans committed | Recovery — same 6 spans as run-13 |

The resolves.ts oscillation is not yet diagnosed. Run-16 recovered without any changes to spiny-orb's oscillation handling logic — the fix applied in run-15's instrument attempt (which still produced 0 spans) appears to have propagated to this run without triggering the failure mode. This is consistent with stochastic behavior rather than a deterministic fix.

**Status**: Recovery observed. Root cause unknown. #954/#958 remain open. Treat run-17 as a stability check — if resolves.ts drops again, the oscillation is confirmed stochastic and #954 becomes higher priority.

---

## CDQ-006 (isRecording guard) — Status

| File | Run-13 | Run-15 | Run-16 |
|------|--------|--------|--------|
| checkGlobal.ts | 2 violations | 2 violations | **0** (guarded) |
| interactive.ts | 0 | 1 violation | **0** (fixed) |
| pnpmWorkspaces.ts | 0 | 1 violation | **0** (fixed) |
| bunWorkspaces.ts | 0 | 1 violation | **3 violations** (regressed) |
| **Total** | ~2 | 5 | **3** |

**New finding TAZE-RUN3-2** (bunWorkspaces.ts): Three `setAttribute` calls in `loadBunWorkspace` placed after `await readFile(...)` without `if (span.isRecording())` guard:
- `setAttribute('taze.write.file_path', ...)`
- `setAttribute('taze.write.package_type', ...)`
- `setAttribute('taze.catalog.count', ...)`

Note: `writeBunWorkspace` in the same file correctly guards its `Object.keys(versions).length` call. The regression is isolated to `loadBunWorkspace`.

**Fix**: Add `if (span.isRecording())` block wrapping the three post-await setAttribute calls in `loadBunWorkspace`.

---

## SCH-003 (Attribute type mismatch) — Status

Run-15 had 1 SCH-003 violation: `taze.io.catalogs_found` using a string for an int-typed attribute.

Run-16 fixed the **schema declaration** (new attribute `taze.catalog.count` correctly declared as `type: int` in `agent-extensions.yaml`). But the **String() cast pattern recurred at two call sites**:

| File | Attribute | Code | Schema Type | Finding |
|------|-----------|------|-------------|---------|
| checkGlobal.ts | `taze.package.deps_count` | `String(deps.length)` | int | TAZE-RUN3-3 |
| bunWorkspaces.ts | `taze.catalog.count` | `String(catalogs.length)` | int | TAZE-RUN3-4 |

pnpmWorkspaces.ts and yarnWorkspaces.ts correctly pass `catalogs.length` (int) without the cast.

**Pattern**: The agent correctly declares int types in the schema but intermittently wraps int values in `String()` at call sites. The schema is correct; only the call sites need fixing.

**Fix**: Remove `String()` wrapper from `deps.length` in checkGlobal.ts and `catalogs.length` in bunWorkspaces.ts.

---

## COV-005 (Domain attributes) — New Regression

**New finding TAZE-RUN3-1** (packument.ts): `taze.package.latest_version` dropped from both fetch spans.

This attribute is registered in the schema, was captured in run-15, and the data is directly available in both response objects:
- npm path: `meta.latest` (or the resolved version field)
- JSR path: the returned package meta object

Both `taze.fetch.package` and `taze.fetch.jsr_package` spans lack this attribute in run-16.

**Fix**: Add `setAttribute('taze.package.latest_version', resolvedVersion)` to both fetch span bodies after the response data is available.

---

## IS Score — Run-16 Details

**Score: 88.9/100**

| Rule | Result | Notes |
|------|--------|-------|
| RES-001 (service.instance.id) | PASS | Achieved in run-15; stable |
| RES-002 (service.name) | PASS | Stable |
| RES-003 (service.version) | PASS | Stable |
| SPA-001 (INTERNAL span count) | Not applicable | CLI design; structural |
| SPA-002 (Orphan spans) | **FAIL** | 1 orphan span: `0fa594f2` has parent `3b6a551d` not found in trace |
| CDQ-* applicable rules | PASS | All clean |

**SPA-002 note**: The orphan span is new in run-16 — not present in run-15 (when resolves.ts produced 0 spans). The recovered resolves.ts spans introduce new parent-child relationships at runtime. One span's parent context is lost in certain code paths, likely where the span is created across an async boundary without explicit context propagation. Run-17 will determine if this is consistent (structural fix needed) or transient (one-off).

---

## Findings Summary

### New findings (run-16)

| ID | Rule | File | Severity | Description |
|----|------|------|----------|-------------|
| TAZE-RUN3-1 | COV-005 | packument.ts | Low | `taze.package.latest_version` dropped from both fetch spans; registered attribute available in response data |
| TAZE-RUN3-2 | CDQ-006 | bunWorkspaces.ts | Low | 3 post-await setAttribute calls in `loadBunWorkspace` without isRecording guard |
| TAZE-RUN3-3 | SCH-003 | checkGlobal.ts | Low | `String(deps.length)` for `taze.package.deps_count` (int schema) |
| TAZE-RUN3-4 | SCH-003 | bunWorkspaces.ts | Low | `String(catalogs.length)` for `taze.catalog.count` (int schema) |
| — | IS SPA-002 | resolves.ts (likely) | Info | Orphan span in runtime trace; new with resolves.ts recovery |

### Resolved vs run-15

| Finding | Resolution |
|---------|-----------|
| resolves.ts oscillation (TAZE-RUN2-4) | RECOVERED — 6 spans committed; root cause still open |
| yarnWorkspaces.ts NDS-001 regex (TAZE-RUN2-5) | RECOVERED — agent corrected source defect |
| interactive.ts CDQ-006 (TAZE-RUN2-2) | FIXED |
| pnpmWorkspaces.ts CDQ-006 | FIXED |
| SCH-003 catalogs_found string/int (TAZE-RUN2-3) | SCHEMA FIXED; code-level recurs in 2 files (TAZE-RUN3-3/4) |

### Carry-forward (unresolved)

| ID | Rule | File | Priority |
|----|------|------|----------|
| TAZE-RUN3-1 | COV-005 | packument.ts | Low |
| TAZE-RUN3-2 | CDQ-006 | bunWorkspaces.ts | Low |
| TAZE-RUN3-3 | SCH-003 | checkGlobal.ts | Low |
| TAZE-RUN3-4 | SCH-003 | bunWorkspaces.ts | Low |
| TAZE-RUN1-6 | IS SPA-001 | structural / CLI | Info |

---

## Run-17 Priority Goals

1. **COV-005 packument.ts** — recover `taze.package.latest_version` on both fetch spans
2. **SCH-003 String() cast pattern** — remove `String()` at checkGlobal.ts + bunWorkspaces.ts call sites
3. **CDQ-006 bunWorkspaces.ts** — add isRecording guard to 3 post-await setAttribute calls in `loadBunWorkspace`
4. **resolves.ts stability** — verify the recovery holds (stochastic check; #954 diagnostic context)
5. **IS SPA-002** — verify whether orphan span persists or was transient

Target: 28/29 (97%) quality, Q×F ≥12.0, IS ≥88/100. Resolving all four carry-forward quality findings would reach 30/29 — impossible; the ceiling is 29/29 (100%). Realistically: COV-005 + SCH-003×2 = 3 recoveries → 29/29 if CDQ-006 also resolves. Q×F would be (29/29)×13 = 13.0 matching the run-13 peak.
