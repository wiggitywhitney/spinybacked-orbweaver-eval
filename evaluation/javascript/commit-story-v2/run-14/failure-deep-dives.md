# Failure Deep-Dives — Run-14

**Run-14 result**: 12 committed, 0 failed, 0 partial, 18 correct skips.

No file-level failures. No partial commits. Run-level observations documented below.

---

## Run-Level Observations

### Push Auth — STABLE

Fourth consecutive successful push:
- `GITHUB_TOKEN present=true`
- `urlChanged=true, path=token-swap` (URL swap mechanism fired)
- PR #65 created at https://github.com/wiggitywhitney/commit-story-v2/pull/65

### Checkpoint Failures — NONE

Zero checkpoint failures across all 30 files. This is the first run with no checkpoint failures.

- Run-13 checkpoint 1 root cause (null-guard: `!== undefined` vs `!= null`): **resolved** — summary-graph.js committed cleanly in 1 attempt with 6 spans.
- Run-13 checkpoint 2 root cause (Date-vs-string timestamp): **resolved** — journal-manager.js committed in 2 attempts with 2 spans.

The absence of cascade rollbacks is the direct consequence of the type-safety guidance fixes (#435, #436). The smart rollback fix (#437, #447) was also present but had no opportunity to demonstrate — there were no failures to roll back.

### Retry Files (5 files needed 2+ attempts)

| File | Attempts | Notes |
|------|----------|-------|
| src/generators/journal-graph.js | 3 | Large file; same retry count as runs 12–13. All 4 LLM-calling functions committed including summaryNode (first time). |
| src/managers/summary-manager.js | 3 | Large file; committed with 3 spans. Previously rolled back in run-13. |
| src/utils/journal-paths.js | 3 | Small file (1 span); same retry count as run-13. NDS-003 pattern conflict on import line. |
| src/managers/journal-manager.js | 2 | Committed with 2 spans; down from failure in run-13. |
| src/utils/summary-detector.js | 2 | Committed with 5 spans; same retry count as run-11/run-13. |

All retry files recovered on the final attempt. No file was abandoned.

### index.js — Persistent Instrumentation Block (Structural Gap)

`src/index.js` received 0 spans for the third consecutive run. In run-13 it was rolled back as checkpoint collateral; in run-14 the agent correctly identified the root cause:

> "Every significant exit path in the function calls `process.exit()` — including skip conditions, validation failures, and the happy-path success at the end. Adding `tracer.startActiveSpan()` around the body would cause the span to leak (never reach the `finally` block's `span.end()`) in every `process.exit()` path. CDQ-001 (Spans Closed) explicitly prohibits span instrumentation that cannot be cleanly closed."

This is correct agent reasoning. The file is categorized as a correct skip. However, `main()` is the application entry point and `handleSummarize()` is a primary dispatch function — both should have root spans per COV-001. The agent noted a `suggestedRefactors` entry (extraction pattern to move business logic out of `process.exit()` paths).

This is a structural gap in the target application, not an agent failure. The correct fix is a refactor to commit-story-v2 that makes `main()` instrumentable. That gap has existed since run-11 when it was first noted.
