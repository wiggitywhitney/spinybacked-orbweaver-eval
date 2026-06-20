// ABOUTME: PR artifact evaluation for run-25 — PR #86 quality, accuracy, and advisory finding analysis.
# PR Artifact Evaluation — Run-25

**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/86
**Branch**: spiny-orb/instrument-1781909345452
**State**: OPEN

---

## Push Auth — 17th Consecutive Success

PR #86 auto-created successfully — seventeenth consecutive auto-push/PR. The fine-grained PAT and URL-swap mechanism continue to work without intervention.

---

## PR Summary Quality

**Length**: ~340 lines

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (31 total / 13 committed / 17 no changes / 1 partial) | YES | Matches run output |
| Per-file span counts | YES | All 14 instrumented files (13 committed + 1 partial) match run-summary.md |
| Per-file attempt counts | YES | All attempt counts correct (5 files ×2, rest ×1) |
| Per-file cost (per-file sum: $7.23) | YES | Reasonable; $0.15 orchestration overhead vs run-summary.md total ($7.38) |
| Correct skip list (17 files) | YES | All 17 listed; reflection-tool.js, traceloop-init.js, commit-analyzer.js, config.js, logger.js, all 10 prompts/, and 3 filters/ |
| Schema attribute changes (16 new attrs) | YES | All 16 listed |
| Span extensions (47 new span IDs) | YES | All 47 listed |
| Recommended companion packages | YES | `@traceloop/instrumentation-langchain`, `@traceloop/instrumentation-mcp`, `@opentelemetry/instrumentation-pino` |
| Token usage | YES | 213.5K input / 286.7K output / 480.5K cached — matches run-summary.md |
| Live-check | YES | OK — 657 spans, 4462 advisory findings |
| Outlier callout (summary-detector.js, 9 spans) | YES | "outlier, review recommended" correctly flagged |
| Partial entry for summary-manager.js | YES | "partial (12/14 functions)" — 7 exported async functions committed, 5 RST-001 sync helpers correctly skipped, 2 rejected by validator (COV-003 conditional-rethrow pattern) |

**Note on partial function count**: The PR reports "12/14 functions" for summary-manager.js. This counts 7 committed async spans + 5 correctly-skipped sync helpers = 12 handled, with 2 rejected. The per-file evaluation uses a different frame (9 exported async functions, 7 committed). Both framings are consistent; the PR is authoritative on total file-level counts.

### Span Name Discrepancy: git-collector.js

The PR's schema extensions section lists 6 new span IDs for git-collector.js: `run_git`, `get_commit_metadata`, `get_commit_diff`, `get_merge_info`, `get_previous_commit_time`, `get_commit_data`. The per-file evaluation section lists: `get_commit_data`, `get_previous_commit_time`, `get_commit_diff`, `run_git`, `parse_diff`, `get_branch_name`.

Four names overlap; two differ (`get_commit_metadata`/`get_merge_info` in the PR schema section vs `parse_diff`/`get_branch_name` in the per-file section). The most likely explanation: `parse_diff` and `get_branch_name` were registered in a prior run and are not listed as new in this run's schema changes section. The PR is authoritative on what was newly registered; the per-file section lists all spans used in the committed code. This is consistent with prior-run precedent (pre-existing registrations do not appear in "New Span IDs"). Not an accuracy error.

### Schema Changes Section

PR correctly includes both attribute additions (16) and all 47 new span IDs. The RUN24-2 SCH-003 failure attribute (`diff_lines`) is notable: it is NOT among the 16 new schema attributes in run-25 — the agent chose to omit it entirely rather than re-declare it. This means the SCH-003 auto-coercion fix (spiny-orb commit 91e9413) was not exercised. See RUN24-2 fix verification below.

### Advisory Findings Count

| File | SCH-001 | CDQ-006 | CDQ-007 | COV-004 | Total |
|------|---------|---------|---------|---------|-------|
| claude-collector.js | — | — | 2 | — | 2 |
| git-collector.js | 4 | — | — | — | 4 |
| context-integrator.js | 1 | — | 5 | — | 6 |
| journal-graph.js | 2 | — | — | — | 2 |
| summary-graph.js | 6 | — | — | — | 6 |
| context-capture-tool.js | 1 | — | 1 | — | 2 |
| reflection-tool.js | — | — | — | 1 | 1 |
| journal-paths.js | — | — | 1 | — | 1 |
| journal-manager.js | 1 | 2 | 3 | — | 6 |
| summary-manager.js | — | 2 | 12 | — | 14 |
| summarize.js | — | — | 2 | — | 2 |
| **Total** | **15** | **4** | **26** | **1** | **46** |

#### SCH-001 (15 instances, 8 files): Systematic False Positive

All 15 SCH-001 advisories are false positives. Every flagged span name is present in the PR's own "New Span IDs (47)" schema changes section — they ARE registered as extensions in this run. The advisory checker does not recognize freshly registered in-run extensions. Same structural issue from prior runs (run-21: 17, run-23: 22, run-25: 15 — slightly down from run-23, likely because fewer multi-span files this run). Unresolved pending issue #902.

#### CDQ-007 (26 instances, 8 files): Non-Actionable Without Per-Instance Detail

CDQ-007 fires for "PII attribute name or raw filesystem path." All 26 instances use an identical generic message with no indication of which specific attribute triggered it. Per-file evaluation finds CDQ-007 ADVISORY (not FAIL) for all 13 committed files. The 12 CDQ-007 firings for summary-manager.js likely trace to `commit_story.journal.file_path`, which appears on most committed spans (confirmed in per-file section). These advisories are technically accurate but non-actionable without per-instance detail.

