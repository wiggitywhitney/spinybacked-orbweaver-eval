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
