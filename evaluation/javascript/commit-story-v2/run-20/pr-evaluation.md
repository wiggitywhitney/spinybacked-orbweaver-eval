# PR Artifact Evaluation — Run-20

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/73
**Branch**: spiny-orb/instrument-1780313045724
**State**: OPEN
**Created**: Automatically (2026-06-01)

---

## Push Auth — Tenth Consecutive Fully Automated Push + PR

PR #73 was created automatically with no manual intervention — tenth consecutive success (runs 11–20). The URL swap mechanism fires correctly (`urlChanged=true, path=token-swap`). Run-18's retry-logic fix (issue #867) continues to hold.

---

## PR Title

**Title**: "Add OpenTelemetry instrumentation (29 files)"

"29 files" counts committed (12) + no-changes-needed (17), excluding the failed `mcp/server.js`. This is consistent with the PR body's per-file results table (all files except the failure appear as success or no-changes rows). The body summary box correctly states "12 committed, 17 no changes, 1 failed" — the title is slightly ambiguous but not incorrect.

---

## PR Summary Quality

**Length**: ~280 lines (estimated from PR body size)

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (30 total / 12 committed / 17 no-changes / 1 failed) | YES | Matches run output exactly |
| Per-file span counts | YES | All 13 processed files correct |
| Per-file attempt counts | YES | Correct across all entries |
| Per-file cost | YES | Individual entries sum to ~$8.89; total shown as $9.08 (overhead difference) |
| Correct skip list (17 files) | YES | All 17 no-changes files listed correctly |
| Schema attribute additions (8 attrs) | YES | All 8 listed: `entries_count`, `month_label`, `week_label`, `dates_count`, `force`, `generated_count`, `months_count`, `weeks_count` |
| Span extensions (42) | YES | All 42 span IDs listed correctly |
| Recommended companion packages | PARTIAL | Lists `@traceloop/instrumentation-langchain` but omits `@traceloop/instrumentation-mcp` (present in prior runs; mcp/server.js failed so MCP detection may not have fired) |
| Token usage | YES | Input 272,215 / Output 357,948 / Cache read 388,883 / Cache write 741,433 |
| Live-check | YES | OK (603 spans, 4165 advisory findings) |
| SDK Bootstrap Checklist | NEW | First appearance of this section — advises `service.instance.id: randomUUID()`; accurate and useful |

### Schema Changes Section

PR correctly includes 8 attribute additions and 42 span IDs. The missing `@traceloop/instrumentation-mcp` from Recommended Companion Packages is consistent with `mcp/server.js` being the failed file — the agent may not have processed it far enough to detect the MCP library.

### Span Category Breakdown

The table shows only 6 of 12 committed files. Missing: `collectors/claude-collector.js`, `collectors/git-collector.js`, `generators/journal-graph.js`, `generators/summary-graph.js`, `integrators/context-integrator.js`, `managers/journal-manager.js`. The pattern is the same as runs 12–19: the breakdown table captures a sampling of files rather than all committed files, silently omitting multi-span and 3-attempt files. Not a new regression.

### Review Attention Callouts

Two files flagged: `summary-manager.js` (9 spans, outlier) and `summary-detector.js` (9 spans, outlier). Both are accurate callouts — 9 is well above the 4-span average. These are the two highest-span files in the run. This section continues to work correctly.

---

## Advisory Findings Quality

**Total advisory findings**: 66

| Rule | Count | Verdict |
|------|-------|---------|
| CDQ-007 (Attribute Data Quality) | 40 | ~93% false positives |
| SCH-001 (Span Names Match Registry) | 15 | 100% false positives |
| COV-004 (Async Operation Spans) | 6 | 100% false positives (RST-004 decisions) |
| CDQ-006 (isRecording Guard) | 4 | Mixed (~50% valid) |
| CDQ-010 (String Method Type Safety) | 1 | Likely false positive |

### CDQ-007 (40 findings) — Predominantly false positives

CDQ-007 fires for PII attribute names and raw filesystem paths. Assessment by trigger class:

| Trigger class | Count | Valid? | Notes |
|--------------|-------|--------|-------|
| Raw filesystem path (`journal.file_path`) | ~2 | VALID advisory | journal-paths.js and journal-manager.js both use full paths — known limitation from runs 16–19 |
| Null-guard on `.length`/`.size` counts | ~30 | FALSE POSITIVE | `Map.size` and `Array.length` are always numeric; no nullable access |
| External-source string (commit message, dates from git) | ~6 | FALSE POSITIVE | CDQ-007 describes PII/path data quality, not external-source strings; misclassified |
| Required parameters with defaults | ~2 | FALSE POSITIVE | `commitRef` has `'HEAD'` default; `basePath` has `'.'` default; not nullable |

False-positive rate: ~38/40 (~95%). Significantly higher than prior runs due to blanket firing on any `.length` attribute.

