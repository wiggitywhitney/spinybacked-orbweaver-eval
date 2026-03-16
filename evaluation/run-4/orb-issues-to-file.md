# Run-4 Orbweaver Issues

Issues to file on spinybacked-orbweaver after run-4 evaluation. Each issue includes acceptance criteria tied to specific target files or behaviors.

---

## Issue #1: Schema evolution is broken — extensions never written to registry

**Priority:** Critical
**Category:** Core architecture bug

The central design feature of orbweaver — schema evolution across files — is non-functional. Every schema extension from every file in run-4 was rejected as `(unparseable)`, meaning the Weaver schema never grew during the run. All 29 files received the identical base schema.

**Root cause:** Format mismatch between agent output and parser.

- The prompt instructs the agent to output `schemaExtensions` as an array of **string IDs**: `"commit_story.context.collect"`, `"span:commit_story.git.execute"`
- `parseExtension()` in `src/coordinator/schema-extensions.ts:86-101` tries to YAML-parse these strings and expects structured objects with an `id` field
- A bare string like `"commit_story.context.collect"` parses as a YAML string (not an object), fails the `typeof parsed === 'object'` check, returns `null` → `(unparseable)`
- Since all extensions are unparseable, `writeSchemaExtensions()` writes nothing to `agent-extensions.yaml`
- The next file's `resolveFn()` picks up an unchanged schema

**Evidence from run-4:**
- PR summary Warnings section: every extension prefixed with `(unparseable):`
- Warning list grows cumulatively across files (extensions accumulated in memory but all rejected on write)
- Token usage shows 1M+ cache read tokens — the prompt was identical across all 29 files because the schema never changed
- Cost was $5.84 vs $67.86 ceiling — suspiciously low, consistent with heavy prompt caching of an unchanging schema

**Acceptance criteria:**
1. Either the prompt must instruct the agent to output structured YAML extension definitions (with `id`, `type`, `brief` fields), OR `parseExtension()` must handle bare string IDs
2. After fix: `agent-extensions.yaml` should exist in the registry after the first file that invents a new span/attribute
3. After fix: file N+1's resolved schema should include extensions from file N
4. After fix: the `(unparseable)` rejection count should be 0 for well-formed extensions
5. Test: instrument 3 files sequentially where file 2 should reuse a span name invented by file 1 — verify file 2's agent sees the span name in its schema

---

## Issue #2: Test failures don't trigger fix/retry — broken code committed as "partial"

**Priority:** High
**Category:** Fix loop / validation gap

When the end-of-run test suite fails, orbweaver reports the failures as warnings but does not roll back the offending files or retry. In run-4, `summary-graph.js` and `sensitive-filter.js` were committed with `tracer.startActiveSpan()` calls but no `tracer` import — a `ReferenceError` at runtime. 32 tests failed. The files were left committed as "partial" status.

**Root cause:** The end-of-run test suite is a gate for PR creation but not for per-file validation. When tests fail, the agent skips the PR but leaves broken code in the branch.

**Evidence from run-4:**
- 32 test failures, all `ReferenceError: tracer is not defined`
- `summary-graph.js`: function-level fallback instrumented 12/12 functions, but `tracer` was never imported at module scope
- `sensitive-filter.js`: same pattern — `tracer.startActiveSpan()` added without `tracer` defined
- Both files committed to the branch with broken instrumentation
- No retry attempted after test failure

**Acceptance criteria:**
1. When the test suite fails after a file is instrumented, the agent should identify which file(s) caused the failures
2. Broken files should either be retried (with the test failure as feedback) or rolled back to their pre-instrumentation state
3. A file should not be reported as "partial" success if its instrumentation causes test failures — "partial" should mean some functions were instrumented correctly and tests still pass
4. The branch should never contain code that fails the project's test suite

---

## Issue #3: Missing `tracer` import in function-level fallback path

**Priority:** High
**Category:** Agent code generation bug

When the function-level fallback path instruments individual functions, it adds `tracer.startActiveSpan()` calls but does not ensure the `tracer` variable is defined and imported at module scope. This is the direct cause of 32 test failures in run-4.

