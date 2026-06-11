# Actionable Fix Output — Run-23

Self-contained handoff from evaluation run-23 to the spiny-orb team.

**Run-23 result**: 24/25 (96%) canonical quality, 13 committed, 1 partial (summary-detector.js, 4/5 functions), 0 failed, 45 spans, $7.84 cost. Gates 5/5. IS 80/100. Q×F 12.48.

**Run-21 → Run-23 delta**: Quality +4pp (92% → 96%), COV +20pp (4/5 → 5/5), CDQ +14pp (6/7 → 7/7), SCH -25pp (4/4 → 3/4 — new SCH-003 regression), IS -10pp (90/100 → 80/100 — SPA-002 recurrence), files +1 (12 → 13 committed), spans +3 (42 → 45, new all-time record), cost -$0.26 (~$8.10 → $7.84). Both P1 fixes confirmed. Run-22 was never executed.

**Target repo**: commit-story-v2 (same as runs 9–23)
**Branch**: `spiny-orb/instrument-1781089793056`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/75
**spiny-orb version**: 1.0.0 (main, post-b579e5a — fixes ee856c3, 412da5b, aad9835, b579e5a present)

---

## §1. Run-23 Score Summary

| Dimension | Score | Run-21 | Delta |
|-----------|-------|--------|-------|
| NDS | 2/2 (100%) | 2/2 (100%) | — |
| COV | **5/5 (100%)** | 4/5 (80%) | **+20pp** |
| RST | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | — |
| SCH | **3/4 (75%)** | 4/4 (100%) | **-25pp** |
| CDQ | **7/7 (100%)** | 6/7 (86%) | **+14pp** |
| **Total** | **24/25 (96%)** | **23/25 (92%)** | **+4pp** |
| **Gates** | **5/5** | **5/5** | **—** |
| **Files** | **13+1p** | **12+2f** | **+1 committed, 0 failed** |
| **Cost** | **$7.84** | **~$8.10** | **-$0.26** |
| **IS** | **80/100** | **90/100** | **-10pp** |
| **Q×F** | **12.48** | **11.0** | **+1.48** |

---

## §2. Prior Findings Assessment

| # | Finding | Priority | Status in Run-23 |
|---|---------|----------|-----------------|
| RUN21-1 | mcp/server.js NDS-003 blank-line-near-JSDoc variant | P1 | **RESOLVED** — issue #917 `removeOtelImports` trivia-doubling fix effective; committed clean in 1 attempt for the first time since run-19 |
| RUN21-2 | index.js NDS-003 + NDS-007 import expansion context pollution | P1 | **RESOLVED** — issue #916 "do not reformat single-line import blocks" guidance effective; committed clean in 1 attempt |
| RUN21-3 | CDQ-001 claude-collector.js double-end in `startActiveSpan` | P2 | **RESOLVED** — issue #915 `startActiveSpan` lifecycle clarification effective; no CDQ-001 failures in any committed file |
| RUN21-4 | COV-005 summary-manager.js `saveDailySummary` skip-path zero attrs | P2 | **RESOLVED** — `entry_date` now set before the early-return guard unconditionally; COV-005 PASS on all 9 summary-manager.js spans |
| RUN21-5 | index.js COV-005 — `commit_story.git.subcommand` unverifiable for 3rd run | Watch | **RESOLVED** — index.js committed; `commit_story.git.subcommand` confirmed present in span (null-guarded, also confirmed via Datadog trace `vcs.ref.head.revision: 5bfc917`). Note: final attribute key is `commit_story.git.subcommand`, not `commit_story.cli.subcommand` as originally tracked |
| RUN21-6 | Agent notes vs committed code divergence — two instances | Watch | **WATCH (not investigated)** — not specifically audited in run-23; still a structural observation about notes timing vs commit. No new instances flagged in run-23 per-file evaluation |
| RUN20-5 | mcp/server.js SCH-001 recurring span name | P3/Watch | **RESOLVED** — mcp/server.js committed for first time since run-19; span name `commit_story.mcp.server_start` registered in agent-extensions.yaml; SCH-001 PASS |

