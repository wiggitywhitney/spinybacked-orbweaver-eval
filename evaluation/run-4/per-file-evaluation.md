# Run-4 Per-File Evaluation

Generated from `per-file-evaluation.json` — the canonical source of truth.

**Run:** 4 | **Date:** 2026-03-16 | **Orbweaver:** 0.1.0 | **Branch:** `orbweaver/instrument-1773627869602`

---

## Run-Level Summary

| Metric | Value |
|--------|-------|
| Files processed | 29 |
| Files with instrumentation on branch | 16 |
| Files with 0 spans (correct skips) | 10 |
| Files failed (no changes delivered) | 3 |
| Total spans on branch | ~48 |
| Unique span names | 37 (across 16 files) |
| Unique attribute keys | 35 |
| Ad-hoc attributes (not in registry) | 11 |

---

## Gate Checks (Per-Run)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-001 (Compilation) | **PASS** | `node --check` passes — syntax valid. Tracer ReferenceError is a runtime error, not syntax. |
| NDS-002 (Tests pass) | **FAIL** | 32 test failures: `ReferenceError: tracer is not defined`. Caused by summary-graph.js (21) and sensitive-filter.js (11). Function-level fallback omitted tracer import. Changes were in working directory only — never committed to branch. |
| API-001 (API-only imports) | **PASS** | All 16 source files import only from `@opentelemetry/api`. |
| NDS-006 (Module system) | **PASS** | All ESM `import` statements. No `require()` or `module.exports`. |
| CDQ-008 (Tracer naming) | **PASS** | All 17 files use `trace.getTracer('unknown_service')` consistently. Wrong name (should be `commit-story`), but consistent. |

**Gate verdict:** NDS-002 FAIL at the run level. However, the branch itself contains only passing instrumentation — the failing code was never committed.

---

