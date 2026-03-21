# Actionable Fix Output — Run-9

Self-contained handoff from evaluation run-9 to the spiny-orb team.

**Run-9 result**: 25/25 (100%) canonical quality, 12 files committed, $3.97 cost in 43.7 minutes. First perfect quality score. Push failed (7th consecutive).

**Run-8 → Run-9 delta**: +8pp quality (92% → 100%), same files (12 → 12), -$0.03 cost ($4.00 → $3.97).

**Target repo**: commit-story-v2 proper (not the eval copy)
**Branch**: `spiny-orb/instrument-1774115750647` (local — push failed). PR summary at `spiny-orb-pr-summary.md`.

---

## §1. Run-9 Score Summary

| Dimension | Score | Run-8 | Delta | Failures |
|-----------|-------|-------|-------|----------|
| NDS | 2/2 (100%) | 2/2 | — | — |
| COV | 5/5 (100%) | 5/5 | — | — |
| RST | 4/4 (100%) | 4/4 | — | — |
| API | 3/3 (100%) | 2/3 | **+33pp** | — |
| SCH | 4/4 (100%) | 3/4 | **+25pp** | — |
| CDQ | 7/7 (100%) | 7/7 | — | — |
| **Total** | **25/25 (100%)** | **23/25** | **+8pp** | **0 failures** |
| **Gates** | **5/5** | **5/5** | — | — |
| **Files** | **12** | **12** | — | journal-graph.js partial (both runs) |

**Resolved**: API-004 (target repo has sdk-node in devDeps) and SCH-003 (dual-layer count type fix).

**Still failing**: Nothing — zero quality rule failures.

---

## §2. Remaining Quality Rule Failures (0)

None. All 25 quality rules pass on all 12 committed files.

---

## §3. Run-8 Findings Assessment

| # | Finding | Priority | Run-8 | Run-9 | Notes |
|---|---------|----------|-------|-------|-------|
| RUN8-3 | Push auth read vs write | Critical | FAIL | **STILL FAILING** | URL swap not firing — see §4 |
| RUN8-1 | Agent notes bare rule codes | Medium | Present | **FIXED** | Rule labels present in all notes |
| RUN8-4 | Advisory contradiction ~91% | Medium | 91% | **67%** | Improved but above 30% target |
| RUN8-5 | journal-graph.js oscillation | Medium | Partial | **Partial** | Root cause identified (see §4) |
| RUN8-6 | COV-004 flags sync functions | Low | Present | **PARTIALLY FIXED** | CDQ-006 trivial exemptions work, but COV-004 still flags MCP tool files |
| RUN8-7 | NDS-005 false positive on index.js | Low | Present | **STILL PRESENT** | NDS-005 advisory still fires on index.js (false positive) |
| RUN8-2 | Verbose output no separation | Low | No separation | **FIXED** | Visual separation between files |

**Summary**: 3/7 fully fixed, 1 partially fixed, 3 still present.

---

## §4. New Run-9 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN9-1 | Push auth: GITHUB_TOKEN not reaching pushBranch() | Critical | Delivery |
| RUN9-2 | Reassembly validator rejects extension span names | High | File coverage |
| RUN9-3 | PR schema changes section omits span extensions | Medium | PR summary |

### RUN9-1: Push Auth — GITHUB_TOKEN Not Reaching pushBranch()

**Evidence**: Error message shows bare `https://github.com/wiggitywhitney/commit-story-v2.git` URL. If the URL swap had fired, `sanitizeTokenFromError()` would show `x-access-token:***@`. The bare URL means `if (token)` at line 121 of `pushBranch()` was falsy — GITHUB_TOKEN was empty or undefined in the process.

**Fix**: Add diagnostic logging at the start of `pushBranch()`:
```typescript
console.log('pushBranch: GITHUB_TOKEN present:', !!process.env.GITHUB_TOKEN);
console.log('pushBranch: remote URL:', remoteUrl);
```

Then check:
1. Is the token actually in the environment? (vals injection vs process inheritance)
2. If yes, does `resolveAuthenticatedUrl()` produce a different URL?
3. If yes, does `git remote set-url --push` succeed?

