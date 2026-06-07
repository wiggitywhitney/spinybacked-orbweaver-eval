# Trace Capture Protocol

Each eval run captures a `service.instance.id` from a live Datadog trace. This UUID appears on every span emitted by a single process invocation, making it the correct identifier for "all spans from this specific execution." It is stored in `evaluation/<target>/run-N/trace-artifact.md` and used throughout the eval to supplement static code review with runtime evidence.

## Why `service.instance.id`, Not `vcs.ref.head.revision` or Trace ID

- **`vcs.ref.head.revision`** only appears on spans that the instrumented code explicitly sets it on. Live-tested: filtering by SHA returned 1 out of 621 spans from the same process run.
- **Trace IDs** are scoped to a single trace. One process invocation produces multiple traces (each journal section generation is its own trace), so no single trace ID captures the full run.
- **`service.instance.id`** is a UUID set once per process invocation and appears on every span from that run.

---

## Organic Targets (commit-story-v2)

The instrument branch runs as part of the developer's normal workflow. Spans accumulate in Datadog naturally with each git commit and journal entry. No dedicated trace capture invocation is needed.

**Step 1: Query Datadog MCP**

Search for spans from the last 7 days:
```text
service:commit-story
```

**Step 2: Identify the most recent complete run**

Look for a span named `commit_story.journal.generate_sections` whose `commit_story.journal.sections` attribute contains all three section types: `["summary","dialogue","technical_decisions"]`. This indicates a complete journal generation run (not a partial execution or early exit).

**Step 3: Record `service.instance.id`**

Copy the `service.instance.id` value from that span. This is the trace artifact for the eval.

**Step 4: Write `trace-artifact.md`**

See artifact format below.

---

## Non-Organic Targets (taze, future targets)

Traces are captured during the IS scoring run. The OTel Collector forwards spans to Datadog in parallel with the local file exporter (spinybacked-orbweaver#899). No pre-IS-scoring invocation with the DD Agent is needed.

**Step 1: Complete the IS scoring run**

Run IS scoring as documented in that target's eval PRD (the IS scoring milestone contains the target-specific invocation command — per-target details like SDK installs and CLI modes live there, not in a centralized location).

**Step 2: Query Datadog MCP immediately after the run**

Filter to the last 5 minutes to isolate the scoring run:
```text
service:<target> from:now-5m
```

**Step 3: Record `service.instance.id`**

Copy the `service.instance.id` from any span in the result. All spans from the same run share this UUID.

**Step 4: Write `trace-artifact.md`**

See artifact format below.

---

## Trace Artifact Format

Store in `evaluation/<target>/run-N/trace-artifact.md`:

```text
service.instance.id: <uuid>
captured: <ISO timestamp>
target: <target-name>
instrument_branch: <branch-name>
query: service:<target> @service.instance.id:<uuid>
```

Example:
```text
service.instance.id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
captured: 2026-06-06T15:30:00Z
target: commit-story-v2
instrument_branch: spiny-orb/instrument-1749221400000
query: service:commit-story @service.instance.id:a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

The `query` field is a ready-to-paste Datadog MCP search that retrieves all spans from the captured run.

---

## Using the Trace Artifact in Per-File Evaluation

Each per-file evaluation agent receives the `service.instance.id` from `trace-artifact.md`. Before writing any evaluation section, the agent queries Datadog MCP using the `query` field from the artifact, then filters to spans relevant to the file under review by `resourcename` prefix (e.g., `commit_story.journal.*` for `journal-graph.js`).

See the per-file evaluation milestone in the eval PRD for the full set of runtime checks the agent performs (attribute presence, parent-child relationships, early exit detection, CDQ-001 signal).

If the trace has no spans for a given file's namespace, note this in the per-file evaluation. Do not fail the file solely on trace absence — the code path may not have been exercised in the captured run.

---

## Notes

- Per-target invocation commands are in each PRD's IS scoring milestone. `evaluation/is/README.md` has only a generic pattern — it does not carry target-specific context (SDK installs, CLI modes, etc.).
- For organic targets, the pre-run verification step also confirms the most recent spans are from the expected instrument branch by checking `vcs.ref.head.revision` on `commit_story.journal.save_journal_entry` spans.
