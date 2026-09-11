// ABOUTME: Run-27 actionable fix handoff for the spiny-orb team — rule failures, PR-quality gaps, and process findings.
# Actionable Fix Output — Run-27

Self-contained handoff from evaluation run-27 to the spiny-orb team.

**Run-27 result**: 21/25 (84%) canonical quality — a new series low since run-6, breaking the runs-23–26 oscillation between 23/25 and 24/25. 13 committed, 1 partial (`summary-manager.js`), 0 failed, 18 correct skips, 48 spans (ties run-24's all-time record), $9.40 cost. Gates 5/5. IS **100/100** (third consecutive perfect score). Q×F 10.92 (lowest since run-21). Push/PR **AUTO** (PR #94) — first AUTO success since run-25, no manual recovery needed.

**Run-26 → Run-27 delta**: Quality -8pp (92% → 84%), COV -20pp (5/5 → 4/5 — new COV-003 failure), SCH -25pp (3/4 → 2/4 — one recovered, two new), CDQ flat nominally (6/7 → 6/7, but CDQ-007's footprint widened from 1 file to 7), files -1 committed +1 partial (14 clean → 13+1p), spans +7 (41 → 48), cost -$1.75/-15.7% ($11.15 → $9.40), IS unchanged (100/100 → 100/100, third consecutive), Q×F -1.96 (12.88 → 10.92), Push/PR back to AUTO (was MANUAL recovery in run-26, see run-26 D-7 — that was never a spiny-orb defect).

**Target repo**: commit-story-v2 (same as runs 9–27)
**Branch**: `spiny-orb/instrument-1788361335787`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/94
**spiny-orb version**: main (pre-run build confirmed at v2.0.0)

---

## §1. Run-27 Score Summary

| Dimension | Score | Run-26 | Delta | Failures |
|-----------|-------|--------|-------|----------|
| NDS | 2/2 (100%) | 2/2 (100%) | — | — |
| COV | **4/5 (80%)** | 5/5 (100%) | **-20pp** | COV-003: summary-manager.js |
| RST | 4/4 (100%) | 4/4 (100%) | — | — |
| API | 3/3 (100%) | 3/3 (100%) | — | — |
| SCH | **2/4 (50%)** | 3/4 (75%) | **-25pp** | SCH-002: summarize.js; SCH-003: git-collector.js, summary-detector.js |
| CDQ | 6/7 (86%) | 6/7 (86%) | — (footprint widened) | CDQ-007: 7 files |
| **Total** | **21/25 (84%)** | **23/25 (92%)** | **-8pp** | **4 rule-level failures, 11 rubric-scored file-level instances** |
| **Gates** | **5/5** | **5/5** | — | — |
| **Files** | **13 + 1 partial** | **14 (clean sweep)** | **-1 committed, +1 partial** | summary-manager.js |
| **Cost** | **$9.40** | $11.15 | **-$1.75 (-15.7%)** | — |
| **IS** | **100/100** | 100/100 | — (third consecutive) | — |
| **Q×F** | **10.92** | 12.88 | **-1.96** | — |
| **Push/PR** | **AUTO (#94)** | MANUAL (#91, not a defect — run-26 D-7) | First AUTO since run-25 | — |

---

## §2. Prior Findings Assessment

| # | Finding | Priority | Status in Run-27 |
|---|---------|----------|-----------------|
| RUN26-1 | SCH-003 — `journal-manager.js`: `reflections_count` declared `int`, emitted as string | P1 | **PARTIALLY RESOLVED.** The type mismatch is gone — the value is now set as a raw int with no `String()` wrapper. But it writes into `commit_story.journal.quotes_count`, a pre-existing key registered to mean developer-quote count, not reflections. The fix sidestepped the validator gap by choosing a different, already-correctly-typed key rather than closing the gap that let `String(...)` wrapping through in the first place — confirmed by two independent recurrences of the exact original pattern elsewhere in this run (see RUN27-3 below). |
| RUN26-2 | CDQ-007 — `journal-paths.js`: raw filesystem path, `basename` self-identified and not applied | P2 | **STILL UNRESOLVED, and widened from 1 file to 7.** The identical self-identified-and-declined reasoning ("`basename` isn't imported, I'll keep the raw value and flag it as a known limitation") now recurs independently in `claude-collector.js`, `context-integrator.js`, `commands/summarize.js`, `utils/summary-detector.js` (×9 call sites), `managers/auto-summarize.js`, and `managers/summary-manager.js`, in addition to `journal-paths.js` itself. (`journal-manager.js`'s equivalent `file_path` attribute surfaces the same agent note but is not counted here — its sole call site hardcodes `basePath = '.'`, a structural guarantee against the other seven's live PII/path exposure.) |
| Log attribute undercounting | `attributesCreated` figures count only new schema extensions, not total attributes set | P2 | **Not independently re-verified this run** beyond the pre-run check confirming issue #1036 is still open (no run-summary language change landed). Per-file evaluation did re-confirm the underlying pattern for `context-integrator.js`, `context-capture-tool.js`, `journal-paths.js`, and `summarize.js` — all report low or 0 new-extension counts while carrying 1–13 real attributes via reused registry keys. |
| RUN21-6 | Agent notes vs. committed code divergence | Watch | **No new instances identified in run-27 per-file evaluation.** #927 open, seventh run with no new signal. |
| IS SPA-001/SPA-002 | Structural, resolved via threshold/architecture | Structural | **IS 100/100 for a third consecutive run confirms both remain non-issues for this target.** #929 (SPA-001 research spike) and #930 (SPA-002 systemic CLI fix) both still open at the systemic level; no per-target action needed. |

---

## §3. New Run-27 Rule Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN27-1 | COV-003 — `summary-manager.js`: partial-commit recurrence, same validator gap as run-25 | P1 | Coverage |
| RUN27-2 | SCH-002 — `summarize.js`: freshly-declared key contradicts its own meaning within the same file | P2 | Schema Compliance |
| RUN27-3 | SCH-003 — `git-collector.js` and `summary-detector.js`: RUN26-1's pattern recurs in two new files | P1 | Schema Compliance |
| RUN27-4 | CDQ-007 — raw path pattern widens from 1 file to 7 | P1 | Code Quality |
| RUN27-5 | Watch: unrubriced "correct type, wrong registered key" finding (`journal-manager.js`) — no rule covers this failure mode | P3 | Rubric Gap |

### RUN27-1: COV-003 — `summary-manager.js` Partial-Commit Recurrence

**File**: `src/managers/summary-manager.js`
**Outcome**: 7 of 9 exported async functions committed; `readDayEntries` and `readMonthWeeklySummaries` were rejected.

**Pattern that triggered the failure**: Two structurally distinct ENOENT-handling catch shapes exist in this codebase:

```javascript
// Shape A — flagged by the validator (this run's rejected functions)
if (err.code === 'ENOENT') return;
throw err;

// Shape B — correctly accepted as graceful degradation
if (err.code !== 'ENOENT') throw err;
```

`failure-deep-dives.md`'s direct source comparison across all three of this file's ENOENT-handling functions confirms the validator's `isExpectedConditionCatch` check flags Shape A uniformly (any ENOENT-pattern-check-plus-throw combination) without distinguishing it from Shape B. `readMonthWeeklySummaries` contains both shapes in one function, and only the Shape-A portion is cited by the validator — direct confirmation this is a shape-detection gap, not a semantic judgment call.

**Why run-26 looked clean**: Run-26 committed all 9 functions cleanly, which was read at the time as RUN25-1 being resolved. It was not — `failure-deep-dives.md` establishes that run-26 simply didn't happen to generate any function using Shape A. This run did (`readDayEntries`, `readMonthWeeklySummaries`), and the same rejection recurred, with a different function pair than run-25's.

**Recommended fix**: `isExpectedConditionCatch` (or its equivalent COV-003 check) needs to distinguish the two catch shapes structurally — a `return`-then-implicit-fallthrough vs. an explicit throw-on-non-match — rather than flagging any ENOENT-pattern-plus-throw combination as needing error recording. This is a deterministic AST shape distinction, not a semantic judgment call.

**Expected outcome if fixed**: `summary-manager.js` (and any other file using Shape A for graceful degradation) commits its full function set cleanly and consistently across runs, rather than oscillating based on which shape the agent happens to generate.

---

### RUN27-2: SCH-002 — `summarize.js` `dates_count` Contradicts Its Own Declaration

**File**: `src/commands/summarize.js`
**Outcome**: Committed cleanly in 3 attempts — no SCH-002 blocking error surfaced at generation time.

**Pattern that triggered the failure**: `commit_story.journal.dates_count` is a schema extension **freshly declared by this file, in this same instrumentation pass** — not a pre-existing key. `runSummarize` declares and uses it correctly for a date count. `runWeeklySummarize`, in the same pass, reuses that same key for `weeks.length` — a week count:

```javascript
// runSummarize — correct usage, matches the key's own declared meaning
span.setAttribute('commit_story.journal.dates_count', dates.length);

// runWeeklySummarize — same key, different meaning, same file/pass
span.setAttribute('commit_story.journal.dates_count', weeks.length);
```

A consumer reading `dates_count` on the weekly span sees a mislabeled value. This is narrower than `journal-manager.js`'s unrubriced finding (an older, already-registered key repurposed across files for an unrelated domain concept, see RUN27-5) — here the file contradicts a key's meaning against its own declaration, three lines away, in the same run.

**Why the validator missed it**: SCH-002's existing check ("no invented duplicate/synonym key") passed correctly — no new synonym key was created. What it doesn't check is whether the one new key it approved is then used consistently with the meaning it was declared for. The declaration step and the per-function attribute-assignment step aren't cross-checked against each other within a single file/pass.

**Recommended fix**: Extend SCH-002 (or add a new check) to verify that every `setAttribute` call against a newly-declared extension key within the same file/pass is semantically consistent with that key's declared meaning — not just that no duplicate/synonym key was invented.

**Expected outcome if fixed**: `dates_count` (or a correctly-scoped replacement, e.g. a separate `weeks_count`-style key for the weekly path) resolves cleanly; SCH-002 stays passing for future runs where an agent declares one key and reuses it for a different concept within the same pass.

---

### RUN27-3: SCH-003 — RUN26-1's Pattern Recurs in Two New Files

**Files**: `src/collectors/git-collector.js` (`commit_story.git.diff_size`), `src/utils/summary-detector.js` (`commit_story.journal.weeks_count`, ×3 call sites)
**Outcome**: Both committed cleanly (2 and 1 attempts respectively) — no SCH-003 blocking error surfaced for either.

**Pattern that triggered the failure**: Both files declare an `int`-typed schema extension, then wrap the numeric value in `String(...)` before `setAttribute` — the identical pattern RUN26-1 found in `journal-manager.js`:

```javascript
span.setAttribute('commit_story.git.diff_size', String(diff.length));       // git-collector.js
span.setAttribute('commit_story.journal.weeks_count', String(weeks.size));  // summary-detector.js, ×3
```

Live traces confirm both reach Datadog as quoted strings (`diff_size: "2139"`, `weeks_count: "11"`).

**Why this confirms the validator gap is still open**: RUN26-1's "fix" (in `journal-manager.js`) avoided the pattern by mapping the value onto a different, already-correctly-typed existing key — it did not touch the validator. The underlying gap (no check catches `setAttribute(key, String(...))` against an `int`/`number`-typed registry attribute) was never closed; it was only sidestepped in the one file it was first raised against. This run demonstrates the same generation-time behavior recurring independently, unprompted, in two files that had no connection to RUN26-1's fix.

**Recommended fix**: Same as RUN26-1's original recommendation, now with two more confirmed instances as evidence: add a static AST check that flags `setAttribute(key, String(...))` where `key` resolves to a registry attribute with a numeric/boolean declared type. This is a deterministic pattern-match, not a semantic judgment call, and is now confirmed to recur across unrelated files rather than being a one-off.

**Expected outcome if fixed**: This exact failure class stops recurring project-wide, rather than being fixed one file at a time by accident (as happened with `journal-manager.js`, which just moved the mistake to a different-but-still-broken key).

---

### RUN27-4: CDQ-007 — Raw Path Pattern Widens From 1 File to 7

**Files**: `journal-paths.js` (RUN26-2 original), plus `claude-collector.js`, `context-integrator.js`, `commands/summarize.js`, `utils/summary-detector.js` (×9 call sites), `managers/auto-summarize.js`, `managers/summary-manager.js` (×17 call sites)
**Outcome**: All committed. Every instance shares the identical agent-generation-time reasoning.

**Pattern that triggered the failure**: The shared `commit_story.context.repo_path` attribute (and `journal-paths.js`'s equivalent `file_path`) is set unconditionally from an unconstrained caller-supplied `basePath`/`repoPath`/`filePath` parameter with no `basename()` transformation, in every file that sets it except `journal-manager.js`. Live traces confirm the exposure is real — a full local developer-machine path reaches Datadog unredacted. Every one of the seven instances carries the same self-identified reasoning: `basename` from `node:path` is named as the correct fix and declined because it isn't already imported in that specific file.

**Why this crossed from "one advisory" to "seven confirmed failures"**: RUN26-2 established the escalation condition last run — a CDQ-007 finding becomes a canonical FAIL (not advisory) when the agent's own generation-time reasoning names a specific, cost-free remediation and declines to apply it. That condition held independently, file by file, seven times this run. `journal-manager.js` is the one file where the condition does **not** hold: its sole call site hardcodes `basePath = '.'`, so the raw-path risk is structurally latent, not live — confirmed by direct source inspection, and excluded from this count.

**Recommended fix**: There is no single shared function to patch — these are seven separate call sites. Two options: (a) each of the seven affected modules imports `basename` from `node:path` and applies it to its own unconstrained path parameter; or (b) all seven migrate to a shared helper that performs the transformation once, so future files reuse it instead of each independently declining the same fix. Per RUN26-2's original guidance: whichever representation is chosen must actually satisfy CDQ-007 outright (replacing the raw-path attribute), not add a second sanitized attribute alongside the still-present raw one.

**Recommended fix — prompt guidance (secondary, addresses the widening specifically)**: The per-file framing of this decision appears to be part of why it recurs independently seven times rather than being caught once. If the agent's generation-time reasoning is structured to check "does this exact self-identified-and-declined pattern already exist elsewhere in this run/codebase," a single instance could prevent the same declined fix from repeating file after file.

**Expected outcome if fixed**: CDQ-007 returns to 7/7 project-wide (not just for `journal-paths.js`), and the pattern doesn't reappear the next time a new file happens to receive an unconstrained path parameter.

---

### RUN27-5 (Watch): Unrubriced "Correct Type, Wrong Registered Key" Finding

**File**: `src/managers/journal-manager.js`
**Not a canonical rule failure** — flagged as a rubric gap, no existing spiny-orb rule targets this failure mode.

**Pattern**: RUN26-1's fix mapped a reflection count onto `commit_story.journal.quotes_count`, a key registered to mean the number of developer quotes extracted from AI dialogue. The type is correct (raw int, SCH-003 passes); the semantics are wrong (a `discoverReflections()` result written into a key that means something else entirely). No existing rule checks whether a *value being written to an already-registered key* matches that key's registered meaning — SCH-002 checks for invented duplicate/synonym keys, SCH-003 checks type, and neither checks this specific case: reusing an existing, correctly-typed key for the wrong concept.

**Relationship to RUN27-2**: Same underlying failure shape (a schema key's registered/declared meaning silently violated), but scoped differently — RUN27-2 (SCH-002, scored) is a same-file, same-pass declaration-vs-usage contradiction on a freshly-declared key; this finding is a cross-file, cross-run reuse of an older, pre-existing key for an unrelated concept. The two are related enough that a single validator extension might catch both, but they are not the same rule violation as currently scoped.

**Recommended fix**: Consider a new rule (or an SCH-002 extension) that flags `setAttribute` calls against a pre-existing registered key whose value's likely domain/semantic origin (e.g. the calling function's name, `commit_story.journal.reflections_count` vs. `discoverReflections()`) doesn't match the key's registered description. This is inherently a lower-confidence, more judgment-dependent check than RUN27-2's or RUN27-3's AST-level fixes — flagged as a P3 watch item, not a P1/P2 fix recommendation, because a reliable detection mechanism isn't obvious.

**Expected outcome if addressed**: `quotes_count` (or whatever key run-28 maps `reflections_count` onto) carries a value matching its registered meaning, closing the loop RUN26-1 opened without fully resolving.

---

## §4. PR Artifact Quality Findings

### [P1] Two Live-Confirmed Type Mismatches Absent From PR Advisory Findings

The PR's Advisory Findings section (13 line-items, 4808 total advisory findings per the live-check summary) never mentions either SCH-003 instance (RUN27-3) or the SCH-002 instance (RUN27-2) — because none of the three files needed a blocking validator round-trip specifically for these attributes, so nothing existed downstream for the advisory generator to surface. This is the same structural gap identified in run-26 for `reflections_count`; it now recurs for three different attributes across two different files in the same run, confirming it's a durable limitation of what the PR-generation step surfaces (only round-trip validator history), not a one-off omission. **Recommended fix**: add a post-commit validation pass, distinct from the pre-commit validator, that checks committed attribute types and same-pass key reuse against the registry after the fact — something that runs even when generation itself reported clean success.

### [P1] Advisory Severity Miscalibration — 7 Confirmed Failures Flattened Into Routine Boilerplate

All 7 CDQ-007 self-identified-fix instances (RUN27-4) that per-file evaluation scored as canonical FAIL appear in the PR body only as uniform, undifferentiated low-severity advisory language — identical to how genuinely non-blocking advisories are framed elsewhere in the same PR. A reviewer reading only the PR body cannot distinguish "this is fine to leave as-is" from "this is fine to leave as-is, except these seven, where the agent already found the fix and declined it." This is the same gap flagged in run-26 (then for 1 file), now confirmed at 7x the scale. **Recommended fix**: when generation-time reasoning names a concrete, cost-free remediation for a CDQ-007 (or similar advisory-tier) finding and explicitly declines to apply it, surface that specific finding with distinct language (e.g. "self-identified fix available, not applied") rather than folding it into generic advisory boilerplate.

### [P2] `summary-manager.js`'s Per-File Results Row Reports a Function Count That Doesn't Exist

The PR's own Per-File Results table lists `summary-manager.js` as "partial (12/14 functions)." The file has 9 exported async functions total, not 14, and the real split is 7 committed / 2 rejected. Unlike the `context-capture-tool.js` span-count figure (stale but derived from a real prior count), "12/14" corresponds to no real count for this file at all — an actual PR-generation defect, not a since-corrected staleness. **Recommended fix**: verify the per-file function-count denominator against the file's actual exported-function count before writing the summary row, particularly for partial-commit files where an incorrect count actively misleads a reviewer about both how many functions exist and how many shipped.

### [P3] Advisory Hallucination Rate Improved Sharply (44% → 8%)

Only 1 of 13 advisory line-items is outright incorrect this run (`journal-graph.js`'s CDQ-007 flag on lines containing no PII or path data — confirmed false positive via direct source inspection) — down from run-26's 44%, driven by an SCH-004 hallucination and an ignored CDQ-006 exemption that both cleared. **No action needed** — flagged as a positive trend to watch, not a fix. The dominant remaining failure mode is omission and severity-calibration (see the two P1 findings above), not hallucination.

### [Watch] Registry Version Discrepancy, Second Consecutive Run

The registry version reports unchanged (0.1.0 → 0.1.0) despite 14 new attributes and ~48 new span IDs landing this run. Same discrepancy flagged in run-26. Not a blocking defect, but a reviewer skimming only the version line would incorrectly conclude the schema didn't change. **Recommended fix (low priority)**: bump the registry's reported version (even a patch-level bump) whenever new schema extensions are added in a run, so the version line itself signals that a schema change occurred.

---

## §5. Process and Eval-Infrastructure Observations (Not spiny-orb Findings)

These are eval-side findings, included for completeness but explicitly out of scope for spiny-orb component fixes.

### Overnight Interactive-Prompt Pause Invisible in the Piped Log (New Instance of D-7's Shape)

The run's actual instrumentation work (32 files) completed in well under an hour; the 21h 21m total duration was an unattended `PROGRESS.md` `[a]ccept/[e]dit/[s]kip` confirmation prompt sitting overnight. The prompt text never reached `spiny-orb-output.log` when piped through `tee` — the log jumps directly from the last push-related line to `Completed in 21h 21m 7.7s` with no visible trace of the interactive block. This is a new instance of the same *shape* of problem D-7 already documents (an unattended run pausing at a live prompt looks like a hang), but via a different prompt (`PROGRESS.md` accept/edit/skip) than D-7's `Proceed? [y/N]` push confirmation. Not a spiny-orb defect — an eval-process lesson, already cascaded to `docs/language-extension-plan.md` step 3 and `lessons-for-prd28.md`.

### Datadog Trace-Provenance Attribute Correction (D-6 → D-10)

Post-run verification initially checked instrument-branch presence against `git.commit.sha` (per the PRD's own then-current milestone text and Decision D-6), and got a false "not yet observed" negative. `git.commit.sha` on these spans is the *journaled* commit (domain data — which commit's diff commit-story summarized), not the running code's own branch identity. Re-checking against `vcs.ref.head.revision` confirmed instrument-branch traffic directly. This is now corrected as PRD Decision D-10, and the milestone text has been updated. Not a spiny-orb finding — flagged here only because it affects how future runs' trace-provenance evidence should be labeled (see `docs/language-extension-plan.md` step 6).

### IS Scoring Required Filtering the Shared `eval-traces.json`

The persistent `otelcol-contrib` collector never truncates `evaluation/is/eval-traces.json` — by this run it held 4,759 spans across multiple targets and sessions since 2026-08-03. Scoring the raw file directly returned a false 70/100 from another target's spans mixed in. Filtering to this run's own 47 spans by service name and time window restored the expected 100/100. This is a Claude Code eval-infrastructure gap, not a spiny-orb instrumentation defect — already documented as PRD Decision D-11 and a permanent step in `~/.claude/rules/is-scoring-gotchas.md`.

---

## §6. Notable Positives

**IS 100/100 for a third consecutive run.** Confirms the per-target SPA-001 threshold calibration (PR #142) and the `SimpleSpanProcessor`/`shutdownAndExit()` architecture continue to make this target structurally immune to both SPA-001 and SPA-002, now across three runs with meaningfully different span counts (31, 20, 47).

**Advisory hallucination rate down sharply, 44% → 8%.** The one remaining false positive is isolated and easily verified as incorrect; the dominant remaining gap is omission/severity-calibration, which is more tractable to fix (surfacing existing findings correctly) than hallucination (generating false ones).

**Push/PR returns to fully automated (PR #94), first time since run-25.** Run-26's "manual recovery" was never a spiny-orb defect (confirmed via run-26 D-7) — this run's clean AUTO success is simply the expected behavior holding, not a fix landing.

**Cost normalizes back toward the run-23–25 range ($9.40, -15.7% vs run-26's $11.15 high).** Driven by fewer 3-attempt files (2 this run vs. 3 in run-26), reversing run-26's broadly elevated retry volume.

**Total spans (48) tie run-24's all-time record** despite one fewer fully-committed file than run-24 — attribute/span richness held up even as the file-completion rate dipped.

---

## §7. Carry-Forward Tracker (Open Items Entering Run-28)

| ID | Title | Priority | Status | Runs Open | spiny-orb Issue |
|----|-------|----------|--------|-----------|-----------------|
| RUN27-1 (COV-003) | `summary-manager.js` partial-commit recurrence — `isExpectedConditionCatch` validator gap | P1 | Open — recurring, same root cause as run-25, absent only in run-26 by chance | 2 (run-25, run-27) | — |
| RUN27-2 (SCH-002) | `summarize.js` `dates_count`/weeks mismatch — declared-key meaning not cross-checked against later usage in same pass | P2 | Open — new this run | 1 | — |
| RUN27-3 (SCH-003) | RUN26-1's `String(x.length)`-vs-`int`-key pattern recurs in `git-collector.js`, `summary-detector.js` | P1 | Open — validator gap never closed, only sidestepped in the original file | 2 (recurring, different files each time) | — |
| RUN27-4 (CDQ-007) | Raw path pattern widened from 1 file (RUN26-2) to 7 | P1 | Open — 7 independent call sites, no shared fix applied yet | 2 (widened) | #1035 |
| RUN27-5 (Watch) | Unrubriced "correct type, wrong registered key" — `journal-manager.js` `quotes_count` | P3 | Open — no existing rule covers this; related to but distinct from RUN27-2 | 1 | — |
| Log attribute undercounting | `attributesCreated` counts only new schema extensions, not total attributes set | P2 | Open — no run-summary language change confirmed this run | 3+ | #1036 |
| RUN21-6 | Agent notes vs. committed code divergence | Watch | No new instances in run-27. #927 open. | 7 | #927 |
| IS SPA-001/SPA-002 | Structural, resolved via threshold/architecture | Structural | IS 100/100 for third consecutive run confirms both remain non-issues for this target | Structural | #929 (open), #930 (open) |
| Registry version discrepancy | Version reports unchanged despite new attributes/spans, second consecutive run | P3 | Open — cosmetic, not blocking | 2 | — |

**Closed/partially-closed this run**: RUN26-1's original SCH-003 instance (`journal-manager.js`'s type mismatch) — the *type* dimension is confirmed fixed, but replaced by RUN27-5's unrubriced semantic-mismatch finding on the same attribute. Not closed outright — carried forward as RUN27-5.

---

## §8. Score Projection — Run-28

| Scenario | Assumption | Projected Score | Q×F |
|----------|------------|-----------------|-----|
| All four active fixes land (COV-003 shape distinction, SCH-002 same-pass check, SCH-003 `String()`-coercion check, CDQ-007 basename fix across 7 files) | All four failure classes resolved | **25/25 (100%)** | **~14.0**, ties the all-time record target |
| Only the two P1 schema/coverage fixes land (COV-003, SCH-003) | `summary-manager.js` commits fully; `String()`-coercion pattern no longer catches SCH-003 | **23-24/25 (92-96%)** | **~13.0-13.4** |
| Only CDQ-007 guidance lands | 7-file raw-path pattern resolved; COV-003/SCH-002/SCH-003 recur | **22/25 (88%)** | **~12.1** |
| No fixes land | Same failure classes recur | **21/25 (84%) or lower** | **~10.9 or lower**, depending on whether new instances of RUN27-5's semantic-mismatch shape appear elsewhere |

**Key insight**: Run-27's regression is driven by two failure classes RUN26-1/RUN26-2 explicitly aimed at (SCH-003 and CDQ-007, both recurring/widening despite partial fixes) plus one failure class neither run-27 goal targeted (COV-003, a pure recurrence of a known run-25 gap) plus one genuinely new failure (SCH-002). Unlike run-26's two independent, narrowly-scoped findings, run-28 needs four separate fixes to reach 25/25 — but three of the four (COV-003, SCH-002, SCH-003) are deterministic AST-level checks with clear, narrow fix specifications, and the fourth (CDQ-007) has a known root cause with two concrete implementation options already specified.

**Push/PR path**: AUTO succeeded cleanly this run (PR #94), first time since run-25. No spiny-orb-side risk identified for run-28.

**IS path**: IS 100/100 for three consecutive runs establishes this as the stable expected baseline for this target. No specific IS risk identified for run-28.

**Cost note**: Run-27's $9.40 (-15.7% vs run-26) reversed run-26's cost spike, driven by fewer 3-attempt files. If the four failure classes above are addressed via validator-level fixes (which reduce retry rounds rather than adding them), cost should hold in the $7-10 range for run-28; if fixes require additional generation-time reasoning steps, cost could rise instead. No strong directional prediction either way.

---

## Appendix: Cross-Document Audit Notes

During the pre-write audit of run-27's artifacts, 10 outstanding CodeRabbit findings from earlier sessions were reviewed. 8 were real and corrected in place (`run-summary.md` ×3, `per-file-evaluation.md` ×2, `rubric-scores.md` ×1, `prds/153-evaluation-run-27.md` ×1, `eval-traces-run27.json` ×1 — redacted `host.name`). 1 was already resolved in a prior pass (PROGRESS.md's error count). 2 were assessed and skipped as misdiagnoses rather than applied:

- **`eval-traces-run27.json`'s NDJSON format** ("not valid JSON — records aren't wrapped in a single top-level array"): this is the intentional, established format both the shared `eval-traces.json` file exporter and `score-is.js` use (one `ExportTraceServiceRequest` per line). `is-score.md`'s own methodology note already documents this explicitly and warns that converting it to a single array would break re-scoring. Not applied.
- **Per-file-evaluation.md's trace-supplement timestamps** (claimed stale, "should use 2026-09-09T18:05:19Z"): that timestamp belongs to a completely unrelated Datadog query — the IS-scoring milestone's own app-invocation span, captured six days after the actual eval run. The per-file-evaluation trace supplements correctly cite the eval run's own traces from 2026-09-03T12:23:xx, independently corroborated by `trace-artifact.md`'s own post-run verification at the same timestamp. Applying the suggested fix would have replaced accurate citations with an unrelated timestamp. Not applied.

---

**Spoken summary provided to Whitney before this document was finalized — see conversation.**
