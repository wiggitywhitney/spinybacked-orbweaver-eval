# Research: Eval Target Selection Criteria for AI Instrumentation Agents

**Project:** spinybacked-orbweaver-eval
**Last Updated:** 2026-04-11

## Update Log

| Date | Summary |
|------|---------|
| 2026-04-11 | Initial research — hypothesis validation, benchmark methodology survey, Python candidate identification |
| 2026-04-11 | Post-review update: added rubric coverage as primary framing, auto-instrumentation library testing criterion, deliberately incomplete Weaver schema strategy, TypeScript candidate search (taze recommended), corrected objectivity issues in criteria thresholds |


## Findings

### Summary

Evidence supports most hypotheses but requires refinement. The biggest finding is that "async" is a JavaScript-centric framing — the real criterion is **I/O operation density** (functions that perform HTTP calls, DB queries, file operations, or subprocess calls). Three new factors emerged from benchmark literature that were not in the hypothesis list: training data contamination resistance, deterministic reproducibility, and entry point clarity for IS scoring. For the Python candidate, **commitizen** (commitizen-tools/commitizen) is the strongest match.

---

### Surprises & Gotchas

**"Async density" is language-specific; I/O density is the universal criterion.** Python OTel instrumentation targets synchronous I/O equally well (`requests`, `sqlite3`, `subprocess`). The hypothesis table frames file selection around async, which is JavaScript-centric. The real criterion is whether functions perform operations worth tracing. 🟢 high

