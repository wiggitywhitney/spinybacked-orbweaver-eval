# Actionable Fix Output — Run-18

Self-contained handoff from evaluation run-18 to the spiny-orb team.

**Run-18 result**: 24/25 (96%) canonical quality, 11 committed, 4 failed, 0 partial, $9.16 cost. Gates 5/5. IS 90/100 (SPA-001 structural). Q×F 10.6.

**Run-17 → Run-18 delta**: Quality +8pp (88% → 96%), COV +40pp (3/5 → 5/5), gates restored 5/5, cost -$1.27 ($10.43 → $9.16), push #70 (manual — auto-push failed due to pre-push hook creating commit).

**Target repo**: commit-story-v2 (same as runs 9–18)
**Branch**: `spiny-orb/instrument-1778932891597`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/70
**spiny-orb version**: 1.0.0 (SHA 1c53ffd, main branch)

---

## §1. Run-18 Score Summary

| Dimension | Score | Run-17 | Delta |
|-----------|-------|--------|-------|
| NDS | 2/2 (100%) | 2/2 (100%) | — |
| COV | **5/5 (100%)** | 3/5 (60%) | **+40pp** |
| RST | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 3/4 (75%) | 3/4 (75%) | — |
| CDQ | 7/7 (100%) | 7/7 (100%) | — |
| **Total** | **24/25 (96%)** | **22/25 (88%)** | **+8pp** |
| **Gates** | **5/5** | **4/5** | **+1** |
| **Files** | **11** | **10+1p** | **+1** |
| **Cost** | **$9.16** | **$10.43** | **-$1.27** |
| **IS** | **90/100** | **90/100** | **—** |
| **Q×F** | **10.6** | **8.8** | **+1.8** |

---

## §2. Prior Findings Assessment

| # | Finding | Priority | Status in Run-18 |
|---|---------|----------|-----------------|
| RUN17-1 | NDS-003 reconciler gap (startActiveSpan in nested callbacks) | P1 | **PARTIAL** — summary-manager.js now commits (3 generate functions fixed via MIN_STATEMENTS bypass); context-capture-tool.js, reflection-tool.js, index.js, summary-graph.js still fail |
| RUN17-2 | NDS-003 content corruption in journal-graph.js | P1 | **RESOLVED** — journal-graph.js committed 4 spans, formatChatMessages confirmed intact |
| RUN17-3 | git-collector COV-001 (getCommitData missing span) | P2 | **RESOLVED** — git-collector.js commits 2 spans; getCommitData confirmed present |
| RUN17-4 | summary-graph SCH-002 (wrong attribute domain) | P2 | **NOT RESOLVED** — summary-graph.js fails NDS-003 before SCH evaluation; SCH-002 class issue appears in journal-manager.js instead (new RUN18-2) |
| RUN17-5 | Advisory pass rollback path unaudited | Low | **NOT RESOLVED** — no commits address this |
| RUN17-6 | PR title "(N files)" count wrong | Low | **NOT RESOLVED** — PR #70 title was set manually; auto-PR failed before title logic executed |

---

## §3. New Run-18 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN18-1 | NDS-003 reconciler gap: 4 files still blocked (same root cause as RUN17-1) | P1 | Validator / Reconciler |
| RUN18-2 | SCH-002: journal-manager.js `quotes_count` semantic mismatch | P2 | Schema |
| RUN18-3 | Auto-push failure: pre-push hook creates commit mid-push, spiny-orb doesn't retry | P2 | Push reliability |

---

### RUN18-1: NDS-003 Reconciler Gap — 4 Files Blocked (P1)

**What happened**: context-capture-tool.js, reflection-tool.js, index.js, and summary-graph.js all fail NDS-003. Agent code is semantically correct in all cases.

**Files and failure modes**:
| File | NDS-003 error | Pattern |
|------|--------------|---------|
| context-capture-tool.js | lines 124–125 missing: `},` and `);` (oscillation) | saveContext startActiveSpan re-indentation |
| reflection-tool.js | lines 116–117 missing: `},` and `);` (oscillation) | saveReflection startActiveSpan re-indentation |
| summary-graph.js | line 485 missing: `}),` | 6 span wrappers inflate cumulative offset |
| index.js | lines 217, 375 missing: `);` and `},` | Collapsed multi-line imports on attempt 1; partial fix on attempt 2 |

**Root cause (same as RUN17-1)**: When `startActiveSpan` wrapping re-indents original function body lines, NDS-003's reconciler counts those lines as both "removed" and "added," inflating the cumulative offset. Later closing delimiters appear at wrong positions. Unresolvable without content-aware diff (PRD #845).

**Note on RUN17-1 partial resolution**: summary-manager.js's three `generateAndSave*` functions now commit thanks to issue #855 (MIN_STATEMENTS bypass for exported async). They committed via file-level instrumentation (not function-level fallback), so the reconciler gap didn't fire. The gap only fires when `startActiveSpan` wrapping adds re-indented lines — the `generateAndSave*` functions have simple bodies that don't trigger it.

**Required fix**: PRD #845 M1+ — content-aware diff that handles re-indented span callback bodies. Until then, these 4 files will fail on every run.

---

### RUN18-2: SCH-002 — journal-manager.js `quotes_count` Semantic Mismatch (P2)

**What happened**: `discoverReflections` sets `commit_story.journal.quotes_count` for `reflections.length` — the count of reflection markdown files discovered in a time window.

