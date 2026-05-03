# Run Summary — taze Run-10

**Date**: 2026-04-30
**Started**: 2026-04-30T11:12:23.284Z
**Duration**: 31m 56.2s
**Branch**: spiny-orb/instrument-1777547543284
**Spiny-orb build**: main (0699c515b2a8064e3a59561d1de866a480bd336d) — includes isRecording allowlist, as const prompt guidance
**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze)
**PR**: https://github.com/wiggitywhitney/taze/pull/5
**Note**: Run started from run-9's instrument branch (not taze main) — 9 files already-instrumented and skipped

---

## Results

| Metric | Value |
|--------|-------|
| Files discovered | 33 |
| Files processed | 19 of 33 (9 skipped as already instrumented) |
| Committed | 1 |
| Correct skips | 7 |
| Partial | 0 |
| Failed | 2 |
| Skipped (already instrumented) | 9 |
| Total tokens (input) | 76.1K |
| Total tokens (output) | 87.1K |
| Cached tokens | 141.9K |
| Live-check | OK (partial) |
| Push/PR | YES — PR #5 created |

---

## Committed File (1)

| File | Spans | Attributes | Notes |
|------|-------|------------|-------|
| src/io/resolves.ts | 6 | 2 | `if (span.isRecording())` fix worked — CDQ-006 guard now allowed |

`resolves.ts` is the largest and most complex file in taze — 6 spans covering cache load/dump, package data fetch, dependency resolution, and package resolution.

---

## Failed Files (2)

Both fail with the same NDS-003 `as const` catch-22:

- **src/io/packageJson.ts**: `type: 'package.json' as const` → NDS-003 flags it as modifying original line
- **src/io/packageYaml.ts**: `type: 'package.yaml' as const` → same

The agent correctly applies the new prompt guidance (`as const` on discriminant fields) but NDS-003 treats `as const` as a behavioral modification. Without it, NDS-001 fires (TypeScript literal type widening).

---

## Schema Integrity Violations (new finding)

```text
Warning: Schema integrity violation (registry_attributes): existing definition 
"taze.bun_workspace.catalogs_count" was removed
Warning: Schema integrity violation (registry_attributes): existing definition 
"taze.pnpm_workspace.catalogs_count" was removed
Warning: Schema integrity violation (registry_attributes): existing definition 
"taze.config.sources_count" was removed
Warning: Schema integrity violation (registry_attributes): existing definition 
"taze.yarn_workspace.catalogs_count" was removed
```

The run-10 agent regenerated the taze semconv schema file without the custom attributes added in run-9. The schema in the taze fork is accumulating definitions across runs, but each run's agent may rewrite it from scratch. The run-9 instrument branch had these definitions committed; run-10 removed them.

This needs investigation — see Finding J in `spiny-orb-findings.md`.

---

## Cumulative State (runs 9 + 10)

Combining committed files across runs:

| Source | Files | Spans |
|--------|-------|-------|
| Run-9 | 11 | 18 |
| Run-10 | 1 | 6 |
| **Total** | **12** | **24** |

Remaining: `packageJson.ts` (2 spans) and `packageYaml.ts` (4+ spans) — blocked on `as const` NDS-003 fix.

---

## Next Steps

Two spiny-orb fixes needed before run-11:
1. NDS-003 normalize `as const` (Finding I)
2. Schema integrity — agent schema rewriting (Finding J)
