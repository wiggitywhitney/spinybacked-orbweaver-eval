// ABOUTME: Run-29 summary — results, provisional fix verification, file outcomes, and key findings.
spiny-orb commit: 475eb3d5d35d0e723d83f1abbca823277aea91ce
agent model: claude-opus-5-5
agent effort: medium

# Run-29 Summary

**Date**: 2026-10-13
**Started**: 2026-10-13T19:13:52.886Z
**Duration**: 45m 19.2s (per spiny-orb's own "Completed in" line)
**Branch**: `spiny-orb/instrument-1791918832887` (HEAD `860fcb1`)
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/98 (auto-created ✅)
**Exit status**: 1 (one file failed; the push and PR still completed)
**spiny-orb**: built in the detached worktree `~/Documents/Repositories/spinybacked-orbweaver-main` at `origin/main` `475eb3d` (D-7). The count-cast fix for #1072 and #1037 (spiny-orb PR #1097) is in the build (D-5). The agent model and effort come from `src/config/schema.ts` defaults at that commit; `commit-story-v2/spiny-orb.yaml` overrides neither.

A first launch from the wrong directory (the eval repo, 2026-10-13T19:12:32Z) failed spiny-orb's prerequisite check in 0.7s with exit status 2, before any file was processed. The log here is from the second launch, which overwrote it.

---

## Results

| Metric | Value |
|--------|-------|
| Files with a full commit | 12 |
| Files with a failed commit | 1 (`src/generators/summary-graph.js`) |
| Files partial | 1 (`src/index.js`) |
| Harness-labeled correct skips | 18 |
| Files seen | 32 |
| Spans (committed + partial) | 35 |
| New schema-extension attributes | 20 |
| Attempts (sum across files) | 47 |
| Files at 3 attempts | 5 |
| Model | claude-opus-5-5 (effort `medium`) |
| Tokens | 324.5K input / 263.9K output (899.1K cached) |
| Cost | $9.94 |
| Live-check | OK (570 spans, 5172 advisory findings), marked partial because `summary-graph.js` failed |

"Attributes" means new schema-extension attributes declared, as printed in each file's result line, not the number of `setAttribute` calls. Correct skips include `reflection-tool.js`, which ended with 0 spans after 2 attempts rather than through a pre-scan skip, as in runs 26–28; per-file evaluation decides whether that skip is correct.

---

## Comparison with Runs 26–28 (log-level)

| Run | Model | Committed | Partial | Failed | Correct skips | Spans | Attributes | Attempts | Files at 3 attempts | Cost |
|---|---|---|---|---|---|---|---|---|---|---|
| 26 | claude-sonnet-4-6 | 14 | 0 | 0 | 18 | 41 | 19 | 42 | 3 | $11.15 |
| 27 | claude-sonnet-4-6 | 13 | 1 | 0 | 18 | 49 | 14 | 40 | 2 | $9.40 |
| 28 | claude-sonnet-4-6 | 12 | 1 | 0 | 19 | 48 | 25 | 38 | 1 | $7.23 |
| 29 | claude-opus-5-5 | 12 | 1 | 1 | 18 | 35 | 20 | 47 | 5 | $9.94 |

Per D-4, dollar cost does not compare across the model change, and every difference that may come from the model is an observation to confirm, not a conclusion from one run. Runs 26–28 printed their model in the log's cost line, so this table's model column for them comes from the logs.

---

## File Outcomes (committed, partial, and failed)

| File | Result | Spans | Attributes | Attempts | run-28 (spans/attempts) | Notes |
|------|--------|-------|------------|----------|------------|-------|
| src/collectors/claude-collector.js | ✅ committed | 1 | 1 | 1 | 1 / 1 | New extension `commit_story.context.files_count`; agent notes say `repoPath` was left off as a path/PII value |
| src/collectors/git-collector.js | ✅ committed | 2 | 1 | 3 | 6 / 1 | Spans fell from 6 to 2, matching run-26 |
| src/integrators/context-integrator.js | ✅ committed | 1 | 0 | 3 | 1 / 1 | First 3-attempt result for this file in runs 26–29; agent thinking says it excluded author info as PII |
| src/generators/journal-graph.js | ✅ committed | 4 | 1 | 2 | 4 / 2 | Twelfth consecutive success |
| src/generators/summary-graph.js | ❌ **failed** | 0 | 0 | 3 | 6 / 1 | NDS-003 (Code Preserved) ×3 on `if (result.response_metadata?.model != null)` guards around `gen_ai.response.model`; see Key Findings |
| src/mcp/tools/context-capture-tool.js | ✅ committed | 1 | 1 | 1 | 0 / 2 | Back to a span after run-28's 0 |
| src/mcp/server.js | ✅ committed | 1 | 1 | 1 | 1 / 1 | Unchanged |
| src/utils/journal-paths.js | ✅ committed | 1 | 0 | 1 | 1 / 1 | Unchanged |
| src/managers/journal-manager.js | ✅ committed | 2 | 2 | 1 | 2 / 1 | Unchanged span count |
| src/managers/summary-manager.js | ✅ committed | 9 | 6 | 3 | 9 / 2 | All 9 spans; 6 new extensions (run-28: 1) |
| src/commands/summarize.js | ✅ committed | 3 | 1 | 2 | 3 / 3 (partial) | Full commit after run-28's partial |
| src/utils/summary-detector.js | ✅ committed | 5 | 1 | 2 | 9 / 1 | Spans fell from 9 to 5, matching run-26 |
| src/managers/auto-summarize.js | ✅ committed | 3 | 0 | 3 | 3 / 1 | Same spans, two more attempts |
| src/index.js | ⚠️ **partial** | 2 | 5 | 2 | 2 / 1 | Function-level fallback instrumented 2/2 functions; reassembly failed NDS-005 (Control Flow Preserved): "Original try/catch block is missing from instrumented output" |

The attempt counts for `summary-graph.js` come from its Agent thinking section (Attempts 1–3), because the ❌ result line does not print an attempt count.

---

## Fix Verification (provisional pending per-file evaluation)

Every row below is a log-based read. The log's Schema Extensions and Agent Notes sections describe new extensions and the agent's stated reasoning, not every `setAttribute` call on an existing key, so none of these rows can conclude "no recurrence." Per-file evaluation is the authoritative check.

| Item | Expected | Provisional result |
|------|----------|--------------------|
| RUN28-1 (CDQ-006, #1067): `summary-manager.js` isRecording guard consistency | Recur (#1067 open) | **Not determinable from the log.** The file committed 9 spans in 3 attempts; the log does not mention `isRecording`. |
| RUN28-2 (SCH-003, #1037): type mismatch in either direction | Count-cast pattern is now a fix check (D-5) | **Not determinable from the log.** No SCH-003 rejection appears in the log, which is also what run-28 showed while 14 mismatches shipped. |
| RUN28-3 (CDQ-007, #1068): sanitization fallback at all 7 `summary-manager.js` sites | Recur (#1068 open) | **Not determinable from the log.** No path-sanitization notes for this file appear in the log. |
| RUN28-4a (CDQ-007 PII, #1066): `commit_story.commit.author` raw | Recur (#1066 open) | **Possibly not recurring; unconfirmed.** `context-integrator.js`'s agent thinking says it excluded author info as PII, and no `commit.author` key appears in the log. `git-collector.js` gives no statement either way. |
| RUN28-4b (CDQ-007 severity, #1065) | Unexplained (#1065 open) | **Not determinable from the log.** No CDQ-007 blocking or advisory result appears in the log for the PII case. |
| journal-graph.js | Twelfth consecutive success | **✅ Confirmed**: committed, 4 spans, 2 attempts. |
| D-3 watch: `gen_ai.*` on LLM-wrapper spans | Watch item | `summary-graph.js` added `gen_ai.response.model` (not seen in run-28) and failed on its guard. `journal-graph.js` committed; its `gen_ai.*` attributes are checked in per-file evaluation. |

---

## Key Findings

### `summary-graph.js` failed on NDS-003 for guards that wrap only `setAttribute`

All three NDS-003 failures in the last attempt sit on the same shape, once per LLM node (daily, weekly, monthly), at lines 217, 462, and 707 of the debug dump:

```js
if (result.response_metadata?.model != null) {
  span.setAttribute('gen_ai.response.model', String(result.response_metadata.model));
}
```

The guard four lines above it, `if (result.usage_metadata != null) { span.setAttribute(...) }`, passed NDS-003 in the same file. The visible difference is the optional chaining in the condition. The working hypothesis is that NDS-003 recognizes `x != null` as an instrumentation guard but not `x?.y != null`, which would make this a validator false positive that discarded 6 spans. This is a single-run observation. The failure deep-dive must reproduce it against spiny-orb's `dist/` build and check whether a deterministic fixer touched these lines before it goes into the handoff.

The agent's attempt 2 thinking says it would remove the `response_metadata` blocks; attempt 3 restored them. Run-28 never used `response_metadata`, so the new model adding one more `gen_ai.*` attribute may be what reached this gap (D-3, D-4).

### `index.js` went partial on NDS-005

The function-level fallback instrumented both functions, then reassembly reported that an original try/catch block was missing from the instrumented output. This file committed in full on the first attempt in runs 26–28.

### Fewer spans and more attempts than runs 26–28

Run-29 produced 35 spans against 41–49, and 47 attempts against 38–42. The span gap against run-28 (13) comes from `summary-graph.js` (6), `git-collector.js` (4), and `summary-detector.js` (4), offset by 1 gained on `context-capture-tool.js`. The extra attempts fall mostly on files whose span counts did not change (`context-integrator.js`, `summary-manager.js`, `auto-summarize.js`), which points at validation retries rather than harder instrumentation. The log does not print per-attempt validation failures for files that eventually succeeded; the failure deep-dives read them from each file's `.instrumentation.md` Validation Journey on the instrument branch.

### No interactive-prompt stall

Total duration (45m 19.2s) matched the instrumentation work. The log went quiet for about 4 minutes after `pushBranch: urlChanged=true` (14:55) before the final lines; the process stayed alive throughout, and the push and PR completed.

---

## Post-run Datadog Verification

The instrument branch HEAD (`860fcb1`) appears on `vcs.ref.head.revision` for process `a2a54d88-00c9-4a85-bc8a-64e11de35779`, the post-commit hook run for the branch's final commit (2026-10-13T19:59Z). Log-trace correlation is 5/5 for that process. Window-wide it is 71/165 (43%) against run-28's ~82%, because the window is dominated by hook runs on partly instrumented code; this is recorded as a watch item, not a regression. Details, the corrected log query field, and a `vcs.ref.head.revision: HEAD` watch item are in `trace-artifact.md`.
