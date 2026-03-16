# Evaluation Run-4 Findings — Handoff to SpinybackedOrbWeaver

**From:** commit-story-v2-eval (evaluation run-4, 2026-03-16)
**To:** SpinybackedOrbWeaver maintainer AI
**Run score:** 58% strict, 73% methodology-adjusted + schema split (19/26 quality rules pass, 4/5 gates pass)
**Files processed:** 29 JavaScript files in commit-story-v2

---

## What This Document Is

This is a **recommendation document**, not a list of confirmed bugs. The evaluation AI analyzed the orbweaver agent's output against a 32-rule rubric and identified 13 findings. Your job is to:

1. **Verify each finding** against the current spinybacked-orbweaver codebase
2. **Confirm or reject** the root cause analysis — the eval AI doesn't have deep orbweaver codebase knowledge
3. **Right-size each finding** — what looks like a PRD from outside may be a simple fix from inside (or vice versa)
4. **File what's real** — create PRDs or GitHub issues only for verified findings

Some findings may reference code that's already been changed. Some root cause analyses may be wrong. Trust your knowledge of the orbweaver codebase over the eval AI's inference.

## How to Read Evidence Files

All evidence files are on the same local machine. Use absolute paths to read them directly.

**Evidence directory:** `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/`

| File | What It Contains |
|------|-----------------|
| `per-file-evaluation.json` | Canonical per-file evaluation data — the source of truth for all per-file claims |
| `rubric-scores.json` | Canonical rubric scoring — source of truth for all rule-level claims |
| `failure-deep-dives.md` | Root cause analysis for each failed/partial file |
| `orb-findings.md` | Full findings with acceptance criteria (this doc is a summary of that) |
| `actionable-fix-output.md` | Fix instructions organized by priority |
| `baseline-comparison.md` | Run-4 vs run-3 vs run-2 comparison |
| `pr-evaluation.md` | PR artifact quality assessment |
| `lessons-for-prd5.md` | Rubric gaps, process improvements, methodology observations |

**Orbweaver branch with instrumented code:** `orbweaver/instrument-1773627869602` (local branch in commit-story-v2-eval repo — not pushed to GitHub due to auth failure)

**Target codebase (what was instrumented):** `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/` (main branch)

---

## Priority Summary

| Priority | Count | Impact |
|----------|-------|--------|
| Critical (infrastructure) | 2 | Block run-5 value proposition |
| High (reach 85% target) | 3 | Three specific fixes push quality from 73% to 85% |
| Medium (genuine findings) | 4 | Real improvements with clear fixes |
| Low (UX polish) | 4 | Output quality and ergonomics |

---

## Critical Infrastructure (2 findings)

These block the entire evaluation pipeline's value. Fix before run-5.

### Finding #1: Schema Evolution Broken — Extensions Never Written to Registry

**Eval AI's root cause theory:** Format mismatch between agent output and parser. Agent outputs `schemaExtensions` as string IDs (e.g., `"commit_story.context.collect"`); `parseExtension()` expects YAML objects with an `id` field. A bare string parses as a YAML string, fails the `typeof parsed === 'object'` check, returns `null` → `(unparseable)`.

**Code locations to verify:**
- `src/coordinator/schema-extensions.ts` — `parseExtension()` function
- Agent prompt spec — what format does it instruct for `schemaExtensions`?
- `agent-extensions.yaml` — should be written after first file; was it?

**Evidence to read:**
- `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/rubric-scores.json` → `failure_classification` entries for SCH-001 and SCH-002 (both `"category": "schema_evolution_dependency"`)
- `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/rubric-scores.json` → `schema_coverage_split` section — shows 0 extensions registered
- `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/orb-findings.md` → Finding #1 (full acceptance criteria)

**Impact:** All 29 files received the identical base schema. No cross-file naming consistency. 8/37 span names deviate. 11 ad-hoc attributes never registered. SCH-001 and SCH-002 both fail.

**Eval AI's recommended action:** PRD (design decisions needed: change prompt format, change parser, or both)

---

### Finding #2: Validation Pipeline — No Per-File Checks, No Fix/Retry

**Eval AI's root cause theory:** Three gaps: (a) function-level fallback path adds `tracer.startActiveSpan()` without adding `tracer` import at module scope; (b) test suite runs only after all 29 files, not per-file; (c) test failures don't trigger fix/retry — broken code committed as "partial."

**Code locations to verify:**
- Function-level fallback path — wherever individual functions are instrumented vs whole-file
- `tracer` initialization boilerplate — does the whole-file path add it? Does the function-level path?
- End-of-run test execution — where is `npm test` invoked?
- Failure handling — what happens when tests fail?

**Evidence to read:**
- `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/per-file-evaluation.json` → `per_run.NDS-002` — 32 test failures, all ReferenceError
- `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/failure-deep-dives.md` — full root cause analysis for summary-graph.js and sensitive-filter.js
- `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/orb-findings.md` → Finding #2 (full acceptance criteria with 3 sub-findings)

**Impact:** NDS-002 gate failure. 32 test failures. Broken code in working directory (not committed to branch).

**Eval AI's recommended action:** PRD (tiered validation strategy design)

---

## High Priority — Three Fixes to Reach 85% (3 findings)

Under adjusted scoring (73%), fixing these 3 pushes to 85% (22/26).

### Finding #9: Tracer Name Defaults to 'unknown_service'

**Eval AI's claim:** All 16 instrumented files use `trace.getTracer('unknown_service')` instead of `trace.getTracer('commit-story')`.

**Code locations to verify:**
- Agent prompt — what does it tell the agent to use as the tracer name?
- Does the agent have access to `package.json#name`?
- Is 'unknown_service' a hardcoded default somewhere?

