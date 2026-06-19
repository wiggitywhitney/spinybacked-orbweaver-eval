# PRD #143: Content Manager — Real Instrumentation Run

**Status:** Ready
**Created:** 2026-06-19
**GitHub Issue:** #143
**Depends on:** None (independent of commit-story-v2 eval runs)

---

## Problem Statement

Every spiny-orb evaluation run so far has used throwaway instrumentation — the instrument branch never merges, the traces never run in production, and the evaluation ends with "what would I tell the spiny-orb team?" rather than "is this observability actually useful?" There is no data on what the experience looks like when someone runs spiny-orb on a project they actually intend to ship.

Content Manager is Whitney's own production content-publishing system: it syncs a Google Sheets tracker with Micro.blog and posts to Bluesky, LinkedIn, and Mastodon. It has 30 source files in `src/`, runs as a Node.js CommonJS app, has no existing OTel instrumentation, no `spiny-orb.yaml`, and no semconv schema. It already has partial Datadog integration (a single gauge metric for LinkedIn token expiry). There is genuine value in knowing whether publish flows succeed, which platforms fail, how long social posting takes, and what the retry patterns look like. Content-manager traces will go to the same Datadog account used for commit-story-v2 eval runs — this is intentional, not a concern to work around.

This PRD runs spiny-orb on Content Manager with the intent that the result ships. It also captures what a "real instrumentation run" feels like end-to-end and produces a recommendation on whether a repeatable PRD template for this scenario is warranted.

### Spiny-orb Dependency Check

No hard blockers from the spiny-orb backlog. Two open PRDs would improve output quality if they landed before this run:
- **#778 (SDK bootstrap scaffold generation)**: Better `instrumentation.js` bootstrap if merged first.
- **#379 (Weaver codegen for domain constants)**: Auto-generated constants for content-manager's custom schema if merged first.

Neither is a prerequisite. Proceed regardless of their status; note their open/closed state in pre-run verification.

### What Makes This Run Different from a Pure Eval Run

| Dimension | Pure eval run | This run |
|-----------|--------------|----------|
| Instrument branch | Never merges (throwaway) | Merges and runs in production |
| Target ownership | Fork of someone else's project | Whitney's own repo (no fork needed) |
| Success bar | Rubric score | Rubric score + "would I actually use this?" |
| Language | ESM (commit-story-v2, taze) | CommonJS |
| Pre-existing schema | Deliberately incomplete (eval design) | None at all — blank slate |
| Datadog integration | None before instrumentation | Already has a gauge metric |
| IS scoring entrypoint | Single `src/index.js` | Multiple entrypoints — needs selection |
| Post-run verification | IS synthetic trace only | Real production run after merge |

---

## Solution Overview

Four phases:

1. **Pre-run setup** — Create `spiny-orb.yaml` and minimal semconv skeleton; verify auth; rebuild spiny-orb.
2. **Evaluation run** — Whitney runs `spiny-orb instrument`; standard eval sequence (findings discussion, per-file evaluation, rubric scoring, IS scoring).
3. **Merge and production verification** — Whitney merges the instrument branch; a real content-manager execution generates live traces in Datadog.
4. **Learnings and template recommendation** — Document what was different, produce a yes/no recommendation on creating a reusable template for real instrumentation runs.

### Repo Setup

Content Manager lives at `~/Documents/Repositories/content-manager`. No fork required — Whitney owns it directly. The instrument branch will be pushed to `wiggitywhitney/content-manager` and the PR will target `main` there.

### Artifact Location

Evaluation artifacts live at `evaluation/content-manager/run-1/` in this repo (spinybacked-orbweaver-eval). Create this directory before pre-run setup begins.

---

## Success Criteria

1. `spiny-orb.yaml` and `semconv/attributes.yaml` exist in content-manager before the instrument run.
2. spiny-orb commits at least 80% of `src/` files (≥ 24 of 30) with no failed files.
3. Quality score ≥ 22/25 (88%) — first-run baseline; no regression expectation.
4. Push/PR succeeds automatically to `wiggitywhitney/content-manager`.
5. Whitney merges the instrument branch and confirms real traces appear in Datadog from a live content-manager execution.
6. `real-instrumentation-learnings.md` produced with a clear yes/no recommendation on the template question.
7. All standard evaluation artifacts generated (failure deep-dives, per-file evaluation, rubric scores, IS score, baseline comparison).

