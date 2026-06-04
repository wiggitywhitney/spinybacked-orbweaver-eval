# Lessons for PRD #22

Run-21 observations to carry forward into the next evaluation run PRD.

## Process Observations

### Pre-run verification findings (2026-06-04)

- **RUN20-1 fix confirmed landed** — PR #905 (`e37996e fix(nds003): preserve file-level trivia when first-position OTel import is removed`). Code at lines 515–541 of `nds003-ast-stripper.ts` now extracts leading trivia from a first-position OTel import and replaces the node with the trivia text instead of dropping it. A regression fixture for the mcp/server.js pattern should exist.
- **RUN19-2 potentially addressed by PRD #902** — Deterministic schema auto-registration (PR #913) adds LLM judge + deterministic attribute key extraction wired into the per-attempt validation pipeline. This directly targets the "documented but not acted on" asymmetry for git-collector.js. Run-21 will be the first test.
- **Other fixes since run-20**: PR #911 (union file-level framework detection in fallback path); PR #910 (retry loop research); PRD #894 (CDQ-006 guidance rewrite + NDS-003 tests added); PR #914 (rules-coherence hook and docs audit).
- **RUN20-4 (summary-manager.js read-path)**: `result.count` examples already present in prompt.ts at multiple locations; no targeted new guidance found.
- **spiny-orb**: 1.0.0 (SHA 9f3f6b9, main). Build clean.
- **Target repo**: commit-story-v2 on main, 30 JS files, spiny-orb.yaml and semconv/attributes.yaml present, push auth confirmed.
- **README**: Rows for runs 19 and 20 are absent — add in "Update root README" milestone.

## Rubric Gaps or Clarifications Needed

*(populate during per-file evaluation)*

## Carry-Forward Items

*(populate during actionable fix output)*
