# IS Score — Release-it Run-1

**Date**: 2026-04-18
**Status**: NOT EVALUABLE — 0 files committed with instrumentation

---

## Why IS Scoring Is Not Possible for Run-1

The IS (Instrumentation Score) evaluates live OTLP telemetry collected by running the instrumented target application. It requires:
1. A committed instrumentation branch with OTel spans in the source code
2. A runnable version of the target with those spans active
3. A running OTel Collector to receive OTLP data

None of these conditions are met for run-1:
- 0 files were committed with instrumentation (config.js and index.js failed LINT oscillation; other files not reached)
- The instrumentation branch `spiny-orb/instrument-1776550755270` contains only instrumentation reports for the 3 correct-skip files — no actual span code was added
- Running release-it without instrumentation would produce 0 OTel spans

Attempting IS scoring against an empty trace collection would produce: 0 spans, all IS rules `not_applicable`, IS score = N/A.

---

## IS Scoring Requirements for Run-2

For run-2 IS scoring to be meaningful:
1. At least one plugin file (lib/plugin/git/Git.js, lib/plugin/github/GitHub.js, or lib/plugin/npm/npm.js) must be successfully committed with spans
2. The OTel Collector must be running on port 4318 (stop Datadog Agent first: `sudo launchctl stop com.datadoghq.agent`)
3. release-it must be invoked in a test mode that exercises the instrumented code paths

**Note on release-it invocation**: release-it's primary operation is creating releases (git tags, GitHub releases, npm publishes). Running it in a real mode would create actual releases. A dry-run mode (`release-it --dry-run`) exercises the code paths without publishing — this is the correct approach for IS scoring. The dry-run output will exercise Config.init, runTasks, plugin lifecycle hooks, and potentially the git/GitHub plugin paths.

**Expected IS results for run-2** (if instrumentation commits):
- `service.name`: PASS — set via OTel init file (examples/instrumentation.js)
- Span names: PASS if span names follow bounded cardinality convention
- No orphan spans: dependent on context propagation quality
- MET rules: not_applicable (release-it emits no metrics)
