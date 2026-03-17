# Failure Deep-Dives — Run-5

Root cause analysis for all failed files (2), partial files (6), and run-level failures in evaluation run-5.

---

## Executive Summary

Run-5 committed 9 files vs run-4's 16 — a 44% regression in instrumented file coverage. The root cause is **the new validation pipeline (PRD #156) catching quality issues that were previously invisible**. Two systemic patterns dominate:

1. **COV-003 vs NDS-005b tension** — The validator requires error recording on ALL catch blocks within spans, but expected-condition catches (file-not-found, missing directories, graceful degradation) should NOT record exceptions. The agent is stuck: comply with COV-003 → produce NDS-005b violations, or comply with NDS-005b → fail validation. Affects 5 of 8 problematic files.

2. **SCH-002 in schema-uncovered files** — Files that need attributes for operations not in the Weaver schema get their attributes rejected. The agent invents reasonable attribute names but validation blocks the file entirely. Affects 3 files.

These are **infrastructure bugs in the validation pipeline**, not agent quality problems. The agent's instrumentation decisions are generally sound — the validator is rejecting correct behavior in some cases and forcing incorrect behavior in others.

---

## Failed Files

### 1. src/commands/summarize.js — FAILED (COV-003 x4, SCH-002 x18)

**Run history**: Run-4 success → Run-5 FAILED (regression)

**What the agent did**: Instrumented 3 exported async functions (runSummarize, runWeeklySummarize, runMonthlySummarize) with span names following `commit_story.summary.<granularity>` pattern. Created 11 new `commit_story.summarize.*` attributes for batch operation result counts (dates_count, weeks_count, months_count, force, generated_count, failed_count, no_entries_count, no_summaries_count, already_exists_count).

**Why it failed**:

