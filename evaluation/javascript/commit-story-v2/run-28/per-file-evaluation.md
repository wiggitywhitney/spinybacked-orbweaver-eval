// ABOUTME: Per-file rubric evaluation for run-28 — all 32 files (12 committed, 1 partial, 19 harness-labeled skips).
# Per-File Evaluation — Run-28

**Evaluation date**: 2026-09-17 (run executed 2026-09-17 ~08:32-09:45 — see `run-summary.md`)
**Branch**: spiny-orb/instrument-1789648132789
**Rubric**: NDS 2 (gates) + COV 5 + RST 4 + API 3 + SCH 4 + CDQ 7 = 25 quality rules, plus 2 syntax/test gates
**Files evaluated**: 32 (12 committed + 1 partial + 19 harness-labeled skips — 17 confirmed correct, 2 questionable)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check` exits 0 on all 13 committed/partial files (12 committed + 1 partial), zero syntax failures |
| NDS-002 (Tests) | **PASS** | 630 tests pass, 1 skipped (acceptance-gate test requiring a live API key), 28 of 29 test files fully passing. Run directly against the instrument branch tip (`spiny-orb/instrument-1789648132789`) |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `package.json` `peerDependencies` contains `"@opentelemetry/api": "^1.9.0"` |
| API-003 | **PASS** | `dependencies` contains only `@langchain/anthropic`, `@langchain/core`, `@langchain/langgraph`, `@modelcontextprotocol/sdk`, `@opentelemetry/instrumentation-pino`, `dotenv`, `pino`, `zod` — no vendor-specific observability SDK (grep for `datadog\|dd-trace\|newrelic\|honeycomb` returns nothing) |
| API-004 | **PASS** | Grep for `@opentelemetry/sdk\|@opentelemetry/exporter\|@opentelemetry/resources\|@opentelemetry/instrumentation-[a-z]` in `src/` returns nothing — no file in `src/` imports these directly |
| CDQ-008 | **PASS** | `grep -rn "getTracer" src/` confirms all 13 committed/partial files use `trace.getTracer('commit-story')` with the identical string, no variants |

---

## Committed Files (12)
### 1. collectors/claude-collector.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — span name `commit_story.context.collect_chat_messages` uses consistent dotted `commit_story.context.*` notation |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS — single span, no children, no context-propagation concerns |
| NDS-004 | PASS |
| NDS-007 | PASS — original try/catch/finally structure preserved around `collectChatMessages`; `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` + rethrow, `span.end()` in `finally`; the pre-existing empty `catch { continue; }` inside `parseJSONLFile` (expected control flow for malformed JSON lines) correctly left unmodified |
| COV-001 | PASS — `collectChatMessages` is the sole exported async function and COV-001 entry point, wrapped in `tracer.startActiveSpan('commit_story.context.collect_chat_messages', ...)` |
| COV-003 | PASS — catch block calls `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` before rethrow |
| COV-004 | PASS — `getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `parseJSONLFile`, `filterMessages`, `groupBySession` are all exported but purely synchronous (`existsSync`, `readdirSync`, `statSync`, `readFileSync`); none received spans |
| COV-005 | PASS — 5 domain attributes: `commit_story.context.source`, `time_window_start`, `time_window_end`, `sessions_count`, `messages_count`. **Coverage delta observation**: run-27 had 6 attributes on this span (included `commit_story.context.repo_path`); run-28 drops `repo_path` entirely rather than setting it unsanitized — see CDQ-007 below |
| RST-001 | PASS — the 7 synchronous exported utilities are correctly left unwrapped, matching the agent's own RST-001 reasoning in its notes |
| RST-004 | PASS — not applicable; no unexported async I/O helpers in this file |
| SCH-001 | PASS — all attributes namespaced under `commit_story.context.*`; span name `commit_story.context.collect_chat_messages` also follows the namespace and is registered in `semconv/agent-extensions.yaml` as `span.commit_story.context.collect_chat_messages` |
| SCH-002 | PASS — agent notes confirm all 5 attributes are pre-existing registered keys with 0 new attribute extensions this run (only the span itself is a schema extension); no near-duplicate attribute or span name introduced |
| SCH-003 | PASS — `time_window_start`/`time_window_end` are strings via `.toISOString()`; `sessions_count`/`messages_count` are numbers via `.size`/`.length` on the normal path and literal `0` on the early-return path; `source` is a string literal — no type mismatches |
| CDQ-001 | PASS — single `span.end()` in `finally`, no redundant calls |
| CDQ-002 | PASS — `trace.getTracer('commit-story')` matches project convention |
| CDQ-003 | PASS — `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` before rethrow |
| CDQ-005 | PASS — no nullable-derived attribute values; `source` is a literal, counts are guaranteed numbers (`.size`/`.length` or literal `0`), timestamps are required `Date` parameters with no null branch |
| CDQ-006 | PASS — `isRecording()` guards correctly omitted; agent notes cite the COV-001 entry-point exemption |
| CDQ-007 | PASS — unlike run-27 (which set `commit_story.context.repo_path` to the raw, unsanitized absolute path and scored FAIL), this version never sets a `repo_path`/path-like attribute at all. Agent notes explicitly state the reasoning: "For `repoPath`, there's no registered attribute key in the schema, so per CDQ-007 I'll leave it unset rather than introduce an unregistered attribute." No PII or raw-path attribute anywhere in this span — this resolves the RUN27 finding for this specific file by omission rather than by adding a `basename()` fix |

**Failures**: None.

