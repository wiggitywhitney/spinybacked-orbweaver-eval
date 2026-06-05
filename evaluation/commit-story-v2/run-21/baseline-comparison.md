# Baseline Comparison — Run-21 vs Runs 2–20

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
| 20 | 2026-06-01 | 24/25 (96%) | 5/5 | 12 | 42 | $9.08 | AUTO (#73) | 80 | 11.5 |
| **21** | **2026-06-04** | **23/25 (92%)** | **5/5** | **12** | **42** | **~$8.10** | **AUTO (#74)** | **90** | **11.0** |

Run-21 spans: 42 committed (tied with run-20's all-time record). Partial files: 0. Failed files: 2 (mcp/server.js — new NDS-003 variant, second consecutive failure; index.js — new failure class, first failure since run-16). Push/PR: 13th consecutive auto-success.

---

## Dimension Trend (Runs 17–21)

| Dimension | Run-17 | Run-18 | Run-19 | Run-20 | **Run-21** |
|-----------|--------|--------|--------|--------|-----------|
| NDS | 2/2 | 2/2 | 2/2 | 2/2 | **2/2** |
| COV | 3/5 | 5/5 | 2/5 | 4/5 | **4/5** |
| RST | 4/4 | 4/4 | 4/4 | 4/4 | **4/4** |
| API | 3/3 | 3/3 | 3/3 | 3/3 | **3/3** |
| SCH | 3/4 | 3/4 | 3/4 | 4/4 | **4/4** |
| CDQ | 7/7 | 7/7 | 7/7 | 7/7 | **6/7** |
| **Total** | **22/25** | **24/25** | **21/25** | **24/25** | **23/25** |

CDQ regresses for the first time since the 7/7 baseline stabilized at run-17. NDS, RST, API remain at 100% across all measured runs. COV holds at 4/5 (same as run-20). SCH holds at 4/4 for the second consecutive run.

---

## Key Changes in Run-21

### 1. Quality Regression: 24/25 → 23/25 (−1 point)

Run-20 recovered to 24/25 (96%) via two independent fixes (PRD #885 multiLine confirmed, SCH-002 journal-manager.js resolved). Run-21 regresses to 23/25 (92%) via a new CDQ failure, despite recovering CDQ-007 from run-20.

**−1 point: CDQ-001 FAIL (new) — claude-collector.js double-end**

claude-collector.js uses `startActiveSpan('name', async (span) => { try { ... } finally { span.end() } })`. The `finally { span.end() }` inside a `startActiveSpan` callback double-ends the span: `startActiveSpan` auto-closes the span when the callback settles. The explicit call ends an already-ended span. All 11 other committed files that use `startActiveSpan` omit the redundant call correctly. This is LLM variation — the agent applied a `try/finally { span.end() }` idiom correct for manual `tracer.startSpan()` but incorrect inside `startActiveSpan` callbacks. claude-collector.js committed successfully in run-20 with CDQ-001 passing; this is a new regression.

**+1 point: CDQ-007 RESOLVED — journal-manager.js nullable `commit.author`**

Run-20's CDQ-007 failure (journal-manager.js: `commit.author` set unconditionally without a null guard) resolved by removing `commit.author` entirely in run-21. CDQ-007 returns to PASS.

COV-005 holds at 1 failure, but with a new variant. The run-20 failures (git-collector.js `getCommitData`, summary-manager.js read-path, index.js subcommand) are replaced by a new gap in summary-manager.js `saveDailySummary`: when the file already exists and `options.force` is false, the span has zero attributes because `entry_date` is set only after the early return. The other 8 spans in summary-manager.js all set at least one attribute unconditionally at span start. index.js COV-005 remains unverifiable (file failed to commit).

### 2. File Count: 12 Committed, 2 Failed

Run-21 commits 12 files — same count as run-20 — but with two failures instead of one, and two different files failing:

- **mcp/server.js** (second consecutive failure): PR #905 resolved the run-20 trivia-loss (shebang, line 1 now preserved). A new independent NDS-003 violation emerged at lines 2, 3, 31, 33, 34 — the JSDoc block delimiter and McpServer constructor multi-line area. Two independent NDS-003 bugs confirmed on this file. The agent's output was correct across all 3 attempts.

- **index.js** (new failure class): Failed for the first time since run-16. With ~60 accumulated schema extensions from 29 preceding files, the agent expanded three single-line `import {` statements into multi-line blocks in attempt 1, producing 152 NDS-003 violations. Attempt 2 could not reconstruct the exact original formatting and introduced NDS-005 (try/catch restructuring). This is context pollution at the 30th file — the same pattern that causes late-run files to reformat existing code, now manifesting on index.js for the first time.

### 3. Span Count: 42 (Tied All-Time Record)

Run-21 ties run-20's record of 42 committed spans. The composition changed significantly:

- **Gains**: summary-manager.js expanded from 4 spans (run-20) to 9 spans (full read/save/generate pipeline); summary-detector.js expanded from 1 to 5 spans (PRD #902 auto-registration); git-collector.js expanded from 2 to 6 spans (PRD #902)
- **journal-graph.js**: 4 spans (down from 8 in run-20; NDS-003 fix prompted a different opt-chain approach that still passes but instruments fewer nodes)

The span composition is substantially richer despite the same count: 42 spans across 12 files vs run-20's 42 spans from a different file mix.

### 4. 3-Attempt Rate: Dramatic Improvement

3-attempt rate fell from 46% (6/13 files in run-20) to 8% (1/12 files in run-21 — summarize.js only). Files that consistently required 3 attempts in prior runs (context-integrator.js: 3 attempts run-20; journal-manager.js: 3 attempts run-20) dropped to 1 attempt each. This improvement was the primary goal of the RUN20-2 watch item and resolves it decisively.

### 5. IS Score: 90/100 (Recovered from Run-20's 80/100)

SPA-002 (orphan span from context propagation gap) resolved. Run-21 passes 7/8 applicable IS rules. The remaining failure is SPA-001 (structural: 11 INTERNAL spans vs limit of 10), which is an established calibration mismatch for commit-story-v2's scale.

| IS Rule | Run-21 | Run-20 | Status |
|---------|--------|--------|--------|
| SPA-001 (≤10 INTERNAL spans) | ❌ 11 spans | ❌ fail | Structural; 2-run streak |
| SPA-002 (no orphan spans) | ✅ PASS | ❌ fail | **RESOLVED** — no orphan |
| All other applicable rules | ✅ PASS | ✅ PASS | Stable |

SPA-002 resolution is significant. Runs 19 and 20 showed a different orphan span ID each run, suggesting a floating context propagation gap rather than a fixed code path. Run-21's clean pass may indicate that the expanded instrumentation from PRD #902 (more spans, richer context) closed the gap incidentally.

### 6. Cost: ~$8.10 (Lowest in Run-17+ Era)

Run-21 is the lowest-cost run since run-18 ($9.16). The 3-attempt rate improvement is the primary driver: fewer retry attempts means fewer tokens consumed per file. Despite processing 30 files (same count), total cost dropped ~$1 from run-20.

### 7. Push/PR: 13th Consecutive Auto-Success

PR #74 created automatically. The consecutive auto-push streak extends to 3 runs (runs 19–21). The overall consecutive push streak (any push method) extends to 11 runs (runs 11–21).

---

## Score Projection Validation

PRD #113 defined two scenarios:

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| RUN20-1 fix landed: mcp/server.js commits | 13 files, ≥24/25, Q×F ≥ 12.5 | 12 files, 23/25, Q×F 11.0 | **Not met** — new NDS-003 variant emerged on mcp/server.js; CDQ-001 regression independent of fix |
| RUN20-1 fix NOT landed (conservative) | 24/25 (96%), 12 files, Q×F ≈ 11.5 | 23/25 (92%), 12 files, Q×F 11.0 | **Near miss** — fix partially resolved (line 1 trivia-loss fixed); new variant and CDQ-001 regression both unrelated to the fix |

The RUN20-1 fix landed but was partial: PR #905 addressed the shebang trivia-loss (line 1), and that specific violation is gone. A second independent NDS-003 bug on mcp/server.js (blank-line-near-JSDoc validator algorithm) prevented commitment. The CDQ-001 failure on claude-collector.js is fully independent — unrelated to NDS-003, emerging from LLM variation on a file that previously committed correctly.

The conservative scenario (12 files, 24/25) was the floor projection if no fixes landed. Run-21 fell below this floor on quality (23 vs 24) due to the unrelated CDQ-001 regression.

---

## Records and Notable Milestones (Updated)

| Record | Value | Run |
|--------|-------|-----|
| Highest quality | 25/25 (100%) | Runs 9, 11, 13 |
| Highest Q×F | 13.4 | Run-15 |
| Most files committed | 14 | Run-15 |
| Most spans (committed) | 42 | Runs 20–21 (tied) |
| Lowest cost | $3.22 | Run-7 |
| Highest cost | $12.29 | Run-16 |
| First push/PR | Run-11 | #60 |
| First IS score | Run-15 | 70/100 |
| Highest IS | 90/100 | Runs 17, 18, 21 |
| **Longest consecutive push streak** | **11 (runs 11–21)** | **Run-21 extends** |
| First fully automatic push+PR | Run-19 | #71 |
| **Consecutive auto-push** | **3 (runs 19–21)** | **Run-21 extends** |

---

## Failure Classification (Active Issues Into Run-22)

| Failure | First Seen | Runs Open | Root Cause | Fix Available |
|---------|-----------|-----------|------------|---------------|
| CDQ-001: claude-collector.js double-end in `startActiveSpan` | **Run-21** | 1 | Agent applied `try/finally { span.end() }` idiom inside `startActiveSpan` callback; correct for `startSpan`, incorrect for `startActiveSpan` | Remove `span.end()` from `finally` block inside the `startActiveSpan` callback |
| COV-005: summary-manager.js `saveDailySummary` zero-attrs on skip path | **Run-21** | 1 | `entry_date` set after early-return guard; skip path span has no attributes | Move `setAttribute('commit_story.journal.entry_date', entryDate)` before the early-return check |
| NDS-003: mcp/server.js blank-line-near-JSDoc variant | **Run-21** | 1 | Validator forward-check misaligns when blank line inserted adjacent to pre-import JSDoc block; agent output correct; distinct from run-20's trivia-loss (fixed PR #905) | Validator algorithm fix in spiny-orb |
| NDS-003 + NDS-005: index.js context pollution at file 30/30 | **Run-21** | 1 | ~60 accumulated schema extensions caused import formatting drift; first failure on this file since run-16 | Agent prompt guidance for import formatting preservation in large-context runs |
| COV-005: index.js `main()` subcommand attr | Run-20 | 2 | Agent intent confirmed (schema declared) but file did not commit in either run-20 or run-21 | Depends on resolving NDS-003 failures on index.js |
| IS SPA-001: INTERNAL span count (structural) | Run-15 | 7 | 11 INTERNAL spans vs limit of 10; calibration mismatch for LangGraph-scale app | Not a defect; IS spec calibration needs adjustment |

**Resolved from run-20 into run-21:**

| Failure | File(s) | Status |
|---------|---------|--------|
| COV-005: git-collector.js `getCommitData` output attrs | git-collector.js | **RESOLVED** — PRD #902: 6 spans with domain attrs including `is_merge`, commit output fields |
| COV-005: summary-manager.js `readWeek*`/`readMonth*` | summary-manager.js | **RESOLVED** — output count attributes now set; `week_label`/`month_label` unconditional |
| CDQ-007: journal-manager.js `commit.author` nullable | journal-manager.js | **RESOLVED** — `commit.author` removed entirely; CDQ-007 PASS |
| IS SPA-002: orphan span (context propagation gap) | runtime | **RESOLVED** — SPA-002 passes; no orphan span in run-21 |
