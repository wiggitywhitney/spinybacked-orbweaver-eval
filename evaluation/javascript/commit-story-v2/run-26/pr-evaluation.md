# PR Artifact Evaluation — Run-26

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/91
**Branch**: `spiny-orb/instrument-1784302707982`
**State**: OPEN

---

## Push Auth — Manual Recovery, Not a spiny-orb Defect

The automated run was live but paused at its `Proceed? [y/N]` approval prompt for ~27.5 hours. During that paused window, the branch was pushed manually and PR #91 was created with `gh pr create --body-file spiny-orb-pr-summary.md`, using spiny-orb's unconditionally-written summary file as-is rather than a shortened manual body. When the automated run later resumed, its own `gh pr create` step correctly detected the resulting duplicate PR and reported that detection as a "failure" — the push/PR pipeline itself worked as designed; the apparent failure was a side effect of the premature manual recovery, not a spiny-orb bug. See RUN26-3 in `actionable-fix-output.md` for the full correction.

The PR body is identical in content and structure to what auto-creation would have produced — the eval-side recovery step affected *delivery timing* only, not the artifact's content or quality.

---

## PR Summary Quality

**Length**: 260 lines (33,553 characters)

### Accuracy Assessment

| Element | Accurate | Notes |
|---|---|---|
| Files processed: 32 / Committed: 14 / No changes needed: 18 | YES | Matches `run-summary.md` and `per-file-evaluation.md` exactly |
| Per-File Results table (14 rows: status, spans, attempts, cost, libraries, schema extensions) | YES | Span counts and attempt counts match every section in `per-file-sections/` checked (01, 08, 09, 11–14) |
| "No changes needed" file list (18 files) | YES | Matches the Correct Skips table in `per-file-evaluation.md`, including `reflection-tool.js` |
| Registry versions (Baseline 0.1.0 → Head 0.1.0) | Misleading | Both versions are identical despite 13 new attributes and 41 new span IDs being added — the registry's semantic version was not bumped for this run's additions. Not a spiny-orb defect to fix here, but worth flagging: a reviewer skimming "0.1.0 → 0.1.0" would incorrectly conclude the schema didn't change |
| New Span IDs (41) | YES | Count and names are internally consistent with the Per-File Results table's `Schema Extensions` column |
| Live-Check: OK (607 spans, 4966 advisory findings) | Not independently verifiable | No access to `spiny-orb-live-check-report.json` from this evaluation; the 4966 figure is far larger than the 54 advisory line-items surfaced in the PR body's curated "Review Attention" section, suggesting the PR body shows only a subset (the selection mechanism itself was not verified) |

### Schema Changes Section

The Schema Changes section is accurate and complete for what it reports (13 new attributes, 41 new span IDs, versions unchanged), but it reports *additions only* — it has no mechanism to surface the one attribute-level *defect* found in this run: `commit_story.journal.reflections_count` is declared `type: int` in the registry but the committed code emits it as a string (`SCH-003 FAIL` in `journal-manager.js`, confirmed live as the quoted string `"0"`). A reviewer reading only the Schema Changes section would have no way to know a type mismatch shipped in this PR — that information exists only in the underlying validator run, not in anything spiny-orb surfaces to a human.

### Advisory Findings Quality

The PR summary includes 54 advisory line-items (grouped below by file/rule-type; several files repeat the identical boilerplate once per triggering attribute). Assessment against `per-file-evaluation.md`'s independently-derived rule tables:

| Finding | Verdict | Notes |
|---|---|---|
| `claude-collector.js`, `context-integrator.js`, `journal-graph.js`, `summary-graph.js`, `context-capture-tool.js`, `index.js` — CDQ-007 (PII/raw path) | Valid | Matches per-file-evaluation's own CDQ-007 ADVISORY findings for these files; correctly non-blocking |
| `git-collector.js`, `reflection-tool.js`, `summary-manager.js`, `summary-detector.js` — COV-004 (missing span on async helper) | Valid, correctly non-blocking | These are unexported internal helpers arguably covered by the RST-001 "context propagation covers unexported internal helpers" exemption; per-file-evaluation scored the equivalent finding as PASS/ADVISORY, never FAIL, consistent with the PR's non-blocking framing |
| `journal-manager.js` — CDQ-007 (×2, raw path on `commit_story.journal.file_path`) | Partially valid | Technically a raw path, but per-file-evaluation scored CDQ-007 **PASS** for this file specifically because the actual PII risk (`commit.author`) was correctly avoided — the raw-path aspect alone wasn't treated as failing. The PR's advisory is not wrong to flag it, but the same boilerplate severity language ("lower severity — fix when convenient") undersells that this file's *real* defect is elsewhere (see next row) and isn't mentioned at all |
| `journal-manager.js` — **SCH-003 (`reflections_count` type mismatch)** | **Missing entirely** | The one canonical FAIL confirmed live in this file (string emitted where the registry declares `int`) does not appear anywhere in the Advisory Findings section. The agent's own generation process didn't catch it (only 1 attempt was needed to pass validation), so there was nothing for the summary to surface — but the practical effect is that a reviewer reading only this PR would see two low-severity path advisories and conclude the file is otherwise clean |
| `journal-paths.js` — CDQ-007 (raw path, framed as advisory/"lower severity") | Partially valid | This is the PR's second canonical FAIL (per per-file-evaluation.md), but the PR body's generic advisory wording — identical text used for every other file's non-blocking CDQ-007 finding — doesn't distinguish it from the merely-advisory cases. Per-file-evaluation treats it as a real failure specifically because a `basename` import was already available and simply not used; the PR's boilerplate ("fix when the code will run in a context where the basename utility is already imported") is actually describing this exact file's situation, yet still categorizes it as low-severity/advisory rather than a defect |

**Advisory contradiction rate**: 0 findings were outright *incorrect* (unlike run-25's `#88 semantic-dedup` and similar false-positive patterns seen in other runs) — every flagged item corresponds to a real, verifiable attribute in the code. The failure mode this run is **omission and severity-calibration**, not hallucination: 1 of 2 canonical failures (SCH-003) is completely absent from the advisory list, and the other (journal-paths.js's CDQ-007) is present but mislabeled as routine low-severity boilerplate identical to six other genuinely non-blocking findings. Framed against the rubric-scores precedent that "CDQ-006/CDQ-007-style advisories are never canonical failures" — that precedent holds for every file *except* journal-paths.js, where the same rule id crossed into FAIL territory for file-specific reasons the advisory text doesn't communicate.

### Reviewer Utility Score

| Aspect | Score | Notes |
|---|---|---|
| Completeness | 3/5 | Full per-file cost/span/attempt accounting is present and accurate, but the one real schema-type defect in the PR (SCH-003) is invisible to a reviewer reading only this document |
| Accuracy | 4/5 | Every stated fact checked against `per-file-evaluation.md` and live traces is correct; the only inaccuracy is the misleading unchanged registry version number |
| Actionability | 3/5 | The "Recommended Companion Packages" and "SDK Bootstrap Checklist" sections are genuinely actionable for a deployer; the advisory findings' uniform severity language gives a reviewer no signal about which of the 54 items (if any) actually needs attention before merge |
| Presentation | 4/5 | Clear section structure, consistent table formatting; the 54-line advisory list is repetitive (identical boilerplate sentence repeated per attribute) and would benefit from de-duplication by rule+file rather than by triggering line |
| **Overall** | **3.5/5** | A reliable summary of what the agent *did*, but not a reliable signal of what's *wrong* — the one canonical defect that survived to the committed code isn't mentioned, and the one advisory that happens to describe a real defect looks identical to six that don't |

---

## Cost

| Source | Amount |
|---|---|
| Per-file sum (Per-File Results table) | $10.98 |
| PR total (Token Usage section) | **$11.15** |
| Run-25 | $7.38 |
| Delta vs run-25 | +$3.77 (+51%) |

Per-file sum ($10.98) vs PR total ($11.15): $0.17 orchestration/pre-scan overhead across the 18 "no changes needed" files — consistent with the small overhead observed in prior runs (run-25: $0.15).

The $3.77 increase over run-25 is not driven by any single outlier file — it's distributed across three files that needed 3 attempts each this run (`git-collector.js`, `journal-graph.js`, `summary-detector.js`) versus fewer retries in run-25, plus one additional file in the inventory (`failure-placeholder.js`, new to this run's file list, though it needed no instrumentation). Token usage corroborates this: input tokens rose from 213.5K → 340.3K and output tokens from 286.7K → 411.1K, both roughly 1.4-1.6x run-25's figures — consistent with more validator round-trips rather than a single expensive file.
