<!-- ABOUTME: Per-file findings from spiny-orb run-16 on taze — failure deep-dives, debug dump analysis, and individual file observations. -->
# Spiny-orb Findings — taze Run-16

Per-file analysis from run-16. Populated during failure deep-dives and per-file evaluation.

## Metric Clarification — "0 attributes" in run output

When spiny-orb reports "N spans, 0 attributes" for a file, **0 attributes means 0 NEW schema attribute extensions declared**, not 0 attributes used. Files that use only already-registered attributes (e.g., `taze.config.sources_found`, `taze.cache.hit`, `taze.cache.changed`) report 0 new attributes even if they use many setAttribute calls. Run-16's 3 new attributes are: `taze.catalog.count`, `taze.package.file_path`, and `taze.package.deps_count` (declared by their first-appearing file; subsequent files use them without incrementing the counter). `taze.write.changes_count` was already registered in a prior run and is not counted as new.

## Run Summary

| Metric | Run-16 | Run-15 | Run-13 |
|--------|--------|--------|--------|
| Files processed | 33/33 | 33/33 | 33/33 |
| Committed | **13** | 11 | 14 |
| Correct skips | 20 | 20 | 19 |
| Oscillation (false SUCCESS) | **0** | 1 (resolves.ts) | 0 |
| Failed | **0** | 1 (yarnWorkspaces.ts) | 0 |
| Total spans | **35** | 27 | 30 |
| New schema attributes | **3** | 1 | 3 |
| Multi-attempt files | 7 | 5 | 3 |
| Cost | **$4.36** | $4.82 | $4.93 |
| Duration | 42m 57s | — | 54m 45s |
| Branch | spiny-orb/instrument-1782059121456 | — | spiny-orb/instrument-1777809261652 |
| PR | https://github.com/wiggitywhitney/taze/pull/11 | PR #10 | PR #8 |

---

## resolves.ts

*(Primary investigation target — NDS-001 oscillation from run-15)*

**Outcome**: ✅ RECOVERED — **6 spans, 0 new attributes, 2 attempts**

**Debug dump captured**: NO — resolves.ts succeeded, so #989 did not trigger (debug dumps only write for success-with-0-spans or partial files)

**tsc error**: N/A — no oscillation recurred

**Root cause of recovery**: Unknown. #954 and #958 are still open. The agent found an approach that worked on attempt 2 without #954 being fixed. The oscillation may recur in a future run if the agent takes the same path as run-15. Root cause diagnosis for #954 is still pending — no debug dump was produced to enable it.

**Attributes used** (all pre-existing, registered): `taze.cache.hit` (4 calls), `taze.cache.changed` (1 call), `taze.package.name` (2 calls), `taze.fetch.registry`, `taze.package.current_version`, `taze.package.update_available` (3 calls), `taze.check.packages_total`, `taze.package.deps_count`.

**Coverage change vs run-13**: 6 spans recovered (matching run-13). `taze.cache.hit` and `taze.cache.changed` both recovered. `taze.package.name` and `taze.package.current_version` added (not present in run-13). `taze.check.packages_total` and `taze.package.deps_count` added (new attributes first declared in run-16). Net: more attributes than run-13.

**CDQ-006**: No unguarded post-await setAttribute calls observed in resolves.ts. Multiple guards present for output attributes.

---

## yarnWorkspaces.ts

*(Secondary — `/\./ g` regex syntax error on all 3 run-15 attempts)*

**Outcome**: ✅ RECOVERED — **2 spans, 0 new attributes, 2 attempts**

Run-15's 3-attempt NDS-001 failure resolved. 2 spans matches run-13 baseline.

---

## config.ts

*(Tracked as f7 — "attribute still absent" in pre-deep-dive notes — CORRECTION)*

**Outcome**: ✅ RECOVERED — **1 span, 0 new attributes, 1 attempt**

**Correction**: The pre-deep-dive note "attribute still absent" was based on misreading "0 attributes" in the run output. The attribute `taze.config.sources_found` IS set in run-16 at line 56 of the committed code: `span.setAttribute('taze.config.sources_found', config.sources.length)`. The attribute was absent in run-15 but is present in run-16. This is a recovery vs run-15.

**Why "0 new attributes"**: `taze.config.sources_found` was first declared in run-13. Run-16 uses it without redefining it, so the "0 attributes" in the run output is correct (no new declarations, but the attribute is used).

**CDQ-006**: `taze.config.sources_found` is set after `await loader.load()`. No `isRecording()` guard. This is a COV-001 entry span — the rubric's COV-001 exemption may apply for attributes set synchronously at span entry, but this attribute is set post-await. Needs evaluation.

---

## interactive.ts

*(3-attempt file — CDQ-006 and NDS-003 analysis)*

**Outcome**: ✅ SUCCESS — **1 span, 0 new attributes, 3 attempts**

