# PRD #4: Evaluation Run-4 — SpinybackedOrbWeaver with Fresh Build

**Status:** In Progress
**Created:** 2026-03-13
**GitHub Issue:** TBD (create after PRD #3 merges)
**Depends on:** PRD #3 (run-3 complete, findings documented, 11 orbweaver issues identified)

---

## Problem Statement

Run-3 scored 73% quality (19/26 rules pass, 4/4 gates pass) but was compromised by a stale orbweaver build — fixes #61 (mega-bundle), #64 (tracer naming), and #65 (span naming) existed in source but were never compiled to `dist/`. Three of seven quality rule failures (API-003, SCH-001, CDQ-008) are expected repeats from the stale build. Run-3 also discovered a new regression (API-002: agent marked `@opentelemetry/api` optional), two genuine new findings (SCH-002: ad-hoc attributes, CDQ-003: missing recordException), and one schema design issue (CDQ-007: PII in `commit_story.commit.author`).

The same 4 files have failed across both run-2 and run-3: journal-graph.js (oscillation/token budget), sensitive-filter.js (null parsed output), context-integrator.js (NDS-003 blocks refactor), and journal-manager.js (NDS-003 x5). Run-3 produced 11 orbweaver issues documented in `evaluation/run-3/orb-findings.md`.

### Primary Goal

Verify that orbweaver fixes resolve all 7 quality rule failures from run-3, pushing the quality score from 73% toward 85%+. Secondary goal: rescue at least 2 of the 4 persistently failing files.

### Run-3 Scores (baseline for run-4 comparison)

| Dimension | Score |
|-----------|-------|
| Non-Destructiveness | 2/2 (100%) |
| Coverage | 6/6 (100%) |
| Restraint | 4/4 + 1 N/A (100%) |
| API-Only Dependency | 1/3 (33%) |
| Schema Fidelity | 2/4 (50%) |
| Code Quality | 4/7 (57%) |
| **Overall quality** | **19/26 (73%)** |

### Run-3 Quality Rule Failures (7 total)

| Rule | Category | Classification |
|------|----------|----------------|
| API-002 | Agent made `@opentelemetry/api` optional | New regression |
| API-003 | Mega-bundle `@traceloop/node-server-sdk` | Stale build repeat |
| SCH-001 | 4+ inconsistent span naming patterns | Stale build repeat |
| SCH-002 | 2 ad-hoc attribute keys not in registry | Genuine new finding |
| CDQ-003 | 2 spans missing `recordException` | Genuine new finding |
| CDQ-007 | PII in `commit_story.commit.author` | Schema design issue |
| CDQ-008 | Two tracer naming conventions | Stale build repeat |

### Run-3 Failed Files (4 total — persistent across run-2 and run-3)

| File | Run-2 Failure | Run-3 Failure | Orbweaver Issue |
|------|--------------|--------------|-----------|
| journal-graph.js | Token budget exceeded | Oscillation (150K budget) | #6, #9 |
| sensitive-filter.js | Null parsed output | Null parsed output | #2 |
| context-integrator.js | NDS-003 | NDS-003 | #4 |
| journal-manager.js | NDS-003 | NDS-003 x5 + COV-003 x3 | #4, #9 |

### Orbweaver Issues Filed from Run-3

11 issues documented in `evaluation/run-3/orb-findings.md`:

| Issue | Summary | Priority |
|-------|---------|----------|
| #1 | Token budget is post-hoc — spends tokens then discards | High |
| #2 | Null parsed output has no diagnostics | High |
| #3 | Zero-span files give no reason in CLI output | Low |
| #4 | NDS-003 should allow instrumentation-motivated refactors or escalate | High |
| #5 | Accept multiple path arguments | Low |
| #6 | Oscillation error doesn't say which validation rule triggered it | Medium |
| #7 | Test suite integration | Medium |
| #8 | Unify oscillation and repeated-failure error messages | Low |
| #9 | Function-level instrumentation for large files | High |
| #12 | Validate GitHub token at startup | Medium |
| #13 | Save PR summary to local file as backup | Medium |

### Unresolved from Run-2

These were identified in run-2 and not yet addressed:

| Item | Status |
|------|--------|
| spinybacked-orbweaver #62: CJS `require()` in ESM projects | Open (spec gap, not a run-3 failure) |
| spinybacked-orbweaver #63: Elision and null parsed output bypass retry loop | Open |
| spinybacked-orbweaver #66: Spec: define module system detection strategy | Open |
| spinybacked-orbweaver #67: Spec: clarify SDK dependency placement for libraries | Open |
| spinybacked-orbweaver #68: Spec: classify retryable vs terminal failure types | Open |
| spinybacked-orbweaver #69: Spec: define strategy for files exceeding token budget | Open |

---

## Solution Overview

Three-phase approach:

1. **Pre-run verification** — Rebuild orbweaver, verify fixes are compiled, validate credentials
2. **Evaluation run** — Execute `orbweaver instrument` with improved process controls
3. **Structured evaluation** — Multi-agent evaluation with full 31-rule rubric

### Key Inputs

- **Run-3 results**: `evaluation/run-3/` in this repo
- **Evaluation rubric**: `spinybacked-orbweaver/research/evaluation-rubric.md` (31 rules)
- **Rubric-codebase mapping**: `spinybacked-orbweaver/research/rubric-codebase-mapping.md`
- **Run-3 orbweaver branches**: `orb/instrument-1773434669510` (main), `orb/instrument-1773438620295` (supplemental)
- **Orbweaver issues**: `evaluation/run-3/orb-findings.md` (11 issues)
- **Lessons for PRD #4**: `evaluation/run-3/lessons-for-prd4.md`

---

## Success Criteria

1. Orbweaver build is fresh — `dist/` compiled after all fix merges, verified with build timestamp
2. Git push credentials validated before processing files (no lost PR artifact)
3. `orbweaver instrument` creates a PR (no `--no-pr`)
4. Every file result evaluated with full 31-rule rubric using structured output format
5. Per-file agents used for per-file/per-instance quality rules (not single-pass evaluation)
6. Failure deep-dives for each failed file with root cause analysis and orbweaver issue cross-references
7. PR artifact evaluated as a first-class deliverable
8. Clear baseline comparison: run-4 vs run-3 vs run-2
9. Quality score of 85%+ (3 stale build repeats resolved, at least 1 additional fix verified)
10. At least 2 of 4 persistently failing files rescued (13+ files instrumented)

---

## Milestones

- [x] **Pre-run verification** — Verify orbweaver fixes are applied and compiled. Steps:
  1. Check spinybacked-orbweaver for which of the 11 run-3 orbweaver issues are fixed (closed with merged PRs)
  2. Check spinybacked-orbweaver issues #61-#69 (run-2 findings) for status
  3. `cd spinybacked-orbweaver && npm run prepare` — rebuild `dist/` from source
  4. Verify build timestamp: `ls -la dist/agent/prompt.js` must be AFTER the latest fix merge date
  5. `orbweaver --version` — record version for the evaluation log
  6. Validate git push credentials: `git ls-remote origin` in the eval repo — must succeed before starting
  7. Verify codebase is clean: `git status` on main, no leftover orbweaver branches or artifacts
  8. Record which fixes are verified vs still open — this determines expected score ceiling

- [x] **Schema and rubric updates** — Address rubric gaps and schema issues identified in run-3 before evaluation:
  1. **CDQ-007 PII decision**: Accepted `commit_story.commit.author` with PII annotation — git author names are public metadata and author attribution is core to journal purpose. Added `note` to registry attribute.
  2. **SCH-002 ad-hoc attributes**: Added `commit_story.git.subcommand` and `commit_story.commit.parent_count` to Weaver registry. Filed commit-story-v2#49 for upstream sync.
  3. **API-004 SDK setup carve-out**: Already in rubric (orbweaver #105, closed). Fixed `orb.yaml` → `orbweaver.yaml` reference.
  4. **Coverage scoring guidance**: Already in rubric (orbweaver #105, closed).
  5. **NDS-006 module system consistency**: Already in rubric (orbweaver #105, closed). Rule count now 32.
  6. **COV-006 OpenLLMetry coverage**: JS package partially covers LangChain (chat model calls via callback injection) but has significant LangGraph gaps — node execution, state transitions, graph compilation NOT instrumented. Manual spans justified for graph orchestration. Updated rubric-codebase-mapping.

- [x] **Evaluation run-4** — Execute `orbweaver instrument` with all process improvements:
  1. Clean codebase state: start from main branch with evaluation config (orbweaver.yaml, instrumentation.js, semconv/)
  2. Run in foreground for real-time visibility: `orbweaver instrument src/ --verbose -y`
  3. Record wall-clock start timestamp
  4. Monitor for failures in real-time — if a file fails, note the error message for the failure deep-dive
  5. Record wall-clock end timestamp
  6. If any files failed due to token budget, run supplemental passes with `maxTokensPerFile: 150000`
  7. Verify PR was created successfully — if push fails, the local PR summary file (orbweaver issue #13) should be available
  8. Capture all output to `evaluation/run-4/orb-output.log`
  9. Record final tally: files instrumented / correctly skipped / failed

- [x] **Collect lessons for PRD #5** — Create `evaluation/run-4/lessons-for-prd5.md` at the START of evaluation work and append to it throughout all subsequent milestones. Capture:
  1. Rubric gaps discovered during evaluation (new rules needed, scoring ambiguities)
  2. Process improvements (things that worked well, things that didn't)
  3. Evaluation methodology changes (better ways to score, new agent patterns)
  4. Rubric-codebase-mapping corrections (wrong classifications, missing auto-instrumentation)
  5. Schema decisions that affect future runs
  6. Items to carry forward (unresolved issues, open questions)

- [x] **Failure deep-dives** — For each failed file, understand the root cause deeply:
  1. For each failed file: read the orbweaver output log for all attempt details
  2. Identify the specific validation rule(s) that blocked instrumentation
  3. Determine if the failure is a known issue (mapped to an orbweaver issue) or a new discovery
  4. For persistent failures (files that failed in run-2 and run-3): assess whether the orbweaver fix was applied and whether it helped
  5. For new failures: file orbweaver issues with acceptance criteria tied to specific target files
  6. Document findings in `evaluation/run-4/failure-deep-dives.md`
  7. Append any new rubric gaps or process observations to `evaluation/run-4/lessons-for-prd5.md`

- [x] **Per-file evaluation** — Full 31-rule rubric applied to all files using structured evaluation:
  1. **Gate checks + per-run rules (single agent)**: NDS-001, NDS-002, NDS-003, API-001, API-002, API-003, API-004, CDQ-008 — needs cross-file context
  2. **Per-file quality rules (per-file agents)**: Each agent gets the rubric + one file's diff + Weaver schema. Rules: NDS-004, NDS-005, COV-001 through COV-006, RST-001 through RST-005, SCH-001 through SCH-004, CDQ-001 through CDQ-007
  3. **Zero-span files**: Verify correct skip decisions for files with 0 spans
  4. **Failed files**: Evaluate against NDS rules only (the agent produced output that was rejected)
  5. Use structured output format: `{rule_id} | {pass|fail} | {file_path}:{line_number} | {actionable_message}`
  6. Emit per-file evaluation results as a canonical JSON artifact (`evaluation/run-4/per-file-evaluation.json`) — render the markdown report from it to prevent drift between evaluation docs
  7. Document in `evaluation/run-4/per-file-evaluation.md` (generated from the JSON artifact)
  8. Append any rubric scoring ambiguities or methodology observations to `evaluation/run-4/lessons-for-prd5.md`
  9. Append any new orbweaver software bugs discovered during evaluation to `evaluation/run-4/orb-findings.md`

- [x] **PR artifact evaluation** — Evaluate the PR as a first-class deliverable:
  1. If PR exists: evaluate description quality, per-file table, span counts, agent decision notes
  2. Assess: Does the PR help a reviewer understand what the agent did and make informed merge decisions?
  3. If PR was lost: document why and assess whether orbweaver issue #12 (credential validation) and #13 (local summary) were fixed
  4. Document in `evaluation/run-4/pr-evaluation.md`
  5. Append any PR quality observations to `evaluation/run-4/lessons-for-prd5.md`
  6. Append any new orbweaver software bugs to `evaluation/run-4/orb-findings.md`

- [x] **Rubric scoring** — Synthesize per-file findings into dimension-level scores:
  1. Aggregate per-file agent findings from `evaluation/run-4/per-file-evaluation.json`
  2. Score each dimension (NDS, COV, RST, API, SCH, CDQ) with per-rule evidence
  3. Classify each failure: stale build repeat / new regression / genuine new finding / schema design issue
  4. **Schema coverage split scoring** (decision log 2026-03-16): Score SCH-001 and SCH-002 separately for schema-covered files (~20, where registry defines expected attributes) vs schema-uncovered files (~9 summary subsystem files, where agent must invent attributes). For uncovered files, evaluate invention quality (namespace adherence, semantic validity) rather than registry match. Report both strict score (all files against registry) and split score (covered strict + uncovered inventions). See `lessons-for-prd5.md` "Schema Coverage Split" section for full methodology.
  5. Emit as `evaluation/run-4/rubric-scores.json` (machine-readable) and render `evaluation/run-4/rubric-scores.md` from it (run-3-compatible format)
  6. Append any new rubric gaps or scoring ambiguities to `evaluation/run-4/lessons-for-prd5.md`
  7. Append any new orbweaver software bugs to `evaluation/run-4/orb-findings.md`

- [x] **Baseline comparison and synthesis** — Compare run-4 vs run-3 vs run-2:
  1. Dimension-level trend analysis (4-run where applicable)
  2. File outcome comparison (which files improved, regressed, or stayed the same)
  3. Failure classification: resolved / persistent / new
  4. Assessment of run-3 prediction: did fresh build push quality to ~85%?
  5. **Schema coverage split context for cross-run SCH comparison**: Run-4 processed ~9 new summary subsystem files that didn't exist in run-3. SCH failures on those files are not regressions — they're new territory with no registry coverage. Compare SCH scores for files common to both runs separately from new files.
  6. Document in `evaluation/run-4/baseline-comparison.md`
  7. Append any cross-run process observations to `evaluation/run-4/lessons-for-prd5.md`

- [x] **Actionable fix output** — Produce fix instructions for remaining failures:
  1. For each remaining quality rule failure: what's wrong, evidence, desired outcome
  2. For each remaining failed file: root cause, desired outcome, orbweaver issue cross-references
  3. Assessment of run-3 orbweaver issues: which were fixed, which remain, any new issues
  4. Run-4 rubric gap assessment: any new rubric gaps discovered
  5. Run-5 verification checklist
  6. Generate from the canonical JSON artifacts (`per-file-evaluation.json`, `rubric-scores.json`) to prevent drift between evaluation docs
  7. Document in `evaluation/run-4/actionable-fix-output.md`
  8. Final review of `evaluation/run-4/lessons-for-prd5.md` — ensure all forward-looking items are captured
  9. Final review of `evaluation/run-4/orb-findings.md` — ensure all orbweaver bugs are captured with acceptance criteria

- [ ] **Draft PRD #5 for next evaluation run** — Create a PRD for evaluation run-5 following the structure of this PRD. Primary inputs: `evaluation/run-4/lessons-for-prd5.md` (process improvements, rubric gaps, evaluation methodology changes) and `evaluation/run-4/orb-findings.md` (orbweaver software bugs to verify as fixed). Also incorporate run-4 scores as baselines, carry forward unresolved bugs/spec gaps/rubric gaps, and encode process lessons. **Key methodology to encode**: schema coverage split scoring (do NOT pre-register summary attributes — keep the gap as a test of agent schema extension capability; see decision log 2026-03-16). The goal is a self-improving evaluation chain where each run's PRD encodes the lessons of previous runs.

---

## Evaluation Architecture

Run-4 introduces multi-agent evaluation to prevent lazy pattern-matching and ensure each file gets thorough attention (lesson from run-3).

### Agent Structure

**Agent 1: Gate + Per-Run Rules**
- Needs cross-file context (package.json, all diffs, all tracer names)
- Rules: NDS-001, NDS-002, NDS-003, API-001, API-002, API-003, API-004, CDQ-008
- Input: all instrumented file diffs, package.json diff, test results

**Per-File Agents (one per instrumented file)**
- Each gets: the rubric + one file's diff + Weaver schema + registry
- Rules: NDS-004, NDS-005, COV-001 through COV-006, RST-001 through RST-005, SCH-001 through SCH-004, CDQ-001 through CDQ-007
- Output: structured evaluation in `{rule_id} | {pass|fail} | {file_path}:{line_number} | {actionable_message}` format

**Synthesis Agent**
- Aggregates per-file findings into the final evaluation document
- Resolves conflicts between per-file agents (e.g., one agent says COV-002 pass, another finds an uncovered outbound call)
- Produces dimension-level scores

---

## Process Improvements Encoded from Run-3

These are lessons from run-3 that are now embedded in the milestones above:

| Lesson | Where Encoded |
|--------|---------------|
| Rebuild orbweaver before running — stale build invalidated run-3 | Pre-run verification milestone, step 3-4 |
| Validate git credentials before processing files | Pre-run verification milestone, step 6 |
| Use full 31-rule rubric systematically | Per-file evaluation milestone |
| Use structured evaluation output format | Per-file evaluation milestone, step 5 |
| Failure deep-dives as a formal milestone | Failure deep-dives milestone |
| PR artifact evaluation as a formal milestone | PR artifact evaluation milestone |
| Per-file agents for per-file quality rules | Evaluation architecture section |
| Track wall-clock time | Evaluation run milestone, steps 3 and 5 |
| Run in foreground for real-time visibility | Evaluation run milestone, step 2 |
| Supplemental runs for token budget failures | Evaluation run milestone, step 6 |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Orbweaver fixes not compiled (repeat of run-3 stale build) | Pre-run milestone explicitly verifies build timestamp post-`npm run prepare` |
| Git push credentials invalid (repeat of run-3) | Pre-run milestone validates credentials before processing files |
| PR summary lost if push fails | Orbweaver issue #13 should save summary locally; if not fixed, capture from log |
| Run-4 has new failure modes not in rubric | Gap analysis in actionable fix output milestone |
| Multi-agent evaluation produces inconsistent scores | Synthesis agent resolves conflicts; structured output format enables comparison |
| Cost exceeds budget | Single-file dry-run provides cost ceiling estimate; run-3 was ~52 min total |
| Datadog proxy intercepts API calls | Same workaround: `env -u ANTHROPIC_BASE_URL -u ANTHROPIC_CUSTOM_HEADERS` |
| OpenLLMetry research reveals auto-instrumentation doesn't cover LangGraph | Document gaps; manual spans may be correct for some operations |

---

## Lessons Learned from Run-3 (Process)

Encoded in the milestones but listed explicitly for reference:

1. **Rebuild orbweaver before every run** — `cd spinybacked-orbweaver && npm run prepare` and verify build timestamp. Run-3's stale build wasted an entire evaluation cycle for 3 of 7 failures.
2. **Validate credentials at startup** — Check git push before processing 21 files for 35 minutes.
3. **Use full rubric systematically** — Run-3's initial evaluation improvised ~13 rules and missed critical ones. The 31-rule rubric exists — use it.
4. **Failure deep-dives produce the most value** — Understanding WHY a file fails, not just that it failed, produces the most actionable feedback for the orbweaver agent.
5. **PR is a first-class artifact** — Evaluate it holistically as a communication tool, not just a delivery mechanism.
6. **Per-file agents prevent lazy evaluation** — Single-pass evaluation creates pressure to batch when patterns repeat. Per-file agents ensure each file gets thorough attention.
7. **Structured output format** — `{rule_id} | {pass|fail} | {file_path}:{line_number} | {message}` enables machine-readable results.
8. **Supplemental runs rescue token budget failures** — commit-analyzer.js was rescued by a 150K budget supplemental run in run-3. Always try supplemental runs for budget failures.
9. **Source `.vals.yaml` with `vals exec -i`** — Properly injects secrets while inheriting PATH for subshells.
10. **Each PRD drafts the next** — The self-improving chain ensures lessons are captured while fresh.

---

## Prior Art

- **PRD #3**: Run-3 evaluation (this repo)
- **PRD #2**: Run-2 evaluation (this repo)
- **evaluation/run-3/**: Full run-3 documentation
  - `orb-output.log`: Raw CLI output
  - `per-file-evaluation.md`: Full 31-rule rubric applied to all 21 files
  - `rubric-scores.md`: Dimension-level scoring with per-rule evidence
  - `baseline-comparison.md`: Run-3 vs run-2 vs run-1
  - `actionable-fix-output.md`: Fix instructions for orbweaver maintainer
  - `orb-findings.md`: 11 issues with acceptance criteria
  - `lessons-for-prd4.md`: Forward-looking improvements (primary input for this PRD)
- **evaluation/run-2/**: Full run-2 documentation
- **spinybacked-orbweaver issues #61-#69**: Run-2 findings
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 31-rule rubric
- **spinybacked-orbweaver/research/rubric-codebase-mapping.md**: Rule-to-code mapping

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-13 | Add explicit orbweaver rebuild step with timestamp verification | Run-3's stale build wasted an entire evaluation cycle — 3 of 7 failures were expected repeats from uncompiled fixes |
| 2026-03-13 | Add credential validation before file processing | Run-3 lost the PR artifact after 35 minutes of processing due to git push auth failure |
| 2026-03-13 | Use multi-agent evaluation architecture | Single-pass evaluation in run-3 created pressure to batch when patterns repeat; per-file agents ensure thorough attention |
| 2026-03-13 | Failure deep-dives as a formal milestone | Run-3 showed that understanding WHY files fail produces the most actionable orbweaver feedback; this was implicit in run-3 but should be explicit |
| 2026-03-13 | PR evaluation as a formal milestone | The PR is how the agent presents its work to reviewers; evaluating it as a deliverable is part of assessing agent quality |
| 2026-03-13 | Address rubric gaps before evaluation, not after | Run-3 discovered gaps (API-004 carve-out, coverage scoring, NDS-006) that affected scoring interpretation; fixing them first gives cleaner results |
| 2026-03-13 | Research OpenLLMetry before scoring COV-006 | The agent has auto-instrumentation support for LangChain but run-3 couldn't test it (journal-graph.js failed). Research needed to set expectations for run-4 |
| 2026-03-13 | Create `lessons-for-prd5.md` at start of evaluation and append throughout | Run-3 created `lessons-for-prd4.md` mid-evaluation (decision log entry 2026-03-13). PRD #4 formalizes this as a milestone that runs in parallel with all evaluation milestones, ensuring lessons are captured while context is fresh |
| 2026-03-13 | Use canonical JSON artifacts as source of truth for all evaluation docs | Run-3 had drift risk between per-file-evaluation.md, rubric-scores.md, and actionable-fix-output.md since all were authored independently. PRD #4 emits per-file-evaluation.json and rubric-scores.json first, then renders markdown from them. CodeRabbit review of PR #6 flagged this pattern |
| 2026-03-15 | Rename all "orb" references to "orbweaver" in PRD and evaluation docs | CLI was renamed from `orb` to `orbweaver` in spinybacked-orbweaver #123. Config file already renamed to `orbweaver.yaml`. PRD and evaluation docs updated for consistency. Historical filenames (`orb-output.log`, `orb-findings.md`) and branch names (`orb/instrument-*`) preserved as-is |
| 2026-03-15 | Accept `commit_story.commit.author` as PII with annotation | Git author names are public metadata on every commit; author attribution is core to journal purpose. Added `note` to registry attribute rather than hashing or removing. CDQ-007 evaluators can see PII was consciously accepted |
| 2026-03-15 | Add `commit_story.git.subcommand` and `commit_story.commit.parent_count` to Weaver registry | Both were ad-hoc attributes the agent invented in run-3 (SCH-002). They're legitimate domain attributes. Orbweaver #102 and #147 fixed agent-side handling; registry pre-registration removes a known failure point. Filed commit-story-v2#49 for upstream sync |
| 2026-03-15 | Manual spans justified for LangGraph orchestration despite OpenLLMetry availability | `@traceloop/instrumentation-langchain` JS package covers LangChain chat model calls but NOT LangGraph node execution, state transitions, or graph compilation. Python package is more mature. Manual spans on graph nodes are the correct pattern for commit-story-v2 |
| 2026-03-16 | Track orbweaver issues and evaluation process lessons in separate documents | Run-4 discovered both categories simultaneously. `orb-findings.md` feeds GitHub issues on spinybacked-orbweaver; `lessons-for-prd5.md` feeds PRD #5. The distinction prevents mixing software bugs with process improvements |
| 2026-03-16 | Schema evolution broken — format mismatch between agent output and parser | Agent outputs schemaExtensions as string IDs per prompt spec; parseExtension() expects YAML objects with id field. All extensions rejected as "(unparseable)". Schema never evolved across 29 files. Critical orbweaver bug — filed as run-4 orb issue #1 |
| 2026-03-16 | Every evaluation milestone must update both output documents | Failure deep-dives revealed the two output streams (`orb-findings.md` for orbweaver bugs, `lessons-for-prd5.md` for process improvements) were only referenced in some milestones. Added explicit update steps to all remaining milestones to prevent findings from being lost |
| 2026-03-16 | Split SCH-002 scoring by schema coverage — do not pre-register summary attributes | The Weaver schema was designed before the summary subsystem (~9 files) existed. For schema-uncovered files, ad-hoc attributes are *expected* — the agent must invent them. Evaluate whether inventions follow namespace conventions and are semantically reasonable, not whether they match a non-existent registry. Keeping the schema gap preserves a test of the agent's judgment under ambiguity and tests the schema evolution mechanism. Pre-registering would test "follow instructions" (easier) instead of "extend schema coherently" (harder, more valuable). Run-5 should maintain this gap. |
| 2026-03-16 | Evaluate branch state (the deliverable), not PR summary self-reported status | Per-file evaluation discovered that summary-graph.js ("partial, 6 spans"), sensitive-filter.js ("partial, 2 spans"), and journal-manager.js ("partial, 0 spans") have NO changes on the orbweaver branch — their instrumentation was never committed. The PR summary's per-file status table reports work that exists only in the agent's memory or working directory. Future evaluations must diff `main..orbweaver-branch` for ground truth, not trust the agent's self-report. This also means NDS-002's 32 test failures came from working-directory changes that were never delivered. |
| 2026-03-16 | Expected-condition catch blocks are a distinct NDS-005/CDQ-003 failure class | Per-file agent evaluation found 3 files (summarize.js, summary-manager.js, summary-detector.js) where the agent changed silent `catch {}` blocks — used for expected control flow like ENOENT file-not-found — to record exceptions and set ERROR status. OTel's setStatus is a one-way latch; once ERROR, spans can't revert to OK. This pollutes telemetry with false errors. Filed as orb issue #10. This failure class is distinct from "agent broke error handling" (NDS-005 traditional) — the control flow is preserved, but the observability semantics are wrong. Run-5 rubric may need a dedicated rule or sub-classification. |
| 2026-03-16 | Rename orbweaver findings document from "issues" to "findings" with PRD/issue classification | "Issue" conflated small GitHub issues with PRD-sized architectural work. "Findings" is neutral evaluation vocabulary. Each finding is classified as `PRD` (needs design decisions, milestones) or `Issue` (focused fix). Document renamed from `orb-issues-to-file.md` to `orb-findings.md`. Each finding includes cross-repo evidence references so the implementing AI in spinybacked-orbweaver can navigate directly to supporting documentation in this eval repo. |
| 2026-03-16 | PRD #5 must have explicit evaluation process improvements milestone | Run-4 discovered significant methodology changes (per-file agents, schema coverage split, findings vocabulary, cross-repo evidence) that were as important as orbweaver software findings. These emerged organically and had to be worked through manually. PRD #5 should treat evaluation methodology as a first-class deliverable with its own milestone. |
