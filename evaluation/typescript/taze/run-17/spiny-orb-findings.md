<!-- ABOUTME: Per-file findings from spiny-orb run-17 on taze — failure deep-dives, debug dump analysis, and individual file observations. -->
# Spiny-orb Findings — taze Run-17

Per-file analysis from run-17. Populated during failure deep-dives and per-file evaluation.

## Failure Deep-Dives

**Failed files**: 0. **Partially committed files**: 0. `debug-dumps/` is empty (`--debug-dump-dir` only fires for failed/partial/zero-span files, per `spiny-orb-output.log`'s own run summary: "13 committed, 0 failed, 0 partial, 20 correct skips, 0 skipped").

**Files requiring ≥3 attempts**: 1 — `src/io/packageYaml.ts` (3 attempts, ultimately SUCCESS: 4 spans, 0 attributes).

- **Attempt 1**: Failed on a TypeScript type error — `type: 'package.yaml'` widened to `string` inside the async `startActiveSpan` callback (TS2322 against the `PackageMeta` union member).
- **Attempt 2**: Diagnosed the fix (`as const` on the discriminant field) but was rejected — the agent's approach also extracted `doc.get('name')` into a separate const variable, a non-instrumentation code change that violates NDS-003.
- **Attempt 3**: Applied the `as const` fix alone, kept the original inline handling of `doc.get('name')`, and succeeded cleanly.

**Assessment**: not a quality failure requiring a carry-forward finding. The retry loop worked as designed — the validator correctly rejected a non-instrumentation change in attempt 2, and the final commit's reasoning (correct COV-001 entry-point classification, correct NDS-007 handling of the `.catch(Object.create)` graceful-degradation path, correct RST-001/RST-004 skip of `isDepFieldEnabled`) is sound. No finding logged for this file from the deep-dive; still subject to full per-file evaluation below.

---

## packument.ts

*(Primary investigation target — COV-005, TAZE-RUN3-1: `taze.package.latest_version` dropped from both fetch spans in run-16)*

**Outcome**: Resolved. Full detail in `per-file-evaluation.md` § 13.

**Attribute recovered on both fetch spans**: Yes. `taze.package.latest_version` is set on the npm span (`result.tags.latest`, line 76, guarded by `if (result.tags != null)`) and the JSR span (`meta.latest`, line 107, unconditional because `latest` is a required field on `JsrPackageMeta`). Both values are sourced from each fetch function's own real result data, not placeholders.

**Root cause (if still absent)**: N/A — resolved.

---

## checkGlobal.ts

*(Primary investigation target — SCH-003, TAZE-RUN3-3: `String(deps.length)` cast on `taze.package.deps_count`, an int-typed schema attribute)*

**Outcome**: Not fixed — recurred in disguised form. Full detail in `per-file-evaluation.md` § 1.

**String() cast removed**: No. The cast is still present (`String(deps.length)`, line 216), now on a renamed attribute (`taze.check.packages_loaded`). The schema was retyped to `type: string` to match the cast instead of the cast being removed — code and schema agree literally, but the underlying value is still a `.length`-derived count. Scored as an SCH-003 violation under this run's exemption-scope pre-commitment (schema/code agreement doesn't cure a count stored as a string).

---

## bunWorkspaces.ts

*(Primary investigation target — SCH-003 (TAZE-RUN3-4: `String(catalogs.length)` cast on `taze.catalog.count`) and CDQ-006 (TAZE-RUN3-2: 3 post-await `setAttribute` calls in `loadBunWorkspace` without `isRecording` guard))*

**SCH-003 outcome**: Resolved. Full detail in `per-file-evaluation.md` § 5.

**CDQ-006 outcome**: Resolved.

| Rule | Run-16 status | Run-17 status | Notes |
|------|---------------|----------------|-------|
| SCH-003 (`String(catalogs.length)`) | Violation | Resolved | `taze.config.sources_found` set as a raw int (`catalogs.length`, line 63), no `String()` cast |
| CDQ-006 (3 post-await calls in `loadBunWorkspace`) | Violation | Resolved | Only unguarded post-await calls left are trivial property access (exempt); the one method-chain computation (`Object.keys(versions).length`) is correctly guarded with `if (span.isRecording())` |

---

## resolves.ts

*(Primary investigation target — stability check after run-16 recovery from run-15 oscillation)*

**Outcome**: Partially resolved. Full detail in `per-file-evaluation.md` § 10. The NDS-001 compilation oscillation itself is fixed — first attempt, 0 validation errors, an improvement over run-16's 2 attempts. But the file traded that instability for a new one: 4 of 6 span names and 1 attribute (`taze.package.update_available`) drifted or dropped relative to run-16, which wasn't a problem in the prior run.

**Debug dump captured (if oscillation recurs)**: N/A — no failure occurred; attempt 1 succeeded, so `--debug-dump-dir` never fired for this file.

