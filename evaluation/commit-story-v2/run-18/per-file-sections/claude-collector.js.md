### 1. collectors/claude-collector.js (1 span, 2 attempts)

The file exports eight functions: one async (`collectChatMessages`) and seven sync helpers (`getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `parseJSONLFile`, `filterMessages`, `groupBySession`). The committed instrumentation wraps `collectChatMessages` with a single span, correctly skipping all sync helpers per RST-001.

The run summary reports "0 attributes" because that counter tracks new schema extension attributes only. The committed code calls `span.setAttribute` five times — `commit_story.context.source`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.sessions_count`, and `commit_story.context.messages_count` — all five are registered schema keys, not new extensions, consistent with the zero count.

Compared to run-17, the span name changed from `commit_story.context.collect_messages` back to `commit_story.context.collect_chat_messages`. Both are valid schema extensions naming the same operation. The attribute set is identical to run-17. The `!= null` guards on `sessions` and `allMessages` in the normal-execution path persist from run-17; both are unnecessary since `groupBySession` always returns a Map and `allMessages` is initialized to `[]`, but harmless. The first attempt introduced NDS-003 errors (multi-line function signature collapsed); attempt 2 restored the original four-line signature form and passed the validator.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original multi-line signature `(repoPath, commitTime, previousCommitTime,)` preserved verbatim in instrumented output; no business logic lines altered |
| NDS-004 | PASS — parameter list unchanged (repoPath, commitTime, previousCommitTime); API contract unaltered |
| NDS-005 | PASS — original had no try/catch; instrumented version adds one that always rethrows; no original error handling removed |
| NDS-006 | PASS — all original JSDoc comments and inline comments preserved unchanged |
| API-001 | PASS — only `@opentelemetry/api` imported (`trace`, `SpanStatusCode`); no SDK packages |
| COV-001 | PASS — `collectChatMessages` (the sole exported async function) has an entry-point span |
| COV-003 | PASS — catch block calls `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, and `throw error`; all three components present |
| COV-004 | PASS — `collectChatMessages` is the only exported async function; seven sync helpers correctly skipped per RST-001 |
| COV-005 | PASS — five domain attributes: `source` (data origin), `time_window_start/end` (collection bounds), `sessions_count` and `messages_count` (output volume); early-return null path sets both counts to 0 |
| RST-001 | PASS — all seven sync helpers skipped; none have spans |
| RST-004 | PASS — no spans on unexported helpers |
| SCH-001 | PASS — span name `commit_story.context.collect_chat_messages` follows `commit_story.*` convention; declared as schema extension in run log |
| SCH-002 | PASS — all five attributes are registered schema keys (`commit_story.context.source`, `.time_window_start`, `.time_window_end`, `.sessions_count`, `.messages_count`); no unregistered keys used |
| SCH-003 | PASS — `sessions_count` from `sessions.size` (int); `messages_count` from `allMessages.length` (int); `time_window_start/end` via `.toISOString()` (string); `source` as string literal `'claude_code'` matching registered enum member |
| CDQ-001 | PASS — `span.end()` in `finally` block; covers early null-projectPath return path and error catch path |
| CDQ-002 | PASS — `startActiveSpan` callback pattern; no manual context propagation needed |
| CDQ-003 | PASS — no redundant `span.end()` calls; single close in `finally` only |
| CDQ-005 | PASS — `startActiveSpan` used with async callback; no double-end risk |
| CDQ-006 | PASS — no attribute values constructed from unbounded user input or raw message content |
| CDQ-007 | PASS — `sessions` always a Map from `groupBySession`; `allMessages` initialized to `[]`; neither nullable at setAttribute call sites; `!= null` guards are unnecessary but do not produce undefined values |

**Failures**: None
