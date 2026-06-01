# Lessons for PRD #21

Run-20 observations to carry forward into the next evaluation run PRD.

## Process Observations

- `spiny-orb-output.log` is gitignored (`*.log` rule in .gitignore). Must use `git add -f evaluation/commit-story-v2/run-N/spiny-orb-output.log` to stage it. This applies to every eval run.
- `spiny-orb-live-check-report.json` is left as an untracked file in the commit-story-v2 working tree after each run. It is not committed to the eval repo. No action needed — spiny-orb overwrites it on the next run.

## Pre-run Verification Findings

**spiny-orb version**: 1.0.0 (SHA e12e75b, main branch — post PR #897 prompt generality cleanup)

**Handoff triage**: run-19 actionable-fix-output.md reviewed. Three findings: RUN19-1 (P1, NDS-003 indentation-driven Prettier reformatting), RUN19-2 (P2, COV-005 getCommitData missing output attributes), RUN19-3 (P2, IS SPA-002 orphan span expected to resolve if RUN19-1 fixes).

**Commits since run-19 (36201a5 → e12e75b)**:
- PR #889 (PRD #885): NDS-003 multiLine flag normalization — ✅ MERGED
- PR #892 (issues #876, #887): getCommitData attribute guidance + human-readable console output — ✅ MERGED
- PR #893: prompt generality rule added to CLAUDE.md (docs only) — ✅ MERGED
- PR #897 (PRD #894): Prompt generality cleanup — ✅ MERGED (removes getCommitData block, removes commit_story.* examples, extends CDQ-006 to external source strings, rewrites 7 symptom-fix rules as transferable principles)

**RUN19-1 fix (P1 — NDS-003 multiLine)**: ✅ FIXED
- `normalizeMultiLineFlags` resets `multiLine: false` on `ObjectLiteralExpression` and `ArrayLiteralExpression` nodes before Prettier runs on both sides
- Should fix: summary-manager.js `generateAndSave*` (return object literals, multi-line call args), auto-summarize.js `triggerAutoSummaries` (spread array in multi-property object), claude-collector.js `collectChatMessages` (method chain near 80-char boundary)
- No regression fixtures confirmed for the specific run-19 patterns (return-object-literal, spread-array) — run-20 will be the first live verification

**RUN19-2 fix (P2 — getCommitData COV-005)**: ⚠️ PARTIALLY APPLIED THEN REMOVED
- PR #892 added explicit `getCommitData` per-function guidance (commit.message + isRecording, commit.timestamp)
- PR #897 removed it as eval-target-specific content
- Effective state: no per-function getCommitData guidance; general CDQ-006 extended to cover external source strings (variable-length strings from git/API/file contents now explicitly require isRecording guards)
- New schema attributes (commit_story.git.is_merge, commit_story.git.parent_count, commit_story.git.command) NOT added to commit-story-v2 semconv
- COV-005 on getCommitData likely persists; watch whether CDQ-006 general guidance is sufficient

**RUN18-2 fix watch (P2 — quotes_count, 3rd consecutive run watch)**: ❌ NOT FIXED
- No explicit negative directive for `commit_story.journal.quotes_count` in prompt.ts
- No `commit_story.journal.reflections_count` added to commit-story-v2 semconv
- SCH-002 on journal-manager.js `discoverReflections` expected to recur for the third consecutive run

**Target repo (commit-story-v2)**:
- ✅ On main, clean working tree (only untracked journal files)
- ✅ spiny-orb.yaml present (schemaPath: semconv, sdkInitFile: examples/instrumentation.js, dependencyStrategy: peerDependencies)
- ✅ semconv/ present
- ✅ 30 .js files in src/ (unchanged from prior runs)
- ✅ No staged .instrumentation.md files from run-19

**Push auth**: ✅ Verified — `GITHUB_TOKEN` in .vals.yaml pushes successfully to wiggitywhitney/commit-story-v2 (dry-run to non-existent branch confirmed)

**README**: Run-19 row was missing from README.md — added during pre-run verification (10+3p, 30 spans, 84%, 5/5 gates, $8.83, IS 80/100).

## Run Observations

### mcp/server.js NDS-003 False Positive — `stripOtelNodes` Leading Trivia Bug

`stripOtelNodes` loses the shebang and file-level JSDoc block when it removes an OTel import placed as the **first statement** in the file. Mechanism: ts-morph stores the shebang and pre-import JSDoc as leading trivia of the first statement; when that statement is the OTel import, ts-morph takes the trivia with it on removal.

Result: `normalizedStripped` has 2× `/**` / `*/` while `normalizedOriginal` has 3× → 21 forward-check failures at lines 1 (shebang), 3–20 (JSDoc lines), 37 (`/**`), 39 (`*/`). All three attempts produce identical violations because the failure is structural.

**Reproducible test**: `stripOtelNodes(debug_dump, filePath)` → first line is `import { McpServer }`, no shebang, `/**` count is 2 vs 3 in original.

**Root cause was introduced in PRD #885** (`normalizeMultiLineFlags` + `stripOtelNodes` comparison pipeline). Pre-885 compared `Prettier(original)` vs `Prettier(instrumented)` directly — no stripping, no trivia loss.

**Fix location**: `removeOtelImports` in `nds003-ast-stripper.ts` — when removing a first-position OTel import, transfer its leading file-level trivia to the next statement before deletion.

### High Multi-Attempt Rate

5 of 12 committed files and the 1 failed file all required 3 attempts, vs 1 file at 3 attempts in run-19. Notable regressions: context-integrator.js, journal-manager.js, src/index.js each went from 1→3 attempts. Per-file evaluation should identify whether a specific validator change drove these regressions.

## Findings to Carry Forward

<!-- Populated after per-file evaluation and rubric scoring -->
