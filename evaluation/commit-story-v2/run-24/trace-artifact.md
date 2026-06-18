service.instance.id: 8d68fb9e-2c0a-45b9-9016-3958aa25c4c4
captured: 2026-06-18T20:25:31Z
target: commit-story-v2
instrument_branch: spiny-orb/instrument-1781811083418
query: service:commit-story @service.instance.id:8d68fb9e-2c0a-45b9-9016-3958aa25c4c4

# Notes

Post-run trace artifact (run-24 instrument branch). Organic post-commit hook fired
at 2026-06-18T20:25:31Z from the run-24 instrument branch checked out in the local
repo. Instrumented spans confirmed: `commit_story.journal.save_entry`,
`commit_story.commands.trigger_auto_summaries`,
`commit_story.commands.trigger_auto_weekly_summaries`,
`commit_story.commands.trigger_auto_monthly_summaries`,
`commit_story.journal.find_unsummarized_months`,
`commit_story.journal.find_unsummarized_days`,
`commit_story.journal.find_unsummarized_weeks`,
`commit_story.journal.get_summarized_months`,
`commit_story.journal.get_summarized_weeks`,
`commit_story.journal.get_days_with_weekly_summaries`,
`commit_story.journal.get_summarized_days`,
`commit_story.journal.get_days_with_daily_summaries`,
`commit_story.journal.get_days_with_entries`,
`commit_story.journal.discover_reflections`,
`commit_story.journal.ensure_directory`.

Note: `vcs.ref.head.revision: HEAD` (not `7206881`) — the hook invokes the CLI
with `HEAD` as the git ref argument, stored literally. Branch confirmed indirectly:
commit-story-v2 was checked out to the run-24 instrument branch at the time of the
organic run.

# SCH-003 Pre-Run Observation

From the run-23 instrument branch trace:
- `commit_story.git.diff_size: 36391` — set as integer (correct for `type: int`)
- `commit_story.summarize.monthly_summaries_generated: "0"` — set as string (SCH-003 bug)

Both are on the run-23 branch. Run-24 will produce a new instrument branch with
the updated spiny-orb prompt guidance targeting correct `type: int` declarations.
