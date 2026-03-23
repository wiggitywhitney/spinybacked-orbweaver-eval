# Lessons for PRD #11 — Collected During Run-10

Process lessons and methodology improvements observed during run-10 evaluation. These inform the next evaluation run's PRD.

Separate from spiny-orb software findings (see `spiny-orb-findings.md`).

## Pre-Run Verification

1. **Handoff triage completeness**: The spiny-orb team addressed 7/7 items (5 findings + 2 additional). Zero rejected. This is the second consecutive run with 100% triage acceptance. The actionable-fix-output format is validated as an effective handoff mechanism.

2. **File parity**: commit-story-v2 proper has 30 .js files (same as run-9). 29 will be processed (instrumentation.js excluded).

3. **Push auth mechanism change**: Remote URL swap approach (set pushurl in git config) replaces direct URL-as-argument push. Diagnostic logging at both validation time and push time should make failure mode immediately clear.

4. **Reassembly validator fix is deterministic**: Unlike journal-graph.js "non-determinism" in runs 7-8, the root cause was identified (extensions not passed to reassembly validation) and fixed with a code change. Prediction: journal-graph.js should commit on first attempt.

5. **spiny-orb build**: v0.1.0 from main (75dcea6). Built from main branch (verified).

## Evaluation Run

1. **Push auth: URL swap works but token rejected**. Diagnostic logging confirms `GITHUB_TOKEN present=true` and `urlChanged=true, path=token-swap`. The URL swap fix (PRs #261, #272, #277) is now working correctly. But GitHub responds with "Password authentication is not supported for Git operations." This means the GCP secret `github-token` may lack `repo` write scope, or the token format is incompatible with the `x-access-token` URL scheme. Pre-run verification tested `git ls-remote` (read) but not `git push --dry-run` (write). Future pre-run verification should test write access explicitly.

2. **journal-graph.js committed after 3 attempts (76.3K tokens)**. The reassembly validator extension fix worked — span names declared in agent-extensions.yaml are now accepted by the SCH-001 check. However, 3 attempts and 76.3K tokens is expensive. The first 2 attempts likely failed on other validation checks (NDS-003 or similar). This file remains the most expensive per run.

3. **Prediction accuracy**: Predicted journal-graph.js would commit (correct) but also predicted "first-attempt success" (wrong — 3 attempts). The reassembly validator fix prevented the SCH-001 rejection that caused run-9's failure, but other validation checks still cause retries. The 50% discount was appropriate.

4. **summary-manager.js failed due to Weaver CLI**. The `weaver registry resolve` command failed mid-execution during schema extension writing. The instrumentation code was generated correctly (3 spans). This is a transient infrastructure failure, not a quality issue. The registry had 21 files' worth of extensions accumulated when this failure occurred — large registry size may be a factor.

5. **File composition shift**: journal-graph.js gained (partial→committed), summary-manager.js lost (committed→failed). Net 12 files, same as run-9, but different composition. The summary-manager.js loss is transient; the journal-graph.js gain is a genuine fix.

6. **30 files processed (not 29)**: traceloop-init.js was included this time (0 spans, correct skip). Run-9 processed 29 files — instrumentation.js was excluded but traceloop-init.js was also excluded. The difference is likely due to the `src` path argument (run-10) vs the eval repo's file list.

7. **PR summary committed on instrument branch**: RUN9-7 fix confirmed working. The summary appears in `git log` on the instrument branch.

## Per-File Evaluation

_Observations appended during milestone 5._

## PR Evaluation

_Observations appended during milestone 6._

## Scoring & Comparison

_Observations appended during milestones 7-8._

## Actionable Fix Output

_Observations appended during milestone 9._
