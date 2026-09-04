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
| CDQ-007 | **FAIL** — `commit_story.context.repo_path` is set unconditionally to the raw, unsanitized absolute filesystem path (`repoPath`) with no `basename()` or redaction applied. The agent's own thinking block self-identifies this exact concern ("CDQ-007 discourages raw filesystem paths... `basename` isn't imported... I'll use the raw path value and flag it as a known limitation") and its notes repeat the same acknowledgment, but ships the raw value anyway. This is the identical unresolved pattern documented for `journal-paths.js` in run-26 (also FAIL there) and reconfirmed as still-open in this run's `run-summary.md` (RUN26-2, tracked as spiny-orb issue #1035) — a known, tracked gap rather than a one-off regression, but a live FAIL against the CDQ-007 bar as written. The live trace below confirms the exposure is real, not theoretical: it carries the developer's actual local machine path (`<redacted-absolute-path>/commit-story-v2`), which would leak local username/directory structure in any real deployment |

**Failures**: CDQ-007 — raw, unsanitized absolute filesystem path stored in `commit_story.context.repo_path`, self-acknowledged by the agent as a known limitation (missing `basename` import) rather than resolved. Same pattern as `journal-paths.js` (run-26), tracked under spiny-orb issue #1035.

**Datadog trace supplement**: 1 matching span found — **instrument-branch evidence** (`service:commit-story @service.instance.id:0cac1bed-f201-466a-b976-41f47c65d3bd`, `resource_name:commit_story.context.collect`, captured 2026-09-03T12:23:13Z, trace `3b42cf07b106223acd3e9a8e2ac52ead`). The live span carries all 6 attributes matching the source-level assessment exactly: `source: claude_code`, `repo_path: <redacted-absolute-path>/commit-story-v2`, `sessions_count: 1`, `messages_count: 6`, `time_window_start`/`time_window_end` as ISO strings. This directly corroborates both the COV-005 attribute count and the CDQ-007 finding — the trace shows a real, un-redacted local filesystem path on the wire.
