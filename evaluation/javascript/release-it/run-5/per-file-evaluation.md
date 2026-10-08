# Per-File Evaluation — release-it Run 5

**Date**: 2026-10-07
**Branch**: spiny-orb/instrument-1790686416741 (PR #4 in wiggitywhitney/release-it)
**Rubric**: 32 rules (5 gates + 27 quality), from `docs/research/evaluation-rubric.md` in the spiny-orb repo, with the interpretations fixed in `exemption-scope.md`
**Files evaluated**: 23 (9 committed + 4 failed + 10 harness-labeled correct skips, of which 8 are confirmed and 2 are questionable; see "Correct Skips (10)")

Interpretations of ambiguous rules are fixed in `exemption-scope.md` and applied the same way in every section. Sections were written by delegated per-file agents and then reconciled by the coordinating session. Where reconciliation changed an agent's verdict, the row says so.

Every section is static-only. Live trace data is created during IS scoring, which has not run yet. The reconciliation step folds it in once `trace-artifact.md` exists.

Run-4's per-file tables had 20 rows. Run-5's have 28. The eight added rows are COV-002, RST-002, RST-003, RST-005, API-004, SCH-004, CDQ-006, and CDQ-011. Run-4 scored API-004 and CDQ-008 in its separate per-run table. CDQ-011 replaces CDQ-008, which the rubric marks as deleted. A FAIL on one of these rows is a new evaluation, not a regression, unless the code changed.

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

CDQ-011 (canonical tracer name) is per-file under the current rubric and appears in each section. All 9 committed files call `trace.getTracer('release-it')`. The rubric takes the canonical name from `tracerName` in the spiny-orb config or, when that is unset, from the Weaver registry manifest's `name` normalized to hyphens. No `tracerName` is set, and `semconv/registry_manifest.yaml` has `name: release_it`, so the canonical name is `release-it`. Several CDQ-011 rows cite package.json `name` instead. That is the CDQ-002 source, and it gives the same name, so no verdict changes (noted in reconciliation).

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
| COV-002 | N/A (changed from PASS in reconciliation, per exemption-scope item 15). The file has no outbound HTTP, database, or queue call site. The c12 `loadC12` call (L174) is a local config-file read, and it runs inside `release_it.config.load_local_config`. The module-level `readJSON` (L12) runs at import time, outside any function. |
| COV-003 | PASS. All three spans have `recordException` + `setStatus(ERROR)` + rethrow. The wrapped c12 error from L184 reaches the L211 catch. |
| COV-004 | PASS. All three async functions have spans: `init` (L22), `loadOptions` (L107), `loadLocalConfig` (L162). |
| COV-005 | PASS. The registry defines no required or recommended attributes per span. The domain attributes are present: `release_it.is_ci` and `release_it.is_dry_run` (L30–31, L121–122), `release_it.version.increment` (L124), `release_it.config.file` (L170). |
| COV-006 | N/A (changed from PASS in reconciliation, per exemption-scope item 15). No auto-instrumentation package covers c12 config resolution or option merging. |
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
| COV-002 | N/A (changed from PASS in reconciliation, per exemption-scope item 15). No direct outbound call sites. `exec` (L58) reaches subprocesses only through the `this.shell.exec` wrapper, and prompts go through `this.prompt.show`. |
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
| SCH-004 | PASS (evidence corrected in reconciliation, per exemption-scope item 16; verdict unchanged). The token step does flag one pair: `release_it.plugin.enabled_count` and `release_it.plugin.external_count` score a Jaccard similarity of 0.67 against each other. The semantic check clears it, because the two keys count different sets (all enabled plugins and the external subset), set side by side on one span. Neither key crosses 0.5 against any other registry key; `release_it.github.assets_count` scores 0.43. The agent considered and rejected reusing `release_it.util.collection_size`. |
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

### 6. lib/prompt.js (1 span, 2 attempts)

Spans: `release_it.prompt.show`

Trace supplementation: unavailable (IS scoring not yet run)

| Rule | Result |
|------|--------|
| NDS-003 | PASS. The diff adds the OTel import (L1), the tracer (L4), the `startActiveSpan` wrapper with try/catch/finally (L19–20, L46–53), and four `setAttribute` calls (L21–23, L37). The original statements of `show` are re-indented and keep their order. The one other change is at L39–41, where the original single-line `await (this.createPrompt ? ... : types[prompt.type](options))` is wrapped across three lines. That is the Prettier line split the agent applied in attempt 2. The tokens are identical, so the change is whitespace only and counts as re-indentation (exemption-scope item 10). `show` still returns the callback's promise, which resolves to the same value as the original. |
| API-001 | PASS. The only OTel import is `import { trace, SpanStatusCode } from '@opentelemetry/api'` (L1). |
| NDS-006 | PASS. package.json has `"type": "module"`, and the added import is ESM. |
| NDS-004 | PASS. `async show({ enabled = true, prompt: promptName, namespace = 'default', task, context })` (L18), `register` (L13), the constructor, and `export default Prompt` (L57) are unchanged. |
| NDS-005 | PASS. The original file had no try/catch/finally. The added catch (L46–49) records the error and rethrows. No silent catch exists, so NDS-005b does not apply. |
| COV-001 | PASS. `show` (L18), the only async public method of the exported `Prompt` class, has a span (L19). `register` is sync and the constructor is not an entry point. |
| COV-002 | N/A. No outbound network, database, or subprocess call sites. The interactive prompt goes through `@inquirer/prompts` or the injected `createPrompt` (L39–41), which is terminal I/O, not an outbound call. |
| COV-003 | PASS. Every failable operation (the prompt lookup at L26, `prompt.message(context)` at L28, the prompt call at L39–41, and the awaited `task(answer)` at L45) is inside the `try`. The catch calls `recordException` and `setStatus(ERROR)` and rethrows (L47–49). |
| COV-004 | PASS. `show` is the only async function or function containing `await`, and it has a span. |
| COV-005 | PASS. The registry defines no required or recommended attributes for this extension span. The domain attributes namespace, prompt name, enabled flag, and prompt type are present (L21–23, L37). |
| COV-006 | N/A. No auto-instrumentation package covers inquirer prompts. |
| RST-001 | PASS. The spanned method is async, contains `await` (L39, L45), and is a public method of an exported class. The sync `register` (L13–16) is correctly unspanned. |
| RST-002 | PASS. `show` is not an accessor. |
| RST-003 | PASS. `show`'s original body has about a dozen statements (lookup, option building, prompt call, conditional task), not a single delegating return. This span is the callee in Plugin.js's RST-003 FAIL (`showPrompt` → `prompt.show`). That duplicate is attributed to Plugin.js, the thin wrapper. |
| RST-004 | PASS. Public method of an exported class with no `#` or `_` prefix (exemption-scope item 4). |
| RST-005 | PASS. The original file had no tracer calls. |
| API-004 | PASS. No SDK, exporter, or instrumentation imports. |
| SCH-001 | PASS. `span.release_it.prompt.show` is declared in `agent-extensions.yaml` (L74–78), follows `release_it.<area>.<op>`, and contains no dynamic values. |
| SCH-002 | PASS. All four keys (`release_it.prompt.namespace`, `.name`, `.enabled`, `.type`) are declared in `agent-extensions.yaml` (L11–26), and each key holds the concept its name states. The duplication of `release_it.prompt.namespace` with the registered `release_it.plugin.namespace` is a redundancy, not a wrong noun, so it is scored under SCH-004. |
| SCH-003 | **FAIL**. L23 `span.setAttribute('release_it.prompt.enabled', enabled)` records a boolean (the default is `true`, and the in-tree callers in `Git.js` L93–95 pass the boolean `commit`/`tag`/`push` options), but `agent-extensions.yaml` L19–20 declares the key `type: string`. A non-string value reaches a string attribute on every call (exemption-scope item 5). The other three attributes conform: `namespace` is a string (default `'default'`, otherwise the plugin namespace), `promptName` is a prompt-name string when defined, and `prompt.type` is `'confirm'`/`'input'`/`'list'`. |
| SCH-004 | **FAIL**. `release_it.prompt.namespace` (L21) is an agent-added key with a near-duplicate in the registry. Split on delimiters, its tokens `{release, it, prompt, namespace}` and `release_it.plugin.namespace`'s tokens `{release, it, plugin, namespace}` give a Jaccard similarity of 0.6, above the 0.5 threshold. The semantic check confirms it. The only in-tree caller, `Plugin.showPrompt`, sets `options.namespace = this.namespace` (Plugin.js L66) and then records the same `this.namespace` as `release_it.plugin.namespace` on the parent span (Plugin.js L69). Prompts are registered under that same namespace (`registerPrompts`, Plugin.js L62), and the registry brief for `release_it.plugin.namespace` is "The namespace identifier for the plugin". One value is recorded under two keys on adjacent spans. Reconciliation (exemption-scope item 16): the file's other three agent-added keys also cross 0.5 on tokens. `release_it.prompt.name` scores 0.6 against `release_it.hook.name`, `release_it.package_name`, `release_it.gitlab.release.name`, and its own siblings. `release_it.prompt.enabled` and `release_it.prompt.type` score 0.6 against their siblings only. The semantic check clears all of them, because each names a different concept, so they add no FAIL. |
| CDQ-001 | PASS. `span.end()` is in `finally` (L50–52). |
| CDQ-002 | PASS. `trace.getTracer('release-it')` (L4) matches the package.json `name`. |
| CDQ-003 | PASS. The catch uses `recordException(error)` + `setStatus({ code: SpanStatusCode.ERROR })` (L47–48), with no ad-hoc error attributes. |
| CDQ-005 | PASS. The `startActiveSpan` callback pattern manages async context, so spans created inside the awaited `task(answer)` (for example a Git commit) nest under `release_it.prompt.show`. |
| CDQ-006 | PASS. All four values are plain variables or a simple property access (`prompt.type`). |
| CDQ-007 | **FAIL**. L22 `span.setAttribute('release_it.prompt.name', promptName)` is unconditional, and `promptName` comes from the destructured `prompt` option, which has no default and no defined-value guard (exemption-scope item 11). A call without `prompt` and with `enabled: false` reaches L22 and then returns at L24 without throwing, so it records `undefined`. `show` is public API reached by any plugin through `Plugin.step`, and steps without a `prompt` exist in-tree (GitHub.js L187–191, GitLab.js L223–224). The sibling Plugin.js guards the same value with `options.prompt != null` (Plugin.js L70). The other values pass: `namespace` and `enabled` have defaults, and `prompt.type` is read after a lookup that throws first if the prompt is missing. No key matches a PII pattern, and no value is a command, URL, or remote that could embed a credential. |
| CDQ-011 | PASS. `'release-it'` matches the canonical name. No `tracerName` is set in `spiny-orb.yaml`, and package.json `name` is `release-it`. |

**Failures**:
- SCH-003, L23: `release_it.prompt.enabled` records a boolean, but the registry entry the agent created declares it `type: string`.
- SCH-004, L21: `release_it.prompt.namespace` duplicates the registered `release_it.plugin.namespace`, both by token similarity and by value (Plugin.js L66 and L69 feed the same `this.namespace` into both keys).
- CDQ-007, L22: `release_it.prompt.name` is set unconditionally from an optional parameter with no default. On the `enabled: false` path without a `prompt` it records `undefined`.

**Unrubriced findings**: None. The two `return`s inside the span's `try` both return settled values. L24 `return false` is a plain value. L45 `return doExecute && task ? await task(answer) : false;` awaits the user-supplied `task` before `finally` runs. The prompt promise at L39–41 is also awaited.

**Advisories**:
- The companion `lib/prompt.instrumentation.md` contradicts the code and registry in three places. (1) It calls `release_it.prompt.enabled` a "new boolean attribute", but the registry declares `type: string` (`agent-extensions.yaml` L20). The agent's intent was boolean, so the extension writer may default extension types to string; check this in spiny-orb. (2) It says no registered key "semantically matches a prompt namespace identifier", but `release_it.plugin.namespace` holds the same value. (3) It lists spiny-orb's CDQ-007 advisory at L37, which cites a PII attribute name or a raw filesystem path. L37 is `release_it.prompt.type`, whose values are `confirm`/`input`/`list`, so the advisory is a false positive.
- A span is created and exported even when the prompt is disabled (`enabled: false` returns at L24 after three attributes). In interactive runs, every disabled Git commit, tag, or push step emits a `release_it.prompt.show` span with only `enabled=false`.
- Each interactive prompt produces two nested spans (`release_it.plugin.show_prompt` → `release_it.prompt.show`) that carry the same namespace and prompt name. This is scored as RST-003 in Plugin.js and as SCH-004 here. Plugin.js guards `release_it.prompt.name` (L70–72) and this file does not (L22).
- The log's "4 attributes" matches the code.

**Run-4 comparison**: Run-4 did not commit this file. After 3 attempts it failed LINT, because the span wrapper's extra indentation pushed the `const answer = await (...)` line past Prettier's 120-character width, and NDS-003 rejected the split that Prettier wanted. In run-5, attempt 1 failed LINT for the same reason, and attempt 2 applied the Prettier split (L39–41), which NDS-003 now accepted. This is the file's first scored evaluation, so all three FAILs (SCH-003, SCH-004, CDQ-007) are new evaluations, not regressions. Run-4's table had no RST-003 row.

### 7. lib/plugin/GitRelease.js (2 spans, 2 attempts)

Spans: `release_it.git_release.before_release`, `release_it.git_release.process_release_notes`

Trace supplementation: unavailable (IS scoring not yet run)

| Rule | Result |
|------|--------|
| NDS-003 | PASS. The diff adds the OTel import (L1), the tracer (L6), two `startActiveSpan` wrappers with try/catch/finally (L35–57, L61–80), three `setAttribute` calls (L45, L63, L70), and one attribute-only guard (L44). Original statements are re-indented. The one layout change is the `releaseNotes` ternary (L39–42). The original continuation line was 118 characters, which grows to 122 after the extra indentation, so Prettier splits it into three lines with identical tokens (exemption-scope item 10). `beforeRelease` now returns `tracer.startActiveSpan(...)`, which resolves to `undefined`, the same as the original implicit return. `processReleaseNotes` resolves to the same values as before (`script(ctx)`, `this.exec(script)`, or `undefined`). |
| API-001 | PASS. The only OTel import is `import { trace, SpanStatusCode } from '@opentelemetry/api'` (L1). |
| NDS-006 | PASS. package.json has `"type": "module"`, and the added import is ESM. |
| NDS-004 | PASS. `export default GitRelease` (L94) is unchanged. The signatures of `isEnabled`, `getInitialOptions`, the `token` getter, `beforeRelease`, `processReleaseNotes`, and `afterRelease` are unchanged, and both instrumented methods are still `async`. |
| NDS-005 | PASS. The original file had no try/catch/finally. The only error handling is the agent's own wrappers, which record the error and rethrow (L50–53, L73–76). There is no silent catch, so NDS-005b does not apply. |
| COV-001 | PASS. The exported class has two async methods, `beforeRelease` (L34), a plugin lifecycle hook the runner calls, and `processReleaseNotes` (L60). Both have spans. `afterRelease` (L83) is synchronous and only logs. |
| COV-002 | N/A (changed from PASS in reconciliation, per exemption-scope item 15). The file has no direct network or database call sites. The subprocess for a string `releaseNotes` runs through the `this.exec` → `this.shell.exec` wrapper (L71), inside the `process_release_notes` span. That span ends before the subprocess finishes (see Unrubriced findings). |
| COV-003 | PASS (changed from FAIL in reconciliation). Both spans call `recordException` and `setStatus(ERROR)` in a catch and rethrow (L50–53, L73–76). Rejections from `this.exec(script)` (L71) and from a promise returned by a user `releaseNotes` function (L66) settle after `span.end()` and never reach the L73 catch. The span callback itself does not throw on those paths, so item 8's test does not apply, and exemption-scope item 9 assigns the missed rejection to the item-1 unrubriced findings below. The parent `before_release` span does record such a rejection, because L41 awaits `processReleaseNotes`. |
| COV-004 | PASS. Both `async` functions have spans. No other function is async or contains `await`. |
| COV-005 | PASS. The registry defines no required or recommended attributes per span. Domain attributes are present: `release_it.changelog.length` (L45), `release_it.git_release.script_type` (L63), and `release_it.hook.command` (L70). |
| COV-006 | N/A (changed from PASS in reconciliation, per exemption-scope item 15). No auto-instrumentation library covers these operations. The subprocess is launched through release-it's own shell wrapper. |
| RST-001 | PASS. Both spanned functions are async and reach I/O, through `await this.processReleaseNotes` or `this.exec`. The synchronous `isEnabled`, `getInitialOptions`, and `afterRelease` are correctly left unspanned. |
| RST-002 | PASS. The `token` getter (L29–32) has no span. |
| RST-003 | PASS. Neither body is a single delegating `return`. `processReleaseNotes` branches between two returns on the script type, and its delegate `Plugin.exec` has no span of its own, because `lib/shell.js` failed instrumentation this run. |
| RST-004 | PASS. Both methods are public methods of an exported class with no `#` or `_` prefix (exemption-scope item 4). |
| RST-005 | PASS. The original file had no tracer calls. |
| API-004 | PASS. No SDK, exporter, or instrumentation imports. |
| SCH-001 | PASS. Both span names are declared in `agent-extensions.yaml` (L89–98), follow the `release_it.<area>.<op>` pattern, and contain no dynamic values. spiny-orb's own SCH-001 advisory in the companion file is not supported by the final registry. |
| SCH-002 | **FAIL**. `release_it.changelog.length` (`attributes.yaml` L148) and `release_it.git_release.script_type` (`agent-extensions.yaml` L31) match. `release_it.hook.command` (L70) does not (exemption-scope item 13). The registry group defines it for user-defined lifecycle hook script execution, with brief "The shell command executed by the hook" and sibling `release_it.hook.name` ("The lifecycle event name that triggered this hook"). L70 records the `github.releaseNotes`/`gitlab.releaseNotes` generator command instead, which is not a configured hook. The agent's own thinking says "the string-script case isn't technically a traditional hook". A query on `hook.command` would mix hook commands and release-notes commands. The span also sets no `hook.name`. |
| SCH-003 | PASS. `release_it.changelog.length` (`type: int`) gets the raw `releaseNotes.length` with no cast, which passes under exemption-scope item 2. On every documented path `releaseNotes` is a string: `changelog`, trimmed stdout, or a user function's string. `script_type` gets a string literal, and `hook.command` gets a value already narrowed by `typeof script === 'string'` (L69). |
| SCH-004 | PASS. The one agent-added key, `release_it.git_release.script_type`, has no near-duplicate. The closest token match is `release_it.prompt.type`, which is a different concept. |
| CDQ-001 | PASS. `span.end()` is in `finally` on both spans (L55, L78). Exemption-scope item 1 keeps this PASS despite the un-awaited returns. |
| CDQ-002 | PASS. `trace.getTracer('release-it')` (L6) matches package.json `name`. |
| CDQ-003 | PASS. Both catches use `recordException(error)` plus `setStatus({ code: SpanStatusCode.ERROR })`, with no ad-hoc error attributes. |
| CDQ-005 | PASS. Both spans use the `startActiveSpan` callback pattern. |
| CDQ-006 | PASS. The values are a `typeof` ternary (L63), a raw string (L70), and a `.length` property access (L45). Nothing iterates or serializes. |
| CDQ-007 | PASS. No key matches a PII pattern. `releaseNotes` is guarded with `!= null` (L44), and `script` is guarded by `typeof === 'string'` (L69). Advisory: `release_it.hook.command` records the user-configured `releaseNotes` command template verbatim, before `format()` interpolation in `shell.exec`. A token written literally into that command, for example in a `curl` header, would be exported. `$VAR` references stay unexpanded. No rule inspects value content (exemption-scope item 3). |
| CDQ-011 | PASS. `'release-it'` is the canonical name. No `tracerName` is set, and package.json `name` is `release-it`. |

**Failures**:
- SCH-002, L70: `release_it.hook.command`, defined for lifecycle hook commands, holds the release-notes generator command.

**Unrubriced findings**:
- `processReleaseNotes`, L66: `return script(ctx)` with no `await`. `script` is a user-supplied `releaseNotes` function, and the docs (`docs/github-releases.md` L124, `docs/gitlab-releases.md` L67) allow it to return a promise. No span calls run inside the returned promise, because `script_type` is set at L63 beforehand. The span ends before the function settles, so its duration leaves out the function's work, and a rejection skips the L73 catch.
- `processReleaseNotes`, L71: `return this.exec(script)` with no `await`. `Plugin.exec` returns `shell.exec(...)`, which returns the promise from `async execFormattedCommand`. No span calls run inside the returned promise, because `hook.command` is set at L70 beforehand. The span ends before the subprocess finishes, so the span's duration leaves out the subprocess runtime, and a non-zero exit skips the L73 catch. The parent span records it instead (L41 awaits).

**Advisories**:
- The notes and log in `GitRelease.instrumentation.md` disagree with the code in several places:
  - The notes call `release_it.hook.command` a "semantic match". The agent's attempt-1 thinking says the case "isn't technically a traditional hook", and the registry group is scoped to lifecycle hooks.
  - The attempt-1 thinking says the ternary "stays formatted exactly as in the original". The committed code reformats it, which the attempt-2 note correctly reports.
  - The attempt-1 thinking says "CDQ-006 explicitly exempts span attributes on entry points". The rubric's CDQ-006 exemption covers trivial type conversions only. The values here pass on their own merits.
  - The companion lists an SCH-001 advisory, but both span names are declared in `agent-extensions.yaml`.
  - The notes never mention that both returns in `processReleaseNotes` are un-awaited.
  - The log's "1 attribute" counts new schema keys only. The code sets three keys.
- `release_it.changelog.length` here measures the final release notes, which can be custom output rather than the changelog. When there is no script it equals the changelog. GitHub.js L636 and GitLab.js L315 use the same reading.
- GitLab.js `beforeRelease` awaits `super.beforeRelease()` (GitLab.js L134), so for GitLab this file's `before_release` span nests under `release_it.gitlab.before_release`. GitHub does not override `beforeRelease`, so there the span stands alone.

**Run-4 comparison**: Run-4 left this file uncommitted after 3 attempts, because the span wrapper pushed the `releaseNotes` ternary past Prettier's 120-character limit, and the deep dive says NDS-003 then required the original 2-line layout. In run-5 the agent reformatted the ternary to Prettier's 3-line form in attempt 2, and NDS-003 accepted it, so the file committed in 2 attempts. Every row here is a first evaluation of this file's instrumentation, not a regression.

### 8. lib/plugin/github/GitHub.js (13 spans, 2 attempts)

Spans: `release_it.github.init`, `release_it.github.is_authenticated`, `release_it.github.is_collaborator`, `release_it.github.release`, `release_it.github.get_latest_release`, `release_it.github.get_octokit_release_options`, `release_it.github.create_release`, `release_it.github.generate_web_url`, `release_it.github.create_web_release`, `release_it.github.update_release`, `release_it.github.comment_on_resolved_items`, `release_it.github.get_commits`, `release_it.github.render_release_notes`

Trace supplementation: unavailable (IS scoring not yet run)

| Rule | Result |
|------|--------|
| NDS-003 | PASS. The diff adds the OTel import (L1), the tracer (L28), 13 `startActiveSpan` wrappers with try/catch/finally, and 33 `setAttribute` calls, and re-indents the original bodies. The original statement order is unchanged in every method. There are two non-span edits. (1) L626–637 in `renderReleaseNotes`: `return commits.map(...).join('\n')` became `const result = ...; return result;`, which is return-value capture of a synchronous string with the same result, matching the Plugin.js precedent. (2) L562–564 in `commentOnResolvedItems`: the `mergedPullRequests` `flatMap` statement is reflowed from one line to three with identical tokens, which the added indentation and the project's 120-character Prettier width forced (exemption-scope item 10). The two emoji log lines that run-4 mangled (L581, L583) are byte-identical to the original. |
| API-001 | PASS. The only OTel import is `import { trace, SpanStatusCode } from '@opentelemetry/api'` (L1). |
| NDS-006 | PASS. package.json has `"type": "module"`, and the added import is ESM. |
| NDS-004 | PASS. `export default GitHub` (L649) is unchanged, and so are the names and parameters of all 13 wrapped methods, including `getOctokitReleaseOptions(options = {})` (L274) and `renderReleaseNotes(releaseNotes)` (L618). Each wrapped method returns the `startActiveSpan` promise, which resolves to what the original returned. |
| NDS-005 | PASS. All seven pre-existing try/catch blocks are kept verbatim: `init` around `getLatestRelease` (L95–104), `isAuthenticated` (L124–132), `isCollaborator` (L152–160), `getLatestRelease` (L255–263), the `createRelease` retry callback (L356–380), the `updateRelease` retry callback (L523–532), and the per-item `createComment` catch in `commentOnResolvedItems` (L579–584). The new outer catches record the error and rethrow. NDS-005b: no recording was added to the graceful catches that return `false`, set `isUpdate: false`, or log a failure. |
| COV-001 | PASS. `GitHub` is the exported class, and all 13 of its async public methods have spans, including the plugin lifecycle entry points `init` (L53) and `release` (L172). |
| COV-002 | PASS. Every Octokit call site sits inside a span: `users.getAuthenticated` (L126), `repos.checkCollaborator` (L155), `repos.listReleases` (L258), `repos.createRelease` (L358), `repos.updateRelease` (L525), `search.issuesAndPullRequests` via `searchQueries` (L561), `issues.createComment` (L580), and `repos.compareCommits` (L605). The `open()` subprocess (L492) is inside `create_web_release`. `repos.uploadReleaseAsset` (L410) is in `uploadAsset`, which has no span. It runs under `release_it.github.release` on the CI path (awaited at L188), and on the interactive path under `release_it.plugin.show_prompt`/`release_it.prompt.show`, which await the task (`lib/prompt.js` L45). The `createRelease` and `updateRelease` API calls are inside their spans in the source but run after those spans end, which is recorded under Unrubriced findings. |
| COV-003 | PASS. All 13 spans have `recordException` + `setStatus(ERROR)` + rethrow in their own catch. Errors that `handleError` throws from `getLatestRelease` (L262) reach that span's catch. The graceful inner catches are correctly left unrecorded (exemption-scope item 8). Rejections from the un-awaited returns at L185, L189, L199, L355, and L522 never reach their span's catch, which exemption-scope item 9 assigns to Unrubriced findings. |
| COV-004 | PASS. Every `async` method and every method containing `await` has a span. `uploadAsset` (L392) and `uploadAssets` (L420) are not `async` and contain no direct `await`, so the implemented rule does not flag them (exemption-scope item 6), even though both return promises over network I/O. |
| COV-005 | PASS. The registry defines no required or recommended attributes for these extension spans. The spans set `release_it.github.owner`/`repository`, `release_it.git.tag_name`, `release_it.github.draft`/`prerelease`, `release_it.github.release_id`, `release_it.git.commits_since_tag`, `release_it.changelog.length`, `release_it.is_dry_run`, and `release_it.is_ci`. On the create path, `release_id` is set after its span has ended (L376), so it is dropped at runtime. The registered `release_it.github.assets_count` is never set because asset upload has no span. |
| COV-006 | PASS. The spans wrap domain methods around Octokit calls, not the bare library call (exemption-scope item 12). No auto-instrumentation package covers Octokit at the operation level, and HTTP-level instrumentation (undici/http) would produce child spans under these domain spans. |
| RST-001 | PASS. Every spanned method is `async`, public, and reaches I/O directly or through a callee. The sync helpers `parseErrormsg`, `truncateBody`, `handleError`, `retry`, `getReleaseUrlFallback`, and the constructor are unspanned. |
| RST-002 | PASS. The `get client()` accessor (L222) has no span. |
| RST-003 | PASS. No spanned method's original body is a single delegating `return`. `release` branches across three paths, `generateWebUrl` builds a URL from awaited options, and `renderReleaseNotes` awaits `getCommits` and then maps the result. |
| RST-004 | PASS. All 13 are public methods of an exported class with no `#` or `_` prefix (exemption-scope item 4). |
| RST-005 | PASS. The original file has no tracer calls. |
| API-004 | PASS. No SDK, exporter, or instrumentation imports. |
| SCH-001 | PASS. All 13 names are declared in `agent-extensions.yaml` (L99–163), follow `release_it.github.<op>`, and contain no dynamic values. The four SCH-001 advisories in the companion file are stale, because every name is declared on the instrument branch. |
| SCH-002 | **FAIL**. All 10 keys are registered in `attributes.yaml`. The value-fit failure is at L603 in `getCommits`: `release_it.git.tag_name` is set from `latestTag`, the existing tag that the comparison starts from (`GitBase.js` L18–21). The registry brief defines the key as "The git tag name created for this release". The other five `tag_name` sites (L316, L344, L459, L485, L513) use `tagName`/`options.tag_name`, which is the new tag. One trace therefore carries the old tag and the new tag under the same key on neighboring spans (`get_commits` is nested under `render_release_notes` → `get_octokit_release_options` → `create_release`). This is the wrong-concept case of exemption-scope item 13. `commits_since_tag` (L606) matches its brief, and `changelog.length` (L636) holds the rendered release-notes length, the reading GitRelease.js L45 and GitLab.js L315 also use. |
| SCH-003 | PASS. Booleans: `is_dry_run` and `is_ci` come from `Boolean(...)` getters (`config.js` L60, L80–82). `draft` and `prerelease` come from CLI booleans (`args.js` L31–32) with `false` defaults (L280–281), and `isPreRelease` from `parseVersion` is always a boolean. Ints: `release_id` is the numeric GitHub release `id` (L376, and L515 from context set by `init` L98). `commits_since_tag` (`data.commits.length`) and `changelog.length` (`result.length`) are raw lengths with no `String()` cast, against `int` (exemption-scope item 2). Strings: `owner`, `repository`, and `tag_name` are strings or null. No non-string value reaches a string key, and no enum attribute is set. |
| SCH-004 | PASS. The agent added no attribute keys. All 10 were already registered. |
| CDQ-001 | PASS. `span.end()` is in `finally` on all 13 spans (L114, L138, L166, L206, L269, L324, L387, L474, L500, L539, L591, L613, L644). Premature ends are recorded under Unrubriced findings per exemption-scope item 1. |
| CDQ-002 | PASS. `trace.getTracer('release-it')` (L28) matches the package.json `name`. |
| CDQ-003 | PASS. Every span catch uses `recordException(error)` + `setStatus({ code: SpanStatusCode.ERROR })`, with no ad-hoc error attributes. |
| CDQ-005 | PASS. The `startActiveSpan` callback pattern manages context. The retry callbacks and `this.step` tasks are started inside the active context. |
| CDQ-006 | PASS. Every value is a variable, a property access, a `Boolean()` getter, `isPreRelease \|\| preRelease`, or `.length`. There are no method chains or serialization. |
| CDQ-007 | **FAIL**. L603 sets `release_it.git.tag_name` unconditionally from `latestTag`, and `latestTag` is nullable: `getLatestTagName` resolves to `null` when no tag matches (`GitBase.js` L116–123), as on a first release (exemption-scope item 11). `getCommits` runs whenever `github.releaseNotes.commit` is configured, and the `setAttribute` runs before `compareCommits`. `owner` and `repository` (L150–151, L253–254, L457–458, L555–556, L601–602) come from `parseGitUrl`, which returns `null` fields only when there is no remote URL (`util.js` L94), a misconfiguration where every GitHub API call fails; under item 11 that path does not count. No key matches a PII pattern (`tag_name` names a tag, not a person). No value is unbounded. `release_id` is guarded at L514. No string attribute is a command, URL, remote, or endpoint, so none can carry a credential. |
| CDQ-011 | PASS. `'release-it'` matches the canonical name. No `tracerName` is set in `spiny-orb.yaml`, and package.json `name` is `release-it`. |

**Failures**:
- SCH-002, L603: `release_it.git.tag_name` holds the previous tag (`latestTag`) in `getCommits`, while the registry brief and the other five sites use it for the tag created by this release.
- CDQ-007, L603: the same call sets `release_it.git.tag_name` from the nullable `latestTag` with no defined-value guard.

**Unrubriced findings**:
- `release`, L185: `return this.step({ task, label: ..., prompt: 'release' })` (web path) is not awaited. `release_it.github.release` ends before `createWebRelease` runs, and a rejection never reaches L201–204. No span calls run after the end.
- `release`, L189: `return this.step({ task: () => (isUpdate ? Promise.resolve() : this.commentOnResolvedItems()), ... })` (CI path) is not awaited. The span ends before `comment_on_resolved_items` completes, and a rejection skips the span's catch.
- `release`, L199: `return this.step({ task: release, label: ..., prompt: 'release' })` (interactive path, the default) is not awaited. The whole create, upload, and comment flow runs after `release_it.github.release` has ended, so on this path the span measures almost nothing. The work is still timed and error-recorded by the child spans `release_it.plugin.show_prompt` and `release_it.prompt.show`, which await the task.
- `createRelease`, L355: `return this.retry(async bail => { ... })` is not awaited. The `repos.createRelease` HTTP call, any retries, and the final failure from `handleError`/`bail` all happen after `span.end()` (L387). `span.setAttribute('release_it.github.release_id', id)` at L376 runs inside the returned promise on an already-ended span and is dropped.
- `updateRelease`, L522: `return this.retry(async bail => { ... })` is not awaited. The `repos.updateRelease` call and its failure happen after `span.end()` (L539). No span calls run inside the callback, because `release_id` is set before it at L515.
- Not counted: L576 `return Promise.resolve()` (dry-run comment loop) is an already-resolved promise with no pending work. L262 `return this.handleError(err, () => {})` is synchronous. L352, L520, L558, L260, L318, L468, L607, and L637 return plain values.

**Advisories**:
- The notes contradict the code in two places. (1) They say `release_it.github.release_id` "is placed inside the retry callback" in both `createRelease()` and `updateRelease()`, and that "the outer span variable is accessible via closure." In `updateRelease` it is set outside the callback (L514–516). In `createRelease` the closure gives access to a span that has already ended, so the attribute is dropped. (2) They call `uploadAsset()` and `uploadAssets()` "synchronous helpers, unexported internals." Both are public methods of the exported class that return promises over network I/O. The attempt-1 thinking says "uploadAsset was flagged as synchronous to skip, but it's actually async ... I need to correct that classification", and the code then leaves it unchanged.
- The attempt-1 thinking says it will "apply the same pattern of adding `draft` and `prerelease` to `updateRelease`". The code does not do this.
- The log's "0 attributes" counts new schema keys only. The code makes 33 `setAttribute` calls across 10 registered keys.
- spiny-orb's eight CDQ-007 advisories (L344–346, L457–459, L513, L636) are false positives. The message describes PII names or filesystem paths, and none of those lines has either. The validator did not flag L603, which is the one real nullable-value site.
- Asset upload has no span of its own. Per-asset latency and failures appear only on the enclosing release or prompt span, and the registered `release_it.github.assets_count` is never recorded. The async arrow passed to `this.retry` in `uploadAsset` (L398) is a nested async function, which the implemented COV-004 does not inspect.
- Nesting is deep for one operation: `create_release` → `get_octokit_release_options` → `render_release_notes` → `get_commits`, and `generate_web_url` → `get_octokit_release_options`. `is_dry_run`, `owner`, `repository`, and `tag_name` repeat on parent and child spans.
- `release_it.github.release_id`'s brief says "created" release, but on `update_release` (L515) it identifies the existing release being updated. The key is generic enough to pass.

**Run-4 comparison**: Run-4 failed this file after 2 attempts with 8 NDS-003 violations. The agent split the long `mergedPullRequests` line on its own, and the two emoji log lines came out with an encoding mismatch, so the 13 public async methods stayed uninstrumented. Run-5 committed it in 2 attempts with the same 13 spans. Attempt 1 failed only LINT, because the indented `mergedPullRequests` line exceeded the Prettier width. Attempt 2 applied Prettier's reflow, which NDS-003 accepted, and the emoji lines were left byte-identical. This is the first scored evaluation of this file, so both FAILs (SCH-002 and CDQ-007 at L603) and the five un-awaited-return findings are new evaluations, not regressions.

### 9. lib/plugin/gitlab/GitLab.js (9 spans, 2 attempts)

Spans: `release_it.gitlab.init`, `release_it.gitlab.is_authenticated`, `release_it.gitlab.is_collaborator`, `release_it.gitlab.before_release`, `release_it.gitlab.check_release_milestones`, `release_it.gitlab.release`, `release_it.gitlab.request`, `release_it.gitlab.create_release`, `release_it.gitlab.upload_asset`

Trace supplementation: unavailable (IS scoring not yet run)

| Rule | Result |
|------|--------|
| NDS-003 | PASS. The diff adds the OTel import (L1), the tracer (L15), nine `startActiveSpan` wrappers with try/catch/finally, `setAttribute` calls (L55, L85, L109, L133, L152, L217–218, L242, L311–316, L376), one attribute-only guard (L314), and `recordException`/`setStatus` lines at the top of the pre-existing rethrowing catches (L193–194, L283–284, L354–355, L399–400, L418–419). Every original statement is re-indented but otherwise unchanged and in its original order. Each method now returns the `startActiveSpan` promise, which resolves to the same value the original async method returned. |
| API-001 | PASS. The only OTel import is `import { trace, SpanStatusCode } from '@opentelemetry/api'` (L1). |
| NDS-006 | PASS. package.json has `"type": "module"`, and the added import is ESM. |
| NDS-004 | PASS. `export default GitLab` (L459) is unchanged, and all nine instrumented methods keep their names and parameters (`request(endpoint, options)` L239, `uploadAsset(filePath)` L369). The constructor, `getReleaseMilestones`, and `uploadAssets` are untouched. |
| NDS-005 | PASS. The two graceful catches in `isAuthenticated` (L92–95) and `isCollaborator` (L116–119) are unchanged and still return `false` without recording (NDS-005b PASS). The five rethrowing catches (L192, L282, L353, L398, L417) keep `this.debug(err); throw err;` verbatim, with recording added before them, so propagation is unchanged. Each new outer catch records and rethrows. |
| COV-001 | PASS. Every async public method of the exported `GitLab` class has a span. `uploadAssets` (L434) is not async, and the constructor is synchronous. |
| COV-002 | PASS. The one outbound call, `fetch(...)` (L264), runs inside `release_it.gitlab.request`, and every GitLab API call in the file goes through `this.request`. The file reads in `uploadAsset` (L385, L406) also run inside a span. |
| COV-003 | PASS. All nine spans have an outer catch with `recordException` + `setStatus(ERROR)` + rethrow, so no failable operation can throw out of a span unrecorded (exemption-scope item 8). The graceful catches in `isAuthenticated` and `isCollaborator` are correctly left unrecorded. The rejected milestone lookups are collected by `Promise.allSettled` (L185) and converted into a throw that the L192 catch records. |
| COV-004 | PASS. All nine async functions have spans. `uploadAssets` returns a `glob(...)` promise but is not async and contains no `await`, so the implemented rule does not flag it (exemption-scope item 6). |
| COV-005 | PASS. The registry defines no required attributes for these extension spans. Domain attributes are present: `release_it.is_dry_run` on seven spans, `release_it.is_ci` (L217), `release_it.gitlab.milestones_count` (L152), `release_it.gitlab.request.endpoint` (L242), `release_it.git.tag_name` and `release_it.gitlab.release.name` (L311, L313), `release_it.changelog.length` (L315), and `release_it.gitlab.asset.name` (L376). |
| COV-006 | PASS. The `release_it.gitlab.request` span wraps the whole `request()` wrapper (URL building, debug logging, response parsing), not only the global `fetch` call at L264 (exemption-scope item 12). `@opentelemetry/instrumentation-undici` would add an HTTP client span as a child. spiny-orb's implemented COV-006 pattern list has no `fetch`/undici entry. |
| RST-001 | PASS. Every spanned function is async and awaits I/O. The sync `getReleaseMilestones` (L209) and the constructor are unspanned. |
| RST-002 | PASS. No accessors exist or are spanned. |
| RST-003 | PASS. No spanned body is a single delegating `return`. `beforeRelease` (L130–144) is two awaited statements, `await super.beforeRelease()` and `await this.checkReleaseMilestones()`, so it is not a thin wrapper by the mechanism, even though both callees have their own spans. |
| RST-004 | PASS. All nine are public methods of an exported class, with no `#` or `_` prefix (exemption-scope item 4). |
| RST-005 | PASS. The original file had no tracer calls. |
| API-004 | PASS. No SDK, exporter, or instrumentation imports. |
| SCH-001 | PASS. All nine span names are declared in `agent-extensions.yaml` as `span.release_it.gitlab.*`, follow `release_it.<area>.<op>` in snake case, and contain no dynamic values. The validator's advisory about `create_release` versus `release` does not hold, because `release()` orchestrates `this.step` around both upload and create, while `createRelease()` performs the API call. |
| SCH-002 | PASS. `release_it.is_dry_run`, `release_it.is_ci`, `release_it.git.tag_name`, and `release_it.changelog.length` are registered in `attributes.yaml`, and each value matches its brief. `tag_name` here is the new tag (`tagName`), unlike GitHub.js L603. `release_it.gitlab.milestones_count`, `request.endpoint`, `release.name`, and `asset.name` are declared in `agent-extensions.yaml`, and each key names what it holds. |
| SCH-003 | **FAIL**. L152 sets `release_it.gitlab.milestones_count` to `String(releaseMilestones.length)` while `agent-extensions.yaml` declares the key `type: int`. That is a literal type mismatch, and it is also a length-derived count cast to string (exemption-scope item 2). The other attributes conform: `is_dry_run` and `is_ci` come from the `Config` getters, which always return booleans (`Boolean(...)` in `lib/config.js` L60–61 and L80–81). `tag_name` and `release.name` are strings (`format()` in `lib/util.js` L68–79 always returns a string). `changelog.length` is a raw int. `endpoint` and `asset.name` are strings. No enum attributes are set. |
| SCH-004 | PASS (evidence corrected in reconciliation, per exemption-scope item 16; verdict unchanged). The token step flags two keys. `release_it.gitlab.release.name` and `release_it.gitlab.asset.name` score 0.8 against each other, and `release.name` also scores 0.6 against `release_it.hook.name`, `release_it.package_name`, and `release_it.prompt.name`. The semantic check clears every pair: a release title, an uploaded file name, a hook event, a package name, and a prompt identifier are different concepts. `milestones_count` and `request.endpoint` cross 0.5 against no key. `release_it.gitlab.asset.name` versus `release_it.github.assets_count` (the run-4 validator's match) is a different concept in a different domain. `request.endpoint` holds a path relative to `/api/v4`, so OTel `url.path` is not an obvious duplicate. |
| CDQ-001 | PASS. `span.end()` is in `finally` on all nine spans (L77, L101, L125, L141, L204, L234, L293, L364, L429). |
| CDQ-002 | PASS. `trace.getTracer('release-it')` (L15) matches the package.json `name`. |
| CDQ-003 | PASS. Every catch uses `recordException(error)` + `setStatus({ code: SpanStatusCode.ERROR })`, with no ad-hoc error attributes. See Advisories about double recording. |
| CDQ-005 | PASS. The `startActiveSpan` callback pattern manages context. The `this.step(...)` calls in `release()` are awaited, so `createRelease` and `uploadAsset` spans nest under `release_it.gitlab.release`. |
| CDQ-006 | PASS. `String(releaseMilestones.length)` (L152) is an exempt trivial conversion of a property access. Every other value is a variable or property access. |
| CDQ-007 | PASS. No key matches a PII pattern. All values are bounded scalars. `releaseNotes` is guarded with `!= null` (L314). `tagName` is always defined at release time, because `GitBase.bump` sets it to `format(...) \|\| version` and `lib/index.js` L120–134 only runs `release` after `bump` when `version` is truthy. `endpoint` is a template literal at every call site, and `name` comes from `format()` or `path.basename()`. Per exemption-scope item 3, `release_it.gitlab.request.endpoint` is an API path and the token travels in a header (`[tokenHeader]: this.token`, L250), so the value cannot embed the credential. |
| CDQ-011 | PASS. `'release-it'` matches the canonical name. No `tracerName` is set in `spiny-orb.yaml`, and package.json `name` is `release-it`. |

**Failures**:
- SCH-003, L152: `release_it.gitlab.milestones_count` is `String(releaseMilestones.length)`, which conflicts with the agent's own `type: int` declaration.

**Unrubriced findings**: None. Every `return` inside a span callback's `try` returns a plain value or an awaited result: L57, L149, and L154 (`return;`), L86, L91, L110, L322, and L352 (`true`), L94 and L118 (`false`), L115 (a boolean expression on the awaited `access_level`), L281 (the awaited `body`), and L224 and L227 (`return await this.step(...)`). The `return this.request(...).then(...)` at L169 is inside a `.map` callback, and the resulting promises are awaited through `Promise.allSettled` at L185 before the span's `finally` runs.

**Advisories**:
- Errors are recorded twice on the same span. The agent added recording to the inner rethrowing catches (L193, L283, L354, L399, L418), and each error then reaches the outer catch (L200, L289, L360, L425), which records it again. A failed `createRelease` API call therefore produces two exception events on `release_it.gitlab.request` and two more on `release_it.gitlab.create_release`. The validator caused this: attempt 1 had outer-catch recording on every span, and COV-003 still flagged the five inner catches. Observed in one file this run, so confirm in run-6.
- `release_it.gitlab.request` is marked ERROR when the `user` or `members/all` probe fails, even though `isAuthenticated` and `isCollaborator` treat that failure as an expected `false`. The request catch rethrows, so this is not an NDS-005b case.
- The request span records no HTTP method or response status. The agent dropped `release_it.gitlab.request.method` after SCH-002 flagged it. See the Run-4 comparison.
- `release_it.gitlab.request.endpoint` embeds the project ID, user ID, version, and asset file name (L112, L379), so its cardinality grows with releases and assets.
- `release_it.is_dry_run` is set on seven of nine spans from the same getter, so every child repeats its parent's value. `release_it.changelog.length` (L315) repeats the value that `release_it.git_release.before_release` already records from the same `releaseNotes` context.
- `beforeRelease` (L130–144) is a span over two awaited calls whose callees both have spans. It passes RST-003 by the mechanism but adds a layer with only `is_dry_run`.
- The milestone count is set before the `length < 1` early return (L152–155), so runs with no milestones record `"0"`.
- `.instrumentation.md` and the log notes contradict the code in three places. They describe `release_it.gitlab.milestones_count` as "type: int", but the code emits a string. They say `uploadAssets()` was "skipped per RST-001/RST-003", but neither rule applies to it; the skip is correct only under COV-004's sync-function exclusion. They say the constructor "performs synchronous setup only", but it does a synchronous file read of the CA certificate (L34).
- The log's "4 attributes" counts new schema keys only. The code sets eight distinct keys.

**Run-4 comparison**: Run-4 never committed this file. Its attempt 1 failed COV-003 on an unrecorded inner rethrowing catch, and attempt 2 failed SCH-002 ×2 on `release_it.gitlab.asset_name`, reported as both "a semantic duplicate" and "not found in the registry". Run-5 hit the same two classes in attempt 1: COV-003 flagged five inner catches, and SCH-002 ×2 flagged `release_it.gitlab.request.method` with the same contradictory pair of messages (log, GitLab.js block, agent thinking for attempt 2). RUN4-4 therefore recurred during the run on a different key, which corrects `run-summary.md`'s provisional "not seen this run". The log has no validator message text, so whether the match was cross-domain or the legitimate OTel `http.request.method` is unconfirmed. Attempt 2 added recording to every inner rethrowing catch (which causes the double recording above) and deleted `request.method`, and the file committed. Run-5's one rubric failure, the SCH-003 string cast on `milestones_count`, is on an attribute run-4 never committed, so it is a new evaluation, not a regression.

---

## Correct Skips (10): 8 confirmed, 2 questionable

Every skipped file's log block holds only the one-line note "Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made." The log reports each one as `✅ SUCCESS — 0 spans, 0 attributes`. With no pre-instrumentation-analysis block to grep, each skip was verified from source (`git -C ~/Documents/Repositories/release-it show main:<path>`). For every file, every exported function and every async function was listed, and a skip was marked questionable if an async function doing I/O, or the orchestrator's entry point, got no span. The pre-scan was also rerun on all ten originals with spiny-orb a55bd92 (the build that ran run-5, `dist/languages/javascript/index.js` `preInstrumentationAnalysis`), and it returned `hasInstrumentableFunctions: false` for all ten, so the log reflects what the build does.

Per the rubric's evaluation scope note, coverage rules apply to instrumented files only, and a file that was never instrumented is a coverage gap for the run rather than a coverage rule failure (exemption-scope item 14). The two questionable skips below are therefore handoff findings and do not enter any rubric score.

| File | Skip Reason |
|------|------------|
| lib/args.js | Synchronous only. The one export, `parseCliArguments` (L49), is a sync wrapper around `yargs-parser`. |
| lib/cli.js | **Questionable skip.** The default export (L32, `export default async options => {...}`) is async and is the CLI's entry point: `bin/release-it.js` L3 imports it as `release`. It calls `runTasks(options)` for every real run. The pre-scan never sees the function, because `classifyFunctions` (`src/languages/javascript/ast.ts`) collects function declarations, variable-assigned functions, and class methods only, and an anonymous default-exported arrow is none of those. The sync exports `version` (L27) and `help` (L30) are correctly unspanned. If `lib/index.js` gets its span, this skip becomes correct under RST-003, since the default export is a thin wrapper over `runTasks` (exemption-scope item 7). As long as `runTasks` has no span, this function is the only remaining place for a root span. |
| lib/index.js | **Questionable skip.** `runTasks` (L9, exported by the separate statement `export default runTasks` at L159) is async and is release-it's main entry point and orchestrator. It awaits `config.init()`, plugin loading, every plugin lifecycle hook, and every hook script through `spinner.show` and `shell.exec`. The pre-scan claim "all are pure sync utilities or unexported helpers" is false for it. Reproduced on a55bd92, two pre-scan steps combine to drop it. First, `classifyVariableFunction` takes `isExported` from the `const` statement, so a function exported by a later `export default <name>` reads as unexported, and the COV-001 entry-point test (`isAsync && (isExported \|\| name === 'main')`) does not fire. Second, as a non-entry async function it falls to the COV-004 branch, where `hasDirectProcessExit` returns true because of the `process.exit(0)`/`process.exit(1)` calls at L68, L71, L107, and L110 (inside `if` branches within the `try` block). The process.exit carve-out removes it, and only an entry point overrides that carve-out. Had the export been detected, the pre-scan would have issued its minimal-wrapper directive for entry points that call `process.exit()` (`docs/rules-reference.md`, COV-001). Runs 3 and 4 labeled this file "Synchronous only — exports only" and "Pure sync orchestrator entry point". Whether the same mechanism caused those skips was not checked. |
| lib/log.js | Synchronous only. The default export is the `Logger` class, whose methods all wrap `console.*` synchronously. The async-looking arrows (L37, L46) are `filter`/`map` callbacks. |
| lib/plugin/github/util.js | Synchronous exports. `getSearchQueries`, `getCommitsFromChangelog`, and `getResolvedIssuesFromChangelog` are pure string and array transforms. `searchQueries` (L20) is a sync function that returns an array of promises from nested async arrows calling `client.search.issuesAndPullRequests`. Under the implemented COV-004 rule, sync functions and nested callbacks are not flagged (exemption-scope item 6, rule-fit item 9). The I/O is still traced: its only caller, `GitHub.js` `commentOnResolvedItems`, awaits `Promise.all(searchQueries(...))` (instrumented L561) inside the `release_it.github.comment_on_resolved_items` span. |
| lib/plugin/npm/prompts.js | Constant object export. The `message` properties are sync arrows that build prompt strings. |
| lib/plugin/git/prompts.js | Constant object export. The `message` properties are sync arrows that build prompt strings with `format`. |
| lib/plugin/github/prompts.js | Constant object export. The unexported `message` (L3) is a sync string builder. |
| lib/plugin/gitlab/prompts.js | Constant object export. The one `message` property is a sync string builder. |
| lib/spinner.js | Synchronous only. `Spinner.show` (L11) is not async and has no `await`. It starts the caller's `task()` and returns the promise, so the I/O is in the task (`shell.exec`, which `lib/shell.js` would span; shell.js failed this run). Passes the implemented COV-004 rule (exemption-scope item 6). |

**Questionable skips**: `lib/index.js` and `lib/cli.js`, both from pre-scan false negatives, not from an agent declining a span it had flagged. The effect on the run is that neither the orchestrator nor the CLI entry point has a span, so the committed spans have no common root. In a CLI run, `release_it.config.*` from `config.init()` and each plugin lifecycle span that the orchestrator awaits would start without a parent, so one release would likely show up as several separate traces. That is inferred from source and not yet confirmed in traces. IS scoring should check it.

---

## Failed Files (4)

`lib/plugin/GitBase.js` (LINT), `lib/plugin/git/Git.js` (LINT, a regression), `lib/plugin/npm/npm.js` (NDS-003 ×4), and `lib/shell.js` (SCH-002, a regression) never committed, so they are not scored here. Per the rubric's evaluation scope note, they are assessed in failure analysis. Root causes, attempt histories, and the un-awaited-return and sensitive-command-string findings from their debug dumps are in `failure-deep-dives.md`.

---

## Cross-File Reconciliation

Completed 2026-10-08 by the coordinating session, after both per-file batches and correct-skip verification. Static-only; trace reconciliation is applied during IS scoring, once `trace-artifact.md` exists.

### Rule-ID label audit

Every row in all nine sections (252 rows: 28 rules × 9 files) was checked against its rule's mechanism in `docs/research/evaluation-rubric.md` (spiny-orb a55bd92). Each row's rule ID matches the rule its evidence argues. Three kinds of correction came out of the audit, and none of them turns a PASS into a FAIL or a FAIL into a PASS:

1. **COV-002 and COV-006 used PASS and N/A inconsistently for the same situation.** Version.js, util.js, factory.js, and prompt.js scored "no outbound call site" and "no auto-instrumentation library covers this" as N/A, while config.js, Plugin.js, and GitRelease.js scored the same situations as PASS. All five PASS rows are now N/A, following taze run-17's convention (exemption-scope item 15). After the change, COV-002 is PASS in GitHub.js and GitLab.js (Octokit and `fetch` call sites, all inside spans) and N/A in the other seven files. COV-006 has the same split.
2. **Three SCH-004 rows misstated the token-similarity step.** Every agent-added key was rerun through the rubric's delimiter-split Jaccard test against every key in `attributes.yaml` and `agent-extensions.yaml`. factory.js and GitLab.js said no key crossed 0.5, but four keys do. prompt.js discussed only `release_it.prompt.namespace`, but its other three keys cross 0.5 too. In every added case the semantic check clears the pair, so the verdicts stand (prompt.js FAIL, factory.js and GitLab.js PASS). The rows now record the scores (exemption-scope item 16).
3. **The CDQ-011 rows cite package.json `name` as the canonical source.** The rubric takes the canonical name from `tracerName` or from the registry manifest's `name` normalized to hyphens (`release_it` → `release-it`). Both sources give `release-it`, so the nine PASS verdicts stand. The per-run note under "Per-Run Rules" now names the correct source.

### Cross-file patterns

Each pattern is recorded once here. The verdicts in the file sections agree with each other on every one.

| Pattern | Files and rows | Reconciled reading |
|---------|----------------|--------------------|
| `release_it.is_ci` value source | config.js sets it from `options.ci`. Version.js, GitHub.js, and GitLab.js set it from the `Config.isCI` getter, which is also true for `--release-version` and `--changelog`. | Consistent: SCH-002 PASS in all four. The registry brief is "Whether the release ran in CI mode (non-interactive)", which covers both readings, so this is the generic-key case of exemption-scope item 13. The two sources still disagree on those two flags, and that goes to the handoff as an advisory. |
| `release_it.plugin.namespace` and `release_it.prompt.namespace` | Plugin.js L69 and prompt.js L21 record the same `this.namespace` on adjacent spans. factory.js L30 records the raw module specifier under `plugin.namespace`. | Consistent: SCH-004 FAIL in prompt.js only, because only that agent added a duplicate key. SCH-002 FAIL in factory.js, because there the key holds a different concept (item 13). Plugin.js holds the brief's concept and passes. |
| `release_it.version.increment` reachable `false` | config.js L124, Version.js L84 | Consistent: SCH-003 FAIL in both (item 5). |
| Count attributes | `String(len)` casts: factory.js `enabled_count`/`external_count`, util.js `collection_size`, GitLab.js `milestones_count`. Raw ints: `changelog.length` in GitRelease.js, GitHub.js, and GitLab.js, and `commits_since_tag` in GitHub.js. | Consistent: SCH-003 FAIL on every cast, including util.js where the schema was retyped to `string` (item 2). PASS on every raw int. CDQ-006 PASS on every `String(x.length)` as a trivial conversion. |
| `release_it.git.tag_name` | GitHub.js L603 holds the previous tag (`latestTag`). GitHub.js's five other sites and GitLab.js L311 hold the new tag. | Consistent: SCH-002 FAIL and CDQ-007 FAIL at GitHub.js L603 only. GitLab.js passes both. |
| `release_it.prompt.name` guard | Plugin.js L70 guards it with `!= null`. prompt.js L22 does not. | Consistent: CDQ-007 FAIL in prompt.js only (item 11). |
| `release_it.changelog.length` meaning | GitRelease.js L45, GitHub.js L636, and GitLab.js L315 all record the length of the final release notes, which is the changelog unless a `releaseNotes` script replaces it. | Consistent: SCH-002 PASS in all three. The brief ("Character length of the generated changelog text") is generic enough to cover release notes produced by a script. |
| Un-awaited returns | GitRelease.js (2 sites), GitHub.js (5 sites) | Consistent: CDQ-001 PASS and COV-003 PASS, and every site is listed under Unrubriced findings (items 1 and 9). No other committed file has the pattern. |
| Sync functions returning I/O promises | Plugin.js `exec`/`step`, Version.js `promptIncrementVersion`, util.js fs helpers, GitHub.js `uploadAsset`/`uploadAssets`, GitLab.js `uploadAssets` | Consistent: COV-004 PASS everywhere under the implemented rule (item 6). GitHub.js asset upload is the one case where the missing span loses a registered attribute (`assets_count`). |

### Finding that corrects an earlier rationale

Plugin.js L73–74 shipped the fix for the un-awaited-return pattern, and NDS-003 accepted it. The original `return this.prompt.show(options)` became `const result = await this.prompt.show(options); return result;`. spiny-orb's `reconcileReturnCaptures` (`src/languages/javascript/rules/nds003.ts`) removes a leading `await` before it matches a capture against the original return, so this form passes. Only the in-place `return await <expr>` edit fails, which is what npm.js tried (`failure-deep-dives.md`).

Exemption-scope item 1, rule-fit item 1, and the 2026-10-07 Decision Log row all say "NDS-003 rejects the `await` that would fix it". That is true only of the in-place form. The single-line sites in GitRelease.js (L66, L71) could take the capture form with no rule change. The multi-line `return this.retry(async bail => {...})` and `return this.step({...})` sites in GitHub.js match on their first line under the same regexes, but that case was not tested. The handoff gap therefore narrows: the agent did not use the accepted capture form to fix span timing. NDS-003 does not block that fix. The scoring decision in item 1 is unchanged. Rule-fit item 1 now carries the narrowed wording.

### Validator-driven outcomes (handoff)

Four files ended worse because of how they responded to validator output, each observed once this run:
- factory.js lost `load`'s error recording (COV-003 FAIL) after NDS-005 and NDS-007 flagged the outer recording catch.
- GitLab.js records each error twice after COV-003 flagged inner catches that the outer catch already covered (rule-fit item 10).
- config.js switched from `Boolean()` to `!!` to avoid the CDQ-006 pattern match.
- util.js retyped `collection_size` to `string` to match its own cast (SCH-003 FAIL).

### Notes-versus-code divergence

Eight of nine companion `.instrumentation.md` files or agent notes contradict the committed code: Plugin.js, factory.js, Version.js, util.js, prompt.js, GitRelease.js, GitHub.js, and GitLab.js. In config.js, the agent's attribute brief never reached the registry. The most common forms are attribute types the code does not emit (`int` in the notes for values the code casts to strings), skip reasons that cite the wrong rule, and the log's attribute count, which counts only new schema keys. This goes to the handoff as one pattern.

### Fix-verification confirmation (supersedes `run-summary.md`'s provisional table)

- **RUN4-1 (LINT/NDS-003 indentation conflict)**: CONFIRMED PARTLY RESOLVED. prompt.js, GitRelease.js, and GitHub.js committed with token-identical Prettier reflows that NDS-003 accepted (item 10). GitBase.js, Git.js, and npm.js still fail (`failure-deep-dives.md`).
- **RUN4-2 (PR body E2BIG)**: out of per-file scope. PR artifact evaluation verifies it.
- **RUN4-3 (COV-003 `Promise.reject`)**: the verdict is taken from `failure-deep-dives.md` (fix fired, shell.js did not commit). No committed file exercises it.
- **RUN4-4 (GitLab.js SCH-002 duplicate)**: CONFIRMED RECURRED during the run. It did not block the commit, because the agent deleted `release_it.gitlab.request.method` (GitLab.js Run-4 comparison).

### Verdict changes in this pass

| File | Rule | Before | After | Basis |
|------|------|--------|-------|-------|
| lib/config.js | COV-002 | PASS | N/A | item 15 |
| lib/config.js | COV-006 | PASS | N/A | item 15 |
| lib/plugin/Plugin.js | COV-002 | PASS | N/A | item 15 |
| lib/plugin/GitRelease.js | COV-002 | PASS | N/A | item 15 |
| lib/plugin/GitRelease.js | COV-006 | PASS | N/A | item 15 |

No FAIL was added or removed. The failure count across the nine files is unchanged at 14 rule failures. Evidence was corrected without a verdict change in three SCH-004 rows (factory.js, prompt.js, GitLab.js) and in the CDQ-011 per-run note.
