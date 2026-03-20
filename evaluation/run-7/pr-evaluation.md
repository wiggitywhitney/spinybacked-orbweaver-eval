# PR Artifact Evaluation — Run-7

**PR status**: Not created (push failed 5th consecutive run). Local summary at `spiny-orb-pr-summary.md`.
**Branch**: `spiny-orb/instrument-1774017389972`

## Evaluation Criteria

### 1. Per-File Table Accuracy: FAIL

12/13 files have accurate span counts. **auto-summarize.js claims 6 spans but has 3 `startActiveSpan` calls.** The Schema Extensions column for that file lists only 3 span names, contradicting its own Spans column. Total reported: 36 spans; actual: 33.

### 2. Tally Accuracy: PASS

Summary states "13 committed, 16 correct skips" — matches branch state exactly. Major improvement over run-6's "23 succeeded" inflation.

### 3. PR Summary Length: FAIL

**331 lines** (target: <200). Shorter than run-5/6's ~430 lines, but still 65% over target. Bulk of excess:
- Agent Notes section: 180 lines (compliance dump with per-rule checklists)
- Advisory Findings section: 46 lines (44 individual items)
- summarize.js notes alone: 66 lines for one file

### 4. Advisory Contradiction Rate: FAIL (23%)

10 of 44 advisory findings contradict agent skip decisions across 6 files. Some are genuine (context-capture-tool.js has async I/O in unexported function), others are analyzer false positives (prompt template functions flagged for "I/O library calls"). The summary presents both skip decisions and contradicting advisories without reconciliation — a reviewer must investigate each independently.

### 5. Schema Changes Section: PARTIAL PASS

Accurately lists all 9 new attributes. **Omits all 22 span extensions** — only shows "Registry Attributes > Added" with no span section. A reviewer wouldn't know how many new span types were registered.

### 6. Post-Validation Accuracy: PASS (with caveat)

Span names, statuses, and extension lists match committed code. Caveat: auto-summarize.js span count makes the table misleading even though listed names are correct.

### 7. Overall Quality: 3/5

**Strengths**: Accurate tally, useful per-file table with costs and libraries, span category breakdown, skip decisions with rule citations.

**Weaknesses**: 65% over length target, one span count error, unreconciled advisory contradictions, missing span extensions in schema changes, noisy CDQ-006 advisories (28 identical "isRecording guard" warnings).

## Run-6 → Run-7 PR Comparison

| Metric | Run-6 | Run-7 | Change |
|--------|-------|-------|--------|
| Tally accuracy | FAIL ("23 succeeded") | PASS (13 committed) | Fixed |
| Per-file accuracy | Unknown (no PR) | 12/13 correct | Near-accurate |
| Length | ~430 lines | 331 lines | -23% (still over target) |
| Advisory contradictions | 76% | 23% | Major improvement |
| Schema changes | N/A | Partial (attributes only) | Missing span extensions |
| Overall score | 2/5 | 3/5 | Improved |

## New PR Findings

### RUN7-7: auto-summarize.js span count inflated (6 claimed, 3 actual)

The per-file table claims 6 spans for auto-summarize.js but the branch has 3 `startActiveSpan` calls. The file's Schema Extensions column lists only 3 span names, contradicting its own Spans column. Likely a counting bug that includes spans from other files that reuse the same span names.

### RUN7-8: Schema Changes section omits span extensions

The PR summary's Schema Changes section shows only added attributes (9). It omits 22 span extensions that were written to agent-extensions.yaml. A reviewer can't assess schema evolution completeness without this.

### RUN7-9: Agent Notes section is a compliance dump (180 lines)

Per-file Agent Notes contain full rule-by-rule compliance checklists ("CDQ-001 satisfied", "CDQ-002 satisfied", etc.). This is internal validation output, not reviewer-oriented content. A reviewer needs: what was instrumented, why, and what was skipped. Not: which rules passed.

### RUN7-10: CDQ-006 advisories repeat identically 28 times

28 of 44 advisory findings are the same "isRecording guard" CDQ-006 warning for every `setAttribute` call using `.toISOString()` or `String()`. These should be grouped into a single note like "CDQ-006: 28 instances of optional isRecording guard omitted (advisory only)".
