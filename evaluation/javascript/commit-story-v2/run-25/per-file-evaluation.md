// ABOUTME: Per-file evaluation of all instrumented and skipped files for commit-story-v2 run-25.

# Per-File Evaluation — commit-story-v2 run-25

**Instrument branch**: `spiny-orb/instrument-1781909345452`
**Committed files**: 13 (12 fully instrumented + 1 partial)
**Correct skips**: 17
**Total assessed**: 30 (13 committed + 17 skips)

## Evaluation Rubric Dimensions

- **NDS**: Non-Destructive Semantics — instrumentation must not alter original behavior
- **API**: OpenTelemetry API usage (no SDK imports in committed files)
- **COV**: Coverage — span placement, error recording, domain attribute richness
- **RST**: Restraint — no over-instrumentation of sync helpers or duplicates
- **SCH**: Schema — naming conventions, registered span names, typed attributes
- **CDQ**: Code Quality — span lifecycle, null safety, PII avoidance

---

## Committed Files

### 1. managers/auto-summarize.js (3 spans)

**Spans**: `commit_story.journal.trigger_auto_summaries`, `commit_story.journal.trigger_auto_weekly_summaries`, `commit_story.journal.trigger_auto_monthly_summaries`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | All `setAttribute` calls unconditional; output counts placed immediately before `return` on existing variables (no code restructuring) |
| API-001 | **PASS** | `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | All 3 outer catches call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrow |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | Inner loop catches (per-day/week/month errors) push to `result.failed`/`result.errors` arrays without rethrowing — graceful-degradation paths correctly left unmodified per NDS-007 |
| COV-001 | **PASS** | `triggerAutoSummaries`, `triggerAutoWeeklySummaries`, and `triggerAutoMonthlySummaries` are the exported async entry points — all 3 have spans |
| COV-003 | **PASS** | All 3 outer catches record and rethrow; inner loop catches are NDS-007 paths |
| COV-004 | **PASS** | All 3 exported async functions instrumented; `getErrorMessage` (sync unexported helper) correctly skipped per RST-001 and RST-004 |
| COV-005 | **PASS** | `trigger_auto_summaries`: `dates_count`, `weeks_count`, `months_count`, `generated_count`, `failed_count`; `trigger_auto_weekly_summaries`: `weeks_count`, `generated_count`, `failed_count`; `trigger_auto_monthly_summaries`: `months_count`, `generated_count`, `failed_count` — all ≥3 domain attributes per span |
| RST-001 | **PASS** | `getErrorMessage` (pure synchronous) correctly skipped |
| RST-004 | **PASS** | `getErrorMessage` is unexported; only exported async functions instrumented |
| SCH-001 | **PASS** | All 3 span names registered in `agent-extensions.yaml` as new extensions this run — agent chose non-colliding names (`trigger_auto_*` prefix) to avoid semantic overlap with `run_summarize`, `run_weekly_summarize`, `run_monthly_summarize` from other files |
| SCH-002 | **PASS** | All 5 attribute keys pre-registered in `semconv/attributes.yaml` (`commit_story.journal.dates_count`, `weeks_count`, `months_count`, `generated_count`, `failed_count`) — zero new attributes |
| SCH-003 | **PASS** | Counts set from `.length` on arrays (integer); `generated_count` and `failed_count` computed via array arithmetic (integer) |
| CDQ-001 | **PASS** | `finally { span.end() }` on all 3 spans |
| CDQ-002 | **PASS** | No unnecessary span nesting |
| CDQ-003 | **PASS** | No PII in attributes |
| CDQ-005 | **PASS** | No empty catch blocks; inner loop catches push to error arrays |
| CDQ-007 | **PASS** | All attributes sourced from `.length` or arithmetic on array lengths — no nullable field risk |

**Failures**: None

**Trace supplement**: The captured trace (`service.instance.id: bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3`, 2026-06-19) is from run-24 instrumentation, not run-25. Querying `service:commit-story @service.instance.id:bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3 resource_name:commit_story.journal.trigger_auto*`: the run-24 span name pattern was `trigger_auto_summaries` — confirmed present in Datadog from the organic run, with `dates_count: 1`, `generated_count: 1`, `failed_count: 0` and correct parent-child relationship to the `commit_story.cli.main` orchestrator span.

**Agent schema note**: The agent documented that `run_summarize`, `run_weekly_summarize`, and `run_monthly_summarize` span names were already in use by other files in this instrumentation run, so new names (`trigger_auto_*`) were chosen to avoid collision. All three are correctly registered in `agent-extensions.yaml`.

---

### 2. collectors/claude-collector.js (1 span)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | No truthy-check guards around `setAttribute`; `sessions_count` and `messages_count` set unconditionally on both the early-return path (explicit `0`) and the happy path (from computed values) |
| API-001 | **PASS** | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | Catch block calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | Graceful-degradation catch inside `parseJSONLFile`'s JSON parsing loop correctly left unmodified — no rethrow, no `recordException` required per NDS-007 |
| COV-001 | **PASS** | `collectChatMessages` is the only exported async function; span `commit_story.context.collect_messages` wraps the entire body |
| COV-003 | **PASS** | Catch has `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrow |
| COV-004 | **PASS** | `collectChatMessages` is the only exported async function; all others are pure synchronous exports |
| COV-005 | **PASS** | Five attributes set: `commit_story.context.source`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.sessions_count`, `commit_story.context.messages_count` |
| RST-001 | **PASS** | All seven sync helpers correctly skipped |
| RST-004 | **PASS** | Only the single exported async function is instrumented |
| SCH-001 | **PASS** | Span name registered in `semconv/agent-extensions.yaml` as `id: span.commit_story.context.collect_messages` |
| SCH-002 | **PASS** | All 5 attribute keys pre-registered in `semconv/attributes.yaml` under `registry.commit_story.context` |
| SCH-003 | **PASS** | Counts as integers, source as enum string, time windows via `.toISOString()` |
| CDQ-001 | **PASS** | `finally { span.end() }` inside async `startActiveSpan` callback |
| CDQ-002 | **PASS** | No nested child spans |
| CDQ-003 | **PASS** | Input attributes set before early-return guard; output attributes set on both exit paths |
| CDQ-005 | **PASS** | No empty catch blocks |
| CDQ-007 | **PASS** | Early-return path sets counts to explicit `0`; happy path sets from `.size`/`.length` — no nullable-field risk |

**Failures**: None

**Trace supplement**: Trace data reflects **run-24 instrumentation** (`spiny-orb/instrument-1781811083418`, SHA `bb08c9c`) from an organic journal-entry generation run on 2026-06-19. Run-25 has not yet been organically invoked. All 5 attributes confirmed at runtime: `source: claude_code`, `time_window_start/end` present, `sessions_count: 0`, `messages_count: 0` (early-return path). Span `status: ok`, no error.

**CDQ-007 advisory (agent-reported, non-failure)**: The instrumentation.md flagged two CDQ-007 PII advisories. Inspection of the committed code shows none of the five attributes set contain PII or raw paths — the advisory appears to be a false positive from the validator's pattern matching. No CDQ-007 failure applies here.

---

### 3. mcp/tools/context-capture-tool.js (1 span)

> **Skip→commit transition**: Runs 12, 23, and 24 all classified this file as a correct RST-001 skip (exported `registerContextCaptureTool` is synchronous). Run-25 commits a span on `saveContext` (unexported, async, performs `mkdir` + `appendFile` I/O). This is a legitimate commit. RST-004 permits — but does not require — instrumenting unexported async I/O functions. Run-12's per-file note flagged this as a candidate: "may benefit from instrumenting the internal async helpers given their I/O nature." Run-25 is the first run to act on that advisory.
>
> **Coverage delta — attribute regression**: Run-23 set 3 attributes (`entry_date`, `file_path`, `source: 'mcp'`). Run-24 set 2 (`entry_date`, `file_path`). Run-25 sets 1 (`file_path` only) — `entry_date` dropped. COV-005 passes (≥1 domain attribute), but the trend is declining attribute richness across runs on unchanged source.

**Span**: `commit_story.context.save_context`
**Attributes set (1)**: `commit_story.journal.file_path`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | No truthy-check guards; `file_path` set unconditionally after `appendFile` resolves |
| API-001 | **PASS** | `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | Catch calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | The anonymous MCP callback catch swallows the error (returns MCP error response — expected control flow). Agent correctly left it unmodified. |
| COV-001 | **PASS** | `saveContext` is an async I/O function; span wraps the entire body |
| COV-003 | **PASS** | Catch records exception and sets ERROR before rethrow |
| COV-004 | **PASS** | `saveContext` is the only async function; `registerContextCaptureTool` (exported, sync) correctly skipped |
| COV-005 | **PASS** | `commit_story.journal.file_path` provides meaningful domain context (captured path) |
| RST-001 | **PASS** | Exported `registerContextCaptureTool` (synchronous) is not instrumented — correct skip |
| RST-004 | **PASS** | `saveContext` is unexported async I/O; RST-004 permits this; agent exercised the option |
| SCH-001 | **PASS** | `commit_story.context.save_context` registered in `agent-extensions.yaml` |
| SCH-002 | **PASS** | `commit_story.journal.file_path` registered in `semconv/attributes.yaml`; no near-synonyms |
| SCH-003 | **PASS** | `type: string`; set as string from filesystem path |
| CDQ-001 | **PASS** | `finally { span.end() }` present |
| CDQ-002 | **PASS** | No nested spans |
| CDQ-003 | **PASS** | `file_path` is project-relative per schema definition — not a raw user home path |
| CDQ-005 | **PASS** | No empty catch blocks |
| CDQ-007 | **PASS** | `file_path` is set after `appendFile` resolves; the value is the `contextDir` argument, not a nullable field |

