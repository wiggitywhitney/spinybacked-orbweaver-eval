# Eval Target Criteria — Language-Agnostic Scorecard and Candidate Verdicts

**Created:** 2026-04-11
**Research basis:** [eval-target-selection-research.md](eval-target-selection-research.md)
**Status:** Final — downstream Type C PRDs may proceed

This document is the canonical reference for selecting target repositories for spiny-orb evaluation. All Type C PRDs (Setup + Run-1) must read this file before forking any target repo. The criteria are language-agnostic; the candidate verdicts are language-specific.

---

## 1. Final Criteria Scorecard

Criteria function as **filters** (pass/fail), not weighted scores. A candidate must pass all mandatory criteria and should pass most recommended criteria. This design follows SWE-bench++ methodology: basic signal filters yield natural diversity without manual curation overhead.

### Mandatory Criteria

| Criterion | Evidence | Confidence | How to Evaluate |
|-----------|----------|------------|-----------------|
| **Permissive license** | Fork-and-freeze is internal evaluation, not redistribution. MIT, Apache-2.0, and BSD-3-Clause are all acceptable. SWE-bench Pro uses GPL for contamination resistance, but that is not a requirement for spiny-orb eval. | High | Check the repo's LICENSE file. Must be MIT, Apache-2.0, or BSD-3-Clause. |
| **Test suite passes** | Universal across all benchmarks (SWE-bench, SWE-bench++, SWE-bench Pro, OTelBench). NDS-002 is a hard gate in spiny-orb's rubric — a failing test suite blocks the entire evaluation run. | High | Clone the repo, install dependencies, run the test suite. All tests must pass. Flaky tests are a fail. |
| **15–50 total source files** | OTelBench uses ~300 LOC services (too small for per-file eval). SWE-bench uses repos with >10k LOC (sized for issue resolution, not instrumentation). For spiny-orb's per-file architecture, 15–50 files provides enough variety to exercise all rubric rules without prohibitive run cost. | Medium | Count source files in the language's primary extension (`.js`, `.ts`, `.py`, `.go`). Exclude tests, configs, and generated files. |
| **Locally runnable** | IS scoring requires the target to emit OTel spans, which requires exercising the code. k8s-dependent repos need a Kind cluster; locally-runnable repos can be IS-scored out of the box. IS scorability research confirms this is a significant complexity differentiator. | High | Can the repo's primary functionality be invoked locally without external infrastructure (clusters, cloud services, running databases)? CLI tools and libraries that operate on local files/data pass. |
| **Fork-and-freeze compatible** | Universal standard across all benchmarks examined. Qodo's AI code review benchmark and every SWE-bench variant use snapshot-based evaluation. | High | Does the repo have self-contained dependencies (no git submodules pointing to private repos, no build steps requiring authenticated registries)? Can it be forked and built without upstream access? |
| **I/O operation diversity (≥2 types)** | "Async density" is a JavaScript-centric framing; the real criterion is I/O density. Python OTel instrumentation covers sync I/O equally well (requests, sqlite3, subprocess). Repos with diverse I/O types exercise more rubric rules than single-domain repos. | High | Identify I/O operation types present: HTTP calls, database queries, file read/write, subprocess execution, template rendering, network requests. Must have at least 2 distinct types. |

### Recommended Criteria

