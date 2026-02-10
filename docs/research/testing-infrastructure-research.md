# Testing Infrastructure Research

Research into how different developers and projects handle testing infrastructure for AI-assisted development (Claude Code specifically). The goal is to understand patterns, philosophies, and practical implementations before deciding on an approach for commit-story-v2 and Whitney's repos more broadly.

## Research Sources

1. Viktor Farcic - `vfarcic/dot-ai` (DevOps AI Toolkit)
2. Michael Forrester - `peopleforrester/claude-dotfiles` and `peopleforrester/Brain_spec_skills_claude`
3. (TBD - notable open source repos from strangers)
4. (TBD - notable open source repos from strangers)

---

## 1. Viktor Farcic - `vfarcic/dot-ai`

**Repo:** https://github.com/vfarcic/dot-ai
**What it is:** An AI-powered platform engineering and DevOps automation system. It runs as an MCP server that integrates with Claude Code, Cursor, and VS Code to provide natural language Kubernetes querying, deployment recommendations, and AI-powered issue remediation. Published as an npm package (`@vfarcic/dot-ai`), Docker images, and Helm charts. Currently in beta.

**Tech stack:** TypeScript/Node.js, Vercel AI SDK (multi-provider: Anthropic, OpenAI, Google, xAI, Amazon Bedrock), MCP SDK, Kubernetes client, Qdrant vector database, Vitest for testing, Handlebars for prompt templates.

### Testing Philosophy: Integration-First

Viktor explicitly follows a **"Zero Unit Tests" philosophy** (documented in their PRD 111). The rationale is stated in `/tests/integration/README.md`:

> "Why no unit tests? The dot-ai toolkit's value lies entirely in integrating Kubernetes, AI, and databases. Testing these in isolation with mocks provides false confidence and doesn't validate actual behavior."

They do maintain some unit tests in `/tests/unit/` (circuit-breaker, command-executor, plugin-manager, visualization, plus provider tests), but the overwhelming focus is integration tests.

### Integration Test Architecture

The integration test system provisions a full environment for every test run.

**Infrastructure provisioning** (`/tests/integration/infrastructure/run-integration-tests.sh`):
- Creates a fresh Kind (Kubernetes in Docker) cluster per test run
- Installs CloudNativePG operator, Kyverno policy engine, nginx ingress controller, and a custom dot-ai-controller
- Deploys a pre-populated Qdrant vector database
- Builds Docker images locally, loads them into Kind
- Deploys the full dot-ai application via Helm
- Waits for all components to be ready before running tests

**Test configuration** (`/vitest.integration.config.ts`):
- 20-minute global timeout
- Up to 10 concurrent tests within a file
- Up to 30 parallel test workers (fork-based isolation)
- Test environment variables automatically set (KUBECONFIG, DEBUG)

**Test base class** (`/tests/integration/helpers/test-base.ts`):
- Provides Kubernetes client setup, HTTP client with auth
- Helper methods for creating pods, waiting for conditions, polling for completion
- Namespace isolation per test

**Multi-model testing:** Different npm scripts run the same integration suite against different AI models:
- `test:integration:sonnet`, `test:integration:opus`, `test:integration:haiku`
- `test:integration:gpt`, `test:integration:gemini`, `test:integration:grok`
- `test:integration:bedrock`, `test:integration:kimi`

### Test Conventions (from `/tests/integration/CLAUDE.md`)

This is a dedicated guide specifically for Claude Code on how to write integration tests:

- **Comprehensive workflow pattern:** One test covers CREATE, GET, LIST, SEARCH, DELETE - not separate tests for each operation
- **Mandatory `toMatchObject` pattern:** Never mix assertion styles (no `.toBe()` alongside `toMatchObject`)
- **Specific over generic:** Use actual known values, not `expect.any()`
- **Race condition prevention:** `beforeAll` for cleanup, unique `Date.now()` test IDs, `describe.concurrent`
- **No redundancy:** Always check if functionality is already tested before writing new tests

### Claude Code Configuration: Multi-Layered Guardrails

#### Root `/CLAUDE.md` - The Mandatory Checklist

The root CLAUDE.md file is the primary guardrail. The most notable feature is a **mandatory task completion checklist** at the very top of the file:

```text
BEFORE MARKING ANY TASK/SUBTASK AS COMPLETE:
- Integration Tests Written
- All Tests Pass: Run `npm run test:integration` - ALL tests must pass
- No Test Failures: Fix any failing tests before proceeding
```

Permanent instructions include:
1. Always write integration tests
2. Always run ALL tests before marking a task complete
3. Never claim done with failing tests
4. Always check for reusability (search codebase first)
5. Never hardcode AI prompts (all go in `prompts/` directory)

The CLAUDE.md also prescribes **git worktrees** for feature work to maintain isolated agent context, and explains MCP vs Plugin architecture so Claude understands where code should go.

#### Directory-Specific CLAUDE.md Files

- `/docs/CLAUDE.md` - Documentation standards with a critical "execute-then-document" requirement. Every command and example must be run and verified before being documented.
- `/tests/integration/CLAUDE.md` - The comprehensive testing guide described above.

#### `.claude/settings.json` - Permissions and Hooks

