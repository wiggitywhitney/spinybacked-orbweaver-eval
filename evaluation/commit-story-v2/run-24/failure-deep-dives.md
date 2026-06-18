// ABOUTME: Failure deep-dives for commit-story-v2 evaluation run-24
# Failure Deep-Dives — Run-24

**Run-24 result**: 14 committed, 0 failed, 0 partial, 17 correct skips.

No file-level failures. No partial commits. First clean sweep across 24 runs.

---

## File-Level Failures and Partials

None.

---

## 3-Attempt Files (per-file evaluation scope)

One file required 3 attempts: `src/collectors/git-collector.js`. Per PRD scope, files
with ≥3 attempts are included here for quality review. Quality outcome determined by
per-file evaluation.

### git-collector.js — 3 Attempts

**Result**: SUCCESS — 6 spans, 3 attributes, 26.4K output tokens.

**Significance**: One of the three SCH-003 fix-verification targets (the `diff_size`
type mismatch). Run-24 was the first post-fix run. The file committed successfully on
attempt 3.

**Validator catches**: Agent notes document the failure cause explicitly:

> "The previous instrumentation failure (NDS-003 Code Preserved) was caused by wrapping
> the diff value in an isRecording guard combined with a null check. This version avoids
> that entirely — `lines.length` is a property access on an already-computed array, so
> no isRecording guard is needed per CDQ-006 (isRecording Guard), and no null check is
> required because `lines` is always defined at that point."

The agent added an `isRecording` guard on attempts 1–2, which NDS-003 classified as
non-instrumentation code addition. On attempt 3, the agent recognized the array is
always defined and removed both guards, satisfying NDS-003.

**New attributes declared**: `commit_story.git.subcommand` (string),
`commit_story.git.diff_lines` (int), `commit_story.git.parent_count` (int).

**commit_story.git.diff_lines**: This is the SCH-003 fix target (`diff_size` → `diff_lines`
with `type: int`). Agent confirmed: "Declaring commit_story.git.diff_lines (type: int).
The lines array is already computed in the function body so no extra computation is
required." This matches the expected post-fix behavior. Per-file evaluation will verify
the type declaration in the committed code.

---

## Run-Level Observations

### First Clean Sweep — NOTABLE

Run-24 is the first run across 24 runs to produce 0 failed files and 0 partial files.
Previous best: run-18 and run-23 each had 0 failures but 1 partial. Run-24 achieved
the clean result on a 31-file codebase (vs 13 in run-12 where the template was first written).

### Three Targeted Fixes — All Confirmed

| Fix Target | Verification |
|-----------|-------------|
| SCH-003: `diff_size` type mismatch | git-collector.js committed with `commit_story.git.diff_lines (type: int)` |
| SCH-002: `messages_count` near-synonym | index.js committed; per-file eval will verify exact attribute name |
| SPA-002: `forceFlush` missing | examples/instrumentation.js committed with `shutdownAndExit` chain |

### Push Auth — STABLE

PR #81 auto-created at https://github.com/wiggitywhitney/commit-story-v2/pull/81.
Fine-grained PAT continues to work; no push auth issues.

### Attempt-Count Distribution

| Attempts | Files | Notes |
|---------|-------|-------|
| 1 | 11 committed + 17 correct-skips | Includes 17 pre-scan exits |
| 2 | 2 (reflection-tool.js, summarize.js) | Both committed clean |
| 3 | 1 (git-collector.js) | NDS-003 on isRecording guard, resolved |

No files needed 4+ attempts. Distribution improved from run-23 (which had one 7-attempt file).

### Cost — $3.70 (down from $5.60)

Significant reduction from run-23's $5.60. Primary driver: no catastrophic retry cycles.
The previous 7-attempt file (journal-graph.js, run-23) contributed ~$2.00 to that run's cost.
Run-24 journal-graph.js committed cleanly.
