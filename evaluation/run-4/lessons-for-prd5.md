# Lessons for PRD #5

Captured throughout the run-4 evaluation process. Each section is appended to as observations arise.

## Rubric Gaps

Rules that need to be added, clarified, or rescored.

- **Schema evolution compliance rule needed.** The rubric has no rule that checks whether the agent properly feeds schema extensions forward across files. Schema evolution is the central design feature of the Weaver architecture — if it silently breaks (as in run-4), no rubric rule catches it. Consider adding a rule under Schema Fidelity (e.g., SCH-005: "Schema extensions from file N are visible in file N+1's resolved schema").

## Process Improvements

What worked well, what didn't, and what should change for run-5.

### What worked well
- **Pre-run verification milestone** caught the fresh build requirement and credential validation — no wasted cycles on stale builds or lost PRs.
- **PR summary saved to disk** (`orbweaver-pr-summary.md`) before push attempt. When the test suite blocked PR creation, the full PR content was still available for evaluation. Orbweaver issue #13 from run-3 is verified fixed.
- **Function-level fallback** rescued `journal-graph.js` (4 spans) which had failed in both run-2 and run-3 with oscillation/token budget errors.
- **Cost efficiency**: $5.84 actual vs $67.86 ceiling for 29 files. Prompt caching architecture works well (though in this case it was caching too aggressively — the schema should have changed between files).

### What didn't work
- **End-of-run-only test execution** — 32 test failures discovered only after all 29 files were processed. A per-file static check or unit test run would have caught the `tracer` import bug on file 14 instead of file 29.
- **Schema evolution completely broken** — the central design feature of the Weaver architecture was non-functional. All extensions rejected as "unparseable" due to format mismatch between agent output (string IDs) and parser (expects YAML objects). No file saw extensions from previous files.
- **"Partial" status masks broken code** — files marked "partial" had instrumentation committed that crashes at runtime (ReferenceError). "Partial" should mean "some functions instrumented, tests still pass" not "instrumentation committed but broken."
- **Push authentication failed despite pre-run validation.** `git ls-remote origin` passed at pre-run, but `git push` failed 80 minutes later with "Invalid username or token." The pre-run credential check validates read access, not push access. Run-5 should verify push capability explicitly (e.g., `git push --dry-run` or push a test tag).
- **0-span files produce noisy "commit failed" output.** 10 files correctly received 0 spans, but orbweaver still attempted a per-file git commit for each — generating "Nothing staged to commit" errors that pollute the output and make it harder to spot real failures. Orbweaver should skip the commit step when no changes were made.

### Changes for run-5
- **Verify schema evolution is working** before processing more than 2 files. Add a pre-run check: instrument a test file, verify `agent-extensions.yaml` was written, resolve schema, confirm extensions appear.
- **Track two separate issue streams** from the start: orbweaver software issues (→ GitHub issues) vs evaluation process lessons (→ lessons-for-prd6.md). Run-4 established this pattern mid-stream; run-5 should start with both documents created and the distinction clear.
- **Pre-run push verification.** Replace `git ls-remote origin` with a push-capability check (e.g., `git push --dry-run` to a test branch). Read access alone is insufficient — the 80-minute run is wasted if push fails at the end.
- **Failure deep-dives should cover run-level failures, not just file-level.** Run-4's deep-dive initially focused only on partial files. The push failure, schema evolution breakdown, test suite failure, and commit noise are equally important to document and cross-reference with orbweaver issues. PRD #5 should explicitly list both file-level and run-level failures in the milestone description.

## Evaluation Methodology

Better ways to score, new agent patterns, tooling improvements.

- **Token usage breakdown is a diagnostic tool.** The cache read/write ratio revealed the schema evolution bug before we even looked at the code. When cache reads are 4x input tokens across a 29-file run, it means the prompt isn't changing — which is wrong if schema evolution is supposed to make it change. Consider adding a "schema evolution health check" to the evaluation: compare schemaHashBefore and schemaHashAfter from the run output.
- **Anomalous cost should be a red flag.** $5.84 vs $67.86 ceiling looked like great efficiency, but it was actually a symptom of broken schema evolution. When actual cost is dramatically below ceiling, investigate why before celebrating. Add a "cost sanity check" to the evaluation: if actual < 15% of ceiling, verify the prompt is actually changing between files.
- **Separate orbweaver findings from process lessons immediately.** Run-4 discovered both types simultaneously. Having the findings document and `lessons-for-prd5.md` as parallel documents from the start keeps them from getting mixed.
- **Per-file evaluation methodology is stricter than single-pass.** Run-4's multi-agent per-file evaluation flagged COV-002, COV-004, CDQ-002, and CDQ-006 as failures where run-3's single-pass evaluation passed them. The per-file agents are more thorough but this creates cross-run comparability issues. Run-5 should use the same per-file methodology for consistency. Provide methodology-adjusted scores alongside strict scores when comparing to earlier runs.

