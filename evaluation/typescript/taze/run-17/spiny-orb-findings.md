<!-- ABOUTME: Per-file findings from spiny-orb run-17 on taze — failure deep-dives, debug dump analysis, and individual file observations. -->
# Spiny-orb Findings — taze Run-17

Per-file analysis from run-17. Populated during failure deep-dives and per-file evaluation.

## Failure Deep-Dives

**Failed files**: 0. **Partially committed files**: 0. `debug-dumps/` is empty (`--debug-dump-dir` only fires for failed/partial/zero-span files, per `spiny-orb-output.log`'s own run summary: "13 committed, 0 failed, 0 partial, 20 correct skips, 0 skipped").

**Files requiring ≥3 attempts**: 1 — `src/io/packageYaml.ts` (3 attempts, ultimately SUCCESS: 4 spans, 0 attributes).

- **Attempt 1**: Failed on a TypeScript type error — `type: 'package.yaml'` widened to `string` inside the async `startActiveSpan` callback (TS2322 against the `PackageMeta` union member).
- **Attempt 2**: Diagnosed the fix (`as const` on the discriminant field) but was rejected — the agent's approach also extracted `doc.get('name')` into a separate const variable, a non-instrumentation code change that violates NDS-003.
- **Attempt 3**: Applied the `as const` fix alone, kept the original inline handling of `doc.get('name')`, and succeeded cleanly.

**Assessment**: not a quality failure requiring a carry-forward finding. The retry loop worked as designed — the validator correctly rejected a non-instrumentation change in attempt 2, and the final commit's reasoning (correct COV-001 entry-point classification, correct NDS-007 handling of the `.catch(Object.create)` graceful-degradation path, correct RST-001/RST-004 skip of `isDepFieldEnabled`) is sound. No finding logged for this file from the deep-dive; still subject to full per-file evaluation below.

---

## packument.ts

*(Primary investigation target — COV-005, TAZE-RUN3-1: `taze.package.latest_version` dropped from both fetch spans in run-16)*

**Outcome**: TBD

**Attribute recovered on both fetch spans**: TBD

**Root cause (if still absent)**: TBD

---

## checkGlobal.ts

*(Primary investigation target — SCH-003, TAZE-RUN3-3: `String(deps.length)` cast on `taze.package.deps_count`, an int-typed schema attribute)*

**Outcome**: TBD

**String() cast removed**: TBD

---

## bunWorkspaces.ts

*(Primary investigation target — SCH-003 (TAZE-RUN3-4: `String(catalogs.length)` cast on `taze.catalog.count`) and CDQ-006 (TAZE-RUN3-2: 3 post-await `setAttribute` calls in `loadBunWorkspace` without `isRecording` guard))*

**SCH-003 outcome**: TBD

**CDQ-006 outcome**: TBD

| Rule | Run-16 status | Run-17 status | Notes |
|------|---------------|----------------|-------|
| SCH-003 (`String(catalogs.length)`) | Violation | TBD | |
| CDQ-006 (3 post-await calls in `loadBunWorkspace`) | Violation | TBD | |

---

## resolves.ts

*(Primary investigation target — stability check after run-16 recovery from run-15 oscillation)*

**Outcome**: TBD

**Debug dump captured (if oscillation recurs)**: TBD

**tsc error (if oscillation recurs)**: TBD

**Root cause**: TBD

---

## IS SPA-002 (orphan span)

*(Primary investigation target — new in run-16 with the resolves.ts recovery; determines whether async-boundary context loss is consistent or transient)*

**Outcome**: TBD

**Consistent vs. transient**: TBD

---

## Other Files

*(Populated during per-file evaluation)*
