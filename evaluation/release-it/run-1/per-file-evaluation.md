# Per-File Evaluation — Release-it Run-1

**Date**: 2026-04-18
**Branch**: spiny-orb/instrument-1776550755270 (wiggitywhitney/release-it)
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 5 of 23 processed (0 committed, 2 failed, 3 correct skips; 18 not reached)

**Evaluation scope**: This is a significantly constrained evaluation. No files were committed with instrumentation, and 18 files were never processed due to the checkpoint test halt. Coverage and quality rules can only be assessed for correct-skip decisions. Failed file code is not assessable (rolled back). Gate checks are partially assessable.

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PARTIAL** | Correct-skip files (args.js, cli.js, log.js) are unchanged from original — syntax valid. config.js and index.js generated code was rolled back; syntax of the attempted instrumentation is unknown. Files 6–23 not processed. |
| NDS-002 (Tests) | **INCONCLUSIVE** | spiny-orb detected baseline test failures and disabled rollback. Root cause is `tag.gpgsign=true` in global git config, not instrumentation. No files were committed with instrumentation, so no behavioral regression is possible. The test suite failure is infrastructure, not instrumentation quality. |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api: ">=1.0.0"` in peerDependencies (added during setup) |
| API-003 | **PASS** | No vendor-specific OTel SDKs in dependencies or devDependencies |
| API-004 | **N/A** | No instrumented source files committed; no imports to evaluate |
| CDQ-008 | **N/A** | No `trace.getTracer()` calls added (expected — 0 files committed). PR summary advisory already noted this. |

---

## Correct Skips (3 files)

For correct-skip files, the relevant rubric question is: did the agent correctly identify that the file should not be instrumented? All three files were pure synchronous utilities with no async I/O — the correct-skip decision is sound.

### lib/args.js — 0 spans (correct skip)

**Export**: `parseCliArguments` — synchronous, no I/O  
**Decision quality**: SOUND — no LLM call made (agent recognized sync-only without spending tokens)

| Rule | Result | Notes |
|------|--------|-------|
| COV-001 | **N/A** | No async entry points exist in this file |
| COV-004 | **PASS** | `parseCliArguments` is synchronous; correct to omit spans per RST-001 |
| RST-001 | **PASS** | Correct application — sync utility correctly excluded |
| RST-002 | **N/A** | No accessor patterns |
| RST-004 | **N/A** | No internal async helpers |
| NDS-003 | **PASS** | File unchanged |

---

### lib/cli.js — 0 spans (correct skip)

**Exports**: `version`, `help` — both synchronous  
**Decision quality**: SOUND — no LLM call made

| Rule | Result | Notes |
|------|--------|-------|
| COV-001 | **N/A** | No async entry points |
| COV-004 | **PASS** | Both exports are synchronous; 0 spans correct per RST-001 |
| RST-001 | **PASS** | Correct application |
| NDS-003 | **PASS** | File unchanged |

---

### lib/log.js — 0 spans (correct skip)

**Exports**: Logger class — all methods synchronous console wrappers (log, error, info, warn, exec, verbose, obtrusive)  
**Decision quality**: SOUND — LLM call made (~1.6K output tokens), agent correctly worked through each method

| Rule | Result | Notes |
|------|--------|-------|
| COV-001 | **N/A** | No async entry points |
| COV-004 | **PASS** | All Logger methods are sync; RST-001 and RST-003 correctly applied |
| RST-001 | **PASS** | Sync utility correctly excluded |
| RST-003 | **PASS** | Thin wrapper exclusion correctly applied (console.log delegates) |
| NDS-003 | **PASS** | File unchanged |

**Note on token usage**: log.js required a small LLM call despite reaching the same conclusion as args.js/cli.js (0 spans). The 9-method Logger class required method-by-method reasoning; args.js and cli.js were simple enough to decide without an LLM call. This is appropriate behavior — the agent escalated correctly.

---

## Failed Files (2 files)

For files that failed, the generated instrumentation code was rolled back and cannot be inspected. Evaluation is limited to:
- Agent reasoning quality (from verbose output agent notes)
- Whether the intended instrumentation targets were correct

### lib/config.js — LINT oscillation (3 attempts, $0.29)

**Intended span**: `release_it.config.init`  
**Intended attributes**: `release_it.is_ci`, `release_it.is_dry_run`

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | **Not assessable** | Code rolled back; generated content unknown |
| API-001 | **Not assessable** | Code rolled back |
| COV-001 | **Agent reasoning: SOUND** | `Config.init()` is the only exported async entry point; identified correctly |
| COV-004 | **Agent reasoning: SOUND** | Internal async helpers (loadOptions, loadLocalConfig) correctly excluded per RST-004 |
| COV-005 | **Agent reasoning: SOUND** | `release_it.is_ci` and `release_it.is_dry_run` match schema attributes and operation semantics |
| RST-001 | **Agent reasoning: SOUND** | `expandPreReleaseShorthand()` correctly excluded as sync transform |
| RST-002 | **Agent reasoning: SOUND** | Inner helpers (resolveFile, resolveDir, etc.) correctly excluded as sync one-liners |
| RST-004 | **Agent reasoning: SOUND** | Unexported async functions correctly covered by orchestrator span |
| LINT | **FAIL** | Likely `arrowParens: "avoid"` violation — `(span) =>` vs required `span =>`. See failure-deep-dives.md. |

**Agent reasoning quality**: High. The instrumentation design decisions documented in the agent notes are correct. The failure was in code generation style, not instrumentation logic.

---

### lib/index.js — LINT oscillation (3 attempts, $0.35)

**Intended span**: `release_it.run_tasks`  
**Intended attributes**: `release_it.version.increment` (guarded), `release_it.version.next` (guarded), `release_it.package_name` (guarded)

| Rule | Result | Notes |
|------|--------|-------|
| NDS-003 | **Not assessable** | Code rolled back |
| API-001 | **Not assessable** | Code rolled back |
| COV-001 | **Agent reasoning: SOUND** | `runTasks` is the sole exported async function; identified correctly |
| COV-004 | **Agent reasoning: SOUND** | Internal hooks (runHook, runLifeCycleHook) correctly excluded per RST-004 |
| CDQ-001 | **Agent reasoning: SOUND (identified gap)** | Agent correctly noted that 4 `process.exit()` calls inside try block will prevent `span.end()` from firing in finally — genuine CDQ-001 gap documented |
| CDQ-007 | **Agent reasoning: SOUND** | Null guards on `reduceUntil` returns correctly applied |
| RST-004 | **Agent reasoning: SOUND** | Unexported internal async functions correctly excluded |
| LINT | **FAIL** | Same `arrowParens: "avoid"` failure as config.js |

**Agent reasoning quality**: High. The CDQ-001 observation about `process.exit()` blocking span.end() is a sophisticated finding that identifies a genuine structural limitation. Null guards on `reduceUntil` results show correct understanding of the API.

---

## Files Not Reached (18 files)

The following files were never processed due to the checkpoint test halt at file 5:

```text
lib/prompt.js
lib/shell.js
lib/spinner.js
lib/util.js
lib/plugin/GitBase.js
lib/plugin/GitRelease.js
lib/plugin/Plugin.js
lib/plugin/factory.js
lib/plugin/git/Git.js
lib/plugin/git/prompts.js
lib/plugin/github/GitHub.js
lib/plugin/github/prompts.js
lib/plugin/github/util.js
lib/plugin/npm/npm.js
lib/plugin/npm/prompts.js
lib/plugin/gitlab/GitLab.js
lib/plugin/gitlab/prompts.js
lib/plugin/version/Version.js
```

These files represent the core of the release-it plugin system — the Git, GitHub, GitLab, and npm plugins are where the majority of async I/O lives. No rubric evaluation is possible for these files. They are a full coverage gap for run-1.

**Expected profile for run-2** (if checkpoint test is resolved): Plugin files will have the most instrumentation opportunities. Git.js, GitHub.js, and npm.js each perform multiple async I/O operations (API calls, shell commands, filesystem writes) that map directly to COV-001, COV-004, and COV-005.

---

## Summary

| Category | Files | Rubric Status |
|----------|-------|---------------|
| Correct skips | 3 | All gate and skip-decision rules PASS |
| LINT failures | 2 | Code not assessable; agent reasoning quality high |
| Not reached | 18 | No evaluation possible |
| **Total evaluated** | **5 of 23** | **Insufficient for run-level rubric scoring** |

Run-1 cannot produce meaningful rubric scores. The evaluation documents: (1) correct-skip decisions are sound, (2) agent reasoning on the two failed files was high-quality — the LINT failure is a code style issue, not a logic failure, (3) the 18 not-reached files are the main gap.
