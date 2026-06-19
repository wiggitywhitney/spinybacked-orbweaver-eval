// ABOUTME: Trace artifact for commit-story-v2 run-25 per trace-capture-protocol.md format.
service.instance.id: bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3
captured: 2026-06-19T12:22:43Z
target: commit-story-v2
instrument_branch: (pre-run — not yet available; update after run-25 instrument completes)
query: service:commit-story @service.instance.id:bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3

# Notes

## Pre-Run Capture (2026-06-19)

- Source: Organic traces from today's run of commit-story-v2 with instrumentation from the run-24 instrument branch (`bb08c9c`)
- The `commit_story.journal.generate_sections` span referenced in trace-capture-protocol.md was NOT found — 578 spans in the 7-day window, but none matching that name. This is expected: `generate_sections` was added by spiny-orb instrumentation and is only present on instrument branches, not on main.
- The most recent spans were summary-generation runs (trigger_auto_summaries, generate_and_save_daily_summary), not journal-entry-generation runs.
- `commit_story.journal.save_journal_entry` also returned 0 results — this span no longer exists under that name. The current entry-writing span is `commit_story.journal.save_entry`. The trace-capture-protocol.md note at the bottom references the old name and should be updated.
- The `service.instance.id` above is from the most recent organic run (today, 12:22 UTC). It is from the run-24 instrument branch, not the run-25 one.

## Post-Run Update Required

After the run-25 instrument branch runs and Whitney invokes commit-story:
1. Update `instrument_branch` to the actual run-25 instrument branch name
2. Update `service.instance.id` if a new process invocation produces a different UUID
3. Update `query` to use the new `service.instance.id`
4. Update `captured` to the post-run timestamp
