# PR Evaluation — Run-10

PR was NOT created (push auth failed 8th time). Evaluating local summary committed on instrument branch.

## Summary Quality

- **Length**: 206 lines (slightly above 200-line target)
- **Per-file table**: Accurate — 12 committed, 1 failed, 17 correct skips match branch state
- **Span counts**: All match branch state (verified by startActiveSpan count in diff)
- **Cost reported**: $4.36 (vs $3.97 run-9)
- **Committed on branch**: YES (RUN9-7 fix confirmed)

## Schema Changes Section

- **Attributes**: 10 added attributes listed — all correct
- **Span Extensions**: NOT LISTED — the Schema Changes section omits the 28 span extensions. Only attributes are shown. **RUN9-3 partially fixed** — the code was implemented (PR #319) but the output doesn't include span extensions.
  - **Observed**: Schema Changes section lists 10 attributes, zero span extensions.
  - **Hypothesis**: The Weaver CLI failure on file 22/30 may have left the registry in an inconsistent state, preventing the span extension comparison from completing. Alternatively, the PR summary generator may not be using the span extensions feature correctly.
  - **Verification needed**: Check the span extension listing code path in spiny-orb's pr-summary.ts against the actual Weaver output during a run without CLI failures.

## Advisory Findings

Only 1 advisory visible in output:
- **COV-004** on journal-graph.js: `technicalNode` (async) has no span

This advisory does NOT contradict the agent's decision — the agent correctly skipped `technicalNode` (covered by `generateJournalSections` orchestrator span) and flagged it as advisory. The advisory is informational, not contradictory.

**Advisory contradiction rate**: Cannot fully assess from visible output — only 1 advisory shown. Appears significantly improved from run-9's 67%.

## Rule Code Labels

Agent notes include rule code labels (e.g., "RST-001 (No Utility Spans)", "RST-004 (No Internal Detail Spans)") — consistent and present throughout.

## Cost Breakdown

| File | Cost | % of Total |
|------|------|------------|
| journal-graph.js | $1.62 | 37.2% |
| summary-detector.js | $0.40 | 9.2% |
| context-integrator.js | $0.28 | 6.4% |
| server.js | $0.27 | 6.2% |
| summary-graph.js | $0.25 | 5.7% |
| summary-manager.js (failed) | $0.24 | 5.5% |
| index.js | $0.21 | 4.8% |
| journal-manager.js | $0.20 | 4.6% |
| summarize.js | $0.19 | 4.4% |
| auto-summarize.js | $0.15 | 3.4% |
| claude-collector.js | $0.13 | 3.0% |
| git-collector.js | $0.12 | 2.8% |
| journal-paths.js | $0.06 | 1.4% |
| 17 correct skips | $0.24 | 5.5% |
| **Total** | **$4.36** | |

journal-graph.js remains the most expensive file (37.2%), down from 42% in run-9. Total cost up $0.39 from run-9 ($3.97 → $4.36).
