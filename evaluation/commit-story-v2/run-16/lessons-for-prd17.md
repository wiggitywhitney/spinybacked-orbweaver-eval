# Lessons for PRD #17

Observations collected during run-16 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

**RUN15-1 fix status — CONFIRMED LANDED:**
`e2582c3 prompt: COV-003 outer catch guidance + CDQ-006 pattern expansion (#728)` is on spiny-orb main, merged via PR #749 (closed issue #728). The fix adds prompt guidance: NDS-007 (graceful-degradation inner catches) does NOT exempt the outer `startActiveSpan` wrapper from needing its own error-recording catch for unexpected exceptions. Also expands CDQ-006 guarded-computation patterns to include `.filter`, `.join`, `.flatMap`, `Object.keys()`, and adds a concrete `isRecording()` guard code example.

**Other spiny-orb changes since run-15** (built from `fix/724-attribute-namespace` SHA `1b6c3d9`):
- **Dependency-aware file instrumentation ordering (PRD #700)**: leaves-first ordering via ts-morph dep graph. May change which files succeed/fail in run-16 since dependencies are instrumented before dependents.
- **Prettier-normalized NDS-003 comparison (PRD #820)** + NDS-003 reconciler improvements (issues #839, #841, #842): reduces NDS-003 false positives — could improve committed file count.
- **Weaver live-check integration (PRD #698)**: validates schema against real-time OTLP telemetry during the run. New behavior — watch for live-check failures surfacing in run-16 output.
- **Human-facing advisory output (PRD #509)**: advisory messages now include human-readable descriptions. May change advisory section format in the PR.
- **Namespace rejection feedback (#722)**: wrong-namespace extensions now trigger a fix loop.
- **Function-level fallback fixes (#841, #842)**: additional NDS-003 reconciler coverage.

These are substantial changes since run-15. Run-16 results may differ more than usual from run-15.

**RUN15-3 push detection bug**: No specific fix found on spiny-orb main. Still present. If spiny-orb reports "Push failed" during run-16, check whether the instrument branch exists on the remote before concluding the push actually failed.

**spiny-orb version**: 1.0.0 (SHA `dc5a2aa`, main branch; latest code commit `4fa5afc` Merge PR #842)
**Node version**: v25.8.0
**commit-story-v2**: on `main`, clean working tree (untracked journal files only)
**Files in src/**: 30 JS files (same as runs 12–15)
**Push auth**: CONFIRMED — dry-run to `spiny-orb/auth-test-run16` succeeded

## Run-Level Observations

<!-- Populated during and after evaluation run -->

## Evaluation Process Observations

<!-- Populated during structured evaluation -->
