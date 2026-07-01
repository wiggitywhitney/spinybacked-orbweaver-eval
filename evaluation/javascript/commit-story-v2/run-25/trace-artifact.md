// ABOUTME: Trace artifact for commit-story-v2 run-25 per trace-capture-protocol.md format.
service.instance.id: bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3
captured: 2026-06-19T12:22:43Z
target: commit-story-v2
instrument_branch: spiny-orb/instrument-1781909345452
query: service:commit-story @service.instance.id:bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3

# Notes

## Pre-Run Capture (2026-06-19)

- Source: Organic traces from today's run of commit-story-v2 with instrumentation from the run-24 instrument branch (`bb08c9c`)
- The `commit_story.journal.generate_sections` span referenced in trace-capture-protocol.md was NOT found — 578 spans in the 7-day window, but none matching that name. This is expected: `generate_sections` was added by spiny-orb instrumentation and is only present on instrument branches, not on main.
- The most recent spans were summary-generation runs (trigger_auto_summaries, generate_and_save_daily_summary), not journal-entry-generation runs.
- `commit_story.journal.save_journal_entry` also returned 0 results — this span no longer exists under that name. The current entry-writing span is `commit_story.journal.save_entry`. The trace-capture-protocol.md note at the bottom references the old name and should be updated.
- The `service.instance.id` above is from the most recent organic run (today, 12:22 UTC). It is from the run-24 instrument branch, not the run-25 one.

## Post-Run Verification (2026-06-19)

- Instrument branch `spiny-orb/instrument-1781909345452` (SHA `6a8964d`) confirmed on remote
- No organic spans from run-25 branch observed as of 2026-06-19T14:00 UTC — Whitney has not yet invoked commit-story-v2 on the instrument branch
- When Whitney next invokes commit-story-v2 on the instrument branch: update `service.instance.id` and `query` above, and update `captured` timestamp

## IS Scoring Run (2026-06-20)

- IS scoring run executed at ~21:11 UTC using instrument branch `spiny-orb/instrument-1781909345452`
- IS scoring `service.instance.id`: `ca9d69df-e15d-4810-808f-9bc30cd47411`
- trace_id: `87878c2b61b6a2cf54624b646fd51eb4`
- Confirmed in Datadog: 68 spans from this run in the last 30 minutes as of verification time
- IS score: **100/100** (new high-water mark; per-target SPA-001 threshold of 55 applied via `--target commit-story-v2`)

## Log-Trace Correlation (2026-06-19)

- Pino bridge: healthy — majority of log entries have `trace_id` and `span_id`
- "Journal entry saved" consistently uncorrelated (pre-existing: span context has exited before that log is emitted)
- All other message types correlated — no regression from PRD #77
