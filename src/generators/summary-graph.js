// ABOUTME: LangGraph StateGraphs for summary generation (daily and weekly, separate from per-commit journal-graph)
// ABOUTME: Daily: consolidates journal entries into Narrative, Key Decisions, Open Threads
// ABOUTME: Weekly: consolidates daily summaries into Week in Review, Highlights, Patterns

import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { ChatAnthropic } from '@langchain/anthropic';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { dailySummaryPrompt } from './prompts/sections/daily-summary-prompt.js';
import { weeklySummaryPrompt } from './prompts/sections/weekly-summary-prompt.js';

/**
 * Summary state definition using LangGraph Annotation API.
 * Input: entries (array of rendered markdown strings) and date.
 * Output: parsed sections from the LLM response.
 */
export const SummaryState = Annotation.Root({
  // Input
  entries: Annotation(),
  date: Annotation(),

  // Outputs (populated by node)
  narrative: Annotation(),
  keyDecisions: Annotation(),
  openThreads: Annotation(),

  // Metadata
  errors: Annotation({
    reducer: (left, right) => [...(left || []), ...(right || [])],
    default: () => [],
  }),
});

/**
 * Cache of model instances keyed by temperature.
 * Separate from journal-graph's cache to keep the two graphs independent.
 */
const models = new Map();

/**
 * Get or create a Claude model instance for a given temperature
 * @param {number} temperature - Temperature setting
 * @returns {ChatAnthropic} Model instance
 */
export function getModel(temperature = 0.7) {
  if (!models.has(temperature)) {
    models.set(
      temperature,
      new ChatAnthropic({
        model: 'claude-haiku-4-5-20251001',
        maxTokens: 4096,
        temperature,
      })
    );
  }
  return models.get(temperature);
}

/**
 * Reset all model instances (for testing)
 */
export function resetModel() {
  models.clear();
}

/**
 * Format journal entries for LLM consumption.
 * Numbers each entry and provides context about the day.
 * @param {string[]} entries - Rendered markdown journal entries
 * @returns {string} Formatted entries for the human message
 */
export function formatEntriesForSummary(entries) {
  if (!entries || entries.length === 0) {
    return 'No journal entries found for this date.';
  }

  const count = entries.length;
  const header = count === 1
    ? `The following is 1 journal entry from this day:`
    : `The following are ${count} journal entries from this day:`;

  const numbered = entries.map((entry, i) =>
    `--- Entry ${i + 1} of ${count} ---\n\n${entry}`
  ).join('\n\n');

  return `${header}\n\n${numbered}`;
}

/**
 * Parse the LLM's response into the three summary sections.
 * Extracts content between ## Narrative, ## Key Decisions, ## Open Threads headers.
 * @param {string} raw - Raw LLM output
 * @returns {{ narrative: string, keyDecisions: string, openThreads: string }}
 */
function parseSummarySections(raw) {
  const sections = { narrative: '', keyDecisions: '', openThreads: '' };
  if (!raw) return sections;

  // Split by ## headers and capture header names
  const sectionPattern = /^## (Narrative|Key Decisions|Open Threads)\s*$/gm;
  const matches = [...raw.matchAll(sectionPattern)];

  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1];
    const startIdx = matches[i].index + matches[i][0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    const content = raw.slice(startIdx, endIdx).trim();

    if (name === 'Narrative') sections.narrative = content;
    else if (name === 'Key Decisions') sections.keyDecisions = content;
    else if (name === 'Open Threads') sections.openThreads = content;
  }

  // If no sections were parsed, put everything in narrative
  if (!sections.narrative && !sections.keyDecisions && !sections.openThreads) {
    sections.narrative = raw.trim();
  }

  return sections;
}

/**
 * Post-processing: clean daily summary output.
 * Strips preamble and replaces banned formal words.
 * Reuses the same banned word list as journal-graph.
 */
const BANNED_WORD_REPLACEMENTS = [
  [/\bcomprehensiv(e|ely)\b/gi, (_, suffix) => suffix === 'ely' ? 'thoroughly' : 'detailed'],
  [/\brobust\b/gi, 'solid'],
  [/\bsignificant\b/gi, 'important'],
  [/\bsystematic(ally)?\b/gi, (_, suffix) => suffix ? 'carefully' : 'structured'],
  [/\bmeticulous(ly)?\b/gi, (_, suffix) => suffix ? 'carefully' : 'careful'],
  [/\bmethodical(ly)?\b/gi, (_, suffix) => suffix ? 'carefully' : 'careful'],
  [/\ba sophisticated\b/gi, 'an advanced'],
  [/\bsophisticated\b/gi, 'advanced'],
  [/\bleverag(e[ds]?|ing)\b/gi, (_, suffix) => suffix === 'ing' ? 'using' : 'used'],
  [/\benhance[ds]?\b/gi, 'improved'],
  [/\benhancing\b/gi, 'improving'],
  [/\benhancements?\b/gi, (match) => match.endsWith('s') ? 'improvements' : 'improvement'],
  [/\butiliz(e[ds]?|ing|ation)\b/gi, (_, suffix) => {
    if (suffix === 'ing') return 'using';
    if (suffix === 'ation') return 'use';
    return 'used';
  }],
];

