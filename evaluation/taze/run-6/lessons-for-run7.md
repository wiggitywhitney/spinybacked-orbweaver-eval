# Lessons for Run 7

Observations collected during run-6 that should inform the next evaluation run.

---

## Pre-Run State for Run-6

### Pre-run verification — 2026-04-29

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb build | ✅ | Branch: `main`, SHA: `c4080cbd7958a5defaac8e335af70ab476bb922d` |
| `--target` read from tsconfig | ✅ | Fixed — Array.fromAsync no longer fails |
| `lib`/`types` read from tsconfig | ✅ | Merged — but taze has no `types` field, so @types/node still not loaded |
| spiny-orb.yaml | ✅ | `language: typescript`, `targetType: short-lived`, `testCommand: pnpm test` |
| GITHUB_TOKEN_TAZE | ✅ | Verified (run-5 pushed successfully) |

---

## Run-6 Observations

### Run-6 result — 2026-04-29 — ABORTED at 3/33

- **src/addons/index.ts** — ❌ NDS-001: `console` not found (TS2584) via vscode.ts import. `@types/node` not in per-file check because taze tsconfig has no `types` field.
- **src/addons/vscode.ts** — ❌ NDS-001: same `console` issue.
- **src/api/check.ts** — ❌ NDS-001: null guard catch-22. `options.mode` is `RangeMode | undefined`; passing directly to `setAttribute` fails TS2345; adding `if (x != null)` guard triggers NDS-003.

---

## Carry-Forward Items for Run 7

### New P1A — auto-detect @types/node

`checkSyntax()` must check for `node_modules/@types/node/` presence and add `node` to `--types` automatically. Many Node.js TypeScript projects don't declare `types` in tsconfig — TypeScript auto-discovers it.

### New P1B — NDS-003 null guard allowlist

Extend NDS-003 to permit `if (x != null) { span.setAttribute(key, x) }` when the guarded variable feeds solely into `setAttribute`. Both null guards for setAttribute arguments AND intermediate variables computed for setAttribute (confirmed P2 in run-5) need to be allowed.

**Do not rerun until both fixes are confirmed on spiny-orb main.**

Details: `evaluation/taze/run-6/spiny-orb-findings.md` and `evaluation/taze/spiny-orb-handoff.md`
