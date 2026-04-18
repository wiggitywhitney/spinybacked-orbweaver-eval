# Run-4 PR Artifact Evaluation

**Date:** 2026-03-16
**PR created:** No — blocked by 32 test failures
**PR summary saved:** Yes — `orbweaver-pr-summary.md` (106KB, 399 lines)
**Branch pushed:** Yes (manually after run) — `orbweaver/instrument-1773627869602`

---

## Executive Summary

The PR was never created on GitHub because the end-of-run test suite failed (32 `ReferenceError: tracer is not defined` failures). Orbweaver correctly blocked PR creation as a quality gate. However, the local PR summary file (`orbweaver-pr-summary.md`) was saved to disk before the push attempt — confirming that orbweaver issue #13 from run-3 (save PR summary locally) is **verified fixed**.

The PR summary itself is a comprehensive document that would serve a reviewer well — detailed per-file tables, agent decision notes for every file, advisory findings, span category breakdowns, and schema extension tracking. The content quality is high. The delivery mechanism failed.

**Overall assessment:** The PR *content* is strong (would score well as a review document). The PR *delivery* failed due to broken instrumentation in 2 files causing test failures. The gap between "high-quality summary document" and "no PR created" is a significant UX problem.

---

## Evaluation Criteria

### 1. PR Delivery: Did the PR Get Created?

**Result:** No

The PR was blocked by 32 test failures, all caused by the same root bug: the function-level fallback path adds `tracer.startActiveSpan()` calls without adding the `tracer` import at module scope. Two files were affected:
- `summary-graph.js`: 17 direct + 4 downstream test failures
- `sensitive-filter.js`: 11 test failures

**Mitigation assessment:**
- **Orbweaver issue #12 (validate GitHub token at startup):** The pre-run verification confirmed credentials were valid for read access. However, push access was not verified, and the push failed 80 minutes later with "Invalid username or token." Issue #12 is partially fixed — startup validation exists but doesn't verify push capability.
- **Orbweaver issue #13 (save PR summary locally):** **Fully fixed.** The 106KB PR summary was saved to `orbweaver-pr-summary.md` before the push attempt. This is the artifact we're evaluating.

**New issue identified:** The CLI provides no end-of-run summary telling the user where to find artifacts (branch name, summary file path, how to view the diff). Already captured as orb issue #6.

### 2. PR Summary Structure

**Result:** Well-structured, comprehensive sections

| Section | Present | Quality |
|---------|---------|---------|
| Summary (tally) | Yes | Clear, accurate counts |
| Per-File Results table | Yes | All 29 files with status, spans, libraries, schema extensions |
| Span Category Breakdown | Yes | External calls, schema-defined, service entry points, total functions |
| Schema Changes | Yes | Shows registry version (0.1.0 → 0.1.0, unchanged due to schema evolution bug) |
| Review Attention | Yes | Flags 3 outlier files with above-average span counts |
| Advisory Findings | Yes | 34 findings with file, line number, and rule ID |
| Agent Notes | Yes | Detailed per-file reasoning for every file (19 entries, ~250 lines) |
| Token Usage | Yes | Ceiling vs actual breakdown |
| Live-Check Compliance | Yes | "OK" |
| Agent Version | Yes | "0.1.0" |
| Warnings | Yes | Schema extension rejection warnings (cumulative) |

### 3. Per-File Results Table

**Result:** Informative but has accuracy issues

**Strengths:**
- Every file listed with status, span count, libraries needed, and schema extensions
- Zero-span files explicitly shown (reviewer can verify skip decisions)
- Schema extensions listed per-file (enables cross-file consistency review)
- Libraries column shows which files triggered auto-instrumentation dependencies

**Accuracy issues:**
- **"Partial" status is misleading for 3 files.** The table reports `summary-graph.js` as "partial (12/12 functions)" with 6 spans, `sensitive-filter.js` as "partial (2/3 functions)" with 2 spans, and `journal-manager.js` as "partial (1/3 functions)" with 0 spans. In reality, none of these files' changes were committed to the branch — the function-level fallback output was never persisted. A reviewer seeing "partial" would expect the branch to contain some working instrumentation for those files. It doesn't.
- **No distinction between "on branch" and "in working directory during run."** The table conflates what the agent generated during the run with what actually exists in the deliverable branch.

