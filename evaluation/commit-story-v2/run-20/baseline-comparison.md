# Baseline Comparison — Run-20 vs Runs 2–19

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
| 11 | 2026-03-30 | **25/25 (100%)** | 5/5 | 13 | 39 | $4.25 | YES (#60) | — | **13.0** |
| 12 | 2026-04-09 | 23/25 (92%) | 5/5 | 12+1p | 31 | $5.19 | YES (#61) | — | 11.0 |
| 13 | 2026-04-12 | **25/25 (100%)** | 5/5 | 7 | — | — | YES (#62) | — | 7.0 |
| 14 | 2026-04-15 | 22/25 (88%) | 5/5 | 12 | — | — | YES (#65) | — | 10.6 |
| 15 | 2026-05-03 | 24/25 (96%) | 5/5 | 14 | ~37 | $6.44 | YES (#66) | 70 | **13.4** |
| 16 | 2026-05-11 | 22/25 (88%) | 5/5 | 10+3p | ~24 | $12.29 | YES (#68) | 80 | 8.8 |
| 17 | 2026-05-12 | 22/25 (88%) | **4/5** | 10+1p | ~28 | $10.43 | YES (#69) | 90 | 8.8 |
| 18 | 2026-05-16 | 24/25 (96%) | 5/5 | 11 | 36 | $9.16 | YES (#70, manual) | 90 | 10.6 |
| 19 | 2026-05-25 | 21/25 (84%) | 5/5 | 10+3p | 30 | $8.83 | AUTO (#71) | 80 | 8.4 |
| **20** | **2026-06-01** | **24/25 (96%)** | **5/5** | **12** | **42** | **$9.08** | **AUTO (#73)** | **80** | **11.5** |

Run-20 spans: 42 committed (new all-time record, surpassing run-11's 39). Partial files: 0. Failed files: 1 (mcp/server.js — spiny-orb regression, not scored).

---

## Dimension Trend (Runs 16–20)

| Dimension | Run-16 | Run-17 | Run-18 | Run-19 | **Run-20** |
|-----------|--------|--------|--------|--------|-----------|
| NDS | 2/2 | 2/2 | 2/2 | 2/2 | **2/2** |
| COV | 3/5 | 3/5 | 5/5 | 2/5 | **4/5** |
| RST | 4/4 | 4/4 | 4/4 | 4/4 | **4/4** |
| API | 3/3 | 3/3 | 3/3 | 3/3 | **3/3** |
| SCH | 4/4 | 3/4 | 3/4 | 3/4 | **4/4** |
| CDQ | 7/7 | 7/7 | 7/7 | 7/7 | **7/7** |
| **Total** | **22/25** | **22/25** | **24/25** | **21/25** | **24/25** |

COV recovers strongly (+2 rules) from run-19's validator-driven regression. SCH returns to 4/4 for the first time since run-16. NDS, RST, API, CDQ stable at 100%.

---

## Key Changes in Run-20

### 1. Quality Recovery: 21/25 → 24/25 (+3 points)

Run-19 regressed to 21/25 (84%) from run-18's 24/25 due to PRD #885 (multiLine flag normalization) not yet landed and a new NDS-003 indentation-driven Prettier false-positive class. Run-20 recovers to 24/25 (96%) via two independent fixes.

**+2 points from COV recovery (PRD #885 fix confirmed):**

The four functions blocked in run-19 by indentation-driven Prettier reformatting all committed cleanly in run-20:
- `generateAndSaveDailySummary`, `generateAndSaveWeeklySummary`, `generateAndSaveMonthlySummary` in summary-manager.js — 9 total spans committed (restoring run-18 coverage); COV-001 and COV-004 restored
- `triggerAutoSummaries` in auto-summarize.js — committed with 3 spans; COV-001 and COV-004 restored

COV returns to 4/5. The remaining COV-005 failure covers three files with input-only attributes; see failure analysis below.

**+1 point from SCH-002 resolution (journal-manager.js):**

`discoverReflections` in journal-manager.js used `commit_story.journal.entries_count` (correctly registered in `agent-extensions.yaml`) instead of `commit_story.journal.quotes_count` (defined for AI-extracted quotes; semantically wrong for filesystem-discovered reflection file counts). SCH-002 returns to PASS after two consecutive failures (runs 18–19). Three-consecutive-run watch broken.

### 2. Span Count: 42 (New All-Time Record)

Run-20 commits 42 spans across 12 files — the highest in the series, surpassing run-11's 39. The increase is driven by the recovery of the four blocked orchestrators (5 spans) and the return of summary-manager.js full coverage (9 spans across all functions).

### 3. mcp/server.js: New Failure from PRD #885 Regression

mcp/server.js failed in all 3 attempts with 21 identical NDS-003 violations at fixed line numbers (lines 1, 3–20, 37, 39). The agent's instrumented code was correct across all attempts. Root cause: PRD #885 introduced `stripOtelNodes` + `normalizeMultiLineFlags` comparison pipeline; when the agent places the OTel import first in the file, `stripOtelNodes` removes that node's leading trivia (shebang + file-level JSDoc) along with the import node itself. `normalizedStripped` is therefore missing those 21 lines compared to `normalizedOriginal`, causing a spurious forward-check failure.

This is a spiny-orb false positive. The agent's code was not the problem. Fix location: `removeOtelImports` in `nds003-ast-stripper.ts` — transfer leading file-level trivia to the next statement before removing a first-position OTel import.

mcp/server.js was clean in runs 18–19 (pre-PRD #885). Run-20 is the first run affected. This failure reduces Q×F from a potential 13.0 (13 files × 24/25) to 11.5 (12 files × 24/25).

### 4. COV-005: Persistent and New Failures

The remaining COV failure in run-20 has three contributors, two of which are new discoveries:

| File | Failure | Status |
|------|---------|--------|
| git-collector.js `getCommitData` | Only `vcs.ref.head.revision` (input) set; `CommitData` return value uncaptured | Persistent (runs 19–20) |
| summary-manager.js `readWeekDailySummaries`, `readMonthWeeklySummaries` | Only input labels set; no output counts | **New** — first-time commit reveals gap |
| index.js `main()` | `commit_story.cli.subcommand` dropped in attempt 3 to escape NDS-003 pressure | **Regression** — was passing in run-19 |

The summary-manager.js gap was not visible in prior runs because these functions were partial/uncommitted. The index.js regression is linked to the same trivia-loss pressure that caused mcp/server.js to fail: attempt 3 simplified the output under NDS-003 constraint, dropping the subcommand attribute.

Notably, git-collector.js `getCommitData` invented three new schema extensions (`commit_story.git.command`, `commit_story.git.parent_count`, `commit_story.git.is_merge`) without explicit per-function guidance — showing the agent can extend the schema proactively when it understands the domain, but still fails to capture `CommitData` output attributes.

### 5. IS SPA-002: Orphan Span Persists

SPA-002 was expected to resolve once RUN19-1's missing orchestrator spans were restored, eliminating context propagation gaps. Instead, a new orphan appeared: span `ce5f0429` references absent parent `25a9f60d`. The span ID changed from run-19's `b48fbc5f` → `30d70fca`, indicating a different code path generating the orphan each run. The underlying context propagation issue in auto-instrumented LangChain calls remains open.

### 6. Push/PR: 10th Consecutive Auto-Success

PR #73 created automatically. Consecutive push streak extends to 10 runs (runs 11–20).

---

## Score Projection Validation

PRD #109 defined three scenarios based on whether PRD #885 landed:

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| PRD #885 NOT landed (conservative) | 21/25 (84%), ~10 files, Q×F ≈ 8.4 | 24/25 (96%), 12 files, Q×F 11.5 | **Exceeded** — fix confirmed |
| PRD #885 landed (conservative) | 23/25 (92%), 14 files | 24/25 (96%), 12 files | **Quality exceeded; file count missed** |
| PRD #885 landed (target) | 24/25 (96%), 14 files, Q×F ≈ 13.4 | 24/25 (96%), 12 files, Q×F 11.5 | **Quality met; Q×F missed by 1.9** |

Quality reached the Target scenario. Q×F missed because mcp/server.js failed due to a new spiny-orb regression introduced by PRD #885 itself (trivia-loss bug), reducing committed file count from expected 13–14 to 12. If mcp/server.js commits in run-21 (after the trivia-loss fix), Q×F would reach 12.5 at the same quality level.

SCH-002 resolution (not projected in the conservative scenario) contributed the +1 SCH point, while COV-005 on getCommitData persisted as projected.

---

## Records and Notable Milestones (Updated)

| Record | Value | Run |
|--------|-------|-----|
| Highest quality | 25/25 (100%) | Runs 9, 11, 13 |
| Highest Q×F | 13.4 | Run-15 |
| Most files committed | 14 | Run-15 |
| **Most spans (committed)** | **42** | **Run-20 (new record)** |
| Lowest cost | $3.22 | Run-7 |
| Highest cost | $12.29 | Run-16 |
| First push/PR | Run-11 | #60 |
| First IS score | Run-15 | 70/100 |
| Highest IS | 90/100 | Runs 17, 18 |
| Longest consecutive push streak | **10 (runs 11–20)** | — |
| First fully automatic push+PR | Run-19 | #71 |
| Consecutive auto-push | **2 (runs 19–20)** | — |

---

## Failure Classification (Active Issues Into Run-21)

| Failure | First Seen | Runs Open | Root Cause | Fix Available |
|---------|-----------|-----------|------------|---------------|
| COV-005: git-collector.js `getCommitData` output attrs | Run-19 | 2 | Agent captures input param; `CommitData` return value not instrumented | Needs explicit per-function prompt guidance |
| COV-005: summary-manager.js `readWeek*`/`readMonth*` | Run-20 | 1 | First-time commit exposes input-only instrumentation on secondary read functions | Needs per-function prompt guidance |
| COV-005: index.js `main()` subcommand attr | Run-20 | 1 | Attempt-3 simplification under NDS-003 pressure; same root as mcp/server.js trivia loss | Depends on NDS-003 trivia-loss fix |
| NDS-003: mcp/server.js trivia-loss oscillation | Run-20 | 1 | PRD #885 `stripOtelNodes` removes leading trivia (shebang + JSDoc) with first-position OTel import | `removeOtelImports` in `nds003-ast-stripper.ts` — transfer trivia before removal |
| IS SPA-002: orphan span (context propagation gap) | Run-19 | 2 | Auto-instrumented LangChain calls lose parent context; different span each run | Unknown; not resolved by PRD #885 orchestrator fix |
| IS SPA-001: INTERNAL span count (structural) | Run-15 | 6 | 29 spans vs limit of 10; calibration mismatch for commit-story-v2 scale | Not a defect; calibration needs adjustment for LangGraph apps |
