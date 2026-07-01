# Pre-Run Verification — Run-12

Verification checks completed before executing `spiny-orb instrument` on commit-story-v2.

**Date**: 2026-04-09
**Target repo**: commit-story-v2 (`~/Documents/Repositories/commit-story-v2`)
**Spiny-orb branch**: `feature/prd-371-javascript-provider-extraction` (302e6b2)
**Spiny-orb version**: 1.0.0

---

## Step 1: Handoff Triage Review

No formal triage document exists in spinybacked-orbweaver for the run-11 actionable-fix-output. Instead, findings were acted on directly via merged PRs:

| Finding | Status | PR |
|---------|--------|----|
| RUN11-5: CDQ-007/NDS-003 conflict causes attribute dropping | **FIXED** | PR #352 (merged 2026-03-30) |
| RUN11-1: Advisory contradiction rate 45% | **FIXED** | PR #355 (merged 2026-03-30) |
| RUN11-2: journal-graph.js requires 2 attempts | UNRESOLVED | — |
| RUN11-3: Redundant span.end() in 2 files | UNRESOLVED | — |
| RUN11-4: Cost $4.25 exceeds $4.00 target | UNRESOLVED | (may improve if RUN11-5/RUN11-2 help) |

2/5 run-11 findings fixed. Both medium and the primary low finding (advisory contradiction rate) addressed.

---

## Step 2: Target Repo Readiness (commit-story-v2)

| Check | Status |
|-------|--------|
| spiny-orb.yaml exists | PASS |
| semconv/ directory exists | PASS (`agent-extensions.yaml`, `attributes.yaml`, `registry_manifest.yaml`) |
| Working tree clean | PASS (untracked journal files only — not relevant to instrumentation) |
| On `main` branch | **FAIL** — on `spiny-orb/instrument-1774849971011` |

**Action required before running**: `cd ~/Documents/Repositories/commit-story-v2 && git checkout main`

---

## Step 3: Push Auth Stability

- `git ls-remote` succeeded: read access confirmed
- `git push --dry-run` on existing branch: "Everything up-to-date" (no auth errors)
- Token stable from run-11 (fine-grained PAT with push permissions)

**Status: PASS** — push auth working.

---

## Step 4: RUN11-5 NDS-003 Validator Fix

**Status: FIXED** — PR #352, merged 2026-03-30.

The fix adds a regex pattern to `INSTRUMENTATION_PATTERNS` in `src/validation/tier2/nds003.ts`:

```text
/^\s*if\s*\(\s*(?:typeof\s+)?\w+(?:\.\w+)*\s*!==?\s*(?:undefined|null|['"]undefined['"])\s*\)\s*\{?\s*$/
```

Covers:
- `if (x !== undefined) {`
- `if (x != null) {`
- `if (typeof x !== 'undefined') {`
- Nested property access: `if (result.value !== undefined) {`

The agent can now guard optional attributes with defined-value checks without the NDS-003 validator flagging the guard line as non-instrumentation code. Attribute dropping (the run-11 symptom) should be resolved.

---

## Step 5: Advisory Judge Improvements (SCH-004/CDQ-006)

**Status: FIXED** — PR #355, merged 2026-03-30.

Two targeted changes:

**SCH-004** — Added 0.7 confidence threshold:
```typescript
if (!result.verdict.answer && result.verdict.confidence >= 0.7) {
  // Judge says this IS a semantic duplicate (with sufficient confidence)
```
Low-confidence hallucinations (e.g., flagging `summarize.force` as equivalent to `gen_ai.request.max_tokens`) are now discarded instead of surfaced as advisory findings.

**CDQ-006** — Broadened trivial-conversion exemptions:
- Before: only `.toISOString` and `.toString`
- After: all `to*String`, `.toJSON`, `.toFixed`, `.toPrecision` methods + standalone `get*String` getters

Both run-11 false positives (SCH-004 hallucination, CDQ-006 flagging `toISOString`/`getDateString`) are addressed by these changes.

