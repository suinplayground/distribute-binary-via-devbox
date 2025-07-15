import type { APIDocumentation, FieldDocumentation } from "./document.js";

export interface QuickReferenceField {
  path: string;
  type: string;
  required: boolean;
  description: string;
}

export interface QuickReferenceTable {
  fields: Array<QuickReferenceField>;
  hasOmittedFieldsDueToDepth: boolean;
}

export interface QuickReferenceOptions {
  includeStatusFields?: boolean;
  onlyRequired?: boolean;
  maxDepth?: number; // e.g., 2 would include spec.field but not spec.field.subfield
}

/**
 * Generates a quick reference table from an API documentation object
 */
export function getQuickReferenceTable(
  apiDoc: APIDocumentation,
  options: QuickReferenceOptions = {}
): QuickReferenceTable {
  const {
    includeStatusFields = true,
    onlyRequired = false,
    maxDepth = 2,
  } = options;

  const fields: Array<QuickReferenceField> = [];
  let hasOmittedFieldsDueToDepth = false;

  // Helper function to process fields
  const processFields = (fieldDocs: Array<FieldDocumentation>) => {
    for (const field of fieldDocs) {
      // Skip if only showing required fields and this isn't required
      if (onlyRequired && !field.required) {
        continue;
      }

      // Skip if field depth exceeds maxDepth
      const depth = field.fieldPath.split(".").length;
      if (maxDepth && depth > maxDepth) {
        hasOmittedFieldsDueToDepth = true;
        continue;
      }

      fields.push({
        path: field.fieldPath,
        type: field.type,
        required: field.required,
        description: field.description || "",
      });
    }
  };

  // Process spec fields
  processFields(apiDoc.specFields);

  // Process status fields if requested
  if (includeStatusFields) {
    processFields(apiDoc.statusFields);
  }

  return { fields, hasOmittedFieldsDueToDepth };
}

/**
 * Generates a condensed quick reference for just the required fields
 */
export function getRequiredFieldsTable(
  apiDoc: APIDocumentation
): QuickReferenceTable {
  return getQuickReferenceTable(apiDoc, {
    onlyRequired: true,
    includeStatusFields: false,
  });
}

/**
 * Generates a top-level overview table (depth = 1)
 */
export function getTopLevelFieldsTable(
  apiDoc: APIDocumentation
): QuickReferenceTable {
  return getQuickReferenceTable(apiDoc, {
    maxDepth: 1,
  });
}
