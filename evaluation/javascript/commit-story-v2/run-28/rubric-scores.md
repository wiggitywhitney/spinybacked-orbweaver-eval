// ABOUTME: Rubric scores for run-28 — dimension-level synthesis from per-file, failure-deep-dive, and PR evaluations.
# Rubric Scores — Run-28

**Synthesis date**: 2026-09-17 (dimension scoring completed same day as the run; run executed 2026-09-17, per-file evaluation completed 2026-09-17 — see `run-summary.md` and `per-file-evaluation.md` respectively)
**Branch**: `spiny-orb/instrument-1789648132789`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/95

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — `node --check` exits 0 on all 13 committed/partial files, zero syntax failures |
| NDS-002 (Tests) | Per-run | **PASS** — 630 tests pass, 1 skipped (acceptance-gate test requiring a live API key), run directly against the instrument branch tip |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — 13/13 committed/partial files |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — 13/13 files |
| NDS-006 (Module system) | Per-file | **PASS** — no module system changes across any file |

**Gates: 5/5 PASS**

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 13/13 — no function signatures altered anywhere, including the partial file's 3 committed functions |
| NDS-007 (Control Flow Preserved) | **PASS** | 13/13 — every original catch (ENOENT graceful-degradation, per-item accumulation catches) left unmodified; only outer span-wrapper catches gained `recordException`/`setStatus` |

