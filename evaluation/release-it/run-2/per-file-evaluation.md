# Per-File Evaluation — release-it Run-2

**Date**: 2026-04-21
**Branch**: spiny-orb/instrument-1776786399007
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 23 (13 instrumented + 10 correct skips). Run outcome breakdown: 0 net committed, 8 validation failures, 12 checkpoint rollbacks, 3 correct skips survived.

**Evaluation basis**: No files survived to the target codebase (all rolled back). Evaluation uses the agent's last-attempt file state on the spiny-orb branch and instrumentation report files. LINT failures are treated as delivery failures, not quality failures — the instrumentation logic is assessed independently of formatting.

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | All files reached LINT validation, which runs after syntax check. No syntax errors reported in any file. |
| NDS-002 (Tests) | **NOT EVALUABLE** | Checkpoint tests failed for OTel module resolution (`@opentelemetry/api` not installed under peerDependencies strategy). This is an infrastructure failure — the agent's code did not introduce behavioral regressions. Any instrumented file would fail the checkpoint regardless of correctness. |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api` added to `peerDependencies` at `>=1.0.0` in package.json |
| API-003 | **PASS** | No vendor-specific SDKs added to dependencies |
| CDQ-008 | **PASS** | All instrumented files use `trace.getTracer('release-it')` — consistent with package name |

---

## Instrumented Files (8 files with spans)

### 1. lib/config.js (1 span, 2 attempts)

Span: `release_it.config.init`
Attributes: `release_it.is_ci`, `release_it.is_dry_run`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS — `@opentelemetry/api` only |
| NDS-006 | PASS — ESM imports consistent with project |
| NDS-004 | PASS — Config class public API unchanged |
| NDS-005 | PASS — new try/catch is span wrapper; original loadOptions/loadLocalConfig logic preserved |
| COV-001 | PASS — Config.init() is the exported async entry point |
| COV-003 | PASS — `recordException` + `setStatus(ERROR)` in catch |
| COV-004 | PASS — loadOptions and loadLocalConfig are unexported; RST-004 exemption applies |
| COV-005 | PASS — `release_it.is_ci` and `release_it.is_dry_run` are registered schema attributes |
| RST-001 | PASS — synchronous helpers (expandPreReleaseShorthand) skipped |
| RST-002 | PASS — getters and setCI skipped |
| RST-003 | PASS — no thin wrapper spans |
| RST-004 | PASS — only exported async entry point instrumented |
| RST-005 | PASS — no pre-existing instrumentation |
| SCH-001 | PASS (schema extension) — no matching registry span; name follows `release_it.<module>.<operation>` convention |
| SCH-002 | PASS — both attributes in schema |
| SCH-003 | PASS — `Boolean(isCI)` and `Boolean(this._options['dry-run'])` produce boolean values for boolean-typed attributes |
| SCH-004 | PASS — no obvious redundancy with registry |
| CDQ-001 | PASS — `span.end()` in finally block |
| CDQ-002 | PASS — `getTracer('release-it')` matches package name |
| CDQ-003 | PASS — standard `recordException` + `setStatus` pattern |
| CDQ-005 | PASS — `startActiveSpan` callback pattern |
| CDQ-006 | PASS — Boolean() conversions are trivial (O(1)) |
| CDQ-007 | PASS — Boolean conversion ensures non-null; no optional field setAttribute |
| API-004 | PASS |

**Failures**: None. Advisory COV-004 flags loadOptions and loadLocalConfig — false positive, both are unexported.

---

### 2. lib/plugin/factory.js (1 span, 2 attributes, 2 attempts)

