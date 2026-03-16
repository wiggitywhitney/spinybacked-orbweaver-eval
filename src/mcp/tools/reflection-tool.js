/**
 * Reflection Tool
 *
 * Captures timestamped human insights and reflections during development.
 * Writes to journal/reflections/YYYY-MM/YYYY-MM-DD.md
 */

import { trace, SpanStatusCode } from '@opentelemetry/api';
import { z } from 'zod';
import { mkdir, appendFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/** Separator bar for entries */
const SEPARATOR = '═══════════════════════════════════════';

const tracer = trace.getTracer('unknown_service');

/**
 * Get the reflections file path for a date
 * @param {Date} date
 * @returns {string}
 */
function getReflectionsPath(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return join('journal', 'reflections', `${year}-${month}`, `${year}-${month}-${day}.md`);
}

/**
 * Format a timestamp for display
 * @param {Date} date
 * @returns {string}
 */
function formatTimestamp(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
}

/**
 * Format a reflection entry
 * @param {string} text - The reflection content
 * @param {Date} date - The timestamp
 * @returns {string}
 */
function formatReflectionEntry(text, date) {
  const timestamp = formatTimestamp(date);
  return `## ${timestamp}

${text}

${SEPARATOR}

`;
}

/**
 * Save a reflection to the daily file
 * @param {string} text - The reflection content
 * @returns {Promise<string>} - The path where the reflection was saved
 */
async function saveReflection(text) {
  return tracer.startActiveSpan('commit_story.journal.save_reflection', async (span) => {
    try {
      const now = new Date();
      const filePath = getReflectionsPath(now);

      // Ensure directory exists
      await mkdir(dirname(filePath), { recursive: true });

      // Format and append the entry
      const entry = formatReflectionEntry(text, now);
      await appendFile(filePath, entry, 'utf-8');

      span.setAttribute('commit_story.journal.file_path', filePath);
      return filePath;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Register the reflection tool with the MCP server
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerReflectionTool(server) {
  server.tool(
    'journal_add_reflection',
    'Add a timestamped reflection to the development journal. IMPORTANT: Pass the reflection text exactly as provided by the user, verbatim, without any AI interpretation, elaboration, or additions.',
    {
      text: z.string().describe('The reflection text, verbatim from the user'),
    },
    async ({ text }) => {
      return tracer.startActiveSpan('mcp.tool.journal_add_reflection', async (span) => {
        try {
          const savedPath = await saveReflection(text);
          span.setAttribute('commit_story.journal.file_path', savedPath);
          return {
            content: [
              {
                type: 'text',
                text: `Reflection saved to ${savedPath}`,
              },
            ],
          };
        } catch (error) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          return {
            content: [
              {
                type: 'text',
                text: `Error saving reflection: ${error.message}`,
              },
            ],
          };
        } finally {
          span.end();
        }
      });
    }
  );
}
