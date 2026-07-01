### Correct Skips (17 files, RST-001 compliant)

All 17 files correctly skipped. Agents evaluated each file independently; all 17 reached the correct skip decision on first or second attempt.

| File | Rule | Rationale |
|------|------|-----------|
| `src/logger.js` | RST-001 | Module executes a single `export default pino(...)` expression — no function declarations at all. Nothing to instrument. **New in run-24**: this file did not exist in run-23. |
| `src/traceloop-init.js` | RST-001 | Module-level initialization — executes synchronous OTel SDK setup and exports `traceloop`. No exported functions. |
| `src/utils/config.js` | RST-001 | All exports are synchronous utility functions (`getConfig`, `validateConfig`, etc.). No async functions. |
| `src/utils/commit-analyzer.js` | RST-001 | All exports are pure synchronous analysis functions (`extractCommitInfo`, `categorizeCommit`, etc.). No async functions. |
| `src/mcp/tools/reflection-tool.js` | RST-004 | Exports only `registerReflectionTool` (synchronous). `saveReflection` is an unexported async helper but RST-004 requires that the exported *synchronous* registrar not receive a span; `saveReflection`'s async work is not covered by an enclosing exported orchestrator, making this a nuanced case. Agent correctly determined: `registerReflectionTool` is synchronous and correctly skipped; `saveReflection` is unexported — analogous to the `saveContext` case, but the `reflection-tool.js` agent skipped the file entirely (treating `saveReflection` as analogous to the anonymous callback in `context-capture-tool.js` rather than an independently instrumentable function). Skip decision is defensible; the tradeoff is the same as `context-capture-tool.js`. |
| `src/prompts/journal-prompt.js` | RST-001 | Exports a string constant (`JOURNAL_PROMPT`). No functions. |
| `src/prompts/technical-prompt.js` | RST-001 | Exports a string constant. No functions. |
| `src/prompts/dialogue-prompt.js` | RST-001 | Exports a string constant. No functions. |
| `src/prompts/quip-prompt.js` | RST-001 | Exports a string constant. No functions. |
| `src/prompts/daily-summary-prompt.js` | RST-001 | Exports a string constant. No functions. |
| `src/prompts/weekly-summary-prompt.js` | RST-001 | Exports a string constant. No functions. |
| `src/prompts/monthly-summary-prompt.js` | RST-001 | Exports a string constant. No functions. |
| `src/guidelines/journal-guidelines.js` | RST-001 | Exports a string constant. No functions. |
| `src/guidelines/technical-guidelines.js` | RST-001 | Exports a string constant. No functions. |
| `src/guidelines/dialogue-guidelines.js` | RST-001 | Exports a string constant. No functions. |
| `src/guidelines/quip-guidelines.js` | RST-001 | Exports a string constant. No functions. |
| `src/utils/git-utils.js` | RST-001 | All exports are synchronous utility functions (`parseGitDiff`, `extractCommitHash`, etc.). No async functions. |

**Note on `src/logger.js`**: This file is new in run-24, added with the pino + OTLP log bridge feature. It exports a single configured `pino` logger instance — `export default pino({ level: ... }, transport)`. There are no function declarations to instrument. The agent that evaluated it correctly identified it as a trivial RST-001 skip on first attempt.

**Note on `src/mcp/tools/reflection-tool.js`**: Two agent attempts both reached the correct skip conclusion. The first attempt explored whether `saveReflection` warranted instrumentation (by the same reasoning as `context-capture-tool.js`'s `saveContext`) and ultimately concluded that the file was a correct skip because `saveReflection` is both unexported and has its async I/O covered by the MCP tool registration infrastructure. This is a more conservative interpretation than was applied to `context-capture-tool.js` — the discrepancy is minor and either decision is defensible.

**Per-gate gate check**: 17 correct skips identified. 0 incorrect skips (no committed file was incorrectly skipped). 0 missed skips (no skipped file was actually committed). The 31-file scope (14 committed + 17 correct skips) accounts for all files in the `src/` directory on the instrument branch.
