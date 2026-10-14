### 10. managers/summary-manager.js (9 spans, 3 whole-file + 1 function-level attempts)

All nine exported async functions have a `startActiveSpan` span: `readDayEntries`, `saveDailySummary`, `generateAndSaveDailySummary`, `readWeekDailySummaries`, `saveWeeklySummary`, `generateAndSaveWeeklySummary`, `readMonthWeeklySummaries`, `saveMonthlySummary` and `generateAndSaveMonthlySummary`. The five synchronous formatters and boundary helpers have no span, and neither does the unexported async helper `_hasRealSummary`. The three whole-file attempts failed (1: SCH-002 ×3, NDS-005 ×1, NDS-007 ×1; 2: SCH-002 ×11; 3: SCH-002 ×2, NDS-005 ×1, NDS-007 ×1). The file then committed through a fourth, function-level pass (14/14), so Prettier reformatted the whole file. Neither the `.instrumentation.md` nor `spiny-orb-output.log` records any agent thinking or pre-instrumentation analysis for this file. The log block holds only the function list, the schema extensions, and fallback notes, so the 16 SCH-002 rejections cannot be diagnosed. The agent added six keys: `commit_story.journal.entries_count`, `force`, `week`, `daily_summaries_count`, `month` and `weekly_summaries_count`. It also reused the registered keys `entry_date` and `file_path` and the extension keys `entry_action` and `errors_count`. A token-level comparison is clean. The evaluating agent ran Prettier (`--single-quote --trailing-comma none`) on the original and then ran `diff -w` against the instrumented file. Every removed line comes back as a re-wrapped call or return object, and no original token changed. Of the 50 `setAttribute` calls, 8 have expensive values and all 8 are guarded. The basename fallback is now applied at 6 of 7 `file_path` sites. The seventh (line 721) sets a raw path that is repo-relative at every production call site.

