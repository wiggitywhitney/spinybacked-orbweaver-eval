> Scored on 18 spans from a modified dry-run command (`--ci --no-npm --git.requireCleanWorkingDir=false`); the PRD command stops at the npm login check. Run-4 scored 9 spans with a command that was not recorded, so the two span counts are not strictly comparable. Details: `run-summary.md`, "IS Scoring Run (2026-10-08)".

IS Score: 100 / 100

Rule Results:
✅ RES-005 (Critical): service.name present
✅ RES-001: service.instance.id present
✅ RES-004: semconv attributes at correct OTLP level
✅ SPA-001: INTERNAL span count within limit (18 total)
✅ SPA-002: no orphan spans
✅ SPA-003: 14 unique span name(s), no interpolated values detected
✅ SPA-004: root spans are not CLIENT kind
✅ SPA-005: 10 span(s) with duration <5ms (within limit of 20)

Applicable rules: 8 | Passed: 8 | Failed: 0 | Not applicable (skipped): 7
Weighted score: 10/10 points (Critical rules weighted 3×)
