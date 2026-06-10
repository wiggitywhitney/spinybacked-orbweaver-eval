# Story Moments

Notable things that happened during eval runs worth telling — for advocacy checkins, demos, and the spiny-orb origin story.

---

## The validator caught the agent inventing a synonym

**Run-23, 2026-06-10 — commit-story-v2, `src/utils/summary-detector.js`, `findUnsummarizedWeeks`**

The agent was instrumenting `findUnsummarizedWeeks` and needed a path-shaped attribute. It looked at what was available, decided `base_path` was the right name, and declared `commit_story.journal.base_path` as a new schema extension. Totally reasonable in isolation.

The validator — backed by the full schema registry, including attributes accumulated across the 27 files instrumented before this one — looked at `base_path` and said: *"no, `commit_story.journal.file_path` already exists and means the same thing. Use that instead."* SCH-002 (Attribute Keys Match Registry). The function was skipped. The file went partial.

**Why this is the system working correctly:**

Without the registry, you end up with `base_path`, `file_path`, `journal_path`, `output_path` scattered across different files — all meaning roughly the same thing — making trace queries inconsistent and harder to write. The validator's job is to enforce that the schema is the source of truth, not each agent's individual judgment in the moment.

**The two-AI-layer version of the story:**

One AI agent (the instrumenter) tried to name something. A second AI-backed layer (the Weaver schema validator) said no. They disagreed about vocabulary. The validator won. The four spans that *did* commit are correctly attributed. This is what the architecture is for.

**The signal it gives us:**

That this appeared as a regression — run-21 had 5 clean spans, run-23 had 4 — is exactly how you know the fix direction. The agent needs better guidance on checking the existing registry before declaring a new key. The catch was correct; the prevention needs work.

---

*Add new moments here as they happen.*
