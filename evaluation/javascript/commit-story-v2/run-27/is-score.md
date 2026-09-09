IS Score: 100 / 100

Rule Results:
✅ RES-005 (Critical): service.name present
✅ RES-001: service.instance.id present
✅ RES-004: semconv attributes at correct OTLP level
✅ SPA-001: INTERNAL span count within limit (47 total)
✅ SPA-002: no orphan spans
✅ SPA-003: 41 unique span name(s), no interpolated values detected
✅ SPA-004: root spans are not CLIENT kind
✅ SPA-005: 19 span(s) with duration <5ms (within limit of 20)

Applicable rules: 8 | Passed: 8 | Failed: 0 | Not applicable (skipped): 7
Weighted score: 10/10 points (Critical rules weighted 3×)

## Methodology note: shared eval-traces.json required filtering

The persistent `otelcol-contrib` LaunchAgent has been running since 2026-07-08 and never truncates `evaluation/is/eval-traces.json` — the file exporter appends indefinitely. At the time of this run it held 4,759 spans spanning 2026-08-03 through today, mixing `commit-story` and `cluster-whisperer` traces from unrelated sessions. Scoring the raw file directly returned 70/100 with a `cluster-whisperer.vectorstore.initialize` root span and SPA-003/SPA-004/SPA-005 failures that belong to that other target, not commit-story-v2.

To score only this run's telemetry, spans were filtered to `service.name == "commit-story"` and `startTimeUnixNano` within a 5-second-padded window around the app invocation (1788977114361–1788977138721 ms), producing a 47-span subset scored above. The filtered subset is saved at `evaluation/javascript/commit-story-v2/run-27/eval-traces-run27.json` for reproducibility, with `process.owner`, `host.id`, `process.command_args`, `process.executable.path`, and `process.command` redacted (local machine identity, not needed to reproduce the score). The file stays line-delimited JSON (one `ExportTraceServiceRequest` per line) rather than a single top-level array — that's the format `score-is.js` and the collector's file exporter already use, and changing it would break re-scoring.

This is a process gap worth flagging for `actionable-fix-output.md`: any run using the persistent collector needs this same time/service filtering step, or the shared file needs periodic rotation, or `score-is.js` needs a `--service-name` / time-window filter built in.

## Datadog trace verification

Confirmed via `search_datadog_spans` (`service:commit-story`, sorted by `-timestamp`): the IS scoring run's root span (`commit_story.cli.main`) starts at `2026-09-09T18:05:19.287Z` and ends `2026-09-09T18:05:33.721Z`, matching the local run's pid (86558) and duration. `service.instance.id: 1ccf9bdb-43a3-4738-a1af-c19d72e0b28c`.
