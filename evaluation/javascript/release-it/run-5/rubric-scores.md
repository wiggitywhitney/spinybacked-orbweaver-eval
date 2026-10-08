# Rubric Scores — release-it Run 5

**Date**: 2026-10-08
**Branch**: spiny-orb/instrument-1790686416741
**PR**: https://github.com/wiggitywhitney/release-it/pull/4

Verdicts come from `per-file-evaluation.md` as reconciled in its "Cross-File Reconciliation" section, with the readings in `exemption-scope.md`. Trace reconciliation changed no verdict. Each rule gets one run-level result, and it fails when any committed file fails it, as in run-4. The Files column gives the per-file count behind that result.

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — `node --check` exits 0 on all 9 committed files |
| NDS-002 (Tests) | Per-run | **PASS** — 264 tests: 230 pass (87.1%), 32 fail (12.1%), 2 skipped (0.8%). `main` gives identical totals with the same 32 failing tests (pre-existing `git tag` errors in temp directories), so instrumentation introduced no failures |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — 9/9 committed files. Token-identical Prettier reflows in prompt.js, GitRelease.js, and GitHub.js count as re-indentation (exemption-scope item 10) |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — 9/9 committed files |
| NDS-006 (Module system) | Per-file | **PASS** — 9/9 committed files, ESM imports in an ESM package |

**Gates**: 5/5 PASS

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 9/9 — no exported signature changed |
| NDS-005 (Error handling preserved) | **PASS** | 9/9 — pre-existing catches kept verbatim (GitHub.js keeps all seven). No recording added to graceful catches |

### Coverage (COV): 5/6 (83%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | 9/9 — the async entry point of each committed file has a span. The two unspanned entry points (`lib/index.js` `runTasks`, `lib/cli.js` default export) are in skipped files and score nowhere (exemption-scope item 14) |
| COV-002 (Outbound calls have spans) | **PASS** | 2/2 applicable — GitHub.js (Octokit) and GitLab.js (`fetch`). N/A in the other 7 files, which have no outbound call site of their own (item 15) |
| COV-003 (Failable ops have error visibility) | **FAIL** | 8/9 — factory.js `load` (L29–52) has no error recording, so a failure of the final fallback import leaves `release_it.plugin.load` without error status (item 8) |
| COV-004 (Async ops have spans) | **PASS** | 9/9 — every async function, and every function containing `await`, has a span or is exempt. Sync functions that return I/O promises are not flagged under the implemented rule (item 6) |
| COV-005 (Domain attributes present) | **PASS** | 9/9 — each file sets at least one `release_it.*` domain attribute |
| COV-006 (Auto-instrumentation preferred) | **PASS** | 2/2 applicable — GitHub.js and GitLab.js spans cover domain work around the HTTP call, so the auto-instrumented HTTP span nests under them (item 12). N/A in the other 7 files |

### Restraint (RST): 4/5 (80%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 9/9 — sync helpers left unspanned throughout |
| RST-002 (No trivial accessor spans) | **PASS** | 9/9 — no getter or setter has a span |
| RST-003 (No duplicate spans on thin wrappers) | **FAIL** | 8/9 — Plugin.js `showPrompt` (L67) is a one-line delegation to `prompt.show`, which already emits `release_it.prompt.show`, so each prompt produces two nested spans for one operation. Cross-file case, which the validator cannot see (item 7) |
| RST-004 (No internal detail spans) | **PASS** | 9/9 — spans sit on public methods of exported classes or on unexported functions that do I/O through a library (item 4) |
| RST-005 (No re-instrumentation) | **PASS** | 9/9 — no original file had tracer calls |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in `peerDependencies` (`>=1.0.0`) and `devDependencies`, absent from `dependencies` |
| API-003 (No vendor SDKs) | **PASS** | No vendor-specific instrumentation packages in any dependency section |
| API-004 (No SDK imports) | **PASS** | 9/9 — only `@opentelemetry/api` imported |

