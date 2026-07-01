# Failure Deep-Dives — Run-13

**Run-13 result**: 7 committed, 11 failed, 1 partial, 11 correct skips.

Two checkpoint test failures caused 10 of the 11 failures via rollback. One API error. One persistent partial (journal-graph.js summaryNode).

---

## Checkpoint Failure 1 — File 15/30: null vs undefined guard

### Scope

5 files rolled back: `src/generators/prompts/sections/summary-prompt.js`, `technical-decisions-prompt.js`, `weekly-summary-prompt.js`, `src/generators/summary-graph.js`, `src/index.js`.

None of these files were the *source* of the failure — `summary-graph.js` was. The checkpoint fires after every 5 files; when `index.js` (file 15) completed, the test suite ran against the accumulated instrumentation and caught the bug introduced by `summary-graph.js` (file 14). All 5 files processed since the last checkpoint were rolled back.

### Root Cause

`summary-graph.js` instrumented attribute-setting inside `!== undefined` guards:

```javascript
if (weeklySummaries !== undefined) {
    span.setAttribute('commit_story.summarize.week_count', weeklySummaries.length);
}
if (dailySummaries !== undefined) {
    span.setAttribute('commit_story.summarize.date_count', dailySummaries.length);
}
```

Tests in `weekly-summary-graph.test.js` and `monthly-summary-graph.test.js` pass `null` for these parameters (the "returns early for null" test cases). `null !== undefined` evaluates to `true`, so the guard passes, and then `null.length` throws:

```text
TypeError: Cannot read properties of null (reading 'length')
  at src/generators/summary-graph.js:401 — dailySummaries.length
  at src/generators/summary-graph.js:623 — weeklySummaries.length
```

### Why the Agent Chose `!== undefined`

The NDS-003 truthy-check fix (PR #391, issue #388) added this pattern to the allowlist:

```text
/^\s*if\s*\(\s*\w+(?:\.\w+)+\s*\)\s*\{?\s*$/
```

This requires **at least one property dereference** (`.something`). A simple variable guard like `if (weeklySummaries)` does NOT match — `weeklySummaries` is a single identifier with no dot notation. So the agent's only NDS-003-safe option for a standalone parameter was `!== undefined`, which is the other allowlisted pattern.

The agent correctly applied the available NDS-003-safe pattern but didn't account for callers passing `null`. The fix would require either:
1. `if (weeklySummaries != null)` — catches both null and undefined (the `!=` loose equality form, which is already in the allowlist)
2. `if (weeklySummaries !== null && weeklySummaries !== undefined)` — explicit both

**Note**: `!= null` (loose inequality) is in the existing NDS-003 allowlist at line 41 of nds003.ts: `!==?\s*(?:undefined|null|...)`. The `=?` makes the `=` optional, covering both `!== null` and `!= null`. The agent could have used `!= null` to catch both null and undefined in one guard. This is the pattern gap to fix.

### Files Rolled Back That Were Fine

Of the 5 rolled-back files, 4 were likely correct or trivially correct:
- `summary-prompt.js` — 0 spans, pure constants file → correct skip outcome expected
- `technical-decisions-prompt.js` — 0 spans, pure constants file → correct skip outcome expected
- `weekly-summary-prompt.js` — 0 spans, pure constants file → correct skip outcome expected
- `index.js` — 1 span committed in the verbose output, but exact content unknown until re-instrumented

`summary-graph.js` was the only file with a real bug. The collateral rollbacks are a cost of the checkpoint window size (5 files).

---

## Checkpoint Failure 2 — File 25/30: Date vs string timestamp

### Scope

5 files rolled back: `src/managers/journal-manager.js`, `src/managers/summary-manager.js`, `src/mcp/server.js`, `src/mcp/tools/context-capture-tool.js`, `src/mcp/tools/reflection-tool.js`.

Again, `journal-manager.js` was the source. Files 21-25 were processed since the last checkpoint; all were rolled back when the test suite caught the failure after file 25 (`reflection-tool.js`).

### Root Cause

`journal-manager.js` used `commit.timestamp.split('T')[0]` to extract the date portion for `commit_story.journal.entry_date`:

```javascript
if (commit.timestamp) {
    span.setAttribute('commit_story.journal.entry_date', commit.timestamp.split('T')[0]);
}
```

The `if (commit.timestamp)` guard is now correctly NDS-003-safe (property access with dot notation — matches the new truthy guard pattern). But `.split()` is a string method. Tests in `journal-manager.test.js` provide `commit.timestamp` as a `Date` object. `Date.prototype.split` does not exist:

```text
TypeError: commit.timestamp.split is not a function
  at src/managers/journal-manager.js:188
```

Five `saveJournalEntry` tests failed with the same error.

### Why This Is New

Run-12's journal-manager.js failure was: agent removed `if (commit.hash)` and `if (commit.author)` guards (CDQ-007: unconditional setAttribute from nullable fields). The NDS-003 truthy fix was supposed to resolve this — and it did change the behavior. The agent now correctly keeps the guard `if (commit.timestamp)`. But the agent introduced a new assumption: that `commit.timestamp` is a string when present.

This is a case where the NDS-003 truthy fix worked as intended (guard preserved), but the agent made a type-assumption error about the guarded value. Run-12 and run-13 are different failure modes for the same file.

### Prior Art in This Run

`git-collector.js` (file 2, committed) correctly handled the same timestamp type ambiguity:

> "metadata.timestamp is a Date object — converted to ISO string via .toISOString() before setAttribute per CDQ-007"

The agent knew the pattern when processing git-collector.js but didn't apply it to journal-manager.js. This is LLM context inconsistency — the correct solution was demonstrated earlier in the same run but not propagated.

### Collateral Rollback Assessment

- `summary-manager.js` — this was the most expensive collateral loss. Verbose output showed ⚠️ PARTIAL with 8 spans across 13/14 functions. This was meaningful instrumentation that was discarded.
- `mcp/server.js` — 1 span, 2 attempts in verbose output. Non-trivial.
- `context-capture-tool.js` — 0 spans, likely correct skip → low loss
- `reflection-tool.js` — 0 spans, likely correct skip → low loss

---

## API Failure — accessibility.js

### What Happened

File 5 (`src/generators/prompts/guidelines/accessibility.js`) failed with:

```text
Anthropic API call failed: 400 {"type":"error","error":{"type":"invalid_request_error","message":"Not Found"},"request_id":"req_011CZzHefTwYN1mS9bjx7uFv"}
```

`$0.00` cost, 0 tokens consumed.

### Assessment

A 400 `invalid_request_error` with "Not Found" is unusual — this is distinct from the 529 `overloaded_error` seen in run-12. One plausible cause: this run used `feature/prd-372-typescript-provider` (not main), and a request formatting change in that branch affected this specific call. However, all subsequent API calls in the run succeeded (files 6-30), making a systematic branch issue unlikely.

The file itself is a pure constants file (a single exported string — the accessibility guidelines text). A correct-skip outcome was expected regardless. The API failure cost 0 tokens and had no quality impact.

---

## Partial — journal-graph.js summaryNode

### What Happened

`summaryNode` (file `src/generators/journal-graph.js`) was skipped on all 3 attempts with NDS-003 Code Preserved failures:

```text
NDS-003: original line 27 missing/modified: const systemContent = `${guidelines}
```

11/12 functions instrumented. `summaryNode` persists as the one skipped function.

### History

| Run | summaryNode outcome | Notes |
|-----|--------------------|----|
| Run-11 | skipped | NDS-003 Code Preserved |
| Run-12 | skipped | NDS-003 Code Preserved, 3 attempts |
| Run-13 | skipped | NDS-003 Code Preserved, 3 attempts |

This is 3 consecutive runs. The agent modifies the template literal on line 27 (`const systemContent = \`${guidelines}`) every attempt. The NDS-003 truthy-check fix did not address this — the issue is the agent restructuring a template literal, not a guard pattern.

