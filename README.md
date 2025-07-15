# RDD - README Document generator from CRD

A CLI tool that generates markdown documentation from Kubernetes Custom Resource Definition (CRD) YAML files using AST-based markdown generation for safety and reliability.

## Features

- **One API, One File**: Generates a separate markdown file for each CRD
- **Comprehensive Documentation**: Covers both spec and status fields
- **Flat Field Structure**: Lists all fields independently (e.g., `spec`, `spec.projectRef`, `spec.projectRef.name`)
- **Detailed Field Information**: Includes field type, description, requirements, validation rules, and examples
- **Safe AST-based Generation**: Uses mdast (markdown AST) and unist ecosystem for safe, reliable markdown generation
- **Clean Architecture**: Decoupled components for easy extensibility
- **LLM-Friendly Output**: Structured markdown format optimized for AI/LLM consumption

## Installation

### Using Devbox

If you're using [Devbox](https://www.jetify.com/devbox), you can install the pre-built binary directly:

```bash
# Install specific version
devbox add github:appthrust/rdd/v0.1.0#rdd

# Or install latest version
devbox add github:appthrust/rdd#rdd
```

### Using Nix

If you have Nix installed, you can run RDD directly without installation:

```bash
# Run directly
nix run github:appthrust/rdd#rdd -- --help

# Or install to your profile
nix profile install github:appthrust/rdd#rdd
```

### From Source

```bash
bun install
```

## Usage

### Multi-file Mode

Generate separate markdown files for each CRD:

```bash
# If installed via devbox/nix
rdd --input <glob-pattern> --output-directory <output-directory> [--verbose]

# If running from source
bun ts/cli/index.ts --input <glob-pattern> --output-directory <output-directory> [--verbose]
```

### Single-file Mode

Generate a combined markdown file with all CRDs:

```bash
# If installed via devbox/nix
rdd --input <glob-pattern> --output-file <output-file> [--verbose]

# If running from source
bun ts/cli/index.ts --input <glob-pattern> --output-file <output-file> [--verbose]
```

### Examples

```bash
# Generate separate docs for all CRD files in a directory
rdd --input "./crds/*.yaml" --output-directory ./docs

# Generate a single combined documentation file
rdd --input "./crds/*.yaml" --output-file ./api-docs.md

# Generate docs for a specific file
rdd --input config.yaml --output-directory ./documentation

# Verbose output
rdd --input "./manifests/**/*.yaml" --output-directory ./docs --verbose
```

## Examples

The `examples/` directory contains comprehensive examples to help you understand the tool's capabilities:

### Input Examples

- **`examples/input.yaml`** - Contains three different CRD examples showcasing various features:
  - **Book CRD**: A simple CRD for a library management system with basic field types, enums, and validation
  - **Database CRD**: A complex CRD with nested properties, immutable fields, and extensive validation rules
  - **WebApp CRD**: A deployment-focused CRD with autoscaling, health checks, and ingress configuration

### Output Examples

The tool generates two types of output from the same input:

#### Single-file Output

- **`examples/single-file-output.md`** - All CRDs documented in one combined file with a table of contents

#### Per-kind Output

- **`examples/per-kind-output/`** - Separate files for each CRD:
  - `library.example.com-v1-book.md` - Book API documentation
  - `data.example.com-v1beta1-database.md` - Database API documentation
  - `apps.example.com-v2-webapp.md` - WebApp API documentation

### Try the Examples

Generate the documentation yourself:

```bash
# Generate single-file output
rdd --input examples/input.yaml --output-file my-api-docs.md

# Generate per-kind output
rdd --input examples/input.yaml --output-directory my-docs/
```

### Key Features Demonstrated

The examples showcase how the tool handles:

- **Field Documentation**: Types, descriptions, requirements, and examples
- **Validation Rules**: Patterns, min/max values, enum constraints
- **Nested Objects**: Hierarchical field structures with dot notation
- **Arrays**: Item types and constraints
- **Kubernetes Extensions**: `x-kubernetes-validations`, immutable fields
- **Default Values**: Showing defaults for optional fields
- **Status Fields**: Documenting both spec and status sections

## Architecture

The tool follows a clean architecture with clear separation of concerns:

