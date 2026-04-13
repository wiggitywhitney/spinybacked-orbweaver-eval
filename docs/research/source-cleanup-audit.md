# Source Cleanup Audit

**Date**: 2026-04-13
**PRD**: #47 (Source Cleanup)
**Purpose**: Classify every tracked non-evaluation file before any removal or migration.

## Methodology

Files enumerated via:
```bash
git ls-files src/ tests/ semconv/ scripts/ package.json package-lock.json vitest.config.js spiny-orb.yaml .env.example evaluation-run-2.log
```

Divergence checked with `git diff upstream/main -- <path>` after running `git fetch upstream`.
`upstream` remote points to `../commit-story-v2`.

## Classification Table

| File/Directory | Classification | Rationale |
|---|---|---|
| `.env.example` | safe-to-remove | Identical to upstream/main |
| `package.json` | safe-to-remove | Diverged from upstream; eval removed `files`, `peerDependencies`, and some devDependencies — upstream is the authoritative version for the npm package |
| `package-lock.json` | safe-to-remove | Diverged (stale snapshot from fork time); upstream is authoritative |
| `vitest.config.js` | safe-to-remove | Identical to upstream/main |
| `scripts/.gitkeep` | safe-to-remove | Identical to upstream/main |
| `scripts/install-hook.sh` | safe-to-remove | Eval has older simpler version; upstream/main has improved version with runtime path discovery — upstream is canonical |
| `scripts/test-claude-collector.js` | safe-to-remove | Identical to upstream/main |
| `scripts/test-connection.js` | safe-to-remove | Identical to upstream/main |
| `scripts/test-context-integrator.js` | safe-to-remove | Identical to upstream/main |
| `scripts/test-entry-point.js` | safe-to-remove | Identical to upstream/main |
| `scripts/test-git-collector.js` | safe-to-remove | Identical to upstream/main |
| `scripts/test-journal-graph.js` | safe-to-remove | Identical to upstream/main |
| `scripts/test-journal-manager.js` | safe-to-remove | Identical to upstream/main |
| `scripts/test-mcp-tools.js` | safe-to-remove | Identical to upstream/main |
| `scripts/uninstall-hook.sh` | safe-to-remove | Eval has older simpler version; upstream/main has improved version with better hook detection — upstream is canonical |
| `semconv/attributes.yaml` | safe-to-remove | Eval has an older version with `requirement_level: required` for `gen_ai.request.model`; upstream/main has the more precise `conditionally_required: "Required when an AI model request is issued."` — upstream is authoritative |
| `semconv/registry_manifest.yaml` | safe-to-remove | Identical to upstream/main |
| `spiny-orb.yaml` | eval-specific | Exists on upstream/main but diverged: eval has `sdkInitFile: src/instrumentation.js` (pointing to the eval's local file); upstream has `sdkInitFile: examples/instrumentation.js`. This config is intentionally different — it's the eval's instrument configuration. **Must be retained.** After `src/` removal, `sdkInitFile` will need updating (see milestone 4). |
| `src/collectors/claude-collector.js` | safe-to-remove | Identical to upstream/main |
| `src/collectors/git-collector.js` | safe-to-remove | Identical to upstream/main |
| `src/commands/summarize.js` | safe-to-remove | Identical to upstream/main |
| `src/generators/.gitkeep` | safe-to-remove | Identical to upstream/main |
| `src/generators/journal-graph.js` | safe-to-remove | Identical to upstream/main |
| `src/generators/prompts/guidelines/accessibility.js` | safe-to-remove | Identical to upstream/main |
| `src/generators/prompts/guidelines/anti-hallucination.js` | safe-to-remove | Identical to upstream/main |
| `src/generators/prompts/guidelines/index.js` | safe-to-remove | Identical to upstream/main |
| `src/generators/prompts/sections/daily-summary-prompt.js` | safe-to-remove | Identical to upstream/main |
| `src/generators/prompts/sections/dialogue-prompt.js` | safe-to-remove | Identical to upstream/main |
| `src/generators/prompts/sections/monthly-summary-prompt.js` | safe-to-remove | Identical to upstream/main |
| `src/generators/prompts/sections/summary-prompt.js` | safe-to-remove | Identical to upstream/main |
| `src/generators/prompts/sections/technical-decisions-prompt.js` | safe-to-remove | Identical to upstream/main |
| `src/generators/prompts/sections/weekly-summary-prompt.js` | safe-to-remove | Identical to upstream/main |
| `src/generators/summary-graph.js` | safe-to-remove | Identical to upstream/main |
| `src/index.js` | safe-to-remove | Diverged: eval removed `import './traceloop-init.js'` line; upstream/main has the current version with traceloop support — upstream is canonical |
| `src/instrumentation.js` | eval-specific | Not present on upstream/main. Created in this repo (commits `374e53d`, `e0e62a5`) as eval infrastructure for IS scoring runs — initializes OTLP exporter pointed at local Datadog agent, supports `IS_SCORING_RUN=1`, configures resource attributes. This is not commit-story application code; it should **not** migrate to commit-story-v2. Must be **preserved within the eval repo** (move from `src/` to `evaluation/examples/` or `examples/`) before `src/` is removed. Also required by `spiny-orb.yaml` as `sdkInitFile`. |
| `src/integrators/.gitkeep` | safe-to-remove | Identical to upstream/main |
| `src/integrators/context-integrator.js` | safe-to-remove | Identical to upstream/main |
| `src/integrators/filters/message-filter.js` | safe-to-remove | Identical to upstream/main |
| `src/integrators/filters/sensitive-filter.js` | safe-to-remove | Identical to upstream/main |
| `src/integrators/filters/token-filter.js` | safe-to-remove | Identical to upstream/main |
| `src/managers/.gitkeep` | safe-to-remove | Identical to upstream/main |
| `src/managers/auto-summarize.js` | safe-to-remove | Identical to upstream/main |
| `src/managers/journal-manager.js` | safe-to-remove | Identical to upstream/main |
| `src/managers/summary-manager.js` | safe-to-remove | Identical to upstream/main |
| `src/mcp/.gitkeep` | safe-to-remove | Identical to upstream/main |
| `src/mcp/server.js` | safe-to-remove | Identical to upstream/main |
| `src/mcp/tools/context-capture-tool.js` | safe-to-remove | Identical to upstream/main |
| `src/mcp/tools/reflection-tool.js` | safe-to-remove | Identical to upstream/main |
| `src/utils/.gitkeep` | safe-to-remove | Identical to upstream/main |
| `src/utils/commit-analyzer.js` | safe-to-remove | Identical to upstream/main |
| `src/utils/config.js` | safe-to-remove | Identical to upstream/main |
| `src/utils/journal-paths.js` | safe-to-remove | Identical to upstream/main |
| `src/utils/summary-detector.js` | safe-to-remove | Identical to upstream/main |
| `tests/collectors/claude-collector.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/collectors/git-collector.test.js` | safe-to-remove | Diverged: eval is missing ABOUTME headers and a new `getPreviousCommitTime` ordering test added to upstream — upstream is canonical |
| `tests/commands/summarize.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/fixtures/is/all-pass.jsonl` | eval-specific | Not present on upstream/main; IS scoring test fixture — belongs in eval repo. Currently under `tests/fixtures/is/`; will need to move if `tests/` is removed. Must be **preserved**. |
| `tests/fixtures/is/missing-service-name.jsonl` | eval-specific | Same as above |
| `tests/fixtures/is/orphan-span.jsonl` | eval-specific | Same as above |
| `tests/fixtures/is/too-many-internal.jsonl` | eval-specific | Same as above |
| `tests/generators/journal-graph.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/generators/monthly-summary-graph.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/generators/prompts.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/generators/prompts/monthly-summary-prompt.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/generators/prompts/weekly-summary-prompt.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/generators/summary-graph.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/generators/weekly-summary-graph.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/integrators/context-integrator.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/integrators/filters/message-filter.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/integrators/filters/sensitive-filter.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/integrators/filters/token-filter.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/managers/auto-summarize.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/managers/journal-manager.test.js` | safe-to-remove | Diverged: eval combined two `formatTimestamp` test cases into one and softened the assertion; upstream has the more thorough version — upstream is canonical |
| `tests/managers/monthly-summary-manager.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/managers/summary-manager.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/managers/weekly-summary-manager.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/score-is.test.js` | eval-specific | Not present on upstream/main; imports from `../evaluation/is/score-is.js` — eval scoring test. Must be **preserved**. Will need to move if `tests/` is removed. |
| `tests/utils/commit-analyzer.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/utils/journal-paths.test.js` | safe-to-remove | Identical to upstream/main |
| `tests/utils/summary-detector.test.js` | safe-to-remove | Diverged: eval changed to `toISOString().slice(0, 10)` (UTC-based) while upstream uses local date construction (correct, matches `getTodayString()`) — upstream is canonical |

## Files Not Tracked by Git (No Action Needed)

`evaluation-run-2.log` — listed in the PRD's `git ls-files` command as a candidate but was not returned by that command; it is already gitignored or was never committed. No git action required.

## Notes on Files Present on Upstream but NOT in Eval

These files exist on `upstream/main` but were already removed from the eval repo (no action needed):

- `scripts/setup-dd-agent.sh` — Datadog agent Docker setup; removed from eval repo
- `scripts/teardown-dd-agent.sh` — Datadog agent Docker teardown; removed from eval repo
- `src/traceloop-init.js` — Traceloop auto-instrumentation init; removed from eval repo
- `tests/acceptance-gate.test.js` — Removed from eval repo
- `tests/instrumentation.test.js` — Removed from eval repo
- `tests/scripts/install-hook.test.js` — Removed from eval repo
- `tests/traceloop-init.test.js` — Removed from eval repo

## Upstream Migration Summary

**No files require upstream migration to commit-story-v2.**

All diverged files fall into one of two categories:
1. The eval repo has an older/simpler version and upstream has the improved canonical version (safe-to-remove)
2. The file is eval-specific infrastructure and does not belong in commit-story-v2

`src/instrumentation.js` was initially flagged as a migration candidate in the PRD, but examination shows it is eval infrastructure (OTLP/Datadog exporter, IS scoring run support) — not commit-story application code. It should not go to commit-story-v2. It must be preserved within this repo.

## Eval-Specific Files That Must Be Retained

Before milestone 3 (`git rm`), these eval-specific files must be moved out of their soon-to-be-removed directories:

| Current Path | Must Move To | Reason |
|---|---|---|
| `src/instrumentation.js` | `evaluation/examples/instrumentation.js` (suggested) | Eval OTel bootstrap; required by `spiny-orb.yaml` as `sdkInitFile` |
| `tests/score-is.test.js` | `evaluation/is/score-is.test.js` (suggested) | IS scoring test; imports from `../evaluation/is/score-is.js` |
| `tests/fixtures/is/` | `evaluation/is/fixtures/` (suggested) | IS scoring test fixtures |

After moving these files, `spiny-orb.yaml` will also need updating (`sdkInitFile` path must point to the new location).

## CI Workflows Requiring Updates (Milestone 4)

| Workflow | Issue |
|---|---|
| `.github/workflows/ci.yml` | Runs `npm ci` and `npm run test:coverage` — invalid after package.json removal |
| `.github/workflows/orbweaver-instrument.yml` | Line 66: instruments `src/` which will not exist |

Both workflows must be updated in milestone 4 before the PR can land cleanly.

## Unknowns Requiring Human Review

None. All files have been classified without ambiguity.
