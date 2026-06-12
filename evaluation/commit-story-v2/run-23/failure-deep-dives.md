# Failure Deep-Dives — Run-23

**Run-23 result**: 13 committed, 0 failed, 1 partial, 16 correct skips.

No file-level failures — both P1 fixes (mcp/server.js NDS-003, index.js import expansion) landed, converting run-21's 2 failures to 0. One new partial: summary-detector.js SCH-002.

| File | Result | Attempts | Root cause |
|------|--------|----------|------------|
| src/utils/summary-detector.js | ⚠️ partial (4/5) | 2 | SCH-002: agent invented `base_path` as near-synonym of registered `file_path` |

---

## Partial Commit

### src/utils/summary-detector.js — SCH-002 (`findUnsummarizedWeeks` skipped)

**Oscillation trigger**: `SCH-002 (×2) — declared attribute extension "commit_story.journal.base_path" is a semantic duplicate of existing registry attribute "commit_story.journal.file_path".`

The function `findUnsummarizedWeeks` takes a `basePath` parameter (root directory for journal files, default `'.'`). The agent attempted to instrument this span with a new attribute `commit_story.journal.base_path` to capture the basePath value. The validator correctly identified this as a semantic duplicate of the registered `commit_story.journal.file_path`.

**Registry definition of `commit_story.journal.file_path`**:
```yaml
id: commit_story.journal.file_path
type: string
brief: Output file path for the journal entry
examples:
  - "journal/entries/2026-02/2026-02-03.md"
```

**Semantic analysis**:
`commit_story.journal.file_path` was designed for specific output file paths (e.g., a full resolved path to a journal entry file). `basePath` in `findUnsummarizedWeeks` is a **root directory** (typically `'.'` or a repo root), not a specific file path. The semantic overlap — both are string path values in the journal domain — was sufficient for the SCH-002 detector to flag the new key as a duplicate.

**Agent behavior**:
- Attempt 1: registered `commit_story.journal.base_path` → SCH-002 fired → function skipped
- Attempt 2: same decision → same SCH-002 → oscillation → function skipped

The agent self-corrected on `summary-graph.js` in the same run (replaced `commit_story.journal.weekly_summaries_count` with the registered `commit_story.journal.daily_summaries_count` on attempt 2). For `summary-detector.js`, the agent failed to self-correct — it repeated the `base_path` declaration rather than reusing `file_path` or omitting the attribute. No debug dump is available (debug-dumps/ directory is empty for run-23 — `--debug-dump-dir` flag was passed but no output files were written, likely because the partial was a function-level skip rather than a whole-file failure).

**What the agent should have done**:
Option A — Reuse `commit_story.journal.file_path` for the basePath value. The semantic fit is imperfect (basePath is a directory, not a file), but within acceptable schema economy given that it is the closest registered key.
Option B — Omit the attribute. `basePath` defaults to `'.'` in nearly all real invocations; capturing it provides low signal. The higher-value attribute for this span is `commit_story.journal.unsummarized_weeks_count` (the output — count of weeks needing summaries), which the run-21 agent registered correctly and the run-23 agent registered in `findUnsummarizedMonths` under `commit_story.journal.unsummarized_months_count`.

**Regression context**:
Run-21 committed summary-detector.js cleanly with 5 spans and correct SCH-002 status (all attributes registered). The run-21 agent used `commit_story.journal.unsummarized_weeks_count` for `findUnsummarizedWeeks` — a count attribute naming the output rather than the input parameter. That approach was correct and did not attempt to capture `basePath` as an attribute at all. The run-23 agent introduced a new failure mode: treating a configuration parameter (`basePath`) as a span attribute candidate.

**Impact**: 4/5 functions instrumented. The missing span is `findUnsummarizedWeeks` — the fourth-of-five function, covering weekly summary gap detection. The other 4 functions committed cleanly.

**Schema fix required**: None in the registry. The validator is correct. A prompt guidance update may help: agents should recognize configuration parameters (function arguments used to construct paths, not the path itself) as low-value attribute candidates, and prefer output metrics (counts, results) when the input is a default root path.

---

## Run-Level Observations

### P1 fix confirmations

Both run-21 failures resolved:
- mcp/server.js: 1 attempt, committed clean. The `removeOtelImports` trivia-doubling fix (issue #917) resolved the blank-line-near-JSDoc NDS-003 variant. After 3 consecutive failures (runs 20 + 21 + skipped 22).
- index.js: 1 attempt, committed clean. The "do not reformat single-line import blocks" prompt guidance (issue #916) resolved the import expansion NDS-003. 152 violations in run-21 → 0 violations in run-23.

### CDQ-001 resolution confirmed

claude-collector.js committed clean on the first attempt with no double-end pattern. The `startActiveSpan` lifecycle guidance (issue #915) worked.

### New SCH-002 pattern: configuration parameter treated as span attribute

The `findUnsummarizedWeeks` failure is a new failure mode not previously observed in commit-story-v2 evaluations. Prior SCH-002 catches were near-synonym attribute names (e.g., `weekly_summaries_count` vs `daily_summaries_count` in summary-graph.js run-23). This case involves a **parameter type mismatch**: the agent declared a path attribute for what is functionally a configuration root, where the more useful observability signal is the output count.

summary-graph.js in this same run successfully self-corrected an SCH-002 on attempt 2 (replaced `commit_story.journal.weekly_summaries_count` with the registered `commit_story.journal.daily_summaries_count`). The contrast: summary-graph.js's SCH-002 was a key naming issue where a valid alternative existed in the registry; summary-detector.js's SCH-002 was a conceptual mismatch (directory root ≠ file path) where the correct fix was either reuse under the closest key or omit the attribute.

### 3-attempt files: no quality failures identified from log

Two committed files required 3 attempts:
- `git-collector.js`: 6 spans, 24.8K output tokens
- `journal-graph.js`: 4 spans, 53.7K output tokens

The log does not include intermediate validator error messages (no debug dumps written), so the specific validator triggers for attempts 1 and 2 are unknown. Neither file shows visible quality failures in the agent notes. These files meet the "≥ 3 attempts" threshold but the quality failure condition for inclusion in the file-level deep-dive section is not confirmed from available evidence. Per-file evaluation will determine whether any rule failures are present; if found, they should be noted as emerging from 3-attempt files.

### Attempt rate: 15% (slight increase from run-21's 8%)

| Category | Run-23 | Run-21 |
|----------|--------|--------|
| 3-attempt files | 2/13 (15%) | 1/12 (8%) |
| 2-attempt files | 5/13 (38%) | — |
| 1-attempt files | 6/13 (46%) | — |

The P1 fix landing (mcp/server.js and index.js committed in 1 attempt each) offset the 3-attempt files. Overall run is cleaner than run-21 despite the increased 3-attempt rate.

### summary-graph.js SCH-002 self-correction (contrast case)

summary-graph.js encountered an SCH-002 on attempt 1 (`commit_story.journal.weekly_summaries_count` vs registered `commit_story.journal.daily_summaries_count`) and corrected it on attempt 2 by reusing the registered key for the monthly node's input count. This demonstrates that SCH-002 self-correction is possible; the summary-detector.js failure was not inevitable. The difference is that summary-graph.js had a clear registered alternative (`daily_summaries_count`), while `findUnsummarizedWeeks`'s `basePath` had no clean registered alternative — leading the agent to repeat the declaration.
