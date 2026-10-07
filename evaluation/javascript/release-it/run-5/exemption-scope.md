# Exemption-Scope Pre-Commitment — release-it Run-5

Decided with Whitney on 2026-10-07, before spawning the first per-file-evaluation batch, per the PRD #100 "Per-file evaluation" milestone's exemption-scope pre-commitment requirement. Every per-file subagent receives this file's text in its prompt and applies these interpretations to every section. A decision made here and not propagated to agents doesn't count.

Rubric source: `docs/research/evaluation-rubric.md` in the spiny-orb repo (`~/Documents/Repositories/spinybacked-orbweaver-main`).

## 1. Un-awaited returns inside a span's `try`/`finally`: unrubriced finding, CDQ-001 stays PASS

**Ambiguity**: CDQ-001's mechanism is "every span has a corresponding `span.end()` in a `finally` block". A `return <promise>` with no `await`, inside `try { ... } finally { span.end(); }`, satisfies that literally, but the span ends before the returned promise settles. A rejection from that promise never reaches the span's `catch`, and any `setAttribute` that runs inside the promise's callback runs on an already-ended span and is dropped.

Confirmed in committed files before evaluation started: `lib/plugin/GitRelease.js` `processReleaseNotes` (`return script(ctx)` and `return this.exec(script)`), and `lib/plugin/github/GitHub.js` `createRelease` (`return this.retry(async bail => { ... })`, whose callback also sets `release_it.github.release_id` after the span has ended). Other sites may exist.

**Decision**: CDQ-001 scores PASS when `span.end()` is in `finally`, regardless of whether the returned value is an un-awaited promise. Each un-awaited-return site is recorded as an **unrubriced finding**, listed in the file's section under a `**Unrubriced findings**` line and later carried into `rubric-scores.md`'s "Unrubriced Findings" section.

**Rationale**: the template's standing "Unrubriced Findings" category exists for real failures with no matching rule. Keeping CDQ-001 literal keeps it comparable with runs 1-4, which likely contained the same pattern unscored. The fix work is carried by the handoff (`actionable-fix-output.md`) as two gaps: no validator rule detects a span ending before its returned promise settles, and NDS-003 rejects adding `await` to an original `return`, so the agent cannot fix the timing even when it notices it.

**Test for per-file agents to apply**: for every `return <expr>` inside a span callback's `try` block, determine whether `<expr>` can be a promise (an async method call, `this.exec(...)`, `this.retry(...)`, `this.step(...)`, `.then(...)` chains, a variable holding an un-awaited call, or a call to a user-supplied function) and is not preceded by `await`. If so, record it as an unrubriced finding with function name, instrumented-file line, the returned expression, and any span calls (`setAttribute`, `recordException`, `setStatus`) that execute inside the returned promise and therefore after `span.end()`. Returns of plain values, `await`ed expressions, and returns inside nested callbacks that are themselves awaited before the span's `finally` runs are not findings. Do not change the CDQ-001 verdict because of these sites.

## 2. SCH-003: length-derived counts cast to string FAIL regardless of declared schema type

**Ambiguity**: SCH-003's literal mechanism checks code values against the registry's declared type. Two cases occur:

- `lib/plugin/factory.js` `release_it.plugin.enabled_count` and `release_it.plugin.external_count` (`String(<array>.length)`), and `lib/plugin/gitlab/GitLab.js` `release_it.gitlab.milestones_count` (`String(releaseMilestones.length)`): the schema (`semconv/agent-extensions.yaml`) declares `type: int`. Literal mismatch, clear FAIL. Not ambiguous.
- `lib/util.js` `release_it.util.collection_size` (`String(collection.length)`): the agent declared the attribute `type: string`. Code and schema agree.

**Decision**: the second case is an SCH-003 FAIL (semantic reading), matching taze run-17's pre-commitment (`evaluation/typescript/taze/run-17/exemption-scope.md`).

**Rationale**: a count from `.length` is an int regardless of how the schema declares it. Passing it would make "retype the schema to match the cast" a valid way to dodge the finding, and it would contradict the verdict already given for the identical pattern in taze.

**Test for per-file agents to apply**: any attribute set via `String(<expr>.length)`, `String(<expr>.size)`, `String(<count>)`, or an equivalent count- or length-derived expression is an SCH-003 FAIL, including when the schema declares that attribute `type: string`. A raw numeric value (`releaseNotes.length`, `data.commits.length` with no cast) against an `int` schema is a PASS.

