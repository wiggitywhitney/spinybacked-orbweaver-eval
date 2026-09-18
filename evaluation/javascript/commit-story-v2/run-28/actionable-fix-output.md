// ABOUTME: Run-28 actionable fix handoff for the spiny-orb team — rule failures, PR-quality gaps, and process findings.
# Actionable Fix Output — Run-28

Self-contained handoff from evaluation run-28 to the spiny-orb team.

**Run-28 result**: 21/25 (84%) canonical quality — ties run-27's series-low, but via an inverted dimension composition (COV fully recovers to 5/5; CDQ drops to a new series-low 5/7, including the first-ever CDQ-006 failure). 12 committed, 1 partial (`src/commands/summarize.js`), 0 failed, 19 harness-labeled skips (17 confirmed correct, 2 questionable). 48 spans (ties the all-time record despite one fewer committed file than run-27). Cost $7.23 (-23.1% vs run-27, the lowest among the four IS-100/100 runs). Gates 5/5. IS **100/100** (fourth consecutive perfect score, longest streak in the series). Q×F 10.08 (down from run-27's 10.92, driven by file count not quality%). Push/PR **AUTO** (PR #95), second consecutive AUTO success.

**Run-27 → Run-28 delta**: Quality flat (84% → 84%), COV +20pp (4/5 → 5/5 — RUN27-1 fully resolved), SCH flat (2/4 → 2/4, but SCH-003's footprint widened from 2 files to 5 files), CDQ -15pp (6/7 → 5/7 — first-ever CDQ-006 failure plus a new PII regression), files -1 committed (13 → 12, same 1 partial), spans flat (48 → 48), cost -$2.17/-23.1% ($9.40 → $7.23), IS unchanged (100/100 → 100/100, fourth consecutive), Q×F -0.84 (10.92 → 10.08), Push/PR AUTO both runs (second consecutive).

**Target repo**: commit-story-v2 (same as runs 9–28)
**Branch**: `spiny-orb/instrument-1789648132789`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/95
**spiny-orb version**: main (pre-run build confirmed; RUN27-1/COV-003 fix (#1055, delivered via PR #1058) and RUN27-4/CDQ-007 fallback fix (#1035, `5a0636c`) both merged; RUN27-3/SCH-003 fix (#1037) not merged, as expected)

---

## §1. Run-28 Score Summary

| Dimension | Score | Run-27 | Delta | Failures |
|-----------|-------|--------|-------|----------|
| NDS | 2/2 (100%) | 2/2 (100%) | — | — |
| COV | **5/5 (100%)** | 4/5 (80%) | **+20pp** | — (RUN27-1 resolved) |
| RST | 4/4 (100%) | 4/4 (100%) | — | — |
| API | 3/3 (100%) | 3/3 (100%) | — | — |
| SCH | 2/4 (50%) | 2/4 (50%) | — (footprint widened 2→5 files) | SCH-002: summarize.js; SCH-003: summarize.js, summary-detector.js, auto-summarize.js, git-collector.js, summary-manager.js |
| CDQ | **5/7 (71%)** | 6/7 (86%) | **-15pp** | CDQ-006: summary-manager.js (new); CDQ-007: git-collector.js, context-integrator.js, summary-manager.js |
| **Total** | **21/25 (84%)** | **21/25 (84%)** | **—** | **SCH-003+CDQ-006 subset: 6 file-level findings across 5 files, wider than run-27's 4/2 shape for those two rules. Full failure list (also includes SCH-002 and CDQ-007) is in §3.** |
| **Gates** | **5/5** | **5/5** | — | — |
| **Files** | **12 + 1 partial** | **13 + 1 partial** | **-1 committed** | summarize.js |
| **Cost** | **$7.23** | $9.40 | **-$2.17 (-23.1%)** | — |
| **IS** | **100/100** | 100/100 | — (fourth consecutive) | — |
| **Q×F** | **10.08** | 10.92 | **-0.84** | — |
| **Push/PR** | **AUTO (#95)** | AUTO (#94) | Second consecutive AUTO | — |

---

## §2. Prior Findings Assessment

| # | Finding | Priority | Status in Run-28 |
|---|---------|----------|-----------------|
| RUN27-1 | COV-003 — `summary-manager.js`: `isExpectedConditionCatch` catch-shape gap | P1 | **FULLY RESOLVED.** spiny-orb #1055's fix (delivered via PR #1058) holds — all 9 span-eligible functions committed cleanly in 2 attempts, correct error recording across every ENOENT-shape catch. First clean COV sweep since run-26. |
| RUN27-2 | SCH-002 — `summarize.js`/`summary-graph.js`-shape: freshly-declared key contradicts its own meaning within the same file/pass | P2 | **VALIDATOR FIX CONFIRMED WORKING; AGENT BEHAVIOR UNCHANGED.** #1058's fix fired correctly and rejected the reassembly this time (unlike run-27's silent commit) — but the agent still generated the identical mistake, on a different key name (`dates_requested` instead of `dates_count`), forcing `summarize.js` to PARTIAL. Independently, spiny-orb's own acceptance gate hit the same failure shape on `summary-graph.js` on the same day and opened **#1063** — already scoped correctly as a cross-file, granularity-level attribute-key-reuse pattern; this run's `summarize.js` instance is additional corroborating evidence for that issue, not a new finding. |
| RUN27-3 | SCH-003 — `git-collector.js`/`summary-detector.js`: `String(x.length)` vs int-typed key | P1 | **CONFIRMED RECURRING, SIGNIFICANTLY WIDER — now 5 files, 29 failing call sites across 4 distinct mismatch shapes.** See §3 (RUN28-2) below — this is the primary SCH-003 handoff item for run-28, updating open issue **#1037**. |
| RUN27-4 | CDQ-007 — raw path pattern, widened from 1 file to 7 | P1 | **PARTIALLY RESOLVED via #1035's merged fix, but the fix's generalization is unproven beyond one file, and one file remains unresolved.** The inline sanitization fallback (`5a0636c`) is confirmed correct and durable everywhere it fires — but direct source verification found only `journal-paths.js` actually exercises it; the other 5 of the original 7 "resolved" files (`claude-collector.js`, `summarize.js`, `summary-detector.js`, `auto-summarize.js`, `context-integrator.js`) simply don't emit a path attribute this run, so the fix was never invoked in them. `summary-manager.js` remains raw at 4 of its 7 `file_path` sites (correctly sanitized at the other 3, in the same file). #1035 is already closed — see §3 (RUN28-3) for why this needs new tracking rather than reopening it. |
| RUN27-5 | Watch: unrubriced "correct type, wrong registered key" (`journal-manager.js`) | P3 | **RESOLVED, streak broken.** This run's `journal-manager.js` writes the reflection count to `commit_story.journal.entries_count` (a generic, unscoped key), not `quotes_count`. No third instance found elsewhere. The standing Unrubriced Findings category remains available but unused this run. |
| Log attribute undercounting | `attributesCreated` counts only new schema extensions, not total `setAttribute` calls | P2 | **Not independently re-verified this run.** #1036 remains open (Short-term roadmap tier) — see §4 for this run's specific contribution to that issue's evidence (29 SCH-003 call sites entirely invisible to the PR's Schema Changes section). |
| RUN21-6 | Agent notes vs. committed code divergence | Watch | **New instance found this run** (`context-capture-tool.js`, see §3 RUN28-4) — first new signal since run-21. #927 remains open. |
| IS SPA-001/SPA-002 | Structural, resolved via threshold/architecture | Structural | **IS 100/100 for a fourth consecutive run confirms both remain non-issues for this target.** No action needed. |

---

## §3. New Run-28 Rule Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN28-1 | CDQ-006 — `summary-manager.js`: `isRecording()` guard applied inconsistently within one file | P2 | Code Quality (new) |
| RUN28-2 | SCH-003 — widened to 5 files, 29 failing call sites across 4 distinct mismatch shapes | P1 | Schema Compliance |
| RUN28-3 | CDQ-007 — `summary-manager.js`'s remaining 4-of-7 raw path sites, now untracked after #1035's closure | P1 | Code Quality |
| RUN28-4 | CDQ-007 — PII regression (`commit_story.commit.author`) with a validator severity downgrade (blocking → advisory) | P1 | Code Quality / Validator Stability |
| RUN28-5 | Watch: `context-capture-tool.js` coverage regression with notes-vs-reasoning divergence | P2 | Coverage / Process |

### RUN28-1: CDQ-006 — `summary-manager.js` Inconsistent `isRecording()` Guard Application

**File**: `src/managers/summary-manager.js`
**Outcome**: First CDQ-006 failure recorded in this run series (runs 2–28).

**Pattern that triggered the failure**: Only 3 of the file's ~24 `setAttribute` calls — the 3 `file_path` sites that use the inline sanitization `.split(/[\/]/).filter(Boolean).pop()` computation — are wrapped in `if (span.isRecording())`. The other ~21 calls (`summary_saved`, `entry_date`, `entries_count`, and the file's other 4 `file_path` sites) are unguarded, with no COV-001 entry-point exemption available (this file has no CLI/top-level entry-point boundary) and no stated rationale for the split.

**Why this is new**: Every prior run in the series scored CDQ-006 PASS. This is the first observed instance of a file applying the guard convention inconsistently *within itself* — deciding per-call-site rather than per-file whether the surrounding computation is expensive enough to guard.

**Recommended fix**: Either (a) a stricter CDQ-006 check that flags within-file inconsistency directly — a file guarding some `setAttribute` calls but not others with no stated complexity-based rationale — or (b) clearer prompt guidance that the isRecording-guard decision should be made once per file (or per attribute-complexity-class), not ad hoc per call site.

**Expected outcome if fixed**: `summary-manager.js` (and any future file with a mix of cheap and expensive attribute computations) either guards every `setAttribute` call uniformly or has a stated, checkable rationale for guarding only some.

**Note on rubric scoping ambiguity**: `docs/language-extension-plan.md`'s per-file evaluation surfaced that CDQ-006's COV-001-entry-point exemption (an agent-reasoning pattern narrated in run-27's `rubric-scores.md`, never formally specified) was applied inconsistently across this run's own per-file sections — one file's evaluation invoked the exemption to pass CDQ-006 outright, another's FAIL reasoning didn't depend on entry-point status at all. This didn't change `summary-manager.js`'s own FAIL verdict (its reasoning cites "no stated exemption basis," not entry-point status), but the exemption's scope should be written down explicitly before the next run's per-file evaluation, so this doesn't need re-litigating each time. Flagged here as a rubric-methodology gap on the eval side, not a spiny-orb defect.

---

### RUN28-2: SCH-003 — Widened to 5 Files, 29 Failing Call Sites, 4 Distinct Mismatch Shapes

**Files and call-site counts**: `src/commands/summarize.js` (4 call sites: 2 of the original shape + 2 of the opposite-direction shape), `src/utils/summary-detector.js` (4 call sites, original shape), `src/managers/auto-summarize.js` (6 call sites, original shape), `src/collectors/git-collector.js` (1 call site, a third shape), `src/managers/summary-manager.js` (14 call sites, a fourth shape — one rule violation manifesting at every one of the attribute's call sites, not 14 separate findings). **Total: 5 files, 29 failing call sites, 4 distinct declared-vs-emitted type-mismatch shapes.**

**Outcome**: All 5 files committed or partially committed cleanly on this axis — no SCH-003 rejection fired for any of the 29 call sites below.

**Pattern that triggered the failure — original shape, now in 3 files, 12 call sites**: Each of `summarize.js`, `summary-detector.js`, and `auto-summarize.js` invents its own `int`-typed registry key(s) in the same file/pass, then wraps the numeric value in `String(...)` before `setAttribute`:

```javascript
// summarize.js
span.setAttribute('commit_story.summary.months_generated_count', String(result.generated.length));
span.setAttribute('commit_story.summary.months_failed_count', String(result.failed.length));

// summary-detector.js (×4: unsummarized_days_count, unsummarized_weeks_count, summarized_months_count, unsummarized_months_count)
span.setAttribute('commit_story.summary.unsummarized_days_count', String(unsummarizedDays.length));

// auto-summarize.js (×6: days_generated_count/days_failed_count each set on two code paths, plus weeks_generated_count/weeks_failed_count)
span.setAttribute('commit_story.summary.days_generated_count', String(generated.length));
```

Live traces confirm several of these reach Datadog as quoted strings (`unsummarized_days_count: "0"`, `days_generated_count: "0"`, `days_failed_count: "0"`).

**Pattern that triggered the failure — new opposite-direction shape, 2 call sites, `summarize.js` only**: `commit_story.summary.dates_requested` is declared `type: string` and correctly wrapped in `String(...)` at its originating call site (`runSummarize`), but the same key is set as a **raw, unstringified number** at the two other call sites that reuse it (`weeks.length` in `runWeeklySummarize`, `months.length` in `runMonthlySummarize`) — these are also the RUN28-shape-of-RUN27-2 (SCH-002) sites already tracked under #1063, so this is a second, compounding type error layered on top of that same-key-reuse semantic error, on the same two lines.

**Pattern that triggered the failure — one already-known instance, 1 call site**: `git-collector.js`'s `commit_story.git.is_merge` (declared `boolean`) is set via `String(parentCount > 1)` — live-trace confirmed as the quoted string `"false"` alongside the correctly-typed `commit_story.git.parent_count: 1` on the same span.

**Pattern that triggered the failure — a fourth shape, 1 rule violation across 14 call sites**: `summary-manager.js`'s `commit_story.journal.summary_saved` is declared `type: string` but set as a bare **boolean literal** (not a string, not a `String()`-wrapped value) at all 14 of its call sites.

**Why this confirms the validator gap is still open, and is now bidirectional**: RUN26-1/RUN27-3's diagnosis (no check catches `setAttribute(key, String(...))` against a numeric/boolean-typed key) explains 13 of the 29 call sites (the original shape's 12, plus `is_merge`'s 1). It does not explain `summary_saved` (a raw boolean into a `string`-typed key — no `String()` wrapper involved at all) or the second `dates_requested` shape (a raw number into a `string`-typed key). All four shapes share one root cause — no check compares a `setAttribute` call's actual value-expression runtime type against its key's declared registry type, regardless of which direction the mismatch runs or whether coercion is involved.

**Recommended fix**: Update **#1037** (already open, Short-term roadmap tier) — the original acceptance criteria ("flag `setAttribute(key, String(...))` where key is `int`/`float`/`bool`-typed") is too narrow for what run-28 found. Broaden the check to compare every `setAttribute` call's value expression against its key's declared type in both directions: a `String(...)`-wrapped numeric/boolean value against a numeric/boolean-typed key, AND a bare numeric or boolean literal/expression against a `string`-typed key. This is a deterministic AST shape comparison in every direction, not a semantic judgment call.

**Expected outcome if fixed**: This failure class — in any of its four observed shapes — stops recurring project-wide rather than being closed one file, one direction, at a time.

---

### RUN28-3: CDQ-007 — `summary-manager.js`'s Remaining Raw Path Sites, Now Untracked

**File**: `src/managers/summary-manager.js`
**Outcome**: Committed cleanly (2 attempts, all 9 functions) — but 4 of its 7 `file_path` `setAttribute` call sites ship a raw, unsanitized path; the other 3 correctly apply the inline sanitization fallback.

**Why this needs new tracking rather than reopening #1035**: #1035 ("CDQ-007: reconcile self-identified-but-unapplied fixes with the no-new-imports prompt constraint") is **closed** — its merged fix (`5a0636c`, plus CodeRabbit-finding follow-ups `0180486`/`dc59703`) is confirmed correct and durable everywhere it's actually invoked. The problem this run isn't that the fix is wrong; it's that one of the 7 originally-affected files applies it at only 3 of its 7 call sites, in the same file, with the same fix mechanism available and already in use nearby. Filing this against the closed #1035 would either get lost (closed issues aren't revisited per this eval process) or misrepresent the fix itself as broken.

**Recommended fix**: Same fix mechanism, applied exhaustively. The most durable framing: rather than relying on the agent to decide, per call site, whether to invoke the inline split/filter/pop fallback, either (a) prompt guidance that explicitly states "every path-like attribute in a file gets the fallback, with no partial application," or (b) a validator check that, once it observes the fallback pattern used correctly anywhere in a file, flags any other raw-path `setAttribute` call in that same file as inconsistent.

**Note on the fix's generalization claim**: Per direct source verification, only `journal-paths.js` (of the 6 files reported "resolved" in run-summary/rubric-scores) actually exercises the sanitization fallback this run — the other 5 don't emit a path attribute at all, so the fix was never invoked in them. `journal-paths.js` and `summary-manager.js` are therefore the only two files this run where the fix mechanism and a live call site coexist — `journal-paths.js` applies it correctly at its one site, while `summary-manager.js` applies it correctly at only 3 of its 7 sites and ships the other 4 raw. Whoever picks this up should treat "6 of 7 files clean" with that caveat — the evidence the fix generalizes across the fleet rests on a single fully-correct file plus one partially-correct one, not six independent confirmations.

**Expected outcome if fixed**: `summary-manager.js` applies the fallback at all 7 of its `file_path` sites, closing CDQ-007's last known gap from the original 7-file RUN27-4 finding.

---

### RUN28-4: CDQ-007 — PII Regression With a Validator Severity Downgrade

**Files**: `src/collectors/git-collector.js`, `src/integrators/context-integrator.js` — both carry `commit_story.commit.author` (a real person's full name).
**Outcome**: Both committed cleanly. Live traces confirm the raw name reaches Datadog unredacted on both files' spans (`context-integrator.js` re-exposes the same value it receives from `git-collector.js`).

**Pattern that triggered the failure**: This exact attribute was explicitly removed from `git-collector.js` in run-27 after CDQ-007 blocked it as PII. It ships again in run-28 — but this time the run's own validator surfaces it only as a non-blocking advisory line item, not a blocking error.

**Why this is two findings, not one**: (1) The agent regressed a fix it had previously applied — this alone would be a normal recurrence. (2) Separately, and more concerning for the validator's reliability: the identical attribute, identical code pattern, went from a **blocking** canonical failure in run-27 to a **non-blocking advisory** in run-28, with no code change to `git-collector.js`'s CDQ-007 logic identified as the cause. This evaluation did not determine whether the validator's version, configuration, or rule inputs differ between the two runs — that comparison is the next step, not something this eval run can conclude on its own.

**Recommended fix**: (1) Standard regression follow-up — reinforce the PII-attribute-name guidance so `commit.author` (and similarly-named person-identifying fields) stay excluded once fixed. (2) Higher priority: investigate the severity-classification instability directly — diff the validator's CDQ-007 logic/config/rule-set between the commit that produced run-27's blocking result and the commit that produced run-28's advisory-only result, to determine whether this is validator nondeterminism, a silent configuration change, or something else. If the same code pattern can flip between blocking and advisory with no corresponding rule change, that's a reliability concern independent of this specific attribute.

**Expected outcome if fixed**: `commit_story.commit.author` (or an equivalent hashed/redacted representation) stops shipping raw, and the severity-classification question has a documented answer rather than remaining an open hypothesis.

---

### RUN28-5 (Watch): `context-capture-tool.js` Coverage Regression With Notes-vs-Reasoning Divergence

**File**: `src/mcp/tools/context-capture-tool.js`
**Not scored against the rubric** — no committed code exists to evaluate this run (lands as a "correct skip," 0 spans).

**Pattern**: This file was committed with 2 spans in run-27 (`saveContext`'s own async I/O, plus the MCP handler entry point). In run-28, the agent's own thinking trace reconstructs the identical run-27 analysis nearly verbatim — flags `saveContext` as needing a COV-004 span, works through the RST-004 unexported-orchestrator exception, drafts a schema extension name — and then the final "Agent notes" reverse course with "All exported functions are synchronous... no async I/O to trace." This is a scope error: `saveContext` being unexported puts it outside the *exported* API surface the statement literally describes, but its async filesystem I/O still needs coverage consideration under RST-004/COV-004, which the agent's own preceding reasoning had already worked through correctly before the final notes dropped it.

**Relationship to #927**: #927 (open, "agent notes diverging from committed code") tracks cases where the committed code doesn't match what the notes claim about it. This is a related but distinct shape: here, the agent's own *intermediate reasoning* contradicts its own *final summary*, with no committed code at all to diff against — the divergence is entirely within the agent's own output, not between the output and reality.

**Recommended fix**: Flagged as a watch item, not a fix recommendation — this is one instance (the third file family showing some form of notes divergence, but the first showing intermediate-reasoning-vs-final-notes divergence specifically rather than notes-vs-code divergence). Worth tracking under #927 or as a related watch item if it recurs, but not yet enough signal for a specific fix.

---

## §4. PR Artifact Quality Findings

### [P1] Every SCH-003/CDQ-006 Canonical Failure (5 Rule Findings, 29 SCH-003 Call Sites Plus 1 CDQ-006 Finding) Is Absent From Advisory Findings

None of this run's SCH-003 or CDQ-006 failures — `git-collector.js`'s `is_merge`, `summary-manager.js`'s `summary_saved` and CDQ-006 finding, `summary-detector.js`'s 4-call-site SCH-003, `auto-summarize.js`'s 6-call-site SCH-003, or `summarize.js`'s SCH-003 — appears anywhere in the PR's Advisory Findings section. This is a wider instance of the same structural gap already tracked in **#1036** (open, Short-term tier): the PR-generation step only surfaces round-trip validator history, and none of these findings triggered a blocking round-trip. Contributing this run's evidence to #1036: 29 individual SCH-003 type-mismatch call sites with zero visibility in the PR, the largest single-run contribution to that issue's evidence base so far.

### [P1] Advisory Contradiction Rate Regressed Sharply: 8% → 46%

6 of the PR's 13 advisory line-items are outright false positives this run (`claude-collector.js`, `journal-manager.js`, `summarize.js`, `summary-detector.js`, `auto-summarize.js`'s CDQ-007 citations, and `index.js`), and a 7th (`summary-manager.js`'s CDQ-007) is correct on 4 of its 9 cited lines and wrong on the other 5 — a false-positive/mistargeted rate of 46%, back near run-11/12's 30-45% range after run-27's 8%. Nearly every false positive shares one shape: CDQ-007 firing on a plain integer-count `setAttribute` call with no path or PII character at all (`sessions_count`, `entries_count`, `unsummarized_days_count`, etc.). Two cases (`journal-manager.js`, `summary-manager.js`'s 5 mistargeted lines) cite line numbers that don't even point at the attribute the rule is nominally about. Given the volume and the consistent shape (integer counts, not paths or names), this looks like a rule-template misfire pattern specific to CDQ-007's line-citation logic when a raw-identifier-shaped variable name (`.length`, `_count`) is nearby — worth investigating as a shared root cause across all 6-7 false positives rather than as unrelated one-offs. Related to **#1060** (open, Medium-term tier — CDQ-007's sub-checks collapsing into one undifferentiated bullet); this run's evidence suggests the mistargeting problem may be broader than just the rendering/grouping issue #1060 currently scopes.

### [P2] Function-Count Denominator for the Partial File Is Now Sourced From a Real Log Line, But Still Misleading

`summarize.js`'s "partial (7/7 functions)" line in the PR is lifted directly from `spiny-orb-output.log`'s function-level-fallback stage ("7/7 functions instrumented") — an improvement over run-27's "12/14," which corresponded to no real count at all. But it's still misleading: 7 is the fallback stage's own internal denominator (the functions it attempted at that one stage), not the file's true function total (9: 3 span-eligible, all 3 committed, plus 6 sync helpers, 2 of which fall outside the fallback pass's count entirely). **Recommended fix**: when reporting a partial file's function ratio in the PR summary, use the file's actual total exported-function count as the denominator, not an internal fallback-stage count — same underlying recommendation as run-27's #1036-adjacent finding, now with a second, differently-shaped example.

### [P3] Registry Version Discrepancy, Now Worse in Kind — No Real Prior File to Have a Version

`semconv/agent-extensions.yaml` does not exist on `main` at all (confirmed: `git show main:semconv/agent-extensions.yaml` → does not exist). The PR's "Baseline: 0.1.0 → Head: 0.1.0" framing implies no change when there was no prior file to have a version — third consecutive run with a version-reporting discrepancy (runs 26-27 had a real prior file whose version simply didn't move; this run has no prior file at all). **Recommended fix (low priority)**: distinguish "file is new this pass" from "file exists but version unchanged" in the reported baseline/head framing.

---

## §5. Process and Eval-Infrastructure Observations (Not spiny-orb Findings)

These are eval-side findings, included for completeness but explicitly out of scope for spiny-orb component fixes.

### Fix-verification-by-log-grep is not sufficient for SCH-002/SCH-003 — confirmed across three correction cycles this run

The first pass of `run-summary.md` checked `spiny-orb-output.log`'s prose and reported RUN27-3 as "no recurrence." A CodeRabbit CLI review caught the actual `summarize.js` instance, present in the committed source but never spelled out in the log's narrative sections. A second pass then claimed `summary-detector.js` had "no issue found," corrected only after per-file evaluation's line-by-line source-vs-registry comparison found 4 more violations. A third pass undercounted the scope at "two files" before `auto-summarize.js`'s per-file evaluation surfaced 6 more. Not a spiny-orb defect — a durable eval-process lesson, already captured in `lessons-for-prd29.md` for cascading into PRD #29's template: SCH-002/SCH-003 fix-verification requires per-file evaluation's direct-source methodology, not a log-prose check, treated as the actual verification step rather than a redundant follow-up to it.

### Delegated per-file evaluation subagents lack Datadog MCP access

All ~14 background per-file evaluation subagents this session lacked Datadog MCP access, unlike the coordinating session — the trace-supplementation step (cross-checking findings against live traces) was silently skipped by every subagent and had to be redone as a separate coordinating-session pass afterward. Already captured in `lessons-for-prd29.md` for PRD #29's D-2 protocol.

### PII exposure risk within the eval's own working documents while verifying a PII finding

A real person's name appeared unredacted in this run's own working documents while confirming the `commit_story.commit.author` finding live via Datadog — caught by a CodeRabbit review, not proactively. Already captured in `lessons-for-prd29.md` for PRD #29's D-2 protocol (redact live-trace PII values in the same edit that adds them as evidence).

### No overnight interactive-prompt pause this run

Total duration 1h 16m matches the actual instrumentation work — no `PROGRESS.md` `[a]ccept/[e]dit/[s]kip` pause or push-confirmation stall (D-7's failure shape from runs 26-27 did not recur).

---

## §6. Notable Positives

**IS 100/100 for a fourth consecutive run — longest streak in the series.** Confirms the per-target SPA-001 threshold calibration and `SimpleSpanProcessor`/`shutdownAndExit()` architecture continue to make this target structurally immune to both SPA-001 and SPA-002, across four runs with meaningfully different IS-scoring-session span counts (31, 20, 47, 31 for runs 25-28's `SPA-001` measurement, respectively — a separate count from the 48-span canonical per-file-evaluation total, since the two are captured in different sessions).

**RUN27-1 (COV-003) genuinely and fully resolved.** COV returns to a clean 5/5 sweep, the first since run-26 — spiny-orb #1055's `isExpectedConditionCatch` fix holds cleanly across all 9 of `summary-manager.js`'s span-eligible functions, closing a finding that had recurred across runs 25 and 27.

**RUN27-4 (CDQ-007)'s core fix mechanism is confirmed correct and durable everywhere it fires.** The inline sanitization fallback lands exactly the way run-27's handoff asked for (no new import required) — a good example of a recommendation landing in the shape it was requested.

**Push/PR AUTO for a second consecutive run (PR #95).** The automated push/PR path is now stable across two runs following run-26's one-run manual-recovery interruption.

**Cost drops to $7.23, the lowest among the four IS-100/100 runs (-23.1% vs run-27).** Consistent with the pre-run projection that validator-level fixes (rather than added generation-time reasoning) hold cost down.

**Total spans (48) tie the all-time record despite one fewer committed file than run-27.** `summary-manager.js`'s clean COV-003 fix (9 spans, up from 7 in run-27's partial state) and `summary-detector.js`'s 9 spans absorb the loss.

---

## §7. Carry-Forward Tracker (Open Items Entering Run-29)

| ID | Title | Priority | Status | Runs Open | spiny-orb Issue |
|----|-------|----------|--------|-----------|-----------------|
| RUN28-1 (CDQ-006) | `summary-manager.js` isRecording-guard inconsistency within one file | P2 | Open — new this run, no tracking issue yet | 1 | — (needs filing) |
| RUN28-2 (SCH-003) | Widened to 5 files, 29 failing call sites, now confirmed bidirectional (String()-wrapped AND raw-into-string) | P1 | Open — update #1037's scope | 3 (run-26 origin, run-27 2 files, run-28 5 files) | #1037 (open, Short-term) |
| RUN28-3 (CDQ-007) | `summary-manager.js`'s remaining 4-of-7 raw path sites | P1 | Open — new tracking needed, #1035 is closed | 3 (recurring subset of RUN27-4) | — (needs filing; do not reopen #1035) |
| RUN28-4 (CDQ-007) | PII regression + validator severity downgrade (blocking → advisory) | P1 | Open — new this run, no tracking issue yet | 1 (regression) + severity-instability angle unprecedented | — (needs filing) |
| RUN28-5 (Watch) | `context-capture-tool.js` notes-vs-reasoning divergence | P2 (Watch) | Open — related to but distinct from #927 | 1 | #927 (related, open) |
| RUN27-2 (SCH-002) | Same-key reuse across daily/weekly/monthly-parallel functions | P2 | Open, already correctly scoped and tracked | 2 (run-27, run-28, plus a same-day independent acceptance-gate discovery) | #1063 (open, Medium-term) |
| PR summary omits SCH-003/CDQ-006 findings | 5 rule findings, 29 SCH-003 call sites, invisible in Advisory Findings this run | P2 | Open — run-28 contributes largest evidence set yet | 3+ | #1036 (open, Short-term) |
| CDQ-007 advisory quality — false-positive rate and undifferentiated severity | 46% contradiction rate this run, all on integer-count attributes | P2 | Open — possible shared root cause with #1060, worth investigating together | 3+ | #1060 (open, Medium-term) |
| RUN21-6 | Agent notes vs. committed code divergence | Watch | New adjacent instance this run (RUN28-5) | 8 | #927 (open) |
| IS SPA-001/SPA-002 | Structural, resolved via threshold/architecture | Structural | IS 100/100 for fourth consecutive run confirms both remain non-issues | Structural | #929 (closed), #930 (closed) — both already closed on spiny-orb main; carried in this tracker as a structural watch item only, no reopening needed |
| Registry version discrepancy | Now worse in kind — no real prior file, not just an unmoved version | P3 | Open — cosmetic, not blocking | 3 | — |

**Closed/resolved entering run-29**: RUN27-1 (COV-003) — fully resolved, #1055 closed. RUN27-5 (unrubriced correct-type-wrong-key) — no third instance, streak broken.

---

## §8. Score Projection — Run-29

| Scenario | Assumption | Projected Score | Q×F |
|----------|------------|-----------------|-----|
| All active fixes land (SCH-003 bidirectional check, CDQ-006 consistency check, `summary-manager.js`'s remaining CDQ-007 sites, PII severity investigation resolved) | All 6 run-28 failure findings resolved | **25/25 (100%)** | **~13.0+, near or at the all-time record** |
| Only #1037's SCH-003 fix lands (bidirectional) | SCH-003 stops recurring; SCH-002/#1063, CDQ-006, CDQ-007 residuals recur | **23/25 (92%)** | **~12.5** |
| Only CDQ-006/CDQ-007 guidance lands, SCH-003 recurs | `summary-manager.js` cleans up its guard/path inconsistencies; SCH-003 recurs in new files | **23/25 (92%)** | **~12.5** |
| No fixes land | Same failure classes recur, possibly in new files given the pattern of "originating file invents a key, misuses it" | **21/25 (84%) or lower** | **~10.0 or lower** |

**Key insight**: Run-28 is the first run in the series where a genuinely closed issue (#1055/RUN27-1) delivered a full, clean fix with zero caveats, while run-27's two other active fixes (#1058/SCH-002, #1035/CDQ-007) both landed as real-but-incomplete progress — the validator now catches SCH-002's mistake without stopping the agent from making it, and CDQ-007's fix mechanism works everywhere it's exercised but isn't exercised everywhere it should be. SCH-003 (#1037) remains the single largest lever for run-29: it alone accounts for 5 of the run's 6 distinct failures and drove the widest single-issue footprint (29 call sites) recorded in this series, and its scope needs updating before the next fix attempt, since the original narrow "String()-wrapped numeric" framing undercounts what run-28 found.

**Push/PR path**: AUTO succeeded cleanly for a second consecutive run (PR #95). No spiny-orb-side risk identified for run-29.

**IS path**: IS 100/100 for four consecutive runs establishes this as the stable expected baseline for this target. No specific IS risk identified for run-29.

**Cost note**: Run-28's $7.23 (-23.1% vs run-27) continues the post-run-26 normalization trend. If #1037's broadened SCH-003 check and the CDQ-006/CDQ-007 fixes land as validator-level checks (reducing retry rounds rather than adding generation-time reasoning steps), cost should hold in the $5-9 range for run-29.

---

## Appendix: Cross-Document Audit Notes

During the pre-write audit of run-28's artifacts, the following were reconciled across `run-summary.md`, `rubric-scores.md`, `failure-deep-dives.md`, `pr-evaluation.md`, `baseline-comparison.md`, and `trace-artifact.md`:

- **SCH-003 call-site counts are consistent across all five source documents, using call sites as the single counting unit**: 12 call sites of the original `String(x.length)`-vs-int shape (4 in `summary-detector.js`, 6 in `auto-summarize.js`, 2 in `summarize.js`) plus 2 of the opposite-direction `dates_requested` shape (both in `summarize.js`) plus 1 (`git-collector.js`'s `is_merge`) plus 14 (`summary-manager.js`'s `summary_saved`, all one rule violation) — **29 total call sites across 5 files**, matching `rubric-scores.md`'s Failure Summary table and `baseline-comparison.md`'s Score Projection Validation section. An earlier draft of this section mixed call-site counts with rule-violation counts inconsistently (stating "14" in some places and "16" in one place) — a CodeRabbit CLI review of this document caught the inconsistency; corrected to state call sites as the primary unit throughout, with rule-violation groupings (4 distinct mismatch shapes) called out separately rather than folded into the same number.
- **The "6 of 7 files resolved" claim for CDQ-007/RUN27-4 is stated with the correct caveat everywhere it appears** (`rubric-scores.md`'s "Resolved from Run-27" table, `baseline-comparison.md`'s Key Changes section, and this document's §3 RUN28-3) — only `journal-paths.js` actually exercises the sanitization fallback; the other 5 pass by omission. This required two prior CodeRabbit-caught corrections during run-28's own write-up (per `lessons-for-prd29.md`) before landing at the current, accurate framing; carried forward correctly into this document.
- **The original RUN27-4 7-file list is quoted verbatim from run-27's own `rubric-scores.md`** (`claude-collector.js, context-integrator.js, journal-paths.js, summarize.js, summary-detector.js, auto-summarize.js, summary-manager.js`) rather than reconstructed from memory, per the `lessons-for-prd29.md` correction note about this exact list getting corrupted in earlier drafts this run.
- **`trace-artifact.md`'s span-count figures are IS-scoring-session counts (31 spans this run), not the canonical 48-span total** — these are two different measurements from two different sessions (a live production window vs. the eval's own controlled run), and this document's §6 Notable Positives corrects an initial drafting slip that conflated them (the parenthetical note in that section flags the distinction rather than silently using the wrong number).

This document has since been reviewed twice by CodeRabbit CLI on the PRD branch (2026-09-18) — the counting-unit inconsistency and PII/severity attribution findings from those passes are already corrected above; see the git history of this file for what changed.

---

**Spoken summary was provided to Whitney on 2026-09-18 before this document was finalized as the handoff.** Handoff confirmed; the spiny-orb team triaged this document into 4 new issues (#1065–#1068) and 5 corroborating updates to existing open issues (#1037, #927, #1036, #1060, #1063) — verified directly against `gh issue view`/`gh issue list`.
