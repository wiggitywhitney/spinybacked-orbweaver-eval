# Spiny-Orb Findings — Run-6

Findings from evaluation run-6 of spiny-orb (spinybacked-orbweaver) instrumentation agent on commit-story-v2.

Each finding includes priority classification (Critical/High/Medium/Low), evidence paths, and acceptance criteria.

**Baseline**: Run-5 produced 22 findings (`evaluation/run-5/orbweaver-findings.md` on branch `feature/prd-5-evaluation-run-5`). Run-6 findings build on that baseline, tracking which were resolved, which persist, and what's new.

**Naming note**: The CLI tool was renamed from `orbweaver` to `spiny-orb` between run-5 and run-6 (spinybacked-orbweaver#177). Run-5 artifacts use the old name; run-6 artifacts use the new name.

### Supporting Documentation

All evidence referenced below lives in the eval repo on branch `feature/prd-6-evaluation-run-6`.

**Eval repo root**: `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval`
**Spiny-orb repo root**: `/Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver`

Paths in this document are relative to the eval repo root unless otherwise noted.

| Document | Path | What it contains |
|----------|------|-----------------|
| Failure deep-dives | `evaluation/run-6/failure-deep-dives.md` | Root cause analysis for each failed/partial file |
| Spiny-orb output log | `evaluation/run-6/spiny-orb-output.log` | Per-file results, schema evolution status, run-level issues |
| Per-file evaluation | `evaluation/run-6/per-file-evaluation.json` | Canonical per-file rubric results |
| Lessons for PRD #7 | `evaluation/run-6/lessons-for-prd7.md` | Process improvements, methodology observations |
| Spiny-orb branch | `spiny-orb/instrument-1773996478550` | The actual instrumented code |
| Evaluation rubric | `spinybacked-orbweaver/research/evaluation-rubric.md` (spiny-orb repo) | 32-rule rubric |
| Rubric-codebase mapping | `spinybacked-orbweaver/research/rubric-codebase-mapping.md` (spiny-orb repo) | Maps rubric rules to spiny-orb source code |

---

## Handoff Triage Review

The run-5 actionable-fix-output served as the handoff to the spiny-orb team. All 22 findings were triaged — none rejected. The team filed a dedicated PRD (#179: "Port 8 failed/partial files as acceptance test fixtures") plus individual issues for each finding. Triage was thorough:

**Issues filed (all closed):**

| Run-5 Finding | Issue Filed | Status | Notes |
|--------------|------------|--------|-------|
| DEEP-1 (COV-003 exemption) | #180 | Closed | Critical path item |
| RUN-1 + DEEP-6 (oscillation + entry point) | #181 | Closed | Combined into single issue |
| DEEP-4 (duplicate JSDoc) | #189 | Closed | |
| EVAL-1 + DEEP-8 (schema attrs + Date) | #184 | Closed | Combined related items |
| PR-4 (partial file commits) | #182 | Closed | |
| DEEP-2/2b (function-level fallback) | #178 | Closed | |
| DEEP-7 (whole-file syntax check) | #187 | Closed | |
| Push auth (persistent) | #183 | Closed | 3rd consecutive failure |
| RUN-4 (retry budget) | #186 | Closed | |
| PR-2 + PR-3 (advisory + span names) | #185 | Closed | Combined related items |
| PRE-1 (npm name collision) | #177 | Closed | Renamed to spiny-orb |
| DEEP-5 + EVAL-2 (SDK init + traceloop) | #190 | Closed | Combined related items |
| RUN-3 + RUN-5 (tally + timestamps) | #188 | Closed | Combined related items |
| PRE-2 (span extension namespace) | #209 | Closed | Discovered during fix work |

**PRD filed:**
- PRD #179: Port 8 failed/partial files as acceptance test fixtures — completed with 9 milestones

**Additional issues discovered during fix implementation (13+):**
- #205-207: Regressions from library detection (#190)
- #209: Colon vs dot separator in schema extensions
- #210: Adaptive token limit escalation
- #211: Fix loop token divergence on retry
- #212: Sync-only file pre-screening
- #213-216: CLI output improvements (diagnostics, reasoning report, human-readable rule names)
- #217: Token calibration evaluation
- #218: E2e PR creation verification
- #221, #225: CI and test configuration fixes

**Triage quality assessment:** Excellent. The team combined related findings efficiently (5 combinations), filed everything, and discovered 13+ additional issues during implementation. The handoff process continues to work well — this is the second successful handoff cycle (run-4→run-5, run-5→run-6).

---

## Resolved from Run-5

All 22 run-5 findings were fixed by the spiny-orb team. See `evaluation/run-6/pre-run-expectations.md` for the full triage table.

**Key fixes verified in run-6:**
- **DEEP-1 (COV-003 exemption)**: Partially working — ENOENT-style catches exempted. Boundary gaps remain (see RUN6-10).
- **RUN-1 (oscillation detection)**: Working — oscillation correctly detected and stopped on summary-detector.js and summary-graph.js (see RUN6-6).
- **DEEP-4 (duplicate JSDoc)**: Working — no NDS-003 violations from JSDoc duplication. NDS-003 violations are now code modification issues.
- **EVAL-1 (schema-uncovered attributes)**: Working — agent invents domain-relevant attributes on schema-uncovered files.
- **Push auth (#183)**: NOT working in practice — 4th consecutive failure (see RUN6-2). Fix only works with GITHUB_TOKEN set.
- **RUN-1/DEEP-6 (oscillation + entry point)**: Oscillation fixed. Entry point still fails for different reason (COV-003 boundary + SCH-001).
- **PR-4 (function-level fallback)**: Working — partial files get per-function results.
- **Sync-only pre-screening (#212)**: Working — sensitive-filter.js correctly pre-screened as sync-only.

---

## New Findings

### RUN6-1: Laptop sleep/wake kills in-flight API calls, causing widespread failures

**Priority**: Critical (process issue, not spiny-orb bug)
**Impact**: Dominant failure mode — affected 10+ files, caused 4 outright failures and degraded 5 partial files

The run was executed overnight via Claude Code background task. The laptop went to sleep during processing, killing active HTTP connections. When the machine woke, in-flight API requests were dead — spiny-orb reported "Anthropic API call failed: terminated." One instance also showed `overloaded_error`, which may be a genuine transient API issue or a stale connection artifact.

Wall clock was ~10.7 hours (20:46 UTC → 07:30 UTC) but actual processing time was ~2 hours — the rest was laptop sleep. Files processed early (before sleep) and late (after wake) succeeded; files mid-sleep failed.

**Evidence**: `evaluation/run-6/spiny-orb-output.log` lines 21, 25, 41, 43; PR summary function-level fallback details for summary-manager.js showing `overloaded_error` response. Wall clock vs actual processing time discrepancy.

**Acceptance criteria (process)**: Run the instrument command in the user's terminal with `caffeinate` (macOS) to prevent sleep, OR run on a machine that won't sleep. This is a process fix, not a spiny-orb fix.

**Acceptance criteria (spiny-orb, nice-to-have)**: Retry with backoff on connection-terminated errors. This would help with genuine transient failures even when sleep isn't the cause.

### RUN6-2: Push authentication still fails (4th consecutive)

**Priority**: Critical
**Impact**: No PR created — branch exists only locally

Push used HTTPS password auth: `fatal: Authentication failed for 'https://github.com/wiggitywhitney/commit-story-v2-eval.git/'`. Issue #183 was closed but the fix doesn't work in practice.

**Evidence**: `evaluation/run-6/spiny-orb-output.log` lines 68-70.

**Acceptance criteria**: Push succeeds and PR is created. Test with the actual eval repo, not just e2e fixtures.

### RUN6-3: SCH-001 forces semantic mismatch in server.js

**Priority**: High
**Impact**: Semantically incorrect span name committed to branch

server.js `main()` function was given span name `commit_story.context.collect_chat_messages` — the only registry-defined span — despite having no semantic relationship to chat message collection. The agent chose a wrong-but-registered name over a correct-but-unregistered name.

**Evidence**: `git diff main...spiny-orb/instrument-1773953218512 -- src/mcp/server.js`; PR summary agent notes for server.js.

**Acceptance criteria**: Agent should use schema extensions for correct span names rather than misusing existing registry spans. SCH-001 should not penalize correct schema extensions.

### RUN6-4: "Success" classification inflates committed file count

**Priority**: High
**Impact**: Misleading tally — reported 21 succeeded but only 3 files actually committed

Files where function-level fallback processed sync functions (0 spans) but all async functions failed are classified as "success." Example: journal-manager.js reported "success (0 spans, 2 attempts)" but saveJournalEntry and discoverReflections both failed with API terminated.

**Evidence**: PR summary per-file results table; branch diff showing only 3 src files changed.

**Acceptance criteria**: Tally should distinguish "committed with spans", "committed without spans (correct skip)", and "processed but not committed." The success/partial/failed classification should reflect branch state, not just processing status.

### RUN6-5: NDS-003 persists across multiple files despite fix attempts

**Priority**: Medium
**Impact**: 3+ partial files have functions skipped due to NDS-003

summarize.js (runMonthlySummarize), journal-graph.js (summaryNode, generateJournalSections), summary-detector.js (findUnsummarizedDays, findUnsummarizedWeeks) all had functions skipped due to NDS-003 validation — the agent modified original code lines during instrumentation (e.g., capturing return values in variables, modifying whitespace).

**Evidence**: PR summary function-level fallback details for each file.

**Acceptance criteria**: Agent produces instrumented output where all original lines are preserved byte-for-byte. NDS-003 failures drop to zero.

### RUN6-6: Oscillation detection triggered on summary-detector.js

**Priority**: Medium
**Impact**: One function (getDaysWithDailySummaries) was skipped due to oscillation detection

"Oscillation detected during fresh regeneration: Duplicate errors across consecutive attempts: SCH-001 (×1)" — this confirms RUN-1 oscillation detection is working, but the underlying SCH-001 conflict is still causing the oscillation.

**Evidence**: PR summary, summary-detector.js function-level fallback details.

**Acceptance criteria**: Root cause (SCH-001 on uncovered files) resolved so oscillation doesn't occur.

### RUN6-9: SCH-001 single-span registry is the new dominant blocker

**Priority**: Critical
**Impact**: EVERY partial/failed file has SCH-001 as a contributing factor. Blocks 14+ functions across 7 files.

The Weaver telemetry registry defines exactly ONE span: `commit_story.context.collect_chat_messages`. Any file needing a different span name fails SCH-001. The 5 committed files worked around this by misusing the registered name (semantically wrong but passes validation). The 6 partial files and index.js could not — their operations are too far from "collect chat messages" for even the agent to justify the mismatch.

**Pattern across runs**: Run-5's dominant blocker was COV-003 (DEEP-1). DEEP-1 was fixed, and SCH-001 emerged from behind it. Each run fixes the previous dominant blocker, revealing the next one.

**Files where SCH-001 is the SOLE blocker**: journal-manager.js (saveJournalEntry) — would commit immediately if the registry had more spans.

**Evidence**: `evaluation/run-6/failure-deep-dives.md` "R3. SCH-001 emerged as the new dominant blocking rule"

**Acceptance criteria**: Add span definitions to the Weaver registry for commit-story domain operations: journal save, summary generation, CLI entry point, summary detection, auto-summarization. Target: at least 8 span definitions covering all instrumented file operations.

### RUN6-10: DEEP-1 boundary gaps — 3 catch patterns not covered by expected-condition exemption

**Priority**: High
**Impact**: 5 files blocked by COV-003 despite DEEP-1 fix

DEEP-1 (#180) covers ENOENT-style catches (file-not-found). Three other expected-condition catch patterns are NOT covered:

1. **Per-item-failure-collection**: `catch (err) { result.failed.push(err); continue; }` — collects failures and continues the loop. Found in: summarize.js (runMonthlySummarize), auto-summarize.js (triggerAutoSummaries, triggerAutoMonthlySummaries).
2. **Swallow-and-continue**: `try { triggerAutoSummaries() } catch (e) { /* intentionally empty — don't block main */ }` — swallows errors to prevent non-critical operations from blocking the main flow. Found in: index.js (main).
3. **Try/finally without catch**: `try { ... } finally { span.end() }` — no explicit catch but COV-003 flags the failable operation. Found in: summary-graph.js (monthlySummaryNode).

**Evidence**: PR summary function-level fallback details for each file; `evaluation/run-6/failure-deep-dives.md` "Unmasked Bug Detection" section.

**Acceptance criteria**: COV-003 expected-condition exemption covers all three patterns. Test against the specific functions listed above.

### RUN6-11: 5 files regressed from run-5 committed to run-6 not committed

**Priority**: High
**Impact**: Net loss of 4 committed files from run-5

| File | Run-5 | Run-6 | Cause |
|------|-------|-------|-------|
| auto-summarize.js | Committed (COV-005) | Partial (1/3) | SCH-001 stricter + NDS-003 + COV-003 |
| context-capture-tool.js | Committed (1 span) | 0 spans | RST-004 vs COV-004 tension |
| reflection-tool.js | Committed (1 span) | 0 spans | RST-004 vs COV-004 tension |
| commit-analyzer.js | Committed | 0 spans | Agent correctly ID'd sync-only (not a regression) |
| journal-paths.js | Committed (1 span) | 0 spans | SCH-001 forced span removal |

auto-summarize.js is the most concerning — it was committed in run-5 and is now partial. SCH-001 validation strictness increased between runs.

context-capture-tool.js and reflection-tool.js are debatable — the exported functions ARE sync, but they contain unexported async functions (saveContext, saveReflection) that had spans in run-5.

**Evidence**: `evaluation/run-6/failure-deep-dives.md` "Regressions from Run-5" section; branch diffs for both runs.

**Acceptance criteria**: At minimum, auto-summarize.js and journal-paths.js should recover when SCH-001 is addressed. For context-capture-tool/reflection-tool, clarify whether unexported async functions with file I/O should get spans (COV-004 says yes, RST-004 says no).

### RUN6-12: 4/5 committed files use semantically incorrect span names

**Priority**: Medium
**Impact**: Semantic quality degradation in committed instrumentation

The 5 committed files all use `commit_story.context.collect_chat_messages` as their span name. Only claude-collector.js is semantically correct (it actually collects chat messages). The other 4 (git-collector, context-integrator, summary-manager, server) have operations unrelated to chat message collection.

This is a direct consequence of SCH-001 + single-span registry. The agent chose validation compliance over semantic accuracy.

**Evidence**: `evaluation/run-6/failure-deep-dives.md` "Committed File Quality Notes" table; branch diffs for each file.

**Acceptance criteria**: Same as RUN6-9 — expanding the registry fixes this. Once more span definitions exist, the agent can use semantically correct names that also pass validation.

---

## Persistent Findings

### RUN6-8: index.js main() still has no span — COV-001 entry point failure persists

**Priority**: Critical
**Impact**: The application entry point has zero instrumentation. Without a root span on main(), the entire trace tree has no parent. COV-001 fails for the 3rd consecutive run.

Run-5's failure was oscillation (RUN-1, fixed by #181). Run-6b's failure is different: the agent instruments main() but the validator rejects it because of **COV-003** — a catch block at line 178 that the agent treats as expected-condition (it swallows triggerAutoSummaries errors intentionally) but the validator flags as missing `recordException`/`setStatus`. The agent spent 3 attempts and $1.33 trying to satisfy both COV-003 and the expected-condition exemption, then gave up.

This is a DEEP-1 boundary case: the catch IS expected-condition (the code explicitly swallows errors to avoid blocking the main flow), but COV-003's exemption logic doesn't recognize it. The fix from #180 covers ENOENT-style catches but not "swallow-and-continue" patterns.

**Evidence**: PR summary agent notes for index.js; function-level fallback showing main() skipped with `COV-003, SCH-001, SCH-002`.

**Acceptance criteria**: main() in index.js gets a root span and passes validation. The COV-003 expected-condition exemption must cover intentional error-swallowing catches (not just ENOENT patterns).

---

### RUN6-7: Per-file reasoning reports not written to disk

**Priority**: Medium
**Impact**: User experience — no visibility into per-file decisions during or after the run

The rendering function `renderReasoningReport()` exists in `src/coordinator/reasoning-report.ts` (issue #215, merged in PR #230) and generates rich per-file markdown reports. However, it is not wired up to write companion files to disk — the commit message explicitly states "Coordinator integration for writing companion files is a follow-up." The function is also not exported from the coordinator's public API.

During a 2+ hour run, the `--verbose` flag only shows one line per file result. The detailed reasoning (which functions got spans, which were skipped and why, schema extensions, validation failures) only appears in the PR summary at the end. If companion files (e.g., `src/collectors/claude-collector.instrumentation.md`) were written alongside each commit, the user could inspect results as they happen.

**Evidence**: `spinybacked-orbweaver/src/coordinator/reasoning-report.ts` — function exists but no disk I/O. Terminal output during run-6b shows only one-liner results.

**Acceptance criteria**: Each committed file gets a companion `.instrumentation.md` written to disk during the run. The reasoning report should be written at commit time so users can `cat` it while the run is still processing later files.

---

### RUN6-13: RST-004 violation in git-collector.js — unexported functions instrumented

**Priority**: Medium
**Impact**: 2 unexported internal functions have spans instead of the exported orchestrator

The agent instrumented `getCommitDiff` (line 79) and `getMergeInfo` (line 115) in git-collector.js. Both are unexported internal functions, explicitly listed in the rubric-codebase mapping as RST-004 violations. They are internal to the exported `getCommitData` function.

The agent should have instrumented `getCommitData` (the exported orchestrator) instead. The current instrumentation provides span coverage for the operations but at the wrong abstraction level.

**Evidence**: `evaluation/run-6/per-file-evaluation.json` git-collector.js RST-004 entry; `git diff main...spiny-orb/instrument-1773996478550 -- src/collectors/git-collector.js`

**Acceptance criteria**: Agent instruments the exported `getCommitData` function with a parent span. Internal functions (`getCommitDiff`, `getMergeInfo`, `getCommitMetadata`) should not have their own spans.

### RUN6-14: server.js span has zero attributes (COV-005)

**Priority**: Medium
**Impact**: MCP server startup span carries no useful trace information

The server.js `main()` function has a span but zero `setAttribute` calls. No service name, transport type, version, or domain-specific attributes. The span exists but is uninformative.

**Evidence**: `evaluation/run-6/per-file-evaluation.json` server.js COV-005 entry; `git diff main...spiny-orb/instrument-1773996478550 -- src/mcp/server.js`

**Acceptance criteria**: Server startup span includes at least service.name and transport type attributes.

---

### RUN6-15: PR summary does not reflect final branch state

**Priority**: High
**Impact**: Reviewer misled — span names, file statuses, schema extensions, and library claims all diverge from committed code

The PR summary describes the agent's INTENDED instrumentation from the initial processing pass, not the final committed state after validation retries. When validation rejects span names and forces retries, the summary is not regenerated. Key discrepancies:
- 4/5 committed files have different span names than the summary claims
- 5 files claimed as "success" are NOT on the branch
- 14 schema extensions claimed; only 1 committed
- @traceloop libraries listed as "installed" but not in committed code or package.json

**Evidence**: `evaluation/run-6/pr-evaluation.md` §"PR Summary vs Branch State" tables; `git diff main...spiny-orb/instrument-1773996478550 --stat`

**Acceptance criteria**: PR summary regenerated AFTER validation retries, reflecting final committed state. At minimum, the per-file table should show committed span names and statuses, not pre-validation intentions.

### RUN6-16: Advisory contradiction rate still high (76%)

**Priority**: Medium
**Impact**: Advisory findings mislead reviewers — 26/34 COV-004 advisories contradict correct RST skip decisions

The advisory engine still doesn't consume skip decisions (PR-3 from run-5). CDQ-006 advisories also incorrectly flag `.toISOString()` as expensive (rubric-codebase mapping explicitly classifies it as cheap).

**Evidence**: `evaluation/run-6/pr-evaluation.md` §"Advisory Findings Analysis"

**Acceptance criteria**: Advisory engine filters out functions that were explicitly skipped via RST rules. CDQ-006 should not flag method calls classified as cheap in the rubric-codebase mapping.

---

## Persistent Findings

- **Push authentication failure**: Now 4 consecutive runs. #183 closed but fix ineffective. See RUN6-2.
- **NDS-003 validation failures**: Present since run-3. Agent still makes minor code modifications during instrumentation. See RUN6-5.
- **COV-001 entry point failure**: 3rd consecutive run. index.js main() has no span. See RUN6-8.
- **COV-005 zero attributes on server.js**: 2nd consecutive run. See RUN6-14.
- **PR summary length**: 2nd consecutive run at ~430 lines. PR-1 from run-5 unaddressed.
- **Advisory contradictions**: 2nd consecutive run at 76-82%. PR-3 from run-5 unaddressed.
