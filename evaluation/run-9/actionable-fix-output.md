# Actionable Fix Output — Run-9

Self-contained handoff from evaluation run-9 to the spiny-orb team.

**Run-9 result**: 25/25 (100%) canonical quality, 12 files committed, $3.97 cost in 43.7 minutes. First perfect quality score. Push failed (7th consecutive).

**Run-8 → Run-9 delta**: +8pp quality (92% → 100%), same files (12 → 12), -$0.03 cost ($4.00 → $3.97).

**Target repo**: commit-story-v2 proper (not the eval copy)
**Branch**: `spiny-orb/instrument-1774115750647` (local — push failed). PR summary at `spiny-orb-pr-summary.md`.

---

## §1. Run-9 Score Summary

| Dimension | Score | Run-8 | Delta | Failures |
|-----------|-------|-------|-------|----------|
| NDS | 2/2 (100%) | 2/2 | — | — |
| COV | 5/5 (100%) | 5/5 | — | — |
| RST | 4/4 (100%) | 4/4 | — | — |
| API | 3/3 (100%) | 2/3 | **+33pp** | — |
| SCH | 4/4 (100%) | 3/4 | **+25pp** | — |
| CDQ | 7/7 (100%) | 7/7 | — | — |
| **Total** | **25/25 (100%)** | **23/25** | **+8pp** | **0 failures** |
| **Gates** | **5/5** | **5/5** | — | — |
| **Files** | **12** | **12** | — | journal-graph.js partial (both runs) |

**Resolved**: API-004 (target repo has sdk-node in devDeps) and SCH-003 (dual-layer count type fix).

**Still failing**: Nothing — zero quality rule failures.

---

## §2. Remaining Quality Rule Failures (0)

None. All 25 quality rules pass on all 12 committed files.

---

## §3. Run-8 Findings Assessment

| # | Finding | Priority | Run-8 | Run-9 | Notes |
|---|---------|----------|-------|-------|-------|
| RUN8-3 | Push auth read vs write | Critical | FAIL | **STILL FAILING** | URL swap not firing — see §4 |
| RUN8-1 | Agent notes bare rule codes | Medium | Present | **FIXED** | Rule labels present in all notes |
| RUN8-4 | Advisory contradiction ~91% | Medium | 91% | **67%** | Improved but above 30% target |
| RUN8-5 | journal-graph.js oscillation | Medium | Partial | **Partial** | Root cause identified (see §4) |
| RUN8-6 | COV-004 flags sync functions | Low | Present | **PARTIALLY FIXED** | CDQ-006 trivial exemptions work, but COV-004 still flags MCP tool files |
| RUN8-7 | NDS-005 false positive on index.js | Low | Present | **STILL PRESENT** | NDS-005 advisory still fires on index.js (false positive) |
| RUN8-2 | Verbose output no separation | Low | No separation | **FIXED** | Visual separation between files |

**Summary**: 3/7 fully fixed, 1 partially fixed, 3 still present.

---

## §4. New Run-9 Findings

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN9-1 | Push auth: GITHUB_TOKEN not reaching pushBranch() | Critical | Delivery |
| RUN9-2 | Reassembly validator rejects extension span names | High | File coverage |
| RUN9-3 | PR schema changes section omits span extensions | Medium | PR summary |

### RUN9-1: Push Auth — GITHUB_TOKEN Not Reaching pushBranch()

**Evidence**: Error message shows bare `https://github.com/wiggitywhitney/commit-story-v2.git` URL. If the URL swap had fired, `sanitizeTokenFromError()` would show `x-access-token:***@`. The bare URL means `if (token)` at line 121 of `pushBranch()` was falsy — GITHUB_TOKEN was empty or undefined in the process.

**Fix**: Add diagnostic logging at the start of `pushBranch()`:
```typescript
console.log('pushBranch: GITHUB_TOKEN present:', !!process.env.GITHUB_TOKEN);
console.log('pushBranch: remote URL:', remoteUrl);
```

Then check:
1. Is the token actually in the environment? (vals injection vs process inheritance)
2. If yes, does `resolveAuthenticatedUrl()` produce a different URL?
3. If yes, does `git remote set-url --push` succeed?

