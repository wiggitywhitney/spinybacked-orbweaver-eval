# Per-File Evaluation — Run-5

Canonical per-file evaluation using the standardized methodology: full rubric applied to all files, schema coverage split, instance counts alongside rule-level scores.

**Methodology**: Per-file agent evaluation + schema coverage split (canonical, single score)
**Branch**: `orbweaver/instrument-1773706515431`
**Rubric**: 32 code-level rules (5 gates + 27 quality rules across 6 dimensions)

---

## File Inventory

| Category | Count | Files |
|----------|-------|-------|
| Committed (on branch) | 9 | claude-collector, git-collector, context-integrator, auto-summarize, server, context-capture-tool, reflection-tool, commit-analyzer, journal-paths |
| Correctly skipped | 12 | config, 7 prompt files, 2 filter files, guidelines/index |
| Partial (not committed) | 6 | journal-graph, summary-graph, sensitive-filter, journal-manager, summary-manager, summary-detector |
| Failed | 2 | summarize, index |

---

## Schema Coverage Classification

| Classification | Files | Rationale |
|----------------|-------|-----------|
| **Schema-covered** | claude-collector, git-collector, context-integrator, commit-analyzer, journal-paths | Attributes defined in base Weaver registry (`semconv/attributes.yaml`) |
| **Schema-uncovered** | auto-summarize, server | No `commit_story.auto_summarize.*` or `commit_story.mcp.*` operations in base registry |
| **Partially covered** | context-capture-tool, reflection-tool | Agent-discovered span names (`mcp.*`) but some attributes (`journal.file_path`) match base registry |

---

## Gate Checks (per-run)

All 5 gates PASS for committed files.

| Gate | Result | Evidence |
|------|--------|----------|
| **NDS-001** (Compilation) | PASS | All 9 committed files pass `node --check`. Orbweaver pipeline validated syntax before commit. |
| **NDS-002** (Tests pass) | PASS | Test suite passes with committed instrumentation. Failed/partial files NOT committed, preserving test integrity. |
| **API-001** (Only @opentelemetry/api) | PASS (9/9) | All source files import only from `@opentelemetry/api`. No SDK imports. |
| **NDS-006** (Module system) | PASS (9/9) | All ESM imports. No `require()` in ESM project. |
| **CDQ-008** (Consistent tracer naming) | PASS | All 9 files use `trace.getTracer('commit-story')`. Single pattern. |

### Per-Run Dependency Rules

| Rule | Result | Evidence |
|------|--------|----------|
| **API-002** (Correct dependency declaration) | PASS | `@opentelemetry/api` in peerDependencies (correct for library). Note: agent also added `@traceloop/instrumentation-langchain` and `@traceloop/instrumentation-mcp` as optional peerDependencies — auto-instrumentation packages that belong in deployer configuration, not library dependencies. Marked optional, softening the impact. |
| **API-003** (No vendor-specific SDKs) | PASS | No dd-trace, @newrelic, @splunk packages. @traceloop is OTel-compatible, not vendor-specific. |
| **API-004** (No SDK-internal imports) | PASS (9/9) | No imports from @opentelemetry/sdk-*, exporter-*, or instrumentation-*. |

---

## Per-File Quality Evaluation: Committed Files

### Summary Table

| File | Schema | Spans | NDS-004 | NDS-005 | COV-001 | COV-003 | COV-005 | RST | SCH-001 | SCH-002 | CDQ-001 | CDQ-002 | CDQ-003 | Total |
|------|--------|-------|---------|---------|---------|---------|---------|-----|---------|---------|---------|---------|---------|-------|
| claude-collector.js | Covered | 1 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 22/22 |
| git-collector.js | Covered | 3 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 22/22 |
| context-integrator.js | Covered | 1 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 22/22 |
| auto-summarize.js | Uncov. | 3 | PASS | PASS | PASS | PASS | **FAIL** | PASS | PASS | N/A | PASS | PASS | PASS | 19/20 |
| server.js | Uncov. | 1 | PASS | PASS | PASS | PASS | **FAIL** | PASS | PASS | N/A | PASS | PASS | PASS | 19/20 |
| context-capture-tool.js | Partial | 2 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 22/22 |
| reflection-tool.js | Partial | 2 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 22/22 |
| commit-analyzer.js | Covered | 3 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 22/22 |
| journal-paths.js | Covered | 1 | PASS | PASS | N/A | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 21/21 |

### Detailed Per-File Analysis

#### 1. claude-collector.js — ALL PASS

