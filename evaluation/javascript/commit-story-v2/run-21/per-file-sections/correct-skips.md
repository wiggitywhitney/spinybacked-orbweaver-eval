## Correct Skips (16)

All files correctly identified as having no instrumentable async exported functions.

| File | RST-001 Reason |
|------|----------------|
| generators/prompts/guidelines/accessibility.js | Module-level constant only — no functions exported |
| generators/prompts/guidelines/anti-hallucination.js | Module-level constant only — no functions exported |
| generators/prompts/guidelines/index.js | Synchronous only (getAllGuidelines) — no async fns |
| generators/prompts/sections/daily-summary-prompt.js | Synchronous only (dailySummaryPrompt) — no async fns |
| generators/prompts/sections/dialogue-prompt.js | Module-level constant only — no functions exported |
| generators/prompts/sections/monthly-summary-prompt.js | Synchronous only (monthlySummaryPrompt) — no async fns |
| generators/prompts/sections/summary-prompt.js | Synchronous only (summaryPrompt) — no async fns |
| generators/prompts/sections/technical-decisions-prompt.js | Module-level constant only — no functions exported |
| generators/prompts/sections/weekly-summary-prompt.js | Synchronous only (weeklySummaryPrompt) — no async fns |
| integrators/filters/message-filter.js | Synchronous only — no async fns |
| integrators/filters/sensitive-filter.js | Synchronous only — refactored to sync between runs 20 and 21 |
| integrators/filters/token-filter.js | Synchronous only — no async fns |
| mcp/tools/reflection-tool.js | registerReflectionTool is sync exported (RST-001); saveReflection is unexported async but refactored away between runs 20 and 21 — now sync-only |
| traceloop-init.js | Top-level initialization code only — no functions |
| utils/commit-analyzer.js | Synchronous only — no async fns |
| utils/config.js | Module-level initialization only — no functions |

**Note**: sensitive-filter.js (1 span in run-20) and reflection-tool.js (2 spans in run-20) are correctly re-classified as skips after the target repo refactored both files to sync-only implementations between runs 20 and 21. These are not regressions — the target repo changed.