**Source says:** OTel Python auto-instrumentation covers both sync and async libraries: `opentelemetry-instrumentation-requests` (sync), `opentelemetry-instrumentation-aiohttp-client` (async), `opentelemetry-instrumentation-sqlite3` (sync), `opentelemetry-instrumentation-subprocess` (sync). ([OTel Python Contrib](https://github.com/open-telemetry/opentelemetry-python-contrib))

**OTelBench uses ~300-LOC services and frontier models still fail.** The eval target doesn't need to be complex to surface failure modes. Moderate complexity (15-50 files) is more than sufficient. 🟢 high

**Source says:** "All benchmark tasks involved short services of around 300 lines of code" and these are "trivial compared to real-world scenarios" yet models still fail. ([OTelBench blog](https://quesma.com/blog/introducing-otel-bench/))

**SWE-bench++ found that scale drives diversity automatically.** Rather than curating specific repos, filtering millions of candidates by basic signals (>100 stars, >10k LOC, testing framework) yielded natural diversity across domains. This suggests criteria should function as **filters** (pass/fail), not **weights**. 🟢 high

**Source says:** The dataset covers "3,971 unique repositories" with a "taxonomy analysis on a random subset of 488 instances confirmed the dataset's representative scope." Domains: DevTools (27.1%), Infrastructure/DevOps (18.5%), Scientific Computing (12.9%), Data Engineering (10.7%). ([SWE-Bench++](https://arxiv.org/html/2512.17419v1))

**BSD-3-Clause should be accepted alongside MIT/Apache-2.0.** Multiple strong candidates use BSD-3, which is equally permissive for fork-and-freeze evaluation use. No legal distinction for internal evaluation. 🟢 high

---

### Hypothesis Validation

#### H1: ~15–40 async files is the right size → REFINE to "15-50 instrumentable files"

The count should be **instrumentable files** (containing I/O operations worth tracing), not "async files." The range is reasonable for spiny-orb's per-file architecture, but should expand to 15-50 to accommodate repos with more utility files.

- SWE-bench uses repos with >10k LOC (much larger, but evaluates different things) 🟢 high
- OTelBench uses ~300 LOC per service (smaller, single-service instrumentation) 🟢 high
- SWE-bench Pro average: 107 lines across 4 files per task (smaller scope) 🟢 high

**Verdict:** The range is reasonable as a filter but should be "15-50 source files total (expecting 40-70% to contain instrumentable operations)."

#### H2: ~40–60% skip rate exercises RST judgment → SUPPORTED with refinement

A meaningful mix of instrumentable and non-instrumentable files is needed to test the agent's skip decisions. The exact percentage is less important than having both types.

- No benchmark literature on skip rates for instrumentation tools 🔴 low
- 12 runs on commit-story-v2 confirm ~50-60% skip rate provides good RST exercise 🟡 medium

**Verdict:** Rename to "skip-rate balance." Target 30-60% non-instrumentable files. Below 30% means almost everything needs instrumentation (no skip judgment tested). Above 70% means very few files get instrumented (insufficient coverage testing).

#### H3: Async density matters more than total file count → REFINE to "I/O density"

The concept is correct but the framing is JavaScript-specific. Python sync I/O (requests, sqlite3, subprocess) is equally instrumentable. Go's goroutines and channels are instrumented differently from Python async/await.

**Verdict:** Replace with "I/O operation density matters more than total file count." Files with no I/O operations should be in the "skip" category regardless of language.

#### H4: Error handling diversity surfaces CDQ-003 patterns → SUPPORTED

Well-grounded in rubric mechanics. Diverse error handling patterns (try/except, error callbacks, retry logic, custom exception hierarchies) provide more opportunities for the agent to demonstrate or fail at quality judgment.

- Rubric rule CDQ-003 specifically evaluates error handling instrumentation quality 🟢 high
- No counter-evidence found 🟢 high

**Verdict:** Supported. Include as a criterion: "Target should have diverse error handling patterns."

#### H5: Test suite health is load-bearing → STRONGLY SUPPORTED

Universal across all benchmark literature examined.

- SWE-bench requires repos with test files, PRs that modify tests 🟢 high
- SWE-bench++ requires "recognizable testing framework" 🟢 high
- SWE-bench Pro: "tests are well specified to validate the generated solution" 🟢 high
- NDS-002 is a hard gate in spiny-orb's rubric 🟢 high

**Source says:** "Repositories must demonstrate established testing infrastructure" and "PRs must include edits or additions to test files." ([SWE-Bench++](https://arxiv.org/html/2512.17419v1))

**Verdict:** Mandatory criterion. Test suite must pass before instrumentation; instrumentation must not break tests.

#### H6: Language-idiom coverage matters → REFINE and split

Within a single target, what matters is that the code uses **mainstream language patterns** (not exotic). Exotic patterns test the model's knowledge of rare constructs, not its instrumentation quality.

- SWE-bench Pro spans 41 repos to "mitigate overfitting to specific project coding styles" 🟢 high
- SWE-Sharp-Bench was created because Python-only benchmarks miss C#-specific patterns 🟢 high

**Verdict:** Split into (a) target should use mainstream language patterns, and (b) cross-target idiom diversity is a framework-level concern, not a per-target criterion.

#### H7: Domain variety (I/O, external calls, entry points) produces more failure modes → SUPPORTED

Diversity of operations within a target exercises more rubric rules than a single-domain repo.

- SWE-bench++ taxonomy shows domain diversity matters 🟢 high
- OTelBench tests across 11 languages for polyglot tracing 🟢 high

**Verdict:** Supported. A target with HTTP + file I/O + subprocess + DB is better than one that only does HTTP.

#### H8: Fork-and-freeze; live upstream doesn't matter → STRONGLY SUPPORTED

Universal standard across all benchmarks examined.

- Qodo AI code review benchmark explicitly uses fork-and-freeze 🟢 high
- SWE-bench snapshots specific commits/PRs 🟢 high
- Every benchmark examined uses point-in-time evaluation 🟢 high

**Source says:** "All benchmarked pull requests are opened on a clean, forked repository" — fork-and-freeze is the standard for "controlled and reproducible testing environments." ([Qodo blog](https://www.qodo.ai/blog/how-we-built-a-real-world-benchmark-for-ai-code-review/))

**Verdict:** Strongly supported. Fork once, freeze, never pull upstream.

#### H9: MIT/Apache-2 sufficient for legal use → STRONGLY SUPPORTED (expand to include BSD-3)

No legal concern for fork-and-freeze evaluation use. Expand accepted licenses to include BSD-3-Clause.

- SWE-bench Pro uses GPL for **contamination resistance**, not legal necessity 🟢 high
- Fork-and-freeze is internal evaluation, not redistribution 🟢 high

**Verdict:** MIT, Apache-2.0, and BSD-3-Clause are all acceptable.

---

### New Factors Not in Hypothesis List

#### Training data contamination risk 🟡 medium

SWE-bench Pro deliberately uses GPL to deter training data inclusion. For spiny-orb eval, less popular repos reduce the risk that the model has memorized the codebase. However, since we evaluate output quality (not memorization), this is a secondary concern.

**Source says:** SWE-bench Pro's "licensing strategy acts as a legal deterrent against the code's inclusion in model training data, ensuring the benchmark is contamination-resistant by design." ([SWE-Bench Pro](https://arxiv.org/pdf/2509.16941))

**How to evaluate:** Prefer repos with <10k stars over mega-popular repos (>50k stars). Not a blocker, but a tiebreaker.

#### Deterministic reproducibility 🟢 high

Target repos with flaky tests or non-deterministic build outputs undermine eval reliability. The same spiny-orb version should produce comparable results across runs.

**How to evaluate:** Run the test suite 3 times. If any test is flaky, the repo fails this criterion.

#### Entry point clarity 🟡 medium

IS scoring requires a clear entry point producing an INTERNAL/SERVER root span. Libraries without a CLI entry point are harder to IS-score because you need to write a harness to exercise them.

**How to evaluate:** CLI tools with `__main__.py` or a clear entry point command pass. Pure libraries require a custom exercise script (not a blocker, but adds setup overhead).

#### File size variance 🔴 low

Having files of different sizes tests agent adaptability. All-same-size repos don't exercise judgment on complex vs. simple files. Low confidence because spiny-orb processes files independently.

**How to evaluate:** Check if files range from <50 LOC to >200 LOC. Not a hard criterion.

#### Rubric coverage maximization 🟢 high (added post-review)

**This is the primary framing the initial research missed.** A good target repo is one that *maximally exercises the 32-rule rubric* — not one that fits arbitrary file count or I/O diversity thresholds. File count, I/O diversity, skip rate, and error handling diversity are all proxies for rubric coverage. A 20-file repo that exercises 28 of 32 rules is better than a 40-file repo that exercises 20. When evaluating a candidate, assess how many rubric dimensions it can exercise: RST (skip judgment), COV (coverage surface), SCH (schema compliance and extension), CDQ (code quality and error handling), NDS (non-destructiveness via test suite), API (OTel API correctness).

**How to evaluate:** Map the target's code patterns to the rubric rule list. Count which rules are exercisable. Prefer candidates that exercise more rules, even if they score worse on proxy metrics like file count.

#### Auto-instrumentation library overlap 🟢 high (added post-review)

The target repo should use at least one library that has a corresponding OTel auto-instrumentation package. This tests whether spiny-orb correctly identifies auto-instrumentation opportunities (COV-006 rule) — recommending the library instead of manually wrapping those calls. This has nothing to do with LLM frameworks specifically; it's about the target's dependency tree overlapping with the OTel auto-instrumentation ecosystem.

The known auto-instrumentation library list lives in `spinybacked-orbweaver/src/languages/javascript/ast.ts` (`KNOWN_FRAMEWORK_PACKAGES`). Currently covers JS/TS only: database drivers (pg, mysql, mongodb, redis, ioredis), HTTP frameworks (express, fastify, koa), HTTP clients (axios, got, node-fetch, undici), gRPC, message queues, GraphQL, and ORMs. The TypeScript provider reuses this list. Python and Go providers will need language-specific equivalents (e.g., Python: `requests`, `flask`, `django`, `sqlalchemy`, `psycopg2`; Go: `net/http`, `database/sql`, `google.golang.org/grpc`).

**How to evaluate:** Check if the target's `package.json` / `requirements.txt` / `go.mod` imports any package in the KNOWN_FRAMEWORK_PACKAGES list (or future language equivalents). At least one overlap is needed to exercise COV-006.

#### Deliberately incomplete Weaver schema strategy 🟢 high (added post-review)

When creating the initial `semconv/` schema for a target repo, deliberately omit some spans and attributes that a human would include. This tests whether spiny-orb can identify attributes that should exist but aren't in the schema, propose them, and add them to the extensions file. A complete schema only tests SCH compliance; an incomplete schema tests SCH *extension capability*, which is a harder and more valuable signal.

The Type C PRD for each target should document exactly which spans/attributes were omitted and why, so the eval can check whether spiny-orb surfaces them. This is an eval design choice, not a target selection criterion — but the target must have enough semantic richness to support meaningful omissions.

**How to apply:** During the "Add spiny-orb prerequisites" milestone of each Type C PRD, create the semconv/ schema with deliberate gaps. Document the gaps in the PRD milestone description.

---

### Python Candidate Assessment

#### Candidate 1: commitizen (commitizen-tools/commitizen) — RECOMMENDED

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | 3.4k |
| Source files | ~45-55 Python files (17 top-level + 6 subdirectories) |
| I/O diversity | Git subprocess calls, file read/write, template rendering, changelog generation, version bumping |
| Test suite | Yes (tests/ directory, CI pipeline) |
| Async | No (synchronous, but I/O-heavy) |
| Entry point | CLI via `cz` / `git-cz` commands |
| Local runnability | Yes (only needs a git repo) |
| Fork-and-freeze | Compatible (no external service dependencies) |
| Skip-rate estimate | ~40-50% (utility files, __init__.py, exceptions, types) |

**Why commitizen:** It has the right size (45-55 files), good domain variety (git operations, file I/O, template rendering), MIT license, working test suite, clear CLI entry point, and is locally runnable. The lack of async is not a problem — Python OTel instrumentation covers sync I/O equally well. The git subprocess calls, file manipulation, and template rendering provide diverse instrumentation targets.

#### Candidate 2: sqlite-utils (simonw/sqlite-utils) — TOO SMALL

| Attribute | Value |
|-----------|-------|
| License | Apache-2.0 |
| Stars | 2k |
| Source files | 8 Python files |
| I/O diversity | SQLite operations, file import/export, HTTP (via CLI piping) |

**Why not:** Only 8 source files is well below the 15-50 range. Most logic is concentrated in two large files (cli.py, db.py). Not enough files to exercise skip judgment or provide meaningful rubric coverage.

#### Candidate 3: howdoi (gleitz/howdoi) — TOO SMALL

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | 10.8k |
| Source files | 4 Python files |

**Why not:** Only 4 source files. Zero skip judgment exercise. Would produce a trivial evaluation.

#### Candidate 4: litecli (dbcli/litecli) — VIABLE ALTERNATIVE

| Attribute | Value |
|-----------|-------|
| License | BSD-3-Clause |
| Stars | 3.2k |
| Source files | ~15-20 estimated |
| I/O diversity | SQLite operations, config file I/O, terminal I/O |
| Test suite | Yes |
| Async | Possible via prompt-toolkit |

**Why alternative:** Good candidate if commitizen proves problematic. BSD-3 license is acceptable. Database-focused I/O provides different instrumentation patterns than commitizen's git/file focus. Slightly smaller file count may be at the lower end of the range.

---

### TypeScript Candidate Assessment (added post-review)

The initial research only assessed Cluster Whisperer for TypeScript. A follow-up search for open-source TypeScript CLI tools identified **taze** as a stronger candidate.

#### Candidate 1: taze (antfu-collective/taze) — RECOMMENDED

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | 4,120 |
| Source files | 32 TypeScript files |
| I/O diversity | HTTP (npm registry via ofetch, JSR API), file R/W (package.json, yaml, cache), subprocess (package managers via tinyexec) |
| Test suite | 17 test files (vitest) |
| Entry point | CLI via `taze` command |
| Local runnability | Yes — only needs npm registry access |
| Skip-rate estimate | ~40% utility/type files |
| Auto-instrumentation overlap | Uses `ofetch` — check if covered by OTel `undici` instrumentation (ofetch uses undici under the hood in Node.js) |

**Why taze:** 32 files (mid-range), 3 distinct I/O types including HTTP, MIT license, active maintenance, vitest suite, clear CLI entry point. The ~40% skip rate is in the 30-60% sweet spot. Locally runnable with no infrastructure dependencies.

#### Candidate 2: ni (antfu-collective/ni) — STRONG RUNNER-UP

| Attribute | Value |
|-----------|-------|
| License | MIT |
| Stars | 8,156 |
| Source files | 28 TypeScript files |
| I/O diversity | HTTP (npm registry), file R/W (package.json, lockfiles), subprocess (package manager commands) |
| Test suite | 51 test files (vitest) |

**Why runner-up:** Nearly as good as taze with better test coverage. 8.2k stars is higher (minor contamination risk). Slightly less I/O diversity.

#### Candidate 3: wireit (google/wireit) — VIABLE ALTERNATIVE

| Attribute | Value |
|-----------|-------|
| License | Apache-2.0 |
| Stars | 6,404 |
| Source files | 47 TypeScript files |
| I/O diversity | File R/W (caching, lockfiles), subprocess (npm scripts), file watching (chokidar) |

**Why alternative:** Largest file count (47, near top of range), Google-backed. No HTTP calls — I/O diversity is file + subprocess + watch only.

#### Scoping assessment: Cluster Whisperer (59 files → ~33 scoped)

Cluster Whisperer has 59 .ts source files. Natural scoping to `pipeline/` + `tools/` + `utils/` + type files yields ~33 files with 5 I/O types. However: (1) already instrumented — frozen copy would need instrumentation stripped, (2) k8s dependency for exercising core paths, (3) missing LICENSE file in repo. Workable but adds setup overhead compared to taze.

#### Scoping assessment: Spiny-Orb frozen copy (109 files → 17 in coordinator/)

Spiny-orb has 109 .ts source files. The `coordinator/` directory (17 files, 65% I/O rate, 4 I/O types) is the most promising scope, but cross-directory imports mean the full codebase must be present for TypeScript compilation. At 109 files for the full repo, it fails the file count criterion. Scoping to a subdirectory for instrumentation is technically possible (spiny-orb can filter by glob) but artificial.

---

### Existing Candidate Assessments

#### commit-story-v2 (JavaScript) — CONDITIONAL PASS

Reasonable target chosen by circumstance. 30 JS files, ~57% skip rate, good I/O diversity (HTTP, file, LLM API). 12 runs of history validate that it surfaces meaningful failure modes. **Conditional** because it was not selected via these criteria — it should be re-evaluated against the final scorecard but existing eval history remains valid regardless.

#### Cluster Whisperer (TypeScript) — CONDITIONAL PASS (k8s dependency)

Whitney's k8s management tool. TypeScript is appropriate for TypeScript eval. **The k8s dependency is a significant concern for IS scoring** — requires a Kind cluster to produce traces, adding infrastructure setup to every IS scoring run. Not a blocker (infrastructure is available), but adds complexity. Evaluate against criteria when TypeScript provider is ready.

#### Cluster Whisperer additional note (added post-review)

Cluster Whisperer is already instrumented with OTel. A frozen copy for eval would need existing instrumentation stripped to create a clean baseline. This is doable but adds setup work to the Type C PRD. Missing LICENSE file in repo root (package.json declares MIT).

#### k8s-vectordb-sync (Go) — CONDITIONAL PASS (k8s dependency)

Same k8s dependency concern as Cluster Whisperer. Go is appropriate for Go eval. Evaluate against criteria when Go provider is ready. **Note (added post-review):** k8s-vectordb-sync may also already be instrumented — verify before selecting as target. If so, same stripping concern as Cluster Whisperer applies.

---

### Recommendation

Use the criteria scorecard as a **filter** (pass/fail each criterion) rather than a weighted score. A target must pass all mandatory criteria and should pass most recommended criteria.

**Objectivity caveat (added post-review):** Some thresholds in the initial research were influenced by the existing target (commit-story-v2). The 15-50 file range was partly anchored on commit-story-v2's 30 files. "Locally runnable" was elevated to mandatory partly because it validates the existing targets. The criteria below have been revised with this self-awareness, but the thresholds remain judgment calls, not externally validated standards. The primary framing should be **rubric coverage maximization** — proxy metrics like file count and I/O diversity are useful filters but not the ultimate measure of target quality.

| Criterion | Type | Evidence Basis |
|-----------|------|----------------|
| Permissive license (MIT/Apache-2.0/BSD-3) | Mandatory | H9, universal benchmark practice |
| Test suite passes | Mandatory | H5, NDS-002 hard gate, all benchmarks |
| 15-50 total source files | Mandatory (soft) | H1 refined; anchored on one data point, treat as guideline not hard cutoff |
| Locally runnable | Recommended (demoted) | IS scorability research; elevating to mandatory was partly circular |
| Fork-and-freeze compatible | Mandatory | H8, universal benchmark practice |
| I/O operation diversity (≥2 types) | Mandatory | H3 refined, H7, rubric coverage |
| Rubric coverage maximization | Primary | Post-review: the real measure — how many of 32 rules can this target exercise? |
| Auto-instrumentation library overlap | Recommended | Post-review: tests COV-006 rule; requires overlap with KNOWN_FRAMEWORK_PACKAGES or language equivalent |
| Clear entry point (CLI/server) | Recommended | IS scoring, entry point clarity |
| Skip-rate balance (30-60% non-instrumentable) | Recommended | H2 refined |
| Error handling pattern diversity | Recommended | H4, CDQ-003 rubric rule |
| Mainstream language patterns | Recommended | H6 refined |
| Deterministic reproducibility | Recommended | New factor |
| Community adoption (>500 stars) | Recommended | SWE-bench++ evidence |
| Different GitHub handles across candidates | Recommended | Post-review: same author/org means shared style, reducing rubric diversity. Tiebreaker. |

---

### Caveats

- Most evidence comes from code-generation and issue-resolution benchmarks (SWE-bench family), not instrumentation-specific benchmarks. The transfer to instrumentation evaluation is logical but not directly validated.
- The Python candidate assessment is based on GitHub metadata and directory structure inspection, not running the code. File counts are estimates that should be verified by cloning.
- OTelBench is the closest analogue to spiny-orb's task, but it evaluates human-like instrumentation of small services, not auto-instrumentation of entire codebases.
- IS scorability criteria are drawn from `docs/research/instrumentation-score-integration.md` (2026-04-10) which covers rule applicability by app type.

---

## Sources

- [SWE-Bench++ (arxiv)](https://arxiv.org/html/2512.17419v1) — repository selection framework, quantitative thresholds, diversity validation
- [SWE-Bench Pro (Scale AI)](https://arxiv.org/pdf/2509.16941) — contamination-resistant repo selection, GPL strategy, task complexity filters
- [SWE-Bench original (Princeton)](https://pli.princeton.edu/blog/2023/swe-bench-can-language-models-resolve-real-world-github-issues) — 12-repo Python benchmark, selection rationale
- [OTelBench (Quesma)](https://quesma.com/blog/introducing-otel-bench/) — OTel instrumentation benchmark, 300-LOC services across 11 languages
- [Qodo AI Code Review Benchmark](https://www.qodo.ai/blog/how-we-built-a-real-world-benchmark-for-ai-code-review/) — fork-and-freeze evaluation strategy
- [OTel Python Contrib](https://github.com/open-telemetry/opentelemetry-python-contrib) — Python instrumentation library coverage (sync + async)
- [commitizen (GitHub)](https://github.com/commitizen-tools/commitizen) — Python candidate: MIT, 3.4k stars, CLI tool
- [sqlite-utils (GitHub)](https://github.com/simonw/sqlite-utils) — Python candidate considered: Apache-2.0, 2k stars, too few files
- [howdoi (GitHub)](https://github.com/gleitz/howdoi) — Python candidate considered: MIT, 10.8k stars, too few files
- [litecli (GitHub)](https://github.com/dbcli/litecli) — Python candidate considered: BSD-3, 3.2k stars, viable alternative
- [taze (GitHub)](https://github.com/antfu-collective/taze) — TypeScript candidate: MIT, 4.1k stars, recommended
- [ni (GitHub)](https://github.com/antfu-collective/ni) — TypeScript candidate: MIT, 8.2k stars, strong runner-up
- [wireit (GitHub)](https://github.com/google/wireit) — TypeScript candidate: Apache-2.0, 6.4k stars, viable alternative
- spiny-orb `KNOWN_FRAMEWORK_PACKAGES` — auto-instrumentation library list at `spinybacked-orbweaver/src/languages/javascript/ast.ts:124-139`, shared by JS+TS providers
- [litecli (GitHub)](https://github.com/dbcli/litecli) — Python candidate considered: BSD-3, 3.2k stars, viable alternative
- [FEA-Bench (ACL)](https://aclanthology.org/2025.acl-long.839.pdf) — feature addition benchmark, repo scope determination
- [instrumentation-score-integration.md](instrumentation-score-integration.md) — prior research on IS rule applicability and target requirements
