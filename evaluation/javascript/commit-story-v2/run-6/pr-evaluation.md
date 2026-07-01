# PR Artifact Evaluation — Run-6

**Branch**: `spiny-orb/instrument-1773996478550`
**PR created**: **No** — push failed (4th consecutive run)
**PR summary saved locally**: `orbweaver-pr-summary.md` (renamed from spiny-orb convention — 434 lines)

---

## Push Failure — 4th Consecutive (Escalation)

Push failed with: `fatal: Authentication failed for 'https://github.com/wiggitywhitney/commit-story-v2-eval.git/'`

| Run | Push Result | Mechanism |
|-----|------------|-----------|
| Run-3 | Failed | HTTPS password auth |
| Run-4 | Failed | HTTPS password auth |
| Run-5 | Failed | HTTPS password auth |
| **Run-6** | **Failed** | **HTTPS password auth** |

Issue #183 (closed) added `gh` CLI support and GITHUB_TOKEN guidance. The fix doesn't work because:
1. GITHUB_TOKEN isn't set in the spiny-orb subprocess environment
2. The remote URL uses HTTPS (password auth deprecated by GitHub)
3. The user's credential helper works in the eval repo terminal but not in the subprocess

**This is unacceptable after 4 consecutive failures.** The fix needs a fundamentally different approach — SSH remote URL, pre-configured credential helper, or the `--push-command` override that #183 added but the agent doesn't use.

---

## PR Summary vs Branch State — Critical Discrepancies

The PR summary (`orbweaver-pr-summary.md`) describes the agent's INTENDED instrumentation from the initial processing pass, NOT the final committed state after validation retries. This creates severe discrepancies:

### Tally Discrepancy

| Metric | PR Summary | Output Log | Actual Branch |
|--------|-----------|------------|---------------|
| Succeeded | 21 | 23 | 5 committed |
| Failed | 2 | 0 | 0 |
| Partial | 6 | 6 | 6 |

The PR summary and output log disagree on classification:
- **index.js**: PR summary says "failed: Oscillation detected"; output log says "success (0 spans)"
- **summarize.js**: PR summary says "failed: Validation failed"; output log says "partial (3 spans)"

Neither accurately reflects the branch: only **5 files** have actual instrumentation changes committed.

### Span Name Discrepancy — Most Critical

| File | PR Summary Claims | Actual Branch Code |
|------|------------------|--------------------|
| git-collector.js | `commit_story.git.run`, `commit_story.git.get_previous_commit_time`, `commit_story.git.collect_commit_data` | All 3 spans: `commit_story.context.collect_chat_messages` |
| context-integrator.js | `commit_story.context.gather_context_for_commit` | `commit_story.context.collect_chat_messages` |
| summary-manager.js | `commit_story.journal.generate_and_save_daily_summary` + 3 others | All 3 spans: `commit_story.context.collect_chat_messages` |
| server.js | `commit_story.mcp.server` | `commit_story.context.collect_chat_messages` |
| claude-collector.js | `commit_story.context.collect_chat_messages` | `commit_story.context.collect_chat_messages` (**only match**) |

**A reviewer relying on the PR summary would believe the instrumentation uses semantically correct, diverse span names.** The actual code uses the same name for everything.

### File Status Discrepancy

| File | PR Summary Status | Actual Branch |
|------|------------------|---------------|
| auto-summarize.js | "success" (3 spans) | NOT committed (partial) |
| commit-analyzer.js | "success" (3 spans) | NOT committed (0 spans) |
| context-capture-tool.js | "success" (2 spans) | NOT committed (0 spans) |
| reflection-tool.js | "success" (2 spans) | NOT committed (0 spans) |
| journal-paths.js | "success" (1 span) | NOT committed (0 spans) |

The PR summary claims 7+ files with instrumentation that **don't exist on the branch at all.**

### Schema Extension Discrepancy

PR summary lists 14 span names in "Schema Changes: Registry Attributes Added." The branch has **1** span definition in `semconv/agent-extensions.yaml`:

```yaml
groups:
  - id: span.commit_story.context.collect_chat_messages
    type: span
    stability: development
    brief: "Agent-discovered span: commit_story.context.collect_chat_messages"
    span_kind: internal
```

### Library Discrepancy

PR summary claims: "Libraries installed: @opentelemetry/api, @traceloop/instrumentation-langchain, @traceloop/instrumentation-mcp"

Actual branch: Only `@opentelemetry/api` is imported. No `@traceloop` packages in committed code or package.json.

---

