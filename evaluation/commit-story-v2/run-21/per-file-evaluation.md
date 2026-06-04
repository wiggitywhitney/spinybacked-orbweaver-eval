# Per-File Evaluation — Run-21

**Date**: 2026-06-04
**Branch**: spiny-orb/instrument-1780596389399
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 30 (12 committed + 2 failed + 16 correct skips)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check` exits 0 on all 12 committed instrumented files |
| NDS-002 (Tests) | **PASS** | 564 tests pass, 1 skipped (acceptance gate, no API key) |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | @opentelemetry/api in peerDependencies at ^1.9.0 |
| API-003 | **PASS** | No vendor-specific SDKs in production dependencies; OTel SDK packages (@opentelemetry/sdk-node, exporter-trace-otlp-http, resources, semantic-conventions) are all devDependencies |
| API-004 | **PASS** | All 12 instrumented files import exclusively from '@opentelemetry/api'; no SDK-internal imports in src/ |
| CDQ-008 | **PASS** | All 12 committed files use `trace.getTracer('commit-story')` consistently |

---

## Committed Files (12)

### 1. collectors/claude-collector.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only |
| NDS-006 | PASS — catch rethrows; both `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` are present |
| NDS-004 | PASS — both `trace` and `SpanStatusCode` are used |
| NDS-005 | PASS — original try/catch structure preserved; instrumentation wraps inside `startActiveSpan` callback without restructuring |
| COV-001 | PASS — collectChatMessages is the only exported async fn and has a span |
| COV-003 | PASS — catch has `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` |
| COV-004 | PASS — collectChatMessages is the only exported async fn; all others are sync |
| COV-005 | PASS — `commit_story.context.source`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.sessions_count`, `commit_story.context.messages_count` all set on the span |
| COV-006 | N/A — no LangChain/auto-instrumentation |
| RST-001 | PASS — sync helpers correctly skipped: `getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `parseJSONLFile`, `filterMessages`, `groupBySession` |
| RST-004 | PASS — only the single exported async fn is instrumented |
| SCH-001 | PASS — `commit_story.claude_collector.collect_chat_messages` registered in agent-extensions.yaml |
| SCH-002 | PASS — all 5 attributes pre-registered in `semconv/attributes.yaml` with full `commit_story.context.*` names |
| SCH-003 | PASS — `sessions_count` and `messages_count` set as integers; `source` set as string enum value `'claude_code'`; `time_window_start`/`time_window_end` set as strings via `.toISOString()` |
| CDQ-001 | **FAIL** — `span.end()` called explicitly in `finally` block inside `startActiveSpan` callback; `startActiveSpan` already auto-ends the span when the callback returns or throws, making the explicit call a double-end |
| CDQ-002 | PASS — no nested child spans for delegation |
| CDQ-003 | PASS — `commit_story.context.source`, `time_window_start`, and `time_window_end` are set in normal flow at the top of the try block |
| CDQ-005 | PASS — no empty catch blocks added |
| CDQ-007 | PASS — early-return path explicitly sets `sessions_count` and `messages_count` to `0`; happy path sets them from `sessions.size` and `allMessages.length` after computation |

**Failures**: CDQ-001 — redundant `span.end()` in `finally` inside `startActiveSpan` callback causes double-end

---

### 2. collectors/git-collector.js (6 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — all catch blocks that rethrow have recordException + setStatus(ERROR) |
| NDS-004 | PASS — both `trace` and `SpanStatusCode` are used |
| NDS-005 | PASS — original exception handling in runGit (error.code === 128 branches) preserved inside instrumented catch |
| COV-001 | PASS — getCommitData and getPreviousCommitTime (both exported async fns) have spans |
| COV-002 | PASS — runGit span wraps execFileAsync (child process spawn) |
| COV-003 | PASS — all 6 outer span catch blocks have recordException + setStatus(ERROR) |
| COV-004 | PASS — exported: getCommitData, getPreviousCommitTime; unexported async I/O: runGit, getCommitMetadata, getCommitDiff, getMergeInfo; all 6 have spans |
| COV-005 | PASS — run_git: vcs.ref.head.revision; get_commit_metadata: vcs.ref.head.revision + commit.message + commit.timestamp; get_commit_diff: vcs.ref.head.revision; get_merge_info: vcs.ref.head.revision + git_collector.is_merge; get_previous_commit_time: vcs.ref.head.revision; get_commit_data: vcs.ref.head.revision + commit.message + commit.timestamp + git_collector.is_merge |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-004 | PASS — runGit, getCommitMetadata, getCommitDiff, getMergeInfo are unexported async I/O fns instrumented appropriately under COV-004 |
| SCH-001 | PASS — all 6 span names registered |
| SCH-002 | PASS — all attribute keys registered |
| SCH-003 | PASS — commit_story.git_collector.is_merge set as `parentCount > 1` (boolean expression, not string) |
| CDQ-001 | PASS — no redundant span.end(); all spans use finally { span.end() } inside startActiveSpan callbacks |
| CDQ-002 | PASS — no nested spans for simple delegation |
| CDQ-003 | PASS — attributes set in normal flow before catch blocks |
| CDQ-005 | PASS — no empty catch blocks |
| CDQ-007 | PASS — commitRef guarded with `!= null` before setAttribute in runGit; metadata and mergeInfo guarded with null checks in getCommitData; unguarded attrs in getCommitMetadata reflect original code's parsing assumptions |

**Failures**: None

---

### 3. generators/journal-graph.js (4 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no original lines modified; instrumentation is purely additive |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS — `generateJournalSections` outer catch rethrows with both `recordException` + `setStatus(ERROR)`; node function inner catches are NDS-007 graceful-degradation (no rethrow, no recordException required) |
| NDS-004 | PASS — `trace` and `SpanStatusCode` both used |
| NDS-005 | PASS — inner graceful-degradation catches in summaryNode, technicalNode, dialogueNode untouched; wrapping is additive |
| COV-001 | PASS — `generateJournalSections` wrapped in `startActiveSpan('commit_story.journal.generate_sections', ...)` |
| COV-003 | PASS — `generateJournalSections` outer catch calls `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, then rethrows |
| COV-004 | PASS — exported async fns: `generateJournalSections`, `summaryNode`, `technicalNode`, `dialogueNode` — all 4 instrumented; sync exports (`getModel`, `resetModel`, and all helpers) correctly skipped |
| COV-005 | PASS — node spans each carry `gen_ai.operation.name`, `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.request.temperature`, `gen_ai.request.max_tokens`, `commit_story.ai.section_type`; generate_sections span carries `commit_story.journal.sections` |
| COV-006 | PASS — each node function's `startActiveSpan` callback establishes active context before `getModel(...).invoke(...)` is called, making the manual span the parent of the auto-instrumented LangChain call |
| RST-001 | PASS — sync helpers correctly skipped: `getModel`, `resetModel`, `analyzeCommitContent`, `hasFunctionalCode`, `generateImplementationGuidance`, `formatSessionsForAI`, `formatChatMessages`, `escapeForJson`, `formatContextForSummary`, `formatContextForUser`, `cleanDialogueOutput`, `cleanTechnicalOutput`, `cleanSummaryOutput`, `buildGraph`, `getGraph` |
| RST-004 | PASS — `summaryNode`, `technicalNode`, `dialogueNode` are async LangGraph node functions exported for testing; all perform LLM I/O; COV-004/COV-006 applies |
| SCH-001 | PASS — all 4 span names registered |
| SCH-002 | PASS — `commit_story.ai.section_type` in `registry.commit_story.ai`; `commit_story.journal.sections` in `registry.commit_story.journal`; all `gen_ai.*` attributes registered via `ref:` to OTel GenAI semconv |
| SCH-003 | PASS — `commit_story.journal.sections` set as `['summary', 'dialogue', 'technical_decisions']` (string array literal) |
| CDQ-001 | PASS — `span.end()` appears only in `finally` blocks; no double-end |
| CDQ-002 | PASS — no nested spans for simple delegation |
| CDQ-003 | PASS — attributes set in normal flow before catch branches |
| CDQ-005 | PASS — no empty catch blocks |
| CDQ-007 | PASS — optional chaining on all result properties: `result?.id`, `result?.usage_metadata?.input_tokens`, `result?.usage_metadata?.output_tokens`, `result?.response_metadata?.model`; also `NODE_TEMPERATURES?.summary` etc. |

