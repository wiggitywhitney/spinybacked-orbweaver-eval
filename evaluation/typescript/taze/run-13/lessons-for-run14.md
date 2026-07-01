# Lessons for Run 14

Run-13 was a perfect run (33/33, 0 failures). Run-14 would be a Type D eval run starting from the committed state.

---

## Pre-Run State for Run-13

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb build | ✅ | SHA: `d13f1a168f49350e0dab67380022442cb1d99c47` |
| SCH-001 advisory mode | ✅ | Judge-detected duplicates are advisory, not blocking |
| NDS-003 regex literal fix | ✅ | Regex corruption patterns now caught |
| taze started from clean main | ✅ | |
| testCommand | ✅ | `pnpm test` — no exclusions |

---

## Run-13 Observations

- 33/33 files processed, 14 committed, 19 correct skips, 0 failures, 0 rollbacks
- First perfect run
- Checkpoint test suite passed — no live-registry timeout this run

---

## Analysis Phase Findings (Surfaced During Per-File Evaluation)

**CDQ-001 advisory — cli.ts `process.exit()` bypass**: `src/cli.ts` calls `process.exit(exitCode)` inside the span's try block on the normal success path, bypassing the `finally { span.end() }` block. The span is never closed after a successful taze run. Passes static CDQ-001 check (span.end() is structurally in finally) but is a real runtime leak. Fix options: (a) call `span.end()` explicitly before `process.exit(exitCode)`, or (b) return `exitCode` from the span callback and call `process.exit()` outside. The same pattern was flagged by CodeRabbit in run-5 debug dumps — the agent has reproduced it consistently. Consider adding a spiny-orb prompt note for CLI tools that call `process.exit()` in the success path.

**CDQ-006 pattern — 5 of 14 files**: Inline `reduce()`, `filter()`, and `Object.keys()` inside `span.setAttribute()` without `span.isRecording()` guards. `src/io/pnpmWorkspaces.ts` correctly applies the guard — use it as the reference pattern. Files affected: `checkGlobal.ts`, `commands/check/index.ts`, `io/resolves.ts`, `io/bunWorkspaces.ts`, `io/yarnWorkspaces.ts`.

**SCH-003 schema documentation errors**: `taze.config.sources_found`, `taze.cache.hit`, and `taze.cache.changed` are declared as `type: string` in `agent-extensions.yaml` but the agent used int/boolean values. The code semantics are correct; the schema documentation is wrong. Update agent-extensions.yaml: change `taze.config.sources_found` to `type: int`, `taze.cache.hit` to `type: boolean`, `taze.cache.changed` to `type: boolean`.

## Notes for Run-14 (Type D)

Run-14 would be the first Type D eval run, analyzing the committed instrumentation from run-13. The PRD has specific analysis milestones to complete before drafting the Type D PRD.

Type D run pre-run checklist gate: confirm `checkSyntax()` in spiny-orb reads the project's `tsconfig.json` moduleResolution (not hardcoded NodeNext) — this fix was required for run-4 but should be re-verified.
