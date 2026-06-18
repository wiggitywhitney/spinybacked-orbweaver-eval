// ABOUTME: Run-24 actionable fix handoff for the spiny-orb team — rule failures, coverage delta observations, and tool-level findings.
# Actionable Fix Output — Run-24

Self-contained handoff from evaluation run-24 to the spiny-orb team.

**Run-24 result**: 23/25 (92%) canonical quality, 14 committed, 0 partial, 0 failed, 48 spans, ~$3.70 cost (claude-sonnet-4-6). Gates 5/5. IS 80/100. Q×F 12.88 (new high-water mark — first clean sweep in 24 runs).

**Run-23 → Run-24 delta**: Quality -4pp (96% → 92%), COV holds at 5/5, CDQ -14pp (7/7 → 6/7 — CDQ-001 regression), SCH holds at 3/4 (SCH-003 recurs under renamed attribute), IS holds at 80/100, files +1 (13+1p → 14 committed), spans +3 (45 → 48 all-time record), cost -$1.90 (~$5.60 → ~$3.70), Q×F +0.40 (12.48 → 12.88).

**Target repo**: commit-story-v2 (same as runs 9–24)
**Branch**: `spiny-orb/instrument-1781811083418`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/81
**spiny-orb version**: 1.0.0 (main, confirmed pre-run)

*Note on run-23 cost*: run-23's actionable-fix-output.md stated "$7.84" but run-23's run-summary.md records ~$5.60 — $5.60 is the correct figure; $7.84 was a data entry error in the run-23 handoff doc.

---

## §1. Run-24 Score Summary

| Dimension | Score | Run-23 | Delta |
|-----------|-------|--------|-------|
| NDS | 2/2 (100%) | 2/2 (100%) | — |
| COV | 5/5 (100%) | 5/5 (100%) | — |
| RST | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | — |
| SCH | **3/4 (75%)** | 3/4 (75%) | — |
| CDQ | **6/7 (86%)** | 7/7 (100%) | **-14pp** |
| **Total** | **23/25 (92%)** | **24/25 (96%)** | **-4pp** |
| **Gates** | **5/5** | **5/5** | **—** |
| **Files** | **14 (0 partial, 0 failed)** | **13+1p** | **+1 committed** |
| **Model** | **claude-sonnet-4-6** | claude-sonnet-4-6 | — |
| **Cost** | **~$3.70** | ~$5.60 | **-$1.90** |
| **IS** | **80/100** | **80/100** | **—** |
| **Q×F** | **12.88** | **12.48** | **+0.40** |

---

## §2. Prior Findings Assessment

| # | Finding | Priority | Status in Run-24 |
|---|---------|----------|-----------------|
| RUN23-1 | SCH-003 — git-collector.js `diff_size` integer-as-string type mismatch | P2 | **PARTIALLY ADDRESSED** — `diff_size` attribute eliminated; agent renamed to `diff_lines` (semantically correct: line count). However, `diff_lines` also carries `type: string` declaration while set as integer — same root cause recurs under new attribute name. Tracked as new SCH-003 failure below. |
| RUN23-2 | SCH-003 — commands/summarize.js `*_summaries_generated` integer-as-string type mismatch | P2 | **RESOLVED** — committed clean; `*_summaries_generated` attributes absent (agent chose 0 custom attrs on summary-manager spans); `commands/summarize.js` committed with correct types on both `dates_count` (int) and `force` (boolean). |
| RUN23-3 | summary-detector.js partial — SCH-002 near-synonym oscillation | P2 | **RESOLVED** — all 5 exported functions committed (9 spans total, 3 attrs), 1 attempt. Near-synonym guidance worked; `unsummarized_*_count` output-count attributes used throughout; `base_path` input-parameter approach completely absent. |
| RUN23-4 | IS SPA-002 recurrence — orphan parentSpanId | Watch | **NOT RESOLVED** — `commit_story.index.main` still drops before batch flush. IS remains 80/100. Pre-run check confirmed `shutdownAndExit` fix is present in target repo's `instrumentation.js`; spiny-orb may not be following the existing shutdown pattern. |
| RUN21-6 | Agent notes vs committed code divergence | Watch | **WATCH** — no new instances flagged in run-24 per-file evaluation. Pattern not re-investigated. |

---