**Failures**: None. The `gen_ai.usage.*` attributes are present in the final instrumented version (contrary to agent attempt-1 notes which said they were dropped); they use optional chaining throughout.

---

### 4. generators/summary-graph.js (6 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — early exits preserved inside the outer span; outer catch rethrows with recordException + setStatus(ERROR) |
| NDS-004 | PASS — `trace` and `SpanStatusCode` both used |
| NDS-005 | PASS — all three original inner try/catch blocks (daily/weekly/monthly) preserved verbatim; they return fallback values and do not rethrow |
| COV-001 | PASS — all three exported async orchestrators (`generateDailySummary`, `generateWeeklySummary`, `generateMonthlySummary`) are wrapped in spans |
| COV-003 | PASS — every span has an outer catch with `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error` |
| COV-004 | PASS — node functions (`dailySummaryNode`, `weeklySummaryNode`, `monthlySummaryNode`) also instrumented; all meaningful async entry points covered |
| COV-005 | PASS — daily spans: `entry_date` + `entries_count`; weekly spans: `week_label` + `entries_count`; monthly spans: `month_label` + `weekly_summaries_count` |
| COV-006 | PASS — `getModel(0.7).invoke(...)` calls execute inside active `startActiveSpan` callbacks; manual spans are genuine parents of auto-instrumented LangChain spans |
| RST-001 | PASS |
| RST-004 | PASS — pattern is `return tracer.startActiveSpan('name', async (span) => {...})`; promise propagates correctly |
| SCH-001 | PASS — all 6 span names registered |
| SCH-002 | PASS — all 4 new attributes registered in agent-extensions.yaml |
| SCH-003 | PASS — `entries_count` set from `.length` (JS integer); `week_label` set from string param; `weekly_summaries_count` set from `.length`; `month_label` set from string param |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS with observation — array inputs null-guarded before `.length`; string params (`weekLabel`, `monthLabel`) unguarded but structurally required; OTel SDK coerces undefined gracefully; acceptable tradeoff |

