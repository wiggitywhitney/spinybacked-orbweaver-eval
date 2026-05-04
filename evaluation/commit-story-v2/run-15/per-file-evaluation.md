# Per-File Evaluation — Run-15

**Date**: 2026-05-03
**Branch**: spiny-orb/instrument-1777850275841
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 30 (14 committed + 0 partial + 16 correct skips)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check` exits 0 on all 14 instrumented files |
| NDS-002 (Tests) | **PASS** | 564 tests pass, 1 skipped (acceptance gate, no API key) |
| NDS-003 (Non-instrumentation unchanged) | **PASS** | All agent notes describe instrumentation additions only; no business logic changes observed |
| API-001 (Only @opentelemetry/api imports) | **PASS** | All agent-added imports are from `@opentelemetry/api` only, across all 14 files |
| NDS-006 (Module system consistency) | **PASS** | commit-story-v2 is ESM; all 14 instrumented files use ESM import/export |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api` in peerDependencies at `^1.9.0` |
| API-003 | **N/A** | Rule deleted per PRD #483 |
| API-004 | **PASS** | SDK packages only in devDependencies; no agent-modified source file imports from `@opentelemetry/sdk-*` or similar |
| CDQ-011 (Canonical Tracer Name) | **PASS** | Registry manifest `name: commit_story` → canonical tracer `commit-story`; all 14 committed files use `trace.getTracer('commit-story')` |

---

## Committed Files (14)

### 1. collectors/claude-collector.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — collectChatMessages entry point has span (`commit_story.context.collect_chat_messages`) |
| COV-003 | PASS |
| COV-004 | PASS — collectChatMessages is the only exported async function; helpers are sync |
| COV-005 | PASS — 5 registered attributes set on the span |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — span name follows `commit_story.<category>.<operation>` naming pattern |
| SCH-002 | PASS — all attributes are registered in schema |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

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
| COV-001 | PASS — getPreviousCommitTime and getCommitData both have entry-point spans |
| COV-003 | PASS |
| COV-004 | PASS — getPreviousCommitTime and getCommitData are the exported async functions; internal helpers are unexported |
| COV-005 | PASS — uses vcs.ref.head.revision, commit_story.commit.message, commit_story.commit.timestamp |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — span names follow `commit_story.<category>.<operation>` pattern |
| SCH-002 | PASS — all three attributes are registered |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — commit_story.commit.author omitted per CDQ-007 PII guidance; no nullable fields set unconditionally |

**Failures**: None

---

### 3. commands/summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — runSummarize, runWeeklySummarize, runMonthlySummarize all have entry-point spans |
| COV-003 | PASS — loop body catches are graceful-degradation (return degraded state, no rethrow); exempted from error-recording requirement per Decision D1 |
| COV-004 | PASS |
| COV-005 | PASS — 6 attributes under commit_story.summarize.* namespace |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — span names follow `commit_story.<category>.<operation>` pattern |
| SCH-002 | **ADVISORY** — commit_story.summarize.force and the 6 summarize count attributes are invented (not in registry); keys follow the namespace convention but are extensions; not a blocking failure since registry extension is expected |
| SCH-003 | PASS — force declared as boolean type, set via `!!options.force` |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None. SCH-002 advisory noted for invented attributes.

---

### 4. generators/journal-graph.js (4 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — generateJournalSections entry point has span; 3 LangGraph node functions instrumented |
| COV-003 | PASS — summaryNode, technicalNode, dialogueNode catches are graceful-degradation (return degraded state, no rethrow); exempted from error-recording requirement per Decision D1; only generateJournalSections has error-propagating catch with recordException + setStatus |
| COV-004 | PASS — 4 LangGraph node functions instrumented; pure sync helpers skipped per RST-001 |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — span names follow `commit_story.<category>.<operation>` pattern |
| SCH-002 | PASS — 0 attributes set; no invented attribute keys |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None. Run-15 completed in 1 attempt (breakthrough vs 3 attempts in runs 12-14); COV-003 applied correctly to all three graceful-degradation nodes.

---

### 5. generators/summary-graph.js (6 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — entry-point functions have spans |
| COV-003 | PASS — dailySummaryNode, weeklySummaryNode, monthlySummaryNode catches are graceful-degradation; exempted per Decision D1; result.id accesses guarded with `if (result != null)` block |
| COV-004 | PASS |
| COV-005 | PASS — commit_story.summary.entries_count attribute set |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — span names follow `commit_story.<category>.<operation>` pattern |
| SCH-002 | PASS — entries_count is a registered attribute |
| SCH-003 | PASS — entries_count is int type |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — no optional chaining in setAttribute; result.id access guarded by null check |

**Failures**: None. 2 attempts (attribute key dedup resolved on attempt 2).

---

### 6. index.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — main() entry point instrumented with span `commit_story.cli.run` |
| COV-003 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — span name follows `commit_story.<category>.<operation>` pattern |
| SCH-002 | PASS — 0 attributes set; no invented attribute keys |
| SCH-003 | PASS |
| CDQ-001 | **FAIL** — span.end() placed in finally block, but multiple process.exit() calls at lines 385, 403, 412, 417, 429, 454, 529 inside the startActiveSpan callback bypass the finally block entirely; span leaks in all process.exit() code paths; agent documented this as "Known limitation" but did not resolve it |
| CDQ-002 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: CDQ-001 — process.exit() calls inside startActiveSpan callback bypass the finally block where span.end() lives; spans not closed in all code paths.

---

### 7. integrators/context-integrator.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — gatherContextForCommit entry point has span |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS — registered filter attributes set (commit_story.filter.messages_before/after, commit_story.context.time_window_start/end) |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — span name follows `commit_story.<category>.<operation>` pattern |
| SCH-002 | PASS — all attributes are registered |
| SCH-003 | PASS — Date objects converted via .toISOString() |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — commit_story.context.author omitted per CDQ-007 PII guidance |

**Failures**: None

---

### 8. managers/auto-summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — triggerAutoSummaries, triggerAutoWeeklySummaries, triggerAutoMonthlySummaries all have entry-point spans |
| COV-003 | PASS — inner loop catches are graceful-degradation; exempted per Decision D1 |
| COV-004 | PASS |
| COV-005 | PASS — all attributes are registered from prior run; 0 new inventions |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — span names follow `commit_story.<category>.<operation>` pattern |
| SCH-002 | PASS — attributes registered in schema |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

---

### 9. managers/journal-manager.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — saveJournalEntry and discoverReflections both have entry-point spans |
| COV-003 | PASS — inner catches are graceful-degradation; exempted per Decision D1 |
| COV-004 | PASS |
| COV-005 | PASS — commit_story.journal.file_path attribute set |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — span names commit_story.journal.save_entry and commit_story.journal.discover_reflections follow naming pattern |
| SCH-002 | PASS — commit_story.journal.file_path is registered |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | **ADVISORY** — raw file path used for commit_story.journal.file_path (basename not imported); attribute key is registered and limitation is documented by agent; CDQ-007 advisory (not a blocking failure since it is a documentation limitation, not a nullable/undefined setAttribute) |

**Failures**: None. CDQ-007 advisory noted: raw path used rather than basename — same documented limitation as journal-paths.js.

---

### 10. managers/summary-manager.js (9 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — all 9 exported async functions have entry-point spans |
| COV-003 | PASS — inner catches are graceful-degradation; exempted per Decision D1 |
| COV-004 | PASS — all 9 exported async I/O functions instrumented: readDayEntries, saveDailySummary, readWeekDailySummaries, saveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary, plus 3 pipeline orchestrators; COV-004 failure from runs 12-14 resolved |
| COV-005 | PASS — commit_story.journal.entry_date registered attribute used |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — span names follow `commit_story.<category>.<operation>` pattern |
| SCH-002 | PASS — commit_story.journal.entry_date is registered; no invented attribute keys |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — file path attributes intentionally omitted (basename not imported); no nullable fields set unconditionally |

**Failures**: None. COV-004 resolved after 3 consecutive run failures (runs 12-14); all 9 exported async I/O functions now instrumented in 1 attempt.

---

### 11. mcp/server.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — main() entry point instrumented with span commit_story.mcp.server_start; COV-001 overrides RST-004 for entry points |
| COV-003 | PASS |
| COV-004 | PASS — main() is the sole entry point; no other exported async functions |
| COV-005 | PASS — commit_story.mcp.transport_type attribute captures transport identity |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — commit_story.mcp.server_start follows `commit_story.<category>.<operation>` pattern |
| SCH-002 | **ADVISORY** — commit_story.mcp.transport_type is invented (not in registry); follows namespace convention; advisory only, not a blocking failure |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None. SCH-002 advisory noted for invented commit_story.mcp.transport_type attribute. First time this file was committed.

---

### 12. mcp/tools/context-capture-tool.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — commit_story.context.save_context span on async operation |
| COV-003 | PASS — anonymous async callback catch is graceful-degradation (returns degraded state, no rethrow); exempted per Decision D1 |
| COV-004 | PASS |
| COV-005 | PASS — registered commit_story.journal.file_path attribute used |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — commit_story.context.save_context follows `commit_story.<category>.<operation>` pattern |
| SCH-002 | PASS — commit_story.journal.file_path is a registered attribute |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None. First time this file was committed.

---

