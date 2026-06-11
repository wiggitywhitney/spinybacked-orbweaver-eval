### 3. generators/journal-graph.js (4 spans, 3 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no original lines modified; instrumentation is purely additive |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS — `generateJournalSections` outer catch rethrows with both `recordException` + `setStatus(ERROR)`; node function inner catches are NDS-007 graceful-degradation (no rethrow, no recordException required) |
| NDS-004 | PASS — `trace` and `SpanStatusCode` both imported and used |
| NDS-007 | PASS — inner graceful-degradation catches in `summaryNode`, `technicalNode`, `dialogueNode` untouched; wrapping is additive |
| COV-001 | PASS — `generateJournalSections` wrapped in `startActiveSpan('commit_story.journal.generate_sections', ...)` |
| COV-003 | PASS — outer `generateJournalSections` catch has `recordException` + `setStatus(ERROR)` |
| COV-004 | PASS — 4 LangGraph node functions instrumented: `summaryNode`, `technicalNode`, `dialogueNode`, and orchestrator; pure sync helpers skipped per RST-001 |
| COV-005 | PASS — `commit_story.journal.sections` array captured on `generateJournalSections` span; `gen_ai.operation.name`, `gen_ai.model.id`, and conditional `gen_ai.usage.*` attrs on node spans |
| COV-006 | PASS — manual spans wrap application logic above auto-instrumented LangChain calls; `model.invoke()` calls execute inside active span contexts |
| RST-001 | PASS — pure sync helpers correctly skipped |
| RST-004 | PASS — all instrumented functions are LangGraph node async functions or exported orchestrators |
| SCH-001 | PASS — all 4 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS — zero new attributes created; all `gen_ai.*` attrs registered via OTel GenAI semconv; `commit_story.journal.sections` registered in base schema |
| SCH-003 | PASS — `sections` set as array of strings; `gen_ai.usage.*` integers when present |
| CDQ-001 | PASS — no redundant `span.end()` calls (async callback pattern, `finally { span.end() }` is correct per issue #915) |
| CDQ-002 | PASS — no nested spans for delegation |
| CDQ-003 | PASS — `commit_story.journal.sections` set at span open after graph result returns, not inside catch |
| CDQ-005 | PASS — no empty catch blocks |
| CDQ-007 | PASS — `gen_ai.usage.*` attrs conditionally set inside `if (result.usage_metadata != null)` guard; `commit_story.journal.sections` guarded with `span.isRecording()` |

**Failures**: None. 3 attempts (up from 2 in run-21); 6th consecutive success (runs 18, 19, 20, 21, [22 never ran], 23).

**Trace evidence**: Datadog trace `2e5e91fecc58831fb2b8d4a12e474ca1` (`service.instance.id: 050d24b0-abe6-4350-9bcd-b842bc2bc57b`). Early-exit detection: `generate_technical` and `generate_dialogue` show `gen_ai.operation.name: chat` but no `gen_ai.response.id` — confirming early-exit path taken (`substantialUserMessages === 0`). `generate_summary` (LLM call completed) carries `gen_ai.usage.*` attrs. Pattern unchanged from run-21.
