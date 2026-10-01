// ABOUTME: Filters the shared eval-traces.json down to one run's spans and redacts machine identity.
// ABOUTME: Keeps OTLP envelopes intact, then verifies the IS score is unchanged by redaction.

import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreIS } from './score-is.js';

const REDACTED = { stringValue: 'REDACTED' };

// Resource attributes that identify the machine or user that ran the target.
const REDACTED_RESOURCE_KEYS = new Set([
  'process.owner',
  'host.name',
  'host.id',
  'process.command_args',
  'process.executable.path',
  'process.command',
]);

// String values that start with a local filesystem location. URL paths such as /api/users are not matched.
const LOCAL_PATH_PATTERN = /^\/(Users|home|private|var|tmp|opt|root|etc|usr)\/|^[A-Za-z]:\\/;

function serviceName(resourceSpansEntry) {
  const attrs = resourceSpansEntry.resource?.attributes ?? [];
  return attrs.find((a) => a.key === 'service.name')?.value?.stringValue;
}

function parseLines(lines) {
  return lines.filter((l) => l.trim()).map((l) => JSON.parse(l));
}

export function countSpans(lines) {
  return parseLines(lines).reduce(
    (total, obj) =>
      total +
      (obj.resourceSpans ?? []).reduce(
        (sum, rs) => sum + (rs.scopeSpans ?? []).reduce((n, ss) => n + (ss.spans ?? []).length, 0),
        0,
      ),
    0,
  );
}

// Keeps spans from `service` whose start time falls in [startNs, endNs]. Filtering happens inside each
// OTLP record, so every kept span stays wrapped in its resourceSpans and scopeSpans entries; entries
// and records left empty are dropped.
export function filterTraces(lines, { service, startNs, endNs } = {}) {
  if (!service) throw new Error('filterTraces needs a service name');
  if (startNs === undefined) throw new Error('filterTraces needs startNs');
  if (endNs === undefined) throw new Error('filterTraces needs endNs');
  const start = BigInt(startNs);
  const end = BigInt(endNs);
  if (start > end) throw new Error(`start (${start}) is after end (${end})`);

  const kept = [];
  for (const obj of parseLines(lines)) {
    const resourceSpans = [];
    for (const rs of obj.resourceSpans ?? []) {
      if (serviceName(rs) !== service) continue;
      const scopeSpans = [];
      for (const ss of rs.scopeSpans ?? []) {
        const spans = (ss.spans ?? []).filter((s) => {
          const t = BigInt(s.startTimeUnixNano);
          return t >= start && t <= end;
        });
        if (spans.length > 0) scopeSpans.push({ ...ss, spans });
      }
      if (scopeSpans.length > 0) resourceSpans.push({ ...rs, scopeSpans });
    }
    if (resourceSpans.length > 0) kept.push(JSON.stringify({ ...obj, resourceSpans }));
  }
  return kept;
}

function redactAttributes(attrs, redactKeys) {
  return (attrs ?? []).map((a) => {
    if (redactKeys.has(a.key)) return { ...a, value: REDACTED };
    const v = a.value?.stringValue;
    if (typeof v === 'string' && LOCAL_PATH_PATTERN.test(v)) return { ...a, value: REDACTED };
    return a;
  });
}

// Redacts machine-identity resource attributes and any attribute whose value is an absolute local path.
export function sanitizeTraces(lines) {
  return parseLines(lines).map((obj) => {
    const resourceSpans = (obj.resourceSpans ?? []).map((rs) => ({
      ...rs,
      resource: { ...rs.resource, attributes: redactAttributes(rs.resource?.attributes, REDACTED_RESOURCE_KEYS) },
      scopeSpans: (rs.scopeSpans ?? []).map((ss) => ({
        ...ss,
        spans: (ss.spans ?? []).map((s) => ({ ...s, attributes: redactAttributes(s.attributes, new Set()) })),
      })),
    }));
    return JSON.stringify({ ...obj, resourceSpans });
  });
}

function scoreSignature(result) {
  return JSON.stringify({
    score: result.score,
    criticalFailure: result.criticalFailure,
    summary: result.summary,
    rules: result.rules.map((r) => [r.id, r.status]),
  });
}

function parseArgs(argv) {
  const opts = {};
  const names = { '--input': 'input', '--output': 'output', '--service': 'service', '--start-ns': 'startNs', '--end-ns': 'endNs', '--target': 'target' };
  for (let i = 0; i < argv.length; i += 2) {
    const key = names[argv[i]];
    if (!key) throw new Error(`Unknown option ${argv[i]}`);
    if (argv[i + 1] === undefined) throw new Error(`${argv[i]} needs a value`);
    opts[key] = argv[i + 1];
  }
  for (const [flag, key] of Object.entries(names)) {
    if (key !== 'target' && opts[key] === undefined) throw new Error(`Missing required option ${flag}`);
  }
  for (const [flag, key] of [['--start-ns', 'startNs'], ['--end-ns', 'endNs']]) {
    if (!/^\d+$/.test(opts[key])) throw new Error(`${flag} must be an integer nanosecond count, got "${opts[key]}"`);
  }
  return opts;
}

const USAGE =
  'Usage: node filter-traces.js --input <shared-traces-file> --output <filtered-file> --service <otel-service-name> --start-ns <ns> --end-ns <ns> [--target <target-name>]';

function main(argv) {
  const opts = parseArgs(argv);
  const lines = readFileSync(opts.input, 'utf8').split('\n');
  const total = countSpans(lines);

  const filtered = filterTraces(lines, { service: opts.service, startNs: opts.startNs, endNs: opts.endNs });
  const kept = countSpans(filtered);
  if (kept === 0) {
    throw new Error(`No spans from service "${opts.service}" started between ${opts.startNs} and ${opts.endNs} ns in ${opts.input}`);
  }

  const target = opts.target ?? null;
  const before = scoreIS(filtered, target);
  const sanitized = sanitizeTraces(filtered);
  const after = scoreIS(sanitized, target);
  if (scoreSignature(before) !== scoreSignature(after)) {
    throw new Error(`Sanitizing changed the IS score (${before.score} before, ${after.score} after); output not written`);
  }

  mkdirSync(dirname(opts.output), { recursive: true });
  writeFileSync(opts.output, sanitized.join('\n') + '\n');

  console.log(`Filtered "${opts.service}": kept ${kept} of ${total} spans between ${opts.startNs} and ${opts.endNs} ns`);
  console.log(`score before sanitizing: ${before.score}`);
  console.log(`score unchanged by sanitizing: ${after.score}`);
  console.log(`wrote ${opts.output}`);
}

// Compare real paths: node resolves symlinks for import.meta.url but leaves argv[1] as typed, so a plain
// comparison silently skips main() when the script is run through a symlinked directory (/tmp on macOS).
if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(`filter-traces: ${e.message}`);
    console.error(USAGE);
    process.exit(1);
  }
}
