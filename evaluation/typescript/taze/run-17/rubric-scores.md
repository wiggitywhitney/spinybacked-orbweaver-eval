<!-- ABOUTME: Rubric scores for taze run-17 — dimension-by-dimension quality scoring vs run-16 baseline. -->
# Rubric Scores — taze Run-17

**Date**: 2026-09-21
**Branch**: spiny-orb/instrument-1789998344404
**PR**: https://github.com/wiggitywhitney/taze/pull/13
**Rubric version**: 31 rules (2 per-run gates + 29 quality rules)
**IS score**: 77.8/100 (down from 88.9/100 in run-16)
**spiny-orb SHA**: 4e7c2f0

Source evidence: `per-file-evaluation.md` (13 committed files, post-reconciliation verdicts), `pr-artifact-evaluation.md` (schema/diff cross-checks), `spiny-orb-findings.md` (failure deep-dives, IS SPA-002/SPA-005).

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 13 committed files pass `tsc --noEmit` on their final attempt; 0 failed files. Three files needed retries before reaching a clean compile (`checkGlobal.ts` 2 attempts, `pnpmWorkspaces.ts` 2 attempts, `packageYaml.ts` 3 attempts) — all recovered before commit |
| NDS-002 (Tests) | Per-run | **PASS** — live-check reported OK (688 spans, 0 rollbacks); 0 failed/partial files across the run |

**Gates: 2/2 PASS**

---

## Dimension Scores

### Non-Destructiveness (NDS): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-003 (Non-instrumentation lines unchanged) | **PASS** | 13/13 — the only non-instrumentation-looking diff lines are mechanical `as const` type-widening fixes required by TypeScript literal narrowing inside async `startActiveSpan` callbacks (`checkGlobal.ts`, `packageJson.ts`, `packageYaml.ts`), consistent with how this same pattern passed in run-16 |
| NDS-004 (API signatures preserved) | **PASS** | 13/13 — all exported function signatures unchanged across all files |
| NDS-005 (Error handling preserved) | **PASS** | 13/13 — all pre-existing try/catch/graceful-degradation patterns preserved untouched (e.g. `loadGlobalPnpmPackage`'s pnpm-not-installed catch, `writeBunJSON`'s indent-detection catch, `resolves.ts`'s inner catches) |
| NDS-006 (Module system matches project) | **PASS** | 13/13 — all agent-added imports use ESM syntax, matching project `"type": "module"` |

### Coverage (COV): 5/6 (83%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | 13/13 — all exported entry points spanned |
| COV-002 (Outbound calls have spans) | **PASS** | 13/13 (or N/A) — `resolves.ts` (npm/JSR HTTP via `getPackageData`), `pnpmWorkspaces.ts`/`yarnWorkspaces.ts` (file I/O), `packument.ts` (npm/JSR fetch) all covered |
| COV-003 (Failable ops have error visibility) | **PASS** | 13/13 — `recordException` + `setStatus(ERROR)` on all spans |
| COV-004 (Async ops have spans) | **PASS** | 13/13 — all async/I/O functions spanned, including unexported ones under the RST-004 I/O exemption |
| COV-005 (Domain attributes present) | **FAIL** | Primary goal COV-005 (packument.ts) is **resolved** — `taze.package.latest_version` recovered on both fetch spans. But two other files regress this run: `resolves.ts` drops the registered `taze.package.update_available` boolean from `resolveDependency`, and `api/check.ts`'s `CheckSingleProject` drops `taze.package.file_path` and reverts its change-count key to a less semantically accurate one. Net: the run-16 carry-forward finding is fixed, but two new COV-005 regressions appear elsewhere, so the dimension still fails overall |
| COV-006 (Auto-instrumentation preferred) | **PASS** | N/A for all applicable files — no auto-instrumentation library covers npm/JSR registry HTTP, workspace file I/O, or cache operations in this project |

### Restraint (RST): 5/5 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No unnecessary utility spans) | **PASS** | 13/13 — all 20 correct pre-scan skips confirmed via log grep (no self-flagged COV-001/COV-004 need abandoned) |
| RST-002 (No accessor spans) | **PASS** | 13/13 |
| RST-003 (No thin wrapper spans) | **PASS** | 13/13 — `readJSON` (packages.ts) and `writeYaml` (pnpmWorkspaces.ts) correctly left advisory-only, not FAIL, consistent with run-16's judgment |
| RST-004 (Unexported functions — I/O exemption applied correctly) | **PASS** | 13/13 |
| RST-005 (No pre-existing tracer instrumentation) | **PASS** | 13/13 |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Scope |
|------|--------|-------|
| API-001 (Only `@opentelemetry/api` imports) | **PASS** | 13/13 |
| API-002 (`@opentelemetry/api` in peerDependencies) | **PASS** | Per-run — no `package.json` dependency changes in the diff (confirmed in `pr-artifact-evaluation.md`) |
| API-003 (No vendor-specific SDK) | **PASS** | Per-run — no vendor SDK added |

### Schema Fidelity (SCH): 2/4 (50%)

| Rule | Result | Files |
|------|--------|-------|
| SCH-001 (Span names in registry) | **PASS** | 13/13, after reconciliation — cross-run span-name churn (4 of 6 renamed in `resolves.ts`, similar drift elsewhere) is legitimate under the currently resolved registry, since run-16's schema extensions never merged to main. Naming *instability* across runs is a real quality trend, tracked as an observation, not an SCH-001 rubric violation |
| SCH-002 (Attribute keys registered) | **PASS** | 13/13 — all attribute keys registered in `agent-extensions.yaml`/`attributes.yaml` |
| SCH-003 (Attribute types match schema) | **FAIL** | 5 files: `checkGlobal.ts`, `check/index.ts`, `pnpmWorkspaces.ts`, `packageYaml.ts` (disguised recurrence — count cast to string, schema retyped to `string` to match instead of the cast being removed), and `yarnWorkspaces.ts` (literal recurrence — schema says `int`, code passes a string). The run-16 carry-forward finding (TAZE-RUN3-3/4) is **not resolved**; it broadened from 2 files to 5, per the exemption-scope pre-commitment's semantic reading |
| SCH-004 (No near-synonym redundancy) | **FAIL** | `yarnWorkspaces.ts`: the newly agent-registered `taze.io.file_path` is reused for the write operation, duplicating the pre-existing, more specific `taze.write.file_path` that run-16 used correctly at this exact call site (Jaccard 0.5, identical semantic role). New this run — run-16 passed SCH-004 cleanly |

### Code Quality (CDQ): 7/7 (100%)

| Rule | Result | Files |
|------|--------|-------|
| CDQ-001 (Spans closed in all paths) | **PASS** | 13/13 — all spans use `startActiveSpan` with `span.end()` in `finally`. Advisory-only, non-blocking: `interactive.ts`'s ctrl+c `process.exit()` path still bypasses `finally` (an NDS-003-constrained limitation carried from run-16), though the `'escape'`/`'q'` exit path is now fixed |
| CDQ-002 (Tracer acquired correctly) | **PASS** | 13/13 — `trace.getTracer('taze')` matches project identity everywhere |
| CDQ-003 (Standard error recording pattern) | **PASS** | 13/13 |
| CDQ-005 (Async context maintained) | **PASS** | 13/13 — `startActiveSpan` callback pattern throughout |
| CDQ-006 (Expensive attribute computation guarded) | **PASS** | 13/13 — **resolves TAZE-RUN3-2**. `bunWorkspaces.ts`'s 3 previously-unguarded post-await `setAttribute` calls in `loadBunWorkspace` are now either trivial-and-exempt or, for the one true method-chain computation (`Object.keys(versions).length`), correctly wrapped in `if (span.isRecording())` |
| CDQ-007 (No unbounded or PII attributes) | **PASS** | 13/13, after reconciliation — the rubric's literal CDQ-007 mechanism (object spreads, `JSON.stringify` of req/response objects, unbounded arrays, PII-pattern keys) does not cover raw filesystem paths; `packageJson.ts`/`packageYaml.ts`'s initial FAIL verdicts on that pattern were corrected to PASS to match `packages.ts`/`yarnWorkspaces.ts`'s original (correct) reading. The underlying absolute-path exposure (vs. run-16's relative paths in some of these same files) is tracked as a quality observation outside the rubric's literal scope, not a rubric violation |
| CDQ-011 (Canonical tracer name) | **PASS** | 13/13 |

