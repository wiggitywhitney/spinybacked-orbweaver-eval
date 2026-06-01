### 1. src/collectors/claude-collector.js (1 span, 3 attempts)

Run-20 committed cleanly where run-19 was partial. The sole exported async function `collectChatMessages` receives a span (`commit_story.context.collect_chat_messages`); all seven synchronous helpers (`getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `filterMessages`, `groupBySession`, `parseJSONLFile`) are correctly excluded per RST-001. The run-19 NDS-003 issue (the `allMessages.sort()` call being split across lines inside the `startActiveSpan` callback causing reassembly rejection) was not a code defect — the same formatting appears in run-20's committed output and passes NDS-003 after Prettier normalization, confirming the problem was validator-side (now resolved upstream) rather than in the instrumented code itself.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no non-instrumentation diff after Prettier normalization; minor trailing-comma differences (`SKIP_RECORD_TYPES` last member, `mtime:` property) are normalization artifacts that cancel out after Prettier is applied to both sides |
| NDS-004 | PASS — `collectChatMessages` signature reformatted to multi-line form but parameters (`repoPath`, `commitTime`, `previousCommitTime`) unchanged; export preserved |
| NDS-005 | PASS — original had no try/catch; new catch rethrows after `recordException` + `SpanStatusCode.ERROR`; the graceful-degradation catch inside `parseJSONLFile`'s for-loop sits in a skipped sync helper and is untouched |
| NDS-006 | PASS — all JSDoc blocks and inline comments preserved verbatim |
| API-001 | PASS — `@opentelemetry/api` only (`SpanStatusCode`, `trace`) |
| COV-001 | PASS — `collectChatMessages` (sole exported async function) has entry-point span |
| COV-003 | PASS — catch calls `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, then `throw error` |
| COV-004 | PASS — `collectChatMessages` is the only exported async function; all sync helpers correctly excluded |
| COV-005 | PASS — five attributes set: `commit_story.context.source` (enum), `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.messages_count`, `commit_story.context.sessions_count`; both count attributes also set on the early-return (null projectPath) path |
| RST-001 | PASS — seven sync helpers excluded: `getClaudeProjectsDir`, `encodeProjectPath`, `getClaudeProjectPath`, `findJSONLFiles`, `filterMessages`, `groupBySession`, `parseJSONLFile` |
| RST-004 | PASS — no internal detail spans; single entry-point span covers all sync helper calls within its scope |
| SCH-001 | PASS — `commit_story.context.collect_chat_messages` registered in `agent-extensions.yaml` on the instrument branch |
| SCH-002 | PASS — all five attributes registered in `semconv/attributes.yaml`: `commit_story.context.source` (enum type with `claude_code` member), `commit_story.context.time_window_start`, `commit_story.context.time_window_end`, `commit_story.context.sessions_count`, `commit_story.context.messages_count` |
| SCH-003 | PASS — counts use `.length`/`.size` (int); timestamps use `.toISOString()` (string); `source` uses registered enum value `claude_code` |
| CDQ-001 | PASS — `span.end()` in `finally` block; covers the early-return path and the error path |
| CDQ-007 | PASS — `messages_count` from `allMessages.length` (Array, always numeric); `sessions_count` from `sessions.size` (Map, always numeric); early-return path explicitly sets both to `0` before returning |

**Failures**: None.
