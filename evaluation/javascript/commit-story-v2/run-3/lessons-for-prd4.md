# Lessons and Enhancements for PRD #4

Collected during run-3 evaluation. This document is the primary input for drafting PRD #4.

## Rubric-Codebase-Mapping Corrections (Applied)

These corrections have already been applied to `spinybacked-orbweaver/research/rubric-codebase-mapping.md`:

1. **API-002: Library classification was wrong.** The mapping said "commit-story-v2 is a CLI tool (application)" and expected `@opentelemetry/api` in `dependencies`. commit-story-v2 is a distributable npm package (library) — `peerDependencies` is correct. Fixed at line 600.

2. **COV-006: LangChain/LangGraph auto-instrumentation exists.** The mapping said "No OTel auto-instrumentation package — manual spans required" for `@langchain/anthropic` and `@langchain/langgraph`. OpenLLMetry (`@traceloop/instrumentation-langchain`) provides auto-instrumentation. Fixed at lines 431-437. Decision tree updated to flag agents that use manual spans when auto-instrumentation is available.

## Rubric Gaps (Need Investigation)

3. **COV-006 OpenLLMetry coverage — agent already knows about it.** The orb agent's built-in allowlist (`src/agent/prompt.ts` lines ~119-138) already maps `@langchain/*` → `@traceloop/instrumentation-langchain`. The agent follows a detect → defer → document pattern: when it sees a framework import on its allowlist, it records the auto-instrumentation library in `librariesNeeded` instead of adding manual spans. Manual spans are the fallback only when no auto-instrumentation exists. This means if run-3 produced manual spans on `journal-graph.js` (which imports `@langchain/langgraph`), that's a confirmed COV-006 failure — the agent had the mapping and should have used auto-instrumentation. PRD #4 should still verify OpenLLMetry's exact LangChain/LangGraph operation coverage, but the agent-side support is confirmed.

   **Additional context**: The allowlist is currently hardcoded in the prompt template with no user configuration. An issue is being filed on spinybacked-orbweaver to make it configurable via `orb.yaml`. The agent also has a COV-006 validation check (`src/validation/tier2/cov006.ts`) that catches manual spans duplicating auto-instrumentation — it's a blocking check that triggers retries.

## Evaluation Process Improvements

4. **Use full 31-rule rubric systematically.** An initial evaluation framework improvised ~13 rules and missed COV-006, all gate checks, most NDS/API rules. The rubric exists — use it. Mark rules N/A with rationale rather than silently dropping them.

5. **RST-005 is N/A for this codebase.** No prior instrumentation exists, so "no re-instrumentation" is vacuously true. Only code-level rule that doesn't apply.

6. **Use structured evaluation output format.** The rubric specifies: `{rule_id} | {pass|fail} | {file_path}:{line_number} | {actionable_message}`. This makes results machine-readable and could feed into orb's fix loop in future runs.

7. **Failure deep-dives should be a formal milestone.** Run-3 did this during the "Evaluation run-3" milestone (producing `orb-issues-to-file.md`), but it wasn't called out as a separate step in the PRD. The lesson from run-3 is that taking the time to really understand *why* each file failed — not just categorizing successes and failures — is where the most valuable evaluation insights come from. PRD #4 should have an explicit milestone for this:
   - For each failed file: understand the root cause deeply, not just "null parsed_output" but *why* the output was null
   - File issues on spinybacked-orbweaver as needed, with acceptance criteria tied to specific target files
   - The failure analysis produces the most actionable feedback for improving the agent

8. **PR artifact evaluation should be a formal milestone.** The PR is a first-class evaluation artifact — it's how the agent presents its work. PRD #4 should have a dedicated step that evaluates the PR holistically:
   - **If the PR was lost**: Why? How do we prevent it in run-4? (Run-3: git push auth failed in vals environment after 35 minutes of instrumentation work)
   - **If the PR exists**: Is the PR description good? Are all sections useful? Should there be additional sections? Is the summary accurate? Does it correctly describe what was instrumented and why?
   - **PR as communication**: Does the PR help a reviewer understand what the agent did and make informed merge decisions?

