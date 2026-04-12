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
sudo launchctl stop com.datadoghq.agent
```

Restart it after your IS scoring run is complete:

```bash
sudo launchctl start com.datadoghq.agent
```

## Running an IS Scoring Session

### Step 1: Start the OTel Collector

From this directory (`evaluation/is/`), run:

**Docker:**
```bash
docker run --rm -p 4318:4318 -v $(pwd):/etc/otelcol otel/opentelemetry-collector-contrib:latest --config /etc/otelcol/otelcol-config.yaml
```

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

For commit-story-v2 example:
```bash
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces node --import ./examples/instrumentation.js src/cli.js <args>
```

### Step 3: Run the IS scorer

```bash
node score-is.js eval-traces.json
```

Output includes an overall weighted IS score (0–100) and per-rule pass/fail breakdown. Record results in `evaluation/<target>/run-<N>/is-score.md`.

## Notes

- `eval-traces.json` is gitignored — it contains captured trace data from local runs.
- For k8s-dependent repos (e.g., Cluster Whisperer), a running Kind cluster is required to exercise the app and produce traces. Use the same Collector config; just ensure the cluster can route traffic to `localhost:4318`.
- MET rules (MET-001 through MET-006) are marked "not applicable" in the scorer — commit-story-v2 produces no OTel metrics by design.
