# PR Artifact Evaluation — Run-27

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/94
**Branch**: `spiny-orb/instrument-1788361335787`
**State**: OPEN

---

## Push Auth — Nineteenth Consecutive Automated Success

PR #94 auto-created cleanly with no manual recovery, unlike run-26 (manual recovery during a ~27.5-hour approval-prompt pause, see run-26 D-7). The apparent "stuck at pre-push hook" moment reported during live monitoring turned out to be the process correctly paused overnight at an interactive `PROGRESS.md` `[a]ccept/[e]dit/[s]kip` prompt — not a stall — resolving on its own once the prompt was answered. The fine-grained PAT continues to work without incident.

---

## PR Summary Quality

**Length**: 294 lines

### Accuracy Assessment

| Element | Accurate | Notes |
|---|---|---|
| Files processed: 32 / Committed: 13 / No changes needed: 18 / Partial: 1 | YES | Matches `run-summary.md` and `per-file-evaluation.md` exactly |
| Per-File Results table (14 rows: status, spans, attempts, cost, libraries, schema extensions) | Two inaccuracies | `context-capture-tool.js` is listed at 3 spans — per-file evaluation's direct source inspection later found only 2 `startActiveSpan` calls; the PR was generated before that correction existed, so this is a stale figure rather than a PR-generation defect. `summary-manager.js`'s status is listed as "partial (12/14 functions)" — the file has 9 exported async functions total, not 14, and per-file evaluation confirms the real split is 7/9 committed; unlike the span-count staleness, "12/14" corresponds to no real count at all, an actual PR-generation defect, not a since-corrected figure. All other 12 rows' span/attempt/cost figures match per-file evaluation exactly. |
| "No changes needed" file list (18 files) | YES | Matches the Correct Skips table in `per-file-evaluation.md`, including the questionable `reflection-tool.js` skip (see Advisory Findings Quality below) |
| Registry versions (Baseline 0.1.0 → Head 0.1.0) | Misleading | Same issue flagged in run-26: both versions are identical despite 14 new attributes and ~48 new span IDs being added this run. Not a spiny-orb defect to fix in this evaluation, but a reviewer skimming "0.1.0 → 0.1.0" would incorrectly conclude the schema didn't change. This is the second consecutive run with this exact discrepancy. |
| New Span IDs / New Attribute Extensions counts | YES | Summed directly from the PR body's own per-file listings: 48 span IDs + 14 attributes = 62, matching the sum of the Per-File Results table's "Schema Extensions" column exactly |
| Live-Check: OK (663 spans, 4808 advisory findings) | Not independently verifiable | No access to `spiny-orb-live-check-report.json` from this evaluation; as in run-26, the total advisory-finding count (4808) is far larger than the curated line-items surfaced in the PR body's "Advisory Findings" section (13 line-items across 12 files), confirming the PR shows only a filtered subset — the selection mechanism was not verified here |
| Token usage / cost ($9.40) | YES | Matches `run-summary.md`'s reported total exactly |

### Schema Changes Section

The Schema Changes section correctly reports additions-only (14 new attributes, ~48 new span IDs, registry version unchanged) but, as in run-26, has no mechanism to surface attribute-level *defects* found in this run. Two confirmed SCH-003 type mismatches shipped in this PR (`git-collector.js`'s `commit_story.git.diff_size` and `summary-detector.js`'s `commit_story.journal.weeks_count`, both declared `int` but emitted via `String(...)`) and neither appears anywhere in the Schema Changes section — a reviewer reading only this section would see 14 clean additions and have no way to know two of them ship with the wrong runtime type. This is the same structural gap identified in run-26's evaluation for `reflections_count`; it persists here for two different attributes in two different files, confirming it's a durable limitation of what the PR-generation step surfaces, not a one-off omission.

### Advisory Findings Quality

The PR summary includes 13 advisory line-items across 12 files. Assessment against `per-file-evaluation.md`'s independently-derived, CodeRabbit-reviewed canonical findings:

