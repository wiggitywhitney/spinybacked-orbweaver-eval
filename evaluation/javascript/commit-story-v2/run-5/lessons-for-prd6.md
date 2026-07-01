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
- **Avoid shell command substitution for timestamps.** Run-5's end time was lost because `$(date)` triggers manual approval in Claude Code. Use literal `date` commands or `time` prefix instead. Better yet, orbweaver should emit its own timestamps (see finding RUN-5).
- **Do not run another full evaluation until problematic files pass consistently.** Run-5 had 8 failed/partial files. These should be ported to the orbweaver test suite and used to refine the software before the next full run (see finding RUN-2).

---

## Evaluation Methodology

*Observations about the evaluation approach itself — scoring, agent structure, output formats.*

- **Schema checks were silently skipped in runs 2-4.** PR #173 (merged before run-5) enables SCH-001 through SCH-004 validation during the agent's fix loop, plus activates the LLM judge during retries. This means run-5 is the first run where the agent gets schema feedback during instrumentation. All prior SCH dimension scores reflect an agent that never received schema validation signals — cross-run SCH comparisons must account for this. Run-4's score projections did not anticipate this change and may underestimate SCH improvement.
- **Prompt changes between runs affect baseline comparability.** PR #175 (merged before run-5) changes span naming guidance, adds undefined guard constraints, and renames all five prompt examples. Combined with schema checks firing, run-5 agent behavior may differ significantly from run-4. Document which PRs landed between runs as part of pre-run verification to enable accurate attribution when scores change.
- **Partial files contain valuable diagnostic data.** The 6 partial files show what the agent attempted and where it got stuck. Run-5 saved partial diffs (`evaluation/run-5/partial-diffs/`). These should be standard evaluation artifacts going forward. However, the diffs only capture the final working tree state — they don't show per-retry snapshots. Per-retry visibility (what the agent tried at each iteration) would be a valuable orbweaver feature for diagnosing oscillation and convergence failures.
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

## Failure Deep-Dive Observations

*Insights from root cause analysis of all failed/partial files.*

- **COV-003/NDS-005b conflict is the dominant failure pattern.** 5 of 8 problematic files are affected. The validator requires error recording on ALL catch blocks within spans, but expected-condition catches should not record exceptions. The evaluation rubric (NDS-005b) and the orbweaver validator (COV-003) directly contradict each other. This must be resolved before the next evaluation run — it's the single highest-impact fix.
- **Validation pipeline traded coverage for quality.** Run-5 committed 9 files vs run-4's 16 — a 44% regression. But the 9 committed files are higher quality (schema-compliant, properly validated). The trade-off is correct in principle but the coverage loss is too severe. Fixing DEEP-1 (COV-003 exemption) would recover most of the lost coverage.
- **NDS-005b violations are IN the committed code, not just partial code.** journal-manager.js, summary-manager.js, and summary-detector.js all have `recordException`/`setStatus(ERROR)` on expected-condition catches in their committed diffs. The per-file evaluation must flag these — they will cause false error signals in production.
- **5 regressions are all caused by the new validation pipeline (PRs #171, #173), not agent quality degradation.** The agent's instrumentation decisions are generally sound. The regressions are infrastructure bugs: COV-003/NDS-005b conflict, SCH-002 on schema-uncovered attributes, function-level fallback code synthesis errors.
- **Schema-uncovered files are the key challenge going forward.** Both failed files (summarize.js, index.js) and many partial files need attributes for operations not in the Weaver schema. Either register more attributes or relax SCH-002 for namespace-compliant extensions.
- **Function-level fallback scope is too narrow.** It only processes exported functions, losing coverage on valuable internal functions (e.g., journal-graph.js node functions). It also has code synthesis bugs (corrupted imports).
- **Entry point file needs special handling.** index.js is a single point of failure for live-check — when it fails instrumentation, live-check silently degrades to meaningless ("OK" with no telemetry from the primary code path). Entry point should get relaxed validation (partial schema compliance, strip failing attributes) and live-check should report "DEGRADED" when the entry point failed. See finding DEEP-6.
- **Live-check should cross-reference instrumented files vs telemetry output.** Currently live-check has no visibility into which files were instrumented — it can't flag missing telemetry from failed files. Adding this cross-reference would catch entry point failures and other gaps.
- **Live-check cannot catch NDS-005b (semantic issue, not structural).** Live-check validates schema compliance via Weaver's OTLP receiver — attribute names, types, span structure. But NDS-005b (expected-condition catches recorded as errors) produces structurally valid telemetry. A `recordException()` on a file-not-found catch is valid OTel — Weaver can't tell it's semantically wrong. The NDS-005b LLM judge (`src/validation/tier2/nds005.ts`) runs during static validation but is not connected to live-check output. A future **post-run trace analysis** could detect NDS-005b in the wild by checking for "error spans on normal code paths" (e.g., every first-run journal save lights up as ERROR because the file doesn't exist yet). This would complement the static LLM judge with runtime evidence.
- **CodeRabbit CLI independently validated DEEP-3 (NDS-005b in committed code).** The CodeRabbit review of the full feature branch flagged 9 NDS-005b violations in partial diffs — exactly the instances documented in DEEP-3. This provides external validation that our analysis is correct.
- **No whole-file syntax check after function-level assembly.** Per-function LINT caught the `imimport` corruption, but there's no `node --check` or equivalent on the reassembled file. This is a latent gap — synthesis errors in import merging or scope assembly could slip through. See finding DEEP-7.