| Rule | Result |
|------|--------|
| NDS-003 | PASS — Prettier on the original followed by `diff -w` against the instrumented file shows that the only lines that differ are instrumentation (import line 20, tracer line 22, nine `startActiveSpan` wrappers, `setAttribute` calls, `isRecording()` guards, the defined-value guards `date != null` at line 54 and `result != null && result.errors != null` at line 236) and Prettier re-wraps. The re-wraps are calls such as `saveWeeklySummary(...)` at lines 515-520 and `readMonthWeeklySummaries(...)` at lines 781-784, and the one-line return objects (for example lines 213-216). Trailing commas and `e =>` → `(e) =>` also changed. Per exemption-scope.md item 5, that is fallback reflow and is not scored. No identifier, literal or statement in original code changed. |
| NDS-004 | PASS — all 14 exported functions keep their names, parameters, defaults (`basePath = '.'`, `options = {}`), `export async` and `export` forms, and return values. The parameter lists are Prettier-wrapped only (for example `saveDailySummary` at lines 138-143). |
| NDS-005 | PASS — every original try/catch is intact and in its original order: `_hasRealSummary` (lines 31-36, untouched), `readDayEntries` inner try (lines 71-76), `readWeekDailySummaries` (lines 347-355), and both in `readMonthWeeklySummaries` (lines 613-618, 635-643). No original try/catch was merged, moved or restructured. The NDS-005 errors on attempts 1 and 3 do not reproduce in the committed code. |
| NDS-006 | PASS — the agent added an ESM `import { SpanStatusCode, trace } from '@opentelemetry/api'` (line 20) and matched the file's existing `import` style. |
| NDS-007 | PASS — the expected-condition catches (`err.code === 'ENOENT'` at lines 74, 353, 616 and 641, plus the bare `catch { return false; }` in `_hasRealSummary` at line 34) contain no span calls. Each `recordException`/`setStatus` sits in an agent-added outer catch that rethrows. |
| API-001 | PASS — the only OTel import is `@opentelemetry/api` (line 20). |
| API-004 | PASS — no SDK-internal imports. |
| COV-001 | PASS — all nine exported async entry points have spans (lines 50, 144, 197, 332, 418, 469, 604, 713, 758). |
| COV-002 | N/A — the file makes no outbound HTTP, database, queue or LLM-client calls of its own. LLM work goes through commit-story's own `generateDailySummary`/`generateWeeklySummary`/`generateMonthlySummary` (lines 235, 509, 801). |
| COV-003 | PASS — in all nine spans, a throw from `readFile`, `writeFile`, `readdir`, `ensureDirectory`, `getWeekBoundaries`/`getMonthBoundaries` or the generators reaches an outer catch that calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` before rethrowing (for example lines 91-94 and 274-277). |
| COV-004 | **FAIL** — `_hasRealSummary` (line 30) is `async`, does `await readFile(...)`, and has no span. It is not an RST-001 sync utility and does not call `process.exit()`, so the implemented rule flags it. The validator emitted a COV-004 advisory at line 30. The function-level fallback extracts exported functions only (exemption-scope.md rule-fit item 10), so the path that committed this file could not have spanned it. |
| COV-005 | PASS — every span carries at least one domain attribute. Read spans carry `entry_date`/`week`/`month` plus a count. Save spans carry `file_path` and `entry_action`. Pipeline spans carry `entry_date`/`week`/`month`, `force`, the input count, `entry_action` and `errors_count`. |
| COV-006 | PASS — the file calls `node:fs/promises` `readFile`/`writeFile`/`readdir` directly, which `@opentelemetry/instrumentation-fs` covers. No manual span wraps a single fs call. Each span wraps a multi-step function (path computation, existence check, parse or write). (Reading pending reconciliation items 1 and 10.) |
| RST-001 | PASS — the five synchronous pure functions (`formatDailySummary` line 108, `getWeekBoundaries` line 294, `formatWeeklySummary` line 382, `getMonthBoundaries` line 571, `formatMonthlySummary` line 669) have no span. |
| RST-002 | N/A — the file has no getters, setters or trivial accessors. |
| RST-003 | PASS — no spanned function's original body is a single delegating `return`. All nine are multi-statement (path computation plus I/O, or a read → generate → format → save pipeline). |
| RST-004 | PASS — all nine spans sit on exported functions. The one unexported function, `_hasRealSummary`, has no span. |
| RST-005 | PASS — the original file had no instrumentation. |
| SCH-001 | PASS — all nine span names are registered in `semconv/agent-extensions.yaml` (lines 152-197, for example `span.commit_story.journal.read_day_entries`). They follow the `commit_story.journal.<op>` pattern. |
| SCH-002 | PASS — every key names the concept it holds. `entry_date` holds the day's date, `file_path` holds the journal or summary file name or path, `entry_action` holds the action taken, and `errors_count` holds the generator error count. The six new keys hold exactly what they name: entries read for a day, the force flag, the ISO week string, daily summaries read for a week, the month string, and weekly summaries read for a month. None fails the specific-wrong-noun test. `file_path`'s brief ("Output file path for the journal entry") is generic enough to cover summary files. |
| SCH-003 | PASS (confirm against OTLP export) — int keys receive raw numbers: `entries_count` (lines 79, 89, 222), `daily_summaries_count` (360, 493), `weekly_summaries_count` (647, 785) and `errors_count` (237, 540, 832, all `.length`). The boolean key `force` receives `Boolean(options.force)` (lines 203, 423, 474, 718, 763). String keys receive strings: `entry_date`, `file_path`, `week`/`month` (identifier or `String(...)` of a string), and `entry_action` literals. No count or boolean is cast to a string. |
| SCH-004 | PASS — delimiter-split Jaccard >0.5 candidates for the six new keys were all cleared as distinct concepts. `entries_count` vs `errors_count`/`quotes_count`/`reflections_count`/`word_count` scored 0.67 each, and vs `daily_summaries_count`/`weekly_summaries_count` 0.57. `daily_summaries_count` vs `weekly_summaries_count` scored 0.71, and both scored 0.57 vs the other `*_count` keys. `force`/`week`/`month` scored 0.60 against each other and `commit_story.journal.sections`. Every pair counts or names a different thing. `registry.commit_story.journal` also matched, but it is a group id, not a key. Below the threshold, `week`/`month` vs `commit_story.summarize.weeks_count`/`months_count` (count vs label) and `daily_summaries_count` vs `commit_story.summarize.generated_count` were also checked, with no duplicate concept. |
| CDQ-001 | PASS — each of the nine spans has exactly one `span.end()`, in `finally` (for example lines 95-97 and 847-849). Every `return` inside a span's `try` returns a resolved value (`[]`, `entries`, `null`, `summaryPath`, an object literal), never an un-awaited promise. |
| CDQ-002 | PASS — `trace.getTracer('commit-story')` (line 22) matches `package.json#name`. |
| CDQ-003 | PASS — all nine catches use `recordException(error)` followed by `setStatus({ code: SpanStatusCode.ERROR })`. No ad-hoc error attributes are set. |
| CDQ-005 | PASS — all nine spans use the `tracer.startActiveSpan` async-callback form, and each callback's promise is returned. |
| CDQ-006 | PASS — 8 expensive sites, 8 guarded, 0 unguarded (lines 56, 64, 150, 156, 262, 428, 535, 827, all inside `if (span.isRecording())`). The other 42 `setAttribute` values are literals, identifiers, property accesses, `Boolean(options.force)`/`String(weekStr)`/`String(monthStr)`, or `(result.errors \|\| []).length`, which contains no call. The full list is under Fix verification. |
| CDQ-007 | PASS — no person name or email is set. Six of seven `file_path` sites apply the basename fallback. The seventh, line 721 in `saveMonthlySummary`, sets raw `summaryPath` = `join(basePath, 'journal', 'summaries', 'monthly', 'YYYY-MM.md')`. Every production call chain passes `basePath = '.'`, so the value is the repo-relative `journal/summaries/monthly/YYYY-MM.md`. That matches the registry example for the key. No nullable value is set without a guard. `date` at line 58 sits behind `date != null` (line 54), and `result.errors` at line 237 sits behind `result != null && result.errors != null`. |
| CDQ-011 | PASS — the single `getTracer` literal is `'commit-story'`, which is the canonical name on the branch. |

