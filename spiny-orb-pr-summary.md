## Summary

- **Files processed**: 29
- **Committed**: 12
- **Correct skips**: 16
- **Partial**: 1

## Per-File Results

| File | Status | Spans | Attempts | Cost | Libraries | Schema Extensions |
|------|--------|-------|----------|------|-----------|-------------------|
| src/collectors/claude-collector.js | success | 1 | 1 | $0.12 | — | `span.commit_story.context.collect_chat_messages` |
| src/collectors/git-collector.js | success | 2 | 1 | $0.12 | — | `span.commit_story.git.get_commit_data`, `span.commit_story.git.get_previous_commit_time` |
| src/commands/summarize.js | success | 3 | 1 | $0.20 | — | `span.commit_story.summarize.run_summarize`, `span.commit_story.summarize.run_weekly_summarize`, `span.commit_story.summarize.run_monthly_summarize`, `commit_story.summarize.dates_count`, `commit_story.summarize.weeks_count`, `commit_story.summarize.months_count`, `commit_story.summarize.force`, `commit_story.summarize.generated_count`, `commit_story.summarize.failed_count` |
| src/generators/journal-graph.js | partial (12/12 functions) | 3 | 3 | $1.45 | `@traceloop/instrumentation-langchain` | `span.commit_story.ai.generate_technical_decisions`, `span.commit_story.ai.extract_dialogue`, `span.commit_story.journal.generate_sections` |
| src/generators/summary-graph.js | success | 3 | 1 | $0.23 | `@traceloop/instrumentation-langchain` | `span.commit_story.summary.generate_daily`, `span.commit_story.summary.generate_weekly`, `span.commit_story.summary.generate_monthly`, `commit_story.summary.week_label`, `commit_story.summary.month_label` |
| src/index.js | success | 1 | 1 | $0.21 | — | `span.commit_story.cli.run`, `commit_story.cli.subcommand` |
| src/integrators/context-integrator.js | success | 1 | 1 | $0.16 | — | `span.commit_story.context.gather_for_commit` |
| src/managers/auto-summarize.js | success | 3 | 1 | $0.17 | — | `span.commit_story.summarize.trigger_auto_summaries`, `span.commit_story.summarize.trigger_auto_weekly_summaries`, `span.commit_story.summarize.trigger_auto_monthly_summaries` |
| src/managers/journal-manager.js | success | 2 | 1 | $0.20 | — | `span.commit_story.journal.save_entry`, `span.commit_story.journal.discover_reflections`, `commit_story.journal.reflections_count` |
| src/managers/summary-manager.js | success | 3 | 1 | $0.31 | — | `span.commit_story.summary.generate_and_save_daily`, `span.commit_story.summary.generate_and_save_weekly`, `span.commit_story.summary.generate_and_save_monthly` |
| src/mcp/server.js | success | 1 | 1 | $0.11 | `@traceloop/instrumentation-mcp` | `span.commit_story.mcp.start`, `commit_story.mcp.server_name` |
| src/utils/journal-paths.js | success | 1 | 1 | $0.06 | — | `span.commit_story.journal.ensure_directory` |
| src/utils/summary-detector.js | success | 5 | 2 | $0.42 | — | `span.commit_story.summary.get_days_with_entries`, `span.commit_story.summary.find_unsummarized_days`, `span.commit_story.summary.get_days_with_daily_summaries`, `span.commit_story.summary.find_unsummarized_weeks`, `span.commit_story.summary.find_unsummarized_months` |

**Correct skips** (16 files, 0 spans): src/generators/prompts/guidelines/accessibility.js, src/generators/prompts/guidelines/anti-hallucination.js, src/generators/prompts/guidelines/index.js, src/generators/prompts/sections/daily-summary-prompt.js, src/generators/prompts/sections/dialogue-prompt.js, src/generators/prompts/sections/monthly-summary-prompt.js, src/generators/prompts/sections/summary-prompt.js, src/generators/prompts/sections/technical-decisions-prompt.js, src/generators/prompts/sections/weekly-summary-prompt.js, src/integrators/filters/message-filter.js, src/integrators/filters/sensitive-filter.js, src/integrators/filters/token-filter.js, src/mcp/tools/context-capture-tool.js, src/mcp/tools/reflection-tool.js, src/utils/commit-analyzer.js, src/utils/config.js

