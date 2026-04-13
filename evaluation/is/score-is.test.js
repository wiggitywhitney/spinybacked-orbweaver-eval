// ABOUTME: Vitest tests for the IS scoring script (evaluation/is/score-is.js).
// ABOUTME: Covers all 9 applicable IS rules with 5 scenarios per the PRD spec.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { scoreIS } from './score-is.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

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
    it('fails when a trace has more than 10 INTERNAL spans', () => {
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
