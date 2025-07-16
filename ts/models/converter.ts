import type {
  CustomResourceDefinition,
  FieldInfo,
  OpenAPIV3Schema,
} from "./crd.js";
import type {
  APIDocumentation,
  DocumentModel,
  FieldDocumentation,
} from "./document.js";

// Exported function (High-level API)
export function convertCRDsToDocuments(
  crds: Array<CustomResourceDefinition>,
  sourceFiles: Array<string>
): DocumentModel {
  const apiDocs: Array<APIDocumentation> = [];

  for (const crd of crds) {
    const apiDoc = convertCRDToAPIDoc(crd);
    apiDocs.push(apiDoc);
  }

  return {
    apiDocs,
    generatedAt: new Date(),
    sourceFiles,
  };
}

// Main conversion functions (High-level abstraction)
function convertCRDToAPIDoc(crd: CustomResourceDefinition): APIDocumentation {
  const storageVersion = crd.spec.versions.find((v) => v.storage);
  if (!storageVersion) {
    throw new Error(`No storage version found for CRD ${crd.metadata.name}`);
  }

  const schema = storageVersion.schema.openAPIV3Schema;
  const specSchema = schema.properties?.["spec"];
  const statusSchema = schema.properties?.["status"];

  const specFields: Array<FieldDocumentation> = [];
  const statusFields: Array<FieldDocumentation> = [];

  if (specSchema) {
    const specFieldInfos = extractFieldsFromSchema(specSchema, "spec");
    specFields.push(...specFieldInfos.map((f) => convertFieldInfoToDoc(f)));
  }

  if (statusSchema) {
    const statusFieldInfos = extractFieldsFromSchema(statusSchema, "status");
    statusFields.push(...statusFieldInfos.map((f) => convertFieldInfoToDoc(f)));
  }

  const apiDoc: APIDocumentation = {
    title: crd.spec.names.kind,
    kind: crd.spec.names.kind,
    group: crd.spec.group,
    version: storageVersion.name,
    scope: crd.spec.scope,
    specFields,
    statusFields,
    metadata: {
      ...(crd.spec.names.shortNames && {
        shortNames: crd.spec.names.shortNames,
      }),
      plural: crd.spec.names.plural,
      singular: crd.spec.names.singular,
    },
  };

  if (schema.description) {
    apiDoc.description = schema.description;
  }

  return apiDoc;
}

function convertFieldInfoToDoc(fieldInfo: FieldInfo): FieldDocumentation {
  const doc: FieldDocumentation = {
    fieldPath: fieldInfo.path,
    type: fieldInfo.type,
    required: fieldInfo.required,
    validationRules: fieldInfo.validation || [],
    examples: fieldInfo.example ? [fieldInfo.example] : [],
  };

  // Handle immutability
  handleImmutability(doc, fieldInfo);

  // Copy optional properties
  copyOptionalProperties(doc, fieldInfo);

  return doc;
}

function handleImmutability(
  doc: FieldDocumentation,
  fieldInfo: FieldInfo
): void {
  const immutableRule = fieldInfo.validation?.find((rule) => {
    const normalized = rule.rule.trim();
    return normalized === "self == oldSelf" || normalized === "oldSelf == self";
  });

  if (immutableRule) {
    doc.immutable = immutableRule.rule;
    // Filter out the immutability rule from regular validation rules
    doc.validationRules = doc.validationRules.filter(
      (rule) => rule !== immutableRule
    );
  }
}

function copyOptionalProperties(
  doc: FieldDocumentation,
  fieldInfo: FieldInfo
): void {
  // Simple properties that can be copied directly if they exist
  if (fieldInfo.description) {
    doc.description = fieldInfo.description;
  }
  if (fieldInfo.enum) {
    doc.enum = fieldInfo.enum;
  }
  if (fieldInfo.format) {
    doc.format = fieldInfo.format;
  }
  if (fieldInfo.pattern) {
    doc.pattern = fieldInfo.pattern;
  }
  if (fieldInfo.minimum !== undefined) {
    doc.minimum = fieldInfo.minimum;
  }
  if (fieldInfo.maximum !== undefined) {
    doc.maximum = fieldInfo.maximum;
  }
  if (fieldInfo.minLength !== undefined) {
    doc.minLength = fieldInfo.minLength;
  }
  if (fieldInfo.maxLength !== undefined) {
    doc.maxLength = fieldInfo.maxLength;
  }
  if (fieldInfo.minItems !== undefined) {
    doc.minItems = fieldInfo.minItems;
  }
  if (fieldInfo.maxItems !== undefined) {
    doc.maxItems = fieldInfo.maxItems;
  }
  if (fieldInfo.uniqueItems !== undefined) {
    doc.uniqueItems = fieldInfo.uniqueItems;
  }
  if (fieldInfo.default !== undefined) {
    doc.default = fieldInfo.default;
  }
  if (fieldInfo.nullable !== undefined) {
    doc.nullable = fieldInfo.nullable;
  }
}

