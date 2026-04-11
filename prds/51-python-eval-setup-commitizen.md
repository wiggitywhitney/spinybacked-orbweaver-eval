# Python Eval Setup + Run-1: Target Selection and Baseline

**Issue**: [#51](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/51)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-11
**Last Updated**: 2026-04-11
**Type**: C (Setup + Run-1)

## Overview

The eval framework has no Python evaluation chain. This PRD evaluates 3 Python candidates from the shortlist in `docs/research/eval-target-criteria.md`, selects the best one based on rubric rule coverage, forks it, adds spiny-orb prerequisites, and runs the first baseline evaluation (Run-1).

## Prerequisites / Gates

- **Gate 1 (provider):** The Python language provider must be merged to spiny-orb main. Check current status in `docs/language-extension-plan.md` "Language Candidates" table.
- **Gate 2 (research):** `docs/research/eval-target-criteria.md` must exist with 3 Python candidates before this PRD can start.

## Success Metrics

- **Primary**: Best Python target selected with documented rationale; Run-1 produces complete evaluation artifacts
- **Secondary**: Rubric scores establish the Python baseline for future runs
- **Validation**: All evaluation artifacts pass cross-document audit; both user-facing checkpoints completed

## Implementation Milestones

- [ ] **Step 0: Read `docs/language-extension-plan.md` completely before proceeding with any other milestone**

  Read the full document, paying particular attention to: (1) "Type C: Setup + Run-1 PRD" section; (2) "Language Candidates" table — confirm Python provider status; (3) "Two User-Facing Checkpoints" section; (4) eval branch convention. Also read `docs/research/eval-target-criteria.md` to review the 3 Python candidates. Read `docs/research/instrumentation-score-integration.md` for Python OTel bootstrap details: `opentelemetry-instrument` wrapper OR manual bootstrap module, atexit hook + explicit SIGTERM handler (atexit alone does not cover SIGTERM in containerized deployments).

  Success criteria: Can answer — what are the 3 Python candidates? What is the Python OTel bootstrap mechanism? Why does atexit alone not suffice?

- [ ] **Milestone 0: Evaluate 3 Python candidates and choose target**

  Read the 3 Python candidate assessments from `docs/research/eval-target-criteria.md`. For each candidate:
  1. Clone the repo
  2. Run the test suite 3 times (deterministic reproducibility check)
  3. Count `.py` source files (excluding tests, configs, `__init__.py`). Ideal: 30 or less.
  4. Check dependencies (`pyproject.toml` / `requirements.txt`) for auto-instrumentation library overlap. Python OTel auto-instrumentation packages exist for: `requests`, `flask`, `django`, `sqlalchemy`, `psycopg2`, `aiohttp`, `httpx`, `celery`, `redis`, `pymongo`, `grpc`, and many more. At least one overlap is needed to test COV-006.
  5. Map rubric rule coverage: for each of the 32 rubric rules, assess whether this candidate's code patterns can exercise it
  6. Note any caveats (already instrumented, infrastructure dependencies, etc.)

  Compare the 3 candidates. Pick the one that exercises the most rubric rules while staying at or below 30 source files. Prefer candidates from different GitHub authors/organizations — same-author candidates share coding style and reduce rubric diversity.

  Present the recommendation to Whitney with rationale. Do not proceed until Whitney confirms the selection.

  Success criteria: One candidate selected with documented rubric-coverage rationale. Whitney's approval obtained.

- [ ] **Add Python auto-instrumentation libraries to spiny-orb**

  The Python language provider will need its own equivalent of `KNOWN_FRAMEWORK_PACKAGES`. Research the most popular Python packages that have OTel auto-instrumentation libraries. Cross-reference against `opentelemetry-python-contrib/instrumentation/` directory for the full list. Create the Python equivalent in the spiny-orb Python provider and submit a PR.

  Key packages to include: `requests`, `flask`, `django`, `fastapi`, `sqlalchemy`, `psycopg2`, `pymongo`, `redis`, `celery`, `aiohttp`, `httpx`, `grpc`, `boto3`, `urllib3`, `jinja2`, `sqlite3`.

  Success criteria: Python KNOWN_FRAMEWORK_PACKAGES equivalent created in spiny-orb with comprehensive coverage. PR submitted.

- [ ] **Fork target repo and create eval directory structure**

  Fork the chosen candidate. Create `evaluation/<target-name>/run-1/` directory with skeleton documents.

  Success criteria: Forked repo exists; eval directory created.

- [ ] **Add spiny-orb prerequisites to target repo**

  In the forked target repo:
  1. Create `spiny-orb.yaml` configuration (adapt from commit-story-v2 reference for Python)
  2. Create initial `semconv/` Weaver schema directory for the target's domain
  3. Create Python OTel bootstrap module — use `opentelemetry-instrument` wrapper OR manual bootstrap with `opentelemetry-sdk` and `opentelemetry-exporter-otlp-proto-http`. Include atexit hook AND explicit SIGTERM/SIGINT signal handlers to flush spans
  4. Add OTel dependencies to the project's dependency management (pyproject.toml or requirements.txt): `opentelemetry-api`

  Success criteria: All prerequisites present. Forked repo builds and tests pass.

- [ ] **Create deliberately incomplete Weaver schema**

  Deliberately omit some spans and attributes. Document the omissions. Tests SCH extension capability.

  Success criteria: At least 3 intentional omissions documented.

- [ ] **Verify test suite runs clean on unmodified target**

  Run test suite 3 times after adding prerequisites. All must pass.

  Success criteria: 3 consecutive clean test runs documented.

- [ ] **Pre-run verification**

  1. Confirm Python provider on spiny-orb main
  2. Verify spiny-orb.yaml and semconv/
  3. Count .py files — record inventory
  4. Rebuild spiny-orb
  5. Verify push auth
  6. Record version info
  7. Append to lessons-for-run2.md

- [ ] **Evaluation run-1**

  Whitney runs `spiny-orb instrument`. **Do NOT run yourself.**
  AI role: confirm readiness, save log, write run-summary.md.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)*

  Raw overview. Under 10 lines. Wait for acknowledgment.

