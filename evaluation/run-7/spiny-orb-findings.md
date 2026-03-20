# Spiny-Orb Findings — Run-7

Findings from evaluation run-7. Each finding includes evidence, priority, and acceptance criteria for the spiny-orb team.

**Run-7 baseline**: 21/25 (84%) canonical quality, 5 files committed (run-6 result).

**Notation**: RUN7-N for new findings. Cross-references to prior findings use RUN6-N format.

---

## Critical

### RUN7-4: Push auth fails for 5th consecutive run — validateCredentials checks read access, push needs write

**What's wrong**: Push authentication has failed every run since run-3. The run-7 error shows a bare HTTPS URL with no token embedded: `Pushing to https://github.com/wiggitywhitney/commit-story-v2-eval.git`. The GITHUB_TOKEN URL rewriting in `pushBranch()` didn't fire, despite GITHUB_TOKEN being available via vals.

**Root cause**: Two bugs in `src/git/git-wrapper.ts`:

1. **`validateCredentials()` (line ~188) validates read access, not write.** When GITHUB_TOKEN is absent, it falls back to `git.listRemote(['--heads'])`. For public repos, `git ls-remote` succeeds without auth (read is unauthenticated). Validation passes, all 29 files are processed ($3.22 in LLM tokens spent), then `pushBranch()` fails because write access requires auth.

2. **`pushBranch()` (line ~137) falls back silently to plain `git push`** when GITHUB_TOKEN is not in `process.env`. No warning, no error — just a bare push that GitHub rejects.

The combination means: no early failure, no warning, and the problem only surfaces after the full run completes.

**Why GITHUB_TOKEN might be missing**: The command uses `vals exec -i -f .vals.yaml` which should inject it. vals resolves the token successfully (95 chars). Possible causes: the token isn't making it through the `env -u` / `vals exec` / `node` chain, or the spiny-orb process is spawning a subprocess that doesn't inherit the env.

**Evidence**: Run-7 log line: `Push failed — skipping PR creation: Pushing to https://github.com/wiggitywhitney/commit-story-v2-eval.git`. No validateCredentials warning or GITHUB_TOKEN-related logging anywhere in the log. Same failure pattern in runs 3-6.

**Desired outcome**: Fail fast before processing files if push auth won't work.

**Acceptance criteria**:
1. If remote is HTTPS GitHub and GITHUB_TOKEN is not set, fail with a clear error BEFORE processing any files
2. Validation uses write-capable check (e.g., `git push --dry-run`) instead of read-only `git ls-remote`
3. Log whether GITHUB_TOKEN was found at startup (without revealing the value)
4. If GITHUB_TOKEN is set but push still fails, log the authenticated URL format (redacted) for debugging

## High

### RUN7-2: Rule codes in user-facing output are opaque — no explanation of what they mean

**What's wrong**: The verbose output uses rule codes like `RST-001`, `RST-002`, `RST-004`, `COV-004` in agent reasoning notes without explaining what they mean. A user seeing "skipped per RST-004" has no way to understand the decision without finding and reading the internal evaluation rubric. These codes are an internal taxonomy — they should never appear in user-facing output without a human-readable explanation.

**Evidence**: git-collector.js notes say "skipped per RST-004" (restraint: don't instrument unexported internals). summarize.js says "RST-001" (restraint: don't instrument pure sync functions). Users cannot interpret these.

**Desired outcome**: Every rule code in user-facing output should be accompanied by a short human-readable name. For example: "skipped per RST-004 (unexported internals)" or "RST-001 (pure sync function)".

**Acceptance criteria**:
1. Every rule code in CLI output, PR summary, and companion files includes a short human-readable label
2. No rule code appears bare without explanation in any user-facing surface

### RUN7-3: No user-facing documentation for rules, architecture, or how spiny-orb works

