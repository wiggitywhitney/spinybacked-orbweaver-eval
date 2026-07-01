# Run-3 Per-File Evaluation

Systematic evaluation of all 21 files against the full 31-rule code-level rubric.

**Evaluation date**: 2026-03-13
**Branches evaluated**: `orb/instrument-1773434669510` (main run), `orb/instrument-1773438620295` (supplemental)
**Baseline**: main branch (`dd3a6db`)
**Rubric**: `spinybacked-orbweaver/research/evaluation-rubric.md` (31 rules)

## File Classification

| Category | Count | Files |
|----------|-------|-------|
| **Instrumented (with spans)** | 11 | claude-collector, git-collector, guidelines/index, index, message-filter, token-filter, mcp/server, context-capture-tool, reflection-tool, journal-paths, commit-analyzer |
| **Zero-span (correct skip)** | 6 | accessibility, anti-hallucination, dialogue-prompt, summary-prompt, technical-decisions-prompt, config |
| **Failed** | 4 | journal-graph, sensitive-filter, context-integrator, journal-manager |

---

## Gate Checks (4/4 Pass)

### NDS-001 | pass | (per-run) | `node --check` passes on all 11 instrumented files

All instrumented files on both orb branches pass syntax validation with `node --check`.

### NDS-002 | pass | (per-run) | 320/320 tests pass (100% passed, 0% skipped, 0% failed)

Full test suite passes on `orb/instrument-1773434669510` branch. 11 test files, 320 tests, all green. The agent's instrumentation introduced no behavioral regressions.

### NDS-003 | pass | (per-file, all 11) | All diffs contain only instrumentation additions

Every diff across all 11 instrumented files contains only:
- Import additions (`import { trace, SpanStatusCode } from '@opentelemetry/api'`)
- Tracer acquisition (`const tracer = trace.getTracer(...)`)
- `startActiveSpan` wrappers with try/catch/finally
- `span.setAttribute` / `span.recordException` / `span.setStatus` / `span.end` calls
- Re-indentation of existing code within span callbacks

No business logic was modified, removed, or reordered.

### API-001 | pass | (per-file, all 11) | All imports resolve to `@opentelemetry/api` only

Every instrumented file imports exclusively from `@opentelemetry/api`. No SDK, exporter, or instrumentation package imports in source files.

---

## Quality Rules — Dimension 1: Non-Destructiveness (NDS)

### NDS-004 | pass | (per-file, all 11) | Public API signatures preserved

All exported function signatures are unchanged:
- `collectChatMessages(repoPath, commitTime, previousCommitTime)` — same
- `getPreviousCommitTime(commitRef)`, `getCommitData(commitRef)` — same
- `getAllGuidelines()` — same
- `filterMessages(messages)` — same
- `truncateMessages(messages, maxTokens)`, `applyTokenBudget(context, options)` — same
- `registerContextCaptureTool(server)`, `registerReflectionTool(server)` — same
- `ensureDirectory(filePath)` — same
- `getChangedFiles(commitRef)`, `isMergeCommit(commitRef)`, `getCommitMetadata(commitRef)` — same

### NDS-005 | pass | (per-file, all 11) | Error handling behavior preserved

Pre-existing error handling in 4 files reviewed:
- **git-collector.js**: `runGit` try/catch preserved — same error.code === 128 checks, same throws. Agent added `span.recordException` + `span.setStatus` at top of catch block, then existing logic runs unchanged.
- **context-capture-tool.js**: Handler try/catch preserved inside new span callback wrapper. Same error message in catch.
- **reflection-tool.js**: Same pattern as context-capture-tool.js.
- **commit-analyzer.js**: `getChangedFiles` and `isMergeCommit` catch-and-return-default preserved. `getCommitMetadata` catch-and-rethrow preserved.

No restructuring, reordering, or merging of error handling blocks.

---

## Quality Rules — Dimension 2: Coverage (COV)

