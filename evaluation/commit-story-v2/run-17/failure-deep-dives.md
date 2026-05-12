# Failure Deep-Dives — Run-17

**Run-17 result**: 10 committed, 4 failed, 1 partial, 15 correct skips. All failures driven by NDS-003.

---

## Run-Level Observations

### NDS-003 as the Dominant Story

Every failure and the partial in run-17 trace to NDS-003 (Code Preserved). This is a qualitative shift from run-16, where the dominant failure mode was token budget exhaustion. Two distinct NDS-003 failure flavors appeared:

| Flavor | Files | Mechanism |
|--------|-------|-----------|
| Content corruption | journal-graph.js | Agent dropped/modified characters inside complex expressions — subtle, not a line count issue |
| Reconciler gap | context-capture-tool.js, reflection-tool.js, index.js, summary-manager.js (partial) | Instrumentation is correct but NDS-003 reconciler can't verify the exact line shift from `startActiveSpan` wrapping |

### Regressions

Two files that committed in prior runs failed in run-17:
- **journal-graph.js**: partial in runs 14-16 → full failure (49 NDS-003) in run-17
- **index.js**: committed in prior runs → failed (2 NDS-003) in run-17

### Changed Failure Mode

Two files changed how they fail:
- **context-capture-tool.js**: token exhaustion (null parsed_output) in run-16 → NDS-003 oscillation in run-17
- **reflection-tool.js**: same

The RUN16-1 fix worked — budget exhaustion is gone. But the files now hit NDS-003 instead.

---

## File 11: journal-graph.js — ❌ FAILED (49 NDS-003, 2 attempts)

### Failure summary

49 NDS-003 violations across the file. 2 whole-file attempts, both failed. Regression from partial (3 spans committed) in runs 14-16.

### Root cause: content corruption in complex expressions

The debug dump reveals the agent modified the *content* of expressions, not just line counts. The clearest example is the template literal in `formatChatMessages` (original line ~227):

**Original:**
```javascript
return `{"type":"${type}", "time":"${time}", "content":"${escapeForJson(msg.content)}"}`;
```

