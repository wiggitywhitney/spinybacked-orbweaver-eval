# Language Extension Plan — spinybacked-orbweaver Evaluation

**Created:** 2026-04-09
**Status:** Draft — pending research to validate assumptions

This document captures the plan for extending the spinybacked-orbweaver evaluation framework beyond JavaScript to TypeScript, Python, Go, and future languages. It was developed in conversation during run-12 evaluation work.

## How to Use This Document

Consult this document when deciding which PRD type fits a new piece of work, understanding trigger conditions for new language evaluation chains, or recalling research spike constraints before running a target-selection spike.

**Do NOT treat this as an immediate work queue.** See [Execution Roadmap](#execution-roadmap-1) for current actions.

---

## Overview

The current repo (`commit-story-v2-eval`) evaluates spiny-orb against one JavaScript target. The plan generalizes this into a multi-language, multi-target evaluation framework. Three kinds of work are needed, each represented by a different PRD type.

---

## PRD Types

There are **four** PRD types in the full framework. When someone says "two PRD types," they are referring specifically to Types C + D — the two types needed when adding a new language/target repo. The full framework also requires Types A and B for infrastructure and research work. Do not collapse the taxonomy back to two.

### Type A: Infrastructure PRD
Work that changes the evaluation framework itself — not a specific language or target. Examples:
- Repo generalization (rename, restructure, ROADMAP.md)
- Rubric methodology updates
- Process improvements that span all evaluation chains

These PRDs are created ad-hoc when infrastructure work is needed. They are NOT part of any recurring chain. A Type A PRD is complete when the infrastructure change is live and documented in PROGRESS.md.

### Type B: Research Spike PRD
Investigation work that produces criteria, decisions, or findings used by other PRDs. Examples:
- Deriving the "ideal eval target" criteria scorecard
- Evaluating candidate target repos for a specific language
- Determining whether commit-story-v2 is actually a good JavaScript eval target

Research spikes produce artifacts (scorecards, findings docs) and decisions that unblock downstream PRDs. They are created when a decision needs to be made before implementation can proceed. A Type B PRD is complete when a written findings document exists and any downstream PRD decision logs are updated with the spike's conclusions.

### Type C: Setup + Run-1 PRD (one per language/target, never repeated)
The first PRD for any new language/target combination. Covers:
1. Fork the target repo and create the eval repo directory structure
2. Add spiny-orb prerequisites to the target repo:
   - `spiny-orb.yaml` configuration
   - Initial Weaver `semconv/` schema
   - Language-appropriate init file (JavaScript: `traceloop-init.js` equivalent; Python/Go/TypeScript: language-specific OTel setup)
   - Dependency declarations (peerDependencies for JS/TS; language-appropriate for others)
3. Verify the test suite runs clean on the unmodified target
4. Run the first baseline evaluation (Run-1)
5. Produce Run-1 findings, which triggers a Type D PRD

This PRD type exists exactly once per target. It is the "onboarding" for that language/target combination.

**When drafting a Type C PRD**: Use the most recent JavaScript eval run PRD (currently `prds/37-evaluation-run-13.md`) as a **model** — understand its milestone structure and adapt it for the new language, making language-specific adjustments where needed. Do not copy it verbatim. Before committing the draft, launch a verification agent with: "Compare this [language] Type C PRD milestone by milestone against `prds/37-evaluation-run-13.md`. Flag any step present in the JS PRD that is absent or weaker in the new PRD, and explain whether each omission is justified (e.g., JS-specific detail that doesn't apply) or a gap that needs to be filled."

**Language-specific prerequisites reference**: Use the commit-story-v2 JavaScript setup as the current working reference for what each prerequisite looks like, then adapt for the target language. This choice is provisional — the research spike (Step 2) will validate or replace commit-story-v2 as the JS reference target. If the spike recommends switching, update this reference accordingly. For JavaScript/TypeScript, `traceloop-init.js` handles OTel auto-instrumentation registration; for Python/Go, use the language-appropriate SDK initialization equivalent. The initial `semconv/` schema should mirror the structure in `commit-story-v2/semconv/` adapted to the target's domain.

**Operational details for Type C PRDs**:
- Whitney runs `spiny-orb instrument` herself in her own terminal — the AI does not run this command
- `GITHUB_TOKEN` must be in the environment for spiny-orb to create a PR
- The Run-1 evaluation follows the full Type D milestone structure, including both user-facing checkpoints (Findings Discussion and handoff pause)

**Exact instrument command** (run from the target repo directory, update `run-N` to current run number):

```bash
caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose 2>&1 | tee ~/Documents/Repositories/commit-story-v2-eval/evaluation/run-N/spiny-orb-output.log
```

Note: two parts of this command need updating for each run: (1) `run-N` → current run number, (2) `commit-story-v2-eval` → new repo name after Step 1 (repo generalization). Everything else stays the same.

### Type D: Run-N PRD (recurring, indefinitely)
Identical in structure to the existing PRDs #3–13. Triggered by findings from the previous run. Follows the established milestone sequence:
1. Collect skeleton documents
2. Pre-run verification (verify prior findings fixed, check prerequisites)
3. Evaluation run (Whitney runs `spiny-orb instrument` in her terminal — see exact command in Type C section above)
4. Findings Discussion *(user-facing checkpoint 1: raw signal before analysis)*
5. Failure deep-dives
6. Per-file evaluation
7. PR artifact evaluation
8. Rubric scoring
9. Baseline comparison
10. Actionable fix output *(user-facing checkpoint 2: interpreted summary + handoff pause)*
11. Draft next PRD

Type D PRDs form the recurring evaluation chain for each language/target.

### Eval Branch Convention (all evaluation PRDs)

Evaluation feature branches (`feature/prd-N-evaluation-run-N`) **never merge to main**. PRs exist for CodeRabbit review only. When `/prd-done` runs at completion, close the issue without merging the eval branch. This applies to every Type D PRD.

---

## When to Create PRDs for New Languages

**Do NOT create waiting PRDs for languages without a working provider in spiny-orb.**

The trigger for each new language's evaluation chain:
- **Language provider merges to spiny-orb main** → create the Research Spike PRD for that language (if not already done) or directly the Type C (Setup + Run-1) PRD if the target is already chosen and validated.

TypeScript is next. The TypeScript language provider (PRD B in spinybacked-orbweaver) gates the TypeScript evaluation chain.

---

## Repo Generalization

**Decision: generalize this repo** (not separate repos per language, not a shared-methodology repo with separate target repos).

The methodology and artifacts belong together because the methodology evolves from the artifacts. When a TypeScript run surfaces a new failure mode, it should immediately inform the JavaScript evaluation methodology. One repo keeps cross-language comparisons natural and process improvements automatically available everywhere.

### Planned structure after generalization

```text
spinybacked-orbweaver-eval/
  evaluation/
    commit-story-v2/          ← move current run-1 through run-N here
      run-1/ ... run-13/
    cluster-whisperer/        ← TypeScript target (if validated)
      run-1/
    k8s-vectordb-sync/        ← Go target (if validated)
      run-1/
  prds/                       ← all PRDs; titles indicate target language/repo
  rubric/                     ← canonical methodology docs (rubric, templates)
  docs/
    ROADMAP.md                ← added during generalization; prd-create/done maintain it
    language-extension-plan.md  ← this file
  PROGRESS.md
```

PRD numbering stays sequential (GitHub issue numbers). PRD titles include the target: "TypeScript eval setup + Run-1: Cluster Whisperer baseline."

### Migration work
- Rename/fork repo to `spinybacked-orbweaver-eval`
- Move `evaluation/run-*/` to `evaluation/commit-story-v2/run-*/`
- Update all internal path references in PRD files and CLAUDE.md
- Update PRD titles and prior art references to include target names
- Create `docs/ROADMAP.md`
- Document "how to add a new language eval" as a rules/CLAUDE.md entry
- Establish PRD template files for Type C and Type D in `docs/templates/` so future agents have a canonical starting point. Until `docs/templates/` exists, use the most recent JS eval run PRD (currently `prds/37-evaluation-run-13.md`) as the style reference for Type D, and this document's Type C description as the structure reference for Type C.

---

## Research Spike: Ideal Eval Target Criteria

**Critical constraint: derive criteria from first principles, not from commit-story-v2.**

commit-story-v2 was chosen as the JavaScript eval target by circumstance, not by research. It may or may not be a good target. The research spike must evaluate it alongside other candidates — it does not get assumed to be correct.

The spike produces a language-agnostic scorecard. All candidates — including commit-story-v2 — are evaluated against it. The spike may conclude:
- commit-story-v2 is a good target → continue the existing JS chain on it
- commit-story-v2 has weaknesses → start a new "official" JS baseline on a better target; treat existing runs as prototype/development history (still valid for tracking spiny-orb improvement on that specific target)

### Hypotheses to validate (not confirmed criteria)

These are informed guesses from 12 runs on one repo. The research spike should validate, refute, or replace each one:

| Hypothesis | Source | Confidence |
|-----------|--------|------------|
| ~15–40 async files is the right size | Inferred from commit-story-v2's 30 files / 54-min runtime | Low — one data point |
| ~40–60% skip rate exercises RST judgment | Inferred from commit-story-v2's 17/30 skips | Low — one data point |
| Async density matters more than total file count | Inferred from where failure modes occur | Medium |
| Error handling diversity surfaces CDQ-003 patterns | Grounded in rubric rule mechanics | High |
| Test suite health is load-bearing | Grounded in NDS-002 being a hard gate | High |
| Language-idiom coverage matters | Logical inference; no data | Low |
| Domain variety (I/O, external calls, entry points) produces more failure modes | Observed across 12 runs | Medium |
| Fork-and-freeze; live upstream doesn't matter | Logical; no counter-evidence | High |
| MIT/Apache-2 sufficient for legal use | Standard open-source law | High |

### Research agent framing

Give the agent these hypotheses as **things to investigate**, not as settled criteria. Ask it to:
- Find evidence for or against each hypothesis
- Identify factors we haven't thought of
- Evaluate actual candidate repos against whatever criteria emerge

Do NOT ask it to "confirm" the hypotheses. Frame it as: "here are factors we think may matter; research whether they actually do and find what we're missing."

**Do NOT use the hypothesis table as acceptance criteria.** A research spike that confirms all hypotheses without surfacing new factors has not done its job.

---

## Language Candidates

| Language | spiny-orb provider status | Primary candidate | Notes |
|----------|--------------------------|-------------------|-------|
| JavaScript | Supported | commit-story-v2 | Validate against criteria — not assumed good |
| TypeScript | spinybacked-orbweaver PRD B (in progress) | Cluster Whisperer | Whitney's existing repo; validate against criteria. **Do NOT use Spinybacked Orbweaver itself** — instrumenting the agent on itself creates confounding noise (failures could be TypeScript provider issues or self-referential edge cases; can't distinguish) |
| Python | spinybacked-orbweaver PRD D (future) | TBD | No personal repo Whitney is excited about; research spike finds candidate |
| Go | spinybacked-orbweaver PRD E (future) | k8s-vectordb-sync | Whitney's existing repo; validate against criteria |