| Criterion | Evidence | Confidence | How to Evaluate |
|-----------|----------|------------|-----------------|
| **Clear entry point (CLI/server)** | IS scoring requires a root span from a clear entry point. Libraries without a CLI require a custom exercise harness, adding setup overhead. | Medium | Does the repo have a `__main__.py`, `bin/` script, or CLI command? CLI tools and servers pass. Pure libraries need extra work. |
| **Skip-rate balance (30–60% non-instrumentable)** | 12 runs on commit-story-v2 confirm ~50–60% skip rate provides good RST exercise. Below 30% means almost everything needs instrumentation (no skip judgment tested). Above 70% means very few files get instrumented (insufficient coverage testing). | Medium | Estimate the percentage of source files that contain no I/O operations, are pure type definitions, or are trivial utilities. Target 30–60%. |
| **Error handling pattern diversity** | CDQ-003 rubric rule evaluates error handling instrumentation quality. Repos with only one error pattern (e.g., bare try/except) test only one scenario. Diverse patterns (try/except with specific exceptions, retry logic, error callbacks, custom exception hierarchies) exercise the agent's quality judgment. | High | Scan source files for error handling patterns. Look for try/except (or language equivalent), custom exception classes, retry logic, error propagation patterns. Multiple distinct patterns is better. |
| **Mainstream language patterns** | SWE-bench Pro spans 41 repos to "mitigate overfitting to specific project coding styles." Exotic patterns test model knowledge, not instrumentation quality. | Medium | Does the code use standard library imports and common frameworks? Avoid repos that use obscure metaprogramming, code generation, or domain-specific languages that the AI model is unlikely to have seen. |
| **Deterministic reproducibility** | Flaky tests or non-deterministic builds undermine eval reliability. The same spiny-orb version should produce comparable results across runs. | High | Run the test suite 3 times. If any test fails non-deterministically, the repo fails this criterion. |
| **Community adoption (>500 stars)** | SWE-bench++ requires >100 stars. Higher star count correlates with better maintenance, documentation, and testing practices. | Medium | Check GitHub star count. >500 preferred. |

---

## 2. Candidate Verdicts

### commit-story-v2 (JavaScript)

**Verdict: Conditional Pass**

commit-story-v2 passes all mandatory criteria: MIT license, test suite passes, ~30 JS source files, locally runnable (CLI tool), fork-and-freeze compatible, good I/O diversity (HTTP calls, file I/O, LLM API calls). It also passes most recommended criteria: clear CLI entry point, ~57% skip rate (within 30–60% range), diverse error handling patterns, mainstream JavaScript patterns, deterministic test suite.

The "conditional" qualifier reflects that commit-story-v2 was chosen by circumstance, not by these criteria. The 12 runs of evaluation history validate that it produces meaningful failure modes and exercises the rubric effectively. However, it should be understood as a validated-by-use target, not a criteria-derived selection.

Existing evaluation runs (run-2 through run-12) remain valid as the JavaScript eval chain history regardless of this assessment.

### Cluster Whisperer (TypeScript)

**Verdict: Conditional Pass — k8s dependency adds IS scoring complexity**

Cluster Whisperer is Whitney's Kubernetes cluster management tool. It uses TypeScript (appropriate for the TypeScript eval chain) and is expected to have sufficient file count and I/O diversity (k8s API calls, file operations, subprocess management). The mandatory criteria assessment:

- Permissive license: needs verification at implementation time
- Test suite: needs verification at implementation time
- File count: needs verification (expected to be in range)
- **Locally runnable: CONDITIONAL** — requires a running Kubernetes cluster to exercise core functionality. A Kind cluster satisfies this locally, but adds infrastructure setup to every evaluation and IS scoring run.
- Fork-and-freeze: compatible (public repo, standard npm dependencies)
- I/O diversity: expected high (k8s API, file, subprocess)

The k8s dependency is not a blocker — Kind clusters are available and the infrastructure is routine — but it adds meaningful complexity compared to locally-runnable CLI tools. The TypeScript eval chain should account for this in its setup milestones.

**Caveat:** The TypeScript language provider must merge to spiny-orb main before this can be fully evaluated. Detailed criteria verification deferred to the Type C PRD.

### k8s-vectordb-sync (Go)

**Verdict: Conditional Pass — k8s dependency adds IS scoring complexity**

k8s-vectordb-sync is Whitney's Kubernetes vector database synchronization tool. It uses Go (appropriate for the Go eval chain). The same k8s dependency concern applies as with Cluster Whisperer — core functionality requires a running cluster to exercise.

- Permissive license: needs verification at implementation time
- Test suite: needs verification at implementation time
- File count: needs verification (expected to be in range)
- **Locally runnable: CONDITIONAL** — requires a running Kubernetes cluster
- Fork-and-freeze: compatible (public repo, standard Go modules)
- I/O diversity: expected high (k8s API, vector DB operations, file I/O)

**Caveat:** The Go language provider must merge to spiny-orb main before this can be fully evaluated. Detailed criteria verification deferred to the Type C PRD.

