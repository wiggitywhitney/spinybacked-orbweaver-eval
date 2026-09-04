// ABOUTME: Run-27 summary — results, fix verification, file outcomes, and key findings.
# Run-27 Summary

**Date**: 2026-09-02
**Duration**: 21h 21m 7.7s (per spiny-orb's own "Completed in" line — dominated by an unattended overnight pause at an interactive `PROGRESS.md` update prompt, not active processing; see Key Findings)
**Branch**: `spiny-orb/instrument-1788361335787`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/94 (auto-created ✅)
**spiny-orb**: built from main (confirmed pre-run — v2.0.0, unrelated CLI/publish fixes only since run-26)

---

## Results

| Metric | Value |
|--------|-------|
| Files committed | 13 |
| Files failed | 0 |
| Files partial | 1 (summary-manager.js) |
| Correct skips | 18 |
| Files seen | 32 |
| Total spans (committed + partial) | 48 (corrected from an initially-reported 49 — see `context-capture-tool.js`'s row below) |
| New schema extension attributes | 14 |
| Model | claude-sonnet-4-6 |
| Tokens | 272.3K input / 356.1K output (515.2K cached) |
| Cost | $9.40 |
| Live-check | OK (663 spans, 4808 advisory findings — see spiny-orb-live-check-report.json) |

---

## Fix Verification

| Item | Expected | Result |
|------|----------|--------|
| RUN26-1: journal-manager.js SCH-003 — `reflections_count` emitted as `String(x.length)` against an int-typed key | FIXED | **✅ CONFIRMED (type), ⚠️ SEMANTIC MISMATCH (naming)** — verified via direct `git show` diff against run-26's instrumented source. Run-26 invented a new extension key `commit_story.journal.reflections_count` (declared `int`) and then broke its own contract with `String(reflections.length)`. Run-27 instead mapped the same value onto the pre-existing registered `commit_story.journal.quotes_count` (already `type: int` in `semconv/attributes.yaml`) and set it as a raw int with no wrapper — `span.setAttribute('commit_story.journal.quotes_count', reflections.length)`. SCH-003's *type* check passes. However, `quotes_count` is registered to mean the number of developer quotes extracted for an entry, not reflections — the count is a `discoverReflections` result mapped onto a semantically different registered key, a correct type on the wrong attribute. Improvement appears to be better registry-*type*-matching (avoiding an unnecessary new int-typed extension) rather than a validator fix for the `String()`-wrapping pattern itself — that pattern was avoided, not tested. Flagged for per-file evaluation to assess as a CDQ finding. |
| RUN26-2: journal-paths.js CDQ-007 — raw path, `basename` self-identified and not applied | FIXED | **❌ STILL UNRESOLVED** — agent's own thinking block reproduces the identical reasoning from run-26 verbatim in substance: "basename isn't already imported (only join and dirname are), I'll keep the raw value... flag it as a known limitation." Same pattern recurs in `journal-manager.js`'s own `file_path` attribute in this run too. spiny-orb issue #1035 remains open with no acceptance criteria checked, as predicted in pre-run verification. |
| Attribute-count undercounting | Watch | Not independently re-verified this run beyond pre-run check (issue #1036 still open, #1046 fixed dedup bugs but not the "new extensions vs total attributes" framing ask). Per-file evaluation should re-confirm for `context-capture-tool.js` and `journal-paths.js`/`journal-manager.js` (0 new-extension attrs despite active `setAttribute` calls on registered keys). |
| RUN21-6: Agent notes vs committed code divergence | Watch (7th run) | Pending per-file evaluation. |
| journal-graph.js | Tenth consecutive success expected | **✅ CONFIRMED** — committed, 4 spans, 3 attrs, ×3 attempts (matches run-26's attempt count exactly). |

---

## File Outcomes

| File | Result | Spans | New schema attrs | Attempts | Notes |
|------|--------|-------|-------|----------|-------|
| src/collectors/claude-collector.js | ✅ committed | 1 | 1 | 1 | New attribute `commit_story.context.repo_path` (extension); same raw-path/CDQ-007 self-flagged limitation as journal-paths.js |
| src/collectors/git-collector.js | ✅ committed | 6 | 2 | 2 | Improved vs run-26 (was 3 attempts, 0 new attrs) |
| src/generators/prompts/guidelines/accessibility.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/guidelines/anti-hallucination.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/guidelines/index.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/daily-summary-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/dialogue-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/monthly-summary-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/summary-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/technical-decisions-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/prompts/sections/weekly-summary-prompt.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/integrators/filters/message-filter.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/integrators/filters/sensitive-filter.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/integrators/filters/token-filter.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/integrators/context-integrator.js | ✅ committed | 1 | 0 | 1 | Reuses `repo_path` as a registered key (0 new extensions) once claude-collector.js declares it |
| src/logger.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/generators/journal-graph.js | ✅ committed | 4 | 3 | 3 | Tenth consecutive success; matches run-26's attempt count |
| src/generators/summary-graph.js | ✅ committed | 6 | 3 | 2 | Span and attempt counts match run-26; per-file evaluation found the attribute set itself changed (renamed/consolidated keys, dropped `section_type`/`gen_ai.request.temperature`) — not an exact instrumentation match |
| src/mcp/tools/context-capture-tool.js | ✅ committed | 2 (corrected from an initially-reported 3 — per-file evaluation confirmed only 2 `startActiveSpan` calls via direct source inspection) | 0 | 1 | Spans up vs run-26 (1→2, corrected from an initially-reported 1→3) |
| src/mcp/tools/reflection-tool.js | ✅ skip | 0 | 0 | 2 | RST-001 correct; matches run-26 |
| src/mcp/server.js | ✅ committed | 1 | 1 | 1 | Matches run-26 |
| src/traceloop-init.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/utils/commit-analyzer.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/utils/config.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/utils/failure-placeholder.js | ✅ skip | 0 | 0 | 1 | RST-001 correct |
| src/utils/journal-paths.js | ✅ committed | 1 | 0 | 1 | **RUN26-2 CONFIRMED STILL UNRESOLVED** — raw `filePath` used as-is; `basename` not imported |
| src/managers/journal-manager.js | ✅ committed | 2 | 0 | 1 | **RUN26-1 type mismatch CONFIRMED FIXED** — `quotes_count` set as raw int, not `String()`-wrapped. **New semantic failure found**: that int is a reflection count written into `quotes_count`, a key registered to mean developer-quote count — a correct type on the wrong attribute (see per-file evaluation) |
| src/managers/summary-manager.js | ⚠️ partial | 7 | 0 | 2 | **REGRESSION** — 2 functions rejected on COV-003 (Error Recording): "catch block does not record error on span." Rejected functions differ from run-25's pair (`readDayEntries`, `readMonthWeeklySummaries` here vs. run-25's `readWeekDailySummaries`, `readMonthWeeklySummaries`) — same failure shape (7/9), different functions. Run-26 had committed all 9 functions cleanly (RUN25-1 fix had held for one run). See `failure-deep-dives.md` for root cause. |
| src/commands/summarize.js | ✅ committed | 3 | 3 | 3 | Attempts up vs run-26 (2→3); new-attribute count down sharply (9→3) — reverses the run-24→25→26 climbing trend |
| src/utils/summary-detector.js | ✅ committed | 9 | 1 | 1 | Attempts improved vs run-26 (3→1); attribute count down (3→1) is known attribute-selection variance, not a failure — but per-file evaluation found two real rule failures in the committed code: SCH-003 (`weeks_count` declared `int`, emitted via `String(...)`) and CDQ-007 (raw `repo_path`, self-identified-and-declined `basename()` fix) |
| src/managers/auto-summarize.js | ✅ committed | 3 | 0 | 1 | Matches run-26 |
| src/index.js | ✅ committed | 2 | 0 | 1 | Matches run-26 |

---

## Key Findings

### RUN26-1 (SCH-003) type mismatch resolved, but a new semantic failure replaced it

Run-26 invented a brand-new schema extension key (`commit_story.journal.reflections_count`, self-declared `int`) and then violated its own contract by wrapping the value in `String()`. Run-27's agent instead reused the pre-existing registered `commit_story.journal.quotes_count` (already `type: int`) and set it directly with a raw int — the SCH-003 type mismatch is gone for this file. **This is not a clean fix**: per-file evaluation found `quotes_count` does not cover the same semantic value — it is registered to mean the number of developer quotes extracted from AI dialogue, while the code now stores an unrelated `discoverReflections()` count under that key. The type mismatch was avoided by picking a different, wrong key rather than resolved; the underlying gap (no check catching `setAttribute(key, String(...))` against numeric-typed keys) is unverified and, per per-file evaluation, recurs independently this run in `summary-detector.js`'s `weeks_count`. This semantic-mismatch finding is the primary RUN26-1-related handoff item, not a confirmation that RUN26-1 is closed.

### RUN26-2 (CDQ-007) still unresolved — same self-identified, unapplied fix

`journal-paths.js`'s agent output reproduces run-26's exact reasoning almost word-for-word: `basename` isn't imported, so the raw path is used and flagged as "a known limitation." The same pattern also appears in this run's `journal-manager.js` and `claude-collector.js` for their own path/string attributes — the constraint (no new non-OTel imports) is being applied consistently across files, but it means every file touching a raw path hits the same wall. Confirms spiny-orb issue #1035's characterization: the real gap is a PR-summary/prompt-guidance surfacing problem, not inconsistent agent behavior.

### New regression: summary-manager.js reverts to PARTIAL

Run-26 had confirmed all 9 exported async functions committing cleanly (RUN25-1 fix). Run-27 reverts to run-25's failure *shape* (7/9 functions committed) but not its exact pair: run-27 rejects `readDayEntries` and `readMonthWeeklySummaries`, while run-25 rejected `readWeekDailySummaries` and `readMonthWeeklySummaries` — both runs on COV-003 (Error Recording). `failure-deep-dives.md`'s source-level comparison resolves the "same behavior re-appearing vs. distinct new trigger" question: it's the same `isExpectedConditionCatch` validator gap identified in run-25, not a new bug. Direct comparison of the three ENOENT-handling functions in this file confirms run-25's theorized catch-shape split exactly — RUN25-1's "fix" in run-26 was never a fix, it was one run where none of this file's functions happened to use the flagged catch shape. This is the clearest quality regression of the run and should be the primary new handoff item alongside RUN26-1 confirmation.

### Overnight interactive-prompt pause is invisible in the piped log

The run's actual instrumentation work (all 32 files) completed in well under an hour; the 21h 21m total duration reflects an unattended `PROGRESS.md` update confirmation prompt (`[a]ccept/[e]dit/[s]kip`) that sat waiting for terminal input overnight. Critically, **the prompt text itself never appeared in `spiny-orb-output.log`** — piped through `tee`, the log jumps directly from `pushBranch: urlChanged=true...` to `Completed in 21h 21m 7.7s` with no trace of the interactive block in between. Checking the log alone during a live run gives no visibility into this kind of pause; only the process's low-but-nonzero CPU usage (observed via `ps`) hinted something was alive but blocked. This is a new instance of the same *shape* of problem D-7 already documents (an unattended run pausing at a live prompt looks like a hang) but via a different prompt (PROGRESS.md accept/edit/skip) than D-7's `Proceed? [y/N]` push confirmation. Worth cascading to `docs/language-extension-plan.md` step 3 alongside D-7, and to `lessons-for-prd28.md`.

### Attempt/attribute variance continues

`git-collector.js` and `summary-detector.js` both improved on attempts vs run-26 (3→2 and 3→1 respectively) while `summarize.js` got worse (2→3) with a sharp attribute drop (9→3). `context-capture-tool.js` gained spans (1→2, corrected from an initially-reported 1→3 by per-file evaluation's direct source inspection). No single clean trend line — consistent with runs 24-26's established attribute-selection variance pattern.

### Cost down vs run-26

$9.40 vs run-26's $11.15, despite one new partial-file retry cycle (summary-manager.js). Token usage also down (272.3K/356.1K vs 340.3K/411.1K input/output).

---

## vs Run-26

| Dimension | R27 | R26 |
|-----------|-----|-----|
| Files committed | 13 | **14** |
| Files failed | 0 | 0 |
| Files partial | **1** | 0 |
| Total spans (committed+partial) | 49 | 41 |
| New schema attrs | 14 | 19 |
| Multi-attempt files (≥2) | 6 (git-collector, journal-graph, summary-graph, reflection-tool [skip], summary-manager [partial], summarize) | 7 |
| Cost | **$9.40** | $11.15 |
| RUN26-1 (SCH-003) | ✅ Fixed | ❌ Present |
| RUN26-2 (CDQ-007) | ❌ Still present | ❌ Present |

Quality score, gates, and IS score pending rubric scoring and IS scoring milestones.

---

## Post-run Datadog verification (PRD #153 milestone)

**Corrected finding** (see `trace-artifact.md` for full detail): an initial check against `git.commit.sha` reported instrument-branch traffic as "not yet observed" — that was wrong. `git.commit.sha` on these spans is the *journaled* commit (domain data), not the running code's own branch identity, exactly as run-26's post-run note already established. Re-checked against `vcs.ref.head.revision` (the correct attribute): confirmed. Every incremental instrument commit from this run (`38dd870` HEAD, plus `8317536`, `b219e77`, `e0ca3ee`, `c5839a3`, `9b22db6`, `a2fdaf4`, `ce19b5c`, `5178302`, `39abd79`, and others) has matching spans in Datadog — direct evidence the local commit-story-v2 checkout, on the instrument branch, self-journaled its own commits during and after the eval run. `service.instance.id: 0cac1bed-f201-466a-b976-41f47c65d3bd`.

This PRD's milestone text and Decision D-6 both point at `git.commit.sha` for this check, which is what caused the initial false negative — flagged for correction in `lessons-for-prd28.md`.

Log-trace correlation check: ~85% of a 88-log sample (227 total logs since run start) carry non-empty `trace_id`/`span_id` — consistent with run-26's ~83% baseline, no pino-bridge regression.