**Failures**:
- COV-004 fails for `_hasRealSummary` (line 30), an unexported async helper that reads a file and has no span. The function-level fallback cannot instrument unexported functions, so once the three whole-file attempts failed, this span could not ship.

**Unrubriced findings**:
- `entry_date` is computed two ways in one trace. `generateAndSaveDailySummary` sets it from `getDateString(date)` (line 202), which is the local calendar date. `readDayEntries` (line 58) and `saveDailySummary` (line 152) set it from `new Date(date).toISOString().split('T')[0]`, which is the UTC calendar date. For a local-midnight `Date` in a timezone east of UTC, the child spans record the previous day while the parent records the correct day. US Central local midnight maps to the same UTC day, so the default environment hides this.
- The instrumentation adds a throw path. `new Date(date).toISOString()` at lines 58 and 152 throws `RangeError` on an Invalid Date. The original code built a `NaN-NaN` path without throwing: `readDayEntries` then hit ENOENT and returned `[]`, and `saveDailySummary` wrote to that path. The throw happens only when the span is recording. This matches exemption-scope.md rule-fit item 9.
- `entry_action` uses different values for the same action. `saveWeeklySummary` sets `'created'` (line 444), while `saveDailySummary` (line 171) and `saveMonthlySummary` (line 733) set `'saved'` for the same successful write.
- `commit_story.journal.file_path` carries two formats. Six sites record a basename. Line 721 records a repo-relative path, so a query that groups by the key sees mixed formats.
- Two early-return paths omit the count attribute. The ENOENT early returns in `readDayEntries` (line 74) and `readMonthWeeklySummaries` (line 616) return `[]` without setting `entries_count`/`weekly_summaries_count`. The empty-content path does set `entries_count` to 0 (line 79).
- `summarize.js` (processed after this file) reuses this file's new keys for a different concept. Its instrumentation notes say `daily_summaries_count` and `weekly_summaries_count` "capture how many summaries were generated", while this file uses them for summaries read as generator input. Score that under `summarize.js`'s SCH-002 row.
- The fallback reformatted the whole file with Prettier: re-wrapped imports and calls, trailing commas removed, arrow parameters parenthesized. This is not scored and is carried for the PR artifact evaluation.
- There are no un-awaited returns inside a span's try/finally and no `vcs.ref.head.revision` sites in this file.

