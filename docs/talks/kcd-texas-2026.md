# KCD Texas 2026

**Event:** KCD Texas
**Date:** May 15, 2026

## Title

The Best Laid Spans: AI-Automated Instrumentation with OpenTelemetry Weaver

## Abstract

Commit Story is a GenAI-powered, automated engineering journal that is triggered by Git commits. But that's not the point. For the speaker, this personal project became a playground for exploring how telemetry can inform AI coding assistants at development time.

Her path to adding instrumentation likely mirrors that of many teams: an effort to follow OpenTelemetry semantic conventions, first through documentation, then through a shared library of standards. Eventually, she turned to OpenTelemetry Weaver, a tool for codifying telemetry conventions into machine-readable, validatable contracts. She built an AI agent that reads a Weaver schema, discovers conventions, extends the schema as needed, instruments the code, and validates that it all works using Weaver's live-check feature.

This talk shares what that process revealed—how automation reshapes telemetry design—and includes a live demo of the Telemetry Agent instrumenting the codebase using those formalized standards.

## Benefits to the Ecosystem

This talk gives attendees two things they can take home: an introduction to OpenTelemetry Weaver as a way to formalize telemetry standards, and a working pattern for building an AI agent that instruments code against those standards.

Attendees will learn:
- How to enforce telemetry conventions through code, not just documentation
- How to keep AI agents trustworthy by using deterministic orchestration and schema-driven validation — letting AI do what it's good at while scripts handle the rest
- Real-world lessons from building, breaking, and fixing automated instrumentation

By showing both the successes and mistakes in this journey, the talk helps others avoid common pitfalls when implementing automated observability. For the OpenTelemetry community specifically, it demonstrates how AI can make semantic conventions more accessible and increase adoption of standardized telemetry practices.
