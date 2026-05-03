# spiny-orb Findings — taze Run 11

**Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md`

---

## P1 — Blocking

### [P1] NDS-003: three unhandled instrumentation-motivated patterns (resolves.ts)

Filed as [issue #675](https://github.com/wiggitywhitney/spinybacked-orbweaver/issues/675). Fixed in PR #676 (SHA 5610e4a).

Three patterns in `src/io/resolves.ts` that are legitimate instrumentation additions but not recognized by NDS-003:

1. **Braceless `if` → braced**: `if (!cacheChanged)` → `if (!cacheChanged) {` — zero semantic change
2. **`await` in return capture**: `return Promise.all(...)` → `const result = await Promise.all(...)` — `reconcileReturnCaptures` doesn't strip `await` before comparing
3. **Renamed catch variable `throw`**: `throw spanError` — not matched by the `throw` pattern which only recognizes `throw err/error/e/ex`

---

## Infrastructure Findings (spiny-orb design, not taze instrumentation)

### End-of-run rollback incorrectly removed correctly-instrumented files

Three files (`yarnWorkspaces.ts`, `pnpmWorkspaces.ts`, `packument.ts`) were rolled back because `resolves.test.ts` timed out on a live npm call. The failing test exercised `resolves.ts` — a file that failed NDS-003 and was never committed. No committed file was in the failing test's call path.

**Root cause**: The rollback logic doesn't check whether the failing test actually exercises any committed instrumented file. A comprehensive design handoff covering this and related issues is at `docs/spiny-orb-design-handoff.md`.

### OTel SDK never initializes during checkpoint test runs

Verified: `pnpm test` (or `pnpm vitest run`) does not load the SDK init file. All `tracer.startActiveSpan()` calls are no-ops. Our instrumentation cannot cause timeout failures. Full analysis in `docs/spiny-orb-design-handoff.md`.

---

## P3 — Low Priority

*(fill in during failure deep-dives milestone)*
