# Per-File Evaluation Agent Prompt — Run-29

The prompt template used for every per-file evaluation agent in run-29. Batch 1 (sections 01–05) used it. Fill in the `<...>` fields for each file, then spawn the agent with `run_in_background: true`. The agent returns its section as text, and the coordinating session writes it to `per-file-sections/<NN>-<name>.md`. When the agent's "Rule-fit issues" contain a new item, the coordinating session appends it to the "Rule-fit issues for the handoff" list in `exemption-scope.md` in the same pass. Cross-file questions go into `reconciliation-notes.md`.

## Per-file fields

- `<NN>`, `<path>`, `<display name>`: the section number, the source path (for example `src/managers/summary-manager.js`), and the header name (for example `managers/summary-manager.js`), from the batch plan in the PRD's per-file milestone.
- `<run-summary facts>`: the file's row from `run-summary.md` "File Outcomes": result, spans, attributes, attempts, run-28 comparison, and notes.
- `<deep-dive notes>`: any bullet about this file from the PRD milestone's "From the failure deep-dives" list and from `failure-deep-dives.md`. If the file took 3 or more attempts, tell the agent to read its part of `failure-deep-dives.md` and to treat the verbose log material for it as input (D-1).
- `<specific checks>`: the file's entries from the PRD milestone's "Key watch items" list, plus these where they apply:
  - `summary-manager.js`: RUN28-1 (list every `setAttribute` with line and guarded or unguarded, per `exemption-scope.md` item 1) and RUN28-3 (list each `file_path` site with line, value expression, and whether the basename fallback is applied, per item 3).
  - `summarize.js`, `summary-detector.js`, `auto-summarize.js`: RUN28-2 (any SCH-003 mismatch in either direction).
  - `summarize.js`: SCH-002 on `commit_story.journal.daily_summaries_count` and `weekly_summaries_count`. `summary-manager.js` (section 10) uses them for summaries read as generator input, and `summarize.js`'s notes say they count summaries generated. Apply the specific-wrong-noun test across both files (`reconciliation-notes.md` item 12).
  - `context-capture-tool.js`: RUN28-5 (does what the agent notes say diverge from what its thinking planned and from what shipped?).
  - `journal-manager.js`: any "correct type, wrong registered key" instance.
  - `index.js`: score it as committed code (D-11). Record `vcs.ref.head.revision` at line 472 as an unrubriced finding (`exemption-scope.md` item 4).
- `<fix-verification line>`: include the "Fix verification" output field only for files named under a RUN28 item above, and name the item.
- Run-28 section path: `EVAL/evaluation/javascript/commit-story-v2/run-28/per-file-sections/`. Run-28's numbering differs from run-29's, so match by file name.
- Add these two notes to every agent's `<specific checks>` (carried from batch 2):
  - The "Attributes" column in `run-summary.md` and the log's attribute figure count new schema extension keys, not `setAttribute` calls (rule-fit item 12). Count the `setAttribute` calls in the instrumented source before judging COV-005.
  - COV-006 for direct `node:fs` calls is unresolved (reconciliation items 1 and 10). Score the row, then state in it which reading you used: `node:fs` calls covered by an auto-instrumentation library (PASS), or not covered (N/A). The reconciliation pass settles one reading for every file.

The correct-skips section (15) uses a different task: for each of the 18 files `run-summary.md` labels a correct skip, grep that file's pre-instrumentation analysis block in `spiny-orb-output.log` for a COV-001 or COV-004 flag the final output did not act on, and judge `reflection-tool.js` (NDS-003 ×1 on attempt 1, then 0 spans on attempt 2) against `exemption-scope.md` item 5's questionable-skip reading. Its output is one table (file, skip reason, flags found, verdict) plus a "Questionable skips" list.

## Template

```text
You are scoring one file from spiny-orb evaluation run-29 of commit-story-v2 against a rubric. Work read-only: do not create, edit, or commit any file. Return your section as text in your final message.

EVAL REPO: ~/Documents/Repositories/spinybacked-orbweaver-eval (call it EVAL). Run dir: EVAL/evaluation/javascript/commit-story-v2/run-29 (call it RUN).
TARGET REPO: ~/Documents/Repositories/commit-story-v2. Instrument branch: spiny-orb/instrument-1791918832887 (HEAD 860fcb1).
SPINY-ORB SOURCE: ~/Documents/Repositories/spinybacked-orbweaver-main (at 475eb3d).

FILE: <path> — section number <NN>. Run summary: <run-summary facts>. <deep-dive notes>

PROCESS — follow these steps in order:
1. Read RUN/exemption-scope.md completely. It fixes the row list, the rule readings, and the tests you must apply. It overrides your own interpretation wherever they differ.
2. Read the rule definitions: SPINY-ORB SOURCE/docs/research/evaluation-rubric.md (Part 2) and docs/rules-reference.md. Where they differ, exemption-scope.md says which governs.
3. Read the original source (`git -C ~/Documents/Repositories/commit-story-v2 show main:<path>`) and the instrumented source (`show spiny-orb/instrument-1791918832887:<path>`). Diff them, with `git diff -w` as well to see past whitespace reflow. Read the companion `.instrumentation.md` on the instrument branch if it exists (Validation Journey).
4. Read this file's blocks in RUN/spiny-orb-output.log: grep for the file name, then read its pre-instrumentation analysis, every "Agent thinking" attempt, and "Agent notes". Treat agent notes as claims to verify against the source, not as evidence.
5. Read the schema on the instrument branch, `semconv/attributes.yaml` and `semconv/agent-extensions.yaml`, to check each attribute key and its declared type.
6. For each rule in exemption-scope.md's row list, check the instrumented source against the rule's canonical definition, then write the verdict with concrete evidence (function name, instrumented-file line number, the expression). Before writing a row, confirm the evidence concerns that rule ID's own concern, not a neighboring rule's.
7. Specific checks for this file: <specific checks>. Also: CDQ-006 per exemption-scope.md item 1's test, listing every expensive setAttribute and whether it is guarded; CDQ-007 per call site per item 3; SCH-003 judged from source, marking anything needing runtime confirmation with "(confirm against OTLP export)".
8. Compare with run-28's section for context only (<run-28 section path>). Do not copy its verdicts; run-28's rows contain rule-ID labeling errors.

OUTPUT FORMAT (markdown, return as your final message, nothing else before or after it):

### <NN without leading zero>. <display name> (N spans, N attempts)

One short paragraph: what was instrumented and anything notable.

| Rule | Result |
|------|--------|
(one row per rule from exemption-scope.md's row list, in that order; "PASS — evidence", "**FAIL** — evidence", or "N/A — reason")

**Failures**: list, or "None".
**Unrubriced findings**: list, or "None".
**Other implemented-rule observations**: list, or "None".
**Rule-fit issues**: any case where a rule did not fit what you found, or "None".
<fix-verification line, e.g. **Fix verification**: RUN28-1 and RUN28-3 results for this file, with call sites.>
**Run-28 comparison**: one or two sentences.

Use complete sentences in prose. Do not use em dashes in prose sentences (the "PASS — evidence" row format is fine). Redact any person name or email you quote as <redacted-person-name> / <redacted-email>.
```
