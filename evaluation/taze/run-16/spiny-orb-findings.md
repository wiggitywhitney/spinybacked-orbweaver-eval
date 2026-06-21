<!-- ABOUTME: Per-file findings from spiny-orb run-16 on taze — failure deep-dives, debug dump analysis, and individual file observations. -->
# Spiny-orb Findings — taze Run-16

Per-file analysis from run-16. Populated during failure deep-dives and per-file evaluation.

## Run Summary

| Metric | Run-16 | Run-15 | Run-13 |
|--------|--------|--------|--------|
| Files processed | 33/33 | 33/33 | 33/33 |
| Committed | **13** | 11 | 14 |
| Correct skips | 20 | 20 | 19 |
| Oscillation (false SUCCESS) | **0** | 1 (resolves.ts) | 0 |
| Failed | **0** | 1 (yarnWorkspaces.ts) | 0 |
| Total spans | **35** | 27 | 30 |
| New schema attributes | **4** | 1 | 3 |
| Multi-attempt files | 7 | 5 | 3 |
| Cost | **$4.36** | $4.82 | $4.93 |
| Duration | 42m 57s | — | 54m 45s |
| Branch | spiny-orb/instrument-1782059121456 | — | spiny-orb/instrument-1777809261652 |
| PR | https://github.com/wiggitywhitney/taze/pull/11 | PR #10 | PR #8 |

---

## resolves.ts

*(Primary investigation target — NDS-001 oscillation from run-15)*

**Outcome**: ✅ RECOVERED — **6 spans, 0 attributes, 2 attempts**

**Debug dump captured**: NO — resolves.ts succeeded, so #989 did not trigger (debug dumps only write for success-with-0-spans or partial files)

**tsc error**: N/A — no oscillation recurred

**Root cause of recovery**: Unknown. #954 and #958 are still open. The agent found an approach that worked on attempt 2 without #954 being fixed. The oscillation may recur in a future run if the agent takes the same path as run-15. Root cause diagnosis for #954 is still pending — no debug dump was produced to enable it.

**Coverage change vs run-13**: 6 spans recovered (matching run-13). Attributes NOT recovered: run-13 had 2 attributes (`taze.cache.hit`, `taze.cache.changed`); run-16 has 0. Needs per-file evaluation.

---

## yarnWorkspaces.ts

*(Secondary — `/\./ g` regex syntax error on all 3 run-15 attempts)*

**Outcome**: ✅ RECOVERED — **2 spans, 0 attributes, 2 attempts**

Run-15's 3-attempt NDS-001 failure resolved. 2 spans matches run-13 baseline.

---

## Unexpected Findings

### interactive.ts — new attribute, 3 attempts (f6)

Run-13: 1 span, 0 attrs, 1 attempt. Run-15: 1 span, 0 attrs. Run-16: 1 span, **1 attribute, 3 attempts**. An attribute was added that neither prior run produced, and it took 3 attempts. Needs per-file evaluation to determine if the attribute is appropriate.

### packageJson.ts — new attribute (f12)

Run-13: 2 spans, 0 attrs. Run-15: 2 spans, 0 attrs. Run-16: 2 spans, **1 attribute**, 2 attempts. Same pattern — attribute that wasn't present in prior runs. Needs per-file evaluation.

### config.ts — attribute still absent (f7)

Run-13: 1 span, **1 attr** (`taze.config.sources_found`). Run-15: 1 span, 0 attrs. Run-16: 1 span, 0 attrs. Two consecutive runs missing the attribute. Systematic drop — needs investigation.

### resolves.ts — 2 attributes missing vs run-13 (f16)

Run-13: 6 spans, **2 attrs** (`taze.cache.hit`, `taze.cache.changed`). Run-16: 6 spans, 0 attrs. Spans recovered; attributes not. Needs per-file evaluation.

---

## CDQ-006 Violations

*(isRecording guard status per file — compare to run-15 baseline of 5 violations in 4 files)*

| File | Run-15 violations | Run-16 violations | Notes |
|------|------------------|------------------|-------|
| checkGlobal.ts | 2 | TBD | |
| interactive.ts | 1 | TBD | |
| bunWorkspaces.ts | 1 | TBD | |
| pnpmWorkspaces.ts | 1 | TBD | Regression from run-13 (guard was present) |

---

## Other Files

*(Populated during per-file evaluation)*
