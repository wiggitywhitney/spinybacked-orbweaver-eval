# Baseline Comparison — release-it Run 5

Run-5 quality figures come from `rubric-scores.md`. Run-5 scores 27 rules, and run-4, run-3, and commit-story-v2 run-28 each score 25. The 24 rules all four runs share exclude CDQ-008 (scored by the other three) and COV-002, RST-002, and CDQ-011 (scored by run-5 only). Every dimension comparison below uses the shared-rule figures, so denominators match.

---

## Release-it Cross-Run Trend

| Run | Date | Quality | Gates | Files committed | Spans | Cost | Push/PR | Q×F | IS |
|-----|------|---------|-------|-----------------|-------|------|---------|-----|----|
| 1 | 2026-03-17 | — | — | 0 | 0 | — | NO | 0 | — |
| 2 | 2026-04-21 | 24/25 (96%) | 4/5 | 0 (rollback) | 0 | $5.69 | push YES / PR NO | 0 | — |
| 3 | 2026-05-04 | 25/25 (100%) | 5/5 | 3 | 6 | $1.59 | push YES / manual PR #2 | 3.0 | 90/100 |
| 4 | 2026-05-06 | 24/25 (96%) | 5/5 | 7 | 20 | $6.97 | push YES / manual PR #3 (E2BIG) | 6.7 | 100/100 |
| **5** | **2026-09-29** | **21/27 (78%); 18/24 (75%) shared** | **5/5** | **9** | **33** | **$6.55** | **push YES / auto PR #4** | **7.0 (6.8 shared)** | **100/100** |

Run-5 is the first release-it run with an automatic PR. Q×F rose for the second consecutive run. Volume drove the gain: 9 files and 33 spans against 7 and 20, for $0.42 less. Quality fell, and most of the fall is not a regression (see "Quality Change" below).

Run-4's cost is $6.97 in its own `rubric-scores.md` and `baseline-comparison.md`. Run-5's `run-summary.md` lists run-4 at "~$5–6". This table uses $6.97, the figure run-4's artifacts report.

---

## Release-it Dimension Trend (24 shared rules)

| Dimension | Run-3 | Run-4 | Run-5 | Run-4→5 |
|-----------|-------|-------|-------|---------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | 5/5 (100%) | 4/5 (80%) | 4/5 (80%) | — |
| RST | 4/4 (100%) | 4/4 (100%) | **3/4 (75%)** | **-1** |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 4/4 (100%) | 4/4 (100%) | **1/4 (25%)** | **-3** |
| CDQ | 6/6 (100%) | 6/6 (100%) | **5/6 (83%)** | **-1** |
| **Total** | **24/24 (100%)** | **23/24 (96%)** | **18/24 (75%)** | **-5** |

Run-3's `rubric-scores.md` marks COV-006, RST-003, RST-005, and CDQ-006 as N/A and still reports 25/25, so it counts N/A as a pass. Run-4's baseline comparison read run-3 the same way. This table follows that reading, so run-3's shared figure is 24/24.

**SCH differs from both earlier runs by 3 points.** It is the only release-it dimension that moved by more than 1 point. All three failing SCH rules (SCH-002, SCH-003, SCH-004) passed in run-3 and run-4. Ten of the 14 per-file failures behind run-5's 6 failing rules sit in SCH (SCH-002 in 3 files, SCH-003 in 6, SCH-004 in 1), and 5 of those 10 are in files that committed for the first time.

COV holds at 4/5, but the failing file changed. Run-4's COV-003 failure was shell.js (`Promise.reject` without error recording). Run-5's is factory.js, whose outer recording catch the agent removed after NDS-005 and NDS-007 flagged it. The run-4 fix fired: COV-003 caught shell.js's `return Promise.reject(err)` on attempt 1 and the agent added the recording (`failure-deep-dives.md`, RUN4-3). shell.js then failed SCH-002 and did not commit, so the fix has no committed evidence.

---

## Quality Change (23/24 → 18/24 shared)

`rubric-scores.md` classifies all 14 per-file failures. Most of the -21pp is not code that passed in run-4 and broke in run-5:

| Classification | Count | Failures |
|----------------|-------|----------|
| File committed for the first time | 7 | prompt.js (SCH-003, SCH-004, CDQ-007), GitRelease.js (SCH-002), GitHub.js (SCH-002, CDQ-007), GitLab.js (SCH-003) |
| First evaluation of a value source run-4 did not record | 1 | factory.js SCH-002 (`plugin.namespace` holds the module specifier) |
| Stricter scoring of code unchanged since run-4 | 3 | config.js and Version.js SCH-003 (the `false` path of `version.increment`), Plugin.js RST-003 (thin wrapper over `prompt.show`) |
| Code changed after validator feedback | 2 | factory.js COV-003 (outer recording catch removed), util.js SCH-003 (count cast to string and schema retyped) |
| Unclassified | 1 | factory.js SCH-003 (run-4 did not record whether the counts were already cast) |

