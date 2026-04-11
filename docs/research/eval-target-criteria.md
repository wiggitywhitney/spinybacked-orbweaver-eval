# Eval Target Criteria — Language-Agnostic Scorecard and Candidate Verdicts

**Created:** 2026-04-11
**Research basis:** [eval-target-selection-research.md](eval-target-selection-research.md)
**Status:** Revised 2026-04-11 — added rubric coverage framing, auto-instrumentation criterion, TypeScript candidates, objectivity corrections

This document is the canonical reference for selecting target repositories for spiny-orb evaluation. All Type C PRDs (Setup + Run-1) must read this file before forking any target repo. The criteria are language-agnostic; the candidate verdicts are language-specific.

---

## 1. Final Criteria Scorecard

**Primary framing: rubric coverage maximization.** A good target repo is one that maximally exercises spiny-orb's 32-rule rubric. File count, I/O diversity, and skip rate are proxy filters — useful but not the ultimate measure. When evaluating a candidate, the question is: how many rubric rules can this target exercise?

**Objectivity note:** Some thresholds below were initially anchored on the existing target (commit-story-v2). The 15-50 file range was partly derived from commit-story-v2's 30 files. "Locally runnable" was initially elevated to mandatory partly because it validates existing targets. These have been revised with this awareness, but thresholds remain judgment calls.

Criteria function as **filters** (pass/fail), not weighted scores. A candidate must pass all mandatory criteria and should pass most recommended criteria.

### Mandatory Criteria

| Criterion | Evidence | Confidence | How to Evaluate |
|-----------|----------|------------|-----------------|
| **Permissive license** | Fork-and-freeze is internal evaluation, not redistribution. MIT, Apache-2.0, and BSD-3-Clause are all acceptable. | High | Check the repo's LICENSE file. Must be MIT, Apache-2.0, or BSD-3-Clause. |
| **Test suite passes** | Universal across all benchmarks. NDS-002 is a hard gate in spiny-orb's rubric. | High | Clone the repo, install dependencies, run the test suite. All tests must pass. Flaky tests are a fail. |
| **15–50 total source files** | Guideline, not hard cutoff. Anchored on limited data (commit-story-v2's 30 files + OTelBench's 300 LOC). Candidates slightly outside this range (e.g., 59 files) should be evaluated on rubric coverage merit, not rejected mechanically. | Medium | Count source files in the language's primary extension. Exclude tests, configs, and generated files. |
| **Fork-and-freeze compatible** | Universal standard across all benchmarks examined. | High | Self-contained dependencies, buildable without upstream access. |
| **I/O operation diversity (≥2 types)** | Diverse I/O types exercise more rubric rules than single-domain repos. | High | Must have at least 2 distinct I/O types: HTTP, DB, file R/W, subprocess, template rendering, etc. |

### Recommended Criteria

| Criterion | Evidence | Confidence | How to Evaluate |
|-----------|----------|------------|-----------------|
| **Rubric coverage maximization** | The real measure of target quality. Proxy metrics are useful filters but this is the goal. | High | Map the target's code patterns to the 32-rule rubric. Count which rules are exercisable. Prefer candidates that exercise more rules. |
| **Auto-instrumentation library overlap** | Tests COV-006: does the target use libraries with OTel auto-instrumentation packages? The known list is in `spinybacked-orbweaver/src/languages/javascript/ast.ts` (`KNOWN_FRAMEWORK_PACKAGES`). Python and Go providers will need language-specific equivalents. | High | Check if the target's dependencies overlap with known auto-instrumentation packages. At least one overlap exercises COV-006. |
| **Locally runnable** | IS scoring is simpler for locally-runnable targets. k8s-dependent repos require Kind cluster setup per scoring run. Not a blocker, but adds complexity. | Medium | Can the repo be exercised locally? CLI tools pass easily. k8s-dependent repos are viable but need infrastructure milestones. |
| **Clear entry point (CLI/server)** | IS scoring needs a root span from a clear entry point. | Medium | CLI command or server entry point. Pure libraries need a custom exercise harness. |
| **Skip-rate balance (30–60% non-instrumentable)** | A mix of instrumentable and skippable files tests RST judgment. | Medium | Estimate percentage of files without I/O operations. Target 30–60%. |
| **Error handling pattern diversity** | Multiple error patterns exercise CDQ-003. | High | Look for diverse error handling: try/catch variants, retry logic, custom exceptions, error propagation. |
| **Mainstream language patterns** | Exotic patterns test model knowledge, not instrumentation quality. | Medium | Standard library imports and common frameworks preferred. |
| **Deterministic reproducibility** | Flaky tests undermine eval reliability. | High | Run test suite 3 times. Any non-deterministic failure is a fail. |
| **Community adoption (>500 stars)** | Correlates with maintenance quality. | Medium | >500 preferred. |
| **Not already instrumented** | Existing OTel instrumentation must be stripped for a clean baseline. | Medium | Check for existing `@opentelemetry` imports or tracing setup. If present, stripping adds setup work to the Type C PRD. |
| **Different GitHub handles across candidates** | If all 3 candidates for a language come from the same author/org, they share coding style and dependency choices — reducing rubric rule diversity. | Medium | Prefer candidates from different GitHub authors/organizations. Not a hard rule, but a tiebreaker when candidates are otherwise equal. |

