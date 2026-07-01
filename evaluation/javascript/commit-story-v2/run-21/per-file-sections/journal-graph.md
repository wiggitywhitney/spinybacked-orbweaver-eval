### 3. generators/journal-graph.js (4 spans, 2 attempts)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no original lines modified; instrumentation is purely additive |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS — `generateJournalSections` outer catch rethrows and has both `recordException` + `setStatus(ERROR)`; node function inner catches are NDS-007 graceful-degradation (no rethrow, no recordException required) |
| NDS-004 | PASS — `trace` used in `trace.getTracer()`, `SpanStatusCode` used in `span.setStatus({ code: SpanStatusCode.ERROR })` |
| NDS-005 | PASS — inner graceful-degradation catches in summaryNode, technicalNode, dialogueNode untouched; wrapping is additive |
| COV-001 | PASS — `generateJournalSections` wrapped in `startActiveSpan('commit_story.journal.generate_sections', ...)` |
| COV-003 | PASS — `generateJournalSections` outer catch calls `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, then rethrows |
| COV-004 | PASS — exported async fns: `generateJournalSections`, `summaryNode`, `technicalNode`, `dialogueNode` — all 4 instrumented; sync exports (`getModel`, `resetModel`, and all helpers) correctly skipped |
| COV-005 | PASS — `commit_story.journal.summary_node`: `gen_ai.operation.name`, `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.request.temperature`, `gen_ai.request.max_tokens`, `commit_story.ai.section_type`; `commit_story.journal.technical_node`: same set; `commit_story.journal.dialogue_node`: same set; `commit_story.journal.generate_sections`: `commit_story.journal.sections` |
| COV-006 | PASS — each node function's `startActiveSpan` callback establishes the active context before `getModel(...).invoke(...)` is called, making the manual span the parent of the auto-instrumented LangChain call |
| RST-001 | PASS — sync helpers skipped: `getModel`, `resetModel`, `analyzeCommitContent`, `hasFunctionalCode`, `generateImplementationGuidance`, `formatSessionsForAI`, `formatChatMessages`, `escapeForJson`, `formatContextForSummary`, `formatContextForUser`, `cleanDialogueOutput`, `cleanTechnicalOutput`, `cleanSummaryOutput`, `buildGraph`, `getGraph` |
| RST-004 | PASS — `summaryNode`, `technicalNode`, `dialogueNode` are async LangGraph node functions exported for testing and instrumented appropriately (all perform LLM I/O via `getModel().invoke()`); COV-004/COV-006 applies |
| SCH-001 | PASS — all 4 span names registered: `span.commit_story.journal.summary_node`, `span.commit_story.journal.technical_node`, `span.commit_story.journal.dialogue_node`, `span.commit_story.journal.generate_sections` |
| SCH-002 | PASS — all attribute keys registered: `commit_story.ai.section_type` in `registry.commit_story.ai`; `commit_story.journal.sections` in `registry.commit_story.journal`; all `gen_ai.*` attributes registered via `ref:` to OTel GenAI semconv in `semconv/attributes.yaml` |
| SCH-003 | PASS — `commit_story.journal.sections` set as `['summary', 'dialogue', 'technical_decisions']` (string array literal) |
| CDQ-001 | PASS — `span.end()` appears only in `finally` blocks; no double-end |
| CDQ-002 | PASS — no `context.with()` usage; no context leak risk |
| CDQ-003 | PASS — `startActiveSpan` used throughout; no `createSpan` calls |
| CDQ-005 | PASS — `tracer.startActiveSpan` used; no `tracer.startSpan` without context propagation |
| CDQ-007 | PASS — optional chaining on all result properties: `result?.id`, `result?.usage_metadata?.input_tokens`, `result?.usage_metadata?.output_tokens`, `result?.response_metadata?.model`; also `NODE_TEMPERATURES?.summary`, `NODE_TEMPERATURES?.technical`, `NODE_TEMPERATURES?.dialogue` |

**Failures**: None

**Notes**: The node function inner catches (graceful-degradation pattern) are correctly left without `recordException`/`setStatus` — they absorb errors and return fallback state, consistent with LangGraph's error accumulation design. The `gen_ai.usage.*` attributes are present in the final instrumented version (contrary to the agent notes from attempt 1 which said they were dropped); they use optional chaining throughout, satisfying CDQ-007. Early-exit paths in `technicalNode` and `dialogueNode` return within the span callback while `finally { span.end() }` still fires, correctly closing the span with the pre-try attributes intact.
