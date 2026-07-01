# Per-File Evaluation — Run-23

**Date**: 2026-06-10
**Branch**: spiny-orb/instrument-1781089793056
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 30 (13 committed + 1 partial + 16 correct skips)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check` exits 0 on all 13 instrumented files |
| NDS-002 (Tests) | **PASS** | 564 tests pass, 1 skipped (acceptance gate, no API key) |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api` in `peerDependencies` at `^1.9.0` |
| API-003 | **PASS** | No vendor-specific SDKs in `dependencies` |
| API-004 | **PASS** | No SDK-internal imports in `src/` (devDependencies only) |
| CDQ-008 | **PASS** | All 13 committed files use `trace.getTracer('commit-story')` consistently |

---

## Committed Files (13)

### 1. collectors/claude-collector.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only |
| NDS-006 | PASS — catch rethrows with both `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` |
| NDS-004 | PASS — both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | PASS — graceful-degradation catch inside `parseJSONLFile`'s JSON parsing loop correctly left unmodified (no rethrow, no recordException required) |
| COV-001 | PASS — `collectChatMessages` is the only exported async fn and has a span |
| COV-003 | PASS — catch has `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` |
| COV-004 | PASS — `collectChatMessages` is the only exported async fn; all others (`getClaudeProjectsDir`, `encodeProjectPath`, etc.) are sync |
| COV-005 | PASS — `commit_story.context.source`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.sessions_count`, `commit_story.context.messages_count` all set on the span |
| RST-001 | PASS — sync helpers correctly skipped: `getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `parseJSONLFile`, `filterMessages`, `groupBySession` |
| RST-004 | PASS — only the single exported async fn is instrumented |
| SCH-001 | PASS — span `commit_story.context.collect_chat_messages` registered in `semconv/agent-extensions.yaml` as a schema extension |
| SCH-002 | PASS — all 5 attributes pre-registered in `semconv/attributes.yaml` under `commit_story.context.*` |
| SCH-003 | PASS — `sessions_count` and `messages_count` set as integers; `source` set as string enum value `'claude_code'`; `time_window_start`/`time_window_end` set as strings via `.toISOString()` |
| CDQ-001 | PASS — `finally { span.end() }` inside an async `startActiveSpan` callback is correct. The OTel JS API does not auto-end spans in async callbacks (only sync callbacks auto-end); manual `span.end()` in `finally` is the required pattern. Run-21 failure was based on incorrect understanding of async callback lifecycle; issue #915 clarified this. |
| CDQ-002 | PASS — no nested child spans for delegation |
| CDQ-003 | PASS — attributes set in normal flow before catch block |
| CDQ-005 | PASS — no empty catch blocks |
| CDQ-007 | PASS — early-return path explicitly sets `sessions_count` and `messages_count` to `0`; happy path sets them from `sessions.size` and `allMessages.length` after computation |

**Failures**: None

**CDQ-001 resolution**: Run-21 failed CDQ-001 because `span.end()` was called in `finally` inside an async `startActiveSpan` callback — incorrectly evaluated as a double-end. Issue #915 clarified that for async callbacks, OTel JS does NOT auto-end the span; explicit `span.end()` in `finally` is the correct and required pattern. Run-23 CDQ-001 PASS.

---

### 2. collectors/git-collector.js (6 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only |
| NDS-006 | PASS — all 6 span catch blocks call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS — both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | PASS — no graceful-degradation catch patterns present; all catches rethrow |
| COV-001 | PASS — `getCommitData` and `getPreviousCommitTime` (both exported async fns) have entry-point spans |
| COV-002 | PASS — `runGit` span wraps `execFileAsync('git', ...)`, a child-process spawn |
| COV-003 | PASS — all 6 outer catch blocks record exception and set ERROR status before rethrowing |
| COV-004 | PASS — all 6 async functions instrumented: exported `getCommitData`, `getPreviousCommitTime`; unexported async I/O `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` |
| COV-005 | PASS — `runGit`: `commit_story.git.subcommand` + conditional `vcs.ref.head.revision`; `getCommitMetadata`: `vcs.ref.head.revision` + `commit_story.commit.author` + `commit_story.commit.message` + `commit_story.commit.timestamp`; `getCommitDiff`: `vcs.ref.head.revision` + `commit_story.git.diff_size`; `getMergeInfo`: `vcs.ref.head.revision` + `commit_story.git.parent_count` + `commit_story.git.is_merge`; `getCommitData`: `vcs.ref.head.revision` + merged output attrs |
| RST-001 | PASS — no sync-only helpers exist; all functions are async with I/O |
| RST-004 | PASS — `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` are unexported async I/O functions; instrumentation appropriate |
| SCH-001 | PASS — all 6 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS — all attribute keys registered in schema files |
| SCH-003 | **FAIL** — `commit_story.git.diff_size` is declared `type: string` in `semconv/agent-extensions.yaml` but set as `diff.length` (JavaScript integer) at runtime in both `getCommitDiff` and `getCommitData`. Schema type and runtime value type are mismatched. |
| CDQ-001 | PASS — no redundant `span.end()` calls; all spans use `finally { span.end() }` inside `startActiveSpan` callbacks |
| CDQ-002 | PASS — no unnecessary nested spans for simple delegation |
| CDQ-003 | PASS — attributes set before catch blocks in normal execution flow |
| CDQ-005 | PASS — no empty catch blocks; all catches rethrow after recording |
| CDQ-007 | PASS — `commitRef` guarded with `!= null` before `setAttribute` in `runGit`; attrs in `getCommitMetadata` set under `if (span.isRecording())` guard |

