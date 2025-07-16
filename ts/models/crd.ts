export interface CRDMetadata {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface CRDSpec {
  group: string;
  version: string;
  scope: "Namespaced" | "Cluster";
  names: {
    plural: string;
    singular: string;
    kind: string;
    shortNames?: Array<string>;
  };
  versions: Array<CRDVersion>;
}

export interface CRDVersion {
  name: string;
  served: boolean;
  storage: boolean;
  schema: {
    openAPIV3Schema: OpenAPIV3Schema;
  };
}

export interface OpenAPIV3Schema {
  type?: string;
  description?: string;
  properties?: Record<string, OpenAPIV3Schema>;
  required?: Array<string>;
  items?: OpenAPIV3Schema;
  additionalProperties?: boolean | OpenAPIV3Schema;
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
  example?: unknown; // OpenAPI v3.0 only supports singular 'example', not 'examples'
  nullable?: boolean;
  oneOf?: Array<OpenAPIV3Schema>;
  anyOf?: Array<OpenAPIV3Schema>;
  allOf?: Array<OpenAPIV3Schema>;
  not?: OpenAPIV3Schema;
  "x-kubernetes-preserve-unknown-fields"?: boolean;
  "x-kubernetes-int-or-string"?: boolean;
  "x-kubernetes-embedded-resource"?: boolean;
  "x-kubernetes-validations"?: Array<ValidationRule>;
}

export interface ValidationRule {
  rule: string;
  message?: string;
}

export interface CustomResourceDefinition {
  apiVersion: string;
  kind: string;
  metadata: CRDMetadata;
  spec: CRDSpec;
  status?: unknown;
}

export interface FieldInfo {
  path: string;
  type: string;
  description?: string;
  required: boolean;
  validation?: Array<ValidationRule>;
  example?: unknown;
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
}
