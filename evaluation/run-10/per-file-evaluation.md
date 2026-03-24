# Per-File Evaluation — Run-10

Full 32-rule rubric on ALL 30 files. Target repo: commit-story-v2 proper, branch `spiny-orb/instrument-1774247624091`.

---

## Gate Checks (5/5 PASS)

| Rule | Scope | Result | Evidence |
|------|-------|--------|----------|
| NDS-001 (Compilation) | Per-run | **PASS** | All 12 committed files pass `node --check` |
| NDS-002 (Tests) | Per-run | **PASS** | 564 tests, 0 failures, 1 skip (acceptance gate) |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** | All 12 files: diffs contain only instrumentation additions |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** | All imports from `@opentelemetry/api` only |
| NDS-006 (Module system) | Per-run | **PASS** | ESM throughout, no `require()` |

---

## Per-Run Quality Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in peerDependencies |
| API-003 (No vendor SDKs) | **PASS** | No dd-trace, @newrelic, @splunk |
| API-004 (No SDK imports) | **PASS** | sdk-node in devDependencies only (target repo) |
| CDQ-002 (Tracer acquired) | **PASS** | All 12 files use `trace.getTracer('commit-story')` |
| CDQ-008 (Consistent naming) | **PASS** | Single tracer name `commit-story` across all files |
| COV-006 (No collisions) | **PASS** | 28 unique span names, zero collisions |

---

## Per-File Quality Rules — Committed Files (12)

### claude-collector.js (1 span)

| Rule | Result |
|------|--------|
| NDS-004, NDS-005, COV-001, COV-003, COV-005, RST-001, RST-004, SCH-001, SCH-002, SCH-003, CDQ-001, CDQ-003, CDQ-005, CDQ-006, CDQ-007 | ALL PASS |

### git-collector.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-004, NDS-005, COV-001, COV-003, COV-005, RST-001, RST-004, SCH-001, SCH-002, SCH-003, CDQ-001, CDQ-003, CDQ-005, CDQ-006, CDQ-007 | ALL PASS |

### summarize.js (3 spans)

| Rule | Result | Notes |
|------|--------|-------|
| Most rules | PASS | |
| **SCH-003** | **FAIL** | `commit_story.summarize.force` declared as `type: string` in agent-extensions.yaml but set to boolean value (`force` from destructured options). Same class of bug as count-type issue — schema accumulator gets boolean types wrong. |

### journal-graph.js (2 spans)

| Rule | Result | Notes |
|------|--------|-------|
| Most rules | PASS | |
| CDQ-006 | **Advisory** | `sections.generatedAt.toISOString().split('T')[0]` — `.split()` chain. Borderline: practically trivial but technically a method chain. Classified as advisory per run-9 methodology where CDQ-006 passed for equivalent patterns. |

### summary-graph.js (6 spans)

| Rule | Result | Notes |
|------|--------|-------|
| Most rules | PASS | |
| **CDQ-007** | **FAIL** | 6 instances of `entries?.length`, `dailySummaries?.length`, `weeklySummaries?.length` passed to `setAttribute` without defined-value guard. Optional chaining yields `undefined` when source is null/undefined. Lines 177, 260, 393, 476, 612, 698. |

### index.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| Most rules | PASS | |
| **SCH-003** | **FAIL** | `commit_story.commit.is_merge` declared as `type: string` in agent-extensions.yaml but set to `mergeInfo.isMerge` (boolean). Same boolean-type-mismatch as summarize.js. |

### context-integrator.js (1 span)

| Rule | Result |
|------|--------|
| All rules | ALL PASS |

### auto-summarize.js (3 spans)

| Rule | Result |
|------|--------|
| All rules | ALL PASS |

### journal-manager.js (2 spans)

| Rule | Result | Notes |
|------|--------|-------|
| Most rules | PASS | |
| CDQ-006 | **Advisory** | `(commit.message || '').split('\n')[0]` — `.split()` to get first line. Practically trivial on short strings. Advisory per run-9 methodology. |

### server.js (1 span)

| Rule | Result |
|------|--------|
| All rules | ALL PASS |

### journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| All rules | ALL PASS |

### summary-detector.js (5 spans)

| Rule | Result |
|------|--------|
| All rules | ALL PASS |

---

## Correct Skips (17)

All correctly skipped — no code changes on branch (only `.instrumentation.md` reports):

