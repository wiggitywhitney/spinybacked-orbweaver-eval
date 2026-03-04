// ABOUTME: Tests for summary-detector.js — gap detection for unsummarized journal days
// ABOUTME: Uses temp directories with fixture entries and summaries to test detection logic

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  findUnsummarizedDays,
  getDaysWithEntries,
} from '../../src/utils/summary-detector.js';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let tmpDir;

function setupTmpDir() {
  tmpDir = mkdtempSync(join(tmpdir(), 'summary-detector-test-'));
}

function teardownTmpDir() {
  if (tmpDir) {
    rmSync(tmpDir, { recursive: true });
    tmpDir = null;
  }
}

function writeEntry(dateStr, content = '# Entry\n\nSome work') {
  const [year, month] = dateStr.split('-');
  const dir = join(tmpDir, 'journal', 'entries', `${year}-${month}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${dateStr}.md`), content, 'utf-8');
}

function writeSummary(dateStr, content = '# Summary\n\nSome summary') {
  const dir = join(tmpDir, 'journal', 'summaries', 'daily');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${dateStr}.md`), content, 'utf-8');
}

// ---------------------------------------------------------------------------
// getDaysWithEntries
// ---------------------------------------------------------------------------

describe('getDaysWithEntries', () => {
  beforeEach(setupTmpDir);
  afterEach(teardownTmpDir);

  it('returns empty array when no entries directory exists', async () => {
    const result = await getDaysWithEntries(tmpDir);
    expect(result).toEqual([]);
  });

  it('returns empty array when entries directory is empty', async () => {
    mkdirSync(join(tmpDir, 'journal', 'entries'), { recursive: true });
    const result = await getDaysWithEntries(tmpDir);
    expect(result).toEqual([]);
  });

  it('finds entries across multiple year-month directories', async () => {
    writeEntry('2026-01-15');
    writeEntry('2026-02-03');
    writeEntry('2026-02-22');

    const result = await getDaysWithEntries(tmpDir);
    expect(result).toEqual(['2026-01-15', '2026-02-03', '2026-02-22']);
  });

  it('returns dates sorted in ascending order', async () => {
    writeEntry('2026-03-01');
    writeEntry('2026-01-15');
    writeEntry('2026-02-10');

    const result = await getDaysWithEntries(tmpDir);
    expect(result).toEqual(['2026-01-15', '2026-02-10', '2026-03-01']);
  });

  it('ignores non-date files in entries directories', async () => {
    writeEntry('2026-02-22');
    const dir = join(tmpDir, 'journal', 'entries', '2026-02');
    writeFileSync(join(dir, 'notes.txt'), 'not a date', 'utf-8');

    const result = await getDaysWithEntries(tmpDir);
    expect(result).toEqual(['2026-02-22']);
  });
});

// ---------------------------------------------------------------------------
// findUnsummarizedDays
// ---------------------------------------------------------------------------

describe('findUnsummarizedDays', () => {
  beforeEach(setupTmpDir);
  afterEach(teardownTmpDir);

  it('returns empty array when no entries exist', async () => {
    const result = await findUnsummarizedDays(tmpDir);
    expect(result).toEqual([]);
  });

  it('returns all entry dates when no summaries exist', async () => {
    writeEntry('2026-02-20');
    writeEntry('2026-02-21');
    writeEntry('2026-02-22');

    const result = await findUnsummarizedDays(tmpDir);
    expect(result).toEqual(['2026-02-20', '2026-02-21', '2026-02-22']);
  });

  it('excludes dates that already have summaries', async () => {
    writeEntry('2026-02-20');
    writeEntry('2026-02-21');
    writeEntry('2026-02-22');
    writeSummary('2026-02-20');

    const result = await findUnsummarizedDays(tmpDir);
    expect(result).toEqual(['2026-02-21', '2026-02-22']);
  });

  it('returns empty array when all dates are summarized', async () => {
    writeEntry('2026-02-20');
    writeEntry('2026-02-21');
    writeSummary('2026-02-20');
    writeSummary('2026-02-21');

    const result = await findUnsummarizedDays(tmpDir);
    expect(result).toEqual([]);
  });

  it('excludes today from results (today is not yet complete)', async () => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    writeEntry(todayStr);
    // Also write a past entry to verify it IS included
    writeEntry('2026-01-01');

    const result = await findUnsummarizedDays(tmpDir);
    expect(result).not.toContain(todayStr);
    expect(result).toContain('2026-01-01');
  });

  it('filters to only days before a given cutoff date', async () => {
    writeEntry('2026-02-18');
    writeEntry('2026-02-19');
    writeEntry('2026-02-20');
    writeEntry('2026-02-21');

    // Only get unsummarized days before Feb 20
    const result = await findUnsummarizedDays(tmpDir, { before: '2026-02-20' });
    expect(result).toEqual(['2026-02-18', '2026-02-19']);
  });

  it('handles mixed summarized and unsummarized with cutoff', async () => {
    writeEntry('2026-02-18');
    writeEntry('2026-02-19');
    writeEntry('2026-02-20');
    writeSummary('2026-02-18');

    const result = await findUnsummarizedDays(tmpDir, { before: '2026-02-21' });
    expect(result).toEqual(['2026-02-19', '2026-02-20']);
  });

  it('skips days with no entries (weekends, vacations)', async () => {
    // Entries on Mon, Tue, Thu — no Wed (vacation/skip)
    writeEntry('2026-02-16'); // Mon
    writeEntry('2026-02-17'); // Tue
    // No Wed entry
    writeEntry('2026-02-19'); // Thu

    const result = await findUnsummarizedDays(tmpDir);
    // Should only return days that HAVE entries, not fill gaps
    expect(result).toEqual(['2026-02-16', '2026-02-17', '2026-02-19']);
  });
});
