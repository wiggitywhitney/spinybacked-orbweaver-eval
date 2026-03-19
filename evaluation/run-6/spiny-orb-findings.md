# Spiny-Orb Findings — Run-6

Findings from evaluation run-6 of spiny-orb (spinybacked-orbweaver) instrumentation agent on commit-story-v2.

Each finding includes priority classification (Critical/High/Medium/Low), evidence paths, and acceptance criteria.

**Baseline**: Run-5 produced 22 findings (`evaluation/run-5/orbweaver-findings.md` on branch `feature/prd-5-evaluation-run-5`). Run-6 findings build on that baseline, tracking which were resolved, which persist, and what's new.

**Naming note**: The CLI tool was renamed from `orbweaver` to `spiny-orb` between run-5 and run-6 (spinybacked-orbweaver#177). Run-5 artifacts use the old name; run-6 artifacts use the new name.

### Supporting Documentation

All evidence referenced below lives in the eval repo on branch `feature/prd-6-evaluation-run-6`.

**Eval repo root**: `/Users/whitney.lee/Documents/Repositories/commit-story-v2-eval`
**Spiny-orb repo root**: `/Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver`

Paths in this document are relative to the eval repo root unless otherwise noted.

| Document | Path | What it contains |
|----------|------|-----------------|
| Failure deep-dives | `evaluation/run-6/failure-deep-dives.md` | Root cause analysis for each failed/partial file |
| Spiny-orb output log | `evaluation/run-6/spiny-orb-output.log` | Per-file results, schema evolution status, run-level issues |
| Per-file evaluation | `evaluation/run-6/per-file-evaluation.json` | Canonical per-file rubric results |
| Lessons for PRD #7 | `evaluation/run-6/lessons-for-prd7.md` | Process improvements, methodology observations |
| Spiny-orb branch | TBD (will be `spiny-orb/instrument-<timestamp>`) | The actual instrumented code |
| Evaluation rubric | `spinybacked-orbweaver/research/evaluation-rubric.md` (spiny-orb repo) | 32-rule rubric |
| Rubric-codebase mapping | `spinybacked-orbweaver/research/rubric-codebase-mapping.md` (spiny-orb repo) | Maps rubric rules to spiny-orb source code |

---

## Handoff Triage Review

The run-5 actionable-fix-output served as the handoff to the spiny-orb team. All 22 findings were triaged — none rejected. The team filed a dedicated PRD (#179: "Port 8 failed/partial files as acceptance test fixtures") plus individual issues for each finding. Triage was thorough:

**Issues filed (all closed):**

| Run-5 Finding | Issue Filed | Status | Notes |
|--------------|------------|--------|-------|
| DEEP-1 (COV-003 exemption) | #180 | Closed | Critical path item |
| RUN-1 + DEEP-6 (oscillation + entry point) | #181 | Closed | Combined into single issue |
| DEEP-4 (duplicate JSDoc) | #189 | Closed | |
| EVAL-1 + DEEP-8 (schema attrs + Date) | #184 | Closed | Combined related items |
| PR-4 (partial file commits) | #182 | Closed | |
| DEEP-2/2b (function-level fallback) | #178 | Closed | |
| DEEP-7 (whole-file syntax check) | #187 | Closed | |
| Push auth (persistent) | #183 | Closed | 3rd consecutive failure |
| RUN-4 (retry budget) | #186 | Closed | |
| PR-2 + PR-3 (advisory + span names) | #185 | Closed | Combined related items |
| PRE-1 (npm name collision) | #177 | Closed | Renamed to spiny-orb |
| DEEP-5 + EVAL-2 (SDK init + traceloop) | #190 | Closed | Combined related items |
| RUN-3 + RUN-5 (tally + timestamps) | #188 | Closed | Combined related items |
| PRE-2 (span extension namespace) | #209 | Closed | Discovered during fix work |

**PRD filed:**
- PRD #179: Port 8 failed/partial files as acceptance test fixtures — completed with 9 milestones

**Additional issues discovered during fix implementation (13+):**
- #205-207: Regressions from library detection (#190)
- #209: Colon vs dot separator in schema extensions
- #210: Adaptive token limit escalation
- #211: Fix loop token divergence on retry
- #212: Sync-only file pre-screening
- #213-216: CLI output improvements (diagnostics, reasoning report, human-readable rule names)
- #217: Token calibration evaluation
- #218: E2e PR creation verification
- #221, #225: CI and test configuration fixes

**Triage quality assessment:** Excellent. The team combined related findings efficiently (5 combinations), filed everything, and discovered 13+ additional issues during implementation. The handoff process continues to work well — this is the second successful handoff cycle (run-4→run-5, run-5→run-6).

---

## Resolved from Run-5

*Updated during pre-run verification and throughout evaluation as findings are confirmed fixed.*

---

## New Findings

*Added throughout evaluation milestones.*

---

## Persistent Findings

*Findings that remain open from prior runs.*
