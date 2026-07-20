### 6. mcp/tools/context-capture-tool.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS — `saveContext` (the sole async I/O function, wrapping `mkdir`+`appendFile`) is correctly instrumented via `startActiveSpan` with try/catch/finally, `recordException`, and `setStatus(ERROR)`. |
| COV-005 | PASS — span carries 2 domain attributes: `commit_story.journal.file_path` and `commit_story.journal.entry_date` (guarded with `isRecording()`). Both reuse existing schema keys rather than creating new ones, which is why `attributesCreated` reads 0 in the run summary — that figure counts new schema extensions, not attributes actually set on the span. The span is not attribute-empty. |
| RST-001 | PASS — `getContextPath`, `formatTimestamp`, `formatContextEntry` (sync helpers) and `registerContextCaptureTool` (sync registration) correctly left uninstrumented. |
| RST-004 | PASS (judgment call) — the anonymous async MCP tool handler was skipped on the theory that `@modelcontextprotocol/sdk`'s auto-instrumentation covers it, even though the agent's own notes confirm the SDK is referenced only in a JSDoc comment, not actually imported in this file. This is architecturally plausible (MCP servers typically import the SDK centrally, not per-tool-file) but the file itself provides no evidence the boundary is actually auto-instrumented. |
| SCH-001 | PASS — `commit_story.context.save_context` was declared as a `schemaExtension`, satisfying the registry-mismatch advisory's own remediation ("declare a new span as a schemaExtension"). |
| SCH-002 | PASS — agent explicitly checked against the existing `commit_story.context.gather_context_for_commit` span and correctly distinguished it as a different operation class (multi-source commit context gathering vs. daily-file entry append). |
| SCH-003 | PASS — reused existing schema attribute keys (`file_path`, `entry_date`) instead of minting new ones. |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS — attributes follow `commit_story.journal.*` dotted namespace. |
| CDQ-005 | PASS |
| CDQ-007 | ADVISORY — `commit_story.journal.file_path` stores the full relative path (`journal/context/YYYY-MM/YYYY-MM-DD.md`) rather than a basename, which the instrumentation report itself flags as a lower-severity CDQ-007 finding ("a raw filesystem path where a basename would be safer"). The `text` parameter was correctly excluded as unbounded/PII-risk content, so the rule isn't a clean fail — only the path form is flagged. |

**Failures**: None (one ADVISORY on CDQ-007 for raw path vs. basename).

**Datadog trace supplement**: Searched `service:commit-story @service.instance.id:79885399-4f70-41f7-8e8b-f29e5ca1bcf6` for `commit_story.context.save_context` — no matches (0 spans). A broader query on the same `service.instance.id` returned 26 spans, but all belong to `git.commit.sha: 8bea39229d24fc03910e3d9f27c99a65da816cac` on `vcs.ref.head.revision: HEAD`/`0b2c5474c7715e4cfde89caa4768acabd98423c6` — i.e., live dogfooding traffic from running commit-story-v2 on its own `main` branch (journal/summary generation spans like `commit_story.journal.save_journal_entry`, `generate_daily_summary`, etc.), not the run-26 instrument branch (`spiny-orb/instrument-1784302707982`) and not the `context-capture-tool.js` code path at all. No live corroboration is available for this file's span in this run.

**Declining richness trend note**: The decline reverses this run, but the run-summary's "0 attrs" figure is misleading taken at face value. Source inspection shows the span sets 2 domain attributes — `commit_story.journal.file_path` (direct read) and `commit_story.journal.entry_date` (guarded with `isRecording()`, derived from `now.toISOString().split('T')[0]`) — matching exactly the `entry_date`/`source`-like fields called out as the watch item. The "0 attrs" in run-summary.md reflects `attributesCreated` (new schema extensions), which is legitimately 0 since both attributes reuse pre-existing registry keys — it does not mean the span is attribute-empty. Actual richness (2 meaningful, non-PII, bounded attributes) is comparable to or better than run-24's reported 2, and the run-25 "0 attrs" data point should likely be re-examined the same way before treating the trend as a genuine 3→2→0 decline.
