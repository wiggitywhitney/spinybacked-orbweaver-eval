# Research: Instrumentation Score Integration for Multi-Language Eval Framework

**Project:** commit-story-v2-eval
**Last Updated:** 2026-04-10

## Update Log
| Date | Summary |
|------|---------|
| 2026-04-10 | Initial research |

## Findings

### Summary

No standalone tool exists to score OTLP data against the IS spec — it must be built. The scoring script is bounded and achievable (9 applicable rules for a CLI app, line-delimited JSON from an OTel Collector file exporter). SDK bootstrap patterns are well-established across all four target languages, with the key CLI-app concern being graceful shutdown to flush spans before process exit. The largest constraint for IS scoring is repos that require infrastructure (k8s) to exercise — those are significantly harder to score than locally-runnable CLIs.

---

### Surprises & Gotchas

**No scoring tool exists — everyone builds their own.** The IS spec is intentionally implementation-agnostic. The only known implementations are Elastic's internal POC (ES|QL + Kibana, not extractable) and OllyGarden's commercial Insights product (not self-hostable). The `score.olly.garden` web interface is purely informational. A scoring script must be written from scratch.

**Source says:** "No CLI tool, library, or web interface is mentioned in the documentation. The specification appears to be in the foundational stage, defining the standard itself rather than providing ready-to-use solutions." (instrumentation-score/spec) 🟢 high

**Only ~9 of 20 IS rules apply to a CLI app with metrics disabled.** The spec has 20 rules across RES/SPA/SDK/LOG/MET. For commit-story-v2: RES-002 (multi-instance uniqueness) doesn't apply, RES-003 (k8s) doesn't apply, all 6 MET rules don't apply (metrics disabled via `OTEL_METRICS_EXPORTER=none`), and LOG rules are marginal. Applicable rules: RES-001, RES-004, RES-005 (Critical), SPA-001 through SPA-005, SDK-001 = roughly 9 rules. 🟢 high

**The OTel Collector file exporter is the right local receiver — not the Datadog Agent.** The Datadog Agent receives on the same port (4318) but routes spans to the Datadog backend, not a local file. For automated scoring, you need line-delimited JSON on disk that a script can parse. The Collector's file exporter produces exactly that with a 4-line config. Whitney can keep using the Datadog Agent for normal dev use; for IS scoring runs, point the SDK at the Collector instead (controlled by `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` env var — no code change needed).

**Source says:** "each line in the file is a JSON object" (file exporter README) 🟢 high

**CLI apps must intercept process.exit() or use defer — BatchSpanProcessor silently loses spans otherwise.** `examples/instrumentation.js` already does this correctly for Node.js. Python SDK registers an atexit hook by default but SIGTERM bypasses it. Go's `defer shutdown(ctx)` is the most reliable pattern across all three — Go's defer is deterministic even on abnormal exit paths.

**Source says:** "The Python SDK registers an atexit hook by default, but this does not cover all scenarios, especially SIGTERM in containerized deployments." (Python shutdown article) 🟢 high

---

### Findings

**IS Spec Status** 🟢 high
- Spec is at v0.1, pinned commit `52c14ba`, "active development and community feedback" phase
- 20 rules across 5 categories: RES (5), SPA (5), SDK (1), LOG (2), MET (6)
- Rule format: ID + description + rationale + criteria + target + impact level
- Spec is young — OllyGarden founded January 2025, spec announced shortly after

**Rule Applicability by App Type**

| Rule | Applies to CLI? | Why |
|------|----------------|-----|
| RES-001 service.instance.id | ✅ Yes | Single instance still needs an ID |
| RES-002 instance.id unique across instances | ❌ No | Single-process CLI, no multi-instance |
| RES-003 k8s.pod.uid | ❌ No | Not k8s |
| RES-004 semconv at correct OTLP level | ✅ Yes | Static analysis + runtime |
| RES-005 service.name present | ✅ Yes (Critical) | Already set in examples/instrumentation.js |
| SPA-001 ≤10 INTERNAL spans/trace | ✅ Yes | Evaluatable from single run |
| SPA-002 no orphan spans | ✅ Yes | Fully evaluatable, self-contained per trace |
| SPA-003 span name cardinality | ✅ Yes | Check for literal interpolation in names — **threshold undefined in spec (TODO)** |
| SPA-004 root spans not CLIENT | ✅ Yes | Entry point should be INTERNAL |
| SPA-005 ≤20 spans <5ms | ✅ Yes | Duration is in OTLP data |
| SDK-001 SDK version supported | ✅ Yes | Check Node.js/Python/Go version |
| LOG-001, LOG-002 | ❓ Marginal | commit-story-v2 doesn't use OTel logs |
| MET-001 through MET-006 | ❌ No | Metrics disabled in commit-story-v2 |

