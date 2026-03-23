# Actionable Fix Output — Run-10

Self-contained handoff from evaluation run-10 to the spiny-orb team.

**Run-10 result**: 23/25 (92%) canonical quality, 12 files committed, $4.36 cost in 45.9 minutes. Quality regressed 8pp from run-9's perfect 100%.

**Run-9 → Run-10 delta**: -8pp quality (100% → 92%), same files (12 → 12, different composition), +$0.39 cost ($3.97 → $4.36).

**Target repo**: commit-story-v2 proper (same as run-9)
**Branch**: `spiny-orb/instrument-1774247624091` (local — push failed). PR summary committed on branch.

---

## §1. Run-10 Score Summary

| Dimension | Score | Run-9 | Delta | Failures |
|-----------|-------|-------|-------|----------|
| NDS | 2/2 (100%) | 2/2 | — | — |
| COV | 5/5 (100%) | 5/5 | — | — |
| RST | 4/4 (100%) | 4/4 | — | — |
| API | 3/3 (100%) | 3/3 | — | — |
| SCH | 3/4 (75%) | 4/4 | **-25pp** | SCH-003 |
| CDQ | 6/7 (86%) | 7/7 | **-14pp** | CDQ-007 |
| **Total** | **23/25 (92%)** | **25/25** | **-8pp** | **2 failures** |
| **Gates** | **5/5** | **5/5** | — | — |
| **Files** | **12** | **12** | — | journal-graph.js gained, summary-manager.js lost (transient) |

---

## §2. Remaining Quality Rule Failures (2)

### SCH-003: Boolean Attributes Declared as String

**Affected files**: summarize.js (2/12), index.js (1/12)

**Evidence**:
- `commit_story.summarize.force`: declared `type: string` in agent-extensions.yaml, set to boolean value
- `commit_story.commit.is_merge`: declared `type: string` in agent-extensions.yaml, set to boolean value

