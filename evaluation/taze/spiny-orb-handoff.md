# Spiny-orb Handoff — taze TypeScript Eval (Runs 1–4)

**Last updated**: 2026-04-28
**Eval target**: wiggitywhitney/taze (fork of antfu-collective/taze)
**Runs attempted**: 4 (all aborted at 3/33 files)
**Files committed**: 0
**PRs created**: 0

---

## Finding the Diagnostic Artifacts

All five diagnostic dimensions are available for every run in this eval repo (`wiggitywhitney/spinybacked-orbweaver-eval`, branch `feature/prd-50-typescript-eval-setup`):

| Dimension | What it contains | Where to find it |
|-----------|-----------------|------------------|
| 1 — Run history | CI acceptance gate results | `gh run list --workflow=acceptance-gate.yml` on `wiggitywhitney/taze` |
| 2 — Instrumented code | Exact code the agent produced for each file | `evaluation/taze/run-N/debug/` (mirrors `src/` structure) |
| 3 — Validator messages | Full tsc error text, NDS-005 block previews | `evaluation/taze/run-N/spiny-orb-output.log` (requires `--verbose` in instrument command) |
| 4 — Agent notes | Agent's reasoning per file | `evaluation/taze/run-N/spiny-orb-output.log` (requires `--verbose`) |
| 5 — Agent thinking | `thinkingBlocksByAttempt` | ❌ Not yet available in CLI mode — feature request in "What's Needed" below |

Replace `run-N` with the run number (e.g., `run-4`). The `debug/` directory is only present when `--debug-dump-dir` was passed to the instrument command — all runs from run-3 onward include it.

---

## TL;DR

Four runs, all aborted at file 3/33 with NDS-001. Each run has surfaced a new validator environment issue rather than an instrumentation quality problem. The agent's reasoning and code generation are working correctly — the blockers are all in `checkSyntax()`.

**Current blocker**: Two fixes needed in `checkSyntax()` before run-5:

1. Add `--ignoreConfig` to the tsc invocation (suppresses TS5112 — see below)
2. Capture `stdout` in addition to `stderr` in the error handler so failures are never silent

---

## Status of All Previous Findings

| Finding | Status |
|---------|--------|
| F1 — NDS-001 on uninstrumentable files (PRD #582 M2 early-exit) | ✅ Fixed |
| F2 — Consecutive-failure abort threshold | ✅ Moot — see F1 |
| F3 — `error as Error` cast fails strict tsc | ✅ Fixed |
| F4 — Checkpoint test failures / `testCommand: pnpm test` | ✅ Mitigated |
| F5 — `language:` field required in spiny-orb.yaml | ✅ Resolved |
| F6 — NodeNext vs Bundler moduleResolution mismatch (run-3) | ✅ Fixed — `checkSyntax()` now reads tsconfig `module`/`moduleResolution` |

---

## New Finding A — TS5112: `--ignoreConfig` required (P1, run-4)

**Blocks all evaluation. Affects all TypeScript projects with a tsconfig.json.**

Newer versions of TypeScript (the version bundled in taze's `node_modules`) now emit **TS5112** when files are specified on the CLI and a `tsconfig.json` exists in the project:

```text
error TS5112: tsconfig.json is present but will not be loaded if files are specified on commandline. Use '--ignoreConfig' to skip this error.
```

This is a new enforcement of existing behavior — tsc has always ignored tsconfig when individual files are passed on the CLI. Newer tsc now errors instead of silently proceeding.

**Required fix**: Add `--ignoreConfig` to the `execFileSync` args array in `checkSyntax()`:

```typescript
execFileSync(tsc, [
  '--noEmit',
  '--strict',
  '--skipLibCheck',
  '--allowImportingTsExtensions',
  '--ignoreConfig',            // ← add this
  '--module', moduleFlag,
  '--moduleResolution', moduleResolutionFlag,
  '--target', 'ES2022',
  '--jsx', 'preserve',
  filePath,
], ...)
```

**Repro**: Run the tsc binary from taze's `node_modules/.bin/tsc` with any file + explicit flags against a project that has a `tsconfig.json`. TS5112 fires immediately.

---

## New Finding B — NDS-001 failures are silent (P1, run-4)

**The actual tsc error text is not surfaced in the NDS-001 message.**

The error message in runs 1–4 reads:
```text
NDS-001 check failed: tsc --noEmit returned a non-zero exit code.  Fix the TypeScript error...
```
(Note the double space — `${stderr.trim()}` is empty.)

**Root cause**: `checkSyntax()` only captures `error.stderr`, but TS5112 (and potentially other tsc diagnostics) writes to **stdout**, not stderr. The error handler in `checkSyntax()` needs to capture both:

```typescript
// current — misses stdout
const stderr = error?.stderr instanceof Buffer ? error.stderr.toString() : ...

// fix — capture both
const stdout = error?.stdout instanceof Buffer ? error.stdout.toString() : '';
const stderr = error?.stderr instanceof Buffer ? error.stderr.toString() : ...
const combined = [stdout, stderr].filter(Boolean).join('\n');
// use combined in the message
```

Without this fix, any tsc error that writes to stdout is invisible in the NDS-001 output. We only discovered TS5112 by reproducing the tsc invocation manually.

---

## Instrumentation Quality (consistent across all runs)

Despite four aborts, `src/api/check.ts` has produced quality instrumentation every time:

- `CheckPackages` correctly wrapped in `tracer.startActiveSpan('taze.check', ...)`
- `CheckSingleProject` (unexported) correctly skipped per RST-004
- `options.*` fields guarded with optional chaining / null checks
- Schema extension `span.taze.check` correctly identified and reported
- Debug dump: `evaluation/taze/run-4/debug/src/api/check.ts`

The agent is ready. The validator environment is not.

---

## What's Needed for Run-5

**Fixes in `src/languages/typescript/validation.ts` `checkSyntax()`:**

1. **Add `--ignoreConfig`** to the tsc args array
2. **Capture stdout** alongside stderr in the error handler

**Feature request — agent thinking in CLI mode:**

Agent thinking (`thinkingBlocksByAttempt`) is currently only available via the test harness. The eval team needs it available during CLI `instrument` runs (via `--verbose` or a dedicated flag) to diagnose agent reasoning on real targets. Without it, dimension 5 is a blind spot for every eval run.

After merging: rebuild spiny-orb and update the SHA in the pre-run verification table.
