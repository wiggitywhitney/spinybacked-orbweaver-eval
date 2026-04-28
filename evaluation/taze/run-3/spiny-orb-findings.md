# spiny-orb Findings — taze Run 3

Issues and observations surfaced by spiny-orb during run-3 that warrant filing as GitHub issues or PRD items.

**Schema design reference (read before scoring SCH rules)**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md` documents the 3 attributes deliberately omitted from the Weaver schema — `taze.check.concurrency`, `taze.package.diff_type`, `taze.fetch.cache_hit` — with code locations and rationale. Use this to evaluate whether spiny-orb correctly identified the gaps.

---

## P1 — Blocking

### [P1] NDS-001 validator hardcodes NodeNext module resolution — fails all Bundler-resolution TypeScript projects

**Found in**: run-3 (root cause of all NDS-001 failures across runs 1, 2, and 3)

**Symptom**: Every taze file fails NDS-001 on the original, unmodified source. `src/addons/index.ts` is returned completely unchanged by the agent ("nothing to instrument") and still fails NDS-001. `npx tsc --noEmit` from the project root passes with zero errors.

**Root cause**: `src/languages/typescript/validation.ts` `checkSyntax()` invokes tsc with hardcoded flags:
```text
tsc --noEmit --strict --skipLibCheck --allowImportingTsExtensions
    --module NodeNext --moduleResolution NodeNext --target ES2022 --jsx preserve
    <filePath>
```

Taze uses `"moduleResolution": "Bundler"` in `tsconfig.json`. Under NodeNext, all relative imports require `.js` extensions (e.g., `import { ... } from '../types.js'`). Taze uses extensionless imports throughout, which are valid under Bundler but produce a tsc error under NodeNext.

The code comment in `checkSyntax()` acknowledges this: "Passing a specific file path to tsc bypasses tsconfig.json project settings."

**Evidence**:
- `cat ~/Documents/Repositories/taze/tsconfig.json` → `"moduleResolution": "Bundler"`
- `npx tsc --noEmit` from taze root → exits 0, no errors
- Per-file check with NodeNext → fails on every file, including unchanged originals
- Debug dump: `evaluation/taze/run-3/debug/src/addons/index.ts` is byte-for-byte identical to the original source

**Required fix**: `checkSyntax()` should detect and use the project's tsconfig `moduleResolution` setting. Options (in preference order):
1. Read the project's `tsconfig.json` and pass `--project <path>` instead of per-flag invocation
2. Walk up from `filePath` to find `tsconfig.json`, read its `moduleResolution` field, substitute it for the hardcoded `NodeNext`
3. Default to `Bundler` (the most permissive/common setting for modern TS projects) with NodeNext as an override when `tsconfig.json` confirms NodeNext

**Affected scope**: All TypeScript projects using `moduleResolution: Bundler` — which includes most tool/library projects built with Vite, esbuild, tsx, or similar bundlers.

**Fix owner**: spiny-orb team.

---

## Carry-Forward from Runs 1 and 2 (still open)

### [P1] Consecutive-failure abort threshold blocks diagnosis

**Confirmed in**: runs 1, 2, 3 (all aborted at file 3/33)

The abort threshold (3 consecutive failures) prevents the remaining 30 files from being processed. Now that the root cause is the NodeNext mismatch (affecting 100% of files), the threshold would fire on any project with Bundler resolution. Once the NDS-001 fix lands, this may become moot — but it remains a risk for future TypeScript projects where early files happen to be uninstrumentable.

**Fix owner**: spiny-orb team.

### [P2] Checkpoint test failures from live-registry dependency

**Confirmed in**: run-2, expected in run-3 (run aborted before checkpoint ran)

End-of-run summary still shows: "Baseline test suite has pre-existing failures — checkpoint test rollback disabled." This appeared in run-3 even with `testCommand: pnpm test` configured, suggesting the baseline check runs before the `testCommand` setting takes effect, or the pre-existing flaky tests still fire regardless of the command.

**Note**: `pnpm test` is now set in `spiny-orb.yaml`. If the warning persists in run-4, investigate whether the baseline test check reads `testCommand` or uses a different default.

**Fix owner**: spiny-orb team (checkpoint mechanism); taze fork (live-registry flakiness).

---

## P3 — Low Priority

*(fill in during failure deep-dives)*
