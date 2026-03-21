# Live Telemetry Validation — Run-9

## Setup

| Component | Status |
|-----------|--------|
| Datadog Agent OTLP endpoint (port 4318) | Running — responds with `{"partialSuccess":{}}` |
| commit-story-v2 on instrument branch | Yes — `spiny-orb/instrument-1774115750647` |
| `instrumentation.js` exists | Yes — OTLP HTTP exporter to localhost:4318, service `commit-story` |
| npm-linked CLI | Yes — `/opt/homebrew/bin/commit-story` → local repo |
| OTel SDK loads | Yes — confirmed via `OTEL_LOG_LEVEL=debug` (diag, context, propagation registered) |

## Test Attempts

### Attempt 1: Empty commit with NODE_OPTIONS

```bash
NODE_OPTIONS="--import .../instrumentation.js" git commit --allow-empty -m "test"
```

**Result**: Post-commit hook fired, commit-story ran, but generation failed (no ANTHROPIC_API_KEY in hook env). No traces in Datadog.

### Attempt 2: Real commit (platypus-facts.md) with NODE_OPTIONS

```bash
NODE_OPTIONS="--import .../instrumentation.js" git commit -m "docs: add platypus facts"
```

**Result**: Same — hook ran without API key, generation sections failed. No traces.

### Attempt 3: Manual run with instrumentation + API key

```bash
env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- \
  node --import .../instrumentation.js .../src/index.js
```

**Result**: Journal entry saved successfully (LLM generation worked). **Still no traces in Datadog.**

### Attempt 4: Immediate batch flush

```bash
OTEL_BSP_SCHEDULE_DELAY=0 OTEL_BSP_MAX_EXPORT_BATCH_SIZE=1 ... (same as attempt 3)
```

**Result**: Journal entry saved. **Still no traces.** Confirms the issue is not batch timing.

## Root Cause

**`process.exit()` in `src/index.js` terminates the Node.js event loop before the OTLP exporter can flush spans.**

The per-file evaluation noted this (index.js): "Process.exit() is called throughout main() (after validation failures, skip conditions, and on success), which bypasses the `finally { span.end() }` block in most execution paths."

The `instrumentation.js` graceful shutdown handlers (`process.on('SIGTERM')`, `process.on('SIGINT')`) are never invoked because `process.exit()` bypasses signal handlers. Even with `OTEL_BSP_SCHEDULE_DELAY=0`, the batch processor's export is async and gets killed when the event loop terminates.

The OTel SDK confirmed loading via `OTEL_LOG_LEVEL=debug` — diag, context, and propagation globals are registered. The SDK starts correctly; spans are likely created but never exported.

## Fix Required

Replace `process.exit(N)` calls in `src/index.js` with `process.exitCode = N` and let the event loop drain naturally. This allows:
1. The `finally { span.end() }` blocks to execute
2. The OTel SDK's batch processor to flush pending spans
3. The OTLP exporter to send traces to the Datadog Agent

This is a **commit-story-v2 code change** (not a spiny-orb change). The instrumentation agent correctly identified this limitation in its notes but cannot fix it without violating NDS-003 (Code Preserved).

## Conclusion

**Live telemetry validation: BLOCKED** by `process.exit()` in the target application. The instrumentation is correct — SDK loads, spans would be created — but no traces reach Datadog because the process terminates before export.

This is documented as a known limitation. The fix is a one-line change per `process.exit()` call in index.js, which should be done as a commit-story-v2 PR (not by the instrumentation agent).
