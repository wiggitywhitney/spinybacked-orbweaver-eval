# Exemption-Scope Pre-Commitment — taze Run-17

Decided before spawning the first per-file-evaluation batch, per the PRD #147 "Per-file evaluation" milestone's exemption-scope pre-commitment requirement. Every per-file subagent must read this file and apply these interpretations consistently — a decision made here and not propagated to agents doesn't count.

## SCH-003: count attributes cast to string, with the schema retyped to match

**Ambiguity**: SCH-003's literal mechanism checks for a type mismatch between the code's cast and the schema's declared type. Three files in this run share a "count cast with `String()`" pattern, but differ in whether the schema still declares an `int`:

- `bunWorkspaces.ts` — `taze.config.sources_found` set as a raw int, no cast. Not ambiguous — clean pass.
- `yarnWorkspaces.ts` — `taze.io.catalogs_count` cast with `String(catalogs.length)`, schema declares `type: int`. Not ambiguous — literal mismatch, clear violation.
- `checkGlobal.ts` and `pnpmWorkspaces.ts` — both cast `taze.check.packages_loaded` with `String(deps.length)` / `String(catalogs.length)`, but the schema itself declares `taze.check.packages_loaded` as `type: string`. Code and schema agree — no literal type mismatch.

**Decision**: Flag the third case as an SCH-003 violation (semantic reading), not a pass.

**Rationale**: A count derived from `.length` is semantically an int regardless of how the schema declares it. Scoring the third case as a pass would let "retype the schema to match the cast" become a valid way to dodge the finding — which defeats the purpose of re-verifying SCH-003 this run. The underlying carry-forward problem (a count stored as a string) is unchanged from run-16; it's only hidden by moving the mismatch into the schema instead of fixing the cast.

**Test for per-file agents to apply**: For any attribute set via `String(<expr>.length)`, `String(<expr>.count)`, or an equivalent count/length-derived expression, treat it as an SCH-003 violation regardless of what the schema declares for that attribute — including when the schema was defined or amended to declare `type: string` for that same attribute. Do not treat schema/code agreement alone as sufficient to pass SCH-003 when the underlying JS value is a count.

## CDQ-006: trivial post-await setAttribute calls (no live ambiguity found, documented for completeness)

Checked whether "positioned after an `await`" (as TAZE-RUN3-2 originally described the bunWorkspaces.ts violation) is itself sufficient to require an `isRecording()` guard, independent of the attribute expression's complexity. The rubric's literal CDQ-006 mechanism and exemption text scope the guard requirement to expression complexity (function calls, method chains, serialization), not temporal position relative to an `await`. In the current `bunWorkspaces.ts`, the only unguarded post-await calls are trivial property access (`catalogs.length`, a file path string) — exempt under the rubric's literal exemption text — and the one method-chain computation (`Object.keys(versions).length`) is already guarded. No case in this run's committed files requires resolving temporal-position ambiguity, so no override decision was needed here. If a per-file agent encounters a borderline case (e.g., a trivial-looking expression whose cost is non-obvious), default to the rubric's literal exemption text: only function calls/method chains/serialization require the guard.
