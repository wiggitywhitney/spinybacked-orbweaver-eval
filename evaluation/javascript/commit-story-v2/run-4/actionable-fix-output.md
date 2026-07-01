# Run-4 Actionable Fix Output

**To:** SpinybackedOrbWeaver maintainer / AI coding agent
**From:** Evaluation run-4 of commit-story-v2-eval (29 JavaScript files)
**Date:** 2026-03-16
**Run score:** 58% strict (15/26), 73% methodology-adjusted + schema split (19/26), 4/5 gates pass
**Source artifacts:** `per-file-evaluation.json`, `rubric-scores.json` (canonical); all other docs rendered from these

---

## Supporting Documents

All paths are relative to the `commit-story-v2-eval` repository root.

| Document | Path | Contents |
|----------|------|----------|
| **Orbweaver findings** | `evaluation/run-4/orb-findings.md` | 13 findings with acceptance criteria, classified as PRD or Issue |
| **Per-file evaluation (JSON)** | `evaluation/run-4/per-file-evaluation.json` | Canonical per-file evaluation data — source of truth |
| **Per-file evaluation (MD)** | `evaluation/run-4/per-file-evaluation.md` | Human-readable rendering of the JSON |
| **Rubric scores (JSON)** | `evaluation/run-4/rubric-scores.json` | Canonical rubric scoring data — source of truth |
| **Rubric scores (MD)** | `evaluation/run-4/rubric-scores.md` | Human-readable rendering of the JSON |
| **Baseline comparison** | `evaluation/run-4/baseline-comparison.md` | Run-4 vs run-3 vs run-2 comparison |
| **Failure deep-dives** | `evaluation/run-4/failure-deep-dives.md` | Root cause analysis for all partial files and run-level failures |
| **PR evaluation** | `evaluation/run-4/pr-evaluation.md` | PR artifact quality assessment |
| **Lessons for PRD #5** | `evaluation/run-4/lessons-for-prd5.md` | Rubric gaps, process improvements, methodology changes |
| **Evaluation rubric** | `spinybacked-orbweaver/research/evaluation-rubric.md` | 32-rule rubric (5 gates + 27 quality rules) |
| **Orbweaver branch** | `orbweaver/instrument-1773627869602` | Local branch with instrumented code (not pushed — git push auth failed) |

---

## How to Read This Document

Each finding states **what's wrong**, **evidence** (from canonical JSON artifacts), and **desired outcome**. Findings are grouped by priority:

1. **Critical infrastructure** — blocks the entire run's value proposition
2. **High priority** — specific orbweaver bugs that, if fixed, reach the 85% quality target
3. **Medium priority** — genuine new findings with clear fixes
4. **Methodology-driven** — scored as failures under run-4's stricter criteria; may not need orbweaver changes
5. **Failed/partial files** — file-level root cause analysis
6. **Run-3 issue assessment** — status of all 11 run-3 findings
7. **Rubric gap assessment** — gaps discovered during run-4
8. **Run-5 verification checklist**

Orbweaver finding references (e.g., "Finding #9") point to `evaluation/run-4/orb-findings.md`.

---

## 1. Critical Infrastructure (2 findings — must fix before run-5)

### Schema Evolution Broken — Extensions Never Written to Registry

**What's wrong:** The central design feature of orbweaver — schema evolution across files — is non-functional. Every schema extension from all 29 files was rejected as `(unparseable)`. No file saw extensions from previous files. All 29 files received the identical base Weaver schema.

**Root cause:** Format mismatch. Agent outputs `schemaExtensions` as string IDs (per prompt spec); `parseExtension()` expects YAML objects with an `id` field.

**Evidence (from rubric-scores.json):**
- `failure_classification[7]` (SCH-001): `"category": "schema_evolution_dependency"` — 8/37 span names deviate; naming inconsistency correlates with file processing order
- `failure_classification[8]` (SCH-002): `"category": "schema_evolution_dependency"` — 11 ad-hoc attributes, all in schema-uncovered files
- `schema_coverage_split.SCH-002.covered_result`: `"pass"` — covered files fully compliant, proving the agent follows the registry when it exists
- `overall_score`: cost at 8.6% of ceiling — diagnostic signal that the prompt wasn't changing between files

