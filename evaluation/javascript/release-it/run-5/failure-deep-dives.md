# Failure Deep-Dives: Run-5

**Run-5 result**: 9 committed, 4 failed, 0 partial, 10 correct skips. PR #4 created automatically.

Evidence sources for every claim below: `spiny-orb-output.log` (agent thinking, agent notes, validator messages), the unedited files under `debug-dumps/lib/` (the agent's rejected output), the original files on release-it `main`, and spiny-orb source at SHA `a55bd92` (`~/Documents/Repositories/spinybacked-orbweaver-main`). Where the log does not record something, the section says so instead of inferring.

| File | Failure | Attempts | Run-4 | Root cause in one line |
|------|---------|----------|-------|------------------------|
| lib/plugin/GitBase.js | LINT | 3 | failed (LINT) | An original line sits exactly at the 120-character limit, so the span wrapper's extra indent forces a line break that NDS-003 penalises. The agent chose to ship the long line and treated LINT as advisory. |
| lib/plugin/git/Git.js | LINT | 3 | committed (10 spans) | Same mechanism: one 117-character `log.warn` line becomes 121 characters inside the wrapper. |
| lib/plugin/npm/npm.js | NDS-003 ×4 | 2 | failed (NDS-003 ×26) | The agent added `await` to original `return` lines to get correct span timing, and NDS-003 does not allow that. It also hand-reformatted lines Prettier wanted split. |
| lib/shell.js | SCH-002 | 3 | committed (2 spans) | SCH-002's meaning-consistency check compares variable names lexically and treats `cacheKey` and `command.join(' ')` as different concepts, though they are the same value. |

---

## Run-Level Observations

### RUN4-1 (LINT/NDS-003 indentation-width conflict): reduced, mechanism intact

Three of the five run-4 blocked files now commit (GitHub.js, GitRelease.js, prompt.js). Two still fail on the same mechanism (GitBase.js, npm.js), and Git.js now fails on it too. The mechanism is unchanged: the `startActiveSpan` wrapper adds 4 spaces of indent (two levels of 2), and any original line within 4 characters of Prettier's 120-character print width must be split to pass LINT.

What spiny-orb `a55bd92` does about it: NDS-003 runs both the original and the instrumented code through Prettier before comparing (`prettierNormalizeForComparison` in `src/languages/javascript/rules/nds003.ts`). That makes NDS-003 tolerant of pure reformatting. It does not reformat the agent's output. The agent still has to produce Prettier-compliant text itself, guided by the LINT failure's diff. So whether a file commits depends on the agent getting the formatting exactly right within its attempt budget, which is why the same file can commit in one run and fail the next (Git.js).

### The Prettier diff in the LINT feedback is hard to act on

For Git.js the diff in the log is about 90 lines to communicate a one-line problem: after the first hunk, every following line appears as a `-`/`+` pair even though the text is identical. For GitBase.js the diff is cut off (`... (diff truncated)`) before it reaches the end of the file. The one real difference is in the first eight lines. The agent's attempt-2 notes show it coping (it isolated the single real change), but this feedback format is a plausible contributor to attempts being spent on formatting. The log records only the last attempt's diff, so the exact text shown to the agent on earlier attempts is not verifiable.

### RUN4-3 (COV-003 `Promise.reject`): the fix fired, contradicting `run-summary.md`

`run-summary.md` (provisional) said RUN4-3 was "not observed" because shell.js failed on SCH-002 instead. The log shows otherwise. spiny-orb source now treats `return Promise.reject(err)` as error propagation (`src/languages/javascript/rules/cov003.ts` line 230). In shell.js attempt 1, COV-003 flagged the inner `catch (err) { debug(err); return Promise.reject(err); }` for not recording the exception, and the agent's attempt-2 thinking shows it reading that failure and adding `recordException`/`setStatus` inside that catch. The dump has both calls in that catch. So the mechanism fired: the validator recognized the rejection as propagating and required error recording on it. shell.js did not commit, so the evidence is limited to the log and the dump. That evidence is enough to correct the run-summary claim, and `run-summary.md`'s RUN4-3 row now carries the corrected verdict.

### RUN4-4 (SCH-002 cross-domain duplicate): still not evidenced as fixed

The SCH-002 failure in this run is a different check (same-key meaning consistency, not semantic duplication against the registry). It is analysed under shell.js below. GitLab.js committing this run is not evidence of a fix.

### Un-awaited returns inside `try`/`finally` (CodeRabbit lead): confirmed in the dumps, but not the cause of the failures

The defect is real. In each dump, an un-awaited promise is returned inside `try { ... } finally { span.end(); }`, so `span.end()` runs before the promise settles, and a rejection from that promise is never seen by the span's `catch`:

| Dump | Location | Code |
|------|----------|------|
| GitBase.js | `getRemoteUrl`, line 133 | `return this.isRemoteName(...) ? this.exec(...).catch(...) : remoteNameOrUrl` |
| GitBase.js | `getSecondLatestTagName`, line 210 | `return this.exec(...).catch(() => null)` |
| npm.js | `getLatestRegistryVersion`, line 245 | `return this.exec(...).catch(() => null)` |
| shell.js | `execFormattedCommand`, line 48 (cache-hit path) | `return this.cache.get(cacheKey)`, which returns the cached promise stored by the un-awaited `this.cache.set(cacheKey, result)` |
| shell.js | `execFormattedCommand`, final return | `return result`, where `result` is the promise from `execStringCommand`/`execWithArguments` |

The hypothesis to test was "the agent kept the original `return` lines to avoid NDS-003 and hit LINT or NDS-003 elsewhere". The evidence does not support it as the cause of any of the four failures:

- **GitBase.js**: the agent's thinking never mentions span-end timing for `getRemoteUrl` or `getSecondLatestTagName`. It kept those returns because they are ternaries or call chains it judged uncapturable. The LINT failure comes from the opposite edit: converting `getCommitsSinceLatestTag`'s `return this.exec(...)` into `const result = await this.exec(...)` to record an attribute.
- **npm.js**: the agent did not keep the originals. Its notes say `bump()` and `publish()` use `return await` "so span.end() fires after the async operation settles". That is exactly the edit NDS-003 rejects (the flagged line 73 is `return this.spinner.show({ task, label: 'npm version' });`). For `getLatestRegistryVersion` it kept the un-awaited return and wrote that "the span ends correctly in the finally block", which is wrong for timing. The agent applied its timing rule inconsistently inside one file.
- **shell.js**: the un-awaited `return result` is original code the agent did not touch. SCH-002 failed for a separate reason.

What the evidence does confirm from run-4's notes: adding `await` to an original `return` is an NDS-003 violation. npm.js proves it in run-5. So run-4's stated constraint holds, and an agent that prioritizes correct span timing over NDS-003 loses the file.

Validator coverage: I searched `cdq001.ts`, `cov004.ts`, and `nds003`/`nds004`/`nds005`/`nds006`/`nds007` for await, settle, or un-awaited handling and found none. No rule in the files I checked flags a span that ends before its returned promise settles. I did not read every rule file, so this is "none found", not "none exists".

The dumps stay unedited as evidence, per the Decision Log.

### Sensitive command strings in span attributes: no rule covers it

The shell.js dump sets `release_it.shell.command` to `cacheKey` (line 36) and to `command.join(' ')` (line 99). `cacheKey` is the full command line, including whatever arguments release-it passes to git, npm, and hook commands. Those can carry credentials or tokens. CDQ-007 (`src/languages/javascript/rules/cdq007.ts`) works from a list of sensitive identifier names (`password`, `username`, `email`, and similar) and path-shaped identifiers. It checks what the value expression is called, not what the value contains, and neither `cacheKey` nor `command` is on its list. So nothing would stop this attribute from shipping. Worth noting for contrast: in npm.js the same rule did steer the agent away from recording `username` (agent notes say it matched a CDQ-007 key exactly).

The same gap shows in Git.js: the dump sets `release_it.git.push_repo` from `pushRepo` (lines 223 and 308). `pushRepo` may be a remote name or a URL, and a URL can embed credentials. Nothing checks that either. npm.js has a third case: the dump records `release_it.npm.registry` from `registry` (lines 243 and 372), and a registry URL can also embed credentials. GitBase.js and Git.js add a fourth case: the dumps set `vcs.repository.url.full` from `remoteUrl` (GitBase.js line 28, Git.js line 72). That value comes from `git remote get-url`, and a remote URL can embed a token when a remote is configured that way. Nothing checks it either. Because shell.js, GitBase.js, Git.js, and npm.js never committed, PR #4 does not contain these attributes (the `vcs.repository.url.full` mentions in the committed `.instrumentation.md` files are agent prose, not code). The gap is a finding about the validator, not about the shipped PR. It would surface the moment shell.js commits.

### Attempt budget

Failed files consumed 11 of the run's 28 agent attempts (GitBase 3, Git 3, npm 2, shell 3). The other 17 went to committed files. Nearly 40% of attempts produced no committed output.

---

## lib/plugin/GitBase.js: LINT, 3 attempts

**Failure**: `LINT check failed: the original file was Prettier-compliant but the instrumented output is not.`

**What the dump shows**: two lines exceed 120 characters. Line 59 (138 characters) is the problem. Line 187 (128 characters) is not: it is an original template literal (original line 114, also 128 characters) that Prettier cannot break and that was already in the Prettier-compliant original.

**Mechanism**: original line 38 is ``return this.exec(`git rev-list ${ref} --count ...`, { options }).then(Number);`` at exactly 120 characters. Inside the span wrapper it gains 4 spaces of indent and is 124 characters even unchanged. The agent additionally turned `return` into `const result = await` to capture a count attribute (`release_it.git.commits_since_tag`), which brought it to 138. Prettier needs it split as:

```javascript
const result = await this.exec(`git rev-list ${ref} --count ${commitsPath ? `-- ${commitsPath}` : ''}`, {
  options
}).then(Number);
```

**Attempt sequence (from the log)**:
1. Attempt 1: LINT failure, per the agent's attempt-2 thinking ("The only failing check is LINT").
2. Attempt 2: the agent applied Prettier's split. The log records no error text for this attempt.
3. Attempt 3: the agent's thinking says "the NDS-003 failure was flagged because a modified line was missing from the original code". That reads as attempt 2 failing NDS-003 after the split, but the log never prints attempt 2's validator output, so this is an inference from the agent's own summary.

Then the agent's attempt-3 reasoning: "I realize the Prettier note is just a soft suggestion, not the hard validator requirement... So I'll keep the original exec line untouched and not worry about Prettier reformatting it later." Its final agent note repeats it: the over-length line is "accepted as a known trade-off". LINT is a blocking check, so that trade-off lost the file.

**Two contributing causes**:
- **Structural**: a 120-character original line cannot survive a 4-space indent under Prettier. Something has to give, and the agent could not find a form that satisfied both checks.
- **Agent misreading**: the agent classified LINT as advisory. Nothing in its visible feedback told it otherwise, since the failure text says only that the output is not Prettier-compliant. Whether the prompt states that LINT blocks is not verified here. `src/agent/prompt.ts` and the feedback builder would need reading to say.

**Open question for the spiny-orb team**: does NDS-003 accept Prettier's split form of this line? The log suggests attempt 2 failed NDS-003 after applying it, which would mean the normalization does not cover this case (a return converted to a `const` capture plus a call split across lines). A reproduction against `a55bd92` would settle it.

**Run-4 comparison**: failed for the same LINT reason. Not a regression, and no progress on this file.

---

## lib/plugin/git/Git.js: LINT, 3 attempts (regression)

**Failure**: same LINT message as GitBase.js. Run-4 committed this file with 10 spans and 4 attributes, so the loss is 10 spans.

**What the dump shows**: line 326 is 121 characters:

```javascript
this.log.warn(`An error was encountered when trying to rollback the tag on the remote: ${tagError.message}`);
```

The original file has no line over 120. This line was within the limit before instrumentation and crosses it at the wrapper's added indent. Prettier wants it broken across three lines.

**What the agent did**: attempt-2 thinking identifies exactly this line and says it will apply the diff. Attempt 3's thinking in the log is cut short (it lists six entry points and stops), and the final dump still has the long line. The log does not show why attempt 3 reverted, so I cannot say whether the agent hit NDS-003 on attempt 2 or simply regenerated the file without the fix. The visible agent notes for this file say nothing about Prettier at all, unlike GitBase.js.

**Why this is a regression and what it says about run-to-run stability**: run-4's Git.js committed with the same original code. The difference is which formatting the agent produced within its attempts. This is the clearest example in the run that the LINT/NDS-003 conflict is a probability, not a fixed property of a file.

**What the dump also shows**: the return-value capture edits in this file (`return await new Promise(...)` to `const result = await new Promise(...)`, `return options !== false && (await isGitRepo())` to a `const result` capture, `return Boolean(branch)`) are the three original lines changed. They were accepted by NDS-003 on the attempt whose validator output the log shows, since the final failure is LINT only. That is consistent with the return-value-capture exception in `nds003.ts` (around line 138) covering `const x = ...; return x` rewrites.

---

## lib/plugin/npm/npm.js: NDS-003 ×4, 2 attempts

**Failure**: four NDS-003 violations. The log prints only the first message ("original line 73 missing/modified: `return this.spinner.show({ task, label: 'npm version' });`") followed by the generic NDS-003 boilerplate repeated four times, so lines for the other three are not recoverable from the log.

**What the dump shows**: a whitespace-insensitive diff against the original (`diff -w`) finds six original lines changed:

| Original line | What the agent did | Category |
|---------------|--------------------|----------|
| `const { name, version: latestVersion, private: isPrivate, publishConfig } = readJSON(...)` | split across five lines | Prettier-forced reformat |
| ``const task = () => this.exec(`npm version ...`, ...)`` | split across two lines | Prettier-forced reformat |
| `const match = Object.entries(distTags).find(...)` | split across lines | Prettier-forced reformat |
| `return this.spinner.show({ task, label: 'npm version' });` | `return await this.spinner.show(...)` | Adds `await` (the flagged line 73) |
| `return this.exec([publishPackageManager, 'publish', ...args], {` | `return await this.exec(...)` | Adds `await` |
| `return Object.keys(tags).filter(...)` | changed (return-value capture) | Return-value capture |

The validator reported four. NDS-003 normalizes through Prettier, so the three pure-reformat rows should normalize away, which leaves the last three rows as candidates for the four violations. The log does not confirm this mapping, so treat it as the likely account, not an established one.

**Attempt sequence**: attempt 2's thinking says the failure was Prettier and lists the destructuring and `task` arrow lines as the fix. The agent notes end with two "Formatting fix" entries (destructuring, `Object.entries().find()`). Then the final result failed NDS-003, not LINT. The formatting edits addressed the LINT failure. The first reported NDS-003 violation is the added `await` on line 73, and the cause of the other three is not fully mapped (see the table above). So the agent moved from a LINT problem to an NDS-003 problem, but the log does not show that the hand reformatting itself caused any of the four violations.

**The `await` decision**: the agent's notes say it wrote `return await` in `bump()` and `publish()` so `span.end()` fires after the operation settles. That is correct span behaviour and it is an NDS-003 violation, which is the same trade-off run-4's GitBase agent declined to make. In `getLatestRegistryVersion` it made the opposite choice. See the run-level section.

**Run-4 comparison**: NDS-003 violations dropped from 26 to 4. That is progress on RUN4-1 for this file, most likely from the Prettier-normalized comparison. The residual four come from `await` insertions and capture rewrites rather than from formatting.

---

## lib/shell.js: SCH-002, 3 attempts (regression)

**Failure**: `SCH-002 check failed: declared attribute extension "release_it.shell.command" is used with an inconsistent value source at line 99 ("command") — it was first used with "cacheKey" at line 36, a different concept.` Run-4 committed this file (2 spans, 0 attributes).

**Attempt sequence**:
1. Attempt 1: COV-003 on the inner `catch` that returns `Promise.reject(err)`, and NDS-005 on a `throw error` in an outer catch the agent had added (from the agent's attempt-2 thinking). See RUN4-3 above.
2. Attempt 2: the agent removed the outer catch and added error recording to the original catch. It also dropped `command` from `execWithArguments` and introduced `release_it.shell.program` instead, to avoid the value-source problem it had anticipated. Per the agent's attempt-3 thinking, `release_it.shell.program` was then flagged as a duplicate of `release_it.shell.command`.
3. Attempt 3: the agent restored `release_it.shell.command` on both spans and failed on the meaning-consistency check.

**Root cause**: SCH-002's same-pass check (`src/languages/javascript/rules/sch002.ts`, the loop over `acceptedExtensionKeys`) compares the base identifier feeding each `setAttribute` call for a key. It passes when the two identifiers share a token (`sharesToken`). Here the identifiers are `cacheKey` (line 36) and `command` (from `command.join(' ')`, line 99). They share no token, so the rule reports "a different concept".

They are the same value. Line 32 of the dump is `const cacheKey = typeof command === 'string' ? command : command.join(' ');`, so for the array case `cacheKey` is defined as `command.join(' ')`. The validator's own message does not tell the agent that, and the agent's attempt-3 thinking shows it had noticed the equivalence ("`cacheKey`... computed the same way") and still could not satisfy the rule, because `cacheKey` does not exist in `execWithArguments`.

**Classification**: false positive from a lexical check. The rule's stated goal (catch a key reused for two concepts, such as `dates.length` versus `weeks.length`) is sound. The failure mode is that a local alias for the same expression looks like a different concept.

**What the agent could have done**: use a different key per function (`release_it.shell.command` on one, a separately named key on the other). It tried `program` for that, and the semantic-duplicate check rejected it against `command`. Of the spellings the agent tried, none satisfied both checks while recording the command in both functions. One spelling was never tried: assigning `command.join(' ')` to a local named `cacheKey` inside `execWithArguments`, which would share an identifier with the other site. Whether that would pass is untested. The agent's final note says nothing about this conflict.

**Un-awaited return**: `execFormattedCommand` ends `return result` inside `try`/`finally` with `result` an un-awaited promise, so the span ends before the shell call completes. This is original code and is independent of the SCH-002 failure.

**Sensitive command strings**: see the run-level section. This attribute is the concrete case.

---

## What This Deep-Dive Could Not Establish

- The validator output for GitBase.js attempt 2 and Git.js attempt 2, and the attempt-3 reasoning for Git.js. The log records only the final attempt's failures and truncates the agent's thinking.
- Which four of the six changed npm.js lines produced the four NDS-003 violations.
- Whether the agent's prompt states that LINT is a blocking check.
- Whether NDS-003's Prettier normalization accepts the split form of a return-value-capture line. This needs a reproduction against spiny-orb.

These belong in the handoff document as questions for the spiny-orb team, not as findings.