### Schema Fidelity (SCH): 1/4 (25%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 33 span names, all declared in `agent-extensions.yaml` and following `release_it.<area>.<op>`. The 6 SCH-001 advisories in companion files are false positives (`pr-evaluation.md`, "Advisory Findings Quality") |
| SCH-002 (Attribute keys match registry) | **FAIL** | 6/9 — a registered key holds a different concept than its brief (item 13): factory.js L30 `release_it.plugin.namespace` holds the module specifier; GitRelease.js L70 `release_it.hook.command` holds the release-notes generator command; GitHub.js L603 `release_it.git.tag_name` holds the previous tag. The GitHub.js failure is confirmed at runtime: `get_commits` carries `20.0.0` while its ancestors carry `20.0.1` in one trace |
| SCH-003 (Attribute types correct) | **FAIL** | 3/9 — six files fail. Counts cast to string: factory.js L100–101 and GitLab.js L152 (against `int` declarations), util.js L109 (schema retyped to `string`, item 2). Reachable boolean `false` on the string enum `release_it.version.increment`: config.js L124 and Version.js L84 (item 5). Boolean against a `string` declaration: prompt.js L23. factory.js and util.js are confirmed at runtime (`stringValue` counts in `eval-traces-run5.json`) |
| SCH-004 (No redundant entries) | **FAIL** | 8/9 — prompt.js L21 `release_it.prompt.namespace` duplicates the registered `release_it.plugin.namespace`, by token similarity and by value (Plugin.js feeds the same `this.namespace` into both). Other candidate pairs that cross the 0.5 Jaccard threshold clear the semantic check (item 16) |

### Code Quality (CDQ): 6/7 (86%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | 9/9 — `span.end()` in `finally` on every span. The 7 un-awaited-return sites where a span ends before its returned promise settles are listed under "Unrubriced Findings" (item 1) |
| CDQ-002 (Tracer acquired correctly) | **PASS** | 9/9 — `trace.getTracer('release-it')` |
| CDQ-003 (Standard error recording) | **PASS** | 9/9 — `recordException` + `setStatus(ERROR)`, no ad-hoc error attributes |
| CDQ-005 (Async context) | **PASS** | 9/9 — `startActiveSpan` with async callbacks |
| CDQ-006 (Expensive guards) | **PASS** | 9/9 — `Boolean()`, `!!`, and `String(x.length)` are exempt trivial conversions |
| CDQ-007 (No unbounded/PII) | **FAIL** | 7/9 — unguarded attributes from nullable sources (item 11): prompt.js L22 `release_it.prompt.name` from an optional parameter with no default; GitHub.js L603 `release_it.git.tag_name` from `latestTag`, which is `null` on a first release. spiny-orb flagged neither site. All 12 of its CDQ-007 advisories in the PR body are false positives (`pr-evaluation.md`). Advisory on the passing GitRelease.js `release_it.hook.command`: the full command string can carry credentials, and no rule inspects value content (item 3) |
| CDQ-011 (Canonical tracer name) | **PASS** | 9/9 — `release-it`, from the registry manifest `name: release_it` normalized to hyphens. No `tracerName` is set |

---

## Overall Score

### Run-5 rule set

| Dimension | Score |
|-----------|-------|
| NDS | 2/2 (100%) |
| COV | 5/6 (83%) |
| RST | 4/5 (80%) |
| API | 3/3 (100%) |
| SCH | 1/4 (25%) |
| CDQ | 6/7 (86%) |
| **Total** | **21/27 (78%)** |
| **Gates** | **5/5 (100%)** |

### Shared rules (like-for-like with run-4)

Run-4 scored 25 rules. Run-5 scores 27. The 24 rules both runs score exclude run-4's CDQ-008 and run-5's COV-002, RST-002, and CDQ-011.

| Dimension | Run-5 | Run-4 | Delta |
|-----------|-------|-------|-------|
| NDS | 2/2 (100%) | 2/2 (100%) | — |
| COV | 4/5 (80%) | 4/5 (80%) | — |
| RST | 3/4 (75%) | 4/4 (100%) | **-25pp** |
| API | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 1/4 (25%) | 4/4 (100%) | **-75pp** |
| CDQ | 5/6 (83%) | 6/6 (100%) | **-17pp** |
| **Total** | **18/24 (75%)** | **23/24 (96%)** | **-21pp** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | — |

Run-4's 24/25 drops to 23/24 on the shared set because its CDQ-008 PASS is excluded. Its one failure, COV-003 in shell.js, is a shared rule.

