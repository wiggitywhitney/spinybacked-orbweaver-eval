// ABOUTME: PRD for JS Evaluation Run-28 — COV-003 recurrence, SCH-002/SCH-003 AST checks, and CDQ-007 shared-helper verification.
# PRD #28: JS Evaluation Run-28: commit-story-v2 — COV-003 Recurrence + SCH-002/SCH-003 AST Checks + CDQ-007 Shared-Helper Verification

**Status:** Ready
**Created:** 2026-09-11
**GitHub Issue:** #156
**Depends on:** PRD #153 (run-27 complete, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-27 scored 21/25 (84%), tying the series low with run-6 and run-19 and breaking the runs-23–26 oscillation between 23/25 and 24/25. Gates 5/5. IS 100/100 (third consecutive perfect score). Q×F 10.92 (lowest since run-21). Cost $9.40 (-15.7% vs run-26). Push/PR AUTO (PR #94), first AUTO success since run-25.

Four rule-level findings drove the regression, none fully resolved by run-27's own primary goals:

1. **RUN27-1 (P1, COV-003)** — `summary-manager.js` reverted to the run-25 partial-commit failure shape (7/9 functions) after run-26 had a clean pass by chance. Confirmed as the same `isExpectedConditionCatch` validator gap identified in run-25: `if (err.code === 'ENOENT') return; throw err;` is flagged, `if (err.code !== 'ENOENT') throw err;` is accepted, and one function containing both shapes only has the flagged shape cited.

2. **RUN27-2 (P2, SCH-002)** — `summarize.js`'s freshly-declared `dates_count` key (meaning date count) is reused in the same file/pass for a week count, violating its own declared semantics. SCH-002 already covers cross-checking a newly-declared key's usage against its own meaning — this is a rule-enforcement gap, not an absence of a rule.

3. **RUN27-3 (P1, SCH-003)** — RUN26-1's `String(x.length)`-vs-int-typed-key pattern recurs in two new files (`git-collector.js`, `summary-detector.js`), even though the original instance (`journal-manager.js`) is confirmed type-fixed. The validator gap was sidestepped in one file, not closed.

4. **RUN27-4 (P1, CDQ-007)** — the raw-path self-identified-fix pattern (RUN26-2) widened from 1 file to 7, all sharing one root cause (missing `basename()` import). Tracked in spiny-orb issue #1035, which correctly identifies the real gap as PR-summary surfacing, not agent behavior. Run-27 gave the spiny-orb team feedback recommending they commit to a shared-helper fix now, since a per-file fix pattern is what let this go from 1 file to 7 in the first place.

5. **RUN27-5 (Watch, unrubriced)** — `journal-manager.js`'s `reflections_count` now emits as a true int (SCH-003 type check passes) but is mapped onto the pre-existing `quotes_count` key, which is registered to mean developer-quote count. Correct type, semantically wrong key — no existing rule covers this. Run-27 formalized a standing "Unrubriced Findings" category in the rubric template for this failure shape, rather than inventing a new rule ID, to keep dimension max-scores stable across runs.

**Status update (2026-09-16, superseding the roadmap-sequencing caveat below at PRD creation time)**: RUN27-1 (COV-003) and RUN27-2 (SCH-002) are **already fixed and merged** — spiny-orb PR #1058 (merged 2026-09-12) closed both #1055 and #1056, sequenced ahead of the Python provider (PRD #373) per the "Path to Python" gate, specifically *because* they were rule-logic bugs a new language provider would otherwise inherit. The fix is at the validator level with tests (`cov003.ts`, `sch002.ts` in both JS and TS providers) — `isExpectedConditionCatch` now recognizes both ENOENT-catch shapes as equivalent, and SCH-002 now compares the base source identifier feeding each call site of a newly-declared key within the same file/pass. The PR's own description confirms the cross-run reuse case (RUN27-5/journal-manager.js's `quotes_count`) was investigated and found infeasible to detect reliably — independently validating this PRD's own choice of a standing Unrubriced Findings category over a new rule ID. **Run-28 should now expect COV-003 and SCH-002 to pass** — a recurrence of either would itself be a new finding (the fix not actually working), not an expected outcome.