---

## §3. New Run-23 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN23-1 | SCH-003 — git-collector.js `diff_size` integer-as-string type mismatch | P2 | Schema Fidelity / SCH-003 |
| RUN23-2 | SCH-003 — commands/summarize.js `*_summaries_generated` integer-as-string type mismatch | P2 | Schema Fidelity / SCH-003 |
| RUN23-3 | summary-detector.js partial — SCH-002 near-synonym oscillation | P2 | Schema Fidelity / SCH-002 |
| RUN23-4 | IS SPA-002 recurrence — new orphan parentSpanId | Watch | IS / Context Propagation |

---

### RUN23-1: SCH-003 — git-collector.js `diff_size` Integer-as-String Type Mismatch (P2)

**What happened**: `git-collector.js` declares `commit_story.git.diff_size` as `type: string` in `agent-extensions.yaml`, but the committed instrumentation sets it with a bare integer:

```javascript
span.setAttribute('commit_story.git.diff_size', diff.length);
// diff.length is a number — passed directly without String() conversion
```

The OTel JS API's `setAttribute` accepts both strings and numbers at runtime (no TypeError). The schema declares `type: string`. The mismatch is silent until evaluation.

**Evidence from Datadog**: The IS scoring trace confirms the attribute appears as an integer: `"git.diff_size": 36391` in span `commit_story.git.get_commit_data`.

**Required fix**:
- Option A: Add `String()` conversion: `span.setAttribute('commit_story.git.diff_size', String(diff.length))`
- Option B: Change the schema declaration to `type: int` in `agent-extensions.yaml`

Option B is semantically correct — `diff.length` is a count and integer semantics are appropriate. The schema declaration was likely set to `type: string` as a conservative default; changing it to `type: int` would be the right fix and align with the auto-summarize pattern.

---

### RUN23-2: SCH-003 — commands/summarize.js `*_summaries_generated` Integer-as-String Type Mismatch (P2)

**What happened**: `commands/summarize.js` was newly instrumented in run-23. Three attributes are declared `type: string` in `agent-extensions.yaml` but set as bare integers:

```javascript
span.setAttribute('commit_story.summarize.daily_summaries_generated', result.generated.length);
span.setAttribute('commit_story.summarize.weekly_summaries_generated', result.generated.length);
span.setAttribute('commit_story.summarize.monthly_summaries_generated', result.generated.length);
// All three are numbers — no String() conversion
```

The identical attributes in `auto-summarize.js` are correctly wrapped: `String(result.generated.length)`. The agent that instrumented `commands/summarize.js` did not reference `auto-summarize.js`'s pattern for the same attributes.

**Root cause (both SCH-003 findings)**: The agent's context when instrumenting a file does not include the previously-committed instrumentation of *other* files in the same run. When `commands/summarize.js` was instrumented, `auto-summarize.js` had already been committed (correctly). But the agent had no visibility into that file's implementation — so the same attributes were set inconsistently. The current context window approach prevents reuse across files within a single run.

**Required fix**: Same as RUN23-1 — either add `String()` to the three `setAttribute` calls, or change the schema declarations to `type: int`. Schema change is preferred for semantic clarity; `generated.length` is a count.

**Prompt guidance path**: This class of failure could be caught if agents are instructed to always check the declared schema type before setting an attribute from a numeric source. Adding a step like "when setting an attribute from a `.length` or numeric expression, verify the declared type in `agent-extensions.yaml` and apply `String()` conversion if `type: string`" would prevent both RUN23-1 and RUN23-2.

---

### RUN23-3: summary-detector.js Partial — SCH-002 Near-Synonym Oscillation (P2)

**What happened**: summary-detector.js committed 4/5 exported async functions. `findUnsummarizedWeeks` was not committed because the agent declared `commit_story.journal.base_path` as a new attribute for the `basePath` parameter. The validator rejected it on both attempts as SCH-002 (near-synonym of registered `commit_story.journal.file_path`). No self-correction occurred.

