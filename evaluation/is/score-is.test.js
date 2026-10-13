// ABOUTME: Vitest tests for the IS scoring script (evaluation/is/score-is.js).
// ABOUTME: Covers all 9 applicable IS rules, CLI runs through a symlinked path, and module import without a script path.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { readFileSync, mkdtempSync, rmSync, symlinkSync } from 'fs';
import { tmpdir } from 'os';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { scoreIS } from './score-is.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');
const SCRIPT = join(__dirname, 'score-is.js');

function loadFixture(name) {
  const content = readFileSync(join(fixturesDir, name), 'utf8');
  return content.trim().split('\n').filter(Boolean);
}

describe('scoreIS', () => {
  describe('all 9 applicable rules pass', () => {
    it('returns IS score of 100 when all applicable rules pass', () => {
      const lines = loadFixture('all-pass.jsonl');
      const result = scoreIS(lines);
      expect(result.score).toBe(100);
      expect(result.criticalFailure).toBe(false);
      expect(result.summary.applicable).toBe(9);
      expect(result.summary.passed).toBe(9);
      expect(result.summary.failed).toBe(0);
    });
  });

  describe('RES-005 failure (Critical rule)', () => {
    it('returns IS score of 0 when service.name is missing', () => {
      const lines = loadFixture('missing-service-name.jsonl');
      const result = scoreIS(lines);
      expect(result.score).toBe(0);
      expect(result.criticalFailure).toBe(true);
      const rule = result.rules.find(r => r.id === 'RES-005');
      expect(rule.status).toBe('fail');
    });
  });

  describe('SPA-002 failure (orphan spans)', () => {
    it('fails when a span parentSpanId does not resolve to another span in the trace', () => {
      const lines = loadFixture('orphan-span.jsonl');
      const result = scoreIS(lines);
      const rule = result.rules.find(r => r.id === 'SPA-002');
      expect(rule.status).toBe('fail');
    });
  });

  describe('SPA-001 failure (too many INTERNAL spans)', () => {
    it('fails when a trace exceeds the SPA-001 INTERNAL span limit', () => {
      const lines = loadFixture('too-many-internal.jsonl');
      const result = scoreIS(lines);
      const rule = result.rules.find(r => r.id === 'SPA-001');
      expect(rule.status).toBe('fail');
    });
  });

  describe('SPA-001 per-target threshold', () => {
    it('marks SPA-001 as not_applicable for taze (deferred calibration)', () => {
      const lines = loadFixture('too-many-internal.jsonl');
      const result = scoreIS(lines, 'taze');
      const rule = result.rules.find(r => r.id === 'SPA-001');
      expect(rule.status).toBe('not_applicable');
    });

    it('falls back to global default for unknown targets (31 spans exceeds 30 limit)', () => {
      const lines = loadFixture('too-many-internal.jsonl');
      const result = scoreIS(lines, 'unknown-target');
      const rule = result.rules.find(r => r.id === 'SPA-001');
      expect(rule.status).toBe('fail');
    });

    it('passes SPA-001 for commit-story-v2 with 31 spans (below 55 limit)', () => {
      const lines = loadFixture('too-many-internal.jsonl');
      const result = scoreIS(lines, 'commit-story-v2');
      const rule = result.rules.find(r => r.id === 'SPA-001');
      expect(rule.status).toBe('pass');
    });

    it('uses global default when no target is specified', () => {
      const lines = loadFixture('too-many-internal.jsonl');
      const result = scoreIS(lines);
      const rule = result.rules.find(r => r.id === 'SPA-001');
      expect(rule.status).toBe('fail');
    });
  });

  describe('MET rules', () => {
    it('marks MET-001 through MET-006 as not_applicable, never as fail', () => {
      const lines = loadFixture('all-pass.jsonl');
      const result = scoreIS(lines);
      const metRules = result.rules.filter(r => r.id.startsWith('MET-'));
      expect(metRules).toHaveLength(6);
      for (const rule of metRules) {
        expect(rule.status).toBe('not_applicable');
      }
    });
  });
});

describe('command line', () => {
  let dir;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'score-is-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const fixture = join(fixturesDir, 'all-pass.jsonl');
  const run = (script) => execFileSync('node', [script, fixture, '--target', 'release-it'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

  it('prints the same score when invoked through a symlinked path instead of silently doing nothing', () => {
    const linked = join(dir, 'linked-score-is.js');
    symlinkSync(SCRIPT, linked);

    const direct = run(SCRIPT);
    const viaSymlink = run(linked);

    expect(direct).toMatch(/IS Score: 100 \/ 100/);
    expect(viaSymlink).toBe(direct);
  });
});

describe('module loading without a script path', () => {
  it.each(['score-is.js', 'filter-traces.js'])('imports %s from node -e without throwing', (name) => {
    const url = pathToFileURL(join(__dirname, name)).href;

    const stdout = execFileSync('node', ['--input-type=module', '-e', `await import(${JSON.stringify(url)}); console.log('loaded');`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

    expect(stdout.trim()).toBe('loaded');
  });
});
