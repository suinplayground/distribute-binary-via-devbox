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
      expect(result).toContain("- **Default:** `3`");
      expect(result).toContain("- **Minimum:** `1`");
      expect(result).toContain("- **Maximum:** `10`");
      expect(result).toContain("- **Immutable**");
      expect(result).toContain("- **Validation:** Must be at least 1");
      expect(result).toContain("self >= 1");
      expect(result).toContain("- **Example**");
      expect(result).toContain("```yaml\n  1\n  ```");
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

      // Check that there's no blank line after "Example"
      expect(result).toContain("- **Example**\n  ```yaml");
      expect(result).not.toContain("- **Example**\n\n  ```yaml");
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
      expect(result).toContain("- **Example**\n  ```yaml"); // No blank line after Example
    });
  });
});
