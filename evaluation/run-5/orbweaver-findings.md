# Orbweaver Findings — Run-5

Findings from evaluation run-5 of spinybacked-orbweaver instrumentation agent on commit-story-v2.

Each finding includes priority classification (Critical/High/Medium/Low), recommended action (PRD or Issue), evidence paths, and acceptance criteria.

**Baseline**: Run-4 produced 13 findings (`evaluation/run-4/orb-findings.md`). Run-5 findings build on that baseline, tracking which were resolved, which persist, and what's new.

**Cross-run comparability note**: Run-5 is the first evaluation where SCH-001 through SCH-004 validation fires during the agent's fix loop (PR #173) and where prompt changes affect span naming guidance (PR #175). All prior run SCH scores reflect an agent that never received schema feedback during instrumentation. Score changes in the SCH dimension should be attributed to this infrastructure change, not solely to agent quality improvement.

### Supporting Documentation

All evidence referenced below lives in the eval repo on branch `feature/prd-5-evaluation-run-5`.

**Eval repo root**: `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval`
**Orbweaver repo root**: `/Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver`

Paths in this document are relative to the eval repo root unless otherwise noted.

| Document | Path | What it contains |
|----------|------|-----------------|
| Failure deep-dives | `evaluation/run-5/failure-deep-dives.md` | Root cause analysis for each failed/partial file, systemic patterns, failure trajectories |
| Orbweaver output log | `evaluation/run-5/orbweaver-output.md` | Per-file results, schema evolution status, run-level issues |
| PR summary | `evaluation/run-5/orbweaver-pr-summary.md` | Full agent output: per-file table, agent notes, advisory findings, token usage |
| Partial diffs | `evaluation/run-5/partial-diffs/*.diff` | Working tree diffs for 5 partial files (not committed to orbweaver branch) |
| Per-file evaluation | `evaluation/run-5/per-file-evaluation.json` | Canonical per-file rubric results (when complete) |
| Evaluation methodology | `evaluation/run-5/evaluation-methodology.md` | Rubric clarifications and scoring rules for run-5 |
| Lessons for PRD #6 | `evaluation/run-5/lessons-for-prd6.md` | Process improvements, methodology observations, carry-forward items |
| Orbweaver branch | `orbweaver/instrument-1773706515431` | The actual instrumented code (9 committed files) |
| Evaluation rubric | `spinybacked-orbweaver/research/evaluation-rubric.md` (orbweaver repo) | 32-rule rubric used for evaluation |
| Rubric-codebase mapping | `spinybacked-orbweaver/research/rubric-codebase-mapping.md` (orbweaver repo) | Maps rubric rules to orbweaver source code |

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
- **Impact**: index.js is the application entry point — losing root span instrumentation here is the COV-001 regression from run-4. The oscillation detection correctly prevents infinite loops but doesn't help the agent converge. **Additionally, entry point failure silently degrades live-check** — see DEEP-6.
- **Evidence**: `evaluation/run-5/orbweaver-output.log` file 15, `evaluation/run-5/orbweaver-pr-summary.md` advisory findings. Root cause analysis: `evaluation/run-5/failure-deep-dives.md` failed file section 2 and systemic root cause section 4.
- **Investigation needed**: Confirm the resolved schema (with agent-extensions.yaml merged) is actually being passed to the agent during retries. If the agent is instrumenting against the base schema without its own extensions, it would explain why it can't satisfy SCH-002. Also check whether the application entry point (index.js) has special instrumentation needs that a generic file-level approach can't handle.
- **Acceptance Criteria**: The fix/retry loop should either (a) provide more specific guidance about which attribute names are rejected and what the valid alternatives are, (b) accept partial schema compliance (commit non-violating spans, skip violating ones) rather than failing the entire file, (c) switch to function-by-function instrumentation mode instead of whole-file mode — this gives the agent more refined per-function feedback and produces partial output even when some functions can't satisfy validation, or (d) use a two-pass approach: first pass registers schema extensions, second pass validates against the extended schema (avoids the chicken-and-egg problem where extensions can't be registered because validation blocks the first attempt).

### RUN-2: Validation pipeline causes net regression in file coverage