- **SCH-002 (x18)**: All 11 `commit_story.summarize.*` attributes are schema extensions — no registered attributes exist for summarize command metrics. The SCH-002 validator (new in run-5, PR #173) rejects all of them. In run-4, these attributes would have been silently accepted.

- **COV-003 (x4)**: Four catch blocks inside spans don't record exceptions. These are all expected-condition catches:
  - Inner `catch` in per-item for loops: pushes error to `result.failed` and continues (graceful degradation)
  - `catch` around `access()`: ENOENT check (file not found = proceed)
  - Agent correctly identified these as expected-condition catches per NDS-005b, but the COV-003 validator doesn't distinguish expected-condition from genuine error catches.

**Root cause**: Schema coverage gap + COV-003/NDS-005b conflict. The summarize command's batch operation metrics have no schema representation, and the file's error handling pattern (continue-on-failure loops) conflicts with the blanket COV-003 rule.

**Orbweaver fix needed**: COV-003 validator should exclude catch blocks annotated as expected-condition handlers, OR the schema needs `commit_story.summarize.*` attributes registered.

---

### 2. src/index.js — FAILED (Oscillation: SCH-002 9→12)

**Run history**: Run-4 success → Run-5 FAILED (regression)

**What the agent did**: Instrumented main() as primary CLI entry point (commit_story.journal.generate) and handleSummarize() as async service entry point (commit_story.commands.summarize). Created `commit_story.summarize.mode/total/generated/failed` attributes.

**Why it failed**:

- **SCH-002 oscillation**: First attempt produced 9 SCH-002 violations. The fix/retry loop told the agent to correct them. The agent's correction attempt INCREASED violations to 12. Oscillation detection (new in PRD #156) correctly halted the loop, but the file gets zero instrumentation.

- **Why oscillation occurred**: The agent creates `commit_story.summarize.*` attributes → validator rejects them → agent tries alternatives → alternatives also rejected → more attributes in the retry → violation count increases. The agent doesn't know which attributes ARE valid because the feedback only says what's wrong, not what alternatives exist.

**Root cause**: Same schema coverage gap as summarize.js, compounded by the fix/retry loop's feedback quality. The loop tells the agent "these attributes are invalid" but doesn't suggest valid alternatives or indicate that no valid alternatives exist in the current schema.

**Investigation note from findings**: Confirm the resolved schema (with agent-extensions.yaml merged) is actually passed to the agent during retries. If the agent instruments against the base schema without its own extensions, it would explain why it can't satisfy SCH-002.

**Orbweaver fix needed**: Fix/retry feedback should include valid attribute alternatives from the schema, or accept partial compliance (commit spans without invalid attributes, strip the attributes rather than rejecting the entire file).

---

## Partial Files

### 3. src/generators/journal-graph.js — PARTIAL (1/1 functions, 1 span)

**Run history**: Run-4 success (4 spans) → Run-5 PARTIAL (1 span, regression)

**What the agent did**: Whole-file mode attempted 4 spans (generateJournalSections, summaryNode, technicalNode, dialogueNode). Validation failed. Function-level fallback selected only generateJournalSections (the sole exported function) and succeeded with 1 span.

**Why it's partial**: The function-level fallback only processes exported functions individually. The 3 internal node functions (summaryNode, technicalNode, dialogueNode) are high diagnostic value targets but not exported, so the fallback skips them.

**Quality of committed code**: The diff shows clean instrumentation — proper span wrapping, try/catch/finally, recordException on genuine errors. Duplicate JSDoc block is cosmetic.

**Root cause**: Function-level fallback's scope limitation. When whole-file instrumentation fails, the per-function retry only attempts exported functions, losing coverage on valuable internal functions.

**Orbweaver fix needed**: Function-level fallback should consider non-exported functions that were successfully instrumented in the whole-file attempt, or allow partial whole-file commits (commit functions that passed, skip functions that failed).

---

### 4. src/generators/summary-graph.js — PARTIAL (11/12 functions, 5 spans)

**Run history**: Run-4 partial (tracer import only, 0 spans) → Run-5 PARTIAL (5 spans, IMPROVED)

**What the agent did**: Successfully instrumented 5 of 6 target functions (dailySummaryNode, generateDailySummary, generateWeeklySummary, monthlySummaryNode, generateMonthlySummary). One function failed: weeklySummaryNode.

**Why weeklySummaryNode failed**: COV-003 validation flagged "catch block at line 49 does not record error on span." This is the inner try/catch in weeklySummaryNode that implements graceful degradation — errors are caught and returned as structured error states without rethrowing. This is an expected-condition catch (control flow), and the agent correctly omitted recordException/setStatus per NDS-005b. But COV-003 validator rejects it.

**Quality of committed code**: The 5 successful spans show good instrumentation quality:
- Correct span naming (commit_story.ai.*, commit_story.journal.*)
- Proper `commit_story.ai.section_type` and `commit_story.journal.entry_date` attributes
- Inner expected-condition catches correctly left without recordException
- Outer try/catch/finally for span lifecycle management
- Duplicate JSDoc blocks are cosmetic

**Root cause**: COV-003/NDS-005b conflict on one function. The agent's decision (no recording on expected-condition catch) is correct per the rubric but rejected by the validator.

**Orbweaver fix needed**: COV-003 validator needs expected-condition catch exemption.

---

### 5. src/integrators/filters/sensitive-filter.js — PARTIAL (2/3 functions, 0 spans)

**Run history**: Run-4 partial (tracer import + regex) → Run-5 PARTIAL (0 spans, SAME)

**What the agent did**: Correctly determined no instrumentation is warranted — all functions are pure synchronous data transformations. Function-level fallback processed redactMessages and applySensitiveFilter (0 spans each, correct). Failed on redactSensitiveData.

**Why redactSensitiveData failed**: "Oscillation detected during fresh regeneration: Duplicate errors across consecutive attempts: NDS-003 (x6) at NDS-003:17, NDS-003:29, NDS-003:5". The agent cannot modify this function without altering original business logic (NDS-003), and repeated attempts produce the same violations.

**Impact**: Minimal — the correct outcome for this file is 0 spans (all sync), so the partial status is procedural (function-level fallback failed on one function) rather than substantive. The file would have zero instrumentation even if all functions processed successfully.

**Root cause**: NDS-003 persistent across runs 4 and 5. The function's regex patterns and data flow are complex enough that the agent's code generation consistently introduces unintended modifications.

**Orbweaver fix needed**: Low priority since target state is 0 spans. Function-level fallback could skip functions where the expected outcome is 0 spans (no instrumentation needed).

---

### 6. src/managers/journal-manager.js — PARTIAL (2/3 functions, 1 span)

**Run history**: Run-4 partial (NDS-003, 0 spans) → Run-5 PARTIAL (1 span, IMPROVED)

**What the agent did**: Successfully instrumented saveJournalEntry with span name commit_story.journal.save_journal_entry. formatJournalEntry correctly processed with 0 spans (pure sync). discoverReflections failed.

**Why discoverReflections failed**: COV-003 validation: "catch block at line 77 does not record error on span." The catch blocks in discoverReflections handle missing directories/files — expected conditions in filesystem operations.

**Quality issue in committed code (NDS-005b)**: The partial diff shows saveJournalEntry's inner catch block (file-not-found check, line 127-129) HAS `span.recordException(e)` and `span.setStatus({ code: SpanStatusCode.ERROR })` added. This is an NDS-005b violation — the catch handles "file doesn't exist yet, proceed" which is an expected condition, not an error. The agent notes claim "No recordException/setStatus added to those blocks" but the actual code contradicts this. **The agent chose to comply with COV-003 at the cost of NDS-005b correctness.**

**Root cause**: COV-003/NDS-005b conflict. The committed code also demonstrates that when the agent CAN satisfy COV-003, it does so even when incorrect, producing NDS-005b violations in the process.

---

### 7. src/managers/summary-manager.js — PARTIAL (9/14 functions, 4 spans)

**Run history**: Run-4 success → Run-5 PARTIAL (4 spans, regression)

**What the agent did**: Successfully instrumented 4 functions (generateAndSaveDailySummary, generateAndSaveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary). Five functions failed validation:

| Function | Failure Mode |
|----------|-------------|
| readDayEntries | Oscillation: NDS-003 1→2 |
| saveDailySummary | NDS-003 + COV-003: "original line 1 missing/modified" |
| readWeekDailySummaries | NDS-003 + COV-003: "original line 1 missing/modified" |
| saveWeeklySummary | NDS-003: "original line 1 missing/modified" |
| generateAndSaveMonthlySummary | LINT: corrupted import `imimport` |

**Why functions failed**:

- **NDS-003 "original line 1 missing/modified"**: The function-level fallback generates standalone function code that doesn't preserve the module's import structure. When it creates a self-contained function, the first line changes (it generates its own imports), triggering NDS-003.

- **Oscillation on readDayEntries**: NDS-003 count increased from 1→2 on retry. The agent's correction attempt introduced additional modifications.

- **LINT failure on generateAndSaveMonthlySummary**: The function-level fallback generated `imimport` instead of `import` — a code synthesis error. This is a straightforward code generation bug.

**Quality issue in committed code (NDS-005b)**: The partial diff shows multiple expected-condition catches with recordException/setStatus added:
- `generateAndSaveDailySummary`: `access()` catch (file existence check) at lines 69-71 has error recording — NDS-005b violation
- `generateAndSaveWeeklySummary`: `access()` catch at lines 197-199 has error recording — NDS-005b violation
- `readMonthWeeklySummaries`: `readdir()` catch at lines 325-327 (missing directory) and inner `readFile()` catch at lines 351-353 (unreadable file) both have error recording — NDS-005b violations
- `saveMonthlySummary`: `access()` catch at lines 428-430 has error recording — NDS-005b violation

**Root cause**: Multiple overlapping issues:
1. Function-level fallback doesn't preserve module import context (NDS-003)
2. Function-level fallback has code synthesis bugs (LINT: `imimport`)
3. COV-003/NDS-005b conflict forces incorrect error recording on committed functions

---

### 8. src/utils/summary-detector.js — PARTIAL (4/5 functions, 4 spans)

**Run history**: Run-4 success → Run-5 PARTIAL (4 spans, regression)

**What the agent did**: Successfully instrumented 4 functions (getDaysWithEntries, findUnsummarizedDays, findUnsummarizedWeeks, findUnsummarizedMonths). One function failed: getDaysWithDailySummaries.

**Why getDaysWithDailySummaries failed**: COV-003 validation: "catch block at line 22 does not record error on span." The catch handles a missing summaries directory (readdir fails) — expected condition for a fresh installation.

**Quality issue in committed code (NDS-005b)**: The partial diff shows multiple expected-condition catches with recordException/setStatus added across all 4 committed functions:
- `getDaysWithEntries`: `readdir()` catch for missing entries directory (lines 62-65) and inner `readdir()` catch for missing month subdirectory (lines 81-83) — both NDS-005b
- `findUnsummarizedWeeks`: basePath attribute set on span but no NDS-005b issues (this function has no expected-condition catches)
- `findUnsummarizedMonths`: no expected-condition catch issues

**Root cause**: COV-003/NDS-005b conflict, same pattern as other files.

---

## Run-Level Failures

### Push Authentication (PERSISTENT — 3rd consecutive run)

**Run history**: Run-3 failed → Run-4 failed → Run-5 FAILED

**Symptom**: `remote: Invalid username or token. Password authentication is not supported for Git operations.`

**Root cause**: The orbweaver tool's subprocess uses HTTPS for git push. The pre-run verification uses SSH (`git push --dry-run` in the user's shell), which succeeds. But orbweaver's internal git context doesn't inherit SSH configuration — it falls back to HTTPS, which requires a token that isn't propagated.