**Failures**: SCH-003 — `commit_story.git.diff_size` declared `type: string` in schema but set as integer (`diff.length`) at runtime.

---

### 3. commands/summarize.js (3 spans, 2 attempts)

> **Correction**: Original agent reported 4 spans (assumed a `runSummarize` orchestrator + 3 sub-commands). Source has 3 spans: `runSummarize` IS the daily command (span `run_daily`), `runWeeklySummarize` (span `run_weekly`), `runMonthlySummarize` (span `run_monthly`). No orchestrator span exists. PR confirms 3 spans.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — all 3 span catch blocks call `recordException` + `setStatus(ERROR)` before rethrowing |
| NDS-004 | PASS |
| NDS-007 | PASS — no graceful-degradation catch patterns in this file |
| COV-001 | PASS — `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize` are the 3 exported async entry points; all 3 have spans |
| COV-003 | PASS |
| COV-004 | PASS — all 3 exported async functions instrumented; 4 sync helpers (`isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`) correctly skipped per RST-001 |
| COV-005 | PASS — `commit_story.summarize.dates_count` (input, set before work begins) and `commit_story.summarize.force` (input flag) on spans; `*_summaries_generated` set as output attributes |
| RST-001 | PASS — sync helpers correctly not instrumented |
| RST-004 | PASS |
| SCH-001 | PASS — all 3 span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS — all attribute keys registered in `agent-extensions.yaml`; no invented near-synonyms |
| SCH-003 | **FAIL** — `commit_story.summarize.daily_summaries_generated`, `weekly_summaries_generated`, `monthly_summaries_generated` declared `type: string` in `agent-extensions.yaml` but set as bare integer `result.generated.length` (no `String()` conversion). `auto-summarize.js` uses `String(result.generated.length)` for the same attributes (correct). |
| CDQ-001 | PASS — no redundant span.end() calls |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `dates`/`weeks`/`months` arrays are passed-in parameters; `result.generated.length` safe (returned object with guaranteed `generated` array) |

**Failures**: SCH-003 — `*_summaries_generated` attributes declared `type: string` but set as bare integers. Fix is one-line `String()` wrapper per attribute, same as `auto-summarize.js` already does.

---

### 4. commands/auto-summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — all 3 span catch blocks call `recordException` + `setStatus(ERROR)` before rethrowing |
| NDS-004 | PASS |
| NDS-007 | PASS — per-item catch loops (for-of with inner try/catch to skip failed dates) left unmodified |
| COV-001 | PASS — `runAutoSummarize` is the exported async entry point with span `commit_story.auto_summarize.trigger_auto_summaries` |
| COV-003 | PASS |
| COV-004 | PASS — `runAutoSummarize`, `runAutoWeeklySummaries`, `runAutoMonthlySummaries` are the 3 exported async functions; all 3 instrumented |
| COV-005 | PASS — `trigger_auto_summaries` span: `commit_story.summarize.weekly_summaries_generated`, `commit_story.summarize.monthly_summaries_generated` (both set via `String(result.generated.length)`); sub-spans have respective `_generated` counts |
| RST-001 | PASS — no sync-only exported helpers |
| RST-004 | PASS |
| SCH-001 | PASS — all 3 span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS — all attribute keys registered; `commit_story.summarize.*_generated` keys reused from `summarize.js` namespace; no new extensions invented |
| SCH-003 | PASS — `weekly_summaries_generated` and `monthly_summaries_generated` set via `String(result.generated.length)` — consistent with `type: string` declaration in `agent-extensions.yaml` |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `result.generated?.length ?? 0` (optional chaining with nullish coalescing) used before `String()` conversion; no unsafe attribute calls |

**Failures**: None

**Trace evidence**: Datadog trace `2e5e91fecc58831fb2b8d4a12e474ca1` — 3 spans confirmed: `commit_story.auto_summarize.trigger_auto_summaries` (0 summaries generated on dry-run), `trigger_auto_weekly` (0 dates found), `trigger_auto_monthly` (0 dates found).

---

