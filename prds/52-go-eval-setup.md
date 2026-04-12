# Go Eval Setup + Run-1: Target Selection and Baseline

**Issue**: [#52](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/52)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-11
**Last Updated**: 2026-04-11
**Type**: C (Setup + Run-1)

## Overview

The eval framework has no Go evaluation chain. This PRD evaluates 3 Go candidates from the shortlist in `docs/research/eval-target-criteria.md`, selects the best one based on rubric rule coverage, forks it, adds spiny-orb prerequisites, and runs the first baseline evaluation (Run-1).

## Prerequisites / Gates

- **Gate 1 (provider):** The Go language provider must be merged to spiny-orb main. Check current status in `docs/language-extension-plan.md` "Language Candidates" table.
- **Gate 2 (research):** `docs/research/eval-target-criteria.md` must exist with 3 Go candidates before this PRD can start.

### Eval Branch Convention

The feature branch for this PRD **never merges to main**. The PR exists for CodeRabbit review only. When `/prd-done` runs at completion, close the issue without merging the eval branch.

## Success Metrics

- **Primary**: Best Go target selected with documented rationale; Run-1 produces complete evaluation artifacts
- **Secondary**: Rubric scores establish the Go baseline for future runs
- **Validation**: All evaluation artifacts pass cross-document audit; both user-facing checkpoints completed

## Key Inputs

- **Evaluation rubric** (spiny-orb repo): `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules across 6 dimensions: NDS, COV, RST, API, SCH, CDQ)
- **Candidate shortlist**: `docs/research/eval-target-criteria.md` (3 Go candidates)
- **Auto-instrumentation library list**: Go provider does not have KNOWN_FRAMEWORK_PACKAGES yet — use `go.opentelemetry.io/contrib/instrumentation/` as the reference for what Go packages have OTel auto-instrumentation. See the "Add Go auto-instrumentation libraries" milestone.
- **Language extension plan**: `docs/language-extension-plan.md` (Type C structure, instrument command, checkpoints)
- **OTel bootstrap reference**: `docs/research/instrumentation-score-integration.md` (SDK bootstrap by language table — Go section)

## Implementation Milestones

- [ ] **Step 0: Read `docs/language-extension-plan.md` completely before proceeding with any other milestone**

  Read the full document, paying particular attention to: (1) "Type C: Setup + Run-1 PRD" section; (2) "Language Candidates" table — confirm Go provider status; (3) "Two User-Facing Checkpoints" section; (4) eval branch convention. Also read `docs/research/eval-target-criteria.md` to review the 3 Go candidates. Read `docs/research/instrumentation-score-integration.md` for Go OTel bootstrap details: `setupOTelSDK()` in `main()`, `defer shutdown(ctx)` + explicit `os/signal.Notify` handlers (defer alone does not cover `os.Exit()`, `log.Fatal*`, or unhandled signals).

  Success criteria: Can answer — what are the 3 Go candidates? What is the Go OTel bootstrap mechanism? Why does `defer` alone not suffice for graceful shutdown?

- [ ] **Milestone 0: Evaluate 3 Go candidates and choose target**

  Read `docs/research/eval-target-criteria.md` Section 2.4 before cloning anything. The COV-006 overlap analysis and per-rule coverage table for all 3 Go candidates are already complete — do not redo them.

  **What the research already covers (do not repeat):**
  - COV-006 overlap: mods (net/http direct import confirmed in mods.go), ghq (net/http direct import confirmed in go_import.go), dbmate (database/sql — conditional on whether otelsql is included in Go KFP equivalent)
  - Full 24-rule differentiating coverage table with ✓/✗/🔍 for all 3 candidates
  - File counts (mods: 32, dbmate: 14, ghq: 19), I/O types, licenses, star counts
  - IS scoring setup requirements (mods can use Ollama locally; dbmate works with SQLite; ghq needs only git)

  **What still requires local verification (do these for all 3 candidates):**
  1. Clone the repo
  2. Run the test suite 3 times — flaky tests disqualify; this cannot be pre-researched
  3. Confirm source file count from local clone matches the research doc's count
  4. Confirm no existing OTel instrumentation (grep for `go.opentelemetry.io` imports)
  5. Note any caveats discovered during cloning that differ from the research

  Using the pre-researched comparison table from Section 2.4 and the local verification results above, make the final selection. Decision factors: rubric coverage (pre-researched in table), test reliability (local), confirmed file count (local), no existing OTel (local). Accept an above-30-file candidate only if the extra rules it exercises justify the longer runtime — document that justification. Prefer candidates from different GitHub orgs (same-org candidates share coding conventions).

  Present the recommendation to Whitney with rationale. Do not proceed until Whitney confirms.

  Success criteria: One candidate selected with documented rubric-coverage rationale. Whitney's approval obtained.

- [ ] **Add Go auto-instrumentation libraries to spiny-orb**

  Work in `~/Documents/Repositories/spinybacked-orbweaver/` on a feature branch. The Go language provider will need its own equivalent of `KNOWN_FRAMEWORK_PACKAGES`. Reference the JS version at `src/languages/javascript/ast.ts` (around line 124) for the pattern. Research the most popular Go packages with OTel auto-instrumentation by browsing `https://github.com/open-telemetry/opentelemetry-go-contrib/tree/main/instrumentation`. Create the Go equivalent in the spiny-orb Go provider. Run `npm test` to verify.

  Key packages to include (minimum): `net/http`, `database/sql`, `google.golang.org/grpc`, `github.com/gin-gonic/gin`, `github.com/gorilla/mux`, `github.com/labstack/echo`, `github.com/go-redis/redis`, `go.mongodb.org/mongo-driver`, `github.com/aws/aws-sdk-go-v2`, `github.com/segmentio/kafka-go`.

  Success criteria: Go KNOWN_FRAMEWORK_PACKAGES equivalent created with at least 10 packages. PR submitted with passing tests.

- [ ] **Fork target repo and create eval directory structure**

  Fork the chosen candidate. Create `evaluation/<target-name>/run-1/` directory with these skeleton files: `lessons-for-run2.md`, `spiny-orb-findings.md`. Reference `~/Documents/Repositories/commit-story-v2/spiny-orb.yaml` and `~/Documents/Repositories/commit-story-v2/semconv/` as the working examples for prerequisites (adapt for Go). If the chosen target requires infrastructure (k8s, database), document provisioning steps.

  Success criteria: Forked repo exists; eval directory created; infrastructure docs if needed.

- [ ] **Add spiny-orb prerequisites to target repo**

  In the forked target repo:
  1. Create `spiny-orb.yaml` configuration (adapt for Go)
  2. Create initial `semconv/` Weaver schema directory for the target's domain
  3. Create Go OTel bootstrap function — `setupOTelSDK()` using `go.opentelemetry.io/otel/sdk/trace` and OTLP exporter. Must include `defer shutdown(ctx)` AND explicit `os/signal.Notify` for SIGTERM/SIGINT
  4. Add OTel API dependency to `go.mod`: `go.opentelemetry.io/otel` (API only — per OpenTelemetry packaging rules, libraries depend on the API, not the SDK)

  Success criteria: All prerequisites present. Forked repo builds and tests pass.

- [ ] **Create deliberately incomplete Weaver schema**

  The `semconv/` schema should deliberately omit some spans and attributes that a human would include. Tests SCH extension capability. The process: (1) first draft a complete schema, (2) remove items to create the incomplete version, (3) document both.

  **What to omit**: Domain-specific attributes inferable from code — not trivial metadata. Good omissions: attributes for function parameters, span names for operations the code performs. Bad omissions: generic OTel attributes.

  Success criteria: Complete schema drafted first. At least 3 semantically meaningful omissions documented with rationale.

- [ ] **Verify test suite runs clean on unmodified target**

  Run test suite 3 times after adding prerequisites. If tests require infrastructure (k8s), provision it. All must pass.

  Success criteria: 3 consecutive clean test runs documented.

- [ ] **Pre-run verification**

  1. Confirm Go provider on spiny-orb main
  2. Verify spiny-orb.yaml and semconv/
  3. Count .go files (excluding _test.go) — record inventory
  4. Rebuild spiny-orb
  5. Verify push auth
  6. Record version info
  7. Append to lessons-for-run2.md

- [ ] **Evaluation run-1**

  Whitney runs `spiny-orb instrument`. **Do NOT run yourself.** Copy the command template from `docs/language-extension-plan.md` (line ~72). Replace `commit-story-v2` with the chosen target name, `run-N` with `run-1`, and `src` with the target's source directory (Go repos typically use `.`, `cmd/`, or `internal/` — check the forked repo's layout).
  AI role: confirm readiness, save log, write run-summary.md.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)*

  Raw overview. Under 10 lines. Wait for acknowledgment.