## §3. New Run-24 Rule Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN24-1 | CDQ-001 — index.js `process.exit()` bypasses `finally { span.end() }` (regression from run-12 fix) | P2 | Code Quality / CDQ-001 |
| RUN24-2 | SCH-003 — git-collector.js `diff_lines` declared `type: string`, set as integer (second consecutive run) | P2 | Schema Fidelity / SCH-003 |

---

### RUN24-1: CDQ-001 — index.js `process.exit()` Bypasses `finally { span.end() }` (P2)

**What happened**: `index.js`'s `main()` function wraps its body in `startActiveSpan`. Two early-exit paths call `process.exit(1)` directly inside that callback — one when no commit hash is found, one for unsupported subcommands. These calls terminate Node.js synchronously, bypassing `finally { span.end() }`.

**History**: Run-12 fixed this by adding explicit `span.end()` calls before each `process.exit(1)`. That fix was present in run-23. Run-24 regresses — the pre-exit calls are absent.

**No Datadog signal**: The IS scoring run and Datadog traces only capture successful executions. The CDQ-001 violation on early-exit paths is not observable from run traces alone — the fix must be verified via static code review.

**Required fix**:

```javascript
// Before each process.exit(1) inside the startActiveSpan callback:
span.end();        // must come before process.exit()
process.exit(1);   // process terminates — finally block never runs
```

The run-12 pattern is the correct model. Each `process.exit(1)` call inside `startActiveSpan` needs a preceding `span.end()`.

**Root cause**: Early-exit paths are exercised rarely (no commit hash found, unsupported subcommand) and do not appear in telemetry from success-path traces. Agents have no runtime signal that the pattern was wrong; the guidance needs to proactively flag this pattern.

---

### RUN24-2: SCH-003 — git-collector.js `diff_lines` Declared `type: string`, Set as Integer (P2)

**What happened**: `git-collector.js` declares `commit_story.git.diff_lines` as `type: string` in `agent-extensions.yaml`, but the committed instrumentation sets it with a bare integer:

```javascript
span.setAttribute('commit_story.git.diff_lines', lines.length);
// lines.length is a number — passed without String() conversion
```

Datadog confirms: `diff_lines: 296` (integer).

**History**: Run-23 had `diff_size` with the identical type mismatch. Run-24 renamed the attribute (correctly — `diff_lines` is semantically more precise for a line count) but did not update the `type: string` declaration in `agent-extensions.yaml`.

**This is a second consecutive SCH-003 failure on the same attribute slot.** The rename fixed the semantic (RUN23-1 goal), but the type declaration was not corrected alongside it.

**Required fix**: Change `type: string` → `type: int` in `agent-extensions.yaml` for `commit_story.git.diff_lines`. The instrumented code is already correct (integer semantics appropriate for a line count); only the schema declaration needs updating.

**Root cause**: The agent updated the attribute name to be semantically correct but did not revisit the `type` field when registering the new attribute. Type declarations appear to default to `string` conservatively. A guidance reminder — "when registering an attribute whose value will be a `.length`, count, or size expression, declare `type: int`" — would prevent this class of failure.

---

## §4. Coverage Delta Observations

Two committed files show attribute choices that differ from run-23. These are **not rule failures** — both files retain ≥1 meaningful domain attribute on every span (COV-005 PASS). They are documented here as context for future runs.

### context-capture-tool.js — `commit_story.context.source` dropped

Run-23 had 2 spans: an outer anonymous MCP callback carrying `source: 'mcp'` and an inner `saveContext`. Run-24 has 1 span (`saveContext`) with `entry_date` and `file_path`. The `source` attribute identified the ingestion pathway; its absence reduces observability on the MCP entry path. Both retained attributes are meaningful. The agent's decision to instrument only `saveContext` is a valid scope choice.

**Not a COV-005 failure.** The `saveContext` span carries domain attributes. Attribute richness decreased; the minimum bar was met.

### index.js — `commit_story.journal.file_path` dropped

Run-23's main span carried 3 attributes including `file_path` (the generated entry path — a result attribute). Run-24 carries 2 attributes (`vcs.ref.head.revision`, `commit_story.git.subcommand`). The result attribute is gone; the span is not attribute-sparse.

**Not a COV-005 failure.** Two domain attributes remain. The agent's choice to capture only input attributes is valid; run-23's approach of also capturing the result was also valid.

---

## §5. Notable Positives

**First clean sweep in 24 runs.** 0 failed files, 0 partial files — the first time every processed file was either committed or correctly skipped. Previous best: run-23 (13+1p).

