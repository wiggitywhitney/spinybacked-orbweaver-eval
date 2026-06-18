### generators/journal-graph.js (4 spans, 1 attempt)

> Seventh consecutive clean commit (runs 18, 19, 20, 21, [22 never ran], 23, 24).

**Spans**: `commit_story.journal.generate_summary`, `commit_story.journal.generate_technical`, `commit_story.journal.generate_dialogue`, `commit_story.journal.generate_sections`

**New attribute declarations**: 0 (all `gen_ai.*` attributes are pre-registered OTel GenAI semconv)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No `isRecording()` guards around `setAttribute`; all attribute assignments are unconditional |
| API-001 | PASS | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | PASS | `generateJournalSections` outer catch calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | PASS | Three graceful-degradation catches in `summaryNode`, `technicalNode`, `dialogueNode` correctly left unmodified — each returns a fallback error-state object (e.g., `{ summary: '[Summary generation failed: ...]', errors: [...] }`) without rethrowing; `recordException` NOT added to these catches per NDS-007 |
| COV-001 | PASS | `generateJournalSections` (sole exported async function) has entry-point span `commit_story.journal.generate_sections` |
| COV-003 | PASS | `generateJournalSections` outer catch records exception and sets ERROR status before rethrowing |
| COV-004 | PASS | All 4 instrumented functions are async; sync helpers (`getModel`, `resetModel`, `analyzeCommitContent`, `hasFunctionalCode`, all `format*`/`clean*`/`escape*`/`build*` functions) correctly skipped per RST-001; `getGraph` correctly skipped per RST-004 (covered by `generate_sections` span) |
| COV-005 | PASS | `generate_sections` sets `gen_ai.request.model` (string constant) and `commit_story.journal.sections` (filtered output array); node spans set `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `gen_ai.response.id` when available from `result.usage_metadata` |
| COV-006 | PASS | Manual spans on `summaryNode`, `technicalNode`, `dialogueNode`, and `generateJournalSections` wrap the application-level logic above the LangChain auto-instrumented `model.invoke()` calls; context propagation preserved |
| RST-001 | PASS | All synchronous data-transform and pure-computation helpers correctly skipped |
| RST-004 | PASS | `getGraph` (unexported) correctly exempted — execution path fully covered by the `generate_sections` span that calls it |
| SCH-001 | PASS | All 4 span names registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS | Zero new custom attributes declared; all `gen_ai.*` used are pre-registered OTel GenAI semconv constants |
| SCH-003 | PASS | `gen_ai.request.model` set as string constant `'claude-haiku-4-5-20251001'`; `gen_ai.usage.input_tokens` and `output_tokens` set as integers from `result.usage_metadata`; all guarded with `!= null` before access |
| CDQ-001 | PASS | All 4 spans use `finally { span.end() }` inside async `startActiveSpan` callbacks per issue #915 pattern; no redundant `span.end()` in try blocks |
| CDQ-002 | PASS | No unnecessary nested spans |
| CDQ-003 | PASS | No PII; attributes are model identifiers, token counts, and section text |
| CDQ-005 | PASS | No empty catch blocks; graceful-degradation catches return fallback state objects with error strings; outer catches rethrow after recording |
| CDQ-006 | PASS | `commit_story.journal.sections` uses `.filter(Boolean)` to remove falsy section values — CDQ-006 exemption applies because `generateJournalSections` is the COV-001 entry-point span |
| CDQ-007 | PASS | `gen_ai.usage.*` guarded with `result.usage_metadata != null` before access; `gen_ai.response.id` guarded similarly; `gen_ai.request.model` is a hard-coded string constant — no nullable-field risk |

**Failures**: None. 1 attempt (down from 3 in run-23).

**NDS-007 two-tier pattern**: The agent correctly applied the two-tier catch structure. Inner catches in each node function (`summaryNode`, `technicalNode`, `dialogueNode`) are graceful-degradation paths — they return error state objects rather than rethrowing, so `recordException` is not appropriate (the error is being handled, not propagated). The outer `generateJournalSections` catch handles unexpected propagated errors with full recording.

**CDQ-006 exemption**: `commit_story.journal.sections` uses `.filter(Boolean)` on the assembled sections array. CDQ-006 would ordinarily require an `isRecording()` guard for computed values, but the exemption for COV-001 entry-point spans applies — `generateJournalSections` is the exported orchestrator, and the section assembly is inherent to its purpose.

**Trace supplement**: All 4 spans confirmed in Datadog (2026-06-18T20:25:31Z):
- `commit_story.journal.generate_sections` — parent span; `gen_ai.request.model: claude-haiku-4-5-20251001`; `sections: ['summary']` (only summary section produced)
- `commit_story.journal.generate_summary` — `gen_ai.usage.input_tokens: 12745`, `gen_ai.usage.output_tokens: 161`; LLM call succeeded
- `commit_story.journal.generate_technical` — duration ~40ms, no `gen_ai.usage.*` — early exit (insufficient functional code context)
- `commit_story.journal.generate_dialogue` — duration ~51ms, no `gen_ai.usage.*` — early exit (insufficient context)

Parent-child relationships correct: both `generate_technical` and `generate_dialogue` are children of `generate_sections`, confirming correct span nesting.
