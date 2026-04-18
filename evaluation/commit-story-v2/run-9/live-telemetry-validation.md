# Live Telemetry Validation — Run-9

## Result: VALIDATED

18 manual spans from commit-story appeared in Datadog APM using NodeSDK + SimpleSpanProcessor + process.exit interception. Root span (`commit_story.cli.main`) missing due to process.exit firing before `finally { span.end() }` — tracked in commit-story-v2#53.

## Setup

| Component | Status |
|-----------|--------|
| Datadog Agent OTLP endpoint (port 4318) | Running (system agent, not Docker) |
| commit-story-v2 on instrument branch | `spiny-orb/instrument-1774115750647` |
| `instrumentation.js` | Modified for CLI: SimpleSpanProcessor + process.exit interception |
| npm-linked CLI | `/opt/homebrew/bin/commit-story` → local repo |
| OTel SDK loads | Confirmed via `OTEL_LOG_LEVEL=debug` |

## What Works

**NodeSDK + SimpleSpanProcessor (no traceloop) via `--import`**: 18 spans in Datadog.

```text
commit_story.git.get_commit_data
commit_story.git.get_previous_commit_time
commit_story.context.collect_chat_messages
commit_story.context.gather_for_commit
commit_story.journal.discover_reflections
commit_story.journal.ensure_directory
commit_story.journal.save_entry
commit_story.summary_detector.get_days_with_entries
commit_story.summary_detector.find_unsummarized_days
commit_story.summary_detector.get_days_with_daily_summaries
commit_story.summary_detector.find_unsummarized_weeks
commit_story.summary_detector.find_unsummarized_months
commit_story.summarize.trigger_auto_summaries
commit_story.summarize.trigger_auto_weekly_summaries
commit_story.summarize.trigger_auto_monthly_summaries
commit_story.summary.generate_daily
commit_story.summary.generate_and_save_daily
(+ test.direct from earlier inline test)
```

Domain attributes visible: `commit_story.commit.author`, `commit_story.commit.message`, `commit_story.context.sessions_count`, `commit_story.context.messages_count`, `commit_story.filter.messages_before/after`, `commit_story.journal.file_path`, etc.

## What Doesn't Work

**@traceloop via `--import`**: Spans created and OTLP export returns code=0, but traces never appear in Datadog. Root cause: dual `import-in-the-middle` versions (v1.15 from traceloop vs v3.0 from sdk-node) create competing ESM hook registries. Same traceloop code works when initialized inline (not via `--import`).

**Root span missing**: `commit_story.cli.main` doesn't appear because `process.exit()` fires inside `main()`'s try block, before the `finally { span.end() }` runs. The exit interceptor flushes already-ended spans but can't end the root span.

## Troubleshooting Timeline

### Phase 1: No traces at all

1. Empty commit with NODE_OPTIONS → hook ran without ANTHROPIC_API_KEY, generation failed. No traces.
2. Real commit (zebra facts) with NODE_OPTIONS → same, hook lacks API key.
3. Manual run with `node --import instrumentation.js index.js` + vals API key → journal saved, but zero traces in Datadog.
4. Added `OTEL_BSP_SCHEDULE_DELAY=0` → still zero. Not a batch timing issue.
5. `OTEL_LOG_LEVEL=debug` → confirmed SDK loads, 15 SpanImpl objects created. Spans exist but aren't exported.

**Diagnosis**: `process.exit()` kills event loop before BatchSpanProcessor flushes.

### Phase 2: process.exit interception

6. Added process.exit monkey-patch to call `sdk.shutdown()` first → debug logging shows "[otel] shutdown complete" but still zero traces.
7. Added 2-second delay after shutdown → still zero.
8. Wrapped `exporter.export()` → confirmed it's called 15 times, all return code=0 (success). Data IS being sent.
9. Checked Datadog Agent receiver stats → "No traces received" in APM section. But this is the dd-trace receiver (port 8126), not the OTLP receiver (4318). Misleading.

**Diagnosis**: Export succeeds but Agent doesn't forward to Datadog backend. Initially suspected corporate Agent restrictions.

### Phase 3: Comparing with commit_story v1

10. Read commit_story v1's `src/tracing.js` and `src/index.js` → v1 calls `await shutdownTelemetry()` explicitly before `process.exit()`.
11. Read v1 journal entries (Sep 8, 2025) → same "traces not appearing" issue resolved by Agent API key configuration.
12. Verified our DD_API_KEY matches the Agent's API key (both end in 97476).
13. Checked v1 uses same endpoint (localhost:4318), same exporter, same Agent.

**Insight**: v1 uses BatchSpanProcessor with explicit shutdown. Our interceptor does shutdown too. Something else is different.

### Phase 4: Isolating the variable

14. Created minimal inline test (no `--import`, no traceloop, same exporter):
    ```javascript
    const sdk = new NodeSDK({ resource, spanProcessors: [new SimpleSpanProcessor(exporter)] });
    sdk.start();
    tracer.startActiveSpan('test.direct', span => { span.end(); });
    setTimeout(() => sdk.shutdown(), 2000);
    ```
    **Result: `test.direct` appeared in Datadog!** OTLP pipeline works.

15. Full app with `--import` but WITHOUT traceloop instrumentations → **18 spans in Datadog!**

16. Full app with `--import` WITH traceloop instrumentations → zero spans despite code=0.

17. Minimal inline test WITH traceloop → **works** (test.traceloop appeared).

**Diagnosis**: The issue is specifically `--import` + traceloop together. Traceloop inline works. NodeSDK via `--import` works. Only the combination fails.

### Phase 5: Root cause

18. Research revealed dual `@opentelemetry/instrumentation` versions: 0.213.0 (from sdk-node) and 0.203.0 (from traceloop). Pre-1.0 semver means `^0.203.0` doesn't satisfy `0.213.0` → npm installs separate copies.

19. Each copy brings its own `import-in-the-middle` (v3.0 vs v1.15). These maintain separate module-local ESM hook registries. Loading both via `--import` creates competing hooks that corrupt the export pipeline.

20. Tried `@traceloop/node-server-sdk` (the full SDK, like cluster-whisperer uses) via `--import` → same failure.

21. Confirmed cluster-whisperer avoids this by initializing traceloop **inside app code**, not via `--import`.

### Resolution

**Working pattern committed** on `fix/instrumentation-cli-telemetry` branch:
- NodeSDK + SimpleSpanProcessor + OTLPTraceExporter via `--import` (manual spans)
- process.exit interception for CLI flush
- NO traceloop in `--import` bootstrap
- Traceloop auto-instrumentation deferred to in-app initialization (commit-story-v2#53)

## Issues Filed

- [commit-story-v2#53](https://github.com/wiggitywhitney/commit-story-v2/issues/53) — Initialize traceloop inside index.js for LangChain auto-instrumentation
- [commit-story-v2-eval#30](https://github.com/wiggitywhitney/commit-story-v2-eval/issues/30) — Document traceloop --import gotcha for spiny-orb setup docs
- Fix branch: `fix/instrumentation-cli-telemetry` pushed to commit-story-v2
