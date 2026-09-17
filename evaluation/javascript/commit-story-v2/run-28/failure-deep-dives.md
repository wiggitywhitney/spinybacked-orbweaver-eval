// ABOUTME: Failure deep-dives for run-28 — one partial file (summarize.js, SCH-002 + SCH-003), run-level observations.
# Failure Deep-Dives — Run-28

**Run-28 result**: 12 committed, 0 failed, 1 partial (`summarize.js`), 19 correct skips (pending correct-skip verification in per-file evaluation).

---

## Partial File: src/commands/summarize.js

**Outcome**: 3 spans committed (of 7 possible if all functions were span-eligible — `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize` each got 1 span; the other 4 functions are pure/sync and correctly got 0), 4 attributes, reported as "3 attempts" in `spiny-orb-output.log`. The instrument-branch `src/commands/summarize.instrumentation.md` report shows a longer Validation Journey than the log's summary line suggests — same terminology gap run-27 already flagged (`readWeekDailySummaries`-style "N attempts" undercounts function-level-fallback and reassembly passes as separate steps):

1. **Attempt 1**: 4 blocking errors (SCH-002 ×4)
2. **Attempt 2**: 2 blocking errors (SCH-002 ×2)
3. **Attempt 3**: 2 blocking errors (SCH-002 ×2)
4. **Attempt 4**: function-level fallback — 7/7 functions instrumented
5. **Attempt 5**: reassembly — SCH-002 failed again (2 errors), fell back to partial results

### Root Cause: `dates_requested` reused across three unrelated concepts

`commit_story.summary.dates_requested` (registered `type: string`) is declared once in `runSummarize` (line 330) for a genuine date-string concept, then reused for a week count and a month count in the other two entry points:

| Call site | Line | Value | Concept |
|-----------|------|-------|---------|
| `runSummarize` | 330-332 | `String(dates.length)` | date-range request count, joined semantics per agent notes |
| `runWeeklySummarize` | 434-435 | `weeks.length` (raw, **not** wrapped in `String()`) | week count |
| `runMonthlySummarize` | 521-524 | `months.length` (raw, **not** wrapped in `String()`) | month count |

SCH-002 correctly rejected reassembly on both non-`runSummarize` call sites: "declared attribute extension `commit_story.summary.dates_requested` is used with an inconsistent value source... a different concept" (lines 435, 523 per the log). This is the RUN27-2 pattern recurring exactly — the validator-level fix from spiny-orb PR #1058 is confirmed working (it caught this on both call sites, at reassembly time), but it didn't stop the agent from generating the mistake three separate times across five attempts.

**New observation not present in run-27's version of this pattern**: the two rejected call sites don't just reuse the wrong key — they also skip the `String()` wrapping `runSummarize` uses, setting a raw number directly against a `string`-typed key (`weeks.length`, `months.length`, no conversion). This is a second, compounding type inconsistency layered on top of the semantic reuse: even if the agent had picked distinct keys, the two new-concept values would still need to be declared `int` (not `string`) or explicitly stringified. Not independently flagged by any validator rule in this run — SCH-002 fired first and the fallback discarded these call sites' final form before a separate type check could run against them, if one exists at all.

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