**Acceptance criteria**: Push succeeds; PR created on GitHub.

### RUN9-2: Reassembly Validator Rejects Extension Span Names

**Evidence**: Diagnostic output: `SCH-001 check failed: "commit_story.journal.generate_sections" at line 601: not found in registry span definitions.`

The span IS declared in agent-extensions.yaml (`span.commit_story.journal.generate_sections`). The reassembly validator checks the base registry but not the extensions.

**Fix**: Make the reassembly validator's SCH-001 check resolve span names against the combined registry (base + agent-extensions.yaml). The extensions are already written to disk before reassembly validation runs.

**Acceptance criteria**:
1. journal-graph.js commits with extension span names
2. Reassembly SCH-001 uses resolved registry
3. journal-graph.js costs <20K output tokens (succeeds first attempt)

### RUN9-3: PR Schema Changes Section Omits Span Extensions

**Evidence**: Schema Changes section lists 10 added attributes but zero span extensions. The 26 span names are the primary schema contribution.

**Fix**: Include span extensions in the Schema Changes section alongside attributes.

**Acceptance criteria**: Schema Changes lists both attributes and spans.

---

## §5. Priority Action Matrix

### P0 — Must fix for run-10

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Debug and fix GITHUB_TOKEN propagation to pushBranch() | RUN9-1 | Push succeeds, PR created on GitHub |
| Fix reassembly validator to check extensions | RUN9-2 | journal-graph.js commits with extension span names |

### P1 — Should fix for run-10

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Fix COV-004 to understand sync-registration-of-async-callback pattern | RUN8-6 (partial) | MCP tool files don't generate COV-004 advisories |
| Fix SCH-004 semantic matching accuracy | RUN8-4 (partial) | generated_count not matched to gen_ai.usage.output_tokens |
| Include span extensions in PR schema changes | RUN9-3 | Both attributes and spans listed |
| Fix NDS-005 false positive on index.js | RUN8-7 | No false NDS-005 advisory on files with preserved try/catch |

### P2 — Nice to have

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Advisory contradiction rate <30% | RUN8-4 | Overall rate below target |

---

## §6. Run-10 Verification Checklist

1. Push auth: PR created successfully (check GITHUB_TOKEN diagnostic log)
2. journal-graph.js: committed (reassembly validator accepts extension span names)
3. Quality: 25/25 maintained (no regression from perfect score)
4. Files committed: ≥13 (journal-graph.js recovered)
5. Advisory contradiction rate: <30%
6. Schema changes section: includes span extensions
7. No NDS-005 false positive on index.js
8. Pre-run: verify spiny-orb on main, fresh build
9. Cost: ≤$4.00 (journal-graph.js should be cheaper with first-attempt success)
10. Test suite: 557+ tests pass, 0 failures

---

## §7. Score Projections for Run-10

### Minimum (P0 fixes only: push auth + reassembly validator)

- **Quality**: 25/25 (100%) maintained
- **Files**: 13 (journal-graph.js recovered)
- **Push/PR**: YES (if GITHUB_TOKEN fix works)
- **After 50% discount**: 25/25, 12-13 files, PR 50% likely

### Target (P0 + P1 fixes)

- All P0 fixes plus advisory improvements
- **Quality**: 25/25, **13 files**, PR created
- **Advisory rate**: <30%
- **After 50% discount**: 25/25, 12-13 files, PR likely

### Stretch (all fixes)

- **Quality**: 25/25, **13 files**, PR created, <10% advisory contradiction rate
- **After 50% discount**: 25/25, 13 files

### Calibration

Run-8 projected minimum 23-24/25 → actual 25/25. The 50% discount was conservative for quality (all projections exceeded). The discount correctly predicted journal-graph.js would oscillate but missed API-004 passing. For run-10, quality is likely stable at 25/25 — the main uncertainty is push auth (7 consecutive failures, but diagnostic logging will expose the root cause) and journal-graph.js (validator fix is deterministic, not LLM-dependent).
