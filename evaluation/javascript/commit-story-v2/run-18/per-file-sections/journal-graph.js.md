### 4. generators/journal-graph.js (4 spans, 2 attempts)

This 629-line file exports four async functions (`summaryNode`, `technicalNode`, `dialogueNode`, `generateJournalSections`) and thirteen sync helpers or unexported utilities. The committed instrumentation places one span on each of the four async functions, correctly skipping all sync helpers per RST-001. This is the RUN17-2 regression file: in run-17 it FAILED with content corruption; in run-18 it committed successfully in 2 attempts.

**RUN17-2 fix verification — `formatChatMessages` content intact**: The function body is preserved verbatim in the instrumented version. The template literal `{"type":"${type}", "time":"${time}", "content":"${escapeForJson(msg.content)}"}` matches the original exactly. All closing braces are present and correctly placed. The reformatting of some multi-line expressions (e.g., the `changedFiles` filter, `cleanDialogueOutput` early return) follows the project's Prettier-compatible style without removing or reordering any logic lines. No corruption observed.

**Span placement**: `summaryNode` → `commit_story.ai.generate_summary`; `technicalNode` → `commit_story.ai.generate_technical_decisions`; `dialogueNode` → `commit_story.ai.generate_dialogue`; `generateJournalSections` → `commit_story.journal.generate_sections`. All four are declared schema extensions per the agent notes.

**COV-004 — exported async functions**: The four instrumented functions cover the full set of exported async functions (`summaryNode`, `technicalNode`, `dialogueNode` via the named export block; `generateJournalSections` via a direct `export` declaration). `getModel`, `resetModel`, and all cleanup/formatter helpers are synchronous; RST-001 applies correctly.

**Inner catch handling**: `summaryNode`, `technicalNode`, and `dialogueNode` each have a graceful-degradation inner catch that returns a fallback object rather than rethrowing. The Pattern B approach is used: the original try/catch is preserved inside the `startActiveSpan` callback, with a wrapping finally that closes the span. `generateJournalSections` is the only span that rethrows — it correctly calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing. COV-003 applies only to `generateJournalSections`; the three node functions' inner catches are original code (NDS-005), not new instrumentation catch blocks.

**Attribute notes**: `commit_story.ai.section_type` is a registered schema enum (`summary`, `dialogue`, `technical_decisions`); `gen_ai.operation.name` and `gen_ai.request.temperature` are registered OTel GenAI refs. `commit_story.journal.sections` (string array) used on `generateJournalSections` span is a registered schema key. `gen_ai.usage.input_tokens/output_tokens` appear only on `technicalNode` with a `!= null` guard on `result.usage_metadata` — correct CDQ-007 handling. `NODE_TEMPERATURES != null` guard in `dialogueNode` is technically unnecessary (module-level const), but harmless and does not produce undefined values.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — `formatChatMessages` function and all closing braces intact; no business logic lines removed or reordered; Prettier-style reformats of long expressions preserve all original statements |
| NDS-004 | PASS — all four async function signatures unchanged; no parameters added, removed, or reordered |
| NDS-005 | PASS — original graceful-degradation catch blocks in `summaryNode`, `technicalNode`, and `dialogueNode` preserved inside `startActiveSpan` callbacks; no original error handling removed |
| NDS-006 | PASS — all JSDoc blocks and inline comments preserved; none removed or altered |
| API-001 | PASS — only `@opentelemetry/api` imported (`trace`, `SpanStatusCode`); no SDK packages |
| COV-001 | PASS — all four exported async functions have entry-point spans |
| COV-003 | PASS — `generateJournalSections` catch calls `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, and `throw error`; the three node functions' inner catches are original graceful-degradation code (NDS-005), not new instrumentation catch blocks |
| COV-004 | PASS — all four exported async functions instrumented; 13 sync helpers and unexported functions correctly skipped per RST-001 |
| COV-005 | PASS — `commit_story.ai.section_type` (operation category), `gen_ai.operation.name`, `gen_ai.request.temperature` on node spans; `commit_story.journal.sections` array on `generateJournalSections` span; attributes reflect meaningful operation context |
| RST-001 | PASS — all sync helpers (`analyzeCommitContent`, `hasFunctionalCode`, `generateImplementationGuidance`, `formatSessionsForAI`, `formatChatMessages`, `escapeForJson`, `formatContextForSummary`, `formatContextForUser`, `cleanDialogueOutput`, `cleanTechnicalOutput`, `cleanSummaryOutput`, `buildGraph`, `getGraph`) and sync exports (`getModel`, `resetModel`) correctly skipped |
| RST-004 | PASS — no internal detail spans; unexported helpers have no spans |
| SCH-001 | PASS — all four span names follow `commit_story.<category>.<operation>` convention; declared as schema extensions per run log |
| SCH-002 | PASS — all attributes are registered schema keys or OTel GenAI refs; no unregistered keys used |
| SCH-003 | PASS — `section_type` string enum values match registered members; `gen_ai.request.temperature` is numeric; `commit_story.journal.sections` is a string array matching schema type `string[]` |
| CDQ-001 | PASS — `span.end()` in `finally` blocks on all four spans; no early-return paths that skip end |
| CDQ-002 | PASS — `startActiveSpan` callback pattern throughout; no manual context propagation |
| CDQ-003 | PASS — no redundant `span.end()` calls; single close in `finally` only on each span |
| CDQ-005 | PASS — `startActiveSpan` used with async callbacks; no double-end risk |
| CDQ-006 | PASS — no attribute values derived from raw message content or unbounded user input |
| CDQ-007 | PASS — `gen_ai.usage.input_tokens/output_tokens` guarded by `result.usage_metadata != null`; `NODE_TEMPERATURES != null` guard on `dialogueNode` temperature attribute is unnecessary but harmless; `commit_story.journal.sections` is a literal array constant, never nullable |

**Failures**: None. RUN17-2 content corruption confirmed resolved — `formatChatMessages` and all closing braces intact.
