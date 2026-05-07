# Per-File Evaluation — release-it Run 4

**Date**: 2026-05-06
**Branch**: spiny-orb/instrument-1778091147901
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 23 (7 committed + 6 failed + 10 correct skips)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check` exits 0 on all 7 instrumented files (verified on instrument branch) |
| NDS-002 (Tests) | **PASS** | 230 pass, 32 fail, 2 skipped — same 32 failures present on main branch before instrumentation; all failures are pre-existing infrastructure errors (`git tag` in temp directories); instrumentation introduced zero regressions |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api: 1.9.1` in devDependencies; `@opentelemetry/api: >=1.0.0` in peerDependencies — correct placement for a package distributed both as CLI and library |
| API-003 | **PASS** | No vendor-specific OTel SDK packages in any dependency section |
| API-004 | **PASS** | No `@opentelemetry/sdk-*` or instrumentation package imports in any committed file |
| CDQ-008 | **PASS** | All 7 committed files use `trace.getTracer('release-it')` consistently |

---

## Committed Files (7)

### 1. lib/config.js (3 spans, 1 attempt)

Spans: `release_it.config.init`, `release_it.config.load_options`, `release_it.config.load_local_config`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — original error handling in all three functions preserved; spans wrap without restructuring |
| COV-001 | PASS — `Config.init()` is the exported async entry point for the Config class |
| COV-003 | PASS — all three spans: `recordException` + `setStatus(ERROR)` + rethrow in catch |
| COV-004 | PASS — all three instrumented functions are async (`init`, `loadOptions`, `loadLocalConfig`) |
| COV-005 | PASS — `release_it.is_ci` and `release_it.is_dry_run` on init/load_options; `release_it.version.increment` on load_options; `release_it.config.file` on load_local_config |
| COV-006 | N/A — no outbound HTTP or DB calls in config loading |
| RST-001 | PASS — sync helpers (`expandPreReleaseShorthand`, `resolveFile`, `resolveDir`, `resolveExtend`, `resolveDefaultConfig`) and all class getters correctly skipped |
| RST-004 | PASS — `loadOptions` and `loadLocalConfig` are unexported but instrumented; justified by direct I/O diagnostic value (c12 config file load) per agent notes; RST-004 permits spans on unexported I/O when diagnostic value is clear |
| SCH-001 | PASS — span names follow `release_it.config.*` namespace convention |
| SCH-002 | PASS — all four attributes are registered: `release_it.config.file` (added to registry since run-3), `release_it.is_ci`, `release_it.is_dry_run`, `release_it.version.increment` |
| SCH-003 | PASS — `is_ci` and `is_dry_run` use `Boolean()` coercion; `version.increment` is a string enum value; `config.file` uses `String()` coercion |
| CDQ-001 | PASS — `span.end()` in `finally` block on all three spans |
| CDQ-002 | PASS |
| CDQ-003 | PASS — no redundant `span.end()` calls |
| CDQ-005 | PASS — `startActiveSpan` propagates context through async calls |
| CDQ-007 | PASS — `Boolean()` for `is_ci`/`is_dry_run`; `if (expanded.version != null && expanded.version.increment != null)` guard for `version.increment`; `String()` for `config.file` (always a string, no undefined path) |

**Failures**: None.

---

### 2. lib/plugin/Plugin.js (1 span, 1 attempt)

Span: `release_it.plugin.show_prompt`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — original function body wrapped without restructuring |
| COV-001 | PASS — `showPrompt` is the only async method on the Plugin base class; it is the entry point for all interactive prompt display |
| COV-003 | PASS — `recordException` + `setStatus(ERROR)` in catch; span ends in `finally` |
| COV-004 | PASS — `showPrompt` is the only exported async function; all other methods are synchronous stubs (`init`, `getName`, `bump`, etc.) |
| COV-005 | PASS — `release_it.plugin.namespace` captures the plugin identity, enabling per-plugin prompt attribution |
| COV-006 | N/A |
| RST-001 | PASS — all synchronous stub methods (`init`, `getName`, `getLatestVersion`, `getChangelog`, `getIncrement`, `getIncrementedVersionCI`, `getIncrementedVersion`, `beforeBump`, `bump`, `beforeRelease`, `release`, `afterRelease`) correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — `release_it.plugin.show_prompt` is a schema extension; no conflict with registered spans |
| SCH-002 | PASS — `release_it.plugin.namespace` is a registered attribute |
| SCH-003 | PASS — `namespace` is always a string (set in constructor from the `namespace` argument) |
| CDQ-001 | PASS — `span.end()` in `finally` block |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `this.namespace` is set in the constructor from the required `namespace` argument; cannot be undefined when `showPrompt` is called |

