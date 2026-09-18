// ABOUTME: Baseline comparison for run-28 — cross-run quality trend and key changes vs runs 2–27.
# Baseline Comparison — Run-28 vs Runs 2–27

---

## Cross-Run Quality Trend (Full History)

| Run | Date | Quality | Gates | Files | Spans | Cost | Push/PR | IS | Q×F |
|-----|------|---------|-------|-------|-------|------|---------|-----|-----|
| 2 | 2026-03-12 | 20/27 (74%) | 3/4 | 10 | — | — | NO | — | 7.4 |
| 3 | 2026-03-13 | 19/26 (73%) | 4/4 | 11 | — | — | NO | — | 8.0 |
| 4 | 2026-03-16 | 15/26 (58%) | 4/4 | 16 | — | $5.84 | NO | — | 9.2 |
| 5 | 2026-03-17 | 23/25 (92%) | 5/5 | 9 | 17 | $9.72 | NO | — | 8.3 |
| 6 | 2026-03-20 | 21/25 (84%) | 5/5 | 5 | 16 | $11.02 | NO | — | 4.2 |
| 7 | 2026-03-20 | 22/25 (88%) | 5/5 | 13 | 28 | $3.22 | NO | — | 11.4 |
| 8 | 2026-03-21 | 23/25 (92%) | 5/5 | 12 | 28 | $4.00 | NO | — | 11.0 |
| 9 | 2026-03-21 | **25/25 (100%)** | 5/5 | 12 | 26 | $3.97 | NO | — | 12.0 |
| 10 | 2026-03-23 | 23/25 (92%) | 5/5 | 12 | 28 | $4.36 | NO | — | 11.0 |
| 11 | 2026-03-30 | **25/25 (100%)** | 5/5 | 13 | 39 | $4.25 | YES (#60) | — | 13.0 |
| 12 | 2026-04-09 | 23/25 (92%) | 5/5 | 12+1p | 31 | $5.19 | YES (#61) | — | 11.0 |
| 13 | 2026-04-12 | **25/25 (100%)** | 5/5 | 7 | — | — | YES (#62) | — | 7.0 |
| 14 | 2026-04-15 | 22/25 (88%) | 5/5 | 12 | — | — | YES (#65) | — | 10.6 |
| 15 | 2026-05-03 | 24/25 (96%) | 5/5 | 14 | ~37 | $6.44 | YES (#66) | 70 | 13.4 |
| 16 | 2026-05-11 | 22/25 (88%) | 5/5 | 10+3p | ~24 | $12.29 | YES (#68) | 80 | 8.8 |
| 17 | 2026-05-12 | 22/25 (88%) | **4/5** | 10+1p | ~28 | $10.43 | YES (#69) | 90 | 8.8 |
| 18 | 2026-05-16 | 24/25 (96%) | 5/5 | 11 | 36 | $9.16 | YES (#70, manual) | 90 | 10.6 |
| 19 | 2026-05-25 | 21/25 (84%) | 5/5 | 10+3p | 30 | $8.83 | AUTO (#71) | 80 | 8.4 |
| 20 | 2026-06-01 | 24/25 (96%) | 5/5 | 12 | 42 | $9.08 | AUTO (#73) | 80 | 11.5 |
| 21 | 2026-06-04 | 23/25 (92%) | 5/5 | 12 | 42 | ~$8.10 | AUTO (#74) | 90 | 11.0 |
| 23 | 2026-06-10 | 24/25 (96%) | 5/5 | 13+1p | 45 | $7.84 | AUTO (#75) | 80 | 12.48 |
| 24 | 2026-06-18 | 23/25 (92%) | 5/5 | 14 | 48 | ~$3.70 | AUTO (#81) | 80 | 12.88 |
| 25 | 2026-06-19 | 24/25 (96%) | 5/5 | 13+1p | 47 | $7.38 | AUTO (#86) | 100 | 12.48 |
| 26 | 2026-07-17 | 23/25 (92%) | 5/5 | 14 | 41 | $11.15 | MANUAL (#91) | 100 | 12.88 |
| 27 | 2026-09-02 | 21/25 (84%) | 5/5 | 13+1p | 48 | $9.40 | AUTO (#94) | 100 | 10.92 |
| **28** | **2026-09-17** | **21/25 (84%)** | **5/5** | **12+1p** | **48** | **$7.23** | **AUTO (#95)** | **100** | **10.08** |

Run-22 was never executed (PRD #115 closed 2026-06-05 without a run). Run-23 follows directly from run-21; run-25 follows directly from run-24; run-26 follows directly from run-25; run-27 follows directly from run-26; run-28 follows directly from run-27.

Run-28 spans: 48 total (45 spans from 12 committed files + 3 spans from `summarize.js`'s 3-of-3-eligible-function partial commit) — ties run-27's and run-24's all-time record of 48, despite one fewer committed file than run-27 (12 vs 13). `summary-manager.js` alone contributes 9 spans (all committed cleanly, vs. 7 in run-27's partial state) and `summary-detector.js` contributes 9 more, offsetting the missing file. Push/PR: second consecutive AUTO success.

---

## Dimension Trend (Runs 24–28)

| Dimension | Run-24 | Run-25 | Run-26 | Run-27 | **Run-28** |
|-----------|--------|--------|--------|--------|-----------|
| NDS | 2/2 | 2/2 | 2/2 | 2/2 | **2/2** |
| COV | 5/5 | 4/5 | 5/5 | 4/5 | **5/5** |
| RST | 4/4 | 4/4 | 4/4 | 4/4 | **4/4** |
| API | 3/3 | 3/3 | 3/3 | 3/3 | **3/3** |
| SCH | 3/4 | 4/4 | 3/4 | 2/4 | **2/4** |
| CDQ | 6/7 | 7/7 | 6/7 | 6/7 | **5/7** |
| **Total** | **23/25** | **24/25** | **23/25** | **21/25** | **21/25** |

Run-28 ties run-27's series-low total (21/25), but the composition inverts: COV recovers fully (5/5, first clean sweep since run-26) while CDQ drops to its lowest point in the series (5/7) — the first run in which CDQ-006 has ever failed. SCH holds flat at run-27's regressed 2/4. NDS, RST, and API remain at 100% across every measured run since run-5.

---

## Key Changes in Run-28

### 1. Quality: 21/25 → 21/25 (Flat, Ties Series Low — but Different Failure Mix)

Run-27 and run-28 both land at 21/25 (84%), but the underlying dimension movement is a near-complete swap:

- **COV-003 FIXED (RUN27-1 resolved)**: `summary-manager.js` commits cleanly across all 9 span-eligible functions for the first time since run-26 — spiny-orb PR #1058's `isExpectedConditionCatch` fix genuinely resolved the two-run recurrence. COV returns to 5/5.
- **SCH-002 PARTIALLY FIXED (RUN27-2)**: the validator now catches the same-file, same-pass key-reuse contradiction and rejects the offending call sites, forcing `summarize.js` to PARTIAL — an improvement over run-27's silent full commit with a latent bug, but the agent still generates the mistake in the first place. Net effect: SCH-002 still fails.
- **SCH-003 CONFIRMED RECURRING, WIDER (RUN27-3, unresolved as expected)**: widened from 2 files (run-27) to 5 files (run-28) — the largest SCH-003 footprint recorded in this series. 12 occurrences of the original `String(x.length)`-vs-int-key shape plus 2 of the opposite-direction mismatch, both newly-invented keys in `summarize.js`, `summary-detector.js`, `auto-summarize.js`; plus 2 separately-tracked instances in `git-collector.js` and `summary-manager.js`.
- **CDQ-007 PARTIALLY RESOLVED (RUN27-4, real but incomplete progress)**: the shared-representation fix (inline sanitization fallback) resolves the raw-path pattern at 6 of the original 7 affected files with no per-file `basename` import needed — but `summary-manager.js` still ships raw unsanitized paths at 4 of its 7 `file_path` sites, using the same fallback correctly at the other 3. A separate, new PII regression (`commit_story.commit.author`, previously fixed in run-27) also reappeared in `git-collector.js` and `context-integrator.js`.
- **CDQ-006 FAIL (new)**: `summary-manager.js`'s `isRecording()` guard applied to only 3 of ~24 `setAttribute` calls with no stated exemption basis for the rest — the first CDQ-006 failure recorded in this run series.

### 2. File Count: 12 Committed, 1 Partial (Down One File from Run-27)

Run-27 committed 13 files + 1 partial; run-28 committed 12 + 1 partial (32 total files in `src/`, unchanged file inventory — the difference is not a new/removed file, it's the same `summarize.js` partial-commit shape recurring under a different rule).

### 3. Span Count: 48 (Ties the All-Time Record, Despite One Fewer Committed File)

Matches run-27's and run-24's 48-span record. `summary-manager.js`'s clean COV-003 fix (9 spans, up from 7 in its run-27 partial state) and `summary-detector.js`'s 9 spans absorb the loss from having one fewer committed file overall.

### 4. Q×F: 10.08 — Down from Run-27's 10.92

Q×F = 21/25 × 12 committed files = 10.08. The quality percentage held flat at 84%, but the committed-file count dropped from 13 to 12 — this run continues the pattern (noted in run-27) of Q×F tracking file-count changes more than quality-percentage changes when the percentage itself doesn't move.

### 5. IS Score: 100/100 (Fourth Consecutive Perfect Score)

| IS Rule | Run-28 | Run-27 | Run-26 | Change |
|---------|--------|--------|--------|--------|
| SPA-001 (≤55 INTERNAL spans for commit-story-v2) | ✅ 31 spans | ✅ 47 spans | ✅ 20 spans | Stable — comfortably within per-target threshold across all four runs |
| SPA-002 (no orphan spans) | ✅ PASS | ✅ PASS | ✅ PASS | Stable |
| All other applicable rules | ✅ PASS | ✅ PASS | ✅ PASS | Stable |

Run-25, run-26, run-27, and now run-28 form a four-run streak at 100/100 — the longest perfect-IS streak in the series.

### 6. Cost: $7.23 (Down from Run-27's $9.40, -23.1%)

Lowest cost since run-24 (~$3.70) and run-25 ($7.38). Consistent with the pre-run projection that validator-level fixes (rather than added generation-time reasoning) should hold cost in the $7-10 range.

### 7. Push/PR: AUTO Success, Second Consecutive

PR #95 auto-created with no manual recovery needed, continuing directly from run-27's AUTO (#94) — the automated push/PR path has now been stable across two runs following run-26's one-run manual-recovery interruption.

### 8. RUN27-5 Resolved: `journal-manager.js`'s Wrong-Registered-Key Pattern Does Not Recur

Run-27's unrubriced "correct type, wrong registered key" finding (`quotes_count` holding a reflection count) does not persist into run-28 and no third instance appeared elsewhere. No Unrubriced Findings entry is needed this run — the standing category (D-12) remains available but unused.

---

## Score Projection Validation

PRD #156 defined success criteria (RUN27-1 through RUN27-4 fix verification plus no regression from run-27):

| Criterion | Projected | Actual | Verdict |
|-----------|-----------|--------|---------|
| RUN27-1 (COV-003) resolved — `summary-manager.js` commits cleanly across all 9 functions | COV returns to 5/5 | ✅ Fully resolved, COV 5/5 | **Met** |
| RUN27-2 (SCH-002) resolved — `summarize.js` avoids contradictory key reuse | SCH contributes 4/4 with this + criterion 3 | ⚠️ Validator now rejects the reassembly, but the agent still generates the contradiction; `summarize.js` goes PARTIAL instead of a silent full commit | **Not met** |
| No declared-vs-emitted type mismatch anywhere (criterion 3, covers RUN27-3 + any other type mismatch) | SCH contributes 4/4 only if this and criterion 2 both hold | ❌ 14 mismatches across 3 files (RUN27-3 shape + opposite-direction), plus 2 separate instances in `git-collector.js`/`summary-manager.js` — SCH held at 2/4 | **Not met** |
| RUN27-4 (CDQ-007) resolved at every site | CDQ returns to 7/7 if fixed at all 7 original sites | ⚠️ 6 of 7 originally-affected files fully clean via shared fallback; `summary-manager.js` still raw at 4 of 7 sites. Plus a new CDQ-006 failure and a new PII regression pulled CDQ down further, to 5/7 | **Not met** |
| Quality ≥ 21/25 (no regression from run-27); 25/25 if all four fixes land | ≥21/25, 25/25 stretch | 21/25 (84%) — floor held exactly, stretch not reached | **Met (floor only)** |
| Push/PR succeeds automatically | YES | ✅ AUTO (#95), second consecutive | **Met** |
| IS ≥ 100/100 | ≥100/100 | ✅ 100/100 (fourth consecutive) | **Met** |

Of the four primary fix-verification goals, one (RUN27-1/COV-003) is genuinely and fully resolved. The other three landed as partial progress rather than clean fixes: RUN27-2's validator now catches the mistake but the agent still makes it; RUN27-3 was never expected to be fixed this run (correctly recurred, wider); RUN27-4's shared-fallback mechanism works everywhere it's applied but isn't applied everywhere it needs to be. The quality floor held (no regression below run-27), but the stretch target (25/25, all four fixes landing cleanly) was not reached — the net score stayed flat only because COV's full recovery was offset by CDQ's new failures (CDQ-006, the PII regression) rather than by continued SCH-003/CDQ-007 recurrence alone.

---

## Records and Notable Milestones (Updated)

| Record | Value | Run |
|--------|-------|-----|
| Highest quality | 25/25 (100%) | Runs 9, 11, 13 |
| Highest Q×F | 13.4 | Run-15 |
| Most files committed (0 partial) | 14 | Run-15, Run-24, Run-26 |
| Most spans (committed + partial) | 48 | Run-24 (14 committed, 0 partial), Run-27 (13 committed + 1 partial), **Run-28 (tied — 12 committed + 1 partial)** |
| Lowest cost | $3.22 | Run-7 |
| Highest cost | $12.29 | Run-16 |
| Lowest cost among runs with IS scoring | **$7.23** | **Run-28** |
| First push/PR | Run-11 | #60 |
| First IS score | Run-15 | 70/100 |
| Highest IS | 100/100 | Run-25, Run-26, Run-27, **Run-28 (four-run streak)** |
| First fully automatic push+PR | Run-19 | #71 |
| Lowest quality since rubric stabilized (run-5+) | 21/25 (84%) | Run-6, Run-19, Run-27, **Run-28 (tied)** |
| First CDQ-006 failure recorded | — | **Run-28** |

---

## Failure Classification (Active Issues Into Run-29)

| Failure | First Seen | Runs Open | Root Cause | Fix Available |
|---------|-----------|-----------|------------|---------------|
| SCH-002: same-file key-reuse contradiction (validator now catches it; agent behavior unchanged) | Run-27 | 2 (run-27 silent commit, run-28 validator-caught partial) | Agent invents a count key for one meaning, then reuses it for a different count in the same file/pass — the spiny-orb PR #1058 fix rejects the reassembly but doesn't stop the agent from attempting it | Prompt-level fix needed: the agent still needs to learn not to reuse a declared key across contradictory meanings, not just have the reuse blocked at commit time |
| SCH-003: declared-vs-emitted type mismatch (`String(x.length)`-vs-int and opposite-direction) | Run-26 (RUN26-1) | 3 (recurring, widening each time: journal-manager.js → git-collector.js/summary-detector.js → summarize.js/summary-detector.js/auto-summarize.js/git-collector.js/summary-manager.js) | Validator does not catch explicit `String(...)` coercion of a numeric value against an int/number-typed key, nor the reverse (a boolean/number set against a string-typed key) | Validator fix (#1037): extend SCH-003 to detect coercion patterns in both directions, not just literal AST type inference |
| CDQ-007: raw path/PII, partially resolved via shared fallback | Run-26 (RUN26-2) | 3 (widened 1→7 files, now 6 of 7 fixed but `summary-manager.js` remains partially raw; separately, `commit_story.commit.author` PII regressed after being fixed in run-27) | The inline sanitization fallback mechanism is correct and durable where applied, but wasn't applied to all 7 of `summary-manager.js`'s `file_path` sites; the PII regression suggests the fix isn't consistently re-applied across regenerations | Fix needed (#1035): audit `summary-manager.js`'s remaining 4 raw sites specifically; investigate why `commit_story.commit.author` regressed after being clean in run-27 |
| CDQ-006: inconsistent `isRecording()` guard application | **Run-28** | 1 | `summary-manager.js` applies the guard to only the 3 `file_path` sites that use the sanitization split, leaving ~21 other `setAttribute` calls unguarded with no stated exemption | New finding — no prior spiny-orb issue yet; needs filing in this run's actionable fix output |

**Resolved from Run-27 into Run-28:**

| Item | Resolution |
|------|-----------|
| RUN27-1 (COV-003): `summary-manager.js` partial-commit recurrence | Fully resolved — spiny-orb PR #1058's `isExpectedConditionCatch` fix holds; no recurrence this run |
| RUN27-5 (unrubriced): `journal-manager.js`'s correct-type-wrong-key pattern | Does not recur; no third instance found elsewhere. Standing Unrubriced Findings category (D-12) remains unused this run |

**Historical / structural watch item (not an active issue):**

| Item | First Seen | Status |
|------|-----------|--------|
| IS SPA-001: INTERNAL span count | Run-15 | Structurally resolved via per-target threshold (PR #142, 55 for commit-story-v2); holds across run-25 (31 spans), run-26 (20 spans), run-27 (47 spans), and run-28 (31 spans). No action needed |