**Desired outcome:** After fix: file N+1's resolved schema includes extensions from file N. The `(unparseable)` rejection count is 0 for well-formed extensions. `agent-extensions.yaml` exists in the registry after the first file that invents a new span/attribute.

**Orbweaver finding:** #1 (recommended action: PRD)

---

### Validation Pipeline — No Per-File Checks, No Fix/Retry on Failure

**What's wrong:** Three gaps: (a) test failures don't trigger fix/retry — broken code committed as "partial"; (b) function-level fallback path omits tracer initialization at module scope; (c) no per-file test or lint check after instrumentation.

**Evidence (from per-file-evaluation.json):**
- `per_run.NDS-002`: `"result": "fail"`, 32 test failures, all `ReferenceError: tracer is not defined`
- `per_run.NDS-002.affected_files`: `["src/generators/summary-graph.js", "src/integrators/filters/sensitive-filter.js"]`

**Impact:** File 14 introduced the bug; 15 more files processed before end-of-run discovery. Per-file `node --check` would have caught it 80% earlier.

**Desired outcome:** (1) Per-file static check after each file before commit. (2) Function-level fallback adds tracer import at module scope. (3) Fix/retry on test failure. (4) Branch never contains code that fails the project's test suite.

**Orbweaver finding:** #2 (recommended action: PRD)

---

## 2. High Priority — Three Fixes to Reach 85% Target

Under methodology-adjusted + schema split scoring (currently 19/26 = 73%), fixing these 3 specific bugs reaches 22/26 = 85%.

### CDQ-002: Tracer Name Defaults to 'unknown_service'

**What's wrong:** All 16 instrumented files use `trace.getTracer('unknown_service')` instead of `trace.getTracer('commit-story')`. The library name should match `package.json#name`. Systemic agent configuration bug — one root cause, 16 affected files.

**Evidence (from rubric-scores.json):**
- `quality_rules.CDQ-002`: `"result": "fail"`, `"files_fail": 16`, `"files_pass": 0`
- `failure_classification[9]`: `"category": "genuine_new_finding"`, `"orbweaver_issue": "#11"`

**Note:** Run-3 CDQ-002 used a pattern-only check (PASS). Run-4 checks name correctness (FAIL). The bug existed in run-3 but wasn't captured by CDQ-002.

**Desired outcome:** Agent reads `package.json#name` and uses it as the tracer library name. All files use `trace.getTracer('commit-story')`.

**Orbweaver finding:** #9 (recommended action: Issue — low complexity, prompt/config fix)

---

### NDS-005: Expected-Condition Catch Blocks Recorded as Errors

**What's wrong:** 3 files (summarize.js, summary-manager.js, summary-detector.js) have expected-condition `catch {}` blocks — used for ENOENT file/directory-not-found control flow — changed to record exceptions and set ERROR status. OTel `setStatus` is a one-way latch; once ERROR, the span is permanently marked ERROR even when the function succeeds.

**Evidence (from rubric-scores.json):**
- `quality_rules.NDS-005`: `"result": "fail"`, `"files_fail": 3`, `"failure_class": "expected-condition catch block"`
- `failure_classification[1]`: `"category": "genuine_new_finding"`, `"orbweaver_issue": "#10"`

**Evidence (from per-file-evaluation.json):**
- `per_file["src/commands/summarize.js"].rules.NDS-005`: "Original `catch { // Doesn't exist, proceed }` intentionally swallowed the fs access error"
- `per_file["src/managers/summary-manager.js"].rules.NDS-003`: "In all 3 generateAndSave* functions, the access() catch blocks changed"
- `per_file["src/utils/summary-detector.js"].rules.NDS-005`: "Original catch {} blocks now have catch (error) { span.recordException(error) }"

