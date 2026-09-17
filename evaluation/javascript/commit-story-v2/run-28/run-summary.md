// ABOUTME: Run-28 summary — results, fix verification, file outcomes, and key findings.
# Run-28 Summary

**Date**: 2026-09-17
**Duration**: 1h 16m 9.4s (per spiny-orb's own "Completed in" line — no overnight interactive-prompt pause this run)
**Branch**: `spiny-orb/instrument-1789648132789`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/95 (auto-created ✅)
**spiny-orb**: built from main pre-run; RUN27-4 (CDQ-007) fix confirmed merged (`5a0636c` "add import-free path fallback for CDQ-007", plus follow-up CodeRabbit-finding fixes `0180486`/`dc59703`) and issue #1035 closed (`089ba6a` removed it from ROADMAP.md Short-term). No RUN27-3 (SCH-003, #1037)-specific commit found on spiny-orb main since 2026-09-16, and #1037 is confirmed still-live in this run's own committed output (see Fix Verification below).

---

## Results

| Metric | Value |
|--------|-------|
| Files committed | 12 |
| Files failed | 0 |
| Files partial | 1 (`src/commands/summarize.js`) |
| Correct skips | 19 |
| Files seen | 32 |
| Model | claude-sonnet-4-6 |
| Tokens | 181.8K input / 297.1K output (422.7K cached) |
| Cost | $7.23 |
| Live-check | OK (730 spans, 5597 advisory findings — see `spiny-orb-live-check-report.json`) |

---

## Fix Verification

| Item | Expected (per D-13) | Result |
|------|----------|--------|
| RUN27-1 (COV-003): `summary-manager.js` partial-commit recurrence | FIXED — expect PASS | **✅ CONFIRMED FIXED** — all 14 functions instrumented, 9 spans, full SUCCESS (2 attempts). No COV-003 rejection. |
| RUN27-2 (SCH-002): `summarize.js` key-reuse contradiction (`dates_requested`/`dates_count`) | FIXED — expect PASS | **⚠️ VALIDATOR CAUGHT IT, BUT AGENT STILL MADE THE MISTAKE** — the agent reused `commit_story.summary.dates_requested` for a week value (line 435) and a month value (line 523) after first declaring it for "dates" (line 330), same pattern as run-27. This time the SCH-002 check **fired and rejected the reassembly**, forcing the file to PARTIAL (3 spans instead of the intended 7, 3 attempts) rather than silently committing the semantic violation. The validator-level fix is working — it is now catching this exact pattern — but agent generation behavior hasn't changed, so the practical outcome (a partial file) is new, not a full pass. |
| RUN27-3 (SCH-003): `String(x.length)` vs int-typed key | Still open — expect recurrence | **❌ CONFIRMED RECURRING, UNCAUGHT** — `src/commands/summarize.js` (the committed instrument branch) sets `commit_story.summary.months_generated_count` and `commit_story.summary.months_failed_count` (both `type: int` in `semconv/agent-extensions.yaml`) via `String(result.generated.length)` / `String(result.failed.length)`. Verified directly against `git show spiny-orb/instrument-1789648132789:src/commands/summarize.js` — this is live in the committed/partial output, not just a discarded attempt. No SCH-003 rejection fired for it (only SCH-002 fired, for the unrelated `dates_requested` reuse) — the validator gap is confirmed still open, not merely unverified. (An earlier version of this table incorrectly reported "no recurrence observed" — corrected after a CodeRabbit review caught the discrepancy against the debug-dump file; see git history.) |
| RUN27-4 (CDQ-007): raw-path pattern (7 files, missing `basename` import) | Still open — expect recurrence | **✅ RESOLVED — via an inline fallback, not a per-file `basename` import.** Every path-like attribute this run (`journal-manager.js`'s `saveJournalEntry`, `index.js`'s `savedPath`) is sanitized using an inline `.split(/[\/]/).filter(Boolean).pop()` pattern instead of importing `basename`. Confirmed on spiny-orb main: `5a0636c` "add import-free path fallback for CDQ-007" (plus two CodeRabbit-finding follow-ups). This is the "shared representation" run-27's handoff asked for — the fix works without a per-file import, so it should generalize automatically to future files rather than needing 7 individual patches. |
| RUN27-5 (Watch, unrubriced): correct type, wrong registered key | Watch — third instance would strengthen the case | Pending per-file evaluation — `journal-manager.js`'s prior `quotes_count`/reflections mismatch needs re-checking against this run's actual code. |
| journal-graph.js | Eleventh consecutive success expected | **✅ CONFIRMED** — committed, 4 spans, 2 attempts. |

---

## File Outcomes (committed + partial only — full per-file evaluation pending)

| File | Result | Spans | Attributes | Attempts | Notes |
|------|--------|-------|------------|----------|-------|
| src/collectors/claude-collector.js | ✅ committed | 1 | 0 | 1 | |
| src/collectors/git-collector.js | ✅ committed | — | — | — | No SCH-003/String() issue found |
| src/generators/journal-graph.js | ✅ committed | 4 | 0 | 2 | 11th consecutive success |
| src/managers/journal-manager.js | ✅ committed | — | — | — | Path sanitized inline (CDQ-007 fix confirmed) |
| src/managers/summary-manager.js | ✅ committed | 9 | 1 | 2 | **RUN27-1 RESOLVED** — all 14 functions instrumented |
| src/commands/summarize.js | ⚠️ **partial** | 3 | 4 | 3 | **RUN27-2 validator catch** — SCH-002 rejected `dates_requested` reuse for weeks (line 435) and months (line 523). **Also RUN27-3 recurrence** — `months_generated_count`/`months_failed_count` (int-typed) set via `String(...)`, uncaught |
| src/utils/summary-detector.js | ✅ committed | 9 | 4 | 1 | No SCH-003/String() issue found (checked directly against source) |
| src/managers/auto-summarize.js | ✅ committed | 3 | 4 | 1 | |
| src/index.js | ✅ committed | 2 | 1 | — | `savedPath` sanitized inline via CDQ-007 fallback |

Remaining committed/skipped files not yet itemized here — full breakdown belongs in `per-file-evaluation.md` per the PRD's canonical methodology.

---

## Key Findings

### RUN27-1 (COV-003) confirmed fixed

`summary-manager.js` committed cleanly across all 14 functions in 2 attempts — no partial-commit regression. This closes the two-run-open finding from run-25/run-27.

### RUN27-2 (SCH-002) validator fix is working, but only catches the mistake after it happens

The agent reused `commit_story.summary.dates_requested` for weeks and months, reproducing run-27's exact error. Unlike run-27 (where this reuse silently committed), the SCH-002 check fired at reassembly time and rejected the file, forcing a partial commit. This is progress — the validator gap that let a wrong-meaning reuse slip through is closed — but it doesn't yet prevent the agent from generating the mistake in the first place, so `summarize.js` is now a partial file where it previously fully committed (with a latent semantic bug). Worth flagging to the spiny-orb team as a partial win: validator correctly blocks, but a corresponding prompt-level fix to stop the agent from proposing the bad reuse would convert this from PARTIAL back to a clean SUCCESS.

### RUN27-4 (CDQ-007) resolved via inline fallback — the shared-representation fix run-27 asked for

Confirmed on spiny-orb main (`5a0636c`) and via this run's log: every path attribute is now sanitized using an inline split/filter/pop pattern rather than importing `basename` per-file. This directly matches run-27's own handoff recommendation to commit to a fix that "applies automatically to all future files" rather than a per-file patch. This lowers 8th-instance risk relative to a per-file `basename` import, since the agent no longer needs a new import to sanitize a path — but it is still a per-call-site pattern the agent must choose to apply, not a structurally enforced helper; a future file could still emit a raw path if the agent skips the inline sanitization step. Not zero risk, just lower.

### RUN27-3 (SCH-003) — confirmed still open, uncaught in the committed output

`summarize.js`'s committed instrument-branch source sets `commit_story.summary.months_generated_count` and `commit_story.summary.months_failed_count` — both declared `type: int` — via `String(result.generated.length)` and `String(result.failed.length)`. This is the exact RUN26-1/RUN27-3 pattern recurring a third time, in a third file. Unlike RUN27-2 (SCH-002), no validator check caught this one — the file's only rejection was for the unrelated `dates_requested` key reuse. No spiny-orb commit specific to issue #1037 was found on main since 2026-09-16, consistent with this being a genuinely unfixed gap rather than a fixed-but-untriggered one.

**Correction note**: this section originally (and the Fix Verification table row above) claimed "no recurrence observed," based on a log-only check that missed this instance because it never appears in `spiny-orb-output.log`'s narrative text — it only shows up in the actual committed source. A CodeRabbit CLI review of this PRD branch caught the discrepancy by cross-checking `debug-dumps/src/commands/summarize.js` directly. Lesson for `lessons-for-prd29.md`: fix-verification greps against the log's prose are not sufficient for SCH-003 — the committed/debug-dump source itself must be checked for every file touching a registered int-typed key.

### No overnight prompt pause this run

Total duration 1h 16m matches the actual instrumentation work — no `PROGRESS.md` `[a]ccept/[e]dit/[s]kip` pause or push-confirmation stall (D-7's failure shape from runs 26/27 did not recur).

---

## Caveats on This Write-Up

This `run-summary.md` was reconstructed **after the fact** — the instrument run itself completed on 2026-09-17 ~08:32-09:45 without the PRD's "Collect skeleton documents" or "Pre-run verification" milestones having been completed first (the run happened out of order relative to the PRD's own sequencing). As a result:
- The Datadog pre-run/post-run health checks, push-auth dry-run, and live "is this stalled" monitoring described in the PRD's Pre-run Verification and Evaluation Run milestones were **not performed** — they cannot be done retroactively.
- `trace-artifact.md`'s pre-run `service.instance.id` capture was skipped for the same reason. Post-run Datadog verification can still be attempted going forward.
- Fix-status verification above is based on: (1) direct inspection of `spiny-orb-output.log`'s prose, (2) `git log` on spiny-orb main since 2026-09-16, (3) `git show`/direct reading of the committed instrument-branch source for files touching a registered key, and (4) the `debug-dumps/` source for the partial file. This is a reasonable substitute for the PRD's structured pre-run verification checklist but is not identical to it — and (1) alone was insufficient for SCH-003, per the correction above; (3)/(4) were required to catch it.
