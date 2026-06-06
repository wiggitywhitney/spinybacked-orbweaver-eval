# PRD #117: Live Datadog Trace Capture for Eval Verification

**Status:** Ready
**Created:** 2026-06-06
**GitHub Issue:** #117
**Depends on:** None

---

## Problem Statement

The eval process uses IS scoring for runtime verification, but per-file evaluation relies entirely on static code review of the committed instrumented source. Runtime issues are invisible to static analysis:

- **CDQ-001 (double-end)**: `span.end()` called inside a `startActiveSpan` callback looks structurally plausible in code but causes anomalous span lifecycle at runtime — static review missed this in run-21.
- **Attribute values at runtime**: Code that calls `span.setAttribute('commit_story.foo', value)` passes static review even if `value` is always `undefined` at that call site.
- **Parent-child relationships**: Whether spans are correctly nested can only be verified from a live trace — the source code shows the calls but not the actual hierarchy.
- **Early exit detection**: A node that exits before the LLM call shows a span with `gen_ai` request attributes but no response attributes — visible in a trace, invisible in code.

IS scoring (Weaver live-check) catches schema compliance but surfaces findings as a numeric score. The rich trace data from the instrumentation run is discarded after scoring.

### What This PRD Adds

Capture `service.instance.id` from a controlled instrumentation run as a first-class eval artifact. Query that live trace via Datadog MCP throughout the eval process to supplement static code review with runtime evidence. IS scoring (Weaver live-check) is unchanged — this PRD supplements it, not replaces it.

---

## Solution Overview

### Trace Identification

**Use `service.instance.id`, not `vcs.ref.head.revision` or trace ID.**

`vcs.ref.head.revision` (the instrument branch commit SHA) only appears on spans that explicitly record it in the instrumented code — confirmed via live query: filtering by SHA returned 1 span out of 621 from the same process run. Trace IDs are also not suitable: one process invocation produces multiple traces (each journal section generation is its own trace), so no single trace ID captures the full run. `service.instance.id` is a UUID set once per process invocation and appears on every span from that run. It is the correct identifier for "all spans from this specific execution."

### Two Target Types

**Targets with organic daily use (commit-story-v2):** The instrument branch is running as part of the developer's normal workflow. Spans accumulate in Datadog naturally with each git commit / journal entry. The pre-run verification step queries these existing spans and captures `service.instance.id` from the most recent run — no dedicated trace capture invocation needed.

