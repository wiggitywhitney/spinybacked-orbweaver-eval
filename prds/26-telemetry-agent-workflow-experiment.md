# PRD #26: Telemetry Agent Workflow Experiment

**Status:** Draft
**Created:** 2026-02-06
**GitHub Issue:** [#26](https://github.com/wiggitywhitney/commit-story-v2/issues/26)

---

## Problem Statement

The Telemetry Agent spec (`docs/specs/telemetry-agent-spec-v2.md`) is comprehensive and ready for implementation. However, breaking a spec this large into actionable tasks requires good workflow tooling. Two candidates exist:

1. **Viktor's PRD System** — Familiar, milestone-based, GitHub issue tracking
2. **Get Shit Done (GSD)** — Fresh context per task, phase-gated execution, prevents context degradation

Without empirical comparison, the choice is arbitrary. The wrong choice could mean slower development, lower quality output, or frustrating developer experience.

## Solution Overview

Create two separate repositories, each building the Telemetry Agent from the same spec using different workflows. Run both in parallel (or alternating) and compare:

- Developer experience (friction, flow, interruptions)
- Output quality (code clarity, correctness)
- Workflow fit (does it handle cross-cutting concerns, dependencies?)
- Time to completion (for equivalent milestones)

## Repository Structure

```text
commit-story-v2/              # Contains the spec, remains the test subject
telemetry-agent-prd/          # Built with Viktor's PRD system (Claude skills)
telemetry-agent-gsd/          # Built with Get Shit Done
```

Both agent repos are fully decoupled from commit-story-v2. The spec lives in commit-story-v2 and is copied to each repo when finalized.

## Technical Scope

### telemetry-agent-prd Setup
- New GitHub repo: `wiggitywhitney/telemetry-agent-prd`
- Copy `.claude/skills/prd-*` from commit-story-v2
- Copy finalized spec from commit-story-v2
- Create `docs/PROJECT_PLAN.md` for cross-PRD orchestration (since ROADMAP.md is product-focused)
- Create initial PRDs breaking down the spec

### telemetry-agent-gsd Setup
- New GitHub repo: `wiggitywhitney/telemetry-agent-gsd`
- Initialize with `npx get-shit-done-cc`
- Copy finalized spec from commit-story-v2
- Let GSD create PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md
- Run `/gsd:new-project` to bootstrap

### Shared Elements
- Same telemetry agent spec (source of truth)
- Same target: commit-story-v2 as test subject
- Same validation criteria: agent successfully instruments commit-story-v2

## Success Criteria

1. Both repos created and initialized with their respective workflows
2. At least one major milestone completed in each repo (e.g., Init Phase + Coordinator skeleton)
3. Clear comparison notes documenting developer experience in each
4. Decision made on which workflow to continue with (or insights on when to use each)

## Dependencies

- **Telemetry Agent Spec v2** must be finalized before copying to repos
- No dependency on commit-story-v2 codebase (it's just the test subject)

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Spec changes after copying | Keep spec in commit-story-v2 as source of truth; update both repos if needed |
| One workflow clearly fails early | Kill the loser, continue with winner — this is a feature, not a bug |
| Double the work | AI does the work; this is about evaluating workflows, not doubling effort |
| Divergent implementations | Both follow same spec; divergence reveals workflow differences |

## Research Summary

### Viktor's PRD System
- Documentation-first, 5-10 milestones per PRD
- GitHub issues for tracking
- Familiar workflow (already used in commit-story-v2)
- Gap: No cross-PRD dependency tracking or orchestration view

### Get Shit Done (GSD)
- Fresh 200k token context per task (prevents degradation)
- Phase-gated: Requirements → Design → Tasks → Implementation
- Multi-agent: researchers, planners, executors in parallel
- Maintains PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md
- User reports: "Produced the best results compared to SpecKit, OpenSpec, and Taskmaster"

### Other Tools Considered
- **Task Master** — Heavy (36 MCP tools, ~21k tokens), JSON task dependencies
- **cc-sdd** — Kiro-style spec-driven, good for phase gates
- **claude-code-spec-workflow** — Four-phase gates, real-time dashboard

Decision: Compare the two most promising (Viktor's PRD for familiarity, GSD for fresh context approach).

---

## Milestones

- [ ] **Spec finalized** — telemetry-agent-spec-v2.md reviewed and ready
- [ ] **Repos created** — Both GitHub repos exist with basic structure
- [ ] **Workflows initialized** — PRD skills copied; GSD bootstrapped
- [ ] **Spec copied** — Same spec in both repos
- [ ] **First milestone completed in each** — Init Phase or equivalent
- [ ] **Comparison documented** — Notes on experience, friction, quality
- [ ] **Decision made** — Which workflow to continue with (or hybrid approach)

---

## Notes

This PRD lives in commit-story-v2 because that's where the spec lives. The experiment itself happens in the two new repos. This PRD tracks the meta-work of running the experiment, not the agent implementation itself.
