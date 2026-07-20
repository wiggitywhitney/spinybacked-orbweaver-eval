# Per-File Evaluation — Run-26

**Date**: 2026-07-17
**Branch**: spiny-orb/instrument-1784302707982
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 32 (14 committed + 0 partial + 18 correct skips)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check` exits 0 on all 14 committed files, zero syntax failures |
| NDS-002 (Tests) | **PASS** | 630 tests pass, 1 skipped (631 total, 29 test files, 28 passed + 1 skipped); duration 1.13s. The 1 skipped test is `tests/acceptance-gate.test.js` (requires a live API key) |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `package.json` `peerDependencies` contains `"@opentelemetry/api": "^1.9.0"` |
| API-003 | **PASS** | `dependencies` block contains only `@langchain/anthropic`, `@langchain/core`, `@langchain/langgraph`, `@modelcontextprotocol/sdk`, `@opentelemetry/instrumentation-pino`, `dotenv`, `pino`, `zod` — no vendor-specific observability SDKs (grep for `datadog\|dd-trace\|newrelic\|honeycomb` returns nothing) |
| API-004 | **PASS** | Grep for `@opentelemetry/sdk\|@opentelemetry/exporter\|@opentelemetry/resources\|@opentelemetry/instrumentation-` in `src/` returns nothing; these packages only appear in `devDependencies` |
| CDQ-008 | **PASS** | `grep -rn "getTracer" src/` confirms all 14 committed files use `trace.getTracer('commit-story')` with the identical string, no variants |

---

## Committed Files (14)

### 1. collectors/claude-collector.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — try/catch/finally preserved around `collectChatMessages`; `span.recordException` + `SpanStatusCode.ERROR` + rethrow, `span.end()` in `finally` |
| COV-001 | PASS — `collectChatMessages` is the sole entry point, wrapped in `tracer.startActiveSpan` |
| COV-003 | PASS — span always ended via `finally` block, including error path |
| COV-004 | PASS — `collectChatMessages` is the only exported async function; `getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `parseJSONLFile`, `filterMessages`, `groupBySession` are all exported but synchronous |
| COV-005 | PASS — 5 domain attributes: `commit_story.context.source`, `time_window_start`, `time_window_end`, `sessions_count`, `messages_count`; confirmed present on the live trace (see note below) |
| RST-001 | PASS — 7 synchronous exported utilities correctly left unwrapped |
| RST-004 | PASS — not applicable (no unexported async I/O helpers in this file) |
| SCH-001 | PASS — all attributes namespaced under `commit_story.context.*` |
| SCH-002 | PASS — no semantic duplicates; all 5 attributes were already registered, no new schema extensions needed |
| SCH-003 | PASS — `time_window_start`/`time_window_end` are strings via `.toISOString()`; `sessions_count`/`messages_count` are numbers via `.size`/`.length` |
| CDQ-001 | PASS — single `span.end()` in `finally`, no redundant calls |
| CDQ-002 | PASS — `trace.getTracer('commit-story')` matches project convention |
| CDQ-003 | PASS — `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` before rethrow |
| CDQ-005 | PASS — no nullable-derived attribute values; source is a literal, counts are guaranteed numbers, dates typed as `Date` per JSDoc |
| CDQ-007 | PASS — all 5 attributes set unconditionally but from non-nullable sources (literal string, `.size`/`.length`, JSDoc-typed `Date.toISOString()`); zero-value counts explicitly set on the early-return path so CDQ-006 entry-point exemption is satisfied without any guard gaps |

**Failures**: None

**Datadog trace supplement**: 1 matching span found for `commit_story.claude.collect_chat_messages` (`service:commit-story @service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6`), confirming all 5 `commit_story.context.*` attributes are present on the live span, consistent with the source-level COV-005 assessment above. This trace corresponds to a later commit-story-v2 run (git SHA `8bea3922`), not run-26 itself, but the span shape matches the code reviewed here.

---

