# Lessons for Run 11

---

## Pre-Run State for Run-10

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb build | ✅ | SHA: `0699c515b2a8064e3a59561d1de866a480bd336d` |
| `if (span.isRecording())` allowlist | ✅ | Fixed — resolves.ts committed |
| `as const` prompt guidance | ✅ | Added — but NDS-003 still blocks it |
| taze branch at run start | ⚠️ | Was on run-9 instrument branch, not main |

---

## Run-10 Observations

- **resolves.ts** — ✅ Committed (6 spans). `if (span.isRecording())` fix confirmed working.
- **packageJson.ts** — ❌ NDS-003: `as const` catch-22 (same as run-9)
- **packageYaml.ts** — ❌ NDS-003: same
- **Schema integrity violations** — Agent removed 4 previously-committed schema attribute definitions when regenerating the semconv file

---

## Carry-Forward Items for Run 11

### P1 — NDS-003 normalize `as const`

Add to `normalizeLine()` in `nds003.ts`: strip `as const` before comparison so `type: 'package.json' as const,` equals `type: 'package.json',`.

### P2 — Schema integrity: agent rewrites schema file

Agent regenerated `attributes.yaml` without reading existing definitions. Fix: merge-append semantics when agents write schema files.

### Workflow note for Run 11

**Before running**: checkout taze `main` branch (not the instrument branch from run-10). The instrument branch accumulates; starting from main gives a clean baseline for each run's instrumentation decisions.

```bash
git -C ~/Documents/Repositories/taze checkout main
```

**Do not rerun until both P1 and P2 are confirmed on spiny-orb main.**