### 4. Span Category Breakdown Table

**Result:** Useful but somewhat misleading

The table breaks down spans into "External Calls", "Schema-Defined", "Service Entry Points", and "Total Functions" columns. All spans in run-4 are classified as "Service Entry Points" (0 external calls, 0 schema-defined). This is accurate — the agent only added spans to entry-point functions.

However, the "Total Functions" column is valuable for coverage assessment: a reviewer can see that `journal-graph.js` has 4 spans out of 19 functions (21%), while `token-filter.js` has 3 spans out of 5 functions (60%). This enables quick restraint evaluation.

### 5. Advisory Findings

**Result:** Valuable, well-formatted, but noisy

34 advisory findings are listed with rule ID, file path, line number, and description. Categories:
- **COV-004** (24 findings): Functions with I/O that could benefit from spans but were skipped
- **CDQ-006** (7 findings): `isRecording()` guard suggestions for attribute computations
- **NDS-005** (2 findings): Potential try/catch preservation issues
- **CDQ-008** (1 finding): Tracer naming consistency confirmation (pass)

**Strengths:**
- Line numbers enable direct code review
- Rule IDs match the rubric, making cross-referencing easy
- Mix of "consider adding" (COV-004) and "potential issue" (NDS-005) findings

**Weaknesses:**
- The advisory system flagged 24 COV-004 findings (functions that could have spans). Most of these are correctly-skipped functions per RST-001/RST-004. A reviewer would need deep OTel knowledge to distinguish "correct skip, unnecessary advisory" from "genuine coverage gap."
- No severity or priority on advisory findings — they're all presented equally

### 6. Agent Notes

**Result:** Excellent — the strongest section of the PR summary

Per-file agent notes (19 entries for files that needed explanation) provide:
- **Why each function was/wasn't instrumented** with specific rubric rule citations (RST-001, RST-004, COV-004, NDS-003, etc.)
- **Schema extension rationale** — why new span names were created when existing schema had no match
- **Attribute selection reasoning** — why specific attributes were chosen, which were skipped, and why
- **Bug fix documentation** — explicit notes about NDS-003 and COV-003 fixes from prior validation failures
- **Known limitations** — e.g., `process.exit()` preventing span closure in index.js
- **Semantic precision** — e.g., explaining that `commit_story.filter.messages_after` maps to `filterStats.preserved` (messages kept after filtering)

This level of detail would enable a reviewer who knows nothing about OTel to understand and evaluate each decision. It's the most valuable section for merge decisions.

**Notable agent notes quality:**
- `journal-manager.js` documents silent catch blocks as intentional (file-not-found = expected control flow) and explains why OTel error recording was NOT added — showing restraint understanding
- `sensitive-filter.js` documents the NDS-003 regex preservation challenge from run-3
- `commit-analyzer.js` documents the NDS-003 tension: can't set `commit_story.commit.files_changed` without extracting a variable, which NDS-003 prohibits. Offers a `suggestedRefactor` instead.

### 7. Schema Changes Section

**Result:** Reveals the schema evolution bug clearly

The section shows:
- Baseline: 0.1.0
- Head: 0.1.0

No schema changes despite 29 files generating extensions. This is the clearest signal that schema evolution is broken — the versions are identical across the entire run. A reviewer would immediately flag this.

### 8. Warnings Section

**Result:** Cumulative warnings are unreadable

16 nearly-identical warning lines, each repeating the full cumulative list of rejected extensions with `(unparseable):` prefix. By file 29, the warning line contains 40+ extension IDs. This section is ~15KB of redundant text that buries the real information.

**What a reviewer would see:** A wall of text that says "schema extensions were rejected" but doesn't make it easy to understand why or what to do about it.

Already captured as orb issue #5 (accumulated schema extension warnings are unreadable).

### 9. Token Usage Section

**Result:** Diagnostic gold, but requires interpretation

