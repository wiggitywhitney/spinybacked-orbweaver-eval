# Per-File Evaluation — release-it Run 3

**Date**: 2026-05-04
**Branch**: spiny-orb/instrument-1777912706406
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 23 (3 committed + 2 failed + 18 correct skips)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check` exits 0 on all 3 instrumented files |
| NDS-002 (Tests) | **PASS** | 262 tests pass, 2 skipped (pre-existing gpgsign env issue unrelated to instrumentation) |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api: >=1.0.0` in peerDependencies |
| API-003 | **PASS** | No vendor-specific SDKs in dependencies; only OTel API imported |
| API-004 | **PASS** | No SDK-internal imports in instrumented files |
| CDQ-008 | **PASS** | All 3 committed files use `trace.getTracer('release-it')` consistently |

---

## Committed Files (3)

### 1. lib/config.js (3 spans, 2 attempts)

Spans: `release_it.config.init`, `release_it.config.load_options`, `release_it.config.load_local_config`

| Rule | Result |
|------|--------|
| NDS-003 | PASS — agent removed the `if (typeof expanded.version?.increment === 'string')` guard (flagged as non-instrumentation code); `expandPreReleaseShorthand` guarantees the value is set, so direct setAttribute is safe |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS — `examples/instrumentation.js` not modified |
| NDS-004 | PASS — no test file modifications |
| NDS-005 | PASS — original error handling in all three functions preserved; spans wrap without restructuring |
| COV-001 | PASS — `Config.init()` is the async entry point for the Config class |
| COV-003 | PASS — all three spans: recordException + setStatus(ERROR) + rethrow in catch |
| COV-004 | PASS — all three instrumented functions are async (`init`, `loadOptions`, `loadLocalConfig`) |
| COV-005 | PASS — `release_it.is_ci` (bool) and `release_it.is_dry_run` (bool) on init and load_options; `release_it.version.increment` (enum string) on load_options; all registered in schema |
| COV-006 | N/A — no outbound HTTP or DB calls in config loading |
| RST-001 | PASS — all synchronous getters (`isDryRun`, `isCI`, `isVerbose`, etc.) and sync helper functions (`expandPreReleaseShorthand`, `resolveFile`, `resolveDir`, `resolveExtend`, `resolveDefaultConfig`) correctly skipped |
| RST-004 | PASS — no spans on unexported internal helpers |
| SCH-001 | PASS — all three spans are schema extensions (correctly reported in log); no span names conflict with registered schema |
| SCH-002 | PASS — `release_it.is_ci`, `release_it.is_dry_run`, `release_it.version.increment` all registered in schema; `release_it.config.file` attribute removed after SCH-002 validator rejection (no registered equivalent) |
| SCH-003 | PASS — `is_ci` and `is_dry_run` use `Boolean()` coercion to declared `type: boolean`; `version.increment` passes raw string value matching declared enum members |
| CDQ-001 | PASS — `span.end()` in `finally` block on all three spans |
| CDQ-002 | PASS — `startActiveSpan` propagates context through async calls |
| CDQ-003 | PASS — no sampling-dependent logic |
| CDQ-005 | PASS — no PII in attributes; increment type and boolean flags only |
| CDQ-007 | PASS — `Boolean()` coercion on `is_ci` and `is_dry_run` handles null/undefined; `version.increment` guaranteed non-null by `expandPreReleaseShorthand` per agent reasoning |

**Failures**: None.

---

### 2. lib/plugin/factory.js (2 spans, 1 attribute, 3 attempts)

Spans: `release_it.plugin.load`, `release_it.plugin.get_plugins`

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no non-instrumentation code added; plugin name is passed directly as existing variable |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — inner graceful-degradation catches in `load` (three fallback import strategies) preserved without modification |
| COV-001 | PASS — `load` (async plugin loader) and `getPlugins` (exported async entry point) both have spans |
| COV-003 | PASS — outer catch on both spans: recordException + setStatus(ERROR) + rethrow; inner catches on `load` are graceful-degradation (NDS-007, no error recording correct) |
| COV-004 | PASS — both instrumented functions are async |
| COV-005 | PASS — `release_it.plugin.namespace` (string, registered) on load span; `release_it.plugin.external_count` (int, schema extension) on get_plugins span |
| COV-006 | N/A — no direct HTTP/DB calls in plugin loading |
| RST-001 | PASS — `getPluginName` is a pure synchronous string-parsing helper, correctly skipped |
| RST-004 | PASS |
| SCH-001 | PASS — both spans are schema extensions (correctly reported) |
| SCH-002 | PASS — `release_it.plugin.namespace` registered; `release_it.plugin.external_count` is a new extension attribute, not a duplicate of any registered key |
| SCH-003 | PASS — `pluginName` is a string; `enabledExternalPlugins.length` is an integer |
| CDQ-001 | PASS — `span.end()` in `finally` on both spans |
| CDQ-002 | PASS — `startActiveSpan` propagates context |
| CDQ-003 | PASS |
| CDQ-005 | PASS — plugin namespace names and counts are not PII |
| CDQ-007 | PASS — `pluginName` is always a non-null string (function parameter); `.length` on an initialized array is always a non-null integer |

