# Failure Deep-Dives — Run-8

Root cause analysis for partial/failed files and run-level failures.

---

## File-Level Failures

### journal-graph.js — Partial (Regression from Run-7)

**Run-7**: Committed (4 spans, 1 attempt)
**Run-8**: Partial (3 spans, 3 attempts, 70.4K output tokens)
**Failure reason**: "Reassembly validation failed — using partial results"

**What happened**: The agent attempted to instrument journal-graph.js three times. On the final attempt, it fell back to function-level instrumentation (12/12 functions marked "instrumented") but with most functions showing 0 spans. The reassembly validator rejected the output.

**Verbose output analysis**:
- The agent correctly identified the 4 async AI orchestration functions (summaryNode, technicalNode, dialogueNode, generateJournalSections) as span targets
- It correctly noted that the node functions are "unexported by declaration but re-exported via the named export block"
- On the final attempt, it fell back to function-level coverage (12/12 functions) but most with 0 spans
- The "Reassembly validation failed" error suggests the reconstructed file didn't pass validation after 3 attempts

**Root cause hypothesis**: journal-graph.js is the most complex file in the codebase (19 functions, LangGraph state machine, mixed sync/async). The 70.4K output tokens (vs 3.8K for claude-collector.js) shows the agent struggled significantly. The reassembly validator may be rejecting valid-looking code due to the complexity of the LangGraph state machine pattern.

**Token cost**: 70.4K output tokens for one partial file = 42% of all output tokens (166.9K total). This is a significant cost sink for zero committed value.

**Run trajectory**:
- Run-4: 3 spans, committed
- Run-5: partial (validation pipeline issue)
- Run-6: partial (SCH-001 blocking)
- Run-7: 4 spans, committed (best result)
- Run-8: 3 spans, partial (regression)

This file oscillates between committed and partial. The root cause appears to be non-deterministic — the same code produces different results across runs.

**Recommendation**: Investigate the reassembly validator's behavior on complex files. The file works sometimes (run-4, run-7) but fails other times, suggesting the issue is sensitivity to LLM output variation rather than a fundamental limitation.

---

## Run-Level Failures

### Push Auth — 6th Consecutive Failure

**Error**: `remote: Invalid username or token. Password authentication is not supported for Git operations.`
**Display URL**: `Pushing to https://github.com/wiggitywhitney/commit-story-v2-eval.git`

**Analysis of the fix (PR #251)**:

The fail-fast fix works correctly for **missing GITHUB_TOKEN** — it throws before file processing. But in run-8, GITHUB_TOKEN was present (vals injected it), so the fail-fast path was not taken. The three-part logic:

1. **Token present + HTTPS** → Token-embedded URL validation via `git ls-remote` → **PASSED** (read access works)
2. **No token + HTTPS GitHub** → Fail fast → **Not triggered** (token exists)
3. **Fallback** → Not reached

The validation passed because `git ls-remote` with a token-embedded URL checks **read** access, and the token has read permissions. But push requires **write** access. The validation doesn't distinguish read-only tokens from read-write tokens.

**Why the push failed**: Three possible causes:
1. **Token scope insufficient**: The GITHUB_TOKEN from vals might have `contents: read` but not `contents: write` scope
2. **Token format**: GitHub's "Password authentication is not supported" error appears for both invalid tokens and tokens sent via password auth instead of the expected URL-embedded format
3. **URL construction**: The push URL shown (`https://github.com/...`) lacks the token — either git sanitized it for display, or the token embedding didn't work for the push path

**Recommendation**: The fix needs to validate **write** access specifically. Options:
1. Use `git push --dry-run` during validation (actually tests write access)
2. Use the GitHub API (`POST /repos/{owner}/{repo}/git/refs`) to verify write scope
3. At minimum, check the token has `repo` scope via the GitHub API before proceeding

**Key insight**: The fail-fast fix improved the "missing token" case but the actual problem in production is "token present but unusable for push." The 5 runs before PR #251 likely had the same issue — the token was available but couldn't push.

---

## Unmasked Bug Detection

### CDQ-005 Count Attribute Types (Confirmed Still Failing)

With COV-006 resolved, CDQ-005 is now the most prominent remaining quality failure. The prompt-only fix (SCH-003 guidance) was insufficient because:

1. The agent reads the schema accumulator, which carries `type: string` declarations from file 3 (summarize.js)
2. Later files (auto-summarize.js, summary-manager.js, summary-detector.js) see `dates_count: string` in the accumulated schema and follow it
3. The SCH-003 prompt guidance says "count attributes use type: int" but the agent prioritizes schema conformance over prompt guidance
4. The agent explicitly notes: "registered in the schema as string type, so values are passed as String() conversions"

**Root cause**: The first file to declare count attributes (summarize.js) chose `type: string`, and the schema accumulator propagated this to all subsequent files. The fix needs to either:
1. Add a validator that rejects `*_count` attributes with non-int types (post-generation check)
2. Pre-seed the schema accumulator with `type: int` for count patterns
3. Make the SCH-003 guidance stronger: "Count attributes (*_count) MUST be type: int. Override any accumulated schema that says string."

### Dominant Blocker Peeling Assessment

The pattern continues:
- Run-5: COV-003 (blocks all validator-affected files)
- Run-6: SCH-001 (blocks schema-uncovered files)
- Run-7: COV-006 (span collision) + CDQ-005 (count types)
- Run-8: CDQ-005 (count types) + journal-graph.js regression

Severity continues decreasing. CDQ-005 is a type annotation issue (doesn't affect functionality). The journal-graph.js regression is non-deterministic (worked in run-7).