Only the 2 validator-driven failures are regressions in the strict sense, where run-4's code passed and run-5's code is worse. The 7 first-commit failures are what committing four more files costs. The 3 stricter-scoring failures would likely have scored FAIL in run-4 under run-5's readings (`exemption-scope.md`).

---

## Release-it Run 5 vs Commit-story-v2 Run 28 (most recent cross-target run)

Run-28 is the latest row in `evaluation/javascript/commit-story-v2/run-log.md` (2026-09-17).

| Metric | Release-it run-5 | CS-v2 run-28 | Delta |
|--------|------------------|--------------|-------|
| Quality (own rule set) | 21/27 (78%) | 21/25 (84%) | -6pp |
| Quality (24 shared rules) | 18/24 (75%) | 20/24 (83%) | **-8pp** |
| Gates | 5/5 (100%) | 5/5 (100%) | — |
| Files committed | 9 | 12 + 1 partial | -3 |
| Total spans | 33 | 48 | -15 |
| Cost | $6.55 | $7.23 | -$0.68 |
| Push/PR | YES / auto PR #4 | YES / auto PR #95 | — |
| Q×F (own rule set) | 7.0 | 10.08 | -3.1 |
| Q×F (shared rules) | 6.8 | 10.0 | -3.2 |
| IS score | 100/100 | 100/100 | — |

Run-28's shared-rule Q×F is 12 × 20/24, matching how run-28 computed its own 10.08 (12 committed files × 21/25, partial not counted).

### Dimensions that differ by more than 1 point (shared rules)

**None.**

| Dimension | Release-it run-5 | CS-v2 run-28 | Difference |
|-----------|------------------|--------------|------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 0 |
| COV | 4/5 (80%) | 5/5 (100%) | -1 |
| RST | 3/4 (75%) | 4/4 (100%) | -1 |
| API | 3/3 (100%) | 3/3 (100%) | 0 |
| SCH | 1/4 (25%) | 2/4 (50%) | -1 |
| CDQ | 5/6 (83%) | 4/6 (67%) | +1 |
| **Total** | **18/24 (75%)** | **20/24 (83%)** | **-2** |

Run-28's CDQ is 5/7 on its own set. Removing its passing CDQ-008 gives 4/6. Run-5's CDQ is 6/7 on its own set, and removing its passing CDQ-011 gives 5/6.

Four dimensions differ by exactly 1 point, so the 2-point total gap is spread out rather than concentrated. Release-it is behind on COV (factory.js COV-003), RST (Plugin.js RST-003), and SCH (SCH-004 in prompt.js, which run-28 passes). It is ahead on CDQ, because run-28 also fails CDQ-006 (`isRecording()` guards applied to 3 of about 24 calls in summary-manager.js).

### Failures both targets share

Three failing rules are the same in both runs, and two of them have the same shape:

- **SCH-003, integer counts cast to string.** Run-28 has 12 `String(...)`-wrapped counts on int-declared keys across 3 files (RUN27-3, open for 3 runs). Run-5 has the same shape in factory.js and GitLab.js, and util.js resolved the mismatch by retyping its schema entry to `string`, which `rubric-scores.md` notes matches taze run-17. Across three targets, this looks like one agent behavior rather than a target-specific defect. That is an observation from three single-run data points, to confirm in later runs.
- **SCH-002, a registered key reused for a related but different value.** Run-28's `dates_requested` holds a date count, a week count, and a month count. Run-5's `plugin.namespace`, `hook.command`, and `git.tag_name` each hold a neighboring concept. In run-28 the validator caught the reuse at reassembly. In run-5 the key names matched the registry, so the validator passed them.
- **CDQ-007.** Different shapes: run-28 ships raw paths and a raw author name, and run-5 sets attributes from nullable values without a guard (prompt.js L22, GitHub.js L603).

### Q×F gap explained

The 3.2 shared-rule gap is mostly volume (9 files against 12) and partly quality (75% against 83%). At run-28's shared quality, run-5's 9 files would give Q×F 7.5. At run-5's quality, run-28's 12 files would give 9.0. Release-it's volume ceiling is the LINT/NDS-003 conflict (GitBase.js, Git.js, npm.js) plus the shell.js SCH-002 failure. Commit-story-v2 has no equivalent formatting ceiling.

