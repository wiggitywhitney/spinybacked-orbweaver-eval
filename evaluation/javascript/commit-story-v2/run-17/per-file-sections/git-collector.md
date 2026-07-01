### 2. collectors/git-collector.js (1 span, 0 attributes, 3 attempts)

The file exports two async functions: `getPreviousCommitTime` and `getCommitData`. Four unexported async helpers also exist: `runGit`, `getCommitMetadata`, `getCommitDiff`, and `getMergeInfo`. The committed instrumentation wraps only `getPreviousCommitTime`; `getCommitData` has no span.

The agent notes describe an ambitious first-pass plan — spans on all four unexported helpers (with new schema extensions `commit_story.git.subcommand` and `commit_story.commit.parent_count`) plus both exported functions. The validator rejected that attempt (and a second), and the function-level fallback recovered only `getPreviousCommitTime`. The agent notes' references to helper-span reasoning and new attribute extensions describe an abandoned attempt, not the committed output.

The run summary reports "0 attributes" because the attribute counter tracks new schema extension attributes only. The committed code does call `span.setAttribute` twice: once for `vcs.ref.head.revision` (the `commitRef` input parameter) and once for `commit_story.commit.timestamp` (the raw ISO timestamp string). Both are registered schema keys, not new extensions — consistent with the zero count.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no structural changes to original code; only `getPreviousCommitTime` received span wrapping; all other functions are byte-for-byte unchanged |
| NDS-004 | PASS — no function signatures altered |
| NDS-005 | PASS — no try/catch blocks removed; `runGit`'s existing try/catch is untouched; the new span wrapper in `getPreviousCommitTime` adds its own catch that records and rethrows |
| NDS-006 | PASS — no comments removed; inline comments on `runGit`'s git args array preserved |
| NDS-007 | PASS — no catch blocks in `getPreviousCommitTime` perform graceful-degradation; the single catch records the exception and rethrows, consistent with NDS-007 |
| COV-001 | **FAIL** — `getCommitData` is exported and async and has no span. It is the primary orchestrator for commit data collection (calls `getCommitMetadata`, `getCommitDiff`, and `getMergeInfo` in parallel via `Promise.all`) and produces the `CommitData` return type consumed throughout the application. COV-001 requires all exported async functions to have an entry-point span. |
| COV-002 | N/A — no outbound HTTP or database calls |
| API-001 | PASS — `@opentelemetry/api` imported; `trace` and `SpanStatusCode` used correctly |
| API-004 | PASS — no SDK-internal imports |
| SCH-001 | PASS — span name `commit_story.commit.get_previous_commit_time` declared as a schema extension per run log |
| SCH-002 | PASS — `vcs.ref.head.revision` is a registered OTel VCS ref; `commit_story.commit.timestamp` is a registered custom attribute (type: string, ISO 8601) |
| SCH-003 | PASS — `commit_story.commit.timestamp` set from `timestamps[1]` which is a raw ISO string from git's `%aI` format; string type matches schema declaration |
| CDQ-001 | PASS — span closed in `finally` block within `startActiveSpan` callback |
| CDQ-005 | PASS — no duplicate span.end() calls |
| CDQ-011 | PASS — `trace.getTracer('commit-story')` matches canonical tracer name |
| COV-004 | **FAIL** — `getCommitData` (exported async) has no span. The function-level fallback that recovered `getPreviousCommitTime` did not include `getCommitData`. COV-004 requires every exported async function to have a span. |
| COV-005 | PASS — `vcs.ref.head.revision` captures the `commitRef` input; `commit_story.commit.timestamp` captures the resolved timestamp. The commitRef value may be 'HEAD' (the default), not a resolved SHA — this is a minor semantic gap but SCH-002 passes because `vcs.ref.head.revision` is defined as "the full commit SHA hash" in the schema. The input parameter is typically a SHA or ref string, so using it is defensible. No FAIL warranted. |
| RST-001 | PASS — `runGit`, `getCommitMetadata`, `getCommitDiff`, and `getMergeInfo` are unexported; the committed file correctly skips all four per RST-001 (unexported sync/async helpers exempt when not at an I/O boundary the exported API exposes directly) |
| RST-004 | PASS — unexported helper skipping is consistent with RST-004 |
| CDQ-007 | PASS — `vcs.ref.head.revision` receives `commitRef` (a string parameter, never null); `commit_story.commit.timestamp` is set only after a `timestamps.length < 2` early return that guards the null path; no nullable property access reaches setAttribute |

**Canonical failures**: COV-001 and COV-004 — `getCommitData` (exported async) has no span due to function-level fallback regression

**Note on 3 attempts**: The first attempt targeted all four unexported helpers plus both exported functions with five or more spans and two new schema extension attributes (`commit_story.git.subcommand` on `runGit`, `commit_story.commit.parent_count` on `getMergeInfo`). Validator failures on those attempts — likely NDS-003 or schema validation errors from unregistered attribute keys — caused successive retries. The function-level fallback on attempt 3 recovered only `getPreviousCommitTime`, leaving `getCommitData` uninstrumented. The agent notes' reasoning about helper spans reflects the discarded plan, not the committed output.

**Regression from run-16**: Run-16 also committed 1 span with `getPreviousCommitTime` only (COV-004 note: "exported async functions have spans"), but the run-16 COV-004 entry was recorded as PASS with the note "exported async functions have spans." Re-examining: run-16's agent notes stated "Function-level fallback: 1/1 functions instrumented: getPreviousCommitTime" and the COV-004 entry read PASS. That was an error in the run-16 evaluation — `getCommitData` was also uninstrumented in run-16. The run-17 evaluation corrects this: COV-004 is a FAIL when `getCommitData` has no span.
