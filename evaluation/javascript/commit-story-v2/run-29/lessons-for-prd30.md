// ABOUTME: Process observations from run-29 to inform PRD #30 template and milestone drafting.
# Lessons for PRD #30 — commit-story-v2 Run-29

Process observations captured during run-29. Populated incrementally as the run progresses.

## Target-Specific Findings

*(Findings specific to commit-story-v2 that do not belong in the template)*

## Pre-Run Verification Summary

Checked 2026-10-13.

- **Target fork (commit-story-v2)**: on `main`, up to date with `origin/main`, HEAD `2e1d0c1` (PR #97, Traceloop activation fix). `spiny-orb.yaml` and `semconv/` present. 32 `.js` files under `src/`, matching run-28's "Files seen: 32". The working tree held three uncommitted journal files (one modified entry, one new entry, one new daily summary) from commit-story's own journaling hook; these are not run artifacts and were not deleted. With Whitney's approval they were committed to main as `fa26743` and pushed (journal-only commits are exempt from the feature-branch rule). commit-story's post-commit hook then journaled that commit, leaving three new untracked journal files (an entry for 2026-10-13, a daily summary for 2026-10-08, the weekly W41 summary). Committing those would generate another entry, so they were left in place. spiny-orb stages only the files it instruments (`git.add(files)` in `src/git/git-wrapper.ts`) and never checks for a clean tree, so they cannot enter the instrument commits. **commit-story-v2 main HEAD at run time is `fa26743`, not `2e1d0c1`**; use `fa26743` for trace provenance labeling.
- **Template improvement candidate**: the readiness check asks for a clean working tree, but on commit-story-v2 any commit, including one that commits leftover journal files, triggers the journaling hook and creates new untracked journal files. A literally clean tree cannot be reached. The check should say that untracked `journal/` files are expected and allowed, and that only leftovers under `src/`, `examples/`, or spiny-orb artifacts (`spiny-orb-pr-summary.md`, `*.instrumentation.md`) must be cleaned.
- **Eval input change**: commit-story-v2 PR #97 changed `src/traceloop-init.js` (LangChain `manuallyInstrument({ callbackManagerModule })`, MCP activation dropped). spiny-orb's ROADMAP says not to count a difference in that file's output as a spiny-orb regression.
- **Handoff triage (item 2)**: #1065–#1068 all exist and are open with the `evaluation/run-28` label; #1065 and #1066 carry `high priority`. #1068's title says the fallback is applied "at only 4 of 7 sites", but run-28 found it applied at 3 of 7 with 4 raw. The title inverts the count.
- **RUN28-1 (#1067, CDQ-006)**: open. No fix merged. On spiny-orb's ROADMAP next to #1068 ("consider fixing them together").
- **RUN28-2 (#1037, SCH-003)**: closed 2026-10-13 by spiny-orb PR #1097 (merge `475eb3d`), which also closed #1072. The fix types `_count`/`.count` extensions as `int` and `is_`/`has_`/`should_`/`force` as `boolean` at parse time, before SCH-003's auto-fix, and SCH-003 now validates against the agent's declared extension types. It flags `String(x.length)` on a declared count and a boolean literal on a `string`-declared key. It does not cover the raw-number-into-`string` direction at reuse sites: `dates_requested` moved to #1084. Count keys not named `_count` moved to #1091. So the bidirectional scope is partly covered by #1097 and partly moved to other issues.
- **Count-cast fix in build (D-5)**: **in the build.** PR #1097 merged at `475eb3d`; `git merge-base --is-ancestor 475eb3d HEAD` exits 0 in the build checkout, and `src/validation/tier2/extension-types.ts` exists there. The two checks agree. The Baseline comparison and Actionable fix output milestones score the count-cast pattern as a fix check, not as excluded pipeline noise.
- **spiny-orb build (items 18, 19)**: built in the detached worktree `~/Documents/Repositories/spinybacked-orbweaver-main` at `475eb3d5d35d0e723d83f1abbca823277aea91ce` (`origin/main`), with `npm ci && npm run build`. `spiny-orb --version` reports 2.0.0. Whitney chose the worktree because the primary checkout was on another session's branch (`feature/1093-1082-prettier-normalize-nds003-docs`). The instrument command's `node` path is therefore `~/Documents/Repositories/spinybacked-orbweaver-main/bin/spiny-orb.js`. A past worktree issue (a push from a linked worktree flipping `core.bare=true`) does not apply, because nothing pushes from this worktree; `core.bare` is `false` in both commit-story-v2 and spiny-orb.
- **Agent model and effort**: `src/config/schema.ts` at `475eb3d` defaults `agentModel` to `claude-opus-5-5` and `agentEffort` to `medium`. commit-story-v2's `spiny-orb.yaml` sets neither.
- **RUN28-3 (#1068, CDQ-007 paths)**: open. No fix merged.
- **RUN28-4a (#1066, CDQ-007 PII)**: open, `high priority`. Not fast-tracked: spiny-orb's ROADMAP sequences it after PRD #1075's fixes, behind #1065.
- **RUN28-4b (#1065, severity flip)**: open, `high priority`. No investigation result posted. ROADMAP puts it first in the CDQ-007 PII step, after PRD #1075's fixes.
- **RUN28-5 watch**: no planned treatment found. #927 is still open; spiny-orb filed #1087 as the fix issue for #927 (from release-it run-5: 8 of 9 files had notes contradicting code).
- **#1063 (SCH-002 key reuse)**: open, no movement.
- **#1036 (PR summary omissions)**: open, no movement.
- **#1060 (CDQ-007 sub-checks collapse)**: open, no movement.
- **Registry version discrepancy**: no fix found.
- **Other spiny-orb merges since run-28**: #1079 (default `agentModel` changed to `claude-opus-5-5`, adaptive thinking), #1078 (fallback template's Traceloop activation comment), #1094 (PRD #1075 research and decisions, docs only, so `gen_ai.*` placement behavior is unchanged for this run), #1096 (deliverables stop publishing absolute local paths; e2e PR test repair), #1097 (count-cast fix).
- **spiny-orb ROADMAP eval requests for this run**: (1) the Opus 5.5 model change. Compare cost per file, Q×F, IS, failures, partials, span count, retries, the share of files stopping at `maxTokensPerFile` (100,000), and any `stop_reason: max_tokens` or `refusal` errors. Opus 5.5's tokenizer produces about 30% more tokens. (2) The count-cast fix check: run-28's `String(x.length)` `_count` keys emit as integers (including `reflections_count`), `is_merge` emits as boolean, and no boolean literal ships on a `string`-declared key such as `summary_saved`.
- **Push auth (item 16)**: `GITHUB_TOKEN` dry-run push to `spiny-orb/auth-test` succeeded.
- **README (item 20)**: no run-28 row. The table stops at run-27, and the "next run" sentence still says run-28 is next. Run-28's README update did not happen. The "Update root README" milestone should add both run-28 and run-29 rows.
- **Datadog (items 1, 21, 23)**: MCP health check passed. Pre-run trace captured; see `trace-artifact.md`.

## Template Improvements

*(Process observations that belong in `docs/language-extension-plan.md`)*

- **The trace-capture protocol's completeness test reads an attribute the spans no longer carry.** `evaluation/trace-capture-protocol.md` defines a complete run as a `commit_story.journal.generate_sections` span whose `commit_story.journal.sections` contains all three section types. None of the 19 `generate_sections` spans in Datadog's 30-day retention carry that attribute, so the test cannot be applied as written. The protocol needs a completeness signal that the instrumented code emits.
- **The PRD names a span resource that does not exist.** Pre-run item 22 says to check `commit_story.journal.save_journal_entry`. That resource has no spans in retention; run-28 recorded the save span as `commit_story.journal.save_entry`, and span names vary by run because the agent names them. The template should tell the reader to derive the resource from what Datadog shows, the same way the post-run verification milestone already does.
- **Main-branch commit-story traffic now emits only Traceloop library spans.** With no manual instrumentation on main, organic main-branch runs produce LangChain/Anthropic root spans and no `commit_story.*` spans. The pre-run capture can therefore only find journal generation runs from instrument branches or IS scoring runs, which is why the latest one is run-28's.