## Per-File Evaluation Findings

9. **CDQ-007 PII concern is in the Weaver schema, not the agent.** `commit_story.commit.author` records a person's name as a telemetry attribute. The agent correctly followed the schema — the fix belongs in the schema (hash or anonymize author names, or add a PII annotation so exporters can redact). PRD #4 should either update the schema or add an explicit PII-accepted annotation.

10. **API-002 regression: agent made @opentelemetry/api optional.** The pre-instrumentation package.json correctly had `@opentelemetry/api` as a required peerDependency. The agent added `peerDependenciesMeta` marking it optional, contradicting the unconditional imports in all 11 source files. This is a new bug not seen in run-2.

11. **API-003 repeat: vendor mega-bundle still added.** Despite spinybacked-orbweaver #61 being filed, the agent still added `@traceloop/node-server-sdk` (the Traceloop mega-bundle) as a peerDependency. Same finding as run-2. The fix for #61 must be verified before run-4.

12. **CDQ-008/SCH-001 repeats from run-2: naming inconsistency persists.** Two tracer naming conventions (`commit_story` vs `commit-story`) across 11 files, and 4+ span naming patterns. The tracer name fix (spinybacked-orbweaver #64) and span name fix (#65) must be verified before run-4.

13. **CDQ-003: agent could change `catch {` to `catch (error) {` without breaking behavior.** In commit-analyzer.js, the original code uses catch-without-variable. The agent preserved this (good for NDS-005) but couldn't then call `recordException`. Changing `catch {` to `catch (error) {` is semantically identical — the agent should recognize this as a safe transformation.

## Critical Process Finding: Stale Build

15. **Run-3 used a stale orb build — fixes #61, #64, #65 were NOT compiled.** The globally-installed `orb` is symlinked to the local spinybacked-orbweaver repo, which runs from `dist/` (TypeScript → JS). The source was updated (Mar 13 07:08) but `dist/agent/prompt.js` was last built Mar 12 09:21 — before the fixes were merged. `npm run prepare` was never run after merging fixes. This means:
    - API-003 (mega-bundle), CDQ-008 (tracer naming), SCH-001 (span naming) "repeat failures" are expected — the fixes were never tested
    - The evaluation results are still accurate (they describe what the agent produced) but the interpretation changes
    - **PRD #4 must add a pre-run step**: `cd spinybacked-orbweaver && npm run prepare && orb --version` — verify the build timestamp is after the latest fix merge

## Evaluation Architecture Improvements

14. **Use agent-per-file for per-file/per-instance quality rules.** Run-3 evaluation was done in a single pass, which creates pressure to batch and skim when patterns repeat. PRD #4 should use a hybrid approach:
    - **One agent**: gate checks + per-run rules (CDQ-008, API-002/003, NDS-001/002) — needs cross-file context
    - **Per-file agents**: per-file/per-instance quality rules (NDS-003/004/005, COV-*, RST-*, API-001/004, SCH-*, CDQ-001/002/003/005/006/007) — each gets the rubric + one file's diff + Weaver schema
    - **Synthesis agent**: aggregates per-file findings into the final evaluation document
    This prevents lazy pattern-matching and ensures each file gets thorough attention.

## Items to Carry Forward

- 11 orb issues documented in `evaluation/run-3/orb-issues-to-file.md` — verify which are fixed before run-4
- 3 rubric gaps from run-2 (API-004 SDK setup carve-out, coverage partial scoring, module system correctness rule) — still need assessment
- OpenLLMetry research needed before COV-006 can be scored definitively
- Run-3 per-file evaluation: 4/4 gates pass, 19/26 quality rules pass (73%). See `evaluation/run-3/per-file-evaluation.md`
- 7 quality rule failures to address: API-002, API-003, SCH-001, SCH-002, CDQ-003, CDQ-007, CDQ-008
- Repeat failures from run-2: API-003 (mega-bundle), CDQ-008 (tracer naming), SCH-001 (span naming)
- New failure in run-3: API-002 (@opentelemetry/api made optional)
