# Failure Deep-Dives — Run-16

**Run-16 result**: 10 committed, 3 failed, 3 partial, 14 correct skips.

Three full failures (context-capture-tool.js, reflection-tool.js, src/index.js) and three partials (journal-graph.js, commit-analyzer.js, summary-manager.js). Two new systemic failure modes emerged: function-level fallback token exhaustion (null parsed_output) and a function-level fallback NDS-005 bug.

---

## Run-Level Observations

### Push / PR — STABLE

Sixth consecutive successful push:
- `GITHUB_TOKEN present=true`
- `urlChanged=true, path=token-swap` (URL swap mechanism fired)
- PR #68 auto-created at https://github.com/wiggitywhitney/commit-story-v2/pull/68

### Live-Check JSON Blob (RUN16-2 — UX Bug)

At end of run, the live-check compliance report (3,615 advisory findings across 543 spans) was printed in full to terminal stdout. The report is machine-readable JSON intended for the scoring script — not for the user. It is correctly saved to disk at `spiny-orb-live-check-report.json` and should not also be emitted to stdout. This flooded the user's terminal.

**Fix needed**: suppress stdout emission of the live-check JSON report. Write to disk only.

### Null Parsed_Output Failure Mode (RUN16-1 — Systemic)

Four instrumentation calls failed with `stop_reason: max_tokens, raw_preview: <no text content>`. The model exhausted its entire token budget on adaptive thinking and produced zero structured JSON output. Affected:
- context-capture-tool.js (entire file): 20,200 tokens, budget ~20,100
- reflection-tool.js (entire file): 19,400 tokens, budget ~19,300
- summary-manager.js `generateAndSaveWeeklySummary`: 16,384 tokens (minimum budget)
- summary-manager.js `generateAndSaveMonthlySummary`: 16,384 tokens (minimum budget)

In all four cases `raw_preview: <no text content>` confirms the model response contained only thinking blocks with no output content. This failure mode did not appear in runs 9–15. Possible contributing factors: PRD #509 richer output format requiring more verbose reasoning; dependency-aware ordering (PRD #700) routing more complex files earlier; cumulative context pressure from 2.5 hours of prior file processing.

---

## File-Level Failures

### context-capture-tool.js — null parsed_output (Function-Level Fallback Token Exhaustion)

**Result**: FAILED, 3 attempts, 20,200 output tokens

**What happened**: The pre-scan correctly determined `registerContextCaptureTool` is synchronous and requires no LLM call. The function-level fallback then processed `saveContext` (unexported async I/O) — the one function requiring instrumentation. The LLM call for this single function exhausted its entire ~20,100 token budget on adaptive thinking, producing no structured output.

Agent thinking was correct and complete: identified `saveContext` as the target, chose `commit_story.context.save_context` span name, noted the CDQ-007 file path constraint, decided to skip the async inline callback per RST-004. The reasoning was sound — the model simply ran out of tokens before writing the JSON.

**Root cause**: Function-level fallback adaptive thinking budget exhaustion on a short file (~121 lines → minimum+1 budget ~20,100). The model's reasoning about MCP file patterns consumed the full budget.

**Impact**: `saveContext` has no span. All context capture tool invocations are invisible to telemetry.

**Fix needed**: Increase minimum token budget for function-level fallback calls that involve complex patterns (MCP/unexported async with no exported orchestrator). Alternatively, detect when thinking reaches 80% of budget and force output generation.

---

### reflection-tool.js — null parsed_output (Function-Level Fallback Token Exhaustion)

**Result**: FAILED, 3 attempts, 19,400 output tokens

**What happened**: Identical failure mode to context-capture-tool.js. The file structure is nearly identical (same MCP tool pattern: sync exported registration function + unexported async I/O function). The function-level fallback for `saveReflection` produced 19,400 tokens of thinking with no structured output, exhausting the ~19,300 token budget for a 113-line file.

Agent thinking (partial, from attempt 1): correctly identified `saveReflection` as the instrumentation target, noted `@traceloop/instrumentation-mcp` auto-instruments MCP protocol calls, planned to add entry date attribute. Reasoning was on track when tokens ran out.

**Root cause**: Same as context-capture-tool.js — minimum+1 budget for function-level fallback on a short MCP tool file.

**Impact**: `saveReflection` has no span. Reflection tool invocations invisible to telemetry.

**Fix needed**: Same as context-capture-tool.js.

---

### src/index.js — API Call Terminated

**Result**: FAILED, 0 output tokens

**What happened**: The Anthropic API connection was terminated before any response was received. src/index.js was the final file (file 30/30). No retries succeeded. The wall-clock elapsed time of 2h 36m overstates actual processing time — the laptop was closed for part of the run, and spiny-orb paused waiting for user input at the PROGRESS.md pre-push hook prompt before the final file. The API connection was likely terminated during one of these idle/suspended intervals.

**Root cause**: API connection terminated during a suspend/idle period (laptop closed or spiny-orb blocked on PROGRESS.md hook prompt). When the connection resumed, the in-flight API call had already expired server-side. Not a code or agent issue — src/index.js committed cleanly in runs 9–15 and the file is unchanged.

