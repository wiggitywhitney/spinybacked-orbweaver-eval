# Actionable Fix Output — Run-11

Self-contained handoff from evaluation run-11 to the spiny-orb team.

**Run-11 result**: 25/25 (100%) canonical quality, 13 files committed, $4.25 cost in 41.2 minutes. Quality restored to run-9's perfect 100%. PR #60 created — first successful push in 9 runs.

**Run-10 → Run-11 delta**: +8pp quality (92% → 100%), +1 file (12 → 13), -$0.11 cost ($4.36 → $4.25), push SUCCESS (was FAIL).

**Target repo**: commit-story-v2 proper (same as runs 9-10)
**Branch**: `spiny-orb/instrument-1774849971011`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/60

---

## §1. Run-11 Score Summary

| Dimension | Score | Run-10 | Delta | Failures |
|-----------|-------|--------|-------|----------|
| NDS | 2/2 (100%) | 2/2 | — | — |
| COV | 5/5 (100%) | 5/5 | — | — |
| RST | 4/4 (100%) | 4/4 | — | — |
| API | 3/3 (100%) | 3/3 | — | — |
| SCH | 4/4 (100%) | 3/4 | **+25pp** | — |
| CDQ | 7/7 (100%) | 6/7 | **+14pp** | — |
| **Total** | **25/25 (100%)** | **23/25** | **+8pp** | **0 failures** |
| **Gates** | **5/5 (100%)** | **5/5** | — | — |
| **Files** | **13** | **12** | **+1** | summary-manager.js recovered |
| **Cost** | **$4.25** | **$4.36** | **-$0.11** | — |
| **Push/PR** | **YES (PR #60)** | **NO** | **Fixed** | 8-run streak broken |
| **Q x F** | **13.0** | **11.0** | **+2.0** | New all-time high |

---

## §2. Remaining Quality Rule Failures (0)

**None.** All 25 quality rules pass across all 13 committed files. This is the second perfect score (after run-9) and the first to also include a successful PR.

---

## §3. Run-10 Findings Assessment

| # | Finding | Priority | Run-10 | Run-11 | Notes |
|---|---------|----------|--------|--------|-------|
| RUN10-1 | Push auth: token rejected | Critical | FAIL | **FIXED** | Fine-grained PAT with push permissions. PR #60 created. |
| RUN10-2 | Weaver CLI fails on large registry | Medium | FAIL | **FIXED** | summary-manager.js committed (9 spans, 1st attempt). Retry logic likely prevented transient failure. |
| RUN10-3 | Boolean attrs as string (SCH-003) | Medium | FAIL | **FIXED** | `force` declared as `type: boolean` in agent-extensions.yaml. `is_merge` not used this run. |
| RUN10-4 | Optional chaining without guard (CDQ-007) | Low | FAIL | **FIXED** | Agent uses ternary guards or drops optional attributes. Zero `?.` in setAttribute. |

**Summary**: 4/4 findings fixed. Best fix rate across all runs.

---

## §4. New Run-11 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN11-1 | Advisory contradiction rate still 45% | Low | Output quality |
| RUN11-2 | journal-graph.js still requires 2 attempts | Low | Cost |
| RUN11-3 | CDQ-001 redundant span.end() in 2 files | Low | Code style |
| RUN11-4 | Cost $4.25 exceeds $4.00 target | Low | Cost |
| RUN11-5 | CDQ-007/NDS-003 conflict causes attribute dropping | Medium | Rule interaction |

### RUN11-1: Advisory Contradiction Rate 45%

The PR summary's advisory findings include 5 incorrect recommendations out of 11 non-trivial advisories (45%). Improved from run-9's 67% but still above the 30% target:
- SCH-004 judge hallucinated semantic equivalence between `summarize.force` (boolean flag) and `gen_ai.request.max_tokens` (token limit)
- CDQ-006 judge flagged `toISOString()` and `getDateString()` despite trivial-conversion exemption

**Priority**: Low — advisories are informational only, not actionable by reviewers.

### RUN11-2: journal-graph.js Still Requires 2 Attempts

journal-graph.js improved from 3 attempts (run-10) to 2, but the stretch goal of 1 attempt was not met. The file is large (24.8K output tokens) and the validator catches issues on the first attempt.

**Priority**: Low — 2 attempts is acceptable. Cost difference: ~$0.30 per extra attempt.

### RUN11-3: Redundant span.end() in index.js and summary-graph.js

Both files have code paths where `span.end()` is called explicitly before a return/exit AND in a finally block. Per OTel spec, double-close is a no-op, so this is harmless. In index.js, the explicit calls before `process.exit()` are necessary (process.exit bypasses finally). In summary-graph.js, early-exit span.end() before return may be redundant if the return exits through the finally block.

**Priority**: Low — style issue, not a correctness issue.

### RUN11-4: Cost $4.25 Exceeds $4.00 Target

$0.25 over target, primarily due to 6 files requiring 2 attempts. journal-graph.js (24.8K output) and summary-graph.js (29.8K output) are the biggest contributors.

**Priority**: Low — within acceptable range and cheaper than run-10.

### RUN11-5: CDQ-007/NDS-003 Conflict Causes Attribute Dropping

The CDQ-007 fix (no `?.` in setAttribute) conflicts with NDS-003 (non-instrumentation lines unchanged) when guarding optional attributes requires `if` blocks that the NDS-003 validator treats as non-instrumentation code. The agent resolves this by:
1. Dropping the attribute entirely (index.js: messages_count; journal-graph.js: gen_ai.usage.*)
2. Using ternary expressions (summary-graph.js: `entries ? entries.length : 0`)

The ternary approach preserves the attribute. The dropping approach loses potentially valuable telemetry data. Neither violates any rubric rule, but the conflict means the agent can't fully instrument optional attributes.

**Priority**: Medium — affects attribute completeness on files with optional data sources.

**Fix options**:
1. Teach the validator that `if (value !== undefined) { span.setAttribute(...) }` is an instrumentation pattern, not business logic
2. Accept ternary as the standard workaround
3. Accept attribute dropping as acceptable when data is truly optional

---

## §5. Priority Action Matrix

### P0 — No items

No quality failures to fix. All P0 items from run-10 are resolved.

### P1 — Should address

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Teach NDS-003 validator to recognize defined-value guards as instrumentation | RUN11-5 | `if (x !== undefined) { span.setAttribute(...) }` not flagged by NDS-003 |

### P2 — Nice to have

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Reduce journal-graph.js to 1 attempt | RUN11-2 | First-attempt success, cost < $0.30 |
| Fix SCH-004 judge false positives | RUN11-1 | Advisory contradiction rate < 30% |
| Reduce redundant span.end() calls | RUN11-3 | No double-close in summary-graph.js early exits |

---

## §6. Run-11 Verification Checklist

1. Push auth: PR created successfully (**YES** — PR #60)
2. Quality: 25/25 (**YES** — second perfect score)
3. Files committed: ≥13 (**YES** — 13 files)
4. SCH-003: boolean attributes correct type (**YES** — force=boolean)
5. CDQ-007: no `?.` in setAttribute (**YES** — ternary/drop patterns)
6. PR schema changes: includes span extensions (**YES** — 39 span extensions listed)
7. Weaver CLI: completes for all files (**YES** — 0 failures)
8. Pre-run: fresh build verified (**YES** — spiny-orb v0.1.0 from 0395958)
9. Cost: ≤$4.00 (**NO** — $4.25, +$0.25 over target)
10. Test suite: 564+ tests pass (**YES** — 564 pass, 0 failures)

**9/10 criteria met.** Only cost target missed by $0.25.

---

## §7. Score Projections for Run-12

### Minimum (no fixes)

- **Quality**: 25/25 (100%) — no known quality failures
- **Files**: 13 (same file set)
- **Push/PR**: YES (token working)
- **After 50% discount**: 24-25/25, 12-13 files, PR likely

### Target (P1 fix: NDS-003 validator update)

- **Quality**: 25/25, attributes more complete (optional attrs preserved)
- **Files**: 13
- **Cost**: ≤$4.00 if journal-graph.js hits 1 attempt
- **After 50% discount**: 25/25, 13 files

### Stretch (all fixes)

- **Quality**: 25/25, full attribute coverage
- **Files**: 13
- **Cost**: ~$3.50 (journal-graph.js first-attempt)
- **Advisory contradiction rate**: <30%
- **After 50% discount**: 25/25, 13 files

### Calibration

Run-10 projected 24-25/25 after discount → actual 25/25. The discount was conservative because all fixes landed cleanly and no new failure types emerged. For run-12, the risk is that LLM variation introduces a new failure type we haven't seen before. The 50% discount should apply to the "no new failures" assumption, not the fix effectiveness.

**Expected run-12 range**: 24-25/25, 13 files, PR created, $4-5 cost.
