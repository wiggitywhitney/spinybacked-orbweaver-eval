# Baseline Comparison — Run-11 vs Runs 2-10

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
| **11** | **25/25 (100%)** | **5/5** | **13** | **39** | **$4.25** | **YES** | **13.0** |

---

## Dimension Trends (Runs 7-11)

| Dimension | Run-7 | Run-8 | Run-9 | Run-10 | Run-11 |
|-----------|-------|-------|-------|--------|--------|
| NDS | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| COV | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| RST | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 |
| API | 2/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| SCH | 3/4 | 3/4 | 4/4 | 3/4 | 4/4 |
| CDQ | 6/7 | 6/7 | 7/7 | 6/7 | 7/7 |

**Pattern**: NDS, COV, RST stable at 100% since run-7. API stable at 100% since run-8. SCH and CDQ oscillate between 100% and partial — LLM-generated code introduces variation in type handling (SCH-003) and attribute safety (CDQ-007).

---

## Key Improvements in Run-11

### 1. Push Auth Resolved (8-run streak broken)
- **Runs 3-10**: Push failed every run with various root causes (token not present, URL not embedded, token rejected)
- **Run-11**: Fine-grained PAT with explicit push permissions → PR #60 created
- The URL swap mechanism was working since run-10; only the token itself needed fixing

### 2. Perfect Quality Restored
- **Run-9**: 25/25 (first perfect score)
- **Run-10**: 23/25 (regressed — SCH-003, CDQ-007)
- **Run-11**: 25/25 (restored — both fixes confirmed working)

### 3. New File High (13 committed)
- **Runs 7-10**: 12-13 committed (summary-manager.js oscillated)
- **Run-11**: 13 committed (summary-manager.js recovered with 9 spans — most of any file)

### 4. Best Q x F Score
- **Run-11**: 13.0 = 100% quality x 13 files
- Previous best: 12.0 (run-9: 100% x 12)

---

## Score Projection Validation

**Run-10 actionable fix output projected for run-11:**

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| Minimum (P0 only) | 24/25, 13 files, PR maybe | — | — |
| Target (P0+P1) | 25/25, 13 files, PR likely | **25/25, 13 files, PR YES** | **Met** |
| Stretch (all fixes) | 25/25, 13 files, journal-graph 1st attempt | 25/25, 13 files, journal-graph 2nd | **Partially met** |
| After 50% discount | 24-25/25, 12-13 files | 25/25, 13 files | **Exceeded** |

The target projection was accurate. The 50% discount was conservative — all fixes landed cleanly. journal-graph.js didn't achieve first-attempt (stretch), but improved from 3→2 attempts.

---

## Failure Classification Across Runs

| Failure | First Seen | Fixed In | Runs Active | Root Cause |
|---------|-----------|----------|-------------|------------|
| Push auth | Run-3 | **Run-11** | 8 runs | Token type/scope (not mechanism) |
| SCH-003 (count types) | Run-7 | Run-9 | 2 runs | Schema accumulator defaulted to string |
| CDQ-007 (optional chaining) | Run-10 | **Run-11** | 1 run | No guard on `?.` in setAttribute |
| SCH-003 (boolean types) | Run-10 | **Run-11** | 1 run | Name-pattern detection missing |

---

## Remaining Issues

| Item | Status | Impact |
|------|--------|--------|
| journal-graph.js 2 attempts | Persistent | Cost ($0.59 vs ~$0.30 for 1 attempt) |
| Advisory contradiction rate 45% | Improved (was 67%) | SCH-004 judge hallucination |
| RUN7-7 span count self-report | Structural | Spans in table match actual — lower priority |
| CDQ-001 redundant span.end() | Style | OTel spec: double-close is no-op |
| Cost $4.25 (above $4.00 target) | Minor | $0.11 cheaper than run-10 |

---

## Dominant Blocker Peeling — Complete

The "dominant blocker peeling" pattern observed across runs has reached its endpoint:

| Run Range | Dominant Blocker | Severity |
|-----------|-----------------|----------|
| Runs 2-4 | CDQ-002, API-004, schema evolution | High |
| Runs 5-6 | COV-003/NDS-005b conflict, SCH-001 | Medium |
| Runs 7-8 | SCH-003 (count types), CDQ-005 | Medium |
| Run 9 | Push auth (operational) | Operational |
| Run 10 | SCH-003 (boolean), CDQ-007 | Low |
| **Run 11** | **None** | **—** |

Quality score reached 100% in run-9, regressed in run-10 due to LLM variation, and restored in run-11 with targeted fixes. The remaining issues are operational (cost, advisory quality) not quality-related.