**Agent's output:**
```javascript
return `{"type":"${type}", "time":"${time}", "content":"${escapeForJson(msg.content)}"`;
```

The closing `}` inside the template literal was dropped, making the JSON object unclosed. NDS-003 detects that the original line is no longer present verbatim. This is a single-character content change, not a line count shift.

Similar corruption appears at multiple locations throughout the 629-line file — the validator found 49 such violations.

### Affected original lines (partial — first 5 shown)

| Original line | Expected content | Type |
|--------------|-----------------|------|
| 72 | `      })` | Content modified in surrounding context |
| 228 | (in `formatChatMessages`) | Template literal content corrupted |
| 229-230 | Adjacent lines | Cascade from line 228 change |
| 290 | `2,` | Indented value |
| 401-404 | Multi-line `return` | Statement reformatted |
| 412-428 | `BANNED_WORD_REPLACEMENTS` array entries | Array entries reformatted |

### Why this is a regression from runs 14-16

Runs 14-16 had journal-graph.js as *partial* (3 spans committed, technicalNode failing). In those runs the whole-file output passed enough NDS-003 checks to commit. Run-17's failure is categorical — 49 violations means the agent made systematic changes throughout the file.

**Hypothesis**: The 65% thinking budget cap (PR #852, `Math.floor(max_tokens * 0.65)`) may not leave sufficient thinking time for a 629-line file with complex inline expressions. With adaptive thinking (uncapped), the model could reason carefully through every character. With a 65% cap, the model may be producing output before fully verifying all line-level details.

### Impact

- COV-001 (generate functions), COV-003, NDS-003, NDS-005 all impacted
- 0 spans committed
- journal-graph.js functions unobservable in telemetry for the 4th consecutive run

---

## File 18: context-capture-tool.js — ❌ FAILED (NDS-003 oscillation, lines 124-125, 3 attempts)

### Failure summary

NDS-003 oscillation: attempts 2 and 3 both fail with the same 2 violations at lines 124-125 of the instrumented output. Changed failure mode from run-16 (was token exhaustion).

### Root cause: NDS-003 reconciler gap for startActiveSpan + server.tool() nesting

The agent produced correct instrumentation — `saveContext` was wrapped with `tracer.startActiveSpan`:

```javascript
async function saveContext(text) {
  return tracer.startActiveSpan('commit_story.context.save_context', async (span) => {
    try {
      const now = new Date();
      // ... original body, now indented 4 more spaces ...
      span.setAttribute('commit_story.journal.file_path', filePath);
      return filePath;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

The agent also added an OTel import (line 12) and tracer init (line 20), adding approximately 3 new lines before the function.

**The instrumented file is semantically correct.** The violation is in the reconciler's accounting.

Lines 124-125 of the debug dump contain the catch block return statement inside `server.tool()`:
```text
124:         return {
125:           content: [
```

These are original lines (content is identical), but shifted by ~13 positions from their original location (due to import addition + startActiveSpan wrapper additions). The NDS-003 reconciler's offset calculation for this specific pattern — `startActiveSpan` wrapping inside an `async function`, itself called from inside a `server.tool()` callback — produces an off-by-one that prevents the reconciler from correctly matching lines 124-125 to their original positions.

The oscillation: attempt 2 produced this specific mismatch. Attempt 3 fresh-regenerated but landed on the same structure (the agent's approach is correct, so it regenerates the same thing), producing the same unresolvable mismatch.

### Why this changed from run-16

In run-16, budget exhaustion occurred before any structured output was produced. The RUN16-1 fix (enabled + budget_tokens cap) resolved the exhaustion — the model now produces structured output. But the output hits this reconciler gap instead.

### Spiny-orb issue

This is a spiny-orb NDS-003 reconciler gap, not an agent error. The agent's instrumentation is correct. The reconciler needs to handle `startActiveSpan` wrapping inside nested async callbacks (specifically the `server.tool()` handler pattern).

---

## File 19: reflection-tool.js — ❌ FAILED (NDS-003 oscillation, lines 116-117, 3 attempts)

### Failure summary

Identical pattern to context-capture-tool.js. Same root cause.

### Root cause

`saveReflection` was wrapped with `startActiveSpan` — same pattern as `saveContext` in context-capture-tool.js. Same file structure (113 lines, `server.tool()` callback, inner catch block). Lines 116-117 of the instrumented output are the catch block's `return {` / `content: [` — NDS-003 reconciler off-by-one, same unresolvable oscillation.

The instrumented code in the debug dump is semantically correct: span placed on `saveReflection`, correct try/catch/finally, OTel import added.

### Spiny-orb issue

Same reconciler gap as context-capture-tool.js. The `server.tool()` + `startActiveSpan` nesting pattern appears twice in this codebase and consistently hits the same gap.

---

## File 30: index.js — ❌ FAILED (2 NDS-003, line 217, 3 attempts)

### Failure summary

2 NDS-003 violations. 3 attempts. New failure — index.js committed in prior runs. The agent's thinking block shows it identified the issue (multi-line imports and filter chains) and attempted to restore them in attempt 3, but still produced 2 residual violations.

### Root cause: reconciler off-by-one for span additions in main()

The agent added `import { trace, SpanStatusCode }` to the imports and a span on `main()`. These additions shift all subsequent lines. With only 2 violations (not 49), the reconciler handles most shifts correctly but has an off-by-one for lines 217 and one other position.

Original line 217: `    console.error(\`\\n❌ ${parsed.error}\\n\`);`

The debug dump at line 217 shows `    return fallback;` — content from `getPreviousCommitTime`, a function well before `handleSummarize`. This indicates the reconciler is miscounting the added lines by a small amount, causing a lookup in the wrong function's body.

### Evidence from agent thinking

The agent's thinking block (visible in the verbose log) shows it correctly identified the problem:
> *"The imports need to be expanded across multiple lines, which would shift all subsequent line numbers down... the filter chains for daily, weekly, and monthly counts need to be restored... I need to figure out where those mysterious `);` and `},` issues are coming from."*

The agent understood the issue but the final output still had 2 residual violations after 3 attempts.

### Why this is a regression from prior runs

In prior runs, index.js was successfully committed. The span addition to `main()` is a new instrumentation in run-17. The specific lines that fail (217) weren't a problem in prior runs because the agent was not adding span code that shifted those positions. Run-17 added span code to `main()`, and the reconciler's off-by-one calculation for those specific line positions became visible.

---

## Partial: summary-manager.js — ⚠️ PARTIAL (6 spans, 3 functions skipped)

### Functions skipped

| Function | Violation | Location |
|----------|-----------|----------|
| generateAndSaveDailySummary | NDS-003 oscillation (×6) at lines 13-17 | Function-level fallback |
| generateAndSaveWeeklySummary | NDS-003 (×11) at line 13 | Function-level fallback |
| generateAndSaveMonthlySummary | NDS-003 (×11) at line 13 | Function-level fallback |

### Root cause: function-level fallback + startActiveSpan in multi-parameter function signatures

The function-level fallback extracts each function individually. Within the extracted function context, "line 13" refers to a position inside the function's code block. The NDS-003 violations at line 13 — "original line 13 missing/modified: `export async function generateAndSaveWeeklySummary(`" — indicate the function signature itself is being flagged.

These are large functions (~100+ lines each) that make multiple async LLM calls. The `startActiveSpan` wrapping adds lines to the function body, and the function signature's multi-line form (the function declaration spans multiple lines due to the parameter list) is where the reconciler fails.

The oscillation on `generateAndSaveDailySummary` (6 violations at lines 13-17) confirms the reconciler can't resolve the shift across 3 consecutive lines at the top of the function.

### Changed failure mode from run-16

In run-16: `generateAndSaveWeeklySummary` and `generateAndSaveMonthlySummary` failed with token exhaustion. `generateAndSaveDailySummary` was not specifically flagged in run-16 (it may have been a different failure path).

In run-17: all three produce structured output (RUN16-1 fix confirmed working) but hit NDS-003 in the function-level fallback's validation.

---

## Cross-File Hypothesis: Thinking Budget Cap and NDS-003 Correlation

**Observation**: journal-graph.js and index.js were committed in prior runs (before PR #852's thinking budget cap). They both fail with NDS-003 in run-17 after the cap was introduced.

**Hypothesis**: The `Math.floor(max_tokens * 0.65)` thinking budget is sufficient for most files but may be too tight for:
- Large files with many complex inline expressions (629-line journal-graph.js)
- Files processed late in a run when context has grown (index.js is file 30/30)

With uncapped adaptive thinking, the model could reason longer about preserving exact content. With the 65% cap, it may prioritize structure over character-level fidelity in complex expressions.

**Note**: This is a hypothesis. The reconciler gap (context-capture-tool.js, reflection-tool.js pattern) is a separate spiny-orb issue that would occur regardless of thinking budget. The content corruption in journal-graph.js and the residual index.js violations are where the budget hypothesis is most relevant.

**Suggested spiny-orb investigation**: Compare journal-graph.js and index.js NDS-003 rates across runs before and after PR #852, with attention to whether the failures are content-level (dropped characters, as seen here) vs. structural (line count shifts). If content-level, the budget cap is the likely cause.

---

## Advisory Pass Rollback — Open Question

Whitney raised a question about whether the advisory improvement pass correctly rolls back to the "prior passing file" when the improvement re-validation fails blocking checks. The four run-17 failures never reached the advisory pass (all failed initial blocking checks). However, the rollback path is worth the spiny-orb team auditing — see `lessons-for-prd18.md` for the verification ask.
