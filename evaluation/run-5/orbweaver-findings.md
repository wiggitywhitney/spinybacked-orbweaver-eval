# Orbweaver Findings — Run-5

Findings from evaluation run-5 of spinybacked-orbweaver instrumentation agent on commit-story-v2.

Each finding includes priority classification (Critical/High/Medium/Low), recommended action (PRD or Issue), evidence paths, and acceptance criteria.

**Baseline**: Run-4 produced 13 findings (`evaluation/run-4/orb-findings.md`). Run-5 findings build on that baseline, tracking which were resolved, which persist, and what's new.

**Cross-run comparability note**: Run-5 is the first evaluation where SCH-001 through SCH-004 validation fires during the agent's fix loop (PR #173) and where prompt changes affect span naming guidance (PR #175). All prior run SCH scores reflect an agent that never received schema feedback during instrumentation. Score changes in the SCH dimension should be attributed to this infrastructure change, not solely to agent quality improvement.

---

## Resolved from Run-4

*Updated throughout evaluation as findings are confirmed fixed.*

All 13 run-4 findings were filed by the orbweaver AI (none rejected) and merged to main before run-5. Triage was efficient: 4 prompt-guidance findings batched into PR #165, schema evolution + span naming combined in PR #170, validation pipeline addressed via PRD #156.

| Run-4 # | Description | Orbweaver Action | PR | Status |
|---------|-------------|-----------------|-----|--------|
| 1 | Schema evolution broken (format mismatch) | Issue #155 | PR #170 | Merged |
| 2 | Validation pipeline (per-file checks, fix/retry) | PRD #156 | PR #171 | Merged |
| 3 | Expected-condition catches as errors | Issue #157 | PR #165 | Merged (prompt-only) |
| 4 | Schema extension warnings unreadable | Issue #151 | PR #166 | Merged |
| 5 | CLI output doesn't show artifact locations | Issue #152 | PR #167 | Merged |
| 6 | Create draft PR when tests fail | Issue #153 | PR #168 | Merged |
| 7 | LOC-aware test cadence | Folded into PRD #156 | PR #171 | Merged |
| 8 | Skip commit for zero-change files | Issue #160 | PR #164 | Merged |
| 9 | Tracer name defaults to 'unknown_service' | Issue #154 | PR #165 | Merged |
| 10 | Span naming inconsistency | Issue #158 | PR #170 | Merged |
| 11 | Unused OTel imports on zero-span files | Issue #161 | PR #169 | Merged |
| 12 | Over-instrumentation of pure sync functions | Issue #159 | PR #165 | Merged |
| 13 | index.js missing root span | Issue #162 | PR #165 | Merged |

