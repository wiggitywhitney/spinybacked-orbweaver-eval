// ABOUTME: Failure deep-dives for run-29: summary-graph.js (NDS-003 allowlist gap), index.js (NDS-005 false positive), and the 3-attempt files.
# Failure Deep-Dives — Run-29

**Run-29 result**: 12 committed, 1 failed (`summary-graph.js`), 1 partial (`index.js`), 18 harness-labeled correct skips.

Both non-success outcomes trace to validator behavior, reproduced against spiny-orb's built `dist/` at `475eb3d`, rather than to defects in the agent's code. `summary-graph.js` failed because the NDS-003 allowlist does not accept optional chaining in a defined-value guard. `index.js` is labeled partial because NDS-005 compared Prettier-reformatted code against the raw original. The committed file contains both functions' full instrumentation. The four committed files that took 3 attempts (`git-collector.js`, `context-integrator.js`, `summary-manager.js`, `auto-summarize.js`) spent their retries mostly on SCH-002 and NDS-003 guard rejections. Across all committed files, SCH-002 rejections totaled 55 against run-28's 8. `summary-graph.js` is the separate failed file, which ended on NDS-003 guard rejections after three attempts.

Reproduction scripts in this directory (run from the eval repo root with `SPINY_ORB_CHECKOUT=~/Documents/Repositories/spinybacked-orbweaver-main`; the third also needs `COMMIT_STORY_CHECKOUT=~/Documents/Repositories/commit-story-v2`):

- `nds003-repro.mjs`, `nds003-repro2.mjs`: minimal guard forms through `checkNonInstrumentationDiff` and the normalized path.
- `nds003-line-and-fixers.mjs`: replays NDS-003's full normalized path on the `summary-graph.js` debug dump and reruns the deterministic fixers on it.

---

## Failed File: src/generators/summary-graph.js

**Outcome**: 0 spans committed. The last attempt's code (the debug dump) carried 6 spans: an LLM-node span and an orchestrator span for each of daily, weekly, and monthly. Run-28 committed 6 spans for this file in 1 attempt.

### Attempt sequence

The log prints validation failures only for the last attempt, and a failed file has no `.instrumentation.md`, so attempts 1 and 2 are reconstructed from the agent's own thinking and notes:

1. **Attempt 1**: NDS-003 on the `response_metadata` guards (inferred). Attempt 2's thinking says "I need to remove the response_metadata blocks … I'll keep the spans and usage_metadata as-is since they weren't flagged."
2. **Attempt 2**: removed the `response_metadata` blocks, which cleared NDS-003, and failed on an undeclared attribute key. Attempt 3's agent note says "The previous attempt failed because commit_story.summary.entries_count was used without being declared." Attempt 2's thinking shows why: it swapped the counts "for the now-registered entries_count field" and removed `entries_count` from `schemaExtensions` "since registered keys shouldn't be listed there." The key was not registered. Where the agent got the idea that it was is an open question (see "Open questions for the spiny-orb team" below).
3. **Attempt 3**: declared every new key, restored the `response_metadata` guards, and failed NDS-003 ×3 on them.

The agent's recovery was correct on each axis it was told about. It fixed the guards when NDS-003 named them, then fixed the key declaration when the schema rule named it. It restored the guards in attempt 3 because that attempt's feedback concerned only the key. The file ran out of attempts while trading one rejection for another.

### Root cause: the defined-value guard pattern has no optional-chaining support

All three last-attempt failures are the same line, once per LLM node (debug dump lines 217, 462, 707):

```js
if (result.response_metadata?.model != null) {
  span.setAttribute('gen_ai.response.model', String(result.response_metadata.model));
}
```

The guard four lines above each one, `if (result.usage_metadata != null) {`, passed. In `src/languages/javascript/rules/nds003.ts`, the defined-value guard allowlist pattern (single-condition and compound-AND forms) matches the guarded expression with `\w+(?:\.\w+)*`, which excludes `?.`. The truthy-guard pattern next to it uses `\w+(?:(?:\??\.)\w+)+` and accepts `?.`, a change made for #785 that never reached the defined-value forms. `nds003-repro.mjs` and `nds003-repro2.mjs` confirm it. `result.usage_metadata != null` and `result.response_metadata != null` pass, and `result.response_metadata?.model != null` fails, on both `checkNonInstrumentationDiff` and `checkNonInstrumentationDiffNormalized` (the path `nds003Rule.check` calls).

This is a validator false positive. The guard wraps only a `setAttribute` call, which is the exact case the allowlist comment says these patterns exist for ("Defined-value guards wrapping setAttribute calls (CDQ-007 compliance)"). The optional chain is the correct guard here, because `response_metadata` may be absent from the LangChain message.