---

## IS Score Comparison

| Run | IS | Spans in scored trace | Command |
|-----|----|----|---------|
| Release-it run-3 | 90/100 | — | — (missed RES-001, `service.instance.id` absent) |
| Release-it run-4 | 100/100 | 9 | never recorded |
| **Release-it run-5** | **100/100** | **18 (10 traces)** | `--dry-run --ci --no-npm --git.requireCleanWorkingDir=false` under `vals exec` |
| CS-v2 run-28 | 100/100 | — | — |

**Run-5's 18 spans and run-4's 9 are not strictly comparable.** Run-5 used a modified dry-run command, because the PRD's original command stops at release-it's npm login check before any Git, GitHub, prompt, or shell code runs. Run-4's command was never recorded, so whether it reached the same code is unknown (2026-10-08 Decision Log row). Both runs scored 100/100. Treat the two span counts as two separate observations, not as a trend.

**Run-5's 18 spans also under-count what ran by at least one.** `commentOnResolvedItems` ran, but `release_it.github.comment_on_resolved_items` was exported neither to `eval-traces-run5.json` nor to Datadog. The likely cause is that the span ends after its function returns, because of an un-awaited `return`, and the process exits before the late span is flushed. This cause is not verified ("Trace Reconciliation" in `per-file-evaluation.md`, and the second 2026-10-08 trace-reconciliation Decision Log row). The IS score did not change, because IS scores the spans it receives.

The trace also confirmed the missing-root-span prediction: one dry run produced 10 separate traces with no common root, because `lib/index.js` `runTasks` and the `lib/cli.js` default export have no span. IS does not penalize this, so 100/100 sits alongside a fragmented trace a reader would find hard to follow.

---

## Advisory Contradiction Rate

| Run | Rate | What it counts |
|-----|------|----------------|
| Release-it run-3 | 7% | 3 false positives of 42 advisories |
| Release-it run-4 | 56% | 5 of 9 non-trivial advisories, PR body only |
| **Release-it run-5** | **100%** | **18 of 18 advisory sites: 12 CDQ-007 in the PR body plus 6 SCH-001 found only in companion files. The 12 PR-body sites alone are also 100%** |
| CS-v2 run-28 | 46% | 6 of 13 PR-body line items, with a 7th mixed (4 of 9 cited lines correct) |

The counting units differ (run-5 counts sites, run-28 counts line items, run-4 counts non-trivial advisories), so the rates compare direction rather than exact size (2026-10-08 Decision Log row). On the PR-body-only basis that run-4 used, run-5 moved from 56% to 100%. In both run-5 and run-28, CDQ-007 drives the false positives by firing on attributes that hold no path or PII. Run-5 adds that the validator missed both real CDQ-007 sites (`pr-evaluation.md`, "Advisory Findings Quality").

---

## Score Projection Validation

