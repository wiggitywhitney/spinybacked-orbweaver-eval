# Per-File Evaluation — Run-27

**Date**: 2026-09-03
**Branch**: spiny-orb/instrument-1788361335787
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 32 (13 committed + 1 partial + 18 correct skips)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check` exits 0 on all 14 committed/partial files (13 committed + 1 partial), zero syntax failures |
| NDS-002 (Tests) | **PASS** | 630 tests pass, 1 skipped (631 total, 29 test files, 28 passed + 1 skipped); duration 1.02s. The 1 skipped test is the acceptance-gate test (requires a live API key). Run directly against the instrument branch tip (`38dd870`) |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `package.json` `peerDependencies` contains `"@opentelemetry/api": "^1.9.0"` |
| API-003 | **PASS** | `dependencies` block contains only `@langchain/anthropic`, `@langchain/core`, `@langchain/langgraph`, `@modelcontextprotocol/sdk`, `@opentelemetry/instrumentation-pino`, `dotenv`, `pino`, `zod` — no vendor-specific observability SDKs (grep for `datadog\|dd-trace\|newrelic\|honeycomb` returns nothing) |
| API-004 | **PASS** | Grep for `@opentelemetry/sdk\|@opentelemetry/exporter\|@opentelemetry/resources\|@opentelemetry/instrumentation-` in `src/` returns nothing; these packages only appear in `devDependencies` |
| CDQ-008 | **PASS** | `grep -rn "getTracer" src/` confirms all 14 committed/partial files use `trace.getTracer('commit-story')` with the identical string, no variants |

---

## Committed Files (13)

### 1. collectors/claude-collector.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — try/catch/finally preserved around `collectChatMessages`; `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` + rethrow, `span.end()` in `finally`; the pre-existing empty `catch` inside `parseJSONLFile` (expected control flow for malformed JSON lines, no rethrow) was correctly left unmodified |
| COV-001 | PASS — `collectChatMessages` is the sole exported async function and COV-001 entry point, wrapped in `tracer.startActiveSpan('commit_story.context.collect', ...)` |
| COV-003 | PASS — span always ended via `finally`, including the error/rethrow path |
| COV-004 | PASS — `getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `parseJSONLFile`, `filterMessages`, `groupBySession` are all exported but synchronous; none received spans |
| COV-005 | PASS — 6 domain attributes: `commit_story.context.source`, `repo_path`, `time_window_start`, `time_window_end`, `sessions_count`, `messages_count`; all 6 confirmed present on the instrument-branch live trace (see below). **Coverage delta observation**: run-26 had 5 attributes on this span (no `repo_path`); run-27 adds `repo_path` as a new extension attribute |
| RST-001 | PASS — the 7 synchronous exported utilities are correctly left unwrapped |
| RST-004 | PASS — not applicable; no unexported async I/O helpers in this file |
| SCH-001 | PASS — all attributes namespaced under `commit_story.context.*`; span name `commit_story.context.collect` also follows the namespace |
| SCH-002 | PASS — `commit_story.context.repo_path` is a genuinely new concept (input repository path), not a near-synonym of an existing key; agent notes explicitly checked `commit_story.journal.file_path` (which covers output journal paths, not input repo paths) and correctly ruled it out as a semantic match before declaring the extension. `src/integrators/context-integrator.js` later reuses this same key with 0 new extensions, confirming this file is the correct originator |
| SCH-003 | PASS — `time_window_start`/`time_window_end` are strings via `.toISOString()`; `sessions_count`/`messages_count` are numbers via `.size`/`.length`; `repo_path` is a string matching the JSDoc `{string} repoPath` param type |
| CDQ-001 | PASS — single `span.end()` in `finally`, no redundant calls |
| CDQ-002 | PASS — `trace.getTracer('commit-story')` matches project convention |
| CDQ-003 | PASS — `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` before rethrow |
| CDQ-005 | PASS — no nullable-derived attribute values; `source` is a literal, counts are guaranteed numbers (`.size`/`.length`), timestamps are JSDoc-typed `Date` objects, `repoPath` is a required string parameter with no null branch |
| CDQ-007 | **FAIL** — `commit_story.context.repo_path` is set unconditionally to the raw, unsanitized absolute filesystem path (`repoPath`) with no `basename()` or redaction applied. The agent's own thinking block self-identifies this exact concern ("CDQ-007 discourages raw filesystem paths... `basename` isn't imported... I'll use the raw path value and flag it as a known limitation") and its notes repeat the same acknowledgment, but ships the raw value anyway. This is the identical unresolved pattern documented for `journal-paths.js` in run-26 (also FAIL there) and reconfirmed as still-open in this run's `run-summary.md` (RUN26-2, tracked as spiny-orb issue #1035) — a known, tracked gap rather than a one-off regression, but a live FAIL against the CDQ-007 bar as written. The live trace below confirms the exposure is real, not theoretical: it carries the developer's actual local machine path (`/Users/whitney.lee/Documents/Repositories/commit-story-v2`), which would leak local username/directory structure in any real deployment |

**Failures**: CDQ-007 — raw, unsanitized absolute filesystem path stored in `commit_story.context.repo_path`, self-acknowledged by the agent as a known limitation (missing `basename` import) rather than resolved. Same pattern as `journal-paths.js` (run-26), tracked under spiny-orb issue #1035.

**Datadog trace supplement**: 1 matching span found — **instrument-branch evidence** (`service:commit-story @service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd`, `resource_name:commit_story.context.collect`, captured 2026-09-03T12:23:13Z, trace `3b42cf07b106223acd3e9a8e2ac52ead`). The live span carries all 6 attributes matching the source-level assessment exactly: `source: claude_code`, `repo_path: /Users/whitney.lee/Documents/Repositories/commit-story-v2`, `sessions_count: 1`, `messages_count: 6`, `time_window_start`/`time_window_end` as ISO strings. This directly corroborates both the COV-005 attribute count and the CDQ-007 finding — the trace shows a real, un-redacted local filesystem path on the wire.
### 2. collectors/git-collector.js (6 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — span names use consistent `commit_story.git.*` / `commit_story.git.get_*` dotted notation across all 6 spans |
| API-001 | PASS — imports `trace`, `SpanStatusCode` from `@opentelemetry/api`; `tracer.startActiveSpan` used correctly in all six instrumented functions, each with `span.end()` in a `finally` |
| NDS-006 | PASS — no span-kind or context-propagation violations; child spans (`run_command`, `get_commit_metadata`, `get_commit_diff`, `get_merge_info`) nest correctly under `get_commit_data` via `Promise.all`, confirmed by parent/child `spanid`/`parentid` chains in the live trace below |
| NDS-004 | PASS |
| NDS-007 (Control Flow Preserved) | PASS (after 1 retry) — Attempt 1 introduced a nested try/catch in `runGit` that split the original error-mapping catch from the new span-recording catch, breaking control flow (2 blocking errors, logged by the validator/agent as "NDS-005" but this is spiny-orb's NDS-007). Attempt 2 fixed it with "Pattern A": the original catch block is kept as the single outer catch, with `span.recordException`/`setStatus` added at its top and all original conditional throws (`Not a git repository`, `Invalid commit reference: ...`) left in their original positions and order. Final committed `runGit` (lines 23-46) has exactly one try/catch, matching the pre-instrumentation structure |
| COV-001 | PASS — both exported entry points (`getPreviousCommitTime`, `getCommitData`) are spanned |
| COV-003 (Error Recording) | PASS (after 1 retry) — Attempt 1 had 1 blocking COV-003 error (the split-catch structure meant the propagating catch wasn't recording); Attempt 2's Pattern A fix puts `recordException`/`setStatus` in the same catch that rethrows, resolving it. All 6 spans in the final source call `recordException` + `setStatus({code: ERROR})` in their catch block |
| COV-004 | PASS — unlike run-26 (which left `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` unspanned under the RST-004 exemption), this run spans all four internal helpers in addition to the two exported functions — full coverage, no advisories needed |
| COV-005 | PASS — 4 of 6 spans carry a domain-specific attribute beyond `vcs.ref.head.revision`: `get_commit_metadata` (`commit_story.commit.message`, `commit_story.commit.timestamp`), `get_commit_diff` (`commit_story.git.diff_size`), `get_merge_info` (`commit_story.git.parent_count`). The other two (`get_previous_commit_time`, `get_commit_data`) carry only `vcs.ref.head.revision` — consistent with the agent's stated design that `get_commit_data` is a pure orchestrator whose detail lives on child spans (confirmed live: its span has no `commit_story.*` attribute while its children do). **Coverage delta observation**: vs. run-26 (2 spans, 1-2 total attributes, 0 new schema extensions), this run adds 2 new schema-extension attributes (`diff_size`, `parent_count`) and spans 4 additional functions |
| RST-001 | PASS — no sync utilities in this file requiring spans |
| RST-004 | PASS — moot this run since no unexported async helper was left unspanned (all four got spans); no exemption needed |
| SCH-001 | PASS (advisory only) — 4 SCH-001 span-name-similarity advisories fired per the instrumentation report, explicitly non-blocking; agent's note that each span represents a distinct git operation is reasonable and matches the final span names |
| SCH-002 (Attribute Keys Match Registry) | PASS (after 1 retry) — Attempt 1 had 2 blocking SCH-002 errors: `commit_story.git.is_merge` (flagged as semantic duplicate of `parent_count`) and `commit_story.commit.author` (flagged, resolved via CDQ-007 below). Attempt 2 dropped both attributes entirely; final committed source has zero SCH-002 violations |
| SCH-003 (type correctness) | **FAIL** — `commit_story.git.diff_size` is declared as an `int` schema extension ("Extension declared with type int" per the instrumentation report), but the code sets it as `span.setAttribute('commit_story.git.diff_size', String(diff.length))` — an explicit string cast. The live trace confirms this: `commit_story.git.diff_size: "2139"` is a quoted string value, not a numeric one, while the sibling `commit_story.git.parent_count: 1` (declared int, set as a bare number) is correctly typed. This is a genuine declared-vs-actual type mismatch introduced in this run, not present in run-26 (which had no `diff_size` attribute) |
| CDQ-001 | PASS — exactly one `span.end()` call per span, each in a `finally` block, no redundant calls |
| CDQ-002 | PASS — `SpanStatusCode.ERROR` set consistently on the exception path in all 6 spans |
| CDQ-003 | PASS — errors are recorded via `recordException` then rethrown in every catch; no silent swallowing |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `commit_story.commit.author` (a person's full name, PII) was explicitly removed in Attempt 2 per the CDQ-007 advisory; the raw diff content from `getCommitDiff` (unbounded, potentially sensitive) is never captured as a span attribute anywhere in the file — only its character length (`diff_size`) is recorded |

**Failures**: SCH-003 — `commit_story.git.diff_size` declared as `int` in the schema extension but emitted as a string (`String(diff.length)`) in `getCommitDiff` (line 123), confirmed mismatched at runtime by the live trace.

**Datadog trace supplement**: instrument-branch evidence (`service:commit-story @service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd`) — found all 6 committed spans in a single trace (`3b42cf07b106223acd3e9a8e2ac52ead`, 2026-09-03T12:23:13Z): `commit_story.git.get_commit_data` (parent) → `commit_story.git.get_commit_metadata`, `commit_story.git.get_commit_diff`, `commit_story.git.get_merge_info` (children via `Promise.all`) → `commit_story.git.run_command` (grandchildren). Attribute values match source exactly: `commit_story.commit.message: "docs: add PROGRESS.md entry for branch changes"`, `commit_story.commit.timestamp: "2026-09-03T07:23:09-05:00"`, `commit_story.git.parent_count: 1` (numeric), and — critically — `commit_story.git.diff_size: "2139"` (string), directly corroborating the SCH-003 type-mismatch finding above.
### 3. integrators/context-integrator.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — imports `trace, SpanStatusCode` from `@opentelemetry/api`; uses `tracer.startActiveSpan('commit_story.context.gather_for_commit', ...)` with `span.end()` in `finally` |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — original `catch` still rethrows (`throw error` after `recordException`/`setStatus`); no swallowed errors, no altered branching |
| COV-001 | PASS — `gatherContextForCommit` is the sole exported orchestrator, correctly instrumented as the entry-point span |
| COV-003 | PASS |
| COV-004 | PASS — `formatContextForPrompt` and `getContextSummary` are pure synchronous helpers, correctly skipped (RST-001) |
| COV-005 | PASS — 7 `setAttribute` calls carry meaningful domain data: `vcs.ref.head.revision`, `commit_story.context.repo_path`, `commit_story.commit.message`, `commit_story.filter.messages_before`/`.messages_after`, `commit_story.context.messages_count`/`.sessions_count` (verified directly against source, not run-summary's "0 attributes" — that figure is `attributesCreated`, new schema extensions, not attributes set in code). **Coverage delta observation**: run-26's version of this file also set `time_window_start`/`time_window_end` (9 total attributes); this run's code does not compute or set those two, dropping to 7. Not a failure — still well above the ≥1 meaningful-attribute bar — but a real behavioral difference worth flagging for anyone diffing dashboards across runs. |
| RST-001 | PASS — 2 sync functions (`formatContextForPrompt`, `getContextSummary`) correctly unspanned |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.context.gather_for_commit` declared via `schemaExtensions` since no existing schema span covers this orchestration operation (distinct from `commit_story.context.collect`, owned by `claude-collector.js`) |
| SCH-002 | PASS — all 7 attributes are pre-existing registered keys; `attributesCreated` is 0. `commit_story.context.repo_path` specifically was registered earlier in the run by `src/collectors/claude-collector.js` (file 1 of 32) and correctly *reused* here rather than re-declared, matching run-summary.md's note. No near-duplicate invented. (Minor internal inconsistency: the agent's own notes say "All six span attributes... are registered keys" but then lists 7 — a miscount in the agent's narration, not in the code or schema handling; doesn't affect the PASS.) |
| SCH-003 | PASS — no `Date` objects are passed to `setAttribute` in this version of the file (unlike run-26, which converted `commitData.timestamp`/`timeWindow` via `.toISOString()`); all 7 values set here are already primitives (string/number), so there is no type-conversion risk to violate |
| CDQ-001 | PASS — single `span.end()` in `finally`, no redundant calls |
| CDQ-002 | PASS |
| CDQ-003 | PASS — `recordException` + `setStatus(SpanStatusCode.ERROR)` both present in `catch`, ahead of rethrow |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `commit_story.context.repo_path` is a raw filesystem path (per agent notes, `node:path` isn't imported and adding a new non-OTel import solely for `path.basename()` is prohibited); flagged as a known limitation rather than fixed, which is the documented acceptable trade-off for this constraint. `commit_story.commit.message` (= `commitData.subject`) is external/freeform text but the agent checked it against the registry's PII flags (only `author` is flagged, not `message`) before including it. No nullable-field access risk: all fields read here come from an already-resolved `commitData`/`filterStats` object post-`await`. `vcs.ref.head.revision` is set once from the input `commitRef` and never re-set from `commitData.hash` in this version — differs from run-26's double-set pattern but introduces no defect. |

**Failures**: None

**Datadog trace supplement**: instrument-branch evidence (`service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd`) — 1 matching span found, `commit_story.context.gather_for_commit`, captured 2026-09-03T12:23:13Z. Live attributes confirm all 7 keys are present and populated: `commit_story.commit.message: "docs: add PROGRESS.md entry for branch changes"`, `commit_story.context.messages_count: 2`, `commit_story.context.repo_path: /Users/whitney.lee/Documents/Repositories/commit-story-v2`, `commit_story.context.sessions_count: 1`, `commit_story.filter.messages_after: 2`, `commit_story.filter.messages_before: 6`, `vcs.ref.head.revision: HEAD`. This corroborates the source-code review and confirms the absence of `time_window_start`/`time_window_end` (present in run-26, absent here) is a genuine code-level change, not a telemetry gap.
### 4. generators/journal-graph.js (4 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — span names use `commit_story.ai.*` snake_case dot-namespaced convention, no PII or dynamic values in span names |
| API-001 | PASS — only `@opentelemetry/api` (`trace`, `SpanStatusCode`) imported; no SDK/exporter/instrumentation package pulled in |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — try/catch/finally preserved unchanged in all four instrumented functions; `finally { span.end(); }` present in `summaryNode`, `technicalNode`, `dialogueNode`, `generateJournalSections`; no control-flow branch was added, removed, or reordered by instrumentation |
| COV-001 | PASS — `generateJournalSections`, the file's exported entry point, is wrapped in a span |
| COV-003 | PASS — `generateJournalSections` calls `span.recordException(error)` + `setStatus({code: SpanStatusCode.ERROR})` on failure (source lines 743-744); the three LangGraph node functions (`summaryNode`, `technicalNode`, `dialogueNode`) catch and accumulate errors into `state.errors` without marking span status — same graceful-degradation pattern documented as established for this file across prior runs |
| COV-004 | PASS — 4 async functions instrumented (`summaryNode`, `technicalNode`, `dialogueNode`, `generateJournalSections`); 8 pure sync helpers (`analyzeCommitContent`, `generateImplementationGuidance`, `formatSessionsForAI`, `formatContextForSummary`, `formatContextForUser`, `cleanDialogueOutput`, `cleanTechnicalOutput`, `cleanSummaryOutput`) correctly left unspanned per RST-001 |
| COV-005 | PASS — every span carries ≥1 meaningful domain attribute: `generate_summary` gets `section_type`, `gen_ai.request.temperature`, `gen_ai.operation.name`, `gen_ai.response.id`; `generate_technical_decisions` gets `section_type`, `gen_ai.operation.name`, `gen_ai.request.temperature`, `substantial_messages_count`; `generate_dialogue` gets `section_type`, `gen_ai.request.temperature`, `substantial_messages_count`, `max_quotes`; `generate_journal_sections` gets `vcs.ref.head.revision`, `commit_story.journal.errors_count`. Attribute mix has shifted somewhat from run-26 (e.g. `gen_ai.response.id` now present on the summary span) — noted as a coverage delta observation, not a failure |
| COV-006 | PASS — manual spans in `summaryNode`/`technicalNode`/`dialogueNode` wrap the `getModel(...).invoke(...)` calls into auto-instrumented `ChatAnthropic`/LangChain, giving explicit `commit_story.ai.*` context around the auto-instrumented LLM call boundary, same pattern noted in prior runs |
| RST-001 | PASS — no spans on the 8 sync utility functions |
| RST-004 | PASS — not triggered; no unexported async I/O function present in this file |
| SCH-001 | PASS — 7 schema extensions declared per the run log: 4 span names (`commit_story.ai.generate_summary`, `commit_story.ai.generate_technical_decisions`, `commit_story.ai.generate_dialogue`, `commit_story.ai.generate_journal_sections`) plus `commit_story.ai.substantial_messages_count`, `commit_story.ai.max_quotes`, `commit_story.journal.errors_count` |
| SCH-002 | PASS — no semantic overlap/duplication with existing schema attributes found |
| SCH-003 | PASS — `substantial_messages_count`, `max_quotes`, `errors_count`, `gen_ai.request.temperature` are numeric; `section_type` is string |
| CDQ-001 | PASS — single `span.end()` per function, called in `finally`, no double-end pattern |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS — consistent `trace.getTracer('commit-story')` at module scope, reused across all four spans |
| CDQ-007 | PASS — `vcs.ref.head.revision` guarded with `?? ''`; `substantialUserMessages`/`substantial_messages_count` guarded with `?? 0` in all three node functions; no unconditional `setAttribute` from a nullable field; `gen_ai.usage.*` token-count attributes are still absent, consistent with the avoidance strategy noted in prior runs |

**Failures**: None

**Tenth-consecutive-success claim**: Confirmed. The file committed cleanly with 4 spans, 3 attributes, 3 attempts — an attempt count that matches run-26's exactly, per `run-summary.md`'s Fix Verification table and `failure-deep-dives.md`, both of which track this as the file's tenth consecutive success across runs 18–21, 23–26, and this run. As in prior runs, the log contains no "Agent thinking" block for this file's entry (`spiny-orb-output.log` lines 349-405) — only the final `✅ SUCCESS — 4 spans, 3 attributes, 3 attempts` summary and agent notes — so no root cause can be attributed for what drove the 3 attempts versus fewer.

**Datadog trace supplement**: instrument-branch evidence (`service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd`) — all 4 spans confirmed live in trace `3b42cf07b106223acd3e9a8e2ac52ead` at `2026-09-03T12:23:13-16Z`: `commit_story.ai.generate_journal_sections` (parent, carries `vcs.ref.head.revision:38dd870` and `commit_story.journal.errors_count:0`), `commit_story.ai.generate_summary` (`section_type:summary`, `gen_ai.request.temperature:0.7`, `gen_ai.operation.name:chat`, `gen_ai.response.id` present), `commit_story.ai.generate_technical_decisions` (`section_type:technical_decisions`, `substantial_messages_count:1`, `gen_ai.request.temperature:0.1`), and `commit_story.ai.generate_dialogue` (`section_type:dialogue`, `substantial_messages_count:1`, `max_quotes:2`, `gen_ai.request.temperature:0.7`). All spans show `status: ok`. This confirms the instrumentation fires correctly at runtime on the instrument branch, not just at validation time.
### 5. generators/summary-graph.js (6 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — outer `try { ... } catch { recordException/setStatus } finally { span.end() }` wraps the pre-existing early-exit + inner try/catch in all three `*Node` functions and the three `generate*` orchestrators; original control flow untouched. |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'`; `tracer.startActiveSpan(...)` used for all 6 spans. |
| NDS-006 | PASS — instrumentation additions are confined to span creation/attribute/error-recording calls; no unrelated code motion. |
| NDS-004 | PASS — `parseSummarySections`/`parseWeeklySummarySections`/`parseMonthlySummarySections`, `formatEntriesForSummary` and siblings, and `BANNED_WORD_REPLACEMENTS`/`clean*SummaryOutput` are byte-for-byte unchanged business logic. |
| NDS-007 | PASS — inner catches in `dailySummaryNode`/`weeklySummaryNode`/`monthlySummaryNode` still return fallback text + accumulate `errors[]` without rethrowing (no `recordException`/`setStatus` added there); the outer catch in every one of the 6 functions calls `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` before rethrowing. |
| COV-001 | PASS — all 6 service entry points spanned: `dailySummaryNode`→`commit_story.ai.generate_daily_summary`, `generateDailySummary`→`commit_story.ai.run_daily_summary_graph`, `weeklySummaryNode`→`commit_story.ai.generate_weekly_summary`, `generateWeeklySummary`→`commit_story.ai.run_weekly_summary_graph`, `monthlySummaryNode`→`commit_story.ai.generate_monthly_summary`, `generateMonthlySummary`→`commit_story.ai.run_monthly_summary_graph`. |
| COV-003 | PASS — exactly one `startActiveSpan` per function, no nesting. |
| COV-004 | PASS — all 6 async functions instrumented; sync helpers (`getModel`, `resetModel`, `format*`, `parse*`, `clean*`, `build*Graph`, `get*Graph`) correctly left span-free. |
| COV-005 | PASS — every span carries ≥1 domain attribute (node spans: 2 attrs; orchestrator spans: 3 attrs including `errors_count`). **Coverage delta observation**: attempt 1 used distinct `commit_story.summary.daily_summary_count` / `weekly_summary_count` keys; the SCH-002 fix in attempt 2 collapsed both into the shared `commit_story.summary.entry_count` key, so the committed attribute set differs from attempt 1's plan — this is a key consolidation, not a coverage loss. |
| COV-006 | PASS — manual node/orchestrator spans (`commit_story.ai.generate_*_summary`, `commit_story.ai.run_*_summary_graph`) wrap the application logic (prompt building, `getModel(0.7).invoke(...)`, cleaning/parsing) sitting above the auto-instrumented `ChatAnthropic.invoke()` call — no manual span duplicates the LangChain auto-instrumentation, consistent with journal-graph.js's pattern. |
| RST-001 | PASS — `formatEntriesForSummary`/`formatDailySummariesForWeekly`/`formatWeeklySummariesForMonthly`, all three `clean*SummaryOutput`, and all three `parse*SummarySections` are sync-only and correctly left with 0 spans. |
| RST-004 | PASS — all 6 instrumented functions are exported (`export async function ...`); unexported helpers (`parseSummarySections`, `buildGraph`/`getGraph` and weekly/monthly equivalents) are all sync and appropriately un-spanned — no exported-orchestrator-missing-a-span gap. |
| SCH-001 | PASS — all custom attributes namespaced under `commit_story.*` (`commit_story.journal.entry_date`, `commit_story.summary.entry_count`, `commit_story.journal.errors_count`, `commit_story.summary.week_label`, `commit_story.summary.month_label`). |
| SCH-002 | PASS — validator flagged `commit_story.summary.daily_summary_count`/`weekly_summary_count` in attempt 1 as semantic duplicates of `commit_story.summary.entry_count`; attempt 2 replaced both with `entry_count`, confirmed in final source used identically for `entries?.length`, `dailySummaries?.length`, and `weeklySummaries?.length`. **Watch item**: this reuses one key across three conceptually different counts (journal entries, daily summaries, weekly summaries) under a shared "items being consolidated" rationale — looser than a single well-scoped meaning, similar in shape (though not identical) to the `quotes_count`/`reflections_count` semantic-mismatch pattern flagged for journal-manager.js. Not a failure since the validator accepted the dedup, but worth tracking if the schema's `entry_count` definition needs tightening. |
| SCH-003 | PASS — `entry_count`/`errors_count` are ints (`?.length ?? 0`), `entry_date`/`week_label`/`month_label` are strings. Confirmed live: Datadog trace shows `entry_count: 28` and `errors_count: 0` as numeric, `entry_date: "2026-09-02"` as string. |
| CDQ-001 | PASS — single `span.end()` per span via `finally`, no double-end paths (attempt 1's thinking log explicitly worked through avoiding a double-end on the early-exit branch). |
| CDQ-002 | PASS — standard `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` in every outer catch, before rethrow. |
| CDQ-003 | PASS — single `const tracer = trace.getTracer('commit-story')` at module scope, reused for all 6 spans. |
| CDQ-005 | PASS — `logger.info` used for all logging in this file; no `console.log`. |
| CDQ-007 | PASS — attributes are `entry_date`/`week_label`/`month_label` (period labels, not PII), `entry_count`/`errors_count` (ints) — no author/committer/username/raw filesystem-path attributes present. |

**Failures**: None.

**Documentation accuracy note**: `run-summary.md` (line 63) states this file "Matches run-26 exactly." That claim does not hold against the committed source: run-26's attribute set was `entries_count`, `entry_date`, `section_type`, `week_label`, `month_label`, `gen_ai.request.temperature` (per run-26 per-file section), while run-27's actual committed attributes are `entry_date`, `entry_count` (renamed from `entries_count`, reused instead of separate daily/weekly labels), `errors_count`, `week_label`, `month_label` — no `section_type` and no `gen_ai.request.temperature`. Span counts (6) and attempt counts (2) do match, but the attribute-level claim is inaccurate.

**Datadog trace supplement**: Direct **instrument-branch evidence** (`@service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd`) — trace `3b42cf07b106223acd3e9a8e2ac52ead` (2026-09-03T12:23:16Z) contains 2 of the file's 6 spans: `commit_story.ai.run_daily_summary_graph` and `commit_story.ai.generate_daily_summary`, both carrying `commit_story.summary.entry_count: 28`, `commit_story.journal.entry_date: "2026-09-02"`, and (on the orchestrator span) `commit_story.journal.errors_count: 0` — directly corroborating COV-001, COV-005, and the int/string typing under SCH-003. The remaining 4 spans in this file (weekly/monthly node + orchestrator pairs) were not found in this query window; no corroborating evidence for those was located, so no claim is made about them beyond the static source review above.
### 6. mcp/tools/context-capture-tool.js (2 spans — see span-count correction below)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — the tool handler's catch block returns error content without rethrowing (graceful degradation); no `recordException`/`setStatus(ERROR)` added, matching the agent's own stated reasoning that NDS-007 overrides COV-003 here. |
| COV-001 | PASS — the anonymous async handler passed to `server.tool()` is correctly treated as the MCP entry point and spanned (`commit_story.mcp.capture_context`). |
| COV-003 | PASS — `saveContext`'s catch (which rethrows) correctly calls `recordException` + `setStatus(ERROR)` before `span.end()` in `finally`; the handler's non-rethrowing catch correctly does not (per NDS-007). |
| COV-004 | PASS — `saveContext` is the sole async I/O function (`mkdir` + `appendFile`) and is wrapped in `startActiveSpan` with proper try/catch/finally. |
| COV-005 | PASS — both spans carry attributes (see verification below); not attribute-empty despite the run-summary's "0" figure. |
| RST-001 | PASS — `getContextPath`, `formatTimestamp`, `formatContextEntry` (sync helpers) and `registerContextCaptureTool` (sync registration) are correctly left uninstrumented. |
| RST-004 | PASS — `saveContext` is unexported but no orchestrator span covers its execution path, so the RST-004 exception correctly applies and it gets a direct span. |
| SCH-001 | PASS — both new span names (`commit_story.context.save_context`, `commit_story.mcp.capture_context`) are declared as schema extensions with stated justification that they are distinct operation classes from existing registry spans. |
| SCH-002 | PASS — agent explicitly checked both new names against the existing `commit_story.context.collect`-family spans and correctly distinguished persistence (this file) from collection (elsewhere) — no semantic duplicate created. |
| SCH-003 | PASS — no new attribute keys were minted; both `commit_story.journal.file_path` and `commit_story.context.source` reuse pre-existing registry keys, consistent with zero `attributesCreated`. |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS — attributes follow the `commit_story.journal.*` / `commit_story.context.*` dotted namespace convention. |
| CDQ-005 | PASS — attribute values are plain strings (file path, `'mcp'` source tag), no complex/unbounded types. |
| CDQ-007 | ADVISORY — `commit_story.journal.file_path` stores the full relative path (`journal/context/YYYY-MM/YYYY-MM-DD.md`), the same lower-severity pattern flagged in run-26 (raw path vs. basename). The user-supplied `text` parameter was correctly excluded from span attributes as unbounded/potentially sensitive content, per the agent's own notes — so this isn't a clean fail, only the path-form advisory carries over. |

**Failures**: None (one ADVISORY on CDQ-007, carried over from run-26's pattern for this same attribute).

**Attribute-count / span-count verification (watch item)**: Direct source inspection (`git show spiny-orb/instrument-1788361335787:src/mcp/tools/context-capture-tool.js`, confirmed only one commit touches this file, no alternate debug-dump variant) shows exactly **2** `tracer.startActiveSpan` calls — `commit_story.context.save_context` and `commit_story.mcp.capture_context` — not the 3 spans reported in `spiny-orb-output.log`'s `✅ SUCCESS` line and in `run-summary.md`. This means the true cross-run trend for this file is **1→2 spans (run-26→run-27), not 1→3** as currently documented — a reporting discrepancy, not an instrumentation defect. Attribute count: 3 `setAttribute` calls across those 2 spans, covering 2 distinct keys (`commit_story.journal.file_path` used on both spans, `commit_story.context.source` on the handler span). `attributesCreated: 0` in the log is correctly zero since both keys are pre-existing registry attributes — not evidence the spans are attribute-empty, confirming the run-summary's stated watch-item caution was warranted.

**Datadog trace supplement**: No matching span found, direct or corroborating. Queried `service:commit-story @service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd` filtered to `resource_name:commit_story.context.save_context OR resource_name:commit_story.mcp.capture_context` — 0 results. Broadened to all resource names for that instance id — 36 spans returned, all tagged `git.commit.sha:8bea39229d24fc03910e3d9f27c99a65da816cac`, i.e. live dogfooding traffic from `main` (journal/summary spans like `commit_story.journal.trigger_auto_summaries`), not the run-27 instrument branch and not this file's code path. A repo-wide search for either span name with no instance-id filter also returned 0 results. No instrument-branch evidence and no main-branch corroborating evidence exists for either span in this run.
### 7. mcp/server.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
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
| CDQ-007 | PASS |

**Failures**: None

**Verification of "Matches run-26" claim**: Confirmed against source. `main()` gets the single `commit_story.mcp.server.start` span (COV-001, entry point), with `commit_story.mcp.transport = 'stdio'` as its one attribute, wrapped in try/catch/finally with `span.recordException(error)`, `span.setStatus({code: SpanStatusCode.ERROR})`, and `span.end()` in `finally`. `createServer()` remains a synchronous, unexported, I/O-free helper correctly left unspanned (RST-001/RST-004). Both the span name and the attribute key are declared as schema extensions (SCH-001/SCH-003). `@modelcontextprotocol/sdk` usage is correctly deferred to `@traceloop/instrumentation-mcp` auto-instrumentation rather than manually wrapped. This is structurally identical to run-26's implementation of this file.

Unlike run-26, this run's agent-thinking block never mentions a planned `server.name`/PII attribute that didn't make it into the final code — the thinking log here only ever discusses the `commit_story.mcp.transport` attribute and delivers exactly that. So the CDQ-002 plan/implementation-mismatch advisory noted in run-26 does not apply to run-27; CDQ-002 is a clean PASS here.

**Datadog trace supplement**: No `commit_story.mcp.server.start` span found for `service:commit-story @service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd` (instrument-branch evidence). That instance ID does emit spans — 36 matched over the last 30 days — but all belong to a single `commit_story.cli.main` trace (git commit `8bea39229d24fc03910e3d9f27c99a65da816cac`, a normal `node src/index.js` dry-run from 2026-09-03), not an MCP server invocation. This mirrors run-26's finding exactly: the MCP server entry point is not exercised by the CLI dry-run harness used for trace collection, so the absence of a matching span is an expected coverage gap in the trace evidence, not a sign of instrumentation failure.
### 8. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — full try/catch/finally with `recordException`, `setStatus(ERROR)`, `span.end()` in `finally` |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — no swallowed-error branches in this file; the single catch re-throws after recording |
| COV-001 | PASS — `ensureDirectory` (the sole async, I/O-performing exported function) is instrumented as a service entry point |
| COV-003 | PASS |
| COV-004 | PASS — the 11 synchronous path-builder/formatter functions are correctly left unspanned |
| COV-005 | PASS — `commit_story.journal.file_path` is a meaningful domain attribute, corroborated live |
| RST-001 | PASS — agent notes explicitly enumerate all sync functions (`getYearMonth`, `getDateString`, `getJournalEntryPath`, `getReflectionPath`, `getContextPath`, `getReflectionsDirectory`, `parseDateFromFilename`, `getJournalRoot`, `getISOWeekString`, `getSummaryPath`, `getSummariesDirectory`) and skips spans on all of them |
| RST-004 | PASS |
| SCH-001 | PASS — `commit_story.journal.ensure_directory` correctly declared as a schema extension (no pre-existing span name fit) |
| SCH-002 | ADVISORY — reused the existing `commit_story.journal.file_path` key rather than inventing a near-synonym; the agent's own thinking log calls the semantic fit only "a close enough semantic match," since the registered brief describes an *output* file path for a journal entry, while this usage is the *directory-creation input* path — a looser but not incorrect reuse |
| SCH-003 | PASS — string type, matches |
| CDQ-001 | PASS — no redundant `span.end()` |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS — attribute set unconditionally, before the I/O call |
| CDQ-007 | FAIL — `filePath` is stored as a raw filesystem path (live-confirmed values: `journal/summaries/daily/2026-09-02.md`, `journal/entries/2026-09/2026-09-03.md`) with no `basename()` transformation. The agent's own thinking block states: "On the PII question for filePath, the guidance favors basename or a relative path over raw filesystem paths, but since basename isn't already imported (only join and dirname are), I'll keep the raw value per the constraint that substitutions only apply when the utility is already available." Its written notes repeat the same self-identified gap: "CDQ-007 (Attribute Data Quality): filePath is a raw filesystem path. basename from node:path is not imported in this file (only dirname and join are), so the raw value is used as-is per the constraint that no new non-OTel imports should be added." This is a self-identified-fix case under the RUN26-2/run-26 CDQ-007 precedent — the agent named the exact cost-free remediation (`basename()`) and declined to apply it, so this scores a canonical FAIL rather than advisory. |

**Failures**: CDQ-007 — raw filesystem path (`commit_story.journal.file_path`) stored without `basename()` applied, despite the agent's own generation-time reasoning explicitly naming `basename` from `node:path` as the fix and declining to add the import. This is the same unresolved finding flagged in RUN26-2 as still outstanding.

**Datadog trace supplement (instrument-branch evidence, `service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd`)**: Two `commit_story.journal.ensure_directory` spans found, both `status:ok`, each carrying exactly one custom attribute `commit_story.journal.file_path` with raw relative paths (`journal/summaries/daily/2026-09-02.md` and `journal/entries/2026-09/2026-09-03.md`) — directly confirming the source-level CDQ-007 finding live, with no basename transformation applied in either observed span.
### 9. managers/journal-manager.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no truthy guard removed anywhere; `commit.shortHash`/`commit.timestamp` are treated as required per JSDoc and set unconditionally without altering any pre-existing guard logic |
| API-001 | PASS — `trace.getTracer('commit-story')`, standard OTel JS API usage |
| NDS-006 | PASS — no dead code or logic removed; both instrumented functions preserve their original bodies verbatim inside the span wrapper |
| NDS-004 | PASS — control flow (early return on duplicate-entry skip, regenerate-on-stale-placeholder path, chronological sort/return in `discoverReflections`) is byte-for-byte unchanged, just wrapped |
| NDS-007 | PASS — the `ENOENT`-only-rethrow catch in `saveJournalEntry` and the two silent `continue`-on-error catches in `discoverReflections` are left unmodified; only the outer span-level catch in each function calls `recordException`/`setStatus`, matching the "Expected Catch Unmodified" exemption |
| COV-001 | PASS — both exported async functions (`saveJournalEntry`, `discoverReflections`) are correctly identified as entry points and each gets its own span |
| COV-003 | PASS — both spans' outer `catch` blocks call `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` before rethrow, in `finally` calling `span.end()` |
| COV-004 | PASS — all exported async I/O functions in the file are covered; no entry point is missed |
| COV-005 | PASS — attribute coverage present: `commit_story.journal.file_path`, `commit_story.journal.entry_date`, `vcs.ref.head.revision` on `save_entry`; `commit_story.context.time_window_start/end`, `commit_story.journal.quotes_count` on `discover_reflections` |
| RST-001 | PASS — all 10 synchronous pure helpers (`extractFilesFromDiff`, `countDiffLines`, `formatTimestamp`, `formatReflectionsSection`, `formatJournalEntry`, `parseReflectionEntry`, `parseTimeString`, `parseReflectionsFile`, `isInTimeWindow`, `getYearMonthRange`) correctly skipped, no utility spans added |
| RST-004 | PASS — same helper set, all unexported/internal, correctly left uninstrumented |
| SCH-001 | PASS — new span names `commit_story.journal.save_entry` and `commit_story.journal.discover_reflections` follow the existing `commit_story.<domain>.<action>` namespace convention and are declared in `schemaExtensions` |
| SCH-002 | PASS (narrowly) — no new/duplicate attribute key was invented; the agent reused the existing registered `commit_story.journal.quotes_count` key rather than creating a synonym. However, the reuse decision itself is semantically wrong — see the unrubriced finding below. This rule, as a schema-mechanics check (new key vs. existing key), doesn't catch a wrong *choice* of existing key, only invention of new ones, so it passes on its own terms while the real problem surfaces elsewhere |
| SCH-003 | PASS — RUN26-1 fix confirmed. Source: `span.setAttribute('commit_story.journal.quotes_count', reflections.length)` — raw `Array.length` int, no `String()` wrapper. Registry (`semconv/attributes.yaml:138-144`, mirrored in `telemetry/registry/attributes.yaml`) declares `type: int`. Datadog instrument-branch evidence corroborates: `commit_story.journal.quotes_count: 0` is emitted as a bare integer, not a quoted string |
| CDQ-001 | PASS — attribute keys use consistent, already-registered dotted naming; no ad hoc naming introduced |
| CDQ-002 | PASS — no redundant/duplicate attributes set across the two spans |
| CDQ-003 | PASS — values are set once, at the point of computation, not recomputed or shadowed |
| CDQ-005 | FAIL — see unrubriced finding below; scoring the *derived-value correctness* angle of CDQ-005 here because the value written (`reflections.length`, a correct int) is being written into a key whose registered semantics it does not satisfy, making the attribute's meaning incorrect for any downstream consumer even though its type is correct |
| CDQ-007 | PASS (with caveat) — `commit_story.journal.file_path` uses the raw `entryPath` with no `basename()` shortening, which the agent itself flagged as a known limitation (no `basename` import). In practice this is not a PII/absolute-path leak: the sole call site (`src/index.js:451`) always passes `basePath = '.'`, so `entryPath` resolves to a project-relative path (confirmed live: `journal/entries/2026-09/2026-09-03.md`), matching the registry's own example format. The limitation is real but latent — if a future caller ever passes an absolute `basePath` (e.g., `process.cwd()`), the raw path could leak local username/filesystem structure with no code-level guard against it |

**Failures**: CDQ-005 (see unrubriced finding — the `quotes_count` value is a correct integer but is written to a key whose registered meaning it does not satisfy).

**Semantic mismatch note (quotes_count reused for reflections)**: Confirmed as a real and significant finding. The registry (`semconv/attributes.yaml:138-141`, mirrored in `telemetry/registry/attributes.yaml:154-157`) defines `commit_story.journal.quotes_count` as: `brief: Number of developer quotes extracted for the entry` (examples: 5, 12). That description ties the attribute to the dialogue-extraction pipeline in `src/generators/journal-graph.js`, where an LLM extracts verbatim human quotes from chat history for the journal entry's "Development Dialogue" section (see `dialogue-prompt.js`, `commit_story.ai.max_quotes` config attribute). "Reflections," by contrast, are a wholly separate, unrelated concept in this codebase: standalone developer-authored notes stored as markdown files under `journal/reflections/<year-month>/`, discovered by `discoverReflections()` via filesystem scan and time-window filtering — no LLM involved, no relationship to the chat-derived "quotes" the schema describes.

A repo-wide search confirms `commit_story.journal.quotes_count` has exactly one writer in the entire codebase: `journal-manager.js:431`, inside `discoverReflections`. Nothing in `journal-graph.js` (the actual quote-extraction code) ever populates this key. That means the registered "developer quotes count" metric is not just occasionally wrong — it is *entirely and permanently supplanted* by the reflections count. Any dashboard, alert, or downstream query built against `commit_story.journal.quotes_count` under its documented meaning would silently measure something else: how many standalone reflection notes a developer wrote in the commit's time window, not how many quotes the AI pulled from chat dialogue.

This is notable because the immediately preceding run (run-26) faced this exact fork in the decision tree and made the opposite, correct call: its agent notes explicitly record that it "considered reusing `commit_story.journal.quotes_count` for the reflections count, correctly rejected it as a false synonym (quotes vs. reflections are semantically distinct data sources), and declared a new key instead" (`commit_story.journal.reflections_count`, which then failed for an unrelated `String()`-wrapping reason — SCH-003). Run-27's agent reasoned through the same fork and asserted the false equivalence directly in its own notes: *"`commit_story.journal.quotes_count` is set on the `discoverReflections` span to capture the number of reflections discovered — this matches the registered attribute's semantics (number of developer quotes/reflections found)."* That parenthetical ("developer quotes/reflections") is the agent inventing a merged meaning that the registry does not support — the registry says "quotes," full stop, and elsewhere in the codebase "quotes" and "reflections" are built, sourced, and stored through completely disjoint code paths.

**Which rule this is scored under and why**: No existing rule in the rubric cleanly targets "correct type, wrong registered key." SCH-003 (type mismatch) is a true PASS here — the int/string question is resolved. SCH-002 (schema attribute reuse) passes on its narrow mechanical reading (no new synonym key was invented), but that reading is exactly what lets this slip through: SCH-002 apparently checks for invented duplicates, not for whether a *chosen* existing key is the *right* one. I am scoring the substance of this finding under CDQ-005 (derived/attribute-value correctness) since the value (an int, correctly derived from `reflections.length`) is being placed under a key whose contract it violates — a correctness defect on what the attribute means, not on its shape. If CDQ-005 is defined more narrowly elsewhere as strictly "nullable-handling," treat this as an unrubriced finding instead; either way, it should be tracked, since no current rule combination reliably catches "agent reasons its way into a false semantic equivalence and reuses an existing key incorrectly."

**Datadog trace supplement**: Found both matching spans under `service:commit-story @service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd` (instrument-branch evidence), trace `3b42cf07b106223acd3e9a8e2ac52ead`, timestamped 2026-09-03T12:23:16Z:
- `commit_story.journal.save_entry` — `commit_story.journal.file_path: journal/entries/2026-09/2026-09-03.md` (confirms relative, non-PII path in practice), `commit_story.journal.entry_date: "2026-09-03"`, `vcs.ref.head.revision: 38dd870`.
- `commit_story.journal.discover_reflections` — `commit_story.context.time_window_start: "2026-09-02T16:39:33.000Z"`, `time_window_end: "2026-09-03T12:23:09.000Z"`, `commit_story.journal.quotes_count: 0` — emitted as a bare integer (not the string `"0"`), directly corroborating the SCH-003 PASS and demonstrating live that the false-semantics value (a reflections count of 0, not a quotes count) is what actually reaches Datadog under this key.
### 10. commands/summarize.js (3 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original parsing/loop/generation logic in `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize` unchanged; only span wrapping, try/catch/finally, and `setAttribute` calls added |
| API-001 | PASS — uses `@opentelemetry/api` (`trace`, `SpanStatusCode`) exclusively, no SDK imports |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — inner per-item catch blocks (per-date/week/month loop failures, the empty `access(summaryPath)` existence-check catch) correctly left unmodified as expected-condition/graceful-degradation catches; only the outer span-wrapper catch gets `recordException`/`setStatus(ERROR)` |
| COV-001 | PASS — `runSummarize`, `runWeeklySummarize`, `runMonthlySummarize` all wrapped as entry-point spans (`commit_story.journal.run_summarize`, `run_weekly_summarize`, `run_monthly_summarize`) |
| COV-003 | PASS — each span has an outer try/catch/finally calling `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})`, span always ends in `finally` |
| COV-004 | PASS — the six sync helpers (`isValidDate`, `isValidWeekString`, `isValidMonthString`, `expandDateRange`, `parseSummarizeArgs`, `showSummarizeHelp`) correctly get no spans; only the three async entry points are spanned |
| COV-005 | PASS — `dates_count`/`weeks.length`/`months_count`, `force`, `errors_count`, `entry_count`, `repo_path` are all real domain values, not placeholders |
| RST-001 | PASS — same six synchronous utilities correctly skipped |
| RST-004 | PASS — no redundant/duplicate spans |
| SCH-001 | PASS — no advisory duplicate-span-name flag appears in the log for this file (unlike run-26, where the validator flagged `run_weekly_summarize`/`run_monthly_summarize` as possible duplicates of `run_summarize`) |
| SCH-002 | ADVISORY — unresolved data-contract issue carried over from run-26, partially fixed: `runMonthlySummarize` now uses its own attribute (`commit_story.summary.months_count`), but `runWeeklySummarize` still calls `span.setAttribute('commit_story.journal.dates_count', weeks.length)` (line ~437) — reusing the "dates" attribute to hold a **week** count. A consumer reading `commit_story.journal.dates_count` on the weekly span sees a mislabeled value. This is the same semantic-duplicate collapse run-26 flagged, now half-resolved. |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS — no PII/sensitive data attributes |
| CDQ-003 | PASS |
| CDQ-005 | PASS — `force` set as native boolean, not stringified |
| CDQ-007 | PASS — `basePath` set raw as `commit_story.context.repo_path` with no `path.basename` transform; consistent with the codebase convention (no `path` import in this file, so no transform utility is "already available") |

**Failures**: None per the validator's rule check, but flagging the same class of issue run-26 raised: `commit_story.journal.dates_count` on `runWeeklySummarize` holds a count of ISO week strings, not dates — a naming/semantics mismatch that SCH-002's rule-check does not catch.

**Attribute-count verification**: The log reports "3 spans, 3 attributes, 3 attempts" and the schema-extensions block lists exactly 3 *new* attribute keys (`commit_story.journal.dates_count`, `commit_story.journal.force`, `commit_story.summary.months_count`) alongside 3 new span-name extensions — confirming `attributesCreated` counts only newly-registered schema keys, not total `setAttribute` calls. Reading the source directly, the actual attribute-setting is much higher: 13 total `setAttribute` calls across the 3 spans, using 6 distinct attribute keys (`repo_path`, `dates_count`, `force`, `errors_count`, `entry_count`, `months_count`) — 3 of those 6 keys (`repo_path`, `errors_count`, `entry_count`) were already registered and reused, not new. So run-summary.md's "new-attribute count down sharply (9→3)" is accurate as a measure of *new schema registrations*, but is not a measure of instrumentation density — this file sets roughly the same volume of real attributes as before, just against a smaller set of newly-registered keys.

**Datadog trace supplement**: Queried `service:commit-story @service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd resource_name:*summarize*` (instrument-branch evidence — this instance id matches the confirmed instrument-branch instance per `trace-artifact.md`'s `vcs.ref.head.revision` correction) and got 6 matches, but all 6 belong to the neighboring `summary-detector.js` file's span names (`get_summarized_months`, `find_unsummarized_months`, `get_summarized_weeks`, `find_unsummarized_weeks`, `find_unsummarized_days`, `get_summarized_days`) — not this file. A follow-up query specifically for this file's own span names (`commit_story.journal.run_summarize`, `run_weekly_summarize`, `run_monthly_summarize`) returned 0 spans in the last 30 days. No trace evidence — instrument-branch or main-branch — exists for `src/commands/summarize.js` specifically.
### 11. utils/summary-detector.js (9 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
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
| CDQ-007 | ADVISORY |

**Failures**: None. One advisory finding, non-blocking:
- CDQ-007 (×14, all on `commit_story.context.repo_path`): every span sets this from the raw `basePath` parameter without a basename transformation. The `.instrumentation.md` report flags this itself and classifies it as lower severity, noting `path.basename` isn't imported in the file. Real-world risk is low since `basePath` defaults to `.` and is caller-supplied, but per the rule's letter it's a raw filesystem path.

Notable improvement over run-26: all four unexported async helpers (`getSummarizedDays`, `getSummarizedWeeks`, `getSummarizedMonths`, `getWeeksWithWeeklySummaries`) got their own spans this run rather than being left as a COV-004 advisory gap — full coverage, no unresolved internal-helper question this time.

**Attribute-count verification**: The framing in `run-summary.md` ("attribute count down (3→1)") holds up, but only as a count of *new schema-extension attributes* — it is not the total attribute-setting activity in the file. Verified directly from source: all 9 spans call `setAttribute` exactly twice each (one `commit_story.context.repo_path` input, one output count), for 18 total `setAttribute` calls using 4 distinct attribute keys — `commit_story.context.repo_path`, `commit_story.journal.dates_count`, `commit_story.journal.weeks_count`, and `commit_story.summary.months_count`. Of those four, only `commit_story.journal.weeks_count` is a genuinely new schema extension (confirmed against both the log's "Schema extensions" block and the `.instrumentation.md` report, which explicitly states `attributesCreated = 1`); the other three keys were already registered and are reused. So "1" is correct for new schema extensions, matching the note's intent, but a reader could misread "attribute count" as total attributes emitted, which is 4 (or 18 call sites) — worth keeping that distinction explicit going forward.

One type inconsistency worth flagging for future runs: `weeks_count` is consistently wrapped in `String(...)` at all three call sites, while `dates_count` and `months_count` are set as raw numbers — a self-consistent choice for the new attribute, but it diverges from the numeric-count pattern used elsewhere in this same file.

**Datadog trace supplement**: Found matching spans for all 9 function names.
- **Instrument-branch evidence** (`service:commit-story`, `service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd`, trace `3b42cf07b106223acd3e9a8e2ac52ead`, timestamp 2026-09-03T12:23:31): `commit_story.journal.get_weeks_with_weekly_summaries` (`repo_path: "."`, `weeks_count: "11"`), `commit_story.journal.get_summarized_months` (`months_count: 5`), `commit_story.journal.find_unsummarized_months` (`months_count: 0`). Attribute keys, values, and types (string for `weeks_count`, integer for `months_count`) match the committed source exactly.
- **Main-branch evidence (corroborating, not direct)**: additional matching spans for all 9 span names found under other `service.instance.id` values (`e61ed017-ddc9-4bef-88d3-f47dd2d57883`, `8b597d10-8905-4b09-80f9-4de97b823654`) on 2026-09-03/04, showing the same attribute shapes (`dates_count` as int, `weeks_count` as string) consistently across runs — corroborating but not run-27 instrument-branch traffic.
### 12. managers/auto-summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
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
| CDQ-007 | ADVISORY |

**Failures**: None

**Notes**: All three exported entry points (`triggerAutoSummaries`, `triggerAutoWeeklySummaries`, `triggerAutoMonthlySummaries`) are wrapped in `tracer.startActiveSpan` with try/catch/finally, `recordException`/`setStatus(ERROR)` on the outer catch, and `span.end()` in `finally` (API-001, CDQ-001, CDQ-003, CDQ-005). `getErrorMessage` is correctly skipped as a pure, unexported, synchronous helper (RST-001, RST-004). The inner per-item catch blocks (which push to `result.failed`/`result.errors` without rethrowing) are left untouched — correctly treated as expected control-flow, not span-worthy errors (NDS-007). Multi-line object literals and the early-return path in `triggerAutoSummaries` are preserved verbatim, with `setAttribute` calls added before each return rather than restructuring the return statements (NDS-003, NDS-004, NDS-006). All 6 attributes used (`commit_story.context.repo_path`, `commit_story.journal.dates_count`, `commit_story.journal.weeks_count`, `commit_story.summary.months_count`, `commit_story.summary.entry_count`, `commit_story.journal.errors_count`) are reused from the existing schema — zero new attributes created, and the semantic matches (dates/weeks/months/entry/error counts) are accurate, not forced (SCH-001, SCH-002). Three new span names were registered under the existing `commit_story.journal.*` namespace after confirming no existing schema span fit these three trigger functions, which is consistent with registry conventions (SCH-003). CDQ-007 is ADVISORY because `commit_story.context.repo_path` is set to `basePath` (a path-like value, default `.`) under an attribute key that is not namespaced `file.*` — the same pattern flagged in run-26 for this identical line, confirming the run-summary's "Matches run-26" claim held up under direct source inspection rather than assumption.

**Datadog trace supplement**: instrument-branch evidence (`service:commit-story @service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd`) found all three spans live and correctly parent/child nested in a single trace (`trace_id: 3b42cf07b106223acd3e9a8e2ac52ead`): `commit_story.journal.trigger_auto_summaries` (parent) with `commit_story.context.repo_path=.`, `commit_story.journal.dates_count=1`, `commit_story.summary.entry_count=1`, `commit_story.journal.errors_count=0`; `commit_story.journal.trigger_auto_weekly_summaries` and `commit_story.journal.trigger_auto_monthly_summaries` (children) each carrying their respective `weeks_count`/`months_count`, `entry_count`, and `errors_count` attributes at 0. All attribute names and values match the static source review above exactly, directly corroborating the code-based rubric assessment.
### 13. index.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
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
| CDQ-007 | PASS |

**Failures**: None. Two entry points got spans: `commit_story.cli.handle_summarize` wraps the exported `handleSummarize` CLI subcommand handler, and `commit_story.cli.main` wraps the exported `main` orchestration function — both declared as schema extensions under an invented `cli` category, since none of the existing categories (`ai`, `context`, `git`, `journal`, `mcp`) fit CLI dispatch. The six synchronous, unexported utility functions (`parseArgs`, `showHelp`, `isGitRepository`, `isValidCommitRef`, `validateEnvironment`, `getPreviousCommitTime`) were correctly skipped per RST-001/RST-004. The inner `try/catch` around `triggerAutoSummaries` in `main` was left untouched (no `recordException`/`setStatus`) per NDS-007, since it's a graceful-degradation catch that logs a warning and does not rethrow — control flow preserved. All 5 attributes set (`commit_story.journal.force`, `commit_story.journal.weeks_count`, `commit_story.summary.months_count`, `commit_story.journal.dates_count`, `vcs.ref.head.revision`) are pre-registered schema attributes (`attributesCreated: 0`), and `parsed.force ?? false` correctly guards the nullable case. `process.exit()` calls in the file's bottom-level runner happen inside `.then()/.catch()` after `main()` resolves, outside the span callback — no CDQ-001 concern.

**Note on "Matches run-26" claim**: Verified against source — this run's `main` span does **not** set a `commit_story.journal.file_path` attribute on `savedPath` at all (only `logger.info({ path: savedPath }, ...)` logs it, off-span). Run-26's version of this file did set that attribute and drew a CDQ-007 advisory for using a raw path instead of a basename. This run's instrumentation is narrower on that point — no such attribute, hence no CDQ-007 advisory — so the file is not an exact match to run-26; it is a clean full PASS across all rules where run-26 had one advisory.

**Datadog trace supplement**: Found one matching span via **instrument-branch evidence** (`service:commit-story @service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd`) — `resource_name:commit_story.cli.main` (trace `3b42cf07b106223acd3e9a8e2ac52ead`, 2026-09-03T12:23:13Z, status `ok`). `vcs.ref.head.revision` on the span is the literal string `"HEAD"`, matching the source's default before resolution. No matching span for `commit_story.cli.handle_summarize` was found in the same window — consistent with the dry-run invocation exercising the default `main` path only, not the `summarize` subcommand.
---

## Partial File (1)

### managers/summary-manager.js — PARTIAL (7/9 functions committed, 7 spans, 2 attempts)

**Rejected functions**: `readDayEntries`, `readMonthWeeklySummaries` (both COV-003 — see `failure-deep-dives.md` for root cause: this is the run-25 `isExpectedConditionCatch` validator gap recurring, not a new bug. `readDayEntries` also co-failed NDS-003 on its discarded attempt, suggesting the agent restructured the early-return beyond the catch block; the discarded attempt code itself is not recoverable — the debug dump shows both functions reverted to original, uninstrumented source.)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — the 7 committed functions preserve original logic exactly (verified against `git show spiny-orb/instrument-1788361335787:src/managers/summary-manager.js`). The NDS-003 co-failure logged against `readDayEntries`'s rejected attempt never reached the committed file, so it does not carry forward as a file-level violation. |
| API-001 | PASS — `tracer.startActiveSpan(name, async (span) => {...})` used consistently across all 7 committed spans; correct `@opentelemetry/api` imports (`SpanStatusCode`, `trace`), one module-level `trace.getTracer('commit-story')`. |
| NDS-006 | PASS |
| NDS-004 | PASS — return values/shapes of all 7 committed functions unchanged from source (e.g. `saveDailySummary` still returns `summaryPath` or `null`; `generateAndSaveDailySummary` still returns the same result object shape). |
| NDS-007 (Control Flow Preserved) | PASS for the committed scope — the shape-2 ENOENT-rethrow catches (`if (err.code !== 'ENOENT') throw err;`) inside `readWeekDailySummaries`'s per-day loop and `readMonthWeeklySummaries`'s per-file loop are correctly left without `recordException`/`setStatus` (line 301, 562 of the instrument-branch file), preserving the graceful-degradation branch untouched. The two shape-1 catches (`if (err.code === 'ENOENT') return [];`) that the deep-dive traces this failure to belong to `readDayEntries` and `readMonthWeeklySummaries` — neither made it into the committed file in instrumented form, so NDS-007 has nothing to evaluate on them; the rule is not violated, it's simply inapplicable to uninstrumented code. |
| COV-001 | PASS, with caveat — the committed file itself only shows entry-point spans on 7/9 exported async functions. But the log (`Agent notes`, lines 964/966) confirms both rejected functions' attempts were validated against COV-003 specifically ("catch block ... does not record error on span"), which presupposes a span already existed on that attempt — i.e., both attempts *did* satisfy COV-001 (entry-point span present) and were rejected on the separate COV-003 dimension, not for missing coverage. Applying the PRD's stated precedent ("output that would have passed COV-001 is scored as COV-001 PASS") at function granularity inside this partial file, COV-001 is scored PASS for the file, while COV-003 below carries the actual failure. |
| COV-003 | **FAIL** — file-level result is a genuine partial: 2 of 9 exported async functions ship with zero instrumentation in the final commit. The 7 committed functions each correctly PASS COV-003 (try/catch/finally with `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` on the outer catch, e.g. lines 139-141, 221-223, 311-313). The 2 rejected functions never got a chance to demonstrate correct COV-003 behavior in the committed artifact — their attempts were killed by the validator's shape-1/shape-2 gap described in `failure-deep-dives.md`, and the agent did not apply either of the two documented workarounds (reshape to shape-2, or add explicit `recordException`/`setStatus` before the shape-1 throw). Net effect: this file does not achieve full COV-003 coverage, and that failure is the reason the file is partial rather than committed. |
| COV-004 | ADVISORY — 5 sync functions (`formatDailySummary`, `getWeekBoundaries`, `formatWeeklySummary`, `getMonthBoundaries`, `formatMonthlySummary`) flagged with 0 spans; correctly exempt per RST-001 (pure formatters/date math, no I/O). Consistent with run-26. |
| COV-005 | PASS |
| RST-001 | PASS — the 5 sync helpers above are correctly left unwrapped. |
| RST-004 | PASS — every committed span has a `finally { span.end(); }` (lines 143, 225, 315, 391, 482, 647, 740 of the instrument-branch file). |
| SCH-001 | PASS — 7 new span names registered (`commit_story.journal.save_daily_summary`, `generate_and_save_daily_summary`, `read_week_daily_summaries`, `save_weekly_summary`, `generate_and_save_weekly_summary`, `save_monthly_summary`, `generate_and_save_monthly_summary`), matching the log's "Schema extensions" block exactly, no collisions. `read_day_entries` and `read_month_weekly_summaries` — which would have been the 8th/9th names had those functions committed — are correctly absent since no span exists for them. |
| SCH-002 | PASS — log reports "0 attributes" for this file (all attribute names reused from the existing schema: `commit_story.context.repo_path`, `commit_story.journal.entry_date`, `commit_story.journal.file_path`, `commit_story.summary.entry_count`, `commit_story.journal.errors_count`, `commit_story.summary.week_label`, `commit_story.summary.month_label`); no new attribute introduced, so no semantic-duplicate risk from this file. (Note: the run-27 `quotes_count` semantic-mismatch watch item flagged elsewhere in this run belongs to `journal-manager.js`, not this file.) |
| SCH-003 | PASS — attribute types consistent (strings for paths/labels/dates, numbers for counts). |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | ADVISORY — raw filesystem paths set as attribute values (`commit_story.journal.file_path`, `commit_story.context.repo_path`) rather than basenames; same lower-severity path advisory as run-26, not blocking. |

**Failures**: COV-003 — file-level FAIL. 2 of 9 exported async functions (`readDayEntries`, `readMonthWeeklySummaries`) ship uninstrumented in the final commit because their instrumented attempts were rejected by the validator's known `isExpectedConditionCatch` gap (shape-1 ENOENT-return-then-throw catches flagged even though the agent's outer catch elsewhere correctly implements error recording). This is a regression from run-26, where all 9 functions committed cleanly — not a new defect, but the same unfixed validator gap first identified in run-25, now recurring against a different pair of functions.

**Datadog trace supplement**: `search_datadog_spans` against `service:commit-story @service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd` (instrument-branch evidence) with `resource_name` filters for this file's 7 committed span names returned direct matches for 2 of the 7: `commit_story.journal.generate_and_save_daily_summary` and `commit_story.journal.save_daily_summary`, both `status: ok`, timestamped 2026-09-03T12:23:16.484Z–12:23:31.985Z (trace_id `3b42cf07b106223acd3e9a8e2ac52ead`), with `commit_story.summary.entry_count: 28` and `commit_story.journal.file_path: journal/summaries/daily/2026-09-02.md` populated correctly — consistent with the source's `span.setAttribute` calls and with the confirmation already recorded in `trace-artifact.md`. No matching spans were found on this instance for `read_week_daily_summaries`, `save_weekly_summary`, `generate_and_save_weekly_summary`, `save_monthly_summary`, or `generate_and_save_monthly_summary` — plausibly because the dogfood dry-run that produced this instance's traces only exercised the daily-summary code path, not weekly/monthly. A broader unscoped query (any instance, main-branch corroborating evidence) also returned only daily-summary spans in this time window, so this is a coverage gap in observed traffic, not evidence the other 5 committed spans are broken.
---

## Correct Skips (18)

| File | Skip Reason |
|------|------------|
| generators/prompts/guidelines/accessibility.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/guidelines/anti-hallucination.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/guidelines/index.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/sections/daily-summary-prompt.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/sections/dialogue-prompt.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/sections/monthly-summary-prompt.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/sections/summary-prompt.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/sections/technical-decisions-prompt.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| generators/prompts/sections/weekly-summary-prompt.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| integrators/filters/message-filter.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| integrators/filters/sensitive-filter.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| integrators/filters/token-filter.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| logger.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| mcp/tools/reflection-tool.js | 2 attempts, 4.2K output tokens — the agent deliberated at length over instrumenting `saveReflection` (span name, attribute selection, CDQ-006 `isRecording()` guard, CDQ-007 raw-path caveat) before ultimately shipping 0 spans, 0 attributes. Final rationale: all *exported* functions are synchronous (`registerReflectionTool`) — no async I/O to trace via the exported surface. The raw log's "No LLM call made" line in the agent's own final note is inaccurate boilerplate, not a description of the harness's actual behavior — the 4.2K output tokens and full attempt-1 reasoning trace in `spiny-orb-output.log` confirm a real LLM call was made and consumed tokens before the agent talked itself out of adding a span. Same pattern as run-26's evaluation of this identical file. |
| traceloop-init.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| utils/commit-analyzer.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| utils/config.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |
| utils/failure-placeholder.js | Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made. |

---

## Quality Failures Summary

| File | Rule | Dimension |
|------|------|-----------|
| collectors/claude-collector.js | CDQ-007 | Code Quality |
| collectors/git-collector.js | SCH-003 | Schema Compliance |
| utils/journal-paths.js | CDQ-007 | Code Quality |
| managers/journal-manager.js | CDQ-005 (unrubriced semantic-mismatch finding — see file section) | Code Quality |
| managers/summary-manager.js | COV-003 | Coverage (partial file) |

**Total canonical failures**: 5 (CDQ-007 ×2, SCH-003, CDQ-005/semantic mismatch, COV-003)

**Methodology notes and watch-item resolutions from this run**:

1. **RUN26-1 (journal-manager.js SCH-003) is CONFIRMED FIXED** for the type dimension — `quotes_count` is now set as a raw int, no `String()` wrapper. However, per-file evaluation surfaced a **new, more significant finding**: the value is written into `commit_story.journal.quotes_count`, a key registered to mean developer-quote count, but the code actually stores a reflection count (`discoverReflections().length`) — a correct type on a semantically wrong key. No existing rule cleanly targets "correct type, wrong registered key" (SCH-002 only catches invented duplicates, not a wrong *choice* of existing key); this finding is scored under CDQ-005 per the file section's reasoning, but should be tracked as a rubric gap. See `journal-manager.js` section for full analysis.
2. **RUN26-2 (journal-paths.js CDQ-007) is CONFIRMED STILL UNRESOLVED** — same self-identified-fix pattern as run-26 (agent names `basename()` as the fix, declines to import it). Per the run-26 CDQ-007 self-identified-fix precedent, this scores a canonical FAIL, not advisory. The same pattern recurs independently in `claude-collector.js`'s `repo_path` attribute this run — a second FAIL, not previously flagged as a watch item, discovered during per-file evaluation.
3. **New SCH-003 finding**: `git-collector.js`'s `commit_story.git.diff_size` is declared `int` in its schema extension but emitted via `String(diff.length)` — a genuine new type mismatch, live-confirmed via Datadog trace (`"2139"` as a quoted string). Not present in run-26 (which had no `diff_size` attribute in this file).
4. **New COV-003 regression**: `summary-manager.js` reverts to PARTIAL (7/9 functions), confirmed by `failure-deep-dives.md` as the same `isExpectedConditionCatch` validator gap first identified in run-25, recurring against a different function pair (`readDayEntries`, `readMonthWeeklySummaries` vs. run-25's `readWeekDailySummaries`, `readMonthWeeklySummaries`). Run-26's clean 9/9 pass was not a fix landing — it was one run where no function happened to trigger the flagged catch shape.
5. **Log attribute/span counts continue to undercount or misreport real values.** `context-capture-tool.js`'s log/run-summary reports 3 spans; direct source inspection found only 2 — a reporting discrepancy, not an instrumentation defect. Several files (`context-integrator.js`, `context-capture-tool.js`, `journal-paths.js`, `summarize.js`) show "0 new attributes" in the log while actually setting 3-13 real attributes via reused registry keys — `attributesCreated` counts only new schema extensions, consistent with the run-26 finding and the PRD's stated attribute-count trend caution.
6. **`run-summary.md`'s "matches run-26" framing does not always hold under direct inspection**: `summary-graph.js` and `index.js` are both flagged in their per-file sections as having real attribute-level differences from run-26 despite matching span/attempt counts.
7. **journal-graph.js's tenth-consecutive-success claim is CONFIRMED** — 4 spans, 3 attributes, 3 attempts, matching run-26 exactly, clean rubric pass.
