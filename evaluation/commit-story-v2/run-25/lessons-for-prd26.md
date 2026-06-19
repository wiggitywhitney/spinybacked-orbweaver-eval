// ABOUTME: Process observations from run-25 to inform PRD #26 template and milestone drafting.
# Lessons for PRD #26 — commit-story-v2 Run-25

Process observations captured during run-25. Populated incrementally as the run progresses.

## Target-Specific Findings

*(Findings specific to commit-story-v2 that do not belong in the template)*

- TBD

## Generalizable Process Improvements

*(Observations about the eval process itself that may warrant template updates)*

- TBD

## Pre-Run Observations

*(Populated during pre-run verification)*

- **Datadog MCP domain config lost after plugin update**: The `ddsetup` skill stores domain and toolsets to disk (`/Users/whitney.lee/.claude/plugins/data/datadog-claude-plugins-official/domain` and `toolsets`), but a plugin cache update to v0.7.14 reset the registration file. The recovery flow (run `/ddsetup`, re-apply saved config, `/reload-plugins`, re-auth OAuth) added ~30 min to the pre-run setup. Consider adding a note in PRD #26's pre-run milestone explicitly checking for Datadog MCP health BEFORE starting the session rather than mid-verification.

- **commit-story-v2 target was on run-24 instrument branch at session start**: The target repo was on `spiny-orb/instrument-1781811083418` (run-24 branch). Whitney ran commit-story from it this morning, generating today's traces in Datadog with `git.commit.sha: bb08c9c...`. Had to `git checkout main` before starting run-25. The PRD pre-run checklist (step 4) already covers this, but it's worth confirming explicitly at session start before doing anything else.

- **`vcs.ref.head.revision` on spans is the CLI argument, not the instrument branch HEAD**: The span attribute `vcs.ref.head.revision: "7206881"` is the commit SHA argument passed to the commit-story CLI (e.g., `node src/index.js 7206881`). It is NOT the HEAD SHA of the instrumented repo. Use `git.commit.sha` on spans to identify which code version is running.

- **`commit_story.journal.save_journal_entry` span no longer exists**: Searching for this span name returned 0 results. This span may have been renamed or removed in a recent PR. The current entry-writing span is `commit_story.journal.save_entry`. Update any future span-lookup queries accordingly.

- **Datadog health confirmed**: 578 spans in 7-day window as of 2026-06-19, service fully live. No gaps in pipeline.

## Post-Run Observations

*(Populated after spiny-orb instrument completes)*

- TBD