| File | Reason | Correct? |
|------|--------|----------|
| generators/prompts/guidelines/accessibility.js | String constant only | YES |
| generators/prompts/guidelines/anti-hallucination.js | String constant only | YES |
| generators/prompts/guidelines/index.js | Sync function only | YES |
| generators/prompts/sections/daily-summary-prompt.js | Sync function only | YES |
| generators/prompts/sections/dialogue-prompt.js | String constant only | YES |
| generators/prompts/sections/monthly-summary-prompt.js | Sync function only | YES |
| generators/prompts/sections/summary-prompt.js | Sync function only | YES |
| generators/prompts/sections/technical-decisions-prompt.js | String constant only | YES |
| generators/prompts/sections/weekly-summary-prompt.js | Sync function only | YES |
| integrators/filters/message-filter.js | Sync functions only | YES |
| integrators/filters/sensitive-filter.js | Sync functions only | YES |
| integrators/filters/token-filter.js | Sync functions only | YES |
| mcp/tools/context-capture-tool.js | Sync registration only | YES |
| mcp/tools/reflection-tool.js | Sync registration only | YES |
| traceloop-init.js | Module init only, no functions | YES |
| utils/commit-analyzer.js | Sync functions only | YES |
| utils/config.js | Module init, frozen export | YES |

**17/17 correct skips** — all consistent with RST-001/RST-004 criteria.

---

## Failed File (1)

| File | Status | Quality Impact |
|------|--------|---------------|
| summary-manager.js | Failed (Weaver CLI) | Not evaluated — not on branch |

---

## MCP Tool Callback Pattern

context-capture-tool.js and reflection-tool.js both export `registerContextCaptureTool` and `registerReflectionTool` respectively. These are sync functions that register async callbacks via `server.tool()`. The callbacks execute I/O (file reads, LLM calls) but are not top-level async functions — they're registered as handlers.

**Decision**: Correct skip. The sync registration function itself has no I/O. The async callback inside would need instrumentation from the MCP auto-instrumentation library, not manual spans. This is consistent with runs 7-9.

---

## SCH-001 Semantic Quality

28 unique span names, all semantically correct:

| Category | Span Names | Semantically Correct? |
|----------|-----------|----------------------|
| context | collect_chat_messages, gather_for_commit | YES — distinct operations |
| git | get_commit_data, get_previous_commit_time | YES — clear git operations |
| summarize | run_daily, run_weekly, run_monthly | YES — granularity variants |
| summary | daily_node, generate_daily, weekly_node, generate_weekly, monthly_node, generate_monthly | YES — node vs generate distinction |
| auto_summarize | trigger_all, trigger_weekly, trigger_monthly | YES — distinct from summarize.run_* |
| journal | save_entry, discover_reflections, ensure_directory, generate_sections | YES — clear file/generation ops |
| ai | generate_section | YES — LLM node operation |
| cli | main (`commit_story.cli.main`) | YES — CLI entry point |
| mcp | main (`commit_story.mcp.main`) | YES — MCP entry point (fully qualified names are unique despite short-name overlap) |
| summary_detector | 5 detection operations | YES — filesystem scan operations |

---

## Span Inventory

28 spans across 12 files (verified by `startActiveSpan` count in diff):

| File | Spans | Verified |
|------|-------|----------|
| claude-collector.js | 1 | YES |
| git-collector.js | 2 | YES |
| summarize.js | 3 | YES |
| journal-graph.js | 2 | YES |
| summary-graph.js | 6 | YES |
| index.js | 1 | YES |
| context-integrator.js | 1 | YES |
| auto-summarize.js | 3 | YES |
| journal-manager.js | 2 | YES |
| server.js | 1 | YES |
| journal-paths.js | 1 | YES |
| summary-detector.js | 5 | YES |
| **Total** | **28** | |

---

## Canonical Failure Summary

| Rule | Files Affected | Classification | Details |
|------|---------------|----------------|---------|
| SCH-003 | summarize.js, index.js | **Canonical** | Boolean attributes (`force`, `is_merge`) declared as `type: string`. Schema accumulator type fix only covers `*_count` → int, not booleans. |
| CDQ-007 | summary-graph.js | **Canonical** | 6 instances of `?.length` without defined-value guard. Optional chaining yields `undefined` when source is null/undefined. |

### Advisory Findings (not counted as canonical failures)

| Rule | Files Affected | Details |
|------|---------------|---------|
| CDQ-006 | journal-graph.js, journal-manager.js | `.split()` chains without `isRecording()` guard. Practically trivial operations on short strings. Classified as advisory per run-9 methodology. |