### 5. generators/journal-graph.js (4 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no original lines modified; instrumentation is purely additive |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS — `generateJournalSections` outer catch rethrows with both `recordException` + `setStatus(ERROR)`; node function inner catches are NDS-007 graceful-degradation (no rethrow, no recordException required) |
| NDS-004 | PASS |
| NDS-007 | PASS — inner graceful-degradation catches in `summaryNode`, `technicalNode`, `dialogueNode` untouched; wrapping is additive |
| COV-001 | PASS — `generateJournalSections` wrapped in `startActiveSpan('commit_story.journal.generate_sections', ...)` |
| COV-003 | PASS — outer `generateJournalSections` catch has `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS — 4 LangGraph node functions instrumented: `summaryNode`, `technicalNode`, `dialogueNode`, and orchestrator; pure sync helpers skipped per RST-001 |
| COV-005 | PASS — `commit_story.journal.sections` array captured on `generateJournalSections` span; `gen_ai.operation.name`, `gen_ai.model.id`, and conditional `gen_ai.usage.*` attrs on node spans |
| COV-006 | PASS — manual spans wrap application logic above auto-instrumented LangChain calls; `model.invoke()` calls execute inside active span contexts |
| RST-001 | PASS — pure sync helpers correctly skipped |
| RST-004 | PASS — all instrumented functions are LangGraph node async functions or exported orchestrators |
| SCH-001 | PASS — all 4 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS — zero new attributes created; all `gen_ai.*` attrs registered via OTel GenAI semconv; `commit_story.journal.sections` registered in base schema |
| SCH-003 | PASS — `sections` set as array of strings; `gen_ai.usage.*` integers when present |
| CDQ-001 | PASS — no redundant `span.end()` calls (async callback pattern, `finally { span.end() }` is correct per issue #915) |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `gen_ai.usage.*` attrs conditionally set inside `if (result.usage_metadata != null)` guard |

**Failures**: None. 3 attempts (up from 2 in run-21); 6th consecutive success (runs 18, 19, 20, 21, 23).

**Trace evidence**: Early-exit detection confirmed in Datadog — `generate_technical` and `generate_dialogue` show `gen_ai.operation.name: chat` but no `gen_ai.response.id` (early-exit path taken). Pattern unchanged from run-21.

---

### 6. generators/summary-graph.js (4 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — outer `generateSummary` catch rethrows with `recordException` + `setStatus(ERROR)`; node-level catches are NDS-007 graceful-degradation |
| NDS-004 | PASS |
| NDS-007 | PASS — graceful-degradation catches in all three LangGraph node functions left unmodified |
| COV-001 | PASS — `generateSummary` is the exported async orchestrator; span `commit_story.journal.generate_summary` wraps it |
| COV-003 | PASS |
| COV-004 | PASS — `generateSummary` and all three node functions instrumented |
| COV-005 | PASS — `commit_story.journal.summary_type` on orchestrator span; `gen_ai.operation.name`, `gen_ai.model.id`, and conditional `gen_ai.usage.*` on node spans |
| COV-006 | PASS — manual spans wrap application logic above auto-instrumented LangChain model.invoke() calls; context propagation preserved |
| RST-001 | PASS — sync formatting/parsing helpers correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — all 4 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS — `commit_story.journal.summary_type` registered in `attributes.yaml`; `gen_ai.*` from OTel semconv; no invented keys |
| SCH-003 | PASS — `summary_type` is string (`'daily'`/`'weekly'`/`'monthly'`); `gen_ai.usage.*` integers with null-guard; no type mismatches |
| CDQ-001 | PASS — no redundant span.end(); async callbacks use `finally { span.end() }` per issue #915 pattern |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `summary_type` is the parameter string (always set); `gen_ai.usage.*` guarded with `!= null` before `.length`; null-coercion patterns `date != null ? date : ''` applied consistently |

**Failures**: None. 3 attempts.

**SCH-002 self-correction confirmed**: Agent initially emitted `weekly_summaries_count` in `monthlySummaryNode` (semantic duplicate of `daily_summaries_count`), then self-corrected to `daily_summaries_count` with no validator intervention. Contrast case to `summary-detector.js`. See `failure-deep-dives.md`.

---

### 7. index.js (1 span, RUN21-2 CONFIRMED)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original `main()` body unchanged; span wraps the entire function |
| API-001 | PASS |
| NDS-006 | PASS — catch calls `recordException` + `setStatus(ERROR)` before rethrowing |
| NDS-004 | PASS |
| NDS-007 | PASS — inner `auto-summarize` try/catch inside `main()` correctly left unmodified (graceful degradation — auto-summarize failure doesn't abort the commit journal write) |
| COV-001 | PASS — `main()` is the entry point (unexported) and has span `commit_story.index.main`. COV-001 overrides RST-004 for entry-point functions. |
| COV-003 | PASS |
| COV-004 | PASS — `main()` is the only async function in the file |
| COV-005 | PASS — `vcs.ref.head.revision` (commit hash), `commit_story.git.subcommand` (CLI argument, null-guarded), `commit_story.journal.file_path` (journal entry path) all set on `main` span |
| RST-001 | PASS — no sync helper functions in this file |
| RST-004 | N/A — `main()` is the program entry point; COV-001 governs |
| SCH-001 | PASS — `commit_story.index.main` registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `vcs.ref.head.revision`, `commit_story.git.subcommand`, `commit_story.journal.file_path` all registered in base schema |
| SCH-003 | PASS — all attributes are strings; `subcommand` null-guarded before setAttribute |
| CDQ-001 | PASS — `span.end()` in `finally` is required here: `process.exit()` in error handling bypasses normal Promise resolution, so the callback auto-end would never fire. Explicit `span.end()` in `finally` is the only safe pattern. |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `vcs.ref.head.revision` from parsed CLI commit arg (always present for `commit` subcommand); `subcommand` null-guarded; `journal.file_path` from `saveJournalEntry()` return value |

**Failures**: None

**RUN21-2 CONFIRMED**: Run-21 failed NDS-003 — `index.js` committed with a corrupted import that referenced `@opentelemetry/api/experimental` (non-existent path). Run-23 result: clean `import { trace, SpanStatusCode } from '@opentelemetry/api'`. P1 fix confirmed effective.

**Trace evidence**: Datadog span `commit_story.index.main` — `vcs.ref.head.revision: 5bfc917`, `commit_story.git.subcommand: 'commit'`, `commit_story.journal.file_path: journal/entries/2026-06/2026-06-10.md`.

---

### 8. integrators/context-integrator.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only |
| NDS-006 | PASS — catch block adds `recordException` and `setStatus(ERROR)` before rethrowing |
| NDS-004 | PASS — both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | PASS — original try/catch structure preserved; instrumentation wraps inside `startActiveSpan` callback without restructuring |
| COV-001 | PASS — `gatherContextForCommit` is the sole exported async function and has a span |
| COV-003 | PASS — catch has `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` |
| COV-004 | PASS — `formatContextForPrompt` and `getContextSummary` are both synchronous; `gatherContextForCommit` is the sole exported async function and has a span |
| COV-005 | PASS — uses `commit_story.filter.messages_before/after`, `commit_story.context.messages_count/sessions_count`, `commit_story.context.time_window_start/end`, `vcs.ref.head.revision` |
| RST-001 | PASS — `formatContextForPrompt` and `getContextSummary` skipped as pure sync string/data builders |
| RST-004 | PASS — only the single exported async function is instrumented |
| SCH-001 | PASS — span name `commit_story.context.gather_context_for_commit` registered in agent-extensions.yaml |
| SCH-002 | PASS — all attributes pre-registered in `semconv/attributes.yaml` and `agent-extensions.yaml` |
| SCH-003 | PASS — time window attributes set via `.toISOString()` (string); integer counts from `filterStats` (int); `vcs.ref.head.revision` is a string |
| CDQ-001 | PASS — no redundant `span.end()` calls |
| CDQ-002 | PASS — no nested child spans for delegation |
| CDQ-003 | PASS — attributes set in normal flow before catch blocks |
| CDQ-005 | PASS — no empty catch blocks |
| CDQ-007 | PASS — all `setAttribute` calls use values from deterministic local variables or ISO string conversions of Date objects; no nullable field access |

**Failures**: None

**Notes**: Same attribute set as run-21. Datadog confirmed span `commit_story.context.gather_context_for_commit` with all attributes present and correctly typed (`service.instance.id: 050d24b0-abe6-4350-9bcd-b842bc2bc57b`).

---

### 9. managers/journal-manager.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS — `saveJournalEntry` and `discoverReflections` are the two exported async functions; both have spans |
| COV-003 | PASS |
| COV-004 | PASS — `formatTimestamp` and `formatJournalEntry` are exported but synchronous (skipped per RST-001); all unexported helpers are sync |
| COV-005 | PASS — `save_entry` span: `vcs.ref.head.revision`, `commit_story.commit.timestamp`, `commit_story.journal.file_path`; `discover_reflections` span: `commit_story.context.time_window_start/end`, `commit_story.journal.entries_count` |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — both span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `commit_story.journal.entries_count` is registered in `agent-extensions.yaml` (confirmed via `summary-manager.js` schema check; same key registered during summary-manager.js instrumentation pass) |
| SCH-003 | PASS — `vcs.ref.head.revision` is string (shortHash); `commit_story.commit.timestamp` is string via `.toISOString()`; `commit_story.journal.file_path` is string; `time_window_start/end` are strings via `.toISOString()`; `entries_count` is int |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | **PASS (regression fixed)** — Run-21 failure attributes are gone. `save_entry` span now uses `commit.shortHash` (always-present structural field) and `commit.timestamp.toISOString()` (always a Date). The run-21 offenders — `commit.hash` and `commit.author` (both nullable, truthy guards had been stripped) — do not appear in the instrumented source. |

**Failures**: None

**CDQ-007 fix confirmed**: Run-21 failed CDQ-007 (unconditional setAttribute from nullable `commit.hash` and `commit.author`). Run-23 replaces these with `commit.shortHash` and `commit.timestamp.toISOString()`, both guaranteed present. CDQ-007 PASS.

**SCH-002 quality note**: `commit_story.journal.entries_count` is used for a reflections count in the `discover_reflections` span. The attribute is registered and its use is not a near-synonym violation, but it is semantically imprecise (a more precise key would be `commit_story.journal.reflections_count`). This is a quality observation, not a canonical failure.

**Trace evidence**: Datadog span `commit_story.journal.save_entry` — `vcs.ref.head.revision: 5bfc917`, `commit_story.commit.timestamp: 2026-06-10T12:31:08.000Z`.

---

### 10. managers/summary-manager.js (9 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — all outer span catch blocks call `recordException` + `setStatus(ERROR)`; inner expected-catch blocks (readFile ENOENT, per-item skips) left unmodified per NDS-007 |
| NDS-004 | PASS |
| NDS-007 | PASS — inner catch blocks in `readDayEntries` (readFile failure → return []), `readWeekDailySummaries` (per-day failure → skip), `readMonthWeeklySummaries` (readdir and per-file failures → return [] / skip), and all save functions' ENOENT checks are expected-control-flow catches correctly left unmodified |
| COV-001 | PASS — `generateAndSaveDailySummary`, `generateAndSaveWeeklySummary`, `generateAndSaveMonthlySummary` are the primary pipeline orchestrators and each has an entry-point span |
| COV-003 | PASS — all 9 spans have outer catch blocks with `recordException` + `setStatus(ERROR)` |
| COV-004 | **PASS** — Run-21 COV-004 failure is fully resolved. All 9 exported async functions now instrumented: `readDayEntries`, `saveDailySummary`, `generateAndSaveDailySummary`, `readWeekDailySummaries`, `saveWeeklySummary`, `generateAndSaveWeeklySummary`, `readMonthWeeklySummaries`, `saveMonthlySummary`, `generateAndSaveMonthlySummary`. Previously-missing 6 I/O functions now have spans. |
| COV-005 | PASS — `entry_date` on all daily spans; `week_label` on all weekly spans; `month_label` on all monthly spans; `entries_count`, `daily_summaries_count`, `weekly_summaries_count` as output counts; `file_path` on all save spans |
| RST-001 | PASS — `formatDailySummary`, `formatWeeklySummary`, `formatMonthlySummary`, `getWeekBoundaries`, `getMonthBoundaries` are pure synchronous functions; all correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — all 9 span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS — all attribute keys registered in `agent-extensions.yaml` (`entries_count`, `week_label`, `daily_summaries_count`, `month_label`, `weekly_summaries_count`) or `attributes.yaml` (`entry_date`, `file_path`). No invented keys; no near-synonym extensions. |
| SCH-003 | PASS — numeric counts set from `array.length` (integer); string attributes (`entry_date`, `week_label`, `month_label`, `file_path`) are strings. No type mismatches. |
| CDQ-001 | PASS — `span.end()` in `finally` blocks only; no duplicate end() calls |
| CDQ-002 | PASS |
| CDQ-003 | PASS — `SpanStatusCode.ERROR` set in outer catch blocks only; not set on expected missing-file catches |
| CDQ-005 | PASS |
| CDQ-007 | PASS — all `setAttribute` values deterministically available: `entry_date` from `getDateString(date)` (always returns string), counts from `array.length` on local variables, `file_path` from `getSummaryPath()` return value |

**Failures**: None

**COV-004 fix confirmed**: Run-21 COV-004 failure (6 missing exported async I/O functions) is fully resolved. The file goes from 3 spans (pipeline orchestrators only) to 9 spans (all 3 orchestrators + all 6 I/O read/save functions).

---

### 11. mcp/server.js (1 span, RUN21-1 CONFIRMED)

> **Correction**: Original agent reported 2 spans (`initializeServer` + `handleRequest`). Neither function exists. The file has one async function: `main()` (program entry point, not exported, called directly at module scope). `createServer()` is sync. PR confirms 1 span. `handleRequest`, `getServerInfo`, `createErrorResponse`, `createSuccessResponse` are all fabricated — none exist in the file.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original server setup logic untouched; span wraps `main()` entry point |
| API-001 | PASS |
| NDS-006 | PASS — `main()` catch calls `recordException` + `setStatus(ERROR)` before rethrowing |
| NDS-004 | PASS |
| NDS-007 | PASS — no graceful-degradation catches in this file |
| COV-001 | PASS — `main()` is the program entry point; span `commit_story.mcp.server.start` wraps it |
| COV-003 | PASS |
| COV-004 | PASS — `main()` is the only async function; `createServer()` is sync and correctly skipped |
| COV-005 | PASS — `commit_story.mcp.transport_type: 'stdio'` set before the async work begins |
| RST-001 | PASS — `createServer()` is sync; correctly not instrumented |
| RST-004 | PASS |
| SCH-001 | PASS — `span.commit_story.mcp.server.start` registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `commit_story.mcp.transport_type` registered as schema extension; no invented keys |
| SCH-003 | PASS — `transport_type` is literal string `'stdio'` |
| CDQ-001 | PASS — `span.end()` only in `finally`; no redundant call in try |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `transport_type` is a compile-time constant; never null |

**Failures**: None

**RUN21-1 CONFIRMED**: Run-21 failed NDS-003 — `mcp/server.js` committed with a double-import of `@opentelemetry/api`. Run-23: clean single import, 1 attempt, committed successfully. P1 fix confirmed effective.

**No Datadog spans**: MCP server is a long-running stdio daemon, not invoked during the CLI dry-run. Instrumentation verified via static analysis only.

---

### 12. tools/context-capture-tool.js (2 spans, 1 attempt)

> **Correction**: The original per-file evaluation agent reported 3 spans, a CDQ-001 FAIL, and fabricated attributes (`context.sessions_count`, `context.messages_count`) that do not exist in the committed code. Source inspection confirms 2 spans and 2 `startActiveSpan` calls. CDQ-001 is PASS: neither function has `span.end()` in the try block — only `finally { span.end() }`. The agent also invented a `handleCaptureContext` function; the actual MCP tool handler is an anonymous async callback registered inline. The PR body reports "3 spans" but that is a spiny-orb counting artifact — the schema extensions section lists exactly 2 new span names. This correction changes the canonical failure count for run-23 from 3 to 2.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original tool handler logic untouched; spans wrap at async function boundaries |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS — `saveContext` catch calls `recordException` + `setStatus(ERROR)` before rethrowing; `capture_context` tool handler catch is graceful-degradation (NDS-007) |
| NDS-004 | PASS |
| NDS-007 | PASS — `capture_context` tool handler catch returns an MCP error response instead of rethrowing; agent correctly left it unmodified |
| COV-001 | PASS — `registerContextCaptureTool` is the only exported function and it is sync (RST-001 exemption); no exported async functions |
| COV-003 | PASS with constraint — `saveContext` catch records exception and sets ERROR status ✅; `capture_context` handler catch is NDS-007 graceful-degradation (cannot add `recordException`); this is an inherent limitation of the MCP tool pattern |
| COV-004 | PASS — `saveContext` (unexported async I/O function) has span `commit_story.context.save_context`; async MCP tool handler has span `commit_story.mcp.capture_context` |
| COV-005 | PASS — `capture_context` span: `commit_story.context.source: 'mcp'` set before async work begins; `commit_story.journal.file_path` set after save completes |
| RST-001 | PASS — `registerContextCaptureTool` is sync; correctly not instrumented |
| RST-004 | PASS |
| SCH-001 | PASS — both span names (`commit_story.context.save_context`, `commit_story.mcp.capture_context`) registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `commit_story.journal.file_path` and `commit_story.context.source` registered in `attributes.yaml`; no invented near-synonym keys |
| SCH-003 | PASS — `context.source` is string `'mcp'`; `file_path` is a string path; no type mismatches |
| CDQ-001 | PASS — `saveContext`: `finally { span.end() }` only, no `span.end()` in try block ✅; `capture_context` handler: `finally { span.end() }` only, no `span.end()` in try block ✅ |
| CDQ-002 | PASS |
| CDQ-003 | PASS — `context.source` set before the try block; `file_path` set inside try after successful save |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `context.source` is compile-time constant `'mcp'`; `file_path` is a computed path string (never null at setAttribute call site) |

**Failures**: None.

**File status note**: `context-capture-tool.js` was a **correct skip** in run-12 and run-21. In run-23 it was newly instrumented with 2 spans. The CDQ-001 FAIL reported by the original agent was a hallucination — source inspection confirms clean `finally`-only lifecycle management in both functions.

---

### 13. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — catch calls `recordException` + `setStatus(ERROR)` before rethrowing |
| NDS-004 | PASS |
| NDS-007 | PASS — no graceful-degradation catches |
| COV-001 | PASS — `ensureJournalDirectory` is the only exported async function and has span `commit_story.journal.ensure_directory` |
| COV-003 | PASS |
| COV-004 | PASS — `ensureJournalDirectory` is the only async function; `getJournalEntryPath`, `getJournalSummaryPath`, `getWeekLabel`, `getMonthLabel` are all sync |
| COV-005 | PASS — `commit_story.journal.file_path` (the directory argument) set on the span |
| RST-001 | PASS — `getJournalEntryPath`, `getJournalSummaryPath`, `getWeekLabel`, `getMonthLabel` are sync exports correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `commit_story.journal.file_path` registered in `attributes.yaml` |
| SCH-003 | PASS — `file_path` is the directory path string argument; always a string |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `dirPath` is the function argument; always a string at the call site |

**Failures**: None

**Trace evidence**: Datadog span `commit_story.journal.ensure_directory` — `commit_story.journal.file_path: 'journal/entries/2026-06/2026-06-10.md'`, duration 173µs. Child of `commit_story.index.main`.

---

## Partial File (1)

### Partial: utils/summary-detector.js (4/5 functions, 4 spans, 2 attempts)

**Why partial**: `findUnsummarizedWeeks` was skipped on both attempts due to SCH-002 oscillation. The agent declared `commit_story.journal.base_path` as a new attribute extension to capture the `basePath` parameter (a root directory path). The validator correctly identified this as a semantic duplicate of the registered `commit_story.journal.file_path`. Both attempts repeated the same declaration with no self-correction, triggering the validator's oscillation cutoff. The missing function is an infrastructure/validator rejection, not an agent quality failure on the 4 committed spans. (Contrast: `findUnsummarizedMonths`, committed in the same run, also uses `commit_story.journal.base_path` — that attribute did reach the schema registry via the committed instrumentation, but the validator's SCH-002 catch on `findUnsummarizedWeeks` fired before `base_path` was registered. The second attempt's `findUnsummarizedWeeks` declaration of the same key was then rejected as a semantic duplicate of `file_path`.)

Rubric evaluated on the 4 committed functions: `getDaysWithEntries`, `findUnsummarizedDays`, `getDaysWithDailySummaries`, `findUnsummarizedMonths`.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — all 4 spans use `tracer.startActiveSpan` with try/catch/finally; `if (dates != null)` guards before `setAttribute` are redundant (arrays are never null) but do not introduce lifecycle hazards |
| API-001 | PASS — `@opentelemetry/api` imported; `SpanStatusCode` and `trace` used; no SDK imports |
| NDS-006 | PASS — all 4 spans have `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, and rethrow in catch; inner `readdir` catches return early without touching span lifecycle (NDS-007 compliant) |
| NDS-004 | PASS — all spans end in `finally` blocks |
| NDS-007 | PASS — inner `try/catch` blocks on `readdir` calls return `[]` or `new Set()` without modifying span status; these are expected filesystem-not-found catches, not error paths |
| COV-001 | PASS — all 4 committed exported async entry-point functions have spans |
| COV-003 | PASS — sync helpers `getTodayString` and `getNowDate` correctly omitted |
| COV-004 | PASS (for 4 committed functions) — `getDaysWithEntries`, `findUnsummarizedDays`, `getDaysWithDailySummaries`, and `findUnsummarizedMonths` each have a span; the missing `findUnsummarizedWeeks` span is a validator rejection (SCH-002), not an agent quality decision |
| COV-005 | PASS — every committed span has ≥1 domain attribute: `getDaysWithEntries` → `commit_story.journal.file_path` + `commit_story.journal.entries_count`; `findUnsummarizedDays` → `commit_story.journal.entries_count` + `commit_story.summarize.dates_count`; `getDaysWithDailySummaries` → `commit_story.journal.file_path` + `commit_story.summarize.dates_count`; `findUnsummarizedMonths` → `commit_story.journal.base_path` + `commit_story.journal.unsummarized_months_count` |
| RST-001 | PASS — `getTodayString` and `getNowDate` are synchronous; no spans |
| RST-004 | PASS — unexported async helpers `getSummarizedDays`, `getSummarizedWeeks`, `getSummarizedMonths`, `getWeeksWithWeeklySummaries` correctly left without spans; they are pure internal sub-operations of already-instrumented exported callers |
| SCH-001 | PASS — all 4 committed span names registered in agent-extensions.yaml |
| SCH-002 | PASS for 4 committed spans — all attributes used are registered: `commit_story.journal.file_path` (main schema), `commit_story.journal.entries_count` (agent-extensions), `commit_story.summarize.dates_count` (agent-extensions), `commit_story.journal.base_path` (agent-extensions, registered by this commit), `commit_story.journal.unsummarized_months_count` (agent-extensions). The SCH-002 failure is the partial itself: `findUnsummarizedWeeks` was rejected because `commit_story.journal.base_path` was (correctly) identified as a semantic duplicate of `commit_story.journal.file_path` when first declared. |
| SCH-003 | PASS — integer counts set as integers; `commit_story.journal.file_path` and `commit_story.journal.base_path` are `string` — all match registry types |
| CDQ-001 | PASS — span naming uses dot-notation, snake_case |
| CDQ-002 | PASS — attribute keys use dot-notation, snake_case |
| CDQ-003 | PASS — no PII captured; `basePath` is a root directory path (typically `'.'`) |
| CDQ-005 | PASS |
| CDQ-006 | advisory — live-check fired CDQ-007 four times for "raw filesystem path where a basename would be safer" against the `file_path` and `base_path` attributes. Advisory findings not promoted to failures per run-23 methodology. |
| CDQ-007 | PASS — `if (dates != null)` guards before `setAttribute` calls are redundant (arrays assigned via `.sort()` or `.filter()` cannot be null) but do not produce correctness defects; `base_path` is unconditional on a defaulted string parameter (`'.'`) and is safe |

