# Spiny-Orb Findings — Run-8

Findings from evaluation run-8. Each finding includes evidence, priority, and acceptance criteria for the spiny-orb team.

**Run-8 baseline**: 22/25 (88%) canonical quality, 13 files committed (run-7 result).

**Notation**: RUN8-N for new findings. Cross-references to prior findings use RUN7-N format.

---

## Critical

## High

## Medium

## Low

---

## Run-7 Finding Status

| Run-7 Finding | Status in Run-8 | Notes |
|---------------|-----------------|-------|
| RUN7-4: Push auth failure | **Code verified fixed** (PR #251) | Fail-fast for HTTPS GitHub without GITHUB_TOKEN; validates before file processing |
| RUN7-2: Opaque rule codes | **Code verified fixed** (PR #249) | `formatRuleId()` with 28 human-readable rule labels |
| RUN7-3: No user-facing docs | **Code verified fixed** (PR #249) | 3 docs: interpreting-output, architecture, rules-reference |
| RUN7-1: Verbose output truncates | **Code verified fixed** (PR #249, #257) | Truncation removed; PR notes capped at 3/file |
| RUN7-5: Span name collision | **Code verified fixed** (PR #256) | Prompt injection + collision detection/warning in dispatch |
| RUN7-6: Count attributes as string | **Code verified fixed** (PR #256) | SCH-003 prompt guidance; no runtime validator |
| RUN7-7: Span count inflated in PR | **Partial** (PR #257) | Notes truncated but count still from agent self-report (issue #253 open) |
| RUN7-8: Schema Changes omits extensions | **Code verified fixed** (PR #257) | Schema Extensions column added to per-file table |
| RUN7-9: Agent Notes is compliance dump | **Code verified fixed** (PR #259) | 3-5 notes guidance + MAX_NOTES_PER_FILE=3 truncation |
| RUN7-10: CDQ-006 advisories repeat 28x | **Code verified fixed** (PR #257) | Grouped by ruleId+message with file count |