**Failures**: None

**CDQ-007 advisory (agent-reported, non-failure)**: The instrumentation.md flagged "raw filesystem path" as a CDQ-007 advisory. `commit_story.journal.file_path` is intentionally project-relative per schema definition and examples, consistent with all other files using this attribute. Advisory is a false positive.

**Trace supplement**: No Datadog spans — `saveContext` is only invoked by the MCP tool handler, which is not exercised during CLI/dry-run invocations. Static analysis only.

---

### 4. integrators/context-integrator.js (1 span)

**Span**: `commit_story.context.gather_context_for_commit`
**Attributes set (8)**: `vcs.ref.head.revision`, `commit_story.commit.message`, `commit_story.commit.timestamp`, `commit_story.filter.messages_before`, `commit_story.filter.messages_after`, `commit_story.context.messages_count`, `commit_story.context.sessions_count`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | No truthy-check guards around `setAttribute`; all values set unconditionally |
| API-001 | **PASS** | `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | Catch block calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | N/A | No graceful-degradation catches in source |
| COV-001 | **PASS** | `integrateContext` is the only exported async function; span wraps the entire body |
| COV-003 | **PASS** | Catch records exception and sets ERROR before rethrow |
| COV-004 | **PASS** | Only the one exported async function is instrumented; both sync exports (`formatContextForPrompt`, `getContextSummary`) correctly skipped |
| COV-005 | **PASS** | 8 domain attributes present — well above the ≥1 threshold |
| RST-001 | **PASS** | Sync helpers correctly skipped |
| RST-004 | **PASS** | Only the exported async function is instrumented |
| SCH-001 | **PASS** | Span name registered in `semconv/agent-extensions.yaml` |
| SCH-002 | **PASS** | All 8 attributes pre-registered in `semconv/attributes.yaml`; no near-synonyms |
| SCH-003 | **PASS** | Strings via `.toISOString()`, ints from `.length`/`.size`/filterStats counts — all correctly typed |
| CDQ-001 | **PASS** | `finally { span.end() }` inside async `startActiveSpan` callback |
| CDQ-002 | **PASS** | No nested child spans |
| CDQ-003 | **PASS** | No PII in attributes |
| CDQ-005 | **PASS** | No empty catch blocks |
| CDQ-007 | **PASS** | All setAttribute sources are non-nullable at call site; `timeWindow.start` safe because both conditional branches assign a Date before context construction |

**Failures**: None

**Coverage delta vs run-24**: Run-25 adds `commit_story.commit.message` and `commit_story.commit.timestamp` (2 new attrs vs run-24's 6-attr set). Net improvement; no attributes dropped.

**CDQ-007 advisory (agent-reported, non-failure)**: The instrumentation.md flagged CDQ-007 advisories on `commitData.author`/`authorEmail` field accesses. Inspection shows these fields are accessed during context object construction before `setAttribute` calls, not as direct setAttribute values. No PII is set on the span. Advisory is a false positive.

**Trace supplement**: No live spans available for run-25 service.instance.id (run-25 not yet organically invoked). Static analysis only.

---

### 5. collectors/git-collector.js (6 spans, ×2)

> **RUN24-2 Fix Verification**: The SCH-003 backstop was NOT triggered — the run-25 agent chose to omit `diff_lines` entirely rather than include it. The 3 schema extension attrs declared are correctly typed. The auto-coercion fix (spiny-orb commit 91e9413 `fixAttributeTypeCoercions()`) was not exercised for this file.
>
> **×2 Attempts**: Attempt 1 triggered NDS-007 ×2 and COV-003 ×1 errors. Attempt 2 applied `span.recordException(err)` + `span.setStatus(ERROR)` before the existing rethrow in `runGit`'s catch block, then passed clean.

**Spans (6)**: `commit_story.git.get_commit_data`, `commit_story.git.get_previous_commit_time`, `commit_story.git.get_commit_diff`, `commit_story.git.run_git`, `commit_story.git.parse_diff`, `commit_story.git.get_branch_name`
**Schema extension attributes (3)**: `commit_story.git.command` (string), `commit_story.git.parent_count` (int), `commit_story.git.is_merge` (boolean)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | No truthy-check guards; `metadata.subject` and `mergeInfo.isMerge` checked via `!= null` guards before `setAttribute` |
| API-001 | **PASS** | `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | `runGit` catch calls `span.recordException(err)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | N/A | `runGit`'s catch always rethrows; not a graceful-degradation catch |
| COV-001 | **PASS** | All 6 exported and unexported async functions have entry-point spans |
| COV-003 | **PASS** | All catch blocks record exception and set ERROR status |
| COV-004 | **PASS** | 2 exported async functions (`getCommitData`, `getPreviousCommitTime`) + 4 unexported async helpers all have spans |
| COV-005 | **PASS** | `commit_story.git.command` on runGit spans; `vcs.ref.head.revision` on getCommitData span; `commit_story.git.parent_count` and `commit_story.git.is_merge` on getCommitData |
| RST-001 | **PASS** | Sync helpers correctly skipped |
| RST-004 | **PASS** | RST-004 permits instrumenting unexported async I/O helpers; agent instrumented all 4 |
| SCH-001 | **PASS** | All 6 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | **PASS** | All 3 schema extension attrs registered in `semconv/agent-extensions.yaml`; agent correctly omitted `commit_story.commit.author` (PII advisory); no near-synonyms |
| SCH-003 | **PASS** | `command` set as string, `parent_count` set as integer from `commitData.parents.length`, `is_merge` set as boolean from boolean expression — all correctly typed |
| CDQ-001 | **PASS** | `finally { span.end() }` in all `startActiveSpan` callbacks |
| CDQ-002 | **PASS** | No nested child spans |
| CDQ-003 | **PASS** | No PII in attributes; agent notes confirm `commit_story.commit.author` was intentionally excluded |
| CDQ-005 | **PASS** | No empty catch blocks |
| CDQ-007 | **PASS** | `metadata.subject` guarded with `!= null` before setAttribute; `mergeInfo.isMerge` guarded with `!= null`; no unguarded nullable fields |

**Failures**: None

**RUN24-2 Status**: NOT TRIGGERED. Agent omitted `commit_story.git.diff_lines` entirely. The SCH-003 auto-coercion backstop (spiny-orb commit 91e9413) has not been confirmed working against a real case — this file did not exercise it.

**Trace supplement**: Datadog returned run-24 spans (same service.instance.id `bcb5e6b0...`). The `diff_lines: 296` integer visible in run-24 spans confirms the prior SCH-003 finding; it is not a run-25 issue. Run-25 spans not yet available.

---

### 6. generators/journal-graph.js (4 spans, ×2)

**Spans**: `commit_story.journal.summary_node`, `commit_story.journal.technical_node`, `commit_story.journal.dialogue_node`, `commit_story.journal.generate_sections`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | Attempt 1 introduced a spurious `}` in the `formatChatMessages` template literal — fixed in attempt 2; committed code is exact match to original |
| API-001 | **PASS** | `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | `generate_sections` outer catch calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrow; node-function catches are NDS-007 graceful degradation |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | Three node-function catches (`summaryNode`, `technicalNode`, `dialogueNode`) return graceful error state objects without rethrowing — `recordException`/`setStatus` correctly absent per NDS-007 |
| COV-001 | **PASS** | `generateJournalSections` is the exported async entry point; `summaryNode`, `technicalNode`, `dialogueNode` are exported (called by LangGraph runtime) — all 4 async functions have spans |
| COV-003 | **PASS** | `generate_sections` catch records and rethrows; node-function catches are NDS-007 paths (no rethrow expected) |
| COV-004 | **PASS** | All 4 exported async functions instrumented; `getModel`, `resetModel`, and all synchronous helpers (`analyzeCommitContent`, `hasFunctionalCode`, `formatSessionsForAI`, etc.) correctly skipped per RST-001 |
| COV-005 | **PASS** | Each node span carries `commit_story.ai.section_type`, `gen_ai.operation.name`, `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.request.temperature`, `gen_ai.request.max_tokens`; `generate_sections` carries `vcs.ref.head.revision` and `commit_story.journal.sections` |
| COV-006 | **PASS** | Manual node spans wrap the entire node body including `model.invoke()` (auto-instrumented by LangChain); outer `startActiveSpan` is the parent of any LangChain child spans |
| RST-001 | **PASS** | All synchronous helpers skipped |
| RST-004 | **PASS** | `getGraph` (unexported, synchronous) covered by `generate_sections` span |
| SCH-001 | **PASS** | All 4 span names registered in `agent-extensions.yaml` as new extensions this run |
| SCH-002 | **PASS** | All attributes pre-registered in base schema — zero new attribute keys added (`gen_ai.*` are OTel semconv; `commit_story.ai.section_type`, `vcs.ref.head.revision`, `commit_story.journal.sections` from `attributes.yaml`) |
| SCH-003 | **PASS** | Section type as string constant; temperature from `NODE_TEMPERATURES?.summary/technical/dialogue` (numeric); max_tokens as integer literal; span name list as array; commit shortHash via `?? ''` fallback |
| CDQ-001 | **PASS** | `finally { span.end() }` on all 4 spans |
| CDQ-002 | **PASS** | No unnecessary span nesting |
| CDQ-003 | **PASS** | No PII in attributes |
| CDQ-005 | **PASS** | No empty catch blocks; node-function catches return structured fallback state objects |
| CDQ-007 | **PASS** | Attempt 1 set `NODE_TEMPERATURES.summary` without optional chaining (CDQ-007 failure); attempt 2 corrected to `NODE_TEMPERATURES?.summary` — module-level const cannot be null but validator requires the guard; committed code complies |

