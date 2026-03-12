# Evaluation Run 2: Rubric Scores

**Date:** 2026-03-12
**Tool:** SpinybackedOrbWeaver v1.0.0
**Branch:** `orb/instrument-1773326732807`
**Codebase:** commit-story-v2-eval (21 JavaScript files)
**Evaluator:** Human + LLM-assisted code review

---

## Summary

| Metric | Value |
|--------|-------|
| **Gate checks** | 4/4 PASS |
| **Quality rules** | 20/27 PASS (74%) |
| **Quality rules (incl. partial)** | 22/27 (81%) counting 2 partials as passes |
| **Per-dimension scores** | NDS 2/2, COV 4/6 (+2 partial), RST 5/5, API 0/3, SCH 3/4, CDQ 6/7 |
| **Strongest dimensions** | Restraint (100%), Non-Destructiveness (100%) |
| **Weakest dimension** | API-Only Dependency (0%) |
| **Files instrumented** | 10/21 |
| **Files correctly skipped** | 7/21 |
| **Files failed** | 4/21 |
| **Manual patches required** | 0 |

---

## Gate Checks (4/4 PASS)

All gates pass. Quality scoring proceeds.

### NDS-001: Compilation / Syntax Validation Succeeds — PASS

**Scope:** Per-run | **Impact:** Gate | **Method:** `node --check` on all instrumented files

All 10 instrumented files pass `node --check` syntax validation. No TypeScript files were introduced into the JavaScript project. The agent correctly identified the codebase language.

### NDS-002: All Pre-Existing Tests Pass — PASS

**Scope:** Per-run | **Impact:** Gate | **Method:** `npm test`

All 320 tests pass (320/320). No test modifications. Test suite runs clean with zero failures, zero skips.

### NDS-003: Non-Instrumentation Lines Unchanged — PASS

**Scope:** Per-file | **Impact:** Gate | **Method:** Diff analysis of all 10 instrumented files

All changes in the 10 successfully instrumented files are instrumentation-related: `import` additions for `@opentelemetry/api`, `trace.getTracer()` calls, `tracer.startActiveSpan()` wrappers, `span.setAttribute()` calls, `span.recordException()` + `span.setStatus()` error recording, and `try/finally` blocks for span lifecycle management.

**Note:** `journal-manager.js` *would have* failed this gate — the agent added `if (commit.hash) {` business logic. However, orb's NDS-003 validation correctly caught and rejected this, so the file appears as a failure (not instrumented), not a gate failure.

### API-001: Only `@opentelemetry/api` Imports — PASS

**Scope:** Per-file | **Impact:** Gate | **Method:** Grep all instrumented source files for `@opentelemetry` imports

All 10 instrumented source files import only `@opentelemetry/api`. No SDK, exporter, or instrumentation package imports appear in application source files.

**Important distinction:** This gate evaluates *source files* (the files the agent instruments). The `instrumentation.js` SDK setup file and `package.json` dependency declarations are evaluated under the API dimension quality rules (API-002, API-003, API-004), not this gate.

---

## Dimension 1: Non-Destructiveness (NDS) — 2/2 PASS (100%)

### NDS-004: Public API Signatures Preserved — PASS

**Scope:** Per-file | **Impact:** Important

All exported function signatures are unchanged across the 10 instrumented files. The agent wraps function bodies with `tracer.startActiveSpan()` callbacks but does not modify parameter lists, return types, or export declarations.

**Evidence:** `collectChatMessages(repoPath, commitTime, previousCommitTime)` in `claude-collector.js` — same signature, body wrapped in span callback with proper return value propagation.

### NDS-005: Error Handling Behavior Preserved — PASS

**Scope:** Per-file | **Impact:** Important | **Method:** Semi-automatable (structural + semantic review)

Pre-existing `try/catch` blocks are preserved in all files. The agent's instrumentation wraps functions in `try/finally` blocks that call `span.end()` in the `finally` clause. Where pre-existing error handling exists, the agent adds `span.recordException(error)` and `span.setStatus()` inside existing `catch` blocks without restructuring them.

**Evidence:** `git-collector.js` — pre-existing `try/catch` in `getCommitDiff` preserved; agent adds error recording inside the existing catch block and wraps the outer function in a new try/finally for span lifecycle.

---

