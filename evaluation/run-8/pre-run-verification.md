# Pre-Run Verification — Run-8

Verification of spiny-orb fixes before executing evaluation run-8.

**Spiny-orb version at verification**: v0.1.0, commit `8dd2540` (Merge PR #259), built 2026-03-21 10:13:30
**Branch**: main (clean working tree, stashed fix/260 WIP)
**Date**: 2026-03-21

---

## 1. Handoff Triage Review

The run-7 actionable fix output (`evaluation/run-7/actionable-fix-output.md`) recommended 10 findings organized into P0/P1/P2 priorities. The spiny-orb team filed issues and merged PRs for **all 10 findings** — nothing was rejected. Additionally, they proactively added API-004 SDK detection (issue #254) beyond what was recommended.

### Triage Summary

| Finding | Priority | Issue | PR | Status | Notes |
|---------|----------|-------|-----|--------|-------|
| RUN7-4 Push auth fail-fast | P0 | #250 | #251 | **Fixed** | Fail-fast for HTTPS GitHub without GITHUB_TOKEN |
| RUN7-5 Span name collision | P0 | #252 | #256 | **Fixed** | Prompt injection + collision detection/warning |
| RUN7-6 Count attribute types | P0 | #252 | #256 | **Fixed** | SCH-003 prompt guidance for `type: int` |
| RUN7-2 Rule labels | P1 | #248 | #249 | **Fixed** | `formatRuleId()` with human-readable labels |
| RUN7-7 Span count accuracy | P1 | #253 | #257 | **Partial** | Agent notes truncated, but count still from agent self-report |
| RUN7-8 Schema extensions in PR | P1 | #253 | #257 | **Fixed** | Schema Extensions column added to per-file table |
| RUN7-9 Agent notes compression | P1 | #255 | #259 | **Fixed** | 3-5 notes guidance in prompt + MAX_NOTES_PER_FILE=3 truncation |
| RUN7-10 Advisory grouping | P1 | — | #257 | **Fixed** | Grouped by ruleId+message with file count |
| RUN7-3 User docs | P2 | #248 | #249 | **Fixed** | 3 docs: interpreting-output, architecture, rules-reference |
| RUN7-1 Verbose output | P2 | #248 | #249, #257 | **Fixed** | Note truncation removed, PR notes capped at 3/file |
| API-004 SDK detection | Beyond | #254 | #258 | **New** | Advisory detection for `@opentelemetry/sdk-*` in library deps |

**Open issue**: #253 (PR summary quality) remains open — span count accuracy (RUN7-7) uses agent self-report, not post-hoc `startActiveSpan` counting.

**Rejected findings**: None. All 10 findings were filed and addressed.

---

## 2. Push Auth Verification (Critical)

**Status**: VERIFIED FIXED

PR #251 (`fix: fail fast when HTTPS GitHub remote has no GITHUB_TOKEN`) addresses the root cause:

**Before**: `validateCredentials()` used `git ls-remote --heads` which succeeds for public repos without auth (read access). All 29 files processed ($3.22 in tokens), then push fails.

**After**: Three-part logic in `src/git/git-wrapper.ts`:
1. **GITHUB_TOKEN present + HTTPS**: Validates using token-embedded URL (write access check)
2. **No GITHUB_TOKEN + HTTPS GitHub**: Throws immediately with remediation options
3. **SSH/non-GitHub HTTPS**: Standard `git ls-remote` fallback

Validation runs **before** `coordinate()` (line 95 of `src/deliverables/git-workflow.ts`), so failure happens before any file processing.

**Test coverage**: 4 unit tests + e2e acceptance gate test for full push+PR pipeline.

**Concern**: None. Fix is comprehensive and well-tested.

---

## 3. COV-006 Span Name Uniqueness Verification

**Status**: VERIFIED FIXED

PR #256 (`fix: prevent cross-file span name collisions and add count type guidance`) implements:

1. **`spanNameOrigins` Map** in `dispatch.ts` tracks which file declared each span name
2. **Prompt injection**: `buildUserMessage()` lists existing span names from earlier files with guidance: "Do NOT reuse these names for different operations"
3. **Collision detection**: After each file, strip `span.` prefix from extensions and check against prior declarations
4. **Multi-turn awareness**: `buildFixPrompt()` also includes existing span names reminder

**Architecture**: Accumulation is in-memory (decoupled from registry writes), working even without a Weaver registry.

**Concern**: Collision detection is warning-only (doesn't reject the file). However, the prompt injection approach prevents collisions proactively rather than just detecting them.

---

## 4. CDQ-005 Count Attribute Types Verification

**Status**: VERIFIED FIXED (prompt-based)

PR #256 adds to the SCH-003 scoring rule in `src/agent/prompt.ts`:
> Count attributes (*_count) MUST use type: int in schema extensions and pass raw numbers to setAttribute — never wrap numeric values in String().

**Mechanism**: Prompt constraint, not runtime validation. The LLM reads this rule before generating code.

**Concern**: No validator blocks string-wrapped count attributes at runtime. Relies on LLM compliance with SCH-003. If the LLM ignores it, the issue will recur. This is acceptable given the prompt-based architecture — we'll verify in the run.

---

## 5. PR Summary Improvements Verification

| Improvement | Status | Evidence |
|-------------|--------|----------|
| RUN7-2 Rule labels | **Fixed** | `formatRuleId()` in `src/validation/rule-names.ts`, 28 rules mapped |
| RUN7-7 Span count accuracy | **Partial** | Still uses `spanCategories` sum from agent, no post-hoc verification |
| RUN7-8 Schema extensions | **Fixed** | Schema Extensions column in per-file table |
| RUN7-9 Agent notes | **Fixed** | 3-5 notes guidance + MAX_NOTES_PER_FILE=3 truncation |
| RUN7-10 Advisory grouping | **Fixed** | Grouped by ruleId+message, shows file count |
| RUN7-1 Verbose output | **Fixed** | Note truncation removed, PR notes capped |
| RUN7-3 User docs | **Fixed** | 3 docs created in `docs/` |

---

## 6. API-004 Check

**Status**: Pre-existing on target project (commit-story-v2)

`@opentelemetry/sdk-node` is still in commit-story-v2's `peerDependencies`. This is a target project fix.

**New**: Spiny-orb now has API-004 advisory detection (PR #258) that scans `package.json` for `@opentelemetry/sdk-*` in library dependencies. This will generate an advisory during the run. The advisory is non-blocking.

---

## 7-8. Rebuild and Version

**Status**: COMPLETE

- Switched spiny-orb to `main` branch (was on `fix/260-pushbranch-upstream-tracking`)
- Stashed WIP changes from fix/260 to ensure clean build
- `npm run prepare` succeeded — clean TypeScript compilation
- **Version**: v0.1.0
- **Commit**: `8dd2540` (Merge PR #259 — agent notes guidance)
- **Build timestamp**: 2026-03-21 10:13:30
- **Note**: fix/260 (upstream tracking for `pushBranch`) is WIP, not merged. This may affect PR creation if `gh pr create` can't detect the branch. The e2e acceptance gate should catch this.

---

## 9. File Recovery Expectations

### Run-8 Predictions (with 50% discount for unmasked bug risk)

**File count**: 13+ files expected. Run-7 achieved 100% success rate on all 29 files (13 committed, 16 correct skips, 0 failures). No code changes to the target project since run-7.

**Quality**: With COV-006 and CDQ-005 fixes:
- **Minimum (P0 only)**: 24/25 (96%) before discount → 23-24/25 (92-96%) after discount
- **Target (P0+P1)**: 24/25 (96%) before discount → 23-24/25 after discount
- **Ceiling**: API-004 remains (target project fix), so 24/25 is the maximum

**New blocker risk**: Dominant blocker peeling pattern continues. Severity has been decreasing (run-5: blocks all files → run-6: blocks 8 files → run-7: trace inconvenience). Expect something minor to surface.

**PR creation**: With push auth fix verified, first successful PR creation expected (6th attempt).

---

## 10. Run-7 Findings: Fixed vs Still Open

| Finding | Verified Fixed | Still Open | Notes |
|---------|---------------|------------|-------|
| RUN7-4 Push auth | Yes | | Comprehensive fail-fast logic |
| RUN7-5 Span collision | Yes | | Prompt injection + detection |
| RUN7-6 Count types | Yes | | Prompt guidance (no runtime validation) |
| RUN7-2 Rule labels | Yes | | 28 rules with human-readable labels |
| RUN7-7 Span count | | Partial | Count still from agent self-report |
| RUN7-8 Schema extensions | Yes | | Column added to per-file table |
| RUN7-9 Agent notes | Yes | | Prompt + truncation |
| RUN7-10 Advisory grouping | Yes | | Grouped by ruleId+message |
| RUN7-3 User docs | Yes | | 3 docs created |
| RUN7-1 Verbose output | Yes | | Truncation removed, notes capped |

**9/10 fully fixed, 1/10 partial** (RUN7-7 span count accuracy).