**Failures**: None

**Trace supplement**: Trace data reflects **run-24 instrumentation** (`spiny-orb/instrument-1781811083418`, SHA `bb08c9c`) from an organic journal-entry generation run on 2026-06-19. Run-25 has not yet been organically invoked on its instrument branch. Querying `service:commit-story @service.instance.id:bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3 resource_name:commit_story.journal.*`: run-24 node span names were `generate_summary`, `generate_technical`, `generate_dialogue` — run-25 names differ (see coverage delta below). The `generate_sections` top-level span and the three section-generation spans all confirmed with `status: ok` in the run-24 organic run.

**Coverage delta observation vs run-24**: Span names for node functions changed — run-24 used `generate_summary`, `generate_technical`, `generate_dialogue`; run-25 uses `summary_node`, `technical_node`, `dialogue_node`. Additionally, run-25 drops `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens` from node spans entirely (run-24 had them guarded with `!= null`). COV-005 still passes (other domain attributes remain), but token-cost observability is absent from node spans. Worth noting for future runs — these attributes are registered in the schema and would improve LLM cost tracing.

---

### 7. managers/journal-manager.js (2 spans)

**Spans**: `commit_story.journal.save_journal_entry`, `commit_story.journal.discover_reflections`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | All `setAttribute` calls unconditional; `vcs.ref.head.revision` and `commit_story.commit.files_changed` inside `if (commit.shortHash)` / `if (commit.filesChanged !== undefined)` guards — guards are on reading the field, not on calling setAttribute |
| API-001 | **PASS** | `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | Both outer catches call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrow |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | `saveJournalEntry` inner `catch {}` (empty, handles missing reflection file for duplicate check) and `discoverReflections` inner catches (`catch { continue }` in readdir and readFile loops) are graceful-degradation paths correctly left unmodified |
| COV-001 | **PASS** | `saveJournalEntry` and `discoverReflections` are the exported async entry points — both have spans |
| COV-003 | **PASS** | Both outer catches record and rethrow; inner catches are NDS-007 paths |
| COV-004 | **PASS** | Both exported async functions instrumented; `formatTimestamp`, `formatJournalEntry`, and all unexported sync helpers correctly skipped per RST-001 and RST-004 |
| COV-005 | **PASS** | `save_journal_entry`: `entry_date`, `file_path`, `commit.message`, `vcs.ref.head.revision`, `commit.files_changed` (conditional on field presence); `discover_reflections`: `time_window_start`, `time_window_end`, `entries_count` — both spans carry ≥3 domain attributes |
| RST-001 | **PASS** | `formatTimestamp`, `formatJournalEntry`, `extractFilesFromDiff`, `countDiffLines`, `formatReflectionsSection`, `parseReflectionEntry`, `parseTimeString`, `parseReflectionsFile`, `isInTimeWindow`, `getYearMonthRange` all correctly skipped |
| RST-004 | **PASS** | All unexported helpers skipped; only the 2 exported async functions instrumented |
| SCH-001 | **PASS** | Both span names registered in `agent-extensions.yaml` as new extensions this run |
| SCH-002 | **PASS** | All attributes pre-registered in `semconv/attributes.yaml` — `commit_story.journal.entries_count` used for reflection count (semantically appropriate); zero new attributes |
| SCH-003 | **PASS** | Date via `.toISOString().split('T')[0]` (string); path as raw string; message via `.split('\n')[0]` (string); `files_changed` from `commit.filesChanged` (integer); `entries_count` from `reflections.length` (integer) |
| CDQ-001 | **PASS** | `finally { span.end() }` on both spans |
| CDQ-002 | **PASS** | No unnecessary span nesting |
| CDQ-003 | **PASS** | `commit.message` is truncated to first line before setAttribute — reduces noise; `file_path` is a journal output path, not PII |
| CDQ-005 | **PASS** | No empty catch blocks in committed spans; inner catches are NDS-007 graceful-degradation paths |
| CDQ-007 | **PASS** | Run-12 CDQ-007 vectors (`commit.hash`, `commit.author`) absent in run-25; `vcs.ref.head.revision` guarded by `if (commit.shortHash)`, `files_changed` guarded by `if (commit.filesChanged !== undefined)` — no nullable-field risk; run-24 verdict sustained |

**Failures**: None

**Trace supplement**: Trace data is from run-24 instrumentation (`service.instance.id: bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3`, 2026-06-19), not run-25. Querying `service:commit-story @service.instance.id:bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3 resource_name:commit_story.journal.save_entry`: run-24 used span name `save_entry` — confirmed present in Datadog with `file_path`, `quotes_count: 0` (docs-only commit). Run-25 uses `save_journal_entry` (new extension); no runtime evidence for the new name yet.

**Coverage delta vs run-24**: Span name changed from `save_entry` (run-24) to `save_journal_entry` (run-25) — both registered as schema extensions in their respective runs. Attribute set changed: run-24 had `commit.timestamp`, `file_path`, `quotes_count`; run-25 has `entry_date`, `file_path`, `commit.message`, `vcs.ref.head.revision`, `files_changed` — higher count (5 vs 3). COV-005 passes in both runs.

---

### 8. mcp/server.js (1 span)

> Span name changed from run-24's `commit_story.mcp.main` to `commit_story.mcp.server_start`. Attribute key changed from `commit_story.mcp.transport_type` to `commit_story.mcp.transport` (dropped `_type` suffix). Run-12 carried `commit_story.mcp.server_name` and `commit_story.mcp.server_version`; run-24 replaced both with `commit_story.mcp.transport_type`; run-25 retains the transport concept with a renamed key. This is agent choice variation, not a quality issue.

**Span**: `commit_story.mcp.server_start`
**Schema extension attribute**: `commit_story.mcp.transport` (string: `'stdio'`)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | Hardcoded string literal — no truthy-check guards |
| API-001 | **PASS** | `@opentelemetry/api` only |
| NDS-006 | **PASS** | Catch block calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | N/A | No graceful-degradation catches |
| COV-001 | **PASS** | `main()` entry-point span; COV-001 overrides RST-004 for entry points |
| COV-003 | **PASS** | Catch records and rethrows |
| COV-004 | **PASS** | `main()` is the only async function; `createServer` is synchronous |
| COV-005 | **PASS** | `commit_story.mcp.transport: 'stdio'` — captures IPC transport identity |
| RST-001 | **PASS** | `createServer` sync factory — correctly skipped |
| RST-004 | **PASS** | `createServer` covered under `main()`'s span |
| SCH-001 | **PASS** | `span.commit_story.mcp.server_start` registered in `agent-extensions.yaml` |
| SCH-002 | **PASS** | `commit_story.mcp.transport` registered in `agent-extensions.yaml`; no near-synonyms |
| SCH-003 | **PASS** | `type: string`; set as string literal |
| CDQ-001 | **PASS** | `finally { span.end() }` present |
| CDQ-002 | **PASS** | No nested spans |
| CDQ-003 | **PASS** | No PII |
| CDQ-005 | **PASS** | No empty catches |
| CDQ-007 | **PASS** | Hardcoded constant — no nullable risk |

**Failures**: None

**Trace supplement**: No run-25 spans available (not yet organically invoked). Static analysis only.

---

### 9. generators/summary-graph.js (6 spans)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | All attributes set unconditionally; counts use `?.length ?? 0` (always int); string params guaranteed by callers |
| API-001 | **PASS** | `@opentelemetry/api` only |
| NDS-006 | **PASS** | All 6 outer catches record exception, set ERROR status, and rethrow |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | 3 inner graceful-degradation catches (one per node function) return fallback state objects without rethrowing — preserved exactly as-is per NDS-007 |
| COV-001 | **PASS** | 3 exported async entry points (`generateDailySummary`, `generateWeeklySummary`, `generateMonthlySummary`) and their 3 internal node functions all have spans |
| COV-003 | **PASS** | All 6 outer catches record exception and rethrow |
| COV-004 | **PASS** | All 6 async functions instrumented; synchronous helpers (`getModel`, `resetModel`, `formatEntriesForSummary`, `parseSummarySections`, `cleanDailySummaryOutput`, graph builders, etc.) correctly skipped per RST-001 |
| COV-005 | **PASS** | Daily spans: `entry_date` + `entries_count`; weekly spans: `week_label` + `daily_summaries_count`; monthly spans: `month_label` + `weekly_summaries_count` — each span carries ≥2 domain attributes |
| COV-006 | **PASS** | Manual spans wrap the entire node body including `getModel(0.7).invoke(...)` (auto-instrumented LangChain call); outer span is the parent of any LangChain child spans |
| RST-001 | **PASS** | Sync helpers (`formatEntriesForSummary`, `parseSummarySections`, `cleanDailySummaryOutput`, and weekly/monthly equivalents) correctly skipped |
| RST-004 | **PASS** | All 3 node functions (`dailySummaryNode`, `weeklySummaryNode`, `monthlySummaryNode`) are exported; unexported sync helpers skipped per RST-001 |
| SCH-001 | **PASS** | All 6 span names registered in `agent-extensions.yaml` — validator advisory findings are false positives per established rubric precedent |
| SCH-002 | **PASS** | 5 new attributes registered with distinct semantics: `entries_count` (rendered journal entries), `week_label` (ISO week identifier string), `daily_summaries_count`, `month_label` (month identifier string), `weekly_summaries_count`; no near-synonyms with base schema attributes |
| SCH-003 | **PASS** | Integer counts sourced from `.length` via `?.length ?? 0`; string labels are string parameters; `entry_date` from `date` param (string); all types match schema declarations |
| CDQ-001 | **PASS** | `finally { span.end() }` on all 6 spans |
| CDQ-002 | **PASS** | No unnecessary nesting |
| CDQ-003 | **PASS** | No PII; date strings and count integers only |
| CDQ-005 | **PASS** | No empty catches; all 3 inner catches return structured fallback state objects |
| CDQ-007 | **PASS** | All counts guarded with `?.length ?? 0`; string label params are always strings at the call site |

**Failures**: None

**Trace supplement**: The captured trace (`service.instance.id: bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3`, 2026-06-19) is from run-24 instrumentation, not run-25. The `commit_story.journal.generate_daily_summary` span from the run-24 organic run appears in Datadog with `entries_count: 33` and `entry_date: "2026-06-18"`, confirming the attribute shape and naming convention used in run-25 is stable.

**Coverage delta observation vs run-24**: Run-25 adds `daily_summaries_count` (on `weeklySummaryNode` and `generateWeeklySummary`) and `weekly_summaries_count` (on `monthlySummaryNode` and `generateMonthlySummary`), giving each span a pair of domain attributes. Net coverage improvement over run-24's single-attribute approach.

---

### 10. managers/summary-manager.js (7 spans, ×2) ⚠️ PARTIAL

**Partial status**: 7 of 9 exported async functions were committed. Two functions were skipped by the validator:

- `readWeekDailySummaries` — skipped because COV-003 failed on an inner-loop catch using `if (err.code !== 'ENOENT') throw err`
- `readMonthWeeklySummaries` — skipped for the same reason (two inner-loop catches with the same pattern)

**Committed spans**: `commit_story.journal.read_day_entries`, `commit_story.journal.save_daily_summary`, `commit_story.journal.generate_and_save_daily_summary`, `commit_story.journal.save_weekly_summary`, `commit_story.journal.generate_and_save_weekly_summary`, `commit_story.journal.save_monthly_summary`, `commit_story.journal.monthly_summary_pipeline`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | All `setAttribute` calls unconditional; `entries != null` check before `setAttribute` is a null guard, not a truthy-check deviation |
| API-001 | **PASS** | Imports `SpanStatusCode` and `trace` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | All 7 outer catch blocks call `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, and rethrow |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | Inner ENOENT catches in `readDayEntries` (ENOENT → return `[]`) and duplicate-check `access` calls in save functions (ENOENT → proceed) correctly left unmodified per NDS-007; the 2 skipped functions had the contested conditional-rethrow pattern |
| COV-001 | **PASS** | All 7 committed exported async functions have entry-point spans |
| COV-003 | **PASS** | All 7 committed function catch blocks record and rethrow; the 2 skipped functions are not assessed |
| COV-004 | **FAIL** | 2 exported async functions (`readWeekDailySummaries`, `readMonthWeeklySummaries`) have no spans committed; both are async, exported, and perform filesystem I/O — RST-001 sync exemption and RST-004 unexported exemption do not apply |
| COV-005 | **PASS** | Each of the 7 spans carries at least one domain attribute: `entry_date`, `file_path`, `entries_count`, `week_label`, `daily_summaries_count`, `month_label`, or `weekly_summaries_count` |
| RST-001 | **PASS** | Sync helpers (`formatDailySummary`, `formatWeeklySummary`, `formatMonthlySummary`, `getWeekBoundaries`, `getMonthBoundaries`) correctly skipped |
| RST-004 | **PASS** | No unexported functions instrumented; all 7 instrumented functions are exported |
| SCH-001 | **PASS** | All 7 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | **PASS** | All attributes registered in `agent-extensions.yaml`; no near-synonym conflicts |
| SCH-003 | **PASS** | Integer counts set as `.length` (integer); date strings via `.toISOString().split('T')[0]` (string); `week_label` and `month_label` passed through from string parameters |
| CDQ-001 | **PASS** | All 7 spans use `finally { span.end() }` inside `startActiveSpan` async callback |
| CDQ-002 | **PASS** | No unnecessary nested child spans |
| CDQ-003 | **PASS** | No PII attributes; `file_path` values are summary output paths |
| CDQ-005 | **PASS** | No empty catch blocks among the 7 committed functions; access-check catches use `catch { }` (empty, intentional graceful-degradation for duplicate detection) |
| CDQ-007 | ADVISORY | Validator flagged `commit_story.journal.file_path` as a raw filesystem path where a basename would be safer. Per established rubric precedent, CDQ-007 advisory path findings are not failures |

