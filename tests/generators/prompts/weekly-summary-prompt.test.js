// ABOUTME: Tests for weekly-summary-prompt.js — validates prompt template generation
// ABOUTME: Verifies scope guidance, section headers, banned words, and voice instructions

import { describe, it, expect } from 'vitest';
import { weeklySummaryPrompt } from '../../../src/generators/prompts/sections/weekly-summary-prompt.js';

describe('weeklySummaryPrompt', () => {
  it('returns a string prompt for multiple days', () => {
    const prompt = weeklySummaryPrompt(5);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);
  });

  it('includes scope guidance for single day', () => {
    const prompt = weeklySummaryPrompt(1);
    expect(prompt).toContain('only 1 daily summary');
    expect(prompt).toContain('do not inflate');
  });

  it('includes scope guidance for multiple days', () => {
    const prompt = weeklySummaryPrompt(4);
    expect(prompt).toContain('4 daily summaries');
    expect(prompt).toContain('arc of the week');
  });

  it('specifies the three weekly section headers', () => {
    const prompt = weeklySummaryPrompt(3);
    expect(prompt).toContain('## Week in Review');
    expect(prompt).toContain('## Highlights');
    expect(prompt).toContain('## Patterns');
  });

  it('includes banned words list', () => {
    const prompt = weeklySummaryPrompt(3);
    expect(prompt).toContain('BANNED WORDS');
    expect(prompt).toContain('comprehensive');
    expect(prompt).toContain('robust');
  });

  it('includes voice and tone guidelines', () => {
    const prompt = weeklySummaryPrompt(3);
    expect(prompt).toContain('contractions');
    expect(prompt).toContain('the developer');
    expect(prompt).toContain('third person');
  });

  it('instructs against day-by-day recaps', () => {
    const prompt = weeklySummaryPrompt(3);
    expect(prompt).toContain('On Monday');
    expect(prompt).toContain('Do NOT');
  });

  it('includes verification step', () => {
    const prompt = weeklySummaryPrompt(3);
    expect(prompt).toContain('verify');
    expect(prompt).toContain('traces back');
  });
});