**Desired outcome:** Agent distinguishes error-handling catch blocks (where `recordException` is appropriate) from expected-condition catch blocks (where the catch IS the normal path). For expected-condition catches, the agent should NOT add `recordException` or `setStatus(ERROR)`.

**Orbweaver finding:** #3 (recommended action: Issue)

---

### COV-001: index.js Missing Root Span on main()

**What's wrong:** `index.js` `main()` — the CLI entry point — has NO root span. Only the summarize and journal-generate code paths within main are spanned. Without a root span, the trace has no top-level operation. This is a **regression** from run-3 where `main()` had a `commit_story.generate_journal_entry` span.

**Evidence (from rubric-scores.json):**
- `quality_rules.COV-001`: `"result": "fail"`, `"files_fail": 1`, `"failing_files": ["src/index.js"]`
- `failure_classification[2]`: `"category": "genuine_regression"`

**Desired outcome:** CLI entry point `main()` has a root span covering the entire operation. All code paths within main are children of this root span.

**Orbweaver finding:** #13 (recommended action: Issue — low complexity)

---

## 3. Medium Priority — Genuine New Findings

### RST-001: Over-Instrumentation of Pure Synchronous Functions

**What's wrong:** `token-filter.js` has spans on `truncateDiff()` and `truncateMessages()` — exported but pure synchronous data transformation functions with no I/O. They are called from `applyTokenBudget` (which has a span). Adding spans to pure functions is over-instrumentation.

**Evidence (from rubric-scores.json):**
- `quality_rules.RST-001`: `"result": "fail"`, `"files_fail": 1`, `"failing_files": ["src/integrators/filters/token-filter.js"]`
- `failure_classification[6]`: `"category": "genuine_new_finding"`

**Desired outcome:** Agent does not add spans to pure synchronous functions. "Exported" does not automatically mean "instrumentable" — functions must have I/O or be entry points.

**Orbweaver finding:** #12 (recommended action: Issue)

---

### SCH-001: Span Naming Inconsistency Across File Boundaries

**What's wrong:** 8 of 37 span names (22%) deviate from `commit_story.*` convention. Deviating names use `context.*`, `mcp.*`, and `summary.*` prefixes. Inconsistency correlates with file processing order — earlier files use consistent naming, later files deviate.

**Evidence (from rubric-scores.json):**
- `quality_rules.SCH-001`: `"result": "fail"`, `"files_fail": 4`
- `quality_rules.SCH-001.deviating_names`: `context.*` (2 names), `summary.*` (3 names), `mcp.*` (3 names)
- `schema_coverage_split.SCH-001.covered_result`: `"fail"` — context-integrator.js uses `context.gather_for_commit` instead of `commit_story.*`. 1 of 10 covered files deviates.

**Root cause:** Without schema evolution, each file's agent invocation has no visibility into what span names previous files used. Partially depends on Finding #1 (schema evolution).

**Desired outcome:** After schema evolution fix, all span names in a run use consistent `commit_story.*` prefix convention. Consider adding a span naming template to the agent prompt.

**Orbweaver finding:** #10 (recommended action: Issue, partially depends on #1)

---

### CDQ-003: Error Recording Misuse on Expected-Condition Path

**What's wrong:** `summarize.js` uses `recordException` + `setStatus(ERROR)` on a non-error control flow path — file-not-found is the expected condition for generating a new summary. Different from run-3's CDQ-003 failure (missing recordException in commit-analyzer.js — that file now passes).

**Evidence (from rubric-scores.json):**
- `quality_rules.CDQ-003`: `"result": "fail"`, `"files_fail": 1`, `"failing_files": ["src/commands/summarize.js"]`

**Desired outcome:** Same as NDS-005 above — agent distinguishes error handling from expected-condition control flow. This finding overlaps with Finding #3 in `orb-findings.md`.

---