### Coverage (COV): 5/5 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| COV-001 (Entry points have spans) | **PASS** | All 12 committed files instrument their exported async entry points; `summarize.js`'s 3 span-eligible functions (all it has) all committed cleanly |
| COV-003 (Failable ops have error visibility) | **PASS** | RUN27-1 confirmed resolved — `summary-manager.js` committed all 9 span-eligible functions with correct error recording in every catch; no COV-003 rejection anywhere this run |
| COV-004 (Async ops have spans) | **PASS** | All exported async I/O functions across the 12 fully-committed files are spanned. `context-capture-tool.js` and `reflection-tool.js` both have a self-identified-and-declined COV-004 gap (`saveContext`/`saveReflection`), but per run-27's own precedent, unscored files with no committed code are Watch Items, not COV-004 rubric failures |
| COV-005 (Domain attributes present) | **PASS** | All 12 committed + 1 partial files carry ≥1 meaningful domain attribute per span, confirmed against source (and live traces for 4 of the run's finding-bearing files) |
| COV-006 (Auto-instrumentation preferred) | **PASS** | `@traceloop/instrumentation-langchain` used correctly in `journal-graph.js` and `summary-graph.js`; manual spans establish context around, not duplicate, the auto-instrumented LLM call boundary |

**COV improvement note**: Up from run-27's 4/5 (80%) — RUN27-1's COV-003 partial-commit regression on `summary-manager.js` is confirmed resolved this run, restoring COV to a clean sweep for the first time since run-26.

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | All sync helpers excluded across the 12 committed + 1 partial files |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 13/13 — unexported sync helpers excluded per RST-001; `summary-manager.js`'s `_hasRealSummary` (unexported async) correctly exempt |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in `peerDependencies` at `^1.9.0` |
| API-003 (No vendor SDKs) | **PASS** | No vendor observability packages in production dependencies |
| API-004 (No SDK imports) | **PASS** | No file in `src/` imports `@opentelemetry/sdk-*`/`exporter-*`/`resources`; `@opentelemetry/instrumentation-pino` is a legitimate production auto-instrumentation dependency |

### Schema Fidelity (SCH): 2/4 (50%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | All new span names declared as schema extensions under the existing `commit_story.<domain>.<action>` convention; advisory-only span-name-similarity flags dismissed correctly by the agent's own reasoning where they appeared |
| SCH-002 (Attribute keys match registry) | **FAIL** | `commands/summarize.js` — `commit_story.summary.dates_requested` is declared by `runSummarize` for a date-range count, then reused for a week count (`runWeeklySummarize`) and a month count (`runMonthlySummarize`) within the same instrumentation pass. Unlike run-27, the validator correctly rejected the reassembly on both sites — but the semantic violation remains live in the committed partial file, confirmed by direct source inspection |
| SCH-003 (Attribute types correct) | **FAIL** | 5 files, wider than any prior run — every instance is a declared-vs-emitted type mismatch on a key the agent invents in that file. Per `run-summary.md`'s established breakdown: **12 occurrences of the RUN27-3 shape** (int-typed key wrapped in `String(...)`) — `summary-detector.js` (4: all newly-invented count keys), `auto-summarize.js` (6: `days_*`/`weeks_*` count keys), `summarize.js` (2: `months_generated_count`/`months_failed_count`); **2 occurrences of the opposite-direction mismatch**, both in `summarize.js` (`dates_requested`, declared `string`, set as a raw number at 2 sites). **Two additional, separately-tracked findings, not in either count above**: `git-collector.js`'s `is_merge` (1 call site, declared `boolean`, emitted as a string — live-trace confirmed) and `summary-manager.js`'s `summary_saved` (declared `string`, emitted as a boolean at all 14 of its call sites — one rule violation manifesting at 14 sites, not 14 separate findings) |
| SCH-004 (No redundant entries) | **PASS** | No invented duplicate/near-synonym keys found across any file this run |

**SCH note**: Held at run-27's 2/4 (50%), but the composition is different — SCH-002's `dates_requested` case is now validator-caught (unlike run-27's silent commit), while SCH-003 widened from 2 files (run-27) to 5 files (run-28) — the largest SCH-003 footprint recorded in this series.

### Code Quality (CDQ): 5/7 (71%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | All 13 files use `span.end()` in `finally`, no redundant calls |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('commit-story')` in all 13 files, single module-level call reused per file |
| CDQ-003 (Error recording) | **PASS** | `recordException` + `setStatus({code: SpanStatusCode.ERROR})` in every outer catch before rethrow |
| CDQ-005 (Async context) | **PASS** | `startActiveSpan` with async callbacks throughout; no logger bypass or `console.log` found |
| CDQ-006 (Expensive guards) | **FAIL** (new) | `summary-manager.js` — `isRecording()` guard applied to only 3 of ~24 `setAttribute` calls (the `file_path` sites that use the sanitization split), with no stated exemption basis for the other ~21 unguarded calls (`summary_saved`, `entry_date`, `entries_count`, etc.). First CDQ-006 failure in this run series since tracking began — every prior run scored this rule PASS |
| CDQ-007 (No unbounded/PII) | **FAIL** | Two distinct issues: (1) a new PII regression — `git-collector.js`'s `commit_story.commit.author` (raw name, run-27 had fixed this, live-trace confirmed regression, validator downgraded to advisory-only) and `context-integrator.js`'s re-exposure of the same value; (2) **RUN27-4 only partially resolved** — the inline sanitization fallback that fixed 6 of the original 7 affected files works correctly everywhere it's applied, but `summary-manager.js` still ships raw unsanitized paths at 4 of its 7 `file_path` sites, using the fallback correctly at the other 3. RUN27-4 is not a clean fix; it's a fix that generalizes as a mechanism but isn't applied at every site it needs to be |
| CDQ-008 (Consistent naming) | **PASS** | `'commit-story'` used identically across all 13 files |

**CDQ regression note**: Down from run-27's 6/7 (86%) — CDQ-006 fails for the first time in this run series, and CDQ-007 still fails: RUN27-4's original raw-path pattern is resolved at 6 of 7 files but not `summary-manager.js` (4 of its 7 sites remain raw), plus a separate new PII regression (`commit_story.commit.author`) that run-27 had already fixed.

---

## Overall Score

| Dimension | Run-28 | Run-27 | Run-26 | Run-25 | Delta (vs run-27) |
|-----------|--------|--------|--------|--------|-------------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | **5/5 (100%)** | 4/5 (80%) | 5/5 (100%) | 4/5 (80%) | **+20pp** |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | **2/4 (50%)** | 2/4 (50%) | 3/4 (75%) | 4/4 (100%) | — |
| CDQ | **5/7 (71%)** | 6/7 (86%) | 6/7 (86%) | 7/7 (100%) | **-15pp** |
| **Total** | **21/25 (84%)** | **21/25 (84%)** | **23/25 (92%)** | **24/25 (96%)** | **—** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | — |

**This run ties run-27's series-low score (21/25, 84%) — but via a different, offsetting composition.** COV recovered fully (RUN27-1's partial-commit bug is genuinely fixed) while CDQ dropped by the same margin (a new CDQ-006 failure, RUN27-4 still not fully closed at `summary-manager.js`, plus a new PII regression at `git-collector.js`/`context-integrator.js`). SCH held flat at run-27's regressed level, but SCH-003's footprint widened from 2 files → 5 files. Net effect: of the run's two primary COV/CDQ-related fix-verification goals, RUN27-1 (COV-003) is genuinely resolved and RUN27-4 (CDQ-007) is real progress (6 of 7 files fully fixed) but not complete — and the quality score doesn't distinguish "fully resolved" from "mostly resolved."

---

## Canonical Metrics

| Metric | Run-28 | Run-27 | Run-26 | Run-25 |
|--------|--------|--------|--------|--------|
| Quality score | **21/25 (84%)** | 21/25 (84%) | 23/25 (92%) | 24/25 (96%) |
| Gates | 5/5 | 5/5 | 5/5 | 5/5 |
| Committed files | **12** | 13 | 14 | 13 |
| Partial files | **1** | 1 | 0 | 1 |
| Failed files | **0** | 0 | 0 | 0 |
| Total spans | **48** (45 committed + 3 partial) | 48 | 41 | 47 |
| Model | claude-sonnet-4-6 | claude-sonnet-4-6 | claude-sonnet-4-6 | claude-sonnet-4-6 |
| Cost | **$7.23** | $9.40 | $11.15 | $7.38 |
| Q×F | **10.08** | 10.92 | 12.88 | 12.48 |
| Push/PR | **AUTO (#95)** | AUTO (#94) | MANUAL (#91) | AUTO (#86) |
| IS | **100/100** | 100/100 | 100/100 | 100/100 |

**Q×F = 10.08** (21/25 × 12 committed files). Down from run-27's 10.92 — the quality percentage held flat (84%) but the committed-file count dropped by one (12 vs 13). The source file inventory itself is unchanged (32 files in both runs); the drop is 13 committed → 12 committed, with the same 1 partial in each run — not a smaller inventory. This continues the pattern of Q×F tracking file-count changes more than quality-percentage changes when the percentage itself doesn't move.

**Total spans ties run-27 and run-24's all-time record of 48**, despite one fewer committed file — `summary-manager.js` alone contributes 9 spans (all committed cleanly this run, vs. 7 in run-27's partial state) and `summary-detector.js` contributes another 9, more than offsetting the missing file's spans.

**Fix verification summary** (full detail in `run-summary.md` and `per-file-evaluation.md`):
- **RUN27-1 (COV-003 / summary-manager.js partial-commit)**: ✅ FULLY RESOLVED — all 9 span-eligible functions committed cleanly, correct error recording throughout.
- **RUN27-2 (SCH-002 / summarize.js key-reuse)**: ⚠️ PARTIALLY RESOLVED — the validator now catches this exact pattern and rejects reassembly, but the agent still generates the mistake; net effect is a new partial-commit outcome rather than a silent full commit with a latent bug.
- **RUN27-3 (SCH-003 / String()-vs-int)**: ❌ CONFIRMED RECURRING, WIDER — 12 occurrences of this specific shape across 3 files (`summarize.js`, `summary-detector.js`, `auto-summarize.js`), plus 2 occurrences of the opposite-direction mismatch (both in `summarize.js`, 14 total across those 3 files), plus 2 entirely separate SCH-003 instances in `git-collector.js` and `summary-manager.js` — 5 files affected in total.
- **RUN27-4 (CDQ-007 / raw-path pattern)**: ⚠️ PARTIALLY RESOLVED via the shared-representation fix (inline sanitization fallback, no per-file `basename` import needed) — 6 of 7 originally-affected files are now fully clean, but `summary-manager.js` still ships raw paths at 4 of its 7 sites. A separate, new PII regression (`commit_story.commit.author`, previously fixed in run-27) also appeared this run.
- **NEW: CDQ-006 (summary-manager.js isRecording guard inconsistency)**: ❌ NEW FAILURE — first CDQ-006 failure recorded in this run series.

---

## Failure Analysis

### SCH-002: summarize.js — dates_requested contradicts its own declaration (VALIDATOR NOW CATCHES IT, agent behavior unchanged)

`commit_story.summary.dates_requested` is declared by `runSummarize` for a date-range count, then reused by `runWeeklySummarize`/`runMonthlySummarize` for week and month counts respectively — the same shape as run-27's `dates_count` finding, on a differently-named key. Unlike run-27 (where this reuse silently committed), the SCH-002 validator fix (spiny-orb PR #1058) fired at reassembly time and rejected both non-`runSummarize` call sites, forcing the file to PARTIAL. But per `failure-deep-dives.md`'s direct source verification, the violation is still present in the committed partial file — the reassembly fallback didn't strip it out.

**Root cause**: The validator-level fix closes the "commit silently" failure mode, but nothing in the agent's generation process was changed to stop it from proposing the bad reuse in the first place.

**Fix needed in spiny-orb**: A prompt-level guard — when an entry point reuses an attribute key already declared by an earlier sibling function in the same file, cross-check the new usage's semantic source against the original declaration before finalizing, rather than relying on post-hoc validation to catch and reject it.

### SCH-003: five files, the widest recurrence of this pattern in the series

`summarize.js`, `summary-detector.js`, and `auto-summarize.js` each wrap a newly-invented `int`-typed registry key in `String(...)` (14 occurrences total, `summarize.js` also separately setting its `dates_requested` — declared `string` — as a raw unstringified number at 2 sites). `git-collector.js`'s `is_merge` (declared `boolean`) is set via `String(parentCount > 1)` — live-trace confirmed as a quoted `"false"`. `summary-manager.js`'s `summary_saved` (declared `string`) is set as a bare boolean at all 14 call sites. Every occurrence across all five files is on a key the agent invents itself in that file — every pre-existing/reused key across the entire run is correctly typed.

**Root cause**: Same as RUN26-1/RUN27-3's original diagnosis — no spiny-orb rule catches a declared-vs-emitted type mismatch on a newly-declared extension key at generation time, regardless of which direction the mismatch runs (string-wrapped-int, or raw-value-into-string-key, or raw-boolean-into-string-key). The pattern generalizes beyond the original `String(x.length)`-vs-int shape.

**Fix needed in spiny-orb**: A generation-time or validation-time check that compares every `setAttribute` call's value expression against its key's declared registry type — not just for newly-declared keys in isolation, but checking the actual runtime type the expression will produce (a `String(...)` wrapper call, a bare boolean literal, a bare numeric expression) against the declared type, regardless of which direction the mismatch runs.

### CDQ-006: summary-manager.js — inconsistent isRecording guard application (NEW FAILURE)

Only 3 of the file's roughly 24 `setAttribute` calls are wrapped in `if (span.isRecording())` — the 3 `file_path` sites that use the inline sanitization split (a genuinely non-trivial computation). The other ~21 calls (`summary_saved`, `entry_date`, `entries_count`, and the other 4 `file_path` sites) are unguarded, with no COV-001 entry-point exemption available (this file has no CLI/top-level entry-point boundary) and no stated rationale for the split.

**Root cause**: Unclear — this is the first observed instance of a file applying the isRecording-guard convention inconsistently *within itself*, rather than uniformly applying or uniformly omitting it. May indicate the agent's guard-application decision is made per-attribute rather than per-file, without a rule enforcing consistency.

**Fix needed in spiny-orb**: Either a stricter CDQ-006 check that flags within-file inconsistency directly, or clearer prompt guidance that the isRecording-guard decision should be made once per file (or per attribute-complexity-class) rather than ad hoc per call site.

### CDQ-007: RUN27-4 partially closed, plus a separate new PII regression

`git-collector.js`'s `commit_story.commit.author` (raw PII, a person's full name) was explicitly removed in run-27 after being blocked by this exact rule; it ships again in run-28, live-trace confirmed, with the validator only surfacing it as a non-blocking advisory this time — a validator-severity regression, not just an agent regression. `context-integrator.js` re-exposes the same raw value (received from `git-collector.js`) on its own span, also live-trace confirmed. Separately, `summary-manager.js` — one of the 7 files RUN27-4's raw-path pattern originally affected — applies the confirmed-fixed inline path-sanitization fallback correctly at 3 of 7 `file_path` call sites, but ships 4 more raw and unsanitized. This is RUN27-4 itself, not a new pattern: the fix mechanism is proven correct where it's used, but this file didn't apply it everywhere it needed to.

