# Run-4 Failure Deep-Dives

Run-4 had **0 full failures** and **3 partial results** — a significant improvement from run-3's 4 full failures. This document analyzes the root cause of each partial result, cross-references orbweaver issues, and assesses persistent failure rescue.

---

## Executive Summary

| File | Run-2 | Run-3 | Run-4 | Verdict |
|------|-------|-------|-------|---------|
| journal-graph.js | failed (token budget) | failed (oscillation) | success (4 spans) | **Rescued** |
| context-integrator.js | failed (NDS-003) | failed (NDS-003) | success (1 span) | **Rescued** |
| summary-graph.js | failed (token budget) | failed (oscillation) | partial (12/12 fn, 6 spans) | Improved |
| sensitive-filter.js | failed (null output) | failed (null output) | partial (2/3 fn, 2 spans) | Improved |
| journal-manager.js | failed (NDS-003) | failed (NDS-003 x5) | partial (1/3 fn, 0 spans) | Improved |

**2 of 5 persistent failures fully rescued, 3 improved to partial.** However, summary-graph.js and sensitive-filter.js committed broken code (missing `tracer` import) that caused 32 test failures (21 + 11) discovered only at end-of-run.

---

## Partial File #1: summary-graph.js

**Status:** Partial (12/12 functions, 6 spans)
**Test failures caused:** 17 direct + 4 downstream = 21

### History

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Failed | Token budget exceeded (~94K tokens) |
| Run-3 | Failed | Oscillation — 500+ line file, couldn't converge even at 150K budget |
| Run-4 | Partial | Function-level fallback succeeded; missing tracer import |

### What Happened in Run-4

