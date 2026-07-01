# Actionable Fix Output — Run-8

Self-contained handoff from evaluation run-8 to the spiny-orb team.

**Run-8 result**: 23/25 (92%) canonical quality, 12 files committed, $4.00 cost in 41 minutes. Ties run-5 for highest quality. COV and CDQ both reach 100% for the first time. Push failed (6th consecutive).

**Run-7 → Run-8 delta**: +4pp quality (88% → 92%), -1 file (13 → 12), +$0.78 cost ($3.22 → $4.00).

**Branch**: `spiny-orb/instrument-1774084751105` (local — push failed). PR summary at `spiny-orb-pr-summary.md`.

---

## §1. Run-8 Score Summary

| Dimension | Score | Run-7 | Delta | Failures |
|-----------|-------|-------|-------|----------|
| NDS | 2/2 (100%) | 2/2 | — | — |
| COV | 5/5 (100%) | 4/5 | **+20pp** | — |
| RST | 4/4 (100%) | 4/4 | — | — |
| API | 2/3 (67%) | 2/3 | — | API-004 (pre-existing) |
| SCH | 3/4 (75%) | 4/4 | **-25pp** | SCH-003 (count types) — see note below |
| CDQ | 7/7 (100%) | 6/7 | **+14pp** | — |
| **Total** | **23/25 (92%)** | **22/25** | **+4pp** | 2 failures |
| **Gates** | **5/5** | **5/5** | — | — |
| **Files** | **12** | **13** | **-1** | journal-graph.js regression |

**Resolved**: COV-006 (span name collision) — all 29 span names unique. Prompt injection approach succeeded.

**Still failing**: API-004 (pre-existing, target project fix) and SCH-003 (count attribute types, prompt-only fix insufficient).

**Methodology note on SCH -25pp**: This is a **reclassification**, not a real regression. The count attribute type issue existed in run-7 too, but was scored under CDQ as "CDQ-005." In run-8, it's correctly classified under SCH-003 (Schema Fidelity — attribute values conform to registry types) because the rubric rule CDQ-005 is actually "Async Context Maintained" (which all files pass). The underlying issue is unchanged — only the dimension assignment moved. The +14pp CDQ gain is the mirror image of this correction.

---

## §2. Remaining Quality Rule Failures (2)

### API-004: @opentelemetry/sdk-node in peerDependencies (Pre-Existing)

**Status**: Pre-existing on main since run-2. Not introduced by instrumentation.

