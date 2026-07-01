### 13. mcp/server.js — FAILED (3 attempts)

**Failure**: NDS-003 new variant — blank-line insertion adjacent to pre-import JSDoc block

The PR #905 trivia-loss fix resolved the run-20 failure class (shebang stripped with OTel import). In run-21 the shebang (line 1) is preserved correctly. A new, independent failure emerged: violations at lines 2, 3, 31, 33, 34. When the agent inserts the tracer declaration and a blank line after the import block, the NDS-003 forward-check detects a line-count shift. The blank line addition adjacent to the file's pre-import JSDoc block causes the `normalizedStripped` reconstruction to misalign, reporting violations at the JSDoc delimiter (lines 2–3) and the McpServer constructor area (lines 31, 33, 34). The same 5 violations appeared across all 3 attempts — consistent oscillation pattern. The debug dump for attempt 3 shows correct output; the failure is in the validator algorithm's handling of blank-line insertion near a pre-import JSDoc block, not in the agent's instrumentation logic.

| Rule | Result |
|------|--------|
| NDS-003 | **FAIL** — 5 violations at lines 2, 3, 31, 33, 34 across all 3 attempts; blank-line insertion shifts JSDoc block and McpServer constructor out of expected positions in normalizedStripped |
| API-001 | N/A — file did not commit |
| NDS-006 | N/A |
| NDS-004 | N/A |
| NDS-005 | N/A |
| COV-001 | WOULD PASS — agent correctly planned main() entry-point span in all 3 attempts |
| COV-003 | N/A |
| COV-004 | WOULD PASS — createServer() is sync+unexported (RST-001/RST-004); only main() requires a span |
| COV-005 | WOULD PASS — agent declared commit_story.mcp.transport attribute ('stdio') |
| COV-006 | N/A |
| RST-001 | WOULD PASS — createServer() correctly identified as sync |
| RST-004 | WOULD PASS |
| SCH-001 | WOULD PASS — commit_story.mcp.server_start declared as new span extension in all attempts |
| SCH-002 | N/A — schema extensions declared but file did not commit |
| SCH-003 | N/A |
| CDQ-001 | N/A |
| CDQ-002 | N/A |
| CDQ-003 | N/A |
| CDQ-005 | N/A |
| CDQ-007 | N/A |

**Failures**: NDS-003 — new variant: blank-line insertion near pre-import JSDoc block causes forward-check misalignment (lines 2, 3, 31, 33, 34). Not a content error — the agent's output was structurally correct. Two independent NDS-003 issues on this file: (1) run-20 shebang trivia-loss FIXED by PR #905; (2) this blank-line-near-JSDoc variant UNRESOLVED.
