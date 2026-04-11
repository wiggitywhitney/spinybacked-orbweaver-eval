# Eval Target Criteria Research Spike — PRD

**Issue**: [#45](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/45)
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

- **Primary**: `docs/research/eval-target-criteria.md` exists with a rubric-coverage-based scorecard and 3 candidate shortlists per language (JS, TS, Python, Go = 12 candidates total)
- **Secondary**: The scorecard's primary criterion is rubric rule coverage — how many of the 32 rules can each candidate exercise
- **Validation**: A Type C PRD agent reading `docs/research/eval-target-criteria.md` can evaluate 3 candidates for their language and pick the best one without additional research

## Requirements

### Functional Requirements

- **Must Have**: Research spike run using the `/research` skill — hypotheses are things to investigate, not criteria to confirm
- **Must Have**: Language-agnostic criteria scorecard derived from research findings
- **Must Have**: 3 candidates per language (JS, TS, Python, Go = 12 total). JS must include commit-story-v2. Other languages may include Whitney's local repos if they compete on merit.
- **Must Have**: Each candidate assessed against rubric-coverage-based scorecard
- **Must Have**: Findings written to `docs/research/eval-target-criteria.md` — this path is predefined and stable; do not choose a different output path
- **Must Have**: Final milestone creates PRDs for Steps 4–7 (JS, TypeScript, Python, Go eval setup) with candidate shortlists — target selection happens in each Type C PRD's milestone 0, not here
- **Should Have**: IS scorability incorporated as one criterion dimension (see `docs/research/instrumentation-score-integration.md` for what makes a repo produce meaningful IS scores)

### Non-Functional Requirements

- The output path `docs/research/eval-target-criteria.md` must not change — downstream Type C PRDs reference this exact path
- Do NOT treat commit-story-v2 as the assumed "correct" answer — it must be evaluated against the criteria like any other candidate
- Do NOT create PRDs for Steps 5–7 until the research findings are written and reviewed

## Implementation Milestones

- [x] **Step 0: Read the research spike framing before running any research**

  Read `docs/language-extension-plan.md` in full, paying particular attention to: (1) "Research Spike: Ideal Eval Target Criteria" section — hypotheses table and the constraint that criteria must be derived from first principles; (2) "Language Candidates" table — which repos are known candidates for each language; (3) "Type C: Setup + Run-1 PRD" section — what a target repo must support for the full eval workflow, including IS scoring runs. Also read `docs/research/instrumentation-score-integration.md` for the IS scorability dimension (what makes a repo produce meaningful IS scores, particularly the k8s-dependent repo constraint).

  Do not start the research milestone until you have answered: What are the 9 hypotheses to investigate? What is the known Python candidate status (none — must be found)? What does IS scorability require from a target repo?

  Success criteria: No research run yet. Milestone complete when the answers to those three questions are clear.

- [x] **Run the research spike**

  Use the `/research` skill to investigate eval target criteria. Frame the research as: "Here are factors we think may matter for evaluating spiny-orb against a target repo — research whether they actually do and find what we're missing." Hand the agent the 9 hypotheses from `docs/language-extension-plan.md` as things to investigate, not as settled criteria.

  The research agent must:
  1. Find evidence for or against each of the 9 hypotheses in the language-extension-plan
  2. Identify factors not in the hypotheses list that affect eval target quality
  3. Evaluate commit-story-v2, Cluster Whisperer, and k8s-vectordb-sync against whatever criteria emerge
  4. Identify at least one Python candidate repo (small, popular, permissively licensed open-source project; fork-and-freeze approach — never pull upstream)
  5. Assess IS scorability as a dimension: does the repo need infrastructure to exercise? Can it emit spans locally?

  Do NOT ask the research agent to "confirm" the hypotheses — frame it as open investigation. A spike that confirms all hypotheses without surfacing new factors has not done its job.

  Success criteria: Research agent returns findings with evidence for/against each hypothesis, new factors identified, and per-candidate assessments for all four languages (including Python candidate recommendation).

- [ ] **Revise criteria scorecard and find 12 candidates** (Updated: was "Write findings"; initial version done but needs revision per decisions above)

  The initial findings doc exists at `docs/research/eval-target-criteria.md` but needs revision. The revised document must:

  1. **Redo the criteria scorecard with rubric rule coverage as the primary criterion.** Map each of the 32 rubric rules to what a target repo needs for that rule to fire. The 9 hypotheses from the original research are incorporated but subordinate to rule coverage. File count guidance: 30 files or less is ideal; higher only if extra rubric coverage justifies longer runtime (grounded in operational data: 30 files = ~40 minutes). Include auto-instrumentation library overlap as a criterion (tests COV-006). Include deliberately incomplete Weaver schema strategy. Note that `KNOWN_FRAMEWORK_PACKAGES` in `spinybacked-orbweaver/src/languages/javascript/ast.ts` is the current auto-instrumentation list (JS/TS only); Python and Go equivalents need to be created.

  2. **Find and assess 3 candidates per language (12 total).** Use `/research` to search for candidates. Assess each against the rubric-coverage scorecard. For each candidate, document: name, GitHub URL, license, stars, source file count, I/O types, auto-instrumentation library overlap, rubric rules exercisable, and any caveats (already instrumented, k8s-dependent, etc.).
     - **JavaScript**: Must include commit-story-v2. Find 2 more open-source JS CLI tools.
     - **TypeScript**: Include taze (already identified). Find 2 more. Whitney's local repos (Cluster Whisperer, spiny-orb frozen copy) may be included if they compete on merit, but don't force them.
     - **Python**: Include commitizen (already identified). Find 2 more.
     - **Go**: Find 3 open-source Go CLI tools. k8s-vectordb-sync may be included if it competes on merit.

  3. **IS scorability notes** for each candidate.

  Write the revised document, then commit with `[skip ci]`.

  Success criteria: `docs/research/eval-target-criteria.md` has rubric-coverage-based scorecard; 3 candidates per language (12 total) with assessments; JS candidates include commit-story-v2.

- [ ] **Create/revise Type C PRDs for all 4 languages** (Updated: was "Steps 5-7"; now includes JS and restructured milestone 0)

  After `docs/research/eval-target-criteria.md` is revised with 12 candidates, create or revise 4 Type C PRDs using `/prd-create`:

  - **JavaScript**: New Type C PRD. Milestone 0 evaluates 3 JS candidates (including commit-story-v2). **Early exit:** if milestone 0 picks commit-story-v2, the PRD exits early — it's already set up and running. If a different candidate wins, pause for Whitney's confirmation with rationale before proceeding with fork/setup/Run-1.
  - **TypeScript**: Revise PRD #50. Milestone 0 evaluates 3 TS candidates from the shortlist.
  - **Python**: Revise PRD #51. Milestone 0 evaluates 3 Python candidates from the shortlist.
  - **Go**: Revise PRD #52. Milestone 0 evaluates 3 Go candidates from the shortlist.

  Each Type C PRD must include these milestones (in addition to the standard eval chain milestones):

  - **Milestone 0: Evaluate and choose target from 3 candidates.** Clone all 3 candidates from `docs/research/eval-target-criteria.md`. For each: run test suite (3 times for deterministic reproducibility), count source files, check auto-instrumentation library overlap against KNOWN_FRAMEWORK_PACKAGES (or language equivalent), map rubric rule coverage. Pick the winner. Document rationale. For JS: if commit-story-v2 wins, exit early.
  - **Milestone: Add auto-instrumentation libraries to spiny-orb.** Research and add the most popular auto-instrumentation libraries for this language to spiny-orb's `KNOWN_FRAMEWORK_PACKAGES` or language-specific equivalent. This is a contribution to spiny-orb itself, not just eval setup. Python examples: requests, flask, django, sqlalchemy, psycopg2. Go examples: net/http, database/sql, google.golang.org/grpc.
  - **Milestone: Create deliberately incomplete Weaver schema.** When creating `semconv/` for the target, omit some spans/attributes that a human would include. Document exactly what was omitted so the eval can check whether spiny-orb surfaces the gaps. Tests SCH extension capability.

  Each PRD must document both gate conditions:
  - Gate 1 (provider): Language provider merged to spiny-orb main.
  - Gate 2 (research): `docs/research/eval-target-criteria.md` exists with 3 candidates for this language.

  Run `/write-prompt` on each PRD's milestones section before committing. Choose "commit for later" — do NOT start any of these PRDs.

  Success criteria: 4 Type C PRDs exist on main (JS, TS, Python, Go); each has milestone 0 (candidate evaluation), auto-instrumentation library expansion milestone, and deliberately incomplete Weaver schema milestone; `docs/ROADMAP.md` shows real issue numbers for all four.

## Dependencies and Constraints

- **Depends on**: `docs/language-extension-plan.md` (hypotheses table, candidate list, Type C PRD structure)
- **Depends on**: `docs/research/instrumentation-score-integration.md` (IS scorability dimension)
- **Blocks**: Steps 4, 5, 6, 7 — Type C PRDs for JS, TypeScript, Python, Go cannot proceed until `docs/research/eval-target-criteria.md` exists with 3 candidates per language
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
| 2026-04-11 | Rubric coverage maximization is the primary framing, not file count or I/O diversity | Whitney identified that proxy metrics were masking the real question: how many of the 32 rubric rules can a target exercise? File count and I/O diversity are useful filters but not the goal. | Criteria scorecard restructured; mandatory/recommended reclassified |
| 2026-04-11 | Auto-instrumentation library overlap added as criterion | Target should use libraries with OTel auto-instrumentation packages to test COV-006 rule. Known list at `spinybacked-orbweaver/src/languages/javascript/ast.ts` (KNOWN_FRAMEWORK_PACKAGES). Python/Go providers need language-specific equivalents. | New recommended criterion added |
| 2026-04-11 | Deliberately incomplete Weaver schemas as eval design | When creating semconv/ for a target, omit some spans/attributes to test whether spiny-orb identifies and proposes extensions (SCH extension capability). Document omissions in Type C PRD. | Eval design strategy added to criteria doc and all Type C PRDs |
| 2026-04-11 | "Locally runnable" demoted from mandatory to recommended | Initial elevation was partly circular (validated existing targets). k8s-dependent repos are viable with infrastructure setup. | Cluster Whisperer and k8s-vectordb-sync less penalized |
| 2026-04-11 | taze identified as TypeScript candidate | Follow-up search found taze (antfu-collective/taze): MIT, 4.1k stars, 32 TS files, 3 I/O types including HTTP, locally runnable. Stronger than Cluster Whisperer on most criteria. | TypeScript PRD (#50) needs updating with taze as recommended candidate |
| 2026-04-11 | Cluster Whisperer and k8s-vectordb-sync both already instrumented | Frozen eval copies would need existing OTel instrumentation stripped. Adds setup work to Type C PRDs. | Type C PRDs must include instrumentation stripping milestone |
| 2026-04-11 | Objectivity correction applied | Initial criteria thresholds were partly anchored on commit-story-v2. 15-50 file range was derived from one data point. Research doc and criteria doc updated with caveat. | Thresholds documented as guidelines, not hard cutoffs |
| 2026-04-11 | 3 candidates per language (12 total), not 1 | Initial research was too shallow — one candidate per language doesn't provide comparison. 3 candidates per language (JS, TS, Python, Go) gives recommended/runner-up/backup. JS must include commit-story-v2 as one of the three. | Milestone 4 scope expanded; deliverable now includes candidate shortlists |
| 2026-04-11 | File count: 30 or less is ideal | 30 files took ~40 minutes in practice. Higher only if extra rubric coverage justifies longer runtime. This is grounded in operational data, not arbitrary range. | Criteria scorecard updated; file count guidance tightened |
| 2026-04-11 | Type C PRDs get milestone 0: evaluate and choose from 3 candidates | Final target selection happens in the Type C PRD, not the research spike. Milestone 0 clones all 3 candidates, runs tests, maps rubric coverage, picks the winner. JS early exit: if commit-story-v2 is chosen, PRD exits early since it's already set up. Otherwise pause for Whitney's confirmation. | All Type C PRDs restructured with milestone 0 |
| 2026-04-11 | Type C PRDs include auto-instrumentation library expansion milestone | Each Type C PRD adds the most popular auto-instrumentation libraries for that language to spiny-orb's KNOWN_FRAMEWORK_PACKAGES (or language equivalent). This is a contribution to spiny-orb, not just eval setup. | New milestone in all Type C PRDs |
| 2026-04-11 | 4 Type C PRDs needed (JS, TS, Python, Go), not 3 | JavaScript needs a Type C PRD too — milestone 0 evaluates 3 JS candidates including commit-story-v2. If commit-story-v2 wins, early exit. If not, proceed with fork/setup/Run-1 on the new target. | New JS Type C PRD required |
| 2026-04-11 | Redo criteria scorecard with rubric rule coverage as primary | The scorecard needs to map each rubric rule to what a target repo needs. Hypotheses are incorporated but subordinate to rule coverage. Research must be redone with the right framing. | Milestone 3 findings doc needs revision; milestone 4 blocked on revised scorecard |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created | Draft | Await start |
| 2026-04-11 | Step 0 complete — framing docs read, 9 hypotheses identified, Python candidate gap confirmed, IS scorability requirements documented | In Progress | Run research spike (milestone 2) |
| 2026-04-11 | Research spike complete — 5/9 hypotheses supported, 4 refined (async→I/O density, file count range expanded, skip-rate balanced, idiom split). 4 new factors: contamination risk, reproducibility, entry point clarity, file size variance. Python candidate: commitizen (MIT, 3.4k stars, ~45-55 files). Raw research in docs/research/eval-target-selection-research.md | In Progress | Write findings doc (milestone 3) |
| 2026-04-11 | Findings doc written to docs/research/eval-target-criteria.md with all 3 required sections: criteria scorecard (6 mandatory + 6 recommended), candidate verdicts (4 candidates assessed), IS scorability notes. Research index updated. | In Progress | Create PRDs for Steps 5-7 (milestone 4) |
| 2026-04-11 | Major post-review revision: rubric coverage as primary framing, auto-instrumentation library criterion, deliberately incomplete Weaver schemas, TypeScript candidate search (taze recommended), objectivity corrections on thresholds, "locally runnable" demoted to recommended. Both research doc and criteria doc updated. PRDs #50-52 created (TS/Python/Go) but need revision based on new decisions. | In Progress | Regroup on next steps — criteria and candidates may need further research |
| 2026-04-11 | Structural decisions: 3 candidates per language (12 total), Type C PRDs get milestone 0 for target selection, JS gets its own Type C PRD with early exit, auto-instrumentation library expansion is a Type C milestone, file count ideal is 30 or less. Milestone 3 unmarked (needs redo with rubric-coverage framing). Milestone 4 rewritten (4 Type C PRDs, not 3). PRDs #50-52 need revision to match. | In Progress | Redo milestone 3 (criteria + 12 candidates), then milestone 4 (4 Type C PRDs) |
