# Actionable Fix Output — Run-6

This document is the handoff from evaluation run-6 to the spiny-orb team. It is designed to be **self-contained** — everything the spiny-orb Weaver needs is here. Evidence paths reference evaluation artifacts on branch `feature/prd-6-evaluation-run-6` in `commit-story-v2-eval` for drill-down, but this document should be sufficient without reading them.

**Run-6 result**: 21/25 (84%) canonical quality, 5 files committed — regression from run-5 (92%, 9 files). Both quality and coverage declined.

**Cost**: $9.72 actual / $67.86 ceiling (14.3%). Cost/file nearly doubled from run-5 ($1.08 → $1.94). Low total cost likely because some API calls terminated early (laptop sleep). True cost of a clean full run would be higher.

**Evaluation artifacts** (on branch `feature/prd-6-evaluation-run-6`):

| Document | Path | What it contains |
|----------|------|-----------------|
| Per-file evaluation (canonical) | `evaluation/run-6/per-file-evaluation.json` | 31-rule evaluation for all 29 files |
| Per-file evaluation (rendered) | `evaluation/run-6/per-file-evaluation.md` | Human-readable version |
| Rubric scores (canonical) | `evaluation/run-6/rubric-scores.json` | Dimension-level aggregation |
| Rubric scores (rendered) | `evaluation/run-6/rubric-scores.md` | Human-readable version |
| Failure deep-dives | `evaluation/run-6/failure-deep-dives.md` | Root cause analysis per file |
| Baseline comparison | `evaluation/run-6/baseline-comparison.md` | 5-run trend analysis |
| PR evaluation | `evaluation/run-6/pr-evaluation.md` | PR summary accuracy assessment |
| Spiny-orb findings | `evaluation/run-6/spiny-orb-findings.md` | All 16 findings with acceptance criteria |
| Lessons for PRD #7 | `evaluation/run-6/lessons-for-prd7.md` | Process improvements, rubric gaps |
| Spiny-orb output log | `evaluation/run-6/spiny-orb-output.log` | Raw run output |
| Spiny-orb branch | `spiny-orb/instrument-1773996478550` | The actual instrumented code |

---

## §1. Run-6 Score Summary

| Dimension | Score | Run-5 | Delta | Failures |
|-----------|-------|-------|-------|----------|
| NDS | 2/2 (100%) | 2/2 | — | — |
| COV | 3/5 (60%) | 3/5 | — | COV-001 (persistent), COV-005 (persistent) |
| RST | 3/4 (75%) | 4/4 | **-25pp** | RST-004 (new) |
| API | 3/3 (100%) | 3/3 | — | — |
| SCH | 3/4 (75%) | 4/4 | **-25pp** | SCH-001 (new systemic) |
| CDQ | 7/7 (100%) | 7/7 | — | — |
| **Total** | **21/25 (84%)** | **23/25 (92%)** | **-8pp** | 4 rules fail |
| **Gates** | 5/5 | 5/5 | — | — |
| **Per-run rules** | 4/4 | 4/4 | — | API-002, API-003, API-004, CDQ-008 all pass |
| **Files** | **5** | 9 | **-4** | — |

**Three dimensions are solved problems**: NDS, API, CDQ have been at 100% for 2-3 consecutive runs. These require no further fixes — the agent reliably preserves signatures, uses correct dependencies, and writes quality OTel code.

**Cost trend**:

| Run | Cost | Files | Cost/File |
|-----|------|-------|-----------|
| Run-3 | $4.20 | 17 | $0.25 |
| Run-4 | $5.84 | 16 | $0.37 |
| Run-5 | $9.72 | 9 | $1.08 |
| Run-6 | $9.72 | 5 | $1.94 |

**Quality × files product is declining every run**: 12.4 → 9.3 → 8.3 → 4.2. If this trend continues without registry expansion, run-7 could have ~3 files. The coverage decline is structural — as validation becomes stricter, fewer files can pass without matching registry definitions.

