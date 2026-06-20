// ABOUTME: Process observations from run-25 to inform PRD #26 template and milestone drafting.
# Lessons for PRD #26 — commit-story-v2 Run-25

Process observations captured during run-25. Populated incrementally as the run progresses.

## Target-Specific Findings

*(Findings specific to commit-story-v2 that do not belong in the template)*

- **reflection-tool.js: 2-attempt anomaly — investigate debug dump during deep-dives.** `src/mcp/tools/reflection-tool.js` reported ×2 attempts but agent notes say "No LLM call made" and total output tokens were only 3.1K. This same combination appeared in run-23 and run-24 — 100% reproducible across three consecutive runs on the same file. Possible causes: (a) attempt 1 starts instrumenting `registerReflectionTool` (a synchronous exported function), validator rejects, attempt 2 does pre-scan and correctly concludes nothing to instrument; (b) spiny-orb's attempt counter increments on validator rejection even when the retry is a pre-scan with no LLM call; (c) "No LLM call made" accurately describes attempt 2 only, not the full session. **Action during deep-dives**: read `debug-dumps/reflection-tool.js` (if present) and the verbose log section for this file to determine whether attempt 1 produced instrumentation code that was subsequently rejected. If no debug dump exists, note what the validator flagged. Goal: determine whether this is a pre-scan logic gap (spiny-orb starts instrumenting before confirming RST-001 applies) or an imprecise attempt counter.

## Generalizable Process Improvements

*(Observations about the eval process itself that may warrant template updates)*

