# Failure Deep-Dives — Run-12

**Run-12 result**: 12 committed, 0 failed, 1 partial, 17 correct skips.

No file-level failures. One partial commit due to Anthropic API overload. Run-level regressions documented below.

---

## Run-Level Observations

### Push Auth — STABLE

Second consecutive successful push:
- `GITHUB_TOKEN present=true`
- `urlChanged=true, path=token-swap` (URL swap mechanism fired)
- PR #61 created at https://github.com/wiggitywhitney/commit-story-v2/pull/61

The fine-grained PAT continues to work. No push auth issues this run.

### NDS-003 Truthy-Check Gap Expanded

PR #352 (run-11 fix) added `!== undefined`/`!= null` strict-equality patterns to the NDS-003 allowlist. Run-12 exposed that **truthy-check guards** (`if (value)`, `if (obj.property)`) are still flagged as non-instrumentation code.

Two files were affected in different ways:

| File | Guard Type | Agent Response | Outcome |
|------|-----------|----------------|---------|
| index.js | `if (context.chat)` | Dropped `commit_story.context.messages_count` attribute | Attribute missing from span |
| journal-manager.js | `if (commit.hash)`, `if (commit.author)` | Removed guards, sets unconditionally | May produce `undefined` attribute values |

Both outcomes are worse than the intended behavior (guard the attribute, set when present). The index.js outcome matches run-11 (same attribute dropped). The journal-manager.js outcome is new — instead of dropping the attribute, the agent removed the guards and now sets both attributes unconditionally. If `commit.hash` or `commit.author` are absent on the commit object, the span attributes will receive `undefined` values, which pollutes telemetry data and triggers CDQ-007.

**Root cause**: The NDS-003 validator classifies truthy-check `if` guards as non-instrumentation code additions. The agent cannot add `if (commit.hash)` without triggering NDS-003. The choice becomes: drop the attribute or risk setting `undefined`.

### summary-detector.js Partial — API Overload

utils/summary-detector.js was partially committed: 3/5 functions instrumented (getDaysWithDailySummaries, findUnsummarizedWeeks, findUnsummarizedMonths), 2 skipped (getDaysWithEntries, findUnsummarizedDays) due to Anthropic API returning `overloaded_error`:

```text
getDaysWithEntries: skipped — Anthropic API call failed: {"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}
findUnsummarizedDays: skipped — Anthropic API call failed: {"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}
```

This is an infrastructure reliability issue (single API provider, no fallback), not an agent design issue. The 3 successfully instrumented functions are valid. The 2 skipped functions were the first two processed, suggesting the overload hit at the start of the file's processing window.

Per lessons-for-prd13.md: "Future runs should treat API overload partials the same as clean commits for rubric scoring purposes." Quality rubric scores for summary-detector.js are assessed only on the 3 instrumented functions.

### summary-manager.js Span Count Regression (9 → 3)

Run-11 instrumented all 9 exported async functions in summary-manager.js. Run-12 instrumented only the 3 pipeline orchestrators (generateAndSaveDaily/Weekly/Monthly). The 6 skipped functions are:

| Skipped Function | Type | I/O |
|----------------|------|-----|
| readDayEntries | exported async | Reads journal entries from disk |
| saveDailySummary | exported async | Writes daily summary to disk |
| readWeekDailySummaries | exported async | Reads weekly summaries from disk |
| saveWeeklySummary | exported async | Writes weekly summary to disk |
| readMonthWeeklySummaries | exported async | Reads monthly summaries from disk |
| saveMonthlySummary | exported async | Writes monthly summary to disk |

The run-12 agent reasoned: "Only the 3 pipeline orchestrators were instrumented (3/14 = 21%) to stay near the ratio threshold. The 6 async helper functions are all called from within the pipeline spans and their I/O is covered through context propagation."

The "context propagation" argument is a legitimate observability design choice but **does not satisfy COV-004** as written. All 6 functions are exported AND async AND perform I/O — the rubric requires spans on each. The COV-004 advisory in the PR summary explicitly flagged all 6. This is a canonical COV-004 failure in run-12.

Run-11's 9-span approach was correct. The regression is a quality failure, not a deliberate architectural choice endorsed by the rubric.

### journal-graph.js — 3 Attempts Again

journal-graph.js regressed from 2 attempts (run-11) to 3 attempts (run-10 baseline). Run-12 output tokens for this file: 64.9K (highest of any committed file). Cost: $1.51 — 29% of total run cost.

The validator is catching issues on attempts 1 and 2. Without deeper analysis of the agent reasoning reports, the exact cause is unknown. The key impact is cost: each extra attempt adds ~$0.50 for this file.

### Cost Increase: $5.19

Total run cost based on PR summary per-file data:

| File | Cost |
|------|------|
| journal-graph.js | $1.51 |
| index.js | $0.67 |
| summary-graph.js | $0.59 |
| summary-manager.js | $0.55 |
| summary-detector.js (partial) | $0.45 |
| journal-manager.js | $0.39 |
| mcp/server.js | $0.22 |
| summarize.js | $0.20 |
| auto-summarize.js | $0.15 |
| claude-collector.js | $0.14 |
| context-integrator.js | $0.14 |
| git-collector.js | $0.12 |
| journal-paths.js | $0.06 |
| **Total** | **$5.19** |

**$5.19** — $0.94 more than run-11 ($4.25), $1.19 over target ($4.00). Primary drivers:
- journal-graph.js 3 attempts: $1.51 vs estimated $1.00 at 2 attempts
- index.js 2 attempts: $0.67 (high for a 1-span file; likely repeated retries on NDS-003 truthy-check issue)
- Output tokens 208.1K vs 158.7K in run-11 (+49.4K)

The high cached token count (498.7K) partially offsets raw output cost — retry passes re-read file content from cache at lower rates.

### Retry Files (7 files needed 2+ attempts)

| File | Attempts | Likely cause |
|------|----------|-------------|
| journal-graph.js | 3 | Large file, validator catches on attempts 1 and 2 |
| summary-graph.js | 2 | if-guard removal for NDS-003 compliance |
| index.js | 2 | NDS-003 truthy-check conflict on messages_count |
| journal-manager.js | 2 | NDS-003 truthy-check conflict on commit.hash/author |
| summary-manager.js | 2 | Large file, span ratio reasoning required |
| mcp/server.js | 2 | Attribute naming (service.name → project-namespaced keys) |
| summary-detector.js | 1 | Partial due to API overload, not retry |

All retry files recovered on the final attempt except summary-detector.js (API overload).