**Failures**: None.

---

### 3. lib/plugin/factory.js (2 spans, 1 attempt)

Spans: `release_it.plugin.load`, `release_it.plugin.get_plugins`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — inner graceful-degradation catches in `load` (three fallback import strategies) preserved without modification |
| COV-001 | PASS — `load` (async plugin loader) and `getPlugins` (exported async orchestrator) both have spans |
| COV-003 | PASS — outer catch on both spans: `recordException` + `setStatus(ERROR)` + rethrow; inner catches in `load` are graceful-degradation fallbacks (no rethrow — NDS-007 pattern, no error recording required) |
| COV-004 | PASS — both `load` and `getPlugins` are async; `getPluginName` is sync and correctly skipped |
| COV-005 | PASS — `release_it.plugin.namespace` on the `load` span; `release_it.plugin.enabled_count` and `release_it.plugin.external_count` on `get_plugins` span |
| COV-006 | N/A — no direct HTTP/DB calls |
| RST-001 | PASS — `getPluginName` is a pure synchronous string-parsing helper, correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — span names follow `release_it.plugin.*` convention |
| SCH-002 | PASS — `release_it.plugin.namespace`, `release_it.plugin.enabled_count`, `release_it.plugin.external_count` all registered |
| SCH-003 | PASS — `namespace` is string; `enabled_count` and `external_count` are integers (array length) |
| CDQ-001 | PASS — `span.end()` in `finally` on both spans |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `namespace` is always provided when `load` is called; `enabled_count` and `external_count` are array lengths (always numeric, never undefined) |

**Failures**: None.

---

### 4. lib/plugin/git/Git.js (10 spans, 2 attempts)

Spans: `release_it.git.is_git_repo` (module-level function), `release_it.git.is_enabled`, `release_it.git.init`, `release_it.git.before_release`, `release_it.git.release`, `release_it.git.is_required_branch`, `release_it.git.has_upstream_branch`, `release_it.git.get_upstream_args`, `release_it.git.push`, `release_it.git.rollback_tag_push`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — 9 async public entry points have spans; `isGitRepo` (module-level async) also instrumented per COV-004 |
| COV-003 | PASS — all 10 spans have `recordException` + `setStatus(ERROR)` + rethrow in catch |
| COV-004 | PASS — 10 of 23 total functions instrumented (~43%); all instrumented functions are async; synchronous helpers (`rollback`, `enableRollback`, `disableRollback`, `tagExists`, `isWorkingDirClean`, `stage`, `stageDir`, `reset`, `status`, `commit`, `tag`, `afterRelease`) correctly skipped via RST-001; unexported internal helpers (`getBranchName`, `getRemoteForBranch`, `fetch`, `getLatestTagName`) skipped via RST-004 |
| COV-005 | PASS — `vcs.repository.url.full` on init, `vcs.ref.head.name` on isRequiredBranch, `release_it.git.has_upstream` on hasUpstreamBranch, `release_it.git.push_repo` on getUpstreamArgs/push, `release_it.git.commit_message` on beforeRelease/release, `release_it.git.tag_name` on rollbackTagPush (conditional on `isTagged`) |
| COV-006 | N/A |
| RST-001 | PASS — synchronous methods (`rollback`, `enableRollback`, `disableRollback`, `tagExists`, `isWorkingDirClean`, `stage`, `stageDir`, `reset`, `status`, `commit`, `tag`, `afterRelease`) all use `.then()`/`.catch()` chaining but are skipped as unexported internal helpers |
| RST-004 | PASS — `getBranchName`, `getRemoteForBranch`, `fetch`, `getLatestTagName` are unexported; context propagation via `startActiveSpan` covers their I/O through parent spans |
| SCH-001 | PASS — all span names follow `release_it.git.*` convention |
| SCH-002 | PASS — `release_it.git.*` registry attributes used where available; `vcs.repository.url.full` and `vcs.ref.head.name` declared as OTel semconv schema extensions |
| SCH-003 | PASS — all attributes match declared types (string, boolean, int) |
| CDQ-001 | PASS — `span.end()` in `finally` on all 10 spans |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `vcs.repository.url.full` guarded by `if (remoteUrl != null)`; `release_it.git.tag_name` in rollbackTagPush set only inside `if (isTagged)` branch (intentional — span has no attributes when no tag is involved); other attributes set from confirmed non-null values or registry-defined defaults |

