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

## Carry-Forward Items

*Unresolved items from prior runs that should appear in PRD #6. Orbweaver software issues are tracked in orbweaver-findings.md — this section lists only eval-process carry-forwards.*

- Finding #3 (expected-condition catches) has prompt-only fix with no automated validator — needs evaluation in per-file analysis
- Run-5 file outcome comparison needed: 5 regressions (journal-graph, index, summarize, summary-manager, summary-detector), 2 improvements (summary-graph, journal-manager)
- Per-retry visibility not available — partial diffs only capture final state, not intermediate attempts. Consider requesting per-retry snapshots from orbweaver (see finding RUN-5)
- Orbweaver software findings to include in handoff: PRE-1, PRE-2, RUN-1 through RUN-5, DEEP-1 through DEEP-7, plus persistent push auth failure (see orbweaver-findings.md)
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
