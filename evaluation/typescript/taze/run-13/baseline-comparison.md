# Baseline Comparison — taze Run-13 (TypeScript) vs commit-story-v2 Run-14 (JavaScript)

**TypeScript first baseline. No prior TS runs. JS comparison provides cross-language context only.**

---

## Rubric Version Note

The TS and JS chains use different rubric versions. Direct score comparison requires this caveat:

| Axis | JS (run-14) | TS (run-13) |
|------|-------------|-------------|
| Gates | 5 (NDS-001, NDS-002, NDS-003, API-001, NDS-006) | 2 (NDS-001, NDS-002) |
| Quality rules | 25 | 29 |
| Total rules | 30 | 31 |

Rules added to TS quality (moved from JS gates): NDS-003, NDS-006, API-001.
Rules added as new TS quality rules: COV-002, RST-002.
Rules replaced: CDQ-008 → CDQ-011.
Rules removed: API-004.

Normalized comparison (common rules only, excluding new TS-only rules COV-002 and RST-002): TS scores 25/25 on the JS rule set — the 2 TS quality failures (SCH-003, CDQ-006) both fall in rules present in the JS rubric too.

---

## Cross-Language Metrics

| Metric | TS taze Run-13 | JS csv2 Run-14 |
|--------|----------------|----------------|
| Date | 2026-05-03 | 2026-04-15 |
| Target | taze (antfu-collective) | commit-story-v2 |
| Run type | Type C (Run-1, first baseline) | Type D (Run-14) |
| Quality | **27/29 (93%)** | 22/25 (88%) |
| Gates | 2/2 (100%) | 5/5 (100%) |
| Files total | 33 | 30 |
| Files committed | **14** | 12 |
| Correct skips | **19 (57.6%)** | 18 (60%) |
| Total spans | 31 | 32 |
| New schema attributes | 3 | 0 |
| Cost | **$4.93** | $5.59 |
| Cost per committed file | **$0.35** | $0.47 |
| Duration | 54m 45s | 54m 16s |
| Input tokens | 62.0K | 195.3K |
| Output tokens | 237.5K | 226.9K |
| Q×F | **13.0** | 10.6 |
| Push/PR | YES (PR #8) | YES (PR #65) |
| Failures | **0** | 0 |
| Rollbacks | **0** | 0 |

Q×F is not directly comparable across rubric versions (different denominators). Within each chain, Q×F measures combined quality and coverage.

---

## Dimension Scores

| Dimension | TS taze Run-13 | JS csv2 Run-14 | Notes |
|-----------|----------------|----------------|-------|
| NDS | 4/4 (100%) | 2/2 (100%) | TS has 2 more rules (NDS-003, NDS-006 moved from JS gates) |
| COV | **6/6 (100%)** | 3/5 (60%) | TS adds COV-002 (HTTP calls); JS fails COV-003 + COV-004 |
| RST | 5/5 (100%) | 4/4 (100%) | TS adds RST-002; both clean |
| API | 3/3 (100%) | 3/3 (100%) | Different rule IDs but equivalent coverage |
| SCH | **3/4 (75%)** | 4/4 (100%) | TS fails SCH-003 (schema type mismatches — schema doc wrong, not code) |
| CDQ | 6/7 (86%) | 6/7 (86%) | TS fails CDQ-006 (isRecording guards); JS fails CDQ-003 (error recording) |

---

## Key Differences

### 1. COV: TypeScript clean, JavaScript has two persistent failures

Both COV-003 (error visibility in summaryNode) and COV-004 (span coverage in summary-manager.js) have been recurring JS failures across multiple runs. taze run-13 achieves perfect COV — all entry points spanned, HTTP calls covered, async ops spanned. The difference likely reflects target characteristics: taze has no large graph-orchestrator files where agent span-allocation strategy diverges from rubric requirements.

COV-002 (external HTTP calls enclosed) is a TS-only rule — JS doesn't test it because commit-story-v2 has no direct HTTP calls (LangChain handles them). taze exercises COV-002 via ofetch calls in resolves.ts and packument.ts. Both pass.

### 2. SCH-003: TS fails; JS clean

taze run-13 has 3 SCH-003 type mismatches (taze.config.sources_found, taze.cache.hit, taze.cache.changed) — all caused by incorrect type declarations in agent-extensions.yaml. The agent inferred the correct types from the code (int for counts, boolean for flags); the schema documentation was wrong. This is a schema-authoring failure, not an instrumentation failure.

Fix path: correct the type declarations in semconv/agent-extensions.yaml. The code is already correct.

### 3. CDQ-006: TypeScript-specific pattern (TS fails; JS clean)

5 of 14 committed taze files pass inline O(n) computations to setAttribute without span.isRecording() guards. JS run-14 has no CDQ-006 findings — commit-story-v2 has no expensive setAttribute computations. CDQ-006 in taze reflects taze's architecture: workspace functions that count packages with reduce() chains.

Reference correct pattern: pnpmWorkspaces.ts is the only taze file that applies the guard correctly.

### 4. Advisory contradiction rate: TS higher than JS

TS run-13 advisory contradiction rate is ~78% (SCH-001 generates systematic false positives on namespace-prefixed codebases; CDQ-007 null guard advisories are false positives for typed TypeScript parameters). JS run-14 has ~44% contradiction rate. The higher TS rate reflects advisory judges calibrated for JavaScript patterns — TypeScript's static typing eliminates several advisory-triggering scenarios by construction.

### 5. Input token efficiency

TS run-13 used 62.0K input tokens vs JS run-14's 195.3K — despite processing 3 more files. taze's TypeScript files are shorter and more uniform than commit-story-v2's JavaScript files. Output tokens are comparable (237.5K vs 226.9K), suggesting similar per-file agent reasoning depth. The cost difference ($4.93 vs $5.59) is primarily driven by input token reduction.

---

## Run Type Context

taze run-13 is a Type C run (first eval run for a new language). JS run-14 is a Type D run (14th iteration on a mature target with all P1 fixes merged). Despite this asymmetry — TS run-1 vs JS run-14 — the TS baseline outperforms the JS run on most metrics:

- TS has 0 failures, 0 rollbacks (first occurrence in a Type C run)
- TS committed 14/33 files (42%) vs JS 12/30 (40%) — comparable coverage ratios
- TS Q×F = 13.0 matches JS chain's best-ever result (run-11 also hit 13.0)

The JS chain took 14 iterations to reach its current state (multiple rounds of P1 fixes). TS reaches comparable output quality on run-1 because it inherits the JS chain's fix history — all TypeScript P1s (NDS-001 syntax, NDS-003 regex, CDQ-006 guard, SCH-001 advisory) were resolved before this run.

---

## Failure Classification

| Failure | Dimension | Root Cause | Fix Path |
|---------|-----------|------------|----------|
| SCH-003 type mismatches (3 instances, 2 files) | SCH | Schema doc errors (wrong types in agent-extensions.yaml) | Update semconv/agent-extensions.yaml |
| CDQ-006 isRecording guards (8 instances, 5 files) | CDQ | Prompt doesn't consistently enforce the guard pattern | Prompt addition; reference pnpmWorkspaces.ts |

---

## TypeScript Baseline Established

| Metric | Baseline Value |
|--------|---------------|
| Quality | 27/29 (93%) |
| Q×F | 13.0 |
| Cost per committed file | $0.35 |
| Skip rate | 57.6% |
| Dimensions at 100% | NDS, COV, RST, API |
| Known weak dimensions | SCH (75%), CDQ (86%) |