- **1 span**: `commit_story.context.collect_chat_messages` wrapping `collectChatMessages`
- **5 attributes**: context.source, time_window_start/end, sessions_count, messages_count — all registry-defined
- **Schema coverage**: Fully covered. All attributes match `semconv/attributes.yaml`.
- **Highlights**: Clean instrumentation. Only the exported async entry point is instrumented. 7 helper functions correctly left alone. `toISOString()` calls exempt under CDQ-006 cheap computation rule.

#### 2. git-collector.js — ALL PASS

- **3 spans**: `commit_story.git.run` (wraps subprocess), `get_previous_commit_time`, `collect_commit_data`
- **Attributes**: vcs.ref.head.revision (OTel semconv), commit.author/message/timestamp (registry)
- **Schema coverage**: Fully covered.
- **Highlights**: `runGit` is unexported but correctly instrumented under RST-004 I/O exemption (subprocess execution via execFileAsync). Existing error handling in runGit catch (error.code === 128 checks) preserved with recordException added before re-throw — genuine errors, not expected conditions.

#### 3. context-integrator.js — ALL PASS

- **1 span**: `commit_story.context.gather_context_for_commit` wrapping the main orchestration function
- **10 attributes** across 4 registry groups (commit, context, filter, vcs)
- **Schema coverage**: Fully covered. Richest attribute set of any file.
- **Highlights**: Best-in-class instrumentation. 10 attributes provide comprehensive observability into the context gathering pipeline.

#### 4. auto-summarize.js — COV-005 FAIL

- **3 spans**: `commit_story.auto_summarize.generate_daily/weekly/monthly`
- **0 attributes**: No `setAttribute` calls on any span
- **Schema coverage**: Uncovered (no `auto_summarize.*` in base registry). COV-005 evaluated on invention quality.
- **COV-005 FAIL**: Schema-uncovered files should still add domain-relevant attributes. These spans provide no observability beyond "the function was called." Missing: date range, item count, basePath.
- **Note**: Per-item error recording inside a loop sets span status to ERROR even when most items succeed. Semantically imprecise but pattern is technically correct.

#### 5. server.js — COV-005 FAIL

- **1 span**: `commit_story.mcp.server` wrapping `main()`
- **0 attributes**: No `setAttribute` calls
- **Schema coverage**: Uncovered for operations. COV-005 evaluated on invention quality.
- **COV-005 FAIL**: Server entry point span has zero observability beyond existence. Missing: transport type, server version.

#### 6. context-capture-tool.js — ALL PASS

- **2 spans**: `commit_story.mcp.save_context` and `commit_story.mcp.capture_context`
- **Attributes**: `commit_story.journal.file_path` (base registry) in both spans
- **Schema coverage**: Partially covered (agent span names, but registry attributes used).
- **NDS-005 note**: Handler catch returns error response to MCP client — genuine failure (save failed), not expected condition. Correctly classified.

#### 7. reflection-tool.js — ALL PASS

- Same pattern as context-capture-tool.js.
- **2 spans**: `commit_story.mcp.save_reflection` and `commit_story.mcp.journal_add_reflection`
- **Attributes**: `commit_story.journal.file_path` (base registry) in both spans

#### 8. commit-analyzer.js — ALL PASS

- **3 spans**: `commit_story.git.get_changed_files`, `is_merge_commit`, `get_commit_metadata`
- **Attributes**: vcs.ref.head.revision, commit.files_changed, commit.author/message/timestamp
- **Schema coverage**: Fully covered.
- **NDS-005 note**: `getChangedFiles` and `isMergeCommit` have catch blocks returning defaults ([] and {isMerge: false}). Borderline NDS-005b but classified as PASS — git failing is genuinely an error, the function just handles it defensively.
- **CDQ-005 note**: Synchronous functions correctly use `startActiveSpan` without async callback.

#### 9. journal-paths.js — ALL PASS

- **1 span**: `commit_story.journal.ensure_directory` wrapping `ensureDirectory`
- **Attributes**: `commit_story.journal.file_path`
- **RST-001 note**: ensureDirectory is small (2 lines of business logic) but async with I/O (mkdir). Not flagged — RST-001 only targets sync, no-I/O, <5 line functions.

---

## Correctly Skipped Files (12 files)

All 12 files correctly skipped with 0 spans. No COV rule violations.

| File | Skip Reason | Verdict |
|------|-------------|---------|
| config.js | Configuration file, no I/O or entry points | Correct |
| accessibility.js | Pure prompt template export | Correct |
| anti-hallucination.js | Pure prompt template export | Correct |
| guidelines/index.js | Re-export aggregator | Correct |
| daily-summary-prompt.js | Pure data export | Correct |
| dialogue-prompt.js | Pure data export | Correct |
| monthly-summary-prompt.js | Pure data export | Correct |
| summary-prompt.js | Pure data export | Correct |
| technical-decisions-prompt.js | Pure data export | Correct |
| weekly-summary-prompt.js | Pure data export | Correct |
| message-filter.js | Pure synchronous filtering, no I/O | Correct |
| token-filter.js | Pure synchronous token math, no I/O | Correct |