**Why pre-run check didn't catch it**: The pre-run `git push --dry-run` runs in the user's shell environment where SSH keys are available. Orbweaver spawns its own subprocess where git defaults to HTTPS.

**Impact**: No PR created for 3 consecutive runs. The PR-as-deliverable has never been tested in evaluation.

**Already documented**: orbweaver-findings.md persistent section.

---

### SDK Init File Pattern Mismatch

**Symptom**: "SDK init file does not match recognized NodeSDK pattern. Instrumentation config written to orbweaver-instrumentations.js."

**Root cause**: commit-story-v2 is a library, not an application. It has no OTel SDK initialization file because libraries should not initialize the SDK — that's the deployer's responsibility. The orbweaver tool expects an application-style SDK init file and falls back to generating `orbweaver-instrumentations.js` when it can't find one.

**Impact**: Low — the fallback file is generated but not wired into the project. The actual OTel API imports in instrumented files work correctly without it.

**Orbweaver fix**: Detect library vs application projects (check for `peerDependencies` on `@opentelemetry/api` in package.json) and skip SDK init file detection for libraries. This is a pre-existing issue, not new to run-5.

---

### Summary Tally Omits Partial Files

**Symptom**: stdout reports "21 succeeded, 2 failed, 0 skipped" (23/29). Six partial files are missing from the tally.

