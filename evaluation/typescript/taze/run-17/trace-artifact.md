service.instance.id: bb52dbe3-6200-4e36-aa31-a87cdad57e09
captured: 2026-09-21T15:20:22Z
target: taze
instrument_branch: spiny-orb/instrument-1789998344404
query: service:taze @service.instance.id:bb52dbe3-6200-4e36-aa31-a87cdad57e09

## Correlated Signals Check (step 9.6)

Checked 2026-09-21, using the `service.instance.id` above as the correlation handle.

| Check | Result |
|-------|--------|
| Traces | **Confirmed.** `search_datadog_spans` with `service:taze @service.instance.id:bb52dbe3-6200-4e36-aa31-a87cdad57e09` returned 140 spans, all carrying `service.instance.id` in `custom.service.instance.id`. |
| Logs | **Gap — no logs at all.** `search_datadog_logs` with `service:taze @otel_resource_attributes.service.instance.id:<uuid>` returned 0 results. Widened to unfiltered `service:taze` (still 0 results) to confirm this is total log absence for the target, not an instance-scoping or field-name problem. |
| Metrics | **Confirmed for `traces.span.metrics.calls`, gap for `traces.span.metrics.duration`.** Resolved the unresolved CodeRabbit finding below: `get_datadog_metric_context` on `traces.span.metrics.calls` (scoped to `service:taze`) lists `service.instance.id` among `indexed_tag_keys`, and a direct query (`sum:traces.span.metrics.calls{service:taze,service.instance.id:bb52dbe3-...} by {service.instance.id}`) returned a real value (140 calls) — confirming `service.instance.id` is a genuinely filterable, per-instance dimension on this metric, not a schema-only tag. `traces.span.metrics.duration` returned no data at all for `service:taze` in the same window, with or without the instance filter — a data-absence gap, not a filterability failure. |

**CodeRabbit finding resolution**: the metrics filterability question flagged 2026-09-21 is resolved — `service.instance.id` is filterable and instance-scoped on `traces.span.metrics.calls` (verified empirically, not just from tag metadata). No query rewrite is needed for that metric. `traces.span.metrics.duration` should be reported as unavailable (no data) for this run rather than filterable-but-empty.
