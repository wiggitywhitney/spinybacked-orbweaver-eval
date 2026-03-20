# Per-File Evaluation — Run-6

**Branch**: `spiny-orb/instrument-1773996478550`
**Evaluator**: claude-opus-4
**Canonical source**: `per-file-evaluation.json`

---

## Run-6 Summary

| Metric | Run-5 | Run-6 | Delta |
|--------|-------|-------|-------|
| **Canonical score** | 23/25 (92%) | 21/25 (84%) | **-8pp** |
| **Files committed** | 9 | 5 | **-4** |
| **Spans committed** | 17 | 9 | -8 |
| Tests passed | 534/534 | 534/534 | — |
| Files partial | 6 | 6 | 0 |
| Files zero-span | 12 | 18 | +6 |
| Files failed | 2 | 0 | -2 |

**Both quality AND coverage regressed.** Run-5 traded coverage for quality. Run-6 was supposed to recover coverage while retaining quality — instead, both dropped due to SCH-001 emerging as the new dominant blocker.

---

## Gate Checks (5/5 pass)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-001 | **PASS** | 534/534 tests pass |
| NDS-002 | **PASS** | 22 test files, all pass without modification |
| NDS-003 | **PASS** | All 5 committed files: diff contains only instrumentation additions |
| API-001 | **PASS** | All imports from `@opentelemetry/api` only |
| NDS-006 | **PASS** | All files use ESM `import`/`export` |

## Per-Run Rules (4/4 pass)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api` in `peerDependencies` (correct for library) |
| API-003 | **PASS** | No vendor-specific SDKs |
| API-004 | **PASS** | No SDK-internal imports |
| CDQ-008 | **PASS** | All files: `trace.getTracer('commit-story')` |

---

## Per-File Evaluations — Committed Files

### 1. src/collectors/claude-collector.js — All rules pass

**Status**: Committed (1 span) | **Schema coverage**: Covered

| Rule | Result | Key Evidence |
|------|--------|-------------|
| NDS-004 | PASS | `collectChatMessages` signature unchanged |
| NDS-005 | PASS | Agent-added catch re-throws; no pre-existing error handling |
| COV-002 | PASS | Span wraps file I/O operations |
| COV-003 | PASS | recordException + setStatus(ERROR) + throw |
| COV-004 | PASS | Async function with span |
| COV-005 | PASS | 5 registry attributes: source, time_window_start/end, sessions_count, messages_count |
| RST-001 | PASS | Only orchestrating function instrumented; helpers skipped |
| RST-004 | PASS | Instrumented function is exported |
| SCH-001 | **PASS** | `commit_story.context.collect_chat_messages` — semantically correct for this file |
| SCH-002 | PASS | All 5 attribute keys match registry |
| SCH-003 | PASS | Enum, ISO 8601, and integer types correct |
| CDQ-001 | PASS | startActiveSpan + finally { span.end() } |
| CDQ-003 | PASS | Standard error recording pattern |
| CDQ-005 | PASS | startActiveSpan callback preserves async context |
| CDQ-006 | PASS | All attribute computations cheap |
| CDQ-007 | PASS | All attributes bounded, no PII |

**Best-instrumented file in run-6.** Semantically correct span name, excellent attribute coverage, proper error handling. This file demonstrates what the agent can do when the registry has the right span definition.

---

### 2. src/collectors/git-collector.js — 2 failures (RST-004, SCH-001)

**Status**: Committed (3 spans) | **Schema coverage**: Uncovered

| Rule | Result | Key Evidence |
|------|--------|-------------|
| NDS-004 | PASS | Exported getCommitData unchanged, getPreviousCommitTime signature preserved |
| NDS-005 | PASS | Agent-added catches re-throw; error propagation preserved |
| COV-002 | PASS | Git subprocess calls have spans |
| COV-003 | PASS | Standard error recording pattern |
| COV-004 | PASS | All 3 async functions have spans |
| COV-005 | PASS | `vcs.ref.head.revision` — standard OTel attribute, semantically appropriate |
| RST-001 | PASS | runGit and getCommitMetadata correctly skipped |
| RST-004 | **FAIL** | `getCommitDiff` (line 79) and `getMergeInfo` (line 115) are **unexported** — explicitly listed in rubric-codebase mapping as RST-004 violations. Internal to `getCommitData`. |
| SCH-001 | **FAIL** | All 3 spans named `commit_story.context.collect_chat_messages`. Git operations are NOT chat message collection. Expected: `commit_story.collect_git`, `commit_story.git_diff`, `commit_story.git_merge_info`. |
| SCH-002 | PASS | `vcs.ref.head.revision` is standard OTel, referenced in registry |
| SCH-003 | PASS | Commit ref is string type |
| CDQ-001 | PASS | startActiveSpan + finally { span.end() } |
| CDQ-003 | PASS | Standard error recording in all 3 functions |
| CDQ-005 | PASS | startActiveSpan callback |

