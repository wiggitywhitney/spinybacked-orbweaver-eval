# Rubric Scores — Run-10

Canonical scoring from per-file evaluation. Second run targeting commit-story-v2 proper.

---

## Score Summary

| Dimension | Run-10 | Run-9 | Delta | Failures |
|-----------|--------|-------|-------|----------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 2/2 (100%) | — | — |
| Coverage (COV) | 5/5 (100%) | 5/5 (100%) | — | — |
| Restraint (RST) | 4/4 (100%) | 4/4 (100%) | — | — |
| API-Only Dependency (API) | 3/3 (100%) | 3/3 (100%) | — | — |
| Schema Fidelity (SCH) | 3/4 (75%) | 4/4 (100%) | **-25pp** | SCH-003 |
| Code Quality (CDQ) | 6/7 (86%) | 7/7 (100%) | **-14pp** | CDQ-007 |
| **Overall quality** | **23/25 (92%)** | **25/25 (100%)** | **-8pp** | **2 failures** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | — | — |
| **Files committed** | **12/30** | **12/29** | — | journal-graph.js gained, summary-manager.js lost |
| **Cost** | **$4.36** | **$3.97** | +$0.39 | |
| **Quality x Files** | **11.04** | **12.00** | -0.96 | |

**Quality regression from 100% to 92%.** Two new failure types discovered:
1. **SCH-003**: Boolean attributes declared as `type: string` (schema accumulator type fix only covers `*_count` → int)
2. **CDQ-007**: Optional chaining (`?.length`) yields undefined without defined-value guard

## Operational Metrics

| Metric | Run-10 | Run-9 | Delta |
|--------|--------|-------|-------|
| Cost | $4.36 | $3.97 | +$0.39 |
| Duration | 45.9m | 43.7m | +2.2m |
| Cost/file | $0.36 | $0.33 | +$0.03 |
| Quality x Files | 11.04 | 12.00 | -0.96 |
| Push/PR | Failed (8th) | Failed (7th) | Still broken (different error) |
| Output tokens | 175.8K | 180.2K | -4.4K |

---

## Per-Rule Results

### Gates (5/5 PASS)

| Rule | Scope | Result |
|------|-------|--------|
| NDS-001 (Compilation) | Per-run | PASS — all 12 files pass `node --check` |
| NDS-002 (Tests) | Per-run | PASS — 564 tests, 0 failures, 1 skip (acceptance gate) |
| NDS-003 (Non-instrumentation lines) | Per-file | PASS — all 12 files: diffs contain only instrumentation additions |
| API-001 (Only @opentelemetry/api) | Per-file | PASS — all imports from `@opentelemetry/api` only |
| NDS-006 (Module system) | Per-run | PASS — ESM throughout |

### Quality Rules (23/25)

| Rule | Result | Instance Count | Affected Files |
|------|--------|---------------|----------------|
| NDS-004 (Signatures preserved) | PASS | 12/12 (100%) | — |
| NDS-005 (Error handling preserved) | PASS | 12/12 (100%) | Standard OTel catch-rethrow pattern |
| COV-001 (Entry points have spans) | PASS | 12/12 (100%) | — |
| COV-003 (Error visibility) | PASS | 12/12 (100%) | recordException + setStatus in catch |
| COV-005 (Domain attributes) | PASS | 12/12 (100%) | Every span has 1+ meaningful attributes |
| RST-001 (No utility spans) | PASS | 12/12 (100%) | All sync helpers correctly skipped |
| RST-004 (No internal detail spans) | PASS | 12/12 (100%) | Only exported functions instrumented |
| SCH-001 (Span names match registry) | PASS | 28/28 (100%) | All follow `commit_story.*` convention |
| SCH-002 (Attribute keys registered) | PASS | 12/12 (100%) | All keys in schema or agent-extensions |
| **SCH-003 (Attribute values conform)** | **FAIL** | **10/12 (83%)** | **summarize.js (`force` boolean→string), index.js (`is_merge` boolean→string)** |
| CDQ-001 (Spans closed in finally) | PASS | 12/12 (100%) | span.end() in finally blocks |
| CDQ-003 (Standard error recording) | PASS | 12/12 (100%) | recordException + setStatus(ERROR) |
| CDQ-005 (Async context maintained) | PASS | 12/12 (100%) | startActiveSpan with async callback |
| CDQ-006 (No expensive computation) | PASS | 12/12 (100%) | Advisory: 2 files with `.split()` chains (trivial, consistent with run-9 methodology) |
| **CDQ-007 (No unbounded/PII attrs)** | **FAIL** | **11/12 (92%)** | **summary-graph.js: 6 `?.length` without guard** |
| API-002 (Correct dependency) | PASS | — | @opentelemetry/api in peerDependencies |
| API-003 (No vendor SDKs) | PASS | — | No dd-trace, @newrelic, @splunk |
| API-004 (No SDK imports) | PASS | — | sdk-node in devDependencies only |
| CDQ-002 (Tracer acquired) | PASS | 12/12 | trace.getTracer('commit-story') |
| CDQ-008 (Consistent naming) | PASS | 12/12 | All use 'commit-story' |

---

## Failure Classification

### SCH-003: Boolean Attributes Declared as String (NEW)

**Affected files**: summarize.js, index.js (2/12)

**Root cause**: The schema accumulator declares all non-count attributes as `type: string`. The dual-layer count-type fix from run-9 (PRs #267, #270, #286) specifically targets `*_count` patterns → int. Boolean attributes (`force`, `is_merge`) are not covered by this fix — they get the default `type: string` declaration.

**Evidence**:
- `commit_story.summarize.force`: `type: string` in agent-extensions.yaml, value is boolean
- `commit_story.commit.is_merge`: `type: string` in agent-extensions.yaml, value is boolean

**Classification**: New finding. Same underlying bug class as the count-type issue, but a different type dimension (boolean vs int).

### CDQ-007: Optional Chaining Without Defined-Value Guard (NEW)

**Affected files**: summary-graph.js (1/12)

**Root cause**: The agent uses `entries?.length` to set attribute values, but when `entries` is undefined/null, `?.length` yields `undefined`. Passing `undefined` to `setAttribute` is a no-op in OTel SDK (silently dropped), but it's bad practice and technically violates CDQ-007's "unconditional setAttribute without defined-value guard" sub-rule.

**Evidence**: 6 instances across all 6 spans in summary-graph.js (lines 177, 260, 393, 476, 612, 698).

**Classification**: New finding. The optional chaining pattern may have been introduced specifically for run-10's instrumentation code.

---

## Span Inventory

28 spans across 12 files, all unique:

| Category | Span Names | Count |
|----------|-----------|-------|
| context | collect_chat_messages, gather_for_commit | 2 |
| git | get_commit_data, get_previous_commit_time | 2 |
| summarize | run_daily, run_weekly, run_monthly | 3 |
| summary | daily_node, generate_daily, weekly_node, generate_weekly, monthly_node, generate_monthly | 6 |
| auto_summarize | trigger_all, trigger_weekly, trigger_monthly | 3 |
| journal | save_entry, discover_reflections, ensure_directory, generate_sections | 4 |
| ai | generate_section | 1 |
| cli | main | 1 |
| mcp | main | 1 |
| summary_detector | get_days_with_entries, find_unsummarized_days, get_days_with_daily_summaries, find_unsummarized_weeks, find_unsummarized_months | 5 |
| **Total** | | **28** |

All 28 span names are semantically correct and collision-free. +2 from run-9's 26 spans (journal-graph.js now committed).
