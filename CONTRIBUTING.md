# Contributing to KARG

Thank you for your interest in contributing to KARG! We love your input! We want to make contributing to this project as easy and transparent as possible.

## Quick Start

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`bun test && bunx biome check --fix`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

### Option 1: Using Devbox (Recommended)

[Devbox](https://www.jetify.com/devbox) provides a consistent development environment without polluting your system.

```bash
# Install Devbox (if not already installed)
curl -fsSL https://get.jetify.com/devbox | bash

# Clone your fork
git clone https://github.com/YOUR_USERNAME/karg.git
cd karg

# Start devbox shell (automatically installs all tools)
devbox shell

# Now you have access to all required tools!
bun install
bun ts/cli/index.ts --help
```

Why Devbox?
- 🎯 **Zero Config**: All tools are pre-configured in `devbox.json`
- 🔧 **Consistent Environment**: Same versions across all machines
- 🧹 **Clean System**: Tools are isolated, no global installs
- 🚀 **Fast**: Cached packages, instant environment
- 🔄 **Reproducible**: Lock file ensures exact versions
- 📦 **All-in-One**: Includes Bun, Task, and all dev tools

The development environment includes:
- **Bun**: Fast JavaScript runtime and package manager
- **Task**: Modern task runner (better than npm scripts)
- **Biome**: Fast formatter and linter
- All configured and ready to use!

### Option 2: Manual Setup

If you prefer manual installation:

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/karg.git
cd karg

# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Run the CLI locally
bun ts/cli/index.ts --help

# Run tests
bun test

# Format and lint code
bunx biome check --fix
```

## What We're Looking For

We welcome all kinds of contributions! Here are some ideas:

### 🚀 Features
- **Output Formats**: HTML, OpenAPI, JSON Schema
- **Input Formats**: OpenAPI specs, Protobuf definitions
- **Localization**: Multi-language support
- **Themes**: Different markdown styles/formats

### 🐛 Bug Fixes
- Found a bug? Open an issue first to discuss
- Include CRD examples that reproduce the issue
- Small fixes can go straight to PR

### 📚 Documentation
- Improve README examples
- Add more CRD examples
- Fix typos or clarify explanations
- Translate documentation

### 🧪 Testing
- Add test cases for edge cases
- Improve test coverage
- Add performance benchmarks

## Code Guidelines

### TypeScript Style

```typescript
// ✅ Good: Descriptive names, proper types
export function convertFieldToMarkdown(field: FieldDocumentation): MdastNode {
  // Clear, single responsibility
}

// ❌ Bad: Unclear names, any types
export function conv(f: any): any {
  // Too generic
}
```

### File Organization

```
ts/
├── models/      # Data structures only
├── reader/      # Input parsing
├── writer/      # Output generation  
├── cli/         # CLI interface
└── __tests__/   # Test files
```

### Commit Messages

Follow conventional commits:

```
feat: add HTML output format
fix: handle empty CRD descriptions
docs: improve CLI examples
test: add validation rule tests
refactor: simplify field converter
```

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test ts/models/__tests__/converter.test.ts

# Run in watch mode
bun test --watch
```

### Writing Tests

```typescript
import { test, expect } from "bun:test";

test("should convert CRD to documentation", () => {
  const crd = createTestCRD();
  const doc = convertCRDToAPIDoc(crd);
  
  expect(doc.title).toBe("TestResource");
  expect(doc.specFields).toHaveLength(3);
});
```

## Pull Request Process

1. **Open an Issue First** (for features)
   - Discuss your idea
   - Get feedback on approach
   - Avoid duplicate work

2. **Keep PRs Focused**
   - One feature/fix per PR
   - Small PRs get reviewed faster
   - Include tests for new features

3. **Update Documentation**
   - Add examples if needed
   - Update README for new features
   - Include inline code comments

4. **PR Title Format**
   ```
   feat: add support for OpenAPI output
   fix: correctly parse array validation rules
   docs: add CRD examples for databases
   ```

## Project Structure

Understanding the codebase:

```typescript
// Entry point: ts/cli/index.ts
YAML file → parseContent() → CRD object
                ↓
         convertCRDsToDocuments()
                ↓
         Document model
                ↓
    renderAPIDocumentation() → Markdown
```

Key concepts:
- **CRD Object**: Typed representation of Kubernetes CRD
- **Document Model**: Intermediate format for rendering
- **AST Rendering**: Safe markdown generation using mdast

## Devbox Commands

When using Devbox, you have access to these helpful commands:

```bash
# Start development shell
devbox shell

# Run commands without entering shell
devbox run bun test
devbox run bun scripts/build.ts

# Update dependencies
devbox update

# View installed packages
devbox list

# Add new development tools
devbox add nodejs@20  # Example: add Node.js
```

### Using Task (Taskfile)

We use [Task](https://taskfile.dev/) for common development tasks:

```bash
# View all available tasks
task --list

# Clean build artifacts
task clean

# Update examples
task update-examples

# Run CI checks
task ci
```

### Building Binaries

To build binaries for distribution, use the build script directly:

```bash
# Build all platforms (binaries + archives)
bun scripts/build.ts

# Build for specific version
bun scripts/build.ts --version v1.0.0

# Build only binaries (no archives)
bun scripts/build.ts --binaries-only

# Create archives from existing binaries
bun scripts/build.ts --archives-only

# Build specific platform
bun scripts/build.ts --platform darwin-arm64
```

## Common Tasks

### Adding a New Output Format

1. Create writer in `ts/writer/[format].ts`
2. Implement render function
3. Add CLI option in `ts/cli/index.ts`
4. Add tests
5. Update README

### Supporting New CRD Features

1. Update types in `ts/models/crd.ts`
2. Handle in `ts/models/converter.ts`
3. Update markdown output
4. Add example CRD
5. Test edge cases

## Troubleshooting

### Devbox Issues

```bash
# If devbox shell is slow
devbox cache upload  # Pre-cache packages

# If packages fail to install
devbox update        # Update lock file
devbox shell --pure  # Clean environment

# Reset everything
rm -rf .devbox
devbox install
```

### Common Problems

- **`bun: command not found`**: Make sure you're in devbox shell
- **Permission errors**: Check file ownership, especially after Docker use
- **Port already in use**: Kill existing processes or change port

## Getting Help

- 💬 Open an issue for questions
- 🔍 Check existing issues first
- 📖 Read the code - it's well-commented!
- 🤝 Ask in PR comments
- 🐛 Include your environment details (OS, devbox version)

## Code of Conduct

Be kind and respectful. We're all here to make better tools for the Kubernetes community.

- ✅ Constructive feedback
- ✅ Help others learn
- ✅ Be patient with newcomers
- ❌ No harassment or discrimination

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Ready to contribute? We can't wait to see what you build! 🚀 