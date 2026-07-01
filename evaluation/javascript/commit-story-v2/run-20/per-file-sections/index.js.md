### 12. src/index.js (1 span, 3 attempts)

`main()` is instrumented as the COV-001 process entry point with span name `commit_story.commands.main` (registered as a schema extension) and a single attribute `vcs.ref.head.revision` set from `commitRef`. This represents a regression from run-19: the attempt count jumped from 1 to 3 (due to NDS-003 failures on attempts 1–2 from the same JSON string serialization issue affecting `mcp/server.js` this run), and the instrumentation dropped the `commit_story.cli.subcommand` routing attribute that run-19 included, leaving only an input parameter attribute and triggering a COV-005 failure. The span name also changed from run-19's `commit_story.cli.main` to `commit_story.commands.main` — both are valid schema extensions, but the inconsistency suggests the agent is not stabilizing on a name across runs.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — committed output is clean; attempts 1–2 had NDS-003 failures (same JSON `\n` serialization issue that caused `mcp/server.js` to oscillate and fail this run); attempt 3 passed; no non-instrumentation lines modified in the committed version |
| NDS-004 | PASS — `main()` signature unchanged |
| NDS-005 | PASS — inner `try/catch` around `triggerAutoSummaries` (graceful-degradation; swallows errors and continues) preserved intact inside the `startActiveSpan` callback; no error recording added to that catch |
| NDS-006 | PASS — all JSDoc blocks, `/** Exit codes */` comment, and inline comments preserved |
| API-001 | PASS — `{ trace, SpanStatusCode }` imported from `@opentelemetry/api` only |
| COV-001 | PASS — `main()` is the process entry point and has a span |
| COV-003 | PASS — catch block calls `span.recordException(error)`, `span.setStatus({ code: SpanStatusCode.ERROR })`, and rethrows |
| COV-004 | PASS — `main()` is the sole async function requiring a span; `handleSummarize` (unexported, called only from within `main()`) is covered by RST-004; all sync helpers correctly excluded per RST-001 |
| COV-005 | FAIL — only `vcs.ref.head.revision = commitRef` is set; this is the primary input parameter; no output or state attribute is captured (e.g., saved journal path, generation error count, subcommand routing); run-19 included `commit_story.cli.subcommand` as a routing-state attribute, which passed COV-005; dropping it leaves only an input param, which does not satisfy the "at least one output or state attribute" requirement |
| RST-001 | PASS — `debug`, `parseArgs`, `showHelp`, `isGitRepository`, `isValidCommitRef`, `validateEnvironment`, `getPreviousCommitTime` are all sync and correctly excluded |
| RST-004 | PASS — `handleSummarize` is unexported and invoked only from within `main()`; RST-004 exemption applies |
| SCH-001 | PASS — `commit_story.commands.main` registered in `semconv/agent-extensions.yaml` on the instrument branch |
| SCH-002 | PASS — `vcs.ref.head.revision` is a registered OTel VCS attribute in `semconv/attributes.yaml` on main |
| SCH-003 | PASS — `vcs.ref.head.revision` is a string; `commitRef` always has a default value of `'HEAD'` so it is never null or undefined |
| CDQ-001 | KNOWN LIMITATION — `span.end()` is in `finally` and covers the normal return path, but multiple `process.exit()` calls on validation-failure branches (not-a-git-repo, invalid ref, invalid env, journal-only skip, empty merge skip) execute before `finally` runs, causing span leaks on those branches; consistent with runs 12–19 for this file; explicit `span.end()` before each `process.exit()` would fully close the span on those paths |
| CDQ-007 | PASS — `commitRef` has a default value of `'HEAD'` and is never null; no guarded setAttribute needed |

**Failures**: COV-005 — only the input parameter `vcs.ref.head.revision` is captured; no output or state attribute recorded; the routing-mode attribute (`commit_story.cli.subcommand`) present in run-19 was dropped, leaving the span with insufficient semantic content.

**Regression note**: 1 attempt (run-19) → 3 attempts (run-20). Attempts 1–2 failed NDS-003 due to the same JSON string serialization issue (`\n` escape sequences in output) that caused `mcp/server.js` to oscillate and fail outright this run. The index.js agent recovered on attempt 3 by simplifying the output, but at the cost of dropping the subcommand attribute. The NDS-003 + attempt-count regression is a systemic issue for this run, not specific to this file. The COV-005 regression is file-specific.
