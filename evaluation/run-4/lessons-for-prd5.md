# Lessons for PRD #5

Captured throughout the run-4 evaluation process. Each section is appended to as observations arise.

## Rubric Gaps

Rules that need to be added, clarified, or rescored.

- **Schema evolution compliance rule needed.** The rubric has no rule that checks whether the agent properly feeds schema extensions forward across files. Schema evolution is the central design feature of the Weaver architecture — if it silently breaks (as in run-4), no rubric rule catches it. Consider adding a rule under Schema Fidelity (e.g., SCH-005: "Schema extensions from file N are visible in file N+1's resolved schema").

## Process Improvements

What worked well, what didn't, and what should change for run-5.

### What worked well
- **Pre-run verification milestone** caught the fresh build requirement and credential validation — no wasted cycles on stale builds or lost PRs.
- **PR summary saved to disk** (`orbweaver-pr-summary.md`) before push attempt. When the test suite blocked PR creation, the full PR content was still available for evaluation. Orbweaver issue #13 from run-3 is verified fixed.
- **Function-level fallback** rescued `journal-graph.js` (4 spans) which had failed in both run-2 and run-3 with oscillation/token budget errors.
- **Cost efficiency**: $5.84 actual vs $67.86 ceiling for 29 files. Prompt caching architecture works well (though in this case it was caching too aggressively — the schema should have changed between files).

### What didn't work
- **End-of-run-only test execution** — 32 test failures discovered only after all 29 files were processed. A per-file static check or unit test run would have caught the `tracer` import bug on file 14 instead of file 29.
- **Schema evolution completely broken** — the central design feature of the Weaver architecture was non-functional. All extensions rejected as "unparseable" due to format mismatch between agent output (string IDs) and parser (expects YAML objects). No file saw extensions from previous files.
- **"Partial" status masks broken code** — files marked "partial" had instrumentation committed that crashes at runtime (ReferenceError). "Partial" should mean "some functions instrumented, tests still pass" not "instrumentation committed but broken."
- **Push authentication failed despite pre-run validation.** `git ls-remote origin` passed at pre-run, but `git push` failed 80 minutes later with "Invalid username or token." The pre-run credential check validates read access, not push access. Run-5 should verify push capability explicitly (e.g., `git push --dry-run` or push a test tag).
- **0-span files produce noisy "commit failed" output.** 10 files correctly received 0 spans, but orbweaver still attempted a per-file git commit for each — generating "Nothing staged to commit" errors that pollute the output and make it harder to spot real failures. Orbweaver should skip the commit step when no changes were made.

### Changes for run-5
- **Verify schema evolution is working** before processing more than 2 files. Add a pre-run check: instrument a test file, verify `agent-extensions.yaml` was written, resolve schema, confirm extensions appear.
- **Track two separate issue streams** from the start: orbweaver software issues (→ GitHub issues) vs evaluation process lessons (→ lessons-for-prd6.md). Run-4 established this pattern mid-stream; run-5 should start with both documents created and the distinction clear.
- **Pre-run push verification.** Replace `git ls-remote origin` with a push-capability check (e.g., `git push --dry-run` to a test branch). Read access alone is insufficient — the 80-minute run is wasted if push fails at the end.
- **Failure deep-dives should cover run-level failures, not just file-level.** Run-4's deep-dive initially focused only on partial files. The push failure, schema evolution breakdown, test suite failure, and commit noise are equally important to document and cross-reference with orbweaver issues. PRD #5 should explicitly list both file-level and run-level failures in the milestone description.

## Evaluation Methodology

Better ways to score, new agent patterns, tooling improvements.

- **Token usage breakdown is a diagnostic tool.** The cache read/write ratio revealed the schema evolution bug before we even looked at the code. When cache reads are 4x input tokens across a 29-file run, it means the prompt isn't changing — which is wrong if schema evolution is supposed to make it change. Consider adding a "schema evolution health check" to the evaluation: compare schemaHashBefore and schemaHashAfter from the run output.
- **Anomalous cost should be a red flag.** $5.84 vs $67.86 ceiling looked like great efficiency, but it was actually a symptom of broken schema evolution. When actual cost is dramatically below ceiling, investigate why before celebrating. Add a "cost sanity check" to the evaluation: if actual < 15% of ceiling, verify the prompt is actually changing between files.
- **Separate orbweaver issues from process lessons immediately.** Run-4 discovered both types of findings simultaneously. Having `orb-issues-to-file.md` and `lessons-for-prd5.md` as parallel documents from the start keeps them from getting mixed.

## Rubric-Codebase Mapping Corrections

Wrong classifications, missing auto-instrumentation coverage, or mapping errors.

## Schema Decisions

Registry changes, attribute decisions, or semantic convention updates that affect future runs.

- **Schema evolution bug means run-4 extensions are unreliable.** Since no file saw extensions from previous files, duplicate/conflicting span names and attributes may exist across files. Run-5 (after the bug is fixed) will produce a different extension set because later files will see what earlier files defined. Don't treat run-4's extension inventory as authoritative.

## Carry-Forward Items

Unresolved issues, open questions, and items deferred to run-5.

- **Orbweaver issue #1 (schema evolution)** must be fixed and verified before run-5 starts. This is a blocking prerequisite — without it, the evaluation is testing a fundamentally broken workflow.
- **Orbweaver issues #2-4 (test/validation gaps)** should be fixed before run-5 to avoid repeating the 32-failure pattern.
- **Run-5 pre-run verification** should include a schema evolution smoke test: instrument one file, verify extensions written, resolve schema, confirm extensions visible.
