# spiny-orb Findings — taze Run 2

Issues and observations surfaced by spiny-orb during run-2 that warrant filing as GitHub issues or PRD items.

**Schema design reference (read before scoring SCH rules)**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md` documents the 3 attributes deliberately omitted from the Weaver schema — `taze.check.concurrency`, `taze.package.diff_type`, `taze.fetch.cache_hit` — with code locations and rationale. Use this to evaluate whether spiny-orb correctly identified the gaps.

---

## P1 — Blocking

### [P1] Early-exit missing for uninstrumentable files — NDS-001 on every attempt

**Confirmed in**: run-1, run-2 (both aborted at 3/33 files)

**Symptom**: Files containing only re-exports or pure synchronous utility functions fail NDS-001 (tsc compilation error) on every attempt, triggering oscillation (3 attempts per file). The agent correctly reasons "nothing to instrument" but still generates an initial output that fails tsc. Prompt guidance (added in run-2 build) did not prevent the first-attempt tsc failure.

**Root cause**: The agent is called even for provably uninstrumentable files. On the first attempt the agent tries to add imports/spans, tsc catches a type error, and the oscillation cycle starts. The agent figures out on retries that nothing should be added, but NDS-001 already fired.

**Required fix**: PRD #582 M2 — add `hasInstrumentableFunctions: boolean` to `PreScanResult`. When `false` (no function definitions, or all functions classify as RST-001/RST-004), return a `correct skip` result without calling the LLM. Already scoped in PRD #582 with taze run-1 evidence cited.

**Affected files (taze)**: `src/addons/index.ts` (re-export only), `src/addons/vscode.ts` (one void sync method), `src/api/check.ts` (has real instrumentation candidates but `error as Error` cast fails strict tsc).

### [P1] Consecutive-failure abort threshold too aggressive — 30/33 files unprocessed

**Confirmed in**: run-1, run-2 (identical abort at file 3)

**Symptom**: 3 consecutive NDS-001 failures trigger run abort. In taze, the first 3 files alphabetically are `addons/index.ts`, `addons/vscode.ts`, `api/check.ts` — all of which happen to be uninstrumentable or near-uninstrumentable. The abort fires before any substantive files are reached.

**Required fix**: File a standalone spiny-orb issue. Options: raise default threshold, make it configurable in `spiny-orb.yaml`, or exclude "no functions to instrument" failures from the abort counter (they aren't genuine agent failures). The early-exit fix (P1 above) will prevent these files from counting as failures at all, which may make the threshold moot — evaluate after PRD #582 M2 lands.

---

## P2 — High Priority

### [P2] Checkpoint test failures from live-registry dependency

**Found in**: run-2 end-of-run test suite

**Symptom**: 3 tests fail when spiny-orb runs `npm test` as the checkpoint, even though 0 files were instrumented:
- `test/cli.test.ts` — "Timeout requesting typescript" (live npm registry)
- `test/packageConfig.test.ts` — `getPkgInfo('typescript').update` returns false (stale live data)
- `test/versions.test.ts:44` — `getMaxSatisfying` returns undefined (live registry tags)

These tests passed in pre-run manual verification (`pnpm test`, all 73 passing). Failure is flaky — depends on npm registry availability and response time.

**Contributing factor**: `spiny-orb.yaml` does not specify `testCommand`, so spiny-orb defaults to `npm test`. Taze is a pnpm project; `pnpm test` is the canonical command. Add `testCommand: pnpm test` to `spiny-orb.yaml`.

**Note**: The live-registry flakiness is a taze test design issue, not a spiny-orb issue. But spiny-orb's checkpoint mechanism should tolerate pre-existing flaky tests and not count them as instrumentation failures. Worth discussing with spiny team.

---

## P3 — Low Priority

*(fill in during failure deep-dives)*
