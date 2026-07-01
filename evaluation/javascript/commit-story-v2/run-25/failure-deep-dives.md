// ABOUTME: Run-25 failure analysis — one partial (summary-manager.js), zero failures.
# Failure Deep-Dives — Run-25

**Run-25 result**: 13 committed, 0 failed, 1 partial (summary-manager.js), 17 correct skips.

---

## Run-Level Observations

### RUN24-1: CDQ-001 — `process.exit()` Bypasses `span.end()` — CONFIRMED FIXED

**Status**: FIXED (spiny-orb commit 91e9413 — `fixProcessExitSpanEnd()` AST auto-fix)

In run-24, `process.exit()` was called inside the `startActiveSpan` callback for `main()`, bypassing the `finally { span.end() }` block and dropping the `commit_story.index.main` span. The CDQ-001 auto-fix restructured the call site.

Run-25 committed code (src/index.js):
```javascript
// After the fix — process.exit() is OUTSIDE the span callback:
main().then((exitCode) => {
  process.exit(exitCode ?? EXIT_SUCCESS);
}).catch((error) => {
  logger.error(error, 'Unexpected error');
  process.exit(EXIT_ERROR);
});
```

The `main()` function now uses `return EXIT_CODE` statements inside the `startActiveSpan` callback instead of direct `process.exit()` calls. By the time `.then((exitCode) => process.exit(exitCode))` executes, the `finally { span.end() }` block has already run. CDQ-001 is resolved.

**Side effect — +1 span**: The run-25 agent also instrumented the `handleSummarize` subcommand path with a separate `commit_story.journal.handle_summarize` span, bringing index.js from 1 span (run-24) to 2 spans. This is a legitimate expansion of coverage.

### RUN24-2: SCH-003 — `diff_lines` Integer/String Type Mismatch — NOT TRIGGERED

**Status**: NOT TRIGGERED — agent omitted `diff_lines` entirely

In run-24, git-collector.js declared `commit_story.git.diff_lines` as `type: string` in schema extensions but set it with `lines.length` (an integer), triggering SCH-003. The spiny-orb SCH-003 backstop (commit 91e9413 — `fixAttributeTypeCoercions()`) auto-wraps integers in `String()` for string-declared attributes.

In run-25, the agent made an independent design choice to not include `diff_lines` at all:

> "getCommitDiff does not set a diff-size attribute because diff content is an unbounded external string. The span still carries vcs.ref.head.revision as its input attribute, satisfying COV-005."

The SCH-003 backstop was not exercised for this file. The 3 schema extension attributes git-collector.js declared in run-25 are: `commit_story.git.command` (string), `commit_story.git.parent_count` (int), `commit_story.git.is_merge` (boolean). These are all correctly typed.

**Implication for spiny-orb**: The SCH-003 backstop auto-fix has not been confirmed working against a real case yet. It may be exercised in a future run on a different file.

---

## Partial File: summary-manager.js

**Outcome**: 7 spans committed (of 9 possible), 2 functions skipped — `readWeekDailySummaries` and `readMonthWeeklySummaries`.

**Note**: No debug dump exists for this file. Debug dumps are only written for `status: 'failed'` results; partial files don't get one. The agent's instrumentation attempt for the 2 skipped functions is not recoverable without re-running spiny-orb. The root cause below was reconstructed from the validator error messages in `spiny-orb-output.log` and the original source. See `lessons-for-prd26.md` for a proposed spiny-orb fix to save debug dumps for partial files.

**Validator errors**:
```text
readWeekDailySummaries: skipped — Validation failed: COV-003
  COV-003 check failed: catch block at line 34 does not record error on span.
  Add span.recordException(error) and span.setStatus({ code: SpanStatusCode.ERROR })
  in catch blocks to ensure errors are visible in traces.

readMonthWeeklySummaries: skipped — Validation failed: COV-003, COV-003
  COV-003 check failed: catch block at line 26 does not record error on span.
```

### Root Cause: COV-003 Validator Over-Classification of Conditional-Rethrow Catches

Both functions contain inner loop catch blocks with the graceful-degradation pattern:

```javascript
// readWeekDailySummaries — inner loop (iterates over week days):
try {
  const content = await readFile(dailyPath, 'utf-8');
  if (content && content.trim()) {
    summaries.push({ date: dateStr, content: content.trim() });
  }
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
  // ENOENT: no daily summary for this day — skip
}

// readMonthWeeklySummaries — inner loop catch:
try {
  const content = await readFile(join(weeklyDir, file), 'utf-8');
  if (content && content.trim()) {
    summaries.push({ weekLabel, content: content.trim() });
  }
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
  // ENOENT: skip this file
}
```

Semantically, both catches are graceful-degradation catches:
- ENOENT path → file doesn't exist → skip silently (normal, expected)
- Non-ENOENT path → unexpected error → rethrow to parent span, which records it

