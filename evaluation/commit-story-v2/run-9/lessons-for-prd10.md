# Lessons for PRD #10 — Collected During Run-9

Process lessons and methodology improvements observed during run-9 evaluation. These inform the next evaluation run's PRD.

Separate from spiny-orb software findings (see `spiny-orb-findings.md`).

## Pre-Run Verification

1. **Handoff triage completeness**: The spiny-orb team addressed 10/10 P0+P1 recommendations and 1/2 P2. Zero findings rejected. This validates the actionable-fix-output format as an effective handoff mechanism. Consider formalizing the format for future runs.

2. **Two-repo file parity**: commit-story-v2 proper has 30 .js files (identical to eval repo). The 30th file (`instrumentation.js`) was added by PRD #51 after run-8. Future run PRDs should use the actual target repo file count, not a hardcoded number.

3. **Push auth mechanism change**: The move from credential-helper-based auth to token-embedded-URL auth (x-access-token scheme) is a fundamental architecture change, not an incremental fix. Prior 6 failures were all attempting variants of credential helper usage. This should be documented as a pattern for future HTTPS-based git operations with tokens.

4. **vals exec + GITHUB_TOKEN interaction**: When `vals exec` injects GITHUB_TOKEN, raw `git push` fails because git tries to use it as a password via the credential helper — but GitHub deprecated password auth. This is NOT a bug in spiny-orb or vals; it's an expected interaction. Spiny-orb correctly works around it by embedding the token in the URL.

5. **API-004 evaluation context shift**: Run-9 is the first run where API-004 should PASS because the target repo (commit-story-v2 proper) has sdk-node in devDependencies. The eval repo still has it in peerDependencies (issue #23 open). Future PRDs should clearly state which repo's package.json is being evaluated for API rules.

6. **Score projection ceiling change**: With both API-004 and SCH-003 expected to pass, the theoretical ceiling is 25/25 (first time). The 50% discount methodology still applies — expect 24-25/25 after discount.

## Evaluation Run

1. **Push auth: pre-run verification was misleading.** `git ls-remote` with the token-embedded URL succeeded, but the actual `pushBranch()` flow didn't swap the URL. The error message shows the bare HTTPS URL — the `resolveAuthenticatedUrl()` path wasn't reached. Pre-run verification should test the actual push code path (e.g., `git push --dry-run` with the token-embedded URL), not just `git ls-remote`.

2. **journal-graph.js root cause identified.** The diagnostic logging (PR #277) revealed the specific failure: SCH-001 reassembly validator rejects the extension span name `commit_story.journal.generate_sections` as "not found in registry span definitions." The validator checks the base registry but not the extensions declared during the same run. This is a concrete, fixable bug — not non-deterministic after all.

3. **Cost guard working as designed.** journal-graph.js was limited to 2 attempts (91.4K tokens) vs 3 attempts (70.4K) in run-8. The guard prevented further waste, though 91.4K is still 50.7% of total output tokens for zero committed value.

4. **SCH-003 fix confirmed in production.** All 6 count attributes in agent-extensions.yaml use `type: int`. The dual-layer protection (write-time correction + validation-time check) worked as verified in pre-run.

5. **File parity with eval repo confirmed.** All 12 committed files are identical to run-8. 16 correct skips match. instrumentation.js was excluded from processing (29 files, not 30) — spiny-orb appears to recognize OTel bootstrap code automatically.

## Live Telemetry Validation

_Observations appended during milestone 4._

## Per-File Evaluation

_Observations appended during milestone 6._

## PR Evaluation

_Observations appended during milestone 7._

## Scoring & Comparison

_Observations appended during milestones 8-9._

## Actionable Fix Output

_Observations appended during milestone 10._
