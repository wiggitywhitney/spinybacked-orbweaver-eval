# spiny-orb Findings — taze Run 9

**Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md`

---

## P1 — Blocking

### [P1] NDS-001: `startActiveSpan` causes TypeScript literal type widening on discriminant fields

**Found in**: run-9 (`src/io/packageJson.ts`, `src/io/packageYaml.ts`)

When a function returns an object literal with a string discriminant field (e.g., `type: 'package.json'` in a discriminated union), TypeScript infers it as the string literal type. But when the return is wrapped inside a `startActiveSpan` async callback, TypeScript widens it to `string`, breaking the discriminated union assignment:

```text
TS2322: Type 'string' is not assignable to type '"package.yaml"'.
```

The original function compiles fine. Wrapping the identical body in `startActiveSpan` causes the regression.

**Root cause**: TypeScript's literal type inference is context-sensitive. In a direct return, the type is inferred from the expected return type of the function. Inside an async callback passed to a generic, the expected type may not propagate fully, causing widening.

**Fix options** (choose one):

1. **Agent prompt guidance** (simpler): Add to the TypeScript prompt — when wrapping a function that returns an object literal used in a discriminated union, add `as const` to string literal fields or cast the return value: `return [...] as PackageMeta[]`. This is the same pattern as the `instanceof Error` guidance — a TypeScript-specific constraint the agent must know.

2. **`checkSyntax()` fix** (alternative): Pass `--noImplicitAny` or adjust the generic inference flags. Less reliable — this is a TypeScript behavior issue, not a flag issue.

**Recommended**: Option 1 (prompt guidance). Add to `src/languages/typescript/prompt.ts`.

**Affected files in run-9**: `src/io/packageJson.ts`, `src/io/packageYaml.ts`.

---

### [P1] NDS-003 blocks `if (span.isRecording()) {` guard

**Found in**: run-9 (`src/io/resolves.ts`)

The CDQ-006 rule recommends wrapping expensive span attribute computations in `if (span.isRecording()) {` to avoid the overhead when no exporter is listening. The agent correctly added this guard in `resolves.ts` around a `resolved.filter()` call. NDS-003 flagged it as a non-instrumentation line.

```text
NDS-003: non-instrumentation line added at instrumented line 431: if (span.isRecording()) {
```

`if (span.isRecording()) {` is a well-known OTel performance pattern and unambiguously instrumentation code.

**Required fix**: Add to `INSTRUMENTATION_PATTERNS` in `src/languages/javascript/rules/nds003.ts`:

```javascript
/^\s*if\s*\(\s*(?:span|otelSpan)\.isRecording\(\)\s*\)\s*\{?\s*$/,
```

**Fix owner**: spiny-orb team.

---

## P3 — Low Priority

*(fill in during failure deep-dives milestone)*
