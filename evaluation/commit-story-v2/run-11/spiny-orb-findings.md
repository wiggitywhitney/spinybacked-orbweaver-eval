# Spiny-Orb Findings — Run-11

Findings from evaluation run-11 to hand off to the spiny-orb team.

**Run-11 result**: 25/25 (100%) quality, 13 files committed, PR #60 created (first push success in 9 runs).
**Run-10 findings**: 4 findings (RUN10-1 through RUN10-4), all fixed and verified.

---

## Run-10 Finding Assessment

| # | Finding | Status in Run-11 |
|---|---------|-----------------|
| RUN10-1 | Push auth: token rejected | **FIXED** — PR #60 created. Fine-grained PAT with push permissions. |
| RUN10-2 | Weaver CLI fails on large registry | **FIXED** — summary-manager.js committed (9 spans, 1st attempt). Retry logic worked. |
| RUN10-3 | Boolean attrs declared as string (SCH-003) | **FIXED** — `commit_story.summarize.force` declared as `type: boolean`. |
| RUN10-4 | Optional chaining without guard (CDQ-007) | **FIXED** — Agent uses ternary guards or drops optional attributes. Zero `?.` in setAttribute. |

**Summary**: 4/4 findings fixed. Best fix rate across all runs.

---

## New Run-11 Findings (5)

### RUN11-1: Advisory Contradiction Rate 45% (Low)

PR summary advisories include 5 incorrect recommendations out of 11 non-trivial:
- SCH-004 judge hallucinated `summarize.force` = `gen_ai.request.max_tokens`
- CDQ-006 judge flagged `toISOString()` despite trivial-conversion exemption

Improved from run-9's 67% but above 30% target.

### RUN11-2: journal-graph.js Requires 2 Attempts (Low)

Improved from 3 attempts (run-10) to 2. Stretch goal was 1. Large file (24.8K output tokens). Validator catches issues on first attempt. Cost difference: ~$0.30 per extra attempt.

### RUN11-3: Redundant span.end() in 2 Files (Low)

index.js and summary-graph.js have code paths where `span.end()` is called explicitly AND in a finally block. In index.js, explicit calls before `process.exit()` are necessary (bypasses finally). In summary-graph.js, early-exit calls may be redundant. OTel spec: double-close is no-op.

### RUN11-4: Cost $4.25 Exceeds $4.00 Target (Low)

$0.25 over target. 6 files required 2 attempts. journal-graph.js (24.8K) and summary-graph.js (29.8K) are biggest contributors.

### RUN11-5: CDQ-007/NDS-003 Conflict Causes Attribute Dropping (Medium)

CDQ-007 (no `?.` in setAttribute) conflicts with NDS-003 (non-instrumentation lines unchanged). Guarding optional attributes with `if (value !== undefined)` blocks is treated as non-instrumentation code by NDS-003 validator. Agent resolves by:
1. Dropping the attribute entirely (index.js: messages_count; journal-graph.js: gen_ai.usage.*)
2. Using ternary expressions (summary-graph.js: `entries ? entries.length : 0`)

Fix: Teach NDS-003 validator to recognize defined-value guards as instrumentation patterns.