## 3. CDQ-007: values that may carry credentials score PASS with an advisory note

**Ambiguity**: CDQ-007's mechanism flags PII-pattern key names (`email`, `password`, `ssn`, `phone`, `creditCard`, `address`, `*_name` for person names), unbounded values (object spreads, `JSON.stringify` of request/response objects, unbounded arrays), and unconditional `setAttribute` from optional, nullable, or unvalidated input. It does not inspect what a string value might contain. `lib/plugin/GitRelease.js` sets `release_it.hook.command` to a full user-configured hook command string, which can carry tokens. That attribute is declared in the project's own `semconv/attributes.yaml`, not invented by the agent.

**Decision**: CDQ-007 scores on its literal mechanism. A free-form command string or URL attribute whose key does not match a PII pattern, whose value is bounded, and whose value is guarded against undefined scores **PASS**, with an advisory note in the row naming the credential-exposure risk (for example: "PASS — advisory: full hook command string may contain credentials; no rule inspects value content"). It is not listed as an unrubriced finding.

**Rationale**: follows the rule as written, respects an attribute the registry designer chose, and keeps CDQ-007 comparable across runs. The handoff carries the risk as a validator gap alongside the shell.js `release_it.shell.command` case from `failure-deep-dives.md`.

**Test for per-file agents to apply**: for each string attribute whose value is a command line, URL, remote, endpoint, or registry address, decide whether the value can embed a credential at runtime. If it can, add the advisory note to the CDQ-007 row. If it cannot (for example an API path where the token travels in a header), say so briefly. In both cases the verdict is decided by the literal mechanism only. The nullable-input check still applies normally and can independently make the row FAIL.

## 4. RST-004: public methods of exported classes count as exported; library-mediated I/O qualifies for the I/O exemption

**Ambiguity**: RST-004 flags spans on unexported functions and private class methods, with an exemption for unexported functions doing I/O. The exemption lists `child_process`/`exec`/`spawn`, `fetch`/HTTP client calls, database client calls, and `fs.*` async methods.

- Every instrumented method in GitHub.js, GitLab.js, GitRelease.js, Plugin.js, Version.js, and prompt.js is a method of an exported class, with no `#private` or `_` prefix.
- `lib/config.js` `loadOptions` and `loadLocalConfig` are unexported module functions that read the config file through the c12 library. Run-4 scored them PASS under the I/O exemption.
- `lib/plugin/factory.js` `load` is an unexported function that loads a plugin via dynamic `import()`.

**Decision**: methods of an exported class without a `#` or `_` prefix are exported (public API) and PASS RST-004. Unexported functions whose I/O happens through a library (config-file reads via c12, module loads via dynamic `import()`, subprocess or HTTP calls via a wrapper such as `this.exec` or an Octokit/`got` client) qualify for the I/O exemption and PASS.

**Rationale**: matches run-4's `config.js` verdict, so a change in RST-004 between runs reflects agent behavior rather than a scoring change. The exemption exists because I/O boundaries are worth observing, and these are I/O boundaries whether the call is direct or wrapped.

**Test for per-file agents to apply**: RST-004 FAILs only for a span on (a) a `#private` or `_`-prefixed method, or (b) an unexported function that performs no I/O directly or through a library. Whether a public method is helper-like (thin, trivial, or utility-shaped) is judged under RST-001, RST-002, and RST-003, not RST-004.

---

## Decisions added after batch 1

Batch 1 (config.js, Plugin.js, factory.js, Version.js, util.js) surfaced four more readings the sections above did not cover. Items 5 and 6 were decided with Whitney. Whitney then delegated the rest to the coordinating session's judgment on 2026-10-07, on the condition that no rule or clause is ignored: wherever a rule does not fit, the misfit is recorded under "Rule-fit issues for the handoff" below. All four apply to every section in both batches. Batch-1 sections are reconciled to them before they are written to `per-file-evaluation.md`.

## 5. SCH-003 on enum attributes: FAIL when a non-string value can reach the attribute; out-of-enum strings PASS

`release_it.version.increment` is a string enum. config.js L124 and Version.js L84 guard it only with `!= null`, which lets `false` through (the documented `--no-increment`; `lib/index.js` passes `options.version.increment` straight into `getIncrementedVersion`), and also explicit version strings such as `"2.0.0"`.

