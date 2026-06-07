# Trace Capture Protocol

Each eval run captures a `service.instance.id` from a live Datadog trace. This UUID appears on every span emitted by a single process invocation, making it the correct identifier for "all spans from this specific execution." It is stored in `evaluation/<target>/run-N/trace-artifact.md` and used throughout the eval to supplement static code review with runtime evidence.

## Why `service.instance.id`, Not `vcs.ref.head.revision` or Trace ID

- **`vcs.ref.head.revision`** only appears on spans that the instrumented code explicitly sets it on. Live-tested: filtering by SHA returned 1 out of 621 spans from the same process run.
- **Trace IDs** are scoped to a single trace. One process invocation produces multiple traces (each journal section generation is its own trace), so no single trace ID captures the full run.
- **`service.instance.id`** is a UUID set once per process invocation and appears on every span from that run.

---

## Datadog MCP Tool

Use the `search_datadog_spans` Datadog MCP tool for all queries in this protocol. Pass the query string exactly as shown in each section — the `from:now-30m` filter is part of the query string, not a separate parameter.

---

## Organic Targets (commit-story-v2)

The instrument branch runs as part of the developer's normal workflow. Spans accumulate in Datadog naturally with each git commit and journal entry. No dedicated trace capture invocation is needed.

**Step 1: Query Datadog MCP**

Use `search_datadog_spans` with query (last 7 days is the default window — wide enough to find recent organic runs without pulling in unrelated historical data):
```text
service:commit-story
```

**Step 2: Identify the most recent complete run**

Look for a span named `commit_story.journal.generate_sections` whose `commit_story.journal.sections` attribute contains all three section types: `["summary","dialogue","technical_decisions"]`. This indicates a complete journal generation run (not a partial execution or early exit).

If multiple complete runs appear, take the most recent one whose `vcs.ref.head.revision` attribute matches the instrument branch under evaluation. If no `vcs.ref.head.revision` is present, take the most recent complete run by timestamp.

If no complete run (all three section types) exists in the last 7 days, extend the window to 30 days. If still none found, record trace absence in the artifact (service.instance.id: none) and note it in `run-summary.md` — do not block evaluation.

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

Use `search_datadog_spans` with query (IS scoring itself takes several minutes, so a 5-minute window is too tight; 30 minutes reliably captures all spans from the run):
```text
service:<target> from:now-30m
```

**Step 3: Record `service.instance.id`**

Copy the `service.instance.id` from any span in the result. All spans from the same run share this UUID.

If the query returns 0 spans: wait up to 5 minutes for Datadog ingestion and retry once. If still empty, record trace absence in the artifact (service.instance.id: none) and note it in `run-summary.md` — do not block evaluation.

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

Example (trace found):
```text
service.instance.id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
captured: 2026-06-06T15:30:00Z
target: commit-story-v2
instrument_branch: spiny-orb/instrument-1749221400000
query: service:commit-story @service.instance.id:a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Example (trace absent):
```text
service.instance.id: none
captured: 2026-06-07T10:00:00Z
target: taze
instrument_branch: spiny-orb/instrument-1749221400000
query: (no trace captured — 0 spans after retry)
```

The `query` field is a ready-to-paste `search_datadog_spans` query that retrieves all spans from the captured run. Per-file agents must use this field — not the `captured` timestamp — for subsequent queries, because Datadog ingestion lag means not all spans may have arrived at capture time.

---

## Using the Trace Artifact in Per-File Evaluation

Each per-file evaluation agent receives the `service.instance.id` from `trace-artifact.md`. Before writing any evaluation section, the agent uses `search_datadog_spans` with the `query` field from the artifact as the base query, appending a space and `resource_name:<prefix>.*` to filter to spans for the file under review. Convert the target name to the span prefix using dot notation and underscores (not hyphens):
- `resource_name:commit_story.journal.*` for `journal-graph.js`
- `resource_name:taze.*` for taze files
- `resource_name:release_it.*` for release-it files

For example, if the artifact's `query` field is `service:taze @service.instance.id:a1b2c3d4-e5f6-7890-abcd-ef1234567890`, the per-file query becomes: `service:taze @service.instance.id:a1b2c3d4-e5f6-7890-abcd-ef1234567890 resource_name:taze.*`

Runtime signals to check per file:
- **Attribute presence at runtime**: Does the span carry expected custom attributes with non-null values?
- **Parent-child relationships**: Are spans nested as the code intends? Check `parentid` chains.
- **Early exit detection**: A span with `gen_ai.operation.name` but no `gen_ai.response.id` indicates the node skipped the LLM call — note whether this matches the code's intent.
- **CDQ-001 double-end**: A `startActiveSpan` span with unexpectedly short duration or error status may indicate `span.end()` called inside the callback — use as corroborating evidence alongside static review.

If the trace has no spans for a given file's namespace, note this in the per-file evaluation. Do not fail the file solely on trace absence — the code path may not have been exercised in the captured run.

---

## Notes

- Per-target invocation commands are in each PRD's IS scoring milestone. `evaluation/is/README.md` has only a generic pattern — it does not carry target-specific context (SDK installs, CLI modes, etc.).
- For organic targets, the pre-run verification step also confirms the most recent spans are from the expected instrument branch by checking `vcs.ref.head.revision` on `commit_story.journal.save_journal_entry` spans.
