# Lessons for PRD #22

Run-21 observations to carry forward into the next evaluation run PRD.

## Run-21 Key Findings

- **Multi-line collapse NDS-003 is a new failure class**: Both mcp/server.js and index.js fail because the LLM collapses multi-line `import {` blocks and multi-line function call arguments onto single lines. index.js had 152 violations and was clean in runs 17–20. mcp/server.js has this as a second independent NDS-003 issue (the trivia-loss fix resolved line 1 / shebang, but lines 2/3/31/33/34 fail via this pattern). This needs a targeted spiny-orb fix.
- **PRD #902 auto-registration: step change in coverage**: ~60 new schema extensions in one run. summary-manager 4→9 spans, summary-detector 1→5, git-collector 2→6. Schema self-reinforcement observed (`entries_count` registered once, reused cleanly in 4 files). Scrutinize semantic stretches: `weekly_summaries_count` used for monthly context; `entries_count` used for 3 different things.
- **Attempt rate improvement is real**: 3-attempt rate dropped from 46% (run-20) to 8% (run-21). NDS-003 pressure relief from PR #905 is the driver.
- **journal-paths.js span**: `ensureDirectory` (async mkdir) was skipped in prior runs but correctly instrumented in run-21. Per-file eval should verify this was appropriate.
- **filters/sensitive-filter.js span drop**: Was 1 span in run-20, now a correct skip. Code refactored into subdirectory; verify it's truly sync-only now.
- **4495 live-check advisory findings**: High count; compare against run-20 baseline during IS scoring.
- **Use Read tool for log monitoring**: `wc` and `sed` require manual approval. Use `Read(file_path=..., offset=N)` for all log file checks during spiny-orb runs.
- **Attempt count inference**: spiny-orb only prints attempt count when > 1. No count = 1 attempt.

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
