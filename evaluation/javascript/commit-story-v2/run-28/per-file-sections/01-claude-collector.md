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
