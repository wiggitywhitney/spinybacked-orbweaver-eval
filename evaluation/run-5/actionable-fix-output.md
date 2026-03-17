# Run-5 Actionable Fix Output

**To:** SpinybackedOrbWeaver maintainer / AI coding agent
**From:** Evaluation run-5 of commit-story-v2-eval (29 JavaScript files)
**Date:** 2026-03-17
**Run score:** 92% canonical (23/25), 5/5 gates pass (first clean gate pass across all runs)
**Orbweaver version:** 0.1.0
**Orbweaver branch:** `orbweaver/instrument-1773706515431`
**Source artifacts:** `per-file-evaluation.json`, `rubric-scores.json` (canonical); all other docs rendered from these

---

## Supporting Documents

All paths are relative to the `commit-story-v2-eval` repository root unless noted.

| Document | Path | Contents |
|----------|------|----------|
| **Orbweaver findings** | `evaluation/run-5/orbweaver-findings.md` | 22 new findings with acceptance criteria, classified as PRD or Issue |
| **Per-file evaluation (JSON)** | `evaluation/run-5/per-file-evaluation.json` | Canonical per-file evaluation data — source of truth |
| **Per-file evaluation (MD)** | `evaluation/run-5/per-file-evaluation.md` | Human-readable rendering of the JSON |
| **Rubric scores (JSON)** | `evaluation/run-5/rubric-scores.json` | Canonical rubric scoring data — source of truth |
| **Rubric scores (MD)** | `evaluation/run-5/rubric-scores.md` | Human-readable rendering of the JSON |
| **Baseline comparison** | `evaluation/run-5/baseline-comparison.md` | Run-5 vs run-4 vs run-3 vs run-2 comparison |
| **Failure deep-dives** | `evaluation/run-5/failure-deep-dives.md` | Root cause analysis for all failed/partial files and run-level failures |
| **PR evaluation** | `evaluation/run-5/pr-evaluation.md` | PR artifact quality assessment |
| **Lessons for PRD #6** | `evaluation/run-5/lessons-for-prd6.md` | Rubric gaps, process improvements, methodology changes |
| **Evaluation rubric** | `spinybacked-orbweaver/research/evaluation-rubric.md` | 32-rule rubric (5 gates + 27 quality rules) |
| **Orbweaver branch** | `orbweaver/instrument-1773706515431` | Local branch with instrumented code (not pushed — git push auth failed, 3rd consecutive run) |

---

## How to Read This Document

Each finding states **what's wrong**, **evidence** (from canonical JSON artifacts), and **desired outcome**. Findings are grouped by priority:

1. **Active rule failures** — the 2 rules failing in the canonical score
2. **Latent systemic bugs** — issues in partial files that would become canonical failures if those files are committed
3. **Failed/partial files** — per-file root cause analysis and prognosis
4. **Run-4 finding assessment** — status of all 13 run-4 findings
5. **Run-5 rubric gap assessment** — gaps discovered during run-5
6. **Run-6 verification checklist**
7. **Score projection for run-6** — 3-tier prediction with explicit assumptions

Orbweaver finding references (e.g., "RUN-1") point to `evaluation/run-5/orbweaver-findings.md`.

---

## 1. Active Rule Failures (2 rules — both in COV dimension)

Run-5 has only 2 rule failures in the canonical score. Both are in the Coverage dimension (COV: 3/5 = 60%). All other dimensions score 100%.

### COV-001: Application Entry Point Has No Span (Persistent)

**What's wrong:** `src/index.js` `main()` — the CLI entry point — failed instrumentation entirely due to SCH-002 oscillation. The agent attempted to fix schema validation failures but each retry increased the violation count (9 → 12). Without a root span, the trace has no top-level operation.

**Evidence (from rubric-scores.json):**
- `quality_rules.COV-001`: `"result": "fail"`, `"category": "persistent"`
- `overall.failures[0]`: `"rule": "COV-001"`, `"finding_ref": "RUN-1, DEEP-6"`

**Evidence (from per-file-evaluation.json):**
- `per_file_evaluations.failed[1]`: `"file": "src/index.js"`, `"failure_reason": "Oscillation detected: SCH-002 count increased 9→12 during fix retry"`