**Other implemented-rule observations**: None.

**Rule-fit issues**:
- **COV-004 and the fallback.** COV-004 fired correctly at line 30, but the function-level fallback extracts exported functions only, so nothing on the commit path could act on it (item 10).
- **CDQ-007 advisories.** Of the seven advisories in the instrumentation report, only line 721 concerns a path. The other six (lines 89, 222, 360, 493, 647, 785) are very likely the nullable-member-access sub-check firing on `.length` of values that are always arrays (`entries`, `summaries`, `dailySummaries`, `weeklySummaries`). The rendered text talks about PII and filesystem paths, which sends a reviewer looking for a leak that does not exist (item 8).
- **COV-006 inconsistent across batch 1.** Batch-1 sections differ on direct `fs` calls: `claude-collector.js` scored PASS and `journal-paths.js` scored N/A. This section follows the PASS reading. The reconciliation pass should settle one reading.
- **New throw path.** The `toISOString()` throw is the shape rule-fit item 9 describes. No rule catches it.

**Fix verification**:

RUN28-1 (CDQ-006): fixed for this file. Every `setAttribute` in the file is listed below by its call line. The count is 50 calls: 8 expensive and 42 exempt. All 8 expensive sites are guarded, so 0 are unguarded and there is no fixer miss to explain.

