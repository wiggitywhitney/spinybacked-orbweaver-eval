# Lessons for PRD #17

Observations collected during run-16 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

**RUN15-1 fix status — CONFIRMED LANDED:**
`e2582c3 prompt: COV-003 outer catch guidance + CDQ-006 pattern expansion (#728)` is on spiny-orb main, merged via PR #749 (closed issue #728). The fix adds prompt guidance: NDS-007 (graceful-degradation inner catches) does NOT exempt the outer `startActiveSpan` wrapper from needing its own error-recording catch for unexpected exceptions. Also expands CDQ-006 guarded-computation patterns to include `.filter`, `.join`, `.flatMap`, `Object.keys()`, and adds a concrete `isRecording()` guard code example.

**Other spiny-orb changes since run-15** (built from `fix/724-attribute-namespace` SHA `1b6c3d9`):
- **Dependency-aware file instrumentation ordering (PRD #700)**: leaves-first ordering via ts-morph dep graph. May change which files succeed/fail in run-16 since dependencies are instrumented before dependents.
- **Prettier-normalized NDS-003 comparison (PRD #820)** + NDS-003 reconciler improvements (issues #839, #841, #842): reduces NDS-003 false positives — could improve committed file count.
- **Weaver live-check integration (PRD #698)**: validates schema against real-time OTLP telemetry during the run. New behavior — watch for live-check failures surfacing in run-16 output.
- **Human-facing advisory output (PRD #509)**: advisory messages now include human-readable descriptions. May change advisory section format in the PR.
- **Namespace rejection feedback (#722)**: wrong-namespace extensions now trigger a fix loop.
- **Function-level fallback fixes (#841, #842)**: additional NDS-003 reconciler coverage.

These are substantial changes since run-15. Run-16 results may differ more than usual from run-15.

**RUN15-3 push detection bug**: No specific fix found on spiny-orb main. Still present. If spiny-orb reports "Push failed" during run-16, check whether the instrument branch exists on the remote before concluding the push actually failed.

**spiny-orb version**: 1.0.0 (SHA `dc5a2aa`, main branch; latest code commit `4fa5afc` Merge PR #842)
**Node version**: v25.8.0
**commit-story-v2**: on `main`, clean working tree (untracked journal files only)
**Files in src/**: 30 JS files (same as runs 12–15)
**Push auth**: CONFIRMED — dry-run to `spiny-orb/auth-test-run16` succeeded

## Run-Level Observations

**Live-check JSON blob dumped to terminal (RUN16-2, new — P2)**: At end of run, spiny-orb printed the entire live-check compliance report JSON to terminal stdout. The report was thousands of lines of raw JSON (543 spans × multiple advisory findings each = 3,615 advisories). This is a bad user experience — the user's terminal was flooded with machine-readable JSON that is not intended for direct reading. The report should be written to disk only (it is saved to `spiny-orb-live-check-report.json` on disk), not echoed to stdout. Filed for spiny-orb team.

**null parsed_output failures (RUN16-1, new — P1)**: Three full file failures (context-capture-tool.js, reflection-tool.js, src/index.js) and two function-level failures within summary-manager.js all failed with "null parsed_output." At least two attempts show `stop_reason: max_tokens` with 16,384 output tokens — the LLM response exceeded the structured output token limit and the parser received incomplete/malformed JSON. This is a new failure mode not present in runs 9-15. Possible causes: (1) more complex output format from PRD #509 human-facing advisory additions, (2) larger file sizes triggering longer responses. Watch in run-17.

**journal-graph.js 3 attempts**: The 1-attempt result from run-15 did NOT hold — back to 3 attempts with technicalNode skipped (NDS-003 oscillation: error count 1→5 on fresh regeneration at lines 29, 30, 54, 57, 31). Root cause of run-15's single-attempt success remains unknown; not a confirmed fix.

**summary-detector.js COV-003: FIXED**: Both getDaysWithEntries and getDaysWithDailySummaries committed with outer error-recording catch blocks, consistent with the findUnsummarized* functions. Primary goal of run-16 confirmed met.

## Evaluation Process Observations

<!-- Populated during structured evaluation -->
