# Exemption-Scope Pre-Commitment — commit-story-v2 Run-29

Decided by the coordinating session on 2026-10-13, before the first per-file-evaluation batch, per the PRD #161 "Per-file evaluation" milestone. The PRD directs the session to make these interpretation calls itself and record them here. Every per-file agent reads this file and applies it to every section. A decision made here and not given to the agents does not count.

Sources:

- Research rubric: `docs/research/evaluation-rubric.md` in `~/Documents/Repositories/spinybacked-orbweaver-main` (at `475eb3d`, the commit run-29 was built from).
- Implemented rules: `src/languages/javascript/rules/<rule>.ts` and `docs/rules-reference.md` in the same checkout.
- Instrument branch: `spiny-orb/instrument-1791918832887` in `~/Documents/Repositories/commit-story-v2`, HEAD `860fcb13d0dcdba8ae387da833557f191b081fbc`. commit-story-v2 main at run time: `fa26743`.

Where the research rubric and the implemented rule disagree, score the implemented rule and record the drift under "Rule-fit issues for the handoff". The exception is a narrowing caused by what the validator can see rather than a design choice, such as RST-003 checking same-file delegation only. In that case, score the rubric's mechanism.

---

## Rows every committed or partial file's table carries

Each file table has one row per rule below, in this order. Write N/A with a reason when a rule has nothing to check. Never leave a row out.

NDS-003, NDS-004, NDS-005, NDS-006, NDS-007, API-001, API-004, COV-001, COV-002, COV-003, COV-004, COV-005, COV-006, RST-001, RST-002, RST-003, RST-004, RST-005, SCH-001, SCH-002, SCH-003, SCH-004, CDQ-001, CDQ-002, CDQ-003, CDQ-005, CDQ-006, CDQ-007, CDQ-011.

- **CDQ-011, not CDQ-008.** The rubric marks CDQ-008 deleted.
- **NDS-005 covers structural breakage (NDS-005a) only. NDS-007 covers recording on expected-condition catches**, which is the implemented replacement for the rubric's NDS-005b. Do not score one defect under both rows.
- **Implemented-only rules (CDQ-009, CDQ-010, RST-006) have no row.** If a file violates one, list it under an `**Other implemented-rule observations**` line below the table.
- Check each row against the canonical definition of its rule ID before writing it. Run-28's tables carried rows whose verdict was right but whose evidence came from a different rule (an "NDS-003" row that checked span names, a "CDQ-006" row that checked NDS-006's concern). The reconciliation pass audits every row for this.

---

## 1. CDQ-006: no entry-point exemption; only trivial conversions are exempt

**Ambiguity**: the PRD asks whether CDQ-006's isRecording-guard requirement is exempt for COV-001 entry-point spans whatever the computation costs, or only for cheap computations. The three sources disagree:

- The research rubric has no entry-point exemption. It exempts only trivial conversions (`toISOString()`, `String()`, `Number()`, `Boolean()`, `toString()`, simple property access chains).
- `docs/rules-reference.md` says "CDQ-006 does not apply to spans on COV-001 entry points" and adds that external source strings (API responses, file contents) must be guarded even with no transformation.
- The implemented checker (`cdq006.ts`) has neither. It flags any `setAttribute` value containing a function or method call, or matching `JSON.stringify`/`.map`/`.reduce`/`.filter`/`.join`/`.flatMap`, without an enclosing `if (span.isRecording())` or a preceding `if (!span.isRecording()) return;`. Its trivial list is `String`, `Number`, `Boolean`, `get*String`, `.to*String`, `.toJSON`, `.toFixed`, `.toPrecision`, `.valueOf`, and a trivial call only counts as trivial when its argument and receiver are not themselves expensive. The entry-point heuristic (`isInsideEntryPoint`) survives only as documentation, and the code comment says it is "intentionally not called". The auto-fixer `fixIsRecordingGuards` guards every expensive call, entry point or not.

**Decision**: the guard requirement applies at every span, including COV-001 entry points. Only the implemented trivial-conversion list and plain property access are exempt. An unguarded `setAttribute` whose value contains any other call or method chain is a CDQ-006 FAIL wherever it sits.

