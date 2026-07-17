// ABOUTME: Process observations from run-26 to inform PRD #27 template and milestone drafting.
# Lessons for PRD #27 — commit-story-v2 Run-26

Process observations captured during run-26. Populated incrementally as the run progresses.

## Target-Specific Findings

*(Findings specific to commit-story-v2 that do not belong in the template)*

## Generalizable Process Improvements

*(Observations about the eval process itself that may warrant template updates)*

- **"0 attributes" in the run summary means 0 NEW schema attributes, not 0 attributes used.** Carried forward from taze run-16 via the Step 0.5 cross-run process review: a file that calls `setAttribute`/`setAttributes`/span-start `attributes` maps/wrapper helpers using only already-registered attributes reports "N spans, 0 attributes" — the count tracks new schema registrations, not total attribute usage. Already added to `docs/language-extension-plan.md` step 9 and cascaded to PRD #144 and PRD #147; note here only if run-26 surfaces a commit-story-v2-specific angle on this (e.g., a false "attribute absent" finding during Findings Discussion or per-file evaluation).

## Pre-Run Observations