---

## Overall Score

| Dimension | Run-17 | Run-16 | Delta |
|-----------|--------|--------|-------|
| NDS | 4/4 (100%) | 4/4 (100%) | — |
| COV | 5/6 (83%) | 5/6 (83%) | — |
| RST | 5/5 (100%) | 5/5 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 2/4 (50%) | 3/4 (75%) | **-1** |
| CDQ | 7/7 (100%) | 6/7 (86%) | **+1** |
| **Overall quality** | **26/29 (90%)** | **26/29 (90%)** | — |
| **Gates** | **2/2 (100%)** | **2/2 (100%)** | — |
| **Files committed** | **13** | **13** | — |
| **IS Score** | **77.8/100** | **88.9/100** | **-11.1** |
| **Q×F** | **11.7** | **11.7** | — |

**Q×F calculation**: (26/29) × 13 = 0.8966 × 13 = **11.7**

**Composition note**: the overall quality total held flat at 26/29, but the dimensions it's made of shifted. CDQ improved by exactly the carry-forward fix this run targeted (CDQ-006, bunWorkspaces.ts, resolved). SCH regressed by exactly one rule's worth — not because the targeted carry-forward finding (SCH-003) was fixed, but because it broadened from 2 files to 5 (disguised via schema retyping in 4, literal in 1) while a *new* SCH-004 violation appeared in `yarnWorkspaces.ts`. A flat total score masks a real trade: one long-standing quality problem got fixed while a related one got measurably worse.

---

## Findings by Priority

### Carry-forward goals — resolution status

