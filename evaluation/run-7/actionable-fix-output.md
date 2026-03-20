# Actionable Fix Output — Run-7

This document is the handoff from evaluation run-7 to the spiny-orb team. It is **self-contained** — everything the spiny-orb Weaver needs is here.

**Run-7 result**: 22/25 (88%) canonical quality, 13 files committed, $3.22 cost in 33 minutes. **Best file coverage ever.** 29/29 files succeeded (0 failures, 0 partials).

**Run-6 → Run-7 delta**: +4pp quality (84% → 88%), +160% files (5 → 13), -67% cost ($9.72 → $3.22), 3.6x faster.

**Every previously failing file recovered in run-7.** All 8 partial/failed/regressed/debatable files from run-6 are now committed or correctly classified. Run-7 reverses every negative trend simultaneously — quality up, files up, cost down, product tripled.

**Key architectural context**: The PRD expected registry expansion (≥8 span definitions). The spiny-orb team chose validator tolerance instead: sparse-registry advisory mode (<3 spans → SCH-001/SCH-002 advisory). The registry still has 0 span definitions. The agent invents all span names as extensions. Naming quality is consistently good — all follow `commit_story.<module>.<operation>` convention.

**Branch**: `spiny-orb/instrument-1774017389972` (local — push failed). PR summary at `spiny-orb-pr-summary.md`.

---

## §1. Run-7 Score Summary

| Dimension | Score | Run-6 | Delta | Failures |
|-----------|-------|-------|-------|----------|
| NDS | 2/2 (100%) | 2/2 | — | — |
| COV | 4/5 (80%) | 3/5 | +20pp | COV-006 (span name collision) |
| RST | 4/4 (100%) | 3/4 | +25pp | — |
| API | 2/3 (67%) | 3/3 | -33pp | API-004 (pre-existing) |
| SCH | 4/4 (100%) | 3/4 | +25pp | — |
| CDQ | 6/7 (86%) | 7/7 | -14pp | CDQ-005 (count type mismatch) |
| **Total** | **22/25 (88%)** | **21/25** | **+4pp** | 3 failures |
| **Gates** | **5/5** | **5/5** | — | — |
| **Files** | **13** | **5** | **+160%** | — |

**Solved dimensions**: NDS (100% for runs 4-7), Gates (5/5 for runs 5-7), RST (100% for runs 5, 7 — run-6 dip was SCH-001 cascade).

**Quality x Files product**: 12.4 → 11.0 → 8.3 → 4.2 → **11.4**. The declining trend has reversed — approaching run-3 levels but with much higher quality per file.

**Instance counts** (per-rule scope of failures):
- COV-006: 12/13 files pass (92%) — only summary-graph.js fails
- CDQ-005: 11/13 files pass (85%) — summary-detector.js and auto-summarize.js fail

**Cost**: $3.22 (4.7% of $67.86 ceiling). Cost/file: $0.25 (matching run-3 levels). 95% cache hit rate (125.3K/131.8K output cached) is the primary driver. Only 4 files needed 2 attempts, none needed 3.

**Advisory contradictions**: 10/44 advisories (23%) contradict agent skip decisions. Some are genuine (context-capture-tool.js has async I/O in unexported callback), others are analyzer false positives (prompt template functions flagged for "I/O library calls"). The PR summary presents both without reconciliation — a reviewer must investigate each independently.

**PR quality**: 3/5. Tally accurate, per-file table useful. Weaknesses: 331 lines (65% over 200-line target), auto-summarize span count error (6 claimed, 3 actual), schema changes section omits span extensions.

**Evaluation methodology note**: The schema coverage split concept ("schema-covered" vs "schema-uncovered") becomes less meaningful when the agent declares all extensions and the registry has 0 pre-defined spans. This methodology needs updating for run-8.

---

## §2. Remaining Quality Rule Failures (3)

### API-004: @opentelemetry/sdk-node in peerDependencies (Pre-Existing)

**What's wrong**: `@opentelemetry/sdk-node` is in `peerDependencies`. Libraries should depend only on `@opentelemetry/api` — deployers choose the SDK.

**Status**: Pre-existing on main since run-2. Not introduced by instrumentation.

**Fix**: Remove `@opentelemetry/sdk-node` from `peerDependencies` in the target project's `package.json`. This is a target-project fix, not a spiny-orb fix. However, spiny-orb could detect and warn about SDK packages in library projects.

**Acceptance criteria**: No SDK packages in peerDependencies for library projects.

### COV-006: Span Name Collision (Unmasked by SCH-001 Fix)

**What's wrong**: `commit_story.journal.generate_summary` is used for both `summaryNode` in journal-graph.js (per-commit journal summary generation) and `dailySummaryNode` in summary-graph.js (daily summary aggregation). These are semantically different operations sharing the same span name.

