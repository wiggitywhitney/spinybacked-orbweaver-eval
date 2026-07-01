# Run Summary — release-it Run 4

**Date**: 2026-05-06
**Duration**: 1h 25m 34.9s
**spiny-orb SHA**: 8dc65bf (main)
**Instrument branch**: spiny-orb/instrument-1778091147901

---

## Results

| Metric | Value |
|--------|-------|
| Files committed | 7 |
| Files failed | 6 |
| Files partial | 0 |
| Correct skips | 10 |
| Total processed | 23 |
| Total spans | 20 |
| Total attributes | 8 |
| Input tokens | 218.8K |
| Output tokens | 334.7K (219.1K cached) |
| Estimated cost | ~$5–6 |
| Push | ✅ SUCCEEDED — branch pushed to wiggitywhitney/release-it |
| PR | ❌ FAILED — spawn E2BIG (PR body too large for command-line arg) |
| Live-check | ✅ OK — 2173 spans, 15389 advisory findings |

---

## Committed Files

| File | Spans | Attributes | Attempts |
|------|-------|-----------|---------|
| lib/config.js | 3 | 1 | 1 |
| lib/plugin/Plugin.js | 1 | 0 | 1 |
| lib/plugin/factory.js | 2 | 2 | 1 |
| lib/plugin/git/Git.js | 10 | 4 | 2 |
| lib/plugin/version/Version.js | 1 | 0 | 3 |
| lib/shell.js | 2 | 0 | 2 |
| lib/util.js | 1 | 1 | 1 |

---

## Failed Files

| File | Failure Mode | Attempts |
|------|-------------|---------|
| lib/plugin/GitBase.js | LINT (Prettier line-length — span wrapper adds indentation, pushes lines over print width) | 3 |
| lib/plugin/GitRelease.js | LINT (same Prettier line-length issue) | 3 |
| lib/plugin/github/GitHub.js | NDS-003 ×8 (agent split/reformatted long lines — `flatMap`, emoji log strings) | 2 |
| lib/plugin/gitlab/GitLab.js | COV-003 (catch block missing recordException) + SCH-002 ×2 (asset_name attribute) | 2 |
| lib/plugin/npm/npm.js | NDS-003 ×26 (agent split destructuring and chained calls across lines) | 2 |
| lib/prompt.js | LINT (Prettier line-length) | 3 |

---

## Correct Skips (10)

lib/args.js, lib/cli.js, lib/index.js, lib/log.js — pure sync utilities (pre-scan)
lib/plugin/git/prompts.js, lib/plugin/github/prompts.js, lib/plugin/github/util.js — pure sync (pre-scan)
lib/plugin/gitlab/prompts.js, lib/plugin/npm/prompts.js — pure sync (pre-scan)
lib/spinner.js — pure sync (pre-scan)

---

## Key Observations

### RUN3-1 (pre-scan class methods) — VERIFIED FIXED
Git.js committed with 10 spans from async class methods — proof that PR #781 class method traversal fix works. The agent successfully found and instrumented class methods it couldn't see in run-3.

### RUN3-2 (gh pr create upstream targeting) — FIXED BUT NEW FAILURE
Push succeeded with the correct fork URL (`urlChanged=true`). PR creation failed with `spawn E2BIG` — the PR body content (which includes verbose live-check compliance report) is too large to pass as a command-line argument. The upstream targeting fix worked; the new failure is unrelated.

### LINT failures — NEW PATTERN (4 of 6 files)
Adding `startActiveSpan` wrapper adds 2 indentation levels. On files with long lines near Prettier's print width (appears to be 120 chars), this pushes them over the limit. The agent can't satisfy both NDS-003 (preserve original lines) and LINT (Prettier-compliant output) when the added indentation causes reformatting. GitBase.js, GitRelease.js, prompt.js failed this way.

### NDS-003 failures — LINE-SPLITTING BY AGENT (2 of 6 files)
GitHub.js and npm.js: agent actively split long lines across multiple lines (flatMap chain, destructuring assignments) when those lines became too long under the span wrapper's indentation. NDS-003 detected these as modifications of original lines.

### Live-check — FIRST RUN WITH REAL VALIDATION
2173 spans captured. 15389 advisory findings — all `missing_attribute` violations for resource attributes (`host.name`, `host.arch`, `process.pid`, etc.) injected by OTel SDK that aren't in the release-it schema. This is advisory-level, not a test failure. The live-check ran successfully against the committed code.