**Trajectory:** Run-4: index.js on branch but missing root span. Run-5: failed entirely — **worse outcome, same rule failure**.

**Root cause:** The fix/retry loop has no oscillation detection. When validation failures increase after a fix attempt, the agent should stop and report failure rather than continuing to oscillate.

**Desired outcome:** (1) Oscillation detection in fix/retry loop: if violation count increases after a fix attempt, stop immediately. (2) Entry point file gets special handling — it should be attempted early and treated as high-priority. (3) index.js `main()` has a root span.

**Orbweaver finding:** RUN-1 (oscillation), DEEP-6 (entry point special handling)

---

### COV-005: Zero Attributes on Schema-Uncovered Files (New Finding)

**What's wrong:** `src/managers/auto-summarize.js` (3 spans, 0 attributes) and `src/mcp/server.js` (1 span, 0 attributes) have spans with zero attributes. Both are schema-uncovered files. The agent strips all attributes to pass SCH-002 validation but doesn't generate schema-compliant alternatives.

**Evidence (from rubric-scores.json):**
- `quality_rules.COV-005`: `"result": "fail"`, `"files_fail": 2`, `"failing_files": ["src/managers/auto-summarize.js", "src/mcp/server.js"]`
- `systemic_bugs[0]`: `"id": "SYS-1"`, `"title": "Schema-uncovered files get zero attributes"`

**Evidence (from per-file-evaluation.json):**
- `per_file_evaluations.committed[3]` (auto-summarize.js): `rules.COV-005.result`: `"fail"`, `"evidence": "Zero attributes set across all 3 spans"`
- `per_file_evaluations.committed[4]` (server.js): `rules.COV-005.result`: `"fail"`, `"evidence": "Zero attributes on server span"`

**Trajectory:** Run-4: COV-005 failed on auto-summarize (4 ad-hoc attrs) and summary-detector (3 ad-hoc attrs). Run-5: auto-summarize now has ZERO attributes (worse). Root cause shifted from "wrong attributes" to "no attributes" — the validation pipeline trades attribute presence for schema compliance.

**Root cause:** SCH-002 validation rejects attributes not in the registry. For schema-uncovered files, NO attributes are in the registry. The agent's strategy is to remove rejected attributes rather than register them as schema extensions first. This is a gap in the agent's schema extension workflow — it should: (1) invent domain-relevant attributes, (2) register them as extensions, (3) use them in the file.

**Desired outcome:** Schema-uncovered files have domain-relevant attributes. The agent invents attributes, registers them as schema extensions, then uses them. auto-summarize.js should have attributes like date, item_count, summary_type. server.js should have transport_type, server_name.

**Orbweaver finding:** EVAL-1

---

## 2. Latent Systemic Bugs (2 bugs — not in canonical score, but block partial file delivery)

These bugs exist in partial files that were not committed. If the validation pipeline is relaxed or the agent improves enough to commit these files, these bugs would become canonical failures.

### SYS-3: COV-003/NDS-005b Validator Conflict (Dominant — 5 files, 8 violations)

**What's wrong:** The COV-003 validator requires error recording (`recordException` + `setStatus(ERROR)`) on ALL catch blocks. But expected-condition catch blocks (e.g., ENOENT file-not-found used for control flow) should NOT record errors — doing so pollutes error metrics with normal operations. The agent complies with COV-003 and produces NDS-005b violations.

**Evidence (from rubric-scores.json):**
- `systemic_bugs[2]`: `"id": "SYS-3"`, `"affected_files": ["src/managers/journal-manager.js", "src/managers/summary-manager.js", "src/utils/summary-detector.js"]`, `"affected_instances": 8`

**Evidence (from per-file-evaluation.json):**
- journal-manager.js: `NDS-005.sub`: `"005b"` — saveJournalEntry file-not-found catch
- summary-manager.js: 5 NDS-005b violations across 3 functions
- summary-detector.js: 2 NDS-005b violations in getDaysWithEntries