**Rationale**: this is the implemented rule, and it is the stricter of the two readings the PRD offered. Run-28 applied an entry-point exemption in some sections and not others because nobody had written it down. The implemented checker has no entry-point concept, so there is nothing to apply inconsistently. Because `fixIsRecordingGuards` runs before every validation attempt, any unguarded expensive call that shipped is either a fixer miss or an attribute set through a shape the fixer skips (a side-effectful receiver, for example). Say which in the row when the source makes it clear.

**Test for per-file agents to apply**: for each `span.setAttribute(key, value)`:

1. Is `value` a literal, an identifier, or a plain property access (`a.b.c`, `arr.length`)? Then it is exempt. PASS.
2. Is `value` a call to `String`/`Number`/`Boolean`, a `get*String` call, or a `.toISOString()`/`.toString()`/`.toJSON()`/`.toFixed()`/`.toPrecision()`/`.valueOf()` method call, whose argument and receiver are themselves exempt under step 1 or 2? Then it is exempt. PASS. A `new Date(<exempt>)` receiver also counts as exempt, because the implemented checker treats a `new` expression as non-expensive (clarified after batch 1). `String(entries.length)` is exempt. `String(entries.map(...).join(','))` is not.
   An expression with no call in it, such as arithmetic or a comparison over operands that are exempt under step 1 (`a.length + b.length`, `parsed.force === true`), is also exempt, because the implemented checker flags only call expressions (clarified after batch 3, rule-fit item 20).
3. Otherwise the value is expensive. It needs an enclosing `if (span.isRecording()) { ... }` then-branch, or an earlier `if (!span.isRecording()) return;` in the same block. Without one, FAIL. List every failing line.

The row states the count of guarded versus unguarded expensive sites. For `summary-manager.js` (RUN28-1), list every `setAttribute` in the file with its line and whether it is guarded, so the fix verification is complete rather than sampled.

---

## 2. SCH-003: judged from source this milestone; count casts and booleans as strings FAIL

**Sequencing**: `eval-traces-run29.json` does not exist until the IS scoring milestone. During per-file evaluation, compare each `setAttribute` value expression's type with the key's declared type in the instrument branch's `semconv/agent-extensions.yaml` or `semconv/attributes.yaml` (`git show spiny-orb/instrument-1791918832887:semconv/<file>`). Mark any verdict that depends on the runtime type with `(confirm against OTLP export)`. Datadog shows booleans as quoted strings, so it cannot settle a type question.

**Decisions** (carried from taze run-17, release-it run-5, and commit-story-v2 run-28):

- A count or length cast to a string (`String(x.length)`, `String(count)`, `` `${n}` ``) FAILs, including when the agent declared the key `type: string`. A count is an int however the schema declares it.
- A raw numeric value against an `int` key PASSES.
- A boolean literal or boolean expression set on a key declared `type: string` FAILs. This is run-28's `commit_story.journal.summary_saved` case. A boolean set on a `boolean` key PASSES.
- For an enum or string key, FAIL only if a non-string value (boolean, number, object) can reach the call on a reachable path. A string outside the listed members PASSES, because semantic-convention enums are open.
- spiny-orb PR #1097 (the count-cast fix for #1072 and #1037) is in this build. A count-cast site that still ships is a recurrence of RUN28-2. Say so in the row.

---

## 3. CDQ-007: checked per call site, from source

**Decisions**:

- **Structural guarantee per call site.** For a path-valued attribute, read each function that sets it and trace where its value comes from at each actual call site. Do not infer safety from a parameter or variable name. A value that is provably a basename or a repo-relative path PASSES. An absolute filesystem path on a key outside OTel's `file.*` namespace FAILs. `commit_story.*.file_path` keys are not `file.*` keys. For `summary-manager.js` (RUN28-3), list each `file_path` site with its line, its value expression, and whether the basename fallback (`path.split(/[\\/]/).filter(Boolean).pop() ?? ''` or an equivalent) is applied.
- **Person names are PII.** A key holding a person's name or email FAILs whatever it is called, which includes `commit_story.commit.author` (RUN28-4a). Check every call site of that key in `git-collector.js` and `context-integrator.js`, and grep the other committed files for it.
- **Nullable input is judged by the value's source** (release-it run-5, item 11). A value is nullable when its source allows `null` or `undefined` on a reachable path where the operation still proceeds. Such a value set without a defined-value guard FAILs.
- **Free-form strings that can carry credentials** (command lines, URLs, remotes) score on the literal mechanism, with an advisory note in the row naming the risk.
- **PII redaction on citation.** Any live-trace value quoted as evidence for a PII finding is written redacted (`<redacted-person-name>`, `<redacted-email>`) in the same edit that adds it. Agents return redacted text, and the coordinating session writes only redacted text.