## Span Category Breakdown

| File | External Calls | Schema-Defined | Service Entry Points | Total Functions |
|------|---------------|----------------|---------------------|-----------------|
| src/collectors/claude-collector.js | 0 | 0 | 1 | 8 |
| src/collectors/git-collector.js | 0 | 0 | 2 | 6 |
| src/commands/summarize.js | 0 | 0 | 3 | 9 |
| src/generators/prompts/guidelines/accessibility.js | 0 | 0 | 0 | 0 |
| src/generators/prompts/guidelines/anti-hallucination.js | 0 | 0 | 0 | 0 |
| src/generators/prompts/sections/dialogue-prompt.js | 0 | 0 | 0 | 0 |
| src/generators/prompts/sections/technical-decisions-prompt.js | 0 | 0 | 0 | 0 |
| src/generators/summary-graph.js | 0 | 0 | 3 | 23 |
| src/index.js | 0 | 0 | 1 | 9 |
| src/integrators/context-integrator.js | 0 | 0 | 1 | 3 |
| src/managers/auto-summarize.js | 0 | 0 | 3 | 4 |
| src/managers/journal-manager.js | 0 | 0 | 2 | 12 |
| src/managers/summary-manager.js | 0 | 0 | 3 | 14 |
| src/mcp/server.js | 0 | 0 | 1 | 2 |
| src/utils/config.js | 0 | 0 | 0 | 0 |
| src/utils/journal-paths.js | 0 | 0 | 1 | 12 |
| src/utils/summary-detector.js | 0 | 0 | 5 | 11 |

## Schema Changes

# Summary of Schema Changes
## Registry versions
Baseline: 0.1.0

Head: 0.1.0

## Registry Attributes
### Added
- commit_story.cli.subcommand
- commit_story.journal.reflections_count
- commit_story.mcp.server_name
- commit_story.summarize.dates_count
- commit_story.summarize.failed_count
- commit_story.summarize.force
- commit_story.summarize.generated_count
- commit_story.summarize.months_count
- commit_story.summarize.weeks_count
- commit_story.summary.month_label
- commit_story.summary.week_label




## Review Attention

- **src/utils/summary-detector.js**: 5 spans added (average: 2) — outlier, review recommended

### Advisory Findings