### 13. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — ensureDirectory entry point has span commit_story.journal.ensure_directory |
| COV-003 | PASS |
| COV-004 | PASS — ensureDirectory is the only exported async function; all others are pure sync |
| COV-005 | PASS — registered commit_story.journal.file_path attribute captures the directory path argument |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — commit_story.journal.ensure_directory follows `commit_story.<category>.<operation>` pattern |
| SCH-002 | PASS — commit_story.journal.file_path is registered |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | **ADVISORY** — raw path used for commit_story.journal.file_path (basename not imported); same documented limitation as journal-manager.js; attribute key is registered; not a blocking CDQ-007 failure |

**Failures**: None. CDQ-007 advisory noted: raw path used rather than basename.

---

### 14. utils/summary-detector.js (5 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — all 5 exported async functions have entry-point spans: getDaysWithEntries, findUnsummarizedDays, getDaysWithDailySummaries, findUnsummarizedWeeks, findUnsummarizedMonths |
| COV-003 | **FAIL** — getDaysWithEntries and getDaysWithDailySummaries have try/finally with NO outer catch block; unexpected errors propagate completely unrecorded (span has no catch, only finally); this is not a graceful-degradation pattern (no catch returning degraded state) — it is a missing catch entirely; findUnsummarizedDays, findUnsummarizedWeeks, findUnsummarizedMonths have correct outer catch with recordException + setStatus; inconsistency within the same file |
| COV-004 | PASS — all 5 exported async functions have spans |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — all 5 span names follow `commit_story.<category>.<operation>` pattern: get_days_with_entries, find_unsummarized_days, get_days_with_daily_summaries, find_unsummarized_weeks, find_unsummarized_months |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: COV-003 — getDaysWithEntries and getDaysWithDailySummaries have only try/finally, no outer catch; unexpected errors propagate unrecorded. Distinct from the graceful-degradation exemption (Decision D1): those files have a catch that returns degraded state; here there is no catch at all. CodeRabbit flagged this finding; the inconsistency with findUnsummarizedDays/Weeks/Months in the same file confirms this is a quality gap, not an intentional design choice.

---

## Correct Skips (16)

All sync-only or constant-export files — same set as runs 12-14 plus reflection-tool.js:

| File | Skip Reason |
|------|------------|
| generators/prompts/guidelines/accessibility.js | Module-level constant only, no functions |
| generators/prompts/guidelines/anti-hallucination.js | Module-level constant only, no functions |
| generators/prompts/sections/daily-summary-prompt.js | Synchronous only (dailySummaryPrompt) |
| generators/prompts/sections/dialogue-prompt.js | Module-level constant only, no functions |
| generators/prompts/sections/monthly-summary-prompt.js | Synchronous only (monthlySummaryPrompt) |
| generators/prompts/sections/summary-prompt.js | Synchronous only (summaryPrompt) |
| generators/prompts/sections/technical-decisions-prompt.js | Module-level constant only, no functions |
| generators/prompts/sections/weekly-summary-prompt.js | Synchronous only (weeklySummaryPrompt) |
| generators/prompts/guidelines/index.js | Synchronous only (getAllGuidelines) |
| integrators/filters/message-filter.js | Synchronous only |
| integrators/filters/sensitive-filter.js | Synchronous only |
| integrators/filters/token-filter.js | Synchronous only |
| mcp/tools/reflection-tool.js | Exported function synchronous (registerReflectionTool); saveReflection is unexported async — RST-004 exemption applies; 2 attempts taken (see failure-deep-dives.md) |
| traceloop-init.js | Top-level init code only, no functions |
| utils/commit-analyzer.js | Synchronous only |
| utils/config.js | Module-level init only, no functions |

**Note on reflection-tool.js**: Contains unexported async saveReflection that the PR advisory flagged with COV-004. RST-004 exemption allows (but does not require) spans on unexported I/O functions. The skip classification is defensible since the exported API is synchronous. The 2-attempt, 3.6K output anomaly suggests the agent may have attempted instrumentation on the first pass before correctly concluding no spans were needed on the second. No committed output affected.

---

## Quality Failures Summary

| File | Rule | Dimension | Description |
|------|------|-----------|-------------|
| index.js | CDQ-001 | Code Quality | Multiple process.exit() calls inside startActiveSpan callback bypass finally block; span.end() never called in process.exit() paths |
| utils/summary-detector.js | COV-003 | Coverage | getDaysWithEntries and getDaysWithDailySummaries have try/finally with no outer catch; unexpected errors propagate unrecorded |

**Total canonical failures**: 2 (CDQ-001, COV-003)

**Advisory findings** (not blocking failures):

| File | Rule | Description |
|------|------|-------------|
| commands/summarize.js | SCH-002 | Invented attributes under commit_story.summarize.* not in registry |
| mcp/server.js | SCH-002 | commit_story.mcp.transport_type invented, not in registry |
| managers/journal-manager.js | CDQ-007 | Raw file path used for commit_story.journal.file_path (basename not imported) |
| utils/journal-paths.js | CDQ-007 | Raw file path used for commit_story.journal.file_path (basename not imported) |
