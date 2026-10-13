// ABOUTME: Filters the shared eval-traces.json down to one run's spans and redacts machine identity.
// ABOUTME: Keeps OTLP envelopes intact, then verifies the IS score is unchanged by redaction.

import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreIS } from './score-is.js';

const REDACTED = { stringValue: 'REDACTED' };
const NO_KEYS = new Set();

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

function resourceAttr(resourceSpansEntry, key) {
  const attrs = resourceSpansEntry.resource?.attributes ?? [];
  return attrs.find((a) => a.key === key)?.value?.stringValue;
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

// Keeps spans from `service` whose start time falls in [startNs, endNs]. When `instanceId` is given, only
// the resource whose service.instance.id equals it is kept, which excludes concurrent runs of the same
// service. Filtering happens inside each OTLP record, so every kept span stays wrapped in its
// resourceSpans and scopeSpans entries; entries and records left empty are dropped.
export function filterTraces(lines, { service, startNs, endNs, instanceId } = {}) {
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
      if (resourceAttr(rs, 'service.name') !== service) continue;
      if (instanceId !== undefined && resourceAttr(rs, 'service.instance.id') !== instanceId) continue;
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

// Redacts local paths inside one OTLP attribute value, including values nested in arrays and key-value lists.
// A key-value-list entry whose key is in `redactKeys` has its whole value redacted.
function redactValue(value, redactKeys) {
  if (!value) return value;
  if (typeof value.stringValue === 'string' && LOCAL_PATH_PATTERN.test(value.stringValue)) return REDACTED;
  if (value.arrayValue?.values) {
    return { ...value, arrayValue: { ...value.arrayValue, values: value.arrayValue.values.map((v) => redactValue(v, redactKeys)) } };
  }
  if (value.kvlistValue?.values) {
    return { ...value, kvlistValue: { ...value.kvlistValue, values: redactAttributes(value.kvlistValue.values, redactKeys) } };
  }
  return value;
}

function redactAttributes(attrs, redactKeys) {
  return (attrs ?? []).map((a) => (redactKeys.has(a.key) ? { ...a, value: REDACTED } : { ...a, value: redactValue(a.value, redactKeys) }));
}

// Redacts machine-identity resource attributes, the whole value of every key in `redactKeys` wherever it
// appears, and any attribute value that is an absolute path under the roots in LOCAL_PATH_PATTERN. Paths
// under other roots are not redacted.
export function sanitizeTraces(lines, { redactKeys = [] } = {}) {
  const extraKeys = redactKeys.length > 0 ? new Set(redactKeys) : NO_KEYS;
  const resourceKeys = new Set([...REDACTED_RESOURCE_KEYS, ...extraKeys]);
  return parseLines(lines).map((obj) => {
    const resourceSpans = (obj.resourceSpans ?? []).map((rs) => ({
      ...rs,
      resource: { ...rs.resource, attributes: redactAttributes(rs.resource?.attributes, resourceKeys) },
      scopeSpans: (rs.scopeSpans ?? []).map((ss) => ({
        ...ss,
        ...(ss.scope?.attributes ? { scope: { ...ss.scope, attributes: redactAttributes(ss.scope.attributes, extraKeys) } } : {}),
        spans: (ss.spans ?? []).map((s) => ({
          ...s,
          attributes: redactAttributes(s.attributes, extraKeys),
          ...(s.events ? { events: s.events.map((e) => ({ ...e, attributes: redactAttributes(e.attributes, extraKeys) })) } : {}),
          ...(s.links ? { links: s.links.map((l) => ({ ...l, attributes: redactAttributes(l.attributes, extraKeys) })) } : {}),
        })),
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

const REQUIRED_OPTIONS = { '--input': 'input', '--output': 'output', '--service': 'service', '--start-ns': 'startNs', '--end-ns': 'endNs' };
const OPTIONAL_OPTIONS = { '--target': 'target', '--instance-id': 'instanceId' };
// Options that may be given more than once; every value is collected into an array.
const REPEATABLE_OPTIONS = { '--redact-attribute': 'redactKeys' };

function parseArgs(argv) {
  const opts = { redactKeys: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const key = REQUIRED_OPTIONS[flag] ?? OPTIONAL_OPTIONS[flag] ?? REPEATABLE_OPTIONS[flag];
    if (!key) throw new Error(`Unknown option ${flag}`);
    if (argv[i + 1] === undefined) throw new Error(`${flag} needs a value`);
    if (REPEATABLE_OPTIONS[flag]) opts[key].push(argv[i + 1]);
    else opts[key] = argv[i + 1];
  }
  for (const [flag, key] of Object.entries(REQUIRED_OPTIONS)) {
    if (opts[key] === undefined) throw new Error(`Missing required option ${flag}`);
  }
  for (const [flag, key] of [['--start-ns', 'startNs'], ['--end-ns', 'endNs']]) {
    if (!/^\d+$/.test(opts[key])) throw new Error(`${flag} must be an integer nanosecond count, got "${opts[key]}"`);
  }
  return opts;
}

const USAGE =
  'Usage: node filter-traces.js --input <shared-traces-file> --output <filtered-file> --service <otel-service-name> --start-ns <ns> --end-ns <ns> [--target <target-name>] [--instance-id <service.instance.id>] [--redact-attribute <key>]...';

function main(argv) {
  const opts = parseArgs(argv);
  const lines = readFileSync(opts.input, 'utf8').split('\n');
  const total = countSpans(lines);

  const filtered = filterTraces(lines, { service: opts.service, startNs: opts.startNs, endNs: opts.endNs, instanceId: opts.instanceId });
  const kept = countSpans(filtered);
  const instance = opts.instanceId === undefined ? '' : ` with service.instance.id "${opts.instanceId}"`;
  if (kept === 0) {
    throw new Error(`No spans from service "${opts.service}"${instance} started between ${opts.startNs} and ${opts.endNs} ns in ${opts.input}`);
  }

  const target = opts.target ?? null;
  const before = scoreIS(filtered, target);
  const sanitized = sanitizeTraces(filtered, { redactKeys: opts.redactKeys });
  const after = scoreIS(sanitized, target);
  if (scoreSignature(before) !== scoreSignature(after)) {
    throw new Error(`Sanitizing changed the IS score (${before.score} before, ${after.score} after); output not written`);
  }

  mkdirSync(dirname(opts.output), { recursive: true });
  writeFileSync(opts.output, sanitized.join('\n') + '\n');

  console.log(`Filtered "${opts.service}"${instance}: kept ${kept} of ${total} spans between ${opts.startNs} and ${opts.endNs} ns`); // eslint-disable-line no-console
  if (opts.redactKeys.length > 0) console.log(`redacted attributes: ${opts.redactKeys.join(', ')}`); // eslint-disable-line no-console
  console.log(`score before sanitizing: ${before.score}`);
  console.log(`score unchanged by sanitizing: ${after.score}`);
  console.log(`wrote ${opts.output}`);
}

// Compare real paths: node resolves symlinks for import.meta.url but leaves argv[1] as typed, so a plain
// comparison silently skips main() when the script is run through a symlinked directory (/tmp on macOS).
// argv[1] is undefined when the module is imported from node -e or the REPL.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(`filter-traces: ${e.message}`);
    console.error(USAGE);
    process.exit(1);
  }
}
