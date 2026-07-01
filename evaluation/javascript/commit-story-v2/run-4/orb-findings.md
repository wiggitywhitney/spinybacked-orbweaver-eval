# Run-4 Orbweaver Findings

Findings from the run-4 evaluation of SpinybackedOrbWeaver against the commit-story-v2 codebase. Each finding includes acceptance criteria, cross-repo evidence references, and a recommended action type.

**Eval repo:** `commit-story-v2-eval` (this repo)
**Target repo:** `spinybacked-orbweaver`
**Evidence base:** `evaluation/run-4/` directory in this repo

## How to Use This Document

Each finding is classified as:
- **PRD** — needs design decisions, multiple milestones, or architectural changes. Create a PRD in the target repo.
- **Issue** — focused fix with clear acceptance criteria. Create a GitHub issue.

Each finding includes an **Evidence** section with paths relative to the `commit-story-v2-eval` repo root. The implementing AI should clone this repo and read the referenced files for full context.

---

## Finding #1: Schema evolution is broken — extensions never written to registry

**Priority:** Critical
**Category:** Core architecture bug
**Recommended action:** PRD
**Rubric rules affected:** SCH-001, SCH-002, CDQ-008 (indirectly — naming coherence depends on evolution)

The central design feature of orbweaver — schema evolution across files — is non-functional. Every schema extension from every file in run-4 was rejected as `(unparseable)`, meaning the Weaver schema never grew during the run. All 29 files received the identical base schema.

**Root cause:** Format mismatch between agent output and parser.

- The prompt instructs the agent to output `schemaExtensions` as an array of **string IDs**: `"commit_story.context.collect"`, `"span:commit_story.git.execute"`
- `parseExtension()` in `src/coordinator/schema-extensions.ts:86-101` tries to YAML-parse these strings and expects structured objects with an `id` field
- A bare string like `"commit_story.context.collect"` parses as a YAML string (not an object), fails the `typeof parsed === 'object'` check, returns `null` → `(unparseable)`
- Since all extensions are unparseable, `writeSchemaExtensions()` writes nothing to `agent-extensions.yaml`
- The next file's `resolveFn()` picks up an unchanged schema

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/per-file-evaluation.json` → `summary.key_findings[8]` — "Schema evolution broken: All 29 files received identical base schema."
- `evaluation/run-4/rubric-scores.json` → `schema_coverage_split` — shows 0 extensions registered, 100% cache hit on unchanged prompt
- `evaluation/run-4/rubric-scores.json` → `failure_classification` — SCH-001 and SCH-002 classified as "schema_evolution_dependency"
- `evaluation/run-4/lessons-for-prd5.md` → "Schema evolution completely broken" (Process Improvements) and "Schema Coverage Split" methodology
- `evaluation/run-4/pr-evaluation.md` → Section 7 (Schema Changes) — shows 0.1.0 → 0.1.0 unchanged across 29 files

**Why this should be a PRD:**
- It's the core architectural feature of the Weaver schema system
- Fixing it requires a design decision: change the prompt format, change the parser, or both
- The fix needs integration testing (instrument 3+ files sequentially, verify cross-file extension visibility)
- It affects the evaluation methodology for run-5 (schema coverage split scoring depends on whether evolution works)

**Acceptance criteria:**
1. Either the prompt must instruct the agent to output structured YAML extension definitions (with `id`, `type`, `brief` fields), OR `parseExtension()` must handle bare string IDs
2. After fix: `agent-extensions.yaml` should exist in the registry after the first file that invents a new span/attribute
3. After fix: file N+1's resolved schema should include extensions from file N
4. After fix: the `(unparseable)` rejection count should be 0 for well-formed extensions
5. **Permanent integration test in the orbweaver test suite**: Instrument 3 files sequentially where file 2 should reuse a span name invented by file 1 — verify file 2's agent sees the span name in its resolved schema. This is core functionality that must not silently regress. The test should fail if schema evolution breaks again, catching it in CI instead of during an 80-minute evaluation run.

---

## Finding #2: Validation pipeline — no per-file checks, no fix/retry on failure

**Priority:** High
**Category:** Validation strategy
**Recommended action:** PRD
**Rubric rules affected:** NDS-002 (gate), NDS-005 (indirectly — early detection would prevent bad commits)

Three closely related gaps in the validation pipeline:

### 2a. Test failures don't trigger fix/retry — broken code committed as "partial"

When the end-of-run test suite fails, orbweaver reports failures as warnings but does not roll back offending files or retry. In run-4, `summary-graph.js` and `sensitive-filter.js` were committed with `tracer.startActiveSpan()` calls but no `tracer` import — a `ReferenceError` at runtime. 32 tests failed. The files were left as "partial" status.

### 2b. Missing `tracer` import in function-level fallback path

When the function-level fallback path instruments individual functions, it adds `tracer.startActiveSpan()` calls but does not ensure the `tracer` variable is defined and imported at module scope. This is the direct cause of 32 test failures in run-4. The whole-file path handles this correctly — the function-level path does not.

### 2c. No per-file test or lint check after instrumentation

Tests run only at the end of the full run (all 29 files). A simple syntax/reference check after each file would catch issues like missing imports immediately — before they accumulate into 32 failures discovered at the end.

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/per-file-evaluation.json` → `per_run.NDS-002` — 32 test failures, all ReferenceError
- `evaluation/run-4/per-file-evaluation.json` → `failed_files.src/generators/summary-graph.js` and `failed_files.src/integrators/filters/sensitive-filter.js` — function-level fallback missing tracer import
- `evaluation/run-4/failure-deep-dives.md` — full root cause analysis for summary-graph.js and sensitive-filter.js
- `evaluation/run-4/rubric-scores.json` → `gates.results.NDS-002` — gate failure evidence
- `evaluation/run-4/rubric-scores.md` → Gate Checks section — "32 test failures: ReferenceError: tracer is not defined"

