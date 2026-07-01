# Lessons for PRD #7

Observations, rubric gaps, process improvements, and methodology notes captured throughout run-6 evaluation. This document is the primary input for drafting PRD #7.

---

## Rubric Gaps

*Rules that proved insufficient, ambiguous, or missing during evaluation.*

- **COV-003 expected-condition exemption scope is too narrow.** DEEP-1 (#180) covers ENOENT-style catches but not three other common expected-condition patterns: (1) per-item-failure-collection catches, (2) swallow-and-continue catches, (3) try/finally without catch. These three patterns blocked 5 files. The exemption needs to cover any catch block where the code intentionally handles errors without rethrowing.
- **SCH-001 with a single-span registry creates a perverse incentive.** The agent must choose between semantic accuracy (correct span name → fails validation) or validation compliance (wrong name → passes). 4/5 committed files chose compliance, resulting in semantically incorrect span names. SCH-001 should either accept schema extensions or the registry needs more spans.
- **RST-004 vs COV-004 tension for unexported async functions.** RST-004 says skip unexported internals. COV-004 says cover async functions. context-capture-tool.js and reflection-tool.js have unexported async functions with file I/O. Run-5 instrumented them (COV-004); run-6 skipped them (RST-004). The rubric should clarify which rule takes precedence.
- **No rule for "validation caused regression."** auto-summarize.js was committed in run-5 but partial in run-6 due to stricter SCH-001 enforcement. The rubric has no rule for tracking when validation improvements block previously-committed files. Consider RUN-2 (from run-5 findings).

---

## Process Improvements

*Workflow changes that would make the next evaluation run smoother.*

- **Handoff triage was excellent — no process changes needed.** All 22 run-5 findings were filed and closed, plus 13+ additional issues discovered during implementation. The recommendation-document handoff process is validated across two cycles (run-4→5, run-5→6).
- **CLI renamed from orbweaver to spiny-orb between runs.** PRD artifact filenames, CLI invocations, and config references all need updating. Future PRDs should check for tool renames during pre-run verification.
- **Acceptance test fixtures are the gold standard for fix verification.** PRD #179 ported all 8 failing files as fixtures with 8/8 passing. This is more rigorous than prior runs where fixes were verified only by the next full evaluation run.
- **CI acceptance gate config issue persists.** The vitest exclude pattern catches `acceptance-gate.test.ts` in CI. This was tracked in #225 but the latest run still shows "No test files found." Run-6 should verify this is resolved before relying on CI results.
- **Run the instrument command in the user's terminal, not through Claude Code.** The command takes 30+ minutes, stdout is buffered when redirected to a file, and each progress poll requires manual tool approval. Future PRDs should provide the exact command and let the user run it in their own terminal, then resume evaluation after the run completes.
- **Prevent laptop sleep during instrumentation runs.** Run-6 was executed overnight as a Claude Code background task. The laptop slept mid-run, killing active API connections and causing widespread "terminated" failures. Use `caffeinate -s <command>` on macOS to prevent sleep during the run, or run on an always-on machine. The actual processing time was ~2 hours, not the 10.7 hours wall clock suggests.

---

## Evaluation Methodology

*Observations about the evaluation approach itself — scoring, agent structure, output formats.*

- **"Succeeded" classification is misleading.** Spiny-orb reported 21/30 "succeeded" but only 3 files were actually committed to the branch. Many "success" files used function-level fallback where all async functions (the ones needing spans) failed with API errors, resulting in 0 spans. The success/partial/failed tally is useful for spiny-orb diagnostics but NOT for evaluation scoring. Evaluation must count committed files with actual instrumentation changes.
- **Function-level fallback masks failures as successes.** When a file gets 9/15 functions "instrumented" but all 6 async functions fail, the file reports "success (0 spans)". This inflates the success count. The evaluation should track: (a) files committed with spans, (b) files committed without spans (correct skip), (c) files not committed.
- **Validator-evaluator conflict on SCH-001.** The validator enforces SCH-001 as strict registry conformance (span name must be in registry). The evaluator interprets SCH-001 as a quality guideline per the rubric-codebase mapping (span name must be meaningful and map to operation). This creates a paradox: files that pass the validator's SCH-001 fail the evaluator's SCH-001 (4/5 committed files). Run-7's rubric should reconcile this.
- **Run-5 score projections were completely wrong.** All three tiers (minimum 96%/10 files, target 96-100%/14-16 files, stretch 100%/15-17 files) were missed. Actual: 84%/5 files. Root cause: projections assumed fixed blockers wouldn't reveal new blockers. The "unmasked bug" risk was documented but under-weighted. Run-7 projections must account for dominant-blocker peeling.
- **Superficial resolution tracking worked well.** summary-manager.js (the only file recovered from partial→committed) was verified for NDS-005, CDQ-003, and RST-001. All three are genuinely resolved. The methodology should continue.

---

## Rubric-Codebase Mapping Corrections

*Updates needed to `spinybacked-orbweaver/research/rubric-codebase-mapping.md`.*

- **Test count outdated.** Mapping says 320 tests across 11 files. Run-6 has 534 tests across 22 files. Update the test count and file list.
- **SCH-001 section needs validator alignment note.** The mapping says SCH-001 is a soft quality guideline (evaluator judgment). The spiny-orb validator treats it as strict registry conformance. This divergence should be documented in the mapping with a note about which definition to use.
- **RST-004 function list may need context-capture-tool/reflection-tool update.** The mapping lists saveContext and saveReflection with a "precedence note." Run-6 agent applied RST-004; run-5 agent applied COV-004. The mapping should provide a definitive answer.

---

## Schema Decisions

*Decisions about the Weaver schema that affect evaluation scoring.*

- **SCH-001 forced semantic mismatch in server.js.** The agent used span name `commit_story.context.collect_chat_messages` for the MCP server `main()` function because it's the only registry-defined span. This is semantically wrong — the server entry point has nothing to do with collecting chat messages. SCH-001 creates a perverse incentive: use a wrong but registered name, or use a correct but unregistered name and fail validation.
- **Schema-uncovered files cannot add spans without schema extensions.** journal-graph.js, summary-graph.js, summary-detector.js, journal-manager.js, and journal-paths.js all have no matching registry spans. The agent removed spans from journal-paths.js entirely to satisfy SCH-001. This means coverage recovery is blocked by schema coverage — adding spans to these files requires adding span definitions to the Weaver registry first.

---

## Carry-Forward Items

*Unresolved items from prior runs that need to be carried into PRD #7.*

- **Push authentication: 4th consecutive failure.** Spiny-orb used HTTPS password auth instead of `gh` CLI despite #183 being closed. The fix may only work when GITHUB_TOKEN is set AND the remote uses a token-compatible URL format. This needs a different approach — possibly SSH or a pre-configured credential helper.
- **Laptop sleep was the dominant failure mode, not API overload.** "Anthropic API call failed: terminated" was caused by the laptop sleeping overnight during a Claude Code background task, killing active HTTP connections. Actual processing time was ~2 hours. Use `caffeinate -s` to prevent sleep, or run in the user's terminal where they can monitor. The one `overloaded_error` may have been a genuine transient API issue.
- **NDS-003 validation failures persist.** Multiple partial files (summarize.js, journal-graph.js, summary-detector.js) had functions skipped due to NDS-003 (non-instrumentation line modifications). The agent is still making small changes to original code during instrumentation (e.g., capturing return values in variables for setAttribute).
- **Cost was 10.1% of ceiling ($7.07/$70.20)** — below the 15% investigation threshold. Low cost is likely because many API calls were terminated early rather than completing. True cost of a successful full run would be higher.
- **PR summary does not reflect final branch state (RUN6-15).** The PR summary is generated from the initial processing pass, before validation retries. When the validator rejects span names, the agent retries with different names, but the summary still shows the original names. All per-file span names, statuses, schema extensions, and library claims are from pre-validation state. A reviewer relying on the PR summary would be severely misled.
- **Advisory engine still doesn't consume skip decisions (RUN6-16).** 76% of COV-004 advisories contradict correct RST-001/RST-004 skip decisions. CDQ-006 advisories incorrectly flag .toISOString() as expensive. Both issues identified in run-5 (PR-3) and persist.
- **PR summary agent notes are excellent despite accuracy issues.** The per-file reasoning explaining what was instrumented and why, with rule citations and expected-condition catch handling rationale, is the highest-quality agent output across all runs. These notes should be preserved and updated to reflect final state.
- **Run-6 PR summary accuracy regressed from run-5.** Run-5's summary was accurate (17 spans matched branch state). Run-6's summary is inaccurate due to the validation retry flow not updating the summary.
- **SCH-001 is the new dominant blocker.** The Weaver registry has only 1 span definition. Every partial/failed file has SCH-001 as a contributing factor. Fix: expand the registry with ~8 span definitions covering all commit-story domain operations. This is the highest-ROI fix for run-7 — journal-manager.js would commit immediately.
- **DEEP-1 boundary gaps remain.** Three catch patterns not covered: per-item-failure-collection, swallow-and-continue, try/finally without catch. These block 5 files.
- **Dominant blocker peeling pattern.** Run-5 fixed the dominant blocker (NDS/SCH/CDQ → COV-003). Run-6 fixed COV-003 → SCH-001 emerged. Run-7 should fix SCH-001 → expect next blocker to surface. Pre-run expectations should account for this: fixing one blocker reveals the next.
- **5 files regressed from run-5.** auto-summarize, context-capture-tool, reflection-tool, commit-analyzer, journal-paths were committed in run-5 but not in run-6. Root causes: SCH-001 strictness (2 files), RST-004 vs COV-004 tension (2 files), correct reclassification (1 file). Run-7 should track regressions explicitly.
- **Committed file semantic quality.** 4/5 committed files use the wrong span name to pass SCH-001. This is a quality issue that scoring alone won't capture — the files "pass" but the instrumentation is semantically misleading.

