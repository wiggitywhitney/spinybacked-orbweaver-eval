### mcp/tools/context-capture-tool.js (1 span, ×1)

> **Skip→commit transition**: Runs 12, 23, and 24 all classified this file as a correct RST-001 skip (exported `registerContextCaptureTool` is synchronous). Run-25 commits a span on `saveContext` (unexported, async, performs `mkdir` + `appendFile` I/O). **This is a legitimate commit.** RST-004 permits — but does not require — instrumenting unexported async I/O functions. Run-12's per-file note flagged this as a candidate: "may benefit from instrumenting the internal async helpers given their I/O nature." Run-25 is the first run to act on that advisory.
>
> Run-23 took the same approach but added a second span on the anonymous MCP callback. Run-24 dropped the outer callback span, keeping only `saveContext`. Run-25 matches run-24's scope: one span on `saveContext` only.
>
> **Coverage delta — attribute regression**: Run-23 set 3 attributes (`entry_date`, `file_path`, `source: 'mcp'`). Run-24 set 2 (`entry_date`, `file_path`). Run-25 sets 1 (`file_path` only) — `entry_date` dropped. COV-005 passes (≥1 domain attribute), but the trend is declining attribute richness across runs on unchanged source.

**Span**: `commit_story.context.save_context`
**Attributes set (1)**: `commit_story.journal.file_path`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | No truthy-check guards; `file_path` set unconditionally after `appendFile` resolves |
| API-001 | **PASS** | `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | Catch calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | The anonymous MCP callback catch swallows the error (returns MCP error response — expected control flow). Agent correctly left it unmodified. |
| COV-001 | **PASS** | `saveContext` is an async I/O function; span wraps the entire body |
| COV-003 | **PASS** | Catch records exception and sets ERROR before rethrow |
| COV-004 | **PASS** | `saveContext` is the only async function; `registerContextCaptureTool` (exported, sync) correctly skipped |
| COV-005 | **PASS** | `commit_story.journal.file_path` provides meaningful domain context (captured path) |
| RST-001 | **PASS** | Exported `registerContextCaptureTool` (synchronous) is not instrumented — correct skip |
| RST-004 | **PASS** | `saveContext` is unexported async I/O; RST-004 permits this; agent exercised the option |
| SCH-001 | **PASS** | `commit_story.context.save_context` registered in `agent-extensions.yaml` |
| SCH-002 | **PASS** | `commit_story.journal.file_path` registered in `semconv/attributes.yaml`; no near-synonyms |
| SCH-003 | **PASS** | `type: string`; set as string from filesystem path |
| CDQ-001 | **PASS** | `finally { span.end() }` present |
| CDQ-002 | **PASS** | No nested spans |
| CDQ-003 | **PASS** | `file_path` is project-relative per schema definition — not a raw user home path |
| CDQ-005 | **PASS** | No empty catch blocks |
| CDQ-007 | **PASS** | `file_path` is set after `appendFile` resolves; the value is the `contextDir` argument, not a nullable field |

**Failures**: None

**CDQ-007 advisory (agent-reported, non-failure)**: The instrumentation.md flagged "raw filesystem path" as a CDQ-007 advisory. `commit_story.journal.file_path` is intentionally project-relative per schema definition and examples, consistent with all other files using this attribute. Advisory is a false positive.

**Trace supplement**: No Datadog spans — `saveContext` is only invoked by the MCP tool handler, which is not exercised during CLI/dry-run invocations. Static analysis only.
