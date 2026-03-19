# Lessons for PRD #7

Observations, rubric gaps, process improvements, and methodology notes captured throughout run-6 evaluation. This document is the primary input for drafting PRD #7.

---

## Rubric Gaps

*Rules that proved insufficient, ambiguous, or missing during evaluation.*

---

## Process Improvements

*Workflow changes that would make the next evaluation run smoother.*

- **Handoff triage was excellent — no process changes needed.** All 22 run-5 findings were filed and closed, plus 13+ additional issues discovered during implementation. The recommendation-document handoff process is validated across two cycles (run-4→5, run-5→6).
- **CLI renamed from orbweaver to spiny-orb between runs.** PRD artifact filenames, CLI invocations, and config references all need updating. Future PRDs should check for tool renames during pre-run verification.
- **Acceptance test fixtures are the gold standard for fix verification.** PRD #179 ported all 8 failing files as fixtures with 8/8 passing. This is more rigorous than prior runs where fixes were verified only by the next full evaluation run.
- **CI acceptance gate config issue persists.** The vitest exclude pattern catches `acceptance-gate.test.ts` in CI. This was tracked in #225 but the latest run still shows "No test files found." Run-6 should verify this is resolved before relying on CI results.

---

## Evaluation Methodology

*Observations about the evaluation approach itself — scoring, agent structure, output formats.*

---

## Rubric-Codebase Mapping Corrections

*Updates needed to `spinybacked-orbweaver/research/rubric-codebase-mapping.md`.*

---

## Schema Decisions

*Decisions about the Weaver schema that affect evaluation scoring.*

---

## Carry-Forward Items

*Unresolved items from prior runs that need to be carried into PRD #7.*