**Impact:** This is the dominant systemic root cause in run-5. It directly prevents 3 files from being committed (journal-manager.js, summary-manager.js, summary-detector.js) and contributes to failures in 2 more (summarize.js, summary-graph.js).

**Desired outcome:** The COV-003 validator should exempt expected-condition catch blocks. Add a mechanism (comment annotation, pattern recognition, or prompt guidance) for the agent to distinguish: (a) genuine error catches → add recordException, (b) expected-condition catches (ENOENT control flow) → skip recordException.

**Orbweaver finding:** DEEP-1 (COV-003 exemption), DEEP-3 (NDS-005b in committed code — prevention)

---

### SYS-4: Duplicate JSDoc Comments (5 files)

**What's wrong:** The agent generates a new JSDoc comment block AND preserves the original, producing duplicate JSDoc above instrumented functions. This is a non-instrumentation change (NDS-003 violation).

**Evidence (from rubric-scores.json):**
- `systemic_bugs[3]`: `"id": "SYS-4"`, `"affected_files": 5 files`, `"affected_instances": 5`
- `gates.results.NDS-003.note`: `"5 partial files (not committed) fail NDS-003 due to duplicate JSDoc blocks (DEEP-4)"`

**Impact:** Prevents delivery of partial files that would otherwise pass validation. Less impactful than SYS-3 because the duplicate JSDoc could be auto-fixed (strip duplicates), while NDS-005b requires a design decision.

**Desired outcome:** Agent does not duplicate JSDoc blocks. When wrapping a function in a span callback, the existing JSDoc should be preserved in place without adding a new copy.

**Orbweaver finding:** DEEP-4

---

## 3. Failed/Partial Files (8 files not delivered)

Run-5 committed 9/29 files. The remaining 20 break down as: 12 correctly skipped, 2 failed, 6 partial.

### Failed Files (2)

#### src/commands/summarize.js — Failed (COV-003 + SCH-002)

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Committed | — |
| Run-3 | Committed | — |
| Run-4 | Committed | NDS-005 violations (expected-condition catches) |
| Run-5 | **Failed** | COV-003 x4 + SCH-002 x18 validation failures |

**Root cause:** COV-003/NDS-005b conflict (SYS-3). The file has 4 expected-condition catch blocks. The agent adds error recording to all of them (complying with COV-003 validation), which produces NDS-005b violations. Additionally, 18 SCH-002 validation failures from unregistered attributes.

**Prognosis:** Will succeed once DEEP-1 (COV-003 exemption for expected-condition catches) is implemented.

---

#### src/index.js — Failed (SCH-002 oscillation)

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Committed | — |
| Run-3 | Committed | — |
| Run-4 | Committed (no root span) | Missing root span on main() |
| Run-5 | **Failed** | SCH-002 oscillation (9→12 violations during fix retry) |

**Root cause:** Fix/retry oscillation (SYS-2). The agent's correction attempts increase the SCH-002 violation count rather than decreasing it. No oscillation detection in the fix/retry loop.

**Prognosis:** Will succeed once RUN-1 (oscillation detection) and DEEP-6 (entry point special handling) are implemented.

---

### Partial Files (6)

#### src/generators/journal-graph.js — Partial (1/1 function, not committed)

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Failed | Token budget (~94K) |
| Run-3 | Failed | Oscillation (500+ lines) |
| Run-4 | Partial (4 spans, not committed) | Function-level fallback; tracer import bug blocked commit |
| Run-5 | **Partial (1 function)** | NDS-003 (duplicate JSDoc), function-level fallback loses non-exported functions |

**Root cause:** Two issues: (1) Duplicate JSDoc blocks (SYS-4, NDS-003 violation). (2) Function-level fallback only instruments functions it discovers via export analysis — non-exported inner functions (graph nodes) are missed. In run-4, whole-file approach caught all 4 exported functions; in run-5, only generateJournalSections was attempted.

**Prognosis:** Moderate improvement. Fixing duplicate JSDoc (DEEP-4) would let the 1 function pass. Recovering the other functions requires improving function-level fallback's discovery of non-exported functions (DEEP-2b).

---