### commitizen (Python) — RECOMMENDED

**Verdict: Pass**

commitizen (commitizen-tools/commitizen) passes all mandatory criteria and most recommended criteria:

- **Permissive license:** MIT
- **Test suite:** Yes (tests/ directory, CI pipeline, actively maintained)
- **File count:** ~45–55 Python source files (17 top-level in commitizen/ + 6 subdirectories including commands/, cz/, config/, providers/, changelog_formats/). Within the 15–50 range when counting instrumentable files (excluding __init__.py, __version__.py, and trivial utility files).
- **Locally runnable:** Yes — only requires a git repository to exercise. No external infrastructure.
- **Fork-and-freeze compatible:** Yes — standard Python dependencies, no external service requirements
- **I/O diversity:** High — git subprocess calls, file read/write (changelog, version files, config), template rendering (Jinja2), directory manipulation. At least 4 distinct I/O types.
- **Clear entry point:** CLI via `cz` / `git-cz` commands, with `__main__.py`
- **Skip-rate estimate:** ~40–50% (utility files, __init__.py, exceptions, type definitions, small config modules)
- **Error handling diversity:** Good — git command failures, file parse errors, validation exceptions, user input errors
- **Mainstream patterns:** Standard Python (Click CLI, Jinja2 templates, subprocess, pathlib)
- **Community adoption:** 3.4k stars
- **No async:** Synchronous I/O throughout. This is not a concern — Python OTel instrumentation covers synchronous I/O equally well (requests, sqlite3, subprocess, file operations).

commitizen is the strongest Python candidate identified. It has the right size, good I/O diversity, MIT license, working test suite, clear CLI entry point, and is trivially locally runnable.

**Alternative considered:** litecli (dbcli/litecli) — BSD-3, 3.2k stars, SQLite CLI with auto-completion. Viable if commitizen proves problematic, but smaller file count (~15–20) and narrower I/O diversity (primarily database operations).

---

## 3. IS Scorability Notes

IS (Instrumentation Score) scoring requires the target repo to emit OpenTelemetry spans that can be captured and evaluated against the IS spec (~9 of 20 rules apply to CLI applications). The key differentiator is whether the repo can be exercised locally or requires infrastructure.

| Candidate | Locally Runnable | IS Scoring Complexity | Notes |
|-----------|-----------------|----------------------|-------|
| **commit-story-v2** (JS) | Yes — CLI tool, runs locally | Straightforward | Execute via CLI, capture spans with OTel Collector file exporter. Clear entry point produces INTERNAL root span. |
| **Cluster Whisperer** (TS) | Conditional — requires k8s cluster | Elevated | Requires Kind cluster provisioning before each IS scoring run. OTel Collector config same as other targets, but exercise script must interact with cluster resources. |
| **k8s-vectordb-sync** (Go) | Conditional — requires k8s cluster + vector DB | Elevated | Requires Kind cluster AND vector database setup. Most complex IS scoring workflow of all candidates. |
| **commitizen** (Python) | Yes — CLI tool, needs only a git repo | Straightforward | Execute `cz bump` or `cz changelog` against a test git repo. Capture spans with OTel Collector. Clear CLI entry point. |

### Infrastructure Requirements for k8s-dependent Repos

Cluster Whisperer and k8s-vectordb-sync require infrastructure to produce any traces at all. The IS scoring workflow for these targets:

1. Provision a Kind cluster (adds ~2 minutes setup per scoring run)
2. Deploy any required resources (vector DB for k8s-vectordb-sync)
3. Configure OTel Collector with file exporter
4. Exercise the target against the live cluster
5. Capture and score the OTLP output

This is feasible — Kind clusters are routine infrastructure in this project — but it adds setup steps and failure modes that locally-runnable targets avoid. The Type C PRDs for these targets must include dedicated IS scoring setup milestones.

### Locally-Runnable Repos

commit-story-v2 and commitizen can be IS-scored with minimal setup:

1. Configure OTel Collector with file exporter (shared config)
2. Set `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` to point at the Collector
3. Run the CLI tool normally
4. Score the captured output

No infrastructure provisioning, no cluster management, no additional failure modes.