**Handoff process assessment**: The recommendation-document approach worked well. The orbweaver AI right-sized work correctly (downgraded finding #1 from PRD to Issue since the fix was a parser change, kept #2 as PRD since it was a multi-milestone effort). Finding #7 was folded into PRD #156 — correct since both share the same root cause. Three additional issues (#174, #173, #172) were filed for problems discovered during implementation. Total: 13 findings → 13 filings + 3 bonus fixes.

**Finding #3 gap**: Expected-condition catch handling (NDS-005, CDQ-003) was fixed via prompt guidance only — no automated validator exists. If the LLM ignores the guidance, the validation pipeline won't catch it. This is the most likely persistent failure in run-5.

---

## Persistent from Run-4

*Updated throughout evaluation as findings are confirmed still present.*

### Push authentication failure (Run-3 #12, persistent across 3 runs)

- **Priority**: High
- **Recommended Action**: Issue
- **Description**: `git push` failed again with `remote: Invalid username or token. Password authentication is not supported for Git operations.` This is the 3rd consecutive run where push fails despite pre-run `git push --dry-run` succeeding. The orbweaver tool's git context uses HTTPS authentication but the token isn't propagated correctly to the subprocess.
- **Impact**: No PR created. All 3 evaluation runs (3, 4, 5) lost the PR artifact. The `orbweaver-pr-summary.md` local file serves as fallback, but the PR-as-deliverable is never tested.
- **Evidence**: `evaluation/run-5/orbweaver-output.log`, final output section.
- **Run-5 Status**: CONFIRMED PERSISTENT. Pre-run `git push --dry-run` used SSH (which works), but orbweaver's subprocess uses HTTPS.
- **Acceptance Criteria**: Either (a) configure orbweaver to use SSH for push, (b) accept GITHUB_TOKEN from environment and use token-based HTTPS auth, or (c) accept a `--push-command` override.

---

## New Findings

*Added throughout evaluation as new issues are discovered.*

### PRE-1: npm package name collision

- **Priority**: Medium
- **Recommended Action**: Issue
- **Description**: `npx orbweaver` resolves to an unrelated webcrawler package ([punkave/orbweaver](https://github.com/punkave/orbweaver), v0.1.4 on npm). Running `npx orbweaver instrument` executes the wrong binary. The spinybacked-orbweaver package's `bin` entry maps `orbweaver` → `bin/orbweaver.js`, but the package name is `spinybacked-orbweaver`, not `orbweaver`.
- **Impact**: Anyone following documentation that says `npx orbweaver` will run the wrong tool. The smoke test initially failed for this reason.
- **Evidence**: `npm view orbweaver` returns the punkave webcrawler. Our smoke test pulled v0.1.4 from npm instead of the local build.
- **Acceptance Criteria**: Either (a) publish under a scoped name (`@wiggitywhitney/orbweaver`), (b) change the bin name to `spinybacked-orbweaver`, or (c) document that `npx orbweaver` does NOT work and users must use the local binary path.

### PRE-2: Schema extension namespace enforcement rejects span-type extensions

- **Priority**: Low
- **Recommended Action**: Issue (investigate)
- **Description**: Smoke test output showed: "Warning: Schema extensions rejected by namespace enforcement: span:commit_story.commit.get_changed_files, span:commit_story.commit.is_merge_commit, span:commit_story.commit.get_commit_metadata". These span names DO have the correct `commit_story.*` namespace prefix but were still rejected. May indicate that span-type extensions are handled differently from attribute-type extensions in the namespace filter.
- **Impact**: Rejected span extensions may reduce schema coverage scores. Not blocking — these are warnings, not failures.
- **Evidence**: Smoke test output on `orbweaver/instrument-1773704681144` branch.

### RUN-1: SCH-002 validation causes oscillation failures

- **Priority**: High
- **Recommended Action**: Issue
- **Description**: index.js failed with "Oscillation detected during fresh regeneration: Error count increased for SCH-002: 9 → 12". The fix/retry loop detected that the agent's correction attempt made SCH-002 violations worse, not better. The agent adds attributes that don't match the schema, gets told to fix them, and creates even more non-compliant attributes in the retry.
- **Impact**: index.js is the application entry point — losing root span instrumentation here is the COV-001 regression from run-4. The oscillation detection correctly prevents infinite loops but doesn't help the agent converge.
- **Evidence**: `evaluation/run-5/orbweaver-output.log` file 15, `evaluation/run-5/orbweaver-pr-summary.md` advisory findings.
- **Investigation needed**: Confirm the resolved schema (with agent-extensions.yaml merged) is actually being passed to the agent during retries. If the agent is instrumenting against the base schema without its own extensions, it would explain why it can't satisfy SCH-002. Also check whether the application entry point (index.js) has special instrumentation needs that a generic file-level approach can't handle.
- **Acceptance Criteria**: The fix/retry loop should either (a) provide more specific guidance about which attribute names are rejected and what the valid alternatives are, (b) accept partial schema compliance (commit non-violating spans, skip violating ones) rather than failing the entire file, or (c) switch to function-by-function instrumentation mode instead of whole-file mode — this gives the agent more refined per-function feedback and produces partial output even when some functions can't satisfy validation.

### RUN-2: Validation pipeline causes net regression in file coverage

- **Priority**: High
- **Recommended Action**: PRD (use failed files as test cases)
- **Description**: Run-5 committed 9 files vs run-4's 16 files — a 44% regression in instrumented file coverage. The validation pipeline (run-4 finding #2, PRD #156) correctly catches quality issues but causes 6 files to become "partial" (uncommitted) and 2 to "fail" outright. Files that previously "succeeded" (journal-graph, summary-manager, summary-detector, index.js, summarize.js) now fail because SCH-002 validation was silent in run-4 but active in run-5.
- **Impact**: The validation pipeline traded coverage for quality — fewer files instrumented but those that are instrumented pass validation. The next full evaluation run should not happen until these problematic files can be consistently instrumented properly by the software.
- **Evidence**: Compare `evaluation/run-5/orbweaver-output.md` vs run-4 per-file results. Partial diffs saved in `evaluation/run-5/partial-diffs/`.
- **Recommended approach**: Port the 8 failed/partial files (summarize.js, index.js, journal-graph.js, summary-graph.js, sensitive-filter.js, journal-manager.js, summary-manager.js, summary-detector.js) into the orbweaver test suite as acceptance criteria. Refine the software until these files are consistently instrumented completely and correctly. Also test that PRs are consistently created as part of this effort. Do not run another full evaluation until these files pass consistently.
- **Acceptance Criteria**: All 8 problematic files pass orbweaver's instrumentation pipeline consistently (multiple runs, not just once). PR creation works end-to-end.

### RUN-3: Summary tally omits partial files

- **Priority**: Low
- **Recommended Action**: Issue
- **Description**: stdout summary reports "21 succeeded, 2 failed, 0 skipped" (23/29 files), omitting the 6 partial files. The PR summary correctly reports all three categories (21 success, 2 failed, 6 partial). The stdout discrepancy could confuse operators monitoring the run.
- **Impact**: Cosmetic — PR summary is correct. But operators watching stdout would miss 6 files.
- **Evidence**: `evaluation/run-5/orbweaver-output.log` final summary vs PR summary.
- **Acceptance Criteria**: stdout final tally should include partial count: "21 succeeded, 2 failed, 6 partial, 0 skipped".

### RUN-4: Extended run duration from validation retries

- **Priority**: Medium
- **Recommended Action**: Issue (investigate)
- **Description**: Run-5 took significantly longer than run-4 (~80 min). The validation/retry loop adds multiple LLM calls per file — each retry involves a full re-analysis. Complex files (summary-graph, summary-manager) took 10+ minutes each going through retries before giving up.
- **Impact**: Longer runs cost more (multiple LLM calls per retry) and reduce iteration speed.
- **Evidence**: `evaluation/run-5/orbweaver-output.log` timestamps. Run started 2026-03-17T00:14:59Z, completed overnight.
- **Acceptance Criteria**: Add retry budget configuration (max retries, max time per file) and report retry count in per-file output. Consider a fast-fail mode that skips retries for files with > N validation errors.

### RUN-5: No timestamps in orbweaver output

- **Priority**: Low
- **Recommended Action**: Issue
- **Description**: Orbweaver does not emit start/end timestamps or per-file durations in its stdout or PR summary. Run-5's end time was lost because the external process recording timestamps required manual approval that came hours after completion.
- **Impact**: Evaluation runs cannot accurately report wall-clock duration or per-file processing time, making it harder to measure the cost of validation retries or detect performance regressions.
- **Evidence**: `evaluation/run-5/orbweaver-output.md` — start time recorded externally, end time marked as "indeterminate."
- **Acceptance Criteria**: Orbweaver output should include: (a) run start/end timestamps, (b) per-file start/end timestamps or duration, (c) retry count per file. These should appear in both stdout and the PR summary.

---

## Carry-Forward from Prior Runs

| Item | Origin | Run-5 Status |
|------|--------|-------------|
| Run-3 #3: Zero-span files give no reason in CLI | Run-3 | Likely fixed — zero-span files show "success (0 spans)" in verbose output |
| Run-3 #4: NDS-003 blocks instrumentation-motivated refactors | Run-3 | Open — design tension, not a bug |
| Run-3 #12: Push validation (read access ≠ push access) | Run-3 | **CONFIRMED PERSISTENT** — push failed again (see Persistent section above) |
| spinybacked-orbweaver #62: CJS require() in ESM projects | Run-2 | Open (spec gap) |
| spinybacked-orbweaver #63: Elision/null output bypass retry loop | Run-2 | Likely improved — PRD #156 added fix/retry logic, but untested directly |
| spinybacked-orbweaver #66-69: Spec gaps | Run-2 | Open |
