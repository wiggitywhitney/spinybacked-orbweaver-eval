# Baseline Comparison — Run-13 vs Runs 2-12

---

## Cross-Run Quality Trend

| Run | Quality | Gates | Files | Spans | Cost | Push/PR | Q × F |
|-----|---------|-------|-------|-------|------|---------|-------|
| 2 | 15/21 (71%) | 3/4 | 5 | 11 | — | NO | 3.6 |
| 3 | 19/26 (73%) | 4/4 | 7 | 15 | — | NO | 5.1 |
| 4 | 18/26 (69%) | 4/4 | 16 | 48 | $5.84 | NO | 11.1 |
| 5 | 23/25 (92%) | 5/5 | 9 | 17 | $9.72 | NO | 8.3 |
| 6 | 21/25 (84%) | 5/5 | 5 | 16 | $11.02 | NO | 4.2 |
| 7 | 22/25 (88%) | 5/5 | 13 | 28 | $3.22 | NO | 11.4 |
| 8 | 23/25 (92%) | 5/5 | 12 | 28 | $4.00 | NO | 11.0 |
| 9 | 25/25 (100%) | 5/5 | 12 | 26 | $3.97 | NO | 12.0 |
| 10 | 23/25 (92%) | 5/5 | 12 | 28 | $4.36 | NO | 11.0 |
| 11 | 25/25 (100%) | 5/5 | 13 | 39 | $4.25 | YES | 13.0 |
| 12 | 23/25 (92%) | 5/5 | 12+1p | 31 | $5.19 | YES | 11.0 |
| **13** | **25/25 (100%)** | **5/5** | **7** | **16** | **~$6.41** | **YES** | **7.0** |

Run-13 spans: 16 committed (journal-graph.js partial not preserved in git).
Quality × Files = (25/25) × 7 = 7.0 — lowest ever.

---

## Dimension Trends (Runs 9-13)

| Dimension | Run-9 | Run-10 | Run-11 | Run-12 | Run-13 |
|-----------|-------|--------|--------|--------|--------|
| NDS | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| COV | 5/5 | 5/5 | 5/5 | **4/5** | **5/5** |
| RST | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 |
| API | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| SCH | 4/4 | 3/4 | 4/4 | 4/4 | 4/4 |
| CDQ | 7/7 | 6/7 | 7/7 | **6/7** | **7/7** |

COV and CDQ restored to 100%. NDS, RST, API continue at 100%.

---

## Key Changes in Run-13

### 1. Quality Restored (23 → 25/25) — via a different mechanism

Both run-12 failures (COV-004, CDQ-007) are absent from the run-13 committed set — but not because the agent fixed them. The checkpoint mechanism caught the bugs and rolled back those files before they could enter the committed set.

- **COV-004**: summary-manager.js was caught at checkpoint 2 and rolled back. The underlying COV-004 risk still exists — if summary-manager.js is re-instrumented in run-14 and the agent again uses the context-propagation justification, the failure recurs.
- **CDQ-007**: journal-manager.js was caught at checkpoint 2 (commit.timestamp.split on Date object). Again, the file was rolled back, not fixed. The timestamp type-assumption gap will recur.

Quality restoration is real but conditional: the 7 committed files are genuinely clean. The failures were prevented by rollback, not by agent improvement.

### 2. File Count Regression (12+1p → 7) — checkpoint cascade

Run-13 committed 7 files vs run-12's 12+1p. Two checkpoint failures caused 10 files to be rolled back:
- Checkpoint 1 (file 15/30): summary-graph.js null-vs-undefined → rolled back 5 files
- Checkpoint 2 (file 25/30): journal-manager.js Date-vs-string → rolled back 5 more

This is the first run with checkpoint failures since the checkpoint mechanism was introduced.

### 3. Cost Increase ($5.19 → ~$6.41) — sunk cost from rollbacks

$4.68 of the ~$6.41 total was spent on files that were ultimately rolled back or whose partial instrumentation wasn't preserved. This is the "checkpoint tax" — the mechanism works correctly but costs tokens on work that gets discarded.

The per-useful-file cost is ~$0.21 × 7 committed files = ~$1.47 of value delivered. The remaining ~$4.94 was sunk cost.

### 4. First New Failure Class Since Run-5

Checkpoint failures (test suite breakage by instrumented code) are a new failure mode not previously seen. The two root causes:
- `null !== undefined` evaluation: Parameter guarded with `!== undefined` but tests pass `null`
- Type assumption: `commit.timestamp.split()` assumed string, but tests pass `Date` object

Both are type-safety failures the checkpoint correctly caught.

---

## 50% Discount Projection vs Actual

From run-12 actionable fix output (§7):

**Target projection** (P1 NDS-003 truthy fix landed):
- Quality: 25/25 (100%) → **ACHIEVED**
- Files: 13 → **MISSED** (7 actual)
- After 50% discount: 24-25/25, 12-13 files → Quality achieved, files missed

**Actual vs projection**:

| Metric | Target projection | 50% discount floor | Actual | Assessment |
|--------|------------------|-------------------|--------|------------|
| Quality | 25/25 (100%) | 24-25/25 | 25/25 | ✓ Within range |
| Files | 13 | 12-13 | 7 | ✗ Below floor |
| Push/PR | YES | YES | YES | ✓ |

Quality projection was accurate. File count projection failed to anticipate checkpoint failures — the projection assumed no new failure modes. The checkpoint failures are a second-order effect of the NDS-003 fix changing agent behavior in ways that exposed type-safety gaps.

---

## Oscillation Pattern Update

Quality has oscillated: 25 → 23 → 25 → 23 → **25** across runs 9-13. The pattern holds but the mechanism changed:

| Run | Quality | How 25/25 was achieved or missed |
|-----|---------|----------------------------------|
| 9 | 25/25 | Agent applied NDS-003 guards correctly throughout |
| 10 | 23/25 | Two failures (NDS-003 pressure artifacts) |
| 11 | 25/25 | NDS-003 fix (PR #352) applied; agent made fewer guard mistakes |
| 12 | 23/25 | NDS-003 truthy gap remained; new failure modes emerged |
| 13 | 25/25 | NDS-003 truthy fix (PR #391) applied; bugs caught by checkpoint and rolled back |

Run-13's 25/25 is achieved differently from run-9 and run-11: it depends on the checkpoint rollback mechanism filtering out failures, not on the agent avoiding them. This distinction matters for projections — the committed work is clean, but the underlying agent behavior still produces type-safety errors that the checkpoint must catch.

The oscillation pattern (alternating 25/23) has held for 5 runs but for increasingly different structural reasons each cycle.

---

## Files Committed History

| Run | Committed | Notes |
|-----|-----------|-------|
| 11 | 13 | Best-ever; no failures |
| 12 | 12+1p | 1 API overload partial |
| **13** | **7** | 10 rollbacks from 2 checkpoint failures; 1 partial not preserved |

Run-13 sets a new low for committed file count. The target remains 13 (all non-skip files).
