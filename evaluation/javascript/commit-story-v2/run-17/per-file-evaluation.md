# Per-File Evaluation — Run-17

**Date**: 2026-05-12
**Branch**: spiny-orb/instrument-1778585670273
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/69
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 30 (10 committed + 1 partial + 4 failed + 15 correct skips)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check` exits 0 on all 10 committed files |
| NDS-002 (Tests) | **PASS** | 564 tests pass, 1 skipped (acceptance gate, no API key) |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api` in peerDependencies at `^1.9.0` |
| API-003 | **PASS** | No vendor-specific OTel SDKs in production dependencies |
| API-004 | **PASS** | No SDK-internal imports in committed src/ files |
| CDQ-008 | **PASS** | All committed files use `trace.getTracer('commit-story')` consistently |

---

## Committed Files (10)


### 1. collectors/claude-collector.js (1 span, 0 attributes, 2 attempts)

The file exports eight functions: one async (`collectChatMessages`) and seven sync helpers (`getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `parseJSONLFile`, `filterMessages`, `groupBySession`). The committed instrumentation wraps `collectChatMessages` with a single span, correctly skipping all sync helpers per RST-001.

The run summary reports "0 attributes" because the attribute counter tracks new schema extension attributes only. The committed code does call `span.setAttribute` five times — `commit_story.context.source`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.sessions_count`, and `commit_story.context.messages_count` — but all five are registered schema keys, not new extensions, consistent with the zero count.

Compared to run-16, the run-17 instrumentation adds three new attribute calls: `source`, `time_window_start`, and `time_window_end`. It also moves `sessions_count` and `messages_count` from the early-return path only to both the early-return and normal-execution paths (with unnecessary `!= null` guards on the normal path). This is a net coverage improvement. The span name changed from run-16's `commit_story.context.collect_chat_messages` to `commit_story.context.collect_messages` — a minor rename within the same namespace, both valid schema extensions.

The first attempt introduced NDS-003 errors (6 blocking errors per the instrumentation report). Attempt 2 resolved them. The committed output is clean.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no non-instrumentation lines altered; original business logic preserved verbatim inside the span wrapper |
| NDS-004 | PASS — the parameter list is unchanged (repoPath, commitTime, previousCommitTime); the agent expanded the single-line signature to a 4-line form, but no parameter names or types were modified; the API contract is unaltered |
| NDS-005 | PASS — the original `collectChatMessages` had no try/catch; the instrumented version adds one that always rethrows (COV-003 outer error recording pattern), which does not remove any original error handling |
| NDS-006 | PASS — all original comments preserved; no inline comments removed |
| NDS-007 | PASS — the outer catch block in the instrumented version records the exception and rethrows unconditionally; it is not a graceful-degradation path and does not swallow errors |
| COV-001 | PASS — `collectChatMessages` (exported async) has a span; it is the only exported async function |
| COV-002 | N/A — no outbound HTTP or database calls |
| API-001 | PASS — only `@opentelemetry/api` imported (`trace`, `SpanStatusCode`) |
| API-004 | PASS — no SDK-internal imports |
| SCH-001 | PASS — span name `commit_story.context.collect_messages` follows the `commit_story.*` naming convention and is declared as a schema extension per the run log; it is semantically distinct from `commit_story.context.gather_for_commit` (the context-integrator span, which covers full multi-source orchestration) |
| SCH-002 | PASS — all five attributes are registered schema keys: `commit_story.context.source` (registered enum), `commit_story.context.time_window_start` (registered string), `commit_story.context.time_window_end` (registered string), `commit_story.context.sessions_count` (registered int), `commit_story.context.messages_count` (registered int); no unregistered keys used |
| SCH-003 | PASS — `sessions_count` set from `sessions.size` (int); `messages_count` set from `allMessages.length` (int); `time_window_start/end` set via `.toISOString()` (string); `source` set as the string literal `'claude_code'` matching the registered enum member |
| CDQ-001 | PASS — span closed in `finally { span.end(); }`, covering all paths including the early null-projectPath return and the error catch branch |
| CDQ-005 | PASS — `startActiveSpan` used with an async callback; no duplicate `span.end()` calls |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` matches the canonical tracer name |
| COV-004 | PASS — `collectChatMessages` is the only exported async function; all seven sync helpers are correctly skipped per RST-001 |
| COV-003 | PASS — outer catch block calls `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error`; all three components of the COV-003 pattern are present |
| COV-005 | PASS — five domain attributes set: `source` captures the data origin, `time_window_start/end` bound the collection window, `sessions_count` and `messages_count` describe the collected data volume; the early-return null path correctly sets `sessions_count: 0` and `messages_count: 0` |
| RST-001 | PASS — all seven sync helpers skipped; none have spans |
| RST-004 | PASS — no spans on unexported helpers |
| CDQ-007 | PASS — `sessions` is assigned from `groupBySession(allMessages)` which always returns a `new Map()`; `allMessages` is initialized to `[]`; neither is ever null at the `setAttribute` call sites; the `!= null` guards are unnecessary but harmless and produce no undefined attribute values |

**Failures**: None

---

### 2. collectors/git-collector.js (1 span, 0 attributes, 3 attempts)

The file exports two async functions: `getPreviousCommitTime` and `getCommitData`. Four unexported async helpers also exist: `runGit`, `getCommitMetadata`, `getCommitDiff`, and `getMergeInfo`. The committed instrumentation wraps only `getPreviousCommitTime`; `getCommitData` has no span.

The agent notes describe an ambitious first-pass plan — spans on all four unexported helpers (with new schema extensions `commit_story.git.subcommand` and `commit_story.commit.parent_count`) plus both exported functions. The validator rejected that attempt (and a second), and the function-level fallback recovered only `getPreviousCommitTime`. The agent notes' references to helper-span reasoning and new attribute extensions describe an abandoned attempt, not the committed output.

The run summary reports "0 attributes" because the attribute counter tracks new schema extension attributes only. The committed code does call `span.setAttribute` twice: once for `vcs.ref.head.revision` (the `commitRef` input parameter) and once for `commit_story.commit.timestamp` (the raw ISO timestamp string). Both are registered schema keys, not new extensions — consistent with the zero count.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no structural changes to original code; only `getPreviousCommitTime` received span wrapping; all other functions are byte-for-byte unchanged |
| NDS-004 | PASS — no function signatures altered |
| NDS-005 | PASS — no try/catch blocks removed; `runGit`'s existing try/catch is untouched; the new span wrapper in `getPreviousCommitTime` adds its own catch that records and rethrows |
| NDS-006 | PASS — no comments removed; inline comments on `runGit`'s git args array preserved |
| NDS-007 | PASS — no catch blocks in `getPreviousCommitTime` perform graceful-degradation; the single catch records the exception and rethrows, consistent with NDS-007 |
| COV-001 | **FAIL** — `getCommitData` is exported and async and has no span. It is the primary orchestrator for commit data collection (calls `getCommitMetadata`, `getCommitDiff`, and `getMergeInfo` in parallel via `Promise.all`) and produces the `CommitData` return type consumed throughout the application. COV-001 requires all exported async functions to have an entry-point span. |
| COV-002 | N/A — no outbound HTTP or database calls |
| API-001 | PASS — `@opentelemetry/api` imported; `trace` and `SpanStatusCode` used correctly |
| API-004 | PASS — no SDK-internal imports |
| SCH-001 | PASS — span name `commit_story.commit.get_previous_commit_time` declared as a schema extension per run log |
| SCH-002 | PASS — `vcs.ref.head.revision` is a registered OTel VCS ref; `commit_story.commit.timestamp` is a registered custom attribute (type: string, ISO 8601) |
| SCH-003 | PASS — `commit_story.commit.timestamp` set from `timestamps[1]` which is a raw ISO string from git's `%aI` format; string type matches schema declaration |
| CDQ-001 | PASS — span closed in `finally` block within `startActiveSpan` callback |
| CDQ-005 | PASS — no duplicate span.end() calls |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` matches canonical tracer name |
| COV-004 | **FAIL** — `getCommitData` (exported async) has no span. The function-level fallback that recovered `getPreviousCommitTime` did not include `getCommitData`. COV-004 requires every exported async function to have a span. |
| COV-005 | PASS — `vcs.ref.head.revision` captures the `commitRef` input; `commit_story.commit.timestamp` captures the resolved timestamp. The commitRef value may be 'HEAD' (the default), not a resolved SHA — this is a minor semantic gap but SCH-002 passes because `vcs.ref.head.revision` is defined as "the full commit SHA hash" in the schema. The input parameter is typically a SHA or ref string, so using it is defensible. No FAIL warranted. |
| RST-001 | PASS — `runGit`, `getCommitMetadata`, `getCommitDiff`, and `getMergeInfo` are unexported; the committed file correctly skips all four per RST-001 (unexported sync/async helpers exempt when not at an I/O boundary the exported API exposes directly) |
| RST-004 | PASS — unexported helper skipping is consistent with RST-004 |
| CDQ-007 | PASS — `vcs.ref.head.revision` receives `commitRef` (a string parameter, never null); `commit_story.commit.timestamp` is set only after a `timestamps.length < 2` early return that guards the null path; no nullable property access reaches setAttribute |

**Canonical failures**: COV-001 and COV-004 — `getCommitData` (exported async) has no span due to function-level fallback regression

**Note on 3 attempts**: The first attempt targeted all four unexported helpers plus both exported functions with five or more spans and two new schema extension attributes (`commit_story.git.subcommand` on `runGit`, `commit_story.commit.parent_count` on `getMergeInfo`). Validator failures on those attempts — likely NDS-003 or schema validation errors from unregistered attribute keys — caused successive retries. The function-level fallback on attempt 3 recovered only `getPreviousCommitTime`, leaving `getCommitData` uninstrumented. The agent notes' reasoning about helper spans reflects the discarded plan, not the committed output.

**Regression from run-16**: Run-16 also committed 1 span with `getPreviousCommitTime` only (COV-004 note: "exported async functions have spans"), but the run-16 COV-004 entry was recorded as PASS with the note "exported async functions have spans." Re-examining: run-16's agent notes stated "Function-level fallback: 1/1 functions instrumented: getPreviousCommitTime" and the COV-004 entry read PASS. That was an error in the run-16 evaluation — `getCommitData` was also uninstrumented in run-16. The run-17 evaluation corrects this: COV-004 is a FAIL when `getCommitData` has no span.

---

### generators/summary-graph.js (6 spans, 4 attributes, 2 attempts)

**Structure**: Three parallel LangGraph pipelines (daily / weekly / monthly), each with two instrumented entry points: a LangGraph node function (`dailySummaryNode`, `weeklySummaryNode`, `monthlySummaryNode`) and a public API function that invokes the compiled graph (`generateDailySummary`, `generateWeeklySummary`, `generateMonthlySummary`). Six exported async functions total, all instrumented. Twelve sync helpers and formatters correctly skipped.

**Context on attempt 2**: Attempt 1 produced 47 blocking failures — 42 NDS-003 and 5 SCH-002. The NDS-003 failures were the same root cause as journal-graph's 49 failures this run: the agent collapsed multi-line BANNED_WORD_REPLACEMENTS entries and parseMonthlySummarySections onto fewer lines. Unlike journal-graph, summary-graph recovered on attempt 2 by restoring the original multi-line formatting. Attempt 2 left 3 NDS-003 errors that were resolved by the function-level fallback (attempt 3 per the instrumentation report, counted as "2 attempts" in the run output).

| Rule | Result |
|------|--------|
| NDS-003 | PASS — BANNED_WORD_REPLACEMENTS multi-line format and parseMonthlySummarySections multi-line guard restored on attempt 2; committed file preserves original line structure |
| NDS-004 | PASS — no multi-line parameter signatures modified |
| NDS-005 | PASS — all try/catch blocks preserved; inner graceful-degradation catches in each *Node function intact |
| NDS-006 | PASS — no imports removed or reordered |
| NDS-007 | PASS — inner catches in dailySummaryNode, weeklySummaryNode, monthlySummaryNode are all all-encompassing graceful-degradation (catch all, return fallback, no rethrow); no recordException added to inner catches; outer span-level catches handle unexpected exceptions and correctly call span.recordException + setStatus(ERROR) + throw |
| COV-001 | PASS — all 6 exported async functions have spans: dailySummaryNode, generateDailySummary, weeklySummaryNode, generateWeeklySummary, monthlySummaryNode, generateMonthlySummary |
| COV-002 | N/A — no outbound HTTP or database calls |
| COV-004 | PASS — 6 exported async entry points instrumented; getModel and resetModel are exported but synchronous (RST-001 applies); formatEntriesForSummary, formatDailySummariesForWeekly, formatWeeklySummariesForMonthly, cleanDailySummaryOutput, cleanWeeklySummaryOutput, cleanMonthlySummaryOutput are exported sync helpers (RST-001 applies) |
| COV-005 | PASS — meaningful attributes captured on each span: section type, temperature, entry counts, date labels |
| COV-006 | PASS — all three *Node functions call getModel().invoke() which is auto-instrumented by LangChain; manual startActiveSpan wrappers are placed at the node function boundary above the auto-instrumented model invocation; no double-instrumentation of the model call itself |
| API-001 | PASS — trace.getTracer and SpanStatusCode imported from @opentelemetry/api; no SDK imports |
| API-004 | PASS — no SDK-internal imports in src/ |
| RST-001 | PASS — all sync functions (parseSummarySections, parseWeeklySummarySections, parseMonthlySummarySections, buildGraph, getGraph, buildWeeklyGraph, getWeeklyGraph, buildMonthlyGraph, getMonthlyGraph, all format/clean helpers) correctly receive 0 spans |
| RST-004 | PASS — no unexported async functions in this file; all unexported functions are synchronous |
| SCH-001 | PASS — 6 span names declared as schema extensions; agent note correctly distinguishes *_node spans (LangGraph node execution, wrapping the model.invoke() call) from generate_* spans (public API entry point invoking the full compiled graph pipeline) |
| SCH-002 | **FAIL** — two registered attribute keys are semantically misused: (1) `commit_story.context.messages_count` is defined as "Total number of messages collected from sessions" but is set to `entries.length` in `dailySummaryNode` — entries are journal entries, not session messages; (2) `commit_story.journal.quotes_count` is defined as "Number of developer quotes extracted for the entry" but is set to `entries.length` in `generateDailySummary` — again journal entries, not developer quotes. Both reuse registered keys whose defined semantics do not match the values being recorded. The 4 schema extension attributes (`daily_summaries_count`, `week_label`, `weekly_summaries_count`, `month_label`) are correctly declared as new extensions. |
| SCH-003 | PASS — entries.length and dailySummaries.length are int; week_label and month_label are strings; entry_date set as string via String(date) coercion |
| CDQ-001 | PASS — all spans closed via startActiveSpan callback pattern with finally { span.end() } |
| CDQ-005 | PASS — no hardcoded process/environment values; attribute values derived from function arguments |
| CDQ-011 | PASS — all spans use trace.getTracer('commit-story') via the module-level tracer constant |
| CDQ-007 | PASS — null guards present before .length calls on potentially-null arrays (dailySummaries != null, weeklySummaries != null, entries != null); generateDailySummary and generateWeeklySummary access .length unconditionally but both receive arrays by JSDoc contract (string[] and Array<{...}>) |

**Failures**: SCH-002 — `commit_story.context.messages_count` used for journal entries count in dailySummaryNode (schema definition: session messages count); `commit_story.journal.quotes_count` used for entries array length in generateDailySummary (schema definition: developer quotes extracted). Both keys have registered definitions that do not match the values recorded.

**Notes**:
- The NDS-003 multi-line collapse issue is the same root cause that caused journal-graph to fail this run with 49 violations. summary-graph recovered where journal-graph did not because the subsequent context window successfully diagnosed and fixed the formatting on attempt 2.
- COV-006 handling is correct: the *Node span wrappers sit at the LangGraph node boundary, wrapping the entire node function body including the inner try that calls model.invoke(). The auto-instrumented LangChain layer creates child spans beneath the node span.
- The SCH-002 reuse of context.messages_count and journal.quotes_count appears to be the agent avoiding new schema extensions by reaching for the closest-sounding registered key. The fix is two new schema extension attributes: `commit_story.journal.entries_count` (int, count of journal entries being summarized) for both daily uses, keeping the weekly/monthly counts as the correctly-declared extensions already in place.

---

### 4. integrators/context-integrator.js (1 span, 0 new attributes, 2 attempts)

**Run log summary**: 1 span, 0 attributes, 2 attempts. "0 attributes" means 0 *new* schema extensions created — all seven attribute keys used (`vcs.ref.head.revision`, `commit_story.filter.messages_before`, `commit_story.filter.messages_after`, `commit_story.context.messages_count`, `commit_story.context.sessions_count`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`) were already registered. The committed file contains multiple `setAttribute` calls.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no original lines missing or modified; import block reformatted to multi-line style consistent with existing ESM conventions; blank line within `formatContextForPrompt` preserved |
| NDS-004 | PASS — multi-line destructuring in `gatherContextForCommit` parameter block preserved exactly |
| NDS-005 | PASS — no try/catch blocks existed in the original; the committed file adds one outer try/catch/finally for span lifecycle management, which is additive |
| NDS-006 | PASS |
| NDS-007 | PASS — the single catch block added by the agent is the standard outer error-recording wrapper (`span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error`); no graceful-degradation catch omission issue present |
| API-001 | PASS — `trace` and `SpanStatusCode` imported from `@opentelemetry/api`; no SDK or vendor imports |
| COV-001 | PASS — `gatherContextForCommit` (exported async entry point) has a span |
| COV-002 | N/A — no outbound HTTP or database calls |
| COV-003 | PASS — outer catch block contains `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error`; error rethrown correctly |
| COV-004 | PASS — `gatherContextForCommit` is the only exported async function; `formatContextForPrompt` and `getContextSummary` are exported but purely synchronous, skipped per RST-001 |
| COV-005 | PASS — seven attributes set: `vcs.ref.head.revision` (commitRef parameter), `commit_story.filter.messages_before`/`messages_after` (filter stats), `commit_story.context.messages_count`, `commit_story.context.sessions_count`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`; covers git ref, filter pipeline, message/session volumes, and time window |
| RST-001 | PASS — `formatContextForPrompt` and `getContextSummary` are synchronous data transformations with no I/O; correctly skipped |
| RST-004 | PASS — all uninstrumented functions are either synchronous or unexported helpers handled by RST-001/RST-004 exemptions |
| SCH-001 | PASS — span name `commit_story.context.gather_for_commit` registered as a new schema extension; agent notes distinguish this from `commit_story.context.collect_messages` (claude-collector layer), correctly identifying the two spans as covering distinct operations |
| SCH-002 | PASS — all seven attribute keys are registered schema entries; `attributesCreated` is 0 per agent notes |
| SCH-003 | PASS — `time_window_start` and `time_window_end` set via `.toISOString()` (string type, matches `type: string` in schema); `messages_count`, `sessions_count`, `messages_before`, `messages_after` are integer counts; `vcs.ref.head.revision` is a string (commitRef parameter) |
| CDQ-001 | PASS — span uses `startActiveSpan` callback; `span.end()` in `finally` block ensures lifecycle is always closed |
| CDQ-005 | PASS — `startActiveSpan` used, not `startSpan` |
| CDQ-007 | PASS — three conditional guards present: `if (filterStats != null)` before setting `messages_before`/`messages_after`; `if (filteredMessages != null)` before setting `messages_count`; `if (filteredSessions != null)` before setting `sessions_count`. `vcs.ref.head.revision` is set from `commitRef` parameter (string, guaranteed non-null by default parameter `= 'HEAD'`). `time_window_start`/`time_window_end` accessed via `context.metadata.timeWindow.start/end` after `context` is constructed — the object is assembled locally within the span and the fields are always set (either `previousCommitTime` or `new Date(...)` fallback) |
| CDQ-009 | NOT APPLICABLE — no `!== undefined` guards around setAttribute |
| CDQ-010 | NOT APPLICABLE — no string method calls on property accesses in setAttribute arguments |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` at module level |

**Failures**: None

**Notes**:

The run log's "0 attributes" header is not a signal of sparse instrumentation — it reflects that the agent reused seven pre-existing schema keys without creating new extensions. This is a quality indicator: the agent found appropriate registered attributes for all the signals it wanted to record rather than inventing new ones.

The CDQ-007 guards on `filterStats`, `filteredMessages`, and `filteredSessions` address a genuine nullable risk: `filterMessages` returns `{ messages, stats }` and while the destructured values are normally populated, the `!= null` guards protect against edge cases where the filter pipeline returns unexpected nulls. This is the correct approach per run-16's CDQ-007 pattern for guards that are necessary at the call boundary.

The `time_window_start` and `time_window_end` attributes are set from `context.metadata.timeWindow.start/end` after the context object is fully assembled locally. Because the `timeWindow` object is constructed within the same function scope (not from an external source), the risk of null access is low — the `start` field is always assigned either `previousCommitTime` (which is truthy at that point) or `new Date(...)`. No guard is needed here; the code path guarantees a Date value.

The file is a clean carry-forward from run-16. The committed code is structurally identical to run-16's version, and the run-16 per-file evaluation for this file had no failures. The 2-attempt count reflects normal agent iteration, not a quality concern.

---

### 20. mcp/server.js (1 span, 1 attribute, 1 attempt)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — process.exit(1) lives only in the outer `.catch()` handler outside main(); RST-006 does not apply (no process.exit inside the instrumented function body); the catch block inside `startActiveSpan` records and rethrows, which is the correct NDS-007 error-propagation pattern |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` only; no SDK imports |
| COV-001 | PASS — main() is the async process entry point; COV-001 requires entry-point spans regardless of export status; RST-004 unexported-function exemption is overridden by COV-001 for entry points |
| COV-002 | N/A — no outbound HTTP, database, or RPC calls |
| COV-004 | PASS — main() is the only async function; createServer is synchronous |
| COV-005 | PASS — `commit_story.mcp.transport` set to `'stdio'` on the entry-point span; satisfies the requirement that every span carries at least one domain attribute |
| RST-001 | PASS — createServer is a synchronous factory function; correctly skipped |
| RST-004 | PASS — createServer is also unexported; RST-004 and RST-001 both apply and both confirm the skip |
| SCH-001 | PASS — `commit_story.mcp.server.start` declared as a span extension in `semconv/agent-extensions.yaml`; follows `commit_story.<domain>.<operation>` naming convention; no semantic duplicate exists in `attributes.yaml` (nearest registered spans cover journal generation and context collection, which are distinct operation classes) |
| SCH-002 | PASS — `commit_story.mcp.transport` declared as an attribute extension in `semconv/agent-extensions.yaml`; no registered attribute in `attributes.yaml` covers MCP server transport type (`commit_story.context.source` has an `mcp` member but describes context-collection source, not server transport configuration) |
| SCH-003 | PASS — transport value is the hardcoded string literal `'stdio'`; registered type is `string`; no type mismatch |
| CDQ-001 | PASS — span lifecycle managed via `startActiveSpan` callback; `span.end()` called in `finally` block inside the callback; explicit end is not redundant here because the span is not auto-ended by the callback on throw (the catch re-throws, so `finally` is the correct end site) |
| CDQ-005 | PASS — `startActiveSpan` used (not `startSpan`); span is active for the duration of main() |
| CDQ-007 | PASS — transport attribute is a hardcoded string constant; no property access on potentially nullable objects |
| CDQ-009 | NOT APPLICABLE — no `!== undefined` guards around setAttribute calls |
| CDQ-010 | NOT APPLICABLE — no string-method calls on property accesses in setAttribute arguments |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` at module level; canonical tracer name consistent with all other committed files |

**Failures**: None

**Notes**:

The agent correctly identified that main() is an async process entry point despite being unexported, and applied the COV-001 override over RST-004. The span name `commit_story.mcp.server.start` and the attribute `commit_story.mcp.transport` are both new schema extensions, correctly registered in `semconv/agent-extensions.yaml` before use.

The choice of `commit_story.mcp.transport` as the domain attribute is reasonable: no registered attribute captures MCP server transport type, and `commit_story.context.source` (which has an `mcp` enum member) is semantically distinct — it describes context-collection source, not server startup configuration. The hardcoded value `'stdio'` is correct because the server uses `StdioServerTransport` unconditionally; there is no runtime variable to read.

The NDS-007 pattern is correct: the inner catch records the exception and rethrows it; the outer `.catch()` at the call site handles the terminal failure with `process.exit(1)`. Span closes in `finally` before the rethrow propagates, so the span lifecycle is clean.

This file has been a consistent 1-attempt success since run-12 (1 span, 2 attempts) and run-16 (1 span, 1 attempt). Run-17 matches run-16's 1-attempt profile. The SCH-004 advisory from run-16 (false positive claiming `commit_story.mcp.server_name` duplicated `gen_ai.provider.name`) is not present in run-17 — the span name changed from `commit_story.mcp.start` (run-16) to `commit_story.mcp.server.start` (run-17), and the attribute changed from `commit_story.mcp.server_name`/`server_version` pair (run-12) to the single `commit_story.mcp.transport` attribute (run-16 and run-17). The attribute reduction from two to one is a deliberate simplification that persists across runs.

---

### 24. utils/journal-paths.js (1 span, 0 attributes, 1 attempt)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — no catch blocks in ensureDirectory in the original; the instrumented version adds an outer catch solely for span error recording (recordException + setStatus ERROR + rethrow), which is the correct NDS-007 pattern for an unexpected-error catch |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` only; no SDK imports |
| COV-001 | PASS — ensureDirectory (exported async) has span `commit_story.journal.ensure_directory` |
| COV-003 | PASS — outer catch has `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error` before `finally { span.end() }` |
| COV-004 | PASS — ensureDirectory is the only exported async function; all 11 remaining functions (getYearMonth, getDateString, getJournalEntryPath, getReflectionPath, getContextPath, getReflectionsDirectory, parseDateFromFilename, getJournalRoot, getISOWeekString, getSummaryPath, getSummariesDirectory) are pure synchronous utilities correctly skipped per RST-001 |
| COV-005 | PASS — `commit_story.journal.file_path` set from `filePath` parameter; `file_path` is a registered schema attribute under `registry.commit_story.journal` |
| RST-001 | PASS — all 11 sync helpers skipped; none perform I/O or async operations |
| RST-004 | PASS — no unexported async functions exist in this file; exemption not needed |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` is not in the base registry; correctly declared as a schema extension; follows the `commit_story.<category>.<operation>` convention |
| SCH-002 | PASS — `commit_story.journal.file_path` is a defined registry attribute (string type); no undeclared attribute keys used |
| SCH-003 | PASS — `commit_story.journal.file_path` registered as `type: string`; `filePath` is the raw string parameter value; type matches |
| CDQ-001 | PASS — span closed in `finally` block inside the `startActiveSpan` callback; no early-exit path escapes the finally |
| CDQ-005 | PASS — `tracer.startActiveSpan` callback pattern used; not `startSpan` |
| CDQ-007 | ADVISORY — raw `filePath` used for `commit_story.journal.file_path` (full filesystem path, not basename or project-relative path); agent notes `path.basename` is not imported in this file and adding a non-OTel import is not permitted per CDQ-007's import constraint; same pattern as run-16 journal-paths.js and run-16 journal-manager.js — consistent known limitation across runs |
| CDQ-009 | NOT APPLICABLE — no `!== undefined` guards around setAttribute; filePath is a required string parameter |
| CDQ-010 | NOT APPLICABLE — no string-method calls on property accesses in setAttribute arguments |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` at module level; canonical tracer name per spiny-orb.yaml |

**Failures**: None

**Notes**:
- This file is structurally identical to run-16's journal-paths.js result: 1 span, same span name, same attribute, same CDQ-007 advisory. The agent made the same correct decisions in both runs — ensureDirectory is the sole instrumentable function, all sync helpers are correctly excluded, and the CDQ-007 full-path limitation is acknowledged but does not constitute a failure.
- The 0 attributes count in the run summary header reflects spiny-orb's attribute-counting methodology (schema extensions are not counted as "attributes" in the span/attribute tally). The `commit_story.journal.file_path` setAttribute call is present in the committed code.

---

### 25. managers/journal-manager.js (2 spans, 1 attribute, 3 attempts)

**Run log summary**: 2 spans, 1 attribute, 3 attempts. Function-level fallback: 3/3 functions instrumented — formatJournalEntry (0 spans), saveJournalEntry (1 span), discoverReflections (1 span). File-level instrumentation failed with NDS-003 on all three attempts (15 errors → 3 errors → 15 errors) before the agent triggered function-level fallback, which succeeded on its first pass.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — committed code is from the function-level fallback pass, which the validator accepted. All three file-level attempts produced NDS-003 blocking errors (attempts 1 and 3: 15 errors each; attempt 2: 3 errors); function-level reassembly resolved the preservation failures. The committed output is structurally clean. |
| NDS-004 | PASS — multi-line `saveJournalEntry` parameter signature (sections, commit, reflections, basePath, options) preserved exactly across lines; no parameter collapsing |
| NDS-005 | PASS — three `catch` blocks exist in the original: one in `saveJournalEntry` (ENOENT swallow) and two in `discoverReflections` (unreadable file, missing directory). All three are preserved unmodified in the committed output. The outer span error-catching try/catch blocks are additive, not replacements. |
| NDS-006 | PASS |
| NDS-007 | PASS — the three inner catch blocks in the original are all graceful-degradation: `saveJournalEntry`'s inner catch swallows ENOENT when the file does not yet exist (normal first-run control flow); `discoverReflections`'s two inner catches `continue` past unreadable files and missing directories. None rethrow. Per NDS-007, `recordException` and `setStatus(ERROR)` were NOT added to these inner catches. Both exported async functions have separate outer error-recording catches that handle genuinely unexpected failures with `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error`. |
| API-001 | PASS — `import { SpanStatusCode, trace } from '@opentelemetry/api'`; no SDK or vendor-specific imports |
| COV-001 | PASS — `saveJournalEntry` (exported async, filesystem I/O, pipeline step) and `discoverReflections` (exported async, filesystem I/O, pipeline step) both have entry-point spans |
| COV-002 | N/A — no outbound HTTP or database calls |
| COV-003 | PASS — both instrumented spans have outer catch blocks with `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error` before `finally { span.end() }` |
| COV-004 | PASS — both exported async I/O functions have spans; `formatJournalEntry` is exported but purely synchronous (formats a string from arguments, no I/O), correctly skipped per RST-001; the 10 unexported helpers (extractFilesFromDiff, countDiffLines, formatTimestamp, formatReflectionsSection, parseReflectionEntry, parseTimeString, parseReflectionsFile, isInTimeWindow, getYearMonthRange, and the getReflectionsDirectory import) are synchronous utilities with no async behavior |
| COV-005 | PASS — `saveJournalEntry`: `commit_story.journal.file_path` (entryPath), `commit_story.journal.entry_date` (ISO date string from commit.timestamp), and `commit_story.commit.message` (first line, guarded by `commit.message != null`). `discoverReflections`: `commit_story.context.time_window_start` and `commit_story.context.time_window_end` (both `.toISOString()`) and `commit_story.journal.reflections_count` (result array length). Covers both input context (time window, commit identity) and output signal (reflection count, entry date). |
| RST-001 | PASS — all 10 synchronous functions skipped: extractFilesFromDiff, countDiffLines, formatTimestamp, formatReflectionsSection, formatJournalEntry, parseReflectionEntry, parseTimeString, parseReflectionsFile, isInTimeWindow, getYearMonthRange |
| RST-004 | PASS — no unexported async functions exist in this file; RST-004 exemption not needed |
| SCH-001 | PASS — `commit_story.journal.save_entry` and `commit_story.journal.discover_reflections` are not in the base registry; both are declared as schema extensions in agent-extensions.yaml following the `commit_story.<category>.<operation>` naming convention; the agent note explicitly documents that no existing schema span definition matched these operations |
| SCH-002 | PASS — `commit_story.journal.file_path`, `commit_story.journal.entry_date`, and `commit_story.commit.message` are registered in the base attributes.yaml; `commit_story.context.time_window_start` and `commit_story.context.time_window_end` are registered in the context group; `commit_story.journal.reflections_count` is declared in agent-extensions.yaml; all attribute keys used have schema backing |
| SCH-003 | PASS — `entry_date` set via `.toISOString().split('T')[0]` (string type, matches `type: string`); `commit.message` coerced via `String(...)` before `.split('\n')[0]` (string); `time_window_start` and `time_window_end` via `.toISOString()` (string); `reflections_count` is `reflections.length` (int, matches `type: int`); `file_path` is a raw string path (string type) |
| CDQ-001 | PASS — both spans use `startActiveSpan` callback pattern; `span.end()` in `finally` block in each outer try/catch/finally; no early-exit path escapes the finally |
| CDQ-005 | PASS — `tracer.startActiveSpan` used for both spans, not `startSpan` |
| CDQ-007 | ADVISORY — raw `entryPath` used for `commit_story.journal.file_path` (full filesystem path, not basename or project-relative path); agent notes that `path.basename` is not already imported in this file (only `join` is imported from `node:path`) and that adding a non-OTel import is not permitted per the CDQ-007 import constraint; `commit.message != null` guard is present before setting `commit_story.commit.message`; `vcs.ref.head.revision` and `commit_story.commit.author` are absent from the committed code (correct PII exclusion — `commit.author` would be PII; `vcs.ref.head.revision` from `commit.hash` would be safe but the agent excluded it and used `shortHash` indirectly via `entry_date` derivation path instead); `reflections_count` is set from `reflections.length` on a locally-constructed array, not a nullable property access |
| CDQ-009 | NOT APPLICABLE — no `!== undefined` guards around setAttribute; null guard present where needed (`commit.message != null`) |
| CDQ-010 | NOT APPLICABLE — no string method calls on property accesses in setAttribute arguments; `.split('\n')[0]` is called on `String(commit.message)` after a null check, which is safe |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` at module level; canonical tracer name per spiny-orb.yaml `tracerName` |

**Failures**: None

**Notes**:

The 3-attempt count reflects file-level NDS-003 oscillation — an established pattern in this codebase where the agent's file-level reassembly reformats multi-line constructs inconsistently between attempts (15 errors, then 3, then 15 again). The instrumentation report's validation journey entry confirms: Attempt 1 (15 NDS-003 errors), Attempt 2 (3 NDS-003 errors), Attempt 3 (15 NDS-003 errors), then function-level fallback succeeded. This oscillation pattern — where attempt 2 reduced errors but attempt 3 regressed — is consistent with the NDS-003 oscillation behavior documented for other files in this run. Function-level fallback isolated each function independently, eliminating the cross-function line-numbering interference that drives the oscillation.

`formatJournalEntry` receiving 0 spans is the correct RST-001 outcome. It is exported, but it is purely synchronous — it accepts pre-computed arguments, builds a string, and returns it, with no awaits, no filesystem calls, and no I/O of any kind. RST-001 explicitly exempts synchronous formatting utilities from instrumentation. A span on `formatJournalEntry` would record only CPU time and carry no diagnostic signal. The 0-span treatment here is a rule-compliant decision, not an oversight.

The two new span names (`commit_story.journal.save_entry`, `commit_story.journal.discover_reflections`) follow the same `commit_story.<category>.<operation>` naming convention established across this run. The agent's choice of `save_entry` over `save_journal_entry` and `discover_reflections` over `discover_journal_reflections` drops the redundant `journal` token from the operation segment since it is already present in the category segment — consistent with how other `commit_story.journal.*` spans are named in this run (e.g., `ensure_directory`, not `ensure_journal_directory`).

The attribute set on `discoverReflections` is notably richer than run-16's version, which also passed CDQ-007 but only recorded `file_path` and `vcs.ref.head.revision` on `saveJournalEntry`. This run adds `entry_date`, `commit.message`, time window bounds, and `reflections_count` — giving callers visibility into both what was written and how many reflections were found, without exposing PII.

The CDQ-007 advisory on the raw `entryPath` value is a consistent known limitation across this run: the same constraint applies to `journal-paths.js` and `summary-manager.js`, where `path.basename` is also not already imported. The limitation is documented and acknowledged; it does not constitute a blocking failure under the current rubric.

Compared to run-16, this file improved: run-16 had a CDQ-007 failure for unconditional `setAttribute` calls on nullable `commit.hash` and `commit.author` fields. This run eliminated those calls (excluding PII `commit.author` and dropping `vcs.ref.head.revision` from `saveJournalEntry`) and added a null guard on `commit.message`. The CDQ-007 finding is now advisory-only.

---

### commands/summarize.js (3 spans, 4 attributes, 3 attempts)

**Agent notes discrepancy**: The agent's written notes describe using `tracer.startSpan()` (not `startActiveSpan`) to avoid re-indenting the existing for-loop bodies, citing NDS-003 constraints. The actual committed code uses `tracer.startActiveSpan()` for all three functions. The notes appear to describe reasoning from an earlier attempt; the final committed output resolved differently. The span names described in the notes (`commit_story.summarize.run_daily/weekly/monthly`) also differ from what was committed (`commit_story.journal.run_summarize/run_weekly_summarize/run_monthly_summarize`). The committed code is evaluated as-is.

**NDS-003 and startActiveSpan**: Using `startActiveSpan` with an async callback wrapper did re-indent the existing for-loop bodies (original 2-space for-loop with 4-space body; instrumented 6-space for-loop with 8-space body inside the callback+try). The NDS-003 validator passed the file — NDS-003 checks line-content preservation, not indentation level. The re-indentation is a structural addition, not a modification of existing content. PASS is correct.

**Attribute count**: Six `setAttribute` calls appear across the three spans. The run reports "4 attributes" because `commit_story.journal.daily_summaries_count` and `commit_story.journal.weekly_summaries_count` were already declared in `semconv/agent-extensions.yaml` by earlier files in the run; the four new schema extensions from this file are `dates_count`, `months_count`, `monthly_summaries_generated_count`, and `monthly_summaries_failed_count`.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — `startActiveSpan` callback did re-indent for-loop bodies, but NDS-003 checks line-content preservation, not indentation level. No original content was modified or removed. Validator passed. |
| NDS-004 | PASS |
| NDS-005 | PASS — no original catch blocks modified or removed |
| NDS-006 | PASS |
| NDS-007 | PASS — three inner catch blocks require analysis: (1) the per-item `catch (err)` block in each for-loop accumulates errors into `result.failed` and `result.errors` without rethrowing — classic graceful-degradation; no `recordException` is correct; (2) the `catch { // Doesn't exist, proceed }` block in `runSummarize` is an expected-condition catch representing normal `access()` control flow — correctly left unmodified. All three outer span-wrapper catches have `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error` for unexpected exceptions. Pattern is correct throughout. |
| COV-001 | PASS — `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize` (all exported async) have spans |
| COV-002 | N/A — no outbound HTTP/DB calls |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.run_summarize`, `run_weekly_summarize`, and `run_monthly_summarize` are schema extensions correctly declared in `semconv/agent-extensions.yaml`. The agent noted these names were chosen after `commit_story.journal.daily_summary`, `generate_daily_summary`, `weekly_summary`, `create_weekly_summary`, `monthly_summary`, and `generate_monthly_summary` were already claimed by earlier files. The `run_*` prefix distinguishes CLI-level entry points from manager-level generation — appropriate semantic distinction. SCH-001 advisory for name similarity to `trigger_auto_summaries/weekly/monthly` (from `auto-summarize.js`) is noted but the operation classes are distinct: `run_*` is user-initiated, `trigger_auto_*` is scheduled. |
| SCH-002 | PASS — `commit_story.journal.dates_count` (int, new extension), `commit_story.journal.daily_summaries_count` (int, already declared), `commit_story.journal.weekly_summaries_count` (int, already declared), `commit_story.journal.months_count` (int, new extension), `commit_story.journal.monthly_summaries_generated_count` (int, new extension), `commit_story.journal.monthly_summaries_failed_count` (int, new extension). All registered before use. The split between `_generated_count` and `_failed_count` for monthly (vs. a single `_count` for daily/weekly) is a valid design choice that provides more signal; it follows the established namespace convention. |
| SCH-003 | PASS — all six attributes are int values set from `.length` or array property accessors on known arrays |
| CDQ-001 | PASS — span closed in `finally { span.end() }` for all three spans; the `startActiveSpan` callback pattern guarantees this |
| CDQ-005 | PASS — all three functions use `tracer.startActiveSpan()`. The agent notes describe a `startSpan` rationale from an earlier attempt; the final committed code correctly used `startActiveSpan` throughout. The CDQ-005 concern is resolved in the committed output. |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` at module level |
| COV-004 | PASS — 3 exported async entry points (`runSummarize`, `runWeeklySummarize`, `runMonthlySummarize`) all have spans; 4 sync utilities (`isValidDate`, `isValidWeekString`, `isValidMonthString`, `expandDateRange`) and 2 sync helpers (`parseSummarizeArgs`, `showSummarizeHelp`) correctly skipped per RST-001 |
| COV-005 | PASS — `dates_count` records the input size for the daily operation; `months_count` records the input size for the monthly operation; `daily_summaries_count`, `weekly_summaries_count`, `monthly_summaries_generated_count` record output size per function. The lack of a corresponding input-count attribute on `runWeeklySummarize` (no `weeks_count` set at span start) is a minor gap but not a COV-005 failure — the rule requires meaningful attributes, and the output count is captured. |
| RST-001 | PASS — `isValidDate`, `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `showSummarizeHelp` are all synchronous with no I/O; 0 spans is correct |
| RST-004 | PASS |
| CDQ-007 | PASS — all `setAttribute` calls use direct `.length` or `.length` property accesses on arrays that are guaranteed non-null (initialized at function start as `[]`). No optional chaining or nullable property access. |

**Failures**: None

**Note**: The agent notes contain a factual mismatch with the committed output — they describe `startSpan` and `commit_story.summarize.*` span names, but the committed file uses `startActiveSpan` and `commit_story.journal.*` span names. The notes appear to carry over reasoning from attempt 1 or 2 without being updated for the final output. This is an agent observability concern (notes should reflect the final committed state), not a quality failure in the instrumentation itself.

---

### 28. utils/summary-detector.js (9 spans, 1 attempt)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — inner catch blocks that return `[]`, `new Set()`, or `continue` (no rethrow) are left unmodified; no `recordException`/`setStatus(ERROR)` added to graceful-degradation catches. Matches NDS-007 spec-correct behavior for expected filesystem conditions. |
| API-001 | PASS |
| COV-001 | PASS — all five exported async functions (getDaysWithEntries, findUnsummarizedDays, getDaysWithDailySummaries, findUnsummarizedWeeks, findUnsummarizedMonths) receive entry-point spans |
| COV-003 | PASS — outer try/catch in all nine instrumented functions has `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| COV-004 | PASS — all nine async functions have spans; the four unexported async helpers (getSummarizedDays, getSummarizedWeeks, getSummarizedMonths, getWeeksWithWeeklySummaries) were deliberately instrumented per agent notes; both sync utilities (getTodayString, getNowDate) are correctly skipped |
| COV-005 | ADVISORY — spans record count attributes (dates_count, daily_summaries_count, weekly_summaries_count, months_count) but no registry-defined attributes from `commit_story.journal.*` apply at the operation level for these detector functions; counts are the appropriate domain signal |
| RST-001 | PASS — getTodayString and getNowDate are unexported, sync, no I/O; correctly skipped |
| RST-004 | PASS — the four unexported async helpers were instrumented despite RST-004 exemption, per COV-004 pre-scan directive that explicitly required spans on all async functions; this is a correct override per the agent's reasoning |
| SCH-001 | PASS — all nine span names registered as extensions in agent-extensions.yaml; all match the pattern `commit_story.journal.<function_name>` in snake_case dotted notation; no semantic duplicates with existing registry entries |
| SCH-002 | PASS — four attribute keys used (dates_count, daily_summaries_count, weekly_summaries_count, months_count) are all registered as extensions in agent-extensions.yaml prior to this run; no new attribute extensions needed; use of `weekly_summaries_count` in both getSummarizedWeeks and findUnsummarizedWeeks and getWeeksWithWeeklySummaries is a reuse of the registered key (semantically appropriate in each context — the attribute captures a summary file count regardless of caller) |
| SCH-003 | PASS — all four attribute values are integer counts (`.length` or `.size`); registered types are `int`; no type mismatches |
| CDQ-001 | PASS — all nine spans use `startActiveSpan` callback pattern; span lifecycle handled by the callback; `span.end()` in `finally` block in each outer try/catch/finally |
| CDQ-005 | PASS — all nine spans use `startActiveSpan`, not `startSpan` |
| CDQ-007 | PASS — all `setAttribute` calls use `.length` or `.size` on known array or Set values that cannot be null in context (they are the result of local variable construction within the same span scope); no nullable property access without guards |
| CDQ-009 | NOT APPLICABLE — no `!== undefined` guards around setAttribute; all attribute values are `.length`/`.size` on locally-constructed collections |
| CDQ-010 | NOT APPLICABLE — no string-method calls on property accesses in setAttribute arguments |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` at module level uses the canonical tracer name |

**Failures**: None

**Notes**:

The agent made a deliberate choice to instrument all four unexported async helpers (getSummarizedDays, getSummarizedWeeks, getSummarizedMonths, getWeeksWithWeeklySummaries) despite RST-004's general exemption. The pre-scan analysis explicitly directed spans on all async functions in this file, and the agent correctly cited this directive in its notes. This produces a rich 9-span trace tree for the detector module — the orchestrators (findUnsummarizedDays, findUnsummarizedWeeks, findUnsummarizedMonths) become the parents of their helper spans, giving callers visibility into how detector traversals decompose into inner reads.

The `weekly_summaries_count` attribute key is reused in three functions with different semantics: in `getSummarizedWeeks` it counts existing weekly summary files; in `findUnsummarizedWeeks` it counts the result set of weeks needing summaries; in `getWeeksWithWeeklySummaries` it counts the sorted array of week labels. The agent notes acknowledge this reuse explicitly as the "closest registered attribute for a week-level count." SCH-002 passes because all three uses share the same key from the registry and the Weaver validator accepted them. The semantic blurring (a single key measuring three different things) is worth noting as a minor design observation but does not constitute a rubric failure — attribute key reuse is not prohibited when the type matches.

---

### managers/auto-summarize.js (3 spans, 1 attribute, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original imports restructured to multi-line format in instrumented output; all original business logic lines preserved; validator passed on attempt 2 |
| NDS-004 | PASS — triggerAutoMonthlySummaries parameter signature reflowed to multi-line (`basePath = '.',` on own line); semantically identical to original |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — inner for-loop catches in all three functions push to result.failed and continue without rethrowing (graceful-degradation per Pattern B); no recordException in inner catches; outer span wrappers have error-recording catches for unexpected exceptions |
| COV-001 | PASS — triggerAutoSummaries, triggerAutoWeeklySummaries, triggerAutoMonthlySummaries (all exported async) have spans |
| COV-002 | N/A — no outbound HTTP/DB calls |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | ADVISORY — three new span names (trigger_auto_summaries/weekly/monthly) are semantically similar to registered run_summarize/weekly/monthly; intentionally retained per agent notes: auto-trigger orchestrators (cascade across all unsummarized periods) are a distinct operation class from command entry points (process explicit user request for one period) |
| SCH-002 | PASS — commit_story.journal.weeks_count is a new schema extension correctly declared in agent-extensions.yaml; all other attributes used (dates_count, daily_summaries_count, weekly_summaries_count, months_count, monthly_summaries_generated_count, monthly_summaries_failed_count) were already registered by earlier files in the run |
| SCH-003 | PASS — all count attributes are int; no type mismatches |
| CDQ-001 | PASS — all three spans closed in startActiveSpan try/finally |
| CDQ-005 | PASS |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` used |
| COV-004 | PASS — all 3 exported async functions have spans; getErrorMessage (unexported sync helper) correctly skipped per RST-001/RST-004 |
| COV-005 | PASS — dates_count (unsummarized days found), daily_summaries_count (generated), weeks_count (unsummarized weeks found), weekly_summaries_count (generated), months_count (unsummarized months found), monthly_summaries_generated_count, monthly_summaries_failed_count all set; meaningful operational metrics covering the trigger pipeline |
| RST-001 | PASS — getErrorMessage (sync, no I/O) correctly skipped |
| RST-004 | PASS |
| CDQ-007 | PASS — all three unsummarized* array .length accesses guarded with `if (x != null)` before setAttribute; result.generated.length and result.failed.length are from guaranteed arrays (initialized as [] at function start), no nullable access |

**Failures**: None

**SCH-002 note**: The agent report summary line "1 attribute" refers to `commit_story.journal.weeks_count` as the sole new attribute extension invented for this file. The schema already contained `commit_story.journal.dates_count` and `commit_story.journal.months_count` (registered by summary-detector.js earlier in the run), and `daily_summaries_count`, `weekly_summaries_count`, `monthly_summaries_generated_count`, `monthly_summaries_failed_count` (registered by summary-manager.js). The new `weeks_count` correctly fills the gap in the days/weeks/months symmetric naming pattern.

---
## Partial Files (1)

### managers/summary-manager.js (6 spans, 1 attribute, 2 attempts) — PARTIAL

**Structure**: 14 functions total — 9 exported async (readDayEntries, saveDailySummary, generateAndSaveDailySummary, readWeekDailySummaries, saveWeeklySummary, generateAndSaveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary, generateAndSaveMonthlySummary), 5 exported sync (formatDailySummary, getWeekBoundaries, formatWeeklySummary, getMonthBoundaries, formatMonthlySummary), and 0 unexported. Function-level fallback: 11/14 functions instrumented. Skipped: generateAndSaveDailySummary (oscillation at lines 13–17), generateAndSaveWeeklySummary (NDS-003 on line 13), generateAndSaveMonthlySummary (NDS-003 on line 13). These same three functions also failed in run-16, where the cause was token budget exhaustion. In run-17 the token budget was adaptive-fixed, but the same three functions still failed — this time due to a distinct NDS-003 root cause described below.

**NDS-003 root cause for skipped functions**: The validator's "original line 13 missing/modified" error message identifies the function signature itself as the changed line. In the original file, each of the three `generateAndSave*` functions has a single-line signature (e.g., `export async function generateAndSaveWeeklySummary(weekStr, basePath = '.', options = {}) {`). When the agent produced instrumented output for these functions, it reformatted the signature to multi-line Prettier style:
```
export async function generateAndSaveWeeklySummary(
  weekStr,
  basePath = '.',
  options = {},
) {
```
This is a content modification, not a reconciler gap. The validator's NDS-003 check fires because the original single-line function signature is absent in the instrumented version. The oscillation on `generateAndSaveDailySummary` (NDS-003 errors at lines 13–17) reflects five lines being flagged: the open-paren signature line plus the four reformatted parameter lines. `generateAndSaveWeeklySummary` and `generateAndSaveMonthlySummary` report only line 13 because the validator halts after the first confirmed mismatch.

The same multi-line reformatting is also present in the committed portions of the file: `saveDailySummary`, `saveWeeklySummary`, `saveMonthlySummary`, and the three `generateAndSave*` functions were all reformatted from single-line to multi-line signatures. The validator did not fire on the committed I/O leaf functions because those were processed individually by the function-level fallback, which accepted them. Only the three `generateAndSave*` orchestrators oscillated or failed outright. Additionally, the `../generators/summary-graph.js` import was reformatted from a single line to a three-line destructured block, shifting line numbers throughout the file. The `const tracer = trace.getTracer('commit-story')` declaration was inserted at line 13, between the OTel API import and the `../utils/journal-paths.js` import block. In the original, line 13 is `  ensureDirectory,` (inside the journal-paths import); in the instrumented file, line 13 is `const tracer = ...`.

| Rule | Result |
|------|--------|
| NDS-003 | **FAIL** — function signatures for `saveDailySummary`, `saveWeeklySummary`, `saveMonthlySummary`, `generateAndSaveDailySummary`, `generateAndSaveWeeklySummary`, and `generateAndSaveMonthlySummary` were all reformatted from single-line to multi-line Prettier style. The validator flagged and blocked the three `generateAndSave*` orchestrators; the three leaf I/O functions were committed with the same reformatting present. The `../generators/summary-graph.js` import was also expanded, and `const tracer = trace.getTracer('commit-story')` was inserted between two import blocks, displacing original line 13. |
| NDS-004 | **FAIL** — all six exported async function signatures were reformatted from single-line to multi-line form. NDS-004 prohibits modifying multi-line parameter signatures; by extension it prohibits converting single-line signatures to multi-line. The parameter content is preserved but the line structure is not. |
| NDS-005 | PASS — all inner catch blocks from the original are preserved: the `access()` ENOENT swallows in `saveDailySummary`, `saveWeeklySummary`, `saveMonthlySummary`, and each `generateAndSave*` function; the per-day `readFile` catch in `readWeekDailySummaries`; and the `readdir` catch in `readMonthWeeklySummaries`. All are graceful-degradation patterns and are intact in the committed output. |
| NDS-006 | **ADVISORY** — `import { SpanStatusCode, trace } from '@opentelemetry/api'` was inserted after the `../generators/summary-graph.js` import and before the `../utils/journal-paths.js` import. The OTel API import is additive and expected; however, `const tracer = trace.getTracer('commit-story')` was placed between two import blocks rather than after all imports. `import` declarations are hoisted in ES modules; a `const` declaration between them is legal JavaScript but disrupts the import-block boundary and is non-standard placement. |
| NDS-007 | PASS — inner catch blocks in the committed functions are all graceful-degradation: ENOENT swallows when checking for existing files (`access()` catch), per-day `readFile` errors in `readWeekDailySummaries`, and `readdir` failure in `readMonthWeeklySummaries`. None rethrow. `recordException` and `setStatus(ERROR)` were correctly NOT added to these inner catches. Each committed async function with a span has a separate outer error-recording catch for genuinely unexpected failures. |
| API-001 | PASS — `import { SpanStatusCode, trace } from '@opentelemetry/api'`; no SDK or vendor-specific imports |
| API-004 | PASS — no SDK-internal imports in src/ |
| COV-001 | **FAIL** — `generateAndSaveDailySummary`, `generateAndSaveWeeklySummary`, and `generateAndSaveMonthlySummary` are exported async functions and full pipeline entry points (they call the read functions, invoke the LangGraph summary pipeline, and persist the result). These are the highest-value functions to instrument in this file — they represent the user-visible summarization operation. All three lack spans. |
| COV-002 | N/A — no outbound HTTP or database calls |
| COV-003 | PASS — all six committed spans use `startActiveSpan` callback with try/catch/finally; each outer catch calls `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, and `throw error`; `span.end()` is in the `finally` block in each case |
| COV-004 | **FAIL** — 3 of the 9 exported async functions lack spans: `generateAndSaveDailySummary`, `generateAndSaveWeeklySummary`, `generateAndSaveMonthlySummary`. These are the pipeline orchestrators. The 6 leaf I/O functions (readDayEntries, saveDailySummary, readWeekDailySummaries, saveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary) are all correctly instrumented. |
| COV-005 | PASS for the 6 committed spans — `readDayEntries`: `commit_story.journal.entry_date`, `commit_story.journal.file_path`, and `commit_story.journal.entries_count` (raw journal entries split from the day file). `saveDailySummary`: `commit_story.journal.file_path` and `commit_story.journal.entry_date`. `readWeekDailySummaries`: `commit_story.journal.week_label` and `commit_story.journal.daily_summaries_count`. `saveWeeklySummary`: `commit_story.journal.week_label`. `readMonthWeeklySummaries`: `commit_story.journal.month_label` and `commit_story.journal.weekly_summaries_count`. `saveMonthlySummary`: `commit_story.journal.month_label`. Each span records the primary identity dimension of its operation. |
| RST-001 | PASS — the five synchronous helpers (formatDailySummary, getWeekBoundaries, formatWeeklySummary, getMonthBoundaries, formatMonthlySummary) all correctly receive 0 spans. All are pure data transformations with no I/O or awaits. |
| RST-004 | PASS — no unexported async functions exist in this file; RST-004 exemption not invoked |
| SCH-001 | PASS — 6 span names declared as schema extensions: `commit_story.journal.read_day_entries`, `commit_story.journal.save_daily_summary`, `commit_story.journal.read_week_daily_summaries`, `commit_story.journal.save_weekly_summary`, `commit_story.journal.read_month_weekly_summaries`, `commit_story.journal.save_monthly_summary`. None exist in the base `attributes.yaml` registry. All follow the `commit_story.<category>.<operation>` naming convention established across this run. |
| SCH-002 | PASS — `commit_story.journal.entry_date` and `commit_story.journal.file_path` are registered in the base registry journal group. `commit_story.journal.entries_count` is a new extension declared by this file. `commit_story.journal.week_label`, `commit_story.journal.daily_summaries_count`, `commit_story.journal.weekly_summaries_count`, and `commit_story.journal.month_label` were registered earlier in the run by `summary-graph.js`. No registered attribute key is used with mismatched semantics. |
| SCH-003 | PASS — `entry_date` set via `.toISOString().split('T')[0]` (string, matches `type: string`); `file_path` is a raw string path (string); `entries_count` is `entries.length` (int, matches `type: int`); `week_label` and `month_label` are string arguments (string); `daily_summaries_count` and `weekly_summaries_count` are `.length` on locally-constructed arrays (int) |
| CDQ-001 | PASS — all 6 committed spans use `startActiveSpan` callback pattern with `span.end()` in `finally`; no path escapes the finally block |
| CDQ-005 | PASS — `tracer.startActiveSpan` used for all spans; no `tracer.startSpan` calls; no hardcoded environment or process values in attribute assignments |
| CDQ-007 | **ADVISORY** — `commit_story.journal.file_path` is set to the raw filesystem path returned by `getSummaryPath` (full absolute path rather than project-relative or basename). The agent notes that `path.basename` is not already imported in this file and that adding non-OTel imports is prohibited. The `if (span.isRecording())` guard around `entry_date` in `saveDailySummary` is an unnecessary but harmless performance-optimization pattern; `date` is always a non-null `Date` argument by the function's contract, so there is no null risk. No unconditional setAttribute calls on nullable fields. |
| CDQ-009 | NOT APPLICABLE — no `!== undefined` guards around setAttribute; `entries_count`, `daily_summaries_count`, and `weekly_summaries_count` are all set from `.length` on locally-constructed arrays that are never undefined |
| CDQ-010 | NOT APPLICABLE — no string method calls on property accesses in setAttribute arguments; `entry_date` computation uses `.toISOString().split('T')[0]` on a `Date` object, not a nullable property access |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` at module level; canonical tracer name per `spiny-orb.yaml` `tracerName` |

**Canonical failures**: NDS-003 (signature reformatting in both committed and skipped functions), NDS-004 (six function signatures reformatted to multi-line), COV-001 (three pipeline orchestrators lack spans), COV-004 (same three)

**Notes**:

The three `generateAndSave*` functions have failed in both run-16 and run-17, but for different reasons. In run-16, the cause was token budget exhaustion (null `parsed_output`): the agent ran out of budget mid-function and produced no output. In run-17, the adaptive thinking budget fix resolved the token exhaustion, but the agent then produced output that the validator rejected due to multi-line signature reformatting — a content modification failure rather than a budget failure. This is a meaningful distinction: the adaptive budget fix did what it was supposed to do, but exposed an underlying reformatting tendency that was previously masked by the outright budget failure.

The NDS-003 root cause is consistent with the multi-line collapse pattern seen in `journal-graph.js` and `summary-graph.js` this run, but in reverse: those files collapsed multi-line constructs onto fewer lines; this file expanded single-line signatures to multi-line. Both are content modifications. The pattern suggests the agent applies Prettier-style formatting normalization when rewriting function signatures during instrumentation, regardless of direction.

The `generateAndSave*` functions are the highest-observability targets in this file. They call the read functions (now instrumented), invoke the LangGraph pipeline (`generateDailySummary`/`generateWeeklySummary`/`generateMonthlySummary` — instrumented in `summary-graph.js`), and call the save functions (now instrumented). The missing spans on the orchestrators mean there is no root span connecting these child operations — traces for a full summarization run will be fragmented across child spans without a parent to bind them.

`commit_story.journal.entries_count` is a correctly-reasoned schema extension. The base registry has `daily_summaries_count` (daily summary files within a week), `quotes_count` (developer quotes extracted), and `reflections_count` — none of which match raw journal entry strings split from a day file. The new attribute name is unambiguous and follows the established pattern.

Compared to run-16, the 6 leaf I/O functions are all present and correctly instrumented in both runs. Run-16 had 7 spans because `generateAndSaveDailySummary` was instrumented (token exhaustion only hit the weekly and monthly variants); run-17 has 6 spans because `generateAndSaveDailySummary` also failed. The net coverage gap is slightly larger this run — three orchestrators missing instead of two — but the leaf-level instrumentation quality improved: the attribute set is richer (entries_count, daily_summaries_count, weekly_summaries_count all added) compared to run-16's simpler attribute selection. This is a strong signal for a targeted PRD #18 fix on these three orchestrator functions, where the fix must preserve single-line signatures verbatim rather than reformatting them.

---

## Failed Files (4)

### 11. generators/journal-graph.js (0 spans committed, 2 attempts) — FAILED

| Rule | Result |
|------|--------|
| NDS-003 | **FAIL** — 49 violations in both attempts; nothing committed |
| API-001 | PASS (approach) — `import { trace, SpanStatusCode } from '@opentelemetry/api'` only |
| NDS-006 | PASS (approach) — ES module imports and exports preserved throughout |
| NDS-004 | PASS (approach) — all function signatures unchanged |
| NDS-005 | PASS (approach) — inner try/catch preserved; outer catch added only as span error recording layer |
| COV-001 | **FAIL** — nothing committed; approach: `generateJournalSections` (exported async entry point) has a span |
| COV-003 | **FAIL** — nothing committed; approach: all four spans have outer catch with `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` |
| COV-004 | **FAIL** — nothing committed; approach: `generateJournalSections` plus three unexported async LangGraph node functions (`summaryNode`, `technicalNode`, `dialogueNode`) performing LLM I/O all have spans |
| COV-005 | **FAIL** — nothing committed; approach: all four spans carry domain attributes from schema |
| COV-006 | **FAIL** — nothing committed; approach: manual spans wrap LangGraph node functions above `model.invoke()` calls |
| RST-001 | PASS (approach) — no spans on any sync helper |
| RST-004 | PASS (approach) — unexported async node functions are LangGraph I/O functions; exempt |
| SCH-001 | PASS (approach) — four span names follow `commit_story.<category>.<operation>` convention |
| SCH-002 | PASS (approach) — all attribute keys registered in schema |
| SCH-003 | PASS (approach) — all types match schema |
| CDQ-001 | PASS (approach) — `span.end()` in `finally` blocks on all four spans |
| CDQ-005 | PASS (approach) — all four spans use `startActiveSpan` callback pattern |
| CDQ-007 | PASS (approach) — usage_metadata null-guarded; literal constants used unconditionally |

**Failures**: NDS-003 blocks commitment; COV-001/003/004/005/006 automatically fail because nothing was committed.

---

**NDS-003 failure analysis**

49 violations in 2 attempts. Two distinct failure components:

**Component 1 — Content corruption (genuine): 1 violation**

The debug dump contains a single-character content change in `formatChatMessages`:

```javascript
// Original:
return `{"type":"${type}", "time":"${time}", "content":"${escapeForJson(msg.content)}"}`;

// Agent output (closing } dropped from JSON template):
return `{"type":"${type}", "time":"${time}", "content":"${escapeForJson(msg.content)}"`;
```

The closing `}` inside the template literal was dropped. This corrupts the JSON string — every formatted message would be missing its closing brace. NDS-003 detects this because the original line is no longer present verbatim.

**Component 2 — Re-indentation cascade (reconciler gap): ~48 violations**

The agent correctly wrapped `summaryNode`, `technicalNode`, `dialogueNode`, and `generateJournalSections` with `tracer.startActiveSpan`. This added two levels of nesting inside each function, shifting existing business logic from 2-space to 8-space indentation. NDS-003 checks for exact line content including leading whitespace, so every re-indented line triggers a violation. The business logic content is fully preserved; only indentation changed.

| Component | Type | Violation count | Agent culpability |
|-----------|------|-----------------|-------------------|
| Content corruption in template literal | Genuine content change | 1 | Agent fault |
| Re-indentation from `startActiveSpan` wrapping | Reconciler gap | ~48 | Spiny-orb issue |

**Instrumentation approach correctness**

Setting NDS-003 aside, the agent produced instrumentation correct in every dimension. The 4-span structure (`generate_sections` → `generate_summary` + `generate_technical` + `generate_dialogue`) is identical to the run-12 approach that committed successfully. The attribute set is complete, registered in the schema, correctly typed, and free of CDQ-007 concerns. Error handling follows the double-try pattern correctly. This is a fidelity problem (one dropped character + reconciler gap), not a quality problem.

**What would need to change for run-18**

1. **Content corruption**: The agent must not drop the closing `}` from the `formatChatMessages` template literal. The 65% thinking budget cap is the primary suspect — run-12 committed successfully with uncapped adaptive thinking on this same file.

2. **Re-indentation reconciler gap**: Until spiny-orb adds indentation-aware comparison (or a whitespace-normalized mode), the agent cannot use `startActiveSpan` wrapping on a 629-line file without accumulating ~40+ false-positive violations. The handoff doc documents this as a spiny-orb issue.

**Run-18 prognosis**: If the thinking budget is adjusted upward for complex files, journal-graph.js should return to the run-12 pattern. The content corruption is likely a consequence of compressed thinking budget, not a stable agent error.

---

### 18. mcp/tools/context-capture-tool.js (0 spans, 3 attempts) — FAILED (NDS-003 oscillation)

**Outcome**: Not committed. NDS-003 oscillation at output lines 124-125 in attempts 2 and 3. Run-16 failed differently (token budget exhaustion / null parsed_output). The RUN16-1 fix (enabled thinking with budget cap) resolved the budget exhaustion — structured output was produced — but NDS-003 fired instead.

| Rule | Result |
|------|--------|
| NDS-003 | **FAIL** — reconciler gap; agent code is correct |
| API-001 | PASS — `@opentelemetry/api` only (`trace`, `SpanStatusCode`) |
| NDS-006 | PASS — ESM syntax; project is `"type": "module"` |
| NDS-004 | PASS — `registerContextCaptureTool(server)` signature unchanged |
| NDS-005 | PASS — original saveContext had no try/catch; instrumented version adds catch that re-throws unconditionally, preserving error propagation |
| COV-001 | PASS (approach) — span placed on `saveContext`; MCP callback is the functional entry point but anonymous/unexported; `saveContext` captures the observable I/O operation |
| COV-003 | PASS (approach) — `saveContext` catch block records exception and sets ERROR status |
| COV-004 | PASS (approach) — `saveContext` is async, performs filesystem I/O (mkdir + appendFile); instrumented per RST-004 I/O exception |
| COV-005 | PASS (approach) — `commit_story.journal.file_path` captures output file path; attribute registered in schema |
| RST-001 | PASS — `getContextPath`, `formatTimestamp`, `formatContextEntry` (sync, no I/O), `registerContextCaptureTool` (sync registration) all correctly skipped |
| RST-004 | PASS — `saveContext` is unexported but exempt: async filesystem I/O (mkdir + appendFile) with no exported orchestrator covering the path |
| SCH-001 | PASS — `commit_story.context.save_context` not in registry; logged as new schema extension; follows `commit_story.<category>.<operation>` convention |
| SCH-002 | PASS — `commit_story.journal.file_path` is a defined registry key |
| SCH-003 | PASS — `commit_story.journal.file_path` is `type: string`; `filePath` is a constructed string path |
| CDQ-001 | PASS — `startActiveSpan` callback; `span.end()` in `finally` block |
| CDQ-005 | PASS — `startActiveSpan` callback pattern |
| CDQ-007 | PASS — `filePath` is non-nullable constructed string returned by `getContextPath(now)`; no guard needed |

**Failures (against debug dump)**: NDS-003 — reconciler gap only; agent-produced code is correct.

---

**NDS-003 failure analysis**

The agent correctly wrapped `saveContext` with `tracer.startActiveSpan`. This added approximately 14 new lines (OTel import, tracer init, span setup, try/catch/finally). All original content is present in the debug dump — lines 122-135 contain the `registerContextCaptureTool` catch block with byte-for-byte identical content to the original.

The NDS-003 failure is a validator reconciler gap. Root cause: the `startActiveSpan` callback wrapper re-indents all original `saveContext` body lines by two additional spaces. The validator's line-tracking algorithm counts re-indented lines as both "removed from original" and "added as new", inflating its computed cumulative offset. By the time the validator scans past `saveContext`, the offset miscounts push the expected position for subsequent original lines out of range — past the end of the original file — producing the spurious "original line 124" reference.

The same gap caused identical failure at `reflection-tool.js` (lines 116-117, same `},` and `);` content), confirming this is systematic for the `server.tool()` + `startActiveSpan` nesting pattern.

**What would need to change for run-18**

This is a spiny-orb validator issue, not an agent quality issue. The fix belongs in the NDS-003 reconciler: when a `startActiveSpan` callback wrapper is detected, the reconciler should treat all re-indented lines inside it as preserved (whitespace-change only), not as line removals/additions that inflate the cumulative offset.

Until that fix lands, the agent cannot successfully instrument any function inside a `server.tool()` callback with a `startActiveSpan` wrapper.

---

## mcp/tools/reflection-tool.js — FAILED

**Status**: ❌ FAILED — NDS-003 oscillation, 3 attempts, nothing committed
**Run-16 status**: ❌ FAILED — token budget exhaustion (null parsed_output), nothing committed
**Span budget**: 1 span attempted (`commit_story.reflection.save`)
**Tokens**: 9.7K output

---

### Failure Analysis

The agent correctly identified `saveReflection` as the sole function requiring a span and produced structurally sound instrumentation in the debug dump. The NDS-003 failures were not caused by logic errors in the instrumented code — they were caused by a validator line-number comparison mismatch.

**Root cause**: The NDS-003 validator compared the instrumented output against the original file and flagged "original line 116 missing/modified: `},`" and "original line 117 missing/modified: `);`". The original file has only 113 lines. Lines 116 and 117 do not exist in the original. The validator was reading the instrumented output file (127 lines, produced by the previous attempt) as the "original" when evaluating successive attempts. This caused the validator to anchor expected content at line positions that only exist in the instrumented form — a reconciler line-number reference bug, not an agent instrumentation error.

The same root cause affected `context-capture-tool.js` in the same run (NDS-003 at lines 124-125 of a 121-line original). Both files share the same structure: multi-line `server.tool()` call with a long string description literal spanning multiple lines. The line positions flagged (116-117 and 124-125) correspond to the closing structure of the `server.tool()` call in the debug dump from the prior attempt, not in the original source. This is a reconciler issue that is deterministic and repeatable — both structurally similar files failed with the same pattern in the same run.

**Agent behavior across attempts**: The agent's attempt-3 thinking shows it was aware of the line-shift problem and explicitly reasoned through it. It correctly calculated that adding OTel import + tracer declaration (2 lines at top) plus `startActiveSpan` wrapper in `saveReflection` (~12 lines total) would shift subsequent content. The agent attempted to work around the mismatch by reasoning about exact line positions, but could not resolve a validator that was comparing against a shifted baseline. This is not an agent reasoning failure — it is a systematic tooling gap.

---

### Debug Dump Quality Evaluation

The debug dump at `evaluation/commit-story-v2/run-17/debug-dumps/src/mcp/tools/reflection-tool.js` contains the last agent attempt. The instrumented code is evaluated below against all applicable rules.

**Structure of debug dump**:
- Lines 1-16: unchanged header comment + original imports
- Line 8: added `import { trace, SpanStatusCode } from '@opentelemetry/api';`
- Line 16: added `const tracer = trace.getTracer('commit-story');`
- Lines 18-61: unchanged sync helpers (`getReflectionsPath`, `formatTimestamp`, `formatReflectionEntry`)
- Lines 68-91: `saveReflection` wrapped in `tracer.startActiveSpan('commit_story.reflection.save', ...)`
- Lines 97-127: unchanged `registerReflectionTool` export

**Line-by-line comparison at the NDS-003 site (original lines 109-113)**:

| Original | Original content | Debug dump line | Debug dump content |
|----------|-----------------|-----------------|-------------------|
| 109 | `        };` | 123 | `        };` |
| 110 | `      }` | 124 | `      }` |
| 111 | `    }` | 125 | `    }` |
| 112 | `  );` | 126 | `  );` |
| 113 | `}` | 127 | `}` |

All original content is present and structurally intact in the debug dump. The NDS-003 failure references "original line 116" which does not exist in the 113-line original — confirming the prior-attempt-output-as-baseline hypothesis.

---

### Rule Evaluation (debug dump as proxy for committed code)

**Note**: This file was not committed. Rule evaluations reflect the debug dump quality — what the agent intended to commit. Failure classifications below account for the reconciler root cause where applicable.

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **FAIL (reconciler gap)** | Validator flagged lines 116-117 missing from a 113-line original. All original content is present in the debug dump at shifted positions. The agent did not modify, remove, or reorder any original code. This is a validator baseline mismatch, not an agent error. |
| NDS-004 | PASS | Multi-line `server.tool()` call with the long description string (`'Add a timestamped reflection...'`) preserved across lines 99-100 exactly as in the original. No line joining. |
| NDS-005 | PASS | The `try/catch` inside the `server.tool()` async callback (original lines 91-110) is fully preserved at lines 105-124 in the debug dump. No control flow removed. |
| NDS-006 | PASS | No blank lines added or removed within function bodies. Blank line between imports and `SEPARATOR` constant preserved. |
| NDS-007 | PASS — the `catch (error)` in the `server.tool()` callback is graceful-degradation (returns error response object, no rethrow). No `recordException` or status change added there. The span-level `catch` in `saveReflection` correctly records exception and rethrows. |
| COV-001 | PASS (for this file's structure) — `registerReflectionTool` is synchronous (RST-001 exemption); COV-001 override does not apply. `saveReflection` is the async I/O entry point, instrumented correctly. |
| COV-003 | PASS — `saveReflection` span wrapper includes `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, and `throw error` in its catch block. Correct error-recording pattern with rethrow. |
| COV-004 | PASS — `saveReflection` (unexported async, sole async I/O function) instrumented per RST-004 exception. `registerReflectionTool` (sync export) correctly skipped per RST-001. Three pure sync helpers correctly skipped per RST-001. |
| COV-005 | PASS — `commit_story.journal.file_path` set from `filePath` return value of `getReflectionsPath`. Schema-registered attribute. No PII in the path (date-based directory structure only). Text parameter correctly excluded (PII risk). |
| RST-001 | PASS — `getReflectionsPath`, `formatTimestamp`, `formatReflectionEntry` are pure sync helpers; all correctly skipped. |
| RST-004 | PASS — `saveReflection` instrumented correctly under RST-004 exception: unexported, no exported orchestrator with a span covers this execution path. Agent reasoning in attempt-1 and attempt-3 both correctly identified this exception. |
| API-001 | PASS — `trace` and `SpanStatusCode` imported from `@opentelemetry/api` only. No SDK imports. |
| API-004 | PASS — no SDK-internal imports. |
| SCH-001 | PASS — `commit_story.reflection.save` is declared as a schema extension in agent notes. Not present in `semconv/attributes.yaml`. The naming follows the `commit_story.<category>.<operation>` convention. No semantic collision with existing registry entries (`commit_story.journal.save_entry` is a different operation class — persistence of a reflection vs. a dated journal entry). |
| SCH-002 | PASS — `commit_story.journal.file_path` is a registered attribute in `semconv/attributes.yaml` (`registry.commit_story.journal` group). Correct key, no new attribute invented. |
| SCH-003 | PASS — `commit_story.journal.file_path` is `type: string`; set from `filePath` which is a string (return value of `path.join()`). |
| CDQ-001 | PASS — span closed in `finally` block via `span.end()` inside `startActiveSpan` callback. The `try/catch/finally` pattern in `saveReflection` ensures the span is always closed regardless of success or error path. |
| CDQ-005 | PASS — `tracer.startActiveSpan` used; span is active on the context stack during `saveReflection` execution. |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` used at module level. Canonical tracer name matches `spiny-orb.yaml` `tracerName`. |
| CDQ-007 | PASS — `filePath` is not a nullable property access; it is the return value of `getReflectionsPath(now)` which always returns a `path.join()` string. No optional chaining in `setAttribute`. `basename` not imported — raw project-relative path used directly (advisory per CDQ-007 import constraint, consistent with journal-manager.js and journal-paths.js patterns across run-16). |

**Failures**: NDS-003 only — and this is a reconciler gap, not an agent instrumentation error. The debug dump contains correct, complete instrumentation. The span approach, attribute selection, error recording, and skip decisions are all well-reasoned and compliant.

---

### Run-over-Run Comparison

| Dimension | Run-16 | Run-17 |
|-----------|--------|--------|
| Outcome | FAILED (token exhaustion, null parsed_output) | FAILED (NDS-003 oscillation) |
| Instrumentation produced | None (run terminated before this file) | Complete instrumentation in debug dump |
| Agent reasoning quality | N/A | High — correctly identified RST-004 exception, PII exclusion, span pattern |
| Root cause | Infrastructure (budget exhaustion) | Tooling (validator baseline mismatch) |
| Actionable for agent? | No | No — agent cannot resolve a validator comparing against wrong baseline |

Run-17 represents a meaningful improvement over run-16 for this file: the agent reached the file, produced correct instrumentation, and demonstrated sound rule application. The failure is entirely attributable to the same reconciler gap that caused `context-capture-tool.js` to fail in the same run. The agent's instrumented code in the debug dump would pass all rules if committed.

---

### Span Name Note

The agent used `commit_story.reflection.save` in the debug dump but `commit_story.journal.save_reflection` in attempt-1 thinking. The debug dump reflects the final attempt (attempt-3) span name. Both names follow the convention; `commit_story.reflection.save` is cleaner and avoids semantic overlap with `commit_story.journal.save_entry`. Either is acceptable as a schema extension.

---

### src/index.js — ❌ FAILED (2 NDS-003, 3 attempts)

**Outcome**: Not committed. 2 NDS-003 violations on the final attempt. Nothing was committed. This file was successfully committed in runs 12, 13, 14, 15, and 16 — run-17 is a new regression.

---

#### Failure Analysis

**Validator-reported violations (last attempt):**

| Validator message | Original line | Original content (truncated in error output) |
|-------------------|---------------|----------------------------------------------|
| NDS-003: original line 217 missing/modified: ); | 217 | `    console.error(\`\n❌ ${parsed.error}\n\`);` (the `);` is the terminal characters of this template literal) |
| NDS-003: original line 375 missing/modified: }, | 375 | Not matching any single-line `},` at this position — likely a truncated display of a multi-line expression close |

**What the agent actually produced (debug dump, attempt 3):**

The diff between original and debug dump shows:

1. **Import expansion (correct in attempt 3):** Three single-line imports were expanded to multi-line form:
   - `import { saveJournalEntry, discoverReflections }` → 4-line form (+3 lines)
   - `import { isJournalEntriesOnlyCommit, isMergeCommit, shouldSkipMergeCommit, isSafeGitRef }` → 5-line form (+4 lines)
   - `import { parseSummarizeArgs, runSummarize, runWeeklySummarize, runMonthlySummarize, showSummarizeHelp }` → 6-line form (+5 lines)

2. **OTel import + tracer init added (correct):**
   - Line 22: `import { trace, SpanStatusCode } from '@opentelemetry/api';`
   - Line 54: `const tracer = trace.getTracer('commit-story');`
   - Plus 1 blank line (net +3 lines total for these additions)

3. **Filter chains expanded (correct):** The three `.filter(p => p.includes(...))` chains inside `main()` were expanded to multi-line form (e.g., `filter(p =>` / `  p.includes('daily'),` / `).length`).

4. **`main()` wrapped with `startActiveSpan` (correct approach):** The entire function body is enclosed in `tracer.startActiveSpan('commit_story.cli.main', async (span) => { try { ... } catch (error) { ... } finally { span.end(); } });`. Span attribute set after destructuring: `span.setAttribute('vcs.ref.head.revision', commitRef);`.

**Net line shift from all additions:** The instrumented file has approximately 15 more lines before the original `main()` function body begins (3+4+5 import expansion lines + 1 OTel import + 1 blank + 1 tracer declaration + 1 blank = 16 extra lines). Within `main()`, the `startActiveSpan` wrapper adds a `return tracer.startActiveSpan(...)` wrapper, `try {`, and additional indentation throughout.

**Root cause (reconciler off-by-one, not agent error):** The debug dump shows the agent correctly restored all original business logic. The content of original line 217 (`console.error(...)`) is present in the output — it appears at line 234 of the debug dump (shifted by +17 due to all the additions). The NDS-003 reconciler did not correctly account for the combined line shift from multi-line import expansion + OTel import additions + `startActiveSpan` wrapper additions. The reconciler's offset calculation for this specific combination of changes produced a residual off-by-one at lines 217 and 375 of the original.

**Evidence from agent thinking (attempt 2→3):** The agent's thinking block shows it correctly diagnosed the problem during attempt 2:
> *"The imports need to be expanded across multiple lines, which would shift all subsequent line numbers down... the filter chains for daily, weekly, and monthly counts need to be restored... I need to figure out where those mysterious `);` and `},` issues are coming from."*

The agent tried to resolve this in attempt 3 by expanding imports and filter chains. The output is semantically correct — the instrumented file is a valid, correct OTel instrumentation. But 2 positions remain unresolvable by the reconciler.

**Contrast with content corruption (journal-graph.js):** Unlike journal-graph.js where the agent dropped characters inside template literals (content was modified), here the original content is preserved verbatim — it's just not at the positions the reconciler expects. This is the same reconciler gap pattern seen in context-capture-tool.js and reflection-tool.js, not an agent-quality issue.

---

#### Instrumentation Quality (debug dump)

Even though the file failed to commit, the instrumentation approach in the debug dump is evaluated here for quality assessment and forward guidance.

**Functions evaluated:**
- `main()` — async entry point, unexported but covered by COV-001 (entry point rule overrides RST-004)
- `handleSummarize()` — unexported async, correctly skipped per RST-004
- All other functions (`debug`, `parseArgs`, `showHelp`, `isGitRepository`, `isValidCommitRef`, `validateEnvironment`, `getPreviousCommitTime`) — sync utilities, correctly skipped per RST-001

| Rule | Result |
|------|--------|
| NDS-003 | FAIL — 2 residual violations (reconciler off-by-one at original lines 217 and 375; content correct in dump, positions shifted by multi-line import expansion + startActiveSpan additions) |
| NDS-004 | PASS — no function parameter signatures modified |
| NDS-005 | PASS — all original try/catch blocks preserved; inner auto-summarize try/catch at original line 490 preserved at line 541 in output; outer `.catch()` on `main().catch(...)` preserved |
| NDS-006 | PASS — no imports removed |
| NDS-007 | PASS — no catch blocks in the original `main()` body that swallow exceptions; the new outer catch added by the agent correctly re-throws after recording |
| COV-001 | PASS (in dump) — `main()` is the CLI entry point and receives a span per COV-001 override of RST-004; `commit_story.cli.main` span wraps the entire function body |
| COV-002 | N/A — no outbound HTTP/DB calls in `main()` |
| API-001 | PASS — `trace.getTracer` and `tracer.startActiveSpan` used correctly; `SpanStatusCode.ERROR` imported from `@opentelemetry/api` |
| API-004 | PASS — no SDK-internal imports |
| SCH-001 | PASS — `commit_story.cli.main` is not in the OTel standard registry; declared as a schema extension; name follows the `commit_story.<domain>.<operation>` convention |
| SCH-002 | PASS — `vcs.ref.head.revision` is a registered attribute (VCS semconv, used in 4 other files this run) |
| SCH-003 | PASS — `vcs.ref.head.revision` set from `commitRef` (string, the raw CLI argument or `'HEAD'`; correct type) |
| CDQ-001 | ADVISORY — `span.end()` in the `finally` block covers the normal code path. The numerous `process.exit()` calls within `main()` bypass `finally` and will leak the span at runtime. This is a known RST-006 limitation for entry-point functions. The agent noted this explicitly: *"The span's finally block will not run for process.exit() code paths — those exits will leak the span at runtime."* COV-001 overrides RST-006, so the span is required despite the leak. Advisory, not a failure. |
| CDQ-005 | PASS — no hardcoded string attributes |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` matches the canonical tracer name in spiny-orb.yaml |
| COV-004 | PASS — `main()` is the only async entry point; `handleSummarize()` is unexported and correctly skipped (covered as child execution under `main`'s span) |
| COV-005 | PASS — `vcs.ref.head.revision` set from `commitRef` immediately after destructuring; captures the commit being processed, which is the meaningful operational attribute for this span |
| RST-001 | PASS — all 7 sync utility functions (`debug`, `parseArgs`, `showHelp`, `isGitRepository`, `isValidCommitRef`, `validateEnvironment`, `getPreviousCommitTime`) correctly skipped |
| RST-004 | PASS — `handleSummarize()` (unexported async) correctly skipped; execution covered by `main()` span |
| RST-006 | ADVISORY — `main()` contains direct `process.exit()` calls; COV-001 takes precedence; span leak on exit paths is expected and documented |
| CDQ-007 | PASS — `commitRef` is always a string (initialized to `'HEAD'`, overwritten with a CLI argument string); no nullable property access in setAttribute |

**Failures in dump**: NDS-003 (reconciler gap only; content is correct)

**COV-003 note**: No catch blocks in the original `main()` body — the outer `.catch()` on `main().catch(...)` is already in the original and handles unexpected errors by logging and calling `process.exit(EXIT_ERROR)`. The new `catch` block added by the agent inside the `startActiveSpan` wrapper correctly records the exception and re-throws so the outer `.catch()` handler still fires. This is the correct COV-003 pattern for entry-point functions with pre-existing outer error handling.

---

#### Why This Is a Regression from Prior Runs

In runs 12–16, `src/index.js` was committed successfully. The difference in run-17:

- **New in run-17**: The agent added a `startActiveSpan` wrapper to `main()`. Prior runs had no instrumentation attempt on this file, or the reconciler successfully handled simpler transformations.
- **The specific NDS-003 trigger**: The combination of expanded multi-line imports (required since run-17's source presentation shows single-line imports that spiny-orb expands) plus the `startActiveSpan` wrapper produces a line offset the reconciler cannot fully resolve. Prior runs did not add a span to `main()`, so the multi-line import expansion alone was sufficient to commit.
- **Attempt count**: All 3 attempts were used. The attempt 1→2 transition identified the import/filter-chain issue. Attempt 2→3 improved the output but could not resolve the 2 residual violations.

---

#### Spiny-orb Issue

This is the same reconciler gap documented for context-capture-tool.js and reflection-tool.js in this run. The pattern: `startActiveSpan` wrapping adds indentation throughout a function body, and the combined offset from (a) multi-line import expansion and (b) span wrapper additions produces an NDS-003 off-by-one at specific line positions. The instrumented code is semantically correct. The NDS-003 reconciler needs to handle this combination of offset sources.

See also: failure-deep-dives.md §index.js for the cross-file hypothesis linking this to the thinking budget cap (PR #852) and context growth from being file 30/30.

---

## Correct Skips (15)

## Correct Skips (15)

Files evaluated in this section: 12 pre-scan skips (no LLM call made) and 3 function-level fallback 0-span files (LLM call made, 0 spans added, original returned unchanged).

RST-001 is the governing rule for all skips: no spans on synchronous functions with no async or network/disk operations. The skip decision is correct when every exported function in the file is synchronous and performs no I/O.

---

### Pre-Scan Skips (12)

Pre-scan skips trigger when the agent finds no exported async functions before invoking the LLM. Log message for all 12: "Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made."

| File (run-17 file #) | Exported symbols | Async? | I/O? | Skip verdict |
|---|---|---|---|---|
| `generators/prompts/guidelines/accessibility.js` (file 3) | `accessibilityGuidelines` (const string) | No | No | **CORRECT** |
| `generators/prompts/guidelines/anti-hallucination.js` (file 4) | `antiHallucinationGuidelines` (const string) | No | No | **CORRECT** |
| `generators/prompts/guidelines/index.js` (file 5) | `getAllGuidelines()` (sync), re-exports of `antiHallucinationGuidelines` and `accessibilityGuidelines` | No | No | **CORRECT** |
| `generators/prompts/sections/daily-summary-prompt.js` (file 6) | `dailySummaryPrompt(entryCount)` (sync) | No | No | **CORRECT** |
| `generators/prompts/sections/dialogue-prompt.js` (file 7) | `dialoguePrompt` (const string) | No | No | **CORRECT** |
| `generators/prompts/sections/monthly-summary-prompt.js` (file 8) | `monthlySummaryPrompt(weekCount)` (sync) | No | No | **CORRECT** |
| `generators/prompts/sections/summary-prompt.js` (file 9) | `summaryPrompt(hasFunctionalCode, hasSubstantialChat)` (sync) | No | No | **CORRECT** |
| `generators/prompts/sections/technical-decisions-prompt.js` (file 10) | `technicalDecisionsPrompt` (const string) | No | No | **CORRECT** |
| `generators/prompts/sections/weekly-summary-prompt.js` (file 12) | `weeklySummaryPrompt(dayCount)` (sync) | No | No | **CORRECT** |
| `integrators/filters/sensitive-filter.js` (file 15) | `redactSensitiveData`, `redactDiff`, `redactMessages`, `applySensitiveFilter` (all sync) | No | No | **CORRECT** |
| `traceloop-init.js` (file 21) | No exports; top-level module-init code with conditional `await import` | No exported functions | No | **CORRECT** |
| `utils/config.js` (file 23) | `config` (frozen const object) | No | No | **CORRECT** |

**Notes:**

- `generators/prompts/guidelines/index.js`: `getAllGuidelines()` is a pure synchronous string-concatenation function. Although it calls `antiHallucinationGuidelines` and `accessibilityGuidelines`, those are string constants — no I/O, no async path. Skip is correct.

- `integrators/filters/sensitive-filter.js`: All four exported functions (`redactSensitiveData`, `redactDiff`, `redactMessages`, `applySensitiveFilter`) are synchronous regex-based text transformers. The pre-scan note says "no async" — confirmed by source inspection. Skip is correct.

- `traceloop-init.js`: The file contains a top-level `if` block with `await import(...)` inside it, but this is module-level initialization code, not an exported function. There are no exported symbols at all. The pre-scan cannot find instrumentable async functions because there are no functions — only top-level conditional initialization. Skip is correct.

- `utils/config.js`: Single `config` frozen object export; no functions, no async. Skip is correct.

---

### Function-Level Fallback — 0-Span Files (3)

These files triggered the function-level fallback (LLM was invoked per-function), but the agent produced 0 spans for all functions and returned the original file unchanged.

---

#### `integrators/filters/message-filter.js` (file 14, 0 spans, 3 attempts)

**Exported functions**: `filterMessages(messages)`, `groupFilteredBySession(messages)`

**Agent notes**: "Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made." / "Function-level fallback: 0/2 functions instrumented"

**Source analysis**:
- `filterMessages`: Iterates over a message array applying synchronous predicate functions (`shouldFilterMessage`, `isSystemNoiseMessage`, `isPlanInjectionMessage`, `isTooShortMessage`, `isSubstantialMessage`). No async operations. No network or disk I/O. Returns filtered array and stats object. Entirely synchronous.
- `groupFilteredBySession`: Builds a `Map` from the filtered message array. Entirely synchronous.
- All six helper functions (`isTooShortMessage`, `isSubstantialMessage`, `isSystemNoiseMessage`, `isPlanInjectionMessage`, `shouldFilterMessage`, `extractTextContent`) are unexported and synchronous.

**RST-001 verdict**: Both exported functions are synchronous pure data transformers. No async I/O. 0-span decision is **CORRECT**.

**RUN16-3 fix check**: Not applicable — this file has no try/catch blocks whose removal would be a concern. Original returned unchanged confirms no destructive edits occurred.

---

#### `integrators/filters/token-filter.js` (file 16, 0 spans, 3 attempts)

**Exported functions**: `estimateTokens(text)`, `truncateDiff(diff, maxTokens)`, `truncateMessages(messages, maxTokens)`, `applyTokenBudget(context, options)`

**Agent notes**: "Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made." / "Function-level fallback: 0/3 functions instrumented"

**Note**: The agent reports 3 functions in the fallback (`truncateDiff`, `truncateMessages`, `applyTokenBudget`) — consistent with pre-scan identifying `estimateTokens` as a trivial utility already at the boundary of COV-004 scope, and the fallback covering the three more substantive functions.

**Source analysis**:
- `estimateTokens`: Single-expression math on string length. Entirely synchronous.
- `truncateDiff`: String operations (substring, lastIndexOf). No I/O. Entirely synchronous.
- `truncateMessages`: Array iteration and string estimation. No I/O. Entirely synchronous.
- `applyTokenBudget`: Calls `truncateDiff` and `truncateMessages` (both sync). Builds a result object. No I/O. Entirely synchronous.
- Internal helper `formatMessagesForEstimation`: Synchronous string formatting.

**RST-001 verdict**: All exported functions are synchronous data transformers. No async I/O. 0-span decision is **CORRECT**.

**RUN16-3 fix check**: No try/catch blocks in this file. Original returned unchanged confirms no destructive edits occurred.

---

#### `utils/commit-analyzer.js` (file 22, 0 spans, 3 attempts) ★ RUN16-3 fix verification

**Exported functions**: `isSafeGitRef(ref)`, `getChangedFiles(commitRef)`, `isJournalEntriesOnlyCommit(commitRef)`, `isMergeCommit(commitRef)`, `shouldSkipMergeCommit(commitRef, context)`, `getCommitMetadata(commitRef)`

**Agent notes**: "Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made." / "Function-level fallback: 0/2 functions instrumented" (agent noted `isJournalEntriesOnlyCommit` and `shouldSkipMergeCommit` in fallback)

**Source analysis**:

The critical evaluation question for this file is whether `getChangedFiles`, `isMergeCommit`, and `getCommitMetadata` constitute async I/O warranting spans. They call `execFileSync` — the **synchronous** variant of child process execution. Despite making system calls (git invocations), all three functions are synchronous: they block the event loop until the subprocess returns, have no `async`/`await`, and return synchronously.

- `isSafeGitRef`: Pure regex test. Synchronous.
- `getChangedFiles`: Calls `execFileSync('git', ...)` with a try/catch. Synchronous I/O. No `async`/`await`.
- `isJournalEntriesOnlyCommit`: Calls `getChangedFiles` (sync) and `Array.every`. Synchronous.
- `isMergeCommit`: Calls `execFileSync('git', ...)` with a try/catch. Synchronous I/O. No `async`/`await`.
- `shouldSkipMergeCommit`: Calls `isMergeCommit` (sync). Synchronous.
- `getCommitMetadata`: Calls `execFileSync('git', ...)`. Synchronous I/O. Throws on error.

**RST-001 verdict**: No function in this file is `async`. `execFileSync` is synchronous child process execution, not async I/O. RST-001 exemption applies: "no async or network/disk operations" means no *async* operations — synchronous blocking calls do not create observability gaps that spans address. 0-span decision is **CORRECT**.

**RUN16-3 fix verification**: The RUN16-3 fix addressed the bug where the agent was stripping try/catch blocks during instrumentation and returning the modified (broken) file even when it produced 0 spans. This file has three try/catch blocks:

1. `getChangedFiles` — `try { execFileSync(...) } catch { return []; }` — graceful fallback
2. `isMergeCommit` — `try { execFileSync(...) } catch { return { isMerge: false, parentCount: 1 }; }` — graceful fallback
3. `getCommitMetadata` — `try { execFileSync(...) } catch (error) { throw new Error(...) }` — rethrows with context

All three are present in `main:src/utils/commit-analyzer.js`. The agent returned the original file unchanged (0 spans, 0 token output confirms no LLM edit was applied). The RUN16-3 fix is **verified working** for this file: try/catch blocks are intact, original file returned unchanged.