### COV-001 | pass | (per-instance) | All entry points have spans

| Entry Point | File | Span Name |
|-------------|------|-----------|
| CLI main() | src/index.js | `commit_story.generate_journal_entry` |
| MCP server main() | src/mcp/server.js | `mcp.server.main` |
| MCP context capture handler | src/mcp/tools/context-capture-tool.js | `journal_capture_context` |
| MCP reflection handler | src/mcp/tools/reflection-tool.js | `journal_add_reflection` |

### COV-002 | pass | (per-instance) | All outbound calls in instrumented files have spans

| Outbound Call | File | Enclosing Span |
|--------------|------|----------------|
| `execFileAsync('git', ...)` | git-collector.js | `git.runCommand` |
| `execFileSync('git', ...)` x3 | commit-analyzer.js | `commit_story.get_changed_files`, `is_merge_commit`, `get_commit_metadata` |
| `mkdir` + `appendFile` | context-capture-tool.js | `saveContext` |
| `mkdir` + `appendFile` | reflection-tool.js | `saveReflection` |
| `mkdir` | journal-paths.js | `ensureDirectory` |

**Note**: The most significant outbound call (LLM API via LangChain in journal-graph.js) is in a failed file — not evaluated here but a major coverage gap for the overall run.

### COV-003 | pass | (per-instance) | All failable operations have error visibility

All 18 spans have error recording. Pattern used:

| Pattern | Count | Files |
|---------|-------|-------|
| `recordException(error)` + `setStatus(ERROR)` | 16 | All except commit-analyzer.js catch-without-variable |
| `setStatus(ERROR)` only | 2 | commit-analyzer.js (getChangedFiles, isMergeCommit) — original code swallows errors without capturing error variable |

### COV-004 | pass | (per-instance) | All async/I/O operations have spans

All async functions performing I/O are covered. Internal async helpers (getCommitMetadata, getCommitDiff, getMergeInfo in git-collector.js) are correctly not spanned — their I/O calls go through `runGit` which has its own span, and adding spans would violate RST-004.

### COV-005 | pass | (per-instance) | Domain-specific attributes present

Registry attribute coverage per span:

| Span | Registry Attributes Set | Missing |
|------|------------------------|---------|
| `commit_story.collect_chat_messages` | context.source, time_window_start/end, sessions_count, messages_count | — |
| `git.runCommand` | — | Uses ad-hoc `commit_story.git.subcommand` (see SCH-002) |
| `git.getPreviousCommitTime` | vcs.ref.head.revision | — |
| `git.getCommitData` | vcs.ref.head.revision, context.source, commit.author/message/timestamp | — |
| `commit_story.generate_journal_entry` | vcs.ref.head.revision, context.messages_count, journal.file_path, commit.timestamp | journal.entry_date, journal.sections (not set) |
| `commit_story.filter_messages` | filter.type, filter.messages_before/after | — |
| `truncateMessages` | filter.type, messages_before/after, tokens_before/after | — |
| `applyTokenBudget` | filter.type, messages_before/after, tokens_before/after | — |
| `mcp.server.main` | context.source | — |
| `saveContext` / `journal_capture_context` | context.source, journal.file_path | — |
| `saveReflection` / `journal_add_reflection` | journal.file_path | — |
| `ensureDirectory` | journal.file_path | — |
| `commit_story.get_changed_files` | vcs.ref.head.revision | commit.files_changed (not set) |
| `commit_story.is_merge_commit` | vcs.ref.head.revision | Uses ad-hoc `commit_story.commit.parent_count` (see SCH-002) |
| `commit_story.get_commit_metadata` | vcs.ref.head.revision, commit.message/author/timestamp | — |

### COV-006 | pass | (per-instance, instrumented files only) | No manual spans where auto-instrumentation preferred