**Root cause**: The agent reused a span name from the accumulated schema (written by an earlier file) instead of inventing a unique one. The schema extension accumulator makes previously-declared names available to later files, creating an incentive to reuse rather than create.

**Desired outcome**: Each span name maps to exactly one operation. Cross-file span name uniqueness should be enforced.

**Acceptance criteria**:
1. No two different operations share the same span name across files
2. Validator or post-run check catches cross-file span name collisions
3. Agent prompt discourages reusing span names from the accumulated schema for different operations

### CDQ-005: Count Attributes Declared as String Type (Unmasked by SCH-001 Fix)

**What's wrong**: 5 count attributes in `agent-extensions.yaml` are declared as `type: string` instead of `type: int`: `dates_count`, `weeks_count`, `months_count`, `generated_count`, `failed_count`. The code uses `String()` wrapping. The base schema uses `type: int` for all existing count attributes (`sessions_count`, `messages_count`, `quotes_count`).

**Root cause**: The agent chose `string` type for new attributes, possibly to avoid type coercion issues. The schema extension writer accepts whatever the agent declares without checking consistency with existing attribute patterns.

**Desired outcome**: Count attributes are `type: int`, code passes raw numbers.

**Acceptance criteria**:
1. Agent prompt instructs: count attributes use `type: int`
2. Schema extension writer flags type inconsistencies with existing attributes (e.g., "existing count attributes use int, you declared string")
3. No `String()` wrapping on numeric values in instrumented code

---

## §3. Run-6 Findings Assessment

All 16 run-6 findings were filed as issues and merged as PRs. None rejected.

| Finding | Status | Verification |
|---------|--------|-------------|
| RUN6-9 SCH-001 single-span registry | **Fixed** | Advisory mode active, 13 files commit |
| RUN6-8 COV-001 entry point | **Fixed** | index.js has commit_story.app.main span |
| RUN6-2 Push auth | **Partially fixed** | Code improved but still fails (RUN7-4) |
| RUN6-10 DEEP-1 boundary gaps | **Fixed** | All 4 COV-003 patterns handled correctly |
| RUN6-15 PR summary accuracy | **Fixed** | Tally is accurate (13 committed, 16 skips) |
| RUN6-3 SCH-001 semantic mismatch | **Fixed** | Agent invents semantically correct names |
| RUN6-11 Regressions | **Fixed** | All 4 recovered: auto-summarize.js (regressed→committed), context-capture-tool.js (debatable skip→correct skip via RST-004), reflection-tool.js (debatable skip→correct skip), journal-paths.js (debatable skip→committed) |
| RUN6-4 Tally inflation | **Fixed** | "13 committed" not "29 succeeded" |
| RUN6-5 NDS-003 | **Fixed** | reconcileReturnCaptures() works |
| RUN6-16 Advisory contradictions | **Improved** | 23% rate (down from 76%) |
| RUN6-13 RST-004 | **Fixed** | Precedence rule in prompt, correctly applied |
| RUN6-14 COV-005 server.js | **Fixed** | server.js has commit_story.mcp.transport attribute |
| RUN6-7 Reasoning reports | **Fixed** | .instrumentation.md companion files generated |
| RUN6-12 Wrong span names | **Fixed** | Agent now invents correct names |
| PR-1 PR summary length | **Improved** | 331 lines (down from ~430, target <200) |
| RUN6-1 Laptop sleep | **Fixed** | caffeinate -s used |

**14 of 16 fully fixed, 2 partially improved.** The most impactful fix was SCH-001 advisory mode — it single-handedly recovered 8 files.

---

## §4. New Run-7 Findings (10 total)

| # | Title | Priority | Category |
|---|-------|----------|----------|
| RUN7-4 | Push auth 5th failure — read vs write validation | Critical | Deliverables |
| RUN7-2 | Opaque rule codes in user-facing output | High | UX |
| RUN7-3 | No user-facing documentation | High | UX |
| RUN7-1 | Verbose output truncates, buries status | Medium | UX |
| RUN7-5 | Span name collision across files | Medium | Validation |
| RUN7-6 | Count attributes as string type | Medium | Schema |
| RUN7-7 | auto-summarize span count inflated in PR summary | Medium | PR Summary |
| RUN7-8 | Schema Changes omits span extensions | Medium | PR Summary |
| RUN7-9 | Agent Notes is compliance dump (180 lines) | Medium | PR Summary |
| RUN7-10 | CDQ-006 advisories repeat 28x | Medium | PR Summary |

**Theme shift**: Run-6 findings were about *correctness* (validation blocking files, wrong span names, inflated tallies). Run-7 findings are about *polish* (UX, documentation, PR summary formatting, type consistency). The system works; it needs refinement.

---

## §5. Priority Action Matrix

