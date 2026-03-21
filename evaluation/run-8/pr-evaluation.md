# PR Artifact Evaluation — Run-8

## PR Status

**Push failed (6th consecutive)** — no GitHub PR created. PR summary saved locally.

## PR Summary Quality

| Metric | Run-8 | Run-7 Target | Result |
|--------|-------|-------------|--------|
| Length | 230 lines | <200 lines | FAIL (but improved from 331) |
| Per-file table accuracy | All 12+1+16 correct | Accurate | PASS |
| Span counts match branch | Verified correct | Match branch | PASS |
| Schema Extensions column | Present | Present | PASS (RUN7-8 fixed) |
| Agent notes | 3 per file + "... N more" | Compressed | PASS (RUN7-9 fixed) |
| Rule labels | Present on all codes | Human-readable | PASS (RUN7-2 fixed) |
| Advisory grouping | Individual but labeled | Grouped | PARTIAL |

## Advisory Analysis

Total advisory items: ~33

### CDQ-006 (isRecording Guard): ~20 items — ALL FALSE POSITIVES

All flag `.toISOString()`, `String(.length)`, or `String(count)` as "expensive computation." Per the rubric exemption clause: "Trivial type conversions are exempt: `toISOString()`, `String()`, `Number()`, `Boolean()`, `toString()`, and simple property access chains." These are O(1) operations and should not trigger CDQ-006 advisories.

### COV-004 (Async Operation Spans): ~8 items — MOSTLY FALSE POSITIVES

- 7 items flag sync functions (dailySummaryPrompt, monthlySummaryPrompt, buildGraph, filterMessages, etc.) as having "I/O library calls." These are pure sync functions with no async I/O — false positives.
- 4 items flag MCP tool callback handlers — debatable (async I/O exists inside sync registration functions).

### SCH-004 (No Redundant Schema Entries): 4 items — ALL FALSE POSITIVES

- `generated_count` vs `gen_ai.usage.output_tokens`: Different semantics (summary count vs token count)
- `week_label` vs `weeks_count`: Different semantics (string label vs number)
- `month_label` vs `months_count`: Same reasoning
- `reflections_count` vs `quotes_count`: Different semantics (discovery count vs entry content count)

### NDS-005 (Control Flow): 1 item — LIKELY FALSE POSITIVE

Claims original try/catch block at line 489 in index.js is missing. Per-file evaluation confirmed error handling preserved. Needs branch-level verification.

## Advisory Contradiction Rate

~30/33 advisories are incorrect (false positives): **~91% contradiction rate**

This is significantly worse than run-7's 23% and far from the <15% target. The primary driver is CDQ-006 flagging trivial conversions (~20 items). The CDQ-006 exemption clause needs to be implemented in the advisory system.

## Recommendations

1. **CDQ-006 exemption**: Add trivial conversion whitelist to the advisory heuristic
2. **COV-004 sync detection**: Don't flag sync functions as needing async spans
3. **SCH-004 similarity threshold**: Increase confidence threshold or add semantic check