#### src/generators/summary-graph.js — Partial (11/12 functions, not committed)

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Failed | Token budget (~94K) |
| Run-3 | Failed | Oscillation |
| Run-4 | Partial (12/12 functions, not committed) | Tracer import bug |
| Run-5 | **Partial (11/12 functions)** | NDS-003 (duplicate JSDoc), SCH-001 naming inconsistency |

**Root cause:** Duplicate JSDoc (SYS-4). Also has inconsistent span naming — mixed `commit_story.ai.*` and `commit_story.journal.*` namespaces. Would fail SCH-001 if committed.

**Prognosis:** Good. 11/12 functions instrumented — very close to full success. Fixing duplicate JSDoc (DEEP-4) is the primary blocker.

---

#### src/integrators/filters/sensitive-filter.js — Partial (2/3 functions, not committed)

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Failed | Null parsed output |
| Run-3 | Failed | Null parsed output |
| Run-4 | Partial (2/3 functions) | Tracer import bug + regex mangling |
| Run-5 | **Partial (2/3 functions)** | Partial diff not captured; `redactSensitiveData` likely still blocked by regex mangling |

**Root cause:** The `redactSensitiveData` function contains complex regex patterns in `SENSITIVE_PATTERNS` array. The agent consistently mangles regex literals when adding span wrapping code.

**Prognosis:** Stable at 2/3. The `redactSensitiveData` regex issue may require a specialized agent strategy (e.g., "preserve regex" directive).

---

#### src/managers/journal-manager.js — Partial (2/3 functions, not committed)

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Failed | NDS-003 (added business logic) |
| Run-3 | Failed | NDS-003 (x5) + COV-003 (x3) |
| Run-4 | Partial (1/3 functions) | NDS-003 persistent |
| Run-5 | **Partial (2/3 functions)** | NDS-003 (duplicate JSDoc), NDS-005b (1 violation) |

**Root cause:** Two issues: (1) Duplicate JSDoc (SYS-4). (2) NDS-005b — saveJournalEntry's file-not-found catch gets recordException (SYS-3).

**Prognosis:** Improved (1/3 → 2/3 functions). Fixing DEEP-1 (COV-003 expected-condition exemption) + DEEP-4 (duplicate JSDoc) would let all 3 functions pass.

---

#### src/managers/summary-manager.js — Partial (9/14 functions, not committed)

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Committed | — |
| Run-3 | Committed | — |
| Run-4 | Committed | NDS-005 violations |
| Run-5 | **Partial (9/14 functions)** | NDS-005b (5 violations), NDS-003 (duplicate JSDoc) |

**Root cause:** Dominant SYS-3 case — 5 NDS-005b violations across 3 functions. Also duplicate JSDoc (SYS-4).

**Prognosis:** Will succeed once DEEP-1 (COV-003 expected-condition exemption) and DEEP-4 (duplicate JSDoc) are implemented. Was fully committed in runs 2-4.

---

#### src/utils/summary-detector.js — Partial (4/5 functions, not committed)

| Run | Outcome | Root Cause |
|-----|---------|------------|
| Run-2 | Committed | — |
| Run-3 | Committed | — |
| Run-4 | Committed | NDS-005b violations (evaluated post-commit) |
| Run-5 | **Partial (4/5 functions)** | NDS-005b (2 violations), NDS-003 (duplicate JSDoc) |

**Root cause:** SYS-3 — getDaysWithEntries has 2 expected-condition catches with recordException. Also SYS-4 (duplicate JSDoc).

**Prognosis:** Same as summary-manager.js — will succeed once DEEP-1 + DEEP-4 are fixed.

---

### File Delivery Summary

| Category | Count | Files |
|----------|-------|-------|
| Committed (all rules pass) | 7 | claude-collector, git-collector, context-integrator, context-capture-tool, reflection-tool, commit-analyzer, journal-paths |
| Committed (COV-005 failure) | 2 | auto-summarize, server |
| Correctly skipped | 12 | config, 5 prompt files, guidelines/index, monthly-summary-prompt, 2 more prompts, message-filter, token-filter |
| Failed (validation) | 2 | summarize, index |
| Partial (NDS-003/NDS-005b blockers) | 6 | journal-graph, summary-graph, sensitive-filter, journal-manager, summary-manager, summary-detector |