None of the 11 successfully instrumented files use libraries with available auto-instrumentation. The COV-006 concern (manual spans on LangChain/LangGraph operations) applies to journal-graph.js which failed instrumentation entirely.

**Note for run-4**: journal-graph.js uses `@langchain/langgraph` which has auto-instrumentation via `@traceloop/instrumentation-langchain`. If the agent adds manual spans instead, that's a COV-006 failure.

---

## Quality Rules — Dimension 3: Restraint (RST)

### RST-001 | pass | (per-instance) | No spans on utility functions

No spans were added to synchronous, short, unexported, no-I/O functions. All instrumented functions are either exported, async, or perform I/O.

### RST-002 | pass | (per-instance) | No spans on trivial accessors

No get/set accessors or trivial property accessor methods exist in instrumented files.

### RST-003 | pass | (per-instance) | No duplicate spans on thin wrappers

No instrumented function is a thin wrapper (single return calling another function).

### RST-004 | pass | (per-instance) | No spans on internal implementation details

Unexported functions with spans are all I/O-exempt:
- `runGit` (git-collector.js) — `execFileAsync` I/O
- `saveContext` (context-capture-tool.js) — `mkdir` + `appendFile` I/O
- `saveReflection` (reflection-tool.js) — `mkdir` + `appendFile` I/O
- `main()` (index.js, mcp/server.js) — entry points with I/O

### RST-005 | N/A | No prior instrumentation existed

---

## Quality Rules — Dimension 4: API-Only Dependency (API)

### API-002 | fail | package.json | Agent made `@opentelemetry/api` optional, contradicting unconditional imports

The agent added to `peerDependenciesMeta`:
```json
"@opentelemetry/api": { "optional": true }
```
All 11 source files have unconditional `import { trace, SpanStatusCode } from '@opentelemetry/api'`. If the peer isn't installed, every instrumented file crashes on import. `@opentelemetry/api` was correctly a required peerDependency before the agent ran — the agent regressed this.

### API-003 | fail | package.json | Vendor mega-bundle `@traceloop/node-server-sdk` added as peerDependency

