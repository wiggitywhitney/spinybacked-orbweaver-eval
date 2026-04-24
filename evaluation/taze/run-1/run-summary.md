# Run Summary — taze Run-1

**Date**: 2026-04-24
**Started**: 2026-04-24T15:26:02.254Z
**Completed**: 2026-04-24T15:34:15Z (approx)
**Duration**: 8m 13.5s
**Branch**: none — run aborted before any files committed; no PR created
**Spiny-orb build**: feature/prd-372-typescript-provider (b0a818b)
**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze)
**PR**: none

---

## Results

| Metric | Value |
|--------|-------|
| Files discovered | 33 |
| Files processed | 3 of 33 — **run aborted early** |
| Committed | 0 |
| Partial | 0 |
| Failed | 3 |
| Correct skips | 0 |
| Total tokens (input) | 11.6K |
| Total tokens (output) | 20.9K |
| Cached tokens | 93.2K |
| Estimated cost | ~$0.40 |
| Live-check | DEGRADED (no spans emitted) |
| Push/PR | NO |

---

## Early Abort

The run stopped after file 3 of 33. All 3 processed files failed consecutively with NDS-001. Spiny-orb's consecutive-failure abort threshold triggered before the remaining 30 files were reached.

---

## Failed Files (3 of 3 processed)

| File | Root cause | Notes |
|------|-----------|-------|
| src/addons/index.ts | NDS-001 — no functions to instrument | Module-level re-export only; agent correctly reasoned no instrumentation needed but still cycled through 3 attempts |
| src/addons/vscode.ts | NDS-001 — no instrumentable functions | Only function is a pure synchronous void method; `startActiveSpan()` callback return type incompatible with void |
| src/api/check.ts | NDS-001 — TypeScript type error | Agent produced schema reasoning and attribute annotations, but TypeScript compilation failed due to optional property access on `CheckOptions` type |

---

## Schema Proposals Surfaced (file 3)

Despite failing, `src/api/check.ts` produced meaningful schema reasoning before aborting:

- **Proposed span**: `span.taze.check.packages` (not in registry — reported as schema extension)
- **Attributes set**: `taze.check.packages_total`, `taze.check.packages_outdated`, `taze.check.write_mode`
- **Omitted**: `taze.check.mode`, `taze.check.recursive` — agent correctly declined to access properties it could not confirm existed on `CheckOptions` at the file level

---

## Key Findings

### P1 — NDS-001 blocks all TypeScript output

All 3 files failed with TypeScript compilation errors (NDS-001). Two root causes:

1. **No-function files incorrectly routed through agent loop**: Files with nothing to instrument (re-exports, pure sync utilities) should be detected pre-agent and skipped cleanly. Instead they cycle through 3 attempts before failing. This is the "expected failures" design problem noted during the run.

2. **TypeScript type compatibility with `startActiveSpan()`**: For files that do have instrumentable code, the TypeScript compiler rejects the generated code when `startActiveSpan()` wraps a void synchronous method (return type incompatibility). This is a TypeScript-specific issue not present in the JavaScript provider.

### P1 — Early abort at 3 consecutive failures

The consecutive-failure abort threshold stopped the run at file 3/33. 30 files were never processed. Whether the abort threshold is appropriate or should be configurable/higher is worth evaluating — first TypeScript runs will inherently have early consecutive failures as the provider learns the type system.

### P2 — No PR created

With 0 committed files, no branch was pushed to the fork and no PR was created. The live-check ran against uninstrumented code (DEGRADED).

---

## Comparison to JS Run-13 (cross-language context)

| Metric | taze Run-1 (TS) | commit-story-v2 Run-13 (JS) |
|--------|----------------|------------------------------|
| Files processed | 3 / 33 | 30 / 30 |
| Committed | 0 (0%) | 7 (23%) |
| Failed | 3 (100%) | 11 (37%) |
| Correct skips | 0 | 11 (37%) |
| Duration | 8m 13.5s | 1h 5m 41s |
| Push/PR | NO | YES |

Run-1 is not a usable TypeScript baseline — NDS-001 and the early abort prevent meaningful rubric scoring. The signal value is the failure mode inventory, not the quality scores.

---

## Next Steps

- File spiny-orb findings: pre-agent no-function detection, TypeScript void/startActiveSpan compatibility, configurable consecutive-failure threshold
- Re-run (Run-2) after spiny-orb team addresses NDS-001 TypeScript root causes
