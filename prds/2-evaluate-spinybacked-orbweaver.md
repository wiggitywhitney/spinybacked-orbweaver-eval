# PRD #2: Evaluate SpinybackedOrbWeaver Telemetry Agent Against commit-story-v2-eval

**Status:** Draft
**Created:** 2026-03-07
**GitHub Issue:** [#2](https://github.com/wiggitywhitney/commit-story-v2-eval/issues/2)

---

## Problem Statement

SpinybackedOrbWeaver — the new telemetry agent implementation built from spec v3.9 — has phases 1–6 complete (332 tests passing) and is approaching release readiness. The previous implementation (telemetry-agent-spec-v3) was evaluated in telemetry-agent-research PRDs #1–3 and scored 79% on the rubric but had catastrophic system-level failures: "332 unit tests pass, nothing works" — unwired CLI, broken validation chain, silent failures that wasted $5.50 across 7 failed runs.

SpinybackedOrbWeaver was built specifically to address those findings, but it has not yet been evaluated against real code. We need to run the same evaluation process to verify the new implementation actually works end-to-end and to measure improvement.

## Solution Overview

Run SpinybackedOrbWeaver against this repo's JavaScript codebase using the existing 31-rule evaluation rubric (at `spinybacked-orbweaver/research/evaluation-rubric.md`), score the output, and compare against the previous evaluation/run-1 baseline.

### Key Inputs (Already Exist)

- **Evaluation rubric**: 4 gate checks (NDS-001, NDS-002, NDS-003, API-001) + 27 quality rules across 6 dimensions (Non-Destructiveness, Coverage, Restraint, API Dependency, Schema Fidelity, Code Quality) + 19 Instrumentation Score rules. 28 of 30 code rules are fully automatable.
- **Codebase mapping**: `spinybacked-orbweaver/research/rubric-codebase-mapping.md` — maps every rubric rule to specific functions, call sites, and error-handling locations in commit-story-v2.
- **Weaver schema**: `telemetry/registry/` with custom attributes for the commit-story domain.
- **Baseline (evaluation/run-1)**: 4 files instrumented, 3 correctly skipped, 7 spans added. Previous report, patterns doc, and rubric scores at `telemetry-agent-research/evaluation/`.
- **Target codebase**: JavaScript (not TypeScript) — a critical finding from the last evaluation.

### Evaluation Interface

SpinybackedOrbWeaver has three interfaces: CLI (`orb init` / `orb instrument`), MCP server, and GitHub Action. The CLI is the primary evaluation interface.

## Success Criteria

1. SpinybackedOrbWeaver runs against commit-story-v2-eval without catastrophic failures
2. Full 31-rule rubric scored with per-rule evidence
3. Clear baseline comparison showing improvement (or regression) vs run-1
4. All findings filed as issues on spinybacked-orbweaver repo
5. Gap analysis documents any new rubric gaps or spec gaps discovered

## Milestones

- [ ] **Pre-flight verification** — SpinybackedOrbWeaver builds and runs against this repo: Weaver schema validates, `orb init` succeeds, `orb instrument --dry-run` produces a cost ceiling without errors. Rubric codebase mapping verified against current source; any mapping drift documented.
- [ ] **Evaluation run** — `orb instrument` executed against `src/` directory. All output captured (instrumented files, agent notes, token usage, cost). Results committed to `evaluation/run-2` branch. Any failures documented with failure mode; any patches documented with rationale.
- [ ] **Rubric scoring** — Full rubric applied to instrumented output: 4 gate checks first (any gate failure = overall fail), then 27 quality rules. Per-rule pass/fail with evidence (specific code locations, span names, attribute usage). Overall pass rate and per-dimension scores calculated.
- [ ] **Baseline comparison** — Run-2 results compared against evaluation/run-1 baseline. Key metrics: overall pass rate (was 79%), per-dimension scores (Non-Destructiveness was 100%, Schema Fidelity was 33%), files instrumented vs skipped, manual patches required (was 3), total cost (was ~$5.50–6.50 across 8 attempts), system-level reliability (first-try success?).
- [ ] **Gap analysis and synthesis** — New rubric gaps documented (last time found 3: CDQ-008 tracer naming, RST-004 I/O boundary exception, CDQ-007 conditional attributes). Regressions documented. Findings filed as issues on spinybacked-orbweaver repo. Spec gaps documented for potential v3.10 update.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Phase 7 (git workflow/PR generation) not yet complete | Evaluation can run without it — capture output on a branch manually. If Phase 7 lands first, use the full PR workflow instead. |
| Codebase mapping is stale (functions changed since mapping was written) | Pre-flight milestone explicitly verifies mapping accuracy before running evaluation. |
| `orb instrument` fails on first attempt | Document failure mode, apply minimal patches (as done in run-1 where 3 patches were needed), and document what was patched and why. |
| Rubric doesn't cover new failure modes | Gap analysis milestone specifically looks for new rubric gaps to inform rubric evolution. |
| Cost exceeds budget | `orb instrument --dry-run` provides cost ceiling in pre-flight. Previous run was ~$5.50–6.50 across 8 attempts. |

## Prior Art

- **telemetry-agent-research PRDs #1–3**: Previous evaluation cycle against the old implementation
- **evaluation/run-1 branch**: Previous instrumentation output preserved in this repo
- **telemetry-agent-research/evaluation/**: Report, patterns doc, and rubric scores from previous evaluation
- **spinybacked-orbweaver/research/evaluation-rubric.md**: The 31-rule rubric
- **spinybacked-orbweaver/research/rubric-codebase-mapping.md**: Rule-to-code mapping

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-07 | Use CLI interface for evaluation | CLI (`orb init` / `orb instrument`) is the primary interface; MCP and GitHub Action are secondary |
| 2026-03-07 | Manual branch creation for results | Phase 7 (git workflow) not yet complete; manual branching is sufficient for evaluation |

---

## Notes

This is the validation gate before SpinybackedOrbWeaver can be considered release-ready. The evaluation is self-referential: commit-story's git hook runs on every commit, generating journal entries — after instrumentation, commits also produce telemetry data.
