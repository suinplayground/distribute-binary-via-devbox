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

<!-- begin:devbox_install - DON'T EDIT: This block will be replaced by CI -->
```bash
devbox add github:suinplayground/distribute-binary-via-devbox/v0.11.0#karg
```
<!-- end:devbox_install -->

Using [Nix](https://nixos.org/):

<!-- begin:nix_install - DON'T EDIT: This block will be replaced by CI -->
```bash
nix run github:suinplayground/distribute-binary-via-devbox/v0.11.0#karg -- --help
```
<!-- end:nix_install -->

#### Important: Version Pinning and Updates

We strongly recommend installing with a specific version tag (e.g., `/v0.6.0`) as shown above. This ensures:
- ✅ Reproducible installations
- ✅ Consistent behavior across environments
- ✅ Explicit version control

**Note**: `devbox update` does not work with GitHub Flake packages. This is due to the fundamental design of how Devbox integrates with Nix - GitHub Flakes are not registered in Nix profiles and thus cannot be updated via `nix profile upgrade`. This is a known limitation. 

If you installed without a version tag:
```bash
# ❌ Not recommended - will pin to a specific commit
devbox add github:appthrust/karg#karg
```

To update, you must manually reinstall:
```bash
# Remove the old version
devbox rm github:appthrust/karg#karg

# Clean the cache
rm -rf .devbox

# Install the latest version with a tag
devbox add github:appthrust/karg/v0.7.0#karg

# Restart your shell
exit && devbox shell
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
> - **API version:** `library.example.com/v1`
> - **Scope:** Namespaced
> - **Plural:** `books`
> - **Singular:** `book`
> 
> ### Quick Reference
> 
> | Field path    | Type     | Required | Description         |
> | ------------- | -------- | -------- | ------------------- |
> | `spec.title`  | `string` | ✓        | Title of the book   |
> | `spec.author` | `string` | ✓        | Author of the book  |
> | `spec.isbn`   | `string` | ✓        | ISBN-13 of the book |
> 
> ### Spec
> 
> #### `spec.title`
> 
> Title of the book
> 
> - **Type:** `string`
> - **Required**
> - **Constraints**
>   - **Min length:** `1`
>   - **Max length:** `200`

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
# Using Devbox (recommended to use version tags)
devbox add github:appthrust/karg/v0.6.0#karg

# Using Nix (recommended to use version tags) 
nix profile install github:appthrust/karg/v0.6.0#karg
```