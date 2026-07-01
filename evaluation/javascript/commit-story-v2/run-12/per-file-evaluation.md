# Per-File Evaluation — Run-12

**Date**: 2026-04-09
**Branch**: spiny-orb/instrument-1775717624848
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 30 (12 committed + 1 partial + 17 correct skips)

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
| API-002 | **PASS** | @opentelemetry/api in peerDependencies at ^1.9.0 |
| API-003 | **PASS** | No vendor-specific SDKs in dependencies |
| API-004 | **PASS** | No SDK-internal imports in src/ (devDependencies only) |
| CDQ-008 | **PASS** | All committed files use `trace.getTracer('commit-story')` consistently |

---

## Committed Files (12)

### 1. collectors/claude-collector.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS — collectChatMessages is the only exported async function; helpers are sync |
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
| CDQ-007 | PASS |

**Failures**: None

### 2. collectors/git-collector.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS — getPreviousCommitTime and getCommitData are the exported async functions; internal helpers are unexported |
| COV-005 | PASS — uses vcs.ref.head.revision, commit_story.commit.message, commit_story.commit.author |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS — Date converted via .toISOString() (string type) |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — timestamp guard: null early-return path ensures non-null before setAttribute |

**Failures**: None

### 3. commands/summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS — `force` declared as `type: boolean`, set as boolean via `!!options.force` |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None. SCH-003 boolean fix continues to hold.

### 4. generators/journal-graph.js (4 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS — 4 LangGraph node functions instrumented; pure sync helpers skipped per RST-001 |
| COV-005 | PASS |
| COV-006 | PASS — manual spans wrap application logic above auto-instrumented LangChain calls |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — gen_ai.usage.* attrs dropped to avoid CDQ-007/NDS-003 conflict (same as run-11) |

**Failures**: None. 3 attempts (regression from 2 in run-11); see failure-deep-dives.md.

### 5. generators/summary-graph.js (6 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — if-guards around array.length removed; agent notes JSDoc types guarantee arrays |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| COV-006 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS — entries_count is int, week_label/month_label are strings |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — no optional chaining in setAttribute; direct property access on guaranteed arrays |

**Failures**: None. CDQ-001 redundant span.end() pattern from run-11 not observed this run — appears resolved.

### 6. index.js (1 span, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — advisory NDS-005 is a false positive; inner auto-summarize try/catch preserved at line 505 (was 490 in original) |
| COV-001 | PASS — main() entry point has span |
| COV-003 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS — explicit span.end() before process.exit() is necessary (bypasses finally) |
| CDQ-002 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — dropped messages_count to avoid CDQ-007/NDS-003 truthy-check conflict (same as run-11) |

**Failures**: None. NDS-005 advisory is a false positive — the auto-summarize try/catch at the original line 490 is preserved at line 505 in the instrumented version; the judge confused restructuring within startActiveSpan with control flow removal.

### 7. integrators/context-integrator.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS — uses commit_story.filter.messages_before/after, commit_story.context.time_window_start/end |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS — Date objects converted via .toISOString() |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

### 8. managers/auto-summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS — force set via `!!options.force` (boolean coercion) |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

### 9. managers/journal-manager.js (2 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — truthy guards removed to satisfy validator; unconditional setAttribute accepted as NDS-003-compliant |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
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
| CDQ-007 | **FAIL** — `span.setAttribute('vcs.ref.head.revision', commit.hash)` and `span.setAttribute('commit_story.commit.author', commit.author)` set unconditionally; agent notes these "may produce undefined values if those fields are absent on the commit object." CDQ-007 explicitly flags unconditional setAttribute from nullable/optional fields without a defined-value guard. |

**Failures**: CDQ-007 — unconditional setAttribute from commit.hash and commit.author (nullable fields, guards removed to satisfy NDS-003 truthy-check gap)