## Rubric-Codebase Mapping Corrections

Wrong classifications, missing auto-instrumentation coverage, or mapping errors.

- **Rubric-codebase mapping says commit-story-v2 is a CLI tool (application)** and `@opentelemetry/api` should be in `dependencies`. Per user feedback, commit-story-v2 is actually distributed as a library — `peerDependencies` is correct. The mapping document should be updated.
- **COV-006 evaluation guidance works well.** The decision tree for auto-instrumentation vs manual spans correctly handled the LangGraph gap case. No corrections needed.
- **RST-004 precedence note is valuable.** The "unexported I/O function" exemption guidance (span belongs on calling handler, not private helper) helped evaluate MCP tool files correctly.

## Schema Decisions

Registry changes, attribute decisions, or semantic convention updates that affect future runs.

- **Schema evolution bug means run-4 extensions are unreliable.** Since no file saw extensions from previous files, duplicate/conflicting span names and attributes may exist across files. Run-5 (after the bug is fixed) will produce a different extension set because later files will see what earlier files defined. Don't treat run-4's extension inventory as authoritative.

## Per-File Evaluation Observations

Observations from the full 32-rule per-file evaluation that affect future evaluation methodology.

- **"Partial" status is misleading when changes aren't committed.** summary-graph.js (6 spans), sensitive-filter.js (2 spans), and journal-manager.js (0 spans) are all reported as "partial" in the PR summary, but NONE of their changes exist on the orbweaver branch. The evaluation should compare against the branch state (the deliverable), not the PR summary's self-reported status. PRD #5 should evaluate branch content, not agent claims.
- **CDQ-002 failure is systemic, not per-file.** All 16 files use `trace.getTracer('unknown_service')`. This should be treated as a single agent configuration bug, not 16 independent failures. The rubric scoring should reflect this — one root cause, not 16 rule violations.
- **SCH-001 naming inconsistency correlates with file processing order.** Files processed earlier (collectors, generators) use `commit_story.*` prefix consistently. Files processed later (MCP tools, summary-manager) deviate to `mcp.*`, `summary.*`, `context.*`. This suggests the agent loses naming convention context over the run. Schema evolution would fix this by making earlier span names visible.
- **11 ad-hoc attributes (SCH-002) are all semantically valid.** They follow `commit_story.*` namespace and represent legitimate domain concepts (unsummarized_count, generated_count, etc.). The failure is in the registration machinery (broken schema evolution), not the agent's attribute choices. Run-5 scoring should distinguish "agent invented valid attributes that weren't registered" from "agent used wrong attribute names."
- **NDS-005 advisory finding needs manual verification.** The orbweaver agent's own advisory flagged git-collector.js for a potential NDS-005 regression (try/catch at line 21). Future evaluations should verify this finding against the actual diff.
- **CDQ-006 violations (2 files) are minor.** `toISOString()` is a cheap operation — the `isRecording()` guard is technically correct per rubric but adds no meaningful performance benefit. Consider whether CDQ-006 should have a "cheap computation" exemption.
- **monthly-summary-prompt.js got unused imports despite 0 spans.** The agent added `import { trace, SpanStatusCode } from '@opentelemetry/api'` and `const tracer = trace.getTracer('unknown_service')` to a file that received zero spans. This is a minor agent bug — unused imports should be cleaned up when no spans are added.

## PR Artifact Evaluation Observations

Observations from evaluating the PR summary as a reviewer-facing deliverable.

