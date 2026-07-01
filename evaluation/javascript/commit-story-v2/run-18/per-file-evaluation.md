# Per-File Evaluation — Run-18

**Date**: 2026-05-16
**Branch**: spiny-orb/instrument-1778932891597
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 30 (11 committed + 4 failed + 15 correct skips)
**Methodology**: D-2 — one agent per committed file, one batch agent for correct skips

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | All 11 committed files passed `node --check` (spiny-orb validator exits 0 on committed output) |
| NDS-002 (Tests) | **PASS** | 565 tests pass (verified during push-hook run: 26 files, 565 tests, 0 failures) |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api` in peerDependencies at `^1.9.0` (unchanged from prior runs) |
| API-003 | **PASS** | No vendor-specific SDKs in dependencies |
| API-004 | **PASS** | No SDK-internal imports in src/ (all OTel usage via `@opentelemetry/api`) |
| CDQ-008 | **PASS** | All committed files use `trace.getTracer('commit-story')` consistently |

---

## Committed Files (11)

### 1. collectors/claude-collector.js (1 span, 2 attempts)

The file exports eight functions: one async (`collectChatMessages`) and seven sync helpers. The committed instrumentation wraps `collectChatMessages` with a single span, correctly skipping all sync helpers per RST-001.

The span name changed from run-17's `commit_story.context.collect_messages` back to `commit_story.context.collect_chat_messages`. Attempt 1 introduced NDS-003 (multi-line function signature collapsed); attempt 2 restored correctly.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original multi-line signature preserved verbatim on attempt 2 |
| NDS-004 | PASS — parameter list unchanged |
| NDS-005 | PASS — original had no try/catch; new catch always rethrows |
| NDS-006 | PASS — all JSDoc and inline comments preserved |
| API-001 | PASS — `@opentelemetry/api` only |
| COV-001 | PASS — `collectChatMessages` (sole exported async function) has span |
| COV-003 | PASS — catch calls `recordException`, `setStatus(ERROR)`, `throw error` |
| COV-004 | PASS — `collectChatMessages` is the only exported async; 7 sync helpers correctly skipped |
| COV-005 | PASS — `source`, `time_window_start/end`, `sessions_count`, `messages_count` set |
| RST-001 | PASS — all 7 sync helpers skipped |
| RST-004 | PASS — no spans on unexported helpers |
| SCH-001 | PASS — `commit_story.context.collect_chat_messages` declared as schema extension |
| SCH-002 | PASS — all 5 attributes are registered schema keys |
| SCH-003 | PASS — counts are int from .size/.length; timestamps via .toISOString() (string) |
| CDQ-001 | PASS — `span.end()` in `finally`; covers early null-return and error paths |
| CDQ-002 | PASS — `startActiveSpan` callback pattern; no manual context propagation |
| CDQ-003 | PASS — no redundant `span.end()` |
| CDQ-005 | PASS — `startActiveSpan` used |
| CDQ-006 | PASS — no unbounded user input in attributes |
| CDQ-007 | PASS — `!= null` guards on sessions/allMessages; unnecessary but harmless |

**Failures**: None

---

### 2. collectors/git-collector.js (2 spans, 3 attempts)

**RUN17-3 RESOLVED**: `getCommitData` now has a span (was missing in runs 8–17). Both exported async functions (`getPreviousCommitTime`, `getCommitData`) are instrumented. Four unexported helpers correctly excluded per RST-001/RST-004.

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No structural changes; only span wrappers added around existing logic |
| NDS-004 | PASS | No function signatures altered |
| NDS-005 | PASS | `runGit`'s existing error handling untouched; new span wrappers add catch that records and rethrows |
| NDS-006 | PASS | All original comments preserved |
| API-001 | PASS | `@opentelemetry/api` only |
| COV-001 | PASS | Both exported async functions have entry-point spans |
| COV-003 | PASS | No outbound HTTP/DB calls in this file |
| COV-004 | PASS | Both exported async functions have spans; 4 unexported helpers correctly excluded |
| COV-005 | PASS | `vcs.ref.head.revision`, `commit_story.commit.timestamp` (ISO), `commit_story.commit.author`, `commit_story.commit.message` |
| RST-001 | PASS | `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` — unexported and sync-pattern |
| RST-004 | PASS | Unexported helper skipping consistent |
| SCH-001 | PASS | Both span names declared as schema extensions |
| SCH-002 | PASS | All attributes registered (OTel VCS + custom commit attrs) |
| SCH-003 | PASS | `commit_story.commit.timestamp` via `.toISOString()` (string); author/message already strings |
| CDQ-001 | PASS | Both spans closed in `finally` blocks |
| CDQ-002 | PASS | No redundant `span.end()` |
| CDQ-003 | PASS | No debug statements added |
| CDQ-005 | PASS | No duplicate `span.end()` |
| CDQ-006 | PASS | `SpanStatusCode.ERROR` set on error path only |
| CDQ-007 | PASS | `commitRef` non-null param; timestamp guarded by early-return; `metadata.author/subject` always populated |

**Failures**: None. **RUN17-3 status: RESOLVED** — `getCommitData` span confirmed present.

---

### 3. generators/journal-graph.js (4 spans, 2 attempts)

**RUN17-2 RESOLVED**: File committed successfully (4 spans). In run-17 this file FAILED with NDS-003 content corruption. `formatChatMessages` template literal and all closing braces confirmed intact.

Four exported async functions each receive one span. Thirteen sync helpers and unexported utilities correctly skipped. Inner graceful-degradation catches in the three node functions preserved per NDS-005.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — `formatChatMessages` function and all closing braces intact; no business logic removed |
| NDS-004 | PASS — all 4 async function signatures unchanged |
| NDS-005 | PASS — original graceful-degradation catches in node functions preserved inside `startActiveSpan` callbacks |
| NDS-006 | PASS — all JSDoc blocks and inline comments preserved |
| API-001 | PASS — `@opentelemetry/api` only |
| COV-001 | PASS — all 4 exported async functions have entry-point spans |
| COV-003 | PASS — `generateJournalSections` catch records exception + sets ERROR + rethrows; node function catches are original graceful-degradation (NDS-005) |
| COV-004 | PASS — all 4 exported async functions instrumented; 13 sync helpers correctly skipped |
| COV-005 | PASS — `commit_story.ai.section_type`, `gen_ai.operation.name`, `gen_ai.request.temperature` on nodes; `commit_story.journal.sections` on orchestrator |
| RST-001 | PASS — all 13 sync helpers and sync exports correctly skipped |
| RST-004 | PASS — no internal detail spans |
| SCH-001 | PASS — all 4 span names follow `commit_story.<category>.<operation>` convention |
| SCH-002 | PASS — all attributes are registered schema keys or OTel GenAI refs |
| SCH-003 | PASS — `section_type` enum matches registered members; `temperature` numeric; `sections` string array |
| CDQ-001 | PASS — `span.end()` in `finally` on all 4 spans |
| CDQ-002 | PASS — `startActiveSpan` callback pattern throughout |
| CDQ-003 | PASS — no redundant `span.end()` |
| CDQ-005 | PASS — `startActiveSpan` with async callbacks |
| CDQ-006 | PASS — no unbounded user input in attributes |
| CDQ-007 | PASS — `gen_ai.usage.input_tokens/output_tokens` guarded by `result.usage_metadata != null`; `sections` is literal array constant |

**Failures**: None. **RUN17-2 status: RESOLVED** — template literal content confirmed intact.

---

### 4. integrators/context-integrator.js (1 span, 3 attempts)

One exported async function (`gatherContextForCommit`) receives a span. Two sync helpers correctly skipped. All nullable fields guarded with explicit `!= null` checks before setAttribute — superior CDQ-007 handling compared to run-17's journal-manager failure.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — original had no try/catch; new catch rethrows |
| NDS-006 | PASS |
| API-001 | PASS — `@opentelemetry/api` only |
| COV-001 | PASS — `gatherContextForCommit` span added |
| COV-003 | PASS — catch records + sets ERROR + rethrows |
| COV-004 | PASS — sole exported async; 2 sync helpers skipped |
| COV-005 | PASS — 7 domain attributes covering filter counts, session counts, commit metadata, VCS ref |
| RST-001 | PASS — 2 sync helpers skipped |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.context.gather_for_commit` declared as extension |
| SCH-002 | PASS — all attributes registered |
| SCH-003 | PASS — counts are int from .length/.size; timestamps via .toISOString() |
| CDQ-001 | PASS — `span.end()` in `finally` |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — `!= null` guards on `commitData`, `filterStats`, `filteredMessages`, `filteredSessions` |

