# spiny-orb Findings — taze Run 7

**Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md`

---

## P1 — Blocking

### [P1] NDS-003 blocks span lifecycle catch/finally pattern

**Found in**: runs 5, 7 (confirmed blocker)

The NDS-003 validator flags `catch (error) {`, `throw error`, and `finally {` as non-instrumentation lines when they're added to functions that didn't originally have try/catch/finally blocks. These lines are required for correct span lifecycle management:

```typescript
return tracer.startActiveSpan('taze.check', async (span) => {
  try {
    // original body
  } catch (error) {             // ← NDS-003 flags this
    span.recordException(...);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;                // ← NDS-003 flags this
  } finally {                   // ← NDS-003 flags this
    span.end();
  }
});
```

**The catch-22**: The agent cannot add error recording without triggering NDS-003. It cannot omit the catch block without losing error recording (violating COV-003/CDQ-001).

**Agent workaround found**: In `cli.ts`, the agent worked around NDS-003 by placing `setAttribute` inside an EXISTING `if (mode)` block and using `?? false` for boolean optionals. But for functions needing full error recording (`check.ts`, `checkGlobal.ts`), there is no workaround — a new catch block is required.

**Required fix**: Extend the NDS-003 allowlist to permit the span lifecycle pattern contextually:

- Allow `catch (error) {` when the catch block contains `span.recordException`
- Allow `throw error` inside a catch block that contains `span.recordException`
- Allow `finally {` when the finally block contains `span.end()`

This is the **contextual approach** — stricter than a blanket allowlist, and prevents an agent from using the allowlist to sneak in behavior-changing catch blocks that don't contain span calls.

**Implementation location**: `src/fix-loop/refactor-detection.ts` (or wherever NDS-003 diff analysis lives) and `src/languages/javascript/rules/nds003.ts`.

**Affected files in run-7**: `src/api/check.ts`, `src/cli.ts`, `src/commands/check/checkGlobal.ts`. Expected to affect most taze files with I/O that need error recording.

---

## P3 — Low Priority

*(fill in during failure deep-dives milestone)*
