// ABOUTME: Pre-run Datadog trace baseline captured before spiny-orb instrument run-25.
# Trace Artifact — commit-story-v2 Run-25

Captured during pre-run verification (milestone 4, step 16).

## Capture Metadata

- **captured:** 2026-06-19T12:45:00Z (approximate)
- **query:** `service:commit-story` (last 7 days)
- **span count returned:** 578 spans across 7 days
- **health status:** PASS — service is live and emitting spans

## Pre-Run Baseline

### commit-story-v2 Target State
- **branch:** `main`
- **HEAD SHA:** `6a2897ca96ccd0c8eacd4e7dd97203fdadfb70b0`
- **most recent commit:** "Merge pull request #85 from wiggitywhitney/feature/42-43-45-46-bug-fixes"

### Most Recent Spans in Datadog
- **trace timestamp:** 2026-06-19T12:22:43.549Z (from run-24 instrument branch, same day)
- **git.commit.sha on spans:** `bb08c9c433da0f5bfba23b4ae113d5dfc3d855b0` (run-24 instrument branch — not current main)
- **service.instance.id:** `bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3`
- **service.version:** `2.0.0-alpha.0`
- **env:** `development`
- **host.name:** `COMP-D2JXTJQ32T`

### Span Names Observed
```text
commit_story.cli.main
commit_story.commands.trigger_auto_summaries
commit_story.commands.trigger_auto_weekly_summaries
commit_story.commands.trigger_auto_monthly_summaries
commit_story.journal.generate_and_save_daily_summary
commit_story.journal.generate_daily_summary
commit_story.journal.daily_summary_node
commit_story.journal.save_daily_summary
commit_story.journal.save_entry
commit_story.journal.find_unsummarized_days
commit_story.journal.find_unsummarized_weeks
commit_story.journal.find_unsummarized_months
commit_story.journal.get_days_with_entries
commit_story.journal.get_summarized_days
commit_story.journal.get_days_with_daily_summaries
commit_story.journal.get_summarized_weeks
commit_story.journal.get_weeks_with_weekly_summaries
commit_story.journal.get_summarized_months
commit_story.journal.read_day_entries
commit_story.journal.ensure_directory
```

### Instrument Branch Confirmation
The pre-run traces originate from `bb08c9c` (run-24 instrument branch), not `6a2897c` (current main). This is expected — Whitney ran commit-story with the run-24 instrumentation earlier today, then checked out main for the run-25 baseline. The run-25 instrument branch will be created from main (`6a2897c`).

## Post-Run Verification (Populated After Instrument Run)

After spiny-orb creates the run-25 instrument branch and Whitney executes it, verify:
- New spans appear with `git.commit.sha` matching the run-25 instrument branch HEAD
- A new `service.instance.id` value appears (new process = new instance ID)
- The run-25 instrument branch span names differ from the list above (new instrumentation added)

**Expected run-25 changes (from PRD #140 focus areas):**
- CDQ-001 regression fix verified: `process.exit()` paths should produce complete spans via `fixProcessExitSpanEnd()`
- SCH-003 verified: `diff_lines` should appear as integer in span attributes, not string
- PH-1 verified: no hardcoded commit-story-v2 attribute names in agent prompt output
