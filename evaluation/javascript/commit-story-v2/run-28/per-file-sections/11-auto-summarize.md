### 11. managers/auto-summarize.js (3 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS |
| API-001 | PASS |
| NDS-004 | PASS |
| NDS-006 | PASS |
| NDS-007 | PASS |
| COV-001 | PASS |
| COV-003 | PASS |
| COV-004 | PASS |
| COV-005 | PASS |
| RST-001 | PASS |
| RST-004 | PASS |
| SCH-001 | PASS |
| SCH-002 | PASS |
| SCH-003 | **FAIL** |
| CDQ-001 | PASS |
| CDQ-002 | PASS |
| CDQ-003 | PASS |
| CDQ-005 | PASS |
| CDQ-006 | PASS |
| CDQ-007 | PASS |

**Failures**: SCH-003 (Attribute Value Types Match Schema) — six `setAttribute` calls write a declared `int` key via `String(...)`, wrapping the value as a string against its own registry type:
- Line 78: `span.setAttribute('commit_story.summary.days_generated_count', String(result.generated.length));`
- Line 79: `span.setAttribute('commit_story.summary.days_failed_count', String(result.failed.length));`
- Line 89: `span.setAttribute('commit_story.summary.days_generated_count', String(result.generated.length));` (duplicate call on the normal, non-early-return path)
- Line 90: `span.setAttribute('commit_story.summary.days_failed_count', String(result.failed.length));`
- Line 158: `span.setAttribute('commit_story.summary.weeks_generated_count', String(result.generated.length));`
- Line 159: `span.setAttribute('commit_story.summary.weeks_failed_count', String(result.failed.length));`

`semconv/agent-extensions.yaml` declares all four of these as `type: int`, and this file's own `.instrumentation.md` explicitly calls them "new extension attributes (int)". The `String()` wrapper is the identical bug independently confirmed in `summarize.js` and `summary-detector.js` in this same run; this file adds 6 more occurrences (4 unique attribute names, 2 set twice via early-return and normal-return paths) — **14 total violations across three files in run-28** (4 in `summarize.js`, 4 in `summary-detector.js`, 6 here). No validator caught any of them; the run log shows "0 errors" for this file's single attempt.

By contrast, the two `months_*` counters (lines 222-223) are int-typed in the registry and correctly set as raw numbers with no `String()` wrapper — these are reused pre-registered keys. The three `unsummarized_*_count` attributes are likewise set as raw `.length` values and are correct. The bug is confined to the four newly-declared `days_*`/`weeks_*` extension attributes, not the pre-existing `months_*`/`unsummarized_*` keys — consistent with the pattern already established in `summarize.js` and `summary-detector.js`.

**Notes**: All three exported entry points (`triggerAutoSummaries`, `triggerAutoWeeklySummaries`, `triggerAutoMonthlySummaries`) are wrapped in `tracer.startActiveSpan` with try/catch/finally, `recordException`/`setStatus(ERROR)` on the outer catch, and `span.end()` in `finally`. `getErrorMessage` is correctly skipped as a pure, unexported, synchronous helper. The inner per-item catch blocks inside each for-loop (push to `result.failed`/`result.errors`, no rethrow) are correctly left untouched as expected graceful-degradation control flow. Three new span names were correctly declared as schema extensions after the semantically closer existing span IDs were confirmed already claimed by earlier files in this run. Unlike run-27's version of this file, this run-28 instrumentation does **not** set any `commit_story.context.repo_path` (or equivalent raw-path) attribute anywhere — CDQ-007 PASSes cleanly here, in contrast to run-27's canonical failure on this same file.

**Cross-file pattern confirmation**: Checking every one of this file's 11 `setAttribute` call sites individually (not sampling) found the bug at 6 of them (all 4 newly-declared `days_*`/`weeks_*` keys, one doubled), absent at the other 5 (pre-registered `months_*`/`unsummarized_*` keys). The pattern specifically affects **newly agent-declared** int extension attributes, not pre-existing registered int keys, across all three affected files this run — a systemic, run-wide validator gap (no check catches `setAttribute(key, String(...))` against a numeric-typed key), now spanning 3 of ~32 files with 14 total occurrences. This is the single most significant unrubriced-pattern finding of run-28 and should be the primary SCH-003 handoff item.
