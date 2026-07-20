// ABOUTME: Baseline comparison for run-26 — cross-run quality trend and key changes vs runs 2–25.
# Baseline Comparison — Run-26 vs Runs 2–25

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
| **26** | **2026-07-17** | **23/25 (92%)** | **5/5** | **14** | **41** | **$11.15** | **MANUAL (#91)** | **100** | **12.88** |

Run-22 was never executed (PRD #115 closed 2026-06-05 without a run). Run-23 follows directly from run-21; run-25 follows directly from run-24; run-26 follows directly from run-25.

Run-26 spans: 41 total, all from 14 fully committed files (0 partial) — the first run since run-24 to commit 14 files with zero partial. Push/PR: first manual recovery after 6 consecutive AUTO successes (runs 19–21, 23–25; run-22 never executed) — caused by premature manual recovery during a ~27.5-hour approval pause, not a spiny-orb defect (see RUN26-3).

---

## Dimension Trend (Runs 21–26)

| Dimension | Run-21 | Run-23 | Run-24 | Run-25 | **Run-26** |
|-----------|--------|--------|--------|--------|-----------|
| NDS | 2/2 | 2/2 | 2/2 | 2/2 | **2/2** |
| COV | 4/5 | 5/5 | 5/5 | 4/5 | **5/5** |
| RST | 4/4 | 4/4 | 4/4 | 4/4 | **4/4** |
| API | 3/3 | 3/3 | 3/3 | 3/3 | **3/3** |
| SCH | 4/4 | 3/4 | 3/4 | 4/4 | **3/4** |
| CDQ | 6/7 | 7/7 | 6/7 | 7/7 | **6/7** |
| **Total** | **23/25** | **24/25** | **23/25** | **24/25** | **23/25** |

The series has now alternated 23→24→23→24→23 across the last five runs — no dimension has held a clean pass streak longer than two consecutive runs except NDS, RST, and API, which remain at 100% across every measured run. Run-26 repeats run-24's exact dimension profile (COV 5/5, SCH 3/4, CDQ 6/7) despite the underlying failures being entirely different files and rules in each run — this is coincidental score equality, not a repeat of the same defect.

---

## Key Changes in Run-26

### 1. Quality: 24/25 → 23/25 (-1 point, but different failures than run-24)

Run-25 scored 24/25 via one failure (COV-004 false positive on summary-manager.js). Run-26 resolves that failure completely but introduces two new, unrelated ones.

**+1 point: COV-004 RESOLVED (RUN25-1) — summary-manager.js validator false positive**

All 9 exported async functions in summary-manager.js committed cleanly in run-26 (0 partial), versus run-25's 7/9 with 2 functions blocked by the validator's `isExpectedConditionCatch` false positive on the conditional-rethrow ENOENT pattern. The validation journey for this run shows 2 legitimate attempts driven by real missing-`recordException` findings, not a repeat of the false-positive rejection — this run's outcome is confirmed via that journey, not a lucky pass. No spiny-orb code change is confirmed to have caused this (the validator source wasn't diffed against run-25), so track this as resolved-for-this-run rather than a confirmed permanent fix; a recurrence in a future run would indicate the false positive is still latent.

**-1 point: SCH-003 FAIL (new) — journal-manager.js `reflections_count` type mismatch**

`commit_story.journal.reflections_count` is declared `type: int` in the registry but committed code sets it via `String(reflections.length)` — confirmed live as the quoted string `"0"`. Only 1 generation attempt was needed, meaning the validator never flagged this coercion during generation. This is a validator coverage gap (it doesn't catch `String(x.length)`-style stringification against an int-typed attribute), not an agent reasoning failure.

**-1 point: CDQ-007 FAIL (new) — journal-paths.js raw filesystem path**

`commit_story.journal.file_path` on the `ensureDirectory` span is a raw path with no `basename()` applied, despite `basename` from `node:path` being available and used correctly elsewhere in this same run. The agent's own report self-acknowledged this as a known limitation but didn't apply the trivial fix — likely because generic advisory boilerplate ("lower severity — fix when convenient") was applied uniformly across ~30 similar findings this run, most of which are genuinely non-blocking, obscuring the one case where a fix was actually available.

**Net effect**: COV's +1 rule gain is exactly offset then exceeded by SCH's -1 and CDQ's -1 (two independent new failures, not a shared root cause), netting -4pp overall vs run-25 (96% → 92%).

### 2. File Count: 14 Committed, 0 Partial (New Clean Record, Ties Run-24's Count)

Run-26 ties run-24's record with 14 committed files and 0 partial files. Run-25's 13+1p regressed from this; run-26 restores it via the COV-004 fix.

### 3. Span Count: 41 (Below Run-24's 48-Span Record and Run-25's 47)

Despite matching run-24's file count, run-26 produces fewer total spans (41 vs 48). This reflects instrumentation density differences per file, not fewer files instrumented — the per-file evaluation shows several files (e.g., journal-manager.js, journal-paths.js) receiving fewer spans than their run-24/25 counterparts covered similar functionality with more granular span boundaries.

### 4. Q×F: 12.88 — Ties Run-24 Exactly

Q×F = 23/25 × 14 = 12.88, identical to run-24's arithmetic (92% × 14 files). Run-26 achieves this via a different path than run-25 (12.48 = 96% × 13): trading 4 percentage points of quality for one additional committed file. The same tradeoff pattern (one additional file outweighing a few points of quality) held between run-23 (96%×13=12.48) and run-24 (92%×14=12.88), but this is specific to these observed comparisons where the quality delta was only 1-2 rule failures — it is not a general property of the metric, and a larger quality drop could outweigh an added file in a future run.

### 5. IS Score: 100/100 (Second Consecutive Perfect Score)

Run-26 matches run-25's all-time-high IS score exactly.

| IS Rule | Run-26 | Run-25 | Change |
|---------|--------|--------|--------|
| SPA-001 (≤55 INTERNAL spans for commit-story-v2) | ✅ 20 spans | ✅ 31 spans | Stable — comfortably within per-target threshold both runs |
| SPA-002 (no orphan spans) | ✅ PASS | ✅ PASS | Stable |
| All other applicable rules | ✅ PASS | ✅ PASS | Stable |

The per-target SPA-001 threshold (55, set via PR #142 after run-24's failure) continues to hold across two consecutive runs with very different trace shapes (31 spans in run-25's minimal trace vs 20 in run-26's). This IS scoring run required a mid-session infrastructure fix — the otelcol-contrib collector's file exporter had a stale file-descriptor pointed at an unlinked inode after an `rm -f && touch` on `eval-traces.json`; a full LaunchAgent restart (`launchctl unload`/`load`) was required to recover, since simply truncating the file in place did not reconnect the collector's write handle to the current path.

### 6. Cost: $11.15 (Second-Highest to Date, +51% vs Run-25's $7.38)

Cost more than doubles run-24's series-low (~$3.70) and comes close to, but does not exceed, the run-16 peak ($12.29). Drivers, per `pr-evaluation.md`:
- Three files needed 3 attempts each this run (`git-collector.js`, `journal-graph.js`, `summary-detector.js`) — more multi-attempt files than run-25
- Token usage rose ~1.4-1.6x vs run-25 (input 213.5K→340.3K, output 286.7K→411.1K), consistent with more validator round-trips rather than one expensive outlier file
- This is the second-highest cost in the series to date, behind run-16's $12.29

### 7. Push/PR: Manual Recovery During a Paused Approval Prompt — Not a spiny-orb Defect

The automated run was live but paused at its `Proceed? [y/N]` approval prompt for ~27.5 hours. Manual recovery (push + `gh pr create --body-file spiny-orb-pr-summary.md`) happened during that paused window, producing PR #91. When the automated run later resumed, its own `gh pr create` step correctly detected the resulting duplicate PR and reported that detection as a "failure" — spiny-orb's push/PR pipeline itself worked as designed; the apparent failure was a side effect of the eval-side premature manual recovery, not a spiny-orb bug. See RUN26-3 in `actionable-fix-output.md` for the full correction.

---

## Score Projection Validation

PRD #144 defined success criteria (COV-004 fix verification for the summary-manager.js regression from run-25):

| Criterion | Projected | Actual | Verdict |
|-----------|-----------|--------|---------|
| COV-004 (RUN25-1) resolved | summary-manager.js commits all 9 functions cleanly | ✅ 9/9 committed, 0 partial | **Met** |
| No regression in previously-passing dimensions | NDS/RST/API/SCH/CDQ hold or improve | ❌ SCH 4/4→3/4, CDQ 7/7→6/7 (two new, unrelated failures) | **Not met** |
| Push/PR auto-success | YES | ❌ MANUAL recovery (#91) — not a spiny-orb defect, see RUN26-3 | **Not met (eval-side cause)** |
| IS score ≥ prior run | ≥100/100 | ✅ 100/100 (tied) | **Met** |

The core fix-verification objective (COV-004) was met cleanly. However, the run as a whole did not hold steady — two new, independent failures (SCH-003, CDQ-007) appeared in dimensions that were clean in run-25. Manual push/PR recovery was also required, but this traces to eval-side premature recovery during a paused approval prompt, not a spiny-orb pipeline break — see RUN26-3. Neither the SCH-003/CDQ-007 regressions nor the push/PR delivery mechanics are connected to the COV-004 fix itself.

---

## Records and Notable Milestones (Updated)

| Record | Value | Run |
|--------|-------|-----|
| Highest quality | 25/25 (100%) | Runs 9, 11, 13 |
| Highest Q×F | 13.4 | Run-15 |
| Most files committed | 14 | Run-15, Run-24, **Run-26 (tied)** |
| Most spans (committed) | 48 | Run-24 |
| Lowest cost | $3.22 | Run-7 |
| Highest cost | $12.29 | Run-16 |
| First push/PR | Run-11 | #60 |
| First IS score | Run-15 | 70/100 |
| Highest IS | 100/100 | Run-25, **Run-26 (tied)** |
| First fully automatic push+PR | Run-19 | #71 |
| Consecutive AUTO push/PR runs (through Run-25) | 6 (runs 19–21, 23–25; 22 not executed) | Run-26 required manual recovery — eval-side cause, not a spiny-orb defect (see RUN26-3) |

---

## Failure Classification (Active Issues Into Run-27)

| Failure | First Seen | Runs Open | Root Cause | Fix Available |
|---------|-----------|-----------|------------|---------------|
| SCH-003: journal-manager.js `reflections_count` (`String(x.length)` coercion) | **Run-26** | 1 | Validator's SCH-003 type-check doesn't flag explicit `String(...)` wrapping of a numeric value against an `int`-typed registry attribute | Validator fix: extend SCH-003 to detect `String(...)` coercion patterns, not just literal AST type inference |
| CDQ-007: journal-paths.js raw path, fix available but unused | **Run-26** | 1 | Self-acknowledged agent limitation; generic advisory boilerplate applied uniformly across ~30 similar findings may have deprioritized the one case with a trivially available fix | Prompt/report fix: differentiate advisory severity when a fix (e.g., an already-imported/available utility) exists in-file vs. when it doesn't |

**Historical / structural watch item (not an active issue):**

| Item | First Seen | Status |
|------|-----------|--------|
| IS SPA-001: INTERNAL span count | Run-15 | Structurally resolved via per-target threshold (PR #142, 55 for commit-story-v2); holds across run-25 (31 spans) and run-26 (20 spans). No action needed — retained here only as a running historical note, consistent with `actionable-fix-output.md`'s classification. |

**Resolved from Run-25 into Run-26:**

| Failure | File(s) | Status |
|---------|---------|--------|
| COV-004: summary-manager.js validator false positive on conditional-rethrow ENOENT pattern (RUN25-1) | summary-manager.js | **RESOLVED** — all 9 exported async functions committed cleanly, 0 partial |
