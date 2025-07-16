import { describe, expect, test } from "bun:test";
import { convertCRDsToDocuments } from "../converter.js";
import type { CustomResourceDefinition, OpenAPIV3Schema } from "../crd.js";

describe("converter", () => {
  // Helper to create a minimal CRD
  const createCRD = (
    kind: string,
    group: string,
    version: string,
    specSchema?: OpenAPIV3Schema,
    statusSchema?: OpenAPIV3Schema
  ): CustomResourceDefinition => ({
    apiVersion: "apiextensions.k8s.io/v1",
    kind: "CustomResourceDefinition",
    metadata: {
      name: `${kind.toLowerCase()}s.${group}`,
    },
    spec: {
      group,
      version,
      scope: "Namespaced",
      names: {
        plural: `${kind.toLowerCase()}s`,
        singular: kind.toLowerCase(),
        kind,
      },
      versions: [
        {
          name: version,
          served: true,
          storage: true,
          schema: {
            openAPIV3Schema: {
              type: "object",
              properties: {
                ...(specSchema && { spec: specSchema }),
                ...(statusSchema && { status: statusSchema }),
              },
            },
          },
        },
      ],
    },
  });

  describe("convertCRDsToDocuments", () => {
    test("converts a simple CRD", () => {
      const crd = createCRD("TestResource", "test.io", "v1", {
        type: "object",
        description: "Test spec",
        properties: {
          name: {
            type: "string",
            description: "Name of the resource",
          },
        },
        required: ["name"],
      });

      const result = convertCRDsToDocuments([crd], ["test.yaml"]);

      expect(result.apiDocs).toHaveLength(1);
      expect(result.sourceFiles).toEqual(["test.yaml"]);
      expect(result.generatedAt).toBeInstanceOf(Date);

      expect(result.apiDocs).toHaveLength(1);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("Expected apiDoc to exist");
      }
      expect(apiDoc.title).toBe("TestResource");
      expect(apiDoc.kind).toBe("TestResource");
      expect(apiDoc.group).toBe("test.io");
      expect(apiDoc.version).toBe("v1");
      expect(apiDoc.scope).toBe("Namespaced");
      expect(apiDoc.metadata?.plural).toBe("testresources");
      expect(apiDoc.metadata?.singular).toBe("testresource");
    });

    test("extracts spec fields correctly", () => {
      const crd = createCRD("TestResource", "test.io", "v1", {
        type: "object",
        properties: {
          replicas: {
            type: "integer",
            description: "Number of replicas",
            minimum: 1,
            maximum: 10,
            default: 3,
          },
          image: {
            type: "string",
            description: "Container image",
            pattern: "^[a-z]+:[a-z0-9]+$",
          },
        },
        required: ["image"],
      });

      const result = convertCRDsToDocuments([crd], []);
      expect(result.apiDocs).toHaveLength(1);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("Expected apiDoc to exist");
      }

      expect(apiDoc.specFields).toHaveLength(2);

      const replicasField = apiDoc.specFields.find(
        (f) => f.fieldPath === "spec.replicas"
      );
      expect(replicasField).toEqual({
        fieldPath: "spec.replicas",
        type: "integer",
        description: "Number of replicas",
        required: false,
        validationRules: [],
        examples: [],
        minimum: 1,
        maximum: 10,
        default: 3,
      });

      const imageField = apiDoc.specFields.find(
        (f) => f.fieldPath === "spec.image"
      );
      expect(imageField).toEqual({
        fieldPath: "spec.image",
        type: "string",
        description: "Container image",
        required: true,
        validationRules: [],
        examples: [],
        pattern: "^[a-z]+:[a-z0-9]+$",
      });
    });

    test("handles nested object fields", () => {
      const crd = createCRD("TestResource", "test.io", "v1", {
        type: "object",
        properties: {
          storage: {
            type: "object",
            description: "Storage configuration",
            properties: {
              size: {
                type: "string",
                description: "Storage size",
              },
              class: {
                type: "string",
                description: "Storage class",
              },
            },
            required: ["size"],
          },
        },
      });

      const result = convertCRDsToDocuments([crd], []);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("apiDoc should be defined");
      }

      const fields = apiDoc.specFields;
      expect(fields).toHaveLength(3);
      expect(fields.map((f) => f.fieldPath)).toEqual([
        "spec.storage",
        "spec.storage.size",
        "spec.storage.class",
      ]);

      const sizeField = fields.find((f) => f.fieldPath === "spec.storage.size");
      expect(sizeField?.required).toBe(true);
      expect(sizeField?.type).toBe("string");
    });

    test("handles array fields", () => {
      const crd = createCRD("TestResource", "test.io", "v1", {
        type: "object",
        properties: {
          tags: {
            type: "array",
            description: "List of tags",
            items: {
              type: "string",
            },
            minItems: 1,
            maxItems: 5,
            uniqueItems: true,
          },
          ports: {
            type: "array",
            items: {
              type: "object",
              properties: {
                port: { type: "integer" },
                protocol: { type: "string" },
              },
            },
          },
        },
      });

      const result = convertCRDsToDocuments([crd], []);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("apiDoc should be defined");
      }
      const fields = apiDoc.specFields;

      const tagsField = fields.find((f) => f.fieldPath === "spec.tags");
      expect(tagsField).toMatchObject({
        type: "string[]",
        minItems: 1,
        maxItems: 5,
        uniqueItems: true,
      });

      // Should also extract nested array item fields
      expect(fields.some((f) => f.fieldPath === "spec.ports.port")).toBe(true);
      expect(fields.some((f) => f.fieldPath === "spec.ports.protocol")).toBe(
        true
      );
    });

    test("handles enum fields", () => {
      const crd = createCRD("TestResource", "test.io", "v1", {
        type: "object",
        properties: {
          phase: {
            type: "string",
            description: "Current phase",
            enum: ["Pending", "Running", "Completed", "Failed"],
          },
        },
      });

      const result = convertCRDsToDocuments([crd], []);
      expect(result.apiDocs).toHaveLength(1);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("Expected apiDoc to exist");
      }
      expect(apiDoc.specFields).toHaveLength(1);
      const phaseField = apiDoc.specFields[0];
      if (!phaseField) {
        throw new Error("Expected phaseField to exist");
      }

      expect(phaseField.enum).toEqual([
        "Pending",
        "Running",
        "Completed",
        "Failed",
      ]);
    });

    test("handles x-kubernetes-validations", () => {
      const crd = createCRD("TestResource", "test.io", "v1", {
        type: "object",
        properties: {
          immutableField: {
            type: "string",
            "x-kubernetes-validations": [
              {
                rule: "self == oldSelf",
                message: "Field is immutable",
              },
            ],
          },
        },
      });

      const result = convertCRDsToDocuments([crd], []);
      expect(result.apiDocs).toHaveLength(1);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("Expected apiDoc to exist");
      }
      expect(apiDoc.specFields).toHaveLength(1);
      const field = apiDoc.specFields[0];
      if (!field) {
        throw new Error("Expected field to exist");
      }

      expect(field.validationRules).toHaveLength(0); // Immutable rule is extracted separately
      expect(field.immutable).toBe("self == oldSelf");
    });

    test("handles status fields", () => {
      const crd = createCRD("TestResource", "test.io", "v1", undefined, {
        type: "object",
        properties: {
          ready: {
            type: "boolean",
            description: "Ready status",
          },
          conditions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                status: { type: "string" },
              },
            },
          },
        },
      });

      const result = convertCRDsToDocuments([crd], []);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("apiDoc should be defined");
      }
      const statusFields = apiDoc.statusFields;

      expect(statusFields).toHaveLength(4);
      expect(statusFields.map((f) => f.fieldPath)).toEqual([
        "status.ready",
        "status.conditions",
        "status.conditions.type",
        "status.conditions.status",
      ]);
    });

    test("handles multiple CRDs", () => {
      const crd1 = createCRD("Resource1", "test.io", "v1");
      const crd2 = createCRD("Resource2", "test.io", "v2");

      const result = convertCRDsToDocuments(
        [crd1, crd2],
        ["file1.yaml", "file2.yaml"]
      );

      expect(result.apiDocs).toHaveLength(2);
      expect(result.apiDocs[0]?.kind).toBe("Resource1");
      expect(result.apiDocs[1]?.kind).toBe("Resource2");
    });

    test("handles fields with examples", () => {
      const crd = createCRD("TestResource", "test.io", "v1", {
        type: "object",
        properties: {
          config: {
            type: "string",
            example: "key: value",
          },
        },
      });

      const result = convertCRDsToDocuments([crd], []);
      expect(result.apiDocs).toHaveLength(1);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("Expected apiDoc to exist");
      }
      expect(apiDoc.specFields).toHaveLength(1);
      const field = apiDoc.specFields[0];
      if (!field) {
        throw new Error("Expected field to exist");
      }

      expect(field.examples).toEqual(["key: value"]);
    });

    test("handles nullable fields", () => {
      const crd = createCRD("TestResource", "test.io", "v1", {
        type: "object",
        properties: {
          optionalRef: {
            type: "string",
            nullable: true,
          },
        },
      });

      const result = convertCRDsToDocuments([crd], []);
      expect(result.apiDocs).toHaveLength(1);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("Expected apiDoc to exist");
      }
      expect(apiDoc.specFields).toHaveLength(1);
      const field = apiDoc.specFields[0];
      if (!field) {
        throw new Error("Expected field to exist");
      }

      expect(field.nullable).toBe(true);
    });

    test("handles format fields", () => {
      const crd = createCRD("TestResource", "test.io", "v1", {
        type: "object",
        properties: {
          timestamp: {
            type: "string",
            format: "date-time",
          },
          email: {
            type: "string",
            format: "email",
          },
        },
      });

      const result = convertCRDsToDocuments([crd], []);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("apiDoc should be defined");
      }
      const fields = apiDoc.specFields;

      expect(fields[0]?.format).toBe("date-time");
      expect(fields[1]?.format).toBe("email");
    });

    test("handles oneOf/anyOf/allOf type unions", () => {
      const crd = createCRD("TestResource", "test.io", "v1", {
        type: "object",
        properties: {
          unionField: {
            oneOf: [{ type: "string" }, { type: "integer" }],
          },
          anyField: {
            anyOf: [{ type: "boolean" }, { type: "null" }],
          },
        },
      });

      const result = convertCRDsToDocuments([crd], []);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("apiDoc should be defined");
      }
      const fields = apiDoc.specFields;

      expect(fields[0]?.type).toBe("string | integer");
      expect(fields[1]?.type).toBe("boolean | null");
    });

    test("extracts short names", () => {
      const crd = createCRD("TestResource", "test.io", "v1");
      crd.spec.names.shortNames = ["tr", "test"];

      const result = convertCRDsToDocuments([crd], []);
      expect(result.apiDocs).toHaveLength(1);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("Expected apiDoc to exist");
      }

      expect(apiDoc.metadata?.shortNames).toEqual(["tr", "test"]);
    });

    test("handles CRD without storage version", () => {
      const crd = createCRD("TestResource", "test.io", "v1");
      const version = crd.spec.versions[0];
      if (!version) {
        throw new Error("Expected version to exist");
      }
      version.storage = false;

      expect(() => {
        convertCRDsToDocuments([crd], []);
      }).toThrow("No storage version found for CRD");
    });

    test("handles validation rules other than immutability", () => {
      const crd = createCRD("TestResource", "test.io", "v1", {
        type: "object",
        properties: {
          replicas: {
            type: "integer",
            "x-kubernetes-validations": [
              {
                rule: "self >= 1",
                message: "Must be at least 1",
              },
              {
                rule: "self == oldSelf",
                message: "Cannot be changed",
              },
              {
                rule: "self <= 100",
                message: "Must be at most 100",
              },
            ],
          },
        },
      });

      const result = convertCRDsToDocuments([crd], []);
      expect(result.apiDocs).toHaveLength(1);
      const apiDoc = result.apiDocs[0];
      if (!apiDoc) {
        throw new Error("Expected apiDoc to exist");
      }
      expect(apiDoc.specFields).toHaveLength(1);
      const field = apiDoc.specFields[0];
      if (!field) {
        throw new Error("Expected field to exist");
      }

      // Immutable rule extracted separately
      expect(field.immutable).toBe("self == oldSelf");

      // Other rules remain
      expect(field.validationRules).toHaveLength(2);
      expect(field.validationRules).toContainEqual({
        rule: "self >= 1",
        message: "Must be at least 1",
      });
      expect(field.validationRules).toContainEqual({
        rule: "self <= 100",
        message: "Must be at most 100",
      });
    });
  });
});
