# Rubric Scores — Run-6

**Canonical source**: `rubric-scores.json`
**Aggregated from**: `per-file-evaluation.json`

---

## Score Summary

| | Run-4 | Run-5 | Run-6 | Delta (5→6) |
|---|-------|-------|-------|-------------|
| **Canonical score** | 15/26 (58%) | 23/25 (92%) | **21/25 (84%)** | **-8pp** |
| **Gates** | 4/5 | 5/5 | **5/5** | — |
| **Files committed** | 16 | 9 | **5** | **-4** |
| **Spans committed** | 38 | 17 | **9** | -8 |

**Both quality and coverage regressed from run-5.** Run-6 was designed to recover coverage while retaining quality. Neither goal was met.

---

## Gate Checks: 5/5 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-001 | PASS | 534/534 tests pass |
| NDS-002 | PASS | All pre-existing tests pass |
| NDS-003 | PASS | No non-instrumentation lines changed |
| API-001 | PASS | Only @opentelemetry/api imports |
| NDS-006 | PASS | ESM module consistency maintained |

---

## Dimension Scores

### NDS — Non-Destructiveness: 2/2 (100%)

| Rule | Result | Pass | Fail | Evidence |
|------|--------|------|------|----------|
| NDS-004 | PASS | 5/5 | 0 | All exported function signatures preserved |
| NDS-005 | PASS | 5/5 | 0 | All error handling behavior preserved; agent-added catches re-throw |

### COV — Coverage: 3/5 (60%)

| Rule | Result | Pass | Fail | Classification | Evidence |
|------|--------|------|------|---------------|----------|
| COV-001 | **FAIL** | 1/2 | 1 | Persistent (run-4) | index.js entry point: 0 spans. server.js: PASS |
| COV-002 | PASS | 5/5 | 0 | | All outbound calls covered |
| COV-003 | PASS | 5/5 | 0 | | Standard error recording on all committed files |
| COV-004 | PASS | 5/5 | 0 | | All async functions with spans |
| COV-005 | **FAIL** | 4/5 | 1 | Persistent (run-5) | server.js: zero attributes |
| COV-006 | N/A | — | — | | No auto-instrumentable operations |

### RST — Restraint: 3/4 (75%)

| Rule | Result | Pass | Fail | Classification | Evidence |
|------|--------|------|------|---------------|----------|
| RST-001 | PASS | 5/5 | 0 | | Utility functions correctly skipped |
| RST-002 | PASS | 5/5 | 0 | | No trivial accessors instrumented |
| RST-003 | PASS | 5/5 | 0 | | No duplicate wrapper spans |
| RST-004 | **FAIL** | 4/5 | 1 | New regression | git-collector: getCommitDiff + getMergeInfo are unexported internals |
| RST-005 | N/A | — | — | | No pre-existing OTel |

### API — API-Only Dependency: 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | PASS | @opentelemetry/api in peerDependencies |
| API-003 | PASS | No vendor SDKs |
| API-004 | PASS | No SDK-internal imports |

### SCH — Schema Fidelity: 3/4 (75%)

| Rule | Result | Pass | Fail | Classification | Evidence |
|------|--------|------|------|---------------|----------|
| SCH-001 | **FAIL** | 1/5 | 4 | Systemic new (SYS-RUN6-1) | 4/5 files misuse `commit_story.context.collect_chat_messages` |
| SCH-002 | PASS | 4/4 | 0 | | All attribute keys match registry |
| SCH-003 | PASS | 4/4 | 0 | | All attribute values correct types |
| SCH-004 | PASS | 5/5 | 0 | | No redundant schema entries |

### CDQ — Code Quality: 7/7 (100%)

