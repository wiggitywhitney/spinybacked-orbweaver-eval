# Lessons for PRD #15

Observations collected during run-14 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

**All run-13 P1 findings confirmed resolved:**
- Issue #437 (smart checkpoint rollback — file-targeted revert) — CLOSED 2026-04-12
- Issue #447 (smart rollback schema extension cleanup) — CLOSED 2026-04-13
- Issue #435 (type-safety: `!= null` guard guidance) — CLOSED 2026-04-13
- Issue #436 (type-safety: Date vs string conversion guidance) — CLOSED 2026-04-13
- Issue #438 (summaryNode NDS-003 Code Preserved fix) — CLOSED 2026-04-13
- Issue #440 (SCH-004 advisory contradiction fix) — CLOSED 2026-04-12
- Issue #431 (SCH-005 LLM judge deduplication, PRD #431) — CLOSED today 2026-04-15 at 13:23

**SCH-005 is live for the first time in run-14.** PRD #431 closed at 13:23 on the day of this run. Advisory findings referencing SCH-005 are expected and desirable — first-run signal, not a regression.

**PRD #483 (advisory rules audit) context:** The spiny-orb team created PRD #483 today (2026-04-15) documenting that all 16 advisory rules produce findings with no mechanism to act on them (dead signal). Additionally, CDQ-007, CDQ-009, CDQ-010 have orphaned implementations not registered in `tier2Checks` and never run. This is important context for interpreting run-14 advisory findings — high false-positive rates on advisory rules like SCH-004 are a known systemic issue under active audit.

**commit-story-v2 working tree note:** `src/generators/journal-graph.js` had an unstaged manual instrumentation of `technicalNode`, `dialogueNode`, and `generateJournalSections` at run start. It was discarded with `git restore` before running — target repo is clean on main.

**spiny-orb branch**: main (`e2dc3f5` — SCH-004 namespace pre-filter). Rebuilt from source immediately before run.

**File count**: 30 JS files in `src/` — same as runs 12 and 13.

## Run-Level Observations

<!-- Populated after evaluation run completes -->

## Evaluation Process Observations

<!-- Populated during structured evaluation -->