### Eval Design: Deliberately Incomplete Weaver Schemas

When creating the initial `semconv/` schema for a target repo, deliberately omit some spans and attributes that a human would include. This tests whether spiny-orb can identify missing attributes, propose them, and add them to the schema extensions file. A complete schema tests SCH compliance; an incomplete schema tests SCH *extension capability*. The Type C PRD for each target should document exactly which spans/attributes were omitted so the eval can verify whether spiny-orb surfaces them.

---

## 2. Candidate Verdicts

### commit-story-v2 (JavaScript)

**Verdict: Conditional Pass**

commit-story-v2 passes all mandatory criteria: MIT license, test suite passes, ~30 JS source files, locally runnable (CLI tool), fork-and-freeze compatible, good I/O diversity (HTTP calls, file I/O, LLM API calls). It also passes most recommended criteria: clear CLI entry point, ~57% skip rate (within 30–60% range), diverse error handling patterns, mainstream JavaScript patterns, deterministic test suite.

The "conditional" qualifier reflects that commit-story-v2 was chosen by circumstance, not by these criteria. The 12 runs of evaluation history validate that it produces meaningful failure modes and exercises the rubric effectively. However, it should be understood as a validated-by-use target, not a criteria-derived selection.

Existing evaluation runs (run-2 through run-12) remain valid as the JavaScript eval chain history regardless of this assessment.

### taze (TypeScript) — RECOMMENDED

**Verdict: Pass**

taze (antfu-collective/taze) is a CLI tool that checks npm dependencies for newer versions. MIT license, 4.1k stars, 32 TypeScript source files. Three I/O types: HTTP (npm registry queries via ofetch), file R/W (package.json, lockfiles, yaml), subprocess (package manager commands via tinyexec). 17 vitest test files, clear CLI entry point, ~40% skip rate (utility/type files). Locally runnable — only needs npm registry access. Auto-instrumentation overlap: ofetch uses undici under the hood in Node.js, which is in the `KNOWN_FRAMEWORK_PACKAGES` list — exercises COV-006.

### Cluster Whisperer (TypeScript) — CONDITIONAL PASS

**Verdict: Conditional Pass — k8s dependency, already instrumented, 59 files**

Cluster Whisperer is Whitney's Kubernetes cluster management tool. 59 .ts source files (above 50-file guideline but close). MIT license declared in package.json but LICENSE file missing from repo root. Already instrumented with OTel — a frozen eval copy would need existing instrumentation stripped. 58 vitest test files. 5+ I/O types (k8s API, file, subprocess, HTTP to vector DBs, LLM API). Requires running k8s cluster for core paths. Scoping to ~33 files (pipeline + tools + utils) is feasible.

**Caveats:** Already instrumented (stripping needed). Missing LICENSE file. k8s dependency for IS scoring. TypeScript provider must merge to spiny-orb main first.

### k8s-vectordb-sync (Go)

**Verdict: Conditional Pass — k8s dependency adds IS scoring complexity**

k8s-vectordb-sync is Whitney's Kubernetes vector database synchronization tool. It uses Go (appropriate for the Go eval chain). The same k8s dependency concern applies as with Cluster Whisperer — core functionality requires a running cluster to exercise.

- Permissive license: needs verification at implementation time
- Test suite: needs verification at implementation time
- File count: needs verification (expected to be in range)
- **Locally runnable: CONDITIONAL** — requires a running Kubernetes cluster
- Fork-and-freeze: compatible (public repo, standard Go modules)
- I/O diversity: expected high (k8s API, vector DB operations, file I/O)

**Caveats:** May already be instrumented (verify before selecting). Go language provider must merge to spiny-orb main first. Detailed criteria verification deferred to the Type C PRD.

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
| **taze** (TS) | Yes — CLI tool, runs locally | Straightforward | Execute `taze` against a test project. Capture spans with OTel Collector. Clear CLI entry point. |
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
