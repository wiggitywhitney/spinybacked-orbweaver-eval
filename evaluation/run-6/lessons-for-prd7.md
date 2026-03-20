# Lessons for PRD #7

Observations, rubric gaps, process improvements, and methodology notes captured throughout run-6 evaluation. This document is the primary input for drafting PRD #7.

---

## Rubric Gaps

*Rules that proved insufficient, ambiguous, or missing during evaluation.*

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

---

## Rubric-Codebase Mapping Corrections

*Updates needed to `spinybacked-orbweaver/research/rubric-codebase-mapping.md`.*

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

