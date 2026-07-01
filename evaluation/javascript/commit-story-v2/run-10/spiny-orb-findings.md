# Spiny-Orb Findings — Run-10

Findings from evaluation run-10 targeting **commit-story-v2 proper** (not the eval copy).

## Format

| # | Title | Priority | Impact | Status |
|---|-------|----------|--------|--------|
| RUN10-N | Title | Critical/High/Medium/Low | Description | New/Carried |

## Findings

| # | Title | Priority | Impact | Status |
|---|-------|----------|--------|--------|
| RUN10-1 | Push auth: URL swap works but token rejected by GitHub | Critical | No PR created (8th consecutive) | New |
| RUN10-2 | Weaver CLI fails mid-run on large accumulated registry | Medium | summary-manager.js failed (3 spans lost) | New |

### RUN10-1: Push Auth — Token Rejected by GitHub

**Evidence**: Diagnostic logging shows `GITHUB_TOKEN present=true`, `urlChanged=true, path=token-swap`. Push error: "Password authentication is not supported for Git operations."

The URL swap fix is now working — token IS embedded in the URL. But GitHub rejects the authentication. The GCP secret `github-token` may:
1. Lack `repo` write scope
2. Be a classic PAT when GitHub requires fine-grained tokens
3. Be expired or rotated

**Acceptance criteria**: Push succeeds; PR created on GitHub. Verify token scopes in GCP Secret Manager.

### RUN10-2: Weaver CLI Fails on Large Registry

**Evidence**: File 22/30 (summary-manager.js) — `weaver registry resolve` command failed after printing "Found registry manifest" but before completing resolution. By this point, 21 files had already written extensions to agent-extensions.yaml.

**Possible causes**: Registry size growth during the run causes Weaver CLI to fail. Not definitively sleep-related (user reports lid was open).

**Acceptance criteria**: Weaver CLI completes registry resolve for all 30 files without failure. Consider adding retry logic or chunked extension writes.

## Carried from Run-9

| # | Run-9 # | Title | Run-10 Status |
|---|---------|-------|---------------|
| | RUN9-1 | Push auth: GITHUB_TOKEN not reaching pushBranch() | **PARTIALLY FIXED** — token reaches pushBranch, URL swap fires, but token rejected by GitHub. Superseded by RUN10-1. |
| | RUN9-2 | Reassembly validator rejects extension span names | **FIXED** — journal-graph.js committed (PR #292) |
| | RUN9-3 | PR schema changes section omits span extensions | Pending verification (PR #319) — need to check PR summary content |
| | RUN9-5 | Advisory contradiction rate 67% | Pending verification — need per-file evaluation |
| | RUN9-7 | PR summary should be on instrument branch | **FIXED** — summary committed on branch (PR #316) |