---

## Rubric Scoring Observations

*Added during rubric scoring milestone.*

- **Canonical score: 23/25 (92%).** First clean gate pass (5/5). But only 9/29 files committed — quality-vs-coverage tradeoff. The validation pipeline achieves high quality by filtering aggressively.
- **Quality-vs-coverage tradeoff must be the primary focus for PRD #6.** 92% quality on 9 files is less useful than 73% quality on 16 files. The handoff should prioritize DEEP-1 (COV-003 exemption), DEEP-2/DEEP-2b (fallback quality), and PR-4 (partial commits) — all coverage multipliers.
- **Superficial resolutions inflate the score.** NDS-005, CDQ-003, and RST-001 appear "resolved" but the underlying behaviors are unchanged — the validation pipeline filtered out violating files. PRD #6 should track these as latent failures that will regress if the pipeline is relaxed.
- **COV-006 became N/A due to journal-graph.js not committed.** This reduces the denominator from 26 (run-4) to 25 (run-5). PRD #6 should note this when comparing scores across runs.
- **Score projection methodology needs updating.** Run-4 predicted stretch 92% through rule fixes on a stable file set. Run-5 achieved 92% through a different mechanism (fewer files + fixes). PRD #6 projections should account for: (a) the file set will change as fixes land, (b) "resolved" rules may regress when more files commit, (c) 3-tier projections with explicit file-set assumptions for each tier.
- **Only 2 canonical failures remain: COV-001 (entry point) and COV-005 (zero attributes).** Both are in the COV dimension (60%). All other dimensions are at 100%. PRD #6 should focus on these 2 rules specifically.
- **Run-5's 92% should NOT be compared directly to run-4's 58%.** Different denominators (25 vs 26), different file sets (9 vs 16), and methodology changes make the comparison misleading. The meaningful comparison is dimension-level trends + file-level trajectories, not aggregate percentages.

---

## Carry-Forward Items

*Unresolved items from prior runs that should appear in PRD #6. Orbweaver software issues are tracked in orbweaver-findings.md — this section lists only eval-process carry-forwards.*

- Finding #3 (expected-condition catches) has prompt-only fix with no automated validator — needs evaluation in per-file analysis
- Run-5 file outcome comparison needed: 5 regressions (journal-graph, index, summarize, summary-manager, summary-detector), 2 improvements (summary-graph, journal-manager)
- Per-retry visibility not available — partial diffs only capture final state, not intermediate attempts. Consider requesting per-retry snapshots from orbweaver (see finding RUN-5)
- Orbweaver software findings to include in handoff: PRE-1, PRE-2, RUN-1 through RUN-5, DEEP-1, DEEP-2, DEEP-2b, DEEP-3 through DEEP-7, EVAL-1, EVAL-2, plus persistent push auth failure (see orbweaver-findings.md)
- **Failure trajectory data**: Track across runs whether the same root cause persists or changes for each problematic file. Run-5 showed root cause changes on 5 of 8 files (from run-4 issues to validation pipeline issues)

---

## Per-File Evaluation Observations

*Added during per-file evaluation milestone.*

