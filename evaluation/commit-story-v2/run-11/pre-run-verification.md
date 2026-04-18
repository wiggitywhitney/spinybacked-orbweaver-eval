# Pre-Run Verification — Run-11

**Date**: 2026-03-30
**PRD**: #32 (Evaluation Run-11)
**Branch**: feature/prd-32-evaluation-run-11

---

## Spiny-Orb Version

- **Package**: spiny-orb@0.1.0
- **Commit**: 0395958 (Merge pull request #347 from fix/reexport-context)
- **Branch**: main
- **Built**: 2026-03-30 (fresh `npm run prepare`)

## Run-10 Findings Status

| # | Finding | Issue | PR | Status |
|---|---------|-------|----|--------|
| RUN10-1 | Push auth: token rejected | #328 | — | **CLOSED** — fixed in git-wrapper.ts |
| RUN10-2 | Weaver CLI fails on large registry | #331 | #341 | **CLOSED** — retry logic added in dispatch.ts |
| RUN10-3 | Boolean attrs declared as string (SCH-003) | #329 | #335 | **CLOSED** — type detection in schema-extensions.ts |
| RUN10-4 | Optional chaining without guard (CDQ-007) | #330 | #338 | **CLOSED** — prompt guidance + validator in rubric-checks.ts |

All 4 findings addressed and merged to main.

## Fix Verification

### Push Auth Token (RUN10-1) — VERIFIED
- Token type: fine-grained PAT (no X-OAuth-Scopes header)
- Permissions: `push: true`, `admin: true`, `maintain: true`
- Dry-run push: **SUCCEEDED** (`git push --dry-run` to commit-story-v2)
- This breaks the 8-run push failure streak

### SCH-003 Boolean Type Detection (RUN10-3) — VERIFIED
- Schema accumulator detects `is_*`, `has_*`, `should_*` prefixes and `force` suffix
- Converts `type: string` → `type: boolean` for matching attributes
- Tests cover all patterns including already-correct types
- Location: `src/coordinator/schema-extensions.ts` lines 178-186

### CDQ-007 Optional Chaining Guard (RUN10-4) — VERIFIED
- Dual fix: prompt guidance (teach) + post-generation validator (catch)
- Prompt in `src/agent/prompt.ts` shows correct guard pattern with `if` check
- Validator regex in `test/helpers/rubric-checks.ts` detects `?.` in setAttribute values
- Integrated into acceptance gate (CDQ-007 check)
- Tests cover both positive and negative cases

### Weaver CLI Retry (RUN10-2) — VERIFIED
- Single retry added to `validateRegistryCheck` in `src/coordinator/dispatch.ts`
- No delay between retries (immediate retry)
- Tests mock the validator; retry logic itself not directly tested

## Target Repo (commit-story-v2)

- **Branch**: main
- **Working tree**: Journal files present (not in src/, won't interfere)
- **spiny-orb.yaml**: Present
- **semconv/**: Present
- **File count**: 30 .js files in src/

## Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN9-3 PR schema changes omits span extensions | Run-9 | 2 runs | Fixed in PR #341 (span extensions in PR summary) |
| RUN7-7 span count self-report | Run-7 | 4 runs | Structurally unchanged |
| CJS require() in ESM projects | Run-2 #62 | 9 runs | Open spec gap, not triggered |

## Pre-Run Assessment

All P0 fixes landed and verified. All P1 fixes landed. The critical push auth issue appears resolved — token has correct permissions and dry-run push succeeded. Expecting:

- **Quality**: 25/25 target (both SCH-003 and CDQ-007 fixes verified)
- **Files**: 13 target (summary-manager.js should recover with Weaver retry)
- **Push/PR**: Expected to succeed (first time in 9 runs)
- **New failure risk**: LLM-generated code may introduce new patterns. 50% discount applies.
