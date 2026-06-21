// ABOUTME: Per-file findings from spiny-orb run-16 on taze — failure deep-dives, debug dump analysis, and individual file observations.
# Spiny-orb Findings — taze Run-16

Per-file analysis from run-16. Populated during failure deep-dives and per-file evaluation.

## resolves.ts

*(Primary investigation target — NDS-001 oscillation from run-15)*

**Outcome**: TBD

**Debug dump captured**: TBD

**tsc error (if oscillation recurs)**: TBD

**Root cause**: TBD

---

## yarnWorkspaces.ts

*(Secondary — `/\./ g` regex syntax error on all 3 run-15 attempts)*

**Outcome**: TBD

---

## CDQ-006 Violations

*(isRecording guard status per file — compare to run-15 baseline of 5 violations in 4 files)*

| File | Run-15 violations | Run-16 violations | Notes |
|------|------------------|------------------|-------|
| checkGlobal.ts | 2 | TBD | |
| interactive.ts | 1 | TBD | |
| bunWorkspaces.ts | 1 | TBD | |
| pnpmWorkspaces.ts | 1 | TBD | Regression from run-13 (guard was present) |

---

## Other Files

*(Populated during per-file evaluation)*