### 10. managers/summary-manager.js (3 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — 3 pipeline orchestrators have spans |
| COV-003 | PASS |
| COV-004 | **FAIL** — 6 exported async I/O functions have no spans: readDayEntries, saveDailySummary, readWeekDailySummaries, saveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary. All are exported, all are async, all perform filesystem I/O. RST-004 exemption applies only to unexported functions; these are part of the public API. The agent's "context propagation" reasoning does not satisfy the COV-004 requirement to verify each async function has a span. |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS — force set via `!!options.force` (boolean) |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: COV-004 — 6 exported async I/O functions without spans (regression from run-11's 9-span approach)

### 11. mcp/server.js (1 span, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — main() entry point instrumented despite being unexported (COV-001 overrides RST-004 for entry points) |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS — commit_story.mcp.server_name and commit_story.mcp.server_version capture server identity |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS — service.name/version correctly replaced with project-namespaced keys not in standard registry |
| SCH-003 | PASS |
| SCH-004 | PASS — SCH-004 advisory claiming commit_story.mcp.server_name duplicates gen_ai.provider.name is a false positive; server_name captures MCP server identity ('commit-story'), not the AI provider |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

### 12. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS — ensureDirectory is the only exported async function; all others are pure sync |
| COV-005 | PASS — commit_story.journal.file_path captures the directory path argument |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

---

## Partial File (1)

### utils/summary-detector.js (3/5 functions, 3 spans)

2 functions skipped due to Anthropic API overload (getDaysWithEntries, findUnsummarizedDays). Rubric evaluated only on the 3 instrumented functions per run-12 methodology.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — 3 instrumented functions have entry-point spans |
| COV-003 | PASS |
| COV-004 | PASS (for 3 instrumented functions) — 2 skipped due to infrastructure outage, not agent decision; getSummarizedDays/Weeks/Months/getWeeksWithWeeklySummaries are unexported helpers, RST-004 applies |
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
| CDQ-007 | PASS |

**Failures**: None (infrastructure partial, not quality failure)

---

## Correct Skips (17)

All sync-only or constant-export files — same set as runs 9-11:

| File | Skip Reason |
|------|------------|
| generators/prompts/guidelines/accessibility.js | Module-level constant only, no functions |
| generators/prompts/guidelines/anti-hallucination.js | Module-level constant only, no functions |
| generators/prompts/guidelines/index.js | Synchronous only (getAllGuidelines) |
| generators/prompts/sections/daily-summary-prompt.js | Synchronous only (dailySummaryPrompt) |
| generators/prompts/sections/dialogue-prompt.js | Module-level constant only, no functions |
| generators/prompts/sections/monthly-summary-prompt.js | Synchronous only (monthlySummaryPrompt) |
| generators/prompts/sections/summary-prompt.js | Synchronous only (summaryPrompt) |
| generators/prompts/sections/technical-decisions-prompt.js | Module-level constant only, no functions |
| generators/prompts/sections/weekly-summary-prompt.js | Synchronous only (weeklySummaryPrompt) |
| integrators/filters/message-filter.js | Synchronous only |
| integrators/filters/sensitive-filter.js | Synchronous only |
| integrators/filters/token-filter.js | Synchronous only |
| mcp/tools/context-capture-tool.js | Exported function synchronous (registerContextCaptureTool); saveContext is unexported async |
| mcp/tools/reflection-tool.js | Exported function synchronous (registerReflectionTool); saveReflection is unexported async |
| traceloop-init.js | Top-level init code only, no functions |
| utils/commit-analyzer.js | Synchronous only |
| utils/config.js | Module-level init only, no functions |

**Note on context-capture-tool.js and reflection-tool.js**: Both contain unexported async functions (saveContext, saveReflection) that perform filesystem I/O. RST-004 exemption allows spans on unexported I/O functions, but does not require them. The COV-004 advisory flagging these as missing spans is advisory — the skip classification is defensible since the exported API is synchronous. However, future runs may benefit from instrumenting the internal async helpers given their I/O nature.

---

## Quality Failures Summary

| File | Rule | Dimension |
|------|------|-----------|
| managers/journal-manager.js | CDQ-007 | Code Quality |
| managers/summary-manager.js | COV-004 | Coverage |

**Total canonical failures**: 2 (CDQ-007 and COV-004)
