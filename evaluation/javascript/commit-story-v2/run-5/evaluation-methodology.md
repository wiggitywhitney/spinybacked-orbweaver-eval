# Evaluation Methodology — Run-5

Standardized methodology for run-5 evaluation. This document formalizes changes discovered organically in run-4 so they're applied consistently from the start.

---

## Rubric Clarifications

### CDQ-002: Semantic Tracer Name Check

**Previous interpretation**: Pattern-only — verify `trace.getTracer()` includes a string argument. Any non-empty string passes.

**Run-5 standard**: Semantic — verify the tracer name is semantically correct, matching the project's `package.json#name` (expected: `'commit-story'`) or a deliberate derivative. Generic defaults like `'unknown_service'`, empty strings, or missing arguments all fail.

**Rationale**: Run-4 found all 16 instrumented files using `'unknown_service'` as the tracer name. Under the pattern-only check, this would have passed (a string argument exists). The bug also existed in run-3 but was not captured because the evaluator only checked for presence, not correctness.

**Rubric text change**: Update CDQ-002 mechanism to include semantic validation against `package.json#name`.

**Mapping text change**: Update evaluator action to flag generic defaults. Add history note about run-3 gap.

---

### CDQ-006: Cheap Computation Exemption

**Previous interpretation**: Any `setAttribute` call with a function call or method chain in the value requires an `isRecording()` guard.

**Run-5 standard**: Trivial type conversions are exempt. Specifically: `toISOString()`, `String()`, `Number()`, `Boolean()`, `toString()`, and simple property access chains do not require `isRecording()` guards. These are O(1) operations with negligible cost — the guard adds more complexity than the computation it protects.

**Still requires guard**: `JSON.stringify()`, `.map()`, `.reduce()`, `.join()`, `.filter()`, and any operation that iterates data or serializes objects.

**Rationale**: Run-4 flagged CDQ-006 violations for `toISOString()` calls. This is technically correct under the literal rule text (it's a method call in an attribute value), but the spirit of CDQ-006 is to prevent expensive computation when the span isn't being recorded. A `Date.toISOString()` call is cheaper than the `isRecording()` check itself.

**Rubric text change**: Add exemption list to CDQ-006 mechanism for trivial type conversions.

**Mapping text change**: Update evaluator action to exclude cheap conversions from flagging.

---

### NDS-005: Expected-Condition Sub-Classification

**Previous interpretation**: NDS-005 ("Error Handling Behavior Preserved") treats all error handling modifications uniformly — the agent either preserved error handling or it didn't.

**Run-5 standard**: NDS-005 covers two distinct failure classes:

- **NDS-005a: Structural error handling breakage** — The agent restructured, merged, removed, or reordered pre-existing `try`/`catch`/`finally` blocks, altering error propagation semantics. This is the traditional NDS-005 failure. Example: agent merges two catch clauses, agent removes a try/catch and replaces with a different pattern.

- **NDS-005b: Expected-condition catches recorded as errors** — The agent preserved the error handling structure but added `recordException()` + `setStatus(ERROR)` in catch blocks that handle expected conditions (validation failures, missing optional resources, graceful fallbacks). The error handling behavior is preserved, but the telemetry incorrectly classifies expected conditions as errors, creating noisy alerts and misleading error rates.

**How to evaluate**:
- NDS-005a: AST diff of pre-existing error handling structures (same as before)
- NDS-005b: For each catch block with `recordException`/`setStatus(ERROR)`, check whether the original catch block was a "silent catch" (returns default/fallback, doesn't rethrow). Silent catches are expected-condition handlers — recording them as errors is NDS-005b.

**Impact**: Both sub-classifications carry Important impact. NDS-005a is more severe (behavioral change) but NDS-005b is more common (run-4 found 3 files with this pattern: `isGitRepository`, `isValidCommitRef`, `getPreviousCommitTime` — all return fallback values on catch).

**Rubric text change**: Add sub-classification to NDS-005 with distinct evaluation mechanisms for 005a and 005b.

**Mapping text change**: Annotate each error handling site in the NDS-005 table with expected-condition classification (silent catch = NDS-005b candidate).

---

## Scoring Methodology

### Per-File Evaluation as Canonical Methodology

**Previous state**: Run-4 produced 4 scoring variants (strict, adjusted, split, split+adjusted), creating confusion about which score represents quality.

**Run-5 standard**: Per-file agent evaluation with schema coverage split is the **single canonical methodology**. Each instrumented file is evaluated by a dedicated agent with the full rubric. Scores are aggregated from per-file results. There is one score, not four.

**Backward compatibility**: For trend comparison with runs 2-4, provide a "methodology-adjusted" score alongside the canonical score. Label it clearly as backward-compatible, not authoritative.

### Schema Coverage Split as Standard Dimension

**Previous state**: Run-4 introduced schema-covered vs. schema-uncovered file classification ad-hoc to address SCH-002 fairness for files outside the Weaver registry.

**Run-5 standard**: Schema coverage split is a first-class scoring dimension applied from the start:

- **Schema-covered files**: Have operations and/or attributes defined in the Weaver registry. SCH-001 and SCH-002 evaluated against registry definitions.
- **Schema-uncovered files**: No registry definitions. SCH-001 evaluated on naming quality (bounded cardinality, consistent convention, no embedded dynamic values). SCH-002 evaluated on invention quality (namespace adherence using `commit_story.*` prefix, semantic validity).

**Design decision**: Summary subsystem attributes are intentionally NOT pre-registered in the Weaver schema. The gap tests the agent's schema extension capability — inventing well-formed attributes for uncovered code is a harder, more valuable test.

### Instance Counts Alongside Rule-Level Scores

**Previous state**: Run-4 scored each rule as pass/fail at the dimension level without showing how many files were affected.

**Run-5 standard**: Every rule score includes per-file instance counts: `{rule_id}: {pass|fail} ({N_pass}/{N_total} files)`. This provides nuance when comparing runs with different file counts and helps prioritize fixes by showing the blast radius of each failure.

### Systemic Bug Classification

**Previous state**: Run-4 counted each file's CDQ-002 failure independently (16 failures for one root cause: `'unknown_service'` tracer name).

**Run-5 standard**: When one root cause causes N files to fail the same rule, classify as a single systemic bug with N affected instances. The score impact is one rule failure, not N independent violations. This prevents a single bug from dominating the score.

**Reporting format**: `CDQ-002: FAIL (systemic — 'unknown_service' tracer name, 16/16 files affected)`

### Branch State Verification

**Previous state**: Run-4 initially trusted the agent's self-reported per-file status table in the PR summary. Found 3 "partial" files with NO actual changes on the branch.

**Run-5 standard**: Evaluate `git diff main..orbweaver-branch` as ground truth. Cross-reference every file the agent claims to have instrumented against actual branch changes. Files with no diff are "not delivered" regardless of what the agent reports.

### Cost Anomaly as Diagnostic Signal

**Previous state**: Run-4's $5.84 cost (8.6% of $67.86 ceiling) was initially seen as efficient. Later identified as a symptom of broken schema evolution — the prompt wasn't changing between files.

**Run-5 standard**: If actual cost < 15% of ceiling, investigate. Low cost:ceiling ratio may indicate:
- Schema evolution broken (prompt not evolving)
- Over-aggressive caching
- Agent skipping analysis steps

This is a diagnostic signal, not a scoring criterion. High cost is not inherently good — the signal is in the ratio, not the absolute value.

---
