# Eval Run Log — release-it

One row per completed evaluation run. Updated immediately after each run's artifacts are copied to main.

Column key: **N** = run number · **Q×F** = (quality/total) × files_committed (0 if no commits) · **Push** = agent branch/PR pushed to target repo

| N | Date | Quality | Files | Q×F | Push | Top Findings |
|---|------|---------|-------|-----|------|--------------|
| 1 | 2026-04-18 | N/A (halted file 5/23) | 0 | 0 | NO | gpgsign checkpoint failure (run halted); arrowParens LINT oscillation (config.js, index.js); PAT missing pull_requests:write |
| 2 | 2026-04-21 | 24/25 (96%) | 0 | 0 | branch YES / PR FAILED | OTel module resolution fails checkpoint tests (all commits rolled back); LINT arrowParens+print-width (6 files); NDS-003 GitHub.js; COV-003 GitLab.js; PAT lacks pull_requests:write |
| 3 | 2026-05-04 | 25/25 (100%) | 3 | 3.0 | branch YES / manual PR#2 | Pre-scan false negatives on 8 plugin class-method files; Git.js API termination; GitLab.js COV-002 pre-scan miss; gh pr create targets upstream in fork; HOME not forwarded to weaver subprocess under vals exec; IS 90/100 |
| 4 | 2026-05-06 | 24/25 (96%) | 7 | 6.7 | push YES / manual PR#3 (E2BIG) | Pre-scan fix confirmed (Git.js 10 spans); LINT/NDS-003 indentation-width conflict blocks 5 plugin files (GitHub.js 13 methods, GitBase.js 6, GitRelease.js 2, npm.js, prompt.js); PR body E2BIG (live-check report inline 12MB); GitLab.js COV-003+SCH-002 contradiction; COV-003 shell.js (Promise.reject gap); IS 100/100 |
