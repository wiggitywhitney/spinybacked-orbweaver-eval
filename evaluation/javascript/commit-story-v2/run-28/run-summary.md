// ABOUTME: Run-28 summary — results, fix verification, file outcomes, and key findings.
# Run-28 Summary

**Date**: 2026-09-17
**Duration**: 1h 16m 9.4s (per spiny-orb's own "Completed in" line — no overnight interactive-prompt pause this run)
**Branch**: `spiny-orb/instrument-1789648132789`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/95 (auto-created ✅)
**spiny-orb**: built from main pre-run; RUN27-4 (CDQ-007) fix confirmed merged (`5a0636c` "add import-free path fallback for CDQ-007", plus follow-up CodeRabbit-finding fixes `0180486`/`dc59703`) and issue #1035 closed (`089ba6a` removed it from ROADMAP.md Short-term). No RUN27-3 (SCH-003, #1037)-specific commit found on spiny-orb main since 2026-09-16, and #1037 is confirmed still-live in this run's own committed output (see Fix Verification below).

---

## Results

| Metric | Value |
|--------|-------|
| Files with a full commit | 12 |
| Files with a failed commit | 0 |
| Files partial | 1 (`src/commands/summarize.js`) |
| Harness-labeled skips | 19 (17 confirmed correct, 2 questionable — see `per-file-evaluation.md`'s Correct Skips section) |
| Files seen | 32 |
| Model | claude-sonnet-4-6 |
| Tokens | 181.8K input / 297.1K output (422.7K cached) |
| Cost | $7.23 |
| Live-check | OK (730 spans, 5597 advisory findings — see `spiny-orb-live-check-report.json`) |

Note: "Attributes" in the File Outcomes table below means *new schema-extension attributes* declared, not the total number of `setAttribute` calls in a file — a file can show "0 attributes" while setting many pre-existing registered keys (see per-file entries for examples).

---

## Fix Verification

| Item | Expected (per D-13) | Result |
|------|----------|--------|
| RUN27-1 (COV-003): `summary-manager.js` partial-commit recurrence | FIXED — expect PASS | **✅ CONFIRMED FIXED (this specific bug only)** — all 9 span-eligible functions committed cleanly (9 spans), a full commit (2 attempts), no COV-003 rejection. **This SUCCESS is scoped to COV-003 and file-level commit status — it does not mean the file is clean overall.** Per-file evaluation found three unrelated, genuine failures in this same file: SCH-003 (`summary_saved` declared `string`, always set as boolean), CDQ-006 (isRecording guard applied to only 3 of ~24 `setAttribute` calls), and CDQ-007 (raw unsanitized path at 4 of 7 `file_path` sites, correctly sanitized at the other 3). |
| RUN27-2 (SCH-002): `summarize.js` key-reuse contradiction (`dates_requested`/`dates_count`) | FIXED — expect PASS | **⚠️ VALIDATOR CAUGHT IT, BUT AGENT STILL MADE THE MISTAKE** — the agent reused `commit_story.summary.dates_requested` for a week value (line 435) and a month value (line 523) after first declaring it for "dates" (line 330), same pattern as run-27. This time the SCH-002 check **fired and rejected the reassembly**, forcing the file to PARTIAL (3 spans — all 3 of its span-eligible functions, no coverage gap) rather than silently committing the semantic violation. Reported as "3 attempts" in `spiny-orb-output.log`, though the instrumentation report's own Validation Journey shows 5 steps (3 full-file attempts, a function-level fallback, and a reassembly pass) — see `failure-deep-dives.md` for the full breakdown. The validator-level fix is working — it is now catching this exact pattern — but agent generation behavior hasn't changed, so the practical outcome (a partial file) is new, not a full pass. |
| RUN27-3 (SCH-003): `String(x.length)` vs int-typed key | Still open — expect recurrence | **❌ CONFIRMED RECURRING, UNCAUGHT — in THREE files, 14 total occurrences.** `src/commands/summarize.js` (4 occurrences: `dates_requested` set as a raw number against its `string`-typed key at 2 sites, plus `months_generated_count`/`months_failed_count` set via `String()` at 2 sites), `src/utils/summary-detector.js` (4: `unsummarized_days_count`, `unsummarized_weeks_count`, `summarized_months_count`, `unsummarized_months_count`), and `src/managers/auto-summarize.js` (6: `days_generated_count`/`days_failed_count` set twice each on two code paths, plus `weeks_generated_count`/`weeks_failed_count`) all wrap newly-invented `int`-typed registry keys in `String(...)`. Every occurrence was found during per-file evaluation via direct `git show` line-by-line checking against the registry, independently re-verified. No SCH-003 rejection fired for any of the 14 — the validator gap is confirmed still open, and applies specifically to attributes the agent invents itself in a given file (every pre-existing/reused key across all three files is correctly typed). (Three successive passes of this table incorrectly reported "no recurrence" or undercounted this finding for these exact files, each corrected only after per-file evaluation checked source line by line; see the correction note below.) |
| RUN27-4 (CDQ-007): raw-path pattern (7 files, missing `basename` import) | Still open — expect recurrence | **⚠️ PARTIALLY RESOLVED — the fix mechanism works, but is not consistently applied, even within a single file.** `journal-paths.js`, `journal-manager.js`, and `index.js` all correctly sanitize every path-like attribute using the inline `.split(/[\/]/).filter(Boolean).pop()` fallback (confirmed on spiny-orb main: `5a0636c` "add import-free path fallback for CDQ-007", plus two CodeRabbit-finding follow-ups). But `summary-manager.js` uses the SAME fallback correctly at 3 of 7 `file_path` call sites and ships a raw, unsanitized path at the other 4 — in the same file, with the instrumentation report's own advisory findings flagging all 7 sites. `git-collector.js` separately regressed a *different* CDQ-007 case (raw PII author name) that run-27 had fixed. The mechanism generalizes; invoking it consistently does not yet. |
| RUN27-5 (Watch, unrubriced): correct type, wrong registered key | Watch — third instance would strengthen the case | **✅ RESOLVED for `journal-manager.js`** — this run's version writes the reflection count to `commit_story.journal.entries_count` (a generic, unscoped agent-extension key), not to `commit_story.journal.quotes_count` (the semantically-specific key that caused run-27's mismatch). Does not extend to a third instance; the streak is broken. `summarize.js`'s `dates_count`-shaped SCH-002 variant is now caught by the validator (see RUN27-2 row), so it's scored there, not here. |
| journal-graph.js | Eleventh consecutive success expected | **✅ CONFIRMED** — committed, 4 spans, 2 attempts. |

---

## File Outcomes (committed + partial only — see `per-file-evaluation.md` for the full rubric on every file)

| File | Result | Spans | Attributes | Attempts | Notes |
|------|--------|-------|------------|----------|-------|
| src/collectors/claude-collector.js | ✅ committed | 1 | 0 | 1 | CDQ-007 resolved by dropping `repo_path` entirely (not sanitizing it) |
| src/collectors/git-collector.js | ✅ committed | 6 | 5 | 1 | **SCH-003 FAIL** (`is_merge` boolean set via `String()`); **CDQ-007 FAIL** (regression — raw PII `commit.author` name, was fixed in run-27) |
| src/integrators/context-integrator.js | ✅ committed | 1 | 0 | 1 | `repo_path` correctly dropped, but **CDQ-007 FAIL** — raw PII `commit.author` name re-exposed on this span (same value as `git-collector.js`'s regression) |
| src/generators/journal-graph.js | ✅ committed | 4 | 0 | 2 | 11th consecutive success, no failures |
| src/generators/summary-graph.js | ✅ committed | 6 | 5 | 1 | No failures — 5 new schema-extension attributes (`entries_count`, `week_label`, `daily_summaries_count`, `month_label`, `weekly_summaries_count`; `entry_date` is a pre-existing reused key), all correctly typed |
| src/mcp/server.js | ✅ committed | 1 | 1 | — | No failures; historical NDS-003 blank-line issue (#917) confirmed absent |
| src/utils/journal-paths.js | ✅ committed | 1 | 0 | 1 | **CDQ-007 RESOLVED** since run-27 — inline sanitization fallback applied |
| src/managers/journal-manager.js | ✅ committed | 2 | 0 | 1 | **CDQ-007 resolved** (path sanitized inline); **RUN27-5 resolved** — reflection count now correctly written to `entries_count`, not `quotes_count` |
| src/managers/summary-manager.js | ✅ committed | 9 | 1 | 2 | **RUN27-1/COV-003 resolved** (all 9 span-eligible functions committed) but **SCH-003 FAIL** (`summary_saved` boolean-vs-string), **CDQ-006 FAIL**, **CDQ-007 FAIL** (raw path at 4/7 sites, sanitized at the other 3 in the same file) |
| src/commands/summarize.js | ⚠️ **partial** | 3 | 4 | 3 | **RUN27-2 validator catch** — SCH-002 rejected `dates_requested` reuse for weeks (line 435) and months (line 523). **RUN27-3 recurrence** — `months_generated_count`/`months_failed_count` (int-typed) set via `String(...)`, uncaught |
| src/utils/summary-detector.js | ✅ committed | 9 | 4 | 1 | **RUN27-3 recurrence, worse** — all 4 newly-invented count keys (`unsummarized_days_count`, `unsummarized_weeks_count`, `summarized_months_count`, `unsummarized_months_count`), all `int`-typed, set via `String(...)`, uncaught. (Earlier pass of this table wrongly said "no issue found" — corrected after per-file evaluation checked source directly.) |
| src/managers/auto-summarize.js | ✅ committed | 3 | 4 | 1 | **RUN27-3 recurrence** — `days_generated_count`/`days_failed_count`/`weeks_generated_count`/`weeks_failed_count` (all int-typed) set via `String(...)`, 6 occurrences, uncaught. CDQ-007 clean (no repo_path this run, unlike run-27) |
| src/index.js | ✅ committed | 2 | 1 | — | Full PASS, all 19 rules — no SCH-003/CDQ-007 issues; sole `file_path` site sanitized inline |

Full rule-by-rule detail for every file lives in `per-file-evaluation.md`.

---

## Key Findings

### RUN27-1 (COV-003) confirmed fixed

`summary-manager.js` committed cleanly across all 9 span-eligible functions in 2 attempts — no partial-commit regression. This closes the two-run-open COV-003 finding from run-25/run-27 specifically; it does not mean the file is otherwise clean — see "New findings from per-file evaluation" below for the three other, unrelated failures found in this same file.

### RUN27-2 (SCH-002) validator fix is working, but only catches the mistake after it happens

The agent reused `commit_story.summary.dates_requested` for weeks and months, reproducing run-27's exact error. Unlike run-27 (where this reuse silently committed), the SCH-002 check fired at reassembly time and rejected the file, forcing a partial commit. This confirms the fix catches **this specific case** — but it is not a general validator-gap closure: per-file evaluation of `git-collector.js` found the near-identical `is_merge`/`parent_count` semantic-duplicate pair (blocked in run-27) ships together in run-28 with zero blocking SCH-002 errors, so enforcement is inconsistent across cases, not uniformly closed. For `summarize.js` specifically, worth flagging to the spiny-orb team as a partial win: validator correctly blocks the `dates_requested` reuse, but it doesn't yet prevent the agent from generating the mistake in the first place, so the file is now partial where it previously fully committed (with a latent semantic bug) — a corresponding prompt-level fix to stop the agent from proposing the bad reuse would convert this from PARTIAL back to a clean SUCCESS.

### RUN27-4 (CDQ-007) — the fix mechanism works, but application is inconsistent (including within one file)

Confirmed on spiny-orb main (`5a0636c`) and via three fully-clean files this run (`journal-paths.js`, `journal-manager.js`, `index.js`): the inline split/filter/pop fallback works and requires no new import. This matches run-27's handoff recommendation for a fix that "applies automatically to all future files." **But per-file evaluation found `summary-manager.js` applies the identical fallback correctly at 3 of 7 `file_path` call sites and ships a raw path at the other 4 — in the same file, with the instrumentation report's own advisory findings flagging all 7.** Separately, `git-collector.js` regressed a different CDQ-007 instance entirely: `commit_story.commit.author` (raw PII, a person's name) was explicitly removed in run-27 after being blocked, and ships again in run-28 — this run's validator only surfaced it as a non-blocking advisory instead of a blocking error. Net: the fix is real and does generalize as a mechanism, but "applies automatically to all future files" was too strong a claim — it depends on the agent choosing to invoke it at every site, and on the validator continuing to flag PII findings as blocking rather than advisory.

### RUN27-3 (SCH-003) — confirmed still open, uncaught, in THREE files, 14 total occurrences

`semconv/agent-extensions.yaml` does not exist on main at all — it's created entirely by this run's instrument branch, so every key in it (including `months_generated_count`/`months_failed_count`) is genuinely new to the schema this run, not carried over from a prior run's registry state. `summarize.js`, processed as file 29 of 32, is the **originating** file for `commit_story.summary.months_generated_count` and `commit_story.summary.months_failed_count` — it declares both as new `int`-typed extensions and immediately misuses them, setting both via `String(result.generated.length)`/`String(result.failed.length)` (2 occurrences) — and separately sets its own `dates_requested` (a `string`-typed key it also originates) as a raw, unstringified number at 2 more sites (`runWeeklySummarize`/`runMonthlySummarize`), for 4 SCH-003 occurrences total in this one file. `auto-summarize.js` (file 31) and `index.js` (file 32), processed later in the same run, correctly reuse these by-then-registered keys as raw numbers — the bug is confined to the file that first invents a key, not every file that touches it afterward. Per-file evaluation of `summary-detector.js` (file 30, also newly inventing its own keys) independently found the identical pattern on **all four** of its own newly-invented `int`-typed keys (`unsummarized_days_count`, `unsummarized_weeks_count`, `summarized_months_count`, `unsummarized_months_count`) — 4 more occurrences. Per-file evaluation of `auto-summarize.js` found 6 more on ITS OWN newly-invented keys: `days_generated_count`/`days_failed_count` (each set twice, on an early-return path and the normal-return path) and `weeks_generated_count`/`weeks_failed_count` — note this is a *different* pair of keys from the `months_*` ones it correctly reuses from `summarize.js`. That's **14 total occurrences across 3 files** this run, every one on a key its own file is originating. This is the exact RUN26-1/RUN27-3 pattern recurring far more widely than any single file's own deep-dive shows. Unlike RUN27-2 (SCH-002), no validator check caught any of these — the shared root cause is that the agent applies a `String()`-wrapping habit specifically to attributes it invents itself, in the same file where it invents them; once a key is already registered from an earlier file in the same run, later files reuse it correctly. No spiny-orb commit specific to issue #1037 was found on main since 2026-09-16, consistent with this being a genuinely unfixed gap. This should be the primary SCH-003 handoff item for run-28 — the scale (3 files, 14 occurrences) is new information beyond what run-27 reported.

**Correction note (three rounds)**: this section originally claimed "no recurrence observed" for `summarize.js`, based on a log-only check that missed the instance because it never appears in `spiny-orb-output.log`'s narrative text — a CodeRabbit CLI review of this PRD branch caught that discrepancy. A second pass then claimed `summary-detector.js` had "no issue found" — also based on an insufficiently thorough source check — until per-file evaluation's line-by-line comparison against the registry found 4 more violations there. A third pass undercounted the scope at "two files" before `auto-summarize.js`'s per-file evaluation surfaced 6 more. Lesson for `lessons-for-prd29.md`, now triply confirmed: fix-verification greps against the log's prose, and even a first-pass source skim, are not sufficient for SCH-003 — every `setAttribute` call in every file touching a registered `int`-typed key must be checked line by line against the registry, not sampled, and every file that declares a new count-shaped attribute is a candidate, not just the ones already flagged by a prior run.

### New findings from per-file evaluation, not visible from the run log alone

Per-file evaluation (full rubric, direct source inspection) surfaced several genuine findings that the run log's summary/narrative gave no indication of:

- **`git-collector.js` SCH-003 FAIL**: `commit_story.git.is_merge` declared `boolean`, set via `String(parentCount > 1)`.
- **`git-collector.js` and `context-integrator.js` CDQ-007 regression (same attribute, two files)**: `commit_story.commit.author` (raw PII, a person's full name) ships unsanitized in both files' committed code — the identical attribute run-27 explicitly removed after being blocked by the same rule. `context-integrator.js` re-exposes the value it receives from `git-collector.js` on its own span, so the regression appears twice per commit journaled. This run's validator downgraded the finding to a non-blocking advisory instead of a blocking error in `git-collector.js`, a validator-severity regression worth flagging to spiny-orb independent of the attribute itself.
- **`summary-manager.js` SCH-003 FAIL**: `commit_story.journal.summary_saved` declared `type: string`, set as a bare boolean at all 14 call sites.
- **`summary-manager.js` CDQ-006 FAIL**: `isRecording()` guards present on only 3 of ~24 `setAttribute` calls, no stated exemption for the rest.
- **`git-collector.js` SCH-002 enforcement inconsistency**: `is_merge`/`parent_count` were blocked as semantic duplicates in run-27; the identical pair ships together with 0 blocking errors in run-28.
- **`git-collector.js` SCH-003 schema self-consistency concern**: `diff_size`'s registry type is now declared `string` (matching what the code emits), not `int` as run-27 had it — suggesting the committed schema type may be back-derived from the code rather than independently validated, which would mask true mismatches rather than catch them.

None of these are visible from `spiny-orb-output.log`'s narrative or the instrumentation `.md` reports' headline stats — all six were found by per-file evaluation agents reading the actual committed source line by line against the schema registry, several independently re-verified via direct `git show`/`grep` before being accepted into this document.

### No overnight prompt pause this run

Total duration 1h 16m matches the actual instrumentation work — no `PROGRESS.md` `[a]ccept/[e]dit/[s]kip` pause or push-confirmation stall (D-7's failure shape from runs 26/27 did not recur).

---

## Caveats on This Write-Up

This `run-summary.md` was reconstructed **after the fact** — the instrument run itself completed on 2026-09-17 ~08:32-09:45 without the PRD's "Collect skeleton documents" or "Pre-run verification" milestones having been completed first (the run happened out of order relative to the PRD's own sequencing). As a result:
- The Datadog pre-run/post-run health checks, push-auth dry-run, and live "is this stalled" monitoring described in the PRD's Pre-run Verification and Evaluation Run milestones were **not performed** — they cannot be done retroactively.
- `trace-artifact.md`'s pre-run `service.instance.id` capture was skipped for the same reason. Post-run Datadog verification can still be attempted going forward.
- Fix-status verification above is based on: (1) direct inspection of `spiny-orb-output.log`'s prose, (2) `git log` on spiny-orb main since 2026-09-16, (3) `git show`/direct reading of the committed instrument-branch source for files touching a registered key, and (4) the `debug-dumps/` source for the partial file. This is a reasonable substitute for the PRD's structured pre-run verification checklist but is not identical to it — and (1) alone was insufficient for SCH-003, per the correction above; (3)/(4) were required to catch it.