| Line | Function | Key | Value | Expensive? | Guarded? |
|------|----------|-----|-------|-----------|----------|
| 56 | readDayEntries | entry_date | `new Date(date).toISOString().split('T')[0]` | yes (`.split` call) | yes (line 55) |
| 64 | readDayEntries | file_path | `entryPath.split(/[\\/]/).filter(Boolean).pop() ?? ''` | yes | yes (63) |
| 79 | readDayEntries | entries_count | `0` | no | n/a |
| 89 | readDayEntries | entries_count | `entries.length` | no | n/a |
| 150 | saveDailySummary | entry_date | `new Date(date).toISOString().split('T')[0]` | yes | yes (149) |
| 156 | saveDailySummary | file_path | `summaryPath.split(...).filter(Boolean).pop() ?? ''` | yes | yes (155) |
| 165 | saveDailySummary | entry_action | `'skipped'` | no | n/a |
| 171 | saveDailySummary | entry_action | `'saved'` | no | n/a |
| 202 | generateAndSaveDailySummary | entry_date | `dateStr` | no | n/a |
| 203 | generateAndSaveDailySummary | force | `Boolean(options.force)` | no (trivial) | n/a |
| 209 | generateAndSaveDailySummary | entry_action | `'skipped_existing'` | no | n/a |
| 222 | generateAndSaveDailySummary | entries_count | `entries.length` | no | n/a |
| 224 | generateAndSaveDailySummary | entry_action | `'skipped_no_entries'` | no | n/a |
| 237 | generateAndSaveDailySummary | errors_count | `result.errors.length` | no | n/a (defined-value guard 236) |
| 250 | generateAndSaveDailySummary | entry_action | `'skipped_existing'` | no | n/a |
| 260 | generateAndSaveDailySummary | entry_action | `'saved'` | no | n/a |
| 262 | generateAndSaveDailySummary | file_path | `String(path).split(...).filter(Boolean).pop() ?? ''` | yes | yes (261) |
| 336 | readWeekDailySummaries | week | `String(weekStr)` | no (trivial) | n/a |
| 360 | readWeekDailySummaries | daily_summaries_count | `summaries.length` | no | n/a |
| 422 | saveWeeklySummary | week | `String(weekStr)` | no | n/a |
| 423 | saveWeeklySummary | force | `Boolean(options.force)` | no | n/a |
| 428 | saveWeeklySummary | file_path | `summaryPath.split(...).filter(Boolean).pop() ?? ''` | yes | yes (427) |
| 437 | saveWeeklySummary | entry_action | `'skipped'` | no | n/a |
| 444 | saveWeeklySummary | entry_action | `'created'` | no | n/a |
| 473 | generateAndSaveWeeklySummary | week | `weekStr` | no | n/a |
| 474 | generateAndSaveWeeklySummary | force | `Boolean(options.force)` | no | n/a |
| 480 | generateAndSaveWeeklySummary | entry_action | `'skipped_existing'` | no | n/a |
| 493 | generateAndSaveWeeklySummary | daily_summaries_count | `dailySummaries.length` | no | n/a |
| 498 | generateAndSaveWeeklySummary | entry_action | `'skipped_no_data'` | no | n/a |
| 523 | generateAndSaveWeeklySummary | entry_action | `'skipped_existing'` | no | n/a |
| 533 | generateAndSaveWeeklySummary | entry_action | `'saved'` | no | n/a |
| 535 | generateAndSaveWeeklySummary | file_path | `String(path).split(...).filter(Boolean).pop() ?? ''` | yes | yes (534) |
| 540 | generateAndSaveWeeklySummary | errors_count | `(result.errors \|\| []).length` | no (no call) | n/a |
| 608 | readMonthWeeklySummaries | month | `String(monthStr)` | no | n/a |
| 647 | readMonthWeeklySummaries | weekly_summaries_count | `summaries.length` | no | n/a |
| 717 | saveMonthlySummary | month | `monthStr` | no | n/a |
| 718 | saveMonthlySummary | force | `Boolean(options.force)` | no | n/a |
| 721 | saveMonthlySummary | file_path | `summaryPath` | no (identifier) | n/a |
| 726 | saveMonthlySummary | entry_action | `'skipped'` | no | n/a |
| 733 | saveMonthlySummary | entry_action | `'saved'` | no | n/a |
| 762 | generateAndSaveMonthlySummary | month | `monthStr` | no | n/a |
| 763 | generateAndSaveMonthlySummary | force | `Boolean(options.force)` | no | n/a |
| 769 | generateAndSaveMonthlySummary | entry_action | `'skipped_existing'` | no | n/a |
| 785 | generateAndSaveMonthlySummary | weekly_summaries_count | `weeklySummaries.length` | no | n/a |
| 790 | generateAndSaveMonthlySummary | entry_action | `'skipped_no_data'` | no | n/a |
| 815 | generateAndSaveMonthlySummary | entry_action | `'skipped_existing'` | no | n/a |
| 825 | generateAndSaveMonthlySummary | entry_action | `'saved'` | no | n/a |
| 827 | generateAndSaveMonthlySummary | file_path | `path.split(...).filter(Boolean).pop() ?? ''` | yes | yes (826) |
| 832 | generateAndSaveMonthlySummary | errors_count | `(result.errors \|\| []).length` | no (no call) | n/a |

Each row's line is the `span.setAttribute(` call line. A multi-line call's value expression sits two lines below it, so the `entry_date` value at line 56 is the expression on line 58 that the CDQ-007 row and the unrubriced findings cite. "Guarded?" gives the `if (span.isRecording())` line. Defined-value guards such as `date != null` (line 54) are separate and appear in the NDS-003 and CDQ-007 rows. Coordinator check (2026-10-14): lines 54-58 on the instrument branch confirm this layout.

The implemented checker's `isExpensiveValue` flags only call expressions and the `.map`/`.filter`/`.join`/`JSON.stringify` text patterns. That is why `(result.errors || []).length` at lines 540 and 832 is not expensive.

RUN28-2 (SCH-003): no recurrence in this file. Run-28's boolean-on-string key `commit_story.journal.summary_saved` no longer appears. The one boolean key, `force`, is declared `type: boolean` and receives `Boolean(options.force)` at five sites. All four int keys receive raw `.length` values or the literal `0`. No `String(count)`, template-literal count, or stringified boolean ships. This verdict comes from source (confirm against OTLP export).