---

## 4. `vcs.ref.head.revision: HEAD` is an unrubriced finding

**Ambiguity**: post-run traces show the literal string `HEAD` on `vcs.ref.head.revision` for `commit_story.cli.main`, `commit_story.context.gather_for_commit`, and `commit_story.git.get_previous_commit_time`. `index.js` defaults `commitRef` to `'HEAD'` (instrument branch line 66) and sets `span.setAttribute('vcs.ref.head.revision', String(commitRef))` (line 472). `context-integrator.js` sets the key from `commitRef` only (line 32). The semantic convention describes the attribute as the revision, a resolved commit in Git.

**Decision**: SCH-002 PASSES, because the key is the right registered key for a revision, and a symbolic ref is still a Git revision expression (gitrevisions(7)). SCH-003 PASSES, because the value is a string. CDQ-007 does not apply: the value is not PII, is bounded, and is never undefined after the `'HEAD'` default. Record each site as an **unrubriced finding** in the file's section, with the file, line, value expression, and the span it lands on. For `git-collector.js`, establish from source whether `get_previous_commit_time` sets the key itself or inherits the value through the caller's input.

**Rationale**: the defect is a data-quality problem (an unresolved ref where queries expect a SHA, including on `summarize` runs where no commit ref applies). None of the three rules that come close checks it, so a FAIL under any of them would stretch the rule. The gap goes on the rule-fit list.

---

## 5. Readings carried forward from release-it run-5 and taze run-17

These apply unchanged. Each one follows a precedent already scored, so none changes an earlier run's verdict.

- **COV-004** uses the implemented rule. It flags an `async` function, or a function containing `await`, that has no span and is not exempt (an RST-001 utility, or a direct top-level `process.exit()`). Synchronous functions are not flagged even when they call `fs.*Sync`.
- **RST-004**: methods of an exported class without a `#` or `_` prefix count as exported. Unexported functions whose I/O happens through a library or a wrapper qualify for the I/O exemption. RST-004 FAILs only for a span on a private method, or on an unexported function with no I/O.
- **RST-003** uses the rubric's mechanism across files. A span on a function whose body is a single delegating `return` FAILs when the callee, in any file, has its own span.
- **COV-003**: FAIL when a failable operation can throw out of the span callback with no `recordException` and `setStatus(ERROR)` on that path. Graceful inner catches that do not rethrow are NDS-007's concern, not COV-003's.
- **Un-awaited returns** inside a span's `try`/`finally`: CDQ-001 stays PASS. Record each site as an unrubriced finding (function, line, returned expression, and any span calls that run after `span.end()`).
- **NDS-003**: a token-identical reflow of an original statement is equivalent to re-indentation and PASSES. The Prettier reformatting of whole files committed through the function-level fallback (`index.js`, `git-collector.js`, `summary-manager.js`) is not a semantic change and is not scored as NDS-003. The PR artifact evaluation measures its share of the diff. A token change in non-instrumentation code (a renamed identifier, a changed literal, a removed statement) still FAILs.
- **SCH-002**: a registered key that names one concept and holds a different one FAILs (the "specific wrong noun" test). A generic key whose brief covers the value PASSES (the "generic reasonable term" test).
- **SCH-004**: compute delimiter-split Jaccard (split on `.` and `_`) for each agent-added key against every other registry key, including the other keys the same agent added. A score above 0.5 makes the pair a candidate. The pair FAILs only if the two keys hold the same concept. Record the candidates cleared.
- **COV-002 and COV-006** are N/A for a file with nothing the rule checks. COV-002 needs an outbound HTTP, database, queue, or LLM-client call site in the file's own code. COV-006 needs an operation that an auto-instrumentation library covers. Calls through commit-story's own modules do not count.
- **COV-005** passes if each span carries at least one meaningful domain attribute. Attribute identity varying between runs is normal.
- **A questionable skip is a handoff finding, not a COV-001 or COV-004 FAIL.** Coverage rules apply to instrumented files only. List a questionable skip in the "Correct Skips" section and carry it to the handoff.

