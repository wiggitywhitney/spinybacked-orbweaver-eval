### collectors/claude-collector.js (1 span, ×1)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | No truthy-check guards around `setAttribute`; `sessions_count` and `messages_count` set unconditionally on both the early-return path (explicit `0`) and the happy path (from computed values) |
| API-001 | **PASS** | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | Catch block calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | Graceful-degradation catch inside `parseJSONLFile`'s JSON parsing loop correctly left unmodified — no rethrow, no `recordException` required per NDS-007 |
| COV-001 | **PASS** | `collectChatMessages` is the only exported async function; span `commit_story.context.collect_messages` wraps the entire body |
| COV-003 | **PASS** | Catch has `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrow |
| COV-004 | **PASS** | `collectChatMessages` is the only exported async function; all others are pure synchronous exports |
| COV-005 | **PASS** | Five attributes set: `commit_story.context.source`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.sessions_count`, `commit_story.context.messages_count` |
| RST-001 | **PASS** | All seven sync helpers correctly skipped |
| RST-004 | **PASS** | Only the single exported async function is instrumented |
| SCH-001 | **PASS** | Span name registered in `semconv/agent-extensions.yaml` as `id: span.commit_story.context.collect_messages` |
| SCH-002 | **PASS** | All 5 attribute keys pre-registered in `semconv/attributes.yaml` under `registry.commit_story.context` |
| SCH-003 | **PASS** | Counts as integers, source as enum string, time windows via `.toISOString()` |
| CDQ-001 | **PASS** | `finally { span.end() }` inside async `startActiveSpan` callback |
| CDQ-002 | **PASS** | No nested child spans |
| CDQ-003 | **PASS** | Input attributes set before early-return guard; output attributes set on both exit paths |
| CDQ-005 | **PASS** | No empty catch blocks |
| CDQ-007 | **PASS** | Early-return path sets counts to explicit `0`; happy path sets from `.size`/`.length` — no nullable-field risk |

**Failures**: None

**Trace supplement**: Trace data reflects **run-24 instrumentation** (instrument branch `spiny-orb/instrument-1781811083418`, SHA `bb08c9c`). Run-25 has not yet been organically invoked. All 5 attributes confirmed at runtime: `source: claude_code`, `time_window_start/end` present, `sessions_count: 0`, `messages_count: 0` (early-return path). Span `status: ok`, no error.

**CDQ-007 advisory (agent-reported, non-failure)**: The instrumentation.md flagged two CDQ-007 PII advisories. Inspection of the committed code shows none of the five attributes set contain PII or raw paths — the advisory appears to be a false positive from the validator's pattern matching. No CDQ-007 failure applies here.
