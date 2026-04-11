# Eval Target Criteria Research Spike — PRD

**Issue**: [#45](https://github.com/wiggitywhitney/commit-story-v2-eval/issues/45)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-11
**Last Updated**: 2026-04-11

## Overview

The eval framework has no evidence-based criteria for selecting target repos. commit-story-v2 was chosen by circumstance. This PRD runs a research spike to derive a language-agnostic criteria scorecard, evaluates known candidates against it, and writes findings to a predefined output path that all downstream Type C PRDs depend on.

Full context — hypotheses table, research agent framing, candidate list, and the constraint that criteria must be derived from first principles (not from commit-story-v2) — lives in `docs/language-extension-plan.md` under "Research Spike: Ideal Eval Target Criteria." Read that section before starting any milestone.

## User Impact

- **Who benefits**: Any agent setting up a new language/target eval chain (TypeScript, Python, Go)
- **What changes**: Type C PRDs for TypeScript, Python, and Go can proceed using validated targets from this research rather than guessing
- **Why now**: Steps 5–7 (Type C setup PRDs) are blocked until `docs/research/eval-target-criteria.md` exists; this research unblocks all three

## Success Metrics

- **Primary**: `docs/research/eval-target-criteria.md` exists with a verdict (pass/fail/conditional with rationale) for each known candidate and a recommended target for Python
- **Secondary**: The scorecard criteria are derived from evidence, not from assumed commit-story-v2 characteristics
- **Validation**: A Type C PRD agent reading `docs/research/eval-target-criteria.md` can identify the validated target for their language without any additional research

## Requirements

### Functional Requirements

- **Must Have**: Research spike run using the `/research` skill — hypotheses are things to investigate, not criteria to confirm
- **Must Have**: Language-agnostic criteria scorecard derived from research findings
- **Must Have**: Verdict for each known candidate: commit-story-v2 (JavaScript), Cluster Whisperer (TypeScript), k8s-vectordb-sync (Go)
- **Must Have**: Recommended Python candidate (no predefined candidate exists — research must find one)
- **Must Have**: Findings written to `docs/research/eval-target-criteria.md` — this path is predefined and stable; do not choose a different output path
- **Must Have**: Final milestone creates PRDs for Steps 5–7 (TypeScript, Python, Go eval setup) using the validated targets from this research
- **Should Have**: IS scorability incorporated as one criterion dimension (see `docs/research/instrumentation-score-integration.md` for what makes a repo produce meaningful IS scores)

### Non-Functional Requirements

- The output path `docs/research/eval-target-criteria.md` must not change — downstream Type C PRDs reference this exact path
- Do NOT treat commit-story-v2 as the assumed "correct" answer — it must be evaluated against the criteria like any other candidate
- Do NOT create PRDs for Steps 5–7 until the research findings are written and reviewed

## Implementation Milestones

- [ ] **Step 0: Read the research spike framing before running any research**

  Read `docs/language-extension-plan.md` in full, paying particular attention to: (1) "Research Spike: Ideal Eval Target Criteria" section — hypotheses table and the constraint that criteria must be derived from first principles; (2) "Language Candidates" table — which repos are known candidates for each language; (3) "Type C: Setup + Run-1 PRD" section — what a target repo must support for the full eval workflow, including IS scoring runs. Also read `docs/research/instrumentation-score-integration.md` for the IS scorability dimension (what makes a repo produce meaningful IS scores, particularly the k8s-dependent repo constraint).

  Do not start the research milestone until you have answered: What are the 9 hypotheses to investigate? What is the known Python candidate status (none — must be found)? What does IS scorability require from a target repo?

  Success criteria: No research run yet. Milestone complete when the answers to those three questions are clear.

- [ ] **Run the research spike**

  Use the `/research` skill to investigate eval target criteria. Frame the research as: "Here are factors we think may matter for evaluating spiny-orb against a target repo — research whether they actually do and find what we're missing." Hand the agent the 9 hypotheses from `docs/language-extension-plan.md` as things to investigate, not as settled criteria.

  The research agent must:
  1. Find evidence for or against each of the 9 hypotheses in the language-extension-plan
  2. Identify factors not in the hypotheses list that affect eval target quality
  3. Evaluate commit-story-v2, Cluster Whisperer, and k8s-vectordb-sync against whatever criteria emerge
  4. Identify at least one Python candidate repo (small, popular, permissively licensed open-source project; fork-and-freeze approach — never pull upstream)
  5. Assess IS scorability as a dimension: does the repo need infrastructure to exercise? Can it emit spans locally?

  Do NOT ask the research agent to "confirm" the hypotheses — frame it as open investigation. A spike that confirms all hypotheses without surfacing new factors has not done its job.

  Success criteria: Research agent returns findings with evidence for/against each hypothesis, new factors identified, and per-candidate assessments for all four languages (including Python candidate recommendation).

- [ ] **Write findings to `docs/research/eval-target-criteria.md`**

  Synthesize the research output into `docs/research/eval-target-criteria.md`. The document must include all three of these sections — a document missing any one of them is incomplete:

  1. **Final criteria scorecard**: Each criterion with evidence basis (what research found), confidence level, and how to evaluate a candidate against it. Criteria must be language-agnostic (applicable to JavaScript, TypeScript, Python, and Go repos). Format as a markdown table: `| Criterion | Evidence | Confidence | How to Evaluate |`.

  2. **Candidate verdicts**: One entry per candidate evaluated. Format as one `### [Candidate Name]` subsection per candidate, each containing a bold verdict line (`**Verdict: Pass / Fail / Conditional**`), rationale paragraph, and caveats if any. Candidates: commit-story-v2 (JavaScript), Cluster Whisperer (TypeScript), k8s-vectordb-sync (Go), and the recommended Python candidate. If commit-story-v2 fails the criteria, explicitly state: "Recommend starting a new official JS baseline on [alternative]; existing runs remain valid as prototype history."

  3. **IS scorability notes**: For each candidate, note whether it is locally runnable (straightforward IS scoring) or requires infrastructure (Kind cluster for k8s repos; adds complexity but is not a blocker).

  Write the document, then commit with `[skip ci]` and push to main (`git push origin HEAD:main`).

  Success criteria: `docs/research/eval-target-criteria.md` exists; all three required sections are present; every known candidate has a verdict with rationale; the Python candidate is identified.

- [ ] **Create PRDs for Steps 5–7 using validated targets**

  After `docs/research/eval-target-criteria.md` is committed, read the candidate verdicts and create three PRDs using `/prd-create`:

  - **Step 5**: TypeScript eval setup + Run-1 for the validated TypeScript target (Cluster Whisperer unless the research spike recommends otherwise)
  - **Step 6**: Python eval setup + Run-1 for the validated Python candidate from the research findings
  - **Step 7**: Go eval setup + Run-1 for the validated Go target (k8s-vectordb-sync unless the research spike recommends otherwise)

  Each of these is a Type C PRD. Before creating each PRD, read `docs/language-extension-plan.md` "Type C: Setup + Run-1 PRD" section for the required milestone structure. Use `docs/templates/type-c-prd-template.md` as the starting point for each PRD (created by PRD #43 — if it doesn't exist, use the Type C description in the language-extension-plan as the structure reference instead). Each PRD must document both gate conditions in its Prerequisites or Dependencies section so future implementors know when the PRD can be started — do NOT evaluate these gates now:
  - Gate 1 (provider): The TypeScript/Python/Go language provider must be merged to spiny-orb main before this PRD can start. Note where to check current status: `docs/language-extension-plan.md` "Language Candidates" table.
  - Gate 2 (research): `docs/research/eval-target-criteria.md` must exist with a verdict for this language before this PRD can start. "Before forking anything, read `docs/research/eval-target-criteria.md` to confirm the validated target for this language."

  Run `/write-prompt` on each PRD's milestones section before committing. Choose "commit for later" in `/prd-create` — do NOT start any of these PRDs.

  If a language target failed the criteria and no suitable alternative exists, create the PRD anyway with a clear note in the Overview explaining the gap and what would need to change before the PRD can be started.

  Success criteria: Three PRDs exist on main (Steps 5, 6, 7); each references the validated target from `docs/research/eval-target-criteria.md`; `docs/ROADMAP.md` shows real issue numbers for all three (verify — `/prd-create` updates this automatically).

## Dependencies and Constraints

- **Depends on**: `docs/language-extension-plan.md` (hypotheses table, candidate list, Type C PRD structure)
- **Depends on**: `docs/research/instrumentation-score-integration.md` (IS scorability dimension)
- **Blocks**: Steps 5, 6, 7 — Type C PRDs for TypeScript, Python, Go cannot proceed until `docs/research/eval-target-criteria.md` exists
- **No ordering dependency on Steps 1 or 2** — this spike can run in parallel with or after PRDs #43 and #44
- **Output path is predefined and immutable**: `docs/research/eval-target-criteria.md` — do not change it

## Risks and Mitigations

- **Risk**: Research agent confirms all hypotheses without surfacing new factors
  - **Mitigation**: Research framing explicitly instructs the agent to find factors not in the hypothesis list; a spike that only confirms is flagged as incomplete
- **Risk**: No suitable Python candidate found
  - **Mitigation**: If research finds no candidate meeting all criteria, document the gap with rationale and what constraints prevent finding a good candidate; the Step 6 PRD notes this explicitly
- **Risk**: commit-story-v2 fails the criteria, invalidating existing eval history
  - **Mitigation**: Existing runs remain valid as prototype/development history even if commit-story-v2 is replaced; explicitly documented in the findings doc

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-09 | Output path predefined as `docs/research/eval-target-criteria.md` | Downstream Type C PRDs need a stable known path without searching for the research PRD | Path must not change |
| 2026-04-09 | Derive criteria from first principles, not from commit-story-v2 | commit-story-v2 was chosen by circumstance; using it as the reference would bake in its characteristics as criteria | commit-story-v2 must be evaluated against criteria, not used to define them |
| 2026-04-09 | Final milestone creates PRDs for Steps 5–7 | Research output immediately unblocks downstream work; avoids a separate "create PRDs" step | Three PRDs created as output of this spike |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created | Draft | Await start |