- **Committed file quality is high.** 7 of 9 committed files pass ALL applicable rules (22/22). Only COV-005 failures on 2 schema-uncovered files (auto-summarize.js, server.js) which set zero attributes.
- **Schema-uncovered files with zero attributes are the gap.** COV-005 evaluates schema-uncovered files on "invention quality" — whether the agent adds domain-relevant attributes even without registry guidance. auto-summarize.js and server.js both failed this: 3+1 spans with zero attributes, providing minimal observability beyond "function was called."
- **CDQ-002 fully resolved.** All 9 files use `trace.getTracer('commit-story')` matching package.json name. Run-4's systemic 'unknown_service' bug is confirmed fixed.
- **CDQ-008 fully resolved.** Single consistent tracer naming pattern across all files. Run-4's 4-convention inconsistency is gone.
- **Schema evolution attributes are well-formed.** Agent-extensions.yaml contains 14 attributes, all correctly namespaced. Schema-covered files use registry attributes correctly (types match, enum values valid).
- **NDS-005b is confirmed as the dominant partial-file quality issue.** 8 instances across 3 partial files (journal-manager, summary-manager, summary-detector). Systemic root cause: DEEP-1 (COV-003 validator lacks expected-condition exemption).
- **NDS-003 violations in ALL partial files from duplicate JSDoc.** The agent generates a second JSDoc block before each function it instruments. Cosmetic but systematic — every function touched gets duplicate documentation. DEEP-4 finding confirmed as universal.
- **Borderline NDS-005 cases in committed code.** commit-analyzer.js getChangedFiles and isMergeCommit have catch blocks returning defaults — borderline between "expected condition" and "defensive error handling." Classified as PASS because git failure is genuinely an error (unlike file-not-found on first run). PRD #6 should refine the NDS-005b boundary: "expected condition" = the catch is the NORMAL path for first-run/optional resources; "defensive error handling" = the catch handles genuine failures gracefully.
- **@traceloop packages in peerDependencies.** Agent added auto-instrumentation packages as optional peerDependencies. Doesn't fail any rubric rule (API-003 covers vendor-specific SDKs) but contradicts the OTel principle that libraries should depend only on the API. Consider adding a rubric rule for library dependency hygiene.
- **Per-item error recording in loops (auto-summarize.js).** Agent calls `span.setStatus({code: ERROR})` inside per-item catch in a loop. If one item fails but others succeed, the span shows ERROR. Semantically imprecise but CDQ-003 pattern is correct. Consider adding a CDQ rule for span status accuracy in batch operations.
- **Summary-graph.js namespace inconsistency (partial, not committed).** `generateMonthlySummary` uses `commit_story.ai.*` namespace while `generateDailySummary` uses `commit_story.journal.*`. Would fail SCH-001 naming consistency if committed. Observation for future run evaluation.
- **NDS-005b boundary needs refinement: LLM failure fallbacks.** CodeRabbit classified the `dailySummaryNode` inner catch (LLM call fails → return fallback message) as NDS-005b. Our evaluation classified it as PASS (genuine error, just handled gracefully). Both interpretations are reasonable. The system is designed for LLM calls to fail (fallback is intentional), making this an "expected condition" by system design. But the LLM call genuinely failed. PRD #6 should define: NDS-005b applies when the catch is part of normal control flow (file-not-found on first run), NOT when it handles a genuine failure that happens to have a graceful recovery. LLM failures should use `span.addEvent('llm.fallback')` instead of `recordException`, preserving observability without polluting error metrics.

---

## PR Artifact Evaluation Observations

*Added during PR artifact evaluation milestone.*

