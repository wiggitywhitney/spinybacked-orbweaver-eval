### 8. managers/journal-manager.js (2 spans)

| Rule | Result |
|------|--------|
| NDS-003 | PASS — no truthy guard removed; `commit.shortHash`/`commit.timestamp` used unconditionally per JSDoc contract, no pre-existing guard logic altered |
| API-001 | PASS — `import { trace, SpanStatusCode } from '@opentelemetry/api'`, no SDK imports |
| NDS-004 | PASS — early-return duplicate-skip, regenerate-stale-placeholder path, and chronological sort/return in `discoverReflections` are byte-for-byte unchanged, only wrapped |
| NDS-006 | PASS — both instrumented function bodies preserved verbatim inside the span wrapper, no logic deleted |
| NDS-007 | PASS — the `ENOENT`-only-rethrow catch in `saveJournalEntry` (`if (err.code !== 'ENOENT') throw err;`) and the two silent `continue`-on-error catches in `discoverReflections` (unreadable file, missing directory) are left unmodified; only the outer span-level catches add `recordException`/`setStatus` |
| COV-001 | PASS — both exported async functions (`saveJournalEntry`, `discoverReflections`) are entry points, each wrapped in its own `tracer.startActiveSpan` |
| COV-003 | PASS — both outer catches call `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` before rethrow, `span.end()` in `finally` |
| COV-004 | PASS — every exported async I/O function in the file is spanned; no entry point missed |
| COV-005 | PASS — attributes present on both spans: `file_path`, `entry_date`, `vcs.ref.head.revision`, `commit.message` on `save_entry`; `time_window_start`, `time_window_end`, `entries_count` on `discover_reflections` — not attribute-empty despite "0 attributes" in the run log (that figure is `attributesCreated`, i.e., zero *new* keys minted, not zero `setAttribute` calls) |
| RST-001 | PASS — all 10 synchronous pure helpers correctly left uninstrumented |
| RST-004 | PASS — same helper set, all unexported/internal (except `formatTimestamp`, exported but still sync-utility-exempt under RST-001), correctly excluded |
| SCH-001 | PASS — new span names `span.commit_story.journal.save_entry` and `span.commit_story.journal.discover_reflections` declared in `semconv/agent-extensions.yaml` with `span_kind: internal` |
| SCH-002 | **PASS — RUN27-5 now CLEAN, third-instance-that-wasn't**: `discoverReflections` writes the reflection count to `commit_story.journal.entries_count`, a generic, already-extended agent key, not to `commit_story.journal.quotes_count` (the core-schema key, explicitly briefed "Number of developer quotes extracted for the entry"). Run-27's mismatch is fully resolved in run-28's version of this file — no reuse of `quotes_count` for reflections at all. This does **not** extend the RUN27-5 pattern to a third instance; it breaks the streak |
| SCH-003 | PASS — `commit_story.journal.entries_count` is registered `type: int` and set as raw `reflections.length`, no `String()` wrapper; `commit_story.journal.file_path` registered `type: string` and set as a string |
| CDQ-001 | PASS — `span.end()` called exactly once per span, in `finally`, for both functions |
| CDQ-002 | PASS — single `const tracer = trace.getTracer('commit-story')` at module scope, reused for both spans |
| CDQ-003 | PASS — standard `span.recordException(error)` + `span.setStatus({code: SpanStatusCode.ERROR})` in both outer catches before rethrow |
| CDQ-005 | PASS — no `console.log` anywhere in the file; the only logging is the caller-supplied `options.debug` hook, not a bypass of a project logger |
| CDQ-006 | PASS — usage is mixed (some attributes guarded with `if (span.isRecording())`, others unguarded), but both spans are COV-001 entry points, which are exempt from the isRecording-guard requirement — so neither the guarded nor unguarded calls are a violation |
| CDQ-007 | **PASS — confirmed fix applied**: `commit_story.journal.file_path` is sanitized via `entryPath.split(/[\\/]/).filter(Boolean).pop() ?? ''`, the confirmed spiny-orb commit `5a0636c` inline fallback pattern, not the raw unsanitized `entryPath` that run-27 shipped with a caveat. No other PII-shaped attribute (author/email/username) is present on either span |

**Failures**: None.

**Watch-item resolution (RUN27-5)**: This is the key finding for this file. Run-27 confirmed `discoverReflections()`'s reflection count was written into the registered `commit_story.journal.quotes_count` key (semantically "developer quote count") — a type-correct but semantically wrong reuse. Run-28's version of this exact function now writes the same value to `commit_story.journal.entries_count` — a generic, boilerplate-briefed agent-extension key that does not contradict any specific registered concept. This is a clean fix, not a different mismatch. Net effect: **RUN27-5 does not get a third confirmed instance on this file** — the case for a standing "Unrubriced Findings" rubric category should be evaluated based on the `summarize.js`/`dates_count` finding and other files, not on `journal-manager.js`, which is now resolved.

**CDQ-007 path fix confirmation**: Confirmed fixed. `entryPath.split(/[\\/]/).filter(Boolean).pop() ?? ''` matches the confirmed spiny-orb commit `5a0636c` inline sanitization pattern exactly. This is a change from run-27's behavior on this file, where the raw `entryPath` was shipped with only a caveat noting the missing `basename()` import as a latent risk.
