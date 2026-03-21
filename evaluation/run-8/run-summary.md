# Run-8 Summary

## Execution Details

- **Started**: 2026-03-21T09:19:11.105Z
- **Completed**: 2026-03-21T10:00:03.384Z
- **Duration**: 2452.3s (~41 minutes)
- **Branch**: `spiny-orb/instrument-1774084751105`
- **Spiny-orb version**: v0.1.0, commit `8dd2540` (main)
- **Config**: `spiny-orb.yaml`

## Results

| Metric | Run-8 | Run-7 | Delta |
|--------|-------|-------|-------|
| Files processed | 29 | 29 | — |
| Committed | 12 | 13 | -1 |
| Failed | 0 | 0 | — |
| Partial | 1 | 0 | +1 |
| Correct skips | 16 | 16 | — |
| Total spans | 26 (committed) | ~35 | -9 |
| Schema extensions (spans) | 29 (incl. 3 from partial) | — | — |
| Schema extensions (attributes) | 11 | — | — |
| Input tokens | 103.5K | — | — |
| Output tokens | 166.9K | — | — |
| Cached tokens | 344.9K | — | — |
| Push/PR | Failed (6th) | Failed (5th) | Still broken |

## File Outcomes

### Committed (12 files, 26 spans)

| File | Spans | Attempts | Output Tokens |
|------|-------|----------|---------------|
| claude-collector.js | 1 | 1 | 3.8K |
| git-collector.js | 2 | 1 | 3.8K |
| summarize.js | 3 | 1 | 8.6K |
| summary-graph.js | 3 | 1 | 13.9K |
| index.js | 1 | 1 | 8.6K |
| context-integrator.js | 1 | 1 | 5.5K |
| auto-summarize.js | 3 | 1 | 6.2K |
| journal-manager.js | 2 | 1 | 7.8K |
| summary-manager.js | 3 | 1 | 14.9K |
| server.js | 1 | 1 | 2.3K |
| journal-paths.js | 1 | 1 | 3.2K |
| summary-detector.js | 5 | 2 | 13.9K |

### Partial (1 file)

| File | Spans | Attempts | Output Tokens | Reason |
|------|-------|----------|---------------|--------|
| journal-graph.js | 3 | 3 | 70.4K | Reassembly validation failed |

### Correct Skips (16 files, 0 spans)

| File | Output Tokens | Reason |
|------|---------------|--------|
| accessibility.js | 0.3K | String constant, no functions |
| anti-hallucination.js | 0.4K | String constant, no functions |
| guidelines/index.js | 0.0K | Sync only |
| daily-summary-prompt.js | 0.0K | Sync only |
| dialogue-prompt.js | 1.5K | String constant |
| monthly-summary-prompt.js | 0.0K | Sync only |
| summary-prompt.js | 0.0K | Sync only |
| technical-decisions-prompt.js | 1.0K | String constant |
| weekly-summary-prompt.js | 0.0K | Sync only |
| message-filter.js | 0.0K | Sync only |
| sensitive-filter.js | 0.0K | Sync only |
| token-filter.js | 0.0K | Sync only |
| context-capture-tool.js | 0.0K | Sync only |
| reflection-tool.js | 0.0K | Sync only |
| commit-analyzer.js | 0.0K | Sync only |
| config.js | 0.6K | No functions, exported constant |

## Push Auth Failure (6th Consecutive)

**Error**: `Pushing to https://github.com/wiggitywhitney/commit-story-v2-eval.git` — `remote: Invalid username or token. Password authentication is not supported for Git operations.`

**Analysis**: GITHUB_TOKEN was present (fail-fast did not trigger). Token-embedded URL validation passed. But push still failed. The error "Password authentication is not supported" from GitHub suggests either:
1. Git sanitized the token from the display URL but the token was actually embedded and rejected (expired or wrong scope)
2. The push code path isn't embedding the token despite validation succeeding
3. The token has read scope but not write scope

The fail-fast fix (PR #251) improved behavior for missing tokens but doesn't catch tokens with insufficient write permissions. The validation uses `git ls-remote` (a read operation) even with the token-embedded URL.

## Regression

- **journal-graph.js**: Committed in run-7 (4 spans, 1 attempt) → Partial in run-8 (3 spans, 3 attempts, reassembly validation failed). This is the only regression.

## Improvements

- **COV-006 RESOLVED**: All 29 span names are unique across files. The collision prevention prompt injection worked — auto-summarize.js and summary-manager.js both invented unique names.
- **Agent notes improved**: 3-5 notes per file instead of verbose compliance checklists. Notes are more focused on judgment calls.
- **Companion .instrumentation.md files**: Generated for all 29 files.

## Still Failing

- **CDQ-005**: All 6 count attributes declared as `type: string` in agent-extensions.yaml. Code uses `String()` wrapping. Prompt-only fix insufficient — agent follows schema type over SCH-003 guidance.
- **API-004**: `@opentelemetry/sdk-node` still in target project peerDependencies (pre-existing).
