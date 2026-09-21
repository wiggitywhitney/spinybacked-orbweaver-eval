<!-- ABOUTME: Per-file findings from spiny-orb run-17 on taze — failure deep-dives, debug dump analysis, and individual file observations. -->
# Spiny-orb Findings — taze Run-17

Per-file analysis from run-17. Populated during failure deep-dives and per-file evaluation.

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