**Targets without organic use (taze, future targets):** Run the target using the IS scoring invocation command (documented in each eval PRD's IS scoring milestone — not centralized; `evaluation/is/README.md` has only a generic template). Run this with the Datadog Agent running (before stopping it for IS scoring proper). Capture `service.instance.id` immediately after.

Note: once issue #899 lands (Datadog exporter added to the OTel Collector config), non-organic-use targets can capture their trace from the IS scoring run itself without a separate invocation.

### How to Find the Per-Target Invocation Command

The invocation command for each target is in that target's eval PRD's IS scoring milestone — look for the step that sets `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`. For commit-story-v2, see the most recent commit-story-v2 eval PRD. For taze, see PRD #82. These commands are not centralized — each PRD carries target-specific context (SDK installs, CLI modes, etc.) that the README omits.

---

## Success Criteria

1. Pre-run verification queries Datadog and confirms target health before every eval run
2. `service.instance.id` is captured and stored in `evaluation/<target>/run-N/trace-artifact.md` for each eval run
3. Per-file evaluation agents use the captured trace to supplement static checks with runtime evidence
4. Post-run verification queries Datadog to confirm new instrument branch spans appear after the eval run
5. PRD template updated to include all three Datadog steps (pre-run, trace supplement, post-run)
6. PRD #22 (run-22) updated with pre-run verification and trace supplement steps

---

## Milestones

- [ ] **Trace capture protocol** — Define and document the trace capture procedure for both target types. Produce `evaluation/trace-capture-protocol.md` with:
  1. **Organic targets (commit-story-v2):** Query `service:commit-story` in Datadog MCP for spans from the last 7 days. Identify the most recent complete journal generation run — look for a `commit_story.journal.generate_sections` span whose `commit_story.journal.sections` attribute contains all three section types (`["summary","dialogue","technical_decisions"]`). Record `service.instance.id` from that span. This becomes the trace artifact for the eval.
  2. **Non-organic targets (taze, etc.):** With the Datadog Agent running (before the IS scoring step stops it), execute the target's IS scoring invocation command — found in that target's eval PRD IS scoring milestone (the step that sets `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`). Query `service:<target>` in Datadog MCP immediately after (filter `from: now-5m`) to get any span from the run. Record `service.instance.id`. Then proceed with IS scoring as documented.
  3. **Artifact format:** Store in `evaluation/<target>/run-N/trace-artifact.md`:
     ```text
     service.instance.id: <uuid>
     captured: <ISO timestamp>
     target: <target-name>
     instrument_branch: <branch-name>
     query: service:<target> @service.instance.id:<uuid>
     ```
  4. **Note on issue #899:** Once #899 lands (DD exporter in OTel Collector config), step 2 captures the trace during IS scoring itself — no pre-IS-scoring invocation needed.

- [ ] **Pre-run Datadog verification** — Before starting each eval run, add a Datadog health + branch confirmation step. Add this to the pre-run verification milestone in the PRD template and to PRD #22:
  1. Query `service:<target>` in Datadog MCP (last 7 days). If no results: Datadog Agent is not running or target has never been instrumented — stop and investigate.
  2. **For organic targets only:** Confirm the most recent spans are from the expected instrument branch. Check `vcs.ref.head.revision` on `commit_story.journal.save_journal_entry` spans (this attribute is set by the instrumented code on that specific span). The revision should match the most recent instrument branch SHA (`git -C <target-repo> rev-parse --short <instrument-branch>`).
  3. Capture `service.instance.id` from the most recent run (organic targets). This is the trace artifact for use in per-file evaluation.
  4. If the revision does not match: the target has drifted back to main or an older branch. Do not start the eval run — checkout the correct branch first.

- [ ] **Per-file evaluation trace supplement** — Update the per-file evaluation methodology so agents query the captured trace to supplement static code review. Add these instructions to the per-file evaluation milestone in the PRD template and to PRD #22:

  Each per-file evaluation agent receives the `service.instance.id` from `trace-artifact.md` in addition to its existing inputs. **Before writing any evaluation section**, the agent queries Datadog MCP:
  ```text
  service:<target> @service.instance.id:<uuid>
  ```
  and filters to spans relevant to the file under review (by `resourcename` prefix matching the file's namespace, e.g. `commit_story.journal.*` for `journal-graph.js`).

  The agent uses live trace data to supplement (not override) static code review for these specific checks:
  - **Attribute presence at runtime**: Does the span carry the expected custom attributes with non-null values? Static analysis confirms the attribute name; the trace confirms the value was set.
  - **Parent-child relationships**: Are spans nested as the code intends? Query the trace and check `parentid` chains.
  - **Early exit detection**: A span with `gen_ai.operation.name` set but no `gen_ai.response.id` indicates the node decided not to call the LLM. Note whether this matches the code's intent.
  - **CDQ-001 signal**: A `startActiveSpan` span with unexpectedly short duration or error status may indicate a double-end. Cross-reference with static code review — trace data is corroborating evidence, not a definitive finding.

  If the trace has no spans for a given file's namespace: note this in the per-file evaluation (possible that the code path was not exercised in the captured run). Do not fail the file solely on trace absence.

- [ ] **Post-run Datadog verification** — After each eval run, once the new instrument branch is in use, confirm spans appear in Datadog. Add this step after the "Findings Discussion" checkpoint in the PRD template and to PRD #22:
  1. **Organic targets:** Query `service:<target>` for spans newer than the eval run's timestamp. Check `vcs.ref.head.revision` on relevant spans to confirm the new instrument branch SHA appears. If commit-story-v2 has not generated a new journal entry since the eval run, note this and defer verification to the next organic run.
  2. **Non-organic targets:** Run the IS scoring invocation command once with the DD Agent running (after IS scoring is complete and the Agent is restarted). Query Datadog for `service.instance.id` from that run.
  3. Record the `service.instance.id` from the new instrument branch in `trace-artifact.md` as the post-run trace reference.

- [ ] **Update PRD template and PRD #22** — Propagate the three Datadog steps into the eval process:
  1. Read `evaluation/commit-story-v2/run-22/` — if it already exists, PRD #22 is in-progress; update its milestones in place.
  2. Add pre-run Datadog verification to the pre-run milestone (after the existing token/auth checks).
  3. Add trace capture step to the IS scoring milestone (for non-organic targets: run with DD Agent before OTel Collector; for organic targets: capture from existing spans).
  4. Add trace supplement instructions to the per-file evaluation milestone (agents receive `service.instance.id` from `trace-artifact.md`).
  5. Add post-run Datadog verification after the Findings Discussion checkpoint.
  6. PRD #22 (`prds/115-evaluation-run-22.md`) serves as both the currently open eval PRD (updated in steps 2-5 above) and the style reference for the next eval PRD (#23). There is no separate template file — update PRD #22 once; that single update serves both purposes.
  7. Note in the template: "Per-target invocation commands are in each PRD's IS scoring milestone, not centralized. `evaluation/is/README.md` has only a generic pattern."

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D-1 | Use `service.instance.id` not `vcs.ref.head.revision` to identify trace | Live-tested: SHA filter returned 1/621 spans — only spans that explicitly set `vcs.ref.head.revision` in instrumented code carry it. `service.instance.id` appears on all spans from the same process instance. | 2026-06-06 |
| D-2 | Supplement IS scoring, do not replace it | Weaver live-check validates schema compliance — span name correctness, attribute types against registry. Datadog trace data adds runtime evidence that static analysis cannot provide (attribute values, parent-child relationships, lifecycle anomalies). The two are complementary. | 2026-06-06 |
| D-3 | One controlled run is sufficient | For structural verification (span presence, attribute presence, parent-child), one run provides the necessary evidence. Multiple runs would add confidence on early-exit path coverage but are not required for the rubric. | 2026-06-06 |
| D-4 | Per-target invocation commands stay in individual eval PRDs | `evaluation/is/README.md` has only a generic template + one commit-story-v2 example. Taze's invocation (pnpm build, SDK install, multi-mode CLI) lives in PRD #82. Centralizing would require maintaining a registry that diverges from the PRDs. Reference the IS scoring milestone in the relevant eval PRD instead. | 2026-06-06 |
| D-5 | Organic vs non-organic target handling differs | commit-story-v2 generates spans via daily developer workflow — no dedicated trace capture invocation needed. Other targets (taze, future) require a deliberate invocation with DD Agent running. Issue #899 (DD exporter in OTel Collector) will eventually collapse these two paths. | 2026-06-06 |
| D-6 | Span count tracking and token usage trends not added to eval process | Both were evaluated during design: span count is a different signal than IS scoring's SPA-001 rule (counts INTERNAL spans only) and adds redundancy without insight; token usage trends require baseline comparison across runs and are better suited to a dedicated PRD if needed. Neither improves the per-file rubric or the structural verification goal. | 2026-06-06 |
