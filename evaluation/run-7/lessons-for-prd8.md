# Lessons for PRD #8 — Run-7

Forward-looking improvements identified during evaluation run-7. These feed directly into PRD #8 (run-8 evaluation).

---

## Rubric Gaps

*(Gaps in the 32-rule rubric discovered during run-7 evaluation)*

## Process Improvements

- **Verbose output truncates critical information.** The `--verbose` per-file output shows "... and N more notes" after a few reasoning notes, but the most important information (pass/fail status, span count) is buried or truncated. The tally line (committed/spans) should appear FIRST in the per-file summary, before reasoning notes. Reasoning notes are secondary. Filing as spiny-orb finding.
- **Rule codes are opaque in user-facing output.** Codes like RST-004, RST-001, COV-004 appear in notes without explanation. Users can't interpret agent decisions. Every code needs a human-readable label.
- **No user-facing documentation exists.** The repo has no docs explaining rules, architecture, or how to interpret output. The evaluation rubric is internal. Users need a rules reference, architecture overview, and output interpretation guide.

## Evaluation Methodology

*(Changes to the evaluation approach itself)*

## Rubric-Codebase Mapping Corrections

*(Updates needed to rubric-codebase-mapping.md)*

## Schema Decisions

- **PRD assumed registry expansion; spiny-orb team chose validator tolerance instead.** PRD #7 expected ≥8 span definitions added to the Weaver registry. The actual fix (PRs #234, #239) took a different approach: sparse-registry detection (<3 spans → SCH-001/SCH-002 downgrade to advisory) + declared-extension passthrough. The registry still has 0 span definitions. Run-7 tests whether the agent produces semantically correct span names when inventing them.
- **Evaluation reframing**: SCH-001 is no longer a blocking validator error. The quality question shifts from "does the agent use registered names?" to "does the agent choose good names on its own?" This affects per-file evaluation step 9 (semantic quality check).

## Carry-Forward Items

*(Items from prior runs that remain unresolved after run-7)*
