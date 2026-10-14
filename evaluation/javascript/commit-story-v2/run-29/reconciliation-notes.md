# Reconciliation Queue — Run-29 Per-File Evaluation

Working notes for the cross-file reconciliation pass. Each item is a verdict disagreement or a cross-file check that the per-file agents could not settle alone. Items are resolved in the reconciliation pass and the decision goes into `exemption-scope.md`.

## Open after batch 1 (sections 01–05)

1. **COV-006 for a span that wraps a call an auto-instrumentation library covers.** `claude-collector.js` scored PASS (node `fs` sync calls), and `journal-graph.js` scored PASS (`@traceloop/instrumentation-langchain`). `context-integrator.js` and `git-collector.js` scored N/A. Decide whether fs sync calls count as "covered by an auto-instrumentation library" for this target (is `@opentelemetry/instrumentation-fs` registered anywhere in commit-story-v2?). Traceloop is registered (`src/traceloop-init.js`), so journal-graph's PASS follows release-it run-5 item 12.
2. **SCH-002 on `commit_story.context.messages_count` in `context-integrator.js` (line 65).** It holds `filteredMessages.length`, the same value as `commit_story.filter.messages_after` (line 64). The agent passed it under the generic-reasonable-term test. Its brief says "Total number of messages collected from sessions", and `claude-collector.js` line 235 sets the same key to the pre-filter `allMessages.length`. The same key holds two different counts in one trace. Apply the specific-wrong-noun test across both files.
3. **Fabricated `?? 0` / `?? ''` fallbacks** (`journal-graph.js`). They are recorded as unrubriced findings with an advisory on the CDQ-007 row. Check whether later files use the same pattern and score them the same way.
4. **`has_previous_commit` set on two spans in one trace** (`git-collector.js` line 140, `context-integrator.js` line 46). This is an observation only. Confirm that no rule applies.
