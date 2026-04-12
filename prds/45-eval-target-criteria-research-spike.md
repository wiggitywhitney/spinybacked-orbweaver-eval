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

- [x] **Revise criteria scorecard and find 12 candidates** (Updated: was "Write findings"; initial version done but needs revision per decisions above)

  The initial findings doc exists at `docs/research/eval-target-criteria.md` but needs revision. The revised document must:

  1. **Redo the criteria scorecard with rubric rule coverage as the primary criterion.** Read the 32-rule rubric at `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md`. For each rule, document what a target repo needs for that rule to fire. Format as a table: `| Rule | What the target needs | Example |`. The 9 hypotheses from the original research are incorporated as supporting context for specific rules, not as standalone criteria.

     **Rubric rule mapping examples** (to calibrate the expected depth):
     - `COV-006`: Target must import a library from `KNOWN_FRAMEWORK_PACKAGES` (or language equivalent) so the agent can test auto-instrumentation recommendation vs. manual spans. This is about ANY library with OTel auto-instrumentation (HTTP clients, DB drivers, web frameworks, message queues) — NOT specifically about LLM frameworks. Do not over-weight LLM-calling repos just because the existing target (commit-story-v2) uses LangGraph.
     - `CDQ-003`: Target must have diverse error handling patterns (try/catch with specific exceptions, retry logic, custom exception hierarchies) so the agent's error handling instrumentation quality is tested across multiple patterns.
     - `RST-001`: Target must have files with no I/O operations (pure types, utilities, constants) so the agent's skip judgment is tested — these files should NOT be instrumented.
     - `SCH-*` rules: Target must have domain concepts that map to semantic convention attributes. A deliberately incomplete Weaver schema (see eval design strategy) tests whether the agent extends the schema.
     - `NDS-002`: Target must have a passing test suite. This is a hard gate — if tests fail after instrumentation, the entire run fails.

     File count guidance: 30 files or less is ideal; higher only if extra rubric coverage justifies longer runtime (grounded in operational data: 30 files = ~40 minutes). Include auto-instrumentation library overlap as a criterion (tests COV-006). Note that `KNOWN_FRAMEWORK_PACKAGES` in `~/Documents/Repositories/spinybacked-orbweaver/src/languages/javascript/ast.ts` is the current auto-instrumentation list (JS/TS only); Python and Go equivalents do not exist yet. When evaluating Python/Go candidates for auto-instrumentation overlap, check against the OTel contrib instrumentation list for that language (Python: `https://github.com/open-telemetry/opentelemetry-python-contrib/tree/main/instrumentation`; Go: `https://github.com/open-telemetry/opentelemetry-go-contrib/tree/main/instrumentation`), not against a spiny-orb list that doesn't exist yet.

  2. **Find and assess 3 candidates per language (12 total).** Use `/research` to search for candidates. Search for open-source CLI tools in each language with 500+ stars, MIT/Apache/BSD license, 30 or fewer source files, and at least 2 I/O types. Prioritize tools that use libraries from the OTel auto-instrumentation ecosystem. Assess each against the rubric-coverage scorecard. For each candidate, document: name, GitHub URL, license, stars, source file count, I/O types, auto-instrumentation library overlap, rubric rules exercisable, and any caveats (already instrumented, k8s-dependent, etc.). Focus the rubric mapping on rules where candidates meaningfully differ — rules universally met (e.g., license) can be grouped in a summary note.
     - **JavaScript**: Must include commit-story-v2. Find 2 more open-source JS CLI tools.
     - **TypeScript**: Include taze (already identified). Find 2 more. Whitney's local repos (Cluster Whisperer, spiny-orb frozen copy) may be included if they compete on merit, but don't force them.
     - **Python**: Include commitizen (already identified). Find 2 more.
     - **Go**: Find 3 open-source Go CLI tools. k8s-vectordb-sync may be included if it competes on merit.

     **Candidate diversity rule**: Prefer candidates from different GitHub authors/organizations within each language. Same-author candidates share coding style and dependency choices, reducing rubric rule diversity. Not a hard rule, but a tiebreaker when candidates are otherwise equal.

  3. **IS scorability notes** for each candidate.

  Write the revised document, then commit with `[skip ci]`.

  Success criteria: `docs/research/eval-target-criteria.md` has rubric-coverage-based scorecard; 3 candidates per language (12 total) with assessments; JS candidates include commit-story-v2.

