/**
 * Journal Graph - LangGraph StateGraph for journal generation
 *
 * Orchestrates AI generation of journal sections:
 * - Summary: Narrative overview of the commit
 * - Dialogue: Key quotes from human/assistant conversation
 * - Technical Decisions: Architecture and implementation decisions
 *
 * Graph structure:
 * START → [summary, technical] (parallel) → dialogue → END
 */

import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { ChatAnthropic } from '@langchain/anthropic';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { getAllGuidelines } from './prompts/guidelines/index.js';
import { summaryPrompt } from './prompts/sections/summary-prompt.js';
import { dialoguePrompt } from './prompts/sections/dialogue-prompt.js';
import { technicalDecisionsPrompt } from './prompts/sections/technical-decisions-prompt.js';

/**
 * Journal state definition using LangGraph Annotation API
 * Errors use a reducer to accumulate from parallel nodes
 */
export const JournalState = Annotation.Root({
  // Input
  context: Annotation(),

  // Outputs (populated by nodes)
  summary: Annotation(),
  dialogue: Annotation(),
  technicalDecisions: Annotation(),

  // Metadata
  errors: Annotation({
    reducer: (left, right) => [...(left || []), ...(right || [])],
    default: () => [],
  }),
});

/**
 * Per-node temperature settings matching v1 behavior:
 * - Summary (narrative): 0.7 for casual, natural tone
 * - Dialogue (quote selection): 0.7 for natural selection
 * - Technical decisions (factual): 0.1 for consistent extraction
 */
const NODE_TEMPERATURES = {
  summary: 0.7,
  dialogue: 0.7,
  technical: 0.1,
};

/**
 * Cache of model instances keyed by temperature
 * Avoids recreating models for the same temperature
 */
const models = new Map();

/**
 * Get or create a Claude model instance for a given temperature
 * @param {number} temperature - Temperature setting for the model
 * @returns {ChatAnthropic} Model instance
 */