### 2. collectors/git-collector.js (2 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — imports `SpanStatusCode`, `trace` from `@opentelemetry/api`; `tracer.startActiveSpan` used correctly in both instrumented functions |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — try/catch/finally with `recordException` + `setStatus(ERROR)` preserved in both spans; original error-mapping logic in `runGt` untouched |
| COV-001 | PASS — `getPreviousCommitTime` and `getCommitData` are the two exported entry points, both spanned |
| COV-003 | PASS — invented schema-namespaced span names (`commit_story.git.get_previous_commit_time`, `commit_story.git.get_commit_data`) since no pre-existing schema span matched |
| COV-004 | PASS — `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` are unexported async helpers with no spans; RST-004 exemption applies (COV-004 advisories fired for all four in the instrumentation report but are non-blocking) |
| COV-005 | PASS — `getPreviousCommitTime` carries `vcs.ref.head.revision` + `commit_story.commit.timestamp`; `getCommitData` carries only `vcs.ref.head.revision` (unresolved input ref, not the resolved SHA). **Coverage delta observation**: run-25/run-12 versions of `getCommitData` carried 3 attributes (`vcs.ref.head.revision`, `commit_story.commit.message`, `commit_story.commit.author`); this run's `getCommitData` dropped to a single attribute — a real reduction, but COV-005 still passes since ≥1 domain attribute is present |
| RST-001 | PASS — no sync utilities in this file requiring spans |
| RST-004 | PASS — unexported async I/O helpers correctly left unspanned |
| SCH-001 | PASS — both surviving attributes are registry-defined keys, no ad hoc invented attribute names in the final output |
| SCH-002 | PASS (after 3 retries) — Validation Journey shows Attempt 1: 4 SCH-002 blocking errors, Attempt 2: 3, Attempt 3: 2, before falling back to function-level regeneration that dropped every non-registry attribute; final committed code has zero SCH-002 violations |
| SCH-003 | PASS — `commit_story.commit.timestamp` is a raw ISO string from `git log --format=%aI` (string type, matches registry) |
| CDQ-001 | PASS — single `span.end()` call in `finally`, no redundant calls |
| CDQ-002 | PASS — `SpanStatusCode.ERROR` set consistently on the exception path in both spans |
| CDQ-003 | PASS — errors are recorded then rethrown, no silent swallowing |
| CDQ-005 | PASS |
| CDQ-007 | PASS — the diff content returned by `getCommitDiff` (unbounded, potentially large/sensitive) is never captured as a span attribute anywhere in the file |

**Datadog trace supplement**: Live spans found for both `commit_story.git.get_previous_commit_time` and `commit_story.git.get_commit_data` (trace `3722a802e3cf1bc1c0bc5428509d2ce7`, `service:commit-story`, matching `service.instance.id`). Runtime data confirms the source read: `get_previous_commit_time` carries `commit_story.commit.timestamp`; `get_commit_data` carries only `vcs.ref.head.revision` under the `vcs` namespace, no `commit_story.*` custom attribute — matching the static analysis exactly.

**diff_lines watch item**: `diff_lines` is **not present** as a span attribute in this run — neither in the committed source, the instrumentation report's schema extensions, nor the live trace data. The diff string itself (from `getCommitDiff`) is never captured as an attribute at all (consistent with CDQ-007 avoiding unbounded content), so the SCH-003 type-correctness question for `diff_lines` doesn't arise this run. The instrumentation report's "0 attributes" figure refers to zero *new* schema extensions (both surviving attributes, `vcs.ref.head.revision` and `commit_story.commit.timestamp`, are pre-existing registry keys) — it does not mean the spans carry no attributes at all.

