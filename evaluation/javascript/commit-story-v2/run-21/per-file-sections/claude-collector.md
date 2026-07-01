### 1. collectors/claude-collector.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only |
| NDS-006 | PASS — catch rethrows; both `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` are present |
| NDS-004 | PASS — both `trace` and `SpanStatusCode` are used |
| NDS-005 | PASS — original try/catch structure preserved; instrumentation wraps inside `startActiveSpan` callback without restructuring |
| COV-001 | PASS — collectChatMessages is the only exported async fn and has a span |
| COV-003 | PASS — catch has `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` |
| COV-004 | PASS — collectChatMessages is the only exported async fn; all others are sync |
| COV-005 | PASS — `commit_story.context.source`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.sessions_count`, `commit_story.context.messages_count` all set on the span |
| COV-006 | N/A — no LangChain/auto-instrumentation |
| RST-001 | PASS — sync helpers correctly skipped: `getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `parseJSONLFile`, `filterMessages`, `groupBySession` |
| RST-004 | PASS — only the single exported async fn is instrumented |
| SCH-001 | PASS — `commit_story.claude_collector.collect_chat_messages` registered as a span in agent-extensions.yaml |
| SCH-002 | PASS — all 5 attributes pre-registered in `semconv/attributes.yaml` with full `commit_story.context.*` names |
| SCH-003 | PASS — `sessions_count` and `messages_count` set as integers (`sessions.size`, `allMessages.length`, `0`); `source` set as string enum value `'claude_code'`; `time_window_start`/`time_window_end` set as strings via `.toISOString()` |
| CDQ-001 | FAIL — `span.end()` called explicitly in `finally` block inside `startActiveSpan` callback; `startActiveSpan` already auto-ends the span when the callback returns or throws, making the explicit call a double-end |
| CDQ-002 | PASS — no nested child spans for delegation |
| CDQ-003 | PASS — `commit_story.context.source`, `time_window_start`, and `time_window_end` are set in normal flow at the top of the try block, before any early return |
| CDQ-005 | PASS — no empty catch blocks added |
| CDQ-007 | PASS — early-return path explicitly sets `sessions_count` and `messages_count` to `0` before returning; happy path sets them from `sessions.size` and `allMessages.length` after computation; both paths are covered |

**Failures**: CDQ-001 — redundant `span.end()` in `finally` inside `startActiveSpan` callback causes double-end
