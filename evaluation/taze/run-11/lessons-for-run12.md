# Lessons for Run 12

---

## Pre-Run State for Run-11

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb build | ✅ | SHA: `0cd463214a3f4bb93fd03729e34ca3e15e1242c8` |
| `as const` NDS-003 normalization | ✅ | Fixed |
| Schema append-only writes | ✅ | Fixed |
| `if (span.isRecording())` allowlist | ✅ | Fixed |
| testCommand | ⚠️ | Was `pnpm test` — correct |
| taze started from clean main | ✅ | No skips from prior instrument branch |

---

## Run-11 Observations

- 32/33 files processed correctly — only `resolves.ts` failed
- 3 files rolled back incorrectly due to `resolves.test.ts` npm timeout
- Net 10 files in PR #6 branch

**Key insight**: OTel SDK never initializes during `pnpm test`. Timeout failures cannot be caused by our instrumentation. Test exclusions are wrong — they hide real signal.

---

## Carry-Forward Items for Run 12

### P1 — NDS-003 patterns for resolves.ts: FIXED in PR #676

Issue #675 shipped (SHA 5610e4a). Run-12 should commit `src/io/resolves.ts` cleanly.

### Checkpoint rollback behavior: STILL an issue

The end-of-run rollback incorrectly removes committed files when the failing test doesn't exercise any committed code. See `docs/spiny-orb-design-handoff.md` for the full design proposal. Not fixed before run-12 — accept that rollback may fire again if live npm is slow.

### testCommand

`pnpm test` — no exclusions. Accept rollbacks as data if they occur.

**Instrument command for run-12** (run from `~/Documents/Repositories/taze/`):
```bash
caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_TAZE node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-12/debug 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-12/spiny-orb-output.log'
```
