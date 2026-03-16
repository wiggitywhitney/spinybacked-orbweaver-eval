# Pre-Run Verification — Run-4

**Date:** 2026-03-15
**Orbweaver version:** 0.1.0
**Orbweaver repo commit:** 3098dc5 (Merge PR #149: schema extension rollback)
**Build timestamp:** Mar 15 20:38 (after latest commit Mar 15 20:34)
**Git credentials:** Validated (git ls-remote origin succeeded)

---

## Run-3 Orbweaver Issues — All 11 Resolved

Every run-3 issue has a corresponding GitHub fix, all closed with merged PRs:

| Run-3 Issue | Description | GitHub Issue(s) | Status |
|---|---|---|---|
| #1 | Token budget is post-hoc | #103, #106 | CLOSED |
| #2 | Null parsed output has no diagnostics | #103 | CLOSED |
| #3 | Zero-span files give no reason | #111 | CLOSED |
| #4 | NDS-003 blocks safe refactors | #100 | CLOSED |
| #5 | Accept multiple path arguments | Not filed | — |
| #6 | Oscillation error missing rule info | #103 | CLOSED |
| #7 | Test suite integration | #120, #121 | CLOSED |
| #8 | Unify oscillation/repeated-failure messages | #103 | CLOSED |
| #9 | Function-level instrumentation | #106 | CLOSED |
| #12 | Validate GitHub token at startup | #104, #137 | CLOSED |
| #13 | Save PR summary locally | #104 | CLOSED |

## Run-2 Issues (#61-#69) — All 9 Resolved

| Issue | Description | Status | Closed |
|---|---|---|---|
| #61 | Mega-bundle @traceloop/node-server-sdk | CLOSED | 2026-03-12 |
| #62 | CJS require() in ESM projects | CLOSED | 2026-03-12 |
| #63 | Elision/null bypass retry loop | CLOSED | 2026-03-12 |
| #64 | Tracer naming inconsistent | CLOSED | 2026-03-12 |
| #65 | Agent doesn't consult Weaver schema for span names | CLOSED | 2026-03-13 |
| #66 | Spec: module system detection | CLOSED | 2026-03-12 |
| #67 | Spec: SDK dependency placement | CLOSED | 2026-03-12 |
| #68 | Spec: retryable vs terminal failures | CLOSED | 2026-03-13 |
| #69 | Spec: token budget strategy | CLOSED | 2026-03-13 |

## Additional Fixes Targeting Run-3 Quality Rule Failures

| GitHub Issue | Run-3 Rule Failure | Description | Status |
|---|---|---|---|
| #101 | API-002 | Agent marks @opentelemetry/api optional | CLOSED |
| #102 | SCH-002 | Agent invents ad-hoc attributes | CLOSED |
| #105 | API-004, COV scoring, NDS-006 | Rubric updates | CLOSED |
| #146 | CDQ-003 | Missing recordException guidance | CLOSED |
| #147 | SCH-002 | Schema extension rollback loses attributes | CLOSED |

## Additional Improvements (Beyond Run-3 Issues)

| Issue | Description | Status |
|---|---|---|
| #115 | Audit all LLM prompts against guidelines | CLOSED |
| #118 | LLM-as-judge for semi-automatable validation | CLOSED |
| #123 | Rename CLI from orb to orbweaver | CLOSED |
| #125 | Condensed scoring rules in file-level prompt | CLOSED |
| #129 | Fix hono transitive vulnerabilities | CLOSED |
| #135 | Automate 10 unimplemented scoring rules | CLOSED |
| #140 | Env var documentation and prereq checks | CLOSED |

---

## Expected Score Ceiling

### Run-3 Quality Rule Failures (7 total) — Fix Mapping

| Rule | Classification | Fix Issue | Expected Run-4 Outcome |
|---|---|---|---|
| API-002 | New regression | #101 | **PASS** — explicit fix for optional→required |
| API-003 | Stale build repeat | #61 | **PASS** — mega-bundle replaced with individual packages |
| SCH-001 | Stale build repeat | #65 | **PASS** — agent now consults Weaver schema for span names |
| SCH-002 | Genuine new finding | #102, #147 | **PASS** — agent uses registry, rollback fixed |
| CDQ-003 | Genuine new finding | #146 | **PASS** — recordException guidance added to prompt |
| CDQ-007 | Schema design issue | Not fixed | **UNKNOWN** — PII in commit.author still unresolved |
| CDQ-008 | Stale build repeat | #64 | **PASS** — tracer naming rules enforced |

**Expected ceiling: 25/26 (96%) or 26/26 (100%)**
- 6 of 7 failures have direct fixes → expect PASS
- CDQ-007 (PII) is a schema design decision — may pass if addressed in milestone 2 rubric updates, or remain as a known issue

### Run-3 Failed Files (4 total) — Fix Mapping

| File | Run-3 Failure | Fix Issues | Expected Run-4 Outcome |
|---|---|---|---|
| journal-graph.js | Oscillation (150K budget) | #103, #106 | **LIKELY PASS** — function-level instrumentation for large files |
| sensitive-filter.js | Null parsed output | #103 | **LIKELY PASS** — diagnostics + retry loop fixes |
| context-integrator.js | NDS-003 | #100 | **LIKELY PASS** — safe refactors now allowed |
| journal-manager.js | NDS-003 x5 + COV-003 x3 | #100, #106 | **POSSIBLE** — may benefit from function-level + safe refactors |

**Expected file rescue: 2-4 of 4 files** (matching PRD success criterion of at least 2)

---

## Codebase State

- **Branch:** feature/prd-4-evaluation-run-4
- **Staged:** run-3 evaluation artifacts (7 files, checked out from prd-3 branch)
- **Historical orbweaver branches:** 3 from previous runs (kept as historical data): `orb/instrument-1773326732807`, `orb/instrument-1773434669510`, `orb/instrument-1773438620295`
- **Untracked:** `src/orb-instrumentations.js` (previous run artifact), `.claude/design-decisions.md`, `.claude/scheduled_tasks.lock`
- **Note:** `src/orb-instrumentations.js` will be overwritten by the new orbweaver run

## Expanded Codebase Scope

commit-story-v2 has had significant new development since run-3. Run-4 will process **~30 files** vs 21 in run-3.

**New files since run-3 (9 files):**
- `src/commands/summarize.js` — summary command
- `src/generators/prompts/sections/daily-summary-prompt.js` — daily summary prompt
- `src/generators/prompts/sections/monthly-summary-prompt.js` — monthly summary prompt
- `src/generators/prompts/sections/weekly-summary-prompt.js` — weekly summary prompt
- `src/generators/summary-graph.js` — summary generation graph
- `src/instrumentation.js` — OTel instrumentation setup (SDK init file)
- `src/managers/auto-summarize.js` — auto-summarization manager
- `src/managers/summary-manager.js` — summary management
- `src/utils/summary-detector.js` — summary detection utility

**Note:** `src/instrumentation.js` is the SDK init file — should be exempt from evaluation per API-004 carve-out (rubric issue #105). `src/orb-instrumentations.js` is a leftover from a previous run.

---

## Open Issues (Not Fixed)

| Issue | Description | Impact on Run-4 |
|---|---|---|
| #47 | Improve init experience for MCP/GH Action | No impact — CLI path |
| #99 | Auto-instrumentation allowlist config | No impact — default behavior |
| Run-3 #5 | Multiple path arguments | Minor — can run supplemental passes one at a time |