**Failures**: COV-004 — `readWeekDailySummaries` and `readMonthWeeklySummaries` have no spans committed (see root cause below)

**Root cause** (from `failure-deep-dives.md`): The validator's `isExpectedConditionCatch` function in `cov003.ts` treats any catch body containing both an ENOENT pattern string and a `ThrowStatement` as requiring error recording. Both skipped functions use `if (err.code !== 'ENOENT') throw err` — semantically a graceful-degradation catch where ENOENT files are silently skipped and non-ENOENT errors rethrow to the outer span's error handler. The validator conservatively flags both patterns equally. In run-24, the agent worked around this by replacing the conditional rethrow with an empty `catch { }`, which passes COV-003 but silently swallows non-ENOENT errors — an NDS-007 deviation the run-24 validator did not catch. The run-25 agent preserved the semantically correct original behavior and was blocked. See `failure-deep-dives.md` for the full analysis and proposed spiny-orb fix.

---

### 11. commands/summarize.js (3 spans, ×2)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — `force` is set directly as a destructured boolean; `parseSummarizeArgs` always returns a boolean literal, so no coercion risk. All other attributes (`dates.length`, `weeks.length`, `months.length`, `result.generated.length`, `result.failed.length`) are integer expressions on guaranteed-present arrays. |
| NDS-004 | PASS — No new exports added; existing exports (`isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize`, `showSummarizeHelp`) are unchanged. |
| NDS-006 | PASS — OTel import is additive; no original imports modified or removed. |
| NDS-007 | PASS — The nested try/catch loops inside `runSummarize`, `runWeeklySummarize`, and `runMonthlySummarize` are structurally identical to the original. The outer try/catch/finally wrapping each span is the only addition. |
| COV-001 | PASS — All three main exported async functions (`runSummarize`, `runWeeklySummarize`, `runMonthlySummarize`) have spans. |
| COV-003 | PASS — All three spans call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` in their outer catch blocks before re-throwing. |
| COV-004 | PASS — All exported async functions are instrumented: `runSummarize` → `commit_story.journal.run_summarize`, `runWeeklySummarize` → `commit_story.journal.run_weekly_summarize`, `runMonthlySummarize` → `commit_story.journal.run_monthly_summarize`. |
| COV-005 | PASS — Each span carries ≥1 domain attribute: `run_summarize` carries `dates_count` + `force` + `daily_summaries_count`; `run_weekly_summarize` carries `force` + `weeks_count` + `weekly_summaries_count`; `run_monthly_summarize` carries `months_count` + `force` + `generated_count` + `failed_count`. |
| RST-001 | PASS — `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, and `showSummarizeHelp` are sync functions; none are spanned. |
| RST-004 | PASS — `isValidDate` (unexported internal helper) correctly has no span. |
| SCH-001 | PASS — All three span names follow the `commit_story.journal.*` namespace and are declared in `agent-extensions.yaml`. |
| SCH-002 | PASS — Attribute names are semantically unambiguous: `dates_count`, `force`, `weeks_count`, `months_count`, `generated_count`, `failed_count`, `daily_summaries_count`, `weekly_summaries_count`. |
| SCH-003 | PASS — All integer counts set as `.length`; `force` set as destructured boolean. |
| CDQ-001 | PASS — All three spans use `startActiveSpan` with a `finally { span.end(); }` block. |
| CDQ-002 | PASS — No attribute is set on a potentially null or undefined value. |
| CDQ-003 | PASS — No sensitive data in attributes. |
| CDQ-005 | PASS — Three spans map to three distinct async operations with no double-counting. |
| CDQ-007 | PASS — No raw filesystem paths in attributes. |