Span: `release_it.plugin.get_plugins`
Attributes: `release_it.plugins.enabled_count`, `release_it.plugins.external_count` (both schema extensions)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS — getPlugins signature unchanged |
| NDS-005 | PASS |
| COV-001 | PASS — getPlugins is the exported async orchestrator |
| COV-003 | PASS — error recording in catch |
| COV-004 | PASS — load is unexported; RST-004 exemption applies |
| COV-005 | PASS — plugin counts capture diagnostic value; no registered attributes cover factory-level cardinality |
| RST-001 | PASS — getPluginName (sync string transformer) skipped |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS (schema extension) |
| SCH-002 | ADVISORY — `release_it.plugins.enabled_count` and `release_it.plugins.external_count` are schema extensions; no registered keys for plugin counts |
| SCH-003 | PASS — counts are integers |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — `collection.length` on arrays, always numeric |
| API-004 | PASS |

**Failures**: None. SCH-002 advisory on two schema extension attributes.

---

### 3. lib/plugin/version/Version.js (1 span, 2 attempts)

Span: `release_it.version.get_incremented_version`
Attributes: `release_it.is_ci`, `release_it.version.current`, `release_it.version.increment`, `release_it.version.next`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — getIncrementedVersion is the exported async entry point |
| COV-003 | PASS |
| COV-004 | PASS — promptIncrementVersion skipped due to `process.exit(0)` in task callback (span would leak — sound reasoning); getIncrementedVersionCI and getIncrement are synchronous |
| COV-005 | PASS — four schema-registered attributes |
| RST-001 | PASS — isPreRelease, isValid, incrementVersion etc. are synchronous |
| RST-002 | PASS |
| RST-003 | PASS — getIncrementedVersionCI is a thin wrapper, correctly skipped |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS (schema extension) |
| SCH-002 | PASS — all four attributes in schema |
| SCH-003 | PASS — version strings are strings, increment is string, is_ci is boolean |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — version and increment guarded with `!= null` before setAttribute |
| API-004 | PASS |

**Failures**: None.

---

### 4. lib/shell.js (1 span, 2 attempts)

Span: `release_it.shell.exec`
Attributes: `release_it.hook.command`, `release_it.is_dry_run`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — execFormattedCommand is the primary async dispatch method |
| COV-003 | PASS |
| COV-004 | PASS — execStringCommand and execWithArguments are unexported internal helpers |
| COV-005 | PASS — `release_it.hook.command` and `release_it.is_dry_run` are registered schema attributes |
| RST-001 | PASS |
| RST-003 | PASS — exec is a thin wrapper delegating to execFormattedCommand; correctly skipped |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS (schema extension) |
| SCH-002 | PASS — both attributes in schema |
| SCH-003 | PASS — command string, isDryRun boolean |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — `cacheKey` is always a string; `!!isDryRun` ensures boolean |
| API-004 | PASS |

**Failures**: None.

---

### 5. lib/util.js (1 span, 1 attribute)

Span: `release_it.util.reduce_until`
Attribute: `release_it.util.collection_size` (schema extension)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — reduceUntil is the sole exported async function |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS — collection_size captures diagnostic value; no registered schema key for generic utility collection size |
| RST-001 | PASS — hasAccess, format, parseVersion etc. are synchronous; correctly skipped |
| RST-002 | PASS |
| RST-003 | PASS — once and rejectAfter are thin wrappers; correctly skipped |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS (schema extension) |
| SCH-002 | ADVISORY — `release_it.util.collection_size` is a schema extension |
| SCH-003 | PASS — `collection.length ?? 0` produces an integer |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — `collection.length ?? 0` guards against null/undefined collection |
| API-004 | PASS |

**Failures**: None. SCH-002 advisory on schema extension attribute.

---

### 6. lib/index.js (1 span, LINT failure — evaluated from branch)

Span: `release_it.run_tasks`
Attributes: `release_it.version.next`, `release_it.version.increment`

