# PRD #25: Testing & Autonomous Development Infrastructure

## Problem Statement

Running Claude Code in skip-permissions mode without babysitting requires testing infrastructure and safety guardrails that don't exist yet. There are no tests, no CI, no permission controls, and no verification workflow across any of Whitney's repos.

This PRD is **cross-project** — the testing practices, safety config, shared skills, and guardrails established here should work across any project developed with Claude Code, not just commit-story-v2. Project-specific test suites are out of scope (those become per-project PRDs created as a deliverable of this PRD).

## Solution Overview

A layered approach informed by research into four reference implementations (Viktor Farcic's dot-ai, Michael Forrester's claude-dotfiles and Brain Spec, Affaan Mustafa's everything-claude-code, and TACHES' get-shit-done):

- **Layer 0**: Global safety net in `~/.claude/settings.json` — deny lists and permission allowlists that apply to all repos immediately
- **Layer 1**: Shared claude config repo — reusable testing infrastructure (decision guide, `/verify` skill, CLAUDE.md templates, permission profiles, testing rules) that can be applied to any project
- **Layer 2** (out of scope, per-project): Apply the framework to each active repo via separate PRDs

## Research

Research is complete. See `docs/research/testing-infrastructure-research.md` for detailed findings from all four reference implementations, comparative analysis, and the strategy decision.

## User Stories

- As a developer using Claude Code, I want a deny list that prevents Claude from reading secrets or running destructive commands across all my repos
- As a developer, I want a curated permission allowlist so I can run skip-permissions mode with confidence
- As a developer, I want a shared `/verify` skill that checks build, tests, and lint before any PR
- As a developer, I want CLAUDE.md templates so each new repo starts with testing rules baked in
- As a developer, I want a decision guide that tells me what testing approach fits what kind of project
- As a developer, I want reusable testing rules (Always/Never patterns) that load into every Claude Code session
- As a developer, I want "apply testing framework" PRDs created in all my active repos so there's a clear path forward for each project

## Success Criteria

- [ ] Global deny list and permission allowlist configured in `~/.claude/settings.json`
- [ ] Shared claude config repo exists with testing infrastructure
- [ ] Decision guide documents testing strategies for different project types
- [ ] `/verify` skill works for Node.js/TypeScript projects
- [ ] CLAUDE.md template(s) include testing enforcement rules
- [ ] Testing rules (Always/Never) are defined and loadable
- [ ] "Apply testing framework" PRDs exist in all active repos (commit-story-v2, cluster-whisperer, telemetry agent)

## Milestones

### Milestone 1: Research Phase
**Status**: Complete

Investigated testing infrastructure approaches across four reference implementations. Documented findings in `docs/research/testing-infrastructure-research.md` covering testing philosophy, quality gates, permission models, CI/CD, hooks, and shared config strategies.

Key findings:
- Testing enforcement works best through layered redundancy (rules + agents + hooks + CI)
- Both Viktor and Michael prioritize integration tests over unit tests for AI-generated code
- A universal deny list is the single highest-impact safety measure
- Permission profiles should be tiered (conservative for exploration, autonomous for trusted plans)
- Shared config across repos can be done via git submodule, npm package, or install script

**Done**: Research document exists with comparative analysis and strategy recommendation.

---

### Milestone 2: Global Safety Net (Layer 0)
**Status**: Not Started

Configure `~/.claude/settings.json` with:

- [ ] **Universal deny list** — Block reading sensitive files (`.env`, `*.pem`, `*.key`, `~/.ssh/**`, `~/.aws/**`, `**/credentials*`, `**/secrets/**`) and destructive commands (`sudo`, `rm -rf`, `curl * | bash`, `chmod 777`)
- [ ] **Permission allowlist** — Curated list of commands Claude can run without prompting (git operations, npm scripts, test runners, gh CLI, etc.)
- [ ] **Validate** — Confirm deny list blocks access to actual sensitive files, confirm allowlist lets normal development flow work

**Done when**: `~/.claude/settings.json` is configured and validated. Claude Code sessions across all repos respect the deny list and permissions.

---

### Milestone 3: Shared Claude Config Repo (Layer 1)
**Status**: Not Started

Create a new repo (name TBD — e.g., `whitney-claude-config` or `claude-dev-kit`) containing:

- [ ] **Testing decision guide** — Document that maps project types to testing strategies:
  - LLM-calling code → what to test, how to handle non-determinism
  - Agent frameworks (LangGraph) → workflow testing patterns
  - K8s/infrastructure interaction → integration test approaches
  - Script-orchestrated tools → input/output testing
  - Pure utilities → standard unit testing
