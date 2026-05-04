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
| 7 | 2026-03-20 | 22/25 | 13 | 11.4 | NO | COV-006 span name collision unmasked; CDQ-005 count type mismatch unmasked |
| 8 | 2026-03-21 | 23/25 | 12 | 11.0 | NO | SCH-003 boolean attrs typed as string; CDQ-007 optional chaining missing guard |
| 9 | 2026-03-21 | 25/25 | 12 | 12.0 | NO | First perfect score (25/25); journal-graph.js still partial; push broken (7th) |
| 10 | 2026-03-23 | 23/25 | 12 | 11.0 | NO | SCH-003 boolean + CDQ-007 optional chaining regressed; push broken (8th) |
| 11 | 2026-03-30 | 25/25 | 13 | 13.0 | YES (#60) | New Q×F record (13.0); first push/PR success; all-time-high file count |
| 12 | 2026-04-09 | 23/25 | 12 | 11.0 | YES (#61) | COV-004 summary-manager.js 6 async functions (1st occurrence); CDQ-007 repeat |
| 13 | 2026-04-12 | 25/25 | 7 | 7.0 | YES (#62) | Checkpoint rollbacks → 7 files only (quality restored, coverage dropped) |
| 14 | 2026-04-15 | 22/25 | 12 | 10.6 | YES (#65) | COV-003 summaryNode catch missing error recording; COV-004 summary-manager.js (3rd run) |
| 15 | 2026-05-03 | 24/25 | 14 | 13.4 | YES (#66) | New Q×F record (13.4); 14 files (new record); COV-004 summary-manager.js resolved (9 spans); COV-003 new failure on summary-detector.js outer catch; IS 70/100 (SPA-001 structural) |
