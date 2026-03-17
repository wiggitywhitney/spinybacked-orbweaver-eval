# Lessons for PRD #6

Observations, rubric gaps, process improvements, and methodology notes captured throughout run-5 evaluation. This document is the primary input for drafting PRD #6.

---

## Rubric Gaps

*Rules that proved insufficient, ambiguous, or missing during evaluation.*

- CDQ-002 pattern-only check was insufficient — run-3 and run-4 both had incorrect tracer names (`'unknown_service'`) that passed. Clarified to semantic check matching `package.json#name`.
- CDQ-006 lacked exemption for trivial type conversions — `toISOString()` was flagged despite O(1) cost. Added cheap computation exemption list.
- NDS-005 lacked sub-classification for expected-condition catch blocks — run-4 found 3 files where silent catches (validation, fallbacks) had `recordException()` added. Added NDS-005a (structural breakage) and NDS-005b (expected-condition recording) sub-classifications.

---

## Process Improvements

*Workflow changes that would make the next evaluation run smoother.*

- **Include failing file reproductions in orbweaver handoff.** Run-3 ported specific files that were failing to the orbweaver repo as test cases — the fix isn't done until instrumentation on that particular file works. Run-4 skipped this, making it harder to verify fixes were actually effective. PRD #6 handoff should include concrete failing files so orbweaver can use them as acceptance criteria for each fix.
- **Always use local binary path for orbweaver, never npx.** `npx orbweaver` resolves to an unrelated webcrawler package on npm (punkave/orbweaver v0.1.4). The correct invocation is `node /path/to/spinybacked-orbweaver/bin/orbweaver.js`. Document this in PRD evaluation run setup instructions.
- **Recommendation-document handoff validated.** All 13 run-4 findings were filed and merged. The orbweaver AI right-sized work correctly (downgraded one PRD to Issue, folded one Issue into a PRD). Three additional bugs were discovered during fix implementation. The handoff process works and should be continued.
- **Save partial file diffs before discarding.** Run-5 discovered that orbweaver's partial file changes (working tree modifications for files that weren't committed) leak into other branches when switching. These diffs are valuable evaluation artifacts — save them before discarding. Added `evaluation/run-5/partial-diffs/` pattern.
- **Validation pipeline introduces coverage/quality tradeoff.** Run-5 committed 9 files vs run-4's 16 — validation catches real issues but prevents files from being delivered. PRD #6 should decide: is partial-but-validated better than complete-but-unvalidated? Consider progressive validation (warn first, enforce on retry).
- **Run duration unpredictable with retries.** The validation/retry loop turns a predictable ~80-minute run into an overnight run. PRD #6 should recommend retry budget configuration (max retries, max time per file) as an orbweaver feature.
- **Push authentication persists across 3 runs.** The SSH vs HTTPS git auth mismatch has never been fixed. PRD #6 handoff should escalate this from Low to High priority — it blocks the PR-as-deliverable evaluation every single run.

---

## Evaluation Methodology

*Observations about the evaluation approach itself — scoring, agent structure, output formats.*

- **Schema checks were silently skipped in runs 2-4.** PR #173 (merged before run-5) enables SCH-001 through SCH-004 validation during the agent's fix loop, plus activates the LLM judge during retries. This means run-5 is the first run where the agent gets schema feedback during instrumentation. All prior SCH dimension scores reflect an agent that never received schema validation signals — cross-run SCH comparisons must account for this. Run-4's score projections did not anticipate this change and may underestimate SCH improvement.
- **Prompt changes between runs affect baseline comparability.** PR #175 (merged before run-5) changes span naming guidance, adds undefined guard constraints, and renames all five prompt examples. Combined with schema checks firing, run-5 agent behavior may differ significantly from run-4. Document which PRs landed between runs as part of pre-run verification to enable accurate attribution when scores change.
- **Validation raises the bar but lowers coverage.** Run-5 is the first run with active validation. This creates a scoring paradox: fewer files instrumented (worse coverage dimension) but surviving files have higher quality (better quality dimensions). The canonical scoring methodology needs to account for this — perhaps distinguishing "files the agent chose to skip" from "files the agent tried and failed."
- **Partial files contain valuable diagnostic data.** The 6 partial files show what the agent attempted and where it got stuck. Run-5 saved partial diffs (`evaluation/run-5/partial-diffs/`). These should be standard evaluation artifacts going forward.
- **Oscillation detection is a new failure class.** The fix/retry loop can make things worse (SCH-002 count increased from 9→12 on index.js). The detection works (prevents infinite loops) but the failure mode is new. The per-file evaluation should track oscillation as a distinct failure category.