### Open check 1, resolved: no deterministic fixer touched the guard lines

The retry loop (`src/fix-loop/instrument-with-retry.ts`) applies its fixers to `output.instrumentedCode` in place before validation. The debug dump is that same `output.instrumentedCode` (`buildFailedResult` sets `lastInstrumentedCode: output?.instrumentedCode`), so the dump is exactly the code NDS-003 checked, after the fixers.

`nds003-line-and-fixers.mjs` reruns the five fixers that need no run-specific input (`ensureTracerAfterImports`, `fixProcessExitSpanEnd`, `fixIsRecordingGuards`, `fixUntypedStringMethods`, `fixNotNullSafeGuards`) on the dump. The output is unchanged, and the guard lines are identical before and after. The only fixer that rewrites an `if` condition is `fixNotNullSafeGuards`. It changes `!== undefined` to `!= null`, but only when the `setAttribute` value is a bare `identifier.property` access. Here the value is a `String(...)` call, so the fixer does not fire. The script confirms that a `!== undefined` variant of the guard also passes through unchanged. Neither form would have passed NDS-003, since the regex accepts both operators but neither with `?.`. The remaining three fixers (`fixCanonicalTracerName`, `fixAttributeTypeCoercions`, `fixDelimiterVariants`) rewrite `getTracer()` names, `setAttribute` values, and attribute key strings, not `if` conditions; this is from reading their source, not from a rerun. The optional-chained guard is the agent's own code.

### Open check 2, resolved: "line 187" is a line in the stripped, Prettier-normalized last attempt

The error's "instrumented line 187" is not a debug-dump line number. `checkNonInstrumentationDiffNormalized` first strips all OTel nodes (`stripOtelNodes`), resets object and array `multiLine` flags (`normalizeMultiLineFlags`), and runs both sides through Prettier. Only then does it call `checkNonInstrumentationDiff`, which reports line numbers from that transformed text. `nds003-line-and-fixers.mjs` replays these steps on the debug dump against commit-story-v2 `fa26743` (main at the run's start). It reproduces exactly three failures at lines **187**, 375, and 562, all on the `response_metadata?.model` guard, so the log's message comes from the last attempt. Leaving out the `multiLine` reset gives lines 212, 428, and 642, which shows how sensitive the reported number is to the normalization steps.

The agent cannot map that number back to its own output, because the stripped, normalized text exists only inside the validator. The message also quotes the offending line, which is the usable part. In this run the quoted line was enough for the agent to find the guard in attempt 2.

### What the agent could have done

Within the current validator, a plain guard on the parent object would pass: `if (result.response_metadata != null) { span.setAttribute('gen_ai.response.model', String(result.response_metadata.model)); }`. It would set `"undefined"` when the model field is missing, so the optional chain is the better code, and the allowlist should accept it.

---

## Partial File: src/index.js

**Outcome**: 2 spans committed (`commit_story.cli.handle_summarize`, `commit_story.cli.main`). Runs 26–28 committed 2 spans in 1 attempt each.

### Validation Journey (from `src/index.instrumentation.md`)

1. **Attempt 1**: SCH-002 ×4
2. **Attempt 2**: SCH-002 ×1
3. **Attempt 3**: function-level fallback, 2/2 functions instrumented
4. **Attempt 4**: reassembly: NDS-005 "Original try/catch block is missing from instrumented output"

### Root cause: NDS-005 compared Prettier-normalized reassembly against the raw original

The reassembly path in `instrument-with-retry.ts` normalizes the reassembled file through Prettier (`reassembledCode = await prettierNormalizeForComparison(reassembledCode, filePath)`). That exists so NDS-003 sees both sides in the same format, and NDS-003 normalizes both sides internally. NDS-005 (`checkControlFlowPreservation` in `src/languages/javascript/rules/nds005.ts`) does not normalize. It matches each original try block to an instrumented one by a body anchor, the first line of the try body's first statement.

The log truncates NDS-005's message after its first line. Running `checkControlFlowPreservation` from `dist/` on commit-story-v2 `fa26743:src/index.js` against the debug dump gives the full message, including the "Removed block" preview. That block is the `try` in `getPreviousCommitTime`:

```js
  try {
    // Get the commit before the current one
    const output = execFileSync('git', ['log', '-1', '--format=%cI', `${commitRef}~1`], {
```

The block is intact in the dump (line 203). Prettier split the call, so its first line is now `const output = execFileSync(`, and the anchor no longer matches. With the original also run through `prettierNormalizeForComparison`, the same check against the same dump returns 0 failures. This is a validator false positive caused by normalizing one side only.