**Root cause**: The stdout summary counts only terminal states (succeeded, failed, skipped). Partial files — which completed some function-level processing but not all — are a new category introduced by the validation pipeline and weren't added to the tally logic.

**Impact**: Cosmetic. The PR summary correctly reports all categories.

**Already documented**: orbweaver-findings.md as RUN-3.

---

### Extended Run Duration

**Symptom**: Run-5 took significantly longer than run-4 (~80 min for run-4; run-5 ran overnight with exact end time unknown).

**Root cause**: The validation/retry loop adds multiple LLM calls per file. Files that fail validation get retried 2-3 times, each involving a full re-analysis. Complex files (summary-graph, summary-manager) that go through oscillation detection take 10+ minutes before giving up.

**Cost comparison**: Run-4 cost $5.84 (8.6% of $67.86 ceiling). Run-5 cost $9.72 (14.3% of ceiling). The 66% cost increase correlates with validation retries but is still well below the ceiling. The increased cost is expected — run-4's anomalously low cost was a symptom of broken schema evolution.

**Already documented**: orbweaver-findings.md as RUN-4.

---

## Failure Trajectories (Cross-Run)

| File | Run-4 | Run-5 | Trajectory | Root Cause Change |
|------|-------|-------|------------|-------------------|
| summarize.js | SUCCESS | FAILED | Regressed | New: SCH-002 validation + COV-003 |
| index.js | SUCCESS | FAILED | Regressed | New: SCH-002 oscillation |
| journal-graph.js | SUCCESS (4 spans) | PARTIAL (1 span) | Regressed | New: function-level fallback scope limitation |
| summary-manager.js | SUCCESS | PARTIAL (4 spans) | Regressed | New: NDS-003 in fallback + LINT bug + COV-003 |
| summary-detector.js | SUCCESS | PARTIAL (4 spans) | Regressed | New: COV-003 on expected-condition catch |
| summary-graph.js | PARTIAL (0 spans) | PARTIAL (5 spans) | **Improved** | COV-003 blocked 1 of 6 functions |
| journal-manager.js | PARTIAL (0 spans) | PARTIAL (1 span) | **Improved** | COV-003 replaced NDS-003 as primary blocker |
| sensitive-filter.js | PARTIAL (0 spans) | PARTIAL (0 spans) | Same | NDS-003 persistent (correct outcome is 0 spans) |

