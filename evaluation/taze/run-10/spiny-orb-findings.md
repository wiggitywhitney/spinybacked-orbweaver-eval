# spiny-orb Findings — taze Run 10

---

## P1 — Blocking

### [P1] NDS-003 flags `as const` on discriminant fields — catch-22 with literal type widening

**Found in**: runs 9, 10 (confirmed — same 2 files both runs)

The new prompt guidance tells agents to add `as const` to string literal discriminant fields when returning from `startActiveSpan` callbacks. This is correct advice — without it, TypeScript widens the literal type and NDS-001 fires (TS2322). But NDS-003 sees `type: 'package.json' as const,` as a modification of the original `type: 'package.json',` and flags it.

```text
NDS-003: original line 60 missing/modified: type: 'package.json',
NDS-003: non-instrumentation line added at instrumented line 70: type: 'package.json' as const,
```

**Why this is safe to allow**: `as const` is a TypeScript type annotation. It has zero runtime effect. The compiled JavaScript output of `type: 'package.json'` and `type: 'package.json' as const` is identical. Treating them as different lines is a false positive.

**Required fix**: In `normalizeLine()` in `nds003.ts`, strip `as const` suffixes before comparison:

```typescript
function normalizeLine(line: string): string {
  return line
    .replace(/\}\s*catch\s*(?:\(\s*\w+\s*\))?\s*\{/, '} catch (error) {')
    .replace(/\s+as\s+const\s*([,;]?)$/, '$1');  // normalize "x as const," → "x,"
}
```

This makes `type: 'package.json' as const,` normalize to `type: 'package.json',` for comparison purposes — same as how catch variable bindings are normalized.

**Fix owner**: spiny-orb team — `normalizeLine()` in `src/languages/javascript/rules/nds003.ts`.

**Affected files**: `src/io/packageJson.ts`, `src/io/packageYaml.ts`.

---

## P2 — High Priority

### [P2] Agent rewrites semconv schema file from scratch, removing previously committed definitions

**Found in**: run-10

End-of-run warnings:

```text
Schema integrity violation: existing definition "taze.bun_workspace.catalogs_count" was removed
Schema integrity violation: existing definition "taze.pnpm_workspace.catalogs_count" was removed
Schema integrity violation: existing definition "taze.config.sources_count" was removed
Schema integrity violation: existing definition "taze.yarn_workspace.catalogs_count" was removed
```

The run-9 agent added these attribute definitions to `taze/semconv/attributes.yaml`. The run-10 agent, when processing a different file, regenerated the schema file from scratch without reading the existing definitions first. The schema integrity check caught the removals.

**Root cause**: Each run's agent reads the schema to understand what attributes exist, then proposes new ones. But when it writes back to the schema file (e.g., to add a new attribute), it may rewrite the entire file rather than appending. The agent writing a file it doesn't own (the schema) is the issue — it should only be able to append new entries, not replace existing ones.

**Impact**: The run-10 PR has incorrect schema state. The evaluation artifacts for run-10 are still valid (the instrumentation code itself is correct), but the schema file in the branch is regressed.

**Required fix**: The `schemaExtensions` mechanism needs to ensure that when an agent writes new schema entries, it reads the current file first and merges its additions rather than replacing. Or: prevent agents from writing the schema file at all — schema updates should be a post-processing step applied to the committed file contents.

**Fix owner**: spiny-orb team.

---

## P3 — Low Priority

*(fill in during failure deep-dives milestone)*