- [ ] **`/verify` skill** — Shared slash command that runs a verification loop before PRs (build → type check → lint → tests → security scan). Inspired by Affaan's verification-loop and Michael's 8-step verify command. Should work for any Node.js/TypeScript project.
- [ ] **CLAUDE.md template(s)** — Starter templates with testing rules baked in:
  - "Write tests before marking any task complete"
  - "Run all tests before creating a PR"
  - "Never claim done with failing tests"
  - Project-specific sections to fill in (test command, coverage thresholds, framework)
- [ ] **Testing rules** — Always/Never patterns that can be loaded as Claude Code rules:
  - Always: write tests for new functionality, run tests before committing, check for regressions
  - Never: skip tests for "simple" changes, commit with failing tests, mock when real integration is feasible
- [ ] **Permission profiles** — Reference settings.json configurations for different trust levels:
  - Conservative (ask for everything except reads)
  - Balanced (auto-approve edits, git status/diff, npm scripts; ask for commits/pushes)
  - Autonomous (auto-approve most things; ask for pushes, destructive operations)
- [ ] **README** — How to use this repo, how to apply it to a new project

**Done when**: Repo exists with all components, and the `/verify` skill has been tested in at least one real project.

---

### Milestone 4: Apply-Framework PRDs in Active Repos
**Status**: Not Started

Create "apply testing framework" PRDs in each active repo:

- [ ] **commit-story-v2** (PRD #33) — Wire up shared config, write end-to-end tests for existing functionality, set up CI pipeline, decide LLM testing strategy
- [ ] **cluster-whisperer** — Wire up shared config, plan integration test strategy for K8s/vector DB interaction, set up CI
- [ ] **Telemetry agent** — Wire up shared config, test script-orchestrated workflows, verify instrumentation output

Each PRD should reference the shared config repo and the testing decision guide for project-specific strategy.

**Done when**: PRDs exist in all active repos with clear milestones for applying the testing framework.

---

### Milestone 5: Validation
**Status**: Not Started

- [ ] Run Claude Code with skip-permissions on a bounded task in commit-story-v2 with all Layer 0 guardrails active
- [ ] Verify: deny list blocks sensitive file access, permissions allow normal workflow, `/verify` skill catches real issues
- [ ] Document any gaps or adjustments needed
- [ ] Update shared config repo with lessons learned

**Done when**: Skip-permissions workflow has been validated in practice and any gaps have been addressed.

## Out of Scope

- **Project-specific test suites** — Writing actual tests for commit-story-v2, cluster-whisperer, or the telemetry agent. Those are separate PRDs (Milestone 4 deliverables).
- **Specialized agents** (TDD guide, code reviewer, security reviewer) — Consider for future PRD based on need
- **CI/CD pipeline setup** — Per-project concern, handled in apply-framework PRDs
- **PostToolUse hooks** (auto-linting, auto-type-checking after edits) — Consider for future iteration of the shared config repo
- **Continuous learning / instinct systems** — Interesting (from Affaan and Michael's repos) but not needed now

## Dependencies

- None (this is foundational infrastructure)
- PRD #26 and other apply-framework PRDs depend on this PRD being complete
- PRD #23 (CI/CD Pipeline) is absorbed into the per-project apply-framework PRDs

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shared config repo becomes over-engineered | High | Start minimal — decision guide, one verify skill, one template. Add complexity only when needed. |
| Deny list is too restrictive for some workflows | Medium | Start conservative, loosen based on real experience. Document exceptions. |
| Testing decision guide becomes stale | Low | Keep it short and principles-based rather than prescriptive. Update when adding new project types. |
| `/verify` skill doesn't generalize across projects | Medium | Design for Node.js/TypeScript first (covers all current projects). Generalize later if needed. |
| Research analysis paralysis | Medium | Research is complete. Implementation decisions should be quick — start with the simplest version and iterate. |

## References

- `docs/research/testing-infrastructure-research.md` — Full research with findings from all four reference implementations
- [vfarcic/dot-ai](https://github.com/vfarcic/dot-ai) — Integration-first testing, CLAUDE.md mandatory checklist, permission allowlisting
- [peopleforrester/claude-dotfiles](https://github.com/peopleforrester/claude-dotfiles) — 8-step verify loop, permission profiles, testing rules, hooks
- [peopleforrester/Brain_spec_skills_claude](https://github.com/peopleforrester/Brain_spec_skills_claude) — Spec-driven development, radical simplification
- [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) — Layered testing enforcement, eval harness, 33-combination CI matrix
- [glittercowboy/get-shit-done](https://github.com/glittercowboy/get-shit-done) — Goal-backward verification, skip-permissions with post-verification
- PRD #23 (CI/CD Pipeline) — Absorbed into per-project apply-framework PRDs

## Progress Log

| Date | Milestone | Notes |
|------|-----------|-------|
| 2026-02-10 | Milestone 1: Research | Complete. Researched 4 reference implementations, documented in testing-infrastructure-research.md. Strategy: layered approach (safety net → shared config → per-project application). |
| | | |
