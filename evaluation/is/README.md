# IS Scoring Setup

This directory contains the OTel Collector config and scoring script for evaluating OTLP telemetry against the [Instrumentation Score](https://github.com/instrumentation-score/spec) (IS) spec. IS spec pinned to commit `52c14ba`.

## Prerequisites

### 1. Install otelcol-contrib

**Docker (recommended):**
```bash
docker pull otel/opentelemetry-collector-contrib:latest
```

**Binary download:**
Download the `otelcol-contrib` binary for your platform from the [OpenTelemetry Collector Contrib releases page](https://github.com/open-telemetry/opentelemetry-collector-contrib/releases). Place it on your PATH.

### 2. Stop the Datadog Agent

The OTel Collector receives on port 4318 — the same port the Datadog Agent uses. They cannot run simultaneously. Stop the Datadog Agent before starting the Collector:

```bash
datadog-agent stop
```

Restart it after your IS scoring run is complete:

```bash
datadog-agent start
```

Note: `sudo` is not required — `datadog-agent stop/start` works as the current user. `sudo launchctl stop/start com.datadoghq.agent` also works but may report "Nothing to do" even when the agent is still running; use the `datadog-agent` CLI instead.

## Running an IS Scoring Session

### Step 1: Start the OTel Collector

From this directory (`evaluation/is/`), run:

**Docker (add `-w /etc/otelcol` so the file exporter's `./eval-traces.json` path resolves to the mounted volume):**
```bash
docker run --rm -d --name otelcol-is -w /etc/otelcol -p 4318:4318 -v $(pwd):/etc/otelcol otel/opentelemetry-collector-contrib:latest --config /etc/otelcol/otelcol-config.yaml
```

Stop it when done: `docker stop otelcol-is`

**Binary:**
```bash
otelcol-contrib --config otelcol-config.yaml
```

The Collector writes captured traces to `evaluation/is/eval-traces.json` (line-delimited JSON, one `ExportTraceServiceRequest` object per line).

### Step 2: Point the target app at the Collector

Override the OTLP endpoint env var — no code changes required:

```bash
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces <your-app-command>
```

#### commit-story-v2 (JavaScript, instrument branch)

Run from `~/Documents/Repositories/commit-story-v2` while checked out to the instrument branch (`spiny-orb/instrument-XXXXXXXXXX`):

```bash
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node --import ./examples/instrumentation.js src/index.js HEAD
```

Notes:
- **Do NOT set `COMMIT_STORY_TRACELOOP=true`** — the installed `@traceloop/instrumentation-langchain` version expects `manuallyInstrument({ callbackManagerModule })` but `traceloop-init.js` calls it without args; this crashes the process. Omitting the env var disables LangChain auto-instrumentation, which is fine — IS scoring evaluates spiny-orb's manually-added spans, not the auto-instrumentation library.
- `env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL` strips Datadog AI Gateway headers so Anthropic API calls go directly to Anthropic (required for the app to function)
- `vals exec -i -f .vals.yaml` injects `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` from secrets
- `--import ./examples/instrumentation.js` loads the OTel SDK and OTLP exporter (entry point is `src/index.js`, not `src/cli.js`)
- `HEAD` processes the most recent commit; substitute any valid git ref
- Check out the instrument branch files first: `git checkout spiny-orb/instrument-XXXXXXXXXX -- src/ examples/`; restore with `git checkout main -- src/ examples/` after

The Collector must be running before you invoke the app. The app calls `process.exit()` after completing, which triggers the OTel SDK shutdown and flushes spans to the Collector.

### Step 3: Run the IS scorer

From the repo root:

```bash
node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/<target>/run-<N>/is-score.md
```

Output includes an overall weighted IS score (0–100) and per-rule pass/fail breakdown, written to `is-score.md`.

## Notes

- **Claude cannot run `sudo` commands.** When Claude is assisting with IS scoring, it will prepare Docker and scoring steps but Whitney must run the `sudo launchctl stop/start` Datadog Agent commands herself (e.g., via `! sudo launchctl stop com.datadoghq.agent` in the Claude Code prompt). Claude will prompt when these steps are needed.
- `otelcol-contrib` binary is not installed on this machine. Always use the Docker approach.
- `eval-traces.json` is gitignored — it contains captured trace data from local runs.
- For k8s-dependent repos (e.g., Cluster Whisperer), a running Kind cluster is required to exercise the app and produce traces. Use the same Collector config; just ensure the cluster can route traffic to `localhost:4318`.
- MET rules (MET-001 through MET-006) are marked "not applicable" in the scorer — commit-story-v2 produces no OTel metrics by design.