```
YAML string → YAML Decoder → Typed CRD Object → Document Model → AST Renderer → Markdown string
```

### Key Components

- **Document Model**: Decoupled from rendering concerns for future format support
- **Typed CRD Object**: Decoupled from specific input formats for extensibility
- **AST-based Renderer**: Uses mdast (markdown AST) and mdast-util-to-markdown for safe, reliable output

### Technology Stack

- **Bun**: Fast JavaScript runtime and package manager
- **citty**: CLI framework for robust command-line interfaces
- **mdast-util-to-markdown**: AST-based markdown generation for safety
- **unist-builder**: Utility for building syntax trees
- **js-yaml**: YAML parsing with type safety

### Directory Structure

```
./ts/
├── models/
│   ├── document/     # Document models
│   ├── crd/          # CRD object models
│   └── converter/    # CRD to document conversion
├── writer/
│   └── markdown/     # AST-based markdown generation
├── reader/
│   └── yaml/         # YAML to CRD object conversion
├── cli/              # CLI implementation
└── index.ts          # Library exports
```

### Dependency Direction

- `reader` → `models/crd`
- `writer` → `models/document`
- `models/converter` → `models/crd`, `models/document`
- `cli` → `reader`, `writer`, `models`

## Development

### Linting and Formatting

```bash
# Check and auto-fix linting issues
bunx biome check --fix
```

### Testing

Run the CLI with a sample CRD to test:

```bash
# From source
bun ts/cli/index.ts --input example.yaml --output-directory ./test-output --verbose

# Or if installed via devbox/nix
rdd --input example.yaml --output-directory ./test-output --verbose
```

## Generated Documentation Features

- **Overview Section**: API version, kind, scope, and metadata
- **Quick Reference Table**: Summary of all fields with types and descriptions
- **Field Hierarchy**: Clear organization of spec and status fields
- **Comprehensive Field Info**:
  - Type information
  - Required/optional status
  - Descriptions
  - Validation rules (patterns, min/max values, etc.)
  - Default values
  - Enumerated values
  - Examples (when available)
- **Safe Rendering**: AST-based generation prevents markdown injection attacks
- **Consistent Formatting**: Reliable output thanks to mdast ecosystem

## LLM-Friendly Output Format

The generated markdown documentation is specifically designed to be easily consumed by Large Language Models (LLMs) and AI coding assistants:

### Structured Hierarchy

- **Clear field paths** using dot notation (e.g., `spec.storage.size`)
- **Consistent heading levels** for easy navigation
- **Explicit type information** wrapped in inline code

### Quick Reference Tables

- **At-a-glance overview** of all fields up to 2 levels deep
- **Tabular format** with Field Path, Type, Required status, and Description
- **Visual indicators** like ✓ for required fields

### Detailed Field Documentation

- **Bold labels** for important attributes (**Type**, **Required**, **Optional**)
- **Structured constraints** section with validation rules
- **Code-formatted examples** in YAML
- **Inline code** for technical values and field references

### Why This Matters for LLMs

- **Easy parsing**: Consistent structure allows LLMs to quickly understand API schemas
- **Complete context**: All field information in one place reduces back-and-forth queries
- **Copy-paste friendly**: Examples and field paths ready for direct use in code
- **Self-contained**: Each field's documentation includes all relevant details

## Why AST-based Generation?

This tool uses the [unist](https://unifiedjs.com/) ecosystem for markdown generation, specifically:

- **mdast**: Markdown Abstract Syntax Tree specification
- **mdast-util-to-markdown**: Converts AST to markdown strings
- **unist-builder**: Helps construct AST nodes

This approach provides:

1. **Safety**: No risk of markdown injection or malformed output
2. **Reliability**: Consistent, well-formatted markdown every time
3. **Maintainability**: Easier to modify and extend than string concatenation
4. **Future-proof**: Easy to add new output formats by targeting different ASTs

## Contributing

When contributing, please ensure:

1. Code follows the existing architecture patterns
2. Use AST-based approaches for any content generation
3. Run `bunx biome check --fix` before committing
4. Test with various CRD files to ensure compatibility

## License

MIT License - see LICENSE file for details
