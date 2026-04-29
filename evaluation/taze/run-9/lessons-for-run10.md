# Lessons for Run 10

Observations collected during run-9 that should inform the next evaluation run.

---

## Pre-Run State for Run-9

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb build | ✅ | SHA: `d18616de24d60edc961bd7e820ff4f8f20a01d2f` |
| Checkpoint test exclusion | ✅ | `pnpm vitest run --exclude test/cli.test.ts --exclude test/packageConfig.test.ts` |
| All prior blockers | ✅ | NDS-003 catch/finally, @types/node, null guards, NodeNext — all fixed |

---

## Run-9 Observations

### Run-9 result — 2026-04-29 — 33/33 processed, 11 committed, PR #4

First complete run — all 33 files processed. 11 committed, 19 correct skips, 3 failed.

**Failed files:**
- **src/io/packageJson.ts** — NDS-001: `type: 'package.json'` widened to `string` inside `startActiveSpan` callback. Agent needs `as const` guidance or `PackageMeta[]` cast.
- **src/io/packageYaml.ts** — NDS-001: same root cause, `type: 'package.yaml'`.
- **src/io/resolves.ts** — NDS-003: `if (span.isRecording()) {` blocked. CDQ-006 recommends this guard but NDS-003 doesn't recognize it.

---

## Carry-Forward Items for Run 10

### P1A — TypeScript literal type widening fix

Add to `src/languages/typescript/prompt.ts`: when wrapping a function that returns an object literal used in a discriminated union (`PackageMeta`, etc.), add `as const` to string literal discriminant fields or cast the array return as `PackageMeta[]`. Similar to the `instanceof Error` guidance.

### P1B — NDS-003 `if (span.isRecording()) {` allowlist

Add `/^\s*if\s*\(\s*(?:span|otelSpan)\.isRecording\(\)\s*\)\s*\{?\s*$/` to `INSTRUMENTATION_PATTERNS` in `nds003.ts`.

**Do not rerun until both fixes are confirmed on spiny-orb main.**

Details: `evaluation/taze/run-9/spiny-orb-findings.md` and `evaluation/taze/spiny-orb-handoff.md`
