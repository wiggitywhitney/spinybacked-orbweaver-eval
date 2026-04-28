# spiny-orb Findings — taze Run 1

Issues and observations surfaced by spiny-orb during run-1 that warrant filing as GitHub issues or PRD items.

**Schema design reference (read before scoring SCH rules)**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md` documents the 3 attributes deliberately omitted from the Weaver schema — `taze.check.concurrency`, `taze.package.diff_type`, `taze.fetch.cache_hit` — with code locations and rationale. Use this to evaluate whether spiny-orb correctly identified the gaps.

---

## P1 — Blocking

### [RUN-BLOCKER] TypeScript provider not wired into file discovery

**Symptom**: `instrument src` on a TypeScript repo exits immediately with "File discovery failed: No JavaScript files found in .../taze/src."

**Root cause**: `coordinate()` calls `discoverFiles()` without passing a `provider` — so discovery defaults to `JavaScriptProvider`, which globs for `*.js` only. The `TypeScriptProvider` is registered in the language registry but the coordinator never looks it up. Same gap in `dispatchFiles()`.

**Repro**: Run `spiny-orb instrument src` from any TypeScript repo on the `feature/prd-372-typescript-provider` branch at SHA `b0a818b`.

**Fix owner**: spiny-orb team (PRD-372 branch). Needs either a `language:` field in `AgentConfigSchema` + `spiny-orb.yaml`, CLI `--language` flag, or auto-detection by file-extension scan before discovery. Fix must thread the selected provider into both `discoverFiles()` and `dispatchFiles()`.

**Resolution**: Add `language: typescript` to `spiny-orb.yaml`. Also add `targetType: short-lived` (correct for a CLI tool). Applied to `~/Documents/Repositories/taze/spiny-orb.yaml` on 2026-04-24. Run-1 unblocked.

### [P1] NDS-001 on all 3 processed files — TypeScript type compatibility

**Symptom**: Every file attempted fails NDS-001 (Syntax Valid). Run aborted after 3 consecutive failures; 30 of 33 files were never reached.

**Two root causes**:

1. **No-function files routed through agent loop**: `src/addons/index.ts` (re-export only) and `src/addons/vscode.ts` (one pure synchronous void method) contain nothing to instrument. Both cycled through 3 attempts each before failing NDS-001. The TypeScript provider has no pre-agent guard to detect uninstrumentable files and skip them cleanly. (See also P2 below.)

2. **`startActiveSpan()` return type incompatibility with void synchronous methods**: For `src/addons/vscode.ts`, the agent correctly identified no instrumentation was warranted (RST-001) but the previous attempts failed because wrapping a `void`-return synchronous method with `tracer.startActiveSpan()` produces a TypeScript compilation error — the callback's inferred return type is incompatible with `void`. The TypeScript provider needs to detect void sync methods and avoid `startActiveSpan()` wrapping, or use a different instrumentation pattern.

3. **Optional property access on `CheckOptions`**: `src/api/check.ts` had substantive schema reasoning but failed because the agent accessed `CheckOptions.mode` and `CheckOptions.recursive` without being able to confirm from the file alone that those properties exist on the type. TypeScript's strict property access caused NDS-001. The agent correctly noted this and omitted the attributes — but still failed. The fix is either injecting type context into the agent or having the agent default to optional chaining (`options.mode?`) for cross-file type lookups.

**Fix owner**: spiny-orb team (TypeScript provider, PRD-372 branch).

### [P1] Early abort after 3 consecutive failures — 30/33 files unprocessed

**Symptom**: Run stopped at file 3 of 33 after 3 consecutive NDS-001 failures. The remaining 30 files were never attempted.

**Root cause**: Consecutive-failure abort threshold (likely hard-coded at 3). For first-time TypeScript runs, this threshold is too aggressive — the first few files may happen to be uninstrumentable (re-exports, pure utilities) without indicating a systemic problem.

**Suggestion**: Make the consecutive-failure threshold configurable in `spiny-orb.yaml`, or raise the default for new language providers. Alternatively, distinguish "structurally uninstrumentable" files (no functions) from genuine agent failures when counting toward the abort threshold.

**Fix owner**: spiny-orb team.

---

## P2 — High Priority

### [P2] Pre-agent no-function detection missing in TypeScript provider

**Symptom**: Files with no functions (re-exports, module-only files) cycle through 3 agent attempts before failing NDS-001, spending tokens and generating confusing failure labels. Whitney noted during the run: "I don't think it is good design to have expected failures."

**Suggested fix**: The TypeScript provider's `findFunctions()` result should be checked before invoking the agent. If zero instrumentable functions are found, emit a "correct skip" (or a new "no-op skip") rather than routing through the agent loop. This parallels how existing correct-skip logic works for already-instrumented files.

**Fix owner**: spiny-orb team.

---

## P3 — Low Priority

*(fill in during failure deep-dives)*