- **Add log-trace correlation check to post-run Datadog verification**: commit-story-v2 has a pino log bridge (PRD #77 M1–M2) that injects `trace_id`/`span_id` into structured log records. This feature can be silently broken by spiny-orb instrumentation disrupting bootstrap order. A one-query check (`search_datadog_logs service:commit-story from:<run-start>`) confirming that correlated logs appear is low-cost and catches regressions that IS scoring would never surface. Proposed template addition: add this as a commit-story-v2-specific sub-step in the "Post-run Datadog verification" milestone with a note that it applies only to targets with an active log bridge. Run-25 baseline: 4 correlated logs from the run-24 instrument branch (12:16–12:23 UTC 2026-06-19).

- **[SPINY-ORB TEAM ACTION] Attribute selection guidance in agent prompt is insufficient — three angles to address.** Run-25 showed high attribute variance across files and across runs: `summary-detector.js` went from 3 attributes in run-24 to 0 attributes in run-25 on identical spans; `summarize.js` went from 2 attributes in run-24 to 6 in run-25; `git-collector.js` has drifted from 4→3→3 across three runs. The agent is making attribute decisions inconsistently because the prompt doesn't give it a principled framework. Three concrete improvements:

  1. **Minimum-attribute threshold guidance**: Add guidance such as: "Any span that processes a meaningful domain object should carry at least one attribute describing its primary input or output. A span with zero attributes is only appropriate when the operation is purely structural (e.g., a no-arg setup call) or when every candidate attribute would violate CDQ-007 (PII, unbounded string). Before declaring 0 attributes, explicitly ask: what does an on-call engineer need to understand what this span processed?" This directly addresses the `summary-detector.js` regression where 9 spans dropped all 3 previously-held attributes.

  2. **Registered-vs-extension decision guidance**: Add guidance such as: "If no registered key exactly fits, that is not a reason to skip the attribute — it is a reason to declare a schema extension. A new attribute with a clear name and type is better than no attribute. Only skip the attribute if the data itself is inappropriate (PII, unbounded, CDQ-007 violation), not because the registry doesn't yet have a matching key." The current prompt appears to treat 'no registered key found' as equivalent to 'skip attribute', which is not the intent.

  3. **Industry practice research spike**: Before writing new guidance, conduct a research spike with this specific question: *"What does industry best practice say about which span attributes are worth collecting, and why — and what concrete heuristics should an AI instrumentation agent use to decide when to add an attribute vs. skip it?"* Sources to cover: (a) OTel specification guidance on attribute selection (what the spec says about when attributes are required vs. recommended vs. optional, and what 'good' looks like); (b) Datadog's span enrichment recommendations (which attributes deliver on-call diagnostic value, cardinality guidance); (c) practitioner heuristics from the OTel community (signal-to-noise decisions, the 'would an on-call engineer need this?' test, cardinality risk patterns). The output should be 3–5 concrete, citable heuristics that can be embedded directly into the spiny-orb agent prompt — not general philosophy, but actionable decision rules. **Surface as actionable item in `actionable-fix-output.md`** — this is a prompt engineering task for the spiny-orb team, not a code change.

## Pre-Run Observations

*(Populated during pre-run verification)*

- **Datadog MCP domain config lost after plugin update**: The `ddsetup` skill stores domain and toolsets to disk (`$HOME/.claude/plugins/data/datadog-claude-plugins-official/domain` and `toolsets`), but a plugin cache update to v0.7.14 reset the registration file. The recovery flow (run `/ddsetup`, re-apply saved config, `/reload-plugins`, re-auth OAuth) added ~30 min to the pre-run setup. Consider adding a note in PRD #26's pre-run milestone explicitly checking for Datadog MCP health BEFORE starting the session rather than mid-verification.

- **commit-story-v2 target was on run-24 instrument branch at session start**: The target repo was on `spiny-orb/instrument-1781811083418` (run-24 branch). Whitney ran commit-story from it this morning, generating today's traces in Datadog with `git.commit.sha: bb08c9c...`. Had to `git checkout main` before starting run-25. The PRD pre-run checklist (step 4) already covers this, but it's worth confirming explicitly at session start before doing anything else.

- **`vcs.ref.head.revision` on spans is the CLI argument, not the instrument branch HEAD**: The span attribute `vcs.ref.head.revision: "7206881"` is the commit SHA argument passed to the commit-story CLI (e.g., `node src/index.js 7206881`). It is NOT the HEAD SHA of the instrumented repo. Use `git.commit.sha` on spans to identify which code version is running.

- **`commit_story.journal.save_journal_entry` span no longer exists**: Searching for this span name returned 0 results. This span may have been renamed or removed in a recent PR. The current entry-writing span is `commit_story.journal.save_entry`. Update any future span-lookup queries accordingly.

- **Datadog health confirmed**: 578 spans in 7-day window as of 2026-06-19, service fully live. No gaps in pipeline.

## Post-Run Observations

*(Populated after spiny-orb instrument completes)*

- **index.js CDQ-001 regression (RUN24-1): no mention of process.exit() in agent notes.** index.js went from 1 span in run-24 to 2 spans in run-25 (`commit_story.cli.main` + `commit_story.journal.handle_summarize`), with 1 attribute. The agent notes describe a graceful-degradation catch (NDS-007) but make no mention of `process.exit()` or any CDQ-001 concern. Whether the CDQ-001 regression is fixed (spiny-orb now handles `process.exit()` correctly) or missed (agent didn't notice the pattern) cannot be determined from the log alone — **must check debug dump and committed code during per-file evaluation.**

- **summary-manager.js ⚠️ new PARTIAL — regression vs. both prior runs.** Run-23 and run-24 both produced ✅ 9 spans. Run-25 produced ⚠️ 7 spans due to COV-003 on `readWeekDailySummaries` and `readMonthWeeklySummaries`: validator rejected error recording on what it classified as graceful-degradation catches. The result is a partial commit with 2 functions skipped. This is a new regression, not seen in either prior run. Investigate during deep-dives whether (a) these catches genuinely are graceful-degradation patterns the agent should not have touched, (b) the COV-003/NDS-007 boundary is ambiguous here, or (c) the validator's NDS-007 classification differs from the agent's.

- **summary-detector.js attribute collapse: 3a→0a (run-24 to run-25).** 9 spans held stable, but all 3 previously-declared schema extension attributes were dropped. The agent declared no new extensions and the result shows 0a. This is the clearest single-file example of the attribute guidance gap — same span structure, identical source code, but the agent decided no attributes were warranted. The 3 run-24 attributes (whatever they were) were either (a) incorporated into the registered schema between runs (making them non-extensions and thus not counted) or (b) not added at all in run-25. **Check run-24 debug dump or instrument branch during deep-dives** to determine which case applies. If (b), this is a direct call to fix the minimum-attribute threshold guidance.

- **summarize.js attribute variance: 2a→6a (run-24 to run-25).** The inverse problem: attribute count tripled. 6 schema extension attributes declared on 3 spans. Some variance is expected (the agent may have identified more relevant data), but a 3× jump on an unchanged file suggests the agent lacks a principled upper bound as much as a lower bound. Surface during per-file evaluation.

- **auto-summarize.js: "5 attributes used" in notes, 0a in result — not a contradiction.** The agent notes say "All attributes used (commit_story.journal.dates_count, …) are already registered in the schema — no new attribute keys were declared." The result header `0 attributes` counts *schema extension keys only*, not total `setAttribute` calls. auto-summarize.js used 5 registered attributes with no new extensions — the 0a is correct. **This clarifies the meaning of the attribute count throughout all run tables**: 0a means no new schema extensions, not zero data passed to attributes.

- **PR created successfully:** https://github.com/wiggitywhitney/commit-story-v2/pull/86, branch `spiny-orb/instrument-1781909345452`. Live-check: 657 spans, 4462 advisory findings. Total runtime: 1h 13m 41.5s. Cost: $7.38 (vs. run-24 ~$3.70 — ~2× increase; likely driven by higher attempt counts on several files).
