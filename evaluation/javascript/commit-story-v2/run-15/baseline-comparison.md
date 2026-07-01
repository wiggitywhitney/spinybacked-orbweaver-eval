# Baseline Comparison — Run-15 vs Runs 2-14

---

## Cross-Run Quality Trend

| Run | Quality | Gates | Files | Spans | Cost | Push/PR | IS | Q×F |
|-----|---------|-------|-------|-------|------|---------|-----|-----|
| 2 | 20/27 (74%) | 3/4 | 10 | — | — | NO | — | 7.4 |
| 3 | 19/26 (73%) | 4/4 | 11 | — | — | NO | — | 8.0 |
| 4 | 15/26 (58%) | 4/4 | 16 | — | $5.84 | NO | — | 9.2 |
| 5 | 23/25 (92%) | 5/5 | 9 | 17 | $9.72 | NO | — | 8.3 |
| 6 | 21/25 (84%) | 5/5 | 5 | 16 | $11.02 | NO | — | 4.2 |
| 7 | 22/25 (88%) | 5/5 | 13 | 28 | $3.22 | NO | — | 11.4 |
| 8 | 23/25 (92%) | 5/5 | 12 | 28 | $4.00 | NO | — | 11.0 |
| 9 | 25/25 (100%) | 5/5 | 12 | 26 | $3.97 | NO | — | 12.0 |
| 10 | 23/25 (92%) | 5/5 | 12 | 28 | $4.36 | NO | — | 11.0 |
| 11 | 25/25 (100%) | 5/5 | 13 | 39 | $4.25 | YES (#60) | — | **13.0** |
| 12 | 23/25 (92%) | 5/5 | 12+1p | 31 | $5.19 | YES (#61) | — | 11.0 |
| 13 | 25/25 (100%) | 5/5 | 7 | 22 | ~$6.41 | YES (#62) | — | 7.0 |
| 14 | 22/25 (88%) | 5/5 | 12 | 32 | $5.59 | YES (#65) | 80 | 10.6 |
| **15** | **24/25 (96%)** | **5/5** | **14** | **40** | **$6.44** | **YES (#66)** | **70** | **13.4** |

Run-15 Q×F (13.4) is the new all-time record, surpassing run-11's 13.0.

---

## Dimension Trends (Runs 11-15)

| Dimension | Run-11 | Run-12 | Run-13 | Run-14 | Run-15 |
|-----------|--------|--------|--------|--------|--------|
| NDS | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| COV | 5/5 | 4/5 | 5/5 | 3/5 | **4/5** |
| RST | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 |
| API | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| SCH | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 |
| CDQ | 7/7 | 6/7 | 7/7 | 6/7 | **7/7** |

NDS, RST, API, SCH remain at 100% across all measured runs. COV oscillates between perfect and one failure; CDQ alternates 100%/86%.

---

## Key Changes in Run-15

### 1. Quality: 22/25 → 24/25 (+8pp)

Two run-14 failures resolved; one new failure introduced:

| Run-14 Failure | Resolution | Mechanism |
|----------------|------------|-----------|
| COV-003 FAIL: journal-graph.js summaryNode missing error recording | **RESOLVED** | PRD #483 M2 Decision 5 confirmed graceful-degradation catches SHOULD NOT record errors (OTel spec); all three LangGraph nodes now consistently apply NDS-007 with no error recording — this is correct behavior, not a regression from run-14 |
| COV-004 FAIL: summary-manager.js 6 async functions without spans | **RESOLVED** | 9 spans on all 9 exported async I/O functions; 1 attempt; COV-004 advisory message strengthened in PRD #483 M2 appears to have been effective |
| CDQ-003 FAIL: journal-graph.js inconsistent error recording | **RESOLVED** | All three nodes now consistently have no error recording (correct per NDS-007); CDQ-003 has nothing incorrect to flag |

New failure:

| Failure | Description |
|---------|-------------|
| COV-003 FAIL: summary-detector.js | getDaysWithEntries and getDaysWithDailySummaries have `startActiveSpan` with try/finally but NO outer catch; inconsistent with findUnsummarizedDays/Weeks/Months in the same file which have proper error recording |

### 2. File Count Record: 12 → 14 (+2 files)

14 committed files is the new all-time high (previously 13 in run-11). New files committed for the first time:
- `src/mcp/server.js` (1 span, MCP server lifecycle)
- `src/mcp/tools/context-capture-tool.js` (1 span, context I/O)

### 3. Span Count Record: 32 → 40 (+8 spans)

40 spans is the new all-time high (previously 39 in run-11). The increase is driven by:
- summary-manager.js: 3 spans (run-14) → 9 spans (run-15), all 9 exported async I/O functions
- 2 new committed files adding 2 spans

### 4. Push/PR — Fifth Consecutive Success

PR #66 created. The PROGRESS.md orchestrator prompt caused the spiny-orb push to fail internally; branch pushed manually. Fine-grained PAT stable. PR creation manual for first time since run-11 (due to push failure, not auth failure).

### 5. IS Score Regression: 80 → 70 (-10pp)

| Rule | Run-14 | Run-15 | Change |
|------|--------|--------|--------|
| RES-001 (service.instance.id) | FAIL | FAIL | Unchanged |
| SPA-001 (≤10 INTERNAL spans) | FAIL (12 spans) | FAIL (37 spans) | **Worsened** — 37 INTERNAL spans vs. limit 10; consequence of 14 committed files with 40 spans |
| SPA-002 (no orphan spans) | PASS | FAIL | **New failure** — span `47f9607c` has orphan parentSpanId `749f9c3b`; likely from auto-instrumentation interaction |

SPA-001 will continue to worsen as more files are committed — the INTERNAL span count grows linearly with instrumented files. At 14 files and 40 spans, 37 of them are INTERNAL (commit-story-v2 has no SERVER/CLIENT spans). This is a structural IS gap for CLI-style applications that use only INTERNAL spans.

### 6. journal-graph.js: 3-Attempt Streak Broken

journal-graph.js required 3 attempts in runs 12, 13, 14 at ~$1.50/run. Run-15: 1 attempt at $0.56. Root cause unknown — may be due to `--thinking` flag enabling better upfront reasoning, the `fix/724-attribute-namespace` prompt changes, or LLM variation.

### 7. Cost Increase: $5.59 → $6.44 (+$0.85)

Higher than run-14 despite the journal-graph.js improvement (-$0.96). Increase driven by:
- 2 additional files committed (+~$0.28)
- journal-manager.js: $1.00 for 2 spans in 1 attempt (59.7K output tokens — high for file size)
- summary-manager.js: $1.19 for 9 spans in 1 attempt (71.8K output tokens — new cost, not previously committed with full spans)

---

## Score Projection Validation

Run-14 actionable fix output projected for run-15:

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| Conservative (RUN14-1 fix, COV-004 unchanged) | 25/25, 12 files, $5.00–5.50 | 24/25, 14 files, $6.44 | **Partially met** — quality close but not perfect; files exceeded; cost above |
| Target (RUN14-1 fix + COV-004 fixed) | 25/25, 12–13 files, $4.50–5.00 | 24/25, 14 files, $6.44 | **Partially met** — COV-004 resolved; quality below target (new COV-003 failure); files exceeded; cost above |
| Stretch (all fixes + journal-graph.js 2 attempts) | 25/25, 13 files, ≤$4.00 | 24/25, 14 files, $6.44 | **Partially met** — journal-graph.js exceeded stretch (1 attempt); other targets not met |

All three projections were off on quality (24/25 not 25/25), cost ($6.44, above all projections), and files (14, above all projections). The COV-004 resolution without explicit blocking promotion is a positive surprise. The new COV-003 failure on summary-detector.js was not anticipated.

---

## Failure Classification Across Runs 11-15

| Failure | First Seen | Fixed In | Runs Active | Status |
|---------|-----------|----------|-------------|--------|
| Push auth | Run-3 | Run-11 | 8 runs | RESOLVED — 5 consecutive successes |
| COV-004 summary-manager.js (ratio backstop) | Run-12 | **Run-15** | 3 runs | RESOLVED — 9 spans, 1 attempt |
| journal-graph.js 3 attempts | Run-12 | **Run-15** | 3 runs | RESOLVED (unclear if permanent) |
| COV-003 summaryNode missing error recording | Run-14 | **Run-15** | 1 run | RESOLVED — per OTel spec (Decision D1); all three nodes now apply NDS-007 correctly |
| CDQ-003 journal-graph.js inconsistency | Run-14 | **Run-15** | 1 run | RESOLVED — consistent NDS-007 application |
| COV-003 summary-detector.js (new) | **Run-15** | — | 1 run | Open — getDaysWithEntries and getDaysWithDailySummaries lack outer catch |
| IS SPA-001 INTERNAL span count | Run-14 | — | 2 runs | Open — structural; worsened to 37 spans |
| IS SPA-002 orphan span | **Run-15** | — | 1 run | Open — new; likely auto-instrumentation interaction |
| IS RES-001 no service.instance.id | Run-14 | — | 2 runs | Open — SDK setup gap |
| Cost above $5.00 | Run-12 | — | 4 runs | Open — $6.44 in run-15 |

---

## Oscillation Pattern

| Run | Score | Pattern |
|-----|-------|---------|
| Run-11 | 25/25 | Second perfect score; first push |
| Run-12 | 23/25 | New COV-004 + CDQ-007 failures |
| Run-13 | 25/25 | Both resolved; only 7 files (checkpoint rollbacks) |
| Run-14 | 22/25 | Worst since run-6; COV-003 + CDQ-003 + COV-004 |
| **Run-15** | **24/25** | COV-003/CDQ-003/COV-004 resolved; new COV-003 on different file |

The oscillation pattern continues: each recovery introduces a new failure in a different file or rule. The "dominant blocker peeling" pattern persists — fixing known failures exposes new instrumentation inconsistencies. Run-15 shows the highest Q×F (13.4) despite not achieving a perfect score, because the file count (14) compensates for the quality penalty.
