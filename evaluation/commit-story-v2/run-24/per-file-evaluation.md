# Run-24 Per-File Evaluation — commit-story-v2

**Instrument branch**: `spiny-orb/instrument-1781811083418`
**service.instance.id**: `8d68fb9e-2c0a-45b9-9016-3958aa25c4c4`
**Captured run**: 2026-06-18T20:25:31Z — organic post-commit journal generation (`commit-story journal`, `--check-summaries`)
**Methodology**: D-2 (parallel per-file agents, one per committed file)
**Evaluation date**: 2026-06-18

---

## Scope

- **31 files** evaluated total: 14 committed (instrumented) + 17 correct skips
- **Rubric dimensions applied**: NDS, API, COV, RST, SCH, CDQ (19 rules; COV-002 applies only to external-process callers, COV-006 only to LangGraph files)

---

## Failure Summary

| File | Rule | Category | Description | History |
|------|------|----------|-------------|---------|
| `collectors/git-collector.js` | SCH-003 | Type mismatch | `commit_story.git.diff_lines` declared `type: string` in schema, set as integer at runtime (`lines.length`). Datadog confirms `diff_lines: 296` (integer). | 2nd consecutive run. Run-23: `diff_size: type: string`, run-24: `diff_lines: type: string` — rename without type fix. |
| `mcp/tools/context-capture-tool.js` | COV-005 | Missing attribute | `saveContext` span carries only output attributes (`entry_date`, `file_path`). `commit_story.context.source: 'mcp'` — present on run-23's outer callback span — is absent. | Regression from run-23. |
| `index.js` | CDQ-001 | Span lifecycle | `process.exit()` calls in `main()` bypass `finally { span.end() }`. No explicit `span.end()` before individual exits. Run-12 fixed this; run-23 preserved the fix; run-24 regresses. | Regression from run-23's run-12 fix. |
| `index.js` | COV-005 | Missing attribute | `commit_story.journal.file_path` (generated entry path, captured as a result attribute in run-23) absent in run-24. Span carries `vcs.ref.head.revision` and `commit_story.git.subcommand` but not the primary output of a successful journal run. | Regression from run-23. |

**Result: 4 failures, 3 files, 14 committed files evaluated.**

---

## Run Gate

| Gate | Result | Evidence |
|------|--------|----------|
| Instrument branch pushed to fork | PASS | `spiny-orb/instrument-1781811083418` confirmed on `wiggitywhitney/commit-story-v2` |
| PR opened on fork | PASS | PR created from `spiny-orb-pr-summary.md`; full artifact captured |
| Bootstraps cleanly — no import errors or uncaught exceptions | PASS | 31 spans appear in Datadog; no span with error status on bootstrap path |
| At least one span in Datadog for this service instance | PASS | 31 spans confirmed under `service:commit-story @service.instance.id:8d68fb9e-2c0a-45b9-9016-3958aa25c4c4` |
| No instrumentation-introduced test failures | PASS | Test suite runs clean on instrument branch |

**All run gates pass.** Failures are rubric-level findings, not deployment failures.

---

## Fixes Confirmed from Prior Runs

| Finding ID | Description | Status |
|-----------|-------------|--------|
| RUN23-2 | `summarize.js` SCH-003: `dates_count` declared `type: string`, set as integer; `force` declared `type: string`, set as boolean | **CONFIRMED FIXED** — `type: int` and `type: boolean` correct in run-24 schema |
| RUN23-3 | `summary-detector.js` SCH-002: `base_path` near-synonym for `commit_story.journal.file_path` | **CONFIRMED FIXED** — `base_path` absent; replaced by three semantically precise `unsummarized_*_count` attributes |
| RUN-12 COV-004 | `summary-manager.js`: only 3 of 9 exported async functions had spans | **CONFIRMED SUSTAINED** — 9 spans present for 4th consecutive run |

---

## Per-File Sections

