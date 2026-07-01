# Actionable Fix Output — release-it Run-2

**Date**: 2026-04-21
**Quality**: 24/25 (96%)
**Q×F**: 0 (infrastructure failure — all commits rolled back)

---

## Cross-Document Audit

Consistency verified across run-summary, failure-deep-dives, per-file-evaluation, pr-evaluation, rubric-scores, and baseline-comparison:

| Check | Result |
|-------|--------|
| File counts (23 processed, 20 failed, 3 correct skips) | ✓ Consistent |
| Validation failures (8) + checkpoint rollbacks (12) = 20 failed | ✓ Consistent |
| Quality score (24/25) matches per-file evaluation findings | ✓ Consistent |
| Cost ($5.69) consistent between run-summary and pr-evaluation | ✓ Consistent |
| Gate count (4/5 + 1 not evaluable) consistent | ✓ Consistent |
| Spans attempted (29) = sum of per-file schema extensions | ✓ Consistent |
| IS scoring flagged as NOT EVALUABLE (no committed files) | ✓ Consistent |

No internal inconsistencies found.

---

## Run-2 Key Findings

**Run-2 result in one sentence**: The first complete pass across all 23 release-it files (run-1 halted at file 5), with 96% quality on the agent's instrumentation reasoning, but 0 files surviving to the codebase due to two compounding infrastructure failures.

### What went right

