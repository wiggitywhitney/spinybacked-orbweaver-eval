# Actionable Fix Output — Run-20

Self-contained handoff from evaluation run-20 to the spiny-orb team.

**Run-20 result**: 24/25 (96%) canonical quality, 12 committed, 1 failed, 0 partial, 42 spans (new all-time record), $9.08 cost. Gates 5/5. IS 80/100. Q×F 11.5.

**Run-19 → Run-20 delta**: Quality +12pp (84% → 96%), COV +40pp (2/5 → 4/5), SCH +25pp (3/4 → 4/4), spans +12 (30 → 42), Q×F +3.1 (8.4 → 11.5). Push #73 (fully automatic — tenth consecutive).

**Target repo**: commit-story-v2 (same as runs 9–20)
**Branch**: `spiny-orb/instrument-1780313045724`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/73
**spiny-orb version**: 1.0.0 (SHA e12e75b, main branch — post PR #897 prompt generality cleanup)

---

## §1. Run-20 Score Summary

| Dimension | Score | Run-19 | Delta |
|-----------|-------|--------|-------|
| NDS | 2/2 (100%) | 2/2 (100%) | — |
| COV | **4/5 (80%)** | 2/5 (40%) | **+40pp** |
| RST | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | — |
| SCH | **4/4 (100%)** | 3/4 (75%) | **+25pp** |
| CDQ | 7/7 (100%) | 7/7 (100%) | — |
| **Total** | **24/25 (96%)** | **21/25 (84%)** | **+12pp** |
| **Gates** | **5/5** | **5/5** | **—** |
| **Files** | **12+1f** | **10+3p** | — |
| **Cost** | **$9.08** | **$8.83** | **+$0.25** |
| **IS** | **80/100** | **80/100** | **—** |
| **Q×F** | **11.5** | **8.4** | **+3.1** |

---

## §2. Prior Findings Assessment

| # | Finding | Priority | Status in Run-20 |
|---|---------|----------|-----------------|
| RUN19-1 | NDS-003 indentation-driven Prettier reformatting — 3 partial files | P1 | **FULLY RESOLVED** — all 4 blocked functions committed; PRD #885 multiLine flag fix confirmed |
| RUN19-2 | git-collector.js COV-005 (getCommitData missing output attributes) | P2 | **PERSISTS** — PRD #892 guidance added then removed by PRD #897; committed code sets only input param |
| RUN19-3 | IS SPA-002 orphan span — partial instrumentation creates context gap | P2 | **PERSISTS** — different orphan ID each run (run-20: ce5f0429 → parent 25a9f60d); underlying LangChain propagation gap open |
| IS SPA-001 | INTERNAL span count structural | Structural | **STRUCTURAL** — 29 spans; calibration mismatch, not regression target |
| RUN18-2 | SCH-002 journal-manager.js quotes_count mismatch | P2 | **RESOLVED** — run-20 used `commit_story.journal.entries_count` (correct); three-run watch broken |

---

## §3. New Run-20 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN20-1 | mcp/server.js NDS-003 false positive — `stripOtelNodes` trivia-loss bug | P1 | Validator / NDS-003 |
| RUN20-2 | High 3-attempt rate — 5 of 12 committed files + 1 failed at 3 attempts | P2 | Agent Quality |
| RUN20-3 | index.js COV-005 regression — `commit_story.cli.subcommand` dropped under NDS-003 pressure | P2 | Coverage |
| RUN20-4 | summary-manager.js read-path COV-005 gap (new: first-time commit reveals input-only) | P3/Watch | Coverage |
| RUN20-5 | mcp/server.js SCH-001 recurring — unregistered span name across runs 18–20 | P3/Watch | Schema |

---

### RUN20-1: mcp/server.js NDS-003 False Positive — `stripOtelNodes` Trivia-Loss Bug (P1)

**What happened**: mcp/server.js failed all 3 attempts with 21 identical NDS-003 violations at fixed line numbers (lines 1, 3–20, 37, 39). The agent's instrumented code was correct and identical across all attempts. The file was clean in runs 18–19.

**Root cause**: PRD #885 introduced a `stripOtelNodes` + `normalizeMultiLineFlags` comparison pipeline for NDS-003. `stripOtelNodes` uses ts-morph to remove the OTel import declaration. When the agent places the OTel import **before** all original imports (as first statement in the file), ts-morph removes that node along with its **leading trivia** — which for mcp/server.js includes the shebang (`#!/usr/bin/env node`) and the file-level JSDoc block (18 lines). The stripped code is then missing those 21 lines vs the original, producing spurious forward-check failures.

**Violation breakdown**:
| Line(s) | Content | Why missing |
|---------|---------|-------------|
| 1 | `#!/usr/bin/env node` | Shebang attached as trivia to OTel import node |
| 3–20 | File-level JSDoc content | 18-line JSDoc block attached as trivia |
| 37 | `/**` | Third `/**` occurrence drops; stripped has only 2× vs original's 3× |
| 39 | `*/` | Corresponding `*/` frequency mismatch |

**Evidence**: Confirmed by running `stripOtelNodes` on the debug dump — `shebang present: false`, `"/**" count: 2` vs 3 in original. Pre-PRD-#885 build compared `Prettier(original)` vs `Prettier(instrumented)` directly; no stripping, no trivia loss.

**Impact**: mcp/server.js contributes 0 committed spans. Q×F reaches only 11.5 vs projected 13.0 (13 files × 24/25). The file was clean in runs 18–19.

**Required fix**: `removeOtelImports` in `nds003-ast-stripper.ts` (phase 6). When removing an OTel import that is the **first statement** in the file: detect leading file-level trivia (shebang, block JSDoc) and transfer it to the next statement before removal, or prepend it to the returned stripped text. A simpler alternative: after stripping, compare the first non-blank line of stripped vs original — if the stripped result is missing the shebang or file-level block comment, prepend the original file's leading trivia section.

**Affected file pattern**: any file with a shebang or file-level block comment before its imports, where the agent inserts the OTel import as the first statement. Files with only ABOUTME line comments at the top are likely unaffected (ts-morph handles line comment trivia differently).

---

### RUN20-2: High 3-Attempt Rate — 5 of 12 Committed Files + 1 Failed at 3 Attempts (P2)

**What happened**: 6 of 13 processed files (46%) required 3 attempts — 5 committed and 1 failed — vs 1 of 13 (8%) in run-19. This is the highest 3-attempt rate in the series.

**Files at 3 attempts**: claude-collector.js, git-collector.js, context-integrator.js, journal-manager.js, index.js (committed), mcp/server.js (failed).

**Regression vs run-19**:
| File | Run-19 attempts | Run-20 attempts |
|------|----------------|----------------|
| context-integrator.js | 1 | 3 (+2) |
| journal-manager.js | 1 | 3 (+2) |
| index.js | 1 | 3 (+2) |
| mcp/server.js | 0 (not in run-19) | 3 (failed) |
| claude-collector.js | PARTIAL | 3 (committed) |
| git-collector.js | PARTIAL | 3 (committed) |

**Hypothesized cause**: PRD #897 (prompt generality cleanup) removed file-specific examples and explicit per-function guidance in favor of generalizable principles. The three regression files (context-integrator, journal-manager, index.js) had 1-attempt success in run-19 under a more specific prompt. Whether the prompt change is the causal factor or whether the NDS-003 false-positive pressure from the mcp/server.js trivia bug is contaminating neighboring files' context is unclear from run-20 data alone.

**Investigation path for run-21**: If the mcp/server.js NDS-003 false positive fix lands, observe whether the 3-attempt cluster reduces. If it does not, further analysis of the first-attempt failure modes in context-integrator.js, journal-manager.js, and index.js debug dumps would identify whether prompt generality or NDS-003 contamination is the primary driver.

---

### RUN20-3: index.js COV-005 Regression — `commit_story.cli.subcommand` Dropped Under NDS-003 Pressure (P2)

**What happened**: `main()` in index.js committed with only `vcs.ref.head.revision` (the input parameter). In run-19, it also set `commit_story.cli.subcommand` — the routing attribute that distinguishes which subcommand was invoked. This was the COV-005 passing attribute; its absence causes COV-005 to FAIL.

**Root cause**: Attempts 1–2 for index.js had NDS-003 failures (same JSON string serialization issue affecting mcp/server.js — the agent received NDS-003 validator rejection with 21 violations at fixed line numbers, likely from a similar trivia interaction). On attempt 3, the agent simplified its output to escape NDS-003, dropping `commit_story.cli.subcommand` in the process.

**Connection to RUN20-1**: If the mcp/server.js trivia-loss false positive is fixed, the NDS-003 pressure that caused index.js to simplify in attempt 3 should also be resolved. This COV-005 regression is likely a dependent effect of the same bug.

**Watch**: If the trivia-loss fix lands but index.js still regresses to 3 attempts and drops the subcommand attribute, a separate per-function guidance update may be needed.

---

### RUN20-4: summary-manager.js Read-Path COV-005 Gap — Input-Only Labels (P3/Watch)

**What happened**: `readWeekDailySummaries` and `readMonthWeeklySummaries` committed for the first time in run-20 (as part of the full 9-span summary-manager.js commit). Both spans set only their input label parameter (`week_label`, `month_label`) and capture no computed output attribute (e.g., count of summaries found). COV-005 FAIL for these two functions.

**Context**: These read-path functions were not committed in any prior run — this is their first evaluation. The gap was not previously visible. The agent appears to treat the input label as the primary identifier and stops there. Both functions build and return arrays of summaries.

**Suggested fix**: Prompt guidance suggesting that read/load functions should capture the count of items found (e.g., `commit_story.summary.count` from `return_value.length`). Alternatively, adding a COV-005-specific note that output attributes include result array sizes.

---

### RUN20-5: mcp/server.js SCH-001 Recurring — Three Consecutive Runs, Three Different Unregistered Names (P3/Watch)

**What happened**: The agent used `commit_story.mcp.start` as the span name in run-20. This is not registered in either `semconv/attributes.yaml` or `semconv/agent-extensions.yaml`. SCH-001 FAIL (non-canonical, unscored — file not committed).

**Trajectory across runs**:
| Run | Span name | Registered? |
|-----|-----------|-------------|
| 18 | `commit_story.mcp.server.start` | No |
| 19 | `commit_story.mcp.server_start` | No |
| 20 | `commit_story.mcp.start` | No |

The agent invents a new variant each run without a schema-registered canonical name to anchor on. This is a schema gap — no span name is declared for the MCP server entry point.

**Suggested fix**: Add `commit_story.mcp.server` or similar to `agent-extensions.yaml` in the commit-story-v2 schema. With a registered name, the agent will follow it consistently. This gap doesn't affect quality scoring (mcp/server.js is currently failing), but will need resolution when the NDS-003 bug is fixed and the file starts committing.

---

## §4. Per-Run Signal Changes

**PRD #885 multiLine flag fix fully confirmed**: All four functions blocked in run-19 (three `generateAndSave*` in summary-manager.js, `triggerAutoSummaries` in auto-summarize.js) committed cleanly on the first attempt. summary-manager.js committed all 9 spans in a single attempt at $0.62 — highly efficient when NDS-003 does not block.

**journal-graph.js: fourth consecutive success**: Runs 17–20 all produce 4 spans, 2 attempts. The 65% thinking budget is sufficient for this file. No further investigation needed.

**journal-manager.js SCH-002 resolved**: `discoverReflections` used `commit_story.journal.entries_count` (registered, semantically appropriate for a count of discovered filesystem entries) instead of `commit_story.journal.quotes_count` (defined for AI-extracted quotes; semantically wrong). Three-run watch (runs 18–20) broken. The prompt's semantic precision rule appears to have been sufficient once the agent encountered a structurally distinct scenario.

**New mcp/server.js failure after two clean runs**: The file was clean in runs 18–19 (pre-PRD-#885 build). Run-20 is the first run affected by the trivia-loss regression. PRD #885 fixed the indentation-driven Prettier false positive (RUN19-1) but introduced this new false positive class. Net effect on quality: +2pp from COV recovery, -0pp from mcp/server.js failure (failed files don't reduce quality score, only Q×F).

**IS SPA-002 persistence despite orchestrator recovery**: The generateAndSave* orchestrators now commit correctly (9 spans in summary-manager.js), yet a new orphan span appears in run-20 (ce5f0429 → parent 25a9f60d vs run-19's b48fbc5f → parent 30d70fca). The orphan is in a different LangChain call each run. This suggests the context propagation gap is not limited to the generateAndSave* orchestrators — it affects other LangChain invocations that receive auto-instrumented spans but whose context is established in a path without a manual parent span.

---

## §5. Recommended Next Actions (Run-21 Prep)

**For spiny-orb team:**

1. **RUN20-1 (P1)**: Fix `removeOtelImports` in `nds003-ast-stripper.ts` — transfer leading file-level trivia (shebang, file-level JSDoc) to the next statement before removing a first-position OTel import. Regression fixture: run-20 mcp/server.js debug dump (`evaluation/commit-story-v2/run-20/debug-dumps/server.js`). The fix should eliminate: (a) the mcp/server.js NDS-003 false positive, (b) the index.js NDS-003 pressure that caused the attempt-3 simplification.

2. **RUN20-2 (P2)**: After RUN20-1 fix lands, observe whether the 3-attempt cluster (context-integrator.js, journal-manager.js, index.js) resolves naturally. If not, compare first-attempt debug dumps from runs 19 and 20 for these three files to isolate whether PRD #897 prompt generality changes are the causal factor.

3. **RUN19-2 / RUN20-3 (P2)**: git-collector.js `getCommitData` COV-005 has now persisted for 2 consecutive runs (19–20). General CDQ-006/COV-005 guidance is insufficient for this function. Options: (a) re-add explicit per-function guidance for `getCommitData` requiring `commit_story.commit.message` (guarded) + `commit_story.commit.timestamp`; or (b) add schema extensions (`commit_story.git.command`, `commit_story.git.parent_count`, `commit_story.git.is_merge`) which the agent already independently invented in run-20 but couldn't commit without registration.

4. **RUN20-5 (P3)**: Add a registered span name for the MCP server entry point (e.g., `commit_story.mcp.server`) to `semconv/agent-extensions.yaml` in the commit-story-v2 target repo. The agent invents a new variant each run; a registered name will anchor it.

**For eval team:**

- Run-21 primary goal: verify RUN20-1 fix for mcp/server.js — if resolved, Q×F could reach 12.0–13.4 (13 files at 24/25 = 12.5; if index.js subcommand attribute also recovers, COV improves further)
- Watch: index.js `commit_story.cli.subcommand` — should recover if trivia-loss fix resolves the NDS-003 pressure that caused attempt-3 simplification
- Watch: 3-attempt rate — should drop if NDS-003 contamination was the cause; stays elevated if PRD #897 prompt generality is an independent factor
- Watch: IS SPA-002 orphan span — different span ID each run; investigate whether the orphan trace correlates with specific LangGraph execution paths that can be addressed in the bootstrap
- Carry forward: summary-manager.js read-path COV-005 (readWeek/readMonth) — need prompt guidance for result-count attributes on read-path functions
- Carry forward: mcp/server.js SCH-001 — will become a scored failure once RUN20-1 fix allows the file to commit; schema registration needed
