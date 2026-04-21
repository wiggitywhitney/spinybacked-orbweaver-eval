# IS Score — release-it Run-2

**Date**: 2026-04-21
**Status**: NOT EVALUABLE

---

## Why IS Scoring Is Not Evaluable for Run-2

IS scoring requires running the target application with OTel instrumentation active and capturing OTLP traces to score against the IS spec. This depends on instrumented code being present in the working tree.

**Run-2 result**: 0 files were net committed to the release-it working tree — all checkpoint rollbacks and the end-of-run rollback erased every instrumented file from `main`. Running `release-it --dry-run` from the current working tree would produce no instrumented spans, making IS scoring meaningless.

The spiny-orb branch (`spiny-orb/instrument-1776786399007`) contains the instrumented files, but setting up a full IS scoring run from a non-main branch (with SDK init file, `--import` flags, and release-it configuration) is out of scope for this run's evaluation.

---

## Expected Coverage (if IS scoring had been possible)

Based on the 5 files that committed spans before rollback, an IS scoring run would have covered:

| File | Spans | Operations |
|------|-------|-----------|
| lib/config.js | 1 | Config initialization |
| lib/plugin/factory.js | 1 | Plugin loading |
| lib/plugin/version/Version.js | 1 | Version computation |
| lib/shell.js | 1 | Shell command dispatch |
| lib/util.js | 1 | Async collection reducer |

Total: 5 spans across initialization and utility operations. The high-value plugin operations (Git.js, GitHub.js, GitLab.js, npm.js) were not committed, so the IS score would have reflected very limited coverage of the release pipeline.

---

## IS Scoring Blockers for Run-3

IS scoring will be evaluable in run-3 if:
1. The OTel module resolution issue is resolved (enabling checkpoint tests to pass and files to commit)
2. At least the core plugin files (Git.js, GitHub.js/GitLab.js, npm.js) commit spans
3. The `release-it --dry-run` path exercises the committed spans

A meaningful IS score requires the git + npm instrumentation to be present, since those operations are the primary observability value of release-it.
