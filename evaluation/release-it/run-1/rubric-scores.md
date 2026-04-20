# Rubric Scores — Release-it Run-1

**Date**: 2026-04-18
**Branch**: spiny-orb/instrument-1776550755270 (wiggitywhitney/release-it)
**PR**: Not created (PAT permission gap)

**Scoring status**: NOT SCOREABLE — 0 files committed with instrumentation. Quality dimensions cannot be assessed. This document records what can be evaluated and establishes the baseline for run-2 comparison.

---

## Gate Results

| Gate | Scope | Result | Evidence |
|------|-------|--------|----------|
| NDS-001 (Syntax) | Per-run | **PARTIAL** | 3 correct-skip files unchanged (implicit pass). config.js / index.js generated code rolled back — syntax unknown. 18 files not processed. |
| NDS-002 (Tests) | Per-run | **INCONCLUSIVE** | Test suite fails due to `tag.gpgsign=true` in global git config, not instrumentation. Pre-existing failure; no behavioral regression possible (0 files committed). |
| NDS-003 (Non-instrumentation lines) | Per-file | **N/A** | 0 files committed with instrumentation. 3 correct-skip files unchanged. |
| API-001 (Only @opentelemetry/api) | Per-file | **N/A** | 0 instrumented files committed. |
| NDS-006 (Module system) | Per-file | **N/A** | 0 instrumented files committed. |

**Gates**: 0/5 assessable for quality purposes. Infrastructure issues prevented any gate from being meaningfully evaluated.

---

## Dimension Scores

All quality dimensions require at least one committed instrumented file. With 0 committed files, no dimension can be scored. The entries below record what is known from agent reasoning (correct-skip decisions and failed-file notes).

### Non-Destructiveness (NDS)

| Rule | Result |
|------|--------|
| NDS-004 (API signatures preserved) | **N/A** — 0 instrumented files |
| NDS-005 (Error handling preserved) | **N/A** — 0 instrumented files |

**Correct-skip note**: All 3 correct-skip files are unchanged from original — NDS-003 passes trivially.

### Coverage (COV)

| Rule | Result | Notes |
|------|--------|-------|
| COV-001 (Entry points) | **N/A** | 0 instrumented files; 18 plugin files not reached |
| COV-003 (Failable ops) | **N/A** | 0 instrumented files |
| COV-004 (Async ops) | **N/A** | Agent reasoning on 2 failed files was sound (see per-file-evaluation.md) |
| COV-005 (Domain attributes) | **N/A** | 0 instrumented files |
| COV-006 (Auto-instrumentation) | **N/A** | 0 instrumented files |

### Restraint (RST)

| Rule | Result | Notes |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS (implicit)** | All 3 correct-skip files correctly excluded per RST-001 |
| RST-003 (No duplicate wrapper spans) | **N/A** | 0 instrumented files |
| RST-004 (No internal detail spans) | **N/A** | 0 instrumented files |
| RST-005 (No re-instrumentation) | **N/A** | 0 instrumented files |

### API-Only Dependency (API)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api: ">=1.0.0"` in peerDependencies |
| API-003 (No vendor SDKs) | **PASS** | No vendor OTel packages in dependencies or devDependencies |
| API-004 (No SDK imports) | **N/A** | 0 instrumented files committed |

### Schema Fidelity (SCH)

| Rule | Result | Notes |
|------|--------|-------|
| SCH-001 (Span names) | **N/A** | 0 committed spans |
| SCH-002 (Attribute keys) | **N/A** | 0 committed attributes |
| SCH-003 (Attribute types) | **N/A** | 0 committed attributes |
| SCH-004 (No redundant entries) | **N/A** | 0 committed entries |

### Code Quality (CDQ)

| Rule | Result | Notes |
|------|--------|-------|
| CDQ-001 (Spans closed) | **N/A** | 0 committed spans |
| CDQ-002 (Tracer name) | **N/A** | 0 committed files with tracer |
| CDQ-003 (Error recording) | **N/A** | 0 committed spans |
| CDQ-005 (Async context) | **N/A** | 0 committed spans |
| CDQ-006 (Expensive guards) | **N/A** | 0 committed files |
| CDQ-007 (No unbounded/PII) | **N/A** | 0 committed files |
| CDQ-008 (Consistent naming) | **N/A** — advisory | PR summary advisory fires (expected) |

---

## Overall Score

| Dimension | Score |
|-----------|-------|
| NDS | Not scoreable |
| COV | Not scoreable |
| RST | Not scoreable (RST-001 pass for correct skips noted) |
| API | 2/2 assessable rules PASS (API-004 N/A) |
| SCH | Not scoreable |
| CDQ | Not scoreable |
| **Quality total** | **Not calculable** |
| **Gates** | **Not assessable** |

---

## Canonical Metrics

| Metric | Run-1 | Notes |
|--------|-------|-------|
| Quality score | N/A | 0 committed files |
| Gates | N/A | Infrastructure blockers |
| Files processed | 5/23 | Run halted at checkpoint |
| Files committed | 0 | LINT failures on only 2 instrumented candidates |
| Total spans | 0 | — |
| Cost | $0.68 | 5 files processed; 22m 24s |
| Push | Branch pushed | spiny-orb/instrument-1776550755270 |
| PR | NO | PAT permission gap |
| Duration | 22m 24s | For 5 files; estimated 31 min for full 23 files |

---

## Identified Quality Signals (pre-commit, from agent reasoning)

Even though no files were committed, the agent's reasoning on the 2 failed files provides early-run quality signals:

| Signal | Assessment | Relevant rule |
|--------|-----------|---------------|
| Config.init() correctly identified as sole async entry point | SOUND | COV-001 |
| Internal async helpers correctly excluded via RST-004 | SOUND | RST-004 |
| runTasks correctly identified as sole exported async function | SOUND | COV-001 |
| process.exit() CDQ-001 gap identified and documented | SOUND | CDQ-001 |
| Null guards on reduceUntil returns correctly applied | SOUND | CDQ-007 |
| `arrowParens: avoid` formatting not applied (likely cause of LINT failure) | **DEFICIENCY** | LINT |

The agent's design quality is high — the LINT failure is a code-generation style issue, not an instrumentation logic failure. Design quality signals are positive, with one formatting deficiency (arrowParens: avoid not applied in generated code).

---

## Run-2 Implications

Run-1 establishes no quality baseline — it cannot be compared numerically to commit-story-v2. Run-2 must resolve three blockers before the rubric can be scored:

1. **Checkpoint test** — resolve gpgsign issue so all 23 files are processed
2. **LINT oscillation** — surface Prettier diff so agent can self-correct arrowParens
3. **PAT permissions** — add pull_request:write so PR is created and PR summary quality can be evaluated

If all three are resolved, run-2 should produce a full baseline across all 23 files.
