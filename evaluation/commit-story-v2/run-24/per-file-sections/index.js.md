### index.js (1 span, 1 attempt)

> **CDQ-001 regression and COV-005 regression from run-23.** Run-23 had explicit `span.end()` before each `process.exit()` call (fixing the run-12 CDQ-001 failure) and captured `commit_story.journal.file_path` (a COV-005 input attribute). Run-24 drops both.

**Spans**: `commit_story.cli.main`

**New attribute declarations**: `commit_story.git.subcommand` (string)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | No `isRecording()` guards around `setAttribute`; attributes set unconditionally where present |
| API-001 | PASS | Imports `trace` and `SpanStatusCode` from `@opentelemetry/api` only; no SDK imports |
| NDS-006 | PASS | Main catch block calls `span.recordException(error)` and `span.setStatus({ code: SpanStatusCode.ERROR })` |
| NDS-004 | PASS | Both `trace` and `SpanStatusCode` imported and used |
| NDS-007 | N/A | No graceful-degradation catch blocks in original source |
| COV-001 | PASS | `main()` is the sole exported async entry point; span `commit_story.cli.main` wraps its body |
| COV-003 | PASS | Main catch records exception and sets ERROR status |
| COV-004 | PASS | `main()` is the only exported async function; synchronous helpers correctly excluded per RST-001 |
| COV-005 | **FAIL** | Span sets `vcs.ref.head.revision` (commit SHA) and conditionally `commit_story.git.subcommand`. The `commit_story.journal.file_path` attribute present in run-23 (the path of the generated journal entry — a key output of the CLI) is absent in run-24. The subcommand attribute is a meaningful addition, but the path output is a more valuable result attribute that should be captured on the journal-entry path. |
| RST-001 | PASS | No spans on synchronous helpers |
| RST-004 | PASS | Only the exported async `main()` is instrumented |
| SCH-001 | PASS | `commit_story.cli.main` registered in `semconv/agent-extensions.yaml` |
| SCH-002 | PASS | `commit_story.git.subcommand` registered in `agent-extensions.yaml`; `vcs.ref.head.revision` is a pre-registered OTel semantic convention attribute — no new registry entry needed |
| SCH-003 | PASS | `vcs.ref.head.revision` set as a string SHA (correct type); `commit_story.git.subcommand` declared `type: string`, set as string CLI argument — type match correct |
| CDQ-001 | **FAIL** | `process.exit(1)` and `process.exit(0)` calls in the `main()` body bypass the `finally { span.end() }` block. No explicit `span.end()` before any individual `process.exit()` call. Run-12 fixed this by adding `span.end()` before each exit — that fix was present in run-23 and is absent in run-24. On the success path (the captured run), `main()` returns normally and `span.end()` fires in `finally`. On early-exit paths (argument errors, unsupported subcommands), `process.exit()` fires before `finally` can execute, leaving spans unended. |
| CDQ-002 | PASS | No unnecessary nested spans |
| CDQ-003 | PASS | No PII; attributes are a commit SHA and a CLI subcommand string |
| CDQ-005 | PASS | No empty catch blocks |
| CDQ-007 | PASS | `vcs.ref.head.revision` set from `commitData.hash` (always a string from git rev-parse); `commit_story.git.subcommand` set from CLI argument with conditional check before setAttribute |

**Failures**:

1. **CDQ-001** — `process.exit()` bypasses `finally { span.end() }`. In `main()`:
   ```js
   if (!commitHash) {
     console.error('No commit hash provided. Exiting.');
     process.exit(1);  // span.end() never called — run-12 fix regressed
   }
   ```
   And:
   ```js
   default:
     console.error(`Unsupported subcommand: ${subcommand}`);
     process.exit(1);  // same pattern — span.end() never called
   ```
   The `finally { span.end() }` block does NOT execute when `process.exit()` is called synchronously inside the span callback. Run-12 diagnosis documented this; run-23 fixed it; run-24 regressed. Fix: add `span.end()` immediately before each `process.exit()` call.

2. **COV-005** — `commit_story.journal.file_path` (the path of the generated journal entry, available as the return value of `saveJournalEntry`) was captured in run-23 and is absent in run-24. The span carries `vcs.ref.head.revision` as an input attribute and `commit_story.git.subcommand` conditionally — both good, but the primary output of a successful journal-generate run (the file that was created) is not captured. Fix: retrieve the return value from `runJournalGeneration()` and call `span.setAttribute('commit_story.journal.file_path', result.filePath)` on the success path.

**Trace supplement**: `commit_story.cli.main` span confirmed in Datadog (2026-06-18T20:25:31Z). Span completed successfully (the captured run was a `journal` subcommand that ran to completion). `vcs.ref.head.revision` and `commit_story.git.subcommand: 'journal'` present. `commit_story.journal.file_path` absent — confirms the regression. Span status Unset (successful run). CDQ-001 is not observable from this trace because the success path does not call `process.exit()` — it exits `main()` normally. The CDQ-001 failure only manifests on early-exit paths not exercised in the captured run.
