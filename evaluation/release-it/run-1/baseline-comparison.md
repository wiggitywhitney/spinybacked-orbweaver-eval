# Baseline Comparison — Release-it Run-1 vs Commit-story-v2 Run-13

**Note**: This is a new JavaScript target (release-it) being compared against the most recent commit-story-v2 run (run-13). A meaningful quality comparison is not possible for run-1 — 0 files were committed with instrumentation. This document records what CAN be compared at run-1 and projects what a full baseline comparison will look like after run-2.

---

## Target Repository Characteristics

| Characteristic | release-it | commit-story-v2 |
|----------------|-----------|-----------------|
| Total .js files in source | 23 (lib/) | 30 (src/) |
| Source directory | `lib/` | `src/` |
| Domain | Release automation (git tagging, GitHub/GitLab/npm publishing) | AI-powered git commit journaling |
| Module system | ESM (`"type": "module"`) | ESM (`"type": "module"`) |
| Prettier config | printWidth 120, trailingComma none, arrowParens avoid | Default (80 printWidth) |
| Test suite | ava (tap-style) with tag-signing constraints | vitest |
| LLM dependency | None (pure release tooling) | Heavy (@langchain/anthropic, MCP) |
| External API calls | GitHub REST, GitLab REST, npm registry | Anthropic API |
| spiny-orb version | 1.0.0 (SHA a02004f) | 1.0.0 (SHA f6d482f) |

The domain difference is significant: release-it's async I/O is concentrated in plugin code (Git operations, HTTP API calls to GitHub/GitLab/npm) rather than LLM calls. This should produce a different skip rate and span distribution than commit-story-v2.

---

## Run Statistics Comparison

| Metric | release-it Run-1 | commit-story-v2 Run-13 | Notes |
|--------|-----------------|----------------------|-------|
| Files in source | 23 | 30 | |
| Files processed | 5 (22%) | 30 (100%) | Run halted at file 5 |
| Committed | 0 | 7 | |
| Failed | 2 | 11 | Different failure modes |
| Correct skips | 3 (of 5 processed) | 11 (37% of 30) | release-it skip rate inflated — only utility files processed |
| Total spans | 0 | 8 (7 committed + 1 partial) | |
| Cost | $0.68 | ~$6.41 | Not comparable — 5 vs 30 files |
| Duration | 22m 24s | 1h 5m 40s | Not comparable |
| Push/PR | NO (PAT gap) | YES (PR #62) | |

---

## Quality Score Comparison

| Dimension | release-it Run-1 | commit-story-v2 Run-13 |
|-----------|-----------------|----------------------|
| NDS | N/A | 2/2 (100%) |
| COV | N/A | 4/5 (80%) |
| RST | N/A | 4/4 (100%) |
| API | 2/2 assessable (PASS) | 3/3 (100%) |
| SCH | N/A | 4/4 (100%) |
| CDQ | N/A | 6/7 (86%) |
| **Quality total** | **N/A** | **23/25 (92%)** |
| Gates | N/A | 5/5 (100%) |

**Cross-target quality comparison is deferred to run-2.**

---

## What Can Be Compared

### Correct-Skip Decision Quality

Of the 5 files processed, 3 were correct skips — all pure synchronous utilities:
- **args.js, cli.js**: No LLM call needed (agent recognized sync-only immediately)
- **log.js**: Small LLM call to reason through 9 synchronous Logger methods

The 3 correct skips show the agent applying RST-001 (no utility spans) correctly. commit-story-v2 run-13 had 11 correct skips out of 30 files (37%) — mostly prompt constant files and utility modules. release-it's 5 processed files included 3 sync-only utilities at the start of the alphabetical lib/ list; the remaining 18 (plugin files) are expected to be mostly instrumentable.

**Projected release-it skip rate** (run-2, if checkpoint resolves): The 3 confirmed correct skips plus the expected correct skips from `lib/plugin/*/prompts.js` files (likely prompt-only modules) suggests a skip rate around 20-30% — lower than commit-story-v2's 37% because release-it has more async I/O in its plugin classes.

### Agent Reasoning Quality (Pre-Commit)

| Observation | release-it | commit-story-v2 Run-13 |
|-------------|-----------|----------------------|
| Entry point identification | Correct (Config.init, runTasks) | Correct on committed files |
| Internal helper exclusion | Correct (RST-004 applied) | Correct |
| Schema extension proposals | 2 proposed (neither committed) | Included in committed files |
| Structural limitation noted (process.exit CDQ-001 gap) | YES — agent identified it | N/A (no similar pattern) |
| Null guard reasoning | Correct (reduceUntil may return undefined) | CDQ-007 failure in run-13 |

The release-it agent reasoning quality is comparable to commit-story-v2 and correctly handles a structural pattern (process.exit) that has no equivalent in commit-story-v2.

### Infrastructure Failures

| Issue | release-it Run-1 | commit-story-v2 (historical) |
|-------|-----------------|------------------------------|
| Checkpoint test halt | YES (gpgsign) | YES (run-13: 2 checkpoints failed) |
| PR creation failure | YES (PAT scope) | NO (resolved in run-11) |
| LINT oscillation | YES (2 files) | NO prior runs |

release-it introduces two new failure modes not seen in commit-story-v2 history: LINT oscillation (Prettier arrowParens) and gpgsign checkpoint halt. The PR creation issue is the same class as commit-story-v2's push auth history (resolved in run-11 after 8 runs).

---

## Projected Run-2 Baseline

If all three run-1 blockers are resolved:

| Metric | Projected release-it Run-2 | commit-story-v2 Run-13 |
|--------|---------------------------|----------------------|
| Files processed | 23/23 | 30/30 |
| Estimated correct skips | 5–8 | 11 |
| Estimated committed | 12–16 | 7 |
| Expected quality | Comparable to cs-v2 (25/25 possible) | 23/25 |
| Duration | ~31 min | 65 min |
| Cost | ~$3–5 | ~$6.41 |
| Push/PR | Expected YES (if PAT fixed) | YES |

**Expected quality**: The release-it agent reasoning was high-quality in run-1. If LINT oscillation is resolved (Prettier diff surfacing), the two failed files (config.js, index.js) should commit cleanly in run-2. The 18 plugin files are largely async I/O — expect high committed-file counts and diverse rubric coverage.

**Expected cross-target differences** (run-2 vs commit-story-v2):
- Higher COV-006 exercise: release-it uses `undici` (HTTP) which is in KNOWN_FRAMEWORK_PACKAGES (added in PR #506). Expect auto-instrumentation recommendations.
- Different CDQ-001 pattern: `process.exit()` inside try blocks in index.js is a structural constraint with no commit-story-v2 equivalent.
- No LLM-related spans: release-it has no Anthropic API calls, so gen_ai.* attribute patterns won't appear.

---

## Summary

| Comparison axis | Status |
|----------------|--------|
| Quality scores | Deferred to run-2 |
| Infrastructure | 3 new blockers identified (checkpoint/gpgsign, LINT/arrowParens, PAT/createPR) |
| Agent reasoning | High quality on processed files |
| Domain fit | Good — plugin architecture has rich async I/O for instrumentation |
| Run-2 readiness | Conditional on resolving 3 blockers |