**Hooks:** A `UserPromptSubmit` hook that fires on every prompt. When the user types `prd-done`, it injects a reminder: "Run /changelog-fragment BEFORE any commits if there are user-facing changes." This is a programmatic guardrail that ensures changelog fragments are created.

**Permissions:** An extensive allowlist of ~100+ specific `Bash(command:*)` and `WebFetch(domain:*)` permissions. This is a curated whitelist approach - Claude Code can only run explicitly permitted commands. Notable inclusions:
- Build commands (`npm run build:*`, `npm test:*`)
- Git operations (`git log:*`)
- Kubernetes operations (`kubectl get:*`, `kubectl logs:*`, `helm *`)
- GitHub CLI operations (`gh pr view:*`, `gh issue list:*`)
- CodeRabbit MCP integration

### Shared Skills via Git Submodule

Skills (Claude Code slash commands) are shared across multiple repos via a git submodule from `vfarcic/dot-ai-skills`:

**Shared skills** (from the submodule):
- `worktree-prd` - Create git worktrees for PRD work
- `changelog-fragment` - Create towncrier changelog fragments
- `tag-release` - Semantic version tagging
- `process-feature-request` - Handle incoming feature requests

**Project-specific skills:**
- `infographic-generator`, `publish-mock-server`, `write-docs`

### Prompt Management

All AI prompts are externalized into files, never hardcoded:
- `/prompts/` - 40+ internal prompt files for system operations
- `/shared-prompts/` - User-facing prompts that serve as Claude Code slash commands (prd-start, prd-next, prd-done, etc.)

### AI Model Evaluation System

The `/eval/` directory and `/src/evaluation/` implement a **comparative AI model evaluation framework**:
- Runs same integration test scenarios against multiple AI providers
- Generates evaluation datasets (JSONL)
- Produces detailed analysis reports with rankings, reliability scores, cost-performance analysis
- Feeds directly into production model selection decisions

### CI/CD Pipeline

**PR pipeline** (`/.github/workflows/ci.yml`):
1. Install dependencies, lint, build
2. Run unit tests
3. Check if secrets are available (fork detection)
4. Run full integration tests (creates Kind cluster, deploys app, runs tests) - 30-minute timeout
5. Separate security job: CodeQL analysis + npm dependency audit

**CodeRabbit** (`/.coderabbit.yaml`): Configured to request changes only for critical/major issues. Skips lock files, build output, temp files. Focuses on "critical bugs, security issues, and architectural concerns."

### Quality Gate Summary (10 Layers)

1. **CLAUDE.md Mandatory Checklist** - AI agent must write integration tests and verify all pass
2. **Claude Hook** - Programmatic reminder for changelog fragments
3. **Permission Allowlist** - Explicit whitelist of commands Claude can execute
4. **Integration Test Suite** - Full Kind cluster with real AI calls, not mocks
5. **CI Pipeline** - Lint, build, unit tests, integration tests (30-min timeout)
6. **CodeRabbit** - Automated code review for critical issues
7. **PR Template** - Structured template with security and testing checklists
8. **CodeQL Security Analysis** - Automated security scanning per PR
9. **npm Security Audit** - `better-npm-audit` in CI
10. **OpenSSF Scorecard** - External security best practices assessment

### Key Takeaway

The overarching philosophy: **make the AI agent responsible for testing as a hard requirement, not optional**. Testing comes first in the CLAUDE.md instructions, and the agent cannot mark work as done without passing tests. The integration tests validate real system behavior against real infrastructure, explicitly rejecting mock-based approaches.

---

## 2. Michael Forrester - `peopleforrester/claude-dotfiles` and `peopleforrester/Brain_spec_skills_claude`

Michael has two repos that work together: `claude-dotfiles` is a configuration framework and template library for Claude Code, and `Brain_spec_skills_claude` is a spec-driven development framework delivered as slash commands. Michael told Whitney he prioritizes integration tests and suggested having Claude help cherry-pick what she wants from his claude-dotfiles repo.

### 2a. `claude-dotfiles` - Configuration Framework for Claude Code

**Repo:** https://github.com/peopleforrester/claude-dotfiles
**What it is:** A configuration framework and template library for Claude Code. The entire repository was created in a single Claude Code session (100+ files, 15,000+ lines). It aims to solve the "cold start" problem where Claude Code begins every session with zero project context. Licensed under MIT.

#### Testing Infrastructure

Testing operates at two levels: **(a) testing the dotfiles repo itself** and **(b) prescribed testing rules/patterns that users should follow in their own projects**.

**A. Internal Test Runner** (`/tests/run-all.js`):

A Node.js script that validates the structural integrity of all configuration files. It runs 8 validation suites:
1. **Validate agents** - checks YAML frontmatter has `name`, `description`, `tools`, `model` fields
2. **Validate commands** - checks YAML frontmatter has `description` field
3. **Validate skills** - checks SKILL.md files for `name` (lowercase-with-hyphens, max 64 chars) and `description`
4. **Validate rules** - checks for headings, `## Always` or `## Never` sections, and minimum bullet count
5. **Validate hooks** - checks JSON syntax and validates hook types against a whitelist
6. **Parse JSON configs** - validates all JSON files parse cleanly
7. **Plugin manifest integrity** - verifies `.claude-plugin/plugin.json` has correct fields
8. **Schema structure** - checks that `$schema` and `title` exist in all schema files

