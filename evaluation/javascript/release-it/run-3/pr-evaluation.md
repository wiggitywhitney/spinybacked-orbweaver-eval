# PR Artifact Evaluation — release-it Run 3

**PR**: https://github.com/wiggitywhitney/release-it/pull/2 (created manually — spiny-orb PR creation failed; see FINDING-RUN-1 in spiny-orb-findings.md)
**Branch**: spiny-orb/instrument-1777912706406
**State**: OPEN

---

## Push / PR Creation Status

Push succeeded. PR creation failed silently — `gh pr create` without `--repo` targeted `release-it/release-it` (upstream) instead of `wiggitywhitney/release-it` (fork), and the fine-grained PAT was rejected. PR created manually with the same content.

---

## PR Summary Quality

**Length**: substantial (per-file table, schema changes, advisory findings, token usage section)

### Accuracy Assessment

| Element | Accurate | Notes |
|---------|----------|-------|
| File counts (23 total / 3 committed / 18 "no changes needed" / 2 failed) | YES | Matches run output |
| Per-file span counts | YES | config.js: 3, factory.js: 2, util.js: 1 |
| Per-file attempt counts | YES | Correct |
| Per-file cost | YES | config: $0.41, factory: $0.63, Git.js: $0.43, GitLab.js: $0.00, util: $0.13 |
| "No changes needed" file list (18 files) | YES | All 18 files listed |
| Schema attribute additions (2 new attrs) | YES | `release_it.plugin.external_count`, `release_it.util.collection_size` |
| New span IDs (6) | YES | All 6 listed |
| Token usage | YES | 33,238 input / 73,884 output / 33,170 cache read / 99,660 cache write |
| Total cost | YES | $1.59 |
| Live-check | YES (advisory) | "OK (no spans received)" — correctly notes telemetry absence |

### Advisory Findings Quality

The PR summary includes 42 advisory findings. Assessment:

| File | Advisory | Verdict | Notes |
|------|----------|---------|-------|
| GitBase.js | COV-004 × 6 | **Valid** | 6 async class methods (init, getCommitsSinceLatestTag, getChangelog, getRemoteUrl, getRemote, getSecondLatestTagName) — confirmed false negatives; pre-scan should not have skipped this file |
| GitRelease.js | COV-004 × 2 | **Valid** | 2 async class methods (beforeRelease, processReleaseNotes) — confirmed false negatives |
| Plugin.js | COV-004 × 1 | **Valid** | showPrompt async method — confirmed false negative |
| factory.js | CDQ-007 on `enabledExternalPlugins.length` | **False positive** | `enabledExternalPlugins` is initialized as `[]` before the for loop; it is never null or undefined at setAttribute time |
| factory.js | SCH-001 × 2 (plugin.load ≈ config.load_local_config, plugin.get_plugins ≈ plugin.load) | **False positive** | Plugin loading and config loading are semantically unrelated operations; get_plugins orchestrates multiple loads |
| GitHub.js | COV-004 × 13 | **Valid** | 13 async class methods including `init`, `release`, `createRelease`, `getLatestRelease`, `updateRelease`, `commentOnResolvedItems`, etc. — all confirmed false negatives; GitHub.js is a substantial Octokit integration |
| npm/npm.js | COV-004 × 8 | **Valid** | 8 async class methods including `init`, `bump`, `publish`, `isCollaborator`, `getLatestRegistryVersion`, etc. — all confirmed false negatives |
| Version.js | COV-004 × 1 | **Valid** | `getIncrementedVersion` async method — false negative |
| prompt.js | COV-004 × 1 | **Valid** | `show` async method — false negative |
| shell.js | COV-004 × 2 | **Valid** | `execFormattedCommand`, `execWithArguments` async methods — false negatives |

**Advisory contradiction rate**: 3 false positives out of 42 total = **7%** — significantly lower than run-12 (44%). The advisor is correctly identifying real COV-004 gaps across nearly all advisory findings.

**Critical pattern confirmed**: The advisory findings prove the pre-scan is systematically failing to detect async class methods. 8 of 18 "correct skip" files — GitBase.js, GitRelease.js, Plugin.js, GitHub.js, npm/npm.js, Version.js, prompt.js, shell.js — contain async class methods the advisor found. These are false negatives, not correct skips. True correct skips are 10 files (args.js, cli.js, index.js, log.js, git/prompts.js, github/prompts.js, github/util.js, gitlab/prompts.js, npm/prompts.js, and the factory.js inner helper `getPluginName`).

### Reviewer Utility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Completeness | 5/5 | All files, spans, attrs, schema changes, costs listed |
| Accuracy | 5/5 | File-level data fully accurate |
| Actionability | 5/5 | Advisory findings correctly identify the pre-scan false negatives; low false positive rate |
| Presentation | 4/5 | Clean markdown, good tables; live-check "OK" is slightly misleading (means no data, not verified OK) |
| **Overall** | **4.75/5** | Best advisor quality observed across release-it runs |

---

## Cost

| Source | Amount |
|--------|--------|
| Run total | $1.59 |
| Run-2 | $5.69 |
| Delta vs run-2 | −$4.10 (72% reduction) |

**$1.59** — lowest cost of any release-it run. Driven by 18 correct skips (no LLM calls) vs 3 correct skips in run-2. The failed Git.js cost $0.43 (2 API terminations); GitLab.js $0.00 (pre-scan, no LLM call).

---

## Live-Check

**Result**: OK (no spans received)

The live-check executed but received no OTLP telemetry. This is expected: the instrumented files require a running SDK (`examples/instrumentation.js`) and an active OTLP endpoint to export spans. The live-check is a static compliance check in the absence of a running application — "OK" means no violations detected, not that telemetry was actually validated. IS scoring (a separate milestone) will provide actual telemetry validation.

---

## Pre-Scan False Negatives — Revised Correct-Skip Count

Based on advisory findings, 8 of the 18 "correct skip" files contain async class methods and should have been instrumented:

| File | Async methods missed | Category |
|------|---------------------|----------|
| lib/plugin/github/GitHub.js | 13 | Major (Octokit integration — primary GitHub API interface) |
| lib/plugin/npm/npm.js | 8 | Major (npm publish operations) |
| lib/plugin/GitBase.js | 6 | Moderate (git base operations) |
| lib/plugin/GitRelease.js | 2 | Minor |
| lib/plugin/Plugin.js | 1 | Minor |
| lib/plugin/version/Version.js | 1 | Minor |
| lib/prompt.js | 1 | Minor |
| lib/shell.js | 2 | Minor |

**True correct skips**: 10 files (args.js, cli.js, index.js, log.js, git/prompts.js, github/prompts.js, github/util.js, gitlab/prompts.js, npm/prompts.js — all truly sync-only files, plus lib/spinner.js — async-looking but its async methods are unexported helpers).

The pre-scan is falsely classifying plugin class methods as unexported or synchronous. This is a spiny-orb defect — class method detection logic does not correctly identify exported async class methods as instrumentable. This will carry forward to every plugin file in every future eval target that uses class-based plugin architecture.
