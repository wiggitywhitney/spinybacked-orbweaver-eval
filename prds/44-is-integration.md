# IS Integration — PRD

**Issue**: [#44](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/44)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-11
**Last Updated**: 2026-04-11

## Overview

The eval framework tracks rubric scores but cannot score OTLP telemetry against the Instrumentation Score (IS) spec. No standalone IS scoring tool exists. This PRD builds a lightweight IS scoring script, adds the required OTel Collector config, and wires IS scoring into the Type D run template as step 9.

Full research findings live in `docs/research/instrumentation-score-integration.md`. Read that document in full before starting any milestone — it contains rule applicability decisions, the exact Collector config, and language-specific SDK bootstrap patterns that inform every milestone here.

## User Impact

- **Who benefits**: Every subsequent evaluation run (all languages) gets IS scoring as part of the standard workflow
- **What changes**: After each spiny-orb instrumentation run, the evaluator runs the IS scorer to produce a weighted IS score alongside the rubric score
- **Why now**: IS infrastructure should land in the finalized repo structure (after Step 1 repo generalization); adding it here avoids a second restructure

## Success Metrics

- **Primary**: `evaluation/is/score-is.js` runs against a captured JSON file and outputs a weighted IS score with per-rule pass/fail results
- **Secondary**: `evaluation/is/otelcol-config.yaml` starts the OTel Collector and captures OTLP traces to a local file
- **Validation**: Run the scorer against an existing `evaluation/commit-story-v2/run-*/` trace capture (if one exists) or a minimal synthetic JSON fixture; confirm the weighted score and rule breakdown match manual calculation

## Requirements

### Functional Requirements

- **Must Have**: IS scoring script at `evaluation/is/score-is.js` — reads line-delimited OTLP JSON, evaluates the ~9 applicable IS rules for a CLI app, outputs weighted IS score
- **Must Have**: `evaluation/is/otelcol-config.yaml` — minimal OTel Collector config (OTLP HTTP receiver on port 4318 → file exporter)
- **Must Have**: Metrics enabled in SDK bootstrap during IS scoring runs (remove `OTEL_METRICS_EXPORTER=none`) — MET rules will fail, but that is honest signal
- **Must Have**: Type D run template updated to include IS scoring as step 9 (after rubric scoring, before baseline comparison)
- **Must Have**: Tests for the scoring script covering at least: all 9 applicable rules, a span set that produces a known weighted score, and a synthetic OTLP JSON fixture

### Non-Functional Requirements

- Scoring script must be deterministic: same OTLP input → same score every run
- Do NOT start this PRD until PRD #43 (repo generalization) is merged — IS infrastructure must land at `evaluation/commit-story-v2/` not the old flat structure
- The OTel Collector binary is not bundled — the milestone documents how to install it (Docker or `otelcol-contrib` binary)
- Pin the IS spec to commit `52c14ba` — the spec is at v0.1 and rules may change

## Implementation Milestones

- [ ] **Step 0: Read the IS research document in full**

  Before writing any code, read `docs/research/instrumentation-score-integration.md` in its entirety. Pay particular attention to: (1) Rule Applicability by App Type table — these 9 rules are the only ones the scorer evaluates; (2) the exact Collector YAML config in the Findings section; (3) the "k8s-dependent repo constraint" — locally-runnable repos vs. repos requiring a cluster have different IS scoring workflows. Do not proceed to the next milestone until you can answer: which rules apply, what is the OTel Collector output format, and why MET rules are included even though they will fail.

  Success criteria: No code written. Milestone complete when you have read the full document and the answers to those three questions are clear.

- [ ] **Create `evaluation/is/otelcol-config.yaml`**

  Create the directory `evaluation/is/` and write `evaluation/is/otelcol-config.yaml` with the minimal OTel Collector config from the research document:
  - OTLP HTTP receiver on port 4318 (same port as Datadog Agent — they cannot run simultaneously; this is intentional and documented)
  - File exporter writing to `evaluation/is/eval-traces.json`
  - Single pipeline: traces only (no metrics, no logs)

  Also create `evaluation/is/README.md` documenting: (1) how to install `otelcol-contrib` (Docker pull or binary download); (2) how to start the Collector (`otelcol-contrib --config otelcol-config.yaml`); (3) how to point the target app at the Collector (`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces`); (4) that the Datadog Agent must be stopped before starting the Collector (same port). Commit with `[skip ci]`.

  Success criteria: `evaluation/is/otelcol-config.yaml` exists with receiver, exporter, and pipeline sections; `evaluation/is/README.md` documents the four items above.

- [ ] **Build IS scoring script**

  Write `evaluation/is/score-is.js` as a Node.js script (ESM, no dependencies beyond Node.js built-ins). The script:
  1. Reads a line-delimited JSON file path from `process.argv[2]` (e.g., `node score-is.js eval-traces.json`)
  2. Parses each line as an OTLP ExportTraceServiceRequest JSON object
  3. Evaluates each of the 9 applicable IS rules (see the Rule Applicability table in the research doc):
     - RES-001: `service.instance.id` present in resource attributes
     - RES-004: semantic convention attributes at correct OTLP level (resource vs. span)
     - RES-005 (Critical): `service.name` present in resource attributes
     - SPA-001: ≤10 INTERNAL spans per trace
     - SPA-002: no orphan spans (every span's parentSpanId resolves to an existing span in the trace)
     - SPA-003: span name cardinality — a span name fails if it matches `/\d{3,}/` (contains 3+ consecutive digits) or contains a UUID-shaped substring (8-4-4-4-12 hex pattern); also fail if the total count of unique span names across all traces exceeds 50. Note: spec marks threshold as "TODO" — the >50 threshold is a provisional default
     - SPA-004: root spans are not CLIENT kind
     - SPA-005: ≤20 spans with duration <5ms
     - SDK-001: read `telemetry.sdk.language` and `telemetry.sdk.version` from resource attributes. Pass if language is `nodejs` and version ≥18, `python` and version ≥3.8, or `go` and version ≥1.20. Fail if the language is known but version is below threshold. Mark as "not applicable" if `telemetry.sdk.language` is absent.
  4. Applies the IS weighted formula: Critical rules count 3×, other applicable rules count 1×. Score = (weighted passes) / (weighted total) × 100
  5. Outputs a structured result to stdout: overall IS score (0–100), per-rule pass/fail with rule ID and brief reason for failures

  Do NOT evaluate MET-001 through MET-006 as "failed" in the weighted formula — mark them as "not applicable" so they don't drag the score down. The research doc explains why: spiny-orb produces no OTel metrics; this is a scope decision, not an instrumentation failure.

  Output format (stdout):
  ```text
  IS Score: 72.7 / 100

  Rule Results:
  ✅ RES-005 (Critical): service.name present
  ✅ RES-001: service.instance.id present
  ❌ RES-004: semconv attributes at wrong OTLP level (found X attributes on span that belong on resource)
  ✅ SPA-001: INTERNAL span count within limit (3 spans)
  ... (one line per applicable rule)

  Applicable rules: 9 | Passed: 7 | Failed: 2 | Not applicable (skipped): 11
  Weighted score: 19/26 points (Critical rules weighted 3×)
  ```

  Commit the script. Do NOT commit `eval-traces.json` — add `evaluation/is/eval-traces.json` to `.gitignore`.

  Success criteria: `node evaluation/is/score-is.js <fixture>` exits 0 and prints the structured output above; all 9 applicable rules are evaluated; MET rules show "not applicable" not "failed."

- [ ] **Write tests for the IS scoring script**

  Create `tests/score-is.test.js` using Vitest (already in the project). Tests must cover:
  1. A synthetic OTLP JSON fixture where all 9 applicable rules pass — verify the weighted score equals 100
  2. RES-005 failure: fixture missing `service.name` — verify score is 0 (Critical rule failure; use the research doc's formula to calculate expected score)
  3. SPA-002 failure: fixture with an orphan span (parentSpanId that doesn't match any spanId in the trace)
  4. SPA-001 failure: fixture with >10 INTERNAL spans in a single trace
  5. MET rules: verify they appear as "not applicable" in the output, not "failed"

  A valid OTLP JSON fixture has this top-level shape: `{"resourceSpans": [{"resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "my-service"}}]}, "scopeSpans": [{"spans": [...]}]}]}`. Each span must have `spanId`, `parentSpanId` (empty string for root), `name`, `kind`, `startTimeUnixNano`, `endTimeUnixNano`, and `status`. Place synthetic OTLP JSON fixtures in `tests/fixtures/is/`. Each fixture is a single line of valid OTLP JSON (one `ExportTraceServiceRequest` object). Run `npm test` and confirm all tests pass before considering this milestone done.

  Success criteria: `npm test` passes; at least 5 test cases covering the scenarios above; fixtures in `tests/fixtures/is/`.

- [ ] **Enable metrics in SDK bootstrap for IS scoring runs**

  The target repo (commit-story-v2, located at `~/Documents/Repositories/commit-story-v2` or wherever Whitney has it cloned) has `OTEL_METRICS_EXPORTER=none` set in its SDK bootstrap file (`examples/instrumentation.js`). This file is in the commit-story-v2 repo, NOT this eval repo — do not look in this repo's files for this setting. For IS scoring runs, metrics must be enabled so MET rules can be evaluated (they will fail — this is expected and documented).

  Add a comment in the SDK bootstrap explaining: "For IS scoring runs, remove OTEL_METRICS_EXPORTER=none so the IS scorer can evaluate MET rules. MET rules will fail because spiny-orb produces no OTel metrics — this is honest signal about spiny-orb's scope." Do NOT remove the `OTEL_METRICS_EXPORTER=none` line from the default config — add a comment explaining when to remove it, or make it conditional on an env var (e.g., `process.env.IS_SCORING_RUN`). Commit with `[skip ci]`.

  Success criteria: The SDK bootstrap file has a clear comment explaining the `OTEL_METRICS_EXPORTER=none` behavior and when to change it for IS scoring; the change is committed.

- [ ] **Add IS scoring as step 9 to the Type D milestone sequence in docs/language-extension-plan.md, and cascade to all existing open eval PRDs** (Decision 2026-04-12)

  Open `docs/language-extension-plan.md` and find the Type D section. Step 9 currently reads: "(IS scoring run) *(active once Step 2 IS integration PRD completes — run instrumented code with OTel Collector, score OTLP output against IS spec, add IS score to rubric scoring document)*". Replace that placeholder with full step details:

  1. Prerequisites: OTel Collector running with `evaluation/is/otelcol-config.yaml`; `OTEL_METRICS_EXPORTER` removed or overridden for this run (see `evaluation/is/README.md`)
  2. Action: Run the target app with the Collector as OTLP receiver; collect `eval-traces.json`; run `node evaluation/is/score-is.js evaluation/is/eval-traces.json`
  3. Output: Record the IS score and per-rule breakdown in `evaluation/[TARGET]/run-[N]/is-score.md`
  4. Note for k8s repos: IS scoring requires a running cluster; see `evaluation/is/README.md` for the Kind-based workflow

  **After updating the template, cascade the same IS scoring step to all existing open eval PRDs that were created from this template:**
  - PRDs #50, #51, #52, #53 (Type C eval setup PRDs) — each has a conditional IS scoring placeholder ("Check if `evaluation/is/otelcol-config.yaml` exists on main..."). Replace that placeholder with the full IS scoring step details above.
  - PRD #55 (eval run-14) — has no IS scoring step at all. Add it as step 9 between rubric scoring and baseline comparison.

  Commit all changes with `[skip ci]`.

  Success criteria: `docs/language-extension-plan.md` Type D step 9 contains all four items above; PRDs #50, #51, #52, #53 each have the full IS scoring step replacing the placeholder; PRD #55 has an IS scoring step 9 added; all reference `evaluation/is/score-is.js` and `evaluation/is/otelcol-config.yaml` by exact path.

## Dependencies and Constraints

- **Depends on**: PRD #43 (repo generalization) — IS infrastructure must land in `evaluation/commit-story-v2/` not the old flat structure. Do NOT start this PRD until #43 is merged.
- **Depends on**: `docs/research/instrumentation-score-integration.md` — all implementation decisions come from this document
- **Blocks**: Every future Type D run PRD — IS scoring becomes step 9 in all subsequent runs

## Risks and Mitigations

- **Risk**: OTel Collector not installed on evaluator's machine
  - **Mitigation**: README.md documents Docker and binary install options; IS scoring milestone in Type D template lists this as a prerequisite
- **Risk**: IS spec changes between evaluation runs (spec is v0.1, active development)
  - **Mitigation**: Pin to commit `52c14ba`; note pin in scoring script header comment
- **Risk**: SPA-003 cardinality threshold is undefined in spec
  - **Mitigation**: Use >50 unique span names as threshold with a comment noting the spec says "TODO" — revisit when spec defines it
- **Risk**: `docs/language-extension-plan.md` modified by concurrent work when final milestone runs
  - **Mitigation**: Hard dependency on PRD #43 ensures the file is stable before this PRD starts; all milestones are completable from main

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-10 | Build scoring script from scratch (no existing tool) | No standalone IS scoring tool exists; only Elastic's internal POC and OllyGarden's commercial product | ~200–300 line script; bounded scope |
| 2026-04-10 | OTel Collector file exporter as OTLP receiver | Language-agnostic; produces line-delimited JSON parseable by a script; same port 4318 as Datadog Agent | Collector must run instead of Datadog Agent during IS scoring |
| 2026-04-10 | MET rules: include as "not applicable" not "failed" | spiny-orb produces no OTel metrics by design; failing MET rules would punish a deliberate scope decision | MET rules don't affect weighted score |
| 2026-04-10 | SPA-003 threshold: >50 unique span names | Spec marks threshold as "TODO"; using 50 as a reasonable default with a comment | Revisit when spec defines the threshold |
| 2026-04-11 | Pin IS spec to commit 52c14ba | Spec is v0.1, actively changing; pinning ensures reproducible scoring | Must check spec repo for updates before each new language eval chain begins |
| 2026-04-12 | Cascade Type D template update to all existing open eval PRDs | PRDs #50, #51, #52, #53 (Type C eval setup PRDs) and #55 (run-14) were created from the Type D template and contain IS scoring placeholder text. When milestone 5 updates the template, it must also update those PRDs — otherwise agents running those PRDs will use stale IS scoring instructions. | Milestone 5 expanded to include cascade step |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created | Draft | Wait for PRD #43 to merge, then start |