**Failures**: None

Run-25 adds 4 net-new schema extension attributes over run-24 (`weeks_count`, `months_count`, `generated_count`, `failed_count`), bringing this file from 2 to 6 declared attrs across its 3 spans. The second attempt recovered `daily_summaries_count` and `weekly_summaries_count` (previously declared by other files) onto the daily and weekly spans respectively.

---

### 12. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — `filePath` parameter set directly as attribute value; no unsafe inference |
| API-001 | PASS — uses `trace.getTracer('commit-story')` and `SpanStatusCode` from `@opentelemetry/api`; no SDK imports |
| NDS-006 | PASS — all original exports preserved; no signatures altered |
| NDS-004 | PASS — no new exports added; `tracer` is module-internal |
| NDS-007 | PASS — control flow in `ensureDirectory` unchanged |
| COV-001 | PASS — `ensureDirectory` is the sole async entry point and receives a span |
| COV-003 | PASS — catch block calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| COV-004 | PASS — `ensureDirectory` is the only exported async function; all other exports are synchronous path-computation helpers |
| COV-005 | PASS — span carries `commit_story.journal.file_path` set to `filePath` |
| RST-001 | PASS — all 11 synchronous helpers receive no spans |
| RST-004 | PASS — no unexported helper functions; all helpers are exported |
| SCH-001 | PASS — span name `commit_story.journal.ensure_directory` follows the `commit_story.*` namespace |
| SCH-002 | PASS — `commit_story.journal.file_path` unambiguously identifies a filesystem path associated with a journal file |
| SCH-003 | PASS — `commit_story.journal.file_path` is declared as string in the schema; `filePath` is a string parameter |
| CDQ-001 | PASS — `span.end()` is in a `finally` block |
| CDQ-002 | PASS — `filePath` is a required string parameter with no nullable path |
| CDQ-003 | PASS — a filesystem path for a journal file contains no credentials or PII |
| CDQ-005 | PASS — one span for one async function; no redundant wrapping |
| CDQ-007 | ADVISORY — `commit_story.journal.file_path` is set to the full `filePath` value; a basename or repo-relative path would be more portable, but the attribute is semantically correct and not sensitive |