`months_generated_count` and `months_failed_count` are both declared `type: int` in `semconv/agent-extensions.yaml` (registered in an earlier run, reused here). Verified directly against `git show spiny-orb/instrument-1789648132789:src/commands/summarize.js` — this is live in the file that actually landed as PARTIAL, not a discarded attempt. **No validator rule caught this** — the `Validation Journey` above lists only SCH-002 failures; SCH-003 never fired for this file despite the identical `String(x.length)`-vs-int-key shape that triggered RUN26-1 (`journal-manager.js`) and RUN27-3 (`git-collector.js`, `summary-detector.js`). This is the third file in three consecutive runs, confirming the validator gap is still open (spiny-orb issue #1037) and independent of the SCH-002 fix.

### Advisory (non-blocking, not a canonical failure per rubric precedent)

`spiny-orb-output.log`'s Advisory Findings section flags CDQ-007 at lines 435 and 522 (the same two `dates_requested` call sites) for "a PII attribute name... or a raw filesystem path where a basename would be safer." Neither `weeks.length` nor `months.length` is a path or PII value — this reads as a rule-template misfire triggered by the raw-identifier pattern rather than an actual raw-path/PII exposure. Per the CDQ-006 precedent in the rubric ("advisory findings are not canonical failures"), this is noted but not scored as a CDQ-007 failure; it is a separate rubric bug worth a one-line mention in the handoff (the advisory message text doesn't match the actual code shape it's firing on).

### What the Agent Could Have Done

1. Declare three distinct, correctly-typed keys instead of reusing `dates_requested`: e.g. `commit_story.summary.weeks_requested` (`int`) and `commit_story.summary.months_requested` (`int`), leaving `dates_requested` (`string`) to `runSummarize` alone.
2. For `months_generated_count`/`months_failed_count`, set the raw `.length` values directly (`result.generated.length`, no `String()` wrapper) — matches the registered `int` type and is exactly what `auto-summarize.js` in this same run does correctly for its own generated/failed-count pairs.

Neither was applied; the file landed as PARTIAL with three functions' worth of content, one of which (`runMonthlySummarize`) also carries an unrelated, uncaught type error.

---

## Run-Level Observations

### journal-graph.js — 2 attempts, 11th consecutive success

Matches the expected pattern; no quality failure, no dedicated entry needed per the "≥3 attempts AND quality failure" threshold.

### No overnight prompt pause

Total duration 1h 16m — no `PROGRESS.md` accept/edit/skip or push-confirmation stall (D-7's failure shape from runs 26-27 did not recur this run).

### PR Auto-Created — No Manual Recovery Needed

PR #95 auto-created successfully, continuing the pattern from run-27 (PR #94, also AUTO).

### Cost Down vs Run-27

$7.23 vs run-27's $9.40, despite `summarize.js`'s 5-step validation journey (more retries than run-27's single-partial-file cost driver). Token usage also down (181.8K/297.1K vs 272.3K/356.1K input/output).

### RUN27-3 (SCH-003) also confirmed recurring in summary-detector.js — wider than this deep-dive first showed

Per-file evaluation of `src/utils/summary-detector.js` (committed, 1 attempt — does not meet this milestone's own "partial or ≥3-attempts-with-quality-failure" threshold for a dedicated deep-dive entry) independently found **four** more SCH-003 violations: `unsummarized_days_count`, `unsummarized_weeks_count`, `summarized_months_count`, and `unsummarized_months_count` (all newly-invented, all `int`-typed) are each set via `String(...)`. Combined with `summarize.js`'s two violations above, this run has 6 total SCH-003 occurrences across 2 files — more than either individual file's own deep-dive scope suggests. Full detail in `per-file-evaluation.md`'s entry for `summary-detector.js`. This does not change the root-cause analysis above (same validator gap, same "agent invents a key, then stringifies it" pattern) but does change the scope: RUN27-3 is confirmed in two files this run, not one.

### Fix-verification methodology note (carried to `lessons-for-prd29.md`)

This deep-dive's SCH-003 finding for `summarize.js` was only caught by reading the committed source directly (`git show`), not from `spiny-orb-output.log`'s prose — the log's Schema Extensions and Agent Notes sections describe new extensions and reasoning, not every `setAttribute` call against a pre-existing key. An initial pass of `run-summary.md` missed this and reported "no recurrence observed" before a CodeRabbit review caught the discrepancy. A **second** pass of `run-summary.md` then claimed `summary-detector.js` had no issue, based on an insufficiently thorough source check — until per-file evaluation's systematic line-by-line comparison found the four violations noted above. Future fix-verification for SCH-002/SCH-003 must check every `setAttribute` call in every file against the registry, line by line — not a targeted grep, and not a single read-through.
