# Baseline Comparison — release-it Run-2

---

## release-it: Run-2 vs Run-1

| Metric | Run-1 | Run-2 | Delta |
|--------|-------|-------|-------|
| Files processed | 5/23 | 23/23 | **+18** |
| Files committed (net) | 0 | 0 | — |
| Files instrumented (attempted) | 2 (config.js, index.js) | 13 | +11 |
| Quality score | N/A (halted) | 24/25 (96%) | — |
| Gates | N/A | 4/5 (4 pass + 1 not eval) | — |
| Spans attempted | 2 | 29 | +27 |
| Cost | $0.68 | $5.69 | +$5.01 |
| Duration | ~5 min (halted) | 63.4 min | — |
| Push | NO | YES (branch) | — |
| PR | NO | FAILED (PAT scope) | — |
| Checkpoint failures | 1 (gpgsign) | 4 (OTel module resolution) | +3 |
| Q × F | 0 | 0 (infra failure) | — |

**Run-2 primary improvement over run-1**: All 23 files were processed. The gpgsign blocker was resolved. The run reached all plugin files (Git.js, GitHub.js, GitLab.js, npm.js) for the first time.

**Run-2 regressions from run-1**: More checkpoint failures (4 vs 1), and a new infrastructure blocker (OTel module resolution) that prevents any instrumented file from surviving to the working tree.

**Persistent blockers**: PR creation still fails (PAT scope unchanged in effect despite GITHUB_TOKEN_RELEASE_IT setup — PAT in Secret Manager lacks pull_requests:write). Q×F remains 0 in both runs.

---

## Cross-Target: release-it Run-2 vs commit-story-v2 Run-13

Commit-story-v2 run-13 is the most recent cross-target reference run. Both runs used similar spiny-orb versions (f6d482f vs 942012e — within the same development period).

### Results Comparison

| Metric | release-it Run-2 | commit-story-v2 Run-13 | Delta |
|--------|-----------------|----------------------|-------|
| Files processed | 23/23 (100%) | 30/30 (100%) | — |
| Files committed (net) | 0 | 7 | −7 |
| Quality | 24/25 (96%) | 25/25 (100%) | −4pp |
| Gates passed | 4/5 (+ 1 not eval) | 5/5 | −1 |
| Spans attempted | 29 | 31 | −2 |
| Cost | $5.69 | ~$6.41 | −$0.72 |
| Duration | 63.4 min | 65.7 min | −2.3 min |
| Push | YES (branch) | YES (PR #62) | — |
| PR | FAILED | YES | — |
| Q × F (actual) | 0 (infra) | **7.0** | −7.0 |
| Q × F (adjusted) | ~12.5 | 7.0 | +5.5 |

### Dimension Scores

| Dimension | release-it Run-2 | commit-story-v2 Run-13 | Difference > 1 rule? |
|-----------|-----------------|----------------------|--------------------|
| NDS | 2/2 (100%) | 2/2 (100%) | — |
| COV | 3/4 (75%) | 5/5 (100%) | **YES** — 1 rule failure (COV-003 on GitLab.js) |
| RST | 5/5 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 4/4 (100%) | 4/4 (100%) | — |
| CDQ | 7/7 (100%) | 7/7 (100%) | — |

### Coverage Dimension Analysis (COV gap)

Release-it run-2 COV = 3/4 (75%) vs. commit-story-v2 run-13 COV = 5/5 (100%).

The COV failure in run-2 is COV-003 on GitLab.js — 4 catch blocks missing error recording. This is a targeted failure on a single complex file, not a systematic gap in the agent's coverage reasoning.

Release-it run-2 has fewer applicable COV rules (4 vs 5) because COV-002 (outbound HTTP calls) is not applicable — release-it routes all external calls through its Shell.exec wrapper, which does not match the `fetch/axios/http` patterns COV-002 checks. The missing applicability is codebase structure, not agent shortfall.

**All other dimensions: PASS in both targets.** The agent demonstrates consistent quality across two very different codebases (commit-story-v2 is a Node.js journaling/AI system; release-it is a release automation CLI). RST, API, SCH, CDQ, and NDS show no degradation on the foreign codebase.

### Infrastructure Gap

The primary difference between the two runs is infrastructure:

| Infrastructure | release-it Run-2 | commit-story-v2 Run-13 |
|----------------|-----------------|----------------------|
| OTel module resolution | FAIL — @opentelemetry/api not installed at test time | PASS — peerDependencies installed in devDependencies for testing |
| PR creation | FAIL — PAT lacks pull_requests:write | PASS — PAT fully scoped |
| Checkpoint tests | ALL FAIL (4 checkpoints) | PARTIAL FAIL (2 checkpoints, recoverable) |

The commit-story-v2 checkpoint failures in run-13 were semantic bugs introduced by the agent (null vs. undefined, Date vs. string assumptions). The release-it checkpoint failures were infrastructure — the agent's code was correct but OTel imports were unresolvable.

---

## Release-it Run Trend

| Run | Quality | Gates | Files inst. | Files committed | Q × F | Push/PR | Checkpoint cause |
|-----|---------|-------|------------|----------------|-------|---------|----------------|
| Run-1 | N/A | N/A | 2 | 0 | 0 | NO / N/A | gpgsign |
| **Run-2** | **24/25 (96%)** | **4/5** | **13** | **0 (infra)** | **0** | **YES branch / FAILED** | **OTel module resolution** |

**Run trajectory**: Run-1 was a halted run with no meaningful data. Run-2 is the first complete evaluation of release-it, establishing a quality baseline of 24/25 (96%) across 13 instrumented files. The 0 Q×F is an infrastructure artifact — if checkpoint tests pass in run-3, the adjusted Q×F of ~12.5 would make release-it competitive with commit-story-v2's best runs.

---

## Score Projection Validation

Run-1's actionable fix output projected for run-2:

**Conservative projection** (gpgsign + PAT fixed; arrowParens LINT oscillation persists):
- Expected: 12-16 committed, quality 23-25/25, cost $3-5
- Actual: 0 committed (infra), quality 24/25 (96%), cost $5.69
- Result: **Quality target met. File commit target blocked by new infrastructure failure (OTel resolution).**

**Target projection** (all 3 blockers resolved + LINT fix lands):
- Expected: 15-18 committed, quality 25/25, cost $3-5
- Actual: 0 committed, 24/25, $5.69
- Result: **Not met. LINT arrowParens fix landed (PR #532) but print-width compound failure not anticipated. OTel resolution blocker was new.**

**Key miss**: The OTel module resolution failure was not anticipated in run-1's projections. The run-1 blockers were all resolved, but a new blocker emerged that prevents any instrumented file from surviving checkpoints.

---

## Key Findings for Run-3

| Finding | Impact | Priority |
|---------|--------|---------|
| OTel module resolution fails checkpoint tests | All commits rolled back — 0 Q×F | P1 — blocks all progress |
| PAT lacks pull_requests:write | No PR created | P1 — unresolved from run-1 |
| arrowParens + print-width combo causes 6 LINT failures | 6 files cannot commit | P2 — persistent across run-1 and run-2 |
| NDS-003 on GitHub.js (return-value capture) | 1 complex file fails | P2 — addressable by omitting release_id attribute |
| COV-003 on GitLab.js (graceful catch blocks) | 1 file fails; NDS-007 conflict possible | P2 — needs NDS-007 interaction clarified |