## Dimension 2: Coverage (COV) — 4/6 PASS, 2 PARTIAL

### COV-001: Entry Points Have Spans — PASS

**Scope:** Per-instance | **Impact:** Critical

Both primary entry points are instrumented:
- `src/index.js` — `generateJournalEntry` (main exported function), span: `commit_story.journal.generate`
- `src/mcp/server.js` — MCP server initialization, span: `commit_story.mcp.handle_request`

MCP tool handlers (`context-capture-tool.js`, `reflection-tool.js`) are also instrumented as entry points into tool execution.

### COV-002: Outbound Calls Have Spans — PARTIAL (~60%)

**Scope:** Per-instance | **Impact:** Important

**Instrumented outbound calls (6):**
- `claude-collector.js` — file system reads for Claude project data (1 span covering collection)
- `git-collector.js` — `child_process.execSync` for git operations (2 spans: `commit_story.git.get_commit_diff`, `commit_story.git.get_commit_info`)
- `commit-analyzer.js` — git log subprocess calls (3 spans covering analysis operations)

**Missing outbound calls (4):**
- `journal-graph.js` — LLM API calls via `ChatAnthropic.invoke()` (FAILED: token budget exceeded)
- `journal-manager.js` — file system writes for journal entries (FAILED: NDS-003 validation)
- `sensitive-filter.js` — processes content through filter chain (FAILED: null parsed output)
- `summary-prompt.js` — template processing (FAILED: elision detected)

The 4 missing outbound call sites correspond exactly to the 4 failed files. Among successfully instrumented files, outbound call coverage is complete.

### COV-003: Failable Operations Have Error Visibility — PASS

**Scope:** Per-instance | **Impact:** Important

All instrumented spans that wrap failable operations include error recording. The pattern is consistent: `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })` in catch blocks.

**Evidence:** `git-collector.js:getCommitDiff` — catch block records exception and sets error status. `commit-analyzer.js:analyzeCommitHistory` — same pattern.

### COV-004: Long-Running / Async Operations Have Spans — PARTIAL (~50%)

**Scope:** Per-instance | **Impact:** Normal

**Instrumented async operations (7):**
- `claude-collector.js` — `collectChatMessages` (async, file I/O)
- `git-collector.js` — `getCommitDiff`, `getCommitInfo` (subprocess I/O)
- `context-integrator.js` — `integrateContext` (async orchestration)
- `commit-analyzer.js` — `analyzeCommitHistory`, `getRecentCommits`, `categorizeCommit` (async, subprocess I/O)

**Missing async operations (7):**
- `journal-graph.js` — all graph node functions are async with LLM calls (FAILED)
- `journal-manager.js` — `writeJournalEntry`, `readJournalEntry` (async file I/O) (FAILED)
- `sensitive-filter.js` — `filterSensitiveContent` (async) (FAILED)
- `summary-prompt.js` — `buildSummaryPrompt` (async) (FAILED)
- `message-filter.js` — sync but correctly not counted
- `token-filter.js` — sync operations, correctly not expected here

Again, gaps align with the 4 failed files. Coverage is complete for successfully instrumented files.

### COV-005: Domain-Specific Attributes Present — PASS

**Scope:** Per-instance | **Impact:** Normal

Instrumented spans use domain-specific attributes from the Weaver schema registry:

| Attribute | Registry Match | Files |
|-----------|---------------|-------|
| `commit_story.context.source` | Yes | claude-collector |
| `commit_story.context.time_window_start` | Yes | claude-collector |
| `commit_story.context.time_window_end` | Yes | claude-collector |
| `commit_story.git.commit_hash` | Yes | git-collector, commit-analyzer |
| `commit_story.git.diff_length` | Yes | git-collector |
| `commit_story.context.message_count` | Yes | message-filter |
| `commit_story.context.token_count` | Yes | token-filter |
| `commit_story.context.token_budget` | Yes | token-filter |
| `commit_story.mcp.tool_name` | Yes | context-capture-tool, reflection-tool |
| `commit_story.journal.entry_id` | Yes | index |

All attribute keys match registry definitions. No ad-hoc attribute names invented.

### COV-006: Auto-Instrumentation Preferred Over Manual Spans — PASS

**Scope:** Per-instance | **Impact:** Important

