// ABOUTME: PR artifact evaluation for run-28 — accuracy assessment, advisory findings quality, reviewer utility score.
# PR Artifact Evaluation — Run-28

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/95
**Branch**: `spiny-orb/instrument-1789648132789`
**State**: OPEN

---

## Push Auth — Clean Auto-Creation Continues

PR #95 auto-created cleanly with no manual recovery, continuing run-27's pattern (PR #94, also AUTO). Per `run-summary.md`, total run duration was 1h 16m with no overnight `PROGRESS.md` `[a]ccept/[e]dit/[s]kip` pause or push-confirmation stall — the D-7 failure shape from runs 26/27 did not recur.

---

## PR Summary Quality

**Length**: 311 lines

### Accuracy Assessment

| Element | Accurate | Notes |
|---|---|---|
| Files processed: 32 / Committed: 12 / No changes needed: 19 / Partial: 1 | YES | Matches `run-summary.md` exactly (12 full commits, 0 failed, 1 partial, 19 harness-labeled skips, 32 seen) — an improvement over run-27, whose equivalent summary line was internally inconsistent |
| Per-File Results table (13 rows: status, spans, attempts, cost) | One inaccuracy, of a new shape | All 12 fully-committed files' span/attempt/cost figures match `per-file-evaluation.md` exactly (including `git-collector.js` 6 spans/1 attempt, `summary-manager.js` 9 spans/2 attempts, `summary-detector.js` 9 spans/1 attempt). `summarize.js`'s status — "partial (7/7 functions)" — is a **real number lifted from spiny-orb's own log** (`spiny-orb-output.log` line 1149: "Function-level fallback: 7/7 functions instrumented"), unlike run-27's "12/14" which corresponded to no real count at all. But it's still misleading: 7/7 is the fallback stage's own internal count of the functions it processed at that one stage, not the file's true function total. Per-file evaluation's direct source read found the file has 9 top-level functions (3 async/span-eligible, all 3 committed, plus 6 sync — 2 of which, `isValidDate` and `showSummarizeHelp`, fall outside the fallback pass's 7-function denominator entirely). A reviewer reading "7/7" would reasonably conclude the file is fully covered; it is, but not because 7 is the file's real function count |
| "No changes needed" file list (19 files) | YES | Matches the Skips Evaluated table in `per-file-evaluation.md` exactly, including both questionable skips (`context-capture-tool.js`, `reflection-tool.js`) |
| Registry versions (Baseline 0.1.0 → Head 0.1.0) | **Misleading, and worse than run-27's version of this issue** | `semconv/agent-extensions.yaml` does not exist on `main` at all (confirmed: `git show main:semconv/agent-extensions.yaml` → "does not exist in 'main'"). Run-27's flagged issue was a real prior file whose version number didn't move despite additions; here there is no real prior file to have a version at all — "Baseline: 0.1.0" is a default/placeholder value the tooling reports when there's nothing to diff against, not a historical fact. A reviewer would read "0.1.0 → 0.1.0" as "no change," when the truth is closer to "this registry file didn't exist before this PR" |
| New Span IDs / New Attribute Extensions counts | YES | Summed directly from the PR body's own per-file listings; consistent with the Per-File Results table's schema-extension counts |
| Live-Check: OK (730 spans, 5597 advisory findings) | Not independently verifiable | Matches `run-summary.md`'s reported Live-Check line exactly; the underlying report (`spiny-orb-live-check-report.json`) was not independently re-verified in this evaluation |
| Token usage / cost ($7.23) | YES | Matches `run-summary.md`'s reported total exactly |

### Schema Changes Section

The Schema Changes section lists 24 added attributes as clean, additions-only. As in runs 26/27, it has no mechanism to surface attribute-level *defects*. This run ships far more of them than run-27 did: `git-collector.js`'s `commit_story.git.is_merge` (declared `boolean`, set via `String(...)`), `summary-manager.js`'s `commit_story.journal.summary_saved` (declared `string`, always set as a boolean at all 14 call sites), and 10 more `String()`-vs-`int` mismatches split across `summarize.js` (2), `summary-detector.js` (4), and `auto-summarize.js` (6) — 12 total occurrences of the RUN27-3 shape, all on keys the Schema Changes section lists as new additions. None of the 12 appears anywhere in that section; a reviewer reading only "Added: 24 attributes" would have no way to know roughly half of them ship with the wrong runtime type declared right next to the correct one.

### Advisory Findings Quality

The PR summary includes 13 advisory line-items across 11 files. Assessment against `per-file-evaluation.md`'s canonical findings, with source lines independently re-verified against the committed branch (`git show spiny-orb/instrument-1789648132789:<file>`):

| Finding | Verdict | Notes |
|---|---|---|
| `claude-collector.js` — CDQ-007 (lines 230, 231) | **False positive** | Both lines are `commit_story.context.sessions_count`/`messages_count` — plain integer counts. Per-file evaluation scored this file's CDQ-007 canonical **PASS**: it drops `repo_path` entirely rather than shipping it raw. No PII, no path, anywhere in this span |
| `git-collector.js` — CDQ-007 (lines 78, 213, 214) | **Valid at 2 of 3 cited lines, under-severed** | Lines 78 and 213 are `commit_story.commit.author`, a raw person's full name — per-file evaluation scored this canonical **FAIL** and a regression (run-27 removed this exact attribute after being blocked; run-28's validator only advisory-flagged it). Line 214 is `commit_story.commit.message` — not a PII-attribute-name or path pattern per the rule's own text, and not corroborated as a defect by per-file evaluation. Regardless of the third line, the two real hits are treated with the same uniform low-severity boilerplate as every other advisory in the section, giving no signal that this is a confirmed, previously-fixed-then-regressed defect |
| `context-integrator.js` — CDQ-007 (lines 45, 46, 67, 68, 110, 111) | **Valid, under-severed** | Per-file evaluation confirms `commit_story.commit.author` re-exposed here (same raw-PII value received from `git-collector.js`) as a canonical **FAIL**. Same uniform-severity framing issue as above |
| `context-capture-tool.js` — COV-004:69 | **Valid, but the PR gives no signal this is a regression** | Matches per-file evaluation's "questionable — coverage regression" finding for `saveContext`. The PR lists this file under "No changes needed" alongside 18 genuinely-correct skips, with nothing distinguishing it as a file that shipped 2 spans in run-27 and lost both this run, or that the agent's own reasoning trace drafted the fix before the final notes reversed course |
| `reflection-tool.js` — COV-004:65 | **Valid, recurring gap** | Matches per-file evaluation's finding — self-identified-and-declined `saveReflection` span gap, unresolved across three consecutive runs (26, 27, 28). The PR gives no indication this is a 3-run-old, not new, finding |
| `journal-manager.js` — CDQ-007 (lines 183, 434) | **False positive, and mistargeted** | Line 183 is `span.setAttribute('vcs.ref.head.revision', commit.shortHash)` — a git ref, not a path or PII. Line 434 is `commit_story.journal.entries_count` — an integer. Neither line is anywhere near the file's actual `file_path` attribute (a different line entirely), which per-file evaluation confirms is correctly sanitized via inline `.split(/[\\/]/).filter(Boolean).pop() ?? ''`. This isn't just a severity-miscalibration case like the `git-collector.js`/`context-integrator.js` findings above — it's pointed at the wrong lines and the wrong attributes altogether |
| `summary-manager.js` — COV-004:30 | **Valid, correctly non-blocking** | Line 30 is the JSDoc immediately preceding `_hasRealSummary`, the file's one unexported async helper without a span. Per-file evaluation scores this the same way — correctly exempt, advisory-only, not a canonical failure |
| `summary-manager.js` — CDQ-007 (9 lines: 151, 213, 239, 334, 400, 457, 600, 739, 774) | **Valid at 4 of 9 lines, false positive at the other 5** | Direct source read: lines 151, 239, 400, 774 are raw, unsanitized `file_path` assignments — these are the exact 4 sites per-file evaluation scored canonical **FAIL** (out of 7 total `file_path` sites in the file; the other 3 are correctly sanitized). Lines 213, 334, 457, 600, 739 are `entries_count`/`daily_summaries_count` (×2)/`weekly_summaries_count` (×2) — plain integer counts with no path or PII character at all. The advisory bundles 5 mistargeted line numbers in with 4 genuinely correct ones under one undifferentiated citation |
| `summarize.js` — CDQ-007 (lines 435, 522) | **False positive, self-documented as such** | `failure-deep-dives.md` independently confirms these are `weeks.length`/`months.length` raw counts, not PII or paths, and explicitly calls this "a rule-template misfire triggered by the raw-identifier pattern rather than an actual raw-path/PII exposure." The PR repeats this exact false positive with no indication it's spurious |
| `summary-detector.js` — CDQ-007 (8 lines: 95, 132, 155, 207, 245, 268, 371, 394) | **False positive, confirmed clean file** | Per-file evaluation confirms this file "sets no `commit_story.context.repo_path`, no `file_path`, and no PII/path attribute of any kind — every attribute in the file is a numeric count," and explicitly flags the advisory text as "stale/mistargeted output, not a real finding." The PR carries this false positive forward unchanged |
| `auto-summarize.js` — CDQ-007 (lines 29, 122, 186) | **False positive** | Direct source read: all 3 lines are `unsummarized_days_count`/`unsummarized_weeks_count`/`unsummarized_months_count`, raw integers from `.length`. Per-file evaluation scores this file's CDQ-007 canonical **PASS**, explicitly noting it does not set `repo_path` or any path/PII attribute this run (unlike run-27 on this same file) |
| `auto-summarize.js` — SCH-001 | **Valid, correctly non-blocking, unrelated to the file's real defect** | Matches per-file evaluation's note that 3 new span names were correctly declared as schema extensions after semantically-closer existing IDs were confirmed already claimed. Not a failure — but its presence, next to the complete absence of this file's actual SCH-003 failure (6 `String()`-vs-`int` violations), means the one advisory item shown for this file is a non-issue while the real one is invisible |
| `index.js` — CDQ-007:208 | **False positive** | Line 208 is `span.setAttribute('commit_story.summary.force', parsed.force)` — a boolean. Per-file evaluation scores `index.js` a full PASS on all 20 applicable rules, with no CDQ-007 concern anywhere in the file |

