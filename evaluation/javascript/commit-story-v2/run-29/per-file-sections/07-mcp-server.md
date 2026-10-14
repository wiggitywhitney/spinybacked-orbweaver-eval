### 7. mcp/server.js (1 span, 1 attempt)

The agent wrapped the async `main()` entry point (instrumented lines 57-76) in a single `commit_story.mcp.start_server` span. The span has a try/catch/finally with `recordException`, `setStatus(ERROR)`, rethrow, and `span.end()` in `finally`. It sets two string-literal attributes: the registered enum key `commit_story.context.source = 'mcp'` (line 60) and the agent-declared extension `commit_story.mcp.transport = 'stdio'` (line 61). The log's "1 attribute" counts only the new schema extension. The code sets two. The synchronous, unexported `createServer()` was correctly left unspanned. The span name changed from run-28's `commit_story.mcp.start`, which is normal variation between runs. The span is not held open for the life of the server. `StdioServerTransport.start()` only attaches `stdin` listeners and returns (checked in the SDK's `dist/esm/server/stdio.js`), so `await server.connect(transport)` resolves at startup and the span ends right after the "running on stdio" log line. The log has no "Agent thinking" block for this file, and validation passed on the first attempt with 0 errors.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — `git diff -w` shows the original `main()` body (lines 62-67: `createServer()`, `new StdioServerTransport()`, `await server.connect(transport)`, `logger.info(...)`) only re-indented. Every added line is instrumentation (the import at line 25, the tracer at line 32, the span wrapper, the two `setAttribute` calls, catch/finally). No token changed in non-instrumentation code. |
| NDS-004 | PASS — the signature `async function main()` is unchanged. The function now returns the `startActiveSpan` promise, which resolves to `undefined` as before, so the top-level `main().catch(...)` (line 79) behaves the same. |
| NDS-005 | PASS — the original `main()` had no try/catch. The added try/catch/finally wraps the whole body, and the module-level `.catch` handler (lines 79-82) is intact. |
| NDS-006 | PASS — the added `import { trace, SpanStatusCode } from '@opentelemetry/api'` (line 25) is ESM, matching the file's existing `import` statements. |
| NDS-007 | PASS — `main()` had no original catch blocks. The only original catch, the top-level `.catch` at line 79, is unmodified and gets no `recordException`/`setStatus`. |
| API-001 | PASS — the only OTel import is `@opentelemetry/api` (line 25). |
| API-004 | PASS — no SDK-internal imports (`@opentelemetry/core`, `sdk-*`). |
| COV-001 | PASS — `main()` is the MCP server process entry point (invoked at line 79) and carries the span (line 58). |
| COV-002 | N/A — the file makes no outbound HTTP, database, queue, or LLM-client call. `server.connect(transport)` attaches local stdin listeners. |
| COV-003 | PASS — failable operations (`createServer()`, and `server.connect()`, which throws if the transport is already started) can throw out of the callback only through the catch at lines 68-71, which records `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing. |
| COV-004 | PASS — the only async function, `main()`, has a span. `createServer()` is synchronous and not flagged by the implemented rule. |
| COV-005 | PASS — the span carries `commit_story.mcp.transport = 'stdio'` (line 61) and `commit_story.context.source = 'mcp'` (line 60). |
| COV-006 | N/A — no operation in the file is covered by an auto-instrumentation library. `@traceloop/instrumentation-mcp` wraps `Server.prototype.request` and `Client.prototype.connect/request/close`, not `Server.connect`, and `traceloop-init.js` enables only the LangChain instrumentation. The manual span does not duplicate any auto-instrumented operation. |
| RST-001 | PASS — `main()` is not a utility (it does stdio transport setup and logging). The pure synchronous helper `createServer()` has no span. |
| RST-002 | PASS — the file has no getters, setters, or trivial accessors, and none were spanned. |
| RST-003 | PASS — `main()`'s original body has four statements, not a single delegating `return`. |
| RST-004 | PASS — `main()` is unexported, but its I/O happens through libraries (the MCP SDK's stdio transport and the pino logger), which qualifies for the I/O exemption. The unexported, no-I/O `createServer()` has no span. |
| RST-005 | PASS — the original file had no instrumentation. |
| SCH-001 | PASS — `commit_story.mcp.start_server` follows dotted snake_case under the `commit_story` namespace. The registry defines no MCP operation, and the name is declared as `span.commit_story.mcp.start_server` in `semconv/agent-extensions.yaml` (line 132). |
| SCH-002 | PASS — `commit_story.context.source` is a registered key, and `mcp` is a listed member ("MCP tool context capture"). `commit_story.mcp.transport` is a new concept with no registered equivalent, and its value names the transport. Neither key holds a different concept than it names. (See unrubriced findings for where `context.source` is placed.) |
| SCH-003 | PASS — `commit_story.context.source` is an enum (string members), and the value is the string literal `'mcp'`, a listed member (line 60). `commit_story.mcp.transport` is declared `type: string` (agent-extensions.yaml line 24), and the value is the string literal `'stdio'` (line 61). No count casts or booleans. Both values are literals, so no runtime confirmation is needed. |
| SCH-004 | PASS — delimiter-split Jaccard for the one agent-added key, `commit_story.mcp.transport` (tokens commit, story, mcp, transport): every other registry key shares at most `commit` and `story`. Against `commit_story.context.source` and any other `commit_story.<x>.<y>` key the score is 2/6 = 0.33. No key contains `mcp` or `transport`. No pair exceeds 0.5, so there are no candidates. |
| CDQ-001 | PASS — exactly one `span.end()`, in `finally` (line 73), reached on success and on the error path. The span ends once `server.connect()` resolves at startup, so it is not kept open for the server's lifetime. |
| CDQ-002 | PASS — `const tracer = trace.getTracer('commit-story')` is created once at module scope (line 32) from `@opentelemetry/api`. |
| CDQ-003 | PASS — the catch block calls `span.recordException(error)` (line 69), then `span.setStatus({ code: SpanStatusCode.ERROR })` (line 70), in the correct order. |
| CDQ-005 | PASS — `tracer.startActiveSpan(..., async (span) => {...})` is used and its promise is returned (line 58). No `startSpan`. |
| CDQ-006 | PASS — 0 expensive sites. Both `setAttribute` values are string literals (`'mcp'` line 60, `'stdio'` line 61), which are exempt under step 1. |
| CDQ-007 | PASS — both call sites set static literal constants (`'mcp'`, `'stdio'`). No path, PII, credential-bearing string, or nullable value reaches either attribute. |
| CDQ-011 | PASS — the `getTracer('commit-story')` literal (line 32) matches the canonical name, which is the registry manifest `name: commit_story` with underscores changed to hyphens. All 13 `getTracer` calls on the branch use the same literal. |

**Failures**: None.

**Unrubriced findings**:
- `commit_story.context.source = 'mcp'` (line 60) sits on `commit_story.mcp.start_server`, a server-startup span that collects no context. The key's brief is "The source type of collected context". The value is a constant on every server start and adds no information beyond the span name. The real MCP context-capture span (`context-capture-tool.js` line 75) sets the same key correctly.
- A possible context capture by a long-lived resource needs runtime confirmation. `new StdioServerTransport()` (line 63) defaults its stdin to `process.stdin`, and `server.connect()` attaches the `stdin` `'data'` listener (line 65), all inside the active `start_server` span. If `process.stdin` is first accessed here (pino writes only to `process.stderr`), the stdin handle's async context may be the `start_server` span. Later MCP tool-handler spans, such as `commit_story.context.save_context`, would then become children of a span that ended at startup (confirm against OTLP export).

**Other implemented-rule observations**: None.

**Rule-fit issues**:
- No rule checks whether a registered attribute is placed on a span whose operation matches the key's brief. SCH-002 checks key meaning against value, not placement, so `context.source` on a startup span passes.
- No rule checks for spans that stay active while long-lived resources (stream handles, listeners) are created inside them, which can parent later unrelated work to an ended span. This only matters if the stdin parenting above is confirmed.
- The agent notes contain two inaccurate claims that no rule checks, though neither affects the code. The notes call `main` "the CLI entry point" when it is the MCP server process entry. They also cite a pino auto-instrumentation as if it traced pino, when pino instrumentation does log correlation and does not create spans.

**Run-28 comparison**: The structure is unchanged from run-28 (one entry-point span on `main()`, `commit_story.mcp.transport = 'stdio'`, full error recording, `createServer()` skipped). Run-29 renamed the span to `commit_story.mcp.start_server` and added `commit_story.context.source = 'mcp'`. Run-28's CDQ-002, CDQ-003, CDQ-005, CDQ-006, NDS-004, and NDS-006 rows cited evidence for other rules' concerns, so they were not reused here.

**Trace evidence (D-2 supplement)**: none. The post-run instance `a2a54d88-00c9-4a85-bc8a-64e11de35779` emitted 20 spans in one trace (`ae2d2354ca28cac29c9b79f1a2184be9`), all on the post-commit journal path, and the MCP server process is not on that path, so the stdin-parenting observation still needs a runtime check. No verdict in this section depends on live evidence.