- **PR summary document is high-quality content, but delivery failed.** The 106KB summary has detailed per-file tables, agent reasoning notes, advisory findings with line numbers, and span category breakdowns. As a review document, it would enable informed merge decisions. But it was never posted as an actual PR because test failures blocked creation. Run-5 should consider orbweaver issue #7 (create draft PR even when tests fail) to bridge this gap.
- **Advisory findings lack severity.** 34 findings presented equally (COV-004 optional enhancements alongside NDS-005 potential regressions). A severity column would help reviewers prioritize. Consider adding severity to the advisory finding output format.
- **Per-file table conflates run state with branch state.** The PR summary reports "partial (12/12 functions)" for summary-graph.js, but those changes were never committed to the branch. Run-5's PR evaluation should verify per-file claims against the actual branch content, not the summary's self-report. Consider adding a `committed: yes/no` column.
- **Token usage section needs interpretation guidance.** The $5.84 vs $67.86 ceiling looks like efficiency but indicates broken schema evolution. A healthy cost ratio range or a "cost anomaly" flag would help reviewers and operators spot issues without OTel/orbweaver expertise.
- **Warnings section is O(n²) and unusable.** Each file's warning repeats the full cumulative extension list. By file 29, this is 40+ IDs per line × 16 lines. A deduplicated summary or per-file delta format would make this section useful.

## Schema Coverage Split — Scoring Methodology for Run-5

The Weaver schema was designed before the summary subsystem existed. ~9 files have no pre-defined span names or attributes in the registry. This changes how SCH rules should be scored.

### Schema-covered vs schema-uncovered files

| Category | Files | SCH-002 expectation |
|----------|-------|---------------------|
| Schema-covered | ~20 files (collectors, journal-graph, integrators, journal-manager, MCP tools, commit-analyzer, journal-paths, config, index, prompt files) | Must use registry attributes — ad-hoc is a real failure |
| Schema-uncovered | ~9 files (summary-graph, summary-manager, summary-detector, auto-summarize, summarize command, daily/weekly/monthly-summary-prompt) | Must invent reasonable attributes following `commit_story.*` namespace conventions |

### Scoring implications

- **SCH-002 (ad-hoc attributes):** For schema-uncovered files, evaluate quality of inventions (namespace adherence, semantic validity, naming convention consistency) rather than registry presence. For schema-covered files, apply normally.
- **SCH-001 (span naming consistency):** More interesting signal for new files — do invented span names follow the established `commit_story.*` pattern? Run-4 showed deviation (`summary.daily.generate` instead of `commit_story.summary.daily_generate`).
- **Schema evolution becomes higher-stakes.** For uncovered files, evolution is the *only* mechanism for cross-file coherence. When file 14 invents a span name, file 21 should see it and build on it.

### Impact on run-4 interpretation

This reframing changes how we should read run-4 results:

- **SCH-002 (11 ad-hoc attributes) is less of a failure than initially scored.** Most ad-hoc attributes come from summary files where invention was required. `commit_story.journal.unsummarized_count`, `commit_story.summarize.generated_count`, etc. follow the namespace, describe real domain concepts, and are reasonable registry candidates. SCH-002 should pass for schema-uncovered files that invented well.
- **SCH-001 (8/37 span names deviating) has a sharper diagnosis.** The deviating names (`summary.daily.generate`, `mcp.server.start`, `context.gather_for_commit`) are specifically from schema-uncovered files. The agent had no naming template to follow. Schema evolution is the mechanism that would propagate the `commit_story.*` convention to these files — but evolution was broken.
- **The run-4 quality score is slightly better than initially calculated.** Rubric scoring milestone should apply the split methodology and note the adjusted interpretation alongside the strict interpretation.
- **Run-5's key test becomes schema evolution for uncovered files.** With evolution fixed, will the agent pick up `commit_story.*` naming from early files and apply it consistently to later summary files? Run-4 couldn't test this at all.

### Design decision: do NOT pre-register summary attributes

Keeping the schema gap preserves a valuable test case — the agent's ability to extend a schema coherently under ambiguity. Pre-registering would test "can the agent follow instructions" (easier) rather than "can the agent extend schema coherently" (harder, more valuable for evaluating orbweaver's architecture).

Run-5 rubric scoring should explicitly track schema-covered vs schema-uncovered as a dimension in scoring output.

## Findings Document Process

Changes to the orbweaver findings workflow for run-5.

### Vocabulary: "findings" not "issues"

Run-4 initially called everything an "issue" in `orb-issues-to-file.md`. This conflated small GitHub issues with PRD-sized architectural work. Starting in run-4 (mid-stream, retroactively applied), the document uses **"findings"** as the umbrella term:

- **PRD** — needs design decisions, multiple milestones, or architectural changes. Create a PRD in spinybacked-orbweaver.
- **Issue** — focused fix with clear acceptance criteria. Create a GitHub issue.

Each finding gets a `recommended_action: PRD | Issue` tag. Run-5 should use this vocabulary from the start.

The run-4 findings document is `evaluation/run-4/orb-findings.md` (renamed from `orb-issues-to-file.md`). The old filename is kept as a historical artifact but is superseded.

### Cross-repo evidence references

Each finding must include an **Evidence** section with file paths relative to the `commit-story-v2-eval` repo root. The implementing AI in spinybacked-orbweaver should clone the eval repo and read the referenced files for full context.

Example format:
```markdown
**Evidence (commit-story-v2-eval repo):**
- `evaluation/run-4/per-file-evaluation.json` → `per_file["src/commands/summarize.js"].rules.NDS-005`
- `evaluation/run-4/rubric-scores.md` → Dimension 1: NDS-005 section
```

Without these breadcrumbs, the implementing AI has no way to find the detailed evaluation evidence that motivates the finding.

### Filename convention

Run-4 used `orb-` prefix filenames (`orb-issues-to-file.md`, `orb-output.log`). The CLI was renamed from `orb` to `orbweaver` (spinybacked-orbweaver #123). Run-5 should use `orbweaver-` prefix for new filenames. Existing historical filenames in run-1 through run-4 are preserved as-is.

## Rubric Scoring Observations

Observations from the rubric scoring aggregation milestone.

- **CDQ-002 criterion shifted between run-3 and run-4.** Run-3 CDQ-002 checked whether `trace.getTracer()` was called with a string argument (pattern check → PASS). Run-4 checks whether the library name is correct (semantic check → FAIL for 'unknown_service'). The underlying bug existed in run-3 but wasn't captured by CDQ-002. Run-5 should use the run-4 (stricter) criterion consistently.
- **CDQ-006 "cheap computation" exemption question.** `toISOString()` is a very cheap operation. Run-3 passed CDQ-006; run-4 fails it. Consider adding a rubric clarification: "trivial type conversions (toISOString, String(), Number()) do not require isRecording() guards." This would make CDQ-006 consistent across runs.
- **Rule-level pass/fail penalizes more files.** Run-4 has 16 instrumented files vs run-3's 11. With rule-level pass/fail scoring (any file fails = rule fails), more files means more surface area for failures. This is mathematically correct but can be misleading in cross-run comparisons. Consider adding per-file instance counts alongside rule-level scores to provide nuance.
- **85% target unreachable without fixing 3 specific bugs.** Under the most favorable scoring variant (methodology-adjusted + split = 73%), fixing CDQ-002 (unknown_service), NDS-005 (expected-condition catches), and COV-001 (index.js root span) — all tracked as orbweaver findings — would reach 22/26 = 85%.

## Carry-Forward Items

Unresolved issues, open questions, and items deferred to run-5.

- **Orbweaver finding #1 (schema evolution)** must be fixed and verified before run-5 starts. This is a blocking prerequisite — without it, the evaluation is testing a fundamentally broken workflow. **Recommended action: PRD.**
- **Orbweaver finding #2 (validation pipeline)** should be fixed before run-5 to avoid repeating the 32-failure pattern. **Recommended action: PRD.**
- **Orbweaver findings #3, #9, #13 (agent code generation bugs)** — expected-condition catches, unknown_service tracer name, index.js root span — are the three fixes needed to reach 85%. **Recommended action: Issues.**
- **Run-5 pre-run verification** should include a schema evolution smoke test: instrument one file, verify extensions written, resolve schema, confirm extensions visible.
- **Run-5 findings document** should be named `orbweaver-findings.md` (not `orb-findings.md`) and use the findings vocabulary from the start.
- **PRD #5 must have an explicit "evaluation process improvements" milestone.** Run-4 discovered significant methodology changes (per-file agents, schema coverage split, findings vocabulary, cross-repo evidence) that are as important as orbweaver software fixes. In run-4 these emerged organically and had to be worked through manually mid-evaluation. PRD #5 should treat evaluation methodology as a first-class deliverable with its own milestone — not something that gets folded into other milestones or discovered ad-hoc. This includes: rubric rule clarifications (CDQ-006 exemption, CDQ-002 criterion), scoring methodology standardization (methodology-adjusted vs strict), and cross-run comparability guidance.