---

## 6. Run-29 specifics from the failure deep-dives

- **`index.js` is scored as committed code.** Its partial is an NDS-005 false positive, and the committed file is byte-identical to the flagged reassembly, so both functions' spans shipped. NDS-005 for this file is judged from the source: PASS if the original try/catch in `getPreviousCommitTime` is intact.
- **`summary-graph.js` failed** and has no committed code. It gets no rule table. Its section records the D-3 `gen_ai.*` observations from the debug dump (`run-29/debug-dumps/src/generators/summary-graph.js`) and points to `failure-deep-dives.md`.
- **`journal-graph.js`**: record the D-3 `gen_ai.*` attributes per span (present, absent, or changed against run-28). Its agent notes say it dropped the response model and id attributes because "the validator treats added if statements as non-instrumentation code", so that absence is a validator interaction, not a model choice. D-3 is a watch item and is not scored.
- **Attempt counts**: the log's "3 attempts" omits a fourth function-level pass for `git-collector.js` and `summary-manager.js`. Record attempts as the deep-dive states them.

## 7. D-2 trace supplement readings

- **Provenance is labeled per trace, not per span.** The post-run instance `a2a54d88-00c9-4a85-bc8a-64e11de35779` emitted one trace, `ae2d2354ca28cac29c9b79f1a2184be9`, with 20 spans. Three spans (`get_commit_data`, `generate_sections`, `save_entry`) carry `vcs.ref.head.revision` equal to the instrument branch HEAD `860fcb13d0dcdba8ae387da833557f191b081fbc`. Three (`cli.main`, `gather_for_commit`, `get_previous_commit_time`) carry the literal `HEAD`, and 14 carry no revision. A span-by-span reading would label 17 spans "unknown provenance" even though they ran in the same process and trace as the matching three. The trace is labeled instrument-branch evidence as a whole, because its SHA-carrying spans match the instrument branch and none matches main (`fa26743`, which appears only as the `git.commit.sha` tag on every span). The `HEAD` values are scored as the item 4 finding, not as a provenance signal.
- **Resource prefixes follow the domain, not the file.** `commit_story.journal.*` spans come from `journal-graph.js`, `journal-manager.js`, `journal-paths.js`, and `summary-detector.js`. Each section was supplemented by its exact span names, mapped from `startActiveSpan` calls on the instrument branch, not by a prefix wildcard.
- **Coverage of the trace.** The hook path exercised sections 01, 02, 03, 04, 08, 09, 12, 13, and 14. Sections 05, 06, 07, 10, 11, and 15 got a "none" note saying why. No trace value contradicts a section verdict, so no row changed in this pass.

---

## Rule-fit issues for the handoff

Items found before the batches started. Agents and later passes add to this list.

