service.instance.id: 2140b04c-6055-4731-8b53-2d4225017478
captured: 2026-06-11T01:34:14Z
target: commit-story-v2
instrument_branch: spiny-orb/instrument-1781089793056
query: service:commit-story @service.instance.id:2140b04c-6055-4731-8b53-2d4225017478

# Notes

Pre-run trace artifact (run-23 instrument branch). Complete run confirmed:
`commit_story.journal.generate_sections` span at 2026-06-11T01:34:14Z with
`commit_story.journal.sections: ["summary","dialogue","technical_decisions"]`.

VCS revision `5bfc917` matches `spiny-orb/instrument-1781089793056` (run-23 branch).

Update this file after the run-24 eval run completes and a new instrument branch
produces spans in Datadog.

# SCH-003 Pre-Run Observation

From the run-23 instrument branch trace:
- `commit_story.git.diff_size: 36391` — set as integer (correct for `type: int`)
- `commit_story.summarize.monthly_summaries_generated: "0"` — set as string (SCH-003 bug)

Both are on the run-23 branch. Run-24 will produce a new instrument branch with
the updated spiny-orb prompt guidance targeting correct `type: int` declarations.
