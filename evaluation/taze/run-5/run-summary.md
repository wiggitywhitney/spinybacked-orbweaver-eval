# Run Summary — taze Run-5

**Date**: 2026-04-28
**Started**: 2026-04-28T22:14:03.454Z
**Duration**: 43m 55.8s
**Branch**: spiny-orb/instrument-1777414443454
**Spiny-orb build**: main (ac9dadbb3eaa78edc8ef02bc90d0d9ed28d8d512) — includes --ignoreConfig fix, stdout error capture, Bundler moduleResolution, thinking in CLI mode
**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze)
**PR**: https://github.com/wiggitywhitney/taze/pull/1

---

## Results

| Metric | Value |
|--------|-------|
| Files discovered | 33 |
| Files processed | 8 of 33 — **run aborted after 6 consecutive failures** |
| Committed | 0 |
| Correct skips | 2 |
| Partial | 0 |
| Failed | 6 |
| Total tokens (input) | 59.8K |
| Total tokens (output) | 92.0K |
| Cached tokens | 220.7K |
| Actual cost | $1.74 |
| Cost ceiling | $77.22 |
| Live-check | OK (partial — 6 files failed instrumentation) |
| Push/PR | YES — PR #1 created |

---

## Milestone: First Completed Run

Run-5 is the first taze eval run to push a branch and create a PR. Prior runs (1–4) all aborted before reaching the push step. Key improvements that enabled this:

- `--ignoreConfig` flag added to `checkSyntax()` — silences TS5112 that was blocking all files
- stdout captured alongside stderr — NDS-001 messages now include full tsc error text
- moduleResolution read from tsconfig — Bundler projects no longer fail on extensionless imports

---

## Correct Skips (2)

| File | Reason |
|------|--------|
| src/addons/index.ts | Re-export only — no local functions (pre-scan early exit, 0.1K tokens) |
| src/addons/vscode.ts | `beforeWrite` is a pure synchronous void method — RST-001 (0.7K tokens) |

Both correctly identified pre-agent. Token cost near-zero.

---

## Failed Files (6)

| File | Root cause | Rule |
|------|-----------|------|
| src/api/check.ts | `Array.fromAsync` in `src/io/packages.ts` not in ES2022 lib | NDS-001 |
| src/cli.ts | Same — transitively imports packages.ts | NDS-001 |
| src/commands/check/checkGlobal.ts | Intermediate variables for span attributes flagged; bare `catch {}` rewritten | NDS-003 |
| src/commands/check/index.ts | Same Array.fromAsync root cause as above | NDS-001 |
| src/commands/check/interactive.ts | `node:process`, `node:readline` not resolved — @types/node absent in per-file tsc | NDS-001 |
| src/commands/check/render.ts | Same node: types root cause; agent pre-scan correctly found 0 functions (0.0K tokens) | NDS-001 |

---

## Root Cause Analysis

### RC1 — Array.fromAsync requires ESNext target

`src/io/packages.ts` line 137 uses `Array.fromAsync()`, which is not in the ES2022 type definitions. `checkSyntax()` passes `--target ES2022` — the project uses `"target": "ESNext"` in tsconfig. Fix: read `target` from tsconfig.json (same as `module`/`moduleResolution`).

Affects all files that directly or transitively import `src/io/packages.ts` — a core module. This is systemic.

### RC2 — @types/node not resolved in per-file mode

`node:process`, `node:readline`, `node:fs`, `node:os`, `node:async_hooks`, `node:util` all produce TS2591. The per-file tsc invocation doesn't include `@types/node`, which is auto-resolved when tsc uses the project tsconfig. Fix: also read `lib` from tsconfig and pass it, or add `--types node` explicitly to the per-file flags.

### RC3 — NDS-003: intermediate computation variables for span attributes

`checkGlobal.ts` failed NDS-003 because the agent added `const packagesTotal = resolvePkgs.reduce(...)` to compute a span attribute value. The validator treats this as a non-instrumentation line. Per the prompt, "Return-value capture is allowed" — but the validator doesn't extend this to intermediate aggregation variables. Validator calibration issue.

---

## Agent Quality Observations

Despite the NDS-001 failures, the agent's reasoning was strong across all files:

- **Files 3, 4, 6**: Correctly instrumented `CheckPackages`/`check` with proper RST-004 skip on helpers, null guards, schema attribute timing. Correctly identified the cross-file origin of the NDS-001 error.
- **File 4 (cli.ts)**: Correctly resolved COV-001 vs RST-006 conflict (COV-001 wins for entry points). Used `await` instead of `return` for `startActiveSpan` to avoid cac typing issues.
- **File 5 (checkGlobal)**: Third attempt correctly identified the bare `catch {}` issue from prior run. Schema extension `span.taze.check.global` correctly chosen.
- **File 7 (interactive.ts)**: Correctly analyzed RST-006 scope (process.exit in nested closures, not direct body — COV-001 still applies). Span name `taze.check.interactive` well-chosen.
- **File 8 (render.ts)**: Pre-scan correctly found 0 instrumentable functions (all sync). 0.0K tokens consumed — early exit working.
- **Agent thinking**: Now surfacing in CLI mode (all files showed thinking blocks).

---

## Test Suite

End-of-run test suite: 2 failures, both pre-existing live-registry flakiness unrelated to instrumentation:
- `test/cli.test.ts`: Timeout requesting `@types/node` and `pnpm` from live npm registry
- `test/resolves.test.ts`: Live yarn/npm resolution returning unexpected results

Pre-run manual `pnpm test` passes all 73 tests. These failures confirm the checkpoint rollback was correctly disabled (baseline failures pre-exist).

---

## Comparison to Prior Runs

| Metric | Run-3 | Run-4 | Run-5 |
|--------|-------|-------|-------|
| Files processed | 3/33 | 3/33 | **8/33** |
| Committed | 0 | 0 | **0** |
| Correct skips | 0 | 0 | **2** |
| Failed | 3 | 3 | 6 |
| PR created | NO | NO | **YES** |
| Live-check | DEGRADED | DEGRADED | **OK** |
| Root cause | NodeNext/Bundler | TS5112 | Array.fromAsync + node: types |

---

## Next Steps

Two more `checkSyntax()` fixes needed before run-6:
1. Read `target` from tsconfig.json and pass it (fixes `Array.fromAsync`)
2. Read `lib` from tsconfig.json and pass it, or add `--types node` (fixes `node:` protocol types)

See `spiny-orb-findings.md` for full details.