| Rule | Result | Pass | Fail | Evidence |
|------|--------|------|------|----------|
| CDQ-001 | PASS | 5/5 | 0 | startActiveSpan + finally { span.end() } |
| CDQ-002 | PASS | 5/5 | 0 | trace.getTracer('commit-story') |
| CDQ-003 | PASS | 5/5 | 0 | Standard recordException + setStatus pattern |
| CDQ-005 | PASS | 5/5 | 0 | startActiveSpan callback preserves context |
| CDQ-006 | PASS | 5/5 | 0 | All attribute computations cheap |
| CDQ-007 | PASS | 5/5 | 0 | No unbounded or PII attributes |
| CDQ-008 | PASS | 5/5 | 0 | Consistent 'commit-story' tracer name |

---

## Schema Coverage Split

| Classification | Files | SCH-001 Impact |
|---------------|-------|---------------|
| **Schema-covered** | claude-collector.js | PASS — span name semantically correct |
| **Schema-uncovered** | git-collector.js, context-integrator.js, summary-manager.js, server.js | FAIL — all misuse registered name for validation compliance |

The schema coverage split reveals the root cause: only 1 file has a matching registry span definition. The other 4 committed files are "uncovered" and cannot have correct span names without registry expansion.

---

## Failure Classification

| Rule | Classification | Description |
|------|---------------|------------|
| COV-001 | **Persistent** (3 runs) | index.js blocked by COV-003 boundary + SCH-001 gap |
| COV-005 | **Persistent** (2 runs) | server.js zero attributes |
| RST-004 | **New regression** | git-collector unexported functions instrumented |
| SCH-001 | **Systemic new** (SYS-RUN6-1) | Single-span registry → forced name mismatch |

### Systemic Bug: SYS-RUN6-1

**Single-span registry creates perverse incentive.** The Weaver registry defines 1 span (`commit_story.context.collect_chat_messages`). The validator enforces strict SCH-001. The agent must choose:
- **Semantic accuracy** → fails validation → file stays partial
- **Validation compliance** → misleading span name → file commits but evaluator catches it

4/5 committed files chose compliance. 7 partial/failed files couldn't — their operations are too far from "collect chat messages."

**Fix**: Expand registry with ~8 span definitions. journal-manager.js would commit immediately (SCH-001 is its sole blocker).

---

## Superficial Resolution Tracking

Only 1 file recovered from partial→committed: **summary-manager.js**.

| Rule | Run-5 Status | Run-6 Status | Verdict |
|------|-------------|-------------|---------|
| NDS-005 | Latent (8 violations in partial files) | PASS | **Genuinely resolved** |
| CDQ-003 | Latent (in partial files) | PASS | **Genuinely resolved** |
| RST-001 | Correct skip, monitor | PASS | **Genuinely resolved** |

All three superficial resolutions are genuine — the DEEP-1 and DEEP-4 fixes worked for this file.

---

## Run-5 Score Projection Validation

| Tier | Predicted | Actual | Met? |
|------|-----------|--------|------|
| Minimum (RUN-1 only) | 96%, 10 files | 84%, 5 files | **No** |
| Target (RUN-1 + DEEP-1 + DEEP-4) | 96-100%, 14-16 files | 84%, 5 files | **No** |
| Stretch (+ EVAL-1) | 100%, 15-17 files | 84%, 5 files | **No** |

**All three tiers missed.** Root cause: projections assumed fixes wouldn't reveal new blockers. SCH-001 was hidden behind COV-003 and emerged when DEEP-1 partially fixed COV-003. This is exactly the "unmasked bug" risk documented in the projections — but at catastrophic scale.

---

## File Delivery Trend

| Run | Files Committed | Quality Score | Quality × Coverage |
|-----|----------------|---------------|-------------------|
| Run-2 | N/A | 74% | — |
| Run-3 | 17 | 73% | 73% on 17 files |
| Run-4 | 16 | 58% | 58% on 16 files |
| Run-5 | 9 | 92% | 92% on 9 files |
| **Run-6** | **5** | **84%** | **84% on 5 files** |

Run-5 improved quality at the cost of coverage. Run-6 was supposed to recover coverage — instead, both metrics declined. The quality × coverage product is the worst since run-4.
