# Actionable Fix Output — Run-14

Self-contained handoff from evaluation run-14 to the spiny-orb team.

**Run-14 result**: 22/25 (88%) canonical quality, 12 committed, 0 failed, 0 partial, $5.59 cost in 54.3 minutes. Quality regressed from run-13's perfect 100%. PR #65 created — fourth consecutive successful push.

**Run-13 → Run-14 delta**: -12pp quality (100% → 88%), +5 files (7 → 12), -$0.82 cost (~$6.41 → $5.59), push SUCCESS (fourth consecutive).

**Target repo**: commit-story-v2 proper (same as runs 9-13)
**Branch**: `spiny-orb/instrument-1776263984892`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/65

---

## §1. Run-14 Score Summary

| Dimension | Score | Run-13 | Delta | Failures |
|-----------|-------|--------|-------|----------|
| NDS | 2/2 (100%) | 2/2 | — | — |
| COV | 3/5 (60%) | 5/5 | **-40pp** | COV-003: journal-graph.js summaryNode; COV-004: summary-manager.js |
| RST | 4/4 (100%) | 4/4 | — | — |
| API | 3/3 (100%) | 3/3 | — | — |
| SCH | 4/4 (100%) | 4/4 | — | — |
| CDQ | 6/7 (86%) | 7/7 | **-14pp** | CDQ-003: journal-graph.js summaryNode |
| **Total** | **22/25 (88%)** | **25/25** | **-12pp** | **3 failures** |
| **Gates** | **5/5 (100%)** | **5/5** | — | — |
| **Files** | **12** | **7** | **+5** | 0 failures, 0 partials |
| **Cost** | **$5.59** | **~$6.41** | **-$0.82** | — |
| **Push/PR** | **YES (PR #65)** | **YES (#62)** | Fourth consecutive | — |
| **Q×F** | **10.6** | **7.0** | **+3.6** | — |
| **IS Score** | **80/100** | **N/A** | First run | — |

---

## §2. Quality Rule Failures (3 canonical)

### COV-003 + CDQ-003: journal-graph.js — summaryNode Catch Block Missing Error Recording

**File**: src/generators/journal-graph.js
**Functions affected**: summaryNode only

**COV-003 failure**: summaryNode's catch block returns a fallback state without any error recording call (no `recordException`, `setStatus`, or error-related `setAttribute`). The span ends via `finally` with OK status even when the LLM call fails — telemetry shows the operation as successful during a real failure.

**CDQ-003 failure**: Standard error recording pattern (`span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })`) is absent from summaryNode's catch block.

**The inconsistency**: technicalNode and dialogueNode in the same file — instrumented on the same run — both have correct error recording:
```javascript
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  return { technicalDecisions: '[Technical decisions extraction failed]', errors: [...] };
}
```

summaryNode's catch does not:
```javascript
} catch (error) {
  return { summary: '[Summary generation failed]', errors: [...] };
}
```

**Root cause**: summaryNode was instrumented after 3 consecutive NDS-003 Code Preserved failures (runs 11–13) and required 3 attempts. The catch block pattern was written correctly in the later nodes (technicalNode, dialogueNode) but summaryNode's implementation was not updated to match during the 3-attempt retry cycle.

**Agent note**: The agent's stated intent (documented in the log) explicitly says "span.recordException and span.setStatus(ERROR) are still added because the error is a genuine failure, not expected control flow" — this is only true for technicalNode and dialogueNode; summaryNode contradicts the stated intent.

**Fix needed**: In the agent instrumentation prompt, add guidance: when instrumenting multiple LangGraph nodes in the same file that all return error objects rather than rethrowing, the catch-block error recording pattern must be consistent across all nodes. The `recordException + setStatus(ERROR)` pattern should be applied to all catch blocks that handle genuine LLM failures, regardless of whether the node rethrows or returns degraded state.

---

### COV-004: summary-manager.js — 6 Exported Async I/O Functions Without Spans (3rd Consecutive Run)

**File**: src/managers/summary-manager.js
**Failure**: Same as runs 12 and 13 (this run was the first time the file committed since run-11, but the same COV-004 pattern appeared).

6 exported async filesystem I/O functions without spans:
- `readDayEntries` — reads journal entries from disk
- `saveDailySummary` — writes daily summary to disk
- `readWeekDailySummaries` — reads weekly summaries from disk
- `saveWeeklySummary` — writes weekly summary to disk
- `readMonthWeeklySummaries` — reads monthly summaries from disk
- `saveMonthlySummary` — writes monthly summary to disk

**Agent reasoning**: "Skipped to stay within the ~20% ratio backstop. Their I/O is covered through context propagation."

**Why this is a failure (unchanged from run-12)**: All 6 are exported (RST-004 exemption for unexported functions does not apply), all are async, all perform filesystem I/O. COV-004 requires a span on each. "Context propagation" provides visibility into the I/O happening *within* a parent span; it does not satisfy the COV-004 requirement that each exported async function has its own span.

**Run-11 comparison**: Run-11 correctly instrumented all 9 exported async functions with 9 spans. This is now 3 consecutive runs with COV-004 failing on this file — it has the character of a structural agent behavior gap rather than one-time LLM variation.

**Fix needed**: Add a validator check or prompt guidance: for files where some exported async functions have spans, flag any remaining exported async functions that perform I/O as COV-004 violations. The ratio-backstop heuristic should not override COV-004. The check could enumerate functions exported from the file that contain `await` and known I/O patterns (`readFile`, `writeFile`, `appendFile`, `readdir`, `mkdir`).

---

## §3. Run-13 Findings Assessment

| # | Finding | Priority | Status in Run-14 |
|---|---------|----------|-----------------|
| RUN13-1 | Checkpoint rollback discards innocent files — 10 files lost to cascade | P1 | **RESOLVED** — smart rollback fix (#437, #447) landed; 0 checkpoint failures in run-14 |
| RUN13-2 | Type-safety gaps: `null !== undefined` guard, Date/string timestamp | P1 | **RESOLVED** — `!= null` guidance (#435) and Date/string fix (#436) landed; summary-graph.js and journal-manager.js both committed cleanly |
| RUN13-3 | summaryNode NDS-003 Code Preserved — 3rd consecutive run | P1 | **RESOLVED** — fix (#438) landed; summaryNode instrumented for the first time. New failure introduced (COV-003 + CDQ-003) — see §2 |
| RUN13-4 | journal-graph.js partial not committed to instrument branch | Low | **CONFIRMED FIXED** — journal-graph.js fully committed in run-14 with 4 spans |
| RUN13-5 | Advisory contradiction rate 67% | Low | **IMPROVED** — 40% in run-14 (2 incorrect out of 5 non-trivial findings). SCH-004 namespace pre-filter fix (#440) significantly reduced false positives. |
| RUN13-6 | Cost ~$6.41, highest ever | Low | **IMPROVED but not resolved** — $5.59 in run-14 (-$0.82). Still above $4.00 target. |

**Summary**: 3 P1 findings resolved (RUN13-1, RUN13-2, RUN13-3). RUN13-3 resolution introduced 2 new failures (COV-003 + CDQ-003). 2 low findings improved (RUN13-5, RUN13-6). 0 unresolved P1 items from run-13 carry forward.

---

## §4. New Run-14 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN14-1 | summaryNode catch block missing error recording | P1 | Code quality / Coverage |
| RUN14-2 | COV-004 on summary-manager.js — 3rd consecutive run | P1 | Coverage |
| RUN14-3 | Cost still above $4.00 — 4th consecutive run over target | Low | Cost |
| RUN14-4 | IS SPA-001: journal trace has 12 INTERNAL spans (limit 10) | Low | IS scoring |
| RUN14-5 | IS RES-001: no service.instance.id | Low | IS scoring |

### RUN14-3: Cost $5.59 — 4th Consecutive Run Above $4.00 (Low)

The $4.00 target has not been met since run-9 ($3.97). Run-14 at $5.59 represents -$0.82 vs run-13 but remains $1.59 over target. The persistent driver is 3-attempt files: journal-graph.js ($1.52, 3 attempts) and summary-manager.js ($1.13, 3 attempts) together account for 47% of total cost. If these two files reach 1-2 attempts, the run would cost ~$3.00 (below target).

journal-graph.js has required 3 attempts in runs 12, 13, and 14 — the same 3-attempt pattern for 3 consecutive runs. This is now a structural cost concern. The root cause of the retry failures in journal-graph.js is not documented; a run-level investigation of the instrumentation.md file for journal-graph.js could identify what the validator is catching on attempts 1 and 2.

### RUN14-4: IS SPA-001 — 12 INTERNAL Spans in Journal Trace (Low)

One trace (trace ID e6b2155e) had 12 INTERNAL spans, exceeding the SPA-001 limit of 10. This is the journal generation trace, which spans:
- `commit_story.context.gather_context` (context-integrator.js)
- `commit_story.context.collect_chat_messages` (claude-collector.js)
- `commit_story.git.get_commit_data` + `commit_story.git.get_previous_commit_time` (git-collector.js)
- `commit_story.journal.generate_sections` (journal-graph.js)
- `commit_story.ai.generate_summary` + `commit_story.journal.technical_node` + `commit_story.journal.dialogue_node` (journal-graph.js nodes)
- `commit_story.journal.save_entry` + `commit_story.journal.discover_reflections` (journal-manager.js)
- auto-summarize spans (3 more)

The span count is structurally correct — each span covers a distinct observable operation. SPA-001 is a heuristic limit, not a hard rule. The number of INTERNAL spans in the main execution trace may naturally increase as more functions are instrumented. 12 vs 10 is close to the boundary. Worth monitoring.

### RUN14-5: IS RES-001 — No service.instance.id (Low)

The `examples/instrumentation.js` SDK setup file does not set `service.instance.id`. This is a standard deployment oversight — most library-focused instrumentation omits it. The fix belongs in `examples/instrumentation.js`, not in spiny-orb's agent (the SDK setup file is excluded from spiny-orb instrumentation scope). As a one-time add to the SDK bootstrap, this would bring the IS score to 90/100 (eliminating the -2 weighted point penalty).

---

## §5. Prioritized Fix Recommendations

### P1 — RUN14-1: Consistent LangGraph Node Catch-Block Error Recording

**Problem**

Three LangGraph nodes in journal-graph.js make LLM calls and have spans: summaryNode, technicalNode, dialogueNode. technicalNode and dialogueNode correctly add `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` in their catch blocks. summaryNode does not.

The agent's stated intent was to add these to all three — the implementation is inconsistent.

**Proposed Fix**

Add prompt guidance for LangGraph node instrumentation pattern: when multiple nodes in the same file follow the same pattern (exported async function → `tracer.startActiveSpan` → try/catch/finally → catch returns degraded state without rethrowing), the error recording calls must be applied uniformly to all catch blocks. A node that returns `{ summary: '[failed]', errors: [...] }` instead of rethrowing is still experiencing a genuine LLM failure — the span must reflect this.

The correct pattern:
```javascript
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  return { summary: '[Summary generation failed]', errors: [...] };
}
```

**Acceptance Criteria**

- summaryNode catch block includes `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })`
- COV-003 and CDQ-003 pass for all three LangGraph nodes
- The validator or a post-processing check flags inconsistent catch-block error recording within the same file when all functions follow the same pattern

---

### P1 — RUN14-2: COV-004 Enforcement for Exported Async I/O Functions

**Problem**

summary-manager.js has failed COV-004 in runs 12, 13 (was rolled back, so implicit), and 14. The agent consistently applies a ratio-backstop heuristic to skip 6 exported async I/O functions, citing "context propagation" as justification.

**Proposed Fix**

Add a post-instrumentation validator check: after the agent instruments a file, enumerate all exported async functions that contain `await` expressions or calls to known I/O libraries (`readFile`, `writeFile`, `appendFile`, `readdir`, `mkdir`, `access`, `stat`). If any such function lacks a span, emit a COV-004 advisory finding with the function name. The check should not block commit but should feed into the agent's fix loop so the agent has an opportunity to add the missing spans.

This is distinct from the current advisory COV-004 (which fires on the full file) — a per-function check would give the agent actionable line-level guidance.

**Acceptance Criteria**

- `readDayEntries`, `saveDailySummary`, `readWeekDailySummaries`, `saveWeeklySummary`, `readMonthWeeklySummaries`, `saveMonthlySummary` all have spans in the next eval run
- COV-004 passes for summary-manager.js
- The span ratio count for summary-manager.js increases from 3/14 to 9/14

---

## §6. Unresolved Items from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| COV-003 + CDQ-003: summaryNode catch | **RUN14-1** | **1 run** | P1 — new in run-14 |
| COV-004: summary-manager.js 6 async I/O | RUN12-1 | **3 runs** | P1 — persistent structural gap |
| journal-graph.js 3 attempts | RUN12-4 | **3 runs** | Low — cost driver, root cause not investigated |
| Cost above $4.00 | RUN11-4 | **4 runs** | Low — $5.59 in run-14 |
| Advisory contradiction rate | RUN11-1 | 4 runs | Improving: 67% → 40%; SCH-004 filter helped |
| IS SPA-001: journal trace span depth | **RUN14-4** | **1 run** | Low — 12 vs 10 limit; monitor |
| IS RES-001: no service.instance.id | **RUN14-5** | **1 run** | Low — SDK setup fix, not spiny-orb scope |
| RUN7-7 span count self-report | Run-7 | 8 runs | Structurally unchanged |
| CJS require() in ESM projects | Run-2 | 13 runs | Open spec gap, not triggered |

---

## §7. Score Projections for Run-15

### Conservative (fixes land, LLM variation causes some retry)

- **Quality**: 25/25 (100%) — if COV-003/CDQ-003 fix lands cleanly for summaryNode; COV-004 still at risk if guidance doesn't fully land
- **Files**: 12–13 — similar to run-14; smart rollback and type-safety fixes remain active
- **Cost**: ~$4.50–5.50 — 3-attempt files remain; no expected cost reduction without journal-graph.js retry fix

### Target (both P1 fixes land)

- **Quality**: 25/25 (100%)
- **Files**: 13 — summary-manager.js potentially adds 6 spans (would make it cleaner even if file count stays same)
- **Cost**: ~$4.00–5.00 — still driven by journal-graph.js retry pattern

### Stretch (all P1 fixes + journal-graph.js retry reduction)

- **Quality**: 25/25, full attribute coverage
- **Files**: 13
- **Cost**: ≤$4.00 — requires journal-graph.js reaching 2 attempts
