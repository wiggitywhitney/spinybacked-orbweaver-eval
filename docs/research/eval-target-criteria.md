# Eval Target Criteria — Language-Agnostic Scorecard and Candidate Verdicts

**Created:** 2026-04-11
**Research basis:** [eval-target-selection-research.md](eval-target-selection-research.md)
**Status:** Revised 2026-04-11 (second revision) — rubric-coverage-first scorecard with rule-to-target mapping; 12 candidates (3 per language) evaluated fresh against rubric

This document is the canonical reference for selecting target repositories for spiny-orb evaluation. All Type C PRDs (Setup + Run-1) must read this file before forking any target repo. The criteria are language-agnostic; the candidate verdicts are language-specific.

The prior candidates in this document were chosen using proxy metrics (file count, I/O diversity) before the rubric table existed. **This revision evaluates all candidates fresh against the rubric-coverage scorecard.** No prior candidate is assumed correct.

---

## 1. Rubric-Coverage Scorecard

**Primary framing: rubric coverage maximization.** A good target repo is one that maximally exercises spiny-orb's 32-rule rubric. File count and I/O diversity are filters, not goals — they are useful because they correlate with rubric coverage, not because they matter intrinsically.

### Pass/Fail Filters

Candidates must pass ALL mandatory filters before rubric assessment.

| Criterion | Type | How to Evaluate |
|-----------|------|-----------------|
| Permissive license (MIT / Apache-2.0 / BSD-3-Clause) | Mandatory | Check LICENSE file. ISC and other licenses are not on the list. |
| Test suite passes (all tests, 3× for reproducibility) | Mandatory | Clone, install, run test suite 3 times. Any flaky test = fail. |
| ≥ 2 distinct I/O types | Mandatory | Must have at least 2 of: HTTP, DB, file R/W, subprocess, template rendering, socket, etc. |
| Fork-and-freeze compatible | Mandatory | Self-contained dependencies, buildable without upstream access. |
| 30 source files or fewer (ideal) | Guideline | Count source files in the primary language extension, excluding tests/configs/generated files. Above 30 is acceptable only if extra rubric coverage justifies the longer runtime (~40 min for 30 files in practice; adjust proportionally). |

### Rule-to-Target Mapping

The table below maps each of the 32 code-level rubric rules to what a target repo needs for that rule to fire. Rules marked **(U) Universal** are met by any typical project — they pass or fail based on agent behavior, not target structure. Rules marked **(D) Differentiating** are where candidate characteristics affect how well the rule exercises the agent.

**Universal rules — all projects satisfy the precondition; no per-rule entry needed:**
NDS-001 (compilation), NDS-003 (non-instrumentation lines unchanged), API-001 (only api imports), API-002 (correct dependency declaration), API-003 (no vendor SDKs), API-004 (no SDK-internal imports), NDS-006 (module system consistency), CDQ-002 (tracer acquired correctly — fires on every instrumented file).