- **CDQ-006 (isRecording Guard)** (src/collectors/claude-collector.js): setAttribute value "previousCommitTime.toISOString()" at line 196 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/collectors/claude-collector.js): setAttribute value "commitTime.toISOString()" at line 197 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/collectors/git-collector.js): setAttribute value "metadata.timestamp.toISOString()" at line 159 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **SCH-004 (No Redundant Schema Entries)** (src/commands/summarize.js): Attribute key "commit_story.summarize.generated_count" at line 260 appears to be a semantic duplicate of an existing registry entry (judge confidence: 85%). Use 'gen_ai.usage.output_tokens' instead, as 'commit_story.summarize.generated_count' semantically represents the count of tokens generated during the summarization operation, which is equivalent to tracking output tokens in a generative AI context.
- **COV-004 (Async Operation Spans)** (src/generators/journal-graph.js): "buildGraph" (I/O library calls) at line 583 has no span. Async functions, await expressions, and I/O library calls benefit from spans for latency tracking and error visibility. Consider adding a span.
- **COV-004 (Async Operation Spans)** (src/generators/prompts/sections/daily-summary-prompt.js): "dailySummaryPrompt" (I/O library calls) at line 10 has no span. Async functions, await expressions, and I/O library calls benefit from spans for latency tracking and error visibility. Consider adding a span.
- **COV-004 (Async Operation Spans)** (src/generators/prompts/sections/monthly-summary-prompt.js): "monthlySummaryPrompt" (I/O library calls) at line 10 has no span. Async functions, await expressions, and I/O library calls benefit from spans for latency tracking and error visibility. Consider adding a span.
- **COV-004 (Async Operation Spans)** (src/generators/prompts/sections/weekly-summary-prompt.js): "weeklySummaryPrompt" (I/O library calls) at line 10 has no span. Async functions, await expressions, and I/O library calls benefit from spans for latency tracking and error visibility. Consider adding a span.
- **CDQ-006 (isRecording Guard)** (src/generators/summary-graph.js): setAttribute value "String(entries?.length ?? 0)" at line 245 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/generators/summary-graph.js): setAttribute value "String(dailySummaries?.length ?? 0)" at line 447 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/generators/summary-graph.js): setAttribute value "String(weeklySummaries?.length ?? 0)" at line 654 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **SCH-004 (No Redundant Schema Entries)** (src/generators/summary-graph.js): Attribute key "commit_story.summary.week_label" at line 446 appears to be a semantic duplicate of an existing registry entry (judge confidence: 85%). Use the registered attribute key 'commit_story.summarize.weeks_count' instead of 'commit_story.summary.week_label'. Both capture week-related summary metadata; the registry uses 'summarize' as the standard namespace for summary operations and 'weeks_count' is the semantic equivalent for week-level aggregation data.
- **SCH-004 (No Redundant Schema Entries)** (src/generators/summary-graph.js): Attribute key "commit_story.summary.month_label" at line 653 appears to be a semantic duplicate of an existing registry entry (judge confidence: 78%). Use 'commit_story.summarize.months_count' instead. The attribute 'commit_story.summary.month_label' appears to be a semantic duplicate capturing month-related summary data, which is already represented by the registered key 'commit_story.summarize.months_count'. Align the naming pattern to use 'summarize' (not 'summary') and the established structure for count-based metrics.
- **NDS-005 (Control Flow Preserved)** (src/index.js): NDS-005: Original try/catch block (line 489) is missing from instrumented output. Instrumentation must preserve existing error handling structure — do not remove or merge try/catch/finally blocks. Judge assessment (confidence 95%): semantics not preserved. Restore the original try/catch/finally block structure from line 489. Ensure all exception types caught in the original code are preserved in the same order, and verify that any re-throw statements or exception propagation logic are maintained exactly as written. If instrumentation code must be added, nest it within the existing catch/finally blocks rather than restructuring them.
- **CDQ-006 (isRecording Guard)** (src/integrators/context-integrator.js): setAttribute value "commitData.timestamp.toISOString()" at line 47 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/integrators/context-integrator.js): setAttribute value "context.metadata.timeWindow.start.toISOS..." at line 111 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/integrators/context-integrator.js): setAttribute value "context.metadata.timeWindow.end.toISOStr..." at line 112 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **COV-004 (Async Operation Spans)** (src/integrators/filters/message-filter.js): "filterMessages" (I/O library calls) at line 206 has no span. Async functions, await expressions, and I/O library calls benefit from spans for latency tracking and error visibility. Consider adding a span.
- **COV-004 (Async Operation Spans)** (src/integrators/filters/sensitive-filter.js): "redactMessages" (I/O library calls) at line 163 has no span. Async functions, await expressions, and I/O library calls benefit from spans for latency tracking and error visibility. Consider adding a span.
- **COV-004 (Async Operation Spans)** (src/integrators/filters/sensitive-filter.js): "applySensitiveFilter" (I/O library calls) at line 200 has no span. Async functions, await expressions, and I/O library calls benefit from spans for latency tracking and error visibility. Consider adding a span.
- **CDQ-006 (isRecording Guard)** (src/managers/auto-summarize.js): setAttribute value "String(unsummarizedDays.length)" at line 29 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/auto-summarize.js): setAttribute value "String(result.generated.length)" at line 78 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/auto-summarize.js): setAttribute value "String(result.failed.length)" at line 79 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/auto-summarize.js): setAttribute value "String(finalResult.generated.length)" at line 96 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/auto-summarize.js): setAttribute value "String(finalResult.failed.length)" at line 97 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/auto-summarize.js): setAttribute value "String(unsummarizedWeeks.length)" at line 124 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/auto-summarize.js): setAttribute value "String(result.generated.length)" at line 160 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/auto-summarize.js): setAttribute value "String(result.failed.length)" at line 161 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/auto-summarize.js): setAttribute value "String(unsummarizedMonths.length)" at line 188 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/auto-summarize.js): setAttribute value "String(result.generated.length)" at line 224 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/auto-summarize.js): setAttribute value "String(result.failed.length)" at line 225 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/journal-manager.js): setAttribute value "commit.timestamp.toISOString().slice(0, ..." at line 187 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/journal-manager.js): setAttribute value "startTime.toISOString()" at line 348 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/managers/journal-manager.js): setAttribute value "endTime.toISOString()" at line 349 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **SCH-004 (No Redundant Schema Entries)** (src/managers/journal-manager.js): Attribute key "commit_story.journal.reflections_count" at line 415 may be redundant with registry entry "commit_story.journal.quotes_count" (67% token overlap). Consider using the existing registry attribute instead of creating a new one.
- **COV-004 (Async Operation Spans)** (src/mcp/tools/context-capture-tool.js): "saveContext" (async function) at line 69 has no span. Async functions, await expressions, and I/O library calls benefit from spans for latency tracking and error visibility. Consider adding a span.
- **COV-004 (Async Operation Spans)** (src/mcp/tools/context-capture-tool.js): "registerContextCaptureTool" (contains await) at line 87 has no span. Async functions, await expressions, and I/O library calls benefit from spans for latency tracking and error visibility. Consider adding a span.
- **COV-004 (Async Operation Spans)** (src/mcp/tools/reflection-tool.js): "saveReflection" (async function) at line 65 has no span. Async functions, await expressions, and I/O library calls benefit from spans for latency tracking and error visibility. Consider adding a span.
- **COV-004 (Async Operation Spans)** (src/mcp/tools/reflection-tool.js): "registerReflectionTool" (contains await) at line 83 has no span. Async functions, await expressions, and I/O library calls benefit from spans for latency tracking and error visibility. Consider adding a span.
- **CDQ-006 (isRecording Guard)** (src/utils/summary-detector.js): setAttribute value "String(dates.length)" at line 94 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/utils/summary-detector.js): setAttribute value "String(result.length)" at line 156 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/utils/summary-detector.js): setAttribute value "String(dates.length)" at line 218 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/utils/summary-detector.js): setAttribute value "String(unsummarized.length)" at line 268 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-006 (isRecording Guard)** (src/utils/summary-detector.js): setAttribute value "String(unsummarized.length)" at line 381 has an expensive computation without span.isRecording() guard. Wrap expensive attribute computations in an if (span.isRecording()) check to avoid unnecessary computation when the span is not being sampled.
- **CDQ-008 (Tracer Naming)** ((run-level)): All tracer names follow a consistent naming pattern.