**Why this should be a PRD:**
- It's a tiered validation strategy design (static check → unit test → integration test → full suite)
- The fix/retry loop needs design decisions: what triggers retry, how many attempts, when to roll back
- The function-level fallback tracer import fix is one piece of a larger validation architecture
- The LOC-aware test cadence idea (Finding #8) should be designed together with this

**Acceptance criteria:**
1. **Per-file static check:** After each file is instrumented, at minimum `node --check <file>` runs before commit. If it fails, file enters fix/retry loop.
2. **Tracer import:** Function-level fallback path must add tracer initialization at module scope, matching the whole-file path behavior.
3. **Fix/retry on failure:** When the test suite fails, identify which file(s) caused failures. Either retry with failure feedback or roll back to pre-instrumentation state.
4. **"Partial" accuracy:** A file should not be reported as "partial" success if its instrumentation causes test failures.
5. **Branch hygiene:** The branch should never contain code that fails the project's test suite.

---

## Finding #3: Agent records expected-condition exceptions as span errors

**Priority:** High
**Category:** Agent code generation bug
**Recommended action:** Issue
**Rubric rules affected:** NDS-003, NDS-005, CDQ-003

In 3 files (summarize.js, summary-manager.js, summary-detector.js), the agent changed silent `catch {}` blocks — used for expected control flow (file/directory doesn't exist) — to record exceptions and set ERROR status on spans. This pollutes telemetry with false errors.

The pattern: `fs.access()` or `fs.readdir()` is called to check if a file/directory exists. The original code uses `catch { // Doesn't exist, proceed }` because ENOENT is the expected happy path. The agent changes this to `catch (err) { span.recordException(err); span.setStatus({ code: SpanStatusCode.ERROR }); }`, which marks the span as ERROR for normal control flow. OTel's `setStatus` is a one-way latch — once set to ERROR, it cannot revert to OK — so the span is permanently marked ERROR even when the function succeeds.

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/per-file-evaluation.json` → `per_file["src/commands/summarize.js"].rules.NDS-005` — "Original `catch { // Doesn't exist, proceed }` intentionally swallowed the fs access error"
- `evaluation/run-4/per-file-evaluation.json` → `per_file["src/managers/summary-manager.js"].rules.NDS-003` — "In all 3 generateAndSave* functions, the access() catch blocks changed"
- `evaluation/run-4/per-file-evaluation.json` → `per_file["src/utils/summary-detector.js"].rules.NDS-005` — "Original catch {} blocks now have catch (error) { span.recordException(error) }"
- `evaluation/run-4/rubric-scores.json` → `quality_rules.NDS-005` — rule-level failure evidence with 3 failing files listed
- `evaluation/run-4/rubric-scores.md` → Dimension 1: NDS-005 section — full description of the failure class

**Acceptance criteria:**
1. The agent must distinguish between error-handling catch blocks (where recordException is appropriate) and expected-condition catch blocks (where the catch IS the normal path)
2. For expected-condition catches (file-not-found, directory-not-found), the agent should NOT add recordException or setStatus(ERROR)
3. If the agent is unsure whether a catch block handles errors or expected conditions, it should err on the side of NOT recording — false positive errors are worse than missing error recording

---

## Finding #4: Accumulated schema extension warnings are unreadable

**Priority:** Low
**Category:** UX / output quality
**Recommended action:** Issue
**Rubric rules affected:** None directly (PR quality observation)

The "Schema extensions rejected by namespace enforcement" warning in the PR summary repeats the entire cumulative list for every file. By file 29, the warning line contains 40+ extension IDs repeated 29 times. The Warnings section of the PR summary is ~50 lines of near-identical text.

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/pr-evaluation.md` → Section 8 (Warnings) — "16 nearly-identical warning lines, each repeating the full cumulative list"

**Acceptance criteria:**
1. Emit one summary line listing all rejected extensions (deduplicated), not one cumulative line per file
2. Or: emit per-file warnings with only the NEW extensions for that file, not the running total

---

## Finding #5: CLI output doesn't tell the user where to find results

**Priority:** High
**Category:** UX / output clarity
**Recommended action:** Issue
**Rubric rules affected:** None directly (UX observation)

When the run ends — especially when it ends with test failures — the CLI output doesn't tell the user where to find the artifacts. The user has to know that the PR summary was saved to `orbweaver-pr-summary.md`, that the instrumented code is on a local branch, and what that branch name is.

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/pr-evaluation.md` → Section 1 (PR Delivery) — "The CLI provides no end-of-run summary telling the user where to find artifacts"
- `evaluation/run-4/run-4-execution-summary.md` — run output showed test errors but no artifact location info

**Acceptance criteria:**
1. On every run completion (success or failure), the CLI prints a summary block with: branch name, PR summary path, diff command, and (if tests failed) which files caused failures
2. This summary block appears after all other output (not buried in the middle)
3. All orbweaver interfaces (CLI, MCP, etc.) provide equivalent discoverability

---

## Finding #6: Create draft PR even when tests fail

**Priority:** Medium
**Category:** UX / workflow improvement
**Recommended action:** Issue (with design decision needed)
**Rubric rules affected:** None directly

When the end-of-run test suite fails, orbweaver skips PR creation entirely. A draft PR would put everything in one place — the diff, the agent notes, the advisory findings — making it easy to review, cherry-pick good files, and fix small issues manually.

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/pr-evaluation.md` → Section 1 and "PR as a Review Tool" section — "The gap between 'high-quality summary document' and 'no PR created' is a significant UX problem"

**Acceptance criteria (if adopted):**
1. When end-of-run tests fail, orbweaver still pushes the branch and creates a draft PR
2. The draft PR body includes the standard PR summary plus a "Test Failures" section
3. The draft status signals to reviewers that the instrumentation needs human attention

---

## Finding #7: Test cadence should be LOC-aware, not just file-count-based

**Priority:** Medium
**Category:** Validation strategy
**Recommended action:** Issue (consider grouping with Finding #2 PRD)
**Rubric rules affected:** NDS-002 (indirectly)

Currently orbweaver runs tests only at the end of the full run. A file that changes 5 lines gets the same validation cadence as one that changes 200 lines. Larger diffs are more likely to introduce bugs.

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/per-file-evaluation.json` → `per_run.NDS-002` — 32 failures all from 2 files; if caught per-file, would have been 0 or 11
- `evaluation/run-4/failure-deep-dives.md` — timeline shows file 14 introduced the bug, caught only after file 29

**Acceptance criteria (if adopted):**
1. At minimum, a static parse/lint check runs after every file before commit
2. Unit tests run more frequently for larger diffs than smaller ones
3. Specific thresholds and triggers are configurable

---

## Finding #8: Skip per-file commit for zero-change files

**Priority:** Low
**Category:** UX / output noise
**Recommended action:** Issue
**Rubric rules affected:** None directly

When a file receives 0 spans, orbweaver still attempts a per-file git commit, producing "Nothing staged to commit" errors. In run-4, 10 spurious error messages polluted the output.

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/per-file-evaluation.json` → `zero_span_files` — all 10 correctly received 0 spans
- `evaluation/run-4/run-4-execution-summary.md` — 10 "Per-file commit failed" errors in output

**Acceptance criteria:**
1. When a file receives 0 spans and no changes were made, skip the commit step entirely
2. Log "skipped commit (no changes)" instead of a commit failure error

---

## Finding #9: Tracer library name defaults to 'unknown_service' instead of package name

**Priority:** High
**Category:** Agent code generation bug
**Recommended action:** Issue
**Rubric rules affected:** CDQ-002 (all 16 files fail)

All 16 instrumented files use `trace.getTracer('unknown_service')` instead of `trace.getTracer('commit-story')`. The tracer library name should match the target project's `package.json#name`.

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/per-file-evaluation.json` → every file's `rules.CDQ-002` — all FAIL with "trace.getTracer('unknown_service')"
- `evaluation/run-4/rubric-scores.json` → `quality_rules.CDQ-002` — "systemic agent bug — one root cause, 16 affected files"
- `evaluation/run-4/rubric-scores.md` → CDQ-002 section — full analysis including run-3 methodology comparison

**Acceptance criteria:**
1. The agent reads the target project's `package.json#name` and uses it as the tracer library name
2. `trace.getTracer('commit-story')` (or the actual package name) appears in all instrumented files
3. If package name is not available, use a meaningful fallback (e.g., directory name), never 'unknown_service'

---

## Finding #10: Span naming inconsistency across file boundaries

**Priority:** Medium
**Category:** Agent behavior / schema evolution dependency
**Recommended action:** Issue (partially depends on Finding #1 PRD)
**Rubric rules affected:** SCH-001 (8/37 span names deviate from commit_story.*)

8 of 37 span names deviate from the `commit_story.*` convention. The deviating names use `context.*`, `mcp.*`, and `summary.*` prefixes. Inconsistency correlates with file processing order — earlier files use consistent naming, later files deviate.

**Root cause:** Without schema evolution, each file's agent invocation has no visibility into what span names previous files used.

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/per-file-evaluation.json` → individual file `rules.SCH-001` entries — specific span names listed per file
- `evaluation/run-4/rubric-scores.json` → `quality_rules.SCH-001` and `schema_coverage_split.SCH-001` — deviating names categorized by prefix pattern
- `evaluation/run-4/rubric-scores.md` → SCH-001 section with naming pattern table

**Acceptance criteria:**
1. After schema evolution is fixed: all span names in a run should use a consistent prefix convention
2. Consider a span naming template in the agent prompt that enforces `{namespace}.{domain}.{operation}` pattern
3. Alternative: the prompt should explicitly reference earlier files' span naming convention

---

## Finding #11: Unused OTel imports added to zero-span files

**Priority:** Low
**Category:** Agent code generation bug
**Recommended action:** Issue
**Rubric rules affected:** RST (minor waste)

In run-4, `monthly-summary-prompt.js` received `import { trace, SpanStatusCode } from '@opentelemetry/api'` and `const tracer = trace.getTracer('unknown_service')` despite the agent determining 0 spans were needed.

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/per-file-evaluation.json` → `zero_span_files["src/generators/prompts/sections/monthly-summary-prompt.js"]` — `"unused_imports_added": true`

**Acceptance criteria:**
1. When the agent determines a file needs 0 spans, do not add any imports or tracer initialization
2. If imports are added speculatively, clean them up before the per-file commit when no spans result

---

## Finding #12: Over-instrumentation of pure synchronous functions

**Priority:** Medium
**Category:** Agent code generation bug
**Recommended action:** Issue
**Rubric rules affected:** RST-001

New finding from rubric scoring: `token-filter.js` has spans on `truncateDiff()` and `truncateMessages()` — these are exported but are pure synchronous data transformation functions with no I/O. They are called from `applyTokenBudget` (which has a span). Adding spans to pure functions is over-instrumentation.

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/per-file-evaluation.json` → `per_file["src/integrators/filters/token-filter.js"].rules.RST-001` — "truncateDiff() and truncateMessages() are exported but are pure synchronous data transformation functions"
- `evaluation/run-4/rubric-scores.json` → `quality_rules.RST-001` — rule-level failure

**Acceptance criteria:**
1. The agent should not add spans to pure synchronous functions that perform data transformation only (no I/O, no async operations)
2. When a parent span covers the calling function, child spans on pure helpers add noise without value
3. The agent prompt should include guidance: "exported" does not automatically mean "instrumentable" — functions must have I/O or be entry points

---

## Finding #13: index.js missing root span on main()

**Priority:** Medium
**Category:** Agent code generation gap
**Recommended action:** Issue
**Rubric rules affected:** COV-001, COV-002, COV-004

New finding from rubric scoring: `index.js` main() — the CLI entry point — has NO root span. Only the summarize and journal-generate code paths within main are spanned. Without a root span, the trace has no top-level operation. This is a regression from run-3 where a root span existed.

**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/per-file-evaluation.json` → `per_file["src/index.js"].rules.COV-001` — "main() (CLI entry point, root span) has NO span"
- `evaluation/run-4/rubric-scores.json` → `quality_rules.COV-001` — rule-level failure, regression from run-3
- `evaluation/run-4/rubric-scores.md` → COV-001 section — "Run-3 had a commit_story.generate_journal_entry span on main(). This is a genuine regression."

**Acceptance criteria:**
1. The CLI entry point main() should have a root span covering the entire operation
2. All code paths within main should be children of this root span
3. The root span should have appropriate attributes (vcs.ref.head.revision, operation type)

---

## Summary by Recommended Action

### PRD Candidates (2)

| # | Title | Priority | Rubric Impact |
|---|-------|----------|---------------|
| 1 | Schema evolution broken | Critical | SCH-001, SCH-002 |
| 2 | Validation pipeline (per-file checks, fix/retry) | High | NDS-002, NDS-005 |

### Issue Candidates (11)

| # | Title | Priority | Rubric Impact |
|---|-------|----------|---------------|
| 3 | Expected-condition exceptions recorded as errors | High | NDS-005, CDQ-003 |
| 5 | CLI output doesn't show artifact locations | High | UX |
| 9 | Tracer name defaults to 'unknown_service' | High | CDQ-002 (all 16 files) |
| 13 | index.js missing root span | Medium | COV-001 (regression) |
| 10 | Span naming inconsistency (depends on #1) | Medium | SCH-001 |
| 12 | Over-instrumentation of pure sync functions | Medium | RST-001 |
| 6 | Create draft PR on test failure | Medium | UX |
| 7 | LOC-aware test cadence (group with #2?) | Medium | NDS-002 |
| 4 | Unreadable schema extension warnings | Low | UX |
| 8 | Skip commit for zero-change files | Low | UX |
| 11 | Unused OTel imports on zero-span files | Low | RST |

### Fixing High-Priority Findings Would Reach 85% Target

Under the methodology-adjusted + split scoring variant (currently 19/26 = 73%), fixing findings #3, #9, and #13 would push the score to 22/26 = 85%.
