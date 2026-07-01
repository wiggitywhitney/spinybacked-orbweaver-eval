# Actionable Fix Output — release-it Run 4

**Date**: 2026-05-06
**Handoff target**: spiny-orb team
**Run result**: 7 committed, 6 failed, 10 correct skips, Q×F 6.7, IS 100/100, ~$6.97

---

## Cross-Document Audit

Consistency verified across run-summary.md, per-file-evaluation.md, failure-deep-dives.md, rubric-scores.md, baseline-comparison.md, pr-evaluation.md, and is-score.md.

| Check | Result |
|-------|--------|
| Files committed (7) | ✅ Consistent across all artifacts |
| Files failed (6) | ✅ Consistent |
| Correct skips (10) | ✅ Consistent |
| Total spans committed (20) | ✅ Consistent |
| Quality 24/25 | ✅ Consistent — single COV-003 failure on shell.js |
| IS score 100/100 | ✅ Consistent (is-score.md and baseline-comparison.md agree) |
| Push status (YES) | ✅ Consistent |
| PR status (manual — E2BIG) | ✅ Consistent |
| Cost (~$6.97) | ✅ Consistent — run-summary used estimate ($5–6); PR evaluation confirmed $6.97 from token table |
| Q×F 6.7 | ✅ Consistent |

**No cross-document contradictions found.**

---

## Summary for spiny-orb Team

Run-4 more than doubled Q×F (3.0 → 6.7) — the pre-scan class method fix is working. Git.js committed with 10 spans. The push targeting fix also works. The new ceiling is structural: a conflict between the LINT validator and NDS-003 that makes 5 plugin files uninstrumentable regardless of how many attempts the agent takes.

---

## §1. Run-4 Score Summary

| Dimension | Score | Run-3 | Delta | Failures |
|-----------|-------|-------|-------|----------|
| NDS | 2/2 (100%) | 2/2 | — | — |
| COV | 4/5 (80%) | 5/5 | **-20pp** | COV-003: shell.js |
| RST | 4/4 (100%) | 4/4 | — | — |
| API | 3/3 (100%) | 3/3 | — | — |
| SCH | 4/4 (100%) | 4/4 | — | — |
| CDQ | 7/7 (100%) | 7/7 | — | — |
| **Total** | **24/25 (96%)** | **25/25** | **-4pp** | 1 failure |
| **Gates** | **5/5 (100%)** | **5/5** | — | — |
| **Files** | **7 committed, 6 failed** | **3, 2 failed** | +4 committed | indentation-width conflict |
| **Cost** | **$6.97** | **$1.59** | +$5.38 | more files attempted |
| **Push/PR** | **YES push / manual PR** | **YES push / manual PR** | E2BIG (new reason) | — |
| **Q×F** | **6.7** | **3.0** | **+3.7** | — |
| **IS** | **100/100** | **90/100** | **+10** | — |

---

## §2. Quality Rule Failures (1 canonical)

### COV-003: shell.js — `Promise.reject` Without Span Error Recording

**File**: `lib/shell.js`
**Failure**: `execWithArguments` catch block uses `return Promise.reject(err)` to re-throw, but does not call `span.recordException(err)` or `span.setStatus({ code: SpanStatusCode.ERROR })` before doing so. The span closes without error metadata when this path fires.

**Why it passed the validator**: The COV-003 checker detects explicit `throw` statements and `catch (e) { span.recordException(e); ... }` patterns. `return Promise.reject(err)` is semantically equivalent to `throw err` in an async context, but the checker does not recognize it as a rethrow pattern.

**Fix needed (spiny-orb)**: Extend COV-003 validator to recognize `return Promise.reject(err)` as a rethrow pattern requiring error recording on the span — same treatment as `throw`.

---

## §3. Run-3 Findings Assessment

| # | Finding | Status in Run-4 |
|---|---------|----------------|
| RUN3-1 | Pre-scan false negative on async class methods | ✅ **RESOLVED** — Git.js committed with 10 spans from async class methods. PR #781 class method traversal fix confirmed working. |
| RUN3-2 | `gh pr create` targets upstream in fork | ⚠️ **PARTIALLY RESOLVED** — Push to fork succeeded (urlChanged=true; upstream targeting fixed). PR auto-creation still fails, now for a different reason: E2BIG (see §4 RUN4-2). |
| RUN3-3 | HOME not forwarded to weaver subprocess | ✅ **WORKING** via `HOME="$HOME"` workaround in instrument command. Spiny-orb P2-A fix status unknown; workaround remains active. |
| RUN3-4 | Git.js API termination (2 attempts) | ✅ **RESOLVED** — Git.js succeeded with 2 attempts and committed 10 spans. No API termination in run-4. |
| RUN3-5 | GitLab.js COV-002 on uninstrumented fetch | ⚠️ **STILL FAILING, DIFFERENT REASONS** — Attempt 1: COV-003 (catch block missing `recordException`); Attempt 2: SCH-002 ×2 (see §4 RUN4-4). GitLab.js has not yet committed in any run. |
| RUN3-6 | service.instance.id absent (RES-001) — IS miss | ✅ **RESOLVED** — IS score 100/100 in run-4. `randomUUID()` in instrumentation.js bootstrap resolves RES-001. |

