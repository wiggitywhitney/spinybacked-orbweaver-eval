// ABOUTME: IS scoring script — evaluates OTLP traces against the Instrumentation Score spec.
// ABOUTME: Reads line-delimited OTLP JSON, scores 9 applicable IS rules, outputs weighted score.

// IS spec pinned to commit 52c14ba (v0.1).
// Only rules applicable to a CLI Node.js app are evaluated. MET rules are not applicable
// because spiny-orb produces no OTel metrics by design — this is a scope decision, not
// an instrumentation failure.

import { readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const WEIGHT_CRITICAL = 3;
const WEIGHT_NORMAL = 1;

// OTLP span kind integers (proto enum encoding in JSON)
const SPAN_KIND_INTERNAL = 1;
const SPAN_KIND_CLIENT = 3;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAttrValue(attrs, key) {
  const attr = (attrs || []).find(a => a.key === key);
  if (!attr) return undefined;
  const v = attr.value;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.intValue !== undefined) return v.intValue;
  if (v.boolValue !== undefined) return v.boolValue;
  if (v.doubleValue !== undefined) return v.doubleValue;
  return undefined;
}

function hasAttr(attrs, key) {
  return getAttrValue(attrs, key) !== undefined;
}

function spanKindInt(kind) {
  if (typeof kind === 'number') return kind;
  const kindMap = {
    SPAN_KIND_UNSPECIFIED: 0, SPAN_KIND_INTERNAL: 1, SPAN_KIND_SERVER: 2,
    SPAN_KIND_CLIENT: 3, SPAN_KIND_PRODUCER: 4, SPAN_KIND_CONSUMER: 5,
  };
  return kindMap[kind] ?? 0;
}

function toNanos(val) {
  if (val === undefined || val === null || val === '') return 0n;
  if (typeof val === 'bigint') return val;
  if (typeof val === 'string') return BigInt(val);
  return BigInt(Math.trunc(val));
}

function versionGte(versionStr, minStr) {
  const vParts = String(versionStr).split('.').map(Number);
  const mParts = String(minStr).split('.').map(Number);
  for (let i = 0; i < Math.max(vParts.length, mParts.length); i++) {
    const v = vParts[i] ?? 0;
    const m = mParts[i] ?? 0;
    if (v > m) return true;
    if (v < m) return false;
  }
  return true;
}

// ── Data collection ───────────────────────────────────────────────────────────

function collectResourceSpans(lines) {
  const resourceSpans = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line);
    for (const rs of (obj.resourceSpans || [])) {
      resourceSpans.push(rs);
    }
  }
  return resourceSpans;
}

function getAllSpans(resourceSpans) {
  const spans = [];
  for (const rs of resourceSpans) {
    for (const ss of (rs.scopeSpans || [])) {
      for (const span of (ss.spans || [])) {
        spans.push(span);
      }
    }
  }
  return spans;
}

function getTraces(spans) {
  const traces = new Map();
  for (const span of spans) {
    if (!traces.has(span.traceId)) traces.set(span.traceId, []);
    traces.get(span.traceId).push(span);
  }
  return traces;
}

// ── Rule evaluators ───────────────────────────────────────────────────────────

function evalRES001(resourceSpans) {
  const allAttrs = resourceSpans.flatMap(rs => rs.resource?.attributes || []);
  if (hasAttr(allAttrs, 'service.instance.id')) {
    return { status: 'pass', reason: 'service.instance.id present' };
  }
  return { status: 'fail', reason: 'service.instance.id absent from resource attributes' };
}

// Resource-level semconv keys that should NOT appear on spans.
const RESOURCE_SEMCONV_KEYS = new Set([
  'service.name', 'service.version', 'service.namespace',
  'telemetry.sdk.name', 'telemetry.sdk.language', 'telemetry.sdk.version',
  'host.name', 'host.arch', 'host.type', 'host.id',
  'os.type', 'os.description', 'os.version', 'os.name',
  'process.pid', 'process.executable.name', 'process.runtime.name', 'process.runtime.version',
]);

// Span-level semconv keys that should NOT appear on resource attributes.
const SPAN_SEMCONV_KEYS = new Set([
  'http.request.method', 'http.response.status_code', 'http.method', 'http.status_code',
  'db.system', 'db.system.name', 'db.statement', 'db.query.text',
  'rpc.system', 'rpc.method',
  'messaging.system', 'messaging.destination.name',
]);

function evalRES004(resourceSpans) {
  const misplaced = [];
  for (const rs of resourceSpans) {
    for (const attr of (rs.resource?.attributes || [])) {
      if (SPAN_SEMCONV_KEYS.has(attr.key)) {
        misplaced.push(`${attr.key} on resource (should be on span)`);
      }
    }
    for (const ss of (rs.scopeSpans || [])) {
      for (const span of (ss.spans || [])) {
        for (const attr of (span.attributes || [])) {
          if (RESOURCE_SEMCONV_KEYS.has(attr.key)) {
            misplaced.push(`${attr.key} on span (should be on resource)`);
          }
        }
      }
    }
  }
  if (misplaced.length === 0) {
    return { status: 'pass', reason: 'semconv attributes at correct OTLP level' };
  }
  return { status: 'fail', reason: `${misplaced.length} attribute(s) at wrong OTLP level (e.g. ${misplaced[0]})` };
}

