### 5. integrators/context-integrator.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS — catch block calls recordException + setStatus(ERROR) then rethrows |
| NDS-004 | PASS — span.end() in finally block |
| NDS-005 | PASS — startActiveSpan used for context propagation |
| COV-001 | PASS — gatherContextForCommit is the only exported async fn and has a span |
| COV-003 | PASS — span name commit_story.context.gather_context_for_commit matches registered schema name |
| COV-004 | PASS — gatherContextForCommit is the only exported async fn; formatContextForPrompt and getContextSummary are sync |
| COV-005 | PASS — 9 domain attributes: vcs.ref.head.revision, commit_story.commit.message, commit_story.git_collector.is_merge, commit_story.filter.messages_before, commit_story.filter.messages_after, commit_story.context.messages_count, commit_story.context.sessions_count, commit_story.context.time_window_start, commit_story.context.time_window_end |
| COV-006 | N/A — no LangChain |
| RST-001 | PASS — formatContextForPrompt and getContextSummary are sync, correctly left uninstrumented |
| RST-004 | PASS — no unnecessary child spans |
| SCH-001 | PASS — commit_story.context.gather_context_for_commit registered in agent-extensions.yaml |
| SCH-002 | PASS — all 9 attrs pre-registered in base semconv or agent-extensions |
| SCH-003 | PASS — vcs.ref.head.revision=string (commitRef param, defaulted), commit_story.commit.message=string (git commit message), commit_story.git_collector.is_merge=boolean (commitData.isMerge), messages_before/after=int (filterStats.total/preserved), messages_count=int (filteredMessages.length), sessions_count=int (filteredSessions.size, Map.size), time_window_start/end=string (.toISOString() on Date objects) |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — all 9 setAttribute calls are safe: commitRef is always a string (defaulted to 'HEAD'), commitData.message is a git commit message string from a successfully resolved commit object, isMerge is a boolean, filter stats are numeric counts from filterMessages return value, filteredMessages.length and filteredSessions.size are always numeric, time window dates are always Date objects with .toISOString() called safely |

**Failures**: None