**tsc error (if oscillation recurs)**: N/A — no compilation error occurred this run.

**Root cause**: N/A for the compilation oscillation (genuinely fixed). The new instability's root cause is that the agent isn't converging on a consistent schema (span names, attribute set) for this file run-over-run, even once syntax stabilized — a different failure mode than #954/#958 originally tracked, worth a new watch item rather than closing those issues outright.

---

## IS SPA-002 (orphan span)

*(Primary investigation target — new in run-16 with the resolves.ts recovery; determines whether async-boundary context loss is consistent or transient)*

**Outcome**: Recurred. Run-16: span `0fa594f2` orphaned (parentSpanId `3b6a551d`). Run-17: span `1b89a19e` orphaned (parentSpanId `5997dc1b`) — different span IDs, same shape.

**Consistent vs. transient**: Consistent across two consecutive runs. This is a real spiny-orb fix candidate — the fix belongs in spiny-orb's context propagation across an async boundary in `resolves.ts`, not in the eval target.

## IS SPA-005 (short spans over limit)

*(New this run — 24 spans <5ms vs. limit of 20, up from run-16's 20/20 at the limit)*

**Outcome**: Investigated against source, not a defect.

**Root cause**: `SPA-005` counts all spans with duration <5ms against a flat threshold of 20, without normalizing by total span count. Run-17's 24 short spans (of 140 total, across 13 span names vs. run-16's 10) break down as 18 `taze.check.resolve_dependency` (of 51 total) plus 6 scattered across `io.load_cache`, `io.read_json`, `io.load_package`, `io.load_package_json`, and `config.resolve`.

The `resolve_dependency` durations are bimodal, not noisy: 18 spans at ~0.00–0.01ms, then a hard jump to 67ms–888ms for the other 33. `src/io/resolves.ts:264` shows why — a synchronous early-return fires before `getPackageData` (the network fetch) is ever called, for deps that are local/URL-referenced, have no update flag, fail the filter, or are in "ignore" mode:

```js
if (isLocalPackage(raw.currentVersion) || isUrlPackage(raw.currentVersion) || !raw.update || !await Promise.resolve(filter(raw)) || mergeMode === 'ignore') {
  return { ...raw, diff: null, targetVersion: raw.currentVersion, update: false }
}
```

`getPackageData` — the network fetch — is skipped whenever an earlier condition short-circuits the check, so a sub-millisecond span duration is the correct measurement for that early-return path (the `await Promise.resolve(filter(raw))` on the same line is a synchronous predicate wrapped in a resolved promise, not I/O). The other 33 spans go through the real network round-trip and land at 67ms+, as expected. The io/config spans are the same story — local file reads/parses with nothing to wait on.

**Why this crossed the threshold vs. run-16 (exactly 20, passing)**: run-17 has more total spans overall (140 across 13 span names vs. run-16's 10) — more instrumentation coverage plus whatever the current dependency set in the fork's package.json/pnpm-workspace happens to contain. More total dependencies checked means more early-exits, and the flat cap of 20 doesn't scale with that.

**Assessment**: not a code or instrumentation defect. Same shape as the existing SPA-001 CLI-app exemption already documented in this PRD — an absolute threshold rule bumping into a target whose span volume legitimately varies run-to-run. Flag as a rubric/threshold observation in the actionable-fix-output, not a regression to chase.

---

## Other Files

The remaining 9 committed files with no primary-investigation status this run (`check/index.ts`, `interactive.ts`, `config.ts`, `packageJson.ts`, `packageYaml.ts`, `packages.ts`, `pnpmWorkspaces.ts`, `yarnWorkspaces.ts`, `api/check.ts`) received full rubric scoring during per-file evaluation — see `per-file-evaluation.md` §§ 2-4, 6-9, 11-12. Notable non-primary findings surfaced there: a new SCH-003 regression in `check/index.ts` (a count attribute newly cast to string, not present in run-16), a **CDQ-007 FAIL** in `packageJson.ts` (write side only), `packageYaml.ts` (all 4 sites), `packages.ts` (3 of 4 sites), `pnpmWorkspaces.ts` (2 sites), and `yarnWorkspaces.ts` (2 sites) — plus `bunWorkspaces.ts` among the primary-investigation files above — all setting an unsanitized absolute filesystem path with no structural guarantee against absoluteness, per the PRD's required structural-guarantee test (an earlier pass of this document read this as advisory-only, "not a rubric violation"; corrected during the Rubric scoring milestone after CodeRabbit CLI review caught the gap — see `per-file-evaluation.md`'s "Second reconciliation pass" section), and an SCH-003/SCH-004 regression in `yarnWorkspaces.ts` (a literal type mismatch plus a reused attribute key duplicating an existing more-specific one). No new findings beyond what's already documented in `per-file-evaluation.md`.
