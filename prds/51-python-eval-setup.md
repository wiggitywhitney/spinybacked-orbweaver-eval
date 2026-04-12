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

### Eval Branch Convention

The feature branch for this PRD **never merges to main**. The PR exists for CodeRabbit review only. When `/prd-done` runs at completion, close the issue without merging the eval branch.

## Success Metrics

- **Primary**: Best Python target selected with documented rationale; Run-1 produces complete evaluation artifacts
- **Secondary**: Rubric scores establish the Python baseline for future runs
- **Validation**: All evaluation artifacts pass cross-document audit; both user-facing checkpoints completed

## Key Inputs

- **Evaluation rubric** (spiny-orb repo): `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules across 6 dimensions: NDS, COV, RST, API, SCH, CDQ)
- **Candidate shortlist**: `docs/research/eval-target-criteria.md` (3 Python candidates)
- **Auto-instrumentation library list**: Python provider does not have KNOWN_FRAMEWORK_PACKAGES yet — use `opentelemetry-python-contrib/instrumentation/` as the reference for what Python packages have OTel auto-instrumentation. See the "Add Python auto-instrumentation libraries" milestone.
- **Language extension plan**: `docs/language-extension-plan.md` (Type C structure, instrument command, checkpoints)
- **OTel bootstrap reference**: `docs/research/instrumentation-score-integration.md` (SDK bootstrap by language table — Python section)

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

  Compare the 3 candidates. Pick the one that exercises the most rubric rules while staying at or below 30 source files. A candidate above 30 files is acceptable if the extra files exercise rubric rules that the smaller candidates cannot — document the justification. Prefer candidates from different GitHub authors/organizations — same-author candidates share coding style and reduce rubric diversity.

  Present the recommendation to Whitney with rationale. Do not proceed until Whitney confirms the selection.

  Success criteria: One candidate selected with documented rubric-coverage rationale. Whitney's approval obtained.

- [ ] **Add Python auto-instrumentation libraries to spiny-orb**

  Work in `~/Documents/Repositories/spinybacked-orbweaver/` on a feature branch. The Python language provider will need its own equivalent of `KNOWN_FRAMEWORK_PACKAGES`. Reference the JS version at `src/languages/javascript/ast.ts` (around line 124) for the pattern. Research the most popular Python packages with OTel auto-instrumentation by browsing `https://github.com/open-telemetry/opentelemetry-python-contrib/tree/main/instrumentation`. Create the Python equivalent in the spiny-orb Python provider. Run `npm test` to verify.

  Key packages to include (minimum): `requests`, `flask`, `django`, `fastapi`, `sqlalchemy`, `psycopg2`, `pymongo`, `redis`, `celery`, `aiohttp`, `httpx`, `grpc`, `boto3`, `urllib3`, `jinja2`, `sqlite3`.

  Success criteria: Python KNOWN_FRAMEWORK_PACKAGES equivalent created with at least 15 packages. PR submitted with passing tests.

- [ ] **Fork target repo and create eval directory structure**

  Fork the chosen candidate. Create `evaluation/<target-name>/run-1/` directory with these skeleton files: `lessons-for-run2.md`, `spiny-orb-findings.md`. Reference `~/Documents/Repositories/commit-story-v2/spiny-orb.yaml` and `~/Documents/Repositories/commit-story-v2/semconv/` as the working examples for prerequisites (adapt for Python).

  Success criteria: Forked repo exists; eval directory created.

- [ ] **Add spiny-orb prerequisites to target repo**

  In the forked target repo:
  1. Create `spiny-orb.yaml` configuration (adapt from commit-story-v2 reference for Python)
  2. Create initial `semconv/` Weaver schema directory for the target's domain
  3. Create Python OTel bootstrap module — use `opentelemetry-instrument` wrapper OR manual bootstrap with `opentelemetry-sdk` and `opentelemetry-exporter-otlp-proto-http`. Include atexit hook AND explicit SIGTERM/SIGINT signal handlers to flush spans
  4. Add OTel dependencies to the project's dependency management (pyproject.toml or requirements.txt): `opentelemetry-api`

  Success criteria: All prerequisites present. Forked repo builds and tests pass.

- [ ] **Create deliberately incomplete Weaver schema**

  The `semconv/` schema should deliberately omit some spans and attributes that a human would include. Tests SCH extension capability. The process: (1) first draft a complete schema, (2) remove items to create the incomplete version, (3) document both.

  **What to omit**: Domain-specific attributes inferable from code — not trivial metadata. Good omissions: attributes for function parameters, span names for operations the code performs. Bad omissions: generic OTel attributes.

  Success criteria: Complete schema drafted first. At least 3 semantically meaningful omissions documented with rationale.

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

  Whitney runs `spiny-orb instrument`. **Do NOT run yourself.** Copy the command template from `docs/language-extension-plan.md` (line ~72). Replace `commit-story-v2` with the chosen target name, `run-N` with `run-1`, and `src` with the target's source directory (Python repos may use `commitizen/`, `src/`, or the package name as the source dir).
  AI role: confirm readiness, save log, write run-summary.md.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)*

  Raw overview. Under 10 lines. Wait for acknowledgment.

- [ ] **Failure deep-dives**

  Document Python-specific failure patterns (decorator handling, import patterns, class-based vs function-based code).
  Produces: `evaluation/<target-name>/run-1/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation**

  Full 32-rule rubric on ALL processed files.
  Produces: `evaluation/<target-name>/run-1/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [ ] **PR artifact evaluation**

  Produces: `evaluation/<target-name>/run-1/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [ ] **Rubric scoring**

  First Python run — establish baseline.
  Produces: `evaluation/<target-name>/run-1/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [ ] **Baseline comparison**

  No prior Python baseline. Compare against most recent JS run for cross-language context. Compare: overall rubric score, per-dimension scores (NDS/COV/RST/API/SCH/CDQ), file counts, skip rate, and cost. Note Python-specific patterns (decorator handling, class methods, import-time side effects).
  Produces: `evaluation/<target-name>/run-1/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md` (adapt — focus on cross-language comparison)

- [ ] **IS scoring run**

  **Conditional:** Check if `evaluation/is/otelcol-config.yaml` exists on main. If yes, use scoring script. If no, skip IS scoring entirely and write `is-scores.md` containing only: "IS scoring deferred — infrastructure not yet on main (PRD #44)."
  Produces: `evaluation/<target-name>/run-1/is-scores.md`

- [ ] **Actionable fix output**

  1. Cross-document audit agent.
  2. *(User-facing checkpoint 2)* Interpreted summary. **Pause** until handoff confirmed.
  Produces: `evaluation/<target-name>/run-1/actionable-fix-output.md`

- [ ] **Draft Run-2 PRD**

  Create on separate branch from main (eval branches never merge). Use Type D structure from `docs/language-extension-plan.md` and `prds/37-evaluation-run-13.md` as the milestone style reference. First Type D for Python chain. Carry forward both checkpoints. Merge the PRD-only PR to main.

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