## PR Summary Content Quality (Evaluated as Document)

Despite the discrepancies with branch state, evaluating the PR summary as a document:

### Strengths
- **Agent notes are excellent** — detailed per-file reasoning explaining what was instrumented and why, rule citations (RST-001, RST-004, COV-003), expected-condition catch handling, attribute rationale
- **Span category breakdown** useful — shows external calls vs schema-defined vs service entry points per file
- **Schema changes section** shows evolution — 14 span names + attributes added
- **Cost reporting** clear — $9.72 actual vs $67.86 ceiling
- **Zero-span file reasoning** thorough — each skip decision explained with rule citation

### Weaknesses
- **Summary does not match branch state** — the most fundamental problem. A reviewer cannot trust ANY per-file claim without independently verifying against the diff
- **"21 succeeded" headline is misleading** — only 5 files have committed instrumentation
- **Libraries section lists uninstalled packages** — @traceloop packages appear in the summary but not in code
- **No "Committed Files" vs "Attempted Files" distinction** — the summary treats all processing results equally, with no indication of what survived validation
- **Length**: 434 lines — same as run-5 despite run-5 finding PR-1 recommending compression. No improvement on summary length

### Advisory Findings Analysis

34 COV-004 advisories + 6 CDQ-006 advisories + 1 NDS-005 advisory:

**COV-004 advisory quality**: ~25 of 34 contradict correct RST-001/RST-004 skip decisions. The advisory engine does not consume skip decisions — it flags every async/I/O function as needing a span, even when the agent correctly skipped it per restraint rules. This was identified in run-5 (PR-3) and persists.

**CDQ-006 advisory quality**: All 6 flag `.toISOString()` as "expensive computation." Per the rubric-codebase mapping, `toISOString()` is explicitly listed as a CHEAP operation. The CDQ-006 advisory engine incorrectly classifies cheap operations.

**NDS-005 advisory**: Flags git-collector.js line 21 try/catch as "missing from instrumented output." This is on `runGit`, which was NOT instrumented — the advisory is evaluating a function the agent didn't touch.

**Advisory contradiction rate**: ~26/34 advisories (76%) contradict correct skip decisions. Run-5 was 28/34 (82%). Marginal improvement but the advisory engine still doesn't consume skip decisions.

---

## Reviewer Utility Assessment

**"Does the PR help a reviewer understand what the agent did and make informed merge decisions?"**

**Score: 2/5 (Poor)**

- A reviewer who reads ONLY the PR summary would believe the instrumentation is well-designed with correct span names, diverse schema extensions, and 21 passing files. This is substantially wrong.
- A reviewer who checks the diff would immediately see the mismatch — all span names are `commit_story.context.collect_chat_messages`, not the diverse names the summary claims.
- The agent notes ARE valuable for understanding intent and reasoning, but they describe intended behavior, not actual committed behavior.
- The PR summary's value as a review document is severely undermined by the branch-state discrepancies.

**Root cause**: The PR summary is generated from the first processing pass (before validation retries). When the validator rejects span names and forces retries, the summary is not regenerated to reflect the final state.

---

## Findings

### From this evaluation:

- **RUN6-15 (High)**: PR summary does not reflect final branch state — span names, file statuses, schema extensions, and library claims all diverge from committed code. Root cause: summary generated before validation retries.
- **RUN6-16 (Medium)**: Advisory contradiction rate remains high (76%). CDQ-006 advisories incorrectly flag cheap operations (.toISOString()). Advisory engine still doesn't consume skip decisions (PR-3 from run-5).

### Persistent from run-5:

- **PR-1** (PR length): Not improved — still 434 lines
- **PR-3** (Advisory contradictions): Not improved — 76% contradiction rate
- **Push auth**: 4th consecutive failure — see RUN6-2

---

## Comparison with Run-5

| Aspect | Run-5 | Run-6 |
|--------|-------|-------|
| PR created | No (push failed) | No (push failed) |
| Summary accuracy | Per-file table accurate (17 spans matched) | **Per-file table inaccurate** — span names, statuses, schemas all wrong |
| Summary length | 430 lines | 434 lines (no improvement) |
| Advisory contradictions | 28/34 (82%) | ~26/34 (76%) — marginal improvement |
| Agent notes quality | Good | **Excellent** — more detailed rule citations, expected-condition reasoning |
| Reviewer utility | 3/5 | **2/5** — accuracy regression despite better notes |

**Run-5's PR summary was accurate but too long. Run-6's is equally long AND inaccurate.** The accuracy regression is more damaging than the length issue.