---

## §4. New Run-4 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN4-1 | LINT/NDS-003 indentation-width conflict | P1 | Structural |
| RUN4-2 | Live-check compliance report printed inline — inflates console log and PR body (E2BIG) | P2 | Infrastructure |
| RUN4-3 | COV-003 validator gap: `Promise.reject` not detected as rethrow | P2 | Validator |
| RUN4-4 | GitLab.js SCH-002 contradictory validator messages | P2 | Validator |
| RUN4-5 | Live-check advisory noise: SDK-injected resource attrs | P3 | Advisory |

---

## §5. Prioritized Fix Recommendations

### P1: LINT/NDS-003 Indentation-Width Conflict (Critical)

**Files blocked**: GitBase.js (6 methods), GitRelease.js (2), GitHub.js (13), npm.js, prompt.js — 5 of 6 run-4 failures.

**Mechanism**: The `startActiveSpan` wrapper adds 2 indentation levels to the function body. Files in release-it's plugin layer have long lines already near Prettier's 120-char print width. Under the wrapper indentation, these lines exceed the limit. The agent now faces a dilemma:
- Preserve original lines verbatim → **LINT fails** (Prettier detects format violation)
- Reformat lines to satisfy Prettier → **NDS-003 fails** (original lines were modified)

No agent behavior resolves both simultaneously. This is a structural incompatibility between the two validators.

**Evidence from run-4**:
- GitBase.js (3 attempts), GitRelease.js (3), prompt.js (3): agent preserved original lines → LINT failed each time
- GitHub.js (2 attempts), npm.js (2): agent proactively split long lines → NDS-003 caught the modifications
- In attempt 2 on GitHub.js, the agent was explicitly shown Prettier's reformatting suggestion and tried to apply it — NDS-003 blocked that too

**Fix options** (spiny-orb):
1. **Prettier post-pass before NDS-003** (recommended): After the agent produces instrumented output, run `prettier --write` on the file, then compare the Prettified output against the Prettified original for NDS-003. This way NDS-003 evaluates formatting-normalized versions and doesn't flag lines that Prettier would have reformatted regardless.
2. **Compute NDS-003 baseline against Prettier-formatted original**: At validation time, run Prettier on the original source file to produce a formatting-normalized baseline, then diff the instrumented output against that baseline. Lines that differ only because Prettier would have reformatted them anyway are excluded.

Either option gives the agent a compliant path: instrument correctly, let Prettier handle the line-length issue, and NDS-003 evaluates the formatting-normalized delta.

**Expected run-5 impact**: If fixed, GitHub.js (13 methods), GitBase.js (6), GitRelease.js (2), npm.js, and prompt.js should all commit cleanly at quality levels consistent with run-4's committed files (24–25/25).

---

### P2-A: Live-Check Compliance Report Printed Inline — Inflates Both Console Log and PR Body

**Root cause**: The live-check compliance report JSON is printed inline to stdout during the run and embedded in the PR summary file. This is the same content appearing in two places, both causing problems. The report contains 15389 advisory entries — not 15389 distinct issues, but 7 missing attribute types flagged once per span across 2173 spans.

**Manifestation 1 — Console log inflation**: The `--verbose` output includes `"Full compliance report: { ... }"` as a JSON blob streamed to stdout, which ends up in `spiny-orb-output.log`. At run-4 scale this added hundreds of lines of raw JSON to the terminal log. At larger eval scales this will grow proportionally.

**Manifestation 2 — PR body E2BIG**: The same compliance report is appended to `spiny-orb-pr-summary.md` (the generated PR body), producing a 399K-line, ~12MB file. `gh pr create --body "<content>"` spawns with the entire file as a command-line argument; the OS kernel rejected it with `spawn E2BIG`, preventing auto PR creation entirely.

**Fix needed (root cause)**: Write the raw compliance report to a named artifact file (e.g., `spiny-orb-live-check-report.json`) instead of printing inline. Both the verbose log and the PR body should show a deterministic human-readable summary, not the raw JSON.

The summary is fully deterministic — no LLM needed. It's a `groupBy + count + format` operation on the structured report:

```text
Live-check: ✅ 0 violations — 2173 spans, 7 unique span names
Advisory: 7 SDK resource attrs not in schema (host.name, host.arch, host.id, +4 more) — affects all spans, expected
```

The algorithm: group findings by `(rule_id, attribute_key)`, deduplicate to distinct finding types (not raw instance count), separate blocking violations from advisories, emit as a compact summary. The raw per-span instance count (e.g., "15389") is an artifact of the JSON structure — 7 attribute keys × 2173 spans — and should not appear in the summary since it misrepresents 7 distinct issues as 15389. Full report available at the artifact file path for anyone who needs span-level detail. An LLM would only add value if narrative synthesis were needed — summarizing structured counts is operational, not semantic.