**Most of the drop is not a regression.** Of the 14 per-file failures behind the 6 failing rules, 7 are in files committed for the first time (prompt.js 3, GitRelease.js 1, GitHub.js 2, GitLab.js 1). One is the first evaluation of a value source that run-4 did not record: factory.js SCH-002 on `plugin.namespace`. Three are stricter evaluation of code unchanged since run-4: config.js and Version.js SCH-003 (run-4 did not trace the `false` path of `increment`) and Plugin.js RST-003 (run-4 read RST-003 as "no pre-existing spans to duplicate" and did not check thin wrappers). Two come from changed code, both after validator feedback: factory.js COV-003 (the outer recording catch was removed) and util.js SCH-003 (the count is now cast to string and the schema retyped). Whether factory.js's counts were already cast in run-4 was not recorded, so its SCH-003 is unclassified. Per-file detail is in each section's "Run-4 comparison" line in `per-file-evaluation.md`.

### Rule lists

| Rule | Run-4 | Run-5 | Note |
|------|-------|-------|------|
| NDS-001, NDS-002, NDS-003, API-001, NDS-006 | Gate | Gate | Same five gates |
| NDS-004, NDS-005 | Scored | Scored | |
| COV-001, COV-003, COV-004, COV-005, COV-006 | Scored | Scored | |
| COV-002 | — | Scored | Run-5 only |
| RST-001, RST-003, RST-004, RST-005 | Scored | Scored | Run-4's RST-003 used a different reading (see above) |
| RST-002 | — | Scored | Run-5 only |
| API-002, API-003, API-004 | Scored | Scored | Run-5 records API-002/API-003 under "Per-Run Rules" and API-004 per file |
| SCH-001, SCH-002, SCH-003, SCH-004 | Scored | Scored | |
| CDQ-001, CDQ-002, CDQ-003, CDQ-005, CDQ-006, CDQ-007 | Scored | Scored | Run-4 labeled CDQ-003 "No redundant span.end() calls". The rubric title is "Standard Error Recording Pattern", which is what run-5 scores |
| CDQ-008 | Scored | — | The rubric marks CDQ-008 as deleted |
| CDQ-011 | — | Scored | Run-5 only. Replaces CDQ-008 (canonical tracer name) |

---

## Canonical Metrics