**RST-004 finding**: Agent instrumented internal functions instead of the exported `getCommitData` orchestrator. The child spans cover the operations, but the public API function has no span.

**SCH-001 finding**: Agent chose validation compliance over semantic accuracy. The span names pass the validator's strict registry check but mislead any human reading the traces.

---

### 3. src/integrators/context-integrator.js — 1 failure (SCH-001)

**Status**: Committed (1 span) | **Schema coverage**: Mixed

| Rule | Result | Key Evidence |
|------|--------|-------------|
| NDS-004 | PASS | `gatherContextForCommit` signature unchanged |
| NDS-005 | PASS | No pre-existing try/catch; agent-added catch re-throws |
| COV-002 | PASS | Span wraps calls to collectors, filters, and budget functions |
| COV-003 | PASS | Standard error recording pattern |
| COV-004 | PASS | Async function with span |
| COV-005 | PASS | **8 attributes** — best coverage: vcs.ref.head.revision, commit_story.commit.author, filter.messages_before/after, context.messages_count/sessions_count/time_window_start/end |
| RST-001 | PASS | Only main orchestrator instrumented |
| RST-004 | PASS | Instrumented function is exported |
| SCH-001 | **FAIL** | `commit_story.context.collect_chat_messages` for a multi-source context integration function. Expected: `commit_story.gather_context` or `commit_story.integrate_context`. "Context" prefix partially correct but "collect_chat_messages" too narrow. |
| SCH-002 | PASS | All 8 attribute keys match registry |
| SCH-003 | PASS | All types correct (ISO 8601, integers, strings) |
| CDQ-001 | PASS | startActiveSpan + finally |
| CDQ-003 | PASS | Standard pattern |

**Excellent attribute coverage** (8 attributes from registry). The only issue is the span name — forced by the single-span registry.

---

### 4. src/managers/summary-manager.js — 1 failure (SCH-001) + superficial resolution verified

**Status**: Committed (3 spans) | **Schema coverage**: Uncovered | **Recovered from run-5 partial**

| Rule | Result | Key Evidence |
|------|--------|-------------|
| NDS-004 | PASS | All 3 generate-and-save signatures unchanged |
| NDS-005 | PASS | Inner expected-condition catches (file existence) preserved WITHOUT error recording. Outer catch re-throws genuine errors. |
| COV-002 | PASS | Spans wrap LLM calls and file I/O |
| COV-003 | PASS | Outer catch has error recording; inner expected-condition catches correctly excluded |
| COV-004 | PASS | All 3 async functions have spans |
| COV-005 | PASS | `commit_story.journal.entry_date` and `commit_story.journal.file_path` from registry |
| RST-001 | PASS | Only orchestrators instrumented; helpers (readDayEntries, formatDailySummary, etc.) skipped |
| RST-004 | PASS | All 3 functions are exported |
| SCH-001 | **FAIL** | All 3 spans named `commit_story.context.collect_chat_messages`. These are summary generation operations. Expected: `commit_story.generate_daily_summary`, etc. |
| SCH-002 | PASS | Both attribute keys match registry |
| SCH-003 | PASS | Date string and file path types correct |
| CDQ-001 | PASS | startActiveSpan + finally; early returns inside try block |
| CDQ-003 | PASS | Standard error recording on genuine errors; expected-condition catches excluded |

**Superficial Resolution Verification** (recovered from run-5 partial):

| Rule | Run-5 Status | Run-6 Status | Assessment |
|------|-------------|-------------|------------|
| NDS-005 | Latent (8 violations in partial files) | **PASS** | Genuinely resolved — expected-condition catches have NO recordException |
| CDQ-003 | Latent (in partial files) | **PASS** | Genuinely resolved — recordException only on genuine errors |
| RST-001 | Correct skip, monitor | **PASS** | Genuinely resolved — only orchestrators instrumented |