---

## Failed Files (2 files)

Failed files have no changes on the branch (restored to original). NDS evaluation: N/A.

| File | Failure Reason | Coverage Impact |
|------|---------------|-----------------|
| **summarize.js** | COV-003 x4, SCH-002 x18 validation failures | Missing summarize command instrumentation |
| **index.js** | Oscillation: SCH-002 count increased 9→12 during fix retry | Missing root span on application entry point (COV-001 regression from run-4). Silently degrades live-check (DEEP-6). |

---

## Partial Files (6 files, not committed)

Partial files have diffs but were NOT committed to the branch. Evaluated against NDS rules only per methodology.

### NDS Summary for Partial Files

| File | Functions | NDS-003 | NDS-004 | NDS-005 |
|------|-----------|---------|---------|---------|
| journal-graph.js | 1/1 | **FAIL** (dup JSDoc) | PASS | PASS |
| summary-graph.js | 11/12 | **FAIL** (dup JSDoc x8+) | PASS | PASS |
| sensitive-filter.js | 2/3 | No diff available | — | — |
| journal-manager.js | 2/3 | **FAIL** (dup JSDoc, import ordering) | PASS | **FAIL** (005b) |
| summary-manager.js | 9/14 | **FAIL** (dup JSDoc x7+, import ordering) | PASS | **FAIL** (005b x5) |
| summary-detector.js | 4/5 | **FAIL** (dup JSDoc x4+) | PASS | **FAIL** (005b x2) |

### NDS-003 Violations (non-instrumentation changes)

**Duplicate JSDoc** (DEEP-4 finding): All 5 evaluated partial diffs show duplicate JSDoc blocks — the agent generates a new JSDoc comment and also preserves the original, resulting in two identical comment blocks per function. Systemic — affects every function the agent touches.

**Import ordering**: journal-manager.js and summary-manager.js place `const tracer = trace.getTracer('commit-story')` between import statements. Valid JavaScript (imports are hoisted) but bad style. CodeRabbit flagged this (DEEP-2).

### NDS-005b Violations (expected-condition catches recorded as errors)

**8 total NDS-005b violations** across 3 partial files. All follow the same pattern: a catch block that handles an expected condition (file not found, directory not found, access check failure) has `span.recordException()` + `span.setStatus({code: ERROR})` added.

| File | Catch Site | Expected Condition | Impact |
|------|------------|-------------------|--------|
| journal-manager.js | `readFile(entryPath)` in saveJournalEntry | File doesn't exist yet (first entry for date) | Records normal first-run as ERROR |
| summary-manager.js | `access(summaryPath)` in generateAndSaveDailySummary | Summary file doesn't exist yet | Records normal first-run as ERROR |
| summary-manager.js | `access(summaryPath)` in generateAndSaveWeeklySummary | Weekly summary doesn't exist yet | Same |
| summary-manager.js | `access(summaryPath)` in saveMonthlySummary | Monthly summary doesn't exist yet | Same |
| summary-manager.js | `readdir(weeklyDir)` in readMonthWeeklySummaries | Weekly directory doesn't exist yet | Same |
| summary-manager.js | `readFile(file)` in readMonthWeeklySummaries | File unreadable, skip | Same |
| summary-detector.js | `readdir(entriesDir)` in getDaysWithEntries | Entries directory doesn't exist | Same |
| summary-detector.js | `readdir(monthDir)` in getDaysWithEntries | Month directory unreadable | Same |

**Root cause**: DEEP-1 finding — COV-003 validator requires `recordException()` + `setStatus(ERROR)` on ALL catch blocks within spans, with no exemption for expected-condition catches. The agent is forced into a lose-lose: comply with COV-003 (produce NDS-005b violations) or comply with NDS-005b (fail COV-003 validation). This is the dominant failure pattern in run-5.

**Note**: These violations are in uncommitted partial diffs, but they demonstrate the systemic COV-003/NDS-005b conflict that also affects committed code (see DEEP-3). The committed files that DO have similar patterns (commit-analyzer.js getChangedFiles, isMergeCommit) are borderline — git failures are genuinely errors, unlike file-not-found on first run.

### Additional Quality Note for Partial Files

**summary-graph.js**: Inconsistent span naming — `generateMonthlySummary` uses `commit_story.ai.generate_monthly_summary` while `generateDailySummary` uses `commit_story.journal.generate_daily_summary` (ai vs journal namespace). Would fail SCH-001 consistency if committed.