export function getModel(temperature = 0) {
  if (!models.has(temperature)) {
    models.set(
      temperature,
      new ChatAnthropic({
        model: 'claude-3-5-haiku-latest',
        maxTokens: 2048,
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
 * Analyze commit diff to categorize changed files
 * Returns lists of documentation files vs functional code files
 * @param {string} diff - Git diff content
 * @returns {object} Analysis result with file categorizations
 */
function analyzeCommitContent(diff) {
  if (!diff) {
    return {
      changedFiles: [],
      docFiles: [],
      functionalFiles: [],
      hasFunctionalCode: false,
      hasOnlyDocs: false,
    };
  }

  // Extract file paths from diff headers (e.g., "+++ b/src/index.js")
  const fileHeaderPattern = /^[+-]{3} [ab]\/(.+)$/gm;
  const matches = [...diff.matchAll(fileHeaderPattern)];
  const allFiles = [...new Set(matches.map((m) => m[1]))];

  // Filter out journal entries (prevent recursive pollution)
  const changedFiles = allFiles.filter((f) => !f.startsWith('journal/entries/'));

  // Documentation file patterns
  const isDocFile = (file) => {
    const docPatterns = [
      /\.md$/i,
      /\.txt$/i,
      /README/i,
      /CHANGELOG/i,
      /LICENSE/i,
      /\.ya?ml$/i,
      /\.json$/i,
      /\.toml$/i,
      /\.ini$/i,
      /\.env/i,
      /\.gitignore$/i,
    ];
    return docPatterns.some((pattern) => pattern.test(file));
  };

  const docFiles = changedFiles.filter(isDocFile);
  const functionalFiles = changedFiles.filter((f) => !isDocFile(f));

  return {
    changedFiles,
    docFiles,
    functionalFiles,
    hasFunctionalCode: functionalFiles.length > 0,
    hasOnlyDocs: docFiles.length > 0 && functionalFiles.length === 0,
  };
}

/**
 * Legacy wrapper for hasFunctionalCode checks
 * @param {string} diff - Git diff content
 * @returns {boolean} Whether the diff contains functional code changes
 */
function hasFunctionalCode(diff) {
  return analyzeCommitContent(diff).hasFunctionalCode;
}

/**
 * Generate dynamic implementation guidance based on diff analysis
 * Tells the AI exactly which files changed and how to classify decisions
 * @param {object} analysis - Result from analyzeCommitContent
 * @returns {string} Implementation guidance to append to prompt
 */
function generateImplementationGuidance(analysis) {
  const { functionalFiles, docFiles, hasOnlyDocs } = analysis;

  if (hasOnlyDocs) {
    return `
IMPLEMENTATION GUIDANCE:
This commit contains ONLY documentation changes: ${docFiles.join(', ')}
- All decisions should be marked as "Discussed" since no functional code was changed
- Focus on the reasoning behind documentation updates`;
  }

  if (functionalFiles.length > 0) {
    return `
IMPLEMENTATION GUIDANCE:
Changed functional files: ${functionalFiles.join(', ')}
${docFiles.length > 0 ? `Changed documentation files: ${docFiles.join(', ')}` : ''}

IMPLEMENTED vs DISCUSSED classification:
- "Implemented" = Decision resulted in changes to: ${functionalFiles.join(', ')}
- "Discussed" = Decision was talked about but no related code changes in this commit

INSTRUCTION: Mark a decision as "Implemented" ONLY if it directly relates to changes in: ${functionalFiles.join(', ')}`;
  }

  return '';
}

/**
 * Format chat messages for prompt inclusion
 * Uses JSON format for clear type identification
 * @param {object[]} messages - Filtered chat messages
 * @returns {string} Formatted messages
 */
function formatChatMessages(messages) {
  if (!messages || messages.length === 0) {
    return '*No conversation captured for this time window*';
  }

  return messages
    .map((msg) => {
      const type = msg.type === 'user' ? 'user' : 'assistant';
      const date = msg.timestamp ? new Date(msg.timestamp) : null;
      const time = date && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString() : '';
      return `{"type":"${type}", "time":"${time}", "content":"${escapeForJson(msg.content)}"}`;
    })
    .join('\n\n');
}

/**
 * Escape content for JSON string inclusion
 * @param {string} content - Content to escape
 * @returns {string} Escaped content
 */
function escapeForJson(content) {
  if (!content) return '';
  return content
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Format context for summary generation (filters out assistant messages)
 * V1 approach: Summary is about what THE DEVELOPER did, so we only need user messages
 */
function formatContextForSummary(context) {
  const userOnlyMessages = (context.chat.messages || []).filter((m) => m.type === 'user');

  return `Generate a summary for this development session:

DATA SCHEMA:
- commit: The git commit that was made (hash, author, message, diff)
- chat_messages: Developer input during the session (type:"user" messages only)
  Note: Assistant responses have been filtered out - focus on what THE DEVELOPER did

COMMIT DATA:
${JSON.stringify(
  {
    hash: context.commit.shortHash,
    author: context.commit.author,
    message: context.commit.message,
    diff: context.commit.diff || 'No diff available',
  },
  null,
  2
)}

DEVELOPER MESSAGES (type:"user" only):
${JSON.stringify(userOnlyMessages.map((m) => ({ type: m.type, content: m.content })), null, 2)}`;
}

/**
 * Format context for dialogue/technical extraction (needs full chat)
 */
function formatContextForUser(context, options = {}) {
  const { includeSummary } = options;

  let userContent = `## Commit Information
**Hash**: ${context.commit.shortHash}
**Author**: ${context.commit.author}
**Message**: ${context.commit.message}

## Code Changes
\`\`\`diff
${context.commit.diff || 'No diff available'}
\`\`\`

## Development Conversation
DATA SCHEMA: type:"user" = developer input, type:"assistant" = AI responses
${formatChatMessages(context.chat.messages)}`;

  if (includeSummary) {
    userContent = `## Session Summary
${options.summary}

${userContent}`;
  }

  return userContent;
}

/**
 * Summary generation node
 * Creates a narrative overview of the commit
 */
async function summaryNode(state) {
  try {
    const { context } = state;
    const guidelines = getAllGuidelines();
    const hasFunctional = hasFunctionalCode(context.commit.diff);
    // Use pre-computed stats from message filter instead of re-iterating
    const hasChat = (context.metadata?.filterStats?.substantialUserMessages ?? 0) >= 2;
    const sectionPrompt = summaryPrompt(hasFunctional, hasChat);

    const systemContent = `${guidelines}

${sectionPrompt}`;

    const userContent = formatContextForSummary(context);

    const result = await getModel(NODE_TEMPERATURES.summary).invoke([
      new SystemMessage(systemContent),
      new HumanMessage(userContent),
    ]);

    return { summary: result.content };
  } catch (error) {
    return {
      summary: '[Summary generation failed]',
      errors: [`Summary generation failed: ${error.message}`],
    };
  }
}

/**
 * Technical decisions extraction node
 * Identifies architecture and implementation decisions
 * Returns free-form markdown (v1 approach - prompts enforce format)
 */
async function technicalNode(state) {
  try {
    const { context } = state;
    const guidelines = getAllGuidelines();

    // Analyze diff to generate dynamic implementation guidance
    const diffAnalysis = analyzeCommitContent(context.commit.diff);
    const implementationGuidance = generateImplementationGuidance(diffAnalysis);

    const systemContent = `${guidelines}

${technicalDecisionsPrompt}
${implementationGuidance}`;

    const userContent = formatContextForUser(context);

    const result = await getModel(NODE_TEMPERATURES.technical).invoke([
      new SystemMessage(systemContent),
      new HumanMessage(userContent),
    ]);

    return { technicalDecisions: result.content.trim() };
  } catch (error) {
    return {
      technicalDecisions: '[Technical decisions extraction failed]',
      errors: [`Technical decisions extraction failed: ${error.message}`],
    };
  }
}

/**
 * Dialogue extraction node
 * Extracts key quotes from human/assistant conversation
 * Runs after summary to avoid redundancy
 * Returns free-form markdown (v1 approach - prompts enforce format)
 */
async function dialogueNode(state) {
  try {
    const { context, summary } = state;
    const guidelines = getAllGuidelines();
    const maxQuotes = 4;

    // Replace {maxQuotes} placeholder in prompt
    const sectionPrompt = dialoguePrompt.replace(/{maxQuotes}/g, String(maxQuotes));

    const systemContent = `${guidelines}

The summary of this development session is:
${summary}

${sectionPrompt}`;

    const userContent = formatContextForUser(context, { includeSummary: false });

    const result = await getModel(NODE_TEMPERATURES.dialogue).invoke([
      new SystemMessage(systemContent),
      new HumanMessage(userContent),
    ]);

    return { dialogue: result.content.trim() };
  } catch (error) {
    return {
      dialogue: '[Dialogue extraction failed]',
      errors: [`Dialogue extraction failed: ${error.message}`],
    };
  }
}

/**
 * Build and compile the journal generation graph
 * @returns {CompiledStateGraph} Compiled graph ready for execution
 */
function buildGraph() {
  // Node names use "generate_" prefix to avoid conflict with state attribute names
  const graph = new StateGraph(JournalState)
    .addNode('generate_summary', summaryNode)
    .addNode('generate_technical', technicalNode)
    .addNode('generate_dialogue', dialogueNode)
    // Parallel execution: summary and technical run simultaneously
    .addEdge(START, 'generate_summary')
    .addEdge(START, 'generate_technical')
    // Dialogue waits for both summary and technical to complete
    .addEdge('generate_summary', 'generate_dialogue')
    .addEdge('generate_technical', 'generate_dialogue')
    // End after dialogue
    .addEdge('generate_dialogue', END);

  return graph.compile();
}

// Compiled graph instance
let compiledGraph;

/**
 * Get or create the compiled graph
 * @returns {CompiledStateGraph} Compiled graph
 */
function getGraph() {
  if (!compiledGraph) {
    compiledGraph = buildGraph();
  }
  return compiledGraph;
}

/**
 * Generate all journal sections from context
 * @param {Context} context - Gathered context from integrator
 * @returns {Promise<JournalSections>} Generated journal sections
 */
export async function generateJournalSections(context) {
  const graph = getGraph();

  const result = await graph.invoke({ context });

  return {
    summary: result.summary || '',
    dialogue: result.dialogue || '',
    technicalDecisions: result.technicalDecisions || '',
    errors: result.errors || [],
    generatedAt: new Date(),
  };
}

// Export node functions for testing
export {
  summaryNode,
  technicalNode,
  dialogueNode,
  formatChatMessages,
  formatContextForUser,
  formatContextForSummary,
  buildGraph,
  hasFunctionalCode,
  analyzeCommitContent,
  generateImplementationGuidance,
  NODE_TEMPERATURES,
};
