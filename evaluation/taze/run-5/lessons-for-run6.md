# Lessons for Run 6

Observations collected during run-5 that should inform the next evaluation run.

---

## Pre-Run State for Run-5

### Pre-run verification — 2026-04-28

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb build | ✅ | Branch: `main`, SHA: `ac9dadbb3eaa78edc8ef02bc90d0d9ed28d8d512` |
| `--ignoreConfig` fix | ✅ | Merged — TS5112 no longer blocks all files |
| stdout error capture | ✅ | Merged — NDS-001 messages now include full tsc error text |
| Bundler moduleResolution | ✅ | Merged — extensionless imports no longer fail |
| Agent thinking in CLI | ✅ | Now surfacing in `--verbose` output |
| spiny-orb.yaml | ✅ | `language: typescript`, `targetType: short-lived`, `testCommand: pnpm test` |
| GITHUB_TOKEN_TAZE | ✅ | Verified (run-5 pushed branch and created PR) |

**Instrument command for run-6** (run from `~/Documents/Repositories/taze/`):
```bash
caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_TAZE node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-6/debug 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-6/spiny-orb-output.log'
```

---

## Run-5 Observations

### Run-5 result — 2026-04-28 — 8/33 files processed, 0 committed, PR #1 created

**First completed run.** Branch pushed, PR created at https://github.com/wiggitywhitney/taze/pull/1. Live-check: OK.

- **src/addons/index.ts** — ✅ Correct skip (re-export only, pre-scan early exit)
- **src/addons/vscode.ts** — ✅ Correct skip (RST-001: pure sync void method)
- **src/api/check.ts** — ❌ NDS-001: `Array.fromAsync` in packages.ts not in ES2022 lib
- **src/cli.ts** — ❌ NDS-001: same root cause (transitively imports packages.ts)
- **src/commands/check/checkGlobal.ts** — ❌ NDS-003: intermediate variables for span attributes flagged; agent also modified bare `catch {}` block on earlier attempts
- **src/commands/check/index.ts** — ❌ NDS-001: same Array.fromAsync root cause
- **src/commands/check/interactive.ts** — ❌ NDS-001: `node:process`, `node:readline` not resolved (@types/node absent in per-file mode)
- **src/commands/check/render.ts** — ❌ NDS-001: same node: types root cause; pre-scan correctly found 0 instrumentable functions (0.0K tokens)

Abort triggered after 6 consecutive failures (files 3–8) following 2 successes (files 1–2).

---

## Carry-Forward Items for Run 6

### Two new P1s in checkSyntax() (same file, same pattern as previous fixes)

**P1A — `--target ES2022` excludes Array.fromAsync**
`src/io/packages.ts` uses `Array.fromAsync` (ES2024). Taze uses `"target": "ESNext"`. Fix: read `target` from tsconfig.json and pass it (same pattern as `module`/`moduleResolution`). Affects all files importing `packages.ts` (majority of taze's 33 files).

**P1B — `node:` protocol imports need @types/node**
Per-file tsc doesn't load `@types/node` without tsconfig context. Fix: read `lib` (and/or `types`) from tsconfig.json and pass them. Affects at least 6 taze files using `node:*` prefixed imports.

**Do not rerun until both fixes are confirmed on spiny-orb main.**

Details: `evaluation/taze/run-5/spiny-orb-findings.md`