The table shows:
- Cost: $5.84 actual vs $67.86 ceiling (8.6%)
- Cache read: 1,054,412 tokens (4x input tokens)

As documented in `lessons-for-prd5.md`, the low cost and high cache read ratio are a symptom of broken schema evolution — the prompt was identical across all 29 files because the schema never changed. A reviewer might celebrate the cost efficiency without realizing it indicates a bug.

**Missing context:** The token usage section doesn't explain what the ceiling means, how it was calculated, or what a healthy cost ratio looks like. A reviewer unfamiliar with orbweaver's architecture would have no way to interpret this.

---

## PR as a Review Tool: Would This Enable an Informed Merge Decision?

**If the PR had been created:** Yes, with caveats.

**Strengths for merge decisions:**
1. Per-file results table gives a quick tally — reviewer knows the scope immediately
2. Agent notes explain every skip/instrument decision with rubric citations — reviewer can spot-check reasoning
3. Advisory findings flag potential issues for human review with line numbers
4. Review Attention section highlights outlier files — focuses reviewer effort
5. Schema extensions per-file enable cross-file consistency checking

**Gaps for merge decisions:**
1. **No test results section.** When tests pass, the PR goes through. When they fail (as in run-4), there's no section explaining what failed, why, and which files are affected. The reviewer gets no PR at all.
2. **Partial status misleading.** A reviewer would see "partial (12/12 functions)" for summary-graph.js and think 12 functions were successfully instrumented. They weren't — the code crashes at runtime.
3. **No diff summary.** The PR summary describes what was done but doesn't include a condensed diff view. A reviewer must look at the full diff separately.
4. **Schema evolution failure is invisible.** The "Schema Changes" section shows 0.1.0 → 0.1.0, but doesn't flag this as a problem. The warnings section has the details but they're buried in cumulative noise.
5. **Warning section is unusable.** 16 lines of cumulative, near-identical text. A reviewer would skip it.

---

## Run-3 Orbweaver Issue Verification

| Issue | Description | Run-4 Outcome |
|-------|-------------|---------------|
| #12 | Validate GitHub token at startup | **Partially fixed.** Startup validation exists but checks read access only. Push failed 80 min later. |
| #13 | Save PR summary to local file | **Fixed.** 106KB summary saved to `orbweaver-pr-summary.md` before push attempt. |

---

## New Findings

### PR-Related Orbweaver Issues (Already Filed)

These were identified during earlier milestones and are already in `orb-issues-to-file.md`:

| Issue | Relevance to PR |
|-------|-----------------|
| #2 | Test failures don't trigger retry — broken code committed, blocks PR creation |
| #3 | Missing tracer import in function-level fallback — the direct cause of PR being blocked |
| #5 | Cumulative schema extension warnings are unreadable in PR summary |
| #6 | CLI output doesn't tell user where artifacts are after a failed PR attempt |
| #7 | Create draft PR even when tests fail (idea) |

### New PR-Specific Observations

1. **"Partial" status should distinguish "some functions instrumented, tests pass" from "instrumentation generated but never committed."** The PR summary reports partial files alongside successful ones with no visual distinction. A `committed: yes/no` column in the per-file table would make the branch state clear.

2. **Token usage section should include a health indicator.** When actual cost is <15% of ceiling, flag it as anomalous — it likely indicates broken schema evolution (the prompt should change between files, increasing cost).

3. **Advisory findings lack severity.** 34 findings presented equally makes it hard for a reviewer to prioritize. A severity column (e.g., "potential regression" for NDS-005 vs "optional enhancement" for COV-004) would help.

---

## Summary Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Delivery** | 0/1 | PR not created (test failures blocked it) |
| **Structure** | 1/1 | All expected sections present and well-organized |
| **Accuracy** | 0.5/1 | Partial status misleading; branch state vs run state conflated |
| **Reviewer enablement** | 0.75/1 | Agent notes excellent; advisory findings valuable; warnings unusable |
| **Self-awareness** | 0.5/1 | Advisory findings show quality introspection; schema evolution failure not flagged; token anomaly not flagged |
| **Overall** | 2.75/5 | High-quality content undermined by delivery failure and accuracy gaps |