These match the NDS-007 definition: the catch handles expected control flow (file not found = skip) and re-throws genuine errors to the parent span's error handler.

**Validator behavior** (`isExpectedConditionCatch` in cov003.ts):

The validator's logic treats a catch as "not expected-condition" (i.e., needs error recording) when **both**:
1. The catch body contains a `ThrowStatement` (`hasThrow = true`)
2. The catch body contains an ENOENT pattern string

```typescript
// From isExpectedConditionCatch():
if (EXPECTED_CONDITION_PATTERNS.some((pattern) => bodyText.includes(pattern))) {
  // Even though expected-condition patterns are present, the rethrow means
  // there's a genuine error path. Return false — error recording is needed.
  return false;
}
```

This is designed to handle the pattern `if (err.code === 'ENOENT') return []; throw err` (ENOENT → return, else → throw). In that pattern, the throw IS a genuine error path that should be recorded.

However, the two functions here use the **negated** pattern: `if (err.code !== 'ENOENT') throw err`. Semantically:
- `if (err.code === 'ENOENT') return; throw err` → ENOENT is handled gracefully; throw is a genuine error
- `if (err.code !== 'ENOENT') throw err` → non-ENOENT throws to parent; ENOENT is skipped silently

Both patterns have `ENOENT + throw` in the body, so the validator conservatively flags both. But the second pattern is just as graceful-degradation as an empty catch — the thrown error propagates to the outer span's `catch (error)` block, which records it with `span.recordException(error)` and `span.setStatus(ERROR)`.

### Comparison to Run-24

Run-24 committed summary-manager.js with 9 spans (×1 attempt). The run-24 agent handled these inner catches by replacing the conditional rethrow with an empty catch:

```javascript
// Run-24 agent — inner loop catch:
} catch {
  // No daily summary for this day — skip
}
```

An empty catch satisfies `isExpectedConditionCatch` (empty body → true). This passes COV-003 but changes behavior: non-ENOENT errors inside the loop are silently swallowed rather than rethrown. This is technically an NDS-007 violation (original code rethrew non-ENOENT errors; empty catch does not) but wasn't caught in run-24.

The run-25 agent preserved the semantically correct conditional rethrow, which is truer to the original behavior, but triggered the validator.

### What the Agent Could Have Done

To avoid the COV-003 failure while preserving semantics, the agent could have:
1. Used an empty catch `catch { }` (same as run-24 — passes COV-003 but changes error propagation)
2. Added a span error recording path for the non-ENOENT case specifically:
   ```javascript
   } catch (err) {
     if (err.code !== 'ENOENT') {
       span.recordException(err);
       span.setStatus({ code: SpanStatusCode.ERROR });
       throw err;
     }
     // ENOENT: no daily summary — skip
   }
   ```
   This would satisfy COV-003 and preserve the original behavior. The validator would pass because `hasErrorRecording(catchText, spanParam)` would return true.

### Spiny-Orb Fix Recommendation

**Option A (validator fix)**: Update `isExpectedConditionCatch` to distinguish between:
- `if (err.code === 'ENOENT') ...; throw err` → genuine error path after ENOENT guard → flag for COV-003
- `if (err.code !== 'ENOENT') throw err` → ENOENT is the graceful path; rethrow goes to parent → accept as graceful degradation (NDS-007)

**Option B (prompt guidance)**: Add agent guidance for the conditional-rethrow pattern. Instruct the agent to explicitly record errors in inner-loop catches when the original pattern throws conditionally, OR to use empty catches for inner-loop graceful-degradation.

Option A is the more correct fix — the validator should semantically understand this pattern. Option B is a workaround that may produce lower-quality instrumentation (empty catches swallow non-ENOENT errors silently).

### Impact on Rubric

The 7 committed functions are correctly instrumented. The 2 skipped functions are not failures in the quality rubric sense — they simply weren't committed. Rubric impact:
- COV-004: summary-manager.js fails (2 async functions without spans)
- All other rules assessed on the 7 committed functions only

---

## Summary Table

| Item | Classification | Root Cause | Spiny-Orb Fix? |
|------|---------------|------------|----------------|
| summary-manager.js PARTIAL | COV-003 false positive on graceful-degradation inner-loop catches | Validator's `isExpectedConditionCatch` doesn't distinguish negated ENOENT pattern (`!== 'ENOENT'`) from standard pattern (`=== 'ENOENT'`) | Yes — Option A (validator) or Option B (prompt guidance) |
| RUN24-1 CDQ-001 index.js | FIXED | `process.exit()` moved outside span callback | Shipped in 91e9413 |
| RUN24-2 SCH-003 git-collector | NOT TRIGGERED | Run-25 agent omitted `diff_lines` entirely | Backstop shipped but not yet exercised |
