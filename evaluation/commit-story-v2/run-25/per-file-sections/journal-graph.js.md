### generators/journal-graph.js (4 spans, ×2)

**Spans**: `commit_story.journal.summary_node`, `commit_story.journal.technical_node`, `commit_story.journal.dialogue_node`, `commit_story.journal.generate_sections`

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | **PASS** | Attempt 1 introduced a spurious `}` in the `formatChatMessages` template literal — fixed in attempt 2; committed code is exact match to original |
| API-001 | **PASS** | `@opentelemetry/api` only; no SDK imports |
| NDS-006 | **PASS** | `generate_sections` outer catch calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrow; node-function catches are NDS-007 graceful degradation |
| NDS-004 | **PASS** | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | **PASS** | Three node-function catches (`summaryNode`, `technicalNode`, `dialogueNode`) return graceful error state objects without rethrowing — `recordException`/`setStatus` correctly absent per NDS-007 |
| COV-001 | **PASS** | `generateJournalSections` is the exported async entry point; `summaryNode`, `technicalNode`, `dialogueNode` are exported (called by LangGraph runtime) — all 4 async functions have spans |
| COV-003 | **PASS** | `generate_sections` catch records and rethrows; node-function catches are NDS-007 paths (no rethrow expected) |
| COV-004 | **PASS** | All 4 exported async functions instrumented; `getModel`, `resetModel`, and all synchronous helpers (`analyzeCommitContent`, `hasFunctionalCode`, `formatSessionsForAI`, etc.) correctly skipped per RST-001 |
| COV-005 | **PASS** | Each node span carries `commit_story.ai.section_type`, `gen_ai.operation.name`, `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.request.temperature`, `gen_ai.request.max_tokens`; `generate_sections` carries `vcs.ref.head.revision` and `commit_story.journal.sections` |
| COV-006 | **PASS** | Manual node spans wrap the entire node body including `model.invoke()` (auto-instrumented by LangChain); outer `startActiveSpan` is the parent of any LangChain child spans |
| RST-001 | **PASS** | All synchronous helpers skipped |
| RST-004 | **PASS** | `getGraph` (unexported, synchronous) covered by `generate_sections` span |
| SCH-001 | **PASS** | All 4 span names registered in `agent-extensions.yaml` as new extensions this run |
| SCH-002 | **PASS** | All attributes pre-registered in base schema — zero new attribute keys added (`gen_ai.*` are OTel semconv; `commit_story.ai.section_type`, `vcs.ref.head.revision`, `commit_story.journal.sections` from `attributes.yaml`) |
| SCH-003 | **PASS** | Section type as string constant; temperature from `NODE_TEMPERATURES?.summary/technical/dialogue` (numeric); max_tokens as integer literal; span name list as array; commit shortHash via `?? ''` fallback |
| CDQ-001 | **PASS** | `finally { span.end() }` on all 4 spans |
| CDQ-002 | **PASS** | No unnecessary span nesting |
| CDQ-003 | **PASS** | No PII in attributes |
| CDQ-005 | **PASS** | No empty catch blocks; node-function catches return structured fallback state objects |
| CDQ-007 | **PASS** | Attempt 1 set `NODE_TEMPERATURES.summary` without optional chaining (CDQ-007 failure); attempt 2 corrected to `NODE_TEMPERATURES?.summary` — module-level const cannot be null but validator requires the guard; committed code complies |

**Failures**: None

**Trace supplement**: Trace data reflects **run-24 instrumentation** (`spiny-orb/instrument-1781811083418`, SHA `bb08c9c`) from an organic journal-entry generation run on 2026-06-19. Run-25 has not yet been organically invoked on its instrument branch. Querying `service:commit-story @service.instance.id:bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3 resource_name:commit_story.journal.*`: run-24 node span names were `generate_summary`, `generate_technical`, `generate_dialogue` — run-25 names differ (see coverage delta below). The `generate_sections` top-level span and the three section-generation spans all confirmed with `status: ok` in the run-24 organic run.

**COV-006 assessment**: `summaryNode`, `technicalNode`, and `dialogueNode` each use `tracer.startActiveSpan(...)` to wrap the entire node body, which includes `model.invoke()`. The LangChain auto-instrumentation creates child spans under the active span context, making the manually created span the parent of any LangChain child spans. COV-006 passes.

**Coverage delta observation vs run-24**: Span names for node functions changed — run-24 used `generate_summary`, `generate_technical`, `generate_dialogue`; run-25 uses `summary_node`, `technical_node`, `dialogue_node`. Additionally, run-25 drops `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens` from node spans entirely (run-24 had them guarded with `!= null`). COV-005 still passes (other domain attributes remain), but token-cost observability is absent from node spans. Worth noting for future runs — these attributes are registered in the schema and would improve LLM cost tracing.