- **Priority**: High
- **Recommended Action**: PRD (use failed files as test cases)
- **Description**: Run-5 committed 9 files vs run-4's 16 files — a 44% regression in instrumented file coverage. The validation pipeline (run-4 finding #2, PRD #156) correctly catches quality issues but causes 6 files to become "partial" (uncommitted) and 2 to "fail" outright. Files that previously "succeeded" (journal-graph, summary-manager, summary-detector, index.js, summarize.js) now fail because SCH-002 validation was silent in run-4 but active in run-5.
- **Impact**: The validation pipeline traded coverage for quality — fewer files instrumented but those that are instrumented pass validation. The next full evaluation run should not happen until these problematic files can be consistently instrumented properly by the software.
- **Evidence**: Compare `evaluation/run-5/orbweaver-output.md` vs run-4 per-file results. Partial diffs saved in `evaluation/run-5/partial-diffs/`. Full analysis: `evaluation/run-5/failure-deep-dives.md` (all 8 files analyzed with run-4→run-5 trajectories).
- **Recommended approach**: Port the 8 failed/partial files (summarize.js, index.js, journal-graph.js, summary-graph.js, sensitive-filter.js, journal-manager.js, summary-manager.js, summary-detector.js) into the orbweaver test suite as acceptance criteria. Refine the software until these files are consistently instrumented completely and correctly. Also test that PRs are consistently created as part of this effort. Do not run another full evaluation until these files pass consistently.
- **Acceptance Criteria**: All 8 problematic files pass orbweaver's instrumentation pipeline consistently (multiple runs, not just once). PR creation works end-to-end.

### RUN-3: Summary tally omits partial files

- **Priority**: Low
- **Recommended Action**: Issue
- **Description**: stdout summary reports "21 succeeded, 2 failed, 0 skipped" (23/29 files), omitting the 6 partial files. The PR summary correctly reports all three categories (21 success, 2 failed, 6 partial). The stdout discrepancy could confuse operators monitoring the run.
- **Impact**: Cosmetic — PR summary is correct. But operators watching stdout would miss 6 files.
- **Evidence**: `evaluation/run-5/orbweaver-output.log` final summary vs PR summary. See also `evaluation/run-5/failure-deep-dives.md` run-level failures section.
- **Acceptance Criteria**: stdout final tally should include partial count: "21 succeeded, 2 failed, 6 partial, 0 skipped".

### RUN-4: Extended run duration from validation retries

- **Priority**: Medium
- **Recommended Action**: Issue (investigate)
- **Description**: Run-5 took significantly longer than run-4 (~80 min). The validation/retry loop adds multiple LLM calls per file — each retry involves a full re-analysis. Complex files (summary-graph, summary-manager) took 10+ minutes each going through retries before giving up.
- **Impact**: Longer runs cost more (multiple LLM calls per retry) and reduce iteration speed.
- **Evidence**: `evaluation/run-5/orbweaver-output.log` timestamps. Run started 2026-03-17T00:14:59Z, completed overnight. Cost comparison: `evaluation/run-5/failure-deep-dives.md` extended run duration section.
- **Acceptance Criteria**: Add retry budget configuration (max retries, max time per file) and report retry count in per-file output. Consider a fast-fail mode that skips retries for files with > N validation errors.

### RUN-5: No timestamps in orbweaver output

- **Priority**: Low
- **Recommended Action**: Issue
- **Description**: Orbweaver does not emit start/end timestamps or per-file durations in its stdout or PR summary. Run-5's end time was lost because the external process recording timestamps required manual approval that came hours after completion.
- **Impact**: Evaluation runs cannot accurately report wall-clock duration or per-file processing time, making it harder to measure the cost of validation retries or detect performance regressions.
- **Evidence**: `evaluation/run-5/orbweaver-output.md` — start time recorded externally, end time marked as "indeterminate."
- **Acceptance Criteria**: Orbweaver output should include: (a) run start/end timestamps, (b) per-file start/end timestamps or duration, (c) retry count per file. These should appear in both stdout and the PR summary.

### DEEP-1: COV-003 validator lacks expected-condition catch exemption