**Short-term mitigation (PR only)**: Replace `gh pr create --body "<content>"` with `gh pr create --body-file <tmpfile>` to bypass the OS argument length limit while the root fix is pending.

---

### P2-B: COV-003 Validator Gap — `Promise.reject` Not Detected as Rethrow

**File affected**: `lib/shell.js` — `execWithArguments` catch block.

**Gap**: The COV-003 checker requires `span.recordException(err)` and `span.setStatus(ERROR)` before re-throwing. It detects `throw err` as a rethrow indicator but not `return Promise.reject(err)`. Both are semantically equivalent in an async function — both propagate the error to the caller — but only `throw` triggers the COV-003 check.

**Fix needed**: Add `return Promise.reject(` as a recognized rethrow pattern in the COV-003 validator, treating it the same as `throw` for error recording requirements.

---

### P2-C: GitLab.js — Contradictory SCH-002 Validator Messages

**File affected**: `lib/plugin/gitlab/GitLab.js` — attempt 2.

**Issue**: The agent declared `release_it.gitlab.asset_name` as a new schema extension for the `uploadAsset` span. The validator returned two contradictory findings for the same attribute:
1. "Semantic duplicate of `release_it.github.assets_count`"
2. "Not found in the registry"

These cannot both be true: if it's a duplicate of a registry entry, it IS findable in the registry. The contradiction prevented the agent from determining how to fix the issue (remove the attribute? rename it? register it?), and the file failed.

**Fix needed**: Review the SCH-002 judge's duplicate-detection logic. It appears to be comparing across domain boundaries (`gitlab.asset_name` vs `github.assets_count` are unrelated attributes in different plugin namespaces). Add a domain-prefix constraint: SCH-002 duplicate detection should only flag matches within the same namespace prefix, not across unrelated namespaces.

---

### P3: Live-Check Advisory Content — 7 Distinct Attribute Gaps, Not 15389 Issues

**Observation**: The compliance report shows 15389 advisory findings, but this is 7 distinct missing attribute types × 2173 spans — the same 7 SDK-injected resource attributes (`host.name`, `host.arch`, `host.id`, `process.pid`, `process.runtime.name`, etc.) flagged once per span. This is expected behavior — the OTel Node.js SDK adds standard resource attributes that aren't in a target-specific Weaver registry.

The raw per-span instance count inflates the apparent problem. The actionable summary is "7 SDK resource attributes are missing from the schema" — a single advisory item, not 15389. When the compliance report is written to a file (see P2-A), both the file format and the inline summary should deduplicate to distinct finding types so the signal is not buried in repetition.

---

## §6. Unresolved Items Entering Run-5

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| LINT/NDS-003 indentation-width conflict | **RUN4-1** | 1 run | Structural; 5 files blocked |
| PR body E2BIG | **RUN4-2** | 1 run | `gh pr create --body-file` fix needed |
| COV-003 `Promise.reject` validator gap | **RUN4-3** | 1 run | shell.js quality failure |
| GitLab.js never committed (3 runs) | RUN3-5 + **RUN4-4** | 3 runs | COV-003, then SCH-002 contradiction |
| HOME not forwarded to weaver subprocess | RUN3-3 | 2 runs | Workaround active; spiny-orb fix pending |

---

## §7. Score Projections for Run-5

### Conservative (indentation-width conflict not fixed)

- 5 plugin files continue to fail (GitBase.js, GitRelease.js, GitHub.js, npm.js, prompt.js)
- GitLab.js may still fail (SCH-002 fix needed)
- **Files committed**: ~7 (same set as run-4)
- **Quality**: 24/25 (96%) — COV-003 shell.js may persist until validator fix
- **Q×F**: ~6.7

### Target (P1 fix: Prettier post-pass before NDS-003)

- 5 previously-failing plugin files now instrument successfully
- GitHub.js alone adds ~13 spans; GitBase.js adds ~6; GitRelease.js adds ~2
- **Files committed**: ~11–13
- **Quality**: 24–25/25
- **Q×F**: ~10–12
- **Cost**: ~$8–12 (more LLM calls for class-heavy plugin files)

### Stretch (P1 + P2-A: Prettier fix + PR `--body-file`)

- Auto PR creation works for the first time
- Full plugin layer instrumented
- **Files committed**: 12–15
- **Quality**: 25/25 if COV-003 validator gap also fixed
- **Q×F**: ~12–15

---

## §8. Run-4 Metrics at a Glance

| Metric | Run-4 | Run-3 | Run-2 |
|--------|-------|-------|-------|
| Quality | 24/25 (96%) | 25/25 (100%) | 24/25 (96%) |
| Gates | 5/5 | 5/5 | 4/5 |
| Files committed | 7 | 3 | 0 |
| Spans committed | 20 | 6 | 0 |
| Cost | $6.97 | $1.59 | $5.69 |
| Q×F | **6.7** | 3.0 | 0 |
| IS score | **100/100** | 90/100 | N/A |
| Push | YES | YES | YES |
| PR | Manual (E2BIG) | Manual (upstream targeting) | FAILED |
