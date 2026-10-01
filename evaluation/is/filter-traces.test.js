// ABOUTME: Vitest tests for the IS trace filter (evaluation/is/filter-traces.js).
// ABOUTME: Covers span-level filtering inside OTLP envelopes, redaction, score checks, and the CLI.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { filterTraces, sanitizeTraces } from './filter-traces.js';
import { scoreIS } from './score-is.js';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'filter-traces.js');

const str = (key, value) => ({ key, value: { stringValue: value } });

function span(name, startNs, attrs = []) {
  return {
    traceId: 'a'.repeat(32),
    spanId: String(startNs).padStart(16, '0').slice(-16),
    name,
    kind: 1,
    startTimeUnixNano: String(startNs),
    endTimeUnixNano: String(BigInt(startNs) + 1000n),
    attributes: attrs,
    status: {},
  };
}

function resourceSpans(service, scopes, extraResourceAttrs = []) {
  return {
    resource: {
      attributes: [
        str('service.name', service),
        str('service.instance.id', `${service}-instance`),
        str('telemetry.sdk.language', 'nodejs'),
        str('telemetry.sdk.version', '2.0.0'),
        str('process.runtime.version', '22.1.0'),
        ...extraResourceAttrs,
      ],
    },
    scopeSpans: scopes.map((spans, i) => ({ scope: { name: `scope-${i}` }, spans })),
  };
}

const line = (...resourceSpansList) => JSON.stringify({ resourceSpans: resourceSpansList });
const parse = (lines) => lines.map((l) => JSON.parse(l));
const allSpans = (lines) =>
  parse(lines).flatMap((o) => o.resourceSpans.flatMap((rs) => rs.scopeSpans.flatMap((ss) => ss.spans)));

const WINDOW = { service: 'target-app', startNs: 1000n, endNs: 2000n };

describe('filterTraces', () => {
  it('keeps only spans that started inside the window, inclusive at both ends', () => {
    const lines = [
      line(resourceSpans('target-app', [[span('before', 999), span('at-start', 1000), span('inside', 1500), span('at-end', 2000), span('after', 2001)]])),
    ];

    const names = allSpans(filterTraces(lines, WINDOW)).map((s) => s.name);

    expect(names).toEqual(['at-start', 'inside', 'at-end']);
  });

  it('preserves the resourceSpans envelope and resource attributes around the kept spans', () => {
    const lines = [line(resourceSpans('target-app', [[span('inside', 1500), span('after', 5000)]]))];

    const [out] = parse(filterTraces(lines, WINDOW));

    expect(out.resourceSpans).toHaveLength(1);
    expect(out.resourceSpans[0].resource.attributes.find((a) => a.key === 'service.name').value.stringValue).toBe('target-app');
    expect(out.resourceSpans[0].scopeSpans[0].scope.name).toBe('scope-0');
    expect(out.resourceSpans[0].scopeSpans[0].spans.map((s) => s.name)).toEqual(['inside']);
  });

  it('drops other services entirely, even inside the window', () => {
    const lines = [line(resourceSpans('other-app', [[span('inside', 1500)]]), resourceSpans('target-app', [[span('mine', 1500)]]))];

    const out = filterTraces(lines, WINDOW);

    expect(allSpans(out).map((s) => s.name)).toEqual(['mine']);
    expect(parse(out)[0].resourceSpans).toHaveLength(1);
  });

  it('drops emptied scopes, emptied resourceSpans, and emptied lines', () => {
    const lines = [
      line(resourceSpans('target-app', [[span('late', 9000)], [span('inside', 1500)]])),
      line(resourceSpans('target-app', [[span('also-late', 9001)]])),
    ];

    const out = filterTraces(lines, WINDOW);

    expect(out).toHaveLength(1);
    expect(parse(out)[0].resourceSpans[0].scopeSpans).toHaveLength(1);
  });

  it('skips blank lines and compares nanosecond timestamps without precision loss', () => {
    const big = 1790000000000000123n;
    const lines = ['', line(resourceSpans('target-app', [[span('exact', big), span('one-off', big + 1n)]])), '  '];

    const out = filterTraces(lines, { service: 'target-app', startNs: big, endNs: big });

    expect(allSpans(out).map((s) => s.name)).toEqual(['exact']);
  });

  it('throws when the window or service is missing', () => {
    expect(() => filterTraces([], { service: 'x', startNs: 1n })).toThrow(/endNs/);
    expect(() => filterTraces([], { startNs: 1n, endNs: 2n })).toThrow(/service/);
  });

  it('throws when the start is after the end', () => {
    expect(() => filterTraces([], { service: 'x', startNs: 5n, endNs: 1n })).toThrow(/after/);
  });
});

