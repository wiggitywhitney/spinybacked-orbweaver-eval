### 2. collectors/git-collector.js (2 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — imports `SpanStatusCode`, `trace` from `@opentelemetry/api`; `tracer.startActiveSpan` used correctly in both instrumented functions |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS — try/catch/finally with `recordException` + `setStatus(ERROR)` preserved in both spans; original error-mapping logic in `runGt` untouched |
| COV-001 | PASS — `getPreviousCommitTime` and `getCommitData` are the two exported entry points, both spanned |
| COV-003 | PASS — invented schema-namespaced span names (`commit_story.git.get_previous_commit_time`, `commit_story.git.get_commit_data`) since no pre-existing schema span matched |
| COV-004 | PASS — `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` are unexported async helpers with no spans; RST-004 exemption applies (COV-004 advisories fired for all four in the instrumentation report but are non-blocking) |
| COV-005 | PASS — `getPreviousCommitTime` carries `vcs.ref.head.revision` + `commit_story.commit.timestamp`; `getCommitData` carries only `vcs.ref.head.revision` (unresolved input ref, not the resolved SHA). **Coverage delta observation**: run-25/run-12 versions of `getCommitData` carried 3 attributes (`vcs.ref.head.revision`, `commit_story.commit.message`, `commit_story.commit.author`); this run's `getCommitData` dropped to a single attribute — a real reduction, but COV-005 still passes since ≥1 domain attribute is present |
| RST-001 | PASS — no sync utilities in this file requiring spans |
| RST-004 | PASS — unexported async I/O helpers correctly left unspanned |
| SCH-001 | PASS — both surviving attributes are registry-defined keys, no ad hoc invented attribute names in the final output |
| SCH-002 | PASS (after 3 retries) — Validation Journey shows Attempt 1: 4 SCH-002 blocking errors, Attempt 2: 3, Attempt 3: 2, before falling back to function-level regeneration that dropped every non-registry attribute; final committed code has zero SCH-002 violations |
| SCH-003 | PASS — `commit_story.commit.timestamp` is a raw ISO string from `git log --format=%aI` (string type, matches registry) |
| CDQ-001 | PASS — single `span.end()` call in `finally`, no redundant calls |
| CDQ-002 | PASS — `SpanStatusCode.ERROR` set consistently on the exception path in both spans |
| CDQ-003 | PASS — errors are recorded then rethrown, no silent swallowing |
| CDQ-005 | PASS |
| CDQ-007 | PASS — the diff content returned by `getCommitDiff` (unbounded, potentially large/sensitive) is never captured as a span attribute anywhere in the file |

**Datadog trace supplement**: Live spans found for both `commit_story.git.get_previous_commit_time` and `commit_story.git.get_commit_data` (trace `3722a802e3cf1bc1c0bc5428509d2ce7`, `service:commit-story`, matching `service.instance.id`). Runtime data confirms the source read: `get_previous_commit_time` carries `commit_story.commit.timestamp`; `get_commit_data` carries only `vcs.ref.head.revision` under the `vcs` namespace, no `commit_story.*` custom attribute — matching the static analysis exactly.

**diff_lines watch item**: `diff_lines` is **not present** as a span attribute in this run — neither in the committed source, the instrumentation report's schema extensions, nor the live trace data. The diff string itself (from `getCommitDiff`) is never captured as an attribute at all (consistent with CDQ-007 avoiding unbounded content), so the SCH-003 type-correctness question for `diff_lines` doesn't arise this run. The instrumentation report's "0 attributes" figure refers to zero *new* schema extensions (both surviving attributes, `vcs.ref.head.revision` and `commit_story.commit.timestamp`, are pre-existing registry keys) — it does not mean the spans carry no attributes at all.

**Failures**: None. The 3-attempt count is fully explained by the Validation Journey (SCH-002 registry-mismatch errors on Attempts 1–3, resolved via function-level fallback that dropped non-compliant attributes) — no hint in the log of `diff_lines` specifically being attempted and rejected, since no per-attempt "Agent thinking" block was printed for this file (only Attempt 1 of some other files show detailed reasoning; this file's retries were fully silent).
