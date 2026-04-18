# Lessons for Run 2

Observations collected during run-1 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

### Test suite baseline (post-prerequisites, pre-instrumentation)

Run with `GIT_CONFIG_GLOBAL=/tmp/release-it-test.gitconfig npm test` (minimal config: user email + name only, no `tag.gpgsign`).

**3 consecutive clean runs — 2026-04-18:**

| Run | Pass | Fail | Skipped | Total |
|-----|------|------|---------|-------|
| 1   | 262  | 0    | 2       | 264   |
| 2   | 262  | 0    | 2       | 264   |
| 3   | 262  | 0    | 2       | 264   |

**Consistently skipped (not failures):**
- `should not roll back with risky config`
- `should truncate long body`

The 2 skipped tests are stable and unrelated to instrumentation. The suite is clean for run-1.

## Run-Level Observations

<!-- Populate after evaluation run completes -->

## Evaluation Process Observations

<!-- Populate during structured evaluation -->