**Failures**: None for the 4 committed functions. Partial cause: `findUnsummarizedWeeks` SCH-002 oscillation — agent should have reused `commit_story.journal.file_path` for the `basePath` value, or instrumented only the output count (as run-21 agent did, using `commit_story.summary.unsummarized_weeks_count`).

**Datadog trace evidence**: All 4 committed spans observed — `commit_story.journal.get_days_with_entries` (entries_count: 36, file_path: '.'), `commit_story.journal.find_unsummarized_days` (entries_count: 36, dates_count: 0), `commit_story.journal.get_days_with_daily_summaries` (file_path: '.', dates_count: 35), `commit_story.journal.find_unsummarized_months` (base_path: '.', unsummarized_months_count: 0). Service instance ID: `050d24b0-abe6-4350-9bcd-b842bc2bc57b`.

---

## Correct Skips (16)

All 16 files verified RST-001 compliant. `git diff main..spiny-orb/instrument-1781089793056 -- <file>` returns empty for all 16 — no modifications on the instrument branch.

| File | RST-001 Reason |
|------|----------------|
| `utils/accessibility.js` | Exports only synchronous constants and sync formatting functions |
| `utils/anti-hallucination.js` | Exports only synchronous constants (string arrays) |
| `guidelines/index.js` | Exports synchronous guideline data (no async functions) |
| `utils/message-filter.js` | Exports only synchronous filter functions |
| `tools/reflection-tool.js` | Exports one sync function (`reflectionTool` definition) and one unexported async helper (`handleReflectionRequest`) — unexported async helper does not trigger COV-001/COV-004 obligations |
| `utils/traceloop-init.js` | No exports; sets up tracing at module scope (sync side effect); no async functions |
| `collectors/git-utils.js` | Exports only synchronous string manipulation utilities |
| `collectors/context-analyzer.js` | Exports only synchronous analysis functions |
| `utils/date-utils.js` | Exports only synchronous date formatting functions |
| `utils/token-counter.js` | Exports only synchronous counting functions |
| `utils/text-cleaner.js` | Exports only synchronous text processing functions |
| `guidelines/sections.js` | Exports only synchronous content arrays |
| `generators/section-formatter.js` | Exports only synchronous formatting functions |
| `generators/content-generator.js` | Exports only synchronous generation helpers |
| `commands/commit.js` | Delegates entirely to other modules via synchronous wiring; no async I/O of its own |
| `commands/journal.js` | Same as commit.js — synchronous dispatch only |

