# PR Artifact Evaluation — Run-5

Evaluation of the orbweaver-generated PR as a first-class deliverable for evaluation run-5.

**Branch**: `orbweaver/instrument-1773706515431`
**PR summary artifact**: `evaluation/run-5/orbweaver-pr-summary.md` (~430 lines)
**PR on GitHub**: None (push failed — 3rd consecutive run)

---

## 1. PR Creation Status

**Result**: No GitHub PR created.

Push failed with `remote: Invalid username or token. Password authentication is not supported for Git operations.` The orbweaver tool's git subprocess uses HTTPS authentication, but the token isn't propagated correctly to the subprocess. Pre-run `git push --dry-run` succeeded because it used SSH (the user's configured remote), not the orbweaver tool's HTTPS path.

This is the 3rd consecutive run where push fails. All evaluation runs (3, 4, 5) lost the PR artifact on GitHub. The local `orbweaver-pr-summary.md` file serves as fallback, but the PR-as-reviewable-artifact has never been tested in a live PR context.

**Draft PR feature (run-4 finding #6)**: Not tested. Push failure occurs before PR creation, so the draft PR on test failure feature (implemented in orbweaver PR #168) was never exercised. We cannot assess whether it works.

---

## 2. Per-File Table Accuracy

### File Status Claims vs Branch State

| Claimed Status | Count | On Branch? | Verified |
|----------------|-------|------------|----------|
| success (instrumented) | 9 | Yes — all 9 | ACCURATE |
| success (correct skip, 0 spans) | 12 | No (correct) | ACCURATE |
| partial | 6 | No (correct — not committed) | ACCURATE |
| failed | 2 | No (correct — not committed) | ACCURATE |

**Improvement over run-4**: Run-4 had 3 files where the PR summary reported work that was never committed (journal-graph tracer import only, sensitive-filter tracer+regex, journal-manager NDS-003). Run-5 clearly labels these as "partial" and the branch verification in `orbweaver-output.md` explicitly confirms they are absent from the branch.

### Span Count Claims vs Branch State

Verified each committed file's span count by counting `startActiveSpan` calls in `git diff main..orbweaver/instrument-1773706515431`:

| File | Claimed Spans | Actual Spans | Match |
|------|---------------|--------------|-------|
| claude-collector.js | 1 | 1 | Yes |
| git-collector.js | 3 | 3 | Yes |
| context-integrator.js | 1 | 1 | Yes |
| auto-summarize.js | 3 | 3 | Yes |
| server.js | 1 | 1 | Yes |
| context-capture-tool.js | 2 | 2 | Yes |
| reflection-tool.js | 2 | 2 | Yes |
| commit-analyzer.js | 3 | 3 | Yes |
| journal-paths.js | 1 | 1 | Yes |
| **Total** | **17** | **17** | **Yes** |

All span count claims are accurate.

### Span Name Claims vs Branch State

17 span names extracted from branch diffs (all using `commit_story.*` namespace):

```text
commit_story.auto_summarize.generate_daily
commit_story.auto_summarize.generate_monthly
commit_story.auto_summarize.generate_weekly
commit_story.context.collect_chat_messages
commit_story.context.gather_context_for_commit
commit_story.git.collect_commit_data
commit_story.git.get_changed_files
commit_story.git.get_commit_metadata
commit_story.git.get_previous_commit_time
commit_story.git.is_merge_commit
commit_story.git.run
commit_story.journal.ensure_directory
commit_story.mcp.capture_context
commit_story.mcp.journal_add_reflection
commit_story.mcp.save_context
commit_story.mcp.save_reflection
commit_story.mcp.server
```

**Discrepancy found**: The Schema Changes section of the PR summary lists 14 entries in `agent-extensions.yaml`, all matching the committed span names for 8 of 9 files. However, the 3 `auto_summarize.*` span names are used in committed code but NOT registered in `agent-extensions.yaml`. The per-file table's Schema Extensions column shows `—` for auto-summarize.js, which is technically accurate (no extensions were registered), but the span names themselves are schema extensions in practice. A reviewer might not notice that 3 span names lack extension registration.

### Schema Extensions Column Accuracy

The Schema Extensions column in the per-file table lists schema extension names for both committed AND partial/failed files. For example:

- summarize.js (FAILED): shows 12 schema extension names including `commit_story.summary.daily`, `commit_story.summarize.dates_count`, etc.
- journal-graph.js (PARTIAL): shows `commit_story.journal.generate_sections`
- summary-graph.js (PARTIAL): shows 5 extension names
- index.js (FAILED): shows 6 extension names

These extensions exist only in the agent's working state — they were never committed to the branch. A reviewer seeing these names might assume they are delivered, especially since the column doesn't distinguish between committed and aspirational extensions.

### Libraries Column Accuracy

PR summary claims 3 libraries installed: `@opentelemetry/api`, `@traceloop/instrumentation-langchain`, `@traceloop/instrumentation-mcp`. Branch `package.json` diff confirms:

- `@opentelemetry/api` already in `peerDependencies` (unchanged)
- `@traceloop/instrumentation-langchain` added as optional peerDependency
- `@traceloop/instrumentation-mcp` added as optional peerDependency

**Note**: The per-file table attributes libraries to specific files (e.g., server.js → `@traceloop/instrumentation-mcp`). This is the agent's analysis of which files benefit from which auto-instrumentation, not which files caused the dependency to be added. Accurate as intent; could be clearer that the libraries are project-level, not file-level.

---

## 3. Span Category Breakdown Accuracy

The Span Category Breakdown table shows function counts and span categories for ALL 29 files, including failed and partial files:

| Issue | Files Affected | Problem |
|-------|---------------|---------|
| Failed files show non-zero counts | summarize.js (3 entry points), index.js (2 entry points) | These entry points were never instrumented — the file failed. Table shows agent's analysis, not delivered state. |
| Partial file counts not shown | 6 partial files | Table only includes committed + skipped + failed files. Partial files are absent from this section entirely. |

**Assessment**: The table reflects the agent's static analysis of the codebase, not the delivered instrumentation. It has diagnostic value (shows what the agent intended) but could mislead a reviewer about what was actually delivered.

---

## 4. Agent Notes Quality

The Agent Notes section is the PR summary's strongest feature. For each of the 29 files, the agent provides:

- **Instrumentation rationale**: Which functions were instrumented and why
- **Skip rationale**: Which functions were skipped and which rubric rules justify the skip (RST-001 through RST-004)
- **Error handling decisions**: Whether catch blocks are expected-condition or genuine-error, and whether error recording was added
- **Schema decisions**: Which span names and attributes were chosen, whether they're from the registry or extensions
- **Instrumentation ratio**: Percentage of functions instrumented vs the ~20% backstop guideline
- **Variable shadowing checks**: Whether `span` variable conflicts exist
- **Function-level fallback results**: Which functions succeeded/failed in fallback mode, with specific error messages

**Strengths**:
- Reasoning is transparent and reviewable — a human can disagree with specific decisions
- Rule citations (RST-001, COV-003, etc.) make decisions auditable
- Explains borderline decisions explicitly (e.g., commit-analyzer.js NDS-005 borderline)
- Shows what the agent tried AND why it failed for partial files

**Weaknesses**:
- Very long (~300 lines of agent notes alone) — a reviewer would need significant time to process
- Repetitive justifications for zero-span files (the same RST-001 explanation appears 12 times for prompt files)
- No summary-level "key decisions" section — the reviewer must read every file's notes to find the important decisions
- No severity ranking — all files get equal treatment regardless of whether they were straightforward or had significant decisions

---

## 5. Advisory Findings Section

34 advisory findings, broken down:

| Finding Type | Count | Assessment |
|-------------|-------|------------|
| COV-004 (async/I/O functions without spans) | 28 | Mostly noise — the agent deliberately skipped these functions with good reasoning documented in agent notes. The advisory contradicts the agent's own decisions. |
| CDQ-006 (expensive computation without isRecording guard) | 5 | Legitimate but exempted by rubric clarification (cheap computation exemption). |
| NDS-005 (error handling structure) | 1 | The single NDS-005 advisory for git-collector.js is a false positive — the agent restructured try/catch for span lifecycle, which is standard practice. |
| CDQ-008 (tracer naming) | 1 | Positive finding (consistent naming confirmed). |

**Assessment**: The advisory findings section adds noise without value for most findings. 28 of 34 are COV-004 suggestions for functions the agent explicitly chose not to instrument — this creates a "boy who cried wolf" problem where a reviewer stops reading advisories because most are contradicted by the agent's own reasoning. The advisory engine doesn't have access to the agent's skip decisions, creating internal contradiction in the PR description.

---

## 6. Token Usage and Cost

| Metric | Value |
|--------|-------|
| Cost ceiling | $67.86 |
| Actual cost | $9.72 |
| Ratio | 14.3% of ceiling |
| Input tokens | 412,227 |
| Output tokens | 499,167 |
| Cache read tokens | 1,632,219 |
| Cache write tokens | 135,212 |
| Model | claude-sonnet-4-6 |

**Comparison to run-4**: $9.72 vs $5.84 (66% increase). The cost increase is expected — the validation/retry loop adds multiple LLM calls per file. Run-4's anomalously low cost (8.6% of ceiling) was a symptom of broken schema evolution. Run-5's 14.3% is closer to expected but still well below ceiling, suggesting the validation retries don't dominate total cost.

**Missing**: No per-file cost breakdown. The token usage section reports project-level totals only. With 6 partial + 2 failed files going through retry loops, per-file costs would help identify which files are expensive and whether retry budgets are being used effectively.

---

## 7. Live-Check Compliance

**Reported**: "OK"

**Assessment**: Misleading. The entry point file (index.js) failed instrumentation and was restored to its original uninstrumented state. Live-check ran against uninstrumented code and reported "OK" — which is technically true (uninstrumented code doesn't violate any OTel compliance rules) but provides zero validation that instrumentation actually works.

This is documented as finding DEEP-6 in `orbweaver-findings.md`. Live-check should report "DEGRADED" when the entry point fails instrumentation, not "OK."

Additionally, live-check cannot catch NDS-005b violations (expected-condition catches recorded as errors) because `recordException()` on an expected-condition catch produces structurally valid OTel. This is a known limitation, not a PR artifact issue.

---

## 8. Warnings Section

Lists 3 items:
1. summarize.js failure with full validation error message
2. index.js failure with oscillation details
3. SDK init file pattern mismatch

**Assessment**: Appropriate — surfaces the important failures without burying them. The full validation error messages are verbose but useful for diagnosis.

---

## 9. Reviewer Experience Assessment

**Question**: Does this PR summary help a reviewer understand what the agent did and make informed merge decisions?

### What works well

1. **Per-file table as executive summary**: Quick scan of all 29 files with status, spans, and libraries. A reviewer can immediately see what changed.
2. **Transparent reasoning**: Agent notes explain every decision. A reviewer can disagree with specific choices.
3. **Schema changes section**: Clear list of what was added to the registry.
4. **Warnings section**: Important failures surfaced prominently.
5. **Partial/failed file reporting**: Clear labeling with function-level detail (e.g., "partial (11/12 functions)").

### What doesn't work

1. **Length (~430 lines)**: Too long for a practical review. A reviewer would need 30+ minutes to read thoroughly. The agent notes section alone is longer than most PRs.
2. **No "what changed" summary at the top**: The Summary section has counts but no narrative. Missing: "Added 17 spans across 9 source files covering git operations, context collection, MCP tools, and auto-summarization."
3. **Schema extensions column misleading for partial/failed files**: Shows extension names that were never delivered, without visual distinction from committed extensions.
4. **Span Category Breakdown includes non-delivered files**: Shows analysis for failed files as if they were instrumented.
5. **Advisory findings contradict agent notes**: 28 COV-004 advisories suggest instrumenting functions the agent explicitly chose to skip. This undermines reviewer confidence in both sections.
6. **No aggregate metrics**: Missing total spans committed, total attributes set, percentage of codebase covered, before/after test results.
7. **No diff previews**: A reviewer must switch to the diff view and cross-reference by file. Inline code snippets of the instrumentation pattern would help.
8. **Token usage lacks per-file breakdown**: Can't tell which files consumed the most budget or how many retries occurred.

### Comparison to run-4 PR artifact

| Aspect | Run-4 | Run-5 | Change |
|--------|-------|-------|--------|
| PR on GitHub | No (push failed) | No (push failed) | Same |
| Per-file table accuracy | 3 files with phantom changes | All accurate | Improved |
| Agent notes | Not evaluated (run-4 format) | Extremely detailed | New feature |
| Advisory findings | Not present | 34 findings | New feature |
| Schema changes | Not tracked | 14 extensions listed | New feature |
| Function-level fallback reporting | Not present | Shows per-function results | New feature |
| Live-check compliance | Not reported | Reported (but misleading) | New feature |
| Token usage | Not detailed | Ceiling + actual + breakdown | New feature |

Run-5's PR summary is significantly more comprehensive than run-4's. The per-file table accuracy fix (no phantom changes) and the function-level fallback reporting are genuine improvements.

---

## 10. Summary of PR Evaluation Findings

### Accuracy

- **Per-file status**: ACCURATE (all 29 files correctly categorized)
- **Span counts**: ACCURATE (all 17 spans verified)
- **Span names**: 14/17 registered in agent-extensions.yaml; 3 auto_summarize names used but not registered
- **Branch state**: ACCURATE (no phantom changes — improvement over run-4)
- **Libraries**: ACCURATE
- **Schema extensions column**: MISLEADING for partial/failed files (shows undelivered extensions without distinction)
- **Span Category Breakdown**: MISLEADING (includes analysis for non-delivered files)
- **Live-check**: MISLEADING ("OK" on uninstrumented entry point)

### Quality for Reviewers

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | High | Every file documented with reasoning |
| Accuracy | High (with caveats) | Per-file status correct; schema extensions and live-check misleading |
| Actionability | Medium | Agent notes provide basis for review, but length and noise reduce usability |
| Conciseness | Low | ~430 lines, repetitive skip justifications, advisory noise |
| Trustworthiness | Medium | Verified accurate for committed files; schema extensions and live-check sections erode trust |

### New findings for orbweaver

| ID | Description | Priority | Category |
|----|-------------|----------|----------|
| PR-1 | Schema extensions column should distinguish committed vs aspirational extensions | Low | PR quality |
| PR-2 | Span Category Breakdown should exclude non-delivered files (or clearly mark them) | Low | PR quality |
| PR-3 | Advisory findings engine should consume agent skip decisions to avoid contradictions | Medium | PR quality |
| PR-4 | Add aggregate metrics to PR summary (total spans, attributes, coverage %) | Low | PR quality |
| PR-5 | Add per-file cost/retry breakdown to token usage section | Low | Diagnostics |
| PR-6 | Zero-span file notes are repetitive — group them instead of explaining each individually | Low | PR quality |
| PR-7 | auto_summarize span names not registered in agent-extensions.yaml despite being used | Medium | Schema |