## 4. Methodology-Driven Findings (4 rules)

These scored as failures under run-4's stricter per-file evaluation but would PASS under run-3's methodology. They represent evaluation maturation, not necessarily orbweaver bugs.

### COV-002 / COV-004: Individual Operation Coverage

**Run-3 methodology:** Parent span coverage accepted (PASS). **Run-4 methodology:** Per-file agents evaluate individual operations (FAIL for 2 files each).

**Evidence (from rubric-scores.json):**
- `COV-002`: `"failing_files": ["src/collectors/claude-collector.js", "src/index.js"]` — findJSONLFiles/parseJSONLFile lack individual spans; 3 git validation calls in index.js lack spans
- `COV-004`: `"failing_files": ["src/collectors/claude-collector.js", "src/collectors/git-collector.js", "src/index.js"]` — async I/O operations without individual spans
- `dimensions.COV.methodology_adjusted.adjusted_score`: `"4/6 (67%)"` — would pass under run-3 methodology

**Run-5 recommendation:** Use per-file evaluation consistently. These are legitimate coverage gaps, but they represent a higher bar than previous runs. Provide methodology-adjusted scores for cross-run comparability.

---

### COV-005: Ad-Hoc Attributes in Schema-Uncovered Files

**What's wrong:** `auto-summarize.js` (4 attributes) and `summary-detector.js` (3 attributes) use attributes not in the Weaver registry. These are schema-uncovered summary subsystem files where no registry definitions exist.

**Evidence (from rubric-scores.json):**
- `quality_rules.COV-005`: `"schema_coverage_note"` — both files are schema-uncovered, attributes follow `commit_story.*` namespace and are semantically valid
- `schema_coverage_split.SCH-002.uncovered_result`: `"pass"` — invention quality is high

**Run-5 recommendation:** Schema coverage split scoring addresses this. Do NOT pre-register summary attributes — preserving the gap tests the agent's schema extension capability.

---

### CDQ-006: isRecording() Guards on Cheap Computation

**What's wrong:** 2 files (claude-collector.js, git-collector.js) call `toISOString()` without `span.isRecording()` guard.

**Evidence (from rubric-scores.json):**
- `quality_rules.CDQ-006`: `"methodology_note"` — run-3 deemed `toISOString()` lightweight (PASS); run-4 applies strict rubric (FAIL)

**Run-5 recommendation:** Consider adding a rubric clarification: "trivial type conversions (toISOString, String(), Number()) do not require isRecording() guards." This would make CDQ-006 consistent across runs.

---

## 5. Failed/Partial Files (3 files)

Data sourced from `per-file-evaluation.json` (`failed_files` section) and `failure-deep-dives.md`.

**Critical context:** summary-graph.js, sensitive-filter.js, and journal-manager.js are reported as "partial" in the PR summary but have **NO changes on the orbweaver branch** — their instrumentation was never committed. Evaluate branch state, not agent self-reports.

### summary-graph.js — Partial (12/12 functions, 6 spans, not committed)

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Failed | Token budget exceeded (~94K tokens) |
| Run-3 | Failed | Oscillation — 500+ lines, couldn't converge |
| Run-4 | Partial | Function-level fallback succeeded; missing tracer import blocked commit |

