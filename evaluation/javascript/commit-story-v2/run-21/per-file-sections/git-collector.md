### 2. collectors/git-collector.js (6 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — all catch blocks that rethrow have recordException + setStatus(ERROR) |
| NDS-004 | PASS — both `trace` and `SpanStatusCode` are used |
| NDS-005 | PASS — original exception handling in runGit (error.code === 128 branches) preserved inside instrumented catch |
| COV-001 | PASS — getCommitData and getPreviousCommitTime (both exported async fns) have spans |
| COV-002 | PASS — runGit span wraps execFileAsync (child process spawn) |
| COV-003 | PASS — all 6 outer span catch blocks have recordException + setStatus(ERROR) |
| COV-004 | PASS — exported: getCommitData, getPreviousCommitTime; unexported async I/O: runGit, getCommitMetadata, getCommitDiff, getMergeInfo; all 6 have spans |
| COV-005 | PASS — run_git: vcs.ref.head.revision; get_commit_metadata: vcs.ref.head.revision + commit_story.commit.message + commit_story.commit.timestamp; get_commit_diff: vcs.ref.head.revision; get_merge_info: vcs.ref.head.revision + commit_story.git_collector.is_merge; get_previous_commit_time: vcs.ref.head.revision; get_commit_data: vcs.ref.head.revision + commit_story.commit.message + commit_story.commit.timestamp + commit_story.git_collector.is_merge |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-004 | PASS — runGit, getCommitMetadata, getCommitDiff, getMergeInfo are unexported async I/O fns instrumented appropriately under COV-004 |
| SCH-001 | PASS — all 6 span names registered |
| SCH-002 | PASS — all attribute keys registered |
| SCH-003 | PASS — commit_story.git_collector.is_merge set as `parentCount > 1` (boolean expression, not string) |
| CDQ-001 | PASS — no redundant span.end(); all spans use finally { span.end() } inside startActiveSpan callbacks |
| CDQ-002 | PASS — no nested spans for simple delegation |
| CDQ-003 | PASS — attributes set in normal flow before catch blocks |
| CDQ-005 | PASS — no empty catch blocks |
| CDQ-007 | PASS — commitRef guarded with `!= null` before setAttribute in runGit; metadata and mergeInfo guarded with null checks in getCommitData; attrs in getCommitMetadata are unguarded but reflect original code's parsing assumptions (not introduced by instrumentation) |

**Failures**: None
