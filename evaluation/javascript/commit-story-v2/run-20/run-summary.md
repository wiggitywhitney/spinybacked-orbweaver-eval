# Run Summary — Run-20

**Date**: 2026-06-01
**Started**: 2026-06-01T11:24:05.723Z
**Duration**: 1h 31m 23.2s
**Branch**: spiny-orb/instrument-1780313045724
**Spiny-orb build**: 1.0.0 (SHA e12e75b, main branch — post PR #897 prompt generality cleanup)
**Target repo**: commit-story-v2 main
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/73

---

## Results

| Metric | Value |
|--------|-------|
| Files processed | 30 |
| Committed | 12 |
| Failed | 1 |
| Partial | 0 |
| Correct skips | 17 |
| Skipped | 0 |
| Input tokens | 272.2K |
| Output tokens | 357.9K (388.9K cached) |
| Total cost | $9.08 |
| Live-check | OK (603 spans, 4165 advisory findings) |
| Push | AUTO ✅ |
| PR created | YES — #73 (auto) |

---

## Committed Files (12)

| # | File | Spans | Attempts | Cost | Notes |
|---|------|-------|----------|------|-------|
| 1 | collectors/claude-collector.js | 1 | 3 | $0.50 | **P1 RESOLVED ✅** — was PARTIAL in run-19 (NDS-003 allMessages.sort); PRD #885 fix held |
| 2 | collectors/git-collector.js | 2 | 3 | $0.90 | Agent invented commit_story.git.command, .parent_count, .is_merge extensions without explicit per-function guidance |
| 3 | generators/journal-graph.js | 4 | 2 | $1.44 | 4th consecutive success |
| 4 | generators/summary-graph.js | 6 | 2 | $1.26 | |
| 5 | integrators/context-integrator.js | 1 | 3 | $0.60 | +2 attempts vs run-19 |
| 6 | utils/journal-paths.js | 1 | 1 | $0.20 | |
| 7 | managers/journal-manager.js | 2 | 3 | $1.08 | +2 attempts vs run-19; discoverReflections used entries_count (not quotes_count) — potential SCH-002 resolution |
| 8 | managers/summary-manager.js | 9 | 1 | $0.62 | **P1 RESOLVED ✅** — was PARTIAL (6 spans) in run-19; all 3 generateAndSave* functions committed; PRD #885 fix confirmed |
| 9 | commands/summarize.js | 3 | 2 | $0.56 | |
| 10 | utils/summary-detector.js | 9 | 1 | $0.34 | |
| 11 | managers/auto-summarize.js | 3 | 1 | $0.21 | **P1 RESOLVED ✅** — was PARTIAL (2 spans) in run-19; triggerAutoSummaries committed; PRD #885 fix confirmed |
| 12 | src/index.js | 1 | 3 | $0.93 | +2 attempts vs run-19 |

**Total spans (committed)**: 42

---

## Failed Files (1)

| File | Spans | Attempts | Cost | Failure |
|------|-------|----------|------|---------|
| mcp/server.js | 0 | 3 | $0.25 | NDS-003 oscillation: 21 duplicate errors across all 3 attempts (NDS-003:1, :3–:20, :37, :39) — new regression, was SUCCESS (1 span) in run-19 |

**Root cause**: Unknown — the 21 NDS-003 violations with identical line numbers across all 3 attempts suggest the agent was making the same code change every time, and Prettier was consistently reformatting it differently. This is a different failure class from the run-19 indentation-driven pattern (which was fixed by PRD #885). Server.js likely has a distinct NDS-003 trigger that PRD #885 did not address. Debug dumps needed for diagnosis.

---

## Run-19 → Run-20 Comparison

| Metric | Run-19 | Run-20 | Delta |
|--------|--------|--------|-------|
| Committed | 10 | **12** | +2 |
| Failed | 0 | 1 | +1 |
| Partial | 3 | **0** | -3 |
| Total spans | 30 | **42** | +12 |
| Cost | $8.83 | $9.08 | +$0.25 |

**Previously partial, now committed**: claude-collector.js (+0 new spans, resolved), summary-manager.js (+3 spans, 6→9), auto-summarize.js (+1 span, 2→3)

**Previously committed, now failed**: mcp/server.js (new NDS-003 oscillation regression)

---

## Key Findings

**RUN19-1 (P1 — NDS-003 multiLine)**: ✅ RESOLVED across all 4 affected files. PRD #885 multiLine flag normalization confirmed effective on return object literals, spread arrays, and multi-line call arguments at deeper indentation.

**RUN19-2 (P2 — getCommitData COV-005)**: ✅ RESOLVED without explicit per-function guidance. Agent invented commit_story.git.command, commit_story.git.parent_count, and commit_story.git.is_merge — exactly the three missing attributes flagged in run-19. General CDQ-005/COV-005 guidance was sufficient.

**RUN18-2 (P2 — SCH-002 quotes_count)**: 🔍 POTENTIALLY RESOLVED — discoverReflections used commit_story.journal.entries_count instead of quotes_count. Third-consecutive-run watch may be broken. Requires per-file evaluation to confirm (is entries_count semantically correct?).

**RUN19-3 (IS SPA-002 orphan span)**: Likely resolved — generateAndSave* orchestrators are now present. Confirmation requires IS scoring run.

**New finding (RUN20-1)**: mcp/server.js NDS-003 oscillation — 21 violations at fixed line numbers, all 3 attempts identical. New regression. Requires debug dump analysis to determine root cause.

**Note**: Run-19 had the spiny-orb live-check report `spiny-orb-live-check-report.json` left in the commit-story-v2 working tree. Same file present in run-20 as a new untracked file. Unrelated to instrumentation results.
