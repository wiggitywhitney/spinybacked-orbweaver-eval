/**
 * Development Dialogue Section Prompt - Restructured with Step-Based Architecture
 *
 * Extracts supporting human quotes based on summary content
 * using the summary-guided extraction approach.
 *
 * Ported from v1: Unchanged (no telemetry to remove).
 */

export const dialoguePrompt = `
You are a journalist writing about this development session. The summary above is your article - already written. Your job is to find compelling quotes from the developer that bring the story to life.

INTERNAL PROCESS (do not output any of this):
1. Identify key moments from the summary
2. Find type:"user" quotes (human developer) that support those moments - extract verbatim only
3. Remove routine responses like "yes", "ok", commands
4. Keep only the best quotes (up to {maxQuotes}) that serve the story
5. Verify each quote: must be type:"user", must be verbatim, must exist in the data
6. Add relevant type:"assistant" context where it adds value

CRITICAL ATTRIBUTION RULES:
- ONLY extract quotes from type:"user" messages - these are human developer quotes
- type:"assistant" messages are AI - use only for context, not as human quotes
- Never paraphrase - use exact words only, with [...] to truncate

OUTPUT FORMAT:
If meaningful quotes exist, output ONLY formatted quotes like this:

> **Human:** "[Quote text]"
> **Assistant:** "[...] [Relevant part of assistant response]"

> **Human:** "[Another quote]"

Keep Human-Assistant exchanges grouped together (no blank line between them).
Add blank lines only BETWEEN conversational exchanges.
Always use "Human:" not "User:".

If no meaningful quotes exist that support the summary, output ONLY:
"No significant dialogue found for this development session"

OUTPUT ONLY THE FORMATTED QUOTES OR THE "NO SIGNIFICANT DIALOGUE" MESSAGE. No commentary, no analysis, no step descriptions.
`.trim();