**Root cause**: For the PII-author regression: the identical attribute and code pattern was blocking in run-27 and advisory-only in run-28 — this evaluation did not verify whether the validator's version, configuration, or rule inputs changed between the two runs, so "the validator itself is unstable" is a hypothesis worth investigating, not a confirmed conclusion. For the path-sanitization inconsistency: the inline-fallback fix, while functionally correct where applied, isn't being applied as a blanket rule across every call site in a file — the agent still decides per-site.

**Fix needed in spiny-orb**: (1) Investigate whether the PII-author finding's severity classification genuinely changed with no corresponding validator change, or whether something about the validator (version, config, rule set) differed between the two runs that would explain it — this needs a direct comparison of the validator state used in each run before concluding it's flakiness or nondeterminism. (2) For the path-sanitization inconsistency, the same fix direction as CDQ-006 above applies — enforce the fallback's application uniformly across every path-like attribute in a file, not per call site.

---

## Watch Items (not canonical failures, flagged for handoff)

| Item | File | Status |
|------|------|--------|
| Coverage regression | `mcp/tools/context-capture-tool.js` | Committed with 2 spans in run-27 (`saveContext` COV-004 + MCP handler COV-001); lands as a "correct skip" (0 spans) in run-28, with the agent's own reasoning trace correctly identifying the gap before the final notes reverse course and falsely claim no async I/O exists. Not scored against the rubric since no committed code exists to evaluate this run |
| Questionable "correct skip", persisting | `mcp/tools/reflection-tool.js` | Third consecutive run (26, 27, 28) with the identical self-identified-and-declined `saveReflection` COV-004 gap. Structurally identical to `context-capture-tool.js`, so also carries a latent, previously-unflagged COV-001 handler-span gap |
| Registry version discrepancy, now with no real prior file | Run-level | `semconv/agent-extensions.yaml` doesn't exist on `main` at all — the PR's "Baseline: 0.1.0 → Head: 0.1.0" framing implies no change when there was no prior file to have a version. Third consecutive run with a version-reporting discrepancy, worse in kind than runs 26-27's "real prior file, unmoved version" shape |
| CDQ-007 validator severity instability | `git-collector.js` (`commit_story.commit.author`) | Same attribute, same code pattern, blocking in run-27 and advisory-only in run-28 — worth a dedicated investigation separate from the instrumentation defect itself |