| Rule | Type | What the target needs | Key differentiator |
|------|------|-----------------------|--------------------|
| **NDS-002** Tests pass | D | A passing test suite. Hard gate — no suite = behavioral verification absent (vacuous pass). Run 3× for deterministic reproducibility check. | Flaky tests disqualify. No suite = NDS-005 evidence absent. |
| **NDS-004** Public API preserved | D | Exported functions. More interesting with a rich export surface (utility modules, library-style packages). | More exports = more verification surface. |
| **NDS-005a** Error handling structure | D | Pre-existing `try/catch/finally` blocks with complex propagation: nested catch, rethrow patterns, error chaining. | Targets with diverse error handling test whether the agent restructures or wraps correctly. |
| **NDS-005b** Expected-condition recording | D | "Silent catch" blocks — catch blocks that return defaults or fallback values without rethrowing. Agent may incorrectly record these as errors. | Targets with graceful fallback patterns generate this signal. |
| **COV-001** Entry points have spans | D | Clear entry points: CLI command handlers, HTTP route handlers, or server request handlers. | CLI tools have 1–3 entry points. More diverse commands = more COV-001 instances. |
| **COV-002** Outbound calls have spans | D | Calls to HTTP clients, DB drivers, subprocess (exec/spawn), async file I/O, template rendering. More I/O types → more instances to evaluate. | More distinct outbound call types exercises this rule more thoroughly. |
| **COV-003** Failable ops have error visibility | D | I/O operations inside existing `try/catch` blocks. Fires at intersection of outbound calls AND existing error handling. | Targets with error-guarded I/O operations provide more instances. |
| **COV-004** Long-running/async ops | D | `async` functions with `await` (JS/TS), synchronous I/O calls in Python (`requests`, `subprocess`, `os.path`), external calls in Go. | More async/I/O functions = more instances. |
| **COV-005** Domain-specific attributes | D | A Weaver `semconv/` schema defining expected span attributes for the domain. Target must have enough semantic richness to justify non-trivial attribute definitions. | Targets with domain concepts (not just generic file I/O) support richer schemas. |
| **COV-006** Auto-instrumentation preferred | D | **At least one dependency from the OTel auto-instrumentation ecosystem.** JS/TS: `KNOWN_FRAMEWORK_PACKAGES` in `spinybacked-orbweaver/src/languages/javascript/ast.ts` (pg, mysql, mongodb, redis, express, fastify, koa, axios, got, node-fetch, undici, @grpc/grpc-js, amqplib, kafkajs, graphql, @apollo/server, knex, sequelize, typeorm, @prisma/client). Python: check against [OTel Python contrib](https://github.com/open-telemetry/opentelemetry-python-contrib/tree/main/instrumentation) (includes click, jinja2, redis, pymysql, requests, flask, django, sqlalchemy, psycopg2, etc.). Go: check against [OTel Go contrib](https://github.com/open-telemetry/opentelemetry-go-contrib/tree/main/instrumentation) (net/http via otelhttp, grpc via otelgrpc, mongo via otelmongo). Zero overlap = COV-006 cannot fire at all. | **Key differentiator.** Many candidates have no overlap and permanently skip this rule. |
| **RST-001** No utility spans | D | Files with functions containing no I/O: pure formatters, type helpers, constants, type definitions. These should NOT be instrumented — the rule fires when the agent wrongly instruments them. | Skip-rate balance (30–60% non-instrumentable files) is a proxy for this. |
| **RST-002** No accessor spans | D | Classes or objects with getter/setter methods or trivial single-statement property accessors. | Config classes, data models, settings objects. Less common in functional-style codebases. |
| **RST-003** No thin-wrapper spans | D | Functions whose entire body is a single `return` calling another function (delegation/proxy). | Layered architectures, adapter layers, factory functions. |
| **RST-004** No internal impl spans | D | Unexported (private) functions with no I/O operations. Note: unexported functions WITH I/O are exempt from this rule. | More unexported pure helpers = more RST-004 surface. |
| **RST-005** No re-instrumentation | D | Pre-existing OTel span creation in source (`startActiveSpan`, `startSpan`, `tracer.*` calls). **Passes vacuously for all clean targets — zero diagnostic signal.** Repos with prior OTel require stripping and degenerate this rule. | **Select repos without existing OTel instrumentation.** |
| **SCH-001** Span names match registry | D | A Weaver `semconv/` directory with operation names defined. Without registry, falls back to naming quality judgment (semi-automatable). | Deliberately incomplete schema: omitting operations tests whether agent invents appropriate fallback names. |
| **SCH-002** Attribute keys match registry | D | A Weaver `semconv/` with named attribute definitions. **Most affected by deliberately incomplete schema design.** | Omitting attributes tests whether agent proposes sensible keys. |
| **SCH-003** Attribute values conform to types | D | A Weaver `semconv/` with typed or enum attribute constraints. Most diagnostic when schema defines enum attributes. | Targets with categorical domain concepts support enum attributes. |
| **SCH-004** No redundant schema entries | D | A Weaver `semconv/` rich enough that naming duplication risk is real. | More schema richness = more opportunity for agent to invent duplicates. |
| **CDQ-001** Spans closed in all paths | D | Functions with multiple execution paths: early returns, exception handlers, conditional branches where `span.end()` must fire in all branches. | Targets with complex control flow exercise this more. |
| **CDQ-003** Standard error recording | D | `try/catch` blocks the agent instruments. Tests whether agent uses `span.recordException(error) + span.setStatus({code: SpanStatusCode.ERROR})` vs ad-hoc `span.setAttribute('error', ...)`. **Diversity of error types increases diagnostic value.** | Targets with diverse error categories (network, parse, validation, subprocess) test correctness across more scenarios. |
| **CDQ-005** Async context maintained | D | Async functions where agent uses manual `startSpan()` pattern (requires `context.with()` wrapper). Primarily JS/TS. | More async functions = more CDQ-005 instances. |
| **CDQ-006** Expensive attribute guarding | D | `setAttribute` calls computing complex values: `JSON.stringify`, array `.map`/`.reduce`/`.join`, object serialization. | Targets that serialize domain objects or compute aggregates for attributes. |
| **CDQ-007** No PII/unbounded attributes | D | Code handling user-supplied data, request parameters, optional fields, or potentially sensitive values. | CLI tools accepting user path args; tools handling API responses with optional fields. |
| **CDQ-008** Consistent tracer naming | D | 3+ source files that get instrumented. Tests whether agent uses consistent `getTracer()` naming convention across files. | More instrumented files = more cross-file naming consistency instances. |

### Eval Design: Deliberately Incomplete Weaver Schemas

When creating the initial `semconv/` schema for any eval target, deliberately omit some spans and attributes that a human would include. This tests whether spiny-orb identifies missing attributes and proposes schema extensions (SCH extension capability). The Type C PRD for each target must document exactly which spans/attributes were omitted and why — so the eval can verify whether spiny-orb surfaces them.

A complete schema only tests SCH compliance. An incomplete schema tests SCH *extension capability*, which is a harder and more valuable signal.

---

## 2. Candidate Shortlists

### 2.1 JavaScript (3 candidates)

**Note:** commit-story-v2 exercises COV-006 via Traceloop auto-instrumentation — `@langchain/*` maps to `@traceloop/instrumentation-langchain` and `@modelcontextprotocol/sdk` maps to `@traceloop/instrumentation-mcp`. These are in the Traceloop mapping table in `javascript/prompt.ts`, not in `KNOWN_FRAMEWORK_PACKAGES`. COV-006 has fired on `journal-graph.js`, `summary-graph.js`, and `mcp/server.js` in run-13.

### Rule Coverage Comparison — JavaScript

**Key:** ✓ confirmed fires (research-verified this session) · ✗ cannot fire · ≈ eval-design dependent · 🔍 needs local verification when cloning

The 8 universal rules (NDS-001, NDS-003, API-001–004, NDS-006, CDQ-002) are excluded — they apply to all candidates equally. SCH rules (≈) depend entirely on the Weaver schema created in eval and are identical for all candidates. RST-005 passes vacuously for all (clean baselines, no pre-existing OTel) — listed ✓ but not a meaningful diagnostic.

| Rule | commit-story-v2 | release-it | npm-check |
|------|-----------------|------------|-----------|
| NDS-002 Tests pass | ✓ confirmed (12 runs) | ✓ vitest | ✓ |
| NDS-004 Public API preserved | ✓ | ✓ Plugin exports | ✓ |
| NDS-005a Error handling structure | ✓ LLM API chain | ✓ HTTP+git errors | ✓ npm errors |
| NDS-005b Silent catch preserved | ✓ LangGraph fallbacks | ✓ dry-run graceful | 🔍 |
| COV-001 Entry points | ✓ CLI summarize cmds | ✓ release lifecycle | ✓ interactive+static |
| COV-002 Outbound calls | ✓ HTTP+file+git (3 types) | ✓ HTTP+git+file (3 types) | ✓ HTTP+npm+file (3 types) |
| COV-003 Failable ops | ✓ | ✓ | ✓ |
| COV-004 Long-running/async | ✓ async throughout | ✓ async throughout | ✓ async |
| COV-005 Domain-specific attrs | ≈ | ≈ | ≈ |
| **COV-006 Auto-instr preferred** | **✓ Traceloop (langchain+MCP)** | **✓ undici (in KFP)** | **✗ no overlap** |
| RST-001 No utility spans | ✓ 57% skip confirmed | ✓ log/spinner/util/prompt | ✓ in/out/state split |
| RST-002 No accessor spans | 🔍 | 🔍 | 🔍 |
| RST-003 No thin-wrapper spans | 🔍 | 🔍 | 🔍 |
| RST-004 No internal spans | ✓ | ✓ | ✓ |
| RST-005 No re-instrumentation | ✓ vacuous | ✓ vacuous | ✓ vacuous |
| SCH-001 Span names match registry | ≈ | ≈ | ≈ |
| SCH-002 Attr keys match registry | ≈ | ≈ | ≈ |
| SCH-003 Attr values conform | ≈ | ≈ | ≈ |
| SCH-004 No redundant entries | ≈ | ≈ | ≈ |
| CDQ-001 Spans closed all paths | ✓ LangGraph async | ✓ plugin lifecycle | ✓ |
| CDQ-003 Standard error recording | ✓ LLM API errors | ✓ HTTP+git errors | ✓ npm errors |
| CDQ-005 Async context maintained | ✓ LangGraph chain | ✓ plugin chain | ✓ |
| CDQ-006 Expensive attr guarding | 🔍 | 🔍 | 🔍 |
| CDQ-007 No PII/unbounded attrs | ✓ git msgs, paths | ✓ tokens, paths | ✓ pkg names, paths |
| CDQ-008 Consistent tracer naming | ✓ 30 files | ✓ 23 files | ✓ 18 files |
| **Confirmed ✓ (of 24 D-rules)** | **17** | **17** | **15** |
| **Cannot fire ✗** | **0** | **0** | **1** |
| **Needs verify 🔍** | **3** | **3** | **4** |
| **Eval-design ≈** | **5** | **5** | **5** |

**Total exercisable (✓ + 8 universal):** commit-story-v2 = 25 · release-it = 25 · npm-check = 23

---

#### commit-story-v2 (wiggitywhitney/commit-story-v2)

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | ~100 (private/personal project) |
| Source files | ~30 JS files |
| I/O types | HTTP (Anthropic/LangChain API calls), file R/W (git history, journal entries), subprocess (git) |
| KFP overlap | **Traceloop** ✓ — `@langchain/*` → `@traceloop/instrumentation-langchain`; `@modelcontextprotocol/sdk` → `@traceloop/instrumentation-mcp`. Detection is via the Traceloop mapping table in `javascript/prompt.ts`, separate from `KNOWN_FRAMEWORK_PACKAGES`. |
| Existing OTel | None (clean baseline; spiny-orb adds it during eval) |

**Rubric coverage notes:**
- COV-006: ✓ **fires** — via Traceloop mapping in `javascript/prompt.ts`. `@langchain/*` → `@traceloop/instrumentation-langchain` (fires on `journal-graph.js`, `summary-graph.js`); `@modelcontextprotocol/sdk` → `@traceloop/instrumentation-mcp` (fires on `mcp/server.js`). Confirmed in run-13 PR.
- COV-001: ✓ clear CLI entry point
- COV-002: ✓ HTTP (LangChain API), file I/O, subprocess
- RST-001: ✓ ~57% skip rate confirmed across 12 runs
- CDQ-003: ✓ error handling in LLM API calls
- SCH-*: ✓ 12 runs of schema history; deliberately incomplete schema strategy can be applied

**Summary:** 12 runs of eval history validate this target produces meaningful failure modes. COV-006 fires via Traceloop (langchain + MCP). It was not selected via criteria — it was chosen by circumstance. Evaluate honestly in milestone 0 against the other 2 JS candidates.

---

#### release-it (release-it/release-it)

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | 8.9k |
| Source files | 23 JS files in `lib/` |
| I/O types | HTTP (GitHub/GitLab release API via undici), subprocess (git), file (package.json, changelog) |
| KFP overlap | **`undici`** ✓ — direct dependency in package.json |
| Existing OTel | None confirmed |

**Rubric coverage notes:**
- COV-006: ✓ **fires** — uses `undici` directly for GitHub API calls
- COV-001: ✓ CLI entry point (`release-it` command with lifecycle phases)
- COV-002: ✓ HTTP (GitHub/GitLab API), subprocess (git commit/tag/push), file (package.json versioning)
- NDS-005: ✓ HTTP error handling (retry on rate limits, auth failures), subprocess error handling
- CDQ-003: ✓ diverse error patterns (network errors, auth errors, subprocess failures, file parse errors)
- RST-001: ✓ utility files (log.js, spinner.js, util.js, prompt.js)
- SCH domain: Release lifecycle events (`release.create`, `github.release`, `npm.publish`) — rich schema potential

**Summary:** Strongest JS candidate on rubric coverage. Only candidate exercising COV-006. Different domain (release automation) from commit-story-v2 (LLM content generation) — adds diversity. 23 files is ideal runtime.

---

#### npm-check (dylang/npm-check)

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | 6.6k |
| Source files | 18 JS files in `lib/` (split into `in/`, `out/`, `state/` modules) |
| I/O types | HTTP (npm registry via `package-json` npm library), subprocess (npm install), file (package.json, node_modules) |
| KFP overlap | **None directly** — uses `package-json` npm lib which wraps npm-registry-fetch, not a KFP entry |
| Existing OTel | None confirmed |

**Rubric coverage notes:**
- COV-006: **Cannot fire** — no direct KFP import. `package-json` is not in KNOWN_FRAMEWORK_PACKAGES.
- COV-001: ✓ CLI entry point
- COV-002: ✓ HTTP (via package-json), subprocess (npm install), file (package.json scanning, node_modules)
- RST-001: ✓ modular structure (out/emoji.js, state/debug.js are pure utility files)
- CDQ-003: ✓ registry fetch failures, npm install errors
- NDS-005: ✓ registry timeout handling, npm command failure handling

**Summary:** Good structural diversity (18 files, clear in/out/state separation good for RST-001 testing) and 3 I/O types. Lacks COV-006 like commit-story-v2. Third-choice backup if milestone 0 determines commit-story-v2 should be replaced but release-it has unexpected issues.

---

### 2.2 TypeScript (3 candidates)

**Key finding from rubric assessment:** `ofetch` (used by taze) is not in KNOWN_FRAMEWORK_PACKAGES. COV-006 testability for the TS candidates depends on whether the TS Type C PRD's "add auto-instrumentation libraries" milestone adds ofetch to KNOWN_FRAMEWORK_PACKAGES.

### Rule Coverage Comparison — TypeScript

**Key:** ✓ confirmed fires · ✗ cannot fire · ≈ eval-design dependent · 🔍 needs local verification or conditional on a later milestone

| Rule | taze | changesets | wireit |
|------|------|------------|--------|
| NDS-002 Tests pass | ✓ vitest (17 test files) | ✓ | ✓ |
| NDS-004 Public API preserved | ✓ | ✓ | ✓ |
| NDS-005a Error handling structure | ✓ HTTP+file errors | ✓ git+file errors | ✓ subprocess+file errors |
| NDS-005b Silent catch preserved | 🔍 | 🔍 | 🔍 |
| COV-001 Entry points | ✓ check/list/interactive | ✓ add/version/publish/status | ✓ npx wireit |
| COV-002 Outbound calls | ✓ HTTP+file+subprocess | ✓ subprocess+file+terminal | ✓ subprocess+file+filewatcher |
| COV-003 Failable ops | ✓ | ✓ | ✓ |
| COV-004 Long-running/async | ✓ concurrent lookups | ✓ async commands | ✓ async event-driven |
| COV-005 Domain-specific attrs | ≈ | ≈ | ≈ |
| **COV-006 Auto-instr preferred** | **🔍 ofetch→undici (if added to KFP)** | **✗ no overlap** | **✗ no overlap** |
| RST-001 No utility spans | ✓ ~40% utility files | ✓ types.ts, utils/types.ts | ✓ 62 files many utility |
| RST-002 No accessor spans | 🔍 | 🔍 | 🔍 |
| RST-003 No thin-wrapper spans | 🔍 | 🔍 | 🔍 |
| RST-004 No internal spans | ✓ | ✓ | ✓ |
| RST-005 No re-instrumentation | ✓ vacuous | ✓ vacuous | ✓ vacuous |
| SCH-001 Span names match registry | ≈ | ≈ | ≈ |
| SCH-002 Attr keys match registry | ≈ | ≈ | ≈ |
| SCH-003 Attr values conform | ≈ | ≈ | ≈ |
| SCH-004 No redundant entries | ≈ | ≈ | ≈ |
| CDQ-001 Spans closed all paths | ✓ concurrent async | ✓ async commands | ✓ async event loop |
| CDQ-003 Standard error recording | ✓ HTTP+file errors | ✓ git+npm errors | ✓ subprocess+cache errors |
| CDQ-005 Async context maintained | ✓ | ✓ | ✓ |
| CDQ-006 Expensive attr guarding | 🔍 | 🔍 | 🔍 |
| CDQ-007 No PII/unbounded attrs | ✓ pkg names, paths | ✓ pkg names, changelog | ✓ file paths, script names |
| CDQ-008 Consistent tracer naming | ✓ 33 files | ✓ 25 files | ✓ 62 files |
| **Confirmed ✓ (of 24 D-rules)** | **15** | **15** | **15** |
| **Cannot fire ✗** | **0** | **2** | **2** |
| **Needs verify / conditional 🔍** | **5 (incl. COV-006)** | **4** | **4** |
| **Eval-design ≈** | **5** | **5** | **5** |

**Total exercisable (✓ + 8 universal):** taze = 23 (+ COV-006 if KFP updated) · changesets = 23 · wireit = 23

---

#### taze (antfu-collective/taze)

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | 4.1k |
| Source files | 33 TypeScript files in `src/` |
| I/O types | HTTP (npm registry + JSR via ofetch), file R/W (package.json, yaml, lockfiles, cache), subprocess (package manager commands via tinyexec) |
| KFP overlap | **Conditional** — uses `ofetch` which is not in KNOWN_FRAMEWORK_PACKAGES. `ofetch` uses Node 18+ native fetch (backed by undici). If `ofetch` is added to KFP during the "add auto-instrumentation libraries" milestone, COV-006 fires. |
| Existing OTel | None |

**Rubric coverage notes:**
- COV-006: **Conditional** — fires only after KNOWN_FRAMEWORK_PACKAGES is updated to include `ofetch` (justified: `@opentelemetry/instrumentation-undici` instruments calls made through ofetch in Node 18+)
- COV-001: ✓ `check`, `list`, `interactive` CLI commands
- COV-002: ✓ HTTP (npm/JSR registry), file (package.json, yaml, lockfiles), subprocess (package managers)
- COV-004: ✓ async package resolution, concurrent registry lookups
- NDS-005: ✓ HTTP error handling, registry timeout, file parse errors
- RST-001: ✓ ~40% utility/type files (constants.ts, types.ts, config.ts, util/ modules)
- CDQ-003: ✓ registry fetch errors, file parse errors, subprocess failures
- SCH domain: Dependency version management (`dependency.name`, `dependency.current_version`, `dependency.latest_version`, `registry.name`)

**Summary:** 33 files (just above 30 ideal; justified by good rubric coverage). HTTP + file + subprocess diversity. COV-006 is conditional on KFP update but achievable. Strongest TS candidate if KFP is updated.

---

#### @changesets/cli (changesets/changesets)

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | 11.6k (monorepo; cli package is widely used) |
| Source files | 25 TypeScript files in `packages/cli/src/` (excluding test files) |
| I/O types | Subprocess (git, npm/yarn/pnpm via spawndamnit), file R/W (CHANGELOG.md, .changeset/ files, package.json versioning), terminal (interactive prompts via enquirer) |
| KFP overlap | **None** — no HTTP client; uses spawndamnit (subprocess) and fs-extra (file). No KFP entry. |
| Existing OTel | None confirmed |

**Rubric coverage notes:**
- COV-006: **Cannot fire** — no KFP imports.
- COV-001: ✓ CLI commands (add, version, publish, status, etc.)
- COV-002: ✓ subprocess (git, package manager), file (changelogs, package.json, .changeset files)
- RST-001: ✓ utility files (types.ts, utils/createPromiseQueue.ts, utils/types.ts)
- CDQ-003: ✓ git failures, npm/yarn publish errors, file parse errors
- NDS-005: ✓ subprocess failure handling, file write errors
- SCH domain: Changelog/release management (`changeset.type`, `package.name`, `release.type`) — reasonable schema potential

**Summary:** 25 files (well within ideal). Strong on subprocess and file I/O. Lacks COV-006 permanently. Different org from taze (antfu-collective vs changesets) — good candidate diversity. Recommended second choice.

---

#### wireit (google/wireit)

| Attribute | Value |
|-----------|-------|
| License | Apache-2.0 |
| Stars | 6.4k |
| Source files | 62 TypeScript files in `src/` |
| I/O types | File R/W (cache files, lockfiles, fingerprints), subprocess (npm scripts), file watching (chokidar) |
| KFP overlap | **None** — no HTTP client. Uses chokidar (file watching) and child_process (subprocess). |
| Existing OTel | None confirmed |

**Rubric coverage notes:**
- COV-006: **Cannot fire** — no KFP imports.
- COV-001: ✓ `npx wireit` entry point
- COV-002: ✓ subprocess (npm scripts), file (cache, lockfiles)
- RST-001: ✓ 62 files means more utility/config files to correctly skip — strong RST-001 exercise
- CDQ-003: ✓ subprocess failures, file system errors, cache invalidation errors
- File watching (chokidar) is a unique I/O type not present in taze or changesets

**Caveat:** 62 files is substantially above the 30-file ideal. Estimated runtime: ~80 minutes per eval run. This is a real cost. Only choose wireit in milestone 0 if the extra file count exercises significantly more rubric rules than taze or changesets — specifically, if RST-001 diversity across many file types justifies the runtime.

**Summary:** Backup candidate. Good rubric coverage for RST-001 (many utility files to skip). From Google (different org, different coding conventions from antfu-collective and changesets). 62-file runtime penalty is significant.

---

### 2.3 Python (3 candidates)

**OTel Python contrib instruments used in assessment:** click, jinja2, redis, pymysql (check [opentelemetry-python-contrib](https://github.com/open-telemetry/opentelemetry-python-contrib/tree/main/instrumentation) for full list of 50+ instruments).

### Rule Coverage Comparison — Python

**Key:** ✓ confirmed fires · ✗ cannot fire · ≈ eval-design dependent · 🔍 needs local verification

| Rule | mycli | iredis | commitizen |
|------|-------|--------|------------|
| NDS-002 Tests pass | ✓ | ✓ pytest | ✓ pytest |
| NDS-004 Public API preserved | ✓ | ✓ | ✓ |
| NDS-005a Error handling structure | ✓ DB+config errors | ✓ Redis+config errors | ✓ git+version+config errors |
| NDS-005b Silent catch preserved | 🔍 | 🔍 | ✓ fallbacks in bump/changelog |
| COV-001 Entry points | ✓ mycli CLI | ✓ iredis CLI | ✓ cz bump/changelog/commit |
| COV-002 Outbound calls | ✓ DB+file+terminal | ✓ Redis+file+terminal | ✓ subprocess+file+template |
| COV-003 Failable ops | ✓ | ✓ | ✓ |
| COV-004 Long-running/async | ✓ prompt_toolkit async | ✓ prompt_toolkit async | ✓ I/O throughout |
| COV-005 Domain-specific attrs | ≈ | ≈ | ≈ |
| **COV-006 Auto-instr preferred** | **✓ PyMySQL** | **✓ redis + click (2 overlaps)** | **✓ jinja2** |
| RST-001 No utility spans | ✓ constants/lexer/style | ✓ renders/style/lexer/warning | ✓ 51 files many utility |
| RST-002 No accessor spans | 🔍 | 🔍 | 🔍 |
| RST-003 No thin-wrapper spans | 🔍 | 🔍 | 🔍 |
| RST-004 No internal spans | ✓ | ✓ | ✓ |
| RST-005 No re-instrumentation | ✓ vacuous | ✓ vacuous | ✓ vacuous |
| SCH-001 Span names match registry | ≈ | ≈ | ≈ |
| SCH-002 Attr keys match registry | ≈ | ≈ | ≈ |
| SCH-003 Attr values conform | ≈ | ≈ | ≈ |
| SCH-004 No redundant entries | ≈ | ≈ | ≈ |
| CDQ-001 Spans closed all paths | ✓ DB with branches | ✓ Redis with branches | ✓ commands with branches |
| CDQ-003 Standard error recording | ✓ DB+auth+config | ✓ Redis+auth+cmd | ✓ git+version+file |
| CDQ-005 Async context maintained | ✓ | ✓ | ✓ |
| CDQ-006 Expensive attr guarding | 🔍 | 🔍 | 🔍 |
| CDQ-007 No PII/unbounded attrs | ✓ queries, conn strings | ✓ Redis keys, conn strings | ✓ commit msgs, version strings |
| CDQ-008 Consistent tracer naming | ✓ 15 files | ✓ 17 files | ✓ 51 files |
| **Confirmed ✓ (of 24 D-rules)** | **16** | **16** | **17** |
| **Cannot fire ✗** | **0** | **0** | **0** |
| **Needs verify 🔍** | **4** | **4** | **3** |
| **Eval-design ≈** | **5** | **5** | **5** |

**Total exercisable (✓ + 8 universal):** mycli = 24 · iredis = 24 (strongest: 2 COV-006 overlaps) · commitizen = 25

---

#### mycli (dbcli/mycli)

| Attribute | Value |
|-----------|-------|
| License | BSD-3-Clause |
| Stars | 11.9k |
| Source files | 15 Python files in `mycli/` |
| I/O types | Database (MySQL via PyMySQL), file R/W (config `~/.myclirc`, query logs, password keyring), terminal (interactive prompt, auto-completion) |
| KFP overlap | **`PyMySQL`** ✓ — `opentelemetry-instrumentation-pymysql` exists in OTel Python contrib |
| Existing OTel | None confirmed |

**Rubric coverage notes:**
- COV-006: ✓ **fires** — PyMySQL is in OTel Python contrib
- COV-001: ✓ `mycli` CLI entry point
- COV-002: ✓ MySQL DB operations, file I/O (config, logs), terminal
- NDS-005: ✓ MySQL connection failures, query errors, config parse errors
- CDQ-003: ✓ DB connection errors, query execution errors, auth failures
- RST-001: ✓ utility files (constants.py, lexer.py, style.py, clistyle.py)
- SCH domain: Database query lifecycle (`db.query.text`, `db.operation.name`, `db.system.name`) — maps directly to OTel semantic conventions

**Summary:** Strongest Python candidate. Smallest file count (15 files = ~20 min), strongest COV-006 signal (database instrumentation is a primary OTel use case), richest semantic schema potential. Recommended first choice.

---

#### iredis (laixintao/iredis)

| Attribute | Value |
|-----------|-------|
| License | BSD-3-Clause |
| Stars | 2.7k |
| Source files | 17 Python files in `iredis/` |
| I/O types | Network (Redis TCP/IP connections), file R/W (config `~/.iredisrc`, log `~/.iredis.log`), terminal (interactive CLI, autocomplete) |
| KFP overlap | **`redis`** ✓ (`opentelemetry-instrumentation-redis`) AND **`click`** ✓ (`opentelemetry-instrumentation-click`) — two OTel Python contrib matches |
| Existing OTel | None confirmed |

**Rubric coverage notes:**
- COV-006: ✓ **fires** — redis-py AND click are both in OTel Python contrib (2 overlap points, more diverse than mycli's single driver)
- COV-001: ✓ CLI entry point
- COV-002: ✓ Redis TCP operations, file I/O (config, logs), terminal
- NDS-005: ✓ Redis connection failures, command errors, config parse errors
- CDQ-003: ✓ Redis command errors, connection timeouts, auth failures
- RST-001: ✓ utility files (renders.py, style.py, lexer.py, warning.py)
- SCH domain: Redis command operations (`redis.command`, `redis.key`, `redis.database.index`) — rich domain-specific schema potential

**Summary:** 17 files (~23 min runtime). Two OTel Python contrib overlaps (redis + click). Different domain from mycli (key-value vs relational). Recommended second choice. Lower star count than mycli (2.7k vs 11.9k) but meets 500+ threshold.

---

#### commitizen (commitizen-tools/commitizen)

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | 3.4k |
| Source files | 51 Python files in `commitizen/` (excluding `__init__.py` and non-Python files) |
| I/O types | Subprocess (git commands via Python subprocess), file R/W (changelog, version files, config files), template rendering (Jinja2) |
| KFP overlap | **`jinja2`** ✓ (`opentelemetry-instrumentation-jinja2`) — template rendering is instrumented |
| Existing OTel | None confirmed |

**Rubric coverage notes:**
- COV-006: ✓ **fires** — jinja2 is in OTel Python contrib (template rendering instrumentation)
- COV-001: ✓ `cz` CLI with multiple commands (bump, changelog, commit, check)
- COV-002: ✓ subprocess (git), file (changelog, version files, .commitizen.yaml), template rendering
- RST-001: ✓ many utility/provider files to skip (9 providers, 5 changelog formats, 4 config parsers)
- CDQ-003: ✓ git failures, file write errors, config parse errors, version scheme errors
- SCH domain: Commit lifecycle and versioning (`commit.type`, `version.current`, `version.new`, `tag.name`)

**Caveat:** 51 files is significantly above the 30-file ideal. Estimated runtime: ~68 minutes per eval run. Jinja2 is a weaker COV-006 signal than database or Redis drivers (template rendering is less central to OTel than I/O boundaries). Choose only if mycli and iredis both fail their test suites or have blocking issues.

**Summary:** Backup candidate. Large file count (51) drives long runtime. COV-006 via jinja2 is weaker than database/Redis overlap. MIT license (vs BSD-3 for mycli/iredis) if license matters. Recommended third choice.

---

### 2.4 Go (3 candidates)

**OTel Go contrib instruments used in assessment:** `net/http` → `otelhttp`, `google.golang.org/grpc` → `otelgrpc`, `go.mongodb.org/mongo-driver` → `otelmongo`. Standard library `database/sql` has community `otelsql` support (not official OTel Go contrib). The Go Type C PRD's "add auto-instrumentation libraries" milestone determines which packages get added to spiny-orb's Go equivalent of KNOWN_FRAMEWORK_PACKAGES.

### Rule Coverage Comparison — Go

**Key:** ✓ confirmed fires · ✗ cannot fire · ≈ eval-design dependent · 🔍 needs local verification or conditional on a later milestone

| Rule | mods | dbmate | ghq |
|------|------|--------|-----|
| NDS-002 Tests pass | ✓ testing.go present | ✓ dbtest/ package | ✓ |
| NDS-004 Public API preserved | ✓ | ✓ DB interface/driver | ✓ RemoteRepo/LocalRepo |
| NDS-005a Error handling structure | ✓ AI+DB+subprocess | ✓ SQL+migration errors | ✓ HTTP+git+VCS errors |
| NDS-005b Silent catch preserved | ✓ API key fallback | 🔍 | 🔍 |
| COV-001 Entry points | ✓ mods CLI | ✓ up/down/status/migrate | ✓ get/list/create/rm |
| COV-002 Outbound calls | ✓ HTTP+DB+subprocess+stdin | ✓ DB+file (4 DB drivers) | ✓ HTTP+git+file |
| COV-003 Failable ops | ✓ | ✓ | ✓ |
| COV-004 Long-running/async | ✓ AI streaming | ✓ DB operations | ✓ git clone |
| COV-005 Domain-specific attrs | ≈ | ≈ | ≈ |
| **COV-006 Auto-instr preferred** | **✓ net/http direct (confirmed)** | **🔍 database/sql (if otelsql added)** | **✓ net/http direct (confirmed)** |
| RST-001 No utility spans | ✓ internal/*/format.go files | ✓ dbutil.go, version.go | ✓ logger/log.go, helpers_*.go, url.go |
| RST-002 No accessor spans | 🔍 | 🔍 | 🔍 |
| RST-003 No thin-wrapper spans | 🔍 | 🔍 | 🔍 |
| RST-004 No internal spans | ✓ internal/ packages | ✓ pkg/ unexported | ✓ unexported cmd helpers |
| RST-005 No re-instrumentation | ✓ vacuous | ✓ vacuous | ✓ vacuous |
| SCH-001 Span names match registry | ≈ | ≈ | ≈ |
| SCH-002 Attr keys match registry | ≈ | ≈ | ≈ |
| SCH-003 Attr values conform | ≈ | ≈ | ≈ |
| SCH-004 No redundant entries | ≈ | ≈ | ≈ |
| CDQ-001 Spans closed all paths | ✓ streaming multi-path | ✓ migration with branches | ✓ clone with VCS branches |
| CDQ-003 Standard error recording | ✓ AI+DB+subprocess errors | ✓ SQL+migration+conn errors | ✓ HTTP+git+VCS errors |
| CDQ-005 Async context maintained | ✓ net/http context | ✓ DB context | ✓ net/http context |
| CDQ-006 Expensive attr guarding | 🔍 | 🔍 | 🔍 |
| CDQ-007 No PII/unbounded attrs | ✓ conv content, API keys | ✓ conn strings, SQL text | ✓ repo URLs, git config |
| CDQ-008 Consistent tracer naming | ✓ 32 files | ✓ 14 files | ✓ 19 files |
| **Confirmed ✓ (of 24 D-rules)** | **17** | **15** | **16** |
| **Cannot fire ✗** | **0** | **0** | **0** |
| **Needs verify / conditional 🔍** | **3** | **5 (incl. COV-006)** | **4** |
| **Eval-design ≈** | **5** | **5** | **5** |

**Total exercisable (✓ + 8 universal):** mods = 25 · dbmate = 23 (+ COV-006 if otelsql added) · ghq = 24

---

#### mods (charmbracelet/mods)

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | 4.5k |
| Source files | 32 Go files (16 root-level + 16 in `internal/` provider packages) |
| I/O types | HTTP (AI API calls via anthropic-sdk-go, openai-go, cohere-go which wrap net/http), SQLite (conversation storage via modernc.org/sqlite + sqlx), subprocess (os/exec for API key retrieval), stdin/stdout |
| KFP overlap | **`net/http`** ✓ (direct import confirmed in mods.go) — `otelhttp` transport instrumentation applies |
| Existing OTel | None |

**Rubric coverage notes:**
- COV-006: ✓ **fires** — `net/http` imported directly in `mods.go` for proxy configuration; AI SDK calls also route through net/http transport
- COV-001: ✓ CLI entry point
- COV-002: ✓ HTTP (AI APIs), SQLite DB, subprocess, stdin/stdout
- COV-004: ✓ AI streaming responses (async-like patterns in Go)
- NDS-005: ✓ HTTP error handling (API rate limits, auth failures), DB errors, subprocess failures
- CDQ-003: ✓ diverse error types: API errors, DB errors, subprocess failures, stdin parse errors
- RST-001: ✓ internal provider files (anthropic/format.go, openai/format.go, etc. are formatting utilities)
- SCH domain: AI conversation lifecycle (`ai.provider`, `ai.model`, `ai.request.tokens`, `conversation.id`) — rich schema potential

**Summary:** 32 files (just above 30 ideal; justified by rich rubric coverage across HTTP, DB, and subprocess). Most I/O-diverse Go candidate. Direct net/http import confirmed. Recommended first choice.

---

#### dbmate (amacneil/dbmate)

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | 6.8k |
| Source files | 14 Go files (2 root-level + 12 in `pkg/`) |
| I/O types | Database (PostgreSQL via lib/pq, MySQL via go-sql-driver/mysql, SQLite via mattn/go-sqlite3, ClickHouse via clickhouse-go, BigQuery via cloud.google.com/bigquery), file R/W (migration .sql files, schema.sql) |
| KFP overlap | **`database/sql`** (standard library) — not in official OTel Go contrib (`otelhttp`, `otelgrpc`, `otelmongo` are official). Community `otelsql` package instruments `database/sql` and is widely adopted. The Go Type C PRD's "add auto-instrumentation libraries" milestone decides whether to include `otelsql`; if included, COV-006 fires. If the milestone excludes community packages, COV-006 does not fire for dbmate. |
| Existing OTel | None confirmed |

**Rubric coverage notes:**
- COV-006: **Conditional** — fires if the Go Type C PRD adds database/sql (via otelsql) to spiny-orb's Go package list. This is planned and reasonable given database/sql is the core Go database abstraction.
- COV-001: ✓ `dbmate` CLI with migrate up/down/status commands
- COV-002: ✓ SQL migrations (multi-database), file I/O (migration files, schema.sql)
- NDS-005: ✓ SQL execution errors, connection failures, migration conflict errors
- CDQ-003: ✓ DB connection errors, SQL syntax errors, migration state errors
- RST-001: ✓ utility files (pkg/dbutil/dbutil.go, pkg/dbmate/version.go are pure utilities)
- SCH domain: Database migration lifecycle (`migration.name`, `migration.direction`, `db.system.name`) — clean schema

**Summary:** Smallest file count (14 files = ~19 min). Multiple database drivers means excellent DB I/O coverage. COV-006 is conditional on Go Type C PRD's KNOWN_FRAMEWORK_PACKAGES update. Locally runnable with SQLite (no external DB needed). Recommended second choice.

---

#### ghq (x-motemen/ghq)

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | 3.5k |
| Source files | 19 Go files |
| I/O types | HTTP (Go module import path detection via `net/http` in `go_import.go`), subprocess (git clone, git commands via `vcs.go`), file R/W (local repository directory management) |
| KFP overlap | **`net/http`** ✓ (direct import confirmed in `go_import.go`) — `otelhttp` transport instrumentation applies |
| Existing OTel | None confirmed |

**Rubric coverage notes:**
- COV-006: ✓ **fires** — `net/http` imported directly for Go module discovery (fetches HTML pages to parse `<meta name="go-import">` tags)
- COV-001: ✓ CLI commands (`ghq get`, `ghq list`, `ghq create`, etc.)
- COV-002: ✓ HTTP (Go import detection), subprocess (git), file (repository path management)
- NDS-005: ✓ git clone failures, HTTP parse errors, repository path conflicts
- CDQ-003: ✓ network errors, git failures, filesystem errors
- RST-001: ✓ utility files (logger/log.go, helpers_unix.go, helpers_windows.go, url.go)
- SCH domain: Repository management (`repo.url`, `repo.vcs`, `repo.local_path`, `import.path`)

**Summary:** 19 files (ideal runtime ~25 min). Direct `net/http` import confirmed — COV-006 fires without KNOWN_FRAMEWORK_PACKAGES updates. Different domain from mods (repo management) and dbmate (DB migrations). Good structural diversity across the 3 Go candidates. Recommended third choice.

---

## 3. IS Scorability Notes

IS (Instrumentation Score) scoring requires the target repo to emit OpenTelemetry spans that can be captured and evaluated. The key IS scoring workflow: configure OTel Collector with file exporter → exercise the target → score the captured OTLP output.

| Candidate | Locally Runnable | IS Scoring Complexity | Notes |
|-----------|-----------------|----------------------|-------|
| **commit-story-v2** (JS) | Yes — CLI, needs ANTHROPIC_API_KEY | Straightforward | Execute via CLI with OTel env vars. Clear entry point produces INTERNAL root span. Requires live Anthropic API. |
| **release-it** (JS) | Yes — CLI, needs GITHUB_TOKEN for release | Moderate | Can dry-run (`--dry-run`) without GitHub token; live GitHub API calls need token. Main workflow exercises full HTTP+git path. |
| **npm-check** (JS) | Yes — CLI, runs against any project | Straightforward | Run against a test project with outdated deps. No credentials needed. Registry reads only. |
| **taze** (TS) | Yes — CLI, npm registry access only | Straightforward | Run `taze check` against a test project. Only needs npm registry (no credentials). |
| **@changesets/cli** (TS) | Yes — CLI, git + npm access | Straightforward | Run `changeset add` / `changeset version` in a test monorepo. No credentials for core workflow. |
| **wireit** (TS) | Yes — CLI, subprocess only | Straightforward | Run wireit with test scripts in a temp project. No external services needed. |
| **mycli** (Python) | Yes — needs MySQL server | Moderate | Requires local MySQL server (Docker: `docker run -p 3306:3306 mysql:8`). Exercise with test queries. |
| **iredis** (Python) | Yes — needs Redis server | Moderate | Requires local Redis (Docker: `docker run -p 6379:6379 redis:7`). Exercise with Redis commands. |
| **commitizen** (Python) | Yes — CLI, git + filesystem only | Straightforward | Run `cz bump` / `cz changelog` in a test git repo. No external services. |
| **mods** (Go) | Yes — needs AI API key | Moderate | Requires API key for at least one provider (Anthropic, OpenAI, or Ollama locally). Use Ollama for credential-free local testing. |
| **dbmate** (Go) | Yes — SQLite needs no server | Straightforward | Use `dbmate -d sqlite3:./test.db up` for credential-free local testing. No server required for SQLite. |
| **ghq** (Go) | Yes — git + network | Straightforward | Run `ghq get github.com/owner/repo`. Only needs git and internet access for Go import detection. |

---

## 4. Candidate Comparison Summary

| Language | Candidate | Files | COV-006 | Runtime est. | Recommendation |
|----------|-----------|-------|---------|--------------|----------------|
| **JS** | commit-story-v2 | ~30 | ✓ Traceloop | ~40 min | Evaluate in milestone 0 |
| **JS** | release-it | 23 | ✓ undici | ~31 min | **Preferred** — only JS candidate with COV-006 |
| **JS** | npm-check | 18 | ✗ None | ~24 min | Backup |
| **TS** | taze | 33 | ✓ Conditional | ~44 min | **Preferred** — best I/O diversity; COV-006 after KFP update |
| **TS** | changesets | 25 | ✗ None | ~33 min | Runner-up |
| **TS** | wireit | 62 | ✗ None | ~83 min | Backup — high runtime |
| **Python** | mycli | 15 | ✓ PyMySQL | ~20 min | **Preferred** — fastest + strong DB COV-006 |
| **Python** | iredis | 17 | ✓ redis+click | ~23 min | Runner-up |
| **Python** | commitizen | 51 | ✓ jinja2 | ~68 min | Backup — high runtime |
| **Go** | mods | 32 | ✓ net/http | ~43 min | **Preferred** — most I/O-diverse |
| **Go** | dbmate | 14 | ✓ Conditional | ~19 min | Runner-up |
| **Go** | ghq | 19 | ✓ net/http | ~25 min | Runner-up |

Runtime estimates based on ~1.3 min/file (from 30 files ≈ 40 min operational data).

---

## 5. IS Scorability Context

Full IS scoring infrastructure details and rule applicability by app type are in [instrumentation-score-integration.md](instrumentation-score-integration.md). Key points for these candidates:

- CLI tools (most of the above) produce INTERNAL root spans — ~9 of 20 IS rules apply
- Tools requiring local servers (mycli, iredis) add Docker setup overhead but no k8s dependency
- mods can use Ollama (local) or cloud AI APIs — Ollama avoids API key requirements
- All candidates are locally runnable without k8s infrastructure — no Kind cluster needed for any
