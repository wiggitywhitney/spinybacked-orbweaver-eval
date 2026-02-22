/**
 * Tests for prompt modules — guidelines and section prompts
 *
 * Verifies prompt structure, conditional branching, and content integrity.
 * These are deterministic string functions — no mocks needed.
 */

import { describe, it, expect } from 'vitest';
import { summaryPrompt } from '../../src/generators/prompts/sections/summary-prompt.js';
import { dialoguePrompt } from '../../src/generators/prompts/sections/dialogue-prompt.js';
import { technicalDecisionsPrompt } from '../../src/generators/prompts/sections/technical-decisions-prompt.js';
import {
  getAllGuidelines,
  antiHallucinationGuidelines,
  accessibilityGuidelines,
} from '../../src/generators/prompts/guidelines/index.js';

// ===========================================================================
// Summary prompt — conditional branching for 4 scenarios
// ===========================================================================

describe('summaryPrompt', () => {
  it('includes code analysis and chat context for code+chat scenario', () => {
    const prompt = summaryPrompt(true, true);
    expect(prompt).toContain('Step 1');
    expect(prompt).toContain('Step 2: Find the Why');
    expect(prompt).toContain('Step 3: Write the Summary');
    expect(prompt).toContain('Step 4');
    expect(prompt).toContain('not documentation files');
    expect(prompt).toContain('mentor');
  });

  it('skips Step 2 and uses code-only instructions for code-without-chat', () => {
    const prompt = summaryPrompt(true, false);
    expect(prompt).toContain('Step 2: Skip');
    expect(prompt).toContain('Keep it brief and factual');
    expect(prompt).not.toContain('Find the Why');
  });

  it('uses discussion-focused instructions for chat-without-code', () => {
    const prompt = summaryPrompt(false, true);
    expect(prompt).toContain('Step 2: Find What Was Discussed');
    expect(prompt).toContain('mentor');
    expect(prompt).not.toContain('not documentation files');
  });

  it('uses minimal instructions for no-code-no-chat scenario', () => {
    const prompt = summaryPrompt(false, false);
    expect(prompt).toContain('Step 2: Skip');
    expect(prompt).toContain('routine documentation update');
    expect(prompt).not.toContain('mentor');
  });

  it('always includes banned words list', () => {
    const scenarios = [
      [true, true],
      [true, false],
      [false, true],
      [false, false],
    ];
    for (const [code, chat] of scenarios) {
      const prompt = summaryPrompt(code, chat);
      expect(prompt).toContain('BANNED WORDS');
      expect(prompt).toContain('comprehensive');
    }
  });
});

// ===========================================================================
// Dialogue prompt — static template with placeholder
// ===========================================================================

describe('dialoguePrompt', () => {
  it('contains {maxQuotes} placeholder', () => {
    expect(dialoguePrompt).toContain('{maxQuotes}');
  });

  it('contains all 8 steps', () => {
    for (let i = 1; i <= 8; i++) {
      expect(dialoguePrompt).toContain(`Step ${i}`);
    }
  });

  it('specifies journalist role', () => {
    expect(dialoguePrompt).toContain('journalist');
  });

  it('specifies Human/Assistant format', () => {
    expect(dialoguePrompt).toContain('**Human:**');
    expect(dialoguePrompt).toContain('**Assistant:**');
  });
});

// ===========================================================================
// Technical decisions prompt — static template
// ===========================================================================

describe('technicalDecisionsPrompt', () => {
  it('contains all 5 steps', () => {
    for (let i = 1; i <= 5; i++) {
      expect(technicalDecisionsPrompt).toContain(`Step ${i}`);
    }
  });

  it('specifies IMPLEMENTED and DISCUSSED classification', () => {
    expect(technicalDecisionsPrompt).toContain('IMPLEMENTED');
    expect(technicalDecisionsPrompt).toContain('DISCUSSED');
  });

  it('specifies Code Archivist role', () => {
    expect(technicalDecisionsPrompt).toContain('Code Archivist');
  });

  it('specifies DECISION output format', () => {
    expect(technicalDecisionsPrompt).toContain('**DECISION:');
  });
});

// ===========================================================================
// Guidelines
// ===========================================================================

describe('getAllGuidelines', () => {
  it('includes context framing guideline', () => {
    const guidelines = getAllGuidelines();
    expect(guidelines).toContain('CRITICAL CONTEXT FRAMING');
    expect(guidelines).toContain('HISTORICAL RECORDS');
  });

  it('includes anti-hallucination guidelines', () => {
    const guidelines = getAllGuidelines();
    expect(guidelines).toContain(antiHallucinationGuidelines);
  });

  it('includes accessibility guidelines', () => {
    const guidelines = getAllGuidelines();
    expect(guidelines).toContain(accessibilityGuidelines);
  });
});

describe('antiHallucinationGuidelines', () => {
  it('warns against quoting assistant messages as human speech', () => {
    expect(antiHallucinationGuidelines).toContain('assistant');
  });
});

describe('accessibilityGuidelines', () => {
  it('mentions external readers', () => {
    expect(accessibilityGuidelines).toContain('external');
  });
});
