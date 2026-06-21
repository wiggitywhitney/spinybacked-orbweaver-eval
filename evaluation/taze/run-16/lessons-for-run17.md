<!-- ABOUTME: Process observations from run-16 to inform PRD #147 template and milestone drafting. -->
# Lessons for PRD #147 — taze Run-16

Process observations captured during run-16. Populated incrementally as the run progresses.

## Target-Specific Findings

*(Findings specific to taze that do not belong in the template)*

## Generalizable Process Improvements

*(Observations about the eval process itself that may warrant template updates)*

## Pre-Run Observations

*(Populated during pre-run verification)*

- **Run-16 environment**: spiny-orb SHA `8a08f5b`, Node v25.8.0, pnpm 10.33.0
- **SCH-003 pre-run decision**: `taze.io.catalogs_found` is absent from taze fork main (was only written to run-15 instrument branch, which never merged). Left absent intentionally — run-16 tests whether agent independently infers `type: int` for a count attribute on a second encounter.
- **#954 and #958 status**: Both open at run-16 start. Primary goal is debug dump capture to enable #954 investigation, not fix verification.

## Post-Run Observations

*(Populated after spiny-orb instrument completes)*

## Deep-Dive Process Observations

### Always check all artifacts during failure deep-dives — not just the summary log

The run output log, companion `.instrumentation.md` files, debug dumps, and the actual committed code on the instrument branch each contain distinct information. The summary log shows high-level outcomes; the `.instrumentation.md` files show validation journey and agent thinking for every file (including successful ones); the committed code is the ground truth for what was actually written. During run-16 deep-dives, reading `.instrumentation.md` files from the instrument branch surfaced CDQ-006 placement decisions, NDS-003 constraint handling in interactive.ts, and the SCH-003 String() cast pattern — none of which were visible from the log summary alone.

**Process**: Before concluding a deep-dive on any file, read: (1) the log excerpt for that file, (2) the committed code from the instrument branch, (3) the companion `.instrumentation.md` file from the instrument branch.

### "0 attributes" in spiny-orb run output means 0 NEW schema attributes, not 0 attributes used

When spiny-orb reports "N spans, 0 attributes" for a file, it means the file added 0 new attribute keys to the schema — not that it uses 0 attributes. Files using only pre-registered attributes (e.g., `taze.config.sources_found`, `taze.cache.hit`) report "0 attributes" even if they call `span.setAttribute` multiple times. This caused a false "attribute still absent" finding for config.ts during the Findings Discussion checkpoint in run-16 — the attribute was present in the code but the "0 attrs" label was misread as absence.

**Recommendation for spiny-orb**: Consider changing the run output to show both new attributes AND total attributes used — e.g., "1 span, 3 attributes used (0 new)" — to prevent this confusion. Filed as an observation for the spiny-orb team.

**Process for evaluators**: When assessing attribute coverage for a committed file, always read the committed code on the instrument branch (`git show <branch>:<path> | grep setAttribute`) rather than relying on the run summary "0 attributes" count.
