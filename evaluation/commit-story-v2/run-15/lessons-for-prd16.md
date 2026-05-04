# Lessons for PRD #16

Observations collected during run-15 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

**RUN14-1 fix status — NOT LANDED (framing changed by PRD #483 M2):**
No specific fix for summaryNode catch-block consistency was filed as a GitHub issue or merged to spiny-orb. More importantly, PRD #483 Milestone M2 (completed) determined via Decision 5 that the COV-003 `isExpectedConditionCatch` exemption is CORRECT per OTel Recording Errors spec: "Errors that were retried or handled (allowing an operation to complete gracefully) SHOULD NOT be recorded on spans." LangGraph nodes returning degraded state (`{ summary: '[failed]' }`) without rethrowing are graceful-degradation catches — they SHOULD NOT have `span.recordException() + span.setStatus(ERROR)`. The run-14 COV-003/CDQ-003 failures for summaryNode may have been rubric errors (evaluating against the wrong standard). technicalNode and dialogueNode having error recording in their catch blocks is now the suspect behavior (over-recording per OTel spec), not summaryNode's absence.

**Implication for run-15**: COV-003/CDQ-003 for summaryNode may PASS if the validator's `isExpectedConditionCatch` heuristic correctly exempts graceful-degradation catches. OR they may still fail if the heuristic doesn't recognize LangGraph return patterns. Watch carefully during evaluation.

**COV-004 outcome from PRD #483 M2**: Decision was "keep (advisory)" — NOT promoted to blocking, no per-function validator added. Message strengthened (removed "Consider" language, added directive wording, clarified RST-001 exemption). Expect same COV-004 behavior pattern as run-14 unless the strengthened message reaches the agent more effectively.

**spiny-orb branch**: `fix/724-attribute-namespace` (SHA 1b6c3d9) — 2 commits ahead of main. Fix: attribute namespace enforcement in prompt.ts — changes "Derive attribute namespace" to "MUST start with namespace prefix, Do NOT invent new namespace prefixes" with anti-URL-anchoring guidance. PR #739 open with "run-acceptance" label (pending acceptance gate).

**PRD #483 M2 significant finding — NDS-005 and NDS-004 promoted to blocking**:
- NDS-004 (exported function signature preservation): promoted to blocking
- NDS-005 (control flow preservation): promoted to blocking, LLM judge removed (now deterministic)
- NDS-006 (module system preservation): promoted to blocking
These are now harder blocks than in prior runs. If the agent accidentally modifies an exported function signature or changes control flow, it will be harder to commit.

**API rule changes from PRD #483**:
- API-001 (non-API OTel imports): refactored + promoted to blocking (now diff-based, only flags agent-added imports)
- API-004 (SDK internal packages): import-level check promoted to blocking
- API-003: deleted
- SCH-004: deleted (patterns migrated to SCH-002)
- SCH-001/SCH-002: rebuilt with semantic dedup, sparse-registry downgrade removed (now unconditionally blocking)
These changes apply to all runs going forward. The COV-003 `isExpectedConditionCatch` finding is the most significant for run-15.

**commit-story-v2 working tree note**: The instrument branch `spiny-orb/instrument-1776263984892` had staged changes that were unstaged main-branch versions of the src files — leftover from run-14's IS scoring "git checkout main -- src/ examples/" step. These were correctly discarded (not committed) before switching to main.

**Target repo**: main, clean working tree (only untracked journal files). spiny-orb.yaml and semconv/ confirmed present.

**File count**: 30 JS files in `src/` — same as runs 12, 13, and 14.

**Node version**: checked via PATH
**spiny-orb version**: 1.0.0 (SHA 1b6c3d9, fix/724-attribute-namespace branch)

## Run-Level Observations

**PROGRESS.md prompt blocks push when 's' (skip) is chosen**: spiny-orb's orchestrator prompts for a PROGRESS.md entry before pushing the instrument branch. Pressing 's' caused the push to fail from spiny-orb's perspective ("Push failed — skipping PR creation"). A second push attempt was made automatically but failed because the branch was already on the remote. Total run time: 2h 7m (81min instrumentation + 46min PROGRESS.md + internal CodeRabbit review). Action needed: either fix the 's' path to be a true bypass, or document the expected behavior.

**spiny-orb internal CodeRabbit review ran after PROGRESS.md interaction**: The orchestrator ran its own CodeRabbit CLI review as part of the pre-push flow, surfacing 9 findings including: summary-detector.js missing outer catch in getDaysWithEntries/getDaysWithDailySummaries (potential CDQ-003); index.js process.exit() inside span (acknowledged limitation); SCH-001 "the existing name" placeholder in advisory messages (spiny-orb output issue).

**summary-detector.js inconsistency: findUnsummarizedDays has catch, getDaysWithEntries/getDaysWithDailySummaries do not**: Three functions share a try/finally structure, but only findUnsummarizedDays records exceptions. The inner ENOENT catches are graceful-degradation (NDS-007 correct), but the outer span wrappers for the first two functions have no catch for unexpected errors. This may or may not be a CDQ-003 finding depending on rubric interpretation.

**journal-graph.js 1-attempt success may not be reproducible**: The breakthrough from 3 attempts to 1 attempt is positive, but root cause is unknown. It could be --thinking flag, fix/724 attribute guidance, or LLM variation. Don't assume it's fixed until run-16 confirms.

## Evaluation Process Observations

<!-- Populated during structured evaluation -->
