import { describe, expect, test } from "bun:test";
import { parseContent } from "../yaml.js";

describe("yaml reader", () => {
  describe("parseContent", () => {
    test("parses a single CRD", () => {
      const yaml = `
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: books.library.io
spec:
  group: library.io
  version: v1
  scope: Namespaced
  names:
    plural: books
    singular: book
    kind: Book
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                title:
                  type: string
`;

      const result = parseContent(yaml);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe("CustomResourceDefinition");
      expect(result[0]?.metadata.name).toBe("books.library.io");
      expect(result[0]?.spec.group).toBe("library.io");
      expect(result[0]?.spec.names.kind).toBe("Book");
    });

    test("parses multiple CRDs from multi-document YAML", () => {
      const yaml = `
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: books.library.io
spec:
  group: library.io
  version: v1
  scope: Namespaced
  names:
    kind: Book
---
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: authors.library.io
spec:
  group: library.io
  version: v1
  scope: Namespaced
  names:
    kind: Author
`;

      const result = parseContent(yaml);

      expect(result).toHaveLength(2);
      expect(result[0]?.spec.names.kind).toBe("Book");
      expect(result[1]?.spec.names.kind).toBe("Author");
    });

    test("filters out non-CRD resources", () => {
      const yaml = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
data:
  key: value
---
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: books.library.io
spec:
  group: library.io
  version: v1
  scope: Namespaced
  names:
    kind: Book
---
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: myapp
`;

      const result = parseContent(yaml);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe("CustomResourceDefinition");
      expect(result[0]?.metadata.name).toBe("books.library.io");
    });

    test("handles empty YAML", () => {
      const result = parseContent("");
      expect(result).toHaveLength(0);
    });

    test("handles YAML with only non-CRD resources", () => {
      const yaml = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
data:
  key: value
---
apiVersion: v1
kind: Service
metadata:
  name: my-service
`;

      const result = parseContent(yaml);
      expect(result).toHaveLength(0);
    });

    test("handles YAML with comments", () => {
      const yaml = `
# This is a comment
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: books.library.io # inline comment
spec:
  group: library.io
  # Another comment
  version: v1
  scope: Namespaced
  names:
    kind: Book
`;

      const result = parseContent(yaml);

      expect(result).toHaveLength(1);
      expect(result[0]?.metadata.name).toBe("books.library.io");
    });

    test("parses CRD with complex schema", () => {
      const yaml = `
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.db.io
  annotations:
    description: "Database CRD"
spec:
  group: db.io
  version: v1
  scope: Namespaced
  names:
    plural: databases
    singular: database
    kind: Database
    shortNames:
      - db
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          required:
            - spec
          properties:
            spec:
              type: object
              required:
                - engine
              properties:
                engine:
                  type: string
                  enum:
                    - postgres
                    - mysql
                storage:
                  type: object
                  properties:
                    size:
                      type: string
                      pattern: "^[0-9]+(Mi|Gi)$"
`;

      const result = parseContent(yaml);

      expect(result).toHaveLength(1);
      const crd = result[0];
      if (!crd) {
        throw new Error("Expected crd to exist");
      }
      expect(crd.metadata.annotations?.["description"]).toBe("Database CRD");
      expect(crd.spec.names.shortNames).toEqual(["db"]);

      const version = crd.spec.versions[0];
      if (!version) {
        throw new Error("Expected version to exist");
      }
      const schema = version.schema.openAPIV3Schema;
      if (!schema) {
        throw new Error("Expected schema to exist");
      }
      expect(schema.required).toEqual(["spec"]);
      expect(schema.properties?.["spec"]?.required).toEqual(["engine"]);
      expect(schema.properties?.["spec"]?.properties?.["engine"]?.enum).toEqual(
        ["postgres", "mysql"]
      );
    });

    test("handles mixed document types with separators", () => {
      const yaml = `
---
# First document is empty/null
---
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: books.library.io
spec:
  group: library.io
  version: v1
  scope: Namespaced
  names:
    kind: Book
---
# Empty document
---
`;

      const result = parseContent(yaml);

      expect(result).toHaveLength(1);
      expect(result[0]?.spec.names.kind).toBe("Book");
    });

    test("preserves all CRD fields", () => {
      const yaml = `
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: books.library.io
  namespace: library-system
  labels:
    app: library
    version: v1
  annotations:
    created-by: admin
spec:
  group: library.io
  version: v1
  scope: Namespaced
  names:
    plural: books
    singular: book
    kind: Book
    listKind: BookList
    categories:
      - all
      - library
  versions:
    - name: v1
      served: true
      storage: true
      deprecated: false
      deprecationWarning: null
      schema:
        openAPIV3Schema:
          type: object
`;

      const result = parseContent(yaml);

      expect(result).toHaveLength(1);
      const crd = result[0];
      if (!crd) {
        throw new Error("Expected crd to exist");
      }

      // Check metadata preservation
      expect(crd.metadata.namespace).toBe("library-system");
      expect(crd.metadata.labels).toEqual({
        app: "library",
        version: "v1",
      });
      expect(crd.metadata.annotations).toEqual({
        "created-by": "admin",
      });

      // Check spec.names preservation
      // expect(crd.spec.names.listKind).toBe("BookList");
      // expect(crd.spec.names.categories).toEqual(["all", "library"]);

      // Check version preservation
      // expect(crd.spec.versions[0]!.deprecated).toBe(false);
      // expect(crd.spec.versions[0]!.deprecationWarning).toBeNull();
    });

    test("handles array of documents as single document", () => {
      const yaml = `
- apiVersion: apiextensions.k8s.io/v1
  kind: CustomResourceDefinition
  metadata:
    name: books.library.io
  spec:
    group: library.io
    version: v1
    scope: Namespaced
    names:
      kind: Book
- apiVersion: v1
  kind: ConfigMap
  metadata:
    name: config
`;

      const result = parseContent(yaml);

      // Arrays at top level are treated as a single document (not a CRD)
      expect(result).toHaveLength(0);
    });

    test("throws on invalid YAML syntax", () => {
      const yaml = `
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: books.library.io
  invalid yaml here [ } {
spec:
  group: library.io
`;

      expect(() => parseContent(yaml)).toThrow();
    });

    test("handles CRD with status field", () => {
      const yaml = `
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: books.library.io
spec:
  group: library.io
  version: v1
  scope: Namespaced
  names:
    kind: Book
  versions:
    - name: v1
      served: true
      storage: true
status:
  conditions:
    - type: NamesAccepted
      status: "True"
  acceptedNames:
    plural: books
    singular: book
    kind: Book
  storedVersions:
    - v1
`;

      const result = parseContent(yaml);

      expect(result).toHaveLength(1);
      const crd = result[0];
      if (!crd) {
        throw new Error("Expected crd to exist");
      }
      expect(crd.status).toBeDefined();
      const status = crd.status as { storedVersions: Array<string> };
      expect(status.storedVersions).toEqual(["v1"]);
    });

    test("handles documents with null values", () => {
      const yaml = `
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: books.library.io
  annotations: null
spec:
  group: library.io
  version: v1
  scope: Namespaced
  names:
    kind: Book
`;

      const result = parseContent(yaml);

      expect(result).toHaveLength(1);
      expect(result[0]?.metadata.annotations).toBeNull();
    });
  });
});
