// ABOUTME: Failure deep-dives for run-28 — one partial file (summarize.js, SCH-002 + SCH-003), run-level observations.
# Failure Deep-Dives — Run-28

**Run-28 result**: 12 committed, 0 failed, 1 partial (`summarize.js`), 19 harness-labeled skips (17 confirmed correct, 2 questionable — see `per-file-evaluation.md`'s Skips Evaluated section: `context-capture-tool.js` is a coverage regression from run-27's 2 committed spans to 0 this run, and `reflection-tool.js` repeats the same self-identified-and-declined `saveReflection`/COV-004 gap documented in runs 26 and 27).

---

## Partial File: src/commands/summarize.js

**Outcome**: 3 spans committed — the file's own function-level fallback pass (attempt 4, its own internal denominator) reports "7/7 functions instrumented," but per-file evaluation's direct source read found the file actually has 9 top-level functions: 3 async/span-eligible (`runSummarize`, `runWeeklySummarize`, `runMonthlySummarize`, all 3 committed with 1 span each) and 6 pure/sync (correctly given 0 spans). All 3 span-eligible functions committed — this file has no COV-001/COV-004 coverage gap; its PARTIAL status is entirely a content failure (SCH-002/SCH-003), not missing coverage. 4 attributes, reported as "3 attempts" in `spiny-orb-output.log`. The instrument-branch `src/commands/summarize.instrumentation.md` report shows a longer Validation Journey than the log's summary line suggests — same terminology gap run-27 already flagged ("N attempts" undercounts function-level-fallback and reassembly passes as separate steps):

1. **Attempt 1**: 4 blocking errors (SCH-002 ×4)
2. **Attempt 2**: 2 blocking errors (SCH-002 ×2)
3. **Attempt 3**: 2 blocking errors (SCH-002 ×2)
4. **Attempt 4**: function-level fallback — spiny-orb's own report says "7/7 functions instrumented" (its internal count of functions it attempted at this fallback stage, not the file's true 9-function total)
5. **Attempt 5**: reassembly — SCH-002 failed again (2 errors), fell back to partial results

### Root Cause: `dates_requested` reused across three unrelated concepts

`commit_story.summary.dates_requested` (registered `type: string`) is declared once in `runSummarize` (`span.setAttribute(...)` call spanning lines 329-332, key literal on line 330) for a genuine date-string concept, then reused for a week count and a month count in the other two entry points:

| Call site | Call spans | Value | Concept |
|-----------|-----------|-------|---------|
| `runSummarize` | 329-332 | `String(dates.length)` | date-range request count, joined semantics per agent notes |
| `runWeeklySummarize` | 435 (single line) | `weeks.length` (raw, **not** wrapped in `String()`) | week count |
| `runMonthlySummarize` | 522-525 | `months.length` (raw, **not** wrapped in `String()`) | month count |

SCH-002 correctly rejected reassembly on both non-`runSummarize` call sites: "declared attribute extension `commit_story.summary.dates_requested` is used with an inconsistent value source... a different concept" (the validator's own error cites line 435 for the weekly call and line 523 for the monthly call's key literal, one line into its multi-line `span.setAttribute(...)` block starting at line 522). This is the RUN27-2 pattern recurring exactly — the validator-level fix from spiny-orb PR #1058 is confirmed working (it caught this on both call sites, at reassembly time), but it didn't stop the agent from generating the mistake three separate times across five attempts.

**New observation not present in run-27's version of this pattern**: the two rejected call sites don't just reuse the wrong key — they also skip the `String()` wrapping `runSummarize` uses, setting a raw number directly against a `string`-typed key (`weeks.length`, `months.length`, no conversion). This is a second, compounding type inconsistency layered on top of the semantic reuse. Fixing it correctly requires pairing each new key with a type that matches how its value is actually produced, not just picking distinct names: if `weeks_requested`/`months_requested` are declared `int` (the natural type for a `.length` value), the raw numbers used here are already correct and need no wrapper; if they're declared `string` instead (matching `dates_requested`'s own type, for consistency across all three), every one of the three call sites — including `runSummarize`'s own `String(dates.length)` — needs the same explicit `String(...)` wrapper, which today only `runSummarize` applies. Not independently flagged by any validator rule in this run — SCH-002 fired first and the fallback discarded these call sites' final form before a separate type check could run against them, if one exists at all.

### RUN27-3 (SCH-003) confirmed recurring, uncaught, same file

Independent of the SCH-002 rejection above, the **committed** `runMonthlySummarize` function sets two already-registered `int`-typed keys via `String()`:

```javascript
span.setAttribute(
  'commit_story.summary.months_generated_count',
  String(result.generated.length)
);
span.setAttribute(
  'commit_story.summary.months_failed_count',
  String(result.failed.length)
);
```

`months_generated_count` and `months_failed_count` are both declared `type: int` in `semconv/agent-extensions.yaml` — `src/commands/summarize.js` (processed as file 29 of 32) is the **originating** file for this declaration; the registry file doesn't exist on main at all, so nothing here is carried over from a prior run. Verified directly against `git show spiny-orb/instrument-1789648132789:src/commands/summarize.js` — this is live in the file that actually landed as PARTIAL, not a discarded attempt. **No validator rule caught this** — the `Validation Journey` above lists only SCH-002 failures; SCH-003 never fired for this file despite the identical `String(x.length)`-vs-int-key shape that triggered RUN26-1 (`journal-manager.js`, a prior run) and RUN27-3 (`git-collector.js`, a prior run). This run alone adds two more files with the identical bug on their own newly-invented keys — see the addendum below.

### Advisory (non-blocking, not a canonical failure per rubric precedent)