**Decision**: FAIL on the reachable boolean, because that is a type violation. A string outside the listed members PASSES, because OTel semantic-convention enums are open. Both files score FAIL.

**Test**: for an enum or string attribute, trace whether a non-string value (boolean, number, object) can reach the `setAttribute` call through a documented or reachable path. If one can, FAIL. Do not fail an attribute only because a string value is outside the enum members.

## 6. COV-004: scored by the implemented rule (async functions and functions containing `await`); sync I/O helpers are not flagged

The research rubric's COV-004 mechanism also lists "calls to known I/O libraries (fs, net, stream…)". spiny-orb's implemented rule (`src/languages/javascript/rules/cov004.ts`, `docs/rules-reference.md`) states that "pure sync functions are not flagged — even if they call I/O-looking patterns". Run-4 matched the implemented rule.

**Decision**: a synchronous function with no `await` PASSES COV-004 even when it calls `fs.*Sync` or similar. util.js's `readJSON`, `hasAccess`, and `touch` do not fail.

**Test**: COV-004 FAILs only for an `async` function, or a function containing `await`, that has no span and is not exempt (RST-001 utility, or a direct top-level `process.exit()`).

## 7. RST-003: cross-file thin wrappers FAIL when the callee already has its own span

spiny-orb's implemented RST-003 is narrowed to same-file delegations. `rules-reference.md` describes cross-file delegation as "a known accepted gap (the per-file rule cannot see other files)". That is a limit on what the validator can see, not a statement that cross-file wrappers are acceptable, and this evaluation can see across files. Unlike item 6, this narrowing is not a design decision, so the rubric mechanism applies as written.

**Decision**: a span on a function whose meaningful body is a single delegating `return` (argument transformation allowed) FAILs RST-003 when the delegated function, in any file, has its own span. Plugin.js `showPrompt` → `prompt.show` (`release_it.prompt.show`) is a FAIL.

**Comparability note**: run-4's per-file tables had 21 rows and no RST-003 row. A run-5 RST-003 FAIL on a span that is unchanged since run-4 is a new evaluation, not a regression. Say so in that file's Run-4 comparison line.

## 8. COV-003: a span whose wrapped operation can throw out of it with no error recording FAILs, even when the inner catches are graceful

factory.js `load` wraps a three-stage dynamic-import fallback in try/finally with no catch. The inner graceful catches are correctly left unrecorded (NDS-005b and the implemented `isExpectedConditionCatch` exemption), but the final fallback import can throw out of the span without error status.

**Decision**: COV-003 FAIL. The expected-condition exemption covers the graceful inner catches. It does not cover an error that escapes the span unrecorded.

**Test**: for each span, ask whether any failable operation inside it can throw out of the span callback. If one can and the span has no `recordException` and `setStatus(ERROR)` on that path, FAIL. Do not add a FAIL for inner catches that degrade gracefully without rethrowing.

---

## Decisions added after batch 2

Batch 2 (prompt.js, GitRelease.js, GitHub.js, GitLab.js) surfaced five more readings. The coordinating session decided them under Whitney's 2026-10-07 delegation. None reverses an earlier run's or another target's precedent. Each misfit is added to the list below.

## 9. COV-003 at un-awaited-return sites: PASS, item 1 governs

GitRelease.js `processReleaseNotes` and GitHub.js `release`, `createRelease`, and `updateRelease` return un-awaited promises whose rejections settle after `span.end()` and never reach the span's catch.

**Decision**: COV-003 PASSES when the span has a recording catch, even though these late rejections go unrecorded. The span callback does not throw on these paths. It returns a promise normally, so item 8's test ("can throw out of the span callback") does not apply. The missed rejection belongs to the item-1 unrubriced finding for that site, which names it.

**Rationale**: scoring the same defect under COV-003 and as an unrubriced finding would count it twice and break item 1's single home for the pattern.

## 10. NDS-003: a token-identical reflow of an original statement counts as re-indentation

prompt.js L39–41, GitRelease.js L39–42, and GitHub.js L562–564 split one original line into several with identical tokens, because the span wrapper's indentation pushed the line past the project's 120-character Prettier width.

**Decision**: PASS. A change to whitespace or line breaks only, with the same tokens in the same order, is equivalent to the re-indentation the rubric already allows.