describe('sanitizeTraces', () => {
  const sensitive = [
    str('process.owner', 'whitney.lee'),
    str('host.name', 'COMP-D2JXTJQ32T'),
    str('host.id', 'abc-123'),
    { key: 'process.command_args', value: { arrayValue: { values: [{ stringValue: '/Users/whitney.lee/bin/node' }] } } },
    str('process.executable.path', '/opt/homebrew/bin/node'),
    str('process.command', '/Users/whitney.lee/repo/bin/app.js'),
  ];

  it('redacts the machine-identity resource attributes and keeps the others', () => {
    const lines = [line(resourceSpans('target-app', [[span('s', 1500)]], sensitive))];

    const [out] = parse(sanitizeTraces(lines));
    const attrs = Object.fromEntries(out.resourceSpans[0].resource.attributes.map((a) => [a.key, a.value]));

    for (const key of ['process.owner', 'host.name', 'host.id', 'process.command_args', 'process.executable.path', 'process.command']) {
      expect(attrs[key]).toEqual({ stringValue: 'REDACTED' });
    }
    expect(attrs['service.name']).toEqual({ stringValue: 'target-app' });
  });

  it('redacts span attributes whose value is an absolute local path and leaves URL paths alone', () => {
    const lines = [
      line(
        resourceSpans('target-app', [[
          span('s', 1500, [
            str('app.repo_path', '/Users/whitney.lee/Documents/Repositories/app'),
            str('app.temp_dir', '/private/var/folders/xy/T/tmp123'),
            str('app.windows_path', 'C:\\Users\\someone\\app'),
            str('http.target', '/api/users/42'),
            str('app.name', 'plain'),
          ]),
        ]]),
      ),
    ];

    const [out] = parse(sanitizeTraces(lines));
    const attrs = Object.fromEntries(out.resourceSpans[0].scopeSpans[0].spans[0].attributes.map((a) => [a.key, a.value.stringValue]));

    expect(attrs['app.repo_path']).toBe('REDACTED');
    expect(attrs['app.temp_dir']).toBe('REDACTED');
    expect(attrs['app.windows_path']).toBe('REDACTED');
    expect(attrs['http.target']).toBe('/api/users/42');
    expect(attrs['app.name']).toBe('plain');
  });

  it('redacts local paths inside array-valued attributes and keeps the other elements', () => {
    const arrayAttr = {
      key: 'app.files',
      value: { arrayValue: { values: [{ stringValue: '/Users/alice/repo/file.js' }, { stringValue: 'plain.txt' }, { stringValue: '/api/health' }, { intValue: '7' }] } },
    };
    const lines = [line(resourceSpans('target-app', [[span('s', 1500, [arrayAttr])]]))];

    const [out] = parse(sanitizeTraces(lines));
    const values = out.resourceSpans[0].scopeSpans[0].spans[0].attributes[0].value.arrayValue.values;

    expect(values).toEqual([{ stringValue: 'REDACTED' }, { stringValue: 'plain.txt' }, { stringValue: '/api/health' }, { intValue: '7' }]);
  });

  it('redacts local paths in scope, event, and link attributes', () => {
    const path = str('app.path', '/home/bob/project/a.js');
    const resource = resourceSpans('target-app', [[{ ...span('s', 1500), events: [{ name: 'e', attributes: [path] }], links: [{ traceId: 'b'.repeat(32), spanId: '1'.repeat(16), attributes: [path] }] }]]);
    resource.scopeSpans[0].scope = { name: 'scope-0', attributes: [path] };

    const text = sanitizeTraces([line(resource)])[0];

    expect(text).not.toContain('/home/bob');
    const out = JSON.parse(text).resourceSpans[0].scopeSpans[0];
    expect(out.scope.attributes[0].value).toEqual({ stringValue: 'REDACTED' });
    expect(out.spans[0].events[0].attributes[0].value).toEqual({ stringValue: 'REDACTED' });
    expect(out.spans[0].links[0].attributes[0].value).toEqual({ stringValue: 'REDACTED' });
  });

  it('does not mutate its input', () => {
    const original = line(resourceSpans('target-app', [[span('s', 1500)]], sensitive));
    const copy = JSON.stringify(JSON.parse(original));

    sanitizeTraces([original]);

    expect(JSON.stringify(JSON.parse(original))).toBe(copy);
  });
});

