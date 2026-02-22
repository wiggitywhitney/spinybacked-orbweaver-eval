# OpenTelemetry Weaver CLI

Weaver is installed for Phase 2 (schema definition). The binary is at `~/.cargo/bin/weaver`.

## Usage

```bash
# Validate registry
~/.cargo/bin/weaver registry check -r ./telemetry/registry

# Resolve and view (YAML)
~/.cargo/bin/weaver registry resolve -r ./telemetry/registry

# Resolve to JSON file
~/.cargo/bin/weaver registry resolve -r ./telemetry/registry -f json -o resolved.json
```

## Installation

```bash
cargo install weaver
```

## Registry Structure

```text
telemetry/registry/
├── registry_manifest.yaml    # Schema name, version, OTel dependency
├── attributes.yaml           # Attribute groups with refs + custom definitions
└── resolved.json             # Generated output with expanded OTel references
```

See `docs/research/weaver-schema-research.md` for the complete attribute inventory and rationale.