### SCH-001 (15 findings) — Structural false positives

All 15 fire because the live-check validator sees span names not in the base `attributes.yaml` registry. All 15 are extension spans correctly declared in `semconv/agent-extensions.yaml`. The live-check does not load extension files — this is the same structural limitation documented in runs 11–19. **False positive rate: 15/15 (100%).**

### COV-004 (6 findings) — RST-004 false positives

- **git-collector.js (4)**: Fires for `runGit`, `getCommitMetadata`, `getCommitDiff`, `getMergeInfo` — all unexported helpers correctly excluded per RST-004. The live-check does not understand RST-004 exemptions.
- **context-capture-tool.js (1)** and **reflection-tool.js (1)**: Fire for inner async MCP handlers. These are not exported functions — RST-001/RST-004 apply. Advisory, not actionable.

**False positive rate: 6/6 (100%).**

### CDQ-006 (4 findings) — Mixed

| File | Finding | Valid? |
|------|---------|--------|
| journal-graph.js | `commit_story.journal.sections` — derived from LLM filter result | VALID advisory — external-source string, `isRecording()` guard appropriate |
| journal-graph.js | `gen_ai.usage.*` — from AI response metadata | VALID advisory — same reasoning |
| context-integrator.js | `commit_story.commit.message` — from git output | VALID advisory — external-source string |
| journal-manager.js | `.toISOString()` call | FALSE POSITIVE — trivial conversion, exempt from CDQ-006 per established precedent |

**Valid CDQ-006 findings: 3/4.**

### CDQ-010 (1 finding) — Likely false positive

Fires on journal-manager.js. CDQ-010 flags string methods (`.split()`, `.trim()`, etc.) called directly on property accesses. The trigger is likely `commit.timestamp.toISOString().split('T')[0]` or similar — but `toISOString()` is a `Date` method, not a string-method chain on uncertain input. This is the same class of false positive as the CDQ-006 `.toISOString()` false positive in run-12. **Verdict: false positive.**

### Advisory False Positive Summary

| Finding class | Total | False positives | Valid |
|--------------|-------|-----------------|-------|
| CDQ-007 | 40 | ~38 (95%) | ~2 |
| SCH-001 | 15 | 15 (100%) | 0 |
| COV-004 | 6 | 6 (100%) | 0 |
| CDQ-006 | 4 | 1 (25%) | 3 |
| CDQ-010 | 1 | 1 (100%) | 0 |
| **Total** | **66** | **~61 (92%)** | **~5** |

Overall false positive rate: ~92%. Higher than run-19 (~72%) and run-18 (~80%). The increase is driven by CDQ-007 firing across every file with `.length`-based count attributes. The 3 valid CDQ-006 findings (external-source strings without `isRecording()` guards) are the most useful advisories.

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 4/5 | All data present; span breakdown table missing 6/12 committed files |
| Accuracy | 4/5 | File-level data accurate; advisory findings 92% false positive rate |
| Actionability | 3/5 | 3 valid CDQ-006 findings actionable; 2 CDQ-007 file-path advisories known/low priority; 61 findings are noise |
| Presentation | 5/5 | Clean markdown, organized sections, new SDK Bootstrap Checklist is a useful addition |
| **Overall** | **4.0/5** | Slight improvement on run-19 (3.75/5) from SDK Bootstrap Checklist addition |

---

## New Feature: SDK Bootstrap Checklist

Run-20 introduces a new section in the PR body advising that `service.instance.id: randomUUID()` be included in the OTel bootstrap. This is timely — `service.instance.id` absence was the root cause of the RES-001 IS scoring miss across multiple prior eval targets. The code snippet is accurate. The advisory about `--import` loading of auto-instrumentation (causing competing ESM hook registries) is also new and correct.

---

## Cost

| Source | Amount |
|--------|--------|
| PR total | $9.08 |
| Run-19 | $8.83 |
| Run-18 | $9.16 |
| Run-17 | $10.43 |
| Run-16 | $12.29 |
| Delta vs run-19 | +$0.25 |

**$9.08** — $0.25 higher than run-19. Primary driver: 5 files at 3 attempts (vs run-19's 1 file at 3 attempts). The 3-attempt cluster (claude-collector, git-collector, context-integrator, journal-manager, index.js) added approximately $1.50 in incremental cost. Summary-manager.js at 1 attempt ($0.62 for 9 spans) demonstrates the efficiency when NDS-003 doesn't block.

Token usage:
- Input: 272,215 (run-19: 250,810, +21K)
- Output: 357,948 (run-19: 360,582, -3K)
- Cache read: 388,883 (run-19: 644,153 — significant decrease; fewer cached pages due to mcp/server.js not completing its page cache in prior attempts)
- Cache write: 741,433 (run-19: 660,203, +81K — new pages from summary-manager.js's 9-span output)