**Root cause**: The schema accumulator defaults non-count attributes to `type: string`. The dual-layer count-type fix (PRs #267, #270, #286) specifically targets `*_count` patterns → `int`. Boolean attributes are not detected or corrected.

**Fix**: Extend the type correction logic to detect boolean values:
1. **Write-time**: When the agent declares an attribute and the value is `true`/`false` or the attribute name contains `is_`, `has_`, `should_`, `force`, declare as `type: boolean`
2. **Validation-time**: Post-generation validator rejects attributes where the set value is boolean but the declared type is not `boolean`

**Acceptance criteria**:
1. `commit_story.summarize.force` declared as `type: boolean` in agent-extensions.yaml
2. `commit_story.commit.is_merge` declared as `type: boolean` in agent-extensions.yaml
3. Boolean values set via `setAttribute` match the declared type

### CDQ-007: Optional Chaining Without Defined-Value Guard

**Affected files**: summary-graph.js (1/12)

**Evidence**: 6 instances of `entries?.length`, `dailySummaries?.length`, `weeklySummaries?.length` passed to `setAttribute` without checking for undefined. Lines 177, 260, 393, 476, 612, 698.

**Root cause**: The agent uses optional chaining (`?.length`) as a null-safety pattern, but this yields `undefined` when the source is null/undefined. While OTel SDK silently drops undefined attributes, it's technically a rubric violation and indicates the agent isn't guarding attribute values.

**Fix**: Add a prompt guidance or validation check:
1. **Prompt**: "When setting attributes from optional parameters, guard with `if (value !== undefined)` before `setAttribute`"
2. **Validation**: Post-generation check for `?.` in `setAttribute` value arguments — flag as needing a guard

**Acceptance criteria**:
1. No `setAttribute` calls with `?.` in value arguments without a preceding `if` guard
2. All attribute values are guaranteed non-undefined when set

---

## §3. Run-9 Findings Assessment

| # | Finding | Priority | Run-9 | Run-10 | Notes |
|---|---------|----------|-------|--------|-------|
| RUN9-1 | Push auth: token not reaching pushBranch | Critical | FAIL | **PARTIALLY FIXED** | URL swap works, but token rejected by GitHub |
| RUN9-2 | Reassembly validator extensions | High | Partial | **FIXED** | journal-graph.js committed (PR #292) |
| RUN9-3 | PR schema changes omits spans | Medium | Missing | **PARTIALLY FIXED** | Code merged but span extensions still not in output |
| RUN9-5 | Advisory contradiction rate 67% | Medium | 67% | **Improved** | Only 1 advisory visible — appears much better |
| RUN9-7 | PR summary on branch | Medium | Untracked | **FIXED** | Summary committed on instrument branch |

**Summary**: 2/5 fully fixed, 2 partially fixed, 1 still open (push auth — new error mode).

---

## §4. New Run-10 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN10-1 | Push auth: URL swap works but token rejected by GitHub | Critical | Delivery |
| RUN10-2 | Weaver CLI fails on large accumulated registry | Medium | Tooling reliability |
| RUN10-3 | Schema accumulator declares boolean attributes as string | Medium | Quality (SCH-003) |
| RUN10-4 | Optional chaining in setAttribute without guard | Low | Quality (CDQ-007) |

### RUN10-1: Push Auth — Token Rejected by GitHub

**Progress**: The URL swap mechanism is now working correctly:
- `GITHUB_TOKEN present=true` (token in process environment)
- `urlChanged=true, path=token-swap` (URL embedding fires)

But GitHub responds: "Invalid username or token. Password authentication is not supported for Git operations."

**Diagnosis**: The token IS being sent, but GitHub rejects it. Check:
1. Token scopes via `curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com` — look for `X-OAuth-Scopes` header
2. Token type: classic PAT vs fine-grained
3. Direct push test: `git push --dry-run https://x-access-token:$GITHUB_TOKEN@github.com/wiggitywhitney/commit-story-v2.git`

**Acceptance criteria**: Push succeeds, PR created on GitHub.

### RUN10-3: Schema Accumulator Boolean Type Fix

See §2 for full details. Same class of bug as count-type issue but for boolean attributes.

---

## §5. Priority Action Matrix

### P0 — Must fix for run-11

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Investigate and fix GITHUB_TOKEN scopes/format | RUN10-1 | Push succeeds, PR created |
| Extend schema accumulator type detection to booleans | RUN10-3/SCH-003 | Boolean attrs declared as `type: boolean` |

### P1 — Should fix for run-11

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Add defined-value guard for optional chaining in setAttribute | RUN10-4/CDQ-007 | No `?.` in setAttribute values without guard |
| Fix PR summary span extensions listing | RUN9-3 (partial) | Schema Changes includes both attrs and spans |
| Add retry logic for Weaver CLI commands | RUN10-2 | Weaver failures retried at least once |

### P2 — Nice to have

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Reduce journal-graph.js attempts from 3 to 1 | Cost | First-attempt success, <20K tokens |

---

## §6. Run-11 Verification Checklist

1. Push auth: PR created successfully (check token scopes first)
2. Quality: 25/25 maintained (SCH-003 boolean fix + CDQ-007 guard fix)
3. Files committed: ≥13 (journal-graph.js + summary-manager.js both committed)
4. SCH-003: boolean attributes declared as `type: boolean`
5. CDQ-007: no `?.` in setAttribute value arguments
6. PR schema changes: includes span extensions
7. Weaver CLI: completes for all 30 files
8. Pre-run: verify spiny-orb on main, fresh build
9. Cost: ≤$4.00 (journal-graph.js first-attempt if possible)
10. Test suite: 564+ tests pass, 0 failures

---

## §7. Score Projections for Run-11

### Minimum (P0 fixes only: push auth + boolean types)

- **Quality**: 24/25 (96%) — SCH-003 fixed, CDQ-007 still open
- **Files**: 13 (summary-manager.js recovered from transient failure)
- **Push/PR**: YES (if token scopes fixed)
- **After 50% discount**: 23-24/25, 12-13 files, PR 50% likely

### Target (P0 + P1 fixes)

- All P0 fixes plus CDQ-007 guard and Weaver retry
- **Quality**: 25/25 (100%), **13 files**, PR created
- **After 50% discount**: 24-25/25, 12-13 files, PR likely

### Stretch (all fixes)

- **Quality**: 25/25, **13 files**, PR created, journal-graph.js first-attempt
- **After 50% discount**: 25/25, 13 files

### Calibration

Run-9 projected 25/25 → actual 23/25. The projection was overconfident because it didn't account for NEW failure types emerging from LLM-generated code variation. The 50% discount should apply not just to fix effectiveness but also to new-failure risk. For run-11, expect 23-25/25 after discount — the boolean type fix is deterministic, but new code patterns could introduce new failures.
