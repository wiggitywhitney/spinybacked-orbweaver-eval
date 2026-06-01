### 5. src/integrators/context-integrator.js (1 span, 3 attempts)

The agent placed a single span on `gatherContextForCommit`, the file's sole exported async function — the top-level orchestrator that collects git data, gathers chat messages, applies filtering, and returns the assembled context object. The span name `commit_story.context.gather_context_for_commit` is registered in `agent-extensions.yaml` as a schema extension; no existing span covered this orchestration layer. The two sync exports, `formatContextForPrompt` and `getContextSummary`, were correctly left uninstrumented per RST-001. The final instrumented output is substantively identical to run-19's result, with all 7 attributes, correct error handling, and matching control flow — the regression from 1 attempt (run-19) to 3 attempts (run-20) produced no observable difference in the committed artifact.

Seven attributes are set across the span body: `vcs.ref.head.revision` captures `commitRef` on entry; `commit_story.commit.message` and `commit_story.commit.timestamp` are set once `commitData` is returned from `getCommitData`; `commit_story.filter.messages_before` and `commit_story.filter.messages_after` are set after `filterMessages` populates `filterStats`; `commit_story.context.messages_count` and `commit_story.context.sessions_count` are set after `groupFilteredBySession` returns; `commit_story.context.time_window_start` and `commit_story.context.time_window_end` are set using the resolved `previousCommitTime` and `commitData.timestamp`. All attribute names are registered in `semconv/attributes.yaml`. The `Date` values are converted via `.toISOString()` before `setAttribute`, satisfying SCH-003. The `time_window_start` attribute is guarded by `if (previousCommitTime != null)` before setting from `previousCommitTime`, with a fallback branch computing the day-before value — this correctly handles the null case for first commits.

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| NDS-006 | PASS |
| API-001 | PASS |
| COV-001 | PASS — gatherContextForCommit (sole exported async) has span commit_story.context.gather_context_for_commit |
| COV-003 | PASS — catch records exception and sets SpanStatusCode.ERROR, rethrows; finally calls span.end() |
| COV-004 | PASS — gatherContextForCommit is the only async function; formatContextForPrompt and getContextSummary are sync (RST-001) |
| COV-005 | PASS — vcs.ref.head.revision, commit_story.commit.message, commit_story.commit.timestamp, commit_story.filter.messages_before/after, commit_story.context.messages_count/sessions_count, commit_story.context.time_window_start/end |
| RST-001 | PASS — formatContextForPrompt and getContextSummary are synchronous pure transformations, correctly skipped |
| RST-004 | PASS — callee functions (getCommitData, getPreviousCommitTime, collectChatMessages) are instrumented in their own modules; no duplicate spans added at call sites |
| SCH-001 | PASS — commit_story.context.gather_context_for_commit registered in agent-extensions.yaml |
| SCH-002 | PASS — all attributes registered in semconv/attributes.yaml |
| SCH-003 | PASS — Date objects converted via .toISOString() before setAttribute; integer attributes derived from .length and .size |
| CDQ-001 | PASS — span.end() in finally block |
| CDQ-002 | PASS — no SpanKind set (defaults to INTERNAL, correct for application orchestrator) |
| CDQ-003 | PASS — single span, no cross-span attribute modification |
| CDQ-005 | PASS — all setAttribute and span.end() calls inside startActiveSpan callback |
| CDQ-007 | PASS — vcs.ref.head.revision set from commitRef (string parameter with default 'HEAD', never undefined); commit_story.context.time_window_start guarded by null check before setting from previousCommitTime |

**Failures**: None
