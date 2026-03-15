// ABOUTME: Prompt template for weekly summary generation (consolidates a week's daily summaries)
// ABOUTME: Produces three sections: Week in Review, Highlights, Patterns

/**
 * Generates the weekly summary prompt for consolidating a week's daily summaries.
 *
 * @param {number} dayCount - Number of daily summaries being consolidated
 * @returns {string} Complete prompt for weekly summary generation
 */
export function weeklySummaryPrompt(dayCount) {
  const scopeGuidance = dayCount === 1
    ? `There is only 1 daily summary for this week. Keep the weekly summary brief — do not inflate a single day's work into a full week narrative.`
    : `There are ${dayCount} daily summaries for this week. Look for the arc of the week — how work evolved from day to day, recurring themes, and how earlier decisions shaped later work.`;

  return `
## Step 1: Read the Week's Daily Summaries

You are consolidating a developer's week of work. Below are their daily summaries — each one covers a full day's commits with narrative, key decisions, and open threads.

Read all daily summaries carefully. For each day, note:
- The main work accomplished that day
- Key decisions made
- Open threads or unfinished work
- How the day's work relates to other days in the week

${scopeGuidance}

## Step 2: Write the Week in Review

Write a narrative arc of the week. This is the "what did I accomplish this week" story — not a day-by-day recap.

Synthesize across days. If Monday through Wednesday all involved the same feature, describe the feature's progression as one story, not three separate day summaries. Group related work into narrative threads.

**Voice & Tone:**
- Use contractions (wasn't, it's, didn't, they're)
- Refer to "the developer" (third person)
- Acknowledge problems casually ("it was getting messy", "kept breaking")
- Direct language, no corporate-speak
- Brief is fine — don't pad with filler

**Do NOT:**
- Recap each day separately ("On Monday... On Tuesday...")
- Repeat information that appears in multiple daily summaries
- Infer motivation that isn't stated in the daily summaries
- Invent details not present in the source summaries

BANNED WORDS: comprehensive, robust, significant, systematic, meticulous, methodical, sophisticated, leveraging, enhanced, utilizing. If any appear in your draft, replace them with simpler words.

## Step 3: Identify Highlights

Extract the most important accomplishments from the week. These are the things worth mentioning in a standup or retrospective — shipped features, solved problems, unblocked work.

For each highlight:
- State what was accomplished (1-2 sentences max)
- Include brief context for why it matters (only if evident from the summaries)

Limit to 3-5 highlights. If the week only had one notable accomplishment, list just that one.

If no clear highlights emerge from the summaries, output: "No standout highlights this week."

## Step 4: Surface Patterns

Look across the week for:
- Recurring themes (same codebase area touched multiple days, similar types of work)
- Persistent blockers (problems mentioned on multiple days without resolution)
- Resolved threads (open threads from earlier days that were addressed later in the week)
- Emerging directions (new work streams that started mid-week)
- Process observations (lots of refactoring, heavy debugging, rapid feature shipping)

These patterns help the developer notice things they might miss in the day-to-day grind. If no patterns are evident, output: "No notable patterns this week."

## Step 5: Output

Before outputting, verify: every claim in your summary traces back to a specific daily summary. If you cannot point to which day supports a statement, remove it.

Output using this exact format with these exact markdown headers:

## Week in Review

[Your synthesized weekly narrative here. No bullet points in this section. Start directly with what happened.]

## Highlights

[Each highlight as a bullet point. Or the "no highlights" message.]

## Patterns

[Each pattern as a bullet point. Or the "no patterns" message.]

Output ONLY these three sections. No preamble. No closing commentary. Start directly with "## Week in Review".
`.trim();
}
