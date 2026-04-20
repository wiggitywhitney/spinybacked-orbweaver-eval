# spiny-orb Findings — release-it Run 1

Issues and observations surfaced by spiny-orb during run-1 that warrant filing as GitHub issues or PRD items.

---

## P1 — Blocking

### Support custom test command in spiny-orb.yaml

**Run-1 observation**: spiny-orb's checkpoint mechanism and baseline detection run `npm test` directly. Some target repos require environment overrides to pass their test suite. release-it requires `GIT_CONFIG_GLOBAL=/tmp/release-it-test.gitconfig npm test` because Whitney's global git config has `tag.gpgsign=true`, which causes tag-creation tests to fail. spiny-orb has no mechanism to accept a custom test command through configuration.

**Impact**: Run halted at file 5/23. All 18 plugin files (the most instrumentable part of the codebase) were never processed. Run-1 produced no rubric-relevant results.

**Request**: Add a `testCommand` field to spiny-orb.yaml that overrides the default `npm test`. Example:
```yaml
testCommand: "GIT_CONFIG_GLOBAL=/tmp/release-it-test.gitconfig npm test"
```
If this is not feasible, document that evaluators must temporarily modify their global git config before running `spiny-orb instrument` on targets with this class of issue.

**Workaround for run-2**: Temporarily remove `tag.gpgsign = true` from `~/.gitconfig` for the duration of the run, or pass `GIT_CONFIG_GLOBAL` in the instrument command prefix.

## P2 — High Priority

### Always surface lint error text in failure output

**Run-1 observation**: When LINT oscillation occurs, the verbose output and PR summary both report `LINT (×1)` without including the actual lint error message or rule name. There is no way to know from the run output what the lint error was — you have to manually inspect the generated instrumentation file.

**Request**: Include the full lint error output (linter message, rule name, file path, line number) in the verbose per-file output and in the PR summary warnings section — unconditionally, not only in a debug mode. This information is always useful and never noise when a file fails.

**Why**: LINT oscillation means the agent generated code with a persistent lint error it could not fix. To file a targeted bug report, identify whether the error is agent reasoning or ESLint config, or write a run-2 fix note, the evaluator needs to see the actual error. The current output obscures it.

**Confirmed in run-1 deep-dives**: The lint checker uses Prettier's boolean `check()` API, which returns pass/fail but not a diff. To surface the specific violation, spiny-orb would need to run `prettier --write` on a temp copy and produce a unified diff of what changed. The fix loop message "Run Prettier on the output to match the project's formatting configuration" gives the agent no actionable information — it regenerates the same code each time, producing identical oscillation.

### Include test failure output when checkpoint or end-of-run tests fail

**Run-1 observation**: When the checkpoint test halted the run at file 5/23, the output showed `Checkpoint test run failed at file 5/23 (lib/log.js): tests failed` and `End-of-run test suite failed: Command failed: sh -c npm test` — but no test output. The user cannot tell from this whether instrumentation broke something or whether there is a pre-existing infrastructure issue unrelated to instrumentation.

**Request**: When a checkpoint or end-of-run test run fails, capture and surface the test runner's stdout/stderr output (or at least the first 50 lines) in the verbose output and the PR summary warnings. This is the minimum context needed to distinguish "instrumentation bug" from "test environment problem."

**Why this matters**: In run-1, the failure was a `tag.gpgsign` infrastructure issue — nothing to do with the instrumentation. But the output gave no signal to distinguish it from a real test breakage. A user seeing the actual ava output would immediately recognize the gpgsign error and know to address the environment, not the code.

## P3 — Low Priority

### Audit debuggability of all check failure messages in console output

**Run-1 observation**: An audit of the run-1 console log found multiple warnings and failure messages that surface to the user without enough context to act on them. Two were filed as P2 above (LINT failure, checkpoint test failure). Two more were identified during a post-run audit:

- `Failed to stop Weaver gracefully via /stop endpoint: fetch failed` — "fetch failed" gives no reason (timeout? connection refused? process already gone? not applicable this run?)
- `Live-check partial: 2 file(s) failed instrumentation. Compliance report may be incomplete` — "may be incomplete" doesn't tell the user whether to trust the report, discard it, or re-run

These were found by reviewing a single run's output. There are likely more.

**Request**: The spiny-orb team should audit every check whose failure output appears in the console log and evaluate it against this question: *Can a user reading only this line understand what went wrong and what to do next — without digging further?* If not, the message needs more context. This is a one-time sweep across all checks (NDS-001, NDS-002, LINT, live-check, Weaver lifecycle, PR creation, oscillation detection, etc.).

### Weaver shutdown failure message is opaque

**Run-1 observation**: `Failed to stop Weaver gracefully via /stop endpoint: fetch failed` — "fetch failed" could mean timeout, connection refused, process already gone, or port unavailable. The user can't tell whether this is expected (Weaver never started because no files were committed) or a real problem.

**Request**: Include the underlying error reason — e.g., "connection refused (port not listening)" vs. "timeout" vs. "process already exited." If the failure is expected when no files were committed (Weaver never invoked), say so explicitly: "Weaver was not started this run — /stop not applicable."

### Live-check partial message doesn't tell the user what to do

**Run-1 observation**: `Live-check partial: 2 file(s) failed instrumentation. Compliance report may be incomplete — spans from failed files are missing.` — "may be incomplete" is ambiguous. Should the user discard the report? Proceed with caveats? Re-run?

**Request**: Make the guidance actionable. Example: "The compliance report covers only the files that were successfully processed. Results for lib/config.js and lib/index.js are absent — treat the report as partial coverage of the full codebase."