**Failures**: None.

---

### 5. managers/auto-summarize.js (3 spans, 2 attempts)

Three exported async functions all instrumented. `getErrorMessage` (unexported, sync) correctly skipped. Count attributes guarded with `!= null` checks. Attempt 1 had NDS-003 (multi-line collapse); attempt 2 corrected.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — committed code passed validator; multi-line imports and return object restored |
| NDS-004 | PASS — multi-line parameter signature preserved |
| NDS-005 | PASS — inner for-loop graceful-degradation catches preserved |
| NDS-006 | PASS |
| API-001 | PASS |
| COV-001 | PASS — all 3 exported async functions have spans |
| COV-003 | PASS — all 3 spans have outer catch with recordException + ERROR + rethrow |
| COV-004 | PASS — all 3 exported async; `getErrorMessage` unexported sync, skipped |
| COV-005 | PASS — `day_count`, `week_count`, `month_count` on each respective span |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — 3 new span extensions under `commit_story.summary.trigger_auto_*` |
| SCH-002 | PASS — count attributes registered by summary-manager.js earlier in run |
| SCH-003 | PASS — counts from .length (int) |
| CDQ-001 | PASS |
| CDQ-002 | SKIP |
| CDQ-003 | SKIP |
| CDQ-005 | PASS |
| CDQ-006 | SKIP |
| CDQ-007 | PASS — `!= null` guards on all 3 count setAttribute calls |