Each validator is in `/scripts/ci/` and follows the same pattern: walk directories, read files, check structure, count errors, exit non-zero on failure.

**B. Prescribed Testing Rules for Projects** (`/rules/common/testing.md`):

This file prescribes a full testing philosophy for any project using these dotfiles:

Coverage requirements by code category:

| Code Category | Minimum Coverage |
|---|---|
| Business logic | 80% line |
| Security-critical | 100% branch |
| Utility functions | 90% line |
| UI components | 70% line |
| Configuration/glue | 50% line |

Three required test levels:
- **Unit tests**: Isolated, mocked, under 1 second each, run on every commit
- **Integration tests**: Cross-component, test databases/containers, run before merge
- **E2E tests**: Critical user journeys via Playwright/Cypress, run before release

Strict TDD enforcement:
```text
1. RED:      Write a test that fails (proves the feature is missing)
2. GREEN:    Write the minimum code to make the test pass
3. REFACTOR: Improve the code while keeping tests green
4. REPEAT:   Move to the next test case
```

Key constraint from the file: "No implementation code before a failing test exists."

**C. Language-Specific Testing Rules**: Separate files in `/rules/typescript/testing.md`, `/rules/python/testing.md`, and `/rules/golang/testing.md` with framework-specific patterns (Vitest/Jest, pytest, Go `testing` package).

#### Quality Gates and Guardrails

This is where the repo is most sophisticated - multiple layers of quality enforcement.

**A. The `/verify` Command - 8-Step Verification Loop** (`/commands/workflow/verify.md` and `/skills/development/verification-loop/SKILL.md`):

The primary quality gate is an 8-step sequential check that must pass before any PR:

```text
1. Build        --> Compiles cleanly?
2. Type Check   --> Types are sound?
3. Lint         --> Style rules pass?
4. Unit Tests   --> Logic is correct?
5. Integration  --> Systems work together?
6. Security     --> No vulnerabilities?
7. Coverage     --> Meets thresholds?
8. Debug Audit  --> No leftover debug?
```

The key principle is **stop on first failure, fix, restart from step 1**. The verification-loop skill provides stack-specific commands for JavaScript/TypeScript, Python, Go, and Rust.

**B. The `/eval` Command - Weighted Scoring Rubric** (`/skills/optimization/eval-harness/SKILL.md`):

A scoring framework that rates code across six dimensions:

| Category | Weight |
|---|---|
| Correctness | 30% |
| Security | 20% |
| Performance | 15% |
| Maintainability | 15% |
| Testing | 10% |
| Documentation | 10% |

Each category scores 1-5, producing a weighted total with a verdict:
- **4.0-5.0**: SHIP IT
- **3.0-3.9**: IMPROVE
- **< 3.0**: REWORK

**C. Pre-Commit Hook Validators** (`/hooks/validators/lint-before-commit.sh`):

A comprehensive pre-commit hook that detects project languages and runs appropriate linters:
- **JS/TS**: ESLint (with `--max-warnings=0`), TypeScript compiler, Prettier
- **Python**: Ruff linter, mypy type checker
- **Rust**: cargo clippy (with `-D warnings`), cargo fmt
- **Go**: go vet, golangci-lint

Formatting issues are treated as **warnings** (non-blocking), while lint failures are **errors** (blocking).

**D. Sensitive File Protection** (`/hooks/validators/protect-sensitive-files.py`):

A Python script that runs as a `PreToolUse` hook, blocking Claude Code from reading or editing sensitive files. Protected patterns include `.env`, `*.pem`, `*.key`, `id_rsa`, `.npmrc`, `.aws/credentials`, etc. Protected directories include `.git`, `secrets`, `.ssh`, `.gnupg`.

**E. Hooks System** (`/hooks/hooks.json`):

Three categories of automated guardrails:

- **PreToolUse (Before Actions):** Reminds to review diff and run tests before `git push`; warns when creating `.md` files outside standard directories
- **PostToolUse (After Actions):** Runs Prettier on JS/TS files after edits; runs TypeScript compiler check after TS edits; runs Ruff on Python files after edits; runs gofmt on Go files after edits
- **Stop (Session End):** Checks for `console.log` in modified files and warns

#### Agents (15 Specialized Personas)

Defined at `/agents/*.md`, each with YAML frontmatter specifying `name`, `description`, `tools`, and `model`. Notable ones:

- **Planner** (model: `opus`): Analyzes requirements, generates 2-3 implementation options. Critical rule: "NEVER write code until the user explicitly confirms the plan."
- **Code Reviewer** (model: `sonnet`): Read-only review using severity levels. Tools limited to Read/Grep/Glob.
- **Security Reviewer** (model: `opus`): OWASP Top 10-based audit with automated scanning for hardcoded secrets, vulnerable dependencies.
- **TDD Guide** (model: `sonnet`): Enforces strict red-green-refactor. Challenges statements like "I'll add tests later."

#### Permission Profiles (`/settings/permissions/`)

Three tiers of graduated autonomy:

**Conservative** (`defaultMode: "prompt"`): Allow only Read, Glob, Grep, LS. Ask for everything else. Best for learning and sensitive projects.

**Balanced** (`defaultMode: "acceptEdits"`): Also allow npm/pnpm/yarn/npx, git status/log/diff/branch. Ask for Write, Edit, git commit/push/merge. Best for daily development.

