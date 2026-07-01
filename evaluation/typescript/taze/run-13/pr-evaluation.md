# PR Artifact Evaluation — taze Run-13

**PR**: https://github.com/wiggitywhitney/taze/pull/8
**Branch**: spiny-orb/instrument-1777809261652
**State**: OPEN

---

## Push Auth — Successful

PR #8 was created successfully. The fine-grained PAT continues to work. This is the 8th consecutive PR created across all taze runs.

---

## PR Summary Quality

**Length**: ~300 lines

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| Files processed (33) | YES | Matches run output |
| Files committed (14) | YES | Matches run output |
| Files skipped (19) | YES | Matches run output |
| Per-file span counts | MOSTLY | cli.ts reports 2 spans but source review and per-file-eval find 1 `startActiveSpan` call; discrepancy carried from spiny-orb output |
| Per-file attempt counts | YES | All files match |
| Per-file cost | YES | Per-file totals sum to $4.63 (rounded); overall token table shows $4.93 |
| Skip list (19 files) | YES | All 19 correctly listed |
| Schema attribute additions (3) | YES | taze.cache.changed, taze.cache.hit, taze.config.sources_found all listed |
| New span IDs (30) | MINOR ISSUE | PR schema section lists 30 span IDs; run-summary reports 31 spans; discrepancy explained by cli.ts 2-vs-1 ambiguity |
| Review Attention outliers (3 files) | YES | packageYaml.ts (4), packages.ts (4), resolves.ts (6) correctly flagged |
| Token usage | YES | Input 61,965 / output 237,488 / cache read 139,830 match run output |
| Live-check | YES | OK |
| Short-lived process guidance | YES | SimpleSpanProcessor and SIGTERM/SIGINT shutdown guidance present and technically correct |

### Schema Changes Section

The PR summary correctly includes both attribute additions (3 new attributes) and span extensions (30 span IDs). The schema section accurately distinguishes "Registry Attributes — Added" from "New Span IDs." No omissions or duplicates.

### Advisory Findings Quality

The PR summary includes 55 advisory findings across three rules. Assessment by category:

**CDQ-006 (isRecording Guard) — 8 advisories**

| Finding | Verdict | Notes |
|---------|---------|-------|
| checkGlobal.ts resolvePkgs.reduce (line 66) | **Valid** | Confirmed CDQ-006 FAIL in per-file-eval |
| checkGlobal.ts resolvePkgs.reduce().filter() (line 67) | **Valid** | Confirmed FAIL |
| index.ts resolvePkgs.reduce (line 66) | **Valid** | Confirmed FAIL |
| index.ts resolvePkgs.reduce().filter() (line 67) | **Valid** | Confirmed FAIL |
| bunWorkspaces.ts catalogs.reduce (line 62) | **Valid** | Confirmed FAIL |
| bunWorkspaces.ts Object.keys(versions).length (line 88) | **Valid** | Confirmed FAIL |
| resolves.ts result.filter().length (line 404) | **Valid** | Confirmed FAIL |
| yarnWorkspaces.ts Object.keys(versions).length (line 83) | **Valid** | Confirmed FAIL |

**CDQ-006 verdict**: 8/8 valid. The judge correctly identified all five files with unguarded expensive computations inside `setAttribute`.

**SCH-001 (Span Names Match Registry) — 18 advisories**

| Finding | Verdict | Notes |
|---------|---------|-------|
| taze.cli.run vs taze.check.run | **Incorrect** | CLI entry point vs API entry point — distinct operations |
| taze.check.global vs taze.check.run | **Incorrect** | Global subcommand path vs standard check run — distinct |
| taze.check.execute vs taze.check.run | **Incorrect** | Orchestration layer vs entry point — distinct |
| taze.check.interactive vs taze.check.run | **Incorrect** | Interactive TUI path vs headless — distinct |
| taze.bun.load_workspace vs taze.cli.run | **Incorrect** | File I/O vs CLI execution — completely different domains |
| taze.bun.write_workspace vs taze.bun.load_workspace | **Incorrect** | Write vs load — distinct operations |
| taze.package_yaml.load vs taze.package_yaml.read | **Incorrect** | Full parse vs raw read — distinct abstraction levels |
| taze.package_yaml.write vs taze.package_yaml.write_file | **Incorrect** | High-level write vs low-level file write — distinct |
| taze.io.write_json vs taze.package_json.write | **Questionable** | Generic vs format-specific; agent correctly kept distinct |
| taze.io.write_package vs taze.package_json.write | **Incorrect** | Multi-format write vs json-specific |
| taze.io.load_package vs taze.package_json.load | **Questionable** | Multi-format vs json-specific; distinct |
| taze.io.load_packages vs taze.io.load_package | **Incorrect** | Batch orchestration vs single file — distinct |
| taze.fetch.package_data vs taze.io.load_package | **Incorrect** | HTTP fetch (npm/JSR) vs file I/O — different I/O types |
| taze.check.resolve_dependencies vs taze.check.resolve_dependency | **Incorrect** | Batch vs singular — distinct |
| taze.check.resolve_package vs taze.io.load_package | **Incorrect** | Resolution logic vs file I/O — distinct |
| taze.yarnrc.write vs taze.yarnrc.load | **Incorrect** | Write vs load — distinct |
| taze.fetch.npm_package vs taze.fetch.package_data | **Questionable** | npm-specific vs generic; distinct registries |
| taze.fetch.jsr_package vs taze.fetch.npm_package | **Incorrect** | JSR vs npm — different registries entirely |

