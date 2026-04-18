# Eval Run Log — commit-story-v2

One row per completed evaluation run. Updated immediately after each run's artifacts are copied to main.

Column key: **N** = run number · **Q×F** = (quality/total) × files_committed · **push** = agent PR pushed to target repo

| N | Date | Quality | Files | Q×F | Push | Top Findings |
|---|------|---------|-------|-----|------|--------------|
| 2 | 2026-03-12 | 20/27 | 10 | 7.4 | NO | API-Only Dependency 0/3; 4 files failed instrumentation |
| 3 | 2026-03-13 | 19/26 | 11 | 8.0 | NO | Stale build evaluated (pre-dist rebuild); push auth broken (1st failure) |
| 4 | 2026-03-16 | 15/26 | 16 | 9.2 | NO | NDS-002 gate failure (32 test failures); COV regression from per-file methodology |
| 5 | 2026-03-17 | 23/25 | 9 | 8.3 | NO | First 5/5 gate pass; COV-001 + COV-005 failures; push broken (3rd consecutive) |
| 6 | 2026-03-20 | 21/25 | 5 | 4.2 | NO | Quality + coverage both regressed from run-5; SCH-001 still blocking |