**Failures**: None.

---

### 6. managers/journal-manager.js (2 spans, 2 attempts)

Two exported async functions (`saveJournalEntry`, `discoverReflections`) instrumented. `formatJournalEntry` (exported, sync) correctly skipped per RST-001. Ten unexported sync helpers skipped.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — committed code passed validator on attempt 2 |
| NDS-004 | PASS — multi-line `saveJournalEntry` signature preserved |
| NDS-005 | PASS — 3 original catch blocks preserved untouched |
| NDS-006 | PASS |
| API-001 | PASS |
| COV-001 | PASS — both exported async I/O functions have spans |
| COV-003 | PASS — both spans have outer catch with recordException + ERROR + rethrow |
| COV-004 | PASS — both exported async instrumented; `formatJournalEntry` sync, skipped |
| COV-005 | PASS — `file_path`, `commit.timestamp`, `vcs.ref.head.revision` on saveJournalEntry; `time_window_start/end`, `quotes_count` on discoverReflections |
| RST-001 | PASS — 10 sync helpers skipped |
| RST-004 | PASS |
| SCH-001 | PASS — both span names registered as extensions |
| SCH-002 | **FAIL** — `commit_story.journal.quotes_count` is defined in the base registry as "Number of developer quotes extracted for the entry" (journal generation context); used here for `reflections.length` (reflections discovered in a time window — a distinct operation class: reading markdown files, not generating journal content). The attribute semantic definition does not match the value being recorded. Correct attribute: `commit_story.journal.reflections_count` (used in run-17 via agent-extensions.yaml) or a new schema extension. |
| SCH-003 | PASS — `quotes_count` value is `reflections.length` (int, matching `type: int`) |
| CDQ-001 | PASS |
| CDQ-002 | SKIP |
| CDQ-003 | SKIP |
| CDQ-005 | PASS |
| CDQ-006 | SKIP |
| CDQ-007 | ADVISORY — raw `entryPath` for `commit_story.journal.file_path`; `path.basename` not imported; same known limitation as runs 16–17. `commit.hash != null` guard correctly present. |

**Failures**: **SCH-002** — `commit_story.journal.quotes_count` semantically mismatched for reflection discovery. Correct attribute: `commit_story.journal.reflections_count` or a new extension.

---

### 7. managers/summary-manager.js (9 spans, 2 attempts)

**RUN17-1 partial resolution**: All 3 `generateAndSave*` orchestrators now have spans (were silently dropped in run-17 by MIN_STATEMENTS filter). Full COV-004 coverage: 9/9 exported async functions. Trajectory: 3 spans (run-12) → 6 spans (run-17) → 9 spans (run-18).

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | Multi-line signatures restored verbatim; all original code preserved |
| NDS-004 | PASS | Multi-line signatures preserved |
| NDS-005 | PASS | All inner catch blocks preserved (ENOENT swallows, per-day readFile catch, readdir catch, access() short-circuit catches) |
| NDS-006 | PASS | |
| API-001 | PASS | |
| COV-001 | PASS | All 3 generateAndSave* orchestrators have spans — RUN17-1 resolved |
| COV-003 | PASS | All 9 spans: try/catch/finally with recordException + ERROR + rethrow |
| COV-004 | PASS | All 9 exported async functions have spans; 5 sync functions correctly skipped |
| COV-005 | PASS | Read functions: output count; save functions: file_path; orchestrators: date/week/month label + count |
| RST-001 | PASS | 5 sync format/boundary helpers skipped |
| RST-004 | PASS | No unexported async functions in file |
| SCH-001 | PASS | 9 span extensions under `commit_story.summary.*` |
| SCH-002 | PASS | All 5 new attributes correctly typed; no semantic collisions |
| SCH-003 | PASS | Count attributes (int) from .length; label attributes (string) from arguments |
| CDQ-001 | PASS | |
| CDQ-002 | PASS | |
| CDQ-003 | PASS | |
| CDQ-005 | PASS | |
| CDQ-006 | PASS | |
| CDQ-007 | PASS | All counts from .length on initialized arrays; labels are required string args; agent declined null guards correctly |