**Failures**: None

The agent correctly identified `ensureDirectory` as the sole async entry point, reusing the already-registered `commit_story.journal.file_path` attribute rather than declaring a schema extension. All 11 synchronous path-computation helpers are correctly left uninstrumented per RST-001.

---

### 13. utils/summary-detector.js (9 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — All attributes are set from direct function parameters or `.length` on arrays guaranteed non-null by prior validation. No unsafe coercions or optional-chain-without-guard patterns. |
| NDS-004 | PASS — No new exports added; no existing export signatures altered. |
| NDS-006 | PASS — OTel import is additive; no original imports modified or removed. |
| NDS-007 | PASS — Two-layer catch pattern preserved. Inner catch (each individual file read) performs graceful degradation and does not record a span error. Outer catch records exception + ERROR status and re-throws. This accurately models the function's intent: a single file parse failure is not fatal for the function. |
| COV-001 | PASS — All 9 async functions (5 exported + 4 unexported) receive spans. |
| COV-003 | PASS — All 9 outer catch blocks call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before re-throwing. |
| COV-004 | PASS — All 5 exported async functions are instrumented; 4 additional unexported async helpers are also spanned (beyond the minimum requirement). |
| COV-005 | PASS — All spans carry ≥1 domain attribute from the commit_story namespace. |
| RST-001 | PASS — Synchronous helpers are correctly uninstrumented. All 9 spanned functions are genuinely async I/O operations. |
| RST-004 | PASS — 4 unexported async helpers are instrumented, which RST-004 permits (it prohibits spanning unexported *sync* helpers only). |
| SCH-001 | PASS — All 9 span names follow the `commit_story.journal.*` namespace and are declared in `agent-extensions.yaml`. |
| SCH-002 | PASS — `week_label`, `month_label`, `entries_count`, `file_path` each map unambiguously to their domain concept. |
| SCH-003 | PASS — All attribute types match schema declarations: `week_label` → string, `month_label` → string, `entries_count` → int, `file_path` → string. |
| CDQ-001 | PASS — All 9 spans use `startActiveSpan` with a `finally { span.end(); }` block. |
| CDQ-002 | PASS — No attribute is set on a potentially null or undefined value. |
| CDQ-003 | PASS — File paths recorded are journal summary paths; no credentials or PII. |
| CDQ-005 | PASS — 9 distinct async operations receive 9 distinct spans; no double-counting. |
| CDQ-007 | PASS — No raw absolute filesystem paths with user home directory fragments. |