**Rationale**: failing it would make these files unfixable under LINT and NDS-003 together, which is the run-4 conflict this run set out to resolve.

## 11. CDQ-007: "optional or nullable input" is judged by the value's source, not by in-tree call sites

prompt.js `promptName` is an optional destructured parameter with no default. GitHub.js `latestTag` is `null` on a first release.

**Decision**: a value is optional or nullable when its source allows `undefined` or `null` on a reachable path where the operation still proceeds: an optional parameter of a public method with no default, or a getter or context value that returns `null` in a normal run. Both cases FAIL when unguarded. A value that is null only on a misconfiguration path where the operation cannot succeed (GitHub.js `owner`/`repository` from `parseGitUrl` with no remote) does not count.

**Rationale**: public methods are reachable by external plugins, so the in-tree callers are not the full set. Plugin.js guarding the same `prompt` value shows the guard is expected.

## 12. COV-006: a span on a domain method that calls an auto-instrumented library PASSES

GitLab.js `request` wraps global `fetch` (covered by `@opentelemetry/instrumentation-undici`), and GitHub.js methods wrap Octokit, which uses `fetch`.

**Decision**: PASS when the span covers the domain method's own work (URL building, parsing, retries, branching). FAIL only for a span whose body is the bare library call.

**Rationale**: auto-instrumentation produces an HTTP child span under the domain span, so the two do not duplicate each other.

## 13. SCH-002: a registered key holding a different concept than its brief FAILs

factory.js `release_it.plugin.namespace` set this precedent in batch 1. Batch 2 has two more cases: GitRelease.js `release_it.hook.command` holds the release-notes generator command, not a lifecycle hook command, and GitHub.js L603 `release_it.git.tag_name` holds the previous tag, while the brief says the tag created for this release.

**Decision**: FAIL. A key that names one concept and holds a different one mixes two things in every query on that key. A generic key whose brief covers the value (for example `release_it.github.release_id` on update) PASSES.

---

## Rule-fit issues for the handoff

These go into `actionable-fix-output.md` (the spiny-orb handoff) and `lessons-for-run6.md`. They are places where a rule, or the documents describing it, does not fit what this run found.

1. **CDQ-001 cannot see premature closes** (item 1). A span that ends before its returned promise settles passes the rule's literal finally-block mechanism. There is no validator rule for it, and NDS-003 rejects the `await` that would fix it.
2. **CDQ-007 does not inspect value content** (item 3). Command strings and URLs that can carry credentials pass. Deep-dives found the same gap in the validator (shell.js, Git.js, GitBase.js, npm.js).
3. **The research rubric's COV-004 mechanism has drifted from the implemented rule** (item 6). `docs/research/evaluation-rubric.md` still lists I/O-library calls, while `cov004.ts` and `rules-reference.md` exclude sync functions. Proposed rubric wording: "async functions and functions containing `await`; synchronous functions are not flagged even when they call I/O APIs".
4. **RST-003's same-file narrowing leaves cross-file duplicate spans undetected by the validator** (item 7). Plugin.js `showPrompt` → `prompt.show` is the concrete case.
5. **SCH-003's mechanism does not say whether enums are open or closed, or how to treat reachable non-string values** (item 5).
6. **The research rubric lists CDQ-011, while run-4's per-run table used CDQ-008, which the rubric says was deleted.** Run-5 reports CDQ-011 per file and does not report CDQ-008.
7. **COV-003 cannot see rejections that settle after a premature close** (item 9). Its mechanism checks for a recording catch, which these spans have. This is the same gap as issue 1, seen from COV-003.
8. **NDS-003's mechanism does not say whether a token-identical reflow counts as unchanged** (item 10). Run-4's validator rejected the same reflows that run-5's accepted; observed across runs, not yet explained.
9. **COV-004 does not say how to treat nested async callbacks** (GitHub.js `uploadAsset`, the async arrow passed to `this.retry`). The implemented rule skips nested functions.
10. **No rule covers duplicate exception events on one span.** GitLab.js records each error in an inner rethrowing catch and again in the outer catch, because COV-003 flagged the inner catches even when the outer catch already records. CDQ-003 checks only the recording pattern.
11. **SCH-002's mechanism is about key names, and value-concept mismatches are scored through it** (item 13). The rubric does not state that a registered key can fail on what it holds.
