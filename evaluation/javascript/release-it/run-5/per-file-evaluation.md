# Per-File Evaluation — release-it Run 5

**Date**: 2026-10-07
**Branch**: spiny-orb/instrument-1790686416741 (PR #4 in wiggitywhitney/release-it)
**Rubric**: 32 rules (5 gates + 27 quality), from `docs/research/evaluation-rubric.md` in the spiny-orb repo, with the interpretations fixed in `exemption-scope.md`
**Files evaluated**: 23 (9 committed + 4 failed + 10 correct skips)

Interpretations of ambiguous rules are fixed in `exemption-scope.md` and applied the same way in every section. Sections were written by delegated per-file agents and then reconciled by the coordinating session. Where reconciliation changed an agent's verdict, the row says so.

Every section is static-only. Live trace data is created during IS scoring, which has not run yet. The reconciliation step folds it in once `trace-artifact.md` exists.

Run-4's per-file tables had 21 rows. Run-5's have 28. The added rows are COV-002, RST-002, RST-003, RST-005, API-004, SCH-004, and CDQ-011 (CDQ-011 replaces CDQ-008, which the rubric marks as deleted). A FAIL on one of these rows is a new evaluation, not a regression, unless the code changed.

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check` exits 0 on all 9 committed files on the instrument branch |
| NDS-002 (Tests) | **PASS** | Instrument branch: 264 tests, 230 pass (87.1%), 32 fail (12.1%), 2 skipped (0.8%). `main`, run in a temporary worktree: identical totals, and the 32 failing test names match one for one. The failures predate instrumentation (git tag operations in temp directories, `fatal: no tag message?`), so instrumentation introduced no failures. |

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | `@opentelemetry/api` is in `peerDependencies` at `>=1.0.0` and in `devDependencies`, and absent from `dependencies`. Correct for a package that is distributed and also used as a library (`spiny-orb.yaml` sets `dependencyStrategy: peerDependencies`). |
| API-003 | **PASS** | No vendor-specific instrumentation packages (dd-trace, New Relic, Splunk) in any dependency section |

CDQ-011 (canonical tracer name) is per-file under the current rubric and appears in each section. All 9 committed files call `trace.getTracer('release-it')`.

---

## Committed Files (9)

### 1. lib/config.js (3 spans, 3 attempts)

Spans: `release_it.config.init`, `release_it.config.load_options`, `release_it.config.load_local_config`

Trace supplementation: unavailable (IS scoring not yet run)

| Rule | Result |
|------|--------|
| NDS-003 | PASS. The diff adds only the OTel import (L1), the tracer (L13), the `startActiveSpan` wrappers with try/catch/finally (L23–39, L108–137, L163–218), `setAttribute` calls, and one attribute-only guard (L123). Original statements are re-indented but otherwise unchanged. The nested `resolve*` function declarations moved inside the callback's `try` and still hoist. `init()` now returns `tracer.startActiveSpan(...)`, which resolves to `undefined`, the same as the original implicit return. |
| API-001 | PASS. The only OTel import is `import { trace, SpanStatusCode } from '@opentelemetry/api'` (L1). |
| NDS-006 | PASS. package.json has `"type": "module"`, and the added import is ESM. |
| NDS-004 | PASS. `export default Config` (L221) and the signatures of `init()`, `loadOptions`, and `loadLocalConfig` are unchanged. |
| NDS-005 | PASS. The file had no pre-existing try/catch. The original `loadC12(...).catch(() => { throw new Error(...) })` is kept verbatim (L183–185). The new catches record the error and rethrow (L32–35, L130–133, L211–214). There is no silent catch, so NDS-005b does not apply. |
| COV-001 | PASS. `Config.init()` (L22), the async entry point of the exported class, has a span (L23). The other public methods are sync accessors or utilities. |
| COV-002 | PASS. The only outbound operation is the c12 `loadC12` config read (L174), which runs inside `release_it.config.load_local_config`. The module-level `readJSON` (L12) runs at import time, outside any function. |
| COV-003 | PASS. All three spans have `recordException` + `setStatus(ERROR)` + rethrow. The wrapped c12 error from L184 reaches the L211 catch. |
| COV-004 | PASS. All three async functions have spans: `init` (L22), `loadOptions` (L107), `loadLocalConfig` (L162). |
| COV-005 | PASS. The registry defines no required or recommended attributes per span. The domain attributes are present: `release_it.is_ci` and `release_it.is_dry_run` (L30–31, L121–122), `release_it.version.increment` (L124), `release_it.config.file` (L170). |
| COV-006 | PASS. No auto-instrumentation package covers c12 config resolution or option merging. |
| RST-001 | PASS. Every spanned function is async and awaits I/O. Sync helpers (`expandPreReleaseShorthand`, `resolveFile`, `resolveDir`, `resolveExtend`, `resolveDefaultConfig`) and `getContext`/`setContext`/`setCI` are correctly left unspanned. |
| RST-002 | PASS. None of the getters (L56–104) has a span. |
| RST-003 | PASS. No spanned body is a single `return otherFn()`. `init` awaits `loadOptions(...).then(...)` and assigns instance state. Advisory: the `init` and `load_options` spans nest almost 1:1 and repeat the same `is_ci`/`is_dry_run` values. |
| RST-004 | PASS. `init` is a public method of an exported class. `loadLocalConfig` is unexported but does file I/O through c12 (exemption-scope item 4). `loadOptions` is unexported and reaches I/O through `loadLocalConfig` → c12, which counts as I/O through a wrapper under item 4. Run-4 scored both PASS. |
| RST-005 | PASS. The original file has no tracer calls. |
| API-004 | PASS. No SDK, exporter, or instrumentation imports. |
| SCH-001 | PASS. All three span names are declared in `agent-extensions.yaml` (L59–73), follow `release_it.<area>.<op>`, and contain no dynamic values. |
| SCH-002 | PASS. `release_it.is_dry_run`, `release_it.is_ci`, and `release_it.version.increment` are in `attributes.yaml`. `release_it.config.file` is in `agent-extensions.yaml` (L7). The agent announced the registration ("is a new extension attribute… No existing registered key covers"), and the key is present on the instrument branch, so the registration succeeded. |
| SCH-003 | **FAIL**. L124 `span.setAttribute('release_it.version.increment', expanded.version.increment)` checks only `!= null`. `increment` comes from the CLI positional arg or `--increment`/`-i` (`lib/args.js` L62) and can be `false` (the documented `--no-increment`, handled explicitly in `Version.js`), which is a boolean reaching a string-enum attribute. Explicit version strings such as `"2.0.0"` also get through, but they are strings and pass under exemption-scope item 5. The other attributes pass: `is_ci`/`is_dry_run` are boolean via `Boolean()`/`!!` against `type: boolean`, and `config.file` is always a string. |
| SCH-004 | PASS. The one agent-added key, `release_it.config.file`, has no near-duplicate. No other registry key has a `config` token. |
| CDQ-001 | PASS. `span.end()` is in `finally` on all three spans (L37, L135, L216). |
| CDQ-002 | PASS. `trace.getTracer('release-it')` (L13) matches the package.json `name`. |
| CDQ-003 | PASS. Errors are recorded with `recordException(error)` + `setStatus({ code: SpanStatusCode.ERROR })`, with no ad-hoc error attributes. |
| CDQ-005 | PASS. The `startActiveSpan` callback pattern manages async context. |
| CDQ-006 | PASS. No value contains a method chain, serialization, or other expensive call. `Boolean(...)` (L30–31) is an exempt trivial conversion, and `!!` (L121–122) is the same coercion. |
| CDQ-007 | PASS. No key matches a PII pattern. Values are booleans, a guarded enum value (L123), and a file name or path that is always defined (`resolveFile` never returns undefined; `false` becomes `''` at L170). Advisory: `release_it.config.file` carries the user-supplied `--config` value verbatim. That is a local file path, not a URL, so it cannot realistically embed a credential, but an absolute path exposes the local filesystem layout and username. |
| CDQ-011 | PASS. `'release-it'` is the canonical name. No `tracerName` is set in `spiny-orb.yaml`, and package.json `name` is `release-it`. |

**Failures**:
- SCH-003, L124: `release_it.version.increment` can receive boolean `false` (`--no-increment`) through a `!= null` guard, against a string-enum declaration.

**Unrubriced findings**: None. Every `return` inside a span callback's `try` returns a plain value: L126 (object literal), L172 (`{}`), L188 (a ternary on the already-awaited `resolvedConfig`). The `.then(...)` chain at L25 is awaited.

**Advisories**:
- `release_it.config.file` can expose an absolute local path. On the `config: false` path it records `''` instead of omitting the attribute.
- `init` (L30–31) and `load_options` (L121–122) set `is_ci`/`is_dry_run` from the same object, so parent and child carry identical values.
- `release_it.is_ci` means `options.ci` here. Version.js, GitHub.js, and GitLab.js set the same key from the `Config.isCI` getter (`config.js` L80–82), which is also true for `--release-version` and `--changelog`. The key name is generic enough to cover both readings ("running non-interactively"), so this passes the SCH-002 "generic reasonable term" test, but the two readings diverge on those flags.
- `init` uses `Boolean()` and `loadOptions` uses `!!`. The agent's attempt-3 thinking says it chose `!!` so the CDQ-006 guard check would not match, so the choice reflects the validator's pattern rather than the code's intent.
- The agent's brief for `release_it.config.file` ("The config file name or path used to load local release-it configuration") did not reach the registry, which has the generic `"Agent-discovered attribute: release_it.config.file"`.
- Attempt history: attempt 1 failed NDS-003 on an added `if (file !== false)` guard, attempt 2 failed LINT, and attempt 3 was clean with the guard rewritten as a ternary inside `setAttribute`. The same NDS-003 check accepted a structurally identical attribute-only guard at L123 (`if (expanded.version != null && ...)`). That is an inconsistency in spiny-orb's NDS-003 guard filter, observed in one run.

**Run-4 comparison**: Same three spans and four attributes as run-4, but 3 attempts instead of 1. Run-4 passed SCH-003 without tracing the `false` path of `increment`. Tracing it directly turns the row into a FAIL on code that is unchanged in this respect.

### 2. lib/plugin/Plugin.js (1 span, 1 attempt)

Spans: `release_it.plugin.show_prompt`

Trace supplementation: unavailable (IS scoring not yet run)

| Rule | Result |
|------|--------|
| NDS-003 | PASS. The only non-span change is at L73–74, where `return this.prompt.show(options)` became `const result = await this.prompt.show(options); return result;`. This is return-value capture inside an `async` method, so the caller gets the same resolved value or the same rejection. L66 (`options.namespace = this.namespace`) is unchanged. |
| API-001 | PASS. L1: `import { trace, SpanStatusCode } from '@opentelemetry/api'`. |
| NDS-006 | PASS. ESM package, ESM import. |
| NDS-004 | PASS. `async showPrompt(options)`, `export default Plugin` (L93), and all other method signatures are unchanged. |
| NDS-005 | PASS. The original file had no try/catch/finally. The only error handling is the agent's own wrapper (L68–81). |
| COV-001 | PASS. `showPrompt` (L65), the only `async` method on the exported `Plugin` base class, has a span. |
| COV-002 | PASS. No direct outbound call sites. `exec` (L58) reaches subprocesses only through the `this.shell.exec` wrapper, and prompts go through `this.prompt.show`. |
| COV-003 | PASS. L76–77 call `recordException` and `setStatus(ERROR)`, then L78 rethrows. |
| COV-004 | PASS. `showPrompt` is the only `async` function or function containing `await`. `exec` (L56) and `step` (L85) are not async and contain no `await`, so the implemented rule does not flag them (exemption-scope item 6). `lib/shell.js` failed instrumentation this run, so subprocess execution reached through `Plugin.exec` is untraced. The place to fix that is `shell.js`, not this pass-through. |
| COV-005 | PASS. L69 sets `release_it.plugin.namespace` and L71 sets `release_it.prompt.name` (guarded). The span definition lists no required attributes. |
| COV-006 | N/A. No operation here is covered by an auto-instrumentation library. |
| RST-001 | PASS. The span is on an `async`, public method that performs interactive-prompt I/O through a library. |
| RST-002 | PASS. `showPrompt` is not an accessor. |
| RST-003 | **FAIL**. L67: `showPrompt`'s original body is one argument transformation (`options.namespace = this.namespace`) plus a single `return this.prompt.show(options)`, which the rubric mechanism defines as a thin wrapper. The callee already has its own span, `release_it.prompt.show` (`lib/prompt.js` L19), so every prompt produces two nested spans for one operation. spiny-orb's implemented RST-003 checks same-file delegation only, and `rules-reference.md` calls the cross-file case a known accepted gap, so the validator could not have caught this (exemption-scope item 7). |
| RST-004 | PASS. Public method of an exported class (exemption-scope item 4). |
| RST-005 | PASS. The original file had no tracer calls. |
| API-004 | PASS. No SDK-internal imports. |
| SCH-001 | PASS. `release_it.plugin.show_prompt` is declared in `agent-extensions.yaml` (L84–88). Its near-duplication of `span.release_it.prompt.show` is scored under RST-003. |
| SCH-002 | PASS. `release_it.plugin.namespace` is registered in `attributes.yaml` (L255), and `this.namespace` is the derived plugin namespace, which matches the registry brief ("The namespace identifier for the plugin", examples `git`/`npm`). `release_it.prompt.name` is in `agent-extensions.yaml` (L15), added earlier in the run by `lib/prompt.js`. |
| SCH-003 | PASS. Both attributes are `type: string`. `this.namespace` is a string, and `options.prompt` is a prompt-name string. No count is cast. |
| SCH-004 | PASS. No new attribute keys. The only extension is the span name. |
| CDQ-001 | PASS. `span.end()` is in `finally` (L80). |
| CDQ-002 | PASS. L6: `trace.getTracer('release-it')`. |
| CDQ-003 | PASS. Standard `recordException(error)` + `setStatus({ code: SpanStatusCode.ERROR })` (L76–77). |
| CDQ-005 | PASS. `startActiveSpan` callback pattern. |
| CDQ-006 | PASS. Both values are simple property access. |
| CDQ-007 | PASS. No PII-pattern keys (`release_it.prompt.name` names a prompt, not a person). The optional `options.prompt` is guarded with `!= null` (L70). `this.namespace` always comes from the constructor argument that the plugin factory supplies. Neither value is a command, URL, or remote. |
| CDQ-011 | PASS. `'release-it'` matches the canonical name. |

**Failures**:
- RST-003, L67: the `release_it.plugin.show_prompt` span wraps a one-line delegation to `prompt.show`, which already emits `release_it.prompt.show`.

**Unrubriced findings**: None. The one `return` inside the span's `try` (L74, `return result`) returns a value already awaited on L73.

**Advisories**:
- spiny-orb's own CDQ-007 advisory at L71 is a false positive. `release_it.prompt.name` holds a prompt identifier, not a person's name or a path.
- The notes in `lib/plugin/Plugin.instrumentation.md` do not match the code in two places. They say `exec` and `step` have "no async I/O", but `exec` delegates subprocess execution and `step` returns a promise. Skipping them is still correct, for the reason in the COV-004 row. They also call `release_it.prompt.name` a "registered schema attribute", but it is an agent extension added earlier in this run by `lib/prompt.js`.
- The parent span records the namespace as `release_it.plugin.namespace` (L69), and the child span in `lib/prompt.js` (L21) records the same value as `release_it.prompt.namespace`. That is one value under two keys on adjacent spans. It is scored in the prompt.js section.
- The log's "0 attributes" counts new schema keys only. The code sets two registered attributes.

**Run-4 comparison**: Same span and structure as run-4, plus a guarded `release_it.prompt.name`. Run-4's table had no RST-003 row, so the RST-003 FAIL is a new evaluation of an unchanged span, not a regression.

### 3. lib/plugin/factory.js (2 spans, 2 attempts)

Spans: `release_it.plugin.load`, `release_it.plugin.get_plugins`

Trace supplementation: unavailable (IS scoring not yet run)

| Rule | Result |
|------|--------|
| NDS-003 | PASS. The diff adds the OTel import (L1), the tracer (L15), the `startActiveSpan` wrappers (L29, L65), `setAttribute` calls (L30, L100–101), the span lifecycle (L49–51, L103–109), and re-indentation. `let plugin` stays outside the callback (L28), as in the original. No business-logic lines changed. |
| API-001 | PASS. `import { trace, SpanStatusCode } from '@opentelemetry/api'` (L1). |
| NDS-006 | PASS. ESM package, ESM import. |
| NDS-004 | PASS. `export let getPlugins = async (config, container)` (L64) and `export const getPluginName` (L56) are unchanged. |
| NDS-005 | PASS. The three-stage dynamic-import fallback (L32–47: `import(pluginName)` → cwd-relative import → `createRequire().resolve`) is unchanged apart from indentation, including catch order, `debug(err)` calls, and no-rethrow behavior. NDS-005b PASS: no recording was added to the graceful catches (L35, L40). |
| COV-001 | PASS. The exported async `getPlugins` has a span (L65). |
| COV-002 | N/A. No outbound network or DB calls. Dynamic `import()` is a module load. |
| COV-003 | **FAIL**. The `release_it.plugin.load` span (L29–52) wraps the import fallback chain in try/finally with no catch. The inner catches are graceful and correctly unrecorded, but if the final fallback (L44) throws, the error leaves the span without `recordException` or `setStatus(ERROR)` (exemption-scope item 8). `get_plugins` passes (L103–106). |
| COV-004 | PASS. Both async functions (`load`, `getPlugins`) have spans. The sync `getPluginName` is correctly skipped. |
| COV-005 | PASS. `release_it.plugin.namespace` on `load` (L30); `enabled_count` and `external_count` on `get_plugins` (L100–101). No required attributes are defined. |
| COV-006 | N/A. No auto-instrumentable library operations. |
| RST-001 | PASS. Neither spanned function is a sync utility. `getPluginName` was left unspanned. |
| RST-002 | PASS. No accessors are spanned. |
| RST-003 | PASS. Neither function is a single-return wrapper. |
| RST-004 | PASS. `load` is unexported but performs module loads through dynamic `import()` and `require.resolve`, which counts as library-mediated I/O (exemption-scope item 4). `getPlugins` is exported. |
| RST-005 | PASS. The original file had no tracer calls. |
| API-004 | PASS. No SDK-internal imports. |
| SCH-001 | PASS. `span.release_it.plugin.load` and `span.release_it.plugin.get_plugins` are declared in `agent-extensions.yaml` (L214, L219). |
| SCH-002 | **FAIL** (changed from PASS in reconciliation). `release_it.plugin.namespace` is set at L30 from the raw `pluginName`, the user's module specifier key from `context.plugins` (for example `@release-it/conventional-changelog` or `./plugins/my-plugin.js`). The registry brief defines the key as "The namespace identifier for the plugin" (examples `git`, `npm`), and Plugin.js L69 sets it from the derived namespace (`getPluginName(pluginName)` or the user-supplied `pluginConfig[0]`). Under the template's "specific wrong noun" test, the key names a specific concept (the namespace) and holds a different one (the module specifier), so this site fails. `enabled_count` and `external_count` are declared in `agent-extensions.yaml` (L51, L55) and pass. |
| SCH-003 | **FAIL**. `release_it.plugin.enabled_count` (L100) is `String(enabledPlugins.length)` and `release_it.plugin.external_count` (L101) is `String(enabledExternalPlugins.length)`, against `type: int` declarations (`agent-extensions.yaml` L52, L56). That is a literal mismatch, and also a count cast to string (exemption-scope item 2). `namespace` (string) conforms. |
| SCH-004 | PASS. The two count keys do not closely match any registered key (the closest, `release_it.github.assets_count`, is a different concept). The agent considered and rejected reusing `release_it.util.collection_size`. |
| CDQ-001 | PASS. `span.end()` is in `finally` on both spans (L49–51, L107–109). |
| CDQ-002 | PASS. `trace.getTracer('release-it')` (L15). |
| CDQ-003 | PASS. `get_plugins` uses the standard pattern (L104–105). `load` has no span catch, so there is no ad-hoc pattern to check. |
| CDQ-005 | PASS. `startActiveSpan` callback pattern on both spans. |
| CDQ-006 | PASS. `String(x.length)` is an exempt trivial conversion of a property access. |
| CDQ-007 | PASS. `pluginName` is always a defined string key from `Object.entries(context.plugins)`, and the counts are always-defined array lengths. No PII-pattern keys. A module specifier or local path cannot carry a credential, though a local path can reveal filesystem layout. |
| CDQ-011 | PASS. `'release-it'` matches the canonical name. |

**Failures**:
- COV-003, L29–52: `release_it.plugin.load` has no error recording, so a failure of the final fallback import leaves the span without error status.
- SCH-002, L30: `release_it.plugin.namespace` holds the module specifier here and the derived namespace in Plugin.js L69.
- SCH-003, L100–101: `enabled_count` and `external_count` are `String(...length)` against `int` declarations.

**Unrubriced findings**: None. Every `return` inside a span `try` returns a plain array literal (L48, L102), and all async work before it is awaited.

**Advisories**:
- The COV-003 gap was caused by the validator. In attempt 1 the agent wrote an outer catch with `recordException` + rethrow, the same shape run-4 committed. spiny-orb flagged it as NDS-005 (added throw in an existing catch) and NDS-007 (recording in an expected-condition catch), and the agent's thinking notes that the cited line numbers did not match its structure. A new outer span catch that rethrows does not change propagation, so both may be validator false positives that pushed the agent to a worse result. Observed in one file this run, so confirm in run-6.
- The notes say both count attributes are "type: int". That is true of the registry entries the agent created, not of the values it emits.

**Run-4 comparison**: Run-4 committed in 1 attempt with an outer recording catch on `load` and passed every rule it scored. Run-5 took 2 attempts. The validator-driven change removed `load`'s error recording (new COV-003 FAIL), the counts are cast to string against the agent's own `int` declarations (SCH-003 FAIL), and the namespace value-source mismatch with Plugin.js is scored for the first time (SCH-002 FAIL). Run-4's evaluation did not record whether its counts were cast or which value fed `namespace`.

### 4. lib/plugin/version/Version.js (1 span, 1 attempt)

Spans: `release_it.version.get_incremented_version`

Trace supplementation: unavailable (IS scoring not yet run)

| Rule | Result |
|------|--------|
| NDS-003 | PASS. The diff adds only the import (L1), the tracer (L59), and the `startActiveSpan`/try/catch/finally wrapper with three attribute calls (L76–95). The three original statements are verbatim and in order (L78, L86, L87). |
| API-001 | PASS. The only OTel import is `@opentelemetry/api` (L1). |
| NDS-006 | PASS. ESM. |
| NDS-004 | PASS. `async getIncrementedVersion(options)` (L75) has the same signature. It returns the `startActiveSpan` promise, so callers (`lib/index.js` via `reduceUntil`) get the same resolved value. |
| NDS-005 | PASS. The original had no try/catch. The added catch (L88–91) rethrows. |
| COV-001 | PASS. `getIncrementedVersion`, the only async public method of the exported `Version` class, has a span (L76). |
| COV-002 | N/A. No outbound HTTP, DB, or subprocess calls. Prompting goes through `this.step`. |
| COV-003 | PASS. `recordException` + `setStatus(ERROR)` (L89–90). |
| COV-004 | PASS. `getIncrementedVersion` has a span. `promptIncrementVersion` (L98–110) is not async and contains no `await`, so the implemented rule does not flag it (exemption-scope item 6). Its returned promise is awaited at L87 inside the span, so prompt time is already covered. |
| COV-005 | PASS. Sets three registered domain attributes: `release_it.is_ci` (L79), `release_it.version.current` (L81), `release_it.version.increment` (L84). The registered `release_it.version.next` is not captured (see Advisories). |
| COV-006 | N/A. No auto-instrumentation covers version resolution. |
| RST-001 | PASS. The span is on an async method with `await`. Sync helpers (`getIncrement`, `getIncrementedVersionCI`, `isPreRelease`, `isValid`, `incrementVersion`, `getIncrementChoices`, `versionTransformer`) are unspanned. |
| RST-002 | PASS. Not an accessor. |
| RST-003 | PASS. The original body has three statements, not a single delegating return. |
| RST-004 | PASS. Public method of an exported class (exemption-scope item 4). |
| RST-005 | PASS. No prior instrumentation. |
| API-004 | PASS. No SDK-internal imports. |
| SCH-001 | PASS. Declared in `agent-extensions.yaml` (`span.release_it.version.get_incremented_version`, L209). |
| SCH-002 | PASS. `release_it.version.current` (L14), `release_it.version.increment` (L31), and `release_it.is_ci` (L82) are registered in `attributes.yaml`. |
| SCH-003 | **FAIL** (changed from PASS in reconciliation, per exemption-scope item 5). L83–84 guard `release_it.version.increment` with `options.increment != null` only. `lib/index.js` builds `incrementBase.increment` from `options.version.increment` and passes it into `getIncrementedVersion`, so the documented `--no-increment` delivers boolean `false` to a string-enum attribute on the interactive path. Explicit version strings also reach the attribute but pass under item 5. `is_ci` (boolean) and `version.current` (semver string) conform. |
| SCH-004 | PASS. No new attribute keys. |
| CDQ-001 | PASS. `span.end()` is in `finally` (L93). See Advisories for the `process.exit(0)` path. |
| CDQ-002 | PASS. `trace.getTracer('release-it')` (L59). |
| CDQ-003 | PASS. Standard pattern (L89–90). |
| CDQ-005 | PASS. The `startActiveSpan` callback keeps the awaited `promptIncrementVersion` → `this.step` in the span's context. |
| CDQ-006 | PASS. All values are plain variables or property access. |
| CDQ-007 | PASS. No PII-pattern keys. All values are bounded scalars. `latestVersion` and `increment` are guarded by `!= null` (L80, L83), and `is_ci` comes from a getter that always returns a boolean. No value can carry a credential. |
| CDQ-011 | PASS. `'release-it'` matches the canonical name. |

**Failures**:
- SCH-003, L84: `release_it.version.increment` can receive boolean `false` (`--no-increment`) through a `!= null` guard, against a string-enum declaration. This is the same pattern and verdict as config.js L124.

**Unrubriced findings**: None. The only `return` inside the span's `try` is L87, `return version || (isCI ? null : await this.promptIncrementVersion(options));`, where the only promise-valued operand is awaited.

**Advisories**:
- The agent notes and thinking call `promptIncrementVersion` "an unexported helper … skipped per RST-004". It is a public method of an exported class. Skipping it is still correct, but the reason given is wrong.
- `release_it.version.next` (registered) is no longer captured. The agent believed capturing the `||` result in a variable would violate NDS-003. Run-4 captured it behind a `result != null` guard. This loses diagnostic value but fails no rule.
- `process.exit(0)` (L103, when the user picks Exit at the prompt) skips the `finally` at L93, so the span is never ended or exported on that path. The notes disclose this.
- If `this.step(...)` rejects inside the `new Promise` executor (L100–108), the outer promise never settles and the span never ends. This hang exists in the original code; instrumentation only makes it visible.
- The log's "0 attributes" counts new schema keys only. The code sets three registered attributes.

**Run-4 comparison**: Committed in 1 attempt instead of 3, with the same span and coverage choices. Run-5 drops `release_it.version.next`, which run-4 set, so it has 3 attributes instead of 4. Run-4 passed SCH-003 on the static type. Tracing the `false` path turns it into a FAIL on code that is unchanged in this respect.

### 5. lib/util.js (1 span, 2 attempts)

Spans: `release_it.util.reduce_until`

Trace supplementation: unavailable (IS scoring not yet run)

| Rule | Result |
|------|--------|
| NDS-003 | PASS. The diff adds only the OTel import (L1), the tracer (L13), the `startActiveSpan` wrapper (L107), `setAttribute` (L109), the catch with `recordException`/`setStatus` (L116–119), and `span.end()` in finally (L120–122). The original `reduceUntil` body (L110–115) only moved for indentation. Attempt 1's `Array.isArray` guard, which tripped NDS-003, is gone. |
| API-001 | PASS. The only OTel import is `@opentelemetry/api` (L1). |
| NDS-006 | PASS. ESM. |
| NDS-004 | PASS. `reduceUntil(collection, fn)` is still an exported async arrow function with the same parameters and return value. |
| NDS-005 | PASS. `reduceUntil` had no try/catch. The new catch records and rethrows (L116–119). |
| COV-001 | PASS. `reduceUntil` (L106), the only exported async function, has a span. |
| COV-002 | N/A. No outbound network or DB calls. |
| COV-003 | PASS. `recordException` + `setStatus(ERROR)` + rethrow (L117–119). |
| COV-004 | PASS (changed from FAIL in reconciliation, per exemption-scope item 6). `reduceUntil` is the only async function or function containing `await`, and it has a span. The exported sync fs helpers (`readJSON` L56, `hasAccess` L126–133, `touch` L157–173) match the research rubric's I/O-library clause, but spiny-orb's implemented COV-004 explicitly does not flag sync functions. That drift is recorded under "Rule-fit issues for the handoff" in `exemption-scope.md`. `readJSON` also runs at module load, before the SDK starts, so a span there would never be recorded. |
| COV-005 | PASS. No required attributes are defined for this extension span. The agent added `release_it.util.collection_size` (L109). |
| COV-006 | N/A. No auto-instrumentation applies. |
| RST-001 | PASS. `reduceUntil` is async, contains `await` (L113), and is exported, so the mechanism does not flag it. The sync utilities are unspanned. |
| RST-002 | PASS. No accessors are spanned. |
| RST-003 | PASS. `reduceUntil` is a loop, not a single-return wrapper. |
| RST-004 | PASS. Exported function. The unexported helpers (`wait`, `before`, `tryStatFile`, `parsePath`) are unspanned. |
| RST-005 | PASS. No prior tracer calls. |
| API-004 | PASS. No SDK, exporter, or instrumentation imports. |
| SCH-001 | PASS. Declared as `span.release_it.util.reduce_until` in `agent-extensions.yaml`. No dynamic values. |
| SCH-002 | PASS. `release_it.util.collection_size` is declared in `agent-extensions.yaml`. No base registry key covers a generic iteration count. |
| SCH-003 | **FAIL**. L109 sets `String(collection.length)`. The agent declared the attribute `type: string`, so code and schema agree, but a length-derived count cast to string fails regardless of the declared type (exemption-scope item 2, matching taze run-17). |
| SCH-004 | PASS. No near-duplicate by tokens. The closest in meaning is `release_it.plugin.*_count` (factory.js), which counts enabled internal or external plugins separately. `collection_size` at its six `lib/index.js` call sites is the combined plugin-list length, a different measure. |
| CDQ-001 | PASS. `span.end()` is in `finally` (L120–122). |
| CDQ-002 | PASS. `trace.getTracer('release-it')` (L13). |
| CDQ-003 | PASS. Standard pattern (L117–118). |
| CDQ-005 | PASS. `startActiveSpan` callback pattern. |
| CDQ-006 | PASS. `String()` of a property access is an exempt trivial conversion. |
| CDQ-007 | PASS. No PII-pattern key, and the value is a bounded count. All six call sites pass `plugins`, which is always an array (`lib/index.js` L52), so `collection` is never null before `.length`. |
| CDQ-011 | PASS. `'release-it'` matches the canonical name. |

**Failures**:
- SCH-003, L109: `String(collection.length)` records a count as a string, with the schema retyped to `string` to match the cast.

**Unrubriced findings**: None. The only `return` inside the span's `try` is `return result;` (L115), a plain value. The user-supplied `fn(item)` is awaited inside the loop, so it settles before `finally` runs.

**Advisories**:
- The notes do not match the code. The agent notes in the log and in `lib/util.instrumentation.md` call `release_it.util.collection_size` "type: int" and say it "is set via direct property access on collection.length; for non-Array iterables this will be undefined and the OTel SDK will silently discard it, so no guard is needed." In the code the value is wrapped in `String(...)`, the registry declares `type: string`, and `String(undefined)` produces the literal string `"undefined"`, which the SDK records rather than drops. Attempt 2's thinking also describes the uncast value, so the cast and the schema retype went undocumented.
- The span is on a generic helper that fires six times per release run, and the only attribute that tells the calls apart is `collection_size`, which is the same plugin count every time. An attribute naming which plugin method is being reduced (`getName`, `getLatestVersion`, and so on) would carry more information.
- util.js's retype of `collection_size` to `string` affected a later file: factory.js's agent explicitly declined to reuse the key because it is string-typed.

**Run-4 comparison**: Run-4 committed this file in 1 attempt with the same span and attribute, and scored SCH-003 PASS while describing the value as a raw integer length. Run-5 took 2 attempts after an NDS-003 rejection of the `Array.isArray` guard, and now casts the value with `String()` and declares it `string`, which makes SCH-003 a FAIL.
