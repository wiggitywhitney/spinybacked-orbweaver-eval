<!-- ABOUTME: Process observations from run-16 to inform PRD #147 template and milestone drafting. -->
# Lessons for PRD #147 — taze Run-16

Process observations captured during run-16. Populated incrementally as the run progresses.

## Target-Specific Findings

*(Findings specific to taze that do not belong in the template)*

### process.exit() in interactive.ts is a structural CDQ-001 advisory — root cause fix belongs in spiny-orb

`interactive.ts` has keypress handlers that call `process.exit()` directly. This bypasses the `finally` block, leaking spans for that execution path. The spiny-orb agent correctly placed `span.end()` inside the `finally` block, which covers the normal exit path. The process.exit() paths represent a CDQ-001 advisory finding — structurally correct instrumentation, but spans will be lost when those code paths execute.

**Root cause fix location**: The real fix belongs in spiny-orb's `instrumentation.js` template. The template should override `process.exit()` to call `sdk.shutdown()` first before exiting. This is a target-agnostic problem — any CLI that calls `process.exit()` directly will exhibit the same span leakage. This is not a taze-specific fix.

**For PRD #147**: Document this as a CDQ-001 advisory in the per-file evaluation and actionable-fix output. Do not attempt to fix it at the taze level.

### SCH-003 String() cast is inconsistent across workspace files

`checkGlobal.ts` and `bunWorkspaces.ts` both use `String(count)` when setting int-typed attributes (`taze.package.deps_count` and `taze.catalog.count` respectively). The same attributes are used correctly (raw int, no cast) in `pnpmWorkspaces.ts` and `yarnWorkspaces.ts`. This inconsistency within the same run suggests the agent made a type decision early and applied it inconsistently across files processed in different invocations.

**For PRD #147**: If a fix lands in spiny-orb between now and run-17, watch whether the pattern resolves across all four workspace files, not just one.

## Generalizable Process Improvements

*(Observations about the eval process itself that may warrant template updates)*

### Per-file evaluation must use the D-2 parallel subagent approach — one agent per file, 5 in parallel

During run-16, the per-file evaluation was initially written as a single-pass sequential document without spawning subagents (Decision 6 in PRD #146). Whitney identified this as incorrect. The correct process:

- Spawn one subagent per committed file
- Run in batches of 5 in parallel
- Each subagent independently reads: the instrumented .ts file, the Agent thinking + Agent notes blocks from the log, the companion .instrumentation.md, the run-15 baseline entry, and the rubric

**Why this matters**: Sequential single-pass analysis is vulnerable to anchoring (earlier findings bias later ones) and misses cross-file patterns that parallel independent evaluation can surface. The run-17 validated this: 16 parallel agents found gaps that 8+ sequential runs missed.

### spiny-orb-output.log is the primary source of agent reasoning — debug-dumps is empty when all files succeed

`--debug-dump-dir` only writes dumps for **failed**, **partial**, and **zero-span** files. When all files succeed (as in run-16), the debug-dumps directory is entirely empty. The `Agent thinking` and `Agent notes` blocks in `spiny-orb-output.log` are the only source of agent reasoning for successful files.

**Log extraction pattern**: Each file's section is bounded by `Processing file N of M: src/path/to/file.ts` at the start and the next `Processing file` line at the end (run-16 had 33 total files; M will differ in later runs). Use `grep -n "Processing file" spiny-orb-output.log` to find the line numbers, then extract the section between them.

**Per-file agents must read the log**: Before concluding any per-file evaluation, each subagent must read the Agent thinking and Agent notes blocks for that file from the log — not just the committed code and companion .instrumentation.md. The thinking blocks reveal rejected alternatives, constraint reasoning, and why specific instrumentation choices were made.

### The deleted per-file-evaluation.md was written in single-pass mode — do not restore or extend it

An earlier attempt at per-file evaluation for run-16 was written as a single sequential document without subagents or log evidence. That file was deliberately deleted. A cold AI must not restore, extend, or reference it. The per-file evaluation for run-16 is still pending — it must be written using the D-2 protocol (parallel subagents, log as primary evidence).

## Pre-Run Observations

*(Populated during pre-run verification)*

- **Run-16 environment**: spiny-orb SHA `8a08f5b`, Node v25.8.0, pnpm 10.33.0
- **SCH-003 pre-run decision**: `taze.io.catalogs_found` is absent from taze fork main (was only written to run-15 instrument branch, which never merged). Left absent intentionally — run-16 tests whether agent independently infers `type: int` for a count attribute on a second encounter.
- **#954 and #958 status**: Both open at run-16 start. Primary goal is debug dump capture to enable #954 investigation, not fix verification.

## Post-Run Observations

- **resolves.ts recovery**: 6 spans committed in run-16 (0 in run-15 due to oscillation). Root cause of run-15 oscillation is still unknown — issues #954 and #958 remain open.
- **IS score**: 88.9/100. SPA-001 is structural for a CLI app (INTERNAL span count scales with package collection size) and is marked `not_applicable` for taze.
- **SCH-003 inconsistency**: `String()` cast on int-typed attributes appears in `checkGlobal.ts` and `bunWorkspaces.ts` but not in `pnpmWorkspaces.ts` or `yarnWorkspaces.ts` for the same attribute pattern. This is a within-run inconsistency.
- **CDQ-006 recovery**: 0 violations in run-16 (down from 5 in run-15). All files in run-16 correctly use `isRecording` guards or avoid the patterns that triggered violations.

## Deep-Dive Process Observations

### Always check all artifacts during failure deep-dives — not just the summary log

The run output log, companion `.instrumentation.md` files, debug dumps, and the actual committed code on the instrument branch each contain distinct information. The summary log shows high-level outcomes; the `.instrumentation.md` files show validation journey and agent thinking for every file (including successful ones); the committed code is the ground truth for what was actually written. During run-16 deep-dives, reading `.instrumentation.md` files from the instrument branch surfaced CDQ-006 placement decisions, NDS-003 constraint handling in interactive.ts, and the SCH-003 String() cast pattern — none of which were visible from the log summary alone.

**Process**: Before concluding a deep-dive on any file, read: (1) the log excerpt for that file, (2) the committed code from the instrument branch, (3) the companion `.instrumentation.md` file from the instrument branch.

### "0 attributes" in spiny-orb run output means 0 NEW schema attributes, not 0 attributes used

When spiny-orb reports "N spans, 0 attributes" for a file, it means the file added 0 new attribute keys to the schema — not that it uses 0 attributes. Files using only pre-registered attributes (e.g., `taze.config.sources_found`, `taze.cache.hit`) report "0 attributes" even if they call `span.setAttribute` multiple times. This caused a false "attribute still absent" finding for config.ts during the Findings Discussion checkpoint in run-16 — the attribute was present in the code but the "0 attrs" label was misread as absence.

**Recommendation for spiny-orb**: Consider changing the run output to show both new attributes AND total attributes used — e.g., "1 span, 3 attributes used (0 new)" — to prevent this confusion. Filed as an observation for the spiny-orb team.

**Process for evaluators**: When assessing attribute coverage for a committed file, always read the committed code on the instrument branch (`git show <branch>:<path> | grep setAttribute`) rather than relying on the run summary "0 attributes" count.
