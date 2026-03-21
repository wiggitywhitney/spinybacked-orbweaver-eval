# Spiny-Orb Findings — Run-9

Findings from evaluation run-9 targeting **commit-story-v2 proper** (not the eval copy).

## Format

| # | Title | Priority | Impact | Status |
|---|-------|----------|--------|--------|
| RUN9-N | Title | Critical/High/Medium/Low | Description | New/Carried |

## Findings

| # | Title | Priority | Impact | Status |
|---|-------|----------|--------|--------|
| RUN9-1 | Push auth still fails — token-embedded URL swap not firing | Critical | No PR created (7th consecutive) |  New |
| RUN9-2 | Reassembly validator rejects extension span names (journal-graph.js) | High | Partial file, 91.4K wasted tokens | New |
| RUN9-3 | instrumentation.js excluded from processing (29 not 30 files) | Low | Correct behavior but undocumented | New |

## Carried from Run-8

| # | Run-8 # | Title | Run-9 Status |
|---|---------|-------|-------------|
| | RUN8-3 | Push auth validates read not write | Fixed (PRs #261, #272, #277) |
| | RUN8-1 | Agent notes use bare rule codes without labels | Fixed (PR #265) |
| | RUN8-4 | Advisory contradiction rate ~91% | Fixed (PR #271) |
| | RUN8-5 | journal-graph.js non-deterministic failure | Mitigated (PR #277 — diagnostics added) |
| | RUN8-6 | COV-004 advisories flag sync functions | Fixed (PR #288) |
| | RUN8-7 | NDS-005 advisory false positive on index.js | Open (not filed) |
| | RUN8-2 | Verbose output lacks visual separation | Fixed (PR #265) |