**Failures**: None.

---

### 3. lib/util.js (1 span, 1 attribute, 1 attempt)

Span: `release_it.util.reduce_until`

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no non-instrumentation code added; `collection.length` read is already computable from existing variable |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'` |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS — no existing error handling in `reduceUntil`; span wrapping adds new error capture without removing anything |
| COV-001 | PASS — `reduceUntil` is the only exported async function in the file |
| COV-003 | PASS — recordException + setStatus(ERROR) + rethrow in catch |
| COV-004 | PASS — `reduceUntil` is async |
| COV-005 | PASS — `release_it.util.collection_size` captures the iterable size, the most diagnostically relevant value from this function |
| COV-006 | N/A — no external calls |
| RST-001 | PASS — all other exported functions (`format`, `truncateLines`, `parseGitUrl`, `parseVersion`, `get`, `hasAccess`, `fixArgs`, `getNpmEnv`, etc.) are synchronous, correctly skipped |
| RST-004 | PASS — `tryStatFile` is unexported async but is a thin internal helper; `hasAccess` and `get` have graceful-degradation catches (NDS-007, no error recording correct) |
| SCH-001 | PASS — `release_it.util.reduce_until` is a schema extension (correctly reported) |
| SCH-002 | PASS — `release_it.util.collection_size` is a new extension attribute; no registered key covers "iterable collection size" in this context |
| SCH-003 | PASS — `collection.length` is an integer; schema declares `type: int` |
| CDQ-001 | PASS — `span.end()` in `finally` |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS — collection size is not PII |
| CDQ-007 | PASS — guarded: `if (collection != null && collection.length != null)` before setAttribute; handles generators and objects without `.length` |

**Failures**: None.

---

## Failed Files (2)

### lib/plugin/git/Git.js

Not evaluated against quality rubric — API termination on both attempts prevented instrumented code from being committed. Instrumentation plan was sound (see failure-deep-dives.md). Retry in run-4.

### lib/plugin/gitlab/GitLab.js

Not evaluated against quality rubric — pre-scan false negative prevented any instrumentation attempt. COV-002 validator correctly flagged an uninstrumented `fetch` at line 188 in the original file. Run-4 requires pre-scan fix before evaluation is possible.

---

## Pre-scan Results: 18 classified as skips (10 true correct skips, 8 confirmed false negatives)

All 18 were pre-scanned as containing only synchronous utilities, pure constants, or unexported helpers with no async entry points.

| File | Skip Reason | Caveat |
|------|------------|--------|
| lib/args.js | Synchronous only — CLI argument parsing |  |
| lib/cli.js | Synchronous only — CLI setup |  |
| lib/index.js | Synchronous only — exports only |  |
| lib/log.js | Synchronous only — logging utilities |  |
| lib/plugin/GitBase.js | Synchronous only — base class with no async methods |  |
| lib/plugin/GitRelease.js | Synchronous only — no async methods |  |
| lib/plugin/Plugin.js | Synchronous only — base plugin class |  |
| lib/plugin/git/prompts.js | Synchronous only — prompt definitions |  |
| lib/plugin/github/GitHub.js | Pre-scanned: no async entry points | **Verify**: Run-2 agent attempted and failed NDS-003 on this file (6 LINT failures). Run-3 pre-scan classified all methods as unexported or sync. GitHub.js uses Octokit for API calls — if exported async methods exist, this is a false negative. |
| lib/plugin/github/prompts.js | Synchronous only — prompt definitions |  |
| lib/plugin/github/util.js | Synchronous only — utilities |  |
| lib/plugin/gitlab/prompts.js | Synchronous only — prompt definitions |  |
| lib/plugin/npm/npm.js | Pre-scanned: no async entry points | **Verify**: npm/npm.js performs npm publish operations. If exported async functions exist, this may be a false negative. |
| lib/plugin/npm/prompts.js | Synchronous only — prompt definitions |  |
| lib/plugin/version/Version.js | Synchronous only — version string utilities |  |
| lib/prompt.js | Synchronous only — prompt utilities |  |
| lib/shell.js | Synchronous only — shell execution utilities |  |
| lib/spinner.js | Synchronous only — spinner UI |  |

**Pre-scan false negatives confirmed — GitHub.js, npm/npm.js, and 6 more**: PR advisory findings (see pr-evaluation.md) confirmed that GitHub.js has 13 uninstrumented async class methods, npm/npm.js has 8, GitBase.js has 6, and GitRelease.js, Plugin.js, Version.js, prompt.js, and shell.js have 1–2 each. The pre-scan is systematically misclassifying plugin class methods as unexported or sync without inspecting the class body. True correct skips are 10 files (the purely sync-only ones). 8 of the 18 "no changes needed" files are false negatives.

---

## Quality Failures Summary

| File | Rule | Dimension |
|------|------|-----------|
| *(none)* | — | — |

**All 3 committed files pass the full 32-rule rubric.**