**Note on RUN27-4/prior CDQ-007 pattern**: This file was one of the files carrying the raw-`repo_path` CDQ-007 failure in run-27. In run-28 the attribute is dropped entirely rather than sanitized with `basename()` — a different resolution path than the `basename()`/inline-split fix applied elsewhere in this run, but it satisfies CDQ-007 by avoiding the unregistered/unsanitized attribute altogether. No live Datadog trace query was run for this file (MCP Datadog tools were unavailable in this subagent's session); source-level review is the sole evidence basis above.
### 2. collectors/git-collector.js (6 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — span names use consistent `commit_story.git.*` / `commit_story.git.get_*` dotted notation across all 6 spans |
| API-001 | PASS — imports `trace`, `SpanStatusCode` from `@opentelemetry/api`; `tracer.startActiveSpan` used correctly in all six instrumented functions, each with `span.end()` in a `finally` |
| NDS-006 | PASS — no span-kind or context-propagation violations; `get_commit_metadata`, `get_commit_diff`, `get_merge_info` nest correctly under `get_commit_data` via `Promise.all`; `commit_story.git.run` nests under each of its three callers |
| NDS-004 | PASS |
| NDS-007 (Control Flow Preserved) | PASS — unlike run-27 (which needed 1 retry after an initial split-catch regression), this run's `runGit` (lines 12-46) has a single try/catch on attempt 1 with `recordException`/`setStatus` added at the top of the original catch and all original conditional throws (`Not a git repository`, `Invalid commit reference: ...`) left in their original positions/order — log confirms "Attempt 1: 0 errors" |
| COV-001 | PASS — both exported entry points (`getPreviousCommitTime`, `getCommitData`) are spanned |
| COV-003 (Error Recording) | PASS — all 6 spans' catch blocks call `recordException` + `setStatus({code: ERROR})` before rethrow, confirmed by direct read of all six functions |
| COV-004 | PASS — all four internal helpers (`runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo`) are spanned in addition to the two exported functions — full coverage |
| COV-005 | PASS — all 6 spans carry a domain-specific attribute beyond `vcs.ref.head.revision`: `run` (`commit_story.git.operation`), `get_commit_metadata` (`commit_story.commit.author/.message/.timestamp`), `get_commit_diff` (`commit_story.git.diff_size`), `get_merge_info` (`commit_story.git.is_merge`, `.parent_count`), `get_previous_commit_time` (`commit_story.git.has_previous_commit`), `get_commit_data` (author/message/timestamp again). Improvement over run-27's 4-of-6 |
| RST-001 | PASS — no sync utilities in this file requiring spans |
| RST-004 | PASS — moot; all four unexported async helpers received spans, no exemption needed |
| SCH-001 | PASS (advisory only) — 3 non-blocking SCH-001 advisories fired per the instrumentation report (span-name-similarity), explicitly advisory; final span names are consistent and correctly dotted |
| SCH-002 (Attribute Keys Match Registry) | PASS — but flagged: unlike run-27 (where `commit_story.git.is_merge` was blocked as a semantic duplicate of `parent_count` and dropped entirely), this run's validator did **not** flag the identical `is_merge`/`parent_count` pair — both ship together in the committed code with 0 blocking errors on attempt 1. Same attribute pair, opposite outcome across runs — a validator consistency gap worth flagging for the handoff, not a rubric violation on its own |
| SCH-003 (type correctness) | **FAIL** — `commit_story.git.is_merge` is declared `boolean` in `semconv/agent-extensions.yaml` but set via `span.setAttribute('commit_story.git.is_merge', String(parentCount > 1))` (line 152) — a string, not a boolean. Notably, `commit_story.git.diff_size` (the exact attribute that failed SCH-003 in run-27) is **no longer a mismatch this run**: the committed schema extension itself now declares it `type: string` (not `int`), matching the code's `String(result.length)` cast (line ~134) — even though the agent's own instrumentation-report notes still claim "type: int" for it. This suggests the committed schema type is back-derived from whatever the code actually emitted rather than an independently-validated declaration, which would mask true mismatches rather than catch them — worth flagging for the handoff. `commit_story.git.parent_count` (bare number) and `commit_story.git.has_previous_commit` (bare booleans, lines 195/198) are both correctly typed |
| CDQ-001 | PASS — exactly one `span.end()` per span, each in a `finally` block, no redundant calls |
| CDQ-002 | PASS — `SpanStatusCode.ERROR` set consistently on the exception path in all 6 spans |
| CDQ-003 | PASS — errors are recorded via `recordException` then rethrown in every catch; no silent swallowing |
| CDQ-005 | PASS |
| CDQ-006 | PASS — `getCommitData`/`getPreviousCommitTime` (COV-001 entry points) call `.toISOString()` etc. without a guard, correctly exempt per the COV-001 exemption; internal helpers only access simple direct-read variables |
| CDQ-007 | **FAIL** (regression vs run-27) — `commit_story.commit.author` (a person's full name, PII) is set unconditionally at line 78 (`getCommitMetadata`) and again at line 213 (`getCommitData`) with the raw name value. Run-27 explicitly removed this exact attribute in its Attempt 2 after being blocked by the same rule; this run's validator only surfaced it as a non-blocking advisory (confirmed in the instrumentation report's "Advisory Findings": `CDQ-007:78` and `CDQ-007:213`), so it shipped in committed code. `authorEmail` is correctly excluded (not set anywhere), and no filesystem paths appear in this file at all (no CDQ-007 path-sanitization concern applies here) |

**Failures**: SCH-003 — `commit_story.git.is_merge` declared `boolean` but emitted as a string (`String(parentCount > 1)`, line 152). CDQ-007 — `commit_story.commit.author` (raw PII, person's full name) set at lines 78 and 213, a regression from run-27 where the same attribute was removed after being blocked; this run's validator downgraded the same finding to non-blocking advisory.

**Notable cross-run observations for handoff**: (1) the run-27 `diff_size` SCH-003 bug appears resolved, but only because the committed schema's declared type now matches whatever the code emits (`string`), not because the code was fixed to emit a real int — the type-mismatch detection mechanism itself may be unreliable. (2) `is_merge`/`parent_count` were treated as SCH-002 duplicates (blocking) in run-27 but not in run-28, despite identical attribute pairing — inconsistent enforcement. (3) The CDQ-007 PII-author finding was a blocking canonical failure in run-27 (fixed) and has now regressed to an advisory-only, unfixed finding in run-28 for the identical attribute and identical code pattern.

No Datadog MCP query was run (server unavailable in this subagent's session — `commit-story` MCP connection failed to connect); trace corroboration was skipped per the task's "optional" instruction.
### 3. integrators/context-integrator.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — span name `commit_story.context.gather_context_for_commit` uses consistent dotted `commit_story.*` notation, no PII/dynamic values in the name |
| API-001 | PASS — imports only `trace, SpanStatusCode` from `@opentelemetry/api`; `tracer.startActiveSpan('commit_story.context.gather_context_for_commit', async (span) => {...})` with `span.end()` in `finally` |
| NDS-004 | PASS — no span-kind override; default internal kind is correct for this orchestration function |
| NDS-006 | PASS — no explicit context-propagation code needed; child spans from `getCommitData`/`collectChatMessages` (instrumented in their own files) nest automatically via async context |
| NDS-007 | PASS — single `try { ... } catch (error) { span.recordException(error); span.setStatus(...); throw error; } finally { span.end(); }` wrapper added around the pre-existing body; no branching, no swallowed errors, original logic order (including the `previousCommitTime` if/else and the sequential await chain) is unchanged |
| COV-001 | PASS — `gatherContextForCommit`, the sole exported function, is the spanned entry point |
| COV-003 | PASS — `catch` block calls `span.recordException(error)` then `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing `error` |
| COV-004 | PASS — no unspanned async/I/O helpers in the file; `formatContextForPrompt` and `getContextSummary` are the only other functions and are pure sync (RST-001) |
| COV-005 | PASS — 11 `setAttribute` calls carry meaningful domain data: `vcs.ref.head.revision`, `commit_story.commit.author`, `commit_story.commit.message`, `commit_story.commit.timestamp`, `commit_story.git.has_previous_commit`, `commit_story.filter.messages_before`, `commit_story.filter.messages_after`, `commit_story.context.messages_count`, `commit_story.context.sessions_count`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`. (The log's "0 attributes" is `attributesCreated` — new schema extensions — not attributes set in code; all 11 are pre-existing registered keys.) **Behavioral delta vs. run-27**: this version does not set `commit_story.context.repo_path` at all — `repoPath` is only used internally to call `collectChatMessages(repoPath, ...)`, never passed to `setAttribute`. |
| RST-001 | PASS — `formatContextForPrompt` and `getContextSummary` are pure synchronous transforms over an already-built `context` object, correctly left unspanned |
| RST-004 | PASS — moot; no unexported async helper exists in this file |
| SCH-001 | PASS — `span.commit_story.context.gather_context_for_commit` is declared as a `schemaExtension` (confirmed present in `semconv/agent-extensions.yaml`) since no existing schema span covers this top-level orchestration |
| SCH-002 | PASS — `attributesCreated: 0`; all 11 keys verified against `semconv/attributes.yaml`/`agent-extensions.yaml` as pre-existing registered attributes; no near-duplicate invented |
| SCH-003 | PASS — types match registry declarations exactly: `commit.author`/`.message`/`.timestamp` set as raw strings (`.timestamp` via `.toISOString()`) matching declared `string`; `git.has_previous_commit` set via `previousCommitTime != null` producing a real boolean, matching declared `boolean`; `filter.messages_before`/`.messages_after`/`context.messages_count`/`.sessions_count` set as bare numbers matching declared `int` — no `String()` casts anywhere (contrast with `git-collector.js`'s `diff_size`/`is_merge` SCH-003 FAILs) |
| CDQ-001 | PASS — exactly one `span.end()` call, in `finally`, no redundant calls |
| CDQ-002 | PASS — `const tracer = trace.getTracer('commit-story')` at module scope, matching project convention |
| CDQ-003 | PASS — `recordException(error)` + `setStatus({ code: SpanStatusCode.ERROR })` both present in the catch block, ahead of the rethrow |
| CDQ-005 | PASS — no nullable-derived attribute set unconditionally; `commitData.author/message/timestamp` come from an already-resolved object post-`await`; `previousCommitTime != null` is an explicit guarded boolean; `filterStats`/`filteredMessages`/`filteredSessions` are guaranteed-present locals |
| CDQ-006 | PASS — no `isRecording()` guards on this span's `setAttribute` calls; exempt because this is the COV-001 entry-point span |
| CDQ-007 | **FAIL — corrected.** `commit_story.commit.author` (line 45) is set to the raw, unsanitized `commitData.author` — a person's full name, PII. The compound-key naming (`commit_story.commit.author` vs. bare `author`) does not exempt the attribute from CDQ-007; that rule concerns the *value*, not the key's shape. This is the identical attribute and identical raw-value pattern flagged as a FAIL/regression in `git-collector.js` in this same run (which originates the value one layer upstream) — `context-integrator.js` re-exposes it on its own span without sanitization or redaction. **No raw/unsanitized path exposure**: unlike run-27 (which scored this file FAIL for setting `commit_story.context.repo_path` to the raw absolute `repoPath`), run-28's code never calls `setAttribute` with `repoPath` at all, so that specific path-leak pattern does not reproduce here — but the file still fails CDQ-007 overall on the author-name PII exposure. |

**Failures**: CDQ-007 — `commit_story.commit.author` set to a raw, unsanitized person's full name (PII), same root value as `git-collector.js`'s CDQ-007 regression in this same run.

**Correction note**: An earlier pass of this section scored CDQ-007 PASS, reasoning that `commit_story.commit.author`'s compound key name exempted it from the bare-`author` PII pattern — that reasoning was wrong (caught by CodeRabbit review) and has been corrected here to FAIL, consistent with `git-collector.js`'s verdict for the same underlying attribute.

**Fix-pattern note (repo_path only)**: For `commit_story.context.repo_path` specifically (not `commit.author`), this is not the "confirmed-fixed inline sanitization fallback" (`basename()`/manual split) applied — the file simply stopped emitting `repo_path` as a span attribute in this run's generation, so that particular CDQ-007 pattern is absent by omission rather than by a landed sanitization fix. Matches `claude-collector.js` in this same run (which originally declared/owns this attribute) — both files independently chose to drop `repo_path` rather than sanitize it.

**Datadog trace supplement**: Not performed — the Datadog MCP server was not connected in this subagent's session, so no live-trace corroboration was attempted; the source-code and schema-registry review above is the primary evidence.
### 4. generators/journal-graph.js (4 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS (final) — attempt 1 was blocked for 4 NDS-003 violations (if-guard blocks added around `vcs.ref.head.revision`, read as non-instrumentation control-flow lines); attempt 2 replaced the guards with inline `state?.context?.commit?.shortHash ?? ''` optional chaining, eliminating the added lines. Final committed code has no non-instrumentation control-flow additions. |
| API-001 | PASS — only `import { trace, SpanStatusCode } from '@opentelemetry/api'`; no SDK/exporter package imported |
| NDS-006 | PASS — no unrelated code motion; original business logic (banned-word replacements, formatters, cleaners) untouched |
| NDS-004 | PASS — `analyzeCommitContent`, `formatSessionsForAI`, `formatContextForSummary/User`, `cleanDialogueOutput`, `cleanTechnicalOutput`, `cleanSummaryOutput`, etc. are byte-for-byte unchanged |
| NDS-007 | PASS — `summaryNode`, `technicalNode`, `dialogueNode` catch blocks return fallback state + accumulate `errors[]` without rethrowing; no `recordException`/`setStatus` added to those catches, consistent with prior-run precedent (Pattern A: existing catch reused as the finally-paired catch) |
| COV-001 | PASS — `generateJournalSections`, the file's sole exported entry point, is wrapped in `commit_story.journal.generate_sections` |
| COV-003 | PASS — `generateJournalSections` has a fresh try/catch/finally with `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` before rethrow; the three node functions' graceful-degradation catches correctly get no error recording per the NDS-007 carve-out |
| COV-004 | PASS — 4 async functions instrumented (`summaryNode`, `technicalNode`, `dialogueNode`, `generateJournalSections`); 15 sync helpers (`getModel`, `resetModel`, `analyzeCommitContent`, `hasFunctionalCode`, `generateImplementationGuidance`, `formatSessionsForAI`, `formatChatMessages`, `escapeForJson`, `formatContextForSummary`, `formatContextForUser`, `cleanDialogueOutput`, `cleanTechnicalOutput`, `cleanSummaryOutput`, `buildGraph`, `getGraph`) correctly left unspanned |
| COV-005 | PASS — `summary_node`/`technical_node`/`dialogue_node` each carry `commit_story.ai.section_type`, `gen_ai.operation.name`, `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.request.temperature`, `vcs.ref.head.revision`; `generate_sections` carries `vcs.ref.head.revision`. All real domain values, no placeholders |
| RST-001 | PASS — no spans on the 15 sync utility functions |
| RST-004 | PASS — not triggered; no unexported async I/O function left unspanned |
| SCH-001 | PASS (with dismissed advisories) — 4 new span names declared as schema extensions (`commit_story.journal.summary_node`, `technical_node`, `dialogue_node`, `generate_sections`); validator raised 2 advisory "possible duplicate span name" flags for `technical_node`/`generate_sections` vs. `summary_node`, which the agent explicitly reasoned through and dismissed as distinct operation classes — advisory only, not a blocking finding, run committed with 0 errors |
| SCH-002 | PASS — 0 new attribute keys created; all 6 attributes reused from registry (`commit_story.ai.section_type`, `gen_ai.operation.name`, `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.request.temperature`, `vcs.ref.head.revision`). Note: agent's own notes flag `vcs.ref.head.revision` (registry-defined for VCS refs generally) is being repurposed to hold `commit.shortHash` rather than a full revision SHA — a self-acknowledged imperfect-but-closest-match reuse, not a duplicate-key violation, so it passes SCH-002's narrow mechanical check |
| SCH-003 | PASS — `gen_ai.request.temperature` numeric (via `NODE_TEMPERATURES?.summary` etc.); `commit_story.ai.section_type`, `gen_ai.operation.name`, `gen_ai.provider.name`, `gen_ai.request.model`, `vcs.ref.head.revision` are strings — types match registry |
| CDQ-001 | PASS — single `span.end()` per function, in `finally`, no double-end |
| CDQ-002 | PASS — `trace.getTracer('commit-story')` acquired once at module scope |
| CDQ-003 | PASS — no PII/sensitive raw data set (short hash and enum-like section types only) |
| CDQ-005 | PASS — tracer reused consistently across all four spans, no per-call tracer acquisition |
| CDQ-007 | PASS — `vcs.ref.head.revision` guarded with `?? ''` (fixed in attempt 2, replacing the flagged if-guards); `NODE_TEMPERATURES?.summary/technical/dialogue` guarded with optional chaining (fixed in attempt 2, per agent notes) |

**Failures**: None (final state). Attempt 1 failed 4x on NDS-003 (if-guards around `vcs.ref.head.revision` read as added control-flow lines); resolved in attempt 2 via optional chaining + `?? ''` fallback.

**Eleventh-consecutive-success note**: Consistent with the prompt's framing (11th consecutive success across all runs), but this run took 2 attempts vs. run-27's 3 — an improvement, driven by an NDS-003 violation this time rather than the unspecified cause in run-27's 3-attempt run. `attributesCreated: 0` this run (vs. 3 in run-27) — all 6 attributes set were already-registered keys; only the 4 span names were new schema extensions.

**D-10 provenance caveat for this file's spans specifically**: this file's `vcs.ref.head.revision` value is `commit.shortHash` — the *journaled* commit's short hash (domain data about which commit is being summarized), not the running instrument branch's own HEAD SHA. This is the same domain-vs-provenance distinction D-10 already documents for `git.commit.sha`, but it applies here to `vcs.ref.head.revision` itself, which elsewhere in this run (`trace-artifact.md`'s post-run verification, using `git-collector.js`/`journal-manager.js`/`index.js` spans) is the correct attribute for confirming which instrument branch produced a trace. Do not use this file's spans (`commit_story.journal.summary_node`/`technical_node`/`dialogue_node`/`generate_sections`) for branch-provenance checks — their `vcs.ref.head.revision` will show a short hash, not the instrument branch's full SHA, and would misidentify the branch if read as provenance evidence.

**Datadog trace supplement**: Not queried — Datadog MCP tools were unavailable in this subagent's session (`commit-story` and `telemetry-agent` MCP servers reported CONNECTION_CLOSED). Skipped per the optional step in the task instructions rather than blocking on it.
### 5. generators/summary-graph.js (6 spans, 1 attempt)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — the three `*Node` functions keep their original early-exit + inner try/catch structure with only `span.setAttribute` calls added and `finally { span.end() }` appended; the three `generate*` orchestrators (which had no pre-existing try/catch) are wrapped in a full try/catch/finally without disturbing the graph-invocation logic. |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` (line 3); `tracer.startActiveSpan(...)` used for all 6 spans (lines 174, 254, 388, 465, 600, 680). |
| NDS-004 | PASS — `parseSummarySections`/`parseWeeklySummarySections`/`parseMonthlySummarySections`, `formatEntriesForSummary`/`formatDailySummariesForWeekly`/`formatWeeklySummariesForMonthly`, `BANNED_WORD_REPLACEMENTS`, and `clean*SummaryOutput` are unchanged business logic. |
| NDS-006 | PASS — additions confined to span creation, `setAttribute`, `recordException`/`setStatus`, and `finally { span.end() }`; no unrelated code motion. |
| NDS-007 | PASS — inner catches in `dailySummaryNode`/`weeklySummaryNode`/`monthlySummaryNode` still return fallback objects and push to `errors[]` without `recordException`/`setStatus` (lines ~211-219, ~406-413, ~618-625); only the three `generate*` outer catches record exceptions and rethrow (lines 269-271, 479-481, 695-697). |
| COV-001 | PASS — all 6 exported async entry points spanned: `dailySummaryNode`→`commit_story.journal.daily_summary_node`, `generateDailySummary`→`commit_story.journal.generate_daily_summary`, `weeklySummaryNode`→`commit_story.journal.weekly_summary_node`, `generateWeeklySummary`→`commit_story.journal.generate_weekly_summary`, `monthlySummaryNode`→`commit_story.journal.monthly_summary_node`, `generateMonthlySummary`→`commit_story.journal.generate_monthly_summary`. |
| COV-003 | PASS — all three `generate*` orchestrators have `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` before `throw error` (lines 270-271, 480-481, 696-697), giving the failable async operations error visibility. |
| COV-004 | PASS — all 6 async functions instrumented; sync helpers (`getModel`, `resetModel`, `format*ForSummary`/`ForWeekly`/`ForMonthly`, `clean*SummaryOutput`) correctly left span-free. |
| COV-005 | PASS — every span carries 2 domain attributes: date/entry-count pair on the daily functions, week-label/daily-summaries-count pair on the weekly functions, month-label/weekly-summaries-count pair on the monthly functions. |
| RST-001 | PASS — `getModel`, `resetModel`, `formatEntriesForSummary`, `formatDailySummariesForWeekly`, `formatWeeklySummariesForMonthly`, and all three `clean*SummaryOutput` functions are synchronous pure transformations with no I/O, correctly left unspanned. |
| RST-004 | PASS — `parseSummarySections`, `parseWeeklySummarySections`, `parseMonthlySummarySections`, and all `build*Graph`/`get*Graph` helpers are unexported and synchronous; the 6 exported orchestrators/nodes cover the execution paths, so no coverage gap. |
| SCH-001 | PASS — all new attributes are namespaced under `commit_story.*` (`commit_story.journal.entry_date`, `commit_story.journal.entries_count`, `commit_story.summary.week_label`, `commit_story.summary.daily_summaries_count`, `commit_story.summary.month_label`, `commit_story.summary.weekly_summaries_count`). Advisory: the run log fired SCH-001 six times because the 6 new span names don't pre-exist in the registry — expected when declaring new `schemaExtension` spans, not a failure. |
| SCH-002 | PASS — `entries_count`, `daily_summaries_count`, and `weekly_summaries_count` are kept as three distinctly-named keys (unlike run-27's later consolidation into a shared `entry_count`); instrumentation.md explicitly checked and rejected reuse of `commit_story.context.messages_count` (Claude Code session messages, not journal entries) and `commit_story.journal.word_count` (output word count, not input entry count) as semantic matches — no duplicate/mislabeled key created. |
| SCH-003 | PASS — `agent-extensions.yaml` declares `entries_count`, `daily_summaries_count`, `weekly_summaries_count` as `type: int` and `week_label`/`month_label` as `type: string`; source usage matches (`entries?.length ?? 0`, `dailySummaries?.length ?? 0`, `weeklySummaries?.length ?? 0` are numeric; `weekLabel`/`monthLabel` are passed through as strings). |
| CDQ-001 | PASS — single `span.end()` per span via `finally`, no double-end paths across any of the 6 functions. |
| CDQ-002 | PASS — single `const tracer = trace.getTracer('commit-story')` at module scope (line 12), reused for all 6 spans. |
| CDQ-003 | PASS — standard `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` pattern used identically in all three `generate*` catches before rethrow. |
| CDQ-005 | PASS — `logger.info` used throughout for logging; no `console.log` anywhere in the file. |
| CDQ-006 | PASS — every `setAttribute` call sits immediately after destructuring state/args, before any `await` or the `try` block (e.g. lines 176-177, 255-256, 390-391, 466-467, 602-603, 681-682); no post-await unguarded attribute writes. |
| CDQ-007 | PASS — attributes are `entry_date`/`week_label`/`month_label` (period labels, not PII) and `entries_count`/`daily_summaries_count`/`weekly_summaries_count` (ints); no author/committer/username or raw filesystem-path attributes. |

**Failures**: None.

**Attribute-variance note**: This run's committed attribute set (`entry_date`, `entries_count`, `week_label`, `daily_summaries_count`, `month_label`, `weekly_summaries_count`) differs from run-27's final set (`entry_date`, `entry_count`, `errors_count`, `week_label`, `month_label`) — no shared-`entry_count` consolidation and no `errors_count` attribute this run. Consistent with the "attribute-count trend caution" methodology note: this is normal attribute-selection variance (verified against source, not just log narrative), not a regression — no `section_type` or `gen_ai.request.temperature` reappeared either, matching the pattern already established by run-26/27.

**Trace evidence**: Datadog MCP tools were unavailable in this subagent's session, so step 7's optional live-trace corroboration was skipped — no claim is made about Datadog span data for this file in run-28.
### 6. mcp/server.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no blank line between either JSDoc block and its function declaration (`/** Create and configure... */` directly precedes `function createServer()`; `/** Main entry point */` directly precedes `async function main()`). The historical run-27/issue #917 blank-line-near-JSDoc defect (since resolved) does not recur in run-28's version of this file. |
| API-001 | PASS — `main()` wraps its body in try/catch/finally: `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })` in `catch`, `span.end()` in `finally`. |
| NDS-004 | PASS — span name `commit_story.mcp.start` and attribute key `commit_story.mcp.transport` both use consistent `commit_story.<domain>.<name>` dot-segmented snake_case. |
| NDS-006 | PASS — no abbreviation or naming collision with existing schema vocabulary. |
| NDS-007 | PASS — no swallowed-error branches; the sole catch re-throws after recording. |
| COV-001 | PASS — `main()` is the process entry point and is instrumented as the single span. |
| COV-003 | PASS — no additional internal calls warranting their own child spans (`createServer()` is trivial/sync; `server.connect()` is deferred to MCP SDK auto-instrumentation per the agent notes). |
| COV-004 | PASS — `createServer()`, the only other function in the file, is synchronous and correctly left unspanned. |
| COV-005 | PASS — one meaningful attribute (`commit_story.mcp.transport = 'stdio'`) is present, satisfying the minimum. |
| RST-001 | PASS — `createServer()` performs no I/O and is not async, correctly skipped per the agent's own RST-001 citation. |
| RST-004 | PASS — `createServer()` is unexported and its execution is fully covered by the `main()` span's scope. |
| SCH-001 | PASS — `span.commit_story.mcp.start` is declared as a schema extension in `agent-extensions.yaml`. |
| SCH-002 | PASS — `commit_story.mcp.transport` is a genuinely new concept (MCP transport mechanism); no existing key was a near-synonym, and the agent did not force a reuse. |
| SCH-003 | PASS — declared type `string` matches the runtime value `'stdio'`. |
| CDQ-001 | PASS — exactly one `span.end()`, in `finally`; no redundant calls. |
| CDQ-002 | PASS — the agent-thinking log's stated plan (one attribute, `commit_story.mcp.transport`, entry-point span on `main()`) matches the delivered code exactly; no unimplemented planned attribute. |
| CDQ-003 | PASS — the attribute is set once, at the correct point in span lifetime (after span creation, before the awaited `connect()` call), not duplicated or misplaced. |
| CDQ-005 | PASS — `span.setAttribute('commit_story.mcp.transport', 'stdio')` is set unconditionally, before the `await server.connect(transport)` I/O call. |
| CDQ-006 | PASS — span kind is left as the default INTERNAL, matching the schema's `span_kind: internal` declaration; no kind mismatch. |
| CDQ-007 | PASS — the attribute value `'stdio'` is a static enum/constant describing the transport mechanism, not a raw path, identifier, or any PII-bearing data. |

**Failures**: None

**Verification of blank-line/JSDoc history**: Confirmed against source — both JSDoc blocks in this file sit immediately above their function declarations with no intervening blank line. The run-27-documented NDS-003 class of defect (issue #917) is absent here; nothing regressed.

**Structural comparison to run-27**: Matches run-27's implementation on the dimensions that matter — `main()` gets the single entry-point span (COV-001) with one attribute (`commit_story.mcp.transport = 'stdio'`), full try/catch/finally with `recordException`/`setStatus(ERROR)`/`span.end()` in `finally`, and `createServer()` correctly left unspanned (RST-001/RST-004). One naming difference from run-27: this run's span is `commit_story.mcp.start` (run-27 used `commit_story.mcp.server.start`) — both are valid, unique schema extensions (SCH-001 passes either way), so this is a cosmetic naming variance across runs, not a rule violation.

**Datadog trace supplement**: Not queried — the Datadog MCP plugin failed to connect in this subagent's session. Per run-27's precedent, live traces for this span are not expected to exist in the standard CLI dry-run harness anyway (the MCP server entry point isn't exercised by `node src/index.js` invocations).
### 7. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — single span name `commit_story.journal.ensure_directory` uses consistent `commit_story.<domain>.<action>` dotted notation |
| API-001 | PASS — imports `trace, SpanStatusCode` from `@opentelemetry/api`; `tracer.startActiveSpan` used correctly with `span.end()` in `finally` |
| NDS-006 | PASS — no span-kind or context-propagation violations |
| NDS-004 | PASS — control flow unchanged; original `mkdir(dir, { recursive: true })` call preserved verbatim inside the span |
| NDS-007 | PASS — the single catch records the exception then rethrows (`throw error`); no swallowed-error branch altered |
| COV-001 | PASS — `ensureDirectory` (line 88), the sole exported async/I/O function in the file, is instrumented as the entry point |
| COV-003 | PASS — `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` both present in the catch block before rethrow |
| COV-004 | PASS — the 11 remaining exported functions (`getYearMonth`, `getDateString`, `getJournalEntryPath`, `getReflectionPath`, `getContextPath`, `getReflectionsDirectory`, `parseDateFromFilename`, `getJournalRoot`, `getISOWeekString`, `getSummaryPath`, `getSummariesDirectory`) are pure synchronous path builders with no I/O — correctly left unspanned |
| COV-005 | PASS — `commit_story.journal.file_path` is a meaningful domain attribute set on the entry-point span |
| RST-001 | PASS — instrumentation report and agent notes explicitly enumerate all 11 sync functions and justify skipping spans on each (no I/O, no async work) |
| RST-004 | PASS — no unexported async helper left unspanned; moot for this file |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` correctly declared as a schema extension (`span.commit_story.journal.ensure_directory`); no existing schema span covers directory-creation operations |
| SCH-002 | PASS — reuses the pre-existing registered key `commit_story.journal.file_path` rather than inventing a new one; `attributesCreated: 0` per the instrumentation report |
| SCH-003 | PASS — `commit_story.journal.file_path` is declared `type: string` in `semconv/attributes.yaml` (brief: "Output file path for the journal entry"); the code sets a string value (`filePath.split(/[\\/]/).filter(Boolean).pop() ?? ''`) — types match |
| CDQ-001 | PASS — exactly one `span.end()` call, in `finally`, no redundant calls |
| CDQ-002 | PASS — `SpanStatusCode.ERROR` set consistently on the exception path |
| CDQ-003 | PASS — error recorded via `recordException` then rethrown; not silently swallowed |
| CDQ-005 | PASS — attribute is set unconditionally, before the I/O call (`mkdir`) |
| CDQ-006 | PASS — the guard (`if (span.isRecording()) { span.setAttribute(...) }`) is present in the actual code; also independently exempt since `ensureDirectory` is a COV-001 entry-point span |
| CDQ-007 | **PASS — RESOLVED since run-27.** Line 92: `span.setAttribute('commit_story.journal.file_path', filePath.split(/[\\/]/).filter(Boolean).pop() ?? '')`. This sanitizes `filePath` down to its basename via inline split/filter/pop, the same import-free pattern landed in spiny-orb commit `5a0636c` ("add import-free path fallback for CDQ-007") and confirmed applied elsewhere in this run (`journal-manager.js`, `index.js`). This directly reverses run-27's FAIL for this exact file, which shipped the raw, unsanitized `filePath` value and self-acknowledged the gap ("basename isn't imported... I'll keep the raw value"). In run-28, the agent's thinking log and instrumentation-report notes both cite CDQ-007 explicitly and apply the inline sanitization instead of declining it. |

**Failures**: None.

**Regression note**: This file's CDQ-007 status flips from FAIL (run-27, spiny-orb issue #1035 — raw absolute/relative path shipped, fix self-identified but declined) to PASS (run-28 — inline basename-equivalent sanitization applied). This confirms the cross-file fix (`5a0636c`) generalizes to this file, not just the two files (`journal-manager.js`, `index.js`) originally cited.

**Datadog trace supplement**: Not queried (optional step) — the source-level evidence (line 92 of the committed file) is unambiguous.
### 8. managers/journal-manager.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no truthy guard removed; `commit.shortHash`/`commit.timestamp` used unconditionally per JSDoc contract, no pre-existing guard logic altered |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'`, no SDK imports |
| NDS-004 | PASS — early-return duplicate-skip, regenerate-stale-placeholder path, and chronological sort/return in `discoverReflections` are byte-for-byte unchanged, only wrapped |
| NDS-006 | PASS — both instrumented function bodies preserved verbatim inside the span wrapper, no logic deleted |
| NDS-007 | PASS — the `ENOENT`-only-rethrow catch in `saveJournalEntry` (`if (err.code !== 'ENOENT') throw err;`) and the two silent `continue`-on-error catches in `discoverReflections` (unreadable file, missing directory) are left unmodified; only the outer span-level catches add `recordException`/`setStatus` |
| COV-001 | PASS — both exported async functions (`saveJournalEntry`, `discoverReflections`) are entry points, each wrapped in its own `tracer.startActiveSpan` |
| COV-003 | PASS — both outer catches call `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` before rethrow, `span.end()` in `finally` |
| COV-004 | PASS — every exported async I/O function in the file is spanned; no entry point missed |
| COV-005 | PASS — attributes present on both spans: `file_path`, `entry_date`, `vcs.ref.head.revision`, `commit.message` on `save_entry`; `time_window_start`, `time_window_end`, `entries_count` on `discover_reflections` — not attribute-empty despite "0 attributes" in the run log (that figure is `attributesCreated`, i.e., zero *new* keys minted, not zero `setAttribute` calls) |
| RST-001 | PASS — all 10 synchronous pure helpers correctly left uninstrumented |
| RST-004 | PASS — same helper set, all unexported/internal (except `formatTimestamp`, exported but still sync-utility-exempt under RST-001), correctly excluded |
| SCH-001 | PASS — new span names `span.commit_story.journal.save_entry` and `span.commit_story.journal.discover_reflections` declared in `semconv/agent-extensions.yaml` with `span_kind: internal` |
| SCH-002 | **PASS — RUN27-5 now CLEAN, third-instance-that-wasn't**: `discoverReflections` writes the reflection count to `commit_story.journal.entries_count`, a generic, already-extended agent key, not to `commit_story.journal.quotes_count` (the core-schema key, explicitly briefed "Number of developer quotes extracted for the entry"). Run-27's mismatch is fully resolved in run-28's version of this file — no reuse of `quotes_count` for reflections at all. This does **not** extend the RUN27-5 pattern to a third instance; it breaks the streak |
| SCH-003 | PASS — `commit_story.journal.entries_count` is registered `type: int` and set as raw `reflections.length`, no `String()` wrapper; `commit_story.journal.file_path` registered `type: string` and set as a string |
| CDQ-001 | PASS — `span.end()` called exactly once per span, in `finally`, for both functions |
| CDQ-002 | PASS — single `const tracer = trace.getTracer('commit-story')` at module scope, reused for both spans |
| CDQ-003 | PASS — standard `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` in both outer catches before rethrow |
| CDQ-005 | PASS — no `console.log` anywhere in the file; the only logging is the caller-supplied `options.debug` hook, not a bypass of a project logger |
| CDQ-006 | PASS — usage is mixed (some attributes guarded with `if (span.isRecording())`, others unguarded), but both spans are COV-001 entry points, which are exempt from the isRecording-guard requirement — so neither the guarded nor unguarded calls are a violation |
| CDQ-007 | **PASS — confirmed fix applied**: `commit_story.journal.file_path` is sanitized via `entryPath.split(/[\\/]/).filter(Boolean).pop() ?? ''`, the confirmed spiny-orb commit `5a0636c` inline fallback pattern, not the raw unsanitized `entryPath` that run-27 shipped with a caveat. No other PII-shaped attribute (author/email/username) is present on either span |

**Failures**: None.

**Watch-item resolution (RUN27-5)**: This is the key finding for this file. Run-27 confirmed `discoverReflections()`'s reflection count was written into the registered `commit_story.journal.quotes_count` key (semantically "developer quote count") — a type-correct but semantically wrong reuse. Run-28's version of this exact function now writes the same value to `commit_story.journal.entries_count` — a generic, boilerplate-briefed agent-extension key that does not contradict any specific registered concept. This is a clean fix, not a different mismatch. Net effect: **RUN27-5 does not get a third confirmed instance on this file** — the case for a standing "Unrubriced Findings" rubric category should be evaluated based on the `summarize.js`/`dates_count` finding and other files, not on `journal-manager.js`, which is now resolved.

**CDQ-007 path fix confirmation**: Confirmed fixed. `entryPath.split(/[\\/]/).filter(Boolean).pop() ?? ''` matches the confirmed spiny-orb commit `5a0636c` inline sanitization pattern exactly. This is a change from run-27's behavior on this file, where the raw `entryPath` was shipped with only a caveat noting the missing `basename()` import as a latent risk.
### 9. managers/summary-manager.js (9 spans, 2 attempts)

**RUN27-1 / COV-003 status: RESOLVED.** Run-27 scored this file PARTIAL (7/9 functions committed) due to the `isExpectedConditionCatch` validator gap that mis-flagged expected `if (err.code === 'ENOENT') return; throw err;` patterns as missing error recording. The file has 15 total top-level functions: 14 exported (9 async, 5 pure sync) plus 1 unexported async helper (`_hasRealSummary`). Spiny-orb's own function-level fallback pass reports "14/14 functions instrumented" — its internal count of the 14 exported functions it processed, not a claim that 14 got spans. In run-28, all 9 span-eligible (exported async) functions committed cleanly, and every one of their outer catch blocks correctly calls `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` before rethrowing, while the three pre-existing expected-condition inner catches (`readDayEntries` line 70, `readWeekDailySummaries` line 326, `readMonthWeeklySummaries` lines 568 and 593) are preserved unmodified, correctly not treated as failures. No partial-commit regression this run. **However, three other rules FAIL in this file — see below.**

| Rule | Result |
|------|--------|
| NDS-003 | PASS — all 9 span names use consistent dotted `commit_story.journal.*` / `commit_story.summary.*` (e.g. `read_day_entries`, `save_weekly_summary`, `monthly_summary_pipeline`) |
| API-001 | PASS — `import { SpanStatusCode, trace } from '@opentelemetry/api'`; `tracer.startActiveSpan` used in all 9 spans, each with `span.end()` in `finally` |
| NDS-004 | PASS — all attributes namespaced under `commit_story.journal.*` / `commit_story.summary.*`, consistent snake_case |
| NDS-006 | PASS — no span-kind or context-propagation issues; straightforward sequential awaits, no manual context manipulation needed |
| NDS-007 (Expected Catch Unmodified) | PASS (after 2 attempts) — validation journey: Attempt 1 had 2 blocking NDS-007 errors + 1 control-flow error; Attempt 2 reduced to 1 remaining NDS-007 error before the function-level fallback landed clean. Final source's three ENOENT-based expected catches are byte-for-byte unmodified (return `[]` / `throw err` semantics preserved) |
| COV-001 | N/A — this is a library manager module with no CLI/top-level entry-point boundary; all 9 non-pure functions received direct spans anyway |
| COV-003 (Error Recording) | PASS — confirmed resolved (see note above); all 9 catch blocks record + set error status + rethrow, `span.end()` in `finally` throughout |
| COV-004 | PASS (1 advisory, non-blocking) — only the private unexported `_hasRealSummary` helper lacks a span; correctly exempted as an unexported internal helper covered by caller context propagation |
| COV-005 | PASS — meaningful domain attributes present across spans: `file_path`, `entry_date`, `entries_count`, `week_label`, `month_label`, `daily_summaries_count`, `weekly_summaries_count`, `summary_saved` |
| RST-001 | PASS — 5 pure synchronous functions (`formatDailySummary`, `getWeekBoundaries`, `formatWeeklySummary`, `getMonthBoundaries`, `formatMonthlySummary`) correctly left unspanned (0 spans, no I/O) |
| RST-004 | PASS — `_hasRealSummary` is the one unexported async helper without a span; correctly exempt (mirrors journal-manager.js precedent) |
| SCH-001 | PASS — one new schema extension, `commit_story.journal.summary_saved`, registered in `agent-extensions.yaml`; span names follow existing namespace |
| SCH-002 (Semantic Dedup) | PASS — `file_path`, `entry_date`, `entries_count`, `week_label`, `month_label`, `daily_summaries_count`, `weekly_summaries_count` are all reused pre-existing registered keys; only `summary_saved` is newly declared, matching the log's "1 attribute" |
| SCH-003 (Type Consistency) | **FAIL — verified independently.** `commit_story.journal.summary_saved` is declared `type: string` in `agent-extensions.yaml`, but every one of 14 call sites (lines 203, 215, 232, 240, 405, 411, 483, 490, 683, 690, 726, 744, 766, 773) sets it to a bare boolean literal (`true`/`false`), never a string. Confirmed by direct source read: `git show spiny-orb/instrument-1789648132789:src/managers/summary-manager.js`. |
| CDQ-001 | PASS — exactly one `span.end()` per span, always in `finally`, no redundant calls |
| CDQ-002 | PASS — `trace.getTracer('commit-story')` matches project convention |
| CDQ-003 | PASS — `recordException` + `setStatus({code: SpanStatusCode.ERROR})` present in every catch before rethrow |
| CDQ-005 | PASS — no risky nullable-derived attribute values; lengths/counts come from resolved arrays, `options.force` is defaulted, paths are computed before use |
| CDQ-006 (isRecording Guard) | **FAIL — verified independently.** Inconsistent application: only 3 of 7 `file_path` sites (lines 63, 493, 675) are wrapped in `if (span.isRecording())`; the `summary_saved`/`entry_date`/`entries_count` calls (e.g. lines 203, 208, 213, 215) and most other `file_path` sites are set unguarded. None of these spans are COV-001 entry points, so the split has no stated rationale. |
| CDQ-007 (Attribute Data Quality) | **FAIL — verified independently, partial fix.** Raw, unsanitized absolute filesystem paths are set at 4 of 7 `file_path` call sites: `saveDailySummary` (line 151, raw `summaryPath`), `generateAndSaveDailySummary` (line 239, raw `path`), `saveWeeklySummary` (line 400, raw `summaryPath`), `generateAndSaveMonthlySummary` (line 774, raw `path`). The other 3 sites in this SAME file — `readDayEntries` (line 63), `generateAndSaveWeeklySummary` (line 493), `saveMonthlySummary` (line 675) — correctly apply the confirmed `path.split(/[\\/]/).filter(Boolean).pop() ?? ''` fallback. This is inconsistent, partial remediation within a single file, not a missed finding — the instrumentation report's own advisory findings section flags CDQ-007 at all 7 sites including the 4 unfixed ones. |

**Failures**: SCH-003 — `commit_story.journal.summary_saved` declared `type: string` but always set as a boolean. CDQ-006 — `isRecording()` guard applied to only 3 of ~24 `setAttribute` calls with no exemption basis for the split. CDQ-007 — raw unsanitized filesystem paths remain on 4 of 7 `file_path` attributes despite the basename-safe fix being correctly applied elsewhere in the same file.

**Confirmed resolved this run**: RUN27-1/COV-003 partial-commit regression — no longer reproduces; all 9 span-eligible functions committed, all catch blocks correctly distinguish expected `ENOENT` conditions from real errors.

**Significance for the run-28 narrative**: This file demonstrates that the CDQ-007 fix (`5a0636c`) is real but **not uniformly applied even within a single file** — 3 of 7 sites use it, 4 don't. This contradicts an earlier draft of `run-summary.md`'s claim that RUN27-4 is fully "RESOLVED" across the run; it is resolved *as a mechanism* (agents that use it do so correctly) but not *consistently invoked* everywhere it should be. See `run-summary.md`'s correction note.
### 10. utils/summary-detector.js (9 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original logic/structure preserved verbatim across all 9 functions; only `startActiveSpan` wrapping and `setAttribute` calls added. |
| API-001 | PASS — `tracer.startActiveSpan(name, async (span) => {...})` used consistently; correct `@opentelemetry/api` imports (`trace`, `SpanStatusCode`), one module-level `trace.getTracer('commit-story')`. |
| NDS-004 | PASS — return values/shapes unchanged (e.g. `findUnsummarizedDays` still returns the filtered array, `getSummarizedWeeks` still returns a `Set`). |
| NDS-006 | PASS — multi-line literals, early-return guards, and destructuring preserved as-is. |
| NDS-007 | PASS — the graceful-degradation inner `catch {}` blocks (readdir-not-found paths) correctly get no `recordException`/`setStatus`; only the outer per-span catch does. |
| COV-001 | PASS — all 5 exported functions (`getDaysWithEntries`, `findUnsummarizedDays`, `getDaysWithDailySummaries`, `findUnsummarizedWeeks`, `findUnsummarizedMonths`) have entry-point spans. |
| COV-003 | PASS — every one of the 9 outer catches calls `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` before `span.end()` in `finally`. |
| COV-004 | PASS — all 4 unexported async helpers (`getSummarizedDays`, `getSummarizedWeeks`, `getSummarizedMonths`, `getWeeksWithWeeklySummaries`) got their own spans (same improvement over run-26 noted in run-27). |
| COV-005 | PASS — upstream counts are set via `setAttribute` immediately after the await and before the early-return guard in `findUnsummarizedDays`, `findUnsummarizedWeeks`, and `findUnsummarizedMonths`, so the short-circuit path still carries context. |
| RST-001 | PASS — `getTodayString` and `getNowDate` are pure synchronous helpers with no I/O and are correctly left unwrapped. |
| RST-004 | PASS — every span has `finally { span.end(); }`. |
| SCH-001 | PASS — 9 new span names registered under `commit_story.journal.*`, dotted-notation compliant. Three registry-suggested names were already claimed by earlier files in this run; the agent invented non-colliding alternatives rather than reusing a taken name. |
| SCH-002 | PASS — the four new attributes (`unsummarized_days_count`, `unsummarized_weeks_count`, `summarized_months_count`, `unsummarized_months_count`) each capture a genuinely distinct "gap" or "existing-total" concept not covered by the pre-existing `entries_count`/`daily_summaries_count`/`weekly_summaries_count`/`months_generated_count` keys — justification is specific per-key, not generic. |
| SCH-003 | **FAIL** — confirmed by line-by-line check of every `setAttribute` call against the registry. All four newly-declared keys are registered `type: int` but are **all** emitted via `String(...)`: `commit_story.summary.unsummarized_days_count` (`String(result.length)`), `commit_story.summary.unsummarized_weeks_count` (`String(unsummarized.length)`), `commit_story.summary.summarized_months_count` (`String(months.size)`), `commit_story.summary.unsummarized_months_count` (`String(unsummarized.length)`). This is a **wider** recurrence of the RUN26-1/RUN27-3 int/`String()` mismatch than run-27's version of this same file, which only mis-typed one key (`weeks_count`) — here it's systematic across all four newly-invented keys, while every pre-existing key (`entries_count`, `daily_summaries_count`, `weekly_summaries_count`) is correctly set as a bare number. The pattern is consistent: the agent applied a `String()`-wrapping habit specifically (and only) to attributes it invented itself in this file. |
| CDQ-001 | PASS — `span.end()` always reached via `finally`. |
| CDQ-002 | PASS — status codes set only on genuine error paths, not on expected/graceful ones. |
| CDQ-003 | PASS — try/catch/finally structure correct on every span. |
| CDQ-005 | PASS — no excessive/high-cardinality attributes; only scalar counts. |
| CDQ-006 | PASS — no `isRecording()` guards are present anywhere in this file, and none are required: every `setAttribute` call sets a trivial, already-computed value (`dates.length`, `dates.size`, `weeks.size`, `entryDays.length`, or a literal `0`), never a method call, string transformation, or external-source read. All 5 spans are also COV-001 entry points, independently exempt. |
| CDQ-007 | PASS (log/report advisories are false positives — see note) |

**Failures**: SCH-003 only (see above; four `int`-declared keys, all `String()`-wrapped).

**CDQ-007 note (log/report discrepancy)**: The `.instrumentation.md` report and run log both list 8 CDQ-007 "PII attribute name or raw filesystem path" advisories, at lines matching plain count-attribute `setAttribute` calls. Direct source inspection confirms this file **sets no `commit_story.context.repo_path`, no `file_path`, and no PII/path attribute of any kind** — every attribute in the file is a numeric count. This is a meaningful contrast with run-27's version of this same file, which genuinely failed CDQ-007 on 9 raw `repo_path` occurrences — that attribute is simply absent from run-28's instrumentation of this file. The advisory text (generic "prefer basename()..." boilerplate) does not correspond to anything in the actual committed code — the automated advisory appears to be stale/mistargeted output, not a real finding.

**Notes**: The four unexported async helpers continue to get full COV-004 coverage (matches run-27's "notable improvement over run-26"). Multi-attribute reuse across the file is consistent and semantically accurate. The one substantive, code-confirmed defect is the SCH-003 `String()`-wrapping of all four new count attributes — this is the same underlying validator/generation-time gap (no check catches `setAttribute(key, String(...))` against a numeric-typed key) documented as recurring uncaught in `summarize.js` this same run, now shown to recur here too, more widely (4 keys, not 2).

**Historical note**: `run-summary.md` and `failure-deep-dives.md` originally stated "No SCH-003/String() issue found" for this file, based on a log-narrative-only check. Both have since been corrected to reflect the 4 confirmed SCH-003 violations found here via direct source inspection — see their own correction notes for detail; no further action needed against those documents from this section.

**Datadog MCP query**: Not run (optional per task instructions; no MCP query executed this pass).
### 11. managers/auto-summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-004 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | **FAIL** |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS |

**Failures**: SCH-003 (Attribute Value Types Match Schema) — six `setAttribute` calls write a declared `int` key via `String(...)`, wrapping the value as a string against its own registry type:
- Line 78: `span.setAttribute('commit_story.summary.days_generated_count', String(result.generated.length));`
- Line 79: `span.setAttribute('commit_story.summary.days_failed_count', String(result.failed.length));`
- Line 89: `span.setAttribute('commit_story.summary.days_generated_count', String(result.generated.length));` (duplicate call on the normal, non-early-return path)
- Line 90: `span.setAttribute('commit_story.summary.days_failed_count', String(result.failed.length));`
- Line 158: `span.setAttribute('commit_story.summary.weeks_generated_count', String(result.generated.length));`
- Line 159: `span.setAttribute('commit_story.summary.weeks_failed_count', String(result.failed.length));`

`semconv/agent-extensions.yaml` declares all four of these as `type: int`, and this file's own `.instrumentation.md` explicitly calls them "new extension attributes (int)". The `String()` wrapper is the identical bug independently confirmed in `summarize.js` and `summary-detector.js` in this same run; this file adds 6 more occurrences (4 unique attribute names, 2 set twice via early-return and normal-return paths) — **14 total violations across three files in run-28** (4 in `summarize.js`, 4 in `summary-detector.js`, 6 here). No validator caught any of them; the run log shows "0 errors" for this file's single attempt.

By contrast, the two `months_*` counters (lines 222-223) are int-typed in the registry and correctly set as raw numbers with no `String()` wrapper — these are reused pre-registered keys. The three `unsummarized_*_count` attributes are likewise set as raw `.length` values and are correct. The bug is confined to the four newly-declared `days_*`/`weeks_*` extension attributes, not the pre-existing `months_*`/`unsummarized_*` keys — consistent with the pattern already established in `summarize.js` and `summary-detector.js`.

**Notes**: All three exported entry points (`triggerAutoSummaries`, `triggerAutoWeeklySummaries`, `triggerAutoMonthlySummaries`) are wrapped in `tracer.startActiveSpan` with try/catch/finally, `recordException`/`setStatus(ERROR)` on the outer catch, and `span.end()` in `finally`. `getErrorMessage` is correctly skipped as a pure, unexported, synchronous helper. The inner per-item catch blocks inside each for-loop (push to `result.failed`/`result.errors`, no rethrow) are correctly left untouched as expected graceful-degradation control flow. Three new span names were correctly declared as schema extensions after the semantically closer existing span IDs were confirmed already claimed by earlier files in this run. Unlike run-27's version of this file, this run-28 instrumentation does **not** set any `commit_story.context.repo_path` (or equivalent raw-path) attribute anywhere — CDQ-007 PASSes cleanly here, in contrast to run-27's canonical failure on this same file.

**Cross-file pattern confirmation**: Checking every one of this file's 11 `setAttribute` call sites individually (not sampling) found the bug at 6 of them (all 4 newly-declared `days_*`/`weeks_*` keys, one doubled), absent at the other 5 (pre-registered `months_*`/`unsummarized_*` keys). The pattern specifically affects **newly agent-declared** int extension attributes, not pre-existing registered int keys, across all three affected files this run — a systemic, run-wide validator gap (no check catches `setAttribute(key, String(...))` against a numeric-typed key), now spanning 3 of ~32 files with 14 total occurrences. This is the single most significant unrubriced-pattern finding of run-28 and should be the primary SCH-003 handoff item.
### 12. index.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — span names `commit_story.journal.handle_summarize` and `commit_story.cli.main` use consistent dotted snake_case notation, no PII or dynamic values embedded in the span name itself. |
| API-001 | PASS — `tracer.startActiveSpan(name, async (span) => {...})` used for both spans; correct `@opentelemetry/api` imports (`trace`, `SpanStatusCode`); one module-level `const tracer = trace.getTracer('commit-story')`. |
| NDS-006 | PASS — instrumentation additions are confined to span creation/attribute/error-recording calls; no unrelated code motion. All original logic (arg parsing, subcommand routing, skip conditions, auto-summarize trigger) preserved verbatim. |
| NDS-004 | PASS — `handleSummarize` still returns `EXIT_SUCCESS`/`EXIT_ERROR` per the original branching; `main` still returns `EXIT_SUCCESS`/`EXIT_ERROR`/`EXIT_SKIPPED` per the original branching. No return-shape changes. |
| NDS-007 | PASS — outer catches in both `handleSummarize` and `main` correctly add `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` before rethrowing. The inner `try/catch` around `triggerAutoSummaries` in `main` is correctly left untouched (no recordException/setStatus) since it logs a warning and does not rethrow — graceful-degradation catch preserved. |
| COV-001 | PASS — both exported entry points (`handleSummarize`, `main`) got spans. |
| COV-003 | PASS — both spans use try/catch/finally with `span.end()` in `finally`, and standard error recording on the outer catch. |
| COV-004 | PASS — 6 synchronous, unexported utility functions (`parseArgs`, `showHelp`, `isGitRepository`, `isValidCommitRef`, `validateEnvironment`, `getPreviousCommitTime`) correctly flagged with 0 spans, all legitimately exempt per RST-001. |
| COV-005 | PASS — `main` carries 2 attributes (`vcs.ref.head.revision`, `commit_story.journal.file_path`); `handleSummarize` carries up to 5 depending on branch (`commit_story.summary.force`, `commit_story.summary.mode`, mode-specific generated/failed counts, and `commit_story.summary.dates_requested` in the daily branch). Both spans clear the ≥1 meaningful-attribute bar. |
| RST-001 | PASS — the 6 sync helpers above are correctly left unwrapped (none contain awaited I/O beyond synchronous `execFileSync` wrapped in try/catch). |
| RST-004 | PASS — none of the 6 sync helpers carry an `export` keyword; correctly left unspanned. |
| SCH-001 | PASS — 2 new span names registered as extensions (`span.commit_story.journal.handle_summarize`, `span.commit_story.cli.main`), matching the log's "Schema extensions" block exactly; no collision with existing registered spans. |
| SCH-002 | PASS — `commit_story.summary.mode` is a genuinely new concept (which of weekly/monthly/daily was invoked), distinct from the pre-existing `week_label`/`month_label` single-item-label attributes; no semantic duplicate introduced. |
| SCH-003 | PASS — verified every `setAttribute` call against the registry: `commit_story.summary.force` (bool ← `parsed.force`, native boolean), `commit_story.summary.mode` (string ← literal), `commit_story.summary.{weeks,months,days}_generated_count` and `_failed_count` (int ← `result.generated.length` / `result.failed.length`, native numbers — **not** `String()`-cast, unlike the coercion bug found in `summarize.js`/`summary-detector.js`/`auto-summarize.js` in this same run), `commit_story.summary.dates_requested` (string ← `parsed.dates.join(',')`), `vcs.ref.head.revision` (string ref), `commit_story.journal.file_path` (string ← sanitized `savedPath`). All types match their registry declarations exactly. |
| CDQ-001 | PASS — single `finally { span.end(); }` per span; no double-end paths found across any return branch. |
| CDQ-002 | PASS — single `const tracer = trace.getTracer('commit-story')` at module scope, reused for both spans. |
| CDQ-003 | PASS — standard `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` pattern in both outer catches, before rethrow. |
| CDQ-005 | PASS — all logging goes through `logger.*`, no `console.log`; attribute values are bounded (booleans, ints, short literals, a comma-joined date-list string, a single sanitized filename). |
| CDQ-006 | PASS — `isRecording()` guards are applied specifically to the two attributes requiring non-trivial computation (`dates_requested` via `.join(',')`, `file_path` via `.split(/[\/]/).filter(Boolean).pop()`), while trivial direct-value sets (`force`, `mode`, the six count attributes, `vcs.ref.head.revision`) are set unguarded — consistent with the guard-only-nontrivial-computation convention used elsewhere in this run. |
| CDQ-007 | PASS — the sole call site for `commit_story.journal.file_path` is sanitized via `.split(/[\/]/).filter(Boolean).pop() ?? ''`, applied consistently at the only site where this attribute is set (1/1) — unlike `summary-manager.js` in this same run, which sanitized 3/7 sites but shipped 4 raw ones. `vcs.ref.head.revision` is a git ref/SHA, not a filesystem path, so it is correctly exempt from this rule. |

**Failures**: None — full PASS across all 20 rules in the table above.

**Note on the CDQ-007 sanitization tradeoff**: the agent's own instrumentation report flags internal deliberation over this call — the registry's own example for `commit_story.journal.file_path` is a full relative path, but the agent chose to strip to bare filename, reasoning that any non-`file.*`-prefixed path-shaped attribute must be sanitized. This is stricter than the schema's own documented example and loses directory context, but does not violate the rule as written — worth flagging as a design tension for future schema/rule reconciliation, not a scoring failure.

**Note on numeric-count attributes**: this file reuses `days_generated_count`/`days_failed_count`, `weeks_generated_count`/`weeks_failed_count`, and `months_generated_count`/`months_failed_count` — all six are registry `type: int` and all six are set from native JS numbers, never from `String(...)`-cast values. This file does **not** exhibit the int-typed-key-set-via-`String()` coercion bug found in `summarize.js`, `summary-detector.js`, and `auto-summarize.js` in this same run.

**Datadog trace supplement**: Not queried — Datadog MCP tools were unavailable in this subagent's session. Static code review above is complete and sufficient for scoring.

**Datadog trace supplement methodology note**: per-file evaluation was delegated to background subagents, none of which had working Datadog MCP tool access in their sessions (each reports `CONNECTION_CLOSED` where it tried). This is a real gap against the PRD's own D-2 trace supplement step, which expects per-file trace corroboration whenever `trace-artifact.md`'s `post_run_service.instance.id` and post-run query are available (they are — see `trace-artifact.md`). The coordinating session that assembled this document does have working Datadog MCP access and used it for the run-level "Post-run Datadog verification" milestone (confirming `vcs.ref.head.revision` matches the instrument branch across multiple files' spans), but did not re-run that per-file for every one of the 12 committed files individually. Every PASS/FAIL verdict in this document is still evidence-based — from direct source inspection (`git show`) and the run log/instrumentation reports — just not additionally cross-checked against a live trace per file. Treat per-file trace corroboration as outstanding, not complete, for any future audit of this document.

## Partial File (1)

### commands/summarize.js — PARTIAL (3/9 functions span-eligible and committed, 3 spans, 5-step validation journey)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — span names use consistent `commit_story.journal.run_summarize` / `run_weekly_summarize` / `run_monthly_summarize` dotted convention, no PII or dynamic values in span names |
| API-001 | PASS — `import { SpanStatusCode, trace } from '@opentelemetry/api'`; `tracer.startActiveSpan(...)` used correctly in all three committed functions, each with `span.end()` in `finally` |
| NDS-004 | PASS — per-item loop logic (entry checks, existing-summary checks, generate/save calls, result bucketing into `generated`/`noEntries`/`noSummaries`/`alreadyExists`/`failed`/`errors`) is unchanged business logic, only wrapped |
| NDS-006 | PASS — no dead code or unrelated logic removed; instrumentation additions are confined to span creation, `setAttribute`, and the outer `recordException`/`setStatus`/`end` block |
| NDS-007 | PASS — the original per-item `try/catch` inside each `for` loop (pushing to `failed`/`errors` without rethrowing) is left unmodified; only the new outer `try/catch/finally` around the whole function body adds `recordException` + `setStatus(ERROR)` before rethrow |
| COV-001 | PASS — all three exported entry points (`runSummarize`, `runWeeklySummarize`, `runMonthlySummarize`) are wrapped in `tracer.startActiveSpan`, matching their status as this file's service entry points |
| COV-003 | PASS — each function's outer `catch` calls `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` before rethrow, with `span.end()` in `finally` |
| COV-004 | PASS — the 6 pure/sync helpers (`isValidDate`, `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `showSummarizeHelp`, none I/O-performing) are correctly left unspanned |
| COV-005 | PASS — every committed span carries ≥1 domain attribute: `run_summarize` gets `dates_requested`, `force`, `daily_summaries_count`; `run_weekly_summarize` gets `force`, `dates_requested`, `weekly_summaries_count`; `run_monthly_summarize` gets `force`, `dates_requested`, `months_generated_count`, `months_failed_count` |
| RST-001 | PASS — `isValidDate`, `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs` are all synchronous and correctly left unspanned |
| RST-004 | PASS — not applicable; no unexported async I/O helper exists in this file (`showSummarizeHelp` is sync, all async logic lives in the three exported/spanned functions) |
| SCH-001 | PASS — all custom attributes are namespaced `commit_story.summary.*`, consistent with span names under `commit_story.journal.*` |
| SCH-002 | **FAIL** — `commit_story.summary.dates_requested` (registered `type: string`, originated in `runSummarize` for a genuine date-range-request-count concept) is reused in `runWeeklySummarize` (`weeks.length` — a week count) and `runMonthlySummarize` (`months.length` — a month count). Per `failure-deep-dives.md`, the validator correctly rejected this reuse at reassembly time on both call sites, but the reassembly fallback did not strip the violation out — **verified directly against the committed source**: both call sites are still present in the file that landed as PARTIAL. This is a live, committed SCH-002 violation, not just a discarded attempt |
| SCH-003 | **FAIL** — two independent type-correctness violations in the committed file: (1) `dates_requested` is registered `type: string` but `runWeeklySummarize`/`runMonthlySummarize` set it as a raw, unstringified number (`weeks.length`/`months.length`, no `String()` wrapper) — a type mismatch compounding the SCH-002 semantic-reuse failure above; (2) in the committed `runMonthlySummarize`, `commit_story.summary.months_generated_count` and `commit_story.summary.months_failed_count` — both registered `type: int` — are set via `String(result.generated.length)` / `String(result.failed.length)`, an explicit string cast against an int-typed key. Per `failure-deep-dives.md`, this second violation is uncaught by any validator rule (confirmed recurrence of RUN27-3/RUN26-1 pattern, spiny-orb issue #1037 still open) |
| CDQ-001 | PASS — exactly one `span.end()` per function, each in a `finally` block, no redundant/double-end calls |
| CDQ-002 | PASS — single `const tracer = trace.getTracer('commit-story')` at module scope, reused across all three spans |
| CDQ-003 | PASS — `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` present in every outer catch, ahead of rethrow, in all three functions |
| CDQ-005 | PASS — no `console.log` anywhere in the file; all logging (if any) goes through the project logger, not a bypass |
| CDQ-006 | PASS — no expensive/unguarded computations gate attribute values; `dates.length`/`weeks.length`/`months.length`, `force`, and the count values are all trivial, already-computed reads, not guarded expensive operations |
| CDQ-007 | PASS — no raw filesystem paths or PII in any attribute; values are counts (`dates_requested`, `daily_summaries_count`, `weekly_summaries_count`, `months_generated_count`, `months_failed_count`) and a boolean (`force`) — none are person-identifying or path-shaped |

**Failures**: SCH-002 — `commit_story.summary.dates_requested` (declared `type: string` for a date-range-request-count concept in `runSummarize`) is reused for a week count in `runWeeklySummarize` and a month count in `runMonthlySummarize`; validator correctly rejected this at reassembly on both sites, but the violation remains live in the committed file. SCH-003 — compounding type mismatch on those same two `dates_requested` call sites (raw number set against a string-typed key, no `String()` wrapper), plus an independent, validator-uncaught violation in the committed `runMonthlySummarize`: `months_generated_count`/`months_failed_count` (both `int`-typed) set via `String(...)`.

**Function commit status**: `runSummarize`/`runWeeklySummarize`/`runMonthlySummarize` committed (1 span each, 3 spans total) — the file's only 3 async/span-eligible functions. `isValidDate`, `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `showSummarizeHelp` (6 sync/pure functions) correctly received 0 spans.

**Note on function count**: the file has 9 total top-level functions (3 async/span-eligible, 6 sync/pure), not 7 as an earlier informal description assumed — all 3 span-eligible functions committed, so despite the "partial" status this file has no COV-001/COV-004 coverage gap. Its PARTIAL status stems entirely from SCH-002/SCH-003 content failures, not missing instrumentation coverage.
## Skips Evaluated (19 — 17 correct, 2 questionable)

| File | Verdict | Reasoning |
|------|---------|-----------|
| src/generators/prompts/guidelines/accessibility.js | Correct | Pre-scan: no instrumentable functions, pure sync utilities/unexported helpers, no LLM call. |
| src/generators/prompts/guidelines/anti-hallucination.js | Correct | Same pre-scan pattern; pure sync template/utility file. |
| src/generators/prompts/guidelines/index.js | Correct | Same pre-scan pattern; pure sync re-export/index file. |
| src/generators/prompts/sections/daily-summary-prompt.js | Correct | Same pre-scan pattern; pure sync prompt template, no I/O. |
| src/generators/prompts/sections/dialogue-prompt.js | Correct | Same pre-scan pattern; pure sync prompt template, no I/O. |
| src/generators/prompts/sections/monthly-summary-prompt.js | Correct | Same pre-scan pattern; pure sync prompt template, no I/O. |
| src/generators/prompts/sections/summary-prompt.js | Correct | Same pre-scan pattern; pure sync prompt template, no I/O. |
| src/generators/prompts/sections/technical-decisions-prompt.js | Correct | Same pre-scan pattern; pure sync prompt template, no I/O. |
| src/generators/prompts/sections/weekly-summary-prompt.js | Correct | Same pre-scan pattern; pure sync prompt template, no I/O. |
| src/integrators/filters/message-filter.js | Correct | Same pre-scan pattern; pure sync filter utility, no I/O. |
| src/integrators/filters/sensitive-filter.js | Correct | Same pre-scan pattern; pure sync filter utility, no I/O. |
| src/integrators/filters/token-filter.js | Correct | Same pre-scan pattern; pure sync filter utility, no I/O. |
| src/logger.js | Correct | Same pre-scan pattern; pure sync logger config, no I/O. |
| src/mcp/tools/context-capture-tool.js | **Questionable — coverage regression** | Pre-analysis explicitly flagged `saveContext` (unexported async filesystem I/O) as needing a COV-004 span, and the agent's own reasoning trace worked through the RST-004 unexported-orchestrator exception and drafted a schema extension for it — then the final output shipped 0 spans, justified only by "All exported functions are synchronous," which never addresses the flagged unexported async function. Direct regression from run-27, which committed this file with 2 spans (`commit_story.context.save_context` on `saveContext`, `commit_story.mcp.capture_context` on the handler) under the identical RST-004 reasoning. See detail below. |
| src/mcp/tools/reflection-tool.js | **Questionable — recurring gap** | Identical shape to run-27's questionable skip on this same file: pre-analysis flagged `saveReflection` as needing a COV-004 span, the agent's own reasoning trace independently re-derives the same conclusion (unexported-but-uncovered async I/O), invents a span name, and reasons through CDQ-007 sanitization for it — then the final notes claim "All exported functions are synchronous... no async I/O to trace" and ship 0 spans. The exact same self-identified-and-declined gap documented in run-26 and run-27, unresolved across three runs. **Also structurally identical to `context-capture-tool.js`'s two-span shape** (a `saveReflection`/COV-004 span plus a separate MCP-handler/COV-001 span), so the missing handler span is a second, previously-unflagged latent gap alongside the documented COV-004 one. See detail below. |
| src/traceloop-init.js | Correct | Same pre-scan pattern; pure sync init/config file, no I/O. |
| src/utils/commit-analyzer.js | Correct | Same pre-scan pattern; pure sync utility, no I/O. |
| src/utils/config.js | Correct | Same pre-scan pattern; pure sync config, no I/O. |
| src/utils/failure-placeholder.js | Correct | Same pre-scan pattern; pure sync placeholder, no I/O. |

**`context-capture-tool.js` and `reflection-tool.js` in detail:**

Both files were read directly from the instrument-branch source and confirmed structurally unchanged from run-27: each defines an unexported `async function saveContext(text)` / `async function saveReflection(text)` that performs real filesystem I/O (`mkdir(dirname(filePath), {recursive:true})` then `appendFile(...)`), called only from inside an anonymous async MCP tool handler passed to `server.tool(...)` inside the exported `registerContextCaptureTool` / `registerReflectionTool` functions (which are themselves synchronous). Nothing about either file changed in a way that would legitimately eliminate the async I/O — this rules out "file refactored to be synchronous" as an explanation for either skip.

For `context-capture-tool.js`, run-27 evaluated and committed this file with 2 spans under exactly this reasoning: `saveContext` is unexported async I/O with no exported orchestrator span covering its execution path, so the RST-004 exception applies and it earns a direct span, alongside a second span on the MCP handler itself (COV-001 entry point). Run-28's own agent-thinking trace reconstructs this identical analysis nearly verbatim — it flags `saveContext` as COV-004, works through the RST-004 tension, and concludes "I'll settle on instrumenting just `saveContext` directly" and drafts a schema extension name — then the final "Agent notes" abruptly reverses course with "All exported functions are synchronous (registerContextCaptureTool) — no async I/O to trace," which is false on its face (`saveContext` is the very async I/O function the agent's own reasoning just identified) and ships 0 spans. **This is a genuine coverage regression, not a legitimate skip**: a file that earned 2 spans in run-27 lost both in run-28 with the harness's final notes contradicting its own mid-generation reasoning.

For `reflection-tool.js`, the same failure mode recurs for a third consecutive run (run-26, run-27, run-28). Run-28's agent-thinking trace independently re-derives that `saveReflection` is unexported async I/O fitting COV-004, resolves the RST-004 question the same way, invents a span name, and reasons through CDQ-007 sanitization for the file path — a full instrumentation plan — before the final notes again claim "All exported functions are synchronous... no async I/O to trace" and ship 0 spans. Unlike `context-capture-tool.js`, this file has never been committed with a span in any run, so there is no regression here, but it is the same self-identified-and-declined coverage gap flagged as "questionable, not confirmed correct" in run-27's evaluation, now persisting unaddressed into run-28.

**Recommendation for handoff**: both files are structurally identical (`async function saveX(text)` plus `export function registerXTool(server) { server.tool(...) }`), so both carry the same two-span opportunity, not one. `context-capture-tool.js` is a **regression**: run-27 committed both a COV-004 span on `saveContext` and a separate COV-001 span on the MCP handler entry point itself (`commit_story.mcp.capture_context`); run-28 loses both. `reflection-tool.js` has never had either span committed in any run, so it's not a regression, but per-file evaluation confirms it has the same latent COV-001 + COV-004 gap as `context-capture-tool.js` — the file's own COV-004 flag on `saveReflection` was already documented; the missing COV-001 handler span is an additional, previously unflagged gap of the same class. File both as combined COV-001 + COV-004 findings. `context-capture-tool.js` is the more severe of the two — it is a measurable regression (2 spans → 0 spans) with the final agent notes text directly contradicting the agent's own preceding reasoning chain, worth flagging as a distinct "notes vs. reasoning divergence" pattern in addition to the coverage gap itself.

**Caveat on the COV-001 handler-span claim**: `@traceloop/instrumentation-mcp`'s `McpInstrumentation` (registered in `src/traceloop-init.js`) can auto-instrument `server.tool(...)` callbacks with child spans — but only when `COMMIT_STORY_TRACELOOP=true` is set, which is **not** the default and is explicitly omitted during this project's own IS scoring runs. Since manual instrumentation is the baseline this evaluation scores against (and run-27's own precedent committed a manual COV-001 span on `context-capture-tool.js`'s handler), the finding above stands as written — but note the auto-instrumentation alternative exists for anyone considering how to close this gap, rather than assuming a manual span is the only fix.

---

## Quality Failures Summary

| File | Rule | Finding |
|------|------|---------|
| git-collector.js | SCH-003 | `is_merge` declared `boolean`, set via `String(parentCount > 1)` |
| git-collector.js | CDQ-007 | Regression — raw PII `commit.author` name ships (fixed in run-27), validator downgraded to advisory-only |
| context-integrator.js | CDQ-007 | Raw PII `commit.author` re-exposed on this span (same value as git-collector.js) |
| summary-manager.js | SCH-003 | `summary_saved` declared `string`, always set as boolean (14 call sites) |
| summary-manager.js | CDQ-006 | isRecording guard applied to only 3 of ~24 setAttribute calls |
| summary-manager.js | CDQ-007 | Raw unsanitized path at 4 of 7 `file_path` sites; correctly sanitized at the other 3 in the same file |
| summarize.js (PARTIAL) | SCH-002 | `dates_requested` reused for week count and month count after being declared for a date-string concept |
| summarize.js (PARTIAL) | SCH-003 | 4 occurrences: `dates_requested` set as a raw number at 2 sites (opposite-direction mismatch vs. its string type), `months_generated_count`/`months_failed_count` set via `String(...)` at 2 sites (the RUN27-3 shape) |
| summary-detector.js | SCH-003 | All 4 newly-invented int-typed keys (`unsummarized_days_count`, `unsummarized_weeks_count`, `summarized_months_count`, `unsummarized_months_count`) set via `String(...)` (RUN27-3 shape) |
| auto-summarize.js | SCH-003 | `days_generated_count`/`days_failed_count`/`weeks_generated_count`/`weeks_failed_count` (all newly-invented, int-typed) set via `String(...)` — 6 occurrences (RUN27-3 shape) |
| context-capture-tool.js (skip) | COV-001 + COV-004 | Coverage regression — lost both the `saveContext` span and the MCP handler entry-point span (2 spans in run-27 → 0 in run-28) |
| reflection-tool.js (skip) | COV-001 + COV-004 | Never previously committed (not a regression), but structurally identical to context-capture-tool.js — has the same latent 2-span gap (handler + saveReflection), and its own COV-004 flag on saveReflection was already self-identified and declined by the agent |

**Clean files (no failures)**: claude-collector.js, journal-graph.js, summary-graph.js, mcp/server.js, journal-paths.js, journal-manager.js, index.js.

**SCH-003 total this run**: 14 occurrences across 3 files (summarize.js: 4, summary-detector.js: 4, auto-summarize.js: 6) — 12 are the RUN27-3 shape (int-typed key set via `String()`), the remaining 2 (both in summarize.js) are the opposite-direction mismatch (string-typed key set via a raw number). Every occurrence is on a key the agent invents itself in that same file; every pre-existing/reused key across all three files is correctly typed.
