# Actionable Fix Output — release-it Run 5

**Date**: 2026-10-08 (run executed 2026-09-29)
**Handoff target**: spiny-orb team
**spiny-orb SHA**: `a55bd92` (`origin/main`; `spiny-orb --version` 2.0.0)
**Environment**: Node.js v25.8.0, release-it 20.0.0, model claude-sonnet-4-6
**Branch**: `spiny-orb/instrument-1790686416741`
**PR**: https://github.com/wiggitywhitney/release-it/pull/4 (created automatically)
**Run result**: 9 committed, 4 failed, 10 skips (8 confirmed correct, 2 questionable), 33 spans, 21/27 (78%) quality on run-5's rule set and 18/24 (75%) on the 24 rules shared with run-4, gates 5/5, Q×F 7.0 (6.8 shared), IS 100/100, $6.55, 1h 17m 24s.

**Run-4 → Run-5 delta**: +2 files (7 → 9), +13 spans (20 → 33), −$0.42 ($6.97 → $6.55), Q×F +0.3 (6.7 → 7.0), shared-rule quality 23/24 → 18/24, auto PR for the first time on this target.

Every finding below comes from one run unless it says otherwise. Single-run evidence is labeled as an observation to confirm in run-6.

---

## Summary for the spiny-orb Team

Run-5 committed more files and spans than any earlier release-it run, for less money. Four files that failed in run-4 now commit, including GitHub.js (13 spans) and GitLab.js, which had never committed. The PR body no longer hits E2BIG.

The quality drop is mostly not a regression. Of the 14 per-file rule failures, 7 are in files committed for the first time, and 3 are stricter scoring of code unchanged since run-4. Only 2 come from code that got worse after validator feedback. Schema fidelity (SCH) is where the score moved: 4/4 in run-3 and run-4, 1/4 in run-5. Under that drop are three patterns, described first below, and the validator blocked none of the sites. The largest, counts recorded as text, reproduces as an ordering bug in spiny-orb's SCH-003 auto-fix rather than agent behavior (added 2026-10-10).

The remaining volume ceiling is still the LINT/NDS-003 indentation conflict (GitBase.js, Git.js, npm.js) plus a lexical SCH-002 check that rejected a correct attribute reuse in shell.js. Git.js and shell.js together cost 12 spans that run-4 had.

---

## §1. Run-5 Score Summary

### Run-5 rule set (27 rules)

| Dimension | Score | Failures |
|-----------|-------|----------|
| NDS | 2/2 (100%) | none |
| COV | 5/6 (83%) | COV-003: factory.js |
| RST | 4/5 (80%) | RST-003: Plugin.js |
| API | 3/3 (100%) | none |
| SCH | 1/4 (25%) | SCH-002: factory.js, GitRelease.js, GitHub.js. SCH-003: factory.js, util.js, GitLab.js, config.js, Version.js, prompt.js. SCH-004: prompt.js |
| CDQ | 6/7 (86%) | CDQ-007: prompt.js, GitHub.js |
| **Total** | **21/27 (78%)** | 6 failing rules, 14 per-file failures |
| **Gates** | **5/5 (100%)** | none |

### Shared rules (24, like-for-like with run-4)

The 24 shared rules exclude run-4's CDQ-008 (deleted from the rubric) and run-5's COV-002, RST-002, and CDQ-011.

| Dimension | Run-5 | Run-4 | Run-3 | Delta vs run-4 |
|-----------|-------|-------|-------|----------------|
| NDS | 2/2 | 2/2 | 2/2 | none |
| COV | 4/5 | 4/5 | 5/5 | none (failing file changed: shell.js → factory.js) |
| RST | 3/4 | 4/4 | 4/4 | −1 |
| API | 3/3 | 3/3 | 3/3 | none |
| SCH | **1/4** | 4/4 | 4/4 | **−3** |
| CDQ | 5/6 | 6/6 | 6/6 | −1 |
| **Total** | **18/24 (75%)** | **23/24 (96%)** | **24/24 (100%)** | −5 |

Run-3's 24/24 counts its N/A rows as passes, as run-4's comparison did. 10 of the 14 per-file failures sit in SCH (SCH-002 in 3 files, SCH-003 in 6, SCH-004 in 1), and 5 of those 10 are in files committed for the first time.

**Against commit-story-v2 run-28** (the most recent cross-target run): 20/24 shared, and no dimension differs by more than 1 point. Release-it trails by 1 on COV (factory.js), RST (Plugin.js), and SCH (prompt.js SCH-004), and leads by 1 on CDQ, because run-28 also fails CDQ-006. Run-28 committed 12 files plus 1 partial, 48 spans, for $7.23, with Q×F 10.08 on its own rule set (10.0 shared) against release-it's 7.0 (6.8). The gap is mostly volume: at run-28's shared quality, run-5's 9 files would give 7.5; at run-5's quality, run-28's 12 files would give 9.0. Both targets share the SCH-003 count-cast shape and the SCH-002 key-reuse shape (§2).

**Gate detail**: NDS-002 ran 264 tests (230 pass, 32 fail, 2 skipped). `main` gives identical totals with the same 32 failing test names (pre-existing `git tag` errors in temp directories), so instrumentation introduced no failures.

### What the runtime trace confirmed

IS scoring ran one dry run (`--dry-run --ci --no-npm --git.requireCleanWorkingDir=false`). Span-name coverage: config.js 3 of 3, factory.js 1 of 2, util.js 1 of 1, GitRelease.js 1 of 2, GitHub.js 8 of 13. Plugin.js, prompt.js, and GitLab.js were not exercised (prompts skipped by `--ci`, GitLab not configured), and Version.js's `get_incremented_version` did not run, because the `--ci` path computes the version through the synchronous, unspanned `getIncrementedVersionCI` (`lib/index.js` L86).

Runtime evidence confirms four static verdicts: factory.js SCH-003 and util.js SCH-003 (`stringValue` counts), GitHub.js SCH-002 at L603 (previous tag on `get_commits`), and the GitRelease.js SCH-003 PASS (`intValue`). Every other FAIL in this document sits on a path the run did not exercise and is static-only. IS rules: 8 applicable, all pass (SPA-003: 14 unique span names; SPA-005: 10 spans under 5ms, limit 20), 7 not applicable.

### Where the 14 per-file failures come from

| Origin | Count | Failures |
|--------|-------|----------|
| File committed for the first time | 7 | prompt.js (SCH-003, SCH-004, CDQ-007), GitRelease.js (SCH-002), GitHub.js (SCH-002, CDQ-007), GitLab.js (SCH-003) |
| First evaluation of a value source run-4 did not record | 1 | factory.js SCH-002 |
| Stricter scoring of code unchanged since run-4 | 3 | config.js and Version.js SCH-003, Plugin.js RST-003 |
| Code changed after validator feedback | 2 | factory.js COV-003, util.js SCH-003 |
| Unclassified | 1 | factory.js SCH-003 (run-4 did not record whether its counts were cast) |

The classification is unchanged by the RUN5-1 root cause found on 2026-10-10, but its reading shifts: the three count-cast SCH-003 failures (factory.js, GitLab.js, util.js) come from spiny-orb's auto-fix ordering rather than from agent-written code.

---

## §2. Schema-Fidelity Patterns (lead findings)

SCH fell from 4/4 to 1/4, the only release-it dimension that moved by more than 1 point (`baseline-comparison.md`). Most of the drop comes from newly committed files and stricter scoring, so it is not a regression. These three patterns are the behavior underneath it. The first one, on review, comes from spiny-orb's own deterministic pipeline rather than from the agent (see RUN5-1). The validator blocked no site in any of them.

