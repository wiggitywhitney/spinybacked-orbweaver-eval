### 18. mcp/tools/context-capture-tool.js (0 spans, 3 attempts) — FAILED (NDS-003 oscillation)

**Outcome**: Not committed. NDS-003 oscillation at output lines 124-125 in attempts 2 and 3. Run-16 failed differently (token budget exhaustion / null parsed_output). The RUN16-1 fix (enabled thinking with budget cap) resolved the budget exhaustion — structured output was produced — but NDS-003 fired instead.

| Rule | Result |
|------|--------|
| NDS-003 | **FAIL** — reconciler gap; agent code is correct |
| API-001 | PASS — `@opentelemetry/api` only (`trace`, `SpanStatusCode`) |
| NDS-006 | PASS — ESM syntax; project is `"type": "module"` |
| NDS-004 | PASS — `registerContextCaptureTool(server)` signature unchanged |
| NDS-005 | PASS — original saveContext had no try/catch; instrumented version adds catch that re-throws unconditionally, preserving error propagation |
| COV-001 | PASS (approach) — span placed on `saveContext`; MCP callback is the functional entry point but anonymous/unexported; `saveContext` captures the observable I/O operation |
| COV-003 | PASS (approach) — `saveContext` catch block records exception and sets ERROR status |
| COV-004 | PASS (approach) — `saveContext` is async, performs filesystem I/O (mkdir + appendFile); instrumented per RST-004 I/O exception |
| COV-005 | PASS (approach) — `commit_story.journal.file_path` captures output file path; attribute registered in schema |
| RST-001 | PASS — `getContextPath`, `formatTimestamp`, `formatContextEntry` (sync, no I/O), `registerContextCaptureTool` (sync registration) all correctly skipped |
| RST-004 | PASS — `saveContext` is unexported but exempt: async filesystem I/O (mkdir + appendFile) with no exported orchestrator covering the path |
| SCH-001 | PASS — `commit_story.context.save_context` not in registry; logged as new schema extension; follows `commit_story.<category>.<operation>` convention |
| SCH-002 | PASS — `commit_story.journal.file_path` is a defined registry key |
| SCH-003 | PASS — `commit_story.journal.file_path` is `type: string`; `filePath` is a constructed string path |
| CDQ-001 | PASS — `startActiveSpan` callback; `span.end()` in `finally` block |
| CDQ-005 | PASS — `startActiveSpan` callback pattern |
| CDQ-007 | PASS — `filePath` is non-nullable constructed string returned by `getContextPath(now)`; no guard needed |

**Failures (against debug dump)**: NDS-003 — reconciler gap only; agent-produced code is correct.

---

**NDS-003 failure analysis**

The agent correctly wrapped `saveContext` with `tracer.startActiveSpan`. This added approximately 14 new lines (OTel import, tracer init, span setup, try/catch/finally). All original content is present in the debug dump — lines 122-135 contain the `registerContextCaptureTool` catch block with byte-for-byte identical content to the original.

The NDS-003 failure is a validator reconciler gap. Root cause: the `startActiveSpan` callback wrapper re-indents all original `saveContext` body lines by two additional spaces. The validator's line-tracking algorithm counts re-indented lines as both "removed from original" and "added as new", inflating its computed cumulative offset. By the time the validator scans past `saveContext`, the offset miscounts push the expected position for subsequent original lines out of range — past the end of the original file — producing the spurious "original line 124" reference.

The same gap caused identical failure at `reflection-tool.js` (lines 116-117, same `},` and `);` content), confirming this is systematic for the `server.tool()` + `startActiveSpan` nesting pattern.

**What would need to change for run-18**

This is a spiny-orb validator issue, not an agent quality issue. The fix belongs in the NDS-003 reconciler: when a `startActiveSpan` callback wrapper is detected, the reconciler should treat all re-indented lines inside it as preserved (whitespace-change only), not as line removals/additions that inflate the cumulative offset.

Until that fix lands, the agent cannot successfully instrument any function inside a `server.tool()` callback with a `startActiveSpan` wrapper.