**OTLP Receiver: OTel Collector with file exporter** 🟢 high

Minimal config:
```yaml
receivers:
  otlp:
    protocols:
      http:
exporters:
  file:
    path: ./eval-traces.json
service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [file]
```

Output is line-delimited JSON, directly parseable. Switch the app's endpoint via
`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces` — same port as Datadog Agent,
no code change, just swap the process listening on it.

**SDK Bootstrap by Language** 🟢 high

| Language | Bootstrap mechanism | Shutdown pattern | Key packages |
|---|---|---|---|
| Node.js/TS | `--import ./examples/instrumentation.js` | Intercept `process.exit()`, SIGTERM/SIGINT handlers (already done) | `@opentelemetry/sdk-node`, `@opentelemetry/exporter-trace-otlp-http` |
| Python | `opentelemetry-instrument` wrapper OR manual bootstrap module | atexit hook (auto) + explicit SIGTERM handler | `opentelemetry-sdk`, `opentelemetry-exporter-otlp-proto-http` |
| Go | `setupOTelSDK()` in `main()` | `defer shutdown(ctx)` — deterministic | `go.opentelemetry.io/otel/sdk/trace`, OTLP exporter |
| TypeScript | Same as Node.js (compiles to JS) | Same as Node.js | Same as Node.js |

**What makes a target repo produce meaningful IS scores** 🟡 medium

- Must emit spans (SDK configured and running, not just API calls)
- Must produce ≥3 spans per invocation for non-trivial SPA scoring
- Must have a clear entry point producing an INTERNAL or SERVER root span (SPA-004)
- Must be **locally runnable** — k8s-dependent repos require infrastructure to produce traces at all
- Repos that disable telemetry signals reduce the applicable rule set

**The k8s-dependent repo constraint** 🟢 high

Cluster Whisperer (TypeScript) and k8s-vectordb-sync (Go) require a running k8s cluster to exercise.
To produce OTLP traces from those repos, you'd need either a Kind cluster, mocked k8s client responses,
or exercising only non-k8s code paths. This should be a named criterion in eval target selection:
locally-runnable repos are IS-scoreable out of the box; k8s repos require a separate IS scoring workflow.

---

### Recommendation

Build a lightweight scoring script; use the OTel Collector file exporter as the OTLP receiver.

The scoring script reads line-delimited JSON from the Collector, evaluates ~9 applicable rules, and
outputs a weighted IS score using the spec formula. The file exporter approach is language-agnostic —
the same Collector config works for Node.js, Python, and Go targets.

IS scoring pipeline additions to each new language eval target (Type C setup):
1. Add `eval/otelcol-config.yaml` to the eval repo
2. Document the `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` override used during IS scoring runs
3. Add a script to exercise the target repo (target-specific — hard for k8s repos)
4. Run the scorer against the collected JSON

Make "locally runnable" a criterion for eval target selection. k8s-dependent repos can be added
later with a Kind-based IS scoring workflow, but that should not gate initial IS integration.

---

### Caveats

- IS spec is young (v0.1, early community phase) — rules could change. Pin to specific commit.
- OllyGarden may release a public scoring tool — check before building if timeline allows.
- SPA-003 cardinality threshold is explicitly marked "TODO" in spec criteria — threshold undefined. 🔴 low confidence
- The rubric already pins to commit `52c14ba` — continue using that pin.

---

## Sources

- [instrumentation-score/spec](https://github.com/instrumentation-score/spec) — spec repo, rule files
- [OllyGarden blog: Instrumentation Score](https://blog.olly.garden/instrumentation-score) — origin and vision
- [Elastic: OTel Instrumentation Score POC](https://www.elastic.co/observability-labs/blog/otel-instrumentation-score) — only known OSS-adjacent implementation
- [OTel Collector file exporter README](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/exporter/fileexporter/README.md) — format and config
- [OTel Go getting started](https://opentelemetry.io/docs/languages/go/getting-started/) — SDK bootstrap pattern
- [Python SDK shutdown with atexit](https://oneuptime.com/blog/post/2026-02-06-otel-sdk-shutdown-python-atexit-sigterm/view) — CLI shutdown pattern
- [SimpleSpanProcessor vs BatchSpanProcessor for Lambda](https://oneuptime.com/blog/post/2026-02-06-batch-vs-simple-spanprocessor-lambda/view) — CLI span flush behavior
- [instrumentation-score/spec rules directory](https://github.com/instrumentation-score/spec/tree/main/rules) — individual rule files (SPA-001, SPA-002, SDK-001, RES-005 read directly)
