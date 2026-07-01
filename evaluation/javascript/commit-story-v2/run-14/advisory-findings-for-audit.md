# Advisory Findings — Run-14 (For PRD #483 Advisory Rules Audit)

Run-14 is the first eval run reflecting the current state of spiny-orb (post all P1 fixes from run-13, plus SCH-005 LLM judge from PRD #431). Advisory findings below represent what the current implementation produces on commit-story-v2.

**Hard data only.** Each row: rule ID, exact finding text from the PR summary, TP/FP classification based on domain knowledge of the codebase.

---

## Advisory Findings

| Rule | Exact finding text (from PR summary) | TP/FP | Notes |
|------|--------------------------------------|-------|-------|
| SCH-004 | `commit_story.summarize.generated_count` at line 260 appears to be a semantic duplicate of `commit_story.context.messages_count`. Judge confidence: 72%. | **FP** | `generated_count` counts successfully generated summaries (output of a batch summarize operation). `messages_count` counts Claude chat messages in the context window. Different domains, different semantics. |
| COV-004 | `handleSummarize` (async function) at line 208 in `src/index.js` has no span. | **Contextually invalid** | `src/index.js` is a correct skip — the agent correctly identified that all code paths call `process.exit()`, making span.end() impossible (CDQ-001 block). The COV-004 finding is technically accurate (no span) but missing the CDQ-01 constraint that makes the span impossible to add. |
| CDQ-006 | `setAttribute` value `entryPath.split('/').pop()` at line 187 in `src/managers/journal-manager.js` has an expensive computation without `span.isRecording()` guard. | **FP** | `.split('/').pop()` on a file path string is a trivial string operation (< 1μs). The CDQ-006 exemption explicitly covers operations "whose cost is negligible" — this qualifies. Not a genuine performance concern. |
| COV-004 | `saveContext` (async function) at line 69 in `src/mcp/tools/context-capture-tool.js` has no span. | **Partially valid** | `saveContext` is an *unexported* function. RST-004 exemption applies to unexported I/O functions (no spans required). The advisory is advisory rather than canonical for this reason. The function does perform I/O that could be useful to observe. |
| COV-004 | `saveReflection` (async function) at line 65 in `src/mcp/tools/reflection-tool.js` has no span. | **Partially valid** | Same as above — `saveReflection` is unexported. RST-004 exemption applies. Advisory, not canonical. |
| CDQ-008 | All tracer names follow a consistent naming pattern. | **TP** | All 12 instrumented files use `trace.getTracer('commit-story')`. Correct finding. |

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total advisory findings | 6 |
| True positives (correct, actionable) | 1 (CDQ-008) |
| False positives (incorrect finding) | 2 (SCH-004, CDQ-006) |
| Contextually invalid (technically accurate, missing constraint) | 1 (COV-004 on index.js) |
| Partially valid (real signal, wrong severity) | 2 (COV-004 on unexported functions) |
| Contradiction rate (clearly incorrect / non-trivial) | 2/5 = **40%** |

---

## Comparison to Prior Runs

| Run | Advisory Contradiction Rate | Primary False Positive Source |
|-----|-----------------------------|-------------------------------|
| Run-11 | ~45% | SCH-004 semantic hallucination, CDQ-006 exemption ignored |
| Run-12 | 44% | SCH-004 (4 FPs), CDQ-006 (1 FP) |
| Run-13 | 67% | SCH-004 (4 FPs on week_label, month_label, force, date_count) |
| **Run-14** | **40%** | SCH-004 (1 FP on generated_count vs messages_count), CDQ-006 (1 FP) |

The SCH-004 false positive volume dropped from 4 (run-13) to 1 (run-14). The SCH-004 namespace pre-filter fix (#440 + PR #480) is working. One SCH-004 false positive remains — the judge is still misidentifying semantic similarity between attributes in different domains.

CDQ-006 continues to flag trivial string operations despite the explicit exemption. The exemption language ("O(1) operations whose cost is negligible") is not being honored by the judge.
