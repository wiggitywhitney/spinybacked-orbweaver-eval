### 14. index.js — FAILED (2 attempts)

**Failure**: NDS-003 new failure — single-line import expansion

index.js committed cleanly in runs 17–20. In run-21 the agent expanded three single-line import statements into multi-line blocks in attempt 1, adding ~14 new lines and shifting every subsequent original line — triggering 152 NDS-003 violations. Attempt 2 tried to reconstruct the original structure by backward-inferring from the validator's error output, but failed to reproduce the exact formatting; a NDS-005 violation also appeared in the last attempt (try/catch restructuring). Root cause: context pollution from PRD #902 schema accumulation. By file 30 of 30 with ~60 schema extensions accumulated, the agent reformatted the wide single-line imports in a style consistent with code it was generating. Runs 17–20 did not exhibit this because the file was processed with less accumulated schema context.

The agent's attempt 1 thinking correctly planned `commit_story.cli.main` span with `commit_story.cli.subcommand` attribute (the RUN20-3 COV-005 recovery). The import expansion failure prevented this correct intent from committing.

| Rule | Result |
|------|--------|
| NDS-003 | **FAIL** — 152 violations in attempt 1 (single-line imports expanded to multi-line); attempt 2 failed to reconstruct exact formatting; NDS-005 violation in last attempt |
| NDS-005 | **FAIL** (last attempt) — try/catch restructuring introduced |
| API-001 | N/A — file did not commit |
| NDS-006 | N/A |
| NDS-004 | N/A |
| COV-001 | WOULD PASS — agent correctly planned main() entry-point span in both attempts |
| COV-003 | N/A |
| COV-004 | WOULD PASS — main() is the only async entry point; other run* functions delegate to separate files |
| COV-005 | WOULD PASS — agent declared commit_story.cli.subcommand attribute in both attempts; intent confirmed in thinking blocks |
| COV-006 | N/A |
| RST-001 | N/A |
| RST-004 | N/A |
| SCH-001 | WOULD PASS — commit_story.cli.main declared as new span extension |
| SCH-002 | N/A — schema extensions declared but file did not commit |
| SCH-003 | N/A |
| CDQ-001 | N/A |
| CDQ-002 | N/A |
| CDQ-003 | N/A |
| CDQ-005 | N/A |
| CDQ-007 | N/A |

**Failures**: NDS-003 (152 violations, import expansion) and NDS-005 (exception handling restructured in attempt 2). All other rules not evaluable — file did not commit. RUN20-3 recovery (commit_story.cli.subcommand) unverifiable; agent intent confirmed but instrumented output never reached validator success.