### P0 — Must fix for run-8

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Fix push auth fail-fast | RUN7-4 | Fail before processing if GITHUB_TOKEN missing or write access unavailable |
| Fix span name collision detection | RUN7-5 | Cross-file span name uniqueness enforced |
| Fix count attribute types | RUN7-6 | Agent declares int for counts, no String() wrapping |

### P1 — Should fix for run-8

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Add human-readable rule labels | RUN7-2 | Every rule code in output includes short description |
| Fix auto-summarize span count | RUN7-7 | Per-file span count matches actual startActiveSpan calls |
| Include span extensions in schema changes | RUN7-8 | PR summary shows both attributes and spans added |
| Compress agent notes | RUN7-9 | <5 lines per file, decisions not compliance checklists |
| Group duplicate advisories | RUN7-10 | Identical advisories grouped with count |

### P2 — Nice to have

| Action | Finding | Acceptance Criteria |
|--------|---------|-------------------|
| Create user-facing docs | RUN7-3 | docs/ with rules reference, architecture, output guide |
| Improve verbose output hierarchy | RUN7-1 | Status prominent, notes below, optional expansion |

---

## §6. Run-8 Verification Checklist

1. Push auth: PR created successfully (non-negotiable after 5 failures)
2. Span name collision: no duplicate span names across files
3. Count attributes: all `*_count` attributes use `type: int`
4. API-004: sdk-node removed from peerDependencies (target project fix)
5. Per-file table: span counts match branch state for all files
6. PR summary length: <200 lines
7. Advisory contradiction rate: <15%
8. Schema changes: includes span extensions
9. Agent notes: <5 lines per file
10. Files committed: ≥13 (no regression from run-7)
11. Quality score: ≥88% (no regression from run-7)
12. Dominant blocker peeling: document what emerges behind COV-006/CDQ-005

---

## §7. Score Projections for Run-8

### Minimum (P0 fixes only: push auth + span collision + count types)

- **COV-006**: FAIL → PASS (span name collision fixed)
- **CDQ-005**: FAIL → PASS (count types fixed)
- **API-004**: Still FAIL (target project fix, not spiny-orb)
- **Expected score**: 24/25 (96%), **13+ files**
- **After 50% discount**: 23-24/25 (92-96%), **13+ files**
- **Risk**: New blocker behind COV-006/CDQ-005 (established pattern, but severity is decreasing)

### Target (P0 + P1 fixes)

- All P0 fixes plus PR summary improvements
- **Expected score**: 24/25 (96%), **13-15 files**
- **After 50% discount**: 23-24/25, **13+ files**
- **Risk**: API-004 requires target project change

### Stretch (P0 + P1 + P2 + API-004 fix)

- All fixes including user docs and target project peerDeps cleanup
- **Expected score**: 25/25 (100%), **13-15 files**
- **After 50% discount**: 24-25/25, **13+ files**
- **Risk**: Unknown unknowns from expanded test surface

### Projection Methodology Calibration

Run-6 projections were well-calibrated for run-7:
- Minimum projected 21-23/25, 6-8 files → Actual 22/25, 13 files
- Target projected 22-24/25, 8-12 files → Actual 22/25, 13 files

The 50% discount is validated. Score predictions are accurate; file count predictions are conservative (actual exceeded projections). For run-8, file count is less uncertain since we're no longer recovering from mass failures.

---

## §8. Carry-Forward Items

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| Push authentication | Run-3 | 5 runs | Root cause identified (RUN7-4), not yet fixed |
| CJS require() in ESM | Run-2 #62 | 6 runs | Open spec gap, not triggered |
| Elision/null output bypass | Run-2 #63 | 6 runs | Likely improved, not directly tested |
| Spec gaps (#66-69) | Run-2 | 6 runs | Open |
| API-004 sdk-node in peerDeps | Run-2 | 6 runs | Pre-existing, requires target project fix |

---

## §9. Superficial Resolution Tracking

For all 8 files recovered from partial/failed/regressed/debatable, NDS-005, CDQ-003, and RST-001 were explicitly evaluated:

| File | NDS-005 | CDQ-003 | RST-001 | Superficial? |
|------|---------|---------|---------|-------------|
| journal-graph.js | PASS | PASS | PASS | No |
| summary-graph.js | PASS | PASS | PASS | No |
| summarize.js | PASS | PASS | PASS | No |
| auto-summarize.js | PASS | PASS | PASS | No |
| journal-manager.js | PASS | PASS | PASS | No |
| summary-detector.js | PASS | PASS | PASS | No |
| index.js | PASS | PASS | PASS | No |
| journal-paths.js | PASS | PASS | PASS | No |

**Zero superficial resolutions.** All recoveries are genuine — the validation fixes resolved the root causes, not just the symptoms.
