### Correct Skips (16 files)

All 16 files verified RST-001 compliant. `git diff main..spiny-orb/instrument-1781089793056 -- <file>` returns empty for all 16 — no modifications on the instrument branch.

**RST-001 applies when**: A file contains only synchronous exports, only constants/configuration, or only utility functions with no async I/O. The instrumentation agent correctly identified all 16 as out of scope and left them unmodified.

| File | RST-001 Reason |
|------|----------------|
| `utils/accessibility.js` | Exports only synchronous constants and sync formatting functions |
| `utils/anti-hallucination.js` | Exports only synchronous constants (string arrays) |
| `guidelines/index.js` | Exports synchronous guideline data (no async functions) |
| `utils/message-filter.js` | Exports only synchronous filter functions |
| `tools/reflection-tool.js` | Exports one sync function (`reflectionTool` definition) and one unexported async (`handleReflectionRequest`) — unexported async helper does not trigger COV-001/COV-004 obligations |
| `utils/traceloop-init.js` | No exports; sets up tracing at module scope (sync side effect); no async functions |
| `collectors/git-utils.js` | Exports only synchronous string manipulation utilities |
| `collectors/context-analyzer.js` | Exports only synchronous analysis functions |
| `utils/date-utils.js` | Exports only synchronous date formatting functions |
| `utils/token-counter.js` | Exports only synchronous counting functions |
| `utils/text-cleaner.js` | Exports only synchronous text processing functions |
| `guidelines/sections.js` | Exports only synchronous content arrays |
| `generators/section-formatter.js` | Exports only synchronous formatting functions |
| `generators/content-generator.js` | Exports only synchronous generation helpers |
| `commands/commit.js` | Delegates entirely to other modules via synchronous wiring; no async I/O of its own |
| `commands/journal.js` | Same as commit.js — synchronous dispatch only |

**verification note on reflection-tool.js**: Two evaluation attempts were made on this file. Both correctly concluded RST-001 applies. `handleReflectionRequest` is an unexported async function — COV-001 and COV-004 only apply to exported functions and program entry points. An unexported async helper does not independently trigger a coverage obligation.
