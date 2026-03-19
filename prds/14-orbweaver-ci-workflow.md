# PRD #14: Orbweaver CI Workflow

**Status:** In Progress
**Created:** 2026-03-18
**GitHub Issue:** #14
**Priority:** High

---

## Problem Statement

Running spinybacked-orbweaver against this codebase currently requires manual local setup: cloning the orbweaver repo, installing dependencies, installing Weaver CLI, configuring environment variables, and running the CLI by hand. Results are captured ad-hoc and there is no repeatable, auditable way to trigger an instrumentation run.

Previous evaluation runs (PRDs #2, #3, #5) were all manual. A GitHub Actions workflow would make runs reproducible, capture structured results as artifacts, and let Whitney kick off a run with one click — even while traveling.

## Solution

A `workflow_dispatch` GitHub Actions workflow that:
1. Checks out orbweaver from source (always latest `main`)
2. Instruments all JS source files in this repo
3. Creates a PR with the instrumented code on a timestamped branch
4. Produces a job summary with per-file metrics and uploads the full JSON result as an artifact

## Architecture

```text
workflow_dispatch (manual trigger)
  ├── Checkout commit-story-v2-eval
  ├── Checkout spinybacked-orbweaver (main) → separate path
  ├── Setup Node.js 24
  ├── npm ci in orbweaver checkout
  ├── Install Weaver CLI v0.21.2
  ├── Rename orbweaver.yaml → spiny-orb.yaml (if needed)
  ├── Create timestamped branch: orb/instrument-YYYYMMDD-HHMM
  ├── Run: node <orbweaver>/bin/spiny-orb.js instrument --yes --no-pr --output json src/
  ├── Parse JSON result:
  │   ├── Build markdown summary table → $GITHUB_STEP_SUMMARY
  │   ├── Emit ::warning annotations for advisories
  │   └── Set output variables (succeeded/failed/skipped counts)
  ├── Upload full JSON as build artifact
  ├── Commit instrumented files on the branch
  └── gh pr create with structured summary
```

## Design Decisions

- **Build from source, not `uses:` composite action** — always picks up latest orbweaver fixes from `main` without version pinning lag.
- **`--no-pr` flag** — the workflow handles branch/PR creation itself. Orbweaver's built-in PR creation from subprocess is untested end-to-end (orbweaver issue #218). Workflow-level git operations are more reliable and give us control over PR description/labels.
- **Node 24** — orbweaver requires `>=24.0.0`. This repo's CI uses 20/22, but the instrumentation workflow is independent.
- **`ANTHROPIC_API_KEY` as GitHub repo secret** — the `.env` file is gitignored and unavailable in CI.
- **Config file rename** — `orbweaver.yaml` → `spiny-orb.yaml` per orbweaver issue #177 (npm rename). Can be done as a workflow step or committed to the repo ahead of time.
- **Generous timeout** — 30 source files at potentially 5-20+ minutes each. Set workflow timeout to 4 hours.

## Known Risks

- **Token cost** — 30 files with current token budgets could be expensive. Orbweaver issue #210 (adaptive token limits) would reduce this once merged.
- **Token divergence on retry** — orbweaver issue #211 means retries can burn the full 65K budget producing worse results. Long wall times possible.
- **Schema extension dedup** — orbweaver issue #221 may cause unexpected counts in the summary. Non-blocking.
- **First CI-based run** — this is the first time orbweaver runs in CI against this repo. Manual runs have been validated, but CI environment differences (paths, permissions) could surface new issues.

## Success Criteria

- Workflow runs to completion on manual dispatch
- Instrumented code appears on a timestamped branch with a PR
- Job summary shows per-file status table with spans added, schema extensions, errors, and token usage
- Full JSON result is downloadable as a build artifact
- Advisory findings surface as `::warning` annotations in the workflow run

---

## Milestones

- [x] **Workflow file created and valid** — `.github/workflows/orbweaver-instrument.yml` passes `actionlint` and can be dispatched. Includes: dual checkout, Node 24 setup, orbweaver `npm ci`, Weaver CLI install, config rename step.
- [ ] **CLI invocation runs successfully** — `spiny-orb instrument --yes --no-pr --output json src/` executes in CI, produces JSON output, and exits. Full 30-file run completes within timeout.
- [x] **Result parsing and job summary** — JSON output is parsed into a markdown table written to `$GITHUB_STEP_SUMMARY`. Table includes: file path, status, spans added, schema extensions, error progression, token usage. `::warning` annotations emitted for advisories.
- [x] **Artifact upload** — Full JSON result uploaded as a build artifact with 30-day retention.
- [x] **PR creation with instrumented code** — Workflow commits changes to a `orb/instrument-YYYYMMDD-HHMM` branch and creates a PR with a structured summary derived from the JSON result.
- [x] **Secret configured** — `ANTHROPIC_API_KEY` set as a GitHub repo secret and verified working in CI.

## Dependencies

- `ANTHROPIC_API_KEY` must be configured as a GitHub repo secret before first run
- spinybacked-orbweaver `main` branch must be in a working state
- Weaver CLI v0.21.2 must remain available at the current download URL

## Out of Scope

- Scheduled/automatic runs (manual dispatch only for now)
- Running orbweaver's own test suite in this workflow
- Evaluating instrumentation quality (that is the existing PRD #2/#3/#5 process)
- Modifying orbweaver source code