**Failures**: None. Notable: `entries_count` intentionally reused across daily and weekly spans; `daily_summaries_count` and `monthly_summaries_count` removed as schema duplicates.

---

### 5. integrators/context-integrator.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — catch block calls recordException + setStatus(ERROR) then rethrows |
| NDS-004 | PASS — `trace` and `SpanStatusCode` both used |
| NDS-005 | PASS — original exception handling preserved |
| COV-001 | PASS — gatherContextForCommit is the only exported async fn and has a span |
| COV-003 | PASS — outer catch has `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` |
| COV-004 | PASS — gatherContextForCommit is the only exported async fn; formatContextForPrompt and getContextSummary are sync |
| COV-005 | PASS — 9 domain attributes: vcs.ref.head.revision, commit_story.commit.message, commit_story.git_collector.is_merge, commit_story.filter.messages_before, commit_story.filter.messages_after, commit_story.context.messages_count, commit_story.context.sessions_count, commit_story.context.time_window_start, commit_story.context.time_window_end |
| COV-006 | N/A — no LangChain |
| RST-001 | PASS — formatContextForPrompt and getContextSummary are sync |
| RST-004 | PASS |
| SCH-001 | PASS — commit_story.context.gather_context_for_commit registered in agent-extensions.yaml |
| SCH-002 | PASS — all 9 attrs pre-registered in base semconv or agent-extensions |
| SCH-003 | PASS — is_merge=boolean (commitData.isMerge), messages_before/after=int, messages_count=int, sessions_count=int, time_window_*=string (.toISOString()), revision=string, message=string |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — commitRef defaults to 'HEAD' (always string); commitData fields are from a successfully resolved commit object; filter stats are numeric returns; filteredMessages.length and filteredSessions.size are always numeric |

**Failures**: None

---

