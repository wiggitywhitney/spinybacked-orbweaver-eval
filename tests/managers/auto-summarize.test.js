// ABOUTME: Tests for auto-summarize.js — auto-trigger logic for daily summaries
// ABOUTME: Verifies gap detection integration and summary generation orchestration

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Mock the summary graph (LLM calls)
const mockGenerateDailySummary = vi.fn();
vi.mock('../../src/generators/summary-graph.js', () => ({
  generateDailySummary: (...args) => mockGenerateDailySummary(...args),
}));

import { triggerAutoSummaries } from '../../src/managers/auto-summarize.js';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let tmpDir;

function setupTmpDir() {
  tmpDir = mkdtempSync(join(tmpdir(), 'auto-summarize-test-'));
}

function teardownTmpDir() {
  if (tmpDir) {
    rmSync(tmpDir, { recursive: true });
    tmpDir = null;
  }
}

function writeEntry(dateStr, content = '# Entry\n\nSome work done') {
  const [year, month] = dateStr.split('-');
  const dir = join(tmpDir, 'journal', 'entries', `${year}-${month}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${dateStr}.md`), content, 'utf-8');
}

function writeSummary(dateStr, content = '# Summary\n\nDaily summary') {
  const dir = join(tmpDir, 'journal', 'summaries', 'daily');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${dateStr}.md`), content, 'utf-8');
}

// ---------------------------------------------------------------------------
// triggerAutoSummaries
// ---------------------------------------------------------------------------

describe('triggerAutoSummaries', () => {
  beforeEach(() => {
    setupTmpDir();
    mockGenerateDailySummary.mockReset();
    mockGenerateDailySummary.mockResolvedValue({
      narrative: 'Summary narrative',
      keyDecisions: 'Some decisions',
      openThreads: 'Some threads',
      errors: [],
    });
  });

  afterEach(teardownTmpDir);

  it('returns empty results when no unsummarized days exist', async () => {
    const result = await triggerAutoSummaries(tmpDir);
    expect(result.generated).toEqual([]);
    expect(result.skipped).toEqual([]);
  });

  it('generates summaries for unsummarized past days', async () => {
    writeEntry('2026-01-10');
    writeEntry('2026-01-11');

    const result = await triggerAutoSummaries(tmpDir);

    expect(result.generated).toHaveLength(2);
    expect(result.generated[0]).toContain('2026-01-10');
    expect(result.generated[1]).toContain('2026-01-11');
    expect(mockGenerateDailySummary).toHaveBeenCalledTimes(2);
  });

  it('skips days that already have summaries', async () => {
    writeEntry('2026-01-10');
    writeEntry('2026-01-11');
    writeSummary('2026-01-10');

    const result = await triggerAutoSummaries(tmpDir);

    expect(result.generated).toHaveLength(1);
    expect(result.generated[0]).toContain('2026-01-11');
    expect(mockGenerateDailySummary).toHaveBeenCalledTimes(1);
  });

  it('does not generate summary for today', async () => {
    const today = new Date().toISOString().slice(0, 10);
    writeEntry(today);

    const result = await triggerAutoSummaries(tmpDir);

    expect(result.generated).toEqual([]);
    expect(mockGenerateDailySummary).not.toHaveBeenCalled();
  });

  it('creates summary files on disk', async () => {
    writeEntry('2026-01-15');

    await triggerAutoSummaries(tmpDir);

    const summaryPath = join(tmpDir, 'journal', 'summaries', 'daily', '2026-01-15.md');
    expect(existsSync(summaryPath)).toBe(true);
  });

  it('records errors from generation without stopping', async () => {
    writeEntry('2026-01-10');
    writeEntry('2026-01-11');
    mockGenerateDailySummary
      .mockResolvedValueOnce({
        narrative: 'OK',
        keyDecisions: '',
        openThreads: '',
        errors: ['LLM timeout on key decisions'],
      })
      .mockResolvedValueOnce({
        narrative: 'Also OK',
        keyDecisions: '',
        openThreads: '',
        errors: [],
      });

    const result = await triggerAutoSummaries(tmpDir);

    expect(result.generated).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('2026-01-10');
  });

  it('continues generating remaining days when one fails', async () => {
    writeEntry('2026-01-10');
    writeEntry('2026-01-11');
    mockGenerateDailySummary
      .mockRejectedValueOnce(new Error('API error'))
      .mockResolvedValueOnce({
        narrative: 'Second day OK',
        keyDecisions: '',
        openThreads: '',
        errors: [],
      });

    const result = await triggerAutoSummaries(tmpDir);

    // First day failed, second succeeded
    expect(result.generated).toHaveLength(1);
    expect(result.generated[0]).toContain('2026-01-11');
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toContain('2026-01-10');
  });

  it('logs progress for each day being summarized', async () => {
    writeEntry('2026-01-10');
    writeEntry('2026-01-11');

    const logs = [];
    const onProgress = (msg) => logs.push(msg);

    await triggerAutoSummaries(tmpDir, { onProgress });

    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain('2026-01-10');
    expect(logs[1]).toContain('2026-01-11');
  });
});
