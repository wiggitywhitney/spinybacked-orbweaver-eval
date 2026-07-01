## Correct Skips (17)

All 17 files correctly skipped — same set as runs 9–19. No spans committed.

| File | Exported symbols | Async I/O? | Skip verdict |
|------|-----------------|-----------|--------------|
| src/generators/prompts/guidelines/accessibility.js | `accessibilityGuidelines` (const string) | No | Correct skip |
| src/generators/prompts/guidelines/anti-hallucination.js | `antiHallucinationGuidelines` (const string) | No | Correct skip |
| src/generators/prompts/guidelines/index.js | re-exports from guidelines modules | No | Correct skip |
| src/generators/prompts/sections/daily-summary-prompt.js | prompt string constant(s) | No | Correct skip |
| src/generators/prompts/sections/dialogue-prompt.js | prompt string constant(s) | No | Correct skip |
| src/generators/prompts/sections/monthly-summary-prompt.js | prompt string constant(s) | No | Correct skip |
| src/generators/prompts/sections/summary-prompt.js | prompt string constant(s) | No | Correct skip |
| src/generators/prompts/sections/technical-decisions-prompt.js | prompt string constant(s) | No | Correct skip |
| src/generators/prompts/sections/weekly-summary-prompt.js | prompt string constant(s) | No | Correct skip |
| src/integrators/filters/message-filter.js | `filterMessages`, `groupFilteredBySession` (sync functions) | No | Correct skip |
| src/integrators/filters/sensitive-filter.js | sync filter function(s) | No | Correct skip |
| src/integrators/filters/token-filter.js | sync filter function(s) | No | Correct skip |
| src/mcp/tools/context-capture-tool.js | `registerContextCaptureTool(server)` (sync registration) | No | Correct skip |
| src/mcp/tools/reflection-tool.js | `registerReflectionTool(server)` (sync registration) | No | Correct skip |
| src/traceloop-init.js | no exports — top-level side-effect module | No | Correct skip |
| src/utils/commit-analyzer.js | sync analysis function(s) | No | Correct skip |
| src/utils/config.js | `config` (frozen const object) | No | Correct skip |

`context-capture-tool.js` and `reflection-tool.js` export synchronous MCP server registration functions (`registerXTool(server)`). The async I/O they encapsulate (filesystem writes via `mkdir`/`appendFile`) is internal to the tool handler callbacks, not exposed as exported async functions. RST-001 targets exported async functions at module boundaries — these files have none, so the skip classification is correct.
