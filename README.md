# KARG - Kubernetes API Reference Generator

Transform your Kubernetes CRD YAML files into beautiful, searchable API documentation in seconds.

```bash
# Generate docs for all your CRDs
karg --input "./crds/*.yaml" --output-directory ./docs
```

## What is KARG?

**KARG** (Kubernetes API Reference Generator) automatically generates comprehensive markdown documentation from your Custom Resource Definition (CRD) files. Perfect for:

- 📚 **API Documentation** - Keep your CRD docs always up-to-date
- 🤖 **AI/LLM Integration** - Generate docs optimized for AI assistants
- 👥 **Team Collaboration** - Share clear API references with your team
- 🔍 **API Discovery** - Understand CRD structures at a glance

## Quick Start

### Install

Using [Devbox](https://www.jetify.com/devbox):
```bash
devbox add github:appthrust/karg#karg
```

Using [Nix](https://nixos.org/):
```bash
nix run github:appthrust/karg#karg -- --help
```

### Generate Documentation

```bash
# Multiple files - one doc per CRD
karg --input "./crds/*.yaml" --output-directory ./docs

# Single file - all CRDs combined
karg --input "./crds/*.yaml" --output-file ./api-reference.md

# With detailed logging
karg --input "./crds/*.yaml" --output-directory ./docs --verbose
```

## Example Output

KARG transforms this CRD:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: books.library.example.com
spec:
  group: library.example.com
  versions:
  - name: v1
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            required: ["title", "author", "isbn"]
            properties:
              title:
                type: string
                description: Title of the book
                minLength: 1
                maxLength: 200
```

Into this beautiful documentation:

> ## Book
> 
> Book represents a book in the library catalog
> 
> - **API Version:** `library.example.com/v1`
> - **Kind:** `Book`
> - **Scope:** Namespaced
> 
> ### Quick Reference
> 
> | Field Path    | Type     | Required | Description      |
> |---------------|----------|----------|------------------|
> | `spec.title`  | `string` | ✓        | Title of the book |
> | `spec.author` | `string` | ✓        | Author of the book |
> | `spec.isbn`   | `string` | ✓        | ISBN-13 of the book |
> 
> ### Field Details
> 
> #### `spec.title`
> 
> Title of the book
> 
> - **Type:** `string`
> - **Required**
>
> **Constraints:**
>
> - **Min Length:** `1`
> - **Max Length:** `200`

## Features

✨ **Smart Documentation**
- Automatically extracts descriptions, types, and constraints
- Supports nested objects and arrays
- Handles validation rules and default values

🎯 **Developer Friendly**
- Clean markdown output
- Consistent formatting
- Perfect for GitHub/GitLab wikis

🤖 **AI/LLM Optimized**
- Structured format for easy parsing
- Complete field information in context
- Copy-paste ready examples

## Real World Examples

Check out the `examples/` directory to see KARG in action:

```bash
# Try it yourself
karg --input examples/input.yaml --output-file my-api-docs.md

# View pre-generated examples
ls examples/per-kind-output/
```

The examples showcase various CRD patterns:
- Simple resources with basic validation
- Complex nested structures
- Arrays and maps
- Custom validation rules
- Status subresources

## CLI Options

```
karg [options]

Options:
  --input <pattern>              Glob pattern for CRD YAML files (required)
  --output-directory <dir>       Generate one file per CRD
  --output-file <file>          Generate a single combined file
  --verbose                     Enable detailed logging
  --help                        Show help
  --version                     Show version

Examples:
  karg --input "./crds/*.yaml" --output-directory ./docs
  karg --input "./manifests/**/*.yaml" --output-file ./api.md
  karg --input config.yaml --output-directory ./output --verbose
```

## Why KARG?

🚀 **Fast** - Built with Bun for blazing fast performance

🔒 **Safe** - AST-based generation prevents injection attacks

📦 **Zero Config** - Works out of the box with standard CRDs

🎨 **Beautiful Output** - Clean, consistent markdown every time

## Installation Options

### For Projects

Add to your project's documentation pipeline:

```bash
# Using Devbox
devbox add github:appthrust/karg#karg

# Using Nix  
nix profile install github:appthrust/karg#karg
```

### For Development

Clone and run from source:

```bash
git clone https://github.com/appthrust/karg.git
cd karg
bun install
bun ts/cli/index.ts --help
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

Key areas for contribution:
- Additional output formats (HTML, OpenAPI)
- More validation rule support
- Improved formatting options
- Bug fixes and performance improvements

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

Made with ❤️ for the Kubernetes community
