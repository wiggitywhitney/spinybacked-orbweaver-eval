# Telemetry Agent Specification

**Status:** Draft
**Created:** 2026-02-05
**Purpose:** AI agent that auto-instruments TypeScript code with OpenTelemetry based on a Weaver schema

## Vision

An AI agent that takes a Weaver schema and code files, then automatically instruments them with OpenTelemetry. The agent prioritizes semantic conventions, can extend the schema as needed, and validates its work through Weaver.

**Short-term goal:** Works on commit-story-v2 repository
**Long-term goal:** Distributable tool that works on any TypeScript codebase

---

## Architecture

### Core
- **LangGraph agent** containing all instrumentation logic
- Single agent for PoC (multi-agent for metrics/logs later)

### Interfaces (cosmetic wrappers around core)
- **MCP server** (PoC) - invoked from Claude Code
- **CLI** (future) - `telemetry-agent instrument src/`
- **GitHub Action** (future) - runs on PR/push

### Key Tools
- **ts-morph** for AST manipulation (TypeScript-native, full type access)
- **Weaver** for schema validation and live-check
- **Prettier** for post-transformation formatting

---

## Prerequisites

Before the agent can work on a codebase:

1. **Weaver schema exists** - defines conventions and attributes
2. **OTel SDK initialized** - user's responsibility, not agent's job
3. **`@opentelemetry/api` in dependencies**
4. **OTLP endpoint configured** - SDK must export somewhere Weaver can check
5. **Test suite exists** - for validation (agent warns if missing)

---

## How It Works

### Input
- Weaver schema (resolved JSON)
- File or directory path
- Configuration (autoApproveLibraries, etc.)

### Processing (per file)
1. **Check imports** - what OTel is already present?
2. **Find instrumentation points** - using heuristics (see below)
3. **Skip already-instrumented functions** - pattern match for `tracer.startActiveSpan` etc.
4. **For each uninstrumented function:**
   - Determine needed attributes
   - Check semconv first, then existing schema, then create new
   - Add instrumentation library if available and beneficial
   - Add manual span if needed
5. **Update Weaver schema** if new attributes/spans created
6. **Commit to branch**

### Output
- Single PR with all changes (code + schema updates)
- Validation results

---

## File/Directory Processing

- **User specifies:** file or directory
- **Directory processing:** sequential, one file at a time
- **New AI instance per file:** prevents laziness, ensures quality
- **Schema changes propagate:** via git commits on feature branch
- **Single PR at end:** contains all instrumented files and schema updates

---

## What Gets Instrumented

### Heuristics (agent decides where to instrument)
- Exported async functions
- Functions in `services/`, `handlers/`, `api/` directories
- Functions making external calls (DB, HTTP, etc.)
- Skip: utilities, formatters, pure helpers

### Schema guidance
- Schema defines attribute groups and naming patterns
- Schema can define specific spans for critical paths (overrides heuristics)
- Agent applies schema conventions to discovered instrumentation points

---

## Attribute Priority Chain

When agent needs an attribute:

1. **Check OTel semantic conventions** - use semconv reference if exists
2. **Check existing Weaver schema** - use if already defined
3. **Neither exists** - create new custom attribute under project namespace

**Agent has full authority to extend schema** (create spans, attributes, groups) - subject to semconv-first check.

---

## Auto-Instrumentation Libraries

### Detection
- Agent sees imports in the file being processed
- Checks if OTel instrumentation library already in use

### Adding Libraries
- **PoC:** Query npm registry at runtime to discover available libraries
- **Future:** Vector database synced with OTel ecosystem
- **Configuration:** `autoApproveLibraries: true/false`

### Philosophy
- Libraries handle framework boundaries (HTTP, DB, external calls)
- Manual instrumentation handles business logic libraries can't see
- Agent adds library if available, fills gaps with manual spans

---

## Validation Chain

All validation owned by agent (self-contained):

1. **Syntax** - TypeScript compiler / ts-morph
2. **Weaver registry check** - static schema validation
3. **Run tests** - execute test suite (full suite for PoC)
4. **Weaver live-check** - validates emitted telemetry against schema

### Future Optimizations
- Smart test discovery (only tests touching changed files)
- Backend verification (query Datadog/Jaeger to confirm data arrived)

### If Tests Don't Exist
- Agent warns user
- Skips live-check validation
- Other validations still run

---

## Handling Existing Instrumentation

### Already instrumented (complete)
- Pattern match for `tracer.startActiveSpan`, `tracer.startSpan`, etc.
- Skip the function

