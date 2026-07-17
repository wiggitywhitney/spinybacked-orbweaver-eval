#!/usr/bin/env bash
# ABOUTME: Parses a spiny-orb-output.log into per-file TSV rows (file, status, spans, attributes, attempts).
# Usage: parse-log.sh <log-file>

set -euo pipefail
LOG="$1"

awk '
function extract_num(str, pat,   pos, len, s) {
  pos = match(str, pat)
  if (pos == 0) return ""
  s = substr(str, pos, RLENGTH)
  gsub(/[^0-9]/, "", s)
  return s
}
{
  # Processing-file lines may be prefixed on the same line (e.g. "Proceed? [y/N] Processing file 1 of 32: ...")
  if (match($0, /Processing file [0-9]+ of [0-9]+: /)) {
    if (file != "") print file "\t" status "\t" spans "\t" attrs "\t" attempts
    file = substr($0, RSTART + RLENGTH)
    status = "IN_PROGRESS"
    spans = "?"
    attrs = "?"
    attempts = "1"
    saw_prescan_skip = 0
    next
  }
}
/✅ SUCCESS/ {
  status = "SUCCESS"
  n = extract_num($0, "[0-9]+ span")
  if (n != "") spans = n
  n = extract_num($0, "[0-9]+ attribute")
  if (n != "") attrs = n
  n = extract_num($0, "[0-9]+ attempts?")
  if (n != "") attempts = n
  next
}
/❌ FAIL/ || /FAILED/ {
  status = "FAIL"
  next
}
/⚠️/ && /PARTIAL/ {
  status = "PARTIAL"
  next
}
/no instrumentable functions/ || /correctly skipped/ || /Pre-scan: no/ {
  saw_prescan_skip = 1
}
{
  if (status == "SUCCESS" && spans == "0" && saw_prescan_skip == 1) status = "CORRECT_SKIP"
}
END {
  if (file != "") print file "\t" status "\t" spans "\t" attrs "\t" attempts
}
' "$LOG"
