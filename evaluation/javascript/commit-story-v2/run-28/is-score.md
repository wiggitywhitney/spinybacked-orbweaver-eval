IS Score: 100 / 100

Rule Results:
✅ RES-005 (Critical): service.name present
✅ RES-001: service.instance.id present
✅ RES-004: semconv attributes at correct OTLP level
✅ SPA-001: INTERNAL span count within limit (31 total)
✅ SPA-002: no orphan spans
✅ SPA-003: 28 unique span name(s), no interpolated values detected
✅ SPA-004: root spans are not CLIENT kind
✅ SPA-005: 17 span(s) with duration <5ms (within limit of 20)

Applicable rules: 8 | Passed: 8 | Failed: 0 | Not applicable (skipped): 7
Weighted score: 10/10 points (Critical rules weighted 3×)

## IS Scoring Run Details

- **Run start**: 2026-09-17T21:32:08Z
- **Trace ID**: `f6c3e65801a56176c5e430654e06d114`
- **service.instance.id**: `adf2caf8-aca4-4e93-a394-3d1c0c7210ab`
- **Filtered/sanitized trace file**: `evaluation/javascript/commit-story-v2/run-28/eval-traces-run28.json` (31 spans, filtered from the shared `evaluation/is/eval-traces.json` by `service.name:commit-story` + this run's trace ID, per D-11; local-machine identity fields redacted per `~/.claude/rules/is-scoring-gotchas.md`)
- **Scorer re-run confirmed unaffected by redaction** — same 100/100 result before and after sanitization
- **Datadog confirmation**: `search_datadog_spans` with `service:commit-story` (last 4h) returned 31 spans matching trace `f6c3e65801a56176c5e430654e06d114`, confirming the collector forwarded this run's traces to Datadog APM in parallel with the file exporter
- **Baseline**: matches runs 25, 26, and 27's 100/100 — fourth consecutive perfect IS score
