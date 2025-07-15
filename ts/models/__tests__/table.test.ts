import { describe, expect, test } from "bun:test";
import type { APIDocumentation, FieldDocumentation } from "../document.js";
import {
  getQuickReferenceTable,
  getRequiredFieldsTable,
  getTopLevelFieldsTable,
} from "../table.js";

describe("table", () => {
  // Helper function to create a field
  const createField = (
    path: string,
    type: string,
    required: boolean,
    description = ""
  ): FieldDocumentation => ({
    fieldPath: path,
    type,
    required,
    description,
    validationRules: [],
    examples: [],
  });

  // Helper function to create API documentation
  const createAPIDoc = (
    specFields: Array<FieldDocumentation>,
    statusFields: Array<FieldDocumentation> = []
  ): APIDocumentation => ({
    title: "TestAPI",
    kind: "TestKind",
    group: "test.example.com",
    version: "v1",
    scope: "Namespaced",
    specFields,
    statusFields,
  });

  describe("getQuickReferenceTable", () => {
    test("returns all fields with default options", () => {
      const apiDoc = createAPIDoc([
        createField("spec.name", "string", true, "Name of the resource"),
        createField("spec.replicas", "integer", false, "Number of replicas"),
      ]);

      const result = getQuickReferenceTable(apiDoc);

      expect(result.fields).toHaveLength(2);
      expect(result.fields[0]).toEqual({
        path: "spec.name",
        type: "string",
        required: true,
        description: "Name of the resource",
      });
      expect(result.fields[1]).toEqual({
        path: "spec.replicas",
        type: "integer",
        required: false,
        description: "Number of replicas",
      });
      expect(result.hasOmittedFieldsDueToDepth).toBe(false);
    });

    test("filters fields by depth", () => {
      const apiDoc = createAPIDoc([
        createField("spec", "object", true),
        createField("spec.storage", "object", true),
        createField("spec.storage.size", "string", true), // depth 3
        createField("spec.storage.class", "string", false), // depth 3
      ]);

      const result = getQuickReferenceTable(apiDoc, { maxDepth: 2 });

      expect(result.fields).toHaveLength(2);
      expect(result.fields.map((f) => f.path)).toEqual([
        "spec",
        "spec.storage",
      ]);
      expect(result.hasOmittedFieldsDueToDepth).toBe(true);
    });

    test("filters only required fields when onlyRequired is true", () => {
      const apiDoc = createAPIDoc([
        createField("spec.name", "string", true),
        createField("spec.description", "string", false),
        createField("spec.replicas", "integer", true),
      ]);

      const result = getQuickReferenceTable(apiDoc, { onlyRequired: true });

      expect(result.fields).toHaveLength(2);
      expect(result.fields.every((f) => f.required)).toBe(true);
      expect(result.hasOmittedFieldsDueToDepth).toBe(false);
    });

    test("excludes status fields when includeStatusFields is false", () => {
      const apiDoc = createAPIDoc(
        [createField("spec.name", "string", true)],
        [createField("status.ready", "boolean", false)]
      );

      const result = getQuickReferenceTable(apiDoc, {
        includeStatusFields: false,
      });

      expect(result.fields).toHaveLength(1);
      expect(result.fields[0]?.path).toBe("spec.name");
    });

    test("includes status fields by default", () => {
      const apiDoc = createAPIDoc(
        [createField("spec.name", "string", true)],
        [createField("status.ready", "boolean", false)]
      );

      const result = getQuickReferenceTable(apiDoc);

      expect(result.fields).toHaveLength(2);
      expect(result.fields.map((f) => f.path)).toEqual([
        "spec.name",
        "status.ready",
      ]);
    });

    test("handles empty description", () => {
      const apiDoc = createAPIDoc([
        createField("spec.name", "string", true), // empty description
      ]);

      const result = getQuickReferenceTable(apiDoc);

      expect(result.fields[0]?.description).toBe("");
    });

    test("combines multiple filter options", () => {
      const apiDoc = createAPIDoc([
        createField("spec", "object", true),
        createField("spec.required", "string", true),
        createField("spec.optional", "string", false),
        createField("spec.nested.deep", "string", true), // depth 3
      ]);

      const result = getQuickReferenceTable(apiDoc, {
        maxDepth: 2,
        onlyRequired: true,
      });

      expect(result.fields).toHaveLength(2);
      expect(result.fields.map((f) => f.path)).toEqual([
        "spec",
        "spec.required",
      ]);
      expect(result.hasOmittedFieldsDueToDepth).toBe(true);
    });

    test("handles fields at exact maxDepth", () => {
      const apiDoc = createAPIDoc([
        createField("spec", "object", true), // depth 1
        createField("spec.level2", "object", true), // depth 2
        createField("spec.level2.level3", "string", true), // depth 3
      ]);

      const result = getQuickReferenceTable(apiDoc, { maxDepth: 2 });

      expect(result.fields).toHaveLength(2);
      expect(result.fields.map((f) => f.path)).toEqual(["spec", "spec.level2"]);
      expect(result.hasOmittedFieldsDueToDepth).toBe(true);
    });

    test("no omitted fields when all fields are within depth", () => {
      const apiDoc = createAPIDoc([
        createField("spec", "object", true),
        createField("spec.name", "string", true),
      ]);

      const result = getQuickReferenceTable(apiDoc, { maxDepth: 2 });

      expect(result.hasOmittedFieldsDueToDepth).toBe(false);
    });
  });

  describe("getRequiredFieldsTable", () => {
    test("returns only required fields from spec", () => {
      const apiDoc = createAPIDoc(
        [
          createField("spec.required1", "string", true),
          createField("spec.optional", "string", false),
          createField("spec.required2", "integer", true),
        ],
        [
          createField("status.statusRequired", "boolean", true),
          createField("status.statusOptional", "string", false),
        ]
      );

      const result = getRequiredFieldsTable(apiDoc);

      expect(result.fields).toHaveLength(2);
      expect(result.fields.every((f) => f.required)).toBe(true);
      expect(result.fields.every((f) => f.path.startsWith("spec."))).toBe(true);
    });

    test("returns empty array when no required fields", () => {
      const apiDoc = createAPIDoc([
        createField("spec.optional1", "string", false),
        createField("spec.optional2", "integer", false),
      ]);

      const result = getRequiredFieldsTable(apiDoc);

      expect(result.fields).toHaveLength(0);
    });
  });

  describe("getTopLevelFieldsTable", () => {
    test("returns only top-level fields", () => {
      const apiDoc = createAPIDoc([
        createField("spec", "object", true),
        createField("spec.name", "string", true),
        createField("spec.nested.field", "string", false),
        createField("status", "object", false),
        createField("status.ready", "boolean", false),
      ]);

      const result = getTopLevelFieldsTable(apiDoc);

      expect(result.fields).toHaveLength(2);
      expect(result.fields.map((f) => f.path)).toEqual(["spec", "status"]);
    });

    test("handles no top-level fields", () => {
      const apiDoc = createAPIDoc([
        createField("spec.field1", "string", true),
        createField("spec.field2", "string", false),
      ]);

      const result = getTopLevelFieldsTable(apiDoc);

      expect(result.fields).toHaveLength(0);
    });
  });
});