### 6. managers/auto-summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — `trace` and `SpanStatusCode` imported from `@opentelemetry/api` |
| NDS-006 | PASS — outer catch in each function calls `recordException(error)`, `setStatus({ code: SpanStatusCode.ERROR })`, and rethrows |
| NDS-004 | PASS — `trace` and `SpanStatusCode` both used |
| NDS-005 | PASS — inner for-loop catches preserved unchanged; errors push to result.failed/result.errors without rethrowing |
| COV-001 | PASS — 3 exported async trigger functions all have spans |
| COV-003 | PASS — all outer catches have recordException + setStatus(ERROR) |
| COV-004 | PASS — triggerAutoSummaries, triggerAutoWeeklySummaries, triggerAutoMonthlySummaries all have spans |
| COV-005 | PASS — `generated_count` and `failed_count` set on all 3 spans; triggerAutoSummaries also sets `dates_count`; triggerAutoWeeklySummaries sets `unsummarized_weeks_count`; triggerAutoMonthlySummaries sets `unsummarized_months_count` |
| COV-006 | N/A — no LangChain model calls in this file |
| RST-001 | PASS — getErrorMessage is sync and unexported; correctly excluded |
| RST-004 | PASS |
| SCH-001 | PASS — all 3 span names registered in agent-extensions.yaml |
| SCH-002 | PASS — generated_count, failed_count, dates_count, unsummarized_weeks_count, unsummarized_months_count all registered in agent-extensions.yaml |
| SCH-003 | PASS — generated_count = result.generated.length (int), failed_count = result.failed.length (int) |
| CDQ-001 | PASS — no redundant span.end() inside startActiveSpan callbacks |
| CDQ-002 | PASS — no nested child spans for simple delegation |
| CDQ-003 | PASS — attributes set in normal execution flow, not only in catch |
| CDQ-005 | PASS — no empty catch blocks added |
| CDQ-007 | PASS — `result` is initialized with `generated: [], failed: []` before any loop in all 3 functions; setAttribute calls on result.generated.length and result.failed.length are always safe |

**Failures**: None

---