No manual spans duplicate what auto-instrumentation libraries would cover. The codebase uses custom domain operations (git subprocess calls, Claude project file parsing, MCP tool handlers) that have no corresponding auto-instrumentation libraries. Manual spans are the correct approach for all instrumented operations.

---

## Dimension 3: Restraint (RST) — 5/5 PASS (100%)

### RST-001: No Spans on Utility Functions — PASS

**Scope:** Per-instance | **Impact:** Important

No spans on utility functions. Examples of correctly skipped utilities:
- `src/utils/config.js` — configuration loading (pure data, no I/O at span-worthy granularity)
- `src/utils/journal-paths.js` — path construction (synchronous, no I/O)
- Helper functions within instrumented files (e.g., `getClaudeProjectPath`, `parseJSONLFile` in claude-collector.js) — correctly left uninstrumented

### RST-002: No Spans on Trivial Accessors — PASS

**Scope:** Per-instance | **Impact:** Low

No spans on getters, setters, or trivial property accessors. The codebase has minimal accessor patterns; none were instrumented.

### RST-003: No Duplicate Spans on Thin Wrappers — PASS

**Scope:** Per-instance | **Impact:** Important

No duplicate spans on wrapper/delegation functions. Re-export modules (`src/generators/prompts/guidelines/index.js`) correctly skipped. No thin wrapper functions received spans.

### RST-004: No Spans on Internal Implementation Details — PASS

**Scope:** Per-instance | **Impact:** Normal

Unexported/internal functions are not instrumented. Spans are placed only on exported functions or functions that perform I/O operations (the documented exception in the rubric).

**Evidence:** In `git-collector.js`, exported `getCommitDiff` and `getCommitInfo` have spans; internal helpers like `parseGitLog` do not. In `commit-analyzer.js`, the exported `analyzeCommitHistory` has a span; internal parsing functions do not.

### RST-005: No Re-Instrumentation of Already-Instrumented Code — PASS

**Scope:** Per-instance | **Impact:** Important

The codebase had zero pre-existing instrumentation (by design — Phase 3 adds telemetry). No re-instrumentation possible. Pass by definition.

---

## Dimension 4: API-Only Dependency (API) — 0/3 PASS (0%)

All 3 failures originate from `src/instrumentation.js` (SDK setup file) and `package.json` dependency declarations.

### API-002: Correct Dependency Declaration — FAIL

**Scope:** Per-run | **Impact:** Important

**Expected:** `@opentelemetry/api` in `peerDependencies` (library/distributable mode per `orb.yaml: dependencyStrategy: peerDependencies`).

**Actual:** `@opentelemetry/api` IS correctly in `peerDependencies`. However, `@opentelemetry/sdk-node` is in `dependencies` (production dependencies), not `peerDependencies` or `devDependencies`. For a distributable library, the SDK should not be a production dependency — it's the deployer's choice.

**Evidence:** `package.json` diff shows `"@opentelemetry/sdk-node": "^0.213.0"` added to `dependencies`.

### API-003: No Vendor-Specific SDKs — FAIL

**Scope:** Per-run | **Impact:** Important

**Expected:** No vendor-specific instrumentation packages.

**Actual:** `@traceloop/node-server-sdk` (mega-bundle) in `peerDependencies`. While Traceloop is not a traditional APM vendor, the mega-bundle approach contradicts orb's own spec v3.8 which says "the agent does NOT use that mega-bundle — it installs individual instrumentation packages." The mega-bundle bundles dozens of instrumentation packages, most irrelevant to this project.

**Evidence:** `package.json` diff shows `"@traceloop/node-server-sdk": "^0.22.8"` in `peerDependencies`.

### API-004: No SDK-Internal Imports — FAIL

**Scope:** Per-file | **Impact:** Important

**Expected:** No imports from `@opentelemetry/sdk-*` or vendor packages in any file.

**Actual:** `src/instrumentation.js` contains:
```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { TraceloopNodeServerSdk } = require('@traceloop/node-server-sdk');
```

Both are SDK-internal imports. Additionally, `require()` (CommonJS) is used in an ESM project (`"type": "module"` in `package.json`), which would fail at runtime.

