// ABOUTME: Detects journal days that have entries but no daily summary
// ABOUTME: Scans entries and summaries directories to find gaps for auto-trigger

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Get all dates that have journal entry files.
 * Scans all YYYY-MM subdirectories under journal/entries/ for YYYY-MM-DD.md files.
 * @param {string} basePath - Base path for journal (default: current directory)
 * @returns {Promise<string[]>} Sorted array of date strings (YYYY-MM-DD)
 */
export async function getDaysWithEntries(basePath = '.') {
  const entriesDir = join(basePath, 'journal', 'entries');
  const datePattern = /^\d{4}-\d{2}-\d{2}\.md$/;

  let monthDirs;
  try {
    monthDirs = await readdir(entriesDir);
  } catch {
    return [];
  }

  const dates = [];

  for (const monthDir of monthDirs) {
    // Only process YYYY-MM directories
    if (!/^\d{4}-\d{2}$/.test(monthDir)) continue;

    let files;
    try {
      files = await readdir(join(entriesDir, monthDir));
    } catch {
      continue;
    }

    for (const file of files) {
      if (datePattern.test(file)) {
        dates.push(file.replace('.md', ''));
      }
    }
  }

  dates.sort();
  return dates;
}

/**
 * Get all dates that have daily summary files.
 * @param {string} basePath - Base path for journal (default: current directory)
 * @returns {Promise<Set<string>>} Set of date strings (YYYY-MM-DD)
 */
async function getSummarizedDays(basePath = '.') {
  const summariesDir = join(basePath, 'journal', 'summaries', 'daily');
  const datePattern = /^\d{4}-\d{2}-\d{2}\.md$/;

  let files;
  try {
    files = await readdir(summariesDir);
  } catch {
    return new Set();
  }

  const dates = new Set();
  for (const file of files) {
    if (datePattern.test(file)) {
      dates.add(file.replace('.md', ''));
    }
  }
  return dates;
}

/**
 * Find days that have journal entries but no daily summary.
 * Excludes today (current day is not yet complete).
 * @param {string} basePath - Base path for journal (default: current directory)
 * @param {{ before?: string }} options - Optional cutoff date (exclusive, YYYY-MM-DD)
 * @returns {Promise<string[]>} Sorted array of unsummarized date strings
 */
export async function findUnsummarizedDays(basePath = '.', options = {}) {
  const entryDays = await getDaysWithEntries(basePath);
  if (entryDays.length === 0) return [];

  const summarizedDays = await getSummarizedDays(basePath);
  const today = new Date().toISOString().slice(0, 10);

  return entryDays.filter(dateStr => {
    // Exclude today — not yet complete
    if (dateStr >= today) return false;
    // Exclude dates at or after the cutoff
    if (options.before && dateStr >= options.before) return false;
    // Exclude already summarized
    if (summarizedDays.has(dateStr)) return false;
    return true;
  });
}
