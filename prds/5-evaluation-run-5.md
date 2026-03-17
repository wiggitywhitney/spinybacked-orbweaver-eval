# PRD #5: Evaluation Run-5 — Schema Evolution and Validation Pipeline Verification

**Status:** Draft
**Created:** 2026-03-16
**GitHub Issue:** #11
**Depends on:** PRD #4 (run-4 complete, 13 findings documented, handoff delivered to orbweaver)

---

## Problem Statement

Run-4 scored 58% strict (15/26) / 73% methodology-adjusted + schema split (19/26). Two critical infrastructure bugs dominated the results: schema evolution was completely broken (all extensions rejected as unparseable — 0 cross-file naming consistency), and the validation pipeline had no per-file checks (32 test failures discovered only after all 29 files processed). These two bugs affected every evaluated file and masked the agent's actual instrumentation quality.

Run-4 also discovered 3 high-priority agent behavior bugs (CDQ-002: tracer name 'unknown_service', NDS-005: expected-condition catches recorded as errors, COV-001: missing root span on main()) whose fixes would push the adjusted score from 73% to 85%.

The run-4 evaluation produced 13 findings in `evaluation/run-4/orb-findings.md`, delivered to spinybacked-orbweaver via `evaluation/run-4/handoff-to-orbweaver.md`. The orbweaver maintainer AI triages the findings, verifies claims against the current codebase, and files issues/PRDs. Run-5 evaluates the results of that triage.

### Primary Goal

Verify that orbweaver's critical infrastructure fixes (schema evolution, validation pipeline) work end-to-end, and that the 3 high-priority agent behavior fixes push the quality score to 85%+.

### Secondary Goals

- Validate the recommendation-document handoff process (did the orbweaver AI correctly triage findings?)
- Establish per-file evaluation as the canonical methodology (no more ad-hoc scoring variants)
- Test schema evolution's impact on schema-uncovered files (the key test run-4 couldn't perform)

### Run-4 Scores (baseline for run-5 comparison)

| Dimension | Run-4 Strict | Run-4 Adjusted + Split |
|-----------|-------------|----------------------|
| Non-Destructiveness (NDS) | 1/2 (50%) | 1/2 (50%) |
| Coverage (COV) | 2/6 (33%) | 4/6 (67%) |
| Restraint (RST) | 3/4 (75%) | 3/4 (75%) |
| API-Only Dependency (API) | 3/3 (100%) | 3/3 (100%) |
| Schema Fidelity (SCH) | 2/4 (50%) | 3/4 (75%) |
| Code Quality (CDQ) | 4/7 (57%) | 5/7 (71%) |
| **Overall quality** | **15/26 (58%)** | **19/26 (73%)** |
| **Gates** | **4/5 (80%)** | **4/5 (80%)** |

### Run-4 Quality Rule Failures (11 total, 4 methodology-driven)

| Rule | Category | Run-4 Classification |
|------|----------|---------------------|
| NDS-005 | Expected-condition catches recorded as errors (3 files) | Genuine new finding |
| COV-001 | index.js main() missing root span (regression) | Genuine regression |
| COV-002 | Individual operation coverage too strict | Methodology change |
| COV-004 | Individual async operation coverage too strict | Methodology change |
| COV-005 | Ad-hoc attributes in schema-uncovered files | New territory |
| RST-001 | Over-instrumentation of pure sync functions (token-filter.js) | Genuine new finding |
| SCH-001 | 8/37 span names deviate from commit_story.* | Schema evolution dependency |
| SCH-002 | 11 ad-hoc attributes (all schema-uncovered files) | Schema evolution dependency |
| CDQ-002 | All 16 files use 'unknown_service' tracer name | Genuine new finding |
| CDQ-003 | recordException misuse on expected-condition path | Genuine new finding |
| CDQ-006 | toISOString() without isRecording() guard | Methodology change |

### Run-4 File Outcomes

| Outcome | Count | Files |
|---------|-------|-------|
| Instrumented on branch | 16 | claude-collector, git-collector, journal-graph, index, context-integrator, message-filter, token-filter, mcp/server, context-capture-tool, reflection-tool, journal-paths, commit-analyzer, summarize, auto-summarize, summary-manager, summary-detector |
| Correctly skipped (0 spans) | 10 | config, 5 prompt files, guidelines/index, monthly-summary-prompt, 2 more prompt files |
| Partial (not committed) | 3 | summary-graph (tracer import), sensitive-filter (tracer import + regex), journal-manager (NDS-003 persistent) |