### Broken instrumentation
- Agent is **additive only** - doesn't try to detect/fix broken patterns
- Weaver validation catches issues
- Agent fixes what Weaver reports

### Telemetry removed by user
- If user deletes instrumentation but schema still defines it
- Agent re-instruments according to schema (schema is source of truth)
- If user wants telemetry gone: don't feed file to agent

---

## Schema as Source of Truth

- Weaver schema defines what SHOULD be instrumented
- Agent implements the contract
- Agent can EXTEND schema (with semconv check)
- Code follows schema, not the other way around

---

## Configuration

Agent configuration options (format TBD):

```yaml
# telemetry-agent.yaml
autoApproveLibraries: true  # or false to prompt
testCommand: "npm test"      # how to run tests
otlpEndpoint: "localhost:4317"
namespace: "commit_story"    # project attribute namespace
```

---

## Outstanding Questions

### Q1: Weaver Schema Structure
What's the minimum viable schema structure for the agent to work? Need concrete examples of:
- Attribute group definitions
- Span definitions
- How to express "instrument all services under this namespace"

### Q2: Live-Check Setup
Exact flow for live-check:
- Does the test suite need special configuration to emit to OTLP?
- Does agent spin up a collector, or assume one exists?
- How does Weaver connect to the endpoint?

### Q3: Error Handling
What happens when:
- Instrumentation breaks the build?
- Tests fail after instrumentation?
- Weaver validation fails?
- Partial completion (3 of 5 files instrumented)?

Should agent rollback? Continue? Create PR anyway with failures noted?

### Q4: Semconv Lookup
How does agent check semantic conventions at runtime?
- Query OTel docs?
- Local copy of semconv?
- Part of Weaver's resolved output includes semconv references?

### Q5: LangGraph Structure
What nodes/edges does the LangGraph agent need?
- Analyze file
- Determine instrumentation points
- Check semconv
- Generate code
- Validate
- Commit

### Q6: Quality Checks for AI
How to ensure agent doesn't get lazy or cut corners?
- New instance per file (decided)
- What else? Output validation? Human review triggers?

---

## Dependencies

### PRD 25 (Autonomous Dev Infrastructure)
- Should be completed first
- Provides testing infrastructure for this repo
- Agent doesn't depend on it architecturally (self-contained validation)
- But this repo benefits from having it

### Separate Repository
- Agent should live in its own repo
- commit-story-v2 is first test subject, not home
- Enables distribution to other codebases

---

## PoC Scope

### In Scope
- MCP server interface
- Single LangGraph agent
- TypeScript support
- Traces only (no metrics/logs yet)
- File/directory input
- Sequential processing
- PR output
- Validation: syntax, Weaver check, tests, live-check
- npm registry queries for library discovery
- Schema extension with semconv priority

### Out of Scope (Future)
- CLI and GitHub Action interfaces
- Multi-agent (separate metrics/logs/traces agents)
- Other languages
- Smart test discovery
- Vector database for OTel knowledge
- Backend verification (query observability platform)
- Configurable instrumentation levels (dev-heavy vs production-selective)

---

## Research Summary

### Prior Art
- **o11y.ai** - AI-powered, TypeScript, generates PRs. Not schema-driven.
- **OllyGarden Rose** - PR review for instrumentation quality. "Agentic Instrumentation" coming.
- **Orchestrion (Datadog)** - Compile-time AST instrumentation for Go.
- **Gap:** No tool combines Weaver schema + AI + source transformation.

### Optional Telemetry Pattern
- `@opentelemetry/api` has zero dependencies (~8-10KB)
- Use peer dependencies with optional flag
- Without SDK initialization, all API calls are automatic no-ops
- Agent can instrument code that works with or without OTel present

### Instrumentation Level (Still Open)
- "Instrument everything" is NOT industry best practice for production
- Consensus: auto-instrumentation baseline + manual for business-critical paths
- v1's heavy dev instrumentation was intentional for AI debugging assistance
- Agent should eventually support configurable modes

---

## References

### Research Documents
- [Prior Art: AI Instrumentation Tools](./research/telemetry-agent-prior-art.md)
- [Optional Telemetry Patterns](./research/optional-telemetry-patterns.md)
- [TypeScript AST Tools](./research/typescript-ast-tools.md)
- [Instrumentation Level Strategies](./research/instrumentation-level-strategies.md)
- [Weaver TypeScript Capabilities](./research/weaver-typescript.md)

### External Resources
- [OllyGarden Rose](https://ollygarden.com/rose)
- [OpenTelemetry Weaver](https://github.com/open-telemetry/weaver)
- [ts-morph](https://ts-morph.com/)