- All 23 files processed — the gpgsign fix (GIT_CONFIG_GLOBAL override) worked perfectly
- Agent instrumentation quality: 24/25 on the 12 gate-passing files, with sound CDQ-007 guards, correct RST decisions, and consistent tracer naming
- arrowParens diff surfacing (spiny-orb PR #532) worked — the agent read the diff correctly every attempt, but 3 attempts was not enough to fix both arrowParens and print-width simultaneously
- Push succeeded — the branch exists at wiggitywhitney/release-it with all 23 files on record

### What blocked results

1. **OTel module resolution** (new blocker, P1): Every file with `import { trace } from '@opentelemetry/api'` causes the release-it test suite to fail at checkpoint — `@opentelemetry/api` is in peerDependencies but not installed in `node_modules`. All 5 files that committed spans were rolled back.

2. **PAT still lacks pull_requests:write** (persistent from run-1): The `github-token-release-it` secret in GCP Secret Manager does not have `pull_requests:write` despite the vals.yaml comment saying it does. Push works; PR creation fails.

3. **arrowParens + print-width cascade** (persistent from run-1, partially improved): 6 LINT failures. The agent sees the diff (fixed by spiny-orb PR #532) but can't apply both arrowParens and print-width wraps correctly in 3 attempts.

---

## Findings for spiny-orb

### SPINY-ORB-1 — peerDependencies strategy breaks checkpoint tests (P1)

**Root cause**: `dependencyStrategy: peerDependencies` adds `@opentelemetry/api` to peerDependencies only. peerDependencies are not installed by default (`npm install` only installs dependencies and devDependencies). When spiny-orb runs `npm test` at checkpoint, `import { trace } from '@opentelemetry/api'` in any committed file fails module resolution, crashing all tests.

**Fix options**:
- (A) Before running checkpoint tests, install peerDependencies: `npm install --include=peer` — but this modifies the target repo's node_modules, which may have side effects
- (B) Add `@opentelemetry/api` to devDependencies in addition to peerDependencies — cleaner for eval purposes; avoids test breakage
- (C) Mock the `@opentelemetry/api` module in the test environment specifically for spiny-orb's checkpoint runner — most isolated but requires more engineering

Recommended: (B) for the eval runs. Add `@opentelemetry/api` to devDependencies in the release-it fork before running, keeping peerDependencies as the distribution-facing declaration.

### SPINY-ORB-2 — arrowParens + print-width requires more than 3 attempts (P2)

**Root cause**: The agent must apply two distinct Prettier changes simultaneously: (1) remove parens from single-arg async callbacks, (2) break long lines at print-width. The Prettier diff shows both, but the agent's 3-attempt limit is too tight when both must be fixed in a single pass.

**Contributing factor**: When the span wrapper adds indentation, lines that were near the print-width limit in the original source are pushed over it. The agent did not introduce the long lines — they pre-existed and were pushed over by instrumentation indentation.

**Fix options**:
- (A) Run Prettier automatically as a post-processing step before the LINT check — eliminates arrowParens and print-width issues without relying on the agent
- (B) Increase fix-loop attempts for LINT failures specifically — cheap option, lower quality bar
- (C) Pre-compute which lines will exceed print-width after adding a span wrapper, and include this in the agent's initial context

Recommended: (A) is the most robust. Prettier as a post-pass is deterministic and requires no agent iteration.

### SPINY-ORB-3 — NDS-003 blocks return-value capture for release_id (P2)

**Root cause**: GitHub.js's `createRelease()` uses `return this.retry(...)`. The agent needs to capture the return value to set `release_it.github.release_id`. Converting the return to `const result = await this.retry(...); return result` triggers NDS-003.

**Fix**: Omit `release_it.github.release_id` from the instrumentation. The span can cover the operation without capturing the ID. Alternatively, if the return-value capture pattern should be permitted, the NDS-003 validator needs a specific exemption for `const result = await expression; return result` where the result is only used for a single `setAttribute` call.

### SPINY-ORB-4 — COV-003 / NDS-007 conflict on GitLab.js catch blocks (P2)

**Root cause**: GitLab.js has catch blocks that handle errors gracefully (log + continue, not rethrow). COV-003 requires error recording in all catch blocks. NDS-007 (expected-catch unmodified) says graceful-degradation blocks should NOT have error recording added. The validator fires COV-003 before the agent can apply NDS-007 reasoning.

**Fix**: The validator should classify catch blocks by whether they rethrow. Catch blocks that silently handle (return, continue) without rethrowing are NDS-007-exempt from COV-003. This requires the COV-003 validator to check for a rethrow in the catch body before flagging.

---

## Findings for release-it eval config

### EVAL-1 — PAT scope in GCP Secret Manager (P1)

The secret at key `github-token-release-it` has `contents:write` but not `pull_requests:write`. The vals.yaml comment is incorrect. Remediation: update the PAT in the GitHub Fine-Grained Tokens settings to add `pull_requests:write` scoped to `wiggitywhitney/release-it`, then update the secret in GCP Secret Manager. No vals.yaml changes needed.

### EVAL-2 — OTel devDependency needed in release-it fork (P1)

Add `@opentelemetry/api` to devDependencies in the release-it fork before run-3:
```bash
npm install --save-dev @opentelemetry/api
```
Commit to the fork's main branch. This allows checkpoint tests to pass without requiring peer installation.

### EVAL-3 — GitBase.js span naming inconsistency (P3)

GitBase.js uses `release-it.git.*` span names (hyphen in namespace) while all other files use `release_it.*` (underscore). This is a quality concern but not a gate failure. For run-3, if GitBase.js commits, the span names should use `release_it.git.*` for consistency.

---

## Carry-Forward Items for Run-3

| # | Item | Priority | Owner | Type |
|---|------|---------|-------|------|
| 1 | OTel module resolution at checkpoint | P1 | Whitney (fork config) | Blocker |
| 2 | PAT lacks pull_requests:write | P1 | Whitney (GCP Secret Manager) | Blocker |
| 3 | arrowParens + print-width LINT cascade (6 files) | P2 | spiny-orb (Prettier post-pass) | Quality |
| 4 | NDS-003 on GitHub.js (return-value capture) | P2 | spiny-orb (validator exemption or agent fix) | Quality |
| 5 | COV-003/NDS-007 conflict on GitLab.js | P2 | spiny-orb (validator fix) | Quality |
| 6 | GitBase.js span naming inconsistency | P3 | agent (convention clarification) | Quality |
| 7 | 18 schema extension span names not yet in registry | P3 | eval team (future PRD) | Schema |

---

## Run-3 Success Projections

**Conservative** (P1 blockers fixed; P2 items unchanged):
- OTel resolution and PAT fixed → files can commit and PR can be created
- LINT failures persist for 6 files (arrowParens + print-width)
- GitHub.js NDS-003 persists
- GitLab.js COV-003 persists
- **Expected committed**: 6-9 files (config, factory, Version, shell, util + correct skips survive; plugin files hit LINT)
- **Expected quality**: 24/25 (96%) on committed set — same failure mode as run-2, just with files surviving
- **Expected Q×F**: ~5-9 (6-9 files × 24/25)
- **Expected cost**: $5-7
- **Push/PR**: YES

**Target** (P1 fixed + arrowParens Prettier post-pass lands):
- 6 LINT failures convert to commits
- GitHub.js and GitLab.js still fail their non-LINT issues
- **Expected committed**: 12-14 files
- **Expected quality**: 23-24/25 (GitHub.js NDS-003, GitLab.js COV-003 persist)
- **Expected Q×F**: ~11-13
- **Push/PR**: YES with PR

**Stretch** (P1 + P2 all fixed):
- All 13 instrumented files commit cleanly
- Quality reaches 25/25 if NDS-003/COV-003 fixes also land
- **Expected Q×F**: ~13