**Evidence from run-4:**
- `summary-graph.js` line 653: `return tracer.startActiveSpan('commit_story.ai.monthly_summary', ...)` — `tracer` never imported
- `sensitive-filter.js` line 171: `return tracer.startActiveSpan('commit_story.filter.redact_messages', ...)` — same
- Both files used function-level fallback (noted in PR summary as "Function-level fallback: 12/12 functions" and "2/3 functions")

**Acceptance criteria:**
1. When the function-level fallback path instruments functions with `tracer.startActiveSpan()`, it must also add the tracer initialization at module scope (e.g., `import { trace } from '@opentelemetry/api'; const tracer = trace.getTracer('...');`)
2. The whole-file path already does this correctly — the function-level path must match
3. A static check (e.g., `node --check` or grep for undefined references) should run on each file after instrumentation, before commit

---

## Issue #4: No per-file test or lint check after instrumentation

**Priority:** High
**Category:** Validation gap

Tests are only run at the end of the full run (all 29 files). A simple syntax/reference check after each file would catch issues like missing imports immediately — before they accumulate into 32 failures discovered at the end.

**Evidence from run-4:**
- File 14 (`summary-graph.js`) introduced a broken `tracer` reference
- File 18 (`sensitive-filter.js`) introduced the same bug
- Neither was caught until file 29 finished and the end-of-run test suite ran
- By then, 32 tests were broken across 4 test files

**Suggested approach (tiered, mirroring real project CI):**
1. **Per-file: static check** — `node --check <file>` or equivalent import validation after each file is instrumented. Catches syntax errors and undefined references. Near-zero cost.
2. **Per-file: unit tests** — run the file's corresponding test file (if one exists) after instrumentation. Catches behavioral regressions early.
3. **Periodic: integration tests** — run broader test suite at checkpoint intervals (every N files).
4. **End-of-run: full test suite** — existing behavior, but now acts as a safety net rather than the only check.

**Acceptance criteria:**
1. After each file is instrumented, at minimum a static parse check runs before the file is committed
2. If the check fails, the file enters the fix/retry loop (not committed as-is)
3. Optionally: if a matching test file exists (e.g., `tests/generators/summary-graph.test.js` for `src/generators/summary-graph.js`), run it after instrumentation

---

## Issue #5: Accumulated schema extension warnings are unreadable

**Priority:** Low
**Category:** UX / output quality

The "Schema extensions rejected by namespace enforcement" warning in the PR summary repeats the entire cumulative list for every file. By file 29, the warning line contains 40+ extension IDs repeated 29 times. The Warnings section of the PR summary is ~50 lines of near-identical text.

**Evidence from run-4:**
- PR summary lines 384-399: 16 nearly identical warning lines, each adding 1-3 new extensions to the full list
- Total warning text: ~15KB of redundant content

**Acceptance criteria:**
1. Emit one summary line listing all rejected extensions (deduplicated), not one cumulative line per file
2. Or: emit per-file warnings with only the NEW extensions for that file, not the running total

---

## Issue #6: CLI output doesn't tell the user where to find results

**Priority:** High
**Category:** UX / output clarity

When the run ends — especially when it ends with test failures — the CLI output doesn't tell the user where to find the artifacts. The user has to know that the PR summary was saved to `orbweaver-pr-summary.md`, that the instrumented code is on a local branch, and what that branch name is. This applies to all orbweaver interfaces (CLI, MCP tool, any future interfaces).

**Current behavior:**
- Test failure: wall of test output, then silence. No mention of where the PR summary was saved or what branch has the code.
- Success: PR URL is shown, but the local summary path isn't mentioned.

**Evidence from run-4:**
- Run ended with 32 test failures. Output showed the test errors but not: "PR summary saved to ./orbweaver-pr-summary.md" or "Instrumented code on branch orbweaver/instrument-1773627869602" or "To review changes: git diff main..orbweaver/instrument-1773627869602"

