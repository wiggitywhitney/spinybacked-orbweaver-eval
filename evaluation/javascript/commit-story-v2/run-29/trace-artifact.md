// ABOUTME: Trace evidence for run-29 — pre-run capture from Datadog, with post-run verification appended after the instrument run.
# Run-29 Trace Artifact

## Pre-run capture

**captured**: 2026-10-13

**pre_run_service.instance.id**: `adf2caf8-aca4-4e93-a394-3d1c0c7210ab`

**query**: `service:commit-story @service.instance.id:adf2caf8-aca4-4e93-a394-3d1c0c7210ab`

**provenance**: unknown provenance

**How it was selected**: the 7-day window (`service:commit-story`, `now-7d`) held 12 spans, all from one process on 2026-10-08 (`service.instance.id` `102d602c-fb62-43f6-b3e9-aa3c0e829e78`, `git.commit.sha` `2e1d0c1`, current main). They are LangChain/Traceloop library spans only (`CompiledStateGraph.workflow`, `RunnableSequence.workflow`, `ChannelWrite.workflow`, `chat.anthropic`), every one a root span, with no `commit_story.journal.generate_sections` span, so they do not qualify as a journal generation run under `evaluation/trace-capture-protocol.md`. The 30-day window held 19 `commit_story.journal.generate_sections` spans; the most recent is on 2026-09-17T21:32:10Z, `service.instance.id` `adf2caf8-aca4-4e93-a394-3d1c0c7210ab`. That process was invoked as `node --import ./examples/instrumentation.js src/index.js HEAD`, which matches run-28's IS scoring invocation.

**Completeness check not verifiable**: the protocol's completeness test reads `commit_story.journal.sections` on the `generate_sections` span. That attribute is absent from these spans, so the three-section check could not be applied. This trace is recorded as the most recent journal generation run by timestamp, with the gap noted in `lessons-for-prd30.md`.

**Provenance check**: the span's `vcs.ref.head.revision` is `8bea392` (commit-story-v2 PR #90 merge, 2026-07-11). Main HEAD at run time is `fa26743` (main was `2e1d0c1`, the SHA on the 2026-10-08 spans, until pre-run verification committed leftover journal files; see PRD #161 D-8), and the run-28 instrument branch `spiny-orb/instrument-1789648132789` is `c87b774`. The revision matches none of the three, so it is labeled unknown provenance. The likely explanation is that the IS scoring run checked out the instrument branch's `src/` and `examples/` paths onto a local main that stood at `8bea392`, so `HEAD` reported main's revision while the code ran instrumented. That explanation is an inference, not verified.

**Instrument-branch technique smoke test (pre-run item 22)**: `git rev-parse spiny-orb/instrument-1789648132789` resolves to `c87b774`, and Datadog shows `vcs.ref.head.revision: c87b774` on run-28's `commit_story.journal.generate_sections` spans (`service.instance.id` `ab1620ee-ef3e-4d7f-813b-6ae7894744ff`, 2026-09-17T13:44Z). The technique works. The PRD names `commit_story.journal.save_journal_entry` as the span to check, but that resource has no spans in Datadog's 30-day retention; run-28 recorded the save span as `commit_story.journal.save_entry`. The check used `generate_sections` instead.

## Post-run verification

**Window**: `[2026-10-13T19:13:52Z, 2026-10-13T20:08:52Z]`, from the eval run's `Started:` line to the verification query time.

**post_run_service.instance.id**: `a2a54d88-00c9-4a85-bc8a-64e11de35779`

**query**: `service:commit-story resource_name:commit_story.* @vcs.ref.head.revision:860fcb13d0dcdba8ae387da833557f191b081fbc`

**provenance**: instrument-branch evidence

**How it was selected**: the unfiltered `service:commit-story` query over the window returned 246 spans. Their resources are all under `commit_story.*` (`cli`, `context`, `git`, `ai`, `journal`, `summarize`), so the derived prefix is `commit_story.*` rather than `commit_story.journal.*`. They come from commit-story's post-commit hook, which journaled each commit spiny-orb made while building the instrument branch, so the window holds many processes running partly instrumented code. Narrowing by `vcs.ref.head.revision` to the instrument branch HEAD (`git -C ~/Documents/Repositories/commit-story-v2 rev-parse spiny-orb/instrument-1791918832887` = `860fcb13d0dcdba8ae387da833557f191b081fbc`) returned 3 spans (`commit_story.git.get_commit_data`, `commit_story.journal.generate_sections`, `commit_story.journal.save_entry`), all from process `a2a54d88-…` at 2026-10-13T19:59:01–05Z, the hook run for the branch's final commit. Earlier hook processes in the window report earlier branch commits (for example `47abd88` at 19:55, process `1a58b1e1-…`).

**`git.commit.sha` does not identify the branch**: every span in the window, including the instrument-branch ones, carries the `git.commit.sha` tag `fa26743` (commit-story-v2 main), which confirms that only `vcs.ref.head.revision` tells branch code apart.

**Watch item for per-file evaluation**: `commit_story.cli.main`, `commit_story.context.gather_for_commit`, and `commit_story.git.get_previous_commit_time` spans in the same process carry `vcs.ref.head.revision: HEAD`, the literal ref string the CLI was called with, while `get_commit_data`, `generate_sections`, and `save_entry` carry the resolved SHA. Check whether the files that set the attribute on those spans (`index.js`, `context-integrator.js`, `git-collector.js`) record an unresolved ref.

**Log-trace correlation check** (commit-story-v2 pino bridge):
- **Scoped to the post-run instance**: the PRD's query field `@otel_resource_attributes.service.instance.id` matches no logs. These logs carry the ID as `@service.instance.id`, so the scoped query is `service:commit-story @service.instance.id:a2a54d88-00c9-4a85-bc8a-64e11de35779`. All 5 of its logs (`Generating journal sections`, `Generating journal summary`, `Generating technical decisions`, `Generating dialogue`, `Journal entry saved`) carry non-empty `trace_id` and `span_id`: 5/5, 100%.
- **Whole window, for comparison with run-28's method**: 165 logs, of which 94 lack `@otel.trace_id`, so 71/165 (43%) are correlated, against run-28's ~82% (71/87 sampled from the window). Every uncorrelated log has an empty `@service.instance.id`. Their messages are `Generating journal …`, `Skipping dialogue/technical decisions: no substantial user messages`, and `Journal entry saved`, mostly from a burst of hook processes at 19:15–19:24 before `journal-graph.js` was instrumented (file 17), plus `Journal entry saved` lines through 19:51. The 19:59 `Journal entry saved` log is correlated through the `commit_story.cli.main` span, which exists only once `index.js` (the last file) was committed.
- **Verdict**: no regression in the instrumented code. The scoped instance is fully correlated. The window-wide rate is below run-28's baseline because the window's composition differs (more hook runs on partly instrumented code), not because correlation broke; it is recorded as a partial-regression watch item per the PRD's rule, with that explanation. The uncorrelated logs having no `service.instance.id` at all is unexplained.