**New in run-8**: Spiny-orb now detects this as an advisory (PR #258). The advisory correctly identifies it during the run but cannot fix it (target project responsibility).

**Fix**: Remove `@opentelemetry/sdk-node` from `peerDependencies` in commit-story-v2's `package.json`. This is a target-project fix.

### SCH-003: Count Attributes Declared as String Type (Persistent)

**Status**: Persistent from run-7. The prompt-only fix (SCH-003 guidance in system prompt) was insufficient.

**What's wrong**: 6 count attributes (`dates_count`, `weeks_count`, `months_count`, `generated_count`, `failed_count`, `reflections_count`) declared as `type: string` in agent-extensions.yaml. The base registry uses `type: int` for all existing count attributes. The code inconsistently wraps with `String()` (some files) or passes raw numbers (other files). Additionally, `commit_story.summarize.force` is declared as `type: string` but the code passes a boolean — a separate type mismatch.

**Root cause**: The first file to declare count attributes (summarize.js) chose `type: string`. The schema accumulator propagated this to all subsequent files. Later files saw `dates_count: string` in the accumulated schema and followed it — the schema conformance behavior overrides the SCH-003 prompt guidance.

**Instance count**: 6/12 committed files affected (50%), but all trace to 1 schema-level decision.

**Fix options** (in order of reliability):
1. **Post-generation validator**: After the agent writes schema extensions, check if any `*_count` attribute has `type` != `int`. Reject and re-prompt if found.
2. **Schema accumulator seeding**: Pre-seed the accumulator with `type: int` for `*_count` patterns before the first file runs.
3. **Stronger prompt override**: Change SCH-003 to: "Count attributes (*_count) MUST be type: int. If the accumulated schema says string for a count attribute, that is an error — override it with int."

**Acceptance criteria**:
1. All `*_count` attributes in agent-extensions.yaml use `type: int`
2. Code passes raw numbers to setAttribute for count attributes (no `String()` wrapping)
3. Boolean attributes (like `force`) declared as `type: boolean`, not `type: string`
4. The fix persists across multiple files (the accumulator doesn't regress later files)

---

## §3. Run-7 Findings Assessment

| Finding | Run-7 Status | Run-8 Status | Notes |
|---------|-------------|-------------|-------|
| RUN7-4 Push auth | Critical | **Superseded by RUN8-3** | Fail-fast works for missing token (PR #251 fix verified). New diagnosis: token present but can't push — read vs write validation. See RUN8-3. |
| RUN7-5 Span collision | P0 fix | **RESOLVED** | All 29 span names unique |
| RUN7-6 Count types | P0 fix | **Still failing** | Prompt-only fix insufficient (SCH-003) |
| RUN7-2 Rule labels | P1 fix | **RESOLVED** | formatRuleId() working in validation and PR summary |
| RUN7-7 Span count | P1 partial | **Observationally improved** | Per-file span counts match branch state in run-8, but mechanism is unchanged — `spansAdded` still comes from agent self-report, not post-hoc `startActiveSpan` counting. Issue #253 remains open. Accuracy this run may be coincidental. |
| RUN7-8 Schema extensions | P1 fix | **RESOLVED** | Schema Extensions column in per-file table |
| RUN7-9 Agent notes | P1 fix | **RESOLVED** | 3 notes max + "... N more in reasoning report" |
| RUN7-10 Advisory grouping | P1 fix | **RESOLVED** | Grouping by ruleId+message works correctly. Advisory *quality* (high false positive rate) is a separate issue tracked under RUN8-4 |
| RUN7-3 User docs | P2 fix | **RESOLVED** | 3 docs in docs/ |
| RUN7-1 Verbose output | P2 fix | **RESOLVED** | Notes capped, not truncated |

**8/10 fully resolved, 1 observationally improved (structurally unchanged), 1 still failing** (push auth superseded by RUN8-3; count types still failing as SCH-003).

---

## §4. New Run-8 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN8-1 | Agent notes use bare rule codes without labels | Medium | UX |
| RUN8-2 | Verbose output lacks visual separation between files | Low | UX |
| RUN8-3 | Push auth validates read, not write — token present but push fails | Critical | Deliverables |
| RUN8-4 | Advisory contradiction rate ~91% (CDQ-006 trivial exemption not implemented) | Medium | PR Summary |
| RUN8-5 | journal-graph.js non-deterministic failure (committed in run-7, partial in run-8) | Medium | Reliability |
| RUN8-6 | COV-004 advisories flag sync functions as needing async spans | Low | PR Summary |
| RUN8-7 | NDS-005 advisory false positive on index.js (claims error handling changed) | Low | PR Summary |

---

## §5. Priority Action Matrix

### P0 — Must fix for run-9

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Fix push auth to validate write access | RUN8-3 / RUN7-4 | Use `git push --dry-run` or GitHub API to verify write scope before processing. Also: fix/260 (upstream tracking for `pushBranch`) is WIP on a branch — may compound the push failure if `gh pr create` can't detect the pushed branch. |
| Fix count attribute type enforcement | SCH-003 / RUN7-6 | Post-generation validator rejects `*_count` with `type` != `int` |

### P1 — Should fix for run-9

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Add CDQ-006 trivial conversion exemption | RUN8-4 | .toISOString(), String(), Number(), Boolean(), toString() not flagged. Combined with COV-004 sync fix (RUN8-6), target advisory contradiction rate <30% (currently ~91%). |
| Expand rule labels to agent notes | RUN8-1 | Regex post-processor expands codes in notes before display |
| Improve COV-004 async detection | RUN8-6 | Don't flag pure sync functions for async span advisories |
| Investigate journal-graph.js reassembly | RUN8-5 | journal-graph.js committed in 2+ consecutive test runs. Cost guard: max 3 attempts or 50K output tokens per file to prevent one partial from consuming 42% of run cost ($1.45 of $4.00 for zero committed value). Root cause hypothesis: reassembly validator too strict for LLM output variation on complex files (19 functions, LangGraph state machine). |

### P2 — Nice to have

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Add visual separation in verbose output | RUN8-2 | Blank line between file blocks |
| PR summary under 200 lines | — | Currently 230 lines |

---

## §6. Run-9 Verification Checklist

1. Push auth: PR created successfully (validate write access, not just read)
2. Count attributes: all `*_count` in agent-extensions.yaml use `type: int`
3. No `String()` wrapping on count values in code
4. API-004: sdk-node removed from target peerDependencies (if target fixed)
5. Advisory contradiction rate: <30% (implement CDQ-006 exemption)
6. Agent notes: rule codes include labels
7. journal-graph.js: committed (investigate reassembly validator)
8. Files committed: ≥12 (no regression)
9. Quality: ≥92% (no regression)
10. Verbose output: visual separation between files
11. Pre-run: verify spiny-orb is on main branch before building (run-8 found it on a feature branch)

---

## §7. Score Projections for Run-9

### Minimum (P0 fixes only: push auth + count types)

- **SCH-003**: FAIL → PASS (count types enforced by validator)
- **API-004**: Still FAIL (target project fix)
- **Expected score**: 24/25 (96%), **12+ files**
- **After 50% discount**: 23-24/25 (92-96%), **12+ files**
- **Risk**: journal-graph.js may oscillate back to partial

### Target (P0 + P1 fixes)

- All P0 fixes plus advisory improvements and journal-graph investigation
- **Expected score**: 24/25 (96%), **13+ files**
- **After 50% discount**: 23-24/25, **12-13 files**

### Stretch (P0 + P1 + P2 + API-004 fix)

- All fixes including target project peerDeps cleanup
- **Expected score**: 25/25 (100%), **13 files**
- **After 50% discount**: 24-25/25, **13 files**

### Calibration

Run-7 projected 23-24/25 after discount → actual 23/25. Methodology remains well-calibrated. For run-9, the main uncertainty is journal-graph.js (non-deterministic).