**Failures**: None

**Coverage delta observation**: This file declares **0 new schema extension attributes** — all attributes used (`week_label`, `month_label`, `entries_count`, `file_path`) were already registered by earlier files. This is expected and correct — not a COV-005 failure.

The two-layer catch pattern (inner graceful-degradation, outer span error recording) demonstrates sophisticated instrumentation. The agent correctly identified that an inner catch that logs and continues is intentional behavior, preserved it without wrapping it in an additional span-level error recording.

---

### 14. index.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — All attributes are set from direct function parameters or `process.argv.slice(2)` results. No unsafe coercions or inferred values. |
| NDS-004 | PASS — No new exports added; no existing export signatures altered. |
| NDS-006 | PASS — OTel import is additive; no original imports modified or removed. |
| NDS-007 | PASS — The `main().then().catch()` chain structure is preserved. The `process.exit()` call in the `.catch()` handler correctly occurs *after* the `main()` span's `finally { span.end(); }` has run. |
| COV-001 | PASS — `main` has a span: `commit_story.cli.main`. The new `handleSummarize` dispatch function also receives a span: `commit_story.journal.handle_summarize`. |
| COV-003 | PASS — Both span catch blocks call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before the process exits or re-throws. |
| COV-004 | PASS — `main` is the only exported async function; `handleSummarize` is an internal async dispatch helper. Both are instrumented. |
| COV-005 | PASS — `commit_story.cli.main` carries `commit_story.cli.subcommand`; `commit_story.journal.handle_summarize` carries `dates_count`, `force`, and `weeks_count`. |
| RST-001 | PASS — No synchronous helpers are spanned. `process.argv` parsing is sync and correctly uninstrumented. |
| RST-004 | PASS — No unexported sync helper functions. `handleSummarize` is an unexported async helper correctly instrumented (async I/O dispatch). |
| SCH-001 | PASS — Both span names follow the `commit_story.*` namespace and are declared in `agent-extensions.yaml`. |
| SCH-002 | PASS — `commit_story.cli.subcommand` unambiguously identifies which CLI subcommand was invoked. `dates_count`, `force`, `weeks_count` are reused from established schema vocabulary. |
| SCH-003 | PASS — `commit_story.cli.subcommand` → string; `dates_count` → int (set as `.length`); `force` → boolean; `weeks_count` → int (set as `.length`). All match schema declarations. |
| CDQ-001 | PASS — **RUN24-1 fix confirmed.** Both spans use `startActiveSpan` with `finally { span.end(); }`. For `commit_story.cli.main`: the `process.exit()` call is in the `.then()/.catch()` chain *after* the `startActiveSpan` callback returns its resolved promise, so `finally { span.end(); }` executes before the process exits. |
| CDQ-002 | PASS — No attribute set on a nullable or undefined value. |
| CDQ-003 | PASS — `subcommand` is a CLI argument name (e.g., `"journal"`, `"summarize"`) — not sensitive. |
| CDQ-005 | PASS — Two spans cover two distinct async entry points with no double-counting. |
| CDQ-007 | ADVISORY — `savedPath` appears in a debug comment within the span body but is NOT set as a span attribute. Advisory observation only. |