### RUN5-1: Counts recorded as text

**Pattern**: count attributes reach the code as `String(x.length)`. Two keys end up declared `int` with a cast, and one ends up declared `string`.

**Root cause (added 2026-10-10, reproduced against the `a55bd92` build)**: the casts are very likely inserted by spiny-orb's SCH-003 auto-fix, not written by the agent. The agent declares new attributes as bare IDs in `schemaExtensions` (the log's "Schema extensions" lists show bare keys, and the output schema is `z.array(z.string())`). In `executeRetryLoop`, `appendDeclaredExtensionTypes()` parses each bare ID with `parseExtension()`, which defaults it to `type: 'string'`, and `fixAttributeTypeCoercions()` then runs against that schema and wraps numeric values for string-typed keys in `String()`. The name-based correction of `*_count` and `*.count` IDs to `int` runs only later, in `writeSchemaExtensions()`. So `*_count` keys come out declared `int` with a cast already in the code, and `collection_size`, which no heuristic matches, stays `string` with the cast. A reproduction with the two key shapes produced `String(plugins.length)` and `String(collection.length)` from uncast input. This explains why no cast appears in the agent's thinking and why its notes say `type: int`: the notes record the agent's intent, and the pipeline changed the code afterward. It also means util.js did not "retype its schema"; its key was never given `int`.

**Run-5 sites**:
- factory.js L100–101: `release_it.plugin.enabled_count` and `release_it.plugin.external_count`, declared `int`, set from `String(<array>.length)`. Confirmed at runtime: `stringValue` in `eval-traces-run5.json`.
- GitLab.js L152: `release_it.gitlab.milestones_count`, declared `int`, set from `String(releaseMilestones.length)`. Set before the `length < 1` early return, so runs with no milestones record `"0"`.
- util.js L109: `release_it.util.collection_size`, set from `String(collection.length)`, with the schema entry declared `string`. Confirmed at runtime (`stringValue`). `String(undefined)` produces the literal `"undefined"` for a non-array iterable, which the SDK records rather than drops.

Raw integer counts pass in the same run: `release_it.changelog.length` in GitRelease.js, GitHub.js, and GitLab.js, and `commits_since_tag` in GitHub.js.

**What the validator did**: no validator message about type appears for any of these sites, which fits the root cause above: the cast was applied by an auto-fix after the agent's output. For util.js, the log records one validator finding: in attempt 1, NDS-003 rejected the added `if (Array.isArray(collection))` guard (log L359–365, agent thinking for attempt 2). The attempt-2 thinking then plans to set `collection.length` directly. The agent notes (log L381) and `lib/util.instrumentation.md` still describe the attribute as `type: int` and uncast. The cast and the `string` type appear in neither the thinking nor the notes. The root cause above accounts for both.

**Knock-on effect in the same run**: two later agents declined to reuse `collection_size` because it was typed `string`. GitLab.js's agent created `milestones_count` instead (log L1533, L1661). factory.js's agent considered "combining both counts and convert to a string to fit that field" (log L1875) before creating its own `int` keys (log L1959), which it then also cast.

**Cross-target evidence**: commit-story-v2 run-28 has the same cast on int-declared keys (RUN27-3, 12 sites in 3 files, `evaluation/javascript/commit-story-v2/run-28/rubric-scores.md`), and run-28 records that the validator missed both directions of the mismatch. Taze run-17 scored the schema-retype variant as a failure (`evaluation/typescript/taze/run-17/exemption-scope.md`). That makes three targets with the pattern. Release-it and taze each show it in one run. Commit-story-v2 has carried it as RUN27-3 across 3 runs, so it is the only target with repeat evidence. Whether the taze and commit-story-v2 casts come from the same auto-fix ordering is not checked; if they do, this is one deterministic bug across all three targets rather than agent behavior.

**Question for the spiny-orb team**: should the SCH-003 auto-fix run against the corrected or agent-declared type rather than the bare-ID default, or skip extensions whose only type is that default? Separately, why does no check catch a declared type that disagrees with the emitted value? Tracked in spiny-orb #1072 and #1091.

### RUN5-2: Registered keys reused for related values

**Pattern**: the agent sets a registered key from a value that is related to, but different from, the concept in the key's brief.

**Run-5 sites**:
- factory.js L30: `release_it.plugin.namespace` holds the raw module specifier. Plugin.js L69 sets the same key from `this.namespace`, which is the brief's concept.
- GitRelease.js L70: `release_it.hook.command` holds the release-notes generator command. The registry group is scoped to lifecycle hooks, and the agent's own attempt-1 thinking says the case "isn't technically a traditional hook".
- GitHub.js L603: `release_it.git.tag_name` holds the previous tag (`latestTag`). The brief is the tag created for this release, and GitHub.js's other five sites and GitLab.js L311 use it that way. Confirmed at runtime: `get_commits` carries `20.0.0` while its ancestors carry `20.0.1` in the same trace.

**What the validator did**: all three passed. SCH-002's check confirms that the key name is registered. It does not check what the value means.

**Two contrasts**:
- In commit-story-v2 run-28, SCH-002 caught key reuse inside one pass: `dates_requested` holding a date count, a week count, and a month count was caught at reassembly.
- In this run, shell.js failed because the same rule's identifier comparison (`sharesToken` in `sch002.ts`) rejected a correct reuse: `cacheKey` and `command.join(' ')` are the same value (see RUN5-6).

Read together, these cases suggest the check is too loose for registered keys and too strict on identifier names. That is an observation from these cases, not an established property of the rule. The rubric-wording side is rule-fit item 11 in §8.

**Question for the spiny-orb team**: could the meaning-consistency check that runs on new extension keys within one pass also run on registered keys, comparing the value against the registry brief?

### RUN5-3: `false` reaching a string attribute

**Pattern**: a guard that admits a non-string value into a string attribute, or a string declaration for a boolean.

**Run-5 sites**:
- config.js L124 and Version.js L84: `release_it.version.increment` is a string enum, guarded only by `!= null`. The documented `--no-increment` value (`false`) passes the guard, since `lib/index.js` passes `options.version.increment` straight into `getIncrementedVersion`. This code is unchanged since run-4. Run-4 passed it without tracing the `false` path.
- prompt.js L23: `release_it.prompt.enabled` records a boolean under a key the agent declared `type: string` (`agent-extensions.yaml` L20). The companion `lib/prompt.instrumentation.md` calls it a "new boolean attribute", so the agent's intent was boolean.

**What the validator did**: none of the three sites was flagged. The runtime trace did not exercise these paths.

**Question for the spiny-orb team**: does the extension writer default extension types to `string` when the agent's intent is boolean? prompt.js is the only case in this run, so this is a lead to check in source, not a finding. Separately, does SCH-003 trace guard conditions to see which value types can reach a `setAttribute`? The rubric-wording side is rule-fit item 5 in §8.

---

## §3. Other Quality Rule Failures

### COV-003: factory.js `load` lost its error recording (validator-driven)

Run-4's `load` had an outer catch with `recordException` and a rethrow, and it passed. In run-5 attempt 1 the agent wrote the same shape, and spiny-orb flagged it as NDS-005 (added throw in an existing catch) and NDS-007 (recording in an expected-condition catch). The agent's thinking notes that the cited line numbers did not match its structure. Attempt 2 removed the catch, so a failure of the final fallback import (L44, inside the span at L29–52) leaves `release_it.plugin.load` with no error status. A new outer span catch that rethrows does not change propagation, so both flags may be validator false positives that pushed the agent to a worse result. Observed in one file; confirm in run-6.

