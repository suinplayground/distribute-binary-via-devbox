export interface DocumentSection {
  title: string;
  content: string;
  level: number;
  id?: string;
}

export interface FieldDocumentation {
  fieldPath: string;
  type: string;
  description?: string;
  required: boolean;
  validationRules: Array<ValidationRuleDoc>;
  examples: Array<unknown>;
  enum?: Array<unknown>;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  default?: unknown;
  nullable?: boolean;
  immutable?: string;
}

export interface ValidationRuleDoc {
  rule: string;
  message?: string;
}

export interface APIDocumentation {
  title: string;
  kind: string;
  group: string;
  version: string;
  scope: "Namespaced" | "Cluster";
  description?: string;
  specFields: Array<FieldDocumentation>;
  statusFields: Array<FieldDocumentation>;
  metadata?: {
    shortNames?: Array<string>;
    plural: string;
    singular: string;
  };
}

export interface DocumentModel {
  apiDocs: Array<APIDocumentation>;
  generatedAt: Date;
  sourceFiles: Array<string>;
}
