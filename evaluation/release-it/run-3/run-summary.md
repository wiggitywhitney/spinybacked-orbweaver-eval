# release-it Run 3 — Evaluation Summary

**Date:** 2026-05-04
**Started:** 16:38:26 UTC
**spiny-orb branch:** `feature/prd-687-smarter-end-of-run-failure-handling` (SHA 3d69f96)
**Node.js:** v25.8.0
**release-it version:** 20.0.0
**Files processed:** 23/23 (`lib/`)

---

## Run Outcome

| Metric | Run-3 | Run-2 (baseline) |
|--------|-------|------------------|
| Files processed | 23/23 | 23/23 |
| Committed (net) | 3 | 0 (checkpoint rollbacks) |
| Failed | 2 | 8 (6 LINT, 1 NDS-003, 1 COV-003) |
| Partial | 0 | 0 |
| Correct skips | 18 | 3 |
| Tokens (input) | 33.2K (33.2K cached) | — |
| Tokens (output) | 73.9K | — |
| Push | YES (branch on remote) | YES |
| PR | FAILED (createPr crash, created manually as PR#2) | FAILED (PAT scope) |

---

## Committed Files

| File | Spans | Attributes | Attempts |
|------|-------|------------|----------|
| lib/config.js | 3 | 0 | 2 |
| lib/plugin/factory.js | 2 | 1 | 3 |
| lib/util.js | 1 | 1 | 1 |

**Total spans committed:** 6  
**Total new attributes:** 2 (`release_it.plugin.external_count`, `release_it.util.collection_size`)

---

## Failed Files

### lib/plugin/git/Git.js — `Anthropic API call failed: terminated`

The agent completed its thinking (full reasoning trace captured) but the Anthropic API call was terminated mid-generation. This is an infrastructure failure, not a validation failure. The file had rich instrumentation planned (4 spans: `check_repo`, `init`, `release`, `push`; 1 attribute: `release_it.git.is_repo`). 2 attempts, both terminated.

### lib/plugin/gitlab/GitLab.js — COV-002 oscillation

Oscillation on COV-002: fetch at line 188 has no enclosing span. 3 attempts, all producing the same COV-002 failure. Pre-scan note says "no instrumentable functions" — this appears to be a pre-scan false-negative where the fetch call was detected as needing a span by the validator but the pre-scan marked the file as skippable.

---

## Correct Skips (18)

All of the following were correctly pre-scanned as containing only pure synchronous utilities or unexported helpers with no instrumentable async functions:

`args.js`, `cli.js`, `index.js`, `log.js`, `GitBase.js`, `GitRelease.js`, `Plugin.js`, `git/prompts.js`, `GitHub.js`, `github/prompts.js`, `github/util.js`, `gitlab/prompts.js`, `npm/npm.js`, `npm/prompts.js`, `Version.js`, `prompt.js`, `shell.js`, `spinner.js`

---

## Notable Changes vs Run-2

**LINT failures eliminated (6 → 0):** All 6 files that failed LINT in run-2 were correctly pre-scanned as having no instrumentable functions in run-3. The prd-687 pre-scan improvements appear to be the driver — files like `index.js` that the agent incorrectly tried to instrument in run-2 are now correctly skipped.

**Correct skips increased (3 → 18):** Major improvement in pre-scan accuracy. The vast majority of lib/ files are pure sync utilities that the agent now correctly skips without making LLM calls.

**GitHub.js correctly skipped:** In run-2, GitHub.js failed with NDS-003 (6 failures). In run-3, it was pre-scanned as having no instrumentable functions. This needs validation — GitHub.js uses Octokit and should have async instrumentation candidates. Either the pre-scan correctly identified unexported methods as the only async functions, or this is a false negative.

**Push succeeded, PR creation failed silently:** The branch (`spiny-orb/instrument-1777912706406`) was pushed to remote by spiny-orb. PR creation (`createPr`) crashed in a way that bypassed the try-catch in git-workflow.js, killing the process before the `finally` block could print "Completed in..." and leaving no error in the log. PR was created manually as https://github.com/wiggitywhitney/release-it/pull/2. See FINDING-RUN-1 in spiny-orb-findings.md.

---

## Instrument Branch

**Branch:** `spiny-orb/instrument-1777912706406` (pushed to remote by spiny-orb)  
**PR:** https://github.com/wiggitywhitney/release-it/pull/2 (created manually after createPr crash)

---

## Pre-Run Blocker (resolved)

The weaver prerequisite check (new in prd-687) downloads the OTel semconv dependency zip at runtime. Under `vals exec`, HOME is stripped from the subprocess environment, preventing weaver from writing to `~/.weaver/vdir_cache/`. The download hangs and hits the 30s execFileSync timeout. Fixed by adding `HOME="$HOME"` to the instrument command's `env` prefix. See FINDING-PRE-1 in `spiny-orb-findings.md`.