**Autonomous** (`defaultMode: "acceptEdits"`): Also allow Write, Edit, node, python, cargo, go, git add/checkout/commit, docker compose, curl. Ask for git push/merge/rebase, rm, docker run/build. Best for trusted automation.

**All profiles share a universal deny list:**
```json
"deny": [
  "Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)",
  "Read(./**/credentials*)", "Read(~/.aws/**)", "Read(~/.ssh/**)",
  "Bash(rm -rf *)", "Bash(rm -r /)", "Bash(curl * | bash)",
  "Bash(sudo *)", "Bash(chmod 777 *)", "Bash(> /dev/*)"
]
```

#### Slash Commands (26 total, in `/commands/`)

Organized by category:

**Workflow:** `/tdd`, `/verify`, `/orchestrate` (multi-agent coordination: planner -> specialists -> code-reviewer -> security-reviewer -> /verify), `/learn`, `/checkpoint`, `/eval`, `/spec-new`, `/spec-status`, `/spec-task`

**Quality:** `/code-review`, `/security-review`, `/build-fix`, `/test-coverage`, `/e2e`

**Learning:** `/instinct-status` (view learned instincts with confidence scores), `/evolve` (cluster instincts into skills, commands, or agents)

#### Continuous Learning System (`/skills/optimization/continuous-learning-v2/`)

An "instinct-based learning system" where Claude builds a knowledge base through observation:

```yaml
---
id: prefer-const-assertions
trigger: "when defining constant arrays or objects in TypeScript"
confidence: 0.7
domain: "code-style"
source: "session-observation"
---
```

Confidence evolution:
- New observation starts at 0.3
- Repeated application without correction: +0.1 per session
- User correction/rejection: -0.2
- Maximum: 0.9 (never fully automatic)

When 3+ related instincts cluster, they can be promoted to a Skill; 5+ high-confidence instincts to a Rule.

#### CI/CD Pipeline

**`validate.yml`** (runs on push/PR to main/staging):
- Python validators: `scripts/validate.py` and token counting
- Node.js validators: `tests/run-all.js` across **3 OS x 3 Node versions** (ubuntu/macos/windows x Node 18/20/22, `fail-fast: false`)
- Shell script validation: Shellcheck on all `.sh` files
- JSON syntax, markdown link checking, YAML lint

**CodeRabbit** (`/.coderabbit.yaml`): Configured with path-specific review instructions for JSON, SKILL.md, CLAUDE.md, and shell files.

#### Philosophy Summary

The overall philosophy is **layered defense-in-depth for AI-assisted development**:
1. CLAUDE.md as persistent memory
2. Rules as hard constraints (Always/Never sections)
3. Agents as specialized reviewers with model selection tuned per agent
4. Commands as repeatable workflows
5. Hooks as automated enforcement
6. Instincts as adaptive learning
7. Multiple permission tiers with a universal deny list

---

### 2b. `Brain_spec_skills_claude` - Spec-Driven Development Framework

**Repo:** https://github.com/peopleforrester/Brain_spec_skills_claude
**What it is:** A spec-driven development framework for Claude Code, delivered as 4 plain-markdown skill files (slash commands). It provides structured planning through guided interviews, task tracking, and persistent project knowledge. All data stored as JSON and markdown in a `.brain-spec/` directory.

Key tagline from the README:

> "Spec-driven development inside Claude Code. No server, no dependencies -- just 4 slash commands."

#### The "Brain" / "Spec" Concept

The core philosophy is that **planning is the highest-leverage activity**. From their Architecture doc:

> "Planning is the highest-leverage activity -- spending 10-20% of tokens on a good spec drives 80-90% of quality outcomes. Specs survive sessions; when context resets, the spec file is the recovery point."

The "Brain" is the `.brain-spec/` workspace directory that acts as persistent memory across Claude Code sessions. The "Spec" is the interview-driven specification document. Together, they ensure Claude Code always has structured context about what to build and why.

#### Evolution: The Radical Pivot

The repo has exactly 7 commits that tell a clear story:

1. `7fe1c61` - Started as a TypeScript MCP server with spec workflow tools
2. `a123559` - **Pivoted to Claude Code skills** - replaced entire MCP server with 4 slash commands
3. `3314832` - Removed MCP server code, kept skills-only architecture
4. `aef6d61` - Added README, install script, documentation
5. `9f93956` - Dogfooded Brain Spec on its own repo
6. `f007706` - Cleaned up `.brain-spec/` from repo
7. `b90a218` - Tracked VERSION files

The abandoned MCP server spec (`SPEC.md`) described a 28-tool TypeScript MCP server with Express dashboard, Vitest tests, npm distribution. The shipped product is 4 markdown files.

#### The Four Skills

| Skill | File | Purpose |
|---|---|---|
| `brain-init` | `.claude/skills/brain-init/SKILL.md` | Initialize workspace, create steering docs, generate CLAUDE.md |
| `brain-spec` | `.claude/skills/brain-spec/SKILL.md` | Spec lifecycle: create, interview, list, get, update, delete, archive |
| `brain-task` | `.claude/skills/brain-task/SKILL.md` | Task management: create, update, list, log, progress |
| `brain-status` | `.claude/skills/brain-status/SKILL.md` | Dashboard overview (runs in fork context) |

