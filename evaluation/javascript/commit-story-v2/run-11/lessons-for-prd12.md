# Lessons for PRD #12

Observations collected during run-11 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations (2026-03-30)

1. **Push auth finally resolved**: Fine-grained PAT with `push: true` permissions works. The 8-run failure streak was caused by token type/scope issues, not the URL swap mechanism. Dry-run push succeeded pre-run.

2. **All 4 run-10 findings addressed**: Every finding from the actionable fix output was triaged into a spiny-orb issue, fixed in a PR, and merged to main. The handoff pipeline (eval → issues → PRs → main) is functioning smoothly.

3. **Boolean type detection uses name patterns, not value inspection**: The fix at schema-extensions.ts:178-186 uses regex on attribute name segments (`is_*`, `has_*`, `should_*`, `force`). This is a heuristic — it won't catch boolean attributes with non-standard names. Watch for false negatives.

4. **CDQ-007 dual fix (prompt + validator)**: The prompt guidance teaches the pattern; the validator catches violations. This defense-in-depth approach is the strongest fix pattern seen across runs. Other quality rules should adopt this.

5. **Weaver retry has no tests**: The retry logic in dispatch.ts is not directly tested — only mocked through dependency injection. If the retry mechanism regresses, it won't be caught until a production failure.

6. **30 files unchanged**: Same file inventory as run-10. No new files to instrument.

---

## Run-Level Observations (2026-03-30)

7. **Zero failures for the first time**: All 30 files processed successfully (13 committed, 17 correct skips, 0 failed, 0 partial). This is the cleanest run across all 11 evaluations.

8. **6 files needed 2 attempts, none needed 3+**: journal-graph.js improved from 3→2 attempts. The validator catches-and-retries pattern is effective but adds cost. The 6 retry files contributed ~$1.50 in extra tokens.

9. **CDQ-007/NDS-003 conflict is the dominant remaining issue**: The agent can't safely guard optional attributes without triggering NDS-003. Three resolution patterns observed: (a) drop the attribute, (b) ternary expression, (c) do nothing and fail CDQ-007. The agent chose (a) and (b) — correct per rules but loses attribute completeness.

10. **summary-manager.js has the most spans (9)**: Recovered from run-10's Weaver CLI failure. The file is entirely async I/O pipeline functions — 9/13 functions instrumented, 4 sync formatters skipped. The 69% instrumentation rate is justified.

11. **`is_merge` attribute disappeared**: Run-10 had `commit_story.commit.is_merge` in git-collector.js and index.js (triggering SCH-003). Run-11 didn't set it at all. LLM variation means boolean type detection for `is_merge` is untested this run.

## Evaluation Process Observations (2026-03-30)

12. **Per-file evaluation parallelized effectively**: 4 agents evaluated 13 files concurrently. No disagreements between agents on rule verdicts.

13. **CDQ-001 double-close requires judgment**: The rubric says "spans closed in all code paths" — it checks for closure, not against double-closure. The OTel spec says double-close is a no-op. Marking CDQ-001 as PASS is correct per rubric, but the pattern is worth noting for code cleanliness.

14. **Advisory findings are noisy but not harmful**: 45% contradiction rate means nearly half the advisories are wrong, but since advisories are informational (not blocking), this doesn't affect quality scores. The SCH-004 judge's semantic equivalence hallucinations are the primary contributor.

15. **The evaluation pipeline is mature**: Pre-run verification → instrument → deep-dives → per-file → scoring → comparison → actionable output → draft next PRD. The process is stable and repeatable. The main remaining variables are LLM code generation quality and cost.
