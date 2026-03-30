# Failure Deep-Dives — Run-11

**Run-11 result**: 13 committed, 0 failed, 0 partial, 17 correct skips.

This is the first run with zero file-level failures. No failure deep-dives are needed for individual files.

---

## Run-Level Observations

### Push Auth — RESOLVED

After 8 consecutive failures (runs 3-10), push auth succeeded:
- `GITHUB_TOKEN present=true`
- `urlChanged=true, path=token-swap` (URL swap mechanism fired)
- PR #60 created at https://github.com/wiggitywhitney/commit-story-v2/pull/60

**Root cause of prior failures**: Token type/scope issues. The fix was a fine-grained PAT with Contents: read & write and Pull requests: read & write permissions on the commit-story-v2 repo. The URL swap mechanism (introduced in run-9, refined in run-10) was working correctly — the blocker was always the token itself.

### Retry Files (6 files needed 2 attempts)

| File | Likely retry cause |
|------|-------------------|
| journal-graph.js | Large file (24.8K output), validator catches on first attempt |
| summary-graph.js | Large file (29.8K output), removed if-guards for NDS-003 |
| index.js | Dropped optional messages_count to avoid CDQ-007/NDS-003 conflict |
| journal-manager.js | Medium file (12.5K output) |
| server.js | Small file but 2 attempts (3.7K output) |
| summary-detector.js | Medium file (13.1K output) |

All 6 recovered on the second attempt. No file needed 3+ attempts (journal-graph.js was 3 in run-10, now 2 — improvement).

### CDQ-007 Attribute Dropping Pattern

The CDQ-007 fix created an interesting side effect: the agent drops attributes rather than risk optional-chaining violations:

1. **index.js**: Dropped `commit_story.context.messages_count` because `context.chat` is optional and guarding with `if` would trigger NDS-003
2. **journal-graph.js**: Dropped `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens` because if-guards around optional chaining trigger NDS-003

This is a **CDQ-007/NDS-003 conflict**: the agent can't safely set optional attributes without adding guard code that the NDS-003 validator treats as non-instrumentation changes. The agent resolves this by dropping the attribute entirely — correct per rules but reduces attribute completeness.

### summary-graph.js Ternary Workaround

The agent found a creative workaround for the CDQ-007/NDS-003 conflict: using inline ternary expressions instead of if-guards:
```javascript
span.setAttribute('entries_count', entries ? entries.length : 0);
```

This avoids both violations — no optional chaining (`?.`) and no multi-line if-guard. However, it sets `0` when the source is undefined, which may be semantically misleading (0 entries vs unknown entries). Needs rubric assessment.

### summary-manager.js Recovery

summary-manager.js failed in run-10 due to a Weaver CLI transient error (registry resolve failure). In run-11 it succeeded on first attempt with 9 spans — the most spans of any file. The Weaver CLI retry logic (added in dispatch.ts PR #341) likely prevented the transient failure, though it's also possible the failure simply didn't recur.

### is_merge Attribute Absent

Run-10 had `commit_story.commit.is_merge` set in git-collector.js and index.js (declared as `type: string`, triggering SCH-003). In run-11, the agent didn't set `is_merge` at all — it doesn't appear in any instrumented file or in agent-extensions.yaml. The boolean type fix is confirmed working for `force` but untested for `is_merge` (the agent avoided the attribute entirely this run).
