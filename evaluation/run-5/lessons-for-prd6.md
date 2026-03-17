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

---

## Evaluation Methodology

*Observations about the evaluation approach itself — scoring, agent structure, output formats.*

- **Schema checks were silently skipped in runs 2-4.** PR #173 (merged before run-5) enables SCH-001 through SCH-004 validation during the agent's fix loop, plus activates the LLM judge during retries. This means run-5 is the first run where the agent gets schema feedback during instrumentation. All prior SCH dimension scores reflect an agent that never received schema validation signals — cross-run SCH comparisons must account for this. Run-4's score projections did not anticipate this change and may underestimate SCH improvement.
- **Prompt changes between runs affect baseline comparability.** PR #175 (merged before run-5) changes span naming guidance, adds undefined guard constraints, and renames all five prompt examples. Combined with schema checks firing, run-5 agent behavior may differ significantly from run-4. Document which PRs landed between runs as part of pre-run verification to enable accurate attribution when scores change.

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

---

## Carry-Forward Items

*Unresolved items from prior runs that should appear in PRD #6.*

- npm package name collision: `orbweaver` on npm is a different project (see orbweaver-findings.md PRE-1)
- Schema extension namespace enforcement may reject span-type extensions incorrectly (see orbweaver-findings.md PRE-2)
- Finding #3 (expected-condition catches) has prompt-only fix with no automated validator — highest risk for regression in run-5
