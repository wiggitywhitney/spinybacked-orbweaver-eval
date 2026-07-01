### 1. collectors/claude-collector.js (1 span, 0 attributes, 2 attempts)

The file exports eight functions: one async (`collectChatMessages`) and seven sync helpers (`getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `parseJSONLFile`, `filterMessages`, `groupBySession`). The committed instrumentation wraps `collectChatMessages` with a single span, correctly skipping all sync helpers per RST-001.

The run summary reports "0 attributes" because the attribute counter tracks new schema extension attributes only. The committed code does call `span.setAttribute` five times — `commit_story.context.source`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.sessions_count`, and `commit_story.context.messages_count` — but all five are registered schema keys, not new extensions, consistent with the zero count.

Compared to run-16, the run-17 instrumentation adds three new attribute calls: `source`, `time_window_start`, and `time_window_end`. It also moves `sessions_count` and `messages_count` from the early-return path only to both the early-return and normal-execution paths (with unnecessary `!= null` guards on the normal path). This is a net coverage improvement. The span name changed from run-16's `commit_story.context.collect_chat_messages` to `commit_story.context.collect_messages` — a minor rename within the same namespace, both valid schema extensions.

The first attempt introduced NDS-003 errors (6 blocking errors per the instrumentation report). Attempt 2 resolved them. The committed output is clean.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no non-instrumentation lines altered; original business logic preserved verbatim inside the span wrapper |
| NDS-004 | PASS — the parameter list is unchanged (repoPath, commitTime, previousCommitTime); the agent expanded the single-line signature to a 4-line form, but no parameter names or types were modified; the API contract is unaltered |
| NDS-005 | PASS — the original `collectChatMessages` had no try/catch; the instrumented version adds one that always rethrows (COV-003 outer error recording pattern), which does not remove any original error handling |
| NDS-006 | PASS — all original comments preserved; no inline comments removed |
| NDS-007 | PASS — the outer catch block in the instrumented version records the exception and rethrows unconditionally; it is not a graceful-degradation path and does not swallow errors |
| COV-001 | PASS — `collectChatMessages` (exported async) has a span; it is the only exported async function |
| COV-002 | N/A — no outbound HTTP or database calls |
| API-001 | PASS — only `@opentelemetry/api` imported (`trace`, `SpanStatusCode`) |
| API-004 | PASS — no SDK-internal imports |
| SCH-001 | PASS — span name `commit_story.context.collect_messages` follows the `commit_story.*` naming convention and is declared as a schema extension per the run log; it is semantically distinct from `commit_story.context.gather_for_commit` (the context-integrator span, which covers full multi-source orchestration) |
| SCH-002 | PASS — all five attributes are registered schema keys: `commit_story.context.source` (registered enum), `commit_story.context.time_window_start` (registered string), `commit_story.context.time_window_end` (registered string), `commit_story.context.sessions_count` (registered int), `commit_story.context.messages_count` (registered int); no unregistered keys used |
| SCH-003 | PASS — `sessions_count` set from `sessions.size` (int); `messages_count` set from `allMessages.length` (int); `time_window_start/end` set via `.toISOString()` (string); `source` set as the string literal `'claude_code'` matching the registered enum member |
| CDQ-001 | PASS — span closed in `finally { span.end(); }`, covering all paths including the early null-projectPath return and the error catch branch |
| CDQ-005 | PASS — `startActiveSpan` used with an async callback; no duplicate `span.end()` calls |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` matches the canonical tracer name |
| COV-004 | PASS — `collectChatMessages` is the only exported async function; all seven sync helpers are correctly skipped per RST-001 |
| COV-003 | PASS — outer catch block calls `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error`; all three components of the COV-003 pattern are present |
| COV-005 | PASS — five domain attributes set: `source` captures the data origin, `time_window_start/end` bound the collection window, `sessions_count` and `messages_count` describe the collected data volume; the early-return null path correctly sets `sessions_count: 0` and `messages_count: 0` |
| RST-001 | PASS — all seven sync helpers skipped; none have spans |
| RST-004 | PASS — no spans on unexported helpers |
| CDQ-007 | PASS — `sessions` is assigned from `groupBySession(allMessages)` which always returns a `new Map()`; `allMessages` is initialized to `[]`; neither is ever null at the `setAttribute` call sites; the `!= null` guards are unnecessary but harmless and produce no undefined attribute values |

**Failures**: None
