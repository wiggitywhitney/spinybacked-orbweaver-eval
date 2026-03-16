# Progress Log

Development progress log for commit-story-v2-eval. Tracks implementation milestones across PRD work.

Entry format: `- (YYYY-MM-DD) Description of feature-level change (PRD #X, milestone)`

## [Unreleased]

### Added
- (2026-03-13) Moved Weaver schema to canonical `semconv/` location on main (PRD #3, pre-run preparation)
- (2026-03-13) Added `orb.yaml`, `src/instrumentation.js`, and OTel peerDependencies as permanent eval config on main (PRD #3, pre-run preparation)
- (2026-03-13) Added graceful shutdown handling to OTel SDK init file (PRD #3, pre-run preparation)
- (2026-03-13) Added "Draft PRD #4" milestone to create self-improving evaluation chain (PRD #3)
- (2026-03-13) Completed evaluation run-3: 17/21 files succeeded, 4 failed. Documented 11 orb issues with acceptance criteria tied to practice files (PRD #3, evaluation run-3)
- (2026-03-13) Increased maxTokensPerFile to 150000 in orb.yaml — rescued commit-analyzer.js from token budget failure (PRD #3, evaluation run-3)
- (2026-03-13) Completed per-file evaluation: full 31-rule rubric on all 21 files — 4/4 gates pass, 19/26 quality (73%). Discovered stale orb build invalidates run-3 as a test of fixes #61/#64/#65 (PRD #3, per-file evaluation)
- (2026-03-13) Consolidated orb issues doc from 13 to 11 issues — folded token budget disable into #1, sensitive-filter.js into #2 (PRD #3, per-file evaluation)
- (2026-03-13) Completed rubric scoring: synthesized per-file evaluation into run-2-compatible rubric-scores.md with failure classification — 3 stale build repeats, 1 new regression, 2 new findings, 1 schema issue (PRD #3, rubric scoring)
- (2026-03-13) Completed baseline comparison: full 3-run comparison across all dimensions, file outcomes, failure modes, timing, and cross-run trends. Run-3 73% vs run-2 74% — core instrumentation quality (NDS/COV/RST) at 100%, remaining failures in dependency/naming (PRD #3, baseline comparison)
- (2026-03-13) Completed actionable fix output: directive document for orb maintainer with 7 quality failures prioritized by type, 4 failed files with root causes, 3 process issues, and run-2 rubric gap assessment including NDS-006 proposal (PRD #3, actionable fix output)
- (2026-03-13) Drafted PRD #4 for evaluation run-4: encodes run-3 lessons (stale build prevention, credential validation, multi-agent evaluation), carries forward all 7 quality failures and 4 failed files, adds formal milestones for failure deep-dives, PR evaluation, and lessons-for-prd5.md collection (PRD #3, draft PRD #4)
- (2026-03-15) Completed pre-run verification: all 11 run-3 orbweaver issues resolved, all 9 run-2 issues resolved, fresh build verified, git credentials validated, expected score ceiling 96-100% (PRD #4, pre-run verification)
- (2026-03-15) Brought run-3 evaluation artifacts (7 files) from prd-3 branch to run-4 branch for baseline reference (PRD #4, pre-run verification)
- (2026-03-15) Documented 9 new source files since run-3 — run-4 will process ~30 files vs 21 in run-3 (PRD #4, pre-run verification)

- (2026-03-16) Completed evaluation run-4: 29 files processed, 26 success, 3 partial, 0 failed. Rescued journal-graph.js and context-integrator.js from persistent failure. Cost $5.84 in 1h20m (PRD #4, evaluation run-4)
- (2026-03-16) Discovered critical schema evolution bug — agent outputs string IDs, parser expects YAML objects. Schema never evolved across files. Filed as run-4 orb issue #1 (PRD #4, evaluation run-4)
- (2026-03-16) Identified 9 orbweaver issues from run-4: schema evolution, test/retry gaps, missing tracer import, validation gaps, output discoverability, draft PR proposal, LOC-based test cadence (PRD #4, evaluation run-4)
- (2026-03-16) Created lessons-for-prd5.md with rubric gaps, process improvements, methodology observations, and carry-forward items (PRD #4, collect lessons)
- (2026-03-16) Completed failure deep-dives: 3 partial files analyzed (summary-graph.js, sensitive-filter.js, journal-manager.js), 2 rescued files documented, 4 run-level failures analyzed (push auth, schema evolution, test suite, commit noise). Added orb issue #9 (PRD #4, failure deep-dives)
- (2026-03-16) Completed per-file evaluation: full 32-rule rubric on 29 files using multi-agent architecture. Created canonical per-file-evaluation.json artifact. Key findings: CDQ-002 systemic failure (unknown_service tracer name in all 16 files), 8/37 span names deviate from commit_story.* convention, 11 ad-hoc attributes not in registry, NDS-002 gate fail (32 test failures from working-directory-only changes). Discovered partial files have NO changes on branch. Added 3 new orb issues (#10-#12) (PRD #4, per-file evaluation)
- (2026-03-16) Completed PR artifact evaluation: PR not created (blocked by 32 test failures), local summary saved (orbweaver #13 verified fixed). Scored PR content 2.75/5 — high-quality agent notes undermined by delivery failure and accuracy gaps. Orbweaver #12 partially fixed (read-only credential check). Added PR evaluation observations to lessons-for-prd5.md (PRD #4, PR artifact evaluation)
- (2026-03-16) Completed rubric scoring: strict 15/26 (58%), methodology-adjusted 18/26 (69%), schema-split+adjusted 19/26 (73%). API dimension improved 33%→100%, NDS/COV/RST regressed due to new files and stricter per-file evaluation methodology. 2 of 4 persistently failing files rescued. 85% target not met — 3 specific orbweaver fixes needed to reach it (PRD #4, rubric scoring)
- (2026-03-16) Restructured orbweaver findings document: renamed from "issues" to "findings" with PRD/issue classification and cross-repo evidence references. 2 PRD candidates (schema evolution, validation pipeline) + 11 issues identified (PRD #4, rubric scoring)

### Changed
- (2026-03-15) Renamed all "orb" references to "orbweaver" in PRD #4 and evaluation docs to match CLI rename (spinybacked-orbweaver #123)
- (2026-03-15) Added PII acceptance annotation to `commit_story.commit.author` in Weaver registry — git author names are public, accepted with documentation (PRD #4, schema and rubric updates)
- (2026-03-15) Added `commit_story.commit.parent_count` and `commit_story.git.subcommand` to Weaver registry — pre-registering ad-hoc attributes from run-3 SCH-002 findings (PRD #4, schema and rubric updates)
- (2026-03-15) Updated rubric-codebase-mapping COV-006 with OpenLLMetry research — JS package covers LangChain chat models but NOT LangGraph orchestration; manual spans justified for graph nodes (PRD #4, schema and rubric updates)