## Per-Run Quality Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Dependency declaration) | **PASS** | `@opentelemetry/api` in `peerDependencies` (correct for library). |
| API-003 (No vendor SDKs) | **PASS** | No dd-trace, @newrelic/*, @splunk/*. @traceloop packages are optional peerDependencies (auto-instrumentation, not vendor SDK). |
| API-004 (No SDK-internal imports) | **PASS** | No @opentelemetry/sdk-*, @opentelemetry/instrumentation-* imports in source files. |

---

## Per-File Evaluation — Instrumented Files (16)

### Evaluation Key

- **PASS**: Rule satisfied
- **FAIL**: Rule violated with evidence
- **N/A**: Rule not applicable to this file
- **BORDERLINE**: Potential issue, needs judgment

### src/collectors/claude-collector.js (1 span)

| Span: `commit_story.context.collect` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| NDS-004 | PASS | All 8 exported signatures preserved |
| NDS-005 | PASS | parseJSONLFile try/catch preserved |
| COV-001 | PASS | collectChatMessages entry point spanned |
| COV-002 | **FAIL** | findJSONLFiles (readdirSync) and parseJSONLFile (readFileSync) have no spans |
| COV-005 | PASS | 5/5 registry attributes used |
| RST-001 | PASS | No spans on 4 utility functions |
| SCH-001 | PASS | `commit_story.*` prefix |
| SCH-002 | PASS | All keys in registry |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |
| CDQ-006 | **FAIL** | `toISOString()` without `isRecording()` guard |

### src/collectors/git-collector.js (3 spans)

| Spans: `commit_story.git.execute`, `commit_story.git.get_previous_commit_time`, `commit_story.git.get_commit_data` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| NDS-004 | PASS | Exported signatures preserved |
| NDS-005 | **BORDERLINE** | Agent advisory flags: "Original try/catch block (line 21) is missing from instrumented output" — runGit() error mapping may be altered |
| COV-001 | PASS | getCommitData entry point spanned |
| COV-002 | PASS | runGit (child_process) spanned |
| COV-005 | PASS | All keys in registry including commit_story.git.subcommand |
| RST-001 | PASS | No utility function spans |
| SCH-001 | PASS | `commit_story.git.*` prefix |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |
| CDQ-006 | **FAIL** | `timestamp.toISOString()` without guard |

### src/commands/summarize.js (3 spans)

| Spans: `commit_story.summarize.run_daily`, `.run_weekly`, `.run_monthly` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| NDS-004 | PASS | Signatures preserved |
| COV-001 | PASS | All summary operations covered |
| SCH-001 | PASS | `commit_story.summarize.*` prefix |
| SCH-002 | **FAIL** | 4 ad-hoc attributes: `commit_story.summarize.{input_count, force, generated_count, failed_count}` |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/generators/journal-graph.js (4 spans) — RESCUED

| Spans: `commit_story.ai.generate_summary`, `.generate_technical_decisions`, `.generate_dialogue`, `commit_story.journal.generate` |
|------|

**Rescued from persistent failure in run-2 (token budget) and run-3 (oscillation).**

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions. Agent explicitly avoided prior failure modes. |
| NDS-004 | PASS | All 18+ exports preserved |
| NDS-005 | PASS | Graph node try/catch (catch → return error state) preserved |
| COV-001 | PASS | generateJournalSections + 3 graph nodes |
| COV-002 | PASS | model.invoke() covered by node spans. Manual spans on graph nodes justified (LangGraph gaps in auto-instrumentation). |
| COV-005 | PASS | Registry attributes: ai.section_type, gen_ai.request.model, gen_ai.request.temperature, gen_ai.operation.name. Missing: gen_ai.usage.input/output_tokens (require API response metadata). |
| COV-006 | PASS | Manual spans on graph nodes correct — auto-instrumentation covers LLM calls but NOT LangGraph orchestration |
| RST-001 | PASS | No spans on 11 utility functions |
| RST-002 | PASS | No spans on getModel, resetModel |
| SCH-001 | PASS | All `commit_story.*` prefix |
| SCH-002 | PASS | All keys in registry |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/index.js (2 spans)

| Spans: `commit_story.summarize.handle`, `commit_story.journal.generate` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| NDS-005 | PASS | All 4 error handling patterns preserved |
| COV-001 | **FAIL** | **main() has no root span.** Only summarize and journal-generate paths are spanned. The trace has no top-level CLI operation span. |
| COV-002 | **FAIL** | 3 git validation calls (isGitRepository, isValidCommitRef, getPreviousCommitTime) have no spans |
| RST-001 | PASS | No spans on parseArgs, debug, showHelp |
| SCH-001 | PASS | `commit_story.*` prefix |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/integrators/context-integrator.js (1 span) — RESCUED

| Span: `context.gather_for_commit` |
|------|

**Rescued from NDS-003 failures in run-2 and run-3.**

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Agent found a way to instrument without the variable extraction that triggered NDS-003 in prior runs |
| COV-001 | PASS | gatherContextForCommit entry point spanned |
| RST-001 | PASS | No spans on formatContextForPrompt, getContextSummary |
| SCH-001 | **FAIL** | `context.gather_for_commit` does NOT use `commit_story.*` prefix |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/integrators/filters/message-filter.js (1 span)

| Span: `commit_story.filter.messages` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| COV-001 | PASS | filterMessages entry point spanned |
| COV-005 | PASS | filter.type, filter.messages_before, filter.messages_after — all registry |
| RST-001 | PASS | No spans on 6 unexported utilities |
| SCH-001 | PASS | `commit_story.filter.*` prefix |
| SCH-002 | PASS | All keys in registry |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/integrators/filters/token-filter.js (3 spans)

| Spans: `commit_story.filter.truncate_diff`, `.truncate_messages`, `.apply_token_budget` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| COV-001 | PASS | applyTokenBudget entry point spanned |
| COV-005 | PASS | filter.type, filter.tokens_before, filter.tokens_after — all registry |
| RST-001 | PASS | estimateTokens (pure math) not spanned |
| SCH-001 | PASS | `commit_story.filter.*` prefix |
| SCH-002 | PASS | All keys in registry |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/managers/auto-summarize.js (3 spans)

| Spans: `commit_story.journal.trigger_auto_summaries`, `.trigger_auto_weekly_summaries`, `.trigger_auto_monthly_summaries` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| COV-001 | PASS | triggerAutoSummaries entry point spanned |
| SCH-001 | PASS | `commit_story.journal.*` prefix |
| SCH-002 | **FAIL** | 4 ad-hoc attributes: `commit_story.journal.{unsummarized_count, generated_count, skipped_count, failed_count}` |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/managers/summary-manager.js (3 spans)

| Spans: `summary.daily.generate`, `summary.weekly.generate`, `summary.monthly.generate` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| COV-001 | PASS | All 3 summary generation entry points spanned |
| SCH-001 | **FAIL** | `summary.*` prefix — should be `commit_story.summary.*` |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/mcp/server.js (1 span)

| Span: `mcp.server.start` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| NDS-005 | PASS | main() .catch() preserved |
| COV-001 | PASS | MCP server entry point spanned |
| SCH-001 | **FAIL** | `mcp.server.start` — should be `commit_story.mcp.server.start` |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/mcp/tools/context-capture-tool.js (2 spans)

| Spans: `context.capture.save`, `mcp.tool.journal_capture_context` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| NDS-005 | PASS | Tool handler try/catch preserved |
| COV-001 | PASS | Tool handler entry point spanned |
| COV-002 | PASS | saveContext (mkdir + appendFile) spanned |
| SCH-001 | **FAIL** | Both names deviate from `commit_story.*` prefix |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/mcp/tools/reflection-tool.js (2 spans)

| Spans: `commit_story.journal.save_reflection`, `mcp.tool.journal_add_reflection` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| NDS-005 | PASS | Tool handler try/catch preserved |
| COV-001 | PASS | Tool handler entry point spanned |
| COV-002 | PASS | saveReflection (mkdir + appendFile) spanned |
| SCH-001 | **BORDERLINE** | One span uses `commit_story.*`, one uses `mcp.*` |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/utils/commit-analyzer.js (3 spans)

| Spans: `commit_story.git.get_changed_files`, `.is_merge_commit`, `.get_commit_metadata` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| COV-001 | PASS | All 3 exported I/O functions spanned |
| COV-002 | PASS | All 3 git command operations spanned |
| COV-005 | PASS | commit_story.git.subcommand, commit_story.commit.parent_count — all registry |
| RST-001 | PASS | isSafeGitRef (validation) not spanned |
| SCH-001 | PASS | `commit_story.git.*` prefix |
| SCH-002 | PASS | All keys in registry |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/utils/journal-paths.js (1 span)

| Span: `commit_story.journal.ensure_directory` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| COV-001 | PASS | ensureDirectory (I/O operation) spanned |
| RST-001 | PASS | 3 pure functions not spanned |
| RST-002 | PASS | 5 path builders not spanned |
| SCH-001 | PASS | `commit_story.journal.*` prefix |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

### src/utils/summary-detector.js (5 spans)

| Spans: `commit_story.journal.get_days_with_entries`, `.find_unsummarized_days`, `.get_days_with_daily_summaries`, `.find_unsummarized_weeks`, `.find_unsummarized_months` |
|------|

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | PASS | Only instrumentation additions |
| COV-001 | PASS | All 5 detection functions spanned |
| SCH-001 | PASS | `commit_story.journal.*` prefix |
| SCH-002 | **FAIL** | 3 ad-hoc attributes: days_found, unsummarized_weeks_count, unsummarized_months_count |
| CDQ-002 | **FAIL** | `trace.getTracer('unknown_service')` |

---

## Failed Files (3)

### src/generators/summary-graph.js — FAILED

- **PR summary:** "partial (12/12 functions, 6 spans)"
- **Branch:** NO CHANGES — instrumentation never committed
- **Root cause:** Function-level fallback added `tracer.startActiveSpan()` calls to 12 functions without adding `tracer` import at module scope. 21 test failures.
- **Orbweaver issues:** #3 (missing tracer import), #2 (test failures don't trigger fix), #4 (no per-file validation)

### src/integrators/filters/sensitive-filter.js — FAILED

- **PR summary:** "partial (2/3 functions, 2 spans)"
- **Branch:** NO CHANGES — instrumentation never committed
- **Root cause:** Same missing-tracer bug as summary-graph.js for 2 functions. redactSensitiveData blocked by NDS-003 (12 regex pattern violations). 11 test failures.
- **Orbweaver issues:** #3, #2, #4

### src/managers/journal-manager.js — FAILED

- **PR summary:** "partial (1/3 functions, 0 spans)"
- **Branch:** NO CHANGES — 0 spans = no useful changes
- **Root cause:** formatJournalEntry processed (0 spans — correct). saveJournalEntry and discoverReflections blocked by NDS-003 (business logic modifications). Net: 0 instrumentation.
- **Orbweaver issues:** run-3 #4 (NDS-003 blocks instrumentation-motivated refactors)

---

## Zero-Span Files (10) — All Correct

| File | Decision | Reason |
|------|----------|--------|
| prompts/guidelines/accessibility.js | Correct skip | String constant export |
| prompts/guidelines/anti-hallucination.js | Correct skip | String constant export |
| prompts/guidelines/index.js | Correct skip | Re-exports + pure function |
| prompts/sections/daily-summary-prompt.js | Correct skip | Pure template function |
| prompts/sections/dialogue-prompt.js | Correct skip | String constant export |
| prompts/sections/monthly-summary-prompt.js | Correct skip | Pure template function. **Note:** Unused imports added (minor waste) |
| prompts/sections/summary-prompt.js | Correct skip | Pure template function |
| prompts/sections/technical-decisions-prompt.js | Correct skip | String constant export |
| prompts/sections/weekly-summary-prompt.js | Correct skip | Pure template function |
| utils/config.js | Correct skip | Frozen configuration object |

---

## Quality Dimension Summary

### Non-Destructiveness (NDS)

| Rule | Scope | Pass | Fail | Borderline |
|------|-------|------|------|------------|
| NDS-001 (Compilation) | Per-run | 1 | 0 | 0 |
| NDS-002 (Tests) | Per-run | 0 | 1 | 0 |
| NDS-003 (Non-instrumentation lines) | Per-file | 16 | 0 | 0 |
| NDS-004 (Public API) | Per-file | 16 | 0 | 0 |
| NDS-005 (Error handling) | Per-file | 15 | 0 | 1 |
| NDS-006 (Module system) | Per-run | 1 | 0 | 0 |

### Coverage (COV)

| Rule | Scope | Pass | Fail | N/A |
|------|-------|------|------|-----|
| COV-001 (Entry points) | Per-file | 15 | 1 | 0 |
| COV-002 (Outbound calls) | Per-file | 8 | 2 | 6 |
| COV-003 (Error visibility) | Per-file | 16 | 0 | 0 |
| COV-004 (Async operations) | Per-file | 11 | 2 | 3 |
| COV-005 (Domain attributes) | Per-file | 10 | 3 | 3 |
| COV-006 (Auto-instrumentation) | Per-file | 1 | 0 | 15 |

### Restraint (RST)

| Rule | Scope | Pass | Fail | Borderline |
|------|-------|------|------|------------|
| RST-001 (No utility spans) | Per-file | 16 | 0 | 0 |
| RST-002 (No accessor spans) | Per-file | 16 | 0 | 0 |
| RST-003 (No wrapper spans) | Per-file | 16 | 0 | 0 |
| RST-004 (No internal spans) | Per-file | 14 | 0 | 2 |
| RST-005 (No re-instrumentation) | Per-file | 0 | 0 | 0 (all N/A) |

### API-Only Dependency (API)

| Rule | Scope | Pass | Fail |
|------|-------|------|------|
| API-001 (Only API imports) | Per-run | 1 | 0 |
| API-002 (Correct dependency) | Per-run | 1 | 0 |
| API-003 (No vendor SDKs) | Per-run | 1 | 0 |
| API-004 (No SDK internals) | Per-run | 1 | 0 |

### Schema Fidelity (SCH)

| Rule | Scope | Pass | Fail | Borderline |
|------|-------|------|------|------------|
| SCH-001 (Span naming) | Per-file | 10 | 5 | 1 |
| SCH-002 (Attribute keys) | Per-file | 12 | 3 | 0 |
| SCH-003 (Attribute values) | Per-file | 16 | 0 | 0 |
| SCH-004 (No redundant entries) | Per-file | 16 | 0 | 0 |

### Code Quality (CDQ)

| Rule | Scope | Pass | Fail |
|------|-------|------|------|
| CDQ-001 (Spans closed) | Per-file | 16 | 0 |
| CDQ-002 (Tracer name) | Per-file | 0 | 16 |
| CDQ-003 (Error recording) | Per-file | 16 | 0 |
| CDQ-005 (Async context) | Per-file | 16 | 0 |
| CDQ-006 (Expensive computation) | Per-file | 14 | 2 |
| CDQ-007 (No PII/unbounded) | Per-file | 16 | 0 |
| CDQ-008 (Consistent naming) | Per-run | 1 | 0 |

---

## Systemic Failures (Cross-File)

1. **CDQ-002: `trace.getTracer('unknown_service')` in all 16 files** — The agent uses 'unknown_service' as the tracer library name instead of 'commit-story'. This means all spans will be attributed to "unknown_service" in trace analysis tools. This is a systemic agent configuration issue, not a per-file quality problem.

2. **SCH-001: 8 of 37 span names deviate from `commit_story.*` convention** — Files processed later in the run (MCP tools, summary-manager, context-integrator) use shorter prefixes (`mcp.*`, `summary.*`, `context.*`). Schema evolution would have enforced naming consistency by making earlier files' span names visible to later files — but schema evolution was broken (orb issue #1).

3. **SCH-002: 11 ad-hoc attributes not in registry** — All follow the `commit_story.*` namespace convention but were never pre-registered. Schema evolution would have added these to the registry progressively — but the extension parser silently rejected all extensions. The ad-hoc attributes are semantically valid domain concepts; the gap is in the registration machinery, not the agent's attribute choices.