### The committed file is the flagged reassembly, not a reduced subset

Both functions passed their individual validation, so the partial-results path rebuilds from the same function results. `partialResults` keeps every successful result, and `reassembleFunctions` followed by `prettierNormalizeForComparison` reproduces the code that just failed. The committed `src/index.js` on the instrument branch is byte-identical to the debug dump (`diff` reports no difference). "Partial" here means that reassembly validation failed, not that any function's instrumentation was left out. Per-file evaluation should score `index.js` on both spans as committed.

### Side effect: function-level fallback commits reformat the whole file

Because reassembly normalizes the entire file through Prettier, the three files committed through the fallback (`index.js`, `git-collector.js`, `summary-manager.js`) are reformatted throughout, not only in the instrumented functions. Examples include imports re-wrapped, trailing commas removed (`stdio: [...],` becomes `stdio: [...]`), and multi-line calls re-split. `index.js` shows 460 insertions and 256 deletions for 2 spans. A whitespace-insensitive diff of `git-collector.js` still shows deletions such as the `maxBuffer` line's trailing comma and `lines.findIndex(line => …)`. The change is formatting only, not semantics, so it is not an NDS-003 violation as the rubric defines it, but it inflates the PR diff a reviewer has to read. The normalization dates from spiny-orb `de636a3`/`e90fd7e` (2026-05-08), before run-28, and run-28's `summary-manager.js` and `summarize.js` also went through the fallback, so this is very likely not new. Earlier runs' documents never mention it. PR artifact evaluation should check how much of PR #98's diff is reformatting.

---

## Committed Files at 3 Attempts

| File | Journey | Final path |
|------|---------|-----------|
| `git-collector.js` | 1: SCH-002 ×6, NDS-003 ×2 · 2: SCH-002 ×3 · 3: NDS-003 ×1 | Function-level fallback, 2/2 (4th pass) |
| `context-integrator.js` | 1: NDS-003 ×5 · 2: NDS-003 ×1 · 3: 0 errors | Whole-file |
| `summary-manager.js` | 1: SCH-002 ×3, NDS-005 ×1, NDS-007 ×1 · 2: SCH-002 ×11 · 3: SCH-002 ×2, NDS-005 ×1, NDS-007 ×1 | Function-level fallback, 14/14 (4th pass) |
| `auto-summarize.js` | 1: SCH-002 ×2 · 2: SCH-002 ×7 · 3: 0 errors | Whole-file |
| `summary-graph.js` | see Failed File above | Failed |

The log's "3 attempts" for `git-collector.js` and `summary-manager.js` counts whole-file attempts only. Both used all three and then committed through a fourth, function-level pass. The run summary's attempt total of 47 therefore undercounts the work on these files. The `.instrumentation.md` files for files committed through the fallback record no agent thinking, so the specific SCH-002 and NDS-003 messages for `git-collector.js` and `summary-manager.js` cannot be recovered from run artifacts.

### context-integrator.js: optional-chained guards rejected, likely the same allowlist gap

The `.instrumentation.md` records only rule counts, not the rejected lines, and there is no debug dump for a committed file, so the attempt 1 and 2 code is not available. The agent's own account points to the same gap. Its attempt 3 thinking says it is "wary of using guard conditions with optional chaining since the validator flagged those as non-instrumentation," and its notes say the post-budget token estimate "was intentionally not captured: doing so would require a conditional null guard on the returned context, which a previous attempt showed is rejected." That is agent-reported evidence, not a reproduced line, so label it a likely match: the allowlist gap probably cost this file two attempts and one attribute.

The same file explains the `vcs.ref.head.revision: HEAD` watch item from `trace-artifact.md`. Attempt 1 and attempt 3 thinking both plan to set `vcs.ref.head.revision` to the input ref and override it with the commit hash once `getCommitData` returns. The committed code (line 32) sets only `span.setAttribute('vcs.ref.head.revision', commitRef)`, and no override follows, so with the default `commitRef = 'HEAD'` the attribute is the literal string `HEAD`. The agent notes describe the shipped behavior ("vcs.ref.head.revision (the input commit reference)"), but the thinking describes a plan that did not ship. Per-file evaluation should score this against the attribute's semantics, since `vcs.ref.head.revision` is defined as a revision ID, not a symbolic ref.

### The guard gap reached further than the failed file

Two committed files' agents generalized the NDS-003 guard rejections into avoiding `if` guards entirely and dropped attributes as a result:

- `journal-graph.js` (attempt 1: NDS-003 ×13; attempt 2: 0): "Optional values … are captured with optional chaining plus a ?? fallback inline in setAttribute rather than if-guards, since the validator treats added if statements as non-instrumentation code. Response model/id attributes were dropped for the same reason." Plain `x != null` guards pass NDS-003, so the agent's conclusion is broader than the rule's actual behavior. Whether all 13 attempt 1 rejections were guards is not recoverable. This bears on the D-3 watch item: `gen_ai.response.model` is absent from `journal-graph.js` because of a validator interaction, not a model choice.
- `context-integrator.js`: the token estimate, above.

Together with `summary-graph.js`, this file is one of three files where the optional-chaining gap, or the agent's over-broad reaction to it, removed telemetry or cost attempts. Treat this as an observation from one run. Run-28's Sonnet agent did not use `response_metadata` at all, and per D-4 one run cannot separate a model effect from variance.

### SCH-002 dominates the retries

Summing each committed file's Validation Journey gives SCH-002 55, NDS-003 23, NDS-005 2, NDS-007 2. Run-28's instrument branch, summed the same way, gives SCH-002 8, NDS-003 11, NDS-007 3, NDS-005 1. `summary-graph.js` has no report and is excluded from both totals. Run-29's NDS-003 count is `journal-graph.js` 13, `context-integrator.js` 6, `git-collector.js` 3, and `reflection-tool.js` 1. `reflection-tool.js` hit NDS-003 on attempt 1, then ended at 0 spans on attempt 2 with the note "All exported functions are synchronous (registerReflectionTool)". Per-file evaluation decides whether that skip is correct, given the `saveReflection` COV-004 history in runs 26–28. The SCH-002 increase is spread across six files: `summarize.js` 12, `summary-manager.js` 16, `git-collector.js` 9, `auto-summarize.js` 9, `index.js` 5, `summary-detector.js` 4. The only rejection text available is in the agent's thinking: `auto-summarize.js` attempt 2 says "months_count is flagging as a duplicate of weeks_count" (semantic-duplicate judgment), and `summary-graph.js` attempt 2 failed on an undeclared key. Per D-4 this is an observation to confirm in later runs, not a model attribution. The baseline comparison should carry it.

---

## Run-Level Observations

### Priority check: not triggered

`summarize.js` committed in full (3 spans, 2 attempts; Validation Journey SCH-002 ×12 then 0 errors), so the RUN27-2/RUN28-2 partial-recurrence check does not apply. Its committed `setAttribute` calls are checked against the registry line by line in per-file evaluation (RUN28-2 / D-5 count-cast fix check).

### Push and PR: stable

`pushBranch: GITHUB_TOKEN present=true`, `urlChanged=true, path=token-swap`. PR #98 was auto-created, so no manual recovery was needed.

### Cost and attempts

$9.94, 47 whole-file attempts (plus two function-level fourth passes not in that count), and 263.9K output tokens. Per D-4, dollar cost does not compare with run-28. `summary-manager.js` (60.1K output) and `summary-graph.js` (43.0K output, all discarded) are the largest output-token consumers.

---

## Open questions for the spiny-orb team

1. **NDS-003 defined-value guards with `?.`**: should the single-condition and compound-AND defined-value patterns accept `?.` as the truthy pattern does since #785? Reproduced; see `nds003-repro*.mjs`.
2. **NDS-005 normalization asymmetry in reassembly**: the reassembly path normalizes the instrumented side through Prettier, but NDS-005 receives the raw original, so any try block whose first statement Prettier re-wraps fails anchor matching. Reproduced: 1 failure with the raw original, 0 with both sides normalized.
3. **"Partial" label when every function succeeded**: when all functions pass individually and only reassembly validation fails, the partial-results path commits the same code that failed. Is "partial" the intended status for that case?
4. **NDS-003 line numbers**: the reported line number refers to stripped, normalized text that the agent never sees. The quoted line is what makes the message usable.
5. **summary-graph.js attempt 2's "now-registered entries_count"**: the agent removed a declaration because it believed the key was registered. One hypothesis is that attempt 1's per-attempt auto-registration accepted the key, the feedback or schema shown to attempt 2 reflected that, and the registration was then rolled back when attempt 1 failed (`snapshotExtensionsFile`/`restoreExtensionsFile`). This is not verified; it needs the attempt 1 feedback text, which the run artifacts do not keep.
6. **Agent thinking for fallback-committed files**: `.instrumentation.md` for `git-collector.js`, `summary-manager.js`, and `index.js` records no thinking, which leaves their whole-file rejections undiagnosable after the run.
