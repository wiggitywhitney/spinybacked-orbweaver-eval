### collectors/git-collector.js (6 spans, 3 attempts)

> **Run history**: Run-23 committed with SCH-003 failure (`commit_story.git.diff_size` declared `type: string`, set as integer `diff.length`). Run-24 renamed the attribute to `commit_story.git.diff_lines` and changed the value source to `lines.length`, but the `type: string` declaration in `agent-extensions.yaml` was not corrected. The rename resolves the semantic clarity concern but does not fix the type mismatch.

**Spans**: `commit_story.git.run`, `commit_story.git.commit_metadata`, `commit_story.git.commit_diff`, `commit_story.git.merge_info`, `commit_story.git.get_previous_commit_time`, `commit_story.git.get_commit_data`

**New attribute declarations**: `commit_story.git.subcommand` (string), `commit_story.git.diff_lines` (declared string, set as int — SCH-003 FAIL), `commit_story.git.parent_count` (int)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No `isRecording()` guards around `setAttribute` calls |
| API-001 | PASS | `import { trace, SpanStatusCode } from '@opentelemetry/api'` only; no SDK imports |
| NDS-006 | PASS | All 6 span catch blocks call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used across all 6 spans |
| NDS-007 | PASS | `runGit`'s original conditional rethrow logic (`if (error.code === 128)` checks) preserved intact inside the new catch; `recordException` and `setStatus` added at top of catch before existing conditionals, preserving original error-handling control flow |
| COV-001 | PASS | `getCommitData` and `getPreviousCommitTime` (both exported async) have entry-point spans |
| COV-002 | PASS | `runGit` span wraps `execFileAsync('git', args, ...)`, a child-process spawn — external process call covered |
| COV-003 | PASS | All 6 outer catch blocks record exception and set ERROR status before rethrowing |
| COV-004 | PASS | All 6 async functions instrumented: exported `getCommitData`, `getPreviousCommitTime`; unexported async I/O `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` |
| COV-005 | PASS | `runGit`: `commit_story.git.subcommand` set from `args[0]`; `getCommitMetadata`: `vcs.ref.head.revision` (twice), `commit_story.commit.message`, `commit_story.commit.timestamp`; `getCommitDiff`: `vcs.ref.head.revision`, `commit_story.git.diff_lines`; `getMergeInfo`: `vcs.ref.head.revision`, `commit_story.git.parent_count`; `getPreviousCommitTime`: `vcs.ref.head.revision`; `getCommitData`: `vcs.ref.head.revision`, `commit_story.commit.message`, `commit_story.git.parent_count` |
| RST-001 | PASS | No sync-only helpers exist in this file; all functions are async with I/O |
| RST-004 | PASS | `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` are unexported async I/O functions; instrumentation appropriate per COV-004 precedent |
| SCH-001 | PASS | All 6 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS | All 3 new attributes registered in `agent-extensions.yaml`; `vcs.ref.head.revision`, `commit_story.commit.message`, `commit_story.commit.timestamp` registered in `attributes.yaml`; no invented near-synonyms |
| SCH-003 | **FAIL** | `commit_story.git.diff_lines` declared `type: string` in `agent-extensions.yaml` but set as `lines.length` (JavaScript integer) at runtime. Datadog confirms integer at runtime: `commit_story.git.diff_lines: 296`. Fix: change `type: string` to `type: int` in `agent-extensions.yaml`. |
| CDQ-001 | PASS | All 6 spans use `finally { span.end() }` inside async `startActiveSpan` callbacks; no redundant `span.end()` in try blocks |
| CDQ-002 | PASS | No unnecessary nested spans; each async function boundary gets exactly one span |
| CDQ-003 | PASS | Attributes set from git output values; no PII captured |
| CDQ-005 | PASS | No empty catch blocks; all catches rethrow after recording |
| CDQ-006 | PASS | `commit_story.git.diff_lines` uses `lines.length` (property access on already-computed array split from prior `runGit` call); no `isRecording()` guard needed |
| CDQ-007 | PASS | `args[0]` always present at `runGit` call sites; `commitRef` defaults to `'HEAD'`; `lines.length` on split array is always a non-negative integer; `hashes.length - 1` always an integer |

**Failures**: SCH-003 — `commit_story.git.diff_lines` declared `type: string` in schema but set as integer (`lines.length`) at runtime. Confirmed by Datadog: `diff_lines: 296` (integer). **Second consecutive run** with this failure on the same file (run-23: `diff_size: type: string` set as integer; run-24: `diff_lines: type: string` set as integer). Fix is a one-character change in `agent-extensions.yaml`: `type: string` → `type: int`.

**NDS-007 detail**: The `runGit` catch block contains the most structurally complex original logic in this file. The agent correctly placed `span.recordException(error)` and `span.setStatus(...)` at the very top of the catch block, before the existing `if (error.code === 128)` conditional branches. All original conditional rethrows are preserved in original order — NDS-007 spirit maintained.

**Double `vcs.ref.head.revision` in `getCommitMetadata`**: Span receives `setAttribute('vcs.ref.head.revision', commitRef)` at open (e.g., `'HEAD'`), then `setAttribute('vcs.ref.head.revision', hash)` after parsing (the resolved full SHA). Final Datadog value is the resolved hash — correct behavior. Not a rule violation; the second set intentionally overwrites the initial placeholder.

**Trace supplement**: Datadog trace (2026-06-18T20:25:31Z) — all 6 spans confirmed present:
- `commit_story.git.get_commit_data`: `commit.message: 'docs: add PR summary to instrument branch'`, `parent_count: 1`, `vcs.ref.head.revision: HEAD`
- `commit_story.git.commit_metadata`: `commit.message: 'docs: add PR summary to instrument branch'`, `commit.timestamp: 2026-06-18T20:25:29.000Z`, `vcs.ref.head.revision: 720688109ede953840740fb25bcfa02aab4c0e88`
- `commit_story.git.commit_diff`: `diff_lines: 296` (integer — confirms SCH-003 type mismatch)
- `commit_story.git.merge_info`: `parent_count: 1`, `vcs.ref.head.revision: HEAD`
- `commit_story.git.get_previous_commit_time`: `vcs.ref.head.revision: HEAD`
- `commit_story.git.run` (×4): subcommand values `show`, `diff-tree`, `rev-list`, `log` — all correctly captured
