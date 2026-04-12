# Lessons for PRD #14

Observations collected during run-13 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

**All run-12 P1/P2 findings are resolved:**
- Issue #388 (NDS-003 truthy guards) — CLOSED, fix landed in PR #391 (2026-04-09). Pattern `/^\s*if\s*\(\s*\w+(?:\.\w+)+\s*\)\s*\{?\s*$/` added to `INSTRUMENTATION_PATTERNS` in `nds003.ts`.
- Issue #389 (COV-004 context propagation exemption) — CLOSED, fix landed in PR #398 (2026-04-09). cov004.ts now explicitly rejects context propagation as a COV-004 exemption for exported async I/O functions.
- Issue #411 (CDQ-007 nullable setAttribute) — CLOSED, Tier 2 advisory validator added in PR #425 (2026-04-11).

**spiny-orb branch**: `feature/prd-372-typescript-provider` (f6d482f). TypeScript provider extraction is in progress on this branch. Run-13 is the first evaluation on this branch — watch for any TypeScript provider side effects on JS instrumentation behavior.

**Target repo cleanup**: commit-story-v2 was left on `spiny-orb/instrument-1775717624848` with two uncommitted run-12 artifacts (`semconv/agent-extensions.yaml` +16 lines, `src/utils/summary-detector.js` partial instrumentation). These were discarded when switching to main — the uncommitted partial artifacts from run-12 were lost. Future pre-run verification should commit any uncommitted artifacts to the instrument branch before switching the target repo back to main.

**File count**: 30 JS files in `src/` — same as run-12.

## Run-Level Observations

<!-- Populated after evaluation run completes -->

## Evaluation Process Observations

<!-- Populated during structured evaluation -->