- **Priority**: High
- **Recommended Action**: Issue
- **Description**: COV-003 requires `span.recordException()` + `span.setStatus({code: ERROR})` on ALL catch blocks within spans, with no exemption for expected-condition catches (file-not-found, empty directories, graceful degradation returns). This forces the agent into a lose-lose: comply with COV-003 → produce NDS-005b violations (expected conditions recorded as errors, polluting metrics), or comply with NDS-005b → fail validation entirely. Five of 8 problematic files in run-5 are affected by this single conflict.
- **Impact**: Dominant failure pattern in run-5. Causes partial status on summary-graph.js (1 function), journal-manager.js (1 function), summary-manager.js (multiple functions), summary-detector.js (1 function), and contributes to summarize.js failure.
- **Evidence**: `evaluation/run-5/failure-deep-dives.md` systemic root causes section 1. Partial diffs show NDS-005b violations in committed code where agent complied with COV-003 on expected-condition catches.
- **Acceptance Criteria**: COV-003 validator should classify catch blocks as expected-condition vs genuine-error. Expected-condition catches (identified by: return default value, continue loop, catch without rethrow for file/directory operations) should be exempt from error recording requirements.

### DEEP-2: Function-level fallback generates corrupted imports

- **Priority**: Medium
- **Recommended Action**: Issue
- **Description**: The function-level fallback's code generation produces corrupted import statements (`imimport` instead of `import` in summary-manager.js generateAndSaveMonthlySummary) and loses module context (NDS-003 "original line 1 missing/modified" on 3 other functions in summary-manager.js). The fallback generates self-contained function code that doesn't preserve the module's import structure. Additionally, the whole-file instrumentation path places `const tracer = trace.getTracer('commit-story')` between import statements — an ES module syntax error (all imports must precede other statements). CodeRabbit CLI review flagged this in summary-manager.diff lines 9-14.
- **Impact**: 4 of 5 failed functions in summary-manager.js are caused by fallback code generation issues. The import ordering error affects whole-file output for summary-manager.js.
- **Evidence**: `evaluation/run-5/orbweaver-pr-summary.md` function-level fallback results for summary-manager.js. `evaluation/run-5/partial-diffs/summary-manager.diff` lines 9-14 (import ordering). `evaluation/run-5/failure-deep-dives.md` partial file section 7.
- **Acceptance Criteria**: Function-level fallback generates syntactically valid code that preserves the module's import structure. Whole-file instrumentation places tracer initialization after all imports. No LINT failures from synthesis errors.

### DEEP-2b: Function-level fallback only processes exported functions

- **Priority**: Medium
- **Recommended Action**: Issue (evaluate alongside DEEP-2)
- **Description**: When whole-file instrumentation fails and the function-level fallback activates, it only retries exported functions individually. Non-exported functions that were instrumentation targets in the whole-file attempt are silently dropped. In journal-graph.js, this reduced coverage from 4 spans (generateJournalSections + summaryNode + technicalNode + dialogueNode) to 1 span (only the exported generateJournalSections). The 3 internal LangGraph node functions are high diagnostic value targets but are lost in fallback. Additionally, the fallback processes functions where the expected outcome is 0 spans (e.g., sensitive-filter.js redactSensitiveData) — wasting retries and producing failures on functions that don't need instrumentation.
- **Impact**: journal-graph.js regressed from 4 spans (run-4) to 1 span (run-5) solely due to fallback scope. Sensitive-filter.js shows as "partial" despite the correct outcome being 0 spans.
- **Evidence**: `evaluation/run-5/orbweaver-pr-summary.md` — journal-graph.js "Function-level fallback: 1/1 functions instrumented" (only exported). sensitive-filter.js "Function-level fallback: 2/3 functions" (failure on a zero-span target). `evaluation/run-5/failure-deep-dives.md` sections 3 and 5.
- **Acceptance Criteria**: (a) Function-level fallback includes non-exported functions that were instrumentation targets in the whole-file attempt. (b) Fallback skips functions where the expected outcome is 0 spans (no instrumentation needed).

### DEEP-3: NDS-005b violations in committed code from COV-003 compliance

