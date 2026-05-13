### 20. mcp/server.js (1 span, 1 attribute, 1 attempt)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS — process.exit(1) lives only in the outer `.catch()` handler outside main(); RST-006 does not apply (no process.exit inside the instrumented function body); the catch block inside `startActiveSpan` records and rethrows, which is the correct NDS-007 error-propagation pattern |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` only; no SDK imports |
| COV-001 | PASS — main() is the async process entry point; COV-001 requires entry-point spans regardless of export status; RST-004 unexported-function exemption is overridden by COV-001 for entry points |
| COV-002 | N/A — no outbound HTTP, database, or RPC calls |
| COV-004 | PASS — main() is the only async function; createServer is synchronous |
| COV-005 | PASS — `commit_story.mcp.transport` set to `'stdio'` on the entry-point span; satisfies the requirement that every span carries at least one domain attribute |
| RST-001 | PASS — createServer is a synchronous factory function; correctly skipped |
| RST-004 | PASS — createServer is also unexported; RST-004 and RST-001 both apply and both confirm the skip |
| SCH-001 | PASS — `commit_story.mcp.server.start` declared as a span extension in `semconv/agent-extensions.yaml`; follows `commit_story.<domain>.<operation>` naming convention; no semantic duplicate exists in `attributes.yaml` (nearest registered spans cover journal generation and context collection, which are distinct operation classes) |
| SCH-002 | PASS — `commit_story.mcp.transport` declared as an attribute extension in `semconv/agent-extensions.yaml`; no registered attribute in `attributes.yaml` covers MCP server transport type (`commit_story.context.source` has an `mcp` member but describes context-collection source, not server transport configuration) |
| SCH-003 | PASS — transport value is the hardcoded string literal `'stdio'`; registered type is `string`; no type mismatch |
| CDQ-001 | PASS — span lifecycle managed via `startActiveSpan` callback; `span.end()` called in `finally` block inside the callback; explicit end is not redundant here because the span is not auto-ended by the callback on throw (the catch re-throws, so `finally` is the correct end site) |
| CDQ-005 | PASS — `startActiveSpan` used (not `startSpan`); span is active for the duration of main() |
| CDQ-007 | PASS — transport attribute is a hardcoded string constant; no property access on potentially nullable objects |
| CDQ-009 | NOT APPLICABLE — no `!== undefined` guards around setAttribute calls |
| CDQ-010 | NOT APPLICABLE — no string-method calls on property accesses in setAttribute arguments |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` at module level; canonical tracer name consistent with all other committed files |

**Failures**: None

**Notes**:

The agent correctly identified that main() is an async process entry point despite being unexported, and applied the COV-001 override over RST-004. The span name `commit_story.mcp.server.start` and the attribute `commit_story.mcp.transport` are both new schema extensions, correctly registered in `semconv/agent-extensions.yaml` before use.

The choice of `commit_story.mcp.transport` as the domain attribute is reasonable: no registered attribute captures MCP server transport type, and `commit_story.context.source` (which has an `mcp` enum member) is semantically distinct — it describes context-collection source, not server startup configuration. The hardcoded value `'stdio'` is correct because the server uses `StdioServerTransport` unconditionally; there is no runtime variable to read.

The NDS-007 pattern is correct: the inner catch records the exception and rethrows it; the outer `.catch()` at the call site handles the terminal failure with `process.exit(1)`. Span closes in `finally` before the rethrow propagates, so the span lifecycle is clean.

This file has been a consistent 1-attempt success since run-12 (1 span, 2 attempts) and run-16 (1 span, 1 attempt). Run-17 matches run-16's 1-attempt profile. The SCH-004 advisory from run-16 (false positive claiming `commit_story.mcp.server_name` duplicated `gen_ai.provider.name`) is not present in run-17 — the span name changed from `commit_story.mcp.start` (run-16) to `commit_story.mcp.server.start` (run-17), and the attribute changed from `commit_story.mcp.server_name`/`server_version` pair (run-12) to the single `commit_story.mcp.transport` attribute (run-16 and run-17). The attribute reduction from two to one is a deliberate simplification that persists across runs.
