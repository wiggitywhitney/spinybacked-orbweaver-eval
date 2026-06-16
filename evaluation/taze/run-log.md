# Eval Run Log — taze

One row per completed evaluation run. Updated immediately after each run's artifacts are copied to main.

Column key: **N** = run number · **Q×F** = (quality/total) × files_committed · **push** = agent PR pushed to target repo

| N | Date | Quality | Files | Q×F | Push | IS | Top Findings |
|---|------|---------|-------|-----|------|----|--------------|
| 13 | 2026-05-03 | 27/29 (93%) | 14 | 13.0 | YES (#8) | 60/100 | First perfect run (0 failures, 0 rollbacks). SCH-003: 3 schema type mismatches (eval team fix). CDQ-006: isRecording guard missing on 8 computations across 5 files (spiny-orb #728). TypeScript baseline established. |
| 14 | 2026-06-14 | N/A (aborted) | 0+1c+1f+3s | — | PR YES (#9) | — | Run aborted after 5/33 files: #933 (CDQ-006 guard without block body → ts-morph crash), #934 (checkpoint stop on known baseline failure). Pre-run fixes applied but unverified: SCH-003 types, IS RES-001 service.instance.id. Re-run in run-15 pending #933–#936 fixes. |
| 15 | 2026-06-15 | 27/29 (93%) | 11 | 10.2 | YES (#10) | 80/100 | IS RES-001 achieved (+20 IS). CDQ-006 reduced from 8→5 violations (index.ts fixed; checkGlobal carry-forward; pnpmWorkspaces regression). SCH-003 reduced from 3→1 violation (taze.io.catalogs_found string/int). resolves.ts oscillation: 6 functions×2 attempts lost (major coverage regression). yarnWorkspaces failed (NDS-001 regex syntax). cli.ts now correctly skipped (was false positive in run-13). Span naming convention changed globally (taze.io.* consolidation). |