For languages without a good personal repo candidate (Python, future languages), the research spike finds a small, popular, permissively-licensed open-source project that hits the target criteria. Fork once, freeze it, never pull upstream.

---

## Score Projection Methodology

All run score projections use a **50% discount** to account for LLM variation: the expected score in any run is 50% between the ideal (all fixes landed, best case) and the worst case (all failures recur). "After 50% discount" means the midpoint between these two outcomes. This calibrates expectations without over-relying on whether a specific fix landed cleanly.

---

## Process Requirements (all Type D PRDs)

### /write-prompt on every PRD

Before committing any PRD that an AI agent will read and act on, run `/write-prompt review` on the PRD content. This catches missing artifact specs, vague milestone descriptions, and structural anti-patterns before they cause execution failures. This step was identified as a process gap during PRD #13 drafting (it was skipped initially and applied after the fact).

---

## Two User-Facing Checkpoints (all Type D PRDs)

Every Type D PRD must include both named checkpoints:

**Moment 1 — Findings Discussion** (between Evaluation run and Failure deep-dives):
After `run-summary.md` is written, before any analysis begins, give Whitney a raw overview: files committed/failed/partial, quality score, cost, push/PR status, top 1–2 surprises. Conversational, under 10 lines. Wait for acknowledgment before proceeding.

