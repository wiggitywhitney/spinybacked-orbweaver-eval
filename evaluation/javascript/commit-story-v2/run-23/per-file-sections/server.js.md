### 10. mcp/server.js (1 span, RUN21-1 CONFIRMED)

> **Correction**: The original per-file evaluation agent reported 2 spans (`initializeServer` and `handleRequest`). The source has 1 span on the program entry point `main()`. There is no `handleRequest` function in this file. The PR body (authoritative) confirms 1 span.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original server setup logic untouched; span wraps `main()` entry point only |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS — `main()` catch calls `recordException` + `setStatus(ERROR)` before rethrowing |
| NDS-004 | PASS |
| NDS-007 | PASS — no graceful-degradation catches in this file |
| COV-001 | PASS — `main()` is the program entry point (invoked directly at module scope); span `commit_story.mcp.server.start` wraps it |
| COV-003 | PASS — `main()` catch records exception and sets ERROR status |
| COV-004 | PASS — `main()` is the only async function; `createServer()` is sync and correctly skipped |
| COV-005 | PASS — `commit_story.mcp.transport_type: 'stdio'` set before the async server work begins |
| RST-001 | PASS — `createServer()` is sync; correctly not instrumented |
| RST-004 | PASS |
| SCH-001 | PASS — `span.commit_story.mcp.server.start` registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `commit_story.mcp.transport_type` registered as schema extension; no invented keys |
| SCH-003 | PASS — `transport_type` is literal string `'stdio'`; no type mismatches |
| CDQ-001 | PASS — `span.end()` only in `finally` block; no redundant call in try |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `transport_type` is a compile-time constant `'stdio'`; never null |

**Failures**: None.

**RUN21-1 CONFIRMED**: Run-21 failed NDS-003 — `mcp/server.js` committed with a double-import of `@opentelemetry/api`. Run-23: clean single import, 1 attempt, committed successfully. The P1 fix is confirmed effective.

**Structure note**: The file has one async function (`main()`) and one sync function (`createServer()`). `main()` is not exported; it is called directly at module scope. COV-001 applies because `main()` is a program entry point, not an exported library function. `createServer()` is sync and correctly skipped per RST-001.

**No Datadog spans**: The MCP server is a long-running stdio daemon, not invoked during the CLI dry-run used for IS scoring. Instrumentation verified via static analysis only.
