# spinybacked-orbweaver-eval

Evaluation framework for [spiny-orb](https://github.com/wiggitywhitney/spinybacked-orbweaver) — an AI agent that automatically instruments codebases with OpenTelemetry spans.

---

## What is spiny-orb?

spiny-orb reads a target codebase alongside an OpenTelemetry Weaver schema and uses an LLM to add OTel instrumentation (spans, attributes, error recording) to application source files. It creates a branch, opens a PR, and runs a checkpoint test suite after each file to catch instrumentation errors before they land.

This repo does not contain application code. The target app being evaluated (commit-story-v2) lives at [wiggitywhitney/commit-story-v2](https://github.com/wiggitywhitney/commit-story-v2).

---

## Evaluation target: commit-story-v2

commit-story-v2 is the current JavaScript evaluation target. It is a Node.js CLI that generates journal entries from git commits using LangGraph (LangChain's graph orchestration framework), the Anthropic API, and an MCP server — giving spiny-orb a codebase with LLM calls, async I/O, graph-based orchestration, and auto-instrumentation library interactions to navigate.

Future evaluation targets are planned for TypeScript, Python, and Go. Candidate repos for each language are documented in [`docs/research/eval-target-criteria.md`](docs/research/eval-target-criteria.md).

---

## How evaluation works

Each evaluation run instruments commit-story-v2 with spiny-orb, then assesses the output against two scoring systems:

### Code-level rubric (32 rules)

The rubric evaluates the source code diff across six dimensions:

| Dimension | Prefix | Rules | What it checks |
|-----------|--------|-------|----------------|
| Non-Destructiveness | NDS | 6 | Agent preserved existing behavior; no business logic modified |
| Coverage | COV | 6 | Right functions got spans; auto-instrumentation correctly deferred |
| Restraint | RST | 5 | Agent didn't over-instrument utility functions, getters, or wrappers |
| API-Only Dependency | API | 4 | Only `@opentelemetry/api` imported — no SDK, no vendor packages |
| Schema Fidelity | SCH | 4 | Span names and attribute keys match the Weaver registry |
| Code Quality | CDQ | 7 | Spans closed in all paths, correct error recording, consistent tracer naming |

Five of the 32 rules are **gates** — if any gate fails, quality scoring is skipped. The remaining 27 rules produce a score out of 25 (COV and RST exclude two advisory-only rules from the count).

### Instrumentation Score (IS)

The [Instrumentation Score](https://github.com/instrumentation-score/spec) evaluates the runtime OTLP telemetry the instrumented app actually emits. It checks resource attributes, span topology, cardinality, and semantic convention placement. Run-14 established the first IS baseline: **80/100**.

---

## Repository structure

```text
spinybacked-orbweaver-eval/
├── prds/                          # PRDs tracking each evaluation run
│   ├── 61-evaluation-run-15.md   # Current open PRD (run-15)
│   └── done/                     # Completed PRDs
│
├── evaluation/
│   ├── commit-story-v2/           # Artifacts from each JS eval run
│   │   ├── run-2/ … run-14/      # Per-run: rubric scores, per-file eval,
│   │   │                         #   baseline comparison, actionable-fix-output,
│   │   │                         #   spiny-orb-output.log, is-score.md
│   │   └── run-log.md            # (planned, PRD #57)
│   └── is/                       # IS scoring infrastructure
│       ├── otelcol-config.yaml   # OTel Collector config (writes to eval-traces.json)
│       ├── score-is.js           # IS scorer script
│       └── README.md             # IS scoring setup and run instructions
│
└── docs/
    ├── ROADMAP.md                 # Prioritized evaluation work queue
    ├── language-extension-plan.md # How to add new language evaluation chains
    ├── research/                  # Target selection research, eval criteria
    └── templates/
        └── eval-run-style-reference/  # Style references for evaluation documents
```

---

## Run history: commit-story-v2

| Run | Quality | Gates | Files | Spans | Cost | Push/PR | IS |
|-----|---------|-------|-------|-------|------|---------|-----|
| 2 | 15/21 (71%) | 3/4 | 5 | 11 | — | NO | — |
| 3 | 19/26 (73%) | 4/4 | 7 | 15 | — | NO | — |
| 4 | 18/26 (69%) | 4/4 | 16 | 48 | $5.84 | NO | — |
| 5 | 23/25 (92%) | 5/5 | 9 | 17 | $9.72 | NO | — |
| 6 | 21/25 (84%) | 5/5 | 5 | 16 | $11.02 | NO | — |
| 7 | 22/25 (88%) | 5/5 | 13 | 28 | $3.22 | NO | — |
| 8 | 23/25 (92%) | 5/5 | 12 | 28 | $4.00 | NO | — |
| 9 | **25/25 (100%)** | 5/5 | 12 | 26 | $3.97 | NO | — |
| 10 | 23/25 (92%) | 5/5 | 12 | 28 | $4.36 | NO | — |
| 11 | **25/25 (100%)** | 5/5 | 13 | 39 | $4.25 | YES | — |
| 12 | 23/25 (92%) | 5/5 | 12+1p | 31 | $5.19 | YES | — |
| 13 | **25/25 (100%)** | 5/5 | 7+1p+11f | 16 | ~$6.41 | YES | — |
| 14 | 22/25 (88%) | 5/5 | 12 | 32 | $5.59 | YES | **80/100** |

Files column notation: plain count = committed files; `+Np` = N partial files (instrumentation started, not fully committed); `+Nf` = N files rolled back after a checkpoint test failure. Cost column: `~` prefix indicates an estimated/derived cost (early runs predating direct cost reporting in the tool); unprefixed values are directly reported by spiny-orb.

**Run-15 is next** — verifying catch-block consistency in `journal-graph.js` (`summaryNode` error recording) and monitoring COV-004 disposition from the parallel advisory rules audit (spiny-orb PRD #483).

Full run-by-run analysis: [`evaluation/commit-story-v2/`](evaluation/commit-story-v2/)
