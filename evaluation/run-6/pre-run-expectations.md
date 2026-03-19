# Pre-Run Expectations — Run-6

## Spiny-Orb Version

- **Version**: 0.1.0
- **Build timestamp**: 2026-03-19 21:24 (rebuilt from latest main)
- **Binary**: `node /Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js`

## Handoff Triage Summary

All 22 run-5 findings were triaged — none rejected. The spiny-orb team filed:
- 14 issues (#177-#190) covering all 22 findings (5 combined into pairs)
- 1 PRD (#179: port 8 failed/partial files as acceptance test fixtures) — completed with 9 milestones
- 13+ additional issues discovered during fix implementation (#205-#225)
- 60 commits since run-5

**Triage quality**: Excellent — second successful handoff cycle.

## Critical Fix Verification

| Fix | Issue | Status | Verification |
|-----|-------|--------|-------------|
| DEEP-1: COV-003 expected-condition exemption | #180 | Closed | `isExpectedConditionCatch()` in `cov003.ts` with pattern matching; test fixtures include summarize.js |
| RUN-1: Oscillation detection | #181 | Closed | `detectOscillation()` in `fix-loop/oscillation.ts`; integrated into retry loop |
| DEEP-4: Duplicate JSDoc prevention | #189 | Closed | Prompt guidance + function extraction handles JSDoc ranges + NDS-003 validator |
| EVAL-1: Schema-uncovered attributes | #184 | Closed | Prompt improvements for attribute invention |
| Push auth | #183 | Closed | Uses `gh` CLI; GITHUB_TOKEN guidance in error messages; e2e test (#218) |

## Acceptance Test Results (from PRD #179)

All 8 run-5 failed/partial files ported as fixtures; 8/8 pass at 32K streaming:

| File | Run-5 Status | Fixture Test | Expected Run-6 |
|------|-------------|-------------|----------------|
| src/index.js | Failed (oscillation) | PASS | **Recover** — oscillation detection prevents loop |
| src/commands/summarize.js | Failed (COV-003 + SCH-002) | PASS | **Recover** — expected-condition exemption + schema normalization |
| src/generators/journal-graph.js | Partial | PASS | **Recover** — function-level fallback scope fixed |
| src/generators/summary-graph.js | Partial | PASS | **Recover** — was the original holdout; passes at 32K |
| src/integrators/filters/sensitive-filter.js | Partial | PASS | **Recover** — regex preservation addressed |
| src/managers/journal-manager.js | Partial | PASS | **Recover** — COV-003 exemption + JSDoc fix |
| src/managers/summary-manager.js | Partial | PASS | **Recover** — COV-003 exemption + JSDoc fix |
| src/utils/summary-detector.js | Partial | PASS | **Recover** — COV-003 exemption + JSDoc fix |

## File Recovery Expectation Table

| Category | Run-5 Count | Expected Run-6 Count | Files |
|----------|-------------|---------------------|-------|
| Committed (all rules pass) | 7 | 15 (+8 recovered) | Run-5's 7 + all 8 recovered files |
| Committed (COV-005 fail) | 2 | 2 (or better if EVAL-1 works) | auto-summarize, server |
| Correctly skipped (0 spans) | 12 | 12 | Same set (+ possibly sensitive-filter if pre-screened as sync-only) |
| Partial (not committed) | 6 | 0 (target) | All should recover |
| Failed entirely | 2 | 0 (target) | Both should recover |

**Overall target**: 15-17 committed files (up from 9), 0 partial/failed files.

**Note**: sensitive-filter.js was classified as "partial" in run-5 but may be correctly skipped as a sync-only file with the new pre-screening (#212). If so, the committed count would be 14 + 12 correctly skipped = 26/29 resolved, with 3 still needing work.

## Superficial Resolution Tracking Setup

Three rules from run-5 passed only because violating files were filtered. In recovered files, these must be genuinely resolved:

| Rule | What "genuine resolution" looks like | Files to watch |
|------|-------------------------------------|----------------|
| NDS-005 (expected-condition catches) | No `recordException()` or `setStatus(ERROR)` on ENOENT, validation fallback, or other expected-condition catches. The COV-003 exemption (DEEP-1) should prevent the agent from adding them. | journal-manager.js, summary-manager.js, summary-detector.js |
| CDQ-003 (recordException misuse) | No `recordException()` on expected-condition code paths. Same root cause as NDS-005b. | summarize.js, partial files |
| RST-001 (over-instrumentation) | Pure sync functions (token-filter, sensitive-filter) correctly skipped. With sync-only pre-screening (#212), these should be pre-screened before LLM call. | token-filter.js, sensitive-filter.js |

## Additional Improvements Since Run-5

Beyond the 22 findings, the spiny-orb team implemented:
- Adaptive token limit escalation (32K default, escalate to 65K on truncation) — #210
- Sync-only file pre-screening before LLM call — #212
- Fix loop convergence improvements (reduced effort + constrained feedback scope on retry) — #211
- Per-file diagnostics, reasoning reports, human-readable rule names — #213, #215, #216
- Schema extension dedup fix — #221
- E2e PR creation test — #218

## Run-5 Finding Status Summary

| Finding | Priority | Status | Notes |
|---------|----------|--------|-------|
| DEEP-1 | Critical | Fixed (#180) | COV-003 exemption implemented |
| RUN-1 | Critical | Fixed (#181) | Oscillation detection implemented |
| DEEP-4 | High | Fixed (#189) | Prompt + extraction handles JSDoc |
| EVAL-1 | High | Fixed (#184) | Prompt improvements for attributes |
| DEEP-6 | High | Fixed (#181) | Combined with RUN-1 |
| PR-4 | High | Fixed (#182) | Partial file commits (function-level) |
| DEEP-2/2b | Medium | Fixed (#178) | Function-level fallback quality |
| DEEP-7 | Medium | Fixed (#187) | Whole-file syntax check |
| RUN-2 | Medium | Fixed (PRD #179) | Validation regression tracking via fixtures |
| Push auth | Medium | Fixed (#183) | GITHUB_TOKEN + e2e test |
| RUN-4 | Medium | Fixed (#186) | Retry budget configuration |
| PR-3 | Medium | Fixed (#185) | Advisory/skip contradictions |
| PRE-1 | Medium | Fixed (#177) | Renamed to spiny-orb |
| NDS-005b | Medium | Fixed (#180) | Part of COV-003 exemption |
| DEEP-5 | Low | Fixed (#190) | Library detection + SDK init skip |
| DEEP-8 | Low | Fixed (#184) | Date object guidance |
| RUN-3 | Low | Fixed (#188) | Summary tally includes partial files |
| RUN-5 | Low | Fixed (#188) | Timestamps in output |
| PRE-2 | Low | Fixed (#209) | Span extension namespace normalization |
| EVAL-2 | Low | Fixed (#190) | Library packaging improvements |
| PR-1/PR-2 | Low | Fixed (#185) | PR summary quality |

**All 22 findings: Fixed.** No findings remain open from run-5.

## Score Projection Expectations

From run-5 actionable-fix-output §7:
- **Minimum (RUN-1 only)**: 96% canonical, 10 files
- **Target (RUN-1 + DEEP-1 + DEEP-4)**: 96-100% canonical, 14-16 files
- **Stretch (target + EVAL-1)**: 100% canonical, 15-17 files

Since ALL findings are fixed (including EVAL-1), the stretch target is the most likely outcome. The risk is unmasked bugs in recovered files.

## Push Capability

- Eval repo: Push via HTTPS verified (`git push --dry-run` succeeded)
- Spiny-orb subprocess: Uses `gh pr create` (requires GITHUB_TOKEN in environment). Memory note: orbweaver needs GITHUB_TOKEN in environment for PR creation.