| Metric | Run-5 | Run-4 | Run-3 |
|--------|-------|-------|-------|
| Quality | 21/27 (78%); 18/24 (75%) shared | 24/25 (96%) | 25/25 (100%) |
| Gates | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) |
| Files committed | 9 | 7 | 3 |
| Files failed | 4 | 6 | 2 |
| Correct skips | 10 (8 confirmed, 2 questionable) | 10 | 10 |
| Total spans committed | 33 | 20 | 6 |
| Cost | $6.55 | $6.97 | $1.59 |
| Push/PR | YES push / YES auto PR (#4) | YES push / NO auto PR (E2BIG) | YES push / manual PR #2 |
| Q×F | **7.0** (6.8 shared) | 6.7 | 3.0 |
| IS | 100/100 (18 spans) | 100/100 | 90/100 |
| Duration | 1h 17m 24s | 1h 25m 35s | ~50 min |

**Q×F = 7.0** (9 files × 21/27). On the shared rules it is 6.8 (9 × 18/24), still above run-4's 6.7 (7 × 24/25). Volume drove the gain: 9 files and 33 spans against 7 and 20, for $0.42 less. Quality fell, mostly because four files committed for the first time and the per-file evaluation traced more paths, not because code that passed in run-4 broke (see "Most of the drop is not a regression" above). Run-5's 18 IS spans and run-4's count are not strictly comparable, because run-5 used a modified dry-run command (`run-summary.md`).

---

## Failure Analysis

### SCH-003: six files, three patterns

Three patterns, each consistent across files ("Cross-file patterns" in `per-file-evaluation.md`):

- **Counts cast to string** (factory.js, util.js, GitLab.js). factory.js and GitLab.js cast against their own `int` declarations. util.js retyped its schema entry to `string` to match the cast, which still fails, because a count from `.length` is an int whatever the schema says (item 2, matching taze run-17). Raw integer counts in GitRelease.js, GitHub.js, and GitLab.js pass.
- **Reachable boolean on a string enum** (config.js, Version.js). `release_it.version.increment` is guarded only by `!= null`, which lets the documented `--no-increment` (`false`) through.
- **Boolean against a string declaration** (prompt.js). The agent created `release_it.prompt.enabled` as `type: string` and records a boolean.

**Root cause**: the agent's registry declarations and its code disagree, and in util.js the agent resolved the disagreement by changing the schema. Companion notes report `int` for values the code casts to strings ("Notes-versus-code divergence" in `per-file-evaluation.md`).

### SCH-002: registered keys holding a different concept

factory.js, GitRelease.js, and GitHub.js each reuse a registered key for a related but different value: a module specifier under `plugin.namespace`, a release-notes command under `hook.command`, and the previous tag under `git.tag_name`. The key names match the registry, so the validator's key-name check passes them. The rubric does not state that a registered key can fail on what it holds (rule-fit item 11 in `exemption-scope.md`).

### CDQ-007: two unguarded nullable values the validator missed

prompt.js L22 and GitHub.js L603 set attributes from values that are `undefined` or `null` on reachable paths. Plugin.js guards the same `prompt` value with `!= null`, so the guard is the expected pattern. spiny-orb raised 12 CDQ-007 advisories, all false positives, and none on these two lines.

### COV-003: factory.js lost its error recording

Run-4's `load` had an outer recording catch. In run-5, NDS-005 and NDS-007 flagged that catch, and the agent removed it in attempt 2, so the final fallback import can throw out of the span with no error status. This is one of four validator-driven outcomes in this run ("Validator-driven outcomes" in `per-file-evaluation.md`).

### RST-003: Plugin.js wraps a span that already exists

`showPrompt` delegates to `prompt.show` in a different file, which has its own span. spiny-orb's RST-003 checks same-file delegation only, so the validator could not catch it (rule-fit item 4).

### SCH-004: prompt.js duplicates plugin.namespace

`release_it.prompt.namespace` records the same value that Plugin.js records as `release_it.plugin.namespace` on the parent span.

---

## Unrubriced Findings

Real failures with no matching rule. Listed here and not counted in any dimension score (exemption-scope item 1). Each is an un-awaited `return` inside a span's `try`, so the span ends before the returned promise settles. Its duration leaves out the work, a rejection skips the span's catch, and any span call inside the promise runs on an ended span.

| File | Function, line | Returned expression | Effect |
|------|----------------|---------------------|--------|
| lib/plugin/GitRelease.js | `processReleaseNotes`, L66 | `script(ctx)` (user-supplied, may return a promise) | Span excludes the function's work; rejection skips the L73 catch |
| lib/plugin/GitRelease.js | `processReleaseNotes`, L71 | `this.exec(script)` | Span excludes the subprocess runtime; non-zero exit skips the L73 catch (the parent span records it) |
| lib/plugin/github/GitHub.js | `release`, L185 | `this.step({...})` (web path) | Span ends before `createWebRelease` runs |
| lib/plugin/github/GitHub.js | `release`, L189 | `this.step({...})` (CI path) | Span ends before `comment_on_resolved_items` completes. In the IS run, that span was not exported at all (see below) |
| lib/plugin/github/GitHub.js | `release`, L199 | `this.step({...})` (interactive path, the default) | The whole create, upload, and comment flow runs after the span ends |
| lib/plugin/github/GitHub.js | `createRelease`, L355 | `this.retry(async bail => {...})` | HTTP call, retries, and final failure happen after `span.end()`; `release_it.github.release_id` (L376) is set on an ended span and dropped |
| lib/plugin/github/GitHub.js | `updateRelease`, L522 | `this.retry(async bail => {...})` | HTTP call and failure happen after `span.end()` |

**Runtime evidence**: the L189 site cost a span in the captured trace. `commentOnResolvedItems` ran, but `release_it.github.comment_on_resolved_items` is in neither `eval-traces-run5.json` nor Datadog. The likely cause, not verified, is that the process exits soon after the late `span.end()` and the bootstrap flushes only on SIGTERM and SIGINT ("Trace Reconciliation" in `per-file-evaluation.md`). The other six sites were not exercised.

**Fix path for the handoff**: NDS-003 accepts the capture form `const r = await <expr>; return r;`, which Plugin.js L73–74 committed this run. The agent did not use that form at these seven sites. Whether it passes at the multi-line `this.retry(...)` and `this.step(...)` sites was not tested.