LINT failure is a formatting delivery issue only. Instrumentation quality assessed from agent's last-attempt file on branch.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — Prettier diff confirms only instrumentation lines and formatting changed |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS — runTasks signature unchanged |
| NDS-005 | PASS — original catch block preserved; span wrapper adds outer try/catch |
| COV-001 | PASS — runTasks is the exported async pipeline entry point |
| COV-003 | PASS — `recordException` + `setStatus(ERROR)` in catch |
| COV-004 | PASS — runHook and runLifeCycleHook are unexported |
| COV-005 | PASS — version.next and version.increment are schema attributes |
| RST-004 | PASS — unexported helpers skipped |
| RST-005 | PASS |
| SCH-001 | PASS (schema extension) |
| SCH-002 | PASS — both attributes in schema |
| SCH-003 | PASS — version strings and increment strings |
| SCH-004 | PASS |
| CDQ-001 | PASS — span.end() in finally; process.exit() paths documented as acceptable leaks |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — version and increment guarded with `!= null` |
| API-004 | PASS |

**Failures**: None (LINT delivery failure, not a quality failure).

---

### 7. lib/plugin/GitBase.js (3 spans, LINT failure — evaluated from branch)

Spans: `release-it.git.init`, `release-it.git.get_commits_since_latest_tag`, `release-it.git.get_changelog`
Note: span names use `release-it` prefix (with hyphen) while other files use `release_it` (with underscore). Inconsistent naming within the run.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — Prettier diff confirms only instrumentation + formatting changes |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — init, getCommitsSinceLatestTag, getChangelog are async plugin lifecycle methods |
| COV-003 | PASS — error recording in each span's catch block |
| COV-004 | PASS — fetch, getLatestTagName, getSecondLatestTagName are unexported helpers |
| COV-005 | PASS — `release_it.git.tag_name`, `release_it.git.remote_url`, `release_it.git.branch` used |
| RST-001 | PASS — getName, getLatestVersion, bump, isRemoteName are synchronous |
| RST-003 | PASS — getBranchName, getRemoteForBranch, getRemote are thin wrappers |
| RST-004 | PASS — unexported helpers correctly skipped |
| RST-005 | PASS |
| SCH-001 | **ADVISORY** — span names use `release-it.git.*` (hyphen in namespace) while all other files use `release_it.*` (underscore). Naming quality inconsistency within the run. |
| SCH-002 | PASS — git.tag_name, git.remote_url, git.branch are schema attributes |
| SCH-003 | PASS — all string values |
| SCH-004 | PASS |
| CDQ-001 | PASS — span.end() in finally for all three spans |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — tag_name, branch, remoteUrl guarded with `!= null` |
| API-004 | PASS |

**Failures**: None (LINT delivery failure). SCH-001 advisory on hyphen-vs-underscore namespace inconsistency.

---

### 8. lib/plugin/GitRelease.js (1 span, LINT failure — evaluated from branch)

Span: `release_it.git_release.before_release`
Attribute: `release_it.changelog.length`

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — beforeRelease is the async plugin lifecycle hook |
| COV-003 | PASS |
| COV-004 | PASS — processReleaseNotes is unexported |
| COV-005 | PASS — `release_it.changelog.length` captures changelog presence and size |
| RST-001 | PASS — afterRelease is synchronous |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS (schema extension) |
| SCH-002 | ADVISORY — `release_it.changelog.length` is a schema extension |
| SCH-003 | PASS — length is an integer |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — releaseNotes guarded with `!= null` |
| API-004 | PASS |

**Failures**: None (LINT delivery failure).

---

### 9. lib/plugin/git/Git.js (4 spans, LINT failure — evaluated from branch)

Spans: `release_it.git.init`, `release_it.git.before_release`, `release_it.git.release`, `release_it.git.push`

| Rule | Result |
|------|--------|
| NDS-003 | PASS — Prettier diff confirms only instrumentation + formatting |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — four plugin lifecycle methods instrumented |
| COV-003 | PASS — error recording in all four spans' catch blocks |
| COV-004 | PASS — isGitRepo (unexported static), rollbackTagPush (unexported) handled; commit() and tag() are non-async promise-returning methods outside normal COV-004 scope |
| COV-005 | PASS — `release_it.plugin.namespace` set to 'git' in all spans |
| RST-001 | PASS — rollback, enableRollback, disableRollback, afterRelease are synchronous |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS (schema extension) |
| SCH-002 | PASS — `release_it.plugin.namespace` is in schema |
| SCH-003 | PASS — namespace is a string |
| SCH-004 | PASS |
| CDQ-001 | PASS — span.end() in finally for all four spans |
| CDQ-002 | PASS |
| CDQ-003 | PASS — error recording in push() inner catch and all outer catches |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — remoteUrl set as `remoteUrl || ''` avoiding undefined |
| API-004 | PASS |