### Root Cause Hypothesis

`summaryNode` likely contains a large template literal that the agent rewrites to add context. The original code contains something like:

```javascript
const systemContent = `${guidelines}
...more template content...`;
```

The agent modifies this structure in some way (possibly reformatting the template literal, or injecting content inline), which NDS-003 flags as a code modification. After 3 attempts, spiny-orb gives up and skips the function.

This is a persistent structural gap: the agent cannot instrument `summaryNode` without touching line 27. The fix likely requires either (a) a spiny-orb prompt change to avoid touching template literal structure, or (b) an NDS-003 allowlist entry for template literal reformatting under specific conditions.

---

## Run-Level: Cost and Duration Regression

**Run-13: ~$6.41, 1h 5m 40.7s** — both worse than run-12 ($5.19, 53.8 min).

| Driver | Cost | Notes |
|--------|------|-------|
| journal-graph.js (partial, 3 attempts) | $1.54 | Same file, same pattern as run-12 |
| summary-manager.js (rolled back, 2 attempts) | $1.77 | Partially instrumented, then discarded |
| journal-manager.js (rolled back, 3 attempts) | $0.75 | Cost spent, nothing kept |
| summary-graph.js (rolled back) | $0.29 | Cost spent, nothing kept |
| index.js (rolled back) | $0.33 | Cost spent, nothing kept |

$4.68 of the ~$6.41 total was spent on files that either got rolled back or are persistent partial failures. The checkpoint mechanism is functioning correctly — it caught real bugs — but the rolled-back instrumentation represents sunk cost.

---

## Run-Level: Span Name Collision

```text
Warning: Span name "commit_story.summarize.run_weekly_summarize" collision: declared by both
  src/commands/summarize.js and src/managers/summary-manager.js
```

`summarize.js` (file 3, committed) and `summary-manager.js` (file 22, rolled back) both invented `commit_story.summarize.run_weekly_summarize`. Despite the collision warning, `summary-manager.js` was rolled back, so only `summarize.js`'s version is in the committed output. The collision would be a real issue if both files were committed — it would produce ambiguous span provenance. To investigate in future runs if summary-manager.js commits successfully.
