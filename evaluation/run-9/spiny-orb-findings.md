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
| RUN9-3 | PR schema changes section omits span extensions | Medium | Missing 26 span names from schema section | New |
| RUN9-4 | instrumentation.js excluded from processing (29 not 30 files) | Low | Correct behavior but undocumented | New |
| RUN9-5 | Advisory contradiction rate 67% (improved from 91%, above 30% target) | Medium | COV-004 on MCP tools + SCH-004 bad semantic matches | Carried (partially fixed) |

## Carried from Run-8

| # | Run-8 # | Title | Run-9 Status |
|---|---------|-------|-------------|
| | RUN8-3 | Push auth validates read not write | Superseded by RUN9-1 (code merged but token not reaching process) |
| | RUN8-1 | Agent notes use bare rule codes without labels | Fixed (PR #265) |
| | RUN8-4 | Advisory contradiction rate ~91% | Partially fixed (67%) — see RUN9-5 |
| | RUN8-5 | journal-graph.js non-deterministic failure | Superseded by RUN9-2 (root cause: validator rejects extensions) |
| | RUN8-6 | COV-004 advisories flag sync functions | Partially fixed (CDQ-006 works, COV-004 still flags MCP tools) |
| | RUN8-7 | NDS-005 advisory false positive on index.js | Open (not filed) |
| | RUN8-2 | Verbose output lacks visual separation | Fixed (PR #265) |
