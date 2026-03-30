# Per-File Evaluation — Run-11

**Date**: 2026-03-30
**Branch**: spiny-orb/instrument-1774849971011
**Rubric**: 32 rules (5 gates + 27 quality)
**Files evaluated**: 30 (13 committed + 17 correct skips)

---

## Gate Checks (Per-Run)

| Gate | Result | Evidence |
|------|--------|----------|
| NDS-001 (Syntax) | **PASS** | `node --check src/index.js` exits 0 |
| NDS-002 (Tests) | **PASS** | 564 tests pass, 1 skipped (acceptance gate, no API key) |

---

## Per-Run Rules

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 | **PASS** | @opentelemetry/api in peerDependencies at ^1.9.0 |
| API-003 | **PASS** | No vendor-specific SDKs in dependencies |
| API-004 | **PASS** | No SDK-internal imports in src/ (devDependencies only) |
| CDQ-008 | **PASS** | All 13 files use `trace.getTracer('commit-story')` consistently |

---

## Committed Files (13)

### 1. collectors/claude-collector.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

### 2. collectors/git-collector.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

### 3. commands/summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS — `force` declared as `type: boolean`, set as boolean value |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None. **SCH-003 boolean fix confirmed**: `commit_story.summarize.force` correctly declared as `type: boolean`.

### 4. generators/journal-graph.js (4 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| COV-006 | PASS — manual spans wrap application logic above auto-instrumented LangChain calls |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — gen_ai.usage.* attrs dropped to avoid optional chaining violation |

**Failures**: None

### 5. generators/summary-graph.js (6 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| COV-006 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS — entries_count is int, week_label/month_label are strings |
| CDQ-001 | PASS — early-exit span.end() + finally span.end() is redundant but not a violation (OTel spec: double-close is no-op) |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — uses ternary `entries ? entries.length : 0` instead of optional chaining |

**Failures**: None

### 6. index.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS — main() entry point has span |
| COV-003 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS — explicit span.end() before process.exit() is necessary (bypasses finally) |
| CDQ-002 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS — dropped messages_count to avoid CDQ-007/NDS-003 conflict |

**Failures**: None

### 7. integrators/context-integrator.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS — 0 new attributes, all from registry |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

### 8. managers/auto-summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS — 0 new attributes, all from registry |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

### 9. managers/journal-manager.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

### 10. managers/summary-manager.js (9 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS — `force` uses `options.force || false` to ensure boolean |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

### 11. mcp/server.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

### 12. utils/journal-paths.js (1 span)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

### 13. utils/summary-detector.js (5 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-006 | PASS |
| NDS-004 | PASS |
| NDS-005 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | PASS |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-007 | PASS |

**Failures**: None

---

## Correct Skip Verification (17 files)

All 17 skips verified correct — each file is sync-only, constant-only, or has no instrumentable entry points:

| File | Skip Reason | Correct |
|------|-------------|---------|
| prompts/guidelines/accessibility.js | String constant | YES |
| prompts/guidelines/anti-hallucination.js | String constant | YES |
| prompts/guidelines/index.js | Sync function | YES |
| prompts/sections/daily-summary-prompt.js | Sync function | YES |
| prompts/sections/dialogue-prompt.js | String constant | YES |
| prompts/sections/monthly-summary-prompt.js | Sync function | YES |
| prompts/sections/summary-prompt.js | Sync function | YES |
| prompts/sections/technical-decisions-prompt.js | String constant | YES |
| prompts/sections/weekly-summary-prompt.js | Sync function | YES |
| integrators/filters/message-filter.js | Sync functions | YES |
| integrators/filters/sensitive-filter.js | Sync functions | YES |
| integrators/filters/token-filter.js | Sync functions | YES |
| mcp/tools/context-capture-tool.js | Sync registration | YES |
| mcp/tools/reflection-tool.js | Sync registration | YES |
| traceloop-init.js | Config/setup | YES |
| utils/commit-analyzer.js | Sync utilities | YES |
| utils/config.js | Module-level config | YES |

---

## Summary

**Gates**: 5/5 PASS
**Quality failures**: 0
**All 13 committed files**: ALL PASS on all applicable rules
**All 17 skipped files**: All correctly skipped
**Total span names**: 39 (all unique, all follow commit_story.* convention)
**Tracer name**: 'commit-story' used consistently across all 13 files

### Key observations
- **SCH-003 PASS**: `commit_story.summarize.force` correctly declared as `type: boolean` (was `type: string` in run-10)
- **CDQ-007 PASS**: No `?.` in setAttribute value arguments. Agent either drops optional attrs or uses ternary guards
- **CDQ-001**: Two files (index.js, summary-graph.js) have redundant span.end() calls but this is not a violation per OTel spec
- **COV-005**: context-integrator.js and auto-summarize.js achieved 0 new attributes — 100% registry coverage