**SCH-001 verdict**: 0/18 valid. The judge flagged naming-convention similarity as semantic equivalence. Every flagged span is a distinct operation; the agent correctly dismissed all suggestions (SCH-001 PASS in per-file-eval for all files). This judge has a systematic false-positive pattern on projects with consistent namespace prefixes.

**CDQ-007 (Attribute Data Quality) — 29 advisories**

Two sub-types:

*Filesystem path advisories (4 instances — packageJson.ts line 60, packageYaml.ts lines 31/58/112, packages.ts line 26):*
- Flag `filepath` attributes as high-cardinality / developer-environment-exposing
- `taze.write.file_path` is a registered schema attribute deliberately designed to capture file paths
- The concern is technically valid (absolute paths are high-cardinality) but the schema explicitly sanctions this attribute — the advisory misses the design intent
- **Partially valid** — legitimate concern raised at wrong layer; schema design accepts the tradeoff

*Null/undefined guard advisories (25 instances):*
- Flag property accesses like `packages.length`, `options.write`, `deps.length` as potentially nullable
- Per-file-eval shows CDQ-007 PASS for all files; evaluator confirmed typed TypeScript parameters are non-nullable
- Exception: resolves.ts advisories about `raw.name`, `raw.currentVersion`, `dep.update`, `dep.targetVersion` — per-file-eval explicitly notes these are required non-nullable fields in `RawDep` type, already guarded with null checks, or handled by `result.error` guard pattern
- The judge applies JavaScript defensive programming patterns to well-typed TypeScript code; the TypeScript type system already enforces non-nullability
- **Incorrect** — false positives for typed TypeScript; approximately 23 of 25 invalid

**CDQ-007 verdict**: 4 partially valid (filesystem path concern, though by schema design), ~25 invalid (null guard false positives in TypeScript context). Effective accuracy: ~14%.

**Overall advisory contradiction rate**: 8 valid (CDQ-006) + 4 partially valid (CDQ-007 path) + 43 invalid (SCH-001 + CDQ-007 null) = ~22% accuracy across 55 advisories.

Notable: the CDQ-006 judge performs well; the SCH-001 and CDQ-007 judges are systematic noise sources in TypeScript projects.

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All files, spans, attrs, schema changes, cost, live-check, skip list included |
| Accuracy | 4/5 | Structural data accurate; minor cli.ts span count discrepancy (1 vs 2); advisory section dominated by false positives |
| Actionability | 3/5 | CDQ-006 advisories genuinely actionable (8 valid findings); SCH-001 and CDQ-007 null guards are noise requiring manual triage |
| Presentation | 5/5 | Clean markdown, good table structure, short-lived process guidance is a high-quality bonus |
| **Overall** | **4.25/5** | Structural summary excellent; advisory signal-to-noise is the limiting factor |

---

## Cost

| Source | Amount |
|--------|--------|
| PR total (token table) | $4.93 |
| PRD target | ≤$4.00 |
| Per-file sum (rounded) | $4.63 |
| Delta vs target | +$0.93 |

**$4.93** — $0.93 over the $4.00 per-run target. This is the TypeScript baseline; no prior TS run to compare against. Primary cost driver: `src/io/resolves.ts` at $1.40 (1 attempt, 6 spans, 83.5K tokens — complex file with 15 functions and multiple I/O patterns). Runner-up: `src/io/packages.ts` at $0.65 (1 attempt, 4 spans). The remaining 12 files averaged $0.24.

**Cost breakdown observations**:
- resolves.ts alone is 28% of total cost
- 9 of 14 files cost ≤$0.21 (well under proportion)
- 2-attempt files (index.ts $0.39, pnpmWorkspaces.ts $0.29, yarnWorkspaces.ts $0.55) add overhead but are not the primary driver
- Baseline suggests TS evals will run approximately $1.00 over the JS target; the complexity of resolves.ts (40% coverage ratio justification, cache patterns, Promise.all) drives the cost

---

## Short-Lived Process Guidance

The PR includes a "Short-Lived Process Setup Guidance" section with:
1. `SimpleSpanProcessor` recommendation for CLIs — **correct** and well-explained
2. `process.exit()` interception pattern — **technically functional** but the PRD setup milestone guidance specified SIGTERM/SIGINT handlers (not process.exit interception). The guidance correctly identifies the root cause of span loss but recommends the more invasive solution; SIGTERM/SIGINT handlers would be less fragile.

The CDQ-001 runtime advisory (span not closed on successful `process.exit()` in cli.ts) is captured in per-file-eval but not surfaced in the advisory findings section. This is a gap — it is a real issue that developers should know about.

---

## First TypeScript PR — Baseline Observations

This is the first PR artifact from a TypeScript eval target. TypeScript-specific observations:

1. **SCH-001 false positive rate is higher than JS runs** — consistent namespace prefixes in TypeScript codebases increase pattern-matching false positives
2. **CDQ-007 null guard advisories are systematically wrong in TypeScript** — the judge was designed for JavaScript and doesn't account for TypeScript's non-nullable type system
3. **CDQ-006 accuracy holds** — the isRecording guard detection is language-agnostic and performs well
4. **Structural accuracy is high** — file counts, span counts, costs, skip list all accurate; the inaccuracy is concentrated in advisory findings
