# Orbweaver Findings — Run-5

Findings from evaluation run-5 of spinybacked-orbweaver instrumentation agent on commit-story-v2.

Each finding includes priority classification (Critical/High/Medium/Low), recommended action (PRD or Issue), evidence paths, and acceptance criteria.

**Baseline**: Run-4 produced 13 findings (`evaluation/run-4/orb-findings.md`). Run-5 findings build on that baseline, tracking which were resolved, which persist, and what's new.

**Cross-run comparability note**: Run-5 is the first evaluation where SCH-001 through SCH-004 validation fires during the agent's fix loop (PR #173) and where prompt changes affect span naming guidance (PR #175). All prior run SCH scores reflect an agent that never received schema feedback during instrumentation. Score changes in the SCH dimension should be attributed to this infrastructure change, not solely to agent quality improvement.

---

## Resolved from Run-4

*Updated throughout evaluation as findings are confirmed fixed.*

All 13 run-4 findings were filed by the orbweaver AI (none rejected) and merged to main before run-5. Triage was efficient: 4 prompt-guidance findings batched into PR #165, schema evolution + span naming combined in PR #170, validation pipeline addressed via PRD #156.

| Run-4 # | Description | Orbweaver Action | PR | Status |
|---------|-------------|-----------------|-----|--------|
| 1 | Schema evolution broken (format mismatch) | Issue #155 | PR #170 | Merged |
| 2 | Validation pipeline (per-file checks, fix/retry) | PRD #156 | PR #171 | Merged |
| 3 | Expected-condition catches as errors | Issue #157 | PR #165 | Merged (prompt-only) |
| 4 | Schema extension warnings unreadable | Issue #151 | PR #166 | Merged |
| 5 | CLI output doesn't show artifact locations | Issue #152 | PR #167 | Merged |
| 6 | Create draft PR when tests fail | Issue #153 | PR #168 | Merged |
| 7 | LOC-aware test cadence | Folded into PRD #156 | PR #171 | Merged |
| 8 | Skip commit for zero-change files | Issue #160 | PR #164 | Merged |
| 9 | Tracer name defaults to 'unknown_service' | Issue #154 | PR #165 | Merged |
| 10 | Span naming inconsistency | Issue #158 | PR #170 | Merged |
| 11 | Unused OTel imports on zero-span files | Issue #161 | PR #169 | Merged |
| 12 | Over-instrumentation of pure sync functions | Issue #159 | PR #165 | Merged |
| 13 | index.js missing root span | Issue #162 | PR #165 | Merged |

**Handoff process assessment**: The recommendation-document approach worked well. The orbweaver AI right-sized work correctly (downgraded finding #1 from PRD to Issue since the fix was a parser change, kept #2 as PRD since it was a multi-milestone effort). Finding #7 was folded into PRD #156 — correct since both share the same root cause. Three additional issues (#174, #173, #172) were filed for problems discovered during implementation. Total: 13 findings → 13 filings + 3 bonus fixes.

**Finding #3 gap**: Expected-condition catch handling (NDS-005, CDQ-003) was fixed via prompt guidance only — no automated validator exists. If the LLM ignores the guidance, the validation pipeline won't catch it. This is the most likely persistent failure in run-5.

---

## Persistent from Run-4

*Updated throughout evaluation as findings are confirmed still present.*

---

## New Findings

*Added throughout evaluation as new issues are discovered.*

### PRE-1: npm package name collision

- **Priority**: Medium
- **Recommended Action**: Issue
- **Description**: `npx orbweaver` resolves to an unrelated webcrawler package ([punkave/orbweaver](https://github.com/punkave/orbweaver), v0.1.4 on npm). Running `npx orbweaver instrument` executes the wrong binary. The spinybacked-orbweaver package's `bin` entry maps `orbweaver` → `bin/orbweaver.js`, but the package name is `spinybacked-orbweaver`, not `orbweaver`.
- **Impact**: Anyone following documentation that says `npx orbweaver` will run the wrong tool. The smoke test initially failed for this reason.
- **Evidence**: `npm view orbweaver` returns the punkave webcrawler. Our smoke test pulled v0.1.4 from npm instead of the local build.
- **Acceptance Criteria**: Either (a) publish under a scoped name (`@wiggitywhitney/orbweaver`), (b) change the bin name to `spinybacked-orbweaver`, or (c) document that `npx orbweaver` does NOT work and users must use the local binary path.

### PRE-2: Schema extension namespace enforcement rejects span-type extensions

- **Priority**: Low
- **Recommended Action**: Issue (investigate)
- **Description**: Smoke test output showed: "Warning: Schema extensions rejected by namespace enforcement: span:commit_story.commit.get_changed_files, span:commit_story.commit.is_merge_commit, span:commit_story.commit.get_commit_metadata". These span names DO have the correct `commit_story.*` namespace prefix but were still rejected. May indicate that span-type extensions are handled differently from attribute-type extensions in the namespace filter.
- **Impact**: Rejected span extensions may reduce schema coverage scores. Not blocking — these are warnings, not failures.
- **Evidence**: Smoke test output on `orbweaver/instrument-1773704681144` branch.

---

## Carry-Forward from Prior Runs

| Item | Origin | Run-5 Status |
|------|--------|-------------|
| Run-3 #3: Zero-span files give no reason in CLI | Run-3 | Likely fixed — run-4 finding #5 (CLI artifact locations, issue #152, PR #167 merged) may address this |
| Run-3 #4: NDS-003 blocks instrumentation-motivated refactors | Run-3 | Open — design tension, not a bug |
| Run-3 #12: Push validation (read access ≠ push access) | Run-3 | Pre-run push --dry-run succeeded; evaluate during run |
| spinybacked-orbweaver #62: CJS require() in ESM projects | Run-2 | Open (spec gap) |
| spinybacked-orbweaver #63: Elision/null output bypass retry loop | Run-2 | Likely improved — PRD #156 added fix/retry logic |
| spinybacked-orbweaver #66-69: Spec gaps | Run-2 | Open |