---

## Resolved from Run-27

| Rule | File(s) | Status |
|------|---------|--------|
| COV-003 (summary-manager.js partial-commit regression) | summary-manager.js | **RESOLVED** — all 9 span-eligible functions committed cleanly, correct `isExpectedConditionCatch` handling across all three ENOENT-shape functions |
| CDQ-007 (raw-path pattern, 7 files: `claude-collector.js`, `context-integrator.js`, `journal-paths.js`, `summarize.js`, `summary-detector.js`, `auto-summarize.js`, `summary-manager.js`) | claude-collector.js, context-integrator.js, journal-paths.js, summarize.js, summary-detector.js, auto-summarize.js | **RESOLVED (pattern no longer reproduces) at 6 of the original 7 files — but the fix mechanism itself is only exercised in 1 of those 6.** Only `journal-paths.js` actually applies the shared-representation fix (inline sanitization fallback landed on spiny-orb main, `5a0636c`); `summarize.js`, `summary-detector.js`, and `auto-summarize.js` avoid recurrence by not emitting a path attribute this run, not because the fallback fired. `claude-collector.js` and `context-integrator.js` resolve it by dropping the `repo_path` attribute entirely rather than sanitizing it. `summary-manager.js` remains the one unresolved file (4 of its 7 sites still raw) — see Failure Summary below, not moved to "Resolved". `context-integrator.js` separately regresses a *different* CDQ-007 finding this run (`commit_story.commit.author` PII, re-exposed from `git-collector.js`) — its original `repo_path` finding is resolved, but it's not clean overall |