**Acceptance criteria**: Push succeeds; PR created on GitHub.

### RUN9-2: Reassembly Validator Rejects Extension Span Names

**Evidence**: Diagnostic output: `SCH-001 check failed: "commit_story.journal.generate_sections" at line 601: not found in registry span definitions.`

The span IS declared in agent-extensions.yaml (`span.commit_story.journal.generate_sections`). The reassembly validator checks the base registry but not the extensions.

**Fix**: Make the reassembly validator's SCH-001 check resolve span names against the combined registry (base + agent-extensions.yaml). The extensions are already written to disk before reassembly validation runs.

**Acceptance criteria**:
1. journal-graph.js commits with extension span names
2. Reassembly SCH-001 uses resolved registry
3. journal-graph.js costs <20K output tokens (succeeds first attempt)

### RUN9-3: PR Schema Changes Section Omits Span Extensions

**Evidence**: Schema Changes section lists 10 added attributes but zero span extensions. The 26 span names are the primary schema contribution.

**Fix**: Include span extensions in the Schema Changes section alongside attributes.

**Acceptance criteria**: Schema Changes lists both attributes and spans.

### RUN9-6: CLI Telemetry Setup — Lessons from Live Validation

Live telemetry validation uncovered three interconnected issues with the instrumentation.js bootstrap pattern. Extensive troubleshooting documented below for future reference.

#### Issue 1: process.exit() prevents trace export

**Symptom**: Spans created (confirmed via `OTEL_LOG_LEVEL=debug` showing 15 `SpanImpl` objects) but zero traces in Datadog.

**Root cause**: commit-story's `index.js` calls `process.exit()` at the end of `main()`, which terminates the Node.js event loop immediately. The OTLP HTTP exporter's async export never completes.

**Troubleshooting steps taken**:
1. Confirmed OTel SDK loads (`OTEL_LOG_LEVEL=debug` shows diag/context/propagation registered)
2. Added `ConsoleSpanExporter` — showed all spans with correct names and attributes
3. Wrapped `exporter.export()` — confirmed it's called and returns `code=0` (success)
4. Checked Datadog Agent status — OTLP receiver enabled, port 4318 responding
5. Compared with `commit_story` (v1) which explicitly calls `await shutdownTelemetry()` before every `process.exit()` — that's why v1 works

**How commit_story v1 solves it** (file: `src/index.js` lines 470-528):

```javascript
// v1 pattern: explicit shutdown before exit
await telemetryInitialized;          // line 459 — wait for SDK to be ready
const exitCode = await main();       // line 462 — run the app
await shutdownTelemetry({ timeoutMs: 2000 }); // line 481 — flush spans
process.exit(exitCode);              // line 528 — safe to exit now
```

