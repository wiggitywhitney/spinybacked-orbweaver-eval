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

**Root cause analysis (deep-dive):**

The instrumentation.md validation journey shows:
1. Attempt 1 (whole-file): **NDS-005** (Control Flow Preserved) — the agent restructured control flow
2. Attempt 2 (whole-file): **NDS-003** (Code Preserved) — the agent modified non-instrumentation code
3. Attempt 3: function-level fallback for all 9 functions

In function-level mode, each of the 6 async module-state functions (`loadCache`, `dumpCache`, `getPackageData`, `resolveDependency`, `resolveDependencies`, `resolvePackage`) was tried twice and produced the same NDS-001 (tsc syntax/type error) each time. The 3 utility functions (`getVersionOfRange`, `updateTargetVersion`, `getDiff`) were assessed as needing 0 spans — not oscillating, just correctly skipped.

The 6 oscillating functions all deal with the module-level `let cache` variable and mutable state. Hypothesis: attempting `startActiveSpan` wrappers around these functions — especially with CDQ-006 `isRecording()` guard additions — produced TypeScript type errors that the agent couldn't resolve in 2 function-level attempts per function. The exact tsc error is **not logged** — the verbose output only shows the oscillation message, not the tsc diagnostic.

**Diagnostic gap to report in handoff:** Function-level oscillation errors are not logged with the specific tsc message. A remote reviewer cannot determine which TypeScript rule was violated without re-running with a modified version of the agent. This makes these failures effectively undiagnosable from artifacts alone.

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

**Root cause analysis (deep-dive — debug dump `debug-dumps/src/io/yarnWorkspaces.ts`):**

Line 91 in the debug dump reads:
```ts
const paths = pkg.name.replace('yarn-workspace:', '').split(/\./ g)
```

The original source has `/\./g` (correct). All three agent attempts produced `/\./ g` — a spurious space between the regex closing delimiter and the `g` flag. TypeScript sees `/ g` as a separate expression, producing `error TS1005: ',' expected` at (91,74).

Agent thinking trace:
- **Attempt 1**: agent correctly wrote `/\./g`, but changed NDS-003-violating code (renamed the regex from `/\./g` to `/\./` in a different part — triggering NDS-003)
- **Attempt 2**: agent identified "the blocking failure is NDS-003 at line 68 where I changed `/\./g` to `/\./`. I need to restore the exact original regex `/\./g`." It verbally described the fix correctly, and was simultaneously adding a CDQ-006 `isRecording()` guard around `Object.keys(versions).length`. Despite correct intent, the output produced `/\./ g` with the spurious space.
- **Attempt 3**: agent re-analyzed the file from scratch. Produced `/\./ g` again.

**Character-level generation error**: The model consistently described `/\./g` correctly in thinking but encoded `/\./ g` in output. The simultaneous CDQ-006 guard work (multi-edit attempt) may have introduced the character-level error. This is not a logic failure — the agent understood what to write but generated a malformed regex on every attempt.

**CDQ-006 interaction**: The agent was applying a `if (span.isRecording())` guard around `Object.keys(versions).length` in `writeYarnWorkspace` while also restoring the regex. The multi-edit complexity likely contributed to the consistent generation error across all three attempts.

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

### cli.ts pre-scan change — NOT a regression (file 3 of 33)

`src/cli.ts` was committed with **2 spans** in run-13 but pre-scan-skipped (0 tokens, 0 spans) in both run-14 and run-15. The pre-scan note reads: "no instrumentable functions — all are pure sync utilities or unexported helpers."

**Root cause analysis (deep-dive — source inspection + git history):**

The current `cli.ts` source (unchanged between run-13 and run-15) contains **no named exported async functions**. The file's only async code is an anonymous arrow function passed inline to `.action(async (mode, options) => {...})` in a method chain. There is no `export async function` that the pre-scan's COV-001 criteria would target.

Git log on the taze fork confirms run-13 committed `src/cli.ts` (commits `cca032a` and `a429341`). The source at that point was identical to today's source — the file content has not changed.

**Verdict: Run-15 pre-scan is CORRECT. Run-13 was a false positive.**

Run-13 instrumented the anonymous action handler passed to `.action()`, wrapping it with `startActiveSpan`. Per COV-001, the target is exported async functions — an anonymous inline callback registered via a method chain is not an exported function. The pre-scan in run-15 (and run-14) correctly rejects this file.

This is a pre-scan improvement that landed between run-13 (`d13f1a1`) and run-15 (`69c76e1`). The lost 2 spans from run-13 are not a coverage regression — they were incorrect instrumentation.

**Design question for handoff**: Is instrumenting anonymous action handlers ever appropriate? The current rule (no) is correct for typical cases, but CLI entry points are a borderline case worth documenting in the design spec.

**Rubric impact**: COV-001 score should NOT penalize run-15 for missing these spans. The run-13 spans were false positives. This finding should be noted in the per-file evaluation for cli.ts.