| Finding | Verdict | Notes |
|---|---|---|
| `claude-collector.js`, `context-integrator.js`, `journal-paths.js`, `summarize.js`, `summary-detector.js`, `auto-summarize.js` — CDQ-007 (raw path) | **Valid, but under-severed** | Per-file evaluation scored all six as canonical **FAIL** (self-identified-and-declined `basename()` fix), not the PR's uniform low-severity/advisory framing. Same under-calibration pattern as run-26's journal-paths.js finding — the PR's boilerplate treats a confirmed-shipped defect identically to routine advisory noise |
| `journal-graph.js` — CDQ-007 (lines 464, 525, 599) | **Incorrect** | Direct inspection of those lines (`git show <branch>:src/generators/journal-graph.js`) shows only `section_type`/`gen_ai.operation.name`/`gen_ai.request.temperature` attribute calls — no PII and no raw filesystem path at any of the three cited lines. Per-file evaluation independently scored this file's CDQ-007 **PASS** (all nullable values correctly guarded, `vcs.ref.head.revision` guarded with `?? ''`). False positive |
| `summary-graph.js` — SCH-001 (span name mismatch) | Valid, correctly non-blocking | Per-file evaluation confirms this fired in an earlier attempt and was resolved before commit; the advisory's presence in the PR reflects validator history during generation, not a defect in the committed code |
| `context-capture-tool.js` — CDQ-007 | Valid | Matches per-file evaluation's ADVISORY verdict for the same `commit_story.journal.file_path` attribute (correctly non-blocking — this file's path is not confirmed to leak an absolute value) |
| `reflection-tool.js` — COV-004 (missing span on `saveReflection`) | **Valid, and more serious than the PR frames it** | Per-file evaluation flags this exact line as a "questionable skip, not confirmed correct" — the file's own pre-instrumentation analysis identified `saveReflection` as needing a span, then the final code shipped with 0 spans anyway. The PR correctly surfaces the advisory but, since `reflection-tool.js` is listed under "No changes needed" with 0 spans, a reviewer has no signal that this is a self-identified-and-declined gap rather than a legitimate architectural exemption |
| `journal-manager.js` — CDQ-007 (raw path, ×3 lines) | Valid, correctly low-severity | Per-file evaluation scored this file's `file_path` attribute PASS-with-caveat: its sole call site hardcodes `basePath = '.'`, so the raw-path risk is structurally latent rather than live. The PR's advisory framing (low severity) happens to be correct here, unlike the six FAIL-worthy files above that get the same boilerplate |
| `journal-manager.js` — **`quotes_count`/reflections semantic mismatch** | **Missing entirely** | The one unrubriced-but-significant finding in this file (a correctly-typed int written to a key registered for a different concept — developer quotes vs. reflections) does not appear anywhere in the Advisory Findings section. No existing spiny-orb rule targets this failure mode, so there was nothing for the advisory generator to flag — the same structural blind spot as run-26's missing SCH-003 finding, but for a defect class no rule currently covers at all |
| `summary-manager.js` — COV-004 (async op missing span) | Valid, correctly non-blocking | Matches per-file evaluation's ADVISORY verdict for the 5 sync formatter helpers correctly exempt under RST-001 |
| `summary-manager.js` — CDQ-007 (raw path, ×17 lines) | **Valid, but under-severed** | Per-file evaluation scored this canonical FAIL (same self-identified-and-declined `basename()` pattern as the six files above) — the PR's advisory framing treats it as routine low-severity noise, giving no signal that this is the seventh instance of a confirmed, unresolved pattern |
| `summary-manager.js` — **COV-003 partial-commit regression** | **Not in Advisory Findings, and the one visible signal is itself wrong** | The PR's own Per-File Results table reports this file as "partial (12/14 functions)" — but the file has 9 exported async functions total, not 14, and per-file evaluation confirms 7 committed / 2 rejected (`readDayEntries`, `readMonthWeeklySummaries`). "12/14" doesn't correspond to any real count for this file; it's a PR-generation inaccuracy, not just an under-explained status line. A reviewer relying on this figure would misjudge both how many functions exist and how many shipped, on top of having no explanation for *why* the partial split happened without reading `failure-deep-dives.md` |
| **`git-collector.js` — SCH-003 (`diff_size` type mismatch)** | **Missing entirely** | Confirmed live via Datadog trace (`commit_story.git.diff_size: "2139"`, a quoted string against a declared-`int` key) — does not appear anywhere in the Advisory Findings section |
| **`summary-detector.js` — SCH-003 (`weeks_count` type mismatch)** | **Missing entirely** | Same failure class, confirmed live (`weeks_count: "11"` as a string against a declared-`int` key) at all three of the file's call sites — also entirely absent from Advisory Findings, despite `summary-detector.js` appearing twice in the section already (SCH-001, CDQ-007) |
| **`summarize.js` — SCH-002 (`dates_count` holds a week count on `runWeeklySummarize`)** | **Missing entirely** | The file declares `dates_count` for a date count on `runSummarize`, then reuses the same freshly-declared key for a week count on `runWeeklySummarize` within the same instrumentation pass — not surfaced anywhere in Advisory Findings, despite `summarize.js` appearing once already (CDQ-007) |

