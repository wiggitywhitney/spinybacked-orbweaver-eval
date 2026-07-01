### 20. mcp/server.js (1 span, 1 attempt)

**Structure**: One async function (`main`, unexported entry point) and one synchronous factory (`createServer`, unexported). Instrumentation targets `main()` per COV-001 override for process entry points. Clean 1-attempt success, consistent with run-17's 1-attempt profile. Committed output is structurally identical to run-17.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — only `main()` modified; `createServer` is byte-for-byte unchanged; validator accepted on first attempt |
| NDS-004 | PASS — no function signatures altered |
| NDS-005 | PASS — original `main()` had no try/catch; instrumented version adds outer catch for span error recording (recordException + setStatus ERROR + rethrow); additive only |
| NDS-006 | PASS — all original comments preserved including `// Log to stderr (stdout is reserved for JSON-RPC)` |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` only; no SDK imports |
| COV-001 | PASS — `main()` is the async process entry point; COV-001 requires entry-point spans regardless of export status; RST-004 unexported-function exemption overridden by COV-001 |
| COV-003 | PASS — outer catch block has `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` + `throw error` before `finally { span.end() }` |
| COV-004 | PASS — `main()` is the only async function; `createServer` is synchronous and correctly skipped per RST-001 |
| COV-005 | PASS — `commit_story.mcp.transport` set to `'stdio'`; satisfies the requirement that every span carries at least one domain attribute |
| RST-001 | PASS — `createServer` is a synchronous factory function; correctly skipped |
| RST-004 | PASS — `createServer` is also unexported; RST-004 and RST-001 both confirm the skip |
| SCH-001 | PASS — `commit_story.mcp.server.start` registered as a span extension in `semconv/agent-extensions.yaml`; matches run-17 span name; no semantic duplicate exists |
| SCH-002 | PASS — `commit_story.mcp.transport` declared as attribute extension in `semconv/agent-extensions.yaml`; no registered attribute in `attributes.yaml` covers MCP server transport type |
| SCH-003 | PASS — transport value is the hardcoded string literal `'stdio'`; registered type is `string`; no type mismatch |
| CDQ-001 | PASS — span lifecycle managed via `startActiveSpan` callback; `span.end()` called in `finally` block |
| CDQ-002 | SKIP — rule not in evaluated set |
| CDQ-003 | SKIP — rule not in evaluated set |
| CDQ-005 | PASS — `startActiveSpan` used (not `startSpan`); span is active for the duration of `main()` |
| CDQ-006 | SKIP — rule not in evaluated set |
| CDQ-007 | PASS — `commit_story.mcp.transport` is a hardcoded string constant; no property access on potentially nullable objects |

**Failures**: None
