# Per-File Evaluation — Run-14

**Date**: 2026-04-15
**Branch**: spiny-orb/instrument-1776263984892
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 30 (12 committed + 18 correct skips)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check` exits 0 on all 12 instrumented files |
| NDS-002 (Tests) | **PASS** | Live-check OK; zero checkpoint test failures across full run |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | @opentelemetry/api in peerDependencies at ^1.9.0 |
| API-003 | **PASS** | No vendor-specific SDKs in dependencies |
| API-004 | **PASS** | No SDK-internal imports in src/ (devDependencies only) |
| CDQ-008 | **PASS** | All 12 committed files use `trace.getTracer('commit-story')` consistently |

---

## Committed Files (12)

### 1. collectors/claude-collector.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — collectChatMessages is the sole exported async function and gets a span |
| COV-002 | PASS — no outbound network calls; filesystem reads covered by parent span via propagation |
| COV-003 | PASS — catch block has recordException + setStatus(ERROR) |
| COV-004 | PASS — collectChatMessages is the only exported async function; sync helpers correctly skipped |
| COV-005 | PASS — commit_story.context.sessions_count, messages_count, time_window_start/end set |
| COV-006 | PASS — no auto-instrumentation library covers JSONL file reads; manual span correct |
| RST-001 | PASS — filterMessages, groupBySession, getClaudeProjectsDir etc. all sync, no spans |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS — getClaudeProjectPath, findJSONLFiles, parseJSONLFile are exported sync, skipped per RST-001 |
| RST-005 | PASS |
| SCH-001 | PASS — commit_story.context.collect_chat_messages reported as schema extension; well-formed name |
| SCH-002 | PASS — all setAttribute keys match registry or are reported extensions |
| SCH-003 | PASS — time_window_start/end set via .toISOString() (string); counts are integers |
| CDQ-001 | PASS — span.end() in finally block |
| CDQ-002 | PASS — trace.getTracer('commit-story') matches package.json name |
| CDQ-003 | PASS |
| CDQ-005 | PASS — startActiveSpan callback pattern; async context automatic |
| CDQ-006 | PASS — no expensive computation in setAttribute calls |
| CDQ-007 | PASS — time values called via .toISOString() before setAttribute; no nullable field risks |

**Failures**: None

---

### 2. collectors/git-collector.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-002 | PASS — execFile calls are subprocess executions, not network outbound; covered by parent span |
| COV-003 | PASS — both spans have recordException + setStatus(ERROR) in catch |
| COV-004 | PASS — getPreviousCommitTime and getCommitData are both exported async, both have spans |
| COV-005 | PASS — vcs.ref.head.revision, commit_story.commit.message, commit_story.commit.timestamp set |
| COV-006 | PASS |
| RST-001 | PASS — runGit, getCommitMetadata, getCommitDiff, getMergeInfo all unexported, no spans |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — schema extensions well-formed |
| SCH-002 | PASS |
| SCH-003 | PASS — commit.timestamp.toISOString() (string); commitRef is string |
| CDQ-001 | PASS — span.end() in finally blocks |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — commit.hash and commit_story.commit.author not set unconditionally; timestamp via .toISOString() |

**Failures**: None

---

### 3. commands/summarize.js (3 spans, 4 attributes)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — runDaily, runWeekly, runMonthly each have spans |
| COV-002 | PASS — no outbound network calls |
| COV-003 | PASS — outer catch blocks have recordException + setStatus; inner per-item catches are expected-condition and correctly excluded |
| COV-004 | PASS — all 3 exported async orchestrator functions have spans |
| COV-005 | PASS — input_count, force, generated_count, failed_count captured |
| COV-006 | PASS |
| RST-001 | PASS — isValidDate, parseSummarizeArgs, showSummarizeHelp etc. all sync, no spans |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — span names well-formed schema extensions |
| SCH-002 | PASS |
| SCH-003 | PASS — force set as boolean; counts as integers |
| CDQ-001 | PASS — span.end() in finally blocks |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS |

**Failures**: None

---

### 4. generators/journal-graph.js (4 spans, 3 attempts)

**Notable**: summaryNode instrumented for the first time in any run.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — summaryNode's template literal at original line 27 preserved exactly; wrapping in startActiveSpan callback did not alter content |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — existing error handling structure preserved; try/catch in each node retained; none restructured |
| COV-001 | PASS — generateJournalSections (exported entry point) has span; summaryNode, technicalNode, dialogueNode (exported for testing, make LLM calls) have spans |
| COV-002 | PASS — getModel().invoke() calls covered by @traceloop/instrumentation-langchain auto-instrumentation; no manual re-instrumentation of auto-instrumented calls |
| COV-003 | **FAIL** — summaryNode catch block returns fallback state without any error recording call (no recordException, setStatus, or error-related setAttribute). The span ends via finally with no error status set, making LLM failures invisible in trace data. technicalNode and dialogueNode both have correct recordException + setStatus in their catch blocks; summaryNode is inconsistent. |
| COV-004 | PASS — all 4 exported async LangGraph functions have spans |
| COV-005 | PASS — gen_ai.operation.name, gen_ai.request.temperature, ai.section_type set per node; usage_metadata guarded with != null |
| COV-006 | PASS — manual spans placed at node function level (application logic), not on model.invoke() (auto-instrumented); correct layering |
| RST-001 | PASS — all sync helpers (analyzeCommitContent, formatSessionsForAI, clean* functions etc.) have no spans |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS — buildGraph, getGraph are unexported sync, no spans; getModel, resetModel are sync accessors |
| RST-005 | PASS |
| SCH-001 | PASS — 4 schema extension span names well-formed |
| SCH-002 | PASS — gen_ai.* attrs are registered; commit_story.* attrs registered or reported as extensions |
| SCH-003 | PASS — temperatures are numbers; gen_ai.response.id and usage_metadata attrs guarded with != null before setAttribute |
| CDQ-001 | PASS — all 4 spans close via finally block |
| CDQ-002 | PASS |
| CDQ-003 | **FAIL** — summaryNode catch block is missing span.recordException(error) + span.setStatus({ code: SpanStatusCode.ERROR }). technicalNode and dialogueNode both add these correctly in their catch blocks; summaryNode does not. The agent notes state "span.recordException and span.setStatus(ERROR) are still added because the error is a genuine failure" but this is only true for technicalNode and dialogueNode — summaryNode's implementation contradicts the agent's own stated intent. |
| CDQ-005 | PASS — startActiveSpan callback pattern used throughout |
| CDQ-006 | PASS — no expensive computation in setAttribute; maxQuotes is O(1) arithmetic |
| CDQ-007 | PASS — result.usage_metadata != null guard before gen_ai.usage.* attrs; result.id != null guard before gen_ai.response.id |

**Failures**: COV-003 (summaryNode error recording absent), CDQ-003 (summaryNode missing recordException + setStatus)

---

### 5. generators/summary-graph.js (6 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — generateDailySummary, generateWeeklySummary, generateMonthlySummary (exported entry points) have spans |
| COV-002 | PASS — model.invoke() covered by auto-instrumentation |
| COV-003 | PASS — inner catch blocks have recordException + setStatus(ERROR) in all 3 node functions and all 3 generate* functions |
| COV-004 | PASS — all 6 exported async functions have spans |
| COV-005 | PASS — entry_date, input_count, gen_ai.* attrs, gen_ai.response.id, usage_metadata all set |
| COV-006 | PASS — manual spans on node functions and generate* entry points, not on model.invoke() |
| RST-001 | PASS — all format/clean helpers are sync, no spans |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS — buildGraph, getGraph, parseSummarySections are unexported, no spans |
| RST-005 | PASS |
| SCH-001 | PASS — 6 schema extension span names well-formed, use commit_story.summary.* prefix to avoid collision with existing names |
| SCH-002 | PASS |
| SCH-003 | PASS — gen_ai.request.model is string; temperature is number; counts are integers; nullable attrs guarded with != null |
| CDQ-001 | PASS — all 6 spans close via finally block |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — date != null guard; entries != null ? entries.length : 0 guard; result.id != null and result.usage_metadata != null guards |

**Failures**: None. This file was rolled back at checkpoint 1 in run-13 due to null guard failure; the != null fix (issue #435) resolved it.

---

### 6. integrators/context-integrator.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — gatherContextForCommit is the primary service entry point |
| COV-002 | PASS — no outbound network calls; internal function calls covered by context propagation |
| COV-003 | PASS |
| COV-004 | PASS — gatherContextForCommit is the only exported async function |
| COV-005 | PASS — vcs.ref.head.revision, time_window_start/end, messages_count, sessions_count, filter.messages_before/after all set |
| COV-006 | PASS |
| RST-001 | PASS — formatContextForPrompt, getContextSummary are sync, no spans |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS — all 7 attrs are registered; attributesCreated = 0 |
| SCH-003 | PASS — Date objects converted via .toISOString(); counts are integers |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — CDQ-007 PII fields (author, authorEmail) explicitly excluded |

**Failures**: None

---

### 7. managers/auto-summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — per-iteration catches (collect failures into result) are expected-condition and preserved without recordException; outer catch handles unexpected failures with recordException |
| COV-001 | PASS — triggerAutoSummaries, triggerAutoWeekly, triggerAutoMonthly have spans |
| COV-002 | PASS — internal delegation to generate* functions; covered by context propagation |
| COV-003 | PASS — outer catch blocks have recordException + setStatus |
| COV-004 | PASS — all 3 exported async functions have spans |
| COV-005 | PASS — input_count, generated_count, failed_count captured; all are registered schema attrs |
| COV-006 | PASS |
| RST-001 | PASS — getErrorMessage is sync 3-line helper, no span |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS — span names invented correctly to avoid collision with existing commit_story.summarize.run_* names |
| SCH-002 | PASS — reuses registered summarize.* attrs; attributesCreated = 0 |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS |

**Failures**: None

---

### 8. managers/journal-manager.js (2 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — import line (`import { join } from 'node:path'`) preserved; basename not imported to avoid touching import line |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — inner ENOENT-style catches (empty catch body, control-flow) preserved without modification; outer spans wrap correctly |
| COV-001 | PASS — saveJournalEntry and discoverReflections are the 2 exported async functions; both have spans |
| COV-002 | PASS — no outbound network calls |
| COV-003 | PASS — outer catch blocks have recordException + setStatus; inner catch (duplicate-check ENOENT) is expected-condition and correctly excluded |
| COV-004 | PASS — both exported async functions have spans |
| COV-005 | PASS — commit.timestamp via new Date(commit.timestamp).toISOString(), file_path via split('/').pop(), quotes_count set |
| COV-006 | PASS |
| RST-001 | PASS — all sync helpers (formatTimestamp, formatJournalEntry, parseReflectionEntry etc.) have no spans |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS — new Date(commit.timestamp).toISOString() produces string; filesChanged is integer |
| CDQ-001 | PASS — span.end() in finally blocks |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — commit.hash guarded with != null before setAttribute; commit.filesChanged guarded with != null; Date/string type-safety fix (new Date(commit.timestamp).toISOString()) prevents split() TypeError |

**Failures**: None. CDQ-007 fail from run-12 resolved; Date/string TypeError from run-13 resolved.

---

### 9. managers/summary-manager.js (3 spans, 2 attributes, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — inner access() catches (duplicate-detection guard) are expected-condition and preserved without recordException |
| COV-001 | PASS — 3 pipeline orchestrators have spans |
| COV-002 | PASS — internal calls to generate* functions covered by context propagation |
| COV-003 | PASS — outer catch blocks have recordException + setStatus(ERROR) |
| COV-004 | **FAIL** — 6 exported async I/O functions have no spans: readDayEntries, saveDailySummary, readWeekDailySummaries, saveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary. All are exported, async, and perform filesystem I/O. The agent's reasoning ("stay within ~20% ratio backstop; I/O is covered through context propagation") does not satisfy COV-004: the ratio backstop is a restraint heuristic (RST), not a COV-004 exemption. Context propagation visibility is different from having individual spans. This is the same failure as run-12. |
| COV-005 | PASS — week_label, month_label, entry_date, force, input_count set |
| COV-006 | PASS |
| RST-001 | PASS — all format/clean helpers and getWeekBoundaries, getMonthBoundaries are sync, no spans |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS — buildGraph, getGraph variants are unexported, no spans |
| RST-005 | PASS |
| SCH-001 | PASS — new span names use generate_and_save_* prefix to avoid collision; well-formed |
| SCH-002 | PASS — week_label and month_label are new schema extensions; all other attrs registered |
| SCH-003 | PASS — week_label and month_label are strings; force as boolean; input_count as integer |
| CDQ-001 | PASS — span.end() in finally blocks for all 3 spans |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS |

**Failures**: COV-004 — 6 exported async I/O functions without spans (same failure as run-12)

---

### 10. mcp/server.js (1 span, 2 attributes)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — main() gets a root span per COV-001 (entry point override on RST-004 for process entry points) |
| COV-002 | PASS — no outbound network calls; MCP protocol messages covered by @traceloop/instrumentation-mcp |
| COV-003 | PASS |
| COV-004 | PASS — main() is the only async function; createServer() is sync |
| COV-005 | PASS — commit_story.mcp.server.name and commit_story.mcp.server.version capture server identity |
| COV-006 | PASS — manual span on main() provides application-level root for auto-instrumented MCP protocol children |
| RST-001 | PASS — createServer() is sync, no span |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS — main() correctly gets a span despite being unexported (COV-001 overrides RST-004 for process entry points) |
| RST-005 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS — commit_story.mcp.server.name and .version are new schema extensions |
| SCH-003 | PASS — server name and version are strings |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS |

**Failures**: None

---

### 11. utils/journal-paths.js (1 span, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — import line preserved; basename not imported to avoid modifying it; filePath attribute used directly without basename |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — ensureDirectory is the sole async I/O function and gets a span |
| COV-002 | PASS — mkdir is filesystem I/O, not network outbound |
| COV-003 | PASS |
| COV-004 | PASS — ensureDirectory is the only exported async function |
| COV-005 | PASS — commit_story.journal.file_path captures the directory path argument |
| COV-006 | PASS |
| RST-001 | PASS — all 11 other exports are pure sync date/path formatters, no spans |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS — filePath is string |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS |

**Failures**: None. 3 attempts consistent with runs 12–13; NDS-003 conflict on import line resolved by not importing basename.

---

### 12. utils/summary-detector.js (5 spans, 5 attributes, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — early-return guards (single-line if statements) preserved exactly; no attribute set on early-return paths |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — inner ENOENT-style catches return 0 gracefully; no error recording added (expected-condition) |
| COV-001 | PASS — 5 exported async functions have spans |
| COV-002 | PASS — no network outbound calls |
| COV-003 | PASS — outer catch blocks handle unexpected errors with recordException + setStatus where applicable |
| COV-004 | PASS — all 5 exported async functions have spans; unexported helpers (getSummarizedDays etc.) covered by context propagation |
| COV-005 | PASS — 5 new count attributes (entry_days_count, unsummarized_days_count, daily_summary_days_count, unsummarized_weeks_count, unsummarized_months_count) set |
| COV-006 | PASS |
| RST-001 | PASS — getTodayString, getNowDate are sync, no spans |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS — getSummarizedDays, getSummarizedWeeks, getSummarizedMonths, getWeeksWithWeeklySummaries are unexported async helpers; RST-004 exemption applies (unexported I/O), no spans required |
| RST-005 | PASS |
| SCH-001 | PASS — 5 new span names well-formed schema extensions |
| SCH-002 | PASS — 5 new count attributes are schema extensions |
| SCH-003 | PASS — all count attributes are integers |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — inner ENOENT catch sets attribute to 0 (defined value, not undefined) on early-return path |

**Failures**: None

---

## Correct Skips (18)

| File | Skip Reason |
|------|------------|
| generators/prompts/guidelines/accessibility.js | Module-level constant only, no functions |
| generators/prompts/guidelines/anti-hallucination.js | Module-level constant only, no functions |
| generators/prompts/guidelines/index.js | Synchronous only (getAllGuidelines) |
| generators/prompts/sections/daily-summary-prompt.js | Synchronous only |
| generators/prompts/sections/dialogue-prompt.js | Module-level constant only, no functions |
| generators/prompts/sections/monthly-summary-prompt.js | Synchronous only |
| generators/prompts/sections/summary-prompt.js | Synchronous only |
| generators/prompts/sections/technical-decisions-prompt.js | Module-level constant only, no functions |
| generators/prompts/sections/weekly-summary-prompt.js | Synchronous only |
| index.js | 0 spans — CDQ-001 block: main() and handleSummarize() both call process.exit() on every code path; span cannot be closed in finally. Correct agent reasoning. Structural gap in target app, not agent failure. |
| integrators/filters/message-filter.js | Synchronous only |
| integrators/filters/sensitive-filter.js | Synchronous only |
| integrators/filters/token-filter.js | Synchronous only |
| mcp/tools/context-capture-tool.js | Exported function (registerContextCaptureTool) is sync; internal saveContext is unexported async (RST-004 exemption applies) |
| mcp/tools/reflection-tool.js | Exported function (registerReflectionTool) is sync; internal saveReflection is unexported async (RST-004 exemption applies) |
| traceloop-init.js | Module-level init only; is itself the instrumentation bootstrap — adding spans would be circular |
| utils/commit-analyzer.js | Synchronous only |
| utils/config.js | Module-level init only, no functions |

---

## Quality Failures Summary

| File | Rule | Dimension | Severity |
|------|------|-----------|----------|
| generators/journal-graph.js | COV-003 | Coverage | Important — summaryNode catch has no error recording; LLM failures invisible in trace |
| generators/journal-graph.js | CDQ-003 | Code Quality | Important — summaryNode catch missing recordException + setStatus (inconsistent with technicalNode and dialogueNode in same file) |
| managers/summary-manager.js | COV-004 | Coverage | Normal — 6 exported async I/O functions without spans (same failure as run-12) |

**Total canonical failures**: 3 (COV-003, CDQ-003, COV-004)
