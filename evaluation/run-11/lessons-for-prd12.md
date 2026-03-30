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

## Run-Level Observations

_(To be filled during and after the evaluation run)_

## Evaluation Process Observations

_(To be filled during structured evaluation)_