**This is the only file that recovered from partial→committed.** The DEEP-1 and DEEP-4 fixes worked for this file. All three superficial resolutions are now genuine.

---

### 5. src/mcp/server.js — 2 failures (COV-005, SCH-001)

**Status**: Committed (1 span) | **Schema coverage**: Uncovered

| Rule | Result | Key Evidence |
|------|--------|-------------|
| NDS-004 | PASS | createServer() unchanged; main() signature preserved |
| NDS-005 | PASS | No pre-existing try/catch; agent-added catch re-throws |
| COV-001 | PASS | MCP server entry point has a span |
| COV-002 | PASS | Span wraps createServer + connect calls |
| COV-003 | PASS | Standard error recording pattern |
| COV-004 | PASS | Async function with span |
| COV-005 | **FAIL** | **Zero attributes** on span. No service.name, transport type, version, or any domain attributes. |
| RST-001 | PASS | Only main() instrumented; createServer helper skipped |
| RST-004 | PASS | main() is module-level entry point |
| SCH-001 | **FAIL** | `commit_story.context.collect_chat_messages` for MCP server startup. Most semantically incorrect usage. Expected: `commit_story.mcp_server` or `commit_story.mcp.main`. |
| CDQ-001 | PASS | startActiveSpan + finally |
| CDQ-003 | PASS | Standard pattern |

**Weakest committed file.** Zero attributes and worst span name mismatch. The span covers the right function but carries no useful information in the trace.

---

## Entry Point Evaluation — COV-001

| Entry Point | Status | Span? | Result |
|-------------|--------|-------|--------|
| src/index.js (CLI main) | 0 spans (3 attempts, 70K tokens) | No | **FAIL** (3rd consecutive) |
| src/mcp/server.js (MCP server) | Committed | Yes | **PASS** |

**COV-001 overall: FAIL** — The primary CLI entry point has no span. Persistent across runs 4, 5, 6.

**Run-6 improvement**: No oscillation (RUN-1 fix working). Failure mode changed from oscillation to consistent validation rejection. Two interacting blockers:
1. **COV-003 boundary gap**: Swallow-and-continue catch pattern (triggerAutoSummaries) not covered by DEEP-1 fix
2. **SCH-001 registry gap**: Agent correctly invented `commit_story.cli.main` but validator rejected it

---

## Zero-Span File Verification

### Correct Skips (14 files)