**Failures**: None (LINT delivery failure).

---

### 10. lib/plugin/npm/npm.js (3 spans, LINT failure — evaluated from branch)

Spans: `release_it.npm.init`, `release_it.npm.bump`, `release_it.npm.publish`
Attributes: `release_it.npm.package_name`, `release_it.version.current`, `release_it.version.next`, `release_it.npm.dist_tag`, `release_it.npm.registry` (schema extensions)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — init, bump, publish are the three primary async lifecycle entry points |
| COV-003 | PASS — error recording in all three spans |
| COV-004 | PASS — isRegistryUp, isAuthenticated, isCollaborator, getLatestRegistryVersion, getRegistryDistTags are unexported internal helpers |
| COV-005 | PASS — package name, version, dist-tag captured |
| RST-001 | PASS — getName, getLatestVersion etc. are synchronous |
| RST-002 | PASS |
| RST-003 | PASS — release() delegates to this.step() |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS (schema extensions) |
| SCH-002 | ADVISORY — npm.package_name, npm.dist_tag, npm.registry are schema extensions |
| SCH-003 | PASS — strings and version strings |
| SCH-004 | PASS |
| CDQ-001 | PASS — span.end() in finally for all three; return-value capture pattern used correctly |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — latestVersion guarded with `!= null`; registry guarded similarly |
| API-004 | PASS |

**Failures**: None (LINT delivery failure). Three schema extension attributes.

---

### 11. lib/prompt.js (1 span, LINT failure — evaluated from branch)

Span: `release_it.prompt.show`
Attributes: `release_it.plugin.namespace`, `release_it.prompt.name` (schema extension)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — show is the async interactive prompt method |
| COV-003 | PASS |
| COV-004 | PASS — constructor and register are synchronous |
| COV-005 | PASS — namespace (registered) and prompt name (schema extension) captured |
| RST-001 | PASS |
| RST-002 | PASS |
| RST-003 | PASS |
| RST-004 | PASS |
| RST-005 | PASS |
| SCH-001 | PASS (schema extension) |
| SCH-002 | ADVISORY — `release_it.prompt.name` is a schema extension |
| SCH-003 | PASS |
| SCH-004 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS — promptName guarded with `!= null` |
| API-004 | PASS |

**Failures**: None (LINT delivery failure).

---

## Validation-Failed Files (2)

### 12. lib/plugin/github/GitHub.js (NDS-003 failure)

Schema extensions proposed: github.init, github.release, github.create_release, github.update_release, github.comment_on_resolved_items

| Rule | Result |
|------|--------|
| NDS-003 | **FAIL** — original line 394 (`return this.retry(async bail => {`) was converted to `const result = await this.retry(...); return result` to capture the return value for `release_it.github.release_id`. This violates NDS-003 (non-instrumentation lines unchanged). |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | Would PASS — 5 async entry points correctly identified |
| COV-003 | Would PASS — inner graceful-degradation catch blocks (init's getLatestRelease, commentOnResolvedItems' createComment) correctly left without error recording per NDS-007 |
| COV-004 | Would PASS — isAuthenticated, isCollaborator, getLatestRelease etc. are internal helpers |
| RST-004 | Would PASS |
| SCH-001 | Would PASS (schema extensions) |
| CDQ-001 | Would PASS |
| CDQ-007 | Would PASS — release_id guarded with `!= null` (dry-run path returns true, not an object) |