Skills are **not code** - they are structured prompts. From the Architecture doc:

> "Skills are not code -- they are structured prompts. Claude reads the SKILL.md, understands the instructions, and uses its built-in tools (file I/O, bash, glob, grep) to carry out the task."

#### Testing Infrastructure

**There is no traditional testing infrastructure in the shipped product.** The repo contains zero test files, no test runner, no `package.json`, no CI/CD pipeline. This is intentional - the project is pure markdown with no code to test.

However, testing is embedded as a **concept within the spec workflow**:

1. **The Interview Engine includes a "Testing Strategy" category** with questions about testing strategy, critical test scenarios, coverage targets, edge case handling, and performance testing requirements.

2. **CLAUDE.md templates include testing requirements.** The "comprehensive" template generated by `/brain-init` includes:
   ```text
   ## Testing
   - Tests MUST cover implemented functionality
   - Test output MUST be pristine to pass
   - Write tests before implementation (TDD)
   - Run tests before committing
   - Maintain test coverage above 80%
   ```

3. **Task acceptance criteria** are built into the task schema with a dedicated `acceptanceCriteria` field.

#### Quality Gates Philosophy: Anti-Gate

The repo takes a deliberately **anti-gate** approach. From the Architecture doc:

> "No approval gates. Brain Spec does not enforce workflow rules. You can create tasks before finishing an interview, archive a spec with pending tasks, or update a completed spec. The tool trusts you to use your judgment."

Instead of hard gates, it provides structured guidance:
- **Interview coverage tracking** across 8 categories (functional, technical, data-model, edge-cases, security, testing, nonfunctional, implementation). Each category advances to "covered" at 60% (3/5 questions answered). Nudges toward completeness without blocking.
- **Steering documents** (product, tech, structure) provide project-level guardrails
- **Security by constraint** - writes constrained to `.brain-spec/` and `CLAUDE.md` only; git operations read-only

#### References and Inspirations (from `SPEC.md` section 21)