describe('command line', () => {
  let dir;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'filter-traces-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const run = (args) => execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const fail = (args) => {
    try {
      run(args);
    } catch (e) {
      return { status: e.status, stderr: String(e.stderr) };
    }
    throw new Error('expected the command to fail');
  };

  function writeInput() {
    const input = join(dir, 'shared.json');
    const lines = [
      line(resourceSpans('other-app', [[span('noise', 1500)]])),
      line(resourceSpans('target-app', [[span('early', 10), span('mine-a', 1500), span('mine-b', 1600)]], [str('host.name', 'REAL-HOST')])),
    ];
    writeFileSync(input, lines.join('\n') + '\n');
    return input;
  }

  it('writes a filtered, sanitized JSON Lines file and reports the score check', () => {
    const input = writeInput();
    const output = join(dir, 'out', 'eval-traces-run1.json');

    const stdout = run(['--input', input, '--output', output, '--service', 'target-app', '--start-ns', '1000', '--end-ns', '2000', '--target', 'release-it']);

    const written = readFileSync(output, 'utf8');
    expect(written.endsWith('\n')).toBe(true);
    const lines = written.trim().split('\n');
    expect(allSpans(lines).map((s) => s.name)).toEqual(['mine-a', 'mine-b']);
    expect(written).not.toContain('REAL-HOST');
    expect(written).toContain('REDACTED');
    expect(stdout).toMatch(/kept 2 of 4 spans/);
    expect(stdout).toMatch(/score unchanged by sanitizing: \d+/);
    expect(scoreIS(lines, 'release-it').score).toBeTypeOf('number');
  });

  it('runs when invoked through a symlinked path instead of silently doing nothing', () => {
    const input = writeInput();
    const output = join(dir, 'via-symlink.json');
    const linked = join(dir, 'linked-filter-traces.js');
    symlinkSync(SCRIPT, linked);

    execFileSync('node', [linked, '--input', input, '--output', output, '--service', 'target-app', '--start-ns', '1000', '--end-ns', '2000', '--target', 'release-it'], { stdio: 'pipe' });

    expect(existsSync(output)).toBe(true);
  });

  it('fails without writing the output when no spans match', () => {
    const input = writeInput();
    const output = join(dir, 'none.json');

    const result = fail(['--input', input, '--output', output, '--service', 'target-app', '--start-ns', '5000', '--end-ns', '6000', '--target', 'release-it']);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/no spans/i);
    expect(existsSync(output)).toBe(false);
  });

  it('fails on a missing required option', () => {
    const input = writeInput();

    const result = fail(['--input', input, '--output', join(dir, 'x.json'), '--service', 'target-app', '--start-ns', '1000']);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/--end-ns/);
  });

  it('fails on a start or end that is not an integer nanosecond count', () => {
    const input = writeInput();

    const result = fail(['--input', input, '--output', join(dir, 'x.json'), '--service', 'target-app', '--start-ns', '12.5', '--end-ns', '2000', '--target', 'release-it']);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/--start-ns/);
  });
});
