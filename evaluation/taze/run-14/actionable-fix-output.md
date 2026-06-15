# Actionable Fix Output — taze Run-14

Abbreviated handoff from taze evaluation run-14. Run was aborted after 5/33 files; findings are infrastructure failures, not file-level instrumentation failures.

**Run-14 result**: Aborted. 5/33 files processed (3 pre-scan skips, 1 committed, 1 crashed). 28 files never started. PR #9 created with 1 file. Cost: $0.04.

**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze)
**Branch**: `spiny-orb/instrument-1749943843655`
**PR**: https://github.com/wiggitywhitney/taze/pull/9
**spiny-orb SHA**: `8649c86ca5a60b508ba0483a37b707dad78ee51e`

---

## §1. What Happened

Run-14 was aborted due to two interacting spiny-orb bugs:

1. **#933 — CDQ-006 isRecording guard generated without block body**: The CDQ-006 fix from PR #749 (spiny-orb #728) generates `if (span.isRecording())` guards. For `src/commands/check/checkGlobal.ts`, the agent produced a guard without a block body:
   ```typescript
   if (span.isRecording())

   return pkgMetas
   ```
   ts-morph's AST replacement requires matching child counts; this malformed guard produced a child-count mismatch (8 vs 7) and crashed.

2. **#934 — `stoppedByCheckpoint` fires when baseline is already failing**: `dispatch.ts` fires `stoppedByCheckpoint = true` even when rollback is already disabled due to a pre-existing baseline failure. After the crash on file 4, the run should have continued; instead it stopped and exited after file 5 with "Run complete."

Additionally, a pre-existing test failure (`test/resolves.test.ts > resolveDependency > provenanceDowngraded`) was present before instrumentation began. The npm provenance API changed its response type from string `"trustedPublisher"` to boolean `true` between run-13 (2026-05-03) and run-14 (2026-06-14). Applied as `it.skip(...)` block with explanatory comment in taze fork; committed to taze fork main as `6a25b4d`.

---

## §2. Run-13 Finding Status

| Finding | Status |
|---------|--------|
| TAZE-RUN1-1 (SCH-003 schema types) | Applied in pre-run (taze fork main updated). **Unverified** — run aborted before SCH-003 could be evaluated. Carry forward to run-15. |
| TAZE-RUN1-2 (CDQ-006 isRecording guard) | spiny-orb #728 landed (PR #749). New bug #933 introduced. **Unverified** — run crashed before CDQ-006 could be evaluated. Carry forward to run-15. |
| TAZE-RUN1-3 (Advisory contradiction ~78%) | Still gated on 2+ completed TypeScript runs. No data from run-14. |
| TAZE-RUN1-4 (Pre-scan LLM tokens) | No data from run-14. |
| TAZE-RUN1-5 (IS RES-001: service.instance.id) | Applied in pre-run (`examples/instrumentation.js` updated, commit `f16b763`). **Unverified** — IS scoring not run. Carry forward to run-15. |
| TAZE-RUN1-6 (IS SPA-001: 164 INTERNAL spans) | Still gated on 2+ completed runs. No data from run-14. |

---

## §3. New spiny-orb Issues Filed

| Issue | Title | Priority |
|-------|-------|----------|
| #933 | CDQ-006 isRecording guard generated without block body — ts-morph crash | P1 (blocker for run-15) |
| #934 | `stoppedByCheckpoint` fires even when baseline is already known failing | P1 (blocker for run-15) |
| #935 | Pre-run test gate: run tests before cost ceiling prompt, exit on pre-existing failures | P2 (UX improvement, blocker for clean run-15) |
| #936 | Dep-graph cycle noise: suppress `[dep-graph] cycle detected:` messages behind `--verbose` | P3 (UX improvement) |

### Latent Risk (not filed)

**dep-graph path normalization mismatch** — the dep-graph builder compares paths from ts-morph's `sf.getFilePath()` and the discovery layer's `path.join()`. If these diverge (different path separators, symlink resolution), the processing queue could be silently truncated. Run-14 confirmed this was NOT the root cause of the short run (cost ceiling showed 33 files correctly), but the latent risk exists. See `spiny-orb-findings.md` for full description.

---

## §4. What PRD #83 Should Verify

Before starting run-15, pre-run verification must confirm all four issues are merged to spiny-orb main:

1. **#933 merged** — CDQ-006 guard template produces block bodies in all cases
2. **#934 merged** — Run continues past checkpoint failures when baseline is already failing
3. **#935 merged** (or confirmed as design decision) — Test suite runs before cost ceiling prompt
4. **#936 merged** (optional — UX only) — dep-graph noise suppressed

After fixes land, run-15 primary goals:
- **CDQ-006**: Verify violations drop from run-13's 8 instances (across 5 files) to 0 — this is the primary question #728 was meant to answer
- **SCH-003**: Confirm the schema type fix (applied in pre-run-14) resolves the 3 type mismatches
- **IS RES-001**: Confirm `service.instance.id` addition (applied in pre-run-14) brings IS score above run-13 baseline (60/100)
- **provenanceDowngraded skip**: Confirm `it.skip(...)` block is still present in taze fork main (commit `6a25b4d`)

No Findings Discussion or handoff checkpoint 2 required for run-14 — the spiny-orb team handoff was completed during the run session (bugs filed directly). PRD #83 carries forward the standard two user-facing checkpoints for the full run.

---

## §5. Carry-Forward Items for PRD #83

| # | Finding | Priority | Source |
|---|---------|----------|--------|
| TAZE-RUN1-1 | SCH-003 schema type fix — applied, unverified | Low | run-13 |
| TAZE-RUN1-2 | CDQ-006 isRecording guard — #728 landed, #933 blocks verification | Low | run-13 |
| TAZE-RUN1-3 | Advisory contradiction rate ~78% | Low | run-13 (gated 2+ runs) |
| TAZE-RUN1-5 | IS RES-001 service.instance.id — applied, unverified | Low | run-13 |
| TAZE-RUN1-6 | IS SPA-001 164 INTERNAL spans — structural, not a regression | Low | run-13 (gated 2+ runs) |
