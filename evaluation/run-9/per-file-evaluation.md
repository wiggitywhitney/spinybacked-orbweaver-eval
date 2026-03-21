# Per-File Evaluation — Run-9

Full 32-rule rubric on ALL 29 files processed by spiny-orb. Canonical evaluation using branch state verification.

**Target repo**: commit-story-v2 proper
**Branch**: `spiny-orb/instrument-1774115750647`
**Rubric**: 32 rules (5 gates + 27 quality)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Compilation) | **PASS** | All 12 committed files pass `node --check --input-type=module` |
| NDS-002 (Tests) | **PASS** | 557 tests pass, 0 failures, 1 skip (acceptance gate — expected, needs API key) |
| NDS-003 (Non-instrumentation lines) | **PASS** | All 12 committed files: diffs contain only instrumentation additions (OTel imports, span wrapping, setAttribute, recordException, setStatus) |
| API-001 (Only @opentelemetry/api) | **PASS** | All 12 files import only from `@opentelemetry/api` |
| NDS-006 (Module system) | **PASS** | `"type": "module"` in package.json; all agent imports use ESM |

**Gates: 5/5 PASS**

---

## Per-Run Quality Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api: "^1.9.0"` in peerDependencies |
| API-003 (No vendor SDKs) | **PASS** | No dd-trace, @newrelic/*, @splunk/* in package.json |
| API-004 (No SDK imports) | **PASS** | `@opentelemetry/sdk-node` in devDependencies only (not peerDependencies). First PASS since run-1 — targeting commit-story-v2 proper which has correct packaging per PRD #51. |
| CDQ-002 (Tracer acquired) | **PASS** | All 12 files: `trace.getTracer('commit-story')` matches package.json name |
| CDQ-008 (Consistent naming) | **PASS** | All 12 files use identical tracer name `'commit-story'` |

---

## NDS-005b Methodology Note

The agent's `startActiveSpan` pattern wraps function bodies in `try { ... } catch (error) { recordException(error); setStatus(ERROR); throw error; } finally { span.end(); }`. This adds a new outer catch block to functions that previously had none.

**Ruling: PASS** — consistent with runs 5-8. The catch-rethrow pattern is the standard OTel instrumentation pattern for error visibility (CDQ-003). Errors are rethrown unchanged, so error propagation is not modified. NDS-005b targets catch blocks that ALTER error propagation (swallowing errors, changing error types, or reordering handler logic), not catch blocks that observe-and-rethrow.

---

## Committed Files (12 files, 26 spans)

### src/collectors/claude-collector.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | Signature preserved |
| NDS-005 | PASS | No pre-existing error handling restructured; new outer catch is observe-and-rethrow |
| COV-001 | PASS | Entry point `collectChatMessages` has span |
| COV-003 | PASS | recordException + setStatus in catch |
| COV-005 | PASS | 5 domain attributes (source, time_window, session/message counts) |
| RST-001 | PASS | 7 sync utilities correctly skipped |
| RST-004 | PASS | Only exported function instrumented |
| SCH-001 | PASS | `commit_story.context.collect_chat_messages` follows convention |
| SCH-002 | PASS | All attribute keys in registry |
| SCH-003 | PASS | sessions_count/messages_count passed as int (`.size`/`.length`) |
| CDQ-001 | PASS | span.end() in finally |
| CDQ-003 | PASS | Standard error recording pattern |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | .toISOString() exempt (trivial) |
| CDQ-007 | PASS | No unbounded or PII attributes |

**Result: ALL PASS**

### src/collectors/git-collector.js (2 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | Both signatures preserved |
| NDS-005 | PASS | Internal runGit try/catch untouched |
| COV-001 | PASS | Both exported async functions have spans |
| COV-003 | PASS | Both spans record exceptions |
| COV-005 | PASS | vcs.ref.head.revision, commit.author/message/timestamp |
| RST-001 | PASS | 4 internal helpers correctly skipped |
| RST-004 | PASS | Only exported functions instrumented |
| SCH-001 | PASS | commit_story.git.* names follow convention |
| SCH-002 | PASS | All keys in registry (including OTel standard vcs.ref.head.revision) |
| SCH-003 | PASS | String attributes get strings, .toISOString() for timestamp |
| CDQ-001 | PASS | Both spans closed in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | .toISOString() exempt |
| CDQ-007 | PASS | commit.message uses metadata.subject (first line, bounded) |

**Result: ALL PASS**

### src/commands/summarize.js (3 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | All 3 signatures preserved |
| NDS-005 | PASS | Internal per-date try/catch blocks preserved intact |
| COV-001 | PASS | All 3 exported async orchestrators have spans |
| COV-003 | PASS | Internal error handling preserved; outer spans use try/finally only (no catch needed — errors handled at item level) |
| COV-005 | PASS | dates_count, weeks_count, months_count, generated_count, failed_count |
| RST-001 | PASS | 6 sync helpers correctly skipped |
| RST-004 | PASS | Only exported functions instrumented |
| SCH-001 | PASS | commit_story.summarize.* follows convention |
| SCH-002 | PASS | All keys in agent-extensions.yaml |
| SCH-003 | PASS | Count attributes use .length (int) |
| CDQ-001 | PASS | span.end() in finally blocks |
| CDQ-003 | PASS | Error handling at item level (not span level) — appropriate for batch operations |
| CDQ-005 | PASS | startActiveSpan callbacks |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded or PII |

**Result: ALL PASS**

### src/generators/summary-graph.js (3 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | All 3 signatures preserved |
| NDS-005 | PASS | Original logic preserved |
| COV-001 | PASS | All 3 exported generators have spans |
| COV-003 | PASS | recordException in catch blocks |
| COV-005 | PASS | entry_date, entries_count, week_label, dates_count, month_label, weeks_count |
| RST-001 | PASS | LangGraph nodes correctly skipped (auto-instrumented by LangChainInstrumentation) |
| RST-004 | PASS | Only exported functions instrumented |
| SCH-001 | PASS | commit_story.summary.* follows convention |
| SCH-002 | PASS | All keys in schema or agent-extensions |
| SCH-003 | PASS | Count attrs use .length (int), strings are strings |
| CDQ-001 | PASS | span.end() in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callbacks |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded or PII |

**Result: ALL PASS**

### src/index.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | main() signature preserved |
| NDS-005 | PASS | All process.exit() calls and auto-summarize try/catch preserved |
| COV-001 | PASS | main is top-level entry point with span |
| COV-003 | PASS | recordException in catch |
| COV-005 | PASS | vcs.ref.head.revision, cli.subcommand, journal.file_path |
| RST-001 | PASS | 7 sync helpers correctly skipped |
| RST-004 | PASS | Only main() instrumented |
| SCH-001 | PASS | commit_story.cli.main follows convention |
| SCH-002 | PASS | All keys in schema or agent-extensions |
| SCH-003 | PASS | String attributes set with strings |
| CDQ-001 | PASS | span.end() in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded or PII |

**Result: ALL PASS**

### src/integrators/context-integrator.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | Signature preserved with defaults |
| NDS-005 | PASS | All 8 steps preserved in order |
| COV-001 | PASS | gatherContextForCommit is main entry point with span |
| COV-003 | PASS | recordException in catch |
| COV-005 | PASS | 7 domain attributes (vcs.ref, filter counts, context counts, time window) |
| RST-001 | PASS | 2 sync formatters correctly skipped |
| RST-004 | PASS | Only exported orchestrator instrumented |
| SCH-001 | PASS | commit_story.context.gather_for_commit follows convention |
| SCH-002 | PASS | All keys in attributes.yaml |
| SCH-003 | PASS | Count attrs get .length/.size (int), ISO strings for timestamps |
| CDQ-001 | PASS | span.end() in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded or PII |

**Result: ALL PASS**

### src/managers/auto-summarize.js (3 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | All 3 signatures preserved |
| NDS-005 | PASS | Internal per-item try/catch preserved |
| COV-001 | PASS | All 3 exported orchestrators have spans |
| COV-003 | PASS | recordException in outer catch |
| COV-005 | PASS | dates_count, weeks_count, months_count, generated_count, failed_count |
| RST-001 | PASS | getErrorMessage helper correctly skipped |
| RST-004 | PASS | Only exported functions instrumented |
| SCH-001 | PASS | commit_story.summarize.trigger_auto_* follows convention |
| SCH-002 | PASS | All keys in agent-extensions |
| SCH-003 | PASS | Count attrs use .length (int) |
| CDQ-001 | PASS | span.end() in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callbacks |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded or PII |

**Result: ALL PASS**

### src/managers/journal-manager.js (2 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | Both signatures preserved with defaults |
| NDS-005 | PASS | Duplicate detection logic and inner catches preserved |
| COV-001 | PASS | Both exported entry points have spans |
| COV-003 | PASS | recordException in outer catch |
| COV-005 | PASS | file_path, entry_date, commit.author, vcs.ref, time_window, quotes_count |
| RST-001 | PASS | formatJournalEntry sync helper correctly skipped |
| RST-004 | PASS | Only exported functions instrumented |
| SCH-001 | PASS | commit_story.journal.* follows convention |
| SCH-002 | PASS | All keys in attributes.yaml |
| SCH-003 | PASS | quotes_count uses .length (int), strings are strings |
| CDQ-001 | PASS | span.end() in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callbacks |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded or PII |

**Result: ALL PASS**

### src/managers/summary-manager.js (3 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | All 3 signatures preserved |
| NDS-005 | PASS | Inner access() try/catch preserved in all 3 |
| COV-001 | PASS | All 3 exported orchestrators have spans |
| COV-003 | PASS | recordException in outer catch |
| COV-005 | PASS | entry_date, entries_count, file_path, week_label, month_label |
| RST-001 | PASS | 5 sync formatters and 6 I/O helpers correctly skipped (I/O helpers called by orchestrators) |
| RST-004 | PASS | Only orchestrator functions instrumented |
| SCH-001 | PASS | commit_story.summary.generate_and_save_* follows convention |
| SCH-002 | PASS | All keys in schema or agent-extensions |
| SCH-003 | PASS | Count attrs use .length (int) |
| CDQ-001 | PASS | span.end() in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callbacks |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded or PII |

**Result: ALL PASS**

### src/mcp/server.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | main() signature preserved |
| NDS-005 | PASS | Original logic preserved |
| COV-001 | PASS | Entry point main() has span |
| COV-003 | PASS | recordException in catch |
| COV-005 | PASS | commit_story.mcp.transport attribute |
| RST-001 | PASS | createServer() sync factory correctly skipped |
| RST-004 | PASS | Only main() instrumented |
| SCH-001 | PASS | commit_story.mcp.server.main follows convention |
| SCH-002 | PASS | mcp.transport in agent-extensions |
| SCH-003 | PASS | String attribute with string value |
| CDQ-001 | PASS | span.end() in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded or PII |

**Result: ALL PASS**

### src/utils/journal-paths.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | Signature preserved |
| NDS-005 | PASS | Original logic preserved |
| COV-001 | PASS | Exported async function has span |
| COV-003 | PASS | recordException in catch |
| COV-005 | PASS | commit_story.journal.file_path attribute |
| RST-001 | PASS | ensureDirectory is exported async with I/O (mkdir). 11 sync path-computation functions correctly skipped. |
| RST-004 | PASS | Only exported async function instrumented |
| SCH-001 | PASS | commit_story.journal.ensure_directory follows convention |
| SCH-002 | PASS | file_path in attributes.yaml |
| SCH-003 | PASS | String attribute |
| CDQ-001 | PASS | span.end() in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded or PII |

**Result: ALL PASS**

### src/utils/summary-detector.js (5 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | All 5 signatures preserved |
| NDS-005 | PASS | Internal readdir try/catch preserved |
| COV-001 | PASS | All 5 exported async functions have spans |
| COV-003 | PASS | recordException in outer catch blocks |
| COV-005 | PASS | dates_count, weeks_count, months_count |
| RST-001 | PASS | All 5 are exported async functions with filesystem I/O. 6 unexported helpers correctly skipped. |
| RST-004 | PASS | Only exported functions instrumented |
| SCH-001 | PASS | commit_story.summary_detector.* follows convention |
| SCH-002 | PASS | All keys in agent-extensions |
| SCH-003 | PASS | Count attrs use .length (int) |
| CDQ-001 | PASS | span.end() in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callbacks |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded or PII |

**Result: ALL PASS**

---

## Partial File

### src/generators/journal-graph.js — PARTIAL (reassembly validator bug)

Not evaluated for quality rules — partial files are not committed to the branch.

**Root cause**: SCH-001 reassembly validator rejects extension span name `commit_story.journal.generate_sections` as "not found in registry span definitions." The validator checks the base registry but not agent-extensions.yaml. See failure-deep-dives.md for full analysis.

---

## Correct Skips (16 files)

All 16 correctly skipped — sync-only files with no async I/O:

| File | Reason | Correct? |
|------|--------|----------|
| generators/prompts/guidelines/accessibility.js | String constant export | YES |
| generators/prompts/guidelines/anti-hallucination.js | String constant export | YES |
| generators/prompts/guidelines/index.js | Sync function | YES |
| generators/prompts/sections/daily-summary-prompt.js | Sync function | YES |
| generators/prompts/sections/dialogue-prompt.js | String constant export | YES |
| generators/prompts/sections/monthly-summary-prompt.js | Sync function | YES |
| generators/prompts/sections/summary-prompt.js | Sync function | YES |
| generators/prompts/sections/technical-decisions-prompt.js | String constant export | YES |
| generators/prompts/sections/weekly-summary-prompt.js | Sync function | YES |
| integrators/filters/message-filter.js | Sync functions | YES |
| integrators/filters/sensitive-filter.js | Sync functions | YES |
| integrators/filters/token-filter.js | Sync functions | YES |
| mcp/tools/context-capture-tool.js | Sync function (registers callback) | YES |
| mcp/tools/reflection-tool.js | Sync function (registers callback) | YES |
| utils/commit-analyzer.js | Sync functions | YES |
| utils/config.js | Module-level validation only | YES |

**16/16 correct skips.**

### MCP Tool Callback Pattern (PRD step 4)

context-capture-tool.js and reflection-tool.js both export sync `register*Tool` functions that register async callbacks with the MCP server. The async callbacks run later when MCP tools are invoked. The skip is correct — the registration functions are sync. The callbacks execute within the MCP server's span context (server.js has a span on `main()`). No separate spans needed for the registration functions.

---

## SCH-001 Semantic Quality (PRD step 6)

All 26 span names follow the `commit_story.*` convention. Semantic review:

| Span Name | Semantic Quality | Notes |
|-----------|-----------------|-------|
| context.collect_chat_messages | Good | Describes what it does |
| git.get_commit_data | Good | Clear git operation |
| git.get_previous_commit_time | Good | Specific and clear |
| summarize.run_summarize | Good | Matches function purpose |
| summarize.run_weekly_summarize | Good | Variant is clear |
| summarize.run_monthly_summarize | Good | Variant is clear |
| summary.generate_daily | Good | LLM generation for daily |
| summary.generate_weekly | Good | LLM generation for weekly |
| summary.generate_monthly | Good | LLM generation for monthly |
| cli.main | Good | Top-level CLI entry |
| context.gather_for_commit | Good | Orchestration is clear |
| summarize.trigger_auto_summaries | Good | Auto-trigger distinguished from manual |
| summarize.trigger_auto_weekly_summaries | Good | Variant is clear |
| summarize.trigger_auto_monthly_summaries | Good | Variant is clear |
| journal.save_entry | Good | File write operation |
| journal.discover_reflections | Good | Scan operation |
| summary.generate_and_save_daily | Good | Combined generate+save distinguished |
| summary.generate_and_save_weekly | Good | Variant is clear |
| summary.generate_and_save_monthly | Good | Variant is clear |
| mcp.server.main | Good | MCP server entry |
| journal.ensure_directory | Good | Filesystem setup |
| summary_detector.get_days_with_entries | Good | Filesystem scan |
| summary_detector.find_unsummarized_days | Good | Detection logic |
| summary_detector.get_days_with_daily_summaries | Good | Filesystem scan |
| summary_detector.find_unsummarized_weeks | Good | Detection logic |
| summary_detector.find_unsummarized_months | Good | Detection logic |

**26/26 span names semantically correct.** No collisions (all unique). Namespace organization is logical (git, context, summarize, summary, journal, cli, mcp, summary_detector).

---

## Summary

| File | Spans | Result |
|------|-------|--------|
| claude-collector.js | 1 | ALL PASS |
| git-collector.js | 2 | ALL PASS |
| summarize.js | 3 | ALL PASS |
| summary-graph.js | 3 | ALL PASS |
| index.js | 1 | ALL PASS |
| context-integrator.js | 1 | ALL PASS |
| auto-summarize.js | 3 | ALL PASS |
| journal-manager.js | 2 | ALL PASS |
| summary-manager.js | 3 | ALL PASS |
| server.js | 1 | ALL PASS |
| journal-paths.js | 1 | ALL PASS |
| summary-detector.js | 5 | ALL PASS |
| **Total** | **26 spans** | **12/12 ALL PASS** |

**Quality score: 25/25** (all per-run + per-file rules pass)
**Gates: 5/5 PASS**
**Correct skips: 16/16**
**Span name quality: 26/26 semantically correct, all unique**