function evalRES005(resourceSpans) {
  const allAttrs = resourceSpans.flatMap(rs => rs.resource?.attributes || []);
  if (hasAttr(allAttrs, 'service.name')) {
    return { status: 'pass', reason: 'service.name present' };
  }
  return { status: 'fail', reason: 'service.name absent from resource attributes' };
}

function evalSPA001(traces) {
  for (const [traceId, spans] of traces) {
    const internalCount = spans.filter(s => spanKindInt(s.kind) === SPAN_KIND_INTERNAL).length;
    if (internalCount > 10) {
      return { status: 'fail', reason: `trace ${traceId.slice(0, 8)} has ${internalCount} INTERNAL spans (limit 10)` };
    }
  }
  const totalInternal = [...traces.values()].reduce(
    (sum, spans) => sum + spans.filter(s => spanKindInt(s.kind) === SPAN_KIND_INTERNAL).length, 0
  );
  return { status: 'pass', reason: `INTERNAL span count within limit (${totalInternal} total)` };
}

function evalSPA002(traces) {
  for (const [, spans] of traces) {
    const spanIds = new Set(spans.map(s => s.spanId));
    for (const span of spans) {
      const parentId = span.parentSpanId;
      if (parentId && parentId !== '' && !spanIds.has(parentId)) {
        return { status: 'fail', reason: `span ${String(span.spanId).slice(0, 8)} has orphan parentSpanId ${String(parentId).slice(0, 8)}` };
      }
    }
  }
  return { status: 'pass', reason: 'no orphan spans' };
}

// SPA-003: span name cardinality — fail if a name contains 3+ consecutive digits,
// a UUID-shaped substring, or if total unique names > 50 (provisional threshold;
// spec marks this as "TODO" — revisit when the spec defines it).
const DIGIT_RUN = /\d{3,}/;
const UUID_SHAPE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function evalSPA003(spans) {
  const uniqueNames = new Set(spans.map(s => s.name));
  for (const name of uniqueNames) {
    if (DIGIT_RUN.test(name)) {
      return { status: 'fail', reason: `span name "${name}" contains 3+ consecutive digits (likely interpolated value)` };
    }
    if (UUID_SHAPE.test(name)) {
      return { status: 'fail', reason: `span name "${name}" contains a UUID-shaped substring (likely interpolated value)` };
    }
  }
  if (uniqueNames.size > 50) {
    return { status: 'fail', reason: `${uniqueNames.size} unique span names exceeds threshold of 50` };
  }
  return { status: 'pass', reason: `${uniqueNames.size} unique span name(s), no interpolated values detected` };
}

function evalSPA004(traces) {
  for (const [, spans] of traces) {
    const rootSpans = spans.filter(s => !s.parentSpanId || s.parentSpanId === '');
    for (const root of rootSpans) {
      if (spanKindInt(root.kind) === SPAN_KIND_CLIENT) {
        return { status: 'fail', reason: `root span "${root.name}" has CLIENT kind (should be INTERNAL or SERVER)` };
      }
    }
  }
  return { status: 'pass', reason: 'root spans are not CLIENT kind' };
}

function evalSPA005(spans) {
  const FIVE_MS = 5_000_000n;
  const shortCount = spans.filter(span => {
    const duration = toNanos(span.endTimeUnixNano) - toNanos(span.startTimeUnixNano);
    return duration < FIVE_MS;
  }).length;
  if (shortCount > 20) {
    return { status: 'fail', reason: `${shortCount} spans have duration <5ms (limit 20)` };
  }
  return { status: 'pass', reason: `${shortCount} span(s) with duration <5ms (within limit of 20)` };
}

// SDK-001: check telemetry.sdk.language and process.runtime.version against minimum
// supported runtime versions. telemetry.sdk.version is the OTel SDK version (e.g. 1.25.0);
// process.runtime.version is the language runtime version (e.g. 22.0.0 for Node.js).
// The OTel Node.js SDK auto-populates process.runtime.version from the running Node.js version.
const SDK_MIN_VERSIONS = { nodejs: '18', python: '3.8', go: '1.20' };

function evalSDK001(resourceSpans) {
  for (const rs of resourceSpans) {
    const attrs = rs.resource?.attributes || [];
    const language = getAttrValue(attrs, 'telemetry.sdk.language');
    if (!language) continue;

    const minVersion = SDK_MIN_VERSIONS[language];
    if (minVersion === undefined) {
      return { status: 'not_applicable', reason: `unknown SDK language: ${language}` };
    }

    const versionStr = getAttrValue(attrs, 'process.runtime.version');
    if (versionStr === undefined) {
      return { status: 'fail', reason: `telemetry.sdk.language is ${language} but process.runtime.version is absent` };
    }

    if (versionGte(versionStr, minVersion)) {
      return { status: 'pass', reason: `${language} runtime version ${versionStr} meets minimum (≥${minVersion})` };
    }
    return { status: 'fail', reason: `${language} runtime version ${versionStr} below minimum (≥${minVersion})` };
  }
  return { status: 'not_applicable', reason: 'telemetry.sdk.language absent' };
}