- [x] **Revise Type C PRDs for all 4 languages**

  **Do NOT use `/prd-create`** — PRDs #50–53 and their GitHub issues already exist. Edit the existing files only.

  **What is already done (do not repeat):**
  - Milestone 0 sections of PRDs #50–53 have been rewritten to point to pre-researched rubric coverage tables in `docs/research/eval-target-criteria.md` Section 2.1–2.4. Local verification steps (clone, run tests 3×, confirm file count, grep for existing OTel) are already specified.
  - `/write-prompt` review of all 4 PRDs is in progress this session.

  **What still needs to be done:**

  1. Read each of the 4 PRD files (`prds/50-typescript-eval-setup.md`, `prds/51-python-eval-setup.md`, `prds/52-go-eval-setup.md`, `prds/53-javascript-eval-setup.md`) in full.

  2. Verify each PRD contains these 3 required milestones (in addition to the standard eval chain milestones). Add any that are missing; leave existing milestones that already conform:
     - **Milestone 0: Evaluate and choose target.** Must point to `docs/research/eval-target-criteria.md` Section 2.X for pre-researched coverage tables. Must NOT ask the agent to redo the rubric rule mapping or COV-006 overlap analysis — that research is done. Must ask the agent to: clone all 3 candidates, run test suite 3× per candidate, confirm file counts locally, confirm no existing OTel instrumentation.
     - **Milestone: Add auto-instrumentation libraries to spiny-orb.** For this language, add the most popular OTel-instrumented packages to spiny-orb's `KNOWN_FRAMEWORK_PACKAGES` or language-specific equivalent. This is a contribution to spiny-orb, not just eval setup.
     - **Milestone: Create deliberately incomplete Weaver schema.** When creating `semconv/` for the chosen target, deliberately omit some spans and attributes a human would include. Document what was omitted and why — so the eval can verify whether spiny-orb surfaces them. Tests SCH extension capability.

  3. Verify each PRD documents both gate conditions:
     - Gate 1 (provider): Language provider merged to spiny-orb main.
     - Gate 2 (research): `docs/research/eval-target-criteria.md` exists with 3 candidates for this language (already satisfied).

  4. Update `docs/ROADMAP.md` if any issue numbers are still showing as TBD. Real issue numbers: JS = #53, TS = #50, Python = #51, Go = #52.

  5. Commit all changes with `[skip ci]`. Do NOT invoke `/prd-start` on any of the 4 PRDs.

  Success criteria: PRDs #50–53 each contain Milestone 0 (pointing to pre-researched tables, verification-only steps), the auto-instrumentation expansion milestone, and the deliberately incomplete schema milestone. `docs/ROADMAP.md` shows real issue numbers for all four. No PRD has been started.

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
| 2026-04-11 | Auto-instrumentation library overlap added as criterion | Target should use libraries with OTel auto-instrumentation packages to test COV-006 rule. Known list at `~/Documents/Repositories/spinybacked-orbweaver/src/languages/javascript/ast.ts` (KNOWN_FRAMEWORK_PACKAGES). Python/Go providers need language-specific equivalents. | New recommended criterion added |
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
| 2026-04-11 | Copy style reference artifacts to docs/templates/ on main | The eval branch (feature/prd-33-evaluation-run-12) could be deleted per git workflow rules, breaking all git show style references permanently. Copying to main makes references durable. | All PRDs now reference docs/templates/eval-run-style-reference/ instead of git show commands |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created | Draft | Await start |
| 2026-04-11 | Step 0 complete — framing docs read, 9 hypotheses identified, Python candidate gap confirmed, IS scorability requirements documented | In Progress | Run research spike (milestone 2) |
| 2026-04-11 | Research spike complete — 5/9 hypotheses supported, 4 refined (async→I/O density, file count range expanded, skip-rate balanced, idiom split). 4 new factors: contamination risk, reproducibility, entry point clarity, file size variance. Python candidate: commitizen (MIT, 3.4k stars, ~45-55 files). Raw research in docs/research/eval-target-selection-research.md | In Progress | Write findings doc (milestone 3) |
| 2026-04-11 | Findings doc written to docs/research/eval-target-criteria.md with all 3 required sections: criteria scorecard (6 mandatory + 6 recommended), candidate verdicts (4 candidates assessed), IS scorability notes. Research index updated. | In Progress | Create PRDs for Steps 5-7 (milestone 4) |
| 2026-04-11 | Major post-review revision: rubric coverage as primary framing, auto-instrumentation library criterion, deliberately incomplete Weaver schemas, TypeScript candidate search (taze recommended), objectivity corrections on thresholds, "locally runnable" demoted to recommended. Both research doc and criteria doc updated. PRDs #50-52 created (TS/Python/Go) but need revision based on new decisions. | In Progress | Regroup on next steps — criteria and candidates may need further research |
| 2026-04-11 | Structural decisions: 3 candidates per language (12 total), Type C PRDs get milestone 0 for target selection, JS gets its own Type C PRD with early exit, auto-instrumentation library expansion is a Type C milestone, file count ideal is 30 or less. Milestone 3 unmarked (needs redo with rubric-coverage framing). Milestone 4 rewritten (4 Type C PRDs, not 3). PRDs #50-52 need revision to match. | In Progress | Redo milestone 3 (criteria + 12 candidates), then milestone 4 (4 Type C PRDs) |
| 2026-04-11 | Milestone 3 complete — rubric-coverage scorecard with 32-rule mapping written; 12 candidates (3 per language) evaluated fresh against rubric: JS (commit-story-v2, release-it, npm-check), TS (taze, changesets, wireit), Python (mycli, iredis, commitizen), Go (mods, dbmate, ghq). COV-006 correction: mechanism is AUTO_INSTRUMENTED_OPERATIONS (call-site regex patterns in cov006.ts), not KNOWN_FRAMEWORK_PACKAGES (import classifier). All COV-006 assessments marked 🔍 unverified. | In Progress | Create/revise 4 Type C PRDs (milestone 4) |
| 2026-04-11 | Milestone 4 complete — all 4 Type C PRDs revised: Milestone 0 updated to use pre-researched rubric tables (no rediscovery), /write-prompt review applied to all 5 touched PRDs, per-rule comparison tables added to eval-target-criteria.md, "Adding a new language" process guide added to language-extension-plan.md. | Complete | /prd-done |