**Failures**: None

**RUN24-1 CDQ-001 fix verified**: The critical process.exit CDQ-001 regression identified in run-24 is confirmed fixed. The `fixProcessExitSpanEnd()` AST auto-fix (spiny-orb commit 91e9413) restructured the `main()` invocation from `main().catch(process.exit)` to a `.then().catch()` chain where `process.exit()` is called in a microtask *after* the span closes. The span lifecycle is now guaranteed correct. Run-25 is the first run with this fix applied to index.js.

---

## Correct Skips

### 15. Correct Skips (17 files)

spiny-orb identified 17 files as correct skips. One of these (`src/integrators/context-integrator.js`) is a bookkeeping artifact in `run-summary.md` — it was actually committed with full instrumentation and is evaluated in section 4. The remaining 16 genuine skips fall into two categories: (1) synchronous-only files where RST-001 prohibits spanning, and (2) files where all meaningful async operations are already covered by spans in calling code, making additional instrumentation a RST-004 duplicate-span violation.

| File | Skip Reason | RST-002 Valid? |
|------|-------------|----------------|
| `src/utils/config.js` | Synchronous getters only | PASS |
| `src/utils/date-utils.js` | Pure date/string utilities, all synchronous | PASS |
| `src/utils/error-handling.js` | Synchronous error class definitions and type guards | PASS |
| `src/utils/path-utils.js` | Path manipulation helpers, all synchronous | PASS |
| `src/utils/validation.js` | Input validation utilities, all synchronous | PASS |
| `src/collectors/context-collector.js` | Orchestrates other collectors; spanned via callers | PASS |
| `src/collectors/reflection-collector.js` | Synchronous data aggregation from pre-collected context | PASS |
| `src/integrators/context-integrator.js` | Listed in run-summary.md correct-skips but actually committed and instrumented — see section 4. Likely a run-summary.md bookkeeping artifact. | N/A — committed file |
| `src/mcp/mcp-tool-executor.js` | Thin wrapper around MCP server calls; callers are spanned | PASS |
| `src/commands/journal.js` | All async operations already spanned via journal-manager.js | PASS |
| `src/generators/context-processor.js` | Pure synchronous transformation of context data | PASS |
| `src/generators/prompt-builder.js` | Synchronous prompt template construction | PASS |
| `src/generators/story-formatter.js` | Synchronous markdown formatting | PASS |
| `src/generators/token-estimator.js` | Synchronous token counting utilities | PASS |
| `src/generators/conversation-threads.js` | Synchronous data structure for thread management | PASS |
| `src/utils/logger.js` | Logging utility; no domain I/O worthy of spans | PASS |
| `src/utils/file-utils.js` | Low-level file utilities; operations spanned by callers | PASS |

All 16 genuine skips are correctly categorized. The synchronous utility cluster correctly avoids RST-001 violations — these files perform no I/O, no async work, and no operations that carry meaningful duration or failure semantics. The caller-coverage cluster correctly avoids RST-004 duplicate-span violations — in each case, the entry point a user or call graph would recognize as the unit of work is already spanned at a higher level. The `context-integrator.js` entry in the correct-skips list is a run-summary.md artifact and does not reflect an agent error.

---

## Run-25 Summary

| Committed File | Span Count | Attempts | Result |
|---|---|---|---|
| managers/auto-summarize.js | 3 | 1 | All PASS |
| collectors/claude-collector.js | 1 | 1 | All PASS |
| mcp/tools/context-capture-tool.js | 1 | 1 | All PASS |
| integrators/context-integrator.js | 1 | 1 | All PASS |
| collectors/git-collector.js | 6 | 2 | All PASS |
| generators/journal-graph.js | 4 | 2 | All PASS |
| managers/journal-manager.js | 2 | 1 | All PASS |
| mcp/server.js | 1 | 1 | All PASS |
| generators/summary-graph.js | 6 | 1 | All PASS |
| managers/summary-manager.js | 7 | 2 | COV-004 FAIL (partial) |
| commands/summarize.js | 3 | 2 | All PASS |
| utils/journal-paths.js | 1 | 1 | All PASS |
| utils/summary-detector.js | 9 | 1 | All PASS |
| index.js | 2 | 1 | All PASS (RUN24-1 fix confirmed) |

**Total spans**: 47 across 13 committed files (including 7 committed spans in the partial file)
**Correct skips**: 16 genuine + 1 bookkeeping artifact
**Files with failures**: 1 (summary-manager.js, COV-004)
**Open findings carried forward**: COV-003 validator false-positive on conditional-rethrow ENOENT catch pattern (tracked as spiny-orb issue candidate in failure-deep-dives.md)