**The mismatch**: `commit_story.journal.quotes_count` is defined in the base registry as "Number of developer quotes extracted for the entry" — a journal generation context attribute (AI extraction of memorable quotes from commits). `discoverReflections` performs file system traversal, not AI quote extraction. These are semantically distinct operations.

**Prior runs**: Run-17 had a SCH-002 on summary-graph.js (`messages_count`/`quotes_count` for journal entry counts). That file fails NDS-003 before SCH evaluation in run-18. The journal-manager.js SCH-002 is new — surfaced because `discoverReflections` now commits (run-18 fix) and was evaluated for the first time.

**PRD #857 M2-M3 impact**: The semantic precision rule for count attributes was added to the prompt ("verify the registered key's description matches exactly what you're counting"). The agent apparently didn't apply it when selecting `quotes_count` for reflection discovery. Either the description wasn't clear enough or the agent didn't check before reusing the key.

**Required fix options**:
1. Add `commit_story.journal.reflections_count` as a schema attribute (type: int, description: "Number of reflection entries discovered in the time window") — most precise
2. OR update agent directive to explicitly list `quotes_count` as restricted to AI journal generation context only
3. The prompt rule should say: "`quotes_count` is specifically for AI-extracted quotes from journal generation; use a different key for file-system-discovered reflection counts"

---

### RUN18-3: Auto-Push Failure — Pre-push Hook Creates Commit (P2)

**What happened**: spiny-orb's push to GitHub failed. The `progress-md-pr.sh` pre-push hook in commit-story-v2 ran, committed a PROGRESS.md update to the instrument branch, then exited non-zero with the message "Committed PROGRESS.md update. Push again to include it." spiny-orb received the non-zero exit from `git push` and logged "Push failed — skipping PR creation" without retrying.

**Note**: Security check and tests both PASSED before the hook created the commit. The failure was not a token, auth, or test issue.

**Impact**: PR #70 was created manually. The PROGRESS.md commit was picked up by the manual push. No data was lost.

**Required fix in spiny-orb**: Detect the "Committed X update. Push again" pattern in pre-push hook output and retry the push. Alternatively: run git push with `--no-verify` in sandboxed target repos, OR detect that the hook created a new commit and include it in the retry.

**Scope**: Affects any target repo with a "commit-then-fail" pre-push hook. commit-story-v2 has `progress-md-pr.sh` which does this. This will fire on every run until spiny-orb handles the retry.

---

## §4. Per-Run Signal Changes

**journal-graph.js (RUN17-2 resolved)**: The file committed in run-18 after full failure in run-17. The 65% thinking budget cap appears sufficient on some passes — run-17's failure may have been a one-off LLM variation rather than a structural budget issue. The thinking budget research spike (issue #858) remains relevant: if this file fails again in run-19, the budget cap hypothesis is stronger.

**summary-manager.js trajectory**: 3 spans (run-12) → 6 spans (run-17) → 9 spans (run-18). Full COV-004 coverage now achieved. The 3 `generateAndSave*` orchestrators are the main addition in run-18.

**Advisory contradiction rate**: ~50% in run-18 (up from ~39% in run-17). Primary driver: SCH-001 false positives on schema extension spans (live-check doesn't see the `schemaExtensions` array). CDQ-007 over-triggers on array `.length` attributes. Both patterns are structural to the advisory pass — not agent quality issues.

**D-1 (attempt count distribution)**:
| Attempts | Count | Files |
|----------|-------|-------|
| 1 | 3 | mcp/server.js, journal-paths.js, summary-detector.js |
| 2 | 6 | claude-collector.js, journal-graph.js, journal-manager.js, summary-manager.js, auto-summarize.js, + 1 failed |
| 3 | 5 | git-collector.js, context-integrator.js, summarize.js, context-capture-tool.js, reflection-tool.js |

No files hit the 3-attempt oscillation threshold among committed files — all recoveries were successful on attempt 2 or 3. All oscillation-flagged files (context-capture-tool.js, reflection-tool.js) fail rather than committing.

---

## §5. Recommended Next Actions (run-19 prep)

**For spiny-orb team:**

1. **PRD #845 (P1)**: NDS-003 reconciler gap — 4 files have been blocked for 2+ runs by the same root cause. The gap is now well-characterized with 4 concrete examples. The content-aware diff is the correct fix; any reconciler patch addressing only the specific patterns seen will likely be outrun by new patterns in future files.

2. **RUN18-3 push retry (P2)**: When the pre-push hook creates a new commit and exits non-zero with "Push again" message, spiny-orb should retry the push. This affects all target repos with progressive-commit hooks.

3. **RUN18-2 schema guidance (P2)**: Add explicit negative guidance to the prompt for `commit_story.journal.quotes_count`: "Do NOT use `quotes_count` for reflection discovery counts — it is specifically for AI-extracted quotes from journal generation." OR: add `commit_story.journal.reflections_count` to the schema and add it to the prompt's attribute selection guidance for `discoverReflections`.

4. **RUN17-5 advisory pass rollback (Low)**: Advisory pass rollback path still untested. Issue #856 tracks this. Low priority but worth confirming test coverage exists.

**For eval team:**

- Run-19 primary goal: verify PRD #845 fix resolves context-capture-tool.js, reflection-tool.js, index.js, and summary-graph.js. If all 4 commit, Q×F could reach 15+ (24/25 × 15 files if the 4 newly-fixed plus current 11 all commit).
- Watch: Does journal-manager.js SCH-002 recur in run-19? If yes, the agent is not applying the count attribute precision rule to `discoverReflections`.
- Watch: Does journal-graph.js commit again or return to failure? Two data points needed to distinguish LLM variation from structural budget issue.