**Critical omission — every one of the run's 6 SCH-003/CDQ-006 canonical failures is completely absent from Advisory Findings**: `git-collector.js`'s `is_merge` type mismatch, `summary-manager.js`'s `summary_saved` type mismatch, `summary-manager.js`'s CDQ-006 guard-inconsistency finding, `summary-detector.js`'s 4-occurrence SCH-003, `auto-summarize.js`'s 6-occurrence SCH-003, and `summarize.js`'s SCH-003 (`months_generated_count`/`months_failed_count` `String()`-wrapping plus the `dates_requested` type/semantic mismatch) — none of these 6 findings, covering 14 individual occurrences, appears anywhere in the Advisory Findings section. The section shows only CDQ-007, COV-004, and SCH-001 line items; no SCH-003 or CDQ-006 item exists in the PR at all.

**Advisory contradiction rate**: 6 of 13 line-items are outright false positives (`claude-collector.js`, `journal-manager.js`, `summarize.js`, `summary-detector.js`, `auto-summarize.js`'s CDQ-007, and `index.js`) — **46%**, and a 7th (`summary-manager.js`'s CDQ-007) is mixed, correct on 4 of its 9 cited lines and wrong on the other 5. This is a sharp regression from run-27's 8% contradiction rate, back near run-11/12's 30-45% range, driven almost entirely by CDQ-007 firing on plain integer-count attributes across five different files. The omission pattern from run-27 also persists unchanged: every one of this run's 6 SCH-003/CDQ-006 canonical failures (14 occurrences) is invisible to a reviewer reading only this document — a larger omission than run-27's, in raw count, even before counting the false positives.