---

## Rule-Level Aggregate (Committed Files Only)

### Dimension Scores

| Dimension | Rules Evaluated | Rules Passed | Pass Rate | Files Affected by Failures |
|-----------|----------------|--------------|-----------|---------------------------|
| Non-Destructiveness (NDS) | 2 quality + 4 gates | 6/6 | 100% | — |
| Coverage (COV) | 5 applicable (COV-006 N/A) | 3/5 | 60% | index.js (COV-001, not committed), auto-summarize (COV-005), server (COV-005) |
| Restraint (RST) | 4 applicable (RST-005 N/A) | 4/4 | 100% | — |
| API-Only Dependency (API) | 3 quality + 1 gate | 4/4 | 100% | — |
| Schema Fidelity (SCH) | 4 applicable | 4/4 | 100% | — |
| Code Quality (CDQ) | 7 applicable | 7/7 | 100% | — |

### Per-Rule Instance Counts (Committed Files)

| Rule | Pass | Fail | N/A | Notes |
|------|------|------|-----|-------|
| NDS-003 | 9/9 | 0 | 0 | All committed files clean |
| NDS-004 | 9/9 | 0 | 0 | |
| NDS-005 | 9/9 | 0 | 0 | Borderline on commit-analyzer.js but classified pass |
| COV-001 | 8/8 | 0 | 1 | journal-paths.js N/A (utility, not entry point) |
| COV-002 | 1/1 | 0 | 8 | Only git-collector has outbound subprocess calls |
| COV-003 | 9/9 | 0 | 0 | |
| COV-004 | 9/9 | 0 | 0 | |
| COV-005 | 7/9 | **2** | 0 | auto-summarize and server: 0 attributes on schema-uncovered files |
| COV-006 | 0/0 | 0 | 9 | No auto-instrumentation applicable |
| RST-001 | 9/9 | 0 | 0 | |
| RST-002 | 0/0 | 0 | 9 | No accessors in codebase |
| RST-003 | 0/0 | 0 | 9 | No thin wrappers instrumented |
| RST-004 | 9/9 | 0 | 0 | 2 files use RST-004 I/O exemption correctly |
| RST-005 | 0/0 | 0 | 9 | No pre-existing instrumentation |
| SCH-001 | 9/9 | 0 | 0 | All naming quality mode |
| SCH-002 | 7/7 | 0 | 2 | 2 schema-uncovered files have no attributes to evaluate |
| SCH-003 | 7/7 | 0 | 2 | |
| SCH-004 | 7/7 | 0 | 2 | |
| CDQ-001 | 9/9 | 0 | 0 | |
| CDQ-002 | 9/9 | 0 | 0 | Semantic check: 'commit-story' matches package.json |
| CDQ-003 | 9/9 | 0 | 0 | |
| CDQ-005 | 9/9 | 0 | 0 | |
| CDQ-006 | 5/5 | 0 | 4 | 5 files with cheap computations, all exempt |
| CDQ-007 | 7/7 | 0 | 2 | |

---

## Package.json Evaluation

The agent modified package.json to add:
- `@traceloop/instrumentation-langchain: ^0.22.6` → peerDependencies (optional)
- `@traceloop/instrumentation-mcp: ^0.22.6` → peerDependencies (optional)

**API-002 assessment**: @opentelemetry/api correctly in peerDependencies. PASS.

**Architectural concern**: commit-story-v2 is a library. Adding auto-instrumentation packages (even as optional peerDependencies) contradicts the OTel principle that libraries should depend only on the API. The @traceloop packages are SDK-level concerns that belong in the deployer's configuration, not the library's package.json. This doesn't fail any rubric rule (API-003 covers vendor-specific SDKs, which @traceloop is not), but it's a quality concern worth noting.

---

## Cross-Run Notes

**CDQ-002 improvement**: Run-4 had systemic CDQ-002 failure (all 16 files used 'unknown_service'). Run-5: all 9 committed files correctly use 'commit-story'. This fix is confirmed working.

**COV-001 regression**: index.js root span still missing (failed via SCH-002 oscillation). Persistent across run-4 and run-5.

**Schema evolution WORKING**: Run-4 had zero schema evolution (all files got identical schema). Run-5: `agent-extensions.yaml` created with 14 agent-discovered attributes using correct `commit_story.*` namespace. This is a major infrastructure improvement.

**NDS-005b is the dominant quality issue**: 8 violations across partial files, systemic root cause (DEEP-1: COV-003 validator lacks expected-condition exemption). This is the #1 priority for orbweaver improvement.