**Key insight:** 5 of 6 partial files and 1 of 2 failed files are blocked by the SYS-3 (COV-003/NDS-005b conflict) or SYS-4 (duplicate JSDoc) systemic bugs. Fixing these 2 bugs would potentially deliver 6 additional files.

---

## 4. Run-4 Finding Assessment

All 13 run-4 findings were filed as issues/PRDs in spinybacked-orbweaver and merged. Status in run-5:

| # | Run-4 Finding | Priority | What Orbweaver Did | Run-5 Outcome |
|---|---------------|----------|--------------------|---------------|
| 1 | Schema evolution broken | Critical | PRD #5 (PR #170, #175, #178) | **Fixed** — extensions written, resolved in prompts. SCH-001 50%→100%, SCH-002 50%→100%. |
| 2 | Validation pipeline (per-file checks) | High | PRD #4 (PR #164, #166, #181) | **Fixed** — per-file node --check, fix/retry, function-level fallback with tracer import. NDS-002 FAIL→PASS. |
| 3 | Expected-condition catches as errors | High | Issue #143 (PR #165) | **Partially fixed** — prompt guidance added, committed files pass. But 8 NDS-005b violations in partial files. Agent behavior partially improved, not fully resolved. |
| 4 | Schema extension warnings unreadable | Low | Issue #145 (PR #178) | **Fixed** — warning deduplication implemented. |
| 5 | CLI output doesn't show artifact locations | High | Issue #141 (PR #176) | **Fixed** — artifact paths shown in output. |
| 6 | Create draft PR when tests fail | Medium | Issue #144 (PR #181) | **Not testable** — push authentication failed again. Cannot verify draft PR feature. |
| 7 | LOC-aware test cadence | Medium | Issue #148 (PR #181) | **Implemented** — test cadence now considers file size. |
| 8 | Skip commit for zero-change files | Low | Issue #146 (PR #176) | **Fixed** — no commit noise for zero-change files. |
| 9 | Tracer name 'unknown_service' | High | Issue #140 (PR #165) | **Fixed** — CDQ-002 FAIL→PASS. All files use `trace.getTracer('commit-story')`. |
| 10 | Span naming inconsistency | Medium | Issue #142 (PR #175) | **Fixed** — SCH-001 FAIL→PASS. All committed span names use `commit_story.*` namespace. |
| 11 | Unused OTel imports on zero-span files | Low | Issue #147 (PR #176) | **Fixed** — zero-span files have no OTel imports. |
| 12 | Over-instrumentation of sync functions | Medium | Issue #149 (PR #165) | **Fixed** — RST-001 FAIL→PASS. token-filter.js correctly skipped. |
| 13 | index.js missing root span | Medium | Issue #139 (PR #165) | **Not fixed** — COV-001 still FAIL. index.js failed instrumentation entirely (worse than run-4). |

### Summary

| Status | Count | Findings |
|--------|-------|----------|
| Verified fixed | 9 | #1, #2, #4, #5, #7, #8, #9, #10, #11 |
| Partially fixed | 1 | #3 (committed files OK, partial files still violate) |
| Not fixed | 1 | #13 (index.js — worse outcome) |
| Not testable | 1 | #6 (push failed — can't verify draft PR) |
| Fixed but revealed new issue | 1 | #12 (RST-001 fixed, but was replaced by different failure mode) |

### Resolution Quality Assessment

Three resolution types observed:

1. **Genuine fixes** (4): Schema evolution (#1), tracer name (#9), span naming (#10), validation pipeline (#2) — root cause addressed, measurable improvement.
2. **Methodology-driven resolutions** (3): COV-002, COV-004, CDQ-006 — canonical methodology reclassified these as N/A or exempt.
3. **Superficial resolutions** (3): NDS-005 (#3), CDQ-003, SCH-002 — rule passes in canonical score because violating files are NOT committed. Underlying agent behavior partially or not improved. The validation pipeline filtered the violations rather than fixing them.

**Calibration note:** Run-4 projected that fixing findings #1, #2, #3, #9, #13 would reach 85%. The actual run-5 score is 92%, but through a different mechanism — fewer committed files (9 vs 16) reduced the failure surface. The 3 "superficial resolutions" show that high scores can result from filtering rather than fixing. The quality-vs-coverage tradeoff is the primary focus for run-6.

---

## 5. Run-5 Rubric Gap Assessment

### New Findings Requiring Rubric Consideration

| Gap | Context | Recommendation |
|-----|---------|----------------|
| COV-003 exemption for expected-condition catches | COV-003 and NDS-005b directly conflict. Agent can't satisfy both. | Add COV-003 exemption clause: "Expected-condition catch blocks (file-not-found, directory-not-found used for control flow) are exempt from error recording requirement." |
| NDS-005b boundary refinement | `commit-analyzer.js` has defensive git-failure catches classified as "borderline NDS-005b" — genuine errors handled gracefully vs expected conditions. | Clarify NDS-005b: distinguish "defensive fallback for genuine errors" (OK to record) from "expected-condition control flow" (don't record). The key signal is whether the catch represents a normal execution path. |
| Entry point coverage (COV-001) scope | index.js failure has outsized impact on live-check compliance. A single file failure degrades the entire trace. | Consider whether COV-001 should weight entry points more heavily, or whether entry point failure should be a gate-level check. |
| Schema-uncovered file attribute strategy | No rubric rule covers the "agent should invent and register attributes for uncovered files" workflow. | Consider SCH-005: "Schema-uncovered files should have domain-relevant attributes registered as schema extensions." Currently evaluated via COV-005 only. |
| Validation-caused regressions | 5 files that were committed in run-4 are partial in run-5 due to stricter validation. No rubric rule captures this tradeoff. | Document as a methodology note: "Validation trading coverage for quality is expected and acceptable, but track file delivery regression rate across runs." |

### Existing Rule Clarifications Applied in Run-5

These were applied in the evaluation process improvements milestone and are now part of the canonical methodology:

| Rule | Clarification | Status |
|------|---------------|--------|
| CDQ-002 | Semantic check (tracer name correctness), not pattern-only check | Applied in run-5, should be in rubric |
| CDQ-006 | Cheap computation exemption (toISOString, String(), Number()) | Applied in run-5, should be in rubric |
| NDS-005 | Sub-classification: NDS-005a (broke error handling) vs NDS-005b (expected-condition recorded as error) | Applied in run-5, should be in rubric |

---

## 6. Run-6 Verification Checklist

### Pre-Run

- [ ] **Push capability test:** `git push --dry-run` succeeds. Run-5 was the 3rd consecutive push failure — this MUST be resolved before run-6. Consider alternative auth mechanisms if SSH/HTTPS tokens keep expiring.
- [ ] **Oscillation detection:** Verify orbweaver's fix/retry loop detects when violation count increases and stops immediately.
- [ ] **COV-003 expected-condition exemption:** Verify the validator distinguishes expected-condition catches from genuine error handlers.
- [ ] **Duplicate JSDoc fix:** Verify the agent does not produce duplicate JSDoc blocks when wrapping functions.
- [ ] **Schema extension workflow for uncovered files:** Verify the agent invents, registers, and uses attributes for schema-uncovered files.
- [ ] **Orbweaver build is fresh:** `npm run prepare` in spinybacked-orbweaver, verify build timestamp is after all fix merges.
- [ ] **Orbweaver version:** Record version — should be > 0.1.0 if fixes are released.

### During Run

- [ ] **Schema evolution health:** Compare schemaHashBefore vs schemaHashAfter for first 3 files — should be different.
- [ ] **Cost sanity:** Run-5 was $9.72 (14.3% of $67.86 ceiling). Run-6 should be in similar range if processing comparable files. If < 10%, investigate.
- [ ] **Oscillation monitoring:** If any file shows increasing violation count across fix retries, verify the oscillation detection triggers.
- [ ] **Partial file tracking:** Monitor how many files enter function-level fallback vs whole-file success.

### Post-Run

- [ ] **Test suite clean:** 0 failures in `npm test`
- [ ] **PR created:** GitHub PR exists (not just local PR summary). If push fails again, escalate auth investigation.
- [ ] **Branch deliverable:** All files reported as instrumented have actual changes on branch (`git diff main..orbweaver-branch --stat`)
- [ ] **File delivery count:** Target: 14+ committed files (up from 9 in run-5). The 6 partial files should be rescuable.

### Quality Rule Verification (Targeted)

| Rule | Run-5 | Expected Run-6 | What to Check |
|------|-------|-----------------|---------------|
| COV-001 | FAIL (index.js oscillation) | PASS | index.js `main()` has root span. Oscillation detection prevents failure. |
| COV-005 | FAIL (zero attributes) | Improved | auto-summarize.js and server.js have domain-relevant attributes registered as extensions. |
| NDS-005 | PASS (latent: 8 violations) | PASS (genuine) | No NDS-005b violations in partial files. COV-003 exemption prevents the conflict. |
| NDS-003 | PASS (latent: 5 files) | PASS (genuine) | No duplicate JSDoc blocks in any file. |

### Files to Watch

| File | Run-5 Outcome | Expected in Run-6 | Depends On |
|------|---------------|-------------------|------------|
| src/index.js | Failed (oscillation) | **Committed** with root span | RUN-1 (oscillation detection), DEEP-6 (entry point handling) |
| src/commands/summarize.js | Failed (COV-003 + SCH-002) | **Committed** | DEEP-1 (COV-003 exemption) |
| src/managers/summary-manager.js | Partial (9/14, NDS-005b) | **Committed** | DEEP-1, DEEP-4 |
| src/utils/summary-detector.js | Partial (4/5, NDS-005b) | **Committed** | DEEP-1, DEEP-4 |
| src/managers/journal-manager.js | Partial (2/3, NDS-005b + JSDoc) | **Committed** | DEEP-1, DEEP-4 |
| src/generators/summary-graph.js | Partial (11/12, JSDoc) | **Committed** | DEEP-4, function-level discovery improvement |
| src/generators/journal-graph.js | Partial (1/1, JSDoc) | **Improved** (more functions) | DEEP-4, DEEP-2b (function discovery) |
| src/integrators/filters/sensitive-filter.js | Partial (2/3, regex) | **Stable** (2/3) | Regex-specific agent strategy (nice-to-have) |

---

## 7. Score Projection for Run-6

### Assumptions

All projections assume:
1. **File set is stable** — same 29 files. If new files are added to commit-story-v2, the denominator increases.
2. **Methodology is stable** — canonical (per-file evaluation + schema coverage split) continues.
3. **Rubric is stable** — no new rules added (though clarifications may be applied).
4. **Push succeeds** — PR is created and testable. If push fails again, PR-related findings can't be verified.

### Minimum (fix oscillation detection only — RUN-1)

Fix only the fix/retry oscillation detection:
- **COV-001:** index.js avoids oscillation, gets a root span → FAIL → PASS
- **COV-005:** No change — uncovered files still have zero attributes
- **File count:** 10 committed (index.js recovered) — marginal improvement
- **Expected score:** 24/25 = **96%** canonical (from 92%)
- **Gate status:** 5/5 PASS (unchanged)

### Target (fix dominant systemic bugs — RUN-1, DEEP-1, DEEP-4)

Fix oscillation detection + COV-003 expected-condition exemption + duplicate JSDoc:
- **COV-001:** FAIL → PASS (index.js recovers)
- **COV-005:** Partially improved — some recovered files may have attributes; uncovered files may still have zero
- **File count:** ~14-16 committed (recover summarize.js, summary-manager.js, summary-detector.js, journal-manager.js, summary-graph.js, journal-graph.js)
- **NDS-005:** PASS (genuine) — no latent violations
- **NDS-003:** PASS (genuine) — no duplicate JSDoc
- **Expected score:** 24-25/25 = **96-100%** canonical
- **Gate status:** 5/5 PASS

**Key improvement:** Quality AND coverage both increase. This is the first projection where coverage recovery doesn't trade off against quality.

### Stretch (target + schema-uncovered attribute strategy — EVAL-1)

Additionally fix the schema extension workflow for uncovered files:
- **COV-005:** FAIL → PASS (auto-summarize and server have domain-relevant attributes)
- **File count:** ~15-17 committed
- **Expected score:** 25/25 = **100%** canonical
- **Gate status:** 5/5 PASS

### Calibration Notes

Run-4 projections had mixed accuracy:
- **Stretch target (92%) matched numerically** but through a different mechanism (fewer files, not better files).
- **The file-set assumption was wrong** — run-4 assumed 16 committed files would remain committed; run-5 had only 9.
- **Projection methodology update for run-6:** Include explicit file delivery count alongside percentage scores. A 96% score with 10 files is very different from 96% with 16 files.

The run-6 target projection (96-100% with 14-16 files) is higher confidence than run-4's projections because:
1. The systemic root causes (SYS-3, SYS-4) are well-understood and have clear fixes.
2. The affected files are identified precisely (not "schema evolution may help").
3. The fixes are independent — each addresses a specific mechanism, not overlapping concerns.

Risk: If fixing SYS-3 reveals new failure modes in the recovered files (e.g., new SCH-002 violations from files that weren't evaluated for schema compliance in run-5), the actual score may be lower than projected. This is the "unmasked bug" risk identified in run-4.

---

## 8. Priority Action Matrix

| Priority | Finding | Rules Affected | Type | Impact |
|----------|---------|---------------|------|--------|
| **Critical** | DEEP-1: COV-003 expected-condition exemption | NDS-005b (latent), COV-003 | Issue/PRD | Unblocks 5 partial files — dominant systemic root cause |
| **Critical** | RUN-1: Oscillation detection in fix/retry | COV-001 | Issue | Recovers index.js entry point — persistent failure |
| **High** | DEEP-4: Duplicate JSDoc prevention | NDS-003 (latent) | Issue | Unblocks 5 partial files |
| **High** | EVAL-1: Schema-uncovered file attribute strategy | COV-005 | Issue | Fixes last 2 canonical rule failures |
| **High** | DEEP-6: Entry point special handling | COV-001 | Issue | Prevents entry point from being a single point of failure |
| **Medium** | DEEP-2b: Function-level fallback discovery | COV-001 | Issue | Recovers non-exported functions in large files |
| **Medium** | RUN-2: Validation regression tracking | NDS-002 | Issue | Prevent validation from blocking previously-passing files |
| **Medium** | Push authentication (persistent) | PR delivery | Investigation | 3rd consecutive failure — needs root cause investigation |
| **Low** | DEEP-5: SDK init skip for libraries | CDQ | Issue | Cosmetic — SDK init code is unused for API-only libraries |
| **Low** | DEEP-8: Date object in setAttribute | CDQ | Issue | Minor — Date.toISOString() is cheap but passing Date objects is a type mismatch |
| **Low** | PR-1 through PR-4: PR summary improvements | PR quality | Issue | Reviewer experience improvements |
| **Low** | EVAL-2: @traceloop packages in peerDependencies | API-002 | Issue | Architecturally questionable but non-blocking |

---

## 9. Final Review of Findings and Lessons

### evaluation/run-5/orbweaver-findings.md

22 new findings documented with acceptance criteria and evidence paths. The critical path for run-6 is DEEP-1 → RUN-1 → DEEP-4 → EVAL-1. Fixing the first three alone should recover 6+ files and reach 96%+ canonical score.

### evaluation/run-5/lessons-for-prd6.md

Key lessons for PRD #6:
- **Quality vs coverage** is the primary tradeoff to optimize — high scores from filtering are not the same as high scores from good instrumentation.
- **Superficial resolutions** (3 in run-5) need tracking — the rule passes but the underlying agent behavior isn't fixed.
- **Score projections must include file delivery counts** — percentage alone is misleading.
- **Oscillation detection** is a new failure class that needs first-class handling.
- **Push authentication** must be resolved before run-6 — 3 consecutive failures.