### Reviewer Utility Score

| Aspect | Score | Notes |
|---|---|---|
| Completeness | 2/5 | Every one of this run's 6 SCH-003/CDQ-006 canonical failures (14 occurrences, across 4 files) is absent from Advisory Findings, and the Schema Changes section gives no indication any of the 24 newly-added attributes has a type defect. Lower than run-27's 3/5 because this run has more distinct hidden failure classes (SCH-003 in four files, CDQ-006 in one) than run-27 had |
| Accuracy | 2/5 | The status/span/attempt/cost fields in the Per-File Results table are accurate (an improvement over run-27's genuine "12/14" fabrication) and the file-count summary line is now internally consistent. But the Advisory Findings section is wrong or mistargeted on 6 of 13 line-items (46%), including two cases (`journal-manager.js`, `summary-manager.js`) where the cited line numbers don't even point at the attribute the rule is nominally about. Lower than run-27's 3/5 because the false-positive rate more than offsets the improved per-file table accuracy |
| Actionability | 2/5 | A reviewer acting only on the Advisory Findings section would spend time chasing 6 false-positive "PII/path" citations on plain integer attributes across 5 files, while the run's most significant defect class (type mismatches on newly-declared schema keys, 14 occurrences) receives zero mentions. The Recommended Companion Packages and SDK Bootstrap Checklist sections remain generically useful, as in prior runs |
| Presentation | 4/5 | Same clear, consistent table structure and section layout as prior runs; the file-count summary line's internal consistency is an improvement over run-27 |
| **Overall** | **2.25/5** | Below run-27's 3.25/5. The Per-File Results table is meaningfully more trustworthy this run, but the Advisory Findings section regressed sharply — a false-positive rate roughly 5-6x higher than run-27's, on top of the same structural blindness to SCH-003/CDQ-006 defects that has now persisted across three runs (26, 27, 28) |

---

## Cost

| Source | Amount |
|---|---|
| Per-file sum (Per-File Results table) | $7.03 |
| PR total (Token Usage section) | **$7.23** |
| Run-27 | $9.40 |
| Delta vs run-27 | −$2.17 (−23.1%) |

Per-file sum ($7.03) vs PR total ($7.23): $0.20 orchestration/pre-scan overhead across the 19 "no changes needed" files — comparable to the small overhead observed in runs 26/27 (run-27: $0.18).

The $2.17 decrease from run-27 continues the post-run-26 normalization trend, despite `summarize.js`'s 5-step validation journey (3 full-file attempts, a function-level fallback, and a reassembly pass per `failure-deep-dives.md`) being, if anything, a more complex retry path than run-27's own partial-file cost driver. Token usage is also down (181.8K/297.1K input/output vs run-27's 272.3K/356.1K). Cost trend: run-28 continues run-27's normalization, landing below the run-23–25 baseline range ($3.70–$7.38) rather than within it, on the low end.
