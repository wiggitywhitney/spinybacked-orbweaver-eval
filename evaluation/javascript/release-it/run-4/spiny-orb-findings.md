# Spiny-Orb Findings — release-it Run 4

Issues and observations from run-4 that should be communicated to the spiny-orb team.

---

## P1 — Blocking / High Impact

### [RUN4-1] LINT/NDS-003 Indentation-Width Conflict

Adding `startActiveSpan` wrapper adds 2 indentation levels. Files with long lines near Prettier's 120-char print width cannot satisfy both LINT (Prettier-compliant output) and NDS-003 (original lines preserved) simultaneously.

- LINT failures: GitBase.js, GitRelease.js, prompt.js (agent preserved originals)
- NDS-003 failures: GitHub.js, npm.js (agent proactively reformatted to avoid Prettier violation)

**Fix**: Prettier post-pass before NDS-003 validation, or compute NDS-003 baseline against Prettier-formatted original.

---

## P2 — Notable / Worth Fixing

### [RUN4-2] Live-Check Compliance Report Printed Inline — Inflates Console Log and PR Body

The live-check compliance report JSON (2173 spans × 15389 advisory findings) is printed to stdout during the run (`--verbose` log) and embedded in the PR summary file.

- **Console log**: `spiny-orb-output.log` contains a full `"Full compliance report: { ... }"` JSON dump
- **PR body**: The 399K-line, ~12MB summary file caused `spawn E2BIG` when passed to `gh pr create --body`

**Root fix**: Write the compliance report to a named file (e.g., `spiny-orb-live-check-report.json`) instead of printing inline. Reference the path in the PR body and log output.

**Short-term mitigation**: Use `gh pr create --body-file <tmpfile>` to bypass the OS argument length limit while the root fix is pending.

### [RUN4-3] COV-003 Validator Gap: `Promise.reject` Not Detected as Rethrow

shell.js `execWithArguments` uses `return Promise.reject(err)` in the catch block. COV-003 checker detects `throw` as a rethrow indicator but not `return Promise.reject()`. Shell.js passed the validator gate but failed rubric review.

**Fix**: Add `return Promise.reject(` as a recognized rethrow pattern in COV-003 checker.

### [RUN4-4] GitLab.js — Contradictory SCH-002 Validator Messages

Validator flagged `release_it.gitlab.asset_name` as both "semantic duplicate of `release_it.github.assets_count`" and "not found in registry" — logically contradictory. Cross-domain duplicate detection fires across unrelated namespaces (`gitlab.*` vs `github.*`).

**Fix**: Constrain SCH-002 duplicate detection to same namespace prefix.

---

## P3 — Minor / Track for Trend

### [RUN4-5] Live-Check Advisory Deduplication — Per-Span Count Inflates Signal

The compliance report shows 15389 advisory findings but there are 7 distinct missing attribute types (SDK resource attrs not in schema) × 2173 spans. The raw per-span count misrepresents 7 distinct issues as 15389. Deduplicate to distinct `(rule_id, attribute_key)` pairs in any human-readable output — summary should read "7 SDK resource attrs not in schema" not "15389 advisory findings."

---

## Resolved from Run 3

| # | Finding | Resolution |
|---|---------|-----------|
| RUN3-1 | Pre-scan false negative on async class methods | ✅ RESOLVED — Git.js committed 10 spans; PR #781 confirmed working |
| RUN3-2 | `gh pr create` targets upstream in fork | ⚠️ PARTIALLY RESOLVED — push to fork works; PR creation now fails E2BIG (RUN4-2) |
| RUN3-3 | HOME not forwarded to weaver subprocess | ✅ WORKING via `HOME="$HOME"` workaround; spiny-orb fix pending |
| RUN3-4 | Git.js API termination | ✅ RESOLVED — retry succeeded, 10 spans committed |
| RUN3-5 | GitLab.js COV-002 | ⚠️ STILL FAILING — attempt 1: COV-003; attempt 2: SCH-002 contradiction (RUN4-4) |
| RUN3-6 | RES-001 service.instance.id | ✅ RESOLVED — IS 100/100 in run-4 |
