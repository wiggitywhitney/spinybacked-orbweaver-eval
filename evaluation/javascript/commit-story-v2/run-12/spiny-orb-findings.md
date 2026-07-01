# Spiny-Orb Findings — Run-12

Findings from evaluation run-12 to hand off to the spiny-orb team.

**Run-12 result**: 23/25 (92%) quality, 12 committed + 1 partial, PR #61 created (second consecutive).
**Run-11 findings**: 5 findings (RUN11-1 through RUN11-5).

---

## Run-11 Finding Assessment

| # | Finding | Status in Run-12 |
|---|---------|-----------------|
| RUN11-1 | Advisory contradiction rate 45% | **UNCHANGED** — 44% in run-12 (SCH-004 hallucination, CDQ-006 exemption ignored) |
| RUN11-2 | journal-graph.js requires 2 attempts | **REGRESSED** — 3 attempts in run-12 (was 2 in run-11, 3 in run-10) |
| RUN11-3 | Redundant span.end() in 2 files | **RESOLVED (this run)** — CDQ-001 issue not observed in run-12 |
| RUN11-4 | Cost $4.25 exceeds $4.00 target | **REGRESSED** — $5.19 in run-12 (+$0.94 vs run-11) |
| RUN11-5 | CDQ-007/NDS-003 conflict causes attribute dropping | **PARTIALLY ADDRESSED, NEW MANIFESTATION** — PR #352 fixed `!== undefined`/`!= null` guards, but truthy-check guards (`if (obj.property)`) are still flagged. Run-12 shows two new failure modes: journal-manager.js removed truthy guards and now sets commit.hash/author unconditionally (CDQ-007 failure); index.js still drops messages_count. |

**Summary**: 1 resolved (RUN11-3), 1 unchanged (RUN11-1), 2 regressed (RUN11-2, RUN11-4), 1 partial/new-manifestation (RUN11-5).

---

## New Run-12 Findings (6)

### RUN12-1: COV-004 Failure — Span Omission in summary-manager.js (Medium)

The agent instrumented only the 3 pipeline orchestrators in summary-manager.js (generateAndSaveDaily/Weekly/Monthly), skipping 6 exported async I/O functions: readDayEntries, saveDailySummary, readWeekDailySummaries, saveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary.

Agent rationale: "to stay near the ratio threshold" and "I/O is covered through context propagation." Neither justification maps to a rubric rule. COV-004 requires spans on each async function. All 6 are exported (RST-004 exemption does not apply) and perform filesystem I/O.

Run-11 correctly instrumented all 9 with 9 spans. Run-12 regressed to 3 spans.

**Priority**: Medium — canonical quality failure, causes -1 COV-004 dimension score.

**Fix**: No spiny-orb code fix needed. This is LLM variation in span allocation strategy. The agent needs stronger guidance that "context propagation" is not sufficient justification for omitting spans on exported async I/O functions. Consider adding a rule clarification or validator that flags exported async functions without spans.

### RUN12-2: CDQ-007 Failure — Unconditional setAttribute from Nullable Fields (Medium)

In journal-manager.js, the agent removed truthy guards (`if (commit.hash)`, `if (commit.author)`) around setAttribute calls to avoid NDS-003 violations. The attributes are now set unconditionally. The agent's own reasoning report acknowledges this "may produce undefined values if those fields are absent on the commit object."

CDQ-007 explicitly prohibits unconditional setAttribute where the value is sourced from an optional parameter or nullable field without a defined-value guard.

**Priority**: Medium — canonical quality failure, causes -1 CDQ-007 dimension score.

**Fix**: This is a direct consequence of the NDS-003 truthy-check gap (RUN11-5). The agent faces a two-bad-options choice: drop the attribute (lose telemetry) or set unconditionally (risk undefined). Adding truthy-check patterns (`if (value)`) to the NDS-003 allowlist would enable the correct behavior: guard and set when present.

### RUN12-3: NDS-003 Truthy-Check Gap Causes Double Failure (Medium)

The same root cause (NDS-003 truthy-check gap) produced two distinct failure modes this run:
1. index.js: Dropped `commit_story.context.messages_count` (same as run-11, attribute loss)
2. journal-manager.js: Removed guards, may set undefined values (new, CDQ-007 failure)

PR #352 extended the NDS-003 allowlist to recognize `!== undefined` and `!= null` guards. Run-12 shows these patterns still appear and work correctly in the 12 committed files. The gap is specifically with **truthy-check patterns** (`if (value)`, `if (obj.property)`) which are semantically valid guards for falsy values but structurally indistinguishable from business-logic conditionals by the current validator.

**Priority**: Medium — root cause for RUN12-2 and continued attribute dropping. Escalating from RUN11-5 (attribute dropping only) to RUN12-3 (attribute dropping + CDQ-007 failure) because a second failure mode emerged.

**Fix**: Extend the NDS-003 allowlist to recognize truthy-check patterns when the condition variable is the exact value being passed to setAttribute on the same or next line:
- `if (value) { span.setAttribute(key, value); }` → allowlisted
- `if (obj.property) { span.setAttribute(key, obj.property); }` → allowlisted

### RUN12-4: journal-graph.js 3 Attempts — Regression (Low)

Run-11 improved journal-graph.js from 3 attempts (run-10) to 2 attempts. Run-12 regressed back to 3 attempts. No change in the underlying file or rubric rules explains this regression — it appears to be LLM variation.

Cost impact: ~$0.50 per extra attempt. At 3 attempts ($1.51), this file accounts for 29% of total run cost.

**Priority**: Low — no quality failure, cost impact only. The 3-attempt pattern was also observed in run-10; run-11's 2-attempt success may have been the outlier.

### RUN12-5: Cost $5.19 — Highest Since Run-8 (Low)

Total run cost based on PR summary per-file data: $5.19. Primary drivers:
- journal-graph.js 3 attempts: $1.51 (29% of total)
- index.js 2 attempts: $0.67
- Output tokens 208.1K (was 158.7K in run-11)

The $4.00 target has not been met in any run since run-9 ($3.97).

**Priority**: Low — exceeds target but within acceptable range for evaluation purposes.

### RUN12-6: summary-detector.js Partial — API Overload (Low)

getDaysWithEntries and findUnsummarizedDays were skipped due to Anthropic API `overloaded_error`. 3/5 functions instrumented. Infrastructure reliability issue (single provider, no fallback).

**Priority**: Low — infrastructure, not agent design. Not a quality finding for rubric purposes.
