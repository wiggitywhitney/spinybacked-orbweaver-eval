# Research: Eval Target Selection Criteria for AI Instrumentation Agents

**Project:** spinybacked-orbweaver-eval
**Last Updated:** 2026-04-11

## Update Log

| Date | Summary |
|------|---------|
| 2026-04-11 | Initial research — hypothesis validation, benchmark methodology survey, Python candidate identification |


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

### Existing Candidate Assessments

#### commit-story-v2 (JavaScript) — CONDITIONAL PASS

Reasonable target chosen by circumstance. 30 JS files, ~57% skip rate, good I/O diversity (HTTP, file, LLM API). 12 runs of history validate that it surfaces meaningful failure modes. **Conditional** because it was not selected via these criteria — it should be re-evaluated against the final scorecard but existing eval history remains valid regardless.

#### Cluster Whisperer (TypeScript) — CONDITIONAL PASS (k8s dependency)

Whitney's k8s management tool. TypeScript is appropriate for TypeScript eval. **The k8s dependency is a significant concern for IS scoring** — requires a Kind cluster to produce traces, adding infrastructure setup to every IS scoring run. Not a blocker (infrastructure is available), but adds complexity. Evaluate against criteria when TypeScript provider is ready.

#### k8s-vectordb-sync (Go) — CONDITIONAL PASS (k8s dependency)

Same k8s dependency concern as Cluster Whisperer. Go is appropriate for Go eval. Evaluate against criteria when Go provider is ready.

---

### Recommendation

Use the criteria scorecard as a **filter** (pass/fail each criterion) rather than a weighted score. A target must pass all mandatory criteria and should pass most recommended criteria.

| Criterion | Type | Evidence Basis |
|-----------|------|----------------|
| Permissive license (MIT/Apache-2.0/BSD-3) | Mandatory | H9, universal benchmark practice |
| Test suite passes | Mandatory | H5, NDS-002 hard gate, all benchmarks |
| 15-50 total source files | Mandatory | H1 refined, OTelBench/SWE-bench evidence |
| Locally runnable | Mandatory | IS scorability research, H7 |
| Fork-and-freeze compatible | Mandatory | H8, universal benchmark practice |
| I/O operation diversity (≥2 types) | Mandatory | H3 refined, H7, rubric coverage |
| Clear entry point (CLI/server) | Recommended | IS scoring, entry point clarity |
| Skip-rate balance (30-60% non-instrumentable) | Recommended | H2 refined |
| Error handling pattern diversity | Recommended | H4, CDQ-003 rubric rule |
| Mainstream language patterns | Recommended | H6 refined |
| Deterministic reproducibility | Recommended | New factor |
| Community adoption (>500 stars) | Recommended | SWE-bench++ evidence |

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
- [FEA-Bench (ACL)](https://aclanthology.org/2025.acl-long.839.pdf) — feature addition benchmark, repo scope determination
- [instrumentation-score-integration.md](instrumentation-score-integration.md) — prior research on IS rule applicability and target requirements