**Why 3 attempts**: Attempts 1 and 2 failed NDS-003 (Code Preserved). The agent tried to add `span.end()` before `process.exit()` calls in nested callbacks (`createListRenderer`'s `onKey` and `registerInput`'s keypress handler). NDS-003 prohibits modifying the structure of existing non-instrumentation code. Attempt 2 tried duplicating the condition check (`if (key.ctrl && key.name === 'c') span.end(); if (key.ctrl && key.name === 'c') process.exit()`) — still flagged as NDS-003 (code duplication of existing conditional). Attempt 3 accepted the limitation: `span.end()` is only called via the `finally` block on the normal resolution path. The span will leak if `process.exit()` is called from a nested callback during the `await promise`. This is a known CDQ-001 limitation documented in the companion file.

**New attribute (taze.package.deps_count)**: Set at line 20 — BEFORE the try block, before any await. Correct CDQ-006 placement. `pkgs.length` captures the number of PackageMeta packages passed in. Attribute brief says "Number of dependency entries loaded from a global package registry source" — semantic fit is approximate (interactive's pkgs are not necessarily from a global registry) but it's the closest registered key for package count. The value is useful (tells you how many packages the user saw in the interactive session). Acceptable reuse.

**CDQ-006**: 0 violations. Improved from run-15 (1 violation). The new attribute is placed before any await, which is correct. The process.exit() span leak is CDQ-001, not CDQ-006.

---

## packageJson.ts

*(New attribute — 2 attempts)*

**Outcome**: ✅ SUCCESS — **2 spans, 1 new attribute (`taze.package.file_path`), 2 attempts**

**Why 2 attempts**: Attempt 1 declared `taze.write.changed` as a boolean attribute for whether the package.json was modified. SCH-002 validator fired — `taze.write.changed` is a semantic duplicate of `taze.write.changes_count` (already registered). Attempt 2 swapped to `taze.cache.changed` (the registered boolean "Whether the cache entry was modified"). Also applied CDQ-007 fix: uses `relative` instead of `filepath` for path attributes.

**New attribute `taze.package.file_path`**: Declared as `type: string`. No existing registered attribute captures a package manifest READ path — `taze.write.file_path` is scoped to write operations. This distinction is well-reasoned. The new attribute is used in `loadPackageJSON` for the `relative` parameter (not the absolute path, per CDQ-007).

**Attribute quality**: `taze.cache.changed` is used to track whether a package.json was modified during a write operation. Semantic fit is loose — it's a cache-change attribute being applied to a file-write context. A more precise `taze.write.modified` boolean doesn't exist in the schema. Acceptable in absence of a better registered key; worth noting in per-file evaluation.

---

## CDQ-006 Violations

*(isRecording guard status per file — compare to run-15 baseline of 5 violations in 4 files)*

| File | Run-15 violations | Run-16 violations | Detail |
|------|------------------|------------------|--------|
| checkGlobal.ts | 2 | **2** (same) | `taze.config.sources_found` in loadGlobalPnpmPackage (post-await exec); `taze.package.deps_count` in loadGlobalNpmPackage (post-await exec). `taze.write.changes_count` in installPkg is set BEFORE its await — OK. |
| interactive.ts | 1 | **0** ✓ (improved) | `taze.package.deps_count` placed before try block, before any await. Correct. |
| bunWorkspaces.ts | 1 | **3** (regression) | In loadBunWorkspace: `taze.write.file_path`, `taze.write.package_type`, `taze.catalog.count` all set AFTER `await readFile(...)`. None guarded. bunWorkspaces is a new/expanded file in run-16 (was a smaller implementation in run-15); the run-15 violation was likely the single catalog.count analog. |
| pnpmWorkspaces.ts | 1 | **1** (same) | `taze.catalog.count` in loadPnpmWorkspace set AFTER `await readFile(...)`. Not guarded. Agent notes incorrectly claim COV-001 exemption covers all attribute setting; output attributes set post-await still need guards regardless of entry-point status. `taze.write.file_path` and `taze.package.name` in writePnpmWorkspace are set BEFORE any await — OK. `taze.write.changes_count` is guarded — OK. |
| **Total** | **5** | **~6** | Overall: not improved. Interactive.ts improved; bunWorkspaces increased due to expanded instrumentation. CDQ-006 rubric item likely still fails (any violations = fail). |

---

## SCH-003 Status

*(taze.io.catalogs_found as string not int — run-15 finding)*

**Schema-level**: FIXED. Run-16 declares `taze.catalog.count` as `type: int` in `agent-extensions.yaml`. The run-15 issue (attribute declared as string) does not recur.

**Code-level type mismatch (partial recurrence)**: `bunWorkspaces.ts` passes `String(catalogs.length)` — a string value on an int-typed attribute. `pnpmWorkspaces.ts` correctly passes `catalogs.length` (integer). Same pattern seen in `checkGlobal.ts` with `taze.package.deps_count`: uses `String(deps.length)` in loadGlobalNpmPackage; interactive.ts and resolves.ts correctly pass integer values for the same attribute.

**Verdict**: SCH-003 at schema declaration level is resolved. A code-level pattern exists where some files use `String()` casts on int attributes — this is a different issue than SCH-003 (schema type declaration), potentially SCH-002 territory or a code quality finding. Not a direct SCH-003 recurrence.

---

## Other Files

*(Populated during per-file evaluation)*