**What's wrong**: The spinybacked-orbweaver repo has no user-facing documentation explaining: (1) what the validation rules are and what they enforce, (2) how the architecture works (agent → validator → deliverables pipeline), (3) how to interpret output and make decisions based on it. The evaluation rubric and rubric-codebase mapping live in `research/` but are internal evaluation documents, not user docs.

**Evidence**: A user running `spiny-orb instrument` sees rule codes, span categories, schema extensions, and validation results with no reference material to understand any of it.

**Desired outcome**: User-facing documentation in the repo covering:
- **Rules reference**: What each rule code means, what it checks, why it matters, with examples
- **Architecture overview**: How the pipeline works (file discovery → agent instrumentation → validation → commit/skip → PR creation)
- **Interpreting output**: What success/partial/failed mean, how to read the PR summary, what schema extensions are

**Acceptance criteria**:
1. `docs/` directory (or equivalent) with rules reference, architecture overview, and output guide
2. README links to these docs
3. A user can understand spiny-orb output without reading internal evaluation documents

## Medium

### RUN7-1: Verbose output truncates critical information, buries pass/fail status

**What's wrong**: The `--verbose` per-file output prioritizes agent reasoning notes over the most important information: pass/fail status and span count. Notes are shown first and truncated with "... and N more notes", which can push the status/span summary off-screen or omit it entirely.

**Evidence**: claude-collector.js output shows `success (1 spans, 5.2K output tokens)` on the status line but then 3 reasoning notes followed by "... and 7 more notes". The status is on the first line but easy to miss in a stream of 29 files. For files with many notes, the truncation hides potentially important reasoning.

**Desired outcome**: Per-file verbose output should lead with a prominent status line (committed/partial/failed, span count, attempt count) and show reasoning notes below. Never truncate status information. Consider truncating notes from the middle rather than the end, or offering a `--verbose=full` flag.

**Acceptance criteria**:
1. Status/span count is never truncated or buried
2. A quick scan of the full run output gives a clear picture of outcomes without reading notes
3. Notes can optionally be expanded (separate flag or file)

### RUN7-5: Span name collision — dailySummaryNode reuses journal-graph span name

**What's wrong**: In `src/generators/summary-graph.js`, `dailySummaryNode` uses span name `commit_story.journal.generate_summary` — the same name used by `summaryNode` in `src/generators/journal-graph.js`. These are semantically different operations (daily summary aggregation vs per-commit journal summary generation). The collision makes it impossible to distinguish these spans in trace analysis.

**Evidence**: Both files declare `span.commit_story.journal.generate_summary` in their extensions. The agent reused the name from the accumulated schema rather than inventing a unique one.

**Desired outcome**: Each operation gets a unique span name. `dailySummaryNode` should use something like `commit_story.summarize.generate_daily_summary`.

**Acceptance criteria**:
1. No two different operations share the same span name across files
2. CDQ-008 (cross-file tracer naming) or a new cross-file span uniqueness check catches this

### RUN7-6: Count attributes declared as string type instead of int in agent-extensions.yaml

**What's wrong**: The agent declared `commit_story.summarize.dates_count`, `weeks_count`, `months_count`, `generated_count`, `failed_count` as `type: string` in `agent-extensions.yaml`. The code uses `String()` wrapping to match. But these are semantically integers — the base schema uses `type: int` for analogous count fields (`sessions_count`, `messages_count`, `quotes_count`). String-typed counts lose numeric queryability in trace backends.

**Evidence**: `agent-extensions.yaml` lines 7-30 declare all count attributes as string. Code in summary-detector.js and auto-summarize.js uses `String(x.length)` instead of raw `x.length`. Base schema `attributes.yaml` uses `type: int` for all existing count attributes.

**Desired outcome**: Count attributes should be `type: int` and the agent should pass raw numbers.

**Acceptance criteria**:
1. Agent-declared count attributes use `type: int`
2. No `String()` wrapping on numeric values
3. Consistency with base schema attribute types

## Low

*(None identified)*

## Process

*(None identified)*
