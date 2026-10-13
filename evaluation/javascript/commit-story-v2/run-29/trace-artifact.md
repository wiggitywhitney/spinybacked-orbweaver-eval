// ABOUTME: Trace evidence for run-29 — pre-run capture from Datadog, with post-run verification appended after the instrument run.
# Run-29 Trace Artifact

## Pre-run capture

**captured**: 2026-10-13

**pre_run_service.instance.id**: `adf2caf8-aca4-4e93-a394-3d1c0c7210ab`

**query**: `service:commit-story @service.instance.id:adf2caf8-aca4-4e93-a394-3d1c0c7210ab`

**provenance**: unknown provenance

**How it was selected**: the 7-day window (`service:commit-story`, `now-7d`) held 12 spans, all from one process on 2026-10-08 (`service.instance.id` `102d602c-fb62-43f6-b3e9-aa3c0e829e78`, `git.commit.sha` `2e1d0c1`, current main). They are LangChain/Traceloop library spans only (`CompiledStateGraph.workflow`, `RunnableSequence.workflow`, `ChannelWrite.workflow`, `chat.anthropic`), every one a root span, with no `commit_story.journal.generate_sections` span, so they do not qualify as a journal generation run under `evaluation/trace-capture-protocol.md`. The 30-day window held 19 `commit_story.journal.generate_sections` spans; the most recent is on 2026-09-17T21:32:10Z, `service.instance.id` `adf2caf8-aca4-4e93-a394-3d1c0c7210ab`. That process was invoked as `node --import ./examples/instrumentation.js src/index.js HEAD`, which matches run-28's IS scoring invocation.

**Completeness check not verifiable**: the protocol's completeness test reads `commit_story.journal.sections` on the `generate_sections` span. That attribute is absent from these spans, so the three-section check could not be applied. This trace is recorded as the most recent journal generation run by timestamp, with the gap noted in `lessons-for-prd30.md`.

**Provenance check**: the span's `vcs.ref.head.revision` is `8bea392` (commit-story-v2 PR #90 merge, 2026-07-11). Current main HEAD is `2e1d0c1`, and the run-28 instrument branch `spiny-orb/instrument-1789648132789` is `c87b774`. The revision matches neither, so it is labeled unknown provenance. The likely explanation is that the IS scoring run checked out the instrument branch's `src/` and `examples/` paths onto a local main that stood at `8bea392`, so `HEAD` reported main's revision while the code ran instrumented. That explanation is an inference, not verified.

**Instrument-branch technique smoke test (pre-run item 22)**: `git rev-parse spiny-orb/instrument-1789648132789` resolves to `c87b774`, and Datadog shows `vcs.ref.head.revision: c87b774` on run-28's `commit_story.journal.generate_sections` spans (`service.instance.id` `ab1620ee-ef3e-4d7f-813b-6ae7894744ff`, 2026-09-17T13:44Z). The technique works. The PRD names `commit_story.journal.save_journal_entry` as the span to check, but that resource has no spans in Datadog's 30-day retention; run-28 recorded the save span as `commit_story.journal.save_entry`. The check used `generate_sections` instead.