- **PR creation failed for the 3rd consecutive run.** Push authentication failure is persistent across runs 3, 4, 5. The PR-as-reviewable-artifact has never been tested in a live GitHub PR context. The draft PR on test failure feature (run-4 finding #6, implemented in orbweaver PR #168) has never been exercised.
- **Per-file table accuracy improved over run-4.** Run-4 had 3 phantom changes (files reported as having work but with no changes on branch). Run-5 correctly labels all 6 partial and 2 failed files, and branch verification confirms 0 diff lines for all non-committed files.
- **PR summary advisory findings contradict agent skip decisions.** 28 of 34 advisory findings suggest instrumenting functions the agent deliberately skipped with rubric justification. The advisory engine should consume skip decisions to avoid internal contradictions that erode reviewer trust.
- **Partial file instrumentation should be committable.** When function-level fallback succeeds on N of M functions, the entire file is discarded if any function fails. This is a primary contributor to the coverage regression (9 files vs 16 in run-4). summary-graph.js had 11/12 functions pass — 5 spans lost because 1 function failed COV-003.
- **auto_summarize span names missing from agent-extensions.yaml.** 3 span names used in committed code are not registered in the extensions file, while all other committed files' span names are. Inconsistency in schema extension tracking.
- **Live-check "OK" is misleading when entry point fails.** index.js failed instrumentation, was restored to original, and live-check ran against uninstrumented code. "OK" provides zero validation. Should report "DEGRADED" or "INCOMPLETE."
- **PR summary is comprehensive but too long for practical review (~430 lines).** Agent notes section alone is ~300 lines. Zero-span file justifications are repetitive (same RST-001 explanation 12 times). A "key decisions" summary section would help reviewers focus on what matters.
- **No per-file cost/retry breakdown in token usage.** Total cost ($9.72) is reported but not broken down by file. With 6 partial + 2 failed files going through retry loops, per-file costs would help identify expensive files and evaluate retry budget effectiveness.

---

## Baseline Comparison Observations

*Added during baseline comparison milestone.*

- **Score projection methodology needs file-set assumptions.** Run-4 predicted 92% stretch on 16 files. Run-5 achieved 92% on 9 files. Same percentage, completely different mechanism. PRD #6 projections must state file-set assumptions for each tier and distinguish "fix" (durable) from "filter" (fragile) resolution paths.
- **Three resolution types must be tracked separately.** Of 10 resolved run-4 rules: 4 genuine fixes, 3 methodology changes, 3 superficial (filtering). Only genuine fixes are durable. Superficial resolutions will regress if the validation pipeline is relaxed.
- **Schema evolution is the highest-impact single infrastructure change.** SCH dimension jumped 50% → 100%. Span naming consistency (persistent failure across runs 2-4) fully resolved. Cost increased 66% as expected (more cache misses). Run-5's 14.3% cost ratio vs run-4's 8.6% confirms broken evolution was the root cause of the cost anomaly.
- **COV-001 trajectory is worsening, not stable.** Run-4: index.js on branch but missing root span. Run-5: index.js failed entirely. The root span problem is getting harder to fix as schema validation catches more issues. Entry point handling (DEEP-6) should be highest priority for the handoff.
- **Push authentication is the longest-standing unresolved issue.** 3 consecutive failures. The PR artifact has never been delivered. This blocks evaluation of the draft-PR-on-failure feature (run-4 finding #6, implemented in PR #168).
- **Quality-coverage tradeoff is the defining tension for PRD #6.** 92% quality on 9 files vs 73% on 16 files. The ideal run-6 target is both metrics improving simultaneously — more files at the same quality. This requires DEEP-1 (COV-003 exemption) and RUN-1 (oscillation handling), not relaxing quality standards.
- **Handoff process validated.** 13/13 findings filed, 3 bonus bugs discovered. The orbweaver AI right-sized work correctly. Process should continue with improvement: include failing file reproductions as acceptance criteria, and assign explicit ownership for environmental issues.

---

## Actionable Fix Output Observations

*Added during actionable fix output milestone.*

- **Only 2 canonical failures remain.** COV-001 (entry point) and COV-005 (zero attributes), both in COV dimension. All other dimensions at 100%. PRD #6 fix priorities should target these 2 rules specifically.
- **Score projections must include file delivery counts.** Run-4's stretch prediction (92%) matched numerically but through filtering, not fixing. Run-6 projections state explicit file-set assumptions per tier: minimum (10 files), target (14-16), stretch (15-17).
- **Run-4 finding resolution quality was mixed.** 9/13 verified fixed, 1 partially fixed, 1 not fixed, 1 not testable, 1 revealed new issue. Three "superficial resolutions" (NDS-005, CDQ-003, SCH-002 passing because violating files filtered) confirm that tracking resolution TYPE (genuine/methodology/superficial) is essential for accurate progress measurement.
- **Critical path for run-6 is well-defined.** DEEP-1 (COV-003 exemption) → RUN-1 (oscillation detection) → DEEP-4 (duplicate JSDoc) → EVAL-1 (schema extension workflow). These 4 fixes address the 2 canonical failures and all 4 systemic bugs. The first 3 alone should recover 6+ files and reach 96%+ canonical.
- **"Unmasked bug" risk in projections.** When partial files recover and get committed, they may reveal new failures (e.g., SCH-002 violations, new NDS-005b instances) that weren't visible while those files were filtered. Run-6 projections should discount the stretch tier by ~5% for this risk.
- **Run a cross-document audit agent at the end of the actionable-fix-output milestone.** Run-5 initial draft missed 22 actionable items that existed in other evaluation documents (orbweaver-findings.md, failure-deep-dives.md, pr-evaluation.md, per-file-evaluation.md, lessons-for-prd6.md). An audit agent that reads ALL evaluation documents and cross-references against the actionable fix output caught these gaps. PRD #6 should include this as a mandatory step: after drafting actionable-fix-output.md, run an audit agent to verify completeness before committing.
- **Acceptance criteria must be reproduced in the actionable fix output, not just referenced.** The initial draft referenced orbweaver-findings.md finding IDs but didn't reproduce their acceptance criteria. The orbweaver devs may only read the actionable fix output — if acceptance criteria are only in findings.md, they'll be missed. The audit caught 6 items where acceptance criteria were inadequately covered.