---

## Milestones

- [ ] **Read prerequisite docs before any other milestone** — Read in this order: (1) `docs/language-extension-plan.md` Type C section (setup steps for a new target, schema design guidance, auth setup) and Type D section (canonical milestone sequence for evaluation runs); (2) `prds/140-evaluation-run-25.md` — the most recently completed commit-story-v2 run PRD; use it as the style reference for pre-run verification, IS scoring, and per-file evaluation milestone formats. Do not mark this complete until all three documents are read.

- [ ] **Pre-run setup** — Content Manager needs scaffolding before spiny-orb can run:
  1. Create `evaluation/content-manager/run-1/` and `evaluation/content-manager/run-1/debug-dumps/` in this repo.
  2. **Check spiny-orb version**: Run `cd ~/Documents/Repositories/spinybacked-orbweaver && git log --oneline -5` to record current HEAD. Check open issues #778 and #379 — note their current status (open/merged/closed). Rebuild from main: `npm install && npm run build`.
  3. **Create `spiny-orb.yaml`** in `~/Documents/Repositories/content-manager/`:
     ```yaml
     serviceName: content-manager
     language: javascript
     targetType: short-lived
     semconvPath: semconv/attributes.yaml
     ```
     Rationale for `short-lived`: all content-manager scripts exit after completing their operation (no long-running server). Rationale for leaving schema intentionally minimal (see D-3 in Decision Log): let spiny-orb discover the domain attributes rather than pre-specifying them.
  4. **Create `semconv/attributes.yaml`** in `~/Documents/Repositories/content-manager/` — skeleton only. Define the namespace prefix (`content_manager`) and two known attributes from the existing Datadog metric (`content_manager.linkedin.token_days_until_expiry`) to seed the schema. Do NOT add guessed domain attributes (e.g., `content_manager.post.platform`, `content_manager.sync.rows_processed`) even if they seem obvious — the gap between the seed schema and what spiny-orb discovers is the evaluation signal for this run. Follow the OTel semconv attribute format used in `commit-story-v2/semconv/attributes.yaml` as the structural reference.
  5. **Push auth verification**: Content Manager is owned directly by Whitney (no fork). Verify GITHUB_TOKEN in `~/Documents/Repositories/content-manager/.vals.yaml` — it must have `push: true` (Contents: Read and write) and `pull_requests: write` on `wiggitywhitney/content-manager`. If missing, add it using the fine-grained PAT pattern from `~/.claude/rules/eval-github-pat.md`. Dry-run verify: `vals exec -f ~/Documents/Repositories/content-manager/.vals.yaml -- bash -c 'git -C ~/Documents/Repositories/content-manager push --dry-run https://x-access-token:$GITHUB_TOKEN@github.com/wiggitywhitney/content-manager.git HEAD:refs/heads/spiny-orb/auth-test'`. Must succeed before proceeding.
  6. **File inventory**: Count `.js` files in `content-manager/src/`: `ls ~/Documents/Repositories/content-manager/src/*.js | wc -l`. Record the count and list. Note that the `src/config/` subdirectory exists — check if it contains `.js` files that spiny-orb will discover.
  7. **Datadog pre-run health check**: Use `search_datadog_spans` with query `service:content-manager` (last 7 days). If results appear: note there are existing traces (not expected — content-manager has no OTel yet; existing results would be from a prior eval attempt). If no results: expected; proceed.
  8. Commit `spiny-orb.yaml` and `semconv/attributes.yaml` directly to `main` in content-manager. These are permanent configuration files, not experimental changes — there is no reason to keep them off main. Push main before proceeding.
  9. Record all findings in `evaluation/content-manager/run-1/pre-run-notes.md`.