**Acceptance criteria:**
1. On every run completion (success or failure), the CLI prints a summary block with:
   - Branch name containing the instrumented code
   - Path to the local PR summary file
   - How to view the diff (e.g., `git diff main..<branch>`)
   - If tests failed: which files caused failures
2. This summary block appears after all other output (not buried in the middle)
3. All orbweaver interfaces (CLI, MCP, etc.) provide equivalent discoverability

---

## Issue #7: Create draft PR even when tests fail

**Priority:** Medium
**Category:** UX / workflow improvement
**Status:** Idea — needs design decision

(Complements Issue #6 — even with better CLI output, a draft PR puts everything in one place.)

When the end-of-run test suite fails, orbweaver skips PR creation entirely. The instrumented code is committed to a local branch and the PR summary is saved to `orbweaver-pr-summary.md`, but a user would have to know to look for both. A draft PR would put everything in one place — the diff, the agent notes, the advisory findings — making it easy to review, cherry-pick good files, and fix small issues manually.

**Current behavior:**
- Tests fail → no push, no PR
- Code lives on a local branch the user may not know about
- PR summary saved to a file the user may not know about
- User gets a wall of test failure output and nothing actionable

**Proposed behavior:**
- Tests fail → push branch, create **draft** PR with test failure summary appended
- Draft PR shows the full diff, agent notes, and a clear "tests failed — here's what broke" section
- User can review the diff, fix small issues (e.g., add a missing import), and promote to ready

**Acceptance criteria (if adopted):**
1. When end-of-run tests fail, orbweaver still pushes the branch and creates a draft PR
2. The draft PR body includes the standard PR summary plus a "Test Failures" section listing which tests failed and why
3. The draft status signals to reviewers that the instrumentation needs human attention

---

## Issue #8: Test cadence should be LOC-aware, not just file-count-based


**Priority:** Medium
**Category:** Validation strategy
**Status:** Idea — needs design decision

Currently orbweaver runs tests only at the end of the full run (and optionally at periodic checkpoints by file count). A file that changes 5 lines gets the same validation cadence as a file that changes 200 lines. Larger diffs are more likely to introduce bugs and should trigger earlier validation.

**Proposed approach:**
A tiered strategy mirroring real project CI, where the trigger for running tests accounts for the size of the change:
1. **Every file: static parse check** — `node --check` or equivalent. Near-zero cost.
2. **Every file: import/reference lint** — verify that all identifiers used (like `tracer`) are defined. Catches the exact class of bug that caused 32 failures in run-4.
3. **LOC-based: unit tests** — when cumulative lines changed since last test run exceed a threshold, run the affected test files.
4. **Periodic: full test suite** — at checkpoint intervals.
5. **End-of-run: full test suite** — existing behavior, now a safety net.

**Acceptance criteria (if adopted):**
1. At minimum, a static parse/lint check runs after every file before commit
2. Unit tests run more frequently for larger diffs than smaller ones
3. The specific thresholds and triggers are configurable

---

## Issue #9: Skip per-file commit for zero-change files

**Priority:** Low
**Category:** UX / output noise

When a file receives 0 spans (correct decision — pure data, config, constant exports), orbweaver still attempts a per-file git commit. Since no changes were made, the commit fails with "Nothing staged to commit." In run-4, this produced 10 spurious error messages that pollute the output and make it harder to spot real failures.

**Evidence from run-4:**
- 10 files correctly received 0 spans (accessibility.js, anti-hallucination.js, index.js, daily-summary-prompt.js, dialogue-prompt.js, monthly-summary-prompt.js, summary-prompt.js, technical-decisions-prompt.js, weekly-summary-prompt.js, config.js)
- Each generated a "Per-file commit failed" error in the output
- These interleaved with real processing output, making the log harder to scan

**Acceptance criteria:**
1. When a file receives 0 spans and no changes were made, skip the commit step entirely
2. Log "skipped commit (no changes)" or similar instead of a commit failure error
3. The run tally should distinguish "0 spans (correct skip)" from actual failures
