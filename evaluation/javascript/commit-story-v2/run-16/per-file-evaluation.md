# Per-File Evaluation — Run-16

**Date**: 2026-05-11
**Branch**: spiny-orb/instrument-1778526749797
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/68
**Rubric**: post-PRD-#483/#505/#507/#508 rules (CDQ-008 deleted → CDQ-011; SCH-004/SCH-005 deleted; NDS-007 added blocking; SCH-001/SCH-002 unconditionally blocking)
**Files evaluated**: 30 (10 committed + 3 partial + 3 failed + 14 correct skips)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | No syntax validation failures in run output; all committed files passed `node --check` |
| ELISION | **PASS** | No elision events reported in run output |
| LINT | **PASS** | No Prettier lint failures reported |
| WEAVER | **PASS** | No schema validation failures reported |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api` declared as peerDependency in package.json (unchanged from prior runs) |
| CDQ-011 | **PASS** | All committed files use `trace.getTracer('commit-story')` — canonical tracer name per spiny-orb.yaml `tracerName` |

---

## Committed Files (10)

### 1. collectors/claude-collector.js (1 span, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — no catch blocks in collectChatMessages; early-return on null path, no exception handling |
| COV-001 | PASS — collectChatMessages (exported async) has span |
| COV-002 | N/A — no outbound HTTP/DB calls |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — `commit_story.context.collect_chat_messages` is a schema extension correctly declared |
| SCH-002 | PASS — no attribute extensions declared |
| SCH-003 | PASS |
| CDQ-001 | PASS — span closed in startActiveSpan callback |
| CDQ-005 | PASS |
| CDQ-011 | PASS |
| COV-004 | PASS — collectChatMessages is the only exported async function |
| COV-005 | PASS — `commit_story.context.sessions_count`, `commit_story.context.messages_count` set on early-return path |
| RST-001 | PASS — all sync helpers skipped |
| RST-004 | PASS |
| CDQ-007 | PASS — no nullable property accesses in setAttribute |

**Failures**: None

---

### 2. collectors/git-collector.js (1 span, 2 attempts)

Note: Run output showed 1 span and mentioned `get_previous_commit_time` and `get_commit_data` span names. Agent notes confirm "Function-level fallback: 1/1 functions instrumented: getPreviousCommitTime (1 spans)." getCommitData was referenced as a span name in agent notes but the file committed with 1 span total.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — no graceful-degradation catches in getPreviousCommitTime |
| COV-001 | PASS — getPreviousCommitTime (exported async) has span |
| COV-002 | N/A |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — `commit_story.git.get_previous_commit_time` is a schema extension |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-005 | PASS |
| CDQ-011 | PASS |
| COV-004 | PASS — exported async functions have spans |
| COV-005 | PASS — `vcs.ref.head.revision` from `commit.shortHash`; `commit_story.commit.message` from metadata.subject |
| RST-001 | PASS — runGit, getCommitMetadata, getCommitDiff, getMergeInfo (unexported helpers) skipped per RST-004 |
| RST-004 | PASS |
| CDQ-007 | PASS — `commit.author` and `commit.authorEmail` excluded per PII; commitRef (non-PII) included |

**Failures**: None

---

### 3. generators/summary-graph.js (6 spans, 3 attributes, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — inner catches in dailySummaryNode/weeklySummaryNode/monthlySummaryNode are all graceful-degradation (return fallback, no rethrow); outer span wrappers have separate error-recording catches for unexpected exceptions |
| COV-001 | PASS — all 6 exported async functions have spans |
| COV-002 | N/A |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — span names moved from `commit_story.ai.*` to `commit_story.summary.*` to avoid SCH-001 advisory for same-domain operations |
| SCH-002 | PASS — `commit_story.journal.entries_count`, `commit_story.journal.week_label`, `commit_story.journal.month_label` declared as schema extensions |
| SCH-003 | PASS — entries_count is int, week_label/month_label are strings |
| CDQ-001 | PASS |
| CDQ-005 | PASS |
| CDQ-011 | PASS |
| COV-004 | PASS — all 6 exported async entry points instrumented |
| COV-005 | PASS |
| COV-006 | PASS — manual spans wrap LangGraph node orchestration above auto-instrumented LangChain calls |
| RST-001 | PASS — sync helpers skipped |
| RST-004 | PASS |
| CDQ-007 | PASS — no nullable property accesses; `entries_count` on guaranteed arrays |

**Failures**: None

---

### 4. integrators/context-integrator.js (1 span, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — blank line within formatContextForPrompt (between sections.push() and for-loop) preserved |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — no catch blocks in gatherContextForCommit |
| COV-001 | PASS — gatherContextForCommit (exported async) has span |
| COV-002 | N/A |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — `commit_story.context.gather_for_commit` schema extension |
| SCH-002 | PASS — all attributes are registered keys |
| SCH-003 | PASS — `time_window_start/end` set via `.toISOString()` (string type) |
| CDQ-001 | PASS |
| CDQ-005 | PASS |
| CDQ-011 | PASS |
| COV-004 | PASS — gatherContextForCommit is the only exported async function |
| COV-005 | PASS — messages_count, sessions_count, filter counts, time window start/end all set |
| RST-001 | PASS — formatContextForPrompt, getContextSummary (sync) skipped |
| RST-004 | PASS |
| CDQ-007 | PASS — repoPath excluded (filesystem path, PII adjacent); commit.author excluded; commitRef (non-PII SHA) included as vcs.ref.head.revision; context.commit != null guard present |

**Failures**: None

---

### 5. mcp/server.js (1 span, 1 attribute, 1 attempt)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — process.exit(1) in .catch() at call site outside main(); RST-006 does not apply (process.exit only in outer catch, not in main() body); outer span wrapper catch handles unexpected exceptions |
| COV-001 | PASS — main() (unexported async entry point) has span per COV-001 override of RST-004 |
| COV-002 | N/A |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — `commit_story.mcp.start` schema extension |
| SCH-002 | PASS — `commit_story.mcp.transport` schema extension; 'stdio' value from StaticServerTransport |
| SCH-003 | PASS — transport is string |
| CDQ-001 | PASS |
| CDQ-005 | PASS |
| CDQ-011 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS — createServer (sync factory) skipped |
| RST-004 | PASS — createServer (unexported) skipped |
| CDQ-007 | PASS — transport value is hardcoded string, not a property access |

**Failures**: None

---

### 6. utils/journal-paths.js (1 span, 1 attempt)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — no catch blocks in ensureDirectory |
| COV-001 | PASS — ensureDirectory (exported async) has span |
| COV-002 | N/A |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` schema extension |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-005 | PASS |
| CDQ-011 | PASS |
| COV-004 | PASS — ensureDirectory is the only exported async function; getSummaryPath/getSummariesDirectory sync throws, RST-001 exempts them |
| COV-005 | PASS — `commit_story.journal.file_path` set from filePath parameter |
| RST-001 | PASS — all 11 sync helpers skipped |
| RST-004 | PASS |
| CDQ-007 | ADVISORY — raw `filePath` used (basename not imported; CDQ-007 import constraint applies) |

