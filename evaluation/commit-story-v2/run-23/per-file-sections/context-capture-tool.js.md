### 12. tools/context-capture-tool.js (2 spans, 1 attempt)

> **Correction**: The original per-file evaluation agent reported 3 spans, a CDQ-001 FAIL, and fabricated attributes (`context.sessions_count`, `context.messages_count`) that do not exist in the committed code. Source inspection confirms 2 spans. The PR body reports 3 (likely a spiny-orb counting artifact — only 2 `startActiveSpan` calls exist in the 141-line file, and only 2 new span names appear in the PR's schema extensions section). CDQ-001 is PASS: neither function has `span.end()` in the try block. This correction changes the canonical failure count for run-23 from 3 to 2.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original tool handler logic untouched; spans wrap at async function boundaries |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS — `saveContext` catch calls `recordException` + `setStatus(ERROR)` before rethrowing; `capture_context` tool handler catch is graceful-degradation (NDS-007) |
| NDS-004 | PASS |
| NDS-007 | PASS — `capture_context` tool handler catch returns an MCP error response instead of rethrowing; this is the standard MCP tool error pattern; agent correctly left it unmodified |
| COV-001 | PASS — `registerContextCaptureTool` is the only exported function and it is sync (RST-001 exemption); no exported async functions exist in this file |
| COV-003 | PASS with constraint — `saveContext` catch records exception and sets ERROR status ✅; `capture_context` handler catch is NDS-007 graceful-degradation (cannot add `recordException` without violating NDS-007); `capture_context` span ends without error status on failure, which is an inherent limitation of the MCP tool pattern |
| COV-004 | PASS — `saveContext` (unexported async I/O function) has span `commit_story.context.save_context`; async MCP tool handler has span `commit_story.mcp.capture_context` |
| COV-005 | PASS — `capture_context` span: `commit_story.context.source: 'mcp'` set before the async work begins; `commit_story.journal.file_path` set after save completes |
| RST-001 | PASS — `registerContextCaptureTool` is a sync function; correctly not wrapped in a span |
| RST-004 | PASS |
| SCH-001 | PASS — both span names (`commit_story.context.save_context`, `commit_story.mcp.capture_context`) registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `commit_story.journal.file_path` and `commit_story.context.source` both registered in `attributes.yaml`; no invented near-synonym keys |
| SCH-003 | PASS — `context.source` is string `'mcp'`; `file_path` is a string path; no type mismatches |
| CDQ-001 | PASS — `saveContext`: `finally { span.end() }` only, no `span.end()` in try block ✅; `capture_context` handler: `finally { span.end() }` only, no `span.end()` in try block ✅ |
| CDQ-002 | PASS |
| CDQ-003 | PASS — `context.source` set before the try block on `capture_context`; `file_path` set inside try after successful save |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `context.source` is a compile-time constant `'mcp'`; `file_path` is a computed path string (never null at setAttribute call site) |

**Failures**: None.

**File status note**: `context-capture-tool.js` was a **correct skip** in run-12 and run-21 (the file was not in the target at those runs). In run-23 it was newly instrumented with 2 spans.

**Span 3 discrepancy note**: The PR reports "3 spans" for this file, but only 2 `startActiveSpan` calls exist in the 141-line source. The PR's schema extensions section lists exactly 2 new span names. The "3" in the PR table is likely a spiny-orb span-count reporting artifact; source is authoritative at 2.
