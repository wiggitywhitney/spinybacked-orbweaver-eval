# PR Artifact Evaluation — Run-18

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/70
**Branch**: spiny-orb/instrument-1778932891597
**State**: OPEN (eval PRs never merge)

---

## Push Auth — Ninth Consecutive Success (manual)

spiny-orb's auto-push failed due to the `progress-md-pr.sh` pre-push hook creating a new commit mid-push and exiting non-zero. Manual token push succeeded; PR #70 created manually from `spiny-orb-pr-summary.md`. Push auth mechanism (GITHUB_TOKEN + URL swap) works correctly — the failure is in spiny-orb's retry logic, not the token.

---

## PR Summary Quality

**Length**: ~190 lines

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (30 processed / 11 committed / 15 skipped / 4 failed) | YES | Matches run output |
| Per-file span counts | YES | All 11 committed files correct |
| Per-file attempt counts | YES | Correct throughout |
| Per-file cost | YES | Sum = $9.16 |
| Correct skip list (15 files) | YES | All 15 listed |
| Schema attribute additions (7 new attrs) | YES | commit_story.mcp.transport + 6 summary.* attrs |
| Span extensions (36 new span IDs) | YES | All 36 listed |
| Recommended companion packages | YES | langchain, mcp |
| Token usage | YES | 345.9K input, 375.9K output (360.5K cached) |
| Cost ceiling | YES | $70.20 ceiling, $9.16 actual |
| Live-check | YES | OK |
| Failed file list | YES | All 4 listed with error messages |

### Schema Changes Section

The PR summary correctly includes both attribute additions (7 new) and span extensions (36 new). The schema diff is accurate — all new span names match the extensions declared by the per-file agents. Two files flagged as "outliers" in the Review Attention section (summary-manager.js at 9 spans, summary-detector.js at 9 spans) — correct identification, though context explains why: summary-manager has 9 exported async functions, summary-detector has 9 async functions.

### Advisory Findings Quality

Total advisory findings: ~40 across 8 files.

| File | Finding | Count | Verdict | Notes |
|------|---------|-------|---------|-------|
| git-collector.js | COV-004 | 4 | **False positive** | 4 unexported helpers (runGit, getCommitMetadata, getCommitDiff, getMergeInfo) — RST-004 exempt; advisory judge doesn't apply RST-004 before flagging |
| journal-graph.js | CDQ-007 | 1 | Partially valid | Vague trigger (PII/path/nullable); likely flagging gen_ai.usage tokens as nullable — valid if so |
| journal-paths.js | CDQ-007 | 1 | Partially valid | Likely flagging raw filesystem path for commit_story.journal.file_path — advisory, not canonical |
| journal-manager.js | CDQ-007 | 3 | Partially valid | Likely file paths and nullable commit fields; same path advisory pattern |
| summary-manager.js | CDQ-007 | 8 | Partially valid | file_path attributes on read/save functions — raw path advisory (CDQ-007 low severity) |
| summary-manager.js | SCH-001 | 5 | **False positive** | New span names ARE declared as schema extensions; validator correctly accepted them; advisory judge doesn't read schemaExtensions field |
| summarize.js | CDQ-007 | 3 | Partially valid | CDQ-007 on month_count or similar counts |
| summary-detector.js | CDQ-007 | 9 | **False positive** | All 9 spans use `.length` on initialized arrays — never nullable; advisory judge overfires on array-derived counts |
| summary-detector.js | SCH-001 | 4 | **False positive** | Same schema extension false positive pattern |
| auto-summarize.js | SCH-001 | 2 | **False positive** | Same schema extension false positive pattern |

**False positive count**: ~20 of 40 advisory findings (~50%) — high, consistent with the SCH-001 extension-blind pattern and CDQ-007 over-triggering on array `.length` attributes.

**Advisory contradiction rate**: ~50% (up from ~39% in run-17). The SCH-001 false positives on extension spans are the primary driver — the live-check doesn't have visibility into the `schemaExtensions` array, so every newly declared span name fires SCH-001 even when correctly registered.

**Valid advisories**: The CDQ-007 findings on file paths (journal-paths.js, journal-manager.js, summary-manager.js) are legitimate low-severity quality signals worth noting. The git-collector.js COV-004 false positives are the most misleading — an agent seeing these might incorrectly conclude it missed spans on those helpers.

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All files, spans, attrs, schema changes, failed files listed |
| Accuracy | 4/5 | File-level data accurate; advisory findings ~50% false positive rate |
| Actionability | 3/5 | Valid CDQ-007 path findings are actionable; SCH-001/COV-004 false positives are noise that obscures real signals |
| Presentation | 4/5 | Clean markdown, good tables |
| **Overall** | **4.0/5** | Slight decline from run-17 (false positive rate increased) |

---

## Cost

| Source | Amount |
|--------|--------|
| PR total | $9.16 |
| Run-17 | $10.43 |
| Delta vs run-17 | -$1.27 |
| Cost ceiling | $70.20 |
| Ceiling utilization | 13% |

**$9.16** — $1.27 cheaper than run-17. Primary saving: journal-graph.js committed in 2 attempts ($1.67) rather than failing (0 committed, 3 attempts at higher cost). The 4 failed files spent only $2.08 combined (summary-graph $1.00, index.js $0.61, context-capture-tool $0.24, reflection-tool $0.23). 360.5K cached tokens (96% cache hit on output tokens) — excellent cache utilization from retry passes.

---

## Failed File Representation

All 4 failed files are correctly represented in the PR summary with their error messages:
- summary-graph.js: NDS-003 line 485 `}),` — accurate
- context-capture-tool.js: NDS-003 oscillation lines 124-125 — accurate
- reflection-tool.js: NDS-003 oscillation lines 116-117 — accurate
- index.js: NDS-003 lines 217 `);` — accurate (line 375 second violation not listed, but first violation is sufficient to identify the failure)