1. **Whole-file instrumentation failed** — file is 750+ lines, exceeded the whole-file approach limits
2. **Function-level fallback activated** (orbweaver #106) — instrumented all 12 functions individually
3. Each function received `tracer.startActiveSpan()` calls with proper span names and attributes
4. **Critical bug:** The function-level fallback path did not add the `tracer` initialization at module scope

### Root Cause

The function-level fallback instruments individual functions in isolation. Each function gets `tracer.startActiveSpan(...)` calls, but no function's diff includes the module-level boilerplate:

```javascript
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('commit-story');
```

The whole-file path handles this correctly because it sees the entire file and adds the import at the top. The function-level path processes functions independently and assumes the tracer is already available.

### Evidence

From the test output, 6 distinct locations reference `tracer`:
- Line 181: `dailySummaryNode` → `tracer.startActiveSpan('commit_story.ai.generate_daily_summary', ...)`
- Line 268: `generateDailySummary` → `tracer.startActiveSpan('commit_story.ai.generate', ...)`
- Line 415: `weeklySummaryNode` → `tracer.startActiveSpan('commit_story.ai.generate_weekly_summary', ...)`
- Line 503: `generateWeeklySummary` → `tracer.startActiveSpan('commit_story.ai.generate_weekly_summary', ...)`
- Line 653: `monthlySummaryNode` → `tracer.startActiveSpan('commit_story.ai.monthly_summary', ...)`
- Line 744: `generateMonthlySummary` → `tracer.startActiveSpan('commit_story.ai.generate_monthly_summary', ...)`

None of these have a corresponding `tracer` definition anywhere in the file.

### Test Failure Breakdown

| Test File | Failures | Function Under Test |
|-----------|----------|-------------------|
| summary-graph.test.js | 5 | dailySummaryNode (4), generateDailySummary (1) |
| weekly-summary-graph.test.js | 6 | weeklySummaryNode (5), generateWeeklySummary (1) |
| monthly-summary-graph.test.js | 6 | monthlySummaryNode (5), generateMonthlySummary (1) |
| weekly-summary-manager.test.js | 2 | Downstream — calls generateWeeklySummary |
| monthly-summary-manager.test.js | 2 | Downstream — calls generateMonthlySummary |
| **Total** | **21** | |

### Orbweaver Issue Cross-References

| Issue | Relevance | Status |
|-------|-----------|--------|
| Run-3 #6 | Oscillation error lacked detail | Run-4: N/A — no oscillation |
| Run-3 #9 | Function-level instrumentation for large files | **Fixed** (orbweaver #106) — this is what rescued the file |
| Run-4 #3 | Missing tracer import in function-level fallback | **New** — direct cause of failure |
| Run-4 #2 | Test failures don't trigger fix/retry | **New** — broken code committed without remediation |

### Assessment

**Major progress.** Function-level fallback (orbweaver #106) is the single biggest improvement in run-4 — it rescued a file that had failed in both prior runs. The missing tracer import is a straightforward code generation bug in the fallback path, not an architectural limitation. Once fixed, this file should be fully successful.

---

## Partial File #2: sensitive-filter.js

**Status:** Partial (2/3 functions, 2 spans)
**Test failures caused:** 11

### History

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Failed | Null parsed output — LLM returned no structured output |
| Run-3 | Failed | Null parsed output — same bug on all 3 attempts |
| Run-4 | Partial | 2/3 functions instrumented; 1 function blocked by NDS-003 on regex patterns |

### What Happened in Run-4

1. **Whole-file instrumentation attempted** — the agent produced output instrumenting `redactMessages` and `applySensitiveFilter`
2. The agent explicitly noted: "The previous NDS-003 failure was caused by mangling regex literals in SENSITIVE_PATTERNS. To avoid this, the regex patterns in SENSITIVE_PATTERNS have been preserved verbatim."
3. `redactSensitiveData` was initially skipped as a "synchronous utility function" (RST-001)
4. **Function-level fallback activated** for remaining functions:
   - `redactMessages`: Instrumented (1 span) — but missing tracer import
   - `applySensitiveFilter`: Instrumented (1 span) — but missing tracer import
   - `redactSensitiveData`: **Validation failed** — NDS-003 (×12) — agent mangled regex patterns

### Root Cause: redactSensitiveData NDS-003

The agent cannot produce a valid diff for `redactSensitiveData` without mangling the complex regex patterns in the `SENSITIVE_PATTERNS` array. The NDS-003 validator catches these changes as "original lines modified."

From the PR summary:
> skipped: redactSensitiveData — Validation failed: NDS-003, NDS-003, NDS-003, NDS-003, NDS-003, NDS-003, NDS-003, NDS-003, NDS-003, NDS-003, NDS-003, NDS-003 — NDS-003: original line 5 missing/modified: pattern: /(?:api[_-]?key|apikey|api_secret)['":\s=]*['""]?([a-zA-Z0-9_-]{20,})['""]?/gi

12 NDS-003 violations on a single function — the agent is systematically mangling every regex literal in the pattern array.

### Root Cause: Missing Tracer Import

Same bug as summary-graph.js. The function-level fallback adds `tracer.startActiveSpan()` to `redactMessages` (line 171) and `applySensitiveFilter` (line 232) without adding the module-level tracer initialization.

### Test Failure Breakdown

| Test File | Failures | Function Under Test |
|-----------|----------|-------------------|
| sensitive-filter.test.js | 5 | redactMessages (5) |
| sensitive-filter.test.js | 6 | applySensitiveFilter (6) |
| **Total** | **11** | |

### Orbweaver Issue Cross-References

| Issue | Relevance | Status |
|-------|-----------|--------|
| Run-3 #2 | Null parsed output has no diagnostics | **Resolved** — file now produces output |
| Run-4 #3 | Missing tracer import in function-level fallback | **New** — same as summary-graph.js |
| Run-4 #2 | Test failures don't trigger fix/retry | **New** — broken code committed |

### Assessment

**Significant improvement.** The null-output bug that blocked run-2 and run-3 is resolved. Two of three functions were instrumented. The remaining function (`redactSensitiveData`) is blocked by regex pattern mangling — a known limitation when LLMs process complex regex literals. This may require a targeted fix in the orbweaver agent (e.g., a "preserve regex" directive or a copy-paste-exact strategy for lines containing regex literals).

---

## Partial File #3: journal-manager.js

**Status:** Partial (1/3 functions, 0 spans)
**Test failures caused:** 0

### History

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Failed | NDS-003 — agent added business logic |
| Run-3 | Failed | NDS-003 (×5) + COV-003 (×3) — worse than run-2 |
| Run-4 | Partial | 1/3 functions processed (0 spans); 2/3 functions blocked by NDS-003 |

### What Happened in Run-4

1. **Whole-file instrumentation attempted** — the agent instrumented `saveJournalEntry` and `discoverReflections` with proper spans, attributes, and schema extensions
2. Agent explicitly avoided previous failure modes: "The previous instrumentation failure (NDS-003 triggered by `if (span.isRecording())`) was avoided by removing all isRecording() guards"
3. **Function-level fallback activated:**
   - `formatJournalEntry`: Instrumented (0 spans — correctly, it's a synchronous formatter)
   - `saveJournalEntry`: **Validation failed** — NDS-003 + COV-003 — "non-instrumentation line added at instrumented line 25: `if (commit.shortHash) {`"
   - `discoverReflections`: **Validation failed** — NDS-003 + COV-003 (×2) — "original line 1 missing/modified: `// Imports used by this function`"

### Root Cause

The agent consistently struggles with this file because instrumenting its two meaningful functions (`saveJournalEntry`, `discoverReflections`) requires changes that NDS-003 flags as non-instrumentation modifications:

1. **saveJournalEntry**: The agent added a conditional check (`if (commit.shortHash) {...}`) that the validator correctly flagged as business logic modification, not instrumentation
2. **discoverReflections**: The agent modified a comment line, which the validator flagged as an original line being changed

The whole-file approach produced valid instrumentation for both functions (with proper spans, attributes, and error handling), but the function-level fallback — which processes each function in isolation — couldn't produce valid diffs for either.

### Why 0 Test Failures

Unlike summary-graph.js and sensitive-filter.js, journal-manager.js's partial result produced no test failures because the only successfully instrumented function (`formatJournalEntry`) received 0 spans. No `tracer.startActiveSpan()` calls were added, so no `tracer` import was needed. The file is effectively unchanged.

### Orbweaver Issue Cross-References

| Issue | Relevance | Status |
|-------|-----------|--------|
| Run-3 #4 | NDS-003 should allow instrumentation-motivated refactors or escalate | **Persistent** — same root cause across all 3 runs |
| Run-3 #9 | Function-level instrumentation for large files | **Partially helped** — fallback activated but couldn't overcome NDS-003 |

### Assessment

**Marginal improvement.** The file went from "failed" to "partial" but gained no useful instrumentation. The core problem is unchanged: the agent needs to make small structural changes (adding conditionals, moving imports) to properly instrument this file, and NDS-003 blocks those changes. Three approaches could help:
1. Allow NDS-003 to accept "instrumentation-motivated" refactors (risk: scope creep)
2. Improve the agent's ability to add spans without modifying surrounding code
3. Accept that some files need manual instrumentation post-agent

---

## Rescued Files (For Completeness)

### journal-graph.js — Fully Rescued

| Run | Outcome |
|-----|---------|
| Run-2 | Failed — token budget exceeded (~94K) |
| Run-3 | Failed — oscillation (150K budget) |
| Run-4 | **Success** (4 spans) |

**What changed:** Function-level instrumentation (orbweaver #106) broke the file into individual functions, each well within token budget. The oscillation loop that plagued run-3 was completely avoided. 4 spans added covering the key LangGraph nodes.

### context-integrator.js — Fully Rescued

| Run | Outcome |
|-----|---------|
| Run-2 | Failed — NDS-003 (variable extraction) |
| Run-3 | Failed — NDS-003 (same) |
| Run-4 | **Success** (1 span) |

**What changed:** The agent found a way to instrument the function without the variable extraction that triggered NDS-003 in prior runs. The span was added wrapping the existing function body without restructuring.

---

## Test Failure Analysis

### Summary

- **32 total test failures**, all `ReferenceError: tracer is not defined`
- **2 source files** caused all failures: summary-graph.js (21) and sensitive-filter.js (11)
- **Single root cause**: function-level fallback code path omits tracer initialization at module scope

### Failure Discovery Timeline

The 32 failures were only discovered at end-of-run (after all 29 files were processed). No per-file validation caught the issue:

1. File 14 (summary-graph.js) — instrumented with broken `tracer` reference
2. Files 15-17 processed normally
3. File 18 (sensitive-filter.js) — same `tracer` reference bug
4. Files 19-29 processed normally
5. End-of-run test suite: 32 failures discovered

If a per-file static check (`node --check`) had run after file 14, the `tracer` bug would have been caught immediately and either retried or rolled back. Instead, 15 more files were processed before the issue was discovered.

### Orbweaver Issues for Test Failures

| Run-4 Issue | Description | Fix Priority |
|-------------|-------------|-------------|
| #2 | Test failures don't trigger fix/retry | High |
| #3 | Missing tracer import in function-level fallback | High |
| #4 | No per-file test or lint check after instrumentation | High |

---

## Cross-Run Trend Analysis

### Failure Mode Evolution

| Failure Mode | Run-2 | Run-3 | Run-4 |
|-------------|-------|-------|-------|
| Token budget exceeded | 1 file | 0 | 0 |
| Oscillation | 0 | 1 file | 0 |
| Null parsed output | 1 file | 1 file | 0 |
| NDS-003 (business logic) | 2 files | 2 files | 2 files (partial, not failed) |
| Missing tracer import | 0 | 0 | 2 files (new) |
| Test failures (end-of-run) | N/A | N/A | 32 |

### Orbweaver Fixes Verified in Run-4

| Fix | Evidence |
|-----|----------|
| Function-level fallback (orbweaver #106) | Rescued journal-graph.js from oscillation/budget failures |
| Null output diagnostics (run-3 #2) | sensitive-filter.js now produces output instead of null |
| Local PR summary (run-3 #13) | PR summary saved to `orbweaver-pr-summary.md` before push failure |

### Orbweaver Issues Still Open After Run-4

| Issue | Category | Runs Affected |
|-------|----------|---------------|
| NDS-003 blocks instrumentation-motivated refactors | Validator constraint | Run-2, Run-3, Run-4 |
| Missing tracer import in function-level fallback | Code generation bug | Run-4 (new) |
| No per-file validation after instrumentation | Validation gap | Run-4 (new) |
| Test failures don't trigger fix/retry | Validation gap | Run-4 (new) |
| Schema evolution broken (format mismatch) | Core architecture | Run-4 (new) |
| Regex pattern mangling in LLM output | Agent limitation | Run-2, Run-3, Run-4 |

---

## Non-File Failures (Run-Level)

Four failures occurred at the run level, independent of any specific file's instrumentation quality.

### 1. Push Failed — No PR Created

**Severity:** High
**Impact:** PR artifact not created on GitHub; evaluation of PR quality must use local `orbweaver-pr-summary.md` instead

The git push failed with an authentication error before the PR could be created:

```text
Push failed — skipping PR creation: Pushing to https://github.com/wiggitywhitney/commit-story-v2-eval.git
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/wiggitywhitney/commit-story-v2-eval.git/'
```

**Root cause:** Orbweaver uses HTTPS-based git push. The eval repo's GITHUB_TOKEN was validated at pre-run via `git ls-remote origin` (which succeeded), but `git ls-remote` uses a different auth path than `git push`. The token either expired during the 80-minute run or lacked push permissions.

**Mitigating factor:** The local PR summary (`orbweaver-pr-summary.md`, 106KB) was saved before the push attempt. This is orbweaver run-3 issue #13 (save PR summary locally) — confirmed fixed and valuable.

**Orbweaver issue cross-reference:** Run-3 #12 (validate GitHub token at startup). Pre-run validation passed, but push still failed — the validation check needs to verify push capability, not just read access.

**Process improvement:** Pre-run verification should do a test push (e.g., push an empty tag or use `git push --dry-run`) rather than relying on `git ls-remote`.

### 2. Schema Evolution Completely Broken

**Severity:** Critical
**Impact:** All 29 files received the identical base Weaver schema — no file saw extensions from previous files

Every schema extension proposed by the agent was rejected as "(unparseable)". The warnings accumulated across all 29 files, producing 16 nearly identical warning lines in the output:

```text
Warning: Schema extensions rejected by namespace enforcement: (unparseable): commit_story.context.collect
Warning: Schema extensions rejected by namespace enforcement: (unparseable): commit_story.context.collect, (unparseable): span:commit_story.git.execute, ...
[14 more cumulative warning lines]
```

**Root cause:** Format mismatch between agent output and parser. The agent outputs extension IDs as strings (`"commit_story.context.collect"`); `parseExtension()` expects YAML objects with an `id` field. Documented in detail as run-4 orb issue #1.

**Diagnostic signal:** The token usage revealed this failure before any code review. With 1M+ cache read tokens across 29 files and cost at 8.6% of ceiling, the prompt was clearly not changing between files — which is exactly what would happen if schema evolution were broken.

**Orbweaver issue cross-reference:** Run-4 orb issue #1 (schema evolution broken), #5 (warning output unreadable).

### 3. End-of-Run Test Suite Failed (32 failures)

**Severity:** High
**Impact:** PR creation blocked (even if push had succeeded); broken code committed to branch

The end-of-run test suite discovered 32 failures, all `ReferenceError: tracer is not defined`. Detailed in the Test Failure Analysis section above. Two source files (summary-graph.js, sensitive-filter.js) caused all 32 failures via the function-level fallback's missing tracer import bug.

**Key failure characteristic:** Tests ran only after all 29 files were processed. File 14 (summary-graph.js) introduced the bug; 15 more files processed before discovery at file 29. A per-file check would have caught this 80% earlier in the run.

**Orbweaver issue cross-reference:** Run-4 orb issues #2 (test failures don't trigger fix/retry), #3 (missing tracer import), #4 (no per-file validation).

### 4. Per-File Commit Failures for Zero-Span Files

**Severity:** Low (cosmetic)
**Impact:** Noisy output; no functional impact

10 zero-span files generated "Per-file commit failed: Nothing staged to commit" warnings in the output:

```text
Per-file commit failed for .../accessibility.js: Failed to commit src/generators/prompts/guidelines/accessibility.js: Nothing staged to commit
Per-file commit failed for .../anti-hallucination.js: Failed to commit src/generators/prompts/guidelines/anti-hallucination.js: Nothing staged to commit
[8 more similar lines]
```

**Root cause:** Orbweaver attempts a per-file git commit after each file is processed. For files where the agent correctly decides 0 spans are needed (pure data files, config, constant exports), no changes are made, so there's nothing to commit. The commit command fails and the error is logged.

**Why it matters:** These aren't real failures — the agent made the correct decision. But the error messages pollute the output and could confuse users or evaluators scanning for real problems. The 10 "failed" commits mixed in with real processing output makes it harder to spot actual issues.

**Orbweaver issue cross-reference:** Not yet filed. Should be added as a UX issue — orbweaver should skip the commit step for files with 0 changes, or log "skipped commit (no changes)" instead of "commit failed."

---

## Summary: All Failures by Category

### File-Level Partial Results (3)

| File | Root Cause | Orbweaver Issues |
|------|-----------|-----------------|
| summary-graph.js | Missing tracer import in function-level fallback | #3, #2, #4 |
| sensitive-filter.js | Missing tracer import + NDS-003 on regex-heavy function | #3, #2, #4 |
| journal-manager.js | NDS-003 blocks instrumentation of meaningful functions | Run-3 #4 |

### Run-Level Failures (4)

| Failure | Root Cause | Orbweaver Issues |
|---------|-----------|-----------------|
| Push failed (no PR) | HTTPS auth expired/insufficient during run | Run-3 #12 |
| Schema evolution broken | Format mismatch: string IDs vs YAML objects | #1, #5 |
| 32 test failures | Function-level fallback omits tracer import | #2, #3, #4 |
| 0-span commit noise | Commit attempted for files with no changes | New (not yet filed) |
