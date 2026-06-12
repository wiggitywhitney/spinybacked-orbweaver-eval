# Lessons for PRD #24

Run-23 observations to carry forward into the next evaluation run PRD.

## Run-23 Key Findings

*(populate during per-file evaluation and actionable fix output)*

## Process Observations

### Pre-run verification (2026-06-10)

- **RUN21-1 (NDS-003 blank-line-near-JSDoc, issue #917)**: Fix landed in `ee856c3` — corrects trivia doubling in `removeOtelImports` for first-statement OTel import with shebang + file-level JSDoc. Issue closed. Expect mcp/server.js to commit cleanly in run-23.
- **RUN21-2 (import expansion NDS-003, issue #916)**: Fix landed in `412da5b` — explicit prompt guidance: "Do NOT reformat existing import declarations... do not expand a single-line `import { a, b, c }` into a multi-line block." Issue closed.
- **RUN21-3 (CDQ-001 double-end, issue #915)**: Fix landed in `412da5b` + `aad9835`. Note: `aad9835` reverted the "startActiveSpan auto-closes" claim to "always call span.end() in finally, @opentelemetry/api does not auto-close." The corrected guidance should prevent double-ending.
- **RUN21-4 (COV-005 input attribute placement)**: Fix landed in `412da5b` — guidance added: set input attributes unconditionally before early-return guards.
- **RUN21-6 (notes vs committed code divergence, issue #918)**: Fix landed in `b579e5a` — FileResult.notes now reflects committed code, not discarded attempts. Issue closed.
- **README table gap**: README was missing rows for runs 19, 20, 21 — added during pre-run verification. Future PRDs should add the row immediately after updating the README at each run's conclusion.
- **Datadog spans**: 381 spans in last 7 days, all from 2026-06-04 (run-21 execution day). No organic traffic since then (expected — app runs on demand). Most recent complete journal generation run: service.instance.id 672acab3-4f86-478e-80e1-534c05e474b1, revision 9dda3af (run-21 branch HEAD). ✅
- **Auth dry-run**: PASSED using commit-story-v2/.vals.yaml GITHUB_TOKEN.

## Run-23 Execution Notes

- `spiny-orb-output.log` is gitignored by `*.log` in the root `.gitignore`. Requires `git add -f evaluation/commit-story-v2/run-23/spiny-orb-output.log` to stage. This applies to all future run log files.
- summary-detector.js: new failure class — SCH-002, agent declared `commit_story.journal.base_path` as a new extension but the validator identified it as a semantic duplicate of the existing `commit_story.journal.file_path`. See failure-deep-dives.md for root cause analysis.

## Rubric Gaps or Clarifications Needed

*(populate during per-file evaluation)*

## Carry-Forward Items

*(populate during actionable fix output)*
