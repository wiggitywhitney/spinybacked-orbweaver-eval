# Lessons for PRD #20

Run-19 observations to carry forward into the next evaluation run PRD.

## Process Observations

<!-- Add process-level notes as the run unfolds -->

## Pre-run Verification Findings

**spiny-orb version**: 1.0.0 (SHA 36201a5, main branch)

**Commits since run-18 (1c53ffd)**: 18 commits across 3 meaningful PRs:

- **PRD #845 (NDS-003 normalize-both-sides)** — MERGED ✅ P1 fix for RUN18-1:
  - `src/languages/javascript/rules/nds003.ts` rewritten to normalize both sides before comparison
  - `reconcileObjectLiteralExpansion` removed (made redundant by normalize-both-sides, M3)
  - Regression fixtures added for saveContext (`server.tool()` callback) and saveReflection patterns
  - summary-graph.js multi-span pattern now has acceptance gate coverage
  - index.js intentionally not in acceptance gate: "same CLI-entry-point + schema-extension pattern as summarize.js, which covers it" (M4 decision)
  - Acceptance gate test for summary-graph.js added explicitly

- **Issue #867 (push retry)** — MERGED ✅ P2 fix for RUN18-3:
  - `pushWithHookRetry()` wraps push in spiny-orb; detects "push again" pattern in hook output and retries once
  - Should resolve auto-push failure from run-18 (PROGRESS.md commit mid-push)

- **Issue #9f1fddb (run-18 findings capture)** — docs only

**RUN18-1 fix status** (P1 — critical): ✅ FIXED
- NDS-003 normalize-both-sides replaces offset tracking entirely
- Regression fixtures exist for saveContext and saveReflection (server.tool() callback)
- Expected: context-capture-tool.js, reflection-tool.js, index.js, summary-graph.js all commit in run-19

**RUN18-2 fix status** (P2): ❌ NOT FIXED
- No `commit_story.journal.reflections_count` attribute added to commit-story-v2 semconv/attributes.yaml
- No agent directive added to spiny-orb preventing `quotes_count` reuse for reflection discovery
- journal-manager.js `discoverReflections` likely uses `quotes_count` again in run-19
- SCH-002 expected to recur

**RUN18-3 fix status** (P2): ✅ FIXED
- pushWithHookRetry() detects "push again" in pre-push hook output and retries
- Auto-push expected to succeed in run-19

**Score projection for run-19**:
- Conservative: 24/25, 15 files (4 newly-unblocked + 11 from run-18), Q×F ≈ 14.4
- SCH-002 on journal-manager.js likely recurs (RUN18-2 not fixed) → 24/25 more realistic than 25/25
- journal-graph.js: second consecutive expected; 2 data points would confirm structural fix vs one-off

**Push auth**: Verified ✅ (dry-run to `spiny-orb/auth-test-run19` succeeded)
**Test suite**: 26 files, 565 tests — ALL PASSED ✅ (pre-push hook verified during auth check)
**Test command**: `npm test` (default — spiny-orb.yaml has no explicit `testCommand`)
**Target repo**: commit-story-v2 on main, clean working tree (journal entries only untracked), 30 JS files in src/
**semconv/**: attributes.yaml, agent-extensions.yaml, registry_manifest.yaml — all present ✅
**spiny-orb.yaml**: present ✅
**Staged .instrumentation.md files**: present from run-18 (normal; spiny-orb will overwrite them)
**README check**: Verified — run history table includes rows through run-18 ✅
**Rebuild**: spiny-orb 1.0.0 built clean from main ✅

## Evaluation Run Observations

**Duration**: 1h 30m 47.2s — faster than run-18 (103 min).
**Cost**: $8.83 (PR total) — down from $9.16 in run-18.
**Longest files**: summary-manager.js (19 minutes, 2 attempts, $1.81); summarize.js (13 minutes, 3 attempts, $1.40); auto-summarize.js (3 attempts, $1.12).
**Files**: 30 processed, 10 committed, 3 partial, 17 correct skips, 0 failures.
**PRD #875 evidence confirmed**: PRD #885 class (ObjectLiteralExpression/ArrayLiteralExpression multiLine flags) accounted for 4 of the 5 partial patterns. The method chain case (claude-collector.js) is the 5th and is tracked separately in issue #886.

## Scoring Observations

**COV regression dominant story**: COV dropped 5/5→2/5 due to NDS-003 false positives on the generateAndSave* orchestrators and triggerAutoSummaries — not agent quality issues. Validator gap (PRD #885 class).

**summary-manager.js trajectory reversal**: 3→6→9→6 spans across runs 12, 17, 18, 19. Run-18 file-level instrumentation succeeded; run-19 function-level fallback failed on the same 3 functions. PRD #885 fix expected to restore 9 spans.

**context-capture-tool.js / reflection-tool.js**: Changed from FAIL (runs 17–18) to correct 0-span skips. Pre-scan correctly classifies registerContextCaptureTool/registerReflectionTool as synchronous wrappers. Inner async callback is not exported; COV-001 doesn't apply per current rubric. This is a structural observation for future rubric evolution.

**git-collector.js COV-005 regression**: Run-18 set 4 attributes on getCommitData; run-19 set only 1 (vcs.ref.head.revision). Addressable by prompt guidance + schema additions (issue #887).

**journal-graph.js: 3rd consecutive success** (runs 17, 18, 19): structural fix confirmed.

## IS Scoring Notes

**SPA-001** (>10 INTERNAL spans): Always fails for commit-story-v2. Run-19 had 22 spans. Structural calibration mismatch — not a regression target.

**SPA-002 NEW**: Orphan span `b48fbc5f` references parent `30d70fca` absent from the trace. Root cause: missing generateAndSave* orchestrator spans leave context propagation gaps in auto-instrumented LangChain calls. Expected to resolve when PRD #885 restores those spans.

**IS score**: 80/100 (down from 90/100 in run-18 due to SPA-002). Restore path: fix RUN19-1 via PRD #885.

## Advisory Pass Rollback Verification

Advisory pass rollback path was NOT triggered in run-19. No rollback events observed in the spiny-orb-output.log. Issue #856 continues to track unaudited coverage of this path.

## What to Watch in Run-20

**Primary**: Did PRD #885 (multiLine flag normalization) land? Verify by checking `checkNonInstrumentationDiffNormalized` in `src/languages/javascript/rules/nds003.ts` for multiLine flag reset before Prettier runs. If yes, generateAndSave* × 3 and triggerAutoSummaries should commit — expect 14 files and COV 4/5 or 5/5.

**Secondary**: Did issue #887 land? Check if `commit_story.git.is_merge`, `commit_story.git.parent_count`, `commit_story.git.command` were added to `semconv/attributes.yaml` in commit-story-v2, and whether prompt guidance for getCommitData output attributes was added. If yes, git-collector.js COV-005 should pass.

**SCH-002 third-run watch**: Did journal-manager.js use `quotes_count` again for `discoverReflections`? Three consecutive runs without fix means the prompt semantic precision rule is insufficient alone. Explicit schema attribute (`commit_story.journal.reflections_count`) or negative directive needed.

**IS SPA-002**: Should resolve if PRD #885 restores the missing orchestrator spans. Verify by checking that no orphan spans appear in run-20 traces.

**Claude-collector.js method chain**: Still tracked in issue #886 (deferred from PRD #885 scope). Expect this file to remain partial until #886's spike and subsequent PRD land.