**Evidence to read:**
- `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/rubric-scores.json` → `quality_rules.CDQ-002`
- Verify by grepping the orbweaver branch: `git diff main..orbweaver/instrument-1773627869602 -- '*.js' | grep "getTracer"` (in the eval repo)

**Eval AI's recommended action:** Issue (low complexity — prompt/config fix)

---

### Finding #3: Expected-Condition Catch Blocks Recorded as Errors

**Eval AI's claim:** 3 files have `catch {}` blocks (used for ENOENT file-not-found control flow) changed to `catch (err) { span.recordException(err); span.setStatus({ code: SpanStatusCode.ERROR }); }`. OTel setStatus is a one-way latch.

**Code locations to verify:**
- Agent prompt — does it have guidance about expected-condition catches?
- Does the agent distinguish `catch {}` (silent/expected) from `catch (err) { /* handle */ }`?

**Evidence to read:**
- `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/rubric-scores.json` → `quality_rules.NDS-005`
- `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/per-file-evaluation.json` → search for `NDS-005` in per_file entries for summarize.js, summary-manager.js, summary-detector.js
- `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/orb-findings.md` → Finding #3

**Eval AI's recommended action:** Issue (agent prompt guidance)

---

### Finding #13: index.js Missing Root Span on main()

**Eval AI's claim:** CLI entry point `main()` has no root span. Only sub-paths (summarize, journal-generate) are spanned. Regression from run-3 where main() had a `commit_story.generate_journal_entry` span.

**Evidence to read:**
- `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/rubric-scores.json` → `quality_rules.COV-001`
- Verify by checking the orbweaver branch diff for `src/index.js`

**Eval AI's recommended action:** Issue (low complexity — agent should always span entry points)

---

## Medium Priority (4 findings)

### Finding #12: Over-Instrumentation of Pure Synchronous Functions

**Claim:** `token-filter.js` has spans on `truncateDiff()` and `truncateMessages()` — pure sync data transformations with no I/O, called from a parent that already has a span.

**Evidence:** `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/rubric-scores.json` → `quality_rules.RST-001`

**Eval AI's recommended action:** Issue (agent prompt guidance — "exported" ≠ "instrumentable")

---

### Finding #10: Span Naming Inconsistency Across Files

**Claim:** 8/37 span names deviate from `commit_story.*` convention. Uses `context.*`, `mcp.*`, `summary.*` prefixes instead. Correlates with file processing order — later files deviate more.

**Root cause theory:** Without schema evolution (Finding #1), each file's agent invocation has no visibility into what span names previous files used.

**Evidence:** `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/rubric-scores.json` → `quality_rules.SCH-001` and `schema_coverage_split.SCH-001`

**Eval AI's recommended action:** Issue (partially depends on Finding #1 fix)

---

### Finding #6: Create Draft PR Even When Tests Fail

**Claim:** When end-of-run tests fail, orbweaver skips PR creation entirely. A draft PR would keep the diff, agent notes, and findings in one reviewable place.

**Evidence:** `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/pr-evaluation.md` → Section 1

**Eval AI's recommended action:** Issue (with design decision — draft PR behavior)

---

### Finding #7: LOC-Aware Test Cadence

**Claim:** Tests run only at end of run. A file that changes 5 lines gets the same validation as one changing 200 lines. Larger diffs are more likely to introduce bugs.

**Evidence:** `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/failure-deep-dives.md` → Test Failure Analysis section

**Eval AI's recommended action:** Issue (consider grouping with Finding #2)

---

## Low Priority (4 findings)

### Finding #4: Schema Extension Warnings Unreadable

**Claim:** Warnings section repeats cumulative extension list for every file. By file 29, each line has 40+ IDs repeated.

**Evidence:** `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/pr-evaluation.md` → Section 8

**Recommended action:** Issue (deduplicate warnings)

---

### Finding #8: Skip Commit for Zero-Change Files

**Claim:** 10 zero-span files generated "Per-file commit failed: Nothing staged to commit" errors.

**Evidence:** `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/orb-findings.md` → Finding #8

**Recommended action:** Issue (skip commit when no changes)

---

### Finding #11: Unused OTel Imports on Zero-Span Files

**Claim:** `monthly-summary-prompt.js` got OTel imports and tracer initialization despite receiving 0 spans.

**Evidence:** `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/per-file-evaluation.json` → `zero_span_files["src/generators/prompts/sections/monthly-summary-prompt.js"]`

**Recommended action:** Issue (clean up imports when 0 spans)

---

### Finding #5: CLI Output Doesn't Show Artifact Locations

**Claim:** After a run ends, the CLI doesn't tell users where to find the PR summary, branch name, or diff command.

**Evidence:** `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/pr-evaluation.md` → Section 1

**Recommended action:** Issue (add end-of-run summary block)

---

## Additional Context

### Run-3 Issues Status

11 issues were filed from run-3. Of those: 4 verified fixed (#1 token budget improved, #2 null output, #9 function-level fallback, #13 local PR summary), 3 persistent (#3 zero-span reasons, #4 NDS-003 policy, #12 push validation), 2 N/A (#6 and #8 — no oscillation in run-4), 1 not tested (#5 multiple paths), 1 partial (#7 test suite — end-of-run only).

Full assessment: `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/actionable-fix-output.md` → Section 6

### Score Context

The 85% target requires fixing findings #3, #9, and #13. The 92% stretch requires additionally fixing #10 and #12. See `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval/evaluation/run-4/actionable-fix-output.md` → Section 9 for full score projections.

### What the Eval AI Got Wrong Before

Run-3 predicted "fresh build → ~85%." Actual result was 58% strict because new files introduced new failure classes. Take score projections with appropriate skepticism — the orbweaver AI's assessment of fix complexity and blast radius will be more accurate than the eval AI's.