---

## Step 6: File Inventory

commit-story-v2 `src/` contains **30 .js files** — same as run-11. No new source files added since the last run.

```text
src/collectors/claude-collector.js
src/collectors/git-collector.js
src/commands/summarize.js
src/generators/journal-graph.js
src/generators/prompts/guidelines/accessibility.js
src/generators/prompts/guidelines/anti-hallucination.js
src/generators/prompts/guidelines/index.js
src/generators/prompts/sections/daily-summary-prompt.js
src/generators/prompts/sections/dialogue-prompt.js
src/generators/prompts/sections/monthly-summary-prompt.js
src/generators/prompts/sections/summary-prompt.js
src/generators/prompts/sections/technical-decisions-prompt.js
src/generators/prompts/sections/weekly-summary-prompt.js
src/generators/summary-graph.js
src/index.js
src/integrators/context-integrator.js
src/integrators/filters/message-filter.js
src/integrators/filters/sensitive-filter.js
src/integrators/filters/token-filter.js
src/managers/auto-summarize.js
src/managers/journal-manager.js
src/managers/summary-manager.js
src/mcp/server.js
src/mcp/tools/context-capture-tool.js
src/mcp/tools/reflection-tool.js
src/traceloop-init.js
src/utils/commit-analyzer.js
src/utils/config.js
src/utils/journal-paths.js
src/utils/summary-detector.js
```

Expect 30 files processed, same scope as run-11.

---

## Steps 7–8: Rebuild and Version

Built from `feature/prd-371-javascript-provider-extraction` (user preference; this branch is ahead of main and includes all main fixes).

| Item | Value |
|------|-------|
| Version | 1.0.0 |
| Branch | `feature/prd-371-javascript-provider-extraction` |
| Git hash | 302e6b2 |
| Commits ahead of main | 15 (PRD #371 JavaScript provider extraction) |
| Build result | CLEAN (no TypeScript errors) |

**Important**: This build includes PRD #371 work (LanguageProvider interface, JavaScriptProvider, B1/B2/B3 checker split) in addition to the targeted run-11 fixes. This is a significant architectural change to the agent's checker pipeline. Run-12 is the first evaluation run using this architecture.

### Findings Status at Build Time

| Finding | Status |
|---------|--------|
| RUN11-1: Advisory contradiction rate 45% | FIXED (PR #355) |
| RUN11-2: journal-graph.js 2 attempts | UNRESOLVED |
| RUN11-3: Redundant span.end() in 2 files | UNRESOLVED |
| RUN11-4: Cost $4.25 exceeds $4.00 | UNRESOLVED |
| RUN11-5: CDQ-007/NDS-003 conflict | FIXED (PR #352) |

---

## Run-12 Prerequisites Checklist

- [x] spiny-orb built from current branch (302e6b2), build clean
- [x] Run-11 P1 finding (RUN11-5) fixed and verified
- [x] Advisory judge improvements (RUN11-1) fixed and verified
- [x] Push auth stable
- [ ] **Whitney must**: `cd ~/Documents/Repositories/commit-story-v2 && git checkout main` before running `spiny-orb instrument`

---

## Score Projection for Run-12

From run-11 actionable-fix-output §7, with updates:

**Minimum (no behavior change from PRD #371 refactor):**
- Quality: 25/25 (no known quality failures in baseline)
- Files: 13
- Push/PR: YES

**Target (with NDS-003 fix active):**
- Quality: 25/25 + improved attribute completeness (messages_count, gen_ai.usage.* may be preserved)
- Files: 13
- Cost: ≤$4.00 if journal-graph.js improves to 1 attempt
- Advisory contradiction rate: <30% (SCH-004/CDQ-006 fix)

**Wild card**: PRD #371 refactor (LanguageProvider/JavaScriptProvider) is a new architectural variable. Could improve or introduce unexpected behavior. First run with this architecture.