`spiny-orb-output.log`'s Advisory Findings section flags CDQ-007 at lines 435 and 522 (the same two `dates_requested` call sites) for "a PII attribute name... or a raw filesystem path where a basename would be safer." Neither `weeks.length` nor `months.length` is a path or PII value — this reads as a rule-template misfire triggered by the raw-identifier pattern rather than an actual raw-path/PII exposure. Per the CDQ-006 precedent in the rubric ("advisory findings are not canonical failures"), this is noted but not scored as a CDQ-007 failure; it is a separate rubric bug worth a one-line mention in the handoff (the advisory message text doesn't match the actual code shape it's firing on).

### What the Agent Could Have Done

1. Declare three distinct, correctly-typed keys instead of reusing `dates_requested`: e.g. `commit_story.summary.weeks_requested` (`int`) and `commit_story.summary.months_requested` (`int`), leaving `dates_requested` (`string`) to `runSummarize` alone.
2. For `months_generated_count`/`months_failed_count`, set the raw `.length` values directly (`result.generated.length`, no `String()` wrapper) — matches the registered `int` type and is exactly what `index.js` in this same run does correctly for the same two keys (reused from `summarize.js`'s own declaration). Note `auto-summarize.js` is not a clean counter-example here — its own per-file evaluation found 6 SCH-003 violations on its *own* newly-invented `days_*`/`weeks_*` count pairs, even though it does correctly reuse `months_generated_count`/`months_failed_count` as raw numbers.

Neither was applied; the file landed as PARTIAL with three functions' worth of content, one of which (`runMonthlySummarize`) also carries an unrelated, uncaught type error.

---

## Run-Level Observations

### context-capture-tool.js — coverage regression (2 spans → 0), agent notes contradict its own reasoning

`context-capture-tool.js` was committed with 2 spans in run-27 (`saveContext`'s own async filesystem I/O, plus the MCP handler entry point). In run-28 it lands as a "correct skip" (0 spans) — but the agent's own thinking trace for this run reconstructs the identical run-27 analysis nearly verbatim: it flags `saveContext` as needing a COV-004 span, works through the RST-004 unexported-orchestrator exception, and drafts a schema extension name for it. The final "Agent notes" then reverse course with "All exported functions are synchronous... no async I/O to trace" — this is a scope error: `saveContext` being unexported does put it outside the *exported* API surface the statement literally describes, but its async filesystem I/O still requires coverage consideration under RST-004/COV-004, which the agent's own preceding reasoning had already correctly worked through before the final notes dropped it. Full detail and the parallel `reflection-tool.js` case (same shape, third consecutive run, but never previously committed so not a regression) are in `per-file-evaluation.md`'s Skips Evaluated section. This is a genuine coverage regression, not a legitimate skip, and should be a handoff item alongside RUN27-3/RUN27-4 — the notes-vs-reasoning divergence pattern (the final summary contradicting the agent's own preceding chain-of-thought) is worth flagging as its own class of defect, separate from the coverage gap itself.

### journal-graph.js — 2 attempts, 11th consecutive success

Matches the expected pattern; no quality failure, no dedicated entry needed per the "≥3 attempts AND quality failure" threshold.

### No overnight prompt pause

Total duration 1h 16m — no `PROGRESS.md` accept/edit/skip or push-confirmation stall (D-7's failure shape from runs 26-27 did not recur this run).

### PR Auto-Created — No Manual Recovery Needed

PR #95 auto-created successfully, continuing the pattern from run-27 (PR #94, also AUTO).

### Cost Down vs Run-27

$7.23 vs run-27's $9.40, despite `summarize.js`'s 5-step validation journey (more retries than run-27's single-partial-file cost driver). Token usage also down (181.8K/297.1K vs 272.3K/356.1K input/output).

### RUN27-3 (SCH-003) also confirmed recurring in summary-detector.js and auto-summarize.js — wider than this deep-dive first showed

Per-file evaluation of `src/utils/summary-detector.js` (committed, 1 attempt — does not meet this milestone's own "partial or ≥3-attempts-with-quality-failure" threshold for a dedicated deep-dive entry) independently found **four** more SCH-003 violations: `unsummarized_days_count`, `unsummarized_weeks_count`, `summarized_months_count`, and `unsummarized_months_count` (all newly-invented, all `int`-typed) are each set via `String(...)`. Per-file evaluation of `src/managers/auto-summarize.js` found **six** more on its own newly-invented keys: `days_generated_count`/`days_failed_count` (each set twice, on an early-return and a normal-return path) and `weeks_generated_count`/`weeks_failed_count`. Combined with `summarize.js`'s four violations above (2 on `dates_requested`, 2 on `months_generated_count`/`months_failed_count`), this run has **14 total SCH-003 occurrences across 3 files** — more than any individual file's own deep-dive scope suggests. Full detail in `per-file-evaluation.md`'s entries for `summary-detector.js` and `auto-summarize.js`. This does not change the root-cause analysis above (same validator gap, same "agent invents a key, then stringifies it" pattern) but does change the scope: RUN27-3 is confirmed in three files this run, not one.

### Fix-verification methodology note (carried to `lessons-for-prd29.md`)

This deep-dive's SCH-003 finding for `summarize.js` was only caught by reading the committed source directly (`git show`), not from `spiny-orb-output.log`'s prose — the log's Schema Extensions and Agent Notes sections describe new extensions and reasoning, not every `setAttribute` call against a pre-existing key. An initial pass of `run-summary.md` missed this and reported "no recurrence observed" before a CodeRabbit review caught the discrepancy. A **second** pass of `run-summary.md` then claimed `summary-detector.js` had no issue, based on an insufficiently thorough source check — until per-file evaluation's systematic line-by-line comparison found the four violations noted above. Future fix-verification for SCH-002/SCH-003 must check every `setAttribute` call in every file against the registry, line by line — not a targeted grep, and not a single read-through.