**Impact**: src/index.js has no instrumentation. The main CLI entry point is invisible to telemetry — the root span for every `node src/index.js` invocation is absent.

**Fix needed**: Retry on `terminated` error (same as retry on `overloaded_error`). A connection expiring during a long run or after a suspend is recoverable — a single transient failure at the last file should not produce a permanent miss. Separately: the PROGRESS.md hook prompt blocking spiny-orb mid-run (before file 30) contributed to the idle window; the hook should not fire during the instrument pipeline.

---

## File-Level Partials

### journal-graph.js — NDS-003 Oscillation on technicalNode

**Result**: PARTIAL, 3 spans committed, 1 function skipped, 3 attempts, 112.0K output tokens

**Committed**: summaryNode (1 span), dialogueNode (1 span), generateJournalSections (1 span)
**Skipped**: technicalNode — NDS-003 error count 1→5 (lines 29, 30, 54, 57, 31)

**What happened**: During fresh regeneration of technicalNode on attempt 3, the NDS-003 error count increased from 1 to 5. This is oscillation — the agent's fix for the initial violation introduced four additional violations. The five affected lines (29, 30, 54, 57, 31) are all within or adjacent to the span wrapper that wraps technicalNode's content, suggesting the agent restructured control flow in a way that modified multiple original lines simultaneously.

summaryNode and dialogueNode were committed correctly with the same Pattern A approach (existing graceful-degradation catch block becomes the span wrapper's try/catch, span.end() added in a new finally). The agent notes claim "no outer error-recording catch is needed" for all three nodes because the all-encompassing catch handlers mean no unexpected exception can bypass them. This is a valid NDS-007 application.

**Root cause**: NDS-003 oscillation on a complex LangGraph node function (technicalNode). The agent cannot stabilize the span wrapper around technicalNode without introducing code modifications that the NDS-003 validator rejects. This is the same oscillation pattern seen in run-15 for this file. The 1-attempt result from run-15 did not hold (back to 3 attempts, same partial result).

**Impact**: `generate_technical_decisions` span absent. Technical decisions LLM generation is unobservable in telemetry.

**Rubric note**: COV-001/COV-004 failure for technicalNode. Other rules assessed only on committed functions.

---

### commit-analyzer.js — NDS-005 Function-Level Fallback Bug

**Result**: PARTIAL, 0 spans, 3 attempts, 0.0K output tokens

**What happened**: Pre-scan correctly determined both functions (`isJournalEntriesOnlyCommit`, `shouldSkipMergeCommit`) are pure synchronous utilities — no LLM call made, no spans needed. The function-level fallback then ran (2/2 functions instrumented, 0 spans) and produced output. Reassembly validation failed with NDS-005: "Original try/catch block is missing from instrumented output."

The function-level fallback ran three times (3 attempts noted) despite the pre-scan finding no instrumentable functions and the fallback producing 0 spans. Each attempt produced output that was missing a try/catch block from the original source.

**Root cause**: Bug in the function-level fallback path for files that need zero spans. The fallback is modifying the file (stripping a try/catch block) when it should either: (a) pass through the original file unchanged, or (b) not run at all when the pre-scan found no instrumentable functions. The `isJournalEntriesOnlyCommit` or `shouldSkipMergeCommit` function body contains a try/catch that the fallback is removing during its re-assembly pass.

**Impact**: commit-analyzer.js was partially committed with a structural defect (missing try/catch). The `isJournalEntriesOnlyCommit` function silently loses error handling. NDS-005 failure prevents a clean commit.

**Fix needed**: Function-level fallback should skip re-assembly when no spans are added — the output should be identical to the input. This is a spiny-orb correctness bug.

---

### summary-manager.js — Partial null parsed_output + NDS-003

**Result**: PARTIAL, 7 spans committed, 2 functions skipped, 2 attempts, 105.7K output tokens

**Committed**: readDayEntries, saveDailySummary, generateAndSaveDailySummary, readWeekDailySummaries, saveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary (7 spans total)
**Skipped**: generateAndSaveWeeklySummary (null parsed_output), generateAndSaveMonthlySummary (null parsed_output)

**Null parsed_output on two functions**: Both failed with `stop_reason: max_tokens, output_tokens: 16384, raw_preview: <no text content>`. These two functions are among the most complex in the file — each invokes the summary-graph LLM pipeline and contains multiple inner graceful-degradation catch blocks. The function-level fallback's per-function budget (minimum 16,384 for short-to-medium functions) was exhausted on thinking before producing structured output.

**NDS-003 partial**: Reassembly validation found a missing line: `return { saved: false, reason: \`Summary already exists for ${dateStr}\` };` (original line 155). This early-return guard in one of the committed functions was dropped during the two-attempt re-assembly. The partial commit is flagged as using partial results.

**Impact**: `generateAndSaveWeeklySummary` and `generateAndSaveMonthlySummary` have no spans. Weekly and monthly summary generation entry points are missing from telemetry. The NDS-003 drop on line 155 means the "already exists" early-return path is absent from the committed code — a behavioral change.

**Fix needed**: Same minimum-budget issue as the MCP tool files, applied to per-function budgets within large files. Complex orchestration functions (multi-await, LLM calls inside) need a higher minimum than 16,384 even when they're short by line count.
