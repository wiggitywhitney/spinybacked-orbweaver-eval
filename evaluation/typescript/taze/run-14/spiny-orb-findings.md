# spiny-orb Findings — taze Run 14

**Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md`

---

## Blocking Issues

### BUG: Run terminated after 5/33 files — 28 files never processed

Run-14 processed only 5 of 33 files and exited with "Run complete." The remaining 28 files were never started. A PR was created with only 1 committed file.

The run aborted after file 4 (`checkGlobal.ts`) crashed with a `ts-morph` tree manipulation error. File 5 (`index.ts`) succeeded, and then the run exited. This did not happen in run-13 (all 33 files processed, 0 failures), suggesting the bug is related to something introduced between run-13 (spiny-orb SHA `d13f1a1`) and run-14 (SHA `8649c86`).

One candidate cause: the dep-graph cycle removal (60+ edges removed, printed as `[dep-graph] cycle detected`) may have produced a processing queue of only 5 files rather than 33. In run-13, all 33 files were processed without this symptom. The dep-graph behavior may have changed between the two spiny-orb versions.

**Impact**: The run is effectively invalid — 85% of files were never evaluated.

**Suggested investigation**: Compare dep-graph output for taze between SHA `d13f1a1` and `8649c86`. Check whether the processing queue length is logged anywhere; if 5 files were scheduled instead of 33, the cycle removal is the root cause.

### BUG: CDQ-006 isRecording guard produced syntactically invalid code (ts-morph crash)

File 4 (`checkGlobal.ts`) crashed with:
```text
Manipulation error: Error replacing tree: The children of the old and new trees were expected to have the same count (8:7).
```

The text fragment in the error shows what the agent produced:
```typescript
if (span.isRecording())

return pkgMetas
```

The agent wrote a bare `if (span.isRecording())` with no block body `{}`, leaving `return pkgMetas` as a dangling statement. ts-morph's AST replacement requires matching child counts; this malformed guard produced a mismatch (8 vs 7 children).

This is a CDQ-006 isRecording guard generation bug — the prompt or the agent's code-writing logic for the new `#728` advisory pass is producing guards without required block bodies in at least some cases.

**Impact**: Any file where the CDQ-006 fix requires wrapping a standalone statement in an isRecording guard is vulnerable to this crash.

**Suggested fix**: The isRecording guard template must always produce a block-body `if`: `if (span.isRecording()) { <statement> }`, never a bare `if`.

---

## Observations (Non-Blocking)

### Latent Risk: dep-graph path normalization mismatch may silently shorten the processing queue

The dep-graph builder compares file paths from two sources: ts-morph's `sf.getFilePath()` and the discovery layer's `path.join()`. If these produce different path formats for the same file (e.g., different path separators, trailing slashes, or symlink resolution), `cycleEdges` can be `undefined` for a file that should be in the dependency graph, and the code breaks out of the loop early — silently producing a shorter-than-expected queue.

Run-14 was not caused by this: the cost ceiling correctly showed 33 files, confirming the topoSort returned the full queue. But the risk is latent. If path normalization diverges in a future environment or after an OS/Node upgrade, the queue could be silently truncated without any error message.

**Suggested fix**: Add an assertion or warning when `cycleEdges === undefined` for a file that appears in the discovered file list, so the failure is visible rather than silent.

**No spiny-orb issue filed** — spiny-orb team identified this as a latent risk alongside the confirmed root causes. Worth mentioning in the run-14 handoff but not a blocker for run-15.

### UX: Run baseline tests before the cost ceiling prompt — fail fast on pre-existing failures

spiny-orb currently detects pre-existing test failures after the user confirms the cost ceiling, then silently disables rollback and proceeds anyway. The run spends time and money, then fails at the end with confusing warnings.

The correct behavior: run the test suite **before** showing the cost ceiling prompt. If tests are already failing, exit immediately with a clear message:

> "Pre-existing test failures detected. Your test suite must be clean before spiny-orb can instrument reliably — we can't distinguish new failures from existing ones. Fix the failing tests and retry."

This saves the user the entire cost and duration of a run that cannot succeed. The current flow (detect → disable rollback → proceed → fail late) is the worst of all worlds.

**Context**: In run-14, `test/resolves.test.ts > resolveDependency > provenanceDowngraded` was already failing before any instrumentation — the npm provenance API changed its response type from the string `"trustedPublisher"` to the boolean `true` between run-13 (2026-05-03) and run-14 (2026-06-14). spiny-orb detected this, disabled rollback, proceeded anyway, and the run stopped after 5/33 files.

### UX: `[dep-graph] cycle detected` messages are noisy and confusing to end users

When spiny-orb builds its dependency graph and encounters circular imports (common in TypeScript projects), it logs every removed edge to stdout with the prefix `[dep-graph] cycle detected:`. For taze, this produced ~60 lines before the cost ceiling prompt appeared.

These messages communicate nothing actionable to end users — the cycle detection is working correctly, the edges are silently removed, and the run proceeds normally. A new user seeing 60 lines of "cycle detected" before being asked to confirm a $77 cost ceiling is a bad first impression.

**Suggested fix**: Suppress these logs at default verbosity. Gate them behind `--verbose` or `--debug`, or remove them entirely if they have no debugging value for typical spiny-orb development.
