# Actionable Fix Output — taze Run-13

Self-contained handoff from taze evaluation run-13 to the spiny-orb team.

**Run-13 result**: 27/29 (93%) quality, 14 committed, 19 correct skips, 0 failures, 0 rollbacks, $4.93 cost in 54m 45s. First perfect TypeScript run (all 33 files processed). PR #8 created.

**TypeScript baseline**: This is the first TypeScript evaluation run to complete cleanly. No prior TS run findings to assess — all findings in this document are new.

**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze)
**Branch**: `spiny-orb/instrument-1777809261652`
**PR**: https://github.com/wiggitywhitney/taze/pull/8
**IS score**: 60/100 (see §5)

---

## §1. Run-13 Score Summary

| Dimension | Score | Failures |
|-----------|-------|----------|
| NDS | 4/4 (100%) | — |
| COV | 6/6 (100%) | — |
| RST | 5/5 (100%) | — |
| API | 3/3 (100%) | — |
| SCH | 3/4 (75%) | SCH-003: 3 type mismatches in agent-extended schema |
| CDQ | 6/7 (86%) | CDQ-006: isRecording() guard missing on 8 computations across 5 files |
| **Total** | **27/29 (93%)** | **2 canonical failures** |
| **Gates** | **2/2 (100%)** | — |
| **Files** | **14 committed / 19 correct skips** | 0 failures, 0 rollbacks |
| **Cost** | **$4.93** | $0.35 per committed file |
| **Push/PR** | **YES (PR #8)** | — |
| **Q×F** | **13.0** | TypeScript baseline |

---

## §2. Quality Rule Failures

### SCH-003: Type Mismatches in Agent-Extended Schema

**Files affected**: `src/config.ts`, `src/io/resolves.ts`

**Failure**: Three attributes in `semconv/agent-extensions.yaml` are declared as `type: string` but the agent used semantically correct types:

| File | Attribute | Code type | Schema declaration | Correct declaration |
|------|-----------|-----------|-------------------|---------------------|
| src/config.ts | `taze.config.sources_found` | int (`config.sources.length`) | string | int |
| src/io/resolves.ts | `taze.cache.hit` | boolean (`true`/`false`) | string | boolean |
| src/io/resolves.ts | `taze.cache.changed` | boolean (`let cacheChanged = false`) | string | boolean |

**Root cause**: The schema documentation was authored with incorrect type declarations. The instrumented code uses semantically appropriate types — the code is correct, the schema is wrong.

**Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md` documents the intentionally omitted attributes and their expected types for SCH evaluation.

**Fix**: Update `semconv/agent-extensions.yaml` in the taze fork (or in the next run's starting schema):
- `taze.config.sources_found`: change `type: string` → `type: int`
- `taze.cache.hit`: change `type: string` → `type: boolean`
- `taze.cache.changed`: change `type: string` → `type: boolean`

This is a schema-authoring fix, not a spiny-orb instrumentation fix.

---

### CDQ-006: Missing isRecording() Guard on Expensive Attribute Computations

**Files affected**: `checkGlobal.ts`, `commands/check/index.ts`, `io/bunWorkspaces.ts`, `io/resolves.ts`, `io/yarnWorkspaces.ts` (5 of 14 committed files)

**Failure**: 8 inline O(n) computations are passed directly to `span.setAttribute()` without first checking `span.isRecording()`. When a tracer is configured with head-based sampling, these computations run even when the span will be dropped.

| File | Attribute | Computation |
|------|-----------|-------------|
| checkGlobal.ts | `taze.check.packages_total` | `resolvePkgs.reduce((sum, pkg) => sum + pkg.deps.length, 0)` |
| checkGlobal.ts | `taze.check.packages_outdated` | `resolvePkgs.reduce((sum, pkg) => sum + pkg.resolved.filter(...).length, 0)` |
| commands/check/index.ts | `taze.check.packages_total` | `resolvePkgs.reduce((acc, pkg) => acc + pkg.resolved.length, 0)` |
| commands/check/index.ts | `taze.check.packages_outdated` | `resolvePkgs.reduce((acc, pkg) => acc + pkg.resolved.filter(...).length, 0)` |
| io/bunWorkspaces.ts | `taze.check.packages_total` | `catalogs.reduce((sum, c) => sum + c.deps.length, 0)` |
| io/bunWorkspaces.ts | `taze.write.changes_count` | `Object.keys(versions).length` |
| io/resolves.ts | `taze.check.packages_outdated` | `result.filter(d => d.update).length` |
| io/yarnWorkspaces.ts | `taze.write.changes_count` | `Object.keys(versions).length` |

**Reference pattern**: `src/io/pnpmWorkspaces.ts` is the only file in run-13 that correctly guards the computation:
```typescript
if (span.isRecording()) {
  span.setAttribute('taze.write.changes_count', Object.keys(versions).length)
}
```

**Fix needed**: Add prompt guidance reinforcing the CDQ-006 guard pattern for inline computations, particularly `reduce()`, `filter()`, and `Object.keys()` used inside `setAttribute()`. The `pnpmWorkspaces.ts` pattern should be cited explicitly as the reference. This is a recurring TypeScript pattern given taze's architecture (workspace functions that aggregate counts).

---

## §3. Prior Run Findings Assessment

**N/A — taze run-13 is the first TypeScript baseline.** No prior TS run findings to assess. The JS chain findings (commit-story-v2) are a separate evaluation chain and not carried forward here.

---

## §4. New Run-13 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| TAZE-RUN1-1 | SCH-003: type mismatches in agent-extended schema (3 instances) | Low | Schema authoring |
| TAZE-RUN1-2 | CDQ-006: isRecording() guard missing (8 instances, 5 files) | Low | Code quality prompt |
| TAZE-RUN1-3 | Advisory contradiction rate ~78% (vs ~44% in JS chain) | Low | Advisory judges |
| TAZE-RUN1-4 | Pre-scan LLM tokens on deterministically uninstrumentable files | Info | Efficiency |
| TAZE-RUN1-5 | IS RES-001: service.instance.id absent from resource | Low | IS / SDK setup |
| TAZE-RUN1-6 | IS SPA-001: 164 INTERNAL spans per trace (limit 10) | Low | IS / span granularity |
| TAZE-RUN1-7 | IS SPA-002: 1 orphan span | Low | IS / span lifecycle |
| TAZE-RUN1-8 | IS SPA-005: 42 spans < 5ms | Low | IS / span duration |

### TAZE-RUN1-3: Advisory Contradiction Rate ~78%

The taze run-13 advisory contradiction rate is ~78% — significantly above the ~44% seen in commit-story-v2 runs. Two patterns dominate:

**SCH-001 false positives** (naming-convention similarity ≠ semantic equivalence): The SCH-001 judge flags span names as semantic duplicates based on substring matching (e.g., `taze.pnpm_workspace.load` vs `taze.io.load_package`). These are different operations at different abstraction levels. The advisory mode prevents blocking failures, but the false-positive rate is high for namespace-prefixed codebases.

**CDQ-007 false positives** (typed TypeScript parameters flagged as nullable): TypeScript's type system guarantees non-nullability for non-optional parameters. Advisories suggesting `!= null` guards on typed parameters are false positives by construction. This pattern will repeat in any TypeScript target with strict typing.

These are judge calibration issues, not agent quality issues.

### TAZE-RUN1-4: Pre-Scan LLM Tokens on Uninstrumentable Files

Files 1 and 2 consumed LLM tokens despite being deterministically uninstrumentable without reading their content:
- `src/addons/index.ts` — pure re-export file (0.2K tokens)
- `src/addons/vscode.ts` — single synchronous utility function (1.1K tokens)

Both should be identifiable via AST analysis (no async functions, no I/O calls) before the LLM pre-scan runs. This is an optimization opportunity — the token cost is low per file but the pattern applies to all pure re-export and synchronous-only files across any target.

---

## §5. IS Score Analysis

**IS Score: 60/100** | Applicable rules: 8 | Passed: 4 | Failed: 4

| Rule | Result | Notes |
|------|--------|-------|
| RES-005 (Critical) | ✅ PASS | `service.name: 'taze'` set in SDK bootstrap |
| RES-004 | ✅ PASS | semconv attributes at correct OTLP resource level |
| SPA-003 | ✅ PASS | 11 unique span names, no interpolated values |
| SPA-004 | ✅ PASS | Root spans are INTERNAL, not CLIENT |
| RES-001 | ❌ FAIL | `service.instance.id` not set in resource attributes |
| SPA-001 | ❌ FAIL | 164 INTERNAL spans in the main check trace (limit 10) |
| SPA-002 | ❌ FAIL | 1 orphan span (parentSpanId references missing parent) |
| SPA-005 | ❌ FAIL | 42 spans complete in < 5ms |

**SPA-001 — 164 INTERNAL spans: context for the spiny-orb team**

The 164 INTERNAL spans are all from the `taze` instrumentation scope — no auto-instrumentation noise. The span breakdown for a single `taze` invocation against a project with 38 npm packages:

- `taze.check.resolve_dependency`: 71 spans (one per npm dependency being resolved)
- `taze.fetch.npm_package`: 38 spans (one per package fetched from registry)
- `taze.fetch.package_data`: 38 spans (wrapper around each npm fetch)
- `taze.check.resolve_{dependencies,package}`: 10 spans
- All other spans: 7

This is structurally correct instrumentation — each dependency resolution is observable as an individual span. The IS SPA-001 failure surfaces a design question: is per-dependency span granularity the right abstraction, or should resolution spans be batched under a parent `taze.check.resolve_all_dependencies` span? The current approach produces dense, high-resolution traces but fails the IS heuristic limit. Worth a discussion with the spiny-orb team.

**Easy fix — RES-001 (service.instance.id)**

Add `service.instance.id` to `resourceFromAttributes()` in `examples/instrumentation.js`:
```typescript
import { randomUUID } from 'node:crypto'
// ...
resource: resourceFromAttributes({
  'service.name': 'taze',
  'service.version': pkg.version,
  'service.instance.id': randomUUID(),
  'deployment.environment': process.env.NODE_ENV || 'development',
}),
```
This is a one-line fix in the SDK bootstrap. Not in spiny-orb's instrumentation scope — it belongs to the target repo's `examples/instrumentation.js`. Would raise the IS score from 60 to ~67 (eliminates the RES-001 -1 weighted point).

---

## §6. Prioritized Fix Recommendations

### P1 — TAZE-RUN1-1: Fix Schema Type Declarations (Schema Fix)

**Impact**: Eliminates all 3 SCH-003 failures. Raises SCH from 75% → 100%. Quality score rises from 27/29 (93%) → 28/29 (97%).

**Fix**: Update `semconv/agent-extensions.yaml` (in the taze fork or in the next run's starting schema):
- `taze.config.sources_found`: `type: int`
- `taze.cache.hit`: `type: boolean`
- `taze.cache.changed`: `type: boolean`

**Owner**: eval team (schema authoring fix, not spiny-orb agent fix).

### P2 — TAZE-RUN1-2: Add isRecording() Guard Prompt Guidance (Spiny-orb Prompt Fix)

**Impact**: 5 of 14 committed files (36%) have unguarded `reduce()`, `filter()`, or `Object.keys()` inside `setAttribute()`. Fixing this raises CDQ from 86% → 100% and quality to 29/29 (100%).

**Fix**: Strengthen CDQ-006 prompt guidance to consistently enforce the guard pattern for inline computations. The prompt should cite `pnpmWorkspaces.ts` as the canonical reference pattern. Adding a pre-commit validator check (flag `setAttribute` calls containing lambda expressions without an outer `span.isRecording()` guard) would make this automatic.

**Owner**: spiny-orb team (TypeScript prompt).

### P3 — TAZE-RUN1-5: Add service.instance.id to SDK Bootstrap (Target Repo Fix)

**Impact**: Raises IS score from 60 → ~67 (eliminates the RES-001 weighted penalty).

**Fix**: One-line addition to `examples/instrumentation.js` using `randomUUID()` from `node:crypto`.

**Owner**: eval team (SDK bootstrap file in the taze fork).

### Info — TAZE-RUN1-6: SPA-001 Span Granularity Discussion

Not a fix recommendation — a design conversation. The 164 INTERNAL spans per taze invocation is technically correct instrumentation at the per-dependency level. The IS SPA-001 failure surfaces the question of whether this granularity is appropriate. If the spiny-orb team wants CLI tools to pass IS SPA-001 consistently, the TypeScript prompt may need guidance on batching fine-grained operations (e.g., "use a single parent span for all dependency resolutions, not individual spans per package").

---

## §7. Unresolved Items Tracker

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| SCH-003: type mismatches in schema | **TAZE-RUN1-1** | **1 run** | Low — schema doc fix |
| CDQ-006: isRecording() guards missing | **TAZE-RUN1-2** | **1 run** | Low — prompt fix |
| Advisory contradiction rate ~78% | **TAZE-RUN1-3** | **1 run** | Low — TypeScript-specific judge calibration |
| IS SPA-001: 164 INTERNAL spans | **TAZE-RUN1-6** | **1 run** | Info — design discussion |
| IS RES-001: no service.instance.id | **TAZE-RUN1-5** | **1 run** | Low — SDK bootstrap fix |
| IS SPA-002: orphan span | **TAZE-RUN1-7** | **1 run** | Low — likely process.exit() race |
| IS SPA-005: 42 spans < 5ms | **TAZE-RUN1-8** | **1 run** | Low — taze architecture characteristic |

---

## §8. Score Projections for Run-14

### Conservative (no fixes land before run-14)

- **Quality**: 27/29 (93%) — SCH-003 and CDQ-006 likely to recur; schema types unchanged, isRecording guard pattern not in prompt
- **Files**: 14 (no new blockers anticipated)
- **Cost**: ~$4.50–5.50 (similar token profile to run-13)
- **IS Score**: ~60 (no SDK bootstrap changes)
- **Q×F**: ~13.0

### Target (P1 schema fix + P2 CDQ-006 prompt fix both land)

- **Quality**: 29/29 (100%) — both failures resolved
- **Files**: 14
- **Cost**: ~$4.50 — token profile unchanged
- **IS Score**: ~60–67 (RES-001 fix if P3 lands)
- **Q×F**: ~14.0

### Stretch (all fixes + IS bootstrap improvements)

- **Quality**: 29/29 (100%)
- **Files**: 14
- **IS Score**: ~80 (RES-001 fixed; SPA-001 granularity discussion resolved if span batching is adopted)
- **Q×F**: ~14.0

---

## §9. TypeScript-Specific Observations (Baseline)

Four patterns emerged that are TypeScript-specific and will likely recur in future TypeScript eval runs:

1. **NDS and RST dimensions are structurally clean**: TypeScript-specific patterns (`as const` for literal type preservation, `error instanceof Error ? error : new Error(String(error))` for strict-mode catch blocks) are handled correctly. No NDS or RST failures in this or any preceding taze run since the fixes landed.

2. **CDQ-006 affects more files than in JS runs**: taze's workspace functions aggregate counts via `reduce()` and `filter()` extensively. The isRecording guard pattern is likely to appear in 20–40% of committed files for any TypeScript CLI tool with similar architecture.

3. **Advisory judges over-fire on typed TypeScript**: The ~78% advisory contradiction rate (vs ~44% in JS) is a TypeScript-specific phenomenon. SCH-001 false positives (naming-convention similarity ≠ semantic equivalence) and CDQ-007 false positives (typed parameters flagged as nullable) will persist until the judges are calibrated for TypeScript's type guarantees.

4. **COV-002 exercises HTTP coverage newly**: taze's ofetch calls (resolves.ts, packument.ts) are the first time COV-002 (external HTTP calls enclosed in spans) has been exercised in this eval framework. Both pass. The advisory note about ofetch→undici auto-instrumentation overlap is handled correctly — manual spans provide domain context not available from auto-instrumentation.
