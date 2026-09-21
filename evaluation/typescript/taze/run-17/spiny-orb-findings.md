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

**Outcome**: TBD

**Attribute recovered on both fetch spans**: TBD

**Root cause (if still absent)**: TBD

---

## checkGlobal.ts

*(Primary investigation target — SCH-003, TAZE-RUN3-3: `String(deps.length)` cast on `taze.package.deps_count`, an int-typed schema attribute)*

**Outcome**: TBD

**String() cast removed**: TBD

---

## bunWorkspaces.ts

*(Primary investigation target — SCH-003 (TAZE-RUN3-4: `String(catalogs.length)` cast on `taze.catalog.count`) and CDQ-006 (TAZE-RUN3-2: 3 post-await `setAttribute` calls in `loadBunWorkspace` without `isRecording` guard))*

**SCH-003 outcome**: TBD

**CDQ-006 outcome**: TBD

| Rule | Run-16 status | Run-17 status | Notes |
|------|---------------|----------------|-------|
| SCH-003 (`String(catalogs.length)`) | Violation | TBD | |
| CDQ-006 (3 post-await calls in `loadBunWorkspace`) | Violation | TBD | |

---

## resolves.ts

*(Primary investigation target — stability check after run-16 recovery from run-15 oscillation)*

**Outcome**: TBD

**Debug dump captured (if oscillation recurs)**: TBD

**tsc error (if oscillation recurs)**: TBD

**Root cause**: TBD

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

No I/O happens on that path, so a sub-millisecond span duration is the correct measurement. The other 33 spans go through the real network round-trip and land at 67ms+, as expected. The io/config spans are the same story — local file reads/parses with nothing to wait on.

**Why this crossed the threshold vs. run-16 (exactly 20, passing)**: run-17 has more total spans overall (140 across 13 span names vs. run-16's 10) — more instrumentation coverage plus whatever the current dependency set in the fork's package.json/pnpm-workspace happens to contain. More total dependencies checked means more early-exits, and the flat cap of 20 doesn't scale with that.

**Assessment**: not a code or instrumentation defect. Same shape as the existing SPA-001 CLI-app exemption already documented in this PRD — an absolute threshold rule bumping into a target whose span volume legitimately varies run-to-run. Flag as a rubric/threshold observation in the actionable-fix-output, not a regression to chase.

---

## Other Files

*(Populated during per-file evaluation)*