### Run-4 Orbweaver Findings (13 total)

| # | Title | Priority | Recommended Action | Run-5 Expectation |
|---|-------|----------|-------------------|-------------------|
| 1 | Schema evolution broken | Critical | PRD | **Must be fixed** — blocking |
| 2 | Validation pipeline (per-file checks, fix/retry) | High | PRD | **Must be fixed** — blocking |
| 3 | Expected-condition catches recorded as errors | High | Issue | Should be fixed (→ 85% target) |
| 4 | Schema extension warnings unreadable | Low | Issue | Nice to have |
| 5 | CLI output doesn't show artifact locations | High | Issue | Nice to have |
| 6 | Create draft PR when tests fail | Medium | Issue | Nice to have |
| 7 | LOC-aware test cadence | Medium | Issue | Optional (group with #2) |
| 8 | Skip commit for zero-change files | Low | Issue | Nice to have |
| 9 | Tracer name defaults to 'unknown_service' | High | Issue | Should be fixed (→ 85% target) |
| 10 | Span naming inconsistency | Medium | Issue | Partially depends on #1 |
| 11 | Unused OTel imports on zero-span files | Low | Issue | Nice to have |
| 12 | Over-instrumentation of pure sync functions | Medium | Issue | Should be fixed |
| 13 | index.js missing root span | Medium | Issue | Should be fixed (→ 85% target) |

### Unresolved from Prior Runs

| Item | Origin | Status |
|------|--------|--------|
| Run-3 #3: Zero-span files give no reason in CLI | Run-3 | Open — not fixed in run-4 |
| Run-3 #4: NDS-003 blocks instrumentation-motivated refactors | Run-3 | Open — design tension, not a bug |
| Run-3 #12: Push validation (read access ≠ push access) | Run-3 | Open — partially fixed but still failed |
| spinybacked-orbweaver #62: CJS require() in ESM projects | Run-2 | Open (spec gap) |
| spinybacked-orbweaver #63: Elision/null output bypass retry loop | Run-2 | Open |
| spinybacked-orbweaver #66-69: Spec gaps | Run-2 | Open |

---

## Solution Overview

Four-phase approach:

1. **Pre-run verification** — Verify orbweaver fixes, validate schema evolution works, confirm push capability
2. **Evaluation run** — Execute `orbweaver instrument` with all run-4 process improvements plus new pre-flight checks
3. **Structured evaluation** — Multi-agent per-file evaluation with standardized methodology
4. **Evaluation process improvements** — Encode methodology changes as first-class deliverables

### Key Inputs

- **Run-4 results**: `evaluation/run-4/` in this repo (15 artifacts)
- **Evaluation rubric**: `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules)
- **Rubric-codebase mapping**: `spinybacked-orbweaver/research/rubric-codebase-mapping.md`
- **Run-4 orbweaver branch**: `orbweaver/instrument-1773627869602` (local)
- **Run-4 findings**: `evaluation/run-4/orb-findings.md` (13 findings)
- **Run-4 handoff**: `evaluation/run-4/handoff-to-orbweaver.md`
- **Run-4 lessons**: `evaluation/run-4/lessons-for-prd5.md`
- **Run-4 score projections**: `evaluation/run-4/actionable-fix-output.md` § 9

---

## Success Criteria

1. Schema evolution verified working before processing files: file N+1's schema includes extensions from file N
2. Push capability validated before run (not just read access)
3. Per-file static check (`node --check`) runs after each instrumented file before commit
4. `orbweaver instrument` creates a PR (or draft PR if tests fail)
5. Every file evaluated with full rubric using per-file agent methodology (the canonical methodology going forward)
6. Schema coverage split scoring applied as a standard dimension, not ad-hoc
7. Findings document and lessons document created at run start, updated throughout (not mid-stream)
8. Handoff process validated: orbweaver AI's triage compared against run-4 findings
9. Rubric clarifications applied (CDQ-002 semantic check, CDQ-006 cheap computation exemption, NDS-005 expected-condition sub-classification)
10. Quality score of 85%+ under per-file evaluation methodology (canonical, no adjustment needed)
11. At least 1 of 3 remaining partial files fully rescued (summary-graph.js is the strongest candidate)
12. Cost sanity check: if actual < 15% of ceiling, investigate prompt change rate

---

## Milestones

- [x] **Evaluation process improvements** — Standardize methodology changes discovered in run-4 as formal updates before evaluation begins:
  1. **Rubric clarification: CDQ-002** — Standardize on semantic check (tracer name correctness), not pattern-only check (whether getTracer was called). Document that the bug existed in run-3 but wasn't captured.
  2. **Rubric clarification: CDQ-006** — Add "cheap computation" exemption: trivial type conversions (toISOString, String(), Number()) do not require isRecording() guards. This makes CDQ-006 consistent across runs.
  3. **Rubric sub-classification: NDS-005** — Document expected-condition catch blocks as a distinct failure class. The rule covers both "agent broke error handling" (traditional) and "agent recorded expected conditions as errors" (new in run-4). Consider adding NDS-005a/NDS-005b sub-classifications or a dedicated rule.
  4. **Scoring methodology standardization** — Establish per-file agent evaluation as the canonical methodology. Provide methodology-adjusted scores ONLY for backward compatibility with runs 2-3. Drop the 4-variant scoring (strict/adjusted/split/split+adjusted) — use per-file evaluation + schema coverage split as the single canonical score.
  5. **Schema coverage split as standard dimension** — Formalize the schema-covered vs schema-uncovered file classification. For SCH-002, evaluate schema-uncovered files on invention quality (namespace adherence, semantic validity) rather than registry presence. Design decision: do NOT pre-register summary attributes — the gap tests the agent's schema extension capability.
  6. **Instance counts alongside rule-level scores** — Add per-file instance counts (files passing/failing each rule) alongside rule-level pass/fail to provide nuance when comparing runs with different file counts.
  7. **Systemic bug classification** — When one root cause causes N files to fail the same rule (e.g., CDQ-002 unknown_service → 16 files), classify as a single systemic bug with N affected instances, not N independent violations.
  8. **Branch state verification** — Evaluate `git diff main..orbweaver-branch` for ground truth about what was delivered. Do not trust the PR summary's self-reported per-file status table. Run-4 found 3 "partial" files with NO changes on the branch.
  9. **Cost anomaly as diagnostic signal** — Add to evaluation methodology: if actual cost < 15% of ceiling, investigate whether the prompt is changing between files (symptom of broken schema evolution or over-aggressive caching).
  10. Apply rubric changes to `spinybacked-orbweaver/research/evaluation-rubric.md`. Update `rubric-codebase-mapping.md` to correct the commit-story-v2 classification from "CLI tool" to "library" — `peerDependencies` is the correct placement for `@opentelemetry/api`.
  11. Append any new rubric gaps or methodology observations to `evaluation/run-5/lessons-for-prd6.md`

- [x] **Pre-run verification** — Verify orbweaver fixes and validate run prerequisites:
  1. **Handoff triage review**: Read orbweaver's triage of `evaluation/run-4/handoff-to-orbweaver.md`. Compare what they filed vs what the eval recommended. Note any findings the orbweaver AI rejected and why — this validates the handoff process.
  2. **Schema evolution smoke test**: Instrument one test file, verify `agent-extensions.yaml` was written, resolve schema, confirm extensions appear in the resolved prompt for file 2. If this fails, STOP — schema evolution fix is a blocking prerequisite.
  3. **Push capability test**: Run `git push --dry-run` to verify push access (not just `git ls-remote` which tests read access only). Run-4 had read access validated at pre-run but push failed 80 minutes later.
  4. Rebuild orbweaver: `cd spinybacked-orbweaver && npm run prepare` — verify build timestamp is after all fix merges.
  5. `orbweaver --version` — record version for evaluation log.
  6. **Function-level fallback tracer import check**: Verify the fallback path adds tracer initialization at module scope. This was the direct cause of 32 test failures in run-4.
  7. **Tracer library name check**: Verify the agent uses `package.json#name` (expected: 'commit-story'), not 'unknown_service'.
  8. Verify codebase is clean: `git status` on main, no leftover orbweaver branches.
  9. Record which run-4 findings are verified fixed vs still open — this determines the expected score ceiling.
  10. Append any pre-run observations to `evaluation/run-5/lessons-for-prd6.md`

- [x] **Collect lessons for PRD #6** — Create BOTH output documents at the START and append throughout all subsequent milestones:
  1. Create `evaluation/run-5/orbweaver-findings.md` (note: `orbweaver-` prefix, not `orb-`). Use findings vocabulary (PRD vs Issue classification) from the start.
  2. Create `evaluation/run-5/lessons-for-prd6.md`. Sections: Rubric Gaps, Process Improvements, Evaluation Methodology, Rubric-Codebase Mapping Corrections, Schema Decisions, Carry-Forward Items.
  3. Both documents are updated throughout all subsequent milestones. Every milestone has explicit "append to findings/lessons" steps.

- [x] **Evaluation run-5** — Execute `orbweaver instrument` with all process improvements:
  1. Clean codebase state: start from main branch with evaluation config (orbweaver.yaml, instrumentation.js, semconv/).
  2. Run in foreground: `orbweaver instrument src/ --verbose -y`
  3. Record wall-clock start timestamp.
  4. **Schema evolution health check (after file 3)**: Compare schemaHashBefore vs schemaHashAfter for files 1-3. If all identical, schema evolution is STILL broken — stop and investigate.
  5. **Cost sanity check (after file 10)**: If actual cost < 15% of ceiling, verify the prompt is changing between files.
  6. Monitor for failures in real-time — note error messages for failure deep-dives.
  7. Record wall-clock end timestamp.
  8. If any files failed due to token budget, run supplemental passes with `maxTokensPerFile: 150000`.
  9. Verify PR was created successfully. If tests failed, verify draft PR was created (orbweaver finding #6). If push failed, verify local PR summary file exists.
  10. Capture all output to `evaluation/run-5/orbweaver-output.log`.
  11. Record final tally: files instrumented / correctly skipped / failed.
  12. **Branch deliverable check**: Verify all files reported as instrumented have actual changes on the branch: `git diff main..orbweaver-branch --stat`. Cross-reference against agent's self-reported per-file status.
  13. Append any run observations to `evaluation/run-5/lessons-for-prd6.md` and `evaluation/run-5/orbweaver-findings.md`.

- [x] **Failure deep-dives** — For each failed file AND each run-level failure:
  1. **File-level failures**: For each failed/partial file: read orbweaver output log, identify validation rules that blocked instrumentation, map to orbweaver findings (run-4 and run-5), assess whether orbweaver fixes helped.
  2. **Run-level failures**: Push failures, test suite failures, schema evolution issues, commit noise — all get deep-dive treatment, not just file-level failures. Run-4 initially missed run-level failure analysis.
  3. For persistent failures (files that failed in runs 2-4): track the failure trajectory. Is the root cause the same or different each run?
  4. For new failures: file findings in `evaluation/run-5/orbweaver-findings.md` with acceptance criteria and evidence paths.
  5. Document in `evaluation/run-5/failure-deep-dives.md`.
  6. Append to `evaluation/run-5/lessons-for-prd6.md` and `evaluation/run-5/orbweaver-findings.md`.

- [x] **Per-file evaluation** — Full rubric applied to all files using standardized per-file agent methodology:
  1. **Gate checks + per-run rules (single agent)**: NDS-001, NDS-002, NDS-003, NDS-006, API-001, API-002, API-003, API-004, CDQ-008.
  2. **Per-file quality rules (per-file agents)**: Each agent gets rubric + one file's diff + Weaver schema + registry. Rules: NDS-004, NDS-005, COV-001 through COV-006, RST-001 through RST-005, SCH-001 through SCH-004, CDQ-001 through CDQ-007.
  3. **Apply rubric clarifications**: CDQ-002 semantic check, CDQ-006 cheap computation exemption, NDS-005 sub-classification.
  4. **Schema coverage split**: Classify each file as schema-covered or schema-uncovered. For uncovered files, evaluate SCH-002 on invention quality.
  5. **Branch state verification**: Evaluate `git diff main..orbweaver-branch` — do NOT trust the agent's self-reported per-file status.
  6. Zero-span files: verify correct skip decisions.
  7. Failed files: evaluate against NDS rules only.
  8. Structured output format: `{rule_id} | {pass|fail} | {file_path}:{line_number} | {actionable_message}`
  9. Emit as `evaluation/run-5/per-file-evaluation.json` (canonical) and render `evaluation/run-5/per-file-evaluation.md` from it.
  10. Append to `evaluation/run-5/lessons-for-prd6.md` and `evaluation/run-5/orbweaver-findings.md`.

- [x] **PR artifact evaluation** — Evaluate the PR as a first-class deliverable:
  1. If PR exists (including draft PR): evaluate description quality, per-file table accuracy, span counts, agent decision notes.
  2. **Verify per-file table claims against branch state.** Run-4 found 3 files where the PR summary reported work that was never committed.
  3. Assess: Does the PR help a reviewer understand what the agent did and make informed merge decisions?
  4. If draft PR (test failures): evaluate the "Test Failures" section (orbweaver finding #6).
  5. If PR was lost: document why and assess artifact discoverability (orbweaver finding #5).
  6. Document in `evaluation/run-5/pr-evaluation.md`.
  7. Append to `evaluation/run-5/lessons-for-prd6.md` and `evaluation/run-5/orbweaver-findings.md`.

- [x] **Rubric scoring** — Synthesize per-file findings into dimension-level scores:
  1. Aggregate from `evaluation/run-5/per-file-evaluation.json`.
  2. Score each dimension with per-rule evidence AND per-file instance counts (files passing/failing each rule).
  3. Apply schema coverage split scoring as standard (SCH-002 split by covered/uncovered files).
  4. Classify each failure as persistent, new regression, genuine new finding, or methodology-driven.
  5. Apply systemic bug classification where applicable (one root cause → one finding, N affected instances).
  6. **Single canonical score** using per-file evaluation + schema coverage split. Provide methodology-adjusted comparison ONLY for backward compatibility with runs 2-4.
  7. Emit as `evaluation/run-5/rubric-scores.json` (canonical) and render `evaluation/run-5/rubric-scores.md`.
  8. Append to `evaluation/run-5/lessons-for-prd6.md` and `evaluation/run-5/orbweaver-findings.md`.

- [x] **Baseline comparison and synthesis** — Compare run-5 vs run-4 vs run-3 vs run-2:
  1. Dimension-level trend analysis (4-run).
  2. File outcome comparison: improved / regressed / same. Track both rule persistence and file persistence.
  3. Failure classification: resolved / persistent / new.
  4. **Schema evolution impact assessment**: Key question for run-5 — with evolution working, did naming consistency (SCH-001) and attribute registration (SCH-002) improve for schema-uncovered files?
  5. **Handoff process assessment**: Did orbweaver correctly triage the run-4 findings? Which fixes landed? Which were rejected and why?
  6. Assessment of run-4 score projections (§9 of actionable-fix-output.md): did the 3-tier prediction (minimum/target/stretch) hold?
  7. **Cost comparison**: Run-4 was $5.84 (8.6% of ceiling — broken schema evolution symptom). Run-5 with working evolution should have higher costs. Compare and interpret.
  8. Document in `evaluation/run-5/baseline-comparison.md`.
  9. Append to `evaluation/run-5/lessons-for-prd6.md`.

- [x] **Actionable fix output** — Produce fix instructions for remaining failures:
  1. For each remaining quality rule failure: what's wrong, evidence, desired outcome.
  2. For each remaining failed file: root cause, desired outcome, finding cross-references.
  3. Assessment of run-4 findings: which were fixed, which remain, any new findings.
  4. Run-5 rubric gap assessment.
  5. Run-6 verification checklist.
  6. Score projection for run-6 (3-tier: minimum/target/stretch with explicit assumptions — run-4 proved single-tier predictions are unreliable).
  7. Generate from canonical JSON artifacts to prevent drift.
  8. Document in `evaluation/run-5/actionable-fix-output.md`.
  9. Final review of `evaluation/run-5/lessons-for-prd6.md` and `evaluation/run-5/orbweaver-findings.md`.

- [x] **Handoff to orbweaver** — Produce recommendation document for the target repo:
  1. ~~Create `evaluation/run-5/handoff-to-orbweaver.md` following the run-4 format.~~ **Decision: actionable-fix-output.md IS the handoff.** Separate document would be redundant — the actionable fix output already includes acceptance criteria, carry-forwards, priority matrix, and is written to the orbweaver maintainer. See decision log 2026-03-17.
  2. All evidence references use absolute local filesystem paths (both repos on the same machine). → **Covered**: orbweaver-findings.md uses local paths.
  3. ~~Each finding classified as PRD or Issue with evidence paths.~~ **Decision: classification is orbweaver team's responsibility.** Eval provides priority recommendations, orbweaver devs right-size the work (PRD vs Issue) based on their codebase knowledge.
  4. Include "What the Eval AI Got Wrong Before" section. → **Covered**: §4 Resolution Quality Assessment documents 3 superficial resolutions and calibration notes.
  5. Include handoff process retrospective. → **Covered**: §4 summary and lessons-for-prd6.md handoff observations.

- [ ] **Draft PRD #6 for next evaluation run** — Create PRD #6 on a separate branch from main (evaluation branches never merge):
  1. Run-5 scores as baselines.
  2. All items from `evaluation/run-5/lessons-for-prd6.md`.
  3. Carry forward unresolved findings and spec gaps from `evaluation/run-5/actionable-fix-output.md` §11 (carry-forwards) and §12 (failing files as test cases).
  4. Encode process lessons: handoff process refinements, evaluation methodology standardization, schema coverage split continuation. (Updated per Decision 2026-03-17: handoff IS the actionable-fix-output — no separate handoff document needed. PRD #6 should use the same pattern.)
  5. Validate run-5 score projections against actual results and update projection methodology if needed.
  6. Create on a separate branch from main and PR to main — evaluation branches are never merged, so the PRD must reach main independently.
  7. PRD #6 actionable-fix-output milestone must include a cross-document audit agent step as the final sub-item (Updated per Decision 2026-03-17: audit agent caught 22 missing items in run-5).
  8. PRD #6 should NOT include PRD/Issue classification for findings — provide priority recommendations only, let orbweaver team right-size the work (Updated per Decision 2026-03-17).

---

## Evaluation Branch Lifecycle

Evaluation run branches (feature/prd-N-evaluation-run-*) are **never merged to main**. PRs are created so CodeRabbit can review the evaluation artifacts, but the PR is closed after review, not merged. The evaluation data lives only on the feature branch.

**Implications for PRD drafting:** When a milestone says "draft PRD #N+1," that file must be created on main via a separate branch and PR — it cannot ride on the evaluation branch.

**Implications for rubric/schema changes:** Any rubric updates, schema changes, or evaluation methodology changes that need to persist across runs must be committed to the appropriate repo (spinybacked-orbweaver for rubric, commit-story-v2 for schema) independently of the evaluation branch.

---

## Evaluation Architecture

Carried forward from run-4 with standardized methodology.

### Agent Structure

**Agent 1: Gate + Per-Run Rules**
- Needs cross-file context (package.json, all diffs, all tracer names)
- Rules: NDS-001, NDS-002, NDS-003, NDS-006, API-001, API-002, API-003, API-004, CDQ-008
- Input: all instrumented file diffs, package.json diff, test results

**Per-File Agents (one per instrumented file)**
- Each gets: rubric + one file's diff + Weaver schema + registry + schema-covered/uncovered classification
- Rules: NDS-004, NDS-005 (with sub-classification), COV-001 through COV-006, RST-001 through RST-005, SCH-001 through SCH-004, CDQ-001 through CDQ-007 (with CDQ-002 semantic check, CDQ-006 cheap computation exemption)
- Output: structured `{rule_id} | {pass|fail} | {file_path}:{line_number} | {actionable_message}`

**Synthesis Agent**
- Aggregates per-file findings
- Applies systemic bug classification
- Resolves conflicts between per-file agents
- Produces dimension-level scores with instance counts

---

## Process Improvements Encoded from Run-4

| Lesson | Where Encoded |
|--------|---------------|
| Schema evolution was broken — verify before processing files | Pre-run verification, step 2 (smoke test) |
| Push validation: read access ≠ push access | Pre-run verification, step 3 (git push --dry-run) |
| Create both output documents (findings + lessons) at start | Collect lessons milestone |
| Track orbweaver findings separately from process lessons | Collect lessons milestone, steps 1-2 |
| Use `orbweaver-` prefix for new filenames | Collect lessons milestone, step 1 |
| Use findings vocabulary (PRD vs Issue) from start | Collect lessons milestone, step 1 |
| Cross-repo evidence references in findings | Handoff milestone, step 2 |
| Schema evolution health check after first 3 files | Evaluation run, step 4 |
| Cost sanity check (< 15% of ceiling → investigate) | Evaluation run, step 5 |
| Branch state verification (diff, not self-report) | Per-file evaluation, step 5 |
| Run-level failures get deep-dive treatment | Failure deep-dives, step 2 |
| Per-file evaluation as canonical methodology | Evaluation process improvements, step 4 |
| Schema coverage split as standard scoring dimension | Evaluation process improvements, step 5 |
| Instance counts alongside rule-level scores | Evaluation process improvements, step 6 |
| Systemic bug classification | Evaluation process improvements, step 7 |
| CDQ-002 semantic check standardization | Evaluation process improvements, step 1 |
| CDQ-006 cheap computation exemption | Evaluation process improvements, step 2 |
| NDS-005 expected-condition sub-classification | Evaluation process improvements, step 3 |
| Recommendation-document handoff (not direct issues) | Handoff milestone |
| 3-tier score projections (not single-tier) | Actionable fix output, step 6 |
| Each PRD drafts the next on main (eval branches never merge) | Draft PRD #6 milestone, step 6 |

---

## Score Projections (from Run-4 Actionable Fix Output § 9)

These are the run-4 projections. Run-5 should validate them and update the projection methodology.

### Minimum (critical infrastructure only — findings #1, #2)

- NDS-002 gate: FAIL → PASS
- SCH-001, SCH-002: Likely improved (evolution propagates naming/attributes)
- Expected: ~62-65% strict (from 58%)

### Target (critical + high priority — findings #1, #2, #3, #9, #13)

- NDS-005: FAIL → PASS
- CDQ-002: FAIL → PASS
- COV-001: FAIL → PASS
- Expected: **85% canonical** (22/26). Note: run-4 projected this as "85% adjusted" — run-5's canonical methodology (per-file + schema split) subsumes the run-4 adjusted scoring.

### Stretch (all genuine findings — additionally #10, #12)

- SCH-001: potentially PASS (evolution + naming template)
- RST-001: FAIL → PASS
- Expected: **92% adjusted** (24/26), ~77% strict (20/26)

**Calibration note:** Run-3 predicted "fresh build → ~85%" and was wrong (actual 58% strict) because 8 new files introduced new failure classes. Run-5 predictions should account for: (1) the file set may change, (2) fixed bugs may reveal previously-masked bugs, (3) schema evolution working may change attribute/naming patterns.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Schema evolution still broken after orbweaver fix | Pre-run smoke test (milestone 2, step 2). If it fails, STOP — do not waste a full run. |
| Push credentials fail despite pre-run check | Use `git push --dry-run` (milestone 2, step 3), not read-only `git ls-remote`. |
| Orbweaver findings were rejected by triage — fewer fixes than expected | Handoff triage review (milestone 2, step 1). Adjust score expectations based on what was actually fixed. |
| Schema evolution working reveals new failure classes | Expected — this is a feature, not a bug. Run-4 couldn't test cross-file schema coherence. New failures in this area are valuable diagnostic data. |
| Cost anomaly continues despite schema evolution fix | Cost sanity check (milestone 4, step 5). If cost < 15% of ceiling, investigate caching behavior. |
| PR delivery fails again (3rd consecutive failure) | Pre-run push verification. If draft PR feature (finding #6) was implemented, verify it works on test failure. |
| Score projections wrong again | Use 3-tier projections with explicit assumptions. Document which assumptions held and which didn't. |
| Evaluation methodology changes make cross-run comparison harder | Canonical methodology established in run-5. Provide adjusted scores for runs 2-4 comparability. |
| More files enter scope (new subsystems added to commit-story-v2) | Track file set changes explicitly. New files add surface area for new failure types. |

---

## Handoff Process

Run-5 uses the recommendation-document handoff process established in run-4:

1. **Evaluation produces findings** — `evaluation/run-5/orbweaver-findings.md` with evidence links, priority classifications, and acceptance criteria
2. **Recommendation document** — `evaluation/run-5/handoff-to-orbweaver.md` summarizes findings for the target repo AI, using absolute local filesystem paths
3. **Target repo AI triages** — The orbweaver AI reads the handoff, verifies claims against its codebase, right-sizes work (PRD vs Issue), and files what's valid
4. **Triage report** — The orbweaver AI produces a triage report documenting which findings were confirmed, rejected, or reclassified
5. **Run-6 validates** — The next evaluation run checks whether the triage and fixes were effective

**Why this is better than direct issue filing:** The orbweaver AI knows its own codebase — it can verify root causes, check for prior changes, and assess fix complexity more accurately than the eval AI.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-16 | Add evaluation process improvements as first milestone | Run-4 discovered methodology changes organically mid-stream. Formalizing them before evaluation begins gives cleaner results. |
| 2026-03-16 | Establish per-file evaluation as canonical methodology | Run-4 produced 4 scoring variants creating confusion. One methodology + schema coverage split = one canonical score. Adjusted scores only for backward compatibility. |
| 2026-03-16 | Do NOT pre-register summary subsystem attributes in Weaver schema | Keeping the gap tests the agent's schema extension capability — a harder, more valuable test than "follow registry instructions." See run-4 decision log 2026-03-16. |
| 2026-03-16 | Add handoff milestone as formal evaluation deliverable | Run-4 established the recommendation-document pattern. Run-5 formalizes it as a milestone and validates the process. |
| 2026-03-16 | Schema evolution smoke test as blocking pre-run check | Schema evolution was completely broken in run-4 (all 29 files got identical schema). Catching this before a full run saves 80+ minutes. |
| 2026-03-16 | Run-level failures get deep-dive treatment alongside file-level | Run-4's deep-dive initially focused on file-level failures only. Push failure, schema evolution breakdown, and test suite failure were equally important. |
| 2026-03-16 | Use `orbweaver-` filename prefix for run-5+ | CLI renamed from `orb` to `orbweaver` (spinybacked-orbweaver #123). Historical run-1 through run-4 filenames preserved. |
| 2026-03-16 | Add cost anomaly as standard diagnostic signal | Run-4's $5.84 (8.6% of $67.86 ceiling) was a symptom of broken schema evolution. Low cost:ceiling ratio should trigger investigation, not celebration. |
| 2026-03-16 | Evaluation branches never merge — PRDs drafted on separate branches from main | Evaluation run branches get PRs for CodeRabbit review only, then are closed. Any files needed on main (PRDs, rubric updates) must be committed independently via their own branch + PR. |
| 2026-03-17 | Actionable-fix-output.md IS the handoff — no separate handoff document | Run-4 had separate actionable-fix-output.md and handoff-to-orbweaver.md. In run-5, the actionable fix output already includes acceptance criteria, priority matrix, carry-forwards, and is written to the orbweaver maintainer. A separate handoff would be redundant. |
| 2026-03-17 | PRD/Issue classification is orbweaver team's responsibility, not eval's | Eval provides priority recommendations and acceptance criteria. The orbweaver devs right-size the work (PRD vs Issue) based on their codebase knowledge. Eval was over-prescribing work breakdown in run-4. |
| 2026-03-17 | Run cross-document audit agent at end of actionable-fix-output milestone | Initial draft missed 22 items from other evaluation documents. An audit agent that reads ALL docs and cross-references against the actionable fix output catches gaps before handoff. |

---

## Prior Art

- **PRD #4**: Run-4 evaluation (this repo, branch `feature/prd-4-evaluation-run-4`)
- **PRD #3**: Run-3 evaluation (this repo)
- **PRD #2**: Run-2 evaluation (this repo)
- **evaluation/run-4/**: Full run-4 documentation (on branch `feature/prd-4-evaluation-run-4`)
  - `per-file-evaluation.json`: Canonical per-file evaluation data
  - `rubric-scores.json`: Canonical rubric scoring data
  - `orb-findings.md`: 13 findings with acceptance criteria
  - `handoff-to-orbweaver.md`: Recommendation document for orbweaver triage
  - `lessons-for-prd5.md`: Forward-looking improvements (primary input for this PRD)
  - `actionable-fix-output.md`: Fix instructions with score projections
  - `baseline-comparison.md`: Run-4 vs run-3 vs run-2
  - `failure-deep-dives.md`: Root cause analysis
  - `pr-evaluation.md`: PR artifact quality assessment
- **evaluation/run-3/**: Full run-3 documentation (on branch `feature/prd-3-evaluation-run-3-with-fixes`)
- **evaluation/run-2/**: Full run-2 documentation (on branch for PRD #2)
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
- **spinybacked-orbweaver/research/rubric-codebase-mapping.md**: Rule-to-code mapping