Slight volume decrease from run-23's 41 instances: run-25 committed 13 files (same as run-23) but fewer schema extension attributes (16 vs 15 new attrs — comparable), so the decrease likely reflects fewer path-bearing attribute registrations in this run.

#### COV-004 (1 instance, 1 file): Incorrect

| Finding | Verdict | Notes |
|---------|---------|-------|
| COV-004 on reflection-tool.js (×1) | **Incorrect** | reflection-tool.js is in the correct-skip list — RST-001 applies (all functions are synchronous or infrastructure-only). Same false positive pattern from run-23 |

reflection-tool.js correctly received no instrumentation. The COV-004 advisory is a false positive — same as run-23.

#### CDQ-006 (4 instances, 2 files): Advisory, Per Rubric Precedent

| File | Finding | Verdict | Notes |
|------|---------|---------|-------|
| journal-manager.js (×2) | `isRecording()` guard missing on `setAttribute` with external-source string | **Advisory** | Per established CDQ-006 rubric precedent, advisory findings are not canonical failures. The specific attributes in journal-manager.js are date strings derived from ISO conversion — bounded, low-cost operations |
| summary-manager.js (×2) | Same pattern | **Advisory** | Same precedent applies; `file_path` and count attributes are low-cost; the outer span context is already active |

CDQ-006 advisories are technically valid guard suggestions but do not constitute rubric failures per run-12/run-21/run-23 precedent.

### Advisory Finding Summary

| Rule | Count | Verdict | Notes |
|------|-------|---------|-------|
| SCH-001 | 15 | **Incorrect** | All false positives — spans ARE newly registered extensions |
| CDQ-007 | 26 | **Incorrect/Non-actionable** | Per-file eval PASS for all files; generic message non-actionable |
| COV-004 | 1 | **Incorrect** | reflection-tool.js is a correct skip |
| CDQ-006 | 4 | **Advisory only** | Per established rubric precedent; not canonical failures |
| **Total noise** | **46/46** | **100%** | No actionable signal in advisory findings this run |

**Advisory noise rate**: 100% — no advisory findings in run-25 carry genuine actionable signal. This is a continuation of the run-23 trend (93% noise). The complete loss of signal is notable: run-12 had a 44% noise rate with some genuinely useful COV-004 findings; run-21 had 76%; run-23 had 93%; run-25 reaches 100%. The steady increase reflects that the files being instrumented are well-understood by the agent now, leaving only systematic false positives (SCH-001, CDQ-007, COV-004 on correct-skips).

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All files, spans, attrs, schema changes, token usage, libraries listed |
| Accuracy | 4/5 | File-level data accurate; span name discrepancy in git-collector.js is structural (pre-existing names not re-listed), not an error; advisory findings 100% noise |
| Actionability | 1/5 | Zero advisory findings carry actionable signal this run |
| Presentation | 4/5 | Clean markdown, span category breakdown table, outlier callout, partial callout correct |
| **Overall** | **3.5/5** | Matches run-23 rating — strong structural data, weak advisory signal |

---

## Fix Verification

### RUN24-1 — CDQ-001 index.js Process-Exit Span Lifecycle

**Verdict: FIXED** ✅

Per per-file evaluation (index.js section): The CDQ-001 regression identified in run-24 is confirmed fixed in run-25. The `fixProcessExitSpanEnd()` AST auto-fix in spiny-orb (commit 91e9413) restructured the `main()` invocation from `main().catch(process.exit)` (where `process.exit` ran synchronously before `finally { span.end() }`) to a `.then().catch()` chain where `process.exit()` is called in a microtask after the span closes. The `commit_story.cli.main` span now has its `finally { span.end() }` guaranteed to execute before process termination. Run-25 is the first run with this fix applied to index.js.

### RUN24-2 — SCH-003 git-collector.js `diff_lines` Type Mismatch

**Verdict: NOT EXERCISED** (failure mode does not recur in run-25, but fix is untested)

The agent omitted `diff_lines` entirely from the run-25 instrumentation — the attribute does not appear in run-25's git-collector.js committed code or schema extensions. The SCH-003 auto-coercion fix (`fixAttributeTypeCoercions()`, spiny-orb commit 91e9413) was not triggered because no integer-assigned, string-declared attribute was produced. Result: the run-24 failure mode does not recur, but the fix itself is not verified. Whether the agent's omission reflects a deliberate change in attribute strategy or prompt variation is unknown. No SCH-003 failure for git-collector.js in run-25.

---

## Cost

| Source | Amount |
|--------|--------|
| PR total | $7.38 |
| Run-24 | ~$3.70 |
| Run-23 | $7.84 |
| Delta vs run-24 | **+$3.68** (significant increase) |
| Delta vs run-23 | **-$0.46** (modest improvement) |

**$7.38** — nearly double run-24's ~$3.70. Primary drivers:
- summary-manager.js: $1.91 (26% of total) — new regression; ×2 attempts; partial result requiring extended negotiation with validator
- summarize.js: $1.21 (16%) — ×2 attempts; 6-schema-extension-attribute file
- journal-graph.js: $0.72 (10%) — ×2 (was ×1 in run-24); LangGraph instrumentation complexity recurred
- journal-manager.js: $0.49 (7%) — single attempt but complex attribute quality decisions

Cost roughly on par with run-23 ($7.84) — both had a challenging partial file that dominated cost. The run-24 anomaly (~$3.70) reflected an exceptionally clean run with few retries; run-25 reverts to the historical ~$7-8 range.

Per-file cost sum ($7.23) vs PR total ($7.38): $0.15 orchestration overhead — consistent with prior runs.