**5 regressions**, all caused by the new validation pipeline (PR #171) and schema checks (PR #173). The validation correctly catches issues but causes net coverage loss.

**2 improvements**: summary-graph went from 0 to 5 spans, journal-manager went from 0 to 1 span. Schema evolution working correctly contributes to these improvements.

---

## Systemic Root Causes

### 1. COV-003/NDS-005b Validator Conflict (5 files, dominant failure pattern)

**Files affected**: summarize.js, summary-graph.js, journal-manager.js, summary-manager.js, summary-detector.js

**The conflict**: COV-003 requires `span.recordException()` + `span.setStatus({code: ERROR})` on ALL catch blocks within spans. NDS-005b says expected-condition catches (file-not-found, empty directories, graceful degradation) should NOT record exceptions because:
- `setStatus` is a one-way latch — marking file-not-found as ERROR pollutes error metrics
- `recordException` on expected conditions creates noise in traces, triggering false alerts

**Agent behavior**: When the agent CAN satisfy COV-003 (function passes validation), it adds error recording even on expected-condition catches, producing NDS-005b violations in committed code. When it can't (function has complex expected-condition patterns), the function fails validation entirely.

**Evidence in committed code**: journal-manager.js, summary-manager.js, and summary-detector.js partial diffs all show `span.recordException()` on file-not-found catches. The agent notes claim these aren't added, but the code shows they are — the agent complies with the validator over its own judgment.

**Fix priority**: HIGH — this single issue accounts for the majority of partial/failed files.

**Recommended fix**: Add `expected-condition` annotation support to the COV-003 validator. When a catch block is identified as expected-condition handling (file existence checks, empty directory fallbacks, graceful degradation returns), COV-003 should accept it without error recording. The LLM judge could classify catch blocks as expected-condition vs genuine-error, or the validator could recognize common patterns (catch followed by return default value, catch followed by continue).

### 2. SCH-002 in Schema-Uncovered Files (3 files)

**Files affected**: summarize.js, index.js, summary-manager.js (partially)

**The issue**: These files need attributes for operations not represented in the Weaver schema (summarize command metrics, batch operation counts). The agent invents reasonable `commit_story.summarize.*` attribute names, but the SCH-002 validator rejects all non-registered attributes.

**Why schema evolution doesn't help**: Schema evolution (agent-extensions.yaml) registers span NAMES and their associated attributes. But the evolution only works for attributes discovered during successful instrumentation — if the first attempt fails validation due to unknown attributes, those attributes never get registered.

**Fix priority**: HIGH — affects the two most important files (CLI entry point and primary command).

**Recommended fix options**:
1. Register `commit_story.summarize.*` and `commit_story.commands.*` attribute groups in the Weaver schema
2. Allow SCH-002 to accept new attributes that follow the `commit_story.*` namespace convention (soft validation)
3. Two-pass approach: first pass registers extensions, second pass validates against the extended schema

### 3. Function-Level Fallback Quality (3 files)

**Files affected**: journal-graph.js (scope limitation), summary-manager.js (NDS-003 + LINT), sensitive-filter.js (NDS-003)

**Issues**:
- **Scope limitation**: Fallback only processes exported functions individually, losing coverage on valuable internal functions (journal-graph.js node functions)
- **Import corruption**: Generates `imimport` instead of `import` (summary-manager.js generateAndSaveMonthlySummary)
- **Context loss**: Self-contained function generation doesn't preserve module import structure, triggering NDS-003 ("original line 1 missing/modified")
- **Persistent NDS-003**: Some functions (sensitive-filter.js redactSensitiveData) are complex enough that the agent consistently introduces modifications

**Fix priority**: MEDIUM — affects file coverage but the committed code is correct.

**Recommended fix**: Process non-exported functions in fallback when they were instrumentation targets in the whole-file attempt. Fix the code synthesis bug that produces corrupted imports.

### 4. Oscillation in Fix/Retry Loop (2 files)

**Files affected**: index.js (SCH-002 9→12), summary-manager.js (NDS-003 1→2)

**The issue**: The fix/retry loop's correction attempts sometimes make things worse. The feedback tells the agent what's wrong but doesn't help it converge on a solution.

**Fix priority**: MEDIUM — oscillation detection prevents infinite loops, but files get zero instrumentation when it triggers.

**Recommended fix**: Provide valid alternatives in fix feedback (not just "this attribute is invalid" but "use commit_story.journal.entry_date instead"). Alternatively, accept partial compliance — commit the spans that passed validation, strip the invalid attributes rather than rejecting the whole file.

### 5. Entry Point File as Single Point of Live-Check Failure

**Files affected**: index.js

**The issue**: The entry point is special — it's where the root span lives, it's the primary code path tests exercise, and live-check's value depends on it being instrumented. When index.js fails, orbweaver restores the original, tests run against uninstrumented code, and live-check reports "OK" — silently degrading to meaningless. Run-5's "Live-Check Compliance: OK" is misleading because no telemetry was emitted from the primary code path.

**Fix priority**: HIGH — live-check is a key quality signal, and its reliability depends on entry point instrumentation.

**Recommended fix**: Entry point should get relaxed validation (accept partial schema compliance, strip failing attributes rather than rejecting the file), priority retry budget, and live-check should report "DEGRADED" when the entry point failed.

### 6. No Whole-File Syntax Check After Function-Level Assembly

**Files affected**: summary-manager.js (LINT failure on `imimport`)

**The issue**: The function-level fallback processes each function independently and runs LINT per-function, but there's no whole-file syntax verification after all functions are reassembled. The `imimport` corruption was caught by per-function LINT, but similar synthesis errors in the assembly step (import merging, scope conflicts) could slip through. Live-check would catch these at runtime (test failures), but an earlier `node --check` on the assembled file would be faster and more targeted.

**Fix priority**: MEDIUM — per-function LINT caught this case, but the gap is a latent risk.

---

## New Findings for orbweaver-findings.md

### DEEP-1: COV-003 validator lacks expected-condition catch exemption

- **Priority**: High
- **Recommended Action**: Issue (single fix, not PRD-sized)
- **Description**: COV-003 requires error recording on ALL catch blocks within spans, with no exemption for expected-condition catches. This forces the agent to either (a) add incorrect error recording on expected conditions (NDS-005b violation) or (b) fail validation entirely. Five of 8 problematic files in run-5 are affected by this conflict.
- **Evidence**: summary-graph.js weeklySummaryNode skipped, journal-manager.js discoverReflections skipped, summary-detector.js getDaysWithDailySummaries skipped, summarize.js 4 COV-003 violations, summary-manager.js multiple function failures.
- **Acceptance Criteria**: COV-003 validator should classify catch blocks as expected-condition vs genuine-error and only require error recording on genuine-error catches.

### DEEP-2: Function-level fallback generates corrupted imports

- **Priority**: Medium
- **Recommended Action**: Issue
- **Description**: The function-level fallback's code generation for individual function re-instrumentation produces corrupted import statements (`imimport` instead of `import` in summary-manager.js generateAndSaveMonthlySummary) and loses module context (NDS-003 "original line 1 missing/modified" on saveDailySummary, readWeekDailySummaries, saveWeeklySummary).
- **Evidence**: `evaluation/run-5/orbweaver-pr-summary.md` function-level fallback results for summary-manager.js.
- **Acceptance Criteria**: Function-level fallback generates syntactically valid code that preserves the module's import structure.

### DEEP-3: NDS-005b violations in committed code from COV-003 compliance

- **Priority**: Medium
- **Recommended Action**: Issue (evaluate alongside DEEP-1)
- **Description**: When the agent CAN satisfy COV-003, it adds `span.recordException()` and `span.setStatus({code: ERROR})` on expected-condition catches (file-not-found, empty directory fallbacks) in committed code. This produces NDS-005b violations — expected conditions recorded as errors, polluting error metrics and creating trace noise. The agent notes claim these aren't added, but the actual code shows they are.
- **Evidence**: Partial diffs for journal-manager.js (line 127-129), summary-manager.js (lines 69-71, 197-199, 325-327, 351-353, 428-430), summary-detector.js (lines 62-65, 81-83).
- **Acceptance Criteria**: Agent should not add error recording on catch blocks it classifies as expected-condition handlers, even when COV-003 validator would accept it.

### DEEP-4: Duplicate JSDoc comments in instrumented output

- **Priority**: Low
- **Recommended Action**: Issue
- **Description**: All partial diffs show duplicate JSDoc blocks — the agent generates a new JSDoc comment above each function and also preserves the original, resulting in two identical comment blocks. This is cosmetic but increases file size and creates maintenance confusion.
- **Evidence**: All 5 partial diffs in `evaluation/run-5/partial-diffs/`.
- **Acceptance Criteria**: Instrumented output should have exactly one JSDoc block per function — either the original preserved or a replacement, not both.
