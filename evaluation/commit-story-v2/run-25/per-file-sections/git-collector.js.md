### collectors/git-collector.js (6 spans, ×2)

> **RUN24-2 Fix Verification**: The SCH-003 backstop was NOT triggered — the run-25 agent chose to omit `diff_lines` entirely rather than include it. The 3 schema extension attrs declared are correctly typed. The auto-coercion fix (spiny-orb commit 91e9413 `fixAttributeTypeCoercions()`) was not exercised for this file.

> **×2 Attempts**: Attempt 1 triggered NDS-007 ×2 and COV-003 ×1 errors. Attempt 2 applied `span.recordException(err)` + `span.setStatus(ERROR)` before the existing rethrow in `runGit`'s catch block, then passed clean.

**Spans (6)**: `commit_story.git.get_commit_data`, `commit_story.git.get_previous_commit_time`, `commit_story.git.get_commit_diff`, `commit_story.git.run_git`, `commit_story.git.parse_diff`, `commit_story.git.get_branch_name`
**Schema extension attributes (3)**: `commit_story.git.command` (string), `commit_story.git.parent_count` (int), `commit_story.git.is_merge` (boolean)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | No truthy-check guards; `metadata.subject` and `mergeInfo.isMerge` checked via `!= null` guards before `setAttribute` |
| API-001 | **PASS** | `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | `runGit` catch calls `span.recordException(err)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | N/A | `runGit`'s catch always rethrows; not a graceful-degradation catch |
| COV-001 | **PASS** | All 6 exported and unexported async functions have entry-point spans |
| COV-003 | **PASS** | All catch blocks record exception and set ERROR status |
| COV-004 | **PASS** | 2 exported async functions (`getCommitData`, `getPreviousCommitTime`) + 4 unexported async helpers all have spans |
| COV-005 | **PASS** | `commit_story.git.command` on runGit spans; `vcs.ref.head.revision` on getCommitData span; `commit_story.git.parent_count` and `commit_story.git.is_merge` on getCommitData |
| RST-001 | **PASS** | Sync helpers correctly skipped |
| RST-004 | **PASS** | RST-004 permits instrumenting unexported async I/O helpers; agent instrumented all 4 |
| SCH-001 | **PASS** | All 6 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | **PASS** | All 3 schema extension attrs registered in `semconv/agent-extensions.yaml`; agent correctly omitted `commit_story.commit.author` (PII advisory); no near-synonyms |
| SCH-003 | **PASS** | `command` set as string, `parent_count` set as integer from `commitData.parents.length`, `is_merge` set as boolean from boolean expression — all correctly typed |
| CDQ-001 | **PASS** | `finally { span.end() }` in all `startActiveSpan` callbacks |
| CDQ-002 | **PASS** | No nested child spans |
| CDQ-003 | **PASS** | No PII in attributes; agent notes confirm `commit_story.commit.author` was intentionally excluded |
| CDQ-005 | **PASS** | No empty catch blocks |
| CDQ-007 | **PASS** | `metadata.subject` guarded with `!= null` before setAttribute; `mergeInfo.isMerge` guarded with `!= null`; no unguarded nullable fields |

**Failures**: None

**RUN24-2 Status**: NOT TRIGGERED. Agent omitted `commit_story.git.diff_lines` entirely. The SCH-003 auto-coercion backstop (spiny-orb commit 91e9413) has not been confirmed working against a real case — this file did not exercise it.

**Trace supplement**: Datadog returned run-24 spans (same service.instance.id `bcb5e6b0...`). The `diff_lines: 296` integer visible in run-24 spans confirms the prior SCH-003 finding; it is not a run-25 issue. Run-25 spans not yet available.