export function cleanDailySummaryOutput(raw) {
  if (!raw) return raw;

  let result = raw;

  // Replace banned words
  for (const [pattern, replacement] of BANNED_WORD_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  // Strip preamble before ## Narrative
  const narrativeIdx = result.indexOf('## Narrative');
  if (narrativeIdx > 0) {
    result = result.slice(narrativeIdx);
  }

  return result.trim() || raw;
}

/**
 * Daily summary generation node.
 * Reads journal entries and produces a consolidated daily summary.
 */
export async function dailySummaryNode(state) {
  const { entries, date } = state;

  // Early exit: no entries to summarize
  if (!entries || entries.length === 0) {
    return {
      narrative: 'No journal entries found for this date.',
      keyDecisions: '',
      openThreads: '',
      errors: [],
    };
  }

  try {
    const prompt = dailySummaryPrompt(entries.length);
    const formattedEntries = formatEntriesForSummary(entries);

    const result = await getModel(0.7).invoke([
      new SystemMessage(prompt),
      new HumanMessage(formattedEntries),
    ]);

    const cleaned = cleanDailySummaryOutput(result.content);
    const sections = parseSummarySections(cleaned);

    return {
      narrative: sections.narrative,
      keyDecisions: sections.keyDecisions,
      openThreads: sections.openThreads,
      errors: [],
    };
  } catch (error) {
    return {
      narrative: '[Daily summary generation failed]',
      keyDecisions: '',
      openThreads: '',
      errors: [`Daily summary generation failed: ${error.message}`],
    };
  }
}

/**
 * Build and compile the daily summary graph.
 * Simple single-node pipeline: START → generate_daily_summary → END
 */
function buildGraph() {
  const graph = new StateGraph(SummaryState)
    .addNode('generate_daily_summary', dailySummaryNode)
    .addEdge(START, 'generate_daily_summary')
    .addEdge('generate_daily_summary', END);

  return graph.compile();
}

let compiledGraph;

function getGraph() {
  if (!compiledGraph) {
    compiledGraph = buildGraph();
  }
  return compiledGraph;
}

/**
 * Generate a daily summary from journal entries.
 * @param {string[]} entries - Rendered markdown journal entries for the day
 * @param {string} date - Date string (YYYY-MM-DD) for context
 * @returns {Promise<{ narrative: string, keyDecisions: string, openThreads: string, errors: string[], generatedAt: Date }>}
 */
export async function generateDailySummary(entries, date) {
  const graph = getGraph();
  const result = await graph.invoke({ entries, date });

  return {
    narrative: result.narrative || '',
    keyDecisions: result.keyDecisions || '',
    openThreads: result.openThreads || '',
    errors: result.errors || [],
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Weekly summary generation
// ---------------------------------------------------------------------------

/**
 * Weekly summary state definition.
 * Input: dailySummaries (array of rendered daily summary markdown) and weekLabel.
 * Output: parsed sections from the LLM response.
 */
export const WeeklySummaryState = Annotation.Root({
  // Input
  dailySummaries: Annotation(),
  weekLabel: Annotation(),

  // Outputs (populated by node)
  weekInReview: Annotation(),
  highlights: Annotation(),
  patterns: Annotation(),

  // Metadata
  errors: Annotation({
    reducer: (left, right) => [...(left || []), ...(right || [])],
    default: () => [],
  }),
});

/**
 * Format daily summaries for LLM consumption.
 * Labels each by date and provides context about the week.
 * @param {Array<{ date: string, content: string }>} dailySummaries - Daily summaries with dates
 * @returns {string} Formatted summaries for the human message
 */
export function formatDailySummariesForWeekly(dailySummaries) {
  if (!dailySummaries || dailySummaries.length === 0) {
    return 'No daily summaries found for this week.';
  }

  const count = dailySummaries.length;
  const header = count === 1
    ? `The following is 1 daily summary from this week:`
    : `The following are ${count} daily summaries from this week:`;

  const formatted = dailySummaries.map((summary, i) =>
    `--- Day ${i + 1} of ${count}: ${summary.date} ---\n\n${summary.content}`
  ).join('\n\n');

  return `${header}\n\n${formatted}`;
}

/**
 * Parse the LLM's response into the three weekly summary sections.
 * Extracts content between ## Week in Review, ## Highlights, ## Patterns headers.
 * @param {string} raw - Raw LLM output
 * @returns {{ weekInReview: string, highlights: string, patterns: string }}
 */
function parseWeeklySummarySections(raw) {
  const sections = { weekInReview: '', highlights: '', patterns: '' };
  if (!raw) return sections;

  const sectionPattern = /^## (Week in Review|Highlights|Patterns)\s*$/gm;
  const matches = [...raw.matchAll(sectionPattern)];

  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1];
    const startIdx = matches[i].index + matches[i][0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    const content = raw.slice(startIdx, endIdx).trim();

    if (name === 'Week in Review') sections.weekInReview = content;
    else if (name === 'Highlights') sections.highlights = content;
    else if (name === 'Patterns') sections.patterns = content;
  }

  // If no sections were parsed, put everything in weekInReview
  if (!sections.weekInReview && !sections.highlights && !sections.patterns) {
    sections.weekInReview = raw.trim();
  }

  return sections;
}

/**
 * Post-processing: clean weekly summary output.
 * Strips preamble and replaces banned formal words.
 */
export function cleanWeeklySummaryOutput(raw) {
  if (!raw) return raw;

  let result = raw;

  // Replace banned words (same list as daily)
  for (const [pattern, replacement] of BANNED_WORD_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  // Strip preamble before ## Week in Review
  const reviewIdx = result.indexOf('## Week in Review');
  if (reviewIdx > 0) {
    result = result.slice(reviewIdx);
  }

  return result.trim() || raw;
}

/**
 * Weekly summary generation node.
 * Reads daily summaries and produces a consolidated weekly summary.
 */
export async function weeklySummaryNode(state) {
  const { dailySummaries, weekLabel } = state;

  // Early exit: no daily summaries to consolidate
  if (!dailySummaries || dailySummaries.length === 0) {
    return {
      weekInReview: 'No daily summaries found for this week.',
      highlights: '',
      patterns: '',
      errors: [],
    };
  }

  try {
    const prompt = weeklySummaryPrompt(dailySummaries.length);
    const formattedSummaries = formatDailySummariesForWeekly(dailySummaries);

    const result = await getModel(0.7).invoke([
      new SystemMessage(prompt),
      new HumanMessage(formattedSummaries),
    ]);

    const cleaned = cleanWeeklySummaryOutput(result.content);
    const sections = parseWeeklySummarySections(cleaned);

    return {
      weekInReview: sections.weekInReview,
      highlights: sections.highlights,
      patterns: sections.patterns,
      errors: [],
    };
  } catch (error) {
    return {
      weekInReview: '[Weekly summary generation failed]',
      highlights: '',
      patterns: '',
      errors: [`Weekly summary generation failed: ${error.message}`],
    };
  }
}

/**
 * Build and compile the weekly summary graph.
 * Simple single-node pipeline: START → generate_weekly_summary → END
 */
function buildWeeklyGraph() {
  const graph = new StateGraph(WeeklySummaryState)
    .addNode('generate_weekly_summary', weeklySummaryNode)
    .addEdge(START, 'generate_weekly_summary')
    .addEdge('generate_weekly_summary', END);

  return graph.compile();
}

let compiledWeeklyGraph;

function getWeeklyGraph() {
  if (!compiledWeeklyGraph) {
    compiledWeeklyGraph = buildWeeklyGraph();
  }
  return compiledWeeklyGraph;
}

/**
 * Generate a weekly summary from daily summaries.
 * @param {Array<{ date: string, content: string }>} dailySummaries - Daily summaries with dates
 * @param {string} weekLabel - ISO week string (e.g., "2026-W09") for context
 * @returns {Promise<{ weekInReview: string, highlights: string, patterns: string, errors: string[], generatedAt: Date }>}
 */
export async function generateWeeklySummary(dailySummaries, weekLabel) {
  const graph = getWeeklyGraph();
  const result = await graph.invoke({ dailySummaries, weekLabel });

  return {
    weekInReview: result.weekInReview || '',
    highlights: result.highlights || '',
    patterns: result.patterns || '',
    errors: result.errors || [],
    generatedAt: new Date(),
  };
}