- Established per-file agent evaluation + schema coverage split as the single canonical methodology. Previous 4-variant scoring (strict/adjusted/split/split+adjusted) dropped.
- Instance counts (files passing/failing each rule) added alongside rule-level scores for cross-run comparison nuance.
- Systemic bug classification formalized: one root cause → one finding with N affected instances, not N independent violations.
- Branch state verification (`git diff main..branch`) required as ground truth — do not trust agent self-reported per-file status.
- Cost anomaly diagnostic: actual < 15% of ceiling triggers investigation (broken schema evolution, caching, skipped analysis).

---

## Rubric-Codebase Mapping Corrections

*Errors or omissions discovered in rubric-codebase-mapping.md during evaluation.*

- API-002 mapping incorrectly classified commit-story-v2 as "CLI tool (application)" — it's distributed as an npm package (library). `@opentelemetry/api` should be in `peerDependencies`, not `dependencies`. Corrected in run-5 methodology milestone.

---

## Schema Decisions

*Schema evolution observations, attribute registration decisions, and Weaver-related notes.*

- **SCH validation now fires during agent fix loop (PR #173).** Prior runs had schema checks silently skipped — the agent instrumented files without any schema feedback. Run-5 is the first where the agent can self-correct on naming and attribute compliance. This should improve SCH-001 (span naming) and SCH-002 (attribute keys) but may increase cost (more retries) and could introduce new failure modes if the LLM judge rejects things the agent can't fix.
- **Schema evolution CONFIRMED WORKING in run-5.** `semconv/agent-extensions.yaml` was created with 14 attributes, all correctly namespaced under `commit_story.*`. This is a major improvement from run-4 where all extensions were rejected (finding #1). Extensions span 5 subsystems: context (2), git (5), journal (1), mcp (5), commit_story (1).
- **SCH-002 is the dominant failure mode.** Both failed files (summarize.js, index.js) and several partial files were blocked primarily by SCH-002 violations. The agent creates attributes the schema doesn't recognize, gets told to fix them, and either can't converge (oscillation) or runs out of retries. The schema-uncovered file scoring dimension is now critical — most of the interesting files are schema-uncovered.

---

## Carry-Forward Items

*Unresolved items from prior runs that should appear in PRD #6.*

- npm package name collision: `orbweaver` on npm is a different project (see orbweaver-findings.md PRE-1)
- Schema extension namespace enforcement may reject span-type extensions incorrectly (see orbweaver-findings.md PRE-2)
- Finding #3 (expected-condition catches) has prompt-only fix with no automated validator — needs evaluation in per-file analysis
- Push authentication failure persists across 3 runs — escalate to High priority (see orbweaver-findings.md persistent section)
- SCH-002 oscillation on complex files (see orbweaver-findings.md RUN-1) — needs fix/retry loop improvements
- Coverage/quality tradeoff from validation pipeline (see orbweaver-findings.md RUN-2) — needs design decision on partial commits
- Extended run duration from validation retries (see orbweaver-findings.md RUN-4) — needs retry budget configuration
- Run-5 file outcome comparison needed: 5 regressions (journal-graph, index, summarize, summary-manager, summary-detector), 2 improvements (message-filter and token-filter correctly skipped)