**Moment 2 — Handoff pause** (at the end of Actionable fix output):
After full analysis, give Whitney an interpreted summary of key findings: failures, root causes, notable patterns, what to watch for in the next run. Then print the absolute file path of `actionable-fix-output.md` and pause until Whitney confirms she has handed the document off to the spiny-orb team. Do not proceed to the next PRD until confirmed.

---

## ROADMAP.md Shape (once generalization is done)

```markdown
## Short-term
- JS evaluation run-13: NDS-003 truthy fix verification (PRD #37)

## Medium-term
- Repo generalization (PRD #TBD)
- Research spike: eval target criteria (PRD #TBD)
- TypeScript eval setup + Run-1: Cluster Whisperer (PRD #TBD)

## Long-term
- Python eval setup + Run-1 (PRD #TBD)
- Go eval setup + Run-1: k8s-vectordb-sync (PRD #TBD)
```

---

## Execution Roadmap

Each step below becomes its own PRD. Steps 3–6 each spawn an indefinite run chain — see the example under Step 3.

**Step 1 — Repo generalization** *(Type A)*
Prerequisites: none.
*Accomplishes: the system can support multiple languages and targets. Everything else lands somewhere sensible.*

**Step 2 — Research spike: eval target criteria** *(Type B)*
Prerequisites: none — can run in parallel with or after Step 1. Produces a language-agnostic criteria scorecard. Evaluates commit-story-v2, Cluster Whisperer, and k8s-vectordb-sync against it. Identifies a Python candidate. Unblocks Steps 4–6. May also produce a recommendation for a new JS target (Type C for JS) if commit-story-v2 fails the criteria — conditional on findings, not a scheduled step.
*Accomplishes: the system has an evidence-based scorecard for choosing targets. No longer guessing what "good" looks like.*