## Agent Notes

**src/collectors/claude-collector.js**:
- collectChatMessages is the only exported async function and is instrumented as the service entry point. All other exports (getClaudeProjectsDir, encodeProjectPath, getClaudeProjectPath, findJSONLFiles, parseJSONLFile, filterMessages, groupBySession) are skipped: they are synchronous helpers or pure data transformations (RST-001, RST-003).
- The catch block inside parseJSONLFile for malformed JSON is an expected-condition catch (control flow / graceful skip of bad lines) and was intentionally left without recordException/setStatus per the error handling rules.
- The span name span.commit_story.context.collect_chat_messages is a schema extension — the registry defines attribute groups but no span groups, so all span names must be invented. This name follows the commit_story.<category>.<operation> convention required by the schema namespace.
- *... 2 more notes in reasoning report*

**src/collectors/git-collector.js**:
- runGit, getCommitMetadata, getCommitDiff, and getMergeInfo are all unexported internal helpers — skipped per RST-004. Their I/O becomes visible as child activity under the exported orchestrator spans via context propagation.
- For commit_story.commit.message, metadata.subject (the first line / subject line) was used rather than metadata.message (the full body), because the schema defines this attribute as 'The first line of the commit message'.
- Two new span names were invented under the commit_story.git namespace since no schema-defined spans exist for git data collection operations. These are reported as schemaExtensions.
- *... 1 more notes in reasoning report*

**src/commands/summarize.js**:
- The three exported async orchestrators (runSummarize, runWeeklySummarize, runMonthlySummarize) are instrumented as service entry points. Six other functions are skipped: isValidDate (unexported pure sync), isValidWeekString/isValidMonthString/expandDateRange/parseSummarizeArgs (exported pure sync data transforms/validators per RST-001), and showSummarizeHelp (exported sync console output with no I/O logic).
- The inner per-item catch blocks in all three loop bodies are expected-condition catches — errors are collected into result.failed and result.errors as part of normal operation, not propagated. OTel error recording (recordException + setStatus) is correctly omitted from these; only the outer unexpected-error catch gets OTel recording.
- commit_story.summarize.dates_count, weeks_count, months_count have no semantic match in the schema (the closest registered attribute commit_story.context.sessions_count/messages_count refers to Claude Code session collection, not summarize batch sizes). commit_story.summarize.force has no schema equivalent. commit_story.summarize.generated_count and failed_count have no schema equivalents (commit_story.journal.* attributes describe entry content, not operation outcome counts).
- *... 1 more notes in reasoning report*