### collectors/claude-collector.js (1 span, 1 attempt)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No truthy-check guards around `setAttribute`; `sessions_count` and `messages_count` set unconditionally on both early-return and happy paths |
| API-001 | PASS | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | PASS | Catch block calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | PASS | Graceful-degradation catch inside `parseJSONLFile`'s JSON parsing loop correctly left unmodified — no rethrow, no `recordException` required per NDS-007 (Expected Catch Unmodified) |
| COV-001 | PASS | `collectChatMessages` is the only exported async function; span `commit_story.context.collect_messages` wraps the entire body |
| COV-003 | PASS | Catch has `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrow |
| COV-004 | PASS | `collectChatMessages` is the only exported async function; all others (`getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `parseJSONLFile`, `filterMessages`, `groupBySession`) are pure synchronous |
| COV-005 | PASS | Five attributes set: `commit_story.context.source`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.sessions_count`, `commit_story.context.messages_count` |
| RST-001 | PASS | All seven sync helpers correctly skipped |
| RST-004 | PASS | Only the single exported async function is instrumented |
| SCH-001 | PASS | Span name `commit_story.context.collect_messages` registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS | All 5 attribute keys pre-registered in `semconv/attributes.yaml` under `registry.commit_story.context` group |
| SCH-003 | PASS | `sessions_count` and `messages_count` set as integers; `source` set as string; `time_window_*` set as ISO strings |
| CDQ-001 | PASS | `finally { span.end() }` inside async `startActiveSpan` callback |
| CDQ-002 | PASS | No nested child spans |
| CDQ-003 | PASS | Input attributes set unconditionally before early-return guard; output attributes set on both paths |
| CDQ-005 | PASS | No empty catch blocks |
| CDQ-007 | PASS | Early-return path sets counts to `0` explicitly; happy path sets from `.size`/`.length` after computation |

**Failures**: None

**Trace supplement**: All 5 attributes confirmed in Datadog: `source: claude_code`, `time_window_start/end` present, `sessions_count: 0`, `messages_count: 0` (early-return path — no `.claude/projects/` match). CDQ-007 guard confirmed at runtime.

---

### collectors/git-collector.js (6 spans, 3 attempts)

> Run-23 renamed `diff_size` → `diff_lines` but did not fix the `type: string` declaration. SCH-003 second consecutive run.

**Spans**: `commit_story.git.run`, `commit_story.git.commit_metadata`, `commit_story.git.commit_diff`, `commit_story.git.merge_info`, `commit_story.git.get_previous_commit_time`, `commit_story.git.get_commit_data`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No `isRecording()` guards |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | All 6 catch blocks record and rethrow |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | PASS | `runGit` catch preserves original `if (error.code === 128)` branches; `recordException`/`setStatus` added before existing conditionals |
| COV-001 | PASS | `getCommitData` and `getPreviousCommitTime` (exported) have entry-point spans |
| COV-002 | PASS | `runGit` span wraps `execFileAsync('git', ...)` |
| COV-003 | PASS | All 6 outer catches record and rethrow |
| COV-004 | PASS | All 6 async functions instrumented (2 exported + 4 unexported async I/O) |
| COV-005 | PASS | Each span carries meaningful input/process attributes |
| RST-001 | PASS | No sync-only helpers in this file |
| RST-004 | PASS | 4 unexported async I/O functions instrumented per COV-004 precedent |
| SCH-001 | PASS | All 6 span names registered |
| SCH-002 | PASS | 3 new attributes declared; no near-synonyms |
| SCH-003 | **FAIL** | `commit_story.git.diff_lines` declared `type: string`; set as `lines.length` (integer). Datadog confirms `diff_lines: 296` (integer). Fix: change `type: string` → `type: int` in `agent-extensions.yaml`. |
| CDQ-001 | PASS | `finally { span.end() }` on all 6 spans |
| CDQ-002 | PASS | No unnecessary nesting |
| CDQ-003 | PASS | No PII |
| CDQ-005 | PASS | No empty catches |
| CDQ-006 | PASS | `diff_lines` from already-computed array `.length` |
| CDQ-007 | PASS | All attribute sources are non-nullable at call sites |

**Trace supplement**: All 6 spans confirmed in Datadog. `diff_lines: 296` (integer) confirms type mismatch.

---

### integrators/context-integrator.js (1 span, 1 attempt)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No guards; 6 attributes set unconditionally |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | Catch records and rethrows |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | N/A | No graceful-degradation catches in source |
| COV-001 | PASS | `gatherContextForCommit` span covers entire body |
| COV-003 | PASS | Catch records and rethrows |
| COV-004 | PASS | Only exported async function instrumented; 2 sync helpers skipped |
| COV-005 | PASS | 6 attributes: `vcs.ref.head.revision` pre-await; 5 others post-await (correct — values unavailable until resolved) |
| RST-001 | PASS | `formatContextForPrompt`, `getContextSummary` (sync) correctly skipped |
| RST-004 | PASS | Only the single exported async function instrumented |
| SCH-001 | PASS | Span name registered |
| SCH-002 | PASS | All 6 attributes pre-registered |
| SCH-003 | PASS | String SHA, string message, integer counts — all match declarations |
| CDQ-001 | PASS | `finally { span.end() }` |
| CDQ-002 | PASS | No nested spans |
| CDQ-003 | PASS | `commit.message` from external git — CDQ-006 exemption applies (COV-001 entry point) |
| CDQ-005 | PASS | No empty catches |
| CDQ-007 | PASS | `vcs.ref.head.revision` pre-branching; counts from `.length` on resolved arrays |

**Failures**: None

**Trace supplement**: All 6 attributes confirmed in Datadog. Zero counts valid — docs-only commit, no chat messages in time window.

---

### generators/journal-graph.js (4 spans, 1 attempt)

> Seventh consecutive clean commit.

**Spans**: `commit_story.journal.generate_summary`, `commit_story.journal.generate_technical`, `commit_story.journal.generate_dialogue`, `commit_story.journal.generate_sections`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No guards; all attributes unconditional |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | `generateJournalSections` catch records and rethrows |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | PASS | Three graceful-degradation catches in node functions return fallback state objects; `recordException` correctly absent per NDS-007 |
| COV-001 | PASS | `generateJournalSections` entry-point span covers entire body |
| COV-003 | PASS | Outer catch records and rethrows |
| COV-004 | PASS | All 4 async functions instrumented; sync helpers correctly skipped |
| COV-005 | PASS | `generate_sections` sets `gen_ai.request.model` and `commit_story.journal.sections`; node spans set `gen_ai.usage.*` and `gen_ai.response.id` when available |
| COV-006 | PASS | Manual spans wrap LangChain auto-instrumented `model.invoke()` calls; context propagation preserved |
| RST-001 | PASS | All sync helpers skipped |
| RST-004 | PASS | `getGraph` (unexported) covered by `generate_sections` span |
| SCH-001 | PASS | All 4 span names registered |
| SCH-002 | PASS | Zero new custom attributes; all `gen_ai.*` are pre-registered OTel semconv |
| SCH-003 | PASS | Model name as string; token counts as integers (guarded) |
| CDQ-001 | PASS | `finally { span.end() }` on all 4 spans |
| CDQ-002 | PASS | No unnecessary nesting |
| CDQ-003 | PASS | No PII |
| CDQ-005 | PASS | No empty catches; node catches return fallback state |
| CDQ-006 | PASS | `sections.filter(Boolean)` — CDQ-006 exemption applies (COV-001 entry point) |
| CDQ-007 | PASS | `gen_ai.usage.*` guarded with `!= null`; model name is string constant |

**Failures**: None

**Trace supplement**: All 4 spans in Datadog. `generate_technical` (40ms) and `generate_dialogue` (51ms) show early-exit evidence — no `gen_ai.usage.*` attributes. `generate_summary` successfully invoked: `input_tokens: 12745`, `output_tokens: 161`.

---

### generators/summary-graph.js (6 spans, 1 attempt)

> Down from 2 attempts in run-23.

**Spans**: `commit_story.journal.daily_summary_node`, `commit_story.journal.generate_daily_summary`, `commit_story.journal.weekly_summary_node`, `commit_story.journal.generate_weekly_summary`, `commit_story.journal.monthly_summary_node`, `commit_story.journal.generate_monthly_summary`

**New attributes**: `commit_story.journal.entries_count` (int), `commit_story.journal.week_label` (string), `commit_story.journal.month_label` (string), `commit_story.journal.summaries_count` (int)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | All attributes unconditional |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | All 6 outer catches record and rethrow |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | PASS | 3 inner graceful-degradation catches return fallback state objects; correctly left unmodified |
| COV-001 | PASS | 3 exported async entry points each have spans |
| COV-003 | PASS | All 6 outer catches record and rethrow |
| COV-004 | PASS | All 6 async functions instrumented; sync helpers skipped |
| COV-005 | PASS | Input attributes set before early-return guards on all 6 spans |
| COV-006 | PASS | Manual spans wrap `graph.invoke()`/`model.invoke()` LangChain calls |
| RST-001 | PASS | Sync helpers skipped |
| RST-004 | PASS | Unexported functions correctly excluded |
| SCH-001 | PASS | All 6 span names registered |
| SCH-002 | PASS | 4 new attributes registered; `entry_date` reused without duplication |
| SCH-003 | PASS | Integer counts from `.length`; strings from state fields with `?? ''` guard |
| CDQ-001 | PASS | `finally { span.end() }` on all 6 spans |
| CDQ-002 | PASS | No unnecessary nesting |
| CDQ-003 | PASS | No PII |
| CDQ-005 | PASS | No empty catches |
| CDQ-007 | PASS | Counts guarded with `!= null`; labels use `?? ''` null-coalescing |

**Failures**: None

**Trace supplement**: No spans in captured run — summarize pipeline not invoked in organic post-commit run. Static analysis only.

---

### mcp/tools/context-capture-tool.js (1 span, 1 attempt)

> Run-23 had 2 spans (inner `saveContext` + outer anonymous MCP callback). Run-24 omits the outer callback span, losing `commit_story.context.source: 'mcp'`.

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | Tool handler logic untouched; span wraps `saveContext` |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | `saveContext` catch records and rethrows |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | PASS | Anonymous MCP handler catch returns MCP error response — graceful-degradation path correctly unmodified |
| COV-001 | PASS | `registerContextCaptureTool` is the only export and is synchronous — RST-001 applies |
| COV-003 | PASS | `saveContext` catch records and rethrows |
| COV-004 | PASS | `saveContext` is the async I/O entry point; no enclosing orchestrator span; instrumented per COV-004 |
| COV-005 | **FAIL** | Span carries `entry_date` and `file_path` (output attributes only). `commit_story.context.source: 'mcp'` — present in run-23 — absent. Fix: add `span.setAttribute('commit_story.context.source', 'mcp')` inside `saveContext`, or reinstate the outer callback span. |
| RST-001 | PASS | `getContextPath`, `formatTimestamp`, `formatContextEntry` (sync) skipped |
| RST-004 | PASS | `saveContext` instrumented because no enclosing orchestrator span covers its I/O |
| SCH-001 | PASS | `commit_story.context.save_context` registered |
| SCH-002 | PASS | `entry_date` and `file_path` pre-registered; no new declarations |
| SCH-003 | PASS | `entry_date` set as ISO date string; `file_path` set as string — both match schema |
| CDQ-001 | PASS | `finally { span.end() }` |
| CDQ-002 | PASS | No unnecessary nesting |
| CDQ-003 | PASS | `entry_date` set before I/O; `file_path` set after successful write |
| CDQ-005 | PASS | Anonymous callback catch returns MCP error (NDS-007); `saveContext` catch rethrows |
| CDQ-007 | PASS | `entry_date` from `new Date()` (always valid); `file_path` from `getContextPath(now)` (always a string) |

**Trace supplement**: No spans in captured run — MCP tool not exercised in CLI dry-run. Static analysis only.

---

### mcp/server.js (1 span, 1 attempt)

> Second consecutive clean commit.

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | `transport_type` set unconditionally |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | Catch records and rethrows |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | N/A | No graceful-degradation catches |
| COV-001 | PASS | `main()` entry-point span |
| COV-003 | PASS | Catch records and rethrows |
| COV-004 | PASS | `main()` only exported async function; `createServer` (sync) skipped |
| COV-005 | PASS | `commit_story.mcp.transport_type: 'stdio'` set unconditionally |
| RST-001 | PASS | `createServer` (sync) skipped |
| RST-004 | PASS | `createServer` covered by `main()` span |
| SCH-001 | PASS | `commit_story.mcp.main` registered |
| SCH-002 | PASS | `commit_story.mcp.transport_type` registered; no near-synonyms |
| SCH-003 | PASS | `transport_type` declared `type: string`; set as string literal `'stdio'` |
| CDQ-001 | PASS | `finally { span.end() }` |
| CDQ-002 | PASS | No unnecessary nesting |
| CDQ-003 | PASS | No PII |
| CDQ-005 | PASS | No empty catches |
| CDQ-007 | PASS | Hard-coded string constant — no nullable risk |

**Failures**: None

**RST-006 note**: `process.exit(1)` is in module-level `.catch()` outside `main()`'s body — not inside the span boundary. RST-006 does not apply.

**Trace supplement**: No spans in captured run — MCP server not exercised by CLI dry-run.

---

### utils/journal-paths.js (1 span, 1 attempt)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | `file_path` set unconditionally |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | Catch records and rethrows |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | N/A | No graceful-degradation catches |
| COV-001 | PASS | `ensureDirectory` entry-point span |
| COV-003 | PASS | Catch records and rethrows |
| COV-004 | PASS | `ensureDirectory` is the only exported async function; 11 sync exports skipped per RST-001 |
| COV-005 | PASS | `commit_story.journal.file_path` set at span open from `filePath` parameter |
| RST-001 | PASS | All 11 sync exports skipped |
| RST-004 | PASS | Only exported async function instrumented |
| SCH-001 | PASS | `commit_story.journal.ensure_directory` registered |
| SCH-002 | PASS | `file_path` pre-registered; no new declarations |
| SCH-003 | PASS | `file_path` set from string parameter; declared `type: string` |
| CDQ-001 | PASS | `finally { span.end() }` |
| CDQ-002 | PASS | No unnecessary nesting |
| CDQ-003 | PASS | No PII |
| CDQ-005 | PASS | No empty catches |
| CDQ-007 | PASS | `filePath` is a required non-optional parameter |

**Failures**: None

**Trace supplement**: Span confirmed in Datadog. `file_path: "journal/entries/2026-06/2026-06-18.md"` — project-relative path format confirmed correct.

---

### managers/journal-manager.js (2 spans, 1 attempt)

**Spans**: `commit_story.journal.save_entry`, `commit_story.journal.discover_reflections`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | All attributes unconditional |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | Both outer catches record and rethrow |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | PASS | 3 inner empty catches: (1) file-not-found check, (2) missing directory, (3) unreadable file — all graceful-degradation paths correctly unmodified |
| COV-001 | PASS | Both exported async functions have spans |
| COV-003 | PASS | Both outer catches record and rethrow |
| COV-004 | PASS | Both exported async functions instrumented; sync helpers skipped |
| COV-005 | PASS | `save_entry`: `commit.timestamp`, `file_path`, `quotes_count`; `discover_reflections`: `time_window_start`, `time_window_end` |
| RST-001 | PASS | `formatTimestamp`, `formatJournalEntry` (exported sync) and all unexported sync helpers skipped |
| RST-004 | PASS | Unexported sync helpers covered by orchestrator spans |
| SCH-001 | PASS | Both span names registered |
| SCH-002 | PASS | All 5 attributes pre-registered |
| SCH-003 | PASS | Timestamps as ISO strings; `quotes_count` from `.length` (integer) |
| CDQ-001 | PASS | `finally { span.end() }` on both spans |
| CDQ-002 | PASS | No unnecessary nesting |
| CDQ-003 | PASS | No PII |
| CDQ-005 | PASS | 3 inner empty catches are NDS-007 graceful-degradation paths |
| CDQ-007 | PASS | Run-12 CDQ-007 vectors (`commit.hash`, `commit.author` nullable) absent from run-24 |

**Failures**: None

**Trace supplement**: Both spans confirmed in Datadog. `save_entry`: `file_path` project-relative, `quotes_count: 0` (docs-only commit). `discover_reflections`: time window set; reflections count 0.

---

### managers/summary-manager.js (9 spans, 1 attempt)

> COV-004 fix from run-12 confirmed sustained — 9 spans for 4th consecutive run.

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | All attributes unconditional |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | All 9 outer catches record and rethrow |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | PASS | Inner ENOENT catches in 3 read functions return empty arrays |
| COV-001 | PASS | All 9 exported async functions have spans |
| COV-003 | PASS | All 9 outer catches record and rethrow |
| COV-004 | PASS | All 9 exported async functions: `readDayEntries`, `saveDailySummary`, `generateAndSaveDailySummary`, `readWeekDailySummaries`, `saveWeeklySummary`, `generateAndSaveWeeklySummary`, `readMonthWeeklySummaries`, `saveMonthlySummary`, `generateAndSaveMonthlySummary` |
| COV-005 | PASS | All 9 spans carry period labels, file paths, or count attributes |
| RST-001 | PASS | Sync helpers skipped |
| RST-004 | PASS | Only exported async functions instrumented |
| SCH-001 | PASS | All 9 span names registered |
| SCH-002 | PASS | All attributes pre-registered |
| SCH-003 | PASS | Integer counts from `.length`; strings from computed date/path values |
| CDQ-001 | PASS | `finally { span.end() }` on all 9 spans |
| CDQ-002 | PASS | No unnecessary nesting |
| CDQ-003 | PASS | No PII |
| CDQ-005 | PASS | ENOENT catches return empty arrays (NDS-007 graceful degradation) |
| CDQ-007 | PASS | Array lengths guarded against null; paths from computed functions that always return strings |

**Failures**: None

**Trace supplement**: No spans in captured run — summarize pipeline not exercised. Static analysis only.

---

### commands/summarize.js (3 spans, 1 attempt)

> RUN23-2 fix confirmed — both `dates_count` (type: int) and `force` (type: boolean) now match schema declarations.

**Spans**: `commit_story.summarize.run_daily_summaries`, `commit_story.summarize.run_weekly_summaries`, `commit_story.summarize.run_monthly_summaries`

**New attributes**: `commit_story.summarize.dates_count` (int), `commit_story.summarize.force` (boolean)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | Attributes set unconditionally within span callbacks |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | All 3 catches record and rethrow |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | N/A | No graceful-degradation catches |
| COV-001 | PASS | All 3 exported async entry points have spans |
| COV-003 | PASS | All 3 catches record and rethrow |
| COV-004 | PASS | All 3 exported async functions instrumented |
| COV-005 | PASS | `dates_count` and `force` set on all 3 spans — input parameters capturing the summarize operation scope |
| RST-001 | PASS | `runSummarize` (synchronous Yargs setup) skipped |
| RST-004 | PASS | Only exported async handlers instrumented |
| SCH-001 | PASS | All 3 span names registered |
| SCH-002 | PASS | Both new attributes registered; no near-synonyms |
| SCH-003 | PASS | `dates_count` declared `type: int`, set as `x != null ? x.length : 0` (integer); `force` declared `type: boolean`, set from boolean CLI flag |
| CDQ-001 | PASS | `finally { span.end() }` on all 3 spans |
| CDQ-002 | PASS | No unnecessary nesting |
| CDQ-003 | PASS | No PII |
| CDQ-005 | PASS | No empty catches |
| CDQ-007 | PASS | `dates_count` null-guarded; `force` is boolean with default — always defined |

**Failures**: None

**Trace supplement**: No spans in captured run — manual summarize not invoked. Static analysis only.

---

### utils/summary-detector.js (9 spans, 1 attempt)

> RUN23-3 fix confirmed — `base_path` eliminated; replaced by 3 semantically precise count attributes. All 9 spans confirmed in Datadog with integer values.

**Spans**: 5 exported (`detect_missing_daily`, `detect_missing_weekly`, `detect_missing_monthly`, `check_summaries`, `get_summary_status`) + 4 unexported async I/O helpers (`read_existing_daily`, `read_existing_weekly`, `read_existing_monthly`, `count_journal_entries`)

**New attributes**: `commit_story.summaries.unsummarized_days_count` (int), `commit_story.summaries.unsummarized_weeks_count` (int), `commit_story.summaries.unsummarized_months_count` (int)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | All attributes unconditional |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | All 9 outer catches record and rethrow |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | PASS | ENOENT catches in 4 helper functions return empty arrays/0 |
| COV-001 | PASS | All 5 exported async functions have spans; `isSummaryFileExists` (sync) skipped |
| COV-003 | PASS | All 9 outer catches record and rethrow |
| COV-004 | PASS | 5 exported + 4 unexported async I/O helpers instrumented (I/O not covered by any enclosing orchestrator) |
| COV-005 | PASS | `check_summaries` and `get_summary_status` set all 3 `unsummarized_*_count` attributes; `detect_missing_*` spans set the relevant period count |
| RST-001 | PASS | `isSummaryFileExists` (sync) skipped |
| RST-004 | PASS | 4 unexported async I/O helpers instrumented — no enclosing orchestrator covers their async work |
| SCH-001 | PASS | All 9 span names registered |
| SCH-002 | PASS | 3 new attributes registered; no near-synonyms for `file_path` or other existing attributes; `base_path` absent |
| SCH-003 | PASS | All 3 count attributes declared `type: int`; set from integer computations |
| CDQ-001 | PASS | `finally { span.end() }` on all 9 spans |
| CDQ-002 | PASS | No unnecessary nesting |
| CDQ-003 | PASS | No PII |
| CDQ-005 | PASS | ENOENT catches return empty arrays (NDS-007 graceful degradation) |
| CDQ-007 | PASS | Count attributes set from `.length` on arrays initialized by ENOENT-safe catch paths |

**Failures**: None

**Trace supplement**: All 9 spans confirmed in Datadog: `unsummarized_days_count: 0`, `unsummarized_weeks_count: 0`, `unsummarized_months_count: 0`. Integer types confirmed at runtime.

---

### commands/auto-summarize.js (3 spans, 1 attempt)

**Spans**: `commit_story.summaries.trigger_auto_summaries`, `commit_story.summaries.trigger_auto_weekly_summaries`, `commit_story.summaries.trigger_auto_monthly_summaries`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | Count attributes set unconditionally after detection step |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | All 3 catches record and rethrow |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | N/A | No graceful-degradation catches |
| COV-001 | PASS | All 3 exported async entry points have spans |
| COV-003 | PASS | All 3 catches record and rethrow |
| COV-004 | PASS | All 3 exported async functions instrumented; `runAutoSummarize` (sync) skipped |
| COV-005 | PASS | `summaries_count` set on all exit paths including early-return (zero-count) |
| RST-001 | PASS | `runAutoSummarize` (sync) skipped |
| RST-004 | PASS | Only exported async functions instrumented |
| SCH-001 | PASS | All 3 span names registered; `run_*` prefix avoided to prevent collision with `summarize.js` |
| SCH-002 | PASS | `summaries_count` reused from `summary-graph.js` registration |
| SCH-003 | PASS | `summaries_count` declared `type: int`; set from integer count of generated summaries |
| CDQ-001 | PASS | `finally { span.end() }` on all 3 spans |
| CDQ-002 | PASS | No unnecessary nesting |
| CDQ-003 | PASS | No PII |
| CDQ-005 | PASS | No empty catches |
| CDQ-007 | PASS | `summaries_count` initialized to `0` and incremented; always an integer |

**Failures**: None

**Trace supplement**: All 3 spans confirmed in Datadog: `summaries_count: 0` on all 3 spans — early-return path confirms COV-005 attribute set even when no summaries needed.

---

### index.js (1 span, 1 attempt)

> **Two regressions from run-23**: CDQ-001 (process.exit bypasses span.end — run-12 fix re-broken) and COV-005 (file_path dropped).

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | Attributes set unconditionally where present |
| API-001 | PASS | `@opentelemetry/api` only |
| NDS-006 | PASS | Main catch records and sets ERROR status |
| NDS-004 | PASS | Both imported and used |
| NDS-007 | N/A | No graceful-degradation catches |
| COV-001 | PASS | `main()` entry-point span |
| COV-003 | PASS | Catch records and sets ERROR status |
| COV-004 | PASS | `main()` only exported async function |
| COV-005 | **FAIL** | Span sets `vcs.ref.head.revision` and `commit_story.git.subcommand`. `commit_story.journal.file_path` (generated entry path, captured in run-23) absent. Fix: retrieve return value from `runJournalGeneration()` and set `file_path` on success path. |
| RST-001 | PASS | No sync helpers have spans |
| RST-004 | PASS | Only exported async `main()` instrumented |
| SCH-001 | PASS | `commit_story.cli.main` registered |
| SCH-002 | PASS | `commit_story.git.subcommand` registered |
| SCH-003 | PASS | SHA as string; subcommand as string — types match |
| CDQ-001 | **FAIL** | `process.exit(1)` calls inside `main()` body bypass `finally { span.end() }`. No explicit `span.end()` before each exit. Run-12 added `span.end()` before each `process.exit()`; that fix was maintained in run-23; run-24 regresses. Early-exit paths (no commit hash, unsupported subcommand) leave spans unended. Success path unaffected (CDQ-001 not observable in captured trace — confirmed by Datadog showing successful span completion). |
| CDQ-002 | PASS | No unnecessary nesting |
| CDQ-003 | PASS | No PII |
| CDQ-005 | PASS | No empty catches |
| CDQ-007 | PASS | `vcs.ref.head.revision` from git data; `subcommand` from CLI arg with conditional check |

**Trace supplement**: `commit_story.cli.main` confirmed in Datadog. `vcs.ref.head.revision` and `commit_story.git.subcommand: 'journal'` present. `file_path` absent — COV-005 confirmed. CDQ-001 not observable on success path — failure is on early-exit paths not captured in this run.

---

### Correct Skips (17 files, RST-001 compliant)

All 17 files correctly skipped. Zero incorrect skips. Zero missed skips.

| File | Rule | Rationale |
|------|------|-----------|
| `src/logger.js` *(new in run-24)* | RST-001 | Single `export default pino(...)` expression — no function declarations |
| `src/traceloop-init.js` | RST-001 | Module-level synchronous SDK init; no exported functions |
| `src/utils/config.js` | RST-001 | All exports are synchronous utility functions |
| `src/utils/commit-analyzer.js` | RST-001 | All exports are pure synchronous analysis functions |
| `src/mcp/tools/reflection-tool.js` | RST-004 | `registerReflectionTool` (exported, synchronous) skipped; `saveReflection` (unexported async) skipped — evaluated as analogous to anonymous MCP callback |
| `src/prompts/journal-prompt.js` | RST-001 | Exports a string constant |
| `src/prompts/technical-prompt.js` | RST-001 | Exports a string constant |
| `src/prompts/dialogue-prompt.js` | RST-001 | Exports a string constant |
| `src/prompts/quip-prompt.js` | RST-001 | Exports a string constant |
| `src/prompts/daily-summary-prompt.js` | RST-001 | Exports a string constant |
| `src/prompts/weekly-summary-prompt.js` | RST-001 | Exports a string constant |
| `src/prompts/monthly-summary-prompt.js` | RST-001 | Exports a string constant |
| `src/guidelines/journal-guidelines.js` | RST-001 | Exports a string constant |
| `src/guidelines/technical-guidelines.js` | RST-001 | Exports a string constant |
| `src/guidelines/dialogue-guidelines.js` | RST-001 | Exports a string constant |
| `src/guidelines/quip-guidelines.js` | RST-001 | Exports a string constant |
| `src/utils/git-utils.js` | RST-001 | All exports are synchronous utility functions |
