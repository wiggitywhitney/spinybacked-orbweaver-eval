# Rubric Scores — Run-9

Canonical scoring from per-file evaluation. First run targeting commit-story-v2 proper.

---

## Score Summary

| Dimension | Run-9 | Run-8 | Delta | Failures |
|-----------|-------|-------|-------|----------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 2/2 (100%) | — | — |
| Coverage (COV) | 5/5 (100%) | 5/5 (100%) | — | — |
| Restraint (RST) | 4/4 (100%) | 4/4 (100%) | — | — |
| API-Only Dependency (API) | 3/3 (100%) | 2/3 (67%) | **+33pp** | — |
| Schema Fidelity (SCH) | 4/4 (100%) | 3/4 (75%) | **+25pp** | — |
| Code Quality (CDQ) | 7/7 (100%) | 7/7 (100%) | — | — |
| **Overall quality** | **25/25 (100%)** | **23/25 (92%)** | **+8pp** | **0 failures** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | — | — |
| **Files committed** | **12/29** | **12/29** | — | journal-graph.js partial (both runs) |

**First perfect quality score (25/25) across all evaluation runs.**

## Operational Metrics

| Metric | Run-9 | Run-8 | Delta |
|--------|-------|-------|-------|
| Cost | $3.97 | ~$4.00 | -$0.03 |
| Duration | 43.7m | 41m | +2.7m |
| Cost/file | $0.33 | $0.33 | — |
| Quality x Files | 12.00 | 11.04 | +0.96 |
| Push/PR | Failed (7th) | Failed (6th) | Still broken |

---

## Per-Rule Results

### Gates (5/5 PASS)

| Rule | Scope | Result |
|------|-------|--------|
| NDS-001 (Compilation) | Per-run | PASS — all 12 files pass node --check |
| NDS-002 (Tests) | Per-run | PASS — 557 tests, 0 failures, 1 skip (acceptance gate) |
| NDS-003 (Non-instrumentation lines) | Per-file | PASS — all 12 files: diffs contain only instrumentation additions |
| API-001 (Only @opentelemetry/api) | Per-file | PASS — all imports from @opentelemetry/api only |
| NDS-006 (Module system) | Per-run | PASS — ESM throughout |

### Quality Rules (25/25)

| Rule | Result | Instance Count | Affected Files |
|------|--------|---------------|----------------|
| NDS-004 (Signatures preserved) | PASS | 12/12 (100%) | — |
| NDS-005 (Error handling preserved) | PASS | 12/12 (100%) | Standard OTel catch-rethrow pattern |
| COV-001 (Entry points have spans) | PASS | 12/12 (100%) | — |
| COV-003 (Error visibility) | PASS | 12/12 (100%) | recordException + setStatus in catch |
| COV-005 (Domain attributes) | PASS | 12/12 (100%) | Every span has 1+ meaningful attributes |
| RST-001 (No utility spans) | PASS | 12/12 (100%) | All sync helpers correctly skipped |
| RST-004 (No internal detail spans) | PASS | 12/12 (100%) | Only exported functions instrumented |
| SCH-001 (Span names match registry) | PASS | 26/26 (100%) | All follow commit_story.* convention |
| SCH-002 (Attribute keys registered) | PASS | 12/12 (100%) | All keys in schema or agent-extensions |
| SCH-003 (Attribute values conform) | PASS | 12/12 (100%) | All count attrs type: int, booleans correct |
| CDQ-001 (Spans closed in finally) | PASS | 12/12 (100%) | span.end() in finally blocks |
| CDQ-003 (Standard error recording) | PASS | 12/12 (100%) | recordException + setStatus(ERROR) |
| CDQ-005 (Async context maintained) | PASS | 12/12 (100%) | startActiveSpan with async callback |
| CDQ-006 (No expensive computation) | PASS | 12/12 (100%) | Trivial conversions only |
| CDQ-007 (No unbounded/PII attrs) | PASS | 12/12 (100%) | No leakage detected |
| API-002 (Correct dependency) | PASS | — | @opentelemetry/api in peerDependencies |
| API-003 (No vendor SDKs) | PASS | — | No dd-trace, @newrelic, @splunk |
| API-004 (No SDK imports) | PASS | — | sdk-node in devDependencies only (not peerDeps). **First PASS since run-1.** |
| CDQ-002 (Tracer acquired) | PASS | 12/12 | trace.getTracer('commit-story') |
| CDQ-008 (Consistent naming) | PASS | 12/12 | All use 'commit-story' |

---

## Improvements from Run-8

| Rule | Run-8 | Run-9 | Cause |
|------|-------|-------|-------|
| API-004 | FAIL | **PASS** | Target repo (commit-story-v2 proper) has sdk-node in devDeps per PRD #51. Eval repo had it in peerDeps (manual addition in PRD #3). |
| SCH-003 | FAIL | **PASS** | Dual-layer fix: schema accumulator write-time correction (PR #270) + validation-time check (PRs #267, #286). All 6 count attributes now type: int. |

---

## Failure Classification

**Zero quality failures.** No canonical, pre-existing, persistent, or new failures.

The only issues are operational:
- Push auth failure (7th consecutive) — delivery, not quality
- journal-graph.js partial — tooling (reassembly validator bug), not quality
- Advisory contradiction rate 67% — PR summary accuracy, not instrumentation quality

---

## Span Inventory

26 spans across 12 files, all unique:

| Category | Span Names | Count |
|----------|-----------|-------|
| context | collect_chat_messages, gather_for_commit | 2 |
| git | get_commit_data, get_previous_commit_time | 2 |
| summarize | run_summarize, run_weekly_summarize, run_monthly_summarize, trigger_auto_summaries, trigger_auto_weekly_summaries, trigger_auto_monthly_summaries | 6 |
| summary | generate_daily, generate_weekly, generate_monthly, generate_and_save_daily, generate_and_save_weekly, generate_and_save_monthly | 6 |
| journal | save_entry, discover_reflections, ensure_directory | 3 |
| cli | main | 1 |
| mcp | server.main | 1 |
| summary_detector | get_days_with_entries, find_unsummarized_days, get_days_with_daily_summaries, find_unsummarized_weeks, find_unsummarized_months | 5 |
| **Total** | | **26** |

All 26 span names are semantically correct and collision-free.