1. **CDQ-006's documentation and implementation disagree** (item 1). `rules-reference.md` describes a COV-001 entry-point exemption and a guard requirement for external source strings. `cdq006.ts` implements neither, and its comment calls the entry-point heuristic "no longer load-bearing". The research rubric has the trivial-conversion exemption only. One of the three should change so the descriptions match.
2. **NDS-003's defined-value guard pattern has no optional-chaining support.** `if (result.response_metadata?.model != null)` around a single `setAttribute` is rejected, while `if (result.usage_metadata != null)` passes. This failed `summary-graph.js` (6 spans lost), and per the deep-dive it likely drove `context-integrator.js` and `journal-graph.js` to drop attributes rather than guard them. Reproduced in `nds003-repro.mjs` and `nds003-repro2.mjs`.
3. **NDS-005 compares a Prettier-normalized reassembly against the raw original.** It anchors on the first line of each try body, so a reformatted but intact try reads as missing. This caused `index.js`'s partial.
4. **No rule checks that a revision attribute holds a resolved revision** (item 4). `vcs.ref.head.revision: HEAD` passes SCH-002, SCH-003, and CDQ-007.
5. **The research rubric's NDS-003 filter list has drifted from the implemented rule** (carried from release-it run-5, rule-fit item 15). The implemented rule also accepts defined-value guards, `isRecording()` guards, return-value captures, and multi-line normalization.
6. **The research rubric still describes NDS-005b**, which the implemented rules replaced with NDS-007. Run-29 scores NDS-007 for that concern (see "Rows every committed or partial file's table carries").
7. **NDS-003's failure message prints a line number from text that exists only inside the validator** (found in batch 1, `summary-graph.js`). The message said "instrumented line 187", which numbers the stripped, Prettier-normalized text. The first failing guard is line 217 of the agent's output. Only the quoted line helps the agent find the problem (`failure-deep-dives.md`, "Open check 2").
8. **CDQ-007 advisories in the instrumentation report do not say which sub-check fired** (found in batch 1, `context-integrator.js`). Four nullable-member-access advisories (check 3) rendered with text about PII names and filesystem paths, which sends a PR reviewer looking for a leak that does not exist. Check 3 also cannot see that a callee's return shape guarantees the property, so it fires on values that are always defined.
9. **No rule checks that instrumentation adds no new throw paths** (found in batch 1, `claude-collector.js`). `new Date(x).toISOString()` inside the span's `try` throws `RangeError` on an Invalid Date, where the original code only made comparisons return false. Batch 2 confirmed it in `journal-manager.js` at lines 185, 376, and 379. An `isRecording()` guard makes the throw depend on sampling: line 185 throws only when the span is sampled, and lines 376 and 379 always throw.
10. **The function-level fallback extracts exported functions only, so unexported helpers lose their spans whenever a file falls back** (found in batch 1, `git-collector.js`). The JavaScript provider calls `extractExportedFunctions(sourceFile)` with no options (`src/languages/javascript/index.ts:305`), and `includeNonExported` defaults to false. COV-004 reported the four missing helper spans, but nothing on that path can act on the advisory.
11. **No rule checks that `gen_ai.*` request attributes sit only on spans where a model request is issued** (found in batch 1, `journal-graph.js`). Early-exit node spans claim a chat request that never ran. No rule considers wrapper spans that copy token usage already emitted by an auto-instrumented client span either.
12. **The log and run summary count attribute schema extensions, not `setAttribute` calls** (found in batch 2, `journal-paths.js` and `mcp/server.js`). `journal-paths.js` reports "0 attributes" for a span that sets `commit_story.journal.file_path`, and `server.js` reports 1 for a span that sets 2. Anyone scoring COV-005 from the log reads a gap that does not exist. The label should say what it counts.
13. **No rule checks that a registered attribute sits on a span whose operation matches the key's brief** (found in batch 2, `mcp/server.js`). `commit_story.context.source = 'mcp'` on the server-startup span passes SCH-002, which checks key meaning against value, not placement.
14. **No rule checks for long-lived resources created inside a short span** (found in batch 2, `mcp/server.js`). The stdin transport and its listener are created inside `commit_story.mcp.start_server`, which can parent later MCP tool-handler spans to a span that ended at startup. This matters only if the OTLP export confirms the parenting.
15. **PR #1097's name-based count correction covers only `_count` and `.count`** (found in batch 2, `context-capture-tool.js`). `correctExtensionType` (`src/validation/tier2/extension-types.ts` line 22) leaves a count-valued key named `_length`, `_size`, `_total`, or `_num` at the `string` default. `fixAttributeTypeCoercions` (`sch003.ts` lines 400-406) then wraps the numeric value in `String()`, and SCH-003 does not flag the result. This shipped `String(text.length)` on `commit_story.context.text_length` while the agent's notes called the key `(int)`.
16. **The implemented COV-001 and COV-004 do not see anonymous async callbacks passed as arguments** (found in batch 2, `context-capture-tool.js`). The MCP tool handler passed to `server.tool(...)` is a request handler that the research rubric's COV-001 and COV-004 both describe. The implemented pre-scan finds only exported async functions and `main`, and `cov004.ts` walks only declarations, assigned arrows, and methods. Run-27 had a span here, and run-29 does not. Scored PASS under the implemented rule, pending the reconciliation decision on whether this is a visibility narrowing (reconciliation item 9).
17. **No rule checks that a derived value agrees with how the application computes the same concept** (found in batch 2, `journal-manager.js`). `commit_story.journal.entry_date` takes a UTC date from `toISOString()` while the entry file is named from local-time date parts, so a late-evening commit west of UTC reports the next day. Right key and right type, so SCH-002 and SCH-003 both pass. `summary-manager.js` computes `entry_date` both ways in one trace: local time on `generateAndSaveDailySummary` (line 202) and UTC on its children `readDayEntries` (line 58) and `saveDailySummary` (line 152).
18. **CDQ-007 check 3 does not recognize a `!= null` guard on the accessed member** (found in batch 2, `journal-manager.js`). `if (commit.hash != null)` guards `commit.hash`, but check 3 looks for a guard on the receiver `commit`, so the guarded value still produces an advisory. This extends item 8.
19. **SCH-002's semantic-dedup judge is inconsistent across files in one run** (found in batch 3, `auto-summarize.js`). It rejected `commit_story.summarize.weeks_count` and `months_count` as duplicates for `auto-summarize.js` (attempt 2 thinking: "months_count is flagging as a duplicate of weeks_count") and for `summary-detector.js`, then accepted both keys, plus `generated_count` and `failed_count`, for `index.js` one file later (registry diff `f1a09fa` to `a5f5ae2`). `rules-reference.md` says Jaccard is disabled on extension acceptance to avoid false positives on sibling attributes, yet a sibling pair counting different periods was rejected, apparently by the LLM judge stage. The rejection cost `auto-summarize.js` two attempts and its month-level attributes, and the rejection messages survive only in agent thinking, so the keys behind 6 of its 9 rejections cannot be recovered.
20. **Item 1's CDQ-006 test does not name non-call expressions** (found in batch 3, `auto-summarize.js`). Read literally, step 3 makes an arithmetic sum of property accesses (`a.length + b.length`) expensive. The decision text and `cdq006.ts`, which flags only call expressions, both treat it as exempt, and the section followed them. This is a gap in this file's wording, not in spiny-orb, and is recorded so the next run's exemption scope names arithmetic over exempt operands explicitly.
21. **spiny-orb's all-sync-exports early return runs against a pre-scan that does not exist on feedback turns** (found in batch 3, correct skips). In `src/agent/instrument-file.ts` the pre-scan runs only when no feedback message is set (line 164), so on a multi-turn fix `preScanResult` is `undefined`, and both guards on the early return (lines 238-240, `!preScanResult?.entryPointsNeedingSpans.length` and `!preScanResult?.asyncFunctionsNeedingSpans.length`) evaluate true. `reflection-tool.js` attempt 1 drafted a `saveReflection` span and hit NDS-003 ×1. Attempt 2 then returned the original code with the note "All exported functions are synchronous (registerReflectionTool) ... No LLM call made", and the file was counted as a correct skip while its report still carries a COV-004 advisory at line 65. This is a harness defect rather than a rule gap.
22. **The agent prompt's RST-004 text contradicts the implemented COV-004 and the RST-004 documentation** (found in batch 3, `summary-detector.js`). `src/agent/prompt.ts` line 272 says RST-004 takes precedence over COV-004 and tells the agent to instrument the exported orchestrator, not unexported helpers that perform I/O. `rules-reference.md` limits RST-004 to unexported functions that are not async and contain no I/O, and `cov004.ts` has no orchestrator exemption. The rendered COV-004 advisory (`src/validation/rule-names.ts` lines 101-105) also ends "context propagation covers unexported internal helpers". `summary-detector.js` lost four `readdir` helper spans citing this text, where run-28 spanned them under the same text.
23. **Agent-declared attribute keys get placeholder briefs, so nothing records what a reused key means** (found in batch 3, `summarize.js` and `summary-detector.js`). Every agent extension's brief is "Agent-discovered attribute: <key>". The SCH-002 tests have only the key name to judge against, and later files reuse a key for a different measure without any check noticing: `daily_summaries_count`/`weekly_summaries_count` hold summaries generated, read, and found; `dates_count` holds days, weeks, and months; `entries_count` holds days with entries and entries within one day. The semantic-dedup pressure in item 19 pushes agents toward this reuse.
24. **No rule checks that a failure exit returned without a throw sets span status ERROR** (found in batch 3, `index.js`). `handleSummarize` and `main` return `EXIT_ERROR` on several paths (lines 243, 248, 316, 384, 451, 498, 507, 512) with no span status. COV-003 and CDQ-003 look only at catch blocks.