RUN28-3 (CDQ-007): improved and passing. The basename fallback is applied at 6 of 7 sites, against 3 of 7 in run-28. All six fallback sites are also `isRecording()`-guarded.

| Line | Function | Value expression | Where the value comes from | Fallback? |
|------|----------|------------------|-----------------------------|-----------|
| 64 | readDayEntries | `entryPath.split(/[\\/]/).filter(Boolean).pop() ?? ''` | `getJournalEntryPath(date, basePath)` = `join(basePath, 'journal', 'entries', YYYY-MM, 'YYYY-MM-DD.md')`. Callers: `generateAndSaveDailySummary` line 221 and `summarize.js` line 212, with basePath `'.'` | yes |
| 156 | saveDailySummary | `summaryPath.split(...).filter(Boolean).pop() ?? ''` | `getSummaryPath('daily', date, basePath)`. Only caller: `generateAndSaveDailySummary` line 247 | yes |
| 262 | generateAndSaveDailySummary | `String(path).split(...).filter(Boolean).pop() ?? ''` | the return value of `saveDailySummary` (its `summaryPath`), non-null after the `if (!path)` return at line 249 | yes |
| 428 | saveWeeklySummary | `summaryPath.split(...).filter(Boolean).pop() ?? ''` | `getSummaryPath('weekly', monday, basePath)`. Only caller: `generateAndSaveWeeklySummary` line 515 | yes |
| 535 | generateAndSaveWeeklySummary | `String(path).split(...).filter(Boolean).pop() ?? ''` | the return value of `saveWeeklySummary`, non-null after line 522 | yes |
| 721 | saveMonthlySummary | `summaryPath` (raw) | `getSummaryPath('monthly', firstDay, basePath)` = `join(basePath, 'journal', 'summaries', 'monthly', 'YYYY-MM.md')`. Only caller: `generateAndSaveMonthlySummary` line 807, which forwards its own basePath. Its callers are `summarize.js` line 374 (basePath defaults to `'.'`, and `index.js` line 402 passes `basePath: '.'`) and `auto-summarize.js` line 196 (basePath `'.'` via `triggerAutoSummaries('.')` at `index.js` line 628 → `triggerAutoMonthlySummaries(basePath)` at line 88). `path.join` drops the leading `./`, so the production value is `journal/summaries/monthly/YYYY-MM.md`, which is repo-relative and matches the registry example. Only the tests pass an absolute `mkdtemp` directory (`tests/managers/monthly-summary-manager.test.js` lines 225-312). | no (PASS as repo-relative, inconsistent with the other six) |
| 827 | generateAndSaveMonthlySummary | `path.split(...).filter(Boolean).pop() ?? ''` | the return value of `saveMonthlySummary`, non-null after line 814 | yes |

**Run-28 comparison**: Run-28 committed the same nine spans in 2 attempts. It failed SCH-003 (`summary_saved` boolean on a string key), CDQ-006 (most sites unguarded) and CDQ-007 (fallback at 3 of 7 sites). Run-29 clears all three: no type casts, every expensive site guarded, and the fallback at 6 of 7 sites with the seventh repo-relative. Run-29 now fails COV-004 for `_hasRealSummary`, which run-28 also left unspanned but scored PASS under an exemption the implemented rule does not have. It also took 16 SCH-002 rejections across three whole-file attempts that cannot be diagnosed.

**Trace evidence (D-2 supplement)**: none. The post-run instance `a2a54d88-00c9-4a85-bc8a-64e11de35779` emitted 20 spans in one trace (`ae2d2354ca28cac29c9b79f1a2184be9`), all on the post-commit journal path, and `summary-manager.js` emitted nothing in it: `commit_story.summarize.trigger_auto` found 0 pending days, weeks, and months, so no summary was generated or saved. The RUN28-1 and RUN28-3 verdicts rest on source reading. No verdict in this section depends on live evidence.