**Failures**: None.

**Note**: 10 spans across 23 functions (43%) exceeds the ~20% backstop. All 10 are justified: 9 are COV-001 entry points explicitly identified in pre-instrumentation analysis; 1 (`isGitRepo`) is required by COV-004 as an async I/O function. The high ratio reflects Git.js's role as a service plugin whose public interface is almost entirely async entry points.

---

### 5. lib/plugin/version/Version.js (1 span, 3 attempts)

Span: `release_it.version.get_incremented_version`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `getIncrementedVersion` is the sole exported async entry point |
| COV-003 | PASS — `recordException` + `setStatus(ERROR)` + rethrow |
| COV-004 | PASS — `getIncrementedVersion` is the only async exported function; `getIncrement` and `getIncrementedVersionCI` are synchronous and correctly skipped (RST-001) |
| COV-005 | PASS — `release_it.is_ci`, `release_it.version.current`, `release_it.version.increment`, `release_it.version.next` capture the full version resolution context |
| COV-006 | N/A |
| RST-001 | PASS — `getIncrement` and `getIncrementedVersionCI` return synchronous values; correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — `release_it.version.get_incremented_version` follows namespace convention |
| SCH-002 | PASS — `release_it.is_ci`, `release_it.version.current`, `release_it.version.increment`, `release_it.version.next` all registered |
| SCH-003 | PASS — `is_ci` is boolean; `version.current` and `version.next` are semver strings; `version.increment` is an enum string (patch/minor/major/etc.) |
| CDQ-001 | PASS — `span.end()` in `finally` |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `release_it.version.current` guarded by `if (options.latestVersion != null)`; `release_it.version.increment` guarded by `if (options.increment != null)`; `release_it.version.next` guarded by `if (result != null)` |

**Failures**: None. Three attempts reflect prior validator interactions, not a quality issue in the final committed version.

---

### 6. lib/shell.js (2 spans, 2 attempts)

Spans: `release_it.shell.exec_formatted_command`, `release_it.shell.exec_with_arguments`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — both exported async methods have spans |
| COV-003 | **FAIL** — `execFormattedCommand` catch is correct (`recordException` + `setStatus(ERROR)` + rethrow). `execWithArguments` catch uses `return Promise.reject(err)` instead of `throw error` — `span.recordException(err)` and `span.setStatus({ code: SpanStatusCode.ERROR })` are absent. `Promise.reject` semantically re-throws, but the span is closed without marking it as errored. The validator passed this (validator gap: COV-003 checker likely detects `throw` statements but not `return Promise.reject()`). Rubric marks as a quality failure. |
| COV-004 | PASS — both `execFormattedCommand` and `execWithArguments` are async; no other async methods |
| COV-005 | PASS — `release_it.hook.command` captures the command being executed on both spans; `release_it.is_dry_run` captures dry-run state on `exec_formatted_command` |
| COV-006 | N/A |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS — `release_it.shell.*` namespace convention |
| SCH-002 | PASS — `release_it.hook.command` and `release_it.is_dry_run` registered |
| SCH-003 | PASS — `hook.command` is string; `is_dry_run` is boolean |
| CDQ-001 | PASS — `span.end()` in `finally` on both spans |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `release_it.hook.command` on `exec_with_arguments` is set inside `if (span.isRecording())` guard; `cacheKey` on `exec_formatted_command` is always a string |