RUN27-3 (SCH-003, #1037) and RUN27-4 (CDQ-007, #1035) remain genuinely open with no merged fix as of 2026-09-16 — both still sit in the "Short-term (after Go)" ROADMAP.md tier, gated behind the Go language provider. **These two should still be expected to recur in run-28 exactly as filed**; a recurrence is not a surprise or a sign the team dropped the handoff. (Original framing, retained for context: per spiny-orb's own `docs/ROADMAP.md` as of PRD creation, all four failure classes sat behind the "Path to Python" sequencing gate with nothing scheduled to land before run-28 — that assessment held for RUN27-3/RUN27-4 but was overtaken by events for RUN27-1/RUN27-2 one day later.)

Full detail: `evaluation/javascript/commit-story-v2/run-27/actionable-fix-output.md` §3, §7, §8.

### Primary Goals

Verify whether RUN27-1 through RUN27-4 are resolved:
- `summary-manager.js` commits cleanly across all 9 functions (COV-003 passes)
- `summarize.js` does not reuse a newly-declared key across contradictory meanings (SCH-002 passes)
- No file emits `String(x.length)` against an int-typed registry key (SCH-003 passes)
- The 7-file raw-path CDQ-007 pattern is resolved via whichever representation the spiny-orb team confirms — check specifically whether the fix took the shared-helper route (per run-27's feedback) or a per-file approach (which would predict an 8th instance). **Scoring**: this rule applies to every raw-path site found in run-28, not just the original 7 — including any newly discovered site outside that baseline. Any site where the raw-path issue is actually resolved (basename applied or equivalent) scores CDQ-007 PASS at that site regardless of whether the fix arrived via a shared helper or a per-file edit — a per-file fix is not itself a failure. Flag per-file fixes as a watch item (predicting a future recurrence) rather than scoring them lower than a shared-helper fix. Only a site where the raw-path issue is still present, or only partially addressed, scores FAIL — apply this uniformly whether the site is one of the original 7 or a newly discovered one.

### Secondary Goals

- **RUN27-5 watch**: does `journal-manager.js`'s wrong-registered-key pattern recur elsewhere, or is a new instance found in a different file? Two instances already exist across run-27 (`journal-manager.js`, `summarize.js`'s SCH-002-scored variant) — a third would strengthen the case for the standing Unrubriced Findings category.
- **Registry version discrepancy**: still reports unchanged (0.1.0→0.1.0) despite new attributes/spans, second consecutive run. Check for any fix.
- **RUN21-6 watch** (seventh run): any new agent notes vs. committed code divergence. spiny-orb issue #927.
- **IS score**: does 100/100 hold for a fourth consecutive run?
- **Cost trend**: does cost hold in the $7-10 range (per run-27's projection), given the four failure classes are validator-level fixes rather than added generation-time reasoning?

### Run-27 Scores (baseline for run-28 comparison)

| Dimension | Run-27 | Run-26 | Run-25 | Run-24 |
|-----------|--------|--------|--------|--------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) |
| COV | **4/5 (80%)** | 5/5 (100%) | 4/5 (80%) | 5/5 (100%) |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) |
| SCH | **2/4 (50%)** | 3/4 (75%) | 4/4 (100%) | 3/4 (75%) |
| CDQ | 6/7 (86%) | 6/7 (86%) | 7/7 (100%) | 6/7 (86%) |
| **Total** | **21/25 (84%)** | **23/25 (92%)** | **24/25 (96%)** | **23/25 (92%)** |
| **Gates** | **5/5** | **5/5** | **5/5** | **5/5** |
| **Files** | **13+1p** | **14 (clean sweep)** | **13+1p** | **14 (0p, 0f)** |
| **Cost** | **$9.40** | **$11.15** | **$7.38** | **~$3.70** |
| **Push/PR** | **AUTO (#94)** | **MANUAL (#91, not a defect)** | **AUTO (#86)** | **AUTO (#81)** |
| **IS** | **100/100** | **100/100** | **100/100** | **80/100** |
| **Q×F** | **10.92** | **12.88** | **12.48** | **12.88** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN27-1: `summary-manager.js` COV-003 partial-commit recurrence — same `isExpectedConditionCatch` validator gap as run-25 | RUN25 / RUN27 | 2 runs | P1 — spiny-orb issue #1037 (folded in) |
| RUN27-2: `summarize.js` SCH-002 — `dates_count` reused for a week count in the same pass | RUN27 | 1 run | P2 — spiny-orb issue #1056 |
| RUN27-3: SCH-003 `String()`-vs-int-key pattern recurs in `git-collector.js`, `summary-detector.js` | RUN26-1 / RUN27 | 2 runs (different files each time) | P1 — spiny-orb issue #1037 (folded in) |
| RUN27-4: CDQ-007 raw-path pattern, now 7 files, one shared root cause (missing `basename()` import) | RUN26-2 / RUN27 | 2 runs (widened) | P1 — spiny-orb issue #1035 |
| RUN27-5 (Watch): unrubriced "correct type, wrong registered key" — `journal-manager.js` `quotes_count` | RUN27 | 1 run | P3 — spiny-orb issue #1056; needs a third instance to justify a dedicated rule ID |
| Log attribute undercounting — `attributesCreated` counts only new schema extensions, not total attributes set | RUN25 (implicit) / RUN26 (confirmed) | 3+ runs | P2 — spiny-orb issue #1036, no run-summary language fix confirmed |
| RUN21-6: Agent notes vs committed code divergence | RUN21-6 | 7 runs | Watch — spiny-orb issue #927 |
| Registry version discrepancy: version reports unchanged despite new attributes/spans | RUN27 (second consecutive) | 2 runs | P3 — cosmetic, not blocking |
| IS SPA-001: INTERNAL span count structural | Structural | 13 runs | Structural — threshold 55 (PR #142); research spike #929 still open |

---

## Solution Overview

Same four-phase structure as runs 5–27.

1. **Pre-run verification** — Verify RUN27-1 through RUN27-4 fix status; check whether the CDQ-007 fix took the shared-helper route; check for attribute-count language changes and registry-version-discrepancy fixes since run-27
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with per-agent methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #29

### Two-Repo Workflow

Same as runs 9–27.

| Repo | Path | Role |
|------|------|------|
| **commit-story-v2** (target) | `~/Documents/Repositories/commit-story-v2` | spiny-orb instruments this repo |
| **spinybacked-orbweaver-eval** (evaluation) | `~/Documents/Repositories/spinybacked-orbweaver-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent |

### Eval Branch Convention

This PRD document merges to `main` so `/prd-start` can pick it up.

The **evaluation execution branch** created by `/prd-start` from main **never merges to main**. Before closing with `/prd-done`, run the "Copy artifacts to main" milestone. When `/prd-done` runs at completion, close the issue without merging or deleting the eval branch.

---

## Success Criteria

1. `summary-manager.js` commits cleanly across all 9 functions — COV returns to 5/5 (per D-13, spiny-orb PR #1058 already fixed this; a recurrence here would itself be a new finding, not an expected outcome)
2. `summarize.js` does not violate its own declared key semantics (per D-13, spiny-orb PR #1058 already fixed this; a recurrence here would itself be a new finding, not an expected outcome)
3. No file emits a value whose declared registry type doesn't match its runtime type anywhere in the run — this covers both the `String(x.length)`-vs-int-typed-key shape (RUN27-3/SCH-003, #1037, remains genuinely open per D-13) and any other declared-vs-emitted type mismatch (e.g. a boolean value set against a string-typed key, or vice versa). SCH contributes 4/4 only if this criterion and #2 both hold. **Result (run-28)**: criterion FAILED — confirmed in `per-file-evaluation.md`. Two separate tallies make up this criterion's failure, kept distinct because they're different mismatch shapes: **(a) 14 occurrences across 3 files** — the `String(x.length)`-vs-int-typed-key shape (RUN27-3/SCH-003, #1037, remains genuinely open per D-13) accounts for 12 of the 14 (`summarize.js`: 2, `summary-detector.js`: 4, `auto-summarize.js`: 6), and the opposite-direction mismatch accounts for the remaining 2 (both in `summarize.js`, `dates_requested` declared `string` set as a raw, unstringified number). **(b) 2 additional, separately-tracked findings not counted in the 14** — a same-class-but-opposite-direction mismatch in `summary-manager.js` (`commit_story.journal.summary_saved` declared `string`, always set as a boolean, at 14 call sites) and a `boolean`-declared-emitted-as-`string` mismatch in `git-collector.js` (`commit_story.git.is_merge`, at 1 call site) — the latter confirmed live via Datadog trace (see `trace-artifact.md`). Tally (b) is therefore 2 findings totaling 15 call sites (14 + 1), not 14. Both tallies count call sites (per `per-file-evaluation.md`'s own accounting) — the distinction between (a) and (b) is not "findings vs. call sites," it's that tally (a)'s 14 sites are spread across 3 files and multiple distinct newly-invented keys (mostly 1-2 sites per key), while tally (b)'s 14-of-15 sites are all the same single key (`summary_saved`, newly declared this pass, per `per-file-evaluation.md`'s SCH-002 row) repeated throughout one file.
4. The 7-file CDQ-007 raw-path pattern is resolved at every site — CDQ returns to 7/7 if the issue is actually fixed at all 7 sites, whether via a shared helper or per-file edits (a per-file fix still counts as PASS at each site; it's a watch item for a future 8th instance, not a scoring penalty). CDQ stays below 7/7 only if any site's raw-path issue remains unresolved, or if the team documents an intentionally accepted advisory instead of a fix
5. Quality score ≥ 21/25 (84%, no regression from run-27); 25/25 if all four fixes land (Q×F ~14.0, all-time record target)
6. Push/PR succeeds automatically (per run-27's precedent; no spiny-orb-side risk identified)
7. Per-file span counts verified by post-hoc counting, cross-checked against source for any file the run summary reports as "0 attributes"
8. All evaluation artifacts generated from canonical methodology (per-agent approach, batches of 5, with the run-27 reconciliation pass applied before the first CodeRabbit review)
9. Both user-facing checkpoints completed (Findings Discussion + handoff pause with spoken summary, including roadmap-tier verification)
10. IS ≥ 100/100 (runs 25, 26, and 27 all hit 100/100; this is now the expected baseline, not a stretch target)

---

## Milestones

- [ ] **Step 0 — Bootstrap reading.** Before proceeding with any other milestone, read these documents in order:
  1. `docs/language-extension-plan.md` — completely. Pay particular attention to: (a) step 9.5 (SPA-001 calibration note — commit-story-v2 threshold is 55, set by PR #142); (b) step 9 (IS scoring protocol); (c) step 6 (per-file trace supplement procedure, D-2 batch-of-5 approach, the run-27 reconciliation pass, and the CDQ-007/SCH-002 disagreement tests); (d) step 3 (approval-prompt check — before treating an apparently stalled run as failed, check whether it's paused at a live interactive prompt, including the `PROGRESS.md` `[a]ccept/[e]dit/[s]kip` prompt found in run-27); (e) step 8 (the standing "Unrubriced Findings" category for failures with no matching rule ID); (f) step 11 (handoff-confirmation roadmap-tier check); (g) step 10 (attribute-count trend caution).
  2. `prds/153-evaluation-run-27.md` — the immediately prior commit-story-v2 run PRD; use it as a style reference for the IS scoring milestone format and per-file evaluation structure.
  3. `evaluation/javascript/commit-story-v2/run-27/actionable-fix-output.md` — drives the current run's goals. RUN27-1 through RUN27-4 are the primary goals for this run; §7/§8 (carry-forward tracker and score projection) inform pre-run verification and success criteria.
  **Do not mark this complete until you have read all three documents.**

- [ ] **Cross-run process review** *(Step 0.5 — before any other milestones except Step 0)* — Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. Check whether any other eval target (taze, release-it, content-manager) has a completed run more recent than run-27 (`evaluation/javascript/commit-story-v2/run-27/actionable-fix-output.md`). If so, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files; present a structured checkpoint report; wait for user approval before making any template changes.

- [x] **Collect skeleton documents** — Create `evaluation/javascript/commit-story-v2/run-28/` directory with `debug-dumps/` and a `lessons-for-prd29.md` skeleton. Must run before pre-run verification begins. **Divergence**: completed retroactively, after the instrument run had already produced `debug-dumps/` and `spiny-orb-output.log` as untracked files on `main`. `lessons-for-prd29.md` was written after the fact from the completed log rather than incrementally during pre-run verification. See D-14.

- [ ] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites (**partially completed retroactively — see D-14**; items 3, 4, 6, 11 verified against `git log` on spiny-orb main; item 5 inconclusive (no recurrence observed in the log, no confirming fix found); items 1, 2, 7-10, 12-20 could not be performed or verified after the fact and are permanently missed for this run — this milestone is intentionally left unchecked as a record of the gap, not a pending task; no further action is expected against it for run-28):
  1. **Datadog MCP health check** *(first, before any other pre-run step)*: Run `search_datadog_spans` with `service:commit-story` for the last 1 hour. If it fails or returns an unexpected error (not just "no results"), re-run `/ddsetup`, then `/reload-plugins`. Do not proceed until Datadog MCP queries succeed.
  2. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/javascript/commit-story-v2/run-27/actionable-fix-output.md`. Check which findings were filed and their current status against `docs/ROADMAP.md` — recall run-27's finding that "filed and triaged" does not mean "scheduled to be fixed before this run."
  3. **RUN27-1 fix** (P1, COV-003): Confirmed fixed (D-13, spiny-orb PR #1058) — `isExpectedConditionCatch` now recognizes both ENOENT-catch shapes as equivalent. **Verified retroactively after the run** (D-14), not pre-run as originally planned — see `run-summary.md` Fix Verification table.
  4. **RUN27-2 fix** (P2, SCH-002): Confirmed fixed (D-13, spiny-orb PR #1058) — same-pass, same-file key-reuse check now compares base source identifiers. **Verified retroactively after the run** (D-14), not pre-run as originally planned — see `run-summary.md` and `failure-deep-dives.md`.
  5. **RUN27-3 fix** (P1, SCH-003): Verify whether the `String()`-coercion-vs-int-key check has been generalized to catch this pattern regardless of which file it appears in (not just the originally-reported file).
  6. **RUN27-4 fix** (P1, CDQ-007): Verify which representation the spiny-orb team applied — check specifically whether it's a shared helper (applies automatically to all future files) or a per-file fix (predicts an 8th instance). Note which.
  7. **RUN27-5 watch** (P3): Check whether the "correct type, wrong registered key" gap has any planned rubric or validator treatment.
  8. **Registry version discrepancy**: Check for any fix to the version-bump reporting gap.
  9. **Attribute-count undercounting fix** (P2): Check whether spiny-orb's run-summary language changed to distinguish "new schema-extension attributes" from total attributes, or whether a total-count metric was added.
  10. **RUN21-6 watch** (Watch, seventh run): Check whether any further changes landed for issue #927. Note any new instances in run-28.
  11. **Other spiny-orb fixes since run-27**: Check spiny-orb main for any merged PRs relevant to commit-story-v2 evaluation.
  12. **Target repo readiness** (commit-story-v2): Verify the target checkout is on `main`, clean working tree, `spiny-orb.yaml` and `semconv/` exist.
  13. **Push auth stability check**: Verify token still works (dry-run push to non-existent branch).
  14. **File inventory**: Count `.js` files in commit-story-v2's `src/` directory. Pull the expected count from run-27's own `run-summary.md` (32) rather than carrying forward a hardcoded number — per run-27's own lesson about this note going stale.
  15. Rebuild spiny-orb from **main**: `cd ~/Documents/Repositories/spinybacked-orbweaver && npm install && npm run build`
  16. Record version and findings status.
  17. **README check**: Verify `README.md` on main has a row for run-27.
  18. **Datadog pre-run health check**: Use `search_datadog_spans` with `service:commit-story` (last 7 days). If no results, check Datadog Agent status. Do not start the eval run until spans appear.
  19. **Instrument branch confirmation**: Check `vcs.ref.head.revision` on recent `commit_story.journal.save_journal_entry` spans (note: NOT `git.commit.sha`, which is the journaled commit — domain data, not the running code's own branch identity — per D-10). The run-27 instrument branch was `spiny-orb/instrument-1788361335787` — to get its HEAD SHA: `git -C ~/Documents/Repositories/commit-story-v2 rev-parse spiny-orb/instrument-1788361335787`.
  20. **Capture trace artifact** (organic target): Read `evaluation/trace-capture-protocol.md`. Use `search_datadog_spans` with `service:commit-story` (last 7 days). From the most recent complete journal generation run, record the UUID as `pre_run_service.instance.id` (this is main-branch evidence — the target repo dogfoods commit-story-v2 on ordinary main-branch traffic before the instrument branch exists). Write `evaluation/javascript/commit-story-v2/run-28/trace-artifact.md` with this field plus a `query (pre-run instance, main-branch evidence)` field, matching run-27's `trace-artifact.md` format.
  21. Append observations to `evaluation/javascript/commit-story-v2/run-28/lessons-for-prd29.md`.

- [x] **Evaluation run-28** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/javascript/commit-story-v2/run-28/spiny-orb-output.log` using `git add -f` and write `evaluation/javascript/commit-story-v2/run-28/run-summary.md`, (3) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote: `gh pr create --body-file ~/Documents/Repositories/commit-story-v2/spiny-orb-pr-summary.md --repo wiggitywhitney/commit-story-v2 --head <instrument-branch> --title "..."`

  **Completed retroactively (D-14)**: Whitney ran the instrument command in her own terminal on 2026-09-17 before the PRD execution branch existed. Result: 12 committed, 0 failed, 1 partial, 19 harness-labeled skips (17 confirmed correct, 2 questionable — see per-file evaluation), cost $7.23, PR auto-created (#95, no manual `gh pr create` needed). Log and debug-dumps saved via `git add -f`; `run-summary.md` written from direct log inspection after the fact.

  **Before treating an apparently stalled run as failed**: check whether it's paused at a live interactive prompt — a `Proceed? [y/N]` push-confirmation prompt, or a `PROGRESS.md` `[a]ccept/[e]dit/[s]kip` update-confirmation prompt (can pause for many hours if unattended overnight). Neither prompt's text reliably reaches the piped log. Check `ps` for a live process before concluding the run needs manual recovery — do not require nonzero CPU usage as the detection criterion, since a process blocked on terminal input can report 0% CPU; treat CPU usage as supporting evidence only, alongside confirming the process is alive (not exited or crashed). Process existence alone is not sufficient either — a process blocked on network I/O, a deadlock, or a retry loop is also live with 0% CPU. Use elapsed time as the deciding factor: if the run has been alive far longer than either known prompt shape would explain, with no further log activity and no crash, treat it as genuinely stalled rather than assuming an indefinite prompt-pause. See `docs/language-extension-plan.md` step 3.

  AI must create `evaluation/javascript/commit-story-v2/run-28/debug-dumps/` before handing Whitney the command (already created in the skeleton step). When writing `run-summary.md`, extract the instrument branch name directly from the log (`grep -m1 'Branch:' spiny-orb-output.log`) — do not write it from context (D-4).

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/commit-story-v2/run-28/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/commit-story-v2/run-28/spiny-orb-output.log
  ```

  **After saving artifacts and committing, push the eval branch to origin immediately** (`git push -u origin <eval-branch>`). The branch holds the only copy of run-28 artifacts until the "Copy artifacts to main" milestone runs.

- [x] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) RUN27-1 fix result — does `summary-manager.js` commit cleanly? (expected PASS per D-13 — flag prominently if not), (4) RUN27-2 fix result — does `summarize.js` avoid the key-reuse contradiction? (expected PASS per D-13 — flag prominently if not), (5) RUN27-3 fix result — no `String()`-vs-int-key mismatches anywhere?, (6) RUN27-4 fix result — is CDQ-007's raw-path pattern resolved, and via which representation?, (7) journal-graph.js result — eleventh consecutive success expected, (8) 3-attempt rate, (9) quality score if visible, (10) cost, (11) push/PR status. Keep it conversational, under 12 lines. Wait for acknowledgment before proceeding.

  **Completed** 2026-09-17: reported to Whitney — RUN27-1 confirmed fixed, RUN27-2 validator now catches the reuse mistake (agent still makes it, file goes PARTIAL), RUN27-3 initially reported inconclusive but **corrected to confirmed-still-open** after a CodeRabbit review of the PRD branch caught a live recurrence missed by the first log-only check (`months_generated_count`/`months_failed_count` set via `String()` against an int-typed key in `summarize.js`'s committed source — see `run-summary.md`), RUN27-4 reported at the time as confirmed fixed via inline fallback (**later corrected during per-file evaluation to "partially resolved"** — the fallback mechanism works, but `summary-manager.js` ships raw unsanitized paths at 4 of 7 `file_path` sites despite using the same fallback correctly at the other 3, and `git-collector.js`/`context-integrator.js` separately ship raw PII `commit.author` — see `per-file-evaluation.md` and `run-summary.md`'s RUN27-4 row), journal-graph.js 11th consecutive success, cost $7.23, PR #95 auto-created. Whitney acknowledged and directed continuation at the time; she was separately shown and acknowledged the RUN27-3 correction in the same conversation turn where it was discovered, before directing further work.

- [x] **Post-run Datadog verification** — After the Findings Discussion checkpoint:
  1. Use `search_datadog_spans` with `service:commit-story` filtered to spans newer than the eval run's start timestamp. Check `vcs.ref.head.revision` on spans to confirm the new instrument branch is present — **not** `git.commit.sha` (see D-10).
  2. If no spans from the instrument branch appear yet: note in `run-summary.md` and defer.
  3. When confirmed, append `post_run_service.instance.id` (this UUID, distinct from the pre-run one) plus a `query (post-run instance, instrument-branch evidence)` field to the same `trace-artifact.md` under a "## Post-run verification" section — do not overwrite the pre-run fields, per run-27's `trace-artifact.md` format.
  4. **Log-trace correlation check** *(commit-story-v2 only — pino bridge)*: Use `search_datadog_logs` with `service:commit-story` filtered to logs newer than the eval run's start. Confirm that ≥1 log record has non-empty `trace_id` and `span_id`. Note the correlated vs. uncorrelated count. Run-27 baseline: ~85% correlated (75/88 sampled). If zero correlated logs: flag as regression — pino bridge may have been disrupted.

  **Completed** 2026-09-17: confirmed via `search_datadog_spans` — `vcs.ref.head.revision: c87b774` matches instrument branch `spiny-orb/instrument-1789648132789`'s HEAD SHA exactly. `service.instance.id: ab1620ee-ef3e-4d7f-813b-6ae7894744ff`. Log-trace correlation: 71/87 sampled (~82%), consistent with run-27's ~85% baseline, no regression. Written to `trace-artifact.md` (no pre-run section, per D-14).

- [x] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files and committed files with ≥3 attempts AND quality failures.
  Produces: `evaluation/javascript/commit-story-v2/run-28/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

  **Priority check**: If `summary-manager.js` is partial again (RUN27-1 unresolved), confirm the same three-function catch-shape pattern from run-25/run-27 directly against source, rather than assuming it recurs unchanged. **N/A this run** — `summary-manager.js` committed cleanly (RUN27-1 resolved); the only partial file is `summarize.js` (SCH-002 reuse + newly-confirmed SCH-003 recurrence on `months_generated_count`/`months_failed_count`), documented in `failure-deep-dives.md`.

- [x] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all rules across all committed and partial files.

  **Completed** 2026-09-17: `per-file-evaluation.md` covers all 32 files (12 committed, 1 partial, 19 skips — 17 confirmed correct, 2 questionable) with full rubric evaluation, batched background agents (D-2), and reconciliation via multiple CodeRabbit review rounds. Found **8 rule-level findings across 5 files** beyond the run-summary/failure-deep-dive scope: `git-collector.js` (SCH-003 `is_merge`, CDQ-007 PII regression — 2), `context-integrator.js` (CDQ-007 PII, corrected from an initial wrong PASS — 1), `summary-manager.js` (SCH-003, CDQ-006, CDQ-007 all FAIL despite its COV-003 fix being clean — 3), `summary-detector.js` (SCH-003, 4 occurrences — 1), `auto-summarize.js` (SCH-003, 6 occurrences — 1); plus a separate, structurally distinct coverage regression on `context-capture-tool.js` (2 spans in run-27 → 0 in run-28, agent notes contradict its own reasoning), counted separately since it's a skip-list finding, not a committed-file rubric FAIL. SCH-003's true scope (14 occurrences, 3 files — `summarize.js` itself was undercounted at 2 instead of 4) and RUN27-4's true consistency (real but not uniform, even within one file) were both undercounted in earlier run-summary.md/failure-deep-dives.md passes and corrected here. **D-2 trace supplementation**: completed for 4 of the 6 confirmed-findings files (`git-collector.js` — 2 findings, `context-integrator.js`, `summary-detector.js`, `auto-summarize.js`) via direct Datadog queries against the confirmed post-run window — all live-confirmed, matching the source-level findings exactly. `summary-manager.js` and `summarize.js`'s spans did not fire in the observed window (no weekly/monthly summary triggered during that time), so those files' findings remain source-level-only; this is a data-availability gap, not an effort gap, and doesn't block calling this milestone complete since 4 of 6 files (and the run's two highest-severity findings) now have live corroboration. See `trace-artifact.md`'s "Per-file trace supplement" section for full detail.
  Produces: `evaluation/javascript/commit-story-v2/run-28/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **(D-2) Spawn per-file evaluation agents in batches of 5**: Before spawning agents, create: `mkdir -p evaluation/javascript/commit-story-v2/run-28/per-file-sections/`. Spawn individual background Agent() calls with `run_in_background: true` in batches of 5. After each batch returns, write section files to disk immediately. After writing, the user clears context before spawning the next batch. At the start of each new batch, run `ls per-file-sections/` to see what's done and pick the next 5. **Background agents cannot write NEW files** (Write tool blocked for new paths in subagent context) — ask agents to return section content in the result text, then write each file directly. Full protocol: `docs/language-extension-plan.md` step 6 (D-2).

  **Reconciliation pass (after all batches return, before the first CodeRabbit review)**: independent per-file agents scoring the same underlying pattern can disagree — diff verdicts across files sharing a rule and flag disagreements before the first CodeRabbit review. Apply the two reusable tests from run-27: **CDQ-007 "structural guarantee" test** and **SCH-002 "specific wrong noun vs. generic reasonable term" test**. Full detail: `docs/language-extension-plan.md` step 6.

  **Correct-skip verification**: for each file the run summary labels a "correct skip," grep that file's own pre-instrumentation-analysis block in `spiny-orb-output.log` for a COV-001/COV-004 flag the final output didn't act on. Full detail: `docs/language-extension-plan.md` step 6.

  **COV-005 methodology (attribute presence, not attribute identity)**: COV-005 passes if a span carries ≥1 meaningful domain attribute. Attribute variation between runs is normal.

  **Attribute-count trend caution**: before flagging any cross-run "declining richness" trend for any file, verify reported attribute counts against direct source inspection rather than trusting `attributesCreated`/"N attributes" figures alone. See `docs/language-extension-plan.md` step 10.

  **Trace provenance labeling**: label each cited trace explicitly as "instrument-branch evidence" or "main-branch evidence (corroborating, not direct)" using `vcs.ref.head.revision` against the instrument branch's actual HEAD SHA (obtained in pre-run verification step 19) — **not** `git.commit.sha` (D-10). See `docs/language-extension-plan.md` step 6.

  **Important**: Per-file evaluation agents must read the instrumented source directly (`git show <instrument-branch>:src/file`); do not rely on agent notes alone. Additionally, each agent must read the `Agent thinking` and `Agent notes` blocks for that file from `spiny-orb-output.log`. Companion `.instrumentation.md` files on the instrument branch also contain structured rationale per file.

  **(D-2 trace supplement)** Before writing any section, check `trace-artifact.md` for `post_run_service.instance.id` and its post-run query. **If both are present**: use `search_datadog_spans` with the post-run query + `resource_name:<prefix>.*` to supplement the section, and apply the trace provenance labeling rule above. **If post-run verification was deferred** (no instrument-branch spans were found yet, per that milestone's step 2, so these fields don't exist): do not block on trace availability — proceed with per-file evaluation and mark trace supplementation "unavailable (post-run verification deferred)" in each affected section. Never substitute the `pre_run_service.instance.id`/pre-run query in this case — that field is main-branch evidence only and would mislabel the provenance.

  **(D-1) Track attempt counts**: For each file, note attempts. If a file required ≥3 attempts AND has a quality failure, include the verbose log section as input to the per-file evaluation agent.

  **Key watch items for per-file evaluation**:
  - `summary-manager.js` — Does it commit cleanly across all 9 functions? RUN27-1 fix result — expected PASS per D-13; treat a recurrence as a new finding (the merged fix not actually working), not an expected outcome.
  - `summarize.js` — Does `dates_count` avoid the contradictory same-pass reuse? RUN27-2 fix result — expected PASS per D-13; treat a recurrence as a new finding, not an expected outcome.
  - `git-collector.js`, `summary-detector.js` — Do either emit `String()` against an int-typed key? RUN27-3 fix result.
  - All CDQ-007-affected files (7 from run-27) — Is the raw-path finding resolved, and via a shared helper or per-file fixes? RUN27-4 fix result.
  - `journal-manager.js` — Does the `quotes_count`/reflection-count semantic mismatch (RUN27-5) persist or resolve? Score per the standing Unrubriced Findings category (see Rubric scoring milestone below) if it persists.
  - `journal-graph.js` — Eleventh consecutive success expected.

- [x] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/javascript/commit-story-v2/run-28/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`
  PR: Find the URL in `evaluation/javascript/commit-story-v2/run-28/run-summary.md`.

  **Completed** 2026-09-17: Reviewer Utility Score 2.25/5 (down from run-27's 3.25/5). The Per-File Results table is accurate (an improvement over run-27's fabricated "12/14" function count). But the Advisory Findings section regressed sharply — 6 of 13 line-items (46%) are false positives, mostly CDQ-007 firing on plain integer-count attributes across 5 files, some pointing at entirely wrong line numbers. All 6 of this run's SCH-003/CDQ-006 canonical failures (5 SCH-003 rule findings across 29 call sites — 14 across 3 files, 14 on `summary_saved`, 1 on `is_merge` — plus 1 CDQ-006 finding) are completely absent from Advisory Findings — the PR's own generated content gives a reviewer no signal any of them exist.

- [x] **Rubric scoring** — Synthesize dimension-level scores.

  **Completed** 2026-09-17: 21/25 (84%), gates 5/5 — ties run-27's series-low score, but via offsetting composition: COV recovered to 5/5 (RUN27-1's COV-003 bug confirmed fixed) while CDQ dropped to 5/7 (a new CDQ-006 failure, RUN27-4 still not fully closed at `summary-manager.js` — 4 of its 7 raw-path sites remain unfixed even though 6 of the original 7 affected files are clean — plus a new PII regression at `git-collector.js`/`context-integrator.js`). SCH held at 2/4 with SCH-003's footprint widening to 5 files, the largest in the series. RUN27-5 (journal-manager.js `quotes_count`) does not persist this run — resolved, so no Unrubriced Findings entry needed.
  Produces: `evaluation/javascript/commit-story-v2/run-28/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

  **Unrubriced findings category**: if RUN27-5's "correct type, wrong registered key" pattern persists (in `journal-manager.js` or elsewhere), score it as a canonical failure in the narrative for consistency, but list it under the standing "Unrubriced Findings" section rather than folding it into any dimension's score. Full detail: `docs/language-extension-plan.md` step 8.

  **Use run-27 rubric as the primary precedent reference** (`evaluation/javascript/commit-story-v2/run-27/rubric-scores.md`). Critical precedents:
  1. **CDQ-006 precedent**: Advisory findings are not canonical failures — do NOT fail CDQ-006 for advisory findings.
  2. **COV-001 failed-file precedent**: Files that failed to commit but whose output would have passed COV-001 are scored as COV-001 PASS.
  3. **COV-005 delta observation precedent**: Coverage delta observations are narrative only.
  4. **CDQ-007 self-identified-fix precedent**: a raw-path/similar advisory finding becomes a canonical FAIL when the agent's own generation-time notes name a specific, cost-free remediation and decline to apply it.
  5. **CDQ-007 "structural guarantee" test** and **SCH-002 "specific wrong noun vs. generic reasonable term" test** (new from run-27) — apply during the per-file evaluation reconciliation pass, not at scoring time.
  **Rule set**: CDQ dimension is 7/7 max (CDQ-001, CDQ-002, CDQ-003, CDQ-005, CDQ-006, CDQ-007, CDQ-008). NDS-007 is Control Flow Preserved.

- [x] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9. Full protocol in `evaluation/is/README.md`.

  **Completed** 2026-09-17: IS score 100/100 — fourth consecutive perfect score (runs 25, 26, 27, and now 28). 8/8 applicable rules passed (RES-001, RES-004, RES-005, SPA-001 through SPA-005), 7 not applicable (metrics/multi-instance/k8s rules). `otelcol-contrib` LaunchAgent was already listening on port 4318 (`lsof -i :4318 -sTCP:LISTEN` showed `otelcol-c`) — no manual collector start needed. Ran the app against instrument branch `spiny-orb/instrument-1789648132789`'s `src/`/`examples/` via targeted `git checkout <branch> -- src/ examples/` (not a full branch checkout) then restored main with `git reset HEAD -- src/ examples/ && git checkout -- src/ examples/ && find src/ examples/ -name '*.instrumentation.md' -delete` — a plain `git checkout main -- src/ examples/` is insufficient to remove new-on-branch `.instrumentation.md` files, since checkout only touches paths that exist in the source commit; the `git reset`+`checkout`+targeted-`find -delete` sequence is required to fully restore a target repo after this kind of partial-path branch checkout (D-15; the initial fix used `git clean -fd`, but a CodeRabbit review of this branch correctly flagged that as unsafe since it removes any untracked file under those paths, not just the known leftover type). Filtered the shared `evaluation/is/eval-traces.json` (539 lines accumulated) to 31 spans matching `service.name:commit-story` + this run's own `trace_id` (`f6c3e65801a56176c5e430654e06d114`), wrote to `eval-traces-run28.json`, sanitized local-machine identity fields (`process.owner`, `host.id`, `process.command_args`, `process.executable.path`, `process.command`), and re-ran the scorer post-sanitization to confirm the redaction didn't change the score (still 100/100). Confirmed via `search_datadog_spans` (`service:commit-story`, last 4h): 31 spans matched the same trace ID, `service.instance.id: adf2caf8-aca4-4e93-a394-3d1c0c7210ab`. Full detail in `is-score.md`.

  **Note**: SPA-001 threshold for commit-story-v2 is 55 (set by PR #142). SPA-002 is de-facto resolved for commit-story-v2 (`SimpleSpanProcessor` + `shutdownAndExit` override — structurally impossible). IS 100/100 in runs 25, 26, and 27 is the baseline. If IS returns <100/100 in run-28, check for a **different** rule failure — do NOT re-investigate SPA-002.

  **Note on Datadog Agent**: Do NOT run `datadog-agent stop/start`. The Agent's embedded OTLP HTTP receiver is permanently disabled (port 4318 owned by `otelcol-contrib`).

  **Read `~/.claude/rules/is-scoring-gotchas.md` before step 1.** `otelcol-contrib` runs as a persistent macOS LaunchAgent (`com.whitney.otelcol-contrib`) that is almost always already listening on port 4318 — check with `lsof -i :4318 -sTCP:LISTEN` first. If it shows `otelcol-c` as the listener, skip starting a new instance entirely.

  1. **If no listener was found above, Claude starts** the OTel Collector in the background:
     ```bash
     vals exec -f ~/Documents/Repositories/spinybacked-orbweaver-eval/.vals.yaml -- ~/.local/bin/otelcol-contrib --config ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/is/otelcol-config.yaml > /tmp/otelcol.log 2>&1 &
     COLLECTOR_PID=$!
     timeout 30 bash -c 'until lsof -i :4318 >/dev/null 2>&1; do sleep 0.5; done' || { kill "$COLLECTOR_PID" 2>/dev/null; exit 1; }
     ```
  2. **Claude checks out** instrument files and runs the app from `~/Documents/Repositories/commit-story-v2`:
     ```bash
     git status --short  # must be clean before proceeding — stop if not
     ADDED_PATHS=$(git diff --name-only --diff-filter=A main <instrument-branch> -- src/ examples/)
     git checkout <instrument-branch> -- src/ examples/
     OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node --import ./examples/instrumentation.js src/index.js HEAD
     git reset HEAD -- src/ examples/ && git checkout -- src/ examples/ && [ -n "$ADDED_PATHS" ] && echo "$ADDED_PATHS" | xargs rm -f
     ```
     Note: omit `COMMIT_STORY_TRACELOOP=true`. **Do not restore with `git checkout main -- src/ examples/` alone** (D-15) — `git checkout <path>` only updates paths that already exist in the target commit, so it never removes the instrument branch's `.instrumentation.md` companion files (~30 of them, one per instrumented file), which don't exist on main. The `git reset` + `checkout` step restores tracked files; deleting the exact `$ADDED_PATHS` captured before checkout removes only the files the instrument branch actually added — **do not use a broad `find ... -delete` or `git clean -fd src/ examples/` for this**, since either removes files by pattern or by untracked status rather than by the exact set added, and could catch unrelated work-in-progress files a prior session may have left there. Verify with `git status --short` afterward — the only remaining untracked entries should be pre-existing journal files, nothing under `src/` or `examples/`.
  3. **Claude stops** the Collector: `kill "$COLLECTOR_PID"` — **skip this step entirely** if the persistent LaunchAgent instance was already running.
  4. **Claude filters, then runs the scorer**, from `~/Documents/Repositories/spinybacked-orbweaver-eval`. Do NOT score `evaluation/is/eval-traces.json` directly — it is shared and never truncated across sessions and targets (see D-11 and `~/.claude/rules/is-scoring-gotchas.md`). Filter to `service.name == "commit-story"` and a time window around the app invocation, write the filtered subset to `evaluation/javascript/commit-story-v2/run-28/eval-traces-run28.json` (sanitizing local-machine identity fields before committing it), then: `cd ~/Documents/Repositories/spinybacked-orbweaver-eval && node evaluation/is/score-is.js evaluation/javascript/commit-story-v2/run-28/eval-traces-run28.json --target commit-story-v2 > evaluation/javascript/commit-story-v2/run-28/is-score.md`
  5. **Confirm IS scoring traces in Datadog**: Record IS scoring run start time, then query `service:commit-story from:<run-start-time>`. Record `service.instance.id`.
  Produces: `evaluation/javascript/commit-story-v2/run-28/is-score.md`

- [x] **Baseline comparison** — Compare run-28 vs runs 2–27 (run-22 was never executed).
  Produces: `evaluation/javascript/commit-story-v2/run-28/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

  **Attribute-count trend caution**: before flagging any cross-run "declining richness" trend, verify reported attribute counts against direct source inspection rather than trusting logged figures alone. See `docs/language-extension-plan.md` step 10.

  **Completed** 2026-09-17: `baseline-comparison.md` written — run-28 ties run-27's series-low 21/25 but via an inverted dimension composition (COV recovers to 5/5, CDQ drops to a new series-low 5/7 including the first-ever CDQ-006 failure). Spans tie the 48 all-time record despite one fewer committed file. IS hits a fourth consecutive 100/100 (longest streak in the series). Cost drops to $7.23 (-23.1% vs run-27), the lowest among 100/100-IS-score runs (run-24's $3.70 is lower still but scored 80/100). Score projection validation confirms RUN27-1 (COV-003) fully resolved; RUN27-2, RUN27-3, RUN27-4 all landed as partial progress rather than clean fixes. RUN27-5 does not recur — no third instance found.

- [x] **Update root README** — Add a row for run-28 to the run history table (quality, gates, files, spans, cost, push/PR, IS score). Update the "next run" sentence to reference run-29 and its primary goals.

  **Completed** 2026-09-18: Added run-28 row (21/25 84%, 5/5 gates, 12+1p files, 48 spans, $7.23, PR #95 merged, 100/100 IS) to the run history table in `README.md`. Replaced the "Run-28 is next" pointer with a run-29 pointer covering the residual CDQ-007 raw-path gap at `summary-manager.js` (4 of 7 sites), the widened SCH-003 pattern (now confirmed bidirectional, 29 call sites across 5 files — corrected 2026-09-18 from an earlier undercount that described only the 14 sites in `summarize.js`/`summary-detector.js`/`auto-summarize.js` and folded `git-collector.js`'s 1 site and `summary-manager.js`'s 14 sites into a vague "2 further separate instances"), the new CDQ-006 guard-coverage failure, and the PII regression in `git-collector.js`/`context-integrator.js`.

- [x] **Actionable fix output** — Primary handoff deliverable.

  At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-28 evaluation artifacts.
  2. **Handoff-confirmation depth**: When Whitney confirms handoff to the spiny-orb team, verify each finding's actual roadmap tier/sequencing (not just that an issue exists with acceptance criteria) against spiny-orb's `docs/ROADMAP.md`. A finding can be correctly filed and triaged while still not being scheduled to land before the next run — state this explicitly in the next run's goals section rather than treating an expected recurrence as a surprise. Full detail: `docs/language-extension-plan.md` step 11.
  3. **Spoken summary (root cause + generalization)** *(user-facing checkpoint 2)*: Before printing the file path, provide a spoken summary with three elements: (a) **Main points** — key failures, category, priority; (b) **Root cause vs. symptom** — for each fix, state whether it addresses root cause or symptom; (c) **Every-user generalization check** — how each fix helps any spiny-orb user, not just commit-story-v2.
  4. Print the absolute file path of `evaluation/javascript/commit-story-v2/run-28/actionable-fix-output.md`.
  5. **Pause.** Do not proceed to Draft PRD #29 until Whitney confirms handoff to spiny-orb team.

  **Completed** 2026-09-18: `actionable-fix-output.md` written (268 lines), cross-document-audited by a subagent against all 8 run-28 source artifacts plus live spiny-orb GitHub issue state — 4 discrepancies found and corrected (a stale #929/#930 closed/open status, an internal 12-vs-14 SCH-003 count inconsistency, an incomplete SPA-001 span-count list, and an imprecise issue/PR attribution). Spoken summary delivered per the three-element structure above. Whitney confirmed handoff; the spiny-orb team (separate session) triaged the document into **4 new issues** (#1065 CDQ-007 validator-severity investigation, #1066 CDQ-007 PII regression — cross-referenced to #1065 and gated on its resolution, #1067 CDQ-006 guard-consistency, #1068 CDQ-007 `summary-manager.js` residual raw-path sites — explicitly not reopening closed #1035) and **7 corroborating comments across 5 existing open issues** (#1037, #927, #1036 ×3 additions, #1060, #1063). Verified directly against `gh issue view`/`gh issue list` after posting: all four new issues exist with content matching the handoff doc, all seven comments posted accurately, and #1035/#1055 remain correctly closed (not reopened).

  **Roadmap tier verification** (required by step 2 above): none of the actionable findings from this run are scheduled to land before run-29. `docs/ROADMAP.md`'s "Short-term" tier (#1037 SCH-003, #1036 PR-summary gaps) is explicitly headed "Short-term (after Go)" — sequenced after both the Python and Go language-provider work, which is the current critical path. #1060 and #1063 sit in "Medium-term," further out still. The four new issues (#1065–#1068) are not yet triaged into the roadmap at all. **Practical implication for PRD #29's goals section**: expect SCH-003 (widened, bidirectional), the CDQ-006/CDQ-007 `summary-manager.js` gaps, and the CDQ-007 PII/severity-instability question to all recur in run-29 by default — none of run-28's findings are being resolved before then unless the roadmap sequencing changes. This should be stated as an expected baseline in run-29's fix-verification table, not treated as a surprise regression.

  **Handoff framing guidance** (carried forward from taze run-16, run-26, and run-27):
  - **Fix language targets spiny-orb components, not target files.** "Fix:" entries should describe the spiny-orb component gap — auto-fix, validator, prompt, or fix-loop. Do not write "remove String() at line 42 of file.ts." Target repo files are overwritten every run; patching them is not durable and can mislead the team about the root cause.
  - **Attribute disappearance is not automatically a finding.** If an attribute appeared in a prior run and is absent now, investigate before calling it wrong. Consider: does the attribute have a semconv basis? Is the absence a defensible agent decision?
  - **Carry-forward table: consider distinguishing findings from observations.** Entries with a plausible spiny-orb root cause ("finding") vs. entries worth watching but without a clear industry basis for calling them wrong ("observation") serve different purposes for the team.
  - **"0 attributes" in the run summary means 0 NEW schema attributes, not 0 attributes used.** Before finalizing any attribute-coverage finding, inspect the committed code directly.

- [x] **Draft PRD #29** — Follow `docs/language-extension-plan.md` step 12. Complete the template-update checkpoint first. Cascade approved process improvements to three places: (1) the template, (2) all other currently active open eval PRDs, and (3) the affected milestones of PRD #29 itself before committing. Draft PRD #29 using this PRD as the style reference. Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints.

  **Completed** 2026-09-18: Cascaded all 9 process observations from `lessons-for-prd29.md` into `docs/language-extension-plan.md` (D-16 covers the review-delegation approach), then into the three other active open eval PRDs (#147 taze run-17, #100 release-it run-5, #143 content-manager real-instrumentation). Drafted PRD #29 as **GitHub issue #161** (`prds/161-evaluation-run-29.md`), carrying forward run-28's six open findings (RUN28-1 through RUN28-5, plus the RUN27-2/PR-summary/CDQ-007-advisory-quality carried findings) as primary/secondary goals, with the cascaded process improvements baked directly into the new PRD's own affected milestones rather than left as template pointers. All changes (template, three cascaded PRDs, new PRD #161, ROADMAP.md) landed on a dedicated docs branch (`docs/prd156-template-updates`, per the Eval Branch Convention's "template edits must land on a branch that merges to main" rule) via **PR #162**. CodeRabbit review took **17 rounds** to reach zero findings — caught and fixed a substantial number of real issues introduced while writing the cascade text itself: hardcoded prior-run branch names and resource-name prefixes, a documented-but-contradicted Write-tool constraint (background agents can't create new files), exemption-scope decisions that were written down but never actually handed to the spawned agents reading them, trace-supplementation timing that drifted from its own stated ownership rule, and one genuine circular milestone dependency (PRD #100's Step 0 telling the reader to complete a later-listed milestone first). PR #162 merged to main; `docs/prd156-template-updates` branch deleted per convention.

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/javascript/commit-story-v2/run-28/` to copy all artifacts. Commit to main with message `eval: save run-28 artifacts to main [skip ci]`. Add one row to `evaluation/javascript/commit-story-v2/run-log.md` for run-28. Update `PROGRESS.md` with an entry for run-28 (per global CLAUDE.md's PROGRESS.md style rules) before `/prd-done` runs. Push main. This step runs before `/prd-done`.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D-1 | Schema stays as-is for SCH-003 / attribute type mismatches. Agents must comply with declared types. | Inherited from run-24 D-7 via run-25 D-1, run-26, and run-27. Schema is the source of truth; intentional type declarations stay. | 2026-06-20 |
| D-4 | Extract instrument branch name from log output (`grep -m1 'Branch:' spiny-orb-output.log`), never from conversation context or memory. | Prevents recording stale branch names from prior runs. `run-summary.md` is the canonical record. | 2026-06-20 |
| D-5 | SPA-002 is de-facto resolved for commit-story-v2. Do not carry it forward as a watch item. | commit-story-v2 uses `SimpleSpanProcessor` (immediate export) + `shutdownAndExit` override — batch-flush-before-exit is structurally impossible. IS 100/100 in runs 25-27 confirms. Systemic spiny-orb fix tracked in #930. | 2026-06-20 |
| D-7 | A run that appears stalled must be checked for a live interactive prompt — a `Proceed? [y/N]` push-confirmation prompt, or a `PROGRESS.md` `[a]ccept/[e]dit/[s]kip` update-confirmation prompt — before being treated as failed or manually recovered. | Run-26's apparent push/PR "failure" (RUN26-3) was a ~27.5-hour approval-prompt pause, not a spiny-orb defect. Run-27 hit the second, distinct prompt shape (21h 21m pause). This guidance was cascaded in PRD #144 but never actually landed in the mainline template until run-27's template-update checkpoint restored it. | 2026-07-20 (restored 2026-09-11) |
| D-8 | Before flagging a cross-run attribute-count "declining richness" trend, verify against direct source inspection, not logged `attributesCreated` figures alone. | `attributesCreated` counts only new schema extensions, not total attributes set in code. This produced a false regression narrative for `context-capture-tool.js` across runs 23-25 that source inspection disproved in run-26. | 2026-07-20 |
| D-9 | **Superseded by D-10.** For commit-story-v2 (organic/dogfooded target), every cited live trace must be labeled "instrument-branch evidence" or "main-branch evidence (corroborating, not direct)" based on `git.commit.sha`. | The labeling attribute in this row was wrong; use `vcs.ref.head.revision`, not `git.commit.sha`. See D-10. | 2026-07-20 |
| D-10 | **Corrects D-6/D-9.** Use `vcs.ref.head.revision` (not `git.commit.sha`) to identify which instrument branch is running in Datadog spans for commit-story-v2. `git.commit.sha` is the journaled commit (domain data), not the running code's own branch identity. | Run-27's post-run Datadog verification empirically confirmed the reverse of D-6's claim. | 2026-09-03 |
| D-11 | IS scoring must filter the shared `evaluation/is/eval-traces.json` to `service.name == "commit-story"` (or the target's own service name) plus a time window around the app invocation, before running `score-is.js`. | The persistent `otelcol-contrib` LaunchAgent never truncates `eval-traces.json` — it appends across every session and target indefinitely, and scoring the unfiltered file can silently mix targets. Documented permanently in `~/.claude/rules/is-scoring-gotchas.md`. | 2026-09-09 |
| D-12 | Formalize a standing "Unrubriced Findings" category in `rubric-scores.md`, rather than inventing a new rule ID, for failures with no matching existing rule (e.g. correct type written to the wrong pre-existing registry key). | Approved over the new-rule-ID alternative to keep dimension max-scores stable across all 27+ runs of historical baseline comparisons; this failure mode is a judgment call rather than a mechanical validator check, making it a better fit for a narrative category. Cascaded to `docs/language-extension-plan.md` step 8, PRD #143, and PRD #147. | 2026-09-11 |
| D-13 | RUN27-1 (COV-003) and RUN27-2 (SCH-002) are confirmed fixed and merged (spiny-orb PR #1058, closing #1055/#1056) — run-28 should expect these to PASS, not recur. Only RUN27-3 (SCH-003, #1037) and RUN27-4 (CDQ-007, #1035) remain open and should still be expected to recur. | Discovered during a post-merge audit of PRD #153's flagged findings: PR #1058 fixed both at the validator level with tests, sequenced ahead of the Python provider per the "Path to Python" roadmap gate specifically because they're rule-logic bugs a new language provider would inherit. The PR's own description confirms the cross-run reuse case (RUN27-5) was investigated and found infeasible to detect reliably — independently validating D-12's Unrubriced Findings choice. Also corrected a call-site miscount already delivered to spiny-orb: `actionable-fix-output.md` and issue #1035 stated `summary-manager.js` has 17 CDQ-007 call sites; direct source verification (both the committed file and its debug dump) confirms 13. Total across all 7 affected modules is 30 call sites, not 7 — corrected in a follow-up comment on #1035. | 2026-09-16 |
| D-14 | The instrument run for run-28 executed out of the PRD's own milestone order — Whitney ran `spiny-orb instrument` before Step 0 (bootstrap reading), Step 0.5 (cross-run process review), or Pre-run verification had been done, and before `/prd-start` had created the eval execution branch. The log and `debug-dumps/` sat as untracked files on `main`'s working tree for hours before being discovered and picked up. Skeleton documents and fix-status verification were completed retroactively from the finished log and `git log` on spiny-orb main, rather than during the run. The Datadog **pre-run** health check, the push-auth dry-run, and `trace-artifact.md`'s pre-run capture could not be performed at all — they require being done before or during the run and are permanently missed for run-28. **Post-run** Datadog verification was not blocked by this and was completed normally after the fact (2026-09-17 — see `trace-artifact.md`'s Post-run verification section and the "Post-run Datadog verification" milestone below). | The run happened without the AI confirming readiness first (per the "Evaluation run-28" milestone's own AI-role instruction), and nothing caught the gap until a later session noticed the untracked files. Recorded as a process gap for PRD #29: the template should state explicitly that skeleton + pre-run verification are hard prerequisites to confirm complete before handing Whitney the instrument command, not just an ordering suggestion. Also captured in `lessons-for-prd29.md`. | 2026-09-17 |
| D-15 | `git checkout main -- src/ examples/` alone is insufficient to restore a target repo after `git checkout <instrument-branch> -- src/ examples/`. The correct restore sequence requires a clean worktree first, capturing the exact branch-added paths *before* checkout (`ADDED_PATHS=$(git diff --name-only --diff-filter=A main <instrument-branch> -- src/ examples/)`), then `git reset HEAD -- src/ examples/ && git checkout -- src/ examples/ && echo "$ADDED_PATHS" \| xargs rm -f`. | `git checkout <path>` only updates paths that exist in the source commit — it never deletes a path. The instrument branch's `.instrumentation.md` companion files (one per instrumented source file, ~30 for commit-story-v2) don't exist on main, so a plain `git checkout main -- src/ examples/` staged them as tracked adds and left them on disk as either staged-added or untracked files after `git reset`. Discovered during run-28's IS scoring run when `git status` showed 30+ leftover `.instrumentation.md` files after following the PRD's own literal instruction. First fixed with `git clean -fd src/ examples/`, but a CodeRabbit review correctly flagged that as unsafe — it removes *any* untracked file under those paths, not just the known leftover type. Replaced with a `find -name '*.instrumentation.md' -delete` scoped to the exact filename pattern, which was itself later flagged (during PRD #161's drafting, 2026-09-18) as still broader than necessary — it deletes by pattern, not by the exact set of paths the branch actually added. Final fix captures the exact added paths via `git diff --diff-filter=A` before the reset and deletes only those. The "IS scoring run" milestone's step 2 in this PRD, and the equivalent step in `~/.claude/rules/is-scoring-gotchas.md`, both carry the corrected sequence. | 2026-09-17 (refined 2026-09-18) |
| D-16 | The template's own step 12.2 user-facing checkpoint (template updates require Whitney's approval) was satisfied by a fork agent reviewing the 9 proposed additions and correcting placement/wording on 4 of them, rather than Whitney reviewing them directly — at her explicit direction ("have an agent review or something, not me"). | Whitney delegated the review rather than performing it herself in this session. The agent's review caught real placement errors (proposals attached to the wrong process step) before they landed, functioning as a genuine quality gate rather than a rubber stamp — but this is a one-off delegation for this run, not a standing change to the checkpoint's approval requirement. | 2026-09-18 |

---
