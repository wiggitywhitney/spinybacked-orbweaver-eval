// ABOUTME: Auto-trigger logic for daily summaries after journal entry creation
// ABOUTME: Detects unsummarized past days and generates summaries with progress reporting

import { findUnsummarizedDays } from '../utils/summary-detector.js';
import { generateAndSaveDailySummary } from './summary-manager.js';

/**
 * Trigger automatic daily summary generation for all unsummarized past days.
 * Generates summaries sequentially to avoid overwhelming the LLM API.
 * Continues past failures to maximize coverage.
 *
 * @param {string} basePath - Base path for journal (default: current directory)
 * @param {{ onProgress?: (msg: string) => void }} options - Options
 * @returns {Promise<{ generated: string[], skipped: string[], failed: string[], errors: string[] }>}
 */
export async function triggerAutoSummaries(basePath = '.', options = {}) {
  const { onProgress } = options;

  const unsummarizedDays = await findUnsummarizedDays(basePath);

  const result = {
    generated: [],
    skipped: [],
    failed: [],
    errors: [],
  };

  for (const dateStr of unsummarizedDays) {
    const date = new Date(
      parseInt(dateStr.slice(0, 4)),
      parseInt(dateStr.slice(5, 7)) - 1,
      parseInt(dateStr.slice(8, 10)),
    );

    try {
      const summaryResult = await generateAndSaveDailySummary(date, basePath);

      if (summaryResult.saved) {
        result.generated.push(summaryResult.path);
        if (onProgress) {
          onProgress(`Generated daily summary for ${dateStr}`);
        }

        // Track errors from generation (partial issues like LLM timeouts)
        if (summaryResult.errors && summaryResult.errors.length > 0) {
          for (const err of summaryResult.errors) {
            result.errors.push(`${dateStr}: ${err}`);
          }
        }
      } else {
        result.skipped.push(dateStr);
      }
    } catch (err) {
      result.failed.push(dateStr);
      result.errors.push(`${dateStr}: ${err.message}`);
      if (onProgress) {
        onProgress(`Failed to generate summary for ${dateStr}: ${err.message}`);
      }
    }
  }

  return result;
}
