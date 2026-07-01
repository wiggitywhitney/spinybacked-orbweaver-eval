# Lessons for PRD #19

Run-18 observations to carry forward into the next evaluation run PRD.

## Process Observations

<!-- Add process-level notes as the run unfolds -->

## Pre-run Verification Findings

**spiny-orb version**: 1.0.0 (SHA 1c53ffd, main branch)

**Commits since run-17 (c60f79d)**:
- PRD #847 (LLM Day Austin slides) — slides only, no code changes
- PRD #857 (validation infrastructure audit — 7 milestones, complete):
  - M1: NDS-003 reconciler audit → produced `audit-findings/nds003-reconcilers.md` (documentation, no code fix)
  - M2-M3: Agent prompt quality audit + fixes → `src/agent/prompt.ts` updated:
    - Semantic precision for count attributes (verify registered key description matches what you're counting)
    - NDS-003: explicit "do NOT increase line count" addition alongside do-not-reduce
    - Return-value capture exception: excludes `return { ... }` object literals explicitly
    - COV-001 definition expanded: "exported async service functions" vs utilities clarified
    - Namespace prefix: explicitly forbid deriving from URL domains/variable names
    - CDQ-006 exemption for COV-001 entry point spans added
  - M5: Acceptance gate test calibration fixes
  - M6-M7: Backlog review, new work items filed
- Issue #855: COV-001 fix → `src/languages/javascript/extraction.ts`:
  - `isWorthInstrumenting()` now bypasses MIN_STATEMENTS (3) for exported async functions
  - Fixes `getCommitData` in git-collector.js (2 statements — was silently dropped)
- Issue #861/#843: NDS-003 reconciler unit tests → added tests for 3 previously uncovered patterns, no behavior change

**RUN17-1 fix status** (P1 — critical): ❌ NOT FIXED
- NDS-003 reconciler offset calculation for `startActiveSpan` in nested callbacks is unchanged
- PRD #845 (content-aware diff) status: "Ready to start M1" — NOT STARTED
- No regression fixture for the nested-callback pattern exists
- context-capture-tool.js, reflection-tool.js, index.js, summary-manager.js generateAndSave* functions expected to still fail

**RUN17-2 fix status** (P1 — critical): ❌ NOT FIXED
- Thinking budget cap unchanged: still `Math.floor(max_tokens * 0.65)` for file-level calls
- journal-graph.js (629 lines, template literals) expected to still fail or partial

**RUN17-3 fix status** (P2): ✅ FIXED
- `isWorthInstrumenting` now bypasses MIN_STATEMENTS for exported async functions
- `getCommitData` (2 statements, Promise.all + return) now passes the filter
- Expected: git-collector.js commits with getCommitData span in run-18 ← primary new signal to watch

**RUN17-4 fix status** (P2): PARTIAL — prompt guidance added, no code fix
- Semantic precision rule for count attributes added to prompt
- No explicit directive naming `messages_count`/`quotes_count` as wrong for journal entries
- Outcome uncertain — depends on whether agent reads the guidance correctly

**Score projection for run-18**:
- Conservative: 22/25, 10 files — same as run-17 (P1 reconciler gap still active)
- Target: 23/25, 11 files — if git-collector.js getCommitData commits AND prompt improvements land cleanly
- If summary-graph SCH-002 also resolves: 24/25

**Push auth**: Verified ✅ (dry-run to `spiny-orb/auth-test-run18` succeeded)
**Test suite**: 26 files, 565 tests — ALL PASSED ✅ (pre-push hook verified)
**Test command**: `npm test` (default — spiny-orb.yaml has no explicit `testCommand`)
**Target repo**: commit-story-v2 on main, 30 JS files in src/ (unchanged from prior runs)
**Note**: 23 staged `.instrumentation.md` companion files from run-17 are present in the working tree — normal; spiny-orb will overwrite them during run-18

## Evaluation Run Observations

<!-- Observations made as the run progresses — cost ceiling, file counts, etc. -->

## Scoring Observations

<!-- Patterns noticed during per-file evaluation and rubric scoring -->

## IS Scoring Notes

<!-- IS run observations; remember SPA-001 always fails (>10 INTERNAL spans structural mismatch) -->

## Advisory Pass Rollback Verification

<!-- Was the advisory pass rollback path triggered? Was it correct? -->

## What to Watch in Run-19

<!-- Primary goals and watch items for the next run -->