- [ ] **OTel SDK bootstrap, Pino logging, and log-trace correlation setup** — Before the eval run, give content-manager the OTel SDK and a structured logger so that: (1) spiny-orb can detect the existing logger pattern; (2) the `instrumentation.js` spiny-orb generates will have its deps; (3) logs are correlated with traces from day one. Read `~/.claude/rules/pino-gotchas.md` and `~/.claude/rules/otel-logs-bridge-gotchas.md` before implementing.

  1. **Install production deps** in content-manager (these are permanent — they stay after the branch merges, per D-6):
     ```bash
     npm install pino @opentelemetry/api @opentelemetry/instrumentation-pino @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/sdk-trace-base @opentelemetry/resources
     ```
  2. **Create `src/logger.js`** — shared Pino logger instance:
     ```js
     // ABOUTME: Shared Pino logger; stdout JSON for Datadog log pipeline
     const pino = require('pino');
     module.exports = pino({ level: process.env.LOG_LEVEL ?? 'info' });
     ```
     CJS format (`require`, not `import`). Stdout is correct — content-manager is not an MCP server.
  3. **Add logger usage to `src/sync-content.js`** at meaningful domain events: sync start, per-item processing, publish attempt, publish result (success/failure/skip), and errors. Target 8-12 log statements; avoid one-per-line noise.
  4. **Create `examples/instrumentation.js`** with NodeSDK init and Pino bridge. The SDK must initialize before any `require()` that loads pino. CJS-specific requirements:
     - Use `node --require ./examples/instrumentation.js` (not `--import`)
     - The IITM ESM loader hook from pino-gotchas.md is NOT needed — content-manager is CJS; require-in-the-middle applies without the ESM registration step
     - Register `PinoInstrumentation` from `@opentelemetry/instrumentation-pino` in the SDK's `instrumentations` array
  5. **Test correlation**: `vals exec -f .vals.yaml -- node --require ./examples/instrumentation.js src/scan-new-content.js` — confirm stdout logs include `trace_id` and `span_id` fields. If correlation is absent, diagnose require-order before proceeding. Do NOT mark this complete until at least one log line shows a non-empty `trace_id`.
  6. **Commit to content-manager main** — `spiny-orb.yaml`, `semconv/`, `package.json`, `src/logger.js`, `examples/instrumentation.js`, and the updated `sync-content.js`.
  7. Document in `evaluation/content-manager/run-1/pre-run-notes.md` under a "Pino bootstrap" section: which gotchas materialized, whether --require ordering worked without the IITM dance, what instrumentation.js structure was chosen.

