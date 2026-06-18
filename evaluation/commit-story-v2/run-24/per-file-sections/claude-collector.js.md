### collectors/claude-collector.js (1 span, 1 attempt)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No truthy-check guards around `setAttribute`; `sessions_count` and `messages_count` set unconditionally on both early-return and happy paths |
| API-001 | PASS | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | PASS | Catch block calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | PASS | Graceful-degradation catch inside `parseJSONLFile`'s JSON parsing loop correctly left unmodified — no rethrow, no `recordException` required per NDS-007 (Expected Catch Unmodified) |
| COV-001 | PASS | `collectChatMessages` is the only exported async function; span `commit_story.context.collect_messages` wraps the entire body |
| COV-003 | PASS | Catch has `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrow |
| COV-004 | PASS | `collectChatMessages` is the only exported async function; all others (`getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `parseJSONLFile`, `filterMessages`, `groupBySession`) are pure synchronous |
| COV-005 | PASS | Five attributes set: `commit_story.context.source`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.sessions_count`, `commit_story.context.messages_count` |
| RST-001 | PASS | All seven sync helpers correctly skipped |
| RST-004 | PASS | Only the single exported async function is instrumented |
| SCH-001 | PASS | Span name `commit_story.context.collect_messages` registered in `semconv/agent-extensions.yaml` as `span.commit_story.context.collect_messages` |
| SCH-002 | PASS | All 5 attribute keys pre-registered in `semconv/attributes.yaml` under `registry.commit_story.context` group |
| SCH-003 | PASS | `sessions_count` and `messages_count` set as integers (`0` literal, `sessions.size`, `allMessages.length`); `source` set as string enum value `'claude_code'`; `time_window_start`/`time_window_end` set as strings via `.toISOString()` |
| CDQ-001 | PASS | `finally { span.end() }` inside an async `startActiveSpan` callback — explicit `finally` end is the required pattern (issue #915) |
| CDQ-002 | PASS | No nested child spans; collector delegates to sync helpers only |
| CDQ-003 | PASS | Input attributes (`source`, `time_window_start`, `time_window_end`) set unconditionally before the early-return guard; output attributes (`sessions_count`, `messages_count`) set in both early-return and happy-path branches |
| CDQ-005 | PASS | No empty catch blocks |
| CDQ-007 | PASS | Early-return path sets `sessions_count` and `messages_count` to `0` explicitly; happy path sets them from `sessions.size` and `allMessages.length` after computation — no nullable-field risk |

**Failures**: None

**Trace supplement**: Span `commit_story.context.collect_messages` confirmed in Datadog (2026-06-18T20:25:31Z). Parent is `commit_story.context.gather_context`, confirming correct nesting within the context collection pipeline. All 5 custom attributes present at runtime: `source: claude_code`, `time_window_start: 2026-06-18T20:25:03.000Z`, `time_window_end: 2026-06-18T20:25:29.000Z`, `sessions_count: 0`, `messages_count: 0`. Zero-count values reflect the early-return path executing (no `.claude/projects/` directory match for the evaluated commit), confirming the CDQ-007 guard correctly emits `0` on the early-return branch rather than leaving the attributes unset.

**Span name note**: Run-23 used `commit_story.context.collect_chat_messages`; run-24 shortened to `commit_story.context.collect_messages`. New name registered in `agent-extensions.yaml` and confirmed in live trace.
