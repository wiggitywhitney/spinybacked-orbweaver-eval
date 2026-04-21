# Eval Run Log — release-it

One row per completed evaluation run. Updated immediately after each run's artifacts are copied to main.

Column key: **N** = run number · **Q×F** = (quality/total) × files_committed (0 if no commits) · **Push** = agent branch/PR pushed to target repo

| N | Date | Quality | Files | Q×F | Push | Top Findings |
|---|------|---------|-------|-----|------|--------------|
| 1 | 2026-04-18 | N/A (halted file 5/23) | 0 | 0 | NO | gpgsign checkpoint failure (run halted); arrowParens LINT oscillation (config.js, index.js); PAT missing pull_requests:write |
| 2 | 2026-04-21 | 24/25 (96%) | 0 | 0 | branch YES / PR FAILED | OTel module resolution fails checkpoint tests (all commits rolled back); LINT arrowParens+print-width (6 files); NDS-003 GitHub.js; COV-003 GitLab.js; PAT lacks pull_requests:write |