- **Priority**: Medium
- **Recommended Action**: Issue (evaluate alongside DEEP-1)
- **Description**: When the agent CAN satisfy COV-003, it adds `span.recordException()` and `span.setStatus({code: ERROR})` on expected-condition catches in committed code, producing NDS-005b violations. The agent notes claim these aren't added, but the actual diffs show they are. Files affected: journal-manager.js (file-not-found catch), summary-manager.js (5 access/readdir/readFile expected-condition catches), summary-detector.js (2 readdir expected-condition catches).
- **Impact**: Committed instrumentation will generate false error signals in production traces when normal conditions occur (e.g., file doesn't exist yet, directory is empty). This pollutes error metrics and creates noise in observability tools.
- **Evidence**: Partial diffs in `evaluation/run-5/partial-diffs/` — journal-manager.diff lines 127-129, summary-manager.diff lines 69-71/197-199/325-327/351-353/428-430, summary-detector.diff lines 62-65/81-83. **Independently validated by CodeRabbit CLI review**, which flagged 9 NDS-005b violations in the same partial diffs.
- **Acceptance Criteria**: Agent should not add error recording on catch blocks it classifies as expected-condition handlers, even when COV-003 validator would accept it. Fixing DEEP-1 (validator exemption) would also resolve this, since the agent would no longer need to comply with COV-003 on these catches.

### DEEP-4: Duplicate JSDoc comments in instrumented output

- **Priority**: Low
- **Recommended Action**: Issue
- **Description**: All partial diffs show duplicate JSDoc blocks — the agent generates a new JSDoc comment above each function and also preserves the original, resulting in two identical comment blocks per function. This is cosmetic but increases file size and creates maintenance confusion.
- **Impact**: Cosmetic. Does not affect functionality or test results.
- **Evidence**: All 5 partial diffs in `evaluation/run-5/partial-diffs/`.
- **Acceptance Criteria**: Instrumented output should have exactly one JSDoc block per function — either the original preserved or a replacement, not both.

### DEEP-5: SDK init file detection should skip library projects

- **Priority**: Low
- **Recommended Action**: Issue
- **Description**: Orbweaver generates `orbweaver-instrumentations.js` (SDK init fallback) because it can't find a recognized NodeSDK init pattern. But commit-story-v2 is a library — libraries should not initialize the OTel SDK. The tool should detect library projects (check for `peerDependencies` on `@opentelemetry/api` in package.json) and skip SDK init file detection.
- **Impact**: Low — the fallback file is generated but not wired into the project. Actual OTel API imports work correctly.
- **Evidence**: `evaluation/run-5/orbweaver-output.md` run-level issues section 4.
- **Acceptance Criteria**: Orbweaver detects library vs application projects and skips SDK init file detection for libraries.

### DEEP-6: Entry point file needs special handling — live-check depends on it

- **Priority**: High
- **Recommended Action**: Issue (or fold into RUN-1/RUN-2 PRD)
- **Description**: The entry point file (index.js for applications, main export for libraries) is a single point of failure for live-check validation. When it fails instrumentation, orbweaver restores the original file, tests run against uninstrumented code, and live-check reports "OK" — silently degrading from meaningful validation to a no-op. In run-5, index.js failed due to SCH-002 oscillation, and live-check reported "OK" despite having no telemetry from the primary code path. The entry point also affects other instrumented files: without a root span, child spans from other files lack parent context and test-driven telemetry coverage drops.
- **Impact**: Live-check compliance is unreliable whenever the entry point fails. Run-5's "Live-Check Compliance: OK" is misleading — it should report "DEGRADED" or "INCOMPLETE." Note: even with working live-check, it cannot catch NDS-005b violations — `recordException()` on expected-condition catches produces structurally valid OTel that Weaver's schema compliance check accepts. NDS-005b requires semantic judgment (the LLM judge in `src/validation/tier2/nds005.ts` handles this during static validation, but it's not connected to live-check output). A future post-run trace analysis checking for "error spans on normal code paths" could complement the static judge with runtime evidence.
- **Evidence**: `evaluation/run-5/orbweaver-pr-summary.md` — "Live-Check Compliance: OK" despite index.js FAILED status. Live-check implementation in `src/coordinator/live-check.ts` has no cross-reference to per-file instrumentation results.
- **Recommended approach** (in priority order — try each before escalating):
  1. **Per-function handling**: Entry point gets function-level fallback with its functions prioritized. If `main()` can be instrumented with just a root span but `handleSummarize()` fails on SCH-002, commit `main()` alone. This keeps committed code fully schema-compliant. Currently, the function-level fallback has code synthesis bugs (DEEP-2) that prevent this from working — fix those first.
  2. **Relaxed validation (last resort)**: Only if per-function handling can't produce even a root span — accept partial schema compliance for the root span specifically (strip failing attributes rather than rejecting the file).
  3. **Priority retry budget**: More retries for the entry point, or a simpler fallback strategy (just the root span, minimal attributes).
  4. **Live-check gating**: If the entry point failed instrumentation, live-check should report "DEGRADED" with an explanation, not "OK."
  5. **Cross-reference**: Live-check should compare which files were instrumented vs which emit telemetry, flagging gaps.
- **Acceptance Criteria**: (a) Entry point failure triggers degraded live-check status, (b) per-function fallback works correctly for entry point files, (c) relaxed validation available as last resort, (d) live-check cross-references instrumented files against telemetry output.

### DEEP-7: Live-check should catch malformed imports and lint failures

- **Priority**: Medium
- **Recommended Action**: Issue
- **Description**: The function-level fallback generated `imimport` (corrupted import) in summary-manager.js, which was caught by the LINT validator in the static validation pass. But if a similar corruption slipped past static checks (e.g., valid syntax but wrong import path), live-check should catch it at runtime — the module would fail to load, tests would fail, and Weaver would see missing telemetry. Currently, the LINT check runs per-function during fallback but there's no whole-file syntax verification after all functions are assembled. A `node --check` or lint pass on the reassembled file would catch these synthesis errors earlier.
- **Impact**: Medium — static LINT caught this specific case, but the gap in whole-file verification after function-level assembly is a latent risk.
- **Evidence**: summary-manager.js generateAndSaveMonthlySummary LINT failure in `evaluation/run-5/orbweaver-pr-summary.md`.
- **Acceptance Criteria**: After function-level fallback assembles the final file, run a whole-file syntax check (`node --check` or equivalent) before committing.

### DEEP-8: Date object passed to span.setAttribute (invalid OTel attribute type)

- **Priority**: Low
- **Recommended Action**: Issue
- **Description**: In summary-manager.js `saveMonthlySummary`, the agent passes a Date object (`firstDay`) to `span.setAttribute('commit_story.journal.entry_date', firstDay)`. OTel attributes must be primitive types (string, number, boolean, or arrays thereof). Date objects are silently coerced or dropped depending on the SDK version. Other functions in the same file correctly use string representations (`dateStr`, `weekStr`). CodeRabbit CLI flagged this in run-5 review.
- **Impact**: Low — the attribute may be silently dropped at export time, losing the entry date from the span. No runtime error.
- **Evidence**: `evaluation/run-5/partial-diffs/summary-manager.diff` line 420. CodeRabbit CLI review finding.
- **Acceptance Criteria**: The CDQ-006 or SCH-002 validator should check attribute value types against OTel spec (string/number/boolean/array). Or the prompt should instruct the agent to convert Date objects to ISO strings before passing to setAttribute.

### EVAL-1: Schema-uncovered files lack domain-specific attributes

- **Priority**: Medium
- **Recommended Action**: Issue (prompt improvement)
- **Description**: When the agent instruments files that have no registry definitions (schema-uncovered), it creates spans but adds zero attributes. auto-summarize.js has 3 spans with 0 attributes. server.js has 1 span with 0 attributes. This provides minimal observability — "the function was called" but no domain context (date, item count, result status). Schema-covered files have rich attributes (context-integrator.js has 10 attributes), showing the agent CAN add attributes when the registry provides guidance.
- **Impact**: Schema-uncovered spans provide reduced observability value. For the summary subsystem (the largest uncovered area), operators get no insight into what was summarized, how many items processed, or whether results were complete.
- **Evidence**: `evaluation/run-5/per-file-evaluation.json` — auto-summarize.js and server.js both fail COV-005.
- **Acceptance Criteria**: Schema-uncovered files should have at least 1-2 domain-relevant attributes per span, even without registry definitions. The prompt should guide the agent to add contextual attributes based on function parameters and return values.

### EVAL-2: @traceloop auto-instrumentation packages added to library peerDependencies

- **Priority**: Low
- **Recommended Action**: Issue (investigate)
- **Description**: The agent added `@traceloop/instrumentation-langchain` and `@traceloop/instrumentation-mcp` as optional peerDependencies in package.json. Auto-instrumentation libraries are SDK-level concerns that belong in the deployer's configuration, not a library's dependency tree. The packages are marked optional (peerDependenciesMeta), which softens the impact, but the principle is violated.
- **Impact**: Low — optional peerDependencies don't force installation. But it sets a bad precedent and could confuse users about whether these packages are required.
- **Evidence**: `git diff main..orbweaver/instrument-1773706515431 -- package.json`
- **Acceptance Criteria**: For library projects (detected by `@opentelemetry/api` in peerDependencies), the agent should not add auto-instrumentation packages to package.json. These should be documented as recommended companion packages in the PR description instead.

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