| ID | Finding | Run-16 Status | Run-17 Status |
|----|---------|----------------|----------------|
| TAZE-RUN3-1 | COV-005: packument.ts drops `taze.package.latest_version` | FAIL | **RESOLVED** — recovered on both fetch spans, sourced from real response data |
| TAZE-RUN3-2 | CDQ-006: bunWorkspaces.ts 3 unguarded post-await setAttribute calls | FAIL | **RESOLVED** |
| TAZE-RUN3-3 | SCH-003: `String(deps.length)` cast in checkGlobal.ts | FAIL | **NOT RESOLVED** — recurred in disguised form (renamed attribute, schema retyped to `string`) |
| TAZE-RUN3-4 | SCH-003: `String(catalogs.length)` cast in bunWorkspaces.ts | FAIL | **RESOLVED** in this specific file — but the same pattern recurred in 4 other files (`check/index.ts`, `pnpmWorkspaces.ts`, `packageYaml.ts` disguised; `yarnWorkspaces.ts` literal) |
| — | resolves.ts stability (post run-16 recovery) | 6 spans, 2 attempts | **PARTIALLY RESOLVED** — NDS-001 oscillation fixed (1 attempt, 0 errors), but 4 of 6 span names and 1 attribute (`taze.package.update_available`) drifted/dropped, a new instability not present in run-16 |
| — | IS SPA-002 (orphan span) | New in run-16 | **CONFIRMED CONSISTENT** — recurred with the same shape (different span IDs, same async-boundary context loss in `resolves.ts`) across two consecutive runs; a real spiny-orb fix candidate |

### New findings this run

| ID | Rule | File | Description |
|----|------|------|--------------|
| — | SCH-003 | check/index.ts | New attribute `taze.check.packages_loaded` (not present in run-16's 5-attribute baseline for this span) set via `String(resolvePkgs.length)` — a regression introduced fresh in run-17, not a carry-forward |
| — | SCH-003 | pnpmWorkspaces.ts | `taze.check.packages_loaded` set via `String(catalogs.length)` — regression vs. run-16's clean PASS on the equivalent attribute (`taze.catalog.count`, raw int) |
| — | SCH-003 | packageYaml.ts | `taze.check.packages_loaded` set via `String(deps.length)` — regression vs. run-16's clean PASS on the equivalent attribute (`taze.package.deps_count`, raw int) |
| — | SCH-003 + SCH-004 | yarnWorkspaces.ts | Literal type mismatch (`String(catalogs.length)` against `int`-typed `taze.io.catalogs_count`) plus a reused generic `taze.io.file_path` key duplicating the pre-existing, more specific `taze.write.file_path` used correctly by this exact call site in run-16 |
| — | COV-005 | resolves.ts | `resolveDependency` drops the registered `taze.package.update_available` boolean, present in run-16 |
| — | COV-005 | api/check.ts | `CheckSingleProject` drops `taze.package.file_path`; reverts its change-count key from run-16's more semantically accurate `taze.check.packages_outdated` back to `taze.write.changes_count` |
| — | IS SPA-005 | resolves.ts (13 spans across the run) | 24 spans <5ms vs. the 20-span limit — investigated against source (`resolves.ts:264` early-return for local/URL/no-update/filtered/ignore-mode deps); not a defect, a structural mismatch between a flat threshold and a run's natural span volume, same shape as the existing SPA-001 CLI exemption |

### Resolved vs run-16

| Finding | Resolution |
|---------|-----------|
| TAZE-RUN3-1 (COV-005, packument.ts) | **RESOLVED** — `taze.package.latest_version` recovered on both fetch spans, real data, no known fix attempt behind it (unexplained recovery per the PRD's pre-run verification note) |
| TAZE-RUN3-2 (CDQ-006, bunWorkspaces.ts) | **RESOLVED** — via merged spiny-orb #1012 |
| TAZE-RUN3-4 (SCH-003, bunWorkspaces.ts specifically) | **RESOLVED in this file** — but the underlying pattern recurred elsewhere (see above); #1012's fix did not generalize across the prompt |
| resolves.ts NDS-001 oscillation (#954/#958) | **Compilation instability resolved** — 1 attempt, 0 errors, down from run-16's 2 attempts. Schema-naming instability traded in as a new, different problem |

### Carry-forward (unresolved or newly broadened)

| ID | Finding | Priority |
|----|---------|----------|
| — | SCH-003: count-cast-to-string pattern, now spanning 5 files (up from 2) | Low→Normal (broadened) |
| — | SCH-004: taze.io.file_path/taze.write.file_path near-duplicate in yarnWorkspaces.ts | Low (new) |
| — | COV-005: attribute regressions in resolves.ts and api/check.ts | Low (new) |
| — | resolves.ts schema-naming instability (span names + attributes churn run-over-run) | Info (watch item) |
| TAZE-RUN1-6 | IS SPA-001: INTERNAL span count — structural; CLI design | Info |
| — | IS SPA-002: orphan span, confirmed consistent across 2 runs | Normal (real spiny-orb fix candidate) |
| — | IS SPA-005: short-span threshold vs. run span volume | Info (rubric/threshold observation, not a defect) |
