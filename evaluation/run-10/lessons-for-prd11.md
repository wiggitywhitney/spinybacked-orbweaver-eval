# Lessons for PRD #11 — Collected During Run-10

Process lessons and methodology improvements observed during run-10 evaluation. These inform the next evaluation run's PRD.

Separate from spiny-orb software findings (see `spiny-orb-findings.md`).

## Pre-Run Verification

1. **Handoff triage completeness**: The spiny-orb team addressed 7/7 items (5 findings + 2 additional). Zero rejected. This is the second consecutive run with 100% triage acceptance. The actionable-fix-output format is validated as an effective handoff mechanism.

2. **File parity**: commit-story-v2 proper has 30 .js files (same as run-9). 29 will be processed (instrumentation.js excluded).

3. **Push auth mechanism change**: Remote URL swap approach (set pushurl in git config) replaces direct URL-as-argument push. Diagnostic logging at both validation time and push time should make failure mode immediately clear.

4. **Reassembly validator fix is deterministic**: Unlike journal-graph.js "non-determinism" in runs 7-8, the root cause was identified (extensions not passed to reassembly validation) and fixed with a code change. Prediction: journal-graph.js should commit on first attempt.

5. **spiny-orb build**: v0.1.0 from main (75dcea6). Built from main branch (verified).

## Evaluation Run

_Observations appended during milestone 3._

## Per-File Evaluation

_Observations appended during milestone 5._

## PR Evaluation

_Observations appended during milestone 6._

## Scoring & Comparison

_Observations appended during milestones 7-8._

## Actionable Fix Output

_Observations appended during milestone 9._