**Advisory contradiction rate**: 1 of 13 line-items is outright incorrect (`journal-graph.js`'s CDQ-007, a false positive on lines that contain no PII or path data) — roughly **8%**, sharply better than run-26's SCH-004-driven 44% and run-11/12's ~30-45% range. But the dominant failure mode this run, as in run-26, is **omission and severity-calibration, not hallucination**: 4 of the run's 12 canonical failures (both SCH-003 mismatches, `summarize.js`'s SCH-002 mismatch, and `journal-manager.js`'s unrubriced semantic mismatch) are completely absent from the Advisory Findings section, and 7 of the 7 CDQ-007 self-identified-fix instances that per-file evaluation scored as canonical FAILs are present in the PR only as uniform, undifferentiated low-severity boilerplate — a reviewer cannot distinguish the confirmed-shipped `basename()` gap from routine, genuinely-advisory noise using this document alone.

### Reviewer Utility Score

| Aspect | Score | Notes |
|---|---|---|
| Completeness | 3/5 | Full per-file cost/span/attempt accounting is present and (mostly) accurate, but 4 of 12 canonical failures this run — including two live-confirmed type mismatches — are invisible to a reviewer reading only this document. Same rating as run-26 for the same structural reason |
| Accuracy | 4/5 | Every file-level fact checked against `per-file-evaluation.md` and live traces is correct except the stale `context-capture-tool.js` span count (3 vs. actual 2) and the misleading unchanged registry version, both inherited limitations rather than new regressions |
| Actionability | 3/5 | The Recommended Companion Packages and SDK Bootstrap Checklist sections remain genuinely actionable for a deployer. The advisory findings' near-uniform severity language continues to give a reviewer no reliable signal about which of the 13 items need attention before merge — the one false positive (journal-graph.js) sits in the list with the same confidence as the seven genuine, confirmed defects |
| Presentation | 4/5 | Clear section structure and consistent table formatting, consistent with prior runs |
| **Overall** | **3.5/5** | Matches run-26's rating. The advisory-hallucination rate improved sharply (44%→8%), but the omission rate did not — this run's PR still fails to surface roughly a third of the confirmed canonical failures found by full per-file evaluation, and still flattens genuine defects and routine noise into identical severity language |

---

## Cost

| Source | Amount |
|---|---|
| Per-file sum (Per-File Results table) | $9.22 |
| PR total (Token Usage section) | **$9.40** |
| Run-26 | $11.15 |
| Delta vs run-26 | −$1.75 (−15.7%) |

Per-file sum ($9.22) vs PR total ($9.40): $0.18 orchestration/pre-scan overhead across the 18 "no changes needed" files — consistent with the small overhead observed in prior runs (run-26: $0.17).

The $1.75 decrease from run-26 reverses that run's cost spike. Run-26's high cost was driven by three files needing 3 attempts each; this run has only two files at 3 attempts (`journal-graph.js`, `summarize.js`) and two at 2 attempts (`git-collector.js`, `summary-manager.js`), with the rest single-attempt successes — fewer validator round-trips overall. Cost trend: run-27 does **not** continue run-26's climb; it normalizes back toward the run-23–25 range ($3.70–$7.38).
