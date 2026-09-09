// ABOUTME: Rubric scores for run-27 — dimension-level synthesis from per-file, failure-deep-dive, and PR evaluations.
# Rubric Scores — Run-27

**Date**: 2026-09-09
**Branch**: `spiny-orb/instrument-1788361335787`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/94

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — `node --check` exits 0 on all 14 committed/partial files, zero syntax failures |
| NDS-002 (Tests) | Per-run | **PASS** — 630 tests pass, 1 skipped (acceptance-gate test requiring a live API key), run directly against the instrument branch tip (`38dd870`) |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — 14/14 committed/partial files (the partial file's rejected functions reverted to unmodified source, so NDS-003 has nothing to violate on them) |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — 14/14 files |
| NDS-006 (Module system) | Per-file | **PASS** — no module system changes across any file |

**Gates: 5/5 PASS**

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 14/14 — no function signatures altered anywhere, including the partial file's 7 committed functions |
| NDS-007 (Control Flow Preserved) | **PASS** | 14/14 — every original catch (graceful-degradation ENOENT loops, MCP non-rethrowing handlers, per-item accumulation catches) left unmodified; only outer span-wrapper catches gained `recordException`/`setStatus`. `summary-manager.js`'s two rejected functions reverted to uninstrumented source, so NDS-007 has nothing to evaluate on them (not a violation, simply inapplicable) |

### Coverage (COV): 4/5 (80%)

| Rule | Result | Evidence |
|------|--------|----------|
| COV-001 (Entry points have spans) | **PASS** | All 13 committed files instrument their exported async entry points; `summary-manager.js`'s 2 rejected functions had spans in their rejected attempts (confirmed via agent notes referencing COV-003 rejection, which presupposes a span already existed) — per the established "output that would have passed COV-001 is scored as COV-001 PASS" precedent, scored PASS at the file level |
| COV-003 (Failable ops have error visibility) | **FAIL** | `summary-manager.js` — file-level partial: 2 of 9 exported async functions (`readDayEntries`, `readMonthWeeklySummaries`) ship with zero instrumentation in the final commit, rejected by the validator's `isExpectedConditionCatch` gap (same root cause `failure-deep-dives.md` traces to run-25). The 7 committed functions all correctly satisfy COV-003 |
| COV-004 (Async ops have spans) | **PASS** | All exported async I/O functions across the 13 fully-committed files are spanned; `git-collector.js` and `summary-detector.js` both instrument all unexported internal helpers this run (an improvement over run-26's RST-004-exempt advisories on the same helpers) |
| COV-005 (Domain attributes present) | **PASS** | All 14 committed/partial files carry ≥1 meaningful domain attribute per span, confirmed against source and/or live traces — including files where the log's `attributesCreated` figure reads 0 (`context-integrator.js`, `context-capture-tool.js`, `journal-paths.js`, `summarize.js`) but source inspection confirms 1-13 real attributes via reused registry keys |
| COV-006 (Auto-instrumentation preferred) | **PASS** | `@traceloop/instrumentation-langchain` used correctly in `journal-graph.js` and `summary-graph.js`; manual spans establish context around, not duplicate, the auto-instrumented `ChatAnthropic.invoke()` boundary |

**Note on rule attribution**: This is the same underlying defect class as run-25's summary-manager.js regression (validator rejects a semantically-correct conditional-rethrow ENOENT catch), but per-file-evaluation.md scores it under COV-003 (error visibility on the specific rejected functions) rather than run-25's COV-004 (async ops missing spans entirely). Both readings are defensible — COV-001 is satisfied because the rejected attempts had spans, so the failure surfaces at the next dimension a span-bearing attempt failed on. Flagging the rule-ID difference from run-25's write-up for the actionable-fix-output handoff rather than re-litigating per-file-evaluation.md's already-reviewed verdict.

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | All sync helpers excluded across all 14 files, including `reflection-tool.js` (0 spans, though flagged as a questionable skip on COV-004 grounds — see Watch Items) |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 14/14 — unexported sync helpers excluded per RST-001; unexported async I/O helpers correctly instrumented where COV-004 requires it (`git-collector.js`, `summary-detector.js`, `context-capture-tool.js`'s `saveContext`) |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in `peerDependencies` at `^1.9.0` |
| API-003 (No vendor SDKs) | **PASS** | No vendor observability packages in production dependencies; grep for `datadog\|dd-trace\|newrelic\|honeycomb` returns nothing |
| API-004 (No SDK imports) | **PASS** | No file in `src/` imports `@opentelemetry/sdk-*`/`exporter-*`/`resources`; `@opentelemetry/instrumentation-pino` is a legitimate production auto-instrumentation dependency, not a manual `src/` import |

### Schema Fidelity (SCH): 2/4 (50%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | All new span names declared as schema extensions under the existing `commit_story.<domain>.<action>` convention; the invented `cli` category in `index.js` is a reasonable extension since no existing category fit CLI dispatch |
| SCH-002 (Attribute keys match registry) | **FAIL** (new) | `commands/summarize.js` — `commit_story.journal.dates_count` is declared by `runSummarize` for a date count, then `runWeeklySummarize` reuses the same freshly-declared key for a week count within the same instrumentation pass. A consumer reading `dates_count` on the weekly span sees a mislabeled value |
| SCH-003 (Attribute types correct) | **FAIL** | Two independent instances this run: `git-collector.js`'s `commit_story.git.diff_size` (declared `int`, emitted via `String(diff.length)`) and `summary-detector.js`'s `commit_story.journal.weeks_count` (declared `int`, emitted via `String(weeks.size)` at all three call sites). RUN26-1's original occurrence (`journal-manager.js`) is confirmed fixed on the type dimension, but the same failure class recurred in two other files — the underlying validator gap (no check catches `setAttribute(key, String(...))` against a numeric-typed key) is not resolved project-wide |
| SCH-004 (No redundant entries) | **PASS** | No invented duplicate keys found; `summary-graph.js`'s `entry_count` reuse across three counts (journal/daily/weekly) passes the "generic term legitimately covering three like concepts" test applied consistently across the run — distinguished from the SCH-002/unrubriced findings, where the reused noun names a *specific, different* concept |

**SCH regression note**: SCH dropped from run-26's 3/4 (75%) to 2/4 (50%) — RUN26-1's original SCH-003 instance is fixed, but SCH-003 recurred in two new files and SCH-002 failed for the first time this run. Net: one rule recovered, two rules newly or still failing.

### Code Quality (CDQ): 6/7 (86%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | All 14 files use `span.end()` in `finally`, no redundant calls, across all committed and partial spans |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('commit-story')` in all 14 files, single module-level call reused per file |
| CDQ-003 (Error recording) | **PASS** | `recordException` + `setStatus({code: SpanStatusCode.ERROR})` in every outer catch before rethrow, across all 14 files |
| CDQ-005 (Async context) | **PASS** | `startActiveSpan` with async callbacks throughout; no `startSpan` misuse anywhere |
| CDQ-006 (Expensive guards) | **PASS** | Confirmed via `spiny-orb-output.log`'s Agent thinking blocks across nearly every file — the agent consistently reasoned that `.length`/`.size` property accesses don't require `isRecording()` guards and that COV-001 entry-point spans are exempt from the guard requirement; no violation surfaced in any per-file section |
| CDQ-007 (No unbounded/PII) | **FAIL** | RUN26-2's `journal-paths.js` instance remains unresolved, and the identical self-identified-and-declined `basename()` pattern on the shared `commit_story.context.repo_path` attribute recurred independently in **six** more files this run: `claude-collector.js`, `context-integrator.js`, `commands/summarize.js`, `utils/summary-detector.js` (×9 occurrences, one per span), `managers/auto-summarize.js`, and `managers/summary-manager.js`. Seven files total carry this canonical FAIL. `journal-manager.js`'s equivalent `file_path` attribute is the deliberate exception (PASS-with-caveat), since its sole call site structurally guarantees a relative path |
| CDQ-008 (Consistent naming) | **PASS** | `'commit-story'` used identically across all 14 files, confirmed by per-run grep |

**CDQ-007 regression note**: Held at run-26's 6/7 score, but the underlying finding widened sharply — 1 canonical instance in run-26 to 7 in run-27, all sharing the same root pattern (missing `basename()` import, self-identified and declined).

---

## Overall Score

| Dimension | Run-27 | Run-26 | Run-25 | Run-24 | Delta (vs run-26) |
|-----------|--------|--------|--------|--------|-------------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | **4/5 (80%)** | 5/5 (100%) | 4/5 (80%) | 5/5 (100%) | **-20pp** |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | **2/4 (50%)** | 3/4 (75%) | 4/4 (100%) | 3/4 (75%) | **-25pp** |
| CDQ | **6/7 (86%)** | 6/7 (86%) | 7/7 (100%) | 6/7 (86%) | — |
| **Total** | **21/25 (84%)** | **23/25 (92%)** | **24/25 (96%)** | **23/25 (92%)** | **-8pp** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | — |

**This run regresses against Success Criteria #3** (≥23/25, no regression from run-26). Both primary run-27 goals were partially met — RUN26-1 fixed on the type dimension but introduced a new semantic-mismatch finding, and RUN26-2 remains unresolved and widened to six more files — but the regression is driven by two independent new failures neither goal targeted: COV-003's `summary-manager.js` partial-commit recurrence (the same run-25 validator gap, not a new bug) and SCH-002's `summarize.js` same-file key-meaning contradiction. Four of the five dimension movements are regressions (COV, SCH) or flat (RST, API, and CDQ nominally flat despite a much wider CDQ-007 footprint); none improved.

---

## Canonical Metrics

| Metric | Run-27 | Run-26 | Run-25 | Run-24 |
|--------|--------|--------|--------|--------|
| Quality score | **21/25 (84%)** | 23/25 (92%) | 24/25 (96%) | 23/25 (92%) |
| Gates | 5/5 | 5/5 | 5/5 | 5/5 |
| Committed files | **13** | 14 | 13 | 14 |
| Partial files | **1** | 0 | 1 | 0 |
| Failed files | **0** | 0 | 0 | 0 |
| Total spans | **48** | 41 | 47 (40 committed + 7 partial) | 48 |
| Model | claude-sonnet-4-6 | claude-sonnet-4-6 | claude-sonnet-4-6 | claude-sonnet-4-6 |
| Cost | **$9.40** | $11.15 | $7.38 | ~$3.70 |
| Q×F | **10.92** | 12.88 | 12.48 | 12.88 |
| Push/PR | **AUTO (#94)** | MANUAL (#91, see run-26 D-7) | AUTO (#86) | AUTO (#81) |
| IS | Pending IS scoring milestone | 100/100 | 100/100 | 80/100 |

**Q×F = 10.92** (21/25 × 13 committed files). Down from run-26's 12.88 and run-25's 12.48 — both the quality percentage (84% vs 92%/96%) and the committed-file count (13 vs 14/13) moved against this run relative to run-26, though the file count matches run-25's. This is the lowest Q×F since run-21 (11.0).

**Fix verification summary** (full detail in `run-summary.md` and `per-file-evaluation.md`):
- **RUN26-1 (SCH-003 / journal-manager.js `reflections_count`)**: ⚠️ PARTIALLY RESOLVED — type mismatch fixed (raw int, no `String()` wrapper), but the value now writes into `commit_story.journal.quotes_count`, a key registered for an unrelated concept (developer quotes, not reflections). Scored as an unrubriced finding, not SCH-003 — no existing rule targets "correct type, wrong chosen key."
- **RUN26-2 (CDQ-007 / journal-paths.js raw path)**: ❌ STILL UNRESOLVED, and the identical pattern recurred independently in six more files this run (see CDQ-007 above).
- **NEW: COV-003 (summary-manager.js partial regression)**: ❌ NEW FAILURE (recurrence of a known gap) — same `isExpectedConditionCatch` validator gap as run-25, against a different function pair.
- **NEW: SCH-002 (summarize.js `dates_count`/weeks mismatch)**: ❌ NEW FAILURE — a freshly-declared key contradicted against its own declared meaning within the same file and instrumentation pass.
- **NEW: SCH-003 (git-collector.js, summary-detector.js)**: ❌ NEW FAILURES (recurrence of a known gap in files other than where it was first found) — same `String(x.length)`-against-`int`-key pattern as RUN26-1's original instance.

---

## Failure Analysis

### COV-003: summary-manager.js — partial-commit regression (RECURRING, same root cause as run-25)

`summary-manager.js` reverted to shipping 7 of 9 exported functions, after run-26 committed all 9 cleanly. `failure-deep-dives.md` confirms this is the identical `isExpectedConditionCatch` validator gap first identified in run-25: the validator flags any catch body containing both an ENOENT-pattern check and a `ThrowStatement` as needing error recording, but two catch shapes exist in this codebase — `if (err.code === 'ENOENT') return; throw err;` (flagged, COV-003 rejection) and `if (err.code !== 'ENOENT') throw err;` (correctly accepted as graceful degradation). Run-26's clean 9/9 pass was not a fix landing; it was one run where no function happened to use the flagged shape. This run, `readDayEntries` and `readMonthWeeklySummaries` did.

**Root cause**: Unresolved spiny-orb validator gap (`cov003.ts`'s `isExpectedConditionCatch`), confirmed identical across run-25 and run-27 via direct source comparison of the three ENOENT-handling functions in the final committed dump.

**Fix needed in spiny-orb**: `isExpectedConditionCatch` needs to distinguish the two catch shapes rather than flagging any ENOENT-pattern-plus-throw combination uniformly.

### SCH-002: summarize.js — dates_count contradicts its own declaration (NEW FAILURE)

`commit_story.journal.dates_count` is declared and correctly used by `runSummarize` for a date count, then `runWeeklySummarize` reuses the same key — declared fresh by this file in this same instrumentation pass — for `weeks.length`, a week count. Unlike `journal-manager.js`'s unrubriced finding (an older, already-registered key repurposed for an unrelated domain concept across files), this is a narrower same-file, same-run contradiction: the file declares a key's meaning and then violates it three lines away.

**Root cause**: The agent's schema-extension declaration step and its per-function attribute-assignment step aren't cross-checked against each other within a single file/pass — SCH-002's "no invented duplicate key" check passes (no new synonym was created) while missing that the one new key it approved gets used inconsistently.

**Fix needed in spiny-orb**: SCH-002 (or a new check) should verify that every `setAttribute` call against a newly-declared extension key is consistent with that key's declared semantics, not just check for duplicate/synonym key invention.

### SCH-003: git-collector.js and summary-detector.js — int-typed keys emitted as strings (RECURRING pattern, new files)

Both files declare an `int` schema extension (`commit_story.git.diff_size`, `commit_story.journal.weeks_count`) and then wrap the numeric value in `String(...)` before `setAttribute`. Live traces confirm both reach Datadog as quoted strings. This is the exact RUN26-1 failure class, now confirmed in two files other than the one it was originally raised against.

**Root cause**: Same as RUN26-1's original diagnosis — the spiny-orb SCH-003 validator does not reliably catch explicit `String(...)` wrapping of a value being set against an `int`/`number`-typed registry attribute. RUN26-1's fix (in `journal-manager.js`) avoided the pattern by mapping onto an existing correctly-typed key rather than fixing the validator — so the underlying gap was never closed, only sidestepped in the one file it was first found in.

### CDQ-007: repo_path/file_path raw filesystem paths (WIDENED — 1 file in run-26 to 7 in run-27)

The shared `commit_story.context.repo_path` attribute (and `journal-paths.js`'s equivalent `file_path`) is set unconditionally from an unconstrained caller-supplied `basePath`/`repoPath`/`filePath` parameter with no `basename()` transformation, in every file that sets it except `journal-manager.js` (whose sole call site hardcodes `basePath = '.'`, a structural guarantee the other seven lack). Live traces confirm the exposure is real: a full local developer machine path reaches Datadog unredacted. Every instance shares the identical agent-generation-time reasoning: `basename` from `node:path` is named as the correct fix and declined because it isn't already imported in that file.

**Root cause**: Same as RUN26-2's original diagnosis (self-acknowledged agent limitation, not a validator gap) — but the pattern's recurrence across seven independent files this run indicates the underlying prompt guidance treats this as a low-priority, file-scoped decision rather than flagging that the same shared attribute is affected project-wide.

**Fix needed in spiny-orb**: A single `basename()` import added once (or a shared helper) would resolve all seven instances at once, since they all write the same attribute from the same unconstrained-path pattern — this is not seven independent decisions, it's one decision repeated seven times.

---

## Watch Items (not canonical failures, flagged for handoff)

| Item | File | Status |
|------|------|--------|
| Unrubriced semantic mismatch — correct type, wrong registered key | `journal-manager.js` (`quotes_count` holding a reflection count) | No existing rule targets this; same pattern independently recurs in `summarize.js`'s SCH-002 finding above. Rubric gap, not scored against a dimension |
| Questionable "correct skip" | `mcp/tools/reflection-tool.js` | Pre-instrumentation analysis flagged `saveReflection` as needing a COV-004 span (unexported async filesystem I/O, same RST-004 exception `context-capture-tool.js`'s `saveContext` correctly receives this run); final output shipped 0 spans anyway. Not scored against the rubric since no committed code exists to evaluate, but not confirmed correct either |
| Reporting discrepancy | `context-capture-tool.js` | Logged/reported 3 spans; source confirms only 2. Reporting-only, not an instrumentation defect |
| Registry version discrepancy | Run-level | `pr-evaluation.md` notes the registry version still reports unchanged (0.1.0→0.1.0) despite 14 new attributes and ~48 new span IDs — second consecutive run with this discrepancy |

---

## Resolved from Run-26

| Rule | File(s) | Status |
|------|---------|--------|
| SCH-003 (journal-manager.js `reflections_count` type mismatch) | journal-manager.js | **RESOLVED** on the type dimension — raw int, no `String()` wrapper. Superseded by a new unrubriced semantic-mismatch finding on the same attribute (see Watch Items) |

## Failure Summary

| Rule | Dimension | File(s) | Root Cause | Runs Open |
|------|-----------|---------|-----------|-----------|
| COV-003 | COV | summary-manager.js (`readDayEntries`, `readMonthWeeklySummaries`) | `isExpectedConditionCatch` validator gap — flags a graceful-degradation ENOENT catch shape identical in structure to an accepted shape | 2 runs (run-25, run-27; absent run-26) |
| SCH-002 | SCH | summarize.js (`dates_count` on `runWeeklySummarize`) | New extension key's declared meaning not cross-checked against its own later `setAttribute` calls in the same file/pass | 1 run (new) |
| SCH-003 | SCH | git-collector.js (`diff_size`), summary-detector.js (`weeks_count`) | Validator does not catch `String(x.length)`-style coercion against an `int`-typed registry attribute — same gap as RUN26-1, unresolved project-wide | 2 runs (recurring, different files each time) |
| CDQ-007 | CDQ | claude-collector.js, context-integrator.js, journal-paths.js, summarize.js, summary-detector.js, auto-summarize.js, summary-manager.js (`repo_path`/`file_path`) | Self-acknowledged agent limitation — `basename()` available in the language but not imported per-file; no shared fix applied across the 7 files sharing this attribute | 2 runs (RUN26-2 origin, widened from 1 file to 7) |
