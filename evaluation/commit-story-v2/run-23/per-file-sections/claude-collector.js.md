### 1. collectors/claude-collector.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only |
| NDS-006 | PASS — catch rethrows with both `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` |
| NDS-004 | PASS — both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | PASS — graceful-degradation catch inside `parseJSONLFile`'s JSON parsing loop correctly left unmodified (no rethrow, no recordException required) |
| COV-001 | PASS — `collectChatMessages` is the only exported async fn and has a span |
| COV-003 | PASS — catch has `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` |
| COV-004 | PASS — `collectChatMessages` is the only exported async fn; all others (`getClaudeProjectsDir`, `encodeProjectPath`, etc.) are sync |
| COV-005 | PASS — `commit_story.context.source`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.sessions_count`, `commit_story.context.messages_count` all set on the span |
| COV-006 | N/A — no LangChain/auto-instrumentation |
| RST-001 | PASS — sync helpers correctly skipped: `getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `parseJSONLFile`, `filterMessages`, `groupBySession` |
| RST-004 | PASS — only the single exported async fn is instrumented |
| SCH-001 | PASS — span `commit_story.context.collect_chat_messages` registered in `semconv/agent-extensions.yaml` as a schema extension |
| SCH-002 | PASS — all 5 attributes pre-registered in `semconv/attributes.yaml` under `commit_story.context.*` |
| SCH-003 | PASS — `sessions_count` and `messages_count` set as integers; `source` set as string enum value `'claude_code'`; `time_window_start`/`time_window_end` set as strings via `.toISOString()` |
| CDQ-001 | PASS — `finally { span.end() }` inside an async `startActiveSpan` callback is correct. The OTel JS API does not auto-end spans in async callbacks (only sync callbacks auto-end); manual `span.end()` in `finally` is the required pattern. Run-21 failure was based on incorrect understanding of async callback lifecycle; issue #915 clarified this. Datadog trace confirms clean span lifecycle. |
| CDQ-002 | PASS — no nested child spans for delegation |
| CDQ-003 | PASS — attributes set in normal flow before catch block |
| CDQ-005 | PASS — no empty catch blocks |
| CDQ-007 | PASS — early-return path explicitly sets `sessions_count` and `messages_count` to `0`; happy path sets them from `sessions.size` and `allMessages.length` after computation |

**Failures**: None

**CDQ-001 resolution**: Run-21 failed CDQ-001 because `span.end()` was called in `finally` inside an async `startActiveSpan` callback — incorrectly evaluated as a double-end. Issue #915 clarified that for async callbacks, OTel JS does NOT auto-end the span; explicit `span.end()` in `finally` is the correct and required pattern. Run-23 CDQ-001 PASS.

**Note on span name change**: Run-23 registers span `commit_story.context.collect_chat_messages` (vs. `commit_story.claude_collector.collect_chat_messages` in run-21). The namespace changed from `claude_collector` to `context`. Both are registered schema extensions; the `context` namespace choice was made by the run-23 instrumentation agent. SCH-001 PASS (registered in agent-extensions.yaml).
