# Per-File Evaluation — Run-13

**Date**: 2026-04-12
**Branch**: spiny-orb/instrument-1776014409398
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 7 committed + 1 partial (unpreserved in git)

**Note on partial file**: `src/generators/journal-graph.js` is listed as "partial (11/12 functions)" in the PR summary but shows no diff between main and the instrument branch — the partially instrumented version was not committed. Evaluation of this file is based solely on the PR summary and agent notes.

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | Checkpoints confirmed no syntax errors in the 7 committed files; checkpoint rollbacks removed the two files that failed tests |
| NDS-002 (Tests) | **PASS** | Checkpoint mechanism confirmed: checkpoint 1 rolled back 5 files after test failure; checkpoint 2 rolled back 5 more; remaining 7 committed files do not cause test failures. The checkpoint rollback IS the test pass confirmation. |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api: ^1.9.0` in peerDependencies |
| API-003 | **PASS** | No OTel SDK in runtime dependencies; `@langchain/*`, `@modelcontextprotocol/sdk`, `zod`, `dotenv` only |
| API-004 | **PASS** | No `@opentelemetry/sdk-*` imports in committed files; traceloop auto-instrumentation in traceloop-init.js is not in src/ instrumented files |
| CDQ-008 | **PASS** | All 7 committed files use `trace.getTracer('commit-story')` consistently |

---

## Committed Files (7)

### 1. collectors/claude-collector.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | No original code modified; OTel import and span added cleanly |
| API-001 | PASS | Only `@opentelemetry/api` imported |
| NDS-006 | PASS | New import added, no existing imports modified |
| NDS-004 | PASS | No process/runtime OTel instrumentation beyond @opentelemetry/api |
| NDS-005 | PASS | Outer catch: recordException + setStatus(ERROR). Inner catch in parseJSONLFile: expected-condition (malformed JSON), correctly omitted |
| COV-001 | PASS | collectChatMessages is the exported async entry point; receives the span |
| COV-002 | PASS | Filesystem I/O (readFileSync, readdirSync, statSync) covered under parent span via context propagation |
| COV-003 | PASS | No error-result return pattern that bypasses throw |
| COV-004 | PASS | collectChatMessages is the sole exported async function; all helpers are sync |
| COV-005 | PASS | commit_story.context.source, time_window_start, time_window_end, sessions_count, messages_count all set |
| COV-006 | N/A | No auto-instrumentation library overlap; pure node:fs I/O |
| RST-001 | PASS | 7 sync functions (getClaudeProjectsDir, encodeProjectPath, getClaudeProjectPath, findJSONLFiles, parseJSONLFile, filterMessages, groupBySession) correctly skipped |
| RST-002 | PASS | No trivial accessor spans |
| RST-003 | PASS | No duplicate spans |
| RST-004 | PASS | All unexported helpers are also sync; skipped per RST-001 |
| SCH-001 | PASS | span.commit_story.context.collect_chat_messages registered in agent-extensions.yaml |
| SCH-002 | PASS | Span name follows commit_story.\<category\>.\<operation\> pattern |
| SCH-003 | PASS | All attributes are correct types: ISO strings for timestamps, int for counts |
| CDQ-001 | PASS | No template literals or dynamic concatenation in span names |
| CDQ-002 | PASS | No span names built at runtime |
| CDQ-003 | PASS | Error handling via recordException + setStatus on outer catch |
| CDQ-005 | PASS | commit_story.context.source set to 'claude_code' |
| CDQ-006 | PASS | No expensive computations in setAttribute calls |
| CDQ-007 | PASS | repoPath explicitly excluded ("raw filesystem paths must not be passed as attribute values") |

**Failures**: None.

---

### 2. collectors/git-collector.js (2 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | No original code modified |
| API-001 | PASS | Only `@opentelemetry/api` imported |
| NDS-006 | PASS | New import added cleanly |
| NDS-004 | PASS | |
| NDS-005 | PASS | Both spans have recordException + setStatus in outer catch |
| COV-001 | PASS | getPreviousCommitTime and getCommitData are the exported async entry points |
| COV-002 | PASS | git subprocess calls covered by getCommitData span |
| COV-003 | PASS | Errors thrown, not returned |
| COV-004 | PASS | Both exported async functions instrumented; internal helpers (runGit, getCommitMetadata, getCommitDiff, getMergeInfo) are unexported |
| COV-005 | PASS | vcs.ref.head.revision, commit_story.commit.message, commit_story.commit.timestamp set. commit_story.commit.author correctly omitted per CDQ-007 (PII) |
| COV-006 | N/A | No auto-instrumented libraries used |
| RST-001 | PASS | No sync utility functions need spans |
| RST-002 | PASS | |
| RST-003 | PASS | No duplicate spans |
| RST-004 | PASS | runGit, getCommitMetadata, getCommitDiff, getMergeInfo are all unexported; skipped per RST-004 |
| SCH-001 | PASS | span.commit_story.git.get_previous_commit_time and span.commit_story.git.get_commit_data registered in agent-extensions |
| SCH-002 | PASS | Span names follow convention |
| SCH-003 | PASS | metadata.timestamp converted via .toISOString() before setAttribute |
| CDQ-001 | PASS | |
| CDQ-002 | PASS | |
| CDQ-003 | PASS | |
| CDQ-005 | PASS | vcs.ref.head.revision and commit_story.commit.message provide domain context |
| CDQ-006 | PASS | No expensive computations in setAttribute |
| CDQ-007 | PASS | commit.author omitted (PII); commit.message uses subject line only to bound size |

**Failures**: None.

---

### 3. commands/summarize.js (3 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | No original code modified |
| API-001 | PASS | |
| NDS-006 | PASS | |
| NDS-004 | PASS | |
| NDS-005 | PASS | Inner per-date/week/month catches are expected-condition (graceful degradation); outer catches have recordException + setStatus |
| COV-001 | PASS | runSummarize, runWeeklySummarize, runMonthlySummarize all instrumented |
| COV-002 | PASS | I/O delegated to summary-manager functions, covered via context propagation under these spans |
| COV-003 | PASS | No error-result returns that bypass throws at span level |
| COV-004 | PASS | All 3 exported async functions instrumented; 6 pure sync helpers (isValidDate, isValidWeekString, isValidMonthString, expandDateRange, parseSummarizeArgs, showSummarizeHelp) correctly skipped |
| COV-005 | PASS | date_count/week_count/month_count, force, generated_count, failed_count all set |
| COV-006 | N/A | No auto-instrumented libraries used |
| RST-001 | PASS | 6 sync utility functions correctly skipped |
| RST-002 | PASS | |
| RST-003 | PASS | |
| RST-004 | PASS | |
| SCH-001 | PASS | All 3 span names and 5 new attributes registered in agent-extensions |
| SCH-002 | PASS | |
| SCH-003 | PASS | force set as boolean directly (OTel accepts boolean primitives) |
| CDQ-001 | PASS | |
| CDQ-002 | PASS | |
| CDQ-003 | PASS | |
| CDQ-005 | PASS | Multiple domain attributes per span |
| CDQ-006 | PASS | |
| CDQ-007 | PASS | basePath explicitly excluded |

**Failures**: None.

---

### 4. generators/journal-graph.js — PARTIAL (not preserved in git)

**Status**: Partial commit attempted (3 spans, 11/12 functions instrumented), but no diff exists on the instrument branch between main and `spiny-orb/instrument-1776014409398` for this file. The instrumented version was not committed. Evaluation is based on PR summary and agent notes only.

**Instrumented functions** (per PR summary/agent notes): technicalNode (1 span), dialogueNode (1 span), generateJournalSections (1 span). summaryNode skipped (NDS-003 Code Preserved: agent modifies line 27 every attempt).

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | **FAIL (summaryNode)** | summaryNode: NDS-003 Code Preserved on line 27 (`const systemContent = \`${guidelines}`) — 3 consecutive runs, same failure |
| API-001 | PASS (assumed) | All other committed files use @opentelemetry/api only |
| NDS-006 | PASS (assumed) | |
| NDS-004 | PASS | traceloop auto-instrumentation in traceloop-init.js, not in this file |
| NDS-005 | PASS | technicalNode and dialogueNode return error-state objects from catch blocks with recordException + setStatus (genuine LLM failures, not expected-condition) |
| COV-001 | PASS | generateJournalSections is the exported entry point; receives a span |
| COV-002 | PASS | LangChain model.invoke() calls are child spans via auto-instrumentation |
| COV-003 | PASS | |
| COV-004 | **PARTIAL** | summaryNode is an exported async function (exported in bottom block) that was skipped; COV-004 requires spans on exported async I/O functions. summaryNode makes an LLM call. |
| COV-005 | PASS | technicalNode and dialogueNode set section_type; generateJournalSections sets domain attributes |
| COV-006 | PASS | Agent correctly identified @traceloop/instrumentation-langchain; manual spans wrap application logic above auto-instrumented LangChain calls |
| RST-001 | PASS | 8 sync helpers correctly skipped |
| RST-002 | PASS | |
| RST-003 | PASS | |
| RST-004 | PASS | All unexported helpers skipped |
| SCH-001 | PASS | 3 new span names registered in agent-extensions |
| SCH-002 | PASS | |
| SCH-003 | PASS (assumed) | |
| CDQ-001 | PASS | |
| CDQ-002 | PASS | |
| CDQ-003 | PASS | |
| CDQ-005 | PASS | |
| CDQ-006 | **ADVISORY** | PR summary flags: `Object.keys(result).filter(...)` at line 632 in generateJournalSections setAttribute call — expensive computation without isRecording() guard |
| CDQ-007 | PASS | |

**Canonical Failures**: NDS-003 (summaryNode Code Preserved — 3rd consecutive run), COV-004 partial (summaryNode skipped).
**Note**: File not preserved in git — cannot be scored for NDS-001/NDS-002 gates.

---

### 5. integrators/context-integrator.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | No original code modified |
| API-001 | PASS | |
| NDS-006 | PASS | |
| NDS-004 | PASS | |
| NDS-005 | PASS | Outer catch has recordException + setStatus |
| COV-001 | PASS | gatherContextForCommit is the sole exported async entry point |
| COV-002 | PASS | Orchestrates git and Claude collectors; their I/O covered by child spans |
| COV-003 | PASS | |
| COV-004 | PASS | gatherContextForCommit is the only exported async function; formatContextForPrompt and getContextSummary are sync |
| COV-005 | PASS | messages_count, sessions_count, filter.messages_before, filter.messages_after, time_window_start, time_window_end — 6 domain attributes |
| COV-006 | N/A | No auto-instrumented libraries |
| RST-001 | PASS | formatContextForPrompt and getContextSummary are sync pure functions, correctly skipped |
| RST-002 | PASS | |
| RST-003 | PASS | |
| RST-004 | PASS | |
| SCH-001 | PASS | span.commit_story.context.gather_context_for_commit registered |
| SCH-002 | PASS | |
| SCH-003 | PASS | ISO string timestamps, int counts |
| CDQ-001 | PASS | |
| CDQ-002 | PASS | |
| CDQ-003 | PASS | |
| CDQ-005 | PASS | 6 domain attributes — best attribute coverage of all committed files |
| CDQ-006 | PASS | |
| CDQ-007 | PASS | commit.author not set; only project-relative paths used |

**Failures**: None. commit_story.context.messages_count is set here (run-12 success criterion #6 for index.js is instead satisfied by this file in run-13).

---

### 6. managers/auto-summarize.js (3 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | No original code modified |
| API-001 | PASS | |
| NDS-006 | PASS | |
| NDS-004 | PASS | |
| NDS-005 | PASS | Inner per-item catches are expected-condition (graceful degradation); outer catches have recordException + setStatus |
| COV-001 | PASS | All 3 exported async functions instrumented |
| COV-002 | PASS | Filesystem I/O covered via child spans to summary-detector and summary-manager |
| COV-003 | PASS | |
| COV-004 | PASS | All 3 exported async functions instrumented; getErrorMessage unexported and skipped |
| COV-005 | PASS | date_count, week_count, month_count, generated_count, failed_count — all schema-registered keys |
| COV-006 | N/A | |
| RST-001 | PASS | |
| RST-002 | PASS | |
| RST-003 | PASS | |
| RST-004 | PASS | getErrorMessage unexported, correctly skipped |
| SCH-001 | PASS | All 3 new span names and 0 new attributes (all reuse registered keys) |
| SCH-002 | PASS | |
| SCH-003 | PASS | int types for counts |
| CDQ-001 | PASS | |
| CDQ-002 | PASS | |
| CDQ-003 | PASS | |
| CDQ-005 | PASS | count attributes on all 3 spans |
| CDQ-006 | PASS | |
| CDQ-007 | PASS | No path attributes |

**Failures**: None. attributesCreated = 0 (all attributes reuse registered schema keys) — good signal.

---

### 7. utils/journal-paths.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Agent explicitly avoided adding a `basename` import (which caused NDS-003 in a previous attempt); used `filePath.split('/').pop()` inline instead |
| API-001 | PASS | |
| NDS-006 | PASS | No existing imports modified |
| NDS-004 | PASS | |
| NDS-005 | PASS | recordException + setStatus in outer catch |
| COV-001 | PASS | ensureDirectory is the only exported async function |
| COV-002 | PASS | mkdir is the I/O operation; covered by the ensureDirectory span |
| COV-003 | PASS | |
| COV-004 | PASS | ensureDirectory is the only exported async function; 11 remaining functions are sync |
| COV-005 | PASS | commit_story.journal.file_path set (project-relative filename fragment) |
| COV-006 | N/A | |
| RST-001 | PASS | 11 sync utility functions correctly skipped |
| RST-002 | PASS | getYearMonth, getDateString, parseDateFromFilename, etc. are trivial accessors/formatters |
| RST-003 | PASS | |
| RST-004 | PASS | |
| SCH-001 | PASS | span.commit_story.journal.ensure_directory registered |
| SCH-002 | PASS | |
| SCH-003 | PASS | |
| CDQ-001 | PASS | |
| CDQ-002 | PASS | |
| CDQ-003 | PASS | |
| CDQ-005 | PASS | commit_story.journal.file_path provides file context |
| CDQ-006 | PASS | `filePath.split('/').pop()` is a simple string operation; not an expensive computation requiring isRecording() guard |
| CDQ-007 | PASS | Stores only the filename fragment (`filePath.split('/').pop()`), not the full absolute path |

**Failures**: None. The 3-attempt count here is notable — the agent found a CDQ-007-safe workaround that didn't require modifying existing import lines.

---

### 8. utils/summary-detector.js (5 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Early-return guards (`if (x.length === 0) return []`) preserved exactly |
| API-001 | PASS | |
| NDS-006 | PASS | |
| NDS-004 | PASS | |
| NDS-005 | PASS | Inner ENOENT catches are expected-condition (graceful degradation), correctly omitted. Outer catches have recordException + setStatus |
| COV-001 | PASS | All 5 exported async functions instrumented |
| COV-002 | PASS | readdir I/O covered by all 5 spans |
| COV-003 | PASS | Inner catches handle ENOENT gracefully; no false NDS-005 violations |
| COV-004 | PASS | All 5 exported async functions instrumented; 4 unexported helpers skipped per RST-004 |
| COV-005 | PASS | date_count, week_count, month_count set on appropriate spans. Inner ENOENT catch paths set count = 0 before early return to satisfy COV-005 even on empty-result paths |
| COV-006 | N/A | |
| RST-001 | PASS | |
| RST-002 | PASS | |
| RST-003 | PASS | No duplicate spans |
| RST-004 | PASS | getSummarizedDays, getSummarizedWeeks, getSummarizedMonths, getWeeksWithWeeklySummaries are unexported; correctly skipped despite being async |
| SCH-001 | PASS | All 5 new span names registered in agent-extensions |
| SCH-002 | PASS | Span names follow commit_story.summarize.\<operation\> pattern consistently |
| SCH-003 | PASS | int types for all count attributes |
| CDQ-001 | PASS | |
| CDQ-002 | PASS | |
| CDQ-003 | PASS | |
| CDQ-005 | PASS | Count attributes on all 5 spans; zero-result early-return paths also set count = 0 |
| CDQ-006 | PASS | |
| CDQ-007 | PASS | No path attributes |

**Failures**: None. Best-executed file: 5 spans across 5 functions, all using existing schema keys (attributesCreated = 0), RST-004 boundary clearly respected, graceful empty-result handling on inner catches.

---

## Correct Skips (11)

All 11 correct skips are pure constants files, sync-only modules, or files with no exportable functions. No rubric evaluation needed:

- anti-hallucination.js — single exported string constant, no functions
- index.js (guidelines) — single synchronous export
- daily-summary-prompt.js — synchronous function, no I/O
- dialogue-prompt.js — single exported string constant
- monthly-summary-prompt.js — synchronous function, no I/O
- message-filter.js — all synchronous exports
- sensitive-filter.js — all synchronous exports
- token-filter.js — all synchronous exports
- traceloop-init.js — top-level init, no function declarations to instrument
- commit-analyzer.js — all synchronous exports
- config.js — module-level init code, exported constant only

All correctly skipped per RST-001/RST-002.

---

## Summary

| Category | Pass | Fail | N/A | Advisory |
|----------|------|------|-----|----------|
| Gate rules (NDS-001, NDS-002) | 2 | 0 | — | — |
| Per-run rules (API-002/003/004, CDQ-008) | 4 | 0 | — | — |
| **Committed files (7)** | **All rules** | **None** | COV-006 (×7) | — |
| **Partial file (journal-graph.js)** | Most | NDS-003 (summaryNode), COV-004 (partial) | — | CDQ-006 (generateJournalSections) |

**Canonical failures**: NDS-003 (summaryNode, 3rd consecutive run), COV-004 (summaryNode skipped).

All 7 committed files are clean — no rubric failures. The failures in this run are concentrated in the rolled-back files (caught by checkpoints) and the persistent journal-graph.js summaryNode issue.

The COV-005 run-12 concern (`commit_story.context.messages_count` dropped by index.js due to NDS-003 truthy conflict) is resolved in run-13 by context-integrator.js setting the attribute directly — no guard needed since `filteredMessages.length` cannot be undefined.