**Failures**: None.

---

### 8. mcp/server.js (1 span, 1 attempt)

Single span on `main()` entry point (COV-001 override for process entry points). `createServer` (sync factory) skipped. 1-attempt success, structurally identical to run-17.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — only `main()` modified; `createServer` unchanged |
| NDS-004 | PASS |
| NDS-005 | PASS — original had no try/catch; new catch rethrows |
| NDS-006 | PASS |
| API-001 | PASS |
| COV-001 | PASS — `main()` is the async process entry point |
| COV-003 | PASS |
| COV-004 | PASS — `main()` is the only async function; `createServer` sync |
| COV-005 | PASS — `commit_story.mcp.transport` set to `'stdio'` |
| RST-001 | PASS — `createServer` sync |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.mcp.server.start` registered as extension |
| SCH-002 | PASS — `commit_story.mcp.transport` declared as extension |
| SCH-003 | PASS — `'stdio'` is string matching `type: string` |
| CDQ-001 | PASS |
| CDQ-002 | SKIP |
| CDQ-003 | SKIP |
| CDQ-005 | PASS |
| CDQ-006 | SKIP |
| CDQ-007 | PASS — hardcoded string constant; no nullable access |

**Failures**: None.

---

### 9. commands/summarize.js (3 spans, 3 attempts)

Three exported async functions all instrumented. Six sync utilities correctly skipped. Count attributes use schema extensions registered by summary-manager.js earlier in the run.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — validator accepted on committed output |
| NDS-004 | PASS |
| NDS-005 | PASS — inner per-item catches and silent `catch { // Doesn't exist }` preserved |
| NDS-006 | PASS |
| API-001 | PASS |
| COV-001 | PASS — all 3 exported async functions have spans |
| COV-003 | PASS — all 3 spans have outer catch with recordException + ERROR + rethrow |
| COV-004 | PASS — all 3 exported async; 6 sync utilities skipped |
| COV-005 | PASS — `day_count`, `week_count`, `month_count`, `entry_count` on respective spans |
| RST-001 | PASS — 6 sync utilities skipped |
| RST-004 | PASS |
| SCH-001 | PASS — `run_summarize`, `run_weekly_summarize`, `run_monthly_summarize` registered as extensions |
| SCH-002 | PASS — count attributes registered by summary-manager.js |
| SCH-003 | PASS — all counts from .length (int) |
| CDQ-001 | PASS |
| CDQ-002 | SKIP |
| CDQ-003 | SKIP |
| CDQ-005 | PASS |
| CDQ-006 | SKIP |
| CDQ-007 | PASS — all counts from .length on guaranteed non-null arrays |

**Failures**: None.

---

### 10. utils/journal-paths.js (1 span, 1 attempt)

Single span on `ensureDirectory` (sole exported async). Eleven pure sync utilities correctly skipped. 1-attempt success, identical to runs 16–17.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — new catch rethrows; original had no catch |
| NDS-006 | PASS |
| API-001 | PASS |
| COV-001 | PASS — `ensureDirectory` has span |
| COV-003 | PASS |
| COV-004 | PASS — sole exported async; 11 sync utilities skipped |
| COV-005 | PASS — `commit_story.journal.file_path` set |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` declared as extension |
| SCH-002 | PASS — `commit_story.journal.file_path` is registered |
| SCH-003 | PASS — `filePath` is string, matches `type: string` |
| CDQ-001 | PASS |
| CDQ-002 | SKIP |
| CDQ-003 | SKIP |
| CDQ-005 | PASS |
| CDQ-006 | SKIP |
| CDQ-007 | ADVISORY — raw full path (no basename); `path.basename` not imported; same known limitation as runs 16–17 |

**Failures**: None.

---

### 11. utils/summary-detector.js (9 spans, 1 attempt)

All 9 async functions instrumented (5 exported + 4 unexported helpers with independent I/O). Resolves run-12 partial (2 exported functions missed due to API overload). 1-attempt success.

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | Original business logic preserved; wrapping adds only span scaffolding |
| NDS-004 | PASS | `import { trace, SpanStatusCode }` added; no other new imports |
| NDS-005 | PASS | Inner `readdir` try/catch blocks (graceful-degradation) preserved unmodified |
| NDS-006 | PASS | `const tracer = trace.getTracer('commit-story')` at module level |
| API-001 | PASS | `@opentelemetry/api` via `startActiveSpan`; `SpanStatusCode` used |
| COV-001 | PASS | All 5 exported async functions have spans |
| COV-003 | PASS | Every span has try/catch/finally with recordException + ERROR + span.end() |
| COV-004 | PASS | All 9 async functions instrumented, including 4 unexported helpers with standalone I/O |
| COV-005 | PASS | Result count attribute set on every span |
| RST-001 | PASS | `getTodayString` and `getNowDate` sync — correctly skipped |
| RST-004 | PASS | Unexported helpers instrumented per RST-004 permissive reading (standalone I/O) |
| SCH-001 | PASS | All 9 span names use `commit_story.summary.*` prefix; reported as extensions |
| SCH-002 | PASS | Attribute keys reported as schema extensions; no collision with registered names |
| SCH-003 | PASS | All counts from .length/.size (int) |
| CDQ-001 | PASS | No redundant `span.end()` |
| CDQ-002 | PASS | No debug output added |
| CDQ-003 | PASS | No dead code or placeholders |
| CDQ-005 | PASS | `span.recordException(error)` before `setStatus(ERROR)` in every catch |
| CDQ-006 | PASS | All span names are literal strings |
| CDQ-007 | PASS | All attributes from .length/.size on locally constructed arrays/Sets |

**Failures**: None.

---

## Failed Files (4)

All four failed due to the RUN17-1 NDS-003 reconciler offset gap. Agent code was semantically correct in all cases — the validator could not verify it. See `failure-deep-dives.md` for full analysis.

| File | Failure | Validator error |
|------|---------|-----------------|
| generators/summary-graph.js | NDS-003 (2 attempts) | original line 485 missing: `}),` — 6 span wrappers inflate offset |
| mcp/tools/context-capture-tool.js | NDS-003 oscillation (3 attempts) | lines 124–125 missing: `},` and `);` — `saveContext` re-indentation |
| mcp/tools/reflection-tool.js | NDS-003 oscillation (3 attempts) | lines 116–117 missing: `},` and `);` — `saveReflection` re-indentation |
| src/index.js | NDS-003 (2 attempts) | lines 217, 375 missing: `);` and `},` — collapsed multi-line imports |

No rubric assessment for failed files — output was not committed.

---

## Correct Skips (15)

| File | Skip reason | RST-001 verified |
|------|-------------|-----------------|
| generators/prompts/guidelines/accessibility.js | Module-level constant only; no functions | Yes |
| generators/prompts/guidelines/anti-hallucination.js | Module-level constant only; no functions | Yes |
| generators/prompts/guidelines/index.js | One sync function (`getAllGuidelines`); string concatenation only | Yes |
| generators/prompts/sections/daily-summary-prompt.js | One sync function; template string construction | Yes |
| generators/prompts/sections/dialogue-prompt.js | Module-level constant only; no functions | Yes |
| generators/prompts/sections/monthly-summary-prompt.js | One sync function; template string construction | Yes |
| generators/prompts/sections/summary-prompt.js | One sync function; prompt string from boolean params | Yes |
| generators/prompts/sections/technical-decisions-prompt.js | Module-level constant only; no functions | Yes |
| generators/prompts/sections/weekly-summary-prompt.js | One sync function; template string construction | Yes |
| integrators/filters/message-filter.js | All exported functions sync; no I/O | Yes |
| integrators/filters/sensitive-filter.js | All exported functions sync; regex-based only | Yes |
| integrators/filters/token-filter.js | All exported functions sync; in-memory text operations | Yes |
| traceloop-init.js | Top-level init only; no exported functions | Yes |
| utils/commit-analyzer.js | All exports sync; uses `execFileSync` (synchronous) | Yes |
| utils/config.js | Module-level constant only; env var validation at load time | Yes |

All 15 skips confirmed legitimate. Set is identical in composition to runs 12–17.
