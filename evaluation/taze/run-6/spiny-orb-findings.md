# spiny-orb Findings — taze Run 6

Issues surfaced during run-6. See `evaluation/taze/spiny-orb-handoff.md` for full details and fix recommendations.

---

## P1 — Blocking

### [P1] `console` not found (TS2584) — `@types/node` not auto-detected

`checkSyntax()` now reads `lib`/`types` from tsconfig, but taze declares no `types` field. TypeScript auto-discovers `@types/node` from `node_modules/@types/` when using the project tsconfig, but not in per-file mode. Node.js globals like `console` are undefined.

**Error**: `src/addons/vscode.ts(31,7): error TS2584: Cannot find name 'console'`

**Fix**: Detect `@types/node` in `node_modules/@types/node/` and add `node` to `--types` automatically when present.

**Affected files**: `src/addons/index.ts` (via import chain), `src/addons/vscode.ts`, and expected to affect most taze files.

### [P1] NDS-003 blocks null guards required for `span.setAttribute`

`options.mode` is typed `RangeMode | undefined`. Passing it directly to `setAttribute` fails tsc (TS2345: undefined not assignable to AttributeValue). Adding a null guard (`if (options.mode != null)`) triggers NDS-003 (non-instrumentation line).

Agent is explicitly stuck — both paths fail. Confirmed in run-6 attempt 3 agent thinking.

**Fix**: NDS-003 allowlist must permit `if (x != null) { span.setAttribute(key, x) }` patterns.

**Affected files**: `src/api/check.ts` and any file with optional typed options fields.

---

## P3 — Low Priority

*(fill in during failure deep-dives milestone)*