**Failures**: COV-003 — `execWithArguments` catch block uses `return Promise.reject(err)` without recording exception or setting ERROR status on the span. Validator gap: COV-003 checker detects `throw` but not `return Promise.reject()`.

---

### 7. lib/util.js (1 span, 1 attempt)

Span: `release_it.util.reduce_until`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — `reduceUntil` is the sole exported async function |
| COV-003 | PASS — `recordException` + `setStatus(ERROR)` + rethrow |
| COV-004 | PASS — `reduceUntil` is the only async exported function; all others (`readJSON`, `getSystemInfo`, `format`, `truncateLines`, `rejectAfter`, `parseGitUrl`, `hasAccess`, `parseVersion`, `e`, `touch`, `fixArgs`, `getNpmEnv`, `upperFirst`, `castArray`) are synchronous utilities correctly skipped |
| COV-005 | PASS — `release_it.util.collection_size` captures the number of items being reduced, useful for debugging plugin load failures |
| COV-006 | N/A |
| RST-001 | PASS — all synchronous exports correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — `release_it.util.reduce_until` follows namespace convention |
| SCH-002 | PASS — `release_it.util.collection_size` declared as a schema extension |
| SCH-003 | PASS — `collection_size` is an integer (array `length` property) |
| CDQ-001 | PASS — `span.end()` in `finally` |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — `collection.length` is always a number; array length cannot be undefined |

**Failures**: None.

---

## Failed Files (6)

See `failure-deep-dives.md` for full root cause analysis. Summary:

| File | Primary Failure | Validator |
|------|----------------|-----------|
| lib/plugin/GitBase.js | LINT — Prettier line-length: span wrapper adds 2 indent levels, pushing long lines past 120-char limit | LINT |
| lib/plugin/GitRelease.js | LINT — same root cause as GitBase.js | LINT |
| lib/plugin/github/GitHub.js | NDS-003 ×8 — agent proactively split long lines to avoid Prettier failure; NDS-003 flagged as original line modifications | NDS-003 |
| lib/plugin/gitlab/GitLab.js | COV-003 (attempt 1); SCH-002 ×2 (attempt 2) | COV-003, SCH-002 |
| lib/plugin/npm/npm.js | NDS-003 ×26 — agent split destructuring and chained calls across multiple lines | NDS-003 |
| lib/prompt.js | LINT — same root cause as GitBase.js | LINT |

All 6 failures trace to the indentation-width conflict documented in failure-deep-dives.md: adding `startActiveSpan` wrapper increases indentation, pushing already-long lines over Prettier's 120-char print width. The constraint is structural — no agent behavior resolves both LINT (enforce Prettier-formatted output) and NDS-003 (preserve original lines) simultaneously.

---

## Correct Skips (10)

Pre-scan correctly identified all 10 as having no async exported functions:

| File | Reason |
|------|--------|
| lib/args.js | Pure sync CLI argument parser |
| lib/cli.js | Pure sync CLI setup |
| lib/index.js | Pure sync orchestrator entry point |
| lib/log.js | Pure sync logger |
| lib/plugin/git/prompts.js | Sync prompt definitions only |
| lib/plugin/github/prompts.js | Sync prompt definitions only |
| lib/plugin/github/util.js | Pure sync utility functions |
| lib/plugin/gitlab/prompts.js | Sync prompt definitions only |
| lib/plugin/npm/prompts.js | Sync prompt definitions only |
| lib/spinner.js | Pure sync spinner wrapper |

---

## Quality Failures Summary

| File | Rule | Dimension |
|------|------|-----------|
| lib/shell.js | COV-003 | Coverage — `execWithArguments` catch uses `return Promise.reject(err)` without span error recording; validator gap (does not detect `Promise.reject` rethrows) |

**Total canonical failures**: 1 (COV-003 on shell.js)