**Failures**: None. The 3-attempt count is fully explained by the Validation Journey (SCH-002 registry-mismatch errors on Attempts 1–3, resolved via function-level fallback that dropped non-compliant attributes) — no hint in the log of `diff_lines` specifically being attempted and rejected, since no per-attempt "Agent thinking" block was printed for this file (only Attempt 1 of some other files show detailed reasoning; this file's retries were fully silent).

---

### 3. integrators/context-integrator.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS — `gatherContextForCommit` is the sole exported orchestrator/callable boundary; instrumented as entry point |
| COV-003 | PASS |
| COV-004 | PASS — `formatContextForPrompt` and `getContextSummary` are pure synchronous helpers, correctly skipped (RST-001) |
| COV-005 | PASS — despite the log's summary line reading "1 span, 0 attributes," source inspection and the live Datadog trace both confirm 9 setAttribute calls with meaningful domain data: `vcs.ref.head.revision`, `commit_story.commit.message`/`.timestamp`, `commit_story.filter.messages_before`/`messages_after`, `commit_story.context.messages_count`/`sessions_count`/`time_window_start`/`time_window_end`. The "0 attributes" figure reflects `attributesCreated` (new schema-extension attributes) per agent notes — all 9 keys reused existing schema-registered attributes, so the count is 0 new extensions, not 0 attributes set in code. No substantial attribute-set delta from prior runs; same attribute set as the run-12 style-reference entry for this file. |
| RST-001 | PASS — 2 sync functions (`formatContextForPrompt`, `getContextSummary`) correctly unspanned |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.context.gather_context_for_commit` invented and declared via `schemaExtensions` since no schema span matched `gatherContextForCommit` |
| SCH-002 | PASS — all 9 attributes map to existing schema keys, no near-duplicate invented |
| SCH-003 | PASS — `commitData.timestamp` and `timeWindow.start`/`end` (Date objects) consistently converted via `.toISOString()` before `setAttribute` |
| CDQ-001 | PASS — single `span.end()` in `finally`, no redundant calls |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `vcs.ref.head.revision` is set twice (input `commitRef` at span open, then overwritten with `commitData.hash` after the await resolves), which the agent's thinking flagged as intentional and non-problematic; `commitData.hash`/`.message`/`.timestamp` are populated fields of a successfully-resolved commit object (no nullable-field risk), unlike the `journal-manager.js` CDQ-007 failure pattern seen in the run-12 reference. `isRecording()` guards are correctly omitted per the COV-001 entry-point exemption from CDQ-006. |

**Datadog trace supplement**: 1 matching span found (`commit_story.context.gather_context_for_commit`, service `commit-story`, matching `service.instance.id`) — live trace data confirms all 9 attributes listed above are present and populated, corroborating the source-code review over the misleading "0 attributes" log summary line.

**Failures**: None.

---

### 4. generators/journal-graph.js (4 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — only `@opentelemetry/api` (`trace`, `SpanStatusCode`) imported |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — try/catch/finally structure in all four instrumented functions preserved; `finally { span.end(); }` intact in `summaryNode`, `technicalNode`, `dialogueNode`, `generateJournalSections` |
| COV-001 | PASS — `generateJournalSections` (exported entry point) has a span |
| COV-003 | PASS — `generateJournalSections` calls `span.recordException` + `setStatus(ERROR)` on failure; the three LangGraph node functions catch and accumulate into `state.errors` (graceful-degradation pattern) without marking span status, consistent with this file's established pattern across runs |
| COV-004 | PASS — 4 async functions (`summaryNode`, `technicalNode`, `dialogueNode`, `generateJournalSections`) instrumented; 8 pure sync helpers (`analyzeCommitContent`, `generateImplementationGuidance`, `formatSessionsForAI`, `formatContextForSummary`, `formatContextForUser`, `cleanDialogueOutput`, `cleanTechnicalOutput`, `cleanSummaryOutput`) correctly skipped per RST-001 |
| COV-005 | PASS — every span carries ≥1 meaningful attribute (`commit_story.ai.section_type`, `gen_ai.operation.name`/`request.temperature`, `commit_story.ai.substantial_user_messages`, `commit_story.ai.max_quotes`, `vcs.ref.head.revision`) |
| COV-006 | PASS — manual spans in `summaryNode`/`technicalNode`/`dialogueNode` wrap the `getModel(...).invoke(...)` calls into auto-instrumented `ChatAnthropic`/LangChain, same pattern as run-12's reference entry — still applicable this run |
| RST-001 | PASS — no spans on the 8 sync utility functions |
| RST-004 | PASS — not triggered; no unexported async I/O function present in this file |
| SCH-001 | PASS — 6 schema extensions declared (4 span names + `commit_story.ai.substantial_user_messages` + `commit_story.ai.max_quotes`) |
| SCH-002 | PASS |
| SCH-003 | PASS — `substantial_user_messages`/`max_quotes`/`request.temperature` are numeric; `section_type` is string |
| CDQ-001 | PASS — single `span.end()` per node, no redundant calls |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS — consistent `trace.getTracer('commit-story')` |
| CDQ-007 | PASS — `vcs.ref.head.revision` guarded with `?? ''`; `substantial_user_messages` guarded with `?? 0`; no unconditional `setAttribute` from a nullable field; `gen_ai.usage.*` attributes dropped again this run, same avoidance strategy noted in run-12/run-11 |

**Datadog trace supplement**: Confirmed — all 4 spans (`commit_story.ai.generate_summary`, `commit_story.ai.generate_technical_decisions`, `commit_story.ai.generate_dialogue`, `commit_story.ai.generate_journal_sections`) appear live in trace `3722a802e3cf1bc1c0bc5428509d2ce7` (service `commit-story`, `service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6`), carrying the expected `commit_story.ai.*`/`gen_ai.*` attributes — the instrumentation fires correctly at runtime, not just at validation time.

**3-attempt note**: The log's entry for this file contains no "Agent thinking" reasoning block at all — only the final `✅ SUCCESS — 4 spans, 2 attributes, 3 attempts` line, schema extensions, and agent notes. Unlike some other files in this run (e.g. `context-capture-tool.js`), even Attempt 1's reasoning is absent here, so the log provides no detail on what triggered retries 2 and 3 or what changed between attempts — no root cause can be attributed from available evidence.

**Failures**: None.

---

### 5. generators/summary-graph.js (6 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — try/catch/finally structure preserved in all three graph nodes; inner LLM-call try/catch still returns fallback text + accumulates `errors[]` |
| API-001 | PASS — `trace`/`SpanStatusCode` imported from `@opentelemetry/api`; `tracer.startActiveSpan` used throughout |
| NDS-006 | PASS |
| NDS-004 | PASS — business logic (parsing, formatting, banned-word cleanup) unchanged |
| NDS-007 | PASS — no control-flow removal; outer catch still calls `span.recordException` + `setStatus(ERROR)` before rethrow |
| COV-001 | PASS — all 6 entry points (3 LangGraph nodes + 3 `generate*` orchestrators) have spans |
| COV-003 | PASS — no duplicate/nested spans per function |
| COV-004 | PASS — all async functions instrumented; sync `format*`/`clean*` helpers correctly left span-free |
| COV-005 | PASS — every span carries ≥1 domain attribute (`entries_count`, `entry_date`, `section_type`, `week_label`, `month_label`, `gen_ai.request.temperature`); attribute set is consistent with the run-12 baseline for this file, no coverage delta observed |
| COV-006 | PASS — manual node spans (`commit_story.ai.generate_*_summary`) wrap application logic sitting above the auto-instrumented `ChatAnthropic.invoke()` call, same pattern as journal-graph.js |
| RST-001 | PASS — `formatEntriesForSummary`, `cleanDailySummaryOutput`, and equivalent weekly/monthly helpers are sync-only and correctly instrumented with 0 spans |
| RST-004 | PASS — all instrumented functions are exported; no unexported-helper span gaps |
| SCH-001 | PASS — all custom attributes namespaced under `commit_story.*` |
| SCH-002 | PASS — validation journey shows 3 blocking SCH-002 errors on attempts 1–2, resolved by the final committed attempt; final attribute keys (`commit_story.journal.entries_count`, `commit_story.journal.week_label`, `commit_story.journal.month_label`, `commit_story.ai.section_type`) match the registry |
| SCH-003 | PASS — `entries_count` is int, `week_label`/`month_label`/`entry_date` are strings, `gen_ai.request.temperature` is float |
| CDQ-001 | PASS — single `span.end()` per span via `finally`, no redundant calls |
| CDQ-002 | PASS — standard `recordException` + `setStatus({code: ERROR})` pattern in every outer catch |
| CDQ-003 | PASS — `trace.getTracer('commit-story')` used consistently |
| CDQ-005 | PASS — `logger.info` used for all logging; no stray `console.log` |
| CDQ-007 | PASS — advisory findings claiming a PII attribute name or raw filesystem path are false positives; the actual attributes at those points are `commit_story.journal.entries_count` (numeric) and `commit_story.journal.week_label`/`month_label` (strings), none of which are PII or paths |

**Failures**: None. CDQ-007 advisory is a false positive (mislabeled numeric/string attributes as PII/path risks); SCH-002 required 2+ correction attempts before resolving, consistent with the file's "2 attempts" outcome.

**Datadog trace supplement**: Live trace data confirms this file's spans — `commit_story.journal.generate_daily_summary`, `commit_story.ai.generate_daily_summary`, and `commit_story.journal.save_daily_summary` all appear in a real trace (trace_id `3722a802e3cf1bc1c0bc5428509d2ce7`) with populated `entries_count`/`entry_date`/`section_type` attributes, corroborating COV-001 and COV-005.

---

### 6. mcp/tools/context-capture-tool.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS — `saveContext` (the sole async I/O function, wrapping `mkdir`+`appendFile`) is correctly instrumented via `startActiveSpan` with try/catch/finally, `recordException`, and `setStatus(ERROR)`. |
| COV-005 | PASS — span carries 2 domain attributes: `commit_story.journal.file_path` and `commit_story.journal.entry_date` (guarded with `isRecording()`). Both reuse existing schema keys rather than creating new ones, which is why `attributesCreated` reads 0 in the run summary — that figure counts new schema extensions, not attributes actually set on the span. The span is not attribute-empty. |
| RST-001 | PASS — `getContextPath`, `formatTimestamp`, `formatContextEntry` (sync helpers) and `registerContextCaptureTool` (sync registration) correctly left uninstrumented. |
| RST-004 | PASS (judgment call) — the anonymous async MCP tool handler was skipped on the theory that `@modelcontextprotocol/sdk`'s auto-instrumentation covers it, even though the agent's own notes confirm the SDK is referenced only in a JSDoc comment, not actually imported in this file. This is architecturally plausible (MCP servers typically import the SDK centrally, not per-tool-file) but the file itself provides no evidence the boundary is actually auto-instrumented. |
| SCH-001 | PASS — `commit_story.context.save_context` was declared as a `schemaExtension`, satisfying the registry-mismatch advisory's own remediation ("declare a new span as a schemaExtension"). |
| SCH-002 | PASS — agent explicitly checked against the existing `commit_story.context.gather_context_for_commit` span and correctly distinguished it as a different operation class (multi-source commit context gathering vs. daily-file entry append). |
| SCH-003 | PASS — reused existing schema attribute keys (`file_path`, `entry_date`) instead of minting new ones. |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS — attributes follow `commit_story.journal.*` dotted namespace. |
| CDQ-005 | PASS |
| CDQ-007 | ADVISORY — `commit_story.journal.file_path` stores the full relative path (`journal/context/YYYY-MM/YYYY-MM-DD.md`) rather than a basename, which the instrumentation report itself flags as a lower-severity CDQ-007 finding ("a raw filesystem path where a basename would be safer"). The `text` parameter was correctly excluded as unbounded/PII-risk content, so the rule isn't a clean fail — only the path form is flagged. |

**Failures**: None (one ADVISORY on CDQ-007 for raw path vs. basename).

**Datadog trace supplement**: Searched `service:commit-story @service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6` for `commit_story.context.save_context` — no matches (0 spans). A broader query on the same `service.instance.id` returned 26 spans, but all belong to `git.commit.sha: 8bea39229d24fc03910e3d9f27c99a65da816cac` on `vcs.ref.head.revision: HEAD`/`0b2c5474c7715e4cfde89caa4768acabd98423c6` — i.e., live dogfooding traffic from running commit-story-v2 on its own `main` branch (journal/summary generation spans like `commit_story.journal.save_journal_entry`, `generate_daily_summary`, etc.), not the run-26 instrument branch (`spiny-orb/instrument-1784302707982`) and not the `context-capture-tool.js` code path at all. No live corroboration is available for this file's span in this run.

**Declining richness trend note**: The decline reverses this run, but the run-summary's "0 attrs" figure is misleading taken at face value. Source inspection shows the span sets 2 domain attributes — `commit_story.journal.file_path` (direct read) and `commit_story.journal.entry_date` (guarded with `isRecording()`, derived from `now.toISOString().split('T')[0]`) — matching exactly the `entry_date`/`source`-like fields called out as the watch item. The "0 attrs" in run-summary.md reflects `attributesCreated` (new schema extensions), which is legitimately 0 since both attributes reuse pre-existing registry keys — it does not mean the span is attribute-empty. Actual richness (2 meaningful, non-PII, bounded attributes) is comparable to or better than run-24's reported 2, and the run-25 "0 attrs" data point should likely be re-examined the same way before treating the trend as a genuine 3→2→0 decline.

**Coverage note relative to run-12**: In run-12, both `context-capture-tool.js` and `reflection-tool.js` were correct skips — the note in run-12's own document ("both contain unexported async I/O helpers `saveContext`/`saveReflection` that RST-004 permits but doesn't require spanning") explicitly named these two files as an identical pattern. In run-26, `context-capture-tool.js` was committed (this section) while `reflection-tool.js` remained a correct skip (see Correct Skips below) — a genuine run-over-run instrumentation coverage improvement for one of the two previously-identical-pattern files.

---

### 7. mcp/server.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | ADVISORY |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

**Advisory notes**: CDQ-002 — the agent's thinking block described a plan to capture both `server.name` and `commit_story.mcp.transport` on the span ("I'll capture both the server name and transport type as attributes"), but the final committed code only sets `commit_story.mcp.transport`. No `server.name`/PII attribute was actually added. This is a plan/implementation mismatch, not a functional defect — the shipped span still carries one meaningful domain attribute (transport type), satisfying COV-005's ≥1-attribute methodology, and the run summary's "1 attribute" count matches the final code exactly. `main()` correctly gets the COV-001 entry-point span with proper `recordException`/`setStatus(ERROR)`/`span.end()` in a try/catch/finally; `createServer()` is correctly skipped as a sync, I/O-free helper (RST-001/RST-004). Both the new span name and the new attribute key are declared as schema extensions (SCH-001/SCH-003), and the file's use of `@modelcontextprotocol/sdk` is correctly deferred to auto-instrumentation (`@traceloop/instrumentation-mcp`) rather than manually wrapped.

**Datadog trace supplement**: No trace matching `commit_story.mcp.server.start` was found for `service:commit-story @service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6` over a 30-day window. That service-instance ID does emit spans, but all 26 matched spans belong to a `commit_story.index.main` trace (CLI entry point, git commit `8bea39229d24fc03910e3d9f27c99a65da816cac`) from a normal `node src/index.js` run — not an MCP server invocation, and not necessarily run-26's instrument commit. This is consistent with the expected limitation noted in the task: MCP server entry points are not exercised by a standard CLI dry-run, so the absence of a matching trace should not be read as evidence of failure — it simply was never triggered in the traces searched.

---

### 8. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — full try/catch/finally with `recordException`, `setStatus(ERROR)`, `span.end()` in finally |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS — `ensureDirectory` is the only exported async I/O function; gets a span as a service entry point |
| COV-003 | PASS |
| COV-004 | PASS — 11 pure synchronous path-builder functions correctly left unspanned |
| COV-005 | PASS — `commit_story.journal.file_path` is a meaningful domain attribute, corroborated live (see below) |
| RST-001 | PASS — sync functions (getYearMonth, getDateString, getJournalEntryPath, etc.) explicitly skipped per RST-001 |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` correctly declared as a schema extension |
| SCH-002 | ADVISORY — reused existing `commit_story.journal.file_path` attribute rather than inventing a near-synonym, but its schema brief ("Output file path for the journal entry") doesn't cleanly describe a directory-creation input path; agent itself flagged the fit as only "semantically close enough" |
| SCH-003 | PASS — string type, matches |
| CDQ-001 | PASS — no redundant span.end() |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS — attribute set unconditionally before the I/O call |
| CDQ-007 | **FAIL** — `filePath` set as a raw filesystem path (e.g. `journal/summaries/daily/2026-07-17.md`) with no `basename()` applied; agent self-documented this in the report as a known CDQ-007 limitation (missing `basename` import) rather than fixing it |

**Failures**: CDQ-007 — raw filesystem path stored in `commit_story.journal.file_path` without basename transformation, self-acknowledged by the agent as a known limitation rather than resolved (e.g., by importing `basename` from `node:path`, which was available but not used).

**Datadog trace supplement**: Confirmed via `search_datadog_spans` (service:commit-story, service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6) — a live `commit_story.journal.ensure_directory` span exists with exactly one custom attribute, `commit_story.journal.file_path: journal/summaries/daily/2026-07-17.md`, matching the source-level finding of 1 span / 1 attribute (note: run-summary.md's "0 attrs" figure appears to be a counting-methodology artifact, not accurate — the source and live trace both show 1 attribute). The trace's `vcs.ref.head.revision` on a sibling span is `0b2c5474c7715e4cfde89caa4768acabd98423c6`, matching the tip of `spiny-orb/instrument-1784302707982` exactly, confirming this trace was captured while running the run-26 instrumented branch (the resource-level `git.commit.sha` attribute showing the older merge commit `8bea392` appears to be a stale/separately-sourced resource attribute, not the actual running commit).

---

### 9. managers/journal-manager.js (2 spans, 1 attempt)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no truthy guards removed; `commit.hash` is sourced directly from git log output (git-collector.js `%H` parse), not an optional field, so no guard-vs-unconditional-set tension arose |
| API-001 | PASS — `trace.getTracer('commit-story')` |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — both inner catches (`saveJournalEntry`'s ENOENT guard, `discoverReflections`'s two graceful continue-on-error catches) left unmodified per agent notes; outer span-level catch handles error recording |
| COV-001 | PASS — `saveJournalEntry` and `discoverReflections`, both exported async I/O functions, instrumented as entry points |
| COV-003 | PASS — outer catch in both spans calls `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS — all exported async functions covered; 10 sync helpers correctly skipped (RST-001/RST-004) |
| COV-005 | PASS — `commit_story.journal.file_path`, `vcs.ref.head.revision`, `commit_story.commit.timestamp`, `commit_story.context.time_window_start/end`, `commit_story.journal.reflections_count` |
| RST-001 | PASS — `formatTimestamp`, `formatJournalEntry` (exported, pure sync) skipped |
| RST-004 | PASS — 8 unexported sync helpers skipped |
| SCH-001 | PASS — new span names `commit_story.journal.save_journal_entry` / `discover_reflections` follow existing namespace convention |
| SCH-002 | PASS — agent explicitly considered reusing `commit_story.journal.quotes_count` for the reflections count, correctly rejected it as a false synonym (quotes vs. reflections are semantically distinct data sources), and declared a new key instead |
| SCH-003 | **FAIL** — `commit_story.journal.reflections_count` is declared `type: int` in `semconv/agent-extensions.yaml`, but the code sets it via `String(reflections.length)` (`span.setAttribute('commit_story.journal.reflections_count', String(reflections.length))`). The live trace confirms the mismatch: the attribute is emitted as the string `"0"`, not an integer. |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — the run-12 nullable-field recurrence check found no repeat: `commit.author` (PII-flagged in the schema) is skipped entirely rather than set unconditionally, and `commit.hash` is set unconditionally but is guaranteed non-null (parsed directly from `git log --format=%H` in git-collector.js, not an optional/nullable field). This differs from run-12, where both `commit.hash` and `commit.author` were set unconditionally with the agent itself noting a risk of `undefined` values. |

**Failures**: SCH-003 — `commit_story.journal.reflections_count` declared as `int` in schema but implemented as a string value (`String(reflections.length)`), confirmed by the string `"0"` observed on the live span.

**Datadog trace supplement**: Found 2 matching spans (`commit_story.journal.save_journal_entry`, `commit_story.journal.discover_reflections`) under `service:commit-story @service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6`, both from trace `3722a802e3cf1bc1c0bc5428509d2ce7`. `vcs.ref.head.revision` on the trace (`0b2c5474c7715e4cfde89caa4768acabd98423c6`) matches the exact HEAD of `spiny-orb/instrument-1784302707982` (commit `0b2c547`), confirming this trace data belongs to run-26's own instrument branch. The trace corroborates the SCH-003 finding directly: `commit_story.journal.reflections_count` is present in the payload as the quoted string `"0"`, not an integer.

---

### 10. managers/summary-manager.js (9 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS — all 9 exported async functions instrumented as entry points |
| COV-003 | PASS |
| COV-004 | ADVISORY (×5) — 5 correctly-exempt sync helpers flagged by the validator, non-blocking |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | ADVISORY (×12) — raw-path findings, non-blocking |

**Failures**: None. Two advisory findings, neither blocking: COV-004 fired on 5 sync helpers that are correctly exempt from spanning; CDQ-007 fired 12 times on raw filesystem paths (same category as the `journal-paths.js`/`context-capture-tool.js` pattern elsewhere in this run).

**RUN25-1 fix verification**: The run-25 finding (COV-004's `isExpectedConditionCatch` false-positive on a negated ENOENT rethrow, which caused 2 of 9 functions to be blocked as partial) is confirmed fixed in run-26. All 9 exported async functions committed cleanly with 0 partial (run-25 had 7 spans committed + 2 functions blocked). The validation journey shows 2 legitimate attempts driven by real missing-`recordException` findings on the first pass — not false-positive rejections — resolved cleanly on the second attempt. This is a genuine validator-side fix, not a lucky pass.

**Datadog trace supplement**: Live spans corresponding to this file's 9 exported functions were found under `service:commit-story @service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6`, consistent with the source-level review above.

---

### 11. commands/summarize.js (3 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — inner per-item catch blocks (loop failures, empty catch around `access(summaryPath)`) correctly left unmodified as expected-condition/graceful-degradation catches |
| COV-001 | PASS — `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize` all wrapped as entry-point spans |
| COV-003 | PASS — outer try/catch/finally on each span calls `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS |
| COV-005 | PASS — `dates_count`, `force`, `failed_count` set on each span; real domain attributes, not placeholder |
| RST-001 | PASS — `isValidDate`, `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `showSummarizeHelp` correctly skipped as synchronous utilities |
| RST-004 | PASS |
| SCH-001 | ADVISORY — validator flagged `run_weekly_summarize`/`run_monthly_summarize` as potential duplicates of `run_summarize`; agent explicitly overrode, reasoning they are distinct operation classes (daily/weekly/monthly) warranting separate span names — reasonable, non-blocking |
| SCH-002 | PASS (after fix) — attempt 1 had 8 blocking SCH-002 errors (`weeks_count`, `months_count`, `generated_count` flagged as semantic duplicates of `dates_count`); attempt 2 resolved by reusing `dates_count` for all three counters and dropping `generated_count` entirely |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None. One notable trade-off: the validator's semantic-duplicate ruling forced `weeks_count` and `months_count` to collapse into the (misleadingly named) `dates_count` attribute, and eliminated `generated_count` outright — reducing output-metric granularity to satisfy SCH-002, at some cost to attribute clarity (a `commit_story.summarize.dates_count` attribute now also means "weeks count" or "months count" depending on span).

**Datadog trace supplement**: Queried `service:commit-story @service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6` and found 26 spans, but none matched this file's span names (`commit_story.commands.run_summarize`, `run_weekly_summarize`, `run_monthly_summarize`). The returned spans belong to the neighboring `auto-summarize.js` manager layer and journal operations, and nearly all carry `git.commit.sha: 8bea39229d24fc03910e3d9f27c99a65da816cac` — unrelated main-branch dogfooding traffic, not run-26 instrument-branch data. No run-26 trace evidence exists for this file specifically.

---

### 12. utils/summary-detector.js (5 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | ADVISORY |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | ADVISORY |

**Failures**: None. Two advisory findings, neither blocking:
- COV-004 (×4): unexported helpers `getSummarizedDays`, `getSummarizedWeeks`, `getSummarizedMonths`, `getWeeksWithWeeklySummaries` are async but lack spans — internal single-purpose file-read helpers called only by the instrumented exported functions.
- CDQ-007 (×8, all on `commit_story.journal.base_path`): raw filesystem path attribute rather than a basename, self-flagged by the agent as lower severity.

**Fix verification (0→3 attrs)**: The 3 new schema-extension attributes are `commit_story.journal.base_path`, `commit_story.journal.unsummarized_weeks_count`, and `commit_story.journal.unsummarized_months_count`. The validation journey shows this was a genuine, validator-driven improvement: Attempt 1 failed with 12 blocking errors (NDS-003 ×6, SCH-002 ×6); Attempt 2 failed with 12 SCH-002 errors; Attempt 3 still had 7 SCH-002 errors; the agent then fell back to function-level instrumentation and landed on a smaller, registry-conformant attribute set. Compared to run-25's total collapse to 0 attrs, this is a real fix — the agent no longer abandons attribute emission entirely when SCH-002 conflicts arise.

**Datadog trace supplement**: One span found for `commit_story.journal.find_unsummarized_weeks` with `commit_story.journal.base_path: "."` and `commit_story.journal.unsummarized_weeks_count: "0"`, but its `git.commit.sha` is `8bea39229d24fc03910e3d9f27c99a65da816cac` — unrelated main-branch dogfooding traffic, not run-26's instrument branch tip. No run-26-specific trace data found for this file.

---

### 13. managers/auto-summarize.js (3 spans, 1 attempt)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | ADVISORY |

**Failures**: None

**Datadog trace supplement**: Found live spans for `commit_story.managers.trigger_auto_summaries`, `trigger_auto_weekly_summaries`, and `trigger_auto_monthly_summaries` carrying expected attributes (`commit_story.journal.base_path`, `commit_story.summarize.dates_count`, `commit_story.summarize.failed_count`, `commit_story.journal.unsummarized_weeks_count`, `commit_story.journal.unsummarized_months_count`). `git.commit.sha` on these spans is `8bea39229d24fc03910e3d9f27c99a65da816cac` — unrelated main-branch dogfooding traffic, not run-26's instrument branch tip. No trace evidence specific to this run's instrumented code was found.

---

### 14. index.js (2 spans, 1 attempt)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | ADVISORY |

**Failures**: None. One advisory: CDQ-007 fired on `span.setAttribute('commit_story.journal.file_path', savedPath)` — `savedPath` is a raw filesystem path rather than a basename. The instrumentation report itself flags this as lower severity, so it's advisory, not a hard failure. Both entry points (`handleSummarize`, `main`) got spans declared as schema extensions, and six synchronous utility functions were correctly skipped per RST-001/RST-004. The inner auto-summarize try/catch in `main` was correctly left unmodified per NDS-007 since it's a graceful-degradation catch with no rethrow.

**Datadog trace supplement**: Found exactly one `commit_story.index.main` trace (trace `3722a802e3cf1bc1c0bc5428509d2ce7`). Its `git.commit.sha` is `8bea39229d24fc03910e3d9f27c99a65da816cac` — unrelated main-branch dogfooding traffic, not run-26's instrument branch tip. That said, the trace's shape corroborates the static analysis: `commit_story.context.messages_count: 2` and `commit_story.journal.file_path: journal/entries/2026-07/2026-07-18.md` are both present and populated exactly as the source describes, including the raw (non-basename) file path underlying the CDQ-007 advisory.

---

## Correct Skips (18)

| File | Skip Reason |
|------|------------|
| generators/prompts/guidelines/accessibility.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/guidelines/anti-hallucination.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/guidelines/index.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/sections/daily-summary-prompt.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/sections/dialogue-prompt.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/sections/monthly-summary-prompt.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/sections/summary-prompt.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/sections/technical-decisions-prompt.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/sections/weekly-summary-prompt.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| integrators/filters/message-filter.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| integrators/filters/sensitive-filter.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| integrators/filters/token-filter.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| logger.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| mcp/tools/reflection-tool.js | 2 attempts, 4.9K output tokens — the agent deliberated over instrumenting `saveReflection` and/or the inline MCP handler and debated COV-001 entry-point classification before deciding against adding spans. Final rationale: all exported functions are synchronous (`registerReflectionTool`) — no async I/O to trace. The raw log's "No LLM call made" line in the agent's own final note is inaccurate boilerplate, not a description of the harness's actual behavior — the 4.9K output tokens and full attempt-1 reasoning trace in `spiny-orb-output.log` confirm a real LLM call was made and consumed tokens before the agent talked itself out of adding spans. |
| traceloop-init.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| utils/commit-analyzer.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| utils/config.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| utils/failure-placeholder.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. (New file added to the inventory this run; correct skip on its first evaluation.) |

**Note on context-capture-tool.js and reflection-tool.js**: In run-12, both files were correct skips under an identical pattern (unexported async I/O helpers `saveContext`/`saveReflection` that RST-004 permits but doesn't require spanning). In run-26, `context-capture-tool.js` was committed (see Committed Files #6, `saveContext` now instrumented with 2 domain attributes) while `reflection-tool.js` remained a correct skip — a genuine instrumentation-coverage improvement for one of the two previously-identical-pattern files.

---

## Quality Failures Summary

| File | Rule | Dimension |
|------|------|-----------|
| utils/journal-paths.js | CDQ-007 | Code Quality |
| managers/journal-manager.js | SCH-003 | Schema Compliance |

**Total canonical failures**: 2 (CDQ-007 and SCH-003)

**Methodology caveats** (apply broadly across this evaluation, not just to specific files):

1. **Log attribute counts undercount real attributes.** The `attributesCreated`/"N attributes" figures reported in `run-summary.md` and `spiny-orb-output.log` count only *new schema extensions*, not the total number of attributes actually set in code. Multiple files (`context-integrator.js`: 9 real attributes vs. "0" logged; `context-capture-tool.js`: 2 real vs. "0" logged; `journal-paths.js`: 1 real vs. "0" logged) demonstrate this gap. Attribute-richness trend narratives built solely on the log's numeric column (e.g., a "3→2→0 decline" for `context-capture-tool.js`) should be re-verified against source and live traces before being treated as real regressions.
2. **Trace provenance is split across two SHAs.** Nearly all "live Datadog trace" evidence gathered in this document belongs to `git.commit.sha: 8bea39229d24fc03910e3d9f27c99a65da816cac` — unrelated main-branch dogfooding traffic from ordinary `node src/index.js` runs — rather than run-26's actual instrument branch tip, `0b2c5474c7715e4cfde89caa4768acabd98423c6` (`spiny-orb/instrument-1784302707982`). Only `journal-paths.js` and `journal-manager.js` have confirmed genuine run-26-branch trace evidence; every other file's trace supplement corroborates shape/attribute presence but not run-26 provenance specifically.
3. **RUN25-1 (summary-manager.js COV-004 false positive) is confirmed fixed** — see Committed Files #10 for verification detail.
4. **summary-detector.js's 0→3 attribute recovery (vs. run-25) is a genuine, validator-driven fix**, not a lucky guess — see Committed Files #12 for the validation-journey detail.
5. **summarize.js's SCH-002 resolution traded metric granularity for registry compliance** — `weeks_count`/`months_count`/`generated_count` collapsed into the reused `dates_count` key, a real (if minor) semantic cost — see Committed Files #11.