### 7. managers/journal-manager.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — both spans rethrow; outer catches have recordException + setStatus(ERROR) + throw |
| NDS-004 | PASS — `trace` and `SpanStatusCode` both used |
| NDS-005 | PASS — inner file-not-found catch in saveJournalEntry and directory-not-found/file-unreadable catches in discoverReflections preserved verbatim as NDS-007 graceful degradation |
| COV-001 | PASS — saveJournalEntry and discoverReflections both have spans |
| COV-003 | PASS — both outer catches call recordException(error) and setStatus({ code: SpanStatusCode.ERROR }) |
| COV-004 | PASS — both exported async functions have spans |
| COV-005 | PASS — saveJournalEntry: commit_story.journal.file_path, commit_story.journal.entry_date, vcs.ref.head.revision; discoverReflections: commit_story.context.time_window_start, commit_story.context.time_window_end, commit_story.journal.reflections_count |
| COV-006 | N/A |
| RST-001 | PASS — all helpers (formatTimestamp, formatJournalEntry, formatReflectionsSection, extractFilesFromDiff, countDiffLines, parseReflectionEntry, parseTimeString, parseReflectionsFile, isInTimeWindow, getYearMonthRange) are sync |
| RST-004 | PASS |
| SCH-001 | PASS — both span names registered |
| SCH-002 | PASS — reflections_count registered in agent-extensions.yaml; vcs.ref.head.revision in base semconv; journal.* and context.* attrs registered |
| SCH-003 | PASS — reflections_count set to reflections.length (int ✓); vcs.ref.head.revision set to commit.shortHash (string ✓) |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — run-20 FAIL resolved. commit_story.commit.author removed entirely (no nullable-field risk); vcs.ref.head.revision now uses commit.shortHash (structurally required field, used unconditionally in original code's formatJournalEntry); commit.message not set (correctly omitted — original code guards it with `|| ''`) |

**Failures**: None. CDQ-007 run-20 FAIL is fully resolved. Agent improved from 3 attempts (run-20) to 1 attempt.

---

### 8. managers/summary-manager.js (9 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — all 9 outer catches do recordException + setStatus(ERROR) + rethrow |
| NDS-004 | PASS — `trace` and `SpanStatusCode` both used |
| NDS-005 | PASS — inner graceful-degradation catches preserved (file-not-found returns [], skip-on-exists returns null) |
| COV-001 | PASS — all 3 pipeline orchestrators (generateAndSaveDaily/Weekly/Monthly) have entry-point spans |
| COV-003 | PASS — all outer catches have recordException + setStatus(ERROR) |
| COV-004 | PASS — all 9 exported async fns have spans: readDayEntries, saveDailySummary, generateAndSaveDailySummary, readWeekDailySummaries, saveWeeklySummary, generateAndSaveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary, generateAndSaveMonthlySummary (was FAIL in run-20 with 6 missing) |
| COV-005 | **FAIL** — save_daily_summary has a path with zero attributes: when file exists and options.force is false, the function returns null before setAttribute is called; no attribute is set on the skip path. The other 8 spans all set at least one attribute unconditionally at span start (entry_date, week_label, or month_label). |
| COV-006 | N/A |
| RST-001 | PASS — formatDailySummary, formatWeeklySummary, formatMonthlySummary, getWeekBoundaries, getMonthBoundaries are all sync |
| RST-004 | PASS |
| SCH-001 | PASS — all 9 span names registered in agent-extensions.yaml |
| SCH-002 | PASS — entries_count, week_label, month_label, weekly_summaries_count in agent-extensions.yaml; journal.file_path and journal.entry_date in base attributes.yaml |
| SCH-003 | PASS — entries_count/weekly_summaries_count are int (array.length), file_path/entry_date/week_label/month_label are string |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PARTIAL — journal.file_path is a raw filesystem path (known limitation; basename not imported); all other setAttribute calls null-safe: entries_count is array.length (guaranteed int), week/month labels are string params, weekly_summaries_count is summaries.length |

**Failures**: COV-005 — save_daily_summary span has no attributes on the file-already-exists skip path. Fix: set commit_story.journal.entry_date unconditionally at span start, mirroring save_weekly_summary and save_monthly_summary which set their period labels unconditionally.

---

### 9. commands/summarize.js (3 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — outer catch calls `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, and rethrows in all 3 spans |
| NDS-004 | PASS — `trace` and `SpanStatusCode` both used |
| NDS-005 | PASS — inner for-loop catches preserved in all 3 run* functions; push to result.failed without rethrowing |
| COV-001 | PASS — runSummarize, runWeeklySummarize, runMonthlySummarize all have spans |
| COV-003 | PASS — single outer catch per function |
| COV-004 | PASS — 3 exported async fns covered; sync helpers correctly excluded (isValidDate, parseSummarizeArgs, expandDateRange, isValidWeekString, isValidMonthString, showSummarizeHelp) |
| COV-005 | PASS — runSummarize: dates_count + force + entries_count; runWeeklySummarize: dates_count (weeks.length) + force + weekly_summaries_count; runMonthlySummarize: dates_count (months.length) + force + entries_count |
| COV-006 | N/A |
| RST-001 | PASS — isValidDate, parseSummarizeArgs, expandDateRange, isValidWeekString, isValidMonthString, showSummarizeHelp are all sync |
| RST-004 | PASS |
| SCH-001 | PASS — all 3 span names registered: span.commit_story.summary.run_summarize, run_weekly_summarize, run_monthly_summarize |
| SCH-002 | PASS — all setAttribute calls use commit_story.summary.* namespace; code inspection confirms this. Agent notes referencing commit_story.commands.* are documentation inconsistency only, not a code defect. |
| SCH-003 | PASS — dates_count int (array.length), force boolean (direct boolean from parseSummarizeArgs), entries_count int, weekly_summaries_count int |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — array.length values always defined; runSummarize has defensive `if (dates != null)` guard; force is always boolean; result.generated.length always defined |

**Failures**: None. Note: agent notes reference `commit_story.commands.*` namespace but code correctly uses `commit_story.summary.*` throughout — documentation-only inconsistency, not a code defect.

---

### 10. utils/summary-detector.js (5 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — `@opentelemetry/api` imported; no SDK imports |
| NDS-006 | PASS — all 5 spans have try/catch with `recordException` + `setStatus(ERROR)` + rethrow |
| NDS-004 | PASS — `trace` and `SpanStatusCode` both used |
| NDS-005 | PASS — inner `readdir` catches return `[]` or `new Set()` without disturbing span lifecycle |
| COV-001 | PASS — all 5 exported async entry-point functions have spans |
| COV-003 | PASS — all outer catches have recordException + setStatus(ERROR) |
| COV-004 | PASS — 5 async I/O functions covered: `getDaysWithEntries`, `findUnsummarizedDays`, `getDaysWithDailySummaries`, `findUnsummarizedWeeks`, `findUnsummarizedMonths` |
| COV-005 | PASS — `getDaysWithEntries` → `dates_count`; `findUnsummarizedDays` → `dates_count`; `getDaysWithDailySummaries` → `dates_count`; `findUnsummarizedWeeks` → `unsummarized_weeks_count`; `findUnsummarizedMonths` → `weekly_summaries_count` + `unsummarized_months_count` |
| COV-006 | N/A |
| RST-001 | PASS — `getTodayString` and `getNowDate` are sync |
| RST-004 | PASS — unexported async helpers (`getSummarizedDays`, `getSummarizedWeeks`, `getSummarizedMonths`, `getWeeksWithWeeklySummaries`) correctly left without spans; COV-004 permits but does not require unexported async I/O spans when exported callers are already covered |
| SCH-001 | PASS — all 5 span names registered in agent-extensions.yaml |
| SCH-002 | PASS — all 4 attributes registered: dates_count (pre-registered), weekly_summaries_count (pre-registered), unsummarized_weeks_count (new), unsummarized_months_count (new) |
| SCH-003 | PASS — all count attributes are int type in registry; set from array.length or set.size values |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS with note — some spans guard with `if (result != null)`, others set attributes directly on array.length; unguarded cases are structurally guaranteed integers (array.length is always defined); guard application inconsistent but not a defect |

**Failures**: None. `dates_count` reused across three spans with related but distinct semantics (entry count, unsummarized count, daily-summary count) — appropriate schema economy.

---

### 11. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — catch block calls `recordException` + `setStatus ERROR` then `throw error` |
| NDS-004 | PASS — `trace` and `SpanStatusCode` both used |
| NDS-005 | PASS — original exception handling structure preserved |
| COV-001 | PASS — `ensureDirectory` is the only exported async fn and has a span |
| COV-003 | PASS — outer catch has recordException + setStatus(ERROR) |
| COV-004 | PASS — `ensureDirectory` is the only exported async fn |
| COV-005 | PASS — `commit_story.journal.file_path` captures the `filePath` argument |
| COV-006 | N/A |
| RST-001 | PASS — all 11 sync helpers correctly skipped: `getYearMonth`, `getDateString`, `getJournalEntryPath`, `getReflectionPath`, `getContextPath`, `getReflectionsDirectory`, `parseDateFromFilename`, `getJournalRoot`, `getISOWeekString`, `getSummaryPath`, `getSummariesDirectory` |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` registered in agent-extensions.yaml |
| SCH-002 | PASS — `file_path` in base semconv |
| SCH-003 | PASS — `file_path` is string; `filePath` is a string parameter |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS — `file_path` attribute set before `await mkdir(...)` |
| CDQ-005 | PASS |
| CDQ-007 | MINOR — `filePath` has no null guard before `setAttribute`; if caller passes null the SDK records the string `"null"`. Callers always pass a string in practice — known limitation noted by agent, not a defect. |

**Failures**: None. First commit for this file in any run. Previously classified as sync-only skip; run-21 correctly identifies `ensureDirectory` as async.

---

### 12. mcp/tools/context-capture-tool.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — saveContext span catch calls recordException + setStatus(ERROR) then rethrows; MCP callback catch swallows per NDS-007 graceful-degradation pattern |
| NDS-004 | PASS — `trace` and `SpanStatusCode` both used |
| NDS-005 | PASS — MCP tool callback anonymous function preserved; graceful-degradation catch returns error content rather than rethrowing |
| COV-001 | N/A — registerContextCaptureTool is sync; saveContext is unexported |
| COV-003 | PASS — saveContext outer catch has recordException + setStatus(ERROR) |
| COV-004 | PASS — saveContext is unexported async I/O (mkdir + appendFile) with no covering orchestrator span; instrumented under COV-004 exception |
| COV-005 | PASS — commit_story.journal.file_path and commit_story.journal.entry_date set on the save_context span |
| COV-006 | N/A — no LangChain; @traceloop/instrumentation-mcp covers MCP protocol layer |
| RST-001 | PASS — registerContextCaptureTool, getContextPath, formatTimestamp, and formatContextEntry are all sync |
| RST-004 | PASS — saveContext instrumented under COV-004 exception for unexported async I/O with no covering orchestrator |
| SCH-001 | PASS — commit_story.context.save_context registered in agent-extensions.yaml |
| SCH-002 | PASS — commit_story.journal.file_path and commit_story.journal.entry_date in base semconv |
| SCH-003 | PASS — both attributes are string type |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — filePath from getContextPath() always returns a non-null string (path.join result); entry_date from new Date().toISOString().split('T')[0] always returns a string |

**Failures**: None

---

## Failed Files (2)

### 13. mcp/server.js — FAILED (3 attempts)

**Failure**: NDS-003 new variant — blank-line insertion adjacent to pre-import JSDoc block

The PR #905 trivia-loss fix resolved the run-20 failure class (shebang stripped with OTel import). In run-21 the shebang (line 1) is preserved correctly. A new, independent failure emerged: violations at lines 2, 3, 31, 33, 34. When the agent inserts the tracer declaration and a blank line after the import block, the NDS-003 forward-check detects a line-count shift. The blank line addition adjacent to the file's pre-import JSDoc block causes the `normalizedStripped` reconstruction to misalign, reporting violations at the JSDoc delimiter (lines 2–3) and the McpServer constructor area (lines 31, 33, 34). The same 5 violations appeared across all 3 attempts — consistent oscillation pattern. The debug dump for attempt 3 shows correct output; the failure is in the validator algorithm's handling of blank-line insertion near a pre-import JSDoc block, not in the agent's instrumentation logic.

| Rule | Result |
|------|--------|
| NDS-003 | **FAIL** — 5 violations at lines 2, 3, 31, 33, 34 across all 3 attempts; blank-line insertion shifts JSDoc block and McpServer constructor out of expected positions in normalizedStripped |
| API-001 | N/A — file did not commit |
| NDS-006 | N/A |
| NDS-004 | N/A |
| NDS-005 | N/A |
| COV-001 | WOULD PASS — agent correctly planned main() entry-point span in all 3 attempts |
| COV-003 | N/A |
| COV-004 | WOULD PASS — createServer() is sync+unexported (RST-001/RST-004); only main() requires a span |
| COV-005 | WOULD PASS — agent declared commit_story.mcp.transport attribute ('stdio') |
| COV-006 | N/A |
| RST-001 | WOULD PASS — createServer() correctly identified as sync |
| RST-004 | WOULD PASS |
| SCH-001 | WOULD PASS — commit_story.mcp.server_start declared as new span extension in all attempts |
| SCH-002 | N/A — schema extensions declared but file did not commit |
| SCH-003 | N/A |
| CDQ-001 | N/A |
| CDQ-002 | N/A |
| CDQ-003 | N/A |
| CDQ-005 | N/A |
| CDQ-007 | N/A |

**Failures**: NDS-003 — new variant: blank-line insertion near pre-import JSDoc block causes forward-check misalignment (lines 2, 3, 31, 33, 34). Not a content error — the agent's output was structurally correct. Two independent NDS-003 issues on this file: (1) run-20 shebang trivia-loss FIXED by PR #905; (2) this blank-line-near-JSDoc variant UNRESOLVED.

---

### 14. index.js — FAILED (2 attempts)

**Failure**: NDS-003 new failure — single-line import expansion

index.js committed cleanly in runs 17–20. In run-21 the agent expanded three single-line import statements into multi-line blocks in attempt 1, adding ~14 new lines and shifting every subsequent original line — triggering 152 NDS-003 violations. Attempt 2 tried to reconstruct the original structure by backward-inferring from the validator's error output, but failed to reproduce the exact formatting; a NDS-005 violation also appeared in the last attempt (try/catch restructuring). Root cause: context pollution from PRD #902 schema accumulation. By file 30 of 30 with ~60 schema extensions accumulated, the agent reformatted the wide single-line imports in a style consistent with code it was generating. The agent's attempt 1 thinking correctly planned `commit_story.cli.main` span with `commit_story.cli.subcommand` attribute — the correct intent was blocked by the formatting failure.

| Rule | Result |
|------|--------|
| NDS-003 | **FAIL** — 152 violations in attempt 1 (single-line imports expanded to multi-line); attempt 2 failed to reconstruct exact formatting |
| NDS-005 | **FAIL** (last attempt) — try/catch restructuring introduced |
| API-001 | N/A — file did not commit |
| NDS-006 | N/A |
| NDS-004 | N/A |
| COV-001 | WOULD PASS — agent correctly planned main() entry-point span in both attempts |
| COV-003 | N/A |
| COV-004 | WOULD PASS — main() is the only async entry point requiring a span |
| COV-005 | WOULD PASS — agent declared commit_story.cli.subcommand attribute in both attempts; intent confirmed in thinking blocks |
| COV-006 | N/A |
| RST-001 | N/A |
| RST-004 | N/A |
| SCH-001 | WOULD PASS — commit_story.cli.main declared as new span extension |
| SCH-002 | N/A — schema extensions declared but file did not commit |
| SCH-003 | N/A |
| CDQ-001 | N/A |
| CDQ-002 | N/A |
| CDQ-003 | N/A |
| CDQ-005 | N/A |
| CDQ-007 | N/A |

**Failures**: NDS-003 (152 violations, import expansion) and NDS-005 (exception handling restructured in attempt 2). All other rules not evaluable — file did not commit. RUN20-3 recovery (commit_story.cli.subcommand) unverifiable; agent intent confirmed but instrumented output never reached validator success.

---

## Correct Skips (16)

All files correctly identified as having no instrumentable async exported functions.

| File | RST-001 Reason |
|------|----------------|
| generators/prompts/guidelines/accessibility.js | Module-level constant only — no functions exported |
| generators/prompts/guidelines/anti-hallucination.js | Module-level constant only — no functions exported |
| generators/prompts/guidelines/index.js | Synchronous only (getAllGuidelines) — no async fns |
| generators/prompts/sections/daily-summary-prompt.js | Synchronous only (dailySummaryPrompt) — no async fns |
| generators/prompts/sections/dialogue-prompt.js | Module-level constant only — no functions exported |
| generators/prompts/sections/monthly-summary-prompt.js | Synchronous only (monthlySummaryPrompt) — no async fns |
| generators/prompts/sections/summary-prompt.js | Synchronous only (summaryPrompt) — no async fns |
| generators/prompts/sections/technical-decisions-prompt.js | Module-level constant only — no functions exported |
| generators/prompts/sections/weekly-summary-prompt.js | Synchronous only (weeklySummaryPrompt) — no async fns |
| integrators/filters/message-filter.js | Synchronous only — no async fns |
| integrators/filters/sensitive-filter.js | Synchronous only — refactored to sync between runs 20 and 21 |
| integrators/filters/token-filter.js | Synchronous only — no async fns |
| mcp/tools/reflection-tool.js | registerReflectionTool is sync exported (RST-001); saveReflection refactored away between runs 20 and 21 — now sync-only |
| traceloop-init.js | Top-level initialization code only — no functions |
| utils/commit-analyzer.js | Synchronous only — no async fns |
| utils/config.js | Module-level initialization only — no functions |

**Note**: sensitive-filter.js (1 span in run-20) and reflection-tool.js (2 spans in run-20) are correctly re-classified as skips after the target repo refactored both files to sync-only implementations between runs 20 and 21. These are not regressions — the target repo changed.

---

## Quality Failures Summary

| File | Rule | Dimension |
|------|------|-----------|
| collectors/claude-collector.js | CDQ-001 — redundant span.end() in finally inside startActiveSpan callback | Code Quality |
| managers/summary-manager.js | COV-005 — save_daily_summary span has no attributes on the file-already-exists skip path | Coverage |

**Total canonical failures**: 2 (CDQ-001 and COV-005)

**Failed files** (not quality failures — files did not commit):
- mcp/server.js: NDS-003 (blank-line-near-JSDoc NDS-003 variant, unresolved)
- index.js: NDS-003 + NDS-005 (import expansion, new failure class)
