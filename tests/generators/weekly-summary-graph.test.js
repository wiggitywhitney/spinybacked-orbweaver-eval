// ABOUTME: Tests for weekly summary generation in summary-graph.js
// ABOUTME: Contract tests mock ChatAnthropic; unit tests cover deterministic helpers

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the LLM provider before importing the module under test.
const mockInvoke = vi.fn();
vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: class MockChatAnthropic {
    invoke(...args) {
      return mockInvoke(...args);
    }
  },
}));

import {
  generateWeeklySummary,
  weeklySummaryNode,
  formatDailySummariesForWeekly,
  cleanWeeklySummaryOutput,
  resetModel,
  WeeklySummaryState,
} from '../../src/generators/summary-graph.js';

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function _makeDailySummaries(count = 3) {
  const summaries = [];
  for (let i = 0; i < count; i++) {
    const day = String(i + 1).padStart(2, '0');
    summaries.push({
      date: `2026-03-${day}`,
      content: `# Daily Summary — 2026-03-${day}

## Narrative

The developer worked on feature ${i} today.

## Key Decisions

- Chose approach ${i} for simplicity

## Open Threads

- Need to add tests for feature ${i}`,
    });
  }
  return summaries;
}

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------

describe('formatDailySummariesForWeekly', () => {
  it('joins daily summaries with separator and adds count header', () => {
    const summaries = _makeDailySummaries(2);
    const result = formatDailySummariesForWeekly(summaries);

    expect(result).toContain('2 daily summaries');
    expect(result).toContain('Day 1 of 2: 2026-03-01');
    expect(result).toContain('Day 2 of 2: 2026-03-02');
    expect(result).toContain('feature 0');
    expect(result).toContain('feature 1');
  });

  it('handles single daily summary', () => {
    const summaries = _makeDailySummaries(1);
    const result = formatDailySummariesForWeekly(summaries);

    expect(result).toContain('1 daily summary');
    expect(result).toContain('Day 1 of 1');
  });

  it('returns empty message for no summaries', () => {
    const result = formatDailySummariesForWeekly([]);
    expect(result).toContain('No daily summaries');
  });

  it('returns empty message for null input', () => {
    const result = formatDailySummariesForWeekly(null);
    expect(result).toContain('No daily summaries');
  });
});

describe('cleanWeeklySummaryOutput', () => {
  it('returns output when it contains all three sections', () => {
    const output = `## Week in Review

The developer worked on auth all week.

## Highlights

- Shipped login flow

## Patterns

- Recurring refactoring work`;

    expect(cleanWeeklySummaryOutput(output)).toBe(output);
  });

  it('strips preamble before ## Week in Review', () => {
    const output = `Here's a summary of the week:

## Week in Review

The developer worked on auth all week.

## Highlights

- Shipped login flow

## Patterns

No notable patterns this week.`;

    const cleaned = cleanWeeklySummaryOutput(output);
    expect(cleaned).toMatch(/^## Week in Review/);
    expect(cleaned).not.toContain("Here's a summary");
  });

  it('replaces banned words', () => {
    const output = `## Week in Review

The developer implemented a comprehensive and robust solution leveraging advanced patterns.

## Highlights

No standout highlights this week.

## Patterns

No notable patterns this week.`;

    const cleaned = cleanWeeklySummaryOutput(output);
    expect(cleaned).not.toMatch(/comprehensive/i);
    expect(cleaned).not.toMatch(/robust/i);
    expect(cleaned).not.toMatch(/leveraging/i);
  });

  it('returns null/empty input as-is', () => {
    expect(cleanWeeklySummaryOutput(null)).toBeNull();
    expect(cleanWeeklySummaryOutput('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// LLM boundary (node) tests
// ---------------------------------------------------------------------------

describe('weeklySummaryNode', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    resetModel();
  });

  it('sends daily summaries to LLM and returns parsed sections', async () => {
    const llmOutput = `## Week in Review

The developer spent the week building the auth system from scratch.

## Highlights

- Shipped JWT-based authentication
- Added refresh token rotation

## Patterns

- Heavy focus on security throughout the week`;

    mockInvoke.mockResolvedValue({ content: llmOutput });

    const dailySummaries = _makeDailySummaries(3);
    const result = await weeklySummaryNode({ dailySummaries, weekLabel: '2026-W09' });

    expect(result.weekInReview).toContain('auth system');
    expect(result.highlights).toContain('JWT');
    expect(result.patterns).toContain('security');
    expect(result.errors).toEqual([]);

    // Verify LLM was called with system + human messages
    expect(mockInvoke).toHaveBeenCalledOnce();
    const [messages] = mockInvoke.mock.calls[0];
    expect(messages).toHaveLength(2);
  });

  it('returns early with message when no daily summaries provided', async () => {
    const result = await weeklySummaryNode({ dailySummaries: [], weekLabel: '2026-W09' });

    expect(result.weekInReview).toContain('No daily summaries');
    expect(result.highlights).toBe('');
    expect(result.patterns).toBe('');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('returns early for null daily summaries', async () => {
    const result = await weeklySummaryNode({ dailySummaries: null, weekLabel: '2026-W09' });

    expect(result.weekInReview).toContain('No daily summaries');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('handles LLM errors gracefully', async () => {
    mockInvoke.mockRejectedValue(new Error('API rate limited'));

    const dailySummaries = _makeDailySummaries(1);
    const result = await weeklySummaryNode({ dailySummaries, weekLabel: '2026-W09' });

    expect(result.weekInReview).toContain('failed');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('rate limited');
  });

  it('handles LLM output missing sections', async () => {
    mockInvoke.mockResolvedValue({ content: 'Just some text without proper sections' });

    const dailySummaries = _makeDailySummaries(2);
    const result = await weeklySummaryNode({ dailySummaries, weekLabel: '2026-W09' });

    // Should still return something without crashing
    expect(result).toHaveProperty('weekInReview');
    expect(result).toHaveProperty('highlights');
    expect(result).toHaveProperty('patterns');
    expect(result.errors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// End-to-end (graph execution)
// ---------------------------------------------------------------------------

describe('generateWeeklySummary', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    resetModel();
  });

  it('generates a weekly summary from daily summaries', async () => {
    const llmOutput = `## Week in Review

The developer focused on the summary pipeline all week.

## Highlights

- Daily summary generation working end to end
- Gap detection handles weekends correctly

## Patterns

- Incremental TDD approach — each feature built on the last`;

    mockInvoke.mockResolvedValue({ content: llmOutput });

    const dailySummaries = _makeDailySummaries(4);
    const result = await generateWeeklySummary(dailySummaries, '2026-W09');

    expect(result.weekInReview).toContain('summary pipeline');
    expect(result.highlights).toContain('Gap detection');
    expect(result.patterns).toContain('TDD');
    expect(result.errors).toEqual([]);
    expect(result.generatedAt).toBeInstanceOf(Date);
  });
});
