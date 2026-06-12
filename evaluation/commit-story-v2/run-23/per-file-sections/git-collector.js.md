### 2. collectors/git-collector.js (6 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only |
| NDS-006 | PASS — all 6 span catch blocks call `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS — both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | PASS — no graceful-degradation catch patterns present; all catches rethrow |
| COV-001 | PASS — `getCommitData` and `getPreviousCommitTime` (both exported async fns) have entry-point spans |
| COV-002 | PASS — `runGit` span wraps `execFileAsync('git', ...)`, a child-process spawn |
| COV-003 | PASS — all 6 outer catch blocks record exception and set ERROR status before rethrowing |
| COV-004 | PASS — all 6 async functions instrumented: exported `getCommitData`, `getPreviousCommitTime`; unexported async I/O `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` |
| COV-005 | PASS — `runGit`: `commit_story.git.subcommand` + conditional `vcs.ref.head.revision`; `getCommitMetadata`: `vcs.ref.head.revision` + `commit_story.commit.author` + `commit_story.commit.message` + `commit_story.commit.timestamp`; `getCommitDiff`: `vcs.ref.head.revision` + `commit_story.git.diff_size`; `getMergeInfo`: `vcs.ref.head.revision` + `commit_story.git.parent_count` + `commit_story.git.is_merge`; `getPreviousCommitTime`: `vcs.ref.head.revision`; `getCommitData`: `vcs.ref.head.revision` + `commit_story.commit.author` + `commit_story.commit.message` + `commit_story.git.is_merge` + `commit_story.git.diff_size` |
| COV-006 | N/A — no LangChain or auto-instrumented library calls |
| RST-001 | PASS — no sync-only helpers exist; all functions are async with I/O |
| RST-004 | PASS — `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` are unexported async I/O functions; instrumentation under COV-004 is appropriate |
| SCH-001 | PASS — all 6 span names registered in `semconv/agent-extensions.yaml`: `span.commit_story.git.run`, `span.commit_story.git.get_commit_metadata`, `span.commit_story.git.get_commit_diff`, `span.commit_story.git.get_merge_info`, `span.commit_story.git.get_previous_commit_time`, `span.commit_story.git.get_commit_data` |
| SCH-002 | PASS — all attribute keys registered: `commit_story.git.subcommand`, `commit_story.git.diff_size`, `commit_story.git.parent_count`, `commit_story.git.is_merge` in `agent-extensions.yaml`; `vcs.ref.head.revision`, `commit_story.commit.author`, `commit_story.commit.message`, `commit_story.commit.timestamp` in `semconv/attributes.yaml` |
| SCH-003 | **FAIL** — `commit_story.git.diff_size` is declared `type: string` in `semconv/agent-extensions.yaml` but set as `diff.length` (JavaScript integer) at runtime in both `getCommitDiff` and `getCommitData`. Schema type and runtime value type are mismatched. |
| CDQ-001 | PASS — no redundant `span.end()` calls; all spans use `finally { span.end() }` inside `startActiveSpan` callbacks |
| CDQ-002 | PASS — no unnecessary nested spans for simple delegation |
| CDQ-003 | PASS — attributes set before catch blocks in normal execution flow |
| CDQ-005 | PASS — no empty catch blocks; all catches rethrow after recording |
| CDQ-007 | PASS — `commitRef` guarded with `!= null` before `setAttribute` in `runGit`; `commit_story.commit.author` and `commit_story.commit.message` in `getCommitMetadata` set under `if (span.isRecording())` guard; values in `getCommitData` are from non-nullable parsed fields |

**Failures**: SCH-003 — `commit_story.git.diff_size` declared as `type: string` in schema but set as an integer (`diff.length`) at runtime.

**Notes**:
- 3 attempts (up from 2 in run-21). The extra attempt introduced the `if (span.isRecording())` guard on `commit_story.commit.author`/`message` in `getCommitMetadata` to address CDQ-007 concern from attempt 2.
- The `commit_story.git.diff_size` type mismatch is a schema authoring error introduced when the agent registered the attribute as `type: string` while using it as an integer. The attribute value itself (`diff.length`) is correct observability practice; only the schema declaration is wrong.
- Regression from run-21: run-21 had 0 failures; run-23 has 1 new failure (SCH-003) not present previously.
