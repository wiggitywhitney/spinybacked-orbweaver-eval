### 11. index.js (1 span, RUN21-2 CONFIRMED)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — original `main()` body unchanged; span wraps the entire function |
| API-001 | PASS |
| NDS-006 | PASS — catch calls `recordException` + `setStatus(ERROR)` before rethrowing |
| NDS-004 | PASS |
| NDS-007 | PASS — inner `auto-summarize` try/catch inside `main()` correctly left unmodified (graceful degradation — auto-summarize failure doesn't abort the commit journal write) |
| COV-001 | PASS — `main()` is the entry point (unexported) and has span `commit_story.index.main`. COV-001 overrides RST-004 for entry-point functions (same precedent as run-12 and run-21). |
| COV-003 | PASS — catch has `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS — `main()` is the only async function in the file; no other exported or unexported async functions |
| COV-005 | PASS — `vcs.ref.head.revision` (commit hash), `commit_story.git.subcommand` (CLI argument, null-guarded), `commit_story.journal.file_path` (journal entry path) all set on `main` span |
| RST-001 | PASS — no sync helper functions in this file |
| RST-004 | N/A — `main()` is the program entry point; COV-001 governs |
| SCH-001 | PASS — `commit_story.index.main` registered in `agent-extensions.yaml` |
| SCH-002 | PASS — `vcs.ref.head.revision`, `commit_story.git.subcommand`, `commit_story.journal.file_path` all registered in base schema |
| SCH-003 | PASS — all attributes are strings; `subcommand` null-guarded with `?.subcommand ?? null` before setAttribute (null setAttribute calls are no-ops in OTel JS) |
| CDQ-001 | PASS — `span.end()` in `finally` is required here: `process.exit()` in error handling bypasses the normal Promise resolution, so the callback auto-end would never fire. Explicit `span.end()` in `finally` is the only safe pattern. |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `vcs.ref.head.revision` from parsed CLI commit arg (always present for `commit` subcommand); `subcommand` null-guarded; `journal.file_path` from `saveJournalEntry()` return value |

**Failures**: None

**RUN21-2 CONFIRMED**: Run-21 failed NDS-003 — `index.js` committed with a corrupted import that imported from `@opentelemetry/api/experimental` (non-existent). Run-23 result: clean `import { trace, SpanStatusCode } from '@opentelemetry/api'`. The P1 fix is confirmed effective for this file.

**CDQ-001 note**: The `finally { span.end() }` inside the async `startActiveSpan` callback is correct and required because `process.exit()` calls in the error path bypass Promise resolution. Without the `finally` block, spans on error paths would leak. Same pattern as `claude-collector.js` and `context-capture-tool.js`; the async-callback misunderstanding from run-21 is resolved per issue #915.

**Trace evidence**: Datadog span `commit_story.index.main` observed — `vcs.ref.head.revision: 5bfc917`, `commit_story.git.subcommand: 'commit'`, `commit_story.journal.file_path: journal/entries/2026-06/2026-06-10.md`.
