# Eval Run Log — taze

One row per completed evaluation run. Updated immediately after each run's artifacts are copied to main.

Column key: **N** = run number · **Q×F** = (quality/total) × files_committed · **push** = agent PR pushed to target repo

| N | Date | Quality | Files | Q×F | Push | IS | Top Findings |
|---|------|---------|-------|-----|------|----|--------------|
| 13 | 2026-05-03 | 27/29 (93%) | 14 | 13.0 | YES (#8) | 60/100 | First perfect run (0 failures, 0 rollbacks). SCH-003: 3 schema type mismatches (eval team fix). CDQ-006: isRecording guard missing on 8 computations across 5 files (spiny-orb #728). TypeScript baseline established. |