**Note on reflection-tool.js**: Two evaluation attempts were made on this file. Both correctly concluded RST-001 applies. `handleReflectionRequest` is an unexported async function — COV-001 and COV-004 only apply to exported functions and program entry points.

---

## Quality Failures Summary

| File | Rule | Dimension |
|------|------|-----------|
| collectors/git-collector.js | SCH-003 | Schema — `diff_size` declared `type: string`, set as integer |
| commands/summarize.js | SCH-003 | Schema — `*_summaries_generated` attrs declared `type: string`, set as integers |

**Total canonical failures**: 2 (2× SCH-003)

> **Correction note**: The original evaluation reported 3 failures including a CDQ-001 FAIL for `tools/context-capture-tool.js`. Source inspection confirmed that CDQ-001 was a hallucination — the agent fabricated a `span.end()` call in the try block that does not exist in the committed code. Both async functions use `finally { span.end() }` only. The CDQ-001 row has been removed and this is not a failure in run-23.

**Fixes confirmed from run-21**:
- `collectors/claude-collector.js` CDQ-001: PASS (run-21 false positive resolved via issue #915)
- `managers/journal-manager.js` CDQ-007: PASS (replaced nullable `commit.hash`/`commit.author` with guaranteed-present `commit.shortHash`/`commit.timestamp`)
- `managers/summary-manager.js` COV-004: PASS (6 missing exported async I/O functions now instrumented — file goes from 3 to 9 spans)
- `mcp/server.js` NDS-003 (RUN21-1): PASS (double-import syntax error fixed)
- `index.js` NDS-003 (RUN21-2): PASS (corrupted `@opentelemetry/api/experimental` import fixed)
