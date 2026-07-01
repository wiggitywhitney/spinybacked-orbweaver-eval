### 2. collectors/git-collector.js (2 spans, 3 attempts)

RUN17-3 fix verification: `getCommitData` now has a span. Run-17 committed only `getPreviousCommitTime` after the function-level fallback failed to recover `getCommitData`. Run-18 successfully instruments both exported async functions — the COV-001/COV-004 failures from run-17 are resolved.

The instrumented file wraps both exported async functions (`getPreviousCommitTime` and `getCommitData`) with `startActiveSpan`. Four unexported helpers (`runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo`) are correctly left uninstrumented per RST-001/RST-004. The agent notes describe an abandoned first-pass attempt that added spans to all six functions including the unexported helpers; the committed output contains only the two exported-function spans. Schema extensions `span.commit_story.git.get_previous_commit_time` and `span.commit_story.git.get_commit_data` are declared. Both spans use `startActiveSpan` with `try/catch/finally`, record exceptions on error, and call `span.end()` in `finally`.

`getCommitData` sets `vcs.ref.head.revision` from `commitRef` and sets `commit_story.commit.author` and `commit_story.commit.message` from `metadata` after the `Promise.all` resolves. `getPreviousCommitTime` sets `vcs.ref.head.revision` and `commit_story.commit.timestamp` via `.toISOString()` after the null early-return guard.

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No structural changes; only span wrappers added around existing logic |
| NDS-004 | PASS | No function signatures altered |
| NDS-005 | PASS | No try/catch blocks removed; `runGit`'s existing error handling untouched; each new span wrapper adds its own catch that records and rethrows |
| NDS-006 | PASS | All original comments preserved including inline args comments on `runGit` call sites |
| API-001 | PASS | `@opentelemetry/api` imported; `trace` and `SpanStatusCode` used correctly; no SDK imports |
| COV-001 | PASS | Both exported async functions (`getPreviousCommitTime`, `getCommitData`) have entry-point spans — RUN17-3 resolved |
| COV-003 | PASS | No outbound HTTP or database calls in this file; N/A |
| COV-004 | PASS | Both exported async functions have spans; four unexported helpers correctly excluded per RST-001 |
| COV-005 | PASS | `vcs.ref.head.revision` captures `commitRef` input; `commit_story.commit.timestamp` (ISO string), `commit_story.commit.author`, and `commit_story.commit.message` capture domain-meaningful output values |
| RST-001 | PASS | `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` are unexported and correctly skipped |
| RST-004 | PASS | Unexported helper skipping consistent; no over-instrumentation of private helpers |
| SCH-001 | PASS | Span names `commit_story.git.get_previous_commit_time` and `commit_story.git.get_commit_data` declared as schema extensions in run log |
| SCH-002 | PASS | `vcs.ref.head.revision` is a registered OTel VCS ref; `commit_story.commit.timestamp`, `commit_story.commit.author`, `commit_story.commit.message` are registered custom attributes |
| SCH-003 | PASS | `commit_story.commit.timestamp` set via `.toISOString()` (string); author and message are already strings; no type mismatch |
| CDQ-001 | PASS | Both spans closed in `finally` blocks within `startActiveSpan` callbacks |
| CDQ-002 | PASS | No redundant `span.end()` calls; single `finally` block per span |
| CDQ-003 | PASS | No `console.log` or debug statements added |
| CDQ-005 | PASS | No duplicate `span.end()` calls |
| CDQ-006 | PASS | `SpanStatusCode.ERROR` set on caught exceptions; status not set on success path |
| CDQ-007 | PASS | `commitRef` is a non-null string parameter; `commit_story.commit.timestamp` guarded by `timestamps.length < 2` early return; `metadata.author` and `metadata.subject` are always-present fields on the returned metadata object (parser always populates them from git output) |

**Failures**: None

**RUN17-3 status**: RESOLVED — `getCommitData` span confirmed present in committed output.