## Failure Summary

| Rule | Dimension | File(s) | Root Cause | Runs Open |
|------|-----------|---------|-----------|-----------|
| SCH-002 | SCH | summarize.js (`dates_requested` on `runWeeklySummarize`/`runMonthlySummarize`) | New extension key's declared meaning not cross-checked against later `setAttribute` calls in the same file/pass — validator now rejects at reassembly, but doesn't prevent generation | 2 runs (run-27 `dates_count`, run-28 `dates_requested`; different key name, same shape) |
| SCH-003 | SCH | summarize.js, summary-detector.js, auto-summarize.js, git-collector.js, summary-manager.js | Validator does not catch a declared-vs-emitted type mismatch on a newly-declared extension key, in either direction (string-wrapped-int, raw-into-string, raw-boolean-into-string) | 3 runs (recurring since RUN26-1, widest footprint yet: 5 files this run) |
| CDQ-006 | CDQ | summary-manager.js | isRecording-guard application decided per-call-site rather than per-file, producing internal inconsistency | 1 run (new) |
| CDQ-007 | CDQ | git-collector.js, context-integrator.js, summary-manager.js | PII-attribute validator severity instability (git-collector.js/context-integrator.js, new this run); path-sanitization fallback applied per-site rather than uniformly across all 7 sites (summary-manager.js, RUN27-4 continuing) | PII regression: 1 run (new). RUN27-4/summary-manager.js: 3 runs (recurring, now down to 1 of 7 files) |
