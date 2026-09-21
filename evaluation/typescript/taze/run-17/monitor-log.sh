#!/usr/bin/env bash
# ABOUTME: Parses spiny-orb-output.log mid-run to summarize progress for periodic monitoring updates.
# ABOUTME: Not part of the eval methodology - a throwaway monitoring helper for run-17, safe to delete after the run.

set -euo pipefail

LOG="${1:-evaluation/typescript/taze/run-17/spiny-orb-output.log}"

total_files=$(grep -m1 "Cost ceiling:" "$LOG" | grep -oE '^Cost ceiling: [0-9]+' | grep -oE '[0-9]+' || echo "?")
processed=$(grep -c "^Processing file " "$LOG" || true)
success=$(grep -c "✅ SUCCESS" "$LOG" || true)
failed=$(grep -c "❌ FAILED" "$LOG" || true)

# skip files: SUCCESS with 0 spans, 0 attributes
skips=$(grep -c "✅ SUCCESS — 0 spans, 0 attributes" "$LOG" || true)
non_skip_success=$((success - skips))

# attempts: count each "Attempt N" block header directly (skips have none - no LLM call made)
total_attempts=$(grep -c "^  Attempt [0-9]" "$LOG" || true)

# attributes: sum "N attribute" / "N attributes" from SUCCESS/FAILED lines
total_attrs=$(grep -oE '[0-9]+ attributes?' "$LOG" | grep -oE '[0-9]+' | awk '{s+=$1} END {print s+0}')

# authoritative final tally line, if the run has finished: "Run complete: X committed, Y failed, Z partial, W correct skips, V skipped"
final_line=$(grep -m1 "^Run complete:" "$LOG" || true)

if [ -n "$final_line" ]; then
  echo "RUN COMPLETE"
  echo "$final_line"
  echo "Total attempts across all files: ${total_attempts}"
  echo "Total attributes added: ${total_attrs}"
else
  echo "Progress: ${processed}/${total_files} files started"
  echo "Success so far: ${success} (${non_skip_success} instrumented, ${skips} correct skips)"
  echo "Failed so far: ${failed}"
  echo "Total attempts across completed files: ${total_attempts}"
  echo "Total attributes added so far: ${total_attrs}"
  if [ "$processed" -gt 0 ] && [ "$processed" -lt "$total_files" ]; then
    current_file=$(grep "^Processing file " "$LOG" | tail -1 | sed 's/^Processing file [0-9]* of [0-9]*: //')
    echo "Currently on: ${current_file}"
  fi
fi

echo ""
echo "Per-file (instrumented files only, skips excluded):"
awk '
  /^Processing file / {
    if (file != "" && (spans+0 > 0 || attrs+0 > 0 || status == "FAILED")) {
      printf "%-45s %-8s %-8s %-10s %s\n", file, status, spans, attrs, (attempts == "" ? "1" : attempts)
    }
    file = $0; sub(/^Processing file [0-9]+ of [0-9]+: /, "", file)
    spans = ""; attrs = ""; attempts = ""; status = ""
  }
  /✅ SUCCESS —/ {
    status = "SUCCESS"
    line = $0
    sub(/.*SUCCESS — /, "", line)
    n = split(line, parts, ", ")
    spans = parts[1]; sub(/ spans?$/, "", spans)
    attrs = parts[2]; sub(/ attributes?$/, "", attrs)
    if (n >= 3) { attempts = parts[3]; sub(/ attempts?$/, "", attempts) }
  }
  /❌ FAILED —/ {
    status = "FAILED"
    line = $0
    if (match(line, /, [0-9]+ attempts?$/)) {
      seg = substr(line, RSTART, RLENGTH)
      gsub(/[^0-9]/, "", seg)
      attempts = seg
    }
    spans = "-"; attrs = "-"
  }
  END {
    if (file != "" && (spans+0 > 0 || attrs+0 > 0 || status == "FAILED")) {
      printf "%-45s %-8s %-8s %-10s %s\n", file, status, spans, attrs, (attempts == "" ? "1" : attempts)
    }
  }
' "$LOG"