**All three RUN23 fix targets confirmed**:
- RUN23-2 (`*_summaries_generated` types): resolved
- RUN23-3 (summary-detector.js near-synonym): resolved cleanly in 1 attempt — the most dramatic improvement of the run (was PARTIAL 4 spans in run-23; now 9 spans across all 5 functions)

**Attempt rate improvement**: 3 multi-attempt files vs 7 in run-23. journal-graph.js dropped from 2–3 attempts to 1; summary-graph.js from 2 to 1.

**journal-graph.js: 7th consecutive success** (runs 18, 19, 20, 21, [22 never ran], 23, 24).

**Cost reduction to ~$3.70** — 34% lower than run-23's ~$5.60. Fewer retry chains (3 vs 7 multi-attempt files) and high cache utilization (212.6K of 322.8K total input) drove the reduction.

**New file correctly handled**: `src/logger.js` (pino + OTLP log bridge, added via PR #80) was correctly identified as RST-001 utility skip in 1 attempt — confirming generalization to new file types.

---

## §6. Tool-Level Observation

**Spiny-orb PR summary and log output: include model alongside cost.**

Spiny-orb's run output includes cost figures (e.g., `~$3.70`) without the model identifier. When tracking quality across runs or comparing costs, the model is essential context — the same token count costs substantially different amounts across model tiers, and model changes between runs can explain cost swings that look like efficiency improvements.

**Recommended change**: Include the model ID (e.g., `claude-sonnet-4-6`) alongside cost in:
- PR body summary (the cost line)
- Log output (wherever cost is printed at run end)

The eval framework now tracks model in all per-run artifacts; the upstream tool should surface this information so it's visible without cross-referencing documentation.

---

## §7. Carry-Forward Tracker (Open Items Entering Run-25)

| ID | Title | Priority | Status | Runs Open | spiny-orb Issue |
|----|-------|----------|--------|-----------|-----------------|
| RUN24-1 | CDQ-001: index.js `process.exit()` bypasses `span.end()` (regression) | P2 | Open — new in run-24 (regression from run-12 fix) | 1 | — |
| RUN24-2 | SCH-003: git-collector.js `diff_lines` declared `type: string`, set as integer | P2 | Open — recurrence under new attribute name | 2 (consecutive) | #928 |
| RUN23-4 | IS SPA-002: `commit_story.index.main` drops before batch flush | Watch | Root cause: `process.exit()` terminates before OTel flush. `shutdownAndExit` fix present in target repo's `instrumentation.js`. spiny-orb may not be following the existing shutdown pattern. | 2 | #926 |
| IS SPA-001 | INTERNAL span count structural | Structural | 45 INTERNAL spans vs 10-span calibration limit; structural mismatch, not a defect. Research spike filed. | 10+ | #929 |
| RUN21-6 | Agent notes vs committed code divergence | Watch | Not re-investigated in run-24. Pattern documented; confirmed as trust problem. | 3 | #927 |

**Closed this run**: RUN23-2 (commands/summarize.js `*_summaries_generated` types), RUN23-3 (summary-detector.js SCH-002 near-synonym partial).

---

## §8. Score Projection — Run-25

| Scenario | Assumption | Projected Score | Q×F |
|----------|------------|-----------------|-----|
| Both fixed | CDQ-001 and SCH-003 resolved; 14 files committed | 25/25 (100%), 14 files | **14.0** — all-time record |
| One fixed | One failure remains | 24/25 (96%), 14 files | 13.44 |
| Neither fixed | Both failures recur | 23/25 (92%), 14 files | 12.88 (same as run-24) |

**Key insight**: Both RUN24-1 (CDQ-001) and RUN24-2 (SCH-003) have known, targeted fixes. CDQ-001 fix is a code change (add `span.end()` before `process.exit()` in `index.js`); SCH-003 fix is a schema change (change `type: string` → `type: int` for `diff_lines` in `agent-extensions.yaml`). If both land, run-25 would set a new all-time Q×F record of 14.0. The 14-file base is now stable — the question is whether both point failures can be eliminated.

**IS path**: SPA-002 remains the primary IS blocker (10pp). If the `shutdownAndExit` fix interaction is diagnosed and resolved, IS recovery to 90/100 is available. SPA-001 is structural (commit-story-v2 INTERNAL span count exceeds calibration limit) and will not improve without a calibration change.
