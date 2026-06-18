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

### Prompt hygiene: two hardcoded commit-story-v2 values found in spiny-orb's agent prompt

During run-24 pre-run analysis, two target-specific values were found embedded directly in `src/agent/prompt.ts` — spiny-orb's general-purpose agent prompt. These contaminate eval signal because the agent may get things right due to repo-specific hints rather than the general guidance working. Neither was caught by CLAUDE.md rules, code review, or prior eval runs. These are spiny-orb team issues, not eval process issues.

**Finding 1 — SCH-003 rule (line 285): `diff_size` hardcoded in rule text, not in an `<examples>` block**

The SCH-003 rule (type mismatch for count/size attributes) contains this sentence inline:

```text
"A `diff_size` attribute represents a size — use `type: int`."
```

`diff_size` is a commit-story-v2-specific attribute name (`commit_story.git.diff_size`, which is not even in the Weaver registry — it's the attribute name derived from the target codebase). This sentence sits directly in the rule body, not wrapped in `<examples>` tags. The agent sees it as authoritative guidance, not an example. Effect: if the agent applies SCH-003 correctly to `diff_size`-related attributes in commit-story-v2, we cannot tell whether the general `*_size` → `type: int` pattern guidance is working or whether the agent is pattern-matching on the specific name it was told about.

Suggested fix for spiny-orb team: Replace `diff_size` with a neutral domain example (e.g., `payload_size`, `response_size`) or move the sentence into an `<examples>` block with a label indicating it's illustrative. The general guidance ("attributes named `*_size` or `*_count` should use `type: int`") is valid — only the specific commit-story-v2 attribute name is the problem.

**Finding 2 — Count-key disambiguation (line ~152): verbatim copy of commit_story.context.messages_count attribute brief**

The SCH-002 count-key semantic precision guidance contains:

```text
"A count key registered for 'messages collected from sessions' does NOT apply to 'raw journal entries being processed'"
```

"messages collected from sessions" is the exact brief of `commit_story.context.messages_count` from commit-story-v2's `semconv/attributes.yaml`. "Raw journal entries being processed" is also commit-story-v2 domain vocabulary (the `context-integrator.js` pipeline). This appears to have been written from a specific observation during a commit-story-v2 eval run, then embedded as if it's a universal rule. Effect: the agent has domain-specific disambiguation for a commit-story-v2 near-synonym scenario, which inflates SCH-002 scores on commit-story-v2 (the only eval target to date).

Suggested fix for spiny-orb team: Abstract the example to non-repo-specific domain vocabulary (e.g., "A key registered for 'items retrieved from cache' does NOT apply to 'items queued for processing'"), or move the commit-story-v2-specific sentence to an `<examples>` block clearly labeled as illustrative.

**Process observation**: Both instances survived all existing guardrails — CLAUDE.md rules about not hardcoding target-specific values, code review, and 20+ eval runs with no signal that the guidance was too specific. This suggests the contamination is subtle enough to not register as a violation while still being repo-specific. A future eval quality check could diff the prompt against each target's registry to flag attribute names that appear in rule text (not example blocks).

## Run-24 Execution Notes

*(populate during evaluation run and per-file evaluation)*

### D-2 per-file evaluation: do 5 files at a time, clear context between batches

The run-24 D-2 evaluation spawned all 15 agents at once. A context compaction happened between when the agents returned their results and when the section files were written to disk. The compaction summary was detailed enough to reconstruct the sections, but this is fragile — compaction is lossy and could drop the rule-level detail needed to write accurate tables.

**Process change for PRD #25**: spawn agents in batches of 5, write the section files immediately after each batch returns, then clear context before the next batch.

- Whitney does the clearing (not the AI), so the section files are confirmed on disk before the clear
- At the start of each new batch, run `ls per-file-sections/` to see what's done and pick the next 5
- Recommended groupings by pipeline area: `(collectors + integrators)`, `(generators)`, `(managers)`, `(commands + MCP)`, `(correct-skips batch)`

Root cause that would eliminate the problem entirely: agents being able to write files directly. If each D-2 agent wrote its own section file as it completed, the main context would never need to buffer the results. Flag this for spiny-orb eval infrastructure if Write tool access for subagents becomes available.

## Rubric Gaps or Clarifications Needed

*(populate during per-file evaluation)*
