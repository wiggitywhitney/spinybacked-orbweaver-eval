#!/usr/bin/env bash
# ABOUTME: Builds a live per-file progress chart for the current run, comparing totals against the last three completed runs.
# Usage: build-chart.sh <run-dir-with-spiny-orb-output.log> <out-file>

set -euo pipefail
RUN_DIR="$1"
OUT="$2"
PARSER="$(dirname "$0")/parse-log.sh"
BASE_DIR="$(dirname "$RUN_DIR")"

summarize() {
  # reads TSV rows (file, status, spans, attrs, attempts) on stdin, prints "success fail partial skip inprog spans attrs attempts_total files"
  awk -F'\t' '
  NF {
    files++
    if ($2=="SUCCESS") success++
    else if ($2=="FAIL") fail++
    else if ($2=="PARTIAL") partial++
    else if ($2=="CORRECT_SKIP") skip++
    else if ($2=="IN_PROGRESS") inprog++
    if ($3 ~ /^[0-9]+$/) spans += $3
    if ($4 ~ /^[0-9]+$/) attrs += $4
    if ($5 ~ /^[0-9]+$/) attempts += $5
  }
  END {
    printf "%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\n", success+0, fail+0, partial+0, skip+0, inprog+0, spans+0, attrs+0, attempts+0, files+0
  }'
}

CURRENT_LOG="$RUN_DIR/spiny-orb-output.log"
CURRENT_ROWS="$("$PARSER" "$CURRENT_LOG")"
CURRENT_SUMMARY="$(echo "$CURRENT_ROWS" | summarize)"

{
  echo "// ABOUTME: Live per-file progress chart for the in-flight run, auto-generated — do not hand-edit."
  echo "# Run-26 Live Progress"
  echo
  echo "_Last updated: $(date -u '+%Y-%m-%dT%H:%M:%SZ') (parsed from spiny-orb-output.log)_"
  echo
  echo "## Per-File Detail (this run)"
  echo
  echo "| File | Status | Spans | Attributes | Attempts |"
  echo "|---|---|---|---|---|"
  printf '%s\n' "$CURRENT_ROWS" | awk -F'\t' 'NF {printf "| %s | %s | %s | %s | %s |\n", $1, $2, $3, $4, $5}'
  echo
  echo "## Totals — run-26 vs. last 3 completed runs"
  echo
  echo "| Run | Success | Fail | Partial | Correct Skip | In Progress | Total Spans | Total Attributes | Total Attempts | Files Seen |"
  echo "|---|---|---|---|---|---|---|---|---|---|"
  echo "$CURRENT_SUMMARY" | awk -F'\t' '{printf "| run-26 (live) | %s | %s | %s | %s | %s | %s | %s | %s | %s |\n", $1,$2,$3,$4,$5,$6,$7,$8,$9}'
  for r in 25 24 23; do
    LOG="$BASE_DIR/run-$r/spiny-orb-output.log"
    if [ -f "$LOG" ]; then
      S="$("$PARSER" "$LOG" | summarize)"
      echo "$S" | awk -F'\t' -v r="$r" '{printf "| run-%s | %s | %s | %s | %s | %s | %s | %s | %s | %s |\n", r, $1,$2,$3,$4,$5,$6,$7,$8,$9}'
    fi
  done
} > "$OUT"

cat "$OUT"
