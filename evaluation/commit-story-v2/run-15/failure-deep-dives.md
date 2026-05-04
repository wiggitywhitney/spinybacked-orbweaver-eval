# Failure Deep-Dives — Run-15

**Run-15 result**: 14 committed, 0 failed, 0 partial, 16 correct skips.

No file-level failures. No partial commits. Run-level observations documented below.

---

## Run-Level Observations

### Push Auth — STABLE

Fifth consecutive successful push:
- `GITHUB_TOKEN present=true`
- `urlChanged=true, path=token-swap` (URL swap mechanism fired)
- PR #66 created at https://github.com/wiggitywhitney/commit-story-v2/pull/66

### PROGRESS.md Prompt and Push Failure

spiny-orb's orchestrator includes a PROGRESS.md check as part of its pre-push flow. After the run completed, the orchestrator prompted:

```text
=== PROGRESS.md Update Required ===
Branch has no PROGRESS.md changes vs origin/main.
Options: [a]ccept  [e]dit  [s]kip (bypass this push only):
```

Whitney pressed 's' (skip). The push then "failed" from spiny-orb's perspective — the terminal showed "Push failed — skipping PR creation." spiny-orb proceeded to run its internal CodeRabbit CLI review (9 findings, see below), then attempted a second push, which failed because the branch had already been pushed manually (`remote rejected: reference already exists`). Total run elapsed: **2h 7m 12.9s** (instrumentation: ~81min; PROGRESS.md prompt + CodeRabbit review: ~46min additional).

PR #66 was created manually. No evaluation data was lost.

**Action**: Record as an advisory finding — pressing 's' on the PROGRESS.md check causes the push to fail in spiny-orb's orchestrator. Document whether 's' is intended to block or bypass-and-continue.

### spiny-orb Internal CodeRabbit Review — 9 Findings

spiny-orb ran its own CodeRabbit CLI review as part of the post-push flow. 9 findings were returned. Key findings for evaluation:

**summary-detector.js — getDaysWithEntries and getDaysWithDailySummaries: try/finally without catch**
Both functions have spans wrapped in try/finally with no outer catch block. Unexpected errors (non-ENOENT) pass through unrecorded. CodeRabbit notes that `findUnsummarizedDays` (in the same file) does record exceptions — inconsistency within the file. This may be a CDQ-003/COV-003 issue to assess during per-file evaluation.

**index.js — process.exit() inside span prevents span.end()**
Multiple `process.exit()` calls inside the `startActiveSpan` callback bypass the `finally` block. The agent explicitly documented this as a "Known limitation" in its notes. CodeRabbit flagged it as a structural issue worth addressing. Assess in per-file evaluation.

**SCH-001 advisory messages use "the existing name" placeholder**
Several SCH-001 advisories in the PR summary and instrumentation reports say "reuse 'the existing name'" without naming the specific conflicting span. This is a spiny-orb orchestrator issue with how SCH-001's semantic duplicate detection formats its output message. Advisory finding for the spiny-orb team.

***.instrumentation.md files being committed**
CodeRabbit flagged that auto-generated instrumentation reports shouldn't be in version control. This is a deliberate spiny-orb design choice (the files document agent reasoning). Advisory — spiny-orb team decides.

### reflection-tool.js — 2 Attempts, 0 Spans (Anomalous)

`src/mcp/tools/reflection-tool.js` was classified as a correct skip (0 spans) but took 2 attempts and generated 3.6K output tokens. The agent notes say: "All exported functions are synchronous (registerReflectionTool) — no async I/O to trace. No LLM call made."

This is contradictory — 3.6K output tokens with "No LLM call made" suggests attempt 1 generated some instrumentation that was rejected by the validator, and attempt 2 correctly concluded no spans were needed. The pre-scan early-exit did not fire (files that trigger the pre-scan exit show "0.0K output"). The file appears to contain `saveReflection` (an async function) that the PR advisory flagged with COV-004, which may have prompted the first instrumentation attempt.

Net result: no impact on committed output. Adds minor cost (~$0.01). The `saveReflection` COV-004 advisory from the PR summary correctly identifies that this function was not instrumented.

### journal-graph.js — 1 Attempt (Streak Broken)

Runs 12, 13, 14 all required 3 attempts on journal-graph.js at ~$1.50/run. Run-15: 1 attempt at $0.56. No specific fix was applied to address the retry cause — the improvement may be attributable to:
- The `--thinking` flag enabling better upfront reasoning
- The `fix/724-attribute-namespace` attribute namespace guidance reducing validator rejection on attribute names
- LLM variation

Root cause of prior 3-attempt pattern remains uninvestigated (RUN12-4). This is a happy surprise, not a confirmed fix.

### summary-manager.js — COV-004 Resolved After 3 Consecutive Failures

Runs 12, 13, 14 all saw summary-manager.js commit with 3 spans (ratio-backstop heuristic). Run-15: 9 spans, 1 attempt, COV-004 passes. The strengthened COV-004 advisory message from PRD #483 M2 ("Add a span wrapping this function's body" replacing "Consider adding a span") appears to have been effective. The agent no longer invoked the ratio-backstop heuristic.

### 2 New Files Committed vs Run-14

`src/mcp/server.js` (1 span) and `src/mcp/tools/context-capture-tool.js` (1 span) were committed for the first time. These cover MCP server startup and context capture I/O. Both were likely correct skips in prior runs — the pre-scan may have classified them differently this time, or they previously committed as 0-span files that the current run correctly identifies as instrumentable.

### Cost Increase: $6.44 vs $5.59 (Run-14)

| Driver | Impact |
|--------|--------|
| 2 additional files committed (mcp/server.js, context-capture-tool.js) | +~$0.28 |
| journal-manager.js high token count (59.7K output, 1 attempt) | +~$0.61 vs run-14 estimate |
| summary-manager.js now committing 9 spans (71.8K output, 1 attempt) | new cost this run |
| journal-graph.js improvement (3 attempts → 1 attempt) | -$0.96 vs run-14 |
| Net | +$0.85 |

journal-manager.js at $1.00 for 2 spans in 1 attempt is the highest per-span cost of the run (~$0.50/span). The file's 59.7K output tokens suggests large context or complex reasoning. Worth monitoring in run-16.

### Retry Files (2 files needed 2 attempts)

| File | Attempts | Known/suspected cause |
|------|----------|-----------------------|
| summary-graph.js | 2 | Attribute key dedup (registered equivalents found on attempt 2) |
| mcp/tools/reflection-tool.js | 2 | Attempted instrumentation on first pass; correct skip on second |

No 3-attempt files this run (run-14 had journal-graph.js and summary-manager.js at 3 attempts each).
