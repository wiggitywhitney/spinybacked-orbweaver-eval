### integrators/context-integrator.js (1 span, ×1)

**Span**: `commit_story.context.gather_context_for_commit`
**Attributes set (8)**: `vcs.ref.head.revision`, `commit_story.commit.message`, `commit_story.commit.timestamp`, `commit_story.filter.messages_before`, `commit_story.filter.messages_after`, `commit_story.context.messages_count`, `commit_story.context.sessions_count`, `commit_story.context.time_window_start`, `commit_story.context.time_window_end`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | No truthy-check guards around `setAttribute`; all values set unconditionally |
| API-001 | **PASS** | `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | Catch block calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | N/A | No graceful-degradation catches in source |
| COV-001 | **PASS** | `integrateContext` is the only exported async function; span wraps the entire body |
| COV-003 | **PASS** | Catch records exception and sets ERROR before rethrow |
| COV-004 | **PASS** | Only the one exported async function is instrumented; both sync exports (`formatContextForPrompt`, `getContextSummary`) correctly skipped |
| COV-005 | **PASS** | 8 domain attributes present — well above the ≥1 threshold |
| RST-001 | **PASS** | Sync helpers correctly skipped |
| RST-004 | **PASS** | Only the exported async function is instrumented |
| SCH-001 | **PASS** | Span name registered in `semconv/agent-extensions.yaml` |
| SCH-002 | **PASS** | All 8 attributes pre-registered in `semconv/attributes.yaml`; no near-synonyms |
| SCH-003 | **PASS** | Strings via `.toISOString()`, ints from `.length`/`.size`/filterStats counts — all correctly typed |
| CDQ-001 | **PASS** | `finally { span.end() }` inside async `startActiveSpan` callback |
| CDQ-002 | **PASS** | No nested child spans |
| CDQ-003 | **PASS** | No PII in attributes |
| CDQ-005 | **PASS** | No empty catch blocks |
| CDQ-007 | **PASS** | All setAttribute sources are non-nullable at call site; `timeWindow.start` safe because both conditional branches assign a Date before context construction |

**Failures**: None

**Coverage delta vs run-24**: Run-25 adds `commit_story.commit.message` and `commit_story.commit.timestamp` (2 new attrs vs run-24's 6-attr set). Net improvement; no attributes dropped.

**CDQ-007 advisory (agent-reported, non-failure)**: The instrumentation.md flagged CDQ-007 advisories on `commitData.author`/`authorEmail` field accesses. Inspection shows these fields are accessed during context object construction before `setAttribute` calls, not as direct setAttribute values. No PII is set on the span. Advisory is a false positive.

**Trace supplement**: No live spans available for run-25 service.instance.id (run-25 not yet organically invoked). Static analysis only.