**Failures**: NDS-003 gate failure (1). Instrumentation design was sound; the failure is the return-value capture transformation.

---

### 13. lib/plugin/gitlab/GitLab.js (COV-003 failure)

Schema extensions proposed: gitlab.init, gitlab.check_milestones, gitlab.release, gitlab.request, gitlab.create_release, gitlab.upload_asset

| Rule | Result |
|------|--------|
| NDS-003 | PASS — second attempt fixed arrowParens per agent notes |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | Would PASS — 6 async entry points identified |
| COV-003 | **FAIL** — catch block at line 160 (and 3 others) missing `span.recordException` + `span.setStatus`. Validator flagged 4 violations. |
| COV-004 | Would PASS |
| RST-004 | Would PASS |
| SCH-001 | Would PASS |
| CDQ-001 | Would PASS |
| CDQ-007 | Would PASS — gitlab attributes guarded appropriately |

**Note on NDS-007 interaction**: The catch blocks at issue may be graceful-degradation paths (NDS-007: expected catch blocks should not have error recording added). If any of the four catch blocks represent expected conditions (e.g., request retries, optional resource fetches), the correct resolution is to omit error recording there — but COV-003 validator does not distinguish. Manual inspection needed.

**Failures**: COV-003 (4 violations). arrowParens was fixed in the second attempt — this file was nearly correct.

---

## Correct Skips (10 files — agent correctly declined to instrument)

All correct skips evaluated: the agent's reasoning is assessed against COV-004 and RST rules.

| File | Skip reason | COV-004 | RST |
|------|------------|---------|-----|
| lib/args.js | parseCliArguments is synchronous | N/A | PASS |
| lib/cli.js | version, help are synchronous | N/A | PASS |
| lib/log.js | All Logger methods are synchronous | N/A | PASS |
| lib/plugin/Plugin.js | All lifecycle stubs are empty synchronous bodies | N/A | PASS |
| lib/plugin/git/prompts.js | Pure synchronous formatters | N/A | PASS |
| lib/plugin/github/prompts.js | Single synchronous formatter | N/A | PASS |
| lib/plugin/github/util.js | All exported functions synchronous | N/A | PASS |
| lib/plugin/gitlab/prompts.js | Single synchronous arrow function | N/A | PASS |
| lib/plugin/npm/prompts.js | Static configuration object with synchronous callbacks | N/A | PASS |
| lib/spinner.js | show() wraps a caller-supplied task — thin pass-through with no own I/O | RST-003 | PASS |

**All correct skips are sound.** No over-instrumentation and no missed async I/O.

---

## Quality Failures Summary

| File | Rule | Dimension | Severity |
|------|------|-----------|---------|
| lib/plugin/github/GitHub.js | NDS-003 | Non-Destructiveness | Gate (Critical) |
| lib/plugin/gitlab/GitLab.js | COV-003 | Coverage | Important |

**Total canonical quality failures**: 2

LINT failures (6 files) are delivery failures, not quality failures. The instrumentation logic in all six LINT-failed files passes rubric assessment.

---

## Notable Patterns

**SCH-001 inconsistency**: GitBase.js uses `release-it.git.*` span names (hyphen in namespace) while all other files use `release_it.*` (underscore). The agent applied different conventions to different files — likely because GitBase is the base class and was processed before the agent established the underscore convention. Not a gate failure, but worth noting for run-3.

**CDQ-007 guards**: The agent consistently applied `!= null` guards before `setAttribute` calls on nullable values across all instrumented files. No CDQ-007 failures.

**RST decisions were sound**: The agent correctly skipped thin wrappers (exec → execFormattedCommand, getBranchName, etc.), synchronous utilities, and internal helpers across all files. No over-instrumentation observed.

**COV-004 advisories on unexported async functions**: spiny-orb's COV-004 validator flagged loadOptions and loadLocalConfig (config.js) as missing spans. Both are unexported — RST-004 exemption applies. This is a known validator false-positive pattern for deeply nested unexported orchestrators.
