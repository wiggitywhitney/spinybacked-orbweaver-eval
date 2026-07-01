# Per-File Evaluation — Run-8

Full 32-rule rubric on ALL 29 files. Canonical evaluation using branch state verification.

**Branch**: `spiny-orb/instrument-1774084751105`
**Rubric**: 32 rules (5 gates + 27 quality)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Compilation) | **PASS** | All 12 committed files pass `node --check --input-type=module` |
| NDS-002 (Tests) | **PASS** | 534 tests pass, 0 failures, 0 skips (651ms) |
| NDS-003 (Non-instrumentation lines) | **PASS** | All 12 committed files: diffs contain only instrumentation additions |
| API-001 (Only @opentelemetry/api) | **PASS** | All 12 files import only from `@opentelemetry/api` |
| NDS-006 (Module system) | **PASS** | `"type": "module"` in package.json; all agent imports use ESM |

**Gates: 5/5 PASS**

---

## Per-Run Quality Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api: "^1.9.0"` in peerDependencies |
| API-003 (No vendor SDKs) | **PASS** | No dd-trace, @newrelic/*, @splunk/* in package.json |
| API-004 (No SDK imports) | **FAIL** | `@opentelemetry/sdk-node: "^0.213.0"` in peerDependencies (pre-existing since run-2) |
| CDQ-002 (Tracer acquired) | **PASS** | All 12 files: `trace.getTracer('commit-story')` matches package.json name |
| CDQ-008 (Consistent naming) | **PASS** | All 12 files use identical tracer name `'commit-story'` |

---

## Committed Files (12 files, 26 spans)

### src/collectors/claude-collector.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | Signature preserved |
| NDS-005 | PASS | No pre-existing error handling restructured |
| COV-001 | PASS | Entry point `collectChatMessages` has span |
| COV-003 | PASS | Error visibility via recordException |
| COV-005 | PASS | 5 domain attributes (source, time_window, session/message counts) |
| RST-001 | PASS | 7 sync utilities correctly skipped |
| RST-004 | PASS | Only exported function instrumented |
| SCH-001 | PASS | `commit_story.context.collect_chat_messages` follows convention |
| SCH-002 | PASS | All attribute keys in registry |
| SCH-003 | PASS | sessions_count/messages_count passed as int, matching registry int type |
| CDQ-001 | PASS | startActiveSpan + span.end() in finally |
| CDQ-003 | PASS | Standard recordException + setStatus(ERROR) |
| CDQ-005 | PASS | startActiveSpan callback auto-manages context |
| CDQ-006 | PASS | .toISOString() exempt (trivial) |
| CDQ-007 | PASS | No unbounded or PII attributes |

**Result: ALL PASS**

### src/collectors/git-collector.js (2 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | Both signatures preserved |
| NDS-005 | PASS | Internal runGit try/catch untouched |
| COV-001 | PASS | Both exported async functions have spans |
| COV-003 | PASS | Both spans record exceptions |
| COV-005 | PASS | vcs.ref.head.revision, commit.author/message/timestamp |
| RST-001 | PASS | 4 internal helpers correctly skipped |
| RST-004 | PASS | Only exported functions instrumented |
| SCH-001 | PASS | commit_story.git.* names follow convention |
| SCH-002 | PASS | All keys in registry (including OTel standard vcs.ref.head.revision) |
| SCH-003 | PASS | String attributes get strings, .toISOString() for timestamp |
| CDQ-001 | PASS | Both spans closed in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | .toISOString() exempt |
| CDQ-007 | PASS | commit.message is subject line (bounded) |

**Result: ALL PASS**

### src/commands/summarize.js (3 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | All 3 signatures preserved |
| NDS-005 | PASS | Inner per-item try/catch preserved intact |
| COV-001 | PASS | All 3 exported async orchestrators have spans |
| COV-003 | PASS | Outer catch records exceptions; inner expected-condition catches correctly not instrumented |
| COV-005 | PASS | dates_count, weeks_count, months_count, force, generated_count, failed_count |
| RST-001 | PASS | 6 sync utilities correctly skipped |
| RST-004 | PASS | Only exported functions instrumented |
| SCH-001 | PASS | commit_story.summarize.* names follow convention |
| SCH-002 | PASS | All keys in agent-extensions registry |
| SCH-003 | **FAIL** | Code passes raw numbers (.length) for count attrs; registry says string. Also force is boolean but declared string. Inconsistent with other files that use String() |
| CDQ-001 | PASS | All spans closed in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | .length is property access, not expensive |
| CDQ-007 | PASS | No unbounded attributes |

**Result: 14/15 PASS, 1 FAIL (SCH-003)**

### src/generators/summary-graph.js (3 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | All 3 signatures preserved |
| NDS-005 | PASS | No pre-existing error handling |
| COV-001 | PASS | All 3 exported generate* functions have spans |
| COV-003 | PASS | Each span records exceptions |
| COV-005 | PASS | entry_date, dates_count, week_label, month_label |
| RST-001 | PASS | Node functions (via graph.invoke) correctly skipped |
| RST-004 | PASS | Only exported functions instrumented |
| SCH-001 | PASS | commit_story.summary.generate_* names follow convention |
| SCH-002 | PASS | All keys in registries |
| SCH-003 | **FAIL** | dates_count uses String() to match string registry — code matches declared type but the declared type (string for counts) is wrong |
| CDQ-001 | PASS | All spans closed in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | String() is trivial conversion (exempt) |
| CDQ-007 | PASS | No unbounded attributes |

**Result: 14/15 PASS, 1 FAIL (SCH-003)**

### src/index.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | main() signature preserved (unexported entry point) |
| NDS-005 | PASS | Inner auto-summarize try/catch preserved; correctly NOT instrumented (expected-condition) |
| COV-001 | PASS | CLI entry point main() has span |
| COV-003 | PASS | Outer catch records exceptions |
| COV-005 | PASS | vcs.ref.head.revision, cli.subcommand, journal.file_path |
| RST-001 | PASS | 8 internal helpers correctly skipped |
| RST-004 | PASS | main() is unexported but entry point with I/O (exception applies) |
| SCH-001 | PASS | commit_story.cli.run follows convention |
| SCH-002 | PASS | All keys in registries |
| SCH-003 | PASS | All string attributes receive strings |
| CDQ-001 | PASS | Span closed in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded attributes |

**Result: ALL PASS**

### src/integrators/context-integrator.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | Signature preserved |
| NDS-005 | PASS | No pre-existing error handling |
| COV-001 | PASS | gatherContextForCommit has span |
| COV-003 | PASS | Records exceptions |
| COV-005 | PASS | 10 domain attributes — all from registry (0 agent-created) |
| RST-001 | PASS | Sync formatContextForPrompt/getContextSummary correctly skipped |
| RST-004 | PASS | Only exported async function instrumented |
| SCH-001 | PASS | commit_story.context.gather_for_commit follows convention |
| SCH-002 | PASS | All 10 keys in attributes.yaml |
| SCH-003 | PASS | Int attrs (sessions_count, messages_count, filter counts) passed as numbers; string attrs as strings |
| CDQ-001 | PASS | Span closed in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | .toISOString() exempt |
| CDQ-007 | PASS | No unbounded attributes |

**Result: ALL PASS**

### src/managers/auto-summarize.js (3 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | All 3 signatures preserved |
| NDS-005 | PASS | Inner per-item try/catch preserved |
| COV-001 | PASS | All 3 exported async functions have spans |
| COV-003 | PASS | Outer catch records exceptions; inner expected-condition catches correctly not instrumented |
| COV-005 | PASS | dates_count, weeks_count, months_count, generated_count, failed_count |
| RST-001 | PASS | getErrorMessage utility correctly skipped |
| RST-004 | PASS | Only exported functions instrumented |
| SCH-001 | PASS | Unique names: trigger_auto_* avoids collision with run_* from summarize.js |
| SCH-002 | PASS | All keys in agent-extensions registry |
| SCH-003 | **FAIL** | Count attrs declared as string, code uses String() wrapping. Declared type is wrong for counts |
| CDQ-001 | PASS | All spans closed in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | String() on .length is trivial (exempt) |
| CDQ-007 | PASS | No unbounded attributes |

**Result: 14/15 PASS, 1 FAIL (SCH-003)**

### src/managers/journal-manager.js (2 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | Both signatures preserved |
| NDS-005 | PASS | Inner ENOENT catch and directory-not-found catches preserved |
| COV-001 | PASS | Both exported async functions have spans |
| COV-003 | PASS | Both spans record exceptions |
| COV-005 | PASS | file_path, entry_date, commit.author, reflections_count, etc. |
| RST-001 | PASS | 10+ internal helpers correctly skipped |
| RST-004 | PASS | Only exported functions instrumented |
| SCH-001 | PASS | commit_story.journal.save_entry, discover_reflections follow convention |
| SCH-002 | PASS | All keys in registries |
| SCH-003 | **FAIL** | reflections_count declared as string in agent-extensions, should be int |
| CDQ-001 | PASS | Both spans closed in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | .toISOString() exempt |
| CDQ-007 | PASS | commit.author is public git metadata |

**Result: 14/15 PASS, 1 FAIL (SCH-003)**

### src/managers/summary-manager.js (3 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | All 3 signatures preserved |
| NDS-005 | PASS | Inner access() try/catch preserved |
| COV-001 | PASS | 3 orchestration functions instrumented; leaf functions (readers, formatters, savers) correctly skipped |
| COV-003 | PASS | All spans record exceptions |
| COV-005 | PASS | entry_date, week_label, month_label, force, dates_count, file_path |
| RST-001 | PASS | 5 sync formatters/boundary functions correctly skipped |
| RST-004 | PASS | Only exported orchestration functions instrumented |
| SCH-001 | PASS | Unique names: generate_and_save_* avoids collision with generate_* from summary-graph.js |
| SCH-002 | PASS | All keys in registries |
| SCH-003 | **FAIL** | force is boolean but declared string; count attrs declared as string |
| CDQ-001 | PASS | All spans closed in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded attributes |

**Result: 14/15 PASS, 1 FAIL (SCH-003)**

### src/mcp/server.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | main() signature preserved |
| NDS-005 | PASS | No pre-existing error handling |
| COV-001 | PASS | Entry point main() has span |
| COV-003 | PASS | Records exceptions |
| COV-005 | PASS | mcp.server_name attribute |
| RST-001 | PASS | createServer() (sync factory) correctly skipped |
| RST-004 | PASS | main() is entry point with I/O (exception applies) |
| SCH-001 | PASS | commit_story.mcp.start follows convention |
| SCH-002 | PASS | mcp.server_name in agent-extensions |
| SCH-003 | PASS | String attribute receives string value |
| CDQ-001 | PASS | Span closed in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | No unbounded attributes |

**Result: ALL PASS**

### src/utils/journal-paths.js (1 span)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | Signature preserved |
| NDS-005 | PASS | No pre-existing error handling |
| COV-001 | PASS | Async I/O function (mkdir) has span |
| COV-003 | PASS | Records exceptions |
| COV-005 | PASS | journal.file_path attribute |
| RST-001 | PASS | 11 sync path-construction exports correctly skipped. ensureDirectory is async I/O — not a utility per RST-001 criteria |
| RST-004 | PASS | ensureDirectory is exported |
| SCH-001 | PASS | commit_story.journal.ensure_directory follows convention |
| SCH-002 | PASS | journal.file_path in attributes.yaml |
| SCH-003 | PASS | String attribute receives string value |
| CDQ-001 | PASS | Span closed in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | No expensive computation |
| CDQ-007 | PASS | File paths are bounded |

**Result: ALL PASS**

### src/utils/summary-detector.js (5 spans)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-004 | PASS | All 5 signatures preserved |
| NDS-005 | PASS | Inner readdir try/catch preserved |
| COV-001 | PASS | All 5 exported async functions have spans |
| COV-003 | PASS | All 5 spans record exceptions |
| COV-005 | PASS | Count attributes on each span |
| RST-001 | PASS | 6 internal helpers correctly skipped. getDaysWithEntries/getDaysWithDailySummaries are exported async I/O — not utility functions per RST-001 criteria (must be sync, unexported, no I/O) |
| RST-004 | PASS | All 5 are exported functions |
| SCH-001 | PASS | commit_story.summary.* names follow convention |
| SCH-002 | PASS | All keys in registries |
| SCH-003 | **FAIL** | Count attrs (dates_count, weeks_count, months_count) declared as string, code uses String() wrapping |
| CDQ-001 | PASS | All 5 spans closed in finally |
| CDQ-003 | PASS | Standard error recording |
| CDQ-005 | PASS | startActiveSpan callback |
| CDQ-006 | PASS | String() is trivial (exempt) |
| CDQ-007 | PASS | No unbounded attributes |

**Result: 14/15 PASS, 1 FAIL (SCH-003)**

---

## Correct Skips (16 files, 0 spans)

| File | Skip Reason | Verdict |
|------|-------------|---------|
| accessibility.js | Pure string constant | CORRECT |
| anti-hallucination.js | Pure string constant | CORRECT |
| guidelines/index.js | Sync string concatenation | CORRECT |
| daily-summary-prompt.js | Sync string builder | CORRECT |
| dialogue-prompt.js | Pure string constant | CORRECT |
| monthly-summary-prompt.js | Sync string builder | CORRECT |
| summary-prompt.js | Sync string builder | CORRECT |
| technical-decisions-prompt.js | Pure string constant | CORRECT |
| weekly-summary-prompt.js | Sync string builder | CORRECT |
| message-filter.js | Sync data transforms | CORRECT |
| sensitive-filter.js | Sync regex operations | CORRECT |
| token-filter.js | Sync math/string ops | CORRECT |
| context-capture-tool.js | Sync registration (async I/O in MCP callback) | CORRECT (debatable) |
| reflection-tool.js | Sync registration (async I/O in MCP callback) | CORRECT (debatable) |
| commit-analyzer.js | All sync (execFileSync) | CORRECT |
| config.js | Frozen constant export | CORRECT |

**16/16 correct skips** (2 debatable but defensible)

---

## Partial File (1 file)

### src/generators/journal-graph.js — PARTIAL (regression from run-7)

- **Run-7**: Committed (4 spans, 1 attempt)
- **Run-8**: Partial (3 spans, 3 attempts, 70.4K output tokens)
- **Reason**: Reassembly validation failed
- **Should be instrumented**: Yes — 4 async functions with LLM I/O calls (generateJournalSections, summaryNode, technicalNode, dialogueNode)

---

## SCH-003 Failure Analysis (Systemic)

**Affected files**: summarize.js, summary-graph.js, auto-summarize.js, journal-manager.js, summary-manager.js, summary-detector.js (6/12 committed files)

**Affected attributes**: dates_count, weeks_count, months_count, generated_count, failed_count, reflections_count (6 count attributes) + force (1 boolean)

**Root cause**: The agent declared ALL count attributes as `type: string` in agent-extensions.yaml. The base registry uses `type: int` for all existing count attributes (sessions_count, messages_count, quotes_count). The SCH-003 prompt guidance says "Count attributes (*_count) MUST use type: int" — the agent ignored this guidance.

**Inconsistent handling**: Some files pass raw numbers (summarize.js, journal-manager.js), others wrap with String() (auto-summarize.js, summary-graph.js, summary-detector.js). The first approach is semantically correct but doesn't match the declared type; the second matches the declared type but is semantically wrong.

**Instance count**: 6/12 committed files affected (50%), but only 1 unique schema-level issue (count type declaration).

---

## Methodology Note: SCH-003 vs CDQ-005 Classification

In run-7, the count attribute type issue was classified under finding ID "CDQ-005" and scored in the CDQ dimension. However, the rubric rule CDQ-005 is "Async Context Maintained" (about context.with() for startSpan). The count type issue is correctly classified under SCH-003 ("Attribute Values Conform to Registry Types") because the agent-written schema declares wrong types for count attributes. Run-8 uses the correct rubric rule classification.
