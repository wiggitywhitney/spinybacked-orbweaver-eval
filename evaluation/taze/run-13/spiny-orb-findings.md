# spiny-orb Findings — taze Run 13

**Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md`

---

## No Blocking Issues

Run-13 produced 0 failures — the first perfect run across all 33 taze files.

All previous P1 blockers are resolved. No new spiny-orb issues surfaced.

---

## Observations (Non-Blocking)

### Pre-scan token use on trivially uninstrumentable files

Files 1 and 2 consumed LLM tokens despite being deterministically uninstrumentable:
- `src/addons/index.ts` — pure re-export, 0.2K tokens
- `src/addons/vscode.ts` — single synchronous utility function, 1.1K tokens

Both should be identifiable as correct-skips via AST analysis without any LLM call. This is not a blocker but represents an optimization opportunity in the pre-scan. Surfaced to the spiny-orb team separately.

### SCH-001 advisory working as designed

Multiple files received SCH-001 advisory suggestions and correctly evaluated them:
- `pnpmWorkspaces.ts` kept `taze.pnpm_workspace.load` over the suggested `taze.io.load_package` — different operation class, correct decision
- `packument.ts` used `taze.fetch.npm_package` and `taze.fetch.jsr_package` since `taze.fetch.package_data` was claimed by `resolves.ts`

The advisory mode allows agents to make informed decisions rather than being forced into incorrect name reuse.

---

## P3 — Low Priority

*(fill in during failure deep-dives milestone — trivial this run given 0 failures)*
