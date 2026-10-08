service.instance.id: 7719aa1c-8095-4835-be12-f08c3eb837b3
captured: 2026-10-08T15:02:53Z
target: release-it
instrument_branch: spiny-orb/instrument-1790686416741
query: service:release-it @service.instance.id:7719aa1c-8095-4835-be12-f08c3eb837b3

## Capture Notes

Captured from IS scoring attempt 3 (`--dry-run --ci --no-npm --git.requireCleanWorkingDir=false`; see `run-summary.md`, "IS Scoring Run (2026-10-08)"). The first query, about 3.5 minutes after the run, returned only attempt 1's 4 spans (instance `d7e35051-5eee-43fe-9169-f1e14ad0d2a7`). The retry after a 3-minute wait returned all 18 spans for the instance above, matching the 18 spans in `eval-traces-run5.json`.

## Trace Structure

10 distinct trace IDs, 10 root spans, no orphans. The spans have no common root, because `lib/index.js` `runTasks` and the `lib/cli.js` default export have no span.

| Trace ID (prefix) | Root | Descendants (parent → child) |
|-------------------|------|------------------------------|
| 1a4788c1 | `release_it.config.init` | → `config.load_options` → `config.load_local_config` |
| 09481ede | `release_it.plugin.get_plugins` | none |
| b84ea327 | `release_it.github.init` | `github.is_authenticated` and `github.is_collaborator`, both direct children, both 0ms |
| fca4b6d0, c2be03df, 92c94e5b, 957bc94b, 976c2559 | `release_it.util.reduce_until` (five separate traces) | none |
| 3432f3da | `release_it.git_release.before_release` | none |
| b5e12ef4 | `release_it.github.release` | → `github.create_release` → `github.get_octokit_release_options` → `github.render_release_notes` → `github.get_commits` (a nested chain, each about 848-850ms) |

All spans report status `ok`. The spans query with `custom_attributes: ["service.instance.id"]` returned only `env`, `git.commit.sha`, `git.repository.id`, and `service.instance.id` in the custom block. Custom `release_it.*` attributes are not checked here; that belongs to the per-file trace reconciliation step.