**Note:** The SDK setup file (`instrumentation.js`) is architecturally expected to import SDK packages — that's its purpose. The issue is the *specific* packages chosen (mega-bundle instead of individual packages) and the module system mismatch (CJS in ESM project). A properly configured SDK setup file that used individual packages with ESM imports would still trigger API-004 by the rubric's letter, which suggests the rubric may need a carve-out for SDK setup files. This is documented as a rubric gap in the gap analysis.

---

## Dimension 5: Schema Fidelity (SCH) — 3/4 PASS (75%)

### SCH-001: Span Names Match Registry Operations — FAIL

**Scope:** Per-instance | **Impact:** Critical

**Expected:** Consistent span naming matching registry operation definitions.

**Actual:** Span names use two different conventions:

| Convention | Span Names | Files |
|-----------|-----------|-------|
| Dotted path (`commit_story.*`) | `commit_story.context.collect`, `commit_story.git.get_commit_diff`, `commit_story.git.get_commit_info`, `commit_story.journal.generate`, `commit_story.mcp.handle_request` | claude-collector, git-collector, index, mcp/server, commit-analyzer (partial) |
| Dotted path (`commit_story.*`) | `commit_story.context.integrate`, `commit_story.filter.messages`, `commit_story.filter.tokens`, `commit_story.mcp.capture_context`, `commit_story.mcp.add_reflection` | context-integrator, message-filter, token-filter, context-capture-tool, reflection-tool |

Actually, all span names DO follow the `commit_story.*` dotted-path convention consistently. The names are well-structured and match the registry's namespace pattern. However, the naming is not perfectly aligned with registry operation definitions — some spans use slightly different operation names than what the registry defines.

**Revised assessment:** The span *naming convention* is consistent (all use `commit_story.` prefix with dotted paths). The failure is that not all span names map directly to named operations in the Weaver registry. Some are agent-invented names that follow the right pattern but weren't defined in the schema. Per the rubric's registry mode, unmatched names are failures. **FAIL** on strict registry matching, but naming quality is good.

### SCH-002: Attribute Keys Match Registry Names — PASS

**Scope:** Per-instance | **Impact:** Important

All `setAttribute` calls use attribute keys defined in the Weaver registry (`commit_story.context.*`, `commit_story.git.*`, `commit_story.mcp.*`, `commit_story.journal.*`). No invented or misspelled attribute keys found.

### SCH-003: Attribute Values Conform to Registry Types — PASS

**Scope:** Per-instance | **Impact:** Important

Attribute values match registry type definitions:
- String attributes receive string values (e.g., `commit_story.context.source` = `'claude_code'`)
- Numeric attributes receive numeric values (e.g., `commit_story.context.token_count` = integer)
- ISO 8601 timestamps where expected (e.g., `commit_story.context.time_window_start` = `.toISOString()`)

### SCH-004: No Redundant Schema Entries — PASS

**Scope:** Per-instance | **Impact:** Important | **Method:** Semi-automatable

No agent-added attribute keys exist outside the registry. All attributes trace back to registry definitions. No string-similar duplicates detected.

---

## Dimension 6: Code Quality (CDQ) — 6/7 PASS (86%)

### CDQ-001: Spans Closed in All Code Paths — PASS

**Scope:** Per-instance | **Impact:** Critical

All spans use the `tracer.startActiveSpan('name', async (span) => { try { ... } finally { span.end(); } })` pattern. The callback form of `startActiveSpan` plus `try/finally` ensures spans close on all code paths (success, error, and early return).

**Evidence:** Consistent across all 10 files. No `startSpan()` manual management pattern used.

### CDQ-002: Tracer Acquired Correctly — PASS

**Scope:** Per-file | **Impact:** Normal

All 10 files use `trace.getTracer('...')` with a string name argument. The tracer is acquired at module scope (top-level `const tracer = trace.getTracer('...');`), which is the recommended pattern.

### CDQ-003: Standard Error Recording Pattern — PASS

**Scope:** Per-instance | **Impact:** Important

All error handling uses the standard OTel pattern:
```javascript
span.recordException(error);
span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
```

No ad-hoc `span.setAttribute('error', ...)` patterns found. `SpanStatusCode` is correctly imported from `@opentelemetry/api`.

### CDQ-005: Async Context Maintained — PASS

**Scope:** Per-instance | **Impact:** Important

