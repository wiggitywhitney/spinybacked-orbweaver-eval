# Pre-Run Expectations — Run-7

**Spiny-orb version**: 0.1.0 (build 2026-03-20 15:33, commit 7fe4dd8)
**Registry state**: 0 span definitions (sparse-registry advisory mode active)
**Key fixes verified**: SCH-001 advisory downgrade, COV-003 all 4 boundary patterns, push auth (GITHUB_TOKEN + --head), NDS-003 return-value capture, RST-004/COV-004 precedence, tally accuracy, PR summary post-validation

## Fix Approach Change

PRD #7 assumed registry expansion (≥8 span definitions). Spiny-orb team chose validator tolerance instead: sparse-registry detection (<3 spans → SCH-001/SCH-002 advisory) + declared-extension passthrough. The agent must now invent semantically correct span names.

## File Recovery Expectations

29 source files total. Run-6 outcomes: 5 committed, 14 correct skip, 3 debatable skip, 6 partial, 1 persistent failure.

### Expected to Recover (partial/failed → committed)

| File | Run-6 Status | Blocking Issue | Fix Applied | Expected Run-7 | Confidence |
|------|-------------|---------------|-------------|----------------|------------|
| journal-manager.js | Partial (9/10) | SCH-001 sole blocker | SCH-001 advisory | Committed | High |
| journal-graph.js | Partial (10/12) | SCH-001 | SCH-001 advisory | Committed | Medium |
| summary-graph.js | Partial (13/15) | SCH-001 | SCH-001 advisory | Committed | Medium |
| summarize.js | Partial (7/8) | SCH-001 + COV-003 boundary | Both fixed | Committed | Medium |
| summary-detector.js | Partial (5/11) | SCH-001 | SCH-001 advisory | Committed | Medium |
| auto-summarize.js | Partial (1/3) | SCH-001 + validation | SCH-001 advisory | Committed | Medium |
| index.js | 0 spans (COV-001) | COV-003 boundary + SCH-001 | Both fixed | Committed | Medium |

### Expected to Recover (regressed → committed)

| File | Run-6 Status | Blocking Issue | Fix Applied | Expected Run-7 | Confidence |
|------|-------------|---------------|-------------|----------------|------------|
| journal-paths.js | Debatable skip (SCH-001) | SCH-001 forced removal | SCH-001 advisory | Committed | High |
| auto-summarize.js | Regressed from run-5 | SCH-001 + stricter validation | SCH-001 advisory | Committed | Medium |

### Expected Stable (committed → committed)

| File | Run-6 Status | Notes |
|------|-------------|-------|
| claude-collector.js | Committed | Should keep committed; span name quality may improve |
| git-collector.js | Committed | RST-004 was flagged; should improve with precedence fix |
| context-integrator.js | Committed | Span name was wrong (SCH-001); should now be semantically correct |
| summary-manager.js | Committed (recovered in run-6) | Verify NDS-005, CDQ-003, RST-001 hold |
| server.js | Committed | COV-005 zero attributes was flagged; prompt reinforcement applied |

### Debatable Skips to Watch

| File | Run-6 Status | Issue | Expected |
|------|-------------|-------|----------|
| context-capture-tool.js | Debatable skip | RST-004/COV-004 tension | Should commit with RST-004 precedence clarified |
| reflection-tool.js | Debatable skip | RST-004/COV-004 tension | Should commit with RST-004 precedence clarified |

### Expected Correct Skips (14 files)

config.js, all prompt files (7), all filter files (3), commit-analyzer.js, instrumentation.js — no spans expected, should remain correct skips.

## Score Projections (with 50% discount)

### Raw Projection (before discount)

- **SCH-001**: PASS (advisory mode, not blocking)
- **COV-001**: PASS (index.js COV-003 boundary fixed)
- **COV-005**: Likely PASS (prompt reinforcement for attributes)
- **RST-004**: PASS (precedence rule clarified)
- **Files**: 12-15 committed (7 partial recover + 5 stable + 2 debatable)
- **Score**: 25/25 (100%)

### After 50% Discount (dominant blocker peeling)

- **Expected score**: 22-24/25 (88-96%)
- **Expected files**: 8-12 committed
- **Key risk**: New blocker emerges behind SCH-001 — unknown unknown
- **Secondary risk**: Agent invents poor span names (semantic quality without registry guidance)

## Verified Fixes vs Still Open

### Verified Fixed (16/16 run-6 findings)

All 16 run-6 findings have merged PRs. None rejected by spiny-orb team.

### Still Open (from prior runs)

| Item | Origin | Status |
|------|--------|--------|
| CJS require() in ESM projects | Run-2 #62 | Open spec gap, not triggered recently |
| Elision/null output bypass retry | Run-2 #63 | Likely improved, not directly tested |
| Spec gaps (#66-69) | Run-2 | Open |

## Superficial Resolution Tracking

For files recovering from partial/failed → committed, verify:
- **NDS-005**: No exception recording for expected conditions
- **CDQ-003**: Clean catch blocks (no unnecessary error handling)
- **RST-001**: Only exported functions instrumented

Run-6 validated this methodology on summary-manager.js. Expand sample to all newly recovered files.

## Validator-Evaluator Alignment (Step 13)

SCH-001 conflict between validator and evaluator is now moot — validator downgrades to advisory for sparse registries. The evaluator should assess semantic quality of agent-invented span names rather than strict registry conformance.
