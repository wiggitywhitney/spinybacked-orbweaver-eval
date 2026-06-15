# spiny-orb Findings — taze Run 15

**Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md`

*Primary goals: CDQ-006 violations drop to 0 (post-#933 fix), SCH-003 resolved, IS RES-001 passes.*

---

## Blocking Issues

### io/resolves.ts — NDS-001 oscillation caused 0/9 functions instrumented (file 16 of 33)

**Regression vs run-13**: Run-13 had 6 spans, 2 attributes. Run-15 produced **unknown coverage** (tool reported SUCCESS, actual result: 0 spans, 0 attributes), 2 attempts, 82.4K output tokens.

6 of 9 functions were skipped:
- `loadCache` — Oscillation detected: Duplicate errors across consecutive attempts: NDS-001 (×1)
- `dumpCache` — same
- `getPackageData` — same
- `resolveDependency` — same
- `resolveDependencies` — same
- `resolvePackage` — same

3 functions were "instrumented" but produced 0 spans: `getVersionOfRange`, `updateTargetVersion`, `getDiff`.

The "Oscillation detected during fresh regeneration" pattern means the agent kept making the same NDS-001 error across attempts and exited rather than fixing it. NDS-001 is "No Destructive Changes" — the agent was probably trying to import a module or modify a code structure that kept violating the rule. This is a **new failure mode** not seen in run-13 or run-14 on this file. Needs debug dump analysis to understand what change the agent kept attempting.

**spiny-orb process issue — `✅ SUCCESS` is the wrong status here (log to handoff doc):**

The file reports `✅ SUCCESS — 0 spans, 0 attributes`. That label communicates "this file was assessed and found to need 0 spans." That is not what happened. The agent tried to instrument 6 functions, failed with NDS-001 both times, and gave up. The true state is **unknown coverage**, not zero coverage — those are meaningfully different.

Two sub-issues worth filing separately in the handoff:

1. **Oscillation skips are indistinguishable from intentional skips.** RST-003/RST-001 skips mean "this function genuinely doesn't need a span." Oscillation skips mean "the agent attempted and couldn't complete it." A reviewer, a rubric scorer, or a future run can't tell which case applies from the current output. Run-13 got 6 spans from this file; if those functions are the same 6 that oscillated in run-15, that coverage is simply gone with no signal.

2. **6 oscillations on the same rule in one file is systemic, not incidental.** NDS-001 on 6 consecutive functions suggests a structural pattern in the file the agent consistently can't resolve. That pattern needs to surface — not be buried in agent notes under a SUCCESS header. The escalation path that's missing: "this file has significant unresolved oscillation — status should be PARTIAL or WARNING, not SUCCESS." Oscillation is failure-to-converge, not a genuine assessment that these functions don't need spans.

---

## Observations (Non-Blocking)

### config.ts lost an attribute (file 7 of 33)

`src/config.ts` had **1 span, 1 attribute** in run-13 (`taze.config.sources_found`); run-15 shows **1 span, 0 attributes**. The attribute was a custom schema extension. Needs per-file evaluation to determine if the schema type fix (TAZE-RUN1-1 changed `sources_found` to `int`) caused the agent to drop it, or if it's an agent decision change.

---

### io/bunWorkspaces.ts span and attribute count increase (file 10 of 33)

`src/io/bunWorkspaces.ts` had **2 spans, 0 attributes** in run-13; run-15 shows **3 spans, 1 attribute**. An extra span and a new attribute appeared. Needs per-file evaluation to determine if the additions are appropriate.

---

### io/pnpmWorkspaces.ts — possible CDQ-006 violation in committed code (file 15 of 33)

Agent note from the log: *"Object.keys(versions).length is evaluated twice in writePnpmWorkspace (once for the early-return guard, once for setAttribute). This is intentional to avoid extracting a new variable that would modify non-instrumentation code (NDS-003)."*

The agent chose to pass `Object.keys(versions).length` directly to `setAttribute()` rather than extracting it to a variable, citing NDS-003 (code preservation). However this is exactly the pattern CDQ-006 flags — an inline O(n) computation passed to `setAttribute` without an `isRecording()` guard. The isRecording guard introduced by #728/#933 would have been the correct fix here. If the committed code does not have the guard, this is a CDQ-006 violation. Needs per-file evaluation against the debug dump.

---

### io/packages.ts gained a span (file 14 of 33)

`src/io/packages.ts` had **4 spans** in run-13; run-15 shows **5 spans**. Run-13 noted that `readJSON` was correctly skipped as a thin wrapper (RST-003). The extra span may mean the agent instrumented `readJSON` this time, or added a span to another previously-skipped function. Needs per-file evaluation.

---

### io/yarnWorkspaces.ts — FAILED after 3 attempts, TS syntax error (file 17 of 33)

**Regression vs run-13**: Run-13 had 2 spans, 0 attributes (2 attempts, passed). Run-15 **FAILED** after 3 attempts.

Error: `NDS-001 check failed: tsc --noEmit returned a non-zero exit code. src/io/yarnWorkspaces.ts(91,74): error TS1005: ',' expected.`

Agent thinking shows attempt 2 was fixing an NDS-003 regex regression (`/\./g` → `/\./` was accidentally introduced in attempt 1, fixed in attempt 2). Attempt 2 was also applying a CDQ-006 isRecording guard around `Object.keys(versions).length`. Attempt 3 still produced a syntax error at line 91, col 74. Needs debug dump to see what the malformed code looks like.

---

### api/check.ts — dep-graph reordered, +1 span vs run-13 (file 20 of 33)

`src/api/check.ts` was file 3 in run-13 (1 span, 0 attrs). In run-15 it appeared as file 20 — dep-graph ordering changed. Run-15 result: **2 spans, 0 attrs, 2 attempts** (+1 span vs run-13). Needs per-file evaluation to determine if the extra span is appropriate.

---

### src/commands/check/render.ts — new file not present in run-13 (file 31 of 33)

`src/commands/check/render.ts` was not in run-13's 33-file list at all. It appeared as file 31 in run-15 (0 spans, 0 attrs — pre-scan skip). Either this file was added to the taze codebase between run-13 and run-15, or the dep-graph picked it up differently. Both runs processed 33 files total, so if this is new, a different file must have disappeared from the list. Worth checking against the taze fork's git log.

---

### checkGlobal.ts span count increase (file 4 of 33)

`src/commands/check/checkGlobal.ts` produced **4 spans** in run-15 vs **1 span** in run-13. Required 2 attempts. The #933 crash is gone (primary fix verified ✅). The extra spans likely reflect the agent now adding isRecording-guarded child spans that run-13's agent skipped — possibly because the CDQ-006 advisory pass (from #728) prompted additional instrumentation. Or the 2-attempt retry produced a different result. Needs per-file evaluation to determine if the additional spans are appropriate or over-instrumented.

---

### cli.ts pre-scan regression (observed during run, file 3 of 33)

`src/cli.ts` was committed with **2 spans** in run-13 but pre-scan-skipped (0 tokens, 0 spans) in both run-14 and run-15. The pre-scan note reads: "no instrumentable functions — all are pure sync utilities or unexported helpers."

Run-13 committed `taze.cli.run` wrapping the CLI entry point action handler. If the pre-scan is now correctly identifying cli.ts as non-instrumentable, run-13 may have been a false positive. If not, this is a regression in pre-scan logic or dep-graph ordering that caused the file to be evaluated differently.

**To investigate**: Compare the committed cli.ts diff from run-13 (PR #8) against the current source. Check whether the exported action handler that was instrumented in run-13 is still present and async. Check spiny-orb changelog for any pre-scan logic changes between SHA `d13f1a1` (run-13) and `69c76e1` (run-15).