**Run-5 PRD projections (from run-4's findings):**

| Scenario | Projected | Actual | Verdict |
|----------|-----------|--------|---------|
| Conservative (RUN4-1 not landed) | ~7 files, 24/25, Q×F ~6.7, ~$5–7 | 9 files, 21/27 (18/24 shared), Q×F 7.0, $6.55 | **Exceeded on volume, not met on quality** |
| Target (RUN4-1 landed) | 11–13 files, 24–25/25, Q×F ~10–12, ~$8–12 | 9 files, 21/27, Q×F 7.0, $6.55 | **Not met** |
| Stretch (RUN4-1 + RUN4-2) | 12–15 files, 25/25, Q×F ~12–15, auto PR | 9 files, auto PR #4 | **Not met** (auto PR achieved) |

**Success criterion 1** reads "Q×F ≥ 10 if RUN4-1 fix landed; Q×F > 6.7 if not yet fixed". RUN4-1 landed in part (3 of 5 blocked files now commit), so neither branch fits exactly. Run-5 meets the fallback threshold (7.0 > 6.7, and 9 files against 7) and misses the full-fix threshold.

**Why the target missed:**

1. **RUN4-1 is reduced, not fixed.** spiny-orb `a55bd92` normalizes both sides through Prettier inside NDS-003 but does not reformat the agent's output, so the agent still has to produce Prettier-exact text within its attempt budget. GitBase.js and npm.js still fail, and Git.js, committed in run-4, now fails LINT on one line that grows from 117 to 121 characters inside the wrapper (`failure-deep-dives.md`).
2. **A failure type no projection anticipated.** shell.js, committed in run-4, failed SCH-002 because the meaning-consistency check compares variable names lexically (`cacheKey` against `command.join(' ')`).
3. **Quality was projected at 24–25/25** on the assumption that newly committed files would score like run-4's files. The four new files carried 7 of the 14 per-file failures.

Git.js and shell.js together cost 12 spans that run-4 had. With both committed, run-5 would have had 11 files, inside the target range.

---

## Failure Classification Across Runs

| Failure | First seen | Status after run-5 | Runs active | Root cause |
|---------|-----------|--------------------|-------------|------------|
| LINT/NDS-003 indentation-width conflict (RUN4-1) | Run-2 (LINT print-width) | **Reduced**: 3 of 5 run-4 files now commit; GitBase.js, npm.js still fail; Git.js newly fails | Runs 2, 4, 5 | Span wrapper adds 4 characters of indent; agent must emit Prettier-exact text |
| PR body E2BIG (RUN4-2) | Run-4 | **Resolved** (auto PR #4) | 1 run | Live-check report inline in PR body |
| COV-003 `Promise.reject` gap (RUN4-3) | Run-4 | **Fix fired** in shell.js attempt 1; no committed evidence | 1 run | Validator detected `throw` only |
| GitLab.js SCH-002 cross-domain duplicate (RUN4-4) | Run-4 | **Recurred** on attempt 1, did not block commit; not evidenced as fixed | 2 runs | Duplicate detection has no namespace scoping |
| Pre-scan false negatives (`lib/index.js`, `lib/cli.js`) | **Run-5** (identified in per-file evaluation; run-3's false negatives were plugin class methods, fixed in run-4) | **Open**; reproduces on `a55bd92` and causes the fragmented trace | 1 run identified | Pre-scan misses these async entry points |
| SCH-003 counts cast to string | **Run-5** (this target) | New: factory.js, GitLab.js, util.js | 1 run | Agent's code and schema declarations disagree; same shape as CS-v2 RUN27-3 |
| SCH-003 boolean on a string enum or string declaration | **Run-5** | New: config.js, Version.js, prompt.js | 1 run | `!= null` guard admits `false`; agent declared `string` for a boolean |
| SCH-002 registered key holding a different concept | **Run-5** | New: factory.js, GitRelease.js, GitHub.js | 1 run | Validator checks key names, not what the value is |
| SCH-002 lexical meaning check (shell.js) | **Run-5** | New; caused the shell.js failure | 1 run | `sharesToken` compares identifiers, not values |
| CDQ-007 unguarded nullable value | **Run-5** | New: prompt.js L22, GitHub.js L603; validator flagged neither | 1 run | No guard on optional/nullable sources |
| RST-003 cross-file thin wrapper | **Run-5** | New: Plugin.js `showPrompt` | 1 run | Validator checks same-file delegation only |
| SCH-004 duplicate key | **Run-5** | New: prompt.js `prompt.namespace` | 1 run | Same value recorded under a second key |
| COV-003 recording catch removed | **Run-5** | New: factory.js | 1 run | Agent removed the catch after NDS-005/NDS-007 feedback |
| Un-awaited `return` inside a span (unrubriced) | **Run-5** | New: 7 sites in GitRelease.js and GitHub.js; cost one exported span | 1 run | Agent did not use the `const r = await <expr>; return r;` form NDS-003 accepts |
| Advisory false positives | Run-3 (7%) | **Worse**: 100% | 3 runs | CDQ-007 fires on non-path, non-PII attributes |

---

## Key Takeaways

1. **Q×F rose to 7.0 on volume.** Four files committed for the first time, including GitHub.js with 13 spans and GitLab.js, which had never committed. Git.js and shell.js regressed to failures, so the net gain was 2 files.
2. **SCH is the dimension that moved.** It fell from 4/4 to 1/4 against both earlier release-it runs, the only release-it dimension to move by more than 1 point. Most of that comes from first-time files and stricter scoring, not from code that broke.
3. **No dimension differs from commit-story-v2 run-28 by more than 1 point** on the shared rules. The two targets now share SCH-003's integer-as-string shape and SCH-002's key-reuse shape, which points at agent behavior common to both rather than at either target.
4. **RUN4-2 is resolved and RUN4-1 is reduced.** The auto PR worked for the first time on release-it. The indentation-width conflict still blocks 3 files, and it decides which files commit from run to run (Git.js).
5. **IS stays at 100/100**, but the score hides a trace split into 10 roots and one dropped span. Span counts against run-4 are not comparable because the dry-run commands differ.
6. **Advisory quality got worse.** All 18 advisory sites are false positives, and the validator missed both real CDQ-007 sites.
