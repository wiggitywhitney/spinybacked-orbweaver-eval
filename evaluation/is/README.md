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

The Collector's trace file is shared by every target and every earlier run, so note when this run started and ended. Run this command once immediately before the app command and once immediately after it, and save both numbers:

```bash
python3 -c 'import time; print(time.time_ns())'
```

It prints the current time in nanoseconds, for example `1790874784122382000`. After the run, wait 10 seconds for the Collector to write the last spans.

### Step 3: Filter the traces, then run the IS scorer

Do not score `evaluation/is/eval-traces.json` directly. It holds spans from every target and every earlier run, so scoring it can report another target's spans as yours. Filter it down to this run first. From the repo root:

```bash
node evaluation/is/filter-traces.js --input evaluation/is/eval-traces.json --output evaluation/<language>/<target>/run-<N>/eval-traces-run<N>.json --service <otel-service-name> --start-ns <start> --end-ns <end> --target <target>
```

`--service` is the target's OpenTelemetry service name, and `--start-ns` and `--end-ns` are the two numbers you saved in Step 2. The script keeps only that service's spans that started between the two times, redacts machine details (user name, host name, command lines, and any attribute holding an absolute local path), and scores the traces before and after redaction. It writes the output file only if the two scores match. The example output below comes from running it on the taze run-17 traces, using the output path a run-18 would use. The script prints:

```text
Filtered "taze": kept 140 of 140 spans between 1790003712848000000 and 1790003713757000000 ns
score before sanitizing: 77.8
score unchanged by sanitizing: 77.8
wrote evaluation/typescript/taze/run-18/eval-traces-run18.json
```

The script exits with an error and writes nothing when a required option is missing, or when no spans match, which usually means the times or the service name are wrong:

```text
filter-traces: Missing required option --end-ns
```

```text
filter-traces: No spans from service "taze" started between 1 and 2 ns in evaluation/is/eval-traces.json
```

The output file is line-delimited JSON despite the `.json` extension, so do not convert it to an array. Then score the filtered file:

```bash
node evaluation/is/score-is.js evaluation/<language>/<target>/run-<N>/eval-traces-run<N>.json --target <target> > evaluation/<language>/<target>/run-<N>/is-score.md
```

Output includes an overall weighted IS score (0–100) and per-rule pass/fail breakdown, written to `is-score.md`. The first line looks like this:

```text
IS Score: 77.8 / 100
```

## Notes

- `eval-traces.json` is gitignored — it contains captured trace data from local runs.
- For k8s-dependent repos (e.g., Cluster Whisperer), a running Kind cluster is required to exercise the app and produce traces. Use the same Collector config; just ensure the cluster can route traffic to `localhost:4318`.
- MET rules (MET-001 through MET-006) are marked "not applicable" in the scorer — commit-story-v2 produces no OTel metrics by design.
