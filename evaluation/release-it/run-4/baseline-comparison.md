# Baseline Comparison — release-it Run 4

---

## Release-it Cross-Run Trend

| Run | Date | Quality | Gates | Files committed | Spans | Cost | Push/PR | Q×F | IS |
|-----|------|---------|-------|-----------------|-------|------|---------|-----|----|
| 1 | 2026-03-17 | — | — | 0 | 0 | — | NO | 0 | — |
| 2 | 2026-04-21 | 24/25 (96%) | 4/5 | 0 (rollback) | 0 | $5.69 | push YES / PR NO | 0 | — |
| 3 | 2026-05-04 | 25/25 (100%) | 5/5 | 3 | 6 | $1.59 | push YES / manual PR | 3.0 | 90/100 |
| **4** | **2026-05-06** | **24/25 (96%)** | **5/5** | **7** | **20** | **$6.97** | **push YES / PR manual (E2BIG)** | **6.7** | **100/100** |

Run-1 was the setup run (PRD #53) — no rubric evaluation completed.
Run-2: 0 committed due to OTel module resolution checkpoint rollbacks; quality assessed on agent output only; no IS scoring (no committed instrumented files).
Run-3: First non-zero Q×F. Low volume (3 files) due to pre-scan false negatives on async class methods in plugin files.
Run-4: Pre-scan fix landed (RUN3-1). Volume more than doubled. New failure pattern (indentation-width conflict) caps Q×F below target projection.

---

## Release-it Dimension Trend

| Dimension | Run-2 (agent output) | Run-3 (committed) | Run-4 (committed) | Run-3→4 |
|-----------|---------------------|-------------------|-------------------|---------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | 3/5 (60%) | 5/5 (100%) | **4/5 (80%)** | **-20pp** |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| CDQ | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) | — |
| **Total** | **24/25 (96%)** | **25/25 (100%)** | **24/25 (96%)** | **-4pp** |

COV regression: run-3 had no COV failures on the 3 committed files. Run-4's COV-003 failure on shell.js (`Promise.reject` without span error recording) is a new failure mode not present in run-3. The validator gap (detects `throw` but not `return Promise.reject()`) means it passed the gate and was caught only by rubric review.

---

## Release-it Run 4 vs Commit-story-v2 Run 15 (most recent cross-target reference)

| Metric | Release-it run-4 | CS-v2 run-15 | Delta |
|--------|-----------------|--------------|-------|
| Quality | 24/25 (96%) | 24/25 (96%) | — |
| Gates | 5/5 (100%) | 5/5 (100%) | — |
| Files committed | 7 | 14 | −7 |
| Total spans | 20 | 40 | −20 |
| Cost | $6.97 | $6.44 | +$0.53 |
| Push/PR | YES push / PR manual (E2BIG) | YES / auto PR | — |
| Q×F | 6.7 | 13.4 | −6.7 |
| IS score | **100/100** | 70/100 | **+30** |

### Dimensions that differ by more than 1 point (release-it run-4 vs CS-v2 run-15)

**None.** Both targets have identical dimension profiles for this run pair:

| Dimension | Release-it run-4 | CS-v2 run-15 |
|-----------|-----------------|--------------|
| NDS | 2/2 (100%) | 2/2 (100%) |
| COV | **4/5 (80%)** | **4/5 (80%)** |
| RST | 4/4 (100%) | 4/4 (100%) |
| API | 3/3 (100%) | 3/3 (100%) |
| SCH | 4/4 (100%) | 4/4 (100%) |
| CDQ | 7/7 (100%) | 7/7 (100%) |
| **Total** | **24/25 (96%)** | **24/25 (96%)** |

Both targets share a single COV-003 failure as the only quality gap. The failure mechanisms differ (shell.js `Promise.reject` without error recording vs. summary-detector.js `try/finally` with no outer catch), but the rubric outcome is the same. Both represent validator gaps: spiny-orb's COV-003 checker detects explicit `throw` and `catch (e) { recordException }` patterns but misses edge cases (Promise.reject rethrow; try/finally-only without catch).

### Q×F gap explained

The 6.7 vs 13.4 gap is entirely a volume difference. Quality is equal. Release-it committed 7 files vs CS-v2's 14, reflecting:
- 6 files failed (all indentation-width conflict — a new failure class not present in CS-v2)
- Release-it's plugin files are 2–3× longer with more long lines near Prettier's 120-char print width

### IS score difference (+30)

Release-it scores 30 points higher (100/100 vs 70/100). The gap:

| Rule | Release-it run-4 | CS-v2 run-15 |
|------|-----------------|--------------|
| RES-001 (service.instance.id) | ✅ PASS | ✅ PASS |
| SPA-001 (≤10 INTERNAL spans) | ✅ PASS (9 spans) | ❌ FAIL (37 spans; structural mismatch) |

CS-v2's SPA-001 failure is a structural mismatch — commit-story-v2 produces far more INTERNAL spans than the SPA-001 calibration limit of 10 was designed for. Release-it's lower committed file count (7 vs 14) keeps it within the limit for this run. Both targets now pass RES-001 — the `service.instance.id: randomUUID()` in `instrumentation.js` was already present and correctly set for run-4 (run-3 missed RES-001; run-4 does not).

---

## Score Projection Validation

**Run-3 actionable fix output projected for run-4:**

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| Conservative (RUN3-1 not fixed) | ~25/25, 3–4 files, Q×F 3–4 | 24/25, 7 files, Q×F 6.7 | **Exceeded** — pre-scan fix did land; beat conservative |
| Target (RUN3-1 fixed) | ~24–25/25, 8–12 files, Q×F 8–12 | 24/25, 7 files, Q×F 6.7 | **Not met** — quality matched; volume below target |
| Stretch (all P1+P2 fixed) | 25/25, 12–15 files, Q×F 12–15 | 24/25, 7 files, Q×F 6.7 | **Not met** |

**Root cause of target miss**: The pre-scan fix (RUN3-1) did land and enabled 4 new class-method files (git.js, Plugin.js, Version.js, util.js). However, 6 of the 8 previously-missed plugin files (GitBase.js, GitRelease.js, GitHub.js, npm.js, prompt.js, plus GitLab.js) failed due to a structural conflict not anticipated in run-3 projections: `startActiveSpan` adds 2 indentation levels, pushing already-long lines over Prettier's 120-char print width. The LINT/NDS-003 conflict makes these files uninstrumentable by the current agent regardless of attempt count. The projection assumed the 8 false-negative files would commit cleanly once the pre-scan fix landed — the indentation-width failure class was not known at projection time.

---

## Key Takeaways

1. **Q×F more than doubled** (3.0 → 6.7) driven entirely by volume — pre-scan fix landed and enabled 4 new file types; quality was 24/25 vs 25/25 in run-3.
2. **IS score improved to 100/100** — release-it now achieves a perfect IS score. The `service.instance.id: randomUUID()` in `instrumentation.js` resolves RES-001, which was the only miss in run-3.
3. **Both targets converged to identical dimension profiles** (24/25, single COV-003 failure) — this is the first run where release-it and CS-v2 quality is literally equal at the dimension level.
4. **New structural failure class: indentation-width conflict** — 6 of 6 failed files hit the LINT/NDS-003 conflict. This is the dominant ceiling for release-it volume growth. Fixing this is the highest-leverage improvement for run-5.
5. **PR delivery: E2BIG replaces upstream targeting** — the RUN3-2 fix (push to correct fork) worked; the new failure (PR body too large for `gh pr create --body`) is different but has the same effect (manual PR required). Auto PR remains blocked.
