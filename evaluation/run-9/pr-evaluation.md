# PR Artifact Evaluation — Run-9

**PR created**: NO (push failed, 7th consecutive)
**Local PR summary**: `spiny-orb-pr-summary.md` on commit-story-v2

## PR Summary Quality

### Length

- **197 lines** — under the 200-line target (run-8 was 230 lines)
- Improvement from run-8

### Per-File Table Accuracy

| Check | Result | Evidence |
|-------|--------|----------|
| File count matches | PASS | 12 committed + 1 partial + 16 skips = 29 |
| Span counts match branch state | PASS | 26 total spans verified against diffs |
| Cost per file listed | PASS | Individual costs shown, total $3.97 |
| Schema extensions listed | PASS | All extensions listed per file |
| Correct skips listed | PASS | All 16 correct skips listed |

### Schema Changes Section

| Check | Result | Evidence |
|-------|--------|----------|
| Attributes listed | PASS | 10 added attributes listed |
| Span extensions listed | **FAIL** | Only attributes shown — 26 span extensions are MISSING from the schema changes section |

The schema changes section lists only attributes but omits all span extensions. This is a significant gap — the 26 span names are the primary schema contribution.

### Rule Code Labels

| Check | Result | Evidence |
|-------|--------|----------|
| Rule codes in agent notes | PASS | RST-001, RST-004, COV-005, SCH-003, etc. all labeled |
| Rule codes in advisories | PASS | SCH-004, COV-004, CDQ-006, NDS-005, CDQ-008 all labeled |

### Advisory Contradiction Rate

12 advisory findings (excluding CDQ-008 confirmatory message).

| Advisory | Valid? | Classification |
|----------|--------|---------------|
| SCH-004 summarize.js: `generated_count` → `gen_ai.usage.output_tokens` | **NO** | Semantic mismatch — count of generated journal entries ≠ LLM output tokens |
| COV-004 journal-graph.js: summaryNode (×3 nodes) | Borderline | Nodes ARE async, but LangGraph nodes covered by auto-instrumentation |
| CDQ-006 journal-graph.js: `toISOString().split(...)` | Borderline | Not in trivial exemption list, but trivially cheap |
| NDS-005 index.js: "original try/catch missing" | **NO** | False positive — auto-summarize try/catch preserved at line 254, reindented inside span callback |
| SCH-004 index.js: `cli.subcommand` → `context.source` | **NO** | Semantic mismatch — subcommand discriminator ≠ context source |
| CDQ-006 journal-manager.js: `toISOString().slice(...)` | **NO** | `.toISOString()` is in CDQ-006 trivial exemption list |
| COV-004 context-capture-tool.js: `saveContext` | **NO** | Function is async callback inside sync registration — file correctly skipped |
| COV-004 context-capture-tool.js: `registerContextCaptureTool` | **NO** | Sync registration function — file correctly skipped |
| COV-004 reflection-tool.js: `saveReflection` | **NO** | Same as above |
| COV-004 reflection-tool.js: `registerReflectionTool` | **NO** | Same as above |

**Contradiction summary**: 8 definite contradictions + 4 borderline = **8/12 (67%)** definite, **12/12 (100%)** if borderline included.

**Target was <30%.** Result: 67% — improved from run-8's ~91% but still well above target. The CDQ-006 trivial exemptions (PR #271) fixed the `.toISOString()` case but the advisory system still generates bad SCH-004 semantic matches and flags sync files for COV-004. The MCP tool files (4 advisories) are the largest contributor — the COV-004 check doesn't understand the sync-registration-of-async-callback pattern.

### Cost

| Metric | Run-9 | Run-8 | Delta |
|--------|-------|-------|-------|
| Total cost | $3.97 | $4.00 | -$0.03 |
| Cost ceiling | $67.86 | — | — |
| Ceiling usage | 5.9% | — | — |
| journal-graph.js cost | $1.67 | $1.45 | +$0.22 |
| journal-graph.js % of total | 42% | 36% | +6pp |
| Model | claude-sonnet-4-6 | — | — |

### Recommended Companion Packages

Correctly identifies `@traceloop/instrumentation-langchain` and `@traceloop/instrumentation-mcp` as SDK-level concerns for deployers, not dependencies for the library. This aligns with the OTel packaging rules.

## Summary

| Metric | Target | Result | Status |
|--------|--------|--------|--------|
| PR summary length | <200 lines | 197 | PASS |
| Span counts match | Accurate | 26/26 match | PASS |
| Schema changes complete | Both attrs + spans | Attrs only (spans missing) | FAIL |
| Rule code labels | Present | Yes, in notes and advisories | PASS |
| Advisory contradiction rate | <30% | 67% | FAIL |
| Cost | ~$4.00 | $3.97 | PASS |