**Step 3 — JS evaluation run-13** *(Type D — PRD #37, already created)*
Gate: NDS-003 truthy-check fix merges in spiny-orb. Spawns an indefinite run chain: run-13 findings → run-14 PRD drafted at completion → run-14 picks up when fixes land → run-14 drafts run-15 → and so on.
*Accomplishes: first run on the new repo structure, confirming migration didn't break the JS chain. Verifies the NDS-003 fix resolved run-12's regression.*

**Step 4 — TypeScript eval setup + Run-1** *(Type C)*
Gates: TypeScript language provider lands in spiny-orb AND Step 2 validates a target. Spawns an indefinite TypeScript run chain (same pattern as Step 3).
*Accomplishes: TypeScript evaluation chain exists. The system can now measure spiny-orb quality on a second language.*

**Step 5 — Python eval setup + Run-1** *(Type C)*
Gates: Python language provider lands in spiny-orb AND Step 2 identifies a validated target. Spawns an indefinite Python run chain.
*Accomplishes: Python evaluation chain exists.*

**Step 6 — Go eval setup + Run-1** *(Type C)*
Gates: Go language provider lands in spiny-orb AND Step 2 validates k8s-vectordb-sync (or alternative). Spawns an indefinite Go run chain.
*Accomplishes: Go evaluation chain exists.*
