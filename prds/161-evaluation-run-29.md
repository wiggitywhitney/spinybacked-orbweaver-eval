// ABOUTME: PRD for JS Evaluation Run-29 — SCH-003 bidirectional-check verification, CDQ-006/CDQ-007 consistency verification, and PII severity-flip investigation follow-up.
# PRD #161: JS Evaluation Run-29: commit-story-v2 — SCH-003 Bidirectional Check + CDQ-006/CDQ-007 Consistency + PII Severity Investigation

**Status:** Ready
**Created:** 2026-09-18
**GitHub Issue:** #161
**Depends on:** PRD #156 (run-28 complete, actionable fix output delivered to spiny-orb team, 4 new issues filed: #1065–#1068)

---

## Problem Statement

Run-28 scored 21/25 (84%), tying run-27's series-low, via an inverted dimension composition: COV fully recovered to 5/5 (RUN27-1 resolved), while CDQ dropped to a new series-low 5/7 — the first-ever CDQ-006 failure plus a PII regression. Gates 5/5. IS 100/100 (fourth consecutive perfect score). Q×F 10.08 (down from run-27's 10.92, driven by file count not quality%). Cost $7.23 (-23.1% vs run-27). Push/PR AUTO (PR #95), second consecutive AUTO success.

Six findings from run-28 drive this run's primary goals, plus three findings carried from run-27 that remain open:

1. **RUN28-1 (P2, CDQ-006)** — `summary-manager.js` applies the `isRecording()` guard at only 3 of ~24 `setAttribute` calls (the 3 path-sanitization sites), with no COV-001 entry-point exemption available and no stated rationale for the split. First CDQ-006 failure in the entire run series (runs 2–28). Filed as spiny-orb issue **#1067**.

2. **RUN28-2 (P1, SCH-003)** — Widened to 5 files, 29 failing call sites, now confirmed **bidirectional**: the original `String(x.length)`-vs-int shape (12 call sites across `summarize.js`, `summary-detector.js`, `auto-summarize.js`) plus a new opposite-direction shape (`dates_requested`, declared `string`, set as a raw number — 2 sites), plus `git-collector.js`'s `is_merge` (`String()`-wrapped boolean, 1 site), plus `summary-manager.js`'s `summary_saved` (raw boolean into a `string`-typed key — one rule violation across 14 call sites). Updates spiny-orb issue **#1037** (open, "Short-term (after Go)" roadmap tier) — the original narrow framing ("flag `String()`-wrapped numeric against int/float/bool keys") undercounts what run-28 found and needs broadening to a bidirectional type-mismatch check.

3. **RUN28-3 (P1, CDQ-007)** — `summary-manager.js` ships raw, unsanitized paths at 4 of its 7 `file_path` call sites despite correctly applying the inline sanitization fallback at the other 3, in the same file. The original RUN27-4 fix (#1035, closed) is confirmed correct and durable everywhere it's actually invoked — this is a fix-application-completeness gap, not a broken fix. Filed as spiny-orb issue **#1068** (deliberately not reopening the closed #1035).

4. **RUN28-4 (P1, CDQ-007)** — Two-part finding: (a) `commit_story.commit.author` (a real person's name) ships raw again in `git-collector.js` and `context-integrator.js` — the same PII this exact attribute was fixed for in run-27; (b) the identical attribute and code pattern went from a **blocking** canonical failure in run-27 to a **non-blocking advisory** in run-28, with no corresponding code change identified as the cause — a validator severity-classification instability, not just a regression. Filed as spiny-orb issues **#1066** (PII regression) and **#1065** (severity-flip investigation). Both carry spiny-orb's "high priority / required before conference demo" label.

5. **RUN28-5 (Watch, unrubriced)** — `context-capture-tool.js`'s agent-generated thinking trace correctly reconstructs the same coverage analysis as run-27, then reverses course in its final notes with a scope error (conflating "unexported" with "no async I/O to cover"). Related to but distinct from **#927** (agent notes vs. committed code divergence) — here the divergence is entirely within the agent's own output (intermediate reasoning vs. final notes), with no committed code to diff against.

6. **Carried findings, no new tracking needed**: RUN27-2/SCH-002 same-key-reuse pattern (spiny-orb **#1063**, open, "Medium-term" tier — this run's `summarize.js`/`dates_requested` instance is corroborating evidence, already correctly scoped), PR-summary omission of SCH-003/CDQ-006 findings (spiny-orb **#1036**, open, "Short-term (after Go)" tier — run-28 contributed the largest evidence set yet: 29 SCH-003 call sites entirely invisible in the PR's Advisory Findings), and CDQ-007 advisory false-positive rate (spiny-orb **#1060**, open, "Medium-term" tier — 46% contradiction rate this run, up sharply from run-27's 8%, all on plain integer-count attributes).

**Roadmap-tier reality check (verified during run-28's handoff, 2026-09-18)**: #1036 and #1037 sit in spiny-orb's `docs/ROADMAP.md` "Short-term (after Go)" tier — sequenced after both the Python and Go language-provider work, the current critical path. #1060 and #1063 sit in "Medium-term," further out still. #1065–#1068 are brand new (filed 2026-09-18) and not yet triaged into the roadmap at all. **None of these six findings are confirmed scheduled to land before run-29** — this should be treated as the expected baseline, not a surprise if all six recur unchanged. The one wrinkle: #1065 and #1066 carry spiny-orb's own "high priority / required before conference demo" label, which could mean the spiny-orb team fast-tracks them outside the normal roadmap-tier sequencing — pre-run verification must check their live status directly rather than assuming the roadmap tier alone predicts the outcome.

Full detail: `evaluation/javascript/commit-story-v2/run-28/actionable-fix-output.md` §2, §3, §7, §8.

### Primary Goals

Verify whether RUN28-1 through RUN28-4 are resolved, and whether RUN27-2/PR-summary/CDQ-007-quality findings show any movement:

- **RUN28-1 (CDQ-006, #1067)**: `summary-manager.js` applies the `isRecording()` guard consistently across all `setAttribute` calls, or has a stated, checkable rationale for guarding only some
- **RUN28-2 (SCH-003, #1037)**: No file emits a value whose runtime type doesn't match its declared registry type, in either direction (String()-wrapped numeric/boolean into a numeric/boolean key, OR a raw numeric/boolean value into a string-typed key)
- **RUN28-3 (CDQ-007, #1068)**: `summary-manager.js` applies the sanitization fallback at all 7 of its `file_path` call sites, not just 3
- **RUN28-4a (CDQ-007 PII, #1066)**: `commit_story.commit.author` no longer ships raw in `git-collector.js` or `context-integrator.js`
- **RUN28-4b (CDQ-007 severity, #1065)**: Check whether the blocking→advisory severity-classification instability has been investigated and explained (validator version diff, config change, or confirmed nondeterminism)
- **Given the roadmap-tier reality check above**: expect all five to recur unchanged unless pre-run verification finds evidence otherwise (especially for #1065/#1066, given their demo-priority label)

### Secondary Goals

- **RUN28-5 watch**: does `context-capture-tool.js`'s notes-vs-reasoning divergence pattern recur, in this file or a new one? A second instance would strengthen the case for folding this into #927's tracking rather than treating it as a one-off.
- **RUN27-2/SCH-002 watch (#1063)**: does the same-key-reuse pattern (daily/weekly/monthly-parallel functions sharing one attribute key) surface a third instance beyond `summary-graph.js` and `summarize.js`?
- **PR-summary quality (#1036)**: does this run's SCH-003/CDQ-006 canonical failures appear in the PR's Advisory Findings section, or does the omission persist?
- **CDQ-007 advisory quality (#1060)**: does the false-positive/mistargeted rate on advisory findings return toward run-27's 8%, or hold near run-28's 46%?
- **IS score**: does 100/100 hold for a fifth consecutive run?
- **Cost trend**: does cost hold in the $5–9 range projected from run-28's $7.23, given none of the six primary findings are validator-level fixes confirmed to land before this run?

### Run-28 Scores (baseline for run-29 comparison)

| Dimension | Run-28 | Run-27 | Run-26 | Run-25 |
|-----------|--------|--------|--------|--------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) |
| COV | 5/5 (100%) | 4/5 (80%) | 5/5 (100%) | 4/5 (80%) |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) |
| SCH | 2/4 (50%) | 2/4 (50%) | 3/4 (75%) | 4/4 (100%) |
| CDQ | **5/7 (71%)** | 6/7 (86%) | 6/7 (86%) | 7/7 (100%) |
| **Total** | **21/25 (84%)** | **21/25 (84%)** | **23/25 (92%)** | **24/25 (96%)** |
| **Gates** | **5/5** | **5/5** | **5/5** | **5/5** |
| **Files** | **12+1p** | **13+1p** | **14 (clean sweep)** | **13+1p** |
| **Cost** | **$7.23** | **$9.40** | **$11.15** | **$7.38** |
| **Push/PR** | **AUTO (#95)** | **AUTO (#94)** | **MANUAL (#91)** | **AUTO (#86)** |
| **IS** | **100/100** | **100/100** | **100/100** | **100/100** |
| **Q×F** | **10.08** | **10.92** | **12.88** | **12.48** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN28-1: `summary-manager.js` CDQ-006 isRecording-guard inconsistency within one file | RUN28 | 1 run | P2 — spiny-orb issue #1067 |
| RUN28-2: SCH-003 widened to 5 files, 29 call sites, now confirmed bidirectional | RUN26 origin / RUN27 (2 files) / RUN28 (5 files) | 3 runs | P1 — spiny-orb issue #1037 (Short-term tier) |
| RUN28-3: `summary-manager.js`'s remaining 4-of-7 raw path sites | RUN27 (as part of 7-file finding) / RUN28 (isolated residual) | 3 runs (recurring subset) | P1 — spiny-orb issue #1068 (do not reopen closed #1035) |
| RUN28-4a: CDQ-007 PII regression — `commit_story.commit.author` | RUN26 origin / RUN27 (fixed) / RUN28 (regressed) | 1 run (regression) | P1 — spiny-orb issue #1066 |
| RUN28-4b: CDQ-007 validator severity-classification instability (blocking→advisory, no code change) | RUN28 | 1 run | P1 — spiny-orb issue #1065 (unprecedented; "high priority/demo" label) |
| RUN28-5 (Watch): `context-capture-tool.js` notes-vs-reasoning divergence | RUN28 | 1 run | P2 — related to #927, needs a second instance to justify separate tracking |
| RUN27-2/SCH-002: same-key reuse across daily/weekly/monthly-parallel functions | RUN27 / RUN28 (corroborating, different file) | 2 runs + 1 independent acceptance-gate discovery | P2 — spiny-orb issue #1063 (Medium-term tier) |
| PR summary omits SCH-003/CDQ-006 findings from Advisory Findings | RUN26 (implicit) / RUN27 / RUN28 (largest evidence set: 29 call sites) | 3+ runs | P2 — spiny-orb issue #1036 (Short-term tier) |
| CDQ-007 advisory false-positive rate | RUN11/12 (30-45%) / RUN27 (8%) / RUN28 (46%, regressed) | 3+ runs | P2 — spiny-orb issue #1060 (Medium-term tier), possibly shared root cause |
| RUN21-6: Agent notes vs. committed code divergence | RUN21-6 | 8 runs | Watch — spiny-orb issue #927 |
| Registry version discrepancy: now worse in kind — no prior file existed to have a version | RUN27 / RUN28 | 3 runs | P3 — cosmetic, not blocking |
| IS SPA-001: INTERNAL span count structural | Structural | 14 runs | Structural — threshold 55 (PR #142); research spike #929 (closed, structural finding stands) |

---

## Solution Overview

Same four-phase structure as runs 5–28.

1. **Pre-run verification** — Verify RUN28-1 through RUN28-4 fix status (including the "high priority/demo" label check on #1065/#1066); check RUN27-2/#1036/#1060 for any movement despite Medium/Short-term roadmap placement
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with per-agent methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #30

### Two-Repo Workflow

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

1. RUN28-1 (CDQ-006) status documented — `summary-manager.js` applies the guard consistently (CDQ back to 6/7 on this axis) or the inconsistency recurs with an updated finding
2. RUN28-2 (SCH-003) status documented for all four observed mismatch shapes — resolved (bidirectional check lands) or recurrence confirmed with an updated call-site count
3. RUN28-3 (CDQ-007) status documented — `summary-manager.js` applies the fallback at all 7 sites, or the residual gap persists with an updated site count
4. RUN28-4a (CDQ-007 PII) status documented — `commit_story.commit.author` no longer ships raw, or the regression persists for a second consecutive run
5. RUN28-4b (CDQ-007 severity) status documented — the blocking→advisory instability has a documented explanation, or remains an open hypothesis with the same evidence gap noted
6. Quality score ≥ 21/25 (84%, no regression from run-28); 25/25 if all four active fixes land (Q×F ~13.0+, near or at the all-time record per run-28's own §8 projection)
7. Push/PR succeeds automatically (per run-27/run-28's precedent; no spiny-orb-side risk identified)
8. Per-file span counts verified by post-hoc counting, cross-checked against source for any file the run summary reports as "0 attributes"
9. All evaluation artifacts generated from canonical methodology (per-agent approach, batches of 5, with the run-27/run-28 reconciliation-pass improvements applied before the first CodeRabbit review)
10. Both user-facing checkpoints completed (Findings Discussion + handoff pause with spoken summary, including roadmap-tier verification)
11. IS ≥ 100/100 (runs 25 through 28 all hit 100/100; this is now the expected baseline, not a stretch target)

---

## Milestones

- [ ] **Step 0 — Bootstrap reading.** Before proceeding with any other milestone, read these documents in order:
  1. `docs/language-extension-plan.md` — completely. Pay particular attention to: (a) step 9.5 (SPA-001 calibration note — commit-story-v2 threshold is 55, set by PR #142); (b) step 9 (IS scoring protocol); (c) step 6 (per-file trace supplement procedure, D-2 batch-of-5 approach, the reconciliation pass, and the CDQ-007/SCH-002 disagreement tests, now including the rule-ID label audit and exemption-scope pre-commitment added after run-28); (d) step 3 (approval-prompt check, and the hard prerequisite check added after run-28's D-14 milestone-order gap); (e) step 8 (the standing "Unrubriced Findings" category); (f) step 11 (handoff-confirmation roadmap-tier check, and the fix-scope-precision guidance added after run-28); (g) step 10 (attribute-count trend caution); (h) the "Process Requirements" section's new "Second-pass review on findings write-ups" and "Canonical list reuse" subsections.
  2. `prds/156-evaluation-run-28.md` — the immediately prior commit-story-v2 run PRD; use it as a style reference for the IS scoring milestone format and per-file evaluation structure.
  3. `evaluation/javascript/commit-story-v2/run-28/actionable-fix-output.md` — drives the current run's goals. RUN28-1 through RUN28-4 are the primary goals for this run; §7/§8 (carry-forward tracker and score projection) inform pre-run verification and success criteria.
  4. `evaluation/javascript/commit-story-v2/run-28/lessons-for-prd29.md` — process observations from run-28, already cascaded into `docs/language-extension-plan.md` and this PRD's own milestones below. Read it anyway to understand the reasoning behind those additions, in case a milestone's wording needs local adjustment.
  **Do not mark this complete until you have read all four documents.**

- [ ] **Cross-run process review** *(Step 0.5 — before any other milestones except Step 0)* — Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. Check whether any other eval target (taze, release-it, content-manager) has a completed run more recent than run-28 (`evaluation/javascript/commit-story-v2/run-28/actionable-fix-output.md`). If so, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files; present a structured checkpoint report; wait for user approval before making any template changes.

- [ ] **Collect skeleton documents** — Create `evaluation/javascript/commit-story-v2/run-29/` directory with `debug-dumps/` and a `lessons-for-prd30.md` skeleton. Must run before pre-run verification begins.

- [ ] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Datadog MCP health check** *(first, before any other pre-run step)*: Run `search_datadog_spans` with `service:commit-story` for the last 1 hour. If it fails or returns an unexpected error (not just "no results"), re-run `/ddsetup`, then `/reload-plugins`. Do not proceed until Datadog MCP queries succeed.
  2. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/javascript/commit-story-v2/run-28/actionable-fix-output.md`. Confirm the 4 new issues (#1065–#1068) and 5 corroborating comments (#1037, #927, #1036, #1060, #1063) are as recorded.
  3. **RUN28-1 fix** (P2, CDQ-006, #1067): Check whether spiny-orb main has a merged fix — either a stricter within-file consistency check, or updated prompt guidance on when to guard `setAttribute` calls. Note open/closed status.
  4. **RUN28-2 fix** (P1, SCH-003, #1037): Check whether the bidirectional type-mismatch check (String()-wrapped value into a numeric/boolean key, AND a raw numeric/boolean value into a string-typed key) has landed. This supersedes the original narrower framing — confirm the issue's acceptance criteria were actually updated to the broadened scope, not just commented on.
  5. **RUN28-3 fix** (P1, CDQ-007, #1068): Check whether `summary-manager.js`'s path-sanitization fallback now applies uniformly, or whether the fix mechanism itself was changed (e.g., a per-file consistency check rather than relying on the agent to decide per call site).
  6. **RUN28-4a fix** (P1, CDQ-007 PII, #1066): Check whether `commit_story.commit.author`-shaped PII patterns have a durable fix (not just a one-file patch that could regress again).
  7. **RUN28-4b investigation** (P1, CDQ-007 severity, #1065): Check whether the blocking→advisory severity-classification instability has been diagnosed. **Check this issue's live status directly, not just its roadmap tier** — it carries spiny-orb's "high priority/demo" label, which could mean it was fast-tracked outside normal sequencing.
  8. **RUN28-5 watch** (P2): Check whether `context-capture-tool.js`'s notes-vs-reasoning divergence pattern has any planned treatment, or remains an unaddressed watch item.
  9. **RUN27-2/#1063 status**: Check for any movement despite Medium-term tier placement.
  10. **PR-summary/#1036 status**: Check whether the PR-generation step now surfaces SCH-003/CDQ-006 findings in Advisory Findings.
  11. **CDQ-007 advisory quality/#1060 status**: Check whether the sub-check-collapsing/mistargeting issue has any planned fix.
  12. **RUN21-6 watch** (Watch, ninth run): Check whether any further changes landed for issue #927, including whether RUN28-5 was folded into its scope.
  13. **Registry version discrepancy**: Check for any fix to the version-bump reporting gap.
  14. **Other spiny-orb fixes since run-28**: Check spiny-orb main for any merged PRs relevant to commit-story-v2 evaluation.
  15. **Target repo readiness** (commit-story-v2): Verify the target checkout is on `main`, clean working tree, `spiny-orb.yaml` and `semconv/` exist.
  16. **Push auth stability check**: Verify token still works (dry-run push to non-existent branch).
  17. **File inventory**: Count `.js` files in commit-story-v2's `src/` directory. Pull the expected count from run-28's own `run-summary.md` rather than carrying forward a hardcoded number.
  18. Rebuild spiny-orb from **main**: `cd ~/Documents/Repositories/spinybacked-orbweaver && npm install && npm run build`.
  19. Record version and findings status.
  20. **README check**: Verify `README.md` on main has a row for run-28.
  21. **Datadog pre-run health check**: Use `search_datadog_spans` with `service:commit-story` (last 7 days, extending to 30 days if empty, per `evaluation/trace-capture-protocol.md`'s organic-target window). If still no results after both windows, check Datadog Agent status, record the absence, and proceed with the eval run rather than blocking indefinitely — consistent with the protocol's own "do not block evaluation" fallback for a missing pre-run trace.
  22. **Instrument branch confirmation** *(methodology smoke-test — run-29's own instrument branch doesn't exist yet at pre-run time; this validates the technique against the last known-good branch before relying on it post-run)*: Check `vcs.ref.head.revision` on recent `commit_story.journal.save_journal_entry` spans (note: NOT `git.commit.sha` — per D-10 in PRD #156). The run-28 instrument branch was `spiny-orb/instrument-1789648132789` — to get its HEAD SHA: `git -C ~/Documents/Repositories/commit-story-v2 rev-parse spiny-orb/instrument-1789648132789`. Confirming this still resolves correctly validates the approach before the "Post-run Datadog verification" milestone applies the same technique to run-29's own branch (extracted from the log at that point, per D-4 — never hardcoded there).
  23. **Capture trace artifact** (organic target): Read `evaluation/trace-capture-protocol.md`. Use `search_datadog_spans` with `service:commit-story` (last 7 days, extending to 30 days if empty, per the protocol). From the most recent complete journal generation run, record the UUID as `pre_run_service.instance.id`. Before labeling it, check the same span's `vcs.ref.head.revision` against commit-story-v2's current main-branch HEAD SHA (`git -C ~/Documents/Repositories/commit-story-v2 rev-parse main`): if it matches, write the `query` field as `query (pre-run instance, main-branch evidence)`; if it doesn't match main (and doesn't match any known instrument branch either, since none exists yet at pre-run time), write it as `query (pre-run instance, unknown provenance)` instead — do not default to "main-branch evidence" without this check. Write `evaluation/javascript/commit-story-v2/run-29/trace-artifact.md` with `pre_run_service.instance.id` plus the labeled `query` field, matching run-28's `trace-artifact.md` format. **If no complete run is found after both windows**: record `pre_run_service.instance.id: none` and `query (pre-run instance, main-branch evidence): (no trace captured — 0 spans after both windows)` instead — per the protocol's own "do not block evaluation" fallback. Either outcome satisfies this step.
  24. Append observations to `evaluation/javascript/commit-story-v2/run-29/lessons-for-prd30.md`.

  **Hard prerequisite check** (cascaded from run-28, D-14): confirm this milestone and "Collect skeleton documents" are both fully complete — not just started — before handing Whitney the instrument command in the next milestone. "Complete" means step 23 was attempted and its outcome (found or recorded-absent) is written to `trace-artifact.md` — a recorded absence satisfies this prerequisite exactly as a found trace does; only skipping the step entirely fails it. Running out of order forecloses pre-run-only steps (Datadog pre-run health check, push-auth dry-run, pre-run trace-artifact capture) permanently — they cannot be performed retroactively once the run has started. Do not repeat run-28's own D-14 gap.

- [ ] **Evaluation run-29** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/javascript/commit-story-v2/run-29/spiny-orb-output.log` using `git add -f` and write `evaluation/javascript/commit-story-v2/run-29/run-summary.md`, (3) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote: `gh pr create --body-file ~/Documents/Repositories/commit-story-v2/spiny-orb-pr-summary.md --repo wiggitywhitney/commit-story-v2 --head <instrument-branch> --title "..."`

  **Fix-verification claims** (cascaded from run-28): do not conclude "no recurrence" of RUN28-1 through RUN28-4 from the log's Schema Extensions/Agent Notes prose alone — those sections describe *new* extensions and the agent's own stated reasoning, not every `setAttribute` call on an *existing* key. Grep-based log checks missed live recurrences in both run-27 (SCH-003) and run-28 (multiple correction cycles per §5 of `actionable-fix-output.md`). Label any fix-verification claim in `run-summary.md` as **provisional pending per-file evaluation** — per-file evaluation is the authoritative check.

  **Before treating an apparently stalled run as failed**: check whether it's paused at a live interactive prompt — a `Proceed? [y/N]` push-confirmation prompt, or a `PROGRESS.md` `[a]ccept/[e]dit/[s]kip` update-confirmation prompt. Neither prompt's text reliably reaches the piped log. Check `ps` for a live process before concluding the run needs manual recovery — do not require nonzero CPU usage as the detection criterion. Use elapsed time as the deciding factor: if the run has been alive far longer than either known prompt shape would explain, with no further log activity and no crash, treat it as genuinely stalled. See `docs/language-extension-plan.md` step 3.

  AI must create `evaluation/javascript/commit-story-v2/run-29/debug-dumps/` before handing Whitney the command (already created in the skeleton step). When writing `run-summary.md`, extract the instrument branch name directly from the log (`grep -m1 'Branch:' spiny-orb-output.log`) — do not write it from context.

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  set -o pipefail; caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/commit-story-v2/run-29/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/commit-story-v2/run-29/spiny-orb-output.log
  ```
  `set -o pipefail` ensures a failure in the instrument command itself (not just `tee`) is reflected in the pipeline's exit status.

  **After saving artifacts and committing, push the eval branch to origin immediately** (`git push -u origin <eval-branch>`). The branch holds the only copy of run-29 artifacts until the "Copy artifacts to main" milestone runs.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) RUN28-1 fix result — does `summary-manager.js` apply the isRecording guard consistently?, (4) RUN28-2 fix result — any SCH-003 mismatches, in either direction?, (5) RUN28-3 fix result — does `summary-manager.js` apply the sanitization fallback at all 7 sites?, (6) RUN28-4a/b fix result — is `commit_story.commit.author` still raw, and is there any explanation for the severity flip?, (7) journal-graph.js result — twelfth consecutive success expected, (8) 3-attempt rate, (9) quality score if visible, (10) cost, (11) push/PR status. State once that (3)–(6) are provisional, log-based reads — per-file evaluation is the authoritative check and may confirm or correct them. Keep it conversational, under 12 lines. Wait for acknowledgment before proceeding.

- [ ] **Post-run Datadog verification** — After the Findings Discussion checkpoint. Record the run end time (now) alongside the eval run's start timestamp — all queries below are bounded to this closed `[start, end]` interval, not open-ended "newer than start," so unrelated commit-story activity from before or after this window can't affect `service.instance.id` selection or the correlation-rate calculation:
  1. Use `search_datadog_spans` with `service:commit-story resource_name:commit_story.journal.*` filtered to the `[start, end]` window. Check `vcs.ref.head.revision` on spans to confirm the new instrument branch is present — **not** `git.commit.sha`. The `resource_name` filter narrows to this run's own journal-generation activity rather than relying on `vcs.ref.head.revision` as the sole selector.
  2. If no spans from the instrument branch appear yet: note in `run-summary.md` and defer.
  3. When confirmed, append `post_run_service.instance.id` (distinct from the pre-run one) plus a `query (post-run instance, instrument-branch evidence)` field to the same `trace-artifact.md` under a "## Post-run verification" section — do not overwrite the pre-run fields.
  4. **Log-trace correlation check** *(commit-story-v2 only — pino bridge)*: Use `search_datadog_logs` with `service:commit-story @otel_resource_attributes.service.instance.id:<post_run_service.instance.id>` (reusing the confirmed UUID from step 3, not a bare time filter) to scope strictly to this run's own logs. Confirm that ≥1 log record has non-empty `trace_id` and `span_id`. Note the correlated vs. uncorrelated count and rate. Run-28 baseline: ~82% correlated (71/87 sampled). If zero correlated logs: flag as regression. If the rate is meaningfully below the 82% baseline (a drop of more than a few points, not just sampling noise) despite being non-zero: flag as a partial-regression watch item rather than treating any non-zero rate as automatically healthy.

- [ ] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files and committed files with ≥3 attempts AND quality failures.
  Produces: `evaluation/javascript/commit-story-v2/run-29/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

  **Priority check**: If `summarize.js` is partial again (RUN27-2/RUN28-2 unresolved), confirm the specific mismatch shapes directly against source (both the SCH-002 key-reuse and the SCH-003 type-mismatch angles), rather than assuming an unchanged recurrence.

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all rules across all committed and partial files.
  Produces: `evaluation/javascript/commit-story-v2/run-29/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **Exemption-scope pre-commitment** (cascaded from run-28 — **decide this before spawning the first batch below**, not during reconciliation): write down explicitly whether CDQ-006's isRecording-guard requirement is exempt for COV-001 entry-point spans regardless of computation cost, or only for genuinely cheap computations — pick one and apply it uniformly across every per-file evaluation agent in this run. Run-28 found this exemption applied inconsistently across sections because it was never written down before agents started scoring; deciding it after batches return, during reconciliation, would repeat that gap since agents would already have scored inconsistently by then.

  **(D-2) Spawn per-file evaluation agents in batches of 5**: Before spawning agents, create: `mkdir -p evaluation/javascript/commit-story-v2/run-29/per-file-sections/`. Spawn individual background Agent() calls with `run_in_background: true` in batches of 5. After each batch returns, write section files to disk immediately. After writing, the user clears context before spawning the next batch. At the start of each new batch, run `ls per-file-sections/` to see what's done and pick the next 5. **Background agents cannot write NEW files** — ask agents to return section content in the result text, then write each file directly.

  **Trace supplementation ownership** (cascaded from run-28): delegated per-file evaluation subagents do not reliably have Datadog MCP access even when the coordinating session does — all ~14 background agents in run-28 lacked it. Treat trace supplementation as the coordinating session's own responsibility, scheduled as a separate pass after all batches return, not assumed inline per subagent.

  **PII redaction on citation** (cascaded from run-28): any live-trace value pulled in as evidence for a PII/CDQ-007 finding (especially `commit_story.commit.author`, given RUN28-4a) must be redacted (e.g. `<redacted-person-name>`) in the same edit that adds it to a document — never as a follow-up cleanup step. A real name appeared unredacted in run-28's own working documents before a CodeRabbit review caught it.

  **Fix-verification confirmation** (cascaded from run-28): per-file evaluation is the authoritative check for whether RUN28-1 through RUN28-4 actually recurred — it supersedes, and may correct, `run-summary.md`'s provisional fix-verification claims from the Evaluation run milestone. For each of these four rules, check every call site of the affected key(s)/pattern against the instrumented source directly, not the run-summary's log-based pass.

  **Reconciliation pass (after all batches return, before the first CodeRabbit review)**: independent per-file agents scoring the same underlying pattern can disagree — diff verdicts across files sharing a rule and flag disagreements before the first CodeRabbit review. Apply the two reusable tests from run-27 (**CDQ-007 "structural guarantee" test** and **SCH-002 "specific wrong noun vs. generic reasonable term" test**), plus:
  - **Rule-ID label audit** (cascaded from run-28): before this pass, spot-check that each per-file section's row content actually matches its stated rule ID's canonical definition, not just that the verdict is defensible — a row can carry a correct PASS/FAIL verdict while evaluating the wrong rule's concern (run-28 found a CDQ-006 row actually evaluating NDS-006's concern).

  **Correct-skip verification**: for each file the run summary labels a "correct skip," grep that file's own pre-instrumentation-analysis block in `spiny-orb-output.log` for a COV-001/COV-004 flag the final output didn't act on.

  **COV-005 methodology (attribute presence, not attribute identity)**: COV-005 passes if a span carries ≥1 meaningful domain attribute. Attribute variation between runs is normal.

  **Attribute-count trend caution**: before flagging any cross-run "declining richness" trend for any file, verify reported attribute counts against direct source inspection rather than trusting `attributesCreated`/"N attributes" figures alone. See `docs/language-extension-plan.md` step 10.

  **Canonical list reuse** (cascaded from run-28): when a list needs to appear in multiple documents this run (e.g. "the files affected by RUN28-2's SCH-003 widening"), copy it verbatim from its source of truth (run-28's own `rubric-scores.md` or `actionable-fix-output.md`) rather than reconstructing it from memory. Run-28's own file lists were silently corrupted across multiple retypings before being caught.

  **Trace provenance labeling**: record both the instrument branch's actual HEAD SHA (from pre-run verification item 22's technique, applied to run-29's own branch) and commit-story-v2's main-branch HEAD SHA at the time of the run. For each cited trace, compare its `vcs.ref.head.revision` — **not** `git.commit.sha` — against both: label a match to the instrument branch's SHA as "instrument-branch evidence," a match to main's SHA as "main-branch evidence (corroborating, not direct)," and a revision matching neither as "unknown provenance" rather than defaulting it to either label.

  **Important**: Per-file evaluation agents must read the instrumented source directly (`git show <instrument-branch>:src/file`); do not rely on agent notes alone. Additionally, each agent must read the `Agent thinking` and `Agent notes` blocks for that file from `spiny-orb-output.log`.

  **(D-2 trace supplement)** After all batches return and section files are written, the coordinating session checks `trace-artifact.md` for `post_run_service.instance.id` and its post-run query. **If both are present**: first run the post-run query with no prefix filter and inspect the returned `resource_name` values to derive the correct prefix for each affected file (do not hardcode it), then rerun per affected section as `search_datadog_spans` with the post-run query + `resource_name:<derived_prefix>.*` to supplement that section, before the reconciliation pass. **If post-run verification was deferred**: proceed without trace supplementation, marking it "unavailable (post-run verification deferred)" — never substitute the pre-run field.

  **(D-1) Track attempt counts**: For each file, note attempts. If a file required ≥3 attempts AND has a quality failure, include the verbose log section as input to the per-file evaluation agent.

  **Key watch items for per-file evaluation**:
  - `summary-manager.js` — Does it apply the isRecording guard consistently (RUN28-1)? Does it apply the path-sanitization fallback at all 7 sites (RUN28-3)?
  - `summarize.js`, `summary-detector.js`, `auto-summarize.js`, `git-collector.js` — Do any emit a type mismatch in either direction against a declared registry key (RUN28-2)?
  - `git-collector.js`, `context-integrator.js` — Does `commit_story.commit.author` still ship raw (RUN28-4a)?
  - `context-capture-tool.js` — Does the notes-vs-reasoning divergence pattern recur (RUN28-5)?
  - `journal-manager.js` — Does any new "correct type, wrong registered key" instance appear? Score per the standing Unrubriced Findings category if it does.
  - `journal-graph.js` — Twelfth consecutive success expected.

- [ ] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/javascript/commit-story-v2/run-29/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`
  PR: Find the URL in `evaluation/javascript/commit-story-v2/run-29/run-summary.md`.

  **RUN28/#1036 watch**: check specifically whether this run's SCH-003/CDQ-006 canonical failures (if any recur) appear in the PR's Advisory Findings section — run-28 found zero of five rule findings surfaced there.

  **RUN28/#1060 watch**: track the advisory contradiction rate (false-positive/mistargeted line items ÷ total advisory line items) and compare to run-27's 8% and run-28's 46%.

- [ ] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/javascript/commit-story-v2/run-29/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

  **Unrubriced findings category**: if a "correct type, wrong registered key" pattern is found (RUN27-5-shaped), score it as a canonical failure in the narrative for consistency, but list it under the standing "Unrubriced Findings" section rather than folding it into any dimension's score.

  **Use run-28 rubric as the primary precedent reference** (`evaluation/javascript/commit-story-v2/run-28/rubric-scores.md`). Critical precedents:
  1. **CDQ-006 precedent**: Advisory findings are not canonical failures — do NOT fail CDQ-006 for advisory findings.
  2. **COV-001 failed-file precedent**: Files that failed to commit but whose output would have passed COV-001 are scored as COV-001 PASS.
  3. **COV-005 delta observation precedent**: Coverage delta observations are narrative only.
  4. **CDQ-007 self-identified-fix precedent**: a raw-path/similar advisory finding becomes a canonical FAIL when the agent's own generation-time notes name a specific, cost-free remediation and decline to apply it.
  5. **CDQ-007 "structural guarantee" test**, **SCH-002 "specific wrong noun vs. generic reasonable term" test**, **rule-ID label audit**, and **exemption-scope pre-commitment** — apply during the per-file evaluation reconciliation pass, not at scoring time.
  6. **Fix scope precision** (cascaded from run-28): when scoring RUN28-1 through RUN28-4, if any is only partially resolved, state the fixed/total ratio explicitly (e.g. "resolved at 5 of 7 sites") rather than a bare PASS/FAIL — and distinguish "the failure pattern no longer reproduces" from "the fix mechanism actually fired," the same distinction that corrected run-28's own RUN27-4 "6 of 7 files" claim (only 1 of those 6 files actually exercised the fix; the other 5 passed by omission).
  **Rule set**: CDQ dimension is 7/7 max (CDQ-001, CDQ-002, CDQ-003, CDQ-005, CDQ-006, CDQ-007, CDQ-008). NDS-007 is Control Flow Preserved.

- [ ] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9. Full protocol in `evaluation/is/README.md`.

  **Note**: SPA-001 threshold for commit-story-v2 is 55 (set by PR #142). SPA-002 is de-facto resolved for commit-story-v2 (`SimpleSpanProcessor` + `shutdownAndExit` override) — this is an architectural conclusion already validated across runs 25–28, not something to re-derive from scratch. IS 100/100 in runs 25 through 28 is the baseline. If IS returns <100/100 in run-29: check the scorer's own rule-level results first. If SPA-002 itself is reported as the failing rule, or Datadog shows an orphan span with an unknown `parentSpanId`, investigate it normally — the architectural conclusion doesn't override live evidence of an actual SPA-002 failure. Only skip re-investigating SPA-002 specifically when the score drop is attributable to a **different**, confirmed rule failure.

  **Note on Datadog Agent**: Do NOT run `datadog-agent stop/start`. The Agent's embedded OTLP HTTP receiver is permanently disabled (port 4318 owned by `otelcol-contrib`).

  **Read `~/.claude/rules/is-scoring-gotchas.md` before step 1.** `otelcol-contrib` runs as a persistent macOS LaunchAgent — check with `lsof -i :4318 -sTCP:LISTEN` first. If it shows `otelcol-c` as the listener, skip starting a new instance entirely.

  1. **If no listener was found above, Claude starts** the OTel Collector in the background:
     ```bash
     vals exec -f ~/Documents/Repositories/spinybacked-orbweaver-eval/.vals.yaml -- ~/.local/bin/otelcol-contrib --config ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/is/otelcol-config.yaml > /tmp/otelcol.log 2>&1 &
     COLLECTOR_PID=$!
     deadline=$((SECONDS + 30)); until lsof -p "$COLLECTOR_PID" -a -iTCP:4318 -sTCP:LISTEN >/dev/null 2>&1; do kill -0 "$COLLECTOR_PID" 2>/dev/null || { echo "Collector exited before binding port 4318" >&2; exit 1; }; [ "$SECONDS" -ge "$deadline" ] && { kill "$COLLECTOR_PID" 2>/dev/null; exit 1; }; sleep 0.5; done
     ```
  2. **Claude checks out** instrument files and runs the app from `~/Documents/Repositories/commit-story-v2`:
     ```bash
     git checkout <instrument-branch> -- src/ examples/
     OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node --import ./examples/instrumentation.js src/index.js HEAD
     git reset HEAD -- src/ examples/ && git checkout -- src/ examples/ && find src/ examples/ -name '*.instrumentation.md' -delete
     ```
     Note: omit `COMMIT_STORY_TRACELOOP=true`. **Do not restore with `git checkout main -- src/ examples/` alone** (D-15 in PRD #156) — the `git reset` + `checkout` + targeted-`find -delete` sequence is required. **Do not use `git clean -fd`** for this — it removes any untracked file under those paths, not just the known leftover type. Verify with `git status --short` afterward.
  3. **Claude stops** the Collector: `kill "$COLLECTOR_PID"` — **skip this step entirely** if the persistent LaunchAgent instance was already running.
  4. **Claude filters, then runs the scorer**, from `~/Documents/Repositories/spinybacked-orbweaver-eval`. Do NOT score `evaluation/is/eval-traces.json` directly — it is shared and never truncated. `service.name == "commit-story"` plus a time window alone isn't a unique identity match — commit-story-v2 also dogfoods itself on ordinary main-branch traffic, so a same-target session could overlap the window. Extract this invocation's own `service.instance.id` from the local OTLP export's resource attributes (the app run in step 2 above), then filter to `service.name == "commit-story"` AND that exact `service.instance.id` AND the invocation's time window — never `vcs.ref.head.revision` as a substitute identity check here. Write the filtered (but not yet sanitized) subset to a local scratch file. Score this pre-redaction copy first — `node evaluation/is/score-is.js <scratch-file> --target commit-story-v2` — and record the result as the baseline. Then create the sanitized copy at `evaluation/javascript/commit-story-v2/run-29/eval-traces-run29.json` (redacting local-machine identity fields — `process.owner`, `host.id`, `host.name`, `process.command_args`, `process.executable.path`, `process.command` — and, given RUN28-4a is this run's PII watch item, `commit_story.commit.author` or any other person-identifying attribute if it appears in the filtered spans), and score it: `node evaluation/is/score-is.js evaluation/javascript/commit-story-v2/run-29/eval-traces-run29.json --target commit-story-v2 > evaluation/javascript/commit-story-v2/run-29/is-score.md`. The pre- and post-redaction scores must match — if they don't, the redaction touched a field the scorer actually uses; investigate and document the discrepancy's rule-level cause before treating either score as final. Only the sanitized file gets committed.
  5. **Confirm IS scoring traces in Datadog**: Record IS scoring run start time, then query `service:commit-story from:<run-start-time>`. Record `service.instance.id`.
  Produces: `evaluation/javascript/commit-story-v2/run-29/is-score.md`

- [ ] **Baseline comparison** — Compare run-29 vs runs 2–28 (run-22 was never executed).
  Produces: `evaluation/javascript/commit-story-v2/run-29/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

  **Attribute-count trend caution**: before flagging any cross-run "declining richness" trend, verify reported attribute counts against direct source inspection rather than trusting logged figures alone.

  **Fix scope precision** (cascaded from run-28): when comparing RUN28-1 through RUN28-4's status to run-28, distinguish "the failure pattern no longer reproduces" from "the fix mechanism actually fired" wherever a partial or ambiguous resolution is found — do not repeat run-28's own initial miscount on RUN27-4's "6 of 7 files."

- [ ] **Update root README** — Add a row for run-29 to the run history table (quality, gates, files, spans, cost, push/PR, IS score). Update the "next run" sentence to reference run-30 and its primary goals.

- [ ] **Actionable fix output** — Primary handoff deliverable.

  At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-29 evaluation artifacts.
  2. **Handoff-confirmation depth**: When Whitney confirms handoff to the spiny-orb team, verify each finding's actual roadmap tier/sequencing against spiny-orb's `docs/ROADMAP.md`. State explicitly in the next run's goals section whether any of #1037/#1036/#1060/#1063/#1065/#1066/#1067/#1068 moved tiers or got fast-tracked (especially #1065/#1066 given their demo-priority label), rather than assuming the run-28 tier assessment still holds.
  3. **Second-pass review** (cascaded from run-28): run a CodeRabbit CLI review on `run-summary.md`, `per-file-evaluation.md`, `rubric-scores.md`, `baseline-comparison.md`, and `actionable-fix-output.md` before reporting conclusions to Whitney — not only before opening a PR. Run-28 caught a missed live rule recurrence, an unredacted PII exposure, and a corrupted file list this way, all before they reached the handoff document.
  4. **Fix scope precision** (cascaded from run-28): for RUN28-1 through RUN28-4, state the fixed/total ratio explicitly wherever a fix is partial, and distinguish "no longer reproduces" from "fix mechanism fired" the same way run-28's write-up was corrected to do for RUN27-4.
  5. **Spoken summary (root cause + generalization)** *(user-facing checkpoint 2)*: Before printing the file path, provide a spoken summary with three elements: (a) **Main points** — key failures, category, priority; (b) **Root cause vs. symptom** — for each fix, state whether it addresses root cause or symptom; (c) **Every-user generalization check** — how each fix helps any spiny-orb user, not just commit-story-v2.
  6. Print the absolute file path of `evaluation/javascript/commit-story-v2/run-29/actionable-fix-output.md`.
  7. **Pause.** Do not proceed to Draft PRD #30 until Whitney confirms handoff to spiny-orb team.

  **Handoff framing guidance** (carried forward from taze run-16, run-26, run-27, run-28):
  - **Fix language targets spiny-orb components, not target files.** "Fix:" entries should describe the spiny-orb component gap — auto-fix, validator, prompt, or fix-loop. Do not write "remove String() at line 42 of file.ts."
  - **Attribute disappearance is not automatically a finding.** Investigate before calling it wrong.
  - **Carry-forward table: consider distinguishing findings from observations.**
  - **"0 attributes" in the run summary means 0 NEW schema attributes, not 0 attributes used.**

- [ ] **Draft PRD #30** — Follow `docs/language-extension-plan.md` step 12. Complete the template-update checkpoint first. Cascade approved process improvements to three places: (1) the template, (2) all other currently active open eval PRDs, and (3) the affected milestones of PRD #30 itself before committing. Draft PRD #30 using this PRD as the style reference. Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints.

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/javascript/commit-story-v2/run-29/` to copy all artifacts. Commit to main with message `eval: save run-29 artifacts to main [skip ci]`. Add one row to `evaluation/javascript/commit-story-v2/run-log.md` for run-29. Update `PROGRESS.md` with an entry for run-29 (per global CLAUDE.md's PROGRESS.md style rules) before `/prd-done` runs. Push main. This step runs before `/prd-done`.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D-1 | This PRD bakes the nine process improvements cascaded from run-28 directly into its own affected milestones (Pre-run verification, Evaluation run, Per-file evaluation, Rubric scoring, Baseline comparison, Actionable fix output), rather than only pointing to `docs/language-extension-plan.md`. | A cold AI reading only this PRD during execution will not re-read the template — per the template's own step 12.4 cascade requirement, and consistent with how the same cascade was applied to PRDs #147, #100, and #143 in the same session. | 2026-09-18 |

---