| File | Reason |
|------|--------|
| 9 prompt/guideline files | Pure data exports — no I/O, no significant operations |
| config.js | Synchronous config getter |
| message-filter.js | Synchronous filtering (pure functions) |
| token-filter.js | Synchronous filtering (pure functions) |
| sensitive-filter.js | Synchronous filtering — run-5 partial correctly reclassified via pre-screening (#212) |
| commit-analyzer.js | All synchronous functions — run-5 over-instrumented; run-6 correct |

### Debatable Skips (3 files)

| File | Run-5 | Run-6 | Issue |
|------|-------|-------|-------|
| context-capture-tool.js | Committed (1 span) | 0 spans | RST-004 vs COV-004 tension — exported function is sync, async `saveContext` is unexported |
| reflection-tool.js | Committed (1 span) | 0 spans | Same pattern — RST-004 vs COV-004 tension |
| journal-paths.js | Committed | 0 spans | Agent tried instrumentation, SCH-001 rejected. Correct to refuse misusing registered name. |

### Soft Failures (1 file)

| File | Issue |
|------|-------|
| **index.js** | NOT a correct skip. Agent attempted instrumentation but COV-003 + SCH-001 blocked. **COV-001 FAIL.** |

---

## Partial File Summary

All 6 partial files are NOT committed — no source code changes on branch. NDS evaluation: PASS for all (no changes to evaluate).

| File | Functions | Blocked By | Dominant Blocker |
|------|-----------|-----------|------------------|
| summarize.js | 7/8 | COV-003 (per-item catch), SCH-001 | SCH-001 |
| journal-graph.js | 10/12 | SCH-001, NDS-003 | SCH-001 |
| summary-graph.js | 13/15 | SCH-001 (oscillation detected), COV-003 | SCH-001 |
| auto-summarize.js | 1/3 | NDS-003, COV-003, SCH-001, SCH-002 | SCH-001 |
| journal-manager.js | 9/10 | SCH-001 (sole blocker for saveJournalEntry) | SCH-001 |
| summary-detector.js | 5/11 | COV-003, SCH-001, NDS-003, SCH-002 | SCH-001 |

**SCH-001 appears in ALL 6 partial files.** It is the universal blocker.

---

## Dimension Scores

| Dimension | Rules | Pass | Fail | N/A | Score | Run-5 |
|-----------|-------|------|------|-----|-------|-------|
| **NDS** | NDS-004, NDS-005 | 2 | 0 | 0 | **2/2 (100%)** | 2/2 (100%) |
| **COV** | COV-001–006 | 3 | 2 | 1 | **3/5 (60%)** | 3/5 (60%) |
| **RST** | RST-001–005 | 3 | 1 | 1 | **3/4 (75%)** | 4/4 (100%) |
| **API** | API-002–004 | 3 | 0 | 0 | **3/3 (100%)** | 3/3 (100%) |
| **SCH** | SCH-001–004 | 3 | 1 | 0 | **3/4 (75%)** | 4/4 (100%) |
| **CDQ** | CDQ-001–008 | 7 | 0 | 0 | **7/7 (100%)** | 7/7 (100%) |
| **Total** | | **21** | **4** | **2** | **21/25 (84%)** | **23/25 (92%)** |

### New Failures in Run-6

| Rule | Classification | Root Cause |
|------|---------------|------------|
| RST-004 | New regression | Agent instrumented unexported getCommitDiff and getMergeInfo instead of exported getCommitData |
| SCH-001 | Systemic new | Single-span registry (1 definition) forced 4/5 files to misuse `commit_story.context.collect_chat_messages`. Validator-evaluator conflict: validator enforces strict registry conformance; evaluator checks naming quality. |

### Persistent Failures

| Rule | Runs Open | Root Cause |
|------|-----------|------------|
| COV-001 | 3 (runs 4-6) | index.js entry point blocked by COV-003 boundary gap + SCH-001 registry gap |
| COV-005 | 2 (runs 5-6) | server.js has zero attributes on span |

---

## Systemic Analysis: SCH-001 as Dominant Blocker

**The single-span registry is the root cause of the run-6 regression.**

The Weaver registry defines exactly 1 span: `commit_story.context.collect_chat_messages`. The validator enforces SCH-001 as strict registry conformance. The evaluator interprets SCH-001 as a quality guideline (naming quality, not strict conformance — per rubric-codebase mapping).

This creates a **validator-evaluator conflict**:

| Dimension | Validator's SCH-001 | Evaluator's SCH-001 |
|-----------|--------------------|--------------------|
| Definition | Span name must be in registry | Span name must be meaningful and map to operation |
| Pass criteria | Name ∈ {`commit_story.context.collect_chat_messages`} | Name describes the actual operation |
| Result for claude-collector | PASS | PASS |
| Result for git-collector | PASS (using registered name) | FAIL (misleading name) |
| Result for summary-manager | PASS (using registered name) | FAIL (misleading name) |

**Perverse incentive**: The agent faces a choice — semantic accuracy (fails validator → file is partial) or validation compliance (misleading names → file commits but fails evaluator). The committed files chose compliance. The partial files chose accuracy. Neither is ideal.

**Fix path**: Expand the Weaver registry with more span definitions. Journal-manager.js (SCH-001 is its sole blocker) would instantly recover.

---

## Canonical Score

| | Run-5 | Run-6 |
|---|-------|-------|
| **Quality score** | 23/25 (92%) | **21/25 (84%)** |
| **File delivery count** | 9 | **5** |
| **Quality × Coverage** | 92% with 9 files | **84% with 5 files** |

**Run-6 missed all projection tiers** from run-5 actionable-fix-output §7:
- Minimum (96%, 10 files): MISSED — 84%, 5 files
- Target (96-100%, 14-16 files): MISSED
- Stretch (100%, 15-17 files): MISSED

**Root cause of projection failure**: Run-5 projections assumed the fixes would recover files without introducing new blockers. The SCH-001 single-span registry issue was hidden behind COV-003 in run-5 and emerged as the dominant blocker when DEEP-1 fixes allowed files to progress further through validation. This is exactly the "unmasked bug" risk documented in the projections — but at a scale that negated all recovery gains.