**src/generators/journal-graph.js**:
- summaryNode, technicalNode, and dialogueNode are unexported by declaration but re-exported via the named export block at the bottom of the file, making them eligible for instrumentation per RST-004. They are async AI orchestration functions with high diagnostic value.
- LangChain auto-instrumentation (@traceloop/instrumentation-langchain) covers the underlying model.invoke() calls. The manual spans on the node functions and generateJournalSections provide the application-level orchestration context; AI API calls become child spans automatically.
- The catch blocks in the node functions return graceful error state objects rather than rethrowing. span.recordException + span.setStatus(ERROR) are still added because these catches handle real failures (AI API errors), not expected control flow like ENOENT or optional feature detection.
- *... 16 more notes in reasoning report*

**src/generators/summary-graph.js**:
- The three node functions (dailySummaryNode, weeklySummaryNode, monthlySummaryNode) were skipped per RST-004: they are called indirectly through LangGraph's graph.invoke(), and the exported generate* functions serve as the observable orchestrators. LangChainInstrumentation auto-instruments the LangGraph and model.invoke() calls as child spans.
- The catch blocks inside the node functions (dailySummaryNode, weeklySummaryNode, monthlySummaryNode) were not given recordException/setStatus because they are control-flow catches that return graceful error state objects rather than re-throwing — they represent expected degraded-mode behavior, not unexpected failures.
- commit_story.summary.week_label (new): No existing schema key captures an ISO week string identifier (e.g. '2026-W09'). The closest candidates — commit_story.journal.entry_date — are typed as YYYY-MM-DD and semantically describe a single day, not a week range. This new attribute identifies which week's summary is being generated.
- *... 2 more notes in reasoning report*

**src/index.js**:
- Only `main` was instrumented. All other functions (`debug`, `parseArgs`, `showHelp`, `isGitRepository`, `isValidCommitRef`, `validateEnvironment`, `getPreviousCommitTime`, `handleSummarize`) are unexported internal helpers — RST-004 applies. Their execution paths are covered by the root span on `main`.
- The span name `commit_story.cli.run` is a schema extension because no existing schema span matches the CLI entry-point orchestration role of `main`. The closest schema spans (`commit_story.journal.generate_sections`, `commit_story.summary.generate_daily`, etc.) are already claimed by other files and represent sub-operations, not the top-level CLI dispatch.
- The `commit_story.cli.subcommand` attribute is a schema extension with no registered equivalent — it captures which top-level command path was taken (`journal`, `summarize`, etc.), which is essential for filtering CLI traces by mode. No existing schema attribute covers CLI dispatch routing.
- *... 2 more notes in reasoning report*

**src/integrators/context-integrator.js**:
- formatContextForPrompt and getContextSummary are pure synchronous data transformations with no I/O — skipped per RST-001.
- gatherContextForCommit is the sole service entry point; the span name commit_story.context.gather_for_commit is invented because no schema-defined span matched this orchestration function. Reported as a schema extension.
- commitData.timestamp is a Date object; .toISOString() is called before setAttribute to satisfy the string type required by commit_story.commit.timestamp and the context time-window attributes — CDQ-007 compliance.
- *... 1 more notes in reasoning report*

**src/managers/auto-summarize.js**:
- All three schema-defined span names closest to these functions (run_summarize, run_weekly_summarize, run_monthly_summarize) were already declared by earlier files in this run, so new unique names were invented under the same namespace prefix: trigger_auto_summaries, trigger_auto_weekly_summaries, trigger_auto_monthly_summaries.
- The inner try/catch blocks inside each loop are control-flow catches — they accumulate failures into the result arrays and continue processing. These are expected-condition catches and do NOT receive recordException/setStatus, which would pollute error metrics for normal partial-failure scenarios.
- getErrorMessage is a pure synchronous helper under 5 lines — skipped per RST-001/RST-004.
- *... 2 more notes in reasoning report*

