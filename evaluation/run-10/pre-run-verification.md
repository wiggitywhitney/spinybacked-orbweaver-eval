# Pre-Run Verification — Run-10

## Handoff Triage Review

**Score: 7/7 addressed, 0 rejected.**

| Finding | Issue | PRs Merged | Status |
|---------|-------|------------|--------|
| RUN9-1 Push auth token propagation | #295 | #296, #303 | **Fixed** — remote URL swap (set pushurl in git config) + diagnostic logging at validation + push time |
| RUN9-2 Reassembly validator extensions | #291 | #292 | **Fixed** — extensions passed to all 3 validation paths (main, reassembly, partial) |
| RUN9-3 PR schema changes omits spans | #311 | #319 | **Fixed** — dedicated "Span Extensions" section + column in summary table |
| RUN9-5 Advisory contradictions 67% | #310, #284 | #322, #288 | **Fixed** — NDS-005 fallback matching, COV-004 callback pattern, SCH-004 domain-aware judge |
| RUN9-6 CLI telemetry setup | #309 | #313 | **Fixed** — targetType config (short-lived/long-lived), setup guide, companion packages guidance |
| RUN9-7 PR summary on branch | #312 | #316 | **Fixed** — commit summary file before push attempt |
| Bonus: output discoverability | #299 | #306 | **Fixed** — companion file paths + prominent PR summary in output |

## Target Repo Readiness (commit-story-v2)

| Check | Status |
|-------|--------|
| Branch | `main` |
| Working tree | Journal entries + leftover `spiny-orb-pr-summary.md` from run-9 (non-blocking) |
| `spiny-orb.yaml` | Present |
| `semconv/` | Present |
| `@opentelemetry/sdk-node` | In devDependencies (API-004 should PASS) |
| `@opentelemetry/api` | In peerDependencies (correct for library) |
| File count | 30 .js files (29 processed — instrumentation.js excluded) |

## Push Auth Verification (Critical)

**Mechanism**: Remote URL swap — `pushBranch()` reads `process.env.GITHUB_TOKEN`, embeds it in the remote URL as `https://x-access-token:<TOKEN>@github.com/...`, sets `remote.origin.pushurl` via git config, pushes using named remote, then restores original pushurl in finally block.

**Diagnostic logging**: At validation time (`GITHUB_TOKEN present=<bool>`) and at push time (`GITHUB_TOKEN present=<bool>, remote=<url>`, `urlChanged=<bool>, path=<token-swap|bare-push>`).

**Assessment**: This is a fundamental mechanism change from run-9. The old code passed the URL directly to `git.push()` which didn't work reliably in `vals exec` subprocesses. The config-based approach (setting pushurl) is standard Git practice and should work regardless of subprocess environment.

**Confidence**: High. The fix addresses the specific failure mode (token not reaching URL swap). Diagnostic logging will confirm even if it fails.

## Reassembly Validator Verification (Critical)

**Mechanism**: SCH-001 validator now accepts declared extensions alongside base registry span names. Extensions are collected from successful functions and passed to reassembly validation via `declaredSpanExtensions` config. Prefix normalization handles `span:` vs `span.` variants.

**Assessment**: The fix is deterministic — a code change, not an LLM behavior change. journal-graph.js should commit on first attempt because its extension span names will be recognized by the validator.

**Confidence**: High. Test coverage includes extension resolution, prefix normalization, and mixed registry+extension scenarios.

## Advisory Fixes

| Fix | Mechanism | Assessment |
|-----|-----------|------------|
| COV-004 callback pattern | Async callbacks passed as arguments to `registerTool()` are not top-level variable-assigned functions, so never flagged | Should eliminate MCP tool false positives |
| NDS-005 false positive | Fallback matching with catch-clause content comparison for non-throwing catches | Should eliminate index.js false positive |
| SCH-004 semantic matching | Domain-aware judge prompt — application attributes are not OTel semantic convention duplicates | Should prevent `generated_count` → `gen_ai.usage.output_tokens` matches |

## Spiny-Orb Build

- **Version**: spiny-orb v0.1.0
- **Branch**: main
- **Commit**: 75dcea6 (Merge PR #322 — NDS-005 fallback + COV-004 callback tests)
- **Build**: Clean TypeScript compilation

## File Recovery Predictions (with 50% discount)

| Prediction | Raw | After 50% Discount |
|-----------|-----|-------------------|
| Quality score | 25/25 (100%) | 25/25 (no regression mechanism) |
| Files committed | 13 (journal-graph.js recovered) | 12-13 |
| Push auth / PR | YES (mechanism change) | 50% likely |
| Advisory contradiction rate | <20% | <30% |
| Cost | ≤$3.00 (journal-graph.js first-attempt) | ≤$4.00 |

### File-by-file Predictions

| File | Run-9 | Prediction | Rationale |
|------|-------|------------|-----------|
| claude-collector.js | C | C | Stable 6 runs |
| git-collector.js | C | C | Stable 6 runs |
| summarize.js | C | C | Stable 4 runs |
| summary-graph.js | C | C | Stable 4 runs |
| index.js | C | C | Stable 6 runs |
| context-integrator.js | C | C | Stable 4 runs |
| auto-summarize.js | C | C | Stable 4 runs |
| journal-manager.js | C | C | Stable 6 runs |
| summary-manager.js | C | C | Stable 4 runs |
| server.js | C | C | Stable 6 runs |
| journal-paths.js | C | C | Stable 4 runs |
| summary-detector.js | C | C | Stable 4 runs |
| **journal-graph.js** | **P** | **C** | Reassembly validator fix (deterministic) |
| 16 correct skips | S | S | Stable |

C = committed, P = partial, S = correctly skipped

### Run-9 Findings Status

| # | Finding | Verified Fixed | Notes |
|---|---------|---------------|-------|
| RUN9-1 | Push auth token propagation | YES | Remote URL swap + diagnostics |
| RUN9-2 | Reassembly validator extensions | YES | Extensions passed to all validation paths |
| RUN9-3 | PR schema changes omits spans | YES | Dedicated span extensions section |
| RUN9-5 | Advisory contradictions 67% | YES | NDS-005 + COV-004 + SCH-004 fixes |
| RUN9-6 | CLI telemetry setup | YES | targetType config + setup guide |
| RUN9-7 | PR summary on branch | YES | Committed before push |
