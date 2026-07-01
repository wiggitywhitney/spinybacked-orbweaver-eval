### 2. src/collectors/git-collector.js (2 spans, 3 attempts)

Both exported async functions (`getPreviousCommitTime`, `getCommitData`) are instrumented with `startActiveSpan` — the same scope as run-19. The four unexported helpers (`runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo`) are correctly excluded. COV-005 remains a failure for `getCommitData` in run-20: despite agent notes describing intent to invent `commit_story.git.command`, `.parent_count`, and `.is_merge`, the committed code sets only `vcs.ref.head.revision` on that span, leaving the rich `CommitData` return value (hash, message, author, diff, merge status) entirely uncaptured. `getPreviousCommitTime` continues to pass COV-005 with both an input attribute (`vcs.ref.head.revision`) and an output attribute (`commit_story.commit.timestamp` as ISO string), unchanged from run-19.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — only span wrappers and OTel imports added; no business logic restructured; minor Prettier reformatting (argument array layout in `getCommitDiff`) is formatting-only |
| NDS-004 | PASS — no function signatures altered |
| NDS-005 | PASS — `runGit`'s original error branching preserved; new catch blocks in both spans record exception and rethrow |
| NDS-006 | PASS — all JSDoc blocks and inline comments intact |
| API-001 | PASS — `@opentelemetry/api` only; `SpanStatusCode` and `trace` imported correctly |
| COV-001 | PASS — both exported async functions (`getPreviousCommitTime`, `getCommitData`) have entry-point spans |
| COV-003 | PASS — both span catch blocks call `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` + rethrow |
| COV-004 | PASS — both exported async functions have spans; four unexported helpers (`runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo`) correctly excluded per RST-004 |
| COV-005 | FAIL — `getCommitData` sets only `vcs.ref.head.revision` (the input parameter); none of the output attributes available from the returned `CommitData` object are captured (`commit_story.commit.message`, `commit_story.commit.author`, `commit_story.commit.timestamp`, merge status, parent count). `getPreviousCommitTime` PASS — sets both input (`vcs.ref.head.revision`) and output (`commit_story.commit.timestamp` as ISO string). |
| RST-001 | PASS — `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` are all unexported; no spans added |
| RST-004 | PASS — unexported async helpers are covered by the `getCommitData` and `getPreviousCommitTime` parent spans |
| SCH-001 | PASS — `commit_story.git.get_previous_commit_time` and `commit_story.git.get_commit_data` are both registered in `agent-extensions.yaml` on the instrument branch |
| SCH-002 | PASS — `vcs.ref.head.revision` is a registered OTel VCS attribute (referenced in `attributes.yaml`); `commit_story.commit.timestamp` is registered in `attributes.yaml`; no unregistered attribute keys used |
| SCH-003 | PASS — `vcs.ref.head.revision` is a string (commitRef default `'HEAD'`); `commit_story.commit.timestamp` is set via `.toISOString()` (string type matches schema) |
| CDQ-001 | PASS — both spans close in `finally` blocks, covering early-return and error paths |
| CDQ-002 | PASS — `SpanKind` defaults to INTERNAL via `startActiveSpan` with no explicit kind; appropriate for application functions |
| CDQ-007 | PASS — `commitRef` is non-nullable (has default `'HEAD'`); `commit_story.commit.timestamp` in `getPreviousCommitTime` is only set after the `timestamps.length < 2` early-return guard, so the null path never reaches the `setAttribute` call |

**Failures**: COV-005 — `getCommitData` span captures only the input parameter (`vcs.ref.head.revision`) and none of the output attributes available in the `CommitData` object it returns. Agent notes from the run log describe reasoning about `commit_story.git.command`, `commit_story.git.parent_count`, and `commit_story.git.is_merge`, but none of these appear in the committed code and none are registered in `agent-extensions.yaml`. At minimum, `commit_story.commit.message` (registered, guarded with null-check) or merge status attributes would satisfy COV-005 without CDQ-007 risk. This is the same failure as run-19.