**src/managers/journal-manager.js**:
- formatJournalEntry and formatTimestamp are exported but are pure synchronous data transformations with no I/O — skipped per RST-001. They also call only pure helpers (extractFilesFromDiff, countDiffLines, formatReflectionsSection).
- The inner catch blocks in saveJournalEntry (ENOENT file-not-found) and discoverReflections (directory-not-found, file-unreadable) are expected-condition catches representing normal control flow — recordException/setStatus were not added to those blocks per the expected-condition catch guidance.
- commit_story.journal.reflections_count is a new schema extension — no registered key semantically matches 'count of reflections discovered across a time window'. commit_story.journal.quotes_count is scoped to quotes within a single journal entry, not a discovery result count. commit_story.context.messages_count is for chat messages, not reflections.
- *... 1 more notes in reasoning report*

**src/managers/summary-manager.js**:
- Schema-defined span names commit_story.summary.generate_daily, commit_story.summary.generate_weekly, and commit_story.summary.generate_monthly are already in use by earlier files in this run. New unique names generate_and_save_daily/weekly/monthly were invented to avoid collision; these are reported as schema extensions.
- readDayEntries, saveDailySummary, readWeekDailySummaries, saveWeeklySummary, readMonthWeeklySummaries, and saveMonthlySummary are all exported async I/O functions but are called exclusively from the three generateAndSave* orchestrators. Per RST-004, only the orchestrators are instrumented; the helpers' I/O is covered as child operations under the orchestrator span.
- formatDailySummary, formatWeeklySummary, formatMonthlySummary, getWeekBoundaries, and getMonthBoundaries are synchronous pure functions (no I/O, no async) — skipped per RST-001.
- *... 2 more notes in reasoning report*

**src/mcp/server.js**:
- createServer() is an unexported synchronous factory function — skipped per RST-003 (thin wrapper) and RST-004 (unexported). Its work is captured under the main() span via context propagation.
- main() is instrumented as the application entry point per COV-001 even though it is unexported — root span requirements override RST-004 thin-wrapper exclusions for entry functions.
- The span covers the startup phase only (until server.connect resolves and the function returns). The MCP server then runs indefinitely in the background; MCPInstrumentation covers protocol-level tool call spans from that point.
- *... 2 more notes in reasoning report*

**src/utils/journal-paths.js**:
- Only `ensureDirectory` was instrumented. All other 11 exported functions are pure synchronous data transformations (path construction, date formatting) with no I/O — RST-001 applies and they are skipped.
- The span name `commit_story.journal.ensure_directory` is a schema extension; no matching schema span existed. The `commit_story.journal.file_path` registered attribute was used to record the input path, satisfying COV-005.
- Functions like `getSummaryPath` and `getSummariesDirectory` throw synchronously on invalid cadence but are pure path-computation helpers with no async I/O — they were skipped per RST-001 despite having throw branches.

**src/utils/summary-detector.js**:
- NDS-003 fix: restored original single-line early returns (if (entryDays.length === 0) return []; etc.) instead of expanding them into multi-line blocks with setAttribute calls. Attributes are only set on the normal completion path.
- SCH-003 fix: commit_story.summarize.dates_count, weeks_count, and months_count are defined as type string in the schema, so values are now passed as String(count) instead of raw numbers.
- Five unexported functions (getTodayString, getNowDate, getSummarizedDays, getSummarizedWeeks, getSummarizedMonths, getWeeksWithWeeklySummaries) were skipped per RST-001/RST-004: they are either pure synchronous helpers or unexported async helpers whose I/O executes within the context of an exported orchestrator span.
- *... 1 more notes in reasoning report*

## Recommended Companion Packages

This project was detected as a library. The following auto-instrumentation packages were identified but not added as dependencies — they are SDK-level concerns that deployers should add to their application's telemetry setup.

- `@traceloop/instrumentation-langchain`
- `@traceloop/instrumentation-mcp`

## Token Usage

| | Ceiling | Actual |
|---|---------|--------|
| **Cost** | $67.86 | $4.00 |
| **Input tokens** | 2,900,000 | 103,493 |
| **Output tokens** | — | 166,909 |
| **Cache read tokens** | — | 344,884 |
| **Cache write tokens** | — | 287,631 |

Model: `claude-sonnet-4-6` | Files: 29 | Total file size: 206,581 bytes

## Live-Check Compliance

OK

## Agent Version

`0.1.0`