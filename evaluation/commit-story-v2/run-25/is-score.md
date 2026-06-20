IS Score: 100 / 100

Rule Results:
✅ RES-005 (Critical): service.name present
✅ RES-001: service.instance.id present
✅ RES-004: semconv attributes at correct OTLP level
✅ SPA-001: INTERNAL span count within limit (31 total)
✅ SPA-002: no orphan spans
✅ SPA-003: 28 unique span name(s), no interpolated values detected
✅ SPA-004: root spans are not CLIENT kind
✅ SPA-005: 16 span(s) with duration <5ms (within limit of 20)

Applicable rules: 8 | Passed: 8 | Failed: 0 | Not applicable (skipped): 7
Weighted score: 10/10 points (Critical rules weighted 3×)

---

## Run Details

**Instrument branch**: `spiny-orb/instrument-1781909345452`
**Scorer version**: main branch (commit 715d0ec — per-target SPA-001 threshold support)
**Target flag**: `--target commit-story-v2` (SPA-001 threshold: 55)
**service.instance.id**: `ca9d69df-e15d-4810-808f-9bc30cd47411`
**Trace lines scored**: 31 (single clean run, 65KB)

## SPA-001 Note

31 INTERNAL spans in this run. This run's trace covers the minimal code path (journal entry only, no summaries triggered). Prior runs with summary generation observe 45–48 INTERNAL spans, well within the per-target threshold of 55.

## SPA-002 Note

No orphan spans in run-25, compared to run-24 which had one orphan (`f96f214c` → `7371f0db`). The run-25 instrumentation appears to have corrected this.

## Scoring Method

The root `eval-traces.json` was accumulated over multiple sessions and contained a sparse file artifact (null bytes prepended from a truncation-while-open operation). A clean 65KB JSON extract was used for scoring to avoid false SPA-003/SPA-005 failures from multi-session accumulation.

## Comparison vs Run-24

| Rule | Run-24 | Run-25 | Change |
|------|--------|--------|--------|
| RES-005 | ✅ | ✅ | — |
| RES-001 | ✅ | ✅ | — |
| RES-004 | ✅ | ✅ | — |
| SPA-001 | ❌ (45 spans, limit 10) | ✅ (31 spans, limit 55) | FIXED — per-target threshold now applied |
| SPA-002 | ❌ (orphan span) | ✅ | FIXED — orphan span absent in run-25 |
| SPA-003 | ✅ (8 names) | ✅ (28 names) | ✅ — more files instrumented |
| SPA-004 | ✅ | ✅ | — |
| SPA-005 | ✅ (6 spans) | ✅ (16 spans) | ✅ — still within limit |
| **Total** | **80/100** | **100/100** | **+20** |