**Regression**: In run-21, `findUnsummarizedWeeks` committed cleanly using `commit_story.summary.unsummarized_weeks_count` (an output-count attribute). Run-23's agent shifted to declaring an input-parameter attribute (`base_path`) instead. The function's `basePath` parameter is typically `'.'` — a configuration-level string that conveys little analytical value compared to an output count.

**Contrast with summary-graph.js (same run)**: summary-graph.js had a similar SCH-002 event in run-23 — the agent initially declared a near-synonym, received the rejection, and self-corrected by reverting to a registered attribute key on the next attempt. The `findUnsummarizedWeeks` agent did not self-correct across 2 attempts, suggesting the feedback loop is unreliable for this function.

**Root cause hypothesis**: The agent treats `basePath` (an input parameter named suggestively as a "base path") as a good attribute candidate because it is structurally similar to `file_path` attributes seen elsewhere. There is no guidance that prefers output-count attributes over input-parameter attributes, and no guidance that `'.'` (the actual runtime value) is a poor attribute candidate.

**Required fix — prompt guidance**:
1. When a function has both an input parameter and an output metric, prefer instrumentation attributes based on the output metric rather than the input parameter. Input parameters often have configuration-level values (like `'.'`) that add no observability value.
2. When the validator rejects an attribute as a near-synonym, the self-correction path should be "look for an existing registered attribute that captures the same semantic, or instrument a different output metric" — not "resubmit with the same attribute again."

**Target repo correction**: The correct instrumentation for `findUnsummarizedWeeks` would reuse `commit_story.summary.unsummarized_weeks_count` (as run-21 did) or `commit_story.journal.file_path` for the `basePath` value. Either is preferable to a new `base_path` attribute.

---

### RUN23-4 (Watch): IS SPA-002 Recurrence — New Orphan parentSpanId

**What happened**: IS scoring produced SPA-002: span `b5a83f5e` has `parentSpanId: 3a70d1c5`, but no span with ID `3a70d1c5` exists in the trace. This is an orphan span — the parent was never captured in the telemetry.

**History**: SPA-002 failed in runs 19 and 20 (different orphan span ID each time), then passed cleanly in run-21. Run-23 introduces a new orphan span ID. The run-21 pass was not a structural fix — it was an incidental outcome of that run's specific span composition.

**Context**: Run-23 added 3 new committed files compared to run-21 (mcp/server.js, index.js, commands/summarize.js) and one new partial file (summary-detector.js, 4/5 functions). One of these new additions likely introduces the broken parent chain. The orphan span `b5a83f5e` would need to be traced to its source file to identify the root cause.

**Datadog query for investigation**: `service:commit-story @service.instance.id:2140b04c-6055-4731-8b53-2d4225017478 @otel.trace_id:e41bf7dbf6a3a6424d36cabf57eee3d8` — look for span with ID `b5a83f5e` to identify the resource name and file.

**Impact**: SPA-002 failure drops IS from 90/100 (run-21) to 80/100 (run-23). Combined with SPA-001's worsening (25 spans vs 10-span limit), the IS regression is significant.

---

## §4. Notable Positives

**Both P1 fixes confirmed — first time both mcp/server.js and index.js committed in the same run.** mcp/server.js was blocked for 2 consecutive runs (20–21); index.js failed for the first time in run-21. Both landed clean in 1 attempt each in run-23. The cumulative fix effect (+2 committed files) pushed the span count to a new all-time record of 45.

**CDQ-001 fully resolved across the codebase.** No double-end pattern in any committed file. context-capture-tool.js (newly committed) uses `finally { span.end() }` correctly. index.js uses explicit `span.end()` in `finally` for a legitimate reason (process.exit() bypasses Promise resolution) — the per-file evaluation confirms this is the correct pattern for that specific case, distinguishable from the run-21 failure class.