// Schema extraction functions (Mid-level abstraction)
function extractFieldsFromSchema(
  schema: OpenAPIV3Schema,
  basePath = "",
  _isRequired = false
): Array<FieldInfo> {
  const fields: Array<FieldInfo> = [];

  if (schema.properties) {
    const requiredFields = schema.required || [];

    for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
      const fieldPath = basePath ? `${basePath}.${fieldName}` : fieldName;
      const isFieldRequired = requiredFields.includes(fieldName);

      // Add the field itself
      const fieldInfo = createFieldInfo(
        fieldPath,
        fieldSchema,
        isFieldRequired
      );
      fields.push(fieldInfo);

      // Extract nested fields
      const nestedFields = extractNestedFields(
        fieldSchema,
        fieldPath,
        isFieldRequired
      );
      fields.push(...nestedFields);
    }
  }

  return fields;
}

function extractNestedFields(
  fieldSchema: OpenAPIV3Schema,
  fieldPath: string,
  isFieldRequired: boolean
): Array<FieldInfo> {
  const nestedFields: Array<FieldInfo> = [];

  // Recursively extract nested object fields
  if (fieldSchema.type === "object" && fieldSchema.properties) {
    nestedFields.push(
      ...extractFieldsFromSchema(fieldSchema, fieldPath, isFieldRequired)
    );
  }

  // Handle array items
  if (
    fieldSchema.type === "array" &&
    fieldSchema.items &&
    fieldSchema.items.type === "object" &&
    fieldSchema.items.properties
  ) {
    nestedFields.push(
      ...extractFieldsFromSchema(fieldSchema.items, fieldPath, isFieldRequired)
    );
  }

  return nestedFields;
}

// Field creation helper functions (Low-level abstraction)
function createFieldInfo(
  fieldPath: string,
  fieldSchema: OpenAPIV3Schema,
  isFieldRequired: boolean
): FieldInfo {
  const fieldInfo: FieldInfo = {
    path: fieldPath,
    type: getFieldType(fieldSchema),
    required: isFieldRequired,
  };

  assignFieldProperties(fieldInfo, fieldSchema);
  return fieldInfo;
}

function assignFieldProperties(
  fieldInfo: FieldInfo,
  fieldSchema: OpenAPIV3Schema
): void {
  if (fieldSchema.description) {
    fieldInfo.description = fieldSchema.description;
  }
  if (fieldSchema["x-kubernetes-validations"]) {
    fieldInfo.validation = fieldSchema["x-kubernetes-validations"];
  }
  if (fieldSchema.example !== undefined) {
    fieldInfo.example = fieldSchema.example;
  }
  if (fieldSchema.enum) {
    fieldInfo.enum = fieldSchema.enum;
  }
  if (fieldSchema.format) {
    fieldInfo.format = fieldSchema.format;
  }
  if (fieldSchema.pattern) {
    fieldInfo.pattern = fieldSchema.pattern;
  }
  if (fieldSchema.minimum !== undefined) {
    fieldInfo.minimum = fieldSchema.minimum;
  }
  if (fieldSchema.maximum !== undefined) {
    fieldInfo.maximum = fieldSchema.maximum;
  }
  if (fieldSchema.minLength !== undefined) {
    fieldInfo.minLength = fieldSchema.minLength;
  }
  if (fieldSchema.maxLength !== undefined) {
    fieldInfo.maxLength = fieldSchema.maxLength;
  }
  if (fieldSchema.minItems !== undefined) {
    fieldInfo.minItems = fieldSchema.minItems;
  }
  if (fieldSchema.maxItems !== undefined) {
    fieldInfo.maxItems = fieldSchema.maxItems;
  }
  if (fieldSchema.uniqueItems !== undefined) {
    fieldInfo.uniqueItems = fieldSchema.uniqueItems;
  }
  if (fieldSchema.default !== undefined) {
    fieldInfo.default = fieldSchema.default;
  }
  if (fieldSchema.nullable !== undefined) {
    fieldInfo.nullable = fieldSchema.nullable;
  }
}

function getFieldType(schema: OpenAPIV3Schema): string {
  if (schema.type) {
    if (schema.type === "array" && schema.items) {
      const itemType = getFieldType(schema.items);
      return `${itemType}[]`;
    }
    return schema.type;
  }

  if (schema.oneOf) {
    return schema.oneOf.map((s) => getFieldType(s)).join(" | ");
  }

  if (schema.anyOf) {
    return schema.anyOf.map((s) => getFieldType(s)).join(" | ");
  }

  if (schema.allOf) {
    return schema.allOf.map((s) => getFieldType(s)).join(" & ");
  }

  return "any";
}