**Fix for --import bootstrap** (can't modify app code):

```javascript
// Intercept process.exit() in instrumentation.js
const originalExit = process.exit;
process.exit = (code) => {
  if (isShuttingDown) return originalExit.call(process, code);
  isShuttingDown = true;
  process.exitCode = code ?? 0;
  sdk.shutdown()
    .catch((err) => console.error('OTel SDK shutdown error:', err))
    .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
    .finally(() => originalExit.call(process, process.exitCode));
};
```

The 1-second delay after `sdk.shutdown()` ensures the final HTTP response is fully received before the process terminates.

#### Issue 2: BatchSpanProcessor delays export in short-lived processes

**Symptom**: Even with the `process.exit` interception, `BatchSpanProcessor` (the default) delays export by up to 5 seconds (`scheduledDelayMillis` default). For a CLI that runs in <5 seconds, spans accumulate in the batch but the timer never fires.

**Fix**: Use `SimpleSpanProcessor` for CLI targets. It exports each span immediately on `span.end()` (fire-and-forget with promise tracking). Performance overhead is negligible for the handful of spans a CLI invocation produces.

**SDK 2.x note**: A 4-year bug where `SimpleSpanProcessor.forceFlush()` didn't wait for pending exports was fixed in SDK 2.0.0 ([OTel JS #1841](https://github.com/open-telemetry/opentelemetry-js/issues/1841)). Since commit-story-v2 uses `@opentelemetry/sdk-node@^0.213.0` (SDK 2.x), this fix is available.

**cluster-whisperer uses the same pattern**: `disableBatch: true` in its traceloop initialization.

#### Issue 3: @traceloop auto-instrumentation breaks OTLP export via --import

**Symptom**: With `@traceloop/node-server-sdk` or individual `@traceloop/instrumentation-*` packages in the `--import` bootstrap, the OTLP exporter returns `code=0` for all spans but they never appear in Datadog. Without traceloop, 18 spans appear correctly.

**Extensive troubleshooting**:

1. **Tested individual instrumentations** (`@traceloop/instrumentation-langchain` + `@traceloop/instrumentation-mcp` via `NodeSDK.instrumentations`): export returns code=0, zero spans in Datadog.

2. **Tested `@traceloop/node-server-sdk`** (`traceloop.initialize()` pattern from cluster-whisperer): same result — code=0, zero spans in Datadog.

3. **Tested traceloop inline** (NOT via `--import`, same process): **works** — `test.traceloop` span appeared in Datadog. This proves the issue is specifically `--import` + traceloop, not traceloop itself.

4. **Tested NodeSDK without traceloop via `--import`**: **works** — 18 spans in Datadog.

5. **Checked for dual OTel API instances**: only one `@opentelemetry/api@1.9.0` — not the classic "no-op tracer" problem.

6. **Checked span content**: `ConsoleSpanExporter` shows identical spans with and without traceloop. No oversized `gen_ai.*` attributes (`traceContent: false`).

7. **Wrapped `exporter.export()`** in both configurations: both return `code=0` with identical span counts. The HTTP request succeeds in both cases.

**Root cause**: Dual `import-in-the-middle` versions. The traceloop packages declare `@opentelemetry/instrumentation@^0.203.0` while the SDK provides `0.213.0`. In pre-1.0 semver, `^0.203.0` does NOT satisfy `0.213.0`, so npm installs a separate copy. Each copy brings its own `import-in-the-middle` (v1.15.0 vs v3.0.0), each maintaining separate module-local ESM hook registries. This corrupts the ESM module loading pipeline when loaded via `--import`.

**How cluster-whisperer avoids this**: It initializes traceloop **inside the app code** (not via `--import`), which doesn't trigger the competing ESM hook registries.

**Fix (two-part)**:

1. **`--import` bootstrap**: Use `NodeSDK` + `SimpleSpanProcessor` + `OTLPTraceExporter` only. No traceloop packages. This handles manual spans and process.exit interception.

2. **In-app initialization** (separate PR, tracked as [commit-story-v2#53](https://github.com/wiggitywhitney/commit-story-v2/issues/53)): Initialize traceloop inside `index.js` (like commit_story v1's `initializeTelemetry()`) for LangChain/MCP auto-instrumentation. Gate behind a config flag.

**Verified working instrumentation.js** (committed on commit-story-v2):

```javascript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': 'commit-story',
    'service.version': pkg.version,
    'deployment.environment': process.env.NODE_ENV || 'development',
  }),
  spanProcessors: [new SimpleSpanProcessor(new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }))],
  // NOTE: @traceloop auto-instrumentation must be initialized in index.js,
  // not here. See commit-story-v2#53.
});
sdk.start();

// process.exit interception (see full code above)
```

#### Impact on spiny-orb setup documentation

spiny-orb's PR summary currently says:

> **Recommended Companion Packages**: `@traceloop/instrumentation-langchain`, `@traceloop/instrumentation-mcp` — add to your application's telemetry setup.

This needs to be more specific:

1. **CLI targets**: The `instrumentation.js` template should use `NodeSDK` + `SimpleSpanProcessor` + `process.exit` interception. Auto-instrumentation packages must be initialized **in the app code**, not in the `--import` bootstrap.

2. **Long-running services**: Can use `BatchSpanProcessor` (better network efficiency) and initialize traceloop in the `--import` bootstrap OR in-app — both work because there's no `process.exit` race.

3. **The PR summary should distinguish CLI vs service setup** and warn about the `--import` + traceloop ESM hook conflict.

4. **The `spiny-orb.yaml` config** should include a `targetType: cli | service` field so the instrumentation template can be generated correctly.

**Acceptance criteria**:
1. instrumentation.js template for CLI targets uses `SimpleSpanProcessor` + `process.exit` interception
2. instrumentation.js template warns that traceloop must be initialized in-app, not via `--import`
3. PR summary companion packages section includes setup guidance distinguishing CLI vs service
4. Traces from commit-story appear in Datadog APM (verified: 18 spans)
5. Documentation covers the dual `import-in-the-middle` gotcha for future debugging

### RUN9-7: PR Summary Should Be Committed on the Instrument Branch

**Evidence**: `spiny-orb-pr-summary.md` is written to the target repo's working directory as an untracked file. When push fails (7 consecutive times now), the summary is stranded — it's not on the instrument branch with the rest of the work, and could be accidentally deleted by `git clean` or a repo reset.

**Fix**: After generating the PR summary, commit it on the instrument branch before attempting push. This way the summary is preserved with the code changes regardless of whether push succeeds. When push eventually works, the summary is available for `gh pr create --body-file`.

**Acceptance criteria**: `spiny-orb-pr-summary.md` appears in `git log` on the instrument branch, not just as an untracked file in the working directory.

---

## §5. Priority Action Matrix

### P0 — Must fix for run-10

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Debug and fix GITHUB_TOKEN propagation to pushBranch() | RUN9-1 | Push succeeds, PR created on GitHub |
| Fix reassembly validator to check extensions | RUN9-2 | journal-graph.js commits with extension span names |

### P0 — Must fix for run-10 (continued)

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| CLI instrumentation template: SimpleSpanProcessor + process.exit interception | RUN9-6 | Traces reach Datadog from CLI apps |

### P1 — Should fix for run-10

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Fix COV-004 to understand sync-registration-of-async-callback pattern | RUN8-6 (partial) | MCP tool files don't generate COV-004 advisories |
| Fix SCH-004 semantic matching accuracy | RUN8-4 (partial) | generated_count not matched to gen_ai.usage.output_tokens |
| Include span extensions in PR schema changes | RUN9-3 | Both attributes and spans listed |
| Fix NDS-005 false positive on index.js | RUN8-7 | No false NDS-005 advisory on files with preserved try/catch |

### P2 — Nice to have

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Advisory contradiction rate <30% | RUN8-4 | Overall rate below target |

---

## §6. Run-10 Verification Checklist

1. Push auth: PR created successfully (check GITHUB_TOKEN diagnostic log)
2. journal-graph.js: committed (reassembly validator accepts extension span names)
3. Quality: 25/25 maintained (no regression from perfect score)
4. Files committed: ≥13 (journal-graph.js recovered)
5. Advisory contradiction rate: <30%
6. Schema changes section: includes span extensions
7. No NDS-005 false positive on index.js
8. Pre-run: verify spiny-orb on main, fresh build
9. Cost: ≤$4.00 (journal-graph.js should be cheaper with first-attempt success)
10. Test suite: 557+ tests pass, 0 failures

---

## §7. Score Projections for Run-10

### Minimum (P0 fixes only: push auth + reassembly validator)

- **Quality**: 25/25 (100%) maintained
- **Files**: 13 (journal-graph.js recovered)
- **Push/PR**: YES (if GITHUB_TOKEN fix works)
- **After 50% discount**: 25/25, 12-13 files, PR 50% likely

### Target (P0 + P1 fixes)

- All P0 fixes plus advisory improvements
- **Quality**: 25/25, **13 files**, PR created
- **Advisory rate**: <30%
- **After 50% discount**: 25/25, 12-13 files, PR likely

### Stretch (all fixes)

- **Quality**: 25/25, **13 files**, PR created, <10% advisory contradiction rate
- **After 50% discount**: 25/25, 13 files

### Calibration

Run-8 projected minimum 23-24/25 → actual 25/25. The 50% discount was conservative for quality (all projections exceeded). The discount correctly predicted journal-graph.js would oscillate but missed API-004 passing. For run-10, quality is likely stable at 25/25 — the main uncertainty is push auth (7 consecutive failures, but diagnostic logging will expose the root cause) and journal-graph.js (validator fix is deterministic, not LLM-dependent).