- [ ] **Evaluation run** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log, save it to `evaluation/content-manager/run-1/spiny-orb-output.log` using `git add -f` and write `evaluation/content-manager/run-1/run-summary.md`, (3) if auto PR creation failed, create the PR from the file spiny-orb already wrote: `gh pr create --body-file ~/Documents/Repositories/content-manager/spiny-orb-pr-summary.md --repo wiggitywhitney/content-manager --head <instrument-branch> --title "..."`.

  AI must confirm `debug-dumps/` directory exists before handing Whitney the command. Extract the instrument branch name from the log (`grep -m1 'Branch:' spiny-orb-output.log`) when writing `run-summary.md` — do not write it from memory.

  **Exact command** (run from `~/Documents/Repositories/content-manager`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/content-manager/run-1/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/content-manager/run-1/spiny-orb-output.log
  ```

  **Pino bridge preservation check** (consequence of D-7): After the eval run, check whether spiny-orb overwrote `examples/instrumentation.js`. Run: `git -C ~/Documents/Repositories/content-manager show <instrument-branch>:examples/instrumentation.js | grep -c PinoInstrumentation`. If the count is 0, spiny-orb overwrote the file and the Pino bridge is gone — note this in `run-summary.md` and plan to restore it manually before the merge milestone. This is an expected friction point worth capturing for the learnings document.

  After saving artifacts, push the eval branch to origin immediately: `git push -u origin <eval-branch>`. Do not leave it local-only.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) first impressions on domain attribute quality — did spiny-orb invent reasonable content-publishing spans?, (4) cost, (5) push/PR status (auto or manual?), (6) overall attempt-count distribution. Keep it under 12 lines. Wait for acknowledgment before proceeding.

- [ ] **Post-run Datadog verification** — After the Findings Discussion checkpoint:
  1. Use `search_datadog_spans` with query `service:content-manager` filtered to spans newer than the eval run start timestamp. Confirm new spans from the instrument branch appear. Check `vcs.ref.head.revision` on spans to confirm the correct branch.
  2. If no spans appear yet: note in `run-summary.md` and defer. The post-merge production verification in a later milestone is the primary trace confirmation.
  3. When confirmed, record `service.instance.id` in `evaluation/content-manager/run-1/trace-artifact.md`.
  4. **Log-trace correlation check**: Use `search_datadog_logs` with query `service:content-manager` filtered to logs newer than the eval run start. Confirm whether log records have `trace_id` and `span_id` fields. Note the count. Content Manager uses CommonJS — if spiny-orb generated an `instrumentation.js` that loads pino instrumentation, this should work; if it used `console.log` only, correlation will be absent. Record the finding.

- [ ] **Failure deep-dives** — For each failed file AND run-level failure. Includes partial files. Also includes committed files with ≥ 3 attempts AND quality failures.
  Produces: `evaluation/content-manager/run-1/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation** — Full rubric on ALL committed and partial files.
  Produces: `evaluation/content-manager/run-1/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **(D-2) Spawn per-file evaluation agents in batches of 5**: Create output directory first: `mkdir -p evaluation/content-manager/run-1/per-file-sections/`. Spawn individual background Agent() calls with `run_in_background: true` in batches of 5. After each batch returns, write section files to disk immediately. After writing, clear context before the next batch. At the start of each new batch, run `ls per-file-sections/` to see what's done and pick the next 5.

  Each agent reads: style reference, run-25 per-file evaluation as rule description reference, original source (`git show main:src/file`), committed source (`git show <instrument-branch>:src/file`), agent notes from log, debug dump if applicable, and `semconv/attributes.yaml`. Each agent **writes its section directly to `evaluation/content-manager/run-1/per-file-sections/<filename>.md`**.

  **COV-005 note for a blank-slate schema**: This is the first run with zero pre-existing schema. Spiny-orb will create domain attributes from scratch. COV-005 assessment should focus on whether attributes capture meaningful domain context, not whether they match any prior run — there is no prior run. Attribute variation is expected and not a COV-005 concern.

  **(Trace supplement)** Each agent receives the `service.instance.id` from `trace-artifact.md` and uses `search_datadog_spans` with `resource_name:<prefix>.*` to supplement static code review.

- [ ] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/content-manager/run-1/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`
  PR: Find the URL in `evaluation/content-manager/run-1/run-summary.md`.

- [ ] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/content-manager/run-1/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`
  Use `evaluation/commit-story-v2/run-24/rubric-scores.md` as the precedent reference for CDQ-006 advisory treatment, COV-001 failed-file treatment, and the 7/7 CDQ rule set. This is run-1 for content-manager — there are no prior run precedents for this target.

- [ ] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9.

  **CJS note (D-4)**: Content Manager is CommonJS. The IS scoring bootstrap uses `--require` not `--import`:
  ```bash
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node --require ./examples/instrumentation.js src/sync-content.js --dry-run
  ```
  Before running, verify: (1) content-manager has a `--dry-run` flag or equivalent that runs without making real API calls — check `src/sync-content.js` for CLI argument handling; (2) `examples/instrumentation.js` exists on the instrument branch and uses `require()` not ESM `import`; (3) `vals exec` injects credentials so Google Sheets API calls don't fail during the dry run.

  If `--dry-run` does not exist: use `src/scan-new-content.js` — it reads from Google Sheets but does not write to any platform, making it safe to run without side effects. Do NOT use `src/sync-content.js` for IS scoring; it posts to live platforms. Record the chosen entrypoint in `is-score.md`.

  1. Start OTel Collector (binary preferred): `vals exec -f ~/Documents/Repositories/spinybacked-orbweaver-eval/.vals.yaml -- bash -c 'export PATH="/opt/homebrew/bin:$PATH" && otelcol-contrib --config ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/is/otelcol-config.yaml > /tmp/otelcol.log 2>&1' &`
  2. Checkout instrument files and run: `git checkout <instrument-branch> -- src/ examples/ && node --require ./examples/instrumentation.js src/<chosen-entrypoint>.js [flags]`
  3. Restore: `git checkout main -- src/ examples/`
  4. Stop collector and score: `node evaluation/is/score-is.js evaluation/is/eval-traces.json --target content-manager > evaluation/content-manager/run-1/is-score.md`
  5. Confirm IS traces in Datadog: use `search_datadog_spans` with `service:content-manager` filtered to IS run timestamp. Record `service.instance.id`.
  Produces: `evaluation/content-manager/run-1/is-score.md`

- [ ] **Baseline comparison** — Compare run-1 against commit-story-v2 and taze as reference points (not as a sequential baseline — this is the first content-manager run). Note differences attributable to: (1) blank-slate schema (no deliberately designed gaps), (2) CJS vs ESM, (3) content-publishing domain vs developer-tooling domain.
  Produces: `evaluation/content-manager/run-1/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Merge and production verification** *(new milestone — not in standard eval PRDs)* — After all evaluation artifacts are complete and the actionable fix output is delivered:
  1. Whitney reviews the instrument branch PR in `wiggitywhitney/content-manager` and merges it.
  2. Whitney runs content-manager with instrumentation active (a real operation — a sync run, a social post, or whatever she wants to test).
  3. AI confirms traces appear in Datadog: use `search_datadog_spans` with `service:content-manager` filtered to after the merge timestamp. Look for spans from real content-publishing operations (not IS scoring synthetic traces). Record the `service.instance.id` and a sample span tree showing the publish flow.
  4. Note: the existing Datadog gauge metric (`content_manager.linkedin.token_days_until_expiry`) should still appear unmodified — verify there's no regression in the existing Datadog integration.
  5. Record findings in `evaluation/content-manager/run-1/production-verification.md`.
  **Wait for Whitney's go-ahead before this milestone begins.** The merge is her decision.

- [ ] **Span-based metrics exploration** — After real traces flow from the merged instrumentation, attempt to surface span attributes as Datadog metrics. This is exploratory: a partial result with good documentation is the deliverable. Note: this feature is not yet working in commit-story-v2 (per D-8) — findings here feed both projects.

  Read `~/.claude/rules/datadog-span-based-metrics-gotchas.md` and `~/.claude/rules/otel-span-metrics-connector-gotchas.md` before attempting anything.

  1. **Identify 2-3 target attributes**: Pick span attributes that would be genuinely useful as metrics — e.g., publish success/failure count by platform (`content_manager.post.platform`), items processed per sync run. Confirm these attributes are present in live Datadog traces before proceeding.
  2. **Approach A — Datadog "Generate Metrics from Spans" UI**: Navigate to APM > Setup & Configuration > Generate Metrics. Create a custom metric from a content-manager span. Use a span attribute (not a resource attribute) as a dimension. Confirm it appears in Datadog Metrics Explorer. Document the exact steps — if this works, it is the reusable recipe for commit-story-v2.
  3. **Approach B — spanmetricsconnector (optional, document only)**: Do NOT modify the shared `evaluation/is/otelcol-config.yaml` — it affects all eval targets. Instead, describe what the config change would look like and what gotchas from otel-span-metrics-connector-gotchas.md apply (cardinality limit default=0, unit change gate, add_resource_attributes requirement). This is documentation only unless Whitney explicitly asks to test it.
  4. For each approach attempted: record what worked, what errored, what was confusing, and what prerequisite was missing (e.g., wrong attribute tier, resource vs. span scope, fixed tag set limitation).
  5. End with a clear recommendation: which approach to try first in commit-story-v2, and what setup step is the likely blocker there.

  Produces: `evaluation/content-manager/run-1/metrics-exploration.md`

- [ ] **Actionable fix output** *(user-facing checkpoint 2)* — Primary handoff deliverable to the spiny-orb team.
  1. Run the cross-document audit agent to verify consistency across all run-1 evaluation artifacts.
  2. **Spoken summary**: Provide a spoken summary with: (a) main failures and their categories; (b) root cause vs. symptom for each recommended fix; (c) every-user generalization — how each fix helps any spiny-orb user, not just content-manager.
  3. Print the absolute path: `evaluation/content-manager/run-1/actionable-fix-output.md`.
  4. **Pause.** Do not proceed to the learnings milestone until Whitney confirms she has handed the document to the spiny-orb team.

- [ ] **Real-instrumentation learnings and template recommendation** — This is the primary differentiator of this PRD from a pure eval run. Produce `evaluation/content-manager/run-1/real-instrumentation-learnings.md` covering:
  1. **What was the same** as a standard eval run (milestones that transferred without modification).
  2. **What was different**: At minimum, address each dimension from the "What Makes This Run Different" table in this PRD — did those differences actually create friction, and if so, what kind? Also address these two dimensions unique to this run: (a) **Pino + log-trace correlation** — was setting up the Pino bridge before the eval run the right sequencing? Did spiny-orb detect and work around the existing logger? What would a future user need to know about CJS log-trace correlation that isn't in any existing rule file? (b) **Span-based metrics** — what approach worked, what didn't, and what does this tell us about the feasibility of span-based metrics for any spiny-orb-instrumented project?
  3. **Friction log**: For each point where the process felt awkward or a standard eval instruction didn't fit (e.g., "schema deliberately incomplete" guidance didn't apply, IS scoring CJS entrypoint selection wasn't documented), note the exact milestone where friction occurred and what a better instruction would have said.
  4. **Template recommendation**: Answer the question Whitney posed — *is it worth creating a reusable PRD template for "real instrumentation" scenarios (where the instrument branch merges and runs in production)?* Answer yes or no with clear rationale. Consider: how many repos in Whitney's orbit are candidates for this? Would a template save meaningful time on the second run, or would the customization required make it no cheaper than adapting a standard eval PRD?
  5. **If yes**: Write a one-page outline of what the template would contain — not the full template, just the milestone names and the key differences from the standard Type D template. Save it as `docs/templates/real-instrumentation-template-outline.md`. If no: say why and what the alternative is (e.g., "add a section to language-extension-plan.md documenting the CJS IS scoring pattern").

- [ ] **Update root README** — Add a row for content-manager run-1 to the run history table. Note: this is a different target from the existing JS eval runs; add a new section header if needed.

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/content-manager/run-1/` to copy all artifacts. Commit with `eval: save content-manager run-1 artifacts to main [skip ci]`. Add one row to a new `evaluation/content-manager/run-log.md` (create if absent). Push main.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D-1 | Instrument branch merges to production | This is a real instrumentation run, not an eval-only throwaway. The whole point is operational observability. | 2026-06-19 |
| D-2 | No fork required | Whitney owns content-manager directly. Forking her own repo adds overhead with no benefit — the PAT just needs write access to the direct repo. | 2026-06-19 |
| D-3 | Create minimal schema skeleton (namespace + 2 known attributes), let spiny-orb discover domain | Eval targets use deliberately incomplete schemas to test discovery. Content-manager uses no schema at all. We seed with just enough structure for spiny-orb to understand the namespace convention, then let spiny-orb fill in the domain — this gives a cleaner signal on what spiny-orb does from near-zero. | 2026-06-19 |
| D-4 | IS scoring uses `--require` not `--import` | Content Manager is CommonJS (`"type": "commonjs"` in package.json). The `--import` flag is for ESM. Using `--import` with a CJS module causes a crash. | 2026-06-19 |
| D-5 | Template recommendation is a primary deliverable, not an afterthought | Whitney specifically asked whether a repeatable template is warranted. The answer should be grounded in observed friction, not assumed. The learnings milestone produces the recommendation. | 2026-06-19 |
| D-6 | OTel SDK and Pino packages are production deps, not devDeps | The instrument branch merges — these packages run in production. Installing as devDeps (the IS scoring pattern for eval targets) is wrong here. They go in `dependencies`. | 2026-06-19 |
| D-7 | Pino and OTel bootstrap are set up before the eval run, not after | So spiny-orb can detect the existing logger pattern during instrumentation, and so log-trace correlation works from day one rather than requiring a second commit cycle. | 2026-06-19 |
| D-8 | Span-based metrics is exploratory; Approach B (spanmetricsconnector) is documentation-only | The shared `otelcol-config.yaml` affects all eval targets — modifying it for an experiment is too risky. Approach A (Datadog UI) is the primary test. If it works, the recipe applies directly to commit-story-v2 where metrics are not yet working. | 2026-06-19 |
