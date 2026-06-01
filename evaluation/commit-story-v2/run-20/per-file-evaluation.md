# Per-File Evaluation — Run-20

**Date**: 2026-06-01
**Branch**: spiny-orb/instrument-1780313045724
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 30 (12 committed + 1 failed + 17 correct skips)
**Methodology**: D-2 — one agent per committed/failed file, one batch agent for correct skips

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check` exits 0 on all 12 instrumented files |
| NDS-002 (Tests) | **PASS** | Pre-push hook passed (auto-push succeeded); 565 tests known-passing from run-19 baseline |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api` in peerDependencies at `^1.9.0` (unchanged from prior runs) |
| API-003 | **PASS** | No vendor-specific SDKs in dependencies |
| API-004 | **PASS** | All OTel usage via `@opentelemetry/api` only; no SDK-internal imports in src/ (devDependencies only) |
| CDQ-008 | **PASS** | All 12 committed files use `trace.getTracer('commit-story')` consistently |

---

## Committed Files (12)

### 1. collectors/claude-collector.js (1 span, 3 attempts)

Run-20 committed cleanly where run-19 was partial. The sole exported async function `collectChatMessages` receives a span (`commit_story.context.collect_chat_messages`); all seven synchronous helpers (`getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `filterMessages`, `groupBySession`, `parseJSONLFile`) are correctly excluded per RST-001. The run-19 NDS-003 issue (the `allMessages.sort()` call being split across lines inside the `startActiveSpan` callback causing reassembly rejection) was not a code defect — the same formatting appears in run-20's committed output and passes NDS-003 after Prettier normalization, confirming the problem was validator-side (now resolved upstream) rather than in the instrumented code itself.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no non-instrumentation diff after Prettier normalization; minor trailing-comma differences are normalization artifacts that cancel out |
| NDS-004 | PASS — `collectChatMessages` signature reformatted to multi-line form but parameters unchanged; export preserved |
| NDS-005 | PASS — original had no try/catch; new catch rethrows after `recordException` + `SpanStatusCode.ERROR` |
| NDS-006 | PASS — all JSDoc blocks and inline comments preserved verbatim |
| API-001 | PASS — `@opentelemetry/api` only (`SpanStatusCode`, `trace`) |
| COV-001 | PASS — `collectChatMessages` (sole exported async function) has entry-point span |
| COV-003 | PASS — catch calls `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, then `throw error` |
| COV-004 | PASS — `collectChatMessages` is the only exported async function; all sync helpers correctly excluded |
| COV-005 | PASS — five attributes: `commit_story.context.source` (enum), `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.messages_count`, `commit_story.context.sessions_count`; both count attributes set on the early-return (null projectPath) path |
| RST-001 | PASS — seven sync helpers excluded |
| RST-004 | PASS — no internal detail spans; single entry-point span covers all sync helper calls |
| SCH-001 | PASS — `commit_story.context.collect_chat_messages` registered in `agent-extensions.yaml` |
| SCH-002 | PASS — all five attributes registered in `semconv/attributes.yaml` |
| SCH-003 | PASS — counts use `.length`/`.size` (int); timestamps use `.toISOString()` (string); `source` uses registered enum value `claude_code` |
| CDQ-001 | PASS — `span.end()` in `finally` block; covers early-return path and error path |
| CDQ-007 | PASS — `messages_count` from `allMessages.length`; `sessions_count` from `sessions.size`; early-return path sets both to `0` |

**Failures**: None.

---

### 2. collectors/git-collector.js (2 spans, 3 attempts)

Both exported async functions (`getPreviousCommitTime`, `getCommitData`) are instrumented with `startActiveSpan` — the same scope as run-19. The four unexported helpers (`runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo`) are correctly excluded. COV-005 remains a failure for `getCommitData` in run-20: despite agent notes describing intent to invent `commit_story.git.command`, `.parent_count`, and `.is_merge`, the committed code sets only `vcs.ref.head.revision` on that span, leaving the rich `CommitData` return value (hash, message, author, diff, merge status) entirely uncaptured. `getPreviousCommitTime` continues to pass COV-005 with both an input attribute (`vcs.ref.head.revision`) and an output attribute (`commit_story.commit.timestamp` as ISO string).

| Rule | Result |
|------|--------|
| NDS-003 | PASS — only span wrappers and OTel imports added; no business logic restructured |
| NDS-004 | PASS — no function signatures altered |
| NDS-005 | PASS — `runGit`'s original error branching preserved; new catch blocks record exception and rethrow |
| NDS-006 | PASS — all JSDoc blocks and inline comments intact |
| API-001 | PASS — `@opentelemetry/api` only |
| COV-001 | PASS — both exported async functions have entry-point spans |
| COV-003 | PASS — both span catch blocks call `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` + rethrow |
| COV-004 | PASS — both exported async functions have spans; four unexported helpers correctly excluded per RST-004 |
| COV-005 | **FAIL** — `getCommitData` sets only `vcs.ref.head.revision` (the input parameter); no output attributes from the returned `CommitData` object captured; `getPreviousCommitTime` PASS — sets both input (`vcs.ref.head.revision`) and output (`commit_story.commit.timestamp` as ISO string) |
| RST-001 | PASS — `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` are all unexported; no spans added |
| RST-004 | PASS — unexported async helpers covered by parent span execution paths |
| SCH-001 | PASS — both span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `vcs.ref.head.revision` and `commit_story.commit.timestamp` both registered; no unregistered keys used |
| SCH-003 | PASS — `vcs.ref.head.revision` is a string; `commit_story.commit.timestamp` via `.toISOString()` |
| CDQ-001 | PASS — both spans close in `finally` blocks |
| CDQ-007 | PASS — `commitRef` has default `'HEAD'`; `commit_story.commit.timestamp` only set after early-return guard |

**Failures**: COV-005 — `getCommitData` span captures only the input parameter; no output attributes from the `CommitData` return value. Agent notes mentioned `commit_story.git.command`, `.parent_count`, `.is_merge` as intent but none appear in the committed code or `agent-extensions.yaml`. At minimum, `commit_story.commit.message` (registered, guarded with null-check) would satisfy COV-005. Same failure as run-19.

---

### 3. generators/journal-graph.js (4 spans, 2 attempts)

Fourth consecutive success (runs 17–20), matching run-19 exactly: 4 spans, 2 attempts, all rules PASS. The three LangGraph node functions (`summaryNode`, `technicalNode`, `dialogueNode`) and the public orchestrator (`generateJournalSections`) are instrumented; 13 synchronous helpers and unexported utilities are correctly skipped. The two-attempt pattern persists consistently, likely reflecting the agent working out the double-try nesting required for COV-003 compliance through original graceful-degradation catches. The nested try structure on `summaryNode` and `technicalNode` (outer catch wraps inner graceful-degradation) is correct; `dialogueNode` retains only the original single-catch graceful-degradation pattern per NDS-005.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — all function bodies intact; only Prettier-normalized formatting in the diff |
| NDS-004 | PASS — all 4 async function signatures unchanged |
| NDS-005 | PASS — original graceful-degradation catches in all three node functions preserved exactly inside `startActiveSpan` callbacks |
| NDS-006 | PASS — all JSDoc blocks and inline comments preserved |
| API-001 | PASS — `@opentelemetry/api` only |
| COV-001 | PASS — all 4 exported async entry points have spans |
| COV-003 | PASS — `generateJournalSections` and outer catch layers in node functions all call `recordException` + `setStatus(ERROR)` + rethrow; `dialogueNode` retains original graceful-degradation catch (NDS-005) |
| COV-004 | PASS — all 4 exported async functions instrumented; 13 sync helpers and unexported utilities correctly skipped |
| COV-005 | PASS — node spans set `commit_story.ai.section_type`, `gen_ai.operation.name`, `gen_ai.request.temperature`; `technicalNode` conditionally adds usage tokens; orchestrator span sets `commit_story.journal.sections` and `commit_story.journal.entry_date` |
| COV-006 | PASS — manual spans wrap application-layer orchestration logic above auto-instrumented LangChain calls |
| RST-001 | PASS — 15 sync helpers and module-level constants correctly skipped |
| RST-004 | PASS — `getGraph` (unexported singleton accessor) skipped; covered by orchestrator span |
| SCH-001 | PASS — all 4 span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS — all attributes registered in `semconv/attributes.yaml` or `agent-extensions.yaml` |
| SCH-003 | PASS — `section_type` enum correct; `temperature` numeric; `sections` string array; `entry_date` ISO string |
| CDQ-001 | PASS — `span.end()` in `finally` on all 4 spans |
| CDQ-007 | PASS — `gen_ai.usage.*` guarded by `result.usage_metadata != null`; `commit_story.journal.sections` uses `.filter(Boolean)` |

**Failures**: None.

---

### 4. generators/summary-graph.js (6 spans, 2 attempts)

Run-20 reproduces the all-PASS run-19 result but took 2 attempts instead of 1. Attempt 1 had an SCH-002 misstep: the agent tried to store `weekLabel` under `commit_story.journal.entry_date` (treating it as a semantic duplicate). Attempt 2 correctly declared `commit_story.journal.week_label` in `agent-extensions.yaml`. The committed code correctly instruments all six exported async functions across the three LangGraph pipelines (daily, weekly, monthly). Span naming convention moved from run-19's `commit_story.summary.*` prefix to `commit_story.ai.*`, consistent with journal-graph.js.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — all business logic, early-exit paths, and graceful-degradation catches preserved intact |
| NDS-004 | PASS — no function signatures altered |
| NDS-005 | PASS — inner graceful-degradation catches in all three node functions preserved untouched |
| NDS-006 | PASS — all JSDoc blocks and inline comments preserved |
| API-001 | PASS — `@opentelemetry/api` only |
| COV-001 | PASS — all 6 exported async functions have spans |
| COV-003 | PASS — all 6 spans have outer catch with `recordException` + `setStatus(ERROR)` + rethrow |
| COV-004 | PASS — all 6 exported async functions instrumented; sync helpers correctly skipped |
| COV-005 | PASS — `commit_story.journal.entry_date` + `entries_count` (daily); `week_label` + `entries_count` + `gen_ai.*` (weekly node); `month_label` + `entries_count` (monthly); counts capture meaningful processing-volume state |
| COV-006 | PASS — `startActiveSpan` callbacks wrap `getModel().invoke()` and `graph.invoke()` LangChain calls |
| RST-001 | PASS — all sync formatting, parsing, cleaning, graph-builder, and graph-getter helpers skipped |
| RST-004 | PASS — no redundant detail spans on internal helpers |
| SCH-001 | PASS — all 6 span names declared in `agent-extensions.yaml` |
| SCH-002 | PASS — `entries_count`, `week_label`, `month_label` in `agent-extensions.yaml`; `entry_date`, `gen_ai.*` in `semconv/attributes.yaml` |
| SCH-003 | PASS — `entries_count` from `.length` (int); labels from string parameters; temperature = 0.7 (float) |
| CDQ-001 | PASS — `span.end()` in `finally` on all 6 spans |
| CDQ-007 | ADVISORY — orchestrator functions access `.length` on required positional array parameters without null guards; not nullable in practice but static analysis would flag |

**Failures**: None.

---

### 5. integrators/context-integrator.js (1 span, 3 attempts)

The agent placed a single span on `gatherContextForCommit`, the file's sole exported async function. The final instrumented output is substantively identical to run-19's result, with all attributes, correct error handling, and matching control flow — the regression from 1 attempt (run-19) to 3 attempts (run-20) produced no observable difference in the committed artifact. Seven attributes are set: `vcs.ref.head.revision` on entry; `commit_story.commit.message`, `commit_story.commit.timestamp` after `getCommitData`; `commit_story.filter.messages_before/after` after filtering; `commit_story.context.messages_count/sessions_count` after grouping; `commit_story.context.time_window_start/end` from resolved timestamps. The `time_window_start` attribute is guarded by `if (previousCommitTime != null)` for first-commit handling.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| API-001 | PASS |
| COV-001 | PASS — `gatherContextForCommit` (sole exported async) has span |
| COV-003 | PASS — catch records exception + ERROR status, rethrows; finally calls span.end() |
| COV-004 | PASS — sole async function; sync exports (`formatContextForPrompt`, `getContextSummary`) excluded per RST-001 |
| COV-005 | PASS — `vcs.ref.head.revision`, `commit_story.commit.message`, `commit_story.commit.timestamp`, `commit_story.filter.messages_before/after`, `commit_story.context.messages_count/sessions_count`, `commit_story.context.time_window_start/end` |
| RST-001 | PASS — `formatContextForPrompt` and `getContextSummary` are sync transformations, correctly skipped |
| RST-004 | PASS — callee functions instrumented in their own modules; no duplicate spans at call sites |
| SCH-001 | PASS — `commit_story.context.gather_context_for_commit` registered in `agent-extensions.yaml` |
| SCH-002 | PASS — all attributes registered in `semconv/attributes.yaml` |
| SCH-003 | PASS — Date objects via `.toISOString()`; integer attributes from `.length`/`.size` |
| CDQ-001 | PASS — `span.end()` in `finally` |
| CDQ-007 | PASS — `commitRef` has default `'HEAD'`; `time_window_start` guarded by null check before setting |

**Failures**: None.

---

### 6. utils/journal-paths.js (1 span, 1 attempt)

Single span on `ensureDirectory` (sole exported async). Eleven pure sync utilities correctly skipped per RST-001. 1-attempt success, stable across runs 16–20. The span name `commit_story.journal.ensure_directory` is declared as a schema extension; `commit_story.journal.file_path` is a registered attribute. CDQ-007 advisory from runs 16–19 (raw full path rather than `path.basename`) carries forward — `path.basename` is not imported; this is a known documented limitation rather than a failure.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — original had no catch; new catch rethrows |
| NDS-006 | PASS |
| API-001 | PASS |
| COV-001 | PASS — `ensureDirectory` has span |
| COV-003 | PASS — `recordException` + ERROR + rethrow in catch; `span.end()` in finally |
| COV-004 | PASS — sole exported async; 11 sync utilities skipped |
| COV-005 | PASS — `commit_story.journal.file_path` captures the filePath argument |
| RST-001 | PASS — 11 sync path-building helpers correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` declared as extension |
| SCH-002 | PASS — `commit_story.journal.file_path` registered in `attributes.yaml` |
| SCH-003 | PASS — `filePath` is string, matches `type: string` |
| CDQ-001 | PASS — `span.end()` in `finally` |
| CDQ-007 | ADVISORY — raw full path set unconditionally; `path.basename` not imported; known limitation from runs 16–19 |

**Failures**: None.

---

### 7. managers/journal-manager.js (2 spans, 3 attempts)

The agent placed spans on both exported async functions: `saveJournalEntry` and `discoverReflections`. The critical SCH-002 regression from run-19 — using `commit_story.journal.quotes_count` for reflection discovery — is resolved: run-20 uses `commit_story.journal.entries_count`, registered in `agent-extensions.yaml` and semantically appropriate for a count of parsed reflection entries returned from discovery. The 3-attempt count reflects the function-level fallback path: all three file-level attempts produced NDS-003 blocking errors before the agent switched to function-level regeneration, which succeeded. Five attributes across the two spans are all registered. The three `saveJournalEntry` attributes from nullable commit fields include explicit null guards; `file_path` is set unconditionally from the computed result of `getJournalEntryPath`, which is not nullable.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — all non-instrumentation differences are Prettier-style whitespace changes that normalize away |
| NDS-004 | PASS |
| NDS-005 | PASS — inner ENOENT catch in `saveJournalEntry` and two inner empty catches in `discoverReflections` loop all preserved; intentional graceful-degradation paths |
| NDS-006 | PASS |
| API-001 | PASS |
| COV-001 | PASS — both exported async functions have entry-point spans |
| COV-003 | PASS — both spans: outer try/catch with `recordException` + `SpanStatusCode.ERROR` + rethrow; `span.end()` in finally |
| COV-004 | PASS — `formatJournalEntry` (exported, sync) excluded per RST-001; 8 unexported sync helpers excluded |
| COV-005 | PASS — `saveJournalEntry`: `file_path` is a computed output (path derived from commit timestamp and basePath); `discoverReflections`: `entries_count` is the count of discovered reflections returned |
| RST-001 | PASS — `formatJournalEntry` (exported sync) and 8 unexported sync helpers correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.save_entry` and `commit_story.journal.discover_reflections` both registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `commit_story.journal.entries_count` registered in `agent-extensions.yaml`; resolves run-19 `quotes_count` mismatch; used for `reflections.length` (count of parsed reflection entry objects) |
| SCH-003 | PASS — `time_window_start/end` via `.toISOString()` (string); `entries_count` is `.length` (int); `file_path` is a string path |
| CDQ-001 | PASS — `span.end()` in `finally` for both spans |
| CDQ-007 | ADVISORY — `file_path` set unconditionally from `getJournalEntryPath` (pure function, not nullable); `commit.timestamp`, `commit.shortHash`, `commit.message` all have explicit `!= null` guards |

**Failures**: None. SCH-002 resolved from run-19.

---

### 8. managers/summary-manager.js (9 spans, 1 attempt)

Run-20 resolves the run-19 regression completely: all 9 exported async functions now have spans, including the three `generateAndSave*` orchestrators that were blocked by NDS-003 violations in run-19. PRD #885 fix confirmed — the agent instrumented all 9 spans in a single attempt with no NDS-003 rejections. One COV-005 gap exists: `readWeekDailySummaries` and `readMonthWeeklySummaries` set only their input label parameter without capturing a computed output attribute (a count of summaries found).

| Rule | Result |
|------|--------|
| NDS-003 | PASS — all 9 spans accepted; complex multi-line return objects and nested try/catch blocks in `generateAndSave*` functions preserved verbatim |
| NDS-004 | PASS |
| NDS-005 | PASS — all graceful-degradation catches (ENOENT-swallowing, access/readdir) left unmodified; outer span catch handles unexpected errors |
| NDS-006 | PASS — all inline comments and JSDoc preserved across all 9 functions |
| API-001 | PASS |
| COV-001 | PASS — all 9 exported async functions covered |
| COV-003 | PASS — all 9 spans use try/catch/finally with `recordException`, `setStatus(ERROR)`, and rethrow; inner graceful-degradation catches left as NDS-005 originals |
| COV-004 | PASS — all 9 exported async functions covered; 5 sync helpers correctly skipped per RST-001 |
| COV-005 | **FAIL** — `readWeekDailySummaries` sets only `week_label` (input parameter); `readMonthWeeklySummaries` sets only `month_label` (input parameter); both compute and return arrays of summaries but capture no quantity attribute. All other 7 spans capture output or state attributes. |
| RST-001 | PASS — `formatDailySummary`, `formatWeeklySummary`, `formatMonthlySummary`, `getWeekBoundaries`, `getMonthBoundaries` correctly skipped as sync |
| RST-004 | PASS — no unexported async functions in this file |
| SCH-001 | PASS — all 9 span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS — all attributes registered in main schema or `agent-extensions.yaml` |
| SCH-003 | PASS — `entries_count` from `.length` (int); labels are string arguments; `entry_date` is a string; `file_path` is a string path |
| CDQ-001 | PASS — `span.end()` in `finally` on all 9 spans |
| CDQ-007 | PASS — `file_path` set only after `if (!path)` early-return guard; `entries_count` after non-empty guard; label strings are required function arguments |

**Failures**: COV-005 — `readWeekDailySummaries` and `readMonthWeeklySummaries` set only their input label parameters without capturing a computed output attribute (e.g., count of summaries read). Both functions build and return arrays of summaries but record no quantity on the span.

---

### 9. commands/summarize.js (3 spans, 2 attempts)

Three exported async entry points instrumented: `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize`. Run-20 matches run-19's all-PASS outcome, saving one attempt (3→2), with an improvement: CDQ-007 null guards added before `.length` calls on destructured array parameters. One notable quirk: `runMonthlySummarize` sets `commit_story.summary.weeks_count` instead of `commit_story.summary.months_count` — the agent notes explain this as intentional schema minimization; `weeks_count` is registered so no SCH-002 violation occurs, but the semantic mismatch is worth noting as a future signal.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no structural changes to original logic |
| NDS-004 | PASS |
| NDS-005 | PASS — inner per-item catches in all three functions preserved verbatim; silent `catch { // Doesn't exist, proceed }` preserved unchanged |
| NDS-006 | PASS — all JSDoc blocks and inline comments preserved |
| API-001 | PASS |
| COV-001 | PASS — all 3 exported async functions have entry-point spans |
| COV-003 | PASS — all 3 spans have outer catch with `recordException` + `setStatus(ERROR)` + rethrow |
| COV-004 | PASS — all 3 exported async functions instrumented; 5 exported sync functions and 1 unexported sync helper correctly skipped |
| COV-005 | PASS — `dates_count`/`weeks_count` capture batch input size; `generated_count` captures outcome count; `force` flag captured on all spans |
| RST-001 | PASS — `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `showSummarizeHelp` all synchronous |
| RST-004 | PASS |
| SCH-001 | PASS — all 3 span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `dates_count`, `force`, `weeks_count`, `generated_count` all registered in `agent-extensions.yaml` |
| SCH-003 | PASS — counts from `.length` (int); `force` from boolean param; `generated_count` from result array `.length` |
| CDQ-001 | PASS — `span.end()` in `finally` on all 3 spans |
| CDQ-007 | PASS — `if (dates != null)`, `if (weeks != null)`, `if (months != null)` guards added before `.length` access |

**Failures**: None.

---

### 10. utils/summary-detector.js (9 spans, 1 attempt)

All 9 async functions instrumented — 5 exported and 4 unexported async helpers. Outcome is identical to run-19: 9 spans, 1-attempt success. Key improvement over run-19: SCH-002 resolves from ADVISORY to PASS — all attribute keys used (`commit_story.journal.entries_count`, `commit_story.summary.dates_count`, `commit_story.summary.weeks_count`, `commit_story.summary.months_count`) are confirmed registered in `agent-extensions.yaml`. Highest single-file span count among committed files, stable across runs 18–20.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original business logic preserved; only span scaffolding and tracer initialization added |
| NDS-004 | PASS |
| NDS-005 | PASS — all inner `readdir` graceful-degradation catches (returning `[]` or `new Set()`) preserved unmodified |
| NDS-006 | PASS — all JSDoc blocks and inline comments preserved |
| API-001 | PASS |
| COV-001 | PASS — all 5 exported async functions have entry-point spans |
| COV-003 | PASS — every span has outer try/catch/finally with `recordException` + `ERROR` + rethrow; inner graceful-degradation catches are NDS-005 originals |
| COV-004 | PASS — all 9 async functions instrumented; 4 unexported helpers qualify per RST-004; 2 sync helpers excluded |
| COV-005 | PASS — result count attribute set on every span capturing output state |
| RST-001 | PASS — `getTodayString` and `getNowDate` are sync pure helpers; correctly excluded |
| RST-004 | PASS — 4 unexported helpers each serve as the sole standalone I/O source for a distinct data class |
| SCH-001 | PASS — all 9 span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS — all 4 attribute keys confirmed in `agent-extensions.yaml`; resolves run-19 ADVISORY |
| SCH-003 | PASS — all count attributes set from `.length` or `.size` on locally constructed arrays/Sets |
| CDQ-001 | PASS — `span.end()` in `finally` on all 9 spans |
| CDQ-007 | PASS — all attributes from `.length`/`.size` on locally constructed collections; no nullable field access |

**Failures**: None. SCH-002 ADVISORY from run-19 resolved.

---

### 11. managers/auto-summarize.js (3 spans, 1 attempt)

All three exported async functions — `triggerAutoSummaries`, `triggerAutoWeeklySummaries`, and `triggerAutoMonthlySummaries` — received spans in a single attempt, resolving the COV-001 PARTIAL from run-19 where `triggerAutoSummaries` was skipped after three attempts due to an NDS-003 failure on the spread-array return expression. `generated_count` is set on both return paths of `triggerAutoSummaries` (early-return failure-skip path and normal path), ensuring the attribute is always present. `getErrorMessage` (unexported, sync) correctly skipped.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original logic, comments, and multi-line spread-array return structure preserved exactly |
| NDS-004 | PASS — all three function signatures unchanged |
| NDS-005 | PASS — inner per-item for-loop catches accumulate to result arrays without rethrowing; all three are graceful-degradation catches preserved per NDS-007 |
| NDS-006 | PASS — all JSDoc blocks and inline comments (including implementation notes) preserved |
| API-001 | PASS |
| COV-001 | PASS — all three exported async entry points have spans |
| COV-003 | PASS — all three spans have outer catch with `recordException` + `setStatus(ERROR)` + rethrow |
| COV-004 | PASS — all three exported async functions instrumented; `getErrorMessage` (unexported, sync) excluded |
| COV-005 | PASS — `triggerAutoSummaries`: `dates_count` at entry, `generated_count` on both return paths; weekly/monthly: queue-depth count at entry, `generated_count` at exit |
| RST-001 | PASS — `getErrorMessage` correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — all three span names registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `dates_count`, `weeks_count`, `months_count`, `generated_count` all registered in `agent-extensions.yaml` |
| SCH-003 | PASS — all counts from `.length` on scope-initialized arrays (int) |
| CDQ-001 | PASS — `span.end()` in `finally` on all three spans |
| CDQ-007 | PASS — all `setAttribute` calls use `.length` on arrays initialized in function scope; no nullable access |

**Failures**: None. COV-001 PARTIAL from run-19 resolved.

---

### 12. src/index.js (1 span, 3 attempts)

`main()` is instrumented as the COV-001 process entry point with span name `commit_story.commands.main` (registered as a schema extension) and a single attribute `vcs.ref.head.revision`. This is a regression from run-19: attempt count jumped from 1 to 3 (NDS-003 failures on attempts 1–2 from the same JSON string serialization issue affecting `mcp/server.js`), and `commit_story.cli.subcommand` — the routing-state attribute that distinguished the subcommand and satisfied COV-005 in run-19 — was dropped in attempt 3 when the agent simplified output to avoid NDS-003. The CDQ-001 known limitation (6 `process.exit()` calls before `finally` causing span leaks on validation-failure paths) persists, consistent with runs 12–19.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — committed output is clean; attempts 1–2 had NDS-003 failures from JSON `\n` serialization (same root as `mcp/server.js` failure this run) |
| NDS-004 | PASS |
| NDS-005 | PASS — inner `try/catch` around `triggerAutoSummaries` (graceful-degradation) preserved inside the `startActiveSpan` callback |
| NDS-006 | PASS — all JSDoc, `/** Exit codes */` comment, and inline comments preserved |
| API-001 | PASS |
| COV-001 | PASS — `main()` is the process entry point and has a span |
| COV-003 | PASS — catch calls `span.recordException(error)`, `span.setStatus(ERROR)`, and rethrows |
| COV-004 | PASS — `main()` is the sole async function requiring a span; `handleSummarize` (unexported) covered by RST-004; sync helpers excluded |
| COV-005 | **FAIL** — only `vcs.ref.head.revision = commitRef` is set; this is the input parameter; no output or state attribute captured; run-19 included `commit_story.cli.subcommand` which passed COV-005; dropping it leaves the span with only an input param |
| RST-001 | PASS — sync helpers correctly excluded |
| RST-004 | PASS — `handleSummarize` is unexported; covered by parent span |
| SCH-001 | PASS — `commit_story.commands.main` registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `vcs.ref.head.revision` is a registered OTel VCS attribute |
| SCH-003 | PASS — `commitRef` always has default `'HEAD'` (string); never null |
| CDQ-001 | KNOWN LIMITATION — `span.end()` in `finally` covers normal return; 6 `process.exit()` calls on validation-failure branches execute before `finally`, causing span leaks on those branches; consistent across runs 12–19 |
| CDQ-007 | PASS — `commitRef` has default `'HEAD'`; no nullable access |

**Failures**: COV-005 — only the input parameter `vcs.ref.head.revision` is captured; no output or state attribute recorded; the routing-mode attribute (`commit_story.cli.subcommand`) present in run-19 was dropped in attempt 3.

**Regression note**: 1 attempt (run-19) → 3 attempts (run-20). NDS-003 + attempt-count regression tied to the same JSON string serialization issue that caused `mcp/server.js` to fail outright. The COV-005 regression is file-specific — the agent simplified to escape NDS-003 at the cost of dropping the subcommand attribute.

---

## Failed Files (1)

### 13. mcp/server.js (0 spans committed, 3 attempts)

This file was not committed due to NDS-003 oscillation — a spiny-orb false positive caused by the `stripOtelNodes` bug introduced by PRD #885: when the OTel import is placed first in the file, stripping it removes the file-level leading trivia (shebang line + JSDoc block), producing a spurious 21-line diff. The agent's code was correct and identical across all 3 attempts. Evaluation applied to the attempt-3 debug dump as if it had been committed. In run-19, this file passed in 1 attempt; run-20's agent chose span name `commit_story.mcp.start` and attribute `commit_story.context.source` (vs run-19's `commit_story.mcp.server_start` and `commit_story.mcp.transport_type`).

The debug dump instruments only `main()` with `tracer.startActiveSpan('commit_story.mcp.start', ...)`. `createServer()` (synchronous, unexported) correctly skipped. `commit_story.context.source` set to `'mcp'` — a registered enum attribute. One quality issue independent of the false positive: span name `commit_story.mcp.start` is not registered in either schema file (SCH-001 FAIL), repeating a gap observed across runs 18–19 where MCP entry-point span names have never been added to `agent-extensions.yaml`.

| Rule | Result |
|------|--------|
| NDS-003 | **FAIL (SPINY-ORB FALSE POSITIVE)** — `stripOtelNodes` bug strips shebang + JSDoc when OTel import is placed first; agent code is correct and unchanged across all 3 attempts; not an agent defect |
| NDS-004 | PASS — `main()` signature unchanged; only OTel import and tracer declaration added |
| NDS-005 | PASS — original had no try/catch in `main()`; new try/catch rethrows; outer `.catch()` handler at call site preserved exactly |
| NDS-006 | PASS — shebang and full JSDoc block preserved in the agent's output |
| API-001 | PASS — `@opentelemetry/api` only |
| COV-001 | PASS — `main()` is the exported async process entry point; span wraps its entire body |
| COV-003 | PASS — catch calls `recordException` + `setStatus(ERROR)`, rethrows; `span.end()` in finally |
| COV-004 | PASS — `main()` is the only async function; `createServer` is synchronous |
| COV-005 | ADVISORY — `commit_story.context.source` set to `'mcp'` captures server type identity; meaningful domain attribute, though hardcoded constant rather than computed output |
| RST-001 | PASS — `createServer` is sync; correctly skipped |
| RST-004 | PASS |
| SCH-001 | **FAIL** — `commit_story.mcp.start` not registered in `semconv/attributes.yaml` or `semconv/agent-extensions.yaml`; recurring gap across runs 18–20 (run-18: `commit_story.mcp.server.start`, run-19: `commit_story.mcp.server_start`, run-20: `commit_story.mcp.start` — all unregistered) |
| SCH-002 | PASS — `commit_story.context.source` registered in `semconv/attributes.yaml` with enum member `mcp` |
| SCH-003 | PASS — `'mcp'` is the registered enum value |
| CDQ-001 | PASS — `span.end()` in `finally` |
| CDQ-007 | PASS — `'mcp'` is a hardcoded string literal; no nullable access |

**Failures**:
- NDS-003 — SPINY-ORB FALSE POSITIVE: `stripOtelNodes` removes shebang + JSDoc when OTel import is placed first; agent instrumentation is correct; root cause in failure-deep-dives.md
- SCH-001 — Span name `commit_story.mcp.start` not registered in either schema file; recurring gap across runs 18–20

---

## Correct Skips (17)

All 17 files correctly skipped — same set as runs 9–19. No spans committed.

| File | Exported symbols | Async I/O? | Skip verdict |
|------|-----------------|-----------|--------------|
| generators/prompts/guidelines/accessibility.js | `accessibilityGuidelines` (const string) | No | RST-001 ✅ |
| generators/prompts/guidelines/anti-hallucination.js | `antiHallucinationGuidelines` (const string) | No | RST-001 ✅ |
| generators/prompts/guidelines/index.js | re-exports from guidelines modules | No | RST-001 ✅ |
| generators/prompts/sections/daily-summary-prompt.js | prompt string constant(s) | No | RST-001 ✅ |
| generators/prompts/sections/dialogue-prompt.js | prompt string constant(s) | No | RST-001 ✅ |
| generators/prompts/sections/monthly-summary-prompt.js | prompt string constant(s) | No | RST-001 ✅ |
| generators/prompts/sections/summary-prompt.js | prompt string constant(s) | No | RST-001 ✅ |
| generators/prompts/sections/technical-decisions-prompt.js | prompt string constant(s) | No | RST-001 ✅ |
| generators/prompts/sections/weekly-summary-prompt.js | prompt string constant(s) | No | RST-001 ✅ |
| integrators/filters/message-filter.js | `filterMessages`, `groupFilteredBySession` (sync) | No | RST-001 ✅ |
| integrators/filters/sensitive-filter.js | sync filter functions | No | RST-001 ✅ |
| integrators/filters/token-filter.js | sync filter functions | No | RST-001 ✅ |
| mcp/tools/context-capture-tool.js | `registerContextCaptureTool` (sync) | No (exported fn is sync) | RST-001 ✅ (with note) |
| mcp/tools/reflection-tool.js | `registerReflectionTool` (sync) | No (exported fn is sync) | RST-001 ✅ (with note) |
| traceloop-init.js | None (top-level side-effect module) | No | RST-001 ✅ |
| utils/commit-analyzer.js | sync analysis functions | No | RST-001 ✅ |
| utils/config.js | `config` (frozen const object) | No | RST-001 ✅ |

**Note on context-capture-tool.js and reflection-tool.js**: The exported function (`registerContextCaptureTool`/`registerReflectionTool`) is synchronous — it calls `server.tool()` and returns immediately. The async I/O inside the tool handler callback (filesystem writes via `mkdir`/`appendFile`) is not an exported function and does not trigger COV-001 or COV-004 under the current rubric. The async MCP handlers perform real I/O and are the logical tool entry points from the MCP runtime's perspective — a structural observation for future rubric consideration, not a current failure.

---

## Canonical Failures Summary

| File | Rule | Severity | Finding |
|------|------|----------|---------|
| collectors/git-collector.js | COV-005 | Fail | `getCommitData` sets only input parameter `vcs.ref.head.revision`; no output attributes from `CommitData` return value; same failure as run-19 |
| managers/summary-manager.js | COV-005 | Fail | `readWeekDailySummaries` and `readMonthWeeklySummaries` set only input label parameters; no computed output attributes (e.g., count of summaries read) |
| src/index.js | COV-005 | Fail | Only input parameter `vcs.ref.head.revision` captured; `commit_story.cli.subcommand` dropped in attempt 3 to avoid NDS-003; regression from run-19 |
| mcp/server.js (failed) | NDS-003 | Fail (false positive) | `stripOtelNodes` bug removes shebang + JSDoc when OTel import is first; agent code correct; spiny-orb defect |
| mcp/server.js (failed) | SCH-001 | Fail | Span name `commit_story.mcp.start` not registered in either schema file; recurring gap across runs 18–20 |