### RST-003: Plugin.js `showPrompt` wraps a span that already exists

`showPrompt` (L67) is a one-line delegation to `prompt.show`, which emits its own `release_it.prompt.show` span in prompt.js. Each interactive prompt therefore produces two nested spans for one operation, carrying the same namespace and prompt name. spiny-orb's RST-003 checks same-file delegation only, and `rules-reference.md` calls the cross-file case "a known accepted gap". This span is unchanged since run-4, which did not score thin wrappers, so the FAIL is a new evaluation (rule-fit item 4).

### SCH-004: prompt.js duplicates `plugin.namespace`

prompt.js L21 `release_it.prompt.namespace` records the same `this.namespace` value that Plugin.js L69 records as `release_it.plugin.namespace` on the parent span. The companion file says no registered key "semantically matches a prompt namespace identifier". The token-similarity step flagged it (and 7 other agent-added keys, see rule-fit item 14), and the semantic check confirmed it.

### CDQ-007: two unguarded nullable values, missed by the validator

- prompt.js L22: `release_it.prompt.name` from an optional destructured parameter with no default. Plugin.js L70–72 guards the same value with `!= null`, so the guard is the expected pattern.
- GitHub.js L603: `release_it.git.tag_name` from `latestTag`, which is `null` on a first release. The same line is GitHub.js's SCH-002 failure (RUN5-2).

spiny-orb flagged neither site. All 12 of its CDQ-007 advisories in the PR body point at other lines and are false positives (RUN5-10).

---

## §4. Run-4 Findings Assessment