**COV-005 resolved: summary-manager.js skip-path coverage restored.** All 9 summary-manager.js spans have ≥1 domain attribute. This was the only remaining COV failure after run-20.

**RUN20-5 resolved: mcp/server.js SCH-001 self-stabilized.** After 3 consecutive runs where the file failed to commit, run-23 confirms `commit_story.mcp.server_start` as the span name — consistent with what the agent used across all 3 run-21 attempts. No SCH-001 instability on this span.

**Journal-graph.js: sixth consecutive success** (runs 18, 19, 20, 21, 23 — run-22 never ran). Stable at 4 spans, consistent pattern.

**Cost reduction to $7.84** (-$0.26 from run-21, -$1.32 from run-20). The P1 fix confirmations eliminated retry chains on two historically difficult files.

**15th consecutive fully automatic push and PR.** PR #75 auto-created. The auto-push streak extends to runs 19–21, 23.

---

## §5. Carry-Forward Tracker (Open Items Entering Run-24)

| ID | Title | Priority | Status | Runs Open |
|----|-------|----------|--------|-----------|
| RUN23-1 | SCH-003: git-collector.js `diff_size` integer-as-string | P2 | Open — new in run-23 | 1 |
| RUN23-2 | SCH-003: commands/summarize.js `*_summaries_generated` integer-as-string | P2 | Open — new in run-23 | 1 |
| RUN23-3 | summary-detector.js SCH-002 partial — near-synonym attribute key | P2 | Open — regression from run-21's clean 5-span commit | 1 |
| RUN23-4 | IS SPA-002 recurrence — orphan parentSpanId b5a83f5e | Watch | Open — new instance (different from runs 19/20); run-21 clean pass was incidental | 1 |
| IS SPA-001 | INTERNAL span count structural | Structural | 25 INTERNAL spans vs 10-span calibration limit; worsening as committed file count grows | 9 |
| RUN21-6 | Agent notes vs committed code divergence | Watch | Not investigated in run-23 | 2 |

**Closed this run**: RUN21-1 (mcp/server.js NDS-003), RUN21-2 (index.js import expansion), RUN21-3 (CDQ-001 double-end), RUN21-4 (COV-005 skip-path), RUN21-5 (index.js subcommand attr), RUN20-5 (mcp/server.js SCH-001).

---

## Score Projection — Run-24

Assumes fixes for RUN23-1 and RUN23-2 (SCH-003 type mismatch) are the primary levers. summary-detector.js SCH-002 (RUN23-3) is the secondary lever.

| Scenario | Assumption | Projected Score | Q×F |
|----------|------------|-----------------|-----|
| Conservative | SCH-003 recurs on git-collector.js and/or summarize.js; summary-detector.js still partial | 24/25 (96%), 13+1p | 12.48 |
| Target | SCH-003 fixed on both files; summary-detector.js commits all 5 functions | 25/25 (100%), 14 files | 14.0 |
| Partial | SCH-003 fixed on one file; summary-detector.js still partial | 24/25 (96%), 13+1p OR 14 | 12.48–13.44 |

**Key insight**: The run-23 regression (SCH-003) is a new and relatively easy-to-fix failure class. The agents are setting numeric values on `type: string` attributes without applying `String()` conversion. A single prompt guidance line — "when setting an attribute declared as `type: string` from a numeric source (`.length`, count variable), always wrap with `String()`" — would likely prevent both RUN23-1 and RUN23-2.

The summary-detector.js SCH-002 partial is a different problem: the agent needs to prefer output-count attributes over input-parameter attributes when instrumenting functions. This is a semantic judgment call that requires guidance on what makes a "good" attribute candidate.

**SCH-003 schema fix path**: The two failing attributes (`diff_size`, `*_summaries_generated`) are all counts/sizes where `type: int` is semantically correct. Changing the schema declarations from `type: string` to `type: int` is the cleanest fix — it aligns the schema with the actual data type and eliminates the need for `String()` wrapping in the instrumented code.
