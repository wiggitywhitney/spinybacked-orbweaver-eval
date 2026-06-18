# Lessons for PRD #25

Run-24 observations to carry forward into the next evaluation run PRD.

## Run-24 Key Findings

*(populate during per-file evaluation and actionable fix output)*

## Process Observations

### Pre-run verification

- **spiny-orb built from main, not feature branch**: `feature/965-observability-triangle-metrics` had zero `src/` changes vs main; confirmed main is correct build source per PRD spec. Always run `git diff main -- src/` to check before deciding.
- **Port 4318 conflict sequence matters**: Datadog Agent must be stopped first, then Collector started. If Agent is still running, Collector binds on a random port and silently drops traces. Check with `lsof -i :4318` before starting.
- **Datadog Agent was not auto-started**: `search_datadog_spans` returned 0 results on first attempt. Root cause: Datadog Agent was not running. Start it explicitly with `datadog-agent start` and wait ~5 seconds before querying. Do not assume Agent is running at session start.
- **Correct GitHub token is `GITHUB_TOKEN`, not `GITHUB_TOKEN_COMMIT_STORY`**: The commit-story-v2 push auth token is the generic `GITHUB_TOKEN` in `.vals.yaml`. `GITHUB_TOKEN_COMMIT_STORY` does not exist. Verify against `.vals.yaml` before dry-run.
- **Pre-run trace artifact requires extending time window**: Datadog `search_datadog_spans` defaults to a narrow window. Extend to `now-30d` when looking for the most recent run's spans to populate trace-artifact.md.
- **SCH-003 pre-run confirmation from run-23 trace**: `commit_story.summarize.monthly_summaries_generated: "0"` (string) observed in run-23 Datadog spans, confirming the bug is present on the run-23 branch going into run-24. `diff_size: 36391` (integer) was already correct. Run-24 prompt guidance targets: count/size `type: int` + `setAttribute` with raw numbers.
- **SPA-002 fix visible in instrumentation.js**: `examples/instrumentation.js` on commit-story-v2 main uses `SimpleSpanProcessor` + `shutdownAndExit` with `loggerProvider.forceFlush()` + `sdk.shutdown()` chain before `process.exit()`. Fix is in the target repo; spiny-orb must now recognize and follow this pattern instead of inserting a second forceFlush.
- **31 JS files vs PRD expectation of ~30**: One extra file is `src/logger.js` (added via PR #80, pino + OTLP log bridge). This is a new instrumentation candidate for run-24 — assess whether to instrument it or skip (likely RST-001 utility skip).

### Cross-run process review (Step 0.5)

- Template updated with two additions from taze run-15 (2026-06-16):
  - Step 5 scope now includes category (d): oscillation-induced 0-span commits misclassified as correct pre-scan skips
  - Step 2 now includes handoff triage subagent context guidance (richer context beyond actionable-fix-output.md)

## Run-24 Execution Notes

*(populate during evaluation run and per-file evaluation)*

## Rubric Gaps or Clarifications Needed

*(populate during per-file evaluation)*