---

## §2. Remaining Quality Rule Failures

### CRITICAL: SCH-001 — Single-Span Registry Forces Name Mismatch

**What's wrong**: The Weaver registry defines exactly 1 span: `commit_story.context.collect_chat_messages`. The validator enforces strict SCH-001 conformance. When the agent needs a span name for a non-chat operation (git collection, context integration, summary generation, MCP server), it faces a choice:
- Use the registered name → passes validator, but semantically wrong
- Invent a correct name → fails validator, file stays partial

4/5 committed files chose compliance. ALL 6 partial files + index.js couldn't — their operations are too far from "collect chat messages."

**Impact**: This is the **dominant blocker** for run-6. SCH-001 appears in every partial file. It is the SOLE blocker for journal-manager.js (9/10 functions pass; only saveJournalEntry blocked by SCH-001).

**Files blocked by SCH-001** (with the span names the agent would correctly use):

| File | Correct span name | Status |
|------|------------------|--------|
| index.js | `commit_story.cli.main`, `commit_story.cli.summarize` | 0 spans (COV-001 fail) |
| journal-manager.js | `commit_story.journal.save_journal_entry` | Partial (9/10) |
| auto-summarize.js | `commit_story.auto_summarize.*` | Partial (1/3) |
| journal-graph.js | `commit_story.ai.technical_decisions` | Partial (10/12) |
| summary-graph.js | `commit_story.summary.daily_node` | Partial (13/15) |
| summary-detector.js | `commit_story.summary.find_*` | Partial (5/11) |
| summarize.js | `commit_story.summarize.run_*` | Partial (7/8) |
| git-collector.js | `commit_story.git.*` (committed with wrong name) | Committed but SCH-001 FAIL |
| context-integrator.js | `commit_story.context.gather_*` (committed with wrong name) | Committed but SCH-001 FAIL |
| summary-manager.js | `commit_story.summary.generate_*` (committed with wrong name) | Committed but SCH-001 FAIL |
| server.js | `commit_story.mcp.server` (committed with wrong name) | Committed but SCH-001 FAIL |

**Desired outcome**: Add span definitions to the Weaver registry covering all commit-story domain operations. Target: at least 8 span definitions.

**Acceptance criteria**:
1. Registry has span definitions for: CLI entry (`commit_story.cli.*`), git collection (`commit_story.git.*`), context gathering (`commit_story.context.gather_*`), journal generation (`commit_story.journal.*`), summary generation (`commit_story.summary.*`), auto-summarization (`commit_story.auto_summarize.*`), MCP server (`commit_story.mcp.*`), summary detection (`commit_story.summary_detector.*`)
2. journal-manager.js commits with a semantically correct span name
3. All committed files use span names that describe their actual operations

**Finding cross-references**: RUN6-3, RUN6-9, RUN6-12

---

### HIGH: COV-001 — Entry Point (index.js) Still Has No Span

**What's wrong**: The main CLI entry point `src/index.js` has 0 spans. The agent attempted instrumentation (3 attempts, 70K output tokens, $1.33) but validation rejected it every time. Two interacting blockers:

1. **COV-003 boundary gap**: The catch block at line 178 wraps `triggerAutoSummaries()` and intentionally swallows errors (don't block main flow). The DEEP-1 fix covers ENOENT-style catches but NOT this "swallow-and-continue" pattern.
2. **SCH-001 registry gap**: The agent correctly named the span `commit_story.cli.main` but the name isn't registered.

**Persistent since**: Run-4 (3 consecutive failures, different root cause each run)

**Run-by-run**: Run-4: CDQ-002 + multiple issues → Run-5: oscillation (fixed by RUN-1) → Run-6: COV-003 boundary + SCH-001

**Desired outcome**: `main()` in index.js gets a root span.

**Acceptance criteria**:
1. COV-003 exemption covers swallow-and-continue catches (`try { nonCriticalOp() } catch {}`)
2. Registry has `commit_story.cli.main` (or similar) span definition
3. index.js commits with a root span on main()

**Finding cross-references**: RUN6-8

---

### MEDIUM: COV-005 — server.js Has Zero Attributes

**What's wrong**: `src/mcp/server.js` has a span on `main()` but zero `setAttribute` calls. The span exists but carries no useful trace information.

**Persistent since**: Run-5

**Desired outcome**: Server startup span includes domain-relevant attributes.

**Acceptance criteria**: At minimum: service name attribute. Optional: transport type, server version.

**Finding cross-references**: RUN6-14

---

### MEDIUM: RST-004 — git-collector.js Unexported Functions Instrumented

**What's wrong**: The agent instrumented `getCommitDiff` (line 79) and `getMergeInfo` (line 115) — both are unexported internal functions, explicitly listed in the rubric-codebase mapping as RST-004 violations. They're internal to the exported `getCommitData`.

**New in run-6** — the agent instrumented the internals instead of the exported function, likely because `getCommitData` would need a span name not in the registry (SCH-001 cascade effect).

**Desired outcome**: Agent instruments `getCommitData` (exported orchestrator), not its internal helpers.

**Acceptance criteria**: getCommitData has a span. getCommitDiff, getMergeInfo, getCommitMetadata do NOT.

**Finding cross-references**: RUN6-13

---

## §3. Remaining Failed/Partial Files

### index.js — 0 spans, 3 attempts (COV-001 FAIL)

- **Root cause**: COV-003 boundary gap (swallow-and-continue catch) + SCH-001 (no CLI span in registry)
- **Run-5 improvement**: RUN-1 oscillation detection working — no more infinite retry loops. But still can't commit.
- **Fix path**: Expand COV-003 exemption + add registry span definition
- **Effort estimate**: Both blockers need fixing; either alone is insufficient

### summarize.js — Partial (7/8 functions)

- **Root cause**: COV-003 boundary gap (per-item-failure-collection catch in `runMonthlySummarize`) + SCH-001
- **Improvement over run-5**: From "failed entirely" to 7/8 functions — DEEP-1 helped
- **Fix path**: COV-003 per-item catch exemption + registry spans

### journal-graph.js — Partial (10/12 functions)

- **Root cause**: SCH-001 (span names not registered) + NDS-003 (modified `return {` statement in `generateJournalSections`)
- **Fix path**: Registry expansion + NDS-003 fix for return-value capture pattern

### summary-graph.js — Partial (13/15 functions)

- **Root cause**: SCH-001 oscillation on `dailySummaryNode` (RUN-1 correctly detected) + COV-003 try/finally pattern on `monthlySummaryNode`
- **Fix path**: Registry expansion + COV-003 try/finally exemption

### auto-summarize.js — Partial (1/3 functions) — REGRESSED from run-5

- **Root cause**: SCH-001 + COV-003 (per-item catch) + NDS-003 (modified `return {` in `triggerAutoSummaries`)
- **Regression**: Was committed in run-5 (with COV-005 fail). Run-6's stricter SCH-001 enforcement blocked it.
- **Fix path**: Registry expansion + COV-003 per-item catch exemption + NDS-003 fix

### journal-manager.js — Partial (9/10 functions)

- **Root cause**: SCH-001 ONLY on `saveJournalEntry` — the agent got everything else right
- **HIGHEST-ROI fix**: Add `commit_story.journal.save_journal_entry` to registry → this file commits immediately
- **Fix path**: Single registry entry

### summary-detector.js — Partial (5/11 functions)

- **Root cause**: COV-003 (directory-not-found catches) + SCH-001 + NDS-003 (multiple functions)
- **Most complex**: All three persistent issues converge. 6 functions blocked by different combinations.
- **Fix path**: Registry expansion + COV-003 exemptions + NDS-003 fixes

### Regressions from Run-5 (4 files)

| File | Run-5 | Run-6 | Cause | Fix |
|------|-------|-------|-------|-----|
| auto-summarize.js | Committed (COV-005) | Partial (1/3) | SCH-001 strictness | Registry expansion |
| context-capture-tool.js | Committed (1 span) | 0 spans | RST-004 vs COV-004 tension | Clarify rule precedence |
| reflection-tool.js | Committed (1 span) | 0 spans | RST-004 vs COV-004 tension | Clarify rule precedence |
| journal-paths.js | Committed | 0 spans | SCH-001 forced removal | Registry expansion |

---

## §4. Run-5 Finding Assessment

**All 22 run-5 findings were fixed by the spiny-orb team (none rejected).** However, some fixes revealed new issues:

| Run-5 Finding | Fix Status | Run-6 Outcome |
|--------------|-----------|---------------|
| DEEP-1 (COV-003 exemption) | Fixed (#180) | **Partially working** — covers ENOENT but 3 boundary gaps remain |
| RUN-1 (oscillation detection) | Fixed (#181) | **Working** — detected and stopped oscillation on 2 files |
| DEEP-4 (duplicate JSDoc) | Fixed (#189) | **Working** — no JSDoc-caused NDS-003 violations |
| EVAL-1 (schema attrs) | Fixed (#184) | **Working** — agent invents domain-relevant attributes |
| Push auth (#183) | Fixed | **NOT working in practice** — 4th consecutive failure |
| DEEP-2/2b (function fallback) | Fixed (#178) | **Working** — function-level results visible |
| DEEP-7 (syntax check) | Fixed (#187) | **Working** — caught corrupted import in summary-manager |
| PR-3 (advisory contradictions) | Fixed (#185) | **NOT working** — 76% contradiction rate persists |
| RUN-3 + RUN-5 (tally) | Fixed (#188) | **Partially** — tally still inflated (23 succeeded vs 5 committed) |
| All others | Fixed | **Working** as expected |

**Summary**: 17/22 fully working, 3 partially working (boundary gaps), 2 not working in practice.

---

## §5. Run-6 Rubric Gap Assessment

| Gap | Description | Recommendation |
|-----|-------------|---------------|
| **COV-003 boundary expansion** | DEEP-1 covers ENOENT only. Three patterns need exemption: per-item-collection, swallow-and-continue, try/finally. | Expand `isExpectedConditionCatch()` to recognize all three patterns |
| **SCH-001 validator vs evaluator conflict** | Validator enforces strict registry conformance. Rubric-codebase mapping says quality guideline. | Align: either validator accepts schema extensions or registry expands |
| **RST-004 vs COV-004 precedence** | Unexported async functions with file I/O: RST-004 says skip, COV-004 says cover. | Add precedence rule to rubric (recommendation: RST-004 wins for unexported) |
| **No rule for validation-caused regression** | auto-summarize committed in run-5, partial in run-6 due to stricter validation. | Consider tracking validation-caused regressions separately |
| **Tally should reflect branch state** | "23 succeeded" vs 5 committed misleads. | Tally categories: committed-with-spans, correct-skip, not-committed |
| **PR summary must reflect post-validation state** | Summary shows pre-validation intentions, not committed code. | Regenerate summary after all validation retries complete |

---

## §6. Run-7 Verification Checklist

1. **SCH-001 registry expansion**: Registry has ≥8 span definitions covering all commit-story operations
2. **COV-003 boundary expansion**: Three new catch patterns exempted — per-item-collection, swallow-and-continue, try/finally
3. **index.js commits with root span**: COV-001 resolved after 3 consecutive failures
4. **journal-manager.js commits**: SCH-001 was sole blocker — should commit immediately with registry expansion
5. **auto-summarize.js recovers**: Regressed from run-5; should recover with SCH-001 + COV-003 fixes
6. **Push authentication works**: 5th run — SSH, credential helper, or `--push-command` used
7. **PR summary reflects branch state**: Span names, file statuses, schema extensions match committed code
8. **Tally reflects branch state**: "N files committed with spans" not "N succeeded"
9. **RST-004 resolved in git-collector**: getCommitData instrumented, not internals
10. **server.js has attributes**: COV-005 resolved
11. **No new regressions**: Files committed in run-6 remain committed
12. **Superficial resolution re-check**: If more files recover from partial→committed, verify NDS-005, CDQ-003, RST-001
13. **Per-file reasoning reports written to disk**: Companion `.instrumentation.md` files exist for committed files
14. **PR summary length reduced**: Target <200 lines (was 434 for 2 consecutive runs)
15. **PR reviewer utility improves**: Target 3/5 or better (was 2/5 in run-6, down from 3/5 in run-5)

---

## §7. Score Projections for Run-7

### Minimum (registry expansion only)

Add ~8 span definitions to the Weaver registry. No COV-003 boundary fixes.

- **SCH-001**: FAIL → PASS (all committed files get correct names)
- **RST-004**: Likely PASS (agent can now instrument exported functions with correct names)
- **COV-001**: Still FAIL (index.js needs COV-003 boundary fix too)
- **COV-005**: Still FAIL (server.js needs prompt improvement)
- **File recovery**: journal-manager.js commits (SCH-001 sole blocker). journal-paths.js likely recovers. auto-summarize.js partially recovers (still has COV-003 issues).
- **Expected score**: 23/25 (92%), **8-10 files**
- **Risk**: New blocker may emerge behind SCH-001

### Target (registry + COV-003 boundaries + push fix)

Expand registry + fix all 3 COV-003 boundary patterns + resolve push auth.

- **SCH-001**: FAIL → PASS
- **RST-004**: FAIL → PASS
- **COV-001**: FAIL → PASS (index.js recovers)
- **COV-005**: Still FAIL (separate fix needed)
- **File recovery**: index.js, journal-manager.js, journal-paths.js, auto-summarize.js, summarize.js commit. Partial files improve significantly.
- **Expected score**: 24/25 (96%), **12-15 files**
- **Risk**: NDS-003 blocks some partial files. Unmasked bugs behind SCH-001.

### Stretch (target + NDS-003 + COV-005 + PR summary)

Fix everything: registry, COV-003, push, NDS-003, COV-005, PR summary.

- **All failures resolved**
- **File recovery**: All 6 partial files commit. context-capture-tool and reflection-tool may recover if RST-004/COV-004 precedence clarified.
- **Expected score**: 25/25 (100%), **15-18 files**
- **Risk**: Unknown unknowns. Dominant-blocker peeling pattern suggests something new will surface.

### Calibration Note

**Discount all projections by 50% for unmasked bug risk.** Run-5 projected 96-100% with 14-16 files. Actual: 84% with 5 files. The dominant-blocker peeling pattern means fixing SCH-001 WILL reveal the next blocker. The minimum tier is the most reliable prediction.

---

## §8. Priority Action Matrix

| Priority | Action | Findings | Impact | Acceptance Criteria |
|----------|--------|----------|--------|-------------------|
| **1 (Critical)** | Expand Weaver registry with ~8 span definitions | RUN6-9, RUN6-3, RUN6-12 | Unblocks journal-manager.js immediately. Partially unblocks 5 other files. Fixes SCH-001 on 4 committed files. | Registry has ≥8 span defs. journal-manager.js commits. |
| **2 (Critical)** | Fix push authentication | RUN6-2 | 4th consecutive failure. No PR created. | Push succeeds and PR is created on actual eval repo. |
| **3 (High)** | Expand COV-003 boundary (3 patterns) | RUN6-10 | Unblocks index.js (COV-001), summarize.js, auto-summarize.js, summary-graph.js, summary-detector.js | index.js main() gets a root span. |
| **4 (High)** | Regenerate PR summary post-validation | RUN6-15 | PR summary currently misleads reviewers. | Span names, statuses, schema extensions match committed code. |
| **5 (High)** | Fix tally to reflect branch state | RUN6-4 | "23 succeeded" vs 5 committed misleads. | Tally shows committed-with-spans count. |
| **6 (Medium)** | Fix NDS-003 return-value capture | RUN6-5 | 3+ partial files blocked. | Agent preserves all original lines byte-for-byte. |
| **7 (Medium)** | Fix advisory engine (skip decision consumption) | RUN6-16 | 76% of advisories are false positives. | Advisories filtered by RST skip decisions. |
| **8 (Medium)** | Add server.js span attributes | RUN6-14 | COV-005 persistent. | Server startup span has service.name attribute. |
| **9 (Medium)** | Write per-file reasoning reports to disk | RUN6-7 | No per-file decision visibility during run. | Each committed file gets companion `.instrumentation.md` at commit time. |
| **10 (Medium)** | Compress PR summary (PR-1 from run-5) | PR-1 | 434 lines for 2nd consecutive run. | Key decisions summary, grouped zero-span notes. Target: <200 lines. |
| **11 (Low)** | Clarify RST-004 vs COV-004 precedence | RUN6-11 | 2 files (context-capture-tool, reflection-tool) affected. | Rubric updated with precedence rule. |
| **12 (Low)** | Add connection-terminated retry | RUN6-1 | Helps with transient failures. | Agent retries on connection-terminated errors. |
| **13 (Low)** | Fix NDS-005 advisory on non-instrumented functions | RUN6-16 | Advisory flags runGit (not instrumented) for NDS-005. | Advisory only evaluates functions the agent actually instrumented. |

---

## §9. Superficial Resolution Tracking

| Rule | Run-5 Status | Run-6 Status | Verdict |
|------|-------------|-------------|---------|
| NDS-005 | Latent (8 violations in partial files) | PASS on summary-manager.js | **Genuinely resolved** |
| CDQ-003 | Latent (partial files) | PASS on summary-manager.js | **Genuinely resolved** |
| RST-001 | Correct skip, monitor | PASS on summary-manager.js | **Genuinely resolved** |

Only 1 file recovered (summary-manager.js), so sample size is small. If run-7 recovers more files, re-verify these 3 rules on each recovered file.

---

## §10. Process Recommendations

These are not spiny-orb code fixes but operational changes for the evaluation workflow:

1. **Run `spiny-orb instrument` in the user's terminal**, not through Claude Code. Provide the exact command and let the user run it. The command takes 30+ minutes, stdout is buffered, and each progress poll requires manual approval. Use `caffeinate -s <command>` on macOS to prevent sleep.
2. **Check for tool renames during pre-run verification.** The CLI was renamed from `orbweaver` to `spiny-orb` between run-5 and run-6 (spinybacked-orbweaver#177). Future runs should verify the tool name hasn't changed again.
3. **CI acceptance gate config (#225)**: The vitest exclude pattern catches `acceptance-gate.test.ts` in CI. Verify this is resolved before relying on CI results.

## §10b. Rubric-Codebase Mapping Corrections

Updates needed to `spinybacked-orbweaver/research/rubric-codebase-mapping.md`:

1. **Test count outdated**: Mapping says 320 tests across 11 files. Run-6 has 534 tests across 22 files. Update the test count and file list.
2. **SCH-001 section needs validator alignment note**: The mapping says SCH-001 is a soft quality guideline (evaluator judgment). The spiny-orb validator treats it as strict registry conformance. This divergence should be documented with a note about which definition to use.
3. **RST-004 function list update**: The mapping lists `saveContext` and `saveReflection` with a "precedence note." Run-6 agent applied RST-004; run-5 agent applied COV-004. The mapping should provide a definitive answer.

## §11. Carry-Forward Items (replaces old §10)

### From run-6 (new)
- SCH-001 single-span registry (RUN6-9) — **dominant blocker**
- COV-003 boundary gaps — 3 patterns (RUN6-10)
- Push auth — 4th consecutive (RUN6-2)
- PR summary accuracy (RUN6-15)
- Tally inflation (RUN6-4)
- NDS-003 persistence (RUN6-5)
- Advisory contradictions (RUN6-16)
- RST-004 in git-collector (RUN6-13)
- COV-005 server.js zero attributes (RUN6-14)

### From run-5 (partially resolved)
- DEEP-1 boundary gaps — ENOENT covered, 3 patterns remain
- Push auth — now 4 runs, not 3

### From earlier runs (persistent)
- NDS-003 — present since run-3, agent still modifies original lines
- CJS require() in ESM — open spec gap since run-2 (not triggered in run-6)
- Elision/null output bypass — likely improved but not directly tested

---

## §12. Port Failing Files as Test Cases

Update from run-5's fixture list. Remove recovered files, add new failures.

### Files to keep as acceptance test fixtures

| File | Status | Blocking Rules | Priority |
|------|--------|---------------|----------|
| src/index.js | 0 spans (3 runs) | COV-003 boundary + SCH-001 | **Critical** — entry point |
| src/commands/summarize.js | Partial (7/8) | COV-003 boundary + SCH-001 | High |
| src/generators/journal-graph.js | Partial (10/12) | SCH-001 + NDS-003 | High |
| src/generators/summary-graph.js | Partial (13/15) | SCH-001 + COV-003 | High |
| src/managers/auto-summarize.js | Partial (1/3) — regressed | SCH-001 + COV-003 + NDS-003 | High |
| src/managers/journal-manager.js | Partial (9/10) | SCH-001 only | **Highest ROI** |
| src/utils/summary-detector.js | Partial (5/11) | COV-003 + SCH-001 + NDS-003 | Medium |

### Files removed from fixture list (recovered)
- src/managers/summary-manager.js — **recovered** in run-6 (partial→committed)
- src/integrators/filters/sensitive-filter.js — correctly reclassified as sync-only (#212)

### New fixture candidates
- src/managers/auto-summarize.js — **regressed** from run-5 committed to run-6 partial
- src/utils/journal-paths.js — regressed from committed to 0 spans (SCH-001 forced removal)

---

## §13. Finding Summary Table

All run-6 findings with current status:

| Finding | Priority | Category | Status |
|---------|----------|----------|--------|
| RUN6-1 | Critical (process) | Laptop sleep kills API calls | Process fix — use caffeinate |
| RUN6-2 | Critical | Push auth 4th failure | Open — needs different approach |
| RUN6-3 | High | SCH-001 semantic mismatch | Open — part of registry expansion |
| RUN6-4 | High | Tally inflation | Open |
| RUN6-5 | Medium | NDS-003 persists | Open — since run-3 |
| RUN6-6 | Medium | Oscillation detected (RUN-1 working) | Informational — confirms fix |
| RUN6-7 | Medium | Reasoning reports not written to disk | Open |
| RUN6-8 | Critical | COV-001 entry point (3rd run) | Open — COV-003 + SCH-001 |
| RUN6-9 | Critical | SCH-001 single-span registry | Open — **dominant blocker** |
| RUN6-10 | High | DEEP-1 boundary gaps (3 patterns) | Open |
| RUN6-11 | High | 5 files regressed from run-5 | Open — registry fixes needed |
| RUN6-12 | Medium | 4/5 committed files wrong span names | Open — part of registry expansion |
| RUN6-13 | Medium | RST-004 in git-collector | Open |
| RUN6-14 | Medium | COV-005 server.js zero attributes | Open |
| RUN6-15 | High | PR summary doesn't reflect branch state | Open |
| RUN6-16 | Medium | Advisory contradiction rate 76% | Open — since run-5 |
| PR-1 | Medium | PR summary length (434 lines, 2 runs) | Open — from run-5, unaddressed |

**17 findings total**: 3 critical, 6 high, 7 medium, 1 informational (RUN6-6 confirms fix works).