- [ ] **Failure deep-dives**

  Document Go-specific failure patterns (goroutine/channel patterns, interface handling, struct method receivers, error return patterns).
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

  First Go run — establish baseline.
  Produces: `evaluation/<target-name>/run-1/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [ ] **Baseline comparison**

  No prior Go baseline. Compare against most recent JS run for cross-language context. Compare: overall rubric score, per-dimension scores (NDS/COV/RST/API/SCH/CDQ), file counts, skip rate, and cost. Note Go-specific patterns (goroutine context propagation, interface dispatch, error return instrumentation).
  Produces: `evaluation/<target-name>/run-1/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md` (adapt — focus on cross-language comparison)

- [ ] **IS scoring run**

  **Conditional:** Check if `evaluation/is/otelcol-config.yaml` exists on main. If yes, use scoring script (provision infrastructure if needed). If no, skip IS scoring entirely and write `is-scores.md` containing only: "IS scoring deferred — infrastructure not yet on main (PRD #44)."
  Produces: `evaluation/<target-name>/run-1/is-scores.md`

- [ ] **Actionable fix output**

  1. Cross-document audit agent.
  2. *(User-facing checkpoint 2)* Interpreted summary. **Pause** until handoff confirmed.
  Produces: `evaluation/<target-name>/run-1/actionable-fix-output.md`

- [ ] **Draft Run-2 PRD**

  Create on separate branch from main (eval branches never merge). Use Type D structure from `docs/language-extension-plan.md` and `prds/37-evaluation-run-13.md` as the milestone style reference. First Type D for Go chain. Carry forward both checkpoints. Merge the PRD-only PR to main.

## Dependencies and Constraints

- **Depends on**: Go language provider in spiny-orb (Gate 1)
- **Depends on**: `docs/research/eval-target-criteria.md` with 3 Go candidates (Gate 2)
- **Blocks**: Go Run-2 PRD

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Go ecosystem has fewer small CLI tools than Python/TS | Research provides 3 candidates; expand search if needed |
| Go provider handles different patterns (goroutines, interfaces, error returns) | First run is exploratory; document all Go-specific patterns |
| Go candidates may require infrastructure (k8s, databases) | Document provisioning; prefer locally-runnable candidates in milestone 0 |

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-11 | 3 candidates evaluated in milestone 0 | Hands-on validation beats desk research | Milestone 0 added |
| 2026-04-11 | Go auto-instrumentation library list is a milestone | Go provider needs its own KNOWN_FRAMEWORK_PACKAGES | Contribution to spiny-orb |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created (revised from initial k8s-vectordb-sync-assumed version) | Draft | Await Gates 1 and 2 |