- [ ] **Failure deep-dives**

  Document Python-specific failure patterns (decorator handling, import patterns, class-based vs function-based code).
  Produces: `evaluation/<target-name>/run-1/failure-deep-dives.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/failure-deep-dives.md`

- [ ] **Per-file evaluation**

  Full 32-rule rubric on ALL processed files.
  Produces: `evaluation/<target-name>/run-1/per-file-evaluation.md` and `per-file-evaluation.json`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/per-file-evaluation.md`

- [ ] **PR artifact evaluation**

  Produces: `evaluation/<target-name>/run-1/pr-evaluation.md`

- [ ] **Rubric scoring**

  First Python run — establish baseline.
  Produces: `evaluation/<target-name>/run-1/rubric-scores.md`

- [ ] **Baseline comparison**

  No prior Python baseline. Compare against most recent JS run for cross-language context. Note Python-specific patterns.
  Produces: `evaluation/<target-name>/run-1/baseline-comparison.md`

- [ ] **IS scoring run**

  **Conditional:** Check if `evaluation/is/otelcol-config.yaml` exists on main.
  Produces: `evaluation/<target-name>/run-1/is-scores.md`

- [ ] **Actionable fix output**

  1. Cross-document audit agent.
  2. *(User-facing checkpoint 2)* Interpreted summary. **Pause** until handoff confirmed.
  Produces: `evaluation/<target-name>/run-1/actionable-fix-output.md`

- [ ] **Draft Run-2 PRD**

  First Type D for Python chain. Carry forward both checkpoints.

## Dependencies and Constraints

- **Depends on**: Python language provider in spiny-orb (Gate 1)
- **Depends on**: `docs/research/eval-target-criteria.md` with 3 Python candidates (Gate 2)
- **Blocks**: Python Run-2 PRD

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Python provider handles different patterns (decorators, class methods, __init__) | First run is exploratory; document all Python-specific patterns |
| No Python KNOWN_FRAMEWORK_PACKAGES exists yet | Dedicated milestone to create it before evaluation |
| No baseline for score prediction | This IS the baseline |

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-11 | 3 candidates evaluated in milestone 0 | Hands-on validation beats desk research | Milestone 0 added |
| 2026-04-11 | Python auto-instrumentation library list is a milestone | Python provider needs its own KNOWN_FRAMEWORK_PACKAGES | Contribution to spiny-orb |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created (revised from initial commitizen-assumed version) | Draft | Await Gates 1 and 2 |
