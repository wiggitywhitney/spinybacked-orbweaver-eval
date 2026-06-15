# Lessons for Run 16

*To be populated after run-15 completes.*

---

## Pre-Run State for Run-15

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb build | ✅ | SHA: `69c76e1bb9c660a712fd2f95f1c5208fb99d8cdb` |
| spiny-orb #933 merged | ✅ | Fixed in commit `1fdb576` (PR #938, merged 2026-06-15) |
| spiny-orb #934 merged | ✅ | Fixed in commit `ffbda90` (PR #937, merged 2026-06-15) |
| spiny-orb #935 merged | ✅ | Fixed in commit `ffbda90` (PR #937, merged 2026-06-15) |
| spiny-orb #936 merged | ✅ | Fixed in commit `1fdb576` (PR #938, merged 2026-06-15) |
| Schema type fix (TAZE-RUN1-1) | ✅ | agent-extensions.yaml: sources_found→int, cache.hit→boolean, cache.changed→boolean |
| IS RES-001 fix (TAZE-RUN1-5) | ✅ | service.instance.id: randomUUID() present in examples/instrumentation.js (commit f16b763) |
| provenanceDowngraded skip | ✅ | it.skip in test/resolves.test.ts (commit 6a25b4d) — 73 passed, 1 skipped |
| Node version | ✅ | v25.8.0 |
| pnpm version | ✅ | 10.33.0 |

---

## Run-15 Observations

**Run summary**: 11 committed, 1 failed, 21 correct skips, 136K input / 185.5K output tokens. spiny-orb SHA `69c76e1bb9c660a712fd2f95f1c5208fb99d8cdb`.

### New failure modes observed

**NDS-001 oscillation → SUCCESS with 0 spans** (`io/resolves.ts`): Agent produced code with an NDS-001 violation, retried, produced the same violation, and aborted all 6 affected functions. The file reported `✅ SUCCESS — 0 spans` despite 0/9 functions being instrumented. No debug dump was written (spiny-orb only writes debug dumps for FAILED files). The verbose log is the only diagnostic source. This is a new failure mode — prior runs did not hit oscillation on this file. Root cause TBD (pending deep-dive). **Note for run-16**: watch for SUCCESS-with-0-spans as a false positive; it may mask oscillation failures.

**TS syntax error after 3 attempts** (`io/yarnWorkspaces.ts`): Agent produced malformed TypeScript (line 91, col 74: `',' expected`) on all three attempts, resulting in FAILED. Run-13 committed this file successfully (2 spans, 2 attempts). The agent's attempt-2 thinking shows it was trying to apply a CDQ-006 isRecording guard — possibly the guard introduction broke the syntax. Debug dump available. **Note for run-16**: this is a potential spiny-orb bug where CDQ-006 guard generation produces invalid syntax.

**cli.ts pre-scan regression**: Run-13 committed `src/cli.ts` with 2 spans. Run-14 and run-15 both pre-scan-skip it (0 tokens, "no instrumentable functions"). Either the dep-graph reordering changed how the file is evaluated, or a pre-scan logic change between SHA `d13f1a1` (run-13) and `69c76e1` (run-15) caused the regression. **Note for run-16**: verify whether cli.ts is still present and has async exported functions; if so, this is a pre-scan regression to file.

### CDQ-006 status (primary run goal)

CDQ-006 is **confirmed still present** in `io/pnpmWorkspaces.ts`: agent passed `Object.keys(versions).length` directly to `setAttribute()` twice without an isRecording guard, explicitly citing NDS-003 (code preservation) as justification for bypassing the guard. The #933 fix resolved the crash but not the underlying CDQ-006 violation in this file. Whether the IS scoring validator detects this as a CDQ-006 finding is the key question for rubric scoring.

### Dep-graph ordering changed

Files appear in a different order than run-13 (e.g., `api/check.ts` moved from position 3 to position 20; `commands/check/render.ts` appeared as a new file not present in run-13's 33-file list). Both runs processed exactly 33 files. The new file may have been added to taze between runs, or was always present but missed by the prior dep-graph traversal.

---

## Process Notes for Run 16

*Populated after rubric scoring, IS scoring, and per-file evaluation complete.*
