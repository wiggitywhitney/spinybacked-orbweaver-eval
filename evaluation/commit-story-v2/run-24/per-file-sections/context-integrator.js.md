### integrators/context-integrator.js (1 span, 1 attempt)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No `isRecording()` guards around `setAttribute`; all 6 attributes set unconditionally |
| API-001 | PASS | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | PASS | Catch block calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | N/A | No catch blocks in original source that require NDS-007 analysis |
| COV-001 | PASS | `gatherContextForCommit` is the only exported async function; span `commit_story.context.gather_context` wraps its entire body |
| COV-003 | PASS | Catch has `recordException` + `setStatus(ERROR)` before rethrow |
| COV-004 | PASS | `gatherContextForCommit` is the only exported async function; `formatContextForPrompt` and `getContextSummary` are pure synchronous transformations, correctly skipped |
| COV-005 | PASS | Six attributes set: `vcs.ref.head.revision` set before first `await` (present on all paths); `commit_story.commit.message`, `commit_story.filter.messages_before`, `commit_story.filter.messages_after`, `commit_story.context.sessions_count`, `commit_story.context.messages_count` set after awaited data collection (correct — values don't exist until awaits resolve) |
| RST-001 | PASS | `formatContextForPrompt` and `getContextSummary` are pure synchronous data transformations; correctly skipped |
| RST-004 | PASS | Only the single exported async function is instrumented |
| SCH-001 | PASS | Span name `commit_story.context.gather_context` follows `commit_story.<domain>.<operation>` convention; registered in `agent-extensions.yaml` |
| SCH-002 | PASS | All 6 attribute keys pre-registered in `semconv/attributes.yaml`; no new attribute declarations in this file |
| SCH-003 | PASS | `vcs.ref.head.revision` set as string; `commit_story.commit.message` set as string; filter counts set as integers from `.length`; `sessions_count` and `messages_count` set as integers |
| CDQ-001 | PASS | `finally { span.end() }` pattern; no redundant `span.end()` in try block |
| CDQ-002 | PASS | No unnecessary nested spans |
| CDQ-003 | PASS | `commit_story.commit.message` is a git commit subject line from external source; CDQ-006 exemption applies (COV-001 entry-point span) |
| CDQ-005 | PASS | No empty catch blocks |
| CDQ-007 | PASS | `vcs.ref.head.revision` set before conditional branching; `commit_story.commit.message` set from `commitData.message` which is a string field on successfully-resolved git data; filter/context counts set from `.length` on guaranteed arrays |

**Failures**: None

**CDQ-006 exemption confirmed**: `commit_story.commit.message` comes from `commitData.message` (external git output). CDQ-006 would ordinarily require an `isRecording()` guard for external-sourced values. However, the exemption for COV-001 entry-point spans applies — `gatherContextForCommit` is the exported orchestrator entry point, and guarding its primary input attributes with `isRecording()` would violate NDS-003 (no isRecording guards). Entry-point spans are exempt from CDQ-006 by convention.

**COV-005 attribute placement**: `vcs.ref.head.revision` is the only attribute set before the first `await getCommitData(...)`. The remaining 5 attributes are set after both awaited calls (`getCommitData` and `collectChatMessages`) because those values are unavailable until async resolution. This is the correct pattern — attributes that depend on async results are correctly placed after the await.

**Run-24 vs run-12 attribute set**: Run-12 used `commit_story.context.time_window_start/end`; run-24 uses `commit_story.filter.messages_before/after` and `commit_story.context.sessions_count/messages_count`. Both sets are registered schema attributes; run-24's set captures operational throughput metrics (how many messages passed through the filter) rather than just time bounds.

**Trace supplement**: Span `commit_story.context.gather_context` confirmed in Datadog (2026-06-18T20:25:31Z). All 6 attributes present at runtime: `vcs.ref.head.revision: HEAD`, `commit_story.commit.message: "docs: add PR summary to instrument branch"`, `filter.messages_before: 0`, `filter.messages_after: 0`, `context.sessions_count: 0`, `context.messages_count: 0`. Zero counts valid — docs-only commit, no chat messages in the time window.
