### 13. src/mcp/server.js (0 spans committed, 3 attempts)

This file was not committed due to NDS-003 oscillation — a spiny-orb false positive caused by the `stripOtelNodes` bug (PRD #885): when the OTel import is placed first in the file, stripping it removes the file-level leading trivia (shebang line + JSDoc block), producing a spurious diff. The agent's code was correct and identical across all 3 attempts. Evaluation is applied to the attempt-3 debug dump as if it had been committed. In run-19, this file passed in 1 attempt with a span on `main()` and a `commit_story.mcp.transport_type` attribute; run-20's agent chose a different span name (`commit_story.mcp.start`) and attribute (`commit_story.context.source`).

The debug dump instruments only `main()` with `tracer.startActiveSpan('commit_story.mcp.start', ...)`, wrapping the full body in try/catch/finally. `createServer()` (synchronous, unexported) is correctly skipped. The single attribute `commit_story.context.source` is set to `'mcp'`. Two issues: the span name `commit_story.mcp.start` is not registered in either `semconv/attributes.yaml` or `semconv/agent-extensions.yaml` on the instrument branch (SCH-001 FAIL); `commit_story.context.source` is registered in the main schema with enum members `claude_code`, `git`, and `mcp`, so the attribute name and value are valid (SCH-002/SCH-003 PASS).

| Rule | Result |
|------|--------|
| NDS-003 | FAIL (SPINY-ORB FALSE POSITIVE) — `stripOtelNodes` bug strips leading trivia (shebang + JSDoc) when OTel import is placed first; agent code is correct and unchanged across all 3 attempts; not an agent defect |
| NDS-004 | PASS — `main()` signature unchanged; `createServer` signature unchanged; only OTel import and tracer declaration added |
| NDS-005 | PASS — original had no try/catch in `main()`; new instrumented version adds try/catch that rethrows; outer `.catch()` handler at call site preserved exactly |
| NDS-006 | PASS — shebang and full JSDoc block preserved in the agent's output; all comments retained |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'`; no SDK packages |
| COV-001 | PASS — `main()` is the exported async process entry point; span wraps its entire body |
| COV-003 | PASS — catch block calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` then rethrows; `span.end()` in finally |
| COV-004 | PASS — `main()` is the only async function; `createServer` is synchronous and skipped |
| COV-005 | ADVISORY — `commit_story.context.source` set to `'mcp'` captures the server type identity; this is a meaningful domain attribute (not merely an input parameter), though it is a hardcoded constant rather than a computed output value; borderline pass given the file's limited operational scope |
| RST-001 | PASS — `createServer` is sync; correctly skipped |
| RST-004 | PASS — `main()` is the process entry point (COV-001 applies); no unexported async helpers |
| SCH-001 | FAIL — span name `commit_story.mcp.start` is not registered in `semconv/attributes.yaml` (main) or `semconv/agent-extensions.yaml` (instrument branch); run-19 used `commit_story.mcp.server_start` which was similarly unregistered; neither run registered an MCP span name |
| SCH-002 | PASS — `commit_story.context.source` is registered in `semconv/attributes.yaml` with enum member `mcp` |
| SCH-003 | PASS — `'mcp'` is the registered enum value for the `mcp` member of `commit_story.context.source` |
| CDQ-001 | PASS — `span.end()` is in a finally block; called exactly once |
| CDQ-007 | PASS — `'mcp'` is a hardcoded string literal; no nullable field access |

**Failures**:
- NDS-003 — SPINY-ORB FALSE POSITIVE: `stripOtelNodes` bug removes shebang + JSDoc when the OTel import is placed first in the file; the agent's instrumentation is correct (verified across all 3 identical attempts); root cause documented in failure-deep-dives.md under NDS-003
- SCH-001 — Span name `commit_story.mcp.start` not registered in either schema file; this is a recurring gap across runs (run-18 used `commit_story.mcp.server.start`, run-19 used `commit_story.mcp.server_start`, run-20 uses `commit_story.mcp.start`); the instrument branch agent-extensions never received an MCP span registration