The agent added:
```json
"@traceloop/node-server-sdk": "^0.22.8"  // in peerDependencies (optional)
```
This is the Traceloop mega-bundle (same issue as run-2, spinybacked-orbweaver #61). If auto-instrumentation is needed, individual `@opentelemetry/instrumentation-*` packages or `@traceloop/instrumentation-langchain` should be used instead.

### API-004 | pass | (per-file, all 11) | No SDK-internal imports in source files

All source files import only from `@opentelemetry/api`. The SDK init file (`src/instrumentation.js`) was not modified by the agent.

---

## Quality Rules — Dimension 5: Schema Fidelity (SCH)

### SCH-001 | fail | (per-instance) | 4+ inconsistent span naming conventions

The Weaver schema does not define operation/span names, so this falls back to naming quality mode. 18 spans use at least 4 distinct naming patterns:

| Pattern | Count | Examples |
|---------|-------|---------|
| `commit_story.snake_case` | 6 | `commit_story.collect_chat_messages`, `commit_story.generate_journal_entry` |
| `git.camelCase` | 3 | `git.runCommand`, `git.getPreviousCommitTime` |
| Bare `camelCase` | 6 | `getAllGuidelines`, `truncateMessages`, `saveContext` |
| `journal_snake_case` | 2 | `journal_capture_context`, `journal_add_reflection` |
| `mcp.dotted` | 1 | `mcp.server.main` |

Inconsistent naming fragments trace analysis. A single convention should be used project-wide.

### SCH-002 | fail | (per-instance, 2/17 attribute keys not in registry) | Ad-hoc attributes not in Weaver schema

```text
SCH-002 | fail | src/collectors/git-collector.js:24 | Attribute key `commit_story.git.subcommand` not in Weaver registry
SCH-002 | fail | src/utils/commit-analyzer.js:94 | Attribute key `commit_story.commit.parent_count` not in Weaver registry
```

15/17 attribute keys match the registry (88%). The 2 ad-hoc attributes capture useful data but should be added to the schema if they're valuable.

### SCH-003 | pass | (per-instance) | Attribute values conform to registry types

All enum attributes use valid members:
- `commit_story.context.source`: 'claude_code', 'git', 'mcp' — all valid
- `commit_story.filter.type`: 'noise_removal', 'token_budget' — all valid

All string/int attributes use correct types per registry definitions.

### SCH-004 | pass | (per-instance) | No redundant schema entries

The 2 ad-hoc attributes (`commit_story.git.subcommand`, `commit_story.commit.parent_count`) capture genuinely new concepts not covered by existing registry entries. No string/token similarity matches to existing registry attributes.

---

## Quality Rules — Dimension 6: Code Quality (CDQ)

### CDQ-001 | pass | (per-instance, all 18 spans) | Spans closed in all code paths

All 18 spans use `startActiveSpan` callback pattern with `finally { span.end(); }`. No span leaks possible.

### CDQ-002 | pass | (per-file, all 11) | Tracer acquired correctly

All files use `trace.getTracer('...')` with a library name string argument. Every file has exactly one tracer acquisition at module scope.

### CDQ-003 | fail | (per-instance, 2/18 missing recordException) | Incomplete error recording in commit-analyzer.js

```text
CDQ-003 | fail | src/utils/commit-analyzer.js:42 | getChangedFiles catch block uses only setStatus(ERROR), missing recordException — error object not captured
CDQ-003 | fail | src/utils/commit-analyzer.js:92 | isMergeCommit catch block uses only setStatus(ERROR), missing recordException — error object not captured
```

16/18 spans use the full pattern (`recordException` + `setStatus`). The 2 failures preserve the original catch-without-error-variable pattern, which is correct for NDS-005 but means the agent couldn't record the exception object. The agent could have changed `catch {` to `catch (error) {` to enable `recordException` without breaking behavior — this is a missed opportunity.

### CDQ-005 | pass | (per-instance) | Async context maintained

All 18 spans use `startActiveSpan` which automatically manages async context via the callback pattern. No manual `context.with()` needed.

### CDQ-006 | pass | (per-instance) | No expensive attribute computation unguarded

All `setAttribute` calls use simple property access or lightweight type conversions (`.toISOString()`, `String()`). No `JSON.stringify`, `.map`/`.reduce` chains, or other expensive computations.

### CDQ-007 | fail | (per-instance, 2 instances) | PII attribute: commit author name

```text
CDQ-007 | fail | src/collectors/git-collector.js:166 | setAttribute('commit_story.commit.author', metadata.author) records person name as telemetry attribute
CDQ-007 | fail | src/utils/commit-analyzer.js:159 | setAttribute('commit_story.commit.author', author) records person name as telemetry attribute
```

`commit_story.commit.author` is defined in the Weaver registry — this is a schema design decision, not an agent invention. However, the CDQ-007 rule flags PII regardless of source. The agent correctly followed the schema but the schema itself has a PII concern.

### CDQ-008 | fail | (per-run) | Two tracer naming conventions across 11 files

| Convention | Files (7) | Files (4) |
|-----------|-----------|-----------|
| `commit_story` (underscore) | claude-collector, guidelines/index, index, message-filter, token-filter, reflection-tool, commit-analyzer | — |
| `commit-story` (hyphen) | — | git-collector, mcp/server, context-capture-tool, journal-paths |

Same finding as run-2 (spinybacked-orbweaver #64). The agent uses inconsistent tracer names across files.

---

## Zero-Span Files (6 files — all correctly skipped)

| File | Content Type | Skip Reason | RST Assessment |
|------|-------------|-------------|----------------|
| `src/generators/prompts/guidelines/accessibility.js` | String constant | No functions, no I/O | Correct: RST-001, RST-004 |
| `src/generators/prompts/guidelines/anti-hallucination.js` | String constant | No functions, no I/O | Correct: RST-001, RST-004 |
| `src/generators/prompts/sections/dialogue-prompt.js` | String constant | No functions, no I/O | Correct: RST-001, RST-004 |
| `src/generators/prompts/sections/summary-prompt.js` | String constant + composition | Template assembly, no I/O | Correct: RST-001, RST-004 |
| `src/generators/prompts/sections/technical-decisions-prompt.js` | String constant | No functions, no I/O | Correct: RST-001, RST-004 |
| `src/utils/config.js` | Config initialization | env var read + Object.freeze, no callable spans | Correct: RST-001 |

All 6 skips are correct. These files contain either string constants, prompt templates, or simple config initialization — none have instrumentable operations.

---

## Failed Files (4 files)

Root causes documented in `evaluation/run-3/orb-issues-to-file.md`. Summary:

| File | Failure Mode | Root Cause | Orb Issues |
|------|-------------|------------|------------|
| **journal-graph.js** | Oscillation detected | 500+ line file, agent couldn't produce valid instrumentation. Supplemental run with 150K token budget also failed. Oscillation = repeated validation failures without convergence. | #6 (oscillation lacks detail), #9 (no function-level instrumentation) |
| **sensitive-filter.js** | Null parsed_output | LLM returned no structured output on all 3 attempts. Theory: regex patterns may cause JSON escaping issues in LLM response. 236 lines, should be a simple file. | #2 (null output diagnostics), #11 (specific file failure) |
| **context-integrator.js** | NDS-003 validation failure | Agent tried to extract `const windowStart = ...` — a necessary refactor to instrument properly, but NDS-003 blocks it. | #4 (NDS-003 blocks valid refactors) |
| **journal-manager.js** | NDS-003 x5 + COV-003 x3 | Agent made 5 non-instrumentation changes and 3 incomplete error recordings. Heavy restructuring was needed to instrument this file. | #4 (NDS-003 blocks valid refactors) |

---

## PR Artifact Evaluation

### What happened

Git push failed after 35.7 minutes of instrumentation work:

```text
Push failed — skipping PR creation: Pushing to https://github.com/wiggitywhitney/commit-story-v2-eval.git
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/wiggitywhitney/commit-story-v2-eval.git/'
```

### Root cause

The orb agent used HTTPS URL for push (expects username/password auth), but GitHub requires token auth for HTTPS or SSH key auth. The `vals exec` environment provides the Anthropic API key but not GitHub credentials. The agent should have validated GitHub push access before processing 21 files.

### What was lost

- PR description and summary (how the agent presents its work to reviewers)
- Reviewer-facing change narrative
- Automated PR checks (CI, linting)
- The PR as an evaluation artifact

### What's recoverable

The instrumented code IS available on local branches (`orb/instrument-1773434669510`, `orb/instrument-1773438620295`). A PR could be manually created. The PR description content is NOT recoverable — it was generated in the agent's session and not saved locally.

### Prevention for run-4

See orb issues #12 (validate GitHub token at startup) and #13 (save PR summary locally before pushing).

---

## Structured Evaluation Output

All findings in rubric-specified format:

```text
NDS-001 | pass | (per-run) | node --check passes on all 11 instrumented files
NDS-002 | pass | (per-run) | 320/320 tests pass
NDS-003 | pass | (per-file, all 11) | Only instrumentation additions in all diffs
API-001 | pass | (per-file, all 11) | All imports resolve to @opentelemetry/api
NDS-004 | pass | (per-file, all 11) | All exported function signatures unchanged
NDS-005 | pass | (per-file, all 11) | Pre-existing error handling preserved
COV-001 | pass | (per-instance, 4/4) | All entry points have spans
COV-002 | pass | (per-instance) | All outbound calls in instrumented files have spans
COV-003 | pass | (per-instance) | All failable operations have error visibility
COV-004 | pass | (per-instance) | All async/I/O operations have spans
COV-005 | pass | (per-instance) | Domain-specific registry attributes present
COV-006 | pass | (per-instance) | No manual spans where auto-instrumentation preferred
RST-001 | pass | (per-instance) | No spans on utility functions
RST-002 | pass | (per-instance) | No trivial accessor spans
RST-003 | pass | (per-instance) | No thin wrapper spans
RST-004 | pass | (per-instance) | Internal functions with spans all have I/O exemption
RST-005 | N/A  | No prior instrumentation existed
API-002 | fail | package.json | @opentelemetry/api made optional in peerDependenciesMeta — contradicts unconditional imports
API-003 | fail | package.json | @traceloop/node-server-sdk vendor mega-bundle added as peerDependency
API-004 | pass | (per-file, all 11) | No SDK-internal imports in source files
SCH-001 | fail | (per-instance) | 4+ inconsistent span naming conventions across 18 spans
SCH-002 | fail | src/collectors/git-collector.js:24 | Attribute key commit_story.git.subcommand not in registry
SCH-002 | fail | src/utils/commit-analyzer.js:94 | Attribute key commit_story.commit.parent_count not in registry
SCH-003 | pass | (per-instance) | All attribute values conform to registry types
SCH-004 | pass | (per-instance) | No redundant attributes (ad-hoc keys are genuinely new concepts)
CDQ-001 | pass | (per-instance, 18/18) | All spans closed in finally blocks
CDQ-002 | pass | (per-file, all 11) | All tracers have library name argument
CDQ-003 | fail | src/utils/commit-analyzer.js:42 | getChangedFiles: only setStatus(ERROR), missing recordException
CDQ-003 | fail | src/utils/commit-analyzer.js:92 | isMergeCommit: only setStatus(ERROR), missing recordException
CDQ-005 | pass | (per-instance) | All spans use startActiveSpan (auto context)
CDQ-006 | pass | (per-instance) | No expensive attribute computations
CDQ-007 | fail | src/collectors/git-collector.js:166 | commit_story.commit.author records person name (PII) — registry-defined
CDQ-007 | fail | src/utils/commit-analyzer.js:159 | commit_story.commit.author records person name (PII) — registry-defined
CDQ-008 | fail | (per-run) | Two tracer naming conventions: commit_story (7 files) vs commit-story (4 files)
```

---

## Summary

### Gates: 4/4 pass

### Quality Rules: 19/26 applicable pass (73%)

| Dimension | Pass | Fail | N/A | Score |
|-----------|------|------|-----|-------|
| Non-Destructiveness (NDS) | 2 | 0 | 0 | 2/2 (100%) |
| Coverage (COV) | 6 | 0 | 0 | 6/6 (100%) |
| Restraint (RST) | 4 | 0 | 1 | 4/4 (100%) |
| API-Only Dependency (API) | 1 | 2 | 0 | 1/3 (33%) |
| Schema Fidelity (SCH) | 2 | 2 | 0 | 2/4 (50%) |
| Code Quality (CDQ) | 4 | 3 | 0 | 4/7 (57%) |
| **Total** | **19** | **7** | **1** | **19/26 (73%)** |

### Key Failures

1. **API-002**: Made `@opentelemetry/api` optional (regression from pre-instrumentation state)
2. **API-003**: Added vendor mega-bundle `@traceloop/node-server-sdk` (repeat from run-2)
3. **SCH-001**: 4+ inconsistent span naming patterns
4. **SCH-002**: 2 ad-hoc attribute keys not in Weaver registry
5. **CDQ-003**: 2 spans missing `recordException` (only `setStatus`)
6. **CDQ-007**: PII (person name) in `commit_story.commit.author` attribute (schema-defined)
7. **CDQ-008**: Inconsistent tracer names — `commit_story` vs `commit-story` (repeat from run-2)