**Root cause:** Function-level fallback (orbweaver #106) instrumented all 12 functions individually — a major improvement. But the fallback path did not add `tracer` initialization at module scope, causing 21 test failures (`ReferenceError: tracer is not defined`). The broken code was never committed to the branch.

**Fix needed:** Orbweaver findings #2b (tracer import in function-level fallback) and #2a (fix/retry on failure).

**Prognosis:** Once the tracer import bug is fixed, this file should be fully successful. Function-level fallback already handles the token budget and oscillation issues.

---

### sensitive-filter.js — Partial (2/3 functions, 2 spans, not committed)

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Failed | Null parsed output |
| Run-3 | Failed | Null parsed output (same bug) |
| Run-4 | Partial | 2/3 functions instrumented; 1 blocked by regex mangling (NDS-003) |

**Root cause:** Two issues: (1) Same missing tracer import as summary-graph.js — 11 test failures. (2) `redactSensitiveData` function contains complex regex patterns in `SENSITIVE_PATTERNS` array. The agent systematically mangles every regex literal (12 NDS-003 violations on one function).

**Fix needed:** Findings #2b (tracer import), #2a (fix/retry). The regex mangling may require a targeted agent strategy (e.g., "preserve regex" directive or copy-paste-exact for regex-containing lines).

**Prognosis:** 2/3 functions should succeed once tracer import is fixed. `redactSensitiveData` may require a specialized approach for regex-heavy code.

---

### journal-manager.js — Partial (1/3 functions, 0 useful spans)

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Failed | NDS-003 — agent added business logic |
| Run-3 | Failed | NDS-003 (x5) + COV-003 (x3) |
| Run-4 | Partial | 1/3 functions (0 spans); 2/3 blocked by NDS-003 |

**Root cause:** The agent cannot instrument `saveJournalEntry` or `discoverReflections` without minor structural changes that NDS-003 blocks. In run-4, `saveJournalEntry` had a non-instrumentation conditional added; `discoverReflections` had a comment line modified. The whole-file approach produced valid instrumentation, but function-level fallback couldn't produce valid diffs for either function.

**Fix needed:** This is a design tension, not just a bug. Three approaches: (1) Allow NDS-003 "instrumentation-motivated" refactors (risk: scope creep). (2) Improve the agent's ability to add spans without modifying surrounding code. (3) Accept that some files need manual post-agent instrumentation.

**Prognosis:** Marginal improvement likely without NDS-003 policy changes or significantly improved agent span-wrapping technique.

---

## 6. Run-3 Orbweaver Issue Assessment

Status of all 11 issues from `evaluation/run-3/orb-issues-to-file.md`:

| Run-3 Issue | Summary | Run-4 Status |
|-------------|---------|-------------|
| #1 | Token budget is post-hoc | **Improved** — function-level fallback rescued journal-graph.js. Budget issue less relevant with per-function approach. |
| #2 | Null parsed output has no diagnostics | **Fixed** — sensitive-filter.js now produces output (was null in run-2 and run-3). |
| #3 | Zero-span files give no reason in CLI output | **Not fixed** — 10 zero-span files still show no reason. Additionally, commit attempts on zero-change files produce noise (run-4 finding #8). |
| #4 | NDS-003 should allow instrumentation-motivated refactors | **Persistent** — journal-manager.js still blocked by NDS-003 in all 3 runs. context-integrator.js was rescued (agent found a different approach), but the underlying NDS-003 policy hasn't changed. |
| #5 | Accept multiple path arguments | **Not tested in run-4** — full directory run used. |
| #6 | Oscillation error lacks detail | **Not applicable** — no oscillation in run-4 (function-level fallback prevented it). |
| #7 | Test suite integration | **Partially implemented** — end-of-run tests run, but no per-file test execution. 32 failures discovered only at end of run. |
| #8 | Unify oscillation and repeated-failure errors | **Not applicable** — no oscillation in run-4. |
| #9 | Function-level instrumentation for large files | **Fixed** (orbweaver #106) — rescued journal-graph.js (4 spans), improved sensitive-filter.js (2/3 functions), and improved journal-manager.js (1/3 functions). The single biggest capability improvement in run-4. |
| #12 | Validate GitHub token at startup | **Not fully fixed** — pre-run validation (`git ls-remote`) passed but `git push` still failed 80 minutes later. Validation checks read access, not push access. |
| #13 | Save PR summary to local file as backup | **Fixed** — `orbweaver-pr-summary.md` (106KB) saved before push failure. Full PR content available for evaluation despite no GitHub PR. |

### Summary

| Status | Count | Issues |
|--------|-------|--------|
| Fixed / Verified | 4 | #2 (null output), #9 (function-level), #13 (local PR), #1 (improved) |
| Persistent / Not fixed | 3 | #3 (zero-span reason), #4 (NDS-003 policy), #12 (push validation) |
| Not applicable to run-4 | 2 | #6 (oscillation detail), #8 (oscillation unification) |
| Not tested | 1 | #5 (multiple paths) |
| Partially implemented | 1 | #7 (test suite — end-of-run only, not per-file) |

---

## 7. Run-4 Rubric Gap Assessment

New rubric gaps discovered during run-4 evaluation. Documented in `evaluation/run-4/lessons-for-prd5.md`.

### New Rules Needed

| Gap | Proposed Rule | Category |
|-----|---------------|----------|
| Schema evolution compliance | SCH-005: Schema extensions from file N are visible in file N+1's resolved schema | Schema Fidelity |

### Existing Rules Needing Clarification

| Rule | Issue | Recommendation |
|------|-------|----------------|
| CDQ-002 | Run-3 used pattern check (getTracer called); run-4 uses semantic check (name correct). Bug existed in run-3. | Standardize on semantic check (name correctness) for run-5. |
| CDQ-006 | `toISOString()` is a trivial type conversion. Run-3 exempt; run-4 strict. | Add "cheap computation" exemption for trivial type conversions. |
| NDS-005 | Expected-condition catch blocks are a distinct failure class from "agent broke error handling." | Consider a sub-classification or dedicated rule for expected-condition catches. |
| CDQ-003 | Run-3: missing recordException. Run-4: misuse of recordException on expected-condition. Different bugs, same rule. | The rule covers both absence and misuse — this is correct but should be documented. |

### Scoring Methodology Gaps

| Gap | Recommendation |
|-----|----------------|
| Rule-level pass/fail penalizes larger file sets (16 files vs 11) | Add per-file instance counts alongside rule-level scores for nuance |
| CDQ-002 is one root cause flagging 16 files | Consider a "systemic bug" classification — one root cause, not 16 violations |
| Schema coverage split is applied ad-hoc | Make schema coverage split a standard scoring dimension in run-5 |
| 4 score variants (strict, adjusted, split, split+adjusted) create confusion | Establish per-file evaluation as canonical methodology; adjusted scores for backward compatibility only |

---

## 8. Run-5 Verification Checklist

### Pre-Run (Before Processing Files)

- [ ] **Schema evolution smoke test:** Instrument one test file, verify `agent-extensions.yaml` was written, resolve schema, confirm extensions visible in resolved prompt for file 2
- [ ] **Push capability test:** Verify `git push --dry-run` succeeds (not just `git ls-remote` which tests read access only)
- [ ] **Function-level fallback tracer import:** Verify the fallback path adds `import { trace, SpanStatusCode } from '@opentelemetry/api'` and `const tracer = trace.getTracer('...')` at module scope
- [ ] **Tracer library name:** Verify the agent uses `package.json#name` (expected: `'commit-story'`), not `'unknown_service'`
- [ ] **Orbweaver build is fresh:** `npm run prepare` in spinybacked-orbweaver, verify build timestamp

### During Run

- [ ] **Per-file static check:** `node --check` runs after each file before commit
- [ ] **Schema evolution health:** Compare schemaHashBefore vs schemaHashAfter after first 3 files — if identical, schema evolution is still broken
- [ ] **Cost sanity:** If actual cost < 15% of ceiling after 10+ files, investigate whether the prompt is changing between files

### Post-Run

- [ ] **Test suite clean:** 0 failures in `npm test`
- [ ] **PR created:** GitHub PR exists (draft OK if tests failed)
- [ ] **Branch deliverable:** All files reported as instrumented have actual changes on the branch (not just in working directory)

### Quality Rule Verification (Targeted)

| Rule | Expected | What to Check |
|------|----------|---------------|
| CDQ-002 | PASS | All files use `trace.getTracer('commit-story')` |
| NDS-005 | PASS | Expected-condition catch blocks (ENOENT) NOT changed to record exceptions |
| COV-001 | PASS | `index.js` `main()` has a root span |
| SCH-001 | Improved | With schema evolution working, span naming consistency should improve. Track covered vs uncovered files separately. |
| SCH-002 | Improved | Schema evolution should register attributes automatically. Track covered vs uncovered. |
| NDS-002 | PASS | Branch contains only passing code; function-level fallback adds tracer imports |
| RST-001 | PASS | Pure synchronous functions (truncateDiff, truncateMessages) should NOT have spans |

### Files to Watch

| File | Run-4 Status | Expected in Run-5 |
|------|-------------|-------------------|
| summary-graph.js | Partial (tracer import bug) | **Success** — function-level fallback works; tracer import fix is straightforward |
| sensitive-filter.js | Partial (tracer import + regex) | **Improved** — 2/3 functions should succeed; `redactSensitiveData` may still fail on regex patterns |
| journal-manager.js | Partial (NDS-003 persistent) | **Unchanged** without NDS-003 policy changes |

---

## 9. Score Projection for Run-5

### Minimum (fix critical infrastructure only)

Fix findings #1 (schema evolution) and #2 (validation pipeline):
- NDS-002 gate: FAIL → PASS (tracer import fix)
- SCH-001, SCH-002: Likely improved (evolution propagates naming/attributes)
- Strict score: ~62-65% (from 58%)

### Target (fix critical + high priority)

Additionally fix findings #3 (expected-condition catches), #9 (tracer name), #13 (root span):
- NDS-005: FAIL → PASS
- CDQ-002: FAIL → PASS
- COV-001: FAIL → PASS
- Methodology-adjusted + split score: 73% → **85%** (22/26)
- Strict score: 58% → ~69% (18/26)

### Stretch (fix all genuine findings)

Additionally fix findings #10 (naming), #12 (over-instrumentation):
- SCH-001: FAIL → potentially PASS (with evolution + naming template)
- RST-001: FAIL → PASS
- Methodology-adjusted + split score: **92%** (24/26)
- Strict score: ~77% (20/26)

### Ceiling (all fixable issues)

With methodology changes standardized (COV-002, COV-004 accepted under per-file evaluation):
- Strict score ceiling: ~85% (22/26) — COV-005 and CDQ-006 require rubric clarification
- Adjusted score ceiling: **96%** (25/26) — only SCH-001 may persist due to schema-uncovered file naming

---

## Summary: Priority Action Matrix

| Priority | Finding # | Rule(s) Affected | Action | Impact |
|----------|-----------|-----------------|--------|--------|
| **Critical** | #1 | SCH-001, SCH-002, CDQ-008 | PRD | Schema evolution is the core design feature — broken |
| **Critical** | #2 | NDS-002 (gate) | PRD | Validation pipeline: per-file checks, tracer import, fix/retry |
| **High** | #9 | CDQ-002 (all 16 files) | Issue | Tracer name: `'commit-story'` not `'unknown_service'` |
| **High** | #3 | NDS-005, CDQ-003 | Issue | Expected-condition catches ≠ errors |
| **High** | #13 | COV-001 | Issue | Root span on `index.js` `main()` — regression from run-3 |
| **Medium** | #12 | RST-001 | Issue | Don't span pure synchronous functions |
| **Medium** | #10 | SCH-001 | Issue | Span naming template (depends on #1) |
| **Medium** | #6 | UX | Issue | Create draft PR when tests fail |
| **Medium** | #7 | NDS-002 (indirect) | Issue | LOC-aware test cadence (group with #2) |
| **Low** | #4 | UX | Issue | Schema extension warning deduplication |
| **Low** | #8 | UX | Issue | Skip commit for zero-change files |
| **Low** | #11 | RST | Issue | Unused OTel imports on zero-span files |
| **Low** | #5 | UX | Issue | CLI output: show artifact locations |