| Source | What Was Used |
|---|---|
| [Pimzino/spec-workflow-mcp](https://github.com/Pimzino/spec-workflow-mcp) (3.2k stars) | Spec workflow architecture, task hierarchy |
| [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) (35.6k stars) | Agent definitions, skill structure, hook system, rules |
| [peopleforrester/claude-dotfiles](https://github.com/peopleforrester/claude-dotfiles) | CLAUDE.md templates, stack-specific configs |
| Boris Cherny (Claude Code creator) | "Plan Mode -> spec -> fresh session -> auto-accept pattern" |

#### Key Takeaway

The most transferable insight is the **radical simplification pivot**: they designed a complex 28-tool MCP server with TypeScript, Express, Vitest, and npm, then stripped it all away for 4 markdown files. The reasoning was zero startup cost, zero dependencies, zero configuration. Testing is handled through the spec/interview process rather than through code-level test infrastructure.

---

## 3. Affaan Mustafa - `affaan-m/everything-claude-code`

**Repo:** https://github.com/affaan-m/everything-claude-code
**What it is:** A Claude Code plugin - a comprehensive, battle-tested collection of configurations for AI-assisted development. Created by Affaan Mustafa (Anthropic hackathon winner), it has 42K+ stars and represents 10+ months of daily production use. It provides agents, skills, commands, hooks, rules, and scripts as an installable Claude Code plugin.

**The repo is not an application** - it is a configuration/tooling distribution that shapes how Claude Code behaves during development sessions.

### Testing Infrastructure: 8 Layers

Testing is handled at multiple layers, creating layered redundancy.

#### Layer 1: Rules - Testing Requirements (Always-On)

File: `rules/common/testing.md`

This mandatory rule gets loaded into every Claude Code session:

```text
Minimum Test Coverage: 80%

Test Types (ALL required):
1. Unit Tests - Individual functions, utilities, components
2. Integration Tests - API endpoints, database operations
3. E2E Tests - Critical user flows

MANDATORY workflow:
1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)
```

The rule also directs Claude to use the `tdd-guide` agent **proactively** for new features.

Language-specific testing rules exist in `rules/typescript/testing.md` (specifies Playwright for E2E) and `rules/python/testing.md`.

#### Layer 2: TDD Agent (`agents/tdd-guide.md`)

A full subagent definition (model: `opus`) that enforces test-first methodology. Provides complete templates for:
- Unit tests with edge cases (null, empty, invalid types, boundaries, errors, race conditions, large data, special characters)
- Integration tests with mock patterns (Supabase, Redis, OpenAI)
- E2E tests with Playwright
- Quality checklist requiring all public functions have unit tests, all API endpoints have integration tests, all critical flows have E2E tests
- Explicit anti-patterns ("Test Smells") to avoid

Required coverage thresholds: 80% for branches, functions, lines, and statements.

#### Layer 3: TDD Command and Skill

`/tdd` slash command invokes the tdd-guide agent. `skills/tdd-workflow/SKILL.md` provides detailed reference covering when to activate TDD, complete test patterns, mock patterns, file organization conventions, and continuous testing setup.

#### Layer 4: E2E Testing Agent (`agents/e2e-runner.md`)

A dedicated agent for end-to-end testing using Vercel Agent Browser (preferred) or Playwright (fallback). Covers Page Object Model pattern, flaky test management (quarantine patterns), artifact management (screenshots, traces, video), CI/CD integration, and full test report templates. Success metrics: "All critical journeys passing (100%), Pass rate > 95%, Flaky rate < 5%, Test duration < 10 minutes."

#### Layer 5: Verification Loop Skill (`skills/verification-loop/SKILL.md`)

A 6-phase check run before PRs:

```text
Phase 1: Build Verification
Phase 2: Type Check
Phase 3: Lint Check
Phase 4: Test Suite (with coverage)
Phase 5: Security Scan (secrets, console.log)
Phase 6: Diff Review
```

The `/verify` command supports arguments: `quick` (build + types only), `full` (default), `pre-commit`, `pre-pr` (full + security scan).

#### Layer 6: Eval Harness Skill (`skills/eval-harness/SKILL.md`)

An **eval-driven development (EDD)** framework that treats evals as "the unit tests of AI development":
- **Capability Evals** - test if Claude can do something it couldn't before
- **Regression Evals** - ensure changes don't break existing functionality
- Three grader types: code-based (deterministic), model-based (Claude evaluates), human (flagged for manual review)
- **pass@k metrics**: "At least one success in k attempts" (target pass@3 > 90%)
- **pass^k metrics**: "All k trials succeed" (for critical paths)

#### Layer 7: Test Coverage Command (`commands/test-coverage.md`)

The `/test-coverage` command: runs tests with coverage, analyzes `coverage/coverage-summary.json`, identifies files below 80% threshold, generates missing tests for under-covered files, verifies new tests pass, and shows before/after metrics.

#### Layer 8: The Plugin's Own Test Suite (`tests/`)

Uses a custom test framework (no external test runner - just Node.js `assert` with a simple `test()` helper). Test runner: `tests/run-all.js`.

Test files:
- `tests/lib/utils.test.js` - 26 tests covering platform detection, directory functions, file operations
- `tests/lib/package-manager.test.js` - 22 tests covering lock file detection, package manager selection
- `tests/hooks/hooks.test.js` - 20+ tests covering hook execution, schema validation, cross-platform compatibility, and a **regression test** born from 3 separate incidents (issues #29, #52, #103):

```javascript
test('plugin.json does NOT have explicit hooks declaration', () => {
    // Claude Code automatically loads hooks/hooks.json by convention.
    // Explicitly declaring it in plugin.json causes a duplicate detection error.
    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
    assert.ok(!plugin.hooks, 'plugin.json should NOT have "hooks" field');
});
```

- `tests/integration/hooks.test.js` - Integration tests that simulate realistic Claude Code hook invocation by spawning scripts with JSON piped to stdin. Tests cover empty stdin, malformed JSON, valid parsing, output format (stderr vs stdout), exit codes, and large input performance (must complete in <5s).

### Hooks - Event-Driven Quality Gates

`hooks/hooks.json` provides real-time guardrails:

**PreToolUse (before):** Dev server blocker (blocks outside tmux), tmux reminder for long-running commands, git push reminder, documentation blocker (blocks random .md files), strategic compact suggestion.

**PostToolUse (after):** PR URL logger, build analysis, Prettier auto-format, TypeScript type check after .ts/.tsx edits, console.log warning.

**SessionStart:** Loads previous context, detects package manager.
**Stop:** Checks for console.log in all modified files.
**SessionEnd:** Persists session state, evaluates session for extractable patterns (continuous learning).

### CI/CD Pipeline

**`.github/workflows/ci.yml`** - 4 jobs:
1. **Test Matrix** - 3 OS x 3 Node versions x 4 package managers = 33 combinations
2. **Validate Components** - 5 validation scripts for agents, hooks, commands, skills, rules
3. **Security Scan** - `npm audit --audit-level=high`
4. **Lint** - ESLint on JS, markdownlint on markdown

Additional: `maintenance.yml` (weekly stale check), `release.yml` (tag-triggered with version consistency validation).

### Agents (13 Specialized)

Each with YAML frontmatter specifying model and restricted tool access:
- **tdd-guide** (opus), **code-reviewer** (blocks if CRITICAL/HIGH issues), **security-reviewer** (OWASP Top 10), **e2e-runner** (Playwright), **planner**, **architect**, and more.

### Rules System

Always-on guidelines organized as `common/` (language-agnostic) + language-specific directories:
- `coding-style.md` - immutability (CRITICAL), small files (200-400 lines, 800 max)
- `testing.md` - 80% coverage, TDD mandatory
- `security.md` - pre-commit security checklist (8 items)
- `git-workflow.md` - conventional commits, PR workflow
- `agents.md` - agent delegation matrix, parallel Task execution
- `performance.md` - model selection (Haiku for lightweight, Sonnet for main dev, Opus for reasoning)

### Key Takeaway

Testing enforcement works through **layered redundancy**: rules tell the AI what to do, agents enforce during execution, hooks catch issues in real-time, and CI validates everything in the pipeline. The approach is "agent-first, test-driven, security-first" - TDD is not optional, it is mandated by always-on rules and enforced by specialized agents.

---

## 4. TACHES (glittercowboy) - `glittercowboy/get-shit-done`

**Repo:** https://github.com/glittercowboy/get-shit-done
**What it is:** A meta-prompting, context engineering, and spec-driven development system for Claude Code (also supports OpenCode and Gemini CLI). Published as npm package `get-shit-done-cc` (v1.18.0). Installs slash commands, agent definitions, workflow files, reference documents, and templates into the AI coding assistant's configuration directory.

Creator's thesis:

> "I'm a solo developer. I don't write code -- Claude Code does. Other spec-driven development tools exist... But they all seem to make things way more complicated than they need to be. The complexity is in the system, not in your workflow."

The system addresses **context rot** - quality degradation as Claude fills its context window - by using multi-agent architecture where each subagent gets a fresh 200k token context, while the orchestrator stays lean at ~15% usage.

### Testing Infrastructure: Systemic Rather Than Traditional

GSD has one traditional test file but embeds testing deeply into the workflow itself.

#### Traditional Tests (`gsd-tools.test.js`)

Location: `/get-shit-done/bin/gsd-tools.test.js` (2,033 lines)

Uses Node.js built-in test runner (`node:test`) with `node:assert`. Tests the `gsd-tools.js` CLI utility (the deterministic workhorse). Creates temp directories per test, cleans up after. Covers: `history-digest`, `phases list`, `roadmap get-phase`, frontmatter parsing, decimal phase handling, malformed file resilience, backward compatibility.

#### TDD Framework (Instructions, Not a Runner)

`/get-shit-done/references/tdd.md` defines when and how to use TDD. Key: **TDD is optional, not mandatory** - used when you can express behavior as `expect(fn(input)).toBe(output)` before writing `fn`.

- TDD candidates: business logic, API endpoints, data transformations, validation rules, state machines
- Skip TDD: UI layout, config changes, glue code, prototyping
- TDD plans produce 2-3 atomic commits: `test(phase-plan): add failing test` -> `feat(phase-plan): implement` -> `refactor(phase-plan): clean up`
- If no test framework exists, the executor agent **automatically sets one up** during the RED phase

#### Plan Verification (Pre-Execution)

The **gsd-plan-checker** agent (`/agents/gsd-plan-checker.md`) runs between planning and execution. Verifies plans through 7 dimensions:
1. Requirement Coverage - every phase requirement has covering task(s)
2. Task Completeness - every task has Files + Action + Verify + Done
3. Dependency Correctness - no cycles, all references valid
4. Key Links Planned - artifacts wired together, not isolated
5. Scope Sanity - 2-3 tasks per plan (4 warning, 5+ blocker)
6. Verification Derivation - must_haves trace back to phase goal
7. Context Compliance - plans honor decisions from `/gsd:discuss-phase`

Creates a **planner -> checker -> revision loop** (max 3 iterations) before any code is executed.

#### Post-Execution Verification (Goal-Backward Analysis)

The **gsd-verifier** agent (`/agents/gsd-verifier.md`) performs verification with a critical mindset:

> "DO NOT trust SUMMARY claims. SUMMARYs document what Claude SAID it did. You verify what ACTUALLY exists in the code."

Verifies at three levels:
1. **Exists** - file present at expected path
2. **Substantive** - real implementation, not placeholder/stub
3. **Wired** - connected to the rest of the system

Includes extensive stub detection patterns:
```text
RED FLAGS - React stubs: return <div>Component</div>, onClick={() => {})
RED FLAGS - API stubs: return Response.json({ message: "Not implemented" })
RED FLAGS - Wiring: fetch('/api/messages') without await/then/assignment
```

#### User Acceptance Testing (UAT)

`/gsd:verify-work` implements conversational UAT with persistent state:
- Extracts testable deliverables from SUMMARY.md files
- Presents one test at a time in checkpoint format
- User responds: "pass", "skip", or describes the issue
- Severity inferred from natural language (never asked)
- Results persist in `{phase}-UAT.md` (survives `/clear`)
- Issues trigger automatic parallel debug agents for root cause diagnosis
- Diagnosed issues feed into gap closure plans through the plan-checker loop

#### Integration Testing

**gsd-integration-checker** agent verifies cross-phase integration: export/import mapping, API coverage, auth protection, E2E flow tracing (Component -> API -> DB -> Response -> Display).

#### Self-Check in Executor

After creating SUMMARY.md, the executor verifies files exist and commits are present. If self-check fails, does NOT proceed to state updates.

### Quality Gates: Multi-Stage Pipeline

1. **Questioning Gate** - `/gsd:discuss-phase` extracts decisions BEFORE planning, creating CONTEXT.md
2. **Research Gate** - optional domain research before planning
3. **Plan Checking Gate** - planner -> checker loop (max 3 iterations)
4. **Execution Self-Check** - executor verifies own claims against filesystem and git
5. **Automated Verification** - goal-backward analysis (existence, substance, wiring)
6. **UAT Gate** - conversational human testing with auto-diagnosis
7. **Integration Check** - cross-phase wiring verification
8. **Milestone Audit** - aggregate verification before archiving

### Deviation Rules During Execution

- **Auto-fix:** bugs, missing critical functionality (error handling, auth), blocking issues (missing deps, wrong types)
- **STOP and checkpoint:** architectural changes (new DB tables, switching libraries)

### Configuration-Controlled Gates

`.planning/config.json` controls which gates are active:
```json
{
  "mode": "interactive",
  "workflow": { "research": true, "plan_check": true, "verifier": true },
  "gates": {
    "confirm_project": true, "confirm_phases": true,
    "confirm_plan": true, "execute_next_plan": true
  },
  "safety": {
    "always_confirm_destructive": true,
    "always_confirm_external_services": true
  }
}
```

### Permission Approach: Skip Permissions + Verify After

The README explicitly recommends:

```bash
claude --dangerously-skip-permissions
```

> "This is how GSD is intended to be used -- stopping to approve `date` and `git commit` 50 times defeats the purpose."

Alternative: granular allow list for specific bash commands and a deny list for sensitive files.

### Model Profile Optimization

Different agents use different Claude models:

| Profile | Planning | Execution | Verification |
|---------|----------|-----------|--------------|
| quality | Opus | Opus | Sonnet |
| balanced | Opus | Sonnet | Sonnet |
| budget | Sonnet | Sonnet | Haiku |

Rationale: "Planning involves architecture decisions. This is where model quality has the highest impact. Executors follow explicit PLAN.md instructions."

### Script-First for Deterministic Operations

`gsd-tools.js` handles all deterministic operations - config parsing, model resolution, phase lookup, git commits, summary verification, state management, frontmatter CRUD, scaffolding. AI is reserved for content understanding, synthesis, and pattern recognition.

### CI/CD Pipeline

Minimal: one `auto-label-issues.yml` workflow that adds `needs-triage` to new issues. No test runner in CI. All quality gates operate within the Claude Code session itself.

### Key Takeaway

Testing is **systemic rather than traditional**. One 2,033-line test file for the CLI utility, but the real testing infrastructure is woven into the workflow: plan checking, goal-backward verification, stub detection, wiring verification, UAT with automatic diagnosis, and integration checking. The philosophy is **autonomy with verification** - run with skip-permissions and verify robustly after execution, rather than permission-gating every action. TDD is optional and pragmatic, not dogmatic.

---

## Comparative Analysis

### Summary Table

| | **Viktor (dot-ai)** | **Michael (claude-dotfiles)** | **Affaan (everything-claude-code)** | **TACHES (get-shit-done)** |
|---|---|---|---|---|
| **Testing philosophy** | Integration-first, "zero unit tests" | TDD mandatory, 3 test levels | TDD mandatory, 80% coverage | TDD optional and pragmatic |
| **Where testing lives** | Real infrastructure (Kind clusters) | Rules + prescribed frameworks | 8 layers of redundant enforcement | Embedded in workflow gates |
| **Permission approach** | Curated allowlist (~100+) | 3 tiers (conservative/balanced/autonomous) | Hooks as blockers + rules | Skip-permissions recommended |
| **CI/CD** | Full (30-min integration tests) | Full (3 OS x 3 Node matrix) | Full (33-combination matrix) | Minimal (just issue labeling) |
| **Quality gates** | 10 layers | 8-step verify loop | Layered redundancy | 8 workflow stages |
| **Shared across repos** | Git submodule for skills | Plugin/template system | Plugin manifest | npm package |
| **Philosophy** | AI must test before marking done | Defense-in-depth, layered constraints | Agent-first, test-driven | Autonomy with post-verification |

### Strategy Decision: Layered Approach

After reviewing all four sources and discussing Whitney's specific needs (multiple repos with different characteristics), the decision is to build in layers:

**Layer 0: Global Safety Net** (`~/.claude/settings.json`)
- Universal deny list blocking sensitive files (`.env`, `*.pem`, `~/.ssh`, etc.) and destructive commands (`sudo`, `rm -rf`)
- Permission allowlist for commands Claude can run
- Applies to ALL repos immediately with zero per-project configuration
- Inspired by: Michael's universal deny list, Viktor's curated allowlist

**Layer 1: Shared Claude Config Repo** (new repository)
- Testing decision guide: "if your repo does X, use Y testing approach"
- Shared `/verify` skill (inspired by Michael's 8-step verification loop and Affaan's verification-loop skill)
- CLAUDE.md templates/patterns for different project types
- Permission profiles
- Testing rules (Always/Never patterns from Affaan and Michael)
- This is the reusable foundation that gets applied to any project

**Layer 2: Per-Project Application** (PRD in each active repo)
- Wire up the shared config
- Write project-specific tests
- Set up CI pipeline
- Make project-specific testing decisions (LLM call mocking, K8s integration tests, etc.)

### Whitney's Active Projects and Their Testing Needs

| Project | Type | Testing Focus | Key Challenge |
|---|---|---|---|
| commit-story-v2 | LangGraph + LLM calls | Unit tests for collectors/managers, integration tests for LLM pipeline | Testing LLM-dependent code (mock vs real calls) |
| cluster-whisperer | LangGraph agent + K8s + vector DB | Integration tests against real infrastructure | Similar to Viktor's dot-ai; heavy infrastructure setup |
| Telemetry agent | Script-orchestrated, OTel instrumentation | Unit tests for script logic, integration tests for instrumentation output | Verifying correct OTel instrumentation |

### PRD Plan

- **PRD 25 (commit-story-v2):** Layer 0 + Layer 1 - Build the global safety net and shared config repo
- **PRD 26 (commit-story-v2):** Layer 2 - Apply the framework to commit-story-v2 specifically
- **Per-project PRDs:** Each active repo gets its own "apply testing framework" PRD, created as a deliverable of PRD 25