// MET rules are not applicable — spiny-orb produces no OTel metrics by design.
const MET_RULE_IDS = ['MET-001', 'MET-002', 'MET-003', 'MET-004', 'MET-005', 'MET-006'];
const MET_NOT_APPLICABLE = { status: 'not_applicable', reason: 'spiny-orb produces no OTel metrics (deliberate scope decision)' };

// ── Main scorer ───────────────────────────────────────────────────────────────

export function scoreIS(lines) {
  const resourceSpans = collectResourceSpans(lines);
  const allSpans = getAllSpans(resourceSpans);
  const traces = getTraces(allSpans);

  const ruleResults = [
    { id: 'RES-005', name: 'service.name present',               weight: WEIGHT_CRITICAL, critical: true,  ...evalRES005(resourceSpans) },
    { id: 'RES-001', name: 'service.instance.id present',        weight: WEIGHT_NORMAL,   critical: false, ...evalRES001(resourceSpans) },
    { id: 'RES-004', name: 'semconv at correct OTLP level',      weight: WEIGHT_NORMAL,   critical: false, ...evalRES004(resourceSpans) },
    { id: 'SPA-001', name: 'INTERNAL span count within limit',   weight: WEIGHT_NORMAL,   critical: false, ...evalSPA001(traces) },
    { id: 'SPA-002', name: 'no orphan spans',                    weight: WEIGHT_NORMAL,   critical: false, ...evalSPA002(traces) },
    { id: 'SPA-003', name: 'span name cardinality',              weight: WEIGHT_NORMAL,   critical: false, ...evalSPA003(allSpans) },
    { id: 'SPA-004', name: 'root spans not CLIENT kind',         weight: WEIGHT_NORMAL,   critical: false, ...evalSPA004(traces) },
    { id: 'SPA-005', name: 'short spans within limit',           weight: WEIGHT_NORMAL,   critical: false, ...evalSPA005(allSpans) },
    { id: 'SDK-001', name: 'SDK version supported',              weight: WEIGHT_NORMAL,   critical: false, ...evalSDK001(resourceSpans) },
    ...MET_RULE_IDS.map(id => ({ id, name: `metrics rule ${id}`, weight: 0, critical: false, ...MET_NOT_APPLICABLE })),
  ];

  const criticalFailure = ruleResults.some(r => r.critical && r.status === 'fail');
  const applicable = ruleResults.filter(r => r.status !== 'not_applicable');
  const weightedTotal = applicable.reduce((sum, r) => sum + r.weight, 0);
  const weightedPasses = applicable.filter(r => r.status === 'pass').reduce((sum, r) => sum + r.weight, 0);

  const score = criticalFailure
    ? 0
    : weightedTotal > 0
      ? Math.round((weightedPasses / weightedTotal) * 1000) / 10
      : 100;

  return {
    score,
    criticalFailure,
    rules: ruleResults,
    summary: {
      applicable: applicable.length,
      passed:        ruleResults.filter(r => r.status === 'pass').length,
      failed:        ruleResults.filter(r => r.status === 'fail').length,
      notApplicable: ruleResults.filter(r => r.status === 'not_applicable').length,
      weightedPasses,
      weightedTotal,
    },
  };
}

// ── Output formatter ──────────────────────────────────────────────────────────

function formatOutput(result) {
  const lines = [];
  lines.push(result.criticalFailure
    ? 'IS Score: 0 / 100 (Critical rule failure)'
    : `IS Score: ${result.score} / 100`
  );
  lines.push('');
  lines.push('Rule Results:');

  for (const rule of result.rules) {
    if (rule.status === 'not_applicable') continue;
    const icon = rule.status === 'pass' ? '✅' : '❌';
    const critical = rule.critical ? ' (Critical)' : '';
    lines.push(`${icon} ${rule.id}${critical}: ${rule.reason}`);
  }

  lines.push('');
  lines.push(
    `Applicable rules: ${result.summary.applicable} | ` +
    `Passed: ${result.summary.passed} | ` +
    `Failed: ${result.summary.failed} | ` +
    `Not applicable (skipped): ${result.summary.notApplicable}`
  );
  lines.push(`Weighted score: ${result.summary.weightedPasses}/${result.summary.weightedTotal} points (Critical rules weighted 3×)`);

  return lines.join('\n');
}

// ── CLI entry point ───────────────────────────────────────────────────────────

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node score-is.js <path-to-otlp-json-file>');
    process.exit(1);
  }
  const content = readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n').filter(Boolean);
  const result = scoreIS(lines);
  console.log(formatOutput(result));
  process.exit(0);
}