| # | Finding | Status in Run-5 | Scope |
|---|---------|-----------------|-------|
| RUN4-1 | LINT/NDS-003 indentation-width conflict | **Partly resolved** | Of the 5 run-4 blocked files, 5 were evaluated: 3 commit (GitHub.js, GitRelease.js, prompt.js) and 2 still fail (GitBase.js LINT, npm.js NDS-003 ×4, down from ×26). Git.js, committed in run-4, newly fails on the same mechanism. The fix mechanism fired in the 3 committed files: each applied Prettier's reflow, and NDS-003's Prettier-normalized comparison accepted token-identical reflows that run-4 rejected. |
| RUN4-2 | PR body E2BIG | **Resolved** | PR #4 opened 7 seconds after spiny-orb committed the summary, with no manual step. The body is posted with `--body-file`, and the raw compliance JSON is in a separate file. |
| RUN4-3 | COV-003 `Promise.reject` not seen as rethrow | **Fix fired; no committed evidence** | 1 of 1 original file (shell.js) evaluated. In attempt 1, COV-003 flagged the inner `return Promise.reject(err)` catch, and the agent added `recordException` and `setStatus(ERROR)`. shell.js then failed SCH-002 and did not commit, so the evidence is the log and the debug dump only. |
| RUN4-4 | GitLab.js SCH-002 contradictory duplicate messages | **Recurred; did not block** | GitLab.js attempt 1 failed SCH-002 ×2 on `release_it.gitlab.request.method` with the same "semantic duplicate" plus "not found in the registry" pair. The agent deleted the attribute and the file committed, so it passed by omission, not because a fix worked. Run-4's flag was on `release_it.gitlab.asset_name`, and the pre-run check expected that key to be flagged again; the key changed. The log has no validator message text, so whether the match was cross-domain or against the OTel `http.request.method` is unconfirmed. The pre-run source check reported no namespace scoping in the duplicate detection. That was too strong: spiny-orb's triage (#1086) found that the judge stage compares a dotted candidate only against entries with the same all-but-last prefix, while the normalization stage and underscore-only keys are not scoped, and accepted peer extensions from the same declaration list are comparison targets. The recent SCH-002 change (#1056) covers a new key reused for a different concept in one pass, which is a different problem, so it is not a RUN4-4 fix. The request span now records no HTTP method or status. |
| RUN4-5 | Live-check advisory noise from SDK resource attributes | **Partly addressed** | The raw report is written to `spiny-orb-live-check-report.json` rather than inlined. The status line still reports the raw instance count ("1239 spans, 5555 advisory findings"; run-4: 2173 spans, 15,389) instead of distinct finding types. Whether the 5555 are the same small set of SDK resource attributes was not assessed this run. |
| RUN3-3 | HOME not forwarded to weaver subprocess | **Already fixed before run-5** | `a55bd92` already passes `HOME: process.env.HOME \|\| homedir()` to every weaver subprocess (`src/coordinator/dispatch.ts` L42 and L185, `schema-diff.ts` L81; commits `b0e10de1`, `d17a5b54`, `479076d2`), so the `HOME="$HOME"` workaround in the instrument command was redundant. Checked 2026-10-10 during spiny-orb's triage of this handoff. Run-6 can drop the workaround. |

**Source checked before the run** (`lessons-for-run6.md`): RUN4-1's changes are PRDs #820 (Prettier-normalized NDS-003), #845, #875, and #885, all in `prds/done/`; RUN4-2's is `src/deliverables/git-workflow.ts` (temp file plus `--body-file`); RUN4-3's is `src/languages/javascript/rules/cov003.ts` (L230 treats `return Promise.reject(err)` as propagation).

**Other run-4 GitHub.js symptom resolved**: run-4's GitHub.js failure also involved two emoji log lines that came out with an encoding mismatch. In run-5 they are byte-identical to the original.

---

## §5. Failed Files

| File | Failure | Attempts | Run-4 | Root cause |
|------|---------|----------|-------|------------|
| lib/plugin/GitBase.js | LINT | 3 | failed (LINT) | Original L38 is exactly 120 characters, so the wrapper's 4 extra spaces put it over Prettier's width. The agent also converted `return` to `const result = await` to capture `release_it.git.commits_since_tag` (138 characters). Its attempt-3 reasoning calls the Prettier note "just a soft suggestion" and ships the long line as "a known trade-off". LINT is blocking, so the file failed. |
| lib/plugin/git/Git.js | LINT | 3 | **committed** (10 spans) | One 117-character `log.warn` line becomes 121 inside the wrapper. Attempt-2 thinking identifies the line and plans the fix, and the final dump still has it. The log does not show why. |
| lib/plugin/npm/npm.js | NDS-003 ×4 | 2 | failed (NDS-003 ×26) | Attempt 1 failed LINT. In attempt 2 the agent hand-reformatted the lines Prettier wanted split (the destructuring, the `task` arrow, `Object.entries().find()`), and the final result failed NDS-003 instead, so the file moved from a LINT problem to an NDS-003 problem. The first reported violation is the added `await`: the agent wrote `return await` in `bump()` and `publish()` "so span.end() fires after the async operation settles", which is the in-place edit NDS-003 rejects. In the same file it left `getLatestRegistryVersion`'s return un-awaited and wrote that the span "ends correctly", so it applied its timing rule inconsistently. |
| lib/shell.js | SCH-002 | 3 | **committed** (2 spans) | Lexical meaning-consistency check (RUN5-6). Because shell.js failed, subprocess execution (git, npm, and hook scripts run through `Plugin.exec` and spinner tasks) has no spans of its own in this run. |

The 4 failed files used 11 of the run's 28 agent attempts and cost $2.91, 44% of the run (GitBase.js $0.68, Git.js $0.96, npm.js $0.65, shell.js $0.62). None of that shipped. Committed files cost $3.63, and cost per committed file fell from about $1.00 in run-4 to about $0.73. Attempts on committed files rose from 11 to 17: config.js 1 → 3 (NDS-003, then LINT, then clean), factory.js 1 → 2, util.js 1 → 2, and Version.js 3 → 1.

**Run-time stalls**: the log paused for 5 to 10 minutes on Git.js, GitHub.js, and npm.js while the process stayed alive, then resumed. Nothing in the output says the agent is still working during those pauses. Observation for the spiny-orb team, not a defect.

**Why the same file can commit in one run and fail the next**: spiny-orb `a55bd92` runs both sides through Prettier inside NDS-003 (`prettierNormalizeForComparison`), which makes NDS-003 tolerant of reformatting. It does not reformat the agent's output. The agent still has to produce Prettier-exact text within its attempt budget, guided by the LINT failure's diff. Git.js is the clearest case: the same original code committed in run-4 and failed in run-5.

**The LINT feedback is hard to act on**: for Git.js the Prettier diff in the log is about 90 lines to communicate a one-line problem, because after the first hunk every following line appears as a `-`/`+` pair with identical text. For GitBase.js the diff is cut off (`... (diff truncated)`) and the one real difference is in its first eight lines. This is a plausible contributor to attempts spent on formatting. The log records only the last attempt's diff, so what the agent saw earlier is not verifiable.

---

## §6. New Run-5 Findings

**Type** separates findings (a plausible spiny-orb root cause worth investigating) from observations (something to watch, without a clear basis yet for calling it wrong).

| # | Title | Priority | Type | Component |
|---|-------|----------|------|-----------|
| RUN5-1 | Counts recorded as text (§2) | P1 | Finding (reproduced; cross-target link unchecked) | SCH-003 auto-fix ordering, extension writer default type |
| RUN5-2 | Registered keys reused for related values (§2) | P1 | Finding | SCH-002 validator |
| RUN5-3 | `false` reaching a string attribute (§2) | P2 | Finding | SCH-003 validator, extension writer |
| RUN5-4 | Spans that end before their returned promise settles | P1 | Finding | Agent prompt, no validator rule |
| RUN5-5 | Pre-scan misses both release-it entry points; trace has no root | P1 | Finding | Pre-scan (`classifyFunctions`, `hasDirectProcessExit`) |
| RUN5-6 | SCH-002 lexical check rejects a correct reuse (shell.js) | P1 | Finding | SCH-002 validator |
| RUN5-7 | Validator feedback that left code worse | P2 | Finding (each case once) | NDS-005/NDS-007, COV-003, CDQ-006 |
| RUN5-8 | Agent treats LINT as advisory | P2 | Observation (1 file) | Agent prompt, LINT feedback |
| RUN5-9 | spiny-orb deliverables publish absolute local paths | P1 | Finding | Live-check report writer, PR summary builder |
| RUN5-10 | 18 of 18 advisory sites incorrect; both real CDQ-007 sites missed | P2 | Finding | CDQ-007 advisory, SCH-001 companion advisories |
| RUN5-11 | PR body Span Category Breakdown wrong in two columns | P3 | Finding | PR summary builder |
| RUN5-12 | Live-check status reads "OK" over a partial report | P3 | Finding | PR summary builder |
| RUN5-13 | Failed-file rows embed the full validator message | P3 | Finding | PR summary builder |
| RUN5-14 | Companion notes contradict the committed code in 8 of 9 files | P2 | Finding | Agent notes, companion writer |
| RUN5-15 | No rule checks command and URL attribute values for credentials | P2 | Finding | CDQ-007 validator |
| RUN5-16 | NDS-003 guard filter accepts one attribute guard and rejects a matching one | P3 | Observation (1 file) | NDS-003 validator |
| RUN5-17 | Attribute dropped because the agent misjudged what NDS-003 accepts | P3 | Observation | Agent prompt |
| RUN5-18 | Smaller instrumentation-quality observations | P3 | Observation | Various |

### RUN5-4: Spans that end before their returned promise settles

Seven committed sites return an un-awaited promise inside a span's `try`, so `span.end()` in `finally` runs before the work finishes. The span's duration leaves out the work, a rejection skips the span's catch, and any span call inside the promise runs on an ended span.

| File | Function, line | Returned expression | Effect |
|------|----------------|---------------------|--------|
| GitRelease.js | `processReleaseNotes`, L66 | `script(ctx)` (user-supplied, may return a promise) | Span excludes the function's work; rejection skips the L73 catch |
| GitRelease.js | `processReleaseNotes`, L71 | `this.exec(script)` | Span excludes the subprocess runtime; non-zero exit skips the L73 catch (the parent span records it) |
| GitHub.js | `release`, L185 | `this.step({...})` (web path) | Span ends before `createWebRelease` runs |
| GitHub.js | `release`, L189 | `this.step({...})` (CI path) | Span ends before `comment_on_resolved_items` completes |
| GitHub.js | `release`, L199 | `this.step({...})` (interactive path, the default) | The whole create, upload, and comment flow runs after the span ends |
| GitHub.js | `createRelease`, L355 | `this.retry(async bail => {...})` | HTTP call, retries, and failure happen after `span.end()`; `release_it.github.release_id` (L376) is set on an ended span and dropped |
| GitHub.js | `updateRelease`, L522 | `this.retry(async bail => {...})` | HTTP call and failure happen after `span.end()` |

The failed files' dumps have five more sites (GitBase.js `getRemoteUrl` L133 and `getSecondLatestTagName` L210, npm.js `getLatestRegistryVersion` L245, shell.js `execFormattedCommand` cache-hit and final returns). The GitHub.js companion notes say `release_id` "is placed inside the retry callback" with the span "accessible via closure", which is true and leads to the dropped attribute.

**Runtime evidence**: the L189 site likely cost a span in the captured trace. `commentOnResolvedItems` ran (its dry-run line printed), and `release_it.github.comment_on_resolved_items` is in neither the OTLP export nor Datadog. The parent span `release_it.github.release` ended about 764ms before the process exited, which leaves time for the comment work, including the `searchQueries` HTTP calls (L561), to run after the parent closed. The child span therefore ended later, at an unrecorded time shortly before `process.exit(0)` (`bin/release-it.js` L9). The likely cause, not verified, is that the bootstrap in `examples/instrumentation.js` flushes only on SIGTERM and SIGINT, so an export started by that late `span.end()` can be cut off. The bootstrap belongs to the eval's IS harness, and the eval tracks the flush fix on its side. The other six sites were not exercised.

On the interactive path (L199), the work after `release_it.github.release` ends is still timed and error-recorded by the child spans `release_it.plugin.show_prompt` and `release_it.prompt.show`, which await the task. The loss there is the parent span's duration and catch, not all visibility.

**What the validator does**: no rule flags it. A search of `cdq001.ts`, `cov004.ts`, and the NDS-003 through NDS-007 rules found no await or settle handling. That is "none found", not "none exists". CDQ-001 and COV-003 both pass these spans (rule-fit items 1 and 7).

**The fix is available today**: NDS-003 rejects the in-place edit `return await <expr>` (npm.js proves it), but accepts the capture form `const r = await <expr>; return r;`, because `reconcileReturnCaptures` in `nds003.ts` strips a leading `await` before matching. Plugin.js L73–74 committed that form in this run, and Git.js's dump has three accepted capture rewrites. The agent did not use it at the seven sites. Whether the capture form passes at the multi-line `this.retry(...)` and `this.step(...)` sites was not tested.

**Question for the spiny-orb team**: should the agent prompt name the capture form as the way to keep span timing correct, and should a rule flag a `return` of a promise-valued expression inside a span's `try`?

### RUN5-5: Pre-scan misses both release-it entry points; the trace has no root

`lib/index.js` (`runTasks`, the async orchestrator) and `lib/cli.js` (the async default export, the CLI entry point) were skipped with no LLM call, labeled "pure sync utilities or unexported helpers". Reproduced on `a55bd92` by rerunning the pre-scan on the originals:

- `classifyVariableFunction` takes `isExported` from the declaring `const` statement, so `const runTasks = async () => {}` followed by `export default runTasks` reads as unexported, and the COV-001 entry-point test (`isAsync && (isExported || name === 'main')`) does not fire.
- `classifyFunctions` collects function declarations, variable-assigned functions, and class methods, so an anonymous `export default async options => {...}` is never collected.
- As a non-entry async function, `runTasks` then falls to the COV-004 branch, where `hasDirectProcessExit` returns true because of `process.exit()` calls inside `if` branches within the `try` (L68, L71, L107, L110). The function exits early only on `--changelog` and `--release-version` and otherwise runs the whole release. Only an entry point overrides this carve-out. Had the export been detected, the pre-scan would have issued its minimal-wrapper directive for entry points that call `process.exit()` (`docs/rules-reference.md`, COV-001), which is the intended path for `runTasks`.

These are different false negatives from run-3's, which were async plugin class methods and were fixed for run-4.

**Runtime effect, confirmed**: one dry run produced 10 distinct traces, each with its own root and no orphans: `release_it.config.init`, `release_it.plugin.get_plugins`, `release_it.github.init`, five separate `release_it.util.reduce_until` (the five `lib/index.js` call sites that ran), `release_it.git_release.before_release`, and `release_it.github.release`. IS scored 100/100 because it does not penalize this, so the score sits alongside a fragmented trace.

The PR body's "No changes needed" list labels both files that way, which is wrong for these two. Runs 3 and 4 labeled them "Synchronous only" and "Pure sync orchestrator entry point". Whether the same gap caused those skips was not checked, so confirm before counting it as a three-run recurrence. If `runTasks` gets its span, `cli.js`'s default export becomes a thin wrapper under RST-003.

### RUN5-6: SCH-002 lexical check rejects a correct reuse (shell.js)

`SCH-002 check failed: declared attribute extension "release_it.shell.command" is used with an inconsistent value source at line 99 ("command") — it was first used with "cacheKey" at line 36, a different concept.`

The same-pass check in `sch002.ts` (the loop over `acceptedExtensionKeys`) compares the base identifier feeding each `setAttribute` and passes when the two share a token (`sharesToken`). `cacheKey` and `command` share none. They are the same value: dump L32 is `const cacheKey = typeof command === 'string' ? command : command.join(' ');`.

Attempt history: attempt 1 failed COV-003 (RUN4-3's fix firing) and NDS-005. In attempt 2 the agent switched one site to `release_it.shell.program`, and the semantic-duplicate check rejected it against `release_it.shell.command`. Attempt 3 restored `release_it.shell.command` on both spans and failed the meaning check. Of the spellings the agent tried, none satisfied both checks. The agent's attempt-3 thinking shows it noticed the equivalence. The validator message did not tell it how to resolve it. One untried spelling (a local named `cacheKey` in `execWithArguments`) might pass; that is untested.

Classification: false positive from a lexical check. The rule's goal, catching one key used for two concepts, is sound. Cost: 2 spans that run-4 committed.

### RUN5-7: Validator feedback that left code worse

Three committed files ended worse because of how the agent responded to validator output (util.js, listed fourth below, was first counted here and is now attributed to the pipeline). Each was observed once, except the NDS-005 flag on an added outer rethrowing catch, which appeared in two files.

- **factory.js**: lost `load`'s error recording after NDS-005 and NDS-007 flagged an outer recording catch (§3, COV-003 FAIL). In shell.js attempt 1, NDS-005 flagged a `throw error` in an outer catch the agent had added in the same way, and attempt 2 removed that catch. shell.js did not commit for other reasons (RUN5-6), so this is the second instance of the same flag, not a second scored failure.
- **GitLab.js**: records each error twice. Attempt 1 had outer-catch recording on every span, and COV-003 still flagged five inner rethrowing catches (L193, L283, L354, L399, L418). The agent added recording there, so a failed `createRelease` call produces two exception events on `release_it.gitlab.request` and two more on `release_it.gitlab.create_release` (rule-fit item 10). The request span is also marked ERROR when the `user` or `members/all` probe fails, although `isAuthenticated` and `isCollaborator` treat that as an expected `false`.
- **config.js**: switched from `Boolean()` to `!!` for `is_ci`/`is_dry_run`. The agent's attempt-3 thinking says it chose `!!` so the CDQ-006 guard check would not match. Both are exempt trivial conversions, so the choice reflects the validator's pattern rather than the code's intent.
- **util.js**: originally listed here as the agent retyping `collection_size` to `string` to match its cast. On review (RUN5-1 root cause), the `string` type and the cast both come from spiny-orb's pipeline, so util.js is not a case of the agent responding badly to feedback. The logged validator finding was NDS-003 on the guard.

### RUN5-8: Agent treats LINT as advisory

GitBase.js's agent concluded in attempt 3 that "the Prettier note is just a soft suggestion, not the hard validator requirement" and kept the over-length line, which lost the file. The failure text says only that the output is not Prettier-compliant. Whether the prompt states that LINT blocks is not verified (open question 3 in §7). One file this run.

### RUN5-9: spiny-orb deliverables publish absolute local paths

The fork is public. `spiny-orb-live-check-report.json` contains the absolute local home-directory path, including the username, on 1,046 lines. The PR body contains it 7 more times, in the failed-file warnings and the Prettier config path. CDQ-007 exists to keep raw filesystem paths out of telemetry, and spiny-orb's own deliverables publish them. The gap is in the report writer and the PR summary builder: paths could be made relative to the repo root before either file is written.

Related size observation: PR #4 changes 31 files (+153,378 / −625): 9 instrumented source files, 19 companions, the registry (`semconv/agent-extensions.yaml`, +223), and 2 deliverables. The PR summary is 547 lines, against run-4's roughly 150 lines plus a 399K-line JSON blob. The live-check report is +150,297 lines, 98% of the PR's added lines, and a reviewer is not meant to read it line by line. The PR also adds 10 near-empty companion files (14 lines each) for skipped files, and commits `spiny-orb-pr-summary.md` alongside posting it, so the body exists twice on the branch.

### RUN5-10: Advisory findings: 18 of 18 incorrect, both real CDQ-007 sites missed

| Advisory | Where it appears | Why it is incorrect |
|----------|------------------|---------------------|
| CDQ-007, prompt.js L37 | PR body | `release_it.prompt.type` holds `confirm`/`input`/`list`. No PII name, no path |
| CDQ-007, Plugin.js L71 | PR body | `release_it.prompt.name` holds a prompt identifier |
| CDQ-007, GitHub.js L344–346, L457–459, L513, L636 (8 sites) | PR body | No PII attribute name or path on any of these lines |
| CDQ-007, Version.js L81, L84 | PR body | Bounded scalars guarded by `!= null` |
| SCH-001, `GitRelease.instrumentation.md` | Companion only | Both span names are declared in `agent-extensions.yaml` |
| SCH-001 ×4, `GitHub.instrumentation.md` | Companion only | Stale. All 13 names are declared on the branch |
| SCH-001, `GitLab.instrumentation.md` (`create_release` vs `release`) | Companion only | The two methods do different work, and the agent's own thinking reached the same conclusion |

**Contradiction rate**: 100% across 18 sites. The 12 PR-body sites alone are also 100%. Run-4's 56% (5 of 9) counted PR-body advisories only, so on run-4's basis the rate moved from 56% to 100%. Commit-story-v2 run-28 was 46% on its own counting unit. In both targets, CDQ-007 drives the false positives by firing on attributes that hold no path or PII.

**Missed**: prompt.js L22 and GitHub.js L603, the two real CDQ-007 failures (§3). The prompt.js advisory points at L37 instead of L22.

**Message quality**: the CDQ-007 text reads "Fired for one or more of: a PII attribute name ... or a raw filesystem path". It does not say which condition fired or which key. Each of the 12 sites repeats the same paragraph of path-handling advice, which applies to none of them. The GitHub.js and Version.js entries collapse their lines into a trailing list.

### RUN5-11: PR body Span Category Breakdown is wrong in two columns

- **"Attrs Reused"** reads 0 in all nine rows. GitHub.js sets 10 registered keys (33 `setAttribute` calls), GitLab.js 8 distinct keys against 4 new, GitRelease.js 3 against 1 new, Version.js 3, Plugin.js 2.
- **"External Calls"** reads 0 for GitHub.js, whose Octokit call sites are why COV-002 applies there, and 1 for config.js, which has no outbound call site.

The section is labeled self-reported. The registry version stays at 0.1.0 at baseline and head, as in run-4, although this PR adds 13 attributes and 33 span IDs. The token figures are labeled inconsistently: spiny-orb's final log summary prints "254.8K output (199.7K cached)", while the PR body's token table lists 199,693 as cache read, an input-side figure, alongside 535,431 cache write. The Schema Changes section lists new keys only, so registered keys the spans carry (`release_it.is_ci`, `release_it.git.tag_name`, `release_it.changelog.length`, and others) appear nowhere in the PR body. The log's per-file attribute counts are also new keys only ("0 attributes" for GitHub.js).

### RUN5-12: Live-check status reads "OK" over a partial report

The status line reads "Live-Check: OK (1239 spans, 5555 advisory findings)". The Warnings section then says the report "may be incomplete" because 4 files failed. A reviewer who reads only the status line sees a clean result.

### RUN5-13: Failed-file rows embed the full validator message

Each failed file's Status cell holds the whole validator message. GitBase.js's row is 7,871 characters, including a flattened Prettier diff, and the Warnings section repeats it. Reviewer utility for the PR scored 3.25/5 (Completeness 5, Accuracy 3, Actionability 2, Presentation 3), the same total as run-4 for different reasons.

### RUN5-14: Companion notes contradict the committed code in 8 of 9 files

Plugin.js, factory.js, Version.js, util.js, prompt.js, GitRelease.js, GitHub.js, and GitLab.js each have notes or companion text that contradicts the code. In config.js, the agent's attribute brief ("The config file name or path used to load local release-it configuration") never reached the registry, which has the generic "Agent-discovered attribute: release_it.config.file". The common forms:

- Types the code does not emit: `int` for values cast to strings (factory.js, util.js, GitLab.js), "boolean" for a `string` declaration (prompt.js). For the three count files this is the RUN5-1 mechanism, not notes drift: the notes recorded the agent's intent, and the auto-fix changed the code afterward.
- Skip reasons that cite the wrong rule: Version.js calls `promptIncrementVersion` "an unexported helper … skipped per RST-004" (it is a public method); GitHub.js calls `uploadAsset`/`uploadAssets` "synchronous helpers, unexported internals" (both are public and return network I/O promises, and attempt-1 thinking said it would correct that and did not); GitLab.js says `uploadAssets()` was skipped "per RST-001/RST-003" and that the constructor is "synchronous setup only" (it reads the CA certificate).
- Claims the code does not bear out: GitRelease.js calls `hook.command` a "semantic match" while its own thinking says it isn't a hook, its attempt-1 thinking says "CDQ-006 explicitly exempts span attributes on entry points" (the exemption covers trivial type conversions only), and it says the ternary "stays formatted exactly as in the original" while the committed code reformats it; GitHub.js's thinking says it will add `draft` and `prerelease` to `updateRelease`, and the code does not; Plugin.js says `exec` and `step` have "no async I/O" and calls `release_it.prompt.name` a "registered schema attribute" (an extension added earlier in this run).
- Omissions: GitRelease.js never mentions that both of its returns are un-awaited.

The skip decisions themselves are correct in each case. The problem is that a PR reviewer reading the companion files gets a description that does not match the diff, which undermines trust in the rest of the documentation.

### RUN5-15: No rule checks command and URL attribute values for credentials

CDQ-007 (`cdq007.ts`) works from sensitive identifier names and path-shaped identifiers. It checks what the value expression is called, not what it can contain. Values that can embed credentials and pass:

- Committed: GitRelease.js `release_it.hook.command` (full user-configured command string; registered by the project, scored PASS with an advisory). The value is the command template before `format()` interpolation in `shell.exec`, so `$VAR` references stay unexpanded, and a token written literally into the command, for example in a `curl` header, is exported as written.
- In failed-file dumps only, so not in PR #4: shell.js `release_it.shell.command` (`cacheKey`, the full command line), Git.js `release_it.git.push_repo` (remote name or URL), npm.js `release_it.npm.registry` (registry URL), GitBase.js and Git.js `vcs.repository.url.full` (from `git remote get-url`).

These would surface as soon as those files commit. For contrast, in npm.js the same rule did steer the agent away from recording `username`.

### RUN5-16: NDS-003 guard filter is inconsistent (config.js)

In config.js attempt 1, NDS-003 rejected an added `if (file !== false)` guard around a `setAttribute`. The same check accepted a structurally identical attribute-only guard at L123 (`if (expanded.version != null && ...)`). The agent rewrote the guard as a ternary inside `setAttribute`. One run, one file.

### RUN5-17: Attribute dropped because the agent misjudged what NDS-003 accepts

Version.js no longer records the registered `release_it.version.next`, which run-4 captured behind a `result != null` guard. The agent believed that capturing the `||` result in a variable would violate NDS-003. The capture form passes NDS-003 (RUN5-4), so the agent's belief was wrong. This loses diagnostic value and fails no rule, so it is an observation.

### RUN5-18: Smaller instrumentation-quality observations

None of these fails a rule. Each is from one run.

- **`release_it.is_ci` has two value sources.** config.js sets it from `options.ci`. Version.js, GitHub.js, and GitLab.js set it from the `Config.isCI` getter, which is also true for `--release-version` and `--changelog`. The brief covers both readings, so SCH-002 passes, but the two disagree on those flags.
- **`release_it.changelog.length` holds two texts in one run**: 464 on GitRelease.js's `before_release` (the Git changelog) and 683 on GitHub.js's `render_release_notes` (the body rendered from commits). Both fit the brief ("generated changelog text"), so both pass. A query on the key mixes them when a GitHub `releaseNotes.commit` template is configured.
- **`release_it.config.file`** can expose an absolute local path, and on the `config: false` path it records `''` instead of being omitted.
- **Repeated attributes on parent and child spans**: `is_ci`/`is_dry_run` on config.js `init` and `load_options`; `is_dry_run`, `owner`, `repository`, and `tag_name` across GitHub.js's nested spans; `is_dry_run` on seven of GitLab.js's nine spans. GitLab.js's `release_it.changelog.length` (L315) repeats the value that `release_it.git_release.before_release` already records from the same `releaseNotes` context.
- **Deep nesting for one operation in GitHub.js**: `create_release` → `get_octokit_release_options` → `render_release_notes` → `get_commits` (each about 848ms, all the `compareCommits` call), and `generate_web_url` → `get_octokit_release_options`. The trace confirms the nesting matches the awaited calls.
- **GitHub.js asset upload has no span**, so per-asset latency and failures appear only on the enclosing span and the registered `release_it.github.assets_count` is never recorded. The async arrow passed to `this.retry` in `uploadAsset` (L398) is a nested async function, which the implemented COV-004 does not inspect (rule-fit item 9).
- **prompt.js emits a span when the prompt is disabled**: `enabled: false` returns at L24 after three attributes, so every disabled Git commit, tag, or push step in an interactive run emits a `release_it.prompt.show` span.
- **util.js `reduce_until` fires six times per run** on a generic helper, and its only attribute is the same plugin count each time. Naming the reduced method would tell the calls apart.
- **GitLab.js `release_it.gitlab.request.endpoint`** embeds project ID, user ID, version, and asset file name, so its cardinality grows with releases and assets. `beforeRelease` (L130–144) is a span over two awaited calls that both have spans, with only `is_dry_run`.
- **Version.js** has two paths where its span never ends: `process.exit(0)` at L103 skips the `finally` (the notes disclose this), and a rejection of `this.step(...)` inside the `new Promise` executor (L100–108) never settles the outer promise. The second is an original-code hang that instrumentation makes visible.
- **GitRelease.js's `processReleaseNotes` span records `hook.command` with no `hook.name`**, so the hook group's key appears without the key that names which hook it is.
- **`release_it.github.release_id`'s brief says "created" release**, but on `update_release` (L515) it identifies the existing release. The key is generic enough to pass.

---

## §7. Open Questions for the spiny-orb Team

From `failure-deep-dives.md`, "What This Deep-Dive Could Not Establish". These are questions, not findings.

1. What did the validator report for GitBase.js attempt 2 and Git.js attempt 2? The log records only the final attempt's failures and truncates the agent's thinking, including Git.js's attempt-3 reasoning.
2. Which four of npm.js's six changed lines produced the NDS-003 ×4? The log prints only the first (original line 73, the added `await`). The likely account is the two added `await`s and the `Object.keys(tags).filter(...)` capture, but the log does not confirm the mapping.
3. Does the agent prompt state that LINT is a blocking check? GitBase.js's agent treated it as advisory (RUN5-8). `src/agent/prompt.ts` and the feedback builder would answer it.
4. Does NDS-003's Prettier normalization accept the split form of a return-value-capture line? GitBase.js's attempt-3 thinking suggests attempt 2 failed NDS-003 after applying Prettier's split of a `const result = await this.exec(...)` capture. A reproduction against `a55bd92` would settle it.

Two more from this run:

5. Does the log omit validator message text for intermediate attempts by design? RUN4-4's recurrence, GitBase.js, and Git.js all lack it, which limits diagnosis.
6. Did the NDS-005 and NDS-007 flags on factory.js's outer recording catch, and the COV-003 flags on GitLab.js's inner catches when the outer catch already recorded, behave as intended (RUN5-7)?

---

## §8. Rule-Fit Issues

Each item is a place where a rule, or the document describing it, does not fit what this run found. They come from `exemption-scope.md`, "Rule-fit issues for the handoff". The eval scored each case with a recorded interpretation (the item numbers in parentheses). They are gaps for the spiny-orb team to judge, not prescribed changes.

1. **CDQ-001 cannot see premature closes** (item 1). A span that ends before its returned promise settles passes the finally-block mechanism. The agent does not use the NDS-003-accepted capture form to fix span timing; NDS-003 does not block every fix (RUN5-4).
2. **CDQ-007 does not inspect value content** (item 3). Command strings and URLs that can carry credentials pass (RUN5-15).
3. **The research rubric's COV-004 mechanism has drifted from the implemented rule** (item 6). `docs/research/evaluation-rubric.md` still lists I/O-library calls, while `cov004.ts` and `rules-reference.md` exclude sync functions. Suggested rubric wording: "async functions and functions containing `await`; synchronous functions are not flagged even when they call I/O APIs". The eval scored the implemented rule.
4. **RST-003's same-file narrowing leaves cross-file duplicate spans undetected** (item 7). Plugin.js `showPrompt` → `prompt.show`. The eval applied the rubric mechanism, since the narrowing is a visibility limit rather than a design choice.
5. **SCH-003 does not say whether enums are open or closed, or how to treat reachable non-string values** (item 5). The eval failed reachable booleans and passed out-of-enum strings (RUN5-3).
6. **The rubric lists CDQ-011, while run-4's per-run table used CDQ-008, which the rubric marks deleted.** Run-5 scores CDQ-011 per file.
7. **COV-003 cannot see rejections that settle after a premature close** (item 9). The same gap as item 1, seen from COV-003.
8. **NDS-003's mechanism does not say whether a token-identical reflow counts as unchanged** (item 10). Run-4's validator rejected reflows that run-5's accepted. Observed across runs, not yet explained.
9. **COV-004 does not say how to treat nested async callbacks** (GitHub.js `uploadAsset`, the async arrow passed to `this.retry`). The implemented rule skips nested functions.
10. **No rule covers duplicate exception events on one span** (GitLab.js, RUN5-7). CDQ-003 checks only the recording pattern.
11. **SCH-002's mechanism is about key names, and value-concept mismatches are scored through it** (item 13). The rubric does not state that a registered key can fail on what it holds (RUN5-2).
12. **The pre-scan's COV-001 entry-point test misses two common export forms** (item 14). `export default <name>` after a `const` declaration, and an anonymous `export default async () => {}` (RUN5-5). The rubric's scope note keeps a skipped file out of coverage scoring, so only correct-skip verification catches it.
13. **The pre-scan's `process.exit()` carve-out drops an async function whose only exits are conditional** (item 14). `runTasks` exits early on two flags and otherwise runs the whole release (RUN5-5).
14. **SCH-004's 0.5 Jaccard threshold does not separate keys under a shared two-token namespace** (item 16). `release_it` splits into two tokens, so sibling keys score 0.6 or more. 8 of 13 agent-added keys cross the threshold and only one pair is a real duplicate. Treating the namespace as one token, or excluding it, would make the threshold meaningful.
15. **The research rubric's NDS-003 filter list has drifted from the implemented rule.** The rubric lists imports, tracer acquisition, span calls, and try/finally wrappers. `nds003.ts` also accepts defined-value guards around `setAttribute`, `isRecording()` guards, return-value captures (with an added `await`), and multi-line normalization. Run-5's PASS rows rely on three of these (guards in config.js L123, GitRelease.js L44, GitLab.js L314; captures in Plugin.js L73–74 and GitHub.js L626–637; item-10 reflows).
16. **spiny-orb's implemented COV-006 pattern list has no `fetch`/undici entry** (from GitLab.js's COV-006 row in `per-file-evaluation.md`, not from the exemption-scope list). GitLab.js's `request()` wraps global `fetch`, which `@opentelemetry/instrumentation-undici` covers. The eval scored COV-006 PASS because the span covers domain work around the call (item 12), so the gap did not change a verdict. It would matter for a span whose body is the bare `fetch` call.

---

## §9. Unresolved Items Entering Run-6

| Item | Origin | Runs open | Type | Status |
|------|--------|-----------|------|--------|
| LINT/NDS-003 indentation conflict | RUN4-1 | Runs 2, 4, 5 | Finding | Reduced: 3 of 5 run-4 files commit; GitBase.js, npm.js still fail; Git.js newly fails |
| Pre-scan misses `lib/index.js` and `lib/cli.js` entry points | RUN5-5 | 1 run identified | Finding | Reproduced on `a55bd92`; fragments the trace |
| SCH-002 lexical meaning check | RUN5-6 | 1 run | Finding | Blocks shell.js |
| Counts recorded as text | RUN5-1 | 1 run here; also CS-v2 RUN27-3 (3 runs) and taze run-17 | Finding | Reproduced as an auto-fix ordering bug |
| Registered keys reused for related values | RUN5-2 | 1 run | Finding | Passes SCH-002's validator |
| `false` reaching a string attribute | RUN5-3 | 1 run | Finding | Not flagged |
| Un-awaited returns inside spans | RUN5-4 | 1 run scored (likely present unscored in earlier runs) | Finding | 7 committed sites; capture form available |
| Local paths in deliverables | RUN5-9 | 1 run | Finding | Public fork |
| Advisory false positives | Run-3 (7%) | 3 runs | Finding | Worse: 100% |
| GitLab.js SCH-002 contradictory messages | RUN4-4 | 2 runs | Finding | Recurred, passed by omission |
| COV-003 `Promise.reject` gap | RUN4-3 | 1 run | Finding | Fix fired; needs a committed shell.js to confirm |
| Validator feedback that left code worse | RUN5-7 | 1 run each | Finding | Watch factory.js, GitLab.js |
| Notes-versus-code divergence | RUN5-14 | 1 run | Finding | 8 of 9 files |
| Live-check advisory noise and status line | RUN4-5, RUN5-12 | 2 runs | Finding | Raw count still shown; "OK" over partial |
| Credential-bearing attribute values | RUN5-15 | 1 run | Finding | Surfaces when shell.js, Git.js, npm.js commit |
| Agent treats LINT as advisory | RUN5-8 | 1 run | Observation | One file |
| NDS-003 guard filter inconsistency | RUN5-16 | 1 run | Observation | One file |

---

## §10. Score Projections for Run-6

### How run-5's own projections held up

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| Conservative (RUN4-1 not landed) | ~7 files, 24/25, Q×F ~6.7, ~$5–7 | 9 files, 21/27 (18/24 shared), Q×F 7.0, $6.55 | Exceeded on volume, not met on quality |
| Target (RUN4-1 landed) | 11–13 files, 24–25/25, Q×F ~10–12 | 9 files, Q×F 7.0 | Not met |
| Stretch (RUN4-1 + RUN4-2) | 12–15 files, 25/25, Q×F ~12–15, auto PR | 9 files, auto PR #4 | Not met (auto PR achieved) |

The target missed for three reasons: RUN4-1 was reduced, not fixed (the agent still has to emit Prettier-exact text); a failure type no projection anticipated cost shell.js (RUN5-6); and quality was projected on the assumption that newly committed files would score like run-4's, while they carried 7 of the 14 failures. With Git.js and shell.js committed, run-5 would have had 11 files, inside the target range. The PRD's success criterion 1 (Q×F ≥ 10 with the fix, > 6.7 without) is met only on its fallback branch.

### Run-6

Run-5's lesson for projections: newly committed files brought half the per-file failures, so more files does not mean the same quality. The projections below assume new files score near run-5's level.

### Conservative (no fixes land; LLM varies)

- Files committed: 8–10 (Git.js and shell.js may or may not commit, by attempt luck)
- Quality: about 75–80% on run-5's rule set; SCH stays low while RUN5-1 through RUN5-3 are open
- Q×F: about 6.5–7.5
- Cost: about $6–7

### Target (LINT/NDS-003 remainder and the SCH-002 lexical check fixed)

- Files committed: 12–13 (adds Git.js, shell.js, and some of GitBase.js and npm.js)
- Quality: about 75–80%, since the newly committed files carry the credential-value and un-awaited-return patterns found in their dumps
- Q×F: about 9–10
- Cost: about $6–8 (fewer attempts wasted on failed files, which cost $2.91 in run-5)

### Stretch (target plus schema-fidelity fixes and the pre-scan entry-point fix)

- Files committed: 13–15 (adds `lib/index.js` and possibly `lib/cli.js`)
- Quality: about 85–90%
- Q×F: about 11–13
- IS: 100/100 with a single-root trace

---

## §11. Run-5 Metrics at a Glance

| Metric | Run-5 | Run-4 | Run-3 |
|--------|-------|-------|-------|
| Quality | 21/27 (78%); 18/24 (75%) shared | 24/25 (96%); 23/24 shared | 25/25 (100%) |
| Gates | 5/5 | 5/5 | 5/5 |
| Files committed | 9 | 7 | 3 |
| Files failed | 4 | 6 | 2 |
| Correct skips | 10 (8 confirmed, 2 questionable) | 10 | 10 |
| Spans committed | 33 | 20 | 6 |
| New schema keys | 13 | 8 | — |
| Attempts (all files) | 28 | 26 | — |
| Cost | $6.55 | $6.97 | $1.59 |
| Duration | 1h 17m 24s | 1h 25m 35s | about 50 min |
| Push/PR | YES / auto PR #4 | YES / manual PR #3 (E2BIG) | YES / manual PR #2 |
| Q×F | **7.0** (6.8 shared) | 6.7 | 3.0 |
| IS | 100/100 (18 spans, 10 traces) | 100/100 (9 spans) | 90/100 |
| Advisory contradiction rate | 100% (18 sites) | 56% (PR body only) | 7% |

Run-5's 18 IS spans and run-4's 9 are not strictly comparable. Run-5 used a modified dry-run command (`--dry-run --ci --no-npm --git.requireCleanWorkingDir=false`), because the original command stops at release-it's npm login check. Run-4's command was never recorded. Run-5's 18 also under-count what ran by at least one (RUN5-4, `comment_on_resolved_items`).

---

## Audit Exclusions

A cross-document audit checked this handoff against all ten run-5 artifacts and returned 47 rows: 28 missing items, 5 figure mismatches, and 14 eval-process items. All 5 mismatches were corrected: three here (the 764ms attribution in RUN5-4, the RUN27-3 run count in RUN5-1, the factory.js import line in §3) and two at their source (`run-summary.md`'s run-4 cost and token label; `baseline-comparison.md`'s matching sentences). Of the 28 missing items, 27 were added. The items below were left out on purpose.

- **Run-2 metrics row** (24/25, gates 4/5, 0 files after rollback, $5.69). Run-2 committed nothing, so it adds no comparison point for the spiny-orb team; the cross-run table is in `baseline-comparison.md`.
- **Eval-process items** (eval-side, tracked in `lessons-for-run6.md` or already applied in the run-5 evaluation, and outside what the spiny-orb team can act on): the IS scoring command change and the need to record it; the IS bootstrap flushing only on SIGTERM and SIGINT, with its verification step (RUN5-4 names it as the likely cause and says the eval owns it); `set -o pipefail` in the template instrument command; the run-log tracking policy; the live-progress script's attempt under-count; CodeRabbit review variance on an unchanged head; Datadog showing booleans as quoted strings, so SCH-003 types come from the OTLP export; the fork's leftover OTel devDependencies and symlink at pre-run; the IS filter details (18 of 26 spans in window, one Datadog retry, no tag or release created, attempt 2 stopping at the clean-tree check); the rubric-scoring reconciliations (COV-002/COV-006 PASS-to-N/A, CDQ-011's cited source, run-4's CDQ-003 label, `owner`/`repository` treated as non-nullable under exemption-scope item 11).