All spans use `startActiveSpan()` callback pattern which automatically manages async context. No `startSpan()` manual management used. Context propagation is correct for nested async operations.

### CDQ-006: Expensive Attribute Computation Guarded — PASS

**Scope:** Per-instance | **Impact:** Low

No expensive computations in `setAttribute` calls. All attribute values are simple variable references, property accesses, or `.toISOString()` calls. No `JSON.stringify`, `.map()`, `.reduce()`, or other potentially expensive operations unguarded.

### CDQ-007: No Unbounded or PII Attributes — PASS

**Scope:** Per-instance | **Impact:** Important

No full object spreads, `JSON.stringify` of request/response objects, or unbounded arrays in `setAttribute` calls. No PII field patterns detected. Attributes that source from optional values are set conditionally where appropriate.

### CDQ-008: Consistent Tracer Naming Convention — FAIL

**Scope:** Per-run | **Impact:** Normal

**Expected:** All `trace.getTracer()` calls use the same name string.

**Actual:** Two different tracer names used across 10 files:

| Tracer Name | Files (5 each) |
|-------------|----------------|
| `'commit-story'` (hyphen) | claude-collector, git-collector, index, mcp/server, commit-analyzer |
| `'commit_story'` (underscore) | context-integrator, message-filter, token-filter, context-capture-tool, reflection-tool |

The package name is `commit-story` (hyphen). The span namespace uses `commit_story` (underscore, per OTel naming convention for attributes). The agent inconsistently applied one or the other to the tracer name argument. This fragments trace analysis and service map identification.

---

## Overall Score Summary

### Gate Check Results

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-001 | **PASS** | All files pass `node --check` |
| NDS-002 | **PASS** | 320/320 tests pass |
| NDS-003 | **PASS** | All diffs are instrumentation-only |
| API-001 | **PASS** | Only `@opentelemetry/api` in source files |

### Quality Rules by Dimension

| Dimension | Pass | Partial | Fail | Score |
|-----------|------|---------|------|-------|
| Non-Destructiveness (NDS) | 2 | 0 | 0 | 2/2 (100%) |
| Coverage (COV) | 4 | 2 | 0 | 4-6/6 (67-100%) |
| Restraint (RST) | 5 | 0 | 0 | 5/5 (100%) |
| API-Only Dependency (API) | 0 | 0 | 3 | 0/3 (0%) |
| Schema Fidelity (SCH) | 3 | 0 | 1 | 3/4 (75%) |
| Code Quality (CDQ) | 6 | 0 | 1 | 6/7 (86%) |
| **Total** | **20** | **2** | **5** | **20-22/27 (74-81%)** |

### Failure Summary

| Rule | Severity | Root Cause | Fix Target |
|------|----------|-----------|------------|
| API-002 | Important | SDK in production deps for distributable package | `instrumentation.js` / `package.json` generation |
| API-003 | Important | Mega-bundle instead of individual packages | Dependency selection logic |
| API-004 | Important | CJS require() in ESM project + SDK imports | Module system detection + SDK setup generation |
| SCH-001 | Critical | Span names not strictly matching registry operations | Schema-aware span naming |
| CDQ-008 | Normal | Tracer name inconsistency (`commit-story` vs `commit_story`) | Tracer name normalization |

### Partial Results

| Rule | Severity | Root Cause | Note |
|------|----------|-----------|------|
| COV-002 | Important | 4 files failed instrumentation | Coverage complete for successful files |
| COV-004 | Normal | 4 files failed instrumentation | Coverage complete for successful files |

---

## Key Findings

### What Works Well
1. **Non-destructiveness is perfect** — zero business logic changes, all tests pass, all signatures preserved
2. **Restraint is perfect** — no over-instrumentation, utilities correctly skipped, no duplicate spans
3. **Code quality is strong** — proper span lifecycle, standard error recording, correct async context management
4. **Domain attributes are correct** — all attributes match the Weaver schema registry

### What Needs Fixing
1. **SDK setup is fundamentally broken** — wrong module system (CJS in ESM), mega-bundle dependency, SDK in production deps
2. **Tracer naming is inconsistent** — 50/50 split between hyphen and underscore variants
3. **Span names need registry alignment** — naming convention is good but doesn't strictly match registry operations
4. **4 files failed** — token budget, elision, null output, and persistent NDS-003 violation reduce coverage
