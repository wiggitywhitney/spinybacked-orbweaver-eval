# Eval Artifacts Convention

Defines how evaluation run artifacts are preserved on `main` after each run.

## 1. Files to Copy

All files under `evaluation/<target>/run-N/` on the eval branch. The glob is:

```text
evaluation/<target>/run-N/**
```

No exclusions — copy everything, including logs. File completeness across runs matters more than repo size. A single run is typically 500KB–1MB including the spiny-orb output log.

## 2. How to Copy

**Modern runs (run-7 and later)** — artifacts live at `evaluation/<target>/run-N/` on the eval branch:

```bash
git checkout <eval-branch> -- evaluation/<target>/run-N/
git commit -m "eval: save run-N artifacts to main [skip ci]"
```

**Early runs (run-2 through run-6)** — artifacts live at the legacy flat path `evaluation/run-N/` on the eval branch, before the `<target>` subdirectory was introduced. Normalize to the current path during backfill:

```bash
git checkout <eval-branch> -- evaluation/run-N/
mkdir -p evaluation/<target>/run-N/
cp -r evaluation/run-N/. evaluation/<target>/run-N/
git restore --staged evaluation/run-N/  # unstage the legacy path
rm -rf evaluation/run-N/                # remove legacy checkout
git add evaluation/<target>/run-N/
git commit -m "eval: save run-N artifacts to main [skip ci]"
```

**Run-1** — predates the generalized framework; skip if `evaluation/<target>/run-1/` does not exist on the branch.

Both commands run **from `main`** — the working tree must be on `main` before running the checkout.

## 3. Commit Message Format

```text
eval: save run-N artifacts to main [skip ci]
```

Replace `N` with the run number. The `[skip ci]` tag suppresses CI on data commits.

Run-log update commits use:

```text
eval: update run-log for run-N [skip ci]
```

## 4. Run Log Location

One run-log file per target, on `main`:

```text
evaluation/<target>/run-log.md
```

For commit-story-v2: `evaluation/commit-story-v2/run-log.md`.

When a new target language is added, create its run-log at `evaluation/<new-target>/run-log.md` before or during that target's first run.

## 5. Run Log Row Format

```text
| N | YYYY-MM-DD | score/total | files_committed | Q×F | push_status | Top finding 1; Top finding 2 |
```

Column definitions:

| Column | Description |
|--------|-------------|
| N | Run number |
| YYYY-MM-DD | Date the run completed |
| score/total | Rubric quality score, e.g. `25/25` |
| files_committed | Number of files committed by the agent in that run |
| Q×F | Quality × Files: `(score/total) × files_committed`, rounded to one decimal |
| push_status | Whether the agent's PR was pushed to the target repo: `YES (#N)`, `NO`, or `PARTIAL` |
| Top finding 1; Top finding 2 | One or two key findings, separated by semicolon; keep to one line |

If an eval branch was deleted before backfill ran, mark the artifact path as unavailable:

```text
| N | YYYY-MM-DD | score/total | files | Q×F | push_status | Top findings | — (branch unavailable) |
```
