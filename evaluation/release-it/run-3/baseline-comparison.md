# Baseline Comparison — release-it Run 3

---

## Release-it Cross-Run Trend

| Run | Date | Quality | Gates | Files committed | Spans | Cost | Push/PR | Q×F | IS |
|-----|------|---------|-------|-----------------|-------|------|---------|-----|----|
| 1 | 2026-03-17 | — | — | 0 | 0 | — | NO | 0 | — |
| 2 | 2026-04-21 | 24/25 (96%) | 4/5 | 0 (rollback) | 0 | $5.69 | push YES / PR NO | 0 | — |
| **3** | **2026-05-04** | **25/25 (100%)** | **5/5** | **3** | **6** | **$1.59** | **push YES / manual PR** | **3.0** | **90/100** |

Run-1 was the setup run (PRD #53) — no rubric evaluation was completed.
Run-2: 0 committed due to OTel module resolution checkpoint rollbacks (infrastructure failure); quality assessed on agent output only.
Run-3: First non-zero Q×F. Low volume (3 files) due to pre-scan false negatives on plugin class files.

---

## Release-it Dimension Trend

| Dimension | Run-2 (agent output) | Run-3 (committed) |
|-----------|---------------------|-------------------|
| NDS | 2/2 (100%) | 2/2 (100%) |
| COV | 3/4 (75%) — COV-003 GitLab.js | 4/4 (100%) |
| RST | 5/5 (100%) | 2/2 (100%) |
| API | 3/3 (100%) | 3/3 (100%) |
| SCH | 4/4 (100%) | 4/4 (100%) |
| CDQ | 7/7 (100%) | 6/6 (100%) |
| **Total** | **24/25 (96%)** | **25/25 (100%)** |

COV improved run-over-run: run-2's COV-003 failure (GitLab.js graceful catch blocks not recording exceptions) was not reproduced in run-3. GitLab.js failed for a different reason (COV-002 pre-scan false negative) and was not evaluated against the quality rubric.

---

## Release-it Run 3 vs Commit-story-v2 Run 14 (most recent cross-target reference)

| Metric | Release-it run-3 | CS-v2 run-14 | Delta |
|--------|-----------------|--------------|-------|
| Quality | 25/25 (100%) | 22/25 (88%) | **+12pp** |
| Gates | 5/5 (100%) | 5/5 (100%) | — |
| Files committed | 3 | 12 | −9 |
| Total spans | 6 | 32 | −26 |
| Cost | $1.59 | ~$4.67 | −$3.08 |
| Push/PR | YES / manual PR | YES / auto PR | — |
| Q×F | 3.0 | 10.6 | **−7.6** |
| IS score | 90/100 | 80/100 | **+10** |

### Dimensions that differ by more than 1 point (release-it run-3 vs CS-v2 run-14)

| Dimension | Release-it run-3 | CS-v2 run-14 | Delta | Notes |
|-----------|-----------------|--------------|-------|-------|
| COV | 4/4 (100%) | 3/5 (60%) | **+40pp** | CS-v2 run-14 had COV-003 (summaryNode catch) and COV-004 (summary-manager.js 6 async functions) failures; release-it run-3 had no COV failures on committed files |
| CDQ | 6/6 (100%) | 6/7 (86%) | **+14pp** | CS-v2 run-14 had a CDQ-007 failure; release-it run-3 had none |

NDS, RST, API, and SCH are all at 100% for both targets — no cross-target divergence on those dimensions.

### Q×F gap explained

Release-it run-3's Q×F of 3.0 vs CS-v2 run-14's 10.6 is entirely a volume problem. Quality is equal or higher for release-it. The pre-scan false negatives account for the gap:

- **True correct skips** (release-it run-3): 10 files (genuinely sync-only)
- **Pre-scan false negatives**: 8 files with async class methods classified as no-instrumentation (GitHub.js with 13 async methods, npm/npm.js with 8, GitBase.js with 6, etc.)
- If the 8 false-negative files were correctly instrumented at 100% quality (~3 spans/file average), estimated Q×F: 25/25 × (3 + 24) ≈ **27.0**

### IS Score Comparison

Release-it scores 10 points higher than commit-story-v2 run-14 on IS (90 vs 80). The difference:

| Rule | Release-it run-3 | CS-v2 run-14 |
|------|-----------------|--------------|
| RES-001 (service.instance.id) | ❌ FAIL | ❌ FAIL |
| SPA-001 (≤10 INTERNAL spans) | ✅ PASS (4 spans) | ❌ FAIL (12 spans, limit 10) |

Release-it's lower span count (4 INTERNAL spans from 3 committed files) means it passes SPA-001 where commit-story-v2 (with 12+ committed files and denser instrumentation) hits the calibration limit. This is an artifact of run volume, not instrumentation quality — a fully-instrumented release-it with 20+ committed files would likely fail SPA-001 as well.

Both targets share RES-001 as the persistent miss. The bootstrap file sets `service.name` and `service.version` but not `service.instance.id`. Fixing this would bring both targets to 100/100.

---

## Score Projection Validation

**Run-2 actionable fix output projected for run-3:**

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| Conservative (P1 fixed, P2 unchanged) | ~24/25, 6–9 files, Q×F 5–9 | 25/25, 3 files, Q×F 3.0 | **Partially met** — quality exceeded projection; file count below conservative |
| Target (P1 + arrowParens fix) | ~23–24/25, 12–14 files, Q×F 11–13 | 25/25, 3 files, Q×F 3.0 | **Not met** — new pre-scan issue overrode volume assumptions |
| Stretch (all P2 fixed) | ~25/25, 13 files, Q×F 13 | 25/25, 3 files, Q×F 3.0 | **Not met** |

**Root cause of projection miss**: The conservative scenario assumed LINT failures would continue to consume 6 file slots and that the remaining files would instrument correctly. Instead, `feature/prd-687` pre-scan accuracy improvements correctly identified 18 of 23 files as sync-only — including the 6 LINT-prone files and 8 additional plugin files with async class methods. The quality outcome exceeded projections (25/25 vs 24/25 projected); the volume outcome fell short because the pre-scan improvement revealed a larger false-negative problem than anticipated.

---

## Key Takeaways

1. **Quality is at the ceiling** (25/25) — release-it agent quality now equals or exceeds commit-story-v2 performance on committed files.
2. **Q×F is gated on pre-scan accuracy** — fixing the async class method detection problem is the highest-leverage improvement for run-4.
3. **IS score advantage** is a current-run artifact of low span volume, not a structural advantage. Expect it to drop once more files commit.
4. **Both targets share RES-001** — `service.instance.id` should be added to the shared bootstrap template.
