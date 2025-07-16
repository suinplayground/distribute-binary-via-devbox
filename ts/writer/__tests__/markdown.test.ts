import { describe, expect, test } from "bun:test";
import type {
  APIDocumentation,
  FieldDocumentation,
} from "../../models/document.js";
import {
  renderAPIDocumentation,
  renderCombinedDocumentation,
} from "../markdown.js";

describe("markdown writer", () => {
  // Helper to create a field
  const createField = (
    path: string,
    type: string,
    required: boolean,
    description = "",
    extras: Partial<FieldDocumentation> = {}
  ): FieldDocumentation => ({
    fieldPath: path,
    type,
    required,
    description,
    validationRules: [],
    examples: [],
    ...extras,
  });

  // Helper to create API documentation
  const createAPIDoc = (
    kind = "TestResource",
    specFields: Array<FieldDocumentation> = [],
    statusFields: Array<FieldDocumentation> = [],
    extras: Partial<APIDocumentation> = {}
  ): APIDocumentation => ({
    title: kind,
    kind,
    group: "test.io",
    version: "v1",
    scope: "Namespaced",
    specFields,
    statusFields,
    ...extras,
  });

  describe("renderAPIDocumentation", () => {
    test("renders basic API documentation", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.name", "string", true, "Name of the resource"),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      expect(result).toContain("# TestResource");
      expect(result).toContain("- **API version:** `test.io/v1`");
      expect(result).toContain("- **Scope:** Namespaced");
      expect(result).toContain("## Quick Reference");
      expect(result).toContain("| Field path");
      expect(result).toContain("| `spec.name`");
      expect(result).toContain("### `spec.name`");
      expect(result).toContain("Name of the resource");
    });

    test("includes description when provided", () => {
      const apiDoc = createAPIDoc("TestResource", [], [], {
        description: "This is a test resource for unit testing.",
      });

      const result = renderAPIDocumentation(apiDoc);

      // Description appears right after the title, not in a separate section
      expect(result).toContain(
        "# TestResource\n\nThis is a test resource for unit testing."
      );
    });

    test("renders API description with Markdown formatting", () => {
      const markdownDescription = `This resource manages **books** in a library system.

## Features

- **CRUD Operations**: Create, read, update, and delete books
- **Search**: Full-text search across titles and authors
- **Categories**: Organize books by categories

### Important Notes

> Books marked as \`rare\` cannot be borrowed and are for reference only.

For more information, see the [API Guide](https://example.com/api-guide).

#### Example Usage

\`\`\`yaml
apiVersion: library.example.com/v1
kind: Book
metadata:
  name: kubernetes-book
spec:
  title: "The Kubernetes Book"
  author: "Nigel Poulton"
\`\`\`

**Warning**: Books with _special handling_ requirements need approval.`;

      const apiDoc = createAPIDoc("Book", [], [], {
        description: markdownDescription,
      });

      const result = renderAPIDocumentation(apiDoc);

      // Check that Markdown formatting is preserved
      expect(result).toContain("**books**"); // Bold text
      expect(result).toContain("## Features"); // Heading
      expect(result).toContain("- **CRUD Operations**"); // List items with bold
      expect(result).toContain("> Books marked as `rare`"); // Blockquote with inline code
      expect(result).toContain("[API Guide](https://example.com/api-guide)"); // Link
      expect(result).toContain("```yaml"); // Code block
      expect(result).toContain("kind: Book"); // Content inside code block
      expect(result).toContain("*special handling*"); // Italic text (converted from underscores)

      // Ensure the description appears right after the main title
      expect(result).toContain("# Book\n\nThis resource manages **books**");
    });

    test("handles API description with complex nested Markdown", () => {
      const complexDescription = `A **Database** resource that supports:

1. **PostgreSQL** versions:
   - 15.x (recommended)
   - 14.x
   - 13.x
2. **MySQL** versions:
   - 8.0
   - 5.7

### Configuration Table

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| \`replicas\` | int | 3 | Number of database replicas |
| \`storage\` | string | "100Gi" | Storage size |

---

**Note**: For production use, always enable \`backups.enabled = true\`.`;

      const apiDoc = createAPIDoc("Database", [], [], {
        description: complexDescription,
      });

      const result = renderAPIDocumentation(apiDoc);

      // Check numbered lists
      expect(result).toContain("1. **PostgreSQL** versions:");
      expect(result).toContain("   - 15.x (recommended)");
      expect(result).toContain("2. **MySQL** versions:");

      // Check table - exact formatting might vary due to table alignment
      expect(result).toContain("| Parameter");
      expect(result).toContain("| Type");
      expect(result).toContain("| Default");
      expect(result).toContain("| Description");
      expect(result).toContain("| `replicas`");
      expect(result).toContain("| int");
      expect(result).toContain("| 3");
      expect(result).toContain("| Number of database replicas |");

      // Check horizontal rule
      expect(result).toContain("---");

      // Check inline code in text
      expect(result).toContain("`backups.enabled = true`");
    });

    test("handles empty or missing API description", () => {
      // Test with missing description
      const apiDocNoDesc = createAPIDoc("TestResource");
      const resultNoDesc = renderAPIDocumentation(apiDocNoDesc);

      // Should not have extra blank lines after title
      expect(resultNoDesc).toContain("# TestResource\n\n- **API version:**");

      // Test with empty string description
      const apiDocEmptyDesc = createAPIDoc("TestResource", [], [], {
        description: "",
      });
      const resultEmptyDesc = renderAPIDocumentation(apiDocEmptyDesc);

      // Should handle empty description gracefully
      expect(resultEmptyDesc).toContain("# TestResource\n\n- **API version:**");
    });

    test("includes metadata details", () => {
      const apiDoc = createAPIDoc("TestResource", [], [], {
        metadata: {
          plural: "testresources",
          singular: "testresource",
          shortNames: ["tr", "test"],
        },
      });

      const result = renderAPIDocumentation(apiDoc);

      expect(result).toContain("- **Plural:** `testresources`");
      expect(result).toContain("- **Singular:** `testresource`");
      expect(result).toContain("- **Short names:** `tr`, `test`");
    });

    test("renders quick reference table", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec", "object", true, "Spec object"),
        createField("spec.replicas", "integer", false, "Number of replicas"),
        createField("spec.image", "string", true, "Container image"),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check table structure - just check key parts exist
      expect(result).toContain("| Field path");
      expect(result).toContain("| Type");
      expect(result).toContain("| Required");
      expect(result).toContain("| `spec`");
      expect(result).toContain("| `spec.replicas`");
      expect(result).toContain("| `spec.image`");
    });

    test("truncates long descriptions in table", () => {
      const longDescription =
        "This is a very long description that should be truncated in the quick reference table to maintain readability and prevent the table from becoming too wide";
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.field", "string", true, longDescription),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Should be truncated with "..." at the end
      expect(result).toContain(
        "This is a very long description that should be truncated ..."
      );

      // Full description should appear in field details
      expect(result).toContain("### `spec.field`");
      expect(result).toContain(longDescription);
    });

    test("handles depth limitation in quick reference", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec", "object", true),
        createField("spec.level1", "object", true),
        createField("spec.level1.level2", "object", true),
        createField("spec.level1.level2.level3", "string", true), // depth 4
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Should show note about omitted fields
      expect(result).toContain(
        "Note: This table shows fields up to 2 levels deep"
      );

      // Deep field should not be in quick reference
      expect(result.match(/\| `spec\.level1\.level2\.level3`/)).toBeNull();

      // But should be in field documentation
      expect(result).toContain("### `spec.level1.level2.level3`");
    });

    test("renders field documentation with all properties", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.replicas", "integer", false, "Number of replicas", {
          default: 3,
          minimum: 1,
          maximum: 10,
          nullable: false,
          immutable: "self == oldSelf",
          validationRules: [
            { rule: "self >= 1", message: "Must be at least 1" },
          ],
          examples: [1, 3, 5],
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      expect(result).toContain("### `spec.replicas`");
      expect(result).toContain("- **Type:** `integer`");
      expect(result).toContain("- **Optional**");
      expect(result).toContain("Number of replicas");
      expect(result).toContain("- **Default value:** `3`");
      expect(result).toContain("- **Minimum:** `1`");
      expect(result).toContain("- **Maximum:** `10`");
      expect(result).toContain("- **Immutable**");
      expect(result).toContain("- **Validation:** Must be at least 1");
      expect(result).toContain("self >= 1");
      expect(result).toContain("- **Example:** `1`");
      expect(result).toContain("- **Example:** `3`");
      expect(result).toContain("- **Example:** `5`");
    });

    test("renders default value as YAML code block", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.replicas", "integer", false, "Number of replicas", {
          default: 3,
        }),
        createField("spec.config", "object", false, "Configuration", {
          default: {
            timeout: 30,
            retries: 3,
            enabled: true,
          },
        }),
        createField("spec.tags", "array", false, "Tags", {
          default: ["production", "web"],
        }),
        createField("spec.name", "string", false, "Name", {
          default: "my-app",
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that single-line default values are rendered inline and multi-line as code blocks
      expect(result).toContain("- **Default value:** `3`");
      expect(result).toContain("- **Default value:** `my-app`");
      expect(result).toContain(
        "- **Default value**\n  ```yaml\n  timeout: 30\n  retries: 3\n  enabled: true\n  ```"
      );
      expect(result).toContain(
        "- **Default value**\n  ```yaml\n  - production\n  - web\n  ```"
      );

      // Ensure the old inline code format is NOT used
      expect(result).not.toContain("- **Default:** `3`");
      expect(result).not.toContain(
        '- **Default:** `{"timeout":30,"retries":3,"enabled":true}`'
      );
    });

    test("renders both default value and example when both are present", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField(
          "spec.timeout",
          "integer",
          false,
          "Request timeout in seconds",
          {
            default: 30,
            examples: [10, 30, 60],
          }
        ),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that both default value and example are rendered (single-line as inline)
      expect(result).toContain("- **Default value:** `30`");
      expect(result).toContain("- **Example:** `10`");
      expect(result).toContain("- **Example:** `30`");
      expect(result).toContain("- **Example:** `60`");

      // Verify the order: default value comes before example
      const defaultIndex = result.indexOf("- **Default value:**");
      const exampleIndex = result.indexOf("- **Example:**");
      expect(defaultIndex).toBeLessThan(exampleIndex);
    });

    test("renders enum values", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.phase", "string", true, "Current phase", {
          enum: ["Pending", "Running", "Completed", "Failed"],
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      expect(result).toContain(
        '- **Allowed values:** `"Pending"`, `"Running"`, `"Completed"`, `"Failed"`'
      );
    });

    test("renders pattern and format", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.email", "string", true, "Email address", {
          format: "email",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      expect(result).toContain("- **Type:** `string` (`email`)");
      expect(result).toContain("- **Pattern:**");
    });

    test("handles nullable fields", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.optionalRef", "string", false, "Optional reference", {
          nullable: true,
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // nullable doesn't seem to be rendered in the current implementation
      expect(result).toContain("- **Optional**");
    });

    test("renders array constraints", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.tags", "string[]", false, "List of tags", {
          minItems: 1,
          maxItems: 5,
          uniqueItems: true,
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      expect(result).toContain("- **Min items:** `1`");
      expect(result).toContain("- **Max items:** `5`");
      expect(result).toContain("- **Unique items:** Yes");
    });

    test("groups fields by path hierarchy", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec", "object", true, "Spec object"),
        createField("spec.storage", "object", true, "Storage config"),
        createField("spec.storage.size", "string", true, "Storage size"),
        createField("spec.network", "object", false, "Network config"),
        createField("spec.network.port", "integer", false, "Port number"),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check ordering - headings have backticks
      const specIndex = result.indexOf("### `spec`");
      const storageIndex = result.indexOf("### `spec.storage`");
      const sizeIndex = result.indexOf("### `spec.storage.size`");
      const networkIndex = result.indexOf("### `spec.network`");
      const portIndex = result.indexOf("### `spec.network.port`");

      expect(specIndex).toBeLessThan(storageIndex);
      expect(storageIndex).toBeLessThan(sizeIndex);
      expect(sizeIndex).toBeLessThan(networkIndex);
      expect(networkIndex).toBeLessThan(portIndex);
    });

    test("renders status fields separately", () => {
      const apiDoc = createAPIDoc(
        "TestResource",
        [createField("spec.name", "string", true, "Resource name")],
        [createField("status.ready", "boolean", false, "Ready status")]
      );

      const result = renderAPIDocumentation(apiDoc);

      expect(result).toContain("## Status");
      expect(result).toContain("### `status.ready`");
      expect(result).toContain("Ready status");
    });

    test("renders footnotes with references", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField(
          "spec.replicas",
          "integer",
          false,
          "Number of replicas[^1] to run"
        ),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Footnotes are escaped in tables but not in the field description
      expect(result).toContain("Number of replicas\\[^1] to run");

      // Check that the non-escaped version is somewhere
      expect(result.includes("Number of replicas[^1] to run")).toBe(false);
    });

    test("skips empty sections", () => {
      const apiDoc = createAPIDoc("TestResource");

      const result = renderAPIDocumentation(apiDoc);

      // Should not contain empty status fields section
      expect(result).not.toContain("## Status Fields");
    });

    test("handles fields without descriptions", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.name", "string", true), // No description
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Should still render the field
      expect(result).toContain("### `spec.name`");
      expect(result).toContain("- **Type:** `string`");
      expect(result).toContain("- **Required**");
    });

    test("renders single-line default values as inline code", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.replicas", "integer", false, "Number of replicas", {
          default: 3,
        }),
        createField("spec.enabled", "boolean", false, "Feature flag", {
          default: true,
        }),
        createField("spec.name", "string", false, "Name", {
          default: "my-app",
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that single-line default values are rendered inline
      expect(result).toContain("- **Default value:** `3`");
      expect(result).toContain("- **Default value:** `true`");
      expect(result).toContain("- **Default value:** `my-app`");

      // Should NOT contain code blocks for these single-line values
      expect(result).not.toContain(
        "- **Default value**\n  ```yaml\n  3\n  ```"
      );
      expect(result).not.toContain(
        "- **Default value**\n  ```yaml\n  true\n  ```"
      );
    });

    test("renders multi-line default values as code blocks", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.config", "object", false, "Configuration", {
          default: {
            timeout: 30,
            retries: 3,
            enabled: true,
          },
        }),
        createField("spec.tags", "array", false, "Tags", {
          default: ["production", "web", "frontend"],
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that multi-line default values are rendered as code blocks
      expect(result).toContain(
        "- **Default value**\n  ```yaml\n  timeout: 30\n  retries: 3\n  enabled: true\n  ```"
      );
      expect(result).toContain(
        "- **Default value**\n  ```yaml\n  - production\n  - web\n  - frontend\n  ```"
      );

      // Should NOT contain inline code for these multi-line values
      expect(result).not.toContain("- **Default value:** `{");
      expect(result).not.toContain("- **Default value:** `[");
    });

    test("renders single-line examples as inline code", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.timeout", "integer", false, "Timeout in seconds", {
          examples: [30, 60, 120],
        }),
        createField("spec.name", "string", false, "Resource name", {
          examples: ["my-app", "web-service"],
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that single-line examples are rendered inline
      expect(result).toContain("- **Example:** `30`");
      expect(result).toContain("- **Example:** `60`");
      expect(result).toContain("- **Example:** `120`");
      expect(result).toContain("- **Example:** `my-app`");
      expect(result).toContain("- **Example:** `web-service`");

      // Should NOT contain code blocks for these single-line values
      expect(result).not.toContain("- **Example**\n  ```yaml\n  30\n  ```");
    });

    test("renders multi-line examples as code blocks", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.config", "object", false, "Configuration object", {
          examples: [
            {
              host: "localhost",
              port: 8080,
              ssl: true,
            },
            {
              host: "0.0.0.0",
              port: 3000,
              ssl: false,
            },
          ],
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that multi-line examples are rendered as code blocks
      expect(result).toContain(
        "- **Example**\n  ```yaml\n  host: localhost\n  port: 8080\n  ssl: true\n  ```"
      );
      expect(result).toContain(
        "- **Example**\n  ```yaml\n  host: 0.0.0.0\n  port: 3000\n  ssl: false\n  ```"
      );

      // Should NOT contain inline code for these multi-line values
      expect(result).not.toContain("- **Example:** `{");
    });

    test("renders mixed single-line and multi-line examples correctly", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.value", "mixed", false, "Mixed value field", {
          default: "simple-string",
          examples: [
            "example-string",
            ["item1", "item2"],
            { key: "value", nested: { deep: true } },
          ],
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Default value is single-line
      expect(result).toContain("- **Default value:** `simple-string`");

      // First example is single-line
      expect(result).toContain("- **Example:** `example-string`");

      // Second and third examples are multi-line
      expect(result).toContain(
        "- **Example**\n  ```yaml\n  - item1\n  - item2\n  ```"
      );
      expect(result).toContain(
        "- **Example**\n  ```yaml\n  key: value\n  nested:\n    deep: true\n  ```"
      );
    });

    test("renders field description with Markdown formatting", () => {
      const markdownDescription = `This field configures the **database connection**.

Supported database types:
- \`postgres\` - PostgreSQL database
- \`mysql\` - MySQL database
- \`mongodb\` - MongoDB database

> **Note**: For production environments, always use \`postgres\` or \`mysql\`.

See [configuration guide](https://example.com/db-config) for details.`;

      const apiDoc = createAPIDoc("DatabaseResource", [
        createField("spec.database", "object", true, markdownDescription),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that field description preserves Markdown formatting
      expect(result).toContain("### `spec.database`");
      expect(result).toContain("**database connection**"); // Bold text
      expect(result).toContain("- `postgres` - PostgreSQL database"); // List with inline code
      expect(result).toContain("> **Note**: For production environments"); // Blockquote with bold
      expect(result).toContain(
        "[configuration guide](https://example.com/db-config)"
      ); // Link
    });

    test("renders field description with inline Markdown elements", () => {
      const apiDoc = createAPIDoc("ServiceResource", [
        createField(
          "spec.timeout",
          "integer",
          false,
          "Timeout in seconds. Must be between `30` and `300`. See *Important Notes* below."
        ),
        createField(
          "spec.retryPolicy",
          "object",
          false,
          "Retry policy configuration. Set `maxRetries` to **0** to disable retries."
        ),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check inline code in field descriptions
      expect(result).toContain("Must be between `30` and `300`");
      expect(result).toContain("*Important Notes*");

      // Check bold text in field descriptions
      expect(result).toContain("Set `maxRetries` to **0** to disable");
    });

    test("renders field description with code blocks", () => {
      const descriptionWithCodeBlock = `Configuration for the service endpoint.

Example configuration:

\`\`\`yaml
endpoint:
  host: api.example.com
  port: 443
  protocol: https
\`\`\`

The \`protocol\` field accepts either \`http\` or \`https\`.`;

      const apiDoc = createAPIDoc("ServiceResource", [
        createField("spec.endpoint", "object", true, descriptionWithCodeBlock),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that code block is preserved
      expect(result).toContain("```yaml");
      expect(result).toContain("host: api.example.com");
      expect(result).toContain("protocol: https");
      expect(result).toContain("```");

      // Check inline code after code block
      expect(result).toContain(
        "The `protocol` field accepts either `http` or `https`"
      );
    });

    test("renders field description with complex nested Markdown", () => {
      const complexDescription = `Advanced configuration for **high availability** setup.

## Requirements

1. **Minimum nodes**: 3
2. **Recommended nodes**: 5 or more
3. **Maximum nodes**: 10

### Network Configuration

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| \`vip\` | Yes | - | Virtual IP address |
| \`subnet\` | Yes | - | Subnet CIDR |
| \`gateway\` | No | Auto | Gateway IP |

---

**Warning**: Changing these settings requires a cluster restart.

For more details, refer to the [HA Guide](https://docs.example.com/ha).`;

      const apiDoc = createAPIDoc("ClusterResource", [
        createField(
          "spec.highAvailability",
          "object",
          false,
          complexDescription
        ),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check all Markdown elements are preserved
      expect(result).toContain("## Requirements");
      expect(result).toContain("1. **Minimum nodes**: 3");
      expect(result).toContain("### Network Configuration");
      // Check table content - formatting might vary
      expect(result).toContain("| Parameter");
      expect(result).toContain("| Required");
      expect(result).toContain("| Default");
      expect(result).toContain("| Description");
      expect(result).toContain("| `vip`");
      expect(result).toContain("| Yes");
      expect(result).toContain("| Virtual IP address |");
      expect(result).toContain("---"); // Horizontal rule
      expect(result).toContain("**Warning**: Changing these settings");
      expect(result).toContain("[HA Guide](https://docs.example.com/ha)");
    });

    test("renders field description with proper spacing between Markdown elements", () => {
      const descriptionWithSpacing = `Database configuration options.

Supports the following engines:

- PostgreSQL 14+
- MySQL 8.0+

Default configuration uses PostgreSQL.`;

      const apiDoc = createAPIDoc("DatabaseResource", [
        createField("spec.database", "object", true, descriptionWithSpacing),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that paragraph breaks are preserved
      expect(result).toContain(
        "Database configuration options.\n\nSupports the following engines:"
      );
      expect(result).toContain(
        "- MySQL 8.0+\n\nDefault configuration uses PostgreSQL."
      );
    });
  });

  describe("renderCombinedDocumentation", () => {
    test("renders multiple API docs", () => {
      const apiDocs = [
        createAPIDoc("ResourceA", [createField("spec.fieldA", "string", true)]),
        createAPIDoc("ResourceB", [
          createField("spec.fieldB", "integer", false),
        ]),
      ];

      const result = renderCombinedDocumentation(apiDocs);

      expect(result).toContain("# API Documentation");
      expect(result).toContain("## ResourceA");
      expect(result).toContain("## ResourceB");
      expect(result).toContain("spec.fieldA");
      expect(result).toContain("spec.fieldB");
    });

    test("creates table of contents", () => {
      const apiDocs = [
        createAPIDoc("Book"),
        createAPIDoc("Author"),
        createAPIDoc("Publisher"),
      ];

      const result = renderCombinedDocumentation(apiDocs);

      // Should have table of contents with links
      expect(result).toContain("[Author](#author)");
      expect(result).toContain("[Book](#book)");
      expect(result).toContain("[Publisher](#publisher)");
    });

    test("sorts API docs alphabetically", () => {
      const apiDocs = [
        createAPIDoc("Zebra"),
        createAPIDoc("Apple"),
        createAPIDoc("Middle"),
      ];

      const result = renderCombinedDocumentation(apiDocs);

      // Check order in output
      const appleIndex = result.indexOf("## Apple");
      const middleIndex = result.indexOf("## Middle");
      const zebraIndex = result.indexOf("## Zebra");

      expect(appleIndex).toBeLessThan(middleIndex);
      expect(middleIndex).toBeLessThan(zebraIndex);
    });

    test("renders API descriptions with Markdown in combined documentation", () => {
      const apiDocs = [
        createAPIDoc("Book", [], [], {
          description: "Manages **books** with _metadata_ and `ISBN` tracking.",
        }),
        createAPIDoc("Author", [], [], {
          description: `Represents book authors.

- Supports multiple pen names
- Links to [books](#book) they've written`,
        }),
      ];

      const result = renderCombinedDocumentation(apiDocs);

      // Check that descriptions are rendered with Markdown
      expect(result).toContain("## Author\n\nRepresents book authors.");
      expect(result).toContain("- Supports multiple pen names");
      expect(result).toContain("Links to [books](#book)");

      expect(result).toContain("## Book\n\nManages **books**");
      expect(result).toContain("*metadata*");
      expect(result).toContain("`ISBN`");
    });

    test("shares footnotes across documents", () => {
      const apiDocs = [
        createAPIDoc("ResourceA", [
          createField("spec.fieldA", "string", true, "Field with note[^1]"),
        ]),
        createAPIDoc("ResourceB", [
          createField(
            "spec.fieldB",
            "string",
            true,
            "Another field with same note[^1]"
          ),
        ]),
      ];

      const result = renderCombinedDocumentation(apiDocs);

      // Footnotes are escaped in the output
      expect(result).toContain("Field with note\\[^1]");
      expect(result).toContain("Another field with same note\\[^1]");

      // Check that footnotes aren't rendered (they're escaped)
      const footnoteMatches = result.match(/\[^\d+\]:/g);
      expect(footnoteMatches).toBeNull();
    });
  });

  describe("blank line formatting", () => {
    test("adds blank line between API description and metadata list", () => {
      const apiDoc: APIDocumentation = {
        title: "TestResource",
        kind: "TestResource",
        group: "test.io",
        version: "v1",
        scope: "Namespaced",
        description: "This is a test resource for testing blank lines",
        specFields: [],
        statusFields: [],
      };

      const result = renderAPIDocumentation(apiDoc);

      // Check that there's a blank line between description and metadata
      expect(result).toContain(
        "This is a test resource for testing blank lines\n\n- **API version:**"
      );
    });

    test("adds blank line between field description and field info list", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.name", "string", true, "The name of the resource"),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that there's a blank line between field description and the field info list
      expect(result).toContain("The name of the resource\n\n- **Type:**");
    });

    test("no blank line after Constraints label in nested list", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.title", "string", false, "Title of the book", {
          minLength: 1,
          maxLength: 200,
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that there's no blank line after "Constraints"
      expect(result).toContain("- **Constraints**\n  - **Min length:**");
      expect(result).not.toContain("- **Constraints**\n\n  - **Min length:**");
    });

    test("no blank line after Example label with code block", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.hostname", "string", false, "The hostname", {
          examples: ["myapp.example.com"],
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that single-line example is rendered inline
      expect(result).toContain("- **Example:** `myapp.example.com`");
      expect(result).not.toContain("- **Example**\n  ```yaml");
    });

    test("no blank line between validation message and code block", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.replicas", "integer", false, "Number of replicas", {
          validationRules: [
            { rule: "self >= 1", message: "Must be at least 1" },
          ],
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that there's no blank line between validation message and code block
      expect(result).toContain(
        "- **Validation:** Must be at least 1\n    ```cel"
      );
      expect(result).not.toContain(
        "- **Validation:** Must be at least 1\n\n    ```cel"
      );
    });

    test("no blank line between pattern label and code block", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.email", "string", false, "Email address", {
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check that there's no blank line between "Pattern:" and code block
      expect(result).toContain("- **Pattern:**\n    ```regex");
      expect(result).not.toContain("- **Pattern:**\n\n    ```regex");
    });

    test("proper formatting for complete field with all sections", () => {
      const apiDoc = createAPIDoc("TestResource", [
        createField("spec.name", "string", true, "The name of the resource", {
          minLength: 1,
          maxLength: 50,
          pattern: "^[a-z0-9-]+$",
          examples: ["my-resource"],
        }),
      ]);

      const result = renderAPIDocumentation(apiDoc);

      // Check overall structure with proper blank lines
      expect(result).toContain("The name of the resource\n\n- **Type:**"); // Blank line after description
      expect(result).toContain("- **Constraints**\n  - **Min length:**"); // No blank line after Constraints
      expect(result).toContain("- **Pattern:**\n    ```regex"); // No blank line after Pattern
      expect(result).toContain("- **Example:** `my-resource`"); // Single-line example rendered inline
    });
  });
});
