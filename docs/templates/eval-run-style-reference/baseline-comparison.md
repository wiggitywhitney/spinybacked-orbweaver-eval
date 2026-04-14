# Baseline Comparison — Run-12 vs Runs 2-11

---

## Cross-Run Quality Trend

| Run | Quality | Gates | Files | Spans | Cost | Push/PR | Q x F |
|-----|---------|-------|-------|-------|------|---------|-------|
| 2 | 15/21 (71%) | 3/4 | 5 | 11 | — | NO | 3.6 |
| 3 | 19/26 (73%) | 4/4 | 7 | 15 | — | NO | 5.1 |
| 4 | 18/26 (69%) | 4/4 | 16 | 48 | $5.84 | NO | 11.1 |
| 5 | 23/25 (92%) | 5/5 | 9 | 17 | $9.72 | NO | 8.3 |
| 6 | 21/25 (84%) | 5/5 | 5 | 16 | $11.02 | NO | 4.2 |
| 7 | 22/25 (88%) | 5/5 | 13 | 28 | $3.22 | NO | 11.4 |
| 8 | 23/25 (92%) | 5/5 | 12 | 28 | $4.00 | NO | 11.0 |
| 9 | **25/25 (100%)** | 5/5 | 12 | 26 | $3.97 | NO | 12.0 |
| 10 | 23/25 (92%) | 5/5 | 12 | 28 | $4.36 | NO | 11.0 |
| 11 | **25/25 (100%)** | 5/5 | 13 | 39 | $4.25 | **YES** | **13.0** |
| **12** | **23/25 (92%)** | **5/5** | **12+1p** | **31** | **$5.19** | **YES** | **11.0** |

Spans: run-12 counts 28 committed + 3 from partial = 31 total. Push/PR: run-12 is second consecutive success.

---

## Dimension Trends (Runs 8-12)

| Dimension | Run-8 | Run-9 | Run-10 | Run-11 | Run-12 |
|-----------|-------|-------|--------|--------|--------|
| NDS | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| COV | 5/5 | 5/5 | 5/5 | 5/5 | **4/5** |
| RST | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 |
| API | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| SCH | 3/4 | 4/4 | 3/4 | 4/4 | 4/4 |
| CDQ | 6/7 | 7/7 | 6/7 | 7/7 | **6/7** |

**First COV failure since the rubric stabilized at 25 rules (run-5 onward).** NDS, RST, API remain at 100% across all measured runs.

---

## Key Changes in Run-12

### 1. Quality Regression (25 → 23/25)

Run-11 achieved perfect 25/25 for the second time. Run-12 regressed to 23/25:
- **COV-004 FAIL**: summary-manager.js agent chose 3-span orchestrators-only approach, skipping 6 exported async I/O functions
- **CDQ-007 FAIL**: journal-manager.js agent removed truthy guards to satisfy NDS-003, producing unconditional setAttribute from nullable fields

Both failures trace back to the NDS-003 truthy-check gap (RUN11-5), which PR #352 did not fully resolve.

### 2. File Count Regression (13 → 12+1p)

summary-detector.js became a partial commit (3/5 functions) due to Anthropic API `overloaded_error`. Infrastructure issue, not quality. The 12 fully-committed files are the same set as run-10.

### 3. Cost Increase ($4.25 → $5.19)

Highest cost since run-8 ($4.00). Drivers:
- journal-graph.js regressed to 3 attempts ($1.51 cost, +$0.50 vs 2-attempt baseline)
- index.js used 2 attempts at high cost ($0.67)
- Output tokens up 49.4K vs run-11

### 4. Push/PR — Second Consecutive Success

PR #61 created. Token-swap mechanism continues to work. Fine-grained PAT stable.

---

## Score Projection Validation

**Run-11 actionable fix output projected for run-12:**

<!-- Note: this example predates the Conservative/Target/Stretch naming convention.
     Current methodology uses: Conservative (fixes land, LLM varies), Target (all fixes land cleanly), Stretch (fixes + cost reduction).
     The "Minimum" label below reflects run-12's original projection terminology. -->

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| Minimum (no fixes land) | 25/25, 13 files, PR YES | 23/25, 12+1p files, PR YES | **Not met** — 2 new failures |
| Target (NDS-003 truthy fix) | 25/25, 13 files, ≤$4.00 | 23/25, 12+1p, $5.19 | **Not met** |
| Stretch (all fixes) | 25/25, 13 files, ~$3.50 | 23/25, 12+1p, $5.19 | **Not met** |

The minimum projection assumed "no known quality failures" and that NDS-003 truthy gap was the only outstanding issue. Run-12 found two new failures: COV-004 (span omission strategy) and CDQ-007 (unconditional setAttribute). Both are LLM variation outcomes — the agent made defensible but rubric-noncompliant decisions under the NDS-003 constraint.

---

## Failure Classification Across Runs

| Failure | First Seen | Fixed In | Runs Active | Root Cause |
|---------|-----------|----------|-------------|------------|
| Push auth | Run-3 | Run-11 | 8 runs | Token type/scope |
| SCH-003 (count types) | Run-7 | Run-9 | 2 runs | Schema accumulator defaulted to string |
| CDQ-007 (optional chaining `?.`) | Run-10 | Run-11 | 1 run | No guard on `?.` in setAttribute |
| SCH-003 (boolean types) | Run-10 | Run-11 | 1 run | Name-pattern detection missing |
| NDS-003 truthy-check gap (attribute drop) | **Run-11** | Open | 2 runs | Validator flags `if (obj.prop)` as non-instrumentation |
| COV-004 (span omission strategy) | **Run-12** | — | 1 run | LLM variation: agent chose orchestrators-only |
| CDQ-007 (unconditional nullable set) | **Run-12** | — | 1 run | NDS-003 truthy gap forces drop-or-unconditional choice |

---

## Oscillation Pattern

Quality has oscillated since run-9:

| Run | Score | Pattern |
|-----|-------|---------|
| Run-9 | 25/25 | First perfect score |
| Run-10 | 23/25 | New failures (SCH-003 boolean, CDQ-007 optional chaining) |
| Run-11 | 25/25 | Both fixed |
| Run-12 | 23/25 | New failures (COV-004 span strategy, CDQ-007 nullable) |

Each perfect-score run is followed by a regression introducing 2 new low/medium severity failures. The fixes introduce new behavioral constraints (CDQ-007 fix → NDS-003 conflict) that manifest as different failure modes in subsequent runs. This is the "dominant blocker peeling" pattern continuing at the 23/25 baseline.

---

## Remaining Issues Tracker

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| NDS-003 truthy-check gap | RUN11-5 | 2 runs | PR #352 fixed `!== undefined`/`!= null` but not truthy checks |
| COV-004 span omission (summary-manager.js) | **RUN12** | 1 run | Agent chose orchestrators-only; 6 exported async I/O functions without spans |
| CDQ-007 nullable setAttribute (journal-manager.js) | **RUN12** | 1 run | Truthy guard removed to satisfy NDS-003; attributes may be undefined |
| journal-graph.js 3 attempts | **RUN12** | 1 run | Regression from 2 (run-11); root cause unknown |
| Cost above $4.00 target | RUN11-4 | 2 runs | $5.19 in run-12, highest since run-8 |
| Advisory contradiction rate ~44% | RUN11-1 | 2 runs | SCH-004 hallucination, CDQ-006 ignores exemption |
| RUN7-7 span count self-report | Run-7 | 6 runs | Structurally unchanged |
| CJS require() in ESM projects | Run-2 | 11 runs | Open spec gap, not triggered |