**Failures**: None

---

### 7. managers/journal-manager.js (2 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — inner catches in saveJournalEntry (file-not-found) and discoverReflections (unreadable file, missing dir) are graceful-degradation; outer span wrappers have error-recording catches for unexpected exceptions |
| COV-001 | PASS — saveJournalEntry, discoverReflections (exported async) both have spans |
| COV-002 | N/A |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.save_entry`, `commit_story.journal.discover_reflections` schema extensions |
| SCH-002 | PASS — `commit_story.journal.file_path` (registered), `vcs.ref.head.revision` (registered) |
| SCH-003 | PASS — shortHash is string |
| CDQ-001 | PASS |
| CDQ-005 | PASS |
| CDQ-011 | PASS |
| COV-004 | PASS — both exported async I/O functions have spans; 10 sync functions correctly skipped per RST-001 |
| COV-005 | PASS — file_path and vcs.ref.head.revision set |
| RST-001 | PASS |
| RST-004 | PASS |
| CDQ-007 | ADVISORY — raw `entryPath` used for `commit_story.journal.file_path` (basename not imported); `commit.author` and `commit.authorEmail` correctly excluded as PII |

**Failures**: None

---

### 8. commands/summarize.js (3 spans, 1 attribute, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — no catch blocks in runSummarize/runWeeklySummarize/runMonthlySummarize |
| COV-001 | PASS — runSummarize, runWeeklySummarize, runMonthlySummarize (exported async) all have spans |
| COV-002 | N/A |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — schema extensions declared; SCH-001 advisory for semantic similarity between run_weekly/monthly and run_summarize intentionally retained per agent note (distinct operation class) |
| SCH-002 | PASS — `commit_story.summarize.weeks_count` used for months input count (reuse per SCH-002 advisory about generated_count/months_count as semantic duplicates) |
| SCH-003 | PASS — weeks_count is int |
| CDQ-001 | PASS |
| CDQ-005 | PASS |
| CDQ-011 | PASS |
| COV-004 | PASS — 3 exported async entry points have spans; 4 sync functions (isValidDate, isValidWeekString, isValidMonthString, expandDateRange, parseSummarizeArgs, showSummarizeHelp) correctly skipped |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| CDQ-007 | PASS |

**Failures**: None

---

### 9. utils/summary-detector.js (9 spans, 1 attribute, 1 attempt) ★ PRIMARY GOAL

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — inner readdir try/catch blocks return empty collections on ENOENT; graceful-degradation (NDS-007 correct, no recordException in inner catches); outer span wrappers have error-recording catches for unexpected exceptions |
| COV-001 | PASS — getDaysWithEntries, getSummarizedDays, findUnsummarizedDays, getSummarizedWeeks, getDaysWithDailySummaries, findUnsummarizedWeeks, getSummarizedMonths, getWeeksWithWeeklySummaries, findUnsummarizedMonths all have spans |
| COV-002 | N/A |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — all 9 new span names are schema extensions correctly declared; no semantic-duplicate conflicts with registry |
| SCH-002 | PASS — `commit_story.journal.entries_count` (registered), `commit_story.journal.months_count` (new extension, follows naming convention) |
| SCH-003 | PASS — counts are integers |
| CDQ-001 | PASS |
| CDQ-005 | PASS |
| CDQ-011 | PASS |
| **COV-003** | **PASS** ★ — getDaysWithEntries and getDaysWithDailySummaries both have outer catch blocks with `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error`, consistent with findUnsummarizedDays/Weeks/Months in the same file. Primary goal of run-16 achieved. |
| COV-004 | PASS — getSummarizedDays/Weeks/Months and getWeeksWithWeeklySummaries are unexported but flagged by pre-scan for COV-004; all correctly instrumented |
| COV-005 | PASS — entries_count and months_count set where applicable |
| RST-001 | PASS — getTodayString, getNowDate (sync) skipped |
| RST-004 | PASS — unexported async functions instrumented per pre-scan COV-004 directive |
| CDQ-007 | PASS — no nullable property accesses in setAttribute |

**Failures**: None ★ COV-003 now passes for all 5 functions in this file

---

### 10. managers/auto-summarize.js (3 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — multi-line destructuring imports and multi-line array spreads in return objects preserved |
| NDS-004 | PASS — triggerAutoMonthlySummaries multi-line parameter signature preserved |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — inner for-loop catches in triggerAutoSummaries/Weekly/Monthly accumulate errors without rethrowing (graceful-degradation); no recordException in inner catches; outer span wrappers have error-recording catches |
| COV-001 | PASS — triggerAutoSummaries, triggerAutoWeeklySummaries, triggerAutoMonthlySummaries (exported async) all have spans |
| COV-002 | N/A |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — trigger_auto_summaries/weekly/monthly are distinct operation class (trigger/orchestration vs execution) from run_summarize/weekly/monthly; SCH-001 advisory intentionally retained |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-005 | PASS |
| CDQ-011 | PASS |
| COV-004 | PASS — all 3 exported async functions have spans; getErrorMessage (sync unexported) correctly skipped |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| CDQ-007 | PASS |

**Failures**: None

---

## Partial Files (3)

### 11. generators/journal-graph.js (3/4 node functions, 3 spans, 3 attempts)

technicalNode skipped (NDS-003 oscillation, error count 1→5 on fresh regeneration). Rubric evaluated on the 3 committed functions.

| Rule | Result |
|------|--------|
| NDS-003 | PASS (3 committed functions) |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — summaryNode, dialogueNode, generateJournalSections: existing catch blocks are all-encompassing graceful-degradation (Pattern A); no rethrow, no bypass path; outer error recording not needed when the entire function body is enclosed by a single all-encompassing catch |
| **COV-001** | **FAIL** — technicalNode (exported async, LangGraph node, calls model.invoke()) has no span. `generate_technical_decisions` span absent. |
| COV-002 | N/A |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — schema extensions declared for committed spans |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-005 | PASS |
| CDQ-011 | PASS |
| COV-004 | FAIL — technicalNode (exported async) has no span (NDS-003 oscillation skip) |
| COV-005 | PASS (committed functions) |
| COV-006 | PASS — manual spans wrap LangChain model.invoke() calls |
| RST-001 | PASS — 15 sync functions correctly skipped |
| RST-004 | PASS |
| CDQ-007 | PASS — context.commit != null guard in generateJournalSections |

**Canonical failures**: COV-001 (technicalNode has no span)

---

### 12. utils/commit-analyzer.js (0 spans, NDS-005 failure, 3 attempts)

File committed as partial with NDS-005 validator finding. Both functions are synchronous — 0 spans correct per RST-001. The NDS-005 failure is a function-level fallback bug (try/catch stripped from reassembly output) that affects the committed code.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| **NDS-005** | **FAIL** — function-level fallback stripped a try/catch block from the committed output. The validator detected this and flagged it; the file was committed as "partial results" meaning the committed code has a structural defect. An original try/catch is missing from at least one of the two functions. |
| NDS-006 | PASS |
| NDS-007 | N/A — no spans added, 0 instrumentation |
| COV-001 | N/A — both functions are synchronous utilities |
| COV-004 | N/A |
| RST-001 | PASS — isJournalEntriesOnlyCommit, shouldSkipMergeCommit are sync utilities, 0 spans correct |

**Canonical failures**: NDS-005 (try/catch stripped by function-level fallback bug)

---

### 13. managers/summary-manager.js (7/9 exported async functions, 7 spans, 2 attempts)

generateAndSaveWeeklySummary and generateAndSaveMonthlySummary skipped (null parsed_output). NDS-003 validator flagged "original line 155 missing/modified" but the return statement is present in the instrumented file at a different line number (likely line number drift from run-base to current main). 

| Rule | Result |
|------|--------|
| NDS-003 | ADVISORY — validator flagged "original line 155 missing/modified: return { saved: false, reason: `Summary already exists for ${dateStr}` };" but the instrumented file contains this return at a different line (187/221 due to span wrapper additions). Likely false positive from line number drift. The NDS-003 validator compared against instrument-time base; line numbers shifted between that base and current main. The structural early-return IS present in committed code. |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — inner catches (access() ENOENT, per-day readFile, readdir) are graceful-degradation; outer span wrappers have error-recording catches |
| **COV-001** | **FAIL** — generateAndSaveWeeklySummary and generateAndSaveMonthlySummary (both exported async) have no spans. Both are full pipeline entry points that invoke the summary-graph LLM pipeline. |
| COV-002 | N/A |
| API-001 | PASS |
| API-004 | PASS |
| SCH-001 | PASS — 7 schema extensions correctly declared; "already claimed" naming worked around correctly |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS (7 committed spans) |
| CDQ-005 | PASS |
| CDQ-011 | PASS |
| COV-004 | FAIL — generateAndSaveWeeklySummary and generateAndSaveMonthlySummary are exported async, no spans |
| COV-005 | PASS (committed functions) |
| RST-001 | PASS — 5 sync functions correctly skipped |
| RST-004 | PASS |
| CDQ-007 | ADVISORY — raw `summaryPath` used for `commit_story.journal.file_path` (basename not imported); null guards added to .length calls |

**Canonical failures**: COV-001 (2 exported async functions have no spans due to token exhaustion)

---

## Failed Files (3)

### 14. mcp/tools/context-capture-tool.js — FAILED

**Not evaluated for quality.** File was not committed. saveContext (unexported async I/O) has no instrumentation. See failure-deep-dives.md §context-capture-tool.js.

---

### 15. mcp/tools/reflection-tool.js — FAILED

**Not evaluated for quality.** File was not committed. saveReflection (unexported async I/O) has no instrumentation. See failure-deep-dives.md §reflection-tool.js.

---

### 16. src/index.js — FAILED

**Not evaluated for quality.** File was not committed due to API termination. See failure-deep-dives.md §index.js.

---

## Correct Skips (14)

All 14 files correctly determined to have no instrumentable functions (pre-scan, no LLM call):

| File | Skip Reason |
|------|------------|
| generators/prompts/guidelines/accessibility.js | Module-level constants only |
| generators/prompts/guidelines/anti-hallucination.js | Module-level constants only |
| generators/prompts/guidelines/index.js | Sync only |
| generators/prompts/sections/daily-summary-prompt.js | Sync only |
| generators/prompts/sections/dialogue-prompt.js | Module-level constants only |
| generators/prompts/sections/monthly-summary-prompt.js | Sync only |
| generators/prompts/sections/summary-prompt.js | Sync only |
| generators/prompts/sections/technical-decisions-prompt.js | Module-level constants only |
| generators/prompts/sections/weekly-summary-prompt.js | Sync only |
| integrators/filters/message-filter.js | Sync only |
| integrators/filters/sensitive-filter.js | Sync only |
| integrators/filters/token-filter.js | Sync only |
| traceloop-init.js | Top-level init, no functions |
| utils/config.js | Module-level init, no functions |

---

## Quality Failures Summary

| File | Rule | Dimension | Root Cause |
|------|------|-----------|------------|
| generators/journal-graph.js | COV-001 | Coverage | technicalNode: NDS-003 oscillation prevented span placement |
| managers/summary-manager.js | COV-001 | Coverage | generateAndSaveWeeklySummary + generateAndSaveMonthlySummary: token exhaustion (null parsed_output) |
| utils/commit-analyzer.js | NDS-005 | Non-destructiveness | Function-level fallback bug stripped try/catch block on 0-span file |

**Total canonical failures**: 3 across 3 files

**Primary goal**: ✅ COV-003 passes for all 5 spans in summary-detector.js (getDaysWithEntries and getDaysWithDailySummaries both have outer error-recording catches consistent with findUnsummarizedDays/Weeks/Months)
