### mcp/tools/context-capture-tool.js (1 span, 1 attempt)

> **File history**: Correct skip in run-12 and run-21. Run-23 committed with 2 spans (`commit_story.context.save_context` on `saveContext` and `commit_story.mcp.capture_context` on the anonymous MCP tool callback). Run-24 commits with 1 span — only `commit_story.context.save_context` on `saveContext`; the anonymous callback span is absent.

**RST-004 / COV-004 analysis**: `saveContext` is an unexported async function performing filesystem I/O (`mkdir` + `appendFile`). Its only caller is the anonymous async callback registered inline by `registerContextCaptureTool`. That callback is neither exported nor separately instrumented in this run. Because no exported orchestrator with its own span wraps `saveContext`, RST-004 (unexported internal detail function covered by enclosing exported orchestrator span) does not apply. Instrumenting `saveContext` directly is the correct and consistent choice — supported by COV-004 precedent from `git-collector.js` where unexported async I/O helpers were instrumented precisely because no outer span covered their work.

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | Original tool handler logic untouched; span wraps `saveContext` at its async function boundary without modifying any existing control flow |
| API-001 | PASS | `import { trace, SpanStatusCode } from '@opentelemetry/api'`; no SDK imports |
| NDS-006 | PASS | `saveContext` catch calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | PASS | Anonymous MCP tool handler catch returns an MCP error response instead of rethrowing — graceful-degradation path correctly left unmodified per NDS-007 |
| COV-001 | PASS | `registerContextCaptureTool` is the only exported function and is synchronous — RST-001 exemption applies; no exported async functions exist in this file |
| COV-003 | PASS | `saveContext` catch records exception and sets ERROR status before rethrowing |
| COV-004 | PASS | `saveContext` is the effective async I/O entry point; RST-004 does not exempt it (no enclosing exported orchestrator span); span `commit_story.context.save_context` covers the async work |
| COV-005 | **FAIL** | `saveContext` span sets `commit_story.journal.entry_date` and `commit_story.journal.file_path` (both output/result attributes). No span in this file captures `commit_story.context.source: 'mcp'` — the MCP source attribution present in run-23's outer callback span is gone. An observer cannot determine from span alone that this context save was triggered by the MCP tool vs. any other caller. |
| RST-001 | PASS | `getContextPath`, `formatTimestamp`, `formatContextEntry` are all pure synchronous helpers correctly skipped |
| RST-004 | PASS | `saveContext` is unexported; instrumented because no enclosing exported orchestrator span covers its I/O; consistent with COV-004 precedent for unexported async I/O functions |
| SCH-001 | PASS | `span.commit_story.context.save_context` registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS | `commit_story.journal.entry_date` and `commit_story.journal.file_path` are both registered in `semconv/attributes.yaml` under `registry.commit_story.journal`; no new attribute declarations in this run |
| SCH-003 | PASS | `entry_date` set via `.toISOString().split('T')[0]` producing a string (`YYYY-MM-DD`), matching `type: string` in schema; `file_path` is a string path, matching `type: string` in schema |
| CDQ-001 | PASS | `finally { span.end() }` only; no `span.end()` in the try block |
| CDQ-002 | PASS | No unnecessary nested child spans |
| CDQ-003 | PASS | `entry_date` set before I/O begins (from `now` computed at start); `file_path` set after successful `appendFile` |
| CDQ-005 | PASS | No empty catch blocks; anonymous callback catch returns an MCP error response (NDS-007 graceful degradation, not a silent swallow) |
| CDQ-007 | PASS | `entry_date` derived from `new Date()` (always valid); `file_path` is the return value of `getContextPath(now)` (always a string); both are non-null at their respective `setAttribute` call sites |

**Failures**: COV-005 — the `saveContext` span carries only output/result attributes (`entry_date`, `file_path`). No span in this file captures `commit_story.context.source: 'mcp'` — the MCP source attribution present in run-23's outer callback span is absent. Fix: add `span.setAttribute('commit_story.context.source', 'mcp')` before the `mkdir` call in `saveContext`, or reinstate the outer anonymous callback span.

**Run-24 vs run-23 divergence**: Run-23 instrumented both `saveContext` and the anonymous callback, with `source: 'mcp'` set on the outer span. Run-24 omits the outer span. The anonymous callback delegates entirely to `saveContext` and performs no additional I/O, so omitting it is a defensible simplification — but the loss of `source: 'mcp'` is a COV-005 regression.

**Trace supplement**: No `commit_story.context.save_context` span appeared in Datadog for this service instance. The 31 spans present from this instance are all from a `--check-summaries` / auto-summarize run; the `journal_capture_context` MCP tool was not invoked during the captured run. Trace absence does not affect the rubric evaluation — code path confirmed by static analysis.
